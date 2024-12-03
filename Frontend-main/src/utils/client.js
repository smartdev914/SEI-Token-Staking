import { useCosmWasmClient, useSigningCosmWasmClient, useWallet } from "@sei-js/react";
import Axios from "axios"
import { setupCache } from "axios-cache-adapter"
import { useCallback } from "react";


const TOKEN_ADDRESS = process.env.REACT_APP_TOKEN_ADDRESS;
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const until = Date.now() + 1000 * 60 * 60;
const untilInterval = Date.now() + 1000 * 60;


const cache = setupCache({
  maxAge: 2500,
  clearOnStale: true,
  clearOnError: true,
  readHeaders: true,
  exclude: {
    query: false,
    methods: ["post", "patch", "put", "delete"],
  },
})

const axios = Axios.create({
  adapter: cache.adapter,
})

const useClient = () => {

    const { connectedWallet, accounts } = useWallet();
    const { cosmWasmClient } = useCosmWasmClient();
    const { signingCosmWasmClient: signingClient } = useSigningCosmWasmClient();



    const queryContract = async (contractAddress, queryMsg) => {
        try {
            const query_msg = JSON.stringify(queryMsg);
            const url = `${process.env.REACT_APP_REST_URL}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${btoa(query_msg)}`;
            const res = (await axios.get(url)).data
            return res.data;
        } catch (e) {
            return null;
        }
        
    }

    const queryTokenBalance = useCallback (
        async (address) => {
            if ( connectedWallet ) {
                let response = await queryContract(TOKEN_ADDRESS, {balance: { address: accounts[0].address }});
                return response ? response.balance : "0";
            } else {
                return "0";
            }
        },
        [connectedWallet, accounts]
    );

    const queryContractConfig = useCallback (
        async () => {
            let response = await queryContract(CONTRACT_ADDRESS, {config: {}});
            return response;
        },
        []
    );

    const queryStakerInfo = useCallback (
        async () => {
            if ( connectedWallet ) {
                let response = await queryContract(CONTRACT_ADDRESS, {staker: {address: accounts[0].address}});
                return response;
            } else {
                return null;
            }
        },
        [connectedWallet,accounts]
    );

    const executeContract = async (signingClient, contractAddress, senderAddress, executeMsg) => {
        const fee = {
            amount: [{ amount: '0.1', denom: 'usei' }],
            gas: '1000000'
        };
        let txHash = "";
        try {
            const result = await signingClient?.execute(senderAddress, contractAddress, executeMsg, fee);
            txHash = result?.transactionHash ?? ""
        } catch (e) {
            console.log(e);
            return false;
        }

        if (!txHash) {
            return false
        }

        while (true) {
            try {
                const { data: res } = await axios.get(
                    `${process.env.REACT_APP_REST_URL}/cosmos/tx/v1beta1/txs/${txHash}`,
                    {
                        cache: { ignoreCache: true },
                    }
                )
                if (res?.tx_response.code) {
                    return false;
                }
        
                if (res?.tx_response.txhash) {
                    return true;
                }
                throw new Error("Unknown")
            } catch (e) {
            if (Date.now() < untilInterval) {
                await sleep(500);
            } else if (Date.now() < until) {
                await sleep(1000 * 10);
            } else {
                throw new Error(
                `Transaction queued. To verify the status, please check the transaction hash: ${txHash}`
                );
            }
            }
        }
    }

    const stakeMajin = useCallback(
        async (amount) => {
            if ( connectedWallet ) {
                let msg = btoa(JSON.stringify({
                    stake:{}
                }))
                let response = await executeContract(signingClient, TOKEN_ADDRESS, accounts[0].address, 
                    {
                        send: {
                            contract: CONTRACT_ADDRESS,
                            amount:  (Number(amount) * 10 ** 6).toString(),
                            msg
                        }
                    });
                return response;
            } else {
                return false;
            }
        },
        [signingClient,connectedWallet,accounts]
    );

    const unstakeMajin = useCallback(
        async () => {
            if ( connectedWallet ) {
                let response = await executeContract(signingClient, CONTRACT_ADDRESS, accounts[0].address, {unstake: {}});
                return response;
            } else {
                return false;
            }
        },
        [signingClient,connectedWallet,accounts]
    );

    const claimReward = useCallback(
        async () => {
            if ( connectedWallet ) {
                let response = await executeContract(signingClient, CONTRACT_ADDRESS, accounts[0].address, {claim_reward: {}});
                return response;
            } else {
                return false;
            }
        },
        [signingClient,connectedWallet,accounts]
    );

    return {
        queryTokenBalance,
        queryContractConfig,
        queryStakerInfo,
        stakeMajin,
        unstakeMajin,
        claimReward
    }
}
    
export default useClient;
    