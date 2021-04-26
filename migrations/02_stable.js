const {writeAddress} = require('../logToFile.js')
const startTime         = Math.floor(new Date('2021-04-21T09:00:00.000+00:00').getTime() / 1000)


const BigNumber = require ('ethers').BigNumber
const _ONE_             = BigNumber.from('1000000000000000000')
const _ONE_THOUSAND_    = BigNumber.from('1000000000000000000000')

const Mock_USDT                 = artifacts.require('Mock_USDT.sol')
const Mock_WETH                 = artifacts.require('Mock_WETH.sol')
const MockPairOracle            = artifacts.require('MockPairOracle.sol')
const TreasuryAGOUSD            = artifacts.require('TreasuryAGOUSD.sol')
const AGOUSD                    = artifacts.require('AGOUSD.sol')
const CNUSD                     = artifacts.require('CNUSD.sol')
const PoolAGOUSD                = artifacts.require('PoolAGOUSD.sol')
const MockChainlinkAggregator_USDTUSD = artifacts.require('MockChainlinkAggregator_USDTUSD.sol')
const MockChainlinkAggregator_WETHUSD = artifacts.require('MockChainlinkAggregator_WETHUSD.sol')
const USDTOracle                = artifacts.require('USDTOracle.sol')
const DollarOracle              = artifacts.require('DollarOracle.sol')
const ShareOracle               = artifacts.require('ShareOracle.sol')


module.exports = async (_deployer, _network, _accounts) => {
    const owner             = _accounts[0]   
    const devFund           = _accounts[0]
    const creator           = _accounts[0]

    //mock tokens line USDT, WETH and other
    const _USDT_ins = await writeAddress(_deployer.deploy(Mock_USDT, owner, 'USDT', 18))
    await _USDT_ins.mint(owner, _ONE_THOUSAND_.mul(10).toHexString())

    const _WETH_ins = writeAddress(await _deployer.deploy(Mock_WETH, owner, 'WETH', 18))
    await _WETH_ins.mint(owner, _ONE_THOUSAND_.mul(10).toHexString())


    //AGOUSD and his share and treasury with initialization
    const _TreasuryAGOUSD_ins = writeAddress(await _deployer.deploy(TreasuryAGOUSD))
    await _TreasuryAGOUSD_ins.setStrategist(owner)
    // await _TreasuryAGOUSD_ins.toggleCollateralRatio()
    // await _TreasuryAGOUSD_ins.toggleEffectiveCollateralRatio()




    const _AGOUSD_ins = writeAddress(await _deployer.deploy(AGOUSD, 'Argano Dollar token', 'AGOUSD', _TreasuryAGOUSD_ins.address))
    await _AGOUSD_ins.initialize()
    await _TreasuryAGOUSD_ins.setDollarAddress(_AGOUSD_ins.address)

    const _CNUSD_ins = writeAddress(await _deployer.deploy(CNUSD, 'Catena Dollar share token', 'CNUSD', _TreasuryAGOUSD_ins.address))
    await _CNUSD_ins.initialize(devFund, creator, startTime)
    await _TreasuryAGOUSD_ins.setShareAddress(_CNUSD_ins.address)




    const _MockChainlinkAggregator_USDTUSD_ins = writeAddress(await _deployer.deploy(MockChainlinkAggregator_USDTUSD, '120000000', 8))
    const _USDTOracle_ins                      = writeAddress(await _deployer.deploy(USDTOracle, _MockChainlinkAggregator_USDTUSD_ins.address))
        
    const _MockChainlinkAggregator_WETHUSD_ins = writeAddress(await _deployer.deploy(MockChainlinkAggregator_WETHUSD, '200000000000', 8))
    const _WETHOracle_ins                      = writeAddress(await _deployer.deploy(USDTOracle, _MockChainlinkAggregator_WETHUSD_ins.address))
        
    const _PoolAGOUSD_ins = writeAddress(await _deployer.deploy(PoolAGOUSD, 
        _AGOUSD_ins.address,
        _CNUSD_ins.address,
        _USDT_ins.address,
        _TreasuryAGOUSD_ins.address,
        _ONE_THOUSAND_.mul(500000000).toHexString()//pool celling 500m AGOUSD
    ))
    await _TreasuryAGOUSD_ins.addPool(_PoolAGOUSD_ins.address)
    await _PoolAGOUSD_ins.setOracle(_USDTOracle_ins.address)
    
                                                                       
    await _AGOUSD_ins.approve(_PoolAGOUSD_ins.address, _ONE_THOUSAND_.mul(500000000))
    await _USDT_ins.approve(_PoolAGOUSD_ins.address, _ONE_THOUSAND_.mul(500000000))

    const mock_AGOUSD_USDT_ins = writeAddress(await _deployer.deploy(MockPairOracle, 900000))
    const mock_CNUSD_WETH_ins = writeAddress(await _deployer.deploy(MockPairOracle, 200000000))

    const _AGOUSDOracle_ins = writeAddress(await _deployer.deploy(DollarOracle, _AGOUSD_ins.address, mock_AGOUSD_USDT_ins.address, _USDTOracle_ins.address))
    const _CNUSDOracle_ins = writeAddress(await _deployer.deploy(ShareOracle, _CNUSD_ins.address, mock_CNUSD_WETH_ins.address, _WETHOracle_ins.address))
    
    await _TreasuryAGOUSD_ins.setOracleDollar(_AGOUSDOracle_ins.address)
    await _TreasuryAGOUSD_ins.setOracleShare(_CNUSDOracle_ins.address)
    await _TreasuryAGOUSD_ins.setRebalancePool(_PoolAGOUSD_ins.address)
}
