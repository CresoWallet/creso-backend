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
  findUserByAddress,
  getSmartWalletByAddress,
  changeWalletHolder,
} from "../../services/prisma";
import {
  ITransferPayload,
  createAAWallet,
  createEOAWallet,
  getHistroy,
  getInternalTransactions,
  getSignerWallet,
  transfer,
  transferAA,
} from "../../services/ethers";
// import AppError from "../../errors/app";
import {
  IEncryptedData,
  decryptDataWithPassword,
  decryptKey,
  encryptDataWithNewPassword,
} from "../../utils/encrpt";
import {
  addGuardian,
  cancelRecovery,
  confirmRecovery,
  getProposedAddress,
  getRecoveryConfirmations,
  getRecoveryStatus,
  removeGuardian,
  startRecovery,
} from "../../services/ethers/recovery";
import { getUserTokens } from "../../services/prisma/token";
import AppError from "../../errors/app";
import {
  // getMailOptions,
  // getTransporter,
  sendEmail,
} from "../../services/email";

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

  public async importWallet(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("error");
      }

      const userId = req.user.id;

      const { passkey, data } = req.body;

      const decryptedFile = decryptDataWithPassword(data, passkey);

      //TODO : check if wallet exist or not. if doesn't exist create a new wallet
      const updatedWallet = await Promise.all(
        JSON.parse(decryptedFile).map(
          async (wallet: any) =>
            await changeWalletHolder(wallet.address, userId)
        )
      );

      return res.status(200).send(updatedWallet);
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

      const history: any[] = [];

      const { network } = req.body;
      //validation
      if (!network) {
        throw new Error("field invalid");
      }

      const wallets = await getAllWallets(req.user.id);

      const mainWallets = wallets.wallets;
      const smartWallets = wallets.smartWallets;

      await Promise.all(
        mainWallets!.map(async (e) => await getHistroy(e.address, network))
      )
        .then((result) => {
          history.push(result.flat());
        })
        .catch((error) => {
          throw new Error("failed to fetch");
        });

      await Promise.all(
        smartWallets!.map(
          async (e: any) => await getInternalTransactions(e.address)
        )
      )
        .then((result) => {
          history.push(result.flat());
        })
        .catch((error) => {
          throw new Error("failed to fetch");
        });

      let sortedHistory = history.flat().sort((a, b) => {
        return (new Date(b.timestamp) as any) - (new Date(a.timestamp) as any);
      });

      return res.status(200).send(sortedHistory);
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

      let wallet:any = null;
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
        walletName: walletName,
        walletId: wallet.id,
        wallet: createdSmartWallet,
        network,
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
    // const transporter = getTransporter();

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

      const response = await findUserByAddress(guardian);

      if (!response) {
        throw new AppError("Invalid wallet", 404);
      }

      const getWalletResponse = await getSmartWalletByAddress(walletAddress);

      if (!getWalletResponse) {
        throw new AppError("Invalid wallet", 404);
      }

      // getting user email for sending email

      const { email, username }: any = await prisma.user.findUnique({
        where: { id: response.userId },
        select: {
          email: true,
          username: true,
        },
      });

      if (!email || !username) {
        throw new AppError("Couldn't find user", 404);
      }

      // const mailOptions = getMailOptions({
      //   to: email as any,
      //   subject: "Adding you as a guardian",
      //   text: `The ${guardian} wallet address has been added to the list of guardians for the ${walletAddress} address.`,
      // });

      await addGuardian(signerWallet, walletAddress, guardian);

      await prisma.guardian.create({
        data: {
          guardianAddress: guardian,
          userId: response.userId,
          wallet: walletAddress,
          smartWalletId: getWalletResponse.id,
        },
      });

      // send email
      // transporter.sendMail(mailOptions, function (error, info) {
      //   if (error) {
      //     res
      //       .status(400)
      //       .send({ message: "Error sending guardian added email" });
      //   } else {
      //     res.status(200).send({
      //       message: "Email sent successfully",
      //     });
      //   }
      // });
      const emailResponse = await sendEmail({
        receivers: [email],
        template_name: "add-guardian",
        guardian,
        walletAddress,
        receiverName: username,
      });

      if (emailResponse) {
        res.status(200).send({
          message: "A OTP mail has been sent ",
        });
      }
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

      await prisma.guardian.deleteMany({
        where: {
          guardianAddress: guardian,
          wallet: walletAddress,
        },
      });

      return res.status(200).send(tx);
    } catch (err) {
      next(err);
    }
  }

  public async startRecovery(req: Request, res: Response, next: NextFunction) {
    // const transporter = getTransporter();
    try {
      const { guardian, walletAddress, newOwner, network } = req.body;
      if (!req.user) {
        throw new Error("no user");
      }

      const wallet = await getWallet(req.user.id, guardian);

      if (!wallet) throw new Error("no wallet");

      // getting guardians array to send email
      const guardians = await prisma.guardian.findMany({
        where: {
          wallet: walletAddress,
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!guardians) throw new Error("no wallet");

      var allGuardiansEmail = guardians.map((obj) => obj.user.email);

      const signerWallet = getSignerWallet(
        wallet.privateKey as IEncryptedData,
        network
      );

      await startRecovery(signerWallet, walletAddress, newOwner);

      // const mailOptions = getMailOptions({
      //   to: allGuardiansEmail,
      //   subject: "Recovery commenced",
      //   text: `The recovery of the ${walletAddress} wallet address is currently underway.  You are one of the wallet's guardians. reclaim this account within the next 24 hours.`,
      // });

      // send email
      // transporter.sendMail(mailOptions, function (error, info) {
      //   if (error) {
      //     res.status(400).send({ message: "Error sending emails" });
      //   } else {
      //     res.status(200).send({
      //       message: "Email sent successfully",
      //     });
      //   }
      // });

      const emailResponse = await sendEmail({
        receivers: allGuardiansEmail,
        template_name: "start-recovery",
        walletAddress,
      });

      if (emailResponse) {
        res.status(200).send({
          message: "A OTP mail has been sent ",
        });
      }
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

      const wallet = await getWallet(req.user.id, guardian);

      if (!wallet) throw new Error("no wallet");

      const guardians = await prisma.guardian.findMany({
        where: {
          wallet: walletAddress,
        },
      });

      if (!guardians) throw new Error("no guardians found");

      const signerWallet = getSignerWallet(
        wallet.privateKey as IEncryptedData,
        network
      );

      const newAddress = await getProposedAddress(signerWallet, walletAddress);

      const getWalletResponse = await prisma.wallet.findUnique({
        where: {
          address: newAddress,
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!getWalletResponse) throw new Error("couldn't fetch wallet");

      const tx = await confirmRecovery(signerWallet, walletAddress);

      const guardiansArray = guardians.map((e) => e.guardianAddress);

      const confirmations = await getRecoveryConfirmations(
        signerWallet,
        walletAddress,
        guardiansArray
      );

      const trueCount = confirmations.filter((value) => value).length;
      const falseCount = confirmations.filter((value) => !value).length;

      if (trueCount > falseCount) {
        const res = await prisma.smartWallet.update({
          where: {
            address: walletAddress,
          },
          data: {
            walletId: getWalletResponse.id,
          },
        });
      }

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
      if (!wallet) throw new Error("no wallet");

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

  public async getWalletGuardians(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { walletAddress } = req.body;

      if (!req.user) {
        throw new Error("no user");
      }

      // const provider = getProvider(network);

      // const recoveryData = await getRecoveryStatus(provider, walletAddress);

      const guardians = await prisma.guardian.findMany({
        where: {
          wallet: walletAddress,
        },
      });

      // const returnData = {
      //   guardians,
      //   recoveryData,
      // };

      return res.status(200).send(guardians);
    } catch (err: any) {
      next(err);
    }
  }

  public async getGuardedWallets(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new Error("error");
      }

      const guardians = await prisma.guardian.findMany({
        where: {
          userId: req.user.id,
        },
        include: {
          smartWallet: {
            select: {
              walletName: true,
              address: true,
              network: true,
            },
          },
        },
      });

      return res.status(200).send(guardians);
    } catch (err: any) {
      next(err);
    }
  }

  public async getRecoveryStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { walletAddress } = req.body;
      // console.log("network : ", network);
      const network = "goerli";
      if (!req.user) {
        throw new Error("no user");
      }

      // const provider = getProvider(network);

      // const signerWallet = provider.getSigner();

      const response = await findUserByAddress(walletAddress);

      if (!response) throw new AppError("Invalid wallet", 404);

      const wallet = await getEOAWalletOfSmartWallet(
        // req.user.id,
        response.userId,
        walletAddress
      );

      if (!wallet) throw new Error("no wallet");

      const signerWallet = getSignerWallet(
        wallet.privateKey as IEncryptedData,
        network
      );

      const tx = await getRecoveryStatus(signerWallet, walletAddress);

      console.log("tx : ", tx);

      return res.status(200).send(tx);
    } catch (err) {
      next(err);
    }
  }

  public async getUserAddedTokens(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { network } = req.body;

      const tokens = await getUserTokens(network);

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
