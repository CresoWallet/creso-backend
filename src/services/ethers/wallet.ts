import { generateSalt } from "../../utils/wallet";
import { IEncryptedData } from "../../utils/encrpt";
import {
  IProviderName,
  getSignerWallet,
  getWalletFactoryContract,
} from "./main";
import { Wallet, ethers } from "ethers";
import axios from "axios";
import { ETHERSCAN_PROVIDER_KEY } from "../../constant";

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

  const history = [];

  try {
    const code = await etherscanProvider.getCode(address);
    if (code !== "0x") {
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

      const internalTransactions =
        internalTransactionsResponse.data.result.filter(
          (e: any) => e.value > 0
        );

      history.push(internalTransactions);
    } else {
      // Use ethers.js getHistory for external transactions
      const internalTxn = await etherscanProvider.getHistory(address);
      history.push(internalTxn);
    }

    return history;
  } catch (error) {
    throw error;
  }

  // return await etherscanProvider.getHistory(address);
};
