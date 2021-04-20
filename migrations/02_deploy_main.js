const BigNumber = require ('ethers').BigNumber
const {logToFile} = require('../logToFile.js')

const Timelock = artifacts.require('Timelock.sol')
const TreasuryAGOUSD = artifacts.require('TreasuryAGOUSD.sol')
const TreasuryAGOBTC = artifacts.require('TreasuryAGOBTC.sol')
const AGOUSD = artifacts.require('AGOUSD.sol')
const CNUSD = artifacts.require('CNUSD.sol')
const AGOBTC = artifacts.require('AGOBTC.sol')
const CNBTC = artifacts.require('CNBTC.sol')
const Mock_USDT = artifacts.require('Mock_USDT.sol')
const Mock_WETH = artifacts.require('Mock_WETH.sol')
const PoolAGOUSD = artifacts.require('PoolAGOUSD.sol')
const PoolAGOBTC = artifacts.require('PoolAGOBTC.sol')
const MockPairOracle = artifacts.require('MockPairOracle.sol')
const MockChainlinkAggregator = artifacts.require('MockChainlinkAggregator.sol')
const USDTOracle = artifacts.require('USDTOracle.sol')
const DollarOracle = artifacts.require('DollarOracle.sol')
const ShareOracle = artifacts.require('ShareOracle.sol')

const timelockDelay = 12 * 60 * 60
const startTime = Math.floor(new Date('2021-02-25T09:00:00.000+00:00').getTime() / 1000)
const ONE_THOUSAND = BigNumber.from('1000000000000000000000').toHexString()

