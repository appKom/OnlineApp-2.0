import AttendanceCard from "components/EventDetails/AttendanceCard";
import DescriptionCard from "components/EventDetails/DescriptionCard";
import RegistrationCard from "components/EventDetails/RegistrationCard";
import AttendeesBottomSheet from "components/EventDetails/AttendeesBottomSheet";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet from "@gorhom/bottom-sheet";
import { getEvent, getRegistrationAvailability } from "utils/trpc";
import Authenticator from "utils/authenticator";
import { UserUtils } from "utils/user-utils";
import { EventAttendanceBundle } from "types/event";
import {
  isRegistrationEvent,
  formatNorwegianDate,
  getRegistrationStatus,
  formatRegistrationPeriod,
  sortAttendeesByPool,
} from "utils/event-utils";

const EventDetails: React.FC = () => {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const screenWidth = Dimensions.get("window").width;
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = Authenticator.user;

  const [event, setEvent] = useState<EventAttendanceBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(16 / 9);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const isRegistration = isRegistrationEvent(event);

  const userPoolIndex = useMemo(() => {
    if (!user || !event?.attendance?.pools) return null;
    return UserUtils.getUserPoolIndex(user, event.attendance.pools) ?? null;
  }, [user, event?.attendance?.pools]);

  const sortedAttendees = useMemo(
    () => sortAttendeesByPool(event, userPoolIndex),
    [event, userPoolIndex]
  );

  const registrationStatus = useMemo(
    () => getRegistrationStatus(event?.attendance),
    [event?.attendance]
  );

  const registrationPeriod = useMemo(
    () => formatRegistrationPeriod(event?.attendance, formatNorwegianDate),
    [event?.attendance]
  );

  const colors = {
    background: isDark ? "#000000" : "#ffffff",
    text: isDark ? "#ffffff" : "#333333",
    error: isDark ? "#ff6b6b" : "#red",
  };

  const toggleDescription = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDescriptionExpanded(!descriptionExpanded);
  };

  const handleOpenAttendeesBottomSheet = () => {
    console.log("🚀 Opening attendees bottom sheet");
    bottomSheetRef.current?.expand();
  };

  useEffect(() => {});

  useEffect(() => {
    getEvent(eventId)
      .then((data) => {
        const eventData = data ?? {};
        // console.log(eventData);
        setEvent(eventData);

        if (eventData.event?.imageUrl) {
          Image.getSize(
            eventData.event.imageUrl,
            (width, height) => setImageAspectRatio(width / height),
            (error) => console.log("Error getting image size:", error)
          );
        }

        setLoading(false);

        if (eventData != null && eventData.attendance != null) {
          getRegistrationAvailability(eventData.attendance.id || "").then();
        } else {
          console.log(
            eventData == null ? "event is null" : "attendance is null"
          );
        }
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [eventId]);

  if (loading) {
    return (
      <ActivityIndicator
        style={{ flex: 1, backgroundColor: colors.background }}
        color={isDark ? "#ffffff" : "#000000"}
      />
    );
  }

  if (error || !event) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error ?? "Could not load event details"}
        </Text>
      </View>
    );
  }

  const imageHeight = screenWidth / imageAspectRatio;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: event?.event?.title || "",
          headerTransparent: true,
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          <Image
            source={{ uri: event.event.imageUrl }}
            style={[styles.image, { width: screenWidth, height: imageHeight }]}
            resizeMode="contain"
          />

          <AttendanceCard
            event={event}
            formatNorwegianDate={formatNorwegianDate}
          />

          <DescriptionCard
            description={event.event.description}
            screenWidth={screenWidth}
            descriptionExpanded={descriptionExpanded}
            onToggleDescription={toggleDescription}
          />

          {isRegistration ? (
            <RegistrationCard
              attendance={event.attendance!}
              registrationStatus={registrationStatus}
              registrationPeriod={registrationPeriod}
              onOpenAttendeesBottomSheet={handleOpenAttendeesBottomSheet}
              sortedAttendees={sortedAttendees}
            />
          ) : (
            <View style={styles.noRegistrationContainer}>
              <Text style={styles.noRegistrationText}>
                Dette er ikke et påmeldingsarrangement.
              </Text>
            </View>
          )}
        </ScrollView>

        {isRegistration && (
          <AttendeesBottomSheet
            bottomSheetRef={bottomSheetRef}
            attendance={event.attendance!}
            userPoolIndex={userPoolIndex}
            sortedAttendees={sortedAttendees}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  image: {
    marginTop: 120,
    backgroundColor: "#f0f0f0",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginHorizontal: 20,
  },
  noRegistrationContainer: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 16,
  },
  noRegistrationText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default EventDetails;
