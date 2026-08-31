// Where each drink comes from, so the search box doubles as a map: type
// "Cuba" and get the mojitos and daiquiris, type "Caribbean" and get the
// whole shelf, type "South America" and get the continent.
//
// A place carries the regions it belongs to and its continent, so one entry
// per drink buys country, region and continent search at once. Aliases cover
// the words people actually type — "usa", "british", "holland", "bali".
// Drinks with no settled origin are simply left out rather than invented.

const PLACES = {
  // --- North America and the Caribbean ---
  'United States': { regions: ['North America'], continent: 'North America', aliases: ['usa', 'us', 'america', 'american', 'united states of america', 'states'] },
  Canada: { regions: ['North America'], continent: 'North America', aliases: ['canadian'] },
  Hawaii: { regions: ['Polynesia', 'Pacific'], continent: 'Oceania', aliases: ['hawaiian'], parents: ['United States'] },
  Mexico: { regions: ['North America', 'Latin America'], continent: 'North America', aliases: ['mexican'] },
  Cuba: { regions: ['Caribbean', 'Latin America', 'West Indies'], continent: 'North America', aliases: ['cuban'] },
  Jamaica: { regions: ['Caribbean', 'West Indies'], continent: 'North America', aliases: ['jamaican'] },
  'Puerto Rico': { regions: ['Caribbean', 'Latin America', 'West Indies'], continent: 'North America', aliases: ['puerto rican'] },
  Barbados: { regions: ['Caribbean', 'West Indies'], continent: 'North America', aliases: ['barbadian', 'bajan'] },
  'Trinidad and Tobago': { regions: ['Caribbean', 'West Indies'], continent: 'North America', aliases: ['trinidad', 'trinidadian', 'tobago'] },
  Bahamas: { regions: ['Caribbean', 'West Indies'], continent: 'North America', aliases: ['bahamian'] },
  Bermuda: { regions: ['Caribbean', 'Atlantic'], continent: 'North America', aliases: ['bermudian'] },
  Martinique: { regions: ['Caribbean', 'West Indies'], continent: 'North America', aliases: ['french west indies'], parents: ['France'] },
  'British Virgin Islands': { regions: ['Caribbean', 'West Indies'], continent: 'North America', aliases: ['bvi', 'virgin islands', 'tortola'] },
  'Cayman Islands': { regions: ['Caribbean', 'West Indies'], continent: 'North America', aliases: ['cayman'] },

  // --- South America ---
  Brazil: { regions: ['South America', 'Latin America'], continent: 'South America', aliases: ['brazilian', 'brasil'] },
  Peru: { regions: ['South America', 'Latin America', 'Andes'], continent: 'South America', aliases: ['peruvian'] },
  Chile: { regions: ['South America', 'Latin America', 'Andes'], continent: 'South America', aliases: ['chilean'] },
  Argentina: { regions: ['South America', 'Latin America'], continent: 'South America', aliases: ['argentinian', 'argentine'] },

  // --- Europe ---
  'United Kingdom': { regions: ['British Isles', 'Western Europe'], continent: 'Europe', aliases: ['uk', 'britain', 'british', 'england', 'english', 'great britain'] },
  Scotland: { regions: ['British Isles', 'Western Europe'], continent: 'Europe', aliases: ['scottish', 'scots'], parents: ['United Kingdom'] },
  Ireland: { regions: ['British Isles', 'Western Europe'], continent: 'Europe', aliases: ['irish', 'eire'] },
  France: { regions: ['Western Europe'], continent: 'Europe', aliases: ['french'] },
  Belgium: { regions: ['Western Europe', 'Benelux'], continent: 'Europe', aliases: ['belgian'] },
  Netherlands: { regions: ['Western Europe', 'Benelux'], continent: 'Europe', aliases: ['dutch', 'holland'] },
  Germany: { regions: ['Central Europe'], continent: 'Europe', aliases: ['german'] },
  Austria: { regions: ['Central Europe', 'Alps'], continent: 'Europe', aliases: ['austrian', 'tyrol'] },
  Czechia: { regions: ['Central Europe'], continent: 'Europe', aliases: ['czech', 'czech republic', 'bohemia'] },
  Poland: { regions: ['Central Europe', 'Eastern Europe'], continent: 'Europe', aliases: ['polish'] },
  Italy: { regions: ['Southern Europe', 'Mediterranean'], continent: 'Europe', aliases: ['italian'] },
  Spain: { regions: ['Southern Europe', 'Mediterranean', 'Iberia'], continent: 'Europe', aliases: ['spanish'] },
  Portugal: { regions: ['Southern Europe', 'Iberia'], continent: 'Europe', aliases: ['portuguese'] },
  Greece: { regions: ['Southern Europe', 'Mediterranean', 'Balkans'], continent: 'Europe', aliases: ['greek'] },
  Cyprus: { regions: ['Southern Europe', 'Mediterranean'], continent: 'Europe', aliases: ['cypriot'] },
  Sweden: { regions: ['Nordics', 'Scandinavia'], continent: 'Europe', aliases: ['swedish'] },
  Norway: { regions: ['Nordics', 'Scandinavia'], continent: 'Europe', aliases: ['norwegian'] },
  Russia: { regions: ['Eastern Europe'], continent: 'Europe', aliases: ['russian'] },

  // --- Africa and the Middle East ---
  Morocco: { regions: ['North Africa', 'Maghreb'], continent: 'Africa', aliases: ['moroccan'] },
  Egypt: { regions: ['North Africa'], continent: 'Africa', aliases: ['egyptian'] },
  Kenya: { regions: ['East Africa'], continent: 'Africa', aliases: ['kenyan'] },
  'South Africa': { regions: ['Southern Africa'], continent: 'Africa', aliases: ['south african'] },
  Turkey: { regions: ['Middle East', 'Mediterranean', 'Anatolia'], continent: 'Asia', aliases: ['turkish', 'turkiye'] },
  Lebanon: { regions: ['Middle East', 'Levant'], continent: 'Asia', aliases: ['lebanese'] },

  // --- Asia and Oceania ---
  India: { regions: ['South Asia'], continent: 'Asia', aliases: ['indian'] },
  Japan: { regions: ['East Asia'], continent: 'Asia', aliases: ['japanese'] },
  'South Korea': { regions: ['East Asia'], continent: 'Asia', aliases: ['korea', 'korean'] },
  Vietnam: { regions: ['Southeast Asia'], continent: 'Asia', aliases: ['vietnamese'] },
  Thailand: { regions: ['Southeast Asia'], continent: 'Asia', aliases: ['thai'] },
  Singapore: { regions: ['Southeast Asia'], continent: 'Asia', aliases: ['singaporean'] },
  Malaysia: { regions: ['Southeast Asia'], continent: 'Asia', aliases: ['malaysian'] },
  Indonesia: { regions: ['Southeast Asia'], continent: 'Asia', aliases: ['indonesian', 'bali', 'balinese'] },
  Myanmar: { regions: ['Southeast Asia'], continent: 'Asia', aliases: ['burma', 'burmese', 'rangoon', 'yangon'] },
  Australia: { regions: ['Oceania'], continent: 'Oceania', aliases: ['australian', 'aussie'] },
  'French Polynesia': { regions: ['Polynesia', 'Pacific', 'Oceania'], continent: 'Oceania', aliases: ['tahiti', 'tahitian'], parents: ['France'] },
}

