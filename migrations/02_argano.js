const save = require('../logToFile.js').writeAddress_raw
const ARGANO = artifacts.require('ARGANO.sol')
const env = require('./projectSettings.json')
const storage = './deployedAGOUSD.json'
const Big = require('big.js')
Big.PE = 100

module.exports = async (_deployer, _network, _accounts) => {
    const I_GovToken = await _deployer.deploy(
        ARGANO, 
        env.govToken.name, 
        env.govToken.symbol, 
        new Big(env.govToken.initialSupply).toString()
    ).then( i => save(i.address, 'govToken'))
        
    
}