const save = require('../logToFile.js').writeAddress_raw
const ARGANO = artifacts.require('ARGANO.sol')
const env = require('./projectSettings.json')
const storage = './lastDeployedAddresses.json'
const Big = require('big.js')
Big.PE = 100

module.exports = async (_deployer, _network, _accounts) => {
    const owner = _accounts[0]
    const web3 = ARGANO.interfaceAdapter.web3

    let I_GovToken = undefined
    await _deployer.deploy(ARGANO, 
        env.govToken.name, 
        env.govToken.symbol,
        new Big(env.govToken.initialSupply).toString()
    ).then(i => I_GovToken = i)
    save(I_GovToken.address, 'govToken')

    const wcoin = new web3.eth.Contract(require('../abis/wcoin.json'), env.wrappedCoin.address) 
    const wcoinSymbol = await wcoin.methods.symbol().call()

    const router = new web3.eth.Contract(require('../abis/routerABI.json'), env.exchange.router)
    const factory = new web3.eth.Contract(require('../abis/factoryABI.json'), env.exchange.factory)

    await wcoin.methods.approve(env.exchange.router, new Big(env.pairs.defaultValues.gov_token_collateral_amount).toString()).send({from: owner})
    console.log(`\t+ ${wcoinSymbol} for ${new Big(env.pairs.defaultValues.gov_token_collateral_amount).toString()}`)

    await I_GovToken.approve(env.exchange.router, new Big(env.pairs.defaultValues.gov_token_amount).toString())
        console.log(`\t+ ${env.govToken.symbol} for ${new Big(env.pairs.defaultValues.gov_token_amount).toString()}`)

    console.log(`\n${env.govToken.symbol}/${wcoinSymbol} pair creating on ${env.exchange.name}:`)
    await router.methods.addLiquidity(
        I_GovToken.address, 
        wcoin._address,
        new Big(env.pairs.defaultValues.gov_token_amount).toString(),
        new Big(env.pairs.defaultValues.gov_token_collateral_amount).toString(), 
        0, 
        0, 
        owner, 
        Date.now() + 1000
    ).send({from: owner})
    gov_token_wcoin_pair = await factory.methods.getPair(I_GovToken.address, wcoin._address).call()
    console.log(`\t+ [${env.govToken.symbol}${wcoinSymbol}]@${gov_token_wcoin_pair}`)    

    save(gov_token_wcoin_pair, 'gov_token_wcoin_pair_address', storage)

        
    
}