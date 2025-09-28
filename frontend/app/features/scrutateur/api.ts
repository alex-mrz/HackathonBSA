import { Transaction } from "@mysten/sui/transactions";

const mod = (pkg: string) => `${pkg}::scrutateur`;

const arg = {
  object: (tx: Transaction, id: string) => tx.object(id),
  vectorU8: (tx: Transaction, bytes: Uint8Array | number[]) =>
    tx.pure.vector("u8", Array.from(bytes)),
};

export const SCRUTATEUR_TYPE = (pkg: string) => `${mod(pkg)}::ScrutateurStore`;

export function buildCreateScrutateurTx(pkg: string) {
  const tx = new Transaction();
  tx.moveCall({ target: `${mod(pkg)}::create_scrutateur`, arguments: [] });
  return tx;
}

export function buildReceiveBlobTx(
  pkg: string,
  storeId: string,
  blob: Uint8Array | number[],
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(pkg)}::receive_blob_entry`,
    arguments: [arg.object(tx, storeId), arg.vectorU8(tx, blob)],
  });
  return tx;
}

export function buildMarkProcessedTx(
  pkg: string,
  storeId: string,
  index: number,
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(pkg)}::mark_processed_entry`,
    arguments: [arg.object(tx, storeId), tx.pure.u64(index)],
  });
  return tx;
}

export function buildDeleteScrutateurTx(pkg: string, storeId: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${mod(pkg)}::delete_all_entry`,
    arguments: [arg.object(tx, storeId)],
  });
  return tx;
}
