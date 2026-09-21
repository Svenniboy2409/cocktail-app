import { useCallback, useEffect, useState } from 'react'
import { term } from './terms'

// Interface language. English is the default; Dutch is the alternative.

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
    'Folders, saved cocktails and your own recipes':
      'Mappen, bewaarde cocktails en je eigen recepten',
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

    // folders
    Folders: 'Mappen',
    'New folder': 'Nieuwe map',
    'Edit folder': 'Map bewerken',
    'Create folder': 'Map maken',
    'Delete folder': 'Map verwijderen',
    'Save to folder': 'Opslaan in map',
    'In {n} folder': 'In {n} map',
    'In {n} folders': 'In {n} mappen',
    'No folders yet': 'Nog geen mappen',
    'Group your saved drinks however you like — a party, a season, a shelf of your bar.':
      'Groepeer je bewaarde drankjes zoals jij wilt — een feestje, een seizoen, een plank van je bar.',
    'Folders let you group the drinks you save. Make your first one and this cocktail goes straight in.':
      'Met mappen groepeer je de drankjes die je bewaart. Maak je eerste map en deze cocktail gaat er meteen in.',
    'Give your folder a name.': 'Geef je map een naam.',
    'Folder created': 'Map aangemaakt',
    'Folder updated': 'Map bijgewerkt',
    'Folder deleted': 'Map verwijderd',
    'Added to {folder}': 'Toegevoegd aan {folder}',
    'Removed from {folder}': 'Verwijderd uit {folder}',
    'Delete “{name}”? The cocktails in it stay in your library.':
      '“{name}” verwijderen? De cocktails erin blijven in je bibliotheek.',
    Cover: 'Omslag',
    'e.g. Summer evenings': 'bijv. Zomeravonden',
    'Without a cover we’ll build one from the drinks inside.':
      'Zonder omslag maken we er een van de drankjes die erin zitten.',
    'Use a collage instead': 'Toch een collage gebruiken',
    'Folder not found': 'Map niet gevonden',
    'Back to Library': 'Terug naar bibliotheek',
    'This folder is empty': 'Deze map is leeg',
    'Open a cocktail and tap “Save to folder” to put it in here.':
      'Open een cocktail en tik op “Opslaan in map” om hem hierin te zetten.',
    Back: 'Terug',

    // settings
    Language: 'Taal',
    'Interface and recipes. Drink names stay as they are.':
      'De app en de recepten. De namen van de drankjes blijven zoals ze zijn.',
    Tiles: 'Tegels',
    List: 'Lijst',
    'How your folders look in the Library.': 'Hoe je mappen eruitzien in de bibliotheek.',
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

/* -------------------- recipe text -------------------- */
// The recipes are written in English and translated through a lookup table of
// every scenario, ingredient, measure, glass, garnish and step in the catalogue. That
// table is large, so it is fetched only when somebody actually reads the app
// in Dutch — English readers never download it.

let recipeDict = null
let recipeLoading = null

function loadRecipeDict() {
  if (recipeDict || recipeLoading) return
  recipeLoading = import('../data/nl-recipes')
    .then((m) => {
      recipeDict = m.default
      // Nudge every component to render again now that the words are here.
      window.dispatchEvent(new CustomEvent(EVENT))
    })
    .catch(() => {
      // Leaving recipeDict null simply keeps the recipe in English.
      recipeLoading = null
    })
}

// Translate one piece of recipe text. Anything the table does not know — a
// recipe the user wrote themselves — comes back unchanged.
export function recipeText(text, lang) {
  if (lang !== 'nl' || !recipeDict || !text) return text
  return recipeDict[text] || text
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

// The hook components use: `const { t, tt, tr, lang } = useI18n()`.
//  t  — an interface string
//  tt — a value out of the catalogue (a tag, a glass, a spirit)
//  tr — recipe text (an ingredient, a measure, a preparation step)
export function useI18n() {
  const lang = useLang()
  useEffect(() => {
    if (lang === 'nl') loadRecipeDict()
  }, [lang])
  const t = useCallback((key, vars) => translate(key, lang, vars), [lang])
  const tt = useCallback((value) => term(value, lang), [lang])
  const tr = useCallback((text) => recipeText(text, lang), [lang])
  return { lang, t, tt, tr }
}
