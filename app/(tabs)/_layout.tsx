import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { useTheme } from "../../utils/theme";
import { Platform, DynamicColorIOS } from "react-native";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={theme.secondary}
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
      <NativeTabs.Trigger name="(events)">
        <Label>Hjem</Label>
        <Icon
          sf="calendar"
          drawable="ic_calendar" // Use built-in Android drawable or add custom
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(games)">
        <Label>Spill</Label>
        <Icon
          sf="dice.fill"
          drawable="ic_dice" // Replace with custom drawable if needed
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(profile)">
        <Label>Profil</Label>
        <Icon 
          sf="person.fill" 
          drawable="ic_person" 
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
