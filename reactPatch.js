import { hook, wrap } from 'cavy'
import React from 'react'

require('./reactPatcher/index').Cavify(React, {
  // exclude: [
  //   'LayoutContext',
  //   'NavigationContainer',
  //   'Router',
  //   'App',
  //   'AppContainer',
  //   'LogBoxStateSubscription',
  //   'EdgeCoreManager',
  //   'ErrorBoundary',
  //   'GestureHandlerRootView',
  //   'ThemeProvider',
  //   'StatusBarManagerComponent',
  //   'MakeEdgeContext',
  //   'EdgeCoreBridge',
  //   'Services',
  //   'Provider',
  //   'LoginUiProvider',
  //   'MenuProvider',
  //   'Airship',
  //   'Main',
  //   'AutoLogout',
  //   'ContactsLoader',
  //   'DeepLinkingManager',
  //   'AccountCallbackManager',
  //   'SortedWalletList',
  //   'EdgeContextCallbackManager',
  //   'PermissionsManager',
  //   'NetworkActivity',
  //   'PasswordReminderService',
  //   'WalletLifecycle'
  // ],

  // filters: [/[(,)]/, /withTheme/, /^Connect/],

  functionalHOC: wrap,
  classHOC: hook,
  include: [
    'AddressTileComponent',
    'ModalCloseArrow',
    'MenuTabComponent',
    'ContactListModal',
    'AddressModalComponent',
    'AccelerateTxModelComponent',
    'FlipInputModalComponent',
    'ListModal',
    'PasswordReminderModalComponent',
    'TransactionAdvanceDetailsComponent',
    'TransactionDetailsCategoryInput',
    'WalletListSortModalComponent',
    'MainButton',
    'QrCode',
    'ThemedModalComponent',
    'HelpModalComponent',
    'HelpModal',
    'MainComponent',
    'WalletListFooter',
    'CryptoExchangeComponent',
    'SettingsTappableRow',
    'TextInputModal',
    'Tile',
    'HeaderTextButtonComponent',
    'HelpWebViewModal',
    'GuiPluginList',
    'CryptoExchangeScene',
    'CryptoExchangeFlipInputWrapperComponent',
    'TransactionListTopComponent',
    'RequestComponent',
    'AddressTileComponent',
    'SendComponent',
    'EditableAmountTile',
    'SettingsScene',
    'SettingsSceneComponent',
    'PrimaryButton',
    'MainButton',
    'WalletListSwipeable',
    'WalletListSwipeableRow',
    'OutlinedTextInput',
    'CountryListModal'
  ]
})
