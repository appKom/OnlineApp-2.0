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
import { getAllEvents } from "../../../utils/trpc";

const AllEvents: React.FC = () => {
  const [events, setEvents] = useState<EventAttendanceBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

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
      style={{ flex: 1 }}
      renderItem={({ item }) => (
        <Pressable
          style={styles.item}
          onPress={() =>
            router.push({
              pathname: "/event-details",
              params: { eventId: item.event.id },
            })
          }
        >
          <Text>{item.event.title ?? "NULL"}</Text>
        </Pressable>
      )}
    />
  );
};

const styles = StyleSheet.create({
  item: { padding: 12, borderBottomWidth: 1, borderColor: "#ececec" },
});

export default AllEvents;
