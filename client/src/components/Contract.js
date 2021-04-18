import React from "react"
import {Card, Heading} from "rebass"
import ReadContractValues from './ReadContractValues'
import WriteContractValues from './WriteContractValues'

const Contract = props => 
    <Card
        sx={{
            paddingTop: '10px',
            border: 'solid',
            maxWidth: '982px',
            mx: 2, my: 2,px: 2,py: 2,
        }}
    >
        <Heading textAlign='center'>{props.contract}</Heading>
        <ReadContractValues {...props}/>
        <WriteContractValues {...props}/>
    </Card>

export default Contract