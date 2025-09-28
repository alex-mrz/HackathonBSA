// offchain/src/bridge.ts
// Three functions you asked for:
//  1) doubleEncryptAndStoreToSender: take (sender, token) -> double encrypt (Seal) -> store on-chain for sender
//  2) peelOuterForSender: take (recordId, outerId) -> remove outer layer (off-chain) and return inner ciphertext
//  3) decryptInnerForSender: take (recordId, innerId, innerCt) -> remove last layer (off-chain) and return plaintext
//
// No .env. You pass all parameters explicitly.

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import * as txMod from "@mysten/sui/transactions";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import * as SealNS from "@mysten/seal";
import { blake2b } from "blakejs";

const Transaction: any = (txMod as any).Transaction ?? (txMod as any).TransactionBlock;
type Hex = `0x${string}`;

const utf8 = (s: string) => new TextEncoder().encode(s);
const hash32 = (b: Uint8Array) => blake2b(b, undefined, 32);

function makeSeal(sui: SuiClient, keyServerIds: Hex[]) {
  const ctor: any = (SealNS as any).SealClient || (SealNS as any).default || (SealNS as any).Client;
  if (!ctor) {
    throw new Error("@mysten/seal is installed, but no SealClient/Client/default export was found");
  }
  // Pass both shapes so it works across SDK versions
  return new ctor({
    suiClient: sui,
    serverConfigs: keyServerIds.map((id) => ({ objectId: id, weight: 1 })),
    serverObjectIds: keyServerIds,
    verifyKeyServers: true,
  });
}

// ---- TYPES ----
export type CommonCfg = {
  rpcUrl?: string;                  // default testnet
  privateKey: string;               // suiprivkey:..., base64, or 0xHEX (burner is fine)
  keyServers: Hex[];                // Seal key-server object IDs
  pkgA: Hex;                        // packageId where cipher_box lives
};

export type SubmitResult = {
  digest: string;
  recordId?: string;                // try to extract; otherwise query owned objects
  innerId: Uint8Array;
  outerId: Uint8Array;
  plainHash: Uint8Array;
};

// ---- 1) DOUBLE ENCRYPT + STORE FOR SENDER (on-chain) ----
export async function doubleEncryptAndStoreToSender(cfg: CommonCfg & {
  sender: Hex;                      // who should OWN the created record (you can pass the same as the tx signer or someone else)
  tokenUtf8: string;                // the "token" string to encrypt
  innerLabel?: string;              // optional label; defaults are fine
  outerLabel?: string;
  threshold?: number;               // Seal threshold (default 1)
}): Promise<SubmitResult> {
  const sui = new SuiClient({ url: cfg.rpcUrl ?? getFullnodeUrl("testnet") });
  const { secretKey } = decodeSuiPrivateKey(cfg.privateKey);
  const kp = Ed25519Keypair.fromSecretKey(secretKey);

  const seal = makeSeal(sui, cfg.keyServers);

  // Build payload + labels
  const plaintext = utf8(cfg.tokenUtf8);
  const innerId = utf8(cfg.innerLabel ?? `inner:${Date.now()}`);
  const outerId = utf8(cfg.outerLabel ?? `outer:${Date.now()}`);
  const plainHash = hash32(plaintext);
  const t = cfg.threshold ?? 1;

  // Seal: inner then outer
  const inner = await seal.encrypt({ packageId: cfg.pkgA, id: innerId, data: plaintext, threshold: t });
  const outer = await seal.encrypt({ packageId: cfg.pkgA, id: outerId, data: inner.encryptedObject, threshold: t });
  const outerCt = outer.encryptedObject;

  // On-chain submit -> create CipherRecord owned by `sender`
  const tx = new Transaction();
  tx.moveCall({
    target: `${cfg.pkgA}::cipher_box::submit`,
    arguments: [
      tx.pure.vector("u8", outerId),
      tx.pure.vector("u8", outerCt),
      tx.pure.vector("u8", innerId),
      tx.pure.vector("u8", plainHash),
      tx.pure.address(cfg.sender),
    ],
  });

  let res: any;
  try {
    // Newer @mysten/sui API
    res = await (sui as any).signAndExecuteTransaction({
      signer: kp,
      transaction: tx,
      options: { showEffects: true, showEvents: true },
    });
  } catch (_) {
    // Older @mysten/sui.js API
    res = await (sui as any).signAndExecuteTransactionBlock({
      signer: kp,
      transactionBlock: tx,
      options: { showEffects: true, showEvents: true },
    });
  }

  let recordId: string | undefined;
  // Try to infer the new object id from events (typed-safe) or created effects
  const eventsArr = (res.events as any[] | undefined) ?? [];
  const ev: any | undefined = eventsArr.find((e: any) =>
    typeof e?.parsedJson === 'object' && typeof e.parsedJson?.objectId === 'string'
  );
  if (ev) {
    recordId = ev.parsedJson.objectId as string;
  }
  if (!recordId) {
    const createdArr = (res.effects?.created as any[] | undefined) ?? [];
    const firstCreated = createdArr[0];
    recordId = firstCreated?.reference?.objectId as string | undefined;
  }

  return { digest: res.digest, recordId, innerId, outerId, plainHash };
}

