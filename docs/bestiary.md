# Sea Hunter — Bestiarium

> Hirviöiden ja vihollisten suunnittelukatalogi.
> Apex-pomot ovat pelin tähtiä; tämä dokumentti määrittää niiden roolin,
> vaiheet, heikot kohdat ja sen, *miltä taistelun pitäisi tuntua*.
>
> **Nimet ovat englanninkielisiä pelinimiä** (peli julkaistaan englanniksi).
> Suomenkielinen selite on suluissa silloin, kun nimi on käännetty kuvaileva.
> Suunnittelun proosa on suomeksi tiimin käyttöön.

## Sisällys
1. [Pomosuunnittelun kielioppi](#1-pomosuunnittelun-kielioppi)
2. [12 apex-hirviötä](#2-kaksitoista-apex-hirviötä)
3. [Piilohirviöt (salaiset apexit)](#3-piilohirviöt-salaiset-apexit)
4. [Tavalliset viholliset](#4-tavalliset-viholliset)
5. [Vihollisarkkityypit (suunnittelurungot)](#5-vihollisarkkityypit-suunnittelurungot)

---

## 1. Pomosuunnittelun kielioppi

Jokainen apex noudattaa samaa selkärankaa, jotta ne tuntuvat reiluilta mutta
erottuvat toisistaan teemalla ja kuvioilla:

- **Vaiheet (2–4):** terveyspalkki on jaettu vaiheisiin. Vaiheen vaihtuessa
  hirviö muuttuu: uusi hyökkäys, uusi heikko kohta, uusi areenan tila. Antaa
  taistelulle nousevan draaman.
- **Heikot kohdat (weak points):** hehkuvat, telegraffatut. Osuma sinne = iso
  vahinko + mahdollinen keskeytys. Heikot kohdat *vaihtuvat* vaiheittain → opittava kuvio.
- **Telegraffaus:** jokaista vaarallista iskua edeltää selvä signaali (varjo,
  kuohu, ääni, valon välähdys). Pelaaja voi aina reagoida ajoissa.
- **Torjuttavat hyökkäykset:** osa iskuista on torjuttavissa ampumalla
  (projektiili, syöksy) → puolustus on aktiivista taitoa.
- **"Avausikkuna":** hyökkäyksen jälkeen hirviö on hetken haavoittuvainen →
  palkitsee uhan lukemisen ja rytmin.
- **Huippuhetki (finisher / QTE):** vaiheen tai taistelun lopussa lyhyt
  spektaakkeli-isku (esim. lävistä silmä latausosumalla hidastuksessa).

Skaalaus: sama runko, eri "lihat". Co-opissa HP ja kuviotiheys skaalautuvat.

---

## 2. Kaksitoista apex-hirviötä

### 1 · Young Kraken — *Caribbean Sea* (opettava pomo)
- **Rooli:** ensimmäinen apex; opettaa heikot kohdat, latausosuman ja torjunnan
  turvallisesti. Näyttävä muttei armoton.
- **Olemus:** auringonvalon lävistämä trooppinen riutta; nuori jättikalmari
  nousee hylyn raunioista, lonkerot kietoutuvat laivanrunkoon.
- **Vaiheet:**
  1. Lonkero-iskut yksi kerrallaan (telegraffattu varjo) → torju tai ammu imukupit.
  2. Mustesumu peittää näkyvyyttä → valoraketti/kaikuluoti paljastaa silmän.
  3. Paljastunut silmä = heikko kohta; latausosuma päättää.
- **Heikot kohdat:** imukupit (vaihe 1) → silmä (vaihe 3).
- **Opetus:** "etsi hehku, lataa, ammu, torju syöksy".

### 2 · Scylla & Charybdis — *Mediterranean Sea* (parivaltio)
- **Rooli:** kaksoispomo + ympäristö-uhka. Opettaa prioriteettien hallintaa.
- **Olemus:** upponnut antiikin temppeli; **Scylla** on monipäinen petokäärme,
  **Charybdis** valtava pohjan pyörre, joka imee alusta ajoittain.
- **Vaiheet:** Scyllan päät hyökkäävät vuoron perään, samalla kun Charybdis-pyörre
  pakottaa ampumaan ankkuriköysiä pysyäksesi paikoillaan. Lopussa: pyörre nielee
  Scyllan pään → osuma silloin tekee tuplavahingon.
- **Heikot kohdat:** kunkin pään kita (auki hyökätessä) · pyörteen ydin.

### 3 · Maelstrom Serpent *(Maelström-käärme)* — *North Sea*
- **Rooli:** liikkuva, kiertävä pomo sumussa; opettaa ennakointia.
- **Olemus:** kylmä, sumuinen öljylautan hylky; pitkä merikäärme kiertää lauttaa
  ja syöksyy sumusta arvaamattomista kulmista (ääni varoittaa suunnan).
- **Vaiheet:** kiertonopeus kasvaa; ruostuneita lautan osia putoaa (ammu pois);
  lopuksi käärme kietoo lautan → ammu liitoskohdat.
- **Heikot kohdat:** kiduskaaret syöksyn aikana · selkärangan liitokset.

### 4 · Giant Moray — *Red Sea* (Leviathan spawn)
- **Rooli:** ahtaan tilan väijyjä; opettaa nopeaa reagointia kapeikossa.
- **Olemus:** kapeat korallisolat; jättimurena iskee piiloistaan koloista —
  pelaaja liikkuu solassa, murena vilahtaa monessa kolossa, vain yksi on "oikea".
- **Vaiheet:** harhautukset lisääntyvät; myrkkypilviä (torjuttava); finaalissa
  murena lukittautuu solaan suu auki → latausosuma kitaan.
- **Heikot kohdat:** kita iskun hetkellä · kurkun hehkuva rakkula.

### 5 · The Abyssal Angler *(Pohjaton ahven)* — *Sargasso Sea*
- **Rooli:** pimeyspomo; opettaa valon/näkyvyyden hallintaa.
- **Olemus:** levän tukahduttama haamulaivasto, lähes pimeää; valtava
  syvänmeren ahven houkuttelee **hehkusyötillä** — ainoa valonlähde, joka myös
  paljastaa sen suun.
- **Vaiheet:** syötti liikkuu (seuraa sitä) → kita avautuu nielaistakseen →
  ammu kitaan avausikkunassa. Pimeys kasvaa; haamulaivojen hylyt putoavat.
- **Heikot kohdat:** hehkusyötin tyvi · nielun pohja kidan auetessa.

### 6 · Hydra — *Black Sea* (monipäinen)
- **Rooli:** prioriteetti-/resurssipomo; opettaa "älä ammu väärää kohdetta".
- **Olemus:** hapeton, myrkynvihreä syvyys; monipäinen käärme — **pään ampuminen
  kasvattaa kaksi uutta**, ellet polta tynkää (tuli-/sähköharppuuna). Klassinen
  myytti mekaniikkana.
- **Vaiheet:** päitä lisää; lopuksi paljastuu sydän, kun kaikki aktiiviset päät on
  tainnutettu yhtä aikaa (verkkoampuja loistaa tässä).
- **Heikot kohdat:** kaulan tyngät (polta) · keskussydän.

### 7 · Makara — *Indian Ocean*
- **Rooli:** liikkuva monsuunipomo; opettaa ympäristön (virta, sade) lukemista.
- **Olemus:** myyttinen vesieläin (norsun kärsä + krokotiili + kala) temppelin
  raunioilla; nostaa vesipatsaita ja virtoja, jotka muuttavat reittiä.
- **Vaiheet:** virtaukset siirtelevät pelaajaa; kärsä-isku (torjuttava); panssari
  irtoaa osuma-alueittain paljastaen sydämen.
- **Heikot kohdat:** kärsän tyvi · paljastuva panssarisauma.

### 8 · Umibōzu & Isonade — *Sea of Japan* (haamu + jättihai)
- **Rooli:** kaksivaiheinen tunnelma- → raivopomo; opettaa pelon hallintaa.
- **Olemus:** myrsky ja kummituslaivat; ensin **Umibōzu**, varjomainen merihenki
  (näkymätön ilman kaikuluotia), sitten se ruumiillistuu **Isonade**-jättihaiksi.
- **Vaiheet:** 1) skannaa varjo näkyväksi, torju aaltoiskut; 2) Isonade syöksyy
  pinnan alta (varjo + kuohu telegraffaa); 3) raivovaihe, nopeat syöksysarjat.
- **Heikot kohdat:** Umibōzun ydin (skannattuna) · Isonaden kidukset/silmä.

### 9 · Frozen Liopleurodon — *Weddell Sea (Antarctic)*
- **Rooli:** jään alla; opettaa ympäristön rikkomista (ammu jäätä).
- **Olemus:** sininen pimeys jäälautan alla; muinainen merimatelija jään
  vankina/ympäröimänä; ammu jääkuoria irti paljastaaksesi kohteet.
- **Vaiheet:** murra jää neljästä kohdasta; vapautuva peto syöksyy; lopuksi
  jäätävä henkäys (torju jääpuikot) → avausikkuna sydämeen.
- **Heikot kohdat:** jään alta paljastuvat raajaliitokset · sydän finaalissa.

### 10 · The Bloop — *Mariana Trench*
- **Rooli:** "kuilun kauhu"; tunnelman ja mittakaavan huippu.
- **Olemus:** mustanvioletti kuilu, bioluminesenssi; **valtava, osin näkymätön
  kolossi**, josta erottuvat vain hehkuvat osat ja silmät pimeydestä. Mittakaava
  on pelottava — koko ruutu on hirviötä.
- **Vaiheet:** hehkuvat heikot kohdat syttyvät vuorotellen pimeydessä → ammu
  ennen sammumista; paine-aallot (torju); finaalissa koko olento valaisee itsensä
  → tuhat heikkoa pistettä, combo-huipennus hidastuksessa.
- **Heikot kohdat:** vaihtuvat hehkusolmut · keskussilmä finaalissa.

### 11 · Iku-Turso — *Arctic Ocean* 🇫🇮
- **Rooli:** kunnianosoitus suomalaiselle mytologialle; ympäristö + monimuoto.
- **Olemus:** jäälautat ja revontulet; **Iku-Turso** (myös *Tursas*), *Kalevalan*
  hirmuinen merihirviö ("tuhatpää, tuhatsarvinen") — muodoltaan lonkeroinen,
  sarvekas, nousee meren pohjasta tulta/sumua syösten. Revontulet värittävät taistelun.
- **Vaiheet:** sarviset lonkerot iskevät jään läpi; kutsuu pienempiä otuksia
  (raivaa parvi); lopuksi nousee kokonaan pinnalle revontulien alla → ammu
  hehkuvat silmät yksi kerrallaan.
- **Heikot kohdat:** lonkeroiden tyvet · "tuhat" hehkuvaa silmää (vaiheittain).
- **Lore-koukku:** kytkeytyy mentorin päiväkirjoihin pohjoisesta.

### 12 · Jörmungandr — *The Lost Sea / Atlantis* (loppupomo)
- **Rooli:** finaali; kaiken opitun yhdistävä monivaiheinen huipennus.
- **Olemus:** uponnut Atlantis; **maailmankäärme**, niin valtava että se kiertää
  areenan — sinä taistelet *sen sisällä ja ympärillä*. Mentorin kohtalo paljastuu.
- **Vaiheet (4):**
  1. Käärme kiertää Atlantista; ammu temppelin valopylväät paljastaaksesi sen.
  2. Myrkkyhenkäys ja kivisade (torju) — kaikki torjuntataidot käytössä.
  3. Sukellat sen "läpi" käytävämäisessä osiossa, sisäiset heikot kohdat.
  4. Pinnalle nousu: koko maailmankäärme, viimeinen latausosuma-huipennus
     hidastuksessa — tarinan ja taidon yhteishuipennus.
- **Heikot kohdat:** valopylväiden paljastamat suomut · sisäelimet · sydän.

---

## 3. Piilohirviöt (salaiset apexit)

Vähintään yksi per meri; laukeavat vain tietyllä reitillä, säällä, kellonajalla
tai ehdolla (esim. "älä menetä comboa koko tasolla"). Antavat +8 hirviötä ja
syyn tutkia jokainen haara. Esimerkkejä (pelinimet EN):

- **Megalodon** — *Caribbean Sea*: ilmestyy, jos kaikki hylkyaarteet kerätään.
- **Ghost-Ship Crab** *(Aavelaiva-rapu)* — *Sargasso Sea*: jättirapu haamulaivan rungossa.
- **Electric Ray Matriarch** *(Sähkörausku-emo)* — *Indian Ocean*: vain myrskyn aikana.
- **Leviathan (full-grown)** — *Red Sea* (NG+): Giant Morayn "äiti".
- **Vellamo's Warden** *(Vellamon vartija)* — *Arctic Ocean*: suomalaismyytti-bonus, vesien haltijan peto.
- … loput suunnitellaan tuotannossa, teemoina kunkin meren paikallismyytit.

---

## 4. Tavalliset viholliset

Parvi- ja täytevihollisten paletti vaihtelee merittäin, mutta ne rakennetaan
muutamasta **arkkityypistä** (alla), jotta ne ovat helppoja tuottaa ja pelaajan
helppoja lukea. Esimerkkejä biomeittain (pelin alueet EN):

| Meri | Tyypillisiä parvivihollisia |
|---|---|
| Caribbean Sea | terhakkaat haikalat, piikkimakrillit, merirosvo-piranhat, miinakuplat |
| Mediterranean Sea | murenat, meduusaparvet, kivenheittäjä-raputykit |
| North Sea | ahdistuneet hailaumat, ruostemiinat, sähköankeriaat |
| Sargasso Sea | hehkukalat, leväkädet (tarttuvat), haamukalat |
| Black Sea | myrkkymeduusat, luurankokalat, happokuplat |
| Mariana Trench | bioluminesoivat saalistajat, painekuplat, näkymättömät väijyjät |
| Arctic Ocean | jääpiikkikalat, mursunhirviöt, kylmäsumun haamut |

Jokainen vihollinen on yhden arkkityypin "ihotus" → nopea tuotanto, johdonmukainen
luettavuus. (Pelin sisäiset viholliskuvaukset ja -nimet kirjoitetaan englanniksi.)

---

## 5. Vihollisarkkityypit (suunnittelurungot)

> Lihavoidut nimet ovat ehdotettuja **koodi-/pelinimiä (EN)**; suluissa suomenkielinen selite.

| Arkkityyppi | Käytös | Uhka | Pelaajan vastaus |
|---|---|---|---|
| **Charger** *(Syöksyjä)* | tulee suoraan kohti, telegraffattu | osuma kontaktista | ammu ennen kontaktia / torju |
| **Swarm** *(Parvi)* | monta heikkoa, tulee aalloissa | nakertaa terveyttä | aluease, combo-tulitus |
| **Shooter** *(Ampuja)* | jää etäälle, ampuu projektiilin | torjuttava ammus | ammu ammus tai ampuja |
| **Latcher** *(Tarttuja)* | takertuu, hidastaa/peittää näkyvyyttä | rajoittaa tähtäystä | ammu irti nopeasti |
| **Armored** *(Panssaroitu)* | kestää, paljastaa heikon kohdan | imee aikaa/ammuksia | sonipiikki / heikko kohta |
| **Ambusher** *(Väijyjä)* | piiloutuu, yllättää | yllätysvahinko | kaikuluoti/valo paljastaa |
| **Support — elite** *(Tukija)* | parantaa/kutsuu muita | pitkittää taistelua | priorisoi ensin |
| **Hazard** *(Ympäristö-uhka)* | virrat, putoavat hylyt, miinat | alueellinen | väistä reitillä / ammu pois |

> **Tuotantoperiaate:** uusi vihollinen syntyy valitsemalla arkkityyppi + biomin
> teema + 1 erikoispiirre. Näin 40+ vihollisvarianttia syntyy hallitusti ilman,
> että pelaajan pitää opetella 40 erillistä sääntöä.

---

*Takaisin:* [README](../README.md) · [GDD](game-design-document.md) · [Tekninen suunnitelma](technical-design.md)
