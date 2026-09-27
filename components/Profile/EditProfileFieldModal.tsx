import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from "react-native";
import type { User } from "../../types/user";
import Authenticator from "../../utils/authenticator";
import { setPendingEmailChange } from "../../utils/email-change";
import { getUser, requestEmailChange, updateUser } from "../../utils/trpc";
import { getGenderName } from "../../utils/user-utils";
import { AnimatedModal } from "../AnimatedModal";
import { ChoiceTrack, Panel, PanelHeader, RaisedButton, usePanelChromeColors } from "../Panel";

export type EditableField = "email" | "phone" | "gender" | "dietaryRestrictions" | "biography";

const GENDERS: User["gender"][] = ["FEMALE", "MALE", "NON_BINARY", "OTHER", "UNKNOWN"];

// Limits and patterns from monoweb's UserWriteSchema, so mistakes are caught before the request.
const PHONE_REGEX = /^[0-9-+\s]*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TextFieldConfig = {
  title: string;
  placeholder: string;
  hint?: string;
  maxLength: number;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  validate?: (value: string) => string | null;
};

const TEXT_FIELDS: Record<Exclude<EditableField, "gender">, TextFieldConfig> = {
  email: {
    title: "E-post",
    placeholder: "navn@eksempel.no",
    hint: "Kan hende du må bekrefte den nye adressen via en lenke på e-post.",
    maxLength: 128,
    keyboardType: "email-address",
    validate: (value) => (EMAIL_REGEX.test(value) ? null : "Ugyldig e-post"),
  },
  phone: {
    title: "Telefon",
    placeholder: "+47 999 88 777",
    maxLength: 32,
    keyboardType: "phone-pad",
    validate: (value) => (PHONE_REGEX.test(value) ? null : "Telefonnummeret kan bare inneholde tall, +, - og mellomrom"),
  },
  dietaryRestrictions: {
    title: "Kosthold og allergier",
    placeholder: "F.eks. vegetar, nøtteallergi",
    maxLength: 200,
    multiline: true,
  },
  biography: {
    title: "Om meg",
    placeholder: "Skriv litt om deg selv",
    maxLength: 2000,
    multiline: true,
  },
};

/** tRPC puts zod issues in the message as JSON; show the first one's text. */
function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  try {
    const issues = JSON.parse(message);
    if (Array.isArray(issues) && typeof issues[0]?.message === "string") return issues[0].message as string;
  } catch {}
  return message || "Noe gikk galt. Prøv igjen.";
}

export function EditProfileFieldModal({
  field,
  user,
  onClose,
}: {
  field: EditableField | null;
  user: User;
  onClose: () => void;
}) {
  // Keep the last field while the close animation runs.
  const [shown, setShown] = useState(field);
  useEffect(() => {
    if (field) setShown(field);
  }, [field]);

  return (
    <AnimatedModal visible={field !== null} onClose={onClose} modalWidth="92%" modalMaxWidth={420}>
      {(close) =>
        shown === "gender" ? (
          <GenderEditor user={user} onDone={close} />
        ) : shown ? (
          <TextEditor key={shown} field={shown} user={user} onDone={close} />
        ) : null
      }
    </AnimatedModal>
  );
}

