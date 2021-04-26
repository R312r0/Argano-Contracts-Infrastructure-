require('dotenv').config({})
const BigNumber = require ('ethers').BigNumber
const {logToFile} = require('../logToFile.js')
const uniswapV2RouterAbi = require('../uniswapV2RouterAbi.json')
const Web3 = require('web3')
const web3 = new Web3(process.env.RINKEBY_INFURA)
const fs = require("fs")
const previouslyDeployedContracts = require('../lastDeployedAddresses.json')

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
// const MockChainlinkAggregator = artifacts.require('MockChainlinkAggregator.sol')
const USDTOracle = artifacts.require('USDTOracle.sol')
const DollarOracle = artifacts.require('DollarOracle.sol')
const ShareOracle = artifacts.require('ShareOracle.sol')

const timelockDelay = 12 * 60 * 60
const startTime = Math.floor(new Date('2021-04-21T09:00:00.000+00:00').getTime() / 1000)
const ONE_THOUSAND = BigNumber.from('1000000000000000000000').toHexString()

module.exports = async (deployer, network, accounts) => {
    return
    const devFund           = accounts[0]
    const timelock_admin    = accounts[0]
    const creator           = accounts[0]

    // const UniswapV2Router_instance = new web3.eth.Contract(uniswapV2RouterAbi, process.env.uniswapV2Router_rinkeby)

    logToFile(`start`)
    
    const TimelockInstance = await deployer.deploy(Timelock, timelock_admin, timelockDelay)
    // logToFile(`truffle run verify ${Object.keys({Timelock})[0]}@${TimelockInstance.address} --network rinkeby`)

    const Mock_USDT_instance = writeAddress(await deployer.deploy(Mock_USDT, devFund, 'USDT', 18))
    await Mock_USDT_instance.mint(devFund, ONE_THOUSAND)
    
    const Mock_WETH_instance = writeAddress(await deployer.deploy(Mock_WETH, devFund, 'WETH', 18))
    await Mock_WETH_instance.mint(devFund, ONE_THOUSAND)
    

//========================================================AGOUSD=========================================================================


    const mock_AGOUSD_USDT_instance = writeAddress(await deployer.deploy(MockPairOracle, 900000))//0.9$
    const mock_CNUSD_WETH_instance = writeAddress(await deployer.deploy(MockPairOracle, 200000000))
    const mock_chainLink_priceFeed_USDT_USD_instance = writeAddress(await deployer.deploy(MockChainlinkAggregator, '100498532', 8))//usdt cost 1.0049$
    const mock_chainLink_priceFeed_WETH_USD_instance = writeAddress(await deployer.deploy(MockChainlinkAggregator, '200500000000', 8))//weth cost 2005$
    const USDT_oracle_instance = writeAddress(await deployer.deploy(USDTOracle, mock_chainLink_priceFeed_USDT_USD_instance.address))

    logToFile(`truffle run verify ${Object.keys({USDTOracle})                [0]}@${USDT_oracle_instance.address                        } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({MockChainlinkAggregator})   [0]}@${mock_chainLink_priceFeed_WETH_USD_instance.address  } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({MockChainlinkAggregator})   [0]}@${mock_chainLink_priceFeed_USDT_USD_instance.address  } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({MockPairOracle})            [0]}@${mock_CNUSD_WETH_instance.address                    } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({MockPairOracle})            [0]}@${mock_AGOUSD_USDT_instance.address                   } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({Mock_USDT})                 [0]}@${Mock_USDT_instance.address                             } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({Mock_WETH_instance})           [0]}@${Mock_WETH_instance.address                             } --network rinkeby`)

    const TreasuryAGOUSD_instance = writeAddress(await deployer.deploy(TreasuryAGOUSD))
    const AGOUSD_instance = writeAddress(await deployer.deploy(AGOUSD, 'Argano Dollar token', 'AGOUSD', TreasuryAGOUSD_instance.address))
    const CNUSD_instance = writeAddress(await deployer.deploy(CNUSD, 'Catena Dollar share token', 'CNUSD', TreasuryAGOUSD_instance.address))

    await TreasuryAGOUSD_instance.setDollarAddress(AGOUSD_instance.address)
    await TreasuryAGOUSD_instance.setShareAddress(CNUSD_instance.address)
    await AGOUSD_instance.initialize()
    await CNUSD_instance.initialize(devFund, creator, startTime)

    const PoolAGOUSD_mock_USDT = writeAddress(await deployer.deploy(PoolAGOUSD, 
        AGOUSD_instance.address,
        CNUSD_instance.address,
        Mock_USDT_instance.address,
        TreasuryAGOUSD_instance.address,
        BigNumber.from('100000000000000000000000000').toHexString()
    ))

    await TreasuryAGOUSD_instance.addPool(PoolAGOUSD_mock_USDT.address)
    await PoolAGOUSD_mock_USDT.setOracle(USDT_oracle_instance.address)

    logToFile(`truffle run verify ${Object.keys({TreasuryAGOUSD})   [0]}@${TreasuryAGOUSD_instance.address  } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({AGOUSD})           [0]}@${AGOUSD_instance.address             } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({CNUSD})            [0]}@${CNUSD_instance.address              } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({PoolAGOUSD})       [0]}@${PoolAGOUSD_mock_USDT.address     } --network rinkeby`)


//=========================================================AGOBTC========================================================================


    const TreasuryAGOBTC_instance = writeAddress(await deployer.deploy(TreasuryAGOBTC))
    const AGOBTC_instance = writeAddress(await deployer.deploy(AGOBTC, 'Argano Bitcoin token', 'AGOBTC', TreasuryAGOBTC_instance.address))//TreasuryAGOUSD_instance.address)
    const CNBTC_instance = writeAddress(await deployer.deploy(CNBTC, 'Catena Bitcoin share token', 'CNBTC', TreasuryAGOBTC_instance.address))//TreasuryAGOUSD_instance.address)
    await TreasuryAGOBTC_instance.setDollarAddress(AGOBTC_instance.address)
    await TreasuryAGOBTC_instance.setShareAddress(CNBTC_instance.address)
    await AGOBTC_instance.initialize()
    await CNBTC_instance.initialize(devFund, creator, startTime)
    const PoolAGOBTC_mock_USDT = writeAddress(await deployer.deploy(PoolAGOBTC, 
        AGOBTC_instance.address,
        CNBTC_instance.address,
        Mock_USDT_instance.address,
        TreasuryAGOBTC_instance.address,
        BigNumber.from('100000000000000000000000000').toHexString()
    ))
    await TreasuryAGOBTC_instance.addPool(PoolAGOBTC_mock_USDT.address)
    await PoolAGOBTC_mock_USDT.setOracle(USDT_oracle_instance.address)

    logToFile(`truffle run verify ${Object.keys({TreasuryAGOBTC})[0]}@${TreasuryAGOBTC_instance.address} --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({AGOBTC})[0]}@${AGOBTC_instance.address} --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({CNBTC})[0]}@${CNBTC_instance.address} --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({PoolAGOBTC})[0]}@${PoolAGOBTC_mock_USDT.address} --network rinkeby`)
    
    //oracles

    const AGOUSDOracle_instance = writeAddress(await deployer.deploy(DollarOracle, AGOUSD_instance.address, mock_AGOUSD_USDT_instance.address, USDT_oracle_instance.address))
    const CNUSDOracle_instance = writeAddress(await deployer.deploy(ShareOracle, CNUSD_instance.address, mock_CNUSD_WETH_instance.address, mock_chainLink_priceFeed_WETH_USD_instance.address))
    
    await TreasuryAGOUSD_instance.setOracleDollar(AGOUSDOracle_instance.address)
    await TreasuryAGOUSD_instance.setOracleShare(CNUSDOracle_instance.address)
    await TreasuryAGOUSD_instance.setRebalancePool(PoolAGOUSD_mock_USDT.address)
return
    //approves
    // const res = await UniswapV2Router_instance.methods.addLiquidity(
    //     CNUSD_instance.address,
    //     Mock_WETH_instance.address,
    //     ONE_THOUSAND,
    //     ONE_THOUSAND,
    //     0,
    //     0,
    //     devFund,
    //     Math.floor(new Date().getTime() / 1000 + 1000)
    // ).send({
    //     from: devFund,
    // })

    // console.log(res)

    // //approves
    // await UniswapV2Router_instance.methods.addLiquidity(
    //     Mock_WETH_instance.address,
    //     Mock_USDT_instance.address,
    //     ONE_THOUSAND,
    //     ONE_THOUSAND,
    //     0,
    //     0,
    //     devFund,
    //     Math.floor(new Date().getTime() / 1000 + 1000)
    // ).send()

    // await TreasuryAGOUSD_instance.setUniswapParams(
    //     process.env.uniswapV2Router_rinkeby,
    //     _uniswap_pair_CNUSD_WETH,
    //     _uniswap_pair_WETH_USDT
    // )

    await mock_AGOUSD_USDT_instance.setPeriod(1)
    await mock_CNUSD_WETH_instance.setPeriod(1)
    await mock_AGOUSD_USDT_instance.update()
    await mock_CNUSD_WETH_instance.update()

    logToFile(`truffle run verify ${Object.keys({DollarOracle})[0]}@${AGOUSDOracle_instance.address} --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({ShareOracle})[0]}@${CNUSDOracle_instance.address} --network rinkeby`)

    // const AGOBTCOracle_instance = await deployer.deploy(DollarOracle, AGOBTC_instance.address, mock_AGOUSD_USDT_instance.address, USDT_oracle_instance.address)
    // const CNBTCOracle_instance = await deployer.deploy(ShareOracle, CNUSD_instance.address, mock_CNUSD_WETH_instance.address, mock_chainLink_priceFeed_WETH_USD_instance.address)
    // await TreasuryAGOUSD_instance.setOracleDollar(AGOBTCOracle_instance.address)
    // await TreasuryAGOUSD_instance.setOracleShare(CNUSDOracle_instance.address)
    // await TreasuryAGOUSD_instance.setRebalancePool(PoolAGOUSD_mock_USDT.address)
    // await mock_AGOUSD_USDT_instance.setPeriod(1);
    // await mock_CNUSD_WETH_instance.setPeriod(1);
    // await mock_AGOUSD_USDT_instance.update();
    // await mock_CNUSD_WETH_instance.update();

    // logToFile(`truffle run verify ${Object.keys({DollarOracle})[0]}@${AGOBTCOracle_instance.address} --network rinkeby`)
    // logToFile(`truffle run verify ${Object.keys({ShareOracle})[0]}@${CNUSDOracle_instance.address} --network rinkeby`)
}



const writeAddress = _instance => {
    let prev = undefined
    try {prev = require('../lastDeployedAddresses.json')}catch (e) {prev = {}}
    prev[_instance.constructor._json.contractName] = _instance.address
    fs.writeFileSync(`lastDeployedAddresses.json`, JSON.stringify(prev, null, 4), () => console.log(`${_instance.constructor._json.contractName}@${_instance.address} stored!`))
    
    return _instance
}

