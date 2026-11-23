/**
 * ==============================================================================
 * STUDENT EXPLORER - INTERACTIVE CLIENT SCRIPT (script.js)
 * Clean, modern vanilla JavaScript for the Student Explorer platform.
 * Specially written and commented for Python developers learning web development.
 * ==============================================================================
 * 
 * PYTHON MENTAL MODEL:
 * - In Python, you have dictionaries (dict) and lists (list).
 *   In JavaScript, these are Objects {} and Arrays [].
 * - In Python: def calculate_distance(lat1, lon1, lat2, lon2): ...
 *   In JavaScript: function calculateDistance(lat1, lon1, lat2, lon2) { ... }
 * - In web development, JavaScript interacts with HTML elements via the "DOM" (Document
 *   Object Model). Think of document.querySelector() or document.getElementById()
 *   like querying a nested dictionary or search tree of HTML tags.
 * - In Python, you store local app state in JSON files. In the browser, we use
 *   localStorage, which works like a persistent key-value store across browser refreshes!
 */

// We wrap everything in 'DOMContentLoaded' so the script only runs AFTER the HTML
// has completely loaded into the browser memory. (Similar to: if __name__ == "__main__":)
function bootExplorer() {
  // Never start twice: two copies attach two click handlers to every button, so a toggle (like the profile menu) opens and closes at once.
  if (window.__explorerBooted) return;
  window.__explorerBooted = true;

  // ============================================================================
  // 1. DATA STORES (BENGALURU LOCATIONS & PLACES)
  // ============================================================================
  
  // Starting hubs / colleges across Bengaluru with approximate GPS coordinates
  const BENGALURU_LOCATIONS = {
    koramangala: { name: "Koramangala", fullName: "Koramangala (5th Block / JNC)", lat: 12.9352, lng: 77.6245 },
    indiranagar: { name: "Indiranagar", fullName: "Indiranagar (100ft Rd / Metro)", lat: 12.9784, lng: 77.6408 },
    christ: { name: "Christ University", fullName: "Hosur Road (Christ Central Campus)", lat: 12.9344, lng: 77.6060 },
    btm: { name: "BTM Layout", fullName: "BTM Layout (2nd Stage / Water Tank)", lat: 12.9166, lng: 77.6101 },
    hsr: { name: "HSR Layout", fullName: "HSR Layout (BDA Complex)", lat: 12.9121, lng: 77.6446 },
    jayanagar: { name: "Jayanagar", fullName: "Jayanagar (4th Block Complex)", lat: 12.9308, lng: 77.5838 },
    malleshwaram: { name: "Malleshwaram", fullName: "Malleshwaram (8th Cross)", lat: 13.0031, lng: 77.5643 },
    rvce: { name: "RVCE Campus", fullName: "Mysore Road (RVCE College)", lat: 12.9237, lng: 77.4987 },
    pesu: { name: "PES University", fullName: "Banashankari / Ring Rd (PESU)", lat: 12.9255, lng: 77.5468 },
    bmsce: { name: "BMSCE Campus", fullName: "Basavanagudi (BMSCE College)", lat: 12.9422, lng: 77.5681 },
    dsce: { name: "Dayananda Sagar", fullName: "Kumaraswamy Layout (DSCE)", lat: 12.9081, lng: 77.5666 },
    msrit: { name: "Ramaiah (MSRIT)", fullName: "Mathikere (Ramaiah Institute)", lat: 13.0305, lng: 77.5649 },
    mcc: { name: "Mount Carmel (MCC)", fullName: "Vasanth Nagar (Mount Carmel College)", lat: 12.9922, lng: 77.5891 },
    bellandur: { name: "Bellandur", fullName: "Bellandur (EcoSpace / Outer Ring Rd)", lat: 12.9260, lng: 77.6762 },
    marathahalli: { name: "Marathahalli", fullName: "Marathahalli (Bridge / Ring Road)", lat: 12.9591, lng: 77.6974 },
    whitefield: { name: "Whitefield", fullName: "Whitefield (ITPL / Metro)", lat: 12.9698, lng: 77.7500 },
    majestic: { name: "Majestic", fullName: "Majestic / City Railway Station", lat: 12.9767, lng: 77.5713 },
    rajajinagar: { name: "Rajajinagar", fullName: "Rajajinagar (Navrang / Metro)", lat: 12.9982, lng: 77.5530 },
    hebbal: { name: "Hebbal", fullName: "Hebbal (Manyata Tech Park / Flyover)", lat: 13.0358, lng: 77.5970 },
    kammanahalli: { name: "Kammanahalli", fullName: "Kammanahalli (HRBR / Kalyan Nagar)", lat: 13.0159, lng: 77.6379 },
    'electronic-city': { name: "Electronic City", fullName: "Electronic City (Phase 1)", lat: 12.8452, lng: 77.6602 },
    yelahanka: { name: "Yelahanka", fullName: "Yelahanka (North Bengaluru)", lat: 13.1007, lng: 77.5963 }
  };

  // Detailed metadata for showcase places
  const PLACES_DATA = {
    lalbagh: {
      id: "lalbagh",
      name: "Lalbagh Botanical Garden",
      category: "nature",
      categoryLabel: "Parks & Nature",
      vibes: ["morning", "day", "nature"],
      timeOfDay: "morning",
      location: "Mavalli, South Bengaluru",
      budget: "₹30 – ₹70 per person",
      minBudget: 30,
      maxBudget: 70,
      lat: 12.9507,
      lng: 77.5848,
      rating: 4.7,
      image: "/src/assets/images/lalbagh_glasshouse_1794295760242.jpg",
      description: "A 240-acre botanical paradise created during Hyder Ali's reign and completed by Tipu Sultan. Home to India's largest collection of tropical plants and a London Crystal Palace-inspired Glass House.",
      metro: "Lalbagh Metro Station (Green Line, Exit 2 directly at West Gate)",
      bestTime: "Early Morning (6:00 AM – 9:00 AM) or 4:00 PM – 6:30 PM",
      studentTip: "Entry is completely FREE for morning walkers from 6:00 AM to 9:00 AM! After 9 AM, student ticket is only ₹30. Carry college ID."
    },
    cubbon: {
      id: "cubbon",
      name: "Cubbon Park",
      category: "nature",
      categoryLabel: "Parks & Nature",
      vibes: ["morning", "day", "nature"],
      timeOfDay: "morning",
      location: "Kasturba Road, Central Bengaluru",
      budget: "Free entry (₹0 – ₹50 for tea/snacks)",
      minBudget: 0,
      maxBudget: 50,
      lat: 12.9763,
      lng: 77.5929,
      rating: 4.8,
      image: "/src/assets/images/cubbon_park_greenery_1794295761517.jpg",
      description: "Spread over 300 acres in the heart of Bengaluru, Cubbon Park is loved by college students for book reading under tall bamboo grooves, acoustic jam sessions, Sunday dog meetups, and cycling along vehicle-free avenues.",
      metro: "Cubbon Park / Dr. B.R. Ambedkar Station (Purple Line - 100m)",
      bestTime: "Saturday & Sunday mornings (Vehicle-free zone)",
      studentTip: "Entry is 100% free! Pack homemade sandwiches and a bedsheet with your squad. State Central Library is inside the park for quiet study."
    },
    vvpuram: {
      id: "vvpuram",
      name: "VV Puram Food Street",
      category: "food",
      categoryLabel: "Cafes & Restaurants",
      vibes: ["evening", "night", "food", "street-food"],
      timeOfDay: "evening-night",
      location: "Sajjan Rao Circle, VV Puram",
      budget: "₹150 – ₹250 per person",
      minBudget: 120,
      maxBudget: 250,
      lat: 12.9515,
      lng: 77.5768,
      rating: 4.6,
      image: "/src/assets/images/vv_puram_food_street_1794295762371.jpg",
      description: "Bengaluru's legendary all-vegetarian street food street. Famous for crisp butter masala dosas, piping hot paddus, congress kadlekai buns from VB Bakery, sweet gulab jamun chaat, and refreshing twisty potato spirals.",
      metro: "National College Metro Station (Green Line, 650m walk)",
      bestTime: "6:30 PM – 10:30 PM (Evening street food vibe)",
      studentTip: "Go in a squad of 3 or 4 so you can order one plate per stall and taste 6 different delicacies without exceeding ₹200 each! Must try: Ghee Butter Dosa & Congress Bun."
    },
    palace: {
      id: "palace",
      name: "Bengaluru Palace",
      category: "attractions",
      categoryLabel: "Tourist Attractions",
      vibes: ["day", "attractions"],
      timeOfDay: "day",
      location: "Vasanth Nagar, Central Bengaluru",
      budget: "₹250 – ₹450 per person",
      minBudget: 250,
      maxBudget: 450,
      lat: 12.9988,
      lng: 77.5921,
      rating: 4.5,
      image: "/src/assets/images/bengaluru_palace_facade_1794295762175.jpg",
      description: "Built in 1878 by Chamarajendra Wadiyar X in the Tudor architectural style, featuring fortified towers, crenellated parapets, elegant wood carvings, and expansive royal grounds that often host open-air music festivals.",
      metro: "Mantri Square Sampige Road Metro (then 8 min auto) or Cantonment Rly",
      bestTime: "10:30 AM – 3:30 PM for indoor royal room tours",
      studentTip: "Always present your valid college student ID card at the ticket counter to claim the discounted student rate. Photography with DSLR cameras costs extra, so use your phone."
    },
    churchstreet: {
      id: "churchstreet",
      name: "Church Street Book & Cafe Lane",
      category: "food",
      categoryLabel: "Cafes & Street Art",
      vibes: ["evening", "night", "food", "hangout"],
      timeOfDay: "evening-night",
      location: "Church Street, Off MG Road",
      budget: "₹100 – ₹300 per person",
      minBudget: 100,
      maxBudget: 300,
      lat: 12.9750,
      lng: 77.6066,
      rating: 4.9,
      image: "",
      description: "A paved cobblestone street beloved by college students for thrift books at Blossom Book House and Bookworm, street musicians, Japanese ramen spots, hot churros, artisanal gelato, and vibrant anime murals.",
      metro: "MG Road Metro Station (Purple Line, 2 min walk)",
      bestTime: "Friday & Saturday evenings (Pedestrian walk)",
      studentTip: "You can spend hours browsing second-hand paperbacks at Blossom Book House starting at just ₹50. Grab an authentic filter coffee at Indian Coffee House nearby."
    },
    nandihills: {
      id: "nandihills",
      name: "Nandi Hills Sunrise Viewpoint",
      category: "getaways",
      categoryLabel: "Weekend Getaways",
      vibes: ["morning", "sunrise", "getaway"],
      timeOfDay: "morning",
      location: "Chikkaballapur (60 km from Bengaluru)",
      budget: "₹350 – ₹600 per person",
      minBudget: 350,
      maxBudget: 600,
      lat: 13.3702,
      lng: 77.6835,
      rating: 4.6,
      image: "",
      description: "An ancient fortress perched at 4,851 feet above sea level. Famous for the mesmerizing sunrise above a sea of clouds, cool misty breeze, Tipu's Summer Residence, and thrilling morning bike rides.",
      metro: "Not metro accessible (Bike convoy, Zoomcar, or direct KSRTC bus from Majestic)",
      bestTime: "5:30 AM – 8:00 AM (Arrive before dawn for best clouds)",
      studentTip: "Entry opens at 6:00 AM. Weekend lines get long, so start by 4:00 AM from Bangalore. Pre-book parking online if taking a car. Splitting fuel across 4 friends keeps the trip well under ₹400 each."
    }
  };

  const PLACES_STOPS = {
    lalbagh: "Lalbagh Metro (Green Line - 150m) / Lalbagh Bus Stand",
    cubbon: "Cubbon Park Metro (Purple Line - 100m) / Dr. Ambedkar Veedhi Bus Stop",
    vvpuram: "National College Metro (Green Line - 650m) / Sajjan Rao Circle",
    palace: "Cantonment Rly Station (1.4 km) / Palace Guttahalli Bus Stop",
    churchstreet: "MG Road Metro (Purple Line - 150m) / Brigade Rd Junction",
    nandihills: "KSRTC Majestic to Nandi Hills Direct Bus (Departs 8:30 AM)"
  };

  // ============================================================================
  // 2. INITIAL STUDENT REVIEWS DATA STORE
  // Verified student reviews and recommendations
  // ============================================================================
  const INITIAL_REVIEWS = {
    lalbagh: [
      {
        id: "rev_lal_1",
        author: "Kavya Menon",
        college: "BMSCE '25",
        rating: 5,
        spent: 30,
        highlight: "Morning walk entry is completely free before 9 AM!",
        comment: "Went with 5 classmates at 6:30 AM. Absolutely peaceful mist over the lake and the Glass House looks majestic in the dawn sun. We bought hot filter coffee right outside West Gate for ₹15.",
        date: "3 May 2026",
        helpfulCount: 28
      },
      {
        id: "rev_lal_2",
        author: "Abhinav Rao",
        college: "RVCE '26",
        rating: 4.5,
        spent: 60,
        highlight: "Carry your college ID card for discounted nursery plants",
        comment: "Great spot for botany botany study and sketching. The giant peninsular rock has a 360 view of South Bangalore. Lalbagh Metro Green Line drops you literally 100 meters from the West Gate.",
        date: "28 Apr 2026",
        helpfulCount: 14
      }
    ],
    cubbon: [
      {
        id: "rev_cub_1",
        author: "Sneha Hegde",
        college: "Mount Carmel College '25",
        rating: 5,
        spent: 0,
        highlight: "Free entry, Sunday vehicle-free acoustic music sessions",
        comment: "Our favorite campus adda! Packed sandwiches and brought a badminton set with friends. The tall bamboo trees keep it cool even at noon. Highly recommend reading on the lawns near Central Library.",
        date: "1 May 2026",
        helpfulCount: 41
      },
      {
        id: "rev_cub_2",
        author: "Deepak S.",
        college: "PES University '24",
        rating: 4.7,
        spent: 40,
        highlight: "Avenue trees & roadside filter coffee",
        comment: "Super accessible via Cubbon Park Metro station on the Purple Line. Great spot to de-stress before semester exams without spending money.",
        date: "24 Apr 2026",
        helpfulCount: 19
      }
    ],
    vvpuram: [
      {
        id: "rev_vvp_1",
        author: "Pooja Kulkarni",
        college: "National College, Basavanagudi '25",
        rating: 5,
        spent: 180,
        highlight: "Ghee Butter Masala Dosa & VB Bakery Congress Bun",
        comment: "College ritual every Friday evening! Go in a squad of 4 so you can share and taste multiple dishes: Hot Paddus (₹50), Dosa (₹80), and twisty potato spirals (₹50). Easily full under ₹200.",
        date: "4 May 2026",
        helpfulCount: 52
      },
      {
        id: "rev_vvp_2",
        author: "Nikhil Varma",
        college: "SJCC '26",
        rating: 4.5,
        spent: 210,
        highlight: "Rasgulla Chaat and Bhajjis",
        comment: "Reach around 7:00 PM before the peak dinner rush. National College Metro is an easy 7-minute walk, so you don't have to stress about car parking in the tight lane.",
        date: "29 Apr 2026",
        helpfulCount: 23
      }
    ],
    palace: [
      {
        id: "rev_pal_1",
        author: "Aakash Banerjee",
        college: "Christ University '25",
        rating: 4.5,
        spent: 250,
        highlight: "Student ticket concession with ID",
        comment: "The wooden staircases, royal hunting trophies, and royal courtyards feel like European castles. Make sure you carry your college ID for the concession rate. Take photos with phone to avoid DSLR fee.",
        date: "27 Apr 2026",
        helpfulCount: 17
      }
    ],
    churchstreet: [
      {
        id: "rev_chs_1",
        author: "Tara Shenoy",
        college: "St. Joseph's University '26",
        rating: 5,
        spent: 160,
        highlight: "Blossom Book House paperbacks starting ₹50",
        comment: "Church Street on a Saturday evening is a student emotion! Street buskers playing guitars, cool graffiti murals, and cheap thrift classics at Blossom. Grab a cold coffee or churro to share.",
        date: "2 May 2026",
        helpfulCount: 65
      },
      {
        id: "rev_chs_2",
        author: "Rohan Nair",
        college: "MSRIT '24",
        rating: 4.8,
        spent: 220,
        highlight: "Take Purple Line Metro to MG Road",
        comment: "Zero traffic stress if you take the Metro. Exit A brings you straight into Church Street cobblestones. Plenty of budget food spots and book browsing.",
        date: "26 Apr 2026",
        helpfulCount: 31
      }
    ],
    nandihills: [
      {
        id: "rev_nan_1",
        author: "Vikram Gowda",
        college: "RVCE '25",
        rating: 4.6,
        spent: 380,
        highlight: "Early 4:30 AM bike convoy, sea of clouds view",
        comment: "A rite of passage for Bangalore engineering students! Start early to beat the sunrise traffic at the toll gate. Splitting fuel among two people on a bike made the entire outing cost just ₹380 each.",
        date: "30 Apr 2026",
        helpfulCount: 48
      }
    ]
  };

  // Initial Demo Trip Ledger entries
  const INITIAL_DEMO_TRIPS = [
    {
      id: 1714500000000,
      place: "VV Puram Food Street",
      date: "2026-05-02",
      transitMode: "Namma Metro",
      numPeople: 4,
      transitCost: 100,
      foodCost: 640,
      entryCost: 0,
      miscCost: 40,
      totalCost: 780,
      perPerson: 195,
      note: "Dosa crawl with 4 college roommates. VB Bakery congress bun was 10/10!"
    },
    {
      id: 1714400000000,
      place: "Cubbon Park",
      date: "2026-04-26",
      transitMode: "Uber Auto",
      numPeople: 3,
      transitCost: 120,
      foodCost: 150,
      entryCost: 0,
      miscCost: 60,
      totalCost: 330,
      perPerson: 110,
      note: "Sunday guitar session and frisbee. Brought homemade sandwiches, only paid for auto and tea."
    }
  ];

  // Storage Keys
  const REVIEWS_STORAGE_KEY = 'student_explorer_place_reviews';
  const COMMUNITY_PLACES_KEY = 'student_explorer_community_places';
  const EXPENSE_LOGS_KEY = 'student_explorer_trip_logs';

  // ============================================================================
  // 3. PERSISTENT STORAGE HELPERS
  // ============================================================================
  function getStoredReviews() {
    try {
      const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(INITIAL_REVIEWS));
        return INITIAL_REVIEWS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_REVIEWS;
    }
  }

  function saveStoredReviews(reviewsObj) {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviewsObj));
    } catch (e) {
      console.warn("Could not save reviews to localStorage", e);
    }
  }

  // ---- Server-backed storage: places are shared by everyone, outings belong to the logged-in email ----
  const TOKEN_KEY = 'grok-auth.bearer-token';
  let storedToken = '';
  try { storedToken = sessionStorage.getItem(TOKEN_KEY) || ''; localStorage.removeItem('student_explorer_token'); /* old versions kept a shared token here */ } catch { storedToken = ''; }
  const session = { token: storedToken, user: null };
  let tripsCache = [];
  // v16: everything a person does on this device (recent searches, favourites, saved plans) is stored per account,
  // so logging in as someone else never shows the previous person's history.
  function accountScope() {
    const u = session.user;
    return u ? 'u_' + String(u.id || u.email || '').toLowerCase() : 'guest';
  }
  let lastScope = 'guest';
  function scopedKey(base) { return base + '::' + accountScope(); }
  // Logged in = we know the user (cookie or bearer token). Checking only the token wrongly treated
  // people who signed in on /login (cookie only) as logged out.
  function isLoggedIn() { return Boolean(session.user || session.token); }

  function rememberToken(token) {
    session.token = token || '';
    try {
      if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('student_explorer_token');
      }
    } catch { /* private mode */ }
    window.dispatchEvent(new Event('se-auth'));
  }

  async function api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (session.token) headers.Authorization = 'Bearer ' + session.token;
    let res;
    try {
      res = await fetch(path, { method: opts.method || 'GET', headers, credentials: 'include', body: opts.body ? JSON.stringify(opts.body) : undefined });
    } catch {
      const netErr = new Error('Cannot reach the server. Check your internet connection.');
      netErr.network = true;
      throw netErr;
    }
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON response */ }
    if (res.status === 401 && session.token && !path.startsWith('/api/auth/login')) setSession('', null);
    if (!res.ok || data.success === false) {
      const err = new Error(data.error || 'Something went wrong. Please try again.');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ============================================================================
  // 4. DOM ELEMENT SELECTION
  // ============================================================================
  const searchInput = document.getElementById('searchInput');
  const searchForm = document.getElementById('heroSearchForm');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const quickTags = document.querySelectorAll('.tag-link');
  
  const placesGrid = document.getElementById('placesGrid');
  const noResultsState = document.getElementById('noResultsState');
  const resetSearchBtn = document.getElementById('resetSearchBtn');
  
  const categoryFilterTabs = document.querySelectorAll('.tab-btn');
  const categoryCards = document.querySelectorAll('.category-card');
  const budgetPills = document.querySelectorAll('.budget-pill');
  const resetBudgetFilterBtn = document.getElementById('resetBudgetFilterBtn');
  const budgetStatusText = document.getElementById('budgetStatusText');
  const findPlacesBtn = document.getElementById('findPlacesBtn');

  const filterNotification = document.getElementById('filterNotification');
  const filterNotificationText = document.getElementById('filterNotificationText');
  const clearFilterBtn = document.getElementById('clearFilterBtn');

  // Location, Transit & Sort Controls
  const userLocationSelect = document.getElementById('userLocationSelect');
  const locChips = document.querySelectorAll('.loc-chip');
  const distanceRangePills = document.querySelectorAll('.dist-pill');
  const distanceRangeHint = document.getElementById('distanceRangeHint');
  const sortBySelect = document.getElementById('sortBySelect');
  const detectGpsBtn = document.getElementById('detectGpsBtn');
  const heroGpsBtn = document.getElementById('heroGpsBtn');
  const heroLocationStatus = document.getElementById('heroLocationStatus');

  // Manual Starting Location Controls
  const locModePresetBtn = document.getElementById('locModePresetBtn');
  const locModeManualBtn = document.getElementById('locModeManualBtn');
  const presetSelectWrapper = document.getElementById('presetSelectWrapper');
  const manualLocationBox = document.getElementById('manualLocationBox');
  const manualLocationInput = document.getElementById('manualLocationInput');
  const setManualLocBtn = document.getElementById('setManualLocBtn');
  const manualGeocodeStatus = document.getElementById('manualGeocodeStatus');
  const manualHintPills = document.querySelectorAll('.manual-hint-pill');

  // Community Upload Current Location Controls
  const newPlaceCurrentLocBtn = document.getElementById('newPlaceCurrentLocBtn');
  const newPlaceGpsBtnText = document.getElementById('newPlaceGpsBtnText');
  const newPlaceArea = document.getElementById('newPlaceArea');
  const newPlaceLat = document.getElementById('newPlaceLat');
  const newPlaceLng = document.getElementById('newPlaceLng');
  const newPlaceLocFeedback = document.getElementById('newPlaceLocFeedback');

  // Modals Elements
  const placeDetailsModal = document.getElementById('placeDetailsModal');
  const closePlaceModalBtn = document.getElementById('closePlaceModalBtn');
  const savePlaceBookmarkBtn = document.getElementById('savePlaceBookmarkBtn');
  const sharePlaceWhatsAppBtn = document.getElementById('sharePlaceWhatsAppBtn');
  const reportPlaceIssueBtn = document.getElementById('reportPlaceIssueBtn');
  const copyPlaceLinkBtn = document.getElementById('copyPlaceLinkBtn');
  const modalDistanceHighlight = document.getElementById('modalDistanceHighlight');
  const modalOriginCrumbName = document.getElementById('modalOriginCrumbName');
  const modalEtaEstimate = document.getElementById('modalEtaEstimate');

  // Modal map + directions elements (OpenStreetMap)
  const modalDirectionsDestName = document.getElementById('modalDirectionsDestName');
  const modalOriginNameDisplay = document.getElementById('modalOriginNameDisplay');
  const modalExternalGmapsLink = document.getElementById('modalExternalGmapsLink');
  const modalTravelModeButtons = document.querySelectorAll('#modalTravelModeButtons .mode-pill');
  const modalMapIframe = document.getElementById('modalMapIframe');
  const mapLoadingPlaceholder = document.getElementById('mapLoadingPlaceholder');

  // Modal Review Elements
  const modalAvgScore = document.getElementById('modalAvgScore');
  const modalReviewsCount = document.getElementById('modalReviewsCount');
  const toggleReviewFormBtn = document.getElementById('toggleReviewFormBtn');
  const addReviewForm = document.getElementById('addReviewForm');
  const starPicks = document.querySelectorAll('#starRatingSelector .star-pick');
  const selectedStarRating = document.getElementById('selectedStarRating');
  const ratingLabelHint = document.getElementById('ratingLabelHint');
  const reviewAuthorName = document.getElementById('reviewAuthorName');
  const reviewCollegeName = document.getElementById('reviewCollegeName');
  const reviewCostSpent = document.getElementById('reviewCostSpent');
  const reviewHighlight = document.getElementById('reviewHighlight');
  const reviewComment = document.getElementById('reviewComment');
  const cancelReviewBtn = document.getElementById('cancelReviewBtn');
  const modalReviewsList = document.getElementById('modalReviewsList');

  // Community Upload Modal Elements
  const uploadPlaceModal = document.getElementById('uploadPlaceModal');
  const openUploadPlaceBtn = document.getElementById('navAddPlaceBtn');
  const openUploadPlaceBtn2 = document.getElementById('openUploadPlaceBtn2');
  const navAddPlaceLink = document.getElementById('navAddPlaceLink');
  const closeUploadPlaceModalBtn = document.getElementById('closeUploadPlaceModalBtn');
  const uploadPlaceForm = document.getElementById('uploadPlaceForm');
  const newPlacePhotoFile = document.getElementById('newPlacePhotoFile');
  const photoPreviewBox = document.getElementById('photoPreviewBox');
  const photoPreviewImg = document.getElementById('photoPreviewImg');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  const presetCoverChips = document.querySelectorAll('#presetCoverChips .preset-cover-chip');

  // Budget Calculator Elements
  const numPeopleInput = document.getElementById('numPeople');
  const decrementPeopleBtn = document.getElementById('decrementPeopleBtn');
  const incrementPeopleBtn = document.getElementById('incrementPeopleBtn');
  const peopleCountDisplay = document.getElementById('peopleCountDisplay');
  const costTransport = document.getElementById('costTransport');
  const costFood = document.getElementById('costFood');
  const costEntry = document.getElementById('costEntry');
  const costOther = document.getElementById('costOther');
  const totalGroupCostDisplay = document.getElementById('totalGroupCost');
  const costPerPersonDisplay = document.getElementById('costPerPerson');
  const resetCalculatorBtn = document.getElementById('resetCalculatorBtn');
  const presetChips = document.querySelectorAll('.preset-chip');

  // Post-Trip Expense Diary Elements
  const tripExpenseForm = document.getElementById('tripExpenseForm');
  const expensePlaceSelect = document.getElementById('expensePlaceSelect');
  const customPlaceGroup = document.getElementById('customPlaceGroup');
  const customPlaceName = document.getElementById('customPlaceName');
  const expenseDate = document.getElementById('expenseDate');
  const expenseTransitMode = document.getElementById('expenseTransitMode');
  const expenseNumPeople = document.getElementById('expenseNumPeople');
  const expenseTransitCost = document.getElementById('expenseTransitCost');
  const expenseFoodCost = document.getElementById('expenseFoodCost');
  const expenseEntryCost = document.getElementById('expenseEntryCost');
  const expenseMiscCost = document.getElementById('expenseMiscCost');
  const liveTotalTripCost = document.getElementById('liveTotalTripCost');
  const livePerPersonShare = document.getElementById('livePerPersonShare');
  const expenseNote = document.getElementById('expenseNote');
  const loggedTripsList = document.getElementById('loggedTripsList');
  const clearAllExpensesBtn = document.getElementById('clearAllExpensesBtn');
  const statTotalSpent = document.getElementById('statTotalSpent');
  const statTripsCount = document.getElementById('statTripsCount');
  const statAvgSpent = document.getElementById('statAvgSpent');

  // Auth & Legal Modals
  const authModal = document.getElementById('authModal');
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
  const authForm = document.getElementById('authForm');
  const authSuccessMsg = document.getElementById('authSuccessMsg');

  const legalModal = document.getElementById('legalModal');
  const legalModalTitle = document.getElementById('legalModalTitle');
  const legalModalBody = document.getElementById('legalModalBody');
  const closeLegalModalBtn = document.getElementById('closeLegalModalBtn');
  const closeLegalBtnAction = document.getElementById('closeLegalBtnAction');
  const privacyPolicyBtn = document.getElementById('privacyPolicyBtn');
  const termsBtn = document.getElementById('termsBtn');
  const campusAmbassadorBtn = document.getElementById('campusAmbassadorBtn');

  // Mobile Menu & Toast
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  const toast = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // ============================================================================
  // 5. APPLICATION STATE
  // ============================================================================
  const currentState = {
    userLocationKey: 'koramangala',
    liveCoords: null, // Holds { lat: number, lng: number } when browser GPS is active
    manualLocation: null, // Holds { name: string, fullName: string, lat: number, lng: number }
    maxDistanceKm: 'all',
    sortBy: 'distance-asc',
    category: 'all',
    budget: 'all',
    collection: 'all',
    query: '',
    activeModalPlaceId: 'lalbagh',
    activeTravelMode: 'transit',
    newPlaceSelectedPhotoUrl: '',
    photoChoice: 'none',
    nearbyAnnounced: false
  };


  // Search state lives up here so any early filter call can read it safely.
  let searchIndexCache = { sig: '', index: null };
  let lastSearch = null;

  function scrollToPlaces(smooth = true) {
    const section = document.getElementById('places');
    const grid = document.getElementById('placesGrid');
    const firstVisible = grid && [...grid.querySelectorAll('.place-card')].find(c => c.style.display !== 'none');
    const el = firstVisible || grid || section;
    if (!el) return;
    // Offset for sticky navbar so the list is actually in view
    const y = el.getBoundingClientRect().top + window.pageYOffset - 88;
    window.scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' });
    // Second pass after layout/filters settle
    setTimeout(() => {
      const y2 = el.getBoundingClientRect().top + window.pageYOffset - 88;
      window.scrollTo({ top: Math.max(0, y2), behavior: smooth ? 'smooth' : 'auto' });
    }, 280);
  }

  function applyFiltersAndSort() {
    applyFilters();
    sortPlaceCards(currentState.sortBy || 'distance-asc');
    updateFilterBanner(
      [...document.querySelectorAll('.place-card')].filter(c => c.style.display !== 'none').length,
      parseSearchQuery(currentState.query || '')
    );
  }

  let toastTimer = null;
  function showToast(message) {
    if (!toast || !toastMessage) return;
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.classList.add('show');
    // v15: also show the message right under the planner buttons, so feedback is never missed.
    try {
      const st = document.getElementById('tripPlanStatus');
      if (st && Date.now() - (window.__planActionAt || 0) < 10000) { st.textContent = message; st.hidden = false; }
    } catch (_) { /* ignore */ }
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // Set today's date in expense form
  if (expenseDate) {
    expenseDate.value = new Date().toISOString().split('T')[0];
  }

  // ============================================================================
  // 6. ACTIVE LOCATION & GOOGLE MAPS DIRECTIONS (directions only)
  // Builds Google Maps direction links and route embed
  // ============================================================================
  
  /**
   * Returns current active origin point (Live GPS coordinates, manual typed area, or selected campus hub)
   */
  // v17: active paid promotions keyed by place id (loaded from /api/promotions/active; prices are never sent to visitors)
  const PROMOS = {};
  const PROMO_SEED = Math.random();
  const istToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  // Equal-strength shops take turns: a per-visit random tie-break so nobody who pays the same is always last.
  const promoTie = (id) => { let h = 2166136261; const t = String(id) + PROMO_SEED; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };
  const promoScore = (id) => { const pr = PROMOS[id]; return pr ? pr.priority + promoTie(id) * 0.9 : 0; };
  const promoBoost = (id, placement) => { const pr = PROMOS[id]; return pr && (!placement || pr.placements.includes(placement)) ? pr.priority : 0; };
  const promoLive = (pr) => !pr.endsAt || String(pr.endsAt).slice(0, 10) >= istToday(); // an ended promotion vanishes even in a tab left open

  function getActiveOrigin() {
    if (currentState.userLocationKey === 'current_location' && currentState.liveCoords) {
      return {
        name: "Your Current Location",
        fullName: "Your Live Location (GPS)",
        lat: currentState.liveCoords.lat,
        lng: currentState.liveCoords.lng,
        isGps: true
      };
    }
    if (currentState.userLocationKey === 'manual_location' && currentState.manualLocation) {
      return {
        name: currentState.manualLocation.name,
        fullName: currentState.manualLocation.fullName,
        lat: currentState.manualLocation.lat,
        lng: currentState.manualLocation.lng,
        isManual: true
      };
    }
    return BENGALURU_LOCATIONS[currentState.userLocationKey] || BENGALURU_LOCATIONS.koramangala;
  }

  /**
   * Google Maps directions link (no API key). Google Maps is used ONLY for directions;
   * photos, place info and auto-fill come from OpenStreetMap / Wikipedia / Wikimedia Commons.
   */
  const GMAPS_TRAVEL_MODES = { transit: 'transit', 'two-wheeler': 'two-wheeler', driving: 'driving', walking: 'walking', bicycling: 'bicycling' };

  function getGoogleMapsDirectionsUrl(originObjOrName, destName, lat, lng, travelMode, place) {
    const mode = GMAPS_TRAVEL_MODES[travelMode] || 'transit';
    const hasDest = lat != null && lng != null && lat !== '' && lng !== '';
    // Small shops/stalls added with only an area: let Google Maps find them by name + area (it knows tiny stalls),
    // instead of sending coordinates that only point at the middle of the locality.
    const byName = place && place.locationPrecision === 'area' && (place.mapQuery || place.name);
    const destination = byName ? (place.mapQuery || `${place.name}, ${place.location || ''}, Bengaluru`) : (hasDest ? `${lat},${lng}` : `${destName}, Bengaluru`);
    const params = new URLSearchParams({ api: '1', destination, travelmode: mode });
    if (originObjOrName && typeof originObjOrName === 'object' && originObjOrName.lat != null && originObjOrName.lng != null) {
      params.set('origin', `${originObjOrName.lat},${originObjOrName.lng}`);
    }
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  /** Keyless Google Maps embed showing the route from origin to the place. */
  function googleMapsEmbedUrl(origin, place, travelMode) {
    const flags = { transit: 'r', driving: 'd', 'two-wheeler': 'd', walking: 'w', bicycling: 'b' };
    const hasPin = Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lng)) && place.lat !== '' && place.lng !== '' && place.lat != null && place.lng != null;
    const daddr = (place.locationPrecision === 'area' || !hasPin) && (place.mapQuery || place.name) ? (place.mapQuery || `${place.name}, ${place.location || ''}, Bengaluru`) : `${place.lat},${place.lng}`;
    const params = new URLSearchParams({ daddr, dirflg: flags[travelMode] || 'r', output: 'embed' });
    if (origin && origin.lat != null && origin.lng != null) params.set('saddr', `${origin.lat},${origin.lng}`);
    return `https://maps.google.com/maps?${params.toString()}`;
  }

  /**
   * Updates the map + directions section inside the Place Details Modal (Google Maps, directions only)
   */
  function updateModalGoogleMapsView(placeId) {
    const place = PLACES_DATA[placeId];
    if (!place) return;

    const origin = getActiveOrigin();

    if (modalDirectionsDestName) modalDirectionsDestName.textContent = place.name;
    if (modalOriginNameDisplay) modalOriginNameDisplay.textContent = origin.name;

    const directionsUrl = getGoogleMapsDirectionsUrl(origin, place.name, place.lat, place.lng, currentState.activeTravelMode, place);
    if (modalExternalGmapsLink) modalExternalGmapsLink.href = directionsUrl;

    if (modalMapIframe) {
      if (mapLoadingPlaceholder) mapLoadingPlaceholder.classList.remove('hidden');
      modalMapIframe.src = googleMapsEmbedUrl(origin, place, currentState.activeTravelMode);
      modalMapIframe.onload = () => {
        if (mapLoadingPlaceholder) mapLoadingPlaceholder.classList.add('hidden');
      };
    }
  }

  // Travel Mode Pills Click
  modalTravelModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modalTravelModeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentState.activeTravelMode = btn.getAttribute('data-mode') || 'transit';
      updateModalGoogleMapsView(currentState.activeModalPlaceId);
    });
  });

  // ============================================================================
  // 7. HAVERSINE DISTANCE & FARE ESTIMATES
  // ============================================================================
  /** Coerce place coordinates to finite numbers; try PLACES_DATA / local name lookup if missing. */
  function normalizePlaceCoords(place) {
    if (!place || typeof place !== 'object') return place;
    let lat = Number(place.lat);
    let lng = Number(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const known = place.id && PLACES_DATA[place.id];
      if (known) {
        lat = Number(known.lat);
        lng = Number(known.lng);
      }
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      // Last resort: match area / location text against the campus-neighbourhood index used for start points.
      const text = `${place.name || ''} ${place.location || ''} ${place.area || ''} ${place.address || ''}`.toLowerCase();
      let best = null;
      for (const loc of Object.values(BENGALURU_LOCATIONS || {})) {
        if (!loc || !Number.isFinite(loc.lat)) continue;
        const key = String(loc.name || '').toLowerCase();
        if (key && text.includes(key.split(' ')[0]) && key.length >= 4) {
          best = loc;
          break;
        }
      }
      if (best) {
        lat = best.lat;
        lng = best.lng;
      }
    }
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      place.lat = Math.round(lat * 1e5) / 1e5;
      place.lng = Math.round(lng * 1e5) / 1e5;
    }
    return place;
  }

  function placeRoadKmFromOrigin(origin, placeOrLat, lngMaybe) {
    const o = origin || getActiveOrigin();
    let lat;
    let lng;
    if (placeOrLat && typeof placeOrLat === 'object') {
      normalizePlaceCoords(placeOrLat);
      lat = Number(placeOrLat.lat);
      lng = Number(placeOrLat.lng);
    } else {
      lat = Number(placeOrLat);
      lng = Number(lngMaybe);
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(o.lat) || !Number.isFinite(o.lng)) {
      return 0.4;
    }
    const straight = calculateDistanceKm(o.lat, o.lng, lat, lng);
    return roadKmFromStraight(straight);
  }

  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return Math.round(dist * 10) / 10;
  }

  const distText = (km) => (km < 1 ? `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m` : `${(Math.round(km * 10) / 10).toFixed(1)} km`);
  function roadKmFromStraight(straightKm) {
    const km = Number.isFinite(straightKm) ? straightKm : 0;
    return Math.round(Math.max(0.05, km) * 1.22 * 100) / 100; // exact to ~10 m; shown as metres under 1 km
  }

  function metroSlab(km) {
    // Namma Metro (BMRCL) distance slabs: Rs 10 up to 2 km ... Rs 90 beyond 25 km (smart card gets 5-10% off).
    const slabs = [[2,10],[4,20],[6,30],[8,40],[10,50],[15,60],[20,70],[25,80]];
    for (const pair of slabs) if (km <= pair[0]) return pair[1];
    return 90;
  }

  // ---- Dynamic pricing (keep in sync with src/lib/explorer/fares.ts) ----
  function istParts(now = new Date()) {
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 330 * 60000);
    return { day: ist.getDay(), hour: ist.getHours() };
  }
  function getPricingPeriod(now = new Date()) {
    const { day, hour } = istParts(now);
    const weekend = day === 0 || day === 6;
    if (hour >= 22 || hour < 5) return { period: 'late_night', label: 'Late night' };
    if (hour >= 8 && hour < 11) return { period: 'morning_peak', label: weekend ? 'Weekend morning' : 'Morning peak' };
    if (hour >= 17 && hour < 21) return { period: 'evening_peak', label: weekend ? 'Weekend evening' : 'Evening peak' };
    if (weekend) return { period: 'weekend', label: 'Weekend' };
    return { period: 'offpeak', label: 'Off-peak' };
  }
  function periodMultipliers(period) {
    switch (period) {
      // Bus and metro fares are fixed (no surge). Autos follow the official meter: +50% only 10 pm - 5 am.
      case 'morning_peak': return { rapido: 1.15, auto: 1.0, bus: 1.0, metro: 1.0 };
      case 'evening_peak': return { rapido: 1.2, auto: 1.0, bus: 1.0, metro: 1.0 };
      case 'late_night': return { rapido: 1.3, auto: 1.5, bus: 1.0, metro: 1.0 };
      case 'weekend': return { rapido: 1.05, auto: 1.0, bus: 1.0, metro: 1.0 };
      default: return { rapido: 1.0, auto: 1.0, bus: 1.0, metro: 1.0 };
    }
  }
  function demandFactor(now = new Date()) {
    const { hour } = istParts(now);
    if (hour >= 8 && hour < 11) return 0.55;
    if (hour >= 12 && hour < 14) return 0.35;
    if (hour >= 17 && hour < 21) return 0.70;
    if (hour >= 21 && hour < 23) return 0.45;
    if (hour >= 23 || hour < 5) return 0.25;
    return 0.15;
  }
  function progressivePerKm(km, baseRate, longRate, breakAt) {
    if (km <= breakAt) return km * baseRate;
    return breakAt * baseRate + (km - breakAt) * longRate;
  }

  function computeFares(roadKm, placeId) {
    const kmShown = Math.max(0.05, Math.round(Number(roadKm) * 100) / 100); // what the visitor sees: exact to ~10 m
    const km = Math.max(0.4, Math.round(Number(roadKm) * 10) / 10);          // what fares are priced on (fares have minimums)
    const outstation = km > 42 || placeId === 'nandihills';
    const now = new Date();
    const { period, label } = getPricingPeriod(now);
    const mult = periodMultipliers(period);
    const demand = demandFactor(now);
    const privateDemand = 1 + demand * 0.12;
    const round = (n) => Math.max(0, Math.round(n));

    if (outstation) {
      const baseBus = 18 + progressivePerKm(km, 1.75, 1.45, 50);
      const baseBike = progressivePerKm(km, 3.8, 3.2, 40);
      const baseAuto = Math.max(80, 40 + progressivePerKm(km, 18, 14, 30));
      const bus = round(baseBus * mult.bus);
      const rapido = round(baseBike * mult.rapido * privateDemand);
      const auto = round(baseAuto * mult.auto * privateDemand);
      return {
        roadKm: kmShown, outstation: true, rapido,
        rapidoNote: `${label} · long ride — confirm in app`,
        metro: null, metroNote: 'No direct metro',
        bus, busNote: `${label} · KSRTC / intercity, one way`,
        busLabel: '🚌 KSRTC', rapidoLabel: '🏍️ Bike est.',
        auto, autoShare: Math.max(1, Math.ceil(auto / 3)),
        pricing: { period, periodLabel: label }
      };
    }

    // Bike taxi apps: about Rs 7-8 per km plus a small base (reported Rs 50-60 for a short city ride).
    const baseRapido = Math.max(30, 18 + progressivePerKm(km, 7.5, 6.5, 15));
    // Official auto meter (Bengaluru RTA, from Aug 2025): Rs 36 for the first 2 km, Rs 18 per km after.
    const baseAuto = km <= 2 ? 36 : 36 + (km - 2) * 18;
    const baseBus = Math.max(8, 5 + progressivePerKm(km, 2.0, 1.6, 18));
    const baseMetro = metroSlab(km);
    const rapido = round(baseRapido * mult.rapido * privateDemand);
    const auto = round(baseAuto * mult.auto);
    const bus = round(baseBus * mult.bus);
    const metro = round(baseMetro * mult.metro);
    const surgeHint = (mult.rapido * privateDemand >= 1.25)
      ? ` · ${label} pricing`
      : (period === 'offpeak' ? ' · off-peak' : ` · ${label}`);
    return {
      roadKm: kmShown, outstation: false, rapido,
      rapidoNote: `One way from your start${surgeHint}`,
      metro, metroNote: 'Token fare · smart card is 5-10% less',
      bus, busNote: `BMTC ordinary · AC Vajra ≈ ₹${round(bus * 1.8)}`,
      busLabel: '🚌 BMTC', rapidoLabel: '🏍️ Rapido',
      auto, autoNote: period === 'late_night' ? 'Meter +50% (10 pm-5 am)' : 'Meter fare · apps add ~₹10-30',
      autoShare: Math.max(1, Math.ceil(auto / 3)),
      pricing: { period, periodLabel: label }
    };
  }

  function getTransitEstimates(distanceKm, placeId) {
    const q = computeFares(distanceKm, placeId);
    return {
      distanceKm: q.roadKm,
      rapidoFare: q.rapido == null ? '—' : `₹${q.rapido}`,
      rapidoCostNum: q.rapido || 0,
      rapidoSub: q.rapidoNote,
      rapidoLabel: q.rapidoLabel,
      uberFare: `₹${q.auto}`,
      uberSub: `₹${q.autoShare}/friend`,
      uberLabel: '🛺 Auto',
      metroFare: q.metro == null ? 'No metro' : `₹${q.metro}`,
      metroSub: q.metroNote,
      busFare: q.bus == null ? '—' : `₹${q.bus}`,
      quote: q
    };
  }

  function paintFares(card, roadKm, placeId, originName, metro) {
    const q = computeFares(roadKm, placeId);
    if (!q.outstation && metro !== undefined) {
      if (metro) { q.metro = metro.fare; q.metroNote = metro.note; }
      else { q.metro = null; q.metroNote = 'No metro link for this trip'; }
    }
    card.setAttribute('data-distance', String(q.roadKm));
    card.setAttribute('data-rapido', String(q.rapido || 0));
    const top = card.querySelector('.card-top-dist');
    if (top) top.textContent = distText(q.roadKm);
    const distVal = card.querySelector('.place-dist-val');
    if (distVal) distVal.textContent = distText(q.roadKm);
    const loc = card.querySelector('.user-loc-name');
    if (loc) loc.textContent = originName;
    const grid = card.querySelector('.transit-options-grid');
    if (grid) {
      const cell = (label, fare, sub, cls = '') =>
        `<div class="transit-option-item ${cls}"><span class="transit-mode-name">${label}</span><span class="transit-fare">${fare}</span><span class="transit-sub">${sub}</span></div>`;
      const money = (n) => (n == null ? '—' : `₹${n}`);
      grid.innerHTML = [
        cell(q.rapidoLabel, money(q.rapido), q.rapidoNote),
        cell('🚇 Metro', q.metro == null ? 'No metro' : money(q.metro), q.metroNote, 'highlight-metro'),
        cell(q.busLabel, money(q.bus), q.busNote),
        cell('🛺 Auto', money(q.auto), q.autoNote || `₹${q.autoShare} if 3 share`)
      ].join('');
    }
    let note = card.querySelector('.fare-from-note');
    const header = card.querySelector('.transit-distance-header');
    if (!note && header) {
      note = document.createElement('p');
      note.className = 'fare-from-note';
      header.insertAdjacentElement('afterend', note);
    }
    if (note) {
      const periodBit = q.pricing && q.pricing.periodLabel
        ? ` · <span class="fare-period-tag">${escapeHtml(q.pricing.periodLabel)}</span> rates`
        : '';
      note.innerHTML = `From <strong>${escapeHtml(originName)}</strong> · ${distText(q.roadKm)} by road${periodBit}. Fares are one-way and change with your start point, distance, and time of day.`;
    }
    const tag = card.querySelector('.transit-tag-pill');
    if (tag) tag.textContent = 'From your start';
  }

  function updateCardsDistanceAndTransit(opts = {}) {
    const origin = getActiveOrigin();
    const cards = document.querySelectorAll('.place-card');
    const banner = document.getElementById('fareBasisBanner');
    if (banner) {
      const { label } = getPricingPeriod(new Date());
      banner.innerHTML = `Dynamic fares · <strong>${escapeHtml(label)}</strong> · from <strong>${escapeHtml(origin.name)}</strong> (${Number(origin.lat).toFixed(4)}, ${Number(origin.lng).toFixed(4)}). Autos follow the meter (₹36 for 2 km, ₹18/km after, +50% at night). Bike taxis rise in peak hours. Bus and metro are fixed fares. Change your start point to recalculate.`;
    }

    cards.forEach(card => {
      const placeId = card.getAttribute('data-id') || '';
      const fromData = PLACES_DATA[placeId];
      if (fromData) normalizePlaceCoords(fromData);
      // Prefer live place coordinates over card attributes (attrs can be empty on newly added places).
      let cardLat = Number(fromData && fromData.lat);
      let cardLng = Number(fromData && fromData.lng);
      if (!Number.isFinite(cardLat) || !Number.isFinite(cardLng)) {
        cardLat = parseFloat(card.getAttribute('data-lat'));
        cardLng = parseFloat(card.getAttribute('data-lng'));
      }
      if (!Number.isFinite(cardLat) || !Number.isFinite(cardLng)) {
        // Do not fall back to origin (that made every fare look like ₹10 for a 0 km trip).
        paintFares(card, 0.4, placeId, origin.name);
        const top = card.querySelector('.card-top-dist');
        if (top) top.textContent = '— km';
        const distVal = card.querySelector('.place-dist-val');
        if (distVal) distVal.textContent = '— km';
        return;
      }
      card.setAttribute('data-lat', String(cardLat));
      card.setAttribute('data-lng', String(cardLng));
      if (fromData) {
        fromData.lat = cardLat;
        fromData.lng = cardLng;
      }
      const distKm = placeRoadKmFromOrigin(origin, cardLat, cardLng);
      paintFares(card, distKm, placeId, origin.name);

      const nearestStopText = card.querySelector('.nearest-stop-text');
      if (nearestStopText && PLACES_STOPS[placeId]) {
        nearestStopText.innerHTML = `Nearest Stop: <strong>${PLACES_STOPS[placeId]}</strong>`;
      }
    });

    // keepOrder: refresh the numbers in place without re-sorting, so the list never shuffles under someone who is reading it.
    if (!opts.keepOrder) { applyFilters(); sortPlaceCards(currentState.sortBy); }

    // Asynchronously ask the server (free OSRM router) for precise road distance
    if (!opts.skipBackend) syncBackendGoogleMapsDistances(origin);
  }

  /**
   * Calls backend /api/maps/distance to get road distance and ETAs from the free OSRM router
   */
  let backendDistanceSeq = 0; // each server distance request gets a number; only the newest request's answer may be painted
  let backendDistanceTimer = null;
  async function syncBackendGoogleMapsDistances(origin) {
    if (!origin || !Number.isFinite(Number(origin.lat)) || !Number.isFinite(Number(origin.lng))) return;

    if (backendDistanceTimer) clearTimeout(backendDistanceTimer);
    backendDistanceTimer = setTimeout(async () => {
      const cards = Array.from(document.querySelectorAll('.place-card'));
      if (cards.length === 0) return;

      // Never fall back destination coords to origin — that made every place look ~0 km (₹10 fares).
      const destinations = cards.map(c => {
        const id = c.getAttribute('data-id') || '';
        const fromData = id && PLACES_DATA[id] ? normalizePlaceCoords(PLACES_DATA[id]) : null;
        let lat = Number(fromData && fromData.lat);
        let lng = Number(fromData && fromData.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          lat = parseFloat(c.getAttribute('data-lat'));
          lng = parseFloat(c.getAttribute('data-lng'));
        }
        return {
          id,
          lat,
          lng,
          name: c.getAttribute('data-name') || (fromData && fromData.name) || ''
        };
      }).filter(d => d.id && Number.isFinite(d.lat) && Number.isFinite(d.lng));

      if (!destinations.length) return;

      const seq = ++backendDistanceSeq;
      try {
        const response = await fetch('/api/maps/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: { lat: Number(origin.lat), lng: Number(origin.lng), name: origin.name || 'Your location' },
            destinations
          })
        });
        if (!response.ok) return;

        const data = await response.json();
        // A slower, older answer (calculated from where you WERE) must never overwrite a newer one.
        if (seq !== backendDistanceSeq) return;
        const nowOrigin = getActiveOrigin();
        if (calculateDistanceKm(nowOrigin.lat, nowOrigin.lng, Number(origin.lat), Number(origin.lng)) * 1000 > 5) return;
        if (!data || !data.distances) return;

        let hasUpdates = false;
        cards.forEach(card => {
          const placeId = card.getAttribute('data-id');
          const metric = data.distances[placeId];
          if (metric && Number.isFinite(Number(metric.distanceKm)) && Number(metric.distanceKm) > 0) {
            const km = Math.max(0.05, Math.round(Number(metric.distanceKm) * 100) / 100);
            paintFares(card, km, placeId, origin.name || 'Your location', metric.metro || null);
            const distValEl = card.querySelector('.place-dist-val');
            if (distValEl) {
              distValEl.textContent = metric.durationText ? `${distText(km)} (${metric.durationText})` : distText(km);
            }
            const cardTopDistEl = card.querySelector('.card-top-dist');
            if (cardTopDistEl) {
              cardTopDistEl.textContent = distText(km);
              if (metric.durationText) cardTopDistEl.title = `Road distance ${distText(km)} (${metric.durationText})`;
            }
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          applyFilters();
          sortPlaceCards(currentState.sortBy);
        }
      } catch (err) {
        console.warn('Backend distance sync notice:', err);
      }
    }, 250);
  }

  // ============================================================================
  // 8. STUDENT REVIEWS SYSTEM CONTROLLER
  // ============================================================================

  /**
   * Renders review feed, calculates average rating score and review count for a place
   */
  async function renderPlaceReviews(placeId) {
    if (!modalReviewsList) return;
    modalReviewsList.innerHTML = `<div style="padding:1.25rem;text-align:center;color:#64748B;">Loading reviews…</div>`;

    let reviews = [];
    try {
      const data = await api('/api/reviews/' + encodeURIComponent(placeId));
      reviews = data.reviews || [];
    } catch {
      // Fallback to local seed data if server unavailable
      const allReviews = getStoredReviews();
      reviews = (allReviews[placeId] || []).map(r => ({
        ...r,
        authorName: r.author,
        costSpent: r.spent,
        createdAt: r.createdAt || Date.now(),
      }));
    }

    let avg = 4.8;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (parseFloat(r.rating) || 5), 0);
      avg = Math.round((sum / reviews.length) * 10) / 10;
    }

    if (modalAvgScore) modalAvgScore.textContent = avg.toFixed(1);
    if (modalReviewsCount) modalReviewsCount.textContent = `(${reviews.length} reviews)`;

    const card = document.querySelector(`.place-card[data-id="${placeId}"]`);
    if (card) {
      card.setAttribute('data-rating', avg.toString());
      const ratingVal = card.querySelector('.rating-val');
      if (ratingVal) ratingVal.textContent = avg.toFixed(1);
      const countTag = card.querySelector('.reviews-count-tag');
      if (countTag) countTag.textContent = `(${reviews.length} reviews)`;
    }

    modalReviewsList.innerHTML = '';
    const studentReviews = reviews.filter(r => !r.isSample);
    const adminNotes = reviews.filter(r => r.isSample);

    // Average & count based on real student reviews when present
    const scoreSource = studentReviews.length ? studentReviews : reviews;
    if (scoreSource.length > 0) {
      const sum = scoreSource.reduce((acc, r) => acc + (parseFloat(r.rating) || 5), 0);
      avg = Math.round((sum / scoreSource.length) * 10) / 10;
      if (modalAvgScore) modalAvgScore.textContent = avg.toFixed(1);
      if (modalReviewsCount) {
        modalReviewsCount.textContent = studentReviews.length
          ? `(${studentReviews.length} student review${studentReviews.length === 1 ? '' : 's'})`
          : `(${reviews.length} notes)`;
      }
    }

    function buildReviewCard(rev, kind) {
      const item = document.createElement('div');
      item.className = 'review-card-item' + (kind === 'admin' ? ' review-admin-note' : ' review-student');
      item.setAttribute('data-rev-id', rev.id || '');
      const fullStars = Math.floor(rev.rating || 5);
      const starStr = '★'.repeat(fullStars) + '☆'.repeat(Math.max(0, 5 - fullStars));
      let dateStr = 'Recent';
      try {
        if (rev.createdAt) dateStr = new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        else if (rev.date) dateStr = rev.date;
      } catch { /* keep */ }
      const author = rev.authorName || rev.author || (kind === 'admin' ? 'Explorer Desk' : 'Student');
      const spent = rev.costSpent != null ? rev.costSpent : rev.spent;
      const collegeLabel = kind === 'admin' ? 'Planning note' : (rev.college || 'Student');
      const footer = kind === 'admin' ? 'Admin planning note' : 'Student review';
      item.innerHTML = `
        <div class="review-header-flex">
          <div class="review-author-info">
            <span class="review-author-name">${escapeHtml(author)}</span>
            <div class="review-badges-row">
              <span class="student-college-tag">${escapeHtml(collegeLabel)}</span>
              <span class="review-date-text">${escapeHtml(dateStr)}</span>
            </div>
          </div>
          <div class="review-rating-block">
            <span class="review-stars-display">${starStr}</span>
            ${spent != null && kind === 'student' ? `<span class="review-spent-tag">Spent: ₹${spent} / head</span>` : ''}
          </div>
        </div>
        ${rev.highlight ? `<div class="review-dish-tag">🍽️ ${escapeHtml(rev.highlight)}</div>` : ''}
        <p class="review-comment-body">${escapeHtml(rev.comment)}</p>
        ${rev.photo ? `<div class="review-photo-wrap"><img class="review-photo" src="${String(rev.photo).replace(/"/g, '')}" alt="Review photo" loading="lazy" /></div>` : ''}
        <div class="review-footer-row">
          <span class="verified-student-check">${footer}</span>
        </div>`;
      if (session.user?.isAdmin && rev.id) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:.4rem;margin-top:.5rem';
        row.innerHTML = '<button type="button" class="btn btn-ghost btn-sm">✏️ Edit comment (admin)</button><button type="button" class="btn btn-ghost btn-sm" style="color:#DC2626">🗑️ Delete</button>';
        const [editBtn, delBtn] = row.querySelectorAll('button');
        editBtn.addEventListener('click', async () => {
          const next = prompt('Edit comment text:', rev.comment || '');
          if (next == null || !next.trim()) return;
          try { await api('/api/admin/reviews/' + encodeURIComponent(rev.id), { method: 'PATCH', body: { comment: next.trim() } }); showToast('Comment updated.'); renderPlaceReviews(placeId); }
          catch (err) { showToast(err.message); }
        });
        delBtn.addEventListener('click', async () => {
          if (!confirm('Delete this comment for everyone?')) return;
          try { await api('/api/admin/reviews/' + encodeURIComponent(rev.id), { method: 'DELETE' }); showToast('Comment deleted.'); renderPlaceReviews(placeId); }
          catch (err) { showToast(err.message); }
        });
        item.appendChild(row);
      }
      return item;
    }

    if (studentReviews.length === 0 && adminNotes.length === 0) {
      modalReviewsList.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--color-slate-500);">
          <p>No student reviews yet. Be the first to share your experience!</p>
        </div>`;
      return;
    }

    // Student reviews first — own section
    const studentWrap = document.createElement('div');
    studentWrap.className = 'reviews-section-block reviews-students';
    const studentTitle = document.createElement('h4');
    studentTitle.className = 'reviews-section-title';
    studentTitle.textContent = studentReviews.length
      ? `Student reviews (${studentReviews.length})`
      : 'Student reviews';
    studentWrap.appendChild(studentTitle);
    if (studentReviews.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'reviews-empty-hint';
      empty.textContent = 'No student reviews yet — be the first to share what you spent and what you liked.';
      studentWrap.appendChild(empty);
    } else {
      studentReviews.forEach(rev => studentWrap.appendChild(buildReviewCard(rev, 'student')));
    }
    modalReviewsList.appendChild(studentWrap);

    // Admin notes — separate section, never mixed into student list
    if (adminNotes.length > 0) {
      const adminWrap = document.createElement('div');
      adminWrap.className = 'reviews-section-block reviews-admin-notes';
      const adminTitle = document.createElement('h4');
      adminTitle.className = 'reviews-section-title reviews-section-title-admin';
      adminTitle.textContent = `Admin planning notes (${adminNotes.length})`;
      adminWrap.appendChild(adminTitle);
      adminNotes.forEach(rev => adminWrap.appendChild(buildReviewCard(rev, 'admin')));
      modalReviewsList.appendChild(adminWrap);
    }
  }

  // Toggle Review Form Button
  if (toggleReviewFormBtn && addReviewForm) {
    toggleReviewFormBtn.addEventListener('click', () => {
      const isVisible = addReviewForm.style.display === 'flex';
      addReviewForm.style.display = isVisible ? 'none' : 'flex';
      toggleReviewFormBtn.style.display = isVisible ? 'inline-flex' : 'none';
      if (!isVisible && reviewAuthorName) {
        reviewAuthorName.focus();
      }
    });
  }

  if (cancelReviewBtn && addReviewForm && toggleReviewFormBtn) {
    cancelReviewBtn.addEventListener('click', () => {
      addReviewForm.style.display = 'none';
      toggleReviewFormBtn.style.display = 'inline-flex';
    });
  }

  // Star Rating Picker
  const RATING_HINTS = {
    1: "1 - Disappointing",
    2: "2 - Below Average",
    3: "3 - Decent Outing",
    4: "4 - Very Good Value",
    5: "5 - Incredible Outing!"
  };

  starPicks.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-val'), 10) || 5;
      if (selectedStarRating) selectedStarRating.value = val;
      if (ratingLabelHint) ratingLabelHint.textContent = RATING_HINTS[val] || `${val} Stars`;

      starPicks.forEach(s => {
        const sVal = parseInt(s.getAttribute('data-val'), 10);
        s.classList.toggle('active', sVal <= val);
      });
    });
  });

  // Handle Review Submission
  if (addReviewForm) {
    addReviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isLoggedIn()) {
        openAuth('signup', 'Create an account to post a review. Already signed up? Switch to Log In.');
        return;
      }

      const author = (reviewAuthorName?.value || session.user?.name || '').trim();
      const college = (reviewCollegeName?.value || session.user?.college || '').trim();
      let rating = parseFloat(document.getElementById('manualRatingInput')?.value || selectedStarRating?.value) || 5;
      rating = Math.min(5, Math.max(1, Math.round(rating * 10) / 10));
      const spent = parseInt(reviewCostSpent?.value, 10) || 0;
      const highlight = (reviewHighlight?.value || '').trim();
      const comment = (reviewComment?.value || '').trim();
      const placeId = currentState.activeModalPlaceId;

      if (!comment) {
        showToast('Please write a short review comment.');
        return;
      }
      if (!placeId) {
        showToast('Open a place first, then post your review.');
        return;
      }

      const place = PLACES_DATA[placeId];
      // Optional photo: only sent when user picked a file and clicked Post Verified Review
      let photo = '';
      const photoInput = document.getElementById('reviewPhotoInput');
      if (photoInput && photoInput.files && photoInput.files[0]) {
        const file = photoInput.files[0];
        if (file.size > 900000) {
          showToast('Review photo is too large (max ~900KB). Try a smaller image.');
          return;
        }
        photo = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Could not read photo'));
          reader.readAsDataURL(file);
        }).catch(() => '');
      }
      try {
        await api('/api/reviews', {
          method: 'POST',
          body: {
            placeId,
            placeName: place?.name || placeId,
            rating,
            costSpent: spent,
            highlight,
            comment,
            photo: photo || undefined,
            authorName: author,
            college,
          }
        });
        await renderPlaceReviews(placeId);
        window.dispatchEvent(new Event('se-gamification-refresh'));
        showToast('Thank you! Your review is published. ⭐');
        addReviewForm.reset();
        const prev = document.getElementById('reviewPhotoPreview');
        if (prev) { prev.style.display = 'none'; prev.innerHTML = ''; }
        addReviewForm.style.display = 'none';
        if (toggleReviewFormBtn) toggleReviewFormBtn.style.display = 'inline-flex';
      } catch (err) {
        showToast(err.message || 'Could not post review');
      }
    });
  }

  // Live preview for optional review photo (does not publish until submit)
  document.getElementById('reviewPhotoInput')?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    const box = document.getElementById('reviewPhotoPreview');
    if (!box) return;
    if (!file) { box.style.display = 'none'; box.innerHTML = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      box.style.display = 'block';
      box.innerHTML = `<img src="${reader.result}" alt="Review photo preview" style="max-width:160px;max-height:120px;border-radius:10px;object-fit:cover;border:1px solid var(--border-soft,#E2E8F0)" />`;
    };
    reader.readAsDataURL(file);
  });

  // ============================================================================
  // 9. COMMUNITY PLACE UPLOAD SYSTEM
  // Allows students to add places, cafes & spots
  // ============================================================================

  // Open & Close Upload Place Modal
  function openUploadModal() {
    if (uploadPlaceModal) {
      uploadPlaceModal.classList.add('open');
      uploadPlaceModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      currentState.photoAsked = false;
      { const ab = document.getElementById('photoAskBox'); if (ab) ab.style.display = 'none'; }
      // Prefill optional name from logged-in account
      const sub = document.getElementById('newPlaceSubmitter');
      if (sub && session.user && !sub.value) {
        sub.value = [session.user.name, session.user.college].filter(Boolean).join(', ');
      }
      if (typeof renderBudgetSuggestions === 'function') {
        const cat = document.getElementById('newPlaceCategory')?.value || 'food';
        renderBudgetSuggestions(cat);
      }
    }
  }

  function closeUploadModal() {
    if (uploadPlaceModal) {
      uploadPlaceModal.classList.remove('open');
      uploadPlaceModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  [openUploadPlaceBtn, openUploadPlaceBtn2, navAddPlaceLink].forEach(btn => {
    if (btn) btn.addEventListener('click', openUploadModal);
  });

  if (closeUploadPlaceModalBtn) {
    closeUploadPlaceModalBtn.addEventListener('click', closeUploadModal);
  }

  // Preset Cover Chips
  presetCoverChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetCoverChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const imgUrl = chip.getAttribute('data-img');
      currentState.photoChoice = 'preset';
      currentState.newPlaceSelectedPhotoUrl = imgUrl;

      if (photoPreviewBox && photoPreviewImg) {
        photoPreviewImg.src = imgUrl;
        photoPreviewBox.style.display = 'flex';
      }
    });
  });

  // Shrinks a phone photo (often 3-8 MB) to a web-sized JPEG so the upload is never rejected for size.
  function compressImageFile(file, maxDim = 1280, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type || '')) { reject(new Error('Please choose an image file.')); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
          const w = Math.max(1, Math.round(img.naturalWidth * scale));
          const h = Math.max(1, Math.round(img.naturalHeight * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          let out = canvas.toDataURL('image/jpeg', quality);
          if (out.length > 1_500_000) out = canvas.toDataURL('image/jpeg', 0.6);
          URL.revokeObjectURL(url);
          resolve(out);
        } catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        // Unreadable by the canvas (e.g. HEIC): fall back to the raw file if it is small enough.
        if (file.size > 1_400_000) { reject(new Error('That photo format could not be read. Please use a JPG or PNG.')); return; }
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read that photo.'));
        reader.readAsDataURL(file);
      };
      img.src = url;
    });
  }

  // Photo File Upload (compressed in the browser first)
  if (newPlacePhotoFile) {
    newPlacePhotoFile.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const base64Url = await compressImageFile(file);
        if (base64Url && photoPreviewBox && photoPreviewImg) {
          currentState.photoChoice = 'upload';
          currentState.newPlaceSelectedPhotoUrl = base64Url;
          photoPreviewImg.src = base64Url;
          photoPreviewBox.style.display = 'flex';
          presetCoverChips.forEach(c => c.classList.remove('active'));
          if (photoAskBox) photoAskBox.style.display = 'none';
          showToast('Photo added!');
        }
      } catch (err) {
        showToast(err?.message || 'Could not use that photo.');
        newPlacePhotoFile.value = '';
      }
    });
  }

  if (removePhotoBtn && photoPreviewBox) {
    removePhotoBtn.addEventListener('click', () => {
      currentState.photoChoice = 'none';
      currentState.newPlaceSelectedPhotoUrl = '';
      if (newPlacePhotoFile) newPlacePhotoFile.value = '';
      if (photoPreviewBox) photoPreviewBox.style.display = 'none';
      presetCoverChips.forEach(c => c.classList.remove('active'));
    });
  }

  // Server-calculated charges, ways to go and budget prediction (stored with each community place)
  function tripPlanHtml(place) {
    const est = place.estimate;
    if (!est) return '';
    const inr = n => '₹' + Number(n).toLocaleString('en-IN');
    const ways = est.ways.map(w => `
      <li><span class="plan-mode">${w.icon} ${escapeHtml(w.mode)}</span><span class="plan-time">${escapeHtml(w.time)}</span><strong>${inr(w.fare)}</strong></li>`).join('');
    const p = est.prediction, c = est.charges;
    return `
      <details class="trip-plan">
        <summary>💡 Trip plan &amp; budget: <strong>${inr(p.lean)} – ${inr(p.comfy)}</strong> per person</summary>
        <div class="plan-body">
          <h4>Ways to go <small>from ${escapeHtml(est.origin)} · ${est.distanceKm} km by road</small></h4>
          <ul class="plan-ways">${ways}</ul>
          <h4>Expected charges</h4>
          <div class="plan-charges">
            <span>Entry <strong>${c.entry ? inr(c.entry) : 'Free'}</strong></span>
            <span>On-site spend <strong>${inr(c.onSiteLow)} – ${inr(c.onSiteHigh)}</strong></span>
            <span>Round-trip travel <strong>${inr(c.travelLow)} – ${inr(c.travelHigh)}</strong></span>
          </div>
          <h4>Budget prediction <small>per person</small></h4>
          <div class="plan-predict">
            <div><em>Lean</em><strong>${inr(p.lean)}</strong></div>
            <div class="mid"><em>Typical</em><strong>${inr(p.typical)}</strong></div>
            <div><em>Comfy</em><strong>${inr(p.comfy)}</strong></div>
          </div>
          <p class="plan-note">${escapeHtml(p.note)}. Fares are estimates and vary with time and traffic.</p>
        </div>
      </details>`;
  }

  /**
   * Appends a place card element into #placesGrid
   */
  function renderPlaceCard(place, isCommunity = false) {
    if (!placesGrid) return;

    normalizePlaceCoords(place);
    const origin = getActiveOrigin();
    // Always use road-km (not straight-line) so Rapido / bus / auto match real travel distance.
    const distKm = placeRoadKmFromOrigin(origin, place);
    const transit = getTransitEstimates(distKm, place.id);

    // Budget bracket
    let budgetBracket = 'under-100';
    if (place.minBudget >= 500) budgetBracket = '500-1000';
    else if (place.minBudget >= 300) budgetBracket = '300-500';
    else if (place.minBudget >= 100) budgetBracket = '100-300';

    const card = document.createElement('article');
    card.className = 'place-card';
    card.setAttribute('data-id', place.id);
    card.setAttribute('data-category', place.category);
    if (place.timeOfDay) card.setAttribute('data-time', place.timeOfDay);
    if (Array.isArray(place.vibes)) card.setAttribute('data-vibes', place.vibes.join(','));
    else if (place.vibes) card.setAttribute('data-vibes', String(place.vibes));
    card.setAttribute('data-budget', budgetBracket);
    card.setAttribute('data-min', String(place.minBudget ?? 0));
    card.setAttribute('data-max', String(place.maxBudget ?? 0));
    card.setAttribute('data-lat', Number.isFinite(Number(place.lat)) ? String(place.lat) : '');
    card.setAttribute('data-lng', Number.isFinite(Number(place.lng)) ? String(place.lng) : '');
    card.setAttribute('data-rating', (place.rating || 4.8).toString());
    card.setAttribute('data-name', place.name);
    card.setAttribute('data-distance', String(distKm));
    card.setAttribute('data-rapido', String(transit.rapidoCostNum || 0));

    // Category label
    const catLabels = {
      food: 'Cafes & Restaurants',
      nature: 'Parks & Nature',
      attractions: 'Tourist Attractions',
      entertainment: 'Entertainment',
      getaways: 'Weekend Getaways',
      hotels: 'Recommended Hotels',
      custom: place.categoryLabel || 'Custom'
    };
    if (place.isHotel || place.category === 'hotels') card.classList.add('is-hotel');

    const imageHtml = place.image
      ? `<img src="${place.image}" alt="${escapeHtml(place.name)}" class="place-img" loading="lazy" />`
      : `<div class="place-media-empty"><strong>No photo yet</strong><small>We only show a picture when you upload one or we can match the real place.</small></div>`;

    card.innerHTML = `
      <div class="place-media">
        <div class="place-media-tags">
          ${place.recommendedByAdmin || place.isHotel ? `<span class="community-badge" style="background:linear-gradient(135deg,#F59E0B,#D97706)">🏨 Admin pick</span>` : (isCommunity ? `<span class="community-badge">🎓 Student Shared</span>` : '')}
          <span class="card-distance-tag"><span class="dist-icon">📍</span> <strong class="card-top-dist">${distText(distKm)}</strong> away</span>
        </div>
        ${imageHtml}
        ${place.photoCredit && place.photoCredit.author ? `<span class="photo-credit-chip" title="Photo: ${escapeHtml(place.photoCredit.author)} · ${escapeHtml(place.photoCredit.license || '')} · ${place.photoCredit.origin === 'google' ? 'Google Maps' : 'Wikimedia Commons'}">📷 ${escapeHtml(place.photoCredit.license || 'Wikimedia')}</span>` : ''}
        <span class="place-category-badge">${escapeHtml(place.detailedCategoryLabel || place.categoryLabel || catLabels[place.category] || 'Student Spot')}</span>
      </div>
      <div class="place-body">
        <div class="place-location-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>${escapeHtml(place.location)}</span>
        </div>
        <h3 class="place-name">${escapeHtml(place.name)}</h3>
        <p class="place-desc">${escapeHtml(place.description)}</p>
        ${place.famousFor ? `<p class="place-famous"><span>⭐ Famous for</span> ${escapeHtml(place.famousFor)}</p>` : ''}
        
        <div class="place-meta-grid">
          <div class="meta-item">
            <span class="meta-label">Est. Budget / Person</span>
            <span class="meta-value font-highlight">₹${place.minBudget} – ₹${place.maxBudget}</span>
          </div>
          <div class="meta-item text-right">
            <span class="meta-label">Reviews &amp; Rating</span>
            <button type="button" class="place-rating-pill open-reviews-btn" data-place-id="${place.id}" title="Read student reviews">
              <span class="star-icon">★</span>
              <span class="rating-val">${(place.rating || 4.8).toFixed(1)}</span>
              <span class="reviews-count-tag">(Reviews)</span>
            </button>
          </div>
        </div>

        <div class="transit-info-box">
          <div class="transit-distance-header">
            <span class="transit-dist-badge"><span class="loc-icon">📍</span> <strong class="place-dist-val">${distText(distKm)}</strong> from <span class="user-loc-name">${origin.name}</span></span>
            <span class="transit-tag-pill">Transit options</span>
          </div>
          <div class="transit-options-grid">
            <div class="transit-option-item">
              <span class="transit-mode-name">${transit.rapidoLabel}</span>
              <span class="transit-fare rapido-fare">${transit.rapidoFare}</span>
              <span class="transit-sub">${transit.rapidoSub}</span>
            </div>
            <div class="transit-option-item">
              <span class="transit-mode-name">${transit.uberLabel}</span>
              <span class="transit-fare uber-fare">${transit.uberFare}</span>
              <span class="transit-sub">${transit.uberSub}</span>
            </div>
            <div class="transit-option-item highlight-metro">
              <span class="transit-mode-name">🚇 Public Transit</span>
              <span class="transit-fare metro-fare">${transit.metroFare}</span>
              <span class="transit-sub">${transit.metroSub}</span>
            </div>
          </div>
          <div class="nearest-stop-row">
            <span class="stop-icon">🚉</span>
            <span class="nearest-stop-text">Nearest Stop: <strong>${escapeHtml(place.metro)}</strong></span>
          </div>
        </div>

        ${tripPlanHtml(place)}

        <div class="place-footer">
          <button type="button" class="btn btn-primary btn-sm get-directions-btn" data-place-id="${place.id}" title="Open Google Maps directions">
            <span class="btn-icon">🗺️</span> Directions
          </button>
          <button type="button" class="btn btn-outline btn-sm view-details-btn" data-place-id="${place.id}">Reviews &amp; Info</button>
          <button type="button" class="btn btn-verify-visit btn-sm verify-visit-btn" data-place-id="${place.id}" title="Verify that you are at this destination">✓ Verify visit</button>
          <button type="button" class="btn btn-secondary btn-sm log-expense-btn" data-place-id="${place.id}" title="Record your trip expenses">Log Expenses</button>
          <button type="button" class="btn-icon-round fav-btn" data-place-id="${place.id}" title="Save to favourites" aria-label="Favourite">♥</button>
          <button type="button" class="btn-icon-round wa-share-btn" data-place-id="${place.id}" title="Share plan on WhatsApp" aria-label="WhatsApp">↗</button>
        </div>
      </div>
    `;

    // Wire newly rendered card buttons
    wirePlaceCardButtons(card, place.id);
    if (typeof wireEngagementButtons === 'function') wireEngagementButtons(card);

    paintFares(card, roadKmFromStraight(distKm), place.id, origin.name);
    placesGrid.appendChild(card);
  }

  function wirePlaceCardButtons(card, placeId) {
    // 1. Directions Button
    const dirBtn = card.querySelector('.get-directions-btn');
    if (dirBtn) {
      dirBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const place = PLACES_DATA[placeId];
        if (!place) return;
        const origin = getActiveOrigin();
        const url = getGoogleMapsDirectionsUrl(origin, place.name, place.lat, place.lng, 'transit', place);
        trackPlace(placeId, 'directions');
        window.open(url, '_blank');
        showToast(`Opening Google Maps directions to ${place.name}...`);
      });
    }

    // Verify a real-world visit only after an explicit tap and a fresh location permission.
    const verifyBtn = card.querySelector('.verify-visit-btn');
    verifyBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      verifyVisit(placeId, verifyBtn);
    });

    // 2. View Details & Reviews button
    const detailsBtn = card.querySelector('.view-details-btn');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => openPlaceDetails(placeId, false));
    }

    // 3. Open Reviews directly button
    const reviewsBtn = card.querySelector('.open-reviews-btn');
    if (reviewsBtn) {
      reviewsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPlaceDetails(placeId, true);
      });
    }

    // 4. Log Expenses Button
    const logBtn = card.querySelector('.log-expense-btn');
    if (logBtn) {
      logBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const place = PLACES_DATA[placeId];
        if (expensePlaceSelect && place) {
          // If option doesn't exist, create it
          let found = false;
          for (let i = 0; i < expensePlaceSelect.options.length; i++) {
            if (expensePlaceSelect.options[i].text.includes(place.name)) {
              expensePlaceSelect.selectedIndex = i;
              found = true;
              break;
            }
          }
          if (!found) {
            const opt = document.createElement('option');
            opt.value = place.name;
            opt.textContent = place.name;
            expensePlaceSelect.insertBefore(opt, expensePlaceSelect.firstChild);
            expensePlaceSelect.selectedIndex = 0;
          }
        }
        document.getElementById('expense-diary')?.scrollIntoView({ behavior: 'smooth' });
        showToast(`Selected ${place ? place.name : 'this spot'} in your Expense Diary!`);
      });
    }
  }

  // Wire "Use My Current Location" inside Community Upload Place Modal
  if (newPlaceCurrentLocBtn) {
    newPlaceCurrentLocBtn.addEventListener('click', async () => {
      if (newPlaceGpsBtnText) newPlaceGpsBtnText.textContent = "Acquiring GPS...";
      newPlaceCurrentLocBtn.classList.add('active');

      async function setAddSpotCoords(lat, lng, exact = true) {
        if (newPlaceLat) newPlaceLat.value = lat.toFixed(5);
        if (newPlaceLng) newPlaceLng.value = lng.toFixed(5);
        currentState.locExact = !!exact; // only a real GPS fix counts as the exact spot

        if (newPlaceLocFeedback) {
          newPlaceLocFeedback.style.display = 'block';
          newPlaceLocFeedback.innerHTML = `📍 Live GPS locked: (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }
        if (newPlaceGpsBtnText) newPlaceGpsBtnText.textContent = "✓ GPS Locked";

        // Reverse-geocode to get friendly street / area address
        try {
          const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data.formattedAddress && newPlaceArea) {
              newPlaceArea.value = data.formattedAddress;
            }
            showPinMap('newPlaceMapPreview', lat, lng);
          }
        } catch (e) {
          console.warn('Reverse geocode error:', e);
        }

        showToast('📍 Spot location locked! Now tell us what this place is famous for.');
        const famousInput = document.getElementById('newPlaceFamous');
        const famousHint = document.getElementById('famousHint');
        if (famousHint) famousHint.style.display = 'block';
        if (famousInput) { famousInput.focus(); document.getElementById('famousBox')?.classList.add('needs-attention'); }
        // Refresh live budget / ways-to-go prediction once coords are known
        if (typeof scheduleLiveEstimate === 'function') scheduleLiveEstimate();
        else if (typeof refreshLiveEstimate === 'function') refreshLiveEstimate();
      }

      const fresh = await acquireFreshCoords();
      if (fresh) {
        currentState.liveCoords = { lat: fresh.lat, lng: fresh.lng };
        await setAddSpotCoords(fresh.lat, fresh.lng, !fresh.approximate);
        showPinMap('newPlaceMapPreview', fresh.lat, fresh.lng);
        if (newPlaceLocFeedback) newPlaceLocFeedback.textContent = `${fresh.source}: ${newPlaceLocFeedback.textContent || ''}`.trim();
        return;
      }

      if (!navigator.geolocation) {
        try {
          const res = await fetch('/api/maps/ip-location');
          const data = await res.json();
          if (data && data.latitude && data.longitude) {
            await setAddSpotCoords(data.latitude, data.longitude, false);
            return;
          }
        } catch (e) {}
        showToast('GPS unavailable. Please type the locality name manually.');
        currentState.photoAsked = false; currentState.categoryTouched = false; currentState.locExact = false;
        { const ab = document.getElementById('photoAskBox'); if (ab) ab.style.display = 'none'; }
        currentState.photoChoice = 'none';
        currentState.newPlaceSelectedPhotoUrl = '';
        autoInfo = null;
        resetAutoFillUi();
        if (photoPreviewBox) photoPreviewBox.style.display = 'none';
        presetCoverChips.forEach(c => c.classList.remove('active'));
        const pinFrame = document.getElementById('newPlaceMapPreview');
        if (pinFrame) pinFrame.hidden = true;
        if (newPlaceGpsBtnText) newPlaceGpsBtnText.textContent = 'Use current location';
        newPlaceCurrentLocBtn.classList.remove('active');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await setAddSpotCoords(position.coords.latitude, position.coords.longitude);
        },
        async (error) => {
          console.warn('Spot upload GPS error:', error);
          try {
            const res = await fetch('/api/maps/ip-location');
            const data = await res.json();
            if (data && data.latitude && data.longitude) {
              await setAddSpotCoords(data.latitude, data.longitude, false);
              return;
            }
          } catch (e) {}
          currentState.photoAsked = false; currentState.categoryTouched = false; currentState.locExact = false;
        { const ab = document.getElementById('photoAskBox'); if (ab) ab.style.display = 'none'; }
        currentState.photoChoice = 'none';
        currentState.newPlaceSelectedPhotoUrl = '';
        autoInfo = null;
        resetAutoFillUi();
        if (photoPreviewBox) photoPreviewBox.style.display = 'none';
        presetCoverChips.forEach(c => c.classList.remove('active'));
        const pinFrame = document.getElementById('newPlaceMapPreview');
        if (pinFrame) pinFrame.hidden = true;
        if (newPlaceGpsBtnText) newPlaceGpsBtnText.textContent = 'Use current location';
          newPlaceCurrentLocBtn.classList.remove('active');
          showToast('Could not acquire GPS. Please enter the area name.');
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    });
  }

  // Custom category toggle + budget suggestions by category
  const newPlaceCategorySel = document.getElementById('newPlaceCategory');
  const newPlaceCustomCategory = document.getElementById('newPlaceCustomCategory');
  const BUDGET_SUGGESTIONS = {
    food: [
      { label: '☕ Coffee / snack ₹60–120', min: 60, max: 120 },
      { label: '🍽️ Meal ₹120–250', min: 120, max: 250 },
      { label: '🥂 Cafe hangout ₹200–400', min: 200, max: 400 },
      { label: 'Not sure — skip max', min: 100, max: '' },
    ],
    nature: [
      { label: 'Free / picnic ₹0–50', min: 0, max: 50 },
      { label: 'Snacks + entry ₹50–150', min: 50, max: 150 },
    ],
    attractions: [
      { label: 'Ticket only ₹30–150', min: 30, max: 150 },
      { label: 'Ticket + food ₹150–350', min: 150, max: 350 },
    ],
    entertainment: [
      { label: 'Activity ₹150–400', min: 150, max: 400 },
      { label: 'Movie / game ₹200–500', min: 200, max: 500 },
    ],
    getaways: [
      { label: 'Day trip ₹300–800', min: 300, max: 800 },
      { label: 'Overnight ₹800–2000', min: 800, max: 2000 },
    ],
    custom: [
      { label: 'Light ₹50–150', min: 50, max: 150 },
      { label: 'Moderate ₹150–400', min: 150, max: 400 },
      { label: 'Not sure — skip max', min: 100, max: '' },
    ],
  };
  const budgetSuggestChips = document.getElementById('budgetSuggestChips');
  const budgetSuggestHint = document.getElementById('budgetSuggestHint');
  function renderBudgetSuggestions(cat) {
    if (!budgetSuggestChips) return;
    const list = BUDGET_SUGGESTIONS[cat] || BUDGET_SUGGESTIONS.custom;
    if (budgetSuggestHint) {
      budgetSuggestHint.textContent = cat === 'food'
        ? 'Restaurants don’t have a fixed max bill — pick a typical student range or leave max empty.'
        : 'These are soft estimates. Leave max blank if you’re not sure.';
    }
    budgetSuggestChips.innerHTML = list.map((s, i) =>
      `<button type="button" class="budget-suggest-chip" data-min="${s.min}" data-max="${s.max}" data-i="${i}">${s.label}</button>`
    ).join('');
    budgetSuggestChips.querySelectorAll('.budget-suggest-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        budgetSuggestChips.querySelectorAll('.budget-suggest-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const minEl = document.getElementById('newPlaceMinBudget');
        const maxEl = document.getElementById('newPlaceMaxBudget');
        if (minEl) minEl.value = chip.dataset.min;
        if (maxEl) maxEl.value = chip.dataset.max === '' ? '' : chip.dataset.max;
        if (typeof scheduleLiveEstimate === 'function') scheduleLiveEstimate();
      });
    });
  }
  renderBudgetSuggestions('food');

  if (newPlaceCategorySel && newPlaceCustomCategory) {
    newPlaceCategorySel.addEventListener('change', () => {
      const isCustom = newPlaceCategorySel.value === 'custom';
      newPlaceCustomCategory.style.display = isCustom ? 'block' : 'none';
      newPlaceCustomCategory.required = false;
      if (isCustom) {
        newPlaceCustomCategory.focus();
      } else {
        newPlaceCustomCategory.value = '';
      }
      renderBudgetSuggestions(newPlaceCategorySel.value || 'food');
    });
  }

  // Live estimate panel: recalculate expected charges & ways when form fields change
  const liveEstimatePanel = document.getElementById('liveEstimatePanel');
  let estimateTimer = null;
  async function refreshLiveEstimate() {
    if (!liveEstimatePanel) return;
    const lat = parseFloat(document.getElementById('newPlaceLat')?.value);
    const lng = parseFloat(document.getElementById('newPlaceLng')?.value);
    const minBudget = parseFloat(document.getElementById('newPlaceMinBudget')?.value);
    const maxBudget = parseFloat(document.getElementById('newPlaceMaxBudget')?.value);
    const entryFee = parseFloat(document.getElementById('newPlaceEntryFee')?.value) || 0;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(minBudget)) {
      liveEstimatePanel.classList.remove('visible');
      return;
    }
    try {
      const origin = (typeof getActiveOrigin === 'function') ? getActiveOrigin() : null;
      const data = await api('/api/places/estimate', {
        method: 'POST',
        body: {
          lat, lng, minBudget, maxBudget: Number.isFinite(maxBudget) ? maxBudget : minBudget, entryFee,
          origin: origin ? { lat: origin.lat, lng: origin.lng, name: origin.name } : null
        }
      });
      const est = data.estimate;
      if (!est) return;
      const waysList = document.getElementById('lepWaysList');
      if (waysList && Array.isArray(est.ways)) {
        waysList.innerHTML = est.ways.slice(0, 4).map(w =>
          `<li><span>${w.icon || ''} ${escapeHtml(w.mode)} <small style="color:#64748B">(${escapeHtml(w.time)})</small></span><span>₹${w.fare}</span></li>`
        ).join('');
      }
      const p = est.prediction || {};
      const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v != null ? `₹${v}` : '—'; };
      setTxt('lepLean', p.lean);
      setTxt('lepTypical', p.typical);
      setTxt('lepComfy', p.comfy);
      const note = document.getElementById('lepNote');
      if (note) note.textContent = `${est.distanceKm} km from ${est.origin || 'your location'} · ${p.note || 'Per person, round trip + entry + spending'}`;
      liveEstimatePanel.classList.add('visible');
    } catch (err) {
      console.warn('Estimate preview failed:', err.message);
    }
  }
  function scheduleLiveEstimate() {
    clearTimeout(estimateTimer);
    estimateTimer = setTimeout(refreshLiveEstimate, 450);
  }
  ['newPlaceLat', 'newPlaceLng', 'newPlaceMinBudget', 'newPlaceMaxBudget', 'newPlaceEntryFee', 'newPlaceArea'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', scheduleLiveEstimate);
      el.addEventListener('change', scheduleLiveEstimate);
    }
  });

  // ---- Auto-fill from OpenStreetMap / Wikipedia / Wikimedia Commons (free, no API key) ----
  let autoInfo = null;
  const autoFillBtn = document.getElementById('autoFillBtn');
  const autoFillStatus = document.getElementById('autoFillStatus');
  const autoPhotoChoices = document.getElementById('autoPhotoChoices');
  const autoPhotoCredit = document.getElementById('autoPhotoCredit');

  function setAutoStatus(msg, isError) {
    if (!autoFillStatus) return;
    autoFillStatus.style.display = msg ? 'block' : 'none';
    autoFillStatus.style.color = isError ? '#b91c1c' : '#475569';
    autoFillStatus.textContent = msg || '';
  }
  function resetAutoFillUi() {
    setAutoStatus('');
    if (autoPhotoChoices) autoPhotoChoices.innerHTML = '';
    if (autoPhotoCredit) { autoPhotoCredit.style.display = 'none'; autoPhotoCredit.textContent = ''; }
  }
  function chooseAutoPhoto(photo) {
    currentState.photoChoice = 'auto';
    currentState.newPlaceSelectedPhotoUrl = photo.url;
    if (photoPreviewBox && photoPreviewImg) { photoPreviewImg.src = photo.url; photoPreviewBox.style.display = 'flex'; }
    presetCoverChips.forEach(c => c.classList.remove('active'));
    if (autoPhotoCredit) {
      autoPhotoCredit.style.display = 'block';
      autoPhotoCredit.textContent = `Photo: ${photo.author} · ${photo.license} · Wikimedia Commons`;
    }
  }
  // Runs the free lookup (OpenStreetMap / Wikipedia / Wikimedia Commons) through our backend.
  // silent = true: used automatically when the person skips the photo upload; no button, no prompts.
  async function runAutoFill(silent) {
      if (!isLoggedIn()) { if (!silent) { closeUploadModal(); openAuth('signup', 'Create a free account to use auto-fill.'); } return; }
      const name = (document.getElementById('newPlaceName')?.value || '').trim();
      const area = (document.getElementById('newPlaceArea')?.value || '').trim();
      if (name.length < 2) { if (!silent) setAutoStatus('Type the place name first.', true); return; }
      const lat = parseFloat(newPlaceLat?.value), lng = parseFloat(newPlaceLng?.value);
      const q = new URLSearchParams({ name, address: area ? area + ', Bengaluru' : 'Bengaluru' });
      if (!isNaN(lat) && !isNaN(lng)) { q.set('lat', lat); q.set('lng', lng); }
      if (autoFillBtn) autoFillBtn.disabled = true;
      if (!silent) setAutoStatus('Looking up OpenStreetMap, Wikipedia and Wikimedia Commons… this can take a few seconds.');
      try {
        const d = await api('/api/places/discover?' + q.toString());
        autoInfo = d;
        currentState.locExact = Boolean(d.found && d.match && d.lat != null && d.lng != null);
        if (d.lat != null && d.lng != null && newPlaceLat && newPlaceLng && (isNaN(lat) || d.found)) {
          newPlaceLat.value = Number(d.lat).toFixed(5); newPlaceLng.value = Number(d.lng).toFixed(5);
          showPinMap('newPlaceMapPreview', d.lat, d.lng);
        }
        const descEl = document.getElementById('newPlaceDescription');
        if (descEl && !descEl.value.trim() && d.description) descEl.value = d.description;
        const catSel = document.getElementById('newPlaceCategory');
        let catNote = 'Category not detected — please choose one.';
        if (catSel && d.category && d.category.confidence !== 'none' && !(silent && currentState.categoryTouched)) {
          if (d.explorerBucket === 'custom') {
            catSel.value = 'custom';
            if (newPlaceCustomCategory) { newPlaceCustomCategory.style.display = ''; newPlaceCustomCategory.value = d.explorerBucketLabel || d.categoryLabel; }
          } else if (d.explorerBucket) {
            catSel.value = d.explorerBucket;
            if (newPlaceCustomCategory) newPlaceCustomCategory.style.display = 'none';
          }
          catNote = `Category suggested: ${d.categoryLabel} (${d.category.reason}). You can change it.`;
        }
        if (autoPhotoChoices && !silent) {
          autoPhotoChoices.innerHTML = '';
          (d.photos || []).forEach(p => {
            const b = document.createElement('button');
            b.type = 'button'; b.title = `${p.title} — ${p.author}, ${p.license}`;
            b.style.cssText = 'padding:0;border:2px solid transparent;border-radius:6px;overflow:hidden;cursor:pointer;background:none';
            b.innerHTML = `<img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.title)}" style="width:96px;height:64px;object-fit:cover;display:block" loading="lazy" />`;
            b.addEventListener('click', () => chooseAutoPhoto(p));
            autoPhotoChoices.appendChild(b);
          });
        }
        // Never replace a photo the person uploaded or picked by hand.
        if (currentState.photoChoice === 'none' || currentState.photoChoice === 'auto') {
          const best = (d.photos || []).find(p => p.url === d.selectedPhotoUrl);
          if (best) chooseAutoPhoto(best);
        }
        const photoNote = (d.photos || []).length ? 'Pick a photo below or upload your own.' : 'No free photo clearly showing this place was found — you can upload one.';
        if (!silent) setAutoStatus((d.found ? 'Found on OpenStreetMap. ' : 'Not found on OpenStreetMap, so nothing was guessed. ') + catNote + ' ' + photoNote);
      } catch (err) {
        if (!silent) setAutoStatus(err.message || 'Auto-fill failed. You can fill the form by hand.', true);
      } finally {
        if (autoFillBtn) autoFillBtn.disabled = false;
      }
  }
  if (autoFillBtn) autoFillBtn.addEventListener('click', () => runAutoFill(false));

  document.getElementById('newPlaceCategory')?.addEventListener('change', () => { currentState.categoryTouched = true; });

  // ---- Photo prompt: ask for an upload first; if skipped, auto-fill runs in the backend ----
  const photoAskBox = document.getElementById('photoAskBox');
  function hasChosenPhoto() { return currentState.photoChoice !== 'none' && !!currentState.newPlaceSelectedPhotoUrl; }
  document.getElementById('photoAskUploadBtn')?.addEventListener('click', () => {
    if (photoAskBox) photoAskBox.style.display = 'none';
    document.getElementById('photoDropzone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    newPlacePhotoFile?.click();
  });
  document.getElementById('photoAskSkipBtn')?.addEventListener('click', () => {
    if (photoAskBox) photoAskBox.style.display = 'none';
    currentState.photoAsked = true;
    uploadPlaceForm.requestSubmit();
  });


  // After publishing, the server adds the photo / exact spot in the background: pick those up when ready.
  function refreshPlaceLater(placeId, enriching) {
    if (!enriching) return;
    [5000, 14000, 30000].forEach((delay, i) => setTimeout(async () => {
      try {
        const cur = PLACES_DATA[placeId];
        if (!cur || (i > 0 && cur.image)) return;
        const data = await api('/api/places');
        const fresh = (data.places || []).find(p => p.id === placeId);
        if (!fresh) return;
        const moved = fresh.lat !== cur.lat || fresh.lng !== cur.lng;
        if (fresh.image !== cur.image || moved) {
          fresh._db = true;
          applyPlaceToPage(fresh);
          if (moved) updateCardsDistanceAndTransit();
        }
      } catch { /* try again next time */ }
    }, delay));
  }

  // Handle New Place Form Submission (saved on the server, visible to all users)
  if (uploadPlaceForm) {
    uploadPlaceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isLoggedIn()) {
        closeUploadModal();
        openAuth('signup', 'Create a free account to add a place. If you already signed up, switch to Log In.');
        return;
      }
      const val = id => (document.getElementById(id)?.value || '').trim();
      if (!hasChosenPhoto() && !currentState.photoAsked) {
        if (photoAskBox) { photoAskBox.style.display = 'block'; photoAskBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }
      const submitBtn = document.getElementById('submitNewPlaceBtn');
      const submitText = document.getElementById('submitNewPlaceText');
      const area = val('newPlaceArea');

      let lat = parseFloat(newPlaceLat?.value), lng = parseFloat(newPlaceLng?.value);
      if (submitBtn) submitBtn.disabled = true;
      if (submitText) submitText.textContent = 'Publishing…';
      try {
        // Publishing sends everything in ONE request. The server pins the exact spot and finds a photo
        // (instantly with Google Maps, otherwise in the background), so there is nothing slow to wait for here.
        let image = '';
        if ((currentState.photoChoice === 'upload' || currentState.photoChoice === 'preset' || currentState.photoChoice === 'auto') && currentState.newPlaceSelectedPhotoUrl) {
          image = currentState.newPlaceSelectedPhotoUrl;
        }
        const origin = getActiveOrigin();
        const data = await api('/api/places', {
          method: 'POST',
          body: {
            name: val('newPlaceName'), category: val('newPlaceCategory'), customCategory: val('newPlaceCustomCategory'),
            area, lat, lng, metro: val('newPlaceMetro'), famousFor: val('newPlaceFamous'),
            minBudget: val('newPlaceMinBudget'), maxBudget: val('newPlaceMaxBudget'), entryFee: val('newPlaceEntryFee'),
            bestTime: val('newPlaceBestTime'), description: val('newPlaceDescription'), tip: val('newPlaceTip'),
            rating: val('newPlaceInitialRating'), image,
            // Only trust coordinates from a confirmed GPS fix, a matching place lookup,
            // or a named-venue pin. A stale auto-fill result must never override a new address.
            locationPrecision: currentState.locExact ? 'exact' : 'area',
            ...(autoInfo && autoInfo.match ? { osmType: autoInfo.match.osmType, osmId: autoInfo.match.osmId, osmTags: autoInfo.match.tags } : {}),
            ...(autoInfo ? { detailedCategory: autoInfo.category && autoInfo.category.category, descriptionSource: autoInfo.descriptionSource } : {}),
            origin: { lat: origin.lat, lng: origin.lng, name: origin.name }
          }
        });
        const place = data.place;
        place._db = true;
        PLACES_DATA[place.id] = place;
        PLACES_STOPS[place.id] = place.metro;
        populateTripPlanOptions();
        renderPlaceCard(place, true);
        updateCardsDistanceAndTransit();
        refreshPlaceLater(place.id, data.enriching);
        if (typeof refreshExpensePlaceOptions === 'function') refreshExpensePlaceOptions();
        // Auto-select the newly added place in Log a New Outing
        if (expensePlaceSelect) {
          const opt = [...expensePlaceSelect.options].find(o => o.value === place.name);
          if (opt) expensePlaceSelect.value = place.name;
        }

        uploadPlaceForm.reset();
        if (newPlaceCustomCategory) newPlaceCustomCategory.style.display = 'none';
        if (newPlaceLat) newPlaceLat.value = '';
        if (newPlaceLng) newPlaceLng.value = '';
        const hint = document.getElementById('famousHint'); if (hint) hint.style.display = 'none';
        if (newPlaceLocFeedback) newPlaceLocFeedback.style.display = 'none';
        currentState.photoAsked = false; currentState.categoryTouched = false; currentState.locExact = false;
        { const ab = document.getElementById('photoAskBox'); if (ab) ab.style.display = 'none'; }
        currentState.photoChoice = 'none';
        currentState.newPlaceSelectedPhotoUrl = '';
        autoInfo = null;
        resetAutoFillUi();
        if (photoPreviewBox) photoPreviewBox.style.display = 'none';
        presetCoverChips.forEach(c => c.classList.remove('active'));
        const pinFrame = document.getElementById('newPlaceMapPreview');
        if (pinFrame) pinFrame.hidden = true;
        if (newPlaceGpsBtnText) newPlaceGpsBtnText.textContent = 'Use current location';
        if (newPlaceCurrentLocBtn) newPlaceCurrentLocBtn.classList.remove('active');
        if (liveEstimatePanel) liveEstimatePanel.classList.remove('visible');
        closeUploadModal();

        const p = place.estimate.prediction;
        showToast(data.pending ? `📨 "${place.name}" was sent for admin review. Only you can see it until it is approved.` : `🎉 "${place.name}" is live for everyone! Predicted budget: ₹${p.lean} – ₹${p.comfy} per person.`);
        setTimeout(() => {
          const card = document.querySelector(`.place-card[data-id="${place.id}"]`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.querySelector('details.trip-plan')?.setAttribute('open', '');
            card.style.outline = '3px solid var(--color-teal)';
            setTimeout(() => { card.style.outline = ''; }, 2500);
          }
        }, 300);
      } catch (err) {
        showToast(err.message);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Publish Place to Student Explorer';
      }
    });
  }

  // Small multi-stop planner: totals the published per-person budgets for 2–3 stops.
  const TRIP_PLAN_KEY = 'se_squad_trip_plan_v1';
  function tripPlanSelects() {
    return [1, 2, 3].map(n => document.getElementById(`tripPlanStop${n}`)).filter(Boolean);
  }
  // A shared plan link (?plan=id1,id2&people=4&cap=300) opens with the same stops already chosen.
  let sharedPlanApplied = false;
  function applySharedPlanFromUrl() {
    if (sharedPlanApplied) return;
    let params;
    try { params = new URLSearchParams(window.location.search); } catch { return; }
    const raw = params.get('plan');
    if (!raw) { sharedPlanApplied = true; return; }
    const ids = raw.split(',').map(x => x.trim()).filter(x => /^[A-Za-z0-9_\-]{1,80}$/.test(x)).slice(0, 3);
    const selects = tripPlanSelects();
    if (!ids.length || !selects.length) { sharedPlanApplied = true; return; }
    const known = ids.filter(id => PLACES_DATA[id]);
    // Community places arrive a moment after the page loads: wait until every stop exists (or the second attempt).
    if (known.length < ids.length && !applySharedPlanFromUrl.retried) { applySharedPlanFromUrl.retried = true; return; }
    sharedPlanApplied = true;
    selects.forEach((sel, i) => { if (known[i]) sel.dataset.restoreId = known[i]; });
    const peopleEl = document.getElementById('tripPlanPeople');
    const people = Number(params.get('people'));
    if (peopleEl && people >= 1 && people <= 25) peopleEl.value = String(Math.round(people));
    const capEl = document.getElementById('tripPlanBudgetLimit');
    const cap = Number(params.get('cap'));
    if (capEl && cap > 0 && cap <= 100000) capEl.value = String(Math.round(cap));
    populateTripPlanOptions();
    try {
      ['plan', 'people', 'cap'].forEach(k => params.delete(k));
      window.history.replaceState({}, '', window.location.pathname + (params.toString() ? '?' + params : '') + window.location.hash);
    } catch { /* ignore */ }
    setTimeout(() => {
      document.getElementById('squadTripPlanner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { showDelight('Your friend’s plan is loaded. Check the budget and tweak it.'); } catch { /* ignore */ }
    }, 500);
  }

  function populateTripPlanOptions() {
    const selects = tripPlanSelects();
    if (!selects.length) return;
    const places = Object.values(PLACES_DATA || {}).filter(p => p && p.id && p.name).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    selects.forEach((select, index) => {
      const previous = select.value;
      const emptyLabel = index === 2 ? 'No third stop' : 'Choose a place';
      select.innerHTML = `<option value="">${emptyLabel}</option>` + places.map(p =>
        `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.location ? ` — ${escapeHtml(p.location)}` : ''}</option>`
      ).join('');
      const restoreId = select.dataset.restoreId;
      if (places.some(p => String(p.id) === previous)) select.value = previous;
      else if (restoreId && places.some(p => String(p.id) === restoreId)) {
        select.value = restoreId;
        delete select.dataset.restoreId;
      }
    });
    updateTripPlanSummary();
  }
  function selectedTripStops() {
    const ids = tripPlanSelects().map(s => s.value).filter(Boolean);
    return [...new Set(ids)].map(id => PLACES_DATA[id]).filter(Boolean).slice(0, 3);
  }
  function tripStopBudget(place) {
    const card = document.querySelector(`.place-card[data-id="${CSS.escape(String(place.id))}"]`);
    const min = Math.max(0, Number(place.minBudget ?? card?.dataset.min ?? 0) || 0);
    const max = Math.max(min, Number(place.maxBudget ?? card?.dataset.max ?? min) || min);
    const entry = Math.max(0, Number(place.entryFee) || 0);
    return { min: min + entry, max: max + entry };
  }
  function tripTransportBudget(stops) {
    let low = 0, high = 0;
    for (let i = 1; i < stops.length; i++) {
      const a = stops[i - 1], b = stops[i];
      if (![a.lat, a.lng, b.lat, b.lng].every(v => Number.isFinite(Number(v)))) continue;
      const straight = calculateDistanceKm(Number(a.lat), Number(a.lng), Number(b.lat), Number(b.lng));
      const road = roadKmFromStraight(straight);
      const quote = computeFares(road, b.id);
      const fares = [quote.bus, quote.rapido, quote.autoShare].map(Number).filter(v => Number.isFinite(v) && v > 0);
      if (fares.length) {
        low += Math.min(...fares);
        high += Math.max(...fares);
      }
    }
    return { low, high };
  }
  function tripTotals(stops) {
    const placeTotals = stops.map(tripStopBudget);
    const placeLow = placeTotals.reduce((sum, item) => sum + item.min, 0);
    const placeHigh = placeTotals.reduce((sum, item) => sum + item.max, 0);
    const travel = tripTransportBudget(stops);
    return { placeTotals, placeLow, placeHigh, travel, low: placeLow + travel.low, high: placeHigh + travel.high };
  }

  /** Cheaper stand-ins for the priciest stop: same kind of place, close by, that bring the plan under the cap. */
  function cheaperSwaps(stops, totals, cap) {
    const idx = totals.placeTotals.map((t, i) => ({ i, t })).sort((a, b) => b.t.min - a.t.min)[0];
    if (!idx) return [];
    const target = stops[idx.i];
    const chosen = new Set(stops.map(p => String(p.id)));
    const need = totals.low - cap;
    return Object.values(PLACES_DATA || {})
      .filter(p => p && p.id && !chosen.has(String(p.id)) && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
      .map(p => {
        const b = tripStopBudget(p);
        const km = calculateDistanceKm(Number(target.lat), Number(target.lng), Number(p.lat), Number(p.lng));
        return { place: p, saves: idx.t.min - b.min, km, sameKind: p.category === target.category };
      })
      .filter(x => x.saves > 0 && x.km <= 8)
      .sort((a, b) => (Number(b.sameKind) - Number(a.sameKind)) || (Math.min(b.saves, need) - Math.min(a.saves, need)) || a.km - b.km)
      .slice(0, 3)
      .map(x => Object.assign(x, { slot: idx.i, fixes: x.saves >= need }));
  }

  function updateTripPlanSummary() {
    const host = document.getElementById('tripPlanSummary');
    if (!host) return;
    const stops = selectedTripStops();
    if (stops.length < 2) {
      host.textContent = 'Choose at least two different stops to calculate your group budget.';
      return;
    }
    const people = Math.max(1, Math.min(25, Number(document.getElementById('tripPlanPeople')?.value) || 4));
    const cap = Math.max(0, Math.round(Number(document.getElementById('tripPlanBudgetLimit')?.value) || 0));
    const t = tripTotals(stops);
    const money = n => '₹' + Math.round(n).toLocaleString('en-IN');
    let html = `<strong>${stops.length} stops:</strong> ${stops.map(p => escapeHtml(p.name)).join(' → ')}<br>
      <strong>Places + entry per person:</strong> ${money(t.placeLow)}–${money(t.placeHigh)}<br>
      <strong>Between-stop travel estimate:</strong> ${money(t.travel.low)}–${money(t.travel.high)}<br>
      <strong>Total per person:</strong> ${money(t.low)}–${money(t.high)}<br>
      <strong>Group total (${people} people):</strong> ${money(t.low * people)}–${money(t.high * people)}`;
    if (cap > 0) {
      const pct = (n) => Math.min(100, Math.round((n / cap) * 100));
      let tone, headline;
      if (t.high <= cap) { tone = 'ok'; headline = `✅ Within your ${money(cap)} cap, even at the high estimate. You keep ${money(cap - t.high)}–${money(cap - t.low)} per person spare.`; }
      else if (t.low <= cap) { tone = 'warn'; headline = `⚠️ Tight. The low estimate fits ${money(cap)} but the high one is ${money(t.high - cap)} over. Share rides and skip paid extras to stay under.`; }
      else { tone = 'bad'; headline = `⛔ Over your ${money(cap)} cap by at least ${money(t.low - cap)} per person (${money((t.low - cap) * people)} for the group).`; }
      html += `<div class="budget-cap-card is-${tone}" role="status">
        <div class="budget-cap-head">${headline}</div>
        <div class="budget-cap-bar" aria-hidden="true"><span class="low" style="width:${pct(t.low)}%"></span><span class="high" style="width:${Math.max(0, pct(t.high) - pct(t.low))}%"></span></div>
        <div class="budget-cap-legend">Cap ${money(cap)} per person · group cap ${money(cap * people)} · ${t.high <= cap ? 'all good' : t.low > cap ? `needs ${money(t.low - cap)}–${money(t.high - cap)} more per person` : `${pct(t.low)}–${pct(t.high)}% of cap used`}</div>`;
      if (t.low > cap) {
        const swaps = cheaperSwaps(stops, t, cap);
        if (swaps.length) {
          html += `<div class="budget-cap-swaps"><span>Cheaper swaps:</span>${swaps.map(x => `<button type="button" class="budget-swap-btn" data-slot="${x.slot}" data-id="${escapeHtml(String(x.place.id))}">Swap stop ${x.slot + 1} → ${escapeHtml(x.place.name)} (saves ${money(x.saves)}${x.fixes ? ', fits cap' : ''})</button>`).join('')}</div>`;
        } else {
          html += `<div class="budget-cap-swaps"><span>Try fewer stops, go on foot or metro between nearby stops, or raise the cap.</span></div>`;
        }
      } else if (t.placeLow > 0) {
        const perStop = t.placeTotals.map((x, i) => `${escapeHtml(stops[i].name)}: ${money(x.max)}`).join(' · ');
        html += `<div class="budget-cap-legend">Spend guide (max per stop): ${perStop}</div>`;
      }
      html += '</div>';
    } else {
      html += '<br><small>Tip: enter a budget cap per person above to see if this plan fits and get cheaper swaps.</small>';
    }
    html += '<br><small>Transport uses approximate BMTC / Rapido / shared-auto fares between stops; confirm live fares before leaving.</small>';
    host.innerHTML = html;
    host.querySelectorAll('.budget-swap-btn').forEach(btn => btn.addEventListener('click', () => {
      const sel = tripPlanSelects()[Number(btn.dataset.slot)];
      if (sel) { sel.value = btn.dataset.id; updateTripPlanSummary(); showToast('Swapped. Budget recalculated.'); }
    }));
  }
  // ---- Saved trips: never lose a plan, logged in or not --------------------------------------------------------
  // Plans are ALWAYS written to this device first (a list, not a single slot). When the person is logged in they are
  // also sent to the server; plans made while logged out are uploaded automatically the moment they log in.
  const LOCAL_PLANS_KEY = 'se_local_plans_v2';
  const planSig = (p) => (Array.isArray(p.stopIds) ? p.stopIds.join('>') : '') + '|' + (p.people || 0) + '|' + (p.budgetLimit || 0);
  function readLocalPlans() { try { const v = JSON.parse(localStorage.getItem(scopedKey(LOCAL_PLANS_KEY)) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
  function writeLocalPlans(list) { try { localStorage.setItem(scopedKey(LOCAL_PLANS_KEY), JSON.stringify(list.slice(-20))); return true; } catch { return false; } }
  // Plans made while logged out (guest) move into the account that logs in, then the guest copy is removed.
  function adoptGuestPlans() {
    if (!session.user) return;
    try {
      const gk = LOCAL_PLANS_KEY + '::guest';
      const guest = JSON.parse(localStorage.getItem(gk) || '[]');
      if (Array.isArray(guest) && guest.length) {
        const mine = readLocalPlans();
        guest.forEach(g => { if (!mine.some(m => planSig(m) === planSig(g))) mine.push(g); });
        writeLocalPlans(mine);
      }
      localStorage.removeItem(gk);
    } catch { /* ignore */ }
  }
  let syncingPlans = false;
  async function syncLocalPlans(silent) {
    if (syncingPlans || !session.user) return 0;
    adoptGuestPlans();
    const pending = readLocalPlans().filter(p => !p.serverId);
    if (!pending.length) return 0;
    syncingPlans = true;
    let done = 0;
    try {
      for (const plan of pending) {
        try {
          const res = await api('/api/trips', { method: 'POST', body: Object.assign({}, plan, { localId: undefined, serverId: undefined }) });
          const list = readLocalPlans();
          const hit = list.find(x => x.localId === plan.localId);
          if (hit) { hit.serverId = res.trip && res.trip.id; hit.syncedAt = Date.now(); writeLocalPlans(list); }
          done++;
        } catch (err) {
          if (err && err.status === 401) break; // logged out again; try next time
        }
      }
    } finally { syncingPlans = false; }
    if (done) {
      if (!silent) showToast(`✅ ${done} saved plan${done === 1 ? '' : 's'} from this device added to your profile.`);
      window.dispatchEvent(new Event('se-gamification-refresh'));
      refreshSavedTripPlans();
    }
    return done;
  }
  window.addEventListener('se-auth', () => { setTimeout(() => syncLocalPlans(false), 600); });

  async function saveTripPlan() {
    const stops = selectedTripStops();
    if (stops.length < 2) return showToast('Choose at least two stops first.');
    const people = Math.max(1, Math.min(25, Number(document.getElementById('tripPlanPeople')?.value) || 4));
    const plan = {
      type: 'squad_plan',
      people,
      budgetLimit: Math.max(0, Math.round(Number(document.getElementById('tripPlanBudgetLimit')?.value) || 0)),
      stopIds: stops.map(p => p.id),
      place: stops.map(p => p.name).join(' → '),
      savedAt: Date.now(),
    };
    const list = readLocalPlans();
    let entry = list.find(p => planSig(p) === planSig(plan));
    if (!entry) { entry = Object.assign({ localId: 'lp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, plan); list.push(entry); }
    else Object.assign(entry, plan);
    const saved = writeLocalPlans(list);
    try { localStorage.setItem(scopedKey(TRIP_PLAN_KEY), JSON.stringify(plan)); } catch { /* private mode */ }
    if (!session.user) {
      refreshSavedTripPlans();
      showToast(saved ? '💾 Saved on THIS device only. Log in and it moves to your profile automatically.' : 'Could not save on this device (private mode?). Log in to keep it.');
      if (!isLoggedIn()) setTimeout(() => openAuth('login', 'Log in to keep your trip plan on every device. Your saved plan will be added automatically.'), 700);
      return;
    }
    if (entry.serverId) { showToast('✅ This plan is already in your profile.'); refreshSavedTripPlans(); return; }
    try {
      const res = await api('/api/trips', { method: 'POST', body: plan });
      entry.serverId = res.trip && res.trip.id; entry.syncedAt = Date.now();
      writeLocalPlans(list);
      showToast('✅ Trip plan saved to your profile.');
      window.dispatchEvent(new Event('se-gamification-refresh'));
    } catch (err) {
      showToast((err && err.network ? 'No connection. ' : '') + 'Saved on this device — it will upload automatically when you are back online and logged in.');
    }
    refreshSavedTripPlans();
  }

  window.__seRefreshPlans = () => refreshSavedTripPlans();
  async function refreshSavedTripPlans() {
    const list = document.getElementById('profileSavedPlansList');
    if (!list) return;
    const localOnly = readLocalPlans().filter(p => !p.serverId);
    let plans = [];
    if (session.user) {
      list.innerHTML = '<p class="profile-saved-empty">Loading…</p>';
      try {
        const data = await api('/api/trips');
        plans = (data.trips || []).filter(t => t && (t.type === 'squad_plan' || Array.isArray(t.stopIds)));
      } catch (err) {
        if (!(err && err.status === 401)) {
          list.innerHTML = '<p class="profile-saved-empty">Could not reach the server. Your plans are safe — <button type="button" class="se-dym-btn" id="retryPlansBtn">try again</button>.</p>';
          document.getElementById('retryPlansBtn')?.addEventListener('click', refreshSavedTripPlans);
          return;
        }
      }
    }
    const banner = !session.user
      ? `<p class="profile-saved-empty" style="margin-bottom:.5rem">🔐 Not logged in — these plans live on this device only. <button type="button" class="se-dym-btn" id="plansLoginBtn">Log in to keep them</button></p>` : '';
    if (!plans.length && !localOnly.length) {
      list.innerHTML = banner + '<p class="profile-saved-empty">No saved plans yet. Build one in the Trip planner and hit Save.</p>';
      document.getElementById('plansLoginBtn')?.addEventListener('click', () => openAuth('login', 'Log in to keep your plans.'));
      return;
    }
    const rows = plans.slice(0, 8).map(p => ({ remote: true, p })).concat(localOnly.map(p => ({ remote: false, p })));
    list.innerHTML = banner + rows.slice(0, 12).map(({ remote, p }) => {
      const label = escapeHtml(p.place || (Array.isArray(p.stopIds) ? p.stopIds.join(' → ') : 'Trip plan'));
      const when = p.savedAt || p.date ? new Date(p.savedAt || p.date).toLocaleDateString() : '';
      const people = p.people || p.numPeople || '';
      const pid = remote ? p.id : p.localId;
      const tag = remote ? '' : ' · <b>This device only</b>';
      const right = !remote ? `<button type="button" class="profile-plan-complete" data-sync-plan="${escapeHtml(String(pid))}">Sync now</button>`
        : p.completed ? '<span class="profile-plan-done">✓ Done</span>'
        : `<button type="button" class="profile-plan-complete" data-complete-plan="${escapeHtml(String(pid))}" title="Complete after verifying every stop">Complete</button>`;
      return `<div class="profile-plan-row"><button type="button" class="profile-plan-item" data-plan-id="${escapeHtml(String(pid))}" data-stop-ids="${escapeHtml(JSON.stringify(p.stopIds || []))}" data-people="${people}" data-budget="${Number(p.budgetLimit) || 0}">
          <span class="profile-plan-label">${label}</span>
          <span class="profile-plan-meta">${people ? people + ' ppl · ' : ''}${p.budgetLimit ? '₹' + p.budgetLimit + ' cap · ' : ''}${when}${p.completed ? ' · Completed' : ''}${tag}</span>
        </button>${right}</div>`;
    }).join('');
    document.getElementById('plansLoginBtn')?.addEventListener('click', () => openAuth('login', 'Log in to keep your plans.'));
    loadMySquads();
    list.querySelectorAll('[data-sync-plan]').forEach(btn => btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!session.user) { openAuth('login', 'Log in to sync your plans.'); return; }
      btn.disabled = true; btn.textContent = 'Syncing…';
      const n = await syncLocalPlans(false);
      if (!n) { btn.disabled = false; btn.textContent = 'Sync now'; showToast('Could not sync right now. Try again in a moment.'); }
    }));
    list.querySelectorAll('[data-complete-plan]').forEach(btn => {
      btn.addEventListener('click', async (event) => {
        event.stopPropagation();
        btn.disabled = true; btn.textContent = 'Checking…';
        try {
          const plan = plans.find(p => String(p.id) === String(btn.dataset.completePlan));
          let actualPerPerson = null;
          if (Number(plan?.budgetLimit || 0) > 0) {
            const raw = window.prompt(`Enter the actual spend per person in ₹ (budget cap ₹${Number(plan.budgetLimit).toLocaleString('en-IN')}). Leave blank if you did not track it.`);
            if (raw === null) { btn.disabled = false; btn.textContent = 'Complete'; return; }
            if (raw.trim()) actualPerPerson = Number(raw);
            if (actualPerPerson !== null && (!Number.isFinite(actualPerPerson) || actualPerPerson < 0)) throw new Error('Enter a valid actual spend amount.');
          }
          const res = await api(`/api/trips/${encodeURIComponent(btn.dataset.completePlan)}/complete`, { method: 'POST', body: { actualPerPerson } });
          showToast(res.message || '🎉 Group trip completed!');
          window.dispatchEvent(new Event('se-gamification-refresh'));
          refreshSavedTripPlans();
        } catch (error) { showToast(error.message || 'Verify every stop before completing the trip.'); btn.disabled = false; btn.textContent = 'Complete'; }
      });
    });
    list.querySelectorAll('.profile-plan-item').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const ids = JSON.parse(btn.dataset.stopIds || '[]');
          const peopleEl = document.getElementById('tripPlanPeople');
          if (peopleEl) peopleEl.value = String(Number(btn.dataset.people) || 4);
          const budgetEl = document.getElementById('tripPlanBudgetLimit');
          if (budgetEl) budgetEl.value = Number(btn.dataset.budget) ? String(btn.dataset.budget) : '';
          tripPlanSelects().forEach((sel, i) => {
            const id = ids[i] || '';
            if (id) sel.dataset.restoreId = id;
            sel.value = id;
          });
          populateTripPlanOptions();
          updateTripPlanSummary();
          closeProfileMenu();
          document.getElementById('squadTripPlanner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          showToast('Loaded your saved plan into the planner.');
        } catch { showToast('Could not load that plan.'); }
      });
    });
  }
  // v15: browsers block window.open() once an await has happened, which made Share/Invite silently do nothing.
  // Open the tab immediately on click, fill in the WhatsApp link when the squad code is ready.
  function openShareTab() { try { return window.open('', '_blank'); } catch (_) { return null; } }
  // One safe way to copy text everywhere: modern clipboard first, old-style copy as a fallback; never throws.
  async function copyText(text) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (_) { /* fall through */ }
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'; document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (_) { return false; }
  }

  async function finishShareTab(tab, text) {
    // v17: on phones use the native share sheet (WhatsApp, Telegram, Messages...). Elsewhere open WhatsApp and also copy the text.
    if (navigator.share && window.matchMedia && matchMedia('(pointer: coarse)').matches) {
      try { if (tab && !tab.closed) tab.close(); } catch (_) { /* ignore */ }
      try { await navigator.share({ title: 'Student Explorer', text }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; /* otherwise fall back to WhatsApp below */ }
    }
    copyText(text); // best effort, never throws
    const url = 'https://wa.me/?text=' + encodeURIComponent(text);
    if (tab && !tab.closed) { try { tab.location.href = url; return; } catch (_) { /* fall through */ } }
    window.location.href = url;
  }
  async function shareTripPlan() {
    const stops = selectedTripStops();
    if (stops.length < 2) return showToast('Choose at least two stops first.');
    const tab = openShareTab();
    const people = Math.max(1, Math.min(25, Number(document.getElementById('tripPlanPeople')?.value) || 4));
    const totals = stops.map(tripStopBudget);
    const placeLow = totals.reduce((sum, item) => sum + item.min, 0);
    const placeHigh = totals.reduce((sum, item) => sum + item.max, 0);
    const travel = tripTransportBudget(stops);
    const low = placeLow + travel.low;
    const high = placeHigh + travel.high;
    const money = n => '₹' + Math.round(n).toLocaleString('en-IN');
    const cap = Number(document.getElementById('tripPlanBudgetLimit')?.value) || 0;
    const stopsLine = stops.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    const fitLine = cap > 0
      ? (high <= cap ? `✅ Fits our ₹${Math.round(cap)}/person cap` : low <= cap ? `⚠️ Tight on ₹${Math.round(cap)}/person — possible if we share rides` : `❌ Over ₹${Math.round(cap)}/person — swap a stop?`)
      : '';
    // One link does both: it invites friends to the squad (when you are logged in) AND opens this exact plan for them.
    const planQs = `plan=${encodeURIComponent(stops.map(p => p.id).join(','))}&people=${people}${cap > 0 ? `&cap=${Math.round(cap)}` : ''}`;
    let shareLink = `${window.location.origin}/?${planQs}#squadTripPlanner`;
    if (session.user) {
      try {
        const code = await ensureSquadCode(stops);
        if (code) shareLink = `${window.location.origin}/?squad=${encodeURIComponent(code)}&${planQs}#squadTripPlanner`;
      } catch { /* fall back to the plain plan link */ }
    } else {
      showToast('Tip: log in first and this link will also invite your friends to join your squad.');
    }
    // Clean, exciting message that works even for friends who have never used the app
    const text = [
      '🎒 Weekend plan for the squad',
      '',
      stopsLine,
      '',
      `💸 ~${money(low)}–${money(high)} per person (×${people} = ${money(low * people)}–${money(high * people)} total)`,
      fitLine,
      '',
      'Built on Student Explorer — discover affordable Bengaluru spots, plan in 30s, share with friends.',
      '👉 Tap to join my squad and see this plan:',
      shareLink
    ].filter(Boolean).join('\n');
    finishShareTab(tab, text);
    showToast('Opening WhatsApp with your plan…');
    try { showDelight('Plan shared! 🎉 Your friends will love how clean this looks.'); } catch (_) {}
  }
  tripPlanSelects().forEach(select => select.addEventListener('change', updateTripPlanSummary));
  document.getElementById('tripPlanPeople')?.addEventListener('input', updateTripPlanSummary);
  document.getElementById('tripPlanBudgetLimit')?.addEventListener('input', updateTripPlanSummary);
  ['saveTripPlanBtn', 'shareTripPlanBtn', 'inviteSquadBtn'].forEach(id => document.getElementById(id)?.addEventListener('click', () => {
    window.__planActionAt = Date.now();
    const st = document.getElementById('tripPlanStatus'); if (st) { st.textContent = 'Working…'; st.hidden = false; }
  }, true));
  document.getElementById('saveTripPlanBtn')?.addEventListener('click', saveTripPlan);
  document.getElementById('shareTripPlanBtn')?.addEventListener('click', shareTripPlan);
  try {
    const saved = JSON.parse(localStorage.getItem(scopedKey(TRIP_PLAN_KEY)) || 'null');
    if (saved && Array.isArray(saved.stopIds)) {
      saved.stopIds.slice(0, 3).forEach((id, i) => {
        const select = document.getElementById(`tripPlanStop${i + 1}`);
        if (select) select.dataset.restoreId = String(id);
      });
      const people = document.getElementById('tripPlanPeople');
      if (people && saved.people) people.value = String(saved.people);
      const capEl = document.getElementById('tripPlanBudgetLimit');
      if (capEl && saved.budgetLimit) capEl.value = String(saved.budgetLimit);
    }
  } catch { /* ignore corrupt local plan */ }

  let picksReqId = 0;
  async function loadWeeklyStudentPicks() {
    const host = document.getElementById('weeklyStudentPicksList');
    const noteEl = document.getElementById('weeklyStudentPicksNote');
    if (!host) return;
    const area = (document.getElementById('studentPicksArea')?.value || '').trim();
    const reqId = ++picksReqId;
    if (noteEl) { noteEl.style.display = 'none'; noteEl.textContent = ''; }
    host.textContent = 'Finding this week’s student picks…';
    try {
      const data = await api('/api/student-picks' + (area ? `?area=${encodeURIComponent(area)}` : ''));
      if (reqId !== picksReqId) return; // a newer search already replaced this one
      let picks = data.picks || [];
      let usedFallback = false;
      if (!picks.length && !area) {
        // Nothing reviewed yet this week: show the best-rated places already on the page instead of an empty box.
        picks = Object.values(PLACES_DATA)
          .filter(p => p && p.name && Number.isFinite(Number(p.lat)))
          .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
          .slice(0, 4)
          .map(p => ({ ...p, weeklyScore: 0 }));
        usedFallback = picks.length > 0;
      }
      if (!picks.length) {
        host.textContent = area ? `No places match “${area}” yet.` : 'No community picks yet. Be the first to review a place.';
        return;
      }
      // Make every pick fully usable for ANY visitor (details, map pin, directions) even if the main list has not got it yet.
      picks.forEach(p => {
        p.lat = Number(p.lat); p.lng = Number(p.lng);
        const known = PLACES_DATA[p.id];
        if (!known) {
          p._db = true;
          PLACES_DATA[p.id] = p;
          PLACES_STOPS[p.id] = p.metro;
          try { renderPlaceCard(p, true); } catch (_) { /* card is optional */ }
        } else if (!Number.isFinite(Number(known.lat)) || !Number.isFinite(Number(known.lng))) {
          known.lat = p.lat; known.lng = p.lng;
        }
      });
      if (noteEl && area) {
        let msg = '';
        if (data.matchNote === 'closest') msg = `No exact match for “${area}” — showing the closest names${data.didYouMean ? ` (did you mean ${data.didYouMean}?)` : ''}.`;
        else if (data.matchNote === 'none') msg = `Nothing similar to “${area}” yet — here are this week’s top picks instead.`;
        else if (data.didYouMean) msg = `Showing results for ${data.didYouMean} (and spellings close to “${area}”).`;
        if (msg) { noteEl.textContent = msg; noteEl.style.display = 'block'; }
      }
      host.innerHTML = `<div class="picks-grid">${picks.map((p, i) => {
        const img = (p.image || (Array.isArray(p.photos) && p.photos[0]) || '').toString();
        const price = p.minBudget != null ? `₹${p.minBudget}${p.maxBudget && p.maxBudget !== p.minBudget ? '–₹' + p.maxBudget : ''}` : '';
        const badge = p.featured ? '⭐ Featured this week' : (p.weeklyScore > 0 ? '🔥 Trending with students' : (usedFallback ? '★ Top rated' : '✦ New & recommended'));
        return `<button type="button" class="pick-card${i === 0 ? ' pick-card-lead' : ''}" data-pick-id="${escapeHtml(p.id)}">
          <span class="pick-media">${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(p.name || 'Place')}" loading="lazy" decoding="async" onerror="this.remove()">` : '<span class="pick-fallback" aria-hidden="true">📍</span>'}<span class="pick-badge">${badge}</span></span>
          <span class="pick-body">
            <strong class="pick-name">${escapeHtml(p.name || 'Student pick')}</strong>
            <span class="pick-loc">📍 ${escapeHtml(p.location || 'Bengaluru')}</span>
            <span class="pick-meta">${p.rating ? `<span>★ ${Number(p.rating).toFixed(1)}</span>` : ''}${price ? `<span>${escapeHtml(price)} / person</span>` : ''}${p.categoryLabel || p.category ? `<span>${escapeHtml(p.categoryLabel || p.category)}</span>` : ''}</span>
          </span>
        </button>`; }).join('')}</div>`;
      host.querySelectorAll('[data-pick-id]').forEach(btn => btn.addEventListener('click', () => openPlaceDirections(btn.dataset.pickId)));
    } catch (err) {
      if (reqId === picksReqId) host.textContent = err.message || 'Could not load weekly picks.';
    }
  }
  document.getElementById('refreshStudentPicksBtn')?.addEventListener('click', loadWeeklyStudentPicks);
  let picksTimer = null;
  document.getElementById('studentPicksArea')?.addEventListener('input', () => {
    clearTimeout(picksTimer);
    picksTimer = setTimeout(loadWeeklyStudentPicks, 350); // search as you type, no need to spell it right
  });
  document.getElementById('studentPicksArea')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); clearTimeout(picksTimer); loadWeeklyStudentPicks(); }
  });

  // ---- Verified visits: best-of-several GPS fix, friendly distance messages, self-healing pins ----
  async function verifyVisit(placeId, btn) {
    if (!isLoggedIn()) { openAuth('login', 'Log in to earn XP for visiting places.'); return; }
    if (!navigator.geolocation) { showToast('This browser does not support location verification.'); return; }
    const label = btn ? btn.textContent : '';
    const setBtn = (text, disabled) => { if (btn) { btn.disabled = disabled; btn.textContent = text; } };
    setBtn('Getting a precise fix…', true);
    try {
      // Samples GPS for a few seconds and keeps the most accurate reading, instead of trusting the first (often coarse) one.
      const fix = await getBestPosition({ goodEnoughM: 30, maxWaitMs: 12000 });
      setBtn('Verifying…', true);
      const headers = { 'Content-Type': 'application/json' };
      if (session.token) headers.Authorization = 'Bearer ' + session.token;
      const response = await fetch('/api/gamification/visit', { method: 'POST', credentials: 'include', headers, body: JSON.stringify({ placeId, lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        const err = new Error(data.error || 'Could not verify this visit.');
        err.data = data; err.fix = fix;
        throw err;
      }
      showToast('🎉 ' + (data.message || 'Visit verified!'));
      try { showDelight('Visit verified! XP earned ✨ — your squad will be proud.'); celebrate(); } catch (_) {}
      (data.squadNotes || []).forEach((n, i) => setTimeout(() => showToast(n), 3400 * (i + 1)));
      window.dispatchEvent(new Event('se-gamification-refresh'));
      loadMySquads();
    } catch (error) {
      if (error && error.code === 1) showToast('Location permission is needed only to verify this visit.');
      else if (error && error.data && error.data.canReportPin) {
        showToast(error.message);
        if (confirm('Are you actually at this place? If the map pin is wrong, send a quick report with your location so we can fix it for everyone.')) openReportModal(placeId, { kind: 'wrong_pin', fix: error.fix });
      } else showToast((error && error.message) || 'Could not get an accurate GPS fix. Try again outdoors.');
    } finally { setBtn(label || '✓ Verify visit', false); }
  }

  // ---- Report a wrong pin / address / photo -------------------------------------------------------------------
  const reportModal = document.getElementById('reportModal');
  let reportState = { placeId: '', fix: null, photo: '' };
  function openReportModal(placeId, opts = {}) {
    if (!reportModal) return;
    if (!isLoggedIn()) { openAuth('login', 'Log in to report an incorrect place detail.'); return; }
    const place = PLACES_DATA[placeId];
    reportState = { placeId, fix: opts.fix || null, photo: '' };
    const q = (id) => document.getElementById(id);
    q('reportPlaceName').textContent = place ? `${place.name} · ${place.location || ''}` : '';
    q('reportForm').reset();
    q('reportPhotoPreview').style.display = 'none';
    q('reportError').style.display = 'none';
    q('reportGpsStatus').textContent = opts.fix ? `Using your location (±${Math.round(opts.fix.accuracy)} m) as the suggested pin.` : '';
    const radio = reportModal.querySelector(`input[name="reportKind"][value="${opts.kind || 'wrong_pin'}"]`);
    if (radio) radio.checked = true;
    openModal(reportModal);
  }
  function closeReportModal() { closeModal(reportModal); }

  /** Shrinks a chosen photo so it uploads fast and stays under the server limit. */
  function shrinkImageFile(file, maxSide = 1280, quality = 0.8) {
    return new Promise((resolve, reject) => {
      if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) { reject(new Error('Please choose a JPG, PNG or WebP photo.')); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read that photo.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('That file is not a readable image.'));
        img.onload = () => {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  if (reportModal) {
    const q = (id) => document.getElementById(id);
    q('closeReportModalBtn')?.addEventListener('click', closeReportModal);
    q('reportCancelBtn')?.addEventListener('click', closeReportModal);
    reportModal.addEventListener('click', (e) => { if (e.target === reportModal) closeReportModal(); });
    q('reportPhoto')?.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      const prev = q('reportPhotoPreview');
      reportState.photo = '';
      if (!file) { prev.style.display = 'none'; return; }
      try {
        reportState.photo = await shrinkImageFile(file);
        prev.src = reportState.photo; prev.style.display = 'block';
        q('reportError').style.display = 'none';
      } catch (err) { prev.style.display = 'none'; e.target.value = ''; q('reportError').textContent = err.message; q('reportError').style.display = 'block'; }
    });
    q('reportGpsBtn')?.addEventListener('click', async () => {
      const status = q('reportGpsStatus');
      status.textContent = 'Getting your location…';
      try {
        const fix = await getBestPosition({ goodEnoughM: 30, maxWaitMs: 10000 });
        reportState.fix = fix;
        status.textContent = `Got it (±${Math.round(fix.accuracy)} m). This position will be sent as the suggested pin.`;
        const radio = reportModal.querySelector('input[name="reportKind"][value="wrong_pin"]'); if (radio) radio.checked = true;
      } catch (err) { status.textContent = err && err.code === 1 ? 'Location permission was denied. You can type the address instead.' : 'Could not get a GPS fix. Type the address instead.'; }
    });
    q('reportForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = q('reportError'); err.style.display = 'none';
      const kind = (reportModal.querySelector('input[name="reportKind"]:checked') || {}).value || 'other';
      const message = q('reportNote').value.trim();
      const suggestedAddress = q('reportAddress').value.trim();
      const fix = reportState.fix;
      if (!message && !suggestedAddress && !fix && !reportState.photo) { err.textContent = 'Add a note, the correct address, your location or a photo so we know what to fix.'; err.style.display = 'block'; return; }
      const btn = q('reportSubmitBtn'); btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const body = { kind, message, suggestedAddress };
        if (fix && (kind === 'wrong_pin' || kind === 'wrong_address')) { body.suggestedLat = fix.lat; body.suggestedLng = fix.lng; }
        if (fix) { body.reporterLat = fix.lat; body.reporterLng = fix.lng; body.reporterAccuracy = fix.accuracy; }
        if (reportState.photo) body.photo = reportState.photo;
        const res = await api(`/api/places/${encodeURIComponent(reportState.placeId)}/report`, { method: 'POST', body });
        closeReportModal();
        showToast(res.updated ? 'Thanks! We updated your earlier report.' : 'Thanks! Your report was sent to the admin team. You earn XP when a pin fix is confirmed.');
      } catch (ex) { err.textContent = ex.message || 'Could not send the report. Try again.'; err.style.display = 'block'; }
      finally { btn.disabled = false; btn.textContent = 'Send report'; }
    });
  }

  // ---- Squads: invite on WhatsApp, join with a link, progress for every member -------------------------------
  const PENDING_SQUAD_KEY = 'se_pending_squad';
  const squadLink = (code) => `${window.location.origin}/?squad=${encodeURIComponent(code)}`;

  // Saves the plan and returns the squad join code for exactly these stops (null if it could not be created).
  async function ensureSquadCode(stops) {
    await saveTripPlan();
    const trips = (await api('/api/trips')).trips || [];
    const sig = stops.map(p => p.id).join('>');
    const plan = trips.filter(t => t.type === 'squad_plan' && Array.isArray(t.stopIds) && t.stopIds.join('>') === sig && t.joinCode)
      .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0];
    return plan ? plan.joinCode : null;
  }
  function squadPlanLink(code, stops) {
    const people = Math.max(1, Math.min(25, Number(document.getElementById('tripPlanPeople')?.value) || 4));
    const cap = Number(document.getElementById('tripPlanBudgetLimit')?.value) || 0;
    return `${squadLink(code)}&plan=${encodeURIComponent(stops.map(p => p.id).join(','))}&people=${people}${cap > 0 ? `&cap=${Math.round(cap)}` : ''}#squadTripPlanner`;
  }

  async function inviteSquad() {
    const stops = selectedTripStops();
    if (stops.length < 2) return showToast('Choose at least two stops first.');
    if (!session.user) { showToast('Log in to create a squad. Friends who join and verify the stops earn XP too.'); openAuth('login', 'Log in to create a squad. Friends who join and verify the stops earn XP too.'); return; }
    const tab = openShareTab();
    let code = null;
    try { code = await ensureSquadCode(stops); } catch { /* handled below */ }
    if (!code) { try { tab && tab.close(); } catch (_) { /* ignore */ } return showToast('Could not create the squad link right now. Please try again.'); }
    const money = n => '₹' + Math.round(n).toLocaleString('en-IN');
    const t = tripTotals(stops);
    const text = [
      '🎒 Join my squad trip on Student Explorer!',
      '',
      stops.map((p, i) => `${i + 1}. ${p.name}`).join('\n'),
      '',
      `💸 About ${money(t.low)}–${money(t.high)} per person`,
      '',
      'Tap to join the plan. Verify the stops on the day → earn XP together:',
      squadPlanLink(code, stops)
    ].join('\n');
    finishShareTab(tab, text);
    showToast('Squad created. Opening WhatsApp to invite your friends…');
    loadMySquads();
  }
  document.getElementById('inviteSquadBtn')?.addEventListener('click', inviteSquad);

  async function loadMySquads() {
    if (!session.user) return;
    const plans = document.getElementById('profileSavedPlans');
    if (!plans) return;
    let host = document.getElementById('profileSquadsList');
    if (!host) { host = document.createElement('div'); host.id = 'profileSquadsList'; host.className = 'profile-saved-plans'; plans.insertAdjacentElement('afterend', host); }
    try {
      const data = await api('/api/squads/mine');
      const squads = data.squads || [];
      const lead = data.leader || { completedTrips: 0, target: 5 };
      const pct = Math.min(100, Math.round((lead.completedTrips / lead.target) * 100));
      const money = null;
      host.innerHTML = `<div class="profile-saved-plans-title">Squads</div>
        <div class="squad-leader-meter">👥 <b>Squad Leader</b> progress: ${lead.completedTrips}/${lead.target} trips completed<div class="xp-track" style="margin-top:.35rem"><i style="width:${pct}%"></i></div><small>Lead a trip, verify every stop, press Complete. Earn +10 XP for each friend who also finishes.</small></div>`
        + (squads.length ? squads.map(sq => {
          const ch = sq.challenge;
          const chalHtml = ch.eligible ? `<div class="squad-chal ${ch.done ? 'done' : ''}">🏅 ${escapeHtml(ch.title)}: ${ch.done ? 'completed today!' : `${ch.friendsReady}/${ch.needFriends} friends have verified ${ch.needPlaces} places today`} · +${ch.rewardXp} XP each</div>` : `<div class="squad-chal">🏅 Add a 3rd stop to unlock “${escapeHtml(ch.title)}” (+${ch.rewardXp} XP each).</div>`;
          return `<div class="squad-card"><h5>${escapeHtml(sq.title || 'Squad trip')} ${sq.role === 'leader' ? '<small>(you lead)</small>' : ''}</h5>
            <small>${sq.stops.map(x => escapeHtml(x.name)).join(' → ')}</small>
            ${sq.members.map(m => `<div class="squad-member"><span style="min-width:6.5rem">${escapeHtml(m.name)}${m.isMe ? ' (you)' : ''}</span><span class="xp-track"><i style="width:${Math.round(m.verifiedStops / Math.max(1, m.totalStops) * 100)}%"></i></span><span>${m.verifiedStops}/${m.totalStops}${m.completed ? ' ✓' : ''}</span></div>`).join('')}
            ${chalHtml}
            <div style="margin-top:.5rem"><button type="button" class="btn btn-outline btn-sm" data-squad-share="${escapeHtml(String(sq.joinCode || ''))}" data-squad-title="${escapeHtml(sq.title || '')}">Invite more friends</button></div></div>`;
        }).join('') : '<p class="profile-saved-empty">No squads yet. Save a plan and tap “Invite squad”.</p>');
      host.querySelectorAll('[data-squad-share]').forEach(btn => btn.addEventListener('click', () => {
        const code = btn.dataset.squadShare; if (!code) return;
        window.open('https://wa.me/?text=' + encodeURIComponent(`🎒 Join my Student Explorer squad: ${btn.dataset.squadTitle}\n${squadLink(code)}`), '_blank');
      }));
    } catch { /* squads are optional; stay quiet */ }
  }
  window.addEventListener('se-gamification-refresh', () => { loadMySquads(); });

  // Opened from a WhatsApp invite: ?squad=CODE
  const squadJoinModal = document.getElementById('squadJoinModal');
  async function handleSquadLink() {
    let code = '';
    try { code = new URLSearchParams(window.location.search).get('squad') || localStorage.getItem(PENDING_SQUAD_KEY) || ''; } catch { /* ignore */ }
    if (!/^[A-Za-z0-9]{4,12}$/.test(code)) return;
    try {
      const u = new URL(window.location.href); u.searchParams.delete('squad'); window.history.replaceState({}, '', u.pathname + (u.search || '') + u.hash);
    } catch { /* ignore */ }
    try {
      const data = await api('/api/squads/' + encodeURIComponent(code));
      const sq = data.squad;
      document.getElementById('squadJoinBody').innerHTML = `<p><b>${escapeHtml(sq.leader)}</b> invited you to <b>${escapeHtml(sq.title)}</b>.</p>
        <p>${sq.stops.map(x => escapeHtml(x.name)).join(' → ')}</p>
        <p>${sq.joined} of ${sq.people} friends joined${sq.budgetLimit ? ` · budget cap ₹${sq.budgetLimit}/person` : ''}. Everyone who verifies the stops on the day earns XP.</p>`;
      openModal(squadJoinModal);
      const confirmBtn = document.getElementById('squadJoinConfirmBtn');
      const close = () => { closeModal(squadJoinModal); try { localStorage.removeItem(PENDING_SQUAD_KEY); } catch { /* ignore */ } };
      document.getElementById('closeSquadJoinBtn').onclick = close;
      document.getElementById('squadJoinCancelBtn').onclick = close;
      confirmBtn.onclick = async () => {
        if (!session.user) { try { localStorage.setItem(PENDING_SQUAD_KEY, code); } catch { /* ignore */ } closeModal(squadJoinModal); openAuth('login', 'Log in or sign up and you will join the squad automatically.'); return; }
        confirmBtn.disabled = true;
        try { const res = await api('/api/squads/' + encodeURIComponent(code) + '/join', { method: 'POST' }); showToast(res.message); close(); loadMySquads(); document.getElementById('squadTripPlanner')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        catch (err) { showToast(err.message); }
        finally { confirmBtn.disabled = false; }
      };
    } catch (err) { showToast(err.message || 'This squad link is not valid.'); }
  }
  // After login/signup, finish a join that was waiting.
  window.addEventListener('se-auth', () => setTimeout(() => {
    try { if (session.user && localStorage.getItem(PENDING_SQUAD_KEY)) handleSquadLink(); } catch { /* ignore */ }
  }, 900));
  setTimeout(handleSquadLink, 1200);

  // ---- Weekend motivation: only on Saturday and Sunday (India time), once a day ------------------------------
  function maybeShowWeekendPrompt() {
    const modal = document.getElementById('weekendModal');
    if (!modal) return;
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(new Date());
    const forced = /[?&]weekend=1\b/.test(location.search); // preview the card on any day: add ?weekend=1 to the address
    if (!forced && parts !== 'Saturday' && parts !== 'Sunday') return;
    const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    try { if (!forced && localStorage.getItem('se_weekend_seen') === dayKey) return; } catch { /* show anyway */ }
    const lines = parts === 'Saturday' ? [
      ['🌄', 'Saturday mornings are made for Cubbon Park and a filter coffee. Grab your squad and go!', 'Bengaluru will not explore itself.'],
      ['🍜', 'Your weekday self deserves a VV Puram food street evening. Split the plates, keep it under budget.', 'Three friends, three places, one day: a squad challenge is waiting.'],
      ['🚇', 'Metro plus a long walk beats scrolling. Pick one new place today you have never been to.', 'Quiet places pay extra XP.'],
      ['🌳', 'Lalbagh is calling. Free morning entry, zero excuses.', 'Verify your visit and watch your XP grow.'],
    ] : [
      ['☀️', 'Sunday plan: pick a hidden gem, message the group, and go before lunch.', 'The best weekends are the ones that leave a story.'],
      ['🥾', 'Do not let Sunday vanish. A sunrise trek or a lazy cafe, both count as exploring Bengaluru.', 'Complete a squad trip and every friend who verifies earns XP.'],
      ['📚', 'Take a book to Church Street or Cubbon Park. Recharge before Monday.', 'Share your find with a review and photo for bonus XP.'],
      ['🎒', 'One more outing before the week starts. Which friend is free right now?', 'Plan it in two minutes in the Squad planner.'],
    ];
    const seed = Number(dayKey.replace(/-/g, '')) % lines.length;
    const [emoji, headline, extra] = lines[seed];
    document.getElementById('weekendEmoji').textContent = emoji;
    document.getElementById('weekendTitle').textContent = parts === 'Saturday' ? 'Happy Saturday! Go explore Bengaluru' : 'Happy Sunday! Go explore Bengaluru';
    document.getElementById('weekendText').textContent = headline + ' ' + extra;
    const done = () => { closeModal(modal); try { localStorage.setItem('se_weekend_seen', dayKey); } catch { /* ignore */ } };
    document.getElementById('closeWeekendBtn').onclick = done;
    document.getElementById('weekendLaterBtn').onclick = done;
    modal.addEventListener('click', (e) => { if (e.target === modal) done(); }, { once: true });
    document.getElementById('weekendSquadBtn').onclick = () => { done(); document.getElementById('squadTripPlanner')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    document.getElementById('weekendPlacesBtn').onclick = () => { done(); document.getElementById('heroGpsBtn')?.click(); scrollToPlaces(); };
    // v17: show the 3 best student spots under Rs 300 near the visitor; tapping one opens its directions.
    function renderWeekendPicks() {
      const host = document.getElementById('weekendPicks'); if (!host) return;
      const o = getActiveOrigin();
      const picks = Object.values(PLACES_DATA || {})
        .filter(p => p && p.id && Number.isFinite(Number(p.lat)) && Number(p.maxBudget) > 0 && Number(p.maxBudget) <= 300)
        .map(p => ({ p, km: calculateDistanceKm(o.lat, o.lng, Number(p.lat), Number(p.lng)) }))
        .filter(x => Number.isFinite(x.km) && x.km <= 25)
        .sort((a, b) => ((Number(b.p.rating) || 0) - b.km * 0.04) - ((Number(a.p.rating) || 0) - a.km * 0.04));
      const sponsored = picks.filter(x => promoBoost(x.p.id, 'discovery') > 0).sort((a, b) => promoScore(b.p.id) - promoScore(a.p.id)).slice(0, 2);
      picks.splice(0, picks.length, ...sponsored, ...picks.filter(x => !sponsored.includes(x)).slice(0, 3 - sponsored.length));
      host.innerHTML = picks.length ? `<div class="weekend-picks-title">Top picks under ₹300 near ${escapeHtml(o.name || 'you')}</div>` + picks.map(({ p, km }) => `<button type="button" class="weekend-pick" data-id="${escapeHtml(String(p.id))}">
        <span class="weekend-pick-main"><strong>${escapeHtml(p.name)}${PROMOS[p.id] ? ' <em class="promo-badge-inline">Sponsored</em>' : ''}</strong><small>📍 ${escapeHtml(p.location || 'Bengaluru')} · ${km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km'}</small></span>
        <span class="weekend-pick-price">${Number(p.minBudget) === Number(p.maxBudget) ? '₹' + Number(p.maxBudget) : (Number(p.minBudget) > 0 ? '₹' + Number(p.minBudget) + ' – ' : 'Free – ') + '₹' + Number(p.maxBudget)}<small>★ ${Number(p.rating || 0).toFixed(1)} · 🧭 Directions</small></span></button>`).join('') : '';
    }
    document.getElementById('weekendPicks')?.addEventListener('click', (e) => {
      const b = e.target.closest('.weekend-pick'); if (!b) return;
      done(); setTimeout(() => openPlaceDirections(b.dataset.id), 150);
    });
    setTimeout(() => {
      if (document.querySelector('.modal-backdrop.open') || window.__welcomeShown) return; // never interrupt login, add-place, the opening cards or other dialogs
      renderWeekendPicks();
      openModal(modal);
    }, 3500);
  }
  maybeShowWeekendPrompt();
  window.__sePlaces = () => PLACES_DATA; // read-only handle used by automated data checks

  // Load shared community places (visible to every visitor) from the server
  async function loadCommunityPlaces() {
    try {
      const data = await api('/api/places');
      (data.places || []).forEach(place => {
        normalizePlaceCoords(place);
        if (PLACES_DATA[place.id]) {
          // Merge fresher coordinates onto built-in / already-loaded entries
          const cur = PLACES_DATA[place.id];
          if (Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lng))) {
            cur.lat = Number(place.lat);
            cur.lng = Number(place.lng);
          }
          return;
        }
        place._db = true;
        PLACES_DATA[place.id] = place;
        PLACES_STOPS[place.id] = place.metro;
        renderPlaceCard(place, true);
      });
      updateCardsDistanceAndTransit();
      populateTripPlanOptions();
      applySharedPlanFromUrl();
      loadWeeklyStudentPicks();
      const sharedPlaceId = new URLSearchParams(window.location.search).get('place');
      if (sharedPlaceId && PLACES_DATA[sharedPlaceId]) setTimeout(() => openPlaceDetails(sharedPlaceId), 0);
      if (typeof refreshExpensePlaceOptions === 'function') refreshExpensePlaceOptions();
    } catch (e) {
      console.warn('Could not load community places:', e.message);
    }
  }

  // ============================================================================
  // 10. MODAL DIALOGS CONTROLLER (DETAILS, AUTH, LEGAL)
  // ============================================================================
  function openModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.add('open');
    modalElement.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.remove('open');
    modalElement.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function openPlaceDetails(placeId, scrollToReviews = false) {
    const data = PLACES_DATA[placeId];
    if (!data) return;

    currentState.activeModalPlaceId = placeId;
    if (savePlaceBookmarkBtn) savePlaceBookmarkBtn.textContent = isFav(placeId) ? '✓ Saved to My Squad List' : 'Save to My Squad List';

    const titleEl = document.getElementById('modalPlaceTitle');
    const catEl = document.getElementById('modalPlaceCategory');
    const locEl = document.getElementById('modalPlaceLocation');
    const descEl = document.getElementById('modalPlaceDescription');
    const budgetEl = document.getElementById('modalPlaceBudget');
    const metroEl = document.getElementById('modalPlaceMetro');
    const timeEl = document.getElementById('modalPlaceTime');
    const tipEl = document.getElementById('modalPlaceTip');

    if (titleEl) titleEl.textContent = data.name;
    if (catEl) catEl.textContent = data.detailedCategoryLabel || data.categoryLabel || ({ food: 'Cafes & Restaurants', nature: 'Parks & Nature', attractions: 'Tourist Attractions', entertainment: 'Entertainment', getaways: 'Weekend Getaways' })[data.category] || data.category;
    if (locEl) locEl.textContent = data.location;
    if (descEl) descEl.textContent = data.description;
    if (budgetEl) budgetEl.textContent = data.budget;
    if (metroEl) metroEl.textContent = data.metro;
    if (timeEl) timeEl.textContent = data.bestTime;
    if (tipEl) tipEl.textContent = data.studentTip;

    const imgEl = document.getElementById('modalPlaceImg');
    const imgContainer = document.getElementById('modalImageContainer');
    if (imgEl && imgContainer) {
      if (data.image) {
        imgEl.src = data.image;
        imgEl.alt = data.name;
        imgContainer.style.display = 'block';
        const creditEl = document.getElementById('modalPhotoCredit');
        if (creditEl) {
          const c = data.photoCredit;
          if (c && c.author) {
            const a = (u, t) => /^https:\/\//.test(u || '') ? `<a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t)}</a>` : escapeHtml(t);
            creditEl.innerHTML = `Photo: ${escapeHtml(c.author)} · ${a(c.licenseUrl, c.license || 'licence')} · ${a(c.sourceUrl, c.origin === 'google' ? 'Google Maps' : 'Wikimedia Commons')}`;
            creditEl.style.display = 'block';
          } else { creditEl.style.display = 'none'; creditEl.textContent = ''; }
        }
      } else {
        imgContainer.style.display = 'none';
      }
    }

    // Update live distance & commute estimate banner inside modal
    const origin = getActiveOrigin();
    const placeDist = calculateDistanceKm(origin.lat, origin.lng, data.lat, data.lng);
    if (modalDistanceHighlight) modalDistanceHighlight.textContent = `${placeDist} km away`;
    if (modalOriginCrumbName) modalOriginCrumbName.textContent = origin.name;
    if (modalEtaEstimate) {
      let etaStr = '~10–15 mins commute';
      if (placeDist > 40) etaStr = '~1.5–2.5 hours roadtrip';
      else if (placeDist > 20) etaStr = '~45–60 mins commute';
      else if (placeDist > 10) etaStr = '~25–40 mins commute';
      else if (placeDist > 5) etaStr = '~15–25 mins commute';
      modalEtaEstimate.textContent = etaStr;
    }

    // Update Google Maps Section inside modal
    updateModalGoogleMapsView(placeId);

    // Add-photo / admin buttons
    renderModalPlaceTools(placeId);

    // Update Student Reviews Section
    renderPlaceReviews(placeId);

    openModal(placeDetailsModal);

    if (scrollToReviews) {
      setTimeout(() => {
        document.getElementById('modalReviewsSection')?.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    }
  }

  /**
   * v17: clicking a recommendation takes the student straight to directions: the place popup opens already scrolled to
   * the route map (from their start point) with the big "Open directions" button, instead of making them hunt for it.
   */
  function openPlaceDirections(placeId) {
    if (!placeId || !PLACES_DATA[placeId]) return;
    openPlaceDetails(placeId);
    setTimeout(() => {
      const card = document.getElementById('modalDirectionsCard');
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      card.classList.add('se-flash');
      setTimeout(() => card.classList.remove('se-flash'), 2000);
    }, 280);
  }

  // v17: on phones the cards are compact (photo + name + price). Tapping anywhere on a card opens its details and directions.
  placesGrid?.addEventListener('click', (e) => {
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    if (e.target.closest('a, button, input, select, textarea, label')) return;
    const card = e.target.closest('.place-card[data-id]');
    if (card) openPlaceDetails(card.dataset.id);
  });

  // Wire initial static cards
  document.querySelectorAll('.place-card').forEach(card => {
    const placeId = card.getAttribute('data-id');
    if (placeId) {
      wirePlaceCardButtons(card, placeId);
    }
  });

  if (closePlaceModalBtn) {
    closePlaceModalBtn.addEventListener('click', () => closeModal(placeDetailsModal));
  }

  if (savePlaceBookmarkBtn) {
    savePlaceBookmarkBtn.addEventListener('click', () => {
      const placeId = currentState.activeModalPlaceId;
      if (!placeId || !PLACES_DATA[placeId]) return showToast('Open a place first.');
      const saved = toggleFav(placeId);
      refreshFavButtons();
      savePlaceBookmarkBtn.textContent = saved ? '✓ Saved to My Squad List' : 'Save to My Squad List';
      showToast(saved ? 'Saved to My Squad List.' : 'Removed from My Squad List.');
    });
  }

  if (sharePlaceWhatsAppBtn) {
    sharePlaceWhatsAppBtn.addEventListener('click', () => {
      const placeId = currentState.activeModalPlaceId;
      if (!placeId) return showToast('Open a place first.');
      sharePlaceWhatsApp(placeId);
    });
  }

  if (copyPlaceLinkBtn) {
    copyPlaceLinkBtn.addEventListener('click', async () => {
      const placeId = currentState.activeModalPlaceId;
      const place = placeId && PLACES_DATA[placeId];
      if (!place) return showToast('Open a place first.');
      const shareUrl = `${window.location.origin}/?place=${encodeURIComponent(placeId)}`;
      if (navigator.share && window.matchMedia && matchMedia('(pointer: coarse)').matches) {
        try { await navigator.share({ title: place.name, text: `${place.name} — ${place.location || 'Bengaluru'}`, url: shareUrl }); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      if (await copyText(`${place.name} — ${place.location || 'Bengaluru'}\n${shareUrl}`)) showToast('Place link copied.');
      else showToast('Could not copy automatically. Long-press the link to copy it.');
    });
  }

  if (reportPlaceIssueBtn) {
    reportPlaceIssueBtn.addEventListener('click', () => {
      const placeId = currentState.activeModalPlaceId;
      if (!placeId) return showToast('Open a place first.');
      closeModal(placeDetailsModal);
      openReportModal(placeId);
    });
  }

  // Auth: real login / sign up (email + password), data saved under the email
  let authMode = 'signup';
  const authTabLogin = document.getElementById('authTabLogin');
  const authTabSignup = document.getElementById('authTabSignup');
  const authError = document.getElementById('authError');

  function setAuthMode(mode, message) {
    authMode = mode;
    authTabLogin?.classList.toggle('active', mode === 'login');
    authTabSignup?.classList.toggle('active', mode === 'signup');
    document.querySelectorAll('.signup-only').forEach(el => { el.style.display = mode === 'signup' ? 'block' : 'none'; });
    document.getElementById('authSubmitBtn').textContent = mode === 'signup' ? 'Create Account' : 'Log In';
    document.getElementById('authPassword').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    const sub = document.getElementById('authSubtitle');
    if (sub) sub.textContent = message || (mode === 'signup' ? 'Create an account to add places and keep your outing history.' : 'Log in to add places and see your outing history.');
    if (authError) authError.style.display = 'none';
  }
  function openAuth(mode = 'signup', message) { setAuthMode(mode, message); openModal(authModal); }
  setAuthMode('signup');

  authTabLogin?.addEventListener('click', () => setAuthMode('login'));
  authTabSignup?.addEventListener('click', () => setAuthMode('signup'));
  loginBtn?.addEventListener('click', () => openAuth('login'));
  signupBtn?.addEventListener('click', () => openAuth('signup'));

  const profileMenuWrap = document.getElementById('profileMenuWrap');
  const profileMenuBtn = document.getElementById('profileMenuBtn');
  const profileMenu = document.getElementById('profileMenu');
  const profileLogoutBtn = document.getElementById('profileLogoutBtn');
  const profileMenuName = document.getElementById('profileMenuName');
  const profileMenuEmail = document.getElementById('profileMenuEmail');
  const profileMenuCollege = document.getElementById('profileMenuCollege');
  function closeProfileMenu() {
    if (!profileMenu || !profileMenuBtn) return;
    profileMenu.hidden = true;
    profileMenuBtn.setAttribute('aria-expanded', 'false');
  }
  profileMenuBtn?.addEventListener('click', () => {
    if (!profileMenu) return;
    const opening = profileMenu.hidden;
    profileMenu.hidden = !opening;
    profileMenuBtn.setAttribute('aria-expanded', opening ? 'true' : 'false');
    if (opening && session.user) refreshSavedTripPlans();
  });
  document.addEventListener('click', (event) => {
    if (profileMenuWrap && !profileMenuWrap.contains(event.target)) closeProfileMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeProfileMenu();
  });
  document.getElementById('profileViewAchievementsBtn')?.addEventListener('click', () => {
    closeProfileMenu();
    const ach = document.getElementById('achievements');
    if (ach) {
      ach.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.dispatchEvent(new Event('se-gamification-refresh'));
    }
  });
  profileLogoutBtn?.addEventListener('click', async () => {
    profileLogoutBtn.disabled = true;
    profileLogoutBtn.textContent = 'Logging out…';
    try {
      // The auth server rejects a sign-out POST that has no JSON Content-Type (HTTP 415).
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
        headers: Object.assign({ 'Content-Type': 'application/json' }, session.token ? { Authorization: 'Bearer ' + session.token } : {}),
        body: '{}'
      });
      if (!response.ok) throw new Error('Could not log out. Please try again.');
      showToast('You have been logged out successfully.');
    } catch (error) {
      showToast(error?.message || 'Could not log out on the server, but you are logged out on this device.');
    } finally {
      // Whatever the server answered, never stay logged in on this device.
      setSession('', null);
      closeProfileMenu();
      profileLogoutBtn.disabled = false;
      profileLogoutBtn.textContent = 'Log Out';
    }
  });
  closeAuthModalBtn?.addEventListener('click', () => closeModal(authModal));

  // When a DIFFERENT account (or nobody) takes over this page, wipe the search box, results, suggestions and
  // cached outings so nothing from the previous person stays on screen.
  function resetViewForNewAccount() {
    try {
      tripsCache = [];
      currentState.query = '';
      currentState.sortExplicit = false;
      [searchInput, document.getElementById('topSearchInput')].forEach(el => { if (el) el.value = ''; });
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      document.querySelectorAll('.se-suggest').forEach(b => { b.hidden = true; });
      document.querySelectorAll('[id^="tripPlanStop"]').forEach(sel => { if (sel.dataset) delete sel.dataset.restoreId; });
      applyFiltersAndSort();
      window.dispatchEvent(new Event('se-account-changed'));
    } catch (err) { console.warn('view reset failed', err); }
  }
  function setSession(token, user) {
    rememberToken(token);
    session.user = user;
    const nextScope = accountScope();
    if (nextScope !== lastScope) {
      const previous = lastScope;
      lastScope = nextScope;
      if (previous !== 'guest') resetViewForNewAccount();
    }
    const routeParams = new URLSearchParams(window.location.search);
    if (user && routeParams.get('openAdmin') === '1') {
      routeParams.delete('openAdmin');
      const nextUrl = `${window.location.pathname}${routeParams.toString() ? `?${routeParams}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
      setTimeout(() => openAdminDashboard(), 0);
    } else if (user && routeParams.get('openAddPlace') === '1') {
      routeParams.delete('openAddPlace');
      const nextUrl = `${window.location.pathname}${routeParams.toString() ? `?${routeParams}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
      setTimeout(() => openUploadModal(), 0);
    }
    if (loginBtn) loginBtn.style.display = user ? 'none' : '';
    if (signupBtn) signupBtn.style.display = user ? 'none' : '';
    if (profileMenuWrap) profileMenuWrap.style.display = user ? 'block' : 'none';
    if (profileMenuName) profileMenuName.textContent = user ? `${user.name || 'Your account'}${user.isAdmin ? ' · Admin' : ''}` : 'Your account';
    if (profileMenuEmail) profileMenuEmail.textContent = user?.email || '';
    if (profileMenuCollege) profileMenuCollege.textContent = user?.college || '';
    const avatar = document.getElementById('profileAvatar');
    if (avatar) avatar.textContent = user ? (user.name || user.email || 'U').trim().charAt(0).toUpperCase() : '👤';
    closeProfileMenu();
    const adminBtn = document.getElementById('navAdminBtn');
    if (adminBtn) adminBtn.style.display = user && user.isAdmin ? 'inline-flex' : 'none';
    const wsb = document.getElementById('welcomeSignupBanner');
    if (wsb && user) wsb.style.display = 'none';
    loadTrips();
    refreshSavedTripPlans();
    if (user) setTimeout(() => syncLocalPlans(false), 400);
  }

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('authSubmitBtn');
    const email = document.getElementById('collegeEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    if (!email || !password) { authError.textContent = 'Enter your email and password.'; authError.style.display = 'block'; return; }
    btn.disabled = true;
    try {
      const path = authMode === 'signup' ? '/api/auth/sign-up/email' : '/api/auth/sign-in/email';
      const name = document.getElementById('authName').value.trim();
      const college = document.getElementById('collegeName').value.trim();
      const payload = authMode === 'signup'
        ? { email, password, name: name || email.split('@')[0] }
        : { email, password };
      // A token left over from a previous login (for example the admin's) would be sent with every request and beat the
      // new person's cookie, so the new user saw the admin's profile. Always start from a clean slate.
      session.token = ''; session.user = null;
      try { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem('student_explorer_token'); } catch { /* ignore */ }
      const res = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const token = res.headers.get('set-auth-token');
      let raw = {};
      try { raw = await res.json(); } catch { raw = {}; }
      if (!res.ok) {
        const msg = raw.message || raw.error || '';
        if (authMode === 'signup' && /exist/i.test(msg)) {
          throw new Error('This email already has an account. Switch to Log In and use the password you created at sign up.');
        }
        if (authMode === 'login') {
          throw new Error('No account matched that email and password. Sign up first if you are new. Passwords can match someone else\'s — only your account is checked.');
        }
        throw new Error(msg || 'Could not continue.');
      }
      if (token) rememberToken(token);
      if (authMode === 'signup') {
        try { await api('/api/profile', { method: 'POST', body: { college } }); } catch { /* college is optional */ }
      }
      const data = await api('/api/profile');
      // Safety net: the account the server says we are must be the account that just logged in.
      if (!data.user || String(data.user.email || '').toLowerCase() !== email.toLowerCase()) {
        try { await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' }); } catch { /* ignore */ }
        setSession('', null);
        throw new Error('Login went to the wrong account. Please try again.');
      }
      setSession(session.token, data.user);
      authForm.reset();
      closeModal(authModal);
      showToast(`Welcome${authMode === 'signup' ? '' : ' back'}, ${data.user.name}!`);
    } catch (err) {
      authError.textContent = err.message; authError.style.display = 'block';
    } finally { btn.disabled = false; }
  });

  // Legal Modal
  const LEGAL_CONTENT = {
    privacy: {
      title: "Student Explorer Privacy Policy",
      body: `
        <p><strong>1. Student Privacy:</strong> Student Explorer is open to everyone. We do not sell personal data to third-party ad networks.</p>
        <p><strong>2. Community Contributions:</strong> When submitting places or reviews, your name helps others recognise genuine advice.</p>
        <p><strong>3. Local Storage:</strong> Outing logs, community spots, and reviews are stored locally on your device.</p>
      `
    },
    terms: {
      title: "Terms and Conditions",
      body: `
        <p><strong>1. Indicative Estimates:</strong> All budget figures, ticket prices, and transit rates (Rapido, Uber, Metro) shown on Student Explorer are student estimates intended for planning.</p>
        <p><strong>2. Responsible Exploration:</strong> Respect public heritage monuments, botanical gardens, and local cleanliness guidelines when exploring Bengaluru.</p>
        <p><strong>3. Community Guidelines:</strong> Be respectful in submitted reviews and recommend honest student-friendly spots.</p>
      `
    },
    ambassador: {
      title: "Campus Ambassador Program",
      body: `
        <p><strong>Represent Student Explorer in your college!</strong></p>
        <p>Positions open across RVCE, PES University, BMSCE, Christ University, MSRIT, Mount Carmel, SJCC, and others.</p>
        <p><strong>Perks:</strong> Certificate of leadership, food tasting invitations, and stipend opportunities.</p>
        <p>Email your campus details to: <strong>ambassador@studentexplorer.in</strong></p>
      `
    }
  };

  function openLegalDialog(type) {
    const data = LEGAL_CONTENT[type];
    if (data && legalModal && legalModalTitle && legalModalBody) {
      legalModalTitle.textContent = data.title;
      legalModalBody.innerHTML = data.body;
      openModal(legalModal);
    }
  }

  if (privacyPolicyBtn) privacyPolicyBtn.addEventListener('click', () => openLegalDialog('privacy'));
  if (termsBtn) termsBtn.addEventListener('click', () => openLegalDialog('terms'));
  if (campusAmbassadorBtn) campusAmbassadorBtn.addEventListener('click', () => openLegalDialog('ambassador'));

  if (closeLegalModalBtn) closeLegalModalBtn.addEventListener('click', () => closeModal(legalModal));
  if (closeLegalBtnAction) closeLegalBtnAction.addEventListener('click', () => closeModal(legalModal));

  // Modal Backdrop click to close
  [placeDetailsModal, uploadPlaceModal, authModal, legalModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [placeDetailsModal, uploadPlaceModal, authModal, legalModal, document.getElementById('reportModal'), document.getElementById('weekendModal'), document.getElementById('squadJoinModal')].forEach(closeModal);
    }
  });

  // ============================================================================
  // 11. SEARCH & FILTER ENGINES
  // ============================================================================
  function parseSearchQuery(rawQuery) {
    let cleaned = rawQuery.trim().toLowerCase();
    if (!cleaned) {
      return { textQuery: '', minBudget: null, maxBudget: null, isFreeOnly: false, hasBudgetConstraint: false };
    }

    if (cleaned === 'free' || cleaned === '0' || cleaned === 'zero') {
      return { textQuery: '', minBudget: 0, maxBudget: 0, isFreeOnly: true, hasBudgetConstraint: true };
    }

    let minBudget = null;
    let maxBudget = null;
    let hasBudgetConstraint = false;

    const rangeMatch = cleaned.match(/(?:between\s+)?(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:-|to|and)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
    if (rangeMatch) {
      minBudget = parseInt(rangeMatch[1], 10);
      maxBudget = parseInt(rangeMatch[2], 10);
      hasBudgetConstraint = true;
      cleaned = cleaned.replace(rangeMatch[0], ' ').trim();
    } else {
      const underMatch = cleaned.match(/(?:under|below|less than|within|max|budget|cost|price|<=?)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
      if (underMatch) {
        maxBudget = parseInt(underMatch[1], 10);
        hasBudgetConstraint = true;
        cleaned = cleaned.replace(underMatch[0], ' ').trim();
      } else {
        const aboveMatch = cleaned.match(/(?:above|more than|greater than|>=?)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
        if (aboveMatch) {
          minBudget = parseInt(aboveMatch[1], 10);
          hasBudgetConstraint = true;
          cleaned = cleaned.replace(aboveMatch[0], ' ').trim();
        } else {
          const standaloneMatch = cleaned.match(/(?:(?:₹|rs\.?|inr)\s*(\d+)|(\d+)\s*(?:₹|rs\.?|inr|rupees)?)/i);
          if (standaloneMatch) {
            const numStr = standaloneMatch[1] || standaloneMatch[2];
            maxBudget = parseInt(numStr, 10);
            hasBudgetConstraint = true;
            cleaned = cleaned.replace(standaloneMatch[0], ' ').trim();
          }
        }
      }
    }

    cleaned = cleaned.replace(/\b(budget|places|place|spots|under|within|inr|rs|rupees|near me|nearby|near)\b/gi, '').replace(/\s+/g, ' ').trim();

    // Category / intent keywords so "food" finds all food spots, etc.
    const CATEGORY_ALIASES = {
      food: ['food', 'cafe', 'cafes', 'restaurant', 'restaurants', 'eat', 'dosa', 'coffee', 'street food', 'dining', 'biryani', 'snack'],
      nature: ['nature', 'park', 'parks', 'garden', 'green', 'outdoor', 'picnic', 'lake'],
      attractions: ['attraction', 'attractions', 'palace', 'museum', 'fort', 'tourist', 'sightseeing', 'heritage'],
      entertainment: ['entertainment', 'movie', 'cinema', 'game', 'arcade', 'fun', 'club', 'hangout'],
      getaways: ['getaway', 'getaways', 'trip', 'trek', 'hill', 'weekend', 'day trip', 'outing'],
      hotels: ['hotel', 'hotels', 'stay', 'hostel', 'pg', 'lodge'],
    };
    let categoryHint = null;
    for (const [cat, words] of Object.entries(CATEGORY_ALIASES)) {
      if (words.some(w => cleaned === w || cleaned.includes(w))) {
        categoryHint = cat;
        // keep text for secondary match but category drives primary filter
        break;
      }
    }

    // Time intent: sunrise / morning vs nightlife
    let timeHint = null;
    if (/\b(sunrise|dawn|early\s*morning|morning\s*walk)\b/.test(rawQuery.toLowerCase()) || cleaned.includes('sunrise')) {
      timeHint = 'morning';
    } else if (/\b(late\s*night|nightlife|night\s*life|night\s*out|club|open\s*late)\b/.test(rawQuery.toLowerCase())) {
      timeHint = 'night';
    }

    return {
      textQuery: cleaned,
      minBudget: minBudget,
      maxBudget: maxBudget,
      isFreeOnly: false,
      hasBudgetConstraint: hasBudgetConstraint,
      categoryHint,
      timeHint
    };
  }

  // Time-of-day / vibe scoring so "late night" never returns sunrise parks
  const MORNING_SIGNALS = /\b(sunrise|dawn|early\s*morning|morning\s*walk|6\s*:\s*00\s*am|5\s*:\s*30|before\s*dawn|vehicle-?free|botanical|glass\s*house|picnic|cycling|park\b)/i;
  const NIGHT_SIGNALS = /\b(night\s*life|nightlife|late[\s-]*night|open\s*late|after\s*9|after\s*10|10\s*:\s*30\s*pm|11\s*pm|dinner|club|pub|bar\b|live\s*music|night\s*market|evening\s*street|street\s*food|hangout|pedestrian\s*walk)/i;
  const EVENING_OK = /\b(evening|6\s*:\s*30\s*pm|7\s*pm|8\s*pm|9\s*pm|dinner|cafe|cafés|food\s*street|book\s*cafe)/i;
  const STRICT_MORNING_BLOCK = /\b(sunrise|dawn|nandi\s*hills|morning\s*walkers|6\s*:\s*00\s*am\s*to\s*9|free\s*for\s*morning)/i;

  // Parse only simple, explicit OSM opening_hours rules. Complex rules stay unknown,
  // so the app never labels a place "open" when it cannot verify the schedule.
  function listedOpenNow(place) {
    const hours = String(place?.openingHours || place?.osmTags?.opening_hours || place?.opening_hours || '').trim();
    if (!hours) return null;
    if (/^24\/7$/i.test(hours)) return true;
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';
    const hour = Number(parts.find(p => p.type === 'hour')?.value);
    const minute = Number(parts.find(p => p.type === 'minute')?.value);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = days.findIndex(d => d.toLowerCase() === weekday.toLowerCase());
    if (today < 0 || !Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    const now = hour * 60 + minute;
    let sawApplicableRule = false;
    for (const raw of hours.split(';')) {
      const rule = raw.trim();
      const match = rule.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:,(?:Mo|Tu|We|Th|Fr|Sa|Su))*)\s+(.+)$/i);
      if (!match) continue;
      const activeDays = new Set();
      for (const token of match[1].split(',')) {
        const range = token.split('-');
        const start = days.findIndex(d => d.toLowerCase() === range[0].toLowerCase());
        const end = days.findIndex(d => d.toLowerCase() === (range[1] || range[0]).toLowerCase());
        if (start < 0 || end < 0) continue;
        let cursor = start;
        for (let guard = 0; guard < 7; guard++) {
          activeDays.add(cursor);
          if (cursor === end) break;
          cursor = (cursor + 1) % 7;
        }
      }
      if (!activeDays.has(today)) continue;
      sawApplicableRule = true;
      if (/^(off|closed)$/i.test(match[2].trim())) continue;
      for (const interval of match[2].split(',').map(v => v.trim())) {
        const tm = interval.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
        if (!tm) continue;
        const start = Number(tm[1]) * 60 + Number(tm[2]);
        const end = Number(tm[3]) * 60 + Number(tm[4]);
        if (end >= start ? now >= start && now < end : now >= start || now < end) return true;
      }
    }
    return sawApplicableRule ? false : null;
  }

  function getPlaceMeta(card) {
    const id = card.getAttribute('data-id') || '';
    const place = (typeof PLACES_DATA !== 'undefined' && PLACES_DATA[id]) ? PLACES_DATA[id] : null;
    const name = (card.getAttribute('data-name') || place?.name || '').toLowerCase();
    const cat = (card.getAttribute('data-category') || place?.category || '').toLowerCase();
    const best = (place?.bestTime || '').toLowerCase();
    const tip = (place?.studentTip || '').toLowerCase();
    const desc = (place?.description || '').toLowerCase();
    const attrVibes = (card.getAttribute('data-vibes') || '').split(',').map(s => s.trim()).filter(Boolean);
    const vibes = Array.isArray(place?.vibes) && place.vibes.length
      ? place.vibes.map(String)
      : attrVibes;
    const timeOfDay = (place?.timeOfDay || card.getAttribute('data-time') || '').toLowerCase();
    // Pull any cached student review text for this place (helps auto-sort from real comments)
    let reviewBlob = '';
    try {
      const stored = typeof getStoredReviews === 'function' ? getStoredReviews() : {};
      const list = stored[id] || [];
      reviewBlob = list.map(r => `${r.comment || ''} ${r.highlight || ''}`).join(' ').toLowerCase();
    } catch { /* ignore */ }
    const blob = [name, cat, best, tip, desc, reviewBlob, vibes.join(' '), timeOfDay].join(' ');
    return { id, name, cat, best, tip, desc, vibes, timeOfDay, blob, reviewBlob, openingHours: place?.osmTags?.opening_hours || place?.opening_hours || '' };
  }

  function nightScore(meta) {
    let score = 0;
    if (meta.timeOfDay.includes('night') || meta.timeOfDay.includes('evening')) score += 40;
    if (meta.vibes.some(v => /night|evening|food|hangout|street-food/.test(v))) score += 35;
    if (NIGHT_SIGNALS.test(meta.blob)) score += 30;
    if (EVENING_OK.test(meta.blob) && meta.cat === 'food') score += 25;
    if (meta.cat === 'food' && /street|cafe|café|dinner|church/.test(meta.name + meta.blob)) score += 15;
    if (meta.cat === 'entertainment') score += 20;
    if (STRICT_MORNING_BLOCK.test(meta.blob) || meta.vibes.includes('morning') || meta.vibes.includes('sunrise')) score -= 50;
    if (meta.cat === 'nature' || meta.cat === 'getaways') score -= 25;
    if (MORNING_SIGNALS.test(meta.best) && !NIGHT_SIGNALS.test(meta.best)) score -= 20;
    // Student comments mentioning night/dinner boost
    if (/night|dinner|late|evening hang/.test(meta.reviewBlob)) score += 20;
    if (/sunrise|morning walk|early morning/.test(meta.reviewBlob)) score -= 25;
    return score;
  }

  function isLateNightFriendly(card) {
    const meta = getPlaceMeta(card);
    // Explicit tags win
    if (meta.timeOfDay === 'morning' || meta.vibes.includes('sunrise') || meta.vibes.includes('morning')) {
      // Food can still be evening even if somewhere mentions morning — only block pure morning places
      if (meta.cat === 'nature' || meta.cat === 'getaways' || meta.timeOfDay === 'morning') return false;
    }
    return nightScore(meta) >= 20;
  }

  function isMorningFriendly(card) {
    const meta = getPlaceMeta(card);
    if (meta.vibes.includes('morning') || meta.vibes.includes('sunrise') || meta.timeOfDay === 'morning') return true;
    if (STRICT_MORNING_BLOCK.test(meta.blob)) return true;
    if (meta.cat === 'nature' && MORNING_SIGNALS.test(meta.blob)) return true;
    return false;
  }

  function applyFiltersLegacy() {
    let visibleCount = 0;
    const rawQuery = currentState.query;
    const parsedQuery = parseSearchQuery(rawQuery);
    const cards = document.querySelectorAll('.place-card');

    cards.forEach(card => {
      const cardCategory = card.getAttribute('data-category') || '';
      const cardBudgetBracket = card.getAttribute('data-budget') || '';
      const cardName = (card.getAttribute('data-name') || '').toLowerCase();
      const cardText = card.textContent.toLowerCase();
      const cardMin = parseInt(card.getAttribute('data-min'), 10) || 0;
      const cardMax = parseInt(card.getAttribute('data-max'), 10) || 9999;
      const cardDistance = parseFloat(card.getAttribute('data-distance')) || 0;

      const matchesCategory = (currentState.category === 'all') || (cardCategory === currentState.category);
      const matchesBudgetSection = (currentState.budget === 'all') || (cardBudgetBracket === currentState.budget);

      let matchesDistance = true;
      if (currentState.maxDistanceKm !== 'all') {
        const maxDist = parseFloat(currentState.maxDistanceKm);
        matchesDistance = cardDistance <= maxDist;
      }

      let matchesSearch = true;
      if (parsedQuery.hasBudgetConstraint) {
        if (parsedQuery.isFreeOnly) {
          matchesSearch = (cardMin === 0);
        } else if (parsedQuery.minBudget !== null && parsedQuery.maxBudget !== null) {
          matchesSearch = (cardMin <= parsedQuery.maxBudget && cardMax >= parsedQuery.minBudget);
        } else if (parsedQuery.maxBudget !== null) {
          matchesSearch = (cardMin <= parsedQuery.maxBudget);
        } else if (parsedQuery.minBudget !== null) {
          matchesSearch = (cardMax >= parsedQuery.minBudget);
        }

        if (matchesSearch && parsedQuery.textQuery) {
          matchesSearch = cardName.includes(parsedQuery.textQuery) || cardText.includes(parsedQuery.textQuery);
        }
      } else if (parsedQuery.categoryHint) {
        // "food" / "park" etc. → match category OR text, so all food spots show
        const hint = parsedQuery.categoryHint;
        matchesSearch = (cardCategory === hint) ||
          cardName.includes(parsedQuery.textQuery) ||
          cardText.includes(parsedQuery.textQuery) ||
          cardText.includes(hint);
      } else if (parsedQuery.textQuery) {
        const q = parsedQuery.textQuery;
        const tokens = q.split(/\s+/).filter(Boolean);
        matchesSearch = tokens.every(t => cardName.includes(t) || cardText.includes(t) || cardCategory.includes(t));
      }

      // Tab category still applies unless search already targeted a category
      const catOk = parsedQuery.categoryHint
        ? true
        : matchesCategory;

      // Search time intent (sunrise vs nightlife) without needing comments
      if (parsedQuery.timeHint === 'morning') {
        matchesSearch = matchesSearch && isMorningFriendly(card);
      } else if (parsedQuery.timeHint === 'night') {
        matchesSearch = matchesSearch && isLateNightFriendly(card);
      }

      // Collection chips (Go today / Free / under ₹150 / food / favourites)
      let matchesCollection = true;
      const col = currentState.collection || 'all';
      if (col === 'free') matchesCollection = cardMin <= 30 || cardMax <= 50;
      else if (col === 'under150') matchesCollection = cardMin <= 150;
      else if (col === 'under300') matchesCollection = cardMin <= 300;
      else if (col === 'food') matchesCollection = cardCategory === 'food';
      else if (col === 'late') {
        matchesCollection = isLateNightFriendly(card);
        // Rank true night spots higher when this filter is on
        if (matchesCollection) {
          const sc = nightScore(getPlaceMeta(card));
          card.dataset.relevance = String(Math.max(parseFloat(card.dataset.relevance) || 0, sc));
        }
      } else if (col === 'favourites') {
        matchesCollection = (typeof getFavourites === 'function') && getFavourites().includes(card.getAttribute('data-id'));
      } else if (col === 'open-now') {
        matchesCollection = listedOpenNow(getPlaceMeta(card)) === true;
      }

      // Relevance score for search ranking
      let relevance = 0;
      if (parsedQuery.textQuery) {
        const q = parsedQuery.textQuery;
        if (cardName === q) relevance += 100;
        else if (cardName.startsWith(q)) relevance += 60;
        else if (cardName.includes(q)) relevance += 40;
        q.split(/\s+/).filter(Boolean).forEach(t => {
          if (cardName.includes(t)) relevance += 15;
          if (cardText.includes(t)) relevance += 5;
          if (cardCategory.includes(t)) relevance += 10;
        });
      }
      if (parsedQuery.categoryHint && cardCategory === parsedQuery.categoryHint) relevance += 25;
      card.dataset.relevance = String(relevance);

      if (catOk && matchesBudgetSection && matchesDistance && matchesSearch && matchesCollection) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Sort: search relevance first, then distance when location/near intent
    const grid = document.getElementById('placesGrid');
    if (grid) {
      const visible = [...grid.querySelectorAll('.place-card')].filter(c => c.style.display !== 'none');
      const wantNear = !!(currentState.liveCoords) || /near/i.test(rawQuery || '') || currentState.sortBy === 'distance-asc';
      const wantLate = (currentState.collection || '') === 'late';
      visible.sort((a, b) => {
        const relA = parseFloat(a.dataset.relevance) || 0;
        const relB = parseFloat(b.dataset.relevance) || 0;
        if ((parsedQuery.textQuery || wantLate) && relB !== relA) return relB - relA;
        if (wantNear) {
          return (parseFloat(a.dataset.distance) || 999) - (parseFloat(b.dataset.distance) || 999);
        }
        return 0;
      });
      orderCards(grid, visible);
    }

    if (noResultsState) {
      noResultsState.style.display = (visibleCount === 0) ? 'block' : 'none';
    }

    updateFilterBanner(visibleCount, parsedQuery);
  }

  // ---- Search engine glue (see /explorer/search-engine.js) ---------------------------------------------
  // The engine only reads each place's OWN data (name, area, category, description, tips, reviews). The old code
  // searched the visible card text, which always contains "X km from <your start point>", so typing
  // "Koramangala" matched every card.
  const SEARCH_KEY_FIELDS = ['id', 'name', 'description', 'location', 'area', 'category', 'lat', 'lng', 'minBudget', 'maxBudget', 'famousFor', 'studentTip', 'tip', 'bestTime', 'locationPrecision', 'rating'];

  function reviewTextFor(place) {
    try {
      const stored = typeof getStoredReviews === 'function' ? getStoredReviews() : {};
      const list = (stored && stored[place.id]) || [];
      return list.map(r => `${r.comment || ''} ${r.highlight || ''}`).join(' ');
    } catch { return ''; }
  }

  function getSearchIndex() {
    const places = Object.values(PLACES_DATA || {}).filter(p => p && p.id && p.name);
    let h = 5381;
    const mix = (str) => { for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; };
    places.forEach(p => { SEARCH_KEY_FIELDS.forEach(k => mix(String(p[k] == null ? '' : p[k]) + '|')); mix(String(reviewTextFor(p).length)); });
    const sig = places.length + ':' + h;
    // New places (added by students or the admin) change the signature, so the index rebuilds automatically.
    if (searchIndexCache.sig !== sig || !searchIndexCache.index) {
      searchIndexCache = { sig, index: window.SESearch.buildIndex(places, { reviewsFor: reviewTextFor }) };
    }
    return searchIndexCache.index;
  }
  window.__seInvalidateSearch = () => { searchIndexCache = { sig: '', index: null }; };

  function categoryOnlyQuery(result) {
    if (!result || !result.tokens.length) return false;
    return result.tokens.every(t => (window.SESearch.CONCEPTS || []).some(c => c.category && c.words.includes(t)));
  }

  function applyFilters() {
    if (!window.SESearch) return applyFiltersLegacy();
    const rawQuery = (currentState.query || '').trim();
    const parsedQuery = parseSearchQuery(rawQuery);
    const cards = [...document.querySelectorAll('.place-card')];

    let result = null;
    const matchById = new Map();
    if (rawQuery) {
      try {
        result = window.SESearch.search(rawQuery, getSearchIndex());
        result.results.forEach((r, i) => matchById.set(r.id, Object.assign({ rank: i }, r)));
      } catch (err) { console.warn('search failed', err); result = null; }
    }
    lastSearch = result;
    const catOverride = categoryOnlyQuery(result);

    let visibleCount = 0;
    cards.forEach(card => {
      const id = card.getAttribute('data-id') || '';
      const cardCategory = card.getAttribute('data-category') || '';
      const cardBudgetBracket = card.getAttribute('data-budget') || '';
      const cardMin = parseInt(card.getAttribute('data-min'), 10) || 0;
      const cardMax = parseInt(card.getAttribute('data-max'), 10) || 9999;
      const cardDistance = parseFloat(card.getAttribute('data-distance')) || 0;

      const matchesCategory = (currentState.category === 'all') || (cardCategory === currentState.category) || catOverride;
      const matchesBudgetSection = (currentState.budget === 'all') || (cardBudgetBracket === currentState.budget);
      let matchesDistance = true;
      if (currentState.maxDistanceKm !== 'all') matchesDistance = cardDistance <= parseFloat(currentState.maxDistanceKm);

      const m = matchById.get(id);
      let matchesSearch = !rawQuery || !!m;
      // Time intent ("sunrise", "late night") narrows the already-matched list
      if (matchesSearch && parsedQuery.timeHint === 'morning') matchesSearch = isMorningFriendly(card);
      else if (matchesSearch && parsedQuery.timeHint === 'night') matchesSearch = isLateNightFriendly(card);

      let matchesCollection = true;
      const col = currentState.collection || 'all';
      if (col === 'free') matchesCollection = cardMin <= 30 || cardMax <= 50;
      else if (col === 'under150') matchesCollection = cardMin <= 150;
      else if (col === 'under300') matchesCollection = cardMin <= 300;
      else if (col === 'food') matchesCollection = cardCategory === 'food';
      else if (col === 'late') matchesCollection = isLateNightFriendly(card);
      else if (col === 'favourites') matchesCollection = (typeof getFavourites === 'function') && getFavourites().includes(id);
      else if (col === 'open-now') matchesCollection = listedOpenNow(getPlaceMeta(card)) === true;

      card.dataset.relevance = m ? String(1000 - m.rank) : '0';
      const show = matchesCategory && matchesBudgetSection && matchesDistance && matchesSearch && matchesCollection;
      card.style.display = show ? 'flex' : 'none';
      if (show) visibleCount++;
      annotateMatch(card, show ? m : null);
    });

    // Order: best match first while a search is active (unless the visitor explicitly chose another sort)
    const grid = document.getElementById('placesGrid');
    if (grid && rawQuery && result && !currentState.sortExplicit) {
      const visible = [...grid.querySelectorAll('.place-card')].filter(c => c.style.display !== 'none');
      visible.sort((a, b) => (parseFloat(b.dataset.relevance) || 0) - (parseFloat(a.dataset.relevance) || 0));
      orderCards(grid, visible);
    }

    if (noResultsState) {
      noResultsState.style.display = (visibleCount === 0) ? 'block' : 'none';
      renderDidYouMean(visibleCount === 0 ? result : null);
    }
    updateFilterBanner(visibleCount, parsedQuery);
  }

  function annotateMatch(card, m) {
    let note = card.querySelector('.se-match-note');
    if (!m) { if (note) note.remove(); return; }
    const bits = [];
    if (m.distKm != null && lastSearch && lastSearch.area) bits.push(`📍 ${m.distKm < 1 ? Math.round(m.distKm * 1000) + ' m' : m.distKm.toFixed(1) + ' km'} from ${lastSearch.area.name}`);
    if (!m.exact && lastSearch && lastSearch.tokens.length) bits.push('Similar match');
    if (m.reasons && m.reasons.length && lastSearch && lastSearch.tokens.length) bits.push(m.reasons[0]);
    if (!bits.length) { if (note) note.remove(); return; }
    if (!note) {
      note = document.createElement('div'); note.className = 'se-match-note';
      // v15: stack the match note with the other top-left tags so nothing overlaps.
      const media = card.querySelector('.place-media');
      let tags = media && media.querySelector('.place-media-tags');
      if (media && !tags) {
        tags = document.createElement('div'); tags.className = 'place-media-tags';
        media.insertBefore(tags, media.firstChild);
        media.querySelectorAll(':scope > .community-badge, :scope > .card-distance-tag').forEach(el => tags.appendChild(el));
      }
      if (tags) tags.appendChild(note); else card.insertBefore(note, card.firstChild);
    }
    note.textContent = bits.slice(0, 2).join(' · ');
    note.classList.toggle('is-similar', !m.exact);
  }

  function renderDidYouMean(result) {
    const host = document.getElementById('didYouMeanLine');
    if (!host) return;
    host.innerHTML = '';
    if (!result || !result.didYouMean) { host.style.display = 'none'; return; }
    host.style.display = 'block';
    const label = result.didYouMean.label;
    host.innerHTML = 'Did you mean <button type="button" class="se-dym-btn"></button>?';
    const btn = host.querySelector('button');
    btn.textContent = label;
    btn.addEventListener('click', () => runSearch(label, { scroll: true }));
  }

  function runSearch(text, { scroll = false, remember = true } = {}) {
    currentState.query = text;
    currentState.sortExplicit = false;
    [searchInput, document.getElementById('topSearchInput')].forEach(el => { if (el && el.value !== text) el.value = text; });
    if (clearSearchBtn) clearSearchBtn.style.display = text ? 'block' : 'none';
    if (remember && text.trim().length >= 2) rememberSearch(text.trim());
    applyFiltersAndSort();
    if (scroll) scrollToPlaces();
  }

  const RECENT_KEY = 'se_recent_searches_v2';
  try { localStorage.removeItem('se_recent_searches_v1'); /* v1 was shared by every account on this device */ } catch { /* ignore */ }
  function getRecentSearches() { try { const v = JSON.parse(sessionStorage.getItem(scopedKey(RECENT_KEY)) || '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, 6) : []; } catch { return []; } }
  function rememberSearch(q) {
    try {
      const list = getRecentSearches().filter(x => x.toLowerCase() !== q.toLowerCase());
      list.unshift(q);
      sessionStorage.setItem(scopedKey(RECENT_KEY), JSON.stringify(list.slice(0, 6)));
    } catch { /* private mode */ }
  }
  function clearRecentSearches() { try { sessionStorage.removeItem(scopedKey(RECENT_KEY)); localStorage.removeItem(scopedKey(RECENT_KEY)); } catch { /* ignore */ } }
  // v17: recent searches live per browser tab (sessionStorage). Remove the old shared list once so nobody sees it again.
  try { localStorage.removeItem(scopedKey(RECENT_KEY)); } catch { /* ignore */ }

  function updateFilterBanner(count, parsedQuery) {
    if (!filterNotification || !filterNotificationText) return;

    const isFiltered = (currentState.category !== 'all') ||
                       (currentState.budget !== 'all') ||
                       (currentState.maxDistanceKm !== 'all') ||
                       (currentState.collection && currentState.collection !== 'all') ||
                       (currentState.query !== '');
    if (!isFiltered) { filterNotification.style.display = 'none'; return; }

    const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
    const origin = getActiveOrigin();
    const parts = [];
    const s = lastSearch;
    let headline = '';
    if (currentState.query && s) {
      if (s.area && s.nearestFallback) {
        headline = `Nothing is listed in ${s.area.name} yet, so here are the ${plural(count, 'nearest place')}. Know a good spot there? Add it!`;
      } else if (s.area && !s.tokens.length) {
        headline = `Showing ${plural(count, 'place')} in & around ${s.area.name}, closest first.`;
      } else if (s.area) {
        headline = `Showing ${plural(count, 'match')} for “${s.tokens.join(' ')}” in & around ${s.area.name}.`;
      } else if (s.tokens.length && s.similar > 0 && count > 0) {
        headline = `${plural(Math.min(count, s.exact), 'close match')}${s.exact === 0 ? 'es' : ''} plus ${s.similar} with a similar description for “${currentState.query}”.`.replace('close matches plus', 'close matches, plus');
        if (s.exact === 0) headline = `No exact match for “${currentState.query}”. Showing ${plural(count, 'place')} with a similar description.`;
      } else if (s.tokens.length) {
        headline = `Showing ${plural(count, 'place')} matching “${currentState.query}”.`;
      }
      if (s.intent && s.intent.hasBudget) {
        if (s.intent.free) parts.push('free entry');
        else if (s.intent.min != null && s.intent.max != null) parts.push(`budget ₹${s.intent.min}–₹${s.intent.max}`);
        else if (s.intent.max != null) parts.push(`under ₹${s.intent.max} / person`);
        else if (s.intent.min != null) parts.push(`above ₹${s.intent.min}`);
      }
    } else if (currentState.query) {
      parts.push(`keyword “${currentState.query}”`);
    }
    if (currentState.maxDistanceKm !== 'all') parts.push(`within ${currentState.maxDistanceKm} km of ${origin.name}`);
    if (currentState.category !== 'all') parts.push(`category “${currentState.category}”`);
    if (currentState.budget !== 'all' && !(s && s.intent && s.intent.hasBudget)) parts.push(`budget bracket “${currentState.budget}”`);
    if (currentState.collection && currentState.collection !== 'all') parts.push(`collection “${currentState.collection}”`);

    let text = headline;
    if (parts.length) text += (text ? ' Filters: ' : `Showing ${plural(count, 'place')} fitting `) + parts.join(' & ') + '.';
    if (!text) text = `Showing ${plural(count, 'place')}.`;
    filterNotificationText.textContent = text;
    filterNotification.style.display = 'flex';
  }

  function sortPlaceCards(sortBy) {
    if (!placesGrid) return;
    // While a search is active, best match first wins over the default distance sort.
    if ((currentState.query || '').trim() && lastSearch && !currentState.sortExplicit) return;
    const cardsArray = Array.from(document.querySelectorAll('.place-card'));

    cardsArray.sort((a, b) => {
      if (sortBy === 'distance-asc') {
        const distA = parseFloat(a.getAttribute('data-distance')) || 0;
        const distB = parseFloat(b.getAttribute('data-distance')) || 0;
        return distA - distB;
      }
      if (sortBy === 'budget-asc') {
        const minA = parseInt(a.getAttribute('data-min'), 10) || 0;
        const minB = parseInt(b.getAttribute('data-min'), 10) || 0;
        return minA - minB;
      }
      if (sortBy === 'rapido-asc') {
        const rapA = parseFloat(a.getAttribute('data-rapido')) || 0;
        const rapB = parseFloat(b.getAttribute('data-rapido')) || 0;
        return rapA - rapB;
      }
      if (sortBy === 'rating-desc') {
        const ratA = parseFloat(a.getAttribute('data-rating')) || 0;
        const ratB = parseFloat(b.getAttribute('data-rating')) || 0;
        return ratB - ratA;
      }
      return 0;
    });

    orderCards(placesGrid, cardsArray);
  }

  // ============================================================================
  // 12. EVENT LISTENERS: LOCATION, SEARCH & SORT CONTROLS
  // ============================================================================

  /**
   * Browser Geolocation detection via HTML5 navigator.geolocation API
   * with automatic IP Geolocation fallback & continuous live watchPosition tracking
   */
  // Most accurate position the device can give: samples high-accuracy GPS for a few seconds and keeps the best fix.
  function getBestPosition({ goodEnoughM = 25, maxWaitMs = 15000 } = {}) {
    // The live-GPS watcher is already tracking the visitor. If it has a fresh, sharp reading, use it right away
    // (instant Verify Visit / Detect, and no second GPS request competing for the chip).
    const lc = currentState.liveCoords;
    if (lc && lc.ts && Date.now() - lc.ts < 6000 && Number.isFinite(lc.accuracy) && lc.accuracy <= 50) {
      return Promise.resolve({ lat: lc.lat, lng: lc.lng, accuracy: lc.accuracy });
    }
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('GPS is not supported in this browser.')); return; }
      let best = null, finished = false, watchId = null, lastErr = null;
      const timer = setTimeout(() => finish(), maxWaitMs);
      function finish(err) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        if (best) resolve(best); else reject(err || lastErr || new Error('Could not get a GPS fix.'));
      }
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const c = pos.coords;
          const fix = { lat: c.latitude, lng: c.longitude, accuracy: Number.isFinite(c.accuracy) ? c.accuracy : 9999 };
          if (!best || fix.accuracy < best.accuracy) best = fix;
          if (best.accuracy <= goodEnoughM) finish();
        },
        (err) => { lastErr = err; if (err && err.code === 1) finish(err); },
        { enableHighAccuracy: true, maximumAge: 0, timeout: maxWaitMs }
      );
    });
  }
  const BLR_CENTRE = { lat: 12.9716, lng: 77.5946 };
  const kmFromBengaluru = (lat, lng) => calculateDistanceKm(BLR_CENTRE.lat, BLR_CENTRE.lng, lat, lng);
  const accuracyText = (m) => (Number.isFinite(m) ? (m < 1000 ? `±${Math.round(m)} m` : `±${(m / 1000).toFixed(1)} km`) : '');

  let watchPositionId = null;

  // Runs a DOM-changing function while keeping whatever the visitor is looking at exactly where it is on screen.
  function withScrollAnchor(fn) {
    const cards = [...document.querySelectorAll('.place-card')].filter(c => c.offsetParent !== null);
    const anchor = cards.find(c => c.getBoundingClientRect().bottom > 60);
    const before = anchor ? anchor.getBoundingClientRect().top : 0;
    fn();
    if (anchor && anchor.isConnected && anchor.offsetParent !== null) {
      const d = anchor.getBoundingClientRect().top - before;
      if (Math.abs(d) > 1) window.scrollBy({ top: d, left: 0, behavior: 'instant' });
    }
  }

  // Re-sorting the list while someone is reading it makes the page jump. So when the visitor is inside the list we update
  // distances and fares in place and re-sort only once the list is completely out of view.
  function armPendingResort() {
    currentState.pendingResort = true;
    if (window.__resortObs) return;
    const grid = document.getElementById('placesGrid');
    if (!grid || !('IntersectionObserver' in window)) { currentState.pendingResort = false; applyFiltersAndSort(); return; }
    const obs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting && currentState.pendingResort) {
        currentState.pendingResort = false; obs.disconnect(); window.__resortObs = null;
        applyFiltersAndSort();
      }
    });
    obs.observe(grid); window.__resortObs = obs;
  }

  function setLiveLocationFromCoords(lat, lng, sourceLabel = "Current GPS", accuracy = NaN, opts = {}) {
    const quiet = Boolean(opts.quiet);
    currentState.liveCoords = { lat, lng, accuracy, ts: Date.now() };
    currentState.userLocationKey = 'current_location';
    if (quiet) {
      // A background GPS update: refresh the small status texts, but only redraw the list after a REAL move (150 m+),
      // at most every 15 s, without re-sorting by force and without ever moving the page.
      if (userLocationSelect) {
        const o = userLocationSelect.querySelector('option[value="current_location"]');
        if (o) o.textContent = `📍 My Live Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
      }
      const last = currentState.lastRefreshCoords;
      const moved = last ? calculateDistanceKm(last.lat, last.lng, lat, lng) * 1000 : Infinity;
      const sharper = last && Number.isFinite(last.accuracy) && Number.isFinite(accuracy) && accuracy < last.accuracy - 5;
      if ((moved < 10 && !sharper) || Date.now() - (currentState.lastLiveRefresh || 0) < 3000) return;
      currentState.lastRefreshCoords = { lat, lng, accuracy }; currentState.lastLiveRefresh = Date.now();
      const syncMoved = currentState.lastBackendSync ? calculateDistanceKm(currentState.lastBackendSync.lat, currentState.lastBackendSync.lng, lat, lng) * 1000 : Infinity;
      if (syncMoved >= 50) currentState.lastBackendSync = { lat, lng };
      withScrollAnchor(() => updateCardsDistanceAndTransit({ keepOrder: true, skipBackend: syncMoved < 50 }));
      if (heroLocationStatus) heroLocationStatus.textContent = `Live GPS: Exploring from your current location (${lat.toFixed(4)}, ${lng.toFixed(4)}${Number.isFinite(accuracy) ? ', ' + accuracyText(accuracy) : ''})`;
      armPendingResort();
      return;
    }
    currentState.lastRefreshCoords = { lat, lng, accuracy }; currentState.lastLiveRefresh = Date.now();

    // Add or select "current_location" option in userLocationSelect
    if (userLocationSelect) {
      let gpsOption = userLocationSelect.querySelector('option[value="current_location"]');
      if (!gpsOption) {
        gpsOption = document.createElement('option');
        gpsOption.value = 'current_location';
        userLocationSelect.prepend(gpsOption);
      }
      gpsOption.textContent = `📍 My Live Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
      userLocationSelect.value = 'current_location';
    }

    // De-activate static campus quick chips
    locChips.forEach(c => c.classList.remove('active'));

    // Update button states
    if (detectGpsBtn) {
      detectGpsBtn.classList.add('active');
      detectGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>Live Location Active</span>';
    }
    if (heroGpsBtn) {
      heroGpsBtn.classList.add('active');
      heroGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>Live Location Active</span>';
    }

    // Update hero status badge
    if (heroLocationStatus) {
      heroLocationStatus.textContent = `Live GPS: Exploring from your current location (${lat.toFixed(4)}, ${lng.toFixed(4)}${Number.isFinite(accuracy) ? ', ' + accuracyText(accuracy) : ''})`;
    }

    const gpsTrackingStatus = document.getElementById('gpsTrackingStatus');
    if (gpsTrackingStatus) {
      gpsTrackingStatus.style.display = 'inline-flex';
      const gpsTrackingText = document.getElementById('gpsTrackingText');
      if (gpsTrackingText) gpsTrackingText.textContent = `Tracking active (${sourceLabel})`;
    }

    currentState.sortBy = 'distance-asc';
    const sortBySelect = document.getElementById('sortBySelect');
    if (sortBySelect) sortBySelect.value = 'distance-asc';
    if (window.scrollY >= 700) { withScrollAnchor(() => updateCardsDistanceAndTransit()); armPendingResort(); } // scrolled down: keep what they are reading in place
    else { updateCardsDistanceAndTransit(); applyFiltersAndSort(); scrollToPlaces(); } // still at the top: guide them to the nearby list
    // Visually highlight places within 8 km
    document.querySelectorAll('.place-card').forEach(card => {
      const d = parseFloat(card.dataset.distance);
      const badge = card.querySelector('.nearby-badge');
      if (Number.isFinite(d) && d <= 8) {
        card.classList.add('nearby-highlight');
        if (!badge) {
          const b = document.createElement('span');
          b.className = 'nearby-badge';
          b.textContent = 'NEAR YOU';
          // Inside the photo (bottom-left) so it never collides with the Sponsored strip or the other badges.
          const media = card.querySelector('.place-media');
          if (media) media.appendChild(b); else { card.style.position = card.style.position || 'relative'; card.prepend(b); }
        }
      } else {
        card.classList.remove('nearby-highlight');
        if (badge) badge.remove();
      }
    });
    if (!currentState.nearbyAnnounced) {
      currentState.nearbyAnnounced = true;
      const near = [...document.querySelectorAll('.place-card')].filter(c => parseFloat(c.dataset.distance) <= 10).length;
      showToast(near ? `📍 ${near} place${near === 1 ? '' : 's'} within 10 km of you, nearest first.` : '📍 Showing places sorted by distance from you.');
    }
  }

  // Friendly, visible help when the device reports a place far from Bengaluru: explain why and let them pick their area.
  function showLocationWrongHelp(awayKm, accuracy) {
    showToast(`📍 Your device says you are about ${awayKm} km from Bengaluru. That is usually a wrong Wi-Fi/network guess on devices without GPS. Please choose your area below.`);
    const sel = document.getElementById('userLocationSelect');
    if (sel) { sel.closest('section, .location-picker, div')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => sel.focus(), 500); }
    if (heroLocationStatus) heroLocationStatus.textContent = `Your device reported a location ${awayKm} km away, so we ignored it. Choose your Bengaluru area to continue.`;
  }

  async function detectUserLiveLocation() {
    if (detectGpsBtn) {
      detectGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>Acquiring location...</span>';
    }
    if (heroGpsBtn) {
      heroGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>Acquiring location...</span>';
    }

    // Helper: Network IP Geolocation fallback (city-level only, so it is never treated as exact)
    async function tryNetworkFallback(fallbackReason) {
      try {
        const res = await fetch('/api/maps/ip-location');
        if (res.ok) {
          const data = await res.json();
          if (data && data.latitude && data.longitude) {
            if (data.inBengaluru === false) {
              // A network guess outside Bengaluru would make every distance wrong: do not use it.
              fallbackReason = `Your network points to ${data.city || 'another city'}, outside Bengaluru, so it can't give accurate distances. Pick your campus area or type your area below.`;
            } else {
              // A city-level network guess is a RANGE, not your position, so it is never used for distances.
              fallbackReason = 'Exact GPS is needed for accurate distances. Allow location for this site in your browser settings, or pick your area below.';
            }
          }
        }
      } catch (e1) {
        console.warn('Network location failed:', e1);
      }

    // If both fail:
      if (detectGpsBtn) {
        detectGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>Use My Live Location</span>';
        detectGpsBtn.classList.remove('active');
      }
      if (heroGpsBtn) {
        heroGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>📍 Detect My Live Location</span>';
        heroGpsBtn.classList.remove('active');
      }
      showToast(fallbackReason || 'Could not determine location automatically. Please select your campus area below.');
      const areaSel = document.getElementById('userLocationSelect'); if (areaSel && window.scrollY < 700) { areaSel.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }

    if (!navigator.geolocation) {
      await tryNetworkFallback('Browser does not support direct GPS.');
      return;
    }

    try {
      // High-accuracy sampling (up to ~10 s) keeps the best fix instead of the first coarse Wi-Fi/cell guess.
      const fix = await getBestPosition();
      const away = kmFromBengaluru(fix.lat, fix.lng);
      if (away > 60) {
        // Laptops and tablets without GPS often report a Wi-Fi / network guess that can be in another city (e.g. Delhi).
        // Using it would make every distance and fare wrong, so we do NOT adopt it and ask for the area instead.
        if (detectGpsBtn) { detectGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>Use My Live Location</span>'; detectGpsBtn.classList.remove('active'); }
        if (heroGpsBtn) { heroGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>📍 Detect My Live Location</span>'; heroGpsBtn.classList.remove('active'); }
        showLocationWrongHelp(Math.round(away), fix.accuracy);
        return;
      }
      setLiveLocationFromCoords(fix.lat, fix.lng, 'Device GPS', fix.accuracy);
      if (fix.accuracy > 150) showToast(`📍 Location found (${accuracyText(fix.accuracy)}) and still sharpening. Distances will update as your GPS gets more exact. Stepping outside helps.`);
      else showToast(`📍 Exact live location locked (${accuracyText(fix.accuracy)}). Distances are measured from where you are right now.`);

      // Keep following the user, but ignore jumpy low-accuracy readings
      if (navigator.geolocation.watchPosition && !watchPositionId) {
        try {
          watchPositionId = navigator.geolocation.watchPosition(
            (pos) => {
              const { latitude: newLat, longitude: newLng, accuracy } = pos.coords;
              const cur = currentState.liveCoords;
              if (kmFromBengaluru(newLat, newLng) > 60) return; // ignore a later fix that jumps outside Bengaluru
              // Skip only clearly worse readings (a sudden coarse Wi-Fi/cell guess); otherwise follow the exact GPS point.
              if (cur && Number.isFinite(cur.accuracy) && accuracy > Math.max(100, cur.accuracy * 3)) return;
              if (cur) cur.ts = Date.now(); // the watcher is alive and the reading is plausible: keep it "fresh" even if you stand still
              const movedM = cur ? calculateDistanceKm(newLat, newLng, cur.lat, cur.lng) * 1000 : Infinity;
              const sharper = cur && Number.isFinite(cur.accuracy) && accuracy < cur.accuracy - 5;
              if (!cur || movedM >= 8 || sharper) {
                setLiveLocationFromCoords(newLat, newLng, 'Live Continuous', accuracy, { quiet: true });
              }
            },
            (err) => console.warn('watchPosition notice:', err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
          );
        } catch (e) {
          console.warn('watchPosition not permitted:', e);
        }
      }
    } catch (error) {
      console.warn('Direct GPS unavailable:', error && error.code, error && error.message);
      let msg = 'Exact GPS is unavailable on this device. Please pick your area below so distances start from the right place.';
      if (error && error.code === 1) msg = 'Location permission was denied. Allow location for this site in your browser settings, or pick your area below.';
      await tryNetworkFallback(msg);
    }
  }

  // Wire GPS trigger buttons
  if (detectGpsBtn) {
    detectGpsBtn.addEventListener('click', detectUserLiveLocation);
  }

  if (heroGpsBtn) {
    heroGpsBtn.addEventListener('click', () => {
      detectUserLiveLocation();
      document.getElementById('places')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const refreshGpsBtn = document.getElementById('refreshGpsBtn');
  if (refreshGpsBtn) {
    refreshGpsBtn.addEventListener('click', detectUserLiveLocation);
  }

  if (userLocationSelect) {
    userLocationSelect.addEventListener('change', (e) => {
      currentState.userLocationKey = e.target.value;
      if (currentState.userLocationKey !== 'current_location') {
        if (watchPositionId && navigator.geolocation.clearWatch) {
          navigator.geolocation.clearWatch(watchPositionId);
          watchPositionId = null;
        }
        const gpsTrackingStatus = document.getElementById('gpsTrackingStatus');
        if (gpsTrackingStatus) gpsTrackingStatus.style.display = 'none';

        if (detectGpsBtn) {
          detectGpsBtn.classList.remove('active');
          detectGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>Use My Live Location</span>';
        }
        if (heroGpsBtn) {
          heroGpsBtn.classList.remove('active');
          heroGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>📍 Detect My Live Location</span>';
        }
        if (heroLocationStatus) {
          const locObj = BENGALURU_LOCATIONS[currentState.userLocationKey];
          heroLocationStatus.textContent = locObj ? `Exploring from ${locObj.name}` : 'Currently exploring Bengaluru';
        }
      }
      locChips.forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('data-loc') === currentState.userLocationKey);
      });
      const origin = getActiveOrigin();
      showToast(`Recalculated transit & distances from ${origin.name}!`);
      updateCardsDistanceAndTransit();
    });
  }

  locChips.forEach(chip => {
    chip.addEventListener('click', () => {
      locChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const locKey = chip.getAttribute('data-loc');
      if (locKey && BENGALURU_LOCATIONS[locKey]) {
        currentState.userLocationKey = locKey;
        if (userLocationSelect) userLocationSelect.value = locKey;
        if (watchPositionId && navigator.geolocation.clearWatch) {
          navigator.geolocation.clearWatch(watchPositionId);
          watchPositionId = null;
        }
        const gpsTrackingStatus = document.getElementById('gpsTrackingStatus');
        if (gpsTrackingStatus) gpsTrackingStatus.style.display = 'none';

        if (detectGpsBtn) {
          detectGpsBtn.classList.remove('active');
          detectGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>Use My Live Location</span>';
        }
        if (heroGpsBtn) {
          heroGpsBtn.classList.remove('active');
          heroGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>📍 Detect My Live Location</span>';
        }
        if (heroLocationStatus) {
          heroLocationStatus.textContent = `Exploring from ${BENGALURU_LOCATIONS[locKey].name}`;
        }
        showToast(`Starting point set to ${BENGALURU_LOCATIONS[locKey].name}!`);
        updateCardsDistanceAndTransit();
      }
    });
  });

  // ============================================================================
  // MANUAL STARTING LOCATION & MODE SWITCHING
  // Allows student to type ANY starting area/college/metro in Bengaluru
  // ============================================================================
  if (locModePresetBtn && locModeManualBtn) {
    locModePresetBtn.addEventListener('click', () => {
      locModePresetBtn.classList.add('active');
      locModeManualBtn.classList.remove('active');

      if (presetSelectWrapper) presetSelectWrapper.style.display = 'flex';
      if (manualLocationBox) manualLocationBox.style.display = 'none';

      // Revert to dropdown selected starting area if was in manual mode
      if (currentState.userLocationKey === 'manual_location') {
        currentState.userLocationKey = userLocationSelect ? userLocationSelect.value : 'koramangala';
        const locObj = BENGALURU_LOCATIONS[currentState.userLocationKey];
        if (heroLocationStatus && locObj) {
          heroLocationStatus.textContent = `Exploring from ${locObj.name}`;
        }
        updateCardsDistanceAndTransit();
        showToast(`Switched back to preset area: ${locObj ? locObj.name : 'Bengaluru'}`);
      }
    });

    locModeManualBtn.addEventListener('click', () => {
      locModeManualBtn.classList.add('active');
      locModePresetBtn.classList.remove('active');

      if (presetSelectWrapper) presetSelectWrapper.style.display = 'none';
      if (manualLocationBox) manualLocationBox.style.display = 'block';
      if (manualLocationInput) manualLocationInput.focus();
    });
  }

  async function resolveManualLocation(queryText) {
    const query = (queryText || '').trim();
    if (!query) {
      showToast('Please type a starting area, campus or landmark in Bengaluru.');
      if (manualLocationInput) manualLocationInput.focus();
      return;
    }

    if (setManualLocBtn) {
      setManualLocBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>Finding...</span>';
    }

    if (manualGeocodeStatus) {
      manualGeocodeStatus.style.display = 'block';
      manualGeocodeStatus.innerHTML = '<span class="gps-pulse-dot"></span><span>Looking up coordinates on OpenStreetMap...</span>';
    }

    try {
      const res = await fetch(`/api/maps/geocode?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Geocoding request failed');

      const data = await res.json();
      if (!data || typeof data.lat !== 'number' || typeof data.lng !== 'number') {
        throw new Error('Could not find location coordinates');
      }

      // Stop any continuous watchPosition
      if (watchPositionId && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(watchPositionId);
        watchPositionId = null;
      }
      const gpsTrackingStatus = document.getElementById('gpsTrackingStatus');
      if (gpsTrackingStatus) gpsTrackingStatus.style.display = 'none';

      if (detectGpsBtn) {
        detectGpsBtn.classList.remove('active');
        detectGpsBtn.innerHTML = '<span class="gps-pulse-dot"></span><span>Use My Live Location</span>';
      }

      // Set active state to manual location
      currentState.userLocationKey = 'manual_location';
      currentState.manualLocation = {
        name: data.name || query,
        fullName: data.formattedAddress || `${query}, Bengaluru`,
        lat: data.lat,
        lng: data.lng,
        isManual: true
      };

      if (manualGeocodeStatus) {
        manualGeocodeStatus.style.display = 'block';
        manualGeocodeStatus.innerHTML = `<strong>📍 Starting Point Set:</strong> ${escapeHtml(data.formattedAddress)} <span style="font-size:0.75rem; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; margin-left: 6px;">OpenStreetMap</span>`;
      }

      if (heroLocationStatus) {
        heroLocationStatus.textContent = `Exploring from ${data.name || query}`;
      }

      // Recalculate distances and transit costs across all cards
      updateCardsDistanceAndTransit();
      showToast(`📍 Starting point set to "${data.name || query}"! Distances calculated via OpenStreetMap.`);

    } catch (err) {
      console.warn('Manual geocode error:', err);
      if (manualGeocodeStatus) {
        manualGeocodeStatus.style.display = 'block';
        manualGeocodeStatus.innerHTML = `<span style="color:#b91c1c;">Could not locate "${escapeHtml(query)}". Please try typing a nearby college, metro station or locality name.</span>`;
      }
      showToast('Could not resolve starting location. Please try another area name.');
    } finally {
      if (setManualLocBtn) {
        setManualLocBtn.innerHTML = '<span>Calculate Distances</span>';
      }
    }
  }

  if (setManualLocBtn) {
    setManualLocBtn.addEventListener('click', () => {
      resolveManualLocation(manualLocationInput?.value);
    });
  }

  if (manualLocationInput) {
    manualLocationInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        resolveManualLocation(manualLocationInput.value);
      }
    });
  }

  manualHintPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const hint = pill.getAttribute('data-hint');
      if (hint && manualLocationInput) {
        manualLocationInput.value = hint;
        resolveManualLocation(hint);
      }
    });
  });

  distanceRangePills.forEach(pill => {
    pill.addEventListener('click', () => {
      distanceRangePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const distVal = pill.getAttribute('data-dist') || 'all';
      currentState.maxDistanceKm = distVal;

      if (distanceRangeHint) {
        if (distVal === 'all') {
          distanceRangeHint.textContent = "Showing places at any distance across Bengaluru";
        } else {
          const origin = getActiveOrigin();
          distanceRangeHint.textContent = `Showing places within ${distVal} km of ${origin.name}`;
        }
      }

      applyFilters();
      showToast(distVal === 'all' ? 'Showing places at any distance' : `Filtered to spots within ${distVal} km`);
    });
  });

  if (sortBySelect) {
    sortBySelect.addEventListener('change', (e) => {
      currentState.sortBy = e.target.value;
      currentState.sortExplicit = true;
      sortPlaceCards(currentState.sortBy);
      showToast('Places re-ordered!');
    });
  }

  // ---- Search box: live results + professional autocomplete (keyboard, mouse, touch, screen readers) ----
  function attachSuggest(input, { live }) {
    if (!input || !window.SESearch) return;
    const host = input.closest('form') || input.closest('.search-input-wrapper') || input.parentElement;
    if (!host) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const listId = 'seSuggest_' + (input.id || Math.random().toString(36).slice(2));
    const box = document.createElement('div');
    box.className = 'se-suggest';
    box.id = listId;
    box.setAttribute('role', 'listbox');
    box.hidden = true;
    host.appendChild(box);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');

    let items = [], active = -1, debounce = null;
    const E = window.SESearch;
    const esc = (t) => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = { place: '📍', area: '🗺️', topic: '✨', budget: '₹', recent: '🕘' };

    function close() { box.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }
    function setActive(i) {
      active = i;
      box.querySelectorAll('.se-suggest-item').forEach((el, idx) => {
        const on = idx === i;
        el.classList.toggle('is-active', on); el.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) { input.setAttribute('aria-activedescendant', el.id); el.scrollIntoView({ block: 'nearest' }); }
      });
      if (i < 0) input.removeAttribute('aria-activedescendant');
    }
    function render() {
      const q = input.value.trim();
      let list = [];
      if (!q) {
        list = getRecentSearches().map(r => ({ type: 'recent', label: r, sub: 'Recent search', query: r }));
        list = list.concat([{ type: 'topic', label: 'Cheap eats under ₹150', sub: 'Try this', query: 'food under 150' }, { type: 'topic', label: 'Quiet study spots', sub: 'Try this', query: 'quiet place to study' }, { type: 'topic', label: 'Sunrise & morning walks', sub: 'Try this', query: 'sunrise' }]).slice(0, 6);
      } else {
        try { list = E.suggest(q, getSearchIndex(), { limit: 7 }); } catch { list = []; }
        if (!list.length) {
          let r = null; try { r = E.search(q, getSearchIndex()); } catch { /* ignore */ }
          if (r && r.didYouMean) list = [{ type: r.didYouMean.kind === 'area' ? 'area' : 'place', label: r.didYouMean.label, sub: 'Did you mean this?', query: r.didYouMean.label }];
          else list = [{ type: 'topic', label: `Search for “${q}”`, sub: 'Press Enter — similar places will be shown', query: q }];
        }
      }
      items = list;
      if (!items.length) { close(); return; }
      box.innerHTML = items.map((it, i) => {
        let sub = it.sub || '', go = '';
        const pl = it.type === 'place' && it.id ? PLACES_DATA[it.id] : null;
        if (pl) {
          const o = getActiveOrigin();
          const km = haversineKm(o.lat, o.lng, Number(pl.lat), Number(pl.lng));
          const extra = [Number(pl.rating) ? '★ ' + Number(pl.rating).toFixed(1) : '', Number.isFinite(km) ? (km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km') : ''].filter(Boolean).join(' · ');
          if (extra) sub = (sub ? sub + ' · ' : '') + extra;
          go = '<span class="se-suggest-go" aria-hidden="true">🧭 Directions</span>';
        }
        return `<div class="se-suggest-item" role="option" id="${listId}_${i}" data-i="${i}" aria-selected="false"><span class="se-suggest-ico" aria-hidden="true">${icon[it.type] || '🔎'}</span><span class="se-suggest-text"><span class="se-suggest-label">${E.highlight(it.label, q)}</span><span class="se-suggest-sub">${esc(sub)}</span></span>${go}</div>`;
      }).join('')
        + (!q && getRecentSearches().length ? '<button type="button" class="se-suggest-clear" data-clear="1">Clear recent searches</button>' : '');
      box.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
    }
    function choose(i) {
      const it = items[i]; if (!it) return;
      close();
      // v17: picking a specific place goes straight to its directions; areas / topics still filter the list.
      if (it.type === 'place' && it.id && PLACES_DATA[it.id]) {
        input.value = it.label;
        rememberSearch(it.label);
        openPlaceDirections(String(it.id));
        return;
      }
      runSearch(it.query || it.label, { scroll: true });
    }

    // v17: voice search (only shown where the browser supports it, e.g. Chrome / Edge / Android / Safari)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR && input.parentElement) {
      const wrap = input.parentElement;
      if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
      const mic = document.createElement('button');
      mic.type = 'button'; mic.className = 'se-voice-btn';
      mic.setAttribute('aria-label', 'Search by voice'); mic.title = 'Search by voice'; mic.textContent = '🎤';
      wrap.appendChild(mic);
      let rec = null;
      const stop = () => { try { rec && rec.stop(); } catch (_) {} };
      mic.addEventListener('click', () => {
        if (mic.classList.contains('is-listening')) { stop(); return; }
        try {
          rec = new SR(); rec.lang = 'en-IN'; rec.interimResults = false; rec.maxAlternatives = 1;
          rec.onstart = () => { mic.classList.add('is-listening'); showToast('Listening… say a place, area or budget'); };
          rec.onend = () => mic.classList.remove('is-listening');
          rec.onerror = (ev) => { mic.classList.remove('is-listening'); showToast(ev.error === 'not-allowed' ? 'Microphone is blocked. Allow it in your browser to search by voice.' : 'Could not hear that. Try again or type it.'); };
          rec.onresult = (ev) => {
            const text = (ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript || '').replace(/[.。]+$/, '').trim();
            if (!text) return;
            input.value = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            close();
            runSearch(text, { scroll: true });
          };
          rec.start();
        } catch (_) { mic.classList.remove('is-listening'); showToast('Voice search is not available in this browser.'); }
      });
    }

    input.addEventListener('input', () => {
      render();
      // v16: emptying EITHER search box (top bar or hero) shows every place again straight away.
      if (!input.value.trim() && (currentState.query || '').trim()) {
        currentState.query = ''; currentState.sortExplicit = false;
        [searchInput, document.getElementById('topSearchInput')].forEach(el => { if (el && el !== input) el.value = ''; });
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        clearTimeout(debounce); applyFiltersAndSort();
        return;
      }
      if (live) {
        currentState.query = input.value; currentState.sortExplicit = false;
        if (clearSearchBtn) clearSearchBtn.style.display = currentState.query ? 'block' : 'none';
        clearTimeout(debounce); debounce = setTimeout(() => { applyFilters(); }, 90);
      }
    });
    input.addEventListener('focus', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (box.hidden) render(); setActive(items.length ? (active + 1) % items.length : -1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) setActive(active <= 0 ? items.length - 1 : active - 1); }
      else if (e.key === 'Enter') { if (!box.hidden && active >= 0) { e.preventDefault(); choose(active); } else { close(); } }
      else if (e.key === 'Escape') { if (!box.hidden) { e.preventDefault(); close(); } }
      else if (e.key === 'Tab') close();
    });
    box.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the input
    box.addEventListener('click', (e) => {
      if (e.target.closest('[data-clear]')) { clearRecentSearches(); render(); return; }
      const el = e.target.closest('.se-suggest-item'); if (el) choose(Number(el.dataset.i));
    });
    box.addEventListener('mousemove', (e) => { const el = e.target.closest('.se-suggest-item'); if (el) setActive(Number(el.dataset.i)); });
    document.addEventListener('click', (e) => { if (!host.contains(e.target)) close(); });
    input.addEventListener('blur', () => setTimeout(close, 120));
  }

  // v17: press "/" anywhere to jump to search (like GitHub / YouTube), unless you are typing or a popup is open.
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    if (document.querySelector('.modal-backdrop.open')) return;
    const target = [document.getElementById('topSearchInput'), searchInput].find(el => el && el.offsetParent !== null);
    if (target) { e.preventDefault(); target.focus(); target.select(); }
  });

  if (searchInput) {
    attachSuggest(searchInput, { live: true });
    if (!window.SESearch) {
      searchInput.addEventListener('input', (e) => {
        currentState.query = e.target.value;
        if (clearSearchBtn) clearSearchBtn.style.display = currentState.query ? 'block' : 'none';
        applyFilters();
      });
    }
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = searchInput.value.trim();
        runSearch(q, { scroll: true });
        const n = [...document.querySelectorAll('.place-card')].filter(c => c.style.display !== 'none').length;
        showToast(q ? (n ? `${n} place${n === 1 ? '' : 's'} for “${q}”.` : `No places for “${q}” yet.`) : 'Showing all places.');
      });
    }
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        const top = document.getElementById('topSearchInput'); if (top) top.value = '';
        currentState.query = '';
        clearSearchBtn.style.display = 'none';
        applyFilters();
        searchInput.focus();
      });
    }
  }
  attachSuggest(document.getElementById('topSearchInput'), { live: false });

  quickTags.forEach(tag => {
    tag.addEventListener('click', () => runSearch(tag.getAttribute('data-search') || '', { scroll: true }));
  });

  // Places added later (by a student or the admin) show up in search results without a reload.
  if (placesGrid && 'MutationObserver' in window) {
    let t = null;
    const knownCards = new WeakSet();
    placesGrid.querySelectorAll('.place-card').forEach(c => knownCards.add(c));
    new MutationObserver((muts) => {
      // Only a card we have never seen counts as "a place was added". Cards merely re-ordered by a search are ignored,
      // otherwise reordering re-triggers the search which reorders again, forever (cards flicker and clicks get lost).
      let fresh = false;
      muts.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType === 1 && n.classList && n.classList.contains('place-card') && !knownCards.has(n)) { knownCards.add(n); fresh = true; }
      }));
      if (!fresh || __seReordering) return;
      clearTimeout(t); t = setTimeout(() => { window.__seInvalidateSearch && window.__seInvalidateSearch(); if ((currentState.query || '').trim()) applyFilters(); }, 150);
    }).observe(placesGrid, { childList: true });
  }

  // v16d: move cards in the grid ONLY when their order really changes. Re-appending cards that are already in the
  // right place removes/re-adds them in the DOM, which cancels clicks in progress and makes hovered cards/buttons flicker.
  function orderCards(grid, wanted) {
    if (!grid || !wanted.length) return;
    const wantedSet = new Set(wanted);
    const current = [...grid.children].filter(c => wantedSet.has(c));
    if (current.length === wanted.length && current.every((c, i) => c === wanted[i])) return;
    __seReordering = true;
    wanted.forEach(c => grid.appendChild(c));
    setTimeout(() => { __seReordering = false; }, 0);
  }
  var __seReordering = false;

  function resetAllFilters() {
    currentState.category = 'all';
    currentState.budget = 'all';
    currentState.maxDistanceKm = 'all';
    currentState.query = '';

    if (searchInput) {
      searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    }

    budgetPills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-budget') === 'all');
    });

    distanceRangePills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-dist') === 'all');
    });

    if (distanceRangeHint) distanceRangeHint.textContent = 'Showing places at any distance across Bengaluru';
    if (budgetStatusText) budgetStatusText.textContent = 'Showing all popular places across Bengaluru';

    applyFiltersAndSort();
    showToast('All filters have been reset.');
  }

  if (clearFilterBtn) clearFilterBtn.addEventListener('click', resetAllFilters);
  if (resetSearchBtn) resetSearchBtn.addEventListener('click', resetAllFilters);

  categoryFilterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const selectedCat = tab.getAttribute('data-filter') || 'all';
      currentState.category = selectedCat;
      categoryFilterTabs.forEach(t => t.classList.toggle('active', t === tab));
      applyFiltersAndSort();
      scrollToPlaces();
    });
  });

  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const selectedCat = card.getAttribute('data-category') || 'all';
      currentState.category = selectedCat;
      currentState.collection = 'all';
      categoryFilterTabs.forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-filter') === selectedCat);
      });
      applyFiltersAndSort();
      scrollToPlaces();
      showToast('Showing ' + selectedCat + ' places — your tips help the next student!');
    });
  });

  document.querySelectorAll('.nav-link[data-category], .footer-links a[data-category]').forEach(link => {
    link.addEventListener('click', () => {
      const cat = link.getAttribute('data-category');
      if (cat) {
        currentState.category = cat;
        categoryFilterTabs.forEach(t => {
          t.classList.toggle('active', t.getAttribute('data-filter') === cat);
        });
        applyFiltersAndSort();
        scrollToPlaces();
      }
      if (navMenu && mobileToggle) {
        navMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  const budgetLabels = {
    'all': 'Showing all popular places across Bengaluru',
    'under-100': 'Filtered: Free entries & places under ₹100 / person',
    '100-300': 'Filtered: Best college bites & outings for ₹100–₹300',
    '300-500': 'Filtered: Premium student hangouts for ₹300–₹500',
    '500-1000': 'Filtered: Full-day trips and experiences ₹500–₹1,000',
    'above-1000': 'Filtered: Special celebration outings above ₹1,000'
  };

  budgetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      budgetPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const budgetVal = pill.getAttribute('data-budget') || 'all';
      currentState.budget = budgetVal;
      if (budgetStatusText) budgetStatusText.textContent = budgetLabels[budgetVal] || 'Filtered by budget';
      applyFiltersAndSort();
      scrollToPlaces();
    });
  });

  if (findPlacesBtn) {
    findPlacesBtn.addEventListener('click', () => {
      applyFilters();
      document.getElementById('places')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (resetBudgetFilterBtn) {
    resetBudgetFilterBtn.addEventListener('click', () => {
      currentState.budget = 'all';
      budgetPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-budget') === 'all'));
      if (budgetStatusText) budgetStatusText.textContent = budgetLabels['all'];
      applyFilters();
      document.getElementById('places')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ============================================================================
  // 13. SQUAD BUDGET CALCULATOR
  // ============================================================================
  function calculateOutingBudget() {
    if (!numPeopleInput) return;
    const numPeople = Math.max(1, parseInt(numPeopleInput.value, 10) || 1);
    const transport = Math.max(0, parseInt(costTransport?.value, 10) || 0);
    const food = Math.max(0, parseInt(costFood?.value, 10) || 0);
    const entry = Math.max(0, parseInt(costEntry?.value, 10) || 0);
    const other = Math.max(0, parseInt(costOther?.value, 10) || 0);

    const totalCost = transport + food + entry + other;
    const perPerson = Math.ceil(totalCost / numPeople);

    if (totalGroupCostDisplay) totalGroupCostDisplay.textContent = `₹${totalCost.toLocaleString('en-IN')}`;
    if (costPerPersonDisplay) costPerPersonDisplay.textContent = `₹${perPerson.toLocaleString('en-IN')}`;
    if (peopleCountDisplay) peopleCountDisplay.textContent = `${numPeople} student${numPeople === 1 ? '' : 's'}`;
    updateCalcBudgetStatus(perPerson, numPeople);
  }

  // ---- v17: calculator helpers (place auto-fill, travel-mode comparison, budget check, share) ----
  const calcMoney = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const CALC_MODE_LABEL = { metro: '🚇 Namma Metro', bus: '🚌 BMTC bus', auto: '🛺 Auto', bike: '🏍️ Bike taxi' };
  const calcEl = (id) => document.getElementById(id);

  function updateCalcBudgetStatus(perPerson, people) {
    const out = calcEl('calcBudgetStatus'); if (!out) return;
    const cap = parseInt(calcEl('calcBudgetCap')?.value, 10);
    if (!Number.isFinite(cap) || cap <= 0) { out.textContent = ''; out.className = 'calc-budget-status'; return; }
    if (perPerson <= cap) {
      out.className = 'calc-budget-status ok';
      out.textContent = `✅ ${calcMoney(perPerson)} each is within your ${calcMoney(cap)} budget (${calcMoney(cap - perPerson)} to spare).`;
    } else {
      out.className = 'calc-budget-status over';
      out.textContent = `⚠️ ${calcMoney(perPerson - cap)} over budget per person (${calcMoney((perPerson - cap) * people)} for the group). Try the cheapest travel option or a cheaper place.`;
    }
  }

  function fillCalcPlaces() {
    const sel = calcEl('calcPlaceSelect'); if (!sel) return;
    const keep = sel.value;
    const list = Object.values(PLACES_DATA || {}).filter(p => p && p.id && p.name && Number.isFinite(Number(p.lat))).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if (sel.options.length - 1 === list.length) return;
    sel.innerHTML = '<option value="">Choose a place…</option>' + list.map(p => `<option value="${escapeHtml(String(p.id))}">${escapeHtml(p.name)}</option>`).join('');
    if (keep) sel.value = keep;
  }

  function calcTransportOptions(place, people, trips) {
    const o = getActiveOrigin();
    const road = roadKmFromStraight(calculateDistanceKm(o.lat, o.lng, Number(place.lat), Number(place.lng)));
    const q = computeFares(road, String(place.id));
    const opts = {};
    if (q.metro != null) opts.metro = q.metro * people * trips;
    if (q.bus != null) opts.bus = q.bus * people * trips;
    opts.auto = Math.ceil(people / 3) * q.auto * trips;
    if (q.rapido != null) opts.bike = q.rapido * people * trips;
    return { opts, road, q };
  }

  function applyCalcPlace() {
    const id = calcEl('calcPlaceSelect')?.value;
    const box = calcEl('calcModeCompare');
    const place = id ? PLACES_DATA[id] : null;
    if (!place) { if (box) box.hidden = true; return; }
    const people = Math.max(1, parseInt(numPeopleInput?.value, 10) || 1);
    const trips = calcEl('calcRoundTrip')?.checked ? 2 : 1;
    const { opts, road } = calcTransportOptions(place, people, trips);
    let mode = calcEl('calcModeSelect')?.value || 'cheapest';
    const cheapest = Object.entries(opts).sort((a, b) => a[1] - b[1])[0][0];
    if (mode === 'cheapest' || !(mode in opts)) mode = cheapest;
    const rows = Object.entries(opts).sort((a, b) => a[1] - b[1]).map(([m, total]) =>
      `<li class="${m === mode ? 'picked' : ''}"><span>${CALC_MODE_LABEL[m]}${m === cheapest ? ' <em>cheapest</em>' : ''}</span><span>${calcMoney(total)} <small>(${calcMoney(total / people)} each)</small></span></li>`).join('');
    if (box) { box.hidden = false; box.innerHTML = `<div class="calc-compare-head">${escapeHtml(place.name)} · about ${road} km from ${escapeHtml(getActiveOrigin().name || 'your start')} · ${trips === 2 ? 'round trip' : 'one way'}</div><ul>${rows}</ul>`; }
    // Fill the numbers: transport from the chosen mode; food/entry from the place's typical student spend.
    const spendEach = (Number(place.minBudget) + Number(place.maxBudget)) / 2 || 0;
    const food = Math.round((spendEach * people) / 10) * 10;
    const transport = Math.round(opts[mode] / 10) * 10;
    if (costTransport) costTransport.value = transport;
    if (costFood) costFood.value = food;
    if (costEntry) costEntry.value = 0;
    if (costOther) costOther.value = Math.round(((transport + food) * 0.08) / 10) * 10;
    calculateOutingBudget();
  }

  function calcSummaryText() {
    const people = Math.max(1, parseInt(numPeopleInput?.value, 10) || 1);
    const total = ['costTransport', 'costFood', 'costEntry', 'costOther'].reduce((t, id) => t + (parseInt(calcEl(id)?.value, 10) || 0), 0);
    const each = Math.ceil(total / people);
    const pid = calcEl('calcPlaceSelect')?.value;
    const place = pid ? PLACES_DATA[pid] : null;
    return [
      `💸 Outing split${place ? ' — ' + place.name : ''}`,
      `👥 ${people} friends · Total ${calcMoney(total)} · ${calcMoney(each)} each`,
      `🚌 Transport ${calcMoney(parseInt(costTransport?.value, 10) || 0)} · Food ${calcMoney(parseInt(costFood?.value, 10) || 0)} · Entry ${calcMoney(parseInt(costEntry?.value, 10) || 0)} · Other ${calcMoney(parseInt(costOther?.value, 10) || 0)}`,
      `Please send ${calcMoney(each)} on UPI to the person paying.`,
      '',
      'Planned with Student Explorer: ' + location.origin
    ].join('\n');
  }

  calcEl('calcPlaceSelect')?.addEventListener('change', applyCalcPlace);
  calcEl('calcPlaceSelect')?.addEventListener('focus', fillCalcPlaces);
  calcEl('calcModeSelect')?.addEventListener('change', applyCalcPlace);
  calcEl('calcRoundTrip')?.addEventListener('change', applyCalcPlace);
  calcEl('calcBudgetCap')?.addEventListener('input', calculateOutingBudget);
  numPeopleInput?.addEventListener('input', () => { if (calcEl('calcPlaceSelect')?.value) applyCalcPlace(); });
  calcEl('decrementPeopleBtn')?.addEventListener('click', () => { if (calcEl('calcPlaceSelect')?.value) applyCalcPlace(); });
  calcEl('incrementPeopleBtn')?.addEventListener('click', () => { if (calcEl('calcPlaceSelect')?.value) applyCalcPlace(); });
  calcEl('calcCopyBtn')?.addEventListener('click', async () => {
    const text = calcSummaryText();
    try { await navigator.clipboard.writeText(text); showToast('Copied. Paste it in your group chat.'); }
    catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); showToast('Copied. Paste it in your group chat.'); } catch (_) { showToast('Could not copy. Select the numbers and share manually.'); } ta.remove(); }
  });
  calcEl('calcShareBtn')?.addEventListener('click', async () => {
    const text = calcSummaryText();
    if (navigator.share) { try { await navigator.share({ title: 'Outing split', text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });
  setTimeout(fillCalcPlaces, 1500); setTimeout(fillCalcPlaces, 4000);

  [numPeopleInput, costTransport, costFood, costEntry, costOther].forEach(input => {
    if (input) input.addEventListener('input', calculateOutingBudget);
  });

  if (decrementPeopleBtn && incrementPeopleBtn && numPeopleInput) {
    decrementPeopleBtn.addEventListener('click', () => {
      let currentVal = parseInt(numPeopleInput.value, 10) || 1;
      if (currentVal > 1) {
        numPeopleInput.value = currentVal - 1;
        calculateOutingBudget();
      }
    });

    incrementPeopleBtn.addEventListener('click', () => {
      let currentVal = parseInt(numPeopleInput.value, 10) || 1;
      if (currentVal < 25) {
        numPeopleInput.value = currentVal + 1;
        calculateOutingBudget();
      }
    });
  }

  const PRESET_VALUES = {
    'street-food': { people: 4, transport: 200, food: 600, entry: 0, other: 80 },
    'park-day': { people: 3, transport: 120, food: 250, entry: 60, other: 40 },
    'palace-tour': { people: 5, transport: 350, food: 1200, entry: 1250, other: 150 }
  };

  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const presetId = chip.getAttribute('data-preset');
      const data = PRESET_VALUES[presetId];
      if (data && numPeopleInput) {
        numPeopleInput.value = data.people;
        if (costTransport) costTransport.value = data.transport;
        if (costFood) costFood.value = data.food;
        if (costEntry) costEntry.value = data.entry;
        if (costOther) costOther.value = data.other;
        calculateOutingBudget();
        showToast('Loaded preset into budget calculator!');
      }
    });
  });

  if (resetCalculatorBtn && numPeopleInput) {
    resetCalculatorBtn.addEventListener('click', () => {
      numPeopleInput.value = 4;
      if (costTransport) costTransport.value = 320;
      if (costFood) costFood.value = 680;
      if (costEntry) costEntry.value = 160;
      if (costOther) costOther.value = 100;
      calculateOutingBudget();
      showToast('Calculator reset to default values.');
    });
  }

  // ============================================================================
  // 14. POST-TRIP EXPENSE DIARY & LEDGER
  // ============================================================================
  function updateLiveExpensePreview() {
    const transport = Math.max(0, parseInt(expenseTransitCost?.value, 10) || 0);
    const food = Math.max(0, parseInt(expenseFoodCost?.value, 10) || 0);
    const entry = Math.max(0, parseInt(expenseEntryCost?.value, 10) || 0);
    const misc = Math.max(0, parseInt(expenseMiscCost?.value, 10) || 0);
    const people = Math.max(1, parseInt(expenseNumPeople?.value, 10) || 1);

    const total = transport + food + entry + misc;
    const perPerson = Math.ceil(total / people);

    if (liveTotalTripCost) liveTotalTripCost.textContent = `₹${total.toLocaleString('en-IN')}`;
    if (livePerPersonShare) livePerPersonShare.textContent = `₹${perPerson.toLocaleString('en-IN')}`;
  }

  [expenseTransitCost, expenseFoodCost, expenseEntryCost, expenseMiscCost, expenseNumPeople].forEach(input => {
    if (input) input.addEventListener('input', updateLiveExpensePreview);
  });

  function refreshExpensePlaceOptions() {
    if (!expensePlaceSelect) return;
    const current = expensePlaceSelect.value;
    const builtins = [
      ['Lalbagh Botanical Garden', 'Lalbagh Botanical Garden'],
      ['Cubbon Park', 'Cubbon Park'],
      ['VV Puram Food Street', 'VV Puram Food Street'],
      ['Bengaluru Palace', 'Bengaluru Palace'],
      ['Church Street & Book Cafes', 'Church Street & Book Cafes'],
      ['Nandi Hills Sunrise', 'Nandi Hills Sunrise'],
    ];
    const seen = new Set(builtins.map(b => b[0].toLowerCase()));
    const community = Object.values(PLACES_DATA || {})
      .filter(p => p && p.name && !seen.has(String(p.name).toLowerCase()))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    let html = `<option value="">— Select a place from our list —</option>`;
    builtins.forEach(([v, t]) => { html += `<option value="${escapeHtml(v)}">${escapeHtml(t)}</option>`; });
    community.forEach(p => {
      html += `<option value="${escapeHtml(p.name)}" data-place-id="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.isHotel ? ' 🏨' : ''}</option>`;
      seen.add(String(p.name).toLowerCase());
    });
    html += `<option value="__new__">➕ New place (not in our database yet)</option>`;
    expensePlaceSelect.innerHTML = html;
    if (current && [...expensePlaceSelect.options].some(o => o.value === current)) {
      expensePlaceSelect.value = current;
    }
  }

  if (expensePlaceSelect) {
    expensePlaceSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      const helper = document.getElementById('expensePlaceHelper');
      const isNew = val === '__new__' || val === 'custom';
      if (customPlaceGroup) {
        customPlaceGroup.style.display = isNew ? 'block' : 'none';
        if (isNew && customPlaceName) customPlaceName.focus();
      }
      if (helper) {
        if (isNew) {
          helper.style.display = 'block';
          helper.textContent = 'New places should be added to the database so others can find them.';
        } else if (val) {
          helper.style.display = 'block';
          helper.textContent = '✓ Found in our database — you can log this outing.';
          helper.style.color = '#4338CA';
        } else {
          helper.style.display = 'none';
        }
      }
    });
  }

  document.getElementById('expenseAddPlaceBtn')?.addEventListener('click', () => {
    const name = (customPlaceName?.value || '').trim();
    closeModal?.(document.getElementById('uploadPlaceModal'));
    // Open add-place modal and prefill name
    const openBtn = document.getElementById('navAddPlaceBtn') || document.getElementById('navAddPlaceLink');
    openBtn?.click();
    setTimeout(() => {
      const nameInput = document.getElementById('newPlaceName');
      if (nameInput && name) nameInput.value = name;
      showToast('Fill in the details and publish this place so it joins our database.');
    }, 200);
  });

  async function loadTrips() {
    if (!isLoggedIn()) { tripsCache = []; renderExpenseLedger(); return; }
    try { tripsCache = (await api('/api/trips')).trips || []; } catch { tripsCache = []; }
    renderExpenseLedger();
  }

  function renderExpenseLedger() {
    if (!loggedTripsList) return;
    const trips = tripsCache;
    const sub = document.getElementById('ledgerSub');
    if (sub) {
      sub.textContent = session.user
        ? `Private to ${session.user.email} · synced across sessions`
        : 'Log in to keep a private history under your email';
    }
    if (clearAllExpensesBtn) clearAllExpensesBtn.style.display = trips.length ? '' : 'none';

    if (!isLoggedIn()) {
      loggedTripsList.innerHTML = `<div class="ledger-empty-state"><div class="empty-icon">🔐</div><h4>Log in to see your outings</h4><p>Your history is stored under your email, so it follows you on any device.</p><button type="button" class="btn btn-primary btn-sm" id="ledgerLoginBtn" style="margin-top:1rem">Log In / Sign Up</button></div>`;
      document.getElementById('ledgerLoginBtn')?.addEventListener('click', () => openAuth('signup', 'Sign up to save outings. Already have an account? Switch to Log In.'));
    } else if (trips.length === 0) {
      loggedTripsList.innerHTML = `<div class="ledger-empty-state"><div class="empty-icon">📖</div><h4>No outings logged yet</h4><p>Use the form on the left to log your latest trip. Totals and charts will appear here.</p></div>`;
    } else {
      loggedTripsList.innerHTML = trips.map(trip => {
        let d = trip.date;
        try { d = new Date(trip.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { /* keep raw */ }
        const parts = [['🚕', 'Transport', trip.transitCost], ['🍜', 'Food', trip.foodCost], ['🎟️', 'Entry', trip.entryCost], ['🧾', 'Other', trip.miscCost]].filter(p => p[2] > 0);
        const bar = parts.map(p => `<i style="flex:${p[2]}" class="seg seg-${p[1].toLowerCase()}" title="${p[1]}: ₹${p[2]}"></i>`).join('');
        const chips = parts.map(p => `<span class="trip-breakdown-crumb">${p[0]} ₹${p[2].toLocaleString('en-IN')}</span>`).join('');
        return `
        <article class="logged-trip-item" data-id="${trip.id}">
          <div class="trip-item-top">
            <div>
              <h4 class="trip-place-name">${escapeHtml(trip.place)}</h4>
              <div class="trip-mode-pill"><span>${escapeHtml(d)}</span><span>•</span><span>${escapeHtml(trip.transitMode || 'Transit')}</span><span>•</span><span>${trip.numPeople} ${trip.numPeople === 1 ? 'person' : 'people'}</span></div>
            </div>
            <div class="trip-cost-block"><span class="trip-per-head font-highlight">₹${trip.perPerson.toLocaleString('en-IN')}</span><span class="trip-per-head-sub">your share</span></div>
          </div>
          <div class="trip-bar">${bar}</div>
          <div class="trip-item-details">${chips}<span class="trip-breakdown-crumb group-total">Total ₹${trip.totalCost.toLocaleString('en-IN')}</span></div>
          ${trip.note ? `<p class="trip-item-note">${escapeHtml(trip.note)}</p>` : ''}
          <button type="button" class="delete-trip-btn" data-id="${trip.id}" aria-label="Delete this outing">Delete</button>
        </article>`;
      }).join('');
      loggedTripsList.querySelectorAll('.delete-trip-btn').forEach(btn => btn.addEventListener('click', async () => {
        try {
          await api('/api/trips/' + btn.dataset.id, { method: 'DELETE' });
          tripsCache = tripsCache.filter(t => String(t.id) !== btn.dataset.id);
          renderExpenseLedger();
          showToast('Outing removed.');
        } catch (err) { showToast(err.message); }
      }));
    }

    const total = trips.reduce((sum, t) => sum + (t.perPerson || 0), 0);
    if (statTotalSpent) statTotalSpent.textContent = `₹${total.toLocaleString('en-IN')}`;
    if (statTripsCount) statTripsCount.textContent = String(trips.length);
    if (statAvgSpent) statAvgSpent.textContent = `₹${(trips.length ? Math.round(total / trips.length) : 0).toLocaleString('en-IN')}`;
  }

  if (tripExpenseForm) {
    tripExpenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isLoggedIn()) { openAuth('login', 'Log in to save this outing to your account.'); return; }
      let placeName = expensePlaceSelect ? expensePlaceSelect.value : '';
      if (!placeName) {
        showToast('Please select a place from our database.');
        return;
      }
      if (placeName === '__new__' || placeName === 'custom') {
        const typed = (customPlaceName?.value || '').trim();
        if (!typed) {
          showToast('Enter the new place name, then add it to our database.');
          customPlaceName?.focus();
          return;
        }
        // Require adding to DB first
        showToast('Please add this place to our database first so other students can find it.');
        document.getElementById('expenseAddPlaceBtn')?.focus();
        const nameInput = document.getElementById('newPlaceName');
        const openBtn = document.getElementById('navAddPlaceBtn') || document.getElementById('navAddPlaceLink');
        openBtn?.click();
        setTimeout(() => { if (nameInput) nameInput.value = typed; }, 200);
        return;
      }
      const btn = document.getElementById('saveExpenseBtn');
      btn.disabled = true;
      try {
        const { trip } = await api('/api/trips', {
          method: 'POST',
          body: {
            place: placeName, date: expenseDate?.value, transitMode: expenseTransitMode?.value, numPeople: expenseNumPeople?.value,
            transitCost: expenseTransitCost?.value, foodCost: expenseFoodCost?.value, entryCost: expenseEntryCost?.value,
            miscCost: expenseMiscCost?.value, note: expenseNote?.value
          }
        });
        tripsCache.unshift(trip);
        renderExpenseLedger();
        showToast(`Outing to ${trip.place} saved. Your share is ₹${trip.perPerson}. Thanks — this helps other students plan!`);
        // Ask for a short review (helps the next batch of students)
        setTimeout(() => {
          const placeEntry = Object.values(PLACES_DATA || {}).find(p => p && p.name === trip.place);
          if (placeEntry && confirm('Help the next student! Leave a quick review for ' + trip.place + '? Your real spend is already logged.')) {
            openPlaceDetails(placeEntry.id, true);
            setTimeout(() => {
              const cost = document.getElementById('reviewCostSpent');
              if (cost && trip.perPerson) cost.value = trip.perPerson;
              document.getElementById('modalReviewsSection')?.scrollIntoView({ behavior: 'smooth' });
            }, 350);
          } else if (confirm('Share this outing plan with friends on WhatsApp?')) {
            if (placeEntry) sharePlaceWhatsApp(placeEntry.id);
            else {
              const t = `🎓 Just logged an outing to ${trip.place} on Student Explorer — ₹${trip.perPerson}/person. Join me next time!`;
              window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
            }
          }
        }, 450);
        if (expenseNote) expenseNote.value = '';
        if (customPlaceName) customPlaceName.value = '';
        if (customPlaceGroup) customPlaceGroup.style.display = 'none';
        if (expensePlaceSelect) expensePlaceSelect.selectedIndex = 0;
        const helper = document.getElementById('expensePlaceHelper');
        if (helper) helper.style.display = 'none';
        updateLiveExpensePreview();
      } catch (err) { showToast(err.message); }
      finally { btn.disabled = false; }
    });
  }

  if (clearAllExpensesBtn) {
    clearAllExpensesBtn.addEventListener('click', async () => {
      if (!confirm('Delete your entire outing history? This cannot be undone.')) return;
      try { await api('/api/trips', { method: 'DELETE' }); tripsCache = []; renderExpenseLedger(); showToast('Outing history cleared.'); }
      catch (err) { showToast(err.message); }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Mobile Navigation Drawer Toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ============================================================================
  // 15. INITIALIZATION RUN
  // ============================================================================
  updateCardsDistanceAndTransit();
  // Re-price when peak/off-peak windows roll over (every 5 minutes).
  setInterval(() => {
    try { updateCardsDistanceAndTransit(); } catch (_) { /* ignore */ }
  }, 5 * 60 * 1000);
  calculateOutingBudget();
  updateLiveExpensePreview();
  renderExpenseLedger();
  loadCommunityPlaces();

  // Restore the login, then load this email's outings
  (async () => {
    // Restore from either the preview bearer token or the normal HttpOnly
    // session cookie. This also covers users who signed in on the /login page.
    // Only a real "401 not logged in" answer clears the login. A slow or dropped connection must NOT log the
    // user out (that used to make saved trips look lost), so we keep the token and retry.
    let attempt = 0;
    const restore = async () => {
      try { const { user } = await api('/api/profile'); setSession(session.token, user); }
      catch (err) {
        if (err && err.status === 401) { setSession('', null); return; }
        if (attempt++ < 4) { setTimeout(restore, 2500 * attempt); return; }
        if (!session.user) setSession(session.token, null);
      }
    };
    restore();
  })();

  // ============================================================================
  // ADMIN DASHBOARD
  // ============================================================================
  const adminModal = document.getElementById('adminModal');
  const navAdminBtn = document.getElementById('navAdminBtn');
  const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');

  function fmtDate(ts) {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
    } catch { return '—'; }
  }

  async function loadAdminComments() {
    const body = document.getElementById('adminCommentsBody');
    if (!body) return;
    body.innerHTML = `<tr><td colspan="5">Loading all student comments…</td></tr>`;
    try {
      const data = await api('/api/admin/reviews');
      const list = data.reviews || [];
      if (!list.length) {
        body.innerHTML = `<tr><td colspan="5">No student comments yet. When users post reviews, they appear here for you to edit or delete.</td></tr>`;
        return;
      }
      const students = list.filter(r => !r.isSample);
      const samples = list.filter(r => r.isSample);
      const rowHtml = (r, tag) => `
        <tr data-review-id="${escapeHtml(String(r.id || ''))}">
          <td>${escapeHtml(r.placeName || r.placeId || '—')}<br><small style="color:#64748B">${tag}</small></td>
          <td>${escapeHtml(r.authorName || 'Student')}<br><small style="color:#64748B">${escapeHtml(r.authorEmail || '—')}</small></td>
          <td>★ ${r.rating != null && r.rating !== '' ? r.rating : '—'}</td>
          <td style="max-width:260px"><span class="admin-comment-text">${escapeHtml(r.comment || '')}</span>${r.costSpent ? `<br><small>Spent ₹${r.costSpent}</small>` : ''}</td>
          <td style="white-space:nowrap">
            <button type="button" class="btn btn-ghost btn-sm admin-edit-review" data-id="${escapeHtml(String(r.id || ''))}" data-rating="${r.rating || 5}">Edit</button>
            <button type="button" class="btn btn-ghost btn-sm admin-rate-review" data-id="${escapeHtml(String(r.id || ''))}" data-rating="${r.rating || 5}">Rating</button>
            <button type="button" class="btn btn-ghost btn-sm admin-del-review" data-id="${escapeHtml(String(r.id || ''))}" style="color:#DC2626">Delete</button>
          </td>
        </tr>`;
      const parts = [];
      if (students.length) {
        parts.push(`<tr class="admin-section-row"><td colspan="5"><strong>Student comments (${students.length})</strong></td></tr>`);
        students.forEach(r => parts.push(rowHtml(r, 'Student')));
      } else {
        parts.push(`<tr class="admin-section-row"><td colspan="5"><strong>Student comments</strong> — none yet</td></tr>`);
      }
      if (samples.length) {
        parts.push(`<tr class="admin-section-row"><td colspan="5"><strong>Admin sample notes (${samples.length})</strong></td></tr>`);
        samples.forEach(r => parts.push(rowHtml(r, 'Admin sample')));
      }
      body.innerHTML = parts.join('');

      body.querySelectorAll('.admin-del-review').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this comment permanently?')) return;
          try {
            await api('/api/admin/reviews/' + encodeURIComponent(btn.dataset.id), { method: 'DELETE' });
            showToast('Comment deleted.');
            loadAdminComments();
          } catch (err) { showToast(err.message); }
        });
      });
      body.querySelectorAll('.admin-edit-review').forEach(btn => {
        btn.addEventListener('click', async () => {
          const row = btn.closest('tr');
          const textEl = row?.querySelector('.admin-comment-text');
          const current = textEl?.textContent || '';
          const next = prompt('Edit comment text:', current);
          if (next == null) return;
          try {
            await api('/api/admin/reviews/' + encodeURIComponent(btn.dataset.id), {
              method: 'PATCH',
              body: { comment: next.trim() }
            });
            showToast('Comment updated.');
            loadAdminComments();
          } catch (err) { showToast(err.message); }
        });
      });
      body.querySelectorAll('.admin-rate-review').forEach(btn => {
        btn.addEventListener('click', async () => {
          const next = prompt('Set rating 1–5:', btn.dataset.rating || '5');
          if (next == null) return;
          const rating = Math.min(5, Math.max(1, parseFloat(next) || 5));
          try {
            await api('/api/admin/reviews/' + encodeURIComponent(btn.dataset.id), {
              method: 'PATCH',
              body: { rating }
            });
            showToast('Rating set to ★ ' + rating);
            loadAdminComments();
          } catch (err) { showToast(err.message); }
        });
      });
    } catch (err) {
      body.innerHTML = `<tr><td colspan="5">${escapeHtml(err.message || 'Failed to load comments')}</td></tr>`;
    }
  }

  async function openAdminDashboard() {
    if (!session.user?.isAdmin) {
      showToast('Admin access only.');
      return;
    }
    openModal(adminModal);
    refreshFeedbackBadge();
    try {
      const data = await api('/api/admin/stats');
      const s = data.stats || {};
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v != null ? String(v) : '—'; };
      set('adminStatUsers', s.totalUsers);
      set('adminStatActive', s.activeThisWeek);
      set('adminStatPlaces', s.totalPlaces);
      set('adminStatTrips', s.totalTrips);
      set('adminStatHotels', s.recommendedHotels);
      set('adminStatReviews', s.totalReviews);
      set('adminStatSpent', s.totalSpentAllUsers != null ? ('₹' + Number(s.totalSpentAllUsers).toLocaleString('en-IN')) : '—');
      set('adminStatAvg', s.avgSpendPerHead != null ? ('₹' + Number(s.avgSpendPerHead).toLocaleString('en-IN')) : '—');
      const body = document.getElementById('adminUsersBody');
      if (body) {
        body.innerHTML = (data.users || []).map(u => {
          const icons = Array.isArray(u.badgeIcons) && u.badgeIcons.length
            ? u.badgeIcons.map(ic => `<span class="admin-user-badge" title="Badge">${ic}</span>`).join('')
            : '<span class="admin-user-badge-empty">—</span>';
          const xp = Number(u.xp || 0);
          const bc = Number(u.badgesCount || 0);
          return `
          <tr>
            <td>${escapeHtml(u.name || '')}${u.isAdmin ? ' <span class="admin-badge">ADMIN</span>' : ''}</td>
            <td>
              <div class="admin-user-email">${escapeHtml(u.email)}</div>
              <div class="admin-user-badges" title="${bc} badge(s) unlocked">${icons} <span class="admin-badge-count">${bc}/12</span></div>
            </td>
            <td><strong class="admin-user-xp">${xp.toLocaleString('en-IN')}</strong> XP</td>
            <td>${escapeHtml(u.college || '—')}</td>
            <td>${u.tripsCount || 0}</td>
            <td>${fmtDate(u.createdAt)}</td>
            <td>${fmtDate(u.lastActiveAt)}</td>
          </tr>`;
        }).join('') || '<tr><td colspan="7">No users yet</td></tr>';
      }
      // Load all default admin panes immediately; previously the Places tab could
      // appear empty until the user clicked its tab a second time.
      loadAdminPlaces();
      loadAdminPlaceReports();
      loadAdminComments();
    } catch (err) {
      showToast(err.message || 'Could not load admin stats');
    }
  }

  function fillSamplePlaceSelect() {
    const sel = document.getElementById('samplePlace');
    if (!sel) return;
    const current = sel.value;
    const options = Object.values(PLACES_DATA).map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
    sel.innerHTML = options || '<option value="">Add a place first</option>';
    if (current) sel.value = current;
  }

  document.getElementById('adminSampleForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!session.user?.isAdmin) { showToast('Admin access only.'); return; }
    const placeId = document.getElementById('samplePlace')?.value;
    const place = PLACES_DATA[placeId];
    const comment = document.getElementById('sampleComment')?.value?.trim();
    if (!placeId || !comment) { showToast('Choose a place and write the sample comment.'); return; }
    try {
      await api('/api/admin/sample-comments', {
        method: 'POST',
        body: {
          placeId,
          placeName: place?.name || placeId,
          comment,
          rating: document.getElementById('sampleRating')?.value || 4.5
        }
      });
      document.getElementById('sampleComment').value = '';
      showToast('Sample comment published.');
      loadAdminComments();
    } catch (err) { showToast(err.message); }
  });

  document.getElementById('seedSampleCommentsBtn')?.addEventListener('click', async () => {
    if (!session.user?.isAdmin) { showToast('Admin access only.'); return; }
    try {
      const data = await api('/api/admin/sample-comments', { method: 'POST', body: { seedAll: true } });
      showToast(data.added ? `Added ${data.added} starter notes.` : 'Starter notes are already on those places.');
      loadAdminComments();
    } catch (err) { showToast(err.message); }
  });

  const _openAdminDashboard = openAdminDashboard;
  openAdminDashboard = async function () {
    await _openAdminDashboard();
    fillSamplePlaceSelect();
  };

  navAdminBtn?.addEventListener('click', openAdminDashboard);
  closeAdminModalBtn?.addEventListener('click', () => closeModal(adminModal));
  adminModal?.addEventListener('click', (e) => { if (e.target === adminModal) closeModal(adminModal); });

  async function loadAdminAnalytics() {
    const body = document.getElementById('adminAnalyticsBody');
    if (!body) return;
    body.innerHTML = '<p style="color:#64748B">Loading analytics…</p>';
    try {
      const data = await api('/api/admin/analytics');
      const a = data.analytics || {};
      const top = (a.topPlaces || []).map(p =>
        `<tr><td>${escapeHtml(p.name)}</td><td>${p.trips}</td><td>₹${Number(p.totalSpent).toLocaleString('en-IN')}</td><td>₹${Number(p.avg).toLocaleString('en-IN')}</td></tr>`
      ).join('') || '<tr><td colspan="4">No trips logged yet</td></tr>';
      const modes = (a.transitModes || []).map(m =>
        `<li><strong>${escapeHtml(m.mode)}</strong> — ${m.count} trip(s)</li>`
      ).join('') || '<li>No transit data yet</li>';
      body.innerHTML = `
        <div class="admin-analytics-summary">
          <div class="admin-stat-card"><span class="as-label">Users</span><span class="as-value">${a.users ?? '—'}</span></div>
          <div class="admin-stat-card"><span class="as-label">Trips</span><span class="as-value">${a.tripsLogged ?? '—'}</span></div>
          <div class="admin-stat-card"><span class="as-label">Reviews</span><span class="as-value">${a.reviews ?? '—'}</span></div>
          <div class="admin-stat-card"><span class="as-label">Total spent</span><span class="as-value">₹${Number(a.totalSpent || 0).toLocaleString('en-IN')}</span></div>
          <div class="admin-stat-card"><span class="as-label">Avg / trip</span><span class="as-value">₹${Number(a.avgTripSpend || 0).toLocaleString('en-IN')}</span></div>
          <div class="admin-stat-card"><span class="as-label">Recommended</span><span class="as-value">${a.recommended ?? '—'}</span></div>
        </div>
        <h4 style="margin:1rem 0 .5rem;font-size:.95rem">Most logged places</h4>
        <div class="admin-users-table-wrap"><table class="admin-users-table"><thead><tr><th>Place</th><th>Trips</th><th>Total spent</th><th>Avg / trip</th></tr></thead><tbody>${top}</tbody></table></div>
        <h4 style="margin:1rem 0 .5rem;font-size:.95rem">Transit modes used</h4>
        <ul class="admin-mode-list">${modes}</ul>
        <p class="form-helper" style="margin-top:1rem">These numbers update automatically from student outing logs and reviews.</p>`;
    } catch (err) {
      body.innerHTML = `<p style="color:#b91c1c">${escapeHtml(err.message || 'Failed to load analytics')}</p>`;
    }
  }

  async function loadAdminPlaceReports() {
    const host = document.getElementById('adminPlaceReports');
    if (!host) return;
    host.textContent = 'Loading reports…';
    try {
      const data = await api('/api/admin/place-reports');
      const reports = data.reports || [];
      if (!reports.length) {
        host.textContent = 'No community reports yet.';
        return;
      }
      const mapLink = (lat, lng) => `https://www.google.com/maps?q=${encodeURIComponent(lat + ',' + lng)}`;
      host.innerHTML = reports.map(r => {
        const hasPin = r.suggested_lat != null && r.suggested_lng != null;
        const hasFix = r.reporter_lat != null && r.reporter_lng != null;
        const placeLat = r.place_lat, placeLng = r.place_lng;
        return `
        <div style="display:flex;justify-content:space-between;gap:.75rem;align-items:flex-start;flex-wrap:wrap;border:1px solid #E2E8F0;border-radius:10px;padding:.65rem;margin:.45rem 0">
          <div style="min-width:220px;flex:1">
            <strong>${escapeHtml(r.place_name || r.place_id)}</strong>
            <span class="admin-badge">${escapeHtml((r.kind || 'other').replace('_', ' '))}</span>${r.source === 'auto' ? ' <span class="admin-badge">auto from verified visits</span>' : ''}
            <div class="form-helper">${escapeHtml(r.message || 'No note')} · ${escapeHtml(r.reporter_email || 'Student')} · ${escapeHtml(fmtDate(new Date(r.created_at).getTime()))}</div>
            ${r.suggested_address ? `<div class="form-helper">🏠 Suggested address: <b>${escapeHtml(r.suggested_address)}</b></div>` : ''}
            ${hasPin ? `<div class="form-helper">📍 Suggested pin: <a href="${mapLink(r.suggested_lat, r.suggested_lng)}" target="_blank" rel="noopener">${Number(r.suggested_lat).toFixed(5)}, ${Number(r.suggested_lng).toFixed(5)}</a>${placeLat ? ` · current pin <a href="${mapLink(placeLat, placeLng)}" target="_blank" rel="noopener">${Number(placeLat).toFixed(5)}, ${Number(placeLng).toFixed(5)}</a>` : ''}</div>` : ''}
            ${hasFix ? `<div class="form-helper">📡 Reporter GPS: <a href="${mapLink(r.reporter_lat, r.reporter_lng)}" target="_blank" rel="noopener">${Number(r.reporter_lat).toFixed(5)}, ${Number(r.reporter_lng).toFixed(5)}</a> (±${Math.round(Number(r.reporter_accuracy_m || 0))} m)</div>` : ''}
            ${r.photo ? `<a href="${escapeHtml(r.photo)}" target="_blank" rel="noopener"><img src="${escapeHtml(r.photo)}" alt="Photo sent with the report" style="max-width:180px;max-height:130px;border-radius:8px;margin-top:.35rem"></a>` : ''}
            <small>${escapeHtml(r.status || 'pending')} · ID ${escapeHtml(r.id)}</small>
          </div>
          <div style="display:flex;gap:.35rem;flex-wrap:wrap">
            ${r.status === 'pending' && (hasPin || hasFix) && (r.kind === 'wrong_pin' || r.kind === 'wrong_address') ? `<button type="button" class="btn btn-primary btn-sm report-apply" data-id="${escapeHtml(r.id)}">Apply suggested pin</button>` : ''}
            ${r.status !== 'resolved' ? `<button type="button" class="btn btn-outline btn-sm report-resolve" data-id="${escapeHtml(r.id)}">Resolve</button>` : ''}
            ${r.status !== 'dismissed' ? `<button type="button" class="btn btn-ghost btn-sm report-dismiss" data-id="${escapeHtml(r.id)}">Dismiss</button>` : ''}
          </div>
        </div>`;
      }).join('');
      host.querySelectorAll('.report-apply').forEach(btn => btn.addEventListener('click', async () => {
        if (!confirm('Move this place\'s pin to the suggested position? Everyone will see the new pin.')) return;
        try { await api('/api/admin/place-reports/' + encodeURIComponent(btn.dataset.id), { method: 'PATCH', body: { applyPin: true } }); showToast('Pin updated and the reporter earned XP.'); loadAdminPlaceReports(); loadCommunityPlaces(); }
        catch (err) { showToast(err.message || 'Could not apply the pin.'); }
      }));
      host.querySelectorAll('.report-resolve').forEach(btn => btn.addEventListener('click', async () => {
        try { await api('/api/admin/place-reports/' + encodeURIComponent(btn.dataset.id), { method: 'PATCH', body: { status: 'resolved' } }); loadAdminPlaceReports(); }
        catch (err) { showToast(err.message); }
      }));
      host.querySelectorAll('.report-dismiss').forEach(btn => btn.addEventListener('click', async () => {
        try { await api('/api/admin/place-reports/' + encodeURIComponent(btn.dataset.id), { method: 'PATCH', body: { status: 'dismissed' } }); loadAdminPlaceReports(); }
        catch (err) { showToast(err.message); }
      }));
    } catch (err) {
      host.textContent = err.message || 'Could not load community reports.';
    }
  }

  async function loadAdminPlaces() {
    const body = document.getElementById('adminPlacesBody');
    if (!body) return;
    body.innerHTML = '<tr><td colspan="7">Loading…</td></tr>';
    try {
      const data = await api('/api/admin/places');
      const list = data.places || [];
      if (!list.length) {
        body.innerHTML = '<tr><td colspan="7">No community / recommended places in the database yet. Use Recommend tab or wait for student submissions.</td></tr>';
        return;
      }
      body.innerHTML = list.map(p => {
        const flags = [
          p.recommendedByAdmin ? 'Admin pick' : '',
          p.isHotel ? 'Hotel' : '',
          p.showInHero === false ? 'Hidden from hero' : '',
          (p.status && p.status !== 'published') ? ({ pending: '⏳ Pending approval', draft: '📝 Draft', rejected: '⛔ Rejected', unpublished: '🚫 Unpublished' }[p.status] || p.status) : '',
        ].filter(Boolean).join(' · ') || '—';
        const st = p.status || 'published';
        return `<tr data-place-id="${escapeHtml(p.id)}">
          <td><strong>${escapeHtml(p.name || '')}</strong><br><small style="color:#64748B">${escapeHtml(p.location || '')}</small><br><small style="color:#94A3B8">ID: ${escapeHtml(p.id)}</small></td>
          <td style="font-size:.78rem">${escapeHtml(p.addedBy || 'Admin team')}${p.addedByEmail ? `<br><small style="color:#64748B">${escapeHtml(p.addedByEmail)}</small>` : ''}${p.addedAt ? `<br><small style="color:#64748B">${escapeHtml(fmtDate(p.addedAt))}</small>` : ''}</td>
          <td>${escapeHtml(p.categoryLabel || p.category || '—')}</td>
          <td>★ ${p.rating != null ? p.rating : '—'}</td>
          <td>₹${p.minBudget ?? '—'}–₹${p.maxBudget ?? '—'}</td>
          <td style="font-size:.78rem">${escapeHtml(flags)}</td>
          <td style="white-space:nowrap">
            ${st !== 'published' ? `<button type="button" class="btn btn-primary btn-sm admin-set-status" data-id="${escapeHtml(p.id)}" data-status="published">✓ Publish</button>` : `<button type="button" class="btn btn-ghost btn-sm admin-set-status" data-id="${escapeHtml(p.id)}" data-status="unpublished">Unpublish</button>`}
            ${st === 'pending' ? `<button type="button" class="btn btn-ghost btn-sm admin-set-status" style="color:#DC2626" data-id="${escapeHtml(p.id)}" data-status="rejected">Reject</button>` : ''}
            <button type="button" class="btn btn-ghost btn-sm admin-edit-place" data-id="${escapeHtml(p.id)}">Edit</button>
            <button type="button" class="btn btn-ghost btn-sm admin-photos-place" data-id="${escapeHtml(p.id)}">Photos${Array.isArray(p.photoSubmissions) && p.photoSubmissions.filter(x => x.status === 'pending').length ? ' 🔔' + p.photoSubmissions.filter(x => x.status === 'pending').length : ''}</button>
            <button type="button" class="btn btn-ghost btn-sm admin-rate-place" data-id="${escapeHtml(p.id)}" data-rating="${p.rating || 4.5}">Rating</button>
            <button type="button" class="btn btn-ghost btn-sm admin-toggle-rec" data-id="${escapeHtml(p.id)}" data-rec="${p.recommendedByAdmin ? '1' : '0'}">${p.recommendedByAdmin ? 'Unfeature' : 'Feature'}</button>
            <button type="button" class="btn btn-ghost btn-sm admin-merge-place" data-id="${escapeHtml(p.id)}" title="Merge this duplicate into another place (keeps target, removes source)">Merge</button>
            <button type="button" class="btn btn-ghost btn-sm admin-del-place" data-id="${escapeHtml(p.id)}" style="color:#DC2626">Delete</button>
          </td>
        </tr>`;
      }).join('');

      body.querySelectorAll('.admin-merge-place').forEach(btn => btn.addEventListener('click', async () => {
        const targetId = prompt(`Merge this place (${btn.dataset.id}) INTO which existing place ID? The current row will be removed after its photos/reviews are moved.`);
        if (!targetId) return;
        if (!confirm(`Merge ${btn.dataset.id} into ${targetId}? This cannot be undone.`)) return;
        try {
          await api('/api/admin/places/merge', { method: 'POST', body: { sourceId: btn.dataset.id, targetId: targetId.trim() } });
          showToast('Places merged. Refreshing the public list…');
          delete PLACES_DATA[btn.dataset.id];
          await loadAdminPlaces();
          await loadCommunityPlaces();
        } catch (err) { showToast(err.message || 'Could not merge places.'); }
      }));
      body.querySelectorAll('.admin-edit-place').forEach(btn => btn.addEventListener('click', () => openAdminPlaceEditor(btn.dataset.id)));
      body.querySelectorAll('.admin-photos-place').forEach(btn => btn.addEventListener('click', () => openAdminPhotoManager(btn.dataset.id)));
      body.querySelectorAll('.admin-del-place').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this place permanently for everyone?')) return;
          try {
            await api('/api/admin/places/' + encodeURIComponent(btn.dataset.id), { method: 'DELETE' });
            const card = document.querySelector(`.place-card[data-id="${btn.dataset.id}"]`);
            if (card) card.remove();
            delete PLACES_DATA[btn.dataset.id];
            showToast('Place deleted.');
            loadAdminPlaces();
            if (typeof loadHeroRecommendations === 'function') loadHeroRecommendations();
          } catch (err) { showToast(err.message); }
        });
      });
      body.querySelectorAll('.admin-rate-place').forEach(btn => {
        btn.addEventListener('click', async () => {
          const next = prompt('Set rating (1–5):', btn.dataset.rating || '4.5');
          if (next == null) return;
          const rating = Math.min(5, Math.max(1, parseFloat(next) || 4.5));
          try {
            const data = await api('/api/admin/places/' + encodeURIComponent(btn.dataset.id), {
              method: 'PATCH',
              body: { rating }
            });
            if (data.place && PLACES_DATA[data.place.id]) {
              PLACES_DATA[data.place.id].rating = data.place.rating;
            }
            const card = document.querySelector(`.place-card[data-id="${btn.dataset.id}"]`);
            if (card) card.setAttribute('data-rating', String(rating));
            showToast('Rating updated to ★ ' + rating);
            loadAdminPlaces();
          } catch (err) { showToast(err.message); }
        });
      });
      body.querySelectorAll('.admin-toggle-rec').forEach(btn => {
        btn.addEventListener('click', async () => {
          const on = btn.dataset.rec !== '1';
          let until = '';
          if (on) {
            until = (prompt('Show this featured recommendation until which date? Enter YYYY-MM-DD (it disappears automatically after that day), or leave empty for no end date.', '') || '').trim();
            if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) { showToast('Use the format YYYY-MM-DD, for example 2026-12-31.'); return; }
          }
          try {
            await api('/api/admin/places/' + encodeURIComponent(btn.dataset.id), {
              method: 'PATCH',
              body: { recommendedByAdmin: on, showInHero: on, featuredUntil: on ? until : '' }
            });
            showToast(on ? 'Marked as admin recommendation.' : 'Removed from recommendations.');
            loadAdminPlaces();
            if (typeof loadHeroRecommendations === 'function') loadHeroRecommendations();
          } catch (err) { showToast(err.message); }
        });
      });
    } catch (err) {
      body.innerHTML = `<tr><td colspan="7">${escapeHtml(err.message || 'Failed to load places')}</td></tr>`;
    }
  }

  // ============================================================================
  // ADMIN TOOLS: edit a place (description etc.) and choose its best photo
  // + USER TOOL: add a photo to an existing place
  // ============================================================================
  let adminToolModal = null;
  function getAdminToolModal() {
    if (adminToolModal) return adminToolModal;
    adminToolModal = document.createElement('div');
    adminToolModal.className = 'modal-backdrop admin-tool-modal';
    adminToolModal.setAttribute('aria-hidden', 'true');
    adminToolModal.setAttribute('role', 'dialog');
    adminToolModal.innerHTML = '<div class="modal-container modal-lg"><button type="button" class="modal-close-btn" aria-label="Close">&times;</button><div class="modal-content" data-tool-body></div></div>';
    document.body.appendChild(adminToolModal);
    adminToolModal.querySelector('.modal-close-btn').addEventListener('click', () => closeModal(adminToolModal));
    adminToolModal.addEventListener('click', (e) => { if (e.target === adminToolModal) closeModal(adminToolModal); });
    return adminToolModal;
  }
  function adminToolBody() { return getAdminToolModal().querySelector('[data-tool-body]'); }

  /** Pushes a changed place into the page: data store, its card and the open details popup. */
  function applyPlaceToPage(place) {
    if (!place || !place.id) return;
    place = Object.assign({}, place); delete place.photoSubmissions;
    PLACES_DATA[place.id] = Object.assign(PLACES_DATA[place.id] || {}, place);
    const card = document.querySelector(`.place-card[data-id="${place.id}"]`);
    if (card) {
      const n = card.querySelector('.place-name'); if (n) n.textContent = place.name || '';
      const d = card.querySelector('.place-desc'); if (d) d.textContent = place.description || '';
      const l = card.querySelector('.place-location-row span'); if (l) l.textContent = place.location || '';
      const media = card.querySelector('.place-media');
      if (media) {
        let img = media.querySelector('img.place-img');
        const empty = media.querySelector('.place-media-empty');
        if (place.image) {
          if (!img) { img = document.createElement('img'); img.className = 'place-img'; img.loading = 'lazy'; media.insertBefore(img, empty || media.querySelector('.place-category-badge')); }
          img.src = place.image; img.alt = place.name || '';
          if (empty) empty.remove();
        } else if (img) {
          img.remove();
          if (!empty) { const e = document.createElement('div'); e.className = 'place-media-empty'; e.innerHTML = '<strong>No photo yet</strong><small>We only show a picture when you upload one or we can match the real place.</small>'; media.insertBefore(e, media.querySelector('.place-category-badge')); }
        }
      }
    }
    if (currentState.activeModalPlaceId === place.id && placeDetailsModal && placeDetailsModal.classList.contains('open')) openPlaceDetails(place.id);
  }

  async function openAdminPlaceEditor(placeId) {
    const body = adminToolBody();
    body.innerHTML = '<p>Loading…</p>';
    openModal(getAdminToolModal());
    let p;
    try {
      const data = await api('/api/admin/places');
      p = (data.places || []).find(x => String(x.id) === String(placeId));
      if (!p) throw new Error('Place not found.');
    } catch (err) { body.innerHTML = `<p>${escapeHtml(err.message)}</p>`; return; }
    const f = (id, label, val, type = 'text', extra = '') => `<div class="form-group"><label class="form-label" for="${id}">${label}</label><input class="calc-input" id="${id}" type="${type}" value="${escapeHtml(String(val ?? ''))}" ${extra} /></div>`;
    body.innerHTML = `
      <h3 class="modal-title">Edit place</h3>
      <p class="form-helper">Added by <strong>${escapeHtml(p.addedBy || 'the admin team')}</strong>${p.addedByEmail ? ` (${escapeHtml(p.addedByEmail)})` : ''}${p.addedAt ? ' on ' + escapeHtml(fmtDate(p.addedAt)) : ''}. As admin you can change anything below.</p>
      <form id="adminPlaceEditForm" class="upload-place-form">
        <div class="form-row-2col">${f('apeName', 'Name', p.name, 'text', 'maxlength="80" required')}${f('apeArea', 'Area / location', p.location, 'text', 'maxlength="160"')}</div>
        <div class="form-group"><label class="form-label" for="apeDesc">Description</label><textarea class="calc-input textarea-input" id="apeDesc" rows="4" maxlength="600">${escapeHtml(p.description || '')}</textarea></div>
        <div class="form-row-2col">${f('apeFamous', 'Famous for', p.famousFor, 'text', 'maxlength="200"')}${f('apeMetro', 'Nearest metro / bus stop', p.metro, 'text', 'maxlength="160"')}</div>
        <div class="form-row-2col">${f('apeBest', 'Best time to visit', p.bestTime, 'text', 'maxlength="100"')}${f('apeTip', 'Student saving tip', p.studentTip, 'text', 'maxlength="250"')}</div>
        <div class="form-row-2col">${f('apeMin', 'Budget from (₹)', p.minBudget, 'number', 'min="0"')}${f('apeMax', 'Budget up to (₹)', p.maxBudget, 'number', 'min="0"')}</div>
        <div class="form-row-2col">${f('apeFee', 'Entry fee (₹)', p.entryFee, 'number', 'min="0"')}${f('apeRating', 'Rating (1–5)', p.rating, 'number', 'min="1" max="5" step="0.1"')}</div>
        <label class="admin-hidden-gem-toggle"><input id="apeHiddenGem" type="checkbox" ${p.hiddenGem ? 'checked' : ''}> Mark this destination as a Hidden Gem (counts towards the Hidden Gem Hunter badge)</label>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button type="submit" class="btn btn-primary btn-sm">Save changes</button>
          <button type="button" class="btn btn-outline btn-sm" id="apeOpenPhotos">🖼️ Manage photos</button>
        </div>
      </form>`;
    body.querySelector('#apeOpenPhotos').addEventListener('click', () => openAdminPhotoManager(placeId));
    body.querySelector('#adminPlaceEditForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = (id) => body.querySelector('#' + id).value;
      try {
        const data = await api('/api/admin/places/' + encodeURIComponent(placeId), {
          method: 'PATCH',
          body: { name: v('apeName'), area: v('apeArea'), description: v('apeDesc'), famousFor: v('apeFamous'), metro: v('apeMetro'), bestTime: v('apeBest'), tip: v('apeTip'), minBudget: v('apeMin'), maxBudget: v('apeMax'), entryFee: v('apeFee'), rating: v('apeRating'), hiddenGem: body.querySelector('#apeHiddenGem').checked }
        });
        applyPlaceToPage(Object.assign({}, data.place, { _db: true }));
        showToast('Place updated for everyone.');
        closeModal(getAdminToolModal());
        loadAdminPlaces();
      } catch (err) { showToast(err.message); }
    });
  }

  async function openAdminPhotoManager(placeId) {
    const body = adminToolBody();
    body.innerHTML = '<p>Loading photos…</p>';
    openModal(getAdminToolModal());
    let p;
    try {
      const data = await api('/api/admin/places');
      p = (data.places || []).find(x => String(x.id) === String(placeId));
      if (!p) throw new Error('Place not found.');
    } catch (err) { body.innerHTML = `<p>${escapeHtml(err.message)}</p>`; return; }
    const gallery = Array.isArray(p.photos) ? p.photos : [];
    const subs = (Array.isArray(p.photoSubmissions) ? p.photoSubmissions : []).filter(s => s.status !== 'rejected');
    const subUrls = new Set(subs.map(s => s.url));
    const tile = (url, label, sub, actions) => `
      <div class="apm-tile" style="width:190px;border:2px solid ${url === p.image ? '#4F46E5' : '#E2E8F0'};border-radius:12px;padding:.5rem;background:#fff">
        <img src="${escapeHtml(url)}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px" loading="lazy" />
        <div style="font-size:.72rem;margin:.35rem 0;color:#475569"><strong>${label}</strong>${sub ? '<br>' + sub : ''}</div>
        <div style="display:flex;gap:.3rem;flex-wrap:wrap">${actions}</div>
      </div>`;
    const btn = (cls, text, attrs, danger) => `<button type="button" class="btn btn-ghost btn-sm ${cls}" ${attrs} style="${danger ? 'color:#DC2626;' : ''}padding:.2rem .5rem;font-size:.72rem">${text}</button>`;
    const galleryTiles = gallery.map(url => {
      const s = subs.find(x => x.url === url);
      const label = url === p.image ? '⭐ Main photo' : 'In gallery';
      const who = s ? `Uploaded by ${escapeHtml(s.by || 'a student')}${s.email ? '<br>' + escapeHtml(s.email) : ''}` : (/^data:/.test(url) ? 'Uploaded' : 'Found automatically (Wikimedia)');
      const idAttr = s ? `data-id="${escapeHtml(s.id)}"` : `data-url="${escapeHtml(url)}"`;
      return tile(url, label, who, (url === p.image ? '' : btn('apm-main', 'Make main', idAttr)) + btn('apm-del', 'Delete', idAttr, true));
    }).join('');
    const pending = subs.filter(s => !gallery.includes(s.url));
    const pendingTiles = pending.map(s => tile(s.url, s.status === 'pending' ? '🕒 Waiting for you' : 'Not in gallery', `By ${escapeHtml(s.by || 'a student')}<br>${escapeHtml(s.email || '')}<br>${escapeHtml(fmtDate(s.at))}`,
      btn('apm-main', 'Make main', `data-id="${escapeHtml(s.id)}"`) + btn('apm-gal', 'Add to gallery', `data-id="${escapeHtml(s.id)}"`) + btn('apm-del', 'Delete', `data-id="${escapeHtml(s.id)}"`, true))).join('');
    body.innerHTML = `
      <h3 class="modal-title">Photos — ${escapeHtml(p.name || '')}</h3>
      <p class="form-helper">You decide which picture represents this place. "Make main" shows it on the card; deleting removes it for everyone.</p>
      <h4 class="reviews-section-title">On the place now (${gallery.length})</h4>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:1rem">${galleryTiles || '<p class="form-helper">No photo is showing for this place.</p>'}</div>
      <h4 class="reviews-section-title">Added by students (${pending.length} waiting)</h4>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:1rem">${pendingTiles || '<p class="form-helper">No other photos have been added.</p>'}</div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <label class="btn btn-outline btn-sm" style="cursor:pointer">📷 Upload my own<input type="file" accept="image/*" id="apmUpload" class="file-input-hidden" /></label>
      </div>`;
    const run = async (type, el) => {
      try {
        const action = { type };
        if (el.dataset.id) action.id = el.dataset.id; else action.url = el.dataset.url;
        const data = await api('/api/admin/places/' + encodeURIComponent(placeId), { method: 'PATCH', body: { photoAction: action } });
        applyPlaceToPage(Object.assign({}, data.place, { photoSubmissions: undefined, _db: true }));
        showToast(type === 'delete' ? 'Photo deleted.' : 'Photo updated.');
        openAdminPhotoManager(placeId);
        loadAdminPlaces();
      } catch (err) { showToast(err.message); }
    };
    body.querySelectorAll('.apm-main').forEach(b => b.addEventListener('click', () => run('main', b)));
    body.querySelectorAll('.apm-gal').forEach(b => b.addEventListener('click', () => run('gallery', b)));
    body.querySelectorAll('.apm-del').forEach(b => b.addEventListener('click', () => { if (confirm('Delete this photo?')) run('delete', b); }));
    body.querySelector('#apmUpload')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      try {
        const image = await compressImageFile(file);
        const data = await api('/api/admin/places/' + encodeURIComponent(placeId), { method: 'PATCH', body: { image } });
        applyPlaceToPage(Object.assign({}, data.place, { photoSubmissions: undefined, _db: true }));
        showToast('Your photo is now the main picture.');
        openAdminPhotoManager(placeId);
      } catch (err) { showToast(err.message); }
    });
  }

  // Any signed-in student can add a photo to a place that is in the community list.
  async function addPhotoToPlace(placeId) {
    if (!isLoggedIn()) { openAuth('login', 'Log in to add a photo of this place.'); return; }
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.addEventListener('change', async () => {
      const file = input.files?.[0]; if (!file) return;
      try {
        showToast('Uploading photo…');
        const image = await compressImageFile(file);
        const data = await api('/api/places/' + encodeURIComponent(placeId) + '/photos', { method: 'POST', body: { image } });
        window.dispatchEvent(new Event('se-gamification-refresh'));
        if (data.shownNow) applyPlaceToPage({ id: placeId, image, photos: [image] });
        showToast(data.message || 'Photo added.');
      } catch (err) { showToast(err.message || 'Could not add that photo.'); }
    });
    input.click();
  }

  /** Buttons in the place details popup: add photo (everyone signed in) and edit / photos (admin). */
  function renderModalPlaceTools(placeId) {
    const host = document.getElementById('modalPlaceDescription');
    if (!host) return;
    let bar = document.getElementById('modalPlaceTools');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'modalPlaceTools';
      bar.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap;margin:.6rem 0 .2rem';
      host.insertAdjacentElement('afterend', bar);
    }
    const place = PLACES_DATA[placeId];
    bar.innerHTML = '';
    if (!place || !place._db) return;
    const mk = (text, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-outline btn-sm'; b.textContent = text; b.addEventListener('click', fn); bar.appendChild(b); };
    mk('📷 Add a photo of this place', () => addPhotoToPlace(placeId));
    if (session.user?.isAdmin) {
      mk('✏️ Edit place (admin)', () => openAdminPlaceEditor(placeId));
      mk('🖼️ Manage photos (admin)', () => openAdminPhotoManager(placeId));
    }
  }
  window.addEventListener('se-auth', () => { if (currentState.activeModalPlaceId) renderModalPlaceTools(currentState.activeModalPlaceId); });

  // Recommend tab: every recommended place, with a button to take it off (or delete it completely)
  async function loadAdminRecs() {
    const host = document.getElementById('adminRecList');
    if (!host) return;
    host.innerHTML = '<p class="form-helper">Loading recommended places…</p>';
    try {
      const data = await api('/api/admin/places');
      const list = (data.places || []).filter(p => p.recommendedByAdmin || p.isHotel);
      if (!list.length) { host.innerHTML = '<p class="form-helper">No recommended places yet. Publish one above.</p>'; return; }
      host.innerHTML = `<h4 class="reviews-section-title">Recommended places (${list.length})</h4>` + list.map(p => `
        <div class="admin-rec-row" data-id="${escapeHtml(p.id)}" style="display:flex;align-items:center;gap:.75rem;padding:.55rem 0;border-bottom:1px solid #E2E8F0">
          ${p.image ? `<img src="${escapeHtml(p.image)}" alt="" style="width:56px;height:44px;object-fit:cover;border-radius:8px" />` : '<div style="width:56px;height:44px;border-radius:8px;background:#F1F5F9"></div>'}
          <div style="flex:1;min-width:0"><strong>${escapeHtml(p.name || '')}</strong><br><small style="color:#64748B">${escapeHtml(p.location || '')}</small></div>
          <button type="button" class="btn btn-outline btn-sm rec-unfeature" data-id="${escapeHtml(p.id)}" title="Stop recommending, keep the place listed">Remove from recommended</button>
          <button type="button" class="btn btn-ghost btn-sm rec-delete" data-id="${escapeHtml(p.id)}" style="color:#DC2626" title="Delete the place for everyone">Delete place</button>
        </div>`).join('');
      host.querySelectorAll('.rec-unfeature').forEach(btn => btn.addEventListener('click', async () => {
        try {
          await api('/api/admin/places/' + encodeURIComponent(btn.dataset.id), { method: 'PATCH', body: { recommendedByAdmin: false, isHotel: false, showInHero: false } });
          const place = PLACES_DATA[btn.dataset.id]; if (place) { place.recommendedByAdmin = false; place.isHotel = false; }
          document.querySelector(`.place-card[data-id="${btn.dataset.id}"] .community-badge`)?.remove();
          showToast('Removed from recommended places.');
          loadAdminRecs();
          if (typeof loadHeroRecommendations === 'function') loadHeroRecommendations();
        } catch (err) { showToast(err.message); }
      }));
      host.querySelectorAll('.rec-delete').forEach(btn => btn.addEventListener('click', async () => {
        if (!confirm('Delete this place permanently for everyone?')) return;
        try {
          await api('/api/admin/places/' + encodeURIComponent(btn.dataset.id), { method: 'DELETE' });
          document.querySelector(`.place-card[data-id="${btn.dataset.id}"]`)?.remove();
          delete PLACES_DATA[btn.dataset.id];
          showToast('Place deleted.');
          loadAdminRecs();
          if (typeof loadHeroRecommendations === 'function') loadHeroRecommendations();
        } catch (err) { showToast(err.message); }
      }));
    } catch (err) { host.innerHTML = `<p class="form-helper">${escapeHtml(err.message || 'Could not load')}</p>`; }
  }

  document.getElementById('refreshPlaceReportsBtn')?.addEventListener('click', loadAdminPlaceReports);

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const pane = tab.dataset.adminTab;
      const map = {
        users: 'adminPaneUsers',
        analytics: 'adminPaneAnalytics',
        places: 'adminPanePlaces',
        comments: 'adminPaneComments',
        hotel: 'adminPaneHotel',
        rankings: 'adminPaneRankings',
        feedback: 'adminPaneFeedback',
        promos: 'adminPanePromos',
        welcome: 'adminPaneWelcome',
      };
      Object.entries(map).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) el.style.display = pane === key ? '' : 'none';
      });
      if (pane === 'comments') loadAdminComments();
      if (pane === 'analytics') loadAdminAnalytics();
      if (pane === 'places') loadAdminPlaces();
      if (pane === 'hotel') loadAdminRecs();
      if (pane === 'rankings' && window.__seLoadRankings) window.__seLoadRankings();
      if (pane === 'feedback') loadAdminFeedback();
      if (pane === 'promos') loadAdminPromos();
      if (pane === 'welcome') loadAdminWelcome();
    });
  });


  // ============================================================================
  // v17. FEEDBACK BOX
  // Students send text + an optional photo from the floating "Feedback" button (also in the sidebar, footer and the
  // "no results" box). Messages are stored server-side and ONLY the admin can read them: Admin Dashboard > Feedback.
  // ============================================================================
  const fbModal = document.getElementById('feedbackModal');
  const fbById = (id) => document.getElementById(id);
  const fbState = { kind: 'idea', rating: 0, photo: '', busy: false };

  function fbSetKind(kind) {
    fbState.kind = kind;
    document.querySelectorAll('#feedbackKinds .fb-kind').forEach(b => {
      const on = b.dataset.kind === kind;
      b.classList.toggle('active', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  function fbSetRating(n) {
    fbState.rating = n;
    document.querySelectorAll('#feedbackStars button').forEach(b => {
      const v = Number(b.dataset.star);
      b.classList.toggle('on', v <= n); b.setAttribute('aria-checked', v === n ? 'true' : 'false');
    });
  }
  function fbShowError(msg) {
    const el = fbById('feedbackError'); if (!el) return;
    el.textContent = msg || ''; el.hidden = !msg;
  }
  function fbClearPhoto() {
    fbState.photo = '';
    const input = fbById('feedbackPhoto'); if (input) input.value = '';
    const prev = fbById('feedbackPhotoPreview'); if (prev) prev.hidden = true;
    const img = fbById('feedbackPhotoImg'); if (img) img.removeAttribute('src');
  }
  function fbReset() {
    fbSetKind('idea'); fbSetRating(0); fbClearPhoto(); fbShowError('');
    const msg = fbById('feedbackMessage'); if (msg) msg.value = '';
    const cnt = fbById('feedbackCount'); if (cnt) cnt.textContent = '0 / 2000';
    const btn = fbById('feedbackSubmit'); if (btn) { btn.disabled = false; btn.textContent = 'Send feedback'; }
    fbState.busy = false;
    const form = fbById('feedbackForm'), thanks = fbById('feedbackThanks');
    if (form) form.hidden = false; if (thanks) thanks.hidden = true;
  }
  function openFeedback(kind) {
    if (!fbModal) return;
    fbReset();
    if (kind) fbSetKind(kind);
    const contact = fbById('feedbackContact');
    if (contact) { contact.value = session.user?.email || ''; }
    const wrap = fbById('feedbackContactWrap'); if (wrap) wrap.hidden = Boolean(session.user?.email);
    openModal(fbModal);
    setTimeout(() => fbById('feedbackMessage')?.focus(), 120);
  }

  // Any element with data-open-feedback opens the form (floating button, sidebar, footer, empty search state).
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-feedback]');
    if (!trigger) return;
    e.preventDefault();
    document.getElementById('sideNav')?.classList.remove('open');
    openFeedback(trigger.dataset.feedbackKind || '');
  });
  fbById('closeFeedbackBtn')?.addEventListener('click', () => closeModal(fbModal));
  fbById('feedbackThanksClose')?.addEventListener('click', () => closeModal(fbModal));
  fbModal?.addEventListener('click', (e) => { if (e.target === fbModal) closeModal(fbModal); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && fbModal?.classList.contains('open')) closeModal(fbModal); });

  fbById('feedbackKinds')?.addEventListener('click', (e) => { const b = e.target.closest('.fb-kind'); if (b) fbSetKind(b.dataset.kind); });
  fbById('feedbackStars')?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-star]'); if (!b) return;
    const n = Number(b.dataset.star);
    fbSetRating(fbState.rating === n ? 0 : n); // tap the same star again to clear
  });
  fbById('feedbackMessage')?.addEventListener('input', (e) => {
    const cnt = fbById('feedbackCount'); if (cnt) cnt.textContent = `${e.target.value.length} / 2000`;
    if (e.target.value.trim().length >= 5) fbShowError('');
  });

  fbById('feedbackPhoto')?.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    fbShowError('');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { fbShowError('Please choose a JPG, PNG or WebP image.'); e.target.value = ''; return; }
    if (file.size > 15 * 1024 * 1024) { fbShowError('That photo is over 15 MB. Please choose a smaller one.'); e.target.value = ''; return; }
    try {
      let data = await compressImageFile(file, 1100, 0.72);
      if (data.length > 1_200_000) data = await compressImageFile(file, 800, 0.6);
      if (data.length > 1_300_000) throw new Error('too large');
      fbState.photo = data;
      const img = fbById('feedbackPhotoImg'); if (img) img.src = data;
      const prev = fbById('feedbackPhotoPreview'); if (prev) prev.hidden = false;
    } catch {
      fbClearPhoto();
      fbShowError('Could not use that photo. Try a different one.');
    }
  });
  fbById('feedbackPhotoRemove')?.addEventListener('click', fbClearPhoto);

  fbById('feedbackForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (fbState.busy) return;
    const message = (fbById('feedbackMessage')?.value || '').trim();
    if (message.length < 5) { fbShowError('Please write at least a few words so we can understand.'); fbById('feedbackMessage')?.focus(); return; }
    const btn = fbById('feedbackSubmit');
    fbState.busy = true; if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    fbShowError('');
    try {
      await api('/api/feedback', { method: 'POST', body: {
        kind: fbState.kind, rating: fbState.rating || undefined, message,
        photo: fbState.photo || undefined,
        contactEmail: (fbById('feedbackContact')?.value || '').trim() || undefined,
        pageUrl: location.href.split('#')[0],
      } });
      const form = fbById('feedbackForm'), thanks = fbById('feedbackThanks');
      if (form) form.hidden = true; if (thanks) { thanks.hidden = false; thanks.querySelector('button')?.focus(); }
    } catch (err) {
      fbShowError(err.message || 'Could not send. Please try again.');
      if (btn) { btn.disabled = false; btn.textContent = 'Send feedback'; }
    } finally { fbState.busy = false; }
  });

  // ---- Admin side: Admin Dashboard > Feedback ----
  let fbAdminStatus = '';
  const FB_KIND = { bug: '🐞 Bug', idea: '💡 Idea', place: '📍 Place', praise: '❤️ Praise', other: '💬 Other' };
  function setFeedbackBadge(newCount) {
    const badge = fbById('adminFeedbackBadge'); if (!badge) return;
    badge.textContent = String(newCount); badge.hidden = !(newCount > 0);
  }
  async function refreshFeedbackBadge() {
    if (!session.user?.isAdmin) return;
    try { const d = await api('/api/admin/feedback?countOnly=1'); setFeedbackBadge(Number(d.counts?.new || 0)); } catch { /* badge is optional */ }
  }
  async function loadAdminFeedback() {
    const host = fbById('adminFeedbackList'); if (!host) return;
    if (!session.user?.isAdmin) { host.textContent = 'Admin access only.'; return; }
    host.textContent = 'Loading feedback…';
    try {
      const d = await api('/api/admin/feedback' + (fbAdminStatus ? `?status=${fbAdminStatus}` : ''));
      const counts = d.counts || {};
      document.querySelectorAll('[data-fb-count]').forEach(el => { const n = counts[el.dataset.fbCount]; el.textContent = n ? `(${n})` : ''; });
      setFeedbackBadge(Number(counts.new || 0));
      const list = d.feedback || [];
      if (!list.length) { host.innerHTML = '<p class="fb-empty">No feedback here yet. When students send some, it appears in this tab.</p>'; return; }
      host.innerHTML = list.map(f => {
        const who = f.user_name || f.user_email ? `${escapeHtml(f.user_name || '')} ${f.user_email ? '&lt;' + escapeHtml(f.user_email) + '&gt;' : ''}` : 'Guest (not logged in)';
        const reply = f.contact_email && f.contact_email !== f.user_email ? ` · reply to <a href="mailto:${escapeHtml(f.contact_email)}">${escapeHtml(f.contact_email)}</a>` : '';
        const stars = f.rating ? `<span class="fb-card-stars" title="${f.rating} / 5">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span>` : '';
        const photo = f.photo && /^data:image\//.test(f.photo) ? `<button type="button" class="fb-card-photo" data-fb-photo="${escapeHtml(f.id)}" aria-label="View photo full size"><img src="${f.photo}" alt="Photo sent with this feedback" loading="lazy" /></button>` : '';
        return `<article class="fb-card fb-${escapeHtml(f.status)}" data-fb-id="${escapeHtml(f.id)}">
          <div class="fb-card-head">
            <span class="fb-card-kind">${FB_KIND[f.kind] || FB_KIND.other}</span>${stars}
            <span class="fb-card-status">${f.status === 'new' ? 'New' : f.status === 'reviewed' ? 'Reviewed' : 'Done'}</span>
            <time class="fb-card-time">${escapeHtml(new Date(f.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))}</time>
          </div>
          <p class="fb-card-msg">${escapeHtml(f.message)}</p>
          ${photo}
          <p class="fb-card-who">From ${who}${reply}${f.page_url ? ` · <span class="fb-card-page">${escapeHtml(f.page_url)}</span>` : ''}</p>
          <div class="fb-card-actions">
            ${f.status !== 'reviewed' ? '<button type="button" class="btn btn-outline btn-sm" data-fb-act="reviewed">Mark reviewed</button>' : ''}
            ${f.status !== 'done' ? '<button type="button" class="btn btn-primary btn-sm" data-fb-act="done">✓ Done</button>' : ''}
            ${f.status !== 'new' ? '<button type="button" class="btn btn-outline btn-sm" data-fb-act="new">Reopen</button>' : ''}
            <button type="button" class="btn btn-outline btn-sm fb-delete" data-fb-act="delete">Delete</button>
          </div>
        </article>`;
      }).join('');
      host._photos = Object.fromEntries(list.filter(f => f.photo).map(f => [f.id, f.photo]));
    } catch (err) { host.textContent = err.message || 'Could not load feedback.'; }
  }
  fbById('adminFeedbackList')?.addEventListener('click', async (e) => {
    const host = e.currentTarget;
    const ph = e.target.closest('[data-fb-photo]');
    if (ph) {
      const box = fbById('fbLightbox'), img = fbById('fbLightboxImg');
      if (box && img && host._photos?.[ph.dataset.fbPhoto]) { img.src = host._photos[ph.dataset.fbPhoto]; box.hidden = false; }
      return;
    }
    const btn = e.target.closest('[data-fb-act]'); if (!btn) return;
    const id = btn.closest('[data-fb-id]')?.dataset.fbId; if (!id) return;
    try {
      btn.disabled = true;
      if (btn.dataset.fbAct === 'delete') {
        if (!confirm('Delete this feedback permanently?')) { btn.disabled = false; return; }
        await api('/api/admin/feedback/' + encodeURIComponent(id), { method: 'DELETE' });
      } else {
        await api('/api/admin/feedback/' + encodeURIComponent(id), { method: 'PATCH', body: { status: btn.dataset.fbAct } });
      }
      loadAdminFeedback();
    } catch (err) { btn.disabled = false; showToast(err.message || 'Could not update.'); }
  });
  fbById('adminFeedbackFilters')?.addEventListener('click', (e) => {
    const b = e.target.closest('.fb-pill'); if (!b) return;
    document.querySelectorAll('#adminFeedbackFilters .fb-pill').forEach(x => x.classList.toggle('active', x === b));
    fbAdminStatus = b.dataset.fbStatus || '';
    loadAdminFeedback();
  });
  fbById('adminFeedbackRefresh')?.addEventListener('click', loadAdminFeedback);
  (function lightbox() {
    const box = fbById('fbLightbox'); if (!box) return;
    const hide = () => { box.hidden = true; };
    box.addEventListener('click', hide);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) { hide(); e.stopPropagation(); } }, true);
  })();

  // ============================================================================
  // v17. PAID PROMOTIONS (shown to visitors) + VISIBILITY COUNTERS
  // The admin decides in Admin > Promotions who is promoted, how strongly, where and until when.
  // Visitors only see: a "Sponsored" label, the offer text and the better placement. Prices never leave the server.
  // ============================================================================
  const trackQueue = [];
  const trackSeenViews = new Set();
  function trackPlace(id, kind) {
    if (!id || !kind) return;
    if (kind === 'views') { if (trackSeenViews.has(id)) return; trackSeenViews.add(id); }
    trackQueue.push({ placeId: String(id), kind });
    if (trackQueue.length >= 20) flushTrack();
  }
  function flushTrack(useBeacon) {
    if (!trackQueue.length) return;
    const body = JSON.stringify({ events: trackQueue.splice(0, 40) });
    try {
      if (useBeacon && navigator.sendBeacon) { navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' })); return; }
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    } catch (_) { /* tracking must never break the page */ }
  }
  setInterval(() => flushTrack(false), 6000);
  window.addEventListener('pagehide', () => flushTrack(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushTrack(true); });

  const viewObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting && en.intersectionRatio >= 0.5) { trackPlace(en.target.dataset.id, 'views'); viewObserver.unobserve(en.target); } });
  }, { threshold: [0.5] }) : null;

  // Put the Sponsored label + offer on cards and lift promoted cards. Safe to call any number of times.
  function applyPromoDecor() {
    const searching = Boolean((currentState.query || '').trim());
    Object.keys(PROMOS).forEach(id => { if (!promoLive(PROMOS[id])) delete PROMOS[id]; });
    // Only the 3 strongest category_top promotions are pinned to the top of the list (the rest keep their label but not the pin),
    // so the list never turns into an ad board.
    const pinned = Object.keys(PROMOS).filter(id => PROMOS[id].placements.includes('category_top')).sort((a, b) => promoScore(b) - promoScore(a)).slice(0, 3);
    document.querySelectorAll('.place-card[data-id]').forEach(card => {
      const id = card.dataset.id;
      if (viewObserver && !card._seObs) { viewObserver.observe(card); card._seObs = true; }
      revealCard(card);
      const promo = PROMOS[id];
      const sig = promo ? [promo.tier, promo.offerText].join('|') : '';
      const rank0 = pinned.indexOf(id);
      const orderVal = (promo && rank0 >= 0 && !searching) ? String(-(1000 - rank0)) : '';
      if (card._promoSig === sig && card.isConnected) { if (card.style.order !== orderVal) card.style.order = orderVal; return; } // unchanged: touch nothing, so nothing shifts
      card._promoSig = sig;
      card.querySelector(':scope > .promo-strip')?.remove();
      if (!promo) card.querySelector(':scope > .promo-offer-banner')?.remove();
      card.classList.toggle('has-promo', Boolean(promo));
      if (!promo) { card.style.order = ''; return; }
      const strip = document.createElement('div');
      strip.className = 'promo-strip tier-' + (promo.tier || 'featured');
      strip.innerHTML = '<span class="promo-badge">Sponsored</span>';
      card.insertBefore(strip, card.firstChild);
      card.querySelector(':scope > .promo-offer-banner')?.remove();
      if (promo.offerText) {
        const banner = document.createElement('div');
        banner.className = 'promo-offer-banner tier-' + (promo.tier || 'featured');
        banner.innerHTML = `<span class="offer-ico" aria-hidden="true">🎁</span><span class="offer-text"><b>Special offer</b>${escapeHtml(promo.offerText)}</span>`;
        const body = card.querySelector('.place-body');
        if (body) card.insertBefore(banner, body); else card.appendChild(banner);
      }
      const rank = pinned.indexOf(id);
      card.style.order = (rank >= 0 && !searching) ? String(-(1000 - rank)) : '';
    });
    // A budget where min equals max reads "₹95", not "₹95 – ₹95".
    document.querySelectorAll('.place-card .meta-value').forEach(el => {
      const m = el.textContent.trim().match(/^₹\s*(\d[\d,]*)\s*[–-]\s*₹\s*(\d[\d,]*)(.*)$/);
      if (m && m[1] === m[2]) el.textContent = '₹' + m[1] + m[3];
    });
    renderSponsoredSpotlight();
  }

  function renderSponsoredSpotlight() {
    const featured = Object.entries(PROMOS).filter(([, pr]) => pr.placements.includes('homepage') && PLACES_DATA[pr_id(pr)])
      .sort((a, b) => promoScore(b[0]) - promoScore(a[0])).slice(0, 3);
    let host = document.getElementById('sponsoredSpotlight');
    const spotSig = featured.map(([id, pr]) => id + '|' + pr.tier + '|' + pr.offerText).join(';');
    if (!featured.length) { host?.remove(); return; }
    if (host && host.dataset.sig === spotSig) return;
    if (!host) {
      const anchor = document.getElementById('instantPicksGrid')?.closest('section') || document.getElementById('places');
      if (!anchor || !anchor.parentNode) return;
      host = document.createElement('section');
      host.id = 'sponsoredSpotlight'; host.className = 'sponsored-spotlight';
      anchor.parentNode.insertBefore(host, anchor.nextSibling);
    }
    host.dataset.sig = spotSig;
    host.innerHTML = `<div class="container"><div class="spotlight-head"><h3>Spotlight near you</h3><span class="promo-badge">Sponsored</span></div><div class="spotlight-grid">` +
      featured.map(([, pr]) => { const p = PLACES_DATA[pr_id(pr)]; const ph = (Array.isArray(p.photos) && p.photos[0]) || p.image || ''; return `<button type="button" class="spotlight-card tier-${escapeHtml(pr.tier || 'featured')}" data-spot-id="${escapeHtml(String(p.id))}">${ph ? `<img class="spotlight-photo" src="${escapeHtml(ph)}" alt="" loading="lazy" />` : ''}<strong>${escapeHtml(p.name)}</strong><small>📍 ${escapeHtml(p.location || 'Bengaluru')}</small>${pr.offerText ? `<span class="spotlight-offer">🎁 <b>Special offer:</b> ${escapeHtml(pr.offerText)}</span>` : ''}<span class="instant-card-cta">See details &amp; directions →</span></button>`; }).join('') + `</div></div>`;
    host.querySelectorAll('[data-spot-id]').forEach(b => b.addEventListener('click', () => openPlaceDetails(b.dataset.spotId)));
  }
  function pr_id(pr) { return pr.placeId; }

  async function loadPromotions() {
    try {
      const d = await api('/api/promotions/active');
      const newSig = JSON.stringify((d.promotions || []).map(x => [x.placeId, x.tier, x.priority, x.offerText, (x.placements || []).join(','), x.endsAt]));
      if (newSig === window.__promoSig) return; // same promotions as before: redraw nothing
      window.__promoSig = newSig;
      Object.keys(PROMOS).forEach(k => delete PROMOS[k]);
      (d.promotions || []).forEach(pr => { const o = { placeId: pr.placeId, tier: pr.tier || 'featured', priority: Number(pr.priority) || 0, placements: pr.placements || [], offerText: pr.offerText || '', endsAt: pr.endsAt || '' }; if (promoLive(o)) PROMOS[pr.placeId] = o; });
      applyPromoDecor();
      rebuildHero();
      try { renderInstantPicks(300); } catch (_) { /* picks render later anyway */ }
    } catch (_) { /* promotions are optional */ }
  }
  // Re-apply after every re-sort / re-filter / new card, without touching those functions' internals.
  { const orig = sortPlaceCards; sortPlaceCards = function () { const r = orig.apply(this, arguments); applyPromoDecor(); return r; }; }
  { const orig = applyFilters; applyFilters = function () { const r = orig.apply(this, arguments); applyPromoDecor(); return r; }; }
  { const orig = renderPlaceCard; renderPlaceCard = function () { const r = orig.apply(this, arguments); setTimeout(applyPromoDecor, 0); return r; }; }
  { const orig = openPlaceDetails; openPlaceDetails = function (id) {
      trackPlace(id, 'opens'); window.__seLastPlace = id;
      const r = orig.apply(this, arguments);
      try {
        const host = document.querySelector('#placeDetailsModal .modal-content');
        host?.querySelector('#modalPromoOffer')?.remove();
        const pr = PROMOS[id];
        if (host && pr) {
          const box = document.createElement('div'); box.id = 'modalPromoOffer'; box.className = 'modal-promo-offer tier-' + (pr.tier || 'featured');
          box.innerHTML = `<span class="promo-badge">Sponsored</span>${pr.offerText ? `<div class="modal-offer-line"><span aria-hidden="true">🎁</span><span><b>Special offer for students</b>${escapeHtml(pr.offerText)}</span></div>` : ''}`;
          host.insertBefore(box, host.firstChild);
        }
      } catch (_) { /* decoration only */ }
      return r;
    }; }
  // The hero card shows the offer as its own bold pill, not just a line of small text.
  { const orig = renderHeroSlide; renderHeroSlide = function () {
      const r = orig.apply(this, arguments);
      try {
        const metaEl = document.getElementById('heroRecMeta'); if (!metaEl) return r;
        document.getElementById('heroRecOffer')?.remove();
        const rec = heroRecs.length ? heroRecs[heroSlideIndex % heroRecs.length] : null;
        if (rec && rec.sponsored && rec.offerText) {
          const pill = document.createElement('div'); pill.id = 'heroRecOffer'; pill.className = 'hero-offer-pill';
          pill.innerHTML = `🎁 <b>Special offer:</b> ${escapeHtml(rec.offerText)}`;
          metaEl.insertAdjacentElement('afterend', pill);
        }
      } catch (_) { /* decoration only */ }
      return r;
    }; }
  document.getElementById('modalExternalGmapsLink')?.addEventListener('click', () => trackPlace(window.__seLastPlace, 'directions'));
  setTimeout(loadPromotions, 900); setTimeout(loadPromotions, 4500);
  setInterval(loadPromotions, 10 * 60 * 1000); // pick up new / ended promotions without a refresh

  // ---- Admin > Promotions ----
  const PROMO_PRESETS = { featured: { priority: 50, days: 7, places: ['category_top'] }, monthly: { priority: 70, days: 30, places: ['category_top', 'discovery'] }, premium: { priority: 90, days: 30, places: ['hero', 'homepage', 'category_top', 'discovery'] } };
  const promoEl = (id) => document.getElementById(id);
  const isoDate = (d) => d.toISOString().slice(0, 10);
  let promoRows = [];
  function promoPlaceOptions() {
    const sel = promoEl('promoPlace'); if (!sel) return;
    const keep = sel.value;
    const list = Object.values(PLACES_DATA || {}).filter(p => p && p.id && p.name).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if (sel.options.length - 1 === list.length) return;
    sel.innerHTML = '<option value="">Choose a place…</option>' + list.map(p => `<option value="${escapeHtml(String(p.id))}">${escapeHtml(p.name)}</option>`).join('');
    if (keep) sel.value = keep;
  }
  function promoApplyPreset(tier) {
    const pr = PROMO_PRESETS[tier]; if (!pr) return;
    promoEl('promoPriority').value = pr.priority; promoEl('promoPriorityVal').textContent = pr.priority;
    document.querySelectorAll('.promo-places input[type=checkbox]').forEach(c => { c.checked = pr.places.includes(c.value); });
    const start = promoEl('promoStart').value ? new Date(promoEl('promoStart').value) : new Date();
    promoEl('promoStart').value = isoDate(start);
    const end = new Date(start.getTime() + pr.days * 86400000);
    promoEl('promoEnd').value = isoDate(end);
  }
  function promoClearForm() {
    promoEl('promoForm')?.reset();
    promoEl('promoId').value = ''; promoEl('promoPriorityVal').textContent = '50';
    promoEl('promoSave').textContent = 'Save promotion';
    const m = promoEl('promoMsg'); if (m) m.hidden = true;
    promoApplyPreset('featured');
  }
  promoEl('promoTier')?.addEventListener('change', (e) => { if (!promoEl('promoId').value || confirm('Replace this promotion\'s strength, places and dates with the plan defaults?')) promoApplyPreset(e.target.value); });
  promoEl('promoPriority')?.addEventListener('input', (e) => { promoEl('promoPriorityVal').textContent = e.target.value; });
  function promoPhotoWarn() {
    const id = promoEl('promoPlace')?.value; const pl = id ? PLACES_DATA[id] : null;
    const hero = document.querySelector('.promo-places input[value="hero"]')?.checked;
    const noPhoto = pl && !((Array.isArray(pl.photos) && pl.photos.filter(Boolean).length) || pl.image);
    if (hero && noPhoto) promoMsg('Tip: this place has no photo yet, so the hero card will show a plain name card. Add a good photo first (Admin > Places) for the best result.', true);
    else if (promoEl('promoMsg')?.textContent.startsWith('Tip:')) promoMsg('', false);
  }
  promoEl('promoPlace')?.addEventListener('change', promoPhotoWarn);
  document.querySelectorAll('.promo-places input').forEach(c => c.addEventListener('change', promoPhotoWarn));
  promoEl('promoCopyPitch')?.addEventListener('click', async () => {
    const text = ['📣 Student Explorer: promote your shop to Bengaluru students', '',
      '• Featured (7 days): your card pinned at the top of the places list, labelled Sponsored.',
      '• Monthly (30 days): pinned card + your offer on the card + Instant Picks and the weekend card.',
      '• Premium (30 days): everything above PLUS the big hero card (first thing every visitor sees), homepage spotlight with your photo, ranked above other shops, and a monthly report of views, opens and Directions taps.', '',
      'Most students never scroll past the first screen. Premium puts you right there. Reply here to start!'].join('\n');
    try { await navigator.clipboard.writeText(text); showToast('Copied. Paste it into WhatsApp.'); } catch { prompt('Copy this message:', text); }
  });
  promoEl('promoClear')?.addEventListener('click', promoClearForm);
  function promoMsg(text, bad) { const m = promoEl('promoMsg'); if (!m) return; m.textContent = text || ''; m.hidden = !text; m.style.color = bad ? '' : '#047857'; }

  promoEl('promoForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const placeId = promoEl('promoPlace').value;
    if (!placeId) { promoMsg('Choose a place first.', true); return; }
    const btn = promoEl('promoSave'); btn.disabled = true;
    try {
      await api('/api/admin/promotions', { method: 'POST', body: {
        id: promoEl('promoId').value || undefined, placeId, tier: promoEl('promoTier').value,
        priority: Number(promoEl('promoPriority').value),
        placements: [...document.querySelectorAll('.promo-places input:checked')].map(c => c.value),
        offerText: promoEl('promoOffer').value.trim(), startsAt: promoEl('promoStart').value || null, endsAt: promoEl('promoEnd').value || null,
        amountPaid: Number(promoEl('promoAmount').value) || 0, notes: promoEl('promoNotes').value.trim(), active: true } });
      promoClearForm(); promoMsg('Saved. It is live now (or on its start date).', false);
      await loadAdminPromos(); loadPromotions();
    } catch (err) { promoMsg(err.message || 'Could not save.', true); }
    finally { btn.disabled = false; }
  });

  function promoReportText(r) {
    const name = PLACES_DATA[r.place_id]?.name || r.place_id;
    return [`📊 Student Explorer report — ${name}`, `Period: ${(r.starts_at || r.created_at || '').toString().slice(0, 10)} to ${(r.ends_at || new Date().toISOString()).toString().slice(0, 10)}`,
      `👀 Shown on cards: ${r.views_promo}`, `📍 Opened for details: ${r.opens_promo}`, `🧭 Directions taps: ${r.directions_promo}`,
      '', 'Thank you for partnering with Student Explorer!'].join('\n');
  }
  async function loadAdminPromos() {
    const host = promoEl('promoList'); if (!host) return;
    promoPlaceOptions();
    if (!promoEl('promoStart').value) promoApplyPreset('featured');
    if (!session.user?.isAdmin) { host.textContent = 'Admin access only.'; return; }
    host.textContent = 'Loading…';
    try {
      const d = await api('/api/admin/promotions');
      promoRows = d.promotions || [];
      if (!promoRows.length) { host.innerHTML = '<p class="fb-empty">No promotions yet. Fill the form above to promote a place.</p>'; return; }
      host.innerHTML = promoRows.map(r => {
        const name = escapeHtml(PLACES_DATA[r.place_id]?.name || r.place_id);
        const where = String(r.placements || '').split(',').filter(Boolean).map(x => ({ hero: 'Hero card', homepage: 'Homepage', category_top: 'Top of list', discovery: 'Picks' }[x] || x)).join(' · ') || 'Nowhere (label only)';
        const dates = `${(r.starts_at || '').toString().slice(0, 10) || 'now'} → ${(r.ends_at || '').toString().slice(0, 10) || 'no end'}`;
        return `<article class="promo-card promo-${escapeHtml(r.status)}" data-promo-id="${escapeHtml(r.id)}">
          <div class="promo-card-head"><strong>${name}</strong><span class="promo-status">${escapeHtml(r.status)}</span><span class="promo-tier">${escapeHtml(r.tier)} · strength ${r.priority}</span></div>
          <p class="promo-card-line">📅 ${escapeHtml(dates)} · 📌 ${escapeHtml(where)}${r.offer_text ? ' · 🎁 ' + escapeHtml(r.offer_text) : ''}</p>
          <p class="promo-card-line">💰 Paid ₹${Number(r.amount_paid || 0).toLocaleString('en-IN')} (private)${r.notes ? ' · 📝 ' + escapeHtml(r.notes) : ''}</p>
          <p class="promo-card-line">Last 30 days: 👀 ${r.views30} · 📍 ${r.opens30} · 🧭 ${r.directions30}</p>
          <div class="promo-card-actions">
            <button type="button" class="btn btn-outline btn-sm" data-promo-act="edit">Edit</button>
            <button type="button" class="btn btn-outline btn-sm" data-promo-act="report">📋 Copy report</button>
            ${r.status === 'active' || r.status === 'scheduled' ? '<button type="button" class="btn btn-outline btn-sm" data-promo-act="end">End now</button>' : ''}
            <button type="button" class="btn btn-outline btn-sm fb-delete" data-promo-act="delete">Delete</button>
          </div></article>`;
      }).join('');
    } catch (err) { host.textContent = err.message || 'Could not load promotions.'; }
  }
  promoEl('promoList')?.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-promo-act]'); if (!b) return;
    const id = b.closest('[data-promo-id]')?.dataset.promoId; const r = promoRows.find(x => x.id === id); if (!r) return;
    const act = b.dataset.promoAct;
    try {
      if (act === 'edit') {
        promoPlaceOptions();
        promoEl('promoId').value = r.id; promoEl('promoPlace').value = r.place_id; promoEl('promoTier').value = r.tier;
        promoEl('promoPriority').value = r.priority; promoEl('promoPriorityVal').textContent = r.priority;
        const set = String(r.placements || '').split(',');
        document.querySelectorAll('.promo-places input[type=checkbox]').forEach(c => { c.checked = set.includes(c.value); });
        promoEl('promoOffer').value = r.offer_text || ''; promoEl('promoStart').value = (r.starts_at || '').toString().slice(0, 10); promoEl('promoEnd').value = (r.ends_at || '').toString().slice(0, 10);
        promoEl('promoAmount').value = r.amount_paid || 0; promoEl('promoNotes').value = r.notes || '';
        promoEl('promoSave').textContent = 'Update promotion'; promoEl('promoForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (act === 'report') {
        const text = promoReportText(r);
        try { await navigator.clipboard.writeText(text); showToast('Report copied. Send it to the shop on WhatsApp.'); } catch { prompt('Copy this report:', text); }
      } else if (act === 'end') {
        await api('/api/admin/promotions', { method: 'POST', body: { id: r.id, placeId: r.place_id, tier: r.tier, priority: r.priority, placements: String(r.placements || '').split(',').filter(Boolean), offerText: r.offer_text, startsAt: (r.starts_at || '').toString().slice(0, 10) || null, endsAt: isoDate(new Date(Date.now() - 86400000)), amountPaid: r.amount_paid, notes: r.notes, active: true } });
        await loadAdminPromos(); loadPromotions();
      } else if (act === 'delete') {
        if (!confirm('Delete this promotion? Its visibility counts stay.')) return;
        await api('/api/admin/promotions/' + encodeURIComponent(r.id), { method: 'DELETE' });
        await loadAdminPromos(); loadPromotions();
      }
    } catch (err) { showToast(err.message || 'Could not update.'); }
  });

  // ============================================================================
  // v17. OPENING CARDS: places the admin chose, shown in a popup when a visitor opens the site.
  // Sponsored cards say "Sponsored"; the admin's own picks say "Highlight". No cards = no popup at all.
  // ============================================================================
  const welcomeEl = (id) => document.getElementById(id);
  const WELCOME_SESSION_KEY = 'se_welcome_seen';
  let welcomeCards = [];
  let welcomeAdminRows = [];

  function welcomePhoto(pl) { const ph = (Array.isArray(pl.photos) && pl.photos.find(Boolean)) || pl.image || ''; return ph && !/bengaluru_palace|student_explorer_hero/.test(ph) ? ph : ''; }

  function renderWelcomeCards() {
    const row = welcomeEl('welcomeCardsRow'); if (!row) return 0;
    const usable = welcomeCards.map(c => ({ c, pl: PLACES_DATA[c.placeId] })).filter(x => x.pl).slice(0, 6);
    row.innerHTML = usable.map(({ c, pl }) => {
      const ph = welcomePhoto(pl);
      const price = Number(pl.minBudget) === Number(pl.maxBudget) ? '₹' + Number(pl.maxBudget) : (Number(pl.minBudget) > 0 ? '₹' + Number(pl.minBudget) + ' – ' : 'Free – ') + '₹' + Number(pl.maxBudget);
      return `<button type="button" class="welcome-card kind-${escapeHtml(c.kind)}" role="listitem" data-id="${escapeHtml(String(pl.id))}">
        <span class="welcome-card-media">${ph ? `<img src="${escapeHtml(ph)}" alt="" loading="lazy" />` : '<span class="welcome-card-fallback" aria-hidden="true">📍</span>'}<span class="welcome-card-badge">${c.kind === 'sponsored' ? 'Sponsored' : '⭐ Highlight'}</span></span>
        <span class="welcome-card-body"><strong>${escapeHtml(pl.name)}</strong><small>📍 ${escapeHtml(pl.location || 'Bengaluru')}</small>
        ${c.headline ? `<span class="welcome-card-line">🎁 ${escapeHtml(c.headline)}</span>` : ''}
        <span class="welcome-card-meta">${escapeHtml(price)}${Number(pl.rating) ? ' · ★ ' + Number(pl.rating).toFixed(1) : ''}</span>
        <span class="instant-card-cta">See details &amp; directions →</span></span></button>`;
    }).join('');
    return usable.length;
  }

  async function loadWelcomeCards() {
    try { const d = await api('/api/welcome-cards'); welcomeCards = d.cards || []; } catch (_) { welcomeCards = []; }
    return welcomeCards;
  }

  function showWelcomeCards({ force = false } = {}) {
    const modal = welcomeEl('welcomeCardsModal'); if (!modal) return;
    const sig = welcomeCards.map(c => c.id + c.kind + c.headline).join('|');
    if (!force) { try { if (sessionStorage.getItem(WELCOME_SESSION_KEY) === sig) return; } catch (_) { /* show anyway */ } }
    if (!renderWelcomeCards()) { if (force) showToast('None of the cards can be shown yet. Add a card first.'); return; }
    try { sessionStorage.setItem(WELCOME_SESSION_KEY, sig); } catch (_) { /* ignore */ }
    window.__welcomeShown = true; // the weekend card steps aside this visit so two popups never stack
    openModal(modal);
    if (!force) welcomeCards.slice(0, 6).forEach(c => trackPlace(c.placeId, 'views'));
  }

  function closeWelcomeCards() { closeModal(welcomeEl('welcomeCardsModal')); }
  welcomeEl('closeWelcomeCardsBtn')?.addEventListener('click', closeWelcomeCards);
  welcomeEl('welcomeCardsSkip')?.addEventListener('click', closeWelcomeCards);
  welcomeEl('welcomeCardsModal')?.addEventListener('click', (e) => { if (e.target === welcomeEl('welcomeCardsModal')) closeWelcomeCards(); });
  welcomeEl('welcomeCardsRow')?.addEventListener('click', (e) => {
    const b = e.target.closest('.welcome-card'); if (!b) return;
    closeWelcomeCards(); setTimeout(() => openPlaceDetails(b.dataset.id), 150);
  });

  // On every site open: fetch the admin's cards; if there are any (and their places have loaded) show them once per visit.
  (async function welcomeOnOpen() {
    await loadWelcomeCards();
    if (!welcomeCards.length) return;
    let tries = 0;
    const attempt = () => {
      if (document.querySelector('.modal-backdrop.open') && tries < 8) { tries++; return setTimeout(attempt, 1500); } // never interrupt login etc.
      if (welcomeCards.some(c => PLACES_DATA[c.placeId])) showWelcomeCards(); else if (tries++ < 8) setTimeout(attempt, 1200);
    };
    setTimeout(attempt, 900);
  })();

  // ---- Admin > Opening cards ----
  function welcomePlaceOptions() {
    const sel = welcomeEl('welcomePlace'); if (!sel) return;
    const keep = sel.value;
    const list = Object.values(PLACES_DATA || {}).filter(p => p && p.id && p.name).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if (sel.options.length - 1 === list.length) return;
    sel.innerHTML = '<option value="">Choose a place…</option>' + list.map(p => `<option value="${escapeHtml(String(p.id))}">${escapeHtml(p.name)}</option>`).join('');
    if (keep) sel.value = keep;
  }
  function welcomeMsg(text, bad) { const m = welcomeEl('welcomeMsg'); if (!m) return; m.textContent = text || ''; m.hidden = !text; m.style.color = bad ? '' : '#047857'; }

  async function loadAdminWelcome() {
    const host = welcomeEl('welcomeList'); if (!host) return;
    welcomePlaceOptions();
    if (!session.user?.isAdmin) { host.textContent = 'Admin access only.'; return; }
    host.textContent = 'Loading…';
    try {
      const d = await api('/api/admin/welcome-cards');
      welcomeAdminRows = d.cards || [];
      if (!welcomeAdminRows.length) { host.innerHTML = '<p class="fb-empty">No cards yet, so visitors see no popup and the site loads normally. Add a place above to start.</p>'; return; }
      host.innerHTML = welcomeAdminRows.map((r, i) => {
        const name = escapeHtml(PLACES_DATA[r.place_id]?.name || r.place_id);
        const dates = (r.starts_at || r.ends_at) ? ` · 📅 ${escapeHtml(r.starts_at || 'now')} → ${escapeHtml(r.ends_at || 'no end')}` : '';
        return `<article class="promo-card promo-${r.status === 'showing' ? 'active' : escapeHtml(r.status)}" data-wc-id="${escapeHtml(r.id)}">
          <div class="promo-card-head"><strong>#${i + 1} ${name}</strong><span class="promo-status">${escapeHtml(r.status)}</span><span class="promo-tier">${r.kind === 'sponsored' ? 'Sponsored' : 'Highlight'}</span></div>
          <p class="promo-card-line">${r.headline ? '🎁 ' + escapeHtml(r.headline) : '<em>No extra line</em>'}${dates}</p>
          <div class="promo-card-actions">
            <button type="button" class="btn btn-outline btn-sm" data-wc-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
            <button type="button" class="btn btn-outline btn-sm" data-wc-act="down" ${i === welcomeAdminRows.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
            <button type="button" class="btn btn-outline btn-sm" data-wc-act="${r.active ? 'pause' : 'resume'}">${r.active ? 'Pause' : 'Resume'}</button>
            <button type="button" class="btn btn-outline btn-sm fb-delete" data-wc-act="delete">Remove</button>
          </div></article>`;
      }).join('');
    } catch (err) { host.textContent = err.message || 'Could not load cards.'; }
  }
  welcomeEl('welcomeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const placeId = welcomeEl('welcomePlace').value;
    if (!placeId) { welcomeMsg('Choose a place first.', true); return; }
    const btn = welcomeEl('welcomeSave'); btn.disabled = true;
    try {
      await api('/api/admin/welcome-cards', { method: 'POST', body: { placeId, kind: document.querySelector('input[name="welcomeKind"]:checked')?.value || 'highlight', headline: welcomeEl('welcomeHeadline').value.trim(), startsAt: welcomeEl('welcomeStart').value || null, endsAt: welcomeEl('welcomeEnd').value || null } });
      welcomeEl('welcomeForm').reset(); welcomeMsg('Added. Visitors will see it the next time they open the site.', false);
      await loadAdminWelcome(); await loadWelcomeCards();
    } catch (err) { welcomeMsg(err.message || 'Could not add.', true); }
    finally { btn.disabled = false; }
  });
  welcomeEl('welcomeList')?.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-wc-act]'); if (!b) return;
    const id = b.closest('[data-wc-id]')?.dataset.wcId; if (!id) return;
    const act = b.dataset.wcAct;
    try {
      if (act === 'delete') { if (!confirm('Remove this card from the popup?')) return; await api('/api/admin/welcome-cards/' + encodeURIComponent(id), { method: 'DELETE' }); }
      else if (act === 'up' || act === 'down') await api('/api/admin/welcome-cards/' + encodeURIComponent(id), { method: 'PATCH', body: { move: act } });
      else await api('/api/admin/welcome-cards/' + encodeURIComponent(id), { method: 'PATCH', body: { active: act === 'resume' } });
      await loadAdminWelcome(); await loadWelcomeCards();
    } catch (err) { showToast(err.message || 'Could not update.'); }
  });
  welcomeEl('welcomePreview')?.addEventListener('click', async () => {
    await loadWelcomeCards();
    if (!welcomeCards.length) { welcomeMsg('Add at least one card to preview it.', true); return; }
    const adminModal = document.getElementById('adminModal'); if (adminModal) closeModal(adminModal);
    setTimeout(() => showWelcomeCards({ force: true }), 250);
  });

  // ============================================================================
  // v17. POLISH: confetti on a verified visit, "Surprise me", and gentle reveal-on-scroll.
  // All motion is skipped for visitors who ask their device for reduced motion.
  // ============================================================================
  const prefersReducedMotion = () => Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function celebrate() {
    if (prefersReducedMotion()) return;
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5000';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const colors = ['#4F46E5', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899'];
    const bits = Array.from({ length: 110 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .35,
      vx: (Math.random() - .5) * 11, vy: -Math.random() * 11 - 3, g: .28 + Math.random() * .15,
      w: 5 + Math.random() * 6, h: 3 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    const t0 = performance.now();
    (function frame(now) {
      const t = now - t0; ctx.clearRect(0, 0, innerWidth, innerHeight);
      bits.forEach(b => { b.x += b.vx; b.y += b.vy; b.vy += b.g; b.vx *= .99; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.globalAlpha = Math.max(0, 1 - t / 2400); ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore(); });
      if (t < 2400) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  // Picks a random cheap place near the visitor (rated spots are a bit more likely) and opens it.
  function surpriseMe() {
    const o = getActiveOrigin();
    const pool = Object.values(PLACES_DATA || {})
      .filter(p => p && p.id && Number.isFinite(Number(p.lat)) && Number(p.maxBudget) > 0 && Number(p.maxBudget) <= 300)
      .map(p => ({ p, km: calculateDistanceKm(o.lat, o.lng, Number(p.lat), Number(p.lng)) }))
      .filter(x => Number.isFinite(x.km) && x.km <= 15);
    if (!pool.length) { showToast('No cheap spots found near you yet. Try choosing another area.'); return; }
    let choices = pool.filter(x => x.p.id !== window.__seLastSurprise);
    if (!choices.length) choices = pool;
    const weights = choices.map(x => Math.max(1, (Number(x.p.rating) || 3.5) - 2));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0), pick = choices[0];
    for (let i = 0; i < choices.length; i++) { r -= weights[i]; if (r <= 0) { pick = choices[i]; break; } }
    window.__seLastSurprise = pick.p.id;
    showToast(`🎲 How about ${pick.p.name}? ${pick.km < 1 ? Math.round(pick.km * 1000) + ' m' : pick.km.toFixed(1) + ' km'} away. Press Surprise me again for another.`);
    openPlaceDetails(pick.p.id);
  }
  document.getElementById('surpriseMeBtn')?.addEventListener('click', surpriseMe);

  // Cards below the fold fade up as they come into view (no layout shift: opacity + transform only).
  const revealObs = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target; revealObs.unobserve(el); el.classList.add('in');
      setTimeout(() => el.classList.remove('reveal', 'in'), 800); // hand control back so hover effects work normally
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 }) : null;
  function revealCard(card) {
    if (!revealObs || card._rv || prefersReducedMotion()) return;
    card._rv = true;
    const r = card.getBoundingClientRect();
    if (r.height > 0 && r.top < innerHeight && r.bottom > 0) return; // already on screen: no animation
    card.classList.add('reveal'); revealObs.observe(card);
  }

  // Shared photo store for admin recommendations (must exist before form submit)
  window.__hotelPhotos = [];

  async function compressImageFile(file, maxW = 1280, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read image'));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW; }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          // Prefer JPEG for smaller size
          const out = canvas.toDataURL('image/jpeg', quality);
          resolve(out);
        };
        img.onerror = () => reject(new Error('Invalid image'));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const adminHotelForm = document.getElementById('adminHotelForm');
  adminHotelForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!session.user?.isAdmin) {
      showToast('Please sign in with an admin account first.');
      return;
    }
    const btn = document.getElementById('adminHotelSubmit');
    const originalBtnText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Updating…'; }
    try {
      const photos = Array.isArray(window.__hotelPhotos) ? window.__hotelPhotos.slice() : [];
      let name = (document.getElementById('hotelName')?.value || '').trim();
      let area = (document.getElementById('hotelArea')?.value || '').trim();
      let address = (document.getElementById('hotelAddress')?.value || '').trim();
      let lat = parseFloat(document.getElementById('hotelLat')?.value);
      let lng = parseFloat(document.getElementById('hotelLng')?.value);

      if (!name) {
        showToast('Hotel / stay name is required.');
        return;
      }
      // Full address alone is enough when area was left blank — derive a short area label.
      if (!area && address) {
        const parts = address.split(',').map(s => s.trim()).filter(Boolean);
        area = (parts.length >= 2 ? parts.slice(0, 2).join(', ') : parts[0] || address).slice(0, 160);
        const areaEl = document.getElementById('hotelArea');
        if (areaEl) areaEl.value = area;
      }
      if (!area && !address) {
        showToast('Type the area or a full address, then press Find on map.');
        return;
      }
      if (!document.getElementById('hotelFamous')?.value?.trim()) {
        showToast('Please add a short “Why recommend this?” note.');
        return;
      }

      // Pin chosen/typed by the admin wins; otherwise find the exact spot from name + full address (server double-checks too).
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        const picked = await hotelFindOnMap(true);
        if (!picked) {
          showToast('Could not find that address. Check the spelling or press Find on map and choose a result.');
          return;
        }
        lat = picked.lat;
        lng = picked.lng;
        // Re-read area in case applyHotelPin filled it.
        area = (document.getElementById('hotelArea')?.value || '').trim() || area;
      }

      const body = {
        name,
        area,
        address,
        lat,
        lng,
        minBudget: document.getElementById('hotelMin')?.value,
        maxBudget: document.getElementById('hotelMax')?.value,
        famousFor: document.getElementById('hotelFamous')?.value?.trim(),
        description: document.getElementById('hotelDesc')?.value?.trim(),
        metro: document.getElementById('hotelMetro')?.value?.trim(),
        photos,
        image: photos[0] || '',
        showInHero: document.getElementById('hotelShowInHero')?.checked !== false,
        locationPrecision: window.__hotelPrecision || 'exact',
      };

      const data = await api('/api/admin/hotels', { method: 'POST', body });
      const place = data.place;
      if (!place || !place.id) throw new Error('Server did not return the published place.');
      PLACES_DATA[place.id] = place;
      PLACES_STOPS[place.id] = place.metro;
      renderPlaceCard(place, true);
      updateCardsDistanceAndTransit();
      adminHotelForm.reset();
      window.__hotelPhotos = [];
      window.__hotelPrecision = 'exact';
      const prev = document.getElementById('hotelPhotoPreviews');
      if (prev) prev.innerHTML = '';
      const inp = document.getElementById('hotelPhotosInput');
      if (inp) inp.value = '';
      const fb = document.getElementById('hotelLocFeedback');
      if (fb) fb.style.display = 'none';
      const cl = document.getElementById('hotelCandidates'); if (cl) { cl.style.display = 'none'; cl.innerHTML = ''; }
      const hm = document.getElementById('hotelMapPreview'); if (hm) { hm.hidden = true; hm.removeAttribute('src'); }
      showToast(`🏨 "${place.name}" published with ${(place.photos || []).length || (place.image ? 1 : 0)} photo(s).`);
      if (typeof loadHeroRecommendations === 'function') loadHeroRecommendations();
      if (typeof loadAdminRecs === 'function') loadAdminRecs();
      if (typeof populateTripPlanOptions === 'function') populateTripPlanOptions();
    } catch (err) {
      console.error('Publish hotel failed', err);
      showToast(err.message || 'Failed to publish recommendation. Please try again.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = originalBtnText || 'Publish recommendation'; }
    }
  });

  function showPinMap(frameId, lat, lng) {
    const frame = document.getElementById(frameId);
    if (!frame || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const pad = 0.012;
    const bbox = [lng - pad, lat - pad, lng + pad, lat + pad].join('%2C');
    frame.hidden = false;
    frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  }

  async function geocodeInto(area, latEl, lngEl, feedbackEl, frameId, placeName = '') {
    const areaText = (area || '').trim();
    const nameText = (placeName || '').trim();
    if (!areaText) {
      showToast('Type the address or area first, then pin it.');
      return null;
    }
    // Search for the actual venue, not just the centre of its neighbourhood.
    // The old area-only lookup could pin an entire locality and send directions there.
    const query = nameText ? `${nameText}, ${areaText}` : areaText;
    const geo = await api(`/api/maps/geocode?query=${encodeURIComponent(query)}`);
    if (!geo || typeof geo.lat !== 'number' || typeof geo.lng !== 'number') {
      throw new Error(geo?.error || 'Could not find that address on the map.');
    }
    if (latEl) latEl.value = Number(geo.lat).toFixed(5);
    if (lngEl) lngEl.value = Number(geo.lng).toFixed(5);
    const provider = String(geo.provider || '');
    const bestName = String(geo.name || '');
    const normalized = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const namedMatch = (geo.precision === 'exact') || !!nameText && (
      provider === 'google_places' ||
      (bestName && normalized(bestName) !== normalized(query) &&
        (normalized(bestName).includes(normalized(nameText)) || normalized(nameText).includes(normalized(bestName))))
    );
    if (frameId === 'newPlaceMapPreview') {
      currentState.locExact = namedMatch;
    }
    if (feedbackEl) {
      feedbackEl.style.display = 'block';
      feedbackEl.textContent = namedMatch
        ? `Pinned place: ${geo.formattedAddress || query}. Check the map pin before publishing.`
        : `⚠ Only the area centre was found: ${geo.formattedAddress || query}. Add the street/landmark, or check the pin on the map before publishing.`;
    }
    showPinMap(frameId, geo.lat, geo.lng);
    return { ...geo, precision: namedMatch ? 'exact' : 'area' };
  }

  async function acquireFreshCoords() {
    if (navigator.geolocation) {
      try {
        const fix = await getBestPosition({ maxWaitMs: 12000 });
        return { lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy, approximate: fix.accuracy > 150, source: `Device GPS (${accuracyText(fix.accuracy)})` };
      } catch (err) {
        console.warn('GPS unavailable', err);
      }
    }
    try {
      const res = await fetch('/api/maps/ip-location');
      const data = res.ok ? await res.json() : null;
      if (data && data.success && data.inBengaluru !== false) return { lat: data.lat, lng: data.lng, approximate: true, source: data.city ? `${data.city} (network, approximate)` : 'Network estimate (approximate)' };
    } catch { /* none */ }
    return null;
  }

  // A changed name/address invalidates the previous pin and any previous auto-fill match.
  ['newPlaceName', 'newPlaceArea'].forEach(id => {
    const field = document.getElementById(id);
    field?.addEventListener('input', () => {
      currentState.locExact = false;
      autoInfo = null;
      if (newPlaceLat) newPlaceLat.value = '';
      if (newPlaceLng) newPlaceLng.value = '';
      const map = document.getElementById('newPlaceMapPreview');
      if (map) { map.hidden = true; map.removeAttribute('src'); }
      if (newPlaceLocFeedback) newPlaceLocFeedback.style.display = 'none';
    });
  });

  document.getElementById('newPlacePinBtn')?.addEventListener('click', async () => {
    try {
      await geocodeInto(
        document.getElementById('newPlaceArea')?.value,
        document.getElementById('newPlaceLat'),
        document.getElementById('newPlaceLng'),
        document.getElementById('newPlaceLocFeedback'),
        'newPlaceMapPreview',
        document.getElementById('newPlaceName')?.value
      );
      if (typeof scheduleLiveEstimate === 'function') scheduleLiveEstimate();
      showToast('Area pinned. Check the map before you publish.');
    } catch (err) {
      showToast(err.message || 'Could not pin that area.');
    }
  });

  // Current location for admin recommendation — fresh GPS, then network, with a visible map pin
  document.getElementById('hotelCurrentLocBtn')?.addEventListener('click', async () => {
    const txt = document.getElementById('hotelGpsBtnText');
    const fb = document.getElementById('hotelLocFeedback');
    if (txt) txt.textContent = 'Finding you…';
    const hit = await acquireFreshCoords();
    if (!hit) {
      if (txt) txt.textContent = 'Use current location';
      showToast('Location is blocked in this browser. Type the area and choose Pin the area I typed.');
      return;
    }
    window.__hotelPrecision = hit.approximate ? 'area' : 'exact';
    const latEl = document.getElementById('hotelLat');
    const lngEl = document.getElementById('hotelLng');
    if (latEl) latEl.value = hit.lat.toFixed(5);
    if (lngEl) lngEl.value = hit.lng.toFixed(5);
    if (txt) txt.textContent = hit.approximate ? '≈ Approximate (verify pin)' : '✓ GPS locked';
    try {
      const res = await fetch(`/api/maps/reverse-geocode?lat=${hit.lat}&lng=${hit.lng}`);
      const data = res.ok ? await res.json() : {};
      const addrEl = document.getElementById('hotelAddress');
      const areaEl = document.getElementById('hotelArea');
      if (data.formattedAddress && addrEl) addrEl.value = data.formattedAddress;
      if (data.formattedAddress && areaEl && !areaEl.value.trim()) areaEl.value = data.formattedAddress.split(',').slice(0, 2).join(',').trim();
      ['hotelLat', 'hotelLng'].forEach(i => { const e = document.getElementById(i); if (e) e.dataset.src = 'auto'; });
      if (fb) {
        fb.style.display = 'block';
        fb.textContent = `${hit.source}: ${data.formattedAddress || hit.lat.toFixed(4) + ', ' + hit.lng.toFixed(4)}`;
      }
    } catch {
      if (fb) {
        fb.style.display = 'block';
        fb.textContent = `${hit.source}: ${hit.lat.toFixed(4)}, ${hit.lng.toFixed(4)}`;
      }
    }
    showPinMap('hotelMapPreview', hit.lat, hit.lng);
    showToast(hit.approximate ? 'Only an approximate location was available. Drag-check the pin on the map or type the address and press Find on map.' : 'Current GPS applied. Confirm the pin on the map.');
  });

  // ---- Admin recommend form: manual address -> location API -> choose the right pin ----
  window.__hotelPrecision = 'exact';
  const hotelEls = () => ({
    name: document.getElementById('hotelName'),
    area: document.getElementById('hotelArea'),
    address: document.getElementById('hotelAddress'),
    lat: document.getElementById('hotelLat'),
    lng: document.getElementById('hotelLng'),
    fb: document.getElementById('hotelLocFeedback'),
    list: document.getElementById('hotelCandidates'),
  });

  function applyHotelPin(c, source) {
    const el = hotelEls();
    if (el.lat) { el.lat.value = Number(c.lat).toFixed(5); el.lat.dataset.src = 'auto'; }
    if (el.lng) { el.lng.value = Number(c.lng).toFixed(5); el.lng.dataset.src = 'auto'; }
    window.__hotelPrecision = c.provider === 'google_places' || c.provider === 'openstreetmap' || c.provider === 'google_maps' ? 'exact' : 'area';
    // Auto-fill area from the geocode result when the admin left it blank (common when using full address).
    if (el.area && !el.area.value.trim() && (c.formattedAddress || c.name)) {
      const parts = String(c.formattedAddress || c.name || '').split(',').map(s => s.trim()).filter(Boolean);
      // Prefer a short locality-like snippet (skip door numbers / very long first segment).
      const areaGuess = parts.length >= 2
        ? (parts[0].length > 40 ? parts.slice(1, 3).join(', ') : parts.slice(0, 2).join(', '))
        : (parts[0] || '');
      if (areaGuess) el.area.value = areaGuess.slice(0, 160);
    }
    if (el.fb) {
      el.fb.style.display = 'block';
      el.fb.textContent = (window.__hotelPrecision === 'area' ? '⚠ Area centre only — add street/landmark or fix the coordinates. ' : '') + `Pinned (${source || 'search'}): ${c.formattedAddress || (Number(c.lat).toFixed(4) + ', ' + Number(c.lng).toFixed(4))}. Check the map, then publish.`;
    }
    showPinMap('hotelMapPreview', Number(c.lat), Number(c.lng));
  }

  function renderHotelCandidates(cands) {
    const { list } = hotelEls();
    if (!list) return;
    if (!cands || cands.length < 2) { list.style.display = 'none'; list.innerHTML = ''; return; }
    list.style.display = 'grid';
    list.style.gap = '.35rem';
    list.innerHTML = '<span class="form-helper" style="font-weight:700">Not the right spot? Choose another result:</span>' + cands.map((c, i) => `
      <button type="button" class="btn btn-outline btn-sm" data-cand="${i}" style="text-align:left;white-space:normal;line-height:1.3">
        ${i === 0 ? '✓ ' : ''}${escapeHtml(c.formattedAddress || c.name || 'Result ' + (i + 1))}
      </button>`).join('');
    list.querySelectorAll('[data-cand]').forEach(btn => btn.addEventListener('click', () => {
      applyHotelPin(cands[Number(btn.dataset.cand)], 'your choice');
      list.querySelectorAll('[data-cand]').forEach(b => { b.textContent = b.textContent.replace(/^✓\s*/, ''); });
      btn.textContent = '✓ ' + btn.textContent.trim();
    }));
  }

  // Build shorter search strings from a long pasted Google/Maps address.
  function hotelAddressQueries(name, addr) {
    const raw = [name, addr].filter(Boolean).join(', ').replace(/\s+/g, ' ').trim();
    const out = [];
    const push = (s) => {
      const t = String(s || '').trim().replace(/\s+/g, ' ');
      if (t.length < 3) return;
      if (!out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t.length > 200 ? t.slice(0, 200) : t);
    };
    push(raw);
    push(addr);
    // Strip pincode / state
    push(String(addr || '').replace(/\b\d{6}\b/g, '').replace(/,?\s*karnataka\b/gi, '').replace(/,?\s*india\b/gi, '').replace(/,+/g, ',').trim());
    const parts = String(addr || '').split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      push(parts.slice(0, 2).join(', '));
      push(parts.slice(0, 3).join(', '));
      const interesting = parts.filter((p) => !/^\d+[a-z\/\-]*$/i.test(p) && p.length >= 4);
      if (interesting.length) {
        push(interesting.slice(0, 2).join(', '));
        push(interesting.slice(0, 3).join(', '));
      }
    }
    const lower = (raw + ' ' + (addr || '')).toLowerCase();
    if (/ramaiah|msrit|\bmsr\b/.test(lower)) push('MS Ramaiah College Mathikere Bengaluru');
    if (/mathikere/.test(lower)) push('Mathikere Bengaluru');
    if (name) push(`${name}, Mathikere, Bengaluru`);
    return out.slice(0, 8);
  }

  // Looks up "name + typed address" (falls back to the area) and pins the best result. Returns {lat,lng} or null.
  async function hotelFindOnMap(silent = false) {
    const el = hotelEls();
    const name = (el.name?.value || '').trim();
    const addr = (el.address?.value || '').trim() || (el.area?.value || '').trim();
    if (!addr && !name) { if (!silent) showToast('Type the address (or at least the area) first.'); return null; }
    const queries = hotelAddressQueries(name, addr);
    let lastErr = '';
    for (const q of queries) {
      try {
        const geo = await api(`/api/maps/geocode?query=${encodeURIComponent(q)}`);
        if (geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lng)) {
          applyHotelPin(geo, geo.provider === 'google_places' || geo.provider === 'google_maps' ? 'Google Maps' : (geo.provider === 'bengaluru_places' ? 'local area match' : 'map search'));
          renderHotelCandidates(geo.candidates);
          return { lat: geo.lat, lng: geo.lng };
        }
      } catch (err) {
        lastErr = err && err.message ? String(err.message) : '';
      }
    }
    if (!silent) {
      showToast(lastErr && /too many/i.test(lastErr)
        ? lastErr
        : 'No match for that full address. Try a shorter area (e.g. Mathikere) or type latitude & longitude manually, then publish.');
    }
    return null;
  }

  document.getElementById('hotelFindBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('hotelFindBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Searching…'; }
    try {
      const hit = await hotelFindOnMap(false);
      if (hit) showToast('Pinned. Confirm it on the map, or choose another result — or type lat/lng by hand.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '📍 Find on map'; }
    }
  });
  document.getElementById('hotelPinAreaBtn')?.addEventListener('click', () => document.getElementById('hotelFindBtn')?.click());

  // Changing the name/address/area only clears AUTO pins — never wipe coordinates the admin typed by hand.
  ['hotelName', 'hotelArea', 'hotelAddress'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      const el = hotelEls();
      if (el.lat?.dataset.src === 'auto') { el.lat.value = ''; el.lat.dataset.src = ''; }
      if (el.lng?.dataset.src === 'auto') { el.lng.value = ''; el.lng.dataset.src = ''; }
      const map = document.getElementById('hotelMapPreview');
      if (map && !(el.lat?.value && el.lng?.value)) { map.hidden = true; map.removeAttribute('src'); }
      if (el.fb && !(el.lat?.value && el.lng?.value)) el.fb.style.display = 'none';
      if (el.list) { el.list.style.display = 'none'; el.list.innerHTML = ''; }
    });
  });
  // Typing coordinates by hand is allowed and is never overwritten automatically.
  ['hotelLat', 'hotelLng'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', e => {
      e.target.dataset.src = 'manual';
      window.__hotelPrecision = 'exact';
      const lat = parseFloat(document.getElementById('hotelLat')?.value);
      const lng = parseFloat(document.getElementById('hotelLng')?.value);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        showPinMap('hotelMapPreview', lat, lng);
        const fb = document.getElementById('hotelLocFeedback');
        if (fb) {
          fb.style.display = 'block';
          fb.textContent = `Manual pin: ${lat.toFixed(5)}, ${lng.toFixed(5)}. Ready to publish.`;
        }
      }
    });
  });

  // ============================================================================
  // ENGAGEMENT: social proof, collections, favourites, WhatsApp, near-you
  // ============================================================================
  const FAV_KEY = 'se_favourites_v1';
  function getFavourites() {
    try {
      const v = JSON.parse(localStorage.getItem(scopedKey(FAV_KEY)) || '[]');
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  }
  function setFavourites(ids) {
    try { localStorage.setItem(scopedKey(FAV_KEY), JSON.stringify(ids)); } catch { /* private */ }
  }
  function isFav(id) { return getFavourites().includes(id); }
  function toggleFav(id) {
    let ids = getFavourites();
    if (ids.includes(id)) ids = ids.filter(x => x !== id);
    else ids.push(id);
    setFavourites(ids);
    return ids.includes(id);
  }
  function refreshFavButtons() {
    document.querySelectorAll('.fav-btn').forEach(btn => {
      const on = isFav(btn.dataset.placeId);
      btn.classList.toggle('is-fav', on);
      btn.title = on ? 'Remove from favourites' : 'Save to favourites';
    });
  }

  function renderWishlistDrawer() {
    const list = document.getElementById('wishlistList');
    if (!list) return;
    const ids = getFavourites();
    if (!ids.length) {
      list.innerHTML = `<div class="wishlist-empty">
        <p><strong>No saved places yet</strong></p>
        <p>Tap the ♥ on any place card to add it here. Your wishlist is saved on this device.</p>
      </div>`;
      return;
    }
    list.innerHTML = ids.map((id) => {
      const p = PLACES_DATA[id] || { id, name: id, location: '' };
      const img = p.image ? `<img src="${String(p.image).replace(/"/g,'')}" alt="" class="wishlist-thumb" />` : `<div class="wishlist-thumb wishlist-thumb-ph">📍</div>`;
      return `<article class="wishlist-item" data-id="${escapeHtml(id)}">
        ${img}
        <div class="wishlist-item-body">
          <strong>${escapeHtml(p.name || id)}</strong>
          <span>${escapeHtml(p.location || p.area || 'Bengaluru')}</span>
          <div class="wishlist-item-actions">
            <button type="button" class="btn btn-primary btn-sm wishlist-open" data-id="${escapeHtml(id)}">Open</button>
            <button type="button" class="btn btn-ghost btn-sm wishlist-remove" data-id="${escapeHtml(id)}">Remove</button>
          </div>
        </div>
      </article>`;
    }).join('');
    list.querySelectorAll('.wishlist-open').forEach((btn) => btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      closeWishlistDrawer();
      if (typeof openPlaceDetails === 'function') openPlaceDetails(id);
      else {
        const card = document.querySelector('.place-card[data-id="' + id.replace(/"/g, '') + '"]');
        card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card?.querySelector('.place-name')?.click();
      }
    }));
    list.querySelectorAll('.wishlist-remove').forEach((btn) => btn.addEventListener('click', () => {
      toggleFav(btn.dataset.id);
      refreshFavButtons();
      renderWishlistDrawer();
      showToast('Removed from wishlist');
    }));
  }

  function openWishlistDrawer() {
    const drawer = document.getElementById('wishlistDrawer');
    if (!drawer) return;
    renderWishlistDrawer();
    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('open');
  }
  function closeWishlistDrawer() {
    const drawer = document.getElementById('wishlistDrawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.hidden = true;
  }
  window.openWishlistDrawer = openWishlistDrawer;
  document.getElementById('closeWishlistBtn')?.addEventListener('click', closeWishlistDrawer);
  document.getElementById('wishlistBrowseBtn')?.addEventListener('click', () => {
    closeWishlistDrawer();
    document.getElementById('places')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('wishlistClearBtn')?.addEventListener('click', () => {
    if (!getFavourites().length) return;
    if (!confirm('Clear your entire wishlist on this device?')) return;
    setFavourites([]);
    refreshFavButtons();
    renderWishlistDrawer();
    showToast('Wishlist cleared');
  });
  document.getElementById('wishlistDrawer')?.addEventListener('click', (e) => {
    if (e.target.id === 'wishlistDrawer') closeWishlistDrawer();
  });

  function sharePlaceWhatsApp(placeId) {
    const place = PLACES_DATA[placeId];
    if (!place) return;
    const origin = typeof getActiveOrigin === 'function' ? getActiveOrigin() : { name: 'Bengaluru' };
    const budget = place.budget || `₹${place.minBudget}–₹${place.maxBudget}`;
    const text = [
      `🎓 Student Explorer plan`,
      `📍 ${place.name}`,
      place.location ? `Area: ${place.location}` : '',
      `Budget (est.): ${budget} / person`,
      place.metro ? `Transit: ${place.metro}` : '',
      place.famousFor ? `Famous for: ${place.famousFor}` : '',
      `From: ${origin.name || 'campus'}`,
      '',
      'Plan with friends on Student Explorer'
    ].filter(Boolean).join('\n');
    const url = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
    showToast('WhatsApp share opened — send the plan to your squad.');
  }

  // Wire fav + WhatsApp on dynamic and static cards
  function wireEngagementButtons(root = document) {
    root.querySelectorAll('.fav-btn').forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = toggleFav(btn.dataset.placeId);
        btn.classList.toggle('is-fav', on);
        showToast(on ? 'Saved to favourites ♥' : 'Removed from favourites');
      });
    });
    root.querySelectorAll('.wa-share-btn').forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sharePlaceWhatsApp(btn.dataset.placeId);
      });
    });
    refreshFavButtons();
  }

  // Add fav/wa to static HTML cards if missing
  document.querySelectorAll('.place-card').forEach(card => {
    const footer = card.querySelector('.place-footer');
    if (!footer) return;
    const id = card.dataset.id;
    if (!footer.querySelector('.fav-btn')) {
      footer.insertAdjacentHTML('beforeend', `
        <button type="button" class="btn-icon-round fav-btn" data-place-id="${id}" title="Save to favourites" aria-label="Favourite">♥</button>
        <button type="button" class="btn-icon-round wa-share-btn" data-place-id="${id}" title="Share plan on WhatsApp" aria-label="WhatsApp">↗</button>`);
    }
  });
  wireEngagementButtons();

  // Collections filter
  function applyCollection(key) {
    currentState.collection = key || 'all';
    // Food near me → food category + sort by distance
    if (key === 'food') {
      currentState.category = 'food';
      currentState.sortBy = 'distance-asc';
      const sortSel = document.getElementById('sortBySelect');
      if (sortSel) sortSel.value = 'distance-asc';
      categoryFilterTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-filter') === 'food'));
    }
    document.querySelectorAll('.collection-chip, .hero-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.collection === key || (key === 'all' && c.dataset.collection === 'all'));
    });
    applyFiltersAndSort();
    const visible = [...document.querySelectorAll('.place-card')].filter(c => c.style.display !== 'none').length;
    if (key === 'favourites' && visible === 0) showToast('No favourites yet — tap ♥ on a place you like. Your list helps the next student!');
    else if (key === 'food') showToast('🍽️ Food spots near you — sorted by distance. Tip: allow location for exact fares.');
    else if (key === 'late') showToast('🌙 Late-night friendly spots only — morning parks & sunrise trips are hidden.');
    else if (key === 'under150' || key === 'under300' || key === 'free') showToast('Budget picks ready. Scroll the list or tap “near me” after sharing location.');
    scrollToPlaces();
  }

  document.querySelectorAll('.collection-chip, .hero-chip').forEach(chip => {
    chip.addEventListener('click', () => applyCollection(chip.dataset.collection || 'all'));
  });

  // Near-you strip
  const nearYouStrip = document.getElementById('nearYouStrip');
  const nearYouTitle = document.getElementById('nearYouTitle');
  const nearYouSub = document.getElementById('nearYouSub');
  const nearYouCta = document.getElementById('nearYouCta');
  function updateNearYouStrip() {
    if (!nearYouStrip) return;
    nearYouStrip.style.display = 'block';
    const cards = [...document.querySelectorAll('.place-card')];
    const withDist = cards.map(c => ({ c, d: parseFloat(c.dataset.distance) })).filter(x => Number.isFinite(x.d));
    if (currentState.liveCoords && withDist.length) {
      const near = withDist.filter(x => x.d <= 10).sort((a, b) => a.d - b.d);
      if (nearYouTitle) nearYouTitle.textContent = near.length
        ? `${near.length} place${near.length === 1 ? '' : 's'} within 10 km of you`
        : 'Places sorted by distance from you';
      if (nearYouSub) {
        const cheapest = near.filter(x => (parseFloat(x.c.dataset.min) || 0) <= 150).length;
        nearYouSub.textContent = cheapest
          ? `${cheapest} of them under ₹150 — tap to explore the nearest first.`
          : 'Sorted nearest first. Use collections for free / under ₹150 filters.';
      }
      if (nearYouCta) nearYouCta.textContent = 'View nearest';
    } else {
      if (nearYouTitle) nearYouTitle.textContent = 'Find places near you';
      if (nearYouSub) nearYouSub.textContent = 'Allow location to sort by distance and see budget-friendly spots first.';
      if (nearYouCta) nearYouCta.textContent = 'Use my location';
    }
  }
  nearYouCta?.addEventListener('click', () => {
    if (currentState.liveCoords) {
      // Show every place (clear distance cap) sorted nearest-first; keep category/collection if set
      currentState.sortBy = 'distance-asc';
      currentState.maxDistanceKm = 'all';
      const sortBySelect = document.getElementById('sortBySelect');
      if (sortBySelect) sortBySelect.value = 'distance-asc';
      document.querySelectorAll('.distance-pill, [data-dist]').forEach(p => {
        if (p.classList) p.classList.toggle('active', (p.getAttribute('data-dist') || 'all') === 'all');
      });
      updateCardsDistanceAndTransit();
      applyFiltersAndSort();
      // Jump the user to the place cards (no manual scroll)
      scrollToPlaces(true);
      const n = [...document.querySelectorAll('.place-card')].filter(c => c.style.display !== 'none').length;
      showToast(`📍 ${n} place${n === 1 ? '' : 's'} sorted nearest to you first.`);
    } else if (typeof detectUserLiveLocation === 'function') {
      showToast('Getting your location… then we will open nearby places.');
      detectUserLiveLocation();
    }
  });
  // Refresh strip when distances update
  const _origSetLive = typeof setLiveLocationFromCoords === 'function' ? setLiveLocationFromCoords : null;
  if (_origSetLive) {
    // already defined earlier; call update after location set via toast path
  }
  setTimeout(updateNearYouStrip, 800);
  setInterval(updateNearYouStrip, 8000);

  // Public social proof stats
  async function loadPublicStats() {
    try {
      const data = await api('/api/stats/public');
      const s = data.stats || {};
      const set = (id, v, fallback) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v != null && v !== 0 ? String(v) : (fallback || '—');
      };
      // Never show signup counts on the public site
      set('statPlacesCount', s.places, '40+');
      set('statOutingsWeek', s.outingsLogged, '0');
    } catch {
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('statPlacesCount', '40+');
      set('statOutingsWeek', '—');
    }
  }

  // ========== Admin recommendations hero carousel ==========
  let heroRecs = [];
  let heroAdminRecs = [];
  let heroSlideTimer = null;
  let heroSlideIndex = 0;
  let heroPhotoIndex = 0;

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function updateNearestTagForRec(rec) {
    const tag = document.getElementById('heroNearestTag');
    if (!tag || !rec) { if (tag) tag.style.display = 'none'; return; }
    const origin = typeof getActiveOrigin === 'function' ? getActiveOrigin() : null;
    if (!origin || !Number.isFinite(rec.lat) || !Number.isFinite(rec.lng)) {
      tag.style.display = 'none';
      return;
    }
    const km = haversineKm(origin.lat, origin.lng, rec.lat, rec.lng);
    // Tag sticks only for people near this place (< 12 km)
    if (km <= 12) {
      tag.style.display = 'inline-flex';
      tag.textContent = km < 1 ? '📍 Nearest to you · under 1 km' : `📍 Nearest to you · ${km.toFixed(1)} km`;
    } else {
      tag.style.display = 'none';
    }
  }

  function renderHeroSlide() {
    const track = document.getElementById('heroCarouselTrack');
    const empty = document.getElementById('heroCarouselEmpty');
    const dots = document.getElementById('heroCarouselDots');
    const overlay = document.getElementById('heroRecOverlay');
    const badge = document.getElementById('heroRecBadge');
    const caption = document.getElementById('heroRecCaption');
    const meta = document.getElementById('heroRecMeta');
    if (!track || !empty) return;

    if (!heroRecs.length) {
      empty.style.display = 'flex';
      track.style.display = 'none';
      if (dots) dots.style.display = 'none';
      if (overlay) overlay.style.display = 'none';
      const tag = document.getElementById('heroNearestTag');
      if (tag) tag.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    track.style.display = 'block';
    if (dots) dots.style.display = 'flex';
    if (overlay) overlay.style.display = 'block';

    const rec = heroRecs[heroSlideIndex % heroRecs.length];
    // Only use admin-uploaded photos — never mix with unrelated defaults unless no photos
    let photos = Array.isArray(rec.photos) ? rec.photos.filter(Boolean) : [];
    if (!photos.length && rec.image && !String(rec.image).includes('bengaluru_palace') && !String(rec.image).includes('student_explorer_hero')) photos = [rec.image];
    if (!photos.length) {
      // A featured place is never skipped: no photo yet means a clean name card instead.
      track.innerHTML = '<div class="hero-carousel-slide active hero-fallback-slide"><span aria-hidden="true">📍</span></div>';
      if (dots) dots.innerHTML = '';
      if (badge) badge.textContent = rec.sponsored ? 'Sponsored' : '⭐ Featured';
      if (caption) caption.textContent = rec.name;
      if (meta) meta.textContent = [rec.location, rec.budget, rec.offerText ? '🎁 ' + rec.offerText : ''].filter(Boolean).join(' · ');
      updateNearestTagForRec(rec);
      return;
    }
    if (heroPhotoIndex >= photos.length) heroPhotoIndex = 0;

    // Use <img> so data-URLs rotate reliably (CSS url() breaks on long base64)
    track.innerHTML = photos.map((src, i) =>
      `<div class="hero-carousel-slide${i === heroPhotoIndex ? ' active' : ''}"><img class="hero-carousel-img" alt="" decoding="async" /></div>`
    ).join('');
    track.querySelectorAll('.hero-carousel-img').forEach((img, i) => {
      img.src = photos[i];
    });

    if (dots) {
      dots.innerHTML = photos.map((_, i) =>
        `<button type="button" class="${i === heroPhotoIndex ? 'active' : ''}" data-i="${i}" aria-label="Photo ${i+1}"></button>`
      ).join('');
      dots.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          heroPhotoIndex = parseInt(btn.dataset.i, 10) || 0;
          renderHeroSlide();
          restartHeroTimer();
        });
      });
    }

    if (badge) badge.textContent = rec.sponsored ? 'Sponsored' : (rec.isHotel ? '🏨 Admin hotel pick' : '⭐ Admin recommendation');
    if (caption) caption.textContent = rec.name + (rec.famousFor && !rec.sponsored ? ` — ${rec.famousFor}` : '');
    if (meta) meta.textContent = [rec.location, rec.budget, rec.offerText ? '🎁 ' + rec.offerText : ''].filter(Boolean).join(' · ');
    updateNearestTagForRec(rec);
  }

  function restartHeroTimer() {
    if (heroSlideTimer) clearInterval(heroSlideTimer);
    heroSlideTimer = setInterval(() => {
      if (!heroRecs.length) return;
      const rec = heroRecs[heroSlideIndex % heroRecs.length];
      const photos = (rec.photos && rec.photos.length) ? rec.photos : (rec.image ? [rec.image] : []);
      if (photos.length > 1) {
        heroPhotoIndex = (heroPhotoIndex + 1) % photos.length;
        // after full photo cycle, move to next recommendation
        if (heroPhotoIndex === 0) heroSlideIndex = (heroSlideIndex + 1) % heroRecs.length;
      } else {
        heroSlideIndex = (heroSlideIndex + 1) % heroRecs.length;
        heroPhotoIndex = 0;
      }
      renderHeroSlide();
    }, 3000);
  }

  async function loadHeroRecommendations() {
    try {
      const data = await api('/api/recommendations');
      heroAdminRecs = data.recommendations || [];
    } catch (e) {
      console.warn('Hero recommendations:', e.message);
      heroAdminRecs = [];
    }
    rebuildHero();
  }
  // Hero card = paying "hero" shops first (strongest first, equal ones take turns), then the admin's own picks.
  function rebuildHero() {
    const origin = typeof getActiveOrigin === 'function' ? getActiveOrigin() : null;
    let admin = [...heroAdminRecs].sort((a, b) => ((b.photos && b.photos.length) ? 1 : 0) - ((a.photos && a.photos.length) ? 1 : 0));
    if (origin && admin.length) admin.sort((a, b) => (((b.photos && b.photos.length) ? 1 : 0) - ((a.photos && a.photos.length) ? 1 : 0)) || (haversineKm(origin.lat, origin.lng, a.lat, a.lng) - haversineKm(origin.lat, origin.lng, b.lat, b.lng)));
    const sponsored = Object.keys(PROMOS).filter(id => PROMOS[id].placements.includes('hero') && PLACES_DATA[id])
      .sort((a, b) => promoScore(b) - promoScore(a)).slice(0, 5)
      .map(id => { const pl = PLACES_DATA[id]; const photos = (Array.isArray(pl.photos) ? pl.photos.filter(Boolean) : []); if (!photos.length && pl.image) photos.push(pl.image); return { ...pl, photos, image: photos[0] || '', sponsored: true, offerText: PROMOS[id].offerText }; });
    const ids = new Set(sponsored.map(x => x.id));
    heroRecs = [...sponsored, ...admin.filter(a => !ids.has(a.id))];
    heroSlideIndex = 0; heroPhotoIndex = 0;
    renderHeroSlide();
    restartHeroTimer();
  }
  // Tapping the big card opens that place's details (directions, photos, reviews).
  document.getElementById('heroRecCard')?.addEventListener('click', (e) => {
    if (e.target.closest('.hero-carousel-dots')) return;
    const rec = heroRecs.length ? heroRecs[heroSlideIndex % heroRecs.length] : null;
    if (rec && rec.id && PLACES_DATA[rec.id]) openPlaceDetails(rec.id);
  });
  loadHeroRecommendations();

  // ==========================================================================
  // INSTANT PICKS — first 20–30 second magic for new visitors
  // ==========================================================================
  function showDelight(message) {
    let el = document.getElementById('seDelightToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'seDelightToast';
      el.className = 'se-delight-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(showDelight._t);
    showDelight._t = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function getInstantOrigin() {
    if (typeof getActiveOrigin === 'function') {
      const o = getActiveOrigin();
      if (o && Number.isFinite(o.lat) && Number.isFinite(o.lng)) return o;
    }
    // Default: central Bengaluru (near Cubbon / MG Road)
    return { lat: 12.9716, lng: 77.5946, name: 'Bengaluru' };
  }

  function scoreInstantPlace(p, origin, budgetCap) {
    const base = scoreInstantPlaceBase(p, origin, budgetCap);
    return base === -Infinity ? base : base + promoBoost(p.id, 'discovery') * 0.6;
  }
  function scoreInstantPlaceBase(p, origin, budgetCap) {
    if (!p || !p.name || !Number.isFinite(Number(p.lat))) return -Infinity;
    const minB = Number(p.minBudget);
    const maxB = Number(p.maxBudget != null ? p.maxBudget : p.minBudget);
    if (Number.isFinite(budgetCap) && Number.isFinite(minB) && minB > budgetCap) return -Infinity;
    const dist = haversineKm(origin.lat, origin.lng, Number(p.lat), Number(p.lng));
    const rating = Number(p.rating) || 3.5;
    // Prefer closer, higher rated, lower budget, and places with images
    let score = rating * 18 - dist * 2.2;
    if (Number.isFinite(minB)) score += Math.max(0, 12 - minB / 25);
    if (p.image || (p.photos && p.photos.length)) score += 4;
    if (p.studentTip) score += 2;
    if (p.recommendedByAdmin || p.featured) score += 3;
    // Slight boost for free / very cheap
    if (Number.isFinite(minB) && minB <= 50) score += 5;
    return score;
  }

  function pickInstantPlaces(budgetCap = 300, limit = 4) {
    const origin = getInstantOrigin();
    const all = Object.values(PLACES_DATA || {}).filter(p => p && p.id && p.name);
    const scored = all
      .map(p => ({ p, score: scoreInstantPlace(p, origin, budgetCap) }))
      .filter(x => x.score > -Infinity)
      .sort((a, b) => b.score - a.score);
    // Diversity: avoid all same category
    const picked = [];
    const seenCat = new Set();
    let sponsoredCount = 0;
    for (const { p } of scored) {
      if (picked.length >= limit) break;
      if (PROMOS[p.id] && sponsoredCount >= 2) continue; // never let paid spots take over the picks
      const cat = p.category || 'other';
      if (seenCat.has(cat) && picked.length >= 2) continue;
      if (PROMOS[p.id]) sponsoredCount++;
      seenCat.add(cat);
      picked.push(p);
    }
    // Fill remaining if diversity filtered too hard
    if (picked.length < limit) {
      for (const { p } of scored) {
        if (picked.length >= limit) break;
        if (!picked.includes(p)) picked.push(p);
      }
    }
    return { places: picked, origin };
  }

  function renderInstantPicks(budgetCap = 300) {
    const grid = document.getElementById('instantPicksGrid');
    const sub = document.getElementById('instantPicksSub');
    const social = document.getElementById('instantSocialProof');
    if (!grid) return;
    const { places, origin } = pickInstantPlaces(budgetCap, 4);
    if (!places.length) {
      grid.innerHTML = '<p class="form-helper">No places match this budget yet. Try a higher budget or search above.</p>';
      return;
    }
    if (sub) {
      const locLabel = (origin && origin.name) ? origin.name : 'you';
      sub.textContent = `Strong picks near ${locLabel} under ₹${budgetCap}. Tap a card to see directions.`;
    }
    grid.innerHTML = places.map((p, i) => {
      const img = (p.image || (Array.isArray(p.photos) && p.photos[0]) || '').toString();
      const minB = Number(p.minBudget);
      const maxB = Number(p.maxBudget != null ? p.maxBudget : p.minBudget);
      let price = '';
      if (Number.isFinite(minB)) {
        price = maxB && maxB !== minB ? `₹${minB}–₹${maxB}` : (minB === 0 ? 'Free' : `₹${minB}`);
      }
      const dist = haversineKm(origin.lat, origin.lng, Number(p.lat), Number(p.lng));
      const distLabel = Number.isFinite(dist) ? (dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`) : '';
      const promo = PROMOS[p.id];
      const badge = promo ? 'Sponsored' : (i === 0 ? 'Top pick' : (minB === 0 ? 'Free' : (p.rating >= 4.6 ? 'Student favourite' : 'Good value')));
      return `<button type="button" class="instant-card" data-instant-id="${escapeHtml(p.id)}" data-instant-name="${escapeHtml(p.name)}">
        <span class="instant-card-media">
          ${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" decoding="async" onerror="this.parentElement.innerHTML='<span class=\\'instant-card-fallback\\'>📍</span>'">` : '<span class="instant-card-fallback" aria-hidden="true">📍</span>'}
          <span class="instant-card-badge">${badge}</span>
        </span>
        <span class="instant-card-body">
          <strong class="instant-card-name">${escapeHtml(p.name)}</strong>
          <span class="instant-card-loc">📍 ${escapeHtml(p.location || 'Bengaluru')}${distLabel ? ' · ' + distLabel : ''}</span>
          ${promo && promo.offerText ? `<span class="instant-card-offer">🎁 ${escapeHtml(promo.offerText)}</span>` : ''}
          <span class="instant-card-meta">
            ${p.rating ? `<span>★ ${Number(p.rating).toFixed(1)}</span>` : ''}
            ${price ? `<span class="price">${escapeHtml(price)} / person</span>` : ''}
          </span>
          <span class="instant-card-cta">🧭 Get directions →</span>
        </span>
      </button>`;
    }).join('');

    grid.querySelectorAll('[data-instant-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.instantId;
        // Pre-fill trip planner stop 1 with this place and scroll to planner
        const sel1 = document.getElementById('tripPlanStop1');
        if (sel1) {
          // Ensure option exists
          let opt = [...sel1.options].find(o => o.value === id);
          if (!opt) {
            opt = document.createElement('option');
            opt.value = id;
            opt.textContent = btn.dataset.instantName || id;
            sel1.appendChild(opt);
          }
          sel1.value = id;
          try { sel1.dispatchEvent(new Event('change')); } catch (_) {}
        }
        // v17: go straight to the route; the place is already in stop 1 of the trip planner.
        openPlaceDirections(id);
      });
    });

    if (social) {
      social.style.display = 'flex';
      social.innerHTML = `<span><span class="dot" aria-hidden="true"></span> Live student picks</span>
        <span>Budgets are real student spends</span>
        <span>Share the plan → friends can join</span>`;
    }
  }

  function wireInstantPicks() {
    renderInstantPicks(300);
    document.getElementById('instantRefreshBtn')?.addEventListener('click', () => {
      renderInstantPicks(300);
      showToast('Picks refreshed for your location');
    });
    document.getElementById('instantPlanBtn')?.addEventListener('click', () => {
      document.getElementById('squadTripPlanner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Pre-fill first two strong picks if empty
      const { places } = pickInstantPlaces(300, 3);
      const s1 = document.getElementById('tripPlanStop1');
      const s2 = document.getElementById('tripPlanStop2');
      if (s1 && places[0] && !s1.value) {
        let opt = [...s1.options].find(o => o.value === places[0].id);
        if (!opt) { opt = document.createElement('option'); opt.value = places[0].id; opt.textContent = places[0].name; s1.appendChild(opt); }
        s1.value = places[0].id;
        try { s1.dispatchEvent(new Event('change')); } catch (_) {}
      }
      if (s2 && places[1] && !s2.value) {
        let opt = [...s2.options].find(o => o.value === places[1].id);
        if (!opt) { opt = document.createElement('option'); opt.value = places[1].id; opt.textContent = places[1].name; s2.appendChild(opt); }
        s2.value = places[1].id;
        try { s2.dispatchEvent(new Event('change')); } catch (_) {}
      }
      try { updateTripPlanSummary(); } catch (_) {}
      showDelight('Two stops ready — set your budget and share 🚀');
    });

    // When budget chips are clicked, also refresh instant picks to match
    document.getElementById('heroBudgetChips')?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-collection]');
      if (!chip) return;
      const col = chip.dataset.collection;
      let cap = 300;
      if (col === 'under150') cap = 150;
      else if (col === 'free') cap = 50;
      else if (col === 'under300') cap = 300;
      else if (col === 'food') cap = 300;
      renderInstantPicks(cap);
      document.getElementById('instantPicks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Re-render when GPS location becomes available
    const origGps = document.getElementById('heroGpsBtn');
    if (origGps) {
      origGps.addEventListener('click', () => {
        setTimeout(() => renderInstantPicks(300), 1800);
      });
    }
  }
  // Run after places are ready
  setTimeout(wireInstantPicks, 400);
  setTimeout(applySharedPlanFromUrl, 600);
  // Also refresh once more after a short delay (DB community places may load)
  setTimeout(() => { try { renderInstantPicks(300); } catch (_) {} }, 2200);

  // First-visit nudge: after ~2.5s gently draw attention to Instant Picks (only once)
  try {
    if (!localStorage.getItem('se_seen_instant_picks')) {
      setTimeout(() => {
        const sec = document.getElementById('instantPicks');
        if (!sec) return;
        sec.style.outline = '2px solid rgba(15,118,110,0.45)';
        sec.style.outlineOffset = '4px';
        setTimeout(() => { sec.style.outline = ''; }, 2200);
        try { localStorage.setItem('se_seen_instant_picks', '1'); } catch (_) {}
      }, 2500);
    }
  } catch (_) {}

  // Refresh nearest tag when GPS updates

  setInterval(() => {
    if (heroRecs.length) updateNearestTagForRec(heroRecs[heroSlideIndex % heroRecs.length]);
  }, 5000);

  // Admin multi-photo from file explorer (compressed so upload succeeds)
  const hotelPhotosInput = document.getElementById('hotelPhotosInput');
  const hotelPhotoPreviews = document.getElementById('hotelPhotoPreviews');
  hotelPhotosInput?.addEventListener('change', async () => {
    window.__hotelPhotos = [];
    if (hotelPhotoPreviews) hotelPhotoPreviews.innerHTML = '';
    const files = [...(hotelPhotosInput.files || [])].slice(0, 6);
    if (!files.length) return;
    showToast('Processing photos…');
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        let dataUrl = await compressImageFile(file, 1280, 0.72);
        // If still large, compress harder
        if (String(dataUrl).length > 1_500_000) {
          dataUrl = await compressImageFile(file, 960, 0.6);
        }
        if (String(dataUrl).length > 1_800_000) {
          showToast(`${file.name} skipped — still too large after compression.`);
          continue;
        }
        window.__hotelPhotos.push(dataUrl);
        if (hotelPhotoPreviews) {
          const img = document.createElement('img');
          img.src = dataUrl;
          img.alt = file.name;
          hotelPhotoPreviews.appendChild(img);
        }
      } catch (err) {
        console.warn(err);
        showToast(`Could not process ${file.name}`);
      }
    }
    if (window.__hotelPhotos.length) {
      showToast(`${window.__hotelPhotos.length} photo(s) ready — only these will show on the homepage.`);
    }
  });


  loadPublicStats();

  // Theme: light / dark
  const themeBtn = document.getElementById('themeToggleBtn');
  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    try { localStorage.setItem('se_theme', mode); } catch {}
    if (themeBtn) themeBtn.textContent = mode === 'dark' ? '☀️' : '🌙';
  }
  try {
    const saved = localStorage.getItem('se_theme');
    applyTheme(saved === 'dark' ? 'dark' : 'light');
  } catch { applyTheme('light'); }
  themeBtn?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  // First visit → encourage Sign Up (not Login)
  const wsb = document.getElementById('welcomeSignupBanner');
  if (wsb && !isLoggedIn()) {
    try {
      if (!localStorage.getItem('se_wsb_dismissed')) {
        wsb.style.display = 'block';
      }
    } catch { wsb.style.display = 'block'; }
  }
  document.getElementById('wsbSignupBtn')?.addEventListener('click', () => {
    if (wsb) wsb.style.display = 'none';
    openAuth('signup', 'Create a free account with email — no Google needed. Then you can add places and comments.');
  });
  document.getElementById('wsbDismissBtn')?.addEventListener('click', () => {
    if (wsb) wsb.style.display = 'none';
    try { localStorage.setItem('se_wsb_dismissed', '1'); } catch {}
  });

  // Empty state → contribute place
  document.getElementById('emptyContributeBtn')?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      openAuth('signup', 'Sign up free to add this place for other students.');
      return;
    }
    const q = (document.getElementById('searchInput')?.value || '').trim();
    const openBtn = document.getElementById('navAddPlaceBtn') || document.getElementById('navAddPlaceLink');
    openBtn?.click();
    setTimeout(() => {
      const nameInput = document.getElementById('newPlaceName');
      if (nameInput && q && !/food|park|near/i.test(q)) nameInput.value = q;
    }, 200);
  });

  // Manual decimal rating for reviews
  const manualRatingInput = document.getElementById('manualRatingInput');
  if (manualRatingInput) {
    manualRatingInput.addEventListener('input', () => {
      let v = parseFloat(manualRatingInput.value);
      if (!Number.isFinite(v)) return;
      v = Math.min(5, Math.max(1, v));
      const hidden = document.getElementById('selectedStarRating');
      if (hidden) hidden.value = String(v);
      const hint = document.getElementById('ratingLabelHint');
      if (hint) hint.textContent = `${v.toFixed(1)} — your rating`;
      document.querySelectorAll('.star-pick').forEach(s => {
        const sv = parseInt(s.getAttribute('data-val'), 10);
        s.classList.toggle('active', sv <= Math.round(v));
      });
    });
  }
  // When stars clicked, sync manual input
  document.querySelectorAll('.star-pick').forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-val'), 10) || 5;
      if (manualRatingInput) manualRatingInput.value = String(val);
    });
  });


  // Soft location prompt on open — prefer permission API so we don't spam the OS dialog
  const locationPromptBanner = document.getElementById('locationPromptBanner');
  const lpbAllowBtn = document.getElementById('lpbAllowBtn');
  const lpbDismissBtn = document.getElementById('lpbDismissBtn');

  function hideLocationPrompt() {
    if (!locationPromptBanner) return;
    locationPromptBanner.classList.remove('visible');
    locationPromptBanner.setAttribute('aria-hidden', 'true');
  }
  function showLocationPrompt() {
    if (!locationPromptBanner) return;
    if (sessionStorage.getItem('se_loc_prompt_dismissed') === '1') return;
    if (document.querySelector('.modal-backdrop.open')) { setTimeout(showLocationPrompt, 4000); return; } // never stack on a dialog
    locationPromptBanner.classList.add('visible');
    locationPromptBanner.setAttribute('aria-hidden', 'false');
  }

  if (lpbAllowBtn) {
    lpbAllowBtn.addEventListener('click', () => {
      hideLocationPrompt();
      sortBySelect && (sortBySelect.value = 'distance-asc');
      detectUserLiveLocation();
    });
  }
  if (lpbDismissBtn) {
    lpbDismissBtn.addEventListener('click', () => {
      sessionStorage.setItem('se_loc_prompt_dismissed', '1');
      hideLocationPrompt();
    });
  }

  setTimeout(async () => {
    sortBySelect && (sortBySelect.value = 'distance-asc');
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'granted') {
          detectUserLiveLocation();
          return;
        }
        if (status.state === 'denied') return;
      }
    } catch (_) { /* permissions API not available in some browsers */ }
    // Permission unknown / prompt — show our soft banner instead of a hard browser dialog
    setTimeout(showLocationPrompt, 6000); // let the visitor see the page first
  }, 900);

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootExplorer);
} else {
  bootExplorer();
}

/* ===== UI v7: sidebar / topbar wiring (uses only existing features) ===== */
(function () {
  function init() {
    const $ = (id) => document.getElementById(id);
    const sideNav = $('sideNav');
    if (!sideNav) return;
    const click = (id) => { const el = $(id); if (el) el.click(); };
    const go = (sel) => { const t = document.querySelector(sel); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    const closeMenu = () => { $('navMenu')?.classList.remove('open'); $('mobileToggle')?.setAttribute('aria-expanded', 'false'); };

    function runAction(action) {
      if (action === 'nearby') {
        const sort = $('sortBySelect');
        if (sort) { sort.value = 'distance-asc'; sort.dispatchEvent(new Event('change', { bubbles: true })); }
        click('heroGpsBtn');
      } else if (action === 'wishlist') {
        if (typeof window.openWishlistDrawer === 'function') window.openWishlistDrawer();
        else {
          const chip = document.querySelector('.hero-chip[data-collection="favourites"]');
          if (chip) chip.click();
        }
      } else if (action === 'under150') {
        const chip = document.querySelector('.hero-chip[data-collection="under150"]');
        if (chip) chip.click();
      } else if (action === 'addplace') {
        click('navAddPlaceBtn');
      } else if (action === 'profile') {
        const loggedIn = $('profileMenuWrap') && $('profileMenuWrap').style.display !== 'none';
        if (loggedIn) window.dispatchEvent(new CustomEvent('se-open-profile', { detail: { tab: 'overview' } }));
        else { click('loginBtn'); }
      } else if (action === 'admin') {
        click('navAdminBtn');
      }
    }

    document.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const action = el.getAttribute('data-action');
        const href = el.getAttribute('href') || '';
        if (!href.startsWith('#') || href === '#') e.preventDefault();
        runAction(action);
        if (href.length > 1) { e.preventDefault(); go(href); }
        closeMenu();
      });
    });

    // Active state in the sidebar
    const links = sideNav.querySelectorAll('.nav-link[href^="#"]');
    links.forEach((a) => a.addEventListener('click', () => {
      links.forEach((l) => l.classList.remove('active'));
      if ((a.getAttribute('href') || '#') !== '#') a.classList.add('active');
    }));

    // Sidebar "Add a Place" promo + link
    $('sidePromoBtn')?.addEventListener('click', () => { click('navAddPlaceBtn'); closeMenu(); });

    // Admin entry only for admins (mirrors the existing admin button)
    const adminBtn = $('navAdminBtn'), adminLink = $('sideAdminLink');
    if (adminBtn && adminLink) {
      const sync = () => { adminLink.style.display = adminBtn.style.display === 'none' ? 'none' : 'flex'; };
      new MutationObserver(sync).observe(adminBtn, { attributes: true, attributeFilter: ['style'] });
      sync();
    }

    // Topbar search -> existing smart search (budget + fuzzy place search)
    const top = $('topSearchInput'), hero = $('searchInput');
    $('topSearchForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!hero) return;
      hero.value = top.value;
      hero.dispatchEvent(new Event('input', { bubbles: true }));
      $('searchSubmitBtn')?.click();
      go('#places');
    });

    // Topbar location -> existing live-location detector; mirrors its status text
    $('topLocationBtn')?.addEventListener('click', () => click('heroGpsBtn'));
    const status = $('heroLocationStatus'), locText = $('topLocationText');
    if (status && locText) {
      const mirror = () => { const t = (status.textContent || '').trim(); locText.textContent = /^Live GPS/i.test(t) ? 'Live location' : (t.replace(/^Currently exploring\s*/i, '') || 'Bengaluru'); };
      new MutationObserver(mirror).observe(status, { childList: true, characterData: true, subtree: true });
      mirror();
    }

    // v17: visible close button inside the phone menu (the sidebar covers the hamburger while open)
    $('sideNavClose')?.addEventListener('click', () => closeMenu());

    // Close the mobile sidebar when tapping outside it
    document.addEventListener('click', (e) => {
      const open = $('navMenu')?.classList.contains('open');
      if (open && !sideNav.contains(e.target) && !$('mobileToggle')?.contains(e.target)) closeMenu();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Plain-language reasons for XP rows saved before explanations were stored. */
window.__seXpWhy = function (reason) {
  const r = String(reason || '');
  if (/^Verified visit/i.test(r)) return 'Your GPS was at this place when you tapped Verify.';
  if (/^Published student review|^Review/i.test(r)) return 'You shared a review that helps the next student.';
  if (/photo/i.test(r)) return 'Your photo was approved for this place.';
  if (/^Unlocked/i.test(r)) return 'You unlocked a badge, which pays a one-time XP reward.';
  if (/group trip|squad/i.test(r)) return 'Squad trip activity.';
  if (/hidden gem/i.test(r)) return 'This place is marked as a hidden gem.';
  if (/challenge/i.test(r)) return 'A challenge was completed.';
  if (/location correction|pin/i.test(r)) return 'A map pin you reported was confirmed.';
  return 'Earned for exploring Bengaluru.';
};

/* V10: server-backed student achievement collection. */
(function () {
  const $ = (id) => document.getElementById(id);
  const rarityClass = (rarity) => String(rarity || '').toLowerCase();
  async function loadAchievements() {
    const grid = $('achievementGrid');
    if (!grid) return;
    const token = (() => { try { return sessionStorage.getItem('grok-auth.bearer-token') || ''; } catch { return ''; } })();
    const headers = token ? { Authorization: 'Bearer ' + token } : {};
    try {
      const response = await fetch('/api/gamification', { credentials: 'include', headers });
      const data = await response.json();
      if (response.status === 401) { grid.innerHTML = '<div class="achievement-loading">Log in to track verified visits, XP and your badge collection.</div>'; $('achievementXp').textContent = '0'; $('achievementLevel').textContent = 'Newbie · Level 1'; $('achievementStats').innerHTML = '<div><strong>0</strong><span>Verified visits</span></div><div><strong>12</strong><span>Achievements</span></div><div><strong>3</strong><span>Showcase slots</span></div>'; return; }
      if (!response.ok || data.success === false) throw new Error(data.error || 'Unable to load achievements.');
      $('achievementXp').textContent = Number(data.xp || 0).toLocaleString('en-IN');
      $('achievementLevel').textContent = `${data.level.name} · Level ${data.level.level}`;
      $('achievementXpBar').style.width = `${data.progress || 0}%`;
      $('achievementNextLevel').textContent = data.nextLevel ? `${data.nextLevel.xp - data.xp} XP to ${data.nextLevel.name}` : 'Maximum level reached';
      $('achievementStats').innerHTML = `<div><strong>${data.metrics.visits || 0}</strong><span>Verified visits</span></div><div><strong>${data.achievements.filter(a => a.unlockedAt).length}/12</strong><span>Unlocked badges</span></div><div><strong>${data.featured.length}/3</strong><span>Showcase slots</span></div>`;
      grid.innerHTML = data.achievements.map((badge) => {
        const unlocked = Boolean(badge.unlockedAt);
        const featured = (data.featured || []).includes(badge.id);
        return `<article class="achievement-card ${unlocked ? 'is-unlocked' : 'is-locked'} rarity-${rarityClass(badge.rarity)}"><div class="achievement-card-top"><span class="achievement-rarity">${badge.rarity}</span><span class="achievement-status">${unlocked ? 'UNLOCKED' : 'LOCKED'}</span></div><div class="achievement-art" aria-hidden="true">${badge.icon}</div><h4>${badge.name}</h4><p>${badge.description}</p><div class="achievement-progress"><span style="width:${badge.progress}%"></span></div><div class="achievement-progress-meta"><span>${badge.current}/${badge.target}</span><strong>+${badge.xp} XP</strong></div>${unlocked ? `<small class="achievement-unlocked-date">Unlocked ${new Date(badge.unlockedAt).toLocaleDateString('en-IN')}</small><button type="button" class="badge-feature-toggle ${featured ? 'selected' : ''}" data-feature-badge="${badge.id}" aria-pressed="${featured}">${featured ? '★ Featured on profile' : '☆ Feature on profile'}</button>` : ''}</article>`;
      }).join('');
      const featuredBadges = data.achievements.filter(a => (data.featured || []).includes(a.id));
      const profileBadges = $('profileFeaturedBadges');
      if (profileBadges) profileBadges.innerHTML = featuredBadges.map(a => `<span title="${a.name}">${a.icon}</span>`).join('');
      const history = $('achievementHistory');
      if (history) history.innerHTML = `<h3>Recent XP activity <small>(why you got each reward)</small></h3>${(data.history || []).length ? `<ul class="se-xp-list">${data.history.map(x => `<li><span>${String(x.reason || 'Explorer activity').replace(/[<>]/g,'')}<span class="xp-why">${String(x.detail || window.__seXpWhy(x.reason)).replace(/[<>]/g,'')} · ${new Date(x.created_at).toLocaleDateString('en-IN')}</span></span><strong>+${Number(x.amount || 0)} XP</strong></li>`).join('')}</ul>` : '<p>Your XP activity will appear here as you explore.</p>'}`;
      const challengeHost = $('monthlyChallengeList');
      if (challengeHost) {
        try {
          const challengeResponse = await fetch('/api/gamification/challenges', { credentials: 'include', headers });
          const challengeData = await challengeResponse.json();
          challengeHost.innerHTML = challengeResponse.ok && challengeData.challenges?.length ? challengeData.challenges.map(c => `<article class="monthly-challenge-card"><div class="challenge-icon">🗺️</div><div class="challenge-main"><div class="challenge-topline"><strong>${c.title}</strong><span>${c.completed ? 'COMPLETED' : 'IN PROGRESS'}</span></div><p>${c.description}</p><div class="achievement-progress"><span style="width:${Math.min(100,Math.round(c.progress/c.target*100))}%"></span></div><small>${c.progress}/${c.target} verified visits · +${c.rewardXp} XP · Ends ${new Date(c.endsAt).toLocaleDateString('en-IN')}</small></div></article>`).join('') : '<div class="achievement-loading">Monthly challenge is not available right now.</div>';
        } catch { challengeHost.innerHTML = '<div class="achievement-loading">Could not load this month’s challenge.</div>'; }
      }
      grid.querySelectorAll('[data-feature-badge]').forEach(button => button.addEventListener('click', async () => {
        const current = [...grid.querySelectorAll('[data-feature-badge][aria-pressed="true"]')].map(el => el.dataset.featureBadge);
        const id = button.dataset.featureBadge;
        const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id].slice(-3);
        try {
          const saveHeaders = { 'Content-Type': 'application/json' };
          if (token) saveHeaders.Authorization = 'Bearer ' + token;
          const save = await fetch('/api/gamification/featured', { method: 'POST', credentials: 'include', headers: saveHeaders, body: JSON.stringify({ ids: next }) });
          const saved = await save.json();
          if (!save.ok || saved.success === false) throw new Error(saved.error || 'Could not update featured badges.');
          loadAchievements();
        } catch (error) { window.alert(error.message || 'Could not update featured badges.'); }
      }));
    } catch (error) { grid.innerHTML = `<div class="achievement-loading">${String(error.message || 'Could not load achievements.')}</div>`; }
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href="#achievements"]');
    if (link) setTimeout(loadAchievements, 250);
  });
  window.addEventListener('se-auth', loadAchievements);
  window.addEventListener('se-gamification-refresh', loadAchievements);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadAchievements); else loadAchievements();
})();

/* ===== V11: Profile centre, live student rank, admin rankings ===== */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const token = () => { try { return sessionStorage.getItem('grok-auth.bearer-token') || ''; } catch { return ''; } };
  async function call(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    const res = await fetch(path, { credentials: 'include', method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    let data = null;
    try { data = await res.json(); } catch { /* empty */ }
    if (!res.ok || (data && data.success === false)) { const e = new Error((data && data.error) || `Request failed (${res.status})`); e.status = res.status; throw e; }
    return data;
  }
  let toastTimer2 = null;
  const toast = (m) => { const t = $('toastNotification'), tm = $('toastMessage'); if (!t || !tm) return; clearTimeout(toastTimer2); tm.textContent = m; t.classList.add('show'); toastTimer2 = setTimeout(() => t.classList.remove('show'), 3200); };
  const when = (iso) => { try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); } catch { return ''; } };
  const medal = (r) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : '');
  const num = (n) => Number(n || 0).toLocaleString('en-IN');

  // ------------------------------------------------------------------ Profile centre
  const modal = $('profileModal');
  let activeTab = 'overview';
  let rankTimer = null;
  let me = null;

  function open(tab) {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    loadOverview();
    showTab(tab || 'overview');
  }
  function close() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopRankTimer();
  }
  function showTab(name) {
    activeTab = name;
    modal.querySelectorAll('.pf-tab').forEach((b) => { const on = b.dataset.pfTab === name; b.classList.toggle('active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    ['overview', 'rank', 'badges', 'trips'].forEach((t) => { const el = $('pfPane' + t[0].toUpperCase() + t.slice(1)); if (el) el.hidden = t !== name; });
    stopRankTimer();
    if (name === 'rank') { loadRank(); rankTimer = setInterval(() => { if (modal.classList.contains('open')) loadRank(true); }, 15000); }
    if (name === 'badges') loadBadges();
    if (name === 'trips') loadTrips();
  }
  function stopRankTimer() { if (rankTimer) { clearInterval(rankTimer); rankTimer = null; } }

  async function loadOverview() {
    try {
      const [prof, g] = await Promise.all([call('/api/profile'), call('/api/gamification')]);
      me = prof.user || {};
      const name = me.name || (me.email || 'Student').split('@')[0];
      $('profileModalTitle').textContent = name;
      $('pfAvatar').textContent = (name[0] || 'S').toUpperCase();
      $('pfEmail').textContent = me.email || '';
      $('pfCollege').textContent = me.college ? '🎓 ' + me.college : '';
      $('pfLevelName').textContent = `Level ${g.level.level} · ${g.level.name}`;
      $('pfXp').textContent = `${num(g.xp)} XP`;
      $('pfXpBar').style.width = (g.progress || 0) + '%';
      $('pfNext').textContent = g.nextLevel ? `${num(g.nextLevel.xp - g.xp)} XP to ${g.nextLevel.name}` : 'Maximum level reached';
      const unlocked = (g.achievements || []).filter((a) => a.unlockedAt);
      $('pfStats').innerHTML = `
        <div class="pf-stat"><strong>${num(g.metrics?.visits)}</strong><span>Verified visits</span></div>
        <div class="pf-stat"><strong>${unlocked.length}<small>/${(g.achievements || []).length}</small></strong><span>Badges</span></div>
        <div class="pf-stat"><strong id="pfStatRank">—</strong><span>Your place</span></div>
        <div class="pf-stat"><strong>${num(g.xp)}</strong><span>Total XP</span></div>`;
      const featured = (g.achievements || []).filter((a) => (g.featured || []).includes(a.id));
      $('pfShowcase').innerHTML = featured.length
        ? featured.map((a) => `<span class="pf-badge" title="${esc(a.description)}"><i>${esc(a.icon)}</i>${esc(a.name)}</span>`).join('')
        : '<p class="form-helper">No showcase badges yet. Unlock a badge, then feature up to three in the collection.</p>';
      let why = $('pfXpWhy');
      if (!why) { why = document.createElement('div'); why.id = 'pfXpWhy'; const actions = document.querySelector('#pfPaneOverview .pf-actions'); if (actions) actions.insertAdjacentElement('beforebegin', why); }
      why.innerHTML = `<h4 class="pf-h">Why you got XP</h4>${(g.history || []).length ? `<ul class="se-xp-list">${g.history.slice(0, 8).map((x) => `<li><span>${esc(x.reason)}<span class="xp-why">${esc(x.detail || window.__seXpWhy(x.reason))}</span></span><strong>+${num(x.amount)}</strong></li>`).join('')}</ul>` : '<p class="form-helper">Verify a visit, write a useful review or add a photo and the reason for every reward shows up here.</p>'}`;
      // fill "Your place" quietly
      call('/api/leaderboard').then((r) => { const el = $('pfStatRank'); if (el) el.textContent = r.published && r.me && r.me.placeLabel ? r.me.placeLabel.replace(' place', '') : '—'; }).catch(() => {});
    } catch (err) {
      if (err.status === 401) { close(); toast('Please log in to open your profile.'); $('loginBtn')?.click(); return; }
      $('pfStats').innerHTML = `<p class="form-helper">${esc(err.message)}</p>`;
    }
  }

  async function loadBadges() {
    const host = $('pfPaneBadges');
    host.innerHTML = '<p class="form-helper">Loading badges…</p>';
    try {
      const g = await call('/api/gamification');
      host.innerHTML = `<div class="pf-badge-grid">${(g.achievements || []).map((a) => `
        <div class="pf-badge-card ${a.unlockedAt ? 'on' : 'off'}">
          <span class="pf-badge-ico">${esc(a.icon)}</span>
          <strong>${esc(a.name)}</strong>
          <small>${esc(a.description)}</small>
          <div class="xp-track"><i style="width:${a.progress || 0}%"></i></div>
          <em>${a.unlockedAt ? '✓ Unlocked' : `${a.current || 0}/${a.target}`} · +${a.xp} XP</em>
        </div>`).join('')}</div>`;
    } catch (err) { host.innerHTML = `<p class="form-helper">${esc(err.message)}</p>`; }
  }

  function loadTrips() {
    const host = $('pfPaneTrips');
    const plans = $('profileSavedPlans');
    if (plans && plans.parentElement !== host) host.appendChild(plans); // the existing saved-plan list lives here now
    if (window.__seRefreshPlans) window.__seRefreshPlans();
  }

  // ------------------------------------------------------------------ Student rank view
  function podium(top) {
    const by = (r) => top.find((e) => e.rank === r);
    const slot = (e, cls) => e ? `<div class="rk-pod ${cls}${e.isMe ? ' me' : ''}"><span class="rk-pod-medal">${medal(e.rank)}</span><strong>${esc(e.name)}${e.isMe ? ' (you)' : ''}</strong><small>${num(e.xp)} XP</small><div class="rk-pod-bar"><b>${e.rank}</b></div></div>` : '<div class="rk-pod empty"></div>';
    return `<div class="rk-podium" aria-label="Top three">${slot(by(2), 'p2')}${slot(by(1), 'p1')}${slot(by(3), 'p3')}</div>`;
  }
  function row(e, maxXp) {
    const w = maxXp ? Math.max(3, Math.round((e.xp / maxXp) * 100)) : 0;
    return `<li class="rk-row${e.isMe ? ' me' : ''}"><span class="rk-pos">${medal(e.rank) || e.rank}</span>
      <span class="rk-who"><strong>${esc(e.name)}${e.isMe ? ' <em>you</em>' : ''}</strong><small>${esc(e.college || 'Student Explorer')} · L${e.level} ${esc(e.levelName || '')}</small></span>
      <span class="rk-badges" title="${e.badges} badges">${(e.badgeIcons || []).map(esc).join('')}<b>${e.badges}</b></span>
      <span class="rk-xp"><b>${num(e.xp)}</b><i style="width:${w}%"></i></span></li>`;
  }

  async function loadRank(quiet) {
    const host = $('pfPaneRank');
    if (!quiet) host.innerHTML = '<p class="form-helper">Loading the leaderboard…</p>';
    try {
      const r = await call('/api/leaderboard');
      if (!r.published) {
        const g = await call('/api/gamification').catch(() => null);
        host.innerHTML = `<div class="rk-empty"><div class="rk-empty-ico">🏆</div><h4>The leaderboard isn’t published yet</h4>
          <p>Keep exploring! Your XP is already counting${g ? ` — you have <b>${num(g.xp)} XP</b> right now` : ''}. As soon as the admin publishes the ranking you’ll see your place here.</p></div>`;
        return;
      }
      const maxXp = r.top.length ? r.top[0].xp : 0;
      const m = r.me;
      let hero = '';
      if (m && !m.unranked) {
        const pct = r.total > 1 ? Math.max(1, Math.round(((r.total - m.rank) / (r.total - 1)) * 100)) : 100;
        hero = `<div class="rk-hero">
          <div class="rk-place"><span>You are</span><strong>${esc(m.placeLabel.replace(' place', ''))}</strong><span>place of ${num(r.total)} students</span></div>
          <div class="rk-hero-side">
            <div class="rk-chips"><span>⚡ ${num(m.xp)} XP</span><span>🏅 ${m.badges} badges</span><span>Level ${m.level} · ${esc(m.levelName)}</span></div>
            <div class="rk-pct"><div class="rk-pct-bar"><i style="width:${pct}%"></i><b style="left:${pct}%"></b></div><small>Ahead of ${pct}% of students</small></div>
            <p class="rk-next">${m.rank === 1 ? '👑 You are leading the leaderboard!' : `Earn <b>${num(m.xpToNext)} XP</b> more to move up to ${m.rank - 1}${[11,12,13].includes((m.rank - 1) % 100) ? 'th' : ['th','st','nd','rd'][(m.rank - 1) % 10] || 'th'} place.`}</p>
          </div></div>`;
      } else if (m && m.unranked) {
        hero = `<div class="rk-hero rk-hero-soft"><p>${esc(m.message)}</p></div>`;
      } else {
        hero = '<div class="rk-hero rk-hero-soft"><p>Log in to see your own place.</p></div>';
      }
      const inTop = r.top.some((e) => e.isMe);
      const list = r.top.map((e) => row(e, maxXp)).join('');
      const mine = m && !m.unranked && !inTop ? `<li class="rk-gap" aria-hidden="true">• • •</li>${row({ ...m, isMe: true }, maxXp)}` : '';
      host.innerHTML = `${hero}${r.top.length >= 3 ? podium(r.top) : ''}
        <ol class="rk-list">${list}${mine}</ol>
        <p class="rk-foot">${r.live ? '<span class="rk-live"><i></i> Live</span> Updates automatically.' : `Last published ${esc(when(r.publishedAt))}.`} Ranked by XP, then badges.</p>`;
    } catch (err) { if (!quiet) host.innerHTML = `<p class="form-helper">${esc(err.message)}</p>`; }
  }

  // ------------------------------------------------------------------ Admin rankings
  let adminTimer = null;
  async function loadRankings(quiet) {
    const body = $('rkBody');
    if (!body) return;
    const limit = Number($('rkLimit')?.value || 10);
    if (!quiet) body.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
    try {
      const d = await call('/api/admin/leaderboard?limit=' + limit);
      const maxXp = d.entries.length ? Math.max(1, d.entries[0].xp) : 1;
      body.innerHTML = d.entries.length ? d.entries.map((e) => `<tr class="${e.rank <= 3 ? 'rk-top' : ''}">
          <td><b>${medal(e.rank) || e.rank}</b></td>
          <td><strong>${esc(e.name)}</strong><br><small>${esc(e.college || '—')}</small></td>
          <td>L${e.level} · ${esc(e.levelName)}</td>
          <td class="rk-xpcell"><b>${num(e.xp)}</b><span class="rk-xpbar"><i style="width:${Math.round((e.xp / maxXp) * 100)}%"></i></span></td>
          <td>${(e.badgeIcons || []).map(esc).join(' ')} <b>${e.badges}</b></td></tr>`).join('')
        : '<tr><td colspan="5">No students yet.</td></tr>';
      const p = d.published;
      $('rkLive').checked = Boolean(p.live);
      $('rkStatus').innerHTML = `<b>${num(d.total)}</b> students ranked · ${p.visible ? `<span class="rk-on">● Visible to students</span> ${p.live ? '— updates automatically' : `· snapshot from ${esc(when(p.publishedAt))}`}` : '<span class="rk-off">○ Hidden from students (turn Live mode on to show it again).</span>'} · refreshed ${esc(when(d.generatedAt))}`;
    } catch (err) { body.innerHTML = `<tr><td colspan="5">${esc(err.message)}</td></tr>`; }
  }
  function scheduleAdmin() {
    if (adminTimer) clearInterval(adminTimer);
    adminTimer = setInterval(() => {
      const pane = $('adminPaneRankings');
      const visible = pane && pane.offsetParent !== null && $('adminModal')?.classList.contains('open');
      if (visible && $('rkAuto')?.checked) loadRankings(true);
    }, 15000);
  }
  window.__seLoadRankings = () => { loadRankings(); scheduleAdmin(); };

  $('rkRefreshBtn')?.addEventListener('click', () => loadRankings());
  $('rkLimit')?.addEventListener('change', () => loadRankings());
  $('rkPublishBtn')?.addEventListener('click', async (ev) => {
    const btn = ev.currentTarget;
    btn.disabled = true; btn.textContent = 'Publishing…';
    try { const r = await call('/api/admin/leaderboard/publish', { method: 'POST' }); toast(`✅ Ranking refreshed for ${num(r.total)} students.`); await loadRankings(true); }
    catch (err) { toast(err.message || 'Could not publish the ranking.'); }
    finally { btn.disabled = false; btn.textContent = '⚡ Update now'; }
  });
  $('rkLive')?.addEventListener('change', async (ev) => {
    try { await call('/api/admin/leaderboard/settings', { method: 'POST', body: { live: ev.target.checked } }); toast(ev.target.checked ? 'Live mode on: students always see the current ranking.' : 'Live mode off: students see the last published list.'); loadRankings(true); }
    catch (err) { toast(err.message); ev.target.checked = !ev.target.checked; }
  });
  $('rkHideBtn')?.addEventListener('click', async () => {
        try { await call('/api/admin/leaderboard/settings', { method: 'POST', body: { visible: false } }); toast('Leaderboard hidden from students.'); loadRankings(true); } catch (err) { toast(err.message); }
  });

  // Moderation buttons in the admin Places table
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest && e.target.closest('.admin-set-status');
    if (!btn) return;
    btn.disabled = true;
    try {
      await call('/api/admin/places/' + encodeURIComponent(btn.dataset.id) + '/status', { method: 'POST', body: { status: btn.dataset.status } });
      toast(btn.dataset.status === 'published' ? '✅ Place published — visible to every student.' : 'Place updated: ' + btn.dataset.status);
      document.querySelector('[data-admin-tab="places"]')?.click();
    } catch (err) { toast(err.message || 'Could not update the place.'); btn.disabled = false; }
  });

  // ------------------------------------------------------------------ wiring
  window.addEventListener('se-open-profile', (e) => open((e.detail && e.detail.tab) || 'overview'));
  $('profileOpenBtn')?.addEventListener('click', () => { $('profileMenuBtn')?.click(); open('overview'); });
  $('profileOpenRankBtn')?.addEventListener('click', () => { $('profileMenuBtn')?.click(); open('rank'); });
  $('closeProfileModalBtn')?.addEventListener('click', close);
  modal?.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('open')) close(); });
  modal?.querySelectorAll('.pf-tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.pfTab)));
  $('pfGoRank')?.addEventListener('click', () => showTab('rank'));
  $('pfGoCollection')?.addEventListener('click', () => { close(); const a = $('achievements'); if (a) { a.scrollIntoView({ behavior: 'smooth', block: 'start' }); window.dispatchEvent(new Event('se-gamification-refresh')); } });
  $('pfLogoutBtn')?.addEventListener('click', () => { close(); $('profileLogoutBtn')?.click(); });
  window.addEventListener('se-gamification-refresh', () => { if (modal?.classList.contains('open')) { loadOverview(); if (activeTab === 'rank') loadRank(true); } });
  window.addEventListener('se-auth', () => { if (modal?.classList.contains('open')) close(); });
})();
