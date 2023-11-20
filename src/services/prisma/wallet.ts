import { encryptKey } from "../../utils/encrpt";
import { prisma } from ".";
import { IWallet } from "../ethers";


type ISaveWalletPayload = {
    userId: string;
    walletName: string;
    wallet: IWallet
};
type ISaveSmartWalletDataPlayload = {
    userId: string;
    walletName: string;
    walletId: string;
    wallet: IWallet
};


export const getMainWallet = async (userId: string) => {
    return await prisma.wallet.findFirst({
        where: {
            userId: userId,
            // walletName: "main_wallet"
        },

    });

    // return {
    //     wallets: result?.wallets,
    //     smartWallets: result?.smartWallets
    // };
}

export const getAllWallets = async (userId: string) => {
    const result = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            wallets: {
                select: {
                    walletName: true,
                    address: true
                }
            },
            smartWallets: {
                select: {
                    walletName: true,
                    address: true
                }
            }
        },
    });

    return {
        wallets: result?.wallets,
        smartWallets: result?.smartWallets
    };
}

export const getTotalAssets = async (userId: string) => {
    // const wallets = getAllWallets(userId)

    return null
}




export const getSmartWalletByAddress = async (userId: string, address: string) => {
    return await prisma.smartWallet.findFirst({
        where: {
            userId,
            address
        },
        include: {
            wallet: {
                select: {
                    privateKey: true
                }
            }
        }
    });
}


export const saveWalletInDatabase = async ({ userId, walletName, wallet }: ISaveWalletPayload) => {
    const encrptedPk = encryptKey(wallet.privateKey)
    const encrptedSalt = encryptKey(wallet.salt)

    return await prisma.wallet.create({
        data: {
            walletName,
            address: wallet.address,
            privateKey: encrptedPk,
            salt: encrptedSalt,
            user: {
                connect: {
                    id: userId,
                },
            },
        },
    });
}




export const saveSmartWalletInDatabase = async ({ userId, walletName, walletId, wallet }: ISaveSmartWalletDataPlayload) => {

    return await prisma.smartWallet.create({
        data: {
            walletName,
            address: wallet.address,
            salt: wallet.salt,
            user: {
                connect: {
                    id: userId,
                },
            },
            wallet: {
                connect: {
                    id: walletId,
                },
            },
        },
    });
}