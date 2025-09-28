import { useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useCallback } from "react";
import { useNetworkVariable } from "../../networkConfig";
import { buildAuthenticateAndRegisterTx } from "./api";

export function useAuth() {
  const pkg = useNetworkVariable("votePackageId");
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const authenticateAndRegister = useCallback(
    async (
      passwordDbId: string,
      verifiedId: string,
      userAddress: string,
      passwordHash: Uint8Array | number[],
    ) => {
      const tx = buildAuthenticateAndRegisterTx(
        pkg,
        passwordDbId,
        verifiedId,
        userAddress,
        passwordHash,
      );
      const res = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: res.digest });
      return res;
    },
    [pkg, client, signAndExecute],
  );

  return { authenticateAndRegister };
}
