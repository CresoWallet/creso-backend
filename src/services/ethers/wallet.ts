import { generateSalt } from "../../utils/wallet";
import { IEncryptedData } from "../../utils/encrpt";
import {
  IProviderName,
  getSignerWallet,
  getWalletFactoryContract,
} from "./main";
import { Wallet, ethers } from "ethers";
import axios from "axios";
import { ENTRY_POINT_ADDRESSS, ETHERSCAN_PROVIDER_KEY } from "../../constant";

export interface IWallet {
  privateKey: string;
  address: string;
  salt: string;
}

export const createEOAWallet = (): IWallet => {
  const wallet = Wallet.createRandom();

  const { privateKey, address: publicKey, mnemonic } = wallet;

  return {
    privateKey,
    address: publicKey,
    salt: mnemonic.phrase,
  };
};
export const createAAWallet = async (
  privateKey: IEncryptedData,
  network: IProviderName
): Promise<IWallet> => {
  const salt = generateSalt();

  const signerWallet = getSignerWallet(privateKey, network);
  const signerAddress = await signerWallet.getAddress();

  const walletFactoryContract = getWalletFactoryContract(signerWallet);

  const smartAccountAddress = await walletFactoryContract.getAddress(
    signerAddress,
    salt
  );

  return {
    privateKey: signerAddress,
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
  const internalTransactionsResponse = await axios.get(
    "https://api-goerli.etherscan.io/api",
    {
      params: {
        module: "account",
        action: "txlistinternal",
        address: address,
        apikey: ETHERSCAN_PROVIDER_KEY,
      },
    }
  );

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

export const getWalletBalance = async (
  walletAddress: string,
  network: string
) => {
  let etherscanProvider = new ethers.providers.EtherscanProvider(network);
  const balanceInWei = await etherscanProvider.getBalance(walletAddress);
  const balance = ethers.utils.formatEther(balanceInWei);

  return balance;
};
