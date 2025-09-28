import { Transaction } from "@mysten/sui/transactions";

const mod = (pkg: string) => `${pkg}::croupier`;

const arg = {
  object: (tx: Transaction, id: string) => tx.object(id),
  address: (tx: Transaction, a: string) => tx.pure.address(a),
  vectorU8: (tx: Transaction, bytes: Uint8Array | number[]) =>
    tx.pure.vector("u8", Array.from(bytes)),
  vectorU64: (tx: Transaction, values: number[]) =>
    tx.pure.vector(
      "u64",
      values.map((v) => BigInt(v)),
    ),
};

export const CROUPIER_TYPE = (pkg: string) => `${mod(pkg)}::CroupierStore`;

export function buildCreateCroupierStoreTx(pkg: string) {
  const tx = new Transaction();
  tx.moveCall({ target: `${mod(pkg)}::create_store`, arguments: [] });
  return tx;
}

export function buildSubmitTokenTx(
  pkg: string,
  storeId: string,
  verifiedId: string,
  tokenBytes: Uint8Array | number[],
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(pkg)}::submit_token`,
    arguments: [
      arg.object(tx, storeId),
      arg.object(tx, verifiedId),
      arg.vectorU8(tx, tokenBytes),
    ],
  });
  return tx;
}

export function buildShuffleTx(
  pkg: string,
  storeId: string,
  permutation: number[],
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(pkg)}::shuffle_tokens`,
    arguments: [arg.object(tx, storeId), arg.vectorU64(tx, permutation)],
  });
  return tx;
}

export function buildForwardAllTx(
  pkg: string,
  storeId: string,
  scrutateurAddr: string,
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(pkg)}::forward_all_to_scrutateur`,
    arguments: [arg.object(tx, storeId), arg.address(tx, scrutateurAddr)],
  });
  return tx;
}

export function buildDeleteAllCroupierTx(pkg: string, storeId: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(pkg)}::delete_all`,
    arguments: [arg.object(tx, storeId)],
  });
  return tx;
}
