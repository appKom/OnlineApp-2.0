import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { useTheme } from "../../utils/theme";
import { Platform, DynamicColorIOS } from "react-native";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={
        Platform.OS === "ios"
          ? DynamicColorIOS({ light: "#fab759", dark: "#fab759" })
          : "#fab759" // Change this line
      }
      backgroundColor={theme.surface}
      labelStyle={{
        color:
          Platform.OS === "ios"
            ? DynamicColorIOS({
                light: theme.outline ?? "#999999",
                dark: theme.outline ?? "#999999",
              })
            : (theme.outline ?? "#999999"),
      }}
    >
      <NativeTabs.Trigger name="(home)">
        <Label>Hjem</Label>
        <Icon
          sf="calendar"
          drawable="ic_menu_my_calendar" // Use built-in Android drawable or add custom
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(games)">
        <Label>Spill</Label>
        <Icon
          sf="dice.fill"
          drawable="ic_menu_view" // Replace with custom drawable if needed
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(profile)">
        <Label>Profil</Label>
        <Icon sf="person.fill" drawable="ic_menu_preferences" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
