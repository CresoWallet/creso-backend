import logger from "../services/winston";


export const logDirPath = '/usr/src/app/logs'
// console.log("logDirPath")
// console.log(logDirPath)

export const morganOption = {
    stream: {
        write: function (message: string): void {
            logger.info(message.trim());
        }
    }
};