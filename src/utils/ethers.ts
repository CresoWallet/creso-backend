import { ethers } from "ethers";
import erc20ABIJson from "../data/contract/ERC20.json";
import { RPC_LINKS } from "../constant";

export const ERC20ABI = erc20ABIJson;

const provider = new ethers.providers.JsonRpcProvider(RPC_LINKS.TEST.MUMBAI);

export const getOKXChainId = (network: string) => {
  switch (network) {
    case "goerli":
      return "70000030";
    case "mumbai":
      return "80001";
    default:
      return "1";
  }
};

export const isContractAddress = async (address: string) => {
  try {
    // Fetch the code at the address.
    const code = await provider.getCode(address);

    // If code is '0x', it's an EOA; otherwise, it's a contract.
    return code !== "0x";
  } catch (error) {
    console.error("Error checking address:", error);
    return false;
  }
};
