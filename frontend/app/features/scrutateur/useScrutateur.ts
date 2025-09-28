import { useCallback } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/networkConfig";
import {
  SCRUTATEUR_TYPE,
  buildCreateScrutateurTx,
  buildReceiveBlobTx,
  buildMarkProcessedTx,
  buildDeleteScrutateurTx,
} from "./api";

export function useScrutateur() {
  const pkg = useNetworkVariable("votePackageId");
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const ensureStoreId = useCallback(async (): Promise<string> => {
    if (!account?.address) throw new Error("Wallet non connecté");
    const st = SCRUTATEUR_TYPE(pkg);
    const owned = await client.getOwnedObjects({
      owner: account.address,
      filter: { StructType: st },
    });
    if (owned.data.length > 0) return owned.data[0].data!.objectId;

    const tx = buildCreateScrutateurTx(pkg);
    const res = await signAndExecute({ transaction: tx });
    await client.waitForTransaction({ digest: res.digest });

    const again = await client.getOwnedObjects({
      owner: account.address,
      filter: { StructType: st },
    });
    if (!again.data.length) throw new Error("Création ScrutateurStore échouée");
    return again.data[0].data!.objectId;
  }, [account?.address, client, pkg, signAndExecute]);

  const receiveBlob = useCallback(
    async (blob: Uint8Array | number[]) => {
      const storeId = await ensureStoreId();
      const tx = buildReceiveBlobTx(pkg, storeId, blob);
      const res = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: res.digest });
      return { digest: res.digest, storeId };
    },
    [ensureStoreId, client, pkg, signAndExecute],
  );

  const markProcessed = useCallback(
    async (index: number) => {
      const storeId = await ensureStoreId();
      const tx = buildMarkProcessedTx(pkg, storeId, index);
      const res = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: res.digest });
      return { digest: res.digest, storeId };
    },
    [ensureStoreId, client, pkg, signAndExecute],
  );

  const deleteAll = useCallback(async () => {
    const storeId = await ensureStoreId();
    const tx = buildDeleteScrutateurTx(pkg, storeId);
    const res = await signAndExecute({ transaction: tx });
    await client.waitForTransaction({ digest: res.digest });
    return { digest: res.digest, storeId };
  }, [ensureStoreId, client, pkg, signAndExecute]);

  return { ensureStoreId, receiveBlob, markProcessed, deleteAll };
}
