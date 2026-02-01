import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { getTheme, ThemeProvider, useTheme } from "./utils/theme";

export default function App() {
  const theme = useTheme();
  return (
    <ThemeProvider>
      <View
        style={[styles.container, { backgroundColor: theme.background }]}
      ></View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
