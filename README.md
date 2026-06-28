# Sea Hunter — *Leviathans of the Twelve Seas*

> Moderni, laajempi henkinen seuraaja Segan klassikolle **The Ocean Hunter (1998)**.
> Rail shooter, jossa metsästät jättiläismäisiä myyttisiä merihirviöitä — pelattavissa
> sekä puhelimella että tietokoneella suoraan selaimessa.

**Työnimi:** Sea Hunter (vaihtoehdot: *Abyssal*, *Leviathan: Twelve Seas*, *Tides of the Deep*)
**Genre:** On-rails harppuuna-/valokiväärishooter + kevyt progressio (roguelite-vivahteita)
**Alustat:** Web (PWA), Android, iOS, Windows/Mac/Linux — yksi koodipohja
**Pelaajat:** 1 pelaaja + 2 pelaajan co-op (paikallinen ja online)
**Pelin kieli:** **englanti** — kaikki pelin sisäinen sisältö (UI, tekstit, hahmo- ja hirviönimet, tarina, ääninäyttely). Suunnitteludokumentit ovat suomeksi tiimin käyttöön.
**Inspiraatio:** The Ocean Hunter (Sega AM1, 1998)

---

## Visio yhdellä lauseella

> *Matkusta maailman kahdellatoista merellä, sukella muinaisten hylkyjen ja
> hehkuvien syvyyksien läpi ja kaada jokaisen meren legendaarinen apex-hirviö —
> harppuuna kädessä, kelloa ja terveyttä vastaan, yksin tai kaverin kanssa.*

## Mitä tämä on (ja miten se eroaa alkuperäisestä)

The Ocean Hunter oli upea mutta lyhyt kolikkopeli: 7 merta, 7 hirviötä, ~30 min
läpipeluu. Tämä suunnitelma säilyttää sen ytimen — **liikkeen on-rails, sinä tähtäät
ja ammut, jättihirviöt ovat tähtinä** — mutta laajentaa sisällön moninkertaiseksi
ja tekee siitä modernin, mobiiliystävällisen ja toistettavan.

| | The Ocean Hunter (1998) | Sea Hunter (tämä) |
|---|---|---|
| Alueita | 7 merta | **12 merta** + piilotetut alueet |
| Pohja-hirviöt | 7 | **12 apex-hirviötä + 8 piilohirviötä** |
| Kesto | ~30 min | **8–12 h tarinakampanja** + loputtomat moodit |
| Progressio | ei (arcade) | **alus-tukikohta, ase- ja varustepuu, kyvyt** |
| Toistettavuus | high score | **New Game+, Boss Rush, Endless, päivittäiset haasteet** |
| Alustat | arcade-kabinetti | **puhelin + tietokone, sama peli** |
| Co-op | 2 pelaajaa rinnakkain | **paikallinen + online co-op** |

## Dokumentaatio

| Dokumentti | Sisältö |
|---|---|
| [docs/game-design-document.md](docs/game-design-document.md) | **Pää-GDD** — pelisilmukka, ohjaus, mekaniikat, progressio, moodit, tarina, UI, äänisuunnittelu |
| [docs/bestiary.md](docs/bestiary.md) | **Bestiarium** — 12 apex-hirviötä, piilohirviöt ja tavallisten vihollisten katalogi |
| [docs/technical-design.md](docs/technical-design.md) | **Tekninen suunnitelma** — moottorivalinta, cross-platform-arkkitehtuuri, rail-järjestelmä, backend, suorituskyky |
| [docs/roadmap.md](docs/roadmap.md) | **Tuotantosuunnitelma** — vaiheet prototyypistä 1.0:aan, sisältömäärät, riskit, arviot |
| [game-web/](game-web/) | **🎮 Pelattava prototyyppi** — Phase 1 vertical slice (Caribbean Sea + Young Kraken), web-natiivi TypeScript |

## Pelisilmukka pähkinänkuoressa

1. **Tukikohta (alus):** valitse seuraava meri, päivitä harppuuna/aseet/varuste, varustaudu.
2. **Sukellus (taso):** liiku on-rails reittiä → ammu parvivihollisia, väistä/torju hyökkäykset, kerää saalista ja aarretta.
3. **Apex-kohtaaminen:** monivaiheinen pomotaistelu hehkuvine heikkoine kohtineen.
4. **Saalis & palkkio:** bountyt, aarteet, trophyt → uutta varustelua → seuraava meri.

## Status

🎮 **Pelattava prototyyppi valmis** — Phase 1 vertical slice (Caribbean Sea + Young Kraken)
on toteutettu kansiossa [`game-web/`](game-web/). Web-natiivi TypeScript, sama koodi
pyörii puhelimella ja tietokoneella selaimessa (~13 KB gzip, ei art-asseteja).

```bash
cd game-web && npm install && npm run dev      # avaa URL koneella tai puhelimella
```

Toteutettu: on-rails-liike, tähtää/ammu/lataa/charge, combo & pisteet, parry-uhat,
3 vihollistyyppiä, Hunter's Focus -hidastus, monivaiheinen Kraken-pomo, responsiivinen
kosketus-/hiiri-UI. Seuraavat askeleet: [roadmap](docs/roadmap.md) (varustelu/alus-tukikohta,
lisää merta, co-op, backend-tulostaulut).
