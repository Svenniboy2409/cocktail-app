# Social aanzetten: je Firebase-project

Social (profielen, vrienden, gedeelde cocktails) heeft een online database
nodig. Die draait bij Firebase, op jouw eigen Google-account, op het gratis
Spark-abonnement — er is geen creditcard nodig. Zolang
`src/lib/firebase-config.js` leeg is, blijft Social helemaal onzichtbaar en
werkt de rest van de app gewoon zoals altijd.

Reken op een kwartier. De Firebase-console verandert af en toe van uiterlijk;
als een knop net anders heet, zoek dan naar het woord dat het dichtst in de
buurt komt.

## 1. Project aanmaken

1. Ga op een computer naar <https://console.firebase.google.com> en log in
   met je Google-account.
2. Klik **Een project maken** (of **Create a project**).
3. Projectnaam: `Mixly`. Firebase maakt daar een ID van, zoals `mixly-3f9a2`;
   dat is prima.
4. **Google Analytics**: zet dit **uit**. De app gebruikt het niet.
5. **Project maken** → wacht tot het klaar is → **Doorgaan**.

## 2. Inloggen met Google aanzetten

1. Linkermenu: **Build → Authentication** → **Aan de slag**.
2. Tab **Aanmeldmethode** → bij *Extra providers* (of *Native providers*):
   kies **Google**.
3. Zet de schakelaar op **Inschakelen**.
4. **Openbare naam van het project**: `Mixly` — dit ziet iemand in het
   Google-venster.
5. **E-mailadres voor projectondersteuning**: kies je eigen adres.
6. **Opslaan**.
7. Tab **Instellingen** → **Geautoriseerde domeinen** → **Domein toevoegen** →
   `svenniboy2409.github.io` → **Toevoegen**. (Zonder dit weigert Google in te
   loggen vanaf de app.)

## 3. De database maken

1. Linkermenu: **Build → Firestore Database** → **Database maken**.
2. Vraagt hij om een editie: kies **Standard**.
3. **Locatie**: kies iets in Europa, bijvoorbeeld `eur3 (europe)` of
   `europe-west4 (Nederland)`. **Deze keuze kan later niet meer veranderd
   worden.**
4. Kies **Starten in productiemodus** → **Maken**.
5. Open de tab **Regels**. Haal alles weg wat er staat, en plak de volledige
   inhoud van het bestand [`firestore.rules`](firestore.rules) uit deze
   repository. Klik **Publiceren**.

   Deze regels zijn de hele beveiliging: zij zorgen ervoor dat alleen
   vrienden elkaars gedeelde cocktails zien, dat privé privé blijft, dat
   niemand je vriend wordt zonder dat jij het accepteert en dat niemand een
   gebruikersnaam van een ander kan afpakken.

## 4. De web-app registreren

1. Tandwiel linksboven naast *Projectoverzicht* → **Projectinstellingen** →
   tab **Algemeen**.
2. Scroll naar **Je apps** → klik het `</>`-icoon (Web).
3. Bijnaam: `Mixly`. Vink **Firebase Hosting** níet aan — de app blijft op
   GitHub Pages staan. **App registreren**.
4. Je ziet nu een blok code met `const firebaseConfig = { … }`. Kopieer het
   object tussen de accolades (apiKey, authDomain, projectId, storageBucket,
   messagingSenderId, appId) en stuur het op, of zet het zelf in
   `src/lib/firebase-config.js` op de plek van `null`.

Deze waarden zijn niet geheim: een Firebase-webapp hoort ze mee te sturen.
Wat de gegevens beschermt zijn de regels uit stap 3.

## 5. Aanbevolen: "Mixly" in het Google-venster

Zonder deze stap staat er in het Google-inlogvenster *"Doorgaan naar
mixly-3f9a2.firebaseapp.com"*. Zo verander je dat in *Mixly*:

1. Ga naar <https://console.cloud.google.com> en kies bovenaan hetzelfde
   project.
2. Menu → **APIs en services → OAuth-toestemmingsscherm** (in nieuwere
   versies: **Google Auth Platform → Branding**).
3. **App-naam**: `Mixly`; **ondersteunings-e-mail**: je eigen adres.
   Een logo is optioneel. Opslaan.

## 6. Optioneel: de sleutel vastzetten op jouw site

Dit voorkomt dat anderen je gratis quotum opmaken vanaf een andere website.

1. <https://console.cloud.google.com> → **APIs en services → Inloggegevens**.
2. Open de sleutel die **Browser key (auto created by Firebase)** heet.
3. **Toepassingsbeperkingen → Websites**, en voeg allebei toe:
   - `https://svenniboy2409.github.io/*`
   - `https://<jouw-project-id>.firebaseapp.com/*` — nodig voor het
     Google-inlogvenster; laat je deze weg, dan werkt inloggen niet meer.
4. Opslaan. Het kan een paar minuten duren voordat het werkt.

## Wat het kost

Niets, zolang je binnen het gratis gebruik van het Spark-abonnement blijft.
Voor een vriendengroep zit je daar ruim onder: elke gedeelde cocktail is één
klein document, foto's worden verkleind meegestuurd, en de app haalt alleen
op wat je vrienden gedeeld hebben.

## Lokaal testen, zonder het echte project

```sh
npm i -g firebase-tools
firebase emulators:start --only auth,firestore --project demo-mixly
VITE_FIREBASE_EMULATOR=1 npm run dev
```

Met `VITE_FIREBASE_EMULATOR=1` praat de app met de emulator in plaats van
met Firebase, en toont de Google-knop een nep-inlogscherm van de emulator.
