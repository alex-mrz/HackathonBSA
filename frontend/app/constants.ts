export const DEVNET_COUNTER_PACKAGE_ID = "0xTODO";
export const TESTNET_COUNTER_PACKAGE_ID =
  "0xcea82fb908b9d9566b1c7977491e76901ed167978a1ecd6053a994881c0ea9b5";
export const MAINNET_COUNTER_PACKAGE_ID = "0xTODO";
export const DEVNET_VOTE_PACKAGE_ID = "0xTODO";
const votePkgFromEnv =
  typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_VOTE_PACKAGE_ID : undefined;

export const TESTNET_VOTE_PACKAGE_ID = votePkgFromEnv ?? "0xTODO";
export const MAINNET_VOTE_PACKAGE_ID = "0xTODO";
