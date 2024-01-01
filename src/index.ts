import 'dotenv/config'

import { createApp } from "./app";
import logger from './services/winston';

import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()


const main = async () => {
  //connect to mongodb
  //  ConnectMongodb();


  const app = createApp();

  // const httpServer = createServer(app);

  let PORT = process.env.PORT || "8080";
  app.listen(parseInt(PORT), () => {
    logger.info(`server started on localhost:${PORT}`);
  });

  // httpServer.timeout = 20 * 60 * 1000; // Set timeout to 20 minutes

};


main().catch((err) => {
  logger.error(err);
});
