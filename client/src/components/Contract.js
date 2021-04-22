import React from "react"
import ReadContractValues from './ReadContractValues'
import WriteContractValues from './WriteContractValues'

const Contract = props => 
    <div className={'card'}>
        <button onClick={(e) => {navigator.clipboard.writeText(e.target.innerText)}}>
            {props.contract}
        </button>
        <button onClick={(e) => {navigator.clipboard.writeText(e.target.innerText)}}>
            {props.drizzle.contracts[props.contract].address}
        </button>
        <ReadContractValues {...props}/>
        <WriteContractValues {...props}/>
    </div>

export default Contract