import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { getTheme, ThemeProvider, useTheme } from "./utils/theme";
import * as SystemUI from "expo-system-ui";

SystemUI.setBackgroundColorAsync("#0F1417");

export default function App() {
  const theme = useTheme();
  return (
    <ThemeProvider>
      <View style={[styles.container, { backgroundColor: "#f00" }]}></View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
