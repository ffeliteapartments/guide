// ════════════════════════════════════════════
//  DEFAULT DATA
// ════════════════════════════════════════════
const DEFAULT_DATA = {
  bbName: "Il Tuo B&B",
  subtitle: "Guest Guide",
  cityZone: "La Tua Città · Zona",
  pwaName: '',
  pwaShortName: '',
  hostName: "Nome Host",
  hostPhone: "+39 000 000 0000",
  googleReviewUrl: "",
  qrBaseUrl: '',
  supportPhone: '',
  customDomain: '',
  checkinSteps: [
    { icon: "📍", titleIt: "Raggiungi l'appartamento", titleEn: "Reach the apartment", descIt: "Segui le indicazioni su Google Maps per raggiungere l'indirizzo.", descEn: "Follow Google Maps directions to reach the address." },
    { icon: "🔑", titleIt: "Ritira le chiavi", titleEn: "Pick up the keys", descIt: "Le chiavi sono nella cassetta di sicurezza accanto alla porta. Il codice ti è stato inviato via messaggio.", descEn: "Keys are in the lockbox next to the door. The code was sent to you via message." },
    { icon: "🚪", titleIt: "Entra nell'appartamento", titleEn: "Enter the apartment", descIt: "Apri la porta e fai come se fossi a casa tua!", descEn: "Open the door and make yourself at home!" },
    { icon: "📶", titleIt: "Connettiti al WiFi", titleEn: "Connect to WiFi", descIt: "Il nome della rete e la password li trovi nella sezione Soggiorno.", descEn: "You can find the network name and password in the Stay section." }
  ],
  welcomeIt: "Siamo felici di avervi come ospiti! Questo appartamento è stato preparato con cura per rendere il vostro soggiorno indimenticabile. Siamo a vostra disposizione per qualsiasi necessità — non esitate a contattarci.",
  welcomeEn: "We are delighted to have you as our guests! This apartment has been carefully prepared to make your stay unforgettable. We are at your disposal for any need — do not hesitate to contact us.",
  closingTitleIt: "Grazie per aver scelto il nostro B&B!",
  closingTitleEn: "Thank you for choosing our B&B!",
  closingTextIt: "È stato un piacere avervi come ospiti. Speriamo di rivedervi presto! Buon viaggio! ✈️",
  closingTextEn: "It was a pleasure having you as our guests. We hope to see you again soon! Have a great trip! ✈️",
  extraContacts: [
    { name: "Secondo Contatto", phone: "+39 000 000 0001" }
  ],
  apts: [
    {
      name: "Appartamento 1",
      address: "Via Example 1, La Tua Città",
      addressShort: "Via Example 1",
      mapsLink: "#",
      maxGuests: "4 persone",
      maxGuestsEn: "4 people",
      bedroomTagsIt: "Letto matrimoniale,Armadio,Biancheria inclusa,Cuscini extra",
      bedroomTagsEn: "Double bed,Wardrobe,Linen included,Extra pillows",
      wifi: "NomeRete",
      wifiPass: obfuscate("password123"),
      checkin: "15:00",
      checkout: "10:00",
      lat: '',
      lon: '',
      howToReachIt: "Dalla stazione centrale: prendete la metro linea A fino alla fermata Centrale, poi 10 minuti a piedi. In taxi dal centro ~10€. Consigliamo di salvare l'indirizzo su Google Maps prima di partire.",
      howToReachEn: "From the central station: take metro line A to the Centrale stop, then 10 minutes on foot. Taxi from the centre ~€10. We recommend saving the address on Google Maps before you set off.",
      howToAccessIt: "Le chiavi vi verranno consegnate direttamente dall'host al vostro arrivo. In caso di check-in autonomo, troverete le istruzioni dettagliate via messaggio prima dell'arrivo.",
      howToAccessEn: "Keys will be handed to you directly by the host upon your arrival. In case of self check-in, you will find detailed instructions via message before your arrival.",
      parkingIt: "Parcheggio pubblico disponibile nelle vicinanze (~200 metri). Strisce blu a pagamento nei giorni feriali 8:00–20:00 (~€1,50/h). Parcheggio gratuito nelle strisce bianche.",
      parkingEn: "Public parking available nearby (~200 metres). Blue lines (paid) on weekdays 8:00–20:00 (~€1.50/h). Free parking on white lines.",
      houseRules: [
        { icon: "🔇", titleIt: "Silenzio Notturno", titleEn: "Quiet Hours", descIt: "Dalle 22:00 alle 8:00 si prega di mantenere il silenzio per rispetto dei vicini.", descEn: "From 22:00 to 08:00 please keep noise to a minimum out of respect for the neighbours." },
        { icon: "🚭", titleIt: "Niente Fumo", titleEn: "No Smoking", descIt: "Vietato fumare all'interno dell'appartamento. È possibile farlo sul balcone.", descEn: "Smoking inside the apartment is strictly prohibited. It is allowed on the balcony." },
        { icon: "🐾", titleIt: "Animali Domestici", titleEn: "Pets", descIt: "Gli animali domestici non sono ammessi senza previo accordo con l'host.", descEn: "Pets are not allowed without prior agreement with the host." },
        { icon: "👥", titleIt: "Ospiti Esterni", titleEn: "Outside Guests", descIt: "Non sono ammesse feste. Il numero di ospiti non deve superare la capienza massima indicata.", descEn: "No parties allowed. The number of guests must not exceed the maximum capacity indicated." },
        { icon: "♻️", titleIt: "Raccolta Rifiuti", titleEn: "Waste Sorting", descIt: "Si prega di rispettare la raccolta differenziata. Istruzioni in cucina.", descEn: "Please follow the recycling rules. Instructions are in the kitchen." }
      ],
      kitchenTagsIt: "Piano cottura,Forno,Frigorifero,Lavastoviglie,Caffettiera,Microonde",
      kitchenTagsEn: "Hob,Oven,Refrigerator,Dishwasher,Coffee machine,Microwave",
      bathroomTagsIt: "Doccia,Asciugamani,Phon,Prodotti igiene",
      bathroomTagsEn: "Shower,Towels,Hair dryer,Toiletries",
      extraServices: [
        { icon: "🧺", nameIt: "Cambio Biancheria", nameEn: "Linen Change", descIt: "Ogni 4 giorni su richiesta", descEn: "Every 4 days on request" },
        { icon: "🧹", nameIt: "Pulizie Aggiuntive", nameEn: "Additional Cleaning", descIt: "Disponibile su richiesta", descEn: "Available on request" },
        { icon: "🚗", nameIt: "Transfer Aeroporto", nameEn: "Airport Transfer", descIt: "Prenotabile in anticipo", descEn: "Bookable in advance" },
        { icon: "☕", nameIt: "Colazione", nameEn: "Breakfast", descIt: "Disponibile su richiesta", descEn: "Available on request" }
      ],
      places: [
        { name: "Monumento Principale", emoji: "🏛", descIt: "Il monumento più famoso della città. Perfetto per chi ama la storia.", descEn: "The most famous monument in the city. Perfect for history lovers.", howIt: "🚇 Metro linea A → fermata Centrale → 10 min a piedi.", howEn: "🚇 Metro line A → Centrale stop → 10 min on foot.", maps: "#" },
        { name: "Piazza Centrale", emoji: "⛲", descIt: "La piazza principale della città, cuore della vita sociale.", descEn: "The main square of the city, heart of social life.", howIt: "🚌 Bus 10 o 20 → fermata Piazza Centrale.", howEn: "🚌 Bus 10 or 20 → Piazza Centrale stop.", maps: "#" },
        { name: "Chiesa Storica", emoji: "🎭", descIt: "Un'importante chiesa storica con architettura medievale.", descEn: "An important historic church with medieval architecture.", howIt: "🚶 A piedi ~15 minuti dal centro.", howEn: "🚶 On foot ~15 minutes from the centre.", maps: "#" },
        { name: "Parco Panoramico", emoji: "🍊", descIt: "Parco con vista panoramica sulla città. Accesso libero.", descEn: "Park with a panoramic view over the city. Free admission.", howIt: "🚌 Bus 5 → fermata Parco.", howEn: "🚌 Bus 5 → Parco stop.", maps: "#" },
        { name: "Museo Locale", emoji: "🏺", descIt: "Il museo principale della zona con collezioni locali.", descEn: "The main local museum with regional collections.", howIt: "🚇 Metro → fermata Museo.", howEn: "🚇 Metro → Museo stop.", maps: "#" }
      ],
      restaurants: [
        { name: "Ristorante Da Mario", emoji: "🍝", tipo: "Trattoria · Vicino a casa", descIt: "Cucina tipica italiana. Ottimi primi piatti. Prenotazione consigliata.", descEn: "Typical Italian cuisine. Excellent pasta dishes. Booking recommended.", price: "€€", maps: "#" },
        { name: "Pizzeria Il Forno", emoji: "🍕", tipo: "Pizzeria · Zona centro", descIt: "Ottima pizza napoletana cotta in forno a legna.", descEn: "Excellent Neapolitan pizza cooked in a wood-fired oven.", price: "€", maps: "#" },
        { name: "Bar Centrale", emoji: "☕", tipo: "Bar · Colazione", descIt: "Il bar perfetto per la colazione: cappuccino e cornetto.", descEn: "The perfect bar for breakfast: cappuccino and croissant.", price: "€", maps: "#" },
        { name: "Osteria del Porto", emoji: "🍷", tipo: "Osteria · Cucina di pesce", descIt: "Specialità di pesce fresco. Atmosfera accogliente.", descEn: "Fresh fish specialities. Welcoming atmosphere.", price: "€€€", maps: "#" }
      ],
      supermarkets: [
        { name: "Supermercato", emoji: "🛒", tipo: "", descIt: "Supermercato più vicino a ~300 metri. Orari: Lun–Sab 8:00–20:00, Dom 9:00–13:00.", descEn: "Nearest supermarket ~300 metres away. Hours: Mon–Sat 8:00–20:00, Sun 9:00–13:00.", price: "", maps: "" }
      ],
      checkoutSteps: [
        { titleIt: "Raccogliete i vostri effetti personali", titleEn: "Collect your personal belongings", descIt: "Controllate tutti i cassetti, armadi e il bagno per non dimenticare nulla.", descEn: "Check all drawers, wardrobes and the bathroom so you don't forget anything." },
        { titleIt: "Lasciate le chiavi", titleEn: "Leave the keys", descIt: "Depositate le chiavi nel luogo indicato dall'host al momento del check-in.", descEn: "Leave the keys in the place indicated by the host at check-in." },
        { titleIt: "Rifiuti e raccolta differenziata", titleEn: "Waste and recycling", descIt: "Smaltite i rifiuti negli appositi contenitori seguendo le istruzioni in cucina.", descEn: "Dispose of waste in the appropriate containers following the instructions in the kitchen." },
        { titleIt: "Lasciate una recensione", titleEn: "Leave a review", descIt: "Se avete apprezzato il soggiorno, la vostra recensione è un grande aiuto per noi!", descEn: "If you enjoyed your stay, your review is a huge help for us!" }
      ],
      transport: {
        airportEnabled: true,
        airportIcon: "✈️",
        airportIt: "All'uscita dell'aeroporto trovi i taxi ufficiali. Tariffa fissa ~50–60€ per il centro. In alternativa, treno diretto per la stazione centrale ogni 30 min (~14€).",
        airportEn: "At the airport exit you will find official taxis. Fixed fare ~€50–60 to the city centre. Alternatively, direct train to the central station every 30 min (~€14).",
        airportMaps: "",
        stationEnabled: true,
        stationIcon: "🚉",
        stationIt: "Dalla stazione puoi prendere metro, autobus o taxi per raggiungere l'appartamento. La fermata metro è a 5 min a piedi.",
        stationEn: "From the station you can take the metro, bus or taxi to reach the apartment. The metro stop is 5 min on foot.",
        stationMaps: "",
        metroEnabled: true,
        metroIcon: "🚇",
        metroIt: "Fermata più vicina: Centrale (Linea A) a 800 metri dall'appartamento.",
        metroEn: "Nearest stop: Centrale (Line A), 800 metres from the apartment.",
        metroMaps: "",
        busEnabled: true,
        busIcon: "🚌",
        busIt: "Linee principali: Bus 10, 20, 30 verso il centro. Fermata a 200 metri dall'appartamento.",
        busEn: "Main lines: Bus 10, 20, 30 towards the city centre. Stop 200 metres from the apartment.",
        busMaps: "",
        ticketsIt: "Biglietto singolo: ~€1,50 (valido 90 minuti). Abbonamento giornaliero: ~€5,00. Acquisto alle macchinette in stazione o tramite app.",
        ticketsEn: "Single ticket: ~€1.50 (valid 90 minutes). Daily pass: ~€5.00. Purchase at station machines or via app.",
        taxiIt: "Taxi ufficiali: trovate i posteggi in piazza principale e in stazione. App consigliate: Uber, FREE NOW, Bolt. Tariffa minima ~€5.",
        taxiEn: "Official taxis: you'll find stands at the main square and at the station. Recommended apps: Uber, FREE NOW, Bolt. Minimum fare ~€5."
      }
    },
    {
      name: "Appartamento 2",
      address: "Via Example 2, La Tua Città",
      addressShort: "Via Example 2",
      mapsLink: "#",
      maxGuests: "4 persone",
      maxGuestsEn: "4 people",
      bedroomTagsIt: "Letto matrimoniale,Armadio,Biancheria inclusa,Cuscini extra",
      bedroomTagsEn: "Double bed,Wardrobe,Linen included,Extra pillows",
      wifi: "NomeRete2",
      wifiPass: obfuscate("password456"),
      checkin: "15:00",
      checkout: "10:00",
      lat: '',
      lon: '',
      howToReachIt: "Dalla stazione centrale: prendete la metro linea A fino alla fermata Centrale, poi 10 minuti a piedi. In taxi dal centro ~10€. Consigliamo di salvare l'indirizzo su Google Maps prima di partire.",
      howToReachEn: "From the central station: take metro line A to the Centrale stop, then 10 minutes on foot. Taxi from the centre ~€10. We recommend saving the address on Google Maps before you set off.",
      howToAccessIt: "Le chiavi vi verranno consegnate direttamente dall'host al vostro arrivo. In caso di check-in autonomo, troverete le istruzioni dettagliate via messaggio prima dell'arrivo.",
      howToAccessEn: "Keys will be handed to you directly by the host upon your arrival. In case of self check-in, you will find detailed instructions via message before your arrival.",
      parkingIt: "Parcheggio pubblico disponibile nelle vicinanze (~200 metri). Strisce blu a pagamento nei giorni feriali 8:00–20:00 (~€1,50/h). Parcheggio gratuito nelle strisce bianche.",
      parkingEn: "Public parking available nearby (~200 metres). Blue lines (paid) on weekdays 8:00–20:00 (~€1.50/h). Free parking on white lines.",
      houseRules: [
        { icon: "🔇", titleIt: "Silenzio Notturno", titleEn: "Quiet Hours", descIt: "Dalle 22:00 alle 8:00 si prega di mantenere il silenzio per rispetto dei vicini.", descEn: "From 22:00 to 08:00 please keep noise to a minimum out of respect for the neighbours." },
        { icon: "🚭", titleIt: "Niente Fumo", titleEn: "No Smoking", descIt: "Vietato fumare all'interno dell'appartamento. È possibile farlo sul balcone.", descEn: "Smoking inside the apartment is strictly prohibited. It is allowed on the balcony." },
        { icon: "🐾", titleIt: "Animali Domestici", titleEn: "Pets", descIt: "Gli animali domestici non sono ammessi senza previo accordo con l'host.", descEn: "Pets are not allowed without prior agreement with the host." },
        { icon: "👥", titleIt: "Ospiti Esterni", titleEn: "Outside Guests", descIt: "Non sono ammesse feste. Il numero di ospiti non deve superare la capienza massima indicata.", descEn: "No parties allowed. The number of guests must not exceed the maximum capacity indicated." },
        { icon: "♻️", titleIt: "Raccolta Rifiuti", titleEn: "Waste Sorting", descIt: "Si prega di rispettare la raccolta differenziata. Istruzioni in cucina.", descEn: "Please follow the recycling rules. Instructions are in the kitchen." }
      ],
      kitchenTagsIt: "Piano cottura,Forno,Frigorifero,Lavastoviglie,Caffettiera,Microonde",
      kitchenTagsEn: "Hob,Oven,Refrigerator,Dishwasher,Coffee machine,Microwave",
      bathroomTagsIt: "Doccia,Asciugamani,Phon,Prodotti igiene",
      bathroomTagsEn: "Shower,Towels,Hair dryer,Toiletries",
      extraServices: [
        { icon: "🧺", nameIt: "Cambio Biancheria", nameEn: "Linen Change", descIt: "Ogni 4 giorni su richiesta", descEn: "Every 4 days on request" },
        { icon: "🧹", nameIt: "Pulizie Aggiuntive", nameEn: "Additional Cleaning", descIt: "Disponibile su richiesta", descEn: "Available on request" },
        { icon: "🚗", nameIt: "Transfer Aeroporto", nameEn: "Airport Transfer", descIt: "Prenotabile in anticipo", descEn: "Bookable in advance" },
        { icon: "☕", nameIt: "Colazione", nameEn: "Breakfast", descIt: "Disponibile su richiesta", descEn: "Available on request" }
      ],
      places: [
        { name: "Monumento Principale", emoji: "🏛", descIt: "Il monumento più famoso della città. Perfetto per chi ama la storia.", descEn: "The most famous monument in the city. Perfect for history lovers.", howIt: "🚇 Metro linea A → fermata Centrale → 10 min a piedi.", howEn: "🚇 Metro line A → Centrale stop → 10 min on foot.", maps: "#" },
        { name: "Piazza Centrale", emoji: "⛲", descIt: "La piazza principale della città, cuore della vita sociale.", descEn: "The main square of the city, heart of social life.", howIt: "🚌 Bus 10 o 20 → fermata Piazza Centrale.", howEn: "🚌 Bus 10 or 20 → Piazza Centrale stop.", maps: "#" },
        { name: "Chiesa Storica", emoji: "🎭", descIt: "Un'importante chiesa storica con architettura medievale.", descEn: "An important historic church with medieval architecture.", howIt: "🚶 A piedi ~15 minuti dal centro.", howEn: "🚶 On foot ~15 minutes from the centre.", maps: "#" },
        { name: "Parco Panoramico", emoji: "🍊", descIt: "Parco con vista panoramica sulla città. Accesso libero.", descEn: "Park with a panoramic view over the city. Free admission.", howIt: "🚌 Bus 5 → fermata Parco.", howEn: "🚌 Bus 5 → Parco stop.", maps: "#" },
        { name: "Museo Locale", emoji: "🏺", descIt: "Il museo principale della zona con collezioni locali.", descEn: "The main local museum with regional collections.", howIt: "🚇 Metro → fermata Museo.", howEn: "🚇 Metro → Museo stop.", maps: "#" }
      ],
      restaurants: [
        { name: "Ristorante Da Mario", emoji: "🍝", tipo: "Trattoria · Vicino a casa", descIt: "Cucina tipica italiana. Ottimi primi piatti. Prenotazione consigliata.", descEn: "Typical Italian cuisine. Excellent pasta dishes. Booking recommended.", price: "€€", maps: "#" },
        { name: "Pizzeria Il Forno", emoji: "🍕", tipo: "Pizzeria · Zona centro", descIt: "Ottima pizza napoletana cotta in forno a legna.", descEn: "Excellent Neapolitan pizza cooked in a wood-fired oven.", price: "€", maps: "#" },
        { name: "Bar Centrale", emoji: "☕", tipo: "Bar · Colazione", descIt: "Il bar perfetto per la colazione: cappuccino e cornetto.", descEn: "The perfect bar for breakfast: cappuccino and croissant.", price: "€", maps: "#" },
        { name: "Osteria del Porto", emoji: "🍷", tipo: "Osteria · Cucina di pesce", descIt: "Specialità di pesce fresco. Atmosfera accogliente.", descEn: "Fresh fish specialities. Welcoming atmosphere.", price: "€€€", maps: "#" }
      ],
      supermarkets: [
        { name: "Supermercato", emoji: "🛒", tipo: "", descIt: "Supermercato più vicino a ~300 metri. Orari: Lun–Sab 8:00–20:00, Dom 9:00–13:00.", descEn: "Nearest supermarket ~300 metres away. Hours: Mon–Sat 8:00–20:00, Sun 9:00–13:00.", price: "", maps: "" }
      ],
      checkoutSteps: [
        { titleIt: "Raccogliete i vostri effetti personali", titleEn: "Collect your personal belongings", descIt: "Controllate tutti i cassetti, armadi e il bagno per non dimenticare nulla.", descEn: "Check all drawers, wardrobes and the bathroom so you don't forget anything." },
        { titleIt: "Lasciate le chiavi", titleEn: "Leave the keys", descIt: "Depositate le chiavi nel luogo indicato dall'host al momento del check-in.", descEn: "Leave the keys in the place indicated by the host at check-in." },
        { titleIt: "Rifiuti e raccolta differenziata", titleEn: "Waste and recycling", descIt: "Smaltite i rifiuti negli appositi contenitori seguendo le istruzioni in cucina.", descEn: "Dispose of waste in the appropriate containers following the instructions in the kitchen." },
        { titleIt: "Lasciate una recensione", titleEn: "Leave a review", descIt: "Se avete apprezzato il soggiorno, la vostra recensione è un grande aiuto per noi!", descEn: "If you enjoyed your stay, your review is a huge help for us!" }
      ],
      transport: {
        airportEnabled: true,
        airportIcon: "✈️",
        airportIt: "All'uscita dell'aeroporto trovi i taxi ufficiali. Tariffa fissa ~50–60€ per il centro. In alternativa, treno diretto per la stazione centrale ogni 30 min (~14€).",
        airportEn: "At the airport exit you will find official taxis. Fixed fare ~€50–60 to the city centre. Alternatively, direct train to the central station every 30 min (~€14).",
        airportMaps: "",
        stationEnabled: true,
        stationIcon: "🚉",
        stationIt: "Dalla stazione puoi prendere metro, autobus o taxi per raggiungere l'appartamento. La fermata metro è a 5 min a piedi.",
        stationEn: "From the station you can take the metro, bus or taxi to reach the apartment. The metro stop is 5 min on foot.",
        stationMaps: "",
        metroEnabled: true,
        metroIcon: "🚇",
        metroIt: "Fermata più vicina: Centrale (Linea A) a 800 metri dall'appartamento.",
        metroEn: "Nearest stop: Centrale (Line A), 800 metres from the apartment.",
        metroMaps: "",
        busEnabled: true,
        busIcon: "🚌",
        busIt: "Linee principali: Bus 10, 20, 30 verso il centro. Fermata a 200 metri dall'appartamento.",
        busEn: "Main lines: Bus 10, 20, 30 towards the city centre. Stop 200 metres from the apartment.",
        busMaps: "",
        ticketsIt: "Biglietto singolo: ~€1,50 (valido 90 minuti). Abbonamento giornaliero: ~€5,00. Acquisto alle macchinette in stazione o tramite app.",
        ticketsEn: "Single ticket: ~€1.50 (valid 90 minutes). Daily pass: ~€5.00. Purchase at station machines or via app.",
        taxiIt: "Taxi ufficiali: trovate i posteggi in piazza principale e in stazione. App consigliate: Uber, FREE NOW, Bolt. Tariffa minima ~€5.",
        taxiEn: "Official taxis: you'll find stands at the main square and at the station. Recommended apps: Uber, FREE NOW, Bolt. Minimum fare ~€5."
      }
    }
  ],
  navLabels: {
    homeIt: "Home",
    homeIcon: "🏠",
    stayIt: "Soggiorno",
    stayIcon: "🛋️",
    placesIt: "Luoghi",
    placesIcon: "🗺️",
    foodIt: "Mangiare",
    foodIcon: "🍽️",
    transportIt: "Muoversi",
    transportIcon: "🚇",
    departureIt: "Partenza",
    departureIcon: "🧳"
  },
  sectionTitles: {
    stayEyebrowIt: "Il Tuo Appartamento",
    stayTitleIt: "Soggiorno",
    placesEyebrowIt: "Scopri la Città",
    placesTitleIt: "Luoghi",
    foodEyebrowIt: "Dove Mangiare",
    foodTitleIt: "Mangiare",
    transportEyebrowIt: "In Città",
    transportTitleIt: "Muoversi",
    departureEyebrowIt: "È Ora di Partire",
    departureTitleIt: "Partenza"
  },
  reviews: [
    { author: "Maria R.", stars: 5, textIt: "Appartamento bellissimo, pulito e in posizione perfetta! L'host è stato molto disponibile.", textEn: "Beautiful apartment, clean and perfectly located! The host was very helpful." },
    { author: "John S.", stars: 5, textIt: "Esperienza fantastica! Torneremo sicuramente.", textEn: "Fantastic experience! We will definitely come back." },
    { author: "Sophie L.", stars: 5, textIt: "Tutto perfetto, dalla pulizia all'accoglienza. Consigliatissimo!", textEn: "Everything was perfect, from cleanliness to hospitality. Highly recommended!" }
  ]
};

