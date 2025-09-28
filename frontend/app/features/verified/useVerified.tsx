import {
  useSuiClient,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useCallback } from "react";
import { useNetworkVariable } from "../../networkConfig";
import {
  buildCreateVerifiedTx,
  buildAddAddressTx,
  buildDeleteAllVerifiedTx,
  verifiedTypeOf,
} from "./api";

export function useVerified() {
  const pkg = useNetworkVariable("votePackageId");
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const ensureVerifiedId = useCallback(async () => {
    if (!account?.address) throw new Error("Wallet non connecté");
    const st = verifiedTypeOf(pkg);
    const owned = await client.getOwnedObjects({
      owner: account.address,
      filter: { StructType: st },
    });
    if (owned.data.length > 0) return owned.data[0].data!.objectId;

    const tx = buildCreateVerifiedTx(pkg);
    const res = await signAndExecute({ transaction: tx });
    await client.waitForTransaction({ digest: res.digest });
    const again = await client.getOwnedObjects({
      owner: account.address,
      filter: { StructType: st },
    });
    if (!again.data.length) throw new Error("Création VerifiedAddrs échouée");
    return again.data[0].data!.objectId;
  }, [account?.address, client, pkg, signAndExecute]);

  const addAddress = useCallback(
    async (addr: string) => {
      const id = await ensureVerifiedId();
      const tx = buildAddAddressTx(pkg, id, addr);
      const res = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: res.digest });
      return { digest: res.digest, verifiedId: id };
    },
    [ensureVerifiedId, client, pkg, signAndExecute],
  );

  const clearAll = useCallback(async () => {
    const id = await ensureVerifiedId();
    const tx = buildDeleteAllVerifiedTx(pkg, id);
    const res = await signAndExecute({ transaction: tx });
    await client.waitForTransaction({ digest: res.digest });
    return { digest: res.digest, verifiedId: id };
  }, [ensureVerifiedId, client, pkg, signAndExecute]);

  return { ensureVerifiedId, addAddress, clearAll };
}
