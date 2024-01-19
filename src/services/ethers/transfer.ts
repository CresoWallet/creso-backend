import { Contract, ethers } from "ethers";
import {
  IProviderName,
  getBundlerRPC,
  getEntryPointAddress,
  getProvider,
  getSignerWallet,
  getWalletContract,
  getWalletFactoryAddress,
} from "./main";
import { Client, Presets } from "userop";
import { getSmartWalletByAddress } from "../prisma/wallet";
import { IEncryptedData } from "../../utils/encrpt";
import { prisma } from "../prisma";
import { ERC20ABI } from "../../utils/ethers";

export interface ITransferPayload {
  userId: string;
  sendTo: string;
  amount: string; // The amount of ETH to send as a string, e.g., "0.1"
  from: string;
  network: IProviderName;
  standard: "native" | "stable";
  tokenAddress: string;
}

export const transfer = async ({
  userId,
  from,
  sendTo,
  amount,
  network,
  standard,
  tokenAddress,
}: ITransferPayload) => {
  //get the fromWallet
  const wallet = await prisma.wallet.findFirst({
    where: {
      userId: userId,
      address: from,
    },
  });
  if (!wallet) {
    throw new Error("couldn't find the wallet");
  }

  const signer = getSignerWallet(wallet.privateKey as IEncryptedData, network);

  //TODO: add some validation
  const value = ethers.utils.parseEther(amount);

  if (standard === "stable") {
    const tokenContract = new Contract(tokenAddress, ERC20ABI, signer);

    const txResponse = await tokenContract.transfer(sendTo, value);
    const receipt = await txResponse.wait(); // Wait for the transaction to be mined
    return receipt;
  } else {
    const transaction = {
      to: sendTo,
      value: value,
    };

    // Send the transaction
    const txResponse = await signer.sendTransaction(transaction);
    //TODO: if need to be more response. can send this to client side
    // and wait for it from client side
    const receipt = await txResponse.wait(); // Wait for the transaction to be mined
    return receipt;
  }
};

export async function transferAA({
  userId,
  from,
  network,
  amount,
  sendTo,
  standard,
  tokenAddress,
}: ITransferPayload) {
  // try {

  const wallet = await getSmartWalletByAddress(from);

  if (!wallet) throw new Error("no from wallet found");

  const signer = getSignerWallet(
    wallet.wallet.privateKey as IEncryptedData,
    network
  );
  const value = ethers.utils.parseEther(amount);

  const simpleAccount = await Presets.Builder.SimpleAccount.init(
    signer,
    getBundlerRPC(network),
    {
      entryPoint: getEntryPointAddress(network),
      factory: getWalletFactoryAddress(network),
      salt: wallet.salt,
    }
  );
  const client = await Client.init(getBundlerRPC(network), {
    entryPoint: getEntryPointAddress(network),
  });

  let txData = {
    to: sendTo,
    value,
    data: "0x",
  };

  if (standard === "stable") {
    const tokenContract = new Contract(tokenAddress, ERC20ABI, signer);

    const data = tokenContract.interface.encodeFunctionData("transfer", [
      sendTo,
      value,
    ]);
    txData.to = tokenAddress;
    txData.value = ethers.constants.Zero;
    txData.data = data;

    // const calls = [
    //     {
    //         to: tokenAddress,
    //         value: ethers.constants.Zero,
    //         data: data
    //     }
    // ];
  }

  // const target = ethers.utils.getAddress(t);
  const res = await client.sendUserOperation(
    simpleAccount.execute(txData.to, txData.value, txData.data),
    {
      onBuild: (op) => console.log("Signed UserOperation:", op),
    }
  );
  //   console.log(`UserOpHash: ${res.userOpHash}`);
  //   console.log("Waiting for transaction...");
  const ev = await res.wait();
  //   console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
  return ev;

  // } catch (err) {
  //     console.log(err)

  // }
}

// export async function transferEthUsingBundler(signer: ethers.Wallet, fromAddress: string, toAddress: string, amount: string) {

//     try {

//         const aaWallet = await getSmartWalletByAddress(fromAddress)

//         if (!aaWallet) throw new Error("no from wallet found")

//         const salt = decryptKey(aaWallet.salt as IEncryptedData)

//         const simpleAccount = await Presets.Builder.SimpleAccount.init(
//             signer,
//             BUNDLER_RPC_URL,
//             {
//                 entryPoint: ENTRY_POINT_ADDRESSS,
//                 factory: CL_WALLETFACTORY_ADDRESS,
//                 salt: salt
//             }
//         );
//         const client = await Client.init(BUNDLER_RPC_URL, {
//             entryPoint: ENTRY_POINT_ADDRESSS,
//         });

//         // const target = ethers.utils.getAddress(t);
//         const value = ethers.utils.parseEther(amount);
//         const res = await client.sendUserOperation(
//             simpleAccount.execute(toAddress, value, "0x"),
//             {
//                 onBuild: (op) => console.log("Signed UserOperation:", op),
//             }
//         );
//         console.log(`UserOpHash: ${res.userOpHash}`);

//         console.log("Waiting for transaction...");
//         const ev = await res.wait();
//         console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
//         return ev?.transactionHash

//     } catch (err) {
//         console.log(err)
//     }
// }

