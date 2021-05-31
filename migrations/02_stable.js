const {writeAddress} = require('../logToFile.js')
const startTime         = Math.floor(new Date('2021-04-21T09:00:00.000+00:00').getTime() / 1000)


const BigNumber                 = require ('ethers').BigNumber
const _ONE_                     = BigNumber.from('1000000000000000000')
const _ONE_THOUSAND_            = BigNumber.from('1000000000000000000000')
const _ONE_HUNDRED_THOUSAND_    = BigNumber.from('100000000000000000000000')

const Mock_USDT                 = artifacts.require('Mock_USDT.sol')
const Mock_WETH                 = artifacts.require('Mock_WETH.sol')
const AGOUSDUSDTPairOracle      = artifacts.require('AGOUSDUSDTPairOracle.sol')
const CNUSDWMATICPairOracle     = artifacts.require('CNUSDWMATICPairOracle.sol')
const TreasuryAGOUSD            = artifacts.require('TreasuryAGOUSD.sol')
const AGOUSD                    = artifacts.require('AGOUSD.sol')
const CNUSD                     = artifacts.require('CNUSD.sol')
const PoolAGOUSD                = artifacts.require('PoolAGOUSD.sol')
const USDTOracle                = artifacts.require('USDTOracle.sol')
const WETHOracle                = artifacts.require('WETHOracle.sol')
const DollarOracle              = artifacts.require('DollarOracle.sol')
const ShareOracle               = artifacts.require('ShareOracle.sol')

const web3 = AGOUSD.interfaceAdapter.web3
const factoryABI = require('../factoryABI.json')
const routerABI = require('../routerABI.json')
const usdtABI = require('../usdtABI.json')
const wmaticABI = require('../wmaticABI.json')
const factoryAddress = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'//poly
const routerAddress = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'//poly
const factory = new web3.eth.Contract(factoryABI, factoryAddress)
const router = new web3.eth.Contract(routerABI, routerAddress)
const usdt = new web3.eth.Contract(usdtABI, '0xc2132D05D31c914a87C6611C10748AEb04B58e8F')
const wmatic = new web3.eth.Contract(wmaticABI, '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270')
const wmatic_chainlinkAggregator = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'

module.exports = async (_deployer, _network, _accounts) => {
    const owner = _accounts[0]   

    let _TreasuryAGOUSD_ins = undefined
    await _deployer.deploy(TreasuryAGOUSD).then(async i => {_TreasuryAGOUSD_ins = writeAddress(i)})
    await _TreasuryAGOUSD_ins.setStrategist(owner)


    const _AGOUSD_ins = writeAddress(await _deployer.deploy(AGOUSD, 'Argano Dollar token', 'AGOUSD', _TreasuryAGOUSD_ins.address))
    await _AGOUSD_ins.initialize()
    await _TreasuryAGOUSD_ins.setDollarAddress(_AGOUSD_ins.address)

    const _CNUSD_ins = writeAddress(await _deployer.deploy(CNUSD, 'Catena Dollar share token', 'CNUSD', _TreasuryAGOUSD_ins.address))
    await _CNUSD_ins.initialize(owner, owner, startTime)
    await _TreasuryAGOUSD_ins.setShareAddress(_CNUSD_ins.address)

    const _USDTOracle_ins = writeAddress(await _deployer.deploy(USDTOracle))//all ok
    // const _WETHOracle_ins = writeAddress(await _deployer.deploy(WETHOracle))

    console.log(`sleept for ${(9e4/1000).toFixed(3)} sec...`);await sleep(9e4)

    const _PoolAGOUSD_ins = writeAddress(await _deployer.deploy(PoolAGOUSD, 
        _AGOUSD_ins.address,
        _CNUSD_ins.address,
        process.env.polygonUSDT,
        _TreasuryAGOUSD_ins.address,
        _ONE_THOUSAND_.mul(500000000).toHexString()//pool celling 500m AGOUSD
    ))
    await _TreasuryAGOUSD_ins.addPool(_PoolAGOUSD_ins.address)
    await _PoolAGOUSD_ins.setOracle(_USDTOracle_ins.address)
             
    
    console.log(`sleept for ${(9e4/1000).toFixed(3)} sec...`);await sleep(9e4)

                        // await _AGOUSD_ins.approve(_PoolAGOUSD_ins.address, _ONE_THOUSAND_.mul(500000000))
                        // await _CNUSD_ins.approve(_PoolAGOUSD_ins.address, _ONE_THOUSAND_.mul(500000000))
                        // await _USDT_ins.approve(_PoolAGOUSD_ins.address, _ONE_THOUSAND_.mul(500000000))


    await _AGOUSD_ins.approve(routerAddress, _ONE_HUNDRED_THOUSAND_)
    await usdt.methods.approve(routerAddress, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    await router.methods.addLiquidity(_AGOUSD_ins.address, usdt._address, _ONE_, 2000000, 0, 0, owner, Date.now() + 1000).send({from: owner})
    const agousdUsdtPair = await factory.methods.getPair(_AGOUSD_ins.address, usdt._address).call()

    await _CNUSD_ins.approve(routerAddress, _ONE_HUNDRED_THOUSAND_)
    await wmatic.methods.approve(routerAddress, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    await router.methods.addLiquidity(_CNUSD_ins.address, wmatic._address, _ONE_, _ONE_.mul(2), 0, 0, owner, Date.now() + 1000).send({from: owner})
    const cnusdWmaticPair = await factory.methods.getPair(_CNUSD_ins.address, wmatic._address).call()

    // console.log(c.c.c)
    console.log(`sleept for ${(9e4/1000).toFixed(2)} sec...`)
    
    const _AGOUSD_USDT_ins = writeAddress(await _deployer.deploy(AGOUSDUSDTPairOracle, agousdUsdtPair))
    const _CNUSD_MATIC_ins = writeAddress(await _deployer.deploy(CNUSDWMATICPairOracle, cnusdWmaticPair))

    const _AGOUSDOracle_ins = writeAddress(await _deployer.deploy(DollarOracle, _AGOUSD_ins.address, _AGOUSD_USDT_ins.address, _USDTOracle_ins.address))
    const _CNUSDOracle_ins = writeAddress(await _deployer.deploy(ShareOracle, _CNUSD_ins.address, _CNUSD_MATIC_ins.address, wmatic_chainlinkAggregator))

    console.log(`sleept for ${(9e4/1000).toFixed(2)} sec...`)
    await sleep(9e4)

    await _TreasuryAGOUSD_ins.setOracleDollar(_AGOUSDOracle_ins.address)
    await _TreasuryAGOUSD_ins.setOracleShare(_CNUSDOracle_ins.address)
    await _TreasuryAGOUSD_ins.setRebalancePool(_PoolAGOUSD_ins.address)

    await _TreasuryAGOUSD_ins.toggleEffectiveCollateralRatio()
    await _TreasuryAGOUSD_ins.toggleCollateralRatio()
    await _TreasuryAGOUSD_ins.refreshCollateralRatio()

    // await _AGOUSD_USDT_ins.update()
    // await _CNUSD_MATIC_ins.update()
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
    

