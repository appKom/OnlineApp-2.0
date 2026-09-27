import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Membership, User } from "../../types/user";
import { useTheme } from "../../utils/theme";
import { getGrade, getMembershipTypeName } from "../../utils/user-utils";
import { useProfileChromeColors } from "./ProfileSurface";

/** Just the fields a profile header needs; other users' profiles only get their public fields. */
type HeroUser = Pick<User, "name" | "username" | "imageUrl">;

/**
 * Avatar, name, username and membership, shared by your own profile and other people's.
 * Pass onAvatarPress to make the avatar editable (adds the camera badge).
 */
export function ProfileHero({
  user,
  activeMembership,
  onAvatarPress,
  isAvatarUploading,
}: {
  user: HeroUser;
  activeMembership: Membership | null;
  onAvatarPress?: () => void;
  isAvatarUploading?: boolean;
}) {
  const theme = useTheme();
  const chrome = useProfileChromeColors();
  const grade = activeMembership ? getGrade(activeMembership) : null;
  const membershipSummary = activeMembership
    ? [
        grade ? `${grade}. klasse` : null,
        getMembershipTypeName(activeMembership.type),
      ]
        .filter(Boolean)
        .join(" · ")
    : "Ingen aktivt medlemskap";

  return (
    <View style={styles.hero}>
      <View style={styles.heroMain}>
        <Pressable
          accessibilityRole={onAvatarPress ? "button" : "image"}
          accessibilityLabel={onAvatarPress ? "Endre profilbilde" : undefined}
          disabled={!onAvatarPress || isAvatarUploading}
          onPress={onAvatarPress}
          style={({ pressed }) => pressed && { opacity: 0.8 }}
        >
          {user.imageUrl ? (
            <Image
              accessibilityLabel={`Profilbilde av ${user.name ?? user.username}`}
              source={{ uri: user.imageUrl }}
              style={[
                styles.avatar,
                {
                  borderColor: chrome.edge,
                  borderTopColor: chrome.highlight,
                  backgroundColor: chrome.raised,
                },
              ]}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                {
                  borderColor: chrome.edge,
                  borderTopColor: chrome.highlight,
                  backgroundColor: chrome.raised,
                },
              ]}
            >
              <Text style={[styles.avatarInitials, { color: chrome.icon }]}>
                {getInitials(user.name ?? user.username)}
              </Text>
            </View>
          )}
          {isAvatarUploading && (
            <View style={[styles.avatar, styles.avatarBusy]}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
          {onAvatarPress && (
            <View
              style={[
                styles.avatarBadge,
                {
                  backgroundColor: chrome.raised,
                  borderColor: chrome.edge,
                  borderTopColor: chrome.highlight,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="camera-outline"
                size={15}
                color={chrome.icon}
              />
            </View>
          )}
        </Pressable>

        <View style={styles.identity}>
          <Text
            numberOfLines={2}
            style={[styles.name, { color: theme.onSurface }]}
          >
            {user.name || "Ukjent bruker"}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.username, { color: theme.onSurfaceVariant }]}
          >
            @{user.username}
          </Text>
          <View
            style={[
              styles.membershipPill,
              {
                backgroundColor: chrome.raised,
                borderColor: chrome.edge,
                borderTopColor: chrome.highlight,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                activeMembership
                  ? "badge-account-outline"
                  : "account-alert-outline"
              }
              size={15}
              color={chrome.icon}
            />
            <Text
              numberOfLines={1}
              style={[styles.membershipPillText, { color: theme.onSurface }]}
            >
              {membershipSummary}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function getInitials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function formatAccountAge(createdAt: Date): string {
  const created = new Date(createdAt);
  const now = new Date();
  let months =
    (now.getFullYear() - created.getFullYear()) * 12 +
    now.getMonth() -
    created.getMonth();
  if (now.getDate() < created.getDate()) months -= 1;

  if (months >= 12) return `${Math.floor(months / 12)} år`;
  if (months >= 1) return `${months} mnd.`;
  return "Ny";
}

const styles = StyleSheet.create({
  hero: { padding: 18 },
  heroMain: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 82, height: 82, borderWidth: 1, borderRadius: 41 },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 27, fontWeight: "700" },
  identity: { minWidth: 0, flex: 1 },
  name: { fontSize: 22, lineHeight: 27, fontWeight: "700" },
  username: { marginTop: 2, fontSize: 13 },
  membershipPill: {
    maxWidth: "100%",
    minHeight: 28,
    marginTop: 9,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderRadius: 9,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  membershipPillText: { flexShrink: 1, fontSize: 11, fontWeight: "700" },
  avatarBusy: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderColor: "transparent",
  },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderWidth: 1,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
