import React from "react";
import { Pressable, View, Text, StyleSheet, Image } from "react-native";
import { EventAttendanceBundle } from "../types/event";
import { useTheme, elevate } from "../utils/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface EventCardProps {
  event: EventAttendanceBundle;
  onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const theme = useTheme();

  const getBadgeColor = (eventType: string | undefined): string => {
    switch (eventType?.toUpperCase()) {
      case "SOCIAL":
        return theme.socialBadge;
      case "ACADEMIC":
        return theme.academicBadbe;
      case "COMPANY":
        return theme.companyBadge;
      case "GENERAL_ASSEMBLY":
        return theme.generalAssemblyBadge;
      case "INTERNAL":
        return theme.internalBadge;
      case "OTHER":
        return theme.otherBadge;
      case "WELCOME":
        return theme.welcomeBadge;
      default:
        return theme.otherBadge;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("no-NO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Pressable
      style={{
        padding: 12,
        borderBottomWidth: 1,
        borderColor: theme.surfaceContainerHigh,
        backgroundColor: theme.background,
        flexDirection: "row",
        gap: 8
      }}
      onPress={onPress}
    >
      <View style={{ justifyContent: "center" }}>
        <Image
          source={{ uri: event.event.imageUrl }}
          style={{
            width: 100,
            height: 70,
            borderRadius: 4,
          }}
          resizeMode="cover"
        />
      </View>
      <View>
        {/* Event Title */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: theme.onBackground,
            marginBottom: 8,
          }}
        >
          {event.event.title ?? "No Title"}
        </Text>

        {/* Event Date and Time */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <MaterialCommunityIcons 
            name="calendar-blank"
            size={17}
            color={theme.onSurfaceVariant}
          />
          <Text
            style={{
              fontSize: 14,
              color: theme.onSurfaceVariant,
              marginBottom: 4,
            }}
          >
            {formatDate(event.event.start)}
          </Text>
        </View>
        <View style={{
          alignSelf: 'flex-start',
          backgroundColor: getBadgeColor(event.event.type),
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4
        }}>
          <Text 
            style={{ 
              color: elevate(getBadgeColor(event.event.type), 150), 
              fontSize: 12,
              fontWeight: '500'
            }}>
            {event.event.type}
          </Text>
        </View>
      </View>
      
    </Pressable>
  );
};

export default EventCard;
