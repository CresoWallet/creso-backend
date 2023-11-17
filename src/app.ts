import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
// import path from "path";
import morgan from "morgan";
import { auth, wallet } from "./routes";
import { notFound, serverError } from "./middleware";
import { morganOption, corsOptions, IN_PROD } from "./config";
import passport from "passport";
import session from 'express-session';

export const createApp = () => {
  const app = express();


  app.use(morgan('combined', morganOption));

  //config
  app.use(cors(corsOptions));
  //app.use(express.json());
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
  app.use(bodyParser.json({ limit: '50mb' }));

  // app.use(express.static(path.join(__dirname, "public")));

  app.use(session({ secret: 'your_secret', resave: true, saveUninitialized: true }));
  app.use(passport.initialize());
  app.use(passport.session());


  //routers
  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).send({
      name: "CRESO Server v1",
      message: "online",
      prod: IN_PROD
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
