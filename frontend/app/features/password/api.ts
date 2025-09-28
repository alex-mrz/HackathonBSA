import { Transaction } from "@mysten/sui/transactions";

const arg = {
  object: (tx: Transaction, id: string) => tx.object(id),
  vecU8: (tx: Transaction, b: Uint8Array | number[]) => tx.pure.vector("u8", b),
};

const PWDB_TYPE = (pkg: string) => `${pkg}::password_db::PasswordDB`;
const PWDB_MOD = (pkg: string) => `${pkg}::password_db`;

export function buildCreatePasswordDbTx(pkg: string) {
  const tx = new Transaction();
  tx.moveCall({ target: `${PWDB_MOD(pkg)}::create_db`, arguments: [] });
  return tx;
}

export function buildAddPasswordHashTx(
  pkg: string,
  dbId: string,
  hash: Uint8Array | number[],
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PWDB_MOD(pkg)}::add_password_hash`,
    arguments: [arg.object(tx, dbId), arg.vecU8(tx, hash)],
  });
  return tx;
}

export const passwordDbTypeOf = PWDB_TYPE;
