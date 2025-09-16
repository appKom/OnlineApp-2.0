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
import { getAllEvents } from "../../../utils/trpc";

const AllEvents: React.FC = () => {
  const [events, setEvents] = useState<EventAttendanceBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    getAllEvents()
      .then((data) => {
        const eventsArray = data?.items ?? [];
        setEvents(eventsArray.reverse());
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load events:", error);
        setError("Failed to load events");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(bundle) => bundle.event.id}
      contentInsetAdjustmentBehavior="automatic"
      style={{
        flex: 1,
        backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
      }}
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
  );
};

export default AllEvents;
