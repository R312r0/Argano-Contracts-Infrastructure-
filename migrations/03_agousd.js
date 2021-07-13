const save      = require('../logToFile.js').writeAddress
const save_raw  = require('../logToFile.js').writeAddress_raw
const startTime = Math.floor(new Date('2021-04-21T09:00:00.000+00:00').getTime() / 1000)


const BigNumber                     = require('ethers').BigNumber
const _ONE_                         = BigNumber.from('1000000000000000000')
const _ONE_THOUSAND_                = BigNumber.from('1000000000000000000000')
const _ONE_HUNDRED_THOUSAND_        = BigNumber.from('100000000000000000000000')

const poolCelling                   = _ONE_THOUSAND_.mul(5000000).toHexString()//pool celling 5m Dollar

let a_usdt                          = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
let a_wmatic_usdt                   = '0x604229c960e5cacf2aaeac8be68ac07ba9df81c3'//quickswap pair
let a_usdt_chainlinkAggregator      = '0x0A6513e40db6EB1b165753AD52E80663aeA50545'
let a_usdt_oracle                   = '0x363C7b3Bf98193E3880A729E3c298A432708bcd2'
let a_wmatic                        = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
let a_wmatic_chainlinkAggregator    = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
let a_factory                       = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'//poly/quickswap
let a_router                        = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'//poly/quickswap
let a_ARGANO                        = require('../lastDeployedAddresses.json').ARGANO //|| console.log(e.r.r.o.r)//throw error

const Dollar                        = artifacts.require('Dollar.sol')
const Share                         = artifacts.require('Share.sol')
const Pool                          = artifacts.require('Pool.sol')
const Treasury                      = artifacts.require('Treasury.sol')
const Foundry                       = artifacts.require('Foundry.sol')
const DollarOracle                  = artifacts.require('DollarOracle.sol')
const ShareOracle                   = artifacts.require('ShareOracle.sol')
const DollarCollateralPairOracle    = artifacts.require('DollarCollateralPairOracle.sol')
const ShareWCoinPairOracle          = artifacts.require('ShareWCoinPairOracle.sol')
// const MATICOracle               = artifacts.require('MATICOracle.sol')

const web3                          = Dollar.interfaceAdapter.web3
const factory                       = new web3.eth.Contract(require('../factoryABI.json'),   a_factory)
const router                        = new web3.eth.Contract(require('../routerABI.json'),    a_router)
const usdt                          = new web3.eth.Contract(require('../usdtABI.json'),      a_usdt)
const wmatic                        = new web3.eth.Contract(require('../wmaticABI.json'),    a_wmatic)

module.exports = async (_deployer, _network, _accounts) => {
    const owner = _accounts[0]

    let i_Treasury = undefined//bug in truffle require usage of callback during first deployment
    await _deployer.deploy(Treasury).then(async i => {i_Treasury = save(i)})
    await i_Treasury.setStrategist(owner)
    await i_Treasury.setGovTokenAddress(a_ARGANO)
    await sleep(20000)

    const i_AGOUSD  = save(await _deployer.deploy(Dollar, 'Argano Dollar token',       'AGOUSD',   i_Treasury.address))
    await i_Treasury.setDollarAddress(i_AGOUSD.address)
    await i_AGOUSD.initialize()
    await sleep(20000)
    
    const i_CNUSD   = save(await _deployer.deploy(Share,  'Catena Dollar share token', 'CNUSD',    i_Treasury.address))
    await i_Treasury.setShareAddress(i_CNUSD.address)
    await i_CNUSD.initialize(owner, owner, startTime)
    await sleep(20000)


    console.log(`USDT bal: ${await usdt.methods.balanceOf(owner)/1e6}`)
    await i_AGOUSD.approve(a_router, _ONE_HUNDRED_THOUSAND_)
    console.log('AGOUSD approved for router')
    await usdt.methods.approve(a_router, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    console.log('USDT approved for router')
    await router.methods.addLiquidity(i_AGOUSD.address, usdt._address, _ONE_.mul(2), 2000000, 0, 0, owner, Date.now() + 1000).send({from: owner})
    console.log('liquidity added')
    const a_agousdUsdtPair = save_raw(await factory.methods.getPair(i_AGOUSD.address, usdt._address).call(), "a_agousdUsdtPair")
    console.log('new pair: ', a_agousdUsdtPair)
    const i_AGOUSDUSDTPairOracle    = save(await _deployer.deploy(DollarCollateralPairOracle, a_agousdUsdtPair))
    console.log('new pair oracle: ', i_AGOUSDUSDTPairOracle.address)
    const i_AGOUSDOracle = save(await _deployer.deploy(DollarOracle, i_AGOUSD.address, i_AGOUSDUSDTPairOracle.address, a_usdt_chainlinkAggregator))
    console.log('new dollar oracle: ', i_AGOUSDOracle.address)     

    console.log(`WMATIC bal: ${await wmatic.methods.balanceOf(owner)/1e18}`)
    await i_CNUSD.approve(a_router, _ONE_HUNDRED_THOUSAND_)
    console.log('CNUSD approved for router')
    await wmatic.methods.approve(a_router, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    console.log('WMATIC approved for router')
    await router.methods.addLiquidity(i_CNUSD.address, wmatic._address, _ONE_.mul(2), _ONE_.mul(2), 0, 0, owner, Date.now() + 1000).send({from: owner})
    console.log('liquidity added')
    const a_cnusdWmaticPair = save_raw(await factory.methods.getPair(i_CNUSD.address, wmatic._address).call(),"a_cnusdWmaticPair")
    console.log('new pair: ', a_cnusdWmaticPair)
    const i_CNUSDWMATICPairOracle   = save(await _deployer.deploy(ShareWCoinPairOracle, a_cnusdWmaticPair))
    console.log('new pair oracle: ', i_CNUSDWMATICPairOracle.address)
    const i_CNUSDOracle  = save(await _deployer.deploy(ShareOracle,  i_CNUSD.address,  i_CNUSDWMATICPairOracle.address, a_wmatic_chainlinkAggregator))
    console.log('new share oracle: ', i_CNUSDOracle.address)      

    
    const i_Foundry = save(await _deployer.deploy(Foundry))
    await i_Foundry.initialize(a_usdt, i_CNUSD.address, i_Treasury.address)
    await i_Foundry.setOracle(a_usdt_oracle)
    await sleep(20000)


    const i_Pool = save(await _deployer.deploy(Pool, 
        i_AGOUSD.address,
        i_CNUSD.address,
        a_ARGANO,
        a_usdt,
        i_Treasury.address,
        poolCelling
    ))
    await i_Pool.setOracle(a_usdt_oracle)
    await sleep(20000)


    await i_Treasury.addPool(i_Pool.address)
    await i_Treasury.setOracleDollar(i_AGOUSDOracle.address)
    await i_Treasury.setOracleShare(i_CNUSDOracle.address)
    await i_Treasury.setRebalancePool(i_Pool.address)
    await i_Treasury.toggleEffectiveCollateralRatio()
    await i_Treasury.toggleCollateralRatio()
    await i_Treasury.refreshCollateralRatio()
    await i_Treasury.setUniswapParams(a_router, a_cnusdWmaticPair, a_wmatic_usdt)
    await i_Treasury.setFoundry(i_Foundry.address)

}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))