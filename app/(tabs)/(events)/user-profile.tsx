import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EventCard from "../../../components/EventCard";
import { PanelDivider, RaisedButton } from "../../../components/Panel";
import { ProfileHero, formatAccountAge } from "../../../components/Profile/ProfileHero";
import {
  ProfileDivider,
  ProfileSurface,
  QuickFact,
  SectionLabel,
  useProfileChromeColors,
} from "../../../components/Profile/ProfileSurface";
import type { EventSummaryBundle } from "../../../types/event";
import type { UserGroup } from "../../../types/group";
import type { User } from "../../../types/user";
import { useTheme } from "../../../utils/theme";
import { getEventSummariesByAttendingUserId, getGroupsByMember, getUserById } from "../../../utils/trpc";
import { useCurrentUser } from "../../../utils/useCurrentUser";
import { findActiveMembership } from "../../../utils/user-utils";

const PAST_PAGE_SIZE = 10;

type Paged = { items: EventSummaryBundle[]; cursor?: string; done: boolean };

/**
 * Only what the website shows on someone else's profile. The API hands back the whole user
 * (email, phone, allergies), so anything not listed here must never be rendered.
 */
type PublicProfile = Pick<User, "id" | "name" | "username" | "imageUrl" | "biography" | "createdAt" | "memberships">;

const toPublicProfile = ({ id, name, username, imageUrl, biography, createdAt, memberships }: User): PublicProfile => ({
  id,
  name,
  username,
  imageUrl,
  biography,
  createdAt,
  memberships,
});

const toPaged = (result: { items?: EventSummaryBundle[]; nextCursor?: string }, take: number): Paged => {
  const items = result.items ?? [];
  return { items, cursor: result.nextCursor, done: items.length < take || !result.nextCursor };
};

const groupName = (group: UserGroup) =>
  group.preferredDisplayName === "NAME" && group.name ? group.name : group.abbreviation;

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const chrome = useProfileChromeColors();
  const me = useCurrentUser();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [groups, setGroups] = useState<UserGroup[] | null>(null);
  const [upcoming, setUpcoming] = useState<EventSummaryBundle[] | null>(null);
  const [past, setPast] = useState<Paged | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // The profile itself is required; the lists degrade to empty on their own.
      const [user, groupsResult, upcomingResult, pastResult] = await Promise.all([
        getUserById(userId),
        getGroupsByMember(userId).catch(() => []),
        getEventSummariesByAttendingUserId(userId, false, undefined, 20).catch(() => ({ items: [] })),
        getEventSummariesByAttendingUserId(userId, true, undefined, PAST_PAGE_SIZE).catch(() => ({ items: [] })),
      ]);
      setProfile(toPublicProfile(user));
      setGroups(groupsResult);
      setUpcoming(upcomingResult.items ?? []);
      setPast(toPaged(pastResult, PAST_PAGE_SIZE));
    } catch (loadError) {
      console.warn("Could not load user profile:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Noe gikk galt.");
    }
  }, [userId]);

  useEffect(() => {
    if (me) void load();
  }, [load, me]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const loadMorePast = async () => {
    if (!past || past.done || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getEventSummariesByAttendingUserId(userId, true, past.cursor, PAST_PAGE_SIZE);
      const page = toPaged(result, PAST_PAGE_SIZE);
      setPast((prev) => (prev ? { ...page, items: [...prev.items, ...page.items] } : page));
    } catch (moreError) {
      console.warn("Could not load more events:", moreError);
    } finally {
      setLoadingMore(false);
    }
  };

  const activeMembership = useMemo(
    () => (profile ? findActiveMembership(profile as User) : null),
    [profile],
  );

  const openEvent = (eventId: string) => router.push({ pathname: "/event-details", params: { eventId } });

  const backButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tilbake"
      onPress={() => router.back()}
      style={[
        styles.backButton,
        { backgroundColor: chrome.raised, borderColor: chrome.edge, borderTopColor: chrome.highlight },
      ]}
    >
      <MaterialCommunityIcons name="arrow-left" size={20} color={chrome.icon} />
    </Pressable>
  );

  const topBar = (
    <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: theme.background }]}>
      {backButton}
    </View>
  );

  if (!me) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        {topBar}
        <CenteredMessage icon="account-lock-outline" title="Logg inn for å se profiler" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        {topBar}
        {error ? (
          <CenteredMessage icon="cloud-alert-outline" title="Kunne ikke laste profilen" text={error}>
            <RaisedButton icon="refresh" label="Prøv igjen" onPress={() => void load()} />
          </CenteredMessage>
        ) : (
          <View style={styles.centered}>
            <ActivityIndicator color={chrome.textMuted} />
          </View>
        )}
      </View>
    );
  }

  const pastCount = past ? `${past.items.length}${past.done ? "" : "+"}` : "…";

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {topBar}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={chrome.textMuted} />
        }
      >
        <View style={styles.padded}>
          <ProfileSurface>
            <ProfileHero user={profile} activeMembership={activeMembership} />
            <ProfileDivider />
            <View style={styles.quickFacts}>
              <QuickFact
                icon="account-group-outline"
                value={groups ? String(groups.length) : "…"}
                label="Grupper"
              />
              <View style={[styles.quickFactSeparator, { backgroundColor: chrome.edge }]} />
              <QuickFact icon="calendar-check-outline" value={pastCount} label="Arrangementer" />
              <View style={[styles.quickFactSeparator, { backgroundColor: chrome.edge }]} />
              <QuickFact icon="clock-outline" value={formatAccountAge(profile.createdAt)} label="I Online" />
            </View>
          </ProfileSurface>

          {profile.biography ? (
            <View>
              <SectionLabel>Om {profile.name?.split(" ")[0] ?? profile.username}</SectionLabel>
              <ProfileSurface style={styles.bioCard}>
                <Text selectable style={[styles.bioText, { color: theme.onSurface }]}>
                  {profile.biography}
                </Text>
              </ProfileSurface>
            </View>
          ) : null}

          {groups && groups.length > 0 && (
            <View>
              <SectionLabel>Grupper</SectionLabel>
              <ProfileSurface>
                {groups.map((group, index) => (
                  <View
                    key={group.slug}
                    style={[
                      styles.groupRow,
                      index < groups.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: chrome.edge,
                      },
                    ]}
                  >
                    {group.imageUrl ? (
                      <Image
                        source={{ uri: group.imageUrl }}
                        style={[styles.groupImage, { borderColor: chrome.edge, backgroundColor: chrome.recessed }]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.groupImage,
                          styles.groupFallback,
                          { borderColor: chrome.edge, backgroundColor: chrome.recessed },
                        ]}
                      >
                        <MaterialCommunityIcons name="account-group-outline" size={16} color={chrome.icon} />
                      </View>
                    )}
                    <Text numberOfLines={1} style={[styles.groupName, { color: theme.onSurface }]}>
                      {groupName(group)}
                    </Text>
                  </View>
                ))}
              </ProfileSurface>
            </View>
          )}
        </View>

        {upcoming && upcoming.length > 0 && (
          <EventSection title="Kommende arrangementer">
            {upcoming.map((bundle) => (
              <EventCard
                key={bundle.event.id}
                event={bundle}
                user={null}
                onPress={() => openEvent(bundle.event.id)}
              />
            ))}
          </EventSection>
        )}

        <EventSection title="Tidligere arrangementer">
          {past && past.items.length === 0 && (
            <Text style={[styles.empty, { color: chrome.textMuted }]}>Ingen tidligere arrangementer.</Text>
          )}
          {past?.items.map((bundle) => (
            <EventCard
              key={bundle.event.id}
              event={bundle}
              user={null}
              onPress={() => openEvent(bundle.event.id)}
            />
          ))}
          {past && !past.done && (
            <View>
              <Pressable
                accessibilityRole="button"
                disabled={loadingMore}
                onPress={() => void loadMorePast()}
                style={({ pressed }) => [styles.moreRow, pressed && { backgroundColor: theme.surfaceContainerLow }]}
              >
                {loadingMore ? (
                  <ActivityIndicator color={chrome.textMuted} />
                ) : (
                  <Text style={[styles.moreText, { color: chrome.accent }]}>Vis flere</Text>
                )}
              </Pressable>
              <PanelDivider onBackground />
            </View>
          )}
        </EventSection>

        {/* Room for the floating tab bar. */}
        <View style={{ height: 104 }} />
      </ScrollView>
    </View>
  );
}

