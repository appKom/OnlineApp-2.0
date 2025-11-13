import React from "react";
import { View, Text, Image, Pressable, StyleSheet, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTheme, ThemeMode } from "../utils/theme";
import { useRouter } from "expo-router";

export const HEADER_HEIGHT = 64;

type HeaderProps = {
  title?: string;
  /** Logo image height in pixels (default: 36) */
  logoHeight?: number;
  /** Logo image width in pixels (default: 140) */
  logoWidth?: number;
};

export default function Header({
  title,
  logoHeight = 36,
  logoWidth = 140,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = (useColorScheme() as ThemeMode) || "light";
  const theme = getTheme(colorScheme);

  const logoBgColor = theme.surface;
  const titleBgColor = theme.surface;
  const titleColor = theme.onSurface;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: logoBgColor }]}>
      <View style={[styles.logoSection, ] }>
        <Image source={require("../assets/Online_Logokit/png/Online_hvit.png")} style={{ width: logoWidth, height: logoHeight, resizeMode: "contain" }} />
      </View>

      {title ? (
        <View style={[styles.titleSection, { backgroundColor: titleBgColor }] }>
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  logoSection: {
    width: "100%",
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingBottom: 12,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
  },
});
