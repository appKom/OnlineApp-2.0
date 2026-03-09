import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTheme } from "../../utils/theme";
import { Platform, DynamicColorIOS } from "react-native";

export default function TabLayout() {
  const theme = useTheme();

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
        contentStyle={{ backgroundColor: theme.background }}
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
