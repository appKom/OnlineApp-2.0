import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
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
import { MarksCard } from "../../../components/Profile/MarksCard";
import { ProfileHero, formatAccountAge } from "../../../components/Profile/ProfileHero";
import {
  EditProfileFieldModal,
  type EditableField,
} from "../../../components/Profile/EditProfileFieldModal";
import { RaisedButton } from "../../../components/Panel";
import { TabScreenContainer } from "../../../components/TabScreenContainer";
import { EventAttendanceBundle } from "../../../types/event";
import type { VisiblePersonalMark } from "../../../types/mark";
import type { Punishment } from "../../../types/punishment";
import { Membership, User } from "../../../types/user";
import Authenticator from "../../../utils/authenticator";
import { AvatarPermissionError, pickAvatar, uploadAvatar } from "../../../utils/avatar";
import { syncPendingEmailChange } from "../../../utils/email-change";
import { useTheme, useThemeMode } from "../../../utils/theme";
import {
  getAllFutureEventsByAttendingUserId,
  getExpiryDateForUser,
  getGroupsByMember,
  getUser,
  getVisibleMarks,
  updateUser,
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
  /** Null until loaded, or if the marks couldn't be fetched. */
  marks: VisiblePersonalMark[] | null;
  punishment: Punishment | null;
};

const LOGGED_OUT_FEATURES = [
  { icon: "calendar-check-outline", label: "Meld deg på og av arrangementer" },
  { icon: "ticket-outline", label: "Billetter og plass på ventelisten" },
  { icon: "bell-outline", label: "Påminnelser før arrangementer du skal på" },
  { icon: "card-account-details-outline", label: "Medlemskap, grupper og profil" },
] as const;