// place -> the drinks that come from it. Grouping this way keeps the list
// readable and makes it obvious when a country is thin on drinks.
const BY_PLACE = {
  Mexico: [
    'margarita', 'strawberry-margarita', 'blue-margarita', 'watermelon-margarita',
    'whitecap-margarita', 'virgin-margarita', 'paloma', 'cantarito', 'vampiro',
    'michelada', 'bloody-maria', 'tequila-sunrise', 'virgin-sunrise', 'tequila-sour',
    'tequila-fizz', 'mexican-coffee', 'chamaco', 'carajillo', 'homemade-coffee-liqueur',
    'watermelon-agua-fresca',
  ],
  Cuba: [
    'mojito', 'strawberry-mojito', 'passion-fruit-mojito', 'dark-rum-mojito',
    'virgin-mojito', 'daiquiri', 'strawberry-daiquiri', 'strawberry-banana-daiquiri',
    'frozen-daiquiri', 'banana-daiquiri', 'frozen-pineapple-daiquiri',
    'frozen-mint-daiquiri', 'cuba-libre', 'el-presidente', 'canchanchara',
    'havana-cocktail', 'hemingway-special', 'mary-pickford', 'bacardi-cocktail',
  ],
  'United States': [
    'old-fashioned', 'cosmopolitan', 'cranberry-smash', 'dry-martini', 'melon-ball',
    'vodka-martini', 'dirty-martini', 'french-martini', 'bellini-martini', 'manhattan',
    'miami-vice', 'malibu-twister', 'day-at-the-beach', 'moscow-mule', 'long-island',
    'whiskey-sour', 'bourbon-sour', 'scotch-sour', 'gin-sour', 'rum-sour', 'mai-tai',
    'hurricane', 'blue-hurricane', 'sex-on-the-beach', 'safe-sex-on-the-beach',
    'fuzzy-navel', 'appletini', 'screwdriver', 'harvey-wallbanger', 'gin-cooler',
    'california-lemonade', 'new-york-lemonade', 'ranch-water', 'martinez',
    'tommys-margarita', 'sazerac', 'vieux-carre', 'ramos-gin-fizz', 'amaretto-sour',
    'amaretto-stone-sour', 'stone-sour', 'apricot-lady', 'tuxedo-cocktail', 'boomerang',
    'mint-julep', 'brandy-cobbler', 'rum-cobbler', 'gin-daisy', 'gin-smash', 'revolver',
    'mind-eraser', 'colorado-bulldog', 'toasted-almond', 'gin-toddy', 'rum-toddy',
    'aviation', 'clover-club', 'gin-fizz', 'royal-gin-fizz', 'zombie', 'last-word',
    'grasshopper', 'after-five', 'oreo-mudslide', 'coffee-cocktail', 'kioki-coffee',
    'sea-breeze', 'raspberry-cooler', 'rum-cooler', 'rusty-nail', 'penicillin',
    'salty-dog', 'greyhound', 'kamikaze', 'lemon-drop', 'rob-roy', 'godfather',
    'gin-rickey', 'jack-rose', 'allegheny', 'quakers-cocktail', 'rum-runner',
    'alabama-slammer', 'royal-flush', 'red-snapper-shot', 'texas-rattlesnake',
    'pink-lady', 'stinger', 'new-york-sour', 'frisco-sour', 'chicago-fizz',
    'japanese-fizz', 'imperial-fizz', 'casino', 'bijou', 'horses-neck', 'algonquin',
    'turf-cocktail', 'derby', 'shirley-temple', 'roy-rogers', 'arnold-palmer',
    'virgin-mule', 'pink-lemonade', 'pussyfoot', 'cherry-limeade', 'blueberry-lemonade',
    'peach-iced-tea', 'rail-splitter', 'marshmallow-hot-chocolate', 'egg-cream',
    'eggnog-classic', 'apple-cider-punch', 'strawberry-lemonade', 'limeade',
    'orangeade', 'cranberry-punch', 'halloween-punch',
    'bees-knees', 'southside', 'eastside', 'jasmine-cocktail', 'french-blonde', 'chartreuse-swizzle', 'strawberry-basil-smash', 'frose', 'bay-breeze', 'madras', 'spicy-margarita', 'mango-margarita', 'maple-old-fashioned', 'apple-cider-mule', 'spiced-pear-martini', 'cranberry-bourbon-smash', 'chai-old-fashioned', 'apple-grande', 'hot-buttered-rum', 'tom-and-jerry', 'poinsettia', 'gingerbread-martini', 'kentucky-b-and-b', 'chocolate-martini', 'shamrock', 'black-magic', 'witches-brew', 'pumpkin-spice-white-russian', 'blood-orange-negroni', 'cucumber-lemonade', 'lavender-lemonade', 'carrot-ginger-fizz', 'peppermint-hot-chocolate', 'midnight-mint', 'rose-sangria', 'toffee-apple-punch',
  ],
  Canada: ['caesar', 'b-52', 'b-53', 'avalanche',
    'maple-old-fashioned',
  ],
  Hawaii: ['blue-hawaiian', 'lava-flow', 'hawaiian-cocktail', 'waikiki-beachcomber', 'aloha-fruit-punch'],
  Jamaica: ['jamaican-coffee', 'jamaica-kiss', 'blue-mountain', 'lord-and-lady', 'bob-marley', 'planters-punch', 'yellow-bird'],
  'Puerto Rico': ['pina-colada', 'virgin-pina-colada',
    'coquito',
  ],
  Barbados: ['corn-n-oil', 'rum-punch'],
  'Trinidad and Tobago': ['queens-park-swizzle'],
  Bahamas: ['bahama-mama', 'goombay-smash'],
  Bermuda: ['dark-and-stormy', 'rum-swizzle'],
  Martinique: ['ti-punch'],
  'British Virgin Islands': ['painkiller'],
  'Cayman Islands': ['mudslide'],

  Brazil: ['caipirinha', 'caipirissima', 'dark-caipirinha', 'batida-de-coco', 'cafe-brasil', 'ipanema'],
  Peru: ['pisco-sour', 'chilcano', 'chicha-morada',
    'duchamps-punch',
  ],
  Chile: ['terremoto'],
  Argentina: ['fernet-con-coca'],

  'United Kingdom': [
    'espresso-martini', 'gin-tonic', 'tom-collins', 'john-collins', 'gimlet', 'gin-sling',
    'alaska-cocktail', 'white-lady', 'angel-face', 'bramble', 'pimms-cup', 'vesper',
    'russian-spring-punch', 'corpse-reviver', 'rum-milk-punch', 'brandy-alexander',
    'cafe-savoy', 'slippery-nipple', 'snowball',
    'pornstar-martini', 'whisky-mac', 'sloe-gin-fizz', 'blackthorn', 'sherry-eggnog', 'wassail', 'rosemary-blue', 'pink-gin', 'elderflower-cooler', 'rhubarb-collins', 'salted-toffee-martini', 'black-and-tan', 'autumn-sangria',
  ],
  Scotland: ['bobby-burns', 'rusty-nail', 'rob-roy', 'scotch-sour',
    'scotch-cobbler', 'whisky-mac',
  ],
  Ireland: ['irish-coffee', 'irish-cream', 'hot-creamy-bush', 'nutty-irishman', 'baby-guinness', 'irish-spring', 'tipperary',
    'black-and-tan', 'shamrock',
  ],
  France: [
    'blue-lagoon', 'bloody-mary', 'virgin-mary', 'mimosa', 'french-75', 'kir', 'kir-royale',
    'sidecar', 'applecar', 'boulevardier', 'old-pal', 'champagne-cocktail', 'champs-elysees',
    'between-the-sheets', 'monkey-gland', 'french-connection',
    'green-beast', 'rose-cocktail', 'calvados-sour',
  ],
  Belgium: ['black-russian', 'white-russian'],
  Netherlands: ['snowball'],
  Germany: ['mulled-wine', 'black-forest-shake',
    'radler',
  ],
  Czechia: ['beton'],
  Poland: ['szarlotka', 'kompot'],
  Italy: [
    'negroni', 'negroni-sbagliato', 'aperol-spritz', 'hugo-spritz', 'garibaldi',
    'bicicletta', 'americano', 'bellini', 'virgin-bellini', 'italian-coffee',
    'caffe-corretto', 'godfather',
    'limoncello-spritz', 'sgroppino', 'bombardino', 'aperol-sour',
  ],
  Spain: [
    'sangria', 'kalimotxo', 'agua-de-valencia', 'rebujito', 'valencia-cocktail',
    'spanish-coffee', 'carajillo', 'castillian-hot-chocolate', 'lemon-coke',
    'sol-y-sombra',
  ],
  Portugal: ['porto-tonico', 'poncha'],
  Greece: ['greek-frappe'],
  Cyprus: ['brandy-sour'],
  Sweden: ['glogg', 'swedish-coffee', 'espresso-tonic'],
  Norway: ['karsk'],
  Russia: ['kompot'],

  Morocco: ['moroccan-mint-tea'],
  Egypt: ['karkade'],
  Kenya: ['dawa'],
  'South Africa': ['springbok-shooter', 'dom-pedro', 'rooibos-iced-tea'],
  Turkey: ['ayran'],
  Lebanon: ['arak-limonana'],

  India: ['masala-chai', 'mango-lassi', 'sweet-lassi', 'salt-lassi', 'masala-lassi', 'nimbu-pani', 'falooda', 'gin-tonic'],
  Japan: ['japanese-highball', 'umeshu-soda', 'sakura-martini', 'midori-sour', 'japanese-slipper'],
  'South Korea': ['soju-yakult', 'sujeonggwa'],
  Vietnam: ['egg-coffee', 'vietnamese-iced-coffee'],
  Thailand: ['thai-iced-tea', 'thai-iced-coffee'],
  Singapore: ['singapore-sling', 'milo-dinosaur', 'bandung'],
  Malaysia: ['jungle-bird', 'bandung'],
  Indonesia: ['arak-attack'],
  Myanmar: ['pegu-club'],
  Australia: ['japanese-slipper'],
  'French Polynesia': ['bora-bora'],
  Austria: ['jagertee'],
}

