import TimeLocationCard from "components/EventDetails/TimeLocationCard";
import DescriptionCard from "components/EventDetails/DescriptionCard";
import AttendanceCard from "components/EventDetails/AttendanceCard/AttendanceCard";
import AttendeesBottomSheet from "components/EventDetails/AttendeesBottomSheet";
import TurnstileModal from "components/TurnstileModal";
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
  View,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "@react-native-community/blur";
import BottomSheet from "@gorhom/bottom-sheet";
import {
  getEvent,
  getRegistrationAvailability,
  registerForEvent,
  deregisterForEvent,
  getExpiryDateForUser,
} from "utils/trpc";
import type { Punishment } from "types/punishment";
import Authenticator from "utils/authenticator";
import { getUserPoolIndex } from "utils/user-utils";
import { EventAttendanceBundle } from "types/event";
import {
  isRegistrationEvent,
  formatNorwegianDate,
  getRegistrationStatus,
  formatRegistrationPeriod,
  sortAttendeesByPool,
} from "utils/event-utils";
import { useTheme, useThemeMode } from "utils/theme";
import { TURNSTILE_SITE_KEY } from "utils/turnstile";

const DEREGISTER_REASON_TYPES = [
  "SCHOOL",
  "WORK",
  "ECONOMY",
  "TIME",
  "SICK",
  "NO_FAMILIAR_FACES",
  "OTHER",
] as const;
type DeregisterReasonType = (typeof DEREGISTER_REASON_TYPES)[number];

const EventDetails: React.FC = () => {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const screenWidth = Dimensions.get("window").width;
  const insets = useSafeAreaInsets();
  const user = Authenticator.user;
  const theme = useTheme();
  const { mode } = useThemeMode();

  const getFallbackImage = () => {
    return mode === "dark"
      ? require("../../../assets/eventFallback/fallback_dark.png")
      : require("../../../assets/eventFallback/fallback_light.png");
  };

  const [event, setEvent] = useState<EventAttendanceBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [punishment, setPunishment] = useState<Punishment | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(16 / 9);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const isRegistration = isRegistrationEvent(event);

  const userPoolIndex = useMemo(() => {
    if (!user || !event?.attendance?.pools) return null;
    return getUserPoolIndex(user, event.attendance.pools) ?? null;
  }, [user, event?.attendance?.pools]);

  const sortedAttendees = useMemo(
    () => sortAttendeesByPool(event, userPoolIndex),
    [event, userPoolIndex],
  );

  const registrationStatus = useMemo(
    () => getRegistrationStatus(event?.attendance),
    [event?.attendance],
  );

  const registrationPeriod = useMemo(
    () => formatRegistrationPeriod(event?.attendance),
    [event?.attendance],
  );

  const [registering, setRegistering] = useState(false);
  const [turnstileModalVisible, setTurnstileModalVisible] = useState(false);
  const [pendingTurnstileToken, setPendingTurnstileToken] = useState<string | null>(null);

  const handleRegisterPress = async () => {
    if (!event?.attendance?.id) return;
    
    // Show Turnstile modal to get token
    setTurnstileModalVisible(true);
  };

  const handleTurnstileToken = async (token: string) => {
    if (!event?.attendance?.id) return;
    
    setTurnstileModalVisible(false);
    setRegistering(true);
    
    try {
      const result = await registerForEvent(event.attendance.id, token);
      if (result && (result as any).success) {
        // Refresh availability or re-fetch event to update UI
        await getRegistrationAvailability(event.attendance.id);
      } else {
        console.warn("Registration failed:", result);
      }
    } catch (err) {
      console.error("Registration error:", err);
    } finally {
      setRegistering(false);
    }
  };

  const handleDeregisterPress = async () => {
    if (!event?.attendance?.id) return;
    try {
      const result = await deregisterForEvent(
        event.attendance.id,
        DEREGISTER_REASON_TYPES[6],
        "test",
      );
      if (result && (result as any).success) {
        // Refresh availability or re-fetch event to update UI
        await getRegistrationAvailability(event.attendance.id);
      } else {
        console.warn("Registration failed:", result);
      }
    } catch (err) {
      console.error("Registration error:", err);
    } finally {
      setRegistering(false);
    }
  };

  // Use shared theme tokens for colors
  const colors = {
    background: theme.background,
    text: theme.onBackground,
    error: theme.error,
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
        // keep the exact return type from getEvent (EventAttendanceBundle | null)
        const eventData = data ?? null;
        setEvent(eventData);

        if (eventData?.event?.imageUrl) {
          Image.getSize(
            eventData.event.imageUrl,
            (width, height) => setImageAspectRatio(width / height),
            (error) => console.log("Error getting image size:", error),
          );
        }

        setLoading(false);

        if (eventData != null && eventData.attendance != null) {
          getRegistrationAvailability(eventData.attendance.id || "").then();
        } else {
          console.log(
            eventData == null ? "event is null" : "attendance is null",
          );
        }

        // Fetch server-computed punishment for the signed-in user (if any)
        if (user) {
          void getExpiryDateForUser(user.id)
            .then((p) => {
              setPunishment((p as Punishment) ?? null);
            })
            .catch(() => {
              // ignore errors here; keep punishment null
            });
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
        color={colors.text}
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

  const imageHeight =
    screenWidth / Math.max(5 / 3, Math.min(6 / 3, imageAspectRatio));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.scrollContainer}>
        <View
          style={{
            width: screenWidth,
            height: imageHeight,
            overflow: "hidden",
          }}
        >
          <ImageBackground
            source={
              event.event.imageUrl
                ? { uri: event.event.imageUrl }
                : getFallbackImage()
            }
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          >
            <BlurView
              blurType={mode}
              blurAmount={10}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
          <Image
            source={
              event.event.imageUrl
                ? { uri: event.event.imageUrl }
                : getFallbackImage()
            }
            style={[
              styles.image,
              {
                width: screenWidth,
                height: imageHeight,
                position: "absolute",
              },
            ]}
            resizeMode="contain"
          />
        </View>

        <TimeLocationCard
          event={event}
          formatNorwegianDate={formatNorwegianDate}
        />

        <DescriptionCard
          description={event.event.description ?? ""}
          screenWidth={screenWidth}
          descriptionExpanded={descriptionExpanded}
          onToggleDescription={toggleDescription}
        />

        {isRegistration ? (
          <AttendanceCard
            user={user}
            event={event.event}
            initialAttendance={event.attendance!}
            initialPunishment={punishment}
            parentEvent={event.parentEvent ?? null}
            parentAttendance={event.parentAttendance ?? null}
            onOpenTurnstile={() => setTurnstileModalVisible(true)}
          />
        ) : (
          <View style={styles.noRegistrationContainer}>
            <Text
              style={[
                styles.noRegistrationText,
                { color: theme.onSurfaceVariant },
              ]}
            >
              Dette er ikke et påmeldingsarrangement.
            </Text>
          </View>
        )}

        <View style={{ height: 104 }} />
      </ScrollView>

      {isRegistration && (
        <AttendeesBottomSheet
          bottomSheetRef={bottomSheetRef}
          attendance={event.attendance!}
          userPoolIndex={userPoolIndex}
          sortedAttendees={sortedAttendees}
        />
      )}

      <TurnstileModal
        visible={turnstileModalVisible}
        onToken={handleTurnstileToken}
        onClose={() => setTurnstileModalVisible(false)}
        siteKey={TURNSTILE_SITE_KEY}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  image: {
    marginTop: 0,
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
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default EventDetails;
