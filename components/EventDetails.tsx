import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getEvent } from "../utils/trpc";
import AttendanceCard from "./EventDetails/AttendanceCard";
import DescriptionCard from "./EventDetails/DescriptionCard";
import RegistrationCard from "./EventDetails/RegistrationCard";

type EventDetailsRouteProp = RouteProp<any, "EventDetails">;

// Main EventDetails Page Component
const EventDetails: React.FC = () => {
  const route = useRoute<EventDetailsRouteProp>();
  const { eventId } = route.params;
  const screenWidth = Dimensions.get("window").width;

  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(16 / 9);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // Format date for Norwegian timezone
  const formatNorwegianDate = (dateString: string) => {
    const date = new Date(dateString);

    const formatter = new Intl.DateTimeFormat("nb-NO", {
      timeZone: "Europe/Oslo",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return formatter.format(date);
  };

  const toggleDescription = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDescriptionExpanded(!descriptionExpanded);
  };

  // Check if registration is open
  const getRegistrationStatus = () => {
    if (!event?.attendance) return "Stengt";

    const now = new Date();
    const registerStart = new Date(event.attendance.registerStart);
    const registerEnd = new Date(event.attendance.registerEnd);

    if (now >= registerStart && now <= registerEnd) {
      return "Åpen";
    }
    return "Stengt";
  };

  const formatRegistrationPeriod = () => {
    if (!event?.attendance) return null;

    const start = formatNorwegianDate(event.attendance.registerStart);
    const end = formatNorwegianDate(event.attendance.registerEnd);

    return `${start} - ${end}`;
  };

  useEffect(() => {
    getEvent(eventId)
      .then((data) => {
        const eventData = data ?? {};
        console.log(eventData);
        setEvent(eventData);

        if (eventData.event?.imageUrl) {
          Image.getSize(
            eventData.event.imageUrl,
            (width, height) => {
              setImageAspectRatio(width / height);
            },
            (error) => {
              console.log("Error getting image size:", error);
            }
          );
        }

        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [eventId]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  if (error || !event) {
    return (
      <Text style={{ color: "red" }}>
        {error ?? "Could not load event details"}
      </Text>
    );
  }

  const imageHeight = screenWidth / imageAspectRatio;
  const registrationStatus = getRegistrationStatus();
  const registrationPeriod = formatRegistrationPeriod();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Full width image with proper aspect ratio */}
        <Image
          source={{ uri: event.event.imageUrl }}
          style={[
            styles.image,
            {
              width: screenWidth,
              height: imageHeight,
            },
          ]}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>{event.event.title}</Text>

        {/* Attendance Card */}
        <AttendanceCard
          event={event}
          formatNorwegianDate={formatNorwegianDate}
        />

        {/* Description Card */}
        <DescriptionCard
          description={event.event.description}
          screenWidth={screenWidth}
          descriptionExpanded={descriptionExpanded}
          onToggleDescription={toggleDescription}
        />

        {/* Registration Card */}
        <RegistrationCard
          attendance={event.attendance}
          registrationStatus={registrationStatus}
          registrationPeriod={registrationPeriod}
        />

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  image: {
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 24,
    marginVertical: 20,
    color: "#333",
  },
  card: {
    backgroundColor: "#f8f9fa",
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  descriptionPreview: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 8,
  },
  toggleText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 8,
  },
  htmlBase: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
  },
  registrationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: "center",
  },
  statusOpen: {
    backgroundColor: "#D4F6D4",
  },
  statusClosed: {
    backgroundColor: "#FFE4E4",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusOpenText: {
    color: "#2D7D32",
  },
  statusClosedText: {
    color: "#C62828",
  },
  registrationButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  registrationButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  registrationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registrationButtonTextDisabled: {
    color: "#999",
  },
  noRegistrationText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default EventDetails;
