const save         = require('../logToFile.js').writeAddress
const save_raw        = require('../logToFile.js').writeAddress_raw
const startTime = Math.floor(new Date('2021-04-21T09:00:00.000+00:00').getTime() / 1000)

const BigNumber                     = require('ethers').BigNumber
const _ONE_                         = BigNumber.from('1000000000000000000')
const _ONE_THOUSAND_                = BigNumber.from('1000000000000000000000')
const _ONE_HUNDRED_THOUSAND_        = BigNumber.from('100000000000000000000000')


const a_wmatic_usdt                 = '0x604229c960e5cacf2aaeac8be68ac07ba9df81c3'//quickswap pair
const a_usdt                        = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const a_usdt_chainlinkAggregator    = '0x0A6513e40db6EB1b165753AD52E80663aeA50545'
const a_usdt_oracle                 = '0x363C7b3Bf98193E3880A729E3c298A432708bcd2'
const a_wmatic                      = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
const a_wmatic_chainlinkAggregator  = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
const a_factory                     = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'//poly/quickswap
const a_router                      = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'//poly/quickswap

const AGOUSD                        = artifacts.require('AGOUSD.sol')
const CNUSD                         = artifacts.require('CNUSD.sol')
const Pool                          = artifacts.require('Pool.sol')
const Treasury                      = artifacts.require('Treasury.sol')
const DollarOracle                  = artifacts.require('DollarOracle.sol')
const ShareOracle                   = artifacts.require('ShareOracle.sol')
const AGOUSDUSDTPairOracle          = artifacts.require('AGOUSDUSDTPairOracle.sol')
const CNUSDWMATICPairOracle         = artifacts.require('CNUSDWMATICPairOracle.sol')
const Foundry                       = artifacts.require('Foundry.sol')
// const MATICOracle               = artifacts.require('MATICOracle.sol')

const web3                          = AGOUSD.interfaceAdapter.web3
const factory                       = new web3.eth.Contract(require('../factoryABI.json'),   a_factory)
const router                        = new web3.eth.Contract(require('../routerABI.json'),    a_router)
const usdt                          = new web3.eth.Contract(require('../usdtABI.json'),      a_usdt)
const wmatic                        = new web3.eth.Contract(require('../wmaticABI.json'),    a_wmatic)

    
const AGOBTC                        = artifacts.require('AGOBTC.sol')
const CNBTC                         = artifacts.require('CNBTC.sol')
const TreasuryAGOBTC                = artifacts.require('TreasuryAGOBTC.sol')
// const PoolAGOBTC                    = artifacts.require('PoolAGOBTC.sol')
const AGOBTCWBTCPairOracle          = artifacts.require('AGOBTCWBTCPairOracle.sol')
const CNBTCWMATICPairOracle         = artifacts.require('CNBTCWMATICPairOracle.sol')
const Foundry                       = artifacts.require('Foundry.sol')
const FoundryBTC                    = artifacts.require('FoundryBTC.sol')

const a_wmatic_wbtc                 = '0xdc9232e2df177d7a12fdff6ecbab114e2231198d'//quickswap pair
const a_wbtc                        = '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'
const a_wbtc_chainlinkAggregator    = '0xDE31F8bFBD8c84b5360CFACCa3539B938dd78ae6'
const a_WBTC_oracle                 = '0x8F4264BcA942aF1C01faa2a29b6EaC3f7b311105'

const wbtc                          = new web3.eth.Contract(require('../usdtABI.json'),      a_wbtc)


