import { NativeTabs, Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from "../../utils/theme";
import { Platform, DynamicColorIOS } from "react-native";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      tintColor = { theme.secondary }
      backgroundColor={theme.surface}
    >
      <NativeTabs.Trigger name="(events)">
        <Label>Events</Label>
        <Icon 
          sf="calendar"
          src={<VectorIcon family={MaterialCommunityIcons} name="calendar" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(games)">
        <Label>Spill</Label>
        <Icon
          sf="dice.fill"
          src={<VectorIcon family={MaterialCommunityIcons} name="dice-multiple" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(profile)">
        <Label>Profil</Label>
        <Icon 
          sf="person.fill" 
          src={<VectorIcon family={MaterialIcons} name="person" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
