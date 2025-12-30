import React, { useState, useEffect } from "react"
import { View, Modal, TouchableOpacity, StyleSheet, Animated } from "react-native"
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
  const [scaleAnim] = useState(new Animated.Value(0))
  const [opacityAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    if (visible) {
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
    } else {
      scaleAnim.setValue(0)
      opacityAnim.setValue(0)
    }
  }, [visible, scaleAnim, opacityAnim])

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose()
    })
  }

  return (
    <Modal visible={visible} transparent onRequestClose={handleClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityAnim }]}>
        <BlurView blurType="dark" blurAmount={5} style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
          <View style={styles.centered}>
            <Animated.View
              style={[
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
          </View>
        </BlurView>
      </Animated.View>
    </Modal>

  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "box-none",
  },
})

export default AnimatedModal
