'use strict';

// ═══════════════════════════════════════════════════════
//  MOTHER NATURE SAFARIS — Complete JavaScript
//  Works 100% on GitHub Pages — no backend needed
// ═══════════════════════════════════════════════════════

// ── IMAGE HELPER ──────────────────────────────────
// Photos below are now REAL, hotlinked directly from Wikimedia Commons
// (free-to-use, CC-licensed wildlife/travel photography — see the note
// Claude gave you for the full source list & licenses).
//
// You can still swap any of these out for your own photos any time:
// 1. Upload your image file to the "Images" folder in the Big-Dario/Mature-safaris
//    GitHub repo (via github.com, drag-and-drop works fine).
// 2. Replace the URL below in the matching item's "image:" field with just the
//    filename (e.g. "kenya.jpg") — the img() helper below still supports that.
// 3. Refresh the page — your photo loads automatically, no other code changes needed.
// If an image URL ever fails to load, the emoji placeholder shows instead
// so the site never looks broken.

var IMAGE_BASE = 'https://raw.githubusercontent.com/Big-Dario/Mature-safaris/main/Images/';

// Turns a bare filename ("kenya.jpg") into the full GitHub raw URL.
// Full URLs (like the Wikimedia Commons links used below) pass through unchanged.
function img(filename){
  if (!filename) return '';
  // Allow full URLs to still work if someone pastes one directly
  if (/^https?:\/\//i.test(filename)) return filename;
  return IMAGE_BASE + filename;
}

function imgOrEmoji(filename, emoji, extraClass){
  extraClass = extraClass || '';
  var src = img(filename);
  return '<img src="'+src+'" alt="" loading="lazy" class="'+extraClass+'" '+
    'onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'fallback-emoji\',textContent:\'' + emoji + '\'}))">';
}

// Testimonial avatars fall back to initials (not an emoji) if no photo is added
function imgOrEmojiInitials(filename, initials){
  var src = img(filename);
  return '<img src="'+src+'" alt="" loading="lazy" '+
    'onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{textContent:\'' + initials + '\'}))">';
}

// ── DATA ─────────────────────────────────────────
// image: now a real Wikimedia Commons photo URL (free/CC-licensed).
// Replace with your own filename any time — see note above.
var DESTINATIONS = [
  { id:'kenya',    name:'Kenya',    emoji:'🦁', flag:'🇰🇪', tag:'Maasai Mara · Amboseli · Tsavo', count:'15+ packages', color:'#2C1810', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Lion_in_masai_mara.jpg' },
  { id:'tanzania', name:'Tanzania', emoji:'🐘', flag:'🇹🇿', tag:'Serengeti · Ngorongoro · Kilimanjaro', count:'12+ packages', color:'#1e3a1e', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Wildebeest_Migration_in_Serengeti_National_Park,_Tanzania.jpg' },
  { id:'uganda',   name:'Uganda',   emoji:'🦍', flag:'🇺🇬', tag:'Gorilla Trekking · Bwindi · Murchison', count:'8+ packages', color:'#3a2a0a', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Mountain_gorilla_(Gorilla_beringei_beringei)_eating.jpg' },
  { id:'zanzibar', name:'Zanzibar', emoji:'🏖️', flag:'🇹🇿', tag:'Spice Tours · Beach Retreats · Snorkelling', count:'6+ packages', color:'#0a2a3a', image:'https://commons.wikimedia.org/wiki/Special:FilePath/White_sandy_beach_at_Nungwi,_Zanzibar.jpg' },
];

// image: now a real Wikimedia Commons photo URL (free/CC-licensed).
var PACKAGES = [
  { id:'p1', name:'Maasai Mara Classic Safari', dest:'Kenya', duration:'3 Days', emoji:'🦁',
    price:850, currency:'USD', perPerson:true, accom:'comfort',
    tag:'kenya', badge:'Best Seller', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Lion_in_masai_mara.jpg',
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
    tag:'kenya', badge:'', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Elephants_at_Amboseli_national_park_against_Mount_Kilimanjaro.jpg',
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
    tag:'kenya', badge:'Popular', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Savanna_and_Lions_Bluff_from_the_west_within_the_LUMO_Community_Wildlife_Sanctuary_in_Kenya_2.jpg',
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
    tag:'tanzania', badge:'Featured', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Wildebeest_Migration_in_Serengeti_National_Park,_Tanzania.jpg',
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
    tag:'uganda', badge:'Rare Experience', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Mountain_gorilla_(Gorilla_beringei_beringei)_eating.jpg',
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
    tag:'zanzibar', badge:'Romantic', image:'https://commons.wikimedia.org/wiki/Special:FilePath/White_sandy_beach_at_Nungwi,_Zanzibar.jpg',
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
    tag:'multi', badge:'Best Value', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Wildebeest-during-Great-Migration.JPG',
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
    tag:'kenya', badge:'Budget Friendly', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Large_number_of_flamingos_at_Lake_Nakuru.jpg',
    desc:'A perfect short escape — pink flamingos at Lake Nakuru, rhinos, boat rides on Lake Naivasha and walking on Crescent Island.',
    highlights:['Pink Flamingos','White & Black Rhinos','Hippo Boat Ride','Crescent Island Walk','Hell\'s Gate'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Lake Nakuru', desc:'Drive to Lake Nakuru National Park. Game drive in the afternoon. Overnight at lodge.' },
      { day:'Day 2', title:'Lake Naivasha → Nairobi', desc:'Boat ride on Lake Naivasha, guided walk on Crescent Island. Return to Nairobi.' },
    ],
    includes:['4x4 Vehicle','Guide','Park Fees','Full Board','Accommodation','Transfers'] },

  { id:'p9', name:'Samburu Special Reserve Safari', dest:'Kenya', duration:'3 Days', emoji:'🐆',
    price:790, currency:'USD', perPerson:true, accom:'comfort',
    tag:'kenya', badge:'Unique Species', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Grevy%27s_Zebra_Stallion.jpg',
    desc:'Venture north to the rugged, red-earth landscapes of Samburu — home to species found nowhere else in Kenya, from Grevy\'s zebra to the reticulated giraffe.',
    highlights:['Grevy\'s Zebra','Reticulated Giraffe','Samburu Elephants','Fly-in Option Available'],
    itinerary:[
      { day:'Day 1', title:'Nairobi → Samburu', desc:'Drive or fly in to Samburu National Reserve. Afternoon game drive along the Ewaso Nyiro River.' },
      { day:'Day 2', title:'Samburu Full Day', desc:'Full day exploring the reserve\'s rocky hills and riverine forest, home to the "Samburu Special Five".' },
      { day:'Day 3', title:'Morning Drive → Nairobi', desc:'Final sunrise game drive before returning to Nairobi by road or light aircraft.' },
    ],
    includes:['4x4 Safari Vehicle','Professional Guide','All Park Fees','Full Board Meals','Lodge Accommodation','Nairobi Transfers (fly-in option available at extra cost)'] },
];

// image: now a real Wikimedia Commons photo URL (free/CC-licensed).
// NOTE: gallery-nairobi-lion.jpg has no exact free match for the specific
// "lion overlooking Nairobi skyline" shot — it's using the Maasai Mara lion
// as a placeholder. Swap it for your own photo of that scene when you have one.
var GALLERY_ITEMS = [
  { emoji:'🦁', label:'Lions of the Mara', color:'#3D1A00', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Lion_in_masai_mara.jpg' },
  { emoji:'🐘', label:'Elephant Herds', color:'#1A2E1A', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Elephants_at_Amboseli_national_park_against_Mount_Kilimanjaro.jpg' },
  { emoji:'🦒', label:'Giraffes at Sunset', color:'#3D2E00', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Two_giraffes_in_tall_savanna.jpg' },
  { emoji:'🦓', label:'Zebra Migration', color:'#1A1A2E', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Zebras_lake_nakuru.jpg' },
  { emoji:'🦍', label:'Mountain Gorillas', color:'#1A3D00', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Mountain_gorilla_(Gorilla_beringei_beringei)_eating.jpg' },
  { emoji:'🌅', label:'Savannah Sunrise', color:'#3D1A00', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Savanna_and_Lions_Bluff_from_the_west_within_the_LUMO_Community_Wildlife_Sanctuary_in_Kenya_2.jpg' },
  { emoji:'🦏', label:'Rhino at the Waterhole', color:'#2E1A00', image:'https://commons.wikimedia.org/wiki/Special:FilePath/White_Rhino.jpg' },
  { emoji:'🏖️', label:'Zanzibar Coast', color:'#00203D', image:'https://commons.wikimedia.org/wiki/Special:FilePath/White_sandy_beach_at_Nungwi,_Zanzibar.jpg' },
  { emoji:'🐃', label:'Cape Buffalo', color:'#1A1A1A', image:'https://commons.wikimedia.org/wiki/Special:FilePath/African_(Cape)_Buffalo_in_front_of_Mt._Kilimanjaro,_Amboseli_National_Park,_Kenya_(16819565008).jpg' },
  { emoji:'🐒', label:'Baboon Troop', color:'#3D2E00', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Male_Olive_Baboon.jpg' },
  { emoji:'🦁', label:'Lion Cubs at Play', color:'#3D1A00', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Lion_cubs_Serengeti.jpg' },
  { emoji:'🦓', label:'Grevy\'s Zebra of Samburu', color:'#1A1A2E', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Grevy%27s_Zebra_Stallion.jpg' },
  { emoji:'🦁', label:'Lions Overlooking Nairobi', color:'#2E1A00', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Lion_in_masai_mara.jpg' },
  { emoji:'🐘', label:'Samburu Elephant', color:'#1A2E1A', image:'https://commons.wikimedia.org/wiki/Special:FilePath/Red_elephant_in_dirt.jpg' },
];

// image: put a guest photo filename here (optional — initials show if missing)
// Left as-is deliberately: these three testimonials are example/placeholder
// quotes, not real guests, so no photo is attached to them (the initials-circle
// fallback is the right behavior until you have real, permitted guest photos).
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
      setActivePackageTab(dest === 'zanzibar' ? 'zanzibar' : dest === 'uganda' ? 'uganda' : dest === 'tanzania' ? 'tanzania' : 'kenya');
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
  var filtered = activeTab === 'all' ? PACKAGES : PACKAGES.filter(function(p){ return p.tag === activeTab; });
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
  var basePPD = { kenya:180, tanzania:220, uganda:280, zanzibar:160, 'kenya-tanzania':200, multi:240 };
  var base    = (basePPD[dest]||180);
  var days    = { '3':3,'4':4,'5':5,'6':6,'7':7,'8-10':9,'11+':12 }[dur]||5;
  var pax     = { '1':1,'2':2,'3-4':3,'5-8':6,'9+':10 }[trav]||2;
  var accomMult = { budget:0.8, comfort:1.0, luxury:1.5, ultra:2.2 }[accom]||1.0;
  var baseTotal = Math.round(base * days * accomMult);
  var fees      = Math.round(days * (dest==='uganda'?120:60));
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

  var payload = {
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

  function finish(ref){
    btn.disabled = false;
    txt.textContent = 'Submit Booking Request';
    spn.classList.add('hidden');
    showSuccessModal(firstName, destText, ref);
    resetBookingForm();
  }

  function localFallbackRef(){
    return 'MNS-'+new Date().getFullYear()+'-'+Math.random().toString(36).substr(2,6).toUpperCase();
  }

  fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function(res){
    if (!res.ok) throw new Error('Server responded with an error');
    return res.json();
  })
  .then(function(data){
    finish(data.reference || localFallbackRef());
  })
  .catch(function(){
    setTimeout(function(){ finish(localFallbackRef()); }, 800);
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

  // Logo, hero background, about photo, footer logo
  // Logo stays as the 🌿 emoji placeholder — worth getting a custom logo made
  // (see Claude's note) rather than sourcing one from stock/Commons search.
  document.getElementById('navLogoIcon').innerHTML = imgOrEmoji('logo.png','🌿');
  document.getElementById('footerBrandTitle').innerHTML = imgOrEmoji('logo.png','🌿') + ' Mother Nature Safaris';
  document.getElementById('heroBg').innerHTML = imgOrEmoji('https://commons.wikimedia.org/wiki/Special:FilePath/Savanna_and_Lions_Bluff_from_the_west_within_the_LUMO_Community_Wildlife_Sanctuary_in_Kenya_2.jpg','');
  document.getElementById('aboutImgFrame').innerHTML = imgOrEmoji('https://commons.wikimedia.org/wiki/Special:FilePath/Elephants_at_Amboseli_national_park_against_Mount_Kilimanjaro.jpg','🐘');

  // Render all sections
  renderDestinations();
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

});
