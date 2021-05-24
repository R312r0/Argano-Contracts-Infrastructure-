const {writeAddress} = require('../logToFile.js')
const BigNumber = require ('ethers').BigNumber
const _ONE_             = BigNumber.from('1000000000000000000')

const Foundry = artifacts.require('Foundry.sol')
const web3 = Foundry.interfaceAdapter.web3
const factoryABI = require('../factoryABI.json')
const routerABI = require('../routerABI.json')
const factoryAddress = process.env.uniswapV2Factory_rinkeby
const routerAddress = process.env.uniswapV2Router_rinkeby
const factory = new web3.eth.Contract(factoryABI, factoryAddress)
const router = new web3.eth.Contract(routerABI, routerAddress)

const lastDeployedAddresses = require('../lastDeployedAddresses.json')

module.exports = async (_deployer, _network, _accounts) => {
    const collaterall                       = lastDeployedAddresses['Mock_USDT']
    const CNUSD                             = lastDeployedAddresses['CNUSD']
    const TreasuryAGOUSD                    = lastDeployedAddresses['TreasuryAGOUSD']
    const USDTOracle                        = lastDeployedAddresses['USDTOracle']

    let _Foundry_ins = undefined

    console.log(`sleept for ${(9e4/1000).toFixed(2)} passed sec...`)
    // await sleep(9e4)

    await _deployer.deploy(Foundry).then(async i => {_Foundry_ins = writeAddress(i)})

    await _Foundry_ins.initialize(collaterall, CNUSD, TreasuryAGOUSD)
    await _Foundry_ins.setOracle(USDTOracle)
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

