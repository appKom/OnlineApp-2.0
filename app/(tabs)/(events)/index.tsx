import { MaterialCommunityIcons } from "@expo/vector-icons";
import { isPast, isWithinInterval } from "date-fns";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

import { AnimatedModal } from "../../../components/AnimatedModal";
import EventCard from "../../../components/EventCard";
import {
  ChoiceTrack,
  Panel,
  PanelDivider,
  PanelHeader,
  RaisedButton,
  usePanelChromeColors,
} from "../../../components/Panel";
import type { EventAttendanceBundle, EventType } from "../../../types/event";
import type { User } from "../../../types/user";
import Authenticator from "../../../utils/authenticator";
import { removeBookmarks, useBookmarks } from "../../../utils/bookmarks";
import { useTheme } from "../../../utils/theme";
import {
  getEndedEvents,
  getEventsByIds,
  getMyEvents,
  getUpcomingEvents,
} from "../../../utils/trpc";

const PAGE_SIZE = 20;
const MY_EVENTS_PAGE_SIZE = 50;

const TYPE_OPTIONS: { value: EventType | null; label: string }[] = [
  { value: null, label: "Alle" },
  { value: "COMPANY", label: "Bedpres" },
  { value: "SOCIAL", label: "Sosialt" },
  { value: "ACADEMIC", label: "Kurs" },
  { value: "WELCOME", label: "Fadderuke" },
  { value: "GENERAL_ASSEMBLY", label: "Generalforsamling" },
  { value: "OTHER", label: "Annet" },
];

type Paged = { items: EventAttendanceBundle[]; cursor?: string; done: boolean };
const emptyPage: Paged = { items: [], cursor: undefined, done: false };

type ListItem =
  | { kind: "header"; key: string; title: string; icon?: "bookmark-outline" | "circle" }
  | { kind: "event"; key: string; bundle: EventAttendanceBundle; ongoing?: boolean; swipeable: boolean }
  | { kind: "message"; key: string; text: string };

function useCurrentUser() {
  const [user, setUser] = useState<User | null>(Authenticator.user);
  useEffect(
    () => Authenticator.addLoginStateListener(() => setUser(Authenticator.user)),
    [],
  );
  return user;
}

const toPage = (result: { items?: EventAttendanceBundle[]; nextCursor?: string }, take: number): Paged => {
  const items = result.items ?? [];
  return { items, cursor: result.nextCursor, done: items.length < take || !result.nextCursor };
};

