import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ProfileDivider,
  ProfileInfoRow,
  ProfileSurface,
  QuickFact,
  SectionLabel,
  ThemeSelector,
  useProfileChromeColors,
} from "../../../components/Profile/ProfileSurface";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import { EventAttendanceBundle } from "../../../types/event";
import { Membership, User } from "../../../types/user";
import Authenticator from "../../../utils/authenticator";
import { useTheme, useThemeMode } from "../../../utils/theme";
import {
  getAllFutureEventsByAttendingUserId,
  getGroupsByMember,
  getUser,
} from "../../../utils/trpc";
import {
  findActiveMembership,
  getGenderName,
  getGrade,
  getMembershipTypeName,
  getSpecializationName,
} from "../../../utils/user-utils";

type ProfileOverview = {
  groupCount: number | null;
  nextEvent: EventAttendanceBundle | null;
};

const emptyOverview: ProfileOverview = {
  groupCount: null,
  nextEvent: null,
};

export default function ProfileScreen() {
  const theme = useTheme();
  const chrome = useProfileChromeColors();
  const { selectedMode, setMode } = useThemeMode();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMembershipHistory, setShowMembershipHistory] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<ProfileOverview>(emptyOverview);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Authenticator.initialize(
      "auth.online.ntnu.no",
      "EniGfQ4MlcVuS2FWbUMmCjaFB65EqjzZ",
    );

    const removeListener = Authenticator.addLoginStateListener((loggedIn) => {
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        void loadUserProfile();
      } else {
        setUser(null);
        setOverview(emptyOverview);
        setError(null);
      }
    });

    void checkLoginStatus();
    return removeListener;
  }, []);

  const checkLoginStatus = async () => {
    try {
      const credentials = await Authenticator.fetchStoredCredentials();
      const isAuthenticated = Boolean(credentials);
      setIsLoggedIn(isAuthenticated);

      if (isAuthenticated) {
        await loadUserProfile();
      }
    } catch (loginError) {
      console.error("Error checking login status:", loginError);
      setError("Kunne ikke kontrollere innloggingen.");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const loadUserProfile = async () => {
    setError(null);
    setIsProfileLoading(user === null);

    try {
      const userProfile = await getUser();
      if (!userProfile) {
        throw new Error("Authenticated user was not returned by the API");
      }

      Authenticator.user = userProfile;
      setUser(userProfile);
      setIsProfileLoading(false);
      setIsOverviewLoading(true);

      const [groupsResult, eventsResult] = await Promise.allSettled([
        getGroupsByMember(userProfile.id),
        getAllFutureEventsByAttendingUserId(userProfile.id, 1, undefined, "asc"),
      ]);

      setOverview({
        groupCount:
          groupsResult.status === "fulfilled"
            ? groupsResult.value.length
            : null,
        nextEvent:
          eventsResult.status === "fulfilled"
            ? eventsResult.value?.items?.[0] ?? null
            : null,
      });
    } catch (profileError) {
      console.error("Error loading user profile:", profileError);
      setError("Kunne ikke laste profilen din.");
    } finally {
      setIsProfileLoading(false);
      setIsOverviewLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const credentials = await Authenticator.login();
      if (!credentials) {
        Alert.alert("Innlogging avbrutt", "Du ble ikke logget inn.");
      }
    } catch (loginError) {
      console.error("Login error:", loginError);
      Alert.alert("Feil", "Det oppstod en feil under innloggingen.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await Authenticator.logout();
    } catch (logoutError) {
      console.error("Logout error:", logoutError);
      Alert.alert("Feil", "Det oppstod en feil under utloggingen.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadUserProfile();
    setIsRefreshing(false);
  };

  const activeMembership = useMemo(
    () => (user ? findActiveMembership(user) : null),
    [user],
  );

  const previousMemberships = useMemo(() => {
    if (!user) return [];
    return user.memberships
      .filter((membership) => membership.id !== activeMembership?.id)
      .sort(
        (a, b) =>
          new Date(b.start).getTime() - new Date(a.start).getTime(),
      );
  }, [activeMembership?.id, user]);

  if (isCheckingAuth) {
    return <ProfileLoadingState />;
  }

  if (!isLoggedIn) {
    return (
      <TabScreenContainer>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.loggedOutContent}
          style={{ backgroundColor: theme.background }}
        >
          <ProfileSurface style={styles.loginCard}>
            <View
              style={[
                styles.loginIcon,
                { backgroundColor: theme.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={42}
                color={theme.onPrimaryContainer}
              />
            </View>
            <Text style={[styles.loginTitle, { color: theme.onSurface }]}>Velkommen til Online</Text>
            <Text
              style={[
                styles.loginDescription,
                { color: theme.onSurfaceVariant },
              ]}
            >
              Logg inn for å se medlemskapet, gruppene og profilen din.
            </Text>
            {error && (
              <Text style={[styles.inlineError, { color: theme.error }]}>{error}</Text>
            )}
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.84}
              disabled={isLoading}
              onPress={handleLogin}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.primary,
                  opacity: isLoading ? 0.65 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.onPrimary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="login" size={20} color={theme.onPrimary} />
                  <Text style={[styles.primaryButtonText, { color: theme.onPrimary }]}>Logg inn</Text>
                </>
              )}
            </TouchableOpacity>
          </ProfileSurface>
        </ScrollView>
      </TabScreenContainer>
    );
  }

  return (
    <TabScreenContainer>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
      >
        {error && (
          <View
            accessibilityRole="alert"
            style={[
              styles.errorBanner,
              { backgroundColor: theme.errorContainer, borderColor: theme.error },
            ]}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={theme.onErrorContainer} />
            <Text style={[styles.errorText, { color: theme.onErrorContainer }]}>{error}</Text>
            <TouchableOpacity onPress={loadUserProfile}>
              <Text style={[styles.retryText, { color: theme.onErrorContainer }]}>Prøv igjen</Text>
            </TouchableOpacity>
          </View>
        )}

        {isProfileLoading || !user ? (
          <ProfileLoadingCard />
        ) : (
          <>
            <ProfileSurface>
              <ProfileHero user={user} activeMembership={activeMembership} />
              <ProfileDivider />
              <View style={styles.quickFacts}>
                <QuickFact
                  icon="account-group-outline"
                  value={
                    isOverviewLoading
                      ? "…"
                      : overview.groupCount === null
                        ? "–"
                        : String(overview.groupCount)
                  }
                  label="Grupper"
                />
                <View
                  style={[
                    styles.quickFactSeparator,
                    { backgroundColor: chrome.edge },
                  ]}
                />
                <QuickFact
                  icon="calendar-check-outline"
                  value={
                    isOverviewLoading
                      ? "…"
                      : overview.nextEvent
                        ? formatNextEventDate(overview.nextEvent.event.start)
                        : "Ingen"
                  }
                  label={overview.nextEvent?.event.title ?? "Neste arrangement"}
                />
                <View
                  style={[
                    styles.quickFactSeparator,
                    { backgroundColor: chrome.edge },
                  ]}
                />
                <QuickFact
                  icon="clock-outline"
                  value={formatAccountAge(user.createdAt)}
                  label="I Online"
                />
              </View>
            </ProfileSurface>

            <View>
              <SectionLabel>Medlemskap</SectionLabel>
              <MembershipCard
                membership={activeMembership}
                previousMemberships={previousMemberships}
                showHistory={showMembershipHistory}
                onToggleHistory={() => setShowMembershipHistory((current) => !current)}
              />
            </View>

            <View>
              <SectionLabel>Din informasjon</SectionLabel>
              <ProfileSurface>
                <ProfileInfoRow icon="email-outline" label="E-post" value={user.email || "Ikke oppgitt"} />
                <ProfileInfoRow icon="phone-outline" label="Telefon" value={user.phone || "Ikke oppgitt"} />
                <ProfileInfoRow
                  icon="school-outline"
                  label="NTNU-bruker"
                  value={user.ntnuUsername || "Ikke oppgitt"}
                />
                <ProfileInfoRow icon="account-outline" label="Kjønn" value={getGenderName(user.gender)} />
                <ProfileInfoRow
                  icon="food-apple-outline"
                  label="Kosthold"
                  value={user.dietaryRestrictions || "Ingen kostholdsrestriksjoner"}
                  isLast
                />
              </ProfileSurface>
            </View>

            <View>
              <SectionLabel>Utseende</SectionLabel>
              <ThemeSelector selectedMode={selectedMode} onChange={setMode} />
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.72}
              disabled={isLoading}
              onPress={handleLogout}
              style={[styles.logoutButton, { opacity: isLoading ? 0.55 : 1 }]}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.error} />
              ) : (
                <>
                  <MaterialCommunityIcons name="logout" size={20} color={theme.error} />
                  <Text style={[styles.logoutText, { color: theme.error }]}>Logg ut</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </TabScreenContainer>
  );
}

function ProfileHero({ user, activeMembership }: { user: User; activeMembership: Membership | null }) {
  const theme = useTheme();
  const chrome = useProfileChromeColors();
  const grade = activeMembership ? getGrade(activeMembership) : null;
  const membershipSummary = activeMembership
    ? [grade ? `${grade}. klasse` : null, getMembershipTypeName(activeMembership.type)]
        .filter(Boolean)
        .join(" · ")
    : "Ingen aktivt medlemskap";

  return (
    <View style={styles.hero}>
      <View style={styles.heroMain}>
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

        <View style={styles.identity}>
          <Text numberOfLines={2} style={[styles.name, { color: theme.onSurface }]}>
            {user.name || "Ukjent bruker"}
          </Text>
          <Text numberOfLines={1} style={[styles.username, { color: theme.onSurfaceVariant }]}>
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
              name={activeMembership ? "badge-account-outline" : "account-alert-outline"}
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

      {user.biography ? (
        <Text
          style={[
            styles.biography,
            { color: theme.onSurfaceVariant, borderTopColor: chrome.edge },
          ]}
        >
          {user.biography}
        </Text>
      ) : null}
    </View>
  );
}

function MembershipCard({
  membership,
  previousMemberships,
  showHistory,
  onToggleHistory,
}: {
  membership: Membership | null;
  previousMemberships: Membership[];
  showHistory: boolean;
  onToggleHistory: () => void;
}) {
  const theme = useTheme();
  const chrome = useProfileChromeColors();

  if (!membership) {
    return (
      <ProfileSurface style={styles.emptyMembershipCard}>
        <View
          style={[
            styles.membershipIcon,
            {
              backgroundColor: chrome.raised,
              borderColor: chrome.edge,
              borderTopColor: chrome.highlight,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="card-account-details-outline"
            size={25}
            color={chrome.icon}
          />
        </View>
        <View style={styles.membershipCopy}>
          <Text style={[styles.membershipTitle, { color: theme.onSurface }]}>Ingen aktivt medlemskap</Text>
          <Text style={[styles.membershipSubtitle, { color: theme.onSurfaceVariant }]}>
            Medlemskapet ditt vises her når det er aktivt.
          </Text>
        </View>
      </ProfileSurface>
    );
  }

  const grade = getGrade(membership);
  const specialization = getSpecializationName(membership.specialization);

  return (
    <ProfileSurface style={styles.membershipCard}>
      <View style={styles.membershipTopRow}>
        <View
          style={[
            styles.membershipIcon,
            {
              backgroundColor: chrome.raised,
              borderColor: chrome.edge,
              borderTopColor: chrome.highlight,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="badge-account-outline"
            size={25}
            color={chrome.icon}
          />
        </View>
        <View style={styles.membershipCopy}>
          <Text style={[styles.membershipTitle, { color: theme.onSurface }]}>Aktivt medlem</Text>
          <Text style={[styles.membershipSubtitle, { color: theme.onSurfaceVariant }]}>
            {[getMembershipTypeName(membership.type), specialization].filter(Boolean).join(" · ")}
          </Text>
        </View>
        {grade !== null && (
          <Text style={[styles.grade, { color: theme.secondary }]}>{grade}. klasse</Text>
        )}
      </View>

      <View
        style={[
          styles.membershipValidity,
          {
            backgroundColor: chrome.recessed,
            borderColor: chrome.edge,
            borderBottomColor: chrome.highlight,
          },
        ]}
      >
        <MaterialCommunityIcons name="calendar-check-outline" size={17} color={chrome.icon} />
        <Text style={[styles.membershipValidityText, { color: theme.onSurfaceVariant }]}>
          {membership.end ? `Gyldig til ${formatDate(membership.end)}` : "Livstidsmedlemskap"}
        </Text>
      </View>

      {previousMemberships.length > 0 && (
        <>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ expanded: showHistory }}
            activeOpacity={0.72}
            onPress={onToggleHistory}
            style={styles.historyToggle}
          >
            <Text style={[styles.historyToggleText, { color: theme.onSurface }]}>
              {showHistory
                ? "Skjul tidligere medlemskap"
                : `Vis historikk (${previousMemberships.length})`}
            </Text>
            <MaterialCommunityIcons
              name={showHistory ? "chevron-up" : "chevron-down"}
              size={20}
              color={chrome.icon}
            />
          </TouchableOpacity>

          {showHistory && (
            <View style={[styles.historyList, { borderTopColor: chrome.edge }]}>
              {previousMemberships.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <View style={styles.historyCopy}>
                    <Text style={[styles.historyTitle, { color: theme.onSurface }]}>
                      {getMembershipTypeName(item.type)}
                    </Text>
                    <Text style={[styles.historyDates, { color: theme.onSurfaceVariant }]}>
                      {formatMembershipRange(item)}
                    </Text>
                  </View>
                  {getGrade(item) !== null && (
                    <Text style={[styles.historyGrade, { color: theme.onSurfaceVariant }]}>
                      {getGrade(item)}. klasse
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ProfileSurface>
  );
}

function ProfileLoadingState() {
  const theme = useTheme();
  return (
    <TabScreenContainer>
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.onSurfaceVariant }]}>Laster profil…</Text>
      </View>
    </TabScreenContainer>
  );
}

function ProfileLoadingCard() {
  const theme = useTheme();
  return (
    <ProfileSurface style={styles.loadingCard}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.onSurfaceVariant }]}>Laster profilen din…</Text>
    </ProfileSurface>
  );
}

function getInitials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatNextEventDate(date: Date): string {
  const value = new Date(date);
  const weekday = value.toLocaleDateString("nb-NO", { weekday: "short" });
  const time = value.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
  return `${weekday} ${time}`;
}

function formatAccountAge(createdAt: Date): string {
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

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMembershipRange(membership: Membership): string {
  const start = new Date(membership.start).toLocaleDateString("nb-NO", {
    month: "short",
    year: "numeric",
  });
  const end = membership.end
    ? new Date(membership.end).toLocaleDateString("nb-NO", {
        month: "short",
        year: "numeric",
      })
    : "nå";
  return `${start}–${end}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 16,
  },
  loggedOutContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  loginCard: { padding: 24, alignItems: "center" },
  loginIcon: {
    width: 72,
    height: 72,
    marginBottom: 18,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loginTitle: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  loginDescription: {
    maxWidth: 300,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  inlineError: { marginTop: 12, fontSize: 13, textAlign: "center" },
  primaryButton: {
    minWidth: 180,
    minHeight: 50,
    marginTop: 22,
    paddingHorizontal: 22,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryButtonText: { fontSize: 15, fontWeight: "700" },
  errorBanner: {
    minHeight: 52,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  retryText: { fontSize: 13, fontWeight: "700" },
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
  biography: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
    lineHeight: 21,
  },
  quickFacts: {
    minHeight: 92,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  quickFactSeparator: {
    width: 1,
    height: 54,
  },
  membershipCard: { padding: 15 },
  membershipTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  membershipIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  membershipCopy: { minWidth: 0, flex: 1 },
  membershipTitle: { fontSize: 16, fontWeight: "700" },
  membershipSubtitle: { marginTop: 3, fontSize: 12, lineHeight: 17 },
  grade: { maxWidth: 72, fontSize: 13, lineHeight: 17, fontWeight: "700", textAlign: "right" },
  membershipValidity: {
    minHeight: 36,
    marginTop: 13,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  membershipValidityText: { flex: 1, fontSize: 12 },
  emptyMembershipCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyToggle: {
    minHeight: 42,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyToggleText: { fontSize: 13, fontWeight: "700" },
  historyList: { paddingTop: 5, borderTopWidth: StyleSheet.hairlineWidth },
  historyRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10 },
  historyCopy: { flex: 1 },
  historyTitle: { fontSize: 13, fontWeight: "600" },
  historyDates: { marginTop: 2, fontSize: 11 },
  historyGrade: { fontSize: 12 },
  logoutButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { fontSize: 14, fontWeight: "700" },
  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingCard: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
});
