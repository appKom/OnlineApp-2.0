import React, { useState, useCallback } from "react"
import { View, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native"

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
}

const CollapsibleContext = React.createContext<CollapsibleContextType | undefined>(undefined)

export const useCollapsible = () => {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error("useCollapsible must be used within a Collapsible component")
  }
  return context
}

export const Collapsible: React.FC<CollapsibleProps> = ({ children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const toggleOpen = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setIsOpen((prev) => !prev)
  }, [])

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggleOpen }}>
      <View>{children}</View>
    </CollapsibleContext.Provider>
  )
}

interface CollapsibleTriggerProps {
  children: React.ReactNode
}

export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({ children }) => {
  const { toggleOpen } = useCollapsible()

  return (
    <TouchableOpacity onPress={toggleOpen} activeOpacity={0.6}>
      {children}
    </TouchableOpacity>
  )
}

interface CollapsibleContentProps {
  children: React.ReactNode
}

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({ children }) => {
  const { isOpen } = useCollapsible()

  if (!isOpen) {
    return null
  }

  return <View>{children}</View>
}

export default Collapsible
