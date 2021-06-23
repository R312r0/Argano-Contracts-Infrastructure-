const save      = require('../logToFile.js').writeAddress
const ARGANO    = artifacts.require('ARGANO.sol')

module.exports = async (_deployer, _network, _accounts) => {
    _deployer.deploy(ARGANO).then(save)
}