import DeviceDetector from "node-device-detector";

const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
});

export const detectDevice = async (userAgent: string) => {
  try {
    // const userAgent =
    //   "Mozilla/5.0 (Linux; Android 5.0; NX505J Build/KVT49L) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.78 Mobile Safari/537.36";
    const device = detector.detect(userAgent);
    return device;
    // if (device) {
    //   return device;
    // }
  } catch (error) {
    throw new Error(error.message);
  }
};
