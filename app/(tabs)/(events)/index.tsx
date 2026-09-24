import { MaterialCommunityIcons } from "@expo/vector-icons";
import { isPast, isWithinInterval } from "date-fns";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

import EventCard from "../../../components/EventCard";
import { ChoiceTrack, PanelDivider, usePanelChromeColors } from "../../../components/Panel";
import { SectionMenuHeader } from "../../../components/SectionMenuHeader";
import type { EventAttendanceBundle, EventType } from "../../../types/event";
import { removeBookmarks, toggleBookmarkWithUndo, useBookmarks } from "../../../utils/bookmarks";
import { syncEventReminders } from "../../../utils/reminders";
import { useTheme } from "../../../utils/theme";
import {
  getEndedEvents,
  getEventsByIds,
  getGroupsByMember,
  getMyEvents,
  getUpcomingEvents,
} from "../../../utils/trpc";
import { useCurrentUser } from "../../../utils/useCurrentUser";

const PAGE_SIZE = 20;
const MY_EVENTS_PAGE_SIZE = 50;

type Period = "upcoming" | "past";

const TYPE_OPTIONS: { value: EventType | null; label: string }[] = [
  { value: null, label: "Alle" },
  { value: "COMPANY", label: "Bedpres" },
  { value: "SOCIAL", label: "Sosialt" },
  { value: "ACADEMIC", label: "Kurs" },
  { value: "WELCOME", label: "Fadderuke" },
  { value: "GENERAL_ASSEMBLY", label: "Generalforsamling" },
  { value: "OTHER", label: "Annet" },
];
const INTERNAL_OPTION = { value: "INTERNAL" as const, label: "Intern" };

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "upcoming", label: "Kommende" },
  { value: "past", label: "Tidligere" },
];

type Paged = { items: EventAttendanceBundle[]; cursor?: string; done: boolean };
const emptyPage: Paged = { items: [], cursor: undefined, done: false };

type SectionMenu = { value: Period; onChange: (value: Period) => void; titles: Record<Period, string> };

type ListItem =
  | { kind: "header"; key: string; title: string; icon?: "bookmark-outline" | "circle"; menu?: SectionMenu }
  | { kind: "event"; key: string; bundle: EventAttendanceBundle; ongoing?: boolean; swipeable: boolean }
  | { kind: "message"; key: string; text: string }
  | { kind: "more"; key: string; loading: boolean; onPress: () => void };

const toPage = (result: { items?: EventAttendanceBundle[]; nextCursor?: string }, take: number): Paged => {
  const items = result.items ?? [];
  return { items, cursor: result.nextCursor, done: items.length < take || !result.nextCursor };
};

