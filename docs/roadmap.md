# Sea Hunter — Tuotantosuunnitelma (Roadmap)

> Polku tyhjästä reposta pelattavaan peliin. Vaiheet on järjestetty niin, että
> **jokaisen vaiheen lopussa on jotain pelattavaa ja testattavaa** — riski pienenee
> aikaisin, ja motivaatio pysyy yllä.

## Periaate: pystyviipale ensin

Älä rakenna 12 merta kerralla. Rakenna **yksi meri päästä päähän** (liike →
parvi → pomo → tulosruutu → varustelu) ja saa se *tuntumaan hyvältä puhelimella
ja PC:llä*. Vasta kun ydin on hauska, monista sisältö. Tämä on tärkein
yksittäinen tuotantopäätös.

---

## Vaihe 0 — Esituotanto (suunnittelu + päätökset)

**Tavoite:** lukita avoimet kysymykset (GDD §19) ja pystyttää työkalut.

- [ ] Päätä moottori (suositus: **Godot 4**) ja ulottuvuus (suositus: **2.5D**).
- [ ] Päätä 1.0:n laajuus (kaikki 12 merta vai 6 + Early Access).
- [ ] Päätä ansaintamalli (premium / F2P-kosmetiikka / hybridi).
- [ ] Pystytä repo-rakenne (ks. tekninen suunnitelma §13), Git LFS, CI-runko.
- [ ] Kerää tyyliviitteet (art bible): paletit per meri, hirviösiluetit, UI-tunnelma.

**Tulos:** päätetyt suuntaviivat + tyhjä mutta toimiva projekti.

---

## Vaihe 1 — Pystyviipale / prototyyppi (ydinmekaniikka)

**Tavoite:** *yksi meri, yksi pomo*, joka todistaa että peli on hauska ja toimii
sekä kosketuksella että hiirellä.

- [ ] **RailDirector:** spline-liike, nopeuskäyrä, pysähdys parvi-osiossa.
- [ ] **Syöteabstraktio:** touch + hiiri → `InputState` (ohjain voi tulla myöhemmin).
- [ ] **CombatSystem:** tähtäys, osumatunnistus, harppuunatuli, lipas + lataus,
      latausosuma, combo, torjunta.
- [ ] **2–3 vihollisarkkityyppiä** (Syöksyjä, Parvi, Ampuja) datasta.
- [ ] **1 apex-pomo** (Young Kraken) monivaiheisena BossDirectorilla.
- [ ] **Tulosruutu** (combo, tarkkuus, ranking).
- [ ] **HUD** responsiivisena (puhelin pysty/vaaka + työpöytä).
- [ ] **Audio-paikkamerkit** + haptiikka.

**Pelattavuustesti:** ihmiset pelaavat puhelimella JA koneella. Onko tähtääminen
hauskaa? Onko pomo reilu ja jännittävä? Iteroi kunnes "vielä yksi yritys" -tunne syntyy.

**Tulos:** ~5–8 min pelattava demo. **Go/No-Go-portti** koko projektille.

---

## Vaihe 2 — Vertikaalinen rikastus (meta + tuntuma)

**Tavoite:** muuta demo "peliksi" lisäämällä silmukka ja tuntuma — yhä yksi meri.

- [ ] **Alus-tukikohta:** karttapöytä, asepaja, sukelluspuku-asema (perusversiot).
- [ ] **Progressio:** bounty/aarre/trophy → 1–2 asetta + muutama päivitys.
- [ ] **Hunter's Focus** -kyky (luotiaikahidastus).
- [ ] **Saalis ja aarteet** kentässä; bestiarium-tynkä.
- [ ] **Tallennus** (paikallinen) + asetukset + saavutettavuusperusteet.
- [ ] **Onboarding** ensimmäiselle merelle ("näytä, älä kerro").
- [ ] **Ohjaintuki** + gyro-tähtäys (valinn.).
- [ ] **Adaptiivinen suorituskyky** (mobiililaadun automaatti).

**Tulos:** ehjä pelisilmukka tukikohdasta pomoon ja takaisin. Sisäinen beta.

---

## Vaihe 3 — Sisällön monistus (lisää merta)

**Tavoite:** käytä vaiheiden 1–2 työkaluja ja data-vetoisuutta merten sarjatuotantoon.

- [ ] **Meret 2–6** (Mediterranean Sea → Black Sea): kullekin biomi, vihollispaletti,
      apex-pomo, set-piece, haara + 1 piilohirviö.
- [ ] **Aseluokat** loppuun (räjähdys, verkko, sähkö, sonipiikki, syvyyspommit).
- [ ] **Tehtävätyypit** (pelastus, saattue, aarremetsä, väijytys).
- [ ] **Boss Rush** ja **Endless** -moodit (käyttävät olemassa olevaa sisältöä).
- [ ] **Tarinakehys:** miehistö, esittelyt, löydökset (kevyt toteutus).
- [ ] **Lokalisointi-runko** kuntoon — peli **englanniksi**; avain-pohjaiset tekstit, jotta muita kieliä voi lisätä myöhemmin.

**Tulos:** **Early Access -kelpoinen** peli (6 merta, useita moodeja). Mahdollinen
julkinen web-demo + EA-julkaisu palautteen ja rahoituksen keräämiseksi.

---

