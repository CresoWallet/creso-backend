import { NextFunction, Request, Response } from "express";
import AppError from "../../errors/app";
import { prisma, saveSmartWalletInDatabase } from "../../services/prisma";
import bcrypt from "bcrypt";
import { createAAWallet, createEOAWallet } from "../../services/ethers";
import { saveWalletInDatabase } from "../../services/prisma";
import { IEncryptedData, generateJWT } from "../../utils/encrpt";
import { CLIENT_URL } from "../../config";
import { AUTH_TOKEN, isProd } from "../../constant";
import { generatedOTP } from "../../utils/generateOTP";
import { getMailOptions, getTransporter } from "../../services/email";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password } = req.body;
      const network = "goerli";
      if (!username || !email || !password) {
        throw new AppError("Missing Fields", 404);
        //return new NextResponse('Missing Fields', { status: 400 })
      }

      const exist = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (exist) {
        throw new Error("Email already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
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
        network
      );

      const saveWSmartalletPayload = {
        userId: user.id,
        walletName: "smart_wallet",
        walletId: savedWallet.id,
        wallet: createdSmartWallet,
      };

      //saving wallet to database
      await saveSmartWalletInDatabase(saveWSmartalletPayload);

      res.status(200).send(user);
    } catch (err: any) {
      next(err);
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
          email,
        },
      });

      if (!user || !user.password) {
        throw new Error("user doesn't exists");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error("invalid credentials");
      }

      const payload = {
        id: user.id,
        username: user.username,
        email: user.email || "",
      };

      const token = generateJWT(payload);

      const tokenExpiryTime = 24 * 60 * 60 * 60;

      //isProd
      res.cookie(AUTH_TOKEN, token, {
        httpOnly: false, // The cookie is not accessible via JavaScript
        secure: isProd ? true : false, // Cookie is sent over HTTPS only
        sameSite: isProd ? 'none' : 'lax', // Cookie is not sent with cross-site requests
        maxAge: tokenExpiryTime, // Set the cookie's expiration time
      });

      // res.cookie("house_user", "token");
      // res.status(200).send("Logged in successfully");

      res.status(200).send({ token, user: payload });
    } catch (err: any) {
      next(err);
    }
  }

  public async loginTwitter(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        throw new Error("");
      }

      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      const token = generateJWT(payload);

      const tokenExpiryTime = 24 * 60 * 60 * 60;

      res.cookie(AUTH_TOKEN, token,
        {
          httpOnly: false, // The cookie is not accessible via JavaScript
          secure: isProd ? true : false, // Cookie is sent over HTTPS only
          sameSite: isProd ? 'none' : 'lax', // Cookie is not sent with cross-site requests
          maxAge: tokenExpiryTime, // Set the cookie's expiration time
        }); // Sets it as a cookie
      res.redirect(CLIENT_URL + "/dashboard"); // Redirect to the frontend
    } catch (error) {
      res.status(500).send({
        message: "error",
        error: error,
      });
    }
  }
  public async logout(req: Request, res: Response) {
    try {
      res.cookie(AUTH_TOKEN, "", {
        httpOnly: false,
        expires: new Date(0), // Set to a past date to invalidate the cookie
      });
      res.status(200).send("Logged out successfully");
    } catch (error) {
      res.status(500).send({
        message: "error",
        error: error,
      });
    }
  }
  public async authenticate(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new Error("not authenticated");
      }

      console.log("req : ", req.user.id);

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      console.log("user : ", user);

      return res.status(200).send({ user });
    } catch (error) {
      console.log("error : ", error);
      res.status(500).send({
        message: "error",
        error: error,
      });
    }
  }

  public async sendOTPMail(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;

    const transporter = getTransporter();

    const mailOptions = getMailOptions({
      to: email as any,
      subject: "OTP verification",
      text: `Here is the verification code. Please copy it and verify your Email ${generatedOTP}`,
    });

    //TODO: create a encrypted token
    const token = jwt.sign(
      {
        email,
        generatedOTP,
        expireAt: new Date().getTime() + 5 * 60000,
      },
      JWT_SECRET
    );

    try {
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          res.status(400).send({ message: "Error sending OTP email" });
        } else {
          res.status(200).send({
            message: "A OTP mail has been sent ",
            token: token,
          });
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  public async verifyOTP(req: Request, res: Response, next: NextFunction) {
    const { otp, token, email } = req.body;

    try {
      const { expireAt, generatedOTP }: any = await jwt.verify(
        token,
        JWT_SECRET
      );

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        throw new Error("Email doesn't exists");
      }

      if (user.isEmailVerified) {
        throw new Error("Email already verified");
      }

      if (new Date().getTime() > expireAt) {
        res.status(400).send({ message: "OTP expired" });
      } else if (otp === generatedOTP) {
        user.isEmailVerified = true;
        await prisma.user.update({
          where: {
            email: email,
          },
          data: {
            isEmailVerified: true,
          },
        });
        res.status(200).send({ message: "Email verified." });
      } else {
        res.status(400).send({ message: "Invalid OTP" });
      }
    } catch (error) {
      next(error);
    }
  }

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
}
