import { Transaction } from "@mysten/sui/transactions";

const arg = {
  object: (tx: Transaction, id: string) => tx.object(id),
  address: (tx: Transaction, a: string) => tx.pure.address(a),
  vecU8: (tx: Transaction, b: Uint8Array | number[]) => tx.pure.vector("u8", b),
};

const AUTH_MOD = (pkg: string) => `${pkg}::auth`;

export function buildAuthenticateAndRegisterTx(
  pkg: string,
  passwordDbId: string,
  verifiedId: string,
  userAddr: string,
  passwordHash: Uint8Array | number[],
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${AUTH_MOD(pkg)}::authenticate_and_register`,
    arguments: [
      arg.object(tx, passwordDbId),
      arg.object(tx, verifiedId),
      arg.address(tx, userAddr),
      arg.vecU8(tx, passwordHash),
    ],
  });
  return tx;
}
