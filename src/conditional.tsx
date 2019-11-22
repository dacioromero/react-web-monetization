import React, { useState, useEffect, FC } from 'react'

import { useMonetizationState } from './state'

interface IfWebMonetizedProps {
  showOnPending?: boolean
}

export const IfWebMonetized: FC<IfWebMonetizedProps> = ({
  children,
  showOnPending
}) => {
  const { state } = useMonetizationState()

  if (state === 'started' || (state === 'pending' && showOnPending)) {
    return <>{children}</>
  } else {
    return <></>
  }
}

interface IfNotWebMonetizedProps {
  pendingTimeout?: number
}

export const IfNotWebMonetized: FC<IfNotWebMonetizedProps> = ({
  children,
  pendingTimeout = 2000
}) => {
  const [pendingTimedOut, setPendingTimedOut] = useState(false)
  const { state } = useMonetizationState()

  useEffect(() => {
    const timer = setTimeout(() => {
      setPendingTimedOut(true)
    }, pendingTimeout)

    return (): void => {
      clearTimeout(timer)
    }
  })

  if (state === 'started' || (state === 'pending' && !pendingTimedOut)) {
    return <></>
  } else {
    return <>{children}</>
  }
}

export const IfWebMonetizationPending: FC = ({ children }) => {
  const { state } = useMonetizationState()

  if (state === 'pending') {
    return <>{children}</>
  } else {
    return <></>
  }
}
