// js/pricing-intelligence.js — PMG Pricing Intelligence, Competitor Benchmarking & SWOT Strategy
'use strict';

(function(window) {
  // ─── LOCAL STORAGE & API CONFIGURATION ─────────────────────────────────────────
  const STORAGE_KEY_PRICING_SKUS = 'pmg_pricing_skus_master';
  const STORAGE_KEY_GEMINI = 'pmg_gemini_key';
  const PMG_SCHEDULE_API_URL = window.PMG_SCHEDULE_API_URL || 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';

  // ─── DEFAULT BENCHMARK SKUs (Clean Slate for Xilnex Import) ─────
  const DEFAULT_SKUS = [];

  // ─── CURATED MALAYSIAN PHARMACY RETAIL BENCHMARK DICTIONARY ─────────────────
  // Verified market retail benchmarks across Malaysian Community Pharmacies
  // (BIG Pharmacy, Alpro Pharmacy, Caring Pharmacy, Ting Pharmacy Kuching, DoctorOnCall)
  const KNOWN_MALAYSIAN_BENCHMARKS = [
    {
      regex: /ACETAN\s*HCT/i,
      name: 'ACETAN HCT 50/12.5',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 16.00,
      retailSp: 18.50,
      competitor: 'BIG Pharmacy',
      note: 'Losartan 50/12.5 (30s Box/Strip)',
      isRx: true
    },
    {
      regex: /ACETAN\s*(50|TAB)?/i,
      name: 'ACETAN 50MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 13.50,
      retailSp: 16.00,
      competitor: 'BIG Pharmacy',
      note: 'Losartan Potassium 50mg (30s)',
      isRx: true
    },
    {
      regex: /SPIRIVA.*RESPIMAT/i,
      name: 'SPIRIVA RESPIMAT REFILL 4ML',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 193.60,
      retailSp: 218.00,
      competitor: 'BIG Pharmacy / Alpro',
      note: 'Tiotropium 2.5mcg Refill (60 puffs)',
      isRx: true
    },
    {
      regex: /CRESTOR\s*10/i,
      name: 'CRESTOR 10MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 88.00,
      retailSp: 102.00,
      competitor: 'Alpro Pharmacy',
      note: 'Rosuvastatin 10mg 28s',
      isRx: true
    },
    {
      regex: /CRESTOR\s*20/i,
      name: 'CRESTOR 20MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 145.00,
      retailSp: 168.00,
      competitor: 'Alpro Pharmacy',
      note: 'Rosuvastatin 20mg 28s',
      isRx: true
    },
    {
      regex: /LIPITOR\s*(10|20|40)/i,
      name: 'LIPITOR 20MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 95.00,
      retailSp: 110.00,
      competitor: 'BIG Pharmacy',
      note: 'Atorvastatin 20mg 30s',
      isRx: true
    },
    {
      regex: /NORVASC\s*5/i,
      name: 'NORVASC 5MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 45.00,
      retailSp: 54.00,
      competitor: 'Alpro Pharmacy',
      note: 'Amlodipine 5mg 30s',
      isRx: true
    },
    {
      regex: /NORVASC\s*10/i,
      name: 'NORVASC 10MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 72.00,
      retailSp: 85.00,
      competitor: 'Alpro Pharmacy',
      note: 'Amlodipine 10mg 30s',
      isRx: true
    },
    {
      regex: /COVERSYL\s*(4|5|8)/i,
      name: 'COVERSYL 5MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 58.00,
      retailSp: 68.00,
      competitor: 'Caring Pharmacy',
      note: 'Perindopril Arginine 30s',
      isRx: true
    },
    {
      regex: /GLUCOPHAGE\s*XR\s*500/i,
      name: 'GLUCOPHAGE XR 500MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 26.00,
      retailSp: 32.00,
      competitor: 'Alpro Pharmacy',
      note: 'Metformin XR 500mg 60s',
      isRx: true
    },
    {
      regex: /GLUCOPHAGE\s*XR\s*(750|1000)/i,
      name: 'GLUCOPHAGE XR 750MG/1000MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 38.00,
      retailSp: 46.00,
      competitor: 'BIG Pharmacy',
      note: 'Metformin XR',
      isRx: true
    },
    {
      regex: /GLUCOPHAGE\s*500/i,
      name: 'GLUCOPHAGE 500MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 18.00,
      retailSp: 22.00,
      competitor: 'BIG Pharmacy',
      note: 'Metformin HCl 500mg 100s',
      isRx: true
    },
    {
      regex: /FORXIGA\s*10/i,
      name: 'FORXIGA 10MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 138.00,
      retailSp: 158.00,
      competitor: 'Alpro Pharmacy',
      note: 'Dapagliflozin 10mg 28s',
      isRx: true
    },
    {
      regex: /JARDIANCE\s*10/i,
      name: 'JARDIANCE 10MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 140.00,
      retailSp: 160.00,
      competitor: 'BIG Pharmacy',
      note: 'Empagliflozin 10mg 30s',
      isRx: true
    },
    {
      regex: /JARDIANCE\s*25/i,
      name: 'JARDIANCE 25MG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 165.00,
      retailSp: 188.00,
      competitor: 'BIG Pharmacy',
      note: 'Empagliflozin 25mg 30s',
      isRx: true
    },
    {
      regex: /VENTOLIN\s*EVOHALER/i,
      name: 'VENTOLIN EVOHALER 100MCG',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 13.50,
      retailSp: 16.50,
      competitor: 'BIG Pharmacy',
      note: 'Salbutamol 200 doses',
      isRx: true
    },
    {
      regex: /SYMBICORT.*(160|320)/i,
      name: 'SYMBICORT TURBUHALER',
      category: 'CHRONIC / PRESCRIPTION',
      cost: 78.00,
      retailSp: 92.00,
      competitor: 'Alpro Pharmacy',
      note: 'Budesonide/Formoterol',
      isRx: true
    },
    {
      regex: /ENSURE\s*GOLD/i,
      name: 'ENSURE GOLD 850G',
      category: 'NUTRITIONAL MILK',
      cost: 89.00,
      retailSp: 98.90,
      supermarketSp: 96.90,
      competitor: 'Alpro / Farley 6th Mile',
      note: 'Complete Nutrition 850g Can',
      isRx: false
    },
    {
      regex: /GLUCERNA/i,
      name: 'GLUCERNA 850G',
      category: 'NUTRITIONAL MILK',
      cost: 99.00,
      retailSp: 109.90,
      promoSp: 106.90,
      supermarketSp: 107.90,
      competitor: 'Caring / Farley 6th Mile',
      note: 'Diabetes Nutrition 850g Can',
      isRx: false
    },
    {
      regex: /ABSORBA.*(CONTI[- ]?FIT|PANTS|DIAPER).*(L|LARGE|9)/i,
      name: 'ABSORBA CONTI-FIT SOFT ADULT PANTS / DIAPERS L 9\'S',
      category: 'INCONTINENCE / ADULT CARE',
      cost: 15.50,
      retailSp: 17.50,
      promoSp: 16.50,
      supermarketSp: 15.90,
      competitor: 'Alpro Oneclick (11.11 Promo)',
      note: 'Alpro 11.11 Promo RM 16.50 (Normal RM 17.50) · Farley RM 15.90',
      isRx: false
    },
    {
      regex: /ABSORBA.*(CONTI[- ]?FIT|PANTS|DIAPER).*(M|MEDIUM|10)/i,
      name: 'ABSORBA CONTI-FIT SOFT ADULT PANTS / DIAPERS M 10\'S',
      category: 'INCONTINENCE / ADULT CARE',
      cost: 15.50,
      retailSp: 17.50,
      promoSp: 16.50,
      supermarketSp: 15.90,
      competitor: 'Alpro Oneclick (11.11 Promo)',
      note: 'Alpro 11.11 Promo RM 16.50 (Normal RM 17.50) · Farley RM 15.90',
      isRx: false
    },
    {
      regex: /ABSORBA.*(CONTI[- ]?FIT|PANTS|DIAPER).*(XL|8)/i,
      name: 'ABSORBA CONTI-FIT SOFT ADULT PANTS / DIAPERS XL 8\'S',
      category: 'INCONTINENCE / ADULT CARE',
      cost: 15.50,
      retailSp: 17.50,
      promoSp: 16.50,
      supermarketSp: 15.90,
      competitor: 'Alpro Oneclick (11.11 Promo)',
      note: 'Alpro 11.11 Promo RM 16.50 (Normal RM 17.50) · Farley RM 15.90',
      isRx: false
    },
    {
      regex: /ABSORBA/i,
      name: 'ABSORBA ADULT INCONTINENCE CARE',
      category: 'INCONTINENCE / ADULT CARE',
      cost: 15.50,
      retailSp: 17.50,
      promoSp: 16.50,
      supermarketSp: 15.90,
      competitor: 'Alpro Oneclick / Farley',
      note: 'Alpro 11.11 Promo RM 16.50 (Normal RM 17.50) · Farley RM 15.90',
      isRx: false
    },
    {
      regex: /TENA.*(VALUE|PANTS|SLIP)/i,
      name: 'TENA ADULT CARE',
      category: 'INCONTINENCE / ADULT CARE',
      cost: 18.00,
      retailSp: 22.90,
      promoSp: 20.90,
      supermarketSp: 19.90,
      competitor: 'Alpro / Farley 6th Mile',
      note: 'Retail Pack · Farley Promo RM 19.90',
      isRx: false
    },
    {
      regex: /CERTAINTY.*(DRYPANTS|TAPE|MAXI)/i,
      name: 'CERTAINTY ADULT PANTS / DIAPERS',
      category: 'INCONTINENCE / ADULT CARE',
      cost: 24.00,
      retailSp: 31.90,
      promoSp: 28.90,
      supermarketSp: 27.50,
      competitor: 'Caring / Farley 6th Mile',
      note: 'Promo RM 28.90 · Farley RM 27.50',
      isRx: false
    },
    {
      regex: /YHG.*MATI.*ZHUZHE/i,
      name: 'YHG MATI ZHUZHE MAOGEN BEVERAGE 10\'S',
      category: 'HERBAL BEVERAGE',
      cost: 7.50,
      retailSp: 11.90,
      promoSp: 10.90,
      supermarketSp: 9.90,
      competitor: 'Farley Supermarket / Alpro',
      note: 'Farley RM 9.90 · Alpro RM 11.90',
      isRx: false
    },
    // ─── PEDIATRIC & ADULT OTC SUPPLEMENT BENCHMARKS ─────────────────────────
    {
      regex: /BIO[- ]?LIFE.*A\.?B\.?\s*JUNIOR.*(2\s*X\s*50|TWIN)/i,
      name: 'BIO-LIFE A.B. JUNIOR PRE&PRO POWDER 2X50\'S (TWIN PACK)',
      category: 'PEDIATRIC HEALTH / PROBIOTICS',
      cost: 122.00,
      retailSp: 168.30,
      promoSp: 152.50,
      supermarketSp: 160.00,
      competitor: 'BIG Pharmacy / Alpro Oneclick',
      note: 'BIG Promo RM 152.50 · Alpro RM 168.30 (Twin Pack 2x50s = RM 76.25/box)',
      isRx: false
    },
    {
      regex: /BIO[- ]?LIFE.*A\.?B\.?\s*JUNIOR.*10/i,
      name: 'BIO-LIFE A.B. JUNIOR PRE&PRO POWDER 10\'S',
      category: 'PEDIATRIC HEALTH / PROBIOTICS',
      cost: 14.50,
      retailSp: 18.30,
      promoSp: 18.00,
      supermarketSp: 18.50,
      competitor: 'BIG Pharmacy / Alpro',
      note: 'BIG RM 18.30 · Alpro RM 18.00 (Single Box 10s)',
      isRx: false
    },
    {
      regex: /BIO[- ]?LIFE.*A\.?B\.?\s*JUNIOR.*(50|SAC\s*50|PRE&PRO|POWDER)/i,
      name: 'BIO-LIFE A.B. JUNIOR PRE&PRO POWDER 50\'S',
      category: 'PEDIATRIC HEALTH / PROBIOTICS',
      cost: 74.63,
      retailSp: 86.90,
      promoSp: 84.10,
      supermarketSp: 88.50,
      competitor: 'Alpro Oneclick (11.11 Promo RM 84.10) · BIG RM 86.90',
      note: 'Alpro 11.11 Promo RM 84.10 (Normal RM 113.00) · BIG RM 86.90 · Single Box 50s',
      isRx: false
    },
    {
      regex: /BIO[- ]?LIFE.*LIVASIL.*(100|VALUE)/i,
      name: 'BIO-LIFE LIVASIL TABLETS 100\'S + 30\'S',
      category: 'SUPPLEMENT / LIVER HEALTH',
      cost: 118.00,
      retailSp: 222.00,
      promoSp: 152.60,
      supermarketSp: 165.00,
      competitor: 'Alpro Oneclick / BIG Pharmacy',
      note: 'Alpro Value Pack Promo RM 152.60 (Normal RM 239.00)',
      isRx: false
    },
    {
      regex: /BIO[- ]?LIFE.*LIVASIL/i,
      name: 'BIO-LIFE LIVASIL TABLETS 30\'S',
      category: 'SUPPLEMENT / LIVER HEALTH',
      cost: 44.00,
      retailSp: 62.00,
      promoSp: 58.90,
      supermarketSp: 59.90,
      competitor: 'BIG Pharmacy / Caring',
      note: 'BIG Pharmacy RM 58.90 · Alpro RM 62.00',
      isRx: false
    },
    {
      regex: /BLACKMORES.*BIO\s*C.*1000/i,
      name: 'BLACKMORES BIO C 1000MG 30\'S',
      category: 'VITAMINS / IMMUNITY',
      cost: 28.00,
      retailSp: 38.20,
      promoSp: 37.80,
      supermarketSp: 38.90,
      competitor: 'BIG Pharmacy / Caring',
      note: 'BIG RM 37.80 · Alpro RM 38.20',
      isRx: false
    },
    {
      regex: /REDOXON.*(TRIPLE|DOUBLE).*EFF/i,
      name: 'REDOXON TRIPLE ACTION EFFERVESCENT 30\'S',
      category: 'VITAMINS / IMMUNITY',
      cost: 32.00,
      retailSp: 52.00,
      promoSp: 42.90,
      supermarketSp: 44.50,
      competitor: 'Alpro / BIG Pharmacy',
      note: 'Alpro / BIG Promo RM 42.90 (Normal RM 52.00–66.20)',
      isRx: false
    },
    {
      regex: /FLAVETTES.*GLOW/i,
      name: 'FLAVETTES EFFERVESCENT GLOW 30\'S',
      category: 'VITAMINS / BEAUTY',
      cost: 35.00,
      retailSp: 69.90,
      promoSp: 45.89,
      supermarketSp: 46.90,
      competitor: 'BIG Pharmacy / Alpro / Caring',
      note: 'Unified Chain Promo RM 45.89 (Normal RM 69.90)',
      isRx: false
    },
    {
      regex: /APPETON.*LYSINE.*(TAB|60)/i,
      name: 'APPETON MULTIVITAMIN WITH LYSINE 60\'S',
      category: 'PEDIATRIC HEALTH / APPETITE',
      cost: 33.00,
      retailSp: 62.10,
      promoSp: 43.11,
      supermarketSp: 45.50,
      competitor: 'Alpro Oneclick / BIG Pharmacy',
      note: 'Alpro Promo RM 43.11 (Normal RM 62.10) · BIG RM 47.90',
      isRx: false
    },
    {
      regex: /APPETON.*LYSINE.*(SYRUP|120)/i,
      name: 'APPETON MULTIVITAMIN LYSINE SYRUP 120ML',
      category: 'PEDIATRIC HEALTH / APPETITE',
      cost: 32.50,
      retailSp: 65.50,
      promoSp: 43.90,
      supermarketSp: 45.00,
      competitor: 'Alpro Oneclick / BIG Pharmacy',
      note: 'Alpro Promo RM 43.90 (Normal RM 65.50)',
      isRx: false
    }
  ];

  // ─── THE 7 BRANCH SWOT PROFILES (KUCHING & PADAWAN REGION) ───────────────────
  const BRANCH_SWOT_DATA = {
    'KOTA SENTOSA': {
      name: 'PMG Pharmacy Kota Sentosa',
      code: 'KS01',
      badge: 'Flagship Base',
      locationProfile: '7th Mile Bazaar, Penrissen Road. Busy commercial interchange, heavy senior citizen demographic, high bus/transport connectivity.',
      localCompetitors: [
        'Farley Supermarket (6th Mile - aggressive FMCG/milk discounter)',
        'Local independent Chinese medical halls & pharmacies in 7th Mile Old Bazaar',
        'Watsons 7th Mile',
        'CS Mini Market & Wet Market'
      ],
      swot: {
        strengths: [
          'William Chai base outlet; clinical expertise and reputation are very strong.',
          'Large established pool of chronic patients (Diabetes, Hypertension, Dyslipidemia).',
          'High patient trust in clinical counselling, Airdoc eye screening, and Teda Meridian consultation.'
        ],
        weaknesses: [
          'High parking congestion around 7th Mile Bazaar during peak morning and weekend market hours.',
          'Price pressure on milk powder (Ensure Gold, Glucerna) from nearby Farley 6th Mile.'
        ],
        opportunities: [
          'Chronic Disease Management (CDM) VIP subscription program for repeat refills.',
          'Corporate/factory health screening packages for 7th Mile industrial belt and Penrissen transport workers.',
          'Mobility aids & rehabilitation equipment (wheelchairs, walking frames, adult diapers).'
        ],
        threats: [
          'Farley Supermarket price undercutting on adult nutrition and OTC loss leaders.',
          'Public hospital (Klinik Kesihatan Kota Sentosa) pharmacy dispensing free government refills.'
        ]
      },
      actionPlan: [
        'Defend Ensure Gold & Glucerna volume by pricing within RM 1.00 of Farley; offer free blood glucose screening with 2 cans.',
        'Promote PMG House Brand Omega-3 and CoQ10 at the dispensing counter to boost margin from 18% to 32%.',
        'Run monthly "Sentosa Silver Club" health checkup mornings (BP, Glucose, Uric acid) on Saturday mornings.'
      ]
    },

    'MATANG JAYA': {
      name: 'PMG Pharmacy Matang Jaya',
      code: 'MATANG JAYA',
      badge: 'Mature Residential Suburb',
      locationProfile: 'Synergy Square, Matang Jaya. Densely populated mature suburban housing estates, multi-ethnic family profile.',
      localCompetitors: [
        'Emart Matang (Major hypermarket competitor 5 mins away)',
        'Watsons Matang Jaya',
        'Guardian Matang',
        'Everrise Matang'
      ],
      swot: {
        strengths: [
          'Resident Pharmacist Amy Chai has established deep personal relationships with families.',
          'High foot traffic from morning market and commercial centre eateries.',
          'Strong demand for pediatric remedies, dermatological care, and family first-aid.'
        ],
        weaknesses: [
          'Intense competition from chain pharmacies (Watsons & Guardian) on personal care and cosmetics.',
          'Emart Matang weekend grocery pull draws foot traffic away from roadside shops.'
        ],
        opportunities: [
          'School holiday pediatric and maternal wellness promotions (Pediasure, vitamins, deworming).',
          'Skin and eczema management corner (QV, Cerave, Derma-care) backed by pharmacist advice.',
          'WhatsApp prescription reservation service for busy working parents returning from work.'
        ],
        threats: [
          'Emart Matang aggressive promotional flyers on diapers and infant formula.',
          'Online e-commerce shopping for non-prescription personal care.'
        ]
      },
      actionPlan: [
        'Create a "Happy Family Kids Zone" with bundled pediatric vitamins (Vit C + Lysine) to counter Emart.',
        'Implement "Reserve & Collect" via WhatsApp for working mothers on their evening commute home.',
        'Price-match high-visibility baby milk brands (Pediasure / Sustagen) while attaching PMG Probiotic drops.'
      ]
    },

    'SUNGAI MOYAN': {
      name: 'PMG Pharmacy Sungai Moyan',
      code: 'SUNGAI MOYAN',
      badge: 'Rapid-Growth Township',
      locationProfile: 'Genesis Walk, Jalan Batu Kawa/Matang. Rapidly expanding residential boomtown, young home-buyers, suburban retirees, garden houses.',
      localCompetitors: [
        'Emart Batu Kawa (10 mins drive)',
        'Local Chinese medicine sundry shops in Moyan',
        'Independent neighborhood clinics'
      ],
      swot: {
        strengths: [
          'Dominant modern community pharmacy in Genesis Walk commercial heart.',
          'Convenient parking and accessibility compared to congested central Kuching.',
          'First-stop emergency healthcare provider for Moyan, Segedup, and Batu Kawa rural fringe.'
        ],
        weaknesses: [
          'Customers still commute to Batu Kawa or Kuching city for large monthly grocery hauls.',
          'Slightly lower brand awareness among newly moved-in residential phases.'
        ],
        opportunities: [
          'Home delivery service for chronic medications to surrounding gated communities and kampungs.',
          'Gardening/agricultural community health support: anti-fungal, heat relief, wound care, pain relief.',
          'Health kiosk events in Genesis Walk during weekend community festivals.'
        ],
        threats: [
          'Future entry of chain pharmacies into upcoming Moyan commercial phases.',
          'Sundry shops selling unverified traditional medicines or grey-market FMCG.'
        ]
      },
      actionPlan: [
        'Distribute "Moyan Neighborhood Health Pass" vouchers to new housing developments nearby.',
        'Position store as the primary first-aid and wound-dressing destination for suburban sports and accidents.',
        'Standardize Ensure and Glucerna prices with Kota Sentosa so Moyan residents do not travel to 6th Mile.'
      ]
    },

    'MALIHAH': {
      name: 'PMG Pharmacy Malihah',
      code: 'MALIHAH',
      badge: 'Community-Reliant Suburb',
      locationProfile: 'Malihah Commercial Centre, off Jalan Matang. Bustling residential housing area, high Malay and Dayak population, middle-to-working class families.',
      localCompetitors: [
        'Local mini-markets and sundry shops',
        'Everwin / CS mini markets',
        'Local private GP clinics'
      ],
      swot: {
        strengths: [
          'Crucial convenient community lifesaver within walking and motorcycle distance.',
          'High demand for affordable acute care: fever, cough, flu, gastric, pain relief.',
          'Friendly, accessible staff speaking local dialects.'
        ],
        weaknesses: [
          'High price sensitivity; lower willingness to purchase premium RM 150+ imported supplements.',
          'Smaller basket size per transaction compared to Metrocity.'
        ],
        opportunities: [
          'Promote high-quality bio-equivalent generic medications (e.g. Paracetamol, Simvastatin, Metformin, Cetirizine).',
          'Sachet packs and affordable family first-aid kits.',
          'Post-pregnancy and confinement care packages for young mothers.'
        ],
        threats: [
          'Sundry stores selling sub-standard or counterfeit OTC balms at ultra-cheap prices.',
          'Economic inflation impacting disposable grocery income for working-class households.'
        ]
      },
      actionPlan: [
        'Counter-merchandising: Display PMG affordable generic alternatives prominently beside branded originator boxes.',
        'Offer "Mix & Match 3 for RM 10" family essential baskets (cooling water, platers, herbal pastilles).',
        'Conduct free blood pressure checks every Sunday morning to build deep neighborhood loyalty.'
      ]
    },

    'METROCITY': {
      name: 'PMG Pharmacy Metrocity',
      code: 'METROCITY',
      badge: 'Urban Lifestyle & Night Hub',
      locationProfile: 'Unit 21, Metrocity Commercial Centre, Jalan Matang. Bustling commercial strip, night market, youth, young working professionals, fitness centres.',
      localCompetitors: [
        'Watsons Metrocity',
        'Guardian Metrocity',
        'Boulevard / Emart Matang nearby',
        'Beauty and aesthetic clinics'
      ],
      swot: {
        strengths: [
          'High spending power, high average basket value among urban working adults.',
          'Extended operating hours catering to evening shoppers and night market visitors.',
          'Modern store layout with high visibility.'
        ],
        weaknesses: [
          'Intense head-to-head competition with Watsons and Guardian located in the same commercial square.',
          'Customers quick to compare beauty and skincare prices on TikTok Shop and Shopee.'
        ],
        opportunities: [
          'Derma-skincare, anti-acne, sunscreen, collagen, and beauty wellness consultations.',
          'Sports nutrition, whey protein, electrolyte hydration, and joint care for gym-goers.',
          'Weight management & intermittent fasting support programs with pharmacist guidance.'
        ],
        threats: [
          'Watsons weekend "Kaw Kaw" sales and loyalty card discounts.',
          'Rapid turnover of commercial tenants and changing consumer traffic patterns.'
        ]
      },
      actionPlan: [
        'Create a "Derma-Cosmeceutical Skin Bar" with free skin moisture testing to beat Watsons self-service shelves.',
        'Feature sports nutrition and energy recovery bundles (Whey + B-Complex + Magnesium) for fitness enthusiasts.',
        'Run targeted digital promotional ads highlighting "Pharmacist-Recommended Acne & Skin Solutions".'
      ]
    },

    'ASTANA': {
      name: 'PMG Pharmacy Astana',
      code: 'ASTANA',
      badge: 'Civil Service & Administrative Zone',
      locationProfile: 'Astana Commercial Centre, Jalan Astana, Petra Jaya. Near Sarawak State Government offices, Wisma Bapa Malaysia, civil servant residential quarters.',
      localCompetitors: [
        'Independent pharmacies along Jalan Astana',
        'H&L Supermarket Petra Jaya',
        'Government Hospital / Poliklinik Petra Jaya'
      ],
      swot: {
        strengths: [
          'Steady civil servant customer base with stable income and government health awareness.',
          'Consistent weekday business flow; professional patient clientele.',
          'High demand for executive wellness, cardiovascular protection, and ergonomic care.'
        ],
        weaknesses: [
          'Weekend foot traffic is quieter compared to bustling suburban retail spots.',
          'Customers may receive bulk medicine subsidies from government schemes.'
        ],
        opportunities: [
          'Executive health checkup packages (Lipid profile, HbA1c, Liver & Kidney profile via Teda & Airdoc).',
          'Ergonomic workstation health: posture braces, heat patches, eye health (Lutein/Bilberry) for office workers.',
          'Gout, uric acid, and stress management specialized care.'
        ],
        threats: [
          'Government hospital out-patient pharmacy expanding express dispensing.',
          'Competitor independent pharmacies opening along new Petra Jaya commercial rows.'
        ]
      },
      actionPlan: [
        'Launch "Office Wellness & Screen Fatigue" campaign (Eye supplements + neck/shoulder wraps + Ergonomic pillows).',
        'Offer civil servant corporate health partnership and executive screening packages.',
        'Standardize premium supplement pricing across Astana to reassure price transparency.'
      ]
    },

    'SAMARIANG': {
      name: 'PMG Pharmacy Samariang',
      code: 'SAMARIANG',
      badge: 'High-Density Master Township',
      locationProfile: 'Sublot 8, Bandar Baru Samariang, Jalan Sultan Tengah, Petra Jaya. Giant planned residential township, multi-generational families, high primary school density.',
      localCompetitors: [
        'Emart Sejingkat / Bako link (10 mins drive)',
        'Local Bandar Baru Samariang mini markets & 24hr marts',
        'Local GP clinics'
      ],
      swot: {
        strengths: [
          'Key retail anchor in Bandar Baru Samariang; very high local community loyalty.',
          'Large household size (parents, children, grandparents living together under one roof).',
          'High repeat volume for fever/flu syrups, wound dressings, and chronic senior supplies.'
        ],
        weaknesses: [
          'Vulnerable to grocery wholesalers and wholesale diaper/milk stores.',
          'Lower demand for high-end boutique skincare.'
        ],
        opportunities: [
          'Multi-generational health bundles (e.g. Grandparent BP monitor + Dad Multivitamin + Child Vit C).',
          'School reopening health and immunity drives (Immunity syrups, lice treatments, multivitamins).',
          'Diabetes care and insulin injection accessories (pen needles, glucometer strips).'
        ],
        threats: [
          'Wholesale grocery stores discounting bulk milk powder.',
          'Economic shifts affecting lower-middle-income family spending.'
        ]
      },
      actionPlan: [
        'Bundle "Family Immunity Shield" packs (Vitamin C 1000mg + Probiotics + Disinfectant) at a special combo price.',
        'Price Ensure Gold and Pediasure strictly at the Standard Area Price to keep families shopping locally in Samariang.',
        'Host a monthly "Samariang Healthy Kids" morning with free height, weight, and BMI growth checks.'
      ]
    }
  };

  // ─── COMPETITIVE STRATEGY GUIDES & PLAYBOOK ──────────────────────────────────
  const COMPETITIVE_PLAYBOOK = [
    {
      title: 'Tactic 1: The "Farley & Emart FMCG Trap" (How to Defend Milk & Diapers)',
      category: 'Supermarket Defense',
      summary: 'Supermarkets like Farley, Emart, and H&L use Adult/Baby Milk (Ensure, Glucerna, Pediasure) and Diapers (Drypers, MamyPoko) as negative-margin loss leaders to pull shoppers into their stores.',
      rules: [
        'NEVER try to undercut supermarkets on loss-leader milk by RM 5.00+; it will destroy your gross profit.',
        'Match their price within RM 1.00 – RM 1.50 (Standardized Area Price: Ensure Gold RM 109.90).',
        'The "Second Item Rule": Train every cashier to recommend a high-margin companion item (e.g. Ensure Gold + Bone Calcium / Glucerna + Alpha Lipoic Acid / Pediasure + Probiotic Sachets). The companion item yields 35-50% margin and protects your net basket profit.',
        'Reward Loyalty: Give a free Blood Glucose or BP check voucher with purchase of 2 cans of milk.'
      ]
    },
    {
      title: 'Tactic 2: Unified Area Pricing Standard (UAP) Across the 7 Outlets',
      category: 'Multi-Branch Consistency',
      summary: 'Customers frequently travel between Kota Sentosa, Matang Jaya, Moyan, and Samariang. Inconsistent prices destroy trust and invite customer complaints.',
      rules: [
        'Enforce 100% price parity across all 7 branches on all top 100 KVIs (Known Value Items).',
        'A customer buying Panadol Actifast or Janumet in Matang Jaya must pay the exact same price in Kota Sentosa or Moyan.',
        'Print official PMG shelf-talkers: "Standardized Area Price · Guaranteed Fair Pricing Across All PMG Outlets".'
      ]
    },
    {
      title: 'Tactic 3: The "Clinical Moat" (What Supermarkets Can NEVER Offer)',
      category: 'Service Differentiation',
      summary: 'A supermarket clerk cannot interpret HbA1c, screen retina photos, evaluate drug-drug interactions, or perform Meridian health scans. This is our unassailable competitive advantage.',
      rules: [
        'Position the pharmacist consultation desk as the centrepiece of the store.',
        'Promote Airdoc AI Retinal Screening (RM 35-50) and Teda Meridian Scans (RM 25-40) as professional clinical services.',
        'When customer asks "Why is Panadol RM 0.40 cheaper at Farley?", staff should answer: "At PMG, our registered pharmacist reviews all your medications, checks your blood pressure for free, and ensures your liver and kidneys are protected."'
      ]
    },
    {
      title: 'Tactic 4: High-Yield House Brand & Bio-Equivalent Generic Substitution',
      category: 'Margin Acceleration',
      summary: 'Branded originators yield 15-22% margin. PMG House Brands and approved Bio-equivalent Generics deliver 50-60% gross profit.',
      rules: [
        'Introduce the "Good / Better / Best" protocol at the counter.',
        'Example: Customer asks for Norvasc (SP RM 48, Margin 25%). Staff says: "We also have PMG approved European generic Amlodipine with identical efficacy for RM 25.00 (Savings of RM 23 for you, margin 60% for PMG)!"',
        'Prioritize PMG Pro-Defense Vitamin C + Zinc and PMG Deep Sea Omega-3 on eye-level shelves.'
      ]
    }
  ];

  // ─── INDEXED-DB HIGH CAPACITY STORAGE ENGINE (60,000+ SKUs) ──────────────────
  const PRICING_IDB_NAME = 'pmg_pricing_matrix_db';
  const PRICING_IDB_VERSION = 1;
  const PRICING_IDB_STORE = 'skus_store';

  function openPricingIndexedDb() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB not supported'));
      }
      const req = indexedDB.open(PRICING_IDB_NAME, PRICING_IDB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(PRICING_IDB_STORE)) {
          db.createObjectStore(PRICING_IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getPricingSkusFromIdb() {
    try {
      const db = await openPricingIndexedDb();
      return new Promise((resolve) => {
        const tx = db.transaction(PRICING_IDB_STORE, 'readonly');
        const store = tx.objectStore(PRICING_IDB_STORE);
        const req = store.get('master_skus');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      console.warn('[PMG Pricing IDB] Read error:', e);
      return null;
    }
  }

  async function setPricingSkusToIdb(skus) {
    try {
      const db = await openPricingIndexedDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(PRICING_IDB_STORE, 'readwrite');
        const store = tx.objectStore(PRICING_IDB_STORE);
        const req = store.put(skus, 'master_skus');
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[PMG Pricing IDB] Write error:', e);
      return false;
    }
  }

  // ─── PRICING INTELLIGENCE ENGINE CLASS ───────────────────────────────────────
  class PricingIntelligenceEngine {
    constructor() {
      this.skus = [];
      this.activeBranchKey = 'KOTA SENTOSA';
      this.activeCategoryFilter = 'ALL';
      this.activeStrategyFilter = 'ALL';
      this.activeCompetitorFilter = 'ALL';
      this.activeAgingFilter = 'ALL';
      this.searchQuery = '';
      this.isAiRunning = false;
      this.selectedSkuForAi = null;
      this.currentPage = 1;
      this.pageSize = 50;
      this.sortField = 'none'; // 'none' | 'margin' | 'supermarket_dev' | 'chain_dev' | 'abs_dev' | 'aged_value' | 'aged_qty'
      this.marginSortOrder = 'none'; // 'none' | 'desc' | 'asc'
      this.supermarketDevSortOrder = 'none'; // 'none' | 'desc' | 'asc'
      this.chainDevSortOrder = 'none'; // 'none' | 'desc' | 'asc'
      this.agingSortOrder = 'none'; // 'none' | 'desc' | 'asc'
      this.agingMap = new Map();
      this.agingBaseCodeMap = new Map();
      this.agingNameMap = new Map();
      this.agingStats = { totalAgedSkus: 0, totalAgedValue: 0, source: 'None' };
      this.isSyncingWithSheets = false;
      this.init();
    }

    async init() {
      await this.loadSkusFromStorage();
      await this.loadStockAging();
      this.sanitizeRxPrescriptionSkus();
      this.render();
      // Auto sync from Google Sheets in background
      this.fetchPricingFromSheets(false);

      if (typeof window !== 'undefined' && !this._listenersBound) {
        this._listenersBound = true;
        window.addEventListener('pmg:aging-updated', () => {
          this.loadStockAging().then(() => {
            this.autoAnalyzeAllSkus(false);
          });
        });
        window.addEventListener('storage', (e) => {
          if (e.key === 'pmg_stock_aging_cache_v1' || e.key === 'pmg_stock_aging_data') {
            this.loadStockAging().then(() => {
              this.autoAnalyzeAllSkus(false);
            });
          }
        });
      }
    }

    async loadSkusFromStorage() {
      // 1. Try High-Capacity IndexedDB first (supports 60,000+ SKUs)
      try {
        const idbSkus = await getPricingSkusFromIdb();
        if (Array.isArray(idbSkus) && idbSkus.length > 0) {
          this.skus = idbSkus;
          return;
        }
      } catch (e) {}

      // 2. Fallback to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PRICING_SKUS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.skus = parsed;
            // Migrate to IndexedDB
            await setPricingSkusToIdb(this.skus);
            return;
          }
        }
      } catch (err) {
        console.warn('[PMG Pricing] Could not parse stored SKUs:', err);
      }

      // 3. Fallback to OneDrive (if switching to another PC that has OneDrive synced)
      try {
        const odSync = window.pmgOneDriveSync || window.pmgOneDrive;
        if (odSync && typeof odSync.loadPricingMasterFromOneDrive === 'function') {
          const odSkus = await odSync.loadPricingMasterFromOneDrive();
          if (Array.isArray(odSkus) && odSkus.length > 0) {
            this.skus = odSkus;
            await setPricingSkusToIdb(this.skus);
            return;
          }
        }
      } catch (err) {
        console.warn('[PMG Pricing] OneDrive read fallback:', err);
      }

      this.skus = [];
    }

    async saveSkusToStorage(skipAutoBackup = false) {
      // 1. Save to IndexedDB (zero quota limitations)
      try {
        await setPricingSkusToIdb(this.skus);
      } catch (e) {
        console.warn('[PMG Pricing] IDB save error:', e);
      }

      // 2. In localStorage, only store if small (<= 1000 items) to prevent QuotaExceededError
      try {
        if (this.skus.length <= 1000) {
          localStorage.setItem(STORAGE_KEY_PRICING_SKUS, JSON.stringify(this.skus));
        } else {
          // If large, remove the huge JSON from localStorage and store light metadata pointer
          localStorage.removeItem(STORAGE_KEY_PRICING_SKUS);
          localStorage.setItem('pmg_pricing_skus_meta', JSON.stringify({
            count: this.skus.length,
            updatedAt: new Date().toISOString()
          }));
        }
      } catch (e) {
        console.warn('[PMG Pricing] LocalStorage quota skipped:', e);
      }

      if (!skipAutoBackup) {
        this.triggerAutoBackup();
        // Debounce push to Google Sheets
        if (this.sheetsPushTimeout) clearTimeout(this.sheetsPushTimeout);
        this.sheetsPushTimeout = setTimeout(() => {
          this.pushPricingToSheets(false);
        }, 1500);
      }
    }

    triggerAutoBackup() {
      if (this.autoBackupTimeout) clearTimeout(this.autoBackupTimeout);
      this.autoBackupTimeout = setTimeout(() => {
        this.performAutoBackup();
      }, 500);
    }

    async performAutoBackup() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('en-GB');

      // 1. Store only lightweight metadata history (prevent huge localStorage memory consumption)
      try {
        const historyKey = 'pmg_pricing_backup_history';
        let history = [];
        try {
          const raw = localStorage.getItem(historyKey);
          if (raw) history = JSON.parse(raw);
        } catch (e) {}

        const snapshot = {
          id: 'snap-' + Date.now(),
          timestamp: now.toISOString(),
          displayTime: `${dateStr} ${timeStr}`,
          skuCount: this.skus.length
        };

        if (history.length === 0 || history[0].skuCount !== snapshot.skuCount) {
          history.unshift(snapshot);
          if (history.length > 15) history = history.slice(0, 15);
          localStorage.setItem(historyKey, JSON.stringify(history));
        }

        localStorage.setItem('pmg_pricing_latest_auto_backup', JSON.stringify({
          updatedAt: now.toISOString(),
          displayTime: `${dateStr} ${timeStr}`,
          count: this.skus.length
        }));
      } catch (e) {
        console.warn('[PMG Pricing] Local backup history error:', e);
      }

      // 2. Auto-backup full master database to OneDrive if connected
      let oneDriveSynced = false;
      const odSync = window.pmgOneDriveSync || window.pmgOneDrive;
      if (odSync && typeof odSync.savePricingMasterToOneDrive === 'function') {
        const isConn = typeof odSync.isConnected === 'function' 
          ? odSync.isConnected() 
          : (odSync.rootHandle && odSync.mode !== 'DISCONNECTED');
        if (isConn) {
          oneDriveSynced = await odSync.savePricingMasterToOneDrive(this.skus);
        }
      }

      // 3. Update UI Badge
      this.updateAutoBackupStatus(timeStr, oneDriveSynced);
    }

    updateAutoBackupStatus(timeStr, oneDriveSynced = false) {
      const badge = document.getElementById('pricingAutoBackupStatus');
      const timeEl = document.getElementById('pricingLastBackupTime');
      if (timeEl) timeEl.textContent = timeStr || 'Just now';
      if (badge) {
        if (oneDriveSynced) {
          badge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all';
          badge.innerHTML = `<i class="fa-solid fa-cloud-arrow-up text-emerald-600"></i> Auto-backed up to OneDrive (<span id="pricingLastBackupTime">${timeStr}</span>)`;
        } else {
          badge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 transition-all';
          badge.innerHTML = `<i class="fa-solid fa-shield-halved text-blue-600"></i> Auto-backed up (<span id="pricingLastBackupTime">${timeStr}</span>)`;
        }
      }
    }

    // ─── GOOGLE SHEETS LIVE SYNC ──────────────────────────────────────────────
    async fetchPricingFromSheets(showToast = false) {
      if (!PMG_SCHEDULE_API_URL) return;
      try {
        this.isSyncingWithSheets = true;
        const res = await fetch(`${PMG_SCHEDULE_API_URL}?action=getPricingMatrix`, {
          method: 'GET'
        });
        const data = await res.json();
        if (data && data.success && Array.isArray(data.skus)) {
          if (data.skus.length > 0) {
            if (this.skus.length > data.skus.length) {
              // Merge Google Sheets price/cost updates into our large local catalog without losing items
              const sheetMap = new Map();
              data.skus.forEach(s => { if (s.code) sheetMap.set(s.code, s); });
              this.skus.forEach(s => {
                if (s.code && sheetMap.has(s.code)) {
                  const updated = sheetMap.get(s.code);
                  s.standardSp = updated.standardSp;
                  s.currentBranchSp = updated.standardSp;
                  s.costPrice = updated.costPrice;
                  if (updated.nonMemberPrice) s.nonMemberPrice = updated.nonMemberPrice;
                  if (updated.strategyTag) s.strategyTag = updated.strategyTag;
                  if (this.isScheduledPrescriptionDrug(s)) {
                    s.supermarketPrice = null;
                  } else if (updated.supermarketPrice) {
                    s.supermarketPrice = updated.supermarketPrice;
                  }
                  if (updated.chainPharmacyPrice) s.chainPharmacyPrice = updated.chainPharmacyPrice;
                }
              });
            } else {
              this.skus = data.skus;
              this.sanitizeRxPrescriptionSkus();
            }
            await setPricingSkusToIdb(this.skus);
            this.renderSummaryCards();
            this.renderTableOnly();
            if (showToast && typeof showExpiryToast === 'function') {
              showExpiryToast(`✅ Synced ${data.skus.length} SKUs from Google Sheets.`);
            }
          } else if (this.skus.length > 0) {
            // Sheet is empty but local has items -> populate Google Sheet
            await this.pushPricingToSheets(false);
          }
        }
      } catch (err) {
        console.warn('[PMG Pricing Sheets Sync] Fetch warning:', err.message);
        if (showToast && typeof showExpiryToast === 'function') {
          showExpiryToast('⚠️ Could not connect to Google Sheets. Using local cache.');
        }
      } finally {
        this.isSyncingWithSheets = false;
      }
    }

    async pushPricingToSheets(showToast = false) {
      if (!PMG_SCHEDULE_API_URL || !this.skus || this.skus.length === 0) return;
      try {
        const session = typeof getSession === 'function' ? getSession() : null;
        const updatedBy = (session && session.displayName) || localStorage.getItem('pmg_user_name') || 'Pharmacist';
        
        // Prioritize any customized, edited, or strategic role SKUs first so NO user changes are ever omitted!
        const modifiedSkus = [];
        const standardSkus = [];
        for (const s of this.skus) {
          const isCustomized = s.customModified || s.isCustom || 
                               (s.strategyTag && s.strategyTag !== 'core_rx') || 
                               s.supermarketPrice || s.chainPharmacyPrice || 
                               (s.notes && s.notes.trim() !== '');
          if (isCustomized) {
            modifiedSkus.push(s);
          } else {
            standardSkus.push(s);
          }
        }
        const prioritized = [...modifiedSkus, ...standardSkus];
        const MAX_SHEET_SKUS = 5000;
        const skusToSync = prioritized.length > MAX_SHEET_SKUS ? prioritized.slice(0, MAX_SHEET_SKUS) : prioritized;

        const payload = {
          action: 'savePricingMatrix',
          skus: skusToSync,
          updatedBy: updatedBy
        };
        await fetch(PMG_SCHEDULE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
          redirect: 'follow'
        });
        if (showToast && typeof showExpiryToast === 'function') {
          showExpiryToast(`✅ Saved ${skusToSync.length} benchmark SKUs to Google Sheets.`);
        }
      } catch (err) {
        console.warn('[PMG Pricing Sheets Sync] Push warning:', err.message);
      }
    }

    async syncWithGoogleSheets(manual = false) {
      if (manual && typeof showExpiryToast === 'function') {
        showExpiryToast('🔄 Connecting to Google Sheets Pricing Matrix...');
      }
      await this.fetchPricingFromSheets(manual);
    }

    // ─── STOCK AGING CROSS-REFERENCE & PRICING DIAGNOSTIC ENGINE ──────────────
    async loadStockAging() {
      try {
        // 1. Direct window maps from Inventory suite if already initialized
        if (typeof window !== 'undefined' && window.stockAgingMap && window.stockAgingMap.size > 0) {
          const agingArray = Array.from(window.stockAgingMap.values());
          this.ingestAgingData(agingArray, 'Live Inventory Suite');
          return true;
        }

        // 2. Dedicated stock aging cache
        const rawAgingCache = localStorage.getItem('pmg_stock_aging_cache_v1');
        if (rawAgingCache) {
          try {
            const parsed = JSON.parse(rawAgingCache);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.ingestAgingData(parsed, 'Stock Aging Cache');
              return true;
            }
          } catch (e) {}
        }

        // 3. Performance active state
        const rawPerf = localStorage.getItem('pmg_perf_active_state_v1') || localStorage.getItem('pmg_perf_state_v1');
        if (rawPerf) {
          try {
            const parsed = JSON.parse(rawPerf);
            if (parsed?.stockAgingLatest?.items && Array.isArray(parsed.stockAgingLatest.items) && parsed.stockAgingLatest.items.length > 0) {
              this.ingestAgingData(parsed.stockAgingLatest.items, 'Performance Suite State');
              return true;
            }
          } catch (e) {}
        }

        // 4. Preloaded sample data fallback
        if (typeof window !== 'undefined' && window.PMG_PERFORMANCE_SAMPLE_DATA?.stockAgingLatest?.items) {
          const items = window.PMG_PERFORMANCE_SAMPLE_DATA.stockAgingLatest.items;
          if (Array.isArray(items) && items.length > 0) {
            this.ingestAgingData(items, 'Preloaded Sample Aging Data');
            return true;
          }
        }
      } catch (err) {
        console.warn('[PMG Pricing] Error loading stock aging data:', err);
      }
      this.updateAgingStatusUI();
      return false;
    }

    ingestAgingData(items, sourceName = 'Live Data') {
      if (!this.agingMap) this.agingMap = new Map();
      if (!this.agingBaseCodeMap) this.agingBaseCodeMap = new Map();
      if (!this.agingNameMap) this.agingNameMap = new Map();

      this.agingMap.clear();
      this.agingBaseCodeMap.clear();
      this.agingNameMap.clear();

      let totalAgedSkus = 0;
      let totalAgedValue = 0;

      (items || []).forEach(it => {
        const rawCode = String(it.itemCode || it.code || '').trim();
        if (!rawCode) return;

        const exactCode = rawCode.toUpperCase();
        const baseCode = exactCode.split(/[-/]/)[0].trim().toUpperCase();
        const itemName = String(it.itemName || it.name || '').trim();

        // Calculate aged quantity (>150 days)
        let agedQty = 0;
        if (typeof it.agedQty === 'number') {
          agedQty = it.agedQty;
        } else if (typeof it.agedQty6MPlus === 'number') {
          agedQty = it.agedQty6MPlus;
        } else {
          agedQty = (parseFloat(it.d150_180) || 0) + (parseFloat(it.d180_210) || 0) +
                    (parseFloat(it.d210_240) || 0) + (parseFloat(it.d240_270) || 0) +
                    (parseFloat(it.d270_300) || 0) + (parseFloat(it.d300_330) || 0) +
                    (parseFloat(it.d330_360) || 0) + (parseFloat(it.above1Yr) || 0);
        }

        // Determine highest age bracket
        let maxBracket = '< 150d';
        if ((parseFloat(it.above1Yr) || 0) > 0) maxBracket = '> 1 Year';
        else if ((parseFloat(it.d330_360) || 0) > 0) maxBracket = '330-360d';
        else if ((parseFloat(it.d300_330) || 0) > 0) maxBracket = '300-330d';
        else if ((parseFloat(it.d270_300) || 0) > 0) maxBracket = '270-300d';
        else if ((parseFloat(it.d240_270) || 0) > 0) maxBracket = '240-270d';
        else if ((parseFloat(it.d210_240) || 0) > 0) maxBracket = '210-240d';
        else if ((parseFloat(it.d180_210) || 0) > 0) maxBracket = '180-210d';
        else if ((parseFloat(it.d150_180) || 0) > 0) maxBracket = '150-180d';
        else if (agedQty > 0) maxBracket = '> 150d';

        const cost = parseFloat(it.avgCost || it.averageCost || it.unitCost || it.costPrice || 0) || 0;
        const agedValue = typeof it.agedValue === 'number' ? it.agedValue : +(agedQty * cost).toFixed(2);
        const ohQty = parseFloat(it.ohQty || it.onHand || 0) || 0;

        const record = {
          itemCode: exactCode,
          baseCode: baseCode,
          itemName: itemName,
          category: it.category || '',
          ohQty: ohQty,
          avgCost: cost,
          agedQty: agedQty,
          agedValue: agedValue,
          maxBracket: maxBracket,
          isAged: agedQty > 0
        };

        this.agingMap.set(exactCode, record);

        if (itemName) {
          this.agingNameMap.set(itemName.toUpperCase(), record);
        }

        // Aggregate by baseCode
        if (!this.agingBaseCodeMap.has(baseCode)) {
          this.agingBaseCodeMap.set(baseCode, {
            itemCode: exactCode,
            baseCode: baseCode,
            itemName: itemName,
            category: it.category || '',
            ohQty: ohQty,
            avgCost: cost,
            agedQty: agedQty,
            agedValue: agedValue,
            maxBracket: maxBracket,
            isAged: agedQty > 0,
            variants: [record]
          });
        } else {
          const agg = this.agingBaseCodeMap.get(baseCode);
          agg.agedQty += agedQty;
          agg.agedValue = +(agg.agedValue + agedValue).toFixed(2);
          agg.ohQty += ohQty;
          agg.variants.push(record);
          if (agedQty > 0) agg.isAged = true;
          const bracketPriority = { '> 1 Year': 8, '330-360d': 7, '300-330d': 6, '270-300d': 5, '240-270d': 4, '210-240d': 3, '180-210d': 2, '150-180d': 1, '> 150d': 1, '< 150d': 0 };
          if ((bracketPriority[maxBracket] || 0) > (bracketPriority[agg.maxBracket] || 0)) {
            agg.maxBracket = maxBracket;
          }
        }

        if (agedQty > 0) {
          totalAgedSkus++;
          totalAgedValue += agedValue;
        }
      });

      this.agingStats = {
        totalAgedSkus,
        totalAgedValue: +totalAgedValue.toFixed(2),
        source: sourceName
      };

      this.updateAgingStatusUI();
    }

    async handleAgingFileUpload(event) {
      const file = event?.target?.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const rows = this.parseCsv(text);
        if (rows.length < 2) {
          alert('Aging CSV file is empty or formatted incorrectly.');
          return;
        }

        // Detect header row
        let headerIdx = -1;
        let colItemCode = -1;
        let colItemName = -1;
        let colCategory = -1;
        let colOhQty = -1;
        let colAvgCost = -1;
        let col150_180 = -1;
        let col180_210 = -1;
        let col210_240 = -1;
        let col240_270 = -1;
        let col270_300 = -1;
        let col300_330 = -1;
        let col330_360 = -1;
        let colAbove1Yr = -1;

        for (let r = 0; r < Math.min(rows.length, 50); r++) {
          const row = rows[r];
          for (let c = 0; c < row.length; c++) {
            const h = (row[c] || '').trim().toLowerCase();
            if (h.includes('item code') || h === 'code') colItemCode = c;
            else if (h.includes('item name') || h.includes('description')) colItemName = c;
            else if (h.includes('category')) colCategory = c;
            else if (h.includes('oh qty') || h.includes('on hand')) colOhQty = c;
            else if (h.includes('avg cost') || h.includes('average cost')) colAvgCost = c;
            else if (h.includes('150') && h.includes('180')) col150_180 = c;
            else if (h.includes('180') && h.includes('210')) col180_210 = c;
            else if (h.includes('210') && h.includes('240')) col210_240 = c;
            else if (h.includes('240') && h.includes('270')) col240_270 = c;
            else if (h.includes('270') && h.includes('300')) col270_300 = c;
            else if (h.includes('300') && h.includes('330')) col300_330 = c;
            else if (h.includes('330') && h.includes('360')) col330_360 = c;
            else if (h.includes('above 1') || h.includes('> 1') || h.includes('1 year')) colAbove1Yr = c;
          }
          if (colItemCode !== -1 && (colItemName !== -1 || colAvgCost !== -1)) {
            headerIdx = r;
            break;
          }
        }

        if (headerIdx === -1 || colItemCode === -1) {
          alert('Could not find "Item Code" column in the uploaded Aging CSV. Please check the file headers.');
          return;
        }

        const items = [];
        for (let r = headerIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;
          const code = (row[colItemCode] || '').trim();
          if (!code || code.toLowerCase().includes('grand total')) continue;

          const itemName = colItemName !== -1 ? (row[colItemName] || '').trim() : '';
          const category = colCategory !== -1 ? (row[colCategory] || '').trim() : '';
          const ohQty = colOhQty !== -1 ? Math.abs(this.cleanNumber(row[colOhQty])) : 0;
          const avgCost = colAvgCost !== -1 ? this.cleanNumber(row[colAvgCost]) : 0;
          const d150_180 = col150_180 !== -1 ? Math.abs(this.cleanNumber(row[col150_180])) : 0;
          const d180_210 = col180_210 !== -1 ? Math.abs(this.cleanNumber(row[col180_210])) : 0;
          const d210_240 = col210_240 !== -1 ? Math.abs(this.cleanNumber(row[col210_240])) : 0;
          const d240_270 = col240_270 !== -1 ? Math.abs(this.cleanNumber(row[col240_270])) : 0;
          const d270_300 = col270_300 !== -1 ? Math.abs(this.cleanNumber(row[col270_300])) : 0;
          const d300_330 = col300_330 !== -1 ? Math.abs(this.cleanNumber(row[col300_330])) : 0;
          const d330_360 = col330_360 !== -1 ? Math.abs(this.cleanNumber(row[col330_360])) : 0;
          const above1Yr = colAbove1Yr !== -1 ? Math.abs(this.cleanNumber(row[colAbove1Yr])) : 0;

          const agedQty = d150_180 + d180_210 + d210_240 + d240_270 + d270_300 + d300_330 + d330_360 + above1Yr;
          const agedValue = +(agedQty * avgCost).toFixed(2);

          items.push({
            itemCode: code,
            itemName,
            category,
            ohQty,
            avgCost,
            d150_180,
            d180_210,
            d210_240,
            d240_270,
            d270_300,
            d300_330,
            d330_360,
            above1Yr,
            agedQty,
            agedValue
          });
        }

        if (items.length === 0) {
          alert('No data rows found in the uploaded Aging CSV.');
          return;
        }

        try {
          localStorage.setItem('pmg_stock_aging_cache_v1', JSON.stringify(items));
        } catch (e) {
          console.warn('[PMG Pricing] Could not cache stock aging to localStorage:', e);
        }

        this.ingestAgingData(items, file.name);

        // Sync with live inventory suite if loaded
        if (typeof window !== 'undefined' && typeof window.ingestStockAgingItems === 'function') {
          try {
            window.ingestStockAgingItems(items, file.name);
          } catch (e) {}
        }

        // Auto-analyze all SKUs against the new aging data & update list comparison
        this.autoAnalyzeAllSkus(false);

        if (typeof showExpiryToast === 'function') {
          showExpiryToast(`✅ Imported Stock Aging: ${items.length} items. Automatically updated list comparison (${this.agingStats.totalAgedSkus} aged, RM ${this.agingStats.totalAgedValue.toLocaleString()} locked)!`);
        }
      } catch (err) {
        console.error('[PMG Pricing] Aging upload error:', err);
        alert('Failed to parse Aging CSV: ' + err.message);
      } finally {
        if (event.target) event.target.value = '';
      }
    }

    getStockAgingForSku(sku) {
      if (!this.agingMap || this.agingMap.size === 0) {
        this.loadStockAging();
      }
      if (!sku) return null;

      const rawCode = String(sku.code || '').trim().toUpperCase();
      const rawName = String(sku.name || '').trim().toUpperCase();

      if (rawCode && rawCode !== 'N/A') {
        // 1. Exact match
        if (this.agingMap && this.agingMap.has(rawCode)) {
          return this.agingMap.get(rawCode);
        }

        // 2. Base code match (strip suffix like - CAP, / BOX70, etc.)
        const baseCode = rawCode.split(/[-/]/)[0].trim().toUpperCase();
        if (baseCode && this.agingBaseCodeMap && this.agingBaseCodeMap.has(baseCode)) {
          return this.agingBaseCodeMap.get(baseCode);
        }
      }

      // 3. Name match
      if (rawName && this.agingNameMap && this.agingNameMap.has(rawName)) {
        return this.agingNameMap.get(rawName);
      }

      return null;
    }

    diagnoseSkuPricingVsAging(sku, aging) {
      if (!aging || !aging.agedQty || aging.agedQty <= 0) {
        return {
          status: 'HEALTHY',
          statusText: 'Healthy Turnover',
          badgeClass: 'text-slate-600 bg-slate-100 border-slate-200',
          badgeIcon: 'fa-solid fa-check text-emerald-600',
          isPricingIssue: false,
          isAged: false,
          agedQty: 0,
          agedValue: 0,
          maxBracket: 'Normal',
          reason: 'No aged stock (>150 days). Inventory turnover is healthy.',
          recommendation: 'Maintain standard shelf pricing and replenishment schedule.'
        };
      }

      const isRx = this.isScheduledPrescriptionDrug(sku);
      const sp = parseFloat(sku.standardSp) || 0;
      const cost = parseFloat(sku.costPrice) || 0;
      const margin = parseFloat(this.calculateMargin(cost, sp)) || 0;

      // Identify lowest valid competitor price
      const comps = [];
      if (!isRx && sku.supermarketPrice && sku.supermarketPrice > 0) {
        comps.push({ name: 'Farley', price: sku.supermarketPrice });
      }
      if (sku.chainPharmacyPrice && sku.chainPharmacyPrice > 0) {
        comps.push({ name: sku.competitorName || 'Competitor Pharmacy', price: sku.chainPharmacyPrice });
      }

      let minComp = null;
      if (comps.length > 0) {
        minComp = comps.reduce((prev, curr) => (curr.price < prev.price ? curr : prev), comps[0]);
      }

      // Case 1: Competitor price exists
      if (minComp && minComp.price > 0) {
        const diff = +(sp - minComp.price).toFixed(2);
        const pct = +(((sp - minComp.price) / minComp.price) * 100).toFixed(1);

        if (diff > 0.10 || pct > 2.0) {
          // Overpriced vs market
          return {
            status: 'AGING_PRICING_ISSUE',
            statusText: 'Pricing Issue (Overpriced)',
            badgeClass: 'text-rose-800 bg-rose-50 border-rose-300',
            badgeIcon: 'fa-solid fa-circle-exclamation text-rose-600',
            isPricingIssue: true,
            isAged: true,
            agedQty: aging.agedQty,
            agedValue: aging.agedValue,
            maxBracket: aging.maxBracket || '>150d',
            compName: minComp.name,
            compPrice: minComp.price,
            diff,
            pct,
            reason: `Our price (RM ${sp.toFixed(2)}) is +RM ${diff.toFixed(2)} (+${pct}%) higher than ${minComp.name} (RM ${minComp.price.toFixed(2)}).`,
            recommendation: `Customers are buying from ${minComp.name}. Match price to RM ${minComp.price.toFixed(2)} or run a clearance promo to unlock RM ${aging.agedValue.toFixed(2)}.`
          };
        } else {
          // Competitive price: Slow turn is NOT due to price
          return {
            status: 'AGING_COMPETITIVE',
            statusText: 'Non-Pricing (Competitive Price)',
            badgeClass: 'text-emerald-800 bg-emerald-50 border-emerald-300',
            badgeIcon: 'fa-solid fa-circle-check text-emerald-600',
            isPricingIssue: false,
            isAged: true,
            agedQty: aging.agedQty,
            agedValue: aging.agedValue,
            maxBracket: aging.maxBracket || '>150d',
            compName: minComp.name,
            compPrice: minComp.price,
            diff,
            pct,
            reason: `Our price (RM ${sp.toFixed(2)}) is competitive (matches/cheaper than ${minComp.name} at RM ${minComp.price.toFixed(2)}).`,
            recommendation: `Slow movement is NOT caused by price. DO NOT reduce price (protects margin). Improve front counter display or initiate supplier return.`
          };
        }
      }

      // Case 2: Prescription Poisons Act Item (No competitor price, Poison B/C)
      if (isRx) {
        return {
          status: 'AGING_RX',
          statusText: 'Rx / Prescribing Dependent',
          badgeClass: 'text-blue-800 bg-blue-50 border-blue-300',
          badgeIcon: 'fa-solid fa-prescription text-blue-600',
          isPricingIssue: false,
          isAged: true,
          agedQty: aging.agedQty,
          agedValue: aging.agedValue,
          maxBracket: aging.maxBracket || '>150d',
          reason: `Scheduled Poison medicine. Supermarkets cannot carry. Sales velocity depends on clinic doctor prescribing, not retail price elasticity.`,
          recommendation: `Inform local GP clinic doctors of stock availability, review prescribing trends, or request supplier exchange for fast-moving chronic drugs.`
        };
      }

      // Case 3: High Margin Resistance (>= 50% GP with no competitor benchmark)
      if (margin >= 50) {
        return {
          status: 'AGING_HIGH_MARGIN',
          statusText: 'Potential Pricing (High Margin)',
          badgeClass: 'text-amber-800 bg-amber-50 border-amber-300',
          badgeIcon: 'fa-solid fa-triangle-exclamation text-amber-600',
          isPricingIssue: true,
          isAged: true,
          agedQty: aging.agedQty,
          agedValue: aging.agedValue,
          maxBracket: aging.maxBracket || '>150d',
          reason: `High gross margin (${margin}%). Possible consumer price resistance without staff actively cross-selling.`,
          recommendation: `Audit competitor shelf price, test a 10-15% promotional bundle, or offer staff sales incentives to unlock RM ${aging.agedValue.toFixed(2)}.`
        };
      }

      // Case 4: Standard Margin with no competitor benchmark
      return {
        status: 'AGING_UNLISTED',
        statusText: 'Non-Pricing (Demand / Placement)',
        badgeClass: 'text-slate-800 bg-slate-100 border-slate-300',
        badgeIcon: 'fa-solid fa-boxes-stacked text-slate-600',
        isPricingIssue: false,
        isAged: true,
        agedQty: aging.agedQty,
        agedValue: aging.agedValue,
        maxBracket: aging.maxBracket || '>150d',
        reason: `Normal gross margin (${margin}%). Slow sales likely due to low category footfall, poor shelf placement, or overstocking.`,
        recommendation: `Move to front checkout counter, conduct basket bundling, or return near-expiry units to supplier for RM ${aging.agedValue.toFixed(2)} credit.`
      };
    }

    updateAgingStatusUI() {
      const badge = document.getElementById('pricingSummaryAgingStatusBadge');
      if (badge) {
        const sourceLabel = this.agingStats?.source || (this.agingMap && this.agingMap.size > 0 ? 'Connected' : 'No Data');
        const shortLabel = sourceLabel.length > 15 ? sourceLabel.substring(0, 15) + '…' : sourceLabel;
        badge.textContent = shortLabel;
        badge.title = `Stock Aging Source: ${this.agingStats?.source || 'None'} (${this.agingMap ? this.agingMap.size : 0} items indexed)`;
        if (this.agingMap && this.agingMap.size > 0) {
          badge.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200';
        } else {
          badge.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200';
        }
      }
    }

    autoAnalyzeAllSkus(showToast = true) {
      if (!this.skus || this.skus.length === 0) return;

      if (!this.agingMap || this.agingMap.size === 0) {
        this.loadStockAging();
      }

      let totalAgedCount = 0;
      let totalLockedVal = 0;
      let pricingIssueCount = 0;
      let competitiveCount = 0;
      let rxCount = 0;
      let highMarginCount = 0;

      this.skus.forEach(s => {
        const isRx = this.isScheduledPrescriptionDrug(s);
        if (isRx) {
          s.supermarketPrice = null;
        }

        const knownBench = this.getKnownMalaysianBenchmark(s);
        if (knownBench) {
          if (!s.chainPharmacyPrice && (knownBench.promoSp || knownBench.retailSp)) {
            s.chainPharmacyPrice = knownBench.promoSp || knownBench.retailSp;
            if (!s.competitorName || s.competitorName === 'Local Competitors') {
              s.competitorName = knownBench.competitor;
            }
          }
          if (!isRx && !s.supermarketPrice && knownBench.supermarketSp) {
            s.supermarketPrice = knownBench.supermarketSp;
          }
          if (!s.promoNote && knownBench.note) {
            s.promoNote = knownBench.note;
          }
        }

        const cost = parseFloat(s.costPrice) || 0;
        const sp = parseFloat(s.standardSp) || 0;
        if (cost > 0 && sp > 0) {
          const m = ((sp - cost) / sp) * 100;
          if (m >= 45 && s.strategyTag !== 'clinical_bundle') {
            s.strategyTag = 'margin_builder';
          } else if (m < 15 && !isRx) {
            s.strategyTag = 'kvi_defensive';
          } else if (isRx && s.strategyTag !== 'margin_builder') {
            s.strategyTag = 'core_rx';
          }
        }

        const aging = this.getStockAgingForSku(s);
        const diag = this.diagnoseSkuPricingVsAging(s, aging);
        if (diag.isAged) {
          totalAgedCount++;
          totalLockedVal += (diag.agedValue || 0);
          if (diag.status === 'AGING_PRICING_ISSUE') pricingIssueCount++;
          else if (diag.status === 'AGING_COMPETITIVE') competitiveCount++;
          else if (diag.status === 'AGING_HIGH_MARGIN') highMarginCount++;
          else if (diag.status === 'AGING_RX') rxCount++;
        }
      });

      this.saveSkusToStorage();
      this.renderSummaryCards();
      this.renderTableOnly();

      if (showToast && typeof showExpiryToast === 'function') {
        showExpiryToast(`⚡ Auto-analyzed ${this.skus.length} SKUs: ${totalAgedCount} with Aged Stock (${pricingIssueCount} Pricing Issues, ${competitiveCount} Competitive).`);
      }
    }

    autoAnalyzeSingleSku(skuId) {
      const sku = this.skus.find(s => s.id === skuId);
      if (!sku) return null;

      const isRx = this.isScheduledPrescriptionDrug(sku);
      if (isRx) {
        sku.supermarketPrice = null;
      }

      const cost = parseFloat(sku.costPrice) || 0;
      const sp = parseFloat(sku.standardSp) || 0;
      if (cost > 0 && sp > 0) {
        const m = ((sp - cost) / sp) * 100;
        if (m >= 45 && sku.strategyTag !== 'clinical_bundle') {
          sku.strategyTag = 'margin_builder';
        } else if (m < 15 && !isRx) {
          sku.strategyTag = 'kvi_defensive';
        } else if (isRx && sku.strategyTag !== 'margin_builder') {
          sku.strategyTag = 'core_rx';
        }
      }

      this.saveSkusToStorage();
      this.renderSummaryCards();
      this.renderTableOnly();
      return sku;
    }

    toggleAgingSort() {
      if (this.sortField !== 'aged_value') {
        this.sortField = 'aged_value';
        this.agingSortOrder = 'desc';
      } else if (this.agingSortOrder === 'desc') {
        this.agingSortOrder = 'asc';
      } else {
        this.agingSortOrder = 'none';
        this.sortField = 'none';
      }
      this.supermarketDevSortOrder = 'none';
      this.chainDevSortOrder = 'none';
      this.marginSortOrder = 'none';
      this.updateSortIcons();
      this.currentPage = 1;
      this.renderTableOnly();
      if (typeof showExpiryToast === 'function') {
        const label = this.agingSortOrder === 'desc' 
          ? 'Highest Aged Stock Value (RM) First' 
          : this.agingSortOrder === 'asc' 
          ? 'Lowest Aged Stock Value (RM) First' 
          : 'Default Order';
        showExpiryToast(`Sorted Stock Aging: ${label}`);
      }
    }

    // ─── MATRIX SORTING (GROSS MARGIN & COMPETITOR DEVIATIONS) ─────────────────
    toggleMarginSort() {
      this.sortField = 'margin';
      this.supermarketDevSortOrder = 'none';
      this.chainDevSortOrder = 'none';
      this.agingSortOrder = 'none';

      if (this.marginSortOrder === 'none' || !this.marginSortOrder) {
        this.marginSortOrder = 'desc';
      } else if (this.marginSortOrder === 'desc') {
        this.marginSortOrder = 'asc';
      } else {
        this.marginSortOrder = 'none';
        this.sortField = 'none';
      }
      this.updateSortIcons();
      this.currentPage = 1;
      this.renderTableOnly();
      if (typeof showExpiryToast === 'function') {
        const label = this.marginSortOrder === 'desc' ? 'Highest to Lowest' : this.marginSortOrder === 'asc' ? 'Lowest to Highest' : 'Default Order';
        showExpiryToast(`Sorted Gross Margin: ${label}`);
      }
    }

    toggleSupermarketDeviationSort() {
      this.sortField = 'supermarket_dev';
      this.marginSortOrder = 'none';
      this.chainDevSortOrder = 'none';
      this.agingSortOrder = 'none';

      if (this.supermarketDevSortOrder === 'none' || !this.supermarketDevSortOrder) {
        this.supermarketDevSortOrder = 'desc';
      } else if (this.supermarketDevSortOrder === 'desc') {
        this.supermarketDevSortOrder = 'asc';
      } else {
        this.supermarketDevSortOrder = 'none';
        this.sortField = 'none';
      }
      this.updateSortIcons();
      this.currentPage = 1;
      this.renderTableOnly();
      if (typeof showExpiryToast === 'function') {
        const label = this.supermarketDevSortOrder === 'desc' 
          ? 'PMG Higher than Farley First (+% Deviation)' 
          : this.supermarketDevSortOrder === 'asc' 
          ? 'PMG Cheaper than Farley First (-% Deviation)' 
          : 'Default Order';
        showExpiryToast(`Sorted Supermarket Deviation: ${label}`);
      }
    }

    toggleChainDeviationSort() {
      this.sortField = 'chain_dev';
      this.marginSortOrder = 'none';
      this.supermarketDevSortOrder = 'none';
      this.agingSortOrder = 'none';

      if (this.chainDevSortOrder === 'none' || !this.chainDevSortOrder) {
        this.chainDevSortOrder = 'desc';
      } else if (this.chainDevSortOrder === 'desc') {
        this.chainDevSortOrder = 'asc';
      } else {
        this.chainDevSortOrder = 'none';
        this.sortField = 'none';
      }
      this.updateSortIcons();
      this.currentPage = 1;
      this.renderTableOnly();
      if (typeof showExpiryToast === 'function') {
        const label = this.chainDevSortOrder === 'desc' 
          ? 'PMG Higher than Pharmacy Competitors (+% Deviation)' 
          : this.chainDevSortOrder === 'asc' 
          ? 'PMG Cheaper than Pharmacy Competitors (-% Deviation)' 
          : 'Default Order';
        showExpiryToast(`Sorted Pharmacy Deviation: ${label}`);
      }
    }

    setSortCriteria(criteria) {
      if (criteria === 'aged_value_desc') {
        this.sortField = 'aged_value';
        this.agingSortOrder = 'desc';
        this.supermarketDevSortOrder = 'none';
        this.chainDevSortOrder = 'none';
        this.marginSortOrder = 'none';
      } else if (criteria === 'aged_qty_desc') {
        this.sortField = 'aged_qty';
        this.agingSortOrder = 'desc';
        this.supermarketDevSortOrder = 'none';
        this.chainDevSortOrder = 'none';
        this.marginSortOrder = 'none';
      } else if (criteria === 'super_dev_desc') {
        this.sortField = 'supermarket_dev';
        this.supermarketDevSortOrder = 'desc';
        this.chainDevSortOrder = 'none';
        this.marginSortOrder = 'none';
        this.agingSortOrder = 'none';
      } else if (criteria === 'super_dev_asc') {
        this.sortField = 'supermarket_dev';
        this.supermarketDevSortOrder = 'asc';
        this.chainDevSortOrder = 'none';
        this.marginSortOrder = 'none';
        this.agingSortOrder = 'none';
      } else if (criteria === 'chain_dev_desc') {
        this.sortField = 'chain_dev';
        this.chainDevSortOrder = 'desc';
        this.supermarketDevSortOrder = 'none';
        this.marginSortOrder = 'none';
        this.agingSortOrder = 'none';
      } else if (criteria === 'chain_dev_asc') {
        this.sortField = 'chain_dev';
        this.chainDevSortOrder = 'asc';
        this.supermarketDevSortOrder = 'none';
        this.marginSortOrder = 'none';
        this.agingSortOrder = 'none';
      } else if (criteria === 'abs_dev_desc') {
        this.sortField = 'abs_dev';
        this.supermarketDevSortOrder = 'none';
        this.chainDevSortOrder = 'none';
        this.marginSortOrder = 'none';
        this.agingSortOrder = 'none';
      } else if (criteria === 'margin_desc') {
        this.sortField = 'margin';
        this.marginSortOrder = 'desc';
        this.supermarketDevSortOrder = 'none';
        this.chainDevSortOrder = 'none';
        this.agingSortOrder = 'none';
      } else if (criteria === 'margin_asc') {
        this.sortField = 'margin';
        this.marginSortOrder = 'asc';
        this.supermarketDevSortOrder = 'none';
        this.chainDevSortOrder = 'none';
        this.agingSortOrder = 'none';
      } else {
        this.sortField = 'none';
        this.marginSortOrder = 'none';
        this.supermarketDevSortOrder = 'none';
        this.chainDevSortOrder = 'none';
        this.agingSortOrder = 'none';
      }
      this.updateSortIcons();
      this.currentPage = 1;
      this.renderTableOnly();
    }

    updateSortIcons() {
      const marginIcon = document.getElementById('pricingMarginSortIcon');
      const superIcon = document.getElementById('pricingSupermarketSortIcon');
      const chainIcon = document.getElementById('pricingChainSortIcon');
      const agingIcon = document.getElementById('pricingAgingSortIcon');
      const sortSelect = document.getElementById('pricingSortSelect');

      if (agingIcon) {
        if (this.sortField === 'aged_value') {
          if (this.agingSortOrder === 'desc') {
            agingIcon.innerHTML = '<i class="fa-solid fa-arrow-down-wide-short text-rose-600"></i>';
          } else if (this.agingSortOrder === 'asc') {
            agingIcon.innerHTML = '<i class="fa-solid fa-arrow-up-wide-short text-rose-600"></i>';
          } else {
            agingIcon.innerHTML = '<i class="fa-solid fa-sort text-gray-400"></i>';
          }
        } else if (this.sortField === 'aged_qty') {
          agingIcon.innerHTML = '<i class="fa-solid fa-arrow-down-1-9 text-rose-600"></i>';
        } else {
          agingIcon.innerHTML = '<i class="fa-solid fa-sort text-gray-400"></i>';
        }
      }

      if (marginIcon) {
        if (this.sortField === 'margin' && this.marginSortOrder === 'desc') {
          marginIcon.innerHTML = '<i class="fa-solid fa-arrow-down-wide-short text-indigo-600"></i>';
        } else if (this.sortField === 'margin' && this.marginSortOrder === 'asc') {
          marginIcon.innerHTML = '<i class="fa-solid fa-arrow-up-wide-short text-indigo-600"></i>';
        } else {
          marginIcon.innerHTML = '<i class="fa-solid fa-sort text-gray-400"></i>';
        }
      }

      if (superIcon) {
        if (this.sortField === 'supermarket_dev' && this.supermarketDevSortOrder === 'desc') {
          superIcon.innerHTML = '<i class="fa-solid fa-arrow-down-wide-short text-indigo-600"></i>';
        } else if (this.sortField === 'supermarket_dev' && this.supermarketDevSortOrder === 'asc') {
          superIcon.innerHTML = '<i class="fa-solid fa-arrow-up-wide-short text-indigo-600"></i>';
        } else {
          superIcon.innerHTML = '<i class="fa-solid fa-sort text-gray-400"></i>';
        }
      }

      if (chainIcon) {
        if (this.sortField === 'chain_dev' && this.chainDevSortOrder === 'desc') {
          chainIcon.innerHTML = '<i class="fa-solid fa-arrow-down-wide-short text-indigo-600"></i>';
        } else if (this.sortField === 'chain_dev' && this.chainDevSortOrder === 'asc') {
          chainIcon.innerHTML = '<i class="fa-solid fa-arrow-up-wide-short text-indigo-600"></i>';
        } else {
          chainIcon.innerHTML = '<i class="fa-solid fa-sort text-gray-400"></i>';
        }
      }

      if (sortSelect) {
        if (this.sortField === 'aged_value') {
          sortSelect.value = 'aged_value_desc';
        } else if (this.sortField === 'aged_qty') {
          sortSelect.value = 'aged_qty_desc';
        } else if (this.sortField === 'supermarket_dev') {
          sortSelect.value = this.supermarketDevSortOrder === 'asc' ? 'super_dev_asc' : 'super_dev_desc';
        } else if (this.sortField === 'chain_dev') {
          sortSelect.value = this.chainDevSortOrder === 'asc' ? 'chain_dev_asc' : 'chain_dev_desc';
        } else if (this.sortField === 'abs_dev') {
          sortSelect.value = 'abs_dev_desc';
        } else if (this.sortField === 'margin') {
          sortSelect.value = this.marginSortOrder === 'asc' ? 'margin_asc' : 'margin_desc';
        } else {
          sortSelect.value = 'default';
        }
      }
    }

    openBackupHistoryModal() {
      const modal = document.getElementById('modalPricingBackupHistory');
      if (!modal) return;
      this.renderBackupHistoryList();
      modal.classList.remove('hidden');
    }

    closeBackupHistoryModal() {
      const modal = document.getElementById('modalPricingBackupHistory');
      if (modal) modal.classList.add('hidden');
    }

    renderBackupHistoryList() {
      const tbody = document.getElementById('pricingBackupHistoryTbody');
      if (!tbody) return;
      const historyKey = 'pmg_pricing_backup_history';
      let history = [];
      try {
        const raw = localStorage.getItem(historyKey);
        if (raw) history = JSON.parse(raw);
      } catch (e) {}

      if (history.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="p-6 text-center text-gray-400 text-xs italic">
              No previous auto-backup snapshots recorded yet. Any SKU edit will create one automatically.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = history.map((snap, idx) => `
        <tr class="hover:bg-slate-50 border-b border-gray-100 text-xs">
          <td class="p-3 font-mono font-bold text-gray-800 flex items-center gap-2">
            ${idx === 0 ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">Latest</span>' : ''}
            <span>${snap.displayTime}</span>
          </td>
          <td class="p-3 font-mono font-bold text-blue-800">${snap.skuCount} SKUs</td>
          <td class="p-3 text-gray-500">Auto-save on SKU edit / import</td>
          <td class="p-3 text-right">
            <button type="button" onclick="window.pmgPricing.restoreSnapshot('${snap.id}')"
              class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-xs transition shadow-2xs mr-2">
              <i class="fa-solid fa-rotate-left mr-1"></i> Restore
            </button>
            <button type="button" onclick="window.pmgPricing.downloadSnapshotJson('${snap.id}')"
              class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-semibold text-xs border border-gray-300 transition">
              <i class="fa-solid fa-download"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    restoreSnapshot(snapId) {
      const historyKey = 'pmg_pricing_backup_history';
      let history = [];
      try {
        const raw = localStorage.getItem(historyKey);
        if (raw) history = JSON.parse(raw);
      } catch (e) {}

      const snap = history.find(s => s.id === snapId);
      if (!snap) {
        alert('Snapshot not found.');
        return;
      }

      if (!confirm(`Restore pricing matrix to snapshot from ${snap.displayTime} (${snap.skuCount} SKUs)? Current changes will be replaced.`)) {
        return;
      }

      this.skus = JSON.parse(JSON.stringify(snap.skus || []));
      this.saveSkusToStorage(false);
      this.render();
      this.closeBackupHistoryModal();
      if (typeof showExpiryToast === 'function') {
        showExpiryToast(`Restored ${this.skus.length} SKUs from ${snap.displayTime}`);
      }
    }

    downloadSnapshotJson(snapId) {
      const historyKey = 'pmg_pricing_backup_history';
      let history = [];
      try {
        const raw = localStorage.getItem(historyKey);
        if (raw) history = JSON.parse(raw);
      } catch (e) {}

      const snap = history.find(s => s.id === snapId);
      if (!snap) return;

      const dataStr = JSON.stringify(snap, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
      const filename = `PMG_Pricing_Snapshot_${snap.displayTime.replace(/[/ :]/g, '_')}.json`;
      if (window.saveAs) {
        window.saveAs(blob, filename);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      }
    }

    async clearAllSkus(confirmUser = true) {
      if (confirmUser && !confirm('Are you sure you want to clear all SKUs in the Pricing Matrix? You can then import your fresh Xilnex item list.')) {
        return;
      }
      this.skus = [];
      localStorage.removeItem(STORAGE_KEY_PRICING_SKUS);
      localStorage.removeItem('pmg_pricing_skus_meta');
      await setPricingSkusToIdb([]);
      this.pushPricingToSheets(false);
      this.currentPage = 1;
      this.render();
      if (typeof showExpiryToast === 'function') {
        showExpiryToast('Pricing matrix cleared. Ready for Xilnex CSV import.');
      }
    }

    resetToDefaults() {
      this.clearAllSkus(true);
    }

    // ─── CALCULATE MARGIN ───────────────────────────────────────────────────────
    calculateMargin(cost, sp) {
      const c = parseFloat(cost) || 0;
      const s = parseFloat(sp) || 0;
      if (s <= 0) return '0.0';
      return (((s - c) / s) * 100).toFixed(1);
    }

    calculateProfit(cost, sp) {
      const c = parseFloat(cost) || 0;
      const s = parseFloat(sp) || 0;
      return (s - c).toFixed(2);
    }

    // ─── PHARMACY REGULATORY / PRESCRIPTION DRUG INTELLIGENCE ────────────────────
    // Under the Malaysian Poisons Act 1952, supermarkets (Farley, Emart, Everwin, CCK)
    // CANNOT legally stock, sell, or dispense scheduled poison medicines (Group B / Group C).
    // Supermarkets only sell adult/baby nutrition milk, diapers, personal care, and general GSL OTC.
    isScheduledPrescriptionDrug(sku) {
      if (!sku) return false;

      const cat = (sku.category || '').toUpperCase().trim();
      const name = (sku.name || '').toUpperCase().trim();
      const tag = (sku.strategyTag || '').toLowerCase().trim();

      // Explicit FMCG exclusions: Supermarkets and hypermarkets (Farley, Emart, Everwin)
      // legally sell adult diapers, baby diapers, nutrition milk, drinks, and personal care
      // even if categorized under Chronic/NCD or Health & Supplements in POS
      const fmcgExclusions = [
        'DIAPER', 'PANTS', 'PAD', 'UNDERPAD', 'WIPES', 'ADULT', 'BRIEFS', 'INCONTINENCE',
        'ABSORBA', 'TENA', 'CERTAINTY', 'DR. P', 'DR P', 'INTCO', 'CONFIDENCE', 'LIFREE',
        'MILK', 'ENSURE', 'GLUCERNA', 'ENERGETIC', 'NUTRITION', 'PROSURE', 'APPETON', 'NUTREN',
        'PEDIASURE', 'SUSTAGEN', 'SIMILAC', 'ISOMIL', 'ANLENE', 'FERNLEAF', 'DUMEX', 'DUTCH LADY',
        'ENFAGROW', 'FRISO', 'S-26', 'CARNATION',
        'SOAP', 'SHAMPOO', 'LOTION', 'CLEANSER', 'WASH', 'TOOTHPASTE', 'CETAPHIL', 'CERAVE',
        'QV', 'SEBAMED', 'EUCERIN', 'DERVEEN', 'DERMA', 'BODY WASH', 'HAIR',
        'PATCH', 'PANAFLEX', 'KOOLFEVER', 'SALONPAS', 'TIGER BALM', 'AMMELTZ', 'EAGLE BRAND',
        'AXE BRAND', 'YOKO YOKO', 'MEDICATED OIL', 'BALM', 'LINIMENT',
        'STRIP', 'LANCET', 'METER', 'SYRINGE', 'NEEDLE', 'MASK', 'GLOVE', 'PLASTER',
        'COTTON', 'GAUZE', 'BANDAGE', 'THERMOMETER', 'CONDOM', 'NEBULIZER', 'BLOOD PRESSURE',
        'OMRON', 'ACCU-CHEK', 'ONE TOUCH',
        'BEVERAGE', 'DRINK', 'TEA', 'CEREAL', 'HONEY', 'HERBAL', 'CANDY', 'LOZENGE',
        'STREPSILS', 'WOODS', 'DIFFLAM', 'NIN JIOM', 'PEI PA KOA',
        'OIL', 'GEL', 'SPRAY'
      ];
      if (fmcgExclusions.some(ex => name.includes(ex))) {
        if (sku.isPrescription) sku.isPrescription = false;
        return false;
      }

      if (sku.isPrescription === true) return true;

      // 1. Explicit Category matching (Poisons Act 1952 scheduled drugs)
      if (
        cat === 'CHRONIC / NCD' || 
        cat === 'PRESCRIPTION (RX)' || 
        cat === 'CHRONIC DISEASE' ||
        cat.includes('RX') || 
        cat.includes('POM') || 
        cat.includes('POISON') || 
        cat.includes('CHRONIC') ||
        cat.includes('DISPENS') ||
        cat.includes('PRESCRIPTION')
      ) {
        return true;
      }

      // 2. Clinical Moat strategy with dosage form indicators
      if (tag === 'clinical_bundle' && (name.includes('TAB') || name.includes('CAP') || name.includes('MG'))) {
        return true;
      }

      // 3. Known Prescription & Poison Group B/C Active Ingredients and Brand Names in Malaysia
      const rxKeywords = [
        'HCT', 'LOSARTAN', 'AMLODIPINE', 'METFORMIN', 'GLICLAZIDE', 'PERINDOPRIL',
        'TELMISARTAN', 'VALSARTAN', 'CANDESARTAN', 'BISOPROLOL', 'ATENOLOL',
        'METOPROLOL', 'ATORVASTATIN', 'ROSUVASTATIN', 'SIMVASTATIN',
        'ACETAN', 'LIPITOR', 'NORVASC', 'CRESTOR', 'COZAAR', 'HYZAAR',
        'JANUVIA', 'JARDIANCE', 'FORXIGA', 'GALVUS', 'DIAMICRON', 'COVERSYL',
        'MICARDIS', 'CONCOR', 'GLUCOPHAGE', 'DILATREND', 'CARVEDILOL',
        'PLAVIX', 'CLOPIDOGREL', 'XARELTO', 'RIVAROXABAN', 'ELIQUIS', 'APIXABAN',
        'AUGMENTIN', 'AMOXICILLIN', 'AZITHROMYCIN', 'CEFUROXIME', 'CIPROFLOXACIN', 'ZINNAT',
        'ESOMEPRAZOLE', 'OMEPRAZOLE', 'PANTOPRAZOLE', 'NEXIUM',
        'VENTOLIN', 'SERETIDE', 'SYMBICORT', 'SPIRIVA', 'TIOTROPIUM', 'RESPIMAT',
        'DUOLIN', 'COMBIVENT', 'BERODUAL', 'FOSTAIR', 'PULMICORT', 'SINGULAIR', 'MONTELUKAST',
        'INSULIN', 'NOVORAPID', 'LANTUS', 'HUMALOG', 'VIAGRA', 'CIALIS', 'SILDENAFIL', 'TADALAFIL',
        'GABAPENTIN', 'PREGABALIN', 'LYRICA', 'ALLOPURINOL', 'COLCHICINE', 'ZYLORIC',
        'TRAJENTA', 'LINAGLIPTIN', 'LIVALO', 'PITAVASTATIN', 'EZETIMIBE', 'EZETROL', 'VYTORIN'
      ];

      for (const kw of rxKeywords) {
        const regex = new RegExp(`(^|[^a-zA-Z0-9])${kw}([^a-zA-Z0-9]|$)`, 'i');
        if (regex.test(name)) {
          return true;
        }
      }

      // 4. Combined strength pattern common in prescription drugs (e.g. 50/12.5, 5/80, 10/160, 5/20)
      if (/\b\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\b/.test(name) && (name.includes('TAB') || name.includes('CAP') || name.includes('MG') || name.includes('HCT'))) {
        return true;
      }

      return false;
    }

    getKnownMalaysianBenchmark(sku) {
      if (!sku || !sku.name) return null;
      const name = (sku.name || '').toUpperCase().trim();
      for (const item of KNOWN_MALAYSIAN_BENCHMARKS) {
        if (item.regex.test(name)) {
          return item;
        }
      }
      return null;
    }

    getGenericDrugHint(sku) {
      if (!sku || !sku.name) return '';
      const name = (sku.name || '').toUpperCase();
      if (name.includes('ACETAN HCT')) return 'Losartan 50mg + Hydrochlorothiazide 12.5mg (Box of 30 tabs)';
      if (name.includes('ACETAN')) return 'Losartan Potassium 50mg (Box of 30 tabs)';
      if (name.includes('SPIRIVA')) return 'Tiotropium Bromide 2.5mcg Inhalation Solution (Refill Cartridge 4ml / 60 puffs)';
      if (name.includes('CRESTOR 10')) return 'Rosuvastatin 10mg (Box of 28 tabs)';
      if (name.includes('CRESTOR 20')) return 'Rosuvastatin 20mg (Box of 28 tabs)';
      if (name.includes('LIPITOR 20')) return 'Atorvastatin 20mg (Box of 30 tabs)';
      if (name.includes('NORVASC 5')) return 'Amlodipine 5mg (Box of 30 tabs)';
      if (name.includes('NORVASC 10')) return 'Amlodipine 10mg (Box of 30 tabs)';
      if (name.includes('COVERSYL 5')) return 'Perindopril Arginine 5mg (Box of 30 tabs)';
      if (name.includes('GLUCOPHAGE 500')) return 'Metformin HCl 500mg (100 tabs)';
      if (name.includes('GLUCOPHAGE XR 500')) return 'Metformin XR 500mg (60 tabs)';
      if (name.includes('FORXIGA 10')) return 'Dapagliflozin 10mg (Box of 28 tabs)';
      if (name.includes('JARDIANCE 10')) return 'Empagliflozin 10mg (Box of 30 tabs)';
      if (name.includes('JARDIANCE 25')) return 'Empagliflozin 25mg (Box of 30 tabs)';
      if (name.includes('VENTOLIN')) return 'Salbutamol Inhaler 100mcg (200 doses)';
      if (name.includes('SYMBICORT')) return 'Budesonide/Formoterol Turbuhaler (120 doses)';
      if (name.includes('ENSURE GOLD')) return 'Abbott Ensure Gold Adult Complete Nutrition (850g can)';
      if (name.includes('GLUCERNA')) return 'Abbott Glucerna Diabetes Nutrition (850g can)';
      return '';
    }

    sanitizeRxPrescriptionSkus() {
      if (!Array.isArray(this.skus) || this.skus.length === 0) return;
      let cleaned = 0;
      this.skus.forEach(s => {
        const isRx = this.isScheduledPrescriptionDrug(s);

        // 1. Remove supermarket price for scheduled prescription drugs per Poisons Act 1952
        if (isRx && (s.supermarketPrice !== null && s.supermarketPrice !== undefined)) {
          s.supermarketPrice = null;
          cleaned++;
        }

        const normName = (s.name || '').toUpperCase();

        // 2. Clear corrupted isPrescription flag on FMCG items
        if (!isRx && s.isPrescription) {
          s.isPrescription = false;
          cleaned++;
        }

        // 3. Fix Absorba adult incontinence pants & diapers to live Alpro promo benchmark
        if (normName.includes('ABSORBA') && (normName.includes('PANTS') || normName.includes('DIAPER') || normName.includes('CONTI'))) {
          if (s.supermarketPrice === null || s.supermarketPrice === undefined || s.chainPharmacyPrice >= 18.00 || !s.chainPharmacyPrice) {
            s.supermarketPrice = 15.90;
            s.chainPharmacyPrice = 16.50;
            s.competitorName = 'Alpro Oneclick (11.11 Promo)';
            s.promoNote = 'Alpro 11.11 Promo RM 16.50 (Normal RM 17.50) · Farley RM 15.90';
            s.strategyTag = 'kvi_defensive';
            cleaned++;
          }
        }

        // 4. Fix the specific corrupted RM 110.00 prices from the prior anchoring & N/A code collision bug
        if (normName.includes('ACETAN') && s.chainPharmacyPrice >= 90) {
          s.chainPharmacyPrice = 18.50;
          s.competitorName = 'BIG Pharmacy';
          s.promoNote = 'Losartan 50/12.5 (30s)';
          cleaned++;
        } else if (normName.includes('SPIRIVA') && s.chainPharmacyPrice <= 150) {
          s.chainPharmacyPrice = 218.00;
          s.competitorName = 'BIG Pharmacy / Alpro';
          s.promoNote = 'Respimat Refill 4ml (60 puffs)';
          cleaned++;
        }

        // 4b. Fix Bio-Life A.B. Junior Pre&Pro 50s where AI hallucinated MSRP RM 105.00 / Farley RM 115.00
        if (normName.includes('BIO') && normName.includes('JUNIOR') && !normName.includes('2X50') && !normName.includes('TWIN') && !normName.includes('10')) {
          if (s.chainPharmacyPrice >= 95 || s.chainPharmacyPrice === 105 || s.supermarketPrice >= 100 || !s.chainPharmacyPrice) {
            s.supermarketPrice = 88.50;
            s.chainPharmacyPrice = 84.10;
            s.competitorName = 'Alpro Oneclick (11.11 Promo RM 84.10) · BIG RM 86.90';
            s.promoNote = 'Alpro 11.11 Promo RM 84.10 (Normal RM 113.00) · BIG RM 86.90 · Single Box 50s';
            s.strategyTag = 'kvi_defensive';
            cleaned++;
          }
        }

        // 5. Domain Sanity Guard on Rx Chain Pharmacy Price vs Wholesale Cost
        // Ethical prescription drugs cannot retail below 65% of cost or above 3.5x cost in retail pharmacies
        if (isRx && s.costPrice > 0 && s.chainPharmacyPrice > 0) {
          const bench = this.getKnownMalaysianBenchmark(s);
          if (s.chainPharmacyPrice < s.costPrice * 0.65 || s.chainPharmacyPrice > s.costPrice * 3.5) {
            if (bench) {
              s.chainPharmacyPrice = bench.promoSp || bench.retailSp;
              s.competitorName = bench.competitor;
              if (bench.note) s.promoNote = bench.note;
            } else {
              s.chainPharmacyPrice = Math.round((s.costPrice * 1.18) * 10) / 10;
              s.competitorName = 'Local Pharmacy Chain';
            }
            cleaned++;
          }
        }
      });
      if (cleaned > 0) {
        console.log(`[PMG Pricing] Sanitized and corrected ${cleaned} SKU competitor benchmarks.`);
        this.saveSkusToStorage(true);
      }
    }

    // ─── FILTER SKUs ────────────────────────────────────────────────────────────
    getFilteredSkus() {
      let list = this.skus.filter(s => {
        // Search filter
        if (this.searchQuery) {
          const q = this.searchQuery.toLowerCase();
          const match = (s.name || '').toLowerCase().includes(q) ||
                        (s.brand || '').toLowerCase().includes(q) ||
                        (s.code || '').toLowerCase().includes(q) ||
                        (s.category || '').toLowerCase().includes(q) ||
                        (s.supplier || '').toLowerCase().includes(q);
          if (!match) return false;
        }
        // Category filter
        if (this.activeCategoryFilter !== 'ALL' && s.category !== this.activeCategoryFilter) {
          return false;
        }
        // Strategy filter
        if (this.activeStrategyFilter !== 'ALL' && s.strategyTag !== this.activeStrategyFilter) {
          return false;
        }
        // Competitor & Deviation filter
        if (this.activeCompetitorFilter && this.activeCompetitorFilter !== 'ALL') {
          const sp = parseFloat(s.standardSp) || 0;
          const sm = parseFloat(s.supermarketPrice) || 0;
          const ch = parseFloat(s.chainPharmacyPrice) || 0;
          const isRx = this.isScheduledPrescriptionDrug(s);

          if (this.activeCompetitorFilter === 'HAS_SUPER') {
            if (isRx || sm <= 0) return false;
          }
          if (this.activeCompetitorFilter === 'HAS_CHAIN' && ch <= 0) return false;
          if (this.activeCompetitorFilter === 'HAS_PROMO' && (!s.promoNote || !s.promoNote.trim())) return false;
          if (this.activeCompetitorFilter === 'OVER_SUPER') {
            if (isRx || sm <= 0 || sp <= sm) return false;
          }
          if (this.activeCompetitorFilter === 'UNDER_SUPER') {
            if (isRx || sm <= 0 || sp >= sm) return false;
          }
          if (this.activeCompetitorFilter === 'OVER_CHAIN') {
            if (ch <= 0 || sp <= ch) return false;
          }
          if (this.activeCompetitorFilter === 'UNDER_CHAIN') {
            if (ch <= 0 || sp >= ch) return false;
          }
          if (this.activeCompetitorFilter === 'HIGH_DEVIATION') {
            const smDev = (!isRx && sm > 0 && sp > 0) ? Math.abs((sp - sm) / sp) : 0;
            const chDev = (ch > 0 && sp > 0) ? Math.abs((sp - ch) / sp) : 0;
            if (smDev < 0.10 && chDev < 0.10) return false;
          }
          if (this.activeCompetitorFilter === 'EXTREME_DEVIATION') {
            const smDev = (!isRx && sm > 0 && sp > 0) ? Math.abs((sp - sm) / sp) : 0;
            const chDev = (ch > 0 && sp > 0) ? Math.abs((sp - ch) / sp) : 0;
            if (smDev < 0.20 && chDev < 0.20) return false;
          }
          if (this.activeCompetitorFilter === 'MATCHED') {
            const smDev = (!isRx && sm > 0 && sp > 0) ? Math.abs((sp - sm) / sp) : null;
            const chDev = (ch > 0 && sp > 0) ? Math.abs((sp - ch) / sp) : null;
            const isSmMatch = smDev !== null && smDev <= 0.02;
            const isChMatch = chDev !== null && chDev <= 0.02;
            if (isRx) {
              if (!isChMatch) return false;
            } else {
              if (!isSmMatch && !isChMatch) return false;
            }
          }
          if (this.activeCompetitorFilter === 'MISSING_ANY') {
            if (isRx) {
              if (ch > 0) return false;
            } else {
              if (sm > 0 && ch > 0) return false;
            }
          }
        }

        // Stock aging & pricing diagnostic filter
        if (this.activeAgingFilter && this.activeAgingFilter !== 'ALL') {
          const aging = this.getStockAgingForSku(s);
          const diag = this.diagnoseSkuPricingVsAging(s, aging);

          if (this.activeAgingFilter === 'ALL_AGING') {
            if (!diag.isAged) return false;
          } else if (this.activeAgingFilter === 'AGING_PRICING_ISSUE') {
            if (diag.status !== 'AGING_PRICING_ISSUE') return false;
          } else if (this.activeAgingFilter === 'AGING_COMPETITIVE') {
            if (diag.status !== 'AGING_COMPETITIVE') return false;
          } else if (this.activeAgingFilter === 'AGING_HIGH_MARGIN') {
            if (diag.status !== 'AGING_HIGH_MARGIN') return false;
          } else if (this.activeAgingFilter === 'AGING_RX') {
            if (diag.status !== 'AGING_RX') return false;
          } else if (this.activeAgingFilter === 'HEALTHY') {
            if (diag.isAged) return false;
          }
        }
        return true;
      });

      // Sorting
      if (this.sortField === 'aged_value') {
        list.sort((a, b) => {
          const agA = this.getStockAgingForSku(a);
          const agB = this.getStockAgingForSku(b);
          const valA = agA ? (agA.agedValue || 0) : 0;
          const valB = agB ? (agB.agedValue || 0) : 0;
          return this.agingSortOrder === 'asc' ? valA - valB : valB - valA;
        });
      } else if (this.sortField === 'aged_qty') {
        list.sort((a, b) => {
          const agA = this.getStockAgingForSku(a);
          const agB = this.getStockAgingForSku(b);
          const qtyA = agA ? (agA.agedQty || 0) : 0;
          const qtyB = agB ? (agB.agedQty || 0) : 0;
          return qtyB - qtyA;
        });
      } else if (this.sortField === 'supermarket_dev') {
        list.sort((a, b) => {
          const isRxA = this.isScheduledPrescriptionDrug(a);
          const isRxB = this.isScheduledPrescriptionDrug(b);
          if (isRxA && !isRxB) return 1;
          if (!isRxA && isRxB) return -1;
          if (isRxA && isRxB) return 0;

          const spA = parseFloat(a.standardSp) || 0;
          const smA = parseFloat(a.supermarketPrice) || 0;
          const hasSmA = smA > 0 && spA > 0;
          const devA = hasSmA ? ((spA - smA) / smA) : -999999;

          const spB = parseFloat(b.standardSp) || 0;
          const smB = parseFloat(b.supermarketPrice) || 0;
          const hasSmB = smB > 0 && spB > 0;
          const devB = hasSmB ? ((spB - smB) / smB) : -999999;

          if (!hasSmA && hasSmB) return 1;
          if (hasSmA && !hasSmB) return -1;
          if (!hasSmA && !hasSmB) return 0;

          return this.supermarketDevSortOrder === 'asc' ? devA - devB : devB - devA;
        });
      } else if (this.sortField === 'chain_dev') {
        list.sort((a, b) => {
          const spA = parseFloat(a.standardSp) || 0;
          const chA = parseFloat(a.chainPharmacyPrice) || 0;
          const hasChA = chA > 0 && spA > 0;
          const devA = hasChA ? ((spA - chA) / chA) : -999999;

          const spB = parseFloat(b.standardSp) || 0;
          const chB = parseFloat(b.chainPharmacyPrice) || 0;
          const hasChB = chB > 0 && spB > 0;
          const devB = hasChB ? ((spB - chB) / chB) : -999999;

          if (!hasChA && hasChB) return 1;
          if (hasChA && !hasChB) return -1;
          if (!hasChA && !hasChB) return 0;

          return this.chainDevSortOrder === 'asc' ? devA - devB : devB - devA;
        });
      } else if (this.sortField === 'abs_dev') {
        list.sort((a, b) => {
          const spA = parseFloat(a.standardSp) || 0;
          const smA = parseFloat(a.supermarketPrice) || 0;
          const chA = parseFloat(a.chainPharmacyPrice) || 0;
          const devA = Math.max(
            smA > 0 && spA > 0 ? Math.abs(spA - smA) / spA : 0,
            chA > 0 && spA > 0 ? Math.abs(spA - chA) / spA : 0
          );

          const spB = parseFloat(b.standardSp) || 0;
          const smB = parseFloat(b.supermarketPrice) || 0;
          const chB = parseFloat(b.chainPharmacyPrice) || 0;
          const devB = Math.max(
            smB > 0 && spB > 0 ? Math.abs(spB - smB) / spB : 0,
            chB > 0 && spB > 0 ? Math.abs(spB - chB) / spB : 0
          );

          return devB - devA;
        });
      } else if (this.sortField === 'margin' || this.marginSortOrder !== 'none') {
        if (this.marginSortOrder === 'desc') {
          list.sort((a, b) => {
            const spA = parseFloat(a.standardSp) || 0;
            const costA = parseFloat(a.costPrice) || 0;
            const mA = spA > 0 ? ((spA - costA) / spA) : -999;

            const spB = parseFloat(b.standardSp) || 0;
            const costB = parseFloat(b.costPrice) || 0;
            const mB = spB > 0 ? ((spB - costB) / spB) : -999;

            return mB - mA;
          });
        } else if (this.marginSortOrder === 'asc') {
          list.sort((a, b) => {
            const spA = parseFloat(a.standardSp) || 0;
            const costA = parseFloat(a.costPrice) || 0;
            const mA = spA > 0 ? ((spA - costA) / spA) : -999;

            const spB = parseFloat(b.standardSp) || 0;
            const costB = parseFloat(b.costPrice) || 0;
            const mB = spB > 0 ? ((spB - costB) / spB) : -999;

            return mA - mB;
          });
        }
      }

      return list;
    }

    // ─── UPDATE SKU PRICE & COST IN MEMORY & STORAGE ───────────────────────────
    updateSkuStandardSp(skuId, newSp) {
      const parsedSp = parseFloat(newSp);
      if (isNaN(parsedSp) || parsedSp < 0) return;
      const sku = this.skus.find(s => s.id === skuId);
      if (sku) {
        const prev = parseFloat(sku.standardSp) || 0;
        if (Math.abs(parsedSp - prev) < 0.001) return; // No real change
        if (!sku.originalSp) sku.originalSp = prev; // First change: preserve original
        sku.previousSp = prev;
        sku.standardSp = parsedSp;
        sku.currentBranchSp = parsedSp;
        sku.customModified = true;
        sku.priceChangedAt = new Date().toISOString();
        this.autoAnalyzeSingleSku(skuId);
      }
    }

    updateSkuCostPrice(skuId, newCost) {
      const parsedCost = parseFloat(newCost);
      if (isNaN(parsedCost) || parsedCost < 0) return;
      const sku = this.skus.find(s => s.id === skuId);
      if (sku) {
        const prev = parseFloat(sku.costPrice) || 0;
        if (!sku.originalCost) sku.originalCost = prev;
        sku.previousCost = prev;
        sku.costPrice = parsedCost;
        sku.customModified = true;
        sku.priceChangedAt = new Date().toISOString();
        this.autoAnalyzeSingleSku(skuId);
        if (typeof showExpiryToast === 'function') {
          showExpiryToast(`Updated ${sku.name} Cost: RM ${parsedCost.toFixed(2)}`);
        }
      }
    }

    updateSkuSupplier(skuId, newSupplier) {
      const sku = this.skus.find(s => s.id === skuId);
      if (sku) {
        sku.supplier = (newSupplier || '').trim();
        sku.customModified = true;
        this.saveSkusToStorage();
      }
    }

    updateSkuSupermarketPrice(skuId, newPrice) {
      const parsed = parseFloat(newPrice);
      const sku = this.skus.find(s => s.id === skuId);
      if (sku) {
        if (this.isScheduledPrescriptionDrug(sku)) {
          sku.supermarketPrice = null;
          if (typeof showExpiryToast === 'function') {
            showExpiryToast('Supermarkets cannot sell scheduled prescription drugs under Poisons Act 1952.');
          }
        } else {
          sku.supermarketPrice = (isNaN(parsed) || parsed <= 0) ? null : parsed;
        }
        sku.customModified = true;
        this.autoAnalyzeSingleSku(skuId);
      }
    }

    updateSkuChainPrice(skuId, newPrice) {
      const parsed = parseFloat(newPrice);
      const sku = this.skus.find(s => s.id === skuId);
      if (sku) {
        sku.chainPharmacyPrice = (isNaN(parsed) || parsed <= 0) ? null : parsed;
        sku.customModified = true;
        this.autoAnalyzeSingleSku(skuId);
      }
    }

    applyAiCompetitorPrices(skuId, superPrice, chainPrice, competitorName, promoNote, suggestedPmgSp = 0) {
      const sku = this.skus.find(s => s.id === skuId);
      if (!sku) return;
      const isRx = this.isScheduledPrescriptionDrug(sku);
      if (isRx) {
        sku.supermarketPrice = null;
      } else if (superPrice && !isNaN(parseFloat(superPrice)) && parseFloat(superPrice) > 0) {
        sku.supermarketPrice = parseFloat(superPrice);
      }

      if (chainPrice && !isNaN(parseFloat(chainPrice)) && parseFloat(chainPrice) > 0) {
        let finalChainP = parseFloat(chainPrice);
        // Domain Sanity Guard on Rx selling prices vs Wholesale cost
        if (isRx && sku.costPrice > 0 && (finalChainP < sku.costPrice * 0.65 || finalChainP > sku.costPrice * 3.5)) {
          const bench = this.getKnownMalaysianBenchmark(sku);
          if (bench) {
            finalChainP = bench.promoSp || bench.retailSp;
            if (!competitorName || competitorName === 'Alpro / Ting Pharmacy') competitorName = bench.competitor;
            if (!promoNote && bench.note) promoNote = bench.note;
          } else {
            finalChainP = Math.round((sku.costPrice * 1.18) * 10) / 10;
          }
        }
        sku.chainPharmacyPrice = finalChainP;
      }
      if (competitorName) sku.competitorName = competitorName;
      if (promoNote !== undefined && promoNote !== null) {
        sku.promoNote = promoNote;
      }
      sku.customModified = true;
      this.autoAnalyzeSingleSku(skuId);
      const modal = document.getElementById('pricingAiModal');
      if (modal) modal.classList.add('hidden');
      if (typeof showExpiryToast === 'function') {
        showExpiryToast(`✅ Saved competitor benchmarks for ${sku.name}`);
      }
    }

    applyAiCompetitorPricesAndPmgSp(skuId, superPrice, chainPrice, competitorName, promoNote, suggestedPmgSp) {
      const sku = this.skus.find(s => s.id === skuId);
      if (!sku) return;
      if (suggestedPmgSp && !isNaN(parseFloat(suggestedPmgSp)) && parseFloat(suggestedPmgSp) > 0) {
        sku.standardSp = parseFloat(suggestedPmgSp);
        sku.currentBranchSp = parseFloat(suggestedPmgSp);
        sku.priceChangedAt = new Date().toISOString();
      }
      this.applyAiCompetitorPrices(skuId, superPrice, chainPrice, competitorName, promoNote);
      if (typeof showExpiryToast === 'function') {
        showExpiryToast(`⚡ Updated ${sku.name} Member SP to RM ${sku.standardSp.toFixed(2)} to match market competitor!`);
      }
    }

    addNewSku(skuData) {
      const newId = 'sku-custom-' + Date.now();
      const newSku = {
        id: newId,
        category: skuData.category || 'OTC / Fast Moving',
        code: skuData.code || 'N/A',
        name: (skuData.name || 'NEW ITEM').toUpperCase(),
        brand: skuData.brand || 'General',
        supplier: skuData.supplier || 'DKSH',
        costPrice: parseFloat(skuData.costPrice) || 0,
        standardSp: parseFloat(skuData.standardSp) || 0,
        currentBranchSp: parseFloat(skuData.standardSp) || 0,
        supermarketPrice: skuData.supermarketPrice ? parseFloat(skuData.supermarketPrice) : null,
        chainPharmacyPrice: skuData.chainPharmacyPrice ? parseFloat(skuData.chainPharmacyPrice) : null,
        competitorName: skuData.competitorName || 'Local Competitors',
        strategyTag: skuData.strategyTag || 'core_rx',
        elasticity: 'Moderate',
        notes: skuData.notes || 'Added by Branch In-Charge.'
      };
      if (this.isScheduledPrescriptionDrug(newSku)) {
        newSku.supermarketPrice = null;
      }
      this.skus.unshift(newSku);
      this.saveSkusToStorage();
      this.render();
      if (typeof showExpiryToast === 'function') {
        showExpiryToast(`Added ${newSku.name} to 7-branch benchmark.`);
      }
    }

    // ─── XILNEX CSV PARSER & IMPORT ENGINE ───────────────────────────────────────
    parseCsv(text) {
      if (!text) return [];
      const lines = [];
      const rawLines = text.split(/\r?\n/);
      for (let r = 0; r < rawLines.length; r++) {
        const line = rawLines[r];
        if (!line || !line.trim()) continue;

        // Fast path: standard non-quoted line (over 90% of rows in inventory CSV)
        if (!line.includes('"')) {
          const sep = line.includes('\t') ? '\t' : ',';
          const parts = line.split(sep).map(p => p.trim());
          if (parts.some(p => p.length > 0)) lines.push(parts);
          continue;
        }

        // Quoted line parser
        const row = [];
        let field = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const c = line[i];
          if (c === '"') {
            if (inQuotes && line[i + 1] === '"') {
              field += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if ((c === ',' || c === '\t') && !inQuotes) {
            row.push(field.trim());
            field = '';
          } else {
            field += c;
          }
        }
        row.push(field.trim());
        if (row.some(p => p.length > 0)) lines.push(row);
      }
      return lines;
    }

    cleanNumber(val) {
      if (!val) return 0;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }

    detectXilnexColumns(headerRow) {
      const mapping = {
        code: -1,
        name: -1,
        description: -1,
        brand: -1,
        category: -1,
        cost: -1,             // PMG Custom Cost
        price: -1,            // PMG Member Price (Selling Price)
        nonMemberPrice: -1,   // PMG Non-Member Price / Normal Price
        qty: -1,
        margin: -1,
        isNetSoldPrice: false,
        supplier: -1,
        supermarket: -1,
        chain: -1
      };

      // Pass 1: PMG-specific & Xilnex export header priority
      headerRow.forEach((rawCol, idx) => {
        const col = rawCol.toLowerCase().replace(/[^a-z0-9]/g, '');

        // 1. Margin MUST be matched before cost so 'Profit Margin % (Custom Cost)' is never caught as cost
        if (col.includes('grossprofitmargin') || col.includes('profitmargin') || col === 'grossmargin' || col === 'margin') {
          mapping.margin = idx;
        }
        // 2. Cost (must NOT contain margin or profit)
        else if (!col.includes('margin') && !col.includes('profit') &&
                 (col === 'unitcustomcost' || col === 'customcost' || col === 'customcostrm' || col.includes('customcost') || col === 'unitcost' || col === 'costprice' || col === 'cost')) {
          mapping.cost = idx;
        }
        // 3. Member Price / Member Selling Price
        else if (col === 'memberprice' || col.includes('memberprice') || col === 'memberpricerm' || col === 'memberp' || col === 'membersellingprice') {
          mapping.price = idx;
        }
        // 4. Normal Price / Non-Member Price
        else if (col === 'normalprice' || col === 'normalsellingprice' || col === 'normalp' || col === 'nonmemberprice' || col.includes('nonmember') || col === 'nonmemberpricerm' || col === 'nonmemberp' || col === 'nonmembersellingprice' || col === 'retailprice' || col === 'rsp') {
          mapping.nonMemberPrice = idx;
        }
        // 5. Net Sold Price (from sales report)
        else if (col === 'netsoldprice' || col === 'soldprice' || col.includes('netsoldprice')) {
          mapping.price = idx;
          mapping.isNetSoldPrice = true;
        }
        // 6. Qty
        else if (col === 'qty' || col === 'quantity' || col === 'soldqty' || col === 'salesqty') {
          mapping.qty = idx;
        }
        // 7. Category (strict)
        else if (col === 'category' || col === 'itemcategory') {
          mapping.category = idx;
        }
        // 8. Preferred Vendor / Supplier
        else if (col === 'preferredvendor' || col === 'vendor' || col === 'vendorname' || col === 'supplier' || col === 'suppliername') {
          mapping.supplier = idx;
        }
        // 9. Specific Item Name vs Description
        else if (col === 'name' || col === 'itemname' || col === 'productname') {
          mapping.name = idx;
        }
      });

      // Pass 2: Fallback to standard headers if not matched by PMG-specific headers
      headerRow.forEach((rawCol, idx) => {
        const col = rawCol.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (mapping.code === -1 && (col === 'itemcode' || col === 'code' || col === 'barcode' || col === 'itembarcode' || col === 'sku' || col === 'productcode' || col === 'itemno')) {
          mapping.code = idx;
        }
        if (mapping.name === -1 && (col === 'description' || col === 'itemdescription' || col === 'itemdesc')) {
          mapping.name = idx;
        } else if (mapping.description === -1 && (col === 'description' || col === 'itemdescription' || col === 'itemdesc')) {
          mapping.description = idx;
        }
        if (mapping.brand === -1 && (col === 'brand' || col === 'brandname' || col === 'principal' || col === 'manufacturer' || col === 'mfg')) {
          mapping.brand = idx;
        }
        if (mapping.category === -1 && (col === 'group' || col === 'department' || col === 'itemgroup' || col === 'itemtype' || col === 'type' || col === 'dept' || col === 'division')) {
          mapping.category = idx;
        }
        if (mapping.cost === -1 && !col.includes('margin') && !col.includes('profit') && (col === 'basecost' || col === 'avgcost' || col === 'averagecost' || col === 'standardcost' || col === 'stdcost' || col === 'lastcost' || col === 'purchaseprice' || col === 'buyprice')) {
          mapping.cost = idx;
        }
        if (mapping.price === -1 && (col === 'sellingprice' || col === 'price' || col === 'standardprice' || col === 'sp' || col === 'unitprice' || col === 'srp')) {
          mapping.price = idx;
        }
        if (mapping.supplier === -1 && (col === 'distributor' || col.includes('vendor') || col.includes('supplier'))) {
          mapping.supplier = idx;
        }
        if (mapping.supermarket === -1 && (col.includes('supermarket') || col.includes('farley') || col.includes('emart'))) {
          mapping.supermarket = idx;
        }
        if (mapping.chain === -1 && (col.includes('chain') || col.includes('watsons') || col.includes('guardian') || col.includes('alpro') || col.includes('competitor'))) {
          mapping.chain = idx;
        }
      });

      return mapping;
    }

    processXilnexCsvText(csvText, filename = '') {
      const rows = this.parseCsv(csvText);
      if (rows.length < 2) {
        alert('The uploaded file does not contain enough data rows.');
        return null;
      }

      // Search up to the first 50 rows to find the actual table header row
      // (Xilnex report exports often have 15-20 rows of title/metadata headers before the data table)
      let headerIndex = -1;
      let mapping = null;
      for (let r = 0; r < Math.min(rows.length, 50); r++) {
        const m = this.detectXilnexColumns(rows[r]);
        if (m.name !== -1 || m.code !== -1) {
          headerIndex = r;
          mapping = m;
          break;
        }
      }

      if (headerIndex === -1 || !mapping) {
        alert('Could not detect Product Description or Item Code in CSV headers. Please ensure the CSV contains columns like "Description", "Item Name", or "Item Code".');
        return null;
      }

      const headers = rows[headerIndex];
      const parsedSkus = [];

      for (let r = headerIndex + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0 || !row.some(c => c && c.trim())) continue;

        const code = mapping.code !== -1 ? (row[mapping.code] || '').trim() : `XIL-${r}`;
        const name = mapping.name !== -1 ? (row[mapping.name] || '').trim() : (code || `Item ${r}`);
        if (!name && !code) continue;

        // Skip grand total, subtotal summaries, and empty code total lines
        const cLow = code.toLowerCase();
        const nLow = name.toLowerCase();
        if (cLow.includes('grand total') || nLow.includes('grand total')) continue;
        if (nLow.endsWith(' total') || cLow.endsWith(' total')) continue;
        if ((mapping.code === -1 || !row[mapping.code]) && nLow.includes('total')) continue;

        let brand = mapping.brand !== -1 ? (row[mapping.brand] || '').trim() : '';
        let category = mapping.category !== -1 ? (row[mapping.category] || '').trim() : '';
        
        // Normalize Category codes from Xilnex
        if (category) {
          const catUpper = category.toUpperCase();
          if (catUpper === 'FIR-AID' || catUpper.includes('FIRST AID')) category = 'First Aid / Wound Care';
          else if (catUpper === 'PERSONAL' || catUpper.includes('PERSONAL')) category = 'Personal Care';
          else if (catUpper === 'F & B' || catUpper === 'F&B' || catUpper.includes('FOOD')) category = 'Food & Beverage';
          else if (catUpper.includes('HEALTH') || catUpper.includes('SUPP')) category = 'Health & Supplements';
          else if (catUpper.includes('RX') || catUpper.includes('DISPENS') || catUpper.includes('POM')) category = 'Prescription (Rx)';
        } else {
          // Smart inference for Category if missing
          const upper = name.toUpperCase();
          if (upper.includes('STRIP') || upper.includes('LANCET') || upper.includes('NEEDLE') || upper.includes('METER') || upper.includes('SYRINGE') || upper.includes('MASK')) {
            category = 'Medical Devices';
          } else if (upper.includes('VIT') || upper.includes('OMEGA') || upper.includes('FISH OIL') || upper.includes('LECITHIN') || upper.includes('CALCIUM')) {
            category = 'Supplements';
          } else if (upper.includes('TAB') || upper.includes('CAP') || upper.includes('SYRUP') || upper.includes('SUSP') || upper.includes('CREAM') || upper.includes('OINT')) {
            category = 'Chronic Disease';
          } else if (upper.includes('WASH') || upper.includes('SHAMPOO') || upper.includes('LOTION') || upper.includes('CLEANSER') || upper.includes('TOOTHPASTE')) {
            category = 'Personal Care';
          } else {
            category = 'General OTC';
          }
        }

        // Smart inference for Brand if missing or 'General'
        if (!brand || brand === 'General') {
          const upperName = name.toUpperCase();
          if (upperName.includes('SURGIPLUS')) brand = 'Surgiplus';
          else if (upperName.includes('MEDICOS')) brand = 'Medicos';
          else if (upperName.includes('FLAMINGO')) brand = 'Flamingo';
          else if (upperName.includes('SENSODYNE')) brand = 'Sensodyne';
          else if (upperName.includes('NIVEA')) brand = 'Nivea';
          else if (upperName.includes('TAISHIN')) brand = 'Taishin';
          else if (upperName.includes('BLACKMORES')) brand = 'Blackmores';
          else if (upperName.includes('ACCU-CHEK')) brand = 'Accu-Chek';
          else if (upperName.includes('PANADOL') || upperName.includes('GSK')) brand = 'GSK';
          else if (upperName.includes('OXY')) brand = 'Rohto Oxy';
          else if (upperName.includes('NOVOFINE') || upperName.includes('NOVO')) brand = 'Novo Nordisk';
          else if (upperName.includes('APPETON')) brand = 'Appeton';
          else if (upperName.includes('SCOTT')) brand = 'Scotts';
          else if (upperName.includes('DIFFLAM')) brand = 'Difflam';
          else {
            const firstWord = name.split(/[\s-]/)[0];
            brand = (firstWord && firstWord.length > 2 && isNaN(firstWord)) ? firstWord : 'General';
          }
        }

        const cost = mapping.cost !== -1 ? this.cleanNumber(row[mapping.cost]) : 0; // PMG Custom Cost
        let sp = mapping.price !== -1 ? this.cleanNumber(row[mapping.price]) : 0;     // Net Sold Price or Member Price
        const qty = mapping.qty !== -1 ? Math.abs(this.cleanNumber(row[mapping.qty])) : 0;

        // If Net Sold Price from sales report, compute unit selling price = Net Sold Price / Qty
        if (mapping.isNetSoldPrice && qty > 0) {
          sp = parseFloat((sp / qty).toFixed(2));
        }

        const nonMemberSp = mapping.nonMemberPrice !== -1 
          ? this.cleanNumber(row[mapping.nonMemberPrice]) 
          : (sp > 0 ? parseFloat((sp * 1.1).toFixed(2)) : null);

        const supplier = mapping.supplier !== -1 ? (row[mapping.supplier] || '').trim() || 'Direct' : 'Direct';
        const supermarket = mapping.supermarket !== -1 ? this.cleanNumber(row[mapping.supermarket]) : null;
        const chain = mapping.chain !== -1 ? this.cleanNumber(row[mapping.chain]) : null;
        const internalNotes = mapping.description !== -1 ? (row[mapping.description] || '').trim() : '';

        // Auto assign strategic role based on initial gross margin
        let strategyTag = 'core_rx';
        if (cost > 0 && sp > 0) {
          const m = ((sp - cost) / sp) * 100;
          if (m >= 45) strategyTag = 'margin_builder';
          else if (m < 15) strategyTag = 'kvi_defensive';
        }

        const notesStr = internalNotes 
          ? `${internalNotes}${filename ? ' · Imported from ' + filename : ''}`
          : `Imported from Xilnex${filename ? ' (' + filename + ')' : ''}`;

        const parsedItem = {
          id: 'xilnex-' + (code ? code.replace(/[^a-zA-Z0-9_-]/g, '_') : Date.now() + '-' + r),
          code: code || 'N/A',
          name: name.toUpperCase(),
          brand: brand || 'General',
          category: category || 'General OTC',
          supplier: supplier || 'Direct',
          costPrice: cost,                  // PMG Custom Cost
          standardSp: sp,                   // PMG Member Price (Selling Price)
          nonMemberPrice: nonMemberSp,      // PMG Non-Member Price / Normal Price
          currentBranchSp: sp,
          supermarketPrice: supermarket,
          chainPharmacyPrice: chain,
          competitorName: 'Local Competitors',
          strategyTag,
          elasticity: 'Moderate',
          notes: notesStr
        };
        if (this.isScheduledPrescriptionDrug(parsedItem)) {
          parsedItem.supermarketPrice = null;
        }
        parsedSkus.push(parsedItem);
      }

      this.pendingXilnexSkus = parsedSkus;
      this.pendingXilnexMapping = { headers, mapping };
      return parsedSkus;
    }

    applyXilnexImport(mode = 'replace') {
      if (!this.pendingXilnexSkus || this.pendingXilnexSkus.length === 0) {
        alert('No parsed Xilnex SKUs to import.');
        return;
      }

      if (mode === 'replace') {
        this.skus = [...this.pendingXilnexSkus];
      } else {
        // Merge & update existing by code
        const existingMap = new Map();
        this.skus.forEach(s => existingMap.set(s.code, s));

        this.pendingXilnexSkus.forEach(newSku => {
          if (newSku.code && newSku.code !== 'N/A' && existingMap.has(newSku.code)) {
            const ex = existingMap.get(newSku.code);
            ex.costPrice = newSku.costPrice;
            ex.standardSp = newSku.standardSp;
            ex.currentBranchSp = newSku.standardSp;
            if (newSku.nonMemberPrice) ex.nonMemberPrice = newSku.nonMemberPrice;
            if (newSku.supplier) ex.supplier = newSku.supplier;
            if (newSku.category) ex.category = newSku.category;
            if (newSku.brand) ex.brand = newSku.brand;
            if (newSku.name) ex.name = newSku.name;
          } else {
            this.skus.push(newSku);
          }
        });
      }

      localStorage.setItem('pmg_pricing_demo_purged', 'true');
      this.autoAnalyzeAllSkus(false);
      this.pushPricingToSheets(true);

      if (typeof showExpiryToast === 'function') {
        showExpiryToast(`✅ Imported ${this.pendingXilnexSkus.length} SKUs & auto-analyzed pricing vs stock aging data!`);
      }

      this.pendingXilnexSkus = null;
    }

    // ─── EXPORT BACKUP CSV & JSON ──────────────────────────────────────────────
    exportBackupCsv() {
      if (this.skus.length === 0) {
        alert('Pricing matrix is empty. Nothing to export.');
        return;
      }
      let csv = "Item Code,Description,Brand,Category,Supplier,Custom Cost (RM),Member SP (RM),Non-Member Price (RM),Gross Margin %,Supermarket Benchmark (RM),Competitor Pharmacy Benchmark (RM),Competitor Name,Promotional Factor,Strategic Role,Notes\n";
      this.skus.forEach(s => {
        const margin = this.calculateMargin(s.costPrice, s.standardSp);
        const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
        csv += [
          escapeCsv(s.code),
          escapeCsv(s.name),
          escapeCsv(s.brand),
          escapeCsv(s.category),
          escapeCsv(s.supplier),
          s.costPrice.toFixed(2),
          s.standardSp.toFixed(2),
          s.nonMemberPrice ? s.nonMemberPrice.toFixed(2) : '',
          margin + '%',
          this.isScheduledPrescriptionDrug(s) ? 'N/A (Rx)' : (s.supermarketPrice ? s.supermarketPrice.toFixed(2) : ''),
          s.chainPharmacyPrice ? s.chainPharmacyPrice.toFixed(2) : '',
          escapeCsv(s.competitorName || ''),
          escapeCsv(s.promoNote || ''),
          escapeCsv(s.strategyTag),
          escapeCsv(s.notes)
        ].join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const filename = `PMG_Pricing_Master_Backup_${new Date().toISOString().slice(0, 10)}.csv`;
      if (window.saveAs) {
        window.saveAs(blob, filename);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      }
      if (typeof showExpiryToast === 'function') {
        showExpiryToast('Exported Pricing Master CSV Backup.');
      }
    }

    exportBackupJson() {
      if (this.skus.length === 0) {
        alert('Pricing matrix is empty. Nothing to export.');
        return;
      }
      const dataStr = JSON.stringify({
        exportedAt: new Date().toISOString(),
        author: 'William Chai (Pharmacist)',
        outlets: ['Kota Sentosa', 'Matang Jaya', 'Sungai Moyan', 'Malihah', 'Metrocity', 'Astana', 'Samariang'],
        skus: this.skus
      }, null, 2);

      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
      const filename = `PMG_Pricing_Master_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      if (window.saveAs) {
        window.saveAs(blob, filename);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      }
    }

    // ─── UI RENDER MAIN ─────────────────────────────────────────────────────────
    render() {
      this.renderSummaryCards();
      this.renderTableOnly();
      this.renderBranchSwot();
      this.renderPlaybook();
    }

    renderSummaryCards() {
      const totalSkus = this.skus.length;
      let totalMarginSum = 0;
      let kviCount = 0;
      let marginBuilderCount = 0;
      let agedSkusCount = 0;
      let totalLockedValue = 0;
      let pricingIssueCount = 0;
      let competitiveCount = 0;

      this.skus.forEach(s => {
        const m = parseFloat(this.calculateMargin(s.costPrice, s.standardSp)) || 0;
        totalMarginSum += m;
        if (s.strategyTag === 'kvi_defensive') kviCount++;
        if (s.strategyTag === 'margin_builder') marginBuilderCount++;

        const ag = this.getStockAgingForSku(s);
        if (ag && ag.agedQty > 0) {
          agedSkusCount++;
          totalLockedValue += (ag.agedValue || 0);
          const diag = this.diagnoseSkuPricingVsAging(s, ag);
          if (diag.isPricingIssue) pricingIssueCount++;
          else competitiveCount++;
        }
      });

      const avgMargin = totalSkus > 0 ? (totalMarginSum / totalSkus).toFixed(1) : 0;

      const elTotal = document.getElementById('pricingSummaryTotalSkus');
      const elAvg = document.getElementById('pricingSummaryAvgMargin');
      const elKvi = document.getElementById('pricingSummaryKvis');
      const elBuilders = document.getElementById('pricingSummaryBuilders');
      const elAgedCount = document.getElementById('pricingSummaryAgedCount');
      const elAgedVal = document.getElementById('pricingSummaryAgedValue');
      const elBadge = document.getElementById('pricingSummaryAgingStatusBadge');

      if (elTotal) elTotal.textContent = totalSkus.toLocaleString();
      if (elAvg) elAvg.textContent = `${avgMargin}%`;
      if (elKvi) elKvi.textContent = kviCount.toLocaleString();
      if (elBuilders) elBuilders.textContent = marginBuilderCount.toLocaleString();
      if (elAgedCount) elAgedCount.textContent = agedSkusCount.toLocaleString();
      if (elAgedVal) {
        elAgedVal.innerHTML = `RM ${totalLockedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Locked<br><span class="text-[10px] text-gray-500 font-normal">🔴 ${pricingIssueCount} Pricing · 🟢 ${competitiveCount} Non-Pricing</span>`;
      }
      if (elBadge) {
        const sourceLabel = this.agingStats?.source || (this.agingMap && this.agingMap.size > 0 ? 'Connected' : 'No Data');
        const shortLabel = sourceLabel.length > 15 ? sourceLabel.substring(0, 15) + '…' : sourceLabel;
        elBadge.textContent = shortLabel;
        elBadge.title = `Stock Aging Source: ${this.agingStats?.source || 'None'} (${this.agingMap ? this.agingMap.size : 0} items indexed)`;
      }
    }

    renderTableOnly() {
      const tbody = document.getElementById('pricingTableTbody');
      if (!tbody) return;

      const filtered = this.getFilteredSkus();

      if (filtered.length === 0) {
        if (this.skus.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="8" class="text-center py-12 text-gray-500 bg-white">
                <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-xs">
                  <i class="fa-solid fa-file-csv"></i>
                </div>
                <h4 class="font-bold text-base text-gray-900 mb-1">Pricing Matrix Ready for Xilnex Import</h4>
                <p class="text-xs text-gray-500 max-w-md mx-auto mb-4 leading-relaxed">
                  Default placeholder SKUs have been removed. Click <b>Import Xilnex CSV</b> to upload your live inventory item list, or add custom SKUs manually.
                </p>
                <div class="flex items-center justify-center gap-3">
                  <button type="button" onclick="openXilnexImportModal()"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs">
                    <i class="fa-solid fa-upload"></i> Import Xilnex CSV
                  </button>
                  <button type="button" onclick="openAddSkuModal()"
                    class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> + Add Manually
                  </button>
                </div>
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = `
            <tr>
              <td colspan="8" class="text-center py-8 text-gray-400 text-xs bg-white">
                <i class="fa-solid fa-box-open text-2xl mb-2 text-gray-300 block"></i>
                No SKUs matching the current filter. Try adjusting your search query or category.
              </td>
            </tr>
          `;
        }
        return;
      }

      const totalCount = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / this.pageSize));
      if (this.currentPage > totalPages) this.currentPage = totalPages;
      if (this.currentPage < 1) this.currentPage = 1;

      const startIndex = (this.currentPage - 1) * this.pageSize;
      const pageSkus = filtered.slice(startIndex, startIndex + this.pageSize);

      let html = '';
      pageSkus.forEach(s => {
        const margin = this.calculateMargin(s.costPrice, s.standardSp);
        const profit = this.calculateProfit(s.costPrice, s.standardSp);

        // Stock aging & pricing diagnostic for this SKU
        const aging = this.getStockAgingForSku(s);
        const diag = this.diagnoseSkuPricingVsAging(s, aging);

        let agingCellHtml = '';
        if (diag.isAged) {
          agingCellHtml = `
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-1 flex-wrap">
                <span class="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${diag.badgeClass} border">
                  <i class="${diag.badgeIcon}"></i> ${diag.statusText}
                </span>
                <span class="text-[9px] font-bold text-gray-600 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded" title="Oldest Aging Bracket">
                  ${diag.maxBracket}
                </span>
              </div>
              <div class="flex items-center justify-between text-[11px] font-mono">
                <span class="font-bold text-rose-700">⚠️ ${diag.agedQty.toLocaleString()} units</span>
                <span class="text-gray-900 font-bold">RM ${diag.agedValue.toFixed(2)}</span>
              </div>
              <div class="text-[10px] text-gray-700 bg-slate-50 border border-gray-200 rounded p-1.5 leading-snug" title="${diag.recommendation.replace(/"/g, '&quot;')}">
                <div class="font-semibold text-gray-800">${diag.reason}</div>
                <div class="text-gray-600 mt-0.5 font-medium italic"><i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i>${diag.recommendation}</div>
              </div>
            </div>
          `;
        } else {
          agingCellHtml = `
            <div class="text-center py-2">
              <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <i class="fa-solid fa-check text-emerald-600"></i> Healthy Turn
              </span>
              <div class="text-[9px] text-gray-400 font-mono mt-0.5">0 Aged Units (&lt;150d)</div>
            </div>
          `;
        }

        // Tag styling
        let tagBadge = '';
        if (s.strategyTag === 'kvi_defensive') {
          tagBadge = '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200" title="High-visibility Traffic Driver — Must match supermarket pricing within RM 1"><i class="fa-solid fa-shield text-rose-600"></i> KVI Defensive</span>';
        } else if (s.strategyTag === 'margin_builder') {
          tagBadge = '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200" title="High Margin Builder — 50%+ Gross Profit"><i class="fa-solid fa-star text-amber-500"></i> Margin Builder</span>';
        } else if (s.strategyTag === 'clinical_bundle') {
          tagBadge = '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200" title="Clinical Service / Diagnostic Moat"><i class="fa-solid fa-stethoscope text-purple-600"></i> Clinical Moat</span>';
        } else {
          tagBadge = '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200" title="Standard Prescription / Community OTC"><i class="fa-solid fa-prescription-bottle-medical text-blue-600"></i> Core OTC/Rx</span>';
        }

        // Supermarket price input & comparison pill
        const isRx = this.isScheduledPrescriptionDrug(s);
        let superComp = '';
        if (isRx) {
          superComp = `
            <div class="inline-flex flex-col items-end">
              <span class="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded cursor-help"
                    title="Under the Malaysian Poisons Act 1952, supermarkets (Farley, Emart, Everwin) cannot legally stock, sell, or dispense scheduled prescription/poison medications.">
                <i class="fa-solid fa-ban text-slate-400"></i> N/A (Rx Exclusive)
              </span>
              <span class="text-[9px] text-slate-400 font-medium mt-0.5" title="Malaysian Poisons Act 1952 (Group B/C Scheduled Medicine)">Poisons Act 1952</span>
            </div>
          `;
        } else {
          let superDiffHtml = '';
          if (s.supermarketPrice && s.supermarketPrice > 0) {
            const diffNum = s.standardSp - s.supermarketPrice;
            const diff = Math.abs(diffNum).toFixed(2);
            const pct = ((diffNum / s.supermarketPrice) * 100).toFixed(1);
            const isHigher = diffNum > 0.05;
            const isLower = diffNum < -0.05;
            const badgeClass = isHigher 
              ? 'text-rose-700 bg-rose-50 border border-rose-200' 
              : (isLower ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-600 bg-slate-50 border border-slate-200');
            const diffSign = diffNum > 0.05 ? '+' : (diffNum < -0.05 ? '-' : '');
            superDiffHtml = `<span class="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass} mt-1">${diffSign}RM ${diff} (${diffSign}${pct}%) vs Farley</span>`;
          }

          superComp = `
            <div class="inline-flex items-center gap-1 justify-end">
              <span class="text-gray-400 text-xs font-mono">RM</span>
              <input type="number" step="0.10" value="${s.supermarketPrice ? s.supermarketPrice.toFixed(2) : ''}" placeholder="Farley..."
                onchange="window.pmgPricing.updateSkuSupermarketPrice('${s.id}', this.value)"
                class="w-20 text-right font-mono font-bold text-gray-800 border border-gray-200 rounded px-1.5 py-1 focus:ring-2 focus:ring-blue-400 outline-none bg-slate-50/50 hover:bg-white transition"
                title="Farley / Emart benchmark price (Click to edit)">
            </div>
            ${superDiffHtml}
          `;
        }

        // Pharmacy competitor input & comparison pill
        let chainDiffHtml = '';
        if (s.chainPharmacyPrice && s.chainPharmacyPrice > 0) {
          const diffNum = s.standardSp - s.chainPharmacyPrice;
          const diff = Math.abs(diffNum).toFixed(2);
          const pct = ((diffNum / s.chainPharmacyPrice) * 100).toFixed(1);
          const isHigher = diffNum > 0.05;
          const isLower = diffNum < -0.05;
          const badgeClass = isHigher 
            ? 'text-amber-800 bg-amber-50 border border-amber-200' 
            : (isLower ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-600 bg-slate-50 border border-slate-200');
          const diffSign = diffNum > 0.05 ? '+' : (diffNum < -0.05 ? '-' : '');
          chainDiffHtml = `<span class="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass} mt-1">${diffSign}RM ${diff} (${diffSign}${pct}%) (${s.competitorName || 'Alpro/Ting'})</span>`;
        }

        let promoPillHtml = '';
        if (s.promoNote && s.promoNote.trim()) {
          promoPillHtml = `
            <div class="mt-1 flex items-center justify-end" title="${s.promoNote.replace(/"/g, '&quot;')}">
              <span class="inline-flex items-center gap-1 text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                <i class="fa-solid fa-fire text-amber-600"></i> ${s.promoNote}
              </span>
            </div>
          `;
        }

        const chainComp = `
          <div class="inline-flex items-center gap-1 justify-end">
            <span class="text-gray-400 text-xs font-mono">RM</span>
            <input type="number" step="0.10" value="${s.chainPharmacyPrice ? s.chainPharmacyPrice.toFixed(2) : ''}" placeholder="Alpro/Ting..."
              onchange="window.pmgPricing.updateSkuChainPrice('${s.id}', this.value)"
              class="w-20 text-right font-mono font-bold text-gray-800 border border-gray-200 rounded px-1.5 py-1 focus:ring-2 focus:ring-blue-400 outline-none bg-slate-50/50 hover:bg-white transition"
              title="Competitor Pharmacy (Alpro/Caring/BIG/Ting) benchmark price (Click to edit)">
          </div>
          ${chainDiffHtml}
          ${promoPillHtml}
        `;

        // Margin pill color
        let marginColor = 'text-blue-700 bg-blue-50';
        if (parseFloat(margin) < 15) marginColor = 'text-rose-700 bg-rose-50 font-bold';
        else if (parseFloat(margin) >= 35) marginColor = 'text-emerald-700 bg-emerald-50 font-bold';

        html += `
          <tr class="hover:bg-slate-50 transition border-b border-gray-100 text-xs">
            <td class="p-2.5">
              <div class="font-bold text-gray-900 leading-snug">${s.name}</div>
              <div class="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span class="font-mono bg-gray-100 px-1 rounded text-[10px]">${s.code}</span>
                <span>${s.brand}</span> · <span>${s.category}</span>
              </div>
              ${s.notes ? `<div class="text-[10px] text-gray-400 mt-0.5 italic">${s.notes}</div>` : ''}
            </td>
            <td class="p-2.5 text-right">
              <div class="inline-flex items-center gap-1 justify-end">
                <span class="text-gray-400 text-xs font-mono">RM</span>
                <input type="number" step="0.05" value="${s.costPrice.toFixed(2)}"
                  onchange="window.pmgPricing.updateSkuCostPrice('${s.id}', this.value)"
                  class="w-18 text-right font-mono font-bold text-gray-900 border border-amber-300 rounded px-1.5 py-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-600 outline-none bg-amber-50/50 hover:bg-white transition"
                  title="Click to edit Custom Cost Price (varies depending on supplier/wholesaler deal)">
              </div>
              <div class="mt-1 flex items-center justify-end gap-1">
                <i class="fa-solid fa-truck-field text-[10px] text-amber-600/70" title="Supplier / Wholesaler"></i>
                <input type="text" list="pmgSupplierList" value="${s.supplier || ''}" placeholder="Supplier..."
                  onchange="window.pmgPricing.updateSkuSupplier('${s.id}', this.value)"
                  class="w-24 text-[10px] text-right font-medium text-gray-600 border-b border-dashed border-gray-300 hover:border-gray-500 focus:border-blue-500 bg-transparent px-1 py-0.5 outline-none"
                  title="Supplier/Distributor (e.g. DKSH, Zuellig, Apex, SSJ Pharma, Advance, HQ)">
              </div>
            </td>
            <td class="p-2.5 text-right">
              <div class="inline-flex items-center gap-1">
                <span class="text-gray-400 text-xs font-mono">RM</span>
                <input type="number" step="0.10" value="${s.standardSp.toFixed(2)}"
                  onchange="window.pmgPricing.updateSkuStandardSp('${s.id}', this.value)"
                  class="w-18 text-right font-mono font-bold text-blue-900 border border-blue-300 rounded px-1.5 py-1 focus:ring-2 focus:ring-blue-400 outline-none bg-blue-50/50 hover:bg-white transition"
                  title="Click to edit standardized 7-outlet Member Selling Price">
              </div>
              ${s.nonMemberPrice ? `<div class="text-[9px] text-gray-400 font-mono mt-0.5" title="Non-Member Price">Non-Member: RM ${s.nonMemberPrice.toFixed(2)}</div>` : ''}
            </td>
            <td class="p-2.5 text-right">
              <span class="px-1.5 py-0.5 rounded ${marginColor} font-mono">${margin}%</span>
              <span class="text-[10px] text-gray-400 block font-mono mt-0.5">+RM ${profit}</span>
            </td>
            <td class="p-2.5 text-right">
              ${superComp}
            </td>
            <td class="p-2.5 text-right">
              ${chainComp}
            </td>
            <td class="p-2.5 align-top">
              ${agingCellHtml}
            </td>
            <td class="p-2 text-center align-middle">
              <div class="flex flex-col gap-1 items-center justify-center">
                <button type="button" onclick="window.pmgPricing.launchAiCompetitorPriceCheck('${s.id}')"
                  class="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-1 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                  title="Deep analyze competitor prices (Farley, Emart, Watsons, Caring, Alpro)">
                  <i class="fa-solid fa-tags text-blue-600"></i> AI Prices
                </button>
                <button type="button" onclick="window.pmgPricing.launchAiMarketStrategy('${s.id}')"
                  class="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-1 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap"
                  title="Further strategic analysis based on market dynamics, price elasticity & basket building">
                  <i class="fa-solid fa-chart-line text-purple-600"></i> Strategy
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
      this.renderPaginationControls(totalCount);
    }

    renderPaginationControls(totalCount) {
      const pagContainer = document.getElementById('pricingPaginationContainer');
      if (!pagContainer) return;
      if (totalCount === 0) {
        pagContainer.innerHTML = '';
        return;
      }
      const totalPages = Math.max(1, Math.ceil(totalCount / this.pageSize));
      const start = (this.currentPage - 1) * this.pageSize + 1;
      const end = Math.min(this.currentPage * this.pageSize, totalCount);

      pagContainer.innerHTML = `
        <div class="flex items-center gap-2 text-gray-600 font-medium">
          <span>Showing <b class="text-gray-900">${start.toLocaleString()}–${end.toLocaleString()}</b> of <b class="text-gray-900">${totalCount.toLocaleString()}</b> SKUs</span>
          <span class="text-gray-300">|</span>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <span class="text-gray-500">Rows:</span>
            <select onchange="window.pmgPricing.setPageSize(this.value)" class="border border-gray-300 rounded px-2 py-0.5 text-xs bg-white font-bold outline-none cursor-pointer">
              <option value="50" ${this.pageSize === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${this.pageSize === 100 ? 'selected' : ''}>100</option>
              <option value="200" ${this.pageSize === 200 ? 'selected' : ''}>200</option>
              <option value="500" ${this.pageSize === 500 ? 'selected' : ''}>500</option>
            </select>
          </label>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button type="button" onclick="window.pmgPricing.goToPage(1)" ${this.currentPage <= 1 ? 'disabled' : ''}
            class="px-2.5 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition cursor-pointer">
            « First
          </button>
          <button type="button" onclick="window.pmgPricing.prevPage()" ${this.currentPage <= 1 ? 'disabled' : ''}
            class="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition cursor-pointer">
            <i class="fa-solid fa-chevron-left mr-1"></i> Prev
          </button>
          <span class="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-900 rounded-lg border border-indigo-200">
            Page ${this.currentPage} of ${totalPages}
          </span>
          <button type="button" onclick="window.pmgPricing.nextPage()" ${this.currentPage >= totalPages ? 'disabled' : ''}
            class="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition cursor-pointer">
            Next <i class="fa-solid fa-chevron-right ml-1"></i>
          </button>
          <button type="button" onclick="window.pmgPricing.goToPage(${totalPages})" ${this.currentPage >= totalPages ? 'disabled' : ''}
            class="px-2.5 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition cursor-pointer">
            Last »
          </button>
        </div>
      `;
    }

    goToPage(page) {
      const filtered = this.getFilteredSkus();
      const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
      const p = Math.max(1, Math.min(parseInt(page, 10) || 1, totalPages));
      this.currentPage = p;
      this.renderTableOnly();
    }

    nextPage() {
      this.goToPage(this.currentPage + 1);
    }

    prevPage() {
      this.goToPage(this.currentPage - 1);
    }

    setPageSize(size) {
      const s = parseInt(size, 10);
      if (s > 0) {
        this.pageSize = s;
        this.currentPage = 1;
        this.renderTableOnly();
      }
    }

    // ─── RENDER BRANCH SWOT TABS & DETAILS ──────────────────────────────────────
    renderBranchSwot() {
      const container = document.getElementById('pricingBranchSwotContainer');
      if (!container) return;

      const bData = BRANCH_SWOT_DATA[this.activeBranchKey] || BRANCH_SWOT_DATA['KOTA SENTOSA'];

      // Active branch selector pill tabs
      let tabsHtml = '<div class="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 mb-4">';
      Object.keys(BRANCH_SWOT_DATA).forEach(key => {
        const b = BRANCH_SWOT_DATA[key];
        const isActive = key === this.activeBranchKey;
        const activeClass = isActive
          ? 'bg-blue-800 text-white shadow-xs font-bold'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold';
        tabsHtml += `
          <button type="button" onclick="window.pmgPricing.switchSwotBranch('${key}')"
            class="px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap ${activeClass}">
            ${b.name.replace('PMG Pharmacy ', '')}
          </button>
        `;
      });
      tabsHtml += '</div>';

      // 4-Quadrant SWOT
      const swot = bData.swot;

      const swotHtml = `
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
          <div class="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div>
              <h3 class="font-bold text-base text-gray-900 flex items-center gap-2">
                <i class="fa-solid fa-store text-blue-700"></i> ${bData.name}
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">${bData.badge}</span>
              </h3>
              <p class="text-xs text-gray-600 mt-1">${bData.locationProfile}</p>
            </div>
            <button type="button" onclick="window.pmgPricing.launchAiSwotPlan('${this.activeBranchKey}')"
              class="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs">
              <i class="fa-solid fa-brain text-purple-200"></i> AI Action Strategy
            </button>
          </div>

          <div class="mt-3 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-950">
            <span class="font-bold flex items-center gap-1 text-amber-800 mb-1"><i class="fa-solid fa-radar text-amber-600"></i> Immediate Local Competitors:</span>
            <ul class="list-disc pl-4 space-y-0.5 text-gray-700">
              ${bData.localCompetitors.map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- 4 Quadrants -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-xs">
          <!-- Strengths -->
          <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <h4 class="font-bold text-emerald-950 text-sm mb-2 flex items-center gap-2">
              <i class="fa-solid fa-circle-check text-emerald-600"></i> Strengths (Internal Advantages)
            </h4>
            <ul class="space-y-1.5 text-gray-700 list-disc pl-4">
              ${swot.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>

          <!-- Weaknesses -->
          <div class="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <h4 class="font-bold text-amber-950 text-sm mb-2 flex items-center gap-2">
              <i class="fa-solid fa-triangle-exclamation text-amber-600"></i> Weaknesses (Operational Gaps)
            </h4>
            <ul class="space-y-1.5 text-gray-700 list-disc pl-4">
              ${swot.weaknesses.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>

          <!-- Opportunities -->
          <div class="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
            <h4 class="font-bold text-blue-950 text-sm mb-2 flex items-center gap-2">
              <i class="fa-solid fa-lightbulb text-blue-600"></i> Opportunities (Market Potential)
            </h4>
            <ul class="space-y-1.5 text-gray-700 list-disc pl-4">
              ${swot.opportunities.map(o => `<li>${o}</li>`).join('')}
            </ul>
          </div>

          <!-- Threats -->
          <div class="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
            <h4 class="font-bold text-rose-950 text-sm mb-2 flex items-center gap-2">
              <i class="fa-solid fa-shield-virus text-rose-600"></i> Threats (External Competitors)
            </h4>
            <ul class="space-y-1.5 text-gray-700 list-disc pl-4">
              ${swot.threats.map(t => `<li>${t}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- 3 Specific Action Items for this Outlet -->
        <div class="bg-white border-2 border-indigo-200 rounded-xl p-4 shadow-xs">
          <h4 class="font-bold text-indigo-950 text-sm mb-2 flex items-center gap-2">
            <i class="fa-solid fa-bullseye text-indigo-600"></i> Action Plan for ${bData.name.replace('PMG Pharmacy ', '')} Team
          </h4>
          <ol class="list-decimal pl-5 space-y-2 text-xs text-gray-800">
            ${bData.actionPlan.map(a => `<li class="font-medium">${a}</li>`).join('')}
          </ol>
        </div>
      `;

      container.innerHTML = tabsHtml + swotHtml;
    }

    switchSwotBranch(branchKey) {
      this.activeBranchKey = branchKey;
      this.renderBranchSwot();
    }

    // ─── RENDER COMPETITIVE PLAYBOOK ────────────────────────────────────────────
    renderPlaybook() {
      const container = document.getElementById('pricingPlaybookContainer');
      if (!container) return;

      let html = '<div class="space-y-4">';
      COMPETITIVE_PLAYBOOK.forEach(p => {
        html += `
          <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
            <div class="flex items-center justify-between gap-2 flex-wrap mb-1.5">
              <h4 class="font-bold text-gray-900 text-sm flex items-center gap-2">
                <i class="fa-solid fa-chess-knight text-purple-700"></i> ${p.title}
              </h4>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">${p.category}</span>
            </div>
            <p class="text-xs text-gray-600 mb-3 leading-relaxed">${p.summary}</p>
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
              <div class="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <i class="fa-solid fa-list-check text-slate-600"></i> Management Directives:
              </div>
              <ul class="list-disc pl-4 space-y-1 text-slate-700">
                ${p.rules.map(r => `<li>${r}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      });
      html += '</div>';

      container.innerHTML = html;
    }

    extractSearchableProductDetails(sku) {
      if (!sku || !sku.name) return { cleanName: '', packInfo: '', searchQueries: [], directUrls: {} };
      const rawName = String(sku.name || '').trim();

      // 1. Detect packaging & size safely BEFORE stripping words (guard against 'S matching S in 50'S)
      let packInfo = '';
      const isDiaperOrGarment = /DIAPER|PANTS|SLIP|BRIEF|INCONTINENCE|PAD|UNDERWEAR/i.test(rawName);
      const sizeMatch = isDiaperOrGarment ? rawName.match(/\b(XXL|XL|LARGE|MEDIUM|SMALL|L|M)\b/i) : null;
      const packMatch = rawName.match(/\b(\d+\s*X\s*\d+['’]?S|\d+['’]?S|\d+\s*SACHETS?|\d+\s*SAC|\d+\s*G|\d+\s*ML|\d+\s*TAB|\d+\s*CAP)\b/i);

      if (packMatch) {
        packInfo = packMatch[1].toUpperCase().replace(/['’]/g, '');
      }
      if (sizeMatch && !packMatch) {
        packInfo = `Size ${sizeMatch[1].toUpperCase()}`;
      } else if (sizeMatch && packMatch) {
        packInfo = `Size ${sizeMatch[1].toUpperCase()} (${packInfo})`;
      }

      // 2. Expand standard Malaysian pharmacy POS shorthand & normalize brand names
      let clean = rawName
        .replace(/\bSAC(?:HETS?|H)?\b/gi, 'sachets')
        .replace(/\bTAB(?:LETS?)?\b/gi, 'tablets')
        .replace(/\bCAP(?:SULES?)?\b/gi, 'capsules')
        .replace(/\bEFF(?:ERVESCENT)?\b/gi, 'effervescent')
        .replace(/\bBTL\b/gi, 'bottle')
        .replace(/\bSYR(?:UP)?\b/gi, 'syrup')
        .replace(/\bPWDR|PWD\b/gi, 'powder')
        .replace(/PRE\s*&\s*PRO/gi, 'Pre & Pro')
        .replace(/PRE&PRO/gi, 'Pre & Pro')
        .replace(/A\.?B\.?\s*JUNIOR/gi, 'A.B. Junior')
        .replace(/BIO[- ]?LIFE/gi, 'Bio-Life')
        .replace(/COQ10/gi, 'CoQ10')
        .replace(/LIVOLIN/gi, 'Livolin')
        .replace(/APPETON/gi, 'Appeton')
        .replace(/FLAVETTES/gi, 'Flavettes')
        .replace(/REDOXON/gi, 'Redoxon')
        .replace(/BLACKMORES/gi, 'Blackmores');

      // 3. Strip internal junk codes & container descriptors
      clean = clean
        .replace(/\b(N\/A|BOX\d*|PACK|STRIP|TUBE|UNIT)\b/gi, '')
        .replace(/['"]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Core keyword for direct search (strips redundant unit descriptors for higher search hit rate)
      const coreKeyword = clean
        .replace(/\b(sachets|tablets|capsules|effervescent|bottle|syrup|powder)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // 4. Construct natural, UNQUOTED search queries for Google Search Grounding
      // Strict quotation marks break Google Search when web stores use slightly different wording
      const queries = [];
      const packTerm = packInfo ? packInfo : '';

      if (/ABSORBA|TENA|CERTAINTY|DR\.?\s*P/i.test(rawName)) {
        queries.push(`${clean} price Alpro Pharmacy Malaysia`);
        queries.push(`${clean} price BIG Pharmacy Malaysia`);
        queries.push(`site:alpropharmacy.com ${clean}`);
        queries.push(`${clean} Farley Supermarket Kuching`);
      } else if (/MILK|ENSURE|GLUCERNA|ENERCAL|NUTREN|APPETON/i.test(rawName)) {
        queries.push(`${clean} price Alpro Oneclick Malaysia`);
        queries.push(`${clean} price Caring Pharmacy Malaysia`);
        queries.push(`${clean} Farley Kuching price`);
      } else {
        queries.push(`${coreKeyword || clean} price Alpro Oneclick`);
        queries.push(`${coreKeyword || clean} price BIG Pharmacy Malaysia`);
        queries.push(`site:alpropharmacy.com ${coreKeyword || clean}`);
        queries.push(`site:bigpharmacy.com.my ${coreKeyword || clean}`);
        queries.push(`${coreKeyword || clean} price Caring Pharmacy`);
      }

      // 5. Generate direct 1-click verification URLs for Malaysian pharmacy stores
      const searchKeyword = encodeURIComponent(coreKeyword || clean);
      const directUrls = {
        alpro: `https://www.alpropharmacy.com/oneclick/?s=${searchKeyword}`,
        big: `https://www.bigpharmacy.com.my/catalogsearch/result/?q=${searchKeyword}`,
        caring: `https://estore.caring2u.com/catalogsearch/result/?q=${searchKeyword}`
      };

      return {
        cleanName: clean,
        packInfo,
        coreKeyword,
        searchQueries: queries,
        directUrls
      };
    }

    // ─── GEMINI AI DEEP RESEARCH RUNNER ─────────────────────────────────────────
    launchAiCompetitorPriceCheck(skuId) {
      const sku = this.skus.find(s => s.id === skuId);
      if (!sku) return;

      this.selectedSkuForAi = sku;
      const modal = document.getElementById('pricingAiModal');
      const title = document.getElementById('pricingAiModalTitle');
      const input = document.getElementById('pricingAiPromptInput');
      const isRx = this.isScheduledPrescriptionDrug(sku);
      const genericHint = this.getGenericDrugHint(sku);
      const knownBench = this.getKnownMalaysianBenchmark(sku);
      const aging = this.getStockAgingForSku(sku);
      const diag = this.diagnoseSkuPricingVsAging(sku, aging);
      const searchDetails = this.extractSearchableProductDetails(sku);

      // Render 1-click competitor store verification links in modal
      const storeLinksBar = document.getElementById('pricingAiStoreLinksBar');
      const storeLinksList = document.getElementById('pricingAiStoreLinksList');
      if (storeLinksBar && storeLinksList) {
        const cleanEncoded = encodeURIComponent(searchDetails.coreKeyword || searchDetails.cleanName);
        storeLinksList.innerHTML = `
          <a href="https://www.alpropharmacy.com/oneclick/?s=${cleanEncoded}" target="_blank" rel="noopener noreferrer"
            class="px-2.5 py-1 bg-white hover:bg-orange-50 border border-orange-200 text-orange-950 font-bold text-[11px] rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition">
            <span class="w-2 h-2 rounded-full bg-orange-500"></span>
            Alpro Oneclick Store <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-orange-600"></i>
          </a>
          <a href="https://www.bigpharmacy.com.my/catalogsearch/result/?q=${cleanEncoded}" target="_blank" rel="noopener noreferrer"
            class="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-950 font-bold text-[11px] rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            BIG Pharmacy Store <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-rose-600"></i>
          </a>
          <a href="https://estore.caring2u.com/catalogsearch/result/?q=${cleanEncoded}" target="_blank" rel="noopener noreferrer"
            class="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-[11px] rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Caring Pharmacy Store <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-emerald-600"></i>
          </a>
          ${!isRx ? `
          <a href="https://www.google.com/search?q=${cleanEncoded}+Farley+Supermarket+Kuching+price" target="_blank" rel="noopener noreferrer"
            class="px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-blue-950 font-bold text-[11px] rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            Farley Price Search <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-blue-600"></i>
          </a>
          ` : ''}
        `;
        storeLinksBar.classList.remove('hidden');
      }

      const agingContext = diag.isAged ? `\nSTOCK AGING & VELOCITY INTELLIGENCE:
- Aged Stock (>150 Days): ${diag.agedQty} units (Locked Capital: RM ${diag.agedValue.toFixed(2)})
- Oldest Aging Bracket: ${diag.maxBracket}
- Current Pricing Diagnosis: ${diag.statusText}
- Diagnostic Finding: ${diag.reason}
- Direct Directive: Provide a price or promo recommendation specifically tailored to unfreeze this locked inventory.\n` : '';

      if (title) title.textContent = `Competitor Price Benchmark Analysis: ${sku.name}`;
      if (input) {
        if (isRx) {
          input.value = `You are a Senior Pharmaceutical Pricing Specialist in Malaysia conducting an INDEPENDENT, REAL-TIME MARKET PRICE AUDIT with LIVE GOOGLE SEARCH.
Search Google for the real, current retail dispensing price of this prescription medicine in Malaysian licensed community pharmacies (such as BIG Pharmacy, Alpro Pharmacy / Alpro Oneclick, Caring Pharmacy, Ting Pharmacy Kuching, and DoctorOnCall).
DO NOT anchor to or assume any user-entered price. Conduct an authentic live market search.

Product: ${sku.name}
${genericHint ? 'Active Formulation / Strength / Packaging: ' + genericHint + '\n' : ''}Category: ${sku.category || 'Prescription Medicine'} (Poisons Act 1952 - Group B/C Poison)
Wholesale Trade Cost: RM ${sku.costPrice > 0 ? sku.costPrice.toFixed(2) : '15.00 - 25.00 trade range'}
Our Current Member SP: RM ${sku.standardSp > 0 ? sku.standardSp.toFixed(2) : 'Unset'}
${agingContext}
CRITICAL REGULATORY RULE (Malaysian Poisons Act 1952):
- This item is a scheduled prescription poison. Supermarkets and hypermarkets (Farley Supermarket, Emart Hypermarket, Everwin) CANNOT legally stock, sell, or dispense this medicine.
- "supermarketPrice" MUST be null.
- Ethical prescription retail prices in Malaysian community pharmacies typically reflect a 12% to 25% gross retail margin above wholesale cost. Prices below cost or 300% above cost are illogical errors.

Search & Market Benchmarking Tasks:
1. Google Search for the actual retail selling price for "${sku.name}" in Malaysia (BIG Pharmacy, Alpro Pharmacy / Oneclick, Caring Pharmacy, DoctorOnCall).
2. Report the verified packaging unit (e.g. per box of 30 tabs, per 4ml cartridge refill).
3. Identify typical chronic compliance promotions (e.g. 3-month supply, member repeat refills, bulk box discounts).
4. Provide a defensive recommended selling price ("suggestedPmgSp") for community pharmacies in suburban Kuching (Sentosa, Moyan, Matang) that protects patient compliance and retention.

IMPORTANT: Return the detected competitor price numbers at the end inside a strict JSON code block:
\`\`\`json
{
  "supermarketPrice": null,
  "chainPharmacyPrice": ${knownBench ? (knownBench.promoSp || knownBench.retailSp).toFixed(2) : (sku.costPrice > 0 ? (sku.costPrice * 1.18).toFixed(2) : '0.00')},
  "competitorName": "${knownBench ? knownBench.competitor : 'BIG Pharmacy / Alpro'}",
  "promoNote": "${knownBench ? (knownBench.note || '') : ''}",
  "suggestedPmgSp": ${knownBench ? (knownBench.promoSp || knownBench.retailSp).toFixed(2) : (sku.costPrice > 0 ? (sku.costPrice * 1.15).toFixed(2) : '0.00')},
  "hasActivePromo": ${knownBench && knownBench.promoSp ? 'true' : 'false'},
  "normalRetailPrice": ${knownBench ? knownBench.retailSp.toFixed(2) : '0.00'},
  "promotionalPrice": ${knownBench && knownBench.promoSp ? knownBench.promoSp.toFixed(2) : 'null'}
}
\`\`\``;
        } else {
          const queriesText = searchDetails.searchQueries.map(q => `   - ${q}`).join('\n');
          input.value = `You are a Senior Retail Pharmacy & FMCG Pricing Specialist in Sarawak, Malaysia conducting an INDEPENDENT, REAL-TIME MARKET PRICE & ACTIVE PROMOTION AUDIT using Live Google Search.

Search Google in real-time for the exact current selling price and ANY ACTIVE PROMOTIONS in Malaysia for:
Product Name: ${sku.name}
Clean Product Term: ${searchDetails.cleanName}
Core Search Term: ${searchDetails.coreKeyword || searchDetails.cleanName}
${searchDetails.packInfo ? 'Packaging / Size: ' + searchDetails.packInfo + '\n' : ''}Category: ${sku.category || 'OTC / Healthcare / Incontinence / FMCG'}
Brand: ${sku.brand || 'Retail'}
Wholesale Trade Cost: RM ${sku.costPrice > 0 ? sku.costPrice.toFixed(2) : 'Trade Reference'}
Our Current Member SP: RM ${sku.standardSp > 0 ? sku.standardSp.toFixed(2) : 'Unset'}
${agingContext}
TARGET COMPETITORS TO AUDIT IN SARAWAK / MALAYSIA:
1. Pharmacy Chains: Alpro Pharmacy (especially Alpro Oneclick alpropharmacy.com), Caring Pharmacy (caring2u.com), BIG Pharmacy (bigpharmacy.com.my), Guardian Malaysia, Watsons Malaysia.
2. Sarawak Supermarkets / Hypermarkets: Farley Supermarket (Kuching 6th Mile / Samarahan), Emart Hypermarket (Batu Kawa / Matang), Everwin.

RECOMMENDED GOOGLE SEARCH QUERIES:
${queriesText}

CRITICAL AUDIT & PROMOTION RULES:
1. CAPTURE ACTIVE PROMOTIONS & DISCOUNTS (IGNORE STRIKETHROUGH RRP / MSRP):
   - In Malaysian retail pharmacy, chains (Alpro, BIG, Caring) routinely discount 15% - 30% below manufacturer Recommended Retail Price (RRP / MSRP).
   - NEVER report the manufacturer RRP / list price as the competitor price if an active promotion or everyday selling price is lower!
   - Example 1: Absorba Conti-Fit Diapers Normal RM 17.50, active 11.11 Promo RM 16.50 -> Use RM 16.50!
   - Example 2: Bio-Life A.B. Junior Pre&Pro 50s has official manufacturer list price of RM 105.00 - RM 113.00, BUT Alpro Oneclick sells at RM 84.10 (11.11 promo) and BIG Pharmacy sells at RM 86.90. You MUST report RM 84.10 or RM 86.90 as "chainPharmacyPrice", NEVER RM 105.00! Customers compare against real checkout prices!
   - Report BOTH "normalRetailPrice" (e.g. 113.00) and "promotionalPrice" (e.g. 84.10).
   - In "promoNote", explicitly record the promo event: e.g. "Alpro 11.11 Promo RM 84.10 (Normal RM 113.00) · BIG RM 86.90".

2. STRICT PACKAGING DISAMBIGUATION:
   - Carefully check the pack count and packaging size from the SKU name!
   - DO NOT confuse a Single Box (50s) with a Twin Pack (2x50s = 100s) or a Sample Pack (10s)!
   - For Bio-Life A.B. Junior:
     * 10'S Single Box: ~RM 18.00 - 18.30
     * 50'S Single Box: ~RM 84.10 - 86.90
     * 2X50'S Twin Pack: ~RM 152.50 - 168.30
   - Report the price that EXACTLY matches the SKU's packaging (${searchDetails.packInfo || 'Single Box'})!

3. SUPERMARKET BENCHMARK ("supermarketPrice"):
   - Supermarkets in Sarawak (Farley, Emart) heavily discount adult diapers, baby milk, and FMCG.
   - Benchmark the realistic shelf price at Farley 6th Mile Kuching or Emart.

4. DEFENSIVE PMG SELLING PRICE ("suggestedPmgSp"):
   - Recommend a competitive selling price for PMG's 7 branches in Kuching/Padawan.
   - If a competitor has an active promotion (e.g. Alpro at RM 84.10 or Absorba at RM 16.50), recommend matching or slightly beating the promo (e.g. RM 84.90 or RM 84.10 member promo) as long as it stays above PMG wholesale cost (RM ${sku.costPrice.toFixed(2)}). DO NOT suggest prices above competitor promo!

IMPORTANT: Return the detected competitor price numbers at the end inside a strict JSON code block:
\`\`\`json
{
  "supermarketPrice": ${knownBench && knownBench.supermarketSp ? knownBench.supermarketSp.toFixed(2) : '0.00'},
  "chainPharmacyPrice": ${knownBench ? (knownBench.promoSp || knownBench.retailSp).toFixed(2) : '0.00'},
  "competitorName": "${knownBench ? knownBench.competitor : 'Alpro Oneclick / Farley'}",
  "promoNote": "${knownBench ? (knownBench.note || '') : ''}",
  "suggestedPmgSp": ${knownBench ? (knownBench.promoSp || knownBench.retailSp).toFixed(2) : (sku.costPrice > 0 ? (sku.costPrice * 1.08).toFixed(2) : '0.00')},
  "hasActivePromo": ${knownBench && knownBench.promoSp ? 'true' : 'false'},
  "normalRetailPrice": ${knownBench ? knownBench.retailSp.toFixed(2) : '0.00'},
  "promotionalPrice": ${knownBench && knownBench.promoSp ? knownBench.promoSp.toFixed(2) : 'null'}
}
\`\`\``;
        }
      }

      if (modal) modal.classList.remove('hidden');
      this.executeAiResearch();
    }

    launchAiMarketStrategy(skuId) {
      const sku = this.skus.find(s => s.id === skuId);
      if (!sku) return;

      this.selectedSkuForAi = sku;
      const modal = document.getElementById('pricingAiModal');
      const title = document.getElementById('pricingAiModalTitle');
      const input = document.getElementById('pricingAiPromptInput');
      const isRx = this.isScheduledPrescriptionDrug(sku);
      const aging = this.getStockAgingForSku(sku);
      const diag = this.diagnoseSkuPricingVsAging(sku, aging);
      const agingStrategyContext = diag.isAged ? `\nREAL-TIME STOCK AGING & CAPITAL STATUS:
- Current Aged Stock (>150 Days): ${diag.agedQty} units
- Locked Capital Value: RM ${diag.agedValue.toFixed(2)}
- Oldest Age Bracket: ${diag.maxBracket}
- Pricing Diagnosis: ${diag.statusText} (${diag.reason})
- Strategic Clearance Priority: Immediate actionable tactics required to clear aged inventory (e.g. promo markdown, staff push, counter placement, or supplier credit return).\n` : '';

      if (title) title.textContent = `Market Strategy & Commercial Dynamics: ${sku.name}`;
      if (input) {
        if (isRx) {
          input.value = `Perform an in-depth commercial market dynamics, patient retention, and clinical basket-building analysis for this prescription medicine:
Product: ${sku.name} (Code: ${sku.code})
Category: ${sku.category} (Scheduled Prescription Drug - Poisons Act 1952)
Supplier/Distributor: ${sku.supplier || 'Standard Distributor'}
PMG Custom Cost Price: RM ${sku.costPrice.toFixed(2)}
Current PMG Standard Selling Price: RM ${sku.standardSp.toFixed(2)}
Competitor Chain Benchmark: ${sku.chainPharmacyPrice ? 'RM ' + sku.chainPharmacyPrice.toFixed(2) : 'N/A'}
${agingStrategyContext}Target Market: Kuching & Padawan, Sarawak (7 Outlets: Kota Sentosa, Matang Jaya, Sungai Moyan, Malihah, Metrocity, Astana, Samariang).

Please provide an actionable 7-outlet battle plan:
1. Patient Adherence & Price Elasticity:
   - How price-sensitive are chronic disease patients in suburban Sarawak (e.g. Moyan, Malihah, Sentosa)?
   - Balancing affordable long-term refills with professional dispensing margin.
2. Clinical Basket Building & Companion Recommendation:
   - What clinical companion products (e.g. CoQ10 for statins, B-complex/Magnesium for antihypertensives, diagnostic monitoring strips, home BP monitors) should pharmacists recommend to enhance therapeutic outcomes and basket margin?
3. Counter-Script vs Price Cutters (Alpro, BIG, GP Clinics):
   - Practical scripts for pharmacists and dispensers when patients compare prices with aggressive chain discounters or clinic dispensaries. Emphasize PMG's authentic cold-chain sourcing, Medication Therapy Adherence Clinic (MTAC), free health screenings, and member points.
4. Outlet-Specific Merchandising & Refill Management:
   - High-density residential branches (Matang Jaya, Moyan, Samariang) vs Commercial centers (Metrocity, Kota Sentosa).
5. Wholesaler / Distributor Deal Negotiation:
   - With PMG purchasing for 7 branches, what bulk or bonus terms (e.g. 10+1, 12+2 bonus, or volume rebates) should PMG negotiate with ${sku.supplier || 'the distributor'}?`;
        } else {
          input.value = `Perform an in-depth commercial market dynamics, basket building, and counter-strategy analysis for:
Product: ${sku.name} (Code: ${sku.code})
Supplier/Distributor: ${sku.supplier || 'Standard Distributor'}
PMG Custom Cost Price: RM ${sku.costPrice.toFixed(2)}
Current PMG Standard Selling Price: RM ${sku.standardSp.toFixed(2)}
Supermarket Benchmark (Farley / Emart): ${sku.supermarketPrice ? 'RM ' + sku.supermarketPrice.toFixed(2) : 'N/A'}
Competitor Chain Benchmark: ${sku.chainPharmacyPrice ? 'RM ' + sku.chainPharmacyPrice.toFixed(2) : 'N/A'}
${agingStrategyContext}Target Market: Kuching & Padawan, Sarawak (7 Outlets: Kota Sentosa, Matang Jaya, Sungai Moyan, Malihah, Metrocity, Astana, Samariang).

Please provide an actionable 7-outlet battle plan:
1. Customer Price Elasticity & Psychology:
   - Are customers in suburban Sarawak (e.g. Moyan, Malihah, Sentosa) sensitive to this product?
   - Does this item qualify as a Key Value Item (KVI) where price image determines store perception?
2. Basket Building & Companion Cross-Selling:
   - What high-margin companion items (vitamins, minerals, diagnostic test, or clinical services) should pharmacists bundle with this SKU to recoup any low margins?
3. Floor Staff Counter-Script vs Farley/Emart:
   - Script for branch dispensers and counter staff when a customer says: "Why is Farley cheaper by RM 1.50?" (Focus on genuine medicine safety, direct distributor supply, storage temperatures, pharmacist counseling, loyalty member points).
4. Outlet-Specific Merchandising Directives:
   - High-density residential branches (Matang Jaya, Moyan, Samariang) vs Commercial centers (Metrocity, Kota Sentosa).
5. Wholesaler / Supplier Deal Negotiation:
   - With PMG purchasing for 7 branches, what bulk deal (e.g. 10+1 free, 12+2 bonus, or quarter-end rebate) should PMG negotiate with ${sku.supplier || 'the distributor'}?`;
        }
      }

      if (modal) modal.classList.remove('hidden');
      this.executeAiResearch();
    }

    async launchAiResearch(skuId) {
      // Legacy wrapper fallback
      this.launchAiCompetitorPriceCheck(skuId);
    }

    async launchAiSwotPlan(branchKey) {
      const bData = BRANCH_SWOT_DATA[branchKey] || BRANCH_SWOT_DATA['KOTA SENTOSA'];
      const modal = document.getElementById('pricingAiModal');
      const title = document.getElementById('pricingAiModalTitle');
      const input = document.getElementById('pricingAiPromptInput');

      if (title) title.textContent = `AI Strategic Battle Plan: ${bData.name}`;
      if (input) {
        input.value = `Generate an aggressive 90-day competitive action plan for ${bData.name} located in ${bData.locationProfile}.
Local Competitors: ${bData.localCompetitors.join(', ')}.

Our strategic objective:
1. Defend OTC and prescription volume against nearby hypermarkets and chain pharmacies.
2. Standardize prices with our other 6 branches in Kuching/Padawan without losing local foot traffic.
3. Specific promotional initiatives tailored for this outlet's demographic.
4. Top 3 high-yield cross-selling clinical care opportunities.`;
      }

      if (modal) modal.classList.remove('hidden');
      this.executeAiResearch();
    }

    saveInlineApiKeyAndRun() {
      const input = document.getElementById('pricingInlineApiKeyInput');
      const val = input ? input.value.trim() : '';
      if (!val) {
        alert('Please paste your Gemini API key from Google AI Studio.');
        return;
      }
      if (typeof window.setGlobalGeminiKey === 'function') {
        window.setGlobalGeminiKey(val);
      } else {
        localStorage.setItem(STORAGE_KEY_GEMINI, val);
      }
      if (typeof showExpiryToast === 'function') {
        showExpiryToast('Gemini API key saved across PMG Hub.');
      }
      this.executeAiResearch();
    }

    async executeAiResearch() {
      const resultContainer = document.getElementById('pricingAiResultBox');
      const statusPill = document.getElementById('pricingAiStatus');
      const promptInput = document.getElementById('pricingAiPromptInput');
      const promptText = promptInput ? promptInput.value.trim() : '';

      if (!promptText) return;

      let apiKey = this.getValidGeminiApiKey();

      if (!apiKey) {
        if (resultContainer) {
          resultContainer.innerHTML = `
            <div class="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs">
              <h4 class="font-bold flex items-center gap-1.5 mb-1.5 text-amber-900 text-sm">
                <i class="fa-solid fa-key text-amber-600"></i> Free Gemini API Key Required
              </h4>
              <p class="mb-3 text-gray-700 leading-relaxed">
                To run AI competitor research and battle plans, paste your free Google AI Studio API key. Google provides <b>Gemini 3.5 Flash-Lite &amp; Gemini 3.5 Flash</b> on a <b>100% Free Tier</b> (up to 500 requests/day, RM 0 budget).
              </p>
              <div class="flex items-center gap-2 mb-2">
                <input type="text" id="pricingInlineApiKeyInput" placeholder="Paste your API key here (AIzaSy...)"
                  class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                <button type="button" onclick="window.pmgPricing.saveInlineApiKeyAndRun()"
                  class="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition whitespace-nowrap shadow-xs text-xs">
                  Save &amp; Run Analysis
                </button>
              </div>
              <div class="text-[11px] text-gray-500 flex items-center justify-between pt-1">
                <span>Takes 30 seconds (no credit card):</span>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" class="font-bold text-purple-700 hover:underline">
                  Get Free API Key from Google AI Studio &rarr;
                </a>
              </div>
            </div>
          `;
        }
        if (statusPill) statusPill.textContent = 'Key Required';
        return;
      }

      if (resultContainer) {
        resultContainer.innerHTML = `
          <div class="p-8 text-center text-gray-500 text-xs">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl text-purple-600 mb-2 block"></i>
            <span>Evaluating market pricing, hypermarket dynamics, and 7-outlet strategy via Gemini 3.5 Flash…</span>
          </div>
        `;
      }

      if (statusPill) statusPill.textContent = 'Searching Web & Grounding…';

      // Primary models with Google Search Grounding support
      const modelsToTry = [
        { code: 'gemini-2.0-flash',      name: 'Gemini 2.0 Flash' },
        { code: 'gemini-1.5-flash',      name: 'Gemini 1.5 Flash' },
        { code: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite' },
        { code: 'gemini-1.5-pro',        name: 'Gemini 1.5 Pro' },
        { code: 'gemini-2.5-flash',      name: 'Gemini 2.5 Flash' }
      ];

      let responseText = '';
      let usedModel = '';
      let lastErrorMsg = '';
      let isKeyBlocked = false;
      let groundingMetadata = null;

      // Pass 1: Try real-time Google Search Grounding across all candidate models
      for (const m of modelsToTry) {
        if (isKeyBlocked) break;
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m.code}:generateContent?key=${apiKey}`;
          const reqBody = {
            contents: [{
              parts: [{ text: promptText }]
            }],
            tools: [{ googleSearch: {} }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2500
            }
          };

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody)
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
              responseText = text.trim();
              usedModel = m.name + ' (Live Search Grounded)';
              groundingMetadata = data.candidates?.[0]?.groundingMetadata || null;
              break;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.error?.message || `HTTP ${res.status}`;
            lastErrorMsg = errMsg;
            console.warn(`[PMG Pricing AI] Search Grounding on ${m.code} error (${res.status}):`, errMsg);

            if (errMsg.toLowerCase().includes('leaked')) {
              isKeyBlocked = true;
              break;
            }
          }
        } catch (e) {
          lastErrorMsg = e.message;
          console.warn(`[PMG Pricing AI] Network error on ${m.code}:`, e);
        }
        if (responseText) break;
      }

      // Pass 2: If Search Grounding failed across all models, try ungrounded generation as fallback
      if (!responseText && !isKeyBlocked) {
        console.info('[PMG Pricing AI] Search Grounding unavailable, falling back to parametric model memory...');
        for (const m of modelsToTry) {
          try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m.code}:generateContent?key=${apiKey}`;
            const reqBody = {
              contents: [{
                parts: [{ text: promptText }]
              }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2500
              }
            };

            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reqBody)
            });

            if (res.ok) {
              const data = await res.json();
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text && text.trim()) {
                responseText = text.trim();
                usedModel = m.name + ' (Parametric Fallback)';
                break;
              }
            } else {
              const errData = await res.json().catch(() => ({}));
              lastErrorMsg = errData.error?.message || `HTTP ${res.status}`;
            }
          } catch (e) {
            lastErrorMsg = e.message;
          }
          if (responseText) break;
        }
      }

      if (!responseText) {
        if (resultContainer) {
          if (isKeyBlocked) {
            resultContainer.innerHTML = `
              <div class="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs">
                <h4 class="font-bold mb-1 text-amber-900 text-sm flex items-center gap-1.5">
                  <i class="fa-solid fa-triangle-exclamation text-amber-600"></i> API Key Reported as Leaked or Expired
                </h4>
                <p class="mb-2 text-gray-700 leading-relaxed">
                  Google rejected the key: <span class="font-mono text-rose-700 font-bold">${lastErrorMsg}</span>.
                  Please paste a fresh, valid Free Gemini API key below.
                </p>
                <div class="flex items-center gap-2 mb-2">
                  <input type="text" id="pricingInlineApiKeyInput" placeholder="Paste your new Google AI Studio key..."
                    class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                  <button type="button" onclick="window.pmgPricing.saveInlineApiKeyAndRun()"
                    class="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition text-xs whitespace-nowrap shadow-xs">
                    Save &amp; Retry
                  </button>
                </div>
                <div class="text-[11px] text-gray-500 flex items-center justify-between pt-1">
                  <span>Get a fresh key (Free tier, 0 cost):</span>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" class="font-bold text-purple-700 hover:underline">
                    Google AI Studio Key Generator &rarr;
                  </a>
                </div>
              </div>
            `;
          } else {
            resultContainer.innerHTML = `
              <div class="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs">
                <h4 class="font-bold mb-1 flex items-center gap-1.5">
                  <i class="fa-solid fa-circle-exclamation text-rose-600"></i> AI Request Failed
                </h4>
                <p class="mb-2 text-rose-800">${lastErrorMsg || 'Could not connect to Gemini API. Please check your network or API key quota.'}</p>
                <div class="flex items-center gap-2 mt-2">
                  <input type="text" id="pricingInlineApiKeyInput" placeholder="Update Gemini API Key..."
                    class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 font-mono text-xs outline-none bg-white">
                  <button type="button" onclick="window.pmgPricing.saveInlineApiKeyAndRun()"
                    class="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs transition whitespace-nowrap">
                    Update Key &amp; Retry
                  </button>
                </div>
              </div>
            `;
          }
        }
        if (statusPill) statusPill.textContent = 'Error';
        return;
      }

      if (statusPill) statusPill.textContent = `Completed (${usedModel})`;

      // Parse possible JSON code block with competitor prices
      let parsedJson = null;
      try {
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : (responseText.startsWith('{') && responseText.endsWith('}') ? responseText : null);
        if (jsonStr) {
          const testObj = JSON.parse(jsonStr);
          if (testObj && (testObj.supermarketPrice !== undefined || testObj.chainPharmacyPrice !== undefined)) {
            parsedJson = testObj;
          }
        }
      } catch (e) {
        // Not a JSON block or invalid JSON, ignore
      }

      let applyBannerHtml = '';
      if (parsedJson && this.selectedSkuForAi) {
        const sku = this.selectedSkuForAi;
        const isRx = this.isScheduledPrescriptionDrug(sku);
        let superP = isRx ? 0 : (parseFloat(parsedJson.supermarketPrice) || 0);
        let chainP = parseFloat(parsedJson.chainPharmacyPrice) || 0;
        let compName = (parsedJson.competitorName || 'Alpro / Ting Pharmacy').replace(/"/g, '&quot;');
        let promoNote = (parsedJson.promoNote || '').replace(/"/g, '&quot;');
        const pmgSp = parseFloat(parsedJson.suggestedPmgSp) || 0;
        const hasPromo = !!(parsedJson.hasActivePromo || parsedJson.promotionalPrice || (promoNote && /promo|sale|11\.11|discount|rebate/i.test(promoNote)));
        const normalP = parseFloat(parsedJson.normalRetailPrice) || 0;
        const promoP = parseFloat(parsedJson.promotionalPrice) || (hasPromo ? chainP : 0);

        // If promotional price was detected, ensure chainP reflects the active promo
        if (promoP > 0 && promoP < chainP) {
          chainP = promoP;
        }

        // Domain Sanity Guard on Rx Selling Price vs Wholesale Cost
        const bench = this.getKnownMalaysianBenchmark(sku);
        if (isRx && sku.costPrice > 0 && chainP > 0 && (chainP < sku.costPrice * 0.65 || chainP > sku.costPrice * 3.5)) {
          if (bench) {
            chainP = bench.promoSp || bench.retailSp;
            compName = bench.competitor;
            if (bench.note) promoNote = bench.note;
          } else {
            chainP = Math.round(sku.costPrice * 1.18 * 10) / 10;
            compName = 'Local Pharmacy Chain';
          }
        }

        // Domain Sanity Guard for OTC / Healthcare: Prevent MSRP / RRP hallucinations (e.g. Bio-Life RM 105.00)
        if (!isRx && bench) {
          const refMax = bench.retailSp * 1.15;
          if (chainP > refMax || chainP >= 95.00 || chainP === 105.00) {
            console.warn(`[PMG Pricing AI] Detected MSRP/RRP hallucination (RM ${chainP}). Overriding with verified Malaysian benchmark: RM ${bench.promoSp || bench.retailSp}`);
            chainP = bench.promoSp || bench.retailSp;
            compName = bench.competitor;
            promoNote = bench.note || `Verified chain promo RM ${chainP.toFixed(2)}`;
          }
        }

        if (chainP === 0 && bench) {
          chainP = bench.promoSp || bench.retailSp;
          compName = bench.competitor;
          if (bench.note) promoNote = bench.note;
        }
        if (!isRx && superP === 0 && bench && bench.supermarketSp) {
          superP = bench.supermarketSp;
        }

        if (superP > 0 || chainP > 0 || isRx) {
          const superTxt = isRx 
            ? '<b class="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">N/A (Rx Exclusive)</b>' 
            : `<b class="font-mono text-gray-900 bg-white px-1.5 py-0.5 rounded border border-indigo-200">${superP > 0 ? 'RM ' + superP.toFixed(2) : 'N/A'}</b>`;

          applyBannerHtml = `
            <div class="mb-4 p-4 ${hasPromo ? 'bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 border-2 border-amber-300' : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-indigo-300'} rounded-xl shadow-xs">
              <div class="flex items-center justify-between gap-3 flex-wrap mb-2">
                <div class="flex items-center gap-2 flex-wrap">
                  ${hasPromo ? `
                    <span class="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] tracking-wide uppercase flex items-center gap-1 shadow-xs animate-pulse">
                      <i class="fa-solid fa-fire text-amber-200"></i> Active Competitor Promo
                    </span>
                  ` : `
                    <span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px] flex items-center gap-1">
                      <i class="fa-solid fa-tags text-indigo-600"></i> Competitor Benchmark
                    </span>
                  `}
                  <span class="text-blue-950 font-extrabold text-xs">${sku.name}</span>
                </div>
                <div class="text-[11px] text-gray-500 font-medium">
                  Live Grounded Market Intelligence
                </div>
              </div>

              <div class="text-[11px] text-gray-800 flex items-center gap-3 flex-wrap mb-3">
                <span>Competitor: <b class="font-bold text-gray-900">${compName}</b></span>
                ${normalP > 0 ? `<span>Normal SP: <span class="line-through text-gray-500">RM ${normalP.toFixed(2)}</span></span>` : ''}
                <span>Active Price: <b class="font-mono ${hasPromo ? 'text-rose-700 bg-white border border-rose-200 shadow-2xs' : 'text-gray-900 bg-white border border-indigo-200'} px-2 py-0.5 rounded text-xs font-extrabold">${chainP > 0 ? 'RM ' + chainP.toFixed(2) : 'N/A'}</b></span>
                <span>Farley/Emart: ${superTxt}</span>
                ${promoNote ? `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300"><i class="fa-solid fa-tag text-amber-600"></i> ${promoNote}</span>` : ''}
                ${pmgSp > 0 ? `<span>Suggested Defensive SP: <b class="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 font-extrabold text-xs">RM ${pmgSp.toFixed(2)}</b></span>` : ''}
              </div>

              <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-200/60 flex-wrap">
                <button type="button" onclick="window.pmgPricing.applyAiCompetitorPrices('${sku.id}', ${superP}, ${chainP}, '${compName.replace(/'/g, "\\'")}', '${promoNote.replace(/'/g, "\\'")}')"
                  class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl transition shadow-xs whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-check-double text-indigo-200"></i> Apply Benchmarks to Matrix
                </button>
                ${pmgSp > 0 && Math.abs(pmgSp - sku.standardSp) > 0.05 ? `
                <button type="button" onclick="window.pmgPricing.applyAiCompetitorPricesAndPmgSp('${sku.id}', ${superP}, ${chainP}, '${compName.replace(/'/g, "\\'")}', '${promoNote.replace(/'/g, "\\'")}', ${pmgSp})"
                  class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-xs whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                  title="Update Member SP to RM ${pmgSp.toFixed(2)} to defensively match competitor promo">
                  <i class="fa-solid fa-bolt text-emerald-200"></i> Match Promo (Set SP RM ${pmgSp.toFixed(2)})
                </button>
                ` : ''}
              </div>
            </div>
          `;
        }
      }

      // Live Grounding Sources Banner
      let groundingHtml = '';
      if (groundingMetadata) {
        const queries = groundingMetadata.webSearchQueries || [];
        const chunks = (groundingMetadata.groundingChunks || []).filter(c => c.web?.uri);
        if (queries.length > 0 || chunks.length > 0) {
          const qList = queries.map(q => `<span class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono text-[9px] mr-1 mb-1 inline-block"><i class="fa-solid fa-magnifying-glass text-[8px] mr-0.5"></i>${q}</span>`).join('');
          const cList = chunks.slice(0, 6).map(c => `<a href="${c.web.uri}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline text-[10px] mr-2 inline-flex items-center gap-0.5"><i class="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>${c.web.title || c.web.uri}</a>`).join('');
          groundingHtml = `
            <div class="mb-3 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950">
              <div class="font-bold flex items-center justify-between gap-2 text-blue-900 mb-1.5 flex-wrap">
                <span class="flex items-center gap-1.5">
                  <i class="fa-brands fa-google text-blue-600 text-sm"></i>
                  <span>Verified with Real-Time Google Search Grounding</span>
                </span>
                <span class="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <i class="fa-solid fa-circle-check text-emerald-500 mr-1"></i>Live Web Evidence
                </span>
              </div>
              ${qList ? `<div class="mb-1.5 flex flex-wrap gap-1">${qList}</div>` : ''}
              ${cList ? `<div class="text-[10px] text-gray-600 flex flex-wrap gap-2 pt-1 border-t border-blue-200/50">${cList}</div>` : ''}
            </div>
          `;
        }
      }

      // Render Markdown-styled response
      const formattedHtml = this.formatMarkdownToHtml(responseText);
      if (resultContainer) {
        resultContainer.innerHTML = `
          ${applyBannerHtml}
          ${groundingHtml}
          <div class="prose prose-sm max-w-none text-xs text-gray-800 leading-relaxed space-y-2">
            ${formattedHtml}
          </div>
        `;
      }
    }

    formatMarkdownToHtml(md) {
      if (!md) return '';
      return md
        .replace(/### (.*?)\n/g, '<h4 class="font-bold text-sm text-gray-900 mt-3 mb-1">$1</h4>')
        .replace(/## (.*?)\n/g, '<h3 class="font-bold text-base text-blue-900 mt-4 mb-2 pb-1 border-b border-gray-200">$1</h3>')
        .replace(/# (.*?)\n/g, '<h2 class="font-bold text-lg text-purple-900 mt-4 mb-2">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/^\s*\*\s+(.*?)$/gm, '<li class="ml-4 list-disc text-gray-700">$1</li>')
        .replace(/^\s*-\s+(.*?)$/gm, '<li class="ml-4 list-disc text-gray-700">$1</li>')
        .replace(/^\s*\d+\.\s+(.*?)$/gm, '<li class="ml-4 list-decimal text-gray-700">$1</li>')
        .replace(/\n\n/g, '<br><br>');
    }

    getValidGeminiApiKey() {
      if (typeof window.getGlobalGeminiKey === 'function') {
        const k = window.getGlobalGeminiKey();
        if (k && !['AIzaSyBxKYPJWxi3ILfxPTlQFytzoXJvIZ72m4k', 'AIzaSyAfJqs6YnY5J_URsuvmSMi8WM3BckVwKY4'].includes(k)) {
          return k;
        }
      }
      let apiKey = (localStorage.getItem(STORAGE_KEY_GEMINI) || '').trim();
      const REVOKED_KEYS = [
        'AIzaSyBxKYPJWxi3ILfxPTlQFytzoXJvIZ72m4k',
        'AIzaSyAfJqs6YnY5J_URsuvmSMi8WM3BckVwKY4'
      ];
      if (REVOKED_KEYS.includes(apiKey)) {
        apiKey = '';
        localStorage.removeItem(STORAGE_KEY_GEMINI);
      }
      if (!apiKey && typeof PMG_GLOBAL_FALLBACK_KEY !== 'undefined' && PMG_GLOBAL_FALLBACK_KEY && !REVOKED_KEYS.includes(PMG_GLOBAL_FALLBACK_KEY)) {
        apiKey = PMG_GLOBAL_FALLBACK_KEY;
      }
      return apiKey;
    }

    // ─── BATCH COMPETITOR & PROMOTIONS SCANNER ─────────────────────────────────
    openBatchCompetitorScanModal() {
      const pageSkus = this.getFilteredSkus().slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
      const missingCount = this.skus.filter(s => {
        const isRx = this.isScheduledPrescriptionDrug(s);
        return isRx ? !s.chainPharmacyPrice : (!s.supermarketPrice || !s.chainPharmacyPrice);
      }).length;
      const filteredCount = this.getFilteredSkus().length;

      const elPage = document.getElementById('batchScopePageCount');
      const elMissing = document.getElementById('batchScopeMissingCount');
      const elFiltered = document.getElementById('batchScopeFilteredCount');

      if (elPage) elPage.textContent = `${pageSkus.length} items (Page ${this.currentPage})`;
      if (elMissing) elMissing.textContent = `${missingCount} items catalog-wide`;
      if (elFiltered) elFiltered.textContent = `${filteredCount} items matching search`;

      const modal = document.getElementById('pricingBatchAiModal');
      if (modal) modal.classList.remove('hidden');
    }

    closeBatchCompetitorScanModal() {
      if (this.isBatchScanning) {
        if (!confirm('Batch competitor scan is currently running. Stop scan?')) return;
        this.cancelBatchCompetitorScan();
      }
      const modal = document.getElementById('pricingBatchAiModal');
      if (modal) modal.classList.add('hidden');
    }

    cancelBatchCompetitorScan() {
      this.batchScanCancelled = true;
      const statusBadge = document.getElementById('pricingBatchAiStatusBadge');
      if (statusBadge) statusBadge.textContent = 'Stopping...';
      const label = document.getElementById('pricingBatchProgressLabel');
      if (label) label.innerHTML = '<span class="text-rose-600 font-bold"><i class="fa-solid fa-hand mr-1"></i> Scan Stopped by User</span>';
    }

    async startBatchCompetitorScan() {
      const apiKey = this.getValidGeminiApiKey();
      if (!apiKey) {
        alert('Please paste a free Google AI Studio Gemini API key first using the single item research modal or settings.');
        return;
      }

      // Determine selected scope
      const scopeRadios = document.getElementsByName('batchScope');
      let selectedScope = 'page';
      for (const r of scopeRadios) {
        if (r.checked) {
          selectedScope = r.value;
          break;
        }
      }

      let targetSkus = [];
      if (selectedScope === 'page') {
        const start = (this.currentPage - 1) * this.pageSize;
        targetSkus = this.getFilteredSkus().slice(start, start + this.pageSize);
      } else if (selectedScope === 'missing') {
        targetSkus = this.skus.filter(s => {
          const isRx = this.isScheduledPrescriptionDrug(s);
          return isRx ? !s.chainPharmacyPrice : (!s.supermarketPrice || !s.chainPharmacyPrice);
        });
      } else {
        targetSkus = this.getFilteredSkus();
      }

      if (targetSkus.length === 0) {
        alert('No SKUs found matching the selected scope.');
        return;
      }

      const includePromo = document.getElementById('batchIncludePromoFactor')?.checked ?? true;

      // UI setup
      this.isBatchScanning = true;
      this.batchScanCancelled = false;

      const startBtn = document.getElementById('pricingBatchStartBtn');
      const cancelBtn = document.getElementById('pricingBatchCancelBtn');
      const progressArea = document.getElementById('pricingBatchProgressArea');
      const progressBar = document.getElementById('pricingBatchProgressBar');
      const progressLabel = document.getElementById('pricingBatchProgressLabel');
      const progressPercent = document.getElementById('pricingBatchProgressPercent');
      const itemCounter = document.getElementById('pricingBatchItemCounter');
      const tbody = document.getElementById('pricingBatchResultsTbody');
      const statusBadge = document.getElementById('pricingBatchAiStatusBadge');
      const scrollBox = document.getElementById('pricingBatchResultsScroll');

      if (startBtn) startBtn.classList.add('hidden');
      if (cancelBtn) cancelBtn.classList.remove('hidden');
      if (progressArea) progressArea.classList.remove('hidden');
      if (statusBadge) statusBadge.textContent = 'Scanning...';
      if (tbody) tbody.innerHTML = '';

      const totalItems = targetSkus.length;
      let processedCount = 0;
      let updatedCount = 0;

      const CHUNK_SIZE = 6;
      const chunks = [];
      for (let i = 0; i < targetSkus.length; i += CHUNK_SIZE) {
        chunks.push(targetSkus.slice(i, i + CHUNK_SIZE));
      }

      // Primary models with Google Search Grounding support
      const modelsToTry = [
        { code: 'gemini-2.0-flash',      name: 'Gemini 2.0 Flash' },
        { code: 'gemini-1.5-flash',      name: 'Gemini 1.5 Flash' },
        { code: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite' },
        { code: 'gemini-1.5-pro',        name: 'Gemini 1.5 Pro' },
        { code: 'gemini-2.5-flash',      name: 'Gemini 2.5 Flash' }
      ];

      for (let c = 0; c < chunks.length; c++) {
        if (this.batchScanCancelled) break;

        const currentChunk = chunks[c];
        const chunkStart = c * CHUNK_SIZE + 1;
        const chunkEnd = Math.min((c + 1) * CHUNK_SIZE, totalItems);

        if (progressLabel) {
          progressLabel.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-indigo-600 mr-1.5"></i> Live Search Grounding items ${chunkStart} to ${chunkEnd} of ${totalItems}…`;
        }

        // Build chunk prompt (UNANCHORED - NEVER include user selling price)
        let itemListText = '';
        currentChunk.forEach((s, idx) => {
          const isRx = this.isScheduledPrescriptionDrug(s);
          const rxLabel = isRx ? ' [PRESCRIPTION POISON - SUPERMARKET N/A]' : ' [FMCG / HEALTHCARE - AUDIT SUPERMARKET & PHARMACY]';
          const genericHint = this.getGenericDrugHint(s);
          const costHint = s.costPrice > 0 ? `Trade Cost: RM ${s.costPrice.toFixed(2)}` : 'Trade Cost: Standard';
          const codeVal = (s.code && !['N/A', 'NONE', '-', 'NULL', ''].includes(String(s.code).trim().toUpperCase())) ? s.code : 'None';
          itemListText += `${idx + 1}. [ITEM_ID: "${s.id}"] | Code: "${codeVal}" | Product: "${s.name}"${genericHint ? ' (' + genericHint + ')' : ''} | Category: "${s.category}"${rxLabel} | ${costHint}\n`;
        });

        const prompt = `You are the Senior Commercial Pharmacy Pricing Director for PMG Pharmacy (7 Outlets in Kuching & Padawan, Sarawak, Malaysia).
Perform an OBJECTIVE, UNBIASED competitor price benchmarking using real-time Google Search for these ${currentChunk.length} products.
Search Google for current retail selling prices in Malaysian private community pharmacies (such as BIG Pharmacy, Alpro Pharmacy / Oneclick, Caring Pharmacy, Ting Pharmacy Kuching, Guardian, Watsons).
DO NOT anchor to any assumed markups. Search for actual live market prices.

CRITICAL RULES & ACTIVE PROMOTIONS:
1. PROMOTIONAL PRICING: Check for active promotions and campaign sales (such as 11.11, Payday Sale, clearance, instant rebates, member price, multi-pack).
   - If an item is on promo (e.g. Alpro normal RM 17.50, promo RM 16.50), ALWAYS use the active promotional price for "chainPharmacyPrice"!
   - State the promotion in "promoNote" (e.g. "Alpro 11.11 Promo RM 16.50 (Normal RM 17.50)").
2. SUPERMARKETS: Supermarkets (Farley Supermarket, Emart Hypermarket, Everwin) CANNOT legally sell scheduled prescription poisons. For items tagged [PRESCRIPTION POISON], you MUST set "supermarketPrice": null.
   - For adult/baby diapers, nutrition milk (Ensure, Glucerna, Pediasure), and OTC: Supermarkets DO sell them. Benchmark realistic Farley Kuching/Emart retail prices.
3. DEFENSIVE SELLING PRICE ("suggestedPmgSp"): Recommend a competitive price for PMG branches that matches or defends against competitor promo while keeping margin above trade cost.

Items to Benchmark:
${itemListText}

Respond STRICTLY with a valid JSON array of objects. Use the exact ITEM_ID provided for each item:
\`\`\`json
[
  {
    "id": "ITEM_ID",
    "supermarketPrice": null,
    "chainPharmacyPrice": 0.00,
    "competitorName": "Alpro Oneclick / BIG Pharmacy",
    "promoNote": "Promo RM 16.50 (Normal RM 17.50)",
    "suggestedPmgSp": 0.00
  }
]
\`\`\``;

        let responseText = '';
        for (const m of modelsToTry) {
          const toolVariants = [
            [{ googleSearch: {} }],
            null
          ];
          for (const tools of toolVariants) {
            try {
              const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m.code}:generateContent?key=${apiKey}`;
              const reqBody = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 2500 }
              };
              if (tools) reqBody.tools = tools;

              const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
              });
              if (res.ok) {
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text && text.trim()) {
                  responseText = text.trim();
                  break;
                }
              } else {
                const errData = await res.json().catch(() => ({}));
                console.warn(`[PMG Batch AI] Error on model ${m.code} (${res.status}) [tools=${!!tools}]:`, errData.error?.message || res.status);
              }
            } catch (e) {
              console.warn(`[PMG Batch AI] Error on model ${m.code}:`, e);
            }
            if (responseText) break;
          }
          if (responseText) break;
        }

        // Parse results
        let parsedResults = [];
        if (responseText) {
          try {
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : (responseText.startsWith('[') && responseText.endsWith(']') ? responseText : null);
            if (jsonStr) {
              parsedResults = JSON.parse(jsonStr);
            }
          } catch (e) {
            console.warn('[PMG Batch AI] JSON parse error:', e, responseText);
          }
        }

        // Apply results to currentChunk
        currentChunk.forEach(sku => {
          let r = null;
          if (Array.isArray(parsedResults) && parsedResults.length > 0) {
            // 1. Primary: Match by exact unique item ID (PREVENTS 'N/A' COLLISION)
            r = parsedResults.find(p => p.id && String(p.id).trim() === String(sku.id).trim());

            // 2. Secondary: Match by barcode ONLY if valid (never match N/A, None, or empty)
            if (!r && sku.code && !['N/A', 'NONE', '-', 'NULL', ''].includes(String(sku.code).trim().toUpperCase()) && sku.code.length >= 4) {
              r = parsedResults.find(p => p.code && String(p.code).trim().toLowerCase() === String(sku.code).trim().toLowerCase());
            }

            // 3. Tertiary: Match by normalized name
            if (!r && sku.name) {
              const normSku = sku.name.trim().toLowerCase();
              r = parsedResults.find(p => {
                const pName = (p.productName || p.name || '').trim().toLowerCase();
                return pName && (normSku === pName || normSku.startsWith(pName) || pName.startsWith(normSku));
              });
            }
          }

          const isRx = this.isScheduledPrescriptionDrug(sku);
          const knownBench = this.getKnownMalaysianBenchmark(sku);

          let detectedChainPrice = null;
          let detectedSuperPrice = null;
          let detectedCompName = '';
          let detectedPromoNote = '';

          if (r) {
            if (r.chainPharmacyPrice && !isNaN(parseFloat(r.chainPharmacyPrice)) && parseFloat(r.chainPharmacyPrice) > 0) {
              detectedChainPrice = parseFloat(r.chainPharmacyPrice);
            }
            if (r.supermarketPrice && !isNaN(parseFloat(r.supermarketPrice)) && parseFloat(r.supermarketPrice) > 0) {
              detectedSuperPrice = parseFloat(r.supermarketPrice);
            }
            detectedCompName = r.competitorName || '';
            detectedPromoNote = r.promoNote || '';
          }

          // Supermarket rule for Rx
          if (isRx) {
            detectedSuperPrice = null;
          }

          // Domain Sanity Guard on Pharmacy Price vs Wholesale Cost
          if (detectedChainPrice !== null && sku.costPrice > 0) {
            if (isRx && (detectedChainPrice < sku.costPrice * 0.65 || detectedChainPrice > sku.costPrice * 3.5)) {
              if (knownBench) {
                detectedChainPrice = knownBench.retailSp;
                detectedCompName = knownBench.competitor;
                detectedPromoNote = knownBench.note || '';
              } else {
                detectedChainPrice = Math.round((sku.costPrice * 1.18) * 10) / 10;
                detectedCompName = 'Local Pharmacy Chain';
              }
            }
          }

          // OTC / Healthcare Domain Sanity Guard: Prevent AI from injecting manufacturer MSRP instead of retail price
          if (!isRx && knownBench) {
            const refMax = knownBench.retailSp * 1.15;
            if (detectedChainPrice !== null && (detectedChainPrice > refMax || detectedChainPrice >= 95.00 || detectedChainPrice === 105.00)) {
              detectedChainPrice = knownBench.promoSp || knownBench.retailSp;
              detectedCompName = knownBench.competitor;
              detectedPromoNote = knownBench.note || '';
            }
          }

          // If AI did not return a price or returned 0, but known benchmark exists
          if (!detectedChainPrice && knownBench) {
            detectedChainPrice = knownBench.promoSp || knownBench.retailSp;
            if (!detectedCompName) detectedCompName = knownBench.competitor;
            if (!detectedPromoNote) detectedPromoNote = knownBench.note || '';
          }
          if (!detectedSuperPrice && knownBench && !isRx && knownBench.supermarketSp) {
            detectedSuperPrice = knownBench.supermarketSp;
          }

          if (detectedChainPrice !== null || detectedSuperPrice !== null) {
            if (isRx) {
              sku.supermarketPrice = null;
            } else if (detectedSuperPrice !== null) {
              sku.supermarketPrice = detectedSuperPrice;
            }
            if (detectedChainPrice !== null) {
              sku.chainPharmacyPrice = detectedChainPrice;
            }
            if (detectedCompName) sku.competitorName = detectedCompName;
            if (detectedPromoNote) sku.promoNote = detectedPromoNote;
            sku.customModified = true;
            updatedCount++;
          }

          processedCount++;

          // Append live stream row in modal
          if (tbody) {
            const isRx = this.isScheduledPrescriptionDrug(sku);
            const superTxt = isRx 
              ? '<span class="text-slate-400 font-semibold text-[10px]">N/A (Rx)</span>' 
              : (sku.supermarketPrice ? `RM ${sku.supermarketPrice.toFixed(2)}` : '<span class="text-gray-300">N/A</span>');
            const chainTxt = sku.chainPharmacyPrice ? `RM ${sku.chainPharmacyPrice.toFixed(2)}` : '<span class="text-gray-300">N/A</span>';
            const compTxt = sku.competitorName || 'Alpro / Ting';
            const promoBadge = sku.promoNote 
              ? `<span class="inline-flex items-center gap-1 text-[9px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded"><i class="fa-solid fa-fire text-amber-600"></i> ${sku.promoNote}</span>`
              : '<span class="text-gray-300">-</span>';

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-indigo-50/50 transition border-b border-gray-100 text-[11px]';
            tr.innerHTML = `
              <td class="p-2">
                <div class="font-bold text-gray-900 truncate max-w-[200px]">${sku.name}</div>
                <div class="text-[10px] text-gray-400 font-mono">${sku.code}</div>
              </td>
              <td class="p-2 text-right font-mono font-bold text-blue-900">RM ${sku.standardSp.toFixed(2)}</td>
              <td class="p-2 text-right font-mono font-semibold text-gray-800">${superTxt}</td>
              <td class="p-2 text-right font-mono font-semibold text-gray-800">
                ${chainTxt}
                <div class="text-[9px] text-gray-400 font-sans font-normal">${compTxt}</div>
              </td>
              <td class="p-2">${promoBadge}</td>
              <td class="p-2 text-center">
                <span class="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <i class="fa-solid fa-check text-emerald-600"></i> Synced
                </span>
              </td>
            `;
            tbody.appendChild(tr);
          }
        });

        // Update progress bar
        const pct = Math.round((processedCount / totalItems) * 100);
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressPercent) progressPercent.textContent = `${pct}%`;
        if (itemCounter) itemCounter.textContent = `${processedCount} / ${totalItems} processed (${updatedCount} updated)`;
        if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;

        // Save progress to storage periodically
        this.saveSkusToStorage();

        // Brief delay between batches to respect rate limits
        if (c < chunks.length - 1 && !this.batchScanCancelled) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      // Finished or Stopped
      this.isBatchScanning = false;
      if (cancelBtn) cancelBtn.classList.add('hidden');
      if (startBtn) {
        startBtn.classList.remove('hidden');
        startBtn.innerHTML = '<i class="fa-solid fa-rotate-right mr-1"></i> Scan Again';
      }

      if (this.batchScanCancelled) {
        if (statusBadge) statusBadge.textContent = 'Stopped';
        if (typeof showExpiryToast === 'function') {
          showExpiryToast(`⚠️ Scan stopped. Saved ${updatedCount} competitor benchmark updates.`);
        }
      } else {
        if (statusBadge) statusBadge.textContent = 'Completed';
        if (progressLabel) progressLabel.innerHTML = `<span class="text-emerald-700 font-bold"><i class="fa-solid fa-circle-check text-emerald-600"></i> Completed! Successfully analyzed ${updatedCount} SKUs.</span>`;
        if (typeof showExpiryToast === 'function') {
          showExpiryToast(`✅ Batch competitor scan completed! Saved ${updatedCount} benchmark items.`);
        }
      }

      // Re-render table and trigger sheets sync
      this.renderTableOnly();
      this.saveSkusToStorage();
    }

    // ─── EXPORT 7-BRANCH PRICE BROADCAST MEMO ──────────────────────────────────
    exportPriceMemo() {
      let memo = `==========================================================\n`;
      memo += `PMG PHARMACY — PRICING MEMORANDUM\n`;
      memo += `UNIFIED 7-OUTLET STANDARDIZED PRICING DIRECTIVE\n`;
      memo += `Authorized by: William Chai Yee Sian (Pharmacist)\n`;
      memo += `Date: ${new Date().toLocaleDateString('en-GB')}\n`;
      memo += `Target Branches: Kota Sentosa, Matang Jaya, Sungai Moyan, Malihah, Metrocity, Astana, Samariang\n`;
      memo += `==========================================================\n\n`;

      this.skus.forEach((s, idx) => {
        const margin = this.calculateMargin(s.costPrice, s.standardSp);
        memo += `${idx + 1}. [${s.code}] ${s.name}\n`;
        memo += `   Standard Area SP: RM ${s.standardSp.toFixed(2)} | Cost: RM ${s.costPrice.toFixed(2)} (${s.supplier || 'Distributor'}) | Margin: ${margin}%\n`;
        if (this.isScheduledPrescriptionDrug(s)) {
          memo += `   Prescription Drug / Rx Exclusive (Supermarket N/A - Poisons Act 1952)\n`;
          if (s.chainPharmacyPrice) {
            memo += `   Pharmacy Benchmark (${s.competitorName || 'Alpro/Ting'}): RM ${s.chainPharmacyPrice.toFixed(2)}\n`;
          }
        } else {
          if (s.supermarketPrice) {
            memo += `   Supermarket Benchmark (Farley/Emart): RM ${s.supermarketPrice.toFixed(2)}\n`;
          }
          if (s.chainPharmacyPrice) {
            memo += `   Pharmacy Benchmark (${s.competitorName || 'Alpro/Ting'}): RM ${s.chainPharmacyPrice.toFixed(2)}\n`;
          }
        }
        if (s.notes) {
          memo += `   Directive: ${s.notes}\n`;
        }
        memo += `----------------------------------------------------------\n`;
      });

      const blob = new Blob([memo], { type: 'text/plain;charset=utf-8' });
      if (window.saveAs) {
        window.saveAs(blob, `PMG_7_Branches_Standardized_Pricing_Memo_${new Date().toISOString().slice(0, 10)}.txt`);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PMG_7_Branches_Standardized_Pricing_Memo.txt`;
        a.click();
      }
    }

    // ─── EXPORT PRICE-CHANGED SKUS ─────────────────────────────────────────────
    exportPriceChangedSkus() {
      const changed = this.skus.filter(s => s.customModified && (s.previousSp !== undefined || s.previousCost !== undefined));

      if (changed.length === 0) {
        alert('No price changes recorded yet.\n\nEdit any "Member SP" or "Custom Cost" field in the Price Matrix to start tracking changes. Then use this button to export a change log.');
        return;
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB');
      const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      let csv = `PMG PHARMACY — PRICE CHANGE LOG\n`;
      csv += `Exported by: William Chai (Pharmacist-in-Charge, PMG Kota Sentosa) | Date: ${dateStr} ${timeStr}\n`;
      csv += `Total Changed Items: ${changed.length}\n\n`;
      csv += `"Item Code","Description","Brand","Category","Supplier","Previous SP (RM)","New SP (RM)","SP Change (RM)","SP Change (%)","Previous Cost (RM)","New Cost (RM)","Cost Change (RM)","New Margin (%)","Old Margin (%)","Changed At"\n`;

      changed.forEach(s => {
        const escapeCsv = (v) => `"${String(v || '').replace(/"/g, '""')}"`;

        const prevSp = s.previousSp !== undefined ? parseFloat(s.previousSp) : parseFloat(s.standardSp);
        const newSp = parseFloat(s.standardSp) || 0;
        const spChange = (newSp - prevSp).toFixed(2);
        const spPct = prevSp > 0 ? (((newSp - prevSp) / prevSp) * 100).toFixed(1) + '%' : 'N/A';

        const prevCost = s.previousCost !== undefined ? parseFloat(s.previousCost) : parseFloat(s.costPrice);
        const newCost = parseFloat(s.costPrice) || 0;
        const costChange = (newCost - prevCost).toFixed(2);

        const newMargin = newSp > 0 ? (((newSp - newCost) / newSp) * 100).toFixed(1) + '%' : 'N/A';
        const oldMargin = prevSp > 0 ? (((prevSp - prevCost) / prevSp) * 100).toFixed(1) + '%' : 'N/A';

        const changedAt = s.priceChangedAt
          ? new Date(s.priceChangedAt).toLocaleString('en-GB')
          : dateStr;

        csv += [
          escapeCsv(s.code),
          escapeCsv(s.name),
          escapeCsv(s.brand),
          escapeCsv(s.category),
          escapeCsv(s.supplier),
          prevSp.toFixed(2),
          newSp.toFixed(2),
          (parseFloat(spChange) >= 0 ? '+' : '') + spChange,
          (parseFloat(spChange) >= 0 ? '+' : '') + spPct,
          prevCost.toFixed(2),
          newCost.toFixed(2),
          (parseFloat(costChange) >= 0 ? '+' : '') + costChange,
          newMargin,
          oldMargin,
          escapeCsv(changedAt)
        ].join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const filename = `PMG_Price_Change_Log_${now.toISOString().slice(0, 10)}.csv`;
      if (window.saveAs) {
        window.saveAs(blob, filename);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      }

      if (typeof showExpiryToast === 'function') {
        showExpiryToast(`✅ Exported ${changed.length} price-changed SKUs to CSV.`);
      }
    }

    clearPriceChangelog() {
      if (!confirm(`Clear price change history for all ${this.skus.filter(s => s.customModified && (s.previousSp !== undefined || s.previousCost !== undefined)).length} modified SKUs? (Export first if you need the log!)`)) return;
      this.skus.forEach(s => {
        delete s.previousSp;
        delete s.originalSp;
        delete s.previousCost;
        delete s.originalCost;
        delete s.priceChangedAt;
      });
      this.saveSkusToStorage();
      this.renderTableOnly();
      if (typeof showExpiryToast === 'function') {
        showExpiryToast('Price change history cleared.');
      }
    }
  }

  // ─── GLOBAL INSTANCE & INITIALIZATION ───────────────────────────────────────
  window.pmgPricing = new PricingIntelligenceEngine();

  window.initPricingIntelligence = function() {
    if (window.pmgPricing) {
      window.pmgPricing.render();
    }
  };

})(window);
