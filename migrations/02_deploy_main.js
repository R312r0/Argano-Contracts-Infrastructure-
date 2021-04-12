const BigNumber = require ('ethers').BigNumber
const {logToFile} = require('../logToFile.js')

const Timelock = artifacts.require('Timelock.sol')
const Treasury = artifacts.require('Treasury.sol')
const Dollar = artifacts.require('Dollar.sol')
const Share = artifacts.require('Share.sol')
const MockCollateral = artifacts.require('MockCollateral.sol')
const Pool = artifacts.require('Pool.sol')
const MockPairOracle = artifacts.require('MockPairOracle.sol')
const MockChainlinkAggregator = artifacts.require('MockChainlinkAggregator.sol')
const BusdOracle = artifacts.require('BusdOracle.sol')
const DollarOracle = artifacts.require('DollarOracle.sol')
const ShareOracle = artifacts.require('ShareOracle.sol')

const timelockDelay = 12 * 60 * 60
const startTime = Math.floor(new Date('2021-02-25T09:00:00.000+00:00').getTime() / 1000);

module.exports = async (deployer, network, accounts) => {
    const devFund = accounts[0]
    const timelock_admin = accounts[0]
    const creator = accounts[0]
    
    console.log(`DevFund address: ${devFund}`)
    console.log(`timelock_admin address: ${timelock_admin}`)

    
    const TimelockInstance = await deployer.deploy(Timelock, timelock_admin, timelockDelay)
    const TreasuryInstance = await deployer.deploy(Treasury)
    const DollarInstance = await deployer.deploy(Dollar, 'ARGANO dollar', 'agoUSD', TreasuryInstance.address)
    const ShareInstance = await deployer.deploy(Share, 'ARGANO dollar share', 'agoShareUSD', TreasuryInstance.address)
    
    await TreasuryInstance.setDollarAddress(DollarInstance.address)
    await TreasuryInstance.setShareAddress(ShareInstance.address)
    
    await DollarInstance.initialize()
    await ShareInstance.initialize(devFund, creator, startTime)
    
    //collateral
    const mockUSDT_instance = await deployer.deploy(MockCollateral, creator, 'USDT', 18)
    const mockWETH_instance = await deployer.deploy(MockCollateral, creator, 'WETH', 18)
    
    //pool
    const poolUSDT_instance = await deployer.deploy(Pool, 
        DollarInstance.address,
        ShareInstance.address,
        mockUSDT_instance.address,
        TreasuryInstance.address,
        BigNumber.from('100000000000000000000000000').toHexString()
    )
        
    await TreasuryInstance.addPool(poolUSDT_instance.address)
    
    //oracles
    const mock_agoUSD_USDT_instance = await deployer.deploy(MockPairOracle, 900000)//0.9$
    const mock_agoShare_WETH_instance = await deployer.deploy(MockPairOracle, 20000)
    const mock_chainLink_priceFeed_USDT_USD_instance = await deployer.deploy(MockChainlinkAggregator, '100498532', 8)//usdt cost 1.0049$
    const mock_chainLink_priceFeed_WETH_USD_instance = await deployer.deploy(MockChainlinkAggregator, '200500000000', 8)//weth cost 2005$
    const USDT_oracle_instance = await deployer.deploy(BusdOracle, mock_chainLink_priceFeed_USDT_USD_instance.address)
    const DollarOracleinstance = await deployer.deploy(DollarOracle, DollarInstance.address, mock_agoUSD_USDT_instance.address, USDT_oracle_instance.address)
    const ShareOracleinstance = await deployer.deploy(ShareOracle, ShareInstance.address, mock_agoShare_WETH_instance.address, mock_chainLink_priceFeed_WETH_USD_instance.address)
    
    await poolUSDT_instance.setOracle(USDT_oracle_instance.address)
    await TreasuryInstance.setOracleDollar(DollarOracleinstance.address)
    await TreasuryInstance.setOracleShare(ShareOracleinstance.address)
    
    await TreasuryInstance.setRebalancePool(poolUSDT_instance.address)
    
    await mock_agoUSD_USDT_instance.setPeriod(1);
    await mock_agoShare_WETH_instance.setPeriod(1);
    
    await mock_agoUSD_USDT_instance.update();
    await mock_agoShare_WETH_instance.update();


    console.log(`truffle run verify ${Object.keys({ShareOracle})[0]}@${ShareOracleinstance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({DollarOracle})[0]}@${DollarOracleinstance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({BusdOracle})[0]}@${USDT_oracle_instance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({MockChainlinkAggregator})[0]}@${mock_chainLink_priceFeed_WETH_USD_instance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({MockChainlinkAggregator})[0]}@${mock_chainLink_priceFeed_USDT_USD_instance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({MockPairOracle})[0]}@${mock_agoShare_WETH_instance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({MockPairOracle})[0]}@${mock_agoUSD_USDT_instance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({Pool})[0]}@${poolUSDT_instance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({MockCollateral})[0]}@${mockWETH_instance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({MockCollateral})[0]}@${mockUSDT_instance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({Share})[0]}@${ShareInstance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({Dollar})[0]}@${DollarInstance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({Timelock})[0]}@${TimelockInstance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({Treasury})[0]}@${TreasuryInstance.address} --network rinkeby`)
}