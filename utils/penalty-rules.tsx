import React from "react"
import { View, Text, StyleSheet, Image } from "react-native"
import { useTheme } from "./theme"

export const PenaltyRules = () => {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <WhatIsAMark theme={theme} />
      <WhatGivesAMark theme={theme} />
      <CancellationPolicy theme={theme} />
      <WaitlistPolicy theme={theme} />
      <PaymentPolicy theme={theme} />
      <BehaviorPolicy theme={theme} />
      <CompanyEventPolicy theme={theme} />
      <WhyHaveIGotMarks theme={theme} />
    </View>
  )
}

const WhatIsAMark = ({ theme }: { theme: ReturnType<typeof useTheme> }) => (
  <View style={styles.section}>
    <Text style={[styles.title, { color: theme.onPrimaryContainer }]}>Hva er en prikk?</Text>
    <Text style={[styles.text, { color: theme.onPrimaryContainer }]}>
      Prikker er et straffetiltak for å sikre at medlemmene av Online følger reglene. Det at du har aktive prikker
      innebærer at du vil måtte vente en viss periode etter ordinær påmeldingsstart for å melde deg på et arrangement.
      Hver prikk varer i 14 dager fra tidspunktet du får den.
    </Text>

    <MarkTable theme={theme} />
    <Text style={[styles.text, { color: theme.onPrimaryContainer }]}>
      Prikker er overlappende. Dette betyr at dersom du får nye prikker når du allerede har aktive prikker fra en annen
      anledning, så vil disse prikkene plusses sammen. Hver anledning som har gitt deg prikker vil ha sin egen levetid
      før de ikke er aktive lenger.
    </Text>

    <Text style={[styles.subtitle, { color: theme.onPrimaryContainer }]}>Eksempel</Text>
    <Text style={[styles.text, { color: theme.onPrimaryContainer }]}>
      Du får 2 prikker for å melde deg av et arrangement sent. Nå har du fire timers utsettelse på alle påmeldinger.
      Fire dager senere får du to nye prikker for å ikke ha sendt inn tilbakemeldingsskjema innen tidsfristen. Nå vil du
      i ti dager fremover ha totalt 4 aktive prikker og dermed ha 24 timers utsettelse på alle påmeldinger. Etter disse
      ti dagene vil de to første prikkene løpe ut og du vil da kun ha to aktive prikker i fire dager. Dette medfører
      fire timers utsettelse på påmeldinger.
    </Text>

    <Text style={[styles.text, { color: theme.onPrimaryContainer }]}>Eksempelet visualisert:</Text>
    <Image
      source={{ uri: "https://s3.eu-north-1.amazonaws.com/cdn.online.ntnu.no/web/prikkeregler-visualisation.png" }}
      style={styles.image}
    />

    <Text style={[styles.subtitle, { color: theme.onPrimaryContainer }]}>Ferier</Text>
    <Text style={[styles.text, { color: theme.onPrimaryContainer }]}>
      Varigheten til prikker er fryst i ferier. Disse er definert fra 5. desember til 10. januar og 1. juni til 15.
      august. Dersom en prikk gis 24. mai vil altså denne prikken utløpe 20. august.
    </Text>
  </View>
)

