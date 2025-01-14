import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { styled } from '../hoc/styled'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  iconUri: string
  title: string
  message: string
  onPress: () => void | Promise<void>
}

const NotificationCardComponent = (props: Props) => {
  const { iconUri, title, message, onPress } = props

  return (
    <CardContainer onPress={onPress}>
      <Icon source={{ uri: iconUri }} />
      <View>
        <TitleText>{title}</TitleText>
        <MessageText numberOfLines={3}>{message}</MessageText>
      </View>
    </CardContainer>
  )
}

const CardContainer = styled(TouchableOpacity)(props => ({
  alignItems: 'center',
  backgroundColor: props.theme.modal,
  borderRadius: props.theme.rem(0.5),
  elevation: 6,
  flexDirection: 'row',
  justifyContent: 'center',
  padding: props.theme.rem(0.5),
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.7,
  shadowRadius: props.theme.rem(0.5)
}))

const Icon = styled(FastImage)(props => ({
  height: props.theme.rem(2.5),
  width: props.theme.rem(2.5)
}))

const TitleText = styled(EdgeText)(props => ({
  color: props.theme.warningIcon,
  marginLeft: props.theme.rem(0.5),
  fontSize: props.theme.rem(0.75),
  fontFamily: props.theme.fontFaceBold
}))

const MessageText = styled(EdgeText)(props => ({
  color: props.theme.warningIcon,
  marginLeft: props.theme.rem(0.5),
  fontSize: props.theme.rem(0.75)
}))

export const NotificationCard = React.memo(NotificationCardComponent)
