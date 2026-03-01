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

  // Temporarily always visible for styling - comment out when done
  // if (!visible) return null

  return (
    <View style={styles.container}>
      <ReactNativeTurnstile
        sitekey={siteKey}
        onVerify={handleVerify}
        onError={handleError}
        resetRef={turnstileResetRef}
        theme="auto"
        size="normal"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
})

export default TurnstileBox
