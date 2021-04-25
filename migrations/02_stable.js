const BigNumber = require ('ethers').BigNumber
const {writeAddress} = require('../logToFile.js')
const _ONE_ = BigNumber.from('1000000000000000000')
const _ONE_THOUSAND_ = BigNumber.from('1000000000000000000000')
const startTime = Math.floor(new Date('2021-04-21T09:00:00.000+00:00').getTime() / 1000)

const Mock_USDT                 = artifacts.require('Mock_USDT.sol')
const Mock_WETH                 = artifacts.require('Mock_WETH.sol')
const TreasuryAGOUSD            = artifacts.require('TreasuryAGOUSD.sol')
const AGOUSD                    = artifacts.require('AGOUSD.sol')
const CNUSD                     = artifacts.require('CNUSD.sol')
const PoolAGOUSD                = artifacts.require('PoolAGOUSD.sol')
const MockChainlinkAggregator_USDTUSD   = artifacts.require('MockChainlinkAggregator_USDTUSD.sol')
const MockChainlinkAggregator_WETHUSD   = artifacts.require('MockChainlinkAggregator_WETHUSD.sol')
const USDTOracle                = artifacts.require('USDTOracle.sol')


module.exports = async (_deployer, _network, _accounts) => {
    const owner             = _accounts[0]    
    const devFund           = _accounts[0]
    const creator           = _accounts[0]

    let _Mock_USDT_instance     
    let _Mock_WETH_instance
    let _TreasuryAGOUSD_instance
    let _AGOUSD_instance
    let _CNUSD_instance
    let _PoolAGOUSD_instance
    let _MockChainlinkAggregator_USDTUSD_instance
    let _USDTOracle_instance


    //mock tokens line USDT, WETH and other
    await _deployer.deploy(Mock_USDT, owner, 'USDT', 18).then( async i => {
        _Mock_USDT_instance = writeAddress(i)
        await _Mock_USDT_instance.mint(owner, _ONE_THOUSAND_.mul(10).toHexString())
    })

    await _deployer.deploy(Mock_WETH, owner, 'WETH', 18).then( async i => {
        _Mock_WETH_instance = writeAddress(i)
        await _Mock_WETH_instance.mint(owner, _ONE_THOUSAND_.mul(10).toHexString())
    })

    //AGOUSD and his share and treasury with initialization
    await _deployer.deploy(TreasuryAGOUSD).then( async i => {
        _TreasuryAGOUSD_instance = writeAddress(i)
    })

    await _deployer.deploy(AGOUSD, 'Argano Dollar token', 'AGOUSD', _TreasuryAGOUSD_instance.address).then( async i => {
        _AGOUSD_instance = writeAddress(i)
        await _AGOUSD_instance.initialize()
        await _TreasuryAGOUSD_instance.setDollarAddress(_AGOUSD_instance.address)
    })

    await _deployer.deploy(CNUSD, 'Catena Dollar share token', 'CNUSD', _TreasuryAGOUSD_instance.address).then( async i => {
        _CNUSD_instance = writeAddress(i)
        await _CNUSD_instance.initialize(devFund, creator, startTime)
        await _TreasuryAGOUSD_instance.setShareAddress(_CNUSD_instance.address)
    }) 
    
                                                            //1.2$
    await _deployer.deploy(MockChainlinkAggregator_USDTUSD, '120000000', 8).then(i => {_MockChainlinkAggregator_USDTUSD_instance = writeAddress(i)})
    await _deployer.deploy(USDTOracle, _MockChainlinkAggregator_USDTUSD_instance.address).then(i => {_USDTOracle_instance = writeAddress(i)})
        
    await _deployer.deploy(PoolAGOUSD, 
        _AGOUSD_instance.address,
        _CNUSD_instance.address,
        _Mock_USDT_instance.address,
        _TreasuryAGOUSD_instance.address,
        _ONE_THOUSAND_.mul(500000000).toHexString()//pool celling 500m AGOUSD
    ).then( async i => {
        _PoolAGOUSD_instance = writeAddress(i)
        await _TreasuryAGOUSD_instance.addPool(_PoolAGOUSD_instance.address)
        await _PoolAGOUSD_instance.setOracle(_USDTOracle_instance.address)
    })
                                                                        //100k
    await _AGOUSD_instance.approve(_PoolAGOUSD_instance.address, _ONE_THOUSAND_.mul(500000000))
    await _Mock_USDT_instance.approve(_PoolAGOUSD_instance.address, _ONE_THOUSAND_.mul(500000000))

    console.log('mint')
    console.log(`mint puased = ${await _PoolAGOUSD_instance.mint_paused()}`)
    await _PoolAGOUSD_instance.mint.estimateGas(_ONE_, 0, 0).then(console.log).catch(console.log)
    await _AGOUSD_instance.balanceOf(owner)
 
    // console.log('redeem')
    // await _PoolAGOUSD_instance.redeem(1000000, 0, 0)

    // console.log('collectRedemption')
    // await _PoolAGOUSD_instance.collectRedemption()
}
