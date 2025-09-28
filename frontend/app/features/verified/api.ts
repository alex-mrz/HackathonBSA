import { Transaction } from "@mysten/sui/transactions";

const arg = {
  object: (tx: Transaction, id: string) => tx.object(id),
  address: (tx: Transaction, a: string) => tx.pure.address(a),
};

const VERIFIED_TYPE = (pkg: string) =>
  `${pkg}::verified_addresses::VerifiedAddrs`;
const VERIFIED_MOD = (pkg: string) => `${pkg}::verified_addresses`;

export function buildCreateVerifiedTx(pkg: string) {
  const tx = new Transaction();
  tx.moveCall({ target: `${VERIFIED_MOD(pkg)}::create_admin`, arguments: [] });
  return tx;
}

export function buildAddAddressTx(
  pkg: string,
  verifiedId: string,
  addr: string,
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${VERIFIED_MOD(pkg)}::add_address`,
    arguments: [arg.object(tx, verifiedId), arg.address(tx, addr)],
  });
  return tx;
}

export function buildDeleteAllVerifiedTx(pkg: string, verifiedId: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${VERIFIED_MOD(pkg)}::delete_all`,
    arguments: [arg.object(tx, verifiedId)],
  });
  return tx;
}

export const verifiedTypeOf = VERIFIED_TYPE;
