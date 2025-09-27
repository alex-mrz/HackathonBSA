// Minimal, no .env, no extra libs.
// Prompts in terminal, builds a Move call to your targets.
// Works on @mysten/sui.js v0.54.x.

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import * as txMod from "@mysten/sui.js/transactions";
import { decodeSuiPrivateKey } from "@mysten/sui.js/cryptography";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { blake2b } from "blakejs";

// Handle both Transaction (>=0.54) and TransactionBlock (older)
const Transaction: any =
  (txMod as any).Transaction ?? (txMod as any).TransactionBlock;

type Hex = `0x${string}`;
const utf8 = (s: string) => new TextEncoder().encode(s);

async function ask(q: string, def?: string) {
  const rl = createInterface({ input, output });
  const ans = await rl.question(def ? `${q} [${def}]: ` : `${q}: `);
  rl.close();
  return (ans || def || "").trim();
}

async function main() {
  // --- who & where ---
  const rpc = await ask("Sui RPC URL", getFullnodeUrl("testnet"));
  const priv = await ask("Private key (suiprivkey:..., base64, or 0xHEX)");
  const { secretKey } = decodeSuiPrivateKey(priv);
  const kp = Ed25519Keypair.fromSecretKey(secretKey);
  const me = kp.getPublicKey().toSuiAddress();

  // --- what to call (A + optional B.register) ---
  const A_SUBMIT = await ask(
    "Target for A.submit (0x...::module::submit)"
  );
  const wantB = (await ask("Also call B.register in same tx? (y/n)", "n"))
    .toLowerCase() === "y";
  let B_REGISTER = "";
  let INBOX_ID = "" as Hex;
  if (wantB) {
    B_REGISTER = await ask("Target for B.register (0x...::module::register)");
    INBOX_ID = (await ask("B Inbox object ID (0x...)", "")) as Hex;
  }

  const B_AGENT = (await ask(
    "Recipient address allowed by your policy (0x...)",
    me
  )) as Hex;

  // --- payload (ids + data) ---
  const innerIdStr = await ask("INNER id (string)", "inner-1");
  const outerIdStr = await ask("OUTER id (string)", "outer-1");
  const plainStr = await ask("Plaintext (string of numbers)", "1234567890");

  // "Fake encryption" so you can hit chain today:
  const innerId = utf8(innerIdStr);
  const outerId = utf8(outerIdStr);
  const data = utf8(plainStr);
  const innerCt = data;           // replace with real Seal inner_ct later
  const outerCt = data;           // replace with real Seal outer_ct later
  const plainHash = blake2b(data, undefined, 32); // 32-byte hash

  // --- build & send transaction ---
  const client = new SuiClient({ url: rpc });
  const tx = new Transaction();

  // A.submit(id_bytes, outer_ct, inner_id, plain_hash, recipient)
  tx.moveCall({
    target: A_SUBMIT,
    arguments: [
      tx.pure.vector("u8", outerId),
      tx.pure.vector("u8", outerCt),
      tx.pure.vector("u8", innerId),
      tx.pure.vector("u8", plainHash),
      tx.pure.address(B_AGENT),
    ],
  });

  if (wantB && B_REGISTER && INBOX_ID) {
    // B.register(&mut inbox, inner_id, plain_hash)
    tx.moveCall({
      target: B_REGISTER,
      arguments: [
        tx.object(INBOX_ID),
        tx.pure.vector("u8", innerId),
        tx.pure.vector("u8", plainHash),
      ],
    });
  }

  const res = await client.signAndExecuteTransactionBlock({
    signer: kp,
    transactionBlock: tx,
    options: { showEffects: true, showEvents: true },
  });

  console.log("\n✅ Sent transaction");
  console.log("  Digest :", res.digest);
  console.log("  Status :", res.effects?.status);
  console.log("  Sender :", me);
}

main().catch((e) => {
  console.error("\n❌ Error:");
  console.error(e);
  process.exit(1);
});