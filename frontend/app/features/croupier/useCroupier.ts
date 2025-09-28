import { useCallback } from "react";
import {
  useSuiClient,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "../../networkConfig";
import {
  CROUPIER_TYPE,
  buildCreateCroupierStoreTx,
  buildSubmitTokenTx,
  buildForwardAllTx,
  buildDeleteAllCroupierTx,
  buildShuffleTx,
} from "./api";

export function useCroupier() {
  const pkg = useNetworkVariable("votePackageId");
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Trouve ou crée le CroupierStore du wallet courant
  const ensureStoreId = useCallback(async (): Promise<string> => {
    if (!account?.address) throw new Error("Wallet non connecté");
    const st = CROUPIER_TYPE(pkg);
    const owned = await client.getOwnedObjects({
      owner: account.address,
      filter: { StructType: st },
    });
    if (owned.data.length > 0) return owned.data[0].data!.objectId;

    const tx = buildCreateCroupierStoreTx(pkg);
    const res = await signAndExecute({ transaction: tx });
    await client.waitForTransaction({ digest: res.digest });

    const again = await client.getOwnedObjects({
      owner: account.address,
      filter: { StructType: st },
    });
    if (!again.data.length) throw new Error("Création CroupierStore échouée");
    return again.data[0].data!.objectId;
  }, [account?.address, client, pkg, signAndExecute]);

  // Soumettre un token chiffré (double-chiffré: scrutateur∘croupier)
  const submitToken = useCallback(
    async (verifiedId: string, ciphertext: Uint8Array | number[]) => {
      const storeId = await ensureStoreId();
      const tx = buildSubmitTokenTx(pkg, storeId, verifiedId, ciphertext);
      const res = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: res.digest });
      return { digest: res.digest, storeId };
    },
    [ensureStoreId, client, pkg, signAndExecute],
  );

  // Forward (admin uniquement)
  const forwardAll = useCallback(
    async (scrutateurAddr: string) => {
      const storeId = await ensureStoreId();
      const tx = buildForwardAllTx(pkg, storeId, scrutateurAddr);
      const res = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: res.digest });
      return { digest: res.digest, storeId };
    },
    [ensureStoreId, client, pkg, signAndExecute],
  );

  // Purge (admin)
  const deleteAll = useCallback(async () => {
    const storeId = await ensureStoreId();
    const tx = buildDeleteAllCroupierTx(pkg, storeId);
    const res = await signAndExecute({ transaction: tx });
    await client.waitForTransaction({ digest: res.digest });
    return { digest: res.digest, storeId };
  }, [ensureStoreId, client, pkg, signAndExecute]);

  const shuffleTokens = useCallback(
    async (permutation: number[]) => {
      const storeId = await ensureStoreId();
      const tx = buildShuffleTx(pkg, storeId, permutation);
      const res = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: res.digest });
      return { digest: res.digest, storeId };
    },
    [ensureStoreId, client, pkg, signAndExecute],
  );

  return { ensureStoreId, submitToken, forwardAll, deleteAll, shuffleTokens };
}