// The town or state a drink is tied to, where there is a good story behind it.
const CITIES = {
  mojito: 'Havana', daiquiri: 'Santiago de Cuba', 'frozen-daiquiri': 'Havana',
  'cuba-libre': 'Havana', 'el-presidente': 'Havana', 'havana-cocktail': 'Havana',
  'hemingway-special': 'Havana', 'mary-pickford': 'Havana', canchanchara: 'Trinidad',
  'old-fashioned': 'Louisville', cosmopolitan: 'New York', 'dry-martini': 'New York',
  manhattan: 'New York', 'french-martini': 'New York', 'long-island': 'New York',
  'new-york-lemonade': 'New York', 'new-york-sour': 'New York', aviation: 'New York',
  penicillin: 'New York', 'rob-roy': 'New York', stinger: 'New York',
  algonquin: 'New York', 'tuxedo-cocktail': 'New York', 'egg-cream': 'Brooklyn',
  sazerac: 'New Orleans', 'vieux-carre': 'New Orleans', 'ramos-gin-fizz': 'New Orleans',
  hurricane: 'New Orleans', 'blue-hurricane': 'New Orleans', 'gin-fizz': 'New Orleans',
  grasshopper: 'New Orleans', martinez: 'San Francisco', revolver: 'San Francisco',
  'frisco-sour': 'San Francisco', 'lemon-drop': 'San Francisco',
  'tommys-margarita': 'San Francisco', 'moscow-mule': 'Los Angeles',
  appletini: 'Los Angeles', zombie: 'Hollywood', 'shirley-temple': 'Hollywood',
  'mai-tai': 'Oakland', 'clover-club': 'Philadelphia', 'last-word': 'Detroit',
  'chicago-fizz': 'Chicago', 'mint-julep': 'Kentucky', derby: 'Kentucky',
  'gin-rickey': 'Washington DC', 'ranch-water': 'West Texas',
  'texas-rattlesnake': 'Texas', 'alabama-slammer': 'Alabama',
  'california-lemonade': 'California', 'harvey-wallbanger': 'California',
  'kioki-coffee': 'California', allegheny: 'Pennsylvania', 'rum-runner': 'Florida Keys',
  'sex-on-the-beach': 'Florida', 'miami-vice': 'Miami', 'rail-splitter': 'Illinois',
  'pina-colada': 'San Juan', caesar: 'Calgary', 'b-52': 'Banff',
  'blue-lagoon': 'Paris', 'bloody-mary': 'Paris', 'virgin-mary': 'Paris',
  mimosa: 'Paris', 'french-75': 'Paris', sidecar: 'Paris', boulevardier: 'Paris',
  'old-pal': 'Paris', 'champs-elysees': 'Paris', 'monkey-gland': 'Paris',
  'between-the-sheets': 'Paris', kir: 'Dijon', 'black-russian': 'Brussels',
  'white-russian': 'Brussels', negroni: 'Florence', 'negroni-sbagliato': 'Milan',
  americano: 'Milan', bellini: 'Venice', 'virgin-bellini': 'Venice',
  'hugo-spritz': 'South Tyrol', 'aperol-spritz': 'Venice', beton: 'Prague',
  'espresso-martini': 'London', 'tom-collins': 'London', 'john-collins': 'London',
  'alaska-cocktail': 'London', 'white-lady': 'London', bramble: 'London',
  vesper: 'London', 'corpse-reviver': 'London', 'cafe-savoy': 'London',
  'russian-spring-punch': 'London', 'brandy-alexander': 'London',
  'irish-coffee': 'Foynes', 'greek-frappe': 'Thessaloniki', poncha: 'Madeira',
  'porto-tonico': 'Porto', kalimotxo: 'Basque Country', rebujito: 'Seville',
  'agua-de-valencia': 'Valencia', 'valencia-cocktail': 'Valencia',
  'castillian-hot-chocolate': 'Castile', 'black-forest-shake': 'Black Forest',
  'espresso-tonic': 'Helsingborg', 'pisco-sour': 'Lima', ipanema: 'Rio de Janeiro',
  terremoto: 'Santiago', 'fernet-con-coca': 'Córdoba', chamaco: 'Mexico City',
  cantarito: 'Jalisco', dawa: 'Nairobi', 'jungle-bird': 'Kuala Lumpur',
  'pegu-club': 'Yangon', 'arak-attack': 'Bali', 'egg-coffee': 'Hanoi',
  'japanese-slipper': 'Melbourne', 'sweet-lassi': 'Punjab', 'masala-lassi': 'South India',
  'blue-mountain': 'Blue Mountains', 'pornstar-martini': 'London',
  'bees-knees': 'Paris', southside: 'Chicago', eastside: 'New York',
  'chartreuse-swizzle': 'San Francisco', 'green-beast': 'Paris',
  'rose-cocktail': 'Paris', sgroppino: 'Venice', 'limoncello-spritz': 'Amalfi',
  'calvados-sour': 'Normandy', radler: 'Munich', jagertee: 'Tyrol',
  'sol-y-sombra': 'Madrid', frose: 'New York', 'tom-and-jerry': 'New York',
  'kentucky-b-and-b': 'Kentucky', 'maple-old-fashioned': 'Vermont', 'cherry-limeade': 'Oklahoma',
}

