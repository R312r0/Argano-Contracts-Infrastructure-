const save      = require('../logToFile.js').writeAddress
const save_raw  = require('../logToFile.js').writeAddress_raw
const startTime = Math.floor(new Date('2021-04-21T09:00:00.000+00:00').getTime() / 1000)


const BigNumber                     = require('ethers').BigNumber
const _ONE_                         = BigNumber.from('1000000000000000000')
const _ONE_THOUSAND_                = BigNumber.from('1000000000000000000000')
const _ONE_HUNDRED_THOUSAND_        = BigNumber.from('100000000000000000000000')

const poolCelling                   = _ONE_THOUSAND_.mul(5000000).toHexString()//pool celling 5m Dollar


const a_wcoin_collateral                = '0xdc9232e2df177d7a12fdff6ecbab114e2231198d'//quickswap pair//wbtc
const a_collateral                      = '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'
const a_collateral_chainlinkAggregator  = '0xDE31F8bFBD8c84b5360CFACCa3539B938dd78ae6'
const a_collateral_oracle               = '0x8F4264BcA942aF1C01faa2a29b6EaC3f7b311105'
const a_wcoin                           = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
const a_wcoin_chainlinkAggregator       = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
const a_factory                         = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32'//poly/quickswap
const a_router                          = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'//poly/quickswap
const a_governance_token                = require('../lastDeployedAddresses.json').ARGANO //|| console.log(e.r.r.o.r)//throw error


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
const collateral                    = new web3.eth.Contract(require('../usdtABI.json'),      a_collateral)
const wcoin                         = new web3.eth.Contract(require('../wmaticABI.json'),    a_wcoin)

module.exports = async (_deployer, _network, _accounts) => {
    const owner = _accounts[0]
    

    let i_Treasury = undefined//bug in truffle require usage of callback during first deployment
    await _deployer.deploy(Treasury).then(async i => {i_Treasury = save(i)})
    await i_Treasury.setStrategist(owner)
    await i_Treasury.setGovTokenAddress(a_governance_token)
    
    const i_dollar  = save(await _deployer.deploy(Dollar, 'Argano Bitcoin token', 'AGOBTC', i_Treasury.address))
    await i_Treasury.setDollarAddress(i_dollar.address)
    await i_dollar.initialize()
    
    const i_share   = save(await _deployer.deploy(Share, 'Catena Bitcoin share token', 'CNBTC', i_Treasury.address))
    await i_Treasury.setShareAddress(i_share.address)
    await i_share.initialize(owner, owner, startTime)


    await i_dollar.approve(a_router, _ONE_HUNDRED_THOUSAND_)
    console.log('AGOBTC approved for router')
    await collateral.methods.approve(a_router, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    console.log('collateral approved for router')
    await router.methods.addLiquidity(i_dollar.address, collateral._address, _ONE_.mul(2), 200, 0, 0, owner, Date.now() + 1000).send({from: owner})
    console.log('liquidity added')
    const a_dollar_collaterall_pair = save_raw(await factory.methods.getPair(i_dollar.address, collateral._address).call(), "a_dollar_collaterall_pair")
    console.log('new pair: ', a_dollar_collaterall_pair)
    const a_dollar_collaterall_pair_oracle    = save(await _deployer.deploy(DollarCollateralPairOracle, a_dollar_collaterall_pair))
    console.log('new pair oracle: ', a_dollar_collaterall_pair_oracle.address)
    const i_dollar_oracle = save(await _deployer.deploy(DollarOracle, i_dollar.address, a_dollar_collaterall_pair_oracle.address, a_collateral_chainlinkAggregator))
    console.log('new dollar oracle: ', i_dollar_oracle.address)     


    await i_share.approve(a_router, _ONE_HUNDRED_THOUSAND_)
    console.log('CNBTC approved for router')
    await wcoin.methods.approve(a_router, _ONE_HUNDRED_THOUSAND_).send({from: owner})
    console.log('wcoin approved for router')
    await router.methods.addLiquidity(i_share.address, wcoin._address, _ONE_.mul(2), _ONE_.mul(2), 0, 0, owner, Date.now() + 1000).send({from: owner})
    console.log('liquidity added')
    const a_share_wcoin_pair = save_raw(await factory.methods.getPair(i_share.address, wcoin._address).call(),"a_share_wcoin_pair")
    console.log('new pair: ', a_share_wcoin_pair)
    const i_share_wcoin_pair_oracle   = save(await _deployer.deploy(ShareWCoinPairOracle, a_share_wcoin_pair))
    console.log('new pair oracle: ', i_share_wcoin_pair_oracle.address)
    const i_share_oracle  = save(await _deployer.deploy(ShareOracle,  i_share.address,  i_share_wcoin_pair_oracle.address, a_wcoin_chainlinkAggregator))
    console.log('new share oracle: ', i_share_oracle.address)      

    
    const i_Foundry = save(await _deployer.deploy(Foundry))
    await i_Foundry.initialize(a_collateral, i_share.address, i_Treasury.address)
    await i_Foundry.setOracle(a_collateral_oracle)


    const i_Pool = save(await _deployer.deploy(Pool, 
        i_dollar.address,
        i_share.address,
        a_governance_token,
        a_collateral,
        i_Treasury.address,
        poolCelling
    ))
    await i_Pool.setOracle(a_collateral_oracle)


    await i_Treasury.addPool(i_Pool.address)
    await i_Treasury.setOracleDollar(i_dollar_oracle.address)
    await i_Treasury.setOracleShare(i_share_oracle.address)
    await i_Treasury.setRebalancePool(i_Pool.address)
    await i_Treasury.toggleEffectiveCollateralRatio()
    await i_Treasury.toggleCollateralRatio()
    await i_Treasury.refreshCollateralRatio()
    await i_Treasury.setUniswapParams(a_router, a_share_wcoin_pair, a_wcoin_collateral)
    await i_Treasury.setFoundry(i_Foundry.address)

}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))