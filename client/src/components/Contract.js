import React from "react"
import {Card, Heading} from "rebass"
import ReadContractValues from './ReadContractValues'
import WriteContractValues from './WriteContractValues'

const Contract = props => 
    <Card
        sx={{
            paddingTop: '5px',
            border: '1.5px inset gray',
            boxShadow: '0 0 5px rgba(0,0,0,0.5)',
            minWidth: '500px',
            width:'30%',
            mx: 1, my: 1,px: 1,py: 1,
        }}
    >
        <Heading textAlign='center'  fontSize='12px'>{props.contract}[{props.drizzle.contracts[props.contract].address}]</Heading>
        <ReadContractValues {...props}/>
        <WriteContractValues {...props}/>
    </Card>

export default Contract