/** Same section header as the events list: rows sit on the page background. */
function EventSection({ title, children }: { title: string; children: React.ReactNode }) {
  const chrome = useProfileChromeColors();
  return (
    <View style={styles.eventSection}>
      <Text style={[styles.sectionTitle, { color: chrome.textMuted }]}>{title}</Text>
      <PanelDivider onBackground />
      {children}
    </View>
  );
}

function CenteredMessage({
  icon,
  title,
  text,
  children,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  text?: string;
  children?: React.ReactNode;
}) {
  const chrome = useProfileChromeColors();
  return (
    <View style={styles.centered}>
      <MaterialCommunityIcons name={icon} size={36} color={chrome.textMuted} />
      <Text style={[styles.messageTitle, { color: chrome.text }]}>{title}</Text>
      {text ? <Text style={[styles.messageText, { color: chrome.textMuted }]}>{text}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingBottom: 8 },
  backButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingTop: 4, gap: 16 },
  padded: { paddingHorizontal: 16, gap: 16 },
  quickFacts: { minHeight: 92, paddingHorizontal: 5, flexDirection: "row", alignItems: "center" },
  quickFactSeparator: { width: 1, height: 54 },
  bioCard: { padding: 15 },
  bioText: { fontSize: 14, lineHeight: 21 },
  groupRow: { minHeight: 52, marginHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  groupImage: { width: 30, height: 30, borderRadius: 8, borderWidth: 1 },
  groupFallback: { alignItems: "center", justifyContent: "center" },
  groupName: { flex: 1, fontSize: 14, fontWeight: "600" },
  eventSection: { marginTop: 4 },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 7,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  empty: { paddingHorizontal: 16, paddingVertical: 20, fontSize: 14, textAlign: "center" },
  moreRow: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  moreText: { fontSize: 14, fontWeight: "700" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 32 },
  messageTitle: { marginTop: 4, fontSize: 17, fontWeight: "700", textAlign: "center" },
  messageText: { fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 8 },
});

export { DetailErrorBoundary as ErrorBoundary } from "../../../components/ScreenErrorBoundary";
