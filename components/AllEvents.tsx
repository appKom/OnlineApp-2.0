import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Pressable } from "react-native";

import { EventAttendanceBundle } from "../types/event";
// import { RootStackParamList } from "../AppNavigator";
import { getAllEvents } from "../utils/trpc"; // Adjust path as needed

const AllEvents: React.FC = () => {
  const [events, setEvents] = useState<EventAttendanceBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<NativeStackNavigationProp<any>>();

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
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  if (error) {
    return <Text style={{ color: "red" }}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(bundle) => bundle.event.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() =>
              navigation.navigate("EventDetails", { eventId: item.event.id })
            }
          >
            <Text>{item.event.title ?? "NULL"}</Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: "#ececec" },
});

export default AllEvents;
