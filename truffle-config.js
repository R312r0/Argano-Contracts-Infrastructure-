require('dotenv').config()
const path = require("path")
const HDWalletProvider = require('@truffle/hdwallet-provider')

// const MainProvider = new HDWalletProvider(process.env["MAIN_NET_PRIVATE_KEY"], "https://mainnet.infura.io/v3/73901322e10c4355bc3f9afac9a3be29");
// const RinkebyProvider = new HDWalletProvider(process.env.RINKEBY_PRIVATE_KEY, process.env.RINKEBY_INFURA)

module.exports = {
    // contracts_build_directory: path.join(__dirname, "./contracts/build"),
    compilers: {
        solc: {
            version: "0.8.4",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                },
            }
        }
    },
    networks: {
        development: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*"
        },
        rinkeby: {
            provider: new HDWalletProvider(
                process.env.PRIVATE_KEY,
                process.env.RINKEBY_INFURA
            ),
            network_id: 4,
            skipDryRun: true
        },
        polygon: {
            provider: new HDWalletProvider(
                process.env.PRIVATE_KEY,
                'https://rpc-mainnet.maticvigil.com/'//'https://rpc-mainnet.maticvigil.com/v1/4181362d3093eaa75d8aa60388f645f7740c6fa7'
            ),
            network_id: 137,
            skipDryRun: true,
            networkCheckTimeout: 15000,
            gasPrice: 40e9,
            gas: 15e6
        },
        mumbai: {
            provider: new HDWalletProvider(
                process.env.PRIVATE_KEY,
                'https://rpc-mumbai.maticvigil.com'
            ),
            network_id: 80001,
            skipDryRun: true,
            // networkCheckTimeout: 5000,
            gasPrice: 1e9,
            gas: 15e6
        }
    },
    plugins: [
        'truffle-plugin-verify'
    ],
    api_keys: {
        etherscan: process.env.POLYSCAN_API_KEY//ETHERSCAN_API_KEY_PRO
    }
}