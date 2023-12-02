import { NextFunction, Request, Response } from "express";
import {
  getAllWallets,
  getEOAWalletOfSmartWallet,
  getAllWallet,
  prisma,
  saveSmartWalletInDatabase,
  saveWalletInDatabase,
  getMainWallet,
  getWallet,
} from "../../services/prisma";
import {
  ITransferPayload,
  createAAWallet,
  createEOAWallet,
  getHistroy,
  getSignerWallet,
  transfer,
  transferAA,
} from "../../services/ethers";
// import AppError from "../../errors/app";
import {
  IEncryptedData,
  decryptKey,
  encryptDataWithNewPassword,
} from "../../utils/encrpt";
import {
  addGuardian,
  cancelRecovery,
  confirmRecovery,
  removeGuardian,
  startRecovery,
} from "../../services/ethers/recovery";
import { getUserTokens } from "../../services/prisma/token";

export class WalletController {
  public async getWallet(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("error");
      }
      const wallets = await getAllWallets(req.user.id);

      return res.status(200).send(wallets);
    } catch (err: any) {
      next(err);
    }
  }
  public async backupWallet(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("error");
      }
      const { passkey } = req.body;

      const wallets = await getAllWallet(req.user.id);

      if (wallets.length <= 0) {
        throw new Error("no main wallet");
      }

      // const walletKey = decryptKey(wallet.privateKey as IEncryptedData);

      // const encrptedFile = await encryptKeyWithPassword(walletKey, passkey);

      const walletKeys: string[] = [];
      wallets.forEach((wallet) => {
        //const data =  decryptKey(wallet.privateKey as IEncryptedData)
        walletKeys.push(decryptKey(wallet.privateKey as IEncryptedData));
      });

      const encrptedFile = encryptDataWithNewPassword(
        JSON.stringify(walletKeys),
        passkey
      );

      // Create a file to download
      // const filePath = path.join(__dirname, 'creso_backup.txt');
      // fs.writeFileSync(filePath, JSON.stringify(encrptedFile));

      // Send file
      // res.download(filePath, 'creso_backup.txt', (err) => {
      //     if (err) {
      //         // Handle error
      //         console.error(err);
      //         res.status(500).send('Error in file download');
      //     }
      //     // Delete the file after sending
      //     fs.unlinkSync(filePath);
      // });

      return res.status(200).send(encrptedFile);
    } catch (err: any) {
      next(err);
    }
  }

  public async getAssetBalance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new Error("error");
      }
      return res.status(200).send({});
    } catch (err: any) {
      next(err);
    }
  }

  public async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("error");
      }

      const { address, network } = req.body;
      //validation
      if (!address || !network) {
        throw new Error("field invalid");
      }
      const history = await getHistroy(address, network);

      return res.status(200).send(history);
    } catch (err: any) {
      next(err);
    }
  }

  public async createSmartWallet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new Error("error");
      }
      let { address, walletName, network } = req.body;
      //TODO: validation for walletName only passing string without space
      if (!walletName) {
        throw new Error("fill the fields");
      }

      let wallet = null;
      if (address) {
        wallet = await prisma.wallet.findFirst({
          where: {
            userId: req.user.id,
            address,
          },
        });
      } else {
        wallet = await getMainWallet(req.user.id);
      }

      if (!wallet) {
        throw new Error("no wallet");
      }

      const createdSmartWallet = await createAAWallet(
        wallet.privateKey as IEncryptedData,
        network
      );

      const saveWalletPayload = {
        userId: req.user.id,
        walletName: walletName,
        walletId: wallet.id,
        wallet: createdSmartWallet,
      };

      //saving wallet to database
      const savedWallet = await saveSmartWalletInDatabase(saveWalletPayload);

      return res.status(200).send(savedWallet);
    } catch (err) {
      next(err);
    }
  }

  public async createWallet(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("error");
      }
      const { walletName } = req.body;

      // Create a new wallet
      const createdWallet = createEOAWallet();

      const saveWalletPayload = {
        userId: req.user.id,
        walletName: walletName,
        wallet: createdWallet,
      };

      //saving wallet to database
      const savedWallet = await saveWalletInDatabase(saveWalletPayload);

      return res.status(200).send(savedWallet);
    } catch (err) {
      next(err);
    }
  }

  /**
   *
   * @param body
   * {
   * type : EOA | "AA"
   * from:
   * sendTo:
   * amount:
   * network:
   * standard: native | stable
   * tokenAddress:
   * }
   * @returns
   */

  public async makeTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("error");
      }

      const { type, sendTo, amount, from, network, standard, tokenAddress } =
        req.body;

      //validation
      if (!from) {
        throw new Error("invalid request");
      }

      const payload: ITransferPayload = {
        userId: req.user.id,
        sendTo,
        amount,
        from,
        network,
        standard,
        tokenAddress,
      };

      const receipt =
        type === "EOA" ? await transfer(payload) : await transferAA(payload);

      return res.status(200).send(receipt);

      // if (type === "EOA") {const receipt = await transfer(payload)return res.status(200).send(receipt)}
      // else if (type === "AA") {const receipt = await transferAA(payload)eturn res.status(200).send(receipt)
      // } else {throw new AppError("invalid type", 401)] }
    } catch (err) {
      next(err);
    }
  }

  /**
   *
   * @param body
   * {
   * type : EOA | "AA"
   * walletAddress:
   * network:
   * guardian:
   * }
   * @returns
   */
  public async addGuardian(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletAddress, guardian, network } = req.body;
      if (!req.user) {
        throw new Error("no user");
      }

      const wallet = await getEOAWalletOfSmartWallet(
        req.user.id,
        walletAddress
      );
      if (!wallet) {
        throw new Error("no wallet");
      }
      const signerWallet = getSignerWallet(
        wallet.privateKey as IEncryptedData,
        network
      );

      // console.log("signerWallet : ", signerWallet);

      const tx = await addGuardian(signerWallet, walletAddress, guardian);

      console.log("tx : ", tx);

      return res.status(200).send(tx);
    } catch (err) {
      next(err);
    }
  }

  public async removeGuardian(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletAddress, guardian, network } = req.body;
      if (!req.user) {
        throw new Error("no user");
      }

      const wallet = await getEOAWalletOfSmartWallet(
        req.user.id,
        walletAddress
      );
      if (!wallet) {
        throw new Error("no wallet");
      }
      const signerWallet = getSignerWallet(
        wallet.privateKey as IEncryptedData,
        network
      );

      const tx = await removeGuardian(signerWallet, walletAddress, guardian);

      return res.status(200).send(tx);
    } catch (err) {
      next(err);
    }
  }
  public async startRecovery(req: Request, res: Response, next: NextFunction) {
    try {
      const { guardian, walletAddress, newOwner, network } = req.body;
      if (!req.user) {
        throw new Error("no user");
      }

      const wallet = await getWallet(
        req.user.id,
        guardian
      );
      if (!wallet) {
        throw new Error("no wallet");
      }
      const signerWallet = getSignerWallet(
        wallet.privateKey as IEncryptedData,
        network
      );

      const tx = await startRecovery(signerWallet, walletAddress, newOwner);

      return res.status(200).send(tx);
    } catch (err) {
      next(err);
    }
  }
  public async confirmRecovery(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { guardian, walletAddress, network } = req.body;
      if (!req.user) {
        throw new Error("no user");
      }


      const wallet = await getWallet(
        req.user.id,
        guardian
      );

      if (!wallet) {
        throw new Error("no wallet");
      }
      const signerWallet = getSignerWallet(
        wallet.privateKey as IEncryptedData,
        network
      );

      const tx = await confirmRecovery(signerWallet, walletAddress);

      return res.status(200).send(tx);
    } catch (err) {
      next(err);
    }
  }
  public async cancelRecovery(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletAddress, network } = req.body;
      if (!req.user) {
        throw new Error("no user");
      }

      const wallet = await getEOAWalletOfSmartWallet(
        req.user.id,
        walletAddress
      );
      if (!wallet) {
        throw new Error("no wallet");
      }
      const signerWallet = getSignerWallet(
        wallet.privateKey as IEncryptedData,
        network
      );

      const tx = await cancelRecovery(signerWallet, walletAddress);

      return res.status(200).send(tx);
    } catch (err) {
      next(err);
    }
  }

  // public async getGuardian(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { walletAddress, network } = req.body;
  //     if (!req.user) {
  //       throw new Error("no user");
  //     }

  //     const wallet = await getEOAWalletOfSmartWallet(
  //       req.user.id,
  //       walletAddress
  //     );
  //     if (!wallet) {
  //       throw new Error("no wallet");
  //     }
  //     const signerWallet = getSignerWallet(
  //       wallet.privateKey as IEncryptedData,
  //       network
  //     );

  //     const tx = await cancelRecovery(signerWallet, walletAddress);

  //     return res.status(200).send(tx);
  //   } catch (err) {
  //     next(err);
  //   }
  // }

  public async getUserAddedTokens(req: Request, res: Response, next: NextFunction) {
    try {
      const { network } = req.body;


      const tokens = await getUserTokens(network)

      return res.status(200).send({ message: tokens });
    } catch (err) {
      next(err);
    }
  }
 
  public async testApi(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).send({ message: "test" });
    } catch (err) {
      next(err);
    }
  }


}
