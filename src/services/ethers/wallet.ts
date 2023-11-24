import { generateSalt } from "../../utils/wallet";
import { IEncryptedData } from "../../utils/encrpt";
import {
  IProviderName,
  getSignerWallet,
  getWalletFactoryContract,
} from "./main";
import { Wallet, ethers } from "ethers";

export interface IWallet {
  privateKey: string;
  address: string;
  salt: string;
}

export const createEOAWallet = (): IWallet => {


  const wallet = Wallet.createRandom();

  const { privateKey, address: publicKey, mnemonic } = wallet;

  return {
    privateKey, address: publicKey, salt: mnemonic.phrase
  }


}
export const createAAWallet = async (privateKey: IEncryptedData, network: IProviderName): Promise<IWallet> => {

  const salt = generateSalt()

  const signerWallet = getSignerWallet(privateKey, network)
  const signerAddress = await signerWallet.getAddress()

  const walletFactoryContract = getWalletFactoryContract(signerWallet)

  const smartAccountAddress = await walletFactoryContract.getAddress(signerAddress, salt)


  return {
    privateKey: signerAddress,
    address: smartAccountAddress,
    salt
  }

}






export const getHistroy = async (
  address: string,
  network: IProviderName
): Promise<ethers.providers.TransactionResponse[]> => {
  let etherscanProvider = new ethers.providers.EtherscanProvider(network);

  return await etherscanProvider.getHistory(address);
};
