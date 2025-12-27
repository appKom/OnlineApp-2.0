import React, { useState, useCallback, useRef } from "react"
import {
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from "react-native"

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface CollapsibleProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

interface CollapsibleContextType {
  isOpen: boolean
  toggleOpen: () => void
  rotationAnim: Animated.Value
  contentAnim: Animated.Value
}

const CollapsibleContext = React.createContext<CollapsibleContextType | undefined>(
  undefined
)

export const useCollapsible = () => {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error("useCollapsible must be used within a Collapsible component")
  }
  return context
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const rotationAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current
  const contentAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current

  const toggleOpen = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)

    setIsOpen(prev => {
      const next = !prev

      Animated.parallel([
        Animated.spring(rotationAnim, {
          toValue: next ? 1 : 0,
          friction: 6,
          tension: 40,
          useNativeDriver: false,
        }),
        Animated.timing(contentAnim, {
          toValue: next ? 1 : 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start()

      return next
    })
  }, [])

  return (
    <CollapsibleContext.Provider
      value={{ isOpen, toggleOpen, rotationAnim, contentAnim }}
    >
      <View>{children}</View>
    </CollapsibleContext.Provider>
  )
}

interface CollapsibleTriggerProps {
  children:
    | ((
        isOpen: boolean,
        rotation: Animated.AnimatedInterpolation<string | number>
      ) => React.ReactElement)
    | React.ReactNode
}

export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({
  children,
}) => {
  const { toggleOpen, isOpen, rotationAnim } = useCollapsible()

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-90deg", "0deg"],
  })

  return (
    <TouchableOpacity onPress={toggleOpen} activeOpacity={0.6}>
      {typeof children === "function"
        ? children(isOpen, rotation)
        : children}
    </TouchableOpacity>
  )
}

interface CollapsibleContentProps {
  children: React.ReactNode
}

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
  children,
}) => {
  const { contentAnim } = useCollapsible()
  const measuredHeight = useRef(0)

  const height = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, measuredHeight.current || 1],
  })

  const opacity = contentAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0, 1],
  })

  return (
    <Animated.View
      style={{
        height,
        opacity,
        overflow: "hidden",
      }}
    >
      <View
        onLayout={e => {
          if (!measuredHeight.current) {
            measuredHeight.current = e.nativeEvent.layout.height
          }
        }}
      >
        {children}
      </View>
    </Animated.View>
  )
}

export default Collapsible
