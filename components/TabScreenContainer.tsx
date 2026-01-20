import { View } from "react-native";

export function TabScreenContainer({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, paddingBottom: 104 }}>
      {children}
    </View>
  );
}
