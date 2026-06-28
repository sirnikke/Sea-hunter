# Sea Hunter — Pelisuunnitteludokumentti (GDD)

> Versio 0.1 · Suunnitteluvaihe
> Henkinen seuraaja Segan *The Ocean Hunter* (1998) -pelille — laajempi, modernimpi, cross-platform.
>
> **Pelin kieli: englanti.** Kaikki pelin sisäinen teksti — UI, hahmo- ja hirviönimet,
> tarina ja ääninäyttely — on englanniksi. Nämä suunnitteludokumentit ovat suomeksi
> tiimin käyttöön, ja hirviöiden/merien englanninkieliset *pelinimet* on merkitty erikseen.

## Sisällys

1. [Visio ja pelifantasia](#1-visio-ja-pelifantasia)
2. [Suunnitteluperiaatteet](#2-suunnitteluperiaatteet)
3. [Pelisilmukka](#3-pelisilmukka)
4. [Ohjaus — puhelin, tietokone, ohjain](#4-ohjaus--puhelin-tietokone-ohjain)
5. [Taistelumekaniikat](#5-taistelumekaniikat)
6. [Pisteytys, comboketju ja saalis](#6-pisteytys-comboketju-ja-saalis)
7. [Progressio ja meta — alus-tukikohta](#7-progressio-ja-meta--alus-tukikohta)
8. [Aseet, varusteet ja kyvyt](#8-aseet-varusteet-ja-kyvyt)
9. [Maailman rakenne — kaksitoista merta](#9-maailman-rakenne--kaksitoista-merta)
10. [Tasojen rakenne ja tehtävätyypit](#10-tasojen-rakenne-ja-tehtävätyypit)
11. [Pelitilat](#11-pelitilat)
12. [Tarinakehys](#12-tarinakehys)
13. [Vaikeustaso ja saavutettavuus](#13-vaikeustaso-ja-saavutettavuus)
14. [Taidesuunta](#14-taidesuunta)
15. [Äänisuunnittelu ja musiikki](#15-äänisuunnittelu-ja-musiikki)
16. [UX ja käyttöliittymä](#16-ux-ja-käyttöliittymä)
17. [Live- ja metaominaisuudet](#17-live--ja-metaominaisuudet)
18. [Ansaintamalli (vaihtoehdot)](#18-ansaintamalli-vaihtoehdot)
19. [Avoimet kysymykset](#19-avoimet-kysymykset)

---

## 1. Visio ja pelifantasia

**Ydinfantasia:** Olet maailman viimeisiä *meren metsästäjiä*. Aikakausi on
vaihtoehtoinen 1800–1900-luvun taite, jossa höyrykoneet ja varhainen
sukellusteknologia kohtaavat myytin: meret kuhisevat hirviöitä, joita ihmiskunta
on pelännyt aina. Sinä uskallat sukeltaa niiden perään.

Jokainen pelisessio on **jännityksen kaari**: rauhallinen sukellus kauniiseen mutta
vihamieliseen syvyyteen → kiihtyvä parvi-taistelu → adrenaliinihuippu, kun meren
**apex-hirviö** nousee varjoista. Tunnelma on seikkailullinen ja hieman pelottava
— Jules Verne kohtaa luonnondokumentin ja kansantarut.

Tärkeintä on **liikkeen ja uhan tunne**: et ohjaa hahmoa vapaasti, vaan reitti
vie sinua eteenpäin (on-rails), ja koko huomiosi on tähtäämisessä, ajoituksessa ja
sen lukemisessa, *mikä syvyydestä tulee seuraavaksi*.

## 2. Suunnitteluperiaatteet

Nämä periaatteet ratkaisevat ristiriidat suunnittelussa:

1. **Tähtääminen on peli.** Kaikki — liike, kamera, vihollisten sijoittelu — palvelee
   sitä, että tähtääminen ja laukaisu tuntuvat hyviltä ja luettavilta.
2. **Mobiili ei ole alennettu versio.** Peli suunnitellaan kosketukselle *ensin*;
   hiiri ja ohjain ovat lisäbonus. Yksikään mekaniikka ei vaadi useaa
   yhtäaikaista tarkkaa syötettä, jota peukalo ei pysty antamaan.
3. **Lyhyt sessio, syvä meta.** Yksi sukellus kestää 4–8 min (sopii bussimatkalle),
   mutta varustelu, bestiarium ja haasteet pitävät otteessa kuukausia.
4. **Selkeä uhka, reilu kuolema.** Pelaaja näkee aina mistä isku tulee ja ehtii
   reagoida. Kuolema johtuu virheestä, ei epäreiluudesta.
5. **Spektaakkeli on palkinto.** Apex-hirviöt ovat ruudun täyttäviä, monivaiheisia
   ja mieleenpainuvia. Ne ovat se, mistä peli muistetaan.

## 3. Pelisilmukka

Kaksi sisäkkäistä silmukkaa.

### Mikrosilmukka (sekunnit) — itse sukelluksen aikana
```
havaitse uhka  →  tähtää  →  ammu / lataa / torju  →  kerää saalis  →  toista
```

### Makrosilmukka (sessio) — tukikohdasta tukikohtaan
```
Alus (tukikohta)
  │  valitse meri / tehtävä
  │  käytä bounty + aarre varusteluun
  ▼
Sukellus (taso, on-rails)
  │  parvi-osiot, väistöt/torjunnat, haaroittuvat reitit, aarteet
  ▼
Apex-kohtaaminen (monivaiheinen pomo)
  │  heikot kohdat, hyökkäyskuviot, QTE-huippu
  ▼
Tulosruutu
  │  bounty, combo-bonus, kerätyt trophyt, bestiarium-edistys
  ▼
takaisin Alukselle  →  uusi varustelu  →  seuraava meri
```

## 4. Ohjaus — puhelin, tietokone, ohjain

Sama pelisuunnittelu, kolme syöteprofiilia. Ohjaustila tunnistetaan automaattisesti
ja se voi vaihtua lennossa (esim. kosketus → ohjain).

### Puhelin (ensisijainen suunnittelukohde)
- **Tähtää + ammu:** kosketa kohtaa ruudulla → harppuuna ampuu sinne. (Nopea
  "point-and-shoot" eikä erillistä kursoria — luontevin kosketukselle.)
- **Vaihtoehtoinen "tarkkuustila" (asetus):** vedä peukalolla liikuteltavaa
  tähtäintä, irrota laukaistaksesi — paremmin tähdättäville pomoille.
- **Lataus:** automaattinen lyhyellä viiveellä; valinnaisesti "pyyhkäise alas"
  pikalataus, joka palkitsee rytmistä.
- **Erikoisase / kyky:** isot napit ruudun alakulmissa (peukaloiden ulottuvilla).
- **Torjunta:** kosketa tulevaa hyökkäystä (projektiili, syöksyvä hai) ajoissa.
- Yhden peukalon pelattavuus mahdollista; kaksi peukaloa antaa nopeutta.
- **Haptiikka:** osuma, lataus ja pomon vahinko tuntuvat värinänä.

### Tietokone (hiiri + näppäimistö)
- **Hiiri:** liikuttaa tähtäintä, **vasen** ampuu, **oikea** torjuu/erikoisase.
- **R** lataa, **1–4** vaihtaa asetta, **Space** aktivoi *Hunter's Focus* -kyvyn (hidastus).
- Tukee korkeaa kuvataajuutta ja tarkkaa tähtäystä → "hardcore"-skaalan high scoret.

### Ohjain (konsoli-/työpöytätuntuma)
- Tähtäin liikkuu oikealla tatilla, **RT** ampuu, **LT** torjuu/erikois, **LB/RB** asevaihto.
- Valinnainen **gyroskooppitähtäys** (puhelin/Switch-tyyli) hienosäätöön.

### Yhteinen syöteabstraktio
Kaikki ohjaintavat tuottavat saman abstraktin syötteen: `{ aimX, aimY, fire,
reload, parry, special, switchWeapon }`. Pelilogiikka ei tiedä, tuliko syöte
peukalosta vai hiirestä. (Ks. tekninen suunnitelma.)

## 5. Taistelumekaniikat

### Harppuunatuli
- Perusase on **harppuunatykki**: semi-automaattinen, rajallinen lipas (esim. 6),
  lataus tyhjästä. Lipas tuo rytmin: et voi vain pitää tulta päällä.
- **Latausosuma (charge shot):** pidä laukaisua → voimakkaampi, lävistävä isku;
  ihanteellinen pomon heikkoon kohtaan. Riski: latausaika altistaa hyökkäyksille.

### Heikot kohdat (weak points)
- Hirviöillä ja isoilla vihollisilla on **hehkuvat heikot kohdat** (silmät, suu,
  haavat, sydän panssarin alla). Osumat sinne tekevät moninkertaisen vahingon ja
  voivat **keskeyttää** hyökkäyksen.
- Pomoilla heikot kohdat **vaihtuvat vaiheittain** — pelaaja oppii lukemaan
  hirviötä kuin pulmaa.

### Torjunta ja uhkien lukeminen (defensive shots)
Suoraan Ocean Hunterin hengessä, mutta selkeämmin: kun vihollinen syöksyy tai
ampuu (myrkkypiikki, mustekala-isku, kivilohkare), ruutuun ilmestyy **uhkamerkki**.
Ammut tulevan hyökkäyksen → torjut sen. Epäonnistunut torjunta = vahinko.
Tämä tekee puolustuksesta aktiivista taitoa, ei pelkkää väistämistä.

### Terveys ja kuolema
- Pelaajalla on **kestopisteet (HP)** + sukelluspuvun **panssari** (regeneroituu
  hieman vahingottomien hetkien aikana; HP ei).
- Apex-pomoilla on selvät iskut, jotka *signaloidaan* etukäteen (telegraffaus):
  varjo kasvaa, vesi kuohuu, ääni varoittaa.
- Kuollessa: voit jatkaa **continue**-pisteestä (tarinatila) tai sessio päättyy
  (Endless/Boss Rush). Ei energiajärjestelmää, ei pakkomaksuja.

### Ympäristö ja haaroittuvat reitit
- Reitillä on **kehiä, kohteita ja kytkimiä**: ammu ankkuriköysi → pudota hylyn
  osa hirviön päälle; osu valoa heijastavaan kristalliin → paljasta heikko kohta.
- **Reittihaarat:** ammu tietty kohde tai valitse virtaus → eri polku, eri saalis,
  eri piilohirviö. Lisää toistettavuutta ja "tutki kaikki reitit" -metaa.

## 6. Pisteytys, comboketju ja saalis

- **Combo-ketju:** peräkkäiset osumat ilman hutia kasvattavat kerrointa (x2 → x8…).
  Huti tai osuma pelaajaan nollaa sen. Kannustaa tarkkuuteen ja riskinottoon.
- **Tyylibonukset:** osuma heikkoon kohtaan, kauko-osuma, "last-second"-torjunta,
  kahden vihollisen lävistys yhdellä harppuunalla → ekstrapisteet ja -bounty.
- **Saalis kentässä:**
  - **Bounty (raha):** päävaluutta varusteluun, tippuu vihollisista ja pomoista.
  - **Aarteet:** piilotettuja arkkuja/helmiä, jotka pitää *huomata ja ampua* ennen
    kuin ne katoavat näkyvistä → palkitsee tarkkaavaisuutta.
  - **Trophyt:** hirviökohtaiset esineet (esim. "Krakenin nokka") → bestiarium ja
    harvinaiset päivitykset.
- **Tulosranking** per taso (S/A/B/C…) perustuu comboon, tarkkuuteen, aikaan ja
  vahingottomuuteen → kannustin uusintapeluuseen ja leaderboardeihin.

## 7. Progressio ja meta — alus-tukikohta

Tukikohta on pelaajan **höyrysukellusalus** (työnimi *Nautica*). Se on visuaalinen,
kasvava koti, jossa metsästysten välissä:

- **Karttapöytä:** valitse seuraava meri/tehtävä; näe edistyminen, piilohirviöt,
  sää ja "kuumat" haasteet.
- **Asepaja:** osta ja päivitä aseita ja harppuunoita (vahinko, latausnopeus,
  lipas, lävistys, erikoisammus).
- **Sukelluspuku-asema:** päivitä HP, panssari, happi (kentän kesto/syvyys),
  liikkeen reaktioaika.
- **Kyky-alttari (*Hunter's Focus*):** avaa ja paranna aktiivisia ja passiivisia kykyjä.
- **Miehistö:** rekrytoi hahmoja, jotka antavat passiivisia bonuksia (esim. "Tähystäjä"
  paljastaa piiloaarteet, "Insinööri" nopeuttaa latausta) ja tuovat tarinaa.
- **Trophyhuone / bestiarium:** jokainen kaadettu (ja *skannattu*) hirviö avaa
  tietoa, heikkouksia ja palkintoja. Keräilymeta.

Progressio on **horisontaalista ja pystysuoraa**: uudet aseet avaavat uusia
taktiikoita (lävistys, sähkö, sonar), kun taas tasot tekevät vanhoista vahvempia.
Tavoite: pelaaja tuntee kasvavansa, muttei tylsisty ylivoimaiseksi.

## 8. Aseet, varusteet ja kyvyt

### Aseluokat (avataan tarinan edetessä)
| Ase | Tuntuma | Vahvuus | Heikkous |
|---|---|---|---|
| **Harppuunatykki** | perus, luotettava | tasapainoinen, latausosuma | keskinkertainen parvia vastaan |
| **Räjähdysharppuuna** | raskas, hidas | aluevahinko, parvet | hidas lataus, tarkkuus |
| **Verkkoampuja** | taktinen | pysäyttää/hidastaa, paljastaa heikot kohdat | matala suora vahinko |
| **Sähköharppuuna (kela)** | ketjuava | hyppii vihollisesta toiseen, lamaa | tehoton panssaria vastaan |
| **Sonipiikki / kaikuluoti** | tekninen | ohittaa panssarin, kantama | hidas tulinopeus |
| **Syvyyspommit (sekundääri)** | tilannekohtainen | alapuolelta tuleviin uhkiin | rajallinen määrä |

### Erikoisammukset (rajallinen, täydentyy kentässä)
Lävistävä, jäädyttävä (hidastaa pomoa), myrkky (jatkuva vahinko), valoraketti
(paljastaa piiloviholliset/aarteet pimeissä syvyyksissä).

### Kyvyt — *Hunter's Focus*
- **Fokus (aktiivinen):** lyhyt **luotiaikahidastus** — ratkaiseva pomojen
  hyökkäyssarjoissa ja tarkoissa heikon kohdan osumissa. Latautuu osumilla/comboilla.
- **Passiiviset:** automaattilataus liikkeessä, isompi aarretutka, panssarin
  nopeampi palautuminen, combo ei nollaudu yhdestä hudista (1 "armo").

## 9. Maailman rakenne — kaksitoista merta

Maailmankartta on **kaksitoista merta** (alkuperäisen seitsemän sijaan), kukin oma
biomi, tunnelma, vihollispaletti ja **apex-hirviö**. Meret avautuvat pääosin
järjestyksessä, mutta kartalla on **haaroja ja valinnaisia merta**, joten reitti ei
ole täysin lineaarinen.

> Hirviöiden ja vihollisten täydet kuvaukset: ks. [bestiary.md](bestiary.md).

> Sarakkeissa **pelinimet (EN)**, joita käytetään itse pelissä. Biomikuvaukset suomeksi tiimille.

| # | Meri — pelinimi (EN) | Biomi / tunnelma | Apex-hirviö — pelinimi (EN) |
|---|---|---|---|
| 1 | **Caribbean Sea** | trooppinen riutta, merirosvohylyt, aurinko | *Young Kraken* (opettava pomo) |
| 2 | **Mediterranean Sea** | upponneet temppelit, antiikki | *Scylla & Charybdis* (parivaltio) |
| 3 | **North Sea** | kylmä, öljylautan hylky, sumu | *Maelstrom Serpent* |
| 4 | **Red Sea** | korallit, kapeat solat | *Giant Moray* (Leviathan spawn) |
| 5 | **Sargasso Sea** | levän tukahduttama haamulaivasto | *The Abyssal Angler* |
| 6 | **Black Sea** | hapeton syvyys, antiikin hirviöt | *Hydra* (monipäinen) |
| 7 | **Indian Ocean** | monsuuni, temppelirauniot | *Makara* |
| 8 | **Sea of Japan** | myrsky, kummituslaivat | *Umibōzu / Isonade* (haamu + jättihai) |
| 9 | **Weddell Sea** (Antarctic) | jään alla, sininen pimeys | *Frozen Liopleurodon* |
| 10 | **Mariana Trench** | bioluminesoiva kuilu | *The Bloop* |
| 11 | **Arctic Ocean** | jäälautat, revontulet | *Iku-Turso* (suomalainen myytti 🇫🇮) |
| 12 | **The Lost Sea** (Atlantis) | uponnut sivilisaatio, finaali | *Jörmungandr* — maailmankäärme (loppupomo) |

**Lisäsisältö:** Jokaisella merellä on vähintään yksi **piilohirviö** (salainen
apex), joka ilmestyy vain tietyllä reitillä, säällä tai ehdolla → +8 hirviötä.
Lisäksi New Game+:ssa meret muuntuvat (uudet kuviot, kovemmat versiot).

## 10. Tasojen rakenne ja tehtävätyypit

Yksi sukellus koostuu **segmenteistä**, jotka ladataan saumattomasti:

1. **Laskeutuminen** — rauhallinen aloitus, opettaa biomin uhkat, kerää saalista.
2. **Parvi-osio(t)** — kiihtyvä tahti, parvet ja keskikokoiset viholliset, torjunnat.
3. **Set-piece** — käsin suunniteltu spektaakkeli (hylyn romahdus, virtauksen
   imu, jättiläisparven aalto) jossa ympäristöä käytetään aseena.
4. **Apex-kohtaaminen** — monivaiheinen pomo.

### Tehtävätyypit (vaihtelua kampanjaan ja Endlessiin)
- **Metsästys (perus):** kaada meren apex.
- **Pelastus:** suojele uppoavaa alusta/sukeltajaa ajastettua uhkaa vastaan.
- **Saattue:** etene hitaasti liikkuvan kohteen tahdissa, torju aaltoja.
- **Aarremetsä:** kerää X aarretta ennen kuin happi/aika loppuu (tutkimuspainotteinen).
- **Väijytys:** piilohirviö-laukaisin — selviä yllätyspomosta.

## 11. Pelitilat

| Tila | Kuvaus | Tarkoitus |
|---|---|---|
| **Tarinakampanja** | 12 merta + tarina + progressio | Pääsisältö, 8–12 h |
| **Co-op (2 pelaajaa)** | paikallinen (2 laitetta/2 kursoria) + online | Sosiaalinen toisto |
| **Boss Rush** | kaikki pomot peräkkäin, valitulla varustelulla | Taitohaaste, leaderboard |
| **Endless — "Selviytyminen riutalla"** | proseduraaliset aallot, kasvava vaikeus | Loputon toisto, high score |
| **Päivittäinen metsästys** | seeded haaste, kaikille sama | Päivittäinen koukku + ranking |
| **New Game+** | kovemmat meret, uudet kuviot, kosmetiikka | Pitkän pelaajan sisältö |
| **Harjoittelu / tutka** | testaa aseita ja kykyjä turvallisesti | Onboarding ja teorian testaus |

## 12. Tarinakehys

Kevyt mutta läsnä oleva tarina raamittaa metsästykset — ei kohtauksilla tukehduta,
vaan miehistön repliikeillä, löydetyillä päiväkirjoilla ja pomojen esittelyillä.

- **Asetelma:** Olet nuori metsästäjä, joka perii kadonneen mestarinsa
  (vanhemman sisaruksen / mentorin) aluksen ja tehtävän. Mentori katosi
  jahdatessaan maailmankäärmettä kahdennellatoista merellä.
- **Kaari:** Jokainen kaadettu apex tuo palan totuutta: hirviöt eivät ole sattumaa,
  vaan ne *heräävät*. Joku — tai jokin syvyyksissä — kutsuu niitä. Polku johtaa
  Atlantikseen ja Jörmungandriin, ja mentorin kohtalon paljastumiseen.
- **Teema:** metsästäjän ja saaliin raja, meren kunnioitus, ahneuden hinta
  (aarre vs. luonto). Sävy seikkailullinen, ei synkistelevä.
- **Toimitus:** ennen jokaista merta lyhyt esittely; pomon ilmestyessä nimikortti;
  miehistön kommentit aluksella; valinnaiset löydöt syventävät lorea.

## 13. Vaikeustaso ja saavutettavuus

- **Vaikeustasot:** Tutkimusmatkailija (rento) · Metsästäjä (oletus) · Legenda (kova) ·
  *Painajaismeri* (NG+ jälkeen). Vaikeus säätää HP:ta, telegraffauksen pituutta ja
  vihollistiheyttä — ei lisää epäreiluutta.
- **Saavutettavuus (sisäänrakennettu, ei jälkikäteen):**
  - Säädettävä tähtäysapu (tarttuminen heikkoihin kohtiin) erityisesti kosketukselle.
  - Värisokeusturvalliset uhka-/heikko-kohta-merkit (muoto + väri, ei pelkkä väri).
  - Auto-lataus ja "hidas tila" -vaihtoehdot motorisesti haastaville.
  - Tekstikoko, kuvakkeiden selitteet, äänivihjeet myös visuaalisena.
  - Ei välähdys-/stroboheräte-efektejä ilman varoitusta ja pois-kytkentää.
- **Sessiojousto:** jokainen taso on tauotettavissa ja lyhyt → mobiiliystävällinen.

## 14. Taidesuunta

- **Tyyli:** *tyylitelty realismi* — vahvat siluetit, dramaattinen valo,
  bioluminesenssin hehku. Ei fotorealismia (raskas mobiilille) eikä lattea sarjakuva;
  jotain Subnautican tunnelman ja maalauksellisen konseptitaiteen väliltä.
- **Tekninen valinta:** **2.5D / "2.5-ulotteinen"** — viholliset ja hirviöt 3D-malleina
  tai monitasoisina sprite-/luurankoanimaatioina liikkuvat kohti kameraa
  syvyysvaikutelmalla; taustat kerroksellisia. Tämä antaa Ocean Hunterin
  "syvyyteen sukeltavan" tunnun mutta pysyy kevyenä puhelimella. (Vaihtoehto:
  täysi 3D — ks. tekninen suunnitelma riskeineen.)
- **Värimaailma per meri:** jokaisella merellä oma paletti ja valaistus — trooppinen
  turkoosi, jäinen syaani, kuilun musta-violetti revontuli-aksenttein → ruutu
  kertoo heti, missä olet.
- **Luettavuus ennen kauneutta:** uhkat, heikot kohdat ja saalis erottuvat aina
  taustasta (kontrasti, hehku, ääriviiva).

## 15. Äänisuunnittelu ja musiikki

- **Musiikki:** adaptiivinen — rauhallinen, mysteerinen sukelluksen aikana, joka
  **nousee kerroksittain** parvi-osioissa ja räjähtää orkesteriksi apex-kohtaamisessa.
  Jokaiselle pomolle oma teema. Merikohtaiset soinnit (antiikin huilut Välimerellä,
  pohjoinen kurkkulaulu Jäämerellä jne.).
- **Ääniefektit:** harppuunan "thunk", veden vaimennus, hirviön matala jyrinä joka
  *tuntuu* (haptiikka + basso) ennen kuin näet sen → uhka kuuluu ennen kuin se näkyy.
- **Diegeettiset vihjeet:** kaikuluoti-pingit, miehistön huudot ("Vasemmalla!"),
  hirviön ääni paljastaa heikon kohdan aktivoitumisen.
- **Ääni saavutettavuutena:** jokaisella tärkeällä äänivihjeellä on visuaalinen pari.

## 16. UX ja käyttöliittymä

- **Diegeettinen HUD minimissään:** terveys ja lipas sukelluspuvun mittareina;
  vältetään ruudun täyttämistä, koska kosketuksessa peukalot ovat alakulmissa.
- **Peukaloturvalliset vyöhykkeet:** kaikki painikkeet alakulmissa; ruudun keskusta
  ja yläosa pidetään vapaana tähtäämiselle ja katselulle.
- **Yhden käden hätätila:** peli on pelattavissa (heikommin) yhdellä peukalolla.
- **Onboarding:** ensimmäinen meri opettaa mekaniikat tekemällä, ei tekstiseinillä;
  "näytä, älä kerro". Latausosuma, torjunta ja heikot kohdat esitellään turvallisesti.
- **Skaalautuva layout:** sama UI mukautuu puhelimen pystystä/vaakatasosta
  työpöydän laajakuvaan; turvalliset reunukset notcheille.
- **Nopea uudelleenyritys:** kuoleman jälkeen yksi napautus takaisin peliin.

## 17. Live- ja metaominaisuudet

- **Päivittäinen metsästys** (seeded) + **leaderboardit** (globaali, kaverit, alue).
- **Viikkohaasteet / tapahtumat:** rajoitetut modifikaattorit ("vain räjähdysharppuuna",
  "kaksinkertaiset aarteet") ja teemakaudet.
- **Pilvitallennus ja cross-progression:** jatka puhelimella mistä jäit koneella.
- **Trophy-/keräilymeta:** bestiarium 100 %, kaikki reitit, kaikki piilohirviöt.
- **Jaa-leikkeet:** automaattinen "metsästyksen huippuhetki" -klippi/kuva jakoon.

## 18. Ansaintamalli (vaihtoehdot)

Ei pakotettu suunnitelmaan — valitaan myöhemmin. Suositus: **reilu ja
ei-häiritsevä**, koska peli nojaa taitoon ja tunnelmaan.

- **A — Premium (suositus):** kertaosto (tai ilmainen demo + täysversion osto).
  Selkein, eettisin, sopii tarinapeliin. Web-demo houkuttimena.
- **B — Free-to-play kosmetiikalla:** ilmainen, ansainta vain kosmeettisista
  (alus-skinit, harppuunaverhoilut, trophy-koristeet). **Ei** voimaa rahalla, **ei**
  energiajärjestelmiä. Laajin tavoittavuus, mutta vaatii enemmän sisältöä ja livettä.
- **C — Hybridi:** ilmainen ydin + maksullinen tarinalaajennus (uudet meret/hirviöt).
- Vältetään: pay-to-win, pakotetut mainokset kesken sukelluksen, lootbox-mekaniikat.

## 19. Avoimet kysymykset

Päätettäviä ennen tuotantoa (ks. myös [roadmap.md](roadmap.md)):

1. **Visuaalinen ulottuvuus:** 2.5D (suositus, kevyt) vs. täysi 3D (näyttävämpi,
   raskaampi mobiilille)?
2. **Moottori:** Godot 4 (suositus) vs. Unity vs. web-natiivi (TypeScript + 3D-kirjasto)?
   Ks. [technical-design.md](technical-design.md).
3. **Online co-op heti vai myöhemmin?** (paikallinen co-op on halvempi MVP:hen).
4. **Ansaintamalli** (A/B/C yllä).
5. **Laajuus 1.0:aan:** kaikki 12 merta heti vai 6 merta + Early Access -laajennus?
6. **Kohdeyleisö & ikäluokitus:** seikkailullinen (PEGI 7/12) vs. pelottavampi (16)?

---

*Seuraavat dokumentit:* [Bestiarium](bestiary.md) · [Tekninen suunnitelma](technical-design.md) · [Roadmap](roadmap.md)
