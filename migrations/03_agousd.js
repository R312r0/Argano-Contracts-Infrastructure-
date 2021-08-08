"use strict"
const {writeAddress_raw} = require('../logToFile.js')
const env = require('./projectSettings.json')
const storage = './deployedAGOUSD.json'
const Big = require('big.js')
Big.PE = 100

const Dollar            = artifacts.require('Dollar.sol')
const Share             = artifacts.require('Share.sol')
const Pool              = artifacts.require('Pool.sol')
const Treasury          = artifacts.require('Treasury.sol')
const Foundry           = artifacts.require('Foundry.sol')
const CustomTokenOracle = artifacts.require('CustomTokenOracle.sol')
const PairOracle        = artifacts.require('PairOracle.sol')
const ChainLinkOracle   = artifacts.require('ChainLinkOracle.sol')
const web3              = Dollar.interfaceAdapter.web3

const govTokenAddress       = require('../lastDeployedAddresses.json').govToken
if (!govTokenAddress) process.exit('no governance token installed')
writeAddress_raw(govTokenAddress, 'govToken', storage)

const gov_token_wcoin_pair_address  = require('../lastDeployedAddresses.json').gov_token_wcoin_pair
console.log(gov_token_wcoin_pair_address)
if (!gov_token_wcoin_pair_address) process.exit('no governance token/wcoin pair installed')
writeAddress_raw(gov_token_wcoin_pair_address, 'gov_token_wcoin_pair_address', storage)



