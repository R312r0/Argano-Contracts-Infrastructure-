import React, {useState, useEffect} from "react"

const WriteContractValues = props => {
    const [methods, setMethods] = useState([])
    useEffect(() => props.sendMethods && setMethods(Object.keys(props.sendMethods)), [props.sendMethods, props.drizzleState])
    return <>{methods.map(method => <RenderWriteString {...props} method={method}/>)}</>  
}


const RenderWriteString = props => {
    const [inputValues, setInputValues] = useState(Object.assign({}, props.sendMethods[props.method]))

    const handleInputChange = e => {
        inputValues[e.target.name] = e.target.value || 0
        setInputValues(inputValues)
    }

    const sendMessage = async () => {
        const params = Object.keys(inputValues).map(field => inputValues[field])
        console.log(`send ${props.method} on ${props.contract} with ${params}`)

        props.drizzle.contracts[props.contract].methods[props.method](...params).send()
    }


    return <div className='inputRow'>
        <button 
            style={{
                color: 'black',
                textAlign:'left',
                backgroundColor:'rgb(255,128,126)'
            }}
            onClick={sendMessage} 
        >
            {props.method}
        </button>

        <div className='inputs'>
            {Object.keys(props.sendMethods[props.method]).map(inputField => 
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
        >

        </button>
    </div>
  
}

export default WriteContractValues