const WhatGivesAMark = ({ theme }: { theme: ReturnType<typeof useTheme> }) => (
  <View style={styles.section}>
    <Text style={[styles.title, { color: theme.onPrimaryContainer }]}>Hva gir prikker?</Text>
    <Text style={[styles.text, { color: theme.onPrimaryContainer }]}>Dette er en kort punktliste. Unntak og videre forklaringer finner du lenger ned.</Text>
    <View style={styles.list}>
      <BulletPoint theme={theme} text="Å melde seg av etter avmeldingsfristen inntil 2 timer før arrangementstart gir 2 prikker, etter dette gis det 3 prikker." />
      <BulletPoint theme={theme} text="Å ikke møte opp på et arrangement man har plass på gir 3 prikker." />
      <BulletPoint theme={theme} text="Å møte opp etter arrangementets start eller innslipp er ferdig gir i utgangspunktet 3 prikker. Her vil en skjønnsmessig vurdering bli foretatt ut fra hvor sent deltakeren ankom arrangementet." />
      <BulletPoint theme={theme} text="Å ikke svare på tilbakemeldingsskjema innen tidsfristen gir 2 prikker." />
      <BulletPoint theme={theme} text="Å ikke overholde betalingsfristen gir 1 prikk. Dette medfører i tillegg suspensjon fra alle Onlines arrangementer inntil betaling er gjennomført." />
    </View>
    <Text style={[styles.text, { color: theme.onPrimaryContainer }]}>Den ansvarlige komiteen kan også foreta en skjønnsmessig vurdering som gagner deltakeren.</Text>
  </View>
)

const CancellationPolicy = ({ theme }: { theme: ReturnType<typeof useTheme> }) => (
  <View style={styles.section}>
    <Text style={[styles.title, { color: theme.onPrimaryContainer }]}>Avmelding</Text>
    <View style={styles.list}>
      <BulletPoint theme={theme} text="Ved sykdom eller andre ekstraordinære hendelser vil man ikke få prikk ved avmelding 5 timer før arrangementsstart. Etter dette gis prikker som normalt iht. punktene over." />
      <BulletPoint theme={theme} text="Alle komiteer ønsker at du melder deg av arrangementer selv om du vet dette vil medføre prikker. Dette er slik at noen andre kan bli obs på plassen sin så tidlig som mulig." />
    </View>
  </View>
)

const WaitlistPolicy = ({ theme }: { theme: ReturnType<typeof useTheme> }) => (
  <View style={styles.section}>
    <Text style={[styles.title, { color: theme.onPrimaryContainer }]}>Venteliste</Text>
    <View style={styles.list}>
      <BulletPoint theme={theme} text="Hvis du står på venteliste kan du melde deg av helt til avmeldingsfristen." />
      <BulletPoint theme={theme} text="Når du står på venteliste er du inneforstått med at du når som helst kan få plass på arrangementet og dermed er bundet til reglene for arrangementet på lik linje med andre påmeldte." />
    </View>
  </View>
)

const PaymentPolicy = ({ theme }: { theme: ReturnType<typeof useTheme> }) => (
  <View style={styles.section}>
    <Text style={[styles.title, { color: theme.onPrimaryContainer }]}>Betaling</Text>
    <View style={styles.list}>
      <BulletPoint theme={theme} text="Ved manglende betaling suspenderes man fra alle Onlines arrangementer inntil betalingen er gjennomført." />
      <BulletPoint theme={theme} text="Ved betalt arrangement, men manglende oppmøte, vil man ikke få tilbakebetalt dersom avmelding skjer etter frist. Dersom neste på venteliste er tilgjengelig kan dette gjøres unntak for." />
    </View>
  </View>
)

const BehaviorPolicy = ({ theme }: { theme: ReturnType<typeof useTheme> }) => (
  <View style={styles.section}>
    <Text style={[styles.title, { color: theme.onPrimaryContainer }]}>Oppførsel</Text>
    <View style={styles.list}>
      <BulletPoint theme={theme} text="Ved upassende oppførsel under et av Onlines arrangement vil du stå økonomisk ansvarlig for eventuelle skader, og i verste fall risikere utestengelse fra alle Onlines arrangement." />
    </View>
  </View>
)

