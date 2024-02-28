import { encryptKey } from "../../utils/encrpt";
import { prisma } from "./main";
import { IWallet } from "../ethers";
import AppError from "../../errors/app";

type ISaveWalletPayload = {
  userId: string;
  walletName: string;
  // wallet: IWallet;
  walletAddress: string;
  deviceId: string;
};
type ISaveSmartWalletDataPlayload = {
  walletName: string;
  wallets: string[];
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

export const getEoaWallets = async (userId: string) => {
  return await prisma.wallet.findMany({
    where: {
      userId: userId,
    },
    select: {
      walletName: true,
      address: true,
    },
  });
};

export const getSmartWalletsByEOA = async (walletAddress: string) => {
  return await prisma.smartWallet.findMany({
    where: {
      wallets: {
        has: walletAddress,
      },
    },
    select: {
      walletName: true,
      address: true,
    },
  });
};

export const getEOAWalletOfSmartWallet = async (
  userId: string,
  address: string
) => {
  try {
    // const smartWallet = await prisma.smartWallet.findUnique({
    //   where: {
    //     address: address,
    //   },
    //   include: {
    //     wallet: true, // Include the related Wallet
    //   },
    // });
    // if (!smartWallet || !smartWallet.wallet) {
    //   throw new Error("SmartWallet or related Wallet not found");
    // }
    // if (smartWallet.wallet.userId !== userId) {
    //   throw new Error("unauthorized user");
    // }
    // return smartWallet.wallet;
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
    select: {
      wallets: {
        select: {
          walletName: true,
          address: true,

          // smartWallets: {
          //   select: {
          //     walletName: true,
          //     address: true,
          //     network: true,
          //   },
          // },
        },
      },
    },
  });

  const smartWallets = [] as any;

  // result?.wallets.map(
  //   (e) => e.smartWallets.length > 0 && smartWallets.push(e.smartWallets[0])
  // );

  return {
    wallets: result?.wallets,
    smartWallets,
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

    if (!responseFromWallet) {
      const responseFromSmartWallet = await prisma.smartWallet.findUnique({
        where: {
          address,
        },
        // select: {
        //   walletId: true,
        // },
      });

      if (!responseFromSmartWallet) {
        throw new Error("Wallet not found");
      }

      // const user = await prisma.wallet.findUnique({
      //   where: {
      //     id: responseFromSmartWallet.walletId,
      //   },
      //   select: {
      //     userId: true,
      //   },
      // });

      // if (!user) {
      //   throw new Error("User not found");
      // }

      // responseFromWallet = user;
    }

    return responseFromWallet;
  } catch (error) {
    throw error;
  }
};

export const getWalletOwners = async (address: string) => {
  return await prisma.smartWallet.findUnique({
    where: {
      address,
    },
    select: {
      wallets: true,
    },
  });
};

export const getSmartWalletByAddress = async (address: string) => {
  return await prisma.smartWallet.findFirst({
    where: {
      address,
    },
    // include: {
    //   wallet: {
    //     // select: {
    //     //   privateKey: true,
    //     // },
    //   },
    // },
  });
};

export const saveWalletInDatabase = async ({
  userId,
  walletName,
  // wallet,
  walletAddress,
  deviceId,
}: ISaveWalletPayload) => {
  // const encrptedPk = encryptKey(wallet.privateKey);
  // const encrptedSalt = encryptKey(wallet.salt);

  return await prisma.wallet.create({
    data: {
      walletName,
      // address: wallet.address,
      address: walletAddress,
      // privateKey: encrptedPk,
      // salt: encrptedSalt,
      device: {
        connect: {
          id: deviceId,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
};

export const saveSmartWalletInDatabase = async ({
  walletName,
  wallets,
  wallet,
  network,
}: ISaveSmartWalletDataPlayload) => {
  return await prisma.smartWallet.create({
    data: {
      walletName,
      address: wallet.address,
      salt: wallet.salt,
      wallets,
      // wallet: {
      //   // connect: {
      //   //   id: walletId,
      //   // },
      //   // connect: walletId.map((wallitet: any) => ({ id: wallitet })),
      //   // connect: { id: "1" },
      //   connect: walletConnectInput,
      // },
      // wallet: walletConnectInput,
      // wallet: {
      //   connect: ["1", "2"],
      // },
      network,
    },
  });
};

export const changeWalletHolder = async (
  address: string,
  newHolder: string
) => {
  return await prisma.wallet.update({
    where: {
      address: address,
    },
    data: {
      userId: newHolder,
    },
  });
};

export const checkOwner = async (
  smartWalletAddress: string,
  walletAddress: string
) => {
  const { wallets }: any = await prisma.smartWallet.findUnique({
    where: {
      address: smartWalletAddress,
    },
    select: {
      wallets: true,
    },
  });

  if (!wallets) {
    throw new AppError("Couldn't find wallet", 404);
  }

  return wallets.includes(walletAddress);
};

export const getUserEmailFromOwners = async (address: string) => {
  const { wallets }: any = await prisma.smartWallet.findUnique({
    where: {
      address,
    },
    select: {
      wallets: true,
    },
  });

  const users = await prisma.wallet.findMany({
    where: {
      address: {
        in: wallets,
      },
    },
    select: {
      user: true,
    },
  });

  return users.map((e) => e.user.email);
};
