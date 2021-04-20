import React, {useState, useEffect} from "react"
import useDeepCompareEffect from 'use-deep-compare-effect'
import {Input} from '@rebass/forms'
import {Button} from "rebass"

const WriteContractValues = props => {
    const [methods, setMethods] = useState([])

    useEffect(()=>{
        props.sendMethods && setMethods(Object.keys(props.sendMethods))
    }, [props.sendMethods, props.drizzleState])
    
    return (
        <>
            {methods.map(method =>
                <RenderWriteString 
                    {...props}   
                    method={method}    
                /> 
            )} 
        </> 
    
    )
}


const RenderWriteString = props => {
    const [stackId, setStackID] = useState(null)
    const [inputValues, setInputValues] = useState(Object.assign({}, props.sendMethods[props.method]))

    const handleInputChange = e => {
        inputValues[e.target.name] = e.target.value || 0
        setInputValues(inputValues)
    }

    const sendMessage = async () => {
        const params = Object.keys(inputValues).map(field => inputValues[field])
        console.log(`send ${props.method} on ${props.contract} with ${params}`)
        if (!stackId)
            setStackID(props.drizzle.contracts[props.contract].methods[props.method].cacheSend(...params))
    }

    const getTxStatus = () => {
        const { transactions, transactionStack } = props.drizzleState
        const txHash = transactionStack[stackId]

        if (!txHash) return null
        console.log(transactions[txHash])
        return `Transaction status: ${transactions[txHash] && transactions[txHash].status}`
    }

    return <div className='inputRow'>
        <Button 
            color='black'
            textAlign='left'
            backgroundColor='rgb(255,128,126)'
            onClick={sendMessage} 
        >
            {props.method}
        </Button>

        <div className='inputs'>
            {Object.keys(props.sendMethods[props.method]).map(inputField => 
                <Input 
                    placeholder={inputField}
                    name={inputField}
                    onChange={handleInputChange}
                />
            )}
        </div>

        <Button
            color='black'
            textAlign='right'
            backgroundColor='white'
        >
            {''+ getTxStatus()}
        </Button>
    </div>
  
}

export default WriteContractValues