/* PUBLISHED_DATA_START */
const PUBLISHED_DATA = {};
/* PUBLISHED_DATA_END */

// ════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════
let currentData = null;
let currentAptIndex = 0;
let currentRole = null; // 'host' | 'admin'
let settingsDirty = false;

// PIN state
let pinBuffer = '';
const PIN_KEY = 'bnb_admin_pin';
/* DEFAULT_PIN_HASH_START */
const DEFAULT_PIN_HASH = deobfuscateHash('KAo1L2k7CyoLKBUCHBBjNQk9AgI0C2dnYDtrCA00CBU7NggXGxEIHmgLETxjNDUpHz4NDj8fPBU5MjlvCzAvCwAfGDFn');
/* DEFAULT_PIN_HASH_END */

// Login credentials state
const USER_KEY = 'bnb_admin_user';
const PASS_KEY = 'bnb_admin_pass';
/* DEFAULT_USER_HASH_START */
const DEFAULT_USER_HASH = deobfuscateHash('HCs0PhAINgspNjwuNy5oE3E3FW0qC2dnYAoyCSMWGTgpKDIqbzgeE24ibBIyFykeMBIvFBkVNwgPHTBvHik2Oy8/MzFn');
/* DEFAULT_USER_HASH_END */
/* DEFAULT_PASS_HASH_START */
const DEFAULT_PASS_HASH = deobfuscateHash('bgBrHywZFQMSHQw3HBUeOWkOIxYjC2dnYB4zAhA1KCppbxUWDSsUHgxpDBcYPh0RCS0JMT4+Y28XFx42GBgoNjRiKTVn');
/* DEFAULT_PASS_HASH_END */