module.exports = async (_deployer, _network, _accounts) => {
    const owner = _accounts[0]
    
    let i_Treasury = undefined
    await _deployer.deploy(Treasury).then(async i => {i_Treasury = save(i)})
    const i_AGOUSD  = save(await _deployer.deploy(AGOUSD, 'Argano Dollar token',       'AGOUSD',   i_Treasury.address))
    const i_CNUSD   = save(await _deployer.deploy(CNUSD,  'Catena Dollar share token', 'CNUSD',    i_Treasury.address))

    await i_AGOUSD.initialize()
    await i_CNUSD.initialize(owner, owner, startTime)
    await i_Treasury.setStrategist(owner)
    await i_Treasury.setDollarAddress(i_AGOUSD.address)
    await i_Treasury.setShareAddress(i_CNUSD.address)

    console.log(`sleept for ${(9e4/1000).toFixed(3)} sec...`);await sleep(9e4)

    const i_Pool = save(await _deployer.deploy(Pool, 
        i_AGOUSD.address,
        i_CNUSD.address,
        a_usdt,
        i_Treasury.address,
        _ONE_THOUSAND_.mul(5000000).toHexString()//pool celling 5m AGOUSD
    ))
    
    await i_Treasury.addPool(i_Pool.address)
    await i_Pool.setOracle(a_usdt_oracle)
             
    console.log(`sleept for ${(9e4/1000).toFixed(3)} sec...`);await sleep(9e4)

    // await i_AGOUSD.approve(a_router, _ONE_HUNDRED_THOUSAND_)
    // await usdt.methods.approve(a_router, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    // await router.methods.addLiquidity(i_AGOUSD.address, usdt._address, _ONE_.mul(2), 2000000, 0, 0, owner, Date.now() + 1000).send({from: owner})
    // const a_agousdUsdtPair = save_raw(await factory.methods.getPair(i_AGOUSD.address, usdt._address).call(), "a_agousdUsdtPair")
    

    // await i_CNUSD.approve(a_router, _ONE_HUNDRED_THOUSAND_)
    // await wmatic.methods.approve(a_router, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    // await router.methods.addLiquidity(i_CNUSD.address, wmatic._address, _ONE_.mul(2), _ONE_.mul(2), 0, 0, owner, Date.now() + 1000).send({from: owner})
    // const a_cnusdWmaticPair = save_raw(await factory.methods.getPair(i_CNUSD.address, wmatic._address).call(),"a_cnusdWmaticPair")
    
    // const i_AGOUSDUSDTPairOracle    = save(await _deployer.deploy(AGOUSDUSDTPairOracle, a_agousdUsdtPair))
    // const i_CNUSDWMATICPairOracle   = save(await _deployer.deploy(CNUSDWMATICPairOracle, a_cnusdWmaticPair))

    const i_AGOUSDOracle = save(await _deployer.deploy(DollarOracle, i_AGOUSD.address, i_AGOUSDUSDTPairOracle.address, a_usdt_chainlinkAggregator))
    const i_CNUSDOracle  = save(await _deployer.deploy(ShareOracle,  i_CNUSD.address,  i_CNUSDWMATICPairOracle.address, a_wmatic_chainlinkAggregator))

    console.log(`sleept for ${(9e4/1000).toFixed(2)} sec...`);await sleep(6e4)
    
    // await i_Treasury.setOracleDollar(i_AGOUSDOracle.address)
    // await i_Treasury.setOracleShare(i_CNUSDOracle.address)
    await i_Treasury.setRebalancePool(i_Pool.address)

    await i_Treasury.toggleEffectiveCollateralRatio()
    await i_Treasury.toggleCollateralRatio()
    await i_Treasury.refreshCollateralRatio()


    const i_Foundry = save(await _deployer.deploy(Foundry))
    await i_Foundry.initialize(a_usdt, i_CNUSD.address, i_Treasury.address)
    await i_Foundry.setOracle(a_usdt_oracle)

    await i_Treasury.setFoundry(i_Foundry.address)
    await i_Treasury.setUniswapParams(a_router, a_cnusdWmaticPair, a_wmatic_usdt)


    //========================================== BTC =================================================================================
   
    // console.log('AGOBTC...')

    // const i_TreasuryAGOBTC = undefined
    // await _deployer.deploy(TreasuryAGOBTC).then(async i => {i_TreasuryAGOBTC = save(i)})
    // const i_AGOBTC  = save(await _deployer.deploy(AGOBTC, 'Argano Bitcoin token',       'AGOBTC',   i_TreasuryAGOBTC.address))
    // const i_CNBTC   = save(await _deployer.deploy(CNBTC,  'Catena Bitcoin share token', 'CNBTC',    i_TreasuryAGOBTC.address))

    // await i_AGOBTC.initialize()
    // await i_CNBTC.initialize(owner, owner, startTime)
    // await i_TreasuryAGOBTC.setStrategist(owner)
    // await i_TreasuryAGOBTC.setDollarAddress(i_AGOBTC.address)
    // await i_TreasuryAGOBTC.setShareAddress(i_CNBTC.address)

    // console.log(`sleept for ${(9e4/1000).toFixed(3)} sec...`);await sleep(9e4)

    // const i_PoolAGOBTC = save(await _deployer.deploy(PoolAGOBTC, 
    //     i_AGOBTC.address,
    //     i_CNBTC.address,
    //     a_wbtc,
    //     i_TreasuryAGOBTC.address,
    //     _ONE_THOUSAND_.mul(5000000).toHexString()//pool celling 5m AGOUSD
    // ))
    
    // await i_TreasuryAGOBTC.addPool(i_PoolAGOBTC.address)
    // await i_PoolAGOBTC.setOracle(a_WBTC_oracle)
             
    // console.log(`sleept for ${(9e4/1000).toFixed(3)} sec...`);await sleep(9e4)

    // await i_AGOBTC.approve(a_router, _ONE_HUNDRED_THOUSAND_)
    // await wbtc.methods.approve(a_router, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    // await router.methods.addLiquidity(i_AGOBTC.address, a_wbtc, 2, 2000000, 0, 0, owner, Date.now() + 1000).send({from: owner})
    // const a_agobtcWbtcPair = save_raw(await factory.methods.getPair(i_AGOBTC.address, a_wbtc).call(), "a_agobtcWbtcPair")
    

    // await i_CNBTC.approve(a_router, _ONE_HUNDRED_THOUSAND_)
    // await wmatic.methods.approve(a_router, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    // await router.methods.addLiquidity(i_CNBTC.address, a_wmatic, 2, _ONE_.mul(2), 0, 0, owner, Date.now() + 1000).send({from: owner})
    // const a_cnbtcWmaticPair = save_raw(await factory.methods.getPair(i_CNBTC.address, a_wmatic).call(),"a_cnbtcWmaticPair")

    // const i_AGOBTCWBTCPairOracle    = save(await _deployer.deploy(AGOBTCWBTCPairOracle, a_agobtcWbtcPair))
    // const i_CNBTCWMATICPairOracle   = save(await _deployer.deploy(CNBTCWMATICPairOracle, a_cnbtcWmaticPair))

    // const i_AGOBTCOracle = save(await _deployer.deploy(DollarOracle, i_AGOBTC.address, i_AGOBTCWBTCPairOracle.address, a_wbtc_chainlinkAggregator))
    // const i_CNBTCOracle  = save(await _deployer.deploy(ShareOracle,  i_CNBTC.address,  i_CNBTCWMATICPairOracle.address, a_wmatic_chainlinkAggregator))

    // console.log(`sleept for 60 sec...`);await sleep(6e4)

    // await i_TreasuryAGOBTC.setOracleDollar(i_AGOBTCOracle.address)
    // await i_TreasuryAGOBTC.setOracleShare(i_CNBTCOracle.address)
    // await i_TreasuryAGOBTC.setRebalancePool(i_PoolAGOBTC.address)

    // await i_TreasuryAGOBTC.toggleEffectiveCollateralRatio()
    // await i_TreasuryAGOBTC.toggleCollateralRatio()
    // await i_TreasuryAGOBTC.refreshCollateralRatio()


    // const i_FoundryBTC = save(await _deployer.deploy(FoundryBTC))
    // await i_FoundryBTC.initialize(a_wbtc, i_CNBTC.address, i_TreasuryAGOBTC.address)
    // await i_FoundryBTC.setOracle(a_wbtc_oracle)

    // await i_TreasuryAGOBTC.setFoundry(i_FoundryBTC.address)
    // await i_TreasuryAGOBTC.setUniswapParams(a_router, a_cnbtcWmaticPair, a_wmatic_wbtc)

}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))