// id -> [place names]. Built once from the grouping above; a drink can belong
// to more than one place (a Gin & Tonic is as Indian as it is British).
const PLACES_BY_ID = (() => {
  const map = {}
  for (const [place, ids] of Object.entries(BY_PLACE)) {
    for (const id of ids) (map[id] ||= []).push(place)
  }
  return map
})()

// The places a drink comes from, or an empty list when we don't know.
export function placesOf(cocktail) {
  return PLACES_BY_ID[cocktail?.id] || []
}

// The town it was first poured in, where that is known.
export function cityOf(cocktail) {
  return CITIES[cocktail?.id] || ''
}

// A short line for the detail page: "Havana, Cuba" or "Italy".
export function originLabel(cocktail) {
  const places = placesOf(cocktail)
  if (!places.length) return ''
  const city = CITIES[cocktail.id]
  return city ? `${city}, ${places[0]}` : places.join(' & ')
}

// Every word worth searching a drink's origin by: the country, its aliases,
// the regions it sits in, its continent and the city it was poured in first.
export function originKeywords(cocktail) {
  const out = new Set()
  const add = (place, depth = 0) => {
    const def = PLACES[place]
    if (!def || depth > 2) return
    out.add(place)
    for (const a of def.aliases || []) out.add(a)
    for (const r of def.regions || []) out.add(r)
    out.add(def.continent)
    for (const p of def.parents || []) add(p, depth + 1)
  }
  for (const place of placesOf(cocktail)) add(place)
  const city = CITIES[cocktail?.id]
  if (city) out.add(city)
  return Array.from(out)
}
