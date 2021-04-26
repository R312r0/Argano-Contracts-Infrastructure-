require('dotenv').config({})
const BigNumber = require ('ethers').BigNumber
const {logToFile} = require('../logToFile.js')
const uniswapV2RouterAbi = require('../uniswapV2RouterAbi.json')
const Web3 = require('web3')
const { networks } = require('../truffle-config.js')
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
const MockChainlinkAggregator_USDTUSD = artifacts.require('MockChainlinkAggregator_USDTUSD.sol')
const MockChainlinkAggregator_WETHUSD = artifacts.require('MockChainlinkAggregator_WETHUSD.sol')
const USDTOracle = artifacts.require('USDTOracle.sol')
const DollarOracle = artifacts.require('DollarOracle.sol')
const ShareOracle = artifacts.require('ShareOracle.sol')

const timelockDelay = 12 * 60 * 60
const startTime = Math.floor(new Date('2021-04-21T09:00:00.000+00:00').getTime() / 1000)
const ONE_THOUSAND = BigNumber.from('1000000000000000000000')

module.exports = async (deployer, network, accounts) => {
    // const timelock_admin    = accounts[0]
    const devFund           = accounts[0]
    const owner           = accounts[0]
    const creator           = accounts[0]

    const Mock_USDT_instance        = await Mock_USDT.      at(previouslyDeployedContracts.Mock_USDT)
    const Mock_WETH_instance        = await Mock_WETH.      at(previouslyDeployedContracts.Mock_WETH)
    const TreasuryAGOUSD_instance   = await TreasuryAGOUSD. at(previouslyDeployedContracts.TreasuryAGOUSD)
    const AGOUSD_instance           = await AGOUSD.         at(previouslyDeployedContracts.AGOUSD)
    const CNUSD_instance            = await CNUSD.          at(previouslyDeployedContracts.CNUSD)

    // if (network === 'rinkeby') {
    //     const web3 = new Web3(networks[network].provider())
    //     const UniswapV2Router_instance = new web3.eth.Contract(require('../uniswapV2RouterAbi.json'), process.env.uniswapV2Router_rinkeby)
    //     const UniswapV2Factory_instance = new web3.eth.Contract(require('../uniswapV2FactoryAbi.json'), process.env.uniswapV2Factory_rinkeby)

    //     console.log('approves')
    //     await CNUSD_instance.approve(process.env.uniswapV2Router_rinkeby, ONE_THOUSAND)
    //     await Mock_WETH_instance.approve(process.env.uniswapV2Router_rinkeby, ONE_THOUSAND)

    //     console.log('approves end!')
    //     console.log(`CNUSD balance of ${owner} is a ${await _CNUSD_instance.balanceOf(owner)}`)

        // await UniswapV2Router_instance.methods.addLiquidity(
        //     CNUSD_instance.address, 
        //     Mock_WETH_instance.address,
        //     await _CNUSD_instance.balanceOf(owner),
        //     ONE_THOUSAND,
        //     0,
        //     0,
        //     devFund,
        //     Math.floor(Date.now() + 10000)
        // )
        // .send({from: devFund, gasLimit: 8000000 })
        // .then(console.log)
        // .catch(console.error)

        // await UniswapV2Factory_instance.methods.getPair(CNUSD_instance.address, Mock_WETH_instance.address)
        // .call()
        // .then(writeAddress)
        // .catch(console.error)
    //   }

      return

//========================================================AGOUSD=========================================================================


    const mock_AGOUSD_USDT_instance = writeAddress(await deployer.deploy(MockPairOracle, 900000))//0.9$
    const mock_CNUSD_WETH_instance = writeAddress(await deployer.deploy(MockPairOracle, 200000000))
    const mock_chainLink_priceFeed_USDT_USD_instance = writeAddress(await deployer.deploy(MockChainlinkAggregator_USDTUSD, '100498532', 8))//usdt cost 1.0049$
    const mock_chainLink_priceFeed_WETH_USD_instance = writeAddress(await deployer.deploy(MockChainlinkAggregator_WETHUSD, '200500000000', 8))//weth cost 2005$
    const USDT_oracle_instance = writeAddress(await deployer.deploy(USDTOracle, mock_chainLink_priceFeed_USDT_USD_instance.address))

    logToFile(`truffle run verify ${Object.keys({USDTOracle})                [0]}@${USDT_oracle_instance.address                        } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({MockChainlinkAggregator_USDTUSD})   [0]}@${mock_chainLink_priceFeed_USDT_USD_instance.address  } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({MockChainlinkAggregator_WETHUSD})   [0]}@${mock_chainLink_priceFeed_WETH_USD_instance.address  } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({MockPairOracle})            [0]}@${mock_CNUSD_WETH_instance.address                    } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({MockPairOracle})            [0]}@${mock_AGOUSD_USDT_instance.address                   } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({Mock_USDT})                 [0]}@${Mock_USDT_instance.address                          } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({Mock_WETH_instance})        [0]}@${Mock_WETH_instance.address                          } --network rinkeby`)



    const PoolAGOUSD_mock_USDT = writeAddress(await deployer.deploy(PoolAGOUSD, 
        AGOUSD_instance.address,
        CNUSD_instance.address,
        Mock_USDT_instance.address,
        TreasuryAGOUSD_instance.address,
        ONE_THOUSAND.toHexString()
    ))

    await TreasuryAGOUSD_instance.addPool(PoolAGOUSD_mock_USDT.address)
    await PoolAGOUSD_mock_USDT.setOracle(USDT_oracle_instance.address)

    logToFile(`truffle run verify ${Object.keys({TreasuryAGOUSD})   [0]}@${TreasuryAGOUSD_instance.address  } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({AGOUSD})           [0]}@${AGOUSD_instance.address          } --network rinkeby`)
    logToFile(`truffle run verify ${Object.keys({CNUSD})            [0]}@${CNUSD_instance.address           } --network rinkeby`)
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
        ONE_THOUSAND.toHexString()
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

    // approves
    // const pair     
    // createPair(address tokenA, address tokenB) external returns (address pair)


    
        
    

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

