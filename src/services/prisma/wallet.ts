import { encryptKey } from "../../utils/encrpt";
import { prisma } from "./main";
import { IWallet } from "../ethers";

type ISaveWalletPayload = {
  userId: string;
  walletName: string;
  wallet: IWallet;
};
type ISaveSmartWalletDataPlayload = {
  userId: string;
  walletName: string;
  walletId: string;
  network: string;
  wallet: IWallet;
};

export const getMainWallet = async (userId: string) => {
  return await prisma.wallet.findFirst({
    where: {
      userId: userId,
      walletName: "main_wallet",
    },
  });

  // return {
  //     wallets: result?.wallets,
  //     smartWallets: result?.smartWallets
  // };
};

export const getAllWallet = async (userId: string) => {
  return await prisma.wallet.findMany({
    where: {
      userId: userId,
    },
  });

  // return {
  //     wallets: result?.wallets,
  //     smartWallets: result?.smartWallets
  // };
};

export const getEOAWalletOfSmartWallet = async (
  userId: string,
  address: string
) => {
  try {
    const smartWallet = await prisma.smartWallet.findUnique({
      where: {
        address: address,
      },
      include: {
        wallet: true, // Include the related Wallet
      },
    });

    if (!smartWallet || !smartWallet.wallet) {
      throw new Error("SmartWallet or related Wallet not found");
    }
    if (smartWallet.wallet.userId !== userId) {
      throw new Error("unauthorized user");
    }

    return smartWallet.wallet;
  } catch (error) {
    throw error;
  }
};
export const getWallet = async (userId: string, address: string) => {
  try {
    return await prisma.wallet.findUnique({
      where: {
        address,
        userId,
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getAllWallets = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      wallets: {
        select: {
          walletName: true,
          address: true,
        },
      },
      smartWallets: {
        select: {
          walletName: true,
          address: true,
          network: true,
        },
      },
    },
  });

  return {
    wallets: result?.wallets,
    smartWallets: result?.smartWallets,
  };
};

export const getTotalAssets = async (userId: string) => {
  // const wallets = getAllWallets(userId)
  return null;
};

export const findUserByAddress = async (address: string) => {
  try {
    var responseFromWallet = await prisma.wallet.findUnique({
      where: {
        address,
      },
      select: {
        userId: true,
      },
    });

    // if (!responseFromWallet) {
    //   throw new Error("Wallet not found");
    // }

    if (!responseFromWallet) {
      responseFromWallet = await prisma.smartWallet.findUnique({
        where: {
          address,
        },
        select: {
          userId: true,
        },
      });
    }

    return responseFromWallet;
  } catch (error) {
    throw error;
  }
};

export const getSmartWalletByAddress = async (
  userId: string,
  address: string
) => {
  return await prisma.smartWallet.findFirst({
    where: {
      userId,
      address,
    },
    include: {
      wallet: {
        select: {
          privateKey: true,
        },
      },
    },
  });
};

export const saveWalletInDatabase = async ({
  userId,
  walletName,
  wallet,
}: ISaveWalletPayload) => {
  const encrptedPk = encryptKey(wallet.privateKey);
  const encrptedSalt = encryptKey(wallet.salt);

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
};

export const saveSmartWalletInDatabase = async ({
  userId,
  walletName,
  walletId,
  wallet,
  network,
}: ISaveSmartWalletDataPlayload) => {
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
      network,
    },
  });
};
