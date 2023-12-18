// export const CL_WALLETFACTORY = "0x06DE0387f27fDbB11c9972c5AB3b3BacD5a0C158"
export const CL_WALLETFACTORY_ADDRESS =
  "0x8aa201DCd34522aFB250442E2915426244624918";
export const ENTRY_POINT_ADDRESSS =
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

export const DEFAULT_NETWORK = "goerli";

export const ETHERSCAN_PROVIDER_KEY = process.env.ETHERSCAN_PROVIDER_KEY || "";

export const RPC_LINKS = {
  MAIN: {
    ETHEREUM: "https://mainnet.infura.io/v3/a0b74d65173042fabe9639289bd336b5",
  },
  TEST: {
    GOERLI: "https://goerli.infura.io/v3/a0b74d65173042fabe9639289bd336b5",
  },
};
export const BUNDLER_RPC_URL =
  "https://api.stackup.sh/v1/node/008ce397ad6118f10ff36bb16e0ba359f4e56d29b48de4685d17104bc8f04dd9";

//encryption
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;