/** Committee members can see internal events (the API decides; this only controls the filter chip). */
function useIsCommitteeMember(userId: string | undefined) {
  const [isMember, setIsMember] = useState(false);
  useEffect(() => {
    setIsMember(false);
    if (!userId) return;
    let cancelled = false;
    getGroupsByMember(userId)
      .then((groups) => {
        if (!cancelled) setIsMember(groups.some((group) => group.type === "COMMITTEE" || group.type === "NODE_COMMITTEE"));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return isMember;
}

const AllEvents: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const chrome = usePanelChromeColors();
  const user = useCurrentUser();
  const isCommitteeMember = useIsCommitteeMember(user?.id);
  const { bookmarkIds, ready: bookmarksReady, isBookmarked } = useBookmarks();

  const [type, setType] = useState<EventType | null>(null);
  const [period, setPeriod] = useState<Period>("upcoming");
  const [myPeriod, setMyPeriod] = useState<Period>("upcoming");

  // All of the user's upcoming events regardless of type filter: drives "Pågår nå" and reminders.
  const [myUpcoming, setMyUpcoming] = useState<EventAttendanceBundle[] | null>(null);
  const [myPast, setMyPast] = useState<Paged>(emptyPage);
  const [loadingMyPast, setLoadingMyPast] = useState(false);
  const [bookmarked, setBookmarked] = useState<{ key: string; items: EventAttendanceBundle[] } | null>(null);
  const [events, setEvents] = useState<Paged>(emptyPage);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard against responses from a previous filter arriving after a newer one.
  const generation = useRef(0);
  const myPastGeneration = useRef(0);
  const loadingMoreRef = useRef(false);

  const typeOptions = isCommitteeMember ? [...TYPE_OPTIONS, INTERNAL_OPTION] : TYPE_OPTIONS;
  useEffect(() => {
    if (type === "INTERNAL" && !isCommitteeMember) setType(null);
  }, [isCommitteeMember, type]);

  const loadMyUpcoming = useCallback(async () => {
    if (!user) {
      setMyUpcoming([]);
      return;
    }
    try {
      const mine = await getMyEvents(user.id, null, false, undefined, MY_EVENTS_PAGE_SIZE);
      setMyUpcoming(mine.items ?? []);
    } catch (loadError) {
      console.error("Failed to load own events:", loadError);
    }
  }, [user]);

  const loadFirstPage = useCallback(async () => {
    const current = ++generation.current;
    setError(null);
    try {
      const result =
        period === "upcoming"
          ? await getUpcomingEvents(type, undefined, PAGE_SIZE)
          : await getEndedEvents(type, undefined, PAGE_SIZE);
      if (current !== generation.current) return;
      setEvents(toPage(result, PAGE_SIZE));
    } catch (loadError) {
      console.error("Failed to load events:", loadError);
      if (current === generation.current) setError("Kunne ikke laste arrangementer.");
    }
  }, [period, type]);

  const loadMyPast = useCallback(
    async (cursor?: string) => {
      if (!user) return;
      const current = cursor ? myPastGeneration.current : ++myPastGeneration.current;
      setLoadingMyPast(true);
      try {
        const result = await getMyEvents(user.id, type, true, cursor, PAGE_SIZE);
        if (current !== myPastGeneration.current) return;
        const page = toPage(result, PAGE_SIZE);
        setMyPast((prev) => (cursor ? { ...page, items: [...prev.items, ...page.items] } : page));
      } catch (loadError) {
        console.error("Failed to load own past events:", loadError);
      } finally {
        if (current === myPastGeneration.current) setLoadingMyPast(false);
      }
    },
    [type, user],
  );

  useEffect(() => {
    void loadMyUpcoming();
  }, [loadMyUpcoming]);

  useEffect(() => {
    setLoading(true);
    setEvents(emptyPage);
    void loadFirstPage().finally(() => setLoading(false));
  }, [loadFirstPage]);

  useEffect(() => {
    setMyPast(emptyPage);
    if (myPeriod === "past") void loadMyPast();
  }, [loadMyPast, myPeriod]);

  // Bookmarks are fetched on their own so toggling one doesn't reload the list.
  const bookmarkKey = bookmarkIds.join(",");
  useEffect(() => {
    let cancelled = false;
    getEventsByIds(bookmarkIds)
      .then((items) => {
        if (cancelled) return;
        setBookmarked({ key: bookmarkKey, items });
        const ended = items.filter((bundle) => isPast(new Date(bundle.event.end))).map((b) => b.event.id);
        removeBookmarks(ended);
      })
      .catch((bookmarkError) => console.error("Failed to load bookmarks:", bookmarkError));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarkKey]);

  // Keep scheduled reminders in line with what the user has signed up to or bookmarked,
  // including changes made on the website.
  const bookmarksCurrent = bookmarksReady && bookmarked?.key === bookmarkKey;
  useEffect(() => {
    if (!myUpcoming || !bookmarksCurrent || !bookmarked) return;
    void syncEventReminders([...myUpcoming, ...bookmarked.items], user, isBookmarked);
  }, [bookmarked, bookmarksCurrent, isBookmarked, myUpcoming, user]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || events.done) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    const current = generation.current;

    try {
      const result =
        period === "upcoming"
          ? await getUpcomingEvents(type, events.cursor, PAGE_SIZE)
          : await getEndedEvents(type, events.cursor, PAGE_SIZE);
      if (current !== generation.current) return;
      const page = toPage(result, PAGE_SIZE);
      setEvents((prev) => ({ ...page, items: [...prev.items, ...page.items] }));
    } catch (moreError) {
      console.error("Failed to load more events:", moreError);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [events, loading, period, type]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadFirstPage(),
      loadMyUpcoming(),
      myPeriod === "past" ? loadMyPast() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  const items = useMemo<ListItem[]>(() => {
    const now = new Date();
    const matchesType = (bundle: EventAttendanceBundle) => !type || bundle.event.type === type;
    const mineUpcoming = (myUpcoming ?? []).filter(matchesType);

    const ongoing = mineUpcoming.filter((bundle) =>
      isWithinInterval(now, { start: new Date(bundle.event.start), end: new Date(bundle.event.end) }),
    );
    const ongoingIds = new Set(ongoing.map((bundle) => bundle.event.id));
    const mine =
      myPeriod === "upcoming"
        ? mineUpcoming.filter((bundle) => !ongoingIds.has(bundle.event.id))
        : myPast.items;
    const mineIds = new Set((myUpcoming ?? []).map((bundle) => bundle.event.id));

    const bookmarks = (bookmarked?.items ?? []).filter(
      (bundle) =>
        isBookmarked(bundle.event.id) &&
        !mineIds.has(bundle.event.id) &&
        !isPast(new Date(bundle.event.end)) &&
        matchesType(bundle),
    );

    // Each event shows once: in the most specific section it belongs to.
    const shownIds = new Set([
      ...ongoingIds,
      ...mine.map((bundle) => bundle.event.id),
      ...bookmarks.map((bundle) => bundle.event.id),
    ]);
    const rest = events.items.filter((bundle) => !shownIds.has(bundle.event.id));

    const list: ListItem[] = [];
    const header = (key: string, title: string, extra: Partial<Extract<ListItem, { kind: "header" }>> = {}) =>
      list.push({ kind: "header", key: `header-${key}`, title, ...extra });
    const rows = (key: string, bundles: EventAttendanceBundle[], extra: { ongoing?: boolean; swipeable?: boolean } = {}) =>
      bundles.forEach((bundle) =>
        list.push({
          kind: "event",
          key: `${key}-${bundle.event.id}`,
          bundle,
          ongoing: extra.ongoing,
          swipeable: extra.swipeable ?? true,
        }),
      );

    if (ongoing.length > 0) {
      header("ongoing", "Pågår nå", { icon: "circle" });
      rows("ongoing", ongoing, { ongoing: true });
    }

    if (user) {
      header("mine", "Mine", {
        menu: {
          value: myPeriod,
          onChange: setMyPeriod,
          titles: { upcoming: "Mine kommende", past: "Mine tidligere" },
        },
      });
      rows("mine", mine, { swipeable: myPeriod === "upcoming" });
      const mineLoading = myPeriod === "upcoming" ? myUpcoming === null : loadingMyPast && mine.length === 0;
      if (mine.length === 0 && !mineLoading) {
        list.push({
          kind: "message",
          key: "mine-empty",
          text: myPeriod === "upcoming" ? "Du er ikke påmeldt noen kommende arrangementer." : "Ingen tidligere arrangementer.",
        });
      }
      if (myPeriod === "past" && (loadingMyPast || !myPast.done)) {
        list.push({
          kind: "more",
          key: "mine-more",
          loading: loadingMyPast,
          onPress: () => void loadMyPast(myPast.cursor),
        });
      }
    }

    if (bookmarks.length > 0) {
      header("bookmarks", "Bokmerker", { icon: "bookmark-outline" });
      rows("bookmarks", bookmarks);
    }

    header("events", "Arrangementer", {
      menu: { value: period, onChange: setPeriod, titles: { upcoming: "Kommende", past: "Tidligere" } },
    });
    rows("events", rest, { swipeable: period === "upcoming" });
    if (rest.length === 0 && !loading) {
      list.push({ kind: "message", key: "events-empty", text: error ?? "Ingen arrangementer." });
    }

    return list;
  }, [
    bookmarked,
    error,
    events.items,
    isBookmarked,
    loadMyPast,
    loading,
    loadingMyPast,
    myPast,
    myPeriod,
    myUpcoming,
    period,
    type,
    user,
  ]);

  const openEvent = (eventId: string) =>
    router.push({ pathname: "/event-details", params: { eventId } });

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === "header") {
      return (
        <View style={{ backgroundColor: theme.background }}>
          <View style={styles.sectionHeader}>
            {item.icon === "circle" && <View style={[styles.liveDot, { backgroundColor: chrome.success }]} />}
            {item.icon === "bookmark-outline" && (
              <MaterialCommunityIcons name="bookmark-outline" size={14} color={chrome.textMuted} />
            )}
            {item.menu ? (
              <SectionMenuHeader
                title={item.menu.titles[item.menu.value]}
                options={PERIOD_OPTIONS}
                value={item.menu.value}
                onChange={item.menu.onChange}
              />
            ) : (
              <Text style={[styles.sectionTitle, { color: chrome.textMuted }]}>{item.title}</Text>
            )}
          </View>
          <PanelDivider onBackground />
        </View>
      );
    }

    if (item.kind === "message") {
      return <Text style={[styles.message, { color: chrome.textMuted }]}>{item.text}</Text>;
    }

    if (item.kind === "more") {
      return (
        <View>
          <Pressable
            accessibilityRole="button"
            disabled={item.loading}
            onPress={item.onPress}
            style={({ pressed }) => [styles.moreRow, pressed && { backgroundColor: theme.surfaceContainerLow }]}
          >
            {item.loading ? (
              <ActivityIndicator color={chrome.textMuted} />
            ) : (
              <Text style={[styles.moreText, { color: chrome.accent }]}>Vis flere</Text>
            )}
          </Pressable>
          <PanelDivider onBackground />
        </View>
      );
    }

    const card = (
      <EventCard
        event={item.bundle}
        user={user}
        ongoing={item.ongoing}
        onPress={() => openEvent(item.bundle.event.id)}
      />
    );

    return item.swipeable ? (
      <BookmarkSwipe bookmarked={isBookmarked(item.bundle.event.id)} onToggle={() => toggleBookmarkWithUndo(item.bundle)}>
        {card}
      </BookmarkSwipe>
    ) : (
      card
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeScroll}
        contentContainerStyle={styles.typeScrollContent}
      >
        <ChoiceTrack options={typeOptions} value={type} onChange={setType} style={styles.typeTrack} />
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          <View style={styles.footer}>
            {(loadingMore || (loading && !refreshing)) && <ActivityIndicator color={chrome.textMuted} />}
          </View>
        }
      />
    </View>
  );
};

const BOOKMARK_ADD = "#1F8A4C";
const BOOKMARK_REMOVE = "#C9343C";

function BookmarkSwipe({
  bookmarked,
  onToggle,
  children,
}: {
  bookmarked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const swipeable = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={1.6}
      rightThreshold={56}
      overshootRight={false}
      onSwipeableWillOpen={() => {
        onToggle();
        swipeable.current?.close();
      }}
      renderRightActions={() => (
        <View style={[styles.swipeAction, { backgroundColor: bookmarked ? BOOKMARK_REMOVE : BOOKMARK_ADD }]}>
          <MaterialCommunityIcons
            name={bookmarked ? "bookmark-remove-outline" : "bookmark-plus-outline"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.swipeLabel}>{bookmarked ? "Fjern" : "Bokmerk"}</Text>
        </View>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  typeScroll: { flexGrow: 0 },
  typeScrollContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 },
  typeTrack: { flexWrap: "nowrap" },
  sectionHeader: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  message: { paddingHorizontal: 16, paddingVertical: 20, fontSize: 14, textAlign: "center" },
  moreRow: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  moreText: { fontSize: 14, fontWeight: "700" },
  footer: { height: 104, alignItems: "center", paddingTop: 16 },
  swipeAction: {
    width: 96,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  swipeLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
});

export default AllEvents;
