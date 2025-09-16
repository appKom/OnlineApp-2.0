// import { ScrollView, StyleSheet, Text, View } from "react-native";

// export default function GamesScreen() {
//   return (
//     <ScrollView contentInsetAdjustmentBehavior="automatic">
//       <View style={{ padding: 20, height: 1000 }}>
//         {Array.from({ length: 20 }, (_, i) => (
//           <View key={i} style={styles.gameItem}>
//             <Text style={styles.gameTitle}>Game {i + 1}</Text>
//             <Text style={styles.gameDescription}>
//               Description for game {i + 1}. This is a sample game with some
//               details.
//             </Text>
//           </View>
//         ))}
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   gameItem: {
//     backgroundColor: "white",
//     padding: 16,
//     marginBottom: 12,
//     borderRadius: 8,
//     shadowColor: "#000",
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   gameTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   gameDescription: {
//     fontSize: 14,
//     color: "#666",
//     lineHeight: 20,
//   },
// });

import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

export default function GamesScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerLargeTitle: true,
          headerTitle: "Spill",
          headerLargeTitleStyle: {
            fontSize: 28,
            fontWeight: "bold",
          },
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={{ padding: 20, height: 1000 }}>
          {Array.from({ length: 20 }, (_, i) => (
            <View key={i} style={styles.gameItem}>
              <Text style={styles.gameTitle}>Game {i + 1}</Text>
              <Text style={styles.gameDescription}>
                Description for game {i + 1}. This is a sample game with some
                details.
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  gameItem: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
