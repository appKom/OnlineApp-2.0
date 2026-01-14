import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { EventAttendanceBundle } from "../../../types/event";
import {
  getAllEvents,
  getAllEventsByAttendingUserId,
} from "../../../utils/trpc";
import AnimatedButtonGroup from "../../../components/AnimatedButtonGroup";
import Authenticator from "utils/authenticator";
import { useTheme } from "utils/theme";

type TabType = "alle" | "mine";

const AllEvents: React.FC = () => {
  const [allEvents, setAllEvents] = useState<EventAttendanceBundle[]>([]);
  const [myEvents, setMyEvents] = useState<EventAttendanceBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const user = Authenticator.user;

  // Cache flags to track if data has been loaded
  const [allEventsLoaded, setAllEventsLoaded] = useState(false);
  const [myEventsLoaded, setMyEventsLoaded] = useState(false);

  // Pagination cursors
  const [allEventsCursor, setAllEventsCursor] = useState<string | undefined>();
  const [myEventsCursor, setMyEventsCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);

  const router = useRouter();
  const theme = useTheme();

  const currentTab: TabType = selectedIndex === 0 ? "alle" : "mine";
  const currentEvents = currentTab === "alle" ? allEvents : myEvents;

  // Function to fetch all events
  const fetchAllEvents = async () => {
    try {
      const data = await getAllEvents(20, allEventsCursor);
      const eventsArray = data?.items ?? [];
      
      // Save cursor for next page
      setAllEventsCursor(data?.nextCursor);

      if (!allEventsCursor) {
        // First load - filter and sort
        const now = new Date();
        const futureEvents = eventsArray.filter(bundle => {
          const eventEnd = new Date(bundle.event.end);
          return eventEnd > now;
        });
        const pastEvents = eventsArray.filter(bundle => {
          const eventEnd = new Date(bundle.event.end);
          return eventEnd < now;
        });
        setAllEvents([...futureEvents.reverse(), ...pastEvents]);
      } else {
        // Load more - append to existing, filter duplicates by event ID
        setAllEvents(prev => {
          const existingIds = new Set(prev.map(e => e.event.id));
          const newEvents = eventsArray.filter(bundle => !existingIds.has(bundle.event.id));
          return [...prev, ...newEvents];
        });
      }
      
      setAllEventsLoaded(true);
    } catch (error) {
      console.error("Failed to load all events:", error);
      throw error;
    }
  };

  // Function to fetch user's events
  const fetchMyEvents = async () => {
    try {
      const data = user ? await getAllEventsByAttendingUserId(user.id, 20, myEventsCursor) : null;
      const eventsArray = data?.items ?? [];
      
      // Save cursor for next page
      setMyEventsCursor(data?.nextCursor);

      if (!myEventsCursor) {
        // First load
        setMyEvents(eventsArray.reverse());
      } else {
        // Load more - append to existing, filter duplicates by event ID
        setMyEvents(prev => {
          const existingIds = new Set(prev.map(e => e.event.id));
          const newEvents = eventsArray.filter(bundle => !existingIds.has(bundle.event.id));
          return [...prev, ...newEvents.reverse()];
        });
      }
      
      setMyEventsLoaded(true);
    } catch (error) {
      console.error("Failed to load my events:", error);
      throw error;
    }
  };

  // Function to load data based on current tab
  const loadCurrentTabData = async (isRefresh = false) => {
    if (currentTab === "alle") {
      if (!allEventsLoaded || isRefresh) {
        await fetchAllEvents();
      }
    } else {
      if (!myEventsLoaded || isRefresh) {
        await fetchMyEvents();
      }
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        await loadCurrentTabData();
      } catch (error) {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Handle tab change coming from ButtonGroup (index number)
  const handleTabIndexChange = async (newIndex: number) => {
    setSelectedIndex(newIndex);

    const newTab: TabType = newIndex === 0 ? "alle" : "mine";

    // If the new tab's data hasn't been loaded, load it
    if (
      (newTab === "alle" && !allEventsLoaded) ||
      (newTab === "mine" && !myEventsLoaded)
    ) {
      setLoading(true);
      setError(null);

      try {
        if (newTab === "alle") {
          await fetchAllEvents();
        } else {
          await fetchMyEvents();
        }
      } catch (error) {
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    setAllEventsCursor(undefined);
    setMyEventsCursor(undefined);

    try {
      await loadCurrentTabData(true); // Force refresh
    } catch (error) {
      setError("Failed to refresh events");
    } finally {
      setRefreshing(false);
    }
  };

  // Handle loading more when scrolling to end
  const handleEndReached = async () => {
    if (currentTab === "alle") {
      if (loadingMore || !allEventsCursor) return;
    } else {
      if (loadingMore || !myEventsCursor) return;
    }
    
    setLoadingMore(true);
    try {
      if (currentTab === "alle") {
        await fetchAllEvents();
      } else {
        await fetchMyEvents();
      }
    } catch (error) {
      console.error("Failed to load more events:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // if (loading && !refreshing) {
  //   return (
  //     <View
  //       style={{
  //         flex: 1,
  //         justifyContent: "center",
  //         alignItems: "center",
  //         backgroundColor: colorScheme === "dark" ? "#000" : "#fff", // Match your app's background
  //       }}
  //     >
  //       <ActivityIndicator
  //         color={colorScheme === "dark" ? "#ffffff" : "#000000"}
  //       />
  //     </View>
  //   );
  // }

  // if (error && !refreshing) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
  //       <Text style={{ color: "red" }}>{error}</Text>
  //     </View>
  //   );
  // }

  const renderHeader = () => (
    <View
      style={{
        backgroundColor: theme.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <AnimatedButtonGroup
        buttons={["Alle", "Mine"]}
        selectedIndex={selectedIndex}
        onPress={handleTabIndexChange}
        containerStyle={{ 
          borderRadius: 13, 
          backgroundColor: theme.primaryContainer,
          padding: 3,
          overflow: 'hidden',
        }}
        buttonStyle={{ backgroundColor: 'transparent' }}
        selectedTextStyle={{ color: theme.onSecondaryFixed }}
        textStyle={{ color: theme.onPrimaryContainer }}
        highlightStyle={{ backgroundColor: theme.secondaryFixedDim, opacity: 1 }}
        highlightInset={6}
      />
    </View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      // Show loading in the list area
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <ActivityIndicator color={theme.onBackground} />
        </View>
      );
    }
    if (error && !refreshing) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center", minHeight: 200 }}
        >
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      );
    }
    // Normal list items
    return null; // No placeholder content needed, FlatList will render data
  };

  return (
    <View style={{ flex: 1 }}>
      {renderHeader()}
      <FlatList
        data={loading && !refreshing ? [] : currentEvents}
        keyExtractor={(bundle) => bundle.event.id}
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: theme.background }}
        ListHeaderComponent={null}
        ListEmptyComponent={renderContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator color={theme.onBackground} />
            </View>
          ) : null
        }
        renderItem={
          loading && !refreshing
            ? null // Don't render items during loading
            : ({ item, index }) => {
                const now = new Date();
                const isCurrentPast = new Date(item.event.start) <= now;
                const isPrevPast = index > 0 ? new Date(currentEvents[index - 1].event.start) <= now : false;
                
                return (
                  <>
                    {index === 0 && (
                      <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.surfaceContainerHigh }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: theme.onBackground }}>
                          Kommende arrangementer
                        </Text>
                      </View>
                    )}
                    {isCurrentPast && !isPrevPast && (
                      <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.surfaceContainerHigh }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: theme.onBackground }}>
                          Tidligere arrangementer
                        </Text>
                      </View>
                    )}
                    <Pressable
                        style={{ padding: 12, borderBottomWidth: 1, borderColor: theme.surfaceContainerHigh }}
                      onPress={() =>
                        router.push({
                          pathname: "/event-details",
                          params: { 
                            eventId: item.event.id,
                            headerTitle: item.event.title,
                          },
                        })
                      }
                    >
                      <Text style={{ color: theme.onBackground }}>{item.event.title ?? "NULL"}</Text>
                    </Pressable>
                  </>
                );
              }
        }
      />
    </View>
  );
};

export default AllEvents;
