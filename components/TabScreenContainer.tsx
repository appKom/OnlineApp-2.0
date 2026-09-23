import { View } from "react-native";
import { useTheme } from "../utils/theme";

export function TabScreenContainer({
  children,
  backgroundColor,
}: {
  children: React.ReactNode;
  backgroundColor?: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: backgroundColor ?? theme.background,
      }}
    >
      {children}
    </View>
  );
}
