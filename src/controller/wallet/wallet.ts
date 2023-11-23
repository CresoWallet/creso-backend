import { NextFunction, Request, Response } from "express";
import { getAllWallets, getMainWallet, prisma, saveSmartWalletInDatabase, saveWalletInDatabase } from "../../services/prisma";
import { ITransferPayload, createAAWallet, createEOAWallet, getHistroy, transfer, transferAA } from "../../services/ethers";
// import AppError from "../../errors/app";
import { IEncryptedData, decryptKey, encryptKeyWithPassword } from "../../utils/encrpt";


export class WalletController {


    public async getWallet(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new Error("error")
            }
            const wallets = await getAllWallets(req.user.id)

            return res.status(200).send(wallets)

        } catch (err: any) {
            next(err)
        }
    }
    public async backupWallet(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new Error("error")
            }
            const { passkey } = req.body


            const wallet = await getMainWallet(req.user.id)
            if (!wallet) throw new Error("no main wallet")
            const walletKey = decryptKey(wallet.privateKey as IEncryptedData)

            const encrptedFile = await encryptKeyWithPassword(walletKey, passkey)

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

            return res.status(200).send(encrptedFile)

        } catch (err: any) {
            next(err)
        }
    }

    public async getAssetBalance(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new Error("error")
            }
            return res.status(200).send({

            })

        } catch (err: any) {
            next(err)
        }
    }


    public async getHistory(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new Error("error")
            }

            const { address, network } = req.body
            //validation
            if (!address || !network) {
                throw new Error("field invalid")

            }
            const history = getHistroy(address, network)
            return res.status(200).send(history)

        } catch (err: any) {
            next(err)
        }
    }




    public async createSmartWallet(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new Error("error")
            }
            const { address, walletName, network } = req.body
            //TODO: validation for walletName only passing string without space
            if (!address || !walletName) {
                throw new Error("fill the fields")
            }

            const wallet = await prisma.wallet.findFirst({
                where: {
                    userId: req.user.id,
                    address
                }
            });

            if (!wallet) {
                throw new Error("no wallet")
            }

            const createdSmartWallet = await createAAWallet(wallet.privateKey as IEncryptedData, network)


            const saveWalletPayload = {
                userId: req.user.id,
                walletName: walletName,
                walletId: wallet.id,
                wallet: createdSmartWallet
            }

            //saving wallet to database
            const savedWallet = await saveSmartWalletInDatabase(saveWalletPayload)

            return res.status(200).send(savedWallet)
        } catch (err) {
            next(err)
        }
    }



    public async createWallet(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new Error("error")
            }
            const { walletName } = req.body

            // Create a new wallet
            const createdWallet = createEOAWallet()

            const saveWalletPayload = {
                userId: req.user.id,
                walletName: walletName,
                wallet: createdWallet
            }

            //saving wallet to database
            const savedWallet = await saveWalletInDatabase(saveWalletPayload)


            return res.status(200).send(savedWallet)
        } catch (err) {
            next(err)
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
     * } 
     * @returns 
     */
    public async makeTransfer(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new Error("error")
            }

            const { type, sendTo, amount, from, network, standard, tokenAddress } = req.body

            //validation
            if (!from) {
                throw new Error("invalid request")
            }

            const payload: ITransferPayload = {
                userId: req.user.id,
                sendTo,
                amount,
                from,
                network,
                standard,
                tokenAddress
            }

            const receipt = type === "EOA" ? await transfer(payload) : await transferAA(payload)

            return res.status(200).send(receipt)


            // if (type === "EOA") {const receipt = await transfer(payload)return res.status(200).send(receipt)} 
            // else if (type === "AA") {const receipt = await transferAA(payload)eturn res.status(200).send(receipt)
            // } else {throw new AppError("invalid type", 401)] }



        } catch (err) {
            next(err)
        }
    }



    public async testApi(req: Request, res: Response, next: NextFunction) {

        // const salt = generateSalt()

        // console.log(salt)

        // const encrpteddata = encryptKey("<data>")

        // const data = decryptKey(encrpteddata)
        const histroy = await getHistroy("0x87755F6E6D57895a291d4361BAF421Fd57d6Eb6F", "goerli")


        // const wallet = await getSmartWalletByAddress("655113266f85b67fbf3b18ee", "0x14373B01C51C18cA5488639eE3a9E03ad2805fE5")



        res.send({ histroy })
    }


};

