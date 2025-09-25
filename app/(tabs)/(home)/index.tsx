import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { EventAttendanceBundle } from "../../../types/event";
import {
  getAllEvents,
  getAllEventsByAttendingUserId,
} from "../../../utils/trpc";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import Authenticator from "utils/authenticator";

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

  const router = useRouter();
  const colorScheme = useColorScheme();

  const currentTab: TabType = selectedIndex === 0 ? "alle" : "mine";
  const currentEvents = currentTab === "alle" ? allEvents : myEvents;

  // Function to fetch all events
  const fetchAllEvents = async () => {
    try {
      const data = await getAllEvents();
      const eventsArray = data?.items ?? [];
      setAllEvents(eventsArray.reverse());
      setAllEventsLoaded(true);
    } catch (error) {
      console.error("Failed to load all events:", error);
      throw error;
    }
  };

  // Function to fetch user's events
  const fetchMyEvents = async () => {
    try {
      const data = user ? await getAllEventsByAttendingUserId(user.id) : null;
      const eventsArray = data?.items ?? [];
      setMyEvents(eventsArray.reverse());
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

  // Handle tab change
  const handleTabChange = async (event: any) => {
    const newIndex = event.nativeEvent.selectedSegmentIndex;
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

    try {
      await loadCurrentTabData(true); // Force refresh
    } catch (error) {
      setError("Failed to refresh events");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View
      style={{
        backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <SegmentedControl
        values={["Alle", "Mine"]}
        selectedIndex={selectedIndex}
        onChange={handleTabChange}
        style={{
          height: 32,
        }}
      />
    </View>
  );

  return (
    <>
      <FlatList
        data={currentEvents}
        keyExtractor={(bundle) => bundle.event.id}
        contentInsetAdjustmentBehavior="automatic"
        style={{
          flex: 1,
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        }}
        ListHeaderComponent={renderHeader}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <Pressable
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderColor: colorScheme === "dark" ? "#222" : "#ececec",
            }}
            onPress={() =>
              router.push({
                pathname: "/event-details",
                params: { eventId: item.event.id },
              })
            }
          >
            <Text
              style={{ color: colorScheme === "dark" ? "#ffffff" : "#000000" }}
            >
              {item.event.title ?? "NULL"}
            </Text>
          </Pressable>
        )}
      />
    </>
  );
};

export default AllEvents;