const RECOVERY_KEY = 'bnb_recovery_hash';
/* DEFAULT_RECOVERY_HASH_START */
const DEFAULT_RECOVERY_HASH = deobfuscateHash('P2w5aT47bzhoamxsaW4+bTxpPGlvYmw+bW5tPDw+OGlsOG85bG1vOGg4YjtuPz4+a2w4OD9sazloPz5vajlu');
/* DEFAULT_RECOVERY_HASH_END */

function getStoredRecoveryHash() {
  return localStorage.getItem(RECOVERY_KEY) || DEFAULT_RECOVERY_HASH;
}


function getStoredPinHash() {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN_HASH;
}

function getStoredUserHash() {
  return localStorage.getItem(USER_KEY) || DEFAULT_USER_HASH;
}

function getStoredPassHash() {
  return localStorage.getItem(PASS_KEY) || DEFAULT_PASS_HASH;
}

// ════════════════════════════════════════════
//  DATA HELPERS
// ════════════════════════════════════════════
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function mergeWithDefaults(stored, defaults) {
  if (!stored || typeof stored !== 'object') return deepClone(defaults);
  const result = deepClone(defaults);
  for (const key of Object.keys(defaults)) {
    const sv = stored[key];
    const dv = defaults[key];
    if (sv === undefined || sv === null) {
      // When an English translation field (*En) is absent from stored data but the matching
      // Italian field (*It) is present, set the English field to an empty string so the
      // autoTranslateField onblur hook can auto-fill it the next time the admin opens the settings panel.
      if (typeof dv === 'string' && key.endsWith('En')) {
        const itKey = key.slice(0, -2) + 'It';
        if (stored[itKey] !== undefined && stored[itKey] !== null) {
          result[key] = '';
        }
      }
      continue;
    }
    if (Array.isArray(dv)) {
      if (Array.isArray(sv)) {
        // Preserve empty arrays (user intentionally cleared) and merge populated ones
        const tpl = dv[0] || {};
        result[key] = sv.length > 0 ? sv.map(item => mergeWithDefaults(item, tpl)) : [];
      }
    } else if (typeof dv === 'object') {
      if (typeof sv === 'object') result[key] = mergeWithDefaults(sv, dv);
    } else {
      result[key] = sv;
    }
  }
  return result;
}

