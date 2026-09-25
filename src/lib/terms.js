// Dutch names for the values that come out of the data — the filter chips, the
// tags on a card, the spirits in your bar. These are the catalogue's own words,
// so they stay the keys everywhere in the code; only the label changes.
//
// Kept free of React so the data module can read it as well: the search box
// indexes both languages, which is what makes "kerst" and "zomer" find
// something while the catalogue itself is written in English.

// Anything not listed reads the same in both languages (Gin, Tiki, Campari…).
export const NL_TERMS = {
  // drink types
  'Mixed drink': 'Mixdrank',
  Coffee: 'Koffie',

  // styles
  Refreshing: 'Verfrissend',
  Classic: 'Klassiek',
  Party: 'Feest',
  'After dinner': 'Na het eten',
  Strong: 'Stevig',
  Fruity: 'Fruitig',
  Sour: 'Zuur',

  // seasons and occasions
  Spring: 'Lente',
  Summer: 'Zomer',
  Autumn: 'Herfst',
  Christmas: 'Kerst',
  'New Year': 'Nieuwjaar',
  "Valentine's": 'Valentijn',
  Easter: 'Pasen',
  "St Patrick's": 'St Patrick',
  Carnival: 'Carnaval',

  // glassware
  Highball: 'Longdrinkglas',
  Rocks: 'Tumbler',
  Martini: 'Martiniglas',
  Hurricane: 'Hurricaneglas',
  Margarita: 'Margaritaglas',
  'Wine glass': 'Wijnglas',
  'Champagne flute': 'Champagneflûte',
  Mug: 'Mok',
  'Copper mug': 'Koperen mok',
  'Pint glass': 'Bierglas',
  'Shot glass': 'Shotglas',
  'Punch bowl': 'Punchbowl',

  // serve styles
  Long: 'Lang',
  Short: 'Kort',
  Frozen: 'Bevroren',
  Muddled: 'Gemuddeld',
  Stirred: 'Geroerd',
  'Built in glass': 'In het glas',
  Layered: 'Gelaagd',
  Creamy: 'Romig',
  Sparkling: 'Bruisend',
  Hot: 'Warm',
  Savoury: 'Hartig',

  // categories and spirits
  Whiskey: 'Whisky',
  Vodka: 'Wodka',
  'Non-alcoholic': 'Alcoholvrij',
  Mixed: 'Mix',
  Aperitif: 'Aperitief',
  Liqueur: 'Likeur',
  'Sparkling wine': 'Mousserende wijn',
  Wine: 'Wijn',
  Beer: 'Bier',
  'Plum wine': 'Pruimenwijn',
  'Ginger wine': 'Gemberwijn',
  Vermouth: 'Vermout',
  Absinthe: 'Absint',
  'Coffee liqueur': 'Koffielikeur',
  'Chocolate liqueur': 'Chocoladelikeur',
  'Cream liqueur': 'Roomlikeur',
  'Melon liqueur': 'Meloenlikeur',
  'Banana liqueur': 'Bananenlikeur',
  'Blackberry liqueur': 'Bramenlikeur',
  'Raspberry liqueur': 'Frambozenlikeur',
  'Strawberry liqueur': 'Aardbeienlikeur',
  'Passion fruit liqueur': 'Passievruchtlikeur',
  'Elderflower liqueur': 'Vlierbloesemlikeur',
  'Peach schnapps': 'Perzikschnaps',
  'Apple schnapps': 'Appelschnaps',
  'Cinnamon schnapps': 'Kaneelschnaps',
  'Peppermint schnapps': 'Pepermuntschnaps',
  'Crème de menthe': 'Crème de menthe',
  'Irish cream': 'Irish cream',
  'Sloe gin': 'Sleedoorngin',
}

// Dutch words for things that are not catalogue values but that people type:
// the families a drink belongs to, and the seasons by another name.
export const NL_EXTRA = {
  Mocktail: ['alcoholvrij', 'zonder alcohol', 'geen alcohol', 'fris'],
  Cocktail: ['cocktail'],
  Coffee: ['cafeine', 'koffie'],
  Shooter: ['shotje', 'shotjes'],
  Shot: ['shotje', 'shotjes', 'borrel', 'borrelglas'],
  Frozen: ['geblend', 'bevroren'],
  Hot: ['warm', 'heet'],
  Creamy: ['romig', 'nagerecht', 'dessert'],
  Punch: ['feest', 'groep', 'kan', 'schaal'],
  Tiki: ['tropisch', 'strand', 'vakantie'],
  Sparkling: ['bubbels', 'bruisend', 'proost'],
  Sour: ['zuur', 'citrus'],
  Aperitivo: ['aperitief', 'borrel'],
  Savoury: ['hartig'],
  Summer: ['strand', 'vakantie', 'zomers'],
  Winter: ['koud weer', 'open haard'],
  Autumn: ['najaar'],
  Spring: ['voorjaar'],
  Christmas: ['kerstmis', 'kerstdagen', 'feestdagen'],
  'New Year': ['oud en nieuw', 'oudjaar'],
  Easter: ['paasdagen'],
  Halloween: ['griezel', 'eng'],
  Brunch: ['ontbijt', 'brunch'],
  Party: ['feest', 'feestje'],
  Classic: ['klassieker'],
  Strong: ['sterk'],
}

// The label for a catalogue value in the chosen language.
export function term(value, lang) {
  if (lang !== 'nl') return value
  return NL_TERMS[value] || value
}
