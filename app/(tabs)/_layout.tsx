import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTheme, useThemeMode } from "../../utils/theme";
import { Platform, DynamicColorIOS } from "react-native";

export default function TabLayout() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const gamesBackground = mode === "dark" ? "#043728" : "#07523A";

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor={theme.secondary}
      iconColor={{
        default: theme.onSurfaceVariant,
        selected: theme.onSecondaryContainer,
      }}
      indicatorColor={theme.secondaryContainer}
      backgroundColor={
        Platform.OS === "android"
          ? theme.surfaceContainerLowest
          : theme.surfaceContainerLowest
      }
      labelStyle={{
        color:
          Platform.OS === "ios"
            ? DynamicColorIOS({
                light: theme.outline ?? "#999999",
                dark: theme.outline ?? "#999999",
              })
            : (theme.onSurfaceVariant ?? "#999999"),
      }}
    >
      <NativeTabs.Trigger
        name="(events)"
        contentStyle={{ backgroundColor: theme.background }}
      >
        <NativeTabs.Trigger.Label>Hjem</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" drawable="ic_calendar" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="(games)"
        disableAutomaticContentInsets
        contentStyle={{ backgroundColor: gamesBackground }}
      >
        <NativeTabs.Trigger.Label>Spill</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="dice.fill" drawable="ic_dice" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="(profile)"
        contentStyle={{ backgroundColor: theme.background }}
      >
        <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.fill" drawable="ic_person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
