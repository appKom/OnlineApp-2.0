import TimeLocationCard from "components/EventDetails/TimeLocationCard";
import DescriptionCard from "components/EventDetails/DescriptionCard";
import AttendanceCard from "components/EventDetails/AttendanceCard/AttendanceCard";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  ImageBackground,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "@react-native-community/blur";
import { getEvent, getExpiryDateForUser } from "utils/trpc";
import type { Punishment } from "types/punishment";
import Authenticator from "utils/authenticator";
import { EventAttendanceBundle } from "types/event";
import {
  isRegistrationEvent,
  formatNorwegianDate,
} from "utils/event-utils";
import { useTheme, useThemeMode } from "utils/theme";
import {
  EventInsetDivider,
  EventSurface,
  useEventChromeColors,
} from "components/EventDetails/EventSurface";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { EventRules } from "components/EventDetails/AttendanceCard/EventRules";
import { PaymentExplanationDialog } from "components/EventDetails/AttendanceCard/PaymentExplanationDialog";
import { Linking } from "react-native";

const EventDetails: React.FC = () => {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const screenWidth = Dimensions.get("window").width;
  const insets = useSafeAreaInsets();
  const user = Authenticator.user;
  const theme = useTheme();
  const chrome = useEventChromeColors();
  const { mode } = useThemeMode();
  const router = useRouter();

  const renderBackButton = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tilbake til arrangementer"
      onPress={() => router.back()}
      style={[
        styles.backButton,
        {
          top: insets.top + 8,
          backgroundColor: chrome.recessed,
          borderColor: chrome.edge,
          borderTopColor: chrome.highlight,
        },
      ]}
    >
      <MaterialCommunityIcons name="arrow-left" size={22} color={chrome.icon} />
    </Pressable>
  );

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

  const isRegistration = isRegistrationEvent(event);

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
          // getRegistrationAvailability now requires a turnstile token, skip it on page load
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
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.text} />
        {renderBackButton()}
      </View>
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
        {renderBackButton()}
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
          {renderBackButton()}
        </View>
        <EventInsetDivider onBackground />
        <View style={styles.titleArea}>
          <Text style={[styles.eventTitle, { color: theme.onSurface }]}>
            {event.event.title}
          </Text>
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
          />
        ) : (
          <EventSurface style={styles.noRegistrationContainer}>
            <Text
              style={[
                styles.noRegistrationText,
                { color: theme.onSurfaceVariant },
              ]}
            >
              Dette er ikke et påmeldingsarrangement.
            </Text>
          </EventSurface>
        )}
        <View style={styles.relatedLinks}>
          <EventInsetDivider onBackground />
          <View style={styles.relatedLinksRow}>
            <EventRules />
            <Pressable
              accessibilityRole="link"
              onPress={() => Linking.openURL("https://online.ntnu.no/innstillinger/profil")}
              style={styles.relatedLink}
            >
              <MaterialCommunityIcons name="food-apple-outline" size={18} color={chrome.icon} />
              <Text style={[styles.relatedLinkText, { color: theme.onSurface }]}>Matallergier</Text>
            </Pressable>
            {isRegistration && Boolean(event.attendance?.attendancePrice) && <PaymentExplanationDialog />}
          </View>
        </View>
        {/*ikke fjern, navbar på ios blokker bunnen av siden uten denne :p  */}
        <View style={{ height: 104 }} />
      </ScrollView>

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
  backButton: {
    position: "absolute",
    left: 16,
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  titleArea: { paddingHorizontal: 24, paddingTop: 17, paddingBottom: 2 },
  eventTitle: { fontSize: 23, lineHeight: 29, fontWeight: "700" },
  relatedLinks: { marginHorizontal: 24, marginTop: 4 },
  relatedLinksRow: { flexDirection: "row", flexWrap: "wrap", gap: 18, paddingVertical: 17 },
  relatedLink: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 32 },
  relatedLinkText: { fontSize: 14, fontWeight: "600" },
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
    padding: 16,
  },
  noRegistrationText: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default EventDetails;
