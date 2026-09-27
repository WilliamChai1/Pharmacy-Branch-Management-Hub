// js/pricing-intelligence.js — PMG Area Manager Pricing Intelligence, Competitor Benchmarking & SWOT Strategy
'use strict';

(function(window) {
  // ─── LOCAL STORAGE KEYS ───────────────────────────────────────────────────────
  const STORAGE_KEY_PRICING_SKUS = 'pmg_pricing_skus_master';
  const STORAGE_KEY_GEMINI = 'pmg_gemini_key';

  // ─── DEFAULT BENCHMARK SKUs (SARAWAK / KUCHING RETAIL PHARMACY) ─────────────
  const DEFAULT_SKUS = [
    // ── Chronic Medications (NCD) ──
    {
      id: 'sku-01',
      category: 'Chronic / NCD',
      code: '104322',
      name: "JANUMET XR 100/1000MG TAB 28'S",
      brand: 'MSD',
      supplier: 'Zuellig Pharma',
      costPrice: 98.50,
      standardSp: 118.00,
      currentBranchSp: 118.00,
      supermarketPrice: null, // Supermarkets don't sell POM
      chainPharmacyPrice: 122.00,
      competitorName: 'Caring / Alpro',
      strategyTag: 'core_rx',
      elasticity: 'Inelastic',
      notes: 'Prescription staple. High patient loyalty; tie in with HbA1c & kidney monitoring to defend volume.'
    },
    {
      id: 'sku-02',
      category: 'Chronic / NCD',
      code: '101684',
      name: "NORVASC 5MG TAB 30'S",
      brand: 'Pfizer / Viatris',
      supplier: 'Zuellig Pharma',
      costPrice: 36.00,
      standardSp: 48.00,
      currentBranchSp: 48.00,
      supermarketPrice: null,
      chainPharmacyPrice: 49.50,
      competitorName: 'BIG / Guardian',
      strategyTag: 'core_rx',
      elasticity: 'Inelastic',
      notes: 'Offer generic Amlodipine 5mg (Cost RM 4.50, SP RM 15.00) as 70% margin alternative for budget-conscious.'
    },
    {
      id: 'sku-03',
      category: 'Chronic / NCD',
      code: '105112',
      name: "FORXIGA 10MG TAB 28'S",
      brand: 'AstraZeneca',
      supplier: 'DKSH',
      costPrice: 125.00,
      standardSp: 148.00,
      currentBranchSp: 149.00,
      supermarketPrice: null,
      chainPharmacyPrice: 152.00,
      competitorName: 'Alpro Pharmacy',
      strategyTag: 'core_rx',
      elasticity: 'Moderate',
      notes: 'Cardiorenal-metabolic anchor. Standardize at RM 148.00 across all 7 outlets.'
    },
    {
      id: 'sku-04',
      category: 'Chronic / NCD',
      code: '102219',
      name: "LIPITOR 20MG TAB 30'S",
      brand: 'Pfizer / Viatris',
      supplier: 'Zuellig Pharma',
      costPrice: 82.00,
      standardSp: 105.00,
      currentBranchSp: 106.00,
      supermarketPrice: null,
      chainPharmacyPrice: 109.00,
      competitorName: 'Caring Pharmacy',
      strategyTag: 'core_rx',
      elasticity: 'Inelastic',
      notes: 'Lipid control. Bundle with CoQ10 100mg to prevent statin-induced myopathy (high margin bundle).'
    },
    {
      id: 'sku-05',
      category: 'Chronic / NCD',
      code: '101340',
      name: "GLUCOPHAGE XR 500MG TAB 100'S",
      brand: 'Merck Serono',
      supplier: 'Zuellig Pharma',
      costPrice: 42.00,
      standardSp: 55.00,
      currentBranchSp: 55.00,
      supermarketPrice: null,
      chainPharmacyPrice: 58.00,
      competitorName: 'Local Independent',
      strategyTag: 'core_rx',
      elasticity: 'Inelastic',
      notes: 'First-line Metformin. High monthly replenishment repeat rate.'
    },

    // ── Over-The-Counter (OTC) & Fast Moving ──
    {
      id: 'sku-06',
      category: 'OTC / Analgesic',
      code: '201102',
      name: "PANADOL ACTIFAST 500MG 20'S",
      brand: 'Haleon',
      supplier: 'DKSH',
      costPrice: 11.20,
      standardSp: 13.90,
      currentBranchSp: 14.50,
      supermarketPrice: 13.50,
      chainPharmacyPrice: 14.20,
      competitorName: 'Farley / Emart',
      strategyTag: 'kvi_defensive',
      elasticity: 'Highly Elastic',
      notes: '⚠️ Supermarket Traffic Loss Leader. Must standardize at RM 13.90 across all 7 outlets to stop price-gouging perception.'
    },
    {
      id: 'sku-07',
      category: 'OTC / Analgesic',
      code: '201105',
      name: "PANADOL OPTIZORB 500MG 20'S",
      brand: 'Haleon',
      supplier: 'DKSH',
      costPrice: 9.50,
      standardSp: 11.90,
      currentBranchSp: 12.20,
      supermarketPrice: 11.50,
      chainPharmacyPrice: 12.50,
      competitorName: 'Farley / H&L',
      strategyTag: 'kvi_defensive',
      elasticity: 'Highly Elastic',
      notes: 'Match within RM 0.40 of Farley. Keep on front counter beside payment POS.'
    },
    {
      id: 'sku-08',
      category: 'OTC / Analgesic',
      code: '101357',
      name: "UPHAMOL 650MG STRIP (10X10'S)",
      brand: 'Duopharma',
      supplier: 'Apex Pharmacy',
      costPrice: 16.50,
      standardSp: 22.90,
      currentBranchSp: 23.50,
      supermarketPrice: null,
      chainPharmacyPrice: 24.50,
      competitorName: 'Watsons / Guardian',
      strategyTag: 'core_rx',
      elasticity: 'Moderate',
      notes: 'Good alternative to Panadol with better margin (27.9%).'
    },
    {
      id: 'sku-09',
      category: 'OTC / Fast Moving',
      code: '203301',
      name: "GAVISCON DOUBLE ACTION LIQUID 150ML",
      brand: 'Reckitt',
      supplier: 'DKSH',
      costPrice: 19.80,
      standardSp: 25.90,
      currentBranchSp: 26.50,
      supermarketPrice: 26.50,
      chainPharmacyPrice: 26.90,
      competitorName: 'Watsons / Emart',
      strategyTag: 'core_rx',
      elasticity: 'Moderate',
      notes: 'Gastric & GERD fast relief. Beat supermarket by RM 0.60; display prominently in GI shelf.'
    },
    {
      id: 'sku-10',
      category: 'OTC / Fast Moving',
      code: '204118',
      name: "DIFFLAM AB SORE THROAT LOZENGES ORANGE 16'S",
      brand: 'iNova',
      supplier: 'DKSH',
      costPrice: 8.40,
      standardSp: 11.50,
      currentBranchSp: 11.90,
      supermarketPrice: 11.80,
      chainPharmacyPrice: 12.50,
      competitorName: 'Guardian / CS',
      strategyTag: 'core_rx',
      elasticity: 'Moderate',
      notes: 'Antiseptic throat lozenge. High impulse buy item during flu season.'
    },
    {
      id: 'sku-11',
      category: 'OTC / Fast Moving',
      code: '205520',
      name: "HURIX'S 600 FLU COUGH SYRUP 100ML",
      brand: 'Hurixs',
      supplier: 'Advance Pharma',
      costPrice: 7.20,
      standardSp: 9.90,
      currentBranchSp: 10.20,
      supermarketPrice: 9.60,
      chainPharmacyPrice: 10.20,
      competitorName: 'Farley / Everrise',
      strategyTag: 'kvi_defensive',
      elasticity: 'High',
      notes: 'Popular local herbal syrup. Keep within RM 9.90.'
    },

    // ── Vitamins & Wellness Supplements ──
    {
      id: 'sku-12',
      category: 'Vitamins & Health',
      code: '301145',
      name: "FLAVETTES EFFERVESCENT VIT C + ZINC GLOW 30'S",
      brand: 'Duopharma',
      supplier: 'Apex Pharmacy',
      costPrice: 29.50,
      standardSp: 42.90,
      currentBranchSp: 44.90,
      supermarketPrice: 43.90,
      chainPharmacyPrice: 45.90,
      competitorName: 'Watsons / Guardian',
      strategyTag: 'core_rx',
      elasticity: 'Moderate',
      notes: 'Skin glow & immunity. Strong seller in Metrocity & Matang Jaya among female professionals.'
    },
    {
      id: 'sku-13',
      category: 'Vitamins & Health',
      code: '301149',
      name: "CEBION VITAMIN C 1000MG ORANGE 30'S",
      brand: 'P&G',
      supplier: 'Zuellig Pharma',
      costPrice: 27.00,
      standardSp: 38.90,
      currentBranchSp: 39.90,
      supermarketPrice: 39.50,
      chainPharmacyPrice: 41.50,
      competitorName: 'Farley / Caring',
      strategyTag: 'core_rx',
      elasticity: 'Moderate',
      notes: 'Heritage vitamin C brand in Sarawak.'
    },
    {
      id: 'sku-14',
      category: 'Vitamins & Health',
      code: '102384',
      name: "BLACKMORES OMEGA-3 FISH OIL 1000MG (2X200'S)",
      brand: 'Blackmores',
      supplier: 'DKSH',
      costPrice: 72.00,
      standardSp: 108.00,
      currentBranchSp: 112.00,
      supermarketPrice: null,
      chainPharmacyPrice: 118.00,
      competitorName: 'Caring / Alpro',
      strategyTag: 'core_rx',
      elasticity: 'Moderate',
      notes: 'Family cardiovascular protection. 33.3% margin.'
    },
    {
      id: 'sku-15',
      category: 'Vitamins & Health',
      code: 'HB-001',
      name: "⭐ PMG PRO-DEFENSE VITAMIN C 1000MG + ZINC 30'S (HOUSE BRAND)",
      brand: 'PMG Healthcare',
      supplier: 'PMG HQ Central Warehouse',
      costPrice: 12.00,
      standardSp: 26.90,
      currentBranchSp: 26.90,
      supermarketPrice: null,
      chainPharmacyPrice: null,
      competitorName: 'Exclusive to PMG',
      strategyTag: 'margin_builder',
      elasticity: 'Shielded (Exclusive)',
      notes: '💎 55.4% GROSS MARGIN! Train counter staff to recommend when customer asks for Flavettes or Redoxon.'
    },
    {
      id: 'sku-16',
      category: 'Vitamins & Health',
      code: 'HB-002',
      name: "⭐ PMG HIGH POTENCY DEEP SEA OMEGA-3 1200MG 100'S",
      brand: 'PMG Healthcare',
      supplier: 'PMG HQ Central Warehouse',
      costPrice: 28.00,
      standardSp: 65.00,
      currentBranchSp: 65.00,
      supermarketPrice: null,
      chainPharmacyPrice: null,
      competitorName: 'Exclusive to PMG',
      strategyTag: 'margin_builder',
      elasticity: 'Shielded (Exclusive)',
      notes: '💎 56.9% GROSS MARGIN! Pair with BP & Cholesterol check at consultation desk.'
    },

    // ── Adult & Infant Nutrition (Supermarket War Zone) ──
    {
      id: 'sku-17',
      category: 'Nutrition & Milk',
      code: '401101',
      name: "ENSURE GOLD VANILLA 850G",
      brand: 'Abbott',
      supplier: 'DKSH',
      costPrice: 98.50,
      standardSp: 109.90,
      currentBranchSp: 112.00,
      supermarketPrice: 108.90,
      chainPharmacyPrice: 114.90,
      competitorName: 'Farley 6th Mile / Emart',
      strategyTag: 'kvi_defensive',
      elasticity: 'Extremely Elastic',
      notes: '⚠️ CRITICAL KVI! Supermarkets (Farley/Emart) sell at 1-3% margin to pull seniors. Match at RM 109.90; win back margin via Calcium/Bone supplements add-on.'
    },
    {
      id: 'sku-18',
      category: 'Nutrition & Milk',
      code: '401105',
      name: "GLUCERNA TRIPLE CARE 850G",
      brand: 'Abbott',
      supplier: 'DKSH',
      costPrice: 114.00,
      standardSp: 128.00,
      currentBranchSp: 130.00,
      supermarketPrice: 126.90,
      chainPharmacyPrice: 132.00,
      competitorName: 'Farley / CS',
      strategyTag: 'kvi_defensive',
      elasticity: 'Highly Elastic',
      notes: 'Diabetic meal replacement. Price competitively; give free blood glucose test voucher upon purchase of 2 cans.'
    },
    {
      id: 'sku-19',
      category: 'Nutrition & Milk',
      code: '402210',
      name: "PEDIASURE COMPLETE OHT VANILLA 850G",
      brand: 'Abbott',
      supplier: 'DKSH',
      costPrice: 99.00,
      standardSp: 111.00,
      currentBranchSp: 114.00,
      supermarketPrice: 109.90,
      chainPharmacyPrice: 115.00,
      competitorName: 'Emart / Farley',
      strategyTag: 'kvi_defensive',
      elasticity: 'Highly Elastic',
      notes: 'Crucial for young families in Moyan, Samariang, and Malihah. Standardize at RM 111.00.'
    },
    {
      id: 'sku-20',
      category: 'Nutrition & Milk',
      code: '405510',
      name: "DRYPERS WEE WEE DRY MEGA L 62'S",
      brand: 'Vinda',
      supplier: 'Vinda Wholesaler',
      costPrice: 31.00,
      standardSp: 34.90,
      currentBranchSp: 36.50,
      supermarketPrice: 33.50,
      chainPharmacyPrice: 36.90,
      competitorName: 'Farley / H&L',
      strategyTag: 'kvi_defensive',
      elasticity: 'Extremely Elastic',
      notes: 'Do NOT overstock. Keep small buffer at RM 34.90. Place teething gel and diaper rash cream right above diapers.'
    },

    // ── Diagnostics & Equipment (Clinical Moat) ──
    {
      id: 'sku-21',
      category: 'Diagnostics & Devices',
      code: '501102',
      name: "ACCU-CHEK INSTANT TEST STRIPS 50'S",
      brand: 'Roche',
      supplier: 'Roche / DKSH',
      costPrice: 68.00,
      standardSp: 88.00,
      currentBranchSp: 89.00,
      supermarketPrice: null,
      chainPharmacyPrice: 92.00,
      competitorName: 'Caring / Alpro',
      strategyTag: 'clinical_bundle',
      elasticity: 'Moderate',
      notes: '22.7% margin. Bundle with lancets (RM 18) and alcohol swabs (RM 8) for complete home monitoring package.'
    },
    {
      id: 'sku-22',
      category: 'Diagnostics & Devices',
      code: '502205',
      name: "OMRON HEM-7120 BLOOD PRESSURE MONITOR",
      brand: 'Omron',
      supplier: 'Yung Hua Heng',
      costPrice: 135.00,
      standardSp: 175.00,
      currentBranchSp: 179.00,
      supermarketPrice: null,
      chainPharmacyPrice: 185.00,
      competitorName: 'Watsons / BIG',
      strategyTag: 'clinical_bundle',
      elasticity: 'Low (Quality Driven)',
      notes: 'Provide free in-store calibration, battery testing, and patient logbook to defeat online shopee/lazada discounters.'
    }
  ];

  // ─── THE 7 BRANCH SWOT PROFILES (KUCHING & PADAWAN REGION) ───────────────────
  const BRANCH_SWOT_DATA = {
    'KOTA SENTOSA': {
      name: 'PMG Pharmacy Kota Sentosa',
      code: 'KS01',
      badge: 'Area Manager Flagship Base',
      locationProfile: '7th Mile Commercial Hub, Sentosa Parade. Busy commercial interchange, heavy senior citizen demographic, high bus/transport connectivity.',
      localCompetitors: [
        'Farley Supermarket (6th Mile - aggressive FMCG/milk discounter)',
        'Local independent Chinese medical halls & pharmacies in 7th Mile Old Bazaar',
        'Watsons 7th Mile',
        'CS Mini Market & Wet Market'
      ],
      swot: {
        strengths: [
          'Area Manager William Chai base outlet; clinical expertise and reputation are very strong.',
          'Large established pool of chronic patients (Diabetes, Hypertension, Dyslipidemia).',
          'High patient trust in clinical counselling, Airdoc eye screening, and Teda Meridian consultation.'
        ],
        weaknesses: [
          'High parking congestion around Sentosa Parade during peak morning and weekend market hours.',
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
      locationProfile: 'Matang Jaya Commercial Centre, Jalan Matang. Densely populated mature suburban housing estates, multi-ethnic family profile.',
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
      locationProfile: 'Moyan Square, Jalan Batu Kawa-Matang. Rapidly expanding residential boomtown, young home-buyers, suburban retirees, garden houses.',
      localCompetitors: [
        'Emart Batu Kawa (10 mins drive)',
        'Local Chinese medicine sundry shops in Moyan',
        'Independent neighborhood clinics'
      ],
      swot: {
        strengths: [
          'Dominant modern community pharmacy in Moyan Square commercial heart.',
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
          'Health kiosk events in Moyan Square during weekend community festivals.'
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

  // ─── PRICING INTELLIGENCE ENGINE CLASS ───────────────────────────────────────
  class PricingIntelligenceEngine {
    constructor() {
      this.skus = [];
      this.activeBranchKey = 'KOTA SENTOSA';
      this.activeCategoryFilter = 'ALL';
      this.activeStrategyFilter = 'ALL';
      this.searchQuery = '';
      this.isAiRunning = false;
      this.selectedSkuForAi = null;
      this.init();
    }

    init() {
      this.loadSkusFromStorage();
    }

    loadSkusFromStorage() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_PRICING_SKUS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure every item has supplier attribute even if loaded from older storage format
            parsed.forEach(p => {
              if (!p.supplier) {
                const def = DEFAULT_SKUS.find(d => d.id === p.id || d.code === p.code);
                p.supplier = def && def.supplier ? def.supplier : 'DKSH / Zuellig';
              }
            });
            this.skus = parsed;
            return;
          }
        }
      } catch (err) {
        console.warn('[PMG Pricing] Could not parse stored SKUs:', err);
      }
      // Fallback to default benchmark dataset
      this.skus = JSON.parse(JSON.stringify(DEFAULT_SKUS));
      this.saveSkusToStorage();
    }

    saveSkusToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY_PRICING_SKUS, JSON.stringify(this.skus));
      } catch (e) {
        console.warn('[PMG Pricing] Save error:', e);
      }
    }

    resetToDefaults() {
      if (confirm('Reset all SKU prices and benchmarks to Area Manager factory standards?')) {
        this.skus = JSON.parse(JSON.stringify(DEFAULT_SKUS));
        this.saveSkusToStorage();
        this.render();
        if (typeof showExpiryToast === 'function') {
          showExpiryToast('Restored 7-branch factory benchmark pricing data.');
        }
      }
    }

    // ─── CALCULATE MARGIN ───────────────────────────────────────────────────────
    calculateMargin(cost, sp) {
      if (!sp || sp <= 0 || !cost) return 0;
      return (((sp - cost) / sp) * 100).toFixed(1);
    }

    calculateProfit(cost, sp) {
      if (!sp || !cost) return 0;
      return (sp - cost).toFixed(2);
    }

    // ─── FILTER SKUs ────────────────────────────────────────────────────────────
    getFilteredSkus() {
      return this.skus.filter(s => {
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
        return true;
      });
    }

    // ─── UPDATE SKU PRICE & COST IN MEMORY & STORAGE ───────────────────────────
    updateSkuStandardSp(skuId, newSp) {
      const parsedSp = parseFloat(newSp);
      if (isNaN(parsedSp) || parsedSp < 0) return;
      const sku = this.skus.find(s => s.id === skuId);
      if (sku) {
        sku.standardSp = parsedSp;
        sku.currentBranchSp = parsedSp;
        this.saveSkusToStorage();
        this.renderSummaryCards();
        this.renderTableOnly();
      }
    }

    updateSkuCostPrice(skuId, newCost) {
      const parsedCost = parseFloat(newCost);
      if (isNaN(parsedCost) || parsedCost < 0) return;
      const sku = this.skus.find(s => s.id === skuId);
      if (sku) {
        sku.costPrice = parsedCost;
        this.saveSkusToStorage();
        this.renderSummaryCards();
        this.renderTableOnly();
        if (typeof showExpiryToast === 'function') {
          showExpiryToast(`Updated ${sku.name} Cost: RM ${parsedCost.toFixed(2)}`);
        }
      }
    }

    updateSkuSupplier(skuId, newSupplier) {
      const sku = this.skus.find(s => s.id === skuId);
      if (sku) {
        sku.supplier = (newSupplier || '').trim();
        this.saveSkusToStorage();
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
        notes: skuData.notes || 'Added by Area Manager.'
      };
      this.skus.unshift(newSku);
      this.saveSkusToStorage();
      this.render();
      if (typeof showExpiryToast === 'function') {
        showExpiryToast(`Added ${newSku.name} to 7-branch benchmark.`);
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

      this.skus.forEach(s => {
        const m = parseFloat(this.calculateMargin(s.costPrice, s.standardSp)) || 0;
        totalMarginSum += m;
        if (s.strategyTag === 'kvi_defensive') kviCount++;
        if (s.strategyTag === 'margin_builder') marginBuilderCount++;
      });

      const avgMargin = totalSkus > 0 ? (totalMarginSum / totalSkus).toFixed(1) : 0;

      const elTotal = document.getElementById('pricingSummaryTotalSkus');
      const elAvg = document.getElementById('pricingSummaryAvgMargin');
      const elKvi = document.getElementById('pricingSummaryKvis');
      const elBuilders = document.getElementById('pricingSummaryBuilders');

      if (elTotal) elTotal.textContent = totalSkus;
      if (elAvg) elAvg.textContent = `${avgMargin}%`;
      if (elKvi) elKvi.textContent = kviCount;
      if (elBuilders) elBuilders.textContent = marginBuilderCount;
    }

    renderTableOnly() {
      const tbody = document.getElementById('pricingTableTbody');
      if (!tbody) return;

      const filtered = this.getFilteredSkus();

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center py-8 text-gray-400 text-xs">
              <i class="fa-solid fa-box-open text-2xl mb-2 text-gray-300 block"></i>
              No SKUs matching the current filter. Try adjusting your search query or category.
            </td>
          </tr>
        `;
        return;
      }

      let html = '';
      filtered.forEach(s => {
        const margin = this.calculateMargin(s.costPrice, s.standardSp);
        const profit = this.calculateProfit(s.costPrice, s.standardSp);

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

        // Supermarket price comparison pill
        let superComp = '<span class="text-gray-400 font-mono text-[11px]">—</span>';
        if (s.supermarketPrice) {
          const diff = (s.standardSp - s.supermarketPrice).toFixed(2);
          const isHigher = s.standardSp > s.supermarketPrice;
          const diffClass = isHigher ? 'text-rose-600' : 'text-emerald-700';
          const diffSign = isHigher ? '+' : '';
          superComp = `
            <div class="leading-tight">
              <span class="font-bold text-gray-800 font-mono">RM ${s.supermarketPrice.toFixed(2)}</span>
              <span class="text-[10px] font-bold ${diffClass} block">${diffSign}RM ${diff} vs Farley/Emart</span>
            </div>
          `;
        }

        // Chain pharmacy comparison pill
        let chainComp = '<span class="text-gray-400 font-mono text-[11px]">—</span>';
        if (s.chainPharmacyPrice) {
          const diff = (s.standardSp - s.chainPharmacyPrice).toFixed(2);
          const isHigher = s.standardSp > s.chainPharmacyPrice;
          const diffClass = isHigher ? 'text-amber-600' : 'text-emerald-700 font-bold';
          const diffSign = isHigher ? '+' : '';
          chainComp = `
            <div class="leading-tight">
              <span class="font-bold text-gray-800 font-mono">RM ${s.chainPharmacyPrice.toFixed(2)}</span>
              <span class="text-[10px] ${diffClass} block">${diffSign}RM ${diff} (${s.competitorName || 'Chains'})</span>
            </div>
          `;
        }

        // Margin pill color
        let marginColor = 'text-blue-700 bg-blue-50';
        if (parseFloat(margin) < 15) marginColor = 'text-rose-700 bg-rose-50 font-bold';
        else if (parseFloat(margin) >= 35) marginColor = 'text-emerald-700 bg-emerald-50 font-bold';

        html += `
          <tr class="hover:bg-slate-50 transition border-b border-gray-100 text-xs">
            <td class="p-3">
              <div class="font-bold text-gray-900">${s.name}</div>
              <div class="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                <span class="font-mono bg-gray-100 px-1 rounded">${s.code}</span>
                <span>${s.brand}</span> · <span>${s.category}</span>
              </div>
              <div class="text-[10px] text-gray-400 mt-1 italic">${s.notes || ''}</div>
            </td>
            <td class="p-3">
              ${tagBadge}
            </td>
            <td class="p-3 text-right">
              <div class="inline-flex items-center gap-1 justify-end">
                <span class="text-gray-400 text-xs font-mono">RM</span>
                <input type="number" step="0.05" value="${s.costPrice.toFixed(2)}"
                  onchange="window.pmgPricing.updateSkuCostPrice('${s.id}', this.value)"
                  class="w-20 text-right font-mono font-bold text-gray-900 border border-amber-300 rounded px-1.5 py-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-600 outline-none bg-amber-50/50 hover:bg-white transition"
                  title="Click to edit Cost Price (varies depending on supplier/wholesaler deal)">
              </div>
              <div class="mt-1 flex items-center justify-end gap-1">
                <i class="fa-solid fa-truck-field text-[10px] text-amber-600/70" title="Supplier / Wholesaler"></i>
                <input type="text" list="pmgSupplierList" value="${s.supplier || ''}" placeholder="Supplier..."
                  onchange="window.pmgPricing.updateSkuSupplier('${s.id}', this.value)"
                  class="w-28 text-[11px] text-right font-medium text-gray-600 border-b border-dashed border-gray-300 hover:border-gray-500 focus:border-blue-500 bg-transparent px-1 py-0.5 outline-none"
                  title="Supplier/Distributor (e.g. DKSH, Zuellig, Apex, SSJ Pharma, Advance, HQ)">
              </div>
            </td>
            <td class="p-3 text-right">
              <div class="inline-flex items-center gap-1">
                <span class="text-gray-400 text-xs">RM</span>
                <input type="number" step="0.10" value="${s.standardSp.toFixed(2)}"
                  onchange="window.pmgPricing.updateSkuStandardSp('${s.id}', this.value)"
                  class="w-20 text-right font-mono font-bold text-blue-900 border border-blue-300 rounded px-1.5 py-1 focus:ring-2 focus:ring-blue-400 outline-none bg-blue-50/50 hover:bg-white transition"
                  title="Click to edit standardized 7-outlet selling price">
              </div>
            </td>
            <td class="p-3 text-right">
              <span class="px-2 py-0.5 rounded ${marginColor} font-mono">${margin}%</span>
              <span class="text-[10px] text-gray-400 block font-mono mt-0.5">+RM ${profit}</span>
            </td>
            <td class="p-3 text-right">
              ${superComp}
            </td>
            <td class="p-3 text-right">
              ${chainComp}
            </td>
            <td class="p-3 text-center">
              <button type="button" onclick="window.pmgPricing.launchAiResearch('${s.id}')"
                class="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 mx-auto shadow-2xs"
                title="Run deep competitor research on this SKU with Gemini AI">
                <i class="fa-solid fa-wand-magic-sparkles text-purple-600"></i> AI Deep Check
              </button>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
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
                <i class="fa-solid fa-list-check text-slate-600"></i> Area Manager Directives:
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

    // ─── GEMINI AI DEEP RESEARCH RUNNER ─────────────────────────────────────────
    async launchAiResearch(skuId) {
      const sku = this.skus.find(s => s.id === skuId);
      if (!sku) return;

      this.selectedSkuForAi = sku;
      const modal = document.getElementById('pricingAiModal');
      const title = document.getElementById('pricingAiModalTitle');
      const input = document.getElementById('pricingAiPromptInput');

      if (title) title.textContent = `AI Pricing & Competitor Intelligence: ${sku.name}`;
      if (input) {
        input.value = `Perform a deep competitor price research and retail pricing optimization for:
SKU: ${sku.name} (Code: ${sku.code})
Supplier/Distributor: ${sku.supplier || 'Standard Distributor'}
Cost Price: RM ${sku.costPrice.toFixed(2)}
Current PMG Standard Selling Price: RM ${sku.standardSp.toFixed(2)}
Supermarket Benchmark (Farley / Emart): ${sku.supermarketPrice ? 'RM ' + sku.supermarketPrice.toFixed(2) : 'N/A'}
Competitor Pharmacy Benchmark (Watsons / Caring / Alpro): ${sku.chainPharmacyPrice ? 'RM ' + sku.chainPharmacyPrice.toFixed(2) : 'N/A'}
Region: Kuching & Padawan, Sarawak, Malaysia (7 Outlets: Kota Sentosa, Matang Jaya, Sungai Moyan, Malihah, Metrocity, Astana, Samariang).

Please advise:
1. Supplier Cost Evaluation: With our cost of RM ${sku.costPrice.toFixed(2)} from ${sku.supplier || 'distributor'}, evaluate if there is margin squeeze or room for volume trade deals/rebates.
2. Is our current PMG standard price competitive against supermarkets and chain pharmacies?
3. Recommended Standardized Area Retail Price to maximize both customer volume and gross margin.
4. Bundle and Basket Building Strategy (what high-margin companion item should be paired with it?).
5. Script for branch counter staff when a customer claims Farley/Emart is cheaper.`;
      }

      if (modal) modal.classList.remove('hidden');
      this.executeAiResearch();
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

Our objective as Area Manager:
1. Defend OTC and prescription volume against nearby hypermarkets and chain pharmacies.
2. Standardize prices with our other 6 branches in Kuching/Padawan without losing local foot traffic.
3. Specific promotional initiatives tailored for this outlet's demographic.
4. Top 3 high-yield cross-selling clinical care opportunities.`;
      }

      if (modal) modal.classList.remove('hidden');
      this.executeAiResearch();
    }

    async executeAiResearch() {
      const resultContainer = document.getElementById('pricingAiResultBox');
      const statusPill = document.getElementById('pricingAiStatus');
      const promptInput = document.getElementById('pricingAiPromptInput');
      const promptText = promptInput ? promptInput.value.trim() : '';

      if (!promptText) return;

      const apiKey = (localStorage.getItem(STORAGE_KEY_GEMINI) || '').trim() ||
                     (typeof PMG_GLOBAL_FALLBACK_KEY !== 'undefined' ? PMG_GLOBAL_FALLBACK_KEY : '');

      if (!apiKey) {
        if (resultContainer) {
          resultContainer.innerHTML = `
            <div class="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs">
              <h4 class="font-bold flex items-center gap-1.5 mb-1"><i class="fa-solid fa-key"></i> Gemini API Key Required (Free Tier)</h4>
              <p class="mb-2">Google provides a <b>100% Free Tier</b> for Gemini 2.5 Flash and 1.5 Flash (up to 1,500 free requests per day, 0 cost). No credit card required!</p>
              <button type="button" onclick="promptUpdateGeminiKey(); window.pmgPricing.executeAiResearch();"
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition">
                Enter Free Gemini Key
              </button>
            </div>
          `;
        }
        return;
      }

      if (resultContainer) {
        resultContainer.innerHTML = `
          <div class="p-8 text-center text-gray-500 text-xs">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl text-purple-600 mb-2 block"></i>
            <span>Evaluating market pricing, hypermarket dynamics, and 7-outlet strategy via Gemini AI…</span>
          </div>
        `;
      }

      if (statusPill) statusPill.textContent = 'Analyzing…';

      // Models to try (Free Tier friendly)
      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash'
      ];

      let responseText = '';
      let usedModel = '';

      for (const m of modelsToTry) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [{ text: promptText }]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
              responseText = text.trim();
              usedModel = m;
              break;
            }
          }
        } catch (e) {
          console.warn(`[PMG Pricing AI] Model ${m} error:`, e);
        }
      }

      if (!responseText) {
        if (resultContainer) {
          resultContainer.innerHTML = `
            <div class="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs">
              <h4 class="font-bold mb-1">AI Request Failed</h4>
              <p>Could not connect to Gemini API. Please verify your free API key or network connection.</p>
            </div>
          `;
        }
        if (statusPill) statusPill.textContent = 'Error';
        return;
      }

      if (statusPill) statusPill.textContent = `Completed (${usedModel})`;

      // Render Markdown-styled response
      const formattedHtml = this.formatMarkdownToHtml(responseText);
      if (resultContainer) {
        resultContainer.innerHTML = `
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

    // ─── EXPORT 7-BRANCH PRICE BROADCAST MEMO ──────────────────────────────────
    exportPriceMemo() {
      let memo = `==========================================================\n`;
      memo += `PMG PHARMACY — AREA MANAGER PRICING MEMORANDUM\n`;
      memo += `UNIFIED 7-OUTLET STANDARDIZED PRICING DIRECTIVE\n`;
      memo += `Authorized by: Area Manager Chai Yee Sian (William)\n`;
      memo += `Date: ${new Date().toLocaleDateString('en-GB')}\n`;
      memo += `Target Branches: Kota Sentosa, Matang Jaya, Sungai Moyan, Malihah, Metrocity, Astana, Samariang\n`;
      memo += `==========================================================\n\n`;

      this.skus.forEach((s, idx) => {
        const margin = this.calculateMargin(s.costPrice, s.standardSp);
        memo += `${idx + 1}. [${s.code}] ${s.name}\n`;
        memo += `   Standard Area SP: RM ${s.standardSp.toFixed(2)} | Cost: RM ${s.costPrice.toFixed(2)} (${s.supplier || 'Distributor'}) | Margin: ${margin}%\n`;
        if (s.supermarketPrice) {
          memo += `   Supermarket Benchmark (Farley/Emart): RM ${s.supermarketPrice.toFixed(2)}\n`;
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
  }

  // ─── GLOBAL INSTANCE & INITIALIZATION ───────────────────────────────────────
  window.pmgPricing = new PricingIntelligenceEngine();

  window.initPricingIntelligence = function() {
    if (window.pmgPricing) {
      window.pmgPricing.render();
    }
  };

})(window);
