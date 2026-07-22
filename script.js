'use strict';

// ═══════════════════════════════════════════════════
//  MOTHER NATURE SAFARIS — Complete JavaScript
//  Works 100% on GitHub Pages — no backend needed
// ═══════════════════════════════════════════════════

// ── IMAGE HELPER ──────────────────────────────────
// All photos are pulled LIVE from your GitHub repo's "Images" folder:
// https://github.com/Big-Dario/Mature-safaris  (branch: main, folder: Images)
//
// HOW TO ADD YOUR OWN PHOTOS FROM NOW ON:
// 1. Upload your image file to the "Images" folder in the Big-Dario/Mature-safaris
//    GitHub repo (via github.com, drag-and-drop works fine).
// 2. That's it. You do NOT need to rename the file to some exact filename and
//    you do NOT need to touch this script. On page load, the site asks GitHub
//    what files exist in the Images folder, then automatically matches each
//    destination/package to the best-fitting file by comparing meaningful words
//    in the filename (e.g. "IMG_maasai_mara_sunset.jpg" will be matched to the
//    "Maasai Mara National Reserve" entry). Exact filename matches (like the
//    ones suggested in comments below) always win first if present.
// 3. If nothing matches well for a given entry, it simply falls back to the
//    emoji placeholder — the site never looks broken either way.
// NOTE: matching happens once per page load via a live call to the GitHub API
// (unauthenticated, ~60 requests/hour/IP limit). If that call fails or is slow,
// the site automatically falls back to exact-filename-only behavior after a
// short timeout, so the site still works even if GitHub's API is unreachable.

var IMAGE_BASE = 'https://raw.githubusercontent.com/Big-Dario/Mature-safaris/main/Images/';
var IMAGE_FOLDER_API = 'https://api.github.com/repos/Big-Dario/Mature-safaris/contents/Images?ref=main';

// ── BOOKING FORM BACKEND ───────────────────────────
// The booking form on this site submits here via Formspree (formspree.io) —
// a free service that turns form submissions into emails sent to you, since
// GitHub Pages can't run a real backend on its own.
// TO SET THIS UP: sign up at formspree.io, create a new form, and paste the
// endpoint URL it gives you below (looks like "https://formspree.io/f/xxxxxxxx").
var BOOKING_FORM_ENDPOINT = 'https://formspree.io/f/mvzebpzr';

// Turns a bare filename ("kenya.jpg") into the full GitHub raw URL.
// You only ever type the filename anywhere in this file — this function
// does the rest.
function img(filename){
  if (!filename) return '';
  // Allow full URLs to still work if someone pastes one directly
  if (/^https?:\/\//i.test(filename)) return filename;
  return IMAGE_BASE + filename;
}

function imgOrEmoji(filename, emoji, extraClass){
  extraClass = extraClass || '';
  var resolved = resolvedImage(filename);
  var src = img(resolved);
  return '<img src="'+src+'" alt="" loading="lazy" class="'+extraClass+'" '+
    'onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'fallback-emoji\',textContent:\'' + emoji + '\'}))">';
}

// Testimonial avatars fall back to initials (not an emoji) if no photo is added
function imgOrEmojiInitials(filename, initials){
  var resolved = resolvedImage(filename);
  var src = img(resolved);
  return '<img src="'+src+'" alt="" loading="lazy" '+
    'onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{textContent:\'' + initials + '\'}))">';
}

// ── AUTO IMAGE MATCHING ────────────────────────────
// This is what lets you drop ANY reasonably-named image file into the
// Images/ folder without editing this script or renaming to an exact filename.

var _resolvedImageCache = {};

// Generic words that appear in lots of names/filenames and would otherwise
// cause false matches (e.g. every Kenya package would "match" any file with
// the word "kenya" in it). Stripping these out before scoring keeps matches
// focused on the actually distinctive words (e.g. "maasai", "mara", "tsavo").
var IMAGE_STOPWORDS = ['national','park','reserve','conservancy','conservation','sanctuary',
  'safari','safaris','tour','tours','trek','trekking','kenya','tanzania','uganda','rwanda',
  'zanzibar','archipelago','island','islands','the','of','and','area','region','classic',
  'explorer','discovery','adventure','circuit','express','expedition','experience','retreat',
  'highlights','special','grand','ultimate','best','complete','journey','trail','specialist'];

function normalizeStr(str){
  return String(str || '')
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/,'')      // strip file extension
    .replace(/[^a-z0-9]+/g,' ')          // strip punctuation/underscores/hyphens
    .trim();
}

function keyTokens(key){
  var all = normalizeStr(key).split(' ').filter(function(t){ return t.length > 1; });
  var meaningful = all.filter(function(t){ return IMAGE_STOPWORDS.indexOf(t) === -1; });
  return meaningful.length ? meaningful : all; // don't end up with zero tokens
}

function collectAllImageKeys(){
  var keys = ['logo.png','hero-background.jpg','about-photo.jpg'].concat(HERO_SLIDESHOW_IMAGES);
  [DESTINATIONS,KENYA_DESTINATIONS,TANZANIA_DESTINATIONS,UGANDA_DESTINATIONS,ZANZIBAR_DESTINATIONS,RWANDA_DESTINATIONS].forEach(function(arr){
    arr.forEach(function(d){ if (d.image) keys.push(d.image); });
  });
  PACKAGES.forEach(function(p){ if (p.image) keys.push(p.image); });
  GALLERY_ITEMS.forEach(function(g){ if (g.image) keys.push(g.image); });
  TESTIMONIALS.forEach(function(t){ if (t.image) keys.push(t.image); });
  return keys;
}

// Fetches the live list of filenames actually sitting in the Images/ folder
// on GitHub. Resolves to [] (not a rejection) on any failure, so callers
// never need a .catch — the site just falls back to old exact-match behavior.
// Cached in sessionStorage for 10 minutes so reloading/navigating during a
// visit doesn't re-hit GitHub's API (helps with its 60-req/hour rate limit
// and speeds up repeat loads within the same browser tab).
var IMAGE_LIST_CACHE_KEY = 'mns_image_list_cache_v1';
var IMAGE_LIST_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function loadImageFileList(){
  try {
    var cached = sessionStorage.getItem(IMAGE_LIST_CACHE_KEY);
    if (cached){
      var parsed = JSON.parse(cached);
      if (parsed && (Date.now() - parsed.time) < IMAGE_LIST_CACHE_TTL_MS){
        return Promise.resolve(parsed.files);
      }
    }
  } catch (e) { /* sessionStorage unavailable (private mode, etc.) — just skip caching */ }

  return fetch(IMAGE_FOLDER_API)
    .then(function(res){
      if (!res.ok) throw new Error('Images folder listing failed: ' + res.status);
      return res.json();
    })
    .then(function(data){
      var files = data.filter(function(item){ return item.type === 'file'; })
                       .map(function(item){ return item.name; });
      try {
        sessionStorage.setItem(IMAGE_LIST_CACHE_KEY, JSON.stringify({ time: Date.now(), files: files }));
      } catch (e) { /* storage full or unavailable — non-fatal, just skip caching */ }
      return files;
    })
    .catch(function(err){
      console.warn('Mother Nature Safaris: could not auto-list the Images folder — falling back to exact filename matching only.', err);
      return [];
    });
}

// Builds the key → actual-filename map used by resolvedImage() below.
// keys are the filenames already written into the data arrays (e.g.
// "maasai-mara-national-reserve.jpg") — these now act as descriptive
// labels/hints rather than literal required filenames.
function resolveAllImages(fileList){
  if (!fileList || !fileList.length) return; // leave cache empty → old behavior
  var keys = collectAllImageKeys();
  var remainingFiles = fileList.slice();
  var pairs = [];

  keys.forEach(function(key){
    // An exact filename match (case-insensitive) always wins outright and
    // is claimed immediately so it can't be reused elsewhere.
    var exactIdx = -1;
    for (var i = 0; i < remainingFiles.length; i++){
      if (remainingFiles[i].toLowerCase() === key.toLowerCase()){ exactIdx = i; break; }
    }
    if (exactIdx !== -1){
      _resolvedImageCache[key] = remainingFiles[exactIdx];
      remainingFiles.splice(exactIdx, 1);
      return;
    }
    var tokens = keyTokens(key);
    remainingFiles.forEach(function(file){
      var norm = normalizeStr(file);
      var score = tokens.reduce(function(acc, t){ return acc + (norm.indexOf(t) !== -1 ? 1 : 0); }, 0);
      if (score > 0) pairs.push({ key: key, file: file, score: score, need: tokens.length });
    });
  });

  // Greedy best-match-first assignment. Require at least half of a key's
  // meaningful words to appear in the filename, so a loosely-related file
  // doesn't get grabbed by an entry it doesn't really belong to.
  pairs.sort(function(a, b){ return b.score - a.score; });
  var usedFiles = {};
  pairs.forEach(function(p){
    if (_resolvedImageCache[p.key] || usedFiles[p.file]) return;
    if (p.score < Math.max(1, Math.ceil(p.need / 2))) return;
    _resolvedImageCache[p.key] = p.file;
    usedFiles[p.file] = true;
  });
}

// What imgOrEmoji()/imgOrEmojiInitials() actually load. Falls back to the
// original key unchanged if no better match was found (or the folder
// listing never loaded) — identical to the site's old behavior.
function resolvedImage(key){
  if (!key) return key;
  return _resolvedImageCache[key] || key;
}

// ── DATA ─────────────────────────────────────────
// Hero background slideshow — add more filenames here any time (no limit).
// Upload photos whose names contain words like "hero", "safari", "sunset",
// "savanna" etc. and the auto-matcher will slot them in. These three are
// just suggested starting names; exact filenames aren't required.
var HERO_SLIDESHOW_IMAGES = [
  'hero-background-1.jpg',
  'hero-background-2.jpg',
  'hero-background-3.jpg'
];

// image: just the filename — upload it to the Images/ folder on GitHub
var DESTINATIONS = [
  { id:'kenya',    name:'Kenya',    emoji:'🦁', flag:'🇰🇪', tag:'Maasai Mara · Amboseli · Tsavo', count:'15+ packages', color:'#2C1810', image:'kenya.jpg' },
  { id:'tanzania', name:'Tanzania', emoji:'🐘', flag:'🇹🇿', tag:'Serengeti · Ngorongoro · Kilimanjaro', count:'12+ packages', color:'#1e3a1e', image:'tanzania.jpg' },
  { id:'uganda',   name:'Uganda',   emoji:'🦍', flag:'🇺🇬', tag:'Gorilla Trekking · Bwindi · Murchison', count:'8+ packages', color:'#3a2a0a', image:'uganda.jpg' },
  { id:'zanzibar', name:'Zanzibar', emoji:'🏖️', flag:'🇹🇿', tag:'Spice Tours · Beach Retreats · Snorkelling', count:'6+ packages', color:'#0a2a3a', image:'zanzibar.jpg' },
  { id:'rwanda', name:'Rwanda', emoji:'🦍', flag:'🇷🇼', tag:'Volcanoes NP · Gorilla Trekking · Lake Kivu', count:'4+ packages', color:'#1A3D00', image:'rwanda.jpg' },
];

// Named destinations within Kenya — same brief-intro format as the other countries.
// image: just the filename — upload it to the Images/ folder on GitHub
var KENYA_DESTINATIONS = [
  { id:'maasai-mara', name:'Maasai Mara National Reserve', emoji:'🦁', flag:'🇰🇪', tag:'Great Migration epicentre · Big cat capital', count:'Migration Icon', color:'#3a2a0a', image:'maasai-mara-national-reserve.jpg' },
  { id:'amboseli-np', name:'Amboseli National Park', emoji:'🐘', flag:'🇰🇪', tag:'Iconic elephant herds · Kilimanjaro views', count:'Elephant Capital', color:'#2C1810', image:'amboseli-national-park.jpg' },
  { id:'tsavo-east', name:'Tsavo East National Park', emoji:'🐆', flag:'🇰🇪', tag:'Red-dust wilderness · Famous red elephants', count:"Kenya's Largest Park", color:'#3D2E00', image:'tsavo-east-national-park.jpg' },
  { id:'tsavo-west', name:'Tsavo West National Park', emoji:'🌋', flag:'🇰🇪', tag:'Volcanic landscapes · Mzima Springs & lava flows', count:'Scenic & Rugged', color:'#2E1A00', image:'tsavo-west-national-park.jpg' },
  { id:'lake-nakuru', name:'Lake Nakuru National Park', emoji:'🦩', flag:'🇰🇪', tag:'Flamingo-fringed soda lake · Black & white rhino', count:'Rhino Sanctuary', color:'#1A1A2E', image:'lake-nakuru-national-park.jpg' },
  { id:'lake-naivasha-dest', name:'Lake Naivasha', emoji:'🦛', flag:'🇰🇪', tag:'Hippos & fish eagles · Crescent Island walks', count:'Freshwater Escape', color:'#0a2a3a', image:'lake-naivasha.jpg' },
  { id:'samburu-np', name:'Samburu National Reserve', emoji:'🦓', flag:'🇰🇪', tag:'Rugged northern frontier · The Samburu Special Five', count:'Northern Specials', color:'#3a2a0a', image:'samburu-national-reserve.jpg' },
  { id:'ol-pejeta', name:'Ol Pejeta Conservancy', emoji:'🦏', flag:'🇰🇪', tag:'Private rhino sanctuary · Big Five conservancy', count:'Rhino Sanctuary', color:'#2C1810', image:'ol-pejeta-conservancy.jpg' },
  { id:'aberdare', name:'Aberdare National Park', emoji:'🌲', flag:'🇰🇪', tag:'Highland cloud forest · Waterfalls & rare wildlife', count:'Highland Wilderness', color:'#1A2E1A', image:'aberdare-national-park.jpg' },
  { id:'mount-kenya', name:'Mount Kenya National Park', emoji:'⛰️', flag:'🇰🇪', tag:"Africa's second-highest peak · UNESCO alpine trekking", count:'Iconic Summit', color:'#2E1A00', image:'mount-kenya-national-park.jpg' },
  { id:'diani', name:'Diani Beach', emoji:'🏖️', flag:'🇰🇪', tag:'Palm-lined white sand · Indian Ocean coastline', count:'Coastal Escape', color:'#00203D', image:'diani-beach.jpg' },
  { id:'lake-bogoria-dest', name:'Lake Bogoria', emoji:'♨️', flag:'🇰🇪', tag:'Steaming hot springs · Dramatic flamingo flocks', count:'Off the Beaten Path', color:'#1A1A2E', image:'lake-bogoria.jpg' },
];

// Named destinations within Tanzania — each gets a brief one-line introduction,
// the same way the top-level country cards above do.
// image: just the filename — upload it to the Images/ folder on GitHub
var TANZANIA_DESTINATIONS = [
  { id:'serengeti', name:'Serengeti National Park', emoji:'🦓', flag:'🇹🇿', tag:'Endless plains · The Great Migration · Big Cats', count:'Migration Icon', color:'#3a2a0a', image:'serengeti-national-park.jpg' },
  { id:'ngorongoro', name:'Ngorongoro Crater', emoji:'🦏', flag:'🇹🇿', tag:'Volcanic caldera · Black rhino · Big Five', count:'UNESCO World Heritage', color:'#2C1810', image:'ngorongoro-crater.jpg' },
  { id:'tarangire', name:'Tarangire National Park', emoji:'🐘', flag:'🇹🇿', tag:'Ancient baobabs · Huge elephant herds', count:'Elephant Capital', color:'#1e3a1e', image:'tarangire-national-park.jpg' },
  { id:'manyara', name:'Lake Manyara National Park', emoji:'🦁', flag:'🇹🇿', tag:'Tree-climbing lions · Flamingo shores', count:'Compact & Scenic', color:'#0a2a3a', image:'lake-manyara-national-park.jpg' },
  { id:'ruaha', name:'Ruaha National Park', emoji:'🐆', flag:'🇹🇿', tag:'Baobab wilderness · Lion & wild dog', count:'Tanzania\'s Largest Park', color:'#3a2a0a', image:'ruaha-national-park.jpg' },
  { id:'nyerere', name:'Nyerere National Park (Selous)', emoji:'🚤', flag:'🇹🇿', tag:'Rufiji River · Boat & walking safaris', count:'Vast Wilderness', color:'#1A2E1A', image:'nyerere-national-park.jpg' },
  { id:'zanzibar-tz', name:'Zanzibar Archipelago', emoji:'🏝️', flag:'🇹🇿', tag:'Spice islands · Stone Town · Coral reefs', count:'Beach Escape', color:'#00203D', image:'zanzibar-archipelago.jpg' },
  { id:'kilimanjaro', name:'Mount Kilimanjaro', emoji:'🏔️', flag:'🇹🇿', tag:'Africa\'s highest peak · Trekking', count:'Iconic Summit', color:'#2E1A00', image:'mount-kilimanjaro.jpg' },
  { id:'arusha-np', name:'Arusha National Park', emoji:'🦒', flag:'🇹🇿', tag:'Mount Meru · Giraffe & colobus monkeys', count:'Hidden Gem', color:'#3D2E00', image:'arusha-national-park.jpg' },
  { id:'natron', name:'Lake Natron', emoji:'🦩', flag:'🇹🇿', tag:'Soda lake · Lesser flamingo breeding ground', count:'Remote & Dramatic', color:'#1A1A2E', image:'lake-natron.jpg' },
  { id:'katavi', name:'Katavi National Park', emoji:'🦛', flag:'🇹🇿', tag:'Remote wilderness · Huge hippo pods', count:'Off the Beaten Path', color:'#1A1A1A', image:'katavi-national-park.jpg' },
  { id:'mahale', name:'Mahale Mountains National Park', emoji:'🐒', flag:'🇹🇿', tag:'Lake Tanganyika · Wild chimpanzees', count:'Chimp Trekking', color:'#1e3a1e', image:'mahale-mountains-national-park.jpg' },
];

