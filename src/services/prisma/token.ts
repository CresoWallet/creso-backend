import { getOKXChainId } from "../../utils/ethers";

const crypto = require('crypto');

export const getUserTokens = async (network: string) => {

    // Replace these with your actual values
    const apiKey = 'c0fdca12-8381-46f9-b36e-ab107218f52a';
    const secretKey = 'C454B41426881FF0E9FE7ED6CCC00784';
    const passphrase = 'Test@1122';
    const timestamp = new Date().toISOString();
    const chainId = getOKXChainId(network)
    // Generate the OK-ACCESS-SIGN
    const method = 'GET';
    const requestPath = `/api/v5/dex/aggregator/all-tokens?chainId=${chainId}`;
    const prehash = timestamp + method + requestPath;
    const signature = crypto.createHmac('sha256', secretKey).update(prehash).digest('base64');

    const url = `https://www.okx.com${requestPath}`;
    console.log("=-====")
    console.log(url)
    const headers = {
        'Content-Type': 'application/json',
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
        // Include this header only if required for your request
        // 'OK-ACCESS-PROJECT': '<Your Project ID>'
    };

    try {
        const response = await fetch(url, { method, headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { data } = await response.json();

        console.log(data)
        return data.slice(0, 10)

    } catch (error) {
        console.error('Error making the request:', error);
    }


}