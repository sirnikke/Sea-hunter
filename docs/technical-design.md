# Sea Hunter — Tekninen suunnitelma

> Miten peli toteutetaan niin, että **sama peli pyörii puhelimella ja
> tietokoneella**, näyttää hyvältä ja on yhden pienen tiimin tuotettavissa.

## Sisällys
1. [Alustatavoitteet](#1-alustatavoitteet)
2. [Moottorivalinta](#2-moottorivalinta)
3. [2.5D vai 3D](#3-25d-vai-3d)
4. [Korkean tason arkkitehtuuri](#4-korkean-tason-arkkitehtuuri)
5. [Rail- ja spline-järjestelmä](#5-rail--ja-spline-järjestelmä)
6. [Syöteabstraktio (cross-platform-ohjaus)](#6-syöteabstraktio-cross-platform-ohjaus)
7. [Taistelu- ja pomojärjestelmät (data-vetoinen)](#7-taistelu--ja-pomojärjestelmät-data-vetoinen)
8. [Backend: tallennus, leaderboardit, dailyt](#8-backend-tallennus-leaderboardit-dailyt)
9. [Co-op-verkko](#9-co-op-verkko)
10. [Suorituskykybudjetti (mobiili)](#10-suorituskykybudjetti-mobiili)
11. [Asset-putki](#11-asset-putki)
12. [Build- ja julkaisuputki](#12-build--ja-julkaisuputki)
13. [Ehdotettu repo-rakenne](#13-ehdotettu-repo-rakenne)

---

## 1. Alustatavoitteet

| Alusta | Prioriteetti | Jakelu |
|---|---|---|
| **Web (PWA)** | 1 — heti pelattava linkistä, asennettavissa | itse hostattu / itch.io |
| **Android** | 1 | Google Play (+ APK) |
| **iOS** | 2 | App Store |
| **Windows / Mac / Linux** | 2 | Steam / itch.io |

**Periaate:** yksi koodipohja, useita export-kohteita. Web on ensisijainen, koska
se täyttää "pelattavissa puhelimella ja tietokoneella" -vaatimuksen ilman
asennusta ja toimii markkinoinnin demona. Natiivibuildit tulevat samasta
projektista parempaa suorituskykyä ja kauppoja varten.

## 2. Moottorivalinta

### Suositus: **Godot 4**

| Kriteeri | Godot 4 | Unity | Web-natiivi (TS + Three.js/Babylon) |
|---|---|---|---|
| Web-export | ✅ natiivi (HTML5/WASM) | ⚠️ WebGL, raskas mobiiliselaimessa | ✅ web *on* kotialusta |
| Android/iOS export | ✅ | ✅ (vahva) | ⚠️ Capacitor/wrapper |
| Työpöytä export | ✅ | ✅ | ✅ (Electron/Tauri) |
| Lisenssi/kustannus | ✅ ilmainen, avoin, ei rojalteja | ⚠️ lisenssiehdot | ✅ ilmainen |
| Oppimiskäyrä | ✅ matala (GDScript) | keskitaso (C#) | ⚠️ rakennat paljon itse |
| 2.5D/3D sopivuus | ✅ hyvä | ✅ erinomainen | ✅ joustava |
| Tiimikoko-sopivuus | ✅ pieni tiimi | keskikokoinen+ | ✅ web-osaajille |
| Mobiilisuorituskyky | ✅ hyvä kevyellä sisällöllä | ✅ paras isolla | riippuu toteutuksesta |

**Miksi Godot 4:**
- Yksi projekti → web + Android + iOS + työpöytä, ilman lisenssihuolia.
- Kevyt: sopii 2.5D-rail shooteriin ja mobiiliin paremmin kuin raskas yleismoottori.
- GDScript on nopea iteroida pienellä tiimillä; C# saatavilla jos halutaan.
- Sisäänrakennettu spline (`Path2D/Path3D` + `PathFollow`) → rail-liike "ilmaiseksi".

**Milloin Unity:** jos halutaan ehdottoman näyttävin täysi-3D ja on C#-osaajia ja
budjettia; mobiilisuorituskyky isolla sisällöllä on Unityn vahvuus.

**Milloin web-natiivi (TypeScript + Three.js tai Babylon.js + Vite, kääre
Capacitorilla):** jos tiimi on web-vetoinen ja halutaan web *ensisijaisena* ja
äärimmäisen kevyt jakelu (pelattava URL:sta heti). Hinta: rakennat enemmän
moottorin palasia itse (scene-hallinta, audio, input, fysiikka).

> **Suositus pienelle tiimille, joka haluaa nopeasti pelattavan tuloksen
> puhelimelle ja PC:lle: Godot 4 + 2.5D.** Loput tästä dokumentista on
> moottoririippumatonta (arkkitehtuuri pätee mille tahansa valinnalle).

## 3. 2.5D vai 3D

- **2.5D (suositus MVP:hen):** viholliset/pomot 3D-malleina tai luurankoanimoituina
  spriteinä, jotka liikkuvat kohti kameraa syvyyskerroksissa; taustat
  parallax-kerroksina. Antaa Ocean Hunterin "syvyyteen sukeltavan" tunnun
  murto-osalla 3D:n suorituskyky- ja tuotantokustannuksista. Ihanteellinen
  puhelimelle.
- **Täysi 3D:** näyttävin ja vapain kamera, mutta kalliimpi (mallinnus, optimointi,
  mobiilisuorituskyky). Harkittava 1.0:aan/jatko-osaan tai jos kohdataan vahva 3D-tiimi.
- **Hybridi:** 3D-pomot + 2.5D-ympäristö — yleinen, kustannustehokas kompromissi.

Rail shooter on tähän ihanteellinen: koska kamera kulkee kiinteää reittiä,
voidaan käyttää **paljon käsin aseteltua "kulissia"** (baked valot, kohtaukset),
mikä näyttää kalliilta mutta on kevyt ajaa.

## 4. Korkean tason arkkitehtuuri

Pelilogiikka jaetaan **järjestelmiin (systems)**, jotka ovat moottorista ja
syötteestä riippumattomia. Sama logiikka pätee kaikilla alustoilla.

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION                          │
│   Renderöinti · Audio · UI/HUD · VFX · Haptiikka            │
└───────────────▲─────────────────────────────┬───────────────┘
                │ tila                          │ tapahtumat
┌───────────────┴─────────────────────────────▼───────────────┐
│                       GAME SYSTEMS                           │
│  RailDirector · SpawnDirector · CombatSystem · BossDirector │
│  ScoringSystem · LootSystem · ProgressionSystem · SaveSystem │
└───────────────▲─────────────────────────────┬───────────────┘
                │ abstrakti syöte               │ data
┌───────────────┴───────────┐   ┌──────────────▼──────────────┐
│      INPUT ABSTRACTION     │   │        CONTENT (data)        │
│ touch / mouse / gamepad /  │   │ meret · pomot · viholliset · │
│ gyro → InputState          │   │ aseet (JSON/resurssit)       │
└────────────────────────────┘   └──────────────────────────────┘
                                  ┌──────────────────────────────┐
                                  │   BACKEND (valinnainen)       │
                                  │ pilvitallennus · leaderboard ·│
                                  │ daily-seed · co-op-relay      │
                                  └──────────────────────────────┘
```

**Keskeiset järjestelmät:**
- **RailDirector** — siirtää kameraa/pelaajaa splineä pitkin; hoitaa nopeuden,
  pysähdykset (parvi-osio), haaroittuvat reitit.
- **SpawnDirector** — laukaisee vihollisaallot reittipisteissä (triggerit dataa).
- **CombatSystem** — tähtäys → osumatunnistus (raycast) → vahinko, heikot kohdat,
  combo, torjunta.
- **BossDirector** — vaihekoneisto (state machine) datasta: hyökkäyskuviot,
  heikkojen kohtien aktivointi, telegraffaus.
- **ScoringSystem / LootSystem** — combo, tyylibonukset, bounty/aarre/trophy.
- **ProgressionSystem / SaveSystem** — varustelu, avaukset, paikallinen +
  pilvitallennus.

## 5. Rail- ja spline-järjestelmä

- Jokainen taso on **spline-reitti** (Godot: `Path3D`/`Path2D` + `PathFollow`).
  Pelaaja-"vaunu" kulkee reittiä; kamera on siihen kiinnitetty.
- Reitillä **triggeripisteitä** (markkereita), jotka data määrittää:
  `spawn-aalto`, `pysähdy kunnes raivattu`, `set-piece`, `haarakohta`,
  `pomon aloitus`.
- **Haaroittuvat reitit:** triggerin ehto (ammuttiinko kohde? virtaus?) valitsee,
  mikä alispline ajetaan → eri saalis/piilohirviö.
- Nopeus on **käyrä** (rauhallinen → kiihtyvä), jotta jännityksen kaari toimii.
- Editorissa reitit ja triggerit asetellaan visuaalisesti → leveldesign on dataa,
  ei koodia.

## 6. Syöteabstraktio (cross-platform-ohjaus)

Tämä on koko cross-platform-lupauksen ydin. Kaikki ohjaintavat normalisoidaan
yhdeksi rakenteeksi, jota pelilogiikka käyttää:

```
InputState {
  aim: Vector2        // normalisoitu tähtäyspiste ruudulla (0..1, 0..1)
  fire: bool          // laukaus tällä framella
  fireHeld: bool      // latausosumaa varten
  parry: bool         // torjunta
  special: bool       // erikoisase/kyky
  reload: bool
  switchWeapon: int   // -1/0/+1 tai indeksi
}
```

**Mappaukset:**
- **Touch:** kosketuspiste → `aim`; tap → `fire`; pitkä painallus → `fireHeld`;
  alakulman napit → `special`/`parry`/`reload`; pyyhkäisy alas → `reload`.
- **Hiiri:** kursori → `aim`; vasen → `fire/fireHeld`; oikea → `parry`;
  näppäimet R/Space/1–4 → reload/special/switch.
- **Ohjain:** oikea tatti → `aim` (tähtäin liikkuu); RT → fire; LT → parry;
  bumperit → switch; valinnainen gyro hienosäätöön.

Pelilogiikka **ei koskaan tiedä** syötelähdettä → uusi ohjaintapa = uusi mappaus,
ei muutoksia peliin. Tämä mahdollistaa myös automaattisen UI:n vaihdon (kosketus-UI
vs. työpöytä-UI) ja saumattoman vaihdon kesken pelin.

**Mobiilin tähtäysapu** (asetuksena): pieni "tarttuminen" lähimpään heikkoon
kohtaan parantaa kosketuksen reiluutta ilman, että työpöytäpeli kärsii.

## 7. Taistelu- ja pomojärjestelmät (data-vetoinen)

Sisältö on **dataa, ei koodia**, jotta 12 merta, ~20 pomoa ja 40+ vihollista
ovat tuotettavissa ilman ohjelmointia per olento.

- **Vihollinen** = arkkityyppi (Syöksyjä/Ampuja/…) + parametrit (HP, nopeus,
  vahinko) + visuaalit. (JSON/resurssitiedostot.)
- **Pomo** = vaihelista; jokainen vaihe = hyökkäyskuviolista + heikkojen kohtien
  konfiguraatio + siirtymäehto (HP-%, ajastin, "kaikki päät tainnutettu").
- **Hyökkäyskuvio** = telegraffaus-kesto + tyyppi (syöksy/ammus/alueisku) +
  torjuttavuus + avausikkunan pituus.
- Tällä saa **monivaiheiset, reilut pomot ilman uutta koodia** — vain dataa.

Esimerkki (pseudodata):
```json
{
  "boss": "young_kraken",
  "phases": [
    { "until_hp": 0.66, "attacks": ["tentacle_slam"], "weakpoints": ["suckers"] },
    { "until_hp": 0.33, "attacks": ["ink_cloud", "tentacle_slam"], "weakpoints": [] },
    { "until_hp": 0.0,  "attacks": ["eye_lunge"], "weakpoints": ["eye"], "finisher": "charge_eye" }
  ]
}
```

## 8. Backend: tallennus, leaderboardit, dailyt

Peli on pelattavissa **täysin offline** (paikallinen tallennus). Verkko-ominaisuudet
ovat valinnaisia ja eristettyjä, jotta ydinpeli ei riipu palvelimesta.

**Suositeltu backend: Supabase** (Postgres + Auth + Realtime + Edge Functions) —
hyvä sopivuus tähän ja saatavilla tässä ympäristössä:

- **Auth:** kevyt tili (tai anonyymi laite-ID) cross-progressionia varten.
- **Pilvitallennus:** jatka puhelimella mistä jäit koneella (taulu `saves`).
- **Leaderboardit:** `scores`-taulu, indeksoidut näkymät (globaali/kaverit/alue);
  validointi Edge Functionissa huijauksen vähentämiseksi.
- **Päivittäinen metsästys:** päivän **seed** Edge Functionista → kaikilla sama
  proseduraalinen haaste; tulokset omalle leaderboardille.
- **Tapahtumat/haasteet:** etäkonfiguraatio (rivi taulussa) → modaa peliä ilman
  uutta buildia.

> Vaihtoehdot: PlayFab, Nakama (co-opiin vahva), tai oma kevyt API. Supabase
> riittää MVP:hen ja skaalautuu pitkälle.

## 9. Co-op-verkko

- **Paikallinen co-op (MVP-ystävällinen):** sama logiikka, kaksi `InputState`-lähdettä
  → kaksi tähtäintä. Halpa, ei verkkoa. Työpöydällä 2 hiirtä/ohjainta; mobiilissa
  2 laitetta jakavat näkymän tai "pass-and-play" ei sovi → online suositeltavampi mobiililla.
- **Online co-op (myöhempi vaihe):** koska peli on **on-rails ja deterministinen
  reitti**, synkronointi on helpompaa kuin avoimessa maailmassa:
  - Jaettu reittiposition + seed; kumpikin ajaa saman spawn-skriptin.
  - Synkronoitavaa vähän: tähtäimet, osumat, pomon HP/vaihe.
  - Malli: **kevyt auktoriteetti** (host tai Edge/relay) pomon tilalle; tähtäimet
    lähetetään usein, interpoloidaan. Nakama tai Supabase Realtime relayna.
- Suunnitteluperiaate: co-op skaalaa HP:ta ja kuviotiheyttä, ei riko reiluutta.

## 10. Suorituskykybudjetti (mobiili)

Tavoite: **sujuva 60 fps modernilla puhelimella, 30 fps minimilaitteilla**,
web mukaan lukien. Rail shooter auttaa: näytämme vain reitin edessä olevan.

- **Piirtokutsut & polygonit:** budjetoi konservatiivisesti; 2.5D pitää nämä
  matalina. Käytä atlaksia/instansointia parville.
- **Tekstuurit:** pakatut (ASTC/ETC2 mobiili, S3TC työpöytä); mipmapit;
  vältä 4K-tekstuureja puhelimella.
- **Valaistus:** baked valot kulisseihin (rail = staattinen ympäristö), reaaliaikaista
  vain pomojen hehkulle/heikoille kohdille.
- **Hiukkaset/VFX:** budjetoitu; combo-spektaakkeli ei saa pudottaa ruudunpäivitystä.
- **Adaptiivinen laatu:** tunnista laite → säädä resoluutio/VFX/varjot
  automaattisesti. Asetuksissa manuaalinen ohitus.
- **Lataus & koko:** web-build pidettävä pienenä (striimaa/lataa merialueet
  tarvittaessa); tavoittele nopeaa ensikäynnistystä PWA-välimuistilla.
- **Akku & lämpö:** rajaa fps mobiilissa, kun ei tarvita enempää; vältä turhaa
  taustatyötä.

## 11. Asset-putki

- **3D/2.5D-mallit:** glTF; luurankoanimaatiot pomoille; LOD isoille olennoille.
- **Taustat:** kerrokselliset (parallax) maalaukset/renderit per meri.
- **Audio:** adaptiiviset musiikkikerrokset (intensiteetti-stemmat); komprimoitu
  (Ogg/Opus). Ks. GDD §15.
- **Data:** meret/pomot/viholliset/aseet JSON-/resurssitiedostoina (ks. §7) →
  versioitavissa ja moddattavissa.
- **Lokalisointi:** tekstit avain-pohjaisina alusta asti (FI/EN ensin).
  Suunnittele UI venyville merkkijonoille.

## 12. Build- ja julkaisuputki

- **Versionhallinta:** Git (tämä repo). Isot binääriassetit Git LFS:llä.
- **CI/CD:** automaattiset buildit per alusta (web/Android/iOS/desktop) tagista;
  web-build deployataan esikatselu-URL:iin jokaisesta PR:stä (helppo testata
  puhelimella).
- **Web-jakelu:** staattinen hosting + PWA-manifest (asennettava, offline-välimuisti).
- **Kaupat:** Google Play / App Store / Steam natiivibuildeille.
- **Testaus:** automaattitestit järjestelmälogiikalle (combo, vahinko, vaihekone);
  laitetestaus muutamalla edustavalla puhelimella + työpöytäselaimilla.

## 13. Ehdotettu repo-rakenne

Moottoririippumaton runko (sovita valitulle moottorille):

```
/docs                 # suunnitteludokumentit (tämä kansio)
/game                 # moottoriprojekti (Godot/Unity/web)
  /scenes             # tasot, alus-tukikohta, valikot
  /systems            # RailDirector, CombatSystem, BossDirector, ...
  /input              # syöteabstraktio + mappaukset (touch/mouse/gamepad/gyro)
  /entities           # pelaaja, viholliset, pomot (arkkityyppi + data)
  /ui                 # HUD, valikot, responsiivinen layout
  /vfx /audio
/content              # DATA: meret, pomot, viholliset, aseet (JSON/resurssit)
  /seas /bosses /enemies /weapons /loot
/assets               # mallit, tekstuurit, äänet (Git LFS)
/backend              # (valinn.) Supabase migraatiot, Edge Functions
/tools                # build-skriptit, leveldesign-apurit
/.github/workflows    # CI/CD per alusta
```

---

*Takaisin:* [README](../README.md) · [GDD](game-design-document.md) · [Bestiarium](bestiary.md) · [Roadmap](roadmap.md)
