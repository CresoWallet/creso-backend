import { generateSalt } from "../../utils/wallet";
import { IEncryptedData } from "../../utils/encrpt";
import {
  IProviderName,
  getSignerWallet,
  getWalletFactoryContract,
} from "./main";
import { Wallet, ethers } from "ethers";
import axios from "axios";
import {
  ENTRY_POINT_ADDRESSS,
  ETHERSCAN_PROVIDER_KEY,
  RPC_LINKS,
} from "../../constant";

export interface IWallet {
  // privateKey: string;
  address: string;
  salt: string;
}

export const createEOAWallet = (): IWallet => {
  const wallet = Wallet.createRandom();

  const { privateKey, address: publicKey, mnemonic } = wallet;

  return {
    // privateKey,
    address: publicKey,
    salt: mnemonic.phrase,
  };
};
export const createAAWallet = async (
  publicKey: string[],
  network: IProviderName
): Promise<IWallet> => {
  const salt = generateSalt();

  // const signerWallet = getSignerWallet(publicKey, network);
  const owners = publicKey;
  // const signerAddress = await signerWallet.getAddress();

  const walletFactoryContract = getWalletFactoryContract(network);

  const smartAccountAddress = await walletFactoryContract.getAddress(
    owners,
    salt
  );

  return {
    // owners: signerAddress,
    address: smartAccountAddress,
    salt,
  };
};

export const getHistroy = async (
  address: string,
  network: IProviderName
): Promise<ethers.providers.TransactionResponse[]> => {
  let etherscanProvider = new ethers.providers.EtherscanProvider(network);

  return await etherscanProvider.getHistory(address);
};

export const getInternalTransactions = async (
  address: string
): Promise<ethers.providers.TransactionResponse[]> => {
  // Use Etherscan API for internal transactions
  const internalTransactionsResponse = await axios.get(RPC_LINKS.TEST.MUMBAI, {
    params: {
      module: "account",
      action: "txlistinternal",
      address: address,
      apikey: ETHERSCAN_PROVIDER_KEY,
    },
  });

  console.log("ENTRY_POINT_ADDRESSS : ", ENTRY_POINT_ADDRESSS);

  const it = internalTransactionsResponse.data.result.filter(
    (e: any) =>
      e.value > 0 && e.to.toLowerCase() != ENTRY_POINT_ADDRESSS.toLowerCase()
  );

  // Convert timestamps from string to number
  const internalTransactions = it.map(({ timeStamp, ...tx }: any) => ({
    ...tx,
    timestamp: parseInt(timeStamp, 10),
  }));

  return internalTransactions;
};

export const getTransactionsById = async (txnHash: string) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      RPC_LINKS.TEST.MUMBAI
    );

    return await provider.getTransaction(txnHash);
  } catch (error) {
    throw new Error(error.reason);
  }
};
export const getWalletBalance = async (
  walletAddress: string,
  network: string
) => {
  let etherscanProvider = new ethers.providers.EtherscanProvider(network);
  const balanceInWei = await etherscanProvider.getBalance(walletAddress);
  const balance = ethers.utils.formatEther(balanceInWei);

  return balance;
};