// This function transfers all ETH from the connected wallet to the `to` address.
export async function transferAllETH(
  wallet: ethers.Wallet,
  to: string
): Promise<any> {
  // Get the balance of the wallet
  const balance = await wallet.getBalance();

  // Estimate gas price
  const gasPrice = await wallet.getGasPrice();

  // Use a typical gas limit for a simple ETH transfer
  const gasLimit = ethers.utils.hexlify(21000);

  // Calculate the gas cost
  const gasCost = gasPrice.mul(gasLimit);

  // Calculate the amount to send by subtracting the gas cost from the balance
  const amountToSend = balance.sub(gasCost);

  // Ensure the balance can cover the gas cost
  if (amountToSend.lte(0)) {
    throw new Error("Balance is too low to cover gas costs");
  }

  // Send the transaction
  const tx = await wallet.sendTransaction({
    to: to,
    value: amountToSend,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
  });

  console.log("Transaction hash:", tx.hash);

  // Wait for the transaction to be mined
  await tx.wait();

  console.log("Transaction confirmed:", tx.hash);
  return tx.hash;
}

// This function sends a specified amount of ETH from the smart contract wallet to the specified address
export async function transferETHFromSmartWallet(
  signer: ethers.Wallet,
  from: string,
  toAddress: string,
  amount: string, // Amount in ether, e.g., '0.01' for 0.01 ETH
  networkName: IProviderName
): Promise<any> {
  try {
    // Initialize provider and wallet
    //
    const smartWalletContract = getWalletContract(signer, from);

    // Convert amount to wei
    const amountInWei = ethers.utils.parseEther(amount);

    // Estimate the gas price
    const gasPrice = await getProvider(networkName).getGasPrice();

    // Estimate the gas limit for the transaction
    const gasLimit = await smartWalletContract.estimateGas.execute(
      toAddress,
      amountInWei,
      "0x"
    );

    // Make sure the smart wallet has enough balance to cover the transfer and the gas cost
    const balance = await getProvider(networkName).getBalance(from);
    if (balance.lt(amountInWei.add(gasPrice.mul(gasLimit)))) {
      throw new Error(
        "The smart wallet does not have enough balance to cover the transfer and gas costs."
      );
    }

    // Execute transaction from the smart wallet to the target address
    const tx = await smartWalletContract.execute(
      toAddress, // to
      amountInWei, // value in wei
      "0x", // func (empty data for plain ETH transfer)
      {
        gasLimit: gasLimit,
        gasPrice: gasPrice,
      }
    );

    console.log(`Transaction hash: ${tx.hash}`);

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();

    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    return receipt;
  } catch (err) {
    console.log(err);
  }
}

// const client = await Client.init(BUNDLER_RPC_URL, {
//     entryPoint: ENTRY_POINT_ADDRESSS,
//     //overrideBundlerRpc:
// });

// // const walletFactoryContract = await getWalletFactoryContract(signer)

// // const computedAddress = await walletFactoryContract.getAddress(signer.getAddress(), aaWallet.salt);
// const isDeployed = (await etherProvider.getCode(fromAddress)) !== '0x';
// console.log("isDeployed: " + isDeployed)
// let initCode = '0x';
// let initCodeGas = 0;
// const block = await etherProvider.getBlock('latest');
// let baseFee = block.baseFeePerGas;
// if (!baseFee) return//add a base value
// const estimatedPriorityFee = ethers.utils.parseUnits('2', 'gwei');
// const maxFeePerGas = baseFee.add(estimatedPriorityFee);
// console.log("maxFeePerGas: " + maxFeePerGas)

// if (!isDeployed) {

//     const walletFactoryContratInterface = getContractInterface("WALLET_FACTORY")
//     let createAccountTx = walletFactoryContratInterface.encodeFunctionData('createAccount', [await signer.getAddress(), aaWallet.salt]);
//     initCode = ethers.utils.hexConcat([CL_WALLETFACTORY_ADDRESS, createAccountTx]);

// }

// let nonce = await entryPointContract.getNonce(aaWallet.publicKey, 0);

// console.log("Nonce: " + nonce)

// const builder = new UserOperationBuilder()
//     .useDefaults({
//         sender: fromAddress,
//         nonce,
//         initCode
//     })
//     // .setInitCode(initCode)
//     // .setPreVerificationGas('0xbb80') // Set a suitable pre-verification gas
//     .setMaxFeePerGas(maxFeePerGas) // Correctly set the max fee per gas
//     .setMaxPriorityFeePerGas(estimatedPriorityFee) // Set the max priority fee per gas
//     // .setVerificationGasLimit(BigInt(150000) + BigInt(initCode.length * 16)) // Example estimation

// console.log(builder)

// console.log("NOT END")

// // Use middleware to estimate preVerificationGas
// builder.useMiddleware(Presets.Middleware.estimateUserOperationGas(stackupProvider));

// console.log("MIDDLWARE END")
// // Call data to perform the ETH transfer
// // Add other UserOperation fields as necessary
// // .useMiddleware(/* custom middleware functions here */);
// // builder.setMaxFeePerGas(baseFee);

// // Building and sending the UserOperation
// //const userOp = await client.buildUserOperation(builder);
// // const userOp = await builder.buildOp(ENTRY_POINT_ADDRESSS, (await etherProvider.getNetwork()).chainId);
// // console.log("userOp")
// // console.log(userOp)
// // const response = await client.sendUserOperation(builder);

// // Waiting for the operation to be processed
// // const userOperationEvent = await response.wait();
// // console.log(userOperationEvent)
// // console.log(`UserOperation sent with hash: ${userOperationEvent?.transactionHash}`);

// const res = await client.sendUserOperation(builder.executeBatch(calls), {
//     onBuild: (op) => console.log("Signed UserOperation:", op),
//   });

//=====================
