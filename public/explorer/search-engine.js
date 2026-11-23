/*
 * Student Explorer search engine (pure logic, no DOM).
 *
 * Why this exists
 *  - The old search compared the query with the whole text of each card. Every card says "3 km from Koramangala"
 *    (the visitor's start point), so typing "Koramangala" matched EVERY place. This engine only looks at the place's
 *    own data (name, area, category, description, tags, tips, reviews).
 *  - Spelling does not have to be exact: "koramangal", "kormangala", "cubon park", "indra nagar" all work.
 *  - Matching does not have to be 100%: "quiet place to study with wifi" finds a library whose description says
 *    "silent reading hall"; "cheap dosa" finds a tiffin room even if the word "cheap" never appears.
 *  - Area aware: "koramangala", "cafes in koramangala", "near hsr" list places inside / near that area, nearest first.
 *  - Works for places added later by students or admins: the index is rebuilt from the live place list.
 *
 * Loaded in the browser as window.SESearch and in tests via vm / import.
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- text helpers
  function normalize(input) {
    return String(input == null ? '' : input)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/₹/g, ' rs ')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const VARIANTS = [
    [/bengaluru|bangalore|banglore|bengalore/g, 'blr'],
    [/ph/g, 'f'], [/kh/g, 'k'], [/gh/g, 'g'], [/dh/g, 'd'], [/bh/g, 'b'], [/th/g, 't'],
    [/sh|ch(?=[aeiou])/g, 's'], [/ee|ea|ie/g, 'i'], [/oo|ou/g, 'u'], [/w/g, 'v'], [/z/g, 's'],
    [/c(?=[eiy])/g, 's'], [/c/g, 'k'], [/q/g, 'k'], [/x/g, 'ks'], [/y(?=[^aeiou]|$)/g, 'i'],
  ];
  function phonetic(word) {
    let s = normalize(word).replace(/\s/g, '');
    for (const [re, to] of VARIANTS) s = s.replace(re, to);
    s = s.replace(/(.)\1+/g, '$1');
    if (!s) return '';
    return s[0] + s.slice(1).replace(/[aeiou]/g, '');
  }

  function editDistance(a, b, max) {
    max = max == null ? 99 : max;
    if (a === b) return 0;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;
    const d = [];
    for (let i = 0; i <= la; i++) { d.push(new Array(lb + 1).fill(0)); d[i][0] = i; }
    for (let j = 0; j <= lb; j++) d[0][j] = j;
    for (let i = 1; i <= la; i++) {
      for (let j = 1; j <= lb; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[la][lb];
  }

  function stem(w) {
    if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
    if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
    return w;
  }

  const STOP = new Set(['in', 'at', 'near', 'nearby', 'around', 'the', 'a', 'an', 'of', 'for', 'to', 'and', 'or', 'best', 'good', 'top',
    'place', 'places', 'spot', 'spots', 'me', 'with', 'from', 'my', 'some', 'any', 'is', 'are', 'i', 'want', 'find', 'show', 'looking',
    'bangalore', 'bengaluru', 'blr', 'banglore', 'bengalore', 'city', 'nice', 'great', 'where', 'what', 'can', 'go', 'visit', 'on', 'by']);

  function tokens(text) {
    return normalize(text).split(' ').filter(Boolean);
  }
  function contentTokens(text) {
    return tokens(text).filter(t => !STOP.has(t));
  }

  // ---------------------------------------------------------------- concepts (similar meaning, not exact words)
  const CONCEPTS = [
    { id: 'food', category: 'food', words: ['food', 'eat', 'eating', 'cafe', 'cafes', 'coffee', 'restaurant', 'restaurants', 'dosa', 'biryani', 'snack', 'snacks', 'chai', 'tea', 'tiffin', 'breakfast', 'lunch', 'dinner', 'meal', 'meals', 'bakery', 'dining', 'hungry', 'street', 'chaat', 'bun', 'juice', 'dessert', 'icecream', 'pizza', 'burger', 'darshini'] },
    { id: 'nature', category: 'nature', words: ['nature', 'park', 'parks', 'garden', 'gardens', 'green', 'lake', 'lakes', 'trees', 'botanical', 'walk', 'walking', 'picnic', 'outdoor', 'outdoors', 'jogging', 'cycling', 'greenery', 'fresh'] },
    { id: 'heritage', category: 'attractions', words: ['palace', 'fort', 'museum', 'heritage', 'historic', 'history', 'temple', 'monument', 'tourist', 'sightseeing', 'attraction', 'attractions', 'gallery', 'art', 'architecture', 'royal', 'church', 'mosque'] },
    { id: 'fun', category: 'entertainment', words: ['entertainment', 'movie', 'movies', 'cinema', 'game', 'games', 'arcade', 'club', 'pub', 'bar', 'hangout', 'fun', 'party', 'music', 'gaming', 'bowling', 'concert', 'mall', 'shopping', 'amusement'] },
    { id: 'stay', category: 'hotels', words: ['hotel', 'hotels', 'stay', 'hostel', 'hostels', 'pg', 'lodge', 'room', 'rooms', 'accommodation', 'homestay'] },
    { id: 'getaway', category: 'getaways', words: ['getaway', 'getaways', 'trip', 'trek', 'trekking', 'hill', 'hills', 'weekend', 'daytrip', 'outing', 'outstation', 'drive', 'ride', 'sunrise', 'viewpoint'] },
    { id: 'study', words: ['study', 'studying', 'library', 'quiet', 'silent', 'peaceful', 'calm', 'reading', 'read', 'books', 'book', 'bookstore', 'wifi', 'work', 'cowork', 'coworking', 'laptop', 'notes', 'exam'] },
    { id: 'cheap', words: ['cheap', 'free', 'budget', 'affordable', 'economical', 'inexpensive', 'student', 'pocket', 'low', 'saver', 'discount', 'concession', 'lean'] },
    { id: 'romantic', words: ['date', 'romantic', 'couple', 'couples', 'sunset', 'view', 'scenic', 'rooftop', 'candle', 'cozy', 'cosy'] },
    { id: 'morning', words: ['sunrise', 'dawn', 'morning', 'early', 'breakfast'] },
    { id: 'night', words: ['night', 'nightlife', 'late', 'evening', 'dinner', 'midnight'] },
    { id: 'group', words: ['squad', 'group', 'friends', 'gang', 'team', 'hangout', 'bunch'] },
  ];
  const WORD_TO_CONCEPTS = {};
  CONCEPTS.forEach(c => c.words.forEach(w => { (WORD_TO_CONCEPTS[w] = WORD_TO_CONCEPTS[w] || []).push(c); }));

  // ---------------------------------------------------------------- known areas (name, alias, centre)
  const AREAS = [
    ['Koramangala', ['kormangala', 'koramangla', 'koramangal', 'kora'], 12.9352, 77.6245],
    ['Indiranagar', ['indra nagar', 'indranagar', 'indiranagara', 'indiranager'], 12.9784, 77.6408],
    ['Jayanagar', ['jaya nagar', 'jayanagara'], 12.9308, 77.5838],
    ['JP Nagar', ['j p nagar', 'jaya prakash nagar', 'jpnagar'], 12.9063, 77.5857],
    ['BTM Layout', ['btm', 'b t m', 'btm layout'], 12.9166, 77.6101],
    ['HSR Layout', ['hsr', 'h s r', 'hsr layout'], 12.9121, 77.6446],
    ['Whitefield', ['white field', 'itpl'], 12.9698, 77.75],
    ['Marathahalli', ['marathalli', 'marathahali', 'marathahalli bridge'], 12.9591, 77.6974],
    ['Bellandur', ['bellandoor', 'belandur'], 12.926, 77.6762],
    ['Electronic City', ['electronic', 'e city', 'ecity', 'electronics city'], 12.8452, 77.6602],
    ['Malleshwaram', ['malleswaram', 'malleshwara', 'malleswara'], 13.0031, 77.5643],
    ['Rajajinagar', ['raja jinagar', 'rajaji nagar', 'rajajinagara'], 12.9982, 77.553],
    ['Basavanagudi', ['basavanagudi', 'basvanagudi', 'bull temple'], 12.9422, 77.575],
    ['Banashankari', ['banshankari', 'bsk'], 12.925, 77.565],
    ['Hebbal', ['hebal', 'hebbal flyover'], 13.0358, 77.597],
    ['Yelahanka', ['yelahanka', 'yelhanka'], 13.1007, 77.5963],
    ['Kammanahalli', ['kammanhalli', 'kalyan nagar', 'hrbr'], 13.0159, 77.6379],
    ['Majestic', ['kempegowda', 'kbs', 'city railway station'], 12.9767, 77.5713],
    ['MG Road', ['mg road', 'm g road', 'mahatma gandhi road', 'brigade road', 'church street'], 12.9756, 77.6068],
    ['Ulsoor', ['halasuru', 'ulsoor lake'], 12.9825, 77.6233],
    ['Shivajinagar', ['shivaji nagar', 'commercial street'], 12.9857, 77.6057],
    ['Vasanth Nagar', ['vasanthnagar', 'mount carmel'], 12.9922, 77.5891],
    ['Sadashivanagar', ['sadashiva nagar', 'sankey tank'], 13.0068, 77.5813],
    ['Domlur', ['domlur'], 12.9609, 77.6387],
    ['Sarjapur Road', ['sarjapur', 'sarjapura'], 12.91, 77.68],
    ['Kengeri', ['kengeri'], 12.9177, 77.4838],
    ['Mathikere', ['mathikere', 'ramaiah', 'msrit'], 13.0328, 77.5572],
    ['Banaswadi', ['banaswadi'], 13.0132, 77.6512],
    ['Frazer Town', ['frazer town', 'fraser town'], 12.9968, 77.6133],
    ['Cubbon Park', ['cubbon', 'cubon'], 12.9763, 77.5929],
    ['Lalbagh', ['lal bagh', 'lalbag'], 12.9507, 77.5848],
    ['VV Puram', ['v v puram', 'vv puram', 'vvpuram'], 12.9515, 77.5768],
    ['Nandi Hills', ['nandi hill', 'nandi'], 13.3702, 77.6835],
    ['Mysore Road', ['mysore road', 'rvce', 'rv college'], 12.91, 77.48],
  ].map(a => ({ name: a[0], aliases: a[1], lat: a[2], lng: a[3] }));

  function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // ---------------------------------------------------------------- token similarity (0..1)
  function tokenMatch(q, f) {
    if (!q || !f) return 0;
    if (q === f) return 1;
    const qs = stem(q), fs = stem(f);
    if (qs === fs) return 0.95;
    if (q.length >= 3 && f.startsWith(q)) return 0.86;
    if (f.length >= 4 && q.startsWith(f)) return 0.82;
    const qp = phonetic(q), fp = phonetic(f);
    if (q.length >= 4 && qp.length >= 3 && qp === fp) return 0.78;
    const len = Math.max(q.length, f.length);
    const allowed = len <= 3 ? 0 : len <= 5 ? 1 : len <= 9 ? 2 : 3;
    if (allowed) {
      const d = editDistance(q, f, allowed);
      if (d <= allowed) return Math.max(0.55, 0.78 - 0.1 * d);
      // typo AFTER a correct prefix ("koramangal" vs "koramangala" is handled above; "koramngala" here)
      if (len >= 6) {
        const d2 = editDistance(qp, fp, 1);
        if (qp.length >= 4 && d2 <= 1) return 0.62;
      }
    }
    if (q.length >= 4 && f.includes(q)) return 0.6;
    return 0;
  }

  // ---------------------------------------------------------------- index
  const FIELD_WEIGHTS = { name: 5, area: 4, category: 3, tags: 2.6, famous: 2.2, description: 1.3, tips: 0.9, reviews: 0.8 };
  const MAX_W = 5;

  const LABELS = { food: 'cafes restaurants food eat', nature: 'parks nature garden outdoors', attractions: 'attractions heritage sightseeing', entertainment: 'entertainment fun hangout', getaways: 'getaways day trip weekend', hotels: 'hotels stay hostel' };

  function uniq(arr) { return Array.from(new Set(arr)); }

  function priceWords(min, max) {
    const hi = Number.isFinite(max) ? max : min;
    const words = [];
    if (hi <= 60) words.push('free', 'cheap', 'budget');
    else if (hi <= 150) words.push('cheap', 'budget', 'affordable');
    else if (hi <= 300) words.push('affordable', 'budget');
    return words;
  }

  function buildDoc(p, reviewsFor) {
    const cat = String(p.category || '').toLowerCase();
    const min = Number(p.minBudget), max = Number(p.maxBudget);
    const vibes = Array.isArray(p.vibes) ? p.vibes.join(' ') : '';
    const rev = reviewsFor ? String(reviewsFor(p) || '') : '';
    // Places with a thin description (new student-added spots) still get searchable text from their category and area.
    const fields = {
      name: contentTokens(p.name),
      area: contentTokens([p.location, p.area, p.city, p.address, p.metro].filter(Boolean).join(' ')),
      category: contentTokens([cat, p.categoryLabel, LABELS[cat] || '', p.detailedCategory, p.customCategory].filter(Boolean).join(' ')),
      tags: contentTokens([vibes, p.timeOfDay, priceWords(min, max).join(' ')].join(' ')),
      famous: contentTokens([p.famousFor, p.famous, p.highlight].filter(Boolean).join(' ')),
      description: contentTokens(p.description),
      tips: contentTokens([p.studentTip, p.tip, p.bestTime].filter(Boolean).join(' ')),
      reviews: contentTokens(rev),
    };
    Object.keys(fields).forEach(k => { fields[k] = uniq(fields[k]); });
    const lat = Number(p.lat), lng = Number(p.lng);
    return {
      id: String(p.id), place: p, name: String(p.name || ''), nameNorm: normalize(p.name),
      locationNorm: normalize([p.location, p.area, p.address].filter(Boolean).join(' ')),
      category: cat, fields, min: Number.isFinite(min) ? min : 0, max: Number.isFinite(max) ? max : (Number.isFinite(min) ? min : 9999),
      rating: Number(p.rating) || 0, lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null,
      imprecise: p.locationPrecision === 'area',
    };
  }

  function buildIndex(places, opts) {
    opts = opts || {};
    const docs = (places || []).filter(p => p && p.id && p.name).map(p => buildDoc(p, opts.reviewsFor));
    return { docs, areas: AREAS, size: docs.length };
  }

  // ---------------------------------------------------------------- query intent
  const NOT_BUDGET_AFTER = /^(th|st|nd|rd|block|stage|phase|cross|main|km|kms|m|min|mins|minutes|am|pm|people|persons|friends|star|bhk)\b/;
  function parseIntent(raw) {
    let text = ' ' + String(raw || '').toLowerCase().replace(/₹/g, ' rs ').replace(/,/g, '') + ' ';
    const intent = { min: null, max: null, free: false, time: null, hasBudget: false };

    if (/^\s*(free|zero|0)\s*$/.test(text)) { intent.free = true; intent.max = 0; intent.hasBudget = true; return Object.assign(intent, { text: '' }); }

    let m;
    if ((m = text.match(/\b(?:between\s+)?(?:rs\.?|inr)?\s*(\d{2,5})\s*(?:-|to|and)\s*(?:rs\.?|inr)?\s*(\d{2,5})\b/))) {
      const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
      intent.min = Math.min(a, b); intent.max = Math.max(a, b); intent.hasBudget = true; text = text.replace(m[0], ' ');
    } else if ((m = text.match(/\b(?:under|below|less than|within|upto|up to|max|maximum|budget|cost|price|around|about)\s*(?:of\s*)?(?:rs\.?|inr)?\s*(\d{2,5})\b/)) || (m = text.match(/<=?\s*(?:rs\.?|inr)?\s*(\d{2,5})\b/))) {
      intent.max = parseInt(m[1], 10); intent.hasBudget = true; text = text.replace(m[0], ' ');
    } else if ((m = text.match(/\b(?:above|over|more than|greater than|min|minimum|from)\s*(?:rs\.?|inr)?\s*(\d{2,5})\b/)) || (m = text.match(/>=?\s*(?:rs\.?|inr)?\s*(\d{2,5})\b/))) {
      intent.min = parseInt(m[1], 10); intent.hasBudget = true; text = text.replace(m[0], ' ');
    } else if ((m = text.match(/\b(?:rs\.?|inr)\s*(\d{2,5})\b/)) || (m = text.match(/\b(\d{2,5})\s*(?:rs\.?|inr|rupees?|bucks)\b/))) {
      intent.max = parseInt(m[1], 10); intent.hasBudget = true; text = text.replace(m[0], ' ');
    } else if ((m = text.match(/^\s*(\d{2,5})\s*$/))) {
      intent.max = parseInt(m[1], 10); intent.hasBudget = true; text = ' ';
    } else {
      // a bare number inside words ("food 300") is a budget, but "5th block", "100 ft road" or "2 km" are not
      const re = /(?:^|\s)(\d{2,5})(?=\s|$)(?:\s+(\w+))?/g;
      let mm;
      while ((mm = re.exec(text))) {
        if (mm[2] && NOT_BUDGET_AFTER.test(mm[2])) continue;
        if (/\b(ft|feet)\b/.test(mm[2] || '')) continue;
        intent.max = parseInt(mm[1], 10); intent.hasBudget = true; text = text.replace(mm[1], ' ');
        break;
      }
    }

    if (/\b(free|no\s*entry\s*fee|zero\s*cost)\b/.test(text) && !intent.hasBudget) { intent.free = true; intent.max = 0; intent.hasBudget = true; }
    const lower = String(raw || '').toLowerCase();
    if (/\b(sunrise|dawn|early\s*morning|morning\s*walk)\b/.test(lower)) intent.time = 'morning';
    else if (/\b(late\s*night|nightlife|night\s*life|night\s*out|open\s*late)\b/.test(lower)) intent.time = 'night';

    intent.text = text.replace(/\b(rs|inr|rupees?|budget|under|below|within|upto|up to|bucks)\b/g, ' ').replace(/\s+/g, ' ').trim();
    return intent;
  }

  // ---------------------------------------------------------------- area detection
  function detectArea(qTokens) {
    let best = null;
    for (let n = Math.min(3, qTokens.length); n >= 1; n--) {
      for (let i = 0; i + n <= qTokens.length; i++) {
        const gram = qTokens.slice(i, i + n);
        const gramStr = gram.join(' ');
        for (const area of AREAS) {
          const names = [area.name].concat(area.aliases);
          for (const nm of names) {
            const nt = normalize(nm).split(' ').filter(Boolean);
            let score = 0;
            if (nt.length === gram.length) {
              let total = 0, ok = true;
              for (let k = 0; k < nt.length; k++) {
                const m = tokenMatch(gram[k], nt[k]);
                if (m < 0.75 || (nt[k].length <= 3 && m < 1)) { ok = false; break; }
                total += m;
              }
              if (ok) score = total / nt.length;
            } else if (n === 1 && nt.length === 2) {
              // "indiranagar" typed as one word vs the two-word name "indira nagar"
              const joined = nt.join('');
              if (gramStr.length >= joined.length - 2 && gramStr.length >= 6 && editDistance(gramStr, joined, 2) <= 2) score = 0.85;
            }
            if (score > 0 && (!best || score + n * 0.01 > best.score)) best = { area, score: score + n * 0.01, start: i, len: n };
          }
        }
      }
      if (best && best.score >= 0.75) break;
    }
    return best && best.score >= 0.75 ? best : null;
  }

  // ---------------------------------------------------------------- scoring
  function bestFieldMatch(qt, doc) {
    let best = 0, field = '';
    for (const f of Object.keys(FIELD_WEIGHTS)) {
      const arr = doc.fields[f];
      for (let i = 0; i < arr.length; i++) {
        const m = tokenMatch(qt, arr[i]);
        if (m > 0) {
          const v = m * FIELD_WEIGHTS[f];
          if (v > best) { best = v; field = f; }
        }
      }
    }
    return { v: best, field };
  }

  function conceptMatch(qt, doc) {
    const concepts = WORD_TO_CONCEPTS[qt] || WORD_TO_CONCEPTS[stem(qt)];
    if (!concepts) return { v: 0, field: '', via: '' };
    let best = 0, field = '', via = '';
    for (const c of concepts) {
      if (c.category && doc.category === c.category) {
        const v = 0.7 * FIELD_WEIGHTS.category;
        if (v > best) { best = v; field = 'category'; via = c.id; }
      }
      for (const f of ['tags', 'description', 'famous', 'tips', 'name', 'reviews', 'category']) {
        const arr = doc.fields[f];
        for (const w of c.words) {
          if (w === qt) continue;
          if (arr.indexOf(w) >= 0 || arr.indexOf(stem(w)) >= 0 || arr.some(x => stem(x) === stem(w))) {
            const v = 0.62 * FIELD_WEIGHTS[f];
            if (v > best) { best = v; field = f; via = w; }
          }
        }
      }
    }
    return { v: best, field, via };
  }

  function search(query, index, opts) {
    opts = opts || {};
    const intent = parseIntent(query);
    const out = { query: String(query || ''), intent, area: null, results: [], exact: 0, similar: 0, nearestFallback: false, didYouMean: null, tokens: [] };
    const docs = index.docs;
    let qTokens = contentTokens(intent.text);

    const areaHit = qTokens.length ? detectArea(qTokens) : null;
    if (areaHit) {
      out.area = { name: areaHit.area.name, lat: areaHit.area.lat, lng: areaHit.area.lng, matchedAs: qTokens.slice(areaHit.start, areaHit.start + areaHit.len).join(' ') };
      qTokens = qTokens.slice(0, areaHit.start).concat(qTokens.slice(areaHit.start + areaHit.len));
    }
    out.tokens = qTokens;

    // Does a short query look like it names a place directly? (used for name-first ranking)
    const qNorm = normalize(intent.text);

    // idf weights
    const N = Math.max(1, docs.length);
    const df = {};
    qTokens.forEach(t => {
      let c = 0;
      docs.forEach(d => { if (bestFieldMatch(t, d).v >= 0.75 * 1.3) c++; });
      df[t] = c;
    });

    const scored = [];
    for (const d of docs) {
      const reasons = [];
      let coverage = 1, nameBonus = 0, bestRaw = 0, strongTokens = 0;
      if (qTokens.length) {
        let num = 0, den = 0;
        for (const t of qTokens) {
          const direct = bestFieldMatch(t, d);
          const concept = conceptMatch(t, d);
          const pick = direct.v >= concept.v ? direct : concept;
          const s = Math.sqrt(Math.min(1, pick.v / MAX_W)); // soft curve: a description hit still counts, a name hit counts most
          const idf = Math.log(1 + N / (1 + (df[t] || 0)));
          num += s * idf; den += idf;
          bestRaw = Math.max(bestRaw, pick.v);
          if (pick.v >= 2.6) strongTokens++;
          if (pick.v > 0) {
            if (pick === direct) reasons.push(pick.field === 'name' ? 'Name' : pick.field === 'area' ? 'Area' : pick.field === 'description' ? 'Description' : pick.field === 'category' ? 'Category' : 'Details');
            else reasons.push('Similar to “' + concept.via + '”');
          }
        }
        coverage = den ? num / den : 0;
        if (qNorm && d.nameNorm === qNorm) nameBonus = 60;
        else if (qNorm && d.nameNorm.startsWith(qNorm)) nameBonus = 40;
        else if (qNorm && d.nameNorm.includes(qNorm)) nameBonus = 28;
        else if (qNorm.length >= 4) {
          const dist = editDistance(qNorm, d.nameNorm.slice(0, qNorm.length + 2), 2);
          if (dist <= 2 && qNorm.length >= 6) nameBonus = 18;
        }
      }
      // threshold: a single-word query must match a field reasonably; longer queries may match partially
      const minCoverage = qTokens.length <= 1 ? 0.25 : qTokens.length === 2 ? 0.4 : 0.42;
      let dist = null;
      if (out.area && d.lat != null) dist = haversineKm(out.area.lat, out.area.lng, d.lat, d.lng);

      let inArea = false;
      if (out.area) {
        const an = normalize(out.area.name);
        inArea = d.locationNorm.includes(an) || d.nameNorm.includes(an) ||
          (areaHit.area.aliases || []).some(al => d.locationNorm.includes(normalize(al)));
        if (!inArea && dist != null) {
          const radius = d.imprecise ? 3.5 : 2.2;
          if (dist <= radius) inArea = true;
        }
      }

      let include;
      if (!qTokens.length) include = out.area ? inArea : true; // area-only or empty
      else if (out.area) include = coverage >= minCoverage * 0.8 && (inArea || (dist != null && dist <= 6));
      else include = coverage >= minCoverage || nameBonus > 0;
      if (!include) continue;

      let score = coverage * 100 + nameBonus + d.rating * 1.5;
      if (out.area) {
        if (inArea) { score += 30; reasons.unshift('In ' + out.area.name); }
        if (dist != null) score += Math.max(0, 25 - dist * 4);
      }
      const exact = qTokens.length ? (coverage >= 0.8 || nameBonus >= 28) : true;
      scored.push({ id: d.id, score, coverage, exact, distKm: dist, inArea, reasons: uniq(reasons).slice(0, 3), imprecise: d.imprecise });
    }

    // Budget / time constraints are applied by the caller-visible card data
    const filtered = scored.filter(r => {
      const d = docs.find(x => x.id === r.id);
      if (intent.hasBudget) {
        if (intent.free) { if (d.min > 0) return false; }
        else if (intent.min != null && intent.max != null) { if (!(d.min <= intent.max && d.max >= intent.min)) return false; }
        else if (intent.max != null) { if (d.min > intent.max) return false; }
        else if (intent.min != null) { if (d.max < intent.min) return false; }
      }
      return true;
    });

    // nothing in the named area: offer the nearest places instead of an empty screen
    if (out.area && !filtered.length && !intent.hasBudget) {
      const near = docs.filter(d => d.lat != null).map(d => ({ d, dist: haversineKm(out.area.lat, out.area.lng, d.lat, d.lng) }))
        .sort((a, b) => a.dist - b.dist).slice(0, 6);
      near.forEach(n => filtered.push({ id: n.d.id, score: 10 - n.dist, coverage: 0, exact: false, distKm: n.dist, inArea: false, reasons: ['Nearest to ' + out.area.name], imprecise: n.d.imprecise }));
      out.nearestFallback = near.length > 0;
    }

    filtered.sort((a, b) => {
      if (out.area && !qTokens.length) {
        if (a.inArea !== b.inArea) return a.inArea ? -1 : 1;
        return (a.distKm == null ? 99 : a.distKm) - (b.distKm == null ? 99 : b.distKm);
      }
      return b.score - a.score;
    });
    out.results = filtered;
    out.exact = filtered.filter(r => r.exact).length;
    out.similar = filtered.length - out.exact;

    if (!filtered.length && qNorm) out.didYouMean = didYouMean(qNorm, index);
    return out;
  }

  function didYouMean(qNorm, index) {
    let best = null;
    const cands = [];
    index.docs.forEach(d => cands.push({ label: d.name, norm: d.nameNorm, kind: 'place', id: d.id }));
    AREAS.forEach(a => cands.push({ label: a.name, norm: normalize(a.name), kind: 'area' }));
    for (const c of cands) {
      const sim = fieldSimilarity(qNorm, c.norm);
      if (sim >= 0.5 && (!best || sim > best.sim)) best = { label: c.label, kind: c.kind, id: c.id, sim };
    }
    return best;
  }

  function fieldSimilarity(q, target) {
    if (!q || !target) return 0;
    if (target.includes(q)) return 0.9;
    const qt = q.split(' '), tt = target.split(' ');
    let sum = 0;
    qt.forEach(t => { let b = 0; tt.forEach(x => { b = Math.max(b, tokenMatch(t, x)); }); sum += b; });
    return sum / qt.length;
  }

  // ---------------------------------------------------------------- autocomplete suggestions
  function suggest(query, index, opts) {
    opts = opts || {};
    const limit = opts.limit || 8;
    const q = normalize(query);
    const out = [];
    if (!q) return out;
    const qt = contentTokens(query);
    if (!qt.length) return out;
    const last = qt[qt.length - 1];

    // areas
    const areaHit = detectArea(qt) || (last.length >= 2 ? detectPartialArea(last) : null);
    if (areaHit) {
      const a = areaHit.area;
      const count = index.docs.filter(d => d.locationNorm.includes(normalize(a.name)) || (d.lat != null && haversineKm(a.lat, a.lng, d.lat, d.lng) <= 2.2)).length;
      out.push({ type: 'area', label: a.name, sub: count ? count + (count === 1 ? ' place' : ' places') + ' in & around' : 'No places yet — be the first to add one', query: a.name, score: 90 + areaHit.score });
    }

    // places
    for (const d of index.docs) {
      let s = 0;
      if (d.nameNorm.startsWith(q)) s = 100;
      else if (d.nameNorm.includes(q)) s = 80;
      else {
        let tot = 0, ok = true;
        for (const t of qt) {
          let b = 0;
          d.fields.name.forEach(x => { b = Math.max(b, tokenMatch(t, x)); });
          d.fields.area.forEach(x => { b = Math.max(b, tokenMatch(t, x) * 0.8); });
          if (b < 0.6) { ok = false; break; }
          tot += b;
        }
        if (ok) s = 40 + 40 * (tot / qt.length);
      }
      if (s > 0) {
        const price = d.max > 0 ? (d.min === d.max ? '₹' + d.max : '₹' + d.min + '–₹' + d.max) : 'Free';
        out.push({ type: 'place', id: d.id, label: d.name, sub: [d.place.location || d.place.area, price].filter(Boolean).join(' · '), query: d.name, category: d.category, score: s + d.rating });
      }
    }

    // categories / concepts / budgets
    const concepts = WORD_TO_CONCEPTS[last] || WORD_TO_CONCEPTS[stem(last)];
    if (concepts && out.length < limit) {
      const c = concepts[0];
      const label = { food: 'Cafes & food', nature: 'Parks & nature', heritage: 'Heritage & sights', fun: 'Fun & hangouts', stay: 'Stays', getaway: 'Day trips & getaways', study: 'Quiet study spots', cheap: 'Budget friendly places', romantic: 'Date-worthy views', morning: 'Sunrise & morning', night: 'Late-night spots', group: 'Squad hangouts' }[c.id];
      if (label) out.push({ type: 'topic', label: label, sub: 'Similar places by description', query: query.trim(), score: 30 });
    }
    const num = q.match(/^(\d{2,5})$/);
    if (num) out.push({ type: 'budget', label: 'Places within ₹' + num[1] + ' per person', sub: 'Budget search', query: 'under ' + num[1], score: 50 });

    out.sort((a, b) => b.score - a.score);
    const seen = new Set();
    return out.filter(s => { const k = s.type + ':' + (s.id || s.label); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, limit);
  }

  function detectPartialArea(token) {
    if (token.length < 3) return null;
    let best = null;
    for (const area of AREAS) {
      for (const nm of [area.name].concat(area.aliases)) {
        const n = normalize(nm);
        if (n.startsWith(token)) { const sc = 0.78 + Math.min(0.2, token.length / n.length * 0.2); if (!best || sc > best.score) best = { area, score: sc }; }
      }
    }
    return best;
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  /** Safe HTML with the matching part of `text` wrapped in <mark>. */
  function highlight(text, query) {
    const src = String(text || '');
    const qs = contentTokens(query).filter(t => t.length >= 2);
    if (!qs.length) return escapeHtml(src);
    const lower = src.toLowerCase();
    const ranges = [];
    qs.forEach(t => {
      let from = 0, pos;
      while ((pos = lower.indexOf(t, from)) >= 0) { ranges.push([pos, pos + t.length]); from = pos + t.length; }
    });
    if (!ranges.length) return escapeHtml(src);
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    ranges.forEach(r => { const last = merged[merged.length - 1]; if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push(r.slice()); });
    let html = '', cur = 0;
    merged.forEach(([s, e]) => { html += escapeHtml(src.slice(cur, s)) + '<mark>' + escapeHtml(src.slice(s, e)) + '</mark>'; cur = e; });
    return html + escapeHtml(src.slice(cur));
  }

  const api = { normalize, phonetic, editDistance, tokenMatch, parseIntent, detectArea, buildIndex, search, suggest, highlight, haversineKm, AREAS, CONCEPTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SESearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
