import React, { useState, useEffect } from "react"
import { View, Modal, TouchableOpacity, StyleSheet, Animated, Easing, KeyboardAvoidingView, Platform } from "react-native"
import { BlurView } from "@react-native-community/blur"

interface ModalProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode | ((closeModal: () => void) => React.ReactNode)
  modalWidth?: number | `${number}%`
  modalMaxWidth?: number
}

export const AnimatedModal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  modalWidth = "90%",
  modalMaxWidth = 400,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0.96))
  const [opacityAnim] = useState(new Animated.Value(0))

  // Quick fade with a slight scale-up: present, not bouncy.
  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.96)
      opacityAnim.setValue(0)
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, scaleAnim, opacityAnim])

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose()
    })
  }

  return (
    <Modal visible={visible} transparent onRequestClose={handleClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityAnim }]}>
        <View style={styles.backdrop}>
          <BlurView blurType="dark" blurAmount={5} style={StyleSheet.absoluteFill} />

          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />

          {/* Lifts dialogs with text fields above the keyboard. */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.centered}
            pointerEvents="box-none"
          >
            <Animated.View
              style={[
                styles.modal,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                  width: modalWidth,
                  maxWidth: modalMaxWidth,
                },
              ]}
            >
              {typeof children === "function" ? children(handleClose) : children}
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "box-none",
  },
  modal: {
    alignSelf: "center",
  },
})

export default AnimatedModal
