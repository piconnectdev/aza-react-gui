import { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import { watchSecurityAlerts } from 'edge-login-ui-rn'
import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'

import { updateExchangeRates } from '../../actions/ExchangeRateActions'
import { checkFioObtData } from '../../actions/FioActions'
import { logoutRequest } from '../../actions/LoginActions'
import { showReceiveDropdown } from '../../actions/ReceiveDropdown'
import { checkPasswordRecovery } from '../../actions/RecoveryReminderActions'
import { newTransactionsRequest, refreshTransactionsRequest } from '../../actions/TransactionListActions'
import { updateWalletLoadingProgress, updateWalletsRequest } from '../../actions/WalletActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useWalletsSubscriber } from '../../hooks/useWalletsSubscriber'
import { useDispatch } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { snooze } from '../../util/utils'
import { BackupModal, BackupModalResult } from '../modals/BackupInfoModal'
import { asWcSmartContractModalProps, WcSmartContractModal } from '../modals/WcSmartContractModal'
import { Airship } from './AirshipInstance'

interface Props {
  account: EdgeAccount
  navigation: NavigationBase
}

// Tracks items that need a refresh:
interface DirtyList {
  rates: boolean
  walletList: boolean
}

const notDirty: DirtyList = {
  rates: false,
  walletList: false
}

export function AccountCallbackManager(props: Props) {
  const { account, navigation } = props
  const dispatch = useDispatch()
  const [dirty, setDirty] = React.useState<DirtyList>(notDirty)

  // Helper for marking wallets dirty:
  function setRatesDirty() {
    setDirty(dirty => ({
      ...dirty,
      rates: true
    }))
  }

  // Subscribe to the account:
  React.useEffect(() => {
    const cleanups = [
      account.watch('currencyWallets', () =>
        setDirty(dirty => ({
          ...dirty,
          walletList: true
        }))
      ),

      account.watch('loggedIn', () => {
        if (!account.loggedIn) {
          Airship.clear()
          console.log('onLoggedOut')
        }
      }),

      watchSecurityAlerts(account, hasAlerts => {
        if (hasAlerts) {
          navigation.navigate('securityAlerts', {})
        }
      }),

      account.rateCache.on('update', () =>
        setDirty(dirty => ({
          ...dirty,
          rates: true
        }))
      )
    ]

    return () => cleanups.forEach(cleanup => cleanup())
  }, [account, navigation])

  // Subscribe to each wallet that comes online:
  useWalletsSubscriber(account, wallet => {
    const cleanups = [
      wallet.watch('syncRatio', ratio => {
        dispatch(updateWalletLoadingProgress(wallet.id, ratio))
      }),

      wallet.on('newTransactions', transactions => {
        console.log(`${walletPrefix(wallet)}: onNewTransactions: ${transactions.map(tx => tx.txid).join(' ')}`)

        dispatch(refreshTransactionsRequest(wallet, transactions))
        dispatch(newTransactionsRequest(navigation, wallet, transactions))

        const receivedTxs = transactions.filter(tx => !tx.isSend)

        if (receivedTxs.length > 0) {
          // Check for incoming FIO requests:
          dispatch(checkFioObtData(wallet, receivedTxs))

          // Check if we need to alert the user to upgrade their light account
          // if (account.username == null) {
          // HACK: temp
          if (account.username != null && account.username.includes('LocalAccount')) {
            Airship.show((bridge: AirshipBridge<BackupModalResult | undefined>) => <BackupModal bridge={bridge} />).then((userSel?: BackupModalResult) => {
              if (userSel === 'upgrade') {
                // TODO: Implement upgrade flow, somehow pull existing light
                // account to change the name and password...
                dispatch(logoutRequest(navigation, account.username)).then(() => navigation.navigate('login', { loginUiInitialRoute: 'new-account' }))
              }
            })
          }
        }

        // Show the dropdown for the first transaction:
        const [firstReceive] = receivedTxs
        if (firstReceive != null) {
          dispatch(showReceiveDropdown(navigation, firstReceive))
        }

        // Check if password recovery is set up:
        const finalTxIndex = transactions.length - 1
        if (!transactions[finalTxIndex].isSend) {
          dispatch(checkPasswordRecovery(navigation))
        }
      }),

      wallet.on('transactionsChanged', transactions => {
        console.log(`${walletPrefix(wallet)}: onTransactionsChanged: ${transactions.map(tx => tx.txid).join(' ')}`)

        dispatch(refreshTransactionsRequest(wallet, transactions))
      }),

      wallet.on('wcNewContractCall', obj => {
        try {
          const clean = asWcSmartContractModalProps(obj)
          const { dApp, nativeAmount, networkFee, payload, tokenId, uri } = clean

          Airship.show(bridge => (
            <WcSmartContractModal
              bridge={bridge}
              dApp={dApp}
              nativeAmount={nativeAmount}
              networkFee={networkFee}
              payload={payload}
              tokenId={tokenId}
              uri={uri}
              wallet={wallet}
            />
          ))
        } catch (e: any) {
          console.warn('Invalid wcNewContractCall params', e)
        }
      }),

      // These ones defer their work until later:
      wallet.watch('balances', () => setRatesDirty()),
      wallet.watch('enabledTokenIds', () => setRatesDirty())
    ]

    return () => cleanups.forEach(cleanup => cleanup())
  })

  // Do the expensive work with rate limiting:
  useAsyncEffect(
    async () => {
      setDirty(notDirty)

      // Update wallets:
      if (dirty.walletList) {
        // Update all wallets (hammer mode):
        console.log('Updating wallet list')
        await dispatch(updateWalletsRequest())
        await snooze(1000)
      }

      // Update exchange rates:
      if (dirty.rates) {
        console.log('Updating exchange rates')
        await dispatch(updateExchangeRates())
        await snooze(1000)
      }
    },
    [dirty],
    'AccountCallbackManager'
  )

  return null
}

function walletPrefix(wallet: EdgeCurrencyWallet): string {
  return `${wallet.currencyInfo.currencyCode}-${wallet.id.slice(0, 2)}`
}