const AllEvents: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const chrome = usePanelChromeColors();
  const user = useCurrentUser();
  const { bookmarkIds, isBookmarked, toggleBookmark } = useBookmarks();

  const [type, setType] = useState<EventType | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [myUpcoming, setMyUpcoming] = useState<EventAttendanceBundle[]>([]);
  const [bookmarked, setBookmarked] = useState<EventAttendanceBundle[]>([]);
  const [upcoming, setUpcoming] = useState<Paged>(emptyPage);
  const [past, setPast] = useState<Paged>(emptyPage);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against responses from a previous filter arriving after a newer one.
  const generation = useRef(0);
  const loadingMoreRef = useRef(false);

  const loadFirstPage = useCallback(async () => {
    const current = ++generation.current;
    setError(null);
    setPast(emptyPage);

    try {
      const [mine, firstUpcoming] = await Promise.all([
        user ? getMyEvents(user.id, type, false, undefined, MY_EVENTS_PAGE_SIZE)
          : Promise.resolve({ items: [] as EventAttendanceBundle[] }),
        onlyMine ? Promise.resolve(null) : getUpcomingEvents(type, undefined, PAGE_SIZE),
      ]);
      if (current !== generation.current) return;

      setMyUpcoming(mine.items ?? []);
      setUpcoming(firstUpcoming ? toPage(firstUpcoming, PAGE_SIZE) : { items: [], done: true });
    } catch (loadError) {
      console.error("Failed to load events:", loadError);
      if (current === generation.current) setError("Kunne ikke laste arrangementer.");
    }
  }, [onlyMine, type, user]);

  useEffect(() => {
    setLoading(true);
    void loadFirstPage().finally(() => setLoading(false));
  }, [loadFirstPage]);

  // Bookmarks are fetched on their own so toggling one doesn't reload the list.
  const bookmarkKey = bookmarkIds.join(",");
  useEffect(() => {
    let cancelled = false;
    getEventsByIds(bookmarkIds)
      .then((items) => {
        if (cancelled) return;
        setBookmarked(items);
        const ended = items.filter((bundle) => isPast(new Date(bundle.event.end))).map((b) => b.event.id);
        removeBookmarks(ended);
      })
      .catch((bookmarkError) => console.error("Failed to load bookmarks:", bookmarkError));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarkKey]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current) return;

    const upcomingPending = !onlyMine && !upcoming.done;
    const pastPending = showPast && !past.done;
    if (!upcomingPending && !pastPending) return;
    if (!upcomingPending && onlyMine && !user) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    const current = generation.current;

    try {
      if (upcomingPending) {
        const result = await getUpcomingEvents(type, upcoming.cursor, PAGE_SIZE);
        if (current !== generation.current) return;
        const page = toPage(result, PAGE_SIZE);
        setUpcoming((prev) => ({ ...page, items: [...prev.items, ...page.items] }));
      } else {
        const result = onlyMine
          ? await getMyEvents(user!.id, type, true, past.cursor, PAGE_SIZE)
          : await getEndedEvents(type, past.cursor, PAGE_SIZE);
        if (current !== generation.current) return;
        const page = toPage(result, PAGE_SIZE);
        setPast((prev) => ({ ...page, items: [...prev.items, ...page.items] }));
      }
    } catch (moreError) {
      console.error("Failed to load more events:", moreError);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, onlyMine, past, showPast, type, upcoming, user]);

  // Past events come after all upcoming ones; start loading them once upcoming is exhausted.
  useEffect(() => {
    if (showPast && !loading && (onlyMine || upcoming.done) && past.items.length === 0 && !past.done) {
      void loadMore();
    }
  }, [loadMore, loading, onlyMine, past.done, past.items.length, showPast, upcoming.done]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  };

  const items = useMemo<ListItem[]>(() => {
    const now = new Date();
    const matchesType = (bundle: EventAttendanceBundle) => !type || bundle.event.type === type;

    const ongoing = myUpcoming.filter((bundle) =>
      isWithinInterval(now, { start: new Date(bundle.event.start), end: new Date(bundle.event.end) }),
    );
    const ongoingIds = new Set(ongoing.map((bundle) => bundle.event.id));
    const registered = myUpcoming.filter((bundle) => !ongoingIds.has(bundle.event.id));
    const mineIds = new Set(myUpcoming.map((bundle) => bundle.event.id));

    const bookmarks = onlyMine
      ? []
      : bookmarked.filter(
          (bundle) =>
            isBookmarked(bundle.event.id) &&
            !mineIds.has(bundle.event.id) &&
            !isPast(new Date(bundle.event.end)) &&
            matchesType(bundle),
        );
    const shownIds = new Set([...mineIds, ...bookmarks.map((bundle) => bundle.event.id)]);
    const rest = upcoming.items.filter((bundle) => !shownIds.has(bundle.event.id));

    const list: ListItem[] = [];
    const addSection = (
      key: string,
      title: string,
      bundles: EventAttendanceBundle[],
      options: { ongoing?: boolean; swipeable?: boolean; icon?: "bookmark-outline" | "circle" } = {},
    ) => {
      if (bundles.length === 0) return;
      list.push({ kind: "header", key: `header-${key}`, title, icon: options.icon });
      bundles.forEach((bundle) =>
        list.push({
          kind: "event",
          key: `${key}-${bundle.event.id}`,
          bundle,
          ongoing: options.ongoing,
          swipeable: options.swipeable ?? true,
        }),
      );
    };

    addSection("ongoing", "Pågår nå", ongoing, { ongoing: true, icon: "circle" });
    addSection("registered", "Påmeldt", registered);
    addSection("bookmarks", "Bokmerker", bookmarks, { icon: "bookmark-outline" });
    addSection("upcoming", "Kommende", rest);
    if (showPast) addSection("past", "Tidligere", past.items, { swipeable: false });

    if (onlyMine && !user) {
      list.push({ kind: "message", key: "login", text: "Logg inn for å se arrangementene dine." });
    } else if (list.length === 0 && !loading) {
      list.push({
        kind: "message",
        key: "empty",
        text: onlyMine ? "Du er ikke påmeldt noen kommende arrangementer." : "Ingen arrangementer.",
      });
    }

    return list;
  }, [bookmarked, isBookmarked, loading, myUpcoming, onlyMine, past.items, showPast, type, upcoming.items, user]);

  const openEvent = (eventId: string) =>
    router.push({ pathname: "/event-details", params: { eventId } });

  const activeFilterCount = Number(showPast) + Number(onlyMine);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === "header") {
      return (
        <View style={{ backgroundColor: theme.background }}>
          <View style={styles.sectionHeader}>
            {item.icon === "circle" && <View style={[styles.liveDot, { backgroundColor: chrome.success }]} />}
            {item.icon === "bookmark-outline" && (
              <MaterialCommunityIcons name="bookmark-outline" size={14} color={chrome.textMuted} />
            )}
            <Text style={[styles.sectionTitle, { color: chrome.textMuted }]}>{item.title}</Text>
          </View>
          <PanelDivider onBackground />
        </View>
      );
    }

    if (item.kind === "message") {
      return <Text style={[styles.message, { color: chrome.textMuted }]}>{item.text}</Text>;
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
      <BookmarkSwipe
        bookmarked={isBookmarked(item.bundle.event.id)}
        onToggle={() => toggleBookmark(item.bundle.event.id)}
      >
        {card}
      </BookmarkSwipe>
    ) : (
      card
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.controls}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeScroll}
          contentContainerStyle={styles.typeScrollContent}
        >
          <ChoiceTrack options={TYPE_OPTIONS} value={type} onChange={setType} style={styles.typeTrack} />
        </ScrollView>
        <RaisedButton
          icon="tune-variant"
          tone={activeFilterCount > 0 ? "accent" : "default"}
          accessibilityLabel={`Filtre${activeFilterCount > 0 ? `, ${activeFilterCount} aktive` : ""}`}
          onPress={() => setFiltersOpen(true)}
        />
      </View>

      <FlatList
        data={loading && !refreshing ? [] : items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.centered}>
            {error ? (
              <Text style={{ color: chrome.danger }}>{error}</Text>
            ) : (
              <ActivityIndicator color={chrome.textMuted} />
            )}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>{loadingMore && <ActivityIndicator color={chrome.textMuted} />}</View>
        }
      />

      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        showPast={showPast}
        onShowPastChange={setShowPast}
        onlyMine={onlyMine}
        onOnlyMineChange={setOnlyMine}
      />
    </View>
  );
};

