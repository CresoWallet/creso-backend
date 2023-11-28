import { ethers } from "ethers";
import { getWalletContract } from "./main";

export const addGuardian = async (
  signer: ethers.Wallet,
  walletAddress: string,
  guardian: string
) => {
  const smartWalletContract = getWalletContract(signer, walletAddress);
  const tx = await smartWalletContract.addGuardian(guardian);
  return await tx.wait();
};
export const removeGuardian = async (
  signer: ethers.Wallet,
  walletAddress: string,
  guardian: string
) => {
  const smartWalletContract = getWalletContract(signer, walletAddress);

  const tx = await smartWalletContract.removeGuardian(guardian);
  return await tx.wait();
};
export const startRecovery = async (
  signer: ethers.Wallet,
  walletAddress: string,
  proposedNewOwner: string
) => {
  const smartWalletContract = getWalletContract(signer, walletAddress);

  const tx = await smartWalletContract.startRecovery(proposedNewOwner);
  return await tx.wait();
};
export const confirmRecovery = async (
  signer: ethers.Wallet,
  walletAddress: string
) => {
  const smartWalletContract = getWalletContract(signer, walletAddress);

  const tx = await smartWalletContract.confirmRecovery();
  return await tx.wait();
};
export const cancelRecovery = async (
  signer: ethers.Wallet,
  walletAddress: string
) => {
  const smartWalletContract = getWalletContract(signer, walletAddress);

  const tx = await smartWalletContract.cancelRecovery();
  return await tx.wait();
};