module.exports = async (deployer, network, accounts) => {
    const devFund = accounts[0]
    const timelock_admin = accounts[0]
    const creator = accounts[0]
    
    console.log(`DevFund address: ${devFund}`)
    console.log(`timelock_admin address: ${timelock_admin}`)

    logToFile(`start`)
    
    const TimelockInstance = await deployer.deploy(Timelock, timelock_admin, timelockDelay)
    // logToFile(`truffle run verify ${Object.keys({Timelock})[0]}@${TimelockInstance.address} --network rinkeby`)

    const Mock_USDT_token = await deployer.deploy(Mock_USDT, devFund, 'USDT', 18)
    await Mock_USDT_token.mint(devFund, ONE_THOUSAND)
    logToFile(`truffle run verify ${Object.keys({Mock_USDT})[0]}@${Mock_USDT_token.address} --network rinkeby`)

    const Mock_WETH_token = await deployer.deploy(Mock_WETH, devFund, 'WETH', 18)
    await Mock_WETH_token.mint(devFund, ONE_THOUSAND)
    logToFile(`truffle run verify ${Object.keys({Mock_WETH_token})[0]}@${Mock_WETH_token.address} --network rinkeby`)

    const mock_agoUSD_USDT_instance = await deployer.deploy(MockPairOracle, 900000)//0.9$
    logToFile(`truffle run verify ${Object.keys({MockPairOracle})[0]}@${mock_agoUSD_USDT_instance.address} --network rinkeby`)
    const mock_agoShare_WETH_instance = await deployer.deploy(MockPairOracle, 200000000)
    logToFile(`truffle run verify ${Object.keys({MockPairOracle})[0]}@${mock_agoShare_WETH_instance.address} --network rinkeby`)
    const mock_chainLink_priceFeed_USDT_USD_instance = await deployer.deploy(MockChainlinkAggregator, '100498532', 8)//usdt cost 1.0049$
    logToFile(`truffle run verify ${Object.keys({MockChainlinkAggregator})[0]}@${mock_chainLink_priceFeed_USDT_USD_instance.address} --network rinkeby`)
    const mock_chainLink_priceFeed_WETH_USD_instance = await deployer.deploy(MockChainlinkAggregator, '200500000000', 8)//weth cost 2005$
    logToFile(`truffle run verify ${Object.keys({MockChainlinkAggregator})[0]}@${mock_chainLink_priceFeed_WETH_USD_instance.address} --network rinkeby`)
    const USDT_oracle_instance = await deployer.deploy(USDTOracle, mock_chainLink_priceFeed_USDT_USD_instance.address)
    logToFile(`truffle run verify ${Object.keys({USDTOracle})[0]}@${USDT_oracle_instance.address} --network rinkeby`)

    const TreasuryAGOUSD_contract = await deployer.deploy(TreasuryAGOUSD)
    const AGOUSD_token = await deployer.deploy(AGOUSD, 'Argano Dollar token', 'AGOUSD', TreasuryAGOUSD_contract.address)
    const CNUSD_token = await deployer.deploy(CNUSD, 'Catena Dollar share token', 'CNUSD', TreasuryAGOUSD_contract.address)
    await TreasuryAGOUSD_contract.setDollarAddress(AGOUSD_token.address)
    await TreasuryAGOUSD_contract.setShareAddress(CNUSD_token.address)
    await AGOUSD_token.initialize()
    await CNUSD_token.initialize(devFund, creator, startTime)
    const PoolAGOUSD_mock_USDT = await deployer.deploy(PoolAGOUSD, 
        AGOUSD_token.address,
        CNUSD_token.address,
        Mock_USDT_token.address,
        TreasuryAGOUSD_contract.address,
        BigNumber.from('100000000000000000000000000').toHexString()
    )
    await TreasuryAGOUSD_contract.addPool(PoolAGOUSD_mock_USDT.address)
    await PoolAGOUSD_mock_USDT.setOracle(USDT_oracle_instance.address)

    logToFile(`truffle run verify ${Object.keys({TreasuryAGOUSD})[0]}@${TreasuryAGOUSD_contract.address} --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({AGOUSD})[0]}@${AGOUSD_token.address} --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({CNUSD})[0]}@${CNUSD_token.address} --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({PoolAGOUSD})[0]}@${PoolAGOUSD_mock_USDT.address} --network rinkeby`)



    const TreasuryAGOBTC_contract = await deployer.deploy(TreasuryAGOBTC)
    const AGOBTC_token = await deployer.deploy(AGOBTC, 'Argano Bitcoin token', 'AGOBTC', TreasuryAGOBTC_contract.address)//TreasuryAGOUSD_contract.address)
    const CNBTC_token = await deployer.deploy(CNBTC, 'Catena Bitcoin share token', 'CNBTC', TreasuryAGOBTC_contract.address)//TreasuryAGOUSD_contract.address)
    await TreasuryAGOBTC_contract.setDollarAddress(AGOBTC_token.address)
    await TreasuryAGOBTC_contract.setShareAddress(CNBTC_token.address)
    await AGOBTC_token.initialize()
    await CNBTC_token.initialize(devFund, creator, startTime)
    const PoolAGOBTC_mock_USDT = await deployer.deploy(PoolAGOBTC, 
        AGOBTC_token.address,
        CNBTC_token.address,
        Mock_USDT_token.address,
        TreasuryAGOBTC_contract.address,
        BigNumber.from('100000000000000000000000000').toHexString()
    )
    await TreasuryAGOBTC_contract.addPool(PoolAGOBTC_mock_USDT.address)
    await PoolAGOBTC_mock_USDT.setOracle(USDT_oracle_instance.address)

    logToFile(`truffle run verify ${Object.keys({TreasuryAGOBTC})[0]}@${TreasuryAGOBTC_contract.address} --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({AGOBTC})[0]}@${AGOBTC_token.address} --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({CNBTC})[0]}@${CNBTC_token.address} --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({PoolAGOBTC})[0]}@${PoolAGOBTC_mock_USDT.address} --network rinkeby`)
    
    //oracles

    const AGOUSDOracle_contract = await deployer.deploy(DollarOracle, AGOUSD_token.address, mock_agoUSD_USDT_instance.address, USDT_oracle_instance.address)
    const CNUSDOracle_contract = await deployer.deploy(ShareOracle, CNUSD_token.address, mock_agoShare_WETH_instance.address, mock_chainLink_priceFeed_WETH_USD_instance.address)
    await TreasuryAGOUSD_contract.setOracleDollar(AGOUSDOracle_contract.address)
    await TreasuryAGOUSD_contract.setOracleShare(CNUSDOracle_contract.address)
    await TreasuryAGOUSD_contract.setRebalancePool(PoolAGOUSD_mock_USDT.address)
    await mock_agoUSD_USDT_instance.setPeriod(1);
    await mock_agoShare_WETH_instance.setPeriod(1);
    await mock_agoUSD_USDT_instance.update();
    await mock_agoShare_WETH_instance.update();

    logToFile(`truffle run verify ${Object.keys({DollarOracle})[0]}@${AGOUSDOracle_contract.address} --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({ShareOracle})[0]}@${CNUSDOracle_contract.address} --network rinkeby`)

    // const AGOBTCOracle_contract = await deployer.deploy(DollarOracle, AGOBTC_token.address, mock_agoUSD_USDT_instance.address, USDT_oracle_instance.address)
    // const CNBTCOracle_contract = await deployer.deploy(ShareOracle, CNUSD_token.address, mock_agoShare_WETH_instance.address, mock_chainLink_priceFeed_WETH_USD_instance.address)
    // await TreasuryAGOUSD_contract.setOracleDollar(AGOBTCOracle_contract.address)
    // await TreasuryAGOUSD_contract.setOracleShare(CNUSDOracle_contract.address)
    // await TreasuryAGOUSD_contract.setRebalancePool(PoolAGOUSD_mock_USDT.address)
    // await mock_agoUSD_USDT_instance.setPeriod(1);
    // await mock_agoShare_WETH_instance.setPeriod(1);
    // await mock_agoUSD_USDT_instance.update();
    // await mock_agoShare_WETH_instance.update();

    // logToFile(`truffle run verify ${Object.keys({DollarOracle})[0]}@${AGOBTCOracle_contract.address} --network rinkeby`)
    // logToFile(`truffle run verify ${Object.keys({ShareOracle})[0]}@${CNUSDOracle_contract.address} --network rinkeby`)


    // console.log(`truffle run verify ${Object.keys({ShareOracle})[0]}@${CNUSDOracle_contract.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({DollarOracle})[0]}@${AGOUSDOracle_contract.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({BusdOracle})[0]}@${USDT_oracle_instance.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({MockChainlinkAggregator})[0]}@${mock_chainLink_priceFeed_WETH_USD_instance.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({MockChainlinkAggregator})[0]}@${mock_chainLink_priceFeed_USDT_USD_instance.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({MockPairOracle})[0]}@${mock_agoShare_WETH_instance.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({MockPairOracle})[0]}@${mock_agoUSD_USDT_instance.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({Pool})[0]}@${pool_mock_USDT.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({Mock_WETH_token})[0]}@${Mock_WETH_token.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({Mock_USDT_token})[0]}@${Mock_USDT_token.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({CNUSD_token})[0]}@${CNUSD_token.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({AGOUSD_token})[0]}@${AGOUSD_token.address} --network rinkeby`)
    // // console.log(`truffle run verify ${Object.keys({Timelock})[0]}@${TimelockInstance.address} --network rinkeby`)
    // console.log(`truffle run verify ${Object.keys({TreasuryAGOUSD_contract})[0]}@${TreasuryAGOUSD_contract.address} --network rinkeby`)
}