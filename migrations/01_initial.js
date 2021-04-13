const MockChainlinkAggregator = artifacts.require('MockChainlinkAggregator.sol')

module.exports = async (deployer, network, accounts) => {
    const mock_chainLink_priceFeed_USDT_USD_instance = await deployer.deploy(MockChainlinkAggregator, '100498532', 8)//usdt cost 1.0049$
    const mock_chainLink_priceFeed_WETH_USD_instance = await deployer.deploy(MockChainlinkAggregator, '200500000000', 8)//weth cost 2005$

    console.log(`truffle run verify ${Object.keys({MockChainlinkAggregator})[0]}@${mock_chainLink_priceFeed_USDT_USD_instance.address} --network rinkeby`)
    console.log(`truffle run verify ${Object.keys({MockChainlinkAggregator})[0]}@${mock_chainLink_priceFeed_WETH_USD_instance.address} --network rinkeby`)
}