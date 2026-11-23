// Curated student places near MSRIT (Mathikere) and across Bengaluru, from "Student Guide - Best Places Near MSRIT".
// Seeded once as PUBLISHED places so every visitor sees them. Coordinates are neighbourhood-level (locationPrecision "area"):
// directions search by shop name + the exact street address below, so the address is what matters. Admins can refine the pin.
export type CuratedPlace = {
  id: string; name: string; category: string; categoryLabel: string; area: string; distanceKm: number; costText: string;
  famousFor: string; vibe: string; address: string; tags: string[];
  minBudget: number; maxBudget: number; entryFee: number; lat: number; lng: number;
};

export const MSRIT_PLACES: CuratedPlace[] = [
 {
  "id": "msrit_ctr-central-tiffin-room-shri-sagar",
  "name": "CTR (Central Tiffin Room / Shri Sagar)",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "Malleshwaram",
  "distanceKm": 5.5,
  "costText": "₹150-₹250",
  "famousFor": "Benne Masala Dosa, Filter Coffee, Mangalore Bajji",
  "vibe": "Iconic heritage breakfast spot, expect weekend queues",
  "address": "#152, 7th Cross, 3rd Main, Margosa Road, Opp. Malleshwaram Ground, Malleshwaram, Bengaluru - 560003",
  "tags": [
   "BenneMasalaDosa",
   "HeritageSpot",
   "FilterCoffee"
  ],
  "minBudget": 100,
  "maxBudget": 120,
  "entryFee": 0,
  "lat": 13.0036,
  "lng": 77.57
 },
 {
  "id": "msrit_veena-stores",
  "name": "Veena Stores",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "Malleshwaram",
  "distanceKm": 5.0,
  "costText": "₹100-₹180",
  "famousFor": "Idli Vada, Khara Bath, Kesari Bath",
  "vibe": "Fast standing-only tiffin joint, peak student budget favorite",
  "address": "#187, 15th Cross, Margosa Road, Malleshwaram, Bengaluru - 560055",
  "tags": [
   "IdliVada",
   "QuickTiffin",
   "StudentBudget"
  ],
  "minBudget": 60,
  "maxBudget": 90,
  "entryFee": 0,
  "lat": 12.9998,
  "lng": 77.5712
 },
 {
  "id": "msrit_brahmin-s-coffee-bar",
  "name": "Brahmin's Coffee Bar",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "Shankarapura / Basavanagudi",
  "distanceKm": 11.5,
  "costText": "₹80-₹150",
  "famousFor": "Idli Vada with chutney, Filter Coffee",
  "vibe": "Legendary pocket-friendly morning tiffin spot",
  "address": "Ranga Rao Road, Near Shankar Mutt, Shankarapura, Basavanagudi, Bengaluru - 560004",
  "tags": [
   "LegendaryIdli",
   "ChutneyDip",
   "MorningTiffin"
  ],
  "minBudget": 50,
  "maxBudget": 80,
  "entryFee": 0,
  "lat": 12.941,
  "lng": 77.5722
 },
 {
  "id": "msrit_idc-idli-dosa-coffee",
  "name": "IDC (Idli Dosa Coffee)",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "New BEL Road",
  "distanceKm": 1.2,
  "costText": "₹150-₹250",
  "famousFor": "Thatte Idli, Ghee Pudi Dosa, Filter Coffee",
  "vibe": "Walking distance from MSRIT for quick breakfast/evening snacks",
  "address": "New BEL Road, RMV 2nd Stage, Ashwath Nagar, Bengaluru - 560094",
  "tags": [
   "ThatteIdli",
   "GheePudiDosa",
   "NearCampus"
  ],
  "minBudget": 80,
  "maxBudget": 120,
  "entryFee": 0,
  "lat": 13.0291,
  "lng": 77.5742
 },
 {
  "id": "msrit_new-krishna-bhavan-nkb",
  "name": "New Krishna Bhavan (NKB)",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "Malleshwaram",
  "distanceKm": 5.2,
  "costText": "₹200-₹350",
  "famousFor": "Button Idli Sambar, Green Masala Dosa, Gulab Jamun",
  "vibe": "Classic South Indian tiffin and meals",
  "address": "#33/39, Sampige Road, Opp. Malleshwaram Association, Malleshwaram, Bengaluru - 560003",
  "tags": [
   "ButtonIdli",
   "GreenMasalaDosa",
   "SouthIndianMeals"
  ],
  "minBudget": 100,
  "maxBudget": 180,
  "entryFee": 0,
  "lat": 13.0044,
  "lng": 77.5714
 },
 {
  "id": "msrit_chatori-express",
  "name": "Chatori Express",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "New BEL Road",
  "distanceKm": 1.0,
  "costText": "₹100-₹200",
  "famousFor": "Delhi-style Chaat, Pani Puri, Aloo Tikki",
  "vibe": "Top street chaat spot right outside campus",
  "address": "New BEL Road, Adjacent to RMV Extension, Mathikere, Bengaluru - 560054",
  "tags": [
   "DelhiChaat",
   "PaniPuri",
   "EveningSnacks"
  ],
  "minBudget": 60,
  "maxBudget": 100,
  "entryFee": 0,
  "lat": 13.0302,
  "lng": 77.57
 },
 {
  "id": "msrit_kota-kachori",
  "name": "Kota Kachori",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "Koramangala / Indiranagar",
  "distanceKm": 14.5,
  "costText": "₹150-₹300",
  "famousFor": "Pyaz Kachori, Raj Kachori, Mirchi Vada",
  "vibe": "Authentic Rajasthani street snacks",
  "address": "#635, 100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru - 560038",
  "tags": [
   "PyazKachori",
   "RajasthaniSnacks",
   "StreetFood"
  ],
  "minBudget": 80,
  "maxBudget": 150,
  "entryFee": 0,
  "lat": 12.9785,
  "lng": 77.641
 },
 {
  "id": "msrit_malleshwaram-8th-cross-street-food-18th-cross-ch",
  "name": "Malleshwaram 8th Cross Street Food & 18th Cross Chaats",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "Malleshwaram",
  "distanceKm": 5.0,
  "costText": "₹80-₹200",
  "famousFor": "Masala Puri, Bhel, Vada Pav, Fresh Juices",
  "vibe": "Lively evening street food lane",
  "address": "8th Cross & 18th Cross, Sampige Road, Malleshwaram, Bengaluru - 560003",
  "tags": [
   "MasalaPuri",
   "StreetChaats",
   "EveningWalk"
  ],
  "minBudget": 50,
  "maxBudget": 100,
  "entryFee": 0,
  "lat": 13.0023,
  "lng": 77.5702
 },
 {
  "id": "msrit_raghavendra-stores",
  "name": "Raghavendra Stores",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "Malleshwaram (Near Railway Station)",
  "distanceKm": 5.8,
  "costText": "₹80-₹150",
  "famousFor": "Shavige Bath, Idli Vada, Filter Coffee",
  "vibe": "Ultra-cheap, legendary morning tiffin stall",
  "address": "Near Malleshwaram Railway Station, 11th Cross, Malleshwaram, Bengaluru - 560003",
  "tags": [
   "ShavigeBath",
   "UltraCheap",
   "MorningBreakfast"
  ],
  "minBudget": 50,
  "maxBudget": 80,
  "entryFee": 0,
  "lat": 12.9975,
  "lng": 77.5685
 },
 {
  "id": "msrit_tibbs-frankie-kolkata-kathi-rolls",
  "name": "Tibbs Frankie & Kolkata Kathi Rolls",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "New BEL Road / Mathikere",
  "distanceKm": 1.0,
  "costText": "₹120-₹250",
  "famousFor": "Double Egg Chicken Roll, Paneer Tikka Roll",
  "vibe": "Quick, filling post-lecture grab-and-go",
  "address": "New BEL Road, RMV 2nd Stage, Mathikere, Bengaluru - 560054",
  "tags": [
   "KathiRolls",
   "QuickBite",
   "PostLecture"
  ],
  "minBudget": 80,
  "maxBudget": 120,
  "entryFee": 0,
  "lat": 13.0295,
  "lng": 77.5745
 },
 {
  "id": "msrit_tibetan-kitchen-momo-stalls",
  "name": "Tibetan Kitchen / Momo Stalls",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "MSR Nagar / Mathikere",
  "distanceKm": 0.8,
  "costText": "₹120-₹250",
  "famousFor": "Steamed/Fried Momos, Thukpa, Tingmo",
  "vibe": "Hidden student gems in MSR Nagar lanes",
  "address": "MSR Nagar, 1st Main Road, Near MSRIT Gate, Mathikere, Bengaluru - 560054",
  "tags": [
   "SteamedMomos",
   "Thukpa",
   "HiddenGem"
  ],
  "minBudget": 70,
  "maxBudget": 120,
  "entryFee": 0,
  "lat": 13.0322,
  "lng": 77.5648
 },
 {
  "id": "msrit_sai-guru-veg-thatte-idli-point",
  "name": "Sai Guru Veg / Thatte Idli Point",
  "category": "food",
  "categoryLabel": "Budget Food & Tiffins",
  "area": "Mathikere",
  "distanceKm": 1.0,
  "costText": "₹80-₹150",
  "famousFor": "Bidadi-style Thatte Idli, Vada",
  "vibe": "Everyday pocket-friendly student breakfast",
  "address": "Mathikere Main Road, Near Gokula Extension, Mathikere, Bengaluru - 560054",
  "tags": [
   "BidadiThatteIdli",
   "PocketFriendly",
   "DailyBreakfast"
  ],
  "minBudget": 50,
  "maxBudget": 80,
  "entryFee": 0,
  "lat": 13.0335,
  "lng": 77.5668
 },
 {
  "id": "msrit_truffles",
  "name": "Truffles",
  "category": "food",
  "categoryLabel": "Good Food & Dining",
  "area": "New BEL Road (RMV 2nd Stage)",
  "distanceKm": 1.5,
  "costText": "₹600-₹900",
  "famousFor": "All American Cheese Burger, Chicken Steak Burger, Ferrero Rocher Shake",
  "vibe": "#1 college crowd magnet on New BEL Road",
  "address": "#84, 80 Feet Road, RMV 2nd Stage, Off New BEL Road, Bengaluru - 560094",
  "tags": [
   "BestBurgers",
   "StudentMagnet",
   "Shakes"
  ],
  "minBudget": 300,
  "maxBudget": 450,
  "entryFee": 0,
  "lat": 13.0293,
  "lng": 77.5778
 },
 {
  "id": "msrit_leon-s-burgers-wings",
  "name": "Leon's Burgers & Wings",
  "category": "food",
  "categoryLabel": "Good Food & Dining",
  "area": "New BEL Road",
  "distanceKm": 1.4,
  "costText": "₹400-₹650",
  "famousFor": "Lamb Burger, Peri-Peri Chicken Wings, Popcorn Rice Bowl",
  "vibe": "Great value fast-casual hangout",
  "address": "New BEL Road, Opp. Ramaiah Hospital Area, RMV 2nd Stage, Bengaluru - 560094",
  "tags": [
   "PeriPeriWings",
   "LambBurger",
   "FastCasual"
  ],
  "minBudget": 200,
  "maxBudget": 320,
  "entryFee": 0,
  "lat": 13.029,
  "lng": 77.576
 },
 {
  "id": "msrit_empire-restaurant",
  "name": "Empire Restaurant",
  "category": "food",
  "categoryLabel": "Good Food & Dining",
  "area": "RT Nagar",
  "distanceKm": 5.5,
  "costText": "₹500-₹800",
  "famousFor": "Ghee Rice & Chicken Kebab, Coin Parotta, Biryani",
  "vibe": "Late-night post-exam/project feast spot",
  "address": "#47, 80 Feet Road, RT Nagar Main Road, Bengaluru - 560032",
  "tags": [
   "LateNightFood",
   "GheeRiceKebab",
   "PostExamFeast"
  ],
  "minBudget": 250,
  "maxBudget": 400,
  "entryFee": 0,
  "lat": 13.0227,
  "lng": 77.594
 },
 {
  "id": "msrit_bhuvaneshwari-donne-biryani",
  "name": "Bhuvaneshwari Donne Biryani",
  "category": "food",
  "categoryLabel": "Good Food & Dining",
  "area": "Mathikere",
  "distanceKm": 1.2,
  "costText": "₹250-₹400",
  "famousFor": "Mutton/Chicken Donne Biryani, Pepper Chicken",
  "vibe": "Authentic Karnataka military-hotel style biryani",
  "address": "Mathikere Main Road, Near Gokula Bus Stop, Mathikere, Bengaluru - 560054",
  "tags": [
   "DonneBiryani",
   "MilitaryHotelStyle",
   "SpicyLunch"
  ],
  "minBudget": 150,
  "maxBudget": 200,
  "entryFee": 0,
  "lat": 13.034,
  "lng": 77.564
 },
 {
  "id": "msrit_bobby-s-punjabi-dhaba",
  "name": "Bobby's Punjabi Dhaba",
  "category": "food",
  "categoryLabel": "Good Food & Dining",
  "area": "Mathikere / New BEL Road",
  "distanceKm": 1.5,
  "costText": "₹350-₹550",
  "famousFor": "Dal Makhani, Paneer Butter Masala, Garlic Naan, Lassi",
  "vibe": "Hearty North Indian meals on a student budget",
  "address": "1st Main Road, Mathikere Extension, Off New BEL Road, Bengaluru - 560054",
  "tags": [
   "NorthIndianMeals",
   "DalMakhani",
   "HeartyBudget"
  ],
  "minBudget": 180,
  "maxBudget": 280,
  "entryFee": 0,
  "lat": 13.0315,
  "lng": 77.567
 },
 {
  "id": "msrit_smoked-kobe-sizzlers",
  "name": "Smoked / Kobe Sizzlers",
  "category": "food",
  "categoryLabel": "Good Food & Dining",
  "area": "New BEL Road",
  "distanceKm": 1.5,
  "costText": "₹700-₹1,000",
  "famousFor": "Chicken Shashlik Sizzler, Veg Paneer Sizzler",
  "vibe": "Fun group dinner spot",
  "address": "New BEL Road, RMV 2nd Stage, Ashwath Nagar, Bengaluru - 560094",
  "tags": [
   "Sizzlers",
   "GroupDinner",
   "Celebration"
  ],
  "minBudget": 350,
  "maxBudget": 500,
  "entryFee": 0,
  "lat": 13.0292,
  "lng": 77.5758
 },
 {
  "id": "msrit_onesta",
  "name": "Onesta",
  "category": "food",
  "categoryLabel": "Good Food & Dining",
  "area": "New BEL Road",
  "distanceKm": 1.5,
  "costText": "₹450-₹700",
  "famousFor": "Unlimited Pizza & Dessert Deals, Ravioli",
  "vibe": "Great for birthday treats and budget group buffets",
  "address": "#114, New BEL Road, RMV 2nd Stage, Bengaluru - 560094",
  "tags": [
   "UnlimitedPizza",
   "BirthdayTreat",
   "DessertDeals"
  ],
  "minBudget": 250,
  "maxBudget": 350,
  "entryFee": 0,
  "lat": 13.0289,
  "lng": 77.5765
 },
 {
  "id": "msrit_meghana-foods",
  "name": "Meghana Foods",
  "category": "food",
  "categoryLabel": "Good Food & Dining",
  "area": "Residency Road / Indiranagar",
  "distanceKm": 11.5,
  "costText": "₹600-₹900",
  "famousFor": "Meghana Special Boneless Chicken Biryani",
  "vibe": "Must-experience Bengaluru biryani icon",
  "address": "#57, 1st Floor, Jayashree Complex, Residency Road, Ashok Nagar, Bengaluru - 560025",
  "tags": [
   "BonelessChickenBiryani",
   "BengaluruIcon",
   "MustTry"
  ],
  "minBudget": 300,
  "maxBudget": 450,
  "entryFee": 0,
  "lat": 12.9706,
  "lng": 77.6063
 },
 {
  "id": "msrit_nagarjuna",
  "name": "Nagarjuna",
  "category": "food",
  "categoryLabel": "Good Food & Dining",
  "area": "Residency Road",
  "distanceKm": 11.0,
  "costText": "₹700-₹1,000",
  "famousFor": "Andhra Meals on Banana Leaf, Chilli Chicken",
  "vibe": "Classic spicy Andhra feast",
  "address": "#44/1, Residency Road, Shanthala Nagar, Ashok Nagar, Bengaluru - 560025",
  "tags": [
   "AndhraMeals",
   "BananaLeafFeast",
   "SpicyChicken"
  ],
  "minBudget": 350,
  "maxBudget": 500,
  "entryFee": 0,
  "lat": 12.9702,
  "lng": 77.6052
 },
 {
  "id": "msrit_hatti-kaapi",
  "name": "Hatti Kaapi",
  "category": "food",
  "categoryLabel": "Cafes & Desserts",
  "area": "New BEL Road",
  "distanceKm": 0.5,
  "costText": "₹150-₹300",
  "famousFor": "Jaggery Filter Coffee, Bun Maska, Samosa",
  "vibe": "Quick coffee breaks right next to MSRIT",
  "address": "New BEL Road, Near Post Office, Mathikere, Bengaluru - 560054",
  "tags": [
   "JaggeryFilterCoffee",
   "BunMaska",
   "QuickBreak"
  ],
  "minBudget": 60,
  "maxBudget": 150,
  "entryFee": 0,
  "lat": 13.0318,
  "lng": 77.569
 },
 {
  "id": "msrit_glen-s-bakehouse",
  "name": "Glen's Bakehouse",
  "category": "food",
  "categoryLabel": "Cafes & Desserts",
  "area": "New BEL Road",
  "distanceKm": 1.6,
  "costText": "₹400-₹700",
  "famousFor": "Red Velvet Cupcakes, Wood-fired Pizza, Cold Coffee",
  "vibe": "Cozy aesthetic cafe for dates & study sessions",
  "address": "#24, New BEL Road, RMV 2nd Stage, Ashwath Nagar, Bengaluru - 560094",
  "tags": [
   "RedVelvetCupcakes",
   "AestheticCafe",
   "WoodFiredPizza"
  ],
  "minBudget": 250,
  "maxBudget": 350,
  "entryFee": 0,
  "lat": 13.0289,
  "lng": 77.577
 },
 {
  "id": "msrit_third-wave-coffee",
  "name": "Third Wave Coffee",
  "category": "food",
  "categoryLabel": "Cafes & Desserts",
  "area": "New BEL Road / Sadashivanagar",
  "distanceKm": 1.5,
  "costText": "₹400-₹650",
  "famousFor": "Sea Salt Mocha, Vietnamese Shakerato, Croissants",
  "vibe": "Laptop-friendly cafe for coding & assignments",
  "address": "80 Feet Road, RMV 2nd Stage, New BEL Road, Bengaluru - 560094",
  "tags": [
   "StudyCafe",
   "WiFiAndCoding",
   "SpecialtyCoffee"
  ],
  "minBudget": 200,
  "maxBudget": 320,
  "entryFee": 0,
  "lat": 13.0291,
  "lng": 77.5768
 },
 {
  "id": "msrit_corner-house-ice-creams",
  "name": "Corner House Ice Creams",
  "category": "food",
  "categoryLabel": "Cafes & Desserts",
  "area": "New BEL Road",
  "distanceKm": 1.8,
  "costText": "₹250-₹450",
  "famousFor": "Death By Chocolate (DBC), Hot Chocolate Fudge",
  "vibe": "Mandatory Bengaluru student ritual",
  "address": "New BEL Road, RMV 2nd Stage, Bengaluru - 560094",
  "tags": [
   "DeathByChocolate",
   "LateNightDessert",
   "BengaluruRitual"
  ],
  "minBudget": 150,
  "maxBudget": 220,
  "entryFee": 0,
  "lat": 13.0289,
  "lng": 77.5772
 },
 {
  "id": "msrit_milano-ice-cream",
  "name": "Milano Ice Cream",
  "category": "food",
  "categoryLabel": "Cafes & Desserts",
  "area": "New BEL Road",
  "distanceKm": 1.8,
  "costText": "₹250-₹450",
  "famousFor": "Artisanal Gelato (Ferrero, Mango, Dark Chocolate)",
  "vibe": "Authentic Italian gelato hangout",
  "address": "New BEL Road, RMV 2nd Stage, Ashwath Nagar, Bengaluru - 560094",
  "tags": [
   "ArtisanalGelato",
   "ItalianDesserts",
   "DateSpot"
  ],
  "minBudget": 150,
  "maxBudget": 220,
  "entryFee": 0,
  "lat": 13.0288,
  "lng": 77.577
 },
 {
  "id": "msrit_kargeens-cafe",
  "name": "Kargeens Cafe",
  "category": "food",
  "categoryLabel": "Cafes & Desserts",
  "area": "Mathikere / New BEL Road",
  "distanceKm": 0.8,
  "costText": "₹500-₹800",
  "famousFor": "Mexican Rice, Pav Bhaji, Thick Shakes",
  "vibe": "Popular evening student chill spot",
  "address": "MSR Nagar, Off New BEL Road, Mathikere, Bengaluru - 560054",
  "tags": [
   "ThickShakes",
   "StudentHangout",
   "EveningChill"
  ],
  "minBudget": 250,
  "maxBudget": 400,
  "entryFee": 0,
  "lat": 13.0326,
  "lng": 77.5658
 },
 {
  "id": "msrit_the-bel-st-cafe",
  "name": "The BEL St. Cafe",
  "category": "food",
  "categoryLabel": "Cafes & Desserts",
  "area": "New BEL Road",
  "distanceKm": 1.0,
  "costText": "₹600-₹900",
  "famousFor": "BEL Chicken Steak Burger, Combo Meals",
  "vibe": "Chill rooftop/indoor seating for long talks",
  "address": "#42, New BEL Road, RMV 2nd Stage, Bengaluru - 560094",
  "tags": [
   "RooftopVibe",
   "SteakBurgers",
   "LongTalks"
  ],
  "minBudget": 300,
  "maxBudget": 450,
  "entryFee": 0,
  "lat": 13.0293,
  "lng": 77.576
 },
 {
  "id": "msrit_matteo-coffea",
  "name": "Matteo Coffea",
  "category": "food",
  "categoryLabel": "Cafes & Desserts",
  "area": "Church Street",
  "distanceKm": 11.0,
  "costText": "₹450-₹750",
  "famousFor": "Iced Mocha, Tiramisu, Sandwiches",
  "vibe": "Iconic Church Street people-watching cafe",
  "address": "#2, Church Street, Shanthala Nagar, Ashok Nagar, Bengaluru - 560001",
  "tags": [
   "ChurchStreetVibe",
   "IcedMocha",
   "PeopleWatching"
  ],
  "minBudget": 250,
  "maxBudget": 380,
  "entryFee": 0,
  "lat": 12.9753,
  "lng": 77.607
 },
 {
  "id": "msrit_indian-coffee-house",
  "name": "Indian Coffee House",
  "category": "food",
  "categoryLabel": "Cafes & Desserts",
  "area": "Church Street",
  "distanceKm": 11.2,
  "costText": "₹150-₹300",
  "famousFor": "Mutton/Veg Cutlet, French Toast, Filter Coffee",
  "vibe": "Vintage heritage vibe at unbeatable prices",
  "address": "#19, Church Street, Shanthala Nagar, Ashok Nagar, Bengaluru - 560001",
  "tags": [
   "VintageHeritage",
   "SuperCheapCutlets",
   "OldSchoolCafe"
  ],
  "minBudget": 100,
  "maxBudget": 150,
  "entryFee": 0,
  "lat": 12.9756,
  "lng": 77.6063
 },
 {
  "id": "msrit_sankey-tank",
  "name": "Sankey Tank",
  "category": "nature",
  "categoryLabel": "Hangouts & Parks",
  "area": "Sadashivanagar / Malleshwaram",
  "distanceKm": 3.8,
  "costText": "Free (₹0)",
  "famousFor": "Sunset lakeside walk, jogging track, boating",
  "vibe": "Closest peaceful sunset escape for MSRIT students",
  "address": "West Park Road, Sadashivanagar, Malleshwaram, Bengaluru - 560003",
  "tags": [
   "SunsetLake",
   "FreeEntry",
   "MorningJog"
  ],
  "minBudget": 0,
  "maxBudget": 0,
  "entryFee": 0,
  "lat": 13.0088,
  "lng": 77.5735
 },
 {
  "id": "msrit_jaya-prakash-narayan-biodiversity-park-jp-park",
  "name": "Jaya Prakash Narayan Biodiversity Park (JP Park)",
  "category": "nature",
  "categoryLabel": "Hangouts & Parks",
  "area": "Mathikere",
  "distanceKm": 1.8,
  "costText": "Free (₹0)",
  "famousFor": "Musical fountain, lakes, lush walking trails",
  "vibe": "Right in Mathikere; great for morning walks & evening chill",
  "address": "Chord Road, Brindavan Nagar, Mathikere, Bengaluru - 560054",
  "tags": [
   "MusicalFountain",
   "LakesidePark",
   "WalkingDistance"
  ],
  "minBudget": 0,
  "maxBudget": 0,
  "entryFee": 0,
  "lat": 13.04,
  "lng": 77.556
 },
 {
  "id": "msrit_iisc-campus-surroundings-tea-spots",
  "name": "IISc Campus Surroundings & Tea Spots",
  "category": "nature",
  "categoryLabel": "Hangouts & Parks",
  "area": "Malleshwaram",
  "distanceKm": 2.5,
  "costText": "₹50-₹150",
  "famousFor": "Lush green tree-lined avenues outside campus",
  "vibe": "Peaceful evening walk & filter coffee nearby",
  "address": "CV Raman Road, Malleshwaram / Mathikere Border, Bengaluru - 560012",
  "tags": [
   "GreenAvenues",
   "EveningWalk",
   "PeacefulVibe"
  ],
  "minBudget": 50,
  "maxBudget": 150,
  "entryFee": 0,
  "lat": 13.0216,
  "lng": 77.5671
 },
 {
  "id": "msrit_lumbini-gardens-nagawara-lake",
  "name": "Lumbini Gardens (Nagawara Lake)",
  "category": "nature",
  "categoryLabel": "Hangouts & Parks",
  "area": "Hebbal",
  "distanceKm": 7.5,
  "costText": "₹50-₹150 entry",
  "famousFor": "Lakeside promenade, boating, wave pool, food stalls",
  "vibe": "Fun weekend group outing within 10 km",
  "address": "Outer Ring Road, Near Veeranapalya, Hebbal, Bengaluru - 560045",
  "tags": [
   "Boating",
   "LakefrontOuting",
   "GroupFun"
  ],
  "minBudget": 50,
  "maxBudget": 150,
  "entryFee": 50,
  "lat": 13.0455,
  "lng": 77.613
 },
 {
  "id": "msrit_hebbal-lake-park",
  "name": "Hebbal Lake Park",
  "category": "nature",
  "categoryLabel": "Hangouts & Parks",
  "area": "Hebbal",
  "distanceKm": 6.5,
  "costText": "₹20-₹50 entry",
  "famousFor": "Birdwatching, sunset views over the lake",
  "vibe": "Quiet nature break near ORR",
  "address": "Bellary Road (NH 44), Near Hebbal Flyover, Hebbal, Bengaluru - 560024",
  "tags": [
   "Birdwatching",
   "SunsetViews",
   "NatureBreak"
  ],
  "minBudget": 20,
  "maxBudget": 50,
  "entryFee": 20,
  "lat": 13.0449,
  "lng": 77.592
 },
 {
  "id": "msrit_visvesvaraya-industrial-technological-museum",
  "name": "Visvesvaraya Industrial & Technological Museum",
  "category": "attractions",
  "categoryLabel": "Hangouts & Parks",
  "area": "Kasturba Road",
  "distanceKm": 10.8,
  "costText": "₹95 entry",
  "famousFor": "Interactive science, space & engineering exhibits",
  "vibe": "Must-visit for engineering students",
  "address": "Kasturba Road, Near Cubbon Park, Ambedkar Veedhi, Bengaluru - 560001",
  "tags": [
   "EngineeringMustSee",
   "ScienceExhibits",
   "Interactive"
  ],
  "minBudget": 95,
  "maxBudget": 95,
  "entryFee": 95,
  "lat": 12.9753,
  "lng": 77.5965
 },
 {
  "id": "msrit_orion-mall",
  "name": "Orion Mall",
  "category": "entertainment",
  "categoryLabel": "Shopping & Malls",
  "area": "Rajajinagar (Brigade Gateway)",
  "distanceKm": 4.8,
  "costText": "Free entry (₹500+ budget)",
  "famousFor": "Lakeside dining promenade, PVR IMAX, bowling, brands",
  "vibe": "Nearest premier mall to MSRIT with lakefront",
  "address": "Brigade Gateway, 26/1, Dr. Rajkumar Road, Malleshwaram-Rajajinagar, Bengaluru - 560055",
  "tags": [
   "LakesidePromenade",
   "IMAXAndBowling",
   "NearestPremierMall"
  ],
  "minBudget": 200,
  "maxBudget": 500,
  "entryFee": 0,
  "lat": 13.0111,
  "lng": 77.5551
 },
 {
  "id": "msrit_mantri-square-mall",
  "name": "Mantri Square Mall",
  "category": "entertainment",
  "categoryLabel": "Shopping & Malls",
  "area": "Malleshwaram",
  "distanceKm": 6.2,
  "costText": "Free entry (₹400+ budget)",
  "famousFor": "Direct Green Line Metro connectivity, huge food court",
  "vibe": "Super easy metro access & budget food court",
  "address": "#1, Sampige Road, Near Malleshwaram Metro Station, Malleshwaram, Bengaluru - 560003",
  "tags": [
   "DirectMetroAccess",
   "HugeFoodCourt",
   "GamingZone"
  ],
  "minBudget": 200,
  "maxBudget": 400,
  "entryFee": 0,
  "lat": 12.9915,
  "lng": 77.5713
 },
 {
  "id": "msrit_phoenix-mall-of-asia",
  "name": "Phoenix Mall of Asia",
  "category": "entertainment",
  "categoryLabel": "Shopping & Malls",
  "area": "Byatarayanapura (Yelahanka Rd)",
  "distanceKm": 9.5,
  "costText": "Free entry (₹600+ budget)",
  "famousFor": "Massive luxury & high-street mall, grand atrium",
  "vibe": "Newest mega-mall within 10 km of MSRIT",
  "address": "#239/240, Bellary Road, Byatarayanapura, Yelahanka Hobli, Bengaluru - 560092",
  "tags": [
   "MegaLuxuryMall",
   "GrandAtrium",
   "WeekendHangout"
  ],
  "minBudget": 250,
  "maxBudget": 600,
  "entryFee": 0,
  "lat": 13.074,
  "lng": 77.587
 },
 {
  "id": "msrit_malleshwaram-8th-cross-sampige-road",
  "name": "Malleshwaram 8th Cross & Sampige Road",
  "category": "entertainment",
  "categoryLabel": "Shopping & Malls",
  "area": "Malleshwaram",
  "distanceKm": 5.2,
  "costText": "₹200-₹1,000",
  "famousFor": "Street shopping, ethnic wear, footwear, flower market",
  "vibe": "Best budget street shopping within 10 km",
  "address": "8th Cross Road & Sampige Road, Malleshwaram, Bengaluru - 560003",
  "tags": [
   "StreetShopping",
   "EthnicWear",
   "BudgetBargains"
  ],
  "minBudget": 200,
  "maxBudget": 1000,
  "entryFee": 0,
  "lat": 13.0027,
  "lng": 77.5698
 },
 {
  "id": "msrit_commercial-street",
  "name": "Commercial Street",
  "category": "entertainment",
  "categoryLabel": "Shopping & Malls",
  "area": "Shivajinagar / Tasker Town",
  "distanceKm": 11.0,
  "costText": "₹300-₹1,500",
  "famousFor": "Thrift/budget fashion, sneakers, jewelry, street snacks",
  "vibe": "Ultimate student bargain-shopping paradise",
  "address": "Tasker Town, Shivajinagar, Bengaluru - 560001",
  "tags": [
   "ThriftFashion",
   "SneakersAndBags",
   "BargainParadise"
  ],
  "minBudget": 300,
  "maxBudget": 1500,
  "entryFee": 0,
  "lat": 12.9822,
  "lng": 77.6084
 },
 {
  "id": "msrit_national-market",
  "name": "National Market",
  "category": "entertainment",
  "categoryLabel": "Shopping & Malls",
  "area": "Majestic (Gandhi Nagar)",
  "distanceKm": 8.5,
  "costText": "₹200-₹1,500",
  "famousFor": "Budget electronics, phone accessories, sneakers",
  "vibe": "Classic student spot for tech accessories & bargains",
  "address": "5th Main Road, Gandhi Nagar, Near Majestic Bus Stand, Bengaluru - 560009",
  "tags": [
   "TechAccessories",
   "BudgetGadgets",
   "Sneakers"
  ],
  "minBudget": 200,
  "maxBudget": 1500,
  "entryFee": 0,
  "lat": 12.9781,
  "lng": 77.5774
 }
];

