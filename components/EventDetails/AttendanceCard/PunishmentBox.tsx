import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native"
import type { Punishment } from "../../../types/punishment"
import { Ionicons, FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme, withAlpha, elevate } from "utils/theme";

interface Props {
  punishment: Punishment
}

export const PunishmentBox: React.FC<Props> =  ({ punishment }) => {
  const theme = useTheme();

  if (punishment.suspended) {
    return (
      <View >
        <View >
          <Ionicons name="alert-circle"/>
          <Text>Du er suspendert</Text>
        </View>

        <Text>
          Gå til profilen din på OW for å se detaljer.
        </Text>
      </View>
    )
  }

  return (
    <View style={{backgroundColor: theme.errorContainer, padding: 15, borderRadius: 12, gap: 5}}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
        <Ionicons name="alert-circle" color={theme.onErrorContainer} size={17}/>
        <Text style={{ fontSize: 16, color: theme.onErrorContainer }}>{punishment.delay} timer utsatt påmelding pga. prikk</Text>
      </View>

      <Text style={{ color: theme.onErrorContainer }}>
        Du <Text style={{ fontWeight: 'bold' }}>kan fortsatt melde deg på</Text> ved påmeldingsstart,{'\n'}
        men du vil være i venteliste til utsettelsen er over.
      </Text>

      <Text style={{ color: theme.onErrorContainer }}>
          Gå til profilen din på OW for å se detaljer.
      </Text>
    </View>
  )
}

export default PunishmentBox
