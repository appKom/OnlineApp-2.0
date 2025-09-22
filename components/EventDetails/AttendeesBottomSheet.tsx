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
    const year = item.userGrade;

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
