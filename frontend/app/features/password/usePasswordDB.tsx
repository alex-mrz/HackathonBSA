import {
  useSuiClient,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useCallback } from "react";
import { useNetworkVariable } from "../../networkConfig";
import {
  buildCreatePasswordDbTx,
  buildAddPasswordHashTx,
  passwordDbTypeOf,
} from "./api";

export function usePasswordDB() {
  const pkg = useNetworkVariable("votePackageId");
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const ensurePasswordDbId = useCallback(async () => {
    if (!account?.address) throw new Error("Wallet non connecté");
    const st = passwordDbTypeOf(pkg);
    const owned = await client.getOwnedObjects({
      owner: account.address,
      filter: { StructType: st },
    });
    if (owned.data.length > 0) return owned.data[0].data!.objectId;

    const tx = buildCreatePasswordDbTx(pkg);
    const res = await signAndExecute({ transaction: tx });
    await client.waitForTransaction({ digest: res.digest });
    const again = await client.getOwnedObjects({
      owner: account.address,
      filter: { StructType: st },
    });
    if (!again.data.length) throw new Error("Création PasswordDB échouée");
    return again.data[0].data!.objectId;
  }, [account?.address, client, pkg, signAndExecute]);

  const addHash = useCallback(
    async (hash: Uint8Array | number[]) => {
      const id = await ensurePasswordDbId();
      const tx = buildAddPasswordHashTx(pkg, id, hash);
      const res = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: res.digest });
      return { digest: res.digest, passwordDbId: id };
    },
    [ensurePasswordDbId, client, pkg, signAndExecute],
  );

  return { ensurePasswordDbId, addHash };
}
