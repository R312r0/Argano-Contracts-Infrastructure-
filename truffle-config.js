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
            provider: () => new HDWalletProvider(
                process.env.RINKEBY_PRIVATE_KEY,
                process.env.RINKEBY_INFURA
            ),
            network_id: 4,
            skipDryRun: true,
            gas: 10 * 1e6, // rinkeby has a lower block limit than mainnet
            gasPrice: 100 * 1e9,
        }
        // main: {
        //     gas: 7900000,
        //     provider: MainProvider,
        //     from: MainProvider.address,
        //     gasPrice: 2000000000,
        //     network_id: 1 // Ethereum public network
        // }
    },
    plugins: [
        'truffle-plugin-verify'
    ],
    api_keys: {
        etherscan: process.env.ETHERSCAN_API_KEY_PRO
    }
}