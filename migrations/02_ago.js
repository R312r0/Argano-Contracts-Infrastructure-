const save      = require('../logToFile.js').writeAddress_raw
const ARGANO    = artifacts.require('ARGANO.sol')
const MockCollateral    = artifacts.require('MockCollateral.sol')

module.exports = async (_deployer, _network, _accounts) => {
    await _deployer.deploy(ARGANO).then(i => save(i.address, 'ARGANO'))

    if (_network === 'mumbai') {
        await sleep(20000)
        await _deployer.deploy(MockCollateral, 'mockUSDT', 'USDT', 6).then(i => save(i.address, 'USDT'))
        await sleep(20000)
        await _deployer.deploy(MockCollateral, 'mockWMATIC', 'WMATIC', 18).then(i => save(i.address, 'WMATIC'))
        await sleep(20000)
    }

    // console.log(e.r.r.o.r)
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))