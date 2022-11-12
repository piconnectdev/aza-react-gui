import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CryptoExchangeQuoteScreenComponent } from '../../components/scenes/CryptoExchangeQuoteScene'
import { getTheme } from '../../components/services/ThemeContext'
import { GuiSwapInfo } from '../../types/types'

describe('CryptoExchangeQuoteScreenComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeAccount: any = {
      swapConfig: {
        ChangeNow: {
          swapInfo: {
            pluginId: 'ChangeNow',
            displayName: 'ChangeNow',
            orderUri: 'ChangeNow.ChangeNow',
            supportEmail: 'ChangeNow@ChangeNow'
          }
        }
      }
    }

    const swapInfo: GuiSwapInfo = {
      quote: {
        isEstimate: true,
        fromNativeAmount: '10000',
        toNativeAmount: '10000',
        networkFee: {
          currencyCode: 'BTC',
          nativeAmount: '1'
        },
        pluginId: 'ChangeNow',
        approve: async () => ({
          orderId: 'demo',
          transaction: {
            txid: 'txid2',
            date: 1524486980,
            currencyCode: 'BTC',
            blockHeight: 500000,
            nativeAmount: '-321000000',
            networkFee: '2000',
            ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
            signedTx: 'fiuwh34f98h3tiuheirgserg',
            parentNetworkFee: '20001',
            metadata: {
              name: 'Crazy Person 2',
              category: 'Expense: Less Money',
              notes: 'Hell yeah! Here\'s a fish"',
              amountFiat: 36001.45
            },
            deviceDescription: 'iphone12'
          }
        }),
        close: async () => undefined
      },
      request: {
        fromWallet: {
          fiatCurrencyCode: 'USD'
        },
        toWallet: {
          fiatCurrencyCode: 'USD'
        }
      } as any,
      fee: '1',
      fromDisplayAmount: '1',
      fromFiat: '1',
      fromTotalFiat: '1',
      toDisplayAmount: '1',
      toFiat: '1'
    }

    const actual = renderer.render(
      <CryptoExchangeQuoteScreenComponent
        route={{
          name: 'exchangeQuote',
          params: { swapInfo, onApprove: () => undefined }
        }}
        account={fakeAccount}
        fromDenomination="BTC"
        fromWalletCurrencyName={{ fromDenomination: '' } as any}
        pending
        toDenomination="ETH"
        toWalletCurrencyName={{ fromDenomination: '' } as any}
        shift={(swapInfo, onApprove) => undefined}
        timeExpired={(swapInfo, onApprove) => undefined}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
