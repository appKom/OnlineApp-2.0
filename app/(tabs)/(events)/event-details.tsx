import TimeLocationCard from "components/EventDetails/TimeLocationCard";
import DescriptionCard from "components/EventDetails/DescriptionCard";
import AttendanceCard from "components/EventDetails/AttendanceCard/AttendanceCard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  LayoutAnimation,
  RefreshControl,
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
import { EventAttendanceBundle } from "types/event";
import {
  isRegistrationEvent,
  formatNorwegianDate,
} from "utils/event-utils";
import { useTheme, useThemeMode } from "utils/theme";
import {
  Panel,
  PanelDivider,
  RaisedButton,
  Tag,
  usePanelChromeColors,
} from "components/Panel";
import { useEventTypeStyle, useInternalTagStyle } from "components/EventCard";
import { toggleBookmarkWithUndo, useBookmarks } from "utils/bookmarks";
import { useCurrentUser } from "utils/useCurrentUser";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { EventRules } from "components/EventDetails/AttendanceCard/EventRules";
import { PaymentExplanationDialog } from "components/EventDetails/AttendanceCard/PaymentExplanationDialog";
import { EditProfileFieldModal } from "components/Profile/EditProfileFieldModal";
import { Linking } from "react-native";

const EventDetails: React.FC = () => {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const screenWidth = Dimensions.get("window").width;
  const insets = useSafeAreaInsets();
  const user = useCurrentUser();
  const theme = useTheme();
  const chrome = usePanelChromeColors();
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
          backgroundColor: chrome.raised,
          borderColor: chrome.edge,
          borderTopColor: chrome.highlight,
        },
      ]}
    >
      <MaterialCommunityIcons name="arrow-left" size={20} color={chrome.icon} />
    </Pressable>
  );

  const { isBookmarked } = useBookmarks();
  const bookmarked = isBookmarked(eventId);

  const renderBookmarkButton = (bundle: EventAttendanceBundle) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={bookmarked ? "Fjern bokmerke" : "Bokmerk arrangement"}
      accessibilityState={{ selected: bookmarked }}
      onPress={() => toggleBookmarkWithUndo(bundle)}
      style={[
        styles.backButton,
        styles.bookmarkButton,
        {
          top: insets.top + 8,
          backgroundColor: chrome.raised,
          borderColor: chrome.edge,
          borderTopColor: chrome.highlight,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={bookmarked ? "bookmark" : "bookmark-outline"}
        size={20}
        color={bookmarked ? chrome.accent : chrome.icon}
      />
    </Pressable>
  );

  const getFallbackImage = () => {
    return mode === "dark"
      ? require("../../../assets/eventFallback/fallback_dark.png")
      : require("../../../assets/eventFallback/fallback_light.png");
  };

  const [event, setEvent] = useState<EventAttendanceBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingDiet, setEditingDiet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [punishment, setPunishment] = useState<Punishment | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(16 / 9);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const isRegistration = isRegistrationEvent(event);
  const eventType = useEventTypeStyle(event?.event.type);
  const internalTag = useInternalTagStyle();

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

  const loadEvent = useCallback(async () => {
    try {
      const eventData = (await getEvent(eventId)) ?? null;
      setEvent(eventData);
      setError(null);

      if (eventData?.event?.imageUrl) {
        Image.getSize(
          eventData.event.imageUrl,
          (width, height) => setImageAspectRatio(width / height),
          (error) => console.log("Error getting image size:", error),
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
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    }
    // Refetch on login/logout so the attendance reflects the signed-in user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user?.id]);

  useEffect(() => {
    void loadEvent().finally(() => setLoading(false));
  }, [loadEvent]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvent();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.text} />
        {renderBackButton()}
      </View>
    );
  }

  // A failed refresh keeps showing the event we already have.
  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={chrome.textMuted}
              colors={[chrome.accent]}
            />
          }
        >
          <MaterialCommunityIcons name="cloud-alert-outline" size={36} color={chrome.textMuted} />
          <Text style={[styles.errorTitle, { color: chrome.text }]}>Kunne ikke laste arrangementet</Text>
          <Text style={[styles.errorText, { color: chrome.textMuted }]}>
            {error ?? "Arrangementet finnes ikke, eller du har ikke tilgang til det."}
          </Text>
          <RaisedButton
            icon="refresh"
            label={refreshing ? "Laster…" : "Prøv igjen"}
            disabled={refreshing}
            onPress={handleRefresh}
          />
        </ScrollView>
        {renderBackButton()}
      </View>
    );
  }

  const imageHeight =
    screenWidth / Math.max(5 / 3, Math.min(6 / 3, imageAspectRatio));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={chrome.textMuted}
            colors={[chrome.accent]}
            progressViewOffset={insets.top}
          />
        }
      >
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
          {renderBookmarkButton(event)}
        </View>
        <PanelDivider onBackground />
        <View style={styles.titleArea}>
          <View style={styles.tags}>
            <Tag label={eventType.label} color={eventType.color} />
            {event.event.visibility === "COMMITTEE_ONLY" && (
              <Tag label={internalTag.label} color={internalTag.color} />
            )}
          </View>
          <Text style={[styles.eventTitle, { color: chrome.text }]}>
            {event.event.title}
          </Text>
        </View>

        <View style={styles.panels}>

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
            key={user?.id ?? "signed-out"}
            user={user}
            event={event.event}
            initialAttendance={event.attendance!}
            initialPunishment={punishment}
            parentEvent={event.parentEvent ?? null}
            parentAttendance={event.parentAttendance ?? null}
          />
        ) : (
          <Panel style={styles.noRegistrationContainer}>
            <MaterialCommunityIcons name="information-outline" size={16} color={chrome.textMuted} />
            <Text style={[styles.noRegistrationText, { color: chrome.textMuted }]}>
              Dette arrangementet har ikke påmelding.
            </Text>
          </Panel>
        )}

        <View style={styles.links}>
          <EventRules />
          <RaisedButton
            flex
            icon="food-apple-outline"
            label="Allergier"
            accessibilityLabel="Oppdater kosthold og allergier"
            onPress={() =>
              user ? setEditingDiet(true) : Linking.openURL("https://online.ntnu.no/innstillinger/profil")
            }
          />
          {isRegistration && Boolean(event.attendance?.attendancePrice) && <PaymentExplanationDialog />}
        </View>
        </View>
        {user && (
          <EditProfileFieldModal
            field={editingDiet ? "dietaryRestrictions" : null}
            user={user}
            onClose={() => setEditingDiet(false)}
          />
        )}
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
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bookmarkButton: { left: undefined, right: 16 },
  tags: { flexDirection: "row", gap: 10 },
  titleArea: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14, gap: 4 },
  eventTitle: { fontSize: 24, lineHeight: 30, fontWeight: "700", letterSpacing: -0.2 },
  panels: { paddingHorizontal: 16, gap: 14 },
  links: { flexDirection: "row", gap: 8 },
  centerContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  errorTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginHorizontal: 32,
    marginBottom: 8,
  },
  noRegistrationContainer: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noRegistrationText: {
    flex: 1,
    fontSize: 14,
  },
});

export default EventDetails;
