import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
// import path from "path";
import morgan from "morgan";
import { auth, wallet } from "./routes";
import { notFound, serverError } from "./middleware";
import { morganOption, IN_PROD } from "./config";
import passport from "passport";
import session from "express-session";
import "./config/passport";

export const createApp = () => {
  const app = express();

  app.use(morgan("combined", morganOption));

  //config
  app.use(cors({
    origin: 'https://creso-wallet.vercel.app', // Client's URL
    credentials: true
  }));  //app.use(express.json());
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
  app.use(bodyParser.json({ limit: "50mb" }));

  // app.use(express.static(path.join(__dirname, "public")));

  app.use(
    session({
      secret: "my serect dudee",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  //routers
  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).send({
      name: "CRESO Server v1",
      message: "online",
      prod: IN_PROD,
    });
  });

  app.use("/api", auth);
  app.use("/api", wallet);

  // app.get('*', (req, res) => {
  //   res.sendFile(path.join(__dirname, 'public', 'index.html'));
  // })

  //error handles
  app.use(notFound);
  app.use(serverError);

  return app;
};