const MORNING = /breakfast|morning|tiffin|idli|dosa|bath|coffee break|jog|walk/i;
const NIGHT = /late-night|late night|dinner|biryani|sizzler|chaat|evening|post-exam|feast|buffet/i;

/** The place record stored in explorer_places.payload (same shape students' "Add a place" produces). */
export function curatedPayload(p: CuratedPlace): Record<string, unknown> {
  const text = `${p.famousFor} ${p.vibe} ${p.tags.join(" ")}`;
  const vibes = new Set<string>([p.category]);
  let timeOfDay = "any";
  if (MORNING.test(text)) { vibes.add("morning"); timeOfDay = "morning"; }
  if (NIGHT.test(text)) { vibes.add("evening"); vibes.add("night"); timeOfDay = timeOfDay === "morning" ? "any" : "evening-night"; }
  if (p.category === "nature" || p.category === "attractions") { vibes.add("day"); if (timeOfDay === "any") timeOfDay = "day"; }
  const range = p.maxBudget > p.minBudget ? `₹${p.minBudget} – ₹${p.maxBudget} per person` : p.minBudget === 0 ? "Free entry" : `About ₹${p.minBudget} per person`;
  return {
    id: p.id,
    name: p.name,
    description: `${p.famousFor}. ${p.vibe}.`,
    location: p.address,
    address: p.address,
    areaName: p.area,
    category: p.category,
    categoryLabel: p.categoryLabel,
    famousFor: p.famousFor,
    lat: p.lat,
    lng: p.lng,
    locationPrecision: "area",
    mapQuery: `${p.name}, ${p.address}`,
    minBudget: p.minBudget,
    maxBudget: p.maxBudget,
    budget: range,
    budgetIsEstimate: true,
    entryFee: p.entryFee,
    rating: 4.5,
    image: "",
    photos: [],
    photoSubmissions: [],
    status: "published",
    metro: "Open directions in Google Maps for the nearest stop",
    bestTime: p.vibe,
    studentTip: `${p.vibe}. Carry at least ₹${Math.max(p.minBudget, 0)}.`,
    tags: p.tags,
    distanceFromMsritKm: p.distanceKm,
    vibes: [...vibes],
    timeOfDay,
    curated: "msrit-student-guide",
    addedBy: "Student Explorer team",
    addedAt: Date.now(),
  };
}
