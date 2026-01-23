import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, getCurrentTheme } from "../utils/theme";
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
  const theme = useTheme();
  const logoBgColor = theme.surface;
  const titleBgColor = theme.surface;
  const titleColor = theme.onSurface;
  const logoSource = getCurrentTheme() === "dark" ? require("../assets/Online_Logokit/png/Online_hvit.png") : require("../assets/Online_Logokit/png/Online_bla.png");

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: logoBgColor }]}>
      {/* <View style={[styles.logoSection, ] }>
        <Image source={logoSource} style={{ width: logoWidth, height: logoHeight, resizeMode: "contain" }} />
      </View> */}

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
