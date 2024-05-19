import { NextFunction, Request, Response } from "express";
import {
  getAllWallets,
  getEOAWalletOfSmartWallet,
  getEoaWallets,
  prisma,
  saveSmartWalletInDatabase,
  saveWalletInDatabase,
  getMainWallet,
  getWallet,
  findUserByAddress,
  getSmartWalletByAddress,
  changeWalletHolder,
  addDeviceInCreateWallet,
  getUserEmailFromOwners,
  getSmartWalletsByEOA,
} from "../../services/prisma";
import {
  ITransferPayload,
  createAAWallet,
  createEOAWallet,
  executeTransaction,
  getHistroy,
  getInternalTransactions,
  getSignerWallet,
  getThreshold,
  getTokenBlnce,
  getTransactionsById,
  getWalletBalance,
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
import { detectDevice } from "../../utils/deviceDetect";
import { isContractAddress } from "../../utils/ethers";

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

  public async getEOAWallets(req: Request, res: Response, next: NextFunction) {
    console.log("wallets : ");
    try {
      if (!req.user) {
        throw new Error("error");
      }

      const wallets = await getEoaWallets(req.user.id);

      return res.status(200).send(wallets);
    } catch (err: any) {
      next(err);
    }
  }

  public async getAAWallets(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("error");
      }

      const { address } = req.params;

      const wallets = await getSmartWalletsByEOA(address);

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

      const wallets = await getEoaWallets(req.user.id);

      if (wallets.length <= 0) {
        throw new Error("no main wallet");
      }

      // const walletKey = decryptKey(wallet.privateKey as IEncryptedData);

      // const encrptedFile = await encryptKeyWithPassword(walletKey, passkey);

      const walletKeys: string[] = [];
      wallets.forEach((wallet) => {
        //const data =  decryptKey(wallet.privateKey as IEncryptedData)
        // walletKeys.push(decryptKey(wallet.privateKey as IEncryptedData));
        walletKeys.push(wallet.address);
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

  public async importExistingWallet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new Error("error");
      }

      const userId = req.user.id;

      const { walletAddress, walletName } = req.body;

      if (!walletName || !walletAddress)
        throw new Error("Please enter wallet name and wallet address");

      const isContract = await isContractAddress(walletAddress);

      if (isContract) {
        throw new Error(
          "Please enter a valid address. This address is not an EOA address!"
        );
      }

      const result = await detectDevice(req, res, next);

      if (!result) throw new Error("couldn't find a device");

      const device = await addDeviceInCreateWallet(userId, result);

      const saveWalletPayload = {
        userId,
        walletName: walletName,
        walletAddress,
        deviceId: device.id,
      };

      //saving wallet to database
      await saveWalletInDatabase(saveWalletPayload);

      return res.status(200).send({
        data: saveWalletPayload,
        message: "Successfully import EOA wallet",
      });
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
      const { address } = req.params;
      const { network } = req.body;

      const balance = await getWalletBalance(address, network);
      return res.status(200).send(balance);
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
        mainWallets!.map(async (e: any) => await getHistroy(e.address, network))
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

  public async getWalletTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { address } = req.params;
    const { network } = req.body;

    try {
      const isContract = await isContractAddress(address);

      if (isContract) {
        const smartWalletHistory = await getInternalTransactions(address);
        return res.status(200).send(smartWalletHistory);
      } else {
        const EOAHistory = await getHistroy(address, network);
        return res.status(200).send(EOAHistory);
      }
    } catch (err) {
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

      if (!(network === "mumbai" || network === "ethereum")) {
        throw new Error("Invalid network");
      }

      if (!walletName) {
        //TODO: validation for walletName only passing string without space
        throw new Error("fill the fields");
      }

      /**
       * @dev Modifying code - Support for single owner wallet
       * @NOTE THE MAINNET FACTORY CONTRACT SUPPORTS ONLY SINGLE OWNER WALLET
       */
      /*---------------------From Here---------------------*/
      /* 
      const wallet = await prisma.wallet.findMany({
        where: {
          address: {
            in: address,
          },
        },
        select: {
          address: true,
          userId: true,
        },
      });
      
      const foundedAddress = [
        ...new Set(wallet.map((item: any) => item.address)),
      ];

      // TODO: we can create wallet if we can't find it
      // if (!wallet) {
      //   throw new Error("no wallet");
      // }

      const createdSmartWallet = await createAAWallet(
        // address,
        // wallet.privateKey as IEncryptedData,
        foundedAddress,
        network
      ); */
      /*---------------------To Here---------------------*/

      let wallet;

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
        throw new Error("No Wallet");
      }
      const createdSmartWallet = await createAAWallet(wallet.address, network);

      const saveWalletPayload = {
        walletName: walletName,
        wallets: [wallet.address],
        wallet: createdSmartWallet,
        network,
      };

      //saving wallet to database
      const savedWallet = await saveSmartWalletInDatabase(saveWalletPayload);
      console.log(savedWallet);
      return res.status(200).send({
        data: savedWallet,
        message: "Successfully created AA wallet",
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }

  public async createWallet(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("error");
      }

      const { walletName } = req.body;

      if (!walletName) throw new Error("Please enter wallet name");

      const result = await detectDevice(req, res, next);

      if (!result) throw new Error("couldn't find a device");

      //TODO : need to check device type. create wallet only happens in mobile device
      const device = await addDeviceInCreateWallet(req.user.id, result);

      // Create a new wallet
      const createdWallet = createEOAWallet();

      const saveWalletPayload = {
        userId: req.user.id,
        walletName: walletName,
        // wallet: createdWallet,
        walletAddress: createdWallet.address,
        deviceId: device.id,
      };

      //saving wallet to database
      await saveWalletInDatabase(saveWalletPayload);

      res.status(200).send({
        data: {
          seedPhrase: createdWallet.salt,
          userId: req.user.id,
          walletAddress: createdWallet.address,
        },
        message: "EOA wallet Successfully created",
      });
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

      // const { type, sendTo, amount, from, network, standard, tokenAddress } =
      //   req.body;

      const { type, sendTo, amount, from, network, tokenAddress } = req.body;

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
        standard: "native",
        tokenAddress,
      };

      const receipt =
        type === "EOA" ? await transfer(payload) : await transferAA(payload);

      if (type === "AA") {
        const userEmails = await getUserEmailFromOwners(from);

        const txn = await prisma.transaction.create({
          data: {
            useropHash: receipt.useropHash,
            data: receipt.data,
            type: type,
            from: from,
            to: sendTo,
            amount,
          },
        });

        const emailResponse = await sendEmail({
          receivers: userEmails,
          template_name: "request-transaction-approval",
          txnId: txn.id,
        });
        if (emailResponse) {
          res.status(200).send({
            message: "Mail has been sent ",
          });
        }
      }

      // if (type === "EOA") {const receipt = await transfer(payload)return res.status(200).send(receipt)}
      // else if (type === "AA") {const receipt = await transferAA(payload)eturn res.status(200).send(receipt)
      // } else {throw new AppError("invalid type", 401)] }
    } catch (err) {
      next(err);
    }
  }

  public async initiateAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { action_type } = req.params;

      if (action_type === "send_transaction") {
        if (!req.user) {
          throw new Error("error");
        }

        const { sendTo, amount, from, network, tokenAddress } = req.body;

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
          standard: "native",
          tokenAddress: "",
        };

        const receipt = await transferAA(payload);

        const userEmails = await getUserEmailFromOwners(from);

        const txn = await prisma.transaction.create({
          data: {
            useropHash: receipt.useropHash,
            data: receipt.data,
            from: from,
            to: sendTo,
            amount,
          },
        });

        const emailResponse = await sendEmail({
          receivers: userEmails,
          template_name: "request-transaction-approval",
          txnId: txn.id,
        });
        if (emailResponse) {
          res.status(200).send({
            message: "Mail has been sent ",
          });
        }
      } else {
        throw new Error("invalid action type!");
      }
    } catch (error) {}
  }

  public async getTxnDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { transaction_id } = req.params;

      // const txn = await getTransactionsById(transaction_id);

      const txn = await prisma.transaction.findUnique({
        where: {
          id: transaction_id,
        },
      });

      return res.status(200).send(txn);
    } catch (err) {
      next(err);
    }
  }

  public async getTokenBalance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { address, token_address } = req.params;
      const { network } = req.body;

      // const provider = getProvider(network);

      // const tokenContract = new ethers.Contract(
      //   token_address,
      //   tokenAbi,
      //   provider
      // );

      // const balance = await tokenContract.balanceOf(address);

      const blnce = await getTokenBlnce({ address, token_address, network });
      console.log("nalance : ", blnce);

      return res.status(200).send(blnce);
    } catch (err) {
      next(err);
    }
  }

  public async transferToken(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new Error("error");
      }

      const { type, sendTo, amount, from, network, tokenAddress } = req.body;

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
        standard: "stable",
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

      // if (!wallet) {
      //   throw new Error("no wallet");
      // }

      // const signerWallet = getSignerWallet(
      //   // wallet.privateKey as IEncryptedData,
      //   wallet.address,
      //   network
      // );

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

      // await addGuardian(signerWallet, walletAddress, guardian);

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
      // if (!wallet) {
      //   throw new Error("no wallet");
      // }

      // const signerWallet = getSignerWallet(
      //   // wallet.privateKey as IEncryptedData,
      //   wallet.address,
      //   network
      // );

      // const tx = await removeGuardian(signerWallet, walletAddress, guardian);

      await prisma.guardian.deleteMany({
        where: {
          guardianAddress: guardian,
          wallet: walletAddress,
        },
      });

      return res.status(200).send("tx");
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
        // wallet.privateKey as IEncryptedData,
        wallet.address,
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
        // wallet.privateKey as IEncryptedData,
        wallet.address,
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

      // if (trueCount > falseCount) {
      //   const res = await prisma.smartWallet.update({
      //     where: {
      //       address: walletAddress,
      //     },
      //     data: {
      //       walletId: getWalletResponse.id,
      //     },
      //   });
      // }

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
      // if (!wallet) throw new Error("no wallet");

      // const signerWallet = getSignerWallet(
      //   // wallet.privateKey as IEncryptedData,
      //   wallet.address,
      //   network
      // );

      // const tx = await cancelRecovery(signerWallet, walletAddress);

      return res.status(200).send("tx");
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
      const network = "mumbai";
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

      // if (!wallet) throw new Error("no wallet");

      // const signerWallet = getSignerWallet(
      //   // wallet.privateKey as IEncryptedData,
      //   wallet.address,
      //   network
      // );

      // const tx = await getRecoveryStatus(signerWallet, walletAddress);

      // console.log("tx : ", tx);

      return res.status(200).send("tx");
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

  public async signTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new Error("error");
      }

      const { transaction_id } = req.params;
      const { signature } = req.body;

      const txn = await prisma.transaction.findUnique({
        where: {
          id: transaction_id,
          transactionStatus: 0,
        },
      });

      if (!txn) {
        throw new AppError("Transaction not found", 404);
      }

      //check wether user already signed or not
      if (txn.signatures.includes(signature))
        throw new AppError("User already signed", 404);

      // update signature
      await prisma.transaction.update({
        where: {
          id: transaction_id,
        },
        data: {
          signatures: {
            push: [signature],
          },
        },
      });

      const threshold = await getThreshold(txn.from);

      const { signatures }: any = await prisma.transaction.findUnique({
        where: {
          id: transaction_id,
        },
        select: {
          signatures: true,
        },
      });

      if (signatures.length >= threshold) {
        let allSignatures :any = [];

        for (let i = 0; i < signatures.length; i++) {
          allSignatures.push(signatures[i]);
        }

        await executeTransaction(txn.data, allSignatures);

        await prisma.transaction.update({
          where: {
            id: transaction_id,
          },
          data: {
            transactionStatus: 1,
          },
        });

        const userEmails = await getUserEmailFromOwners(txn.from);

        const emailResponse = await sendEmail({
          receivers: userEmails,
          template_name: "transaction-executed",
          txnId: transaction_id,
        });

        if (emailResponse) {
          res.status(200).send({
            message: "A mail has been sent ",
          });
        }
      } else {
        return res.status(200).send("updateTxn");
      }
    } catch (err) {
      next(err);
    }
  }
}
