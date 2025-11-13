import React, { useEffect, useState, useRef } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  AccessibilityState,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

// A button can be simple text or a React element (icon, custom label)
type ButtonItem = string | React.ReactElement;

// Public props for the component
type Props = {
  buttons: ButtonItem[];
  selectedIndex: number;
  onPress: (index: number) => void;
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: any;
  selectedTextStyle?: any;
  highlightInset?: number;
  highlightStyle?: StyleProp<ViewStyle>;
  springConfig?: { damping?: number; stiffness?: number; mass?: number };
};

/**
 * AnimatedButtonGroup
 * - A simple segmented control / button group with an animated "pill"
 *   highlight that slides between items using react-native-reanimated.
 * - The component is controlled via `selectedIndex` and reports taps
 *   through `onPress(index)`.
 * - It measures its own width on layout, computes per-segment width and
 *   sizes the pill accordingly (accounts for `highlightInset`).
 */
const AnimatedButtonGroup: React.FC<Props> = ({
  buttons,
  selectedIndex,
  onPress,
  containerStyle,
  buttonStyle,
  textStyle,
  selectedTextStyle,
  highlightInset = 6,
  highlightStyle,
  springConfig = { damping: 14, stiffness: 160, mass: 1 },
}) => {

  // measured container size (used to calculate each segment width)
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Reanimated shared value that represents the pill's translateX in px.
  // Driving animations via shared values keeps them on the native/UI thread.
  const translateX = useSharedValue(0);

  // Stores the measured width/height of the control once it's laid out.
  // We use this to compute the width of each segment (segW).
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  // prevIndex stores the last-known selected index and is used as the
  // "from" position when animating the pill to the new selected index.
  // We initialize it to the incoming selectedIndex so it always contains
  // a number (avoids null/undefined checks) and will be updated after each
  // animation completes.
  const prevIndex = useRef<number>(selectedIndex);

  // Whenever the authoritative `selectedIndex` prop changes we animate the
  // pill from the previous index position to the new one. The flow:
  // 1. compute segment width (segW) from measured container width
  // 2. compute fromX = segW * prevIndex.current and targetX = segW * selectedIndex
  // 3. set translateX synchronously to fromX (avoids a visual jump)
  // 4. start a spring animation to targetX
  // 5. store selectedIndex into prevIndex for the next animation
  useEffect(() => {
    if (!size.width || !buttons.length) return;

    const segW = size.width / buttons.length;
    const fromX = segW * prevIndex.current;
    const targetX = segW * selectedIndex;

    // Set the starting position immediately (helps avoid a flash/jump).
    translateX.value = fromX;

    // Animate to the new selected position using a spring (native-driven).
    translateX.value = withSpring(targetX, {
      damping: springConfig.damping ?? 14,
      stiffness: springConfig.stiffness ?? 160,
      mass: springConfig.mass ?? 1,
    });

    // Remember the selected index for the next change.
    prevIndex.current = selectedIndex;
  }, [selectedIndex, size.width, buttons.length]);

  // Animated style for the sliding pill. This runs on the UI thread and
  // reads the shared translateX value. We also compute pill width/height
  // from the measured container so the pill visually matches the segment.
  const animatedStyle = useAnimatedStyle(() => {
    if (!size.width || !buttons.length) return {};

    const segW = size.width / buttons.length;
    const pillW = Math.max(0, segW - highlightInset * 2);
    const pillH = Math.max(0, size.height - highlightInset * 2);

    return {
      transform: [{ translateX: translateX.value }],
      width: pillW,
      height: pillH,
      borderRadius: 9,
    };
  });

  // Renders one segment as a Pressable. Accessibility:
  // - role="tab" and accessibilityState.selected are set so screen readers
  //   understand this is a tab-like control.
  // Behavior:
  // - We capture the current selectedIndex into prevIndex just before calling
  //   `onPress` so the animation code has a stable "from" value to animate
  //   from if desired.
  const renderButton = (b: ButtonItem, idx: number) => {
    const isSelected = idx === selectedIndex;
    const a11yState: AccessibilityState = { selected: isSelected };

    return (
      <Pressable
        key={idx}
        onPress={() => {
          // capture the selection right before the change; parent will
          // receive the onPress and typically update selectedIndex.
          prevIndex.current = selectedIndex;
          onPress(idx);
        }}
        style={[styles.button, buttonStyle]}
        accessibilityRole="tab"
        accessibilityState={a11yState}
        accessibilityLabel={typeof b === 'string' ? b : undefined}
      >
        {typeof b === 'string' ? (
          <Text
            style={[
              styles.text,
              textStyle,
              isSelected ? selectedTextStyle : null,
            ]}
          >
            {b}
          </Text>
        ) : (
          b
        )}
      </Pressable>
    );
  };

  const hasLayout = size.width > 0 && size.height > 0;

  // Main render: measure the container, draw the animated pill under the
  // buttons (absolute positioned), then render the row of Pressables on top.
  return (
    <View
      onLayout={onLayout}
      style={[styles.container, containerStyle]}
      accessibilityRole="tablist"
    >
      {/* pill highlight UNDER the buttons */}
      {hasLayout && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.highlightBase,
            { left: highlightInset, top: highlightInset },
            animatedStyle,
            highlightStyle,
          ]}
        />
      )}

      <View style={styles.row}>
        {buttons.map((b, i) => renderButton(b, i))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    color: '#000',
  },
  highlightBase: {
    position: 'absolute',
    backgroundColor: '#eee', // overridden if you pass highlightStyle
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default AnimatedButtonGroup;
