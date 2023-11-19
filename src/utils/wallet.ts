import { ethers } from "ethers";
import crypto from "crypto"


export const generateSalt = () => {
    // Use a combination of the user's ID and the current timestamp.
    // You can also add additional unique data to further ensure uniqueness.
    const uniqueData = `${'CRESO'}-${new Date().getTime()}-${generateRandomBits()}`;
    // Create a hash of the unique data to use as the salt.
    const salt = ethers.utils.id(uniqueData);
    return salt;
}


const generateRandomBits = (): string => {
    return crypto.randomBytes(16).toString('hex');
}