function loadData() {
  try {
    const raw = localStorage.getItem('bnb_guide_data');
    if (raw) {
      const stored = JSON.parse(raw);
      // Migrate legacy contact2Name/contact2Phone to extraContacts array
      if ((stored.contact2Name !== undefined || stored.contact2Phone !== undefined) && !stored.extraContacts) {
        stored.extraContacts = [{ name: stored.contact2Name || '', phone: stored.contact2Phone || '' }];
        delete stored.contact2Name;
        delete stored.contact2Phone;
      }
      // Migrate global places/restaurants/transport/checkoutSteps to per-apt
      if (stored.apts && Array.isArray(stored.apts)) {
        stored.apts.forEach(apt => {
          if (apt.places === undefined && stored.places !== undefined) apt.places = stored.places;
          if (apt.restaurants === undefined && stored.restaurants !== undefined) apt.restaurants = stored.restaurants;
          if (apt.supermarkets === undefined) {
            if (stored.supermarkets !== undefined) {
              apt.supermarkets = stored.supermarkets;
            } else if (stored.supermarketIt !== undefined || stored.supermarketEn !== undefined || stored.supermarketMaps !== undefined || apt.supermarketIt !== undefined) {
              // Migrate old string fields to array
              const descIt = apt.supermarketIt || stored.supermarketIt || '';
              const descEn = apt.supermarketEn || stored.supermarketEn || '';
              const maps   = apt.supermarketMaps || stored.supermarketMaps || '';
              apt.supermarkets = descIt || descEn || maps
                ? [{ name: 'Supermercato', emoji: '🛒', tipo: '', descIt, descEn, price: '', maps }]
                : [];
              delete apt.supermarketIt; delete apt.supermarketEn; delete apt.supermarketMaps;
            }
          }
          if (apt.transport === undefined && stored.transport !== undefined) apt.transport = stored.transport;
          if (apt.checkoutSteps === undefined && stored.checkoutSteps !== undefined) apt.checkoutSteps = stored.checkoutSteps;
        });
      }
      return mergeWithDefaults(stored, DEFAULT_DATA);
    }
  } catch(e) { console.error('Failed to load saved data:', e); }
  if (PUBLISHED_DATA) return mergeWithDefaults(PUBLISHED_DATA, DEFAULT_DATA);
  return deepClone(DEFAULT_DATA);
}

