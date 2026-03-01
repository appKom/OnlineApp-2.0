import React, { useRef } from "react"
import { Modal, View, StyleSheet, TouchableOpacity, Text } from "react-native"
import ReactNativeTurnstile from "react-native-turnstile"
import { useTheme } from "../utils/theme"

interface TurnstileModalProps {
  visible: boolean
  onToken: (token: string) => void
  onClose: () => void
  siteKey: string
}

export const TurnstileModal: React.FC<TurnstileModalProps> = ({
  visible,
  onToken,
  onClose,
  siteKey,
}) => {
  const theme = useTheme()
  const turnstileResetRef = useRef<(() => void) | undefined>(undefined) as any

  const handleVerify = (token: string) => {
    onToken(token)
    onClose()
  }

  const handleError = (error: any) => {
    console.error("Turnstile error:", error)
  }

  const handleExpire = () => {
    console.log("Turnstile token expired")
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.onBackground }]}>
            Verify Human
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.primary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <ReactNativeTurnstile
            sitekey={siteKey}
            onVerify={handleVerify}
            onError={handleError}
            onExpire={handleExpire}
            resetRef={turnstileResetRef}
            theme="auto"
            size="normal"
            style={styles.turnstile}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    fontWeight: "300",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  turnstile: {
    width: "100%",
    height: 100,
  },
})

export default TurnstileModal
