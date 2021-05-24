require('dotenv').config()
const path = require("path")
const HDWalletProvider = require("truffle-hdwallet-provider")

// const MainProvider = new HDWalletProvider(process.env["MAIN_NET_PRIVATE_KEY"], "https://mainnet.infura.io/v3/73901322e10c4355bc3f9afac9a3be29");
// const RinkebyProvider = new HDWalletProvider(process.env.RINKEBY_PRIVATE_KEY, process.env.RINKEBY_INFURA)

module.exports = {
    contracts_build_directory: path.join(__dirname, "client/src/contracts"),
    compilers: {
        solc: {
            version: "^0.8.0",
            docker: false,
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 1000
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
                process.env.RINKEBY_PRIVATE_KEY,
                process.env.RINKEBY_INFURA
            ),
            network_id: 4,
            skipDryRun: true
        },
        polygon: {
            provider: new HDWalletProvider(
                process.env.RINKEBY_PRIVATE_KEY,
                'https://rpc-mainnet.maticvigil.com/v1/64b99315d4c64be57564944e982966a4e5a17d17'
            ),
            network_id: 137,
            skipDryRun: true,
            networkCheckTimeout: 5000
        }
    },
    plugins: [
        'truffle-plugin-verify'
    ],
    api_keys: {
        etherscan: process.env.ETHERSCAN_API_KEY_PRO
    }
}