const emptyOverview: ProfileOverview = {
  groupCount: null,
  nextEvent: null,
  marks: null,
  punishment: null,
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
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  /** The stored login couldn't be read or refreshed, so the API can't tell who we are. */
  const [sessionLost, setSessionLost] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  // Edits made in dialogs (here or on an event page) replace the signed-in user.
  useEffect(
    () =>
      Authenticator.addUserListener((updated) => {
        if (updated) setUser(updated);
      }),
    [],
  );

  useEffect(() => {
    Authenticator.initialize();

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
    setSessionLost(false);
    setIsProfileLoading(user === null);

    try {
      // Picks up an email change once its verification link has been clicked.
      await syncPendingEmailChange().catch(() => null);

      // One quiet retry covers brief API restarts and a token refresh racing another request.
      let userProfile = await getUser().catch(() => null);
      if (!userProfile) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        userProfile = await getUser();
      }
      if (!userProfile) {
        setSessionLost(true);
        throw new Error("No credentials to load the user with");
      }

      Authenticator.user = userProfile;
      setUser(userProfile);
      setIsProfileLoading(false);
      setIsOverviewLoading(true);

      const [groupsResult, eventsResult, marksResult, punishmentResult] = await Promise.allSettled([
        getGroupsByMember(userProfile.id),
        getAllFutureEventsByAttendingUserId(userProfile.id, 1, undefined, "asc"),
        getVisibleMarks(userProfile.id),
        getExpiryDateForUser(userProfile.id),
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
        marks: marksResult.status === "fulfilled" ? marksResult.value : null,
        punishment:
          punishmentResult.status === "fulfilled"
            ? ((punishmentResult.value as Punishment | null) ?? null)
            : null,
      });
    } catch (profileError) {
      // warn, not error: this is an expected state with its own UI, not a crash.
      console.warn("Could not load user profile:", profileError);
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

  const handleRelogin = async () => {
    await handleLogin();
    if (Authenticator.loggedIn) await loadUserProfile();
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

  const setAvatar = async (source: "camera" | "library") => {
    if (!user) return;
    try {
      const uri = await pickAvatar(source);
      if (!uri) return;
      setIsAvatarUploading(true);
      const imageUrl = await uploadAvatar(uri);
      const updated = await updateUser(user.id, { imageUrl });
      Authenticator.setUser({ ...user, ...updated });
    } catch (avatarError) {
      if (avatarError instanceof AvatarPermissionError) {
        Alert.alert("Mangler tilgang", "Gi Online tilgang til kameraet i Innstillinger for å ta et profilbilde.", [
          { text: "Avbryt", style: "cancel" },
          { text: "Åpne Innstillinger", onPress: () => void Linking.openSettings() },
        ]);
      } else {
        console.error("Avatar upload failed:", avatarError);
        Alert.alert("Kunne ikke oppdatere profilbildet", "Prøv igjen, eller velg et annet bilde.");
      }
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const removeAvatar = () => {
    if (!user) return;
    Alert.alert("Fjerne profilbildet?", undefined, [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Fjern",
        style: "destructive",
        onPress: async () => {
          setIsAvatarUploading(true);
          try {
            const updated = await updateUser(user.id, { imageUrl: null });
            Authenticator.setUser({ ...user, ...updated });
          } catch {
            Alert.alert("Kunne ikke fjerne profilbildet", "Prøv igjen om litt.");
          } finally {
            setIsAvatarUploading(false);
          }
        },
      },
    ]);
  };

  const openAvatarMenu = () => {
    if (!user || isAvatarUploading) return;
    const actions: { label: string; run: () => void; destructive?: boolean }[] = [
      { label: "Ta bilde", run: () => void setAvatar("camera") },
      { label: "Velg fra biblioteket", run: () => void setAvatar("library") },
      ...(user.imageUrl ? [{ label: "Fjern bilde", run: removeAvatar, destructive: true }] : []),
    ];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Profilbilde",
          options: [...actions.map((action) => action.label), "Avbryt"],
          cancelButtonIndex: actions.length,
          destructiveButtonIndex: actions.findIndex((action) => action.destructive),
        },
        (index) => actions[index]?.run(),
      );
    } else {
      Alert.alert("Profilbilde", undefined, [
        ...actions.map((action) => ({
          text: action.label,
          style: action.destructive ? ("destructive" as const) : ("default" as const),
          onPress: action.run,
        })),
        { text: "Avbryt", style: "cancel" as const },
      ]);
    }
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
          style={[styles.container, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.content}
        >
          <ProfileSurface>
            <View style={styles.loggedOutHero}>
              <MaterialCommunityIcons name="account-circle-outline" size={44} color={chrome.icon} />
              <View style={styles.identity}>
                <Text style={[styles.name, { color: theme.onSurface }]}>Du er ikke logget inn</Text>
                <Text style={[styles.loggedOutDescription, { color: theme.onSurfaceVariant }]}>
                  Logg inn med Online-brukeren din for å melde deg på arrangementer.
                </Text>
              </View>
            </View>
            <ProfileDivider />
            {LOGGED_OUT_FEATURES.map((feature, index) => (
              <View
                key={feature.label}
                style={[
                  styles.featureRow,
                  index < LOGGED_OUT_FEATURES.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: chrome.edge,
                  },
                ]}
              >
                <MaterialCommunityIcons name={feature.icon} size={18} color={chrome.icon} />
                <Text style={[styles.featureText, { color: theme.onSurface }]}>{feature.label}</Text>
              </View>
            ))}
            <ProfileDivider />
            <View style={styles.loginAction}>
              {error && <Text style={[styles.inlineError, { color: theme.error }]}>{error}</Text>}
              <RaisedButton
                icon="login"
                label={isLoading ? "Logger inn…" : "Logg inn"}
                tone="accent"
                disabled={isLoading}
                onPress={handleLogin}
              />
            </View>
          </ProfileSurface>

          <View>
            <SectionLabel>Utseende</SectionLabel>
            <ThemeSelector selectedMode={selectedMode} onChange={setMode} />
          </View>
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
        {error && user && (
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

        {!user && error && !isProfileLoading ? (
          <ProfileLoadErrorCard
            sessionLost={sessionLost}
            isBusy={isLoading || isRefreshing}
            onRetry={loadUserProfile}
            onRelogin={handleRelogin}
          />
        ) : isProfileLoading || !user ? (
          <ProfileLoadingCard />
        ) : (
          <>
            <ProfileSurface>
              <ProfileHero
                user={user}
                activeMembership={activeMembership}
                onAvatarPress={openAvatarMenu}
                isAvatarUploading={isAvatarUploading}
              />
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

            {overview.marks && (
              <View>
                <SectionLabel>Prikker</SectionLabel>
                <MarksCard marks={overview.marks} punishment={overview.punishment} userId={user.id} />
              </View>
            )}

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
              <SectionLabel>Om meg</SectionLabel>
              <BiographyCard biography={user.biography} onPress={() => setEditingField("biography")} />
            </View>

            <View>
              <SectionLabel>Din informasjon</SectionLabel>
              <ProfileSurface>
                <ProfileInfoRow
                  icon="email-outline"
                  label="E-post"
                  value={user.email || "Ikke oppgitt"}
                  muted={!user.email}
                  onPress={() => setEditingField("email")}
                />
                <ProfileInfoRow
                  icon="phone-outline"
                  label="Telefon"
                  value={user.phone || "Ikke oppgitt"}
                  muted={!user.phone}
                  onPress={() => setEditingField("phone")}
                />
                <ProfileInfoRow
                  icon="school-outline"
                  label="NTNU-bruker"
                  value={user.ntnuUsername || "Ikke oppgitt"}
                  muted={!user.ntnuUsername}
                />
                <ProfileInfoRow
                  icon="account-outline"
                  label="Kjønn"
                  value={getGenderName(user.gender)}
                  muted={user.gender === "UNKNOWN"}
                  onPress={() => setEditingField("gender")}
                />
                <ProfileInfoRow
                  icon="food-apple-outline"
                  label="Kosthold"
                  value={user.dietaryRestrictions || "Ingen kostholdsrestriksjoner"}
                  muted={!user.dietaryRestrictions}
                  onPress={() => setEditingField("dietaryRestrictions")}
                  isLast
                />
              </ProfileSurface>
            </View>

            <EditProfileFieldModal field={editingField} user={user} onClose={() => setEditingField(null)} />

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

function BiographyCard({ biography, onPress }: { biography: string | null; onPress: () => void }) {
  const theme = useTheme();
  const chrome = useProfileChromeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={biography ? "Om meg" : "Skriv om deg selv"}
      accessibilityHint="Endre"
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.75 }}
    >
      <ProfileSurface style={styles.bioCard}>
        {biography ? (
          <Text style={[styles.bioText, { color: theme.onSurface }]}>{biography}</Text>
        ) : (
          <Text style={[styles.bioText, { color: theme.onSurfaceVariant }]}>
            Skriv litt om deg selv, så ser andre det på profilen din.
          </Text>
        )}
        <MaterialCommunityIcons
          name={biography ? "pencil-outline" : "plus"}
          size={18}
          color={chrome.icon}
          style={styles.bioIcon}
        />
      </ProfileSurface>
    </Pressable>
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

function ProfileLoadErrorCard({
  sessionLost,
  isBusy,
  onRetry,
  onRelogin,
}: {
  sessionLost: boolean;
  isBusy: boolean;
  onRetry: () => void;
  onRelogin: () => void;
}) {
  const theme = useTheme();
  const chrome = useProfileChromeColors();
  return (
    <ProfileSurface style={styles.loadErrorCard}>
      <MaterialCommunityIcons
        name={sessionLost ? "account-alert-outline" : "cloud-alert-outline"}
        size={36}
        color={chrome.icon}
      />
      <Text style={[styles.loadErrorTitle, { color: theme.onSurface }]}>Kunne ikke laste profilen din</Text>
      <Text style={[styles.loadErrorText, { color: theme.onSurfaceVariant }]}>
        {sessionLost
          ? "Innloggingen din kunne ikke fornyes. Prøv igjen, eller logg inn på nytt."
          : "Fikk ikke kontakt med Online. Prøv igjen om litt."}
      </Text>
      <View style={styles.loadErrorActions}>
        <RaisedButton flex icon="refresh" label="Prøv igjen" disabled={isBusy} onPress={onRetry} />
        {sessionLost && (
          <RaisedButton flex icon="login" label="Logg inn" tone="accent" disabled={isBusy} onPress={onRelogin} />
        )}
      </View>
    </ProfileSurface>
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


function formatNextEventDate(date: Date): string {
  const value = new Date(date);
  const weekday = value.toLocaleDateString("nb-NO", { weekday: "short" });
  const time = value.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
  return `${weekday} ${time}`;
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
  loggedOutHero: { padding: 18, flexDirection: "row", alignItems: "center", gap: 14 },
  identity: { minWidth: 0, flex: 1 },
  name: { fontSize: 22, lineHeight: 27, fontWeight: "700" },
  loggedOutDescription: { marginTop: 4, fontSize: 13, lineHeight: 18 },
  featureRow: { minHeight: 50, marginHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  featureText: { flex: 1, fontSize: 13, fontWeight: "500" },
  loginAction: { padding: 15, gap: 10 },
  inlineError: { fontSize: 13, textAlign: "center" },
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
  bioCard: { padding: 15, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  bioText: { flex: 1, fontSize: 14, lineHeight: 21 },
  bioIcon: { marginTop: 1 },
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
  loadErrorCard: { padding: 20, alignItems: "center", gap: 8 },
  loadErrorTitle: { marginTop: 4, fontSize: 16, fontWeight: "700", textAlign: "center" },
  loadErrorText: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  loadErrorActions: { alignSelf: "stretch", marginTop: 8, flexDirection: "row", gap: 8 },
  loadingCard: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
});
