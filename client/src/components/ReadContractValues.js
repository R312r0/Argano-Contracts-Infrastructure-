import React, {useState, useEffect} from "react"
import {Input} from '@rebass/forms'
import {Button} from "rebass"
import useDeepCompareEffect from 'use-deep-compare-effect'


const ReadContractValues = props => {
    const [methods, setMethods] = useState([])

    useEffect(()=>{
        props.callMethods && setMethods(Object.keys(props.callMethods))
    }, [props.callMethods, props.drizzleState])
    
    return (
        <>
            {methods.map(method =>
                <RenderReadString {...props} method={method}/>       
            )} 
        </> 
    )
}

const RenderReadString = props => {
    const [dataKey, setDataKey] = useState(null)
    const [inputValues, setInputValues] = useState(Object.assign({}, props.callMethods[props.method]))

    const handleInputChange = e => {
        inputValues[e.target.name] = e.target.value || 0
        setInputValues(inputValues)
    }

    useEffect(() => {
        if (!Object.keys(props.callMethods[props.method]).length) setDataKey(props.drizzle.contracts[props.contract].methods[props.method].cacheCall())
            
    }, [props.drizzleState, props.drizzle.contracts[props.contract]])

    const handleClick = e => {
        const params = Object.keys(props.callMethods[props.method]).map(field => inputValues[field])
        console.log(`call ${props.method} on ${props.contract} with ${params}`)
        
        setDataKey(props.drizzle.contracts[props.contract].methods[props.method].cacheCall(...params))
    }

    return Object.keys(props.callMethods[props.method]).length 
    ?
        <div className='inputRow'>                    
            <Button 
                color='white'
                textAlign='left'
                backgroundColor='blue'
                onClick={handleClick} 
            >
                {props.method}
            </Button>

            <div className='inputs'>
                {Object.keys(props.callMethods[props.method]).map(inputField => 
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
                {'' + props.drizzleState.contracts[props.contract][props.method][dataKey]?.value}
            </Button>
        </div>
    :
        <div className='inputRow'>
            <Button 
                color='black'
                textAlign='left'
                backgroundColor='lightgrey'
            >
                {props.method}
            </Button>

            <div className='inputs'>
                {/* <Input placeholder={undefined}/>  */}
            </div>

            <Button
                color='black'
                textAlign='right'
                backgroundColor='white'
            >
                {'' + props.drizzleState.contracts[props.contract][props.method][dataKey]?.value}
            </Button>
        </div>
    
}

export default ReadContractValues