function saveData(data) {
  try {
    localStorage.setItem('bnb_guide_data', JSON.stringify(data));
  } catch(e) { console.error('Failed to save data:', e); }
}



// ════════════════════════════════════════════
//  RATE LIMITING
// ════════════════════════════════════════════
const RATE_LIMIT_KEY = 'bnb_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 1000; // 60 seconds

function checkRateLimit(type) {
  // Uses sessionStorage so the counter resets automatically when the tab is closed.
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const entry = data[type] || { count: 0, lockedUntil: 0 };
    if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
      return { locked: true, remaining: Math.ceil((entry.lockedUntil - Date.now()) / 1000) };
    }
    // Reset if lock expired
    if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
      entry.count = 0;
      entry.lockedUntil = 0;
      data[type] = entry;
      sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    }
    return { locked: false, attempts: entry.count };
  } catch(e) { return { locked: false, attempts: 0 }; }
}

function recordFailedAttempt(type) {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const entry = data[type] || { count: 0, lockedUntil: 0 };
    entry.count = (entry.count || 0) + 1;
    if (entry.count >= MAX_ATTEMPTS) {
      entry.lockedUntil = Date.now() + LOCKOUT_DURATION;
      entry.count = 0;
    }
    data[type] = entry;
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    return entry;
  } catch(e) { return { count: 0, lockedUntil: 0 }; }
}

function resetRateLimit(type) {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    const data = raw ? JSON.parse(raw) : {};
    delete data[type];
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  } catch(e) {}
}

// ════════════════════════════════════════════
//  CHANGE LOG
// ════════════════════════════════════════════
const CHANGELOG_KEY = 'bnb_changelog';
const MAX_CHANGELOG_ENTRIES = 50;

function getChangelog() {
  try {
    const raw = localStorage.getItem(CHANGELOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function addChangelogEntry(description, who) {
  try {
    const log = getChangelog();
    log.unshift({
      ts: Date.now(),
      desc: description,
      who: who || 'admin'
    });
    if (log.length > MAX_CHANGELOG_ENTRIES) log.splice(MAX_CHANGELOG_ENTRIES);
    localStorage.setItem(CHANGELOG_KEY, JSON.stringify(log));
  } catch(e) {}
}
