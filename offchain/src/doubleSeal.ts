import 'dotenv/config';
import { blake2b } from 'blakejs';

// Sui SDK (v0.54.x)
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import * as txMod from '@mysten/sui.js/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui.js/cryptography';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

// Works across SDK minor diffs: use Transaction if present, otherwise TransactionBlock.
const Transaction: any =
  (txMod as any).Transaction ?? (txMod as any).TransactionBlock;

type Hex = `0x${string}`;

export type DoubleSealConfig = {
  rpcUrl?: string;
  privateKey: string; // suiprivkey:..., base64, or 0x-hex
  A_SUBMIT: string;
  B_REGISTER?: string;
  B_SUBMIT_PLAIN: string;
  OUTER_APPROVE: string;
  INNER_APPROVE: string;
};

export class DoubleSealClient {
  readonly sui: SuiClient;
  readonly kp: Ed25519Keypair;
  readonly cfg: DoubleSealConfig;

  constructor(cfg: DoubleSealConfig) {
    this.cfg = cfg;
    this.sui = new SuiClient({ url: cfg.rpcUrl ?? getFullnodeUrl('testnet') });

    // PRIVATE_KEY can be suiprivkey:..., base64, or 0xhex
    const { secretKey } = decodeSuiPrivateKey(cfg.privateKey);
    this.kp = Ed25519Keypair.fromSecretKey(secretKey);
  }

  // ---------- utils ----------
  private toBytesUtf8(s: string): Uint8Array {
    return new TextEncoder().encode(s);
  }
  private hashPlaintext(plaintext: Uint8Array): Uint8Array {
    return blake2b(plaintext, undefined, 32);
  }

  // ---------- (1) DOUBLE ENCRYPT ----------
  /**
   * Stub that returns passthrough bytes so your tx flow runs today.
   * Replace the body with Seal SDK calls when you wire Seal:
   *   inner = await seal.encrypt({ packageId: INNER_PKG, id: innerId, data })
   *   outer = await seal.encrypt({ packageId: OUTER_PKG, id: outerId, data: inner.encryptedObject })
   */
  async encryptDouble(
    plaintextUtf8: string,
    innerId: Uint8Array,
    outerId: Uint8Array,
  ): Promise<{ innerCt: Uint8Array; outerCt: Uint8Array; plainHash: Uint8Array }> {
    const data = this.toBytesUtf8(plaintextUtf8);
    const innerCt = data; // TODO: replace with Seal inner ciphertext
    const outerCt = data; // TODO: replace with Seal outer ciphertext
    return { innerCt, outerCt, plainHash: this.hashPlaintext(data) };
  }

  // ---------- (2) SUBMIT ON-CHAIN (A + optional B.register) ----------
  async submitToChain(params: {
    outerId: Uint8Array;
    outerCt: Uint8Array;
    innerId: Uint8Array;
    plainHash: Uint8Array;
    recipient: Hex;
    inboxId?: Hex;
  }) {
    const tx = new Transaction();

    // A.submit(id_bytes, outer_ct, inner_id, plain_hash, recipient)
    tx.moveCall({
      target: this.cfg.A_SUBMIT,
      arguments: [
        tx.pure.vector('u8', params.outerId),
        tx.pure.vector('u8', params.outerCt),
        tx.pure.vector('u8', params.innerId),
        tx.pure.vector('u8', params.plainHash),
        tx.pure.address(params.recipient),
      ],
    });

    if (this.cfg.B_REGISTER && params.inboxId) {
      // B.register(&mut inbox, inner_id, plain_hash)
      tx.moveCall({
        target: this.cfg.B_REGISTER,
        arguments: [
          tx.object(params.inboxId),
          tx.pure.vector('u8', params.innerId),
          tx.pure.vector('u8', params.plainHash),
        ],
      });
    }

    return this.sui.signAndExecuteTransactionBlock({
      signer: this.kp,
      transactionBlock: tx,
      options: { showEffects: true },
    });
  }

  // ---------- (3) PEEL OUTER OFF-CHAIN ----------
  /**
   * Build a TransactionKind that calls OUTER_APPROVE so Seal key servers can dry-run it.
   * Replace the return with: innerCt = await seal.decrypt({ data: outerCt, derivedKey })
   */
  async peelOuterOffChain(
    recordObjectId: Hex,
    outerId: Uint8Array,
    outerCt: Uint8Array,
  ): Promise<Uint8Array> {
    const tx = new Transaction();
    tx.moveCall({
      target: this.cfg.OUTER_APPROVE,
      arguments: [
        tx.pure.vector('u8', outerId),
        tx.object(recordObjectId),
        tx.pure.address(this.kp.getPublicKey().toSuiAddress()),
      ],
    });
    // Seal wants only the TransactionKind bytes:
    const _txBytes = await tx.build({ client: this.sui, onlyTransactionKind: true });

    // TODO: const derived = await seal.deriveKey({ txBytes: _txBytes });
    // TODO: return await seal.decrypt({ data: outerCt, derivedKey: derived });
    return outerCt; // stub
  }

  // ---------- (4) DECRYPT INNER OFF-CHAIN ----------
  async decryptInnerOffChain(
    envelopeOrInboxId: Hex,
    innerId: Uint8Array,
    innerCt: Uint8Array,
  ): Promise<Uint8Array> {
    const tx = new Transaction();
    tx.moveCall({
      target: this.cfg.INNER_APPROVE,
      arguments: [
        tx.pure.vector('u8', innerId),
        tx.object(envelopeOrInboxId),
        tx.pure.address(this.kp.getPublicKey().toSuiAddress()),
      ],
    });
    const _txBytes = await tx.build({ client: this.sui, onlyTransactionKind: true });

    // TODO: const derived = await seal.deriveKey({ txBytes: _txBytes });
    // TODO: return await seal.decrypt({ data: innerCt, derivedKey: derived });
    return innerCt; // stub
  }

  // ---------- (5) FINALIZE ON-CHAIN IN B ----------
  async finalizeInB(inboxId: Hex, innerId: Uint8Array, plaintext: Uint8Array) {
    const tx = new Transaction();
    tx.moveCall({
      target: this.cfg.B_SUBMIT_PLAIN,
      arguments: [
        tx.object(inboxId),
        tx.pure.vector('u8', innerId),
        tx.pure.vector('u8', plaintext),
      ],
    });
    return this.sui.signAndExecuteTransactionBlock({
      signer: this.kp,
      transactionBlock: tx,
      options: { showEffects: true },
    });
  }
}