// Named destinations within Uganda — same brief-intro format as the Tanzania list above.
// image: just the filename — upload it to the Images/ folder on GitHub
var UGANDA_DESTINATIONS = [
  { id:'bwindi', name:'Bwindi Impenetrable Forest', emoji:'🦍', flag:'🇺🇬', tag:'Mountain gorilla trekking · Dense rainforest', count:'Gorilla Icon', color:'#1A3D00', image:'bwindi-impenetrable-forest.jpg' },
  { id:'queen-elizabeth', name:'Queen Elizabeth National Park', emoji:'🦛', flag:'🇺🇬', tag:'Kazinga Channel · Tree-climbing lions', count:'Boat Safari Hub', color:'#1e3a1e', image:'queen-elizabeth-national-park.jpg' },
  { id:'murchison-falls', name:'Murchison Falls National Park', emoji:'💦', flag:'🇺🇬', tag:'The Nile\'s most powerful falls · Elephants & lions', count:'Nile Adventure', color:'#0a2a3a', image:'murchison-falls-national-park.jpg' },
  { id:'kibale', name:'Kibale Forest National Park', emoji:'🐒', flag:'🇺🇬', tag:'Premier chimpanzee trekking · 13 primate species', count:'Primate Capital', color:'#1A2E1A', image:'kibale-forest-national-park.jpg' },
  { id:'lake-mburo', name:'Lake Mburo National Park', emoji:'🦓', flag:'🇺🇬', tag:'Compact savanna · Zebra, eland & walking safaris', count:'Hidden Gem', color:'#3a2a0a', image:'lake-mburo-national-park.jpg' },
  { id:'semuliki', name:'Semuliki National Park', emoji:'🦜', flag:'🇺🇬', tag:'Lowland rainforest · Hot springs & rare birdlife', count:'Off the Beaten Path', color:'#1A2E1A', image:'semuliki-national-park.jpg' },
  { id:'mount-elgon', name:'Mount Elgon National Park', emoji:'⛰️', flag:'🇺🇬', tag:'Extinct volcano · Caves, cliffs & waterfalls', count:'Hiking & Trekking', color:'#3D2E00', image:'mount-elgon-national-park.jpg' },
  { id:'rwenzori', name:'Rwenzori Mountains National Park', emoji:'🏔️', flag:'🇺🇬', tag:'"Mountains of the Moon" · Glaciers & UNESCO site', count:'Alpine Wilderness', color:'#2E1A00', image:'rwenzori-mountains-national-park.jpg' },
  { id:'ziwa', name:'Ziwa Rhino Sanctuary', emoji:'🦏', flag:'🇺🇬', tag:'Uganda\'s only wild rhinos · On-foot tracking', count:'Rhino Sanctuary', color:'#2C1810', image:'ziwa-rhino-sanctuary.jpg' },
  { id:'kidepo', name:'Kidepo Valley National Park', emoji:'🦁', flag:'🇺🇬', tag:'Remote wilderness · Ostrich, cheetah & dramatic scenery', count:'Off the Beaten Path', color:'#3a2a0a', image:'kidepo-valley-national-park.jpg' },
  { id:'mgahinga', name:'Mgahinga Gorilla National Park', emoji:'🐵', flag:'🇺🇬', tag:'Golden monkey trekking · Volcanic peaks', count:'Volcanic Wilderness', color:'#1A3D00', image:'mgahinga-gorilla-national-park.jpg' },
  { id:'bunyonyi', name:'Lake Bunyonyi', emoji:'🚣', flag:'🇺🇬', tag:'"Switzerland of Africa" · Crater lakes & canoeing', count:'Scenic Escape', color:'#1A1A2E', image:'lake-bunyonyi.jpg' },
];

// Named destinations within Zanzibar — same brief-intro format as above.
// image: just the filename — upload it to the Images/ folder on GitHub
var ZANZIBAR_DESTINATIONS = [
  { id:'stone-town', name:'Stone Town', emoji:'🕌', flag:'🇹🇿', tag:'UNESCO old town · Spice markets & winding alleys', count:'UNESCO World Heritage', color:'#3D2E00', image:'stone-town.jpg' },
  { id:'nungwi', name:'Nungwi', emoji:'🏖️', flag:'🇹🇿', tag:'White sand beaches · Dhow building & sunsets', count:'Most Popular Beach', color:'#00203D', image:'nungwi.jpg' },
  { id:'paje', name:'Paje', emoji:'🏄', flag:'🇹🇿', tag:'Kitesurfing capital · Turquoise lagoon', count:'Watersports Hub', color:'#0a2a3a', image:'paje.jpg' },
  { id:'jozani', name:'Jozani Chwaka Bay National Park', emoji:'🐒', flag:'🇹🇿', tag:'Rare red colobus monkeys · Mangrove boardwalk', count:'Nature Reserve', color:'#1A2E1A', image:'jozani-chwaka-bay.jpg' },
  { id:'prison-island', name:'Prison Island (Changuu)', emoji:'🐢', flag:'🇹🇿', tag:'Giant Aldabra tortoises · Snorkelling', count:'Island Day Trip', color:'#00203D', image:'prison-island.jpg' },
  { id:'mnemba', name:'Mnemba Atoll', emoji:'🐠', flag:'🇹🇿', tag:'Private coral island · World-class diving', count:'Diving & Snorkelling', color:'#0a2a3a', image:'mnemba-atoll.jpg' },
  { id:'kizimkazi', name:'Kizimkazi', emoji:'🐬', flag:'🇹🇿', tag:'Traditional fishing village · Dolphin watching', count:'Dolphin Tours', color:'#00203D', image:'kizimkazi.jpg' },
  { id:'matemwe', name:'Matemwe', emoji:'🌊', flag:'🇹🇿', tag:'Quiet northeastern beach · Coral reef access', count:'Boutique & Tranquil', color:'#0a2a3a', image:'matemwe.jpg' },
  { id:'michamvi', name:'Michamvi Peninsula', emoji:'🌅', flag:'🇹🇿', tag:'Dramatic tides · Secluded sandbank sunsets', count:'Sunset Spot', color:'#3D1A00', image:'michamvi-peninsula.jpg' },
  { id:'pemba', name:'Pemba Island', emoji:'🌴', flag:'🇹🇿', tag:'"Green Island" · Untouched reefs & clove plantations', count:'Off the Beaten Path', color:'#1A3D00', image:'pemba-island.jpg' },
  { id:'chumbe', name:'Chumbe Island Coral Park', emoji:'🐟', flag:'🇹🇿', tag:'Protected marine sanctuary · Eco-lodge', count:'Marine Conservation', color:'#00203D', image:'chumbe-island.jpg' },
  { id:'spice-farms', name:'Spice Farms of Zanzibar', emoji:'🌿', flag:'🇹🇿', tag:'Clove, nutmeg & vanilla plantation tours', count:'Cultural Experience', color:'#3D2E00', image:'spice-farms-zanzibar.jpg' },
];

// Named destinations within Rwanda — same brief-intro format as above.
// image: just the filename — upload it to the Images/ folder on GitHub
var RWANDA_DESTINATIONS = [
  { id:'volcanoes-np', name:'Volcanoes National Park', emoji:'🦍', flag:'🇷🇼', tag:'Mountain gorilla trekking · Virunga volcanoes', count:'Gorilla Icon', color:'#1A3D00', image:'volcanoes-national-park.jpg' },
  { id:'nyungwe', name:'Nyungwe Forest National Park', emoji:'🐒', flag:'🇷🇼', tag:'Canopy walkway · Chimpanzee trekking', count:"Africa's Oldest Rainforest", color:'#1e3a1e', image:'nyungwe-forest-national-park.jpg' },
  { id:'lake-kivu', name:'Lake Kivu', emoji:'🚤', flag:'🇷🇼', tag:'Great Lake beaches · Boat cruises & coffee islands', count:'Lakeside Relaxation', color:'#0a2a3a', image:'lake-kivu.jpg' },
  { id:'akagera', name:'Akagera National Park', emoji:'🦁', flag:'🇷🇼', tag:'Big Five savanna · Boat safaris on Lake Ihema', count:'Big Five Reserve', color:'#3a2a0a', image:'akagera-national-park.jpg' },
  { id:'kigali', name:'Kigali City', emoji:'🏙️', flag:'🇷🇼', tag:"Africa's cleanest capital · Vibrant arts scene", count:'Gateway City', color:'#2C1810', image:'kigali-city.jpg' },
  { id:'gishwati-mukura', name:'Gishwati-Mukura National Park', emoji:'🐵', flag:'🇷🇼', tag:"Rwanda's newest park · Chimp & golden monkey tracking", count:'Emerging Destination', color:'#1A2E1A', image:'gishwati-mukura-national-park.jpg' },
  { id:'kings-palace', name:"King's Palace Museum (Nyanza)", emoji:'👑', flag:'🇷🇼', tag:'Traditional royal residence · Inyambo cattle', count:'Cultural Heritage', color:'#3D2E00', image:'kings-palace-museum.jpg' },
  { id:'ethnographic-museum', name:'Ethnographic Museum (Huye)', emoji:'🏛️', flag:'🇷🇼', tag:"Rwanda's premier cultural & historical museum", count:'Cultural Heritage', color:'#2C1810', image:'ethnographic-museum-huye.jpg' },
  { id:'lake-muhazi', name:'Lake Muhazi', emoji:'🛶', flag:'🇷🇼', tag:'Tranquil lakeside retreat · Kayaking & birdwatching', count:'Near Kigali', color:'#1A1A2E', image:'lake-muhazi.jpg' },
  { id:'burera-ruhondo', name:'Twin Lakes Burera & Ruhondo', emoji:'🏞️', flag:'🇷🇼', tag:'Dramatic volcanic-lake scenery · Northern Province', count:'Scenic Escape', color:'#1A3D00', image:'twin-lakes-burera-ruhondo.jpg' },
  { id:'musanze-caves', name:'Musanze Caves', emoji:'🕳️', flag:'🇷🇼', tag:'Ancient lava tube caves · Volcanic history', count:'Underground Adventure', color:'#2E1A00', image:'musanze-caves.jpg' },
  { id:'genocide-memorial', name:'Kigali Genocide Memorial', emoji:'🕊️', flag:'🇷🇼', tag:'Poignant memorial honouring 1994 genocide victims', count:'Remembrance & History', color:'#2C1810', image:'kigali-genocide-memorial.jpg' },
];

