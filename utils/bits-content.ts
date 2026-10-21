export type BitsCategory = "online" | "point" | "never" | "dilemma" | "challenge" | "category" | "rule" | "back-to-back";

export type BitsTemplate = {
  id: string;
  category: Exclude<BitsCategory, "back-to-back">;
  title: string;
  body: string;
};

export const BITS_CATEGORY_LABELS: Record<BitsCategory, string> = {
  online: "Online", point: "Pekelek", never: "Jeg har aldri", dilemma: "Dilemma",
  challenge: "Utfordring", category: "Kategori", rule: "Ny regel", "back-to-back": "Rygg til rygg",
};

// Original BITS themes, adapted for short rounds, plus new party-game prompts.
// Player placeholders are resolved once when dealing, so going back never changes names.
export const BITS_TEMPLATES: readonly BitsTemplate[] = [
  { id: "fadderuke", category: "online", title: "Fadderuke", body: "{player}, fortell en funfact om to andre rundt bordet. De får rette på deg etterpå." },
  { id: "toga", category: "challenge", title: "Togafest", body: "{player}, presenter et valgfritt plagg som om det var årets store mote. Du har 20 sekunder." },
  { id: "micro", category: "online", title: "Kontoret", body: "{player}, forsvar hvorfor du glemte lokk i mikroen. Bordet avgjør om unnskyldningen holder. Hvis ikke: én slurk." },
  { id: "interview", category: "challenge", title: "Jobbintervju", body: "{other} intervjuer {player} til jobben som sjef for vorset. Still to spørsmål og avgjør om kandidaten får jobben." },
  { id: "blatur", category: "online", title: "Blåtur", body: "{player}, beskriv drømmedestinasjonen for neste blåtur uten å si navnet. Første som gjetter får dele ut én slurk." },
  { id: "surf", category: "challenge", title: "Surfetur med X-sport", body: "{player}, vis hvordan du surfer. {other} lager lydeffektene. Hold showet gående i 15 sekunder." },
  { id: "bedpres", category: "online", title: "Bedpres", body: "{player}, selg bordet en helt ubrukelig app på 20 sekunder. De som ville lastet den ned, rekker opp hånda." },
  { id: "julebord", category: "online", title: "Julebord", body: "{player}, hold en 30 sekunders tale om hvorfor {other} fortjener å bli årets nisse." },
  { id: "oktober", category: "online", title: "Oktoberfest", body: "Alle skåler med personen de har kjent kortest. Fortell hverandre hvor dere møttes." },
  { id: "ow", category: "online", title: "OW er nede", body: "{player}, forklar hvorfor OW er nede uten å bruke ordene «server», «bug» eller «kode». Bordet tar tiden: 20 sekunder." },
  { id: "swap", category: "challenge", title: "Swap", body: "{player} og {other} bytter måte å snakke på fram til neste kort. Resten av bordet får gjette hvem som er hvem." },
  { id: "ol", category: "challenge", title: "Vinter-OL", body: "{player}, vis en vintersport uten lyd. Den første som gjetter velger neste sport for {other}." },
  { id: "old-young", category: "online", title: "Gammel og ung", body: "Den eldste og yngste forteller hver sin ting de andre kanskje ikke vet om studietiden deres." },
  { id: "kok", category: "online", title: "Kok", body: "{player}, forklar et oppdiktet fagbegrep med full selvtillit. {other} finner på begrepet." },
  { id: "exam", category: "online", title: "Eksamensfest", body: "Alle sier ett ord som beskriver siste eksamensperiode. Like svar? Dere skåler sammen." },
  { id: "rizz", category: "challenge", title: "Har du rizz?", body: "{player}, prøv å selge {other} en date med en fiktiv robot. Bordet gir sjekkereplikken terningkast." },
  { id: "immball", category: "online", title: "Immball", body: "{player}, finn på kveldens mest høytidelige pris og del den ut til noen ved bordet. Hold en kort begrunnelse." },
  { id: "kiosk", category: "point", title: "Kioskkongen", body: "Hvem burde hatt eget klippekort i kiosken? Tell ned fra tre og pek samtidig. Flest pek tar én slurk." },
  { id: "late", category: "point", title: "Akademisk kvarter", body: "Hvem skriver «er der om fem» før de har gått hjemmefra? Pek samtidig. Den utpekte må holde forsvarstale." },
  { id: "aux", category: "point", title: "Hvem får AUX?", body: "Hvem stoler dere minst på med musikken? Pek samtidig. Den utpekte får velge én sang som forsvar." },
  { id: "sofa", category: "point", title: "Kontorsofaen", body: "Hvem ville flyttet inn på kontoret hvis det var lov? Pek samtidig. Flest pek deler ut én slurk." },
  { id: "quiz", category: "point", title: "Quizmesteren", body: "Hvem er mest skråsikker på feil svar? Pek samtidig. Den utpekte stiller bordet et quizspørsmål." },
  { id: "trip", category: "point", title: "Reiselederen", body: "Hvem ville mistet resten av gruppa på blåtur? Pek samtidig. Den utpekte velger sin medansvarlige." },
  { id: "debug", category: "point", title: "Bare én liten feil", body: "Hvem ville feilsøkt lydanlegget midt på dansegulvet? Pek samtidig. Flest pek tar én slurk." },
  { id: "host", category: "point", title: "Vorsverten", body: "Hvem hadde arrangert det beste vorset på ti minutters varsel? Pek samtidig og gi vinneren applaus." },
  { id: "never-lecture", category: "never", title: "Riktig forelesning?", body: "Jeg har aldri satt meg i feil forelesning og blitt sittende. De som har gjort det, tar én slurk." },
  { id: "never-tab", category: "never", title: "For mange faner", body: "Jeg har aldri åpnet en ny fane for å finne ut hva jeg egentlig holdt på med. De som har gjort det, tar én slurk." },
  { id: "never-ai", category: "never", title: "Forklar som om jeg er fem", body: "Jeg har aldri bedt en chatbot forklare noe jeg nettopp sa at jeg forsto. De som har gjort det, tar én slurk." },
  { id: "never-deadline", category: "never", title: "23:59", body: "Jeg har aldri levert en øving i siste minutt. De som har gjort det, tar én slurk og forteller hvor nærme det var." },
  { id: "never-name", category: "never", title: "Du også her!", body: "Jeg har aldri hatt en hel samtale med noen uten å huske navnet deres. De som har gjort det, tar én slurk." },
  { id: "never-snooze", category: "never", title: "Bare fem minutter", body: "Jeg har aldri forsovet meg til noe som startet etter klokka tolv. De som har gjort det, tar én slurk." },
  { id: "never-mute", category: "never", title: "Du er på mute", body: "Jeg har aldri snakket lenge i et digitalt møte mens mikrofonen var av. De som har gjort det, tar én slurk." },
  { id: "never-song", category: "never", title: "Helt riktig tekst", body: "Jeg har aldri sunget feil sangtekst med full selvtillit. De som har gjort det, gir et lite eksempel." },
  { id: "dilemma-phone", category: "dilemma", title: "Velg en side", body: "A: Alltid ha én prosent batteri. B: Alltid ha tregt nett. Pek til venstre for A, høyre for B. Mindretallet tar én slurk." },
  { id: "dilemma-study", category: "dilemma", title: "Studentlivet", body: "A: Bare morgenforelesninger. B: Bare fredagseksamener. Velg samtidig. {player} må forsvare sitt valg." },
  { id: "dilemma-music", category: "dilemma", title: "På repeat", body: "A: Samme sang på hvert vors. B: Aldri få velge musikk igjen. Velg samtidig. Mindretallet tar én slurk." },
  { id: "dilemma-code", category: "dilemma", title: "Produksjonsklart", body: "A: Kode uten kopier og lim inn. B: Kode uten angreknapp. Velg samtidig og finn en du er uenig med." },
  { id: "dilemma-food", category: "dilemma", title: "Nattmat", body: "A: Alltid kald pizza. B: Alltid lunken kebab. Velg samtidig. {player} får 20 sekunder til å overbevise bordet." },
  { id: "dilemma-mind", category: "dilemma", title: "Superkraft", body: "A: Lese tanker i ti sekunder om dagen. B: Spole tilbake ti sekunder om dagen. Velg og forklar når dere ville brukt kraften." },
  { id: "dilemma-campus", category: "dilemma", title: "Campus", body: "A: Alltid finne en ledig leseplass. B: Alltid slippe kø i kantina. Velg samtidig. Flertallet bestemmer hva dere burde prioritere." },
  { id: "challenge-ad", category: "challenge", title: "Reklamepause", body: "{player}, lag en reklame for tingen nærmest {other}. Du har 20 sekunder og må få inn ordet «revolusjonerende»." },
  { id: "challenge-rhyme", category: "challenge", title: "Rimduell", body: "{player} og {other}: Bytt på å rime på «fest». Første som gjentar et ord eller bruker mer enn fem sekunder, tar én slurk." },
  { id: "challenge-story", category: "challenge", title: "Én setning hver", body: "{player} starter en historie med én setning. Gå rundt bordet og legg til én setning hver. {other} avslutter historien." },
  { id: "challenge-imitate", category: "challenge", title: "Foreleseren", body: "{player}, forklar hvordan man lager en brødskive som om det var en avansert forelesning. {other} stiller et oppfølgingsspørsmål." },
  { id: "category-city", category: "category", title: "Norske byer", body: "{player} starter. Si en norsk by hver, med klokka. Ingen gjentakelser og maks fem sekunder å tenke. Første som stopper opp, tar én slurk." },
  { id: "category-app", category: "category", title: "Apper på mobilen", body: "{player} starter. Nevn en app hver, med klokka. Ingen gjentakelser. Første som står fast i fem sekunder, tar én slurk." },
  { id: "category-course", category: "category", title: "Fag på NTNU", body: "{player} starter. Nevn et fag eller en emnekode hver. Ingen gjentakelser. Bordet avgjør tvilstilfellene." },
  { id: "category-food", category: "category", title: "Studentmiddag", body: "{player} starter. Nevn en middag som kan lages på under 15 minutter. Ingen gjentakelser. Første som står fast, tar én slurk." },
  { id: "category-language", category: "category", title: "Programmeringsspråk", body: "{player} starter. Nevn et programmeringsspråk hver. Ingen gjentakelser. Dere har fem sekunder per svar." },
  { id: "category-band", category: "category", title: "Festivalplakaten", body: "{player} starter. Nevn en artist eller et band hver. Ingen gjentakelser. Første som bruker mer enn fem sekunder, tar én slurk." },
  { id: "category-excuse", category: "category", title: "Gode unnskyldninger", body: "{player} starter. Finn på en unnskyldning for å komme sent. Ingen gjentakelser. Bordet kan underkjenne dårlige kopier." },
  { id: "rule-names", category: "rule", title: "Kallenavn", body: "Alle bruker et selvvalgt kallenavn. Vanlige fornavn er forbudt. Glemmer du deg, tar du én slurk." },
  { id: "rule-cheers", category: "rule", title: "Høytidelig skål", body: "Før hver skål må noen si «til ære for bordet». Glemmer dere det, prøver dere skålen på nytt." },
  { id: "rule-thumb", category: "rule", title: "Tommelmester", body: "{player} er tommelmester. Når tommelen deres ligger på bordet, må alle følge etter. Sistemann tar én slurk." },
  { id: "rule-question", category: "rule", title: "Godt spørsmål", body: "Hver gang noen stiller et spørsmål, begynner svaret med «godt spørsmål». Glemmer du deg, tar du én slurk." },
  { id: "rule-title", category: "rule", title: "Deres majestet", body: "{player} skal tiltales «Deres majestet». Glemmer du tittelen, gir du en overdreven unnskyldning." },
];

export const BITS_BACK_TO_BACK_QUESTIONS = [
  "Hvem kommer oftest for sent?", "Hvem er mest konkurransemenneske?",
  "Hvem bruker lengst tid på å gjøre seg klar?", "Hvem hadde klart seg best uten mobil?",
  "Hvem tar oftest kontroll over musikken?", "Hvem forteller de lengste historiene?",
  "Hvem er mest på A4?", "Hvem synes selv de er morsomst?",
] as const;
