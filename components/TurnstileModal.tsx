import React, { useRef } from "react"
import { View, StyleSheet } from "react-native"
import ReactNativeTurnstile from "react-native-turnstile"
import { useTheme } from "../utils/theme"

interface TurnstileBoxProps {
  visible: boolean
  onToken: (token: string) => void
  siteKey: string
}

export const TurnstileBox: React.FC<TurnstileBoxProps> = ({
  visible,
  onToken,
  siteKey,
}) => {
  const theme = useTheme()
  const turnstileResetRef = useRef<(() => void) | undefined>(undefined) as any

  const handleVerify = (token: string) => {
    onToken(token)
  }

  const handleError = (error: any) => {
    console.error("Turnstile error:", error)
  }

  if (!visible) return null

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
      <ReactNativeTurnstile
        sitekey={siteKey}
        onVerify={handleVerify}
        onError={handleError}
        resetRef={turnstileResetRef}
        theme="auto"
        size="normal"
        style={styles.turnstile}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  turnstile: {
    width: "100%",
    height: 100,
  },
})

export default TurnstileBox
