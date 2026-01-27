import React, { useState } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { useTheme } from "../utils/theme";

interface NotificationPreferences {
  enabled: boolean;
  social: boolean;
  academic: boolean;
  company: boolean;
  generalAssembly: boolean;
  internal: boolean;
  other: boolean;
  welcome: boolean;
}

interface NotificationSettingsProps {
  preferences: NotificationPreferences;
  onPreferencesChange: (preferences: NotificationPreferences) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  preferences,
  onPreferencesChange,
}) => {
  const theme = useTheme();

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    onPreferencesChange({
      ...preferences,
      [key]: value,
    });
  };

  return (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.surfaceContainer },
      ]}
    >
      <Text
        style={[
          styles.sectionTitle,
          { color: theme.onBackground },
        ]}
      >
        Notifikasjonsinnstillinger
      </Text>

      {/* Master Toggle */}
      <View
        style={[
          styles.notificationRow,
          {
            borderBottomWidth: 1,
            borderBottomColor: theme.surfaceContainerHigh,
            paddingBottom: 12,
            marginBottom: 12,
          },
        ]}
      >
        <Text
          style={[
            styles.notificationLabel,
            { color: theme.onBackground, fontWeight: "600" },
          ]}
        >
          Slå på varsler
        </Text>
        <Switch
          value={preferences.enabled}
          onValueChange={(value) => handleToggle("enabled", value)}
          trackColor={{ false: theme.surfaceVariant, true: theme.primaryContainer }}
          thumbColor={preferences.enabled ? theme.primary : theme.onSurfaceVariant}
        />
      </View>

      {preferences.enabled && (
        <>
          <Text
            style={[
              styles.notificationSubtitle,
              { color: theme.onSurfaceVariant, marginBottom: 12 },
            ]}
          >
            Motta varsler for disse arrangementstyper:
          </Text>

          {/* Event Type Toggles */}
          <View style={styles.notificationRow}>
            <Text style={[styles.notificationLabel, { color: theme.onBackground }]}>
              Sosialt
            </Text>
            <Switch
              value={preferences.social}
              onValueChange={(value) => handleToggle("social", value)}
              trackColor={{
                false: theme.surfaceVariant,
                true: theme.primaryContainer,
              }}
              thumbColor={preferences.social ? theme.primary : theme.onSurfaceVariant}
            />
          </View>

          <View style={styles.notificationRow}>
            <Text style={[styles.notificationLabel, { color: theme.onBackground }]}>
              Kurs
            </Text>
            <Switch
              value={preferences.academic}
              onValueChange={(value) => handleToggle("academic", value)}
              trackColor={{
                false: theme.surfaceVariant,
                true: theme.primaryContainer,
              }}
              thumbColor={preferences.academic ? theme.primary : theme.onSurfaceVariant}
            />
          </View>

          <View style={styles.notificationRow}>
            <Text style={[styles.notificationLabel, { color: theme.onBackground }]}>
              Bedpres
            </Text>
            <Switch
              value={preferences.company}
              onValueChange={(value) => handleToggle("company", value)}
              trackColor={{
                false: theme.surfaceVariant,
                true: theme.primaryContainer,
              }}
              thumbColor={preferences.company ? theme.primary : theme.onSurfaceVariant}
            />
          </View>

          <View style={styles.notificationRow}>
            <Text style={[styles.notificationLabel, { color: theme.onBackground }]}>
              Generalforsamling
            </Text>
            <Switch
              value={preferences.generalAssembly}
              onValueChange={(value) => handleToggle("generalAssembly", value)}
              trackColor={{
                false: theme.surfaceVariant,
                true: theme.primaryContainer,
              }}
              thumbColor={
                preferences.generalAssembly ? theme.primary : theme.onSurfaceVariant
              }
            />
          </View>

          <View style={styles.notificationRow}>
            <Text style={[styles.notificationLabel, { color: theme.onBackground }]}>
              Intern
            </Text>
            <Switch
              value={preferences.internal}
              onValueChange={(value) => handleToggle("internal", value)}
              trackColor={{
                false: theme.surfaceVariant,
                true: theme.primaryContainer,
              }}
              thumbColor={preferences.internal ? theme.primary : theme.onSurfaceVariant}
            />
          </View>

          <View style={styles.notificationRow}>
            <Text style={[styles.notificationLabel, { color: theme.onBackground }]}>
              Annet
            </Text>
            <Switch
              value={preferences.other}
              onValueChange={(value) => handleToggle("other", value)}
              trackColor={{
                false: theme.surfaceVariant,
                true: theme.primaryContainer,
              }}
              thumbColor={preferences.other ? theme.primary : theme.onSurfaceVariant}
            />
          </View>

          <View style={styles.notificationRow}>
            <Text style={[styles.notificationLabel, { color: theme.onBackground }]}>
              Fadderuke
            </Text>
            <Switch
              value={preferences.welcome}
              onValueChange={(value) => handleToggle("welcome", value)}
              trackColor={{
                false: theme.surfaceVariant,
                true: theme.primaryContainer,
              }}
              thumbColor={preferences.welcome ? theme.primary : theme.onSurfaceVariant}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  notificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  notificationLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  notificationSubtitle: {
    fontSize: 13,
    fontStyle: "italic",
  },
});

export default NotificationSettings;
