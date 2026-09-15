import { useCallback, useEffect, useState } from 'react'
import { term } from './terms'

// Interface language. English is the default; Dutch is the alternative. The
// recipes themselves stay in English — this translates the app around them.

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
]

const KEY = 'mixly:lang'
const EVENT = 'mixly:lang-changed'

export function getLang() {
  try {
    const saved = localStorage.getItem(KEY)
    if (LANGUAGES.some((l) => l.code === saved)) return saved
  } catch {
    /* private mode, blocked storage */
  }
  return 'en'
}

export function setLang(code) {
  try {
    localStorage.setItem(KEY, code)
  } catch {
    /* nothing we can do; the choice just won't survive a reload */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: code }))
}

// The current language, re-rendering every component that asks when it changes.
export function useLang() {
  const [lang, set] = useState(getLang)
  useEffect(() => {
    const onChange = () => set(getLang())
    window.addEventListener(EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])
  return lang
}

/* -------------------- interface strings -------------------- */
// Keys read as English so an untranslated string still says something sensible.

const STRINGS = {
  nl: {
    // navigation
    Discover: 'Ontdek',
    Library: 'Bibliotheek',
    'Create a recipe': 'Recept maken',

    // Discover
    'Find your next favourite pour': 'Vind je volgende favoriet',
    'Search a drink, ingredient or country…': 'Zoek een drankje, ingrediënt of land…',
    'Clear search and filters': 'Zoekopdracht en filters wissen',
    'Open filters': 'Filters openen',
    'Clear filters': 'Filters wissen',
    cocktail: 'cocktail',
    cocktails: 'cocktails',
    'No cocktails found': 'Geen cocktails gevonden',
    'Try a different search or filter.': 'Probeer een andere zoekterm of filter.',

    // filter groups
    Type: 'Soort',
    Style: 'Stijl',
    Season: 'Seizoen',
    Occasion: 'Gelegenheid',
    'Base spirit': 'Basisdrank',
    Glass: 'Glas',
    Serve: 'Serveerstijl',
    'All types': 'Alle soorten',
    'All styles': 'Alle stijlen',
    'All year round': 'Het hele jaar',
    'Any occasion': 'Elke gelegenheid',
    'All base spirits': 'Alle basisdranken',
    'All glasses': 'Alle glazen',
    'All serves': 'Alle serveerstijlen',
    All: 'Alle',
    Filters: 'Filters',
    Reset: 'Wissen',
    'Show {n} cocktails': 'Toon {n} cocktails',
    'Show {n} cocktail': 'Toon {n} cocktail',

    // recommendations
    'For your bar': 'Voor jouw bar',
    'Made with what you have': 'Met wat je in huis hebt',
    'Based on your library': 'Op basis van je bibliotheek',
    'A little inspiration': 'Een beetje inspiratie',
    Recommended: 'Aanrader',
    'Tip: tell us what’s in your bar from the': 'Tip: geef in het tabblad',
    'tab for recommendations you can actually mix.':
      'aan wat je in huis hebt, voor aanbevelingen die je echt kunt maken.',

    // Library
    'Your collection': 'Jouw verzameling',
    'Saved cocktails and your own recipes': 'Bewaarde cocktails en je eigen recepten',
    'My bar': 'Mijn bar',
    'Set up your bar': 'Stel je bar in',
    Settings: 'Instellingen',
    'Open settings': 'Instellingen openen',
    'My recipes': 'Mijn recepten',
    'No recipes yet': 'Nog geen recepten',
    'Tap the + button to craft your first cocktail.':
      'Tik op de +-knop om je eerste cocktail te maken.',
    Saved: 'Bewaard',
    'Nothing saved yet': 'Nog niets bewaard',
    'Browse Discover and tap the bookmark to save cocktails here.':
      'Blader door Ontdek en tik op het bladwijzertje om cocktails hier te bewaren.',
    Mine: 'Eigen',

    // settings
    Language: 'Taal',
    'The app’s interface. Recipes stay in English.':
      'De taal van de app. De recepten blijven Engels.',
    Backup: 'Back-up',
    'Your data lives in this browser only. Export a file to back it up or move it to another device.':
      'Je gegevens staan alleen in deze browser. Exporteer een bestand om ze veilig te stellen of naar een ander apparaat te verhuizen.',
    Export: 'Exporteren',
    Import: 'Importeren',
    'Library exported': 'Bibliotheek geëxporteerd',
    'Imported {n} recipes': '{n} recepten geïmporteerd',
    'Imported {n} recipe': '{n} recept geïmporteerd',
    'Import failed': 'Importeren mislukt',
    Done: 'Klaar',

    // your bar
    'Your bar': 'Jouw bar',
    'Select the spirits you have at home. We’ll use these — together with the cocktails in your library — to recommend drinks you can actually make, right at the top of Discover.':
      'Kies de dranken die je in huis hebt. Samen met de cocktails in je bibliotheek gebruiken we die voor aanbevelingen die je echt kunt maken, bovenaan Ontdek.',
    'Nothing selected yet.': 'Nog niets geselecteerd.',
    '{n} spirits in your bar.': '{n} dranken in je bar.',
    '{n} spirit in your bar.': '{n} drank in je bar.',

    // cocktail detail
    Ingredients: 'Ingrediënten',
    Recipe: 'Bereiding',
    'Save to library': 'Bewaar in bibliotheek',
    'Saved to library': 'Bewaard in bibliotheek',
    'Removed from library': 'Verwijderd uit bibliotheek',
    'Remove from library': 'Verwijder uit bibliotheek',
    'Cocktail not found': 'Cocktail niet gevonden',
    'Back to Discover': 'Terug naar Ontdek',
    'Go back': 'Terug',
    Edit: 'Bewerken',
    Delete: 'Verwijderen',
    'Recipe deleted': 'Recept verwijderd',
    'Delete “{name}”? This can’t be undone.':
      '“{name}” verwijderen? Dit kan niet ongedaan worden gemaakt.',
    'Show drinks from {place}': 'Toon drankjes uit {place}',
    'Show drinks served in a {glass} glass': 'Toon drankjes in een {glass}',
    'Show drinks garnished with {garnish}': 'Toon drankjes met {garnish}',

    // create / edit recipe
    'New recipe': 'Nieuw recept',
    'Edit recipe': 'Recept bewerken',
    Save: 'Opslaan',
    Cancel: 'Annuleren',
    Photo: 'Foto',
    Replace: 'Vervangen',
    Name: 'Naam',
    'Base spirit / category': 'Basisdrank / categorie',
    '(optional)': '(optioneel)',
    Tags: 'Stijlen',
    'When to serve it': 'Wanneer je hem schenkt',
    '(the perfect scenario)': '(het perfecte moment)',
    Garnish: 'Garnering',
    'Recipe steps': 'Bereidingsstappen',
    'Recipe updated': 'Recept bijgewerkt',
    'Recipe added to your library': 'Recept toegevoegd aan je bibliotheek',
    'Give your cocktail a name.': 'Geef je cocktail een naam.',
    'Something went wrong while saving.': 'Er ging iets mis bij het opslaan.',
    Preview: 'Voorbeeld',
    Remove: 'Verwijderen',
    '+ Add ingredient': '+ Ingrediënt',
    '+ Add step': '+ Stap',
    'Saving…': 'Opslaan…',
    'Save changes': 'Wijzigingen opslaan',
    'Add to library': 'Toevoegen aan bibliotheek',
    'e.g. Midnight Espresso': 'bijv. Midnight Espresso',
    'e.g. Rum, Gin, Mocktail…': 'bijv. Rum, Gin, Mocktail…',
    'Describe the moment this cocktail is made for…':
      'Beschrijf het moment waarvoor deze cocktail gemaakt is…',
    'e.g. Coupe': 'bijv. Coupe',
    'e.g. Orange peel': 'bijv. Sinaasappelschil',
    Ingredient: 'Ingrediënt',
    'Describe this step…': 'Beschrijf deze stap…',
  },
}

// Fill {placeholders} from a plain object.
function fill(text, vars) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
}

// Translate one interface string. `key` is its English wording, so a missing
// entry falls through to readable English rather than a blank or a key name.
export function translate(key, lang, vars) {
  const table = STRINGS[lang]
  return fill((table && table[key]) || key, vars)
}

// The hook components use: `const { t, tt, lang } = useI18n()`.
//  t  — an interface string
//  tt — a value out of the catalogue (a tag, a glass, a spirit)
export function useI18n() {
  const lang = useLang()
  const t = useCallback((key, vars) => translate(key, lang, vars), [lang])
  const tt = useCallback((value) => term(value, lang), [lang])
  return { lang, t, tt }
}
