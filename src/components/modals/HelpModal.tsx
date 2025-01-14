import * as React from 'react'
import { Dimensions, Image, Keyboard, Linking, Platform, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import { WebView } from 'react-native-webview'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../assets/vector'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ModalFooter, ModalTitle } from '../themed/ModalParts'
import { SelectableRow } from '../themed/SelectableRow'
import { ThemedModal } from '../themed/ThemedModal'

const buildNumber = getBuildNumber()
const versionNumber = getVersion()
const HELP_URIS = {
  knowledgeBase: config.knowledgeBase,
  support: config.supportSite,
  call: config.phoneNumber,
  site: config.website
}

export async function showHelpModal(): Promise<void> {
  return await Airship.show(bridge => <HelpModal bridge={bridge} />)
}

export async function showWebViewModal(uri: string, title: string): Promise<void> {
  await Airship.show(bridge => <HelpWebViewModal bridge={bridge} uri={uri} title={title} />)
}

interface Props {
  bridge: AirshipBridge<void>
}

class HelpWebViewModal extends React.Component<Props & { uri: string; title: string }> {
  webview: WebView | null = null
  handleClose = () => this.props.bridge.resolve()

  render() {
    const { bridge, uri, title } = this.props
    return (
      <ThemedModal bridge={bridge} onCancel={this.handleClose} paddingRem={[1, 0]}>
        <ModalTitle center paddingRem={[0, 1, 1]}>
          {title}
        </ModalTitle>
        <WebView ref={element => (this.webview = element)} source={{ uri }} />

        <ModalFooter onPress={this.handleClose} />
      </ThemedModal>
    )
  }
}

export class HelpModalComponent extends React.Component<Props & ThemeProps> {
  handleClose = () => this.props.bridge.resolve()

  handleEdgeSitePress = async (helpSiteMoreInfoText: string) => {
    if (Platform.OS === 'android') {
      await Linking.canOpenURL(HELP_URIS.site).then(supported => {
        if (supported) {
          Linking.openURL(HELP_URIS.site).catch(err => {
            console.log(err)
          })
        } else {
          console.log("Don't know how to open URI: " + HELP_URIS.site)
        }
      })
    } else {
      await showWebViewModal(HELP_URIS.site, helpSiteMoreInfoText)
    }
  }

  componentDidMount() {
    Keyboard.dismiss()
  }

  render() {
    const { bridge, theme } = this.props
    const styles = getStyles(theme)
    const versionText = `${lstrings.help_version} ${versionNumber}`
    const buildText = `${lstrings.help_build} ${buildNumber}`
    const optionMarginRem = [0.75, 0, 0.5, 1]
    const optionPaddingRem = [0, 1, 1, 0]
    const helpModalTitle = sprintf(lstrings.help_modal_title_thanks, config.appName)
    const helpSiteMoreInfoText = sprintf(lstrings.help_site_more_info_text, config.appName)

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleClose} paddingRem={[1, 0]}>
        <View style={styles.titleContainer}>
          <Image source={theme.primaryLogo} style={styles.logo} resizeMode="contain" />
          <ModalTitle center paddingRem={[0, 1, 1]}>
            {helpModalTitle}
          </ModalTitle>
        </View>

        <SelectableRow
          arrowTappable
          icon={<Fontello name="help_idea" color={theme.iconTappable} size={theme.rem(1.5)} />}
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
          subTitle={lstrings.help_knowledge_base_text}
          title={lstrings.help_knowledge_base}
          underline
          onPress={async () => await showWebViewModal(HELP_URIS.knowledgeBase, lstrings.help_knowledge_base)}
        />

        <SelectableRow
          arrowTappable
          icon={<Fontello name="help_headset" color={theme.iconTappable} size={theme.rem(1.5)} />}
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
          subTitle={lstrings.help_support_text}
          title={lstrings.help_support}
          underline
          onPress={async () => await showWebViewModal(HELP_URIS.support, lstrings.help_support)}
        />

        <SelectableRow
          arrowTappable
          icon={<Fontello name="help_call" color={theme.iconTappable} size={theme.rem(1.5)} />}
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
          subTitle={lstrings.help_call_text}
          title={lstrings.help_call}
          underline
          onPress={async () => await Linking.openURL(`tel:${HELP_URIS.call}`)}
        />

        <SelectableRow
          arrowTappable
          icon={<Fontello name="globe" color={theme.iconTappable} size={theme.rem(1.5)} />}
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
          subTitle={helpSiteMoreInfoText}
          title={sprintf(lstrings.help_visit_site, config.appName)}
          onPress={async () => await this.handleEdgeSitePress(helpSiteMoreInfoText)}
        />
        <View style={styles.footer}>
          <EdgeText style={styles.version}>{versionText}</EdgeText>
          <EdgeText style={styles.version}>{buildText}</EdgeText>
        </View>

        <ModalFooter onPress={this.handleClose} />
      </ThemedModal>
    )
  }
}

const deviceHeight = Dimensions.get('window').height

const getStyles = cacheStyles((theme: Theme) => ({
  titleContainer: {
    marginTop: theme.rem(0.5),
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    height: theme.rem(2.25)
  },
  footer: {
    marginTop: deviceHeight < theme.rem(42) ? 0 : theme.rem(1.5),
    paddingVertical: deviceHeight < theme.rem(42) ? theme.rem(0.25) : theme.rem(0.5),
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  version: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  }
}))

const HelpModal = withTheme(HelpModalComponent)
