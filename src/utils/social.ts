import AppError from "..//errors/app";
import { DEFAULT_NETWORK } from "../constant";
import { createAAWallet, createEOAWallet } from "../services/ethers";
import {
  prisma,
  saveSmartWalletInDatabase,
  saveWalletInDatabase,
} from "../services/prisma";
import { IEncryptedData } from "./encrpt";

interface ISocialUserProps {
  id: string;
  username: string;
  email: string;
  registrationMethod: string;
  isEmailVerified: boolean;
}

export const createSocialUser = async ({
  id,
  username,
  email,
  registrationMethod,
  isEmailVerified,
}: ISocialUserProps) => {
  try {
    if (email) {
      const exist = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (exist) {
        throw new AppError("Email already exists", 404);
      }
    }

    // Check if a user with this Google ID already exists
    let user = await prisma.user.findUnique({
      where: { socialId: id, registrationMethod: registrationMethod },
    });

    if (!user) {
      // Create a new user if one doesn't exist
      user = await prisma.user.create({
        data: {
          socialId: id,
          username: username,
          email: email,
          registrationMethod: registrationMethod,
          isEmailVerified: isEmailVerified,
        },
      });

      // Create a new wallet
      const createdWallet = createEOAWallet();

      const saveWalletPayload = {
        userId: user.id,
        walletName: "main_wallet",
        wallet: createdWallet,
      };

      //saving wallet to database
      const savedWallet = await saveWalletInDatabase(saveWalletPayload);

      const createdSmartWallet = await createAAWallet(
        savedWallet.privateKey as IEncryptedData,
        DEFAULT_NETWORK
      );

      const saveWSmartalletPayload = {
        userId: user.id,
        walletName: "smart_wallet",
        walletId: savedWallet.id,
        wallet: createdSmartWallet,
        network: DEFAULT_NETWORK,
      };

      //saving wallet to database
      await saveSmartWalletInDatabase(saveWSmartalletPayload);
    }

    return user;
  } catch (error) {
    throw new Error("error");
  }
};
