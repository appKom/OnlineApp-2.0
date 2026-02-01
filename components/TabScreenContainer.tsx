import { View } from "react-native";
import { useTheme } from "../utils/theme"

export function TabScreenContainer({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, paddingBottom: 104, backgroundColor: theme.background }}>
      {children}
    </View>
  );
}
