const fs = require('fs')

const writeAddress = (_contract, _address) => {
    let prev = {}
    try {prev = require('./lastDeployedAddresses.json')}catch (e) {}
    console.log(prev)
    prev[_contract] = _address
    fs.writeFile(`lastDeployedAddresses.json`, JSON.stringify(prev, null, 4), () =>console.log(`${_contract}@${_address} stored!`))
}

writeAddress('a', 'c')

// require('dotenv').config({})
// const Web3 = require('web3')
// const BigNumber = require ('ethers').BigNumber
// const web3 = new Web3(process.env.RINKEBY_INFURA)
// const deployer = web3.eth.accounts.wallet.add({
//     privateKey: process.env.RINKEBY_PRIVATE_KEY,
//     address: process.env.RINKEBY_ADDRESS
// })

// console.log(deployer.address)
// const UniswapV2Router_instance = new web3.eth.Contract(require('./uniswapV2RouterAbi.json'), process.env.uniswapV2Router_rinkeby)
// const Mock_USDT = new web3.eth.Contract(require('./tokenABI.json'), '0xF624aB0FF3F094b4DF2082A341ECD7Aeca08caAC')
// const Mock_WETH = new web3.eth.Contract(require('./tokenABI.json'), '0x89D9b52C2D5b29DDa93B8D222C58561d81A8296F')
// const CNUSD = new web3.eth.Contract(require('./tokenABI.json'), '0x89Ec620625dfBf86e28E2618054276b49A886168')
// const AGOUSD = new web3.eth.Contract(require('./tokenABI.json'), '0xA1055a430a9b5787378B7F7eE8210A49024979e3')

// const ONE_THOUSAND = BigNumber.from('1000000000000000000000').toHexString()



// const main = async () => {
    
//     await Mock_WETH.methods.mint(deployer.address, ONE_THOUSAND).send({from: deployer.address, gas: 1, gasPrice: 1e9})
//     console.log(`${ONE_THOUSAND.toString} of Mock_WETH minted to ${deployer.address}!`)

//     await CNUSD.methods.mint(deployer.address, ONE_THOUSAND).send({from: deployer.address, gas: 1, gasPrice: 1e9})
//     console.log(`${ONE_THOUSAND.toString} of CNUSD minted to ${deployer.address}!`)

//     await UniswapV2Router_instance.methods.addLiquidity(
//         CNUSD.address,
//         Mock_WETH.address,
//         ONE_THOUSAND,
//         ONE_THOUSAND,
//         0,
//         0,
//         deployer,
//         Math.floor(new Date().getTime() / 1000 + 1000)
//     )
//     .send({from: deployer.address, gas: 1, gasPrice: 1e9})
//     .catch(console.error)
//     .then(console.log)
    

//     console.log('liquidity added!')
// }

// main()
