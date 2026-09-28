# Social aanzetten: je Firebase-project

Social (profielen, vrienden, gedeelde cocktails) heeft een online database
nodig. Die draait bij Firebase, op jouw eigen Google-account, op het gratis
Spark-abonnement — er is geen creditcard nodig. Zolang
`src/lib/firebase-config.js` leeg is, blijft Social helemaal onzichtbaar en
werkt de rest van de app gewoon zoals altijd.

Het aanmaken duurt ongeveer tien minuten.

## 1. Project aanmaken

1. Ga naar <https://console.firebase.google.com> en log in met je Google-account.
2. **Project maken** → naam: `Mixly`.
3. Google Analytics mag **uit**; de app gebruikt het niet.

## 2. Inloggen met e-mail aanzetten

1. Links: **Build → Authentication** → **Aan de slag**.
2. Tab **Aanmeldmethode** → **E-mailadres/wachtwoord** → de eerste schakelaar
   aan (de tweede, "e-maillink", blijft uit) → **Opslaan**.
3. Tab **Instellingen** → **Geautoriseerde domeinen** → **Domein toevoegen** →
   `svenniboy2409.github.io`.

## 3. De database maken

1. Links: **Build → Firestore Database** → **Database maken**.
2. Kies een locatie in Europa (bijvoorbeeld `eur3` of `europe-west4`,
   Nederland). **Deze keuze is definitief.**
3. Start in **productiemodus**.
4. Tab **Regels**: vervang alles door de inhoud van het bestand
   [`firestore.rules`](firestore.rules) uit deze repository → **Publiceren**.

   Deze regels zijn de hele beveiliging: zij zorgen ervoor dat alleen
   vrienden elkaars gedeelde cocktails zien, dat privé privé blijft en dat
   niemand je vriend wordt zonder dat jij het accepteert.

## 4. De web-app registreren

1. Tandwiel linksboven → **Projectinstellingen** → tab **Algemeen**.
2. Onderaan bij **Je apps**: het `</>`-icoon (web).
3. Bijnaam: `Mixly`. **Firebase Hosting niet aanvinken** — de app blijft op
   GitHub Pages staan.
4. Je krijgt een blok code te zien met `const firebaseConfig = { … }`.
   Kopieer alleen het object tussen de accolades en stuur het op, of zet het
   zelf in `src/lib/firebase-config.js` op de plek van `null`.

Deze waarden zijn niet geheim: een Firebase-webapp is bedoeld om ze mee te
sturen. Wat de gegevens beschermt, zijn de regels uit stap 3.

## Wat het kost

Niets, zolang je binnen het gratis gebruik van het Spark-abonnement blijft.
Voor een vriendengroep zit je daar ruim onder: elke gedeelde cocktail is één
klein document, foto's worden verkleind meegestuurd (een paar honderd kB
hooguit), en de app haalt alleen op wat je vrienden gedeeld hebben.

## Lokaal testen, zonder het echte project

```sh
npm i -g firebase-tools
firebase emulators:start --only auth,firestore --project demo-mixly
VITE_FIREBASE_EMULATOR=1 npm run dev
```

Met `VITE_FIREBASE_EMULATOR=1` praat de app met de emulator in plaats van
met Firebase; bevestigingsmails staan dan op
<http://127.0.0.1:9099/emulator/v1/projects/demo-mixly/oobCodes>.
