import { NextFunction, Request, Response } from "express";
import AppError from "../../errors/app";
import { prisma, saveSmartWalletInDatabase } from "../../services/prisma";
import bcrypt from "bcrypt";
import { createAAWallet, createEOAWallet } from "../../services/ethers";
import { saveWalletInDatabase } from "../../services/prisma";
import { IEncryptedData, generateJWT } from "../../utils/encrpt";
import { CLIENT_URL } from "../../config";
import { AUTH_TOKEN, DEFAULT_NETWORK, isProd } from "../../constant";
import { sendOtp } from "../../utils/sendOtp";
import {
  // getMailOptions,
  // getTransporter,
  sendEmail,
} from "../../services/email";

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      req.body = { ...req.body, email: req.body.email.toLowerCase() };

      const { username, email, password } = req.body;

      if (!username || !email || !password)
        throw new AppError("Missing Fields", 404);

      const exist = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (exist) throw new AppError("Email already exists", 404);

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
      });

      // Create a new wallet
      // const createdWallet = createEOAWallet();

      // const saveWalletPayload = {
      //   userId: user.id,
      //   walletName: "main_wallet",
      //   wallet: createdWallet,
      // };

      //saving wallet to database
      // const savedWallet = await saveWalletInDatabase(saveWalletPayload);

      // const createdSmartWallet = await createAAWallet(
      //   savedWallet.privateKey as IEncryptedData,
      //   DEFAULT_NETWORK
      // );

      // const saveWSmartalletPayload = {
      //   walletName: "smart_wallet",
      //   walletId: savedWallet.id,
      //   wallet: createdSmartWallet,
      //   network: DEFAULT_NETWORK,
      // };

      // //saving wallet to database
      // await saveSmartWalletInDatabase(saveWSmartalletPayload);

      // const payload = {
      //   id: user.id,
      //   username: username,
      //   email: email || "",
      // };

      // const token = generateJWT(payload);

      await sendOtp({ email });

      res.status(200).send({
        // data: { token, userId: user.id },
        message: `Otp email sent to ${email}`,
      });
    } catch (err: any) {
      next(err);
    }
  }

  public async verifyEmail(req: Request, res: Response, next: NextFunction) {
    const { otp, email } = req.body;
    // const email = req.user?.email;

    try {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        throw new Error("Email doesn't exists");
      }

      if (user && user.isEmailVerified) {
        throw new Error("Email already verified");
      }

      const verification = await prisma.verification.findUnique({
        where: {
          email,
        },
      });

      if (!verification) {
        throw new Error("Email doesn't exists");
      }

      if (new Date().getTime() > +verification.expireAt) {
        res.status(400).send({ message: "OTP expired" });
      } else if (otp == verification.otp) {
        user.isEmailVerified = true;
        await prisma.user.update({
          where: {
            email: email,
          },
          data: {
            isEmailVerified: true,
          },
        });

        const payload = {
          id: user.id,
          username: user.username,
          email: email || "",
        };

        const token = generateJWT(payload);

        res.status(200).send({
          data: {
            token,
          },
          message: "Email verified.",
        });
      } else {
        res.status(400).send({ message: "Invalid OTP" });
      }
    } catch (error) {
      next(error);
    }
  }

  public async resendOtp(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body;
    try {
      // const email = req.user?.email;

      if (!email) throw new AppError("User doesn't have email", 404);
      await sendOtp({ email });
      res.status(200).send({ message: "Email sent." });
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      req.body = { ...req.body, email: req.body.email.toLowerCase() };

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
        // throw new Error("user doesn't exists");
        throw new AppError("User doesn't exists", 404);
      }

      if (user.isEmailVerified === false)
        throw new AppError("User email has not been verified yet!", 404);

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) throw new AppError("Invalid credentials", 404);

      const payload = {
        id: user.id,
        username: user.username,
        email: user.email || "",
      };

      const token = generateJWT(payload);

      // const tokenExpiryTime = 24 * 60 * 60 * 60;

      //isProd
      // res.cookie(AUTH_TOKEN, token, {
      //   httpOnly: false, // The cookie is not accessible via JavaScript
      //   secure: isProd ? true : false, // Cookie is sent over HTTPS only
      //   sameSite: isProd ? "none" : "lax", // Cookie is not sent with cross-site requests
      //   maxAge: tokenExpiryTime, // Set the cookie's expiration time
      // });

      // res.cookie("house_user", "token");
      // res.status(200).send("Logged in successfully");

      res.status(200).send({
        data: { token, userId: user.id },
        message: "Successfully logged in",
      });
    } catch (err: any) {
      next(err);
    }
  }

  public async socialLogin(req: Request, res: Response) {
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

      // const tokenExpiryTime = 24 * 60 * 60 * 60;

      // res.cookie(AUTH_TOKEN, token, {
      //   httpOnly: false, // The cookie is not accessible via JavaScript
      //   secure: isProd ? true : false, // Cookie is sent over HTTPS only
      //   sameSite: isProd ? "none" : "lax", // Cookie is not sent with cross-site requests
      //   maxAge: tokenExpiryTime, // Set the cookie's expiration time
      // }); // Sets it as a cookie
      // res.redirect(CLIENT_URL + "/dashboard"); // Redirect to the frontend

      res.status(200).send({
        data: { token, userId: user.id },
        message: "Successfully logged in",
      });
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
        httpOnly: true, // Recommended for security
        secure: isProd ? true : false, // Match the setting from when the cookie was set
        sameSite: isProd ? "none" : "lax", // Match the setting from when the cookie was set
        expires: new Date(0), // Set to a past date to invalidate the cookie
        path: "/", // Match the path from when the cookie was set, if applicable
        // Add domain if it was set during cookie creation
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

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          isEmailVerified: true,
          email: true,
          username: true,
          id: true,
          registrationMethod: true,
        },
      });

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
    try {
      // const email = req.user?.email;

      if (!email) throw new AppError("User doesn't have email", 404);
      await sendOtp({ email });
      res.status(200).send({ message: "Email sent." });
    } catch (error) {
      next(error);
    }
    // const { username, email }: any = req.user;

    // // TODO: Do with a propper way
    // const emaill = email.toLowerCase();

    // if (!email) {
    //   throw new Error("Please provide a valid email!");
    // }
    // // const transporter = getTransporter();

    // // const otp: any = await generatedOTP();
    // const otp: any = 7849;

    // // const mailOptions = getMailOptions({
    // //   to: email as any,
    // //   subject: "OTP verification",
    // //   text: `Here is the verification code. Please copy it and verify your Email ${otp}`,
    // // });

    // try {
    //   await prisma.verification.upsert({
    //     where: {
    //       email: emaill,
    //     },
    //     update: {
    //       otp: +otp,
    //       expireAt: new Date(new Date().getTime() + 5 * 60000),
    //     },
    //     create: {
    //       email: emaill,
    //       otp: +otp,
    //       expireAt: new Date(new Date().getTime() + 5 * 60000),
    //     },
    //   });

    //   // send email
    //   // transporter.sendMail(mailOptions, function (error, info) {
    //   //   if (error) {
    //   //     res.status(400).send({ message: "Error sending OTP email" });
    //   //   } else {
    //   //     res.status(200).send({
    //   //       message: "A OTP mail has been sent ",
    //   //     });
    //   //   }
    //   // });

    //   // const receivers = ["mnnasik7@gmail.com"];

    //   const emailResponse = await sendEmail({
    //     receivers: [email],
    //     template_name: "otp-email",
    //     otp,
    //     receiverName: username,
    //   });
    //   if (emailResponse) {
    //     res.status(200).send({
    //       message: "A OTP mail has been sent ",
    //     });
    //   }
    // }
    // catch (error: any) {
    //   next(error);
    // }
  }

  public async verifyOTP(req: Request, res: Response, next: NextFunction) {
    const { otp } = req.body;
    const email = req.user?.email;

    //TODO : Do with a propper way
    const emaill = email?.toLowerCase();

    try {
      const user = await prisma.user.findUnique({
        where: {
          email: emaill,
        },
      });

      if (!user) {
        throw new Error("Email doesn't exists");
      }

      if (user && user.isEmailVerified) {
        throw new Error("Email already verified");
      }

      const verification = await prisma.verification.findUnique({
        where: {
          email: emaill,
        },
      });

      if (!verification) {
        throw new Error("Email doesn't exists");
      }

      if (new Date().getTime() > +verification.expireAt) {
        res.status(400).send({ message: "OTP expired" });
      } else if (otp == verification.otp) {
        user.isEmailVerified = true;
        await prisma.user.update({
          where: {
            email: emaill,
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

  public async enable2FA(req: Request, res: Response, next: NextFunction) {
    const { methods } = req.body;

    try {
      if (!req.user) throw new Error("not authenticated");

      const enabled2Fa = await prisma.security.upsert({
        where: {
          userId: req.user.id,
        },
        update: {
          securityMethod: { push: methods },
        },
        create: {
          userId: req.user.id,
          securityMethod: methods,
        },
      });

      res.status(200).send(enabled2Fa);
    } catch (err: any) {
      next(err);
    }
  }

  public async disable2FA(req: Request, res: Response, next: NextFunction) {
    const { methods } = req.body;
    const { id }: any = req.user;

    try {
      const security = await prisma.security.findUnique({
        where: {
          userId: id,
        },
        select: {
          securityMethod: true,
        },
      });

      if (!security)
        throw new Error(
          "Two-factor authentication is not enabled by the user!"
        );

      const filteredSecurityMethods = security.securityMethod.filter(
        (method) => !methods.includes(method)
      );

      const disable2Fa = await prisma.security.update({
        where: {
          userId: req.user?.id,
        },
        data: {
          securityMethod: filteredSecurityMethods,
        },
      });

      res.status(200).send(disable2Fa);
    } catch (err: any) {
      next(err);
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
