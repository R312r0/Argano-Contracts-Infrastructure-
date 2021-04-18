import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import {Drizzle} from "@drizzle/store"


// let drizzle know what contracts we want and how to access our test blockchain
const options = {
  contracts: [
    require("./contracts/Pool.json"),
    require("./contracts/Treasury.json"),
    require("./contracts/Share.json"),
    require("./contracts/Dollar.json"),
    require("./contracts/MockPairOracle.json"),
    require("./contracts/MockCollateral.json"),
    // contract='MockCollateral' 

  ],
  web3: {
    fallback: {
      type: "ws",
      url: "ws://127.0.0.1:7545",
    },
  },
}

const drizzle = new Drizzle(options)

ReactDOM.render(
  <React.StrictMode>
    <App drizzle={drizzle}/>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
