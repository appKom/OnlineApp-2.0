export type SongSection = {
  title?: string;
  cue?: string;
  lines: string[];
  note?: string;
};

export type Song = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  rank: "A" | "K" | "Q" | "J";
  suit: "♥" | "♦" | "♣" | "♠";
  sections: SongSection[];
};

export const songs: Song[] = [
  {
    id: "nu-klinger",
    title: "Nu Klinger",
    shortTitle: "Nu Klinger",
    description: "Studentersangen fra den gamle stad",
    rank: "A",
    suit: "♥",
    sections: [
      {
        title: "Vers",
        lines: [
          "Nu klinger igjennom den gamle stad, på ny en studentersang,",
          "og alle mann alle i rekke og rad, svinger opp under begerklang!",
          'Og mens borgerne våker i køya og hører den glade "kang-kang",',
          "synger alle mann, alle mann, alle mann, alle mann, alle mann, alle mann;",
        ],
      },
      {
        title: "Refreng",
        lines: [
          "Studenter i den gamle stad, ta vare på byens ry! (klapp x2)",
          "Husk på at jenter, øl og dram var kjempenes meny.",
          "Og faller I alle mann alle, skal det gjalle fra alle mot sky.",
          "La ikke byen få ro, men la den få merke den er en studenterby.",
          "Og øl og dram, og øl og dram, og øl og dram, og øl og dram.",
        ],
      },
      {
        title: "Vers",
        lines: [
          "I denne gamle staden satt så mangen en konge stor, og hadde nok av øl fra fat og piker ved sitt bord.",
          "Og de laga bøljer i gata når hjem ifra gildet de fór.",
          "Og nu sitter de alle mann alle i valhall og traller til oss i kor;",
        ],
      },
      { title: "Refreng", lines: [] },
      {
        title: "Vers",
        lines: [
          "På Elgeseter var det liv i klosteret dag og natt, der hadde de sin kagge og der hadde de sin skatt.",
          "De herjet i Nonnenes gate og rullet og tullet og datt, og nu skuer de fra himmelen ned og griper sin harpe fatt;",
        ],
      },
      { title: "Refreng", lines: [] },
      {
        title: "Vers",
        cue: "Adagio",
        lines: [
          "Når vi er vandret hen og staden hviler et øyeblikk, (sakte klapp x2)",
          "så kommer våre sønner og tar opp den gamle skikk;",
          "En lek mellom muntre butuljer, samt aldri så litt erotisk.",
        ],
      },
      {
        title: "Vers",
        cue: "Accelerando",
        lines: ["Også sitter vi i himmelen og stemmer i vår replikk;"],
      },
      {
        title: "Refreng",
        lines: [],
        note: 'INGEN ØL OG DRAM ETTER SISTE REFRENG! Men ofte utbrytes det i en "Skål!"',
      },
    ],
  },
  {
    id: "lambo",
    title: "Lambo",
    shortTitle: "Lambo",
    description: "Vekselvise vers for tilskuere og dranker",
    rank: "K",
    suit: "♦",
    sections: [
      {
        title: "Tilskuere (T) synger",
        lines: [
          "T: Se der står en fyllehund,",
          "T: Mine herrer lambo!",
          "T: Sett nu flasken for din munn,",
          "T: Mine herrer lambo!",
          "T: Se hvordan den dråpen vanker ned ad halsen på den dranker",
          "T: Lambo, lambo, mine herrer lambo",
        ],
        note: "Gjentas til enheten er drukket opp.",
      },
      {
        title: "Dranker (D) synger",
        lines: [
          "D: Jeg mitt glass utdrukket har,",
          "T: Mine herrer lambo!",
          "D: Se der fins ei dråpen kvar,",
          "T: Mine herrer lambo!",
          "D: Som bevis der på jeg vender, flasken på dens rette ende",
        ],
        note: "Vender enhet opp ned over hodet som bevis.",
      },
      {
        title: "Tilskuere synger",
        lines: [
          "T: Lambo, lambo, mine herrer lambo",
          "T: Han/hun kunne kunsten å være et jævla fyllesvin.",
          "T: Så går vi til baren hen og sjenker oss en tår (hey!).",
        ],
      },
    ],
  },
  {
    id: "fader-abraham",
    title: "Fader Abraham",
    shortTitle: "Fader\nAbraham",
    description: "Bevegelsessang i syv runder",
    rank: "Q",
    suit: "♣",
    sections: [
      {
        lines: [
          "Fader abraham har fire sønner, ja fire sønner, har Fader Abraham!",
          "Også drakk de litt (drikk)",
          "Også drakk de litt (drikk)",
          "Og de moret seg og sang; “Høyre arm”",
        ],
      },
      {
        lines: [
          "Fader abraham har fire sønner, ja fire sønner, har Fader Abraham!",
          "Også drakk de litt (drikk)",
          "Også drakk de litt (drikk)",
          "Og de moret seg og sang; “Høyre arm, venstre arm”",
        ],
      },
      {
        lines: [
          "Fader abraham har fire sønner, ja fire sønner, har Fader Abraham!",
          "Også drakk de litt (drikk)",
          "Også drakk de litt (drikk)",
          "Og de moret seg og sang; “Høyre arm, venstre arm, høyre fot”",
        ],
      },
      {
        lines: [
          "Fader abraham har fire sønner, ja fire sønner, har Fader Abraham!",
          "Også drakk de litt (drikk)",
          "Også drakk de litt (drikk)",
          "Og de moret seg og sang; “Høyre arm, venstre arm, høyre fot, venstre fot”",
        ],
      },
      {
        lines: [
          "Fader abraham har fire sønner, ja fire sønner, har Fader Abraham!",
          "Også drakk de litt (drikk)",
          "Også drakk de litt (drikk)",
          "Og de moret seg og sang; “Høyre arm, venstre arm, høyre fot, venstre fot, rumpa ut”",
        ],
      },
      {
        lines: [
          "Fader abraham har fire sønner, ja fire sønner, har Fader Abraham!",
          "Også drakk de litt (drikk)",
          "Også drakk de litt (drikk)",
          "Og de moret seg og sang; “Høyre arm, venstre arm, høyre fot, venstre fot, rumpa ut, kroppen frem”",
        ],
      },
      {
        lines: [
          "Fader abraham har fire sønner, ja fire sønner, har Fader Abraham!",
          "Også drakk de litt (drikk)",
          "Også drakk de litt (drikk)",
          "Og de moret seg og sang; “Høyre arm, venstre arm, høyre fot, venstre fot, rumpa ut, kroppen frem, tunga ut”",
        ],
      },
    ],
  },
  {
    id: "we-like-to-drink",
    title: "We like to drink with",
    shortTitle: "We like to\ndrink with",
    description: "Engelsk drikkevise med nedtelling",
    rank: "J",
    suit: "♠",
    sections: [
      {
        lines: [
          "We like to drink with NAVN",
          "'Cause NAVN is our mate!",
          "And when we drink with NAVN",
          "He/she gets it down in 8!",
          "7!",
          "6!",
          "5!",
          "4!",
          "3!",
          "2!",
          "1!",
        ],
      },
    ],
  },
];
