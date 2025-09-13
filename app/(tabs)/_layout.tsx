import { withLayoutContext } from "expo-router";
import {
  createNativeBottomTabNavigator,
  NativeBottomTabNavigationOptions,
  NativeBottomTabNavigationEventMap,
} from "@bottom-tabs/react-navigation";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";

const BottomTabNavigator = createNativeBottomTabNavigator().Navigator;

const Tabs = withLayoutContext<
  NativeBottomTabNavigationOptions,
  typeof BottomTabNavigator,
  TabNavigationState<ParamListBase>,
  NativeBottomTabNavigationEventMap
>(BottomTabNavigator);

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Hjem",
          tabBarIcon: () => ({ sfSymbol: "house" }),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "Spill",
          tabBarIcon: () => ({ sfSymbol: "dice" }),
        }}
      />
    </Tabs>
  );
}
