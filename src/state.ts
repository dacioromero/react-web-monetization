import { useState, useEffect } from 'react'

import { getGlobalWebMonetizationState, FullMonetizationState } from './global'

export type NormalMonetizationState = Pick<
  FullMonetizationState,
  'state' | 'requestId' | 'paymentPointer' | 'hasPaid'
>

export function useMonetizationState(): NormalMonetizationState {
  // get the singleton WM state
  const webMonetizationState = getGlobalWebMonetizationState()

  webMonetizationState.init()

  const { state, requestId, paymentPointer, hasPaid } =
    webMonetizationState.getState()

  const [monetizationState, setMonetizationState] =
    useState<NormalMonetizationState>({
      state,
      requestId,
      paymentPointer,
      hasPaid
    })

  useEffect(() => {
    if (!document.monetization) return

    const stateChange = (): void => {
      const {
        state,
        requestId,
        paymentPointer,
        hasPaid
      } = webMonetizationState.getState()

      setMonetizationState({
        state,
        requestId,
        paymentPointer,
        hasPaid
      })
    }

    webMonetizationState.on('monetizationpending', stateChange)
    webMonetizationState.on('monetizationstart', stateChange)
    webMonetizationState.on('monetizationstop', stateChange)

    return () => {
      webMonetizationState.removeListener('monetizationstart', stateChange)
      webMonetizationState.removeListener('monetizationpending', stateChange)
      webMonetizationState.removeListener('monetizationstop', stateChange)
    }
  })

  return monetizationState
}
