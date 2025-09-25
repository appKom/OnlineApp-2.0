import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View, Image, useColorScheme } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { Attendance, Attendee } from "types/event";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { UserUtils } from "utils/user-utils";
import { PoolAttendees } from "app/(tabs)/(home)/event-details";

interface AttendeesBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  attendance: Attendance;
  userPoolIndex: number | null;
  sortedAttendees: PoolAttendees[]; // Pre-sorted attendees passed from parent
}

const AttendeesBottomSheet: React.FC<AttendeesBottomSheetProps> = ({
  bottomSheetRef,
  attendance,
  userPoolIndex,
  sortedAttendees,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [selectedPoolIndex, setSelectedPoolIndex] = useState(
    userPoolIndex ?? 0
  );

  // const sortedAttendees = useMemo(() => {
  //   const poolAttendees: PoolAttendees[] = Array.from(
  //     { length: attendance.pools.length },
  //     () => ({
  //       in: [] as Attendee[],
  //       waitlist: [] as Attendee[],
  //     })
  //   );

  //   for (let i = 0; i < attendance.attendees.length; i++) {
  //     const attendee = attendance.attendees[i];

  //     const poolIndex = UserUtils.getUserPoolIndex(
  //       attendee.user,
  //       attendance.pools
  //     );

  //     if (poolIndex === undefined) continue; // TODO: What to do with the user now?

  //     const waitlist = !attendee.reserved;

  //     if (poolIndex !== -1) {
  //       if (waitlist) {
  //         poolAttendees[poolIndex].waitlist.push(attendee);
  //       } else {
  //         poolAttendees[poolIndex].in.push(attendee);
  //       }
  //     }
  //   }

  //   return poolAttendees;
  // }, [attendance]);

  // Combine data with section headers as items
  const combinedData = useMemo(() => {
    const poolAttendees = sortedAttendees[selectedPoolIndex];
    const combined = [];

    // Add "Påmeldte" section
    if (poolAttendees.in.length > 0) {
      // Add section header as an item
      combined.push({
        type: "sectionHeader",
        title: `Påmeldte (${poolAttendees.in.length}/${attendance.pools[selectedPoolIndex].capacity})`,
        id: "attendees-header",
      });
      // Add all attendees
      combined.push(
        ...poolAttendees.in.map((item, index) => ({
          ...item,
          type: "attendee",
          sectionIndex: index,
        }))
      );
    }

    // Add "Venteliste" section
    if (poolAttendees.waitlist.length > 0) {
      // Add section header as an item
      combined.push({
        type: "sectionHeader",
        title: `Venteliste (${poolAttendees.waitlist.length})`,
        id: "waitlist-header",
      });
      // Add all waitlisted people
      combined.push(
        ...poolAttendees.waitlist.map((item, index) => ({
          ...item,
          type: "waitlist",
          sectionIndex: index,
        }))
      );
    }

    return combined;
  }, [selectedPoolIndex, attendance.pools]);

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

  // Render different item types
  const renderCombinedItem = ({ item, index }) => {
    // Render section headers
    if (item.type === "sectionHeader") {
      return (
        <View
          style={[styles.sectionHeader, { backgroundColor: colors.background }]}
        >
          <Text
            style={[styles.sectionHeaderText, { color: colors.textPrimary }]}
          >
            {item.title}
          </Text>
        </View>
      );
    }

    // Render regular attendee items
    const user = item.user || item;
    const year = item.userGrade;
    const displayIndex = item.sectionIndex + 1; // Use section-specific index

    return (
      <View
        style={[styles.attendeeItem, { borderBottomColor: colors.separator }]}
      >
        <Text style={[styles.indexText, { color: colors.textSecondary }]}>
          {displayIndex}.
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

  const poolTitles = useMemo(() => {
    return attendance.pools.map((pool) => {
      const years = pool.yearCriteria;
      if (years.length === 5) return "Alle årsklasser";
      if (years.length === 1) return `${years[0]}. klasse`;
      if (years.length === 2) return `${years[0]}-${years[1]}. klasse`;
      return `Årsklasser: ${years.join(", ")}`;
    });
  }, [attendance.pools]);

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
        { backgroundColor: colors.background },
      ]}
      handleIndicatorStyle={{ backgroundColor: colors.handle }}
      backdropComponent={renderBackdrop}
    >
      {/* Fixed header area */}
      <View
        style={[styles.fixedHeader, { borderBottomColor: colors.separator }]}
      >
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Påmeldte ({attendance?.attendees?.length || 0})
        </Text>
        <SegmentedControl
          values={poolTitles}
          selectedIndex={selectedPoolIndex}
          onValueChange={(value) => {
            const index = poolTitles.indexOf(value);
            if (index !== -1) {
              setSelectedPoolIndex(index);
            }
          }}
        />
      </View>

      {/* Single scrollable list with section headers as items */}
      <BottomSheetFlatList
        data={combinedData}
        keyExtractor={(item, index) => item.id || `item-${index}`}
        renderItem={renderCombinedItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        style={styles.scrollableList}
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
  fixedHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    backgroundColor: "transparent", // Let BottomSheet background show through
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  scrollableList: {
    flex: 1, // Take remaining space
    paddingHorizontal: 20,
  },
  sectionHeader: {
    paddingVertical: 16,
    paddingHorizontal: 0, // No extra padding since parent has it
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: "transparent", // Let BottomSheet background show through
    marginTop: 8, // Add some spacing before section headers
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  listContainer: {
    paddingBottom: 100,
  },
});

export default AttendeesBottomSheet;
