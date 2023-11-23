import { ethers } from "ethers";
import { BUNDLER_RPC_URL, CL_WALLETFACTORY_ADDRESS, ENTRY_POINT_ADDRESSS, RPC_LINKS } from "../../constant";
import clWalletFactoryJson from '../../data/contract/CLWalletFactory.json'
import clWalletJson from '../../data/contract/CLWallet.json'
import entryPointJson from '../../data/contract/EntryPoint.json'
import { IEncryptedData, decryptKey } from "../../utils/encrpt";



export type IProviderName = "ethereum" | "goerli"

// export const etherProvider = new ethers.providers.JsonRpcProvider(RPC_LINKS.TEST.GOERLI);
export const stackupProvider = new ethers.providers.JsonRpcProvider(BUNDLER_RPC_URL);

export const getProvider = (network: IProviderName) => {
    switch (network) {
        case "goerli":
            return new ethers.providers.JsonRpcProvider(RPC_LINKS.TEST.GOERLI)
        case "ethereum":
            return new ethers.providers.JsonRpcProvider(RPC_LINKS.MAIN.ETHEREUM)
        default:
            return new ethers.providers.JsonRpcProvider(RPC_LINKS.MAIN.ETHEREUM)
    }
}

export const getEntryPointAddress = (network: IProviderName) => {
    return ENTRY_POINT_ADDRESSS
}
export const getWalletFactoryAddress = (network: IProviderName) => {
    return CL_WALLETFACTORY_ADDRESS
}
export const getBundlerRPC = (network: IProviderName) => {
    return BUNDLER_RPC_URL
}



export const getSignerWallet = (pk: IEncryptedData, providerName: IProviderName) => {
    const privateKey = decryptKey(pk)
    const provider = getProvider(providerName)
    return new ethers.Wallet(privateKey, provider);
}

export const getWalletFactoryContract = (wallet: ethers.Wallet) => {
    return new ethers.Contract(
        CL_WALLETFACTORY_ADDRESS,
        clWalletFactoryJson.abi,
        wallet
    );

}
export const getWalletContract = (wallet: ethers.Wallet, address: string) => {
    return new ethers.Contract(
        address,
        clWalletJson.abi,
        wallet
    );
}


export const getEntryPointContract = (wallet: ethers.Wallet) => {
    return new ethers.Contract(
        ENTRY_POINT_ADDRESSS,
        entryPointJson.abi,
        wallet
    );
}


export const getContractInterface = (type: 'WALLET_FACTORY' | "WALLET" | "ENTRYPOINT") => {
    switch (type) {
        case "WALLET_FACTORY":
            return new ethers.utils.Interface(clWalletFactoryJson.abi);
        default:
            return new ethers.utils.Interface(clWalletFactoryJson.abi);
    }
}