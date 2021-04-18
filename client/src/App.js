import './App.css'
import { useState, useEffect } from 'react'
import Contract from "./components/Contract"

const App = props => {
	const [drizzleReadinessState, setDrizzleReadinessState] = useState({ drizzleState: null, loading: true })
	const { drizzle } = props

	useEffect(() => {
		const unsubscribe = drizzle.store.subscribe(() => {
			const drizzleState = drizzle.store.getState()

			if(drizzleState.drizzleStatus.initialized)
				setDrizzleReadinessState({ drizzleState: drizzleState, loading: false })
		})

		return () => {unsubscribe()}
	}, [drizzle.store, drizzleReadinessState])

	return (
		drizzleReadinessState.loading ? "Loading Drizzle..." :

		<div className='main'> 
			<Contract
				drizzle={drizzle}
				drizzleState={drizzleReadinessState.drizzleState}
				contract='Share' 
				callMethods={{
					'totalSupply': {},
					'balanceOf': {
						'owner': drizzleReadinessState.drizzleState.accounts[0]
					},
				}}
				sendMethods={{
					'claimDevFundRewards': {}
				}}
			/>

			< Contract 
				drizzle={drizzle}
				drizzleState={drizzleReadinessState.drizzleState}
				contract='Dollar' 
				callMethods={{
					'totalSupply': {},
					'balanceOf': {
						'owner': drizzleReadinessState.drizzleState.accounts[0]
					},
					'allowance': {
						'owner': drizzleReadinessState.drizzleState.accounts[0],
						'spender': drizzleReadinessState.drizzleState.accounts[0]
					}
				}}
				sendMethods={{
				}}
			/>

			{/* < Contract 
				drizzle={drizzle}
				drizzleState={drizzleReadinessState.drizzleState}
				contract='MockPairOracle' 
				callMethods={{
					'mockPrice': {},
					'consult': {
						'token': drizzleReadinessState.drizzleState.accounts[0],
						'amountIn': 0
					}
				}}
				sendMethods={{
					'mock': {
						'newPrice' : 0
					}
				}}
			/>  */}

			< Contract 
				drizzle={drizzle}
				drizzleState={drizzleReadinessState.drizzleState}
				contract='MockCollateral' 
				callMethods={{
					'_symbol':{},
					'totalSupply': {},
					'balanceOf': {
						'owner': drizzleReadinessState.drizzleState.accounts[0]
					},
				}}
				sendMethods={{
					
				}}
			/> 

			< Contract 
				drizzle={drizzle}
				drizzleState={drizzleReadinessState.drizzleState}
				contract='Pool' 
				callMethods={{
					'mint_paused': {},
					'redeem_paused': {},
					'migrated': {},
					'collateralDollarBalance': {},
					'getCollateralPrice': {},
					'getCollateralToken': {},
				}}
				sendMethods={{
					'mint': {
						'_collateral_amount' : 0,
						'_share_amount' : 0,
						'_dollar_out_min' : 0,
					},
					'redeem': {
						'_dollar_amount' : 0,
						'_share_out_min' : 0,
						'_collateral_out_min' : 0,
					},
					'collectRedemption':{}
				}}
			/> 
		</div>

  )
}

export default App