// ---- 2) REMOVE OUTER LAYER (off-chain) ----
export async function peelOuterForSender(cfg: CommonCfg & {
  recordId: Hex;                    // the CipherRecord object id (owned by the sender)
  outerIdBytes: Uint8Array;         // same label used during encrypt (you can keep from step 1 result)
}): Promise<Uint8Array> {
  const sui = new SuiClient({ url: cfg.rpcUrl ?? getFullnodeUrl("testnet") });
  const { secretKey } = decodeSuiPrivateKey(cfg.privateKey);
  const kp = Ed25519Keypair.fromSecretKey(secretKey);
  const who = kp.getPublicKey().toSuiAddress();

  const seal = makeSeal(sui, cfg.keyServers);

  // Build a policy dry-run that *would* call seal_approve_outer(outer_id, &record, who)
  const tx = new Transaction();
  tx.moveCall({
    target: `${cfg.pkgA}::cipher_box::seal_approve_outer`,
    arguments: [
      tx.pure.vector("u8", cfg.outerIdBytes),
      tx.object(cfg.recordId),         // &CipherRecord
      tx.pure.address(who),
    ],
  });
  const txBytes = await tx.build({ client: sui, onlyTransactionKind: true });

  // Ask key servers for derived key, then decrypt outer -> innerCt
  const derived = await seal.deriveKey({ txBytes });

  // Fetch the record to read outer_ct bytes
  const obj = await sui.getObject({ id: cfg.recordId, options: { showContent: true }});
  const fields = (obj.data?.content as any).fields;
  const outerCtBase64: string = fields.outer_ct;
  const outerCt = Uint8Array.from(Buffer.from(outerCtBase64, "base64"));

  const innerCt = await seal.decrypt({ data: outerCt, derivedKey: derived }) as Uint8Array;
  return innerCt; // return to caller; if you want it "sent back on-chain", you can store it in another object.
}

// ---- 3) REMOVE INNER LAYER (off-chain) ----
export async function decryptInnerForSender(cfg: CommonCfg & {
  recordId: Hex;                    // same record (or another policy object your inner policy reads)
  innerIdBytes: Uint8Array;         // same label used during encrypt
  innerCt: Uint8Array;              // result from peelOuterForSender
}): Promise<Uint8Array> {
  const sui = new SuiClient({ url: cfg.rpcUrl ?? getFullnodeUrl("testnet") });
  const { secretKey } = decodeSuiPrivateKey(cfg.privateKey);
  const kp = Ed25519Keypair.fromSecretKey(secretKey);
  const who = kp.getPublicKey().toSuiAddress();

  const seal = makeSeal(sui, cfg.keyServers);

  // Policy dry-run for inner
  const tx = new Transaction();
  tx.moveCall({
    target: `${cfg.pkgA}::cipher_box::seal_approve_inner`,
    arguments: [
      tx.pure.vector("u8", cfg.innerIdBytes),
      tx.object(cfg.recordId),
      tx.pure.address(who),
    ],
  });
  const txBytes = await tx.build({ client: sui, onlyTransactionKind: true });

  const derived = await seal.deriveKey({ txBytes });
  const plaintext = await seal.decrypt({ data: cfg.innerCt, derivedKey: derived }) as Uint8Array;
  return plaintext; // bytes of your original token string
}