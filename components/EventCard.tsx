import React from "react";
import { Pressable, View, Text, StyleSheet, Image } from "react-native";
import { EventAttendanceBundle } from "../types/event";
import { useTheme, useThemeMode, elevate } from "../utils/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";import { getReservedAttendeeCount, getUnreservedAttendeeCount, getAttendablePool } from "../utils/attendance";
interface EventCardProps {
  event: EventAttendanceBundle;
  onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const theme = useTheme();
  const { mode } = useThemeMode();

  const getFallbackImage = () => {
    return mode === 'dark'
      ? require('../assets/eventFallback/fallback_dark.png')
      : require('../assets/eventFallback/fallback_light.png');
  };

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
        gap: 8,
        alignItems: "center",
      }}
      onPress={onPress}
    >
      <View style={{ justifyContent: "center" }}>
        <Image
          source={event.event.imageUrl ? { uri: event.event.imageUrl } : getFallbackImage()}
          style={{
            width: 100,
            height: 70,
            borderRadius: 4,
          }}
          resizeMode="cover"
        />
      </View>
      <View style={{ flex: 1 }}>
        {/* Event Title */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4, gap: 5 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: theme.onBackground,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {event.event.title ?? "No Title"}
          </Text>
          
          {event.attendance && (
            <View style={{ 
              flexDirection: "row", 
              alignItems: "flex-end", 
              backgroundColor: theme.surfaceContainerHigh, 
              paddingVertical: 2,
              paddingHorizontal: 6,
              borderRadius: 6,
              gap: 3,
            }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: theme.onBackground,
                }}
              >
                {getReservedAttendeeCount(event.attendance, event.attendance.pools[0]?.id ?? "")}
                {event.attendance.pools[0]?.capacity > 0 && `/${event.attendance.pools[0]?.capacity}`}
              </Text>
              
              {getUnreservedAttendeeCount(event.attendance, event.attendance.pools[0]?.id ?? "") > 0 && (
                <View style={{
                  alignSelf: 'flex-end'
                }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.onBackground,
                      fontWeight: "500",
                    }}
                  >
                    +{getUnreservedAttendeeCount(event.attendance, event.attendance.pools[0]?.id ?? "")}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

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
