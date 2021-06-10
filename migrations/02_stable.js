const save         = require('../logToFile.js').writeAddress
const save_raw        = require('../logToFile.js').writeAddress_raw
const startTime = Math.floor(new Date('2021-04-21T09:00:00.000+00:00').getTime() / 1000)

const BigNumber                     = require('ethers').BigNumber
const _ONE_                         = BigNumber.from('1000000000000000000')
const _ONE_THOUSAND_                = BigNumber.from('1000000000000000000000')
const _ONE_HUNDRED_THOUSAND_        = BigNumber.from('100000000000000000000000')

const a_usdt                        = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const a_usdt_chainlinkAggregator    = '0x0A6513e40db6EB1b165753AD52E80663aeA50545'
const a_usdt_oracle                 = '0x363C7b3Bf98193E3880A729E3c298A432708bcd2'
const a_wmatic                      = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
const a_wmatic_chainlinkAggregator  = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
const a_factory                     = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'//poly/quickswap
const a_router                      = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'//poly/quickswap

const AGOUSD                        = artifacts.require('AGOUSD.sol')
const CNUSD                         = artifacts.require('CNUSD.sol')
const PoolAGOUSD                    = artifacts.require('PoolAGOUSD.sol')
const TreasuryAGOUSD                = artifacts.require('TreasuryAGOUSD.sol')
const DollarOracle                  = artifacts.require('DollarOracle.sol')
const ShareOracle                   = artifacts.require('ShareOracle.sol')
const AGOUSDUSDTPairOracle          = artifacts.require('AGOUSDUSDTPairOracle.sol')
const CNUSDWMATICPairOracle         = artifacts.require('CNUSDWMATICPairOracle.sol')
// const MATICOracle               = artifacts.require('MATICOracle.sol')

const web3                          = AGOUSD.interfaceAdapter.web3
const factory                       = new web3.eth.Contract(require('../factoryABI.json'),   a_factory)
const router                        = new web3.eth.Contract(require('../routerABI.json'),    a_router)
const usdt                          = new web3.eth.Contract(require('../usdtABI.json'),      a_usdt)
const wmatic                        = new web3.eth.Contract(require('../wmaticABI.json'),    a_wmatic)


module.exports = async (_deployer, _network, _accounts) => {
    const owner = _accounts[0]
    
    let i_TreasuryAGOUSD = undefined
    await _deployer.deploy(TreasuryAGOUSD).then(async i => {i_TreasuryAGOUSD = save(i)})
    const i_AGOUSD  = save(await _deployer.deploy(AGOUSD, 'Argano Dollar token',       'AGOUSD',   i_TreasuryAGOUSD.address))
    const i_CNUSD   = save(await _deployer.deploy(CNUSD,  'Catena Dollar share token', 'CNUSD',    i_TreasuryAGOUSD.address))

    await i_AGOUSD.initialize()
    await i_CNUSD.initialize(owner, owner, startTime)
    await i_TreasuryAGOUSD.setStrategist(owner)
    await i_TreasuryAGOUSD.setDollarAddress(i_AGOUSD.address)
    await i_TreasuryAGOUSD.setShareAddress(i_CNUSD.address)

    console.log(`sleept for ${(9e4/1000).toFixed(3)} sec...`);await sleep(9e4)

    const i_PoolAGOUSD = save(await _deployer.deploy(PoolAGOUSD, 
        i_AGOUSD.address,
        i_CNUSD.address,
        a_usdt,
        i_TreasuryAGOUSD.address,
        _ONE_THOUSAND_.mul(5000000).toHexString()//pool celling 5m AGOUSD
    ))
    
    await i_TreasuryAGOUSD.addPool(i_PoolAGOUSD.address)
    await i_PoolAGOUSD.setOracle(a_usdt_oracle)
             
    console.log(`sleept for ${(9e4/1000).toFixed(3)} sec...`);await sleep(9e4)

    await i_AGOUSD.approve(a_router, _ONE_HUNDRED_THOUSAND_)
    await usdt.methods.approve(a_router, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    await router.methods.addLiquidity(i_AGOUSD.address, usdt._address, _ONE_.mul(2), 2000000, 0, 0, owner, Date.now() + 1000).send({from: owner})
    const a_agousdUsdtPair = save_raw(await factory.methods.getPair(i_AGOUSD.address, usdt._address).call(), "a_agousdUsdtPair")
    

    await i_CNUSD.approve(a_router, _ONE_HUNDRED_THOUSAND_)
    await wmatic.methods.approve(a_router, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    await router.methods.addLiquidity(i_CNUSD.address, wmatic._address, _ONE_.mul(2), _ONE_.mul(2), 0, 0, owner, Date.now() + 1000).send({from: owner})
    const a_cnusdWmaticPair = save_raw(await factory.methods.getPair(i_CNUSD.address, wmatic._address).call(),"a_cnusdWmaticPair")
    
    const i_AGOUSDUSDTPairOracle    = save(await _deployer.deploy(AGOUSDUSDTPairOracle, a_agousdUsdtPair))
    const i_CNUSDWMATICPairOracle   = save(await _deployer.deploy(CNUSDWMATICPairOracle, a_cnusdWmaticPair))

    const i_AGOUSDOracle = save(await _deployer.deploy(DollarOracle, i_AGOUSD.address, i_AGOUSDUSDTPairOracle.address, a_usdt_chainlinkAggregator))
    const i_CNUSDOracle  = save(await _deployer.deploy(ShareOracle,  i_CNUSD.address,  i_CNUSDWMATICPairOracle.address, a_wmatic_chainlinkAggregator))

    console.log(`sleept for ${(9e4/1000).toFixed(2)} sec...`);await sleep(6e4)
    
    await i_TreasuryAGOUSD.setOracleDollar(i_AGOUSDOracle.address)
    await i_TreasuryAGOUSD.setOracleShare(i_CNUSDOracle.address)
    await i_TreasuryAGOUSD.setRebalancePool(i_PoolAGOUSD.address)

    await i_TreasuryAGOUSD.toggleEffectiveCollateralRatio()
    await i_TreasuryAGOUSD.toggleCollateralRatio()
    await i_TreasuryAGOUSD.refreshCollateralRatio()
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
    

