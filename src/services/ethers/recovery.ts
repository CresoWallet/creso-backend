import { ethers } from "ethers";
import { getWalletContract } from "./main";

export const addGuardian = async (
  signer: ethers.Wallet,
  walletAddress: string,
  guardian: string
) => {
  const smartWalletContract = getWalletContract(walletAddress);
  const tx = await smartWalletContract.addGuardian(guardian);
  return await tx.wait();
};
export const removeGuardian = async (
  signer: ethers.Wallet,
  walletAddress: string,
  guardian: string
) => {
  const smartWalletContract = getWalletContract(walletAddress);

  const tx = await smartWalletContract.removeGuardian(guardian);
  return await tx.wait();
};
export const startRecovery = async (
  signer: ethers.Wallet,
  walletAddress: string,
  proposedNewOwner: string
) => {
  const smartWalletContract = getWalletContract(walletAddress);

  const tx = await smartWalletContract.startRecovery(proposedNewOwner);

  return await tx.wait();
};
export const confirmRecovery = async (
  signer: ethers.Wallet,
  walletAddress: string
) => {
  const smartWalletContract = getWalletContract(walletAddress);

  const tx = await smartWalletContract.confirmRecovery();
  return await tx.wait();
};

export const cancelRecovery = async (
  signer: ethers.Wallet,
  walletAddress: string
) => {
  const smartWalletContract = getWalletContract(walletAddress);

  const tx = await smartWalletContract.cancelRecovery();
  return await tx.wait();
};

export const getRecoveryStatus = async (
  provider: any,
  walletAddress: string
) => {
  const smartWalletContract = getWalletContract(walletAddress);

  const isRecoveryActive = await smartWalletContract.recoveryActive.call();
  const recoveryTimeLock = await smartWalletContract.recoveryTimeLock.call();
  const recoveryInitiatedTime =
    await smartWalletContract.recoveryInitiatedTime.call();
  const requiredConfirmations =
    await smartWalletContract.requiredConfirmations.call();
  const recoveryConfirmation = await smartWalletContract.recoveryConfirmation(
    walletAddress
  );

  const data = {
    isRecoveryActive,
    recoveryTimeLock: recoveryTimeLock.toNumber(),
    recoveryInitiatedTime: recoveryInitiatedTime.toNumber(),
    requiredConfirmations: requiredConfirmations.toNumber(),
    recoveryConfirmation,
  };

  return data;
};

export const getRecoveryConfirmations = async (
  signer: ethers.Wallet,
  walletAddress: string,
  guardianAddresses: any
) => {
  const smartWalletContract = getWalletContract(walletAddress);

  var confirmedArray = [];
  for (var i = 0; i < guardianAddresses.length; i++) {
    const recoveryConfirmation = await smartWalletContract.recoveryConfirmation(
      guardianAddresses[i]
    );

    confirmedArray.push(recoveryConfirmation);
  }

  return confirmedArray;
};

export const getProposedAddress = async (
  signer: ethers.Wallet,
  walletAddress: string
) => {
  const smartWalletContract = getWalletContract(walletAddress);

  const newAddress = await smartWalletContract.proposedNewOwner.call();

  return newAddress;
};

export const retrieveGuardians = async (
  signer: ethers.Wallet,
  walletAddress: string
) => {
  const smartWalletContract = getWalletContract(walletAddress);

  // console.log("smartWalletContract : ", smartWalletContract);

  const tx = await smartWalletContract.removeGuardian(
    "0x86Da19A1032806c08D5D28782FA5e89a3033d888"
  );
  // const tx = await smartWalletContract.guardians(100);
  // const tx = await smartWalletContract.recoveryActive.call();
  // console.log("txxxx : ", tx);
  // return await tx.wait();
};
