import React, { useState, useCallback } from "react"
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet } from "react-native"
import { BlurView } from "@react-native-community/blur"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import QRCode from "react-native-qrcode-svg"
import type { Attendee } from "../../../types/event"
import { useTheme } from "../../../utils/theme"

interface TicketButtonProps {
  attendee: Attendee,
}

export const TicketButton: React.FC<TicketButtonProps> = ({ attendee }) => {
  const theme = useTheme()
  const [modalVisible, setModalVisible] = useState(false)
  const [scaleAnim] = useState(new Animated.Value(0))
  const [opacityAnim] = useState(new Animated.Value(0))

  const openModal = useCallback(() => {
    setModalVisible(true)
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }, [scaleAnim, opacityAnim])

  const closeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false)
    })
  }, [scaleAnim, opacityAnim])

  return (
    <>
      <TouchableOpacity
        onPress={openModal}
        style={[
          styles.button,
          { backgroundColor: theme.tertiaryContainer }
        ]}
      >
        <MaterialCommunityIcons name="qrcode" size={20} color={theme.onTertiaryContainer} />
        <Text style={[styles.buttonText, { color: theme.onTertiaryContainer }]}>Vis billett</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => closeModal()}
      >
        <Animated.View 
          style={[
            StyleSheet.absoluteFill,
            { opacity: opacityAnim }
          ]}
        >
          <BlurView blurType="dark" blurAmount={5} style={StyleSheet.absoluteFill}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => closeModal()}
              style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            >
              <Animated.View
                style={{
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                }}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: theme.primaryContainer,
                    padding: 20,
                    borderRadius: 32,
                    alignItems: "center"
                  }}
                >
                  <View style={{ width: 300, height: 300, backgroundColor: "white", borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
                    <QRCode value={attendee.id} size={250} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})

export default TicketButton
