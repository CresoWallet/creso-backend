import axios from "axios";
import { ethers } from "ethers";
import { ENTRYPOINT, RPC_LINKS } from "../constant";

export const getGasValues = async (
  sender: any,
  hexNonce: any,
  initCode: any,
  calldata: any,
  callGasLimit = "100_000",
  verificationGasLimit = "2_000_000",
  preVerificationGas = "100_000",
  maxFeePerGas = "1000000000",
  maxPriorityFeePerGas = "1000000000",
  paymasterAndData = "0x",
  signature = "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
) => {
  try {
    console.log("In GET GAS");
    const gasOptions = {
      method: "POST",
      url: "https://api.stackup.sh/v1/node/6526fd245f4a5a1236cfaa9b2ac99b4298ebbc4d1d1acb9b13e47b8eccc96f5a",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      data: {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_estimateUserOperationGas",
        params: [
          {
            sender: sender,
            nonce: hexNonce,
            initCode: initCode,
            callData: calldata,
            callGasLimit: callGasLimit,
            verificationGasLimit: verificationGasLimit,
            preVerificationGas: preVerificationGas,
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            paymasterAndData: paymasterAndData,
            signature: signature,
          },
          ENTRYPOINT,
        ],
      },
    };

    const gas = await axios.request(gasOptions);
    // console.log("Gas: ", gas);
    return gas.data.result;
  } catch (error) {
    console.log("error : ", error);
  }
};

export const getUserOpHash = (
  sender: any,
  hexNonce: any,
  initCode: any,
  calldata: any,
  callGasLimit: any,
  verificationGasLimit: any,
  preVerificationGas: any,
  maxFeePerGas: any,
  maxPriorityFeePerGas: any,
  paymasterAndData = "0x"
) => {
  const packed = ethers.utils.defaultAbiCoder.encode(
    [
      "address",
      "uint256",
      "bytes32",
      "bytes32",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "bytes32",
    ],
    [
      sender,
      hexNonce,
      ethers.utils.keccak256(initCode), //ethers.utils.keccak256("0x"), //ethers.utils.keccak256("0x"), // initCode is kept 0x because I called createAccount method of Smart Wallet Factory before sending the user operation , if the smart account is not onchain we have to calculate initCode
      ethers.utils.keccak256(calldata),
      callGasLimit,
      verificationGasLimit,
      preVerificationGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      ethers.utils.keccak256(paymasterAndData),
    ]
  );

  const enc = ethers.utils.defaultAbiCoder.encode(
    ["bytes32", "address", "uint256"],
    [ethers.utils.keccak256(packed), ENTRYPOINT, "80001"]
  );

  return {
    useropHash: ethers.utils.keccak256(enc),
    data: {
      sender,
      hexNonce,
      initCode,
      calldata,
      callGasLimit,
      verificationGasLimit,
      preVerificationGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
    },
  };
};
