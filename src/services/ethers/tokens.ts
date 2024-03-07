import { getProvider } from "./main";
import { ethers } from "ethers";

import tokenAbi from "../../data/contract/ERC20.json";

export interface ITokenBlnce {
  network: any;
  token_address: string;
  address: string;
}

export const getTokenBlnce = async ({
  network,
  token_address,
  address,
}: ITokenBlnce) => {
  const provider = getProvider(network);

  // if (provider === "Invalid Network") {
  //   throw new Error("Invalid Network!");
  // }

  const tokenContract = new ethers.Contract(token_address, tokenAbi, provider);

  const balance = await tokenContract.balanceOf(address);

  return ethers.utils.formatEther(balance);
};