## Vaihe 4 — Verkko, dailyt ja loppumeret

**Tavoite:** live-koukut ja sisällön loppuosa.

- [ ] **Backend (Supabase):** pilvitallennus + cross-progression, leaderboardit.
- [ ] **Päivittäinen metsästys** (seed) + viikkohaasteet.
- [ ] **Online co-op** (rail-deterministisyys helpottaa; ks. tekninen §9).
- [ ] **Meret 7–12** (Intian valtameri → Atlantis), ml. **Iku-Turso** 🇫🇮 ja
      loppupomo **Jörmungandr**.
- [ ] **Loput piilohirviöt** ja **New Game+**.

**Tulos:** sisällöllisesti täysi peli + sosiaaliset/live-ominaisuudet.

---

## Vaihe 5 — Viimeistely ja julkaisu (1.0)

**Tavoite:** kiillotus, suorituskyky, kauppajulkaisut.

- [ ] **Suorituskykypassi** kaikilla kohdelaitteilla (mobiili web mukaan lukien).
- [ ] **Saavutettavuus** loppuun (tähtäysapu, värit, äänen visuaaliset parit).
- [ ] **Äänisuunnittelu & musiikki** lopullisina (pomoteemat, adaptiiviset stemmat).
- [ ] **Tasapainotus** (vaikeustasot, talous, combo) pelitestien pohjalta.
- [ ] **Julkaisuputki:** PWA-hosting, Google Play, App Store, Steam.
- [ ] **Markkinointi:** ilmainen web-demo (ensimmäinen meri) leviämisen moottorina.

**Tulos:** **Sea Hunter 1.0** kaikilla alustoilla.

---

## Karkea vaihejärjestys (suuntaa-antava)

> Tarkat kestot riippuvat tiimistä; tässä **suhteellinen** painotus, ei lupaus.

```
Vaihe 0  ▓▓                esituotanto & päätökset
Vaihe 1  ▓▓▓▓▓             pystyviipale  ◀ tärkein portti
Vaihe 2  ▓▓▓▓              meta & tuntuma
Vaihe 3  ▓▓▓▓▓▓▓           sisällön monistus (EA)
Vaihe 4  ▓▓▓▓▓▓            verkko, dailyt, loppumeret
Vaihe 5  ▓▓▓▓              viimeistely & julkaisu
```

Suurin osa ajasta on **vaiheissa 3–4 (sisältö)** — siksi data-vetoisuus ja
arkkityypit (tekninen §7) ovat niin tärkeitä: ne tekevät sisällöstä halpaa monistaa.

---

## Tiimi ja osaaminen (minimi pieni tiimi)

| Rooli | Vastuu | Huom. |
|---|---|---|
| **Pelisuunnittelija/-ohjelmoija** | järjestelmät, tuntuma, tasot | ydinrooli |
| **Taiteilija (2.5D/3D)** | hirviöt, biomit, UI | suurin sisältötaakka |
| **Äänisuunnittelija/säveltäjä** | adaptiivinen musiikki, SFX | voi olla osa-aikainen/ulkoistettu |
| **(valinn.) Backend/verkko** | Supabase, co-op, leaderboardit | vasta vaihe 4 |

Yhden hengen projekti on mahdollinen valmiilla asseteilla + 2.5D:llä, mutta
hirviötaide on pullonkaula — varaa siihen aikaa tai kumppani.

---

## Tärkeimmät riskit ja lievennykset

| Riski | Vaikutus | Lievennys |
|---|---|---|
| **Tähtäys ei tunnu hyvältä kosketuksella** | koko peli kaatuu | testaa vaiheessa 1 oikealla puhelimella; tähtäysapu; kaksi kosketustilaa |
| **Mobiilisuorituskyky (etenkin web)** | ei pyöri kohdelaitteilla | 2.5D, baked-valot, adaptiivinen laatu, budjetit alusta asti |
| **Hirviötaiteen tuotantotaakka** | sisältö jää vajaaksi | arkkityypit + jaetut luurangot + reilu skaalaus; aikaista art bible |
| **Laajuuden paisuminen (12 merta heti)** | ei valmistu | pystyviipale ensin; EA 6 merellä; loput vaiheess 4 |
| **Online co-op monimutkaisuus** | viivästys | hyödynnä rail-determinismiä; paikallinen co-op ensin; online vasta vaihe 4 |
| **Web-latauskoko** | hyppyytys pois | striimaa merialueet, PWA-välimuisti, pieni ensilataus |

---

## Heti seuraava konkreettinen askel

1. Vahvista **moottori + ulottuvuus** (suositus: Godot 4 + 2.5D).
2. Pystytä projektirunko ja CI, jotta web-demo deployaa jokaisesta muutoksesta.
3. Rakenna **vaiheen 1 pystyviipale** (Caribbean Sea + Young Kraken).
4. Laita se ihmisten käsiin puhelimella ja koneella → iteroi tuntumaa.

> Voin seuraavaksi pystyttää tämän pystyviipaleen prototyypin (esim. pelattava
> web-demo Godotilla tai kevyt TypeScript/Three.js-versio) — kerro vain, mihin
> suuntaan haluat mennä.

---

*Takaisin:* [README](../README.md) · [GDD](game-design-document.md) · [Bestiarium](bestiary.md) · [Tekninen suunnitelma](technical-design.md)