const CompanyEventPolicy = ({ theme }: { theme: ReturnType<typeof useTheme> }) => (
  <View style={styles.section}>
    <Text style={[styles.title, { color: theme.onPrimaryContainer }]}>Bedriftsarrangementer</Text>
    <View style={styles.list}>
      <BulletPoint theme={theme} text="Ved bedriftsarrangementer åpner dørene i henhold til starttid på arrangementet. Ti minutter etter at dørene åpner slippes oppmøte på ventelisten inn dersom det er plass. 15 minutter etter at dørene åpner stenger innslippet." />
      <BulletPoint theme={theme} text="Det kreves at en deltaker svarer på den elektroniske tilbakemeldingen etter bedriftsarrangementer. Det vil komme e-post etter arrangementet med lenke til tilbakemeldingsskjema som må besvares innen den oppgitte fristen. Dersom en deltaker ikke svarer innen fristen, vil dette gi to prikker." />
      <BulletPoint theme={theme} text="Deltakere på bedriftsarrangementer skal delta på alle obligatoriske deler av arrangementet. For bedriftspresentasjon og kurs vil dette henholdsvis innebære selve presentasjonen og kursopplegget. De første 45 minuttene med påfølgende mingling regnes også som obligatorisk. Dersom en deltaker forlater den obligatoriske delen uten gyldig grunn vil dette medføre 2 prikker." />
    </View>
  </View>
)

const WhyHaveIGotMarks = ({ theme }: { theme: ReturnType<typeof useTheme> }) => (
  <View style={styles.section}>
    <Text style={[styles.title, { color: theme.onPrimaryContainer }]}>Hvorfor har jeg fått prikk?</Text>
    <Text style={[styles.text, { color: theme.onPrimaryContainer }]}>
      Dersom du mener noe feil har skjedd, vennligst ta kontakt med arrangøren som står oppført på arrangementet.
      Kontaktinfo for arrangerende komité vises på arrangementssiden.
    </Text>
  </View>
)

const BulletPoint = ({ theme, text }: { theme: ReturnType<typeof useTheme>; text: string }) => (
  <View style={styles.bulletPoint}>
    <Text style={[styles.bullet, { color: theme.onPrimaryContainer }]}>•</Text>
    <Text style={[styles.bulletText, { color: theme.onPrimaryContainer }]}>{text}</Text>
  </View>
)

const MarkTable = ({ theme }: { theme: ReturnType<typeof useTheme> }) => (
  <View style={[styles.table, { borderColor: theme.onSurfaceVariant }]}>
    <View style={[styles.tableRow, styles.tableHeader]}>
      <Text style={[styles.tableHeaderCell, { color: theme.onPrimaryContainer }]}>Antall prikker</Text>
      <Text style={[styles.tableHeaderCell, { color: theme.onPrimaryContainer }]}>Utsettelse</Text>
    </View>
    <View style={[styles.tableRow, { borderBottomColor: theme.onSurfaceVariant }]}>
      <Text style={[styles.tableCell, { color: theme.onPrimaryContainer }]}>1 prikk</Text>
      <Text style={[styles.tableCell, { color: theme.onPrimaryContainer }]}>1t</Text>
    </View>
    <View style={[styles.tableRow, { borderBottomColor: theme.onSurfaceVariant }]}>
      <Text style={[styles.tableCell, { color: theme.onPrimaryContainer }]}>2 prikker</Text>
      <Text style={[styles.tableCell, { color: theme.onPrimaryContainer }]}>4t</Text>
    </View>
    <View style={[styles.tableRow, { borderBottomColor: theme.onSurfaceVariant }]}>
      <Text style={[styles.tableCell, { color: theme.onPrimaryContainer }]}>3 prikker</Text>
      <Text style={[styles.tableCell, { color: theme.onPrimaryContainer }]}>24t</Text>
    </View>
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, { color: theme.onPrimaryContainer }]}>6+ prikker</Text>
      <Text style={[styles.tableCell, { color: theme.onPrimaryContainer }]}>Suspensjon 14d</Text>
    </View>
  </View>
)

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  section: {
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
  list: {
    gap: 8,
  },
  bulletPoint: {
    flexDirection: "row",
    gap: 8,
  },
  bullet: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  table: {
    borderWidth: 1,
    borderRadius: 4,
    marginVertical: 8,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tableHeader: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 8,
    fontWeight: "600",
    fontSize: 12,
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 12,
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginVertical: 12,
  },
})

export default PenaltyRules
