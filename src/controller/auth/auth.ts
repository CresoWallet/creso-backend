import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";
import AppError from "../../errors/app";
import { prisma, saveSmartWalletInDatabase } from "../../services/prisma";
import bcrypt from 'bcrypt'
import { createAAWallet, createEOAWallet } from "../../services/ethers";
import { saveWalletInDatabase } from "../../services/prisma";
import { IEncryptedData } from "../../utils/encrpt";

export class AuthController {


  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password } = req.body;
      const network = "ethereum"
      if (!username || !email || !password) {
        throw new AppError("Missing Fields", 404);
        //return new NextResponse('Missing Fields', { status: 400 })
      }

      const exist = await prisma.user.findUnique({
        where: {
          email
        }
      });

      if (exist) {
        throw new Error('Email already exists')
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword
        }
      });

      // Create a new wallet
      const createdWallet = createEOAWallet()

      const saveWalletPayload = {
        userId: user.id,
        walletName: "main",
        wallet: createdWallet
      }

      //saving wallet to database
      const savedWallet = await saveWalletInDatabase(saveWalletPayload)

      const createdSmartWallet = await createAAWallet(savedWallet.privateKey as IEncryptedData, network)


      const saveWSmartalletPayload = {
        userId: user.id,
        walletName: "main",
        walletId: savedWallet.id,
        wallet: createdSmartWallet
      }

      //saving wallet to database
      const savedSmartWallet = await saveSmartWalletInDatabase(saveWSmartalletPayload)



      res.status(200).send(user);

    } catch (err: any) {
      next(err)
    }
  }


  public async login(req: Request, res: Response, next: NextFunction) {
    try {

      const { email, password } = req.body;
      if (!email || !password) {
        throw new AppError("Missing Fields", 404);
        //return new NextResponse('Missing Fields', { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: {
          email
        }
      });

      if (!user) {
        throw new Error("user doesn't exists")
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error("invalid credentials")
      }

      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
      }

      const token = jwt.sign(
        {
          payload
        },
        JWT_SECRET,
        { expiresIn: "1d" }
      );


      res.status(200).send({ token, user: payload });

    } catch (err: any) {
      next(err)
    }

  }


  public async authenticate(req: Request, res: Response) {
    try {

      if (!req.user) {
        throw new Error("not authenticated")
      }

      return res.status(200).send({ user: req.user });

    } catch (error) {
      res.status(500).send({
        message: "error",
        error: error,
      });
    }
  };



  // public async getAuthenticatedUser(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     if (req.user === undefined) {
  //       throw new AppError("No user found", 404);
  //     }

  //     const user = await User.findById(req.user.id);

  //     res.status(200).send(user);
  //     //  const user = await User.findById(req.user.id)
  //   } catch (err: any) {
  //     next(err)
  //   }
  // }

  // public async verifyAuthenticatedUser(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     if (req.params.key === undefined) {
  //       throw new Error("no key found");
  //     }

  //     let authToken;

  //     // Try finding the auth token up to 5 times with 1 second delay between attempts
  //     for (let i = 0; i < 5; i++) {
  //       authToken = await AuthToken.findOne({ deviceId: req.params.key });
  //       if (authToken) {
  //         break;
  //       } else {
  //         await new Promise((resolve) => setTimeout(resolve, 1000));
  //       }
  //     }

  //     if (!authToken) {
  //       throw new Error("auth token not found after 5 attempts");
  //     }

  //     // Deleting the document
  //     await AuthToken.deleteOne({ deviceId: req.params.key });

  //     res.redirect(CLIENT_URL + "/auth?token=" + authToken.token);
  //   } catch (err: any) {
  //     res.redirect(CLIENT_URL + "/auth?error=" + err.message);
  //   }
  // }




  // export const authUser = async (address: string, issued_user_token: string) => {
  //   let user = await User.findOne({ publicAddress: address });
  //   if (!user) {
  //     const newUser = new User({
  //       publicAddress: address,
  //     });

  //     user = await newUser.save();
  //   }

  //   const token = jwt.sign(
  //     {
  //       payload: {
  //         publicAddress: user.publicAddress,
  //         id: user._id,
  //         issued_user_token,
  //       },
  //     },
  //     JWT_SECRET,
  //     { expiresIn: "1d" }
  //   );

  //   return token;
};
