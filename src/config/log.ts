import logger from "../services/winston";


export const logDirPath = "./log"//process.env.LOG_DIR || './logs';
// console.log("logDirPath")
// console.log(logDirPath)

export const morganOption = {
    stream: {
        write: function (message: string): void {
            logger.info(message.trim());
        }
    }
};