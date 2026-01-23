import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  getAllPastEvents,
  getAllFutureEvents,
  getAllPastEventsByAttendingUserId,
  getAllFutureEventsByAttendingUserId,
} from "../../../utils/trpc";
import AnimatedButtonGroup from "../../../components/AnimatedButtonGroup";
import EventCard from "../../../components/EventCard";
import Authenticator from "utils/authenticator";
import { useTheme } from "utils/theme";
import { TabScreenContainer } from "../../../components/TabScreenContainer";

type TabType = "alle" | "mine";

const AllEvents: React.FC = () => {
  const [futureEvents, setFutureEvents] = useState<EventAttendanceBundle[]>([]);
  const [pastEvents, setPastEvents] = useState<EventAttendanceBundle[]>([]);
  const [myEvents, setMyEvents] = useState<EventAttendanceBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const user = Authenticator.user;

  // Cache flags to track if data has been loaded
  const [allEventsLoaded, setAllEventsLoaded] = useState(false);
  const [myEventsLoaded, setMyEventsLoaded] = useState(false);

  // Pagination cursors - using refs for immediate mutability
  const futureCursorRef = useRef<string | undefined>(undefined);
  const pastCursorRef = useRef<string | undefined>(undefined);
  const myEventsCursorRef = useRef<string | undefined>(undefined);
  
  // Fetch locks to prevent parallel calls
  const allEventsFetchingRef = useRef(false);
  const myEventsFetchingRef = useRef(false);
  
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Track if we've exhausted future events
  const [futureDone, setFutureDone] = useState(false);

  // Track if we've exhausted future my events
  const [myEventsFutureDone, setMyEventsFutureDone] = useState(false);

  // Track if initial load is complete
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const router = useRouter();
  const theme = useTheme();

  const currentTab: TabType = selectedIndex === 0 ? "alle" : "mine";
  const allEvents = [...futureEvents, ...pastEvents];
  const currentEvents = currentTab === "alle" ? allEvents : myEvents;

  // Function to fetch all events
  const fetchAllEvents = async () => {
    // Prevent parallel calls
    if (allEventsFetchingRef.current) return;
    allEventsFetchingRef.current = true;

    console.log("🎣 fetchAllEvents called from:", new Error().stack?.split('\n')[2]);
    try {
      if (!futureDone) {
        // Fetch future events
        const data = await getAllFutureEvents(10, futureCursorRef.current);
        const events = data?.items ?? [];

        console.log("📥 Fetched future events:", events.length, events.map(e => e.event.id));
        
        setFutureEvents((prev) => [...prev, ...events]);
        futureCursorRef.current = data?.nextCursor;
        
        // If no cursor, we're done with future events
        if (!data?.nextCursor) {
          setFutureDone(true);
        }
      } else {
        // Fetch past events
        const data = await getAllPastEvents(10, pastCursorRef.current);
        const events = data?.items ?? [];
        
        setPastEvents((prev) => [...prev, ...events]);
        pastCursorRef.current = data?.nextCursor;
      }

      setAllEventsLoaded(true);
    } catch (error) {
      console.error("Failed to load all events:", error);
      throw error;
    } finally {
      allEventsFetchingRef.current = false;
    }
  };

  // Function to fetch user's events
  const fetchMyEvents = async () => {
    // Prevent parallel calls
    if (myEventsFetchingRef.current) return;
    myEventsFetchingRef.current = true;

    console.log("🎣 fetchMyEvents called from:", new Error().stack?.split('\n')[2]);
    try {
      if (!user) return;

      if (!myEventsFutureDone) {
        // Fetch future events for user
        const data = await getAllFutureEventsByAttendingUserId(user.id, 10, myEventsCursorRef.current);
        const events = data?.items ?? [];

        console.log("📥 Fetched future my events:", events.length, events.map(e => e.event.id));
        
        setMyEvents((prev) => [...prev, ...events]);
        myEventsCursorRef.current = data?.nextCursor;
        
        // If no cursor, we're done with future my events
        if (!data?.nextCursor) {
          setMyEventsFutureDone(true);
        }
      } else {
        // Fetch past events for user
        const data = await getAllPastEventsByAttendingUserId(user.id, 10, myEventsCursorRef.current);
        const events = data?.items ?? [];
        
        console.log("📥 Fetched past my events:", events.length, events.map(e => e.event.id));
        
        setMyEvents((prev) => [...prev, ...events]);
        myEventsCursorRef.current = data?.nextCursor;
      }

      setMyEventsLoaded(true);
    } catch (error) {
      console.error("Failed to load my events:", error);
      throw error;
    } finally {
      myEventsFetchingRef.current = false;
    }
  };

  // Function to load data based on current tab
  const loadCurrentTabData = async (isRefresh = false) => {
    console.log("📍 loadCurrentTabData called, currentTab:", currentTab);
    if (currentTab === "alle") {
      if (!allEventsLoaded || isRefresh) {
        console.log("📍 -> calling fetchAllEvents");
        await fetchAllEvents();
      }
    } else {
      if (!myEventsLoaded || isRefresh) {
        console.log("📍 -> calling fetchMyEvents");
        await fetchMyEvents();
      }
    }
  };

  // Initial load
  useEffect(() => {
    console.log("🔄 useEffect running - initial load");
    
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("🔄 -> calling loadCurrentTabData from useEffect");
        await loadCurrentTabData();
      } catch (error) {
        setError("Failed to load events");
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
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
    setFutureEvents([]);
    setPastEvents([]);
    setMyEvents([]);
    futureCursorRef.current = undefined;
    pastCursorRef.current = undefined;
    myEventsCursorRef.current = undefined;
    allEventsFetchingRef.current = false;
    myEventsFetchingRef.current = false;
    setFutureDone(false);
    setMyEventsFutureDone(false);
    setAllEventsLoaded(false);
    setMyEventsLoaded(false);

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
    console.log("📍 handleEndReached called, currentTab:", currentTab, "initialLoadComplete:", initialLoadComplete);
    
    // Don't load more until initial load is done
    if (!initialLoadComplete) return;
    
    console.log("📍 handleEndReached called, currentTab:", currentTab);
    if (currentTab === "alle") {
      if (loadingMore) return;
    } else {
      if (loadingMore) return;
    }

    setLoadingMore(true);
    try {
      if (currentTab === "alle") {
        console.log("📍 -> calling fetchAllEvents from handleEndReached");
        await fetchAllEvents();
      } else {
        console.log("📍 -> calling fetchMyEvents from handleEndReached");
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
          overflow: "hidden",
        }}
        buttonStyle={{ backgroundColor: "transparent" }}
        selectedTextStyle={{ color: theme.onSecondaryFixed }}
        textStyle={{ color: theme.onPrimaryContainer }}
        highlightStyle={{
          backgroundColor: theme.secondaryFixedDim,
          opacity: 1,
        }}
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
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      );
    }
    // Normal list items
    return null; // No placeholder content needed, FlatList will render data
  };

  return (
    <TabScreenContainer>
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
                  const isPrevPast =
                    index > 0
                      ? new Date(currentEvents[index - 1].event.start) <= now
                      : false;

                  return (
                    <>
                      {index === 0 && (
                        <View
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            backgroundColor: theme.surfaceContainerHigh,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              color: theme.onBackground,
                            }}
                          >
                            Kommende arrangementer
                          </Text>
                        </View>
                      )}
                      {isCurrentPast && !isPrevPast && (
                        <View
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            backgroundColor: theme.surfaceContainerHigh,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              color: theme.onBackground,
                            }}
                          >
                            Tidligere arrangementer
                          </Text>
                        </View>
                      )}
                      <EventCard
                        event={item}
                        onPress={() =>
                          router.push({
                            pathname: "/event-details",
                            params: {
                              eventId: item.event.id,
                              headerTitle: item.event.title,
                            },
                          })
                        }
                      />
                    </>
                  );
                }
          }
        />
      </View>
    </TabScreenContainer>
  );
};

export default AllEvents;