module.exports = async (_deployer, _network, _accounts) => {
    const owner = _accounts[0]

    let i_Treasury = undefined
    await _deployer.deploy(Treasury, env.startTime, env.epochLength).then(i => i_Treasury = i)

    const i_Dollar = await _deployer.deploy(Dollar,
        env.dollar.name,
        env.dollar.symbol,
        i_Treasury.address,
        new Big(env.dollar.initialSupply).toString()
    )
    await i_Dollar.mintGenesisSupply()
    console.log(`${new Big(env.dollar.initialSupply).toString()} ${env.dollar.symbol} minted to '${owner}'`)

    const i_Share = await _deployer.deploy(Share,
        env.share.name, 
        env.share.symbol,
        new Big(env.share.hardCap).toString(),
        new Big(env.share.initialSupply).toString(),
        new Big(env.share.communityRewardAllocation).toString(),
        i_Treasury.address,
        owner || "reward controller address"
    )
    await i_Share.mintGenesisSupply()
    console.log(`${new Big(env.share.initialSupply).toString()} ${env.share.symbol} minted to '${owner}'`)

    let dollar_collateral_pair = undefined
    let share_wcoin_pair = undefined
    let govToken_wcoin_pair = undefined

    let i_dollar_collateral_pairOracle = undefined
    let i_dollar_customTokenOracle = undefined

    let i_share_wcoin_pairOracle = undefined
    let i_share_customTokenOracle = undefined

    let i_govToken_wcoin_pairOracle = undefined
    let i_govToken_customTokenOracle = undefined

    if (env.pairs.needToGenerate){
        const router = new web3.eth.Contract(require('../abis/routerABI.json'), env.exchange.router)
        const factory = new web3.eth.Contract(require('../abis/factoryABI.json'), env.exchange.factory)

        const collateral = new web3.eth.Contract(require('../abis/collateral.json'), env.collateral.address)
        const collateralDecimals = await collateral.methods.decimals().call()
        const collateralSymbol = await collateral.methods.symbol().call()
        const ownerCollateralBalance = await collateral.methods.balanceOf(owner).call()

        const dollarDecimals = await i_Dollar.decimals()
        const dollarSymbol = await i_Dollar.symbol()
        const ownerDollarBalance = await i_Dollar.balanceOf(owner)

        const wcoin = new web3.eth.Contract(require('../abis/wcoin.json'), env.wrappedCoin.address) 
        const wcoinDecimals = await wcoin.methods.decimals().call()
        const wcoinSymbol = await wcoin.methods.symbol().call()
        const ownerWcoinBalance = await wcoin.methods.balanceOf(owner).call()

        
        const shareDecimals = await i_Share.decimals()
        const shareSymbol = await i_Share.symbol()
        const ownerShareBalance = await i_Share.balanceOf(owner)
        
        const govToken = new web3.eth.Contract(require('../abis/tokenABI.json'), govTokenAddress) 
        const govTokenDecimals = await govToken.methods.decimals().call()
        const govTokenSymbol = await govToken.methods.symbol().call()
        const govTokenBalance = await govToken.methods.balanceOf(owner).call()

        console.log(`\nbalance's of '${owner}':`)
        console.log(`\t- ${((ownerCollateralBalance / 10**collateralDecimals).toFixed(collateralDecimals/3))} ${collateralSymbol}`)
        console.log(`\t- ${((ownerDollarBalance / 10**dollarDecimals).toFixed(dollarDecimals/3))} ${dollarSymbol}`)
        console.log(`\t- ${((ownerWcoinBalance / 10**wcoinDecimals).toFixed(wcoinDecimals/3))} ${wcoinSymbol}`)
        console.log(`\t- ${((ownerShareBalance / 10**shareDecimals).toFixed(shareDecimals/3))} ${shareSymbol}`)

        // here need to check requirenments
        console.log(`\napproving for ${env.exchange.name}:`)

        await collateral.methods.approve(env.exchange.router, new Big(ownerCollateralBalance).toString()).send({from: owner})
        console.log(`\t+ ${collateralSymbol} for ${new Big(ownerCollateralBalance).toString()}`)

        await i_Dollar.approve(env.exchange.router, new Big(ownerDollarBalance).toString())
        console.log(`\t+ ${dollarSymbol} for ${new Big(ownerDollarBalance).toString()}`)

        await wcoin.methods.approve(env.exchange.router, new Big(ownerWcoinBalance).toString()).send({from: owner})
        console.log(`\t+ ${wcoinSymbol} for ${new Big(ownerWcoinBalance).toString()}`)

        await i_Share.approve(env.exchange.router, new Big(ownerShareBalance).toString())
        console.log(`\t+ ${shareSymbol} for ${new Big(ownerShareBalance).toString()}`)
        
        console.log(`\n${dollarSymbol}/${collateralSymbol} pair creating on ${env.exchange.name}:`)
        await router.methods.addLiquidity(
            i_Dollar.address, 
            collateral._address,
            new Big(env.pairs.defaultValues.dollar_amount).toString(), 
            new Big(env.pairs.defaultValues.collateral_amount).toString(), 
            0, 
            0, 
            owner, 
            Date.now() + 1000
        ).send({from: owner})
        dollar_collateral_pair = await factory.methods.getPair(i_Dollar.address, collateral._address).call()
        console.log(`\t+ [${dollarSymbol}${collateralSymbol}]@${dollar_collateral_pair}`)

        console.log(`\n${shareSymbol}/${wcoinSymbol} pair creating on ${env.exchange.name}:`)
        await router.methods.addLiquidity(
            i_Share.address, 
            wcoin._address,
            new Big(env.pairs.defaultValues.share_amount).toString(),
            new Big(env.pairs.defaultValues.wcoin_amount).toString(), 
            0, 
            0, 
            owner, 
            Date.now() + 1000
        ).send({from: owner})
        share_wcoin_pair = await factory.methods.getPair(i_Share.address, wcoin._address).call()
        console.log(`\t+ [${shareSymbol}${wcoinSymbol}]@${share_wcoin_pair}`)
        



        //=======ORACLES=======//
        console.log(`\n${dollarSymbol}/${collateralSymbol} oracle's creating:`)

        i_dollar_collateral_pairOracle = await _deployer.deploy(PairOracle, dollar_collateral_pair)
        console.log(`\t+ [${dollarSymbol}/${collateralSymbol}_pairOracle]@${i_dollar_collateral_pairOracle.address}`)    
        i_dollar_customTokenOracle = await _deployer.deploy(CustomTokenOracle,
            i_Dollar.address, 
            i_dollar_collateral_pairOracle.address, 
            env.collateral.chainlinkAggregator
        )
        console.log(`\t+ [${dollarSymbol}_customTokenOracle]@${i_dollar_customTokenOracle.address}`)        

        i_share_wcoin_pairOracle = await _deployer.deploy(PairOracle, share_wcoin_pair)
        console.log(`\t+ [${shareSymbol}/${wcoinSymbol}_pairOracle]@${i_share_wcoin_pairOracle.address}`)    
        i_share_customTokenOracle = await _deployer.deploy(CustomTokenOracle,
            i_Share.address, 
            i_share_wcoin_pairOracle.address, 
            env.wrappedCoin.chainlinkAggregator
        )
        console.log(`\t+ [${shareSymbol}_customTokenOracle]@${i_share_customTokenOracle.address}`)

        i_govToken_wcoin_pairOracle = await _deployer.deploy(PairOracle, gov_token_wcoin_pair_address)
        console.log(`\t+ [${govTokenSymbol}/${wcoinSymbol}_pairOracle]@${govToken_wcoin_pair.address}`)    
        i_govToken_customTokenOracle = await _deployer.deploy(CustomTokenOracle,
            govTokenAddress, 
            gov_token_wcoin_pair_address, 
            env.wrappedCoin.chainlinkAggregator
        )
        console.log(`\t+ [${govTokenSymbol}_customTokenOracle]@${i_dollar_customTokenOracle.address}`)    
    }

    console.log(`\ncreate chainlink oracles:`)
    const i_Collateral_ChainLinkOracle = await _deployer.deploy(ChainLinkOracle, env.collateral.chainlinkAggregator, env.oraclePricePrescion)
    console.log(`\t+ [collateral_ChainLinkOracle]@${i_Collateral_ChainLinkOracle.address}`)
    const i_Wcoin_ChainLinkOracle = await _deployer.deploy(ChainLinkOracle, env.wrappedCoin.chainlinkAggregator, env.oraclePricePrescion)
    console.log(`\t+ [wcoin_ChainLinkOracle]@${i_Wcoin_ChainLinkOracle.address}`)

    const i_Foundry = await _deployer.deploy(Foundry,
        env.collateral.address, 
        i_Share.address, 
        i_Treasury.address
    )
    
    const i_Pool = await _deployer.deploy(Pool, 
        i_Dollar.address,
        i_Share.address,
        env.collateral.address,
        govTokenAddress,
        i_Treasury.address,
        new Big(env.poolCelling).toString()
    )
       
    console.log(`\ninstalling other parameters:`) 
    await i_Foundry.setOracle(i_Collateral_ChainLinkOracle.address);        console.log(`\t+ Foundry.setOracle`) 
    await i_Pool.setOracle(i_Collateral_ChainLinkOracle.address);           console.log(`\t+ Pool.setOracle`)
    await i_Treasury.addPool(i_Pool.address);                               console.log(`\t+ Treasury.addPool`)
    await i_Treasury.setOracleDollar(i_dollar_customTokenOracle.address);   console.log(`\t+ Treasury.setOracleDollar`)
    await i_Treasury.setOracleShare(i_share_customTokenOracle.address);     console.log(`\t+ Treasury.setOracleShare`)
    await i_Treasury.setOracleGovToken(i_share_customTokenOracle.address);  console.log(`\t+ Treasury.setOracleGovToken`)
    await i_Treasury.setRebalancePool(i_Pool.address);                      console.log(`\t+ Treasury.setRebalancePool`)
    await i_Treasury.toggleCollateralRatio();                               console.log(`\t+ Treasury.toggleCollateralRatio`)
    // await i_Treasury.refreshCollateralRatio();                              console.log(`\t+ Treasury.refreshCollateralRatio`)
    await i_Treasury.setFoundry(i_Foundry.address);                         console.log(`\t+ Treasury.setFoundry`)
    await i_Treasury.installTokens(
        env.exchange.router,
        govTokenAddress,
        env.wrappedCoin.address,
        env.collateral.address,
        i_Share.address,
        i_Dollar.address
    );                                                                      console.log(`\t+ Treasury.installTokens`)


    writeAddress_raw(i_Treasury.address,                        'treasury', storage)
    writeAddress_raw(i_Dollar.address,                          'dollar', storage)
    writeAddress_raw(i_Share.address,                           'share', storage)
    writeAddress_raw(i_Foundry.address,                         'foundry', storage)
    writeAddress_raw(i_Pool.address,                            'pool', storage)
    writeAddress_raw(dollar_collateral_pair,                    'dollar_collateral_pair', storage)
    writeAddress_raw(share_wcoin_pair,                          'share_wcoin_pair', storage)
    writeAddress_raw(i_dollar_collateral_pairOracle.address,    'dollar_collateral_pairOracle', storage)
    writeAddress_raw(i_dollar_customTokenOracle.address,        'dollar_customTokenOracle', storage)
    writeAddress_raw(i_share_wcoin_pairOracle.address,          'share_wcoin_pairOracle', storage)
    writeAddress_raw(i_share_customTokenOracle.address,         'share_customTokenOracle', storage)
    writeAddress_raw(i_Collateral_ChainLinkOracle.address,      'сollateral_ChainLinkOracle', storage)
    writeAddress_raw(i_Wcoin_ChainLinkOracle.address,           'wcoin_ChainLinkOracle', storage)

    console.log('You magnificent 💕!')
}

const sleep = ms => {
    console.log(`await for ${(ms/1e3).toFixed(0)}sec`)
    new Promise(resolve => setTimeout(resolve, ms))
}