// image: just the filename — upload it to the Images/ folder on GitHub
var PACKAGES = [
  { id:'p1', name:'Maasai Mara Classic Safari', dest:'Kenya', duration:'3 Days', emoji:'🦁',
    price:850, currency:'USD', perPerson:true, accom:'comfort',
    tag:'kenya', badge:'Best Seller', image:'maasai-mara-classic.jpg', // ← now a majestic Mara lion portrait
    desc:'Witness the iconic wildlife of Kenya\'s most famous reserve — lions, elephants, cheetahs and the sweeping savannah plains.',
    highlights:['Big Five','Great Migration (seasonal)','Maasai Village Visit','Sundowner Drive'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Maasai Mara', desc:'Early morning drive via Great Rift Valley escarpment. Afternoon game drive. Dinner at camp.' },
      { day:'Day 2', title:'Full Day Game Drives', desc:'Full day exploring the reserve. Morning and afternoon drives seeking lions, leopards, and elephant herds.' },
      { day:'Day 3', title:'Morning Drive → Nairobi', desc:'Final sunrise game drive before heading back to Nairobi. Drop-off at hotel/airport.' },
    ],
    includes:['4x4 Safari Vehicle','Professional Guide','All Park Fees','Full Board Meals','Accommodation','Nairobi Transfers'] },

  { id:'p2', name:'Amboseli & Kilimanjaro Safari', dest:'Kenya', duration:'3 Days', emoji:'🐘',
    price:780, currency:'USD', perPerson:true, accom:'comfort',
    tag:'kenya', badge:'', image:'amboseli-kilimanjaro.jpg',
    desc:'See Africa\'s largest elephant herds against the stunning backdrop of Mount Kilimanjaro — a photographer\'s paradise.',
    highlights:['Large Elephant Herds','Kilimanjaro Views','Bird Watching','Observation Hill'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Amboseli', desc:'Drive to Amboseli National Park. Afternoon game drive. Overnight at lodge with Kilimanjaro views.' },
      { day:'Day 2', title:'Amboseli Full Day', desc:'Full day game drives. Visit the seasonal lake. Look for cheetahs, lions and hundreds of elephants.' },
      { day:'Day 3', title:'Morning Drive → Nairobi', desc:'Early morning drive near the swamps. Return to Nairobi after lunch.' },
    ],
    includes:['4x4 Safari Vehicle','Expert Guide','Park Fees','Full Board','Lodge Stay','Airport Transfers'] },

  { id:'p3', name:'Kenya Grand Safari', dest:'Kenya', duration:'5 Days', emoji:'🌅',
    price:1450, currency:'USD', perPerson:true, accom:'luxury',
    tag:'kenya', badge:'Popular', image:'kenya-grand-safari.jpg',
    desc:'The ultimate Kenya experience — Amboseli, Tsavo West, and the Maasai Mara in one spectacular journey.',
    highlights:['Big Five Guaranteed','Maasai Mara','Amboseli Elephants','Tsavo Red Elephants','Lake Naivasha'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Amboseli', desc:'Morning briefing. Afternoon drive to Amboseli. Sundowner with Kilimanjaro views.' },
      { day:'Day 2', title:'Amboseli → Tsavo West', desc:'Full morning game drive before heading to Tsavo West National Park. Afternoon drive.' },
      { day:'Day 3', title:'Tsavo West Full Day', desc:'Explore Mzima Springs and the lava fields. Watch the famous red elephants at waterholes.' },
      { day:'Day 4-5', title:'Maasai Mara', desc:'Two full days in the Mara — the jewel of Kenya. Balloon safari available (extra cost).' },
    ],
    includes:['4x4 Land Cruiser','Expert Guide & Driver','All Park Fees','Luxury Lodges','Full Board','Transfers'] },

  { id:'p4', name:'Tanzania Serengeti Explorer', dest:'Tanzania', duration:'5 Days', emoji:'🐃',
    price:1680, currency:'USD', perPerson:true, accom:'comfort',
    tag:'tanzania', badge:'Featured', image:'serengeti-explorer.jpg',
    desc:'Explore the legendary Serengeti and the world-famous Ngorongoro Crater — home to the greatest wildlife concentration on Earth.',
    highlights:['Serengeti Plains','Ngorongoro Crater','Wildebeest Migration','Olduvai Gorge'],
    itinerary:[
      { day:'Day 1', title:'Arusha → Serengeti', desc:'Fly or drive to Serengeti. Afternoon game drive in the Central Serengeti.' },
      { day:'Day 2', title:'Serengeti Full Day', desc:'Full day exploring. Seek the Big Five on the vast golden plains.' },
      { day:'Day 3', title:'Serengeti → Ngorongoro', desc:'Morning drive then move to the Ngorongoro Conservation Area. Crater rim dinner.' },
      { day:'Day 4', title:'Ngorongoro Crater', desc:'Full day descent into the crater — the world\'s largest intact caldera, teeming with wildlife.' },
      { day:'Day 5', title:'Return to Arusha', desc:'Morning at leisure before return transfer to Arusha airport.' },
    ],
    includes:['4x4 Safari Vehicle','Professional Tanzanian Guide','All Park & Conservation Fees','Full Board','Tented Camp & Lodge','Transfers'] },

  { id:'p5', name:'Uganda Gorilla Trek', dest:'Uganda', duration:'4 Days', emoji:'🦍',
    price:2200, currency:'USD', perPerson:true, accom:'comfort',
    tag:'uganda', badge:'Rare Experience', image:'uganda-gorilla-trek.jpg',
    desc:'Track endangered mountain gorillas in the misty forests of Bwindi — one of the most profound wildlife encounters on Earth.',
    highlights:['Mountain Gorilla Trekking','Bwindi Forest','Chimpanzee Tracking','Local Culture'],
    itinerary:[
      { day:'Day 1', title:'Entebbe → Bwindi', desc:'Fly or drive to Bwindi Impenetrable National Park. Briefing and overnight at forest lodge.' },
      { day:'Day 2', title:'Gorilla Trekking', desc:'The experience of a lifetime. 1 hour with a habituated gorilla family in their natural habitat.' },
      { day:'Day 3', title:'Chimp Tracking (Optional)', desc:'Optional chimpanzee tracking in Kibale Forest or cultural visit to a local community.' },
      { day:'Day 4', title:'Return to Entebbe', desc:'Morning at leisure. Return transfer to Entebbe.' },
    ],
    includes:['Gorilla Trekking Permit','Park Fees','4WD Vehicle','Professional Guide','Full Board','Lodge Accommodation'] },

  { id:'p6', name:'Zanzibar Spice & Beach Retreat', dest:'Zanzibar', duration:'5 Days', emoji:'🌊',
    price:950, currency:'USD', perPerson:true, accom:'luxury',
    tag:'zanzibar', badge:'Romantic', image:'zanzibar-beach-retreat.jpg',
    desc:'Explore the exotic spice island — ancient Stone Town, pristine coral beaches, dolphin watching and traditional dhow sunset cruises.',
    highlights:['Stone Town UNESCO Site','Spice Farm Tour','Dolphin Watching','Snorkelling','Sunset Dhow Cruise'],
    itinerary:[
      { day:'Day 1', title:'Arrival in Zanzibar', desc:'Airport transfer to beach resort. Afternoon at leisure on Nungwi or Paje beach.' },
      { day:'Day 2', title:'Stone Town & Spice Tour', desc:'Explore UNESCO World Heritage Stone Town. Afternoon spice farm tour.' },
      { day:'Day 3', title:'Dolphin Watching', desc:'Morning boat trip to swim with wild dolphins at Kizimkazi. Afternoon snorkelling at coral reefs.' },
      { day:'Day 4', title:'Beach Day & Dhow Cruise', desc:'Relaxing beach day followed by a traditional sunset dhow cruise with fresh seafood.' },
      { day:'Day 5', title:'Departure', desc:'Final morning swim before airport transfer.' },
    ],
    includes:['Airport Transfers','Luxury Beach Hotel','Daily Breakfast','Stone Town Tour','Spice Farm','Dolphin Boat Trip','Sunset Dhow Cruise'] },

  { id:'p7', name:'Kenya & Tanzania Combined', dest:'Multi-country', duration:'8 Days', emoji:'🌍',
    price:2800, currency:'USD', perPerson:true, accom:'luxury',
    tag:'multi', tags:['multi','tanzania'], badge:'Best Value', image:'kenya-tanzania-combined.jpg',
    desc:'The ultimate East Africa double — Maasai Mara on the Kenya side and Serengeti on the Tanzania side. Two countries, one legendary migration corridor.',
    highlights:['Maasai Mara','Serengeti','Ngorongoro Crater','Lake Nakuru','Two Countries'],
    itinerary:[
      { day:'Days 1-3', title:'Kenya — Maasai Mara', desc:'Three days exploring the world-famous Mara with some of the best big cat sightings in Africa.' },
      { day:'Day 4', title:'Cross into Tanzania', desc:'Cross the Tanzania border and drive through the Mara Triangle into the Serengeti.' },
      { day:'Days 5-6', title:'Serengeti National Park', desc:'Two full days in the Serengeti — seek lion prides, leopard, cheetah and the great herds.' },
      { day:'Day 7', title:'Ngorongoro Crater', desc:'Full day descent into the crater — 8th Wonder of the World.' },
      { day:'Day 8', title:'Return to Nairobi / Arusha', desc:'Morning at leisure before departure transfers.' },
    ],
    includes:['All Park & Conservation Fees','Expert Bi-lingual Guide','4x4 Land Cruiser','Luxury Lodges','Full Board','All Transfers','Border Crossing Assistance'] },

  { id:'p8', name:'Lake Nakuru & Naivasha', dest:'Kenya', duration:'2 Days', emoji:'🦩',
    price:480, currency:'USD', perPerson:true, accom:'budget',
    tag:'kenya', badge:'Budget Friendly', image:'lake-nakuru-naivasha.jpg',
    desc:'A perfect short escape — pink flamingos at Lake Nakuru, rhinos, boat rides on Lake Naivasha and walking on Crescent Island.',
    highlights:['Pink Flamingos','White & Black Rhinos','Hippo Boat Ride','Crescent Island Walk','Hell\'s Gate'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Lake Nakuru', desc:'Drive to Lake Nakuru National Park. Game drive in the afternoon. Overnight at lodge.' },
      { day:'Day 2', title:'Lake Naivasha → Nairobi', desc:'Boat ride on Lake Naivasha, guided walk on Crescent Island. Return to Nairobi.' },
    ],
    includes:['4x4 Vehicle','Guide','Park Fees','Full Board','Accommodation','Transfers'] },

  { id:'p9', name:'Samburu Special Reserve Safari', dest:'Kenya', duration:'3 Days', emoji:'🐆',
    price:790, currency:'USD', perPerson:true, accom:'comfort',
    tag:'kenya', badge:'Unique Species', image:'samburu-special-reserve.jpg',
    desc:'Venture north to the rugged, red-earth landscapes of Samburu — home to species found nowhere else in Kenya, from Grevy\'s zebra to the reticulated giraffe.',
    highlights:['Grevy\'s Zebra','Reticulated Giraffe','Samburu Elephants','Fly-in Option Available'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Samburu', desc:'Drive or fly in to Samburu National Reserve. Afternoon game drive along the Ewaso Nyiro River.' },
      { day:'Day 2', title:'Samburu Full Day', desc:'Full day exploring the reserve\'s rocky hills and riverine forest, home to the "Samburu Special Five".' },
      { day:'Day 3', title:'Morning Drive → Nairobi', desc:'Final sunrise game drive before returning to Nairobi by road or light aircraft.' },
    ],
    includes:['4x4 Safari Vehicle','Professional Guide','All Park Fees','Full Board Meals','Lodge Accommodation','Nairobi Transfers (fly-in option available at extra cost)'] },

  { id:'p10', name:'Classic Kenya Safari', dest:'Kenya', duration:'7 Days', emoji:'🐘',
    price:1950, currency:'USD', perPerson:true, accom:'comfort',
    tag:'kenya', badge:'Signature Route', image:'classic-kenya-safari.jpg',
    desc:'Kenya\'s definitive safari circuit — sweeping Amboseli plains beneath Kilimanjaro, a freshwater interlude at Lake Naivasha, and three unforgettable days in the world-famous Masai Mara.',
    highlights:['Amboseli Elephants','Kilimanjaro Views','Lake Naivasha Boat Ride','Masai Mara Big Cats','Optional Balloon Safari'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Amboseli', desc:'Wide savanna and marshy wetlands beneath Kilimanjaro. Large elephant herds dominate, alongside buffalo, giraffe, zebra, lion and cheetah. Sunset drive frames elephants against the mountain.' },
      { day:'Day 2', title:'Amboseli Full Day', desc:'Marsh-fed floodplains draw elephant families, hippos, zebra and wildebeest, with lion and the occasional wild dog active at dawn and dusk. Extended drives and marsh birding.' },
      { day:'Day 3', title:'Amboseli → Lake Naivasha', desc:'A shift to freshwater lake country — papyrus fringes, fish eagles and hippos. Afternoon boat trip on Naivasha, then an optional walking safari on Crescent Island.' },
      { day:'Day 4', title:'Lake Naivasha → Masai Mara', desc:'Farmland gives way to the sweeping Mara ecosystem. Arrival brings wildebeest and zebra herds, resident elephants and dense predator populations. Evening orientation drive.' },
      { day:'Day 5', title:'Masai Mara Full Day', desc:'Open plains, riverine acacia corridors and rocky kopjes concentrate wildlife. Hunting cheetahs, territorial lion prides and leopards near outcrops.' },
      { day:'Day 6', title:'Masai Mara Full Day (Optional Balloon)', desc:'Dawn light over the plains and, in migration season, dramatic river crossings with dense wildebeest herds. Optional sunrise balloon safari.' },
      { day:'Day 7', title:'Masai Mara → Nairobi', desc:'A final morning game drive across the savanna before transiting through highland farmland back to Nairobi.' },
    ],
    includes:['4x4 Safari Vehicle','Professional Guide','All Park & Conservation Fees','Full Board Meals','Lodge/Tented Camp Accommodation','Lake Naivasha Boat Ride','All Transfers','Balloon Safari (optional, extra cost)'] },

  { id:'p11', name:'Best of Kenya Parks', dest:'Kenya', duration:'10 Days', emoji:'🦏',
    price:3200, currency:'USD', perPerson:true, accom:'luxury',
    tag:'kenya', badge:'Ultimate Kenya', image:'best-of-kenya-parks.jpg',
    desc:'The complete northern-to-southern sweep — Samburu\'s arid specialists, Ol Pejeta\'s rhino sanctuaries, Rift Valley lakes and a three-night finale in the Masai Mara.',
    highlights:['Grevy\'s Zebra & Gerenuk','Ol Pejeta Rhino Sanctuary','Lake Nakuru Flamingos','Lake Naivasha Boat Cruise','Extended Masai Mara'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Samburu', desc:'Semi-arid savanna with riverine gallery forest along the Ewaso Ng\'iro. Northern specials — Grevy\'s zebra, gerenuk, reticulated giraffe — alongside resident predators.' },
      { day:'Day 2', title:'Samburu Full Day', desc:'Riverine corridors and thorn-scrub sustain uniquely adapted species, including vulturine guineafowl and golden-breasted starling. Dawn river transects and targeted drives.' },
      { day:'Day 3', title:'Samburu → Ol Pejeta/Laikipia', desc:'Private conservancy country of riverine thickets and open plains. Ol Pejeta is renowned for black and white rhino, a chimp sanctuary, and reliable lion and elephant sightings.' },
      { day:'Day 4', title:'Laikipia Full Day', desc:'Varied conservancy habitat — acacia plains, river channels, seasonal wetlands. Possibility of wild dog, healthy elephant and buffalo numbers, and a strong raptor list.' },
      { day:'Day 5', title:'Laikipia → Lake Nakuru', desc:'Alkaline lake fringed by scrub and escarpment viewpoints. Seasonal flamingo flocks, varied waterbirds, and rhino and buffalo within the park.' },
      { day:'Day 6', title:'Lake Nakuru → Lake Naivasha', desc:'Transition to freshwater lake habitat — papyrus fringes and riverine trees, hippos and fish eagles. Boat cruise and Crescent Island walking safari.' },
      { day:'Day 7', title:'Naivasha Leisure → Masai Mara', desc:'A relaxed morning boat ride precedes the transfer into the Mara ecosystem, where predator-rich savanna opens up for the evening game drive.' },
      { day:'Day 8', title:'Masai Mara Full Day', desc:'Sustained big-cat activity across riverine belts and kopjes, hyena clans and, in season, large-scale herbivore migration.' },
      { day:'Day 9', title:'Masai Mara Full Day', desc:'A second full day in the Mara with optional sunrise balloon safari and extended photographic sessions across the reserve\'s migration zones.' },
      { day:'Day 10', title:'Return to Nairobi', desc:'Final morning game drive before the transfer back to Nairobi to conclude a comprehensive ten-day journey across Kenya\'s finest parks.' },
    ],
    includes:['4x4 Land Cruiser','Expert Guide & Driver','All Park & Conservancy Fees','Full Board','Luxury Lodges & Tented Camps','Ol Pejeta Rhino Sanctuary Visit','Lake Naivasha Boat Cruise','All Transfers','Balloon Safari (optional, extra cost)'] },

  { id:'p12', name:'Amboseli & Tsavo Adventure', dest:'Kenya', duration:'6 Days', emoji:'🌋',
    price:1580, currency:'USD', perPerson:true, accom:'comfort',
    tag:'kenya', badge:'', image:'amboseli-tsavo-adventure.jpg',
    desc:'Kilimanjaro views over Amboseli\'s elephant herds, then south into Tsavo\'s volcanic wilderness — lava flows, red-dust elephants and the crystal springs of Mzima.',
    highlights:['Amboseli Elephants','Mzima Springs','Shetani Lava Flows','Tsavo Red-Dust Elephants','Chyulu Hills Views'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Amboseli', desc:'Open short-grass plains and seasonal marshes beneath Kilimanjaro. Elephants dominate the scene alongside healthy zebra, wildebeest and predator populations. Evening photographic session at dusk.' },
      { day:'Day 2', title:'Amboseli Full Day', desc:'Marsh-fed floodplains showcase elephant herding behaviour, hippos, and active lion and cheetah at prime hours. Long drives for behaviour observation.' },
      { day:'Day 3', title:'Amboseli → Tsavo West', desc:'Volcanic ridges, dense scrub and riverine patches. Mzima Springs hosts hippos and crocodiles in clear water; buffalo and elephant frequent the wooded valleys en route.' },
      { day:'Day 4', title:'Tsavo West Full Day', desc:'Rugged volcanic terrain, lava flows and mixed woodland conceal leopards in dense thickets alongside elephant herds. Scenic drives to the Shetani lava flows.' },
      { day:'Day 5', title:'Tsavo East Full Day', desc:'Wide red-soil plains scattered with acacia and thorn scrub — home to Tsavo\'s iconic red-dust elephants, large ungulate herds and resident predators.' },
      { day:'Day 6', title:'Transfer to Mombasa or Nairobi', desc:'A final morning game drive before transferring onward to the coast at Mombasa, or back to Nairobi for departure.' },
    ],
    includes:['4x4 Safari Vehicle','Professional Guide','All Park Fees','Full Board','Lodge Accommodation','Mzima Springs Nature Walk','All Transfers'] },

  { id:'p13', name:'Masai Mara Explorer', dest:'Kenya', duration:'5 Days', emoji:'🦓',
    price:1350, currency:'USD', perPerson:true, accom:'comfort',
    tag:'kenya', badge:'Migration Focus', image:'masai-mara-explorer.jpg',
    desc:'Five unhurried days immersed in the Masai Mara — more time for predator tracking, photography, and an optional cultural visit to a Maasai community.',
    highlights:['Big Cat Tracking','Cheetah & Lion Prides','Hyena Clans','Maasai Cultural Visit'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Masai Mara', desc:'Rolling farmland opens into broad savanna and riverine strips. Initial drives focus on locating cheetah and lion prides. Evening introductory drive and camp briefing.' },
      { day:'Day 2', title:'Masai Mara Full Day', desc:'Open plains and acacia-dotted river corridors host intensive searches for big cats, hyenas, and abundant plains herbivores.' },
      { day:'Day 3', title:'Masai Mara Full Day', desc:'Sunrise and sunset drives emphasise photography and species diversity, covering the reserve\'s riverine belts and open grassland.' },
      { day:'Day 4', title:'Optional Cultural Visit & Short Walk', desc:'A change of pace with a guided visit to a Maasai community to learn about pastoral culture, followed by a short guided walk near camp.' },
      { day:'Day 5', title:'Return to Nairobi', desc:'A final morning game drive before the transfer back to Nairobi, closing out an in-depth Mara experience.' },
    ],
    includes:['4x4 Safari Vehicle','Professional Guide','All Park Fees','Full Board','Tented Camp Accommodation','Maasai Village Visit','All Transfers'] },

  { id:'p14', name:'Northern Frontier Expedition', dest:'Kenya', duration:'8 Days', emoji:'🦒',
    price:2650, currency:'USD', perPerson:true, accom:'luxury',
    tag:'kenya', badge:'Off the Beaten Path', image:'northern-frontier-expedition.jpg',
    desc:'Kenya\'s wild north — Samburu\'s river specialists, the kopjes of Buffalo Springs and Shaba, and Laikipia\'s private rhino conservancies, far from the crowds.',
    highlights:['Grevy\'s Zebra & Gerenuk','Buffalo Springs & Shaba','Ol Pejeta Rhinos','Conservancy Night Drives'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Samburu', desc:'Arid thornbush, riverine galleries and kopjes shelter Grevy\'s zebra, reticulated giraffe, gerenuk and species adapted to arid conditions.' },
      { day:'Day 2', title:'Samburu Full Day', desc:'Targeted drives for Samburu specials through bird-rich riverine patches, seeking out the region\'s distinctive northern wildlife assemblage.' },
      { day:'Day 3', title:'Buffalo Springs & Shaba', desc:'Sandy plains and rocky kopjes with scrub host larks, bustards and arid-adapted species alongside typical savanna mammals. Kopje walks and raptor watches.' },
      { day:'Day 4', title:'Transfer to Laikipia/Ol Pejeta', desc:'Conservancy mosaics of small wetlands and river channels hold Ol Pejeta\'s rhinos, diverse carnivores and water-dependent birdlife. Rhino sanctuary visit included.' },
      { day:'Day 5', title:'Laikipia Full Day', desc:'Guided conservancy drives and walking safaris through varied private-land habitat, tracking resident predators and herbivore populations.' },
      { day:'Day 6', title:'Transfer Toward Nairobi with Stopovers', desc:'Roadside birding and pastoral landscape views break up the journey south, with stops chosen for scenery and last sightings.' },
      { day:'Day 7', title:'Buffer / Community Day', desc:'A flexible day for an additional community visit or extra conservancy activity, tailored to interest and pace.' },
      { day:'Day 8', title:'Return to Nairobi', desc:'Final checklist wrap-up and departure transfer to Nairobi, concluding the northern frontier expedition.' },
    ],
    includes:['4x4 Safari Vehicle','Professional Guide','All Park & Conservancy Fees','Full Board','Luxury Tented Camps & Lodges','Ol Pejeta Rhino Sanctuary Visit','All Transfers'] },

  { id:'p15', name:'Rift Valley & Mara Safari', dest:'Kenya', duration:'8 Days', emoji:'🦩',
    price:2100, currency:'USD', perPerson:true, accom:'comfort',
    tag:'kenya', badge:'Bird Lover\'s Choice', image:'rift-valley-mara-safari.jpg',
    desc:'Flamingo-lined Rift Valley lakes, an optional cycling adventure through Hell\'s Gate, and three extended days tracking predators in the Masai Mara.',
    highlights:['Lake Nakuru Flamingos','Crescent Island Walk','Hell\'s Gate Cycling','Extended Mara Drives'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Lake Nakuru', desc:'An alkaline lake ringed by woodland and escarpment. Seasonal flamingo concentrations, pelicans, and resident rhino and buffalo populations.' },
      { day:'Day 2', title:'Nakuru Full Day', desc:'In-depth exploration of the shoreline and surrounding woodland for waterbirds and the park\'s resident rhino and buffalo populations.' },
      { day:'Day 3', title:'Nakuru → Naivasha', desc:'A freshwater lake with papyrus fringes and riverside trees. Boat ride and Crescent Island walk for close-range observation of unguarded plains species.' },
      { day:'Day 4', title:'Hell\'s Gate Optional', desc:'Dramatic gorge scenery and geothermal features explored on foot or by bicycle — a rare chance to move through Big Five country under your own power.' },
      { day:'Day 5', title:'Naivasha → Masai Mara', desc:'Transfer into the Mara ecosystem\'s riverine and kopje habitat, arriving to open predator-rich savanna for the first game drive.' },
      { day:'Day 6', title:'Masai Mara Full Day', desc:'Extended drives track the Mara\'s big cats and large herbivore herds, with floodplain specialists adding to the day\'s species list.' },
      { day:'Day 7', title:'Masai Mara Full Day', desc:'A further full day of multi-area Mara exploration, with focused predator tracking across riverine belts and open plains.' },
      { day:'Day 8', title:'Return to Nairobi', desc:'Morning game drive followed by the transfer back to Nairobi to conclude the Rift Valley and Mara circuit.' },
    ],
    includes:['4x4 Safari Vehicle','Professional Guide','All Park Fees','Full Board','Lodge/Tented Camp Accommodation','Lake Naivasha Boat Ride','Hell\'s Gate Cycling (optional)','All Transfers'] },

  { id:'p16', name:'Southern Kenya Highlights', dest:'Kenya', duration:'7 Days', emoji:'🏖️',
    price:1750, currency:'USD', perPerson:true, accom:'comfort',
    tag:'kenya', badge:'Highland to Coast', image:'southern-kenya-highlights.jpg',
    desc:'Amboseli\'s elephants, Tsavo\'s volcanic wilderness, and a final stretch to Kenya\'s coast at Mombasa or Diani — savanna and shoreline in one journey.',
    highlights:['Amboseli & Kilimanjaro','Mzima Springs','Tsavo Red-Dust Elephants','Coastal Finale'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Amboseli', desc:'Afternoon drives target elephant sightings with Kilimanjaro as a backdrop, ideal for the trip\'s signature photography.' },
      { day:'Day 2', title:'Amboseli Full Day', desc:'Full-day game drives across marsh and plain habitats within Amboseli, following elephant families and resident predators.' },
      { day:'Day 3', title:'Transfer to Tsavo West (Mzima Springs)', desc:'Volcanic landscapes, springs and riverine woodland lead to Mzima Springs, where hippos and clear-water wildlife concentrate.' },
      { day:'Day 4', title:'Tsavo West Drives', desc:'Scenic drives through lava flows and scrub habitat in search of leopard, elephant and Tsavo\'s varied savanna species.' },
      { day:'Day 5', title:'Tsavo East Exploration', desc:'Wide-ranging drives across Tsavo East\'s open plains for the park\'s iconic red-dust elephants and abundant herbivore herds.' },
      { day:'Day 6', title:'Transfer Toward Mombasa / Diani', desc:'A coastal transfer trades savanna for shoreline, with time to relax at the beach on arrival.' },
      { day:'Day 7', title:'Departure from Mombasa', desc:'Optional marine activities or a return transfer to Nairobi to conclude the highland-to-coast journey.' },
    ],
    includes:['4x4 Safari Vehicle','Professional Guide','All Park Fees','Full Board (safari portion)','Lodge Accommodation','Mzima Springs Visit','Coastal Transfer'] },

  { id:'p17', name:'Kenya Big Five Trail', dest:'Kenya', duration:'9 Days', emoji:'🐆',
    price:2950, currency:'USD', perPerson:true, accom:'luxury',
    tag:'kenya', badge:'Big Five Guaranteed', image:'kenya-big-five-trail.jpg',
    desc:'A focused pursuit of Africa\'s Big Five — rhino sanctuaries at Ol Pejeta, flamingo-lined Nakuru, three days in the predator-rich Mara, and a Kilimanjaro finale at Amboseli.',
    highlights:['Ol Pejeta Rhino Sanctuary','Lake Nakuru','Extended Masai Mara','Amboseli Elephants & Kilimanjaro'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Laikipia/Ol Pejeta', desc:'Conservancy ridges and riverine woodland offer a high probability of rhino sightings at Ol Pejeta, plus diverse carnivores and elephant herds.' },
      { day:'Day 2', title:'Laikipia Full Day', desc:'Conservancy activities including guided walks and waterhole hides deepen the search for the Big Five across private-land habitat.' },
      { day:'Day 3', title:'Transfer to Lake Nakuru', desc:'Lakeshore birding and raptor vantage points along the alkaline lake, with resident rhino and buffalo within park boundaries.' },
      { day:'Day 4', title:'Nakuru → Masai Mara', desc:'Drive to the Mara ecosystem with an evening introductory game drive to orient within predator-rich savanna.' },
      { day:'Day 5', title:'Masai Mara Intensive Drives', desc:'The first of two full days of multi-area Mara exploration, tracking lion, leopard, buffalo and elephant across riverine belts and kopjes.' },
      { day:'Day 6', title:'Masai Mara Intensive Drives', desc:'A second full day of predator tracking and Big Five checklist drives across the reserve\'s varied habitat.' },
      { day:'Day 7', title:'Transfer to Amboseli', desc:'Afternoon arrival into Amboseli, with elephant sightings set against classic Kilimanjaro views.' },
      { day:'Day 8', title:'Amboseli Full Day', desc:'A full day of Amboseli drives and photography, focused on elephant herding behaviour and the mountain backdrop.' },
      { day:'Day 9', title:'Return to Nairobi', desc:'Final morning game drive before the transfer back to Nairobi, closing out the Big Five trail.' },
    ],
    includes:['4x4 Land Cruiser','Expert Guide & Driver','All Park & Conservancy Fees','Full Board','Luxury Lodges & Tented Camps','Ol Pejeta Rhino Sanctuary Visit','All Transfers'] },

  { id:'p18', name:'Kenya Lakes & Plains Safari', dest:'Kenya', duration:'8 Days', emoji:'🌅',
    price:1980, currency:'USD', perPerson:true, accom:'comfort',
    tag:'kenya', badge:'Off the Beaten Path', image:'kenya-lakes-plains-safari.jpg',
    desc:'A rarely-visited circuit through the steaming hot springs of Lake Bogoria, the boat channels of Lake Baringo, and on to Nakuru and the Masai Mara.',
    highlights:['Lake Bogoria Hot Springs','Lake Baringo Boat Cruise','Lake Nakuru','Masai Mara Migration'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Lake Bogoria', desc:'An alkaline lake with hot springs and geysers, ringed by acacia scrub. Seasonal flamingo concentrations and varied waders. Dawn and dusk flamingo watches beside steaming springs.' },
      { day:'Day 2', title:'Bogoria → Baringo', desc:'Freshwater lakes with papyrus fringes and riverine woodland. Kingfishers, herons and a mix of waterbirds, with hippos sheltering in quiet bays.' },
      { day:'Day 3', title:'Baringo Full Day', desc:'Guided boat trips and island walks explore Baringo\'s freshwater habitats and their resident birdlife up close.' },
      { day:'Day 4', title:'Transfer to Nakuru', desc:'Lakeshore exploration and escarpment viewpoints en route, taking in flamingo flocks and raptor activity around Nakuru.' },
      { day:'Day 5', title:'Nakuru → Masai Mara', desc:'Transfer south into the Mara ecosystem, with an introductory evening game drive upon arrival.' },
      { day:'Day 6', title:'Masai Mara Full Day', desc:'Extended drives with a migration focus when in season, tracking the Mara\'s resident predators and herbivore herds.' },
      { day:'Day 7', title:'Masai Mara Full Day', desc:'A further full day of Mara exploration, rounding out the checklist of plains and predator species.' },
      { day:'Day 8', title:'Return to Nairobi', desc:'Final morning game drive before the transfer back to Nairobi, concluding a rarely-travelled lakes-and-plains circuit.' },
    ],
    includes:['4x4 Safari Vehicle','Professional Guide','All Park Fees','Full Board','Lodge/Tented Camp Accommodation','Lake Baringo Boat Cruise','All Transfers'] },

  { id:'p19', name:'Grand Kenya Discovery', dest:'Kenya', duration:'10 Days', emoji:'⛰️',
    price:3600, currency:'USD', perPerson:true, accom:'luxury',
    tag:'kenya', badge:'Grand Expedition', image:'grand-kenya-discovery.jpg',
    desc:'The definitive Kenya journey — highland cloud forest in the Aberdares, Mount Kenya\'s slopes, Samburu\'s north, Ol Pejeta\'s rhinos, and a grand finale across Nakuru, the Mara and Naivasha.',
    highlights:['Aberdares Highland Forest','Mount Kenya Slopes','Samburu Specialists','Ol Pejeta Rhinos','Masai Mara Migration'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Aberdares', desc:'Highland cloud forest, bamboo and moorland with dramatic escarpment views. Montane bird specialists on feeder platforms and the chance of highland mammal encounters.' },
      { day:'Day 2', title:'Aberdares Full Day', desc:'Forest and moorland walks searching mixed bird flocks and montane specialists across this unique highland habitat.' },
      { day:'Day 3', title:'Transfer to Mount Kenya Slopes', desc:'Montane forest and riverine channels on the mountain\'s lower slopes offer riverine trail birding and high-altitude scans for mountain-adapted species.' },
      { day:'Day 4', title:'Mount Kenya → Samburu', desc:'A long transfer north with en-route stops and possible raptor migration watches, arriving into Samburu by evening.' },
      { day:'Day 5', title:'Samburu Full Day', desc:'Specialist drives to locate the region\'s northern endemics — Grevy\'s zebra, gerenuk, reticulated giraffe — and bird-rich riverine patches.' },
      { day:'Day 6', title:'Ol Pejeta Conservancy', desc:'Rhino sanctuary visit, conservancy walks and wildlife hides on private conservancy land renowned for black and white rhino.' },
      { day:'Day 7', title:'Lake Nakuru', desc:'Lakeshore viewing and escarpment raptor sightings, with resident rhino, buffalo and seasonal flamingo flocks.' },
      { day:'Day 8', title:'Masai Mara Full Day', desc:'The first of two extended Mara drives, with predator and migration focus depending on season.' },
      { day:'Day 9', title:'Masai Mara Full Day', desc:'A second full day of Mara exploration, rounding out sightings of the reserve\'s big cats and large herbivore herds.' },
      { day:'Day 10', title:'Lake Naivasha → Nairobi', desc:'A final boat cruise on Lake Naivasha for close-range wildlife viewing before the transfer back to Nairobi.' },
    ],
    includes:['4x4 Land Cruiser','Expert Guide & Driver','All Park & Conservancy Fees','Full Board','Luxury Lodges & Tented Camps','Ol Pejeta Rhino Sanctuary Visit','Lake Naivasha Boat Cruise','All Transfers'] },

  { id:'p20', name:'Classic Kenya Safari + Gorilla Trek', dest:'Multi-country', duration:'10 Days', emoji:'🦍',
    price:3400, currency:'USD', perPerson:true, accom:'luxury',
    tag:'multi', tags:['multi','uganda'], badge:'Two Countries', image:'classic-kenya-gorilla-trek.jpg',
    desc:'The ultimate combination — Masai Mara\'s big cats and Lake Nakuru\'s flamingos in Kenya, followed by a life-changing gorilla trek in Uganda\'s Bwindi Impenetrable Forest.',
    highlights:['Masai Mara Big Cats','Lake Nakuru Flamingos','Mountain Gorilla Trekking','Batwa Cultural Visit'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Masai Mara', desc:'Rolling farmland into riverine and open savanna. First big-cat encounters and abundant plains ungulates. Evening orientation drive and camp briefing.' },
      { day:'Day 2-3', title:'Masai Mara Full Days', desc:'Plains, kopjes and river strips reveal lions, cheetahs and leopards, with migration spectacles in season. All-day drives, optional hot-air balloon and Maasai village visit.' },
      { day:'Day 4', title:'Mara → Lake Nakuru', desc:'Rift Valley alkaline lake with escarpment perches. Seasonal flamingo flocks, pelicans and resident rhino. Lakeshore walks and raptor vantage points.' },
      { day:'Day 5', title:'Nakuru → Nairobi → Flight to Entebbe', desc:'Transit and overnight, crossing from Kenya into Uganda, with an optional Entebbe Botanical Gardens visit if time allows.' },
      { day:'Day 6', title:'Transfer to Bwindi Region', desc:'Albertine Rift highland forest, with forest primates and montane mammals en route. Scenic drive into Bwindi, briefing and cultural encounter with local communities.' },
      { day:'Day 7', title:'Gorilla Trekking in Bwindi', desc:'Dense montane rainforest home to mountain gorillas and other forest primates. Permit-led full-day trek with a one-hour viewing period and photography opportunity.' },
      { day:'Day 8', title:'Community Visit & Relaxation', desc:'A Batwa cultural visit, optional short walks and time to recover at the lodge after the trek.' },
      { day:'Day 9', title:'Transfer to Entebbe/Kigali with Stops', desc:'A scenic return journey with chances for local cultural stops along the way.' },
      { day:'Day 10', title:'Departure', desc:'International connections from Entebbe or Kigali conclude the combined Kenya–Uganda journey.' },
    ],
    includes:['4x4 Safari Vehicle & Guide (Kenya)','Gorilla Trekking Permit (Uganda)','All Park & Conservation Fees','Full Board Meals','Lodge/Tented Camp Accommodation','Domestic & Regional Flights','All Transfers'] },

  { id:'p21', name:'Uganda Primates & Kenya Plains Express', dest:'Multi-country', duration:'8 Days', emoji:'🐒',
    price:2850, currency:'USD', perPerson:true, accom:'comfort',
    tag:'multi', tags:['multi','uganda'], badge:'Primates & Predators', image:'uganda-primates-kenya-plains.jpg',
    desc:'Chimpanzee tracking in Kibale\'s rainforest and a boat safari on the Kazinga Channel, followed by a fast-paced finale among the Masai Mara\'s big cats.',
    highlights:['Chimpanzee Trekking','Kazinga Channel Boat Safari','Queen Elizabeth NP','Masai Mara Big Cats'],
    itinerary:[
      { day:'Day 1', title:'Entebbe → Kibale', desc:'Western Uganda rainforest and primate-rich landscape, home to chimpanzees and multiple monkey species. Evening briefing ahead of an early chimp-tracking start.' },
      { day:'Day 2', title:'Chimpanzee Trekking in Kibale', desc:'Primary rainforest hosts chimpanzee family troops alongside other primates and forest birds. Full-day chimp tracking with experienced local guides.' },
      { day:'Day 3', title:'Transfer to Queen Elizabeth NP', desc:'Savannah-forest mosaic around the Kazinga Channel, with hippos, elephants and prolific birdlife. Afternoon game drive and sunset over the crater fields.' },
      { day:'Day 4', title:'Kazinga Channel Boat Trip & Game Drive', desc:'An iconic boat safari past dense hippo pods, crocodiles and prolific waterbirds, followed by an afternoon plains game drive.' },
      { day:'Day 5', title:'Fly to Nairobi & Transfer to Masai Mara', desc:'A travel day crossing into Kenya, with evening arrival in the Mara and an introductory game drive.' },
      { day:'Day 6', title:'Masai Mara Full Day', desc:'Open plains and riverine strips hold big cats and large herbivore herds. Full-day drives focus on predator behaviour and seasonal migration hotspots.' },
      { day:'Day 7', title:'Masai Mara Morning Drive → Return to Nairobi', desc:'Final morning drives and checklist consolidation before the transfer back to Nairobi.' },
      { day:'Day 8', title:'Departure from Nairobi', desc:'Airport transfer and final arrangements to conclude the primates-and-plains journey.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','Chimpanzee Permit','Kazinga Channel Boat Trip','All Park Fees','Full Board','Lodge Accommodation','Domestic & Regional Flights','All Transfers'] },

  { id:'p22', name:'Rift Valley Lakes & Murchison Falls', dest:'Multi-country', duration:'9 Days', emoji:'🌊',
    price:2750, currency:'USD', perPerson:true, accom:'comfort',
    tag:'multi', tags:['multi','uganda'], badge:'Lakes & Falls', image:'rift-valley-murchison-falls.jpg',
    desc:'Kenya\'s flamingo-lined Rift Valley lakes give way to Uganda\'s Murchison Falls, where the Nile thunders through a narrow gorge amid elephants, lions and giraffe.',
    highlights:['Lake Nakuru Flamingos','Lake Naivasha Boat Ride','Murchison Falls Nile Cruise','Optional Budongo Chimps'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Lake Nakuru', desc:'Alkaline lake and escarpment woodlands. Seasonal flamingo concentrations and resident rhino. Lakeshore dawn watches and escarpment raptor scanning.' },
      { day:'Day 2', title:'Nakuru → Naivasha', desc:'Freshwater lake with papyrus fringes, hippos, fish eagles and shoreline species. Boat trip and Crescent Island walk.' },
      { day:'Day 3', title:'Fly to Entebbe & Transfer to Murchison Area', desc:'A cross-border flight and scenic transfer into Uganda\'s savanna and Nile corridor.' },
      { day:'Day 4', title:'Murchison Falls Game Drive', desc:'Open savanna and riverine forest mosaic hold elephants, lions, giraffe and buffalo. Afternoon game drive and sunset views over the falls.' },
      { day:'Day 5', title:'Boat Trip to the Base of the Falls', desc:'A Nile boat cruise with dense hippo and crocodile sightings and rich lakeshore birdlife, ending near the thundering base of the falls.' },
      { day:'Day 6', title:'Additional Drives or Budongo Chimp Optional', desc:'A choice between extra game drives or an optional visit to Budongo Forest for chimpanzee trekking.' },
      { day:'Day 7', title:'Transfer to Kampala/Entebbe with Stops', desc:'A scenic return journey with cultural stops en route back toward Entebbe.' },
      { day:'Day 8', title:'Entebbe Leisure or Birding at the Botanical Gardens', desc:'Relaxed birding near the lakeshore and botanical gardens to close out the trip.' },
      { day:'Day 9', title:'Departure from Entebbe', desc:'Final transfer and international departure.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','Nile Boat Cruise','All Park Fees','Full Board','Lodge Accommodation','Domestic & Regional Flights','All Transfers'] },

  { id:'p23', name:'Great Migration + Bwindi Gorilla Adventure', dest:'Multi-country', duration:'11 Days', emoji:'🦁',
    price:4200, currency:'USD', perPerson:true, accom:'luxury',
    tag:'multi', tags:['multi','uganda'], badge:'Flagship Journey', image:'great-migration-bwindi-gorilla.jpg',
    desc:'Kenya\'s Great Migration river crossings meet Uganda\'s mountain gorillas in one flagship eleven-day expedition — the two most extraordinary wildlife encounters in East Africa.',
    highlights:['Great Migration River Crossings','Optional Balloon Safari','Mountain Gorilla Trekking','Batwa Community Visit'],
    itinerary:[
      { day:'Day 1-4', title:'Masai Mara Migration Focus', desc:'Riverine and plains mosaic with crossing points host migration herds and concentrated predators. Intensive river-crossing stakeouts and full-day drives, with an optional balloon safari.' },
      { day:'Day 5', title:'Mara → Nairobi → Fly Entebbe', desc:'A transit day with evening arrival in Entebbe and onward transfer toward the Bwindi region.' },
      { day:'Day 6', title:'Transfer into Bwindi Highlands', desc:'Albertine Rift montane forest country. A scenic drive into forest terrain followed by a pre-trek briefing.' },
      { day:'Day 7', title:'Gorilla Trekking in Bwindi', desc:'A permit-led gorilla trek with a full hour of viewing and photography among the mountain gorilla families.' },
      { day:'Day 8', title:'Forest Activities and Community Visits', desc:'Gentle forest walks, a Batwa cultural visit, and an optional gorilla habituation experience where available.' },
      { day:'Day 9', title:'Return to Entebbe/Kigali with Stops', desc:'A leisurely return journey with opportunities for local markets or conservation-project visits.' },
      { day:'Day 10', title:'Buffer / Relaxation Day in Entebbe', desc:'Botanical garden visits and lakeshore relaxation before departure.' },
      { day:'Day 11', title:'Departure', desc:'Airport transfer for international flights, concluding the flagship migration-and-gorilla expedition.' },
    ],
    includes:['4x4 Safari Vehicle & Guide (Kenya)','Gorilla Trekking Permit (Uganda)','All Park & Conservation Fees','Full Board','Luxury Lodges & Tented Camps','Domestic & Regional Flights','All Transfers','Balloon Safari (optional, extra cost)'] },

  { id:'p24', name:'Birding & Lakes Specialist', dest:'Multi-country', duration:'9 Days', emoji:'🦜',
    price:2600, currency:'USD', perPerson:true, accom:'comfort',
    tag:'multi', tags:['multi','uganda'], badge:'Birder\'s Dream', image:'birding-lakes-specialist.jpg',
    desc:'A specialist circuit for birders — flamingo-packed Rift Valley lakes in Kenya, a shoebill canoe search at Mabamba Swamp, and the waterbird-rich Kazinga Channel in Uganda.',
    highlights:['Lake Nakuru Flamingos','Mabamba Shoebill Canoe Trip','Kazinga Channel Boat Safari','Optional Kyambura Gorge'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Lake Nakuru', desc:'Alkaline lake with reedbeds hosting flamingo aggregations and diverse waterbirds. Lakeshore dawn watches and checklist assembly.' },
      { day:'Day 2', title:'Nakuru → Baringo/Naivasha', desc:'Freshwater and alkaline systems with papyrus fringes shelter papyrus specialists, waterbirds and hippos. Boat trips and papyrus-edge searches.' },
      { day:'Day 3', title:'Early Baringo Boat → Nairobi → Flight to Entebbe', desc:'An early-morning boat outing followed by a cross-border flight into Uganda.' },
      { day:'Day 4', title:'Mabamba Swamp — Shoebill Canoe Trip', desc:'Papyrus channels and swamp habitat targeted for the elusive shoebill and other papyrus specialists via a quiet canoe trip.' },
      { day:'Day 5', title:'Mabamba → Queen Elizabeth Transfer', desc:'An evening arrival at Queen Elizabeth National Park in preparation for the Kazinga Channel boat trip.' },
      { day:'Day 6', title:'Kazinga Channel Boat & Game Drive', desc:'Dense hippo pods, crocodiles and abundant waterbird sightings along one of Africa\'s richest wildlife channels.' },
      { day:'Day 7', title:'Kyambura Gorge Optional Chimp and Birding', desc:'An optional gorge walk for primates and riverine bird species in the "Valley of the Apes".' },
      { day:'Day 8', title:'Return to Entebbe Leisure and Gardens', desc:'A final round of birding around the lakeshore and botanical gardens.' },
      { day:'Day 9', title:'Departure', desc:'Airport transfer to conclude the birding and lakes specialist circuit.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','Mabamba Canoe Trip','Kazinga Channel Boat Trip','All Park Fees','Full Board','Lodge Accommodation','Domestic & Regional Flights','All Transfers'] },

  { id:'p25', name:'Luxury Fly-in Gorilla & Mara', dest:'Multi-country', duration:'7 Days', emoji:'🛩️',
    price:5200, currency:'USD', perPerson:true, accom:'ultra',
    tag:'multi', tags:['multi','uganda'], badge:'Ultra-Luxury Fly-in', image:'luxury-flyin-gorilla-mara.jpg',
    desc:'The fastest, most comfortable way to see both icons — private-guided game drives in an exclusive Mara concession, then a chartered flight straight to gorilla trekking in Bwindi.',
    highlights:['Private Mara Concession','Chartered Flights','Mountain Gorilla Trekking','Minimal Road Time'],
    itinerary:[
      { day:'Day 1', title:'Fly into Masai Mara (Luxury Camp Arrival)', desc:'Arrival at a private conservancy or premium Mara concession with exclusive access. Afternoon game drive targeting high-density predator zones.' },
      { day:'Day 2', title:'Mara Private-Guided Drives', desc:'Priority morning and evening drives with a private vehicle and guide for tailored, uncrowded sightings.' },
      { day:'Day 3', title:'Morning Mara Drive & Charter to Entebbe/Bwindi Region', desc:'A final morning drive followed by a comfortable air transfer that minimises road time and maximises rest.' },
      { day:'Day 4', title:'Arrival in Bwindi Luxury Lodge & Pre-Trek Briefing', desc:'Relaxation and conservation talks at a top-tier forest lodge ahead of the following day\'s trek.' },
      { day:'Day 5', title:'Gorilla Trekking and Luxury Lodge Recovery', desc:'A morning gorilla trek followed by spa and leisure time at the lodge.' },
      { day:'Day 6', title:'Optional Community Visit or Nature Walks', desc:'Gentle activities and curated experiences in the forest-edge community.' },
      { day:'Day 7', title:'Charter Back to Entebbe/Nairobi and Departure', desc:'Final charter transfers and international connections conclude the ultra-luxury fly-in journey.' },
    ],
    includes:['Private Vehicle & Guide (Mara)','Gorilla Trekking Permit','All Charter Flights','All Park & Conservancy Fees','Full Board','Ultra-Luxury Lodge Accommodation','All Transfers'] },

  { id:'p26', name:'East Africa Classic Safari', dest:'Multi-country', duration:'10 Days', emoji:'🌍',
    price:3300, currency:'USD', perPerson:true, accom:'comfort',
    tag:'multi', tags:['multi','tanzania'], badge:'Classic Circuit', image:'east-africa-classic-safari.jpg',
    desc:'The definitive two-country journey — Masai Mara\'s big cats, the vast Serengeti plains, the wildlife amphitheatre of Ngorongoro Crater, and Lake Manyara\'s forest-and-lake contrast.',
    highlights:['Masai Mara Predators','Serengeti Migration Country','Ngorongoro Crater Rhino','Lake Manyara Tree-Climbing Lions'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Masai Mara', desc:'Rolling farmland gives way to expansive Mara plains and riverine acacia corridors. First arrivals of zebra, gazelle and resident lion prides. Afternoon orientation drive and dusk camp brief.' },
      { day:'Day 2', title:'Masai Mara Full Day', desc:'Open grasslands with kopjes and seasonal wetlands host lions, cheetahs and leopards at peak activity. Full-day drives with picnic stops and an optional Maasai cultural visit.' },
      { day:'Day 3', title:'Mara → Northern Serengeti', desc:'Mara plains continue into the Serengeti\'s broad grasslands and shallow valleys. Seasonal migration herds and hippos in seasonal pools. Remote-camp afternoon drive and night-sky viewing.' },
      { day:'Day 4', title:'Northern Serengeti Full Day', desc:'Vast plains with acacia patches and rocky kopjes hold dense wildebeest and zebra concentrations in season, plus resident lion and hyena packs. Dawn drives to river corridors and kopje vantage points.' },
      { day:'Day 5', title:'Central Serengeti', desc:'Rolling grasslands dotted with kopjes — classic predator country with consistent lion and leopard activity and abundant plains herbivores. Long drives with photographic hides.' },
      { day:'Day 6', title:'Serengeti → Ngorongoro Highlands', desc:'A climb from open plains into montane grassland and acacia woodland, with transitional herds and raptor watches along the escarpment. Sunset crater-rim viewpoints.' },
      { day:'Day 7', title:'Ngorongoro Crater Full Day', desc:'A spectacular caldera floor of grassland, woodland and swamp holds high densities of wildebeest, zebra, buffalo and resident black rhino. Full-day crater descent with picnic lunch.' },
      { day:'Day 8', title:'Ngorongoro → Lake Manyara', desc:'A shift to groundwater forest, cliff escarpments and an alkaline lake, with possible tree-climbing lions and seasonal waterbird flocks. Afternoon drive with riverside and lakeshore walks.' },
      { day:'Day 9', title:'Lake Manyara → Arusha Region', desc:'Rift-valley farmland and forest-edge patches lead toward Arusha, with local wetland species along the way. Relaxed morning then transfer for market or cultural visit options.' },
      { day:'Day 10', title:'Departure from Arusha/Kilimanjaro', desc:'Transfer to the airport with a short morning wrap-up and optional marketplace visit if time allows.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','All Park & Conservation Fees','Full Board Meals','Lodge/Tented Camp Accommodation','Cross-Border Transfers','Ngorongoro Crater Descent Fees','All Transfers'] },

  { id:'p27', name:'Great Migration Explorer', dest:'Multi-country', duration:'8 Days', emoji:'🦓',
    price:2900, currency:'USD', perPerson:true, accom:'comfort',
    tag:'multi', tags:['multi','tanzania'], badge:'Migration Focus', image:'great-migration-explorer.jpg',
    desc:'A migration-focused sprint across the Mara–Serengeti ecosystem, timed and routed for the best chance of dramatic river crossings and predator action.',
    highlights:['Wildebeest River Crossings','Northern Serengeti Herds','Central Serengeti Predators','Remote Fly-in Camps'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Masai Mara', desc:'Classic Mara plains and riparian strips, with plains herbivores building into larger herds in migration season. Orientation and evening drive to stake out likely crossing points.' },
      { day:'Day 2', title:'Mara Full Day (Migration Focus)', desc:'Riverine and floodplain mosaics may hold dramatic wildebeest crossings in season, with crocodiles and vulture congregations at kills. Full-day drives timed with crossing predictions.' },
      { day:'Day 3', title:'Cross into Northern Serengeti', desc:'Remote northern plains with sweeping vistas hold massive moving herds in season and large predator coalitions. Remote-camp or fly-in access minimises transit time.' },
      { day:'Day 4', title:'Northern Serengeti Full Day', desc:'Open grassland punctuated by riverine channels and kopjes hosts migration herds and concentrated predator activity. Long-range drives follow herd movements and crossing behaviour.' },
      { day:'Day 5', title:'Move to Central Serengeti', desc:'Rolling plains with rocky kopjes ideal for predators, with regular carcass sites and abundant resident game. Hidden photographic hides and kopje-based observation points.' },
      { day:'Day 6', title:'Central Serengeti Full Day', desc:'Classic plains with photo-friendly light and open sightlines hold lions, cheetahs and frequent hyena activity. Dawn-to-dusk drives focused on action sequences.' },
      { day:'Day 7', title:'Wind Down & Transfer to Arusha', desc:'Transitional highlands and farmland en route. Final morning drive then a scenic transfer toward Arusha for evening relaxation.' },
      { day:'Day 8', title:'Departure from Arusha/Kilimanjaro', desc:'Airport transfer and time to consolidate images and field notes before departure.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','All Park & Conservation Fees','Full Board','Remote Camp / Fly-in Access','Cross-Border Transfers','All Transfers'] },

  { id:'p28', name:'Amboseli to Kilimanjaro Safari', dest:'Multi-country', duration:'6 Days', emoji:'🏔️',
    price:1850, currency:'USD', perPerson:true, accom:'comfort',
    tag:'multi', badge:'Kilimanjaro Views', image:'amboseli-kilimanjaro-safari-tz.jpg',
    desc:'Elephant herds beneath Kilimanjaro in Kenya\'s Amboseli, then across the border to Tanzania\'s Lake Manyara and the baobab-studded plains of Tarangire.',
    highlights:['Amboseli Elephants & Kilimanjaro','Lake Manyara Tree-Climbing Lions','Tarangire Baobabs','Big Elephant Herds'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Amboseli', desc:'Short-grass plains and seasonal marshes with a panoramic Kilimanjaro backdrop. Iconic elephant herds, buffalo and plains groups. Sunset photography of elephants against Kilimanjaro.' },
      { day:'Day 2', title:'Amboseli Full Day', desc:'Marsh-fed wetlands and open plains showcase elephant family dynamics, hippos, lions and cheetah activity. All-day drives with a Maasai community cultural experience.' },
      { day:'Day 3', title:'Amboseli → Lake Manyara Area', desc:'A gradual shift to woodland and lake-edge habitat of the Rift floor, crossing into Tanzania. Evening lakeside drive and checklist consolidation.' },
      { day:'Day 4', title:'Lake Manyara Full Day', desc:'Groundwater forest, alkaline lake and rift cliffs hold possible tree-climbing lions, seasonal flamingo flocks and diverse forest-edge primates. Forest and lake-edge drives.' },
      { day:'Day 5', title:'Tarangire Full Day', desc:'Baobab-dotted savanna and seasonal floodplain host massive elephant congregations, resident predators and abundant plains ungulates. Sunset drives among dramatic baobabs.' },
      { day:'Day 6', title:'Transfer to Arusha and Departure', desc:'Final morning game drive before the airport transfer for outbound flights.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','All Park & Conservation Fees','Full Board','Lodge Accommodation','Cross-Border Transfer','All Transfers'] },

  { id:'p29', name:'Lakes & Plains Adventure', dest:'Multi-country', duration:'9 Days', emoji:'🚤',
    price:2600, currency:'USD', perPerson:true, accom:'comfort',
    tag:'multi', badge:'Lakes & Plains Combo', image:'lakes-plains-adventure.jpg',
    desc:'Kenya\'s Rift Valley lakes — Naivasha and Nakuru — flow into the Masai Mara, then across the border into the Serengeti and Ngorongoro Crater.',
    highlights:['Lake Naivasha Boat Ride','Lake Nakuru Flamingos','Masai Mara Migration','Ngorongoro Crater'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Lake Naivasha', desc:'Freshwater lake with papyrus fringes and riparian woodland, home to hippos, African fish eagle and abundant waterbird life. Afternoon boat trip and Crescent Island walk.' },
      { day:'Day 2', title:'Naivasha → Lake Nakuru', desc:'Alkaline lake environment with short grass margins and escarpment viewpoints. Seasonal flamingos, pelicans and resident rhino and buffalo. Lakeshore scanning at sunrise.' },
      { day:'Day 3', title:'Lake Nakuru Full Day', desc:'Expanded lakeshore, reedbeds and woodland pockets offer good rhino observations and waterbird diversity. Full-day lake circuit with hides and photo stops.' },
      { day:'Day 4', title:'Nakuru → Masai Mara', desc:'Transition from Rift Valley to extensive savanna and riverine mosaics of the Mara, with plains herds and predator concentrations upon arrival.' },
      { day:'Day 5', title:'Masai Mara Full Day', desc:'Broad plains, kopjes and riverine corridors hold big cats, hyenas and abundant herbivores, with seasonal migration spectacle. Optional cultural visit or balloon departure.' },
      { day:'Day 6', title:'Mara → Serengeti (Cross-Border)', desc:'The Mara ecosystem flows into Serengeti plains and kopjes, with continuity of migration and resident predators. Scenic cross-border transfer and afternoon Serengeti drive.' },
      { day:'Day 7', title:'Serengeti Full Day', desc:'Wide-open savanna with isolated kopjes hosts lions, cheetahs, hyenas and large herbivore aggregations. Early-morning kopje vantage and late-afternoon plains drives.' },
      { day:'Day 8', title:'Serengeti → Ngorongoro Highlands', desc:'An ascent to montane grassland and crater-rim vistas, with transitional species and raptor watching from the rim, ending at a sunset viewpoint.' },
      { day:'Day 9', title:'Ngorongoro Crater Drive & Transfer to Arusha', desc:'The crater floor holds high densities of mammals including black rhino, buffalo and predators. Full-day crater drive with picnic, then late transfer to Arusha.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','All Park & Conservation Fees','Full Board','Lodge/Tented Camp Accommodation','Lake Naivasha Boat Ride','Ngorongoro Crater Descent Fees','All Transfers'] },

  { id:'p30', name:'Northern Circuit Expedition', dest:'Multi-country', duration:'12 Days', emoji:'🧭',
    price:4400, currency:'USD', perPerson:true, accom:'luxury',
    tag:'multi', badge:'Comprehensive Expedition', image:'northern-circuit-expedition.jpg',
    desc:'A grand twelve-day sweep from Samburu\'s northern specialists and Ol Pejeta\'s rhinos, through the Masai Mara, into the Serengeti, Ngorongoro Crater and Tarangire.',
    highlights:['Samburu Northern Specialists','Ol Pejeta Rhino Sanctuary','Masai Mara & Serengeti Migration','Ngorongoro Crater','Tarangire Elephants'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Samburu', desc:'Semi-arid acacia scrub, riverine gallery forest and rocky kopjes. Northern specials such as Grevy\'s zebra, gerenuk and reticulated giraffe at the Ewaso Ng\'iro. Evening river transect.' },
      { day:'Day 2', title:'Samburu Full Day', desc:'Thornbush and riverine mosaics hold unique northern species and predators using river edges as hunting grounds. Morning and late-afternoon specialist drives.' },
      { day:'Day 3', title:'Samburu → Laikipia/Ol Pejeta', desc:'Conservancy country with river channels, ranchlands and small wetlands. Rhinos at Ol Pejeta, elephants, lions and diverse birdlife. Conservancy walks and rhino sanctuary visit.' },
      { day:'Day 4', title:'Laikipia Full Day', desc:'Open plains, riverine belts and private conservancies with potential wild dog sightings and abundant raptors. Guided conservancy drives and photographic hides.' },
      { day:'Day 5', title:'Laikipia → Masai Mara', desc:'A shift to Mara savanna and river corridors, with a high density of predators and large herbivore aggregations upon arrival. Evening drive and camp briefing.' },
      { day:'Day 6', title:'Masai Mara Full Day', desc:'Dawn and dusk drives focus on predator behaviour and migration activity where present across the Mara\'s plains and riverine corridors.' },
      { day:'Day 7', title:'Masai Mara Full Day', desc:'Continued intensive game drives, with an optional balloon safari and community visits available.' },
      { day:'Day 8', title:'Mara → Serengeti Cross-Border Transfer', desc:'Northern Serengeti\'s remote plains hold herd movement corridors and predator tracking sites. Afternoon remote-drive in quieter Serengeti zones.' },
      { day:'Day 9', title:'Serengeti Full Day', desc:'Full-day drives across kopje country with prolonged predator observation and abundant resident game.' },
      { day:'Day 10', title:'Serengeti → Ngorongoro Highlands', desc:'A climb into the highlands with a crater-rim sunset stop en route.' },
      { day:'Day 11', title:'Ngorongoro Crater Drive', desc:'Dense crater-floor biodiversity offers excellent black rhino chances, abundant grazers and a concentration of predators. Full-day crater descent with picnic lunch.' },
      { day:'Day 12', title:'Tarangire Half-Day → Arusha Departure', desc:'A morning drive among Tarangire\'s baobabs and elephant herds, then transfer to Arusha for departure.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','All Park & Conservancy Fees','Full Board','Luxury Lodges & Tented Camps','Ol Pejeta Rhino Sanctuary Visit','Ngorongoro Crater Descent Fees','All Transfers','Balloon Safari (optional, extra cost)'] },

  { id:'p31', name:'Southern Highlights', dest:'Multi-country', duration:'7 Days', emoji:'🌵',
    price:2050, currency:'USD', perPerson:true, accom:'comfort',
    tag:'multi', badge:'Two-Country Highlights', image:'southern-highlights-tz.jpg',
    desc:'Kenya\'s volcanic Tsavo wilderness and Kilimanjaro-backed Amboseli, followed by a crossing into Tanzania\'s baobab-studded Tarangire.',
    highlights:['Mzima Springs','Tsavo Red-Dust Elephants','Amboseli & Kilimanjaro','Tarangire Baobabs'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Tsavo West', desc:'Volcanic ridges, Shetani lava flows and riverine springs at Mzima. Hippos and crocodiles at the springs, robust elephant and buffalo numbers. Visit to Mzima Springs pools.' },
      { day:'Day 2', title:'Tsavo West Full Day', desc:'Mixed woodland and lava-flow terrain conceal leopards in dense thickets alongside elephant herds. Scenic drives and sunset photography across lava features.' },
      { day:'Day 3', title:'Tsavo West → Tsavo East Transfer', desc:'A move to red-dust plains and expansive open country, home to iconic red-dust elephants, large plains herds and resident predators. Wide-ranging drives with picnic lunches.' },
      { day:'Day 4', title:'Tsavo East → Amboseli Transfer', desc:'Transition from red-soil plains to Kilimanjaro-backed Amboseli marshes, with elephants and marsh-edge species. Sunset Kilimanjaro silhouette photography.' },
      { day:'Day 5', title:'Amboseli Full Day', desc:'Full-day drives around marshes and short-grass plains, following elephant herds and resident predators.' },
      { day:'Day 6', title:'Amboseli → Tarangire (Tanzania)', desc:'Baobab-studded Tarangire landscape with seasonal wetlands holds huge elephant concentrations, diverse ungulates and predators. Late-afternoon drives among dramatic baobabs.' },
      { day:'Day 7', title:'Tarangire → Arusha and Departure', desc:'A final morning drive before the transfer for outbound flights.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','All Park & Conservation Fees','Full Board','Lodge Accommodation','Mzima Springs Visit','Cross-Border Transfer','All Transfers'] },

  { id:'p32', name:'Kenya–Tanzania Photographic Safari', dest:'Multi-country', duration:'10 Days', emoji:'📷',
    price:3600, currency:'USD', perPerson:true, accom:'luxury',
    tag:'multi', badge:'Photography Specialist', image:'kenya-tanzania-photographic-safari.jpg',
    desc:'Built for photographers — golden-hour drives, guided hides and vantage points across the Mara, Serengeti, Ngorongoro Crater and Lake Manyara, with a dedicated portfolio-review day.',
    highlights:['Golden Hour Game Drives','Guided Photo Hides','Optional Balloon Aerial Shots','Portfolio Review Day'],
    itinerary:[
      { day:'Day 1', title:'Mara Arrival & Orientation', desc:'Open savanna light and kopje silhouettes set the stage for initial big-cat and plains-herd framing. Composition and lighting orientation with a field talk on technique.' },
      { day:'Day 2-4', title:'Mara & Move into Serengeti', desc:'Plains, floodplains and kopjes form an excellent photographic stage for high-action predator sequences and seasonal migration scenes. Drives timed for golden hour, optional balloon.' },
      { day:'Day 5', title:'Central Serengeti Photography Day', desc:'Use of hides and vantage points for action and portrait shots of predators and elephants across classic Serengeti terrain.' },
      { day:'Day 6', title:'Serengeti → Ngorongoro Rim Transfer', desc:'Crater-rim sunset panoramas offer prime landscape photography as the group ascends into the highlands.' },
      { day:'Day 7', title:'Ngorongoro Crater Photography Day', desc:'Close-range wildlife portraiture in the crater amphitheatre, home to dense concentrations of grazers and predators.' },
      { day:'Day 8', title:'Lake Manyara Dawn Shoots', desc:'Forest edge and alkaline lake reflective surfaces offer reflection shots of seasonal flamingos and forest-mammal portraits.' },
      { day:'Day 9', title:'Portfolio Consolidation & Re-shoots', desc:'Field review, targeted re-shoots and composition feedback to round out the trip\'s image collection.' },
      { day:'Day 10', title:'Departure via Arusha/Kilimanjaro', desc:'Final transfers and image-backup advice before international departure.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','Specialist Photography Guide','All Park & Conservation Fees','Full Board','Luxury Lodges & Tented Camps','Ngorongoro Crater Descent Fees','All Transfers','Balloon Safari (optional, extra cost)'] },

  { id:'p33', name:'Big Five Safari Circuit', dest:'Multi-country', duration:'9 Days', emoji:'🐾',
    price:3100, currency:'USD', perPerson:true, accom:'luxury',
    tag:'multi', badge:'Big Five Circuit', image:'big-five-safari-circuit.jpg',
    desc:'A focused two-country pursuit of the Big Five — Ol Pejeta\'s rhino sanctuary, the Masai Mara\'s predators, and a Serengeti-to-Ngorongoro finale.',
    highlights:['Ol Pejeta Rhino Sanctuary','Masai Mara Big Five','Serengeti Predators','Ngorongoro Crater Rhino'],
    itinerary:[
      { day:'Day 1', title:'Laikipia Arrival (Ol Pejeta)', desc:'Private conservancy with river channels and open plains offers a high rhino encounter probability, elephants, and healthy carnivore presence. Rhino sanctuary visit.' },
      { day:'Day 2', title:'Laikipia Full Day', desc:'Conservancy walks and waterhole hides provide photographic opportunities among the conservancy\'s resident wildlife.' },
      { day:'Day 3', title:'Laikipia → Masai Mara Transfer', desc:'Transfer south to the Mara, with an evening game drive upon arrival to begin the Big Five search in earnest.' },
      { day:'Day 4-5', title:'Masai Mara Full Days', desc:'Iconic plains and riverine belts hold lions, leopards, cheetahs, buffalo and elephants — the focus is squarely on Big Five occurrence. All-day predator-focused drives.' },
      { day:'Day 6', title:'Mara → Serengeti Cross-Border', desc:'Afternoon Serengeti drive in remote areas continues the Big Five pursuit across the border into Tanzania.' },
      { day:'Day 7', title:'Serengeti Full Day', desc:'Plains drives and kopje exploration for predator observation across the Serengeti\'s classic terrain.' },
      { day:'Day 8', title:'Serengeti → Ngorongoro Rim Transfer', desc:'Crater-rim viewpoints and sunset mark the ascent into the highlands ahead of the final crater descent.' },
      { day:'Day 9', title:'Ngorongoro Crater Drive & Departure', desc:'An intensive crater-floor game drive targets any remaining Big Five sightings before the transfer to Arusha.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','All Park & Conservancy Fees','Full Board','Luxury Lodges & Tented Camps','Ol Pejeta Rhino Sanctuary Visit','Ngorongoro Crater Descent Fees','All Transfers'] },

  { id:'p34', name:'Rift Valley & Crater Safari', dest:'Multi-country', duration:'8 Days', emoji:'🦩',
    price:2300, currency:'USD', perPerson:true, accom:'comfort',
    tag:'multi', badge:'Crater Special', image:'rift-valley-crater-safari.jpg',
    desc:'Kenya\'s flamingo-lined Lake Nakuru and the Masai Mara connect through to Tanzania\'s Lake Manyara and the unmatched Ngorongoro Crater.',
    highlights:['Lake Nakuru Flamingos','Masai Mara Predators','Lake Manyara Tree-Climbing Lions','Ngorongoro Crater'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Lake Nakuru', desc:'A shallow alkaline lake with reedbeds and escarpment perches holds seasonal flamingo flocks, pelicans and resident black rhino. Lakeshore dawn watches and raptor scanning.' },
      { day:'Day 2', title:'Nakuru Full Day', desc:'A lakeshore loop and raptor viewpoints on the escarpment round out exploration of Nakuru\'s varied habitats.' },
      { day:'Day 3', title:'Nakuru → Masai Mara Transfer', desc:'Transfer to the Mara with an evening game drive on arrival, entering predator-rich savanna country.' },
      { day:'Day 4', title:'Masai Mara Full Day', desc:'A full day of predator and plains exploration across the Mara\'s riverine corridors and open grassland.' },
      { day:'Day 5', title:'Mara → Lake Manyara Transfer', desc:'A transition to lake-edge habitats and forest drives, crossing into Tanzania toward Lake Manyara.' },
      { day:'Day 6', title:'Lake Manyara Full Day', desc:'Groundwater forest and alkaline lake hold forest mammals, seasonal flamingos and possible tree-climbing lions. Forest-edge drives and lakeshore exploration.' },
      { day:'Day 7', title:'Manyara → Ngorongoro Rim Transfer', desc:'An ascent to the highlands ending with sunset at the crater rim.' },
      { day:'Day 8', title:'Ngorongoro Crater Drive & Departure', desc:'A final crater drive through the caldera\'s dense wildlife before transfer to Arusha/Kilimanjaro.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','All Park & Conservation Fees','Full Board','Lodge/Tented Camp Accommodation','Ngorongoro Crater Descent Fees','Cross-Border Transfer','All Transfers'] },

  { id:'p35', name:'Ultimate East Africa Discovery', dest:'Multi-country', duration:'12 Days', emoji:'🌟',
    price:4600, currency:'USD', perPerson:true, accom:'luxury',
    tag:'multi', badge:'Ultimate Discovery', image:'ultimate-east-africa-discovery.jpg',
    desc:'The most complete East Africa itinerary on offer — highland Aberdares, Samburu\'s north, the Masai Mara, Serengeti, Ngorongoro Crater and Tarangire, in one twelve-day grand tour.',
    highlights:['Aberdares Highland Forest','Samburu Northern Specialists','Extended Masai Mara','Serengeti & Ngorongoro','Tarangire Baobabs'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Aberdares', desc:'Highland forest, moorland and waterhole platforms hold highland-specialist mammals and montane birdlife. Evening waterhole platform sessions and forest walks.' },
      { day:'Day 2', title:'Aberdares Full Day', desc:'Forest walks, ridge scans and moorland exploration in search of the range\'s montane species.' },
      { day:'Day 3', title:'Aberdares → Samburu Transfer', desc:'A descent into semi-arid Ewaso Ng\'iro country rich in adaptive northern species. Afternoon riverbank drive and sunset camp arrival.' },
      { day:'Day 4', title:'Samburu Full Day', desc:'Targeted drives for regional specialists and riverine wildlife across Samburu\'s thornbush and gallery-forest habitat.' },
      { day:'Day 5', title:'Samburu → Masai Mara', desc:'A drive south to the Mara with en-route stops and an evening game drive on arrival.' },
      { day:'Day 6-7', title:'Masai Mara Extended Drives', desc:'Two full days of predator tracking and migration observation where seasonal, with an optional balloon safari over the plains.' },
      { day:'Day 8', title:'Mara → Serengeti Cross-Border', desc:'A remote Serengeti arrival and late-afternoon drive across the border into Tanzania\'s vast plains.' },
      { day:'Day 9', title:'Serengeti Full Day', desc:'Kopje and plains exploration with sustained game-viewing across the Serengeti\'s classic predator country.' },
      { day:'Day 10', title:'Serengeti → Ngorongoro Highlands', desc:'An ascent to the highlands with a crater-rim viewpoint at sunset.' },
      { day:'Day 11', title:'Ngorongoro Crater Drive', desc:'A whole-day crater drive with picnic lunch, focused on rhino sightings and dense herbivore packs within the caldera.' },
      { day:'Day 12', title:'Tarangire Half-Day → Arusha Departure', desc:'A morning Tarangire drive among baobabs and elephant herds, then a final transfer to Arusha/Kilimanjaro for departure.' },
    ],
    includes:['4x4 Vehicles & Guides (Both Countries)','All Park & Conservancy Fees','Full Board','Luxury Lodges & Tented Camps','Ngorongoro Crater Descent Fees','All Transfers','Balloon Safari (optional, extra cost)'] },

  { id:'p36', name:'Rwanda Gorilla Trekking Express', dest:'Rwanda', duration:'4 Days', emoji:'🦍',
    price:2600, currency:'USD', perPerson:true, accom:'luxury',
    tag:'rwanda', badge:'Gorilla Icon', image:'rwanda-gorilla-trekking-express.jpg',
    desc:'A fast, focused trip to the Land of a Thousand Hills — mountain gorilla trekking in Volcanoes National Park, with time to unwind on the shores of Lake Kivu.',
    highlights:['Mountain Gorilla Trekking','Golden Monkey Tracking','Virunga Volcano Views','Lake Kivu Relaxation'],
    itinerary:[
      { day:'Day 1', title:'Kigali → Volcanoes National Park', desc:'A scenic drive north through Rwanda\'s terraced hills to the foothills of the Virunga volcanoes. Afternoon at leisure with mountain views and a pre-trek briefing.' },
      { day:'Day 2', title:'Mountain Gorilla Trekking', desc:'A permit-led trek through bamboo and montane forest to spend a profound hour with a habituated gorilla family, guided by experienced trackers.' },
      { day:'Day 3', title:'Golden Monkey Tracking & Transfer to Lake Kivu', desc:'A morning trek in search of playful golden monkeys in the bamboo zone, followed by a relaxed transfer down to the shores of Lake Kivu.' },
      { day:'Day 4', title:'Lake Kivu → Kigali Departure', desc:'A leisurely lakeside morning before the transfer back to Kigali for onward international flights.' },
    ],
    includes:['Gorilla Trekking Permit','Golden Monkey Permit','4x4 Vehicle & Guide','All Park Fees','Full Board','Luxury Lodge Accommodation','All Transfers'] },

  { id:'p37', name:'Rwanda Complete Safari', dest:'Rwanda', duration:'7 Days', emoji:'🌋',
    price:4100, currency:'USD', perPerson:true, accom:'luxury',
    tag:'rwanda', badge:'Ultimate Rwanda', image:'rwanda-complete-safari.jpg',
    desc:'Rwanda in full — mountain gorillas and golden monkeys in Volcanoes National Park, chimpanzee trekking in ancient Nyungwe Forest, and a Big Five finale at Akagera.',
    highlights:['Mountain Gorilla Trekking','Nyungwe Canopy Walk & Chimps','Akagera Big Five','Lake Kivu Boat Cruise'],
    itinerary:[
      { day:'Day 1', title:'Kigali → Volcanoes National Park', desc:'Transfer north to the Virunga foothills, with an afternoon city stop at the Kigali Genocide Memorial en route for historical context.' },
      { day:'Day 2', title:'Mountain Gorilla Trekking', desc:'A full-day permit-led trek to spend an unforgettable hour observing a mountain gorilla family in dense montane forest.' },
      { day:'Day 3', title:'Volcanoes → Nyungwe Forest', desc:'A scenic drive south through Rwanda\'s hills to ancient Nyungwe Forest, one of Africa\'s oldest rainforests. Evening briefing on the following day\'s canopy walk.' },
      { day:'Day 4', title:'Nyungwe Canopy Walk & Chimpanzee Trekking', desc:'A dawn chimpanzee trek through the forest, followed by a walk across the suspended canopy walkway high above the treetops.' },
      { day:'Day 5', title:'Nyungwe → Akagera National Park', desc:'A long transfer east to Akagera, Rwanda\'s savanna reserve on the Tanzanian border, arriving in time for an evening game drive.' },
      { day:'Day 6', title:'Akagera Full Day', desc:'Full-day game drives and a boat safari on Lake Ihema in search of the Big Five, hippos and crocodiles amid classic East African savanna.' },
      { day:'Day 7', title:'Akagera → Kigali Departure', desc:'A final morning game drive before the transfer back to Kigali for international departure.' },
    ],
    includes:['Gorilla Trekking Permit','Chimpanzee Permit','4x4 Vehicle & Guide','All Park Fees','Full Board','Luxury Lodge Accommodation','Lake Ihema Boat Safari','All Transfers'] },
];

// image: just the filename — upload it to the Images/ folder on GitHub
var GALLERY_ITEMS = [
  { emoji:'🦁', label:'Lions of the Mara', color:'#3D1A00', image:'gallery-lions.jpg' },
  { emoji:'🐘', label:'Elephant Herds', color:'#1A2E1A', image:'gallery-elephants.jpg' },
  { emoji:'🦒', label:'Giraffes at Sunset', color:'#3D2E00', image:'gallery-giraffes.jpg' },
  { emoji:'🦓', label:'Zebra Migration', color:'#1A1A2E', image:'gallery-zebras.jpg' },
  { emoji:'🦍', label:'Mountain Gorillas', color:'#1A3D00', image:'gallery-gorillas.jpg' },
  { emoji:'🌅', label:'Savannah Sunrise', color:'#3D1A00', image:'gallery-sunrise.jpg' },
  { emoji:'🦏', label:'Rhino at the Waterhole', color:'#2E1A00', image:'gallery-rhino.jpg' },
  { emoji:'🏖️', label:'Zanzibar Coast', color:'#00203D', image:'gallery-zanzibar-coast.jpg' },
  { emoji:'🐃', label:'Cape Buffalo', color:'#1A1A1A', image:'gallery-buffalo.jpg' },
  { emoji:'🐒', label:'Baboon Troop', color:'#3D2E00', image:'gallery-baboons.jpg' },
  { emoji:'🦁', label:'Lion Cubs at Play', color:'#3D1A00', image:'gallery-lion-cubs.jpg' },
  { emoji:'🦓', label:'Grevy\'s Zebra of Samburu', color:'#1A1A2E', image:'gallery-grevys-zebra.jpg' },
  { emoji:'🦁', label:'Lions Overlooking Nairobi', color:'#2E1A00', image:'gallery-nairobi-lion.jpg' },
  { emoji:'🐘', label:'Samburu Elephant', color:'#1A2E1A', image:'gallery-samburu-elephant.jpg' },
];

// image: put a guest photo filename here (optional — initials show if missing)
var TESTIMONIALS = [
  { stars:5, text:'The gorilla trekking in Uganda was without doubt the most profound wildlife encounter of my life. Our guide was extraordinary — his knowledge of the forest and the gorilla families made the experience unforgettable.', name:'James & Sarah P.', from:'London, United Kingdom', initials:'JP', image:'testimonial-1.jpg' },
  { stars:5, text:'We have done safaris with other operators, but Mother Nature Safaris is on a completely different level. The attention to detail, the lodge selection, the guide — every aspect was perfectly curated. We will absolutely be back.', name:'Melissa C.', from:'New York, USA', initials:'MC', image:'testimonial-2.jpg' },
  { stars:5, text:'Witnessed the Great Migration in the Maasai Mara — a scene that will stay with me forever. The team arranged everything seamlessly. Our driver-guide John was phenomenal, always finding the action before anyone else.', name:'Thomas & Ana B.', from:'São Paulo, Brazil', initials:'TB', image:'testimonial-3.jpg' },
];

var POPULAR_TOURS = [
  { name:'Maasai Mara 3 Days', price:'from $850', emoji:'🦁' },
  { name:'Tanzania Serengeti 5 Days', price:'from $1,680', emoji:'🐃' },
  { name:'Uganda Gorilla Trek', price:'from $2,200', emoji:'🦍' },
  { name:'Kenya + Tanzania 8 Days', price:'from $2,800', emoji:'🌍' },
];

// ── RENDERING ─────────────────────────────────────

function renderDestinations(){
  var g = document.getElementById('destGrid'); if(!g) return;
  g.innerHTML = DESTINATIONS.map(function(d){
    return '<div class="dest-card" data-dest="'+d.id+'">'+
      '<div class="dest-card-bg" style="background:'+d.color+'">'+imgOrEmoji(d.image,d.emoji)+'</div>'+
      '<div class="dest-overlay"></div>'+
      '<div class="dest-info">'+
        '<span class="dest-flag">'+d.flag+'</span>'+
        '<div class="dest-name">'+d.name+'</div>'+
        '<div class="dest-tag">'+d.tag+'</div>'+
        '<div class="dest-count">'+d.count+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
  // Click dest → scroll to packages filtered
  g.querySelectorAll('.dest-card').forEach(function(card){
    card.addEventListener('click', function(){
      var dest = card.dataset.dest;
      var tabMap = { zanzibar:'zanzibar', uganda:'uganda', tanzania:'tanzania', rwanda:'rwanda', kenya:'kenya' };
      setActivePackageTab(tabMap[dest] || 'kenya');
      document.getElementById('packages').scrollIntoView({ behavior:'smooth' });
    });
  });
}

// Renders the 12 named Tanzania destinations (Serengeti, Ngorongoro, Ruaha, etc.)
// using the exact same card markup/CSS as the country-level destination cards above.
// Renders the 12 named Kenya destinations (Maasai Mara, Amboseli, Samburu, etc.)
// using the same card markup/CSS as the other destination grids.
function renderKenyaDestinations(){
  var g = document.getElementById('keDestGrid'); if(!g) return;
  g.innerHTML = KENYA_DESTINATIONS.map(function(d){
    return '<div class="dest-card" data-dest="'+d.id+'">'+
      '<div class="dest-card-bg" style="background:'+d.color+'">'+imgOrEmoji(d.image,d.emoji)+'</div>'+
      '<div class="dest-overlay"></div>'+
      '<div class="dest-info">'+
        '<span class="dest-flag">'+d.flag+'</span>'+
        '<div class="dest-name">'+d.name+'</div>'+
        '<div class="dest-tag">'+d.tag+'</div>'+
        '<div class="dest-count">'+d.count+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
  g.querySelectorAll('.dest-card').forEach(function(card){
    card.addEventListener('click', function(){
      setActivePackageTab('kenya');
      document.getElementById('packages').scrollIntoView({ behavior:'smooth' });
    });
  });
}

function renderTanzaniaDestinations(){
  var g = document.getElementById('tzDestGrid'); if(!g) return;
  g.innerHTML = TANZANIA_DESTINATIONS.map(function(d){
    return '<div class="dest-card" data-dest="'+d.id+'">'+
      '<div class="dest-card-bg" style="background:'+d.color+'">'+imgOrEmoji(d.image,d.emoji)+'</div>'+
      '<div class="dest-overlay"></div>'+
      '<div class="dest-info">'+
        '<span class="dest-flag">'+d.flag+'</span>'+
        '<div class="dest-name">'+d.name+'</div>'+
        '<div class="dest-tag">'+d.tag+'</div>'+
        '<div class="dest-count">'+d.count+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
  // All Tanzania destinations funnel into the Tanzania package filter,
  // since packages aren't tagged by individual park.
  g.querySelectorAll('.dest-card').forEach(function(card){
    card.addEventListener('click', function(){
      setActivePackageTab('tanzania');
      document.getElementById('packages').scrollIntoView({ behavior:'smooth' });
    });
  });
}

// Renders the 12 named Uganda destinations (Bwindi, Queen Elizabeth, Murchison Falls, etc.)
// using the same card markup/CSS as the other destination grids.
function renderUgandaDestinations(){
  var g = document.getElementById('ugDestGrid'); if(!g) return;
  g.innerHTML = UGANDA_DESTINATIONS.map(function(d){
    return '<div class="dest-card" data-dest="'+d.id+'">'+
      '<div class="dest-card-bg" style="background:'+d.color+'">'+imgOrEmoji(d.image,d.emoji)+'</div>'+
      '<div class="dest-overlay"></div>'+
      '<div class="dest-info">'+
        '<span class="dest-flag">'+d.flag+'</span>'+
        '<div class="dest-name">'+d.name+'</div>'+
        '<div class="dest-tag">'+d.tag+'</div>'+
        '<div class="dest-count">'+d.count+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
  // All Uganda destinations funnel into the Uganda package filter,
  // since packages aren't tagged by individual park.
  g.querySelectorAll('.dest-card').forEach(function(card){
    card.addEventListener('click', function(){
      setActivePackageTab('uganda');
      document.getElementById('packages').scrollIntoView({ behavior:'smooth' });
    });
  });
}

// Renders the 12 named Zanzibar destinations (Stone Town, Nungwi, Jozani, etc.)
// using the same card markup/CSS as the other destination grids.
function renderZanzibarDestinations(){
  var g = document.getElementById('znzDestGrid'); if(!g) return;
  g.innerHTML = ZANZIBAR_DESTINATIONS.map(function(d){
    return '<div class="dest-card" data-dest="'+d.id+'">'+
      '<div class="dest-card-bg" style="background:'+d.color+'">'+imgOrEmoji(d.image,d.emoji)+'</div>'+
      '<div class="dest-overlay"></div>'+
      '<div class="dest-info">'+
        '<span class="dest-flag">'+d.flag+'</span>'+
        '<div class="dest-name">'+d.name+'</div>'+
        '<div class="dest-tag">'+d.tag+'</div>'+
        '<div class="dest-count">'+d.count+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
  g.querySelectorAll('.dest-card').forEach(function(card){
    card.addEventListener('click', function(){
      setActivePackageTab('zanzibar');
      document.getElementById('packages').scrollIntoView({ behavior:'smooth' });
    });
  });
}

// Renders the 12 named Rwanda destinations (Volcanoes NP, Nyungwe, Lake Kivu, etc.)
// using the same card markup/CSS as the other destination grids.
function renderRwandaDestinations(){
  var g = document.getElementById('rwDestGrid'); if(!g) return;
  g.innerHTML = RWANDA_DESTINATIONS.map(function(d){
    return '<div class="dest-card" data-dest="'+d.id+'">'+
      '<div class="dest-card-bg" style="background:'+d.color+'">'+imgOrEmoji(d.image,d.emoji)+'</div>'+
      '<div class="dest-overlay"></div>'+
      '<div class="dest-info">'+
        '<span class="dest-flag">'+d.flag+'</span>'+
        '<div class="dest-name">'+d.name+'</div>'+
        '<div class="dest-tag">'+d.tag+'</div>'+
        '<div class="dest-count">'+d.count+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
  g.querySelectorAll('.dest-card').forEach(function(card){
    card.addEventListener('click', function(){
      setActivePackageTab('rwanda');
      document.getElementById('packages').scrollIntoView({ behavior:'smooth' });
    });
  });
}

var PKG_TABS_DEF = [
  { key:'all',      label:'All Safaris' },
  { key:'kenya',    label:'🇰🇪 Kenya' },
  { key:'tanzania', label:'🇹🇿 Tanzania' },
  { key:'uganda',   label:'🇺🇬 Uganda' },
  { key:'zanzibar', label:'🏖️ Zanzibar' },
  { key:'rwanda',   label:'🇷🇼 Rwanda' },
  { key:'multi',    label:'🌍 Multi-Country' },
];
var activeTab = 'all';

function renderPackageTabs(){
  var t = document.getElementById('pkgTabs'); if(!t) return;
  t.innerHTML = PKG_TABS_DEF.map(function(tab){
    return '<button class="pkg-tab'+(tab.key===activeTab?' active':'')+'" data-tab="'+tab.key+'">'+tab.label+'</button>';
  }).join('');
  t.querySelectorAll('.pkg-tab').forEach(function(btn){
    btn.addEventListener('click', function(){
      setActivePackageTab(btn.dataset.tab);
    });
  });
}

function setActivePackageTab(key){
  activeTab = key;
  renderPackageTabs();
  renderPackages();
}

function renderPackages(){
  var g = document.getElementById('pkgGrid'); if(!g) return;
  var filtered = activeTab === 'all' ? PACKAGES : PACKAGES.filter(function(p){
    if (p.tag === activeTab) return true;
    if (Array.isArray(p.tags) && p.tags.indexOf(activeTab) !== -1) return true;
    return false;
  });
  if (!filtered.length){
    g.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">No packages found for this destination. <a href="#" style="color:var(--clay)" onclick="setActivePackageTab(\'all\');return false">View all packages</a></div>';
    return;
  }
  g.innerHTML = filtered.map(function(p){
    return '<div class="pkg-card" data-pkg-id="'+p.id+'">'+
      '<div class="pkg-img" style="background:linear-gradient(135deg,#2C1810,#'+randomDark()+')">'+
        imgOrEmoji(p.image,p.emoji)+
        '<span class="pkg-duration">'+p.duration+'</span>'+
        (p.badge?'<span class="pkg-badge-dest">'+p.badge+'</span>':'')+
      '</div>'+
      '<div class="pkg-body">'+
        '<div class="pkg-name">'+p.name+'</div>'+
        '<div class="pkg-desc">'+p.desc+'</div>'+
        '<div class="pkg-highlights">'+
          p.highlights.slice(0,3).map(function(h){ return '<span class="pkg-hl">'+h+'</span>'; }).join('')+
        '</div>'+
      '</div>'+
      '<div class="pkg-footer">'+
        '<div class="pkg-price"><span class="pkg-price-label">From per person</span>'+p.currency+' '+p.price.toLocaleString()+'</div>'+
        '<button class="btn-book-pkg" data-pkg-id="'+p.id+'">View Details</button>'+
      '</div>'+
    '</div>';
  }).join('');
  // Wire clicks
  g.querySelectorAll('.pkg-card').forEach(function(card){
    card.addEventListener('click', function(e){
      if (e.target.classList.contains('btn-book-pkg')) {
        openPackageModal(e.target.dataset.pkgId);
      } else {
        openPackageModal(card.dataset.pkgId);
      }
    });
  });
}

function randomDark(){ return ['4a2010','1e3a1e','3a2a0a','0a2a3a','2a1a3a','1a3a2a'][Math.floor(Math.random()*6)]; }

function renderGallery(){
  var g = document.getElementById('galleryGrid'); if(!g) return;
  g.innerHTML = GALLERY_ITEMS.map(function(item){
    return '<div class="gallery-item" style="background:'+item.color+'">'+
      imgOrEmoji(item.image,item.emoji)+
      '<div class="gallery-label">'+item.label+'</div>'+
    '</div>';
  }).join('');
}

function renderTestimonials(){
  var g = document.getElementById('testiGrid'); if(!g) return;
  g.innerHTML = TESTIMONIALS.map(function(t){
    return '<div class="testi-card">'+
      '<div class="testi-stars">★★★★★</div>'+
      '<div class="testi-text">"'+t.text+'"</div>'+
      '<div class="testi-author">'+
        '<div class="testi-av">'+imgOrEmojiInitials(t.image,t.initials)+'</div>'+
        '<div><div class="testi-name">'+t.name+'</div><div class="testi-from">'+t.from+'</div></div>'+
      '</div>'+
    '</div>';
  }).join('');
}

// ── HERO BACKGROUND SLIDESHOW ──────────────────────
// Builds one stacked <div> per configured image and crossfades between them.
// Any image that fails to load (not yet uploaded, wrong name, etc.) quietly
// removes itself rather than showing a broken-image icon — so you can add
// hero images one at a time and the slideshow just adapts as they arrive.
// With zero working images, the CSS gradient already on .hero-bg shows through.
var _heroSlideTimer = null;

function renderHeroSlideshow(){
  var host = document.getElementById('heroBg');
  if (!host) return;

  var slides = HERO_SLIDESHOW_IMAGES.map(function(key){ return resolvedImage(key); });

  host.innerHTML = '<div class="hero-bg-slides">' +
    slides.map(function(filename, i){
      return '<div class="hero-bg-slide' + (i === 0 ? ' active' : '') + '">' +
        '<img src="' + img(filename) + '" alt="" loading="' + (i === 0 ? 'eager' : 'lazy') + '" ' +
          'onerror="this.closest(\'.hero-bg-slide\').remove(); startHeroSlideshowCycle();">' +
      '</div>';
    }).join('') +
  '</div>';

  startHeroSlideshowCycle();
}

function startHeroSlideshowCycle(){
  var host = document.getElementById('heroBg');
  if (!host) return;
  if (_heroSlideTimer) clearInterval(_heroSlideTimer);

  var slideEls = host.querySelectorAll('.hero-bg-slide');
  if (!slideEls.length) return; // none loaded (yet) — gradient shows through

  var anyActive = Array.prototype.some.call(slideEls, function(el){ return el.classList.contains('active'); });
  if (!anyActive) slideEls[0].classList.add('active');
  if (slideEls.length < 2) return; // only one working photo — nothing to cycle between

  var current = Array.prototype.findIndex.call(slideEls, function(el){ return el.classList.contains('active'); });
  _heroSlideTimer = setInterval(function(){
    var els = host.querySelectorAll('.hero-bg-slide'); // re-query — a slide may have been removed since
    if (els.length < 2){ clearInterval(_heroSlideTimer); return; }
    els[current % els.length].classList.remove('active');
    current = (current + 1) % els.length;
    els[current].classList.add('active');
  }, 6000); // 6s per slide, overlaps nicely with the ~1.8s CSS crossfade
}

function renderPopularTours(){
  var el = document.getElementById('popularToursList'); if(!el) return;
  el.innerHTML = POPULAR_TOURS.map(function(t){
    return '<div class="popular-tour-item">'+
      '<span class="pt-emoji">'+t.emoji+'</span>'+
      '<span class="pt-name">'+t.name+'</span>'+
      '<span class="pt-price">'+t.price+'</span>'+
    '</div>';
  }).join('');
  el.querySelectorAll('.popular-tour-item').forEach(function(item,i){
    item.addEventListener('click', function(){
      scrollToSection('packages');
    });
  });
}

// ── PACKAGE MODAL ──────────────────────────────────
function openPackageModal(pkgId){
  var p = PACKAGES.find(function(x){ return x.id === pkgId; });
  if (!p) return;
  var itin = p.itinerary.map(function(d){
    return '<div class="itin-day">'+
      '<div class="itin-day-n">'+d.day.replace('Day ','').replace('Days ','')+'</div>'+
      '<div class="itin-day-info">'+
        '<div class="itin-day-title">'+d.title+'</div>'+
        '<div class="itin-day-desc">'+d.desc+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
  var includes = p.includes.map(function(inc){
    return '<div class="modal-inc-item">'+inc+'</div>';
  }).join('');
  document.getElementById('pkgModalContent').innerHTML =
    '<div class="modal-pkg-header" style="background:linear-gradient(135deg,var(--earth),var(--clay))">'+
      imgOrEmoji(p.image,p.emoji)+
      (p.badge?'<span class="modal-pkg-badge">'+p.badge+'</span>':'')+
    '</div>'+
    '<div class="modal-pkg-body">'+
      '<div class="modal-pkg-title">'+p.name+'</div>'+
      '<div class="modal-pkg-meta">'+
        '<div class="modal-meta-item">📍 '+p.dest+'</div>'+
        '<div class="modal-meta-item">⏱ '+p.duration+'</div>'+
        '<div class="modal-meta-item">🏕️ '+p.accom.charAt(0).toUpperCase()+p.accom.slice(1)+' level</div>'+
        '<div class="modal-meta-item">👥 Min. 2 persons</div>'+
      '</div>'+
      '<p style="font-size:.875rem;color:var(--muted);line-height:1.7;margin-bottom:20px">'+p.desc+'</p>'+
      '<div class="modal-section"><div class="modal-section-title">Itinerary</div><div class="modal-itinerary">'+itin+'</div></div>'+
      '<div class="modal-section"><div class="modal-section-title">What\'s Included</div><div class="modal-includes">'+includes+'</div></div>'+
      '<div class="modal-section"><div class="modal-section-title">Safari Highlights</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:8px">'+p.highlights.map(function(h){ return '<span class="pkg-hl" style="font-size:.8rem">'+h+'</span>'; }).join('')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="modal-footer">'+
      '<div class="modal-price-block"><span class="modal-price-label">From per person</span><div class="modal-price">'+p.currency+' '+p.price.toLocaleString()+'</div></div>'+
      '<button class="modal-book-btn" id="modalBookNowBtn" data-pkg="'+p.name+'" data-dest="'+p.dest+'">Book This Safari →</button>'+
    '</div>';
  document.getElementById('pkgModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  // Wire book button
  var bookBtn = document.getElementById('modalBookNowBtn');
  if (bookBtn) bookBtn.addEventListener('click', function(){
    closeModal('pkgModal');
    // Pre-fill booking form
    var pkgSel = document.getElementById('fPackage');
    if (pkgSel){
      // Try to match package
      var opts = pkgSel.options;
      for(var i=0;i<opts.length;i++){ if(opts[i].text.toLowerCase().indexOf(p.name.substring(0,8).toLowerCase())!==-1){ pkgSel.selectedIndex=i; break; } }
    }
    scrollToSection('contact');
    updatePriceEstimate();
  });
}

function closeModal(id){
  document.getElementById(id).classList.add('hidden');
  document.body.style.overflow = '';
}

// ── BOOKING FORM STEPS ──────────────────────────────
var currentStep = 1;

function showStep(n){
  [1,2,3].forEach(function(i){
    var el = document.getElementById('formStep'+i);
    if (el) el.classList.toggle('hidden', i!==n);
    var dot = document.getElementById('sd'+(i-1));
    if (dot){
      dot.classList.toggle('active', i===n);
      dot.classList.toggle('done', i<n);
    }
  });
  currentStep = n;
}

function validateStep1(){
  var first = document.getElementById('fFirst').value.trim();
  var last  = document.getElementById('fLast').value.trim();
  var email = document.getElementById('fEmail').value.trim();
  var phone = document.getElementById('fPhone').value.trim();
  var trav  = document.getElementById('fTravellers').value;
  if (!first||!last){ showToast('Please enter your full name','error'); return false; }
  if (!email||!/\S+@\S+\.\S+/.test(email)){ showToast('Please enter a valid email address','error'); return false; }
  if (!phone){ showToast('Please enter your phone number','error'); return false; }
  if (!trav){ showToast('Please select the number of travellers','error'); return false; }
  return true;
}

function validateStep2(){
  var dest = document.getElementById('fDest').value;
  var dur  = document.getElementById('fDuration').value;
  var arr  = document.getElementById('fArrival').value;
  var pkg  = document.getElementById('fPackage').value;
  if (!dest){ showToast('Please select a destination','error'); return false; }
  if (!dur){ showToast('Please select safari duration','error'); return false; }
  if (!arr){ showToast('Please select your arrival date','error'); return false; }
  if (arr){
    var today = new Date(); today.setHours(0,0,0,0);
    if (new Date(arr) < today){ showToast('Arrival date must be in the future','error'); return false; }
  }
  if (!pkg){ showToast('Please select a package (or choose Custom)','error'); return false; }
  return true;
}

// Escapes user-typed text before it's inserted as innerHTML, so a name/notes
// field containing HTML (e.g. "<img src=x onerror=...>") is shown as plain
// text instead of being executed as markup.
function escapeHtml(str){
  var div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function buildSummary(){
  var first = escapeHtml(document.getElementById('fFirst').value.trim());
  var last  = escapeHtml(document.getElementById('fLast').value.trim());
  var email = escapeHtml(document.getElementById('fEmail').value.trim());
  var phone = escapeHtml(document.getElementById('fPhone').value.trim());
  var country = escapeHtml(document.getElementById('fCountry').value.trim());
  var trav  = escapeHtml(document.getElementById('fTravellers').value);
  var dest  = escapeHtml(document.getElementById('fDest').options[document.getElementById('fDest').selectedIndex].text);
  var dur   = escapeHtml(document.getElementById('fDuration').options[document.getElementById('fDuration').selectedIndex].text);
  var arr   = escapeHtml(document.getElementById('fArrival').value);
  var dep   = escapeHtml(document.getElementById('fDeparture').value);
  var pkg   = escapeHtml(document.getElementById('fPackage').options[document.getElementById('fPackage').selectedIndex].text);
  var accom = escapeHtml(document.getElementById('fAccom').options[document.getElementById('fAccom').selectedIndex].text);
  var notes = escapeHtml(document.getElementById('fNotes').value.trim());
  var total = escapeHtml(document.getElementById('peTotal').textContent);
  var summary = '<strong>Name:</strong> '+first+' '+last+'<br>'+
    '<strong>Email:</strong> '+email+'<br>'+
    '<strong>Phone:</strong> '+phone+'<br>'+
    (country?'<strong>Country:</strong> '+country+'<br>':'')+
    '<strong>Travellers:</strong> '+trav+'<br>'+
    '<strong>Destination:</strong> '+dest+'<br>'+
    '<strong>Duration:</strong> '+dur+'<br>'+
    '<strong>Arrival:</strong> '+arr+(dep?' → Departure: '+dep:'')+'<br>'+
    '<strong>Package:</strong> '+pkg+'<br>'+
    '<strong>Accommodation:</strong> '+accom+'<br>'+
    (total&&total!=='—'?'<strong>Estimated Total:</strong> '+total+'<br>':'')+
    (notes?'<strong>Special Requests:</strong> '+notes:'');
  document.getElementById('bookingSummary').innerHTML = summary;
}

function updatePriceEstimate(){
  var dest  = document.getElementById('fDest').value;
  var dur   = document.getElementById('fDuration').value;
  var trav  = document.getElementById('fTravellers').value;
  var accom = document.getElementById('fAccom').value;
  var arr   = document.getElementById('fArrival').value;
  if (!dest||!dur||!accom){ document.getElementById('priceEstimator').style.display='none'; return; }
  // Base prices per person per day (USD)
  var basePPD = { kenya:180, tanzania:220, uganda:280, zanzibar:160, rwanda:300, 'kenya-tanzania':200, multi:240 };
  var base    = (basePPD[dest]||180);
  var days    = { '3':3,'4':4,'5':5,'6':6,'7':7,'8-10':9,'11+':12 }[dur]||5;
  var pax     = { '1':1,'2':2,'3-4':3,'5-8':6,'9+':10 }[trav]||2;
  var accomMult = { budget:0.8, comfort:1.0, luxury:1.5, ultra:2.2 }[accom]||1.0;
  var baseTotal = Math.round(base * days * accomMult);
  var fees      = Math.round(days * (dest==='rwanda'?180:dest==='uganda'?120:60));
  var accomCost = Math.round(days * (accomMult-1) * 80);
  var total     = (baseTotal + fees + accomCost) * pax;
  document.getElementById('peBase').textContent      = 'USD '+(Math.round(base*accomMult)).toLocaleString()+'/night';
  document.getElementById('peFees').textContent      = 'USD '+fees.toLocaleString();
  document.getElementById('peAccom').textContent     = accom.charAt(0).toUpperCase()+accom.slice(1)+' level';
  document.getElementById('peTotal').textContent     = 'USD '+total.toLocaleString()+' ('+pax+' pax)';
  document.getElementById('priceEstimator').style.display = 'block';
}

function submitBooking(){
  if (!document.getElementById('fAgree').checked){
    showToast('Please agree to the Terms & Conditions','error'); return;
  }
  var btn = document.getElementById('submitBookingBtn');
  var txt = document.getElementById('submitBtnText');
  var spn = document.getElementById('submitSpinner');
  btn.disabled = true;
  txt.textContent = 'Submitting...';
  spn.classList.remove('hidden');

  var destSel  = document.getElementById('fDest');
  var firstName = document.getElementById('fFirst').value.trim();
  var destText  = destSel.options[destSel.selectedIndex].text;

  // Generated up front (rather than returned by a server) so it's included
  // in the email Formspree sends you, and so the person sees the exact same
  // reference number we actually recorded — not a fake one made up after
  // the fact if the request fails.
  var ref = 'MNS-'+new Date().getFullYear()+'-'+Math.random().toString(36).substr(2,6).toUpperCase();

  var payload = {
    reference: ref,
    firstName: firstName,
    lastName: document.getElementById('fLast').value.trim(),
    email: document.getElementById('fEmail').value.trim(),
    phone: document.getElementById('fPhone').value.trim(),
    country: document.getElementById('fCountry').value.trim(),
    travellers: document.getElementById('fTravellers').value,
    destination: destSel.value,
    destinationLabel: destText,
    duration: document.getElementById('fDuration').value,
    arrivalDate: document.getElementById('fArrival').value,
    departureDate: document.getElementById('fDeparture').value,
    package: document.getElementById('fPackage').value,
    accommodation: document.getElementById('fAccom').value,
    notes: document.getElementById('fNotes').value.trim(),
    estimatedTotal: document.getElementById('peTotal').textContent,
    newsletter: document.getElementById('fNewsletter').checked
  };

  function resetButton(){
    btn.disabled = false;
    txt.textContent = 'Submit Booking Request';
    spn.classList.add('hidden');
  }

  fetch(BOOKING_FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function(res){
    if (!res.ok) throw new Error('Booking form backend responded with status ' + res.status);
    return res.json();
  })
  .then(function(){
    resetButton();
    showSuccessModal(firstName, destText, ref);
    resetBookingForm();
  })
  .catch(function(err){
    // IMPORTANT: unlike before, a failed request no longer pretends to
    // succeed. The person sees a clear error and keeps their filled-in
    // form so they don't lose their details and can retry or reach out
    // directly instead of believing a booking went through when it didn't.
    console.error('Booking submission failed:', err);
    resetButton();
    showToast('We could not send your booking request — please try again, or contact us directly by phone/WhatsApp/email.', 'error');
  });
}

function showSuccessModal(name, dest, ref){
  name = escapeHtml(name);
  dest = escapeHtml(dest);
  ref = escapeHtml(ref);
  document.getElementById('successModalContent').innerHTML =
    '<div class="success-modal">'+
      '<div class="success-icon">✅</div>'+
      '<div class="success-title">Booking Request Sent!</div>'+
      '<div class="success-sub">Thank you, <strong>'+name+'</strong>! Your safari enquiry for <strong>'+dest+'</strong> has been received.</div>'+
      '<div class="success-sub" style="margin-top:8px">Our safari specialists will review your request and send you a personalised itinerary and quote within <strong>24 hours</strong>.</div>'+
      '<div class="success-ref">'+ref+'</div>'+
      '<div class="success-sub" style="font-size:.8rem;color:var(--muted)">Save this reference number for any follow-up enquiries.</div>'+
      '<div class="success-next">'+
        '<button class="btn-primary" onclick="closeModal(\'successModal\')">Back to Website</button>'+
        '<a href="mailto:info@mothernaturesafaris.com" class="btn-outline-lt" style="display:flex;align-items:center;gap:8px;padding:14px 28px;border-radius:var(--rs);border:1.5px solid var(--clay);color:var(--clay);font-size:.9rem;font-weight:600">✉️ Email Us Directly</a>'+
      '</div>'+
    '</div>';
  document.getElementById('successModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function resetBookingForm(){
  ['fFirst','fLast','fEmail','fPhone','fCountry','fArrival','fDeparture','fNotes'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.value='';
  });
  ['fTravellers','fDest','fDuration','fPackage','fAccom'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.selectedIndex=0;
  });
  var agree = document.getElementById('fAgree'); if(agree) agree.checked=false;
  document.getElementById('priceEstimator').style.display='none';
  showStep(1);
}

// ── NAVBAR ──────────────────────────────────────────
function scrollToSection(id){
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior:'smooth' });
  document.getElementById('navLinks').classList.remove('open');
}

// ── TOAST ────────────────────────────────────────────
var _tt;
function showToast(msg, type){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast toast-'+(type||'default')+' show';
  clearTimeout(_tt);
  _tt = setTimeout(function(){ t.classList.remove('show'); }, 3500);
}

// ── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function(){
  // Render the whole page immediately using whatever images are already
  // known (exact-filename matches, or emoji fallbacks) — the person should
  // never stare at a blank page waiting on a network call.
  initSite();

  // Meanwhile, in the background, ask GitHub what's actually sitting in the
  // Images/ folder so uploaded files can be smart-matched by name. When (if)
  // that finishes, just re-render the image-bearing sections in place — any
  // images that upgrade to a better match swap in silently; everything else
  // (nav, form, modals, event listeners) is untouched and unaffected.
  loadImageFileList().then(function(fileList){
    resolveAllImages(fileList);
    refreshImages();
  });
});

// Re-renders only the sections that display images, using whatever is now
// in _resolvedImageCache. Safe to call any time after initSite() — rebuilds
// those sections' markup (and re-wires their own click handlers) without
// touching the booking form, modals, or nav state.
function refreshImages(){
  document.getElementById('navLogoIcon').innerHTML = imgOrEmoji('logo.png','🌿');
  document.getElementById('footerBrandTitle').innerHTML = imgOrEmoji('logo.png','🌿') + ' Mother Nature Safaris';
  document.getElementById('aboutImgFrame').innerHTML = imgOrEmoji('about-photo.jpg','🐘');
  renderHeroSlideshow();
  renderDestinations();
  renderKenyaDestinations();
  renderTanzaniaDestinations();
  renderUgandaDestinations();
  renderZanzibarDestinations();
  renderRwandaDestinations();
  renderPackages();
  renderGallery();
  renderTestimonials();
}

function initSite(){

  // Logo, hero background, about photo, footer logo — all optional images
  // just type the filename, it pulls from your GitHub Images/ folder
  document.getElementById('navLogoIcon').innerHTML = imgOrEmoji('logo.png','🌿');
  document.getElementById('footerBrandTitle').innerHTML = imgOrEmoji('logo.png','🌿') + ' Mother Nature Safaris';
  document.getElementById('heroBg').innerHTML = ''; // cleared here — renderHeroSlideshow() below populates it
  document.getElementById('aboutImgFrame').innerHTML = imgOrEmoji('about-photo.jpg','🐘');

  // Render all sections
  renderHeroSlideshow();
  renderDestinations();
  renderKenyaDestinations();
  renderTanzaniaDestinations();
  renderUgandaDestinations();
  renderZanzibarDestinations();
  renderRwandaDestinations();
  renderPackageTabs();
  renderPackages();
  renderGallery();
  renderTestimonials();
  renderPopularTours();
  showStep(1);

  // Navbar scroll effect
  window.addEventListener('scroll', function(){
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
    var sections = ['home','destinations','packages','gallery','about','contact'];
    var active = 'home';
    sections.forEach(function(id){
      var el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 100) active = id;
    });
    document.querySelectorAll('.nav-a').forEach(function(a){
      a.classList.toggle('active', a.dataset.section === active);
    });
  });

  // Nav links
  document.querySelectorAll('.nav-a').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      scrollToSection(a.dataset.section);
    });
  });
  document.getElementById('logoBtn').addEventListener('click', function(){ scrollToSection('home'); });
  document.getElementById('hamburgerBtn').addEventListener('click', function(){
    document.getElementById('navLinks').classList.toggle('open');
  });
  document.getElementById('navBookBtn').addEventListener('click', function(){ scrollToSection('contact'); });
  document.getElementById('heroBookBtn').addEventListener('click', function(){ scrollToSection('contact'); });
  document.getElementById('heroExploreBtn').addEventListener('click', function(){ scrollToSection('packages'); });

  // Booking form step navigation
  document.getElementById('step1Next').addEventListener('click', function(){
    if (validateStep1()) showStep(2);
  });
  document.getElementById('step2Back').addEventListener('click', function(){ showStep(1); });
  document.getElementById('step2Next').addEventListener('click', function(){
    if (validateStep2()){ buildSummary(); showStep(3); }
  });
  document.getElementById('step3Back').addEventListener('click', function(){ showStep(2); });
  document.getElementById('submitBookingBtn').addEventListener('click', submitBooking);

  // Modal close
  document.getElementById('pkgModalClose').addEventListener('click', function(){ closeModal('pkgModal'); });
  document.getElementById('pkgModal').addEventListener('click', function(e){ if(e.target===this) closeModal('pkgModal'); });
  document.getElementById('successModalClose').addEventListener('click', function(){ closeModal('successModal'); });
  document.getElementById('successModal').addEventListener('click', function(e){ if(e.target===this) closeModal('successModal'); });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape'){ closeModal('pkgModal'); closeModal('successModal'); }
  });

  // Set min arrival date to today
  var today = new Date().toISOString().split('T')[0];
  var arrInput = document.getElementById('fArrival');
  if (arrInput){
    arrInput.min = today;
  }
  var depInput = document.getElementById('fDeparture');
  if (depInput){ depInput.min = today; }
  document.getElementById('fArrival').addEventListener('change', function(){
    var dep = document.getElementById('fDeparture');
    if (dep) dep.min = this.value;
    updatePriceEstimate();
  });

}
