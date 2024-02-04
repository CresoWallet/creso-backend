import { prisma } from "./main";

export const addDeviceInCreateWallet = async (userId: string, device: any) => {
  try {
    const findDevice = await prisma.device.findFirst({
      where: {
        userId,
        os: {
          equals: device?.os as any,
        },
        device: {
          equals: device?.device as any,
        },
        client: {
          equals: device?.client as any,
        },
      },
    });

    if (findDevice) {
      const updateDevice = await prisma.device.update({
        where: {
          id: findDevice.id,
        },
        data: {
          isEOALoggedIn: true,
        },
      });

      return updateDevice;
    }

    const addDevice = await prisma.device.create({
      data: {
        device: device.device as any,
        os: device.os as any,
        client: device.client as any,
        userId,
        isEOALoggedIn: true,
      },
    });

    return addDevice;
  } catch (error) {
    throw error;
  }
};
