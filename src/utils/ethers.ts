import erc20ABIJson from '../data/contract/ERC20.json'


export const ERC20ABI = erc20ABIJson



export const getOKXChainId = (network: string) => {

    switch (network) {
        case "goerli":
            return "70000030"
        default:
            return "1"
    }

}  