import { generateSalt } from "../../utils/wallet";
import { IEncryptedData } from "../../utils/encrpt";
import {
  IProviderName,
  getCresoWalletContract,
  getExplorer,
  getProvider,
  getSignerWallet,
  getWalletFactoryContract,
} from "./main";
import { Wallet, ethers, providers } from "ethers";
import axios from "axios";
import {
  ENTRY_POINT_ADDRESSS,
  ETHERSCAN_PROVIDER_KEY,
  RPC_LINKS,
} from "../../constant";
import { prisma } from "../prisma";
import AppError from "../../errors/app";

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
  try {
    let etherscanProvider = new ethers.providers.EtherscanProvider(network);
    // let explorer = getExplorer(network);

    return await etherscanProvider.getHistory(address);
  } catch (error) {
    throw new Error(error.reason);
  }
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
  network: IProviderName
) => {
  // let etherscanProvider = new ethers.providers.EtherscanProvider(network);
  const provider = getProvider(network);
  const balanceInWei = await provider.getBalance(walletAddress);
  const balance = ethers.utils.formatEther(balanceInWei);

  return balance;
};

export const getThreshold = async (address: string) => {
  try {
    const { isDeployed, contract } = await getCresoWalletContract(address);

    let threshold;
    if (isDeployed === "0x" || !isDeployed) {
      const { wallets }: any = await prisma.smartWallet.findUnique({
        where: {
          address: address,
        },
        select: {
          wallets: true,
        },
      });

      if (!wallets) throw new AppError("Couldn't find owners", 404);

      threshold = Math.round(wallets.length / 2);
    } else {
      threshold = await contract.threshold();
    }

    return threshold;
  } catch (error) {
    throw new Error(error.reason);
  }
};
