import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, View, Image, useColorScheme } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { Attendance } from "types/event";

interface AttendeesBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  attendance: Attendance;
}

// Year calculation utility function
const calculateYear = (memberships: any[]): string | null => {
  if (!memberships || memberships.length === 0) return null;

  // Find the most relevant membership (prioritize current active ones)
  const membership = memberships.find((m) => m.type) || memberships[0];

  if (!membership || !membership.start) return null;

  const startDate = new Date(membership.start);
  const currentDate = new Date();

  // Ensure valid dates
  if (isNaN(startDate.getTime())) return null;

  switch (membership.type) {
    case "BACHELOR_STUDENT":
      // Calculate years since actual degree start
      const yearsSinceBachelor =
        Math.floor(
          (currentDate.getTime() - startDate.getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        ) + 2;
      return Math.min(yearsSinceBachelor, 3).toString(); // Cap at 3 for bachelor

    case "MASTER_STUDENT":
      // Start is when they began their fourth year, so calculate from there
      const yearsSinceFourthYear =
        Math.floor(
          (currentDate.getTime() - startDate.getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        ) + 5; // Add 4 because start is beginning of 4th year
      return Math.min(yearsSinceFourthYear, 5).toString(); // Cap at 5 for master

    case "PHD_STUDENT":
      return "5"; // Automatically year 5

    case "KNIGHT":
      return null; // null for year

    default:
      return null;
  }
};

const AttendeesBottomSheet: React.FC<AttendeesBottomSheetProps> = ({
  bottomSheetRef,
  attendance,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Theme-aware colors
  const colors = {
    background: isDark ? "#1a1a1a" : "#ffffff",
    textPrimary: isDark ? "#ffffff" : "#333333",
    textSecondary: isDark ? "#cccccc" : "#666666",
    separator: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    handle: isDark ? "#333333" : "#cccccc",
  };

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ["80%"], []);

  const renderAttendeeItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const user = item.user || item; // Handle different data structures
    const year = calculateYear(user.memberships);

    return (
      <View
        style={[styles.attendeeItem, { borderBottomColor: colors.separator }]}
      >
        <Text style={[styles.indexText, { color: colors.textSecondary }]}>
          {index + 1}.
        </Text>

        <Image
          source={{
            uri:
              user.imageUrl || "https://via.placeholder.com/40x40.png?text=?",
          }}
          style={styles.profileImage}
          defaultSource={{
            uri: "https://via.placeholder.com/40x40.png?text=?",
          }}
        />

        <View style={styles.attendeeInfo}>
          <Text style={[styles.attendeeName, { color: colors.textPrimary }]}>
            {user.name}
          </Text>
          {year && (
            <Text
              style={[styles.attendeeYear, { color: colors.textSecondary }]}
            >
              {year}. klasse
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.separator }]}>
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
        Påmeldte ({attendance?.attendees?.length || 0})
      </Text>
    </View>
  );

  const attendees = attendance?.attendees || [];

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close" // Closes sheet when tapped
        opacity={0.4}
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1} // Start closed
      snapPoints={snapPoints}
      maxDynamicContentSize={80}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      backgroundStyle={[
        styles.bottomSheetBackground,
        // {
        //   backgroundColor: isDark
        //     ? "rgba(26, 26, 26, 0.8)"
        //     : "rgba(255, 255, 255, 0.8)", // 95% opacity
        // },
        { backgroundColor: colors.background },
      ]}
      handleIndicatorStyle={{ backgroundColor: colors.handle }}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetFlatList
        data={attendees}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderAttendeeItem}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        style={styles.flatListStyle}
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  flatListStyle: {
    paddingHorizontal: 20,
    // marginBottom: 80,
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 100,
  },
  attendeeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  indexText: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "right",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  attendeeInfo: {
    flex: 1,
    justifyContent: "center",
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  attendeeYear: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default AttendeesBottomSheet;
