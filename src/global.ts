import { EventEmitter } from 'events'
import type {
  MonetizationState,
  MonetizationPendingEvent,
  MonetizationStartEvent,
  MonetizationProgressEvent
} from 'types-wm'

declare module 'types-wm' {
  interface MonetizationProgressEventDetail {
    receipt?: string
  }
}

export interface FullMonetizationState {
  state: MonetizationState | null
  paymentPointer: string | null
  assetCode: string | null
  assetScale: number | null
  requestId: string | null
  totalAmount: number
  receipt: string | null
  hasPaid: boolean
}

// TODO: is there a more elegant pattern for this?
export class GlobalWebMonetizationState extends EventEmitter {
  state: FullMonetizationState['state'] =
    typeof document === 'undefined'
      ? null
      : document.monetization?.state ?? null
  paymentPointer: FullMonetizationState['paymentPointer'] = null
  assetCode: FullMonetizationState['assetCode'] = null
  assetScale: FullMonetizationState['assetScale'] = null
  requestId: FullMonetizationState['requestId'] = null
  totalAmount: FullMonetizationState['totalAmount'] = 0
  receipt: FullMonetizationState['receipt'] = null

  initialized = false

  constructor() {
    super()

    this.initialized = false

    this.onMonetizationStart = this.onMonetizationStart.bind(this)
    this.onMonetizationProgress = this.onMonetizationProgress.bind(this)
    this.onMonetizationPending = this.onMonetizationPending.bind(this)
    this.onMonetizationStop = this.onMonetizationStop.bind(this)
  }

  resetState(): void {
    this.paymentPointer = null
    this.requestId = null
    this.assetCode = null
    this.assetScale = null
    this.totalAmount = 0
    this.receipt = null
  }

  getState(): FullMonetizationState {
    return {
      state: this.state,
      paymentPointer: this.paymentPointer,
      requestId: this.requestId,
      assetCode: this.assetCode,
      assetScale: this.assetScale,
      totalAmount: this.totalAmount,
      receipt: this.receipt,
      // synthetic state
      hasPaid: this.totalAmount !== 0 || this.state === 'started'
    }
  }

  init(): void {
    if (
      this.initialized &&
      typeof document !== 'undefined' &&
      document.monetization
    ) {
      this.initialized = true
      document.monetization.addEventListener(
        'monetizationstart',
        this.onMonetizationStart
      )
      document.monetization.addEventListener(
        'monetizationprogress',
        this.onMonetizationProgress
      )
      document.monetization.addEventListener(
        'monetizationpending',
        this.onMonetizationPending
      )
      document.monetization.addEventListener(
        'monetizationstop',
        this.onMonetizationStop
      )
    }
  }

  terminate(): void {
    if (this.initialized && document?.monetization) {
      this.initialized = false
      document.monetization.removeEventListener(
        'monetizationstart',
        this.onMonetizationStart
      )
      document.monetization.removeEventListener(
        'monetizationprogress',
        this.onMonetizationProgress
      )
      document.monetization.removeEventListener(
        'monetizationpending',
        this.onMonetizationPending
      )
      document.monetization.removeEventListener(
        'monetizationstop',
        this.onMonetizationStop
      )
    }
  }

  onMonetizationStop(): void {
    const metaTag = document.head.querySelector<HTMLMetaElement>(
      'meta[name="monetization"]'
    )
    if (!metaTag || metaTag.content !== this.paymentPointer) {
      this.resetState()
    }

    this.setStateFromDocumentMonetization()
    this.emit('monetizationstop')
  }

  setStateFromDocumentMonetization(): void {
    this.state =
      typeof document === 'undefined'
        ? null
        : document.monetization?.state ?? null
  }

  onMonetizationPending(ev: MonetizationPendingEvent): void {
    const { paymentPointer, requestId } = ev.detail

    if (this.requestId !== requestId) {
      this.resetState()
    }

    this.setStateFromDocumentMonetization()
    this.paymentPointer = paymentPointer
    this.requestId = requestId
    this.emit('monetizationstart')
  }

  onMonetizationStart(ev: MonetizationStartEvent): void {
    const { paymentPointer, requestId } = ev.detail

    this.setStateFromDocumentMonetization()
    this.paymentPointer = paymentPointer
    this.requestId = requestId
    this.emit('monetizationstart')
  }

  onMonetizationProgress(ev: MonetizationProgressEvent): void {
    const { amount, assetCode, assetScale, receipt } = ev.detail

    this.totalAmount = this.totalAmount + Number(amount)
    this.assetCode = assetCode
    this.assetScale = assetScale
    this.receipt = receipt ?? null
    this.emit('monetizationprogress')
  }
}

let globalWebMonetizationState: GlobalWebMonetizationState | undefined

export function getGlobalWebMonetizationState(): GlobalWebMonetizationState {
  if (!globalWebMonetizationState) {
    globalWebMonetizationState = new GlobalWebMonetizationState()
  }
  return globalWebMonetizationState
}

export function initGlobalWebMonetizationState(): void {
  getGlobalWebMonetizationState().init()
}
