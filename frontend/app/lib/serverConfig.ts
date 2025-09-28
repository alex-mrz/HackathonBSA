import { Hex } from "@mysten/sui/utils";

export type ServerCommonConfig = {
  privateKey: string;
  keyServers: Hex[];
  pkgA: Hex;
  rpcUrl?: string;
};

export function getServerCommonConfig(): ServerCommonConfig {
  const privateKey = process.env.DOUBLE_SEAL_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Aucune clé privée trouvée (DOUBLE_SEAL_PRIVATE_KEY ou ADMIN_PRIVATE_KEY)");
  }

  const pkgA = process.env.VOTE_PACKAGE_ID as Hex | undefined;
  if (!pkgA) {
    throw new Error("VOTE_PACKAGE_ID manquant dans l'environnement");
  }

  const keyServersEnv = process.env.SEAL_KEY_SERVER_IDS;
  if (!keyServersEnv) {
    throw new Error("SEAL_KEY_SERVER_IDS manquant dans l'environnement");
  }
  const keyServers = keyServersEnv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as Hex[];

  const rpcUrl = process.env.SUI_RPC_URL || process.env.NEXT_PUBLIC_SUI_RPC_URL;

  return { privateKey, keyServers, pkgA, rpcUrl };
}