function TextEditor({
  field,
  user,
  onDone,
}: {
  field: Exclude<EditableField, "gender">;
  user: User;
  onDone: () => void;
}) {
  const chrome = usePanelChromeColors();
  const config = TEXT_FIELDS[field];
  const initial = user[field] ?? "";
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSentTo, setVerificationSentTo] = useState<string | null>(null);

  const trimmed = value.trim();
  const changed = trimmed !== initial.trim();

  const save = async () => {
    if (!changed) return onDone();
    const invalid = trimmed && config.validate ? config.validate(trimmed) : null;
    if (invalid) return setError(invalid);
    if (field === "email" && !trimmed) return setError("Du må ha en e-post");

    setSaving(true);
    setError(null);
    try {
      if (field === "email") {
        const { verificationSent } = await requestEmailChange(trimmed);
        if (verificationSent) {
          // The address only changes once the link is clicked; the profile syncs it from Auth0 then.
          await setPendingEmailChange(trimmed);
          setVerificationSentTo(trimmed);
          return;
        }
        Authenticator.setUser((await getUser()) ?? user);
      } else {
        const updated = await updateUser(user.id, { [field]: trimmed || null });
        Authenticator.setUser({ ...user, ...updated });
      }
      onDone();
    } catch (saveError) {
      setError(readableError(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (verificationSentTo) {
    return (
      <Panel style={styles.panel}>
        <PanelHeader title="Bekreft ny e-post" />
        <View style={styles.notice}>
          <MaterialCommunityIcons name="email-check-outline" size={20} color={chrome.success} />
          <Text style={[styles.noticeText, { color: chrome.text }]}>
            Vi har sendt en bekreftelseslenke til {verificationSentTo}. Klikk lenken for å ta i bruk den nye adressen.
          </Text>
        </View>
        <RaisedButton label="OK" tone="accent" onPress={onDone} />
      </Panel>
    );
  }

  return (
    <Panel style={styles.panel}>
      <PanelHeader title={config.title} />
      <View>
        <TextInput
          autoFocus
          value={value}
          onChangeText={(text) => {
            setValue(text);
            setError(null);
          }}
          placeholder={config.placeholder}
          placeholderTextColor={chrome.textMuted}
          keyboardType={config.keyboardType}
          autoCapitalize={field === "email" ? "none" : "sentences"}
          autoCorrect={field !== "email" && field !== "phone"}
          textContentType={field === "email" ? "emailAddress" : field === "phone" ? "telephoneNumber" : "none"}
          multiline={config.multiline}
          maxLength={config.maxLength}
          // A returnKeyType on the phone pad makes React Native add a "Done" toolbar above it.
          returnKeyType={config.multiline || field === "phone" ? undefined : "done"}
          onSubmitEditing={config.multiline ? undefined : save}
          style={[
            styles.input,
            config.multiline && (field === "biography" ? styles.inputTall : styles.inputMedium),
            {
              color: chrome.text,
              backgroundColor: chrome.recessed,
              borderColor: error ? chrome.danger : chrome.edge,
              borderBottomColor: error ? chrome.danger : chrome.highlight,
            },
          ]}
        />
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: error ? chrome.danger : chrome.textMuted }]}>
            {error ?? config.hint ?? ""}
          </Text>
          {config.multiline && (
            <Text style={[styles.counter, { color: chrome.textMuted }]}>
              {value.length}/{config.maxLength}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <RaisedButton flex label="Avbryt" onPress={onDone} />
        <RaisedButton
          flex
          icon="check"
          label={saving ? "Lagrer…" : "Lagre"}
          tone="accent"
          disabled={saving}
          onPress={save}
        />
      </View>
    </Panel>
  );
}

function GenderEditor({ user, onDone }: { user: User; onDone: () => void }) {
  const chrome = usePanelChromeColors();
  const [value, setValue] = useState(user.gender);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (value === user.gender) return onDone();
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUser(user.id, { gender: value });
      Authenticator.setUser({ ...user, ...updated });
      onDone();
    } catch (saveError) {
      setError(readableError(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel style={styles.panel}>
      <PanelHeader title="Kjønn" />
      <ChoiceTrack
        options={GENDERS.map((gender) => ({ value: gender, label: getGenderName(gender) }))}
        value={value}
        onChange={setValue}
      />
      {error && <Text style={[styles.metaText, { color: chrome.danger }]}>{error}</Text>}
      <View style={styles.actions}>
        <RaisedButton flex label="Avbryt" onPress={onDone} />
        <RaisedButton
          flex
          icon="check"
          label={saving ? "Lagrer…" : "Lagre"}
          tone="accent"
          disabled={saving}
          onPress={save}
        />
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 14 },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 15,
    lineHeight: 20,
  },
  inputMedium: { minHeight: 96, textAlignVertical: "top" },
  inputTall: { minHeight: 160, maxHeight: 260, textAlignVertical: "top" },
  meta: { minHeight: 18, marginTop: 6, flexDirection: "row", gap: 10 },
  metaText: { flex: 1, fontSize: 12, lineHeight: 16 },
  counter: { fontSize: 12, fontVariant: ["tabular-nums"] },
  notice: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 8 },
});