function BookmarkSwipe({
  bookmarked,
  onToggle,
  children,
}: {
  bookmarked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const chrome = usePanelChromeColors();
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
        <View style={[styles.swipeAction, { backgroundColor: chrome.surface }]}>
          <MaterialCommunityIcons
            name={bookmarked ? "bookmark-remove-outline" : "bookmark-plus-outline"}
            size={20}
            color={chrome.accent}
          />
          <Text style={[styles.swipeLabel, { color: chrome.accent }]}>
            {bookmarked ? "Fjern" : "Bokmerk"}
          </Text>
        </View>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

function FilterSheet({
  visible,
  onClose,
  showPast,
  onShowPastChange,
  onlyMine,
  onOnlyMineChange,
}: {
  visible: boolean;
  onClose: () => void;
  showPast: boolean;
  onShowPastChange: (value: boolean) => void;
  onlyMine: boolean;
  onOnlyMineChange: (value: boolean) => void;
}) {
  const chrome = usePanelChromeColors();

  const row = (label: string, description: string, value: boolean, onChange: (value: boolean) => void) => (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.switchRow}
    >
      <View style={styles.switchCopy}>
        <Text style={[styles.switchLabel, { color: chrome.text }]}>{label}</Text>
        <Text style={[styles.switchDescription, { color: chrome.textMuted }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: chrome.accent, false: chrome.recessed }}
        ios_backgroundColor={chrome.recessed}
      />
    </Pressable>
  );

  return (
    <AnimatedModal visible={visible} onClose={onClose} modalWidth="92%" modalMaxWidth={380}>
      {(closeModal) => (
        <Panel style={styles.sheet}>
          <PanelHeader title="Filtre" />
          <View>
            {row("Kun mine", "Arrangementer du er påmeldt eller står på venteliste til", onlyMine, onOnlyMineChange)}
            <View style={[styles.sheetRule, { backgroundColor: chrome.edge }]} />
            {row("Vis tidligere", "Legg til arrangementer som er ferdige nederst", showPast, onShowPastChange)}
          </View>
          <RaisedButton icon="check" label="Ferdig" tone="accent" onPress={closeModal} />
        </Panel>
      )}
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  controls: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeScroll: { flex: 1 },
  typeScrollContent: { flexGrow: 1 },
  typeTrack: { flexWrap: "nowrap" },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 9,
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
  message: { paddingHorizontal: 16, paddingVertical: 24, fontSize: 14, textAlign: "center" },
  centered: { minHeight: 200, alignItems: "center", justifyContent: "center" },
  footer: { height: 104, alignItems: "center", paddingTop: 16 },
  swipeAction: {
    width: 96,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  swipeLabel: { fontSize: 12, fontWeight: "600" },
  sheet: { padding: 15, gap: 12 },
  switchRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12 },
  switchCopy: { flex: 1 },
  switchLabel: { fontSize: 14, fontWeight: "700" },
  switchDescription: { marginTop: 2, fontSize: 12, lineHeight: 16 },
  sheetRule: { height: StyleSheet.hairlineWidth },
});

export default AllEvents;
