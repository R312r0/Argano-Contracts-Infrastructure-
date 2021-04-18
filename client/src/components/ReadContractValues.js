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




// const ReadContractValue = props => {
//     const [dataKeys, setDataKeys] = useState({})
//     const Contract = props.drizzleState.contracts[props.contract]

//     useDeepCompareEffect(() => {
//         if (!Object.keys(props.callMethods).length) return
//         const keys = {}

//         Object.keys(props.callMethods).map(method => {
//             if (!Object.keys(props.callMethods[method]).length)
//                 keys[method] = props.drizzle.contracts[props.contract].methods[method].cacheCall()
//         })

//         setDataKeys(keys)
//     }, [Contract, props.callMethods])

//     const handleClick = (e, method) => {
//         const keys = Object.assign({}, dataKeys)
//         const params = []

//         Object.keys(props.callMethods[method]).forEach(field => {
//             params.push(props.callMethods[method][field])
//         })
//         console.log(`send ${method} on ${props.contract} with ${params} `)
        
//         keys[method] = props.drizzle.contracts[props.contract].methods[method].cacheCall(...params)
        
//         setDataKeys(keys)
//     }

//     const handleInputChange = (value, method, inputField) => {
//         props.callMethods[method][inputField] = value
//         console.log(props.callMethods)
//     }

    
//     return <>
//             {Object.keys(props.callMethods)?.map( method => 
//                 Object.keys(props.callMethods[method]).length?
//                 <div className='inputRow'>                    
//                         <Button 
//                             padding='1'
//                             margin='1'
//                             color='white'
//                             textAlign='left'
//                             backgroundColor='blue'
//                             onClick={e => handleClick(e, method)} 
//                         >
//                             {method}
//                         </Button>

//                         <div className='inputs'>
//                             {Object.keys([method]).map(inputField => 
//                                 <Input 
//                                     padding='1'
//                                     margin='1'
//                                     value={props.callMethods[method][inputField]}
//                                     onChange={e => handleInputChange(e.target.value, method, inputField)}
//                                 />
//                             )}
//                         </div>

//                         <Button
//                             padding='1'
//                             margin='1'
//                             color='black'
//                             textAlign='right'
//                             backgroundColor='white'
//                         >
//                             {'' + Contract[method][dataKeys[method]]?.value}
//                         </Button>
//                     </div>
//                 :
//                     <div className='inputRow'>
//                         <Button 
//                             padding='1'
//                             margin='1'
//                             color='black'
//                             textAlign='left'
//                             backgroundColor='lightgrey'
//                             onClick={e => void(0)} 
//                         >
//                             {method}
//                         </Button>

//                         <div className='inputs'>
//                             {Object.keys(props.callMethods[method]).map(inputField => 
//                                 <Input 
//                                     padding='1'
//                                     margin='1'
//                                     placeholder={undefined}
//                                     onChange={e => void(0)}
//                                 />
//                             )}
//                         </div>

//                         <Button
//                             padding='1'
//                             margin='1'
//                             color='black'
//                             textAlign='right'
//                             backgroundColor='white'
//                         >
//                             {'' + Contract[method][dataKeys[method]]?.value}
//                         </Button>
//                     </div>
//             )}
//         </>
// }

export default ReadContractValues