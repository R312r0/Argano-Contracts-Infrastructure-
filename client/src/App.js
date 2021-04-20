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
		<><span>Active account:  <b>{drizzleReadinessState.drizzleState.accounts[0]}</b></span>
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
					'allowance': {
						'owner': drizzleReadinessState.drizzleState.accounts[0],
						'spender': drizzleReadinessState.drizzleState.accounts[0]
					}
				}}
				sendMethods={{
					'claimDevFundRewards': {},
					'approve':{
						'spender': drizzleReadinessState.drizzleState.accounts[0],
						'amount': 0
					}
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
					'approve':{
						'spender': drizzleReadinessState.drizzleState.accounts[0],
						'amount': 0
					}
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
					'approve':{
						'spender': drizzleReadinessState.drizzleState.accounts[0],
						'amount': 0
					}
				}}
			/> 

			< Contract 
				drizzle={drizzle}
				drizzleState={drizzleReadinessState.drizzleState}
				contract='Pool' 
				callMethods={{
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
					'transferCollateralToTreasury':{
						'amount': 0
					},
					'collectRedemption':{}
				}}
			/> 

			< Contract 
				drizzle={drizzle}
				drizzleState={drizzleReadinessState.drizzleState}
				contract='Treasury' 
				callMethods={{
					'last_refresh_cr_timestamp': {},
					'target_collateral_ratio': {},
					'effective_collateral_ratio': {},
					'globalCollateralValue': {},
					'calcEffectiveCollateralRatio': {},
					'ratio_step': {},
					'price_target': {},
					'price_band': {},
					'dollarPrice': {},
					'sharePrice': {},
				}}
				sendMethods={{
					'refreshCollateralRatio':{}
				}}
			/> 
		</div>
	</>				
  )
}

export default App
