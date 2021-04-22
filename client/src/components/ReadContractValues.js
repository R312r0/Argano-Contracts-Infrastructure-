import React, {useState, useEffect} from "react"


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
            
    }, [props.drizzleState])

    const handleClick = e => {
        const params = Object.keys(props.callMethods[props.method]).map(field => inputValues[field])
        console.log(`call ${props.method} on ${props.contract} with ${params}`)
        
        setDataKey(props.drizzle.contracts[props.contract].methods[props.method].cacheCall(...params))
    }

    return Object.keys(props.callMethods[props.method]).length 
    ?
        <div className='inputRow'>                    
            <button 
                style={{
                    color: 'white',
                    textAlign:'left',
                    backgroundColor:'blue'
                }}
                onClick={handleClick} 
            >
                {props.method}
            </button>

            <div className='inputs'>
                {Object.keys(props.callMethods[props.method]).map(inputField => 
                    <input 
                        placeholder={inputField}
                        name={inputField}
                        onChange={handleInputChange}
                    />
                )}
            </div>

            <button
                style={{
                    color: 'black',
                    textAlign:'right',
                    backgroundColor:'white'
                }}
                onClick={(e) => {navigator.clipboard.writeText(e.target.innerText)}}
            >
                {'' + props.drizzleState.contracts[props.contract][props.method][dataKey]?.value}
            </button>
        </div>
    :
        <div className='inputRowGrey'>
            <button 
                style={{
                    color: 'black',
                    textAlign:'left',
                    backgroundColor:'lightgrey'
                }}
            >
                {props.method}
            </button>

            <button
                 style={{
                    color: 'black',
                    textAlign:'right',
                    backgroundColor:'white'
                }}
                onClick={(e) => {navigator.clipboard.writeText(e.target.innerText)}}
            >
                {'' + props.drizzleState.contracts[props.contract][props.method][dataKey]?.value}
            </button>
        </div>
    
}

export default ReadContractValues