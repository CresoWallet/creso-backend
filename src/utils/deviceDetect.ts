import { Request, Response, NextFunction } from "express";
import DeviceDetector from "node-device-detector";

const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
});

// const userAgent =
//     //   "Mozilla/5.0 (Linux; Android 5.0; NX505J Build/KVT49L) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.78 Mobile Safari/537.36";

export const detectDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userAgent = req.headers["user-agent"] || "";

    const device = detector.detect(userAgent);

    if (!device) throw new Error("couldn't find a device");

    return device;
  } catch (err: any) {
    next(err);
  }
};
