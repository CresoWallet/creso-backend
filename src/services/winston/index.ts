// import { logDirPath } from '../../config';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from "path";

// console.log(logDirPath)
const logDirPath = path.join(__dirname, "logs")

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    //CRESO
    defaultMeta: { service: 'creso-api' },
    transports: [
        new winston.transports.File({ filename: `${logDirPath}/error.log`, level: 'error' }),
        new DailyRotateFile({
            filename: `${logDirPath}/combined-%DATE%.log`, // This will create a log file like "combined-2023-10-09.log"
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true, // This will zip the archived log files
            maxSize: '20m',      // You can set a maximum size for the log file, after which it will rotate
            maxFiles: '14d'      // You can set a retention policy, like retaining logs for 14 days
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.simple()
        )
    }));
}

export default logger;
