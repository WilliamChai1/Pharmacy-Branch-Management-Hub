// js/returns-cn.js — PMG Credit Note, PRN & Delivery Order (DO) Tracker Module
'use strict';

(function(window) {
  const DB_STORE_NAME = 'pmg_returns_cn_db';
  const DB_VERSION = 1;
  const SUPPLIER_WA_CONTACTS_KEY = 'pmg_supplier_wa_contacts_v1';
  const PUBLIC_HUB_FALLBACK_URL = 'https://williamchai1.github.io/Pharmacy-Branch-Management-Hub/';

  // ─── STATE MANAGEMENT ─────────────────────────────────────────────────────────
  let returnsData = [];
  let currentFilter = 'all'; // 'all', 'pending_pickup', 'awaiting_cn', 'completed'
  let currentSearchQuery = '';
  let activeReturnForDo = null;
  let activeReturnForUpload = null;
  let activeReturnForCn = null;
  let activeReturnForEdit = null;
  let activeReturnForReminder = null;
  let editDraftItems = [];
  let dbInstance = null;

  // ─── SUPPLIER & WAREHOUSE DESTINATION PRESETS ─────────────────────────────────
  // Delivery destination address is optional; vendor/transporter decides warehouse
  const DESTINATION_PRESETS = [
    // PMG Branches (In-Transit Transfers)
    {
      name: 'PMG PHARMACY (KOTA SENTOSA)',
      companyName: 'PMG PHARMACY (KOTA SENTOSA) SDN BHD',
      address: 'GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.',
      attn: 'BRANCH PHARMACIST / PIC',
      phone: '082-629888'
    },
    {
      name: 'PMG PHARMACY (MATANG JAYA)',
      companyName: 'PMG PHARMACY (MATANG JAYA) SDN BHD',
      address: 'LOT 694G, BLOCK C, LOT 6798, SYNERGY SQUARE, MATANG JAYA, 93050 KUCHING, SARAWAK.',
      attn: 'BRANCH PHARMACIST / PIC',
      phone: '082-648888'
    },
    {
      name: 'PMG PHARMACY (SUNGAI MOYAN)',
      companyName: 'PMG PHARMACY (SUNGAI MOYAN) SDN BHD',
      address: 'E-1-45, LOT 4568, GROUND FLOOR, BLOCK 10, MLD, GENESIS WALK, JALAN BATU KAWA/MATANG, 93250 KUCHING, SARAWAK.',
      attn: 'BRANCH PHARMACIST / PIC',
      phone: '082-536888'
    },
    {
      name: 'PMG PHARMACY (MALIHAH)',
      companyName: 'PMG PHARMACY (MALIHAH) SDN BHD',
      address: 'NO. 44-45, LOT 4792-4793, GROUND FLOOR, BLOCK 8, MATANG LAND DISTRICT, TAMAN SUNGAI TENGAH VALLEY, BATU 7, JALAN BELATOK, 93050 KUCHING, SARAWAK.',
      attn: 'BRANCH PHARMACIST / PIC',
      phone: '082-528888'
    },
    {
      name: 'PMG PHARMACY (METROCITY)',
      companyName: 'PMG PHARMACY (METROCITY) SDN BHD',
      address: 'LOT 22, METROCITY COMMERCIAL CENTRE, JALAN MATANG, 93050 KUCHING, SARAWAK.',
      attn: 'BRANCH PHARMACIST / PIC',
      phone: '082-513888'
    },
    {
      name: 'PMG PHARMACY (ASTANA)',
      companyName: 'PMG PHARMACY (ASTANA) SDN BHD',
      address: 'LOT 10000, GROUND FLOOR, SECTION 65, KTLD, JALAN ASTANA, PETRA JAYA, 93050 KUCHING, SARAWAK.',
      attn: 'BRANCH PHARMACIST / PIC',
      phone: '082-550888'
    },
    {
      name: 'PMG PHARMACY (SAMARIANG)',
      companyName: 'PMG PHARMACY (SAMARIANG) SDN BHD',
      address: 'GROUND FLOOR, SUBLOT 18, LOT 5587, AREA S3B, BANDAR BARU SAMARIANG, JALAN SULTAN TENGAH, 93050 KUCHING, SARAWAK.',
      attn: 'BRANCH PHARMACIST / PIC',
      phone: '082-512888'
    },
    {
      name: 'PMG CENTRAL WAREHOUSE / HQ',
      companyName: 'PMG HEALTHCARE SDN BHD (CENTRAL WAREHOUSE)',
      address: 'LOT 1234, JALAN SETIA RAJA, MUARA TABUAN LIGHT INDUSTRIAL PARK, 93350 KUCHING, SARAWAK.',
      attn: 'WAREHOUSE LOGISTICS SUPERVISOR',
      phone: '082-368888'
    },
    // External Suppliers & SSJ Warehouse
    {
      name: 'SSJ PHARMA SDN BHD',
      companyName: 'SSJ PHARMA SDN BHD (SCD)',
      address: '',
      attn: 'MR DOUGLAS',
      phone: ''
    },
    {
      name: 'DKSH MALAYSIA SDN BHD',
      companyName: 'DKSH MALAYSIA SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'ZUELLIG PHARMA SDN BHD',
      companyName: 'ZUELLIG PHARMA SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'APEX PHARMACY MARKETING SDN BHD',
      companyName: 'APEX PHARMACY MARKETING SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'SUNWARD PHARMACEUTICAL (M) SDN BHD',
      companyName: 'SUNWARD PHARMACEUTICAL (M) SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'DUOPHARMA (M) SENDIRIAN BERHAD',
      companyName: 'DUOPHARMA (M) SENDIRIAN BERHAD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'KOTRA PHARMA (M) SDN BHD',
      companyName: 'KOTRA PHARMA (M) SDN BHD',
      address: '',
      attn: '',
      phone: ''
    },
    {
      name: 'PHARMANIAGA LOGISTICS SDN BHD',
      companyName: 'PHARMANIAGA LOGISTICS SDN BHD',
      address: '',
      attn: '',
      phone: ''
    }
  ];

  // ─── RETURN REASONS CONFIG (WITH OFFICIAL HQ COLOR COMPLIANCE) ────────────────
  const RETURN_REASONS = [
    {
      value: 'In-Transit',
      label: 'Stock In-Transit (Outlet-to-Outlet)',
      shortLabel: 'IN-TRANSIT',
      bgColor: '#92D050', // Exact HQ Photo 2 Lime Green
      textColor: '#000000',
      borderColor: '#70A638',
      excelBg: 'FF92D050',
      excelFont: 'FF000000',
      template: 'INTERBRANCH'
    },
    {
      value: 'Supplier Recall',
      label: 'Supplier / Product Recall (Urgent to SSJ)',
      shortLabel: 'PRODUCT RECALL',
      bgColor: '#FF0000', // Exact HQ Photo 3 Red
      textColor: '#FFFFFF',
      borderColor: '#990000',
      excelBg: 'FFFF0000',
      excelFont: 'FFFFFFFF',
      template: 'SSJ_RECALL'
    },
    {
      value: 'Slow Moving Stock',
      label: 'Slow Moving / Aging Stock (>1 Yr)',
      shortLabel: 'AGING STOCK > 1 YR',
      bgColor: '#FFC000', // Exact HQ Photo 4 Amber/Gold
      textColor: '#000000',
      borderColor: '#D97706',
      excelBg: 'FFFFC000',
      excelFont: 'FF000000',
      template: 'SSJ_AGING'
    },
    {
      value: 'Near Expiry',
      label: 'Near Expiry',
      shortLabel: 'NEAR EXPIRY',
      bgColor: '#FFF2CC',
      textColor: '#92400E',
      borderColor: '#FCD34D',
      excelBg: 'FFFFF2CC',
      excelFont: 'FF92400E',
      template: 'SSJ_NORMAL'
    },
    {
      value: 'Expired',
      label: 'Expired Stock',
      shortLabel: 'EXPIRED',
      bgColor: '#FEE2E2',
      textColor: '#991B1B',
      borderColor: '#F87171',
      excelBg: 'FFFEE2E2',
      excelFont: 'FF991B1B',
      template: 'SSJ_NORMAL'
    },
    {
      value: 'Damaged Goods',
      label: 'Damaged Goods / Leaking',
      shortLabel: 'DAMAGED',
      bgColor: '#FEE2E2',
      textColor: '#991B1B',
      borderColor: '#F87171',
      excelBg: 'FFFEE2E2',
      excelFont: 'FF991B1B',
      template: 'SSJ_NORMAL'
    },
    {
      value: 'Wrong Delivery',
      label: 'Wrong Delivery / Overstock',
      shortLabel: 'WRONG DLVRY',
      bgColor: '#E0F2FE',
      textColor: '#0369A1',
      borderColor: '#7DD3FC',
      excelBg: 'FFE0F2FE',
      excelFont: 'FF0369A1',
      template: 'SSJ_NORMAL'
    },
    {
      value: 'Other',
      label: 'Other Reasons',
      shortLabel: 'OTHER',
      bgColor: '#F3F4F6',
      textColor: '#374151',
      borderColor: '#D1D5DB',
      excelBg: 'FFF3F4F6',
      excelFont: 'FF374151',
      template: 'SSJ_NORMAL'
    }
  ];

  function getReasonConfig(reasonStr) {
    const str = (reasonStr || '').toLowerCase().trim();
    if (str.includes('transit')) return RETURN_REASONS[0]; // In-Transit
    if (str.includes('recall')) return RETURN_REASONS[1]; // Supplier Recall
    if (str.includes('slow') || str.includes('aging')) return RETURN_REASONS[2]; // Slow Moving / Aging
    if (str.includes('damage') || str.includes('leak')) return RETURN_REASONS[5]; // Damaged Goods
    if (str === 'expired') return RETURN_REASONS[4]; // Expired
    if (str.includes('wrong') || str.includes('overstock')) return RETURN_REASONS[6]; // Wrong Delivery
    if (str.includes('near') || str.includes('expiry')) return RETURN_REASONS[3]; // Near Expiry
    return RETURN_REASONS.find(r => r.value.toLowerCase() === str) || RETURN_REASONS[7];
  }

  // ─── INITIAL SEED DATA ────────────────────────────────────────────────────────
  const SEED_RETURNS = [
  {
    "id": "ret-1793416498055-146",
    "doNumber": "DO-KS-2610-633",
    "branch": "Kota Sentosa",
    "branchCode": "KS01",
    "companyName": "PMG PHARMACY (KOTA SENTOSA) SDN BHD",
    "companyAddress": "GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.",
    "date": "31.10.2026",
    "supplier": "SSJ PHARMA SDN BHD",
    "destCompany": "SSJ PHARMA SDN BHD - sarikei",
    "destAddress": "rtp - lot 1564, lorong 6, jalan rentap, 96100 sarikei, sarawak",
    "destAttn": "MR. CHIONG",
    "destPhone": "",
    "totalCartons": 18,
    "status": "pending_pickup",
    "verifiedBy": "Chai Yee Sian",
    "pickupBy": "",
    "pickupDate": "",
    "signedProof": null,
    "cnNumber": "",
    "cnAmount": 0,
    "cnDate": "",
    "xilnexKeyed": false,
    "xilnexKeyedDate": "",
    "xilnexKeyedBy": "",
    "remarks": "",
    "items": [
      {
        "cartonNo": "1",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "2",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "3",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "4",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "5",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "6",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "7",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "8",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "9",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "10",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "11",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "12",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "13",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "14",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "15",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "16",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "17",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "18",
        "itemCode": "",
        "itemDescription": "GONDOLA RETURN",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "",
        "reason": "Other",
        "batchNo": "",
        "expiryDate": ""
      }
    ],
    "createdAt": "2026-10-31T03:14:58.055Z",
    "updatedAt": "2026-10-31T03:19:39.239Z"
  },
  {
    "id": "ret-1791340215701-423",
    "doNumber": "DO-KS-2610-214",
    "branch": "Kota Sentosa",
    "branchCode": "KS01",
    "companyName": "PMG PHARMACY (KOTA SENTOSA) SDN BHD",
    "companyAddress": "GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.",
    "date": "07.10.2026",
    "supplier": "kwong heng lee",
    "destCompany": "kwong heng lee",
    "destAddress": "",
    "destAttn": "DS",
    "destPhone": "60128119019",
    "totalCartons": 1,
    "status": "awaiting_cn",
    "verifiedBy": "Chai Yee Sian",
    "pickupBy": "DICKSON",
    "pickupDate": "15.10.2026",
    "signedProof": {
      "fileName": "DO-KS-2610-214.jpg",
      "path": "KOTA SENTOSA/DO/2026/10 - October/kwong heng lee/DO-KS-2610-214_Signed_Proof.jpg",
      "oneDriveSynced": true,
      "timestamp": "2026-10-28T07:06:20.043Z"
    },
    "cnNumber": "",
    "cnAmount": 0,
    "cnDate": "",
    "xilnexKeyed": false,
    "xilnexKeyedDate": "",
    "xilnexKeyedBy": "",
    "remarks": "",
    "items": [
      {
        "cartonNo": "1",
        "itemCode": "126607",
        "itemDescription": "VIDA C (BLACKCURRENT) TIN 325ML - VITAMIN C 1000MG",
        "quantity": "19",
        "uom": "UNIT",
        "prnNumber": "74734 - KINV-00033566",
        "reason": "Expired",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "1",
        "itemCode": "118559",
        "itemDescription": "VIDA C (ORANGE) TIN 325ML - VITAMIN C 1000MG",
        "quantity": "22",
        "uom": "UNIT",
        "prnNumber": "74734 - KINV-00033566",
        "reason": "Expired",
        "batchNo": "",
        "expiryDate": ""
      }
    ],
    "createdAt": "2026-10-07T02:30:15.701Z",
    "updatedAt": "2026-10-28T07:06:20.043Z"
  },
  {
    "id": "ret-1791353300582-975",
    "doNumber": "DO-KS-2610-560",
    "branch": "Kota Sentosa",
    "branchCode": "KS01",
    "companyName": "PMG PHARMACY (KOTA SENTOSA) SDN BHD",
    "companyAddress": "GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.",
    "date": "07.10.2026",
    "supplier": "SSJ PHARMA SDN BHD",
    "destCompany": "SSJ PHARMA SDN BHD (SCD)",
    "destAddress": "",
    "destAttn": "MR DOUGLAS",
    "destPhone": "",
    "totalCartons": 1,
    "status": "completed",
    "verifiedBy": "Chai Yee Sian",
    "pickupBy": "KING SUCCESS",
    "pickupDate": "12.10.2026",
    "signedProof": {
      "fileName": "DO-KS-2610-560.pdf",
      "path": "KOTA SENTOSA/DO/2026/10 - October/SSJ PHARMA SDN BHD/DO-KS-2610-560_Signed_Proof.pdf",
      "oneDriveSynced": true,
      "timestamp": "2026-10-13T08:11:57.131Z"
    },
    "cnNumber": "sr126780",
    "cnAmount": 138.1,
    "cnDate": "16.10.2026",
    "xilnexKeyed": true,
    "xilnexKeyedDate": "16.10.2026",
    "xilnexKeyedBy": "Chai Yee Sian",
    "remarks": "",
    "items": [
      {
        "cartonNo": "1",
        "itemCode": "135258 - TUBE",
        "itemDescription": "Y.O.U ACNEPLUS MULTI-ACTION SKIN CREAM 30G",
        "quantity": "2",
        "uom": "BOX",
        "prnNumber": "74735",
        "reason": "Supplier Recall",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "1",
        "itemCode": "135246 - BBOX5",
        "itemDescription": "Y.O.U ACNEPLUS B5 SOOTHING SHEET MASK 5'S",
        "quantity": "3",
        "uom": "BOX",
        "prnNumber": "74735",
        "reason": "Supplier Recall",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "1",
        "itemCode": "135255 - TUBE",
        "itemDescription": "Y.O.U HY! AMINO BYE-BYETERIA ANTI BACTERIAL FACIAL WASH 100G",
        "quantity": "3",
        "uom": "BOX",
        "prnNumber": "74735",
        "reason": "Supplier Recall",
        "batchNo": "",
        "expiryDate": ""
      }
    ],
    "createdAt": "2026-10-07T06:08:20.582Z",
    "updatedAt": "2026-10-16T03:51:01.375Z"
  },
  {
    "id": "ret-1791445897272-509",
    "doNumber": "DO-KS-2610-432",
    "branch": "Kota Sentosa",
    "branchCode": "KS01",
    "companyName": "PMG PHARMACY (KOTA SENTOSA) SDN BHD",
    "companyAddress": "GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.",
    "date": "08.10.2026",
    "supplier": "ZUELLIG PHARMA SDN BHD",
    "destCompany": "ZUELLIG PHARMA SDN BHD",
    "destAddress": "",
    "destAttn": "",
    "destPhone": "",
    "totalCartons": 1,
    "status": "pending_pickup",
    "verifiedBy": "Chai Yee Sian",
    "pickupBy": "",
    "pickupDate": "",
    "signedProof": null,
    "cnNumber": "",
    "cnAmount": 0,
    "cnDate": "",
    "xilnexKeyed": false,
    "xilnexKeyedDate": "",
    "xilnexKeyedBy": "",
    "remarks": "",
    "items": [
      {
        "cartonNo": "1",
        "itemCode": "102405 - BOT130",
        "itemDescription": "BIO-LIFE LIVASIL 100'S+30'S",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "74736",
        "reason": "Near Expiry",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "1",
        "itemCode": "102405 - BOT100",
        "itemDescription": "BIO-LIFE LIVASIL 100'S+30'S",
        "quantity": "1",
        "uom": "BOX",
        "prnNumber": "74736",
        "reason": "Near Expiry",
        "batchNo": "",
        "expiryDate": ""
      }
    ],
    "createdAt": "2026-10-08T07:51:37.272Z",
    "updatedAt": "2026-10-08T07:51:57.831Z"
  },
  {
    "id": "ret-1791879785460-627",
    "doNumber": "DO-KS-2610-245",
    "branch": "Kota Sentosa",
    "branchCode": "KS01",
    "companyName": "PMG PHARMACY (KOTA SENTOSA) SDN BHD",
    "companyAddress": "GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.",
    "date": "13.10.2026",
    "supplier": "SSJ PHARMA SDN BHD",
    "destCompany": "SSJ PHARMA SDN BHD (SCD)",
    "destAddress": "",
    "destAttn": "MR DOUGLAS",
    "destPhone": "",
    "totalCartons": 1,
    "status": "completed",
    "verifiedBy": "Chai Yee Sian",
    "pickupBy": "KING SUCCESS",
    "pickupDate": "19.10.2026",
    "signedProof": {
      "fileName": "DO-KS-2610-245.pdf",
      "path": "KOTA SENTOSA/DO/2026/10 - October/SSJ PHARMA SDN BHD/DO-KS-2610-245_Signed_Proof.pdf",
      "oneDriveSynced": true,
      "timestamp": "2026-10-20T02:22:53.502Z"
    },
    "cnNumber": "SR127038",
    "cnAmount": 168.54,
    "cnDate": "22.10.2026",
    "xilnexKeyed": true,
    "xilnexKeyedDate": "28.10.2026",
    "xilnexKeyedBy": "Chai Yee Sian",
    "remarks": "",
    "items": [
      {
        "cartonNo": "1",
        "itemCode": "102083 - BOX16",
        "itemDescription": "GAVISCON DOUBLE ACTION 250MG TAB 8'SX2",
        "quantity": "3",
        "uom": "BOX",
        "prnNumber": "74737",
        "reason": "Near Expiry",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "1",
        "itemCode": "141583 -BOX24",
        "itemDescription": "GAVISCON LIQUID (PEPPERMINT) 10ML SAC 24'S",
        "quantity": "1",
        "uom": "BOX",
        "prnNumber": "74737",
        "reason": "Expired",
        "batchNo": "",
        "expiryDate": ""
      },
      {
        "cartonNo": "1",
        "itemCode": "100489 - BOT",
        "itemDescription": "SOLUWAX EAR DROPS 10ML BOT",
        "quantity": "2",
        "uom": "UNIT",
        "prnNumber": "74737",
        "reason": "Near Expiry",
        "batchNo": "",
        "expiryDate": ""
      }
    ],
    "createdAt": "2026-10-13T08:23:05.460Z",
    "updatedAt": "2026-10-28T07:09:03.798Z"
  },
  {
    "id": "ret-1791880755586-686",
    "doNumber": "DO-KS-2610-340",
    "branch": "Kota Sentosa",
    "branchCode": "KS01",
    "companyName": "PMG PHARMACY (KOTA SENTOSA) SDN BHD",
    "companyAddress": "GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.",
    "date": "13.10.2026",
    "supplier": "ZUELLIG PHARMA SDN BHD",
    "destCompany": "ZUELLIG PHARMA SDN BHD",
    "destAddress": "",
    "destAttn": "",
    "destPhone": "",
    "totalCartons": 1,
    "status": "pending_pickup",
    "verifiedBy": "Chai Yee Sian",
    "pickupBy": "",
    "pickupDate": "",
    "signedProof": null,
    "cnNumber": "",
    "cnAmount": 0,
    "cnDate": "",
    "xilnexKeyed": false,
    "xilnexKeyedDate": "",
    "xilnexKeyedBy": "",
    "remarks": "",
    "items": [
      {
        "cartonNo": "1",
        "itemCode": "104853 - BOX",
        "itemDescription": "SENSODYNE REPAIR & PROTECT 100G",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "74738",
        "reason": "Expired",
        "batchNo": "",
        "expiryDate": ""
      }
    ],
    "createdAt": "2026-10-13T08:39:15.586Z",
    "updatedAt": "2026-10-13T08:39:15.586Z"
  },
  {
    "id": "ret-1792562282660-78",
    "doNumber": "DO-KS-2610-293",
    "branch": "Kota Sentosa",
    "branchCode": "KS01",
    "companyName": "PMG PHARMACY (KOTA SENTOSA) SDN BHD",
    "companyAddress": "GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.",
    "date": "21.10.2026",
    "supplier": "EASTERN FOREVER SDN BHD",
    "destCompany": "EASTERN FOREVER SDN BHD",
    "destAddress": "",
    "destAttn": "CHONG",
    "destPhone": "601125089879",
    "totalCartons": 1,
    "status": "pending_pickup",
    "verifiedBy": "Chai Yee Sian",
    "pickupBy": "",
    "pickupDate": "",
    "signedProof": null,
    "cnNumber": "",
    "cnAmount": 0,
    "cnDate": "",
    "xilnexKeyed": false,
    "xilnexKeyedDate": "",
    "xilnexKeyedBy": "",
    "remarks": "",
    "items": [
      {
        "cartonNo": "1",
        "itemCode": "122889 - TUBE",
        "itemDescription": "WRIGLEY'S DOUBLEMINT MINT CANDY (LEMON) 30G",
        "quantity": "2",
        "uom": "UNIT",
        "prnNumber": "74739",
        "reason": "Expired",
        "batchNo": "",
        "expiryDate": ""
      }
    ],
    "createdAt": "2026-10-21T05:58:02.660Z",
    "updatedAt": "2026-10-21T05:58:02.660Z"
  },
  {
    "id": "ret-1792629630385-931",
    "doNumber": "DO-KS-2610-423",
    "branch": "Kota Sentosa",
    "branchCode": "KS01",
    "companyName": "PMG PHARMACY (KOTA SENTOSA) SDN BHD",
    "companyAddress": "GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.",
    "date": "22.10.2026",
    "supplier": "CHOON HUA TRADING CORPORATION",
    "destCompany": "CHOON HUA TRADING CORPORATION",
    "destAddress": "",
    "destAttn": "ANGELA",
    "destPhone": "60128118310",
    "totalCartons": 1,
    "status": "awaiting_cn",
    "verifiedBy": "Chai Yee Sian",
    "pickupBy": "ANTHONY",
    "pickupDate": "24.10.2026",
    "signedProof": {
      "fileName": "DO-KS-2610-423.pdf",
      "path": "KOTA SENTOSA/DO/2026/10 - October/CHOON HUA TRADING CORPORATION/DO-KS-2610-423_Signed_Proof.pdf",
      "oneDriveSynced": true,
      "timestamp": "2026-10-27T08:27:55.538Z"
    },
    "cnNumber": "",
    "cnAmount": 0,
    "cnDate": "",
    "xilnexKeyed": false,
    "xilnexKeyedDate": "",
    "xilnexKeyedBy": "",
    "remarks": "",
    "items": [
      {
        "cartonNo": "1",
        "itemCode": "-",
        "itemDescription": "ORIENTAL HIMALAYAN SALT WHITE COFFEE 38G X 10S X 20EA",
        "quantity": "3",
        "uom": "BOX",
        "prnNumber": "74743",
        "reason": "Wrong Delivery",
        "batchNo": "",
        "expiryDate": ""
      }
    ],
    "createdAt": "2026-10-22T00:40:30.386Z",
    "updatedAt": "2026-10-27T08:27:55.538Z"
  },
  {
    "id": "ret-1793233485459-300",
    "doNumber": "DO-KS-2610-323",
    "branch": "Kota Sentosa",
    "branchCode": "KS01",
    "companyName": "PMG PHARMACY (KOTA SENTOSA) SDN BHD",
    "companyAddress": "GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.",
    "date": "29.10.2026",
    "supplier": "SSJ PHARMA SDN BHD",
    "destCompany": "SSJ PHARMA SDN BHD (SCD)",
    "destAddress": "",
    "destAttn": "MR DOUGLAS",
    "destPhone": "",
    "totalCartons": 1,
    "status": "pending_pickup",
    "verifiedBy": "Chai Yee Sian",
    "pickupBy": "",
    "pickupDate": "",
    "signedProof": null,
    "cnNumber": "",
    "cnAmount": 0,
    "cnDate": "",
    "xilnexKeyed": false,
    "xilnexKeyedDate": "",
    "xilnexKeyedBy": "",
    "remarks": "NO NEED TO SEND PHYSICAL STOCK",
    "items": [
      {
        "cartonNo": "1",
        "itemCode": "139152",
        "itemDescription": "VICTORIA V2016-PC (2.50) PC FRAME READING",
        "quantity": "1",
        "uom": "UNIT",
        "prnNumber": "104103",
        "reason": "Damaged Goods",
        "batchNo": "",
        "expiryDate": ""
      }
    ],
    "createdAt": "2026-10-29T00:24:45.460Z",
    "updatedAt": "2026-10-29T00:24:45.460Z"
  }
];

  // ─── INDEXEDDB HELPERS ────────────────────────────────────────────────────────
  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (dbInstance) return resolve(dbInstance);
      const req = indexedDB.open('pmg_returns_db', DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
          const store = db.createObjectStore(DB_STORE_NAME, { keyPath: 'id' });
          store.createIndex('branch', 'branch', { unique: false });
          store.createIndex('doNumber', 'doNumber', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
      req.onsuccess = () => {
        dbInstance = req.result;
        resolve(dbInstance);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function loadReturnsFromDb() {
    try {
      const db = await openDatabase();
      const hasSeeded = localStorage.getItem('pmg_returns_seeded') === 'true';
      const deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_returns') || '["ret-ks-2609-002", "ret-lnd-2609-001"]');

      return new Promise((resolve) => {
        const tx = db.transaction(DB_STORE_NAME, 'readonly');
        const store = tx.objectStore(DB_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          let list = (req.result || []).filter(r => !deletedIds.includes(r.id));
          if (list.length === 0 && !hasSeeded) {
            // Seed initial data once
            localStorage.setItem('pmg_returns_seeded', 'true');
            const cleanSeed = SEED_RETURNS.filter(r => !deletedIds.includes(r.id));
            saveAllReturnsToDb(cleanSeed).then(() => {
              localStorage.setItem('pmg_returns_records_v1', JSON.stringify(cleanSeed));
              resolve(cleanSeed);
            });
          } else {
            // Purge deleted records from DB store if any remained
            if (deletedIds.length > 0 && req.result && req.result.length > 0) {
              deletedIds.forEach(did => deleteReturnFromDb(did));
            }
            localStorage.setItem('pmg_returns_records_v1', JSON.stringify(list));
            resolve(list);
          }
        };
        req.onerror = () => resolve([]);
      });
    } catch (err) {
      console.warn('[PMG Returns] DB error:', err);
      return [];
    }
  }

  async function saveAllReturnsToDb(list) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(DB_STORE_NAME);
        store.clear();
        list.forEach(item => store.put(item));
        tx.oncomplete = () => {
          localStorage.setItem('pmg_returns_records_v1', JSON.stringify(list));
          resolve(true);
        };
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[PMG Returns] Save DB error:', err);
      return false;
    }
  }

  async function saveSingleReturnToDb(retItem) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(DB_STORE_NAME);
        store.put(retItem);
        tx.oncomplete = () => {
          localStorage.setItem('pmg_returns_records_v1', JSON.stringify(returnsData));
          resolve(true);
        };
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[PMG Returns] Save single DB error:', err);
      return false;
    }
  }

  async function deleteReturnFromDb(retId) {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(DB_STORE_NAME);
        store.delete(retId);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[PMG Returns] Delete DB error:', err);
      return false;
    }
  }

  // ─── LOCAL DO/PRN PROOF BINARY CACHE (DEDICATED IDB — ZERO LOCALSTORAGE BLOAT) ─
  const PROOF_BLOBS_DB_NAME = 'pmg_returns_proof_blobs_db';
  const PROOF_BLOBS_STORE = 'proof_blobs';
  let proofBlobsDbInstance = null;
  const inMemoryProofBlobCache = new Map();

  function openProofBlobsDb() {
    return new Promise((resolve, reject) => {
      if (proofBlobsDbInstance) return resolve(proofBlobsDbInstance);
      if (typeof indexedDB === 'undefined' || !indexedDB || typeof indexedDB.open !== 'function') {
        return reject(new Error('IndexedDB unavailable'));
      }
      const req = indexedDB.open(PROOF_BLOBS_DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (db && db.objectStoreNames && !db.objectStoreNames.contains(PROOF_BLOBS_STORE)) {
          db.createObjectStore(PROOF_BLOBS_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => {
        proofBlobsDbInstance = req.result;
        resolve(proofBlobsDbInstance);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function saveLocalProofDocsToIdb(returnId, docsList) {
    if (!returnId || !Array.isArray(docsList) || docsList.length === 0) return false;
    const cleanDocs = docsList
      .filter(d => d && d.dataUrl)
      .map(d => ({
        fileName: d.fileName || 'DO_Proof',
        mimeType: d.mimeType || 'application/octet-stream',
        size: Number(d.size) || String(d.dataUrl).length,
        dataUrl: String(d.dataUrl),
        field: d.field || 'signedDoProof'
      }));
    if (cleanDocs.length === 0) return false;
    inMemoryProofBlobCache.set(returnId, cleanDocs);
    try {
      const db = await openProofBlobsDb();
      return await new Promise((resolve) => {
        const tx = db.transaction(PROOF_BLOBS_STORE, 'readwrite');
        const store = tx.objectStore(PROOF_BLOBS_STORE);
        store.put({ id: returnId, docs: cleanDocs, updatedAt: new Date().toISOString() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (_) {
      return true;
    }
  }

  async function loadLocalProofDocsFromIdb(returnId) {
    if (!returnId) return [];
    if (inMemoryProofBlobCache.has(returnId)) {
      return inMemoryProofBlobCache.get(returnId) || [];
    }
    try {
      const db = await openProofBlobsDb();
      return await new Promise((resolve) => {
        const tx = db.transaction(PROOF_BLOBS_STORE, 'readonly');
        const store = tx.objectStore(PROOF_BLOBS_STORE);
        const req = store.get(returnId);
        req.onsuccess = () => {
          const docs = (req.result && Array.isArray(req.result.docs)) ? req.result.docs : [];
          if (docs.length > 0) inMemoryProofBlobCache.set(returnId, docs);
          resolve(docs);
        };
        req.onerror = () => resolve([]);
      });
    } catch (_) {
      return [];
    }
  }

  function mergeSignedProofMetadata(primaryProof, secondaryProof) {
    if (!primaryProof && !secondaryProof) return null;
    if (!primaryProof) return JSON.parse(JSON.stringify(secondaryProof));
    if (!secondaryProof) return JSON.parse(JSON.stringify(primaryProof));

    const pFile = String(primaryProof.fileName || '').trim().toLowerCase();
    const sFile = String(secondaryProof.fileName || '').trim().toLowerCase();
    const pPath = String(primaryProof.path || '').trim().toLowerCase();
    const sPath = String(secondaryProof.path || '').trim().toLowerCase();
    const pTime = String(primaryProof.timestamp || '');
    const sTime = String(secondaryProof.timestamp || '');
    const sameUnderlyingFile = (pFile && sFile && pFile === sFile) || (pPath && sPath && pPath === sPath) || !pFile || !sFile;
    const merged = { ...secondaryProof, ...primaryProof };

    // Never lose cloudDocId when merging with an older/OneDrive metadata snapshot of the same proof file
    if (!merged.cloudDocId && secondaryProof.cloudDocId && (sameUnderlyingFile || !pTime || sTime >= pTime)) {
      merged.cloudDocId = secondaryProof.cloudDocId;
      merged.cloudFileUrl = secondaryProof.cloudFileUrl || merged.cloudFileUrl || '';
      merged.mimeType = merged.mimeType || secondaryProof.mimeType || '';
    }
    if ((!Array.isArray(merged.additionalDocs) || merged.additionalDocs.length === 0) && Array.isArray(secondaryProof.additionalDocs) && secondaryProof.additionalDocs.length > 0 && sameUnderlyingFile) {
      merged.additionalDocs = JSON.parse(JSON.stringify(secondaryProof.additionalDocs));
    }
    if ((!merged.path || String(merged.path).startsWith('Local_')) && secondaryProof.path && !String(secondaryProof.path).startsWith('Local_')) {
      merged.path = secondaryProof.path;
    }
    if (!merged.oneDriveSynced && secondaryProof.oneDriveSynced) {
      merged.oneDriveSynced = true;
    }
    return merged;
  }

  function countCloudDocIdsOnProof(proof) {
    if (!proof) return 0;
    let count = proof.cloudDocId ? 1 : 0;
    if (Array.isArray(proof.additionalDocs)) {
      count += proof.additionalDocs.filter(d => d && d.cloudDocId).length;
    }
    return count;
  }

  // ─── ONEDRIVE SYNC INTEGRATION ───────────────────────────────────────────────
  async function syncReturnsWithOneDrive(targetBranch) {
    // 1. Delegate to central OneDriveSyncEngine if available for bidirectional sync
    if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.syncReturnsWithOneDrive === 'function') {
      try {
        await window.pmgOneDriveSync.syncReturnsWithOneDrive(true);
        renderReturnsUI();
        autoBackfillMissingCloudProofs({ interactive: false }).catch(() => {});
        return;
      } catch (err) {
        console.warn('[PMG Returns] Central OneDrive sync delegate note:', err);
      }
    }

    if (!window.pmgOneDriveSync || typeof window.pmgOneDriveSync.saveReturnsDatabaseToOneDrive !== 'function') {
      return;
    }

    try {
      const branch = targetBranch || getActiveBranchName();
      const deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_returns') || '["ret-ks-2609-002", "ret-lnd-2609-001"]');

      // 1. Check if OneDrive has cloud data
      const cloudData = await window.pmgOneDriveSync.loadReturnsDatabaseFromOneDrive(branch);
      if (Array.isArray(cloudData) && cloudData.length > 0) {
        // Filter out any tombstoned deleted IDs
        const cleanCloud = cloudData.filter(r => !deletedIds.includes(r.id));
        const map = new Map();
        returnsData.filter(r => !deletedIds.includes(r.id)).forEach(r => map.set(r.id, r));
        cleanCloud.forEach(r => {
          if (map.has(r.id)) {
            const loc = map.get(r.id);
            const locT = loc.updatedAt || loc.createdAt || '';
            const cldT = r.updatedAt || r.createdAt || '';
            if (cldT > locT) {
              const mergedProof = mergeSignedProofMetadata(r.signedProof, loc.signedProof);
              map.set(r.id, { ...loc, ...r, ...(mergedProof ? { signedProof: mergedProof } : {}) });
            } else {
              const mergedProof = mergeSignedProofMetadata(loc.signedProof, r.signedProof);
              map.set(r.id, { ...r, ...loc, ...(mergedProof ? { signedProof: mergedProof } : {}) });
            }
          } else {
            map.set(r.id, r);
          }
        });
        returnsData = Array.from(map.values());
        await saveAllReturnsToDb(returnsData);
        try { localStorage.setItem('pmg_returns_records_v1', JSON.stringify(returnsData)); } catch (_) {}
        renderReturnsUI();
      }

      // 2. Push current state back to OneDrive
      const branchOnlyData = returnsData.filter(r => (r.branch || '').toUpperCase() === branch.toUpperCase() && !deletedIds.includes(r.id));
      await window.pmgOneDriveSync.saveReturnsDatabaseToOneDrive(branch, branchOnlyData);
      console.log(`[PMG Returns] Synced returns with OneDrive for ${branch}`);
      autoBackfillMissingCloudProofs({ interactive: false }).catch(() => {});
    } catch (err) {
      console.warn('[PMG Returns] OneDrive sync skipped:', err);
    }
  }

  // ─── GOOGLE SHEETS LIVE CLOUD SYNC (FOR MOBILE, LAPTOP & COUNTER PCS) ──────────
  const PMG_SCHEDULE_API_URL = (typeof window !== 'undefined' && window.PMG_SCHEDULE_API_URL) || 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';

  function normalizeBranchForSheets(branch) {
    if (!branch) return 'Kota Sentosa';
    const s = String(branch).trim();
    const up = s.toUpperCase();
    if (up === 'KS01' || up === 'KS' || up.includes('SENTOSA')) return 'Kota Sentosa';
    if (typeof BRANCHES !== 'undefined' && Array.isArray(BRANCHES)) {
      const match = BRANCHES.find(b => b.code.toUpperCase() === up || b.name.toUpperCase() === up);
      if (match) return match.name;
    }
    return s;
  }

  function doesReturnBranchMatch(itemBranch, filterBranch) {
    if (!filterBranch || filterBranch === 'ALL') return true;
    const fNorm = normalizeBranchForSheets(filterBranch).toUpperCase();
    const bNorm = normalizeBranchForSheets(itemBranch).toUpperCase();
    return fNorm === bNorm;
  }

  async function syncReturnsWithGoogleSheets(targetBranch, forcePush = false) {
    if (!PMG_SCHEDULE_API_URL) return;
    const rawBranch = targetBranch || getActiveBranchName() || 'Kota Sentosa';
    const branchName = normalizeBranchForSheets(rawBranch);
    const returnsVaultKey = `PMG_RETURNS_VAULT_${branchName}`;
    try {
      // 1. Read from dedicated returns vault row first, falling back to legacy branch schedule row if vault is empty
      let data = null;
      try {
        const vRes = await fetch(`${PMG_SCHEDULE_API_URL}?branch=${encodeURIComponent(returnsVaultKey)}`);
        if (vRes.ok) {
          const vData = await vRes.json();
          if (vData && vData.success && vData.schedule && Array.isArray(vData.schedule.branchReturns)) {
            data = vData;
          }
        }
      } catch (_) {}

      if (!data) {
        const res = await fetch(`${PMG_SCHEDULE_API_URL}?branch=${encodeURIComponent(branchName)}`);
        if (res.ok) data = await res.json();
      }

      // Merge cloud-saved supplier WhatsApp contacts if present
      if (data && data.success && data.schedule && data.schedule.supplierWaContacts && typeof data.schedule.supplierWaContacts === 'object') {
        try {
          const localContacts = loadSupplierWaContacts();
          const mergedContacts = { ...data.schedule.supplierWaContacts, ...localContacts };
          localStorage.setItem(SUPPLIER_WA_CONTACTS_KEY, JSON.stringify(mergedContacts));
        } catch (_) {}
      }

      const deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_returns') || '["ret-ks-2609-002", "ret-lnd-2609-001"]');
      let changed = false;

      if (data && data.success && data.schedule && Array.isArray(data.schedule.branchReturns)) {
        const cloudReturns = data.schedule.branchReturns.filter(r => r && r.id && !deletedIds.includes(r.id));
        const map = new Map();
        returnsData.filter(r => !deletedIds.includes(r.id)).forEach(r => map.set(r.id, r));

        cloudReturns.forEach(r => {
          if (map.has(r.id)) {
            const loc = map.get(r.id);
            const locT = loc.updatedAt || loc.createdAt || '';
            const cldT = r.updatedAt || r.createdAt || '';
            if (cldT > locT) {
              const mergedProof = mergeSignedProofMetadata(r.signedProof, loc.signedProof);
              map.set(r.id, { ...loc, ...r, ...(mergedProof ? { signedProof: mergedProof } : {}) });
              changed = true;
            } else if (countCloudDocIdsOnProof(r.signedProof) > countCloudDocIdsOnProof(loc.signedProof)) {
              const mergedProof = mergeSignedProofMetadata(loc.signedProof, r.signedProof);
              map.set(r.id, { ...loc, signedProof: mergedProof });
              changed = true;
            }
          } else {
            map.set(r.id, r);
            changed = true;
          }
        });

        if (changed || returnsData.length === 0) {
          returnsData = Array.from(map.values());
          await saveAllReturnsToDb(returnsData);
          try { localStorage.setItem('pmg_returns_records_v1', JSON.stringify(returnsData)); } catch (lsErr) { console.warn('[PMG Returns] localStorage quota warning:', lsErr); }
          renderReturnsUI();
        }
      }

      // 2. Push returns exclusively to dedicated PMG_RETURNS_VAULT_<branch> row (never bloat PharmacistSchedule cell)
      if (returnsData.length > 0 || forcePush) {
        const existingCloudReturns = (data && data.schedule && Array.isArray(data.schedule.branchReturns)) ? data.schedule.branchReturns : [];
        const cloudById = new Map(existingCloudReturns.filter(r => r && r.id).map(r => [r.id, r]));
        const hasLocalNewOrNewer = returnsData.some(loc => {
          const cld = cloudById.get(loc.id);
          if (!cld) return true;
          const locT = loc.updatedAt || loc.createdAt || '';
          const cldT = cld.updatedAt || cld.createdAt || '';
          if (locT > cldT) return true;
          if (countCloudDocIdsOnProof(loc.signedProof) > countCloudDocIdsOnProof(cld.signedProof)) return true;
          if ((loc.cnReminderCount || 0) > (cld.cnReminderCount || 0)) return true;
          return false;
        });

        if (forcePush || hasLocalNewOrNewer || changed) {
          const vaultSched = {
            branchCode: branchName,
            branchReturns: returnsData,
            supplierWaContacts: loadSupplierWaContacts(),
            lastUpdated: new Date().toISOString()
          };
          await fetch(PMG_SCHEDULE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              branch: returnsVaultKey,
              schedule: vaultSched,
              updatedBy: getCurrentUserDisplayName() || 'Pharmacist'
            }),
            redirect: 'follow'
          });
          console.log(`[PMG Returns] Synced ${returnsData.length} returns with dedicated Google Cloud vault (${returnsVaultKey})`);
        }
      }
    } catch (err) {
      console.warn('[PMG Returns] Google Sheets cloud sync note:', err.message);
    }
  }

  async function onCloudSync(incomingData) {
    if (!Array.isArray(incomingData)) return;
    const deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_returns') || '["ret-ks-2609-002", "ret-lnd-2609-001"]');
    const existingById = new Map((returnsData || []).filter(r => r && r.id).map(r => [r.id, r]));
    const clean = incomingData
      .filter(r => r && r.id && !deletedIds.includes(r.id))
      .map(r => {
        const prev = existingById.get(r.id);
        if (!prev) return r;
        const mergedProof = mergeSignedProofMetadata(r.signedProof, prev.signedProof);
        return mergedProof ? { ...r, signedProof: mergedProof } : r;
      });
    returnsData = clean;
    await saveAllReturnsToDb(clean);
    try { localStorage.setItem('pmg_returns_records_v1', JSON.stringify(clean)); } catch (_) {}
    renderReturnsUI();
  }

  function getReturnsData() {
    return returnsData || [];
  }

  async function setReturnsData(data) {
    if (!Array.isArray(data)) return;
    returnsData = data;
    await saveAllReturnsToDb(data);
    try { localStorage.setItem('pmg_returns_records_v1', JSON.stringify(data)); } catch (_) {}
    renderReturnsUI();
  }

  // ─── BRANCH HELPERS ──────────────────────────────────────────────────────────
  function getActiveBranchName() {
    const session = typeof getSession === 'function' ? getSession() : null;
    const filterEl = document.getElementById('returnsBranchFilter');
    if (filterEl && filterEl.value) {
      return filterEl.value;
    }
    if (session && session.branch && session.branch !== 'ALL') {
      return session.branch;
    }
    return 'Kota Sentosa';
  }

  function getBranchDetails(branchName) {
    const bName = (branchName || '').trim();
    if (typeof BRANCHES !== 'undefined' && Array.isArray(BRANCHES)) {
      const match = BRANCHES.find(b => 
        (b.name || '').toUpperCase() === bName.toUpperCase() ||
        (b.code || '').toUpperCase() === bName.toUpperCase()
      );
      if (match) {
        return {
          name: match.name,
          code: match.code,
          companyName: match.companyName || `PMG PHARMACY (${match.name.toUpperCase()}) SDN BHD`,
          address: match.address || 'SARAWAK, MALAYSIA.'
        };
      }
    }
    const fallbackAddresses = {
      'Kota Sentosa': 'GROUND FLOOR, NO. 7, LOT 39, BLOCK 233, KNLD, 7TH MILE BAZAAR, PENRISSEN ROAD, 93250 KUCHING, SARAWAK.',
      'Matang Jaya': 'LOT 694G, BLOCK C, LOT 6798, SYNERGY SQUARE, MATANG JAYA, 93050 KUCHING, SARAWAK.',
      'Sungai Moyan': 'E-1-45, LOT 4568, GROUND FLOOR, BLOCK 10, MLD, GENESIS WALK, JALAN BATU KAWA/MATANG, 93250 KUCHING, SARAWAK.',
      'Malihah': 'NO. 44-45, LOT 4792-4793, GROUND FLOOR, BLOCK 8, MATANG LAND DISTRICT, TAMAN SUNGAI TENGAH VALLEY, BATU 7, JALAN BELATOK, 93050 KUCHING, SARAWAK.',
      'Metrocity': 'LOT 22, METROCITY COMMERCIAL CENTRE, JALAN MATANG, 93050 KUCHING, SARAWAK.',
      'Astana': 'LOT 10000, GROUND FLOOR, SECTION 65, KTLD, JALAN ASTANA, PETRA JAYA, 93050 KUCHING, SARAWAK.',
      'Samariang': 'GROUND FLOOR, SUBLOT 18, LOT 5587, AREA S3B, BANDAR BARU SAMARIANG, JALAN SULTAN TENGAH, 93050 KUCHING, SARAWAK.'
    };
    return {
      name: bName || 'Kota Sentosa',
      code: 'KS01',
      companyName: `PMG PHARMACY (${bName.toUpperCase()}) SDN BHD`,
      address: fallbackAddresses[bName] || 'SARAWAK, MALAYSIA.'
    };
  }

  // ─── INITIALIZATION ──────────────────────────────────────────────────────────
  async function initReturnsModule() {
    returnsData = await loadReturnsFromDb();
    populateReturnsBranchFilter();
    renderReturnsUI();

    // 1. Live Google Sheets Cloud Sync (Instant on Mobile, Laptop & Counter PC)
    setTimeout(() => {
      syncReturnsWithGoogleSheets(getActiveBranchName())
        .then(() => autoBackfillMissingCloudProofs({ interactive: false }))
        .catch(() => {});
    }, 400);

    // 2. Trigger OneDrive cloud sync in background if on desktop
    setTimeout(() => {
      syncReturnsWithOneDrive(getActiveBranchName());
    }, 1500);
  }

  function populateReturnsBranchFilter() {
    const select = document.getElementById('returnsBranchFilter');
    if (!select) return;

    const session = typeof getSession === 'function' ? getSession() : null;
    const isAM = session?.role === 'AM';

    select.innerHTML = '';
    if (isAM) {
      const allOpt = document.createElement('option');
      allOpt.value = '';
      allOpt.textContent = 'All Branches';
      select.appendChild(allOpt);
    }

    if (typeof BRANCHES !== 'undefined' && Array.isArray(BRANCHES)) {
      BRANCHES.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.name;
        opt.textContent = `${b.code} – ${b.name}`;
        if (!isAM && session?.branch && (session.branch === b.name || session.branch === b.code)) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    }

    if (!isAM && session?.branch && session.branch !== 'ALL') {
      select.value = session.branch;
      select.disabled = true;
    }
  }

  // ─── UI RENDERING ────────────────────────────────────────────────────────────
  function renderReturnsUI() {
    renderReturnsSummaryCards();
    renderReturnsTable();
  }

  function renderReturnsSummaryCards() {
    const branchFilter = document.getElementById('returnsBranchFilter')?.value || '';
    const filtered = branchFilter 
      ? returnsData.filter(r => doesReturnBranchMatch(r.branch, branchFilter))
      : returnsData;

    const totalActive = filtered.length;
    const pendingPickup = filtered.filter(r => r.status === 'pending_pickup').length;
    const awaitingCn = filtered.filter(r => r.status === 'awaiting_cn').length;
    const completed = filtered.filter(r => r.status === 'completed').length;

    const elTotal = document.getElementById('returnsTotalCount');
    const elPending = document.getElementById('returnsPendingPickupCount');
    const elAwaiting = document.getElementById('returnsAwaitingCnCount');
    const elCompleted = document.getElementById('returnsCompletedCount');

    if (elTotal) elTotal.textContent = totalActive;
    if (elPending) elPending.textContent = pendingPickup;
    if (elAwaiting) elAwaiting.textContent = awaitingCn;
    if (elCompleted) elCompleted.textContent = completed;
  }

  function renderReturnsTable() {
    const tbody = document.getElementById('returnsTableBody');
    if (!tbody) return;

    const branchFilter = (document.getElementById('returnsBranchFilter')?.value || '').trim();
    const query = (currentSearchQuery || '').trim().toLowerCase();

    const filtered = returnsData.filter(r => {
      // 1. Branch filter
      if (branchFilter && !doesReturnBranchMatch(r.branch, branchFilter)) {
        return false;
      }
      // 2. Status tab filter
      if (currentFilter !== 'all' && r.status !== currentFilter) {
        return false;
      }
      // 3. Search query (Search by Item Name, PRN Number, Item Code, DO Number, Supplier)
      if (query) {
        const matchesDo = (r.doNumber || '').toLowerCase().includes(query);
        const matchesSupplier = (r.supplier || '').toLowerCase().includes(query);
        const matchesBranch = (r.branch || '').toLowerCase().includes(query);
        const matchesCn = (r.cnNumber || '').toLowerCase().includes(query);
        const matchesItems = (r.items || []).some(item => 
          (item.itemCode || '').toLowerCase().includes(query) ||
          (item.itemDescription || '').toLowerCase().includes(query) ||
          (item.prnNumber || '').toLowerCase().includes(query) ||
          (item.reason || '').toLowerCase().includes(query)
        );
        return matchesDo || matchesSupplier || matchesBranch || matchesCn || matchesItems;
      }
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-10 text-gray-400">
            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400">
              <i class="fa-solid fa-box-open text-xl"></i>
            </div>
            <p class="text-sm font-semibold">No stock return or credit note records found.</p>
            <p class="text-xs text-gray-400 mt-1">Click <b>+ New Return / Compound DO</b> to create your first delivery order.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(ret => {
      // Calculate PRN badges
      const prnSet = new Set((ret.items || []).map(i => i.prnNumber).filter(Boolean));
      const prnBadges = Array.from(prnSet).map(prn => 
        `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
          ${escapeHtml(prn)}
        </span>`
      ).join(' ');

      // Status Badge
      let statusBadge = '';
      if (ret.status === 'pending_pickup') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
          <i class="fa-solid fa-clock"></i> Pending Pickup
        </span>`;
      } else if (ret.status === 'awaiting_cn') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
          <i class="fa-solid fa-truck-fast"></i> Awaiting CN
        </span>`;
      } else if (ret.status === 'completed') {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <i class="fa-solid fa-circle-check"></i> Keyed in Xilnex
        </span>`;
      }

      const isTransferOrTransit = isStockTransferOrTransit(ret);
      const canRemindCn = isEligibleForCnReminder(ret);

      // Signed Proof status
      let proofBadge = '';
      if (ret.signedProof && ret.signedProof.fileName) {
        const hasCloudDoc = Boolean(ret.signedProof.cloudDocId);
        proofBadge = `<button onclick="pmgReturns.viewSignedProof('${ret.id}')" title="View DO + PRN proof: ${escapeHtml(ret.signedProof.fileName)}" class="text-xs text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer">
          <i class="fa-solid ${hasCloudDoc ? 'fa-cloud-arrow-down' : 'fa-file-shield'}"></i> ${hasCloudDoc ? 'Proof Link Ready' : 'Proof Attached'}
        </button>`;
      } else {
        proofBadge = `<span class="text-[11px] text-gray-400 italic">No proof yet</span>`;
      }

      // Credit Note info
      let cnDisplay = '';
      if (ret.cnNumber) {
        cnDisplay = `
          <div class="font-mono text-xs font-bold text-gray-800">${escapeHtml(ret.cnNumber)}</div>
          <div class="text-[11px] text-emerald-600 font-semibold">RM ${(Number(ret.cnAmount) || 0).toFixed(2)}</div>
        `;
      } else if (isTransferOrTransit) {
        cnDisplay = `<span class="text-[11px] text-slate-400 italic">No CN (Transfer/Transit)</span>`;
      } else {
        const remCount = Number(ret.cnReminderCount) || 0;
        const remDateStr = ret.lastCnReminderAt ? new Date(ret.lastCnReminderAt).toLocaleDateString('en-MY', { day: '2-digit', month: 'short' }) : '';
        cnDisplay = `
          <div class="text-xs text-amber-600 font-medium italic">Pending supplier</div>
          ${remCount > 0 ? `<div class="text-[10px] text-emerald-700 font-semibold mt-0.5"><i class="fa-brands fa-whatsapp"></i> Reminded ${remCount}x${remDateStr ? ` (${escapeHtml(remDateStr)})` : ''}</div>` : ''}
        `;
      }

      // SKU summary preview
      const itemCount = (ret.items || []).length;
      const firstItem = ret.items && ret.items[0] ? ret.items[0].itemDescription : '';
      const safeFirstItem = escapeHtml(firstItem);
      const itemPreview = itemCount > 1 ? `${safeFirstItem} <b class="text-blue-600">+${itemCount - 1} more</b>` : safeFirstItem;
      const safeRetIdAttr = escapeHtml(String(ret.id || '')).replace(/'/g, '&#39;');

      // Check reasons for color-compliant badges
      const hasTransit = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('transit'));
      const hasRecall = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('recall'));
      const hasAging = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('slow') || (it.reason || '').toLowerCase().includes('aging'));
      
      let typeBadge = '';
      if (hasTransit) {
        typeBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black shadow-sm" style="background-color: #92D050; color: #000; border: 1px solid #70A638;" title="Stock In-Transit (Outlet-to-Outlet Transfer)"><i class="fa-solid fa-truck-arrow-right"></i> IN-TRANSIT</span>`;
      } else if (hasRecall) {
        typeBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-red-600 text-white shadow-sm" title="Supplier / Product Recall"><i class="fa-solid fa-triangle-exclamation"></i> RECALL</span>`;
      } else if (hasAging) {
        typeBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black shadow-sm" style="background-color: #FFC000; color: #000; border: 1px solid #D97706;" title="Slow Moving / Aging Stock"><i class="fa-solid fa-hourglass-half"></i> AGING &gt;1YR</span>`;
      }

      const remindCnBtnHtml = canRemindCn ? `
        <button onclick="pmgReturns.openCnReminderModal('${safeRetIdAttr}')" class="px-2.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer" title="WhatsApp Supplier CN Reminder with Clickable DO &amp; PRN Proof Link">
          <i class="fa-brands fa-whatsapp text-sm"></i> <span>Remind CN</span>
        </button>` : '';

      return `
        <tr class="border-b border-gray-100 hover:bg-slate-50/80 transition text-sm">
          <td class="py-3 px-4">
            <div class="font-bold text-blue-900 font-mono flex items-center gap-1.5 flex-wrap">
              <i class="fa-solid fa-file-invoice text-blue-600 text-xs"></i>
              <span>${escapeHtml(ret.doNumber)}</span>
              ${typeBadge}
            </div>
            <div class="text-xs text-gray-500 mt-0.5">${escapeHtml(ret.date)} · <span class="font-medium text-gray-700">${escapeHtml(ret.branch)}</span></div>
          </td>
          <td class="py-3 px-4">
            <div class="font-bold text-gray-800 text-xs">${escapeHtml(ret.supplier || 'General Supplier')}</div>
            <div class="mt-1 flex flex-wrap gap-1">${prnBadges || '<span class="text-gray-400 text-xs">-</span>'}</div>
          </td>
          <td class="py-3 px-4">
            <div class="text-xs text-gray-800 max-w-xs truncate" title="${safeFirstItem}">${itemPreview}</div>
            <div class="text-[11px] text-gray-500 mt-0.5 font-medium">
              <i class="fa-solid fa-box text-amber-600"></i> ${ret.totalCartons} Carton(s) (${itemCount} SKU${itemCount > 1 ? 's' : ''})
            </div>
          </td>
          <td class="py-3 px-4 text-center">
            ${statusBadge}
          </td>
          <td class="py-3 px-4">
            ${proofBadge}
          </td>
          <td class="py-3 px-4">
            ${cnDisplay}
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              ${remindCnBtnHtml}
              <button onclick="pmgReturns.openEditReturnModal('${safeRetIdAttr}')" class="px-2.5 py-1.5 text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold rounded-lg border border-amber-300 transition flex items-center gap-1" title="Edit SKUs, PRN, Qty, Carton No">
                <i class="fa-solid fa-pen-to-square"></i> <span>Edit</span>
              </button>
              <button onclick="pmgReturns.openPrintDoModal('${safeRetIdAttr}')" class="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 transition flex items-center gap-1" title="View & Print PMG Delivery Order">
                <i class="fa-solid fa-print"></i> <span>DO Form</span>
              </button>
              <button onclick="pmgReturns.openPrintCartonLabelModal('${safeRetIdAttr}')" class="px-2.5 py-1.5 text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold rounded-lg border border-amber-300 transition flex items-center gap-1" title="Print Big Box / Carton Shipping Labels for Transporter">
                <i class="fa-solid fa-tags"></i> <span>Box Labels</span>
              </button>
              <button onclick="pmgReturns.openUploadSignedDoModal('${safeRetIdAttr}')" class="px-2 py-1.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded-lg border border-slate-300 transition" title="Upload Signed DO Proof (OneDrive + Cloud Link)">
                <i class="fa-solid fa-cloud-arrow-up"></i>
              </button>
              <button onclick="pmgReturns.openSettleCnModal('${safeRetIdAttr}')" class="px-2 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-lg border border-emerald-300 transition" title="Settle Credit Note & Key Xilnex">
                <i class="fa-solid fa-check-double"></i>
              </button>
              <button onclick="pmgReturns.deleteReturn('${safeRetIdAttr}')" class="px-2 py-1.5 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition" title="Delete record">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ─── FILTER & SEARCH HANDLERS ────────────────────────────────────────────────
  function setReturnsFilter(filterName) {
    currentFilter = filterName;
    document.querySelectorAll('.returns-filter-btn').forEach(btn => {
      btn.classList.remove('active', 'border-blue-600', 'text-blue-700', 'font-bold');
      btn.classList.add('border-transparent', 'text-gray-500');
    });

    const activeBtn = document.getElementById(`returns-filter-${filterName}`);
    if (activeBtn) {
      activeBtn.classList.add('active', 'border-blue-600', 'text-blue-700', 'font-bold');
      activeBtn.classList.remove('border-transparent', 'text-gray-500');
    }

    renderReturnsTable();
  }

  function handleReturnsSearch(query) {
    currentSearchQuery = query;
    renderReturnsTable();
  }

  // ─── MODAL 1: NEW RETURN APPLICATION & COMPOUND DO CREATOR ───────────────────
  let draftItems = [];

  function openNewReturnModal() {
    const modal = document.getElementById('newReturnModal');
    if (!modal) return;

    const branchName = getActiveBranchName();
    const branchInfo = getBranchDetails(branchName);

    // Reset draft fields
    document.getElementById('nrBranchSelect').value = branchInfo.name;
    document.getElementById('nrCompanyName').value = branchInfo.companyName;
    document.getElementById('nrCompanyAddress').value = branchInfo.address;
    document.getElementById('nrSupplier').value = '';
    
    // Reset destination fields
    const presetEl = document.getElementById('nrDestPreset');
    if (presetEl) presetEl.value = '';
    document.getElementById('nrDestCompany').value = '';
    document.getElementById('nrDestAddress').value = '';
    document.getElementById('nrDestAttn').value = '';
    document.getElementById('nrDestPhone').value = '';

    document.getElementById('nrDoNumber').value = generateNextDoNumber(branchInfo.name);
    document.getElementById('nrDate').value = formatTodayDateForDo();
    document.getElementById('nrVerifiedBy').value = getCurrentUserDisplayName();
    document.getElementById('nrRemarks').value = '';
    const nrProofInput = document.getElementById('nrProofFileInput');
    if (nrProofInput) nrProofInput.value = '';
    const nrProofPreview = document.getElementById('nrProofFilePreview');
    if (nrProofPreview) nrProofPreview.textContent = 'Optional: attach scanned DO / PRN (PDF, JPG, PNG)';

    // Initial 2 empty items
    draftItems = [
      { cartonNo: 1, itemCode: '', itemDescription: '', quantity: 1, uom: 'BOX', prnNumber: '', reason: 'Near Expiry', batchNo: '', expiryDate: '' }
    ];

    renderDraftItemsTable();
    modal.classList.remove('hidden');
  }

  function closeNewReturnModal() {
    document.getElementById('newReturnModal')?.classList.add('hidden');
  }

  function onNrBranchChanged() {
    const branchName = document.getElementById('nrBranchSelect').value;
    const branchInfo = getBranchDetails(branchName);
    document.getElementById('nrCompanyName').value = branchInfo.companyName;
    document.getElementById('nrCompanyAddress').value = branchInfo.address;
    document.getElementById('nrDoNumber').value = generateNextDoNumber(branchName);
  }

  function onDestPresetChanged(presetName) {
    if (!presetName || presetName === 'CUSTOM') return;
    const preset = DESTINATION_PRESETS.find(p => p.name === presetName || p.companyName === presetName);
    if (preset) {
      document.getElementById('nrDestCompany').value = preset.companyName;
      document.getElementById('nrDestAddress').value = preset.address;
      document.getElementById('nrDestAttn').value = preset.attn || '';
      document.getElementById('nrDestPhone').value = preset.phone || '';
      const supplierInput = document.getElementById('nrSupplier');
      if (supplierInput) {
        if (preset.name.includes('PMG PHARMACY') || preset.name.includes('CENTRAL WAREHOUSE')) {
          supplierInput.value = 'INTERBRANCH TRANSFER';
        } else if (!supplierInput.value.trim() || supplierInput.value === 'INTERBRANCH TRANSFER') {
          supplierInput.value = preset.name;
        }
      }
      // If destination is a PMG Branch, automatically switch default items to 'In-Transit'
      if (preset.name.includes('PMG PHARMACY') || preset.name.includes('CENTRAL WAREHOUSE')) {
        let changed = false;
        draftItems.forEach(it => {
          if (!it.reason || it.reason === 'Near Expiry') {
            it.reason = 'In-Transit';
            changed = true;
          }
        });
        if (changed) {
          renderDraftItemsTable();
        }
      }
    }
  }

  function generateNextDoNumber(branchName) {
    const bInfo = getBranchDetails(branchName);
    const prefix = bInfo.code ? bInfo.code.replace(/\d+/g, '').substring(0, 3).toUpperCase() : 'DO';
    const now = new Date();
    const yr = String(now.getFullYear()).substring(2);
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 900) + 100);
    return `DO-${prefix || 'PMG'}-${yr}${mo}-${rand}`;
  }

  function formatTodayDateForDo() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    return `${day}.${mon}.${yr}`;
  }

  function cleanStaffTitle(str) {
    if (!str) return '';
    return String(str)
      .replace(/\s*\(\s*Area\s+Manager\s*\)/gi, '')
      .replace(/Area\s+Manager/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function getCurrentUserDisplayName() {
    const session = typeof getSession === 'function' ? getSession() : null;
    const name = session?.displayName || 'Pharmacist';
    return cleanStaffTitle(name);
  }

  function syncDraftItemsFromDom() {
    const tbody = document.getElementById('nrItemsTableBody');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (!draftItems[index]) return;
      row.querySelectorAll('[data-field]').forEach(el => {
        const field = el.getAttribute('data-field');
        if (field) {
          draftItems[index][field] = el.value;
        }
      });
    });
  }

  function addDraftItemRow() {
    syncDraftItemsFromDom();
    const lastCarton = draftItems.length > 0 ? (draftItems[draftItems.length - 1].cartonNo || 1) : 1;
    const lastPrn = draftItems.length > 0 ? (draftItems[draftItems.length - 1].prnNumber || '') : '';

    draftItems.push({
      cartonNo: lastCarton,
      itemCode: '',
      itemDescription: '',
      quantity: 1,
      uom: 'BOX',
      prnNumber: lastPrn,
      reason: 'Near Expiry',
      batchNo: '',
      expiryDate: ''
    });

    renderDraftItemsTable();
  }

  function removeDraftItemRow(index) {
    syncDraftItemsFromDom();
    if (draftItems.length <= 1) {
      alert('A Delivery Order must have at least one return item.');
      return;
    }
    draftItems.splice(index, 1);
    renderDraftItemsTable();
  }

  function updateDraftItem(index, field, value) {
    if (!draftItems[index]) return;
    draftItems[index][field] = value;
    if (field === 'cartonNo' || field === 'prnNumber') {
      checkPrnLimitsAndCartons();
    }
    if (field === 'reason') {
      const rCfg = getReasonConfig(value);
      const rows = document.querySelectorAll('#nrItemsTableBody tr');
      if (rows[index]) {
        const sel = rows[index].querySelector('[data-field="reason"]');
        if (sel) {
          sel.style.backgroundColor = rCfg.bgColor;
          sel.style.color = rCfg.textColor;
          sel.style.borderColor = rCfg.borderColor;
        }
      }
      if (rCfg.value === 'In-Transit') {
        const supplierInput = document.getElementById('nrSupplier');
        if (supplierInput && (!supplierInput.value.trim() || supplierInput.value.trim() === 'SSJ PHARMA SDN BHD')) {
          supplierInput.value = 'INTERBRANCH TRANSFER';
        }
      }
    }
  }

  // PRN 3-SKU LIMIT CHECKER & CARTON COUNTER
  function checkPrnLimitsAndCartons() {
    // 1. Calculate Carton count
    const uniqueCartons = new Set(draftItems.map(it => String(it.cartonNo || 1).trim()).filter(Boolean));
    const totalCartons = Math.max(1, uniqueCartons.size);
    const cartonIndicator = document.getElementById('nrTotalCartonBadge');
    if (cartonIndicator) {
      cartonIndicator.textContent = `Total Number of Carton: ${totalCartons}`;
    }

    // 2. Check PRN 3-SKU Limit Rule
    const prnCounts = {};
    draftItems.forEach(it => {
      const prn = (it.prnNumber || '').trim();
      if (prn) {
        prnCounts[prn] = (prnCounts[prn] || 0) + 1;
      }
    });

    const violations = Object.entries(prnCounts).filter(([prn, count]) => count > 3);
    const alertBox = document.getElementById('nrPrnLimitWarning');

    if (violations.length > 0) {
      const msg = violations.map(([prn, count]) => `<b>${escapeHtml(prn)}</b> has <b>${count} SKUs</b>`).join(', ');
      if (alertBox) {
        alertBox.innerHTML = `
          <div class="flex items-start gap-2">
            <i class="fa-solid fa-triangle-exclamation text-amber-600 text-sm mt-0.5"></i>
            <div>
              <p class="font-bold text-amber-900 text-xs">⚠️ Manual PRN Slip Limit Exceeded (Max 3 SKUs per slip!):</p>
              <p class="text-xs text-amber-800 mt-0.5">${msg}. Company SOP allows a maximum of 3 items per physical PRN slip. Please assign another PRN number for excess items or click <b>"Auto-Split by 3 SKUs"</b> below.</p>
            </div>
          </div>
        `;
        alertBox.classList.remove('hidden');
      }
    } else if (alertBox) {
      alertBox.classList.add('hidden');
    }
  }

  function autoGroupPrnByThree() {
    syncDraftItemsFromDom();
    const basePrn = prompt('Enter starting PRN booklet slip number (e.g. PRN-001 or 12345):', 'PRN-001');
    if (!basePrn) return;

    let prnPrefix = basePrn;
    let prnNum = 1;
    const match = basePrn.match(/^(.*?)(\d+)$/);
    if (match) {
      prnPrefix = match[1];
      prnNum = parseInt(match[2], 10);
    }

    draftItems.forEach((item, index) => {
      const slipGroup = Math.floor(index / 3);
      const currentSlipNum = prnNum + slipGroup;
      item.prnNumber = `${prnPrefix}${String(currentSlipNum).padStart(3, '0')}`;
    });

    renderDraftItemsTable();
  }

  function renderDraftItemsTable() {
    const tbody = document.getElementById('nrItemsTableBody');
    if (!tbody) return;

    tbody.innerHTML = draftItems.map((item, index) => {
      const rCfg = getReasonConfig(item.reason);
      return `
      <tr class="border-b border-gray-100 text-xs">
        <td class="py-2 px-2 text-center">
          <input data-field="cartonNo" type="number" min="1" max="99" value="${item.cartonNo || 1}" oninput="pmgReturns.updateDraftItem(${index}, 'cartonNo', this.value)" onchange="pmgReturns.updateDraftItem(${index}, 'cartonNo', this.value)" class="w-12 text-center border border-gray-300 rounded px-1 py-1 font-bold text-gray-700">
        </td>
        <td class="py-2 px-2">
          <input data-field="itemCode" type="text" placeholder="e.g. 103366" value="${escapeHtml(item.itemCode || '')}" oninput="pmgReturns.updateDraftItem(${index}, 'itemCode', this.value)" onchange="pmgReturns.updateDraftItem(${index}, 'itemCode', this.value)" class="w-24 border border-gray-300 rounded px-2 py-1 font-mono uppercase">
        </td>
        <td class="py-2 px-2">
          <input data-field="itemDescription" type="text" placeholder="e.g. FINAINTAS 5MG TAB 10'S" value="${escapeHtml(item.itemDescription || '')}" oninput="pmgReturns.updateDraftItem(${index}, 'itemDescription', this.value)" onchange="pmgReturns.updateDraftItem(${index}, 'itemDescription', this.value)" class="w-full border border-gray-300 rounded px-2 py-1 font-semibold text-gray-800">
        </td>
        <td class="py-2 px-2">
          <div class="flex items-center gap-1">
            <input data-field="quantity" type="number" min="1" value="${item.quantity || 1}" oninput="pmgReturns.updateDraftItem(${index}, 'quantity', this.value)" onchange="pmgReturns.updateDraftItem(${index}, 'quantity', this.value)" class="w-14 border border-gray-300 rounded px-1.5 py-1 text-center font-bold">
            <select data-field="uom" onchange="pmgReturns.updateDraftItem(${index}, 'uom', this.value)" class="border border-gray-300 rounded px-1 py-1 text-xs">
              <option value="BOX" ${item.uom === 'BOX' ? 'selected' : ''}>BOX</option>
              <option value="BTL" ${item.uom === 'BTL' ? 'selected' : ''}>BTL</option>
              <option value="TAB" ${item.uom === 'TAB' ? 'selected' : ''}>TAB</option>
              <option value="PACK" ${item.uom === 'PACK' ? 'selected' : ''}>PACK</option>
              <option value="STRIP" ${item.uom === 'STRIP' ? 'selected' : ''}>STRIP</option>
              <option value="UNIT" ${item.uom === 'UNIT' ? 'selected' : ''}>UNIT</option>
              <option value="CTN" ${item.uom === 'CTN' ? 'selected' : ''}>CTN</option>
            </select>
          </div>
        </td>
        <td class="py-2 px-2">
          <input data-field="prnNumber" type="text" placeholder="e.g. PRN-0412" value="${escapeHtml(item.prnNumber || '')}" oninput="pmgReturns.updateDraftItem(${index}, 'prnNumber', this.value)" onchange="pmgReturns.updateDraftItem(${index}, 'prnNumber', this.value)" class="w-24 border border-gray-300 rounded px-2 py-1 font-mono font-bold text-amber-800 bg-amber-50/50">
        </td>
        <td class="py-2 px-2">
          <select data-field="reason" onchange="pmgReturns.updateDraftItem(${index}, 'reason', this.value)" style="background-color: ${rCfg.bgColor}; color: ${rCfg.textColor}; border-color: ${rCfg.borderColor}; font-weight: 700;" class="w-full border rounded px-1.5 py-1 text-xs shadow-sm transition">
            ${RETURN_REASONS.map(r => `
              <option value="${r.value}" style="background-color: ${r.bgColor}; color: ${r.textColor}; font-weight: bold;" ${(r.value === item.reason) || (r.value === 'In-Transit' && (item.reason || '').toLowerCase().includes('transit')) ? 'selected' : ''}>
                ${r.label}
              </option>
            `).join('')}
          </select>
        </td>
        <td class="py-2 px-2 text-center">
          <button type="button" onclick="pmgReturns.removeDraftItemRow(${index})" class="text-rose-500 hover:text-rose-700 text-sm p-1" title="Remove SKU">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
      `;
    }).join('');

    checkPrnLimitsAndCartons();
  }

  async function saveNewReturnApplication() {
    syncDraftItemsFromDom();
    const branch = document.getElementById('nrBranchSelect').value;
    const companyName = document.getElementById('nrCompanyName').value.trim();
    const companyAddress = document.getElementById('nrCompanyAddress').value.trim();
    const supplier = document.getElementById('nrSupplier').value.trim();
    const doNumber = document.getElementById('nrDoNumber').value.trim();
    const date = document.getElementById('nrDate').value.trim();
    const verifiedBy = document.getElementById('nrVerifiedBy').value.trim();
    const remarks = document.getElementById('nrRemarks').value.trim();

    // Destination Details
    const destCompany = document.getElementById('nrDestCompany').value.trim();
    const destAddress = document.getElementById('nrDestAddress').value.trim();
    const destAttn = document.getElementById('nrDestAttn').value.trim();
    const destPhone = document.getElementById('nrDestPhone').value.trim();

    if (!companyName || !doNumber || !date) {
      alert('Please fill in Company Name, DO Number, and Date.');
      return;
    }

    if (!destCompany) {
      alert('Please fill in Destination Company Name (or select a supplier preset). Destination Address is optional.');
      return;
    }

    if (draftItems.length === 0) {
      alert('Please add at least one item to return.');
      return;
    }

    // Validate items
    for (let i = 0; i < draftItems.length; i++) {
      if (!draftItems[i].itemDescription || !draftItems[i].itemDescription.trim()) {
        alert(`Item #${i + 1} is missing an Item Description.`);
        return;
      }
    }

    // Calculate unique cartons
    const uniqueCartons = new Set(draftItems.map(it => String(it.cartonNo || 1).trim()).filter(Boolean));
    const totalCartons = Math.max(1, uniqueCartons.size);

    const newRecord = {
      id: `ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      doNumber: doNumber,
      branch: branch,
      branchCode: getBranchDetails(branch).code,
      companyName: companyName,
      companyAddress: companyAddress,
      date: date,
      supplier: supplier || destCompany || 'General Supplier',
      destCompany: destCompany,
      destAddress: destAddress,
      destAttn: destAttn,
      destPhone: destPhone,
      totalCartons: totalCartons,
      status: 'pending_pickup',
      verifiedBy: verifiedBy || getCurrentUserDisplayName(),
      pickupBy: '',
      pickupDate: '',
      signedProof: null,
      cnNumber: '',
      cnAmount: 0,
      cnDate: '',
      xilnexKeyed: false,
      xilnexKeyedDate: '',
      xilnexKeyedBy: '',
      remarks: remarks,
      items: JSON.parse(JSON.stringify(draftItems)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    returnsData.unshift(newRecord);
    await saveSingleReturnToDb(newRecord);
    try { localStorage.setItem('pmg_returns_records_v1', JSON.stringify(returnsData)); } catch (_) {}

    const nrProofInput = document.getElementById('nrProofFileInput');
    const nrProofFiles = nrProofInput && nrProofInput.files ? Array.from(nrProofInput.files) : [];
    if (nrProofFiles.length > 0) {
      await attachAndSyncProofFilesToReturn(newRecord, nrProofFiles, { preservePendingStatus: true });
    } else {
      // Sync to OneDrive & Google Cloud
      syncReturnsWithOneDrive(branch);
      syncReturnsWithGoogleSheets(branch);
    }

    closeNewReturnModal();
    renderReturnsUI();

    // Auto-open DO print preview
    openPrintDoModal(newRecord.id);
  }

  // ─── MODAL 1B: EDIT CONFIRMED RETURN APPLICATION & DO ─────────────────────────
  function openEditReturnModal(returnId) {
    const id = returnId || (activeReturnForDo ? activeReturnForDo.id : null);
    if (!id) return;
    const ret = returnsData.find(r => r.id === id);
    if (!ret) {
      alert('Return record not found.');
      return;
    }

    activeReturnForEdit = JSON.parse(JSON.stringify(ret));
    editDraftItems = JSON.parse(JSON.stringify(ret.items || []));
    if (editDraftItems.length === 0) {
      editDraftItems = [
        { cartonNo: 1, itemCode: '', itemDescription: '', quantity: 1, uom: 'BOX', prnNumber: '', reason: 'Near Expiry', batchNo: '', expiryDate: '' }
      ];
    }

    const modal = document.getElementById('editReturnModal');
    if (!modal) return;

    // Populate Header fields
    const branchSelect = document.getElementById('erBranchSelect');
    if (branchSelect) branchSelect.value = ret.branch || 'Kota Sentosa';
    const doNum = document.getElementById('erDoNumber');
    if (doNum) doNum.value = ret.doNumber || '';
    const dateInput = document.getElementById('erDate');
    if (dateInput) dateInput.value = ret.date || '';
    const compName = document.getElementById('erCompanyName');
    if (compName) compName.value = ret.companyName || '';
    const compAddr = document.getElementById('erCompanyAddress');
    if (compAddr) compAddr.value = ret.companyAddress || '';

    // Destination fields
    const destPreset = document.getElementById('erDestPreset');
    if (destPreset) destPreset.value = '';
    const destComp = document.getElementById('erDestCompany');
    if (destComp) destComp.value = ret.destCompany || ret.supplier || '';
    const destAddr = document.getElementById('erDestAddress');
    if (destAddr) destAddr.value = ret.destAddress || '';
    const destAttn = document.getElementById('erDestAttn');
    if (destAttn) destAttn.value = ret.destAttn || '';
    const destPhone = document.getElementById('erDestPhone');
    if (destPhone) destPhone.value = ret.destPhone || '';
    const supp = document.getElementById('erSupplier');
    if (supp) supp.value = ret.supplier || '';

    // Staff & Remarks
    const verBy = document.getElementById('erVerifiedBy');
    if (verBy) verBy.value = ret.verifiedBy || getCurrentUserDisplayName();
    const rem = document.getElementById('erRemarks');
    if (rem) rem.value = ret.remarks || '';
    const erProofInput = document.getElementById('erProofFileInput');
    if (erProofInput) erProofInput.value = '';
    const erProofPreview = document.getElementById('erProofFilePreview');
    if (erProofPreview) {
      if (ret.signedProof && ret.signedProof.fileName) {
        const extraCount = Array.isArray(ret.signedProof.additionalDocs) ? ret.signedProof.additionalDocs.length : 0;
        erProofPreview.textContent = `Attached: ${ret.signedProof.fileName}${extraCount > 0 ? ` (+${extraCount} more)` : ''} ${ret.signedProof.cloudDocId ? '· ☁️ Cloud Link Ready' : '· (Local/OneDrive)'}`;
      } else {
        erProofPreview.textContent = 'No DO / PRN scan attached yet';
      }
    }

    renderEditDraftItemsTable();
    checkEditPrnLimitsAndCartons();
    modal.classList.remove('hidden');
  }

  function closeEditReturnModal() {
    document.getElementById('editReturnModal')?.classList.add('hidden');
    activeReturnForEdit = null;
    editDraftItems = [];
  }

  function onErBranchChanged() {
    const branchName = document.getElementById('erBranchSelect').value;
    const branchInfo = getBranchDetails(branchName);
    document.getElementById('erCompanyName').value = branchInfo.companyName;
    document.getElementById('erCompanyAddress').value = branchInfo.address;
  }

  function onErDestPresetChanged(presetName) {
    if (!presetName || presetName === 'CUSTOM') return;
    const preset = DESTINATION_PRESETS.find(p => p.name === presetName || p.companyName === presetName);
    if (preset) {
      document.getElementById('erDestCompany').value = preset.companyName;
      document.getElementById('erDestAddress').value = preset.address;
      document.getElementById('erDestAttn').value = preset.attn || '';
      document.getElementById('erDestPhone').value = preset.phone || '';
      const supplierInput = document.getElementById('erSupplier');
      if (supplierInput) {
        if (preset.name.includes('PMG PHARMACY') || preset.name.includes('CENTRAL WAREHOUSE')) {
          supplierInput.value = 'INTERBRANCH TRANSFER';
        } else if (!supplierInput.value.trim() || supplierInput.value === 'INTERBRANCH TRANSFER') {
          supplierInput.value = preset.name;
        }
      }
      // If destination is a PMG Branch, automatically switch default items to 'In-Transit'
      if (preset.name.includes('PMG PHARMACY') || preset.name.includes('CENTRAL WAREHOUSE')) {
        let changed = false;
        editDraftItems.forEach(it => {
          if (!it.reason || it.reason === 'Near Expiry') {
            it.reason = 'In-Transit';
            changed = true;
          }
        });
        if (changed) {
          renderEditDraftItemsTable();
        }
      }
    }
  }

  function syncEditDraftItemsFromDom() {
    const tbody = document.getElementById('erItemsTableBody');
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
      if (!editDraftItems[index]) return;
      row.querySelectorAll('[data-field]').forEach(el => {
        const field = el.getAttribute('data-field');
        if (field) {
          editDraftItems[index][field] = el.value;
        }
      });
    });
  }

  function addEditDraftItemRow() {
    syncEditDraftItemsFromDom();
    const lastCarton = editDraftItems.length > 0 ? (editDraftItems[editDraftItems.length - 1].cartonNo || 1) : 1;
    const lastPrn = editDraftItems.length > 0 ? (editDraftItems[editDraftItems.length - 1].prnNumber || '') : '';

    editDraftItems.push({
      cartonNo: lastCarton,
      itemCode: '',
      itemDescription: '',
      quantity: 1,
      uom: 'BOX',
      prnNumber: lastPrn,
      reason: 'Near Expiry',
      batchNo: '',
      expiryDate: ''
    });

    renderEditDraftItemsTable();
  }

  function removeEditDraftItemRow(index) {
    syncEditDraftItemsFromDom();
    if (editDraftItems.length <= 1) {
      alert('A Delivery Order must have at least one return item.');
      return;
    }
    editDraftItems.splice(index, 1);
    renderEditDraftItemsTable();
  }

  function updateEditDraftItem(index, field, value) {
    if (!editDraftItems[index]) return;
    editDraftItems[index][field] = value;
    if (field === 'cartonNo' || field === 'prnNumber') {
      checkEditPrnLimitsAndCartons();
    }
    if (field === 'reason') {
      const rCfg = getReasonConfig(value);
      const rows = document.querySelectorAll('#erItemsTableBody tr');
      if (rows[index]) {
        const sel = rows[index].querySelector('[data-field="reason"]');
        if (sel) {
          sel.style.backgroundColor = rCfg.bgColor;
          sel.style.color = rCfg.textColor;
          sel.style.borderColor = rCfg.borderColor;
        }
      }
      if (rCfg.value === 'In-Transit') {
        const supplierInput = document.getElementById('erSupplier');
        if (supplierInput && (!supplierInput.value.trim() || supplierInput.value.trim() === 'SSJ PHARMA SDN BHD')) {
          supplierInput.value = 'INTERBRANCH TRANSFER';
        }
      }
    }
  }

  function checkEditPrnLimitsAndCartons() {
    // 1. Calculate Carton count
    const uniqueCartons = new Set(editDraftItems.map(it => String(it.cartonNo || 1).trim()).filter(Boolean));
    const totalCartons = Math.max(1, uniqueCartons.size);
    const cartonIndicator = document.getElementById('erTotalCartonBadge');
    if (cartonIndicator) {
      cartonIndicator.textContent = `Total Number of Carton: ${totalCartons}`;
    }

    // 2. Check PRN 3-SKU Limit Rule
    const prnCounts = {};
    editDraftItems.forEach(it => {
      const prn = (it.prnNumber || '').trim();
      if (prn) {
        prnCounts[prn] = (prnCounts[prn] || 0) + 1;
      }
    });

    const violations = Object.entries(prnCounts).filter(([prn, count]) => count > 3);
    const alertBox = document.getElementById('erPrnLimitWarning');

    if (violations.length > 0) {
      const msg = violations.map(([prn, count]) => `<b>${escapeHtml(prn)}</b> has <b>${count} SKUs</b>`).join(', ');
      if (alertBox) {
        alertBox.innerHTML = `
          <div class="flex items-start gap-2">
            <i class="fa-solid fa-triangle-exclamation text-amber-600 text-sm mt-0.5"></i>
            <div>
              <p class="font-bold text-amber-900 text-xs">⚠️ Manual PRN Slip Limit Exceeded (Max 3 SKUs per slip!):</p>
              <p class="text-xs text-amber-800 mt-0.5">${msg}. Company SOP allows a maximum of 3 items per physical PRN slip. Please assign another PRN number for excess items or click <b>"Auto-Split by 3 SKUs"</b> above.</p>
            </div>
          </div>
        `;
        alertBox.classList.remove('hidden');
      }
    } else if (alertBox) {
      alertBox.classList.add('hidden');
    }
  }

  function autoGroupEditPrnByThree() {
    syncEditDraftItemsFromDom();
    const currentFirst = (editDraftItems[0] && editDraftItems[0].prnNumber) ? editDraftItems[0].prnNumber : 'PRN-001';
    const basePrn = prompt('Enter starting PRN booklet slip number (e.g. PRN-001 or 12345):', currentFirst);
    if (!basePrn) return;

    let prnPrefix = basePrn;
    let prnNum = 1;
    const match = basePrn.match(/^(.*?)(\d+)$/);
    if (match) {
      prnPrefix = match[1];
      prnNum = parseInt(match[2], 10);
    }

    editDraftItems.forEach((item, index) => {
      const slipGroup = Math.floor(index / 3);
      const currentSlipNum = prnNum + slipGroup;
      item.prnNumber = `${prnPrefix}${String(currentSlipNum).padStart(3, '0')}`;
    });

    renderEditDraftItemsTable();
  }

  function renderEditDraftItemsTable() {
    const tbody = document.getElementById('erItemsTableBody');
    if (!tbody) return;

    tbody.innerHTML = editDraftItems.map((item, index) => {
      const rCfg = getReasonConfig(item.reason);
      return `
      <tr class="border-b border-gray-100 text-xs">
        <td class="py-2 px-2 text-center">
          <input data-field="cartonNo" type="number" min="1" max="99" value="${item.cartonNo || 1}" oninput="pmgReturns.updateEditDraftItem(${index}, 'cartonNo', this.value)" onchange="pmgReturns.updateEditDraftItem(${index}, 'cartonNo', this.value)" class="w-12 text-center border border-gray-300 rounded px-1 py-1 font-bold text-gray-700">
        </td>
        <td class="py-2 px-2">
          <input data-field="itemCode" type="text" placeholder="e.g. 103366" value="${escapeHtml(item.itemCode || '')}" oninput="pmgReturns.updateEditDraftItem(${index}, 'itemCode', this.value)" onchange="pmgReturns.updateEditDraftItem(${index}, 'itemCode', this.value)" class="w-24 border border-gray-300 rounded px-2 py-1 font-mono uppercase">
        </td>
        <td class="py-2 px-2">
          <input data-field="itemDescription" type="text" placeholder="e.g. FINAINTAS 5MG TAB 10'S" value="${escapeHtml(item.itemDescription || '')}" oninput="pmgReturns.updateEditDraftItem(${index}, 'itemDescription', this.value)" onchange="pmgReturns.updateEditDraftItem(${index}, 'itemDescription', this.value)" class="w-full border border-gray-300 rounded px-2 py-1 font-semibold text-gray-800">
        </td>
        <td class="py-2 px-2">
          <div class="flex items-center gap-1">
            <input data-field="quantity" type="number" min="1" value="${item.quantity || 1}" oninput="pmgReturns.updateEditDraftItem(${index}, 'quantity', this.value)" onchange="pmgReturns.updateEditDraftItem(${index}, 'quantity', this.value)" class="w-14 border border-gray-300 rounded px-1.5 py-1 text-center font-bold">
            <select data-field="uom" onchange="pmgReturns.updateEditDraftItem(${index}, 'uom', this.value)" class="border border-gray-300 rounded px-1 py-1 text-xs">
              <option value="BOX" ${item.uom === 'BOX' ? 'selected' : ''}>BOX</option>
              <option value="BTL" ${item.uom === 'BTL' ? 'selected' : ''}>BTL</option>
              <option value="TAB" ${item.uom === 'TAB' ? 'selected' : ''}>TAB</option>
              <option value="PACK" ${item.uom === 'PACK' ? 'selected' : ''}>PACK</option>
              <option value="STRIP" ${item.uom === 'STRIP' ? 'selected' : ''}>STRIP</option>
              <option value="UNIT" ${item.uom === 'UNIT' ? 'selected' : ''}>UNIT</option>
              <option value="CTN" ${item.uom === 'CTN' ? 'selected' : ''}>CTN</option>
            </select>
          </div>
        </td>
        <td class="py-2 px-2">
          <input data-field="prnNumber" type="text" placeholder="e.g. PRN-0412" value="${escapeHtml(item.prnNumber || '')}" oninput="pmgReturns.updateEditDraftItem(${index}, 'prnNumber', this.value)" onchange="pmgReturns.updateEditDraftItem(${index}, 'prnNumber', this.value)" class="w-24 border border-gray-300 rounded px-2 py-1 font-mono font-bold text-amber-800 bg-amber-50/50">
        </td>
        <td class="py-2 px-2">
          <select data-field="reason" onchange="pmgReturns.updateEditDraftItem(${index}, 'reason', this.value)" style="background-color: ${rCfg.bgColor}; color: ${rCfg.textColor}; border-color: ${rCfg.borderColor}; font-weight: 700;" class="w-full border rounded px-1.5 py-1 text-xs shadow-sm transition">
            ${RETURN_REASONS.map(r => `
              <option value="${r.value}" style="background-color: ${r.bgColor}; color: ${r.textColor}; font-weight: bold;" ${(r.value === item.reason) || (r.value === 'In-Transit' && (item.reason || '').toLowerCase().includes('transit')) ? 'selected' : ''}>
                ${r.label}
              </option>
            `).join('')}
          </select>
        </td>
        <td class="py-2 px-2 text-center">
          <button type="button" onclick="pmgReturns.removeEditDraftItemRow(${index})" class="text-rose-500 hover:text-rose-700 text-sm p-1" title="Remove SKU">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
      `;
    }).join('');

    checkEditPrnLimitsAndCartons();
  }

  async function saveEditedReturn() {
    if (!activeReturnForEdit) return;
    syncEditDraftItemsFromDom();

    const branch = document.getElementById('erBranchSelect').value;
    const companyName = document.getElementById('erCompanyName').value.trim();
    const companyAddress = document.getElementById('erCompanyAddress').value.trim();
    const supplier = document.getElementById('erSupplier').value.trim();
    const doNumber = document.getElementById('erDoNumber').value.trim();
    const date = document.getElementById('erDate').value.trim();
    const verifiedBy = document.getElementById('erVerifiedBy').value.trim();
    const remarks = document.getElementById('erRemarks').value.trim();

    const destCompany = document.getElementById('erDestCompany').value.trim();
    const destAddress = document.getElementById('erDestAddress').value.trim();
    const destAttn = document.getElementById('erDestAttn').value.trim();
    const destPhone = document.getElementById('erDestPhone').value.trim();

    if (!companyName || !doNumber || !date) {
      alert('Please fill in Company Name, DO Number, and Date.');
      return;
    }

    if (!destCompany) {
      alert('Please fill in Destination Company Name (or select a supplier preset).');
      return;
    }

    if (editDraftItems.length === 0) {
      alert('Please add at least one item to return.');
      return;
    }

    for (let i = 0; i < editDraftItems.length; i++) {
      if (!editDraftItems[i].itemDescription || !editDraftItems[i].itemDescription.trim()) {
        alert(`Item #${i + 1} is missing an Item Description.`);
        return;
      }
    }

    const uniqueCartons = new Set(editDraftItems.map(it => String(it.cartonNo || 1).trim()).filter(Boolean));
    const totalCartons = Math.max(1, uniqueCartons.size);

    activeReturnForEdit.branch = branch;
    activeReturnForEdit.branchCode = getBranchDetails(branch).code;
    activeReturnForEdit.companyName = companyName;
    activeReturnForEdit.companyAddress = companyAddress;
    activeReturnForEdit.doNumber = doNumber;
    activeReturnForEdit.date = date;
    activeReturnForEdit.supplier = supplier || destCompany || 'General Supplier';
    activeReturnForEdit.destCompany = destCompany;
    activeReturnForEdit.destAddress = destAddress;
    activeReturnForEdit.destAttn = destAttn;
    activeReturnForEdit.destPhone = destPhone;
    activeReturnForEdit.totalCartons = totalCartons;
    activeReturnForEdit.verifiedBy = verifiedBy || getCurrentUserDisplayName();
    activeReturnForEdit.remarks = remarks;
    activeReturnForEdit.items = JSON.parse(JSON.stringify(editDraftItems));
    activeReturnForEdit.updatedAt = new Date().toISOString();

    const idx = returnsData.findIndex(r => r.id === activeReturnForEdit.id);
    if (idx !== -1) {
      activeReturnForEdit.signedProof = mergeSignedProofMetadata(activeReturnForEdit.signedProof, returnsData[idx].signedProof);
      returnsData[idx] = activeReturnForEdit;
    } else {
      returnsData.unshift(activeReturnForEdit);
    }

    await saveSingleReturnToDb(activeReturnForEdit);
    try { localStorage.setItem('pmg_returns_records_v1', JSON.stringify(returnsData)); } catch (_) {}

    const erProofInput = document.getElementById('erProofFileInput');
    const erProofFiles = erProofInput && erProofInput.files ? Array.from(erProofInput.files) : [];
    if (erProofFiles.length > 0) {
      await attachAndSyncProofFilesToReturn(activeReturnForEdit, erProofFiles, { preservePendingStatus: true });
    } else {
      // Sync to OneDrive & Google Cloud
      syncReturnsWithOneDrive(branch);
      syncReturnsWithGoogleSheets(branch);
    }

    const savedId = activeReturnForEdit.id;
    closeEditReturnModal();
    renderReturnsUI();

    // If DO print modal was viewing this return, refresh it
    if (activeReturnForDo && activeReturnForDo.id === savedId) {
      openPrintDoModal(savedId);
    }
    // If carton labels modal was viewing this return, refresh it
    if (activeReturnForLabels && activeReturnForLabels.id === savedId) {
      activeReturnForLabels = activeReturnForEdit;
      renderCartonLabelsHtml(activeCartonTemplate);
    }

    if (typeof showPmgToast === 'function') {
      showPmgToast(`✅ Return ${doNumber} updated successfully!`, 'success');
    } else {
      alert(`✅ Return ${doNumber} updated successfully!`);
    }
  }

  // ─── MODAL 2: OFFICIAL PMG DELIVERY ORDER (DO) PRINT VIEW ────────────────────
  function openPrintDoModal(returnId) {
    const ret = returnsData.find(r => r.id === returnId);
    if (!ret) return;
    activeReturnForDo = ret;

    const modal = document.getElementById('printDoModal');
    const container = document.getElementById('printDoDocumentContainer');
    if (!modal || !container) return;

    // Render PMG standard DO table rows
    let currentCtn = null;
    const tableRows = (ret.items || []).map(item => {
      const ctnDisplay = (item.cartonNo !== currentCtn) ? item.cartonNo : '';
      currentCtn = item.cartonNo;
      const rCfg = getReasonConfig(item.reason);
      return `
        <tr>
          <td style="border: 1px solid #111; padding: 6px 8px; text-align: center; font-weight: bold; width: 65px;">${ctnDisplay}</td>
          <td style="border: 1px solid #111; padding: 6px 8px; font-family: monospace; font-weight: bold; width: 105px;">${escapeHtml(item.itemCode || '-')}</td>
          <td style="border: 1px solid #111; padding: 6px 8px; font-weight: 600;">${escapeHtml(item.itemDescription || '')}</td>
          <td style="border: 1px solid #111; padding: 6px 8px; text-align: center; font-weight: bold; width: 85px;">${item.quantity || 1} ${escapeHtml(item.uom || 'BOX')}</td>
          <td style="border: 1px solid #111; padding: 6px 8px; text-align: center; width: 115px;">
            <span style="background: ${rCfg.bgColor}; color: ${rCfg.textColor}; font-weight: 900; padding: 2px 8px; border-radius: 4px; font-size: 10px; display: inline-block; border: 1px solid ${rCfg.borderColor}; text-transform: uppercase;">
              ${escapeHtml(rCfg.shortLabel)}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    // Fill blank rows to mimic standard full-sheet DO appearance
    const blankRowsCount = Math.max(0, 8 - (ret.items || []).length);
    let blankRowsHtml = '';
    for (let i = 0; i < blankRowsCount; i++) {
      blankRowsHtml += `
        <tr style="height: 24px;">
          <td style="border: 1px solid #111; padding: 6px 8px;"></td>
          <td style="border: 1px solid #111; padding: 6px 8px;"></td>
          <td style="border: 1px solid #111; padding: 6px 8px;"></td>
          <td style="border: 1px solid #111; padding: 6px 8px;"></td>
          <td style="border: 1px solid #111; padding: 6px 8px;"></td>
        </tr>
      `;
    }

    // Auto-detect template based on destination and reasons
    const destUpper = ((ret.destCompany || '') + ' ' + (ret.supplier || '')).toUpperCase();
    const hasTransit = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('transit'));
    const hasRecall = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('recall'));
    const hasAging = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('slow') || (it.reason || '').toLowerCase().includes('aging'));
    let detectedDoTemplate = 'SSJ_NORMAL';
    if (hasTransit) {
      detectedDoTemplate = 'INTERBRANCH';
    } else if (destUpper.includes('SSJ')) {
      if (hasRecall) detectedDoTemplate = 'SSJ_RECALL';
      else if (hasAging) detectedDoTemplate = 'SSJ_AGING';
      else detectedDoTemplate = 'SSJ_NORMAL';
    } else if (destUpper.includes('PMG') || destUpper.includes('BRANCH') || destUpper.includes('SENTOSA') || destUpper.includes('OUTLET')) {
      detectedDoTemplate = 'INTERBRANCH';
    } else {
      detectedDoTemplate = 'VENDOR_STANDARD';
    }
    const doCfg = SSJ_TEMPLATES_CONFIG[detectedDoTemplate] || SSJ_TEMPLATES_CONFIG.SSJ_NORMAL;
    const targetDoTo = (ret.destCompany && ret.destCompany.trim()) ? ret.destCompany.trim() : (detectedDoTemplate === 'INTERBRANCH' ? 'PMG PHARMACY (RECEIVING BRANCH)' : (doCfg.to || 'SSJ PHARMA SDN BHD (SCD)'));
    const targetDoAttn = (ret.destAttn && ret.destAttn.trim()) ? ret.destAttn.trim() : (detectedDoTemplate === 'INTERBRANCH' ? 'BRANCH PHARMACIST / PIC' : (doCfg.attn || 'MR DOUGLAS'));

    container.innerHTML = `
      <div id="pmgOfficialDoPrintArea" style="font-family: Arial, sans-serif; color: #000; background: #fff; padding: 24px; max-width: 800px; margin: 0 auto; line-height: 1.35;">
        <!-- Header -->
        <div style="font-weight: 900; font-size: 18px; letter-spacing: 0.5px; margin-bottom: 2px;">DELIVERY ORDER</div>
        <div style="font-weight: 900; font-size: 15px; text-transform: uppercase;">${escapeHtml(ret.companyName)}</div>
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; max-width: 600px;">${escapeHtml(ret.companyAddress)}</div>

        ${detectedDoTemplate !== 'VENDOR_STANDARD' ? `
          <!-- HQ Required Top Banner & Color-Coded Header -->
          <div style="margin-top: 10px; margin-bottom: 6px;">
            <div style="color: #c00000; font-size: 13px; font-weight: 900; font-style: italic; text-align: center; margin-bottom: 8px; letter-spacing: 0.3px; text-transform: uppercase;">
              ${doCfg.title}
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 2px solid #000; font-size: 12px;">
              <tbody>
                <tr>
                  <td style="width: 210px; padding: 6px 10px; font-weight: 900; background: ${doCfg.categoryBg}; border: 1.5px solid #000; text-transform: uppercase; color: ${doCfg.categoryColor};">
                    CATEGORY RETURN
                  </td>
                  <td style="padding: 6px 10px; font-size: 14px; font-weight: 900; border: 1.5px solid #000; color: ${doCfg.categoryColor}; background: ${doCfg.categoryBg}; text-transform: uppercase;">
                    ${doCfg.category}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-weight: 900; background: ${doCfg.fromBg}; border: 1.5px solid #000; text-transform: uppercase; color: ${doCfg.fromColor};">
                    FROM
                  </td>
                  <td style="padding: 6px 10px; font-weight: 900; border: 1.5px solid #000; color: ${doCfg.fromColor}; background: ${doCfg.fromBg}; text-transform: uppercase;">
                    ${escapeHtml(ret.companyName || ('PMG PHARMACY (' + (ret.branch || 'BRANCH') + ')'))}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-weight: 900; background: ${doCfg.toBg}; border: 1.5px solid #000; text-transform: uppercase; color: ${doCfg.toColor};">
                    TO
                  </td>
                  <td style="padding: 6px 10px; font-weight: 900; border: 1.5px solid #000; color: ${doCfg.toColor}; background: ${doCfg.toBg}; text-transform: uppercase;">
                    ${escapeHtml(targetDoTo)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-weight: 900; background: ${doCfg.attnBg}; border: 1.5px solid #000; text-transform: uppercase; color: ${doCfg.attnColor};">
                    ATTENTION
                  </td>
                  <td style="padding: 6px 10px; font-weight: 900; border: 1.5px solid #000; color: ${doCfg.attnColor}; background: ${doCfg.attnBg}; text-transform: uppercase;">
                    ${escapeHtml(targetDoAttn)}
                  </td>
                </tr>
                ${doCfg.showRemarks ? `
                  <tr>
                    <td style="padding: 6px 10px; font-weight: 900; background: ${doCfg.remarksBg || '#FFFFFF'}; border: 1.5px solid #000; text-transform: uppercase; color: ${doCfg.remarksColor || '#000'};">
                      REMARKS
                    </td>
                    <td style="padding: 6px 10px; font-weight: 900; border: 1.5px solid #000; color: ${doCfg.remarksColor || '#000'}; background: ${doCfg.remarksBg || '#FFFFFF'}; text-transform: uppercase;">
                      ${doCfg.remarks || 'HANDLE WITH CARE-FRAGILE ITEM'}${ret.remarks ? ' · ' + escapeHtml(ret.remarks) : ''}
                    </td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="padding: 6px 10px; font-weight: 900; background: ${doCfg.dateBg}; border: 1.5px solid #000; text-transform: uppercase; color: ${doCfg.dateColor};">
                    ${doCfg.dateLabel}
                  </td>
                  <td style="padding: 6px 10px; font-weight: 900; border: 1.5px solid #000; color: ${doCfg.dateColor}; background: ${doCfg.dateBg}; text-transform: uppercase;">
                    ${escapeHtml(ret.date)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ` : `
          <!-- Deliver To / Destination Section -->
          <div style="margin-top: 10px; margin-bottom: 10px; padding: 8px 12px; background: #fafafa; border: 1.5px solid #000; border-radius: 4px;">
            <div style="font-size: 10px; font-weight: 900; color: #555; text-transform: uppercase; letter-spacing: 0.5px;">DELIVER TO / DESTINATION:</div>
            <div style="font-size: 14px; font-weight: 900; color: #000; margin-top: 2px; text-transform: uppercase;">${escapeHtml(ret.destCompany || ret.supplier || 'N/A')}</div>
            ${ret.destAddress ? `<div style="font-size: 11px; font-weight: 600; color: #222; text-transform: uppercase; margin-top: 1px;">${escapeHtml(ret.destAddress)}</div>` : `<div style="font-size: 10px; font-style: italic; color: #666; margin-top: 1px;">(Warehouse destination to be determined by vendor / transporter)</div>`}
            ${(ret.destAttn || ret.destPhone) ? `
              <div style="font-size: 11px; font-weight: bold; color: #333; margin-top: 3px; display: flex; gap: 15px; flex-wrap: wrap;">
                ${ret.destAttn ? `<span><b>Attn:</b> ${escapeHtml(ret.destAttn)}</span>` : ''}
                ${ret.destPhone ? `<span><b>Tel:</b> ${escapeHtml(ret.destPhone)}</span>` : ''}
              </div>
            ` : ''}
          </div>
        `}

        <!-- Metadata -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px; margin-bottom: 6px; font-weight: bold; font-size: 13px;">
          <div>DO: <span style="font-family: monospace; font-size: 14px;">${escapeHtml(ret.doNumber)}</span></div>
          <div>Date: <span>${escapeHtml(ret.date)}</span></div>
        </div>

        <!-- Supplier & PRN Info -->
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #333; margin-bottom: 8px; border-bottom: 1px dashed #666; padding-bottom: 4px;">
          <div><b>Supplier / Vendor:</b> ${escapeHtml(ret.supplier || 'N/A')}</div>
          <div><b>PRN Slips:</b> ${Array.from(new Set(ret.items.map(i => i.prnNumber).filter(Boolean))).join(', ') || 'N/A'}</div>
        </div>

        <!-- DO Table -->
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: 12px; margin-top: 4px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #111; padding: 6px 8px; text-align: center; width: 65px; font-weight: 900;">CTN NO</th>
              <th style="border: 1px solid #111; padding: 6px 8px; text-align: left; width: 105px; font-weight: 900;">ITEM CODE</th>
              <th style="border: 1px solid #111; padding: 6px 8px; text-align: left; font-weight: 900;">ITEM DESCRIPTION</th>
              <th style="border: 1px solid #111; padding: 6px 8px; text-align: center; width: 85px; font-weight: 900;">QUANTITY</th>
              <th style="border: 1px solid #111; padding: 6px 8px; text-align: center; width: 115px; font-weight: 900;">REASON</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            ${blankRowsHtml}
          </tbody>
        </table>

        <!-- Total Carton Summary -->
        <div style="margin-top: 10px; font-weight: 900; font-size: 13px;">
          Total Number of Carton: ${ret.totalCartons}
        </div>

        <!-- Signatures Handover Box -->
        <div style="display: flex; justify-content: space-between; margin-top: 35px; font-size: 12px;">
          <div style="width: 250px;">
            <div style="border-bottom: 1px solid #000; height: 35px;"></div>
            <div style="font-weight: bold; margin-top: 4px;">Verified by:</div>
            <div style="font-size: 11px; color: #444;">${escapeHtml(cleanStaffTitle(ret.verifiedBy || 'Branch Staff'))}</div>
            <div style="font-size: 10px; color: #666; margin-top: 2px;">(Branch Staff Signature & Stamp)</div>
          </div>
          <div style="width: 250px;">
            <div style="border-bottom: 1px solid #000; height: 35px;"></div>
            <div style="font-weight: bold; margin-top: 4px;">Pick Up by:</div>
            <div style="font-size: 11px; color: #444;">${escapeHtml(ret.pickupBy || 'Transporter / Driver')}</div>
            <div style="font-size: 10px; color: #666; margin-top: 2px;">(Transporter Signature / IC / Date)</div>
          </div>
        </div>

        <!-- Footer Notice -->
        <div style="margin-top: 25px; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 4px; display: flex; justify-content: space-between;">
          <span>PMG Pharmacy System Generated DO · Auto-Archived in Company OneDrive</span>
          <span>Proof required for credit note claim</span>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  function closePrintDoModal() {
    document.getElementById('printDoModal')?.classList.add('hidden');
  }

  function executePrintDo() {
    const printArea = document.getElementById('pmgOfficialDoPrintArea');
    if (!printArea) return;

    // Inject dedicated print styles to isolate DO document on clean A4 page
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${activeReturnForDo ? activeReturnForDo.doNumber : 'PMG_DO'}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm 15mm 15mm 15mm; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          table { border-collapse: collapse; }
        </style>
      </head>
      <body>
        ${printArea.outerHTML}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.frameElement.remove(); }, 1500);
          };
        <\/script>
      </body>
      </html>
    `);
    doc.close();
  }

  // ─── MODAL 2B: LARGE BOX / CARTON SHIPPING LABELS GENERATOR ──────────────────
  let activeReturnForLabels = null;
  let activeCartonTemplate = 'SSJ_NORMAL';

  const SSJ_TEMPLATES_CONFIG = {
    SSJ_NORMAL: {
      title: 'PLEASE USE THIS TEMPLATE WHEN DO NORMAL STOCK RETURN',
      category: 'RETURN STOCK',
      to: 'SSJ PHARMA SDN BHD (SCD)',
      attn: 'MR DOUGLAS',
      showRemarks: false,
      dateLabel: 'DATE RETURN',
      badgeText: 'SSJ WAREHOUSE VERIFIED',
      caution: '⚠️ PHARMACEUTICAL RETURN GOODS · RETURNING TO SSJ WAREHOUSE · HANDLE WITH CARE ⚠️',
      // Exact HQ Color Palette (Orange/Amber: #FFC000)
      categoryBg: '#FFC000',
      categoryColor: '#000000',
      fromBg: '#FFC000',
      fromColor: '#000000',
      toBg: '#FFFFFF',
      toColor: '#000000',
      attnBg: '#FFFFFF',
      attnColor: '#000000',
      dateBg: '#FFFFFF',
      dateColor: '#000000',
      excelFileName: 'TEMPLATE USE FOR NORMAL STOCK RETURN SSJ.xlsx'
    },
    SSJ_AGING: {
      title: 'PLEASE USE THIS TEMPLATE WHEN DO NORMAL STOCK RETURN',
      category: 'RETURN STOCK (AGING STOCK WITH LONGER EXPIRY > 1 YEARS)',
      to: 'SSJ PHARMA SDN BHD (SCD)',
      attn: 'MR DOUGLAS',
      showRemarks: false,
      dateLabel: 'DATE RETURN',
      badgeText: 'SSJ WAREHOUSE AGING STOCK',
      caution: '⚠️ RETURN STOCK (AGING WITH LONG EXPIRY > 1 YR) · SSJ WAREHOUSE VERIFIED ⚠️',
      // Exact HQ Color Palette (Orange/Amber: #FFC000)
      categoryBg: '#FFC000',
      categoryColor: '#000000',
      fromBg: '#FFC000',
      fromColor: '#000000',
      toBg: '#FFFFFF',
      toColor: '#000000',
      attnBg: '#FFFFFF',
      attnColor: '#000000',
      dateBg: '#FFFFFF',
      dateColor: '#000000',
      excelFileName: 'TEMPLATE USE FOR AGING STOCK WITH LONGER EXPIRY.xlsx'
    },
    SSJ_RECALL: {
      title: 'PLEASE USE THIS TEMPLATE WHEN DO ANY RETURN STOCK (PRODUCT RECALL) TO SSJ',
      category: 'PRODUCT RECALL',
      to: 'SSJ PHARMA SDN BHD (SCD)',
      attn: 'MR DOUGLAS',
      showRemarks: true,
      remarks: 'HANDLE WITH CARE-FRAGILE ITEM',
      remarksBg: '#FFFFFF',
      remarksColor: '#000000',
      showDeadline: false,
      dateLabel: 'DATE RETURN',
      badgeText: 'SSJ URGENT PRODUCT RECALL',
      caution: '🚨 URGENT PRODUCT RECALL RETURN GOODS · PRIORITY SSJ WAREHOUSE RECEIVING 🚨',
      // Exact HQ Color Palette (Category: Red #FF0000, From/Date: Yellow #FFFF00)
      categoryBg: '#FF0000',
      categoryColor: '#000000',
      fromBg: '#FFFF00',
      fromColor: '#000000',
      toBg: '#FFFFFF',
      toColor: '#000000',
      attnBg: '#FFFFFF',
      attnColor: '#000000',
      dateBg: '#FFFF00',
      dateColor: '#000000',
      excelFileName: 'TEMPLATE USE FOR PRODUCT RECALL TO SSJ.xlsx'
    },
    INTERBRANCH: {
      title: 'PLEASE USE THIS TEMPLATE WHEN DO STOCK IN-TRANSIT',
      category: 'IN-TRANSIT',
      to: null, // dynamic
      attn: null, // dynamic
      showRemarks: false,
      dateLabel: 'DATE PASS TO DRIVER',
      badgeText: 'INTERBRANCH TRANSIT',
      caution: '🚚 INTERBRANCH STOCK IN-TRANSIT · OUTLET TO OUTLET DIRECT TRANSFER 🚚',
      // Exact HQ Color Palette (Category & TO: Light Green #92D050)
      categoryBg: '#92D050',
      categoryColor: '#000000',
      fromBg: '#FFFFFF',
      fromColor: '#000000',
      toBg: '#92D050',
      toColor: '#000000',
      attnBg: '#FFFFFF',
      attnColor: '#000000',
      dateBg: '#FFFFFF',
      dateColor: '#000000',
      excelFileName: 'TEMPLATE USE FOR INTERBRANCH TRANSIT OUTLET TO OUTLET.xlsx'
    }
  };

  function onCartonTemplateChanged(templateKey) {
    activeCartonTemplate = templateKey || 'SSJ_NORMAL';
    renderCartonLabelsHtml(activeCartonTemplate);
  }

  function renderCartonLabelsHtml(templateKey) {
    const container = document.getElementById('printCartonLabelsContainer');
    if (!container || !activeReturnForLabels) return;

    const ret = activeReturnForLabels;
    const totalCartons = Math.max(1, ret.totalCartons || 1);
    const prnList = Array.from(new Set((ret.items || []).map(i => i.prnNumber).filter(Boolean))).join(', ');
    const tpl = templateKey || activeCartonTemplate || 'SSJ_NORMAL';

    let labelsHtml = '';

    for (let c = 1; c <= totalCartons; c++) {
      const itemsInThisCarton = (ret.items || []).filter(item => {
        const cNum = parseInt(String(item.cartonNo || 1).replace(/\D/g, ''), 10) || 1;
        return cNum === c;
      });

      if (tpl === 'VENDOR_STANDARD') {
        // Standard Non-SSJ / Generic Vendor Shipping Label
        labelsHtml += `
          <div class="carton-shipping-box" style="page-break-inside: avoid !important; break-inside: avoid !important; page-break-after: always; break-after: page; width: 100%; max-width: 610px; margin: 0 auto 16px auto; border: 3px solid #000; padding: 12px 14px; font-family: Arial, sans-serif; background: #fff; box-sizing: border-box; box-shadow: 0 3px 8px rgba(0,0,0,0.06);">
            <!-- Top Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #000; padding-bottom: 8px; margin-bottom: 10px;">
              <div style="font-size: 16px; font-weight: 900; letter-spacing: 0.5px;">🚚 CARTON SHIPPING / DELIVERY LABEL</div>
              <div style="font-size: 12px; font-weight: 900; background: #000; color: #fff; padding: 4px 10px; border-radius: 4px;">PMG PHARMACY</div>
            </div>

            <!-- DESTINATION (SHIP TO) -->
            <div style="border: 2.5px solid #000; padding: 10px 12px; background: #fafafa; margin-bottom: 10px;">
              <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #444; letter-spacing: 1px; border-bottom: 1.5px dashed #999; padding-bottom: 4px; margin-bottom: 6px;">
                SHIP TO / DELIVER TO (DESTINATION):
              </div>
              <div style="font-size: 20px; font-weight: 900; color: #000; line-height: 1.2; text-transform: uppercase; margin-bottom: 4px;">
                ${escapeHtml(ret.destCompany || ret.supplier || 'N/A')}
              </div>
              <div style="font-size: 12.5px; font-weight: 700; color: #111; line-height: 1.3; text-transform: uppercase;">
                ${ret.destAddress ? escapeHtml(ret.destAddress) : '<span style="color: #666; font-style: italic; font-size: 12px;">(DESTINATION WAREHOUSE TO BE CONFIRMED BY VENDOR / TRANSPORTER)</span>'}
              </div>
              ${(ret.destAttn || ret.destPhone) ? `
                <div style="margin-top: 8px; padding-top: 6px; border-top: 1.5px dashed #999; font-size: 12.5px; font-weight: 900; display: flex; gap: 20px; flex-wrap: wrap;">
                  ${ret.destAttn ? `<div>ATTN: <span style="font-size: 14px; text-decoration: underline;">${escapeHtml(ret.destAttn)}</span></div>` : ''}
                  ${ret.destPhone ? `<div>TEL: <span style="font-size: 14px; font-family: monospace;">${escapeHtml(ret.destPhone)}</span></div>` : ''}
                </div>
              ` : ''}
            </div>

            <!-- SENDER & CARTON BADGE ROW -->
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <div style="flex: 1.2; border: 2px solid #000; padding: 8px 10px; background: #fff;">
                <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #444; border-bottom: 1px solid #bbb; padding-bottom: 3px; margin-bottom: 4px;">
                  SENDER (FROM):
                </div>
                <div style="font-size: 13px; font-weight: 900; text-transform: uppercase;">${escapeHtml(ret.companyName || ('PMG PHARMACY (' + (ret.branch || 'BRANCH') + ')'))}</div>
                <div style="font-size: 10.5px; font-weight: 600; text-transform: uppercase; margin-top: 2px; color: #222;">${escapeHtml(ret.companyAddress || 'Sarawak, Malaysia')}</div>
                <div style="font-size: 10.5px; font-weight: bold; margin-top: 4px; color: #000;">BRANCH PIC: ${escapeHtml(cleanStaffTitle(ret.verifiedBy || 'Branch Pharmacist'))}</div>
              </div>

              <div style="flex: 1; border: 2.5px solid #000; background: #f4f4f4; padding: 8px 10px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #333;">CARTON IDENTIFIER</div>
                <div style="font-size: 26px; font-weight: 900; color: #000; line-height: 1.1; margin: 3px 0;">
                  CARTON ${c} OF ${totalCartons}
                </div>
                <div style="font-size: 10px; font-weight: 900; background: #000; color: #fff; padding: 2px 8px; border-radius: 3px;">
                  TOTAL ${totalCartons} CARTON(S)
                </div>
              </div>
            </div>

            <!-- SHIPMENT METADATA BAR -->
            <div style="display: flex; justify-content: space-between; align-items: center; border: 2px solid #000; padding: 6px 12px; font-size: 12px; font-weight: 900; margin-bottom: 10px; background: #fff;">
              <div>DO NO: <span style="font-family: monospace; font-size: 13.5px; color: #0d47a1;">${escapeHtml(ret.doNumber)}</span></div>
              <div>DATE: <span>${escapeHtml(ret.date)}</span></div>
              <div>PRN REF: <span style="font-family: monospace; color: #92400e;">${prnList || 'N/A'}</span></div>
            </div>

            <!-- PACKED ITEMS IN CARTON -->
            ${itemsInThisCarton.length > 0 ? `
              <div style="border: 1.5px solid #000; margin-bottom: 10px; background: #fff; font-size: 11px;">
                <div style="background: #e2e8f0; padding: 4px 8px; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; color: #1e293b; border-bottom: 1px solid #000; display: flex; justify-content: space-between;">
                  <span>📦 PACKED ITEMS IN CARTON ${c}:</span>
                  <span>${itemsInThisCarton.length} SKU(S)</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                  <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #000;">
                      <th style="padding: 3px 6px; text-align: left; width: 90px; border-right: 1px solid #ddd; font-size: 9.5px;">ITEM CODE</th>
                      <th style="padding: 3px 6px; text-align: left; border-right: 1px solid #ddd; font-size: 9.5px;">ITEM DESCRIPTION</th>
                      <th style="padding: 3px 6px; text-align: center; width: 75px; border-right: 1px solid #ddd; font-size: 9.5px;">PRN NO</th>
                      <th style="padding: 3px 6px; text-align: right; width: 60px; border-right: 1px solid #ddd; font-size: 9.5px;">QTY</th>
                      <th style="padding: 3px 6px; text-align: center; width: 85px; font-size: 9.5px;">REASON</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsInThisCarton.map(it => {
                      const rCfg = getReasonConfig(it.reason);
                      return `
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 3px 6px; font-family: monospace; font-weight: bold; border-right: 1px solid #ddd;">${escapeHtml(it.itemCode || '-')}</td>
                        <td style="padding: 3px 6px; font-weight: 600; border-right: 1px solid #ddd;">${escapeHtml(it.itemDescription || '')}</td>
                        <td style="padding: 3px 6px; text-align: center; font-family: monospace; font-weight: bold; border-right: 1px solid #ddd;">${escapeHtml(it.prnNumber || '-')}</td>
                        <td style="padding: 3px 6px; text-align: right; font-weight: bold; border-right: 1px solid #ddd;">${it.quantity || 1} ${escapeHtml(it.uom || 'BOX')}</td>
                        <td style="padding: 3px 6px; text-align: center;">
                          <span style="background: ${rCfg.bgColor}; color: ${rCfg.textColor}; font-weight: 800; padding: 1.5px 5px; border-radius: 2px; font-size: 9.5px; display: inline-block; border: 1px solid ${rCfg.borderColor};">
                            ${escapeHtml(rCfg.shortLabel)}
                          </span>
                        </td>
                      </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- SPECIAL HANDLING WARNING -->
            <div style="border: 2px dashed #d32f2f; background: #fff5f5; color: #b71c1c; padding: 6px 8px; text-align: center; font-weight: 900; font-size: 11px; letter-spacing: 0.5px; line-height: 1.25;">
              ⚠️ PHARMACEUTICAL RETURN GOODS · HANDLE WITH CARE · KEEP DRY · DO NOT DROP ⚠️
            </div>
          </div>
        `;
      } else {
        // Official SSJ Templates: SSJ_NORMAL, SSJ_AGING, SSJ_RECALL, INTERBRANCH
        const cfg = SSJ_TEMPLATES_CONFIG[tpl] || SSJ_TEMPLATES_CONFIG.SSJ_NORMAL;
        const targetTo = (ret.destCompany && ret.destCompany.trim()) ? ret.destCompany.trim() : (tpl === 'INTERBRANCH' ? 'PMG PHARMACY (RECEIVING BRANCH)' : (cfg.to || 'SSJ PHARMA SDN BHD (SCD)'));
        const targetAttn = (ret.destAttn && ret.destAttn.trim()) ? ret.destAttn.trim() : (tpl === 'INTERBRANCH' ? 'BRANCH PHARMACIST / PIC' : (cfg.attn || 'MR DOUGLAS'));

        labelsHtml += `
          <div class="carton-shipping-box" style="page-break-inside: avoid !important; break-inside: avoid !important; page-break-after: always; break-after: page; width: 100%; max-width: 610px; margin: 0 auto 16px auto; border: 3px solid #000; padding: 12px 14px; font-family: Arial, sans-serif; background: #fff; box-sizing: border-box; box-shadow: 0 3px 8px rgba(0,0,0,0.06);">
            
            <!-- Red Italic Header Banner (Exact wording from HQ Excel Template) -->
            <div style="color: #c00000; font-size: 12px; font-weight: 900; font-style: italic; text-align: center; margin-bottom: 8px; letter-spacing: 0.5px; text-transform: uppercase;">
              ${cfg.title}
            </div>

            <!-- Official HQ Specification Table with Exact Color Coding -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 2px solid #000;">
              <tbody>
                <tr>
                  <td style="width: 175px; padding: 5px 8px; font-size: 11px; font-weight: 900; background: ${cfg.categoryBg}; border: 1px solid #000; text-transform: uppercase; color: ${cfg.categoryColor};">
                    CATEGORY RETURN
                  </td>
                  <td style="padding: 5px 8px; font-size: 14px; font-weight: 900; border: 1px solid #000; color: ${cfg.categoryColor}; background: ${cfg.categoryBg}; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${cfg.category}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 8px; font-size: 11px; font-weight: 900; background: ${cfg.fromBg}; border: 1px solid #000; text-transform: uppercase; color: ${cfg.fromColor};">
                    FROM
                  </td>
                  <td style="padding: 5px 8px; font-size: 13.5px; font-weight: 900; border: 1px solid #000; color: ${cfg.fromColor}; background: ${cfg.fromBg}; text-transform: uppercase;">
                    <div>${escapeHtml(ret.companyName || ('PMG PHARMACY (' + (ret.branch || 'BRANCH') + ')'))}</div>
                    <div style="font-size: 10px; font-weight: 600; opacity: 0.85; margin-top: 1px;">${escapeHtml(ret.companyAddress || 'Sarawak, Malaysia')}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 8px; font-size: 11px; font-weight: 900; background: ${cfg.toBg}; border: 1px solid #000; text-transform: uppercase; color: ${cfg.toColor};">
                    TO
                  </td>
                  <td style="padding: 5px 8px; font-size: 14px; font-weight: 900; border: 1px solid #000; color: ${cfg.toColor}; background: ${cfg.toBg}; text-transform: uppercase;">
                    ${escapeHtml(targetTo)}
                    ${ret.destAddress && targetTo !== 'SSJ PHARMA SDN BHD (SCD)' ? `<div style="font-size: 10px; font-weight: 600; opacity: 0.85; margin-top: 1px;">${escapeHtml(ret.destAddress)}</div>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 8px; font-size: 11px; font-weight: 900; background: ${cfg.attnBg}; border: 1px solid #000; text-transform: uppercase; color: ${cfg.attnColor};">
                    ATTENTION
                  </td>
                  <td style="padding: 5px 8px; font-size: 13.5px; font-weight: 900; border: 1px solid #000; color: ${cfg.attnColor}; background: ${cfg.attnBg}; text-transform: uppercase;">
                    ${escapeHtml(targetAttn)}
                    ${ret.destPhone ? `<span style="font-size: 11px; font-weight: bold; margin-left: 8px; font-family: monospace;">(TEL: ${escapeHtml(ret.destPhone)})</span>` : ''}
                  </td>
                </tr>
                ${cfg.showRemarks ? `
                  <tr>
                    <td style="padding: 5px 8px; font-size: 11px; font-weight: 900; background: ${cfg.remarksBg || '#FFFFFF'}; border: 1px solid #000; text-transform: uppercase; color: ${cfg.remarksColor || '#000'};">
                      REMARKS
                    </td>
                    <td style="padding: 5px 8px; font-size: 12px; font-weight: 900; border: 1px solid #000; color: ${cfg.remarksColor || '#000'}; background: ${cfg.remarksBg || '#FFFFFF'}; text-transform: uppercase;">
                      ${cfg.remarks || 'HANDLE WITH CARE-FRAGILE ITEM'}${ret.remarks ? ' · ' + escapeHtml(ret.remarks) : ''}
                    </td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="padding: 5px 8px; font-size: 11px; font-weight: 900; background: ${cfg.dateBg}; border: 1px solid #000; text-transform: uppercase; color: ${cfg.dateColor};">
                    ${cfg.dateLabel}
                  </td>
                  <td style="padding: 5px 8px; font-size: 13px; font-weight: 900; border: 1px solid #000; color: ${cfg.dateColor}; background: ${cfg.dateBg}; text-transform: uppercase;">
                    ${escapeHtml(ret.date)}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Carton Identifier & DO Summary Row -->
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <div style="flex: 1; border: 2.5px solid #000; background: #f8fafc; padding: 8px 10px; text-align: center;">
                <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #475569; letter-spacing: 0.8px;">CARTON IDENTIFIER</div>
                <div style="font-size: 26px; font-weight: 900; color: #000; line-height: 1.1; margin: 3px 0;">CARTON ${c} OF ${totalCartons}</div>
                <div style="font-size: 10px; font-weight: 900; background: #000; color: #fff; display: inline-block; padding: 2px 8px; border-radius: 3px;">TOTAL ${totalCartons} CARTON(S)</div>
              </div>
              <div style="flex: 1.2; border: 2.5px solid #000; background: #fff; padding: 8px 10px; display: flex; flex-direction: column; justify-content: center;">
                <div style="font-size: 12px; font-weight: 900; margin-bottom: 3px;">DO NUMBER: <span style="font-family: monospace; font-size: 13.5px; color: #0d47a1;">${escapeHtml(ret.doNumber)}</span></div>
                <div style="font-size: 12px; font-weight: 900; margin-bottom: 3px;">PRN REF: <span style="font-family: monospace; font-size: 12px; color: #92400e;">${prnList || 'N/A'}</span></div>
                <div style="font-size: 11px; font-weight: bold; color: #475569;">BRANCH PIC: ${escapeHtml(cleanStaffTitle(ret.verifiedBy || 'Branch Pharmacist'))}</div>
              </div>
            </div>

            <!-- PACKED ITEMS IN CARTON (RECEIVING WAREHOUSE CHECKLIST) -->
            ${itemsInThisCarton.length > 0 ? `
              <div style="border: 1.5px solid #000; margin-bottom: 10px; background: #fff; font-size: 11px;">
                <div style="background: #e2e8f0; padding: 4px 8px; font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; color: #1e293b; border-bottom: 1px solid #000; display: flex; justify-content: space-between;">
                  <span>📦 PACKED ITEMS IN CARTON ${c}:</span>
                  <span>${itemsInThisCarton.length} SKU(S)</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                  <thead>
                    <tr style="background: #f8fafc; border-bottom: 1px solid #000;">
                      <th style="padding: 3px 6px; text-align: left; width: 90px; border-right: 1px solid #ddd; font-size: 9.5px;">ITEM CODE</th>
                      <th style="padding: 3px 6px; text-align: left; border-right: 1px solid #ddd; font-size: 9.5px;">ITEM DESCRIPTION</th>
                      <th style="padding: 3px 6px; text-align: center; width: 75px; border-right: 1px solid #ddd; font-size: 9.5px;">PRN NO</th>
                      <th style="padding: 3px 6px; text-align: right; width: 60px; border-right: 1px solid #ddd; font-size: 9.5px;">QTY</th>
                      <th style="padding: 3px 6px; text-align: center; width: 85px; font-size: 9.5px;">REASON</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsInThisCarton.map(it => {
                      const rCfg = getReasonConfig(it.reason);
                      return `
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 3px 6px; font-family: monospace; font-weight: bold; border-right: 1px solid #ddd;">${escapeHtml(it.itemCode || '-')}</td>
                        <td style="padding: 3px 6px; font-weight: 600; border-right: 1px solid #ddd;">${escapeHtml(it.itemDescription || '')}</td>
                        <td style="padding: 3px 6px; text-align: center; font-family: monospace; font-weight: bold; border-right: 1px solid #ddd;">${escapeHtml(it.prnNumber || '-')}</td>
                        <td style="padding: 3px 6px; text-align: right; font-weight: bold; border-right: 1px solid #ddd;">${it.quantity || 1} ${escapeHtml(it.uom || 'BOX')}</td>
                        <td style="padding: 3px 6px; text-align: center;">
                          <span style="background: ${rCfg.bgColor}; color: ${rCfg.textColor}; font-weight: 800; padding: 1.5px 5px; border-radius: 2px; font-size: 9.5px; display: inline-block; border: 1px solid ${rCfg.borderColor};">
                            ${escapeHtml(rCfg.shortLabel)}
                          </span>
                        </td>
                      </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- SPECIAL HANDLING WARNING -->
            <div style="border: 2px dashed #000; background: #fffbeb; color: #000; padding: 6px 8px; text-align: center; font-weight: 900; font-size: 11px; letter-spacing: 0.5px; line-height: 1.25;">
              ${cfg.caution}
            </div>
          </div>
        `;
      }
    }

    container.innerHTML = labelsHtml;
  }

  function openPrintCartonLabelModal(returnId) {
    console.log('[PMG Returns] openPrintCartonLabelModal triggered with ID:', returnId);
    const id = returnId || (activeReturnForDo ? activeReturnForDo.id : null) || (activeReturnForLabels ? activeReturnForLabels.id : null);
    let ret = returnsData.find(r => r.id === id);
    if (!ret && returnsData.length > 0) {
      ret = returnsData[0];
    }
    if (!ret) {
      alert('Please create or select a return record first to generate box labels.');
      return;
    }
    activeReturnForLabels = ret;

    const modal = document.getElementById('printCartonLabelModal');
    const container = document.getElementById('printCartonLabelsContainer');
    if (!modal || !container) {
      console.error('[PMG Returns] Carton label modal elements missing in DOM:', { modal, container });
      return;
    }

    // Auto-detect template based on destination and reasons
    let detectedTemplate = 'SSJ_NORMAL';
    const destUpper = ((ret.destCompany || '') + ' ' + (ret.supplier || '')).toUpperCase();
    const hasTransit = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('transit'));
    const hasRecall = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('recall'));
    const hasAging = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('slow') || (it.reason || '').toLowerCase().includes('aging'));

    if (hasTransit) {
      detectedTemplate = 'INTERBRANCH';
    } else if (destUpper.includes('SSJ')) {
      if (hasRecall) detectedTemplate = 'SSJ_RECALL';
      else if (hasAging) detectedTemplate = 'SSJ_AGING';
      else detectedTemplate = 'SSJ_NORMAL';
    } else if (destUpper.includes('PMG') || destUpper.includes('BRANCH') || destUpper.includes('SENTOSA') || destUpper.includes('OUTLET')) {
      detectedTemplate = 'INTERBRANCH';
    } else {
      detectedTemplate = 'VENDOR_STANDARD';
    }

    activeCartonTemplate = detectedTemplate;
    const tplSelect = document.getElementById('cartonLabelTemplateSelect');
    if (tplSelect) {
      tplSelect.value = detectedTemplate;
    }

    renderCartonLabelsHtml(activeCartonTemplate);
    modal.classList.remove('hidden');
  }

  function closePrintCartonLabelModal() {
    const modal = document.getElementById('printCartonLabelModal');
    if (modal) modal.classList.add('hidden');
  }

  function executePrintCartonLabels() {
    const container = document.getElementById('printCartonLabelsContainer');
    if (!container || !container.innerHTML.trim()) return;

    const printStyles = `
      @page {
        size: A4 portrait;
        margin: 6mm;
      }
      * {
        box-sizing: border-box !important;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #fff;
        font-family: Arial, sans-serif;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .carton-shipping-box {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        break-inside: avoid-page !important;
        page-break-after: always !important;
        break-after: page !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
      }
      .carton-shipping-box:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    `;

    try {
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const doc = printFrame.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PMG_Carton_Labels_${activeReturnForLabels ? activeReturnForLabels.doNumber : 'Cartons'}</title>
          <style>${printStyles}</style>
        </head>
        <body>
          ${container.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 250);
              setTimeout(function() {
                if (window.frameElement) window.frameElement.remove();
              }, 4000);
            };
          <\/script>
        </body>
        </html>
      `);
      doc.close();
    } catch (err) {
      console.warn('Iframe print fallback to window.open', err);
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>PMG_Carton_Labels_${activeReturnForLabels ? activeReturnForLabels.doNumber : 'Cartons'}</title>
            <style>${printStyles}</style>
          </head>
          <body>
            ${container.innerHTML}
            <script>
              window.onload = function() {
                window.focus();
                window.print();
              };
            <\/script>
          </body>
          </html>
        `);
        printWin.document.close();
      }
    }
  }

  // ─── HQ EXCEL TEMPLATE GENERATION (.XLSX WITH COLOR CODING) ────────────────
  async function downloadHqExcelTemplate(returnId, templateKey) {
    if (typeof ExcelJS === 'undefined') {
      alert('ExcelJS library is still loading. Please try again in a moment.');
      return;
    }

    const id = returnId || (activeReturnForLabels ? activeReturnForLabels.id : null) || (activeReturnForDo ? activeReturnForDo.id : null);
    let ret = returnsData.find(r => r.id === id);
    if (!ret && returnsData.length > 0) ret = returnsData[0];
    if (!ret) {
      alert('Please create or select a return record first.');
      return;
    }

    // Auto-detect template if not passed explicitly
    const destUpper = ((ret.destCompany || '') + ' ' + (ret.supplier || '')).toUpperCase();
    const hasTransit = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('transit'));
    const hasRecall = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('recall'));
    const hasAging = (ret.items || []).some(it => (it.reason || '').toLowerCase().includes('slow') || (it.reason || '').toLowerCase().includes('aging'));
    let defaultTpl = 'SSJ_NORMAL';
    if (hasTransit) {
      defaultTpl = 'INTERBRANCH';
    } else if (destUpper.includes('SSJ')) {
      if (hasRecall) defaultTpl = 'SSJ_RECALL';
      else if (hasAging) defaultTpl = 'SSJ_AGING';
      else defaultTpl = 'SSJ_NORMAL';
    } else if (destUpper.includes('PMG') || destUpper.includes('BRANCH') || destUpper.includes('SENTOSA') || destUpper.includes('OUTLET')) {
      defaultTpl = 'INTERBRANCH';
    }

    const tpl = templateKey || activeCartonTemplate || defaultTpl;
    const cfg = SSJ_TEMPLATES_CONFIG[tpl] || SSJ_TEMPLATES_CONFIG.SSJ_NORMAL;
    const targetTo = (ret.destCompany && ret.destCompany.trim()) ? ret.destCompany.trim() : (tpl === 'INTERBRANCH' ? 'PMG PHARMACY (RECEIVING BRANCH)' : (cfg.to || 'SSJ PHARMA SDN BHD (SCD)'));
    const targetAttn = (ret.destAttn && ret.destAttn.trim()) ? ret.destAttn.trim() : (tpl === 'INTERBRANCH' ? 'BRANCH PHARMACIST / PIC' : (cfg.attn || 'MR DOUGLAS'));
    const senderFrom = ret.companyName || ('PMG PHARMACY (' + (ret.branch || 'BRANCH') + ')');

    const wb = new ExcelJS.Workbook();
    wb.creator = 'PMG Management Hub';
    const ws = wb.addWorksheet('DO Template', {
      views: [{ showGridLines: true }]
    });

    // Match column proportions from HQ spreadsheet photos
    ws.columns = [
      { width: 5 },   // A (gutter)
      { width: 28 },  // B (Field Label)
      { width: 5 },   // C (spacer)
      { width: 52 },  // D (Field Value)
      { width: 14 },  // E
      { width: 14 }   // F
    ];

    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    function hexToArgb(hex) {
      if (!hex) return 'FFFFFFFF';
      const clean = hex.replace('#', '');
      return clean.length === 6 ? 'FF' + clean.toUpperCase() : clean.toUpperCase();
    }

    function addHqRow(rowNum, label, value, fillHexLabel, fillHexVal, isValBold = true) {
      const cellLabel = ws.getCell(`B${rowNum}`);
      const cellVal = ws.getCell(`D${rowNum}`);
      
      cellLabel.value = label;
      cellLabel.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
      cellLabel.alignment = { vertical: 'middle', horizontal: 'center' };
      cellLabel.border = thinBorder;
      if (fillHexLabel && fillHexLabel !== '#FFFFFF') {
        cellLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexToArgb(fillHexLabel) } };
      }

      cellVal.value = value;
      cellVal.font = { name: 'Arial', size: 12, bold: isValBold, color: { argb: 'FF000000' } };
      cellVal.alignment = { vertical: 'middle', horizontal: 'center' };
      cellVal.border = thinBorder;
      if (fillHexVal && fillHexVal !== '#FFFFFF') {
        cellVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexToArgb(fillHexVal) } };
      }
      ws.getRow(rowNum).height = 24;
    }

    // Row 1: Header Title in Red Italic Bold
    ws.mergeCells('B1:D1');
    const headerCell = ws.getCell('B1');
    headerCell.value = cfg.title;
    headerCell.font = { name: 'Arial', size: 12, italic: true, bold: true, color: { argb: 'FFC00000' } };
    headerCell.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 22;

    // Row 3: CATEGORY RETURN
    addHqRow(3, 'CATEGORY RETURN', cfg.category, cfg.categoryBg, cfg.categoryBg, true);

    // Row 5: FROM
    addHqRow(5, 'FROM', senderFrom, cfg.fromBg, cfg.fromBg, true);

    // Row 7: TO
    addHqRow(7, 'TO', targetTo, cfg.toBg, cfg.toBg, true);

    // Row 9: ATTENTION
    addHqRow(9, 'ATTENTION', targetAttn, cfg.attnBg, cfg.attnBg, true);

    let nextRow = 11;
    if (cfg.showRemarks) {
      addHqRow(nextRow, 'REMARKS', cfg.remarks || 'HANDLE WITH CARE-FRAGILE ITEM', cfg.remarksBg, cfg.remarksBg, true);
      nextRow += 2;
    }

    // Date Row
    addHqRow(nextRow, cfg.dateLabel, ret.date || '', cfg.dateBg, cfg.dateBg, true);

    // Items table below if items exist
    if (Array.isArray(ret.items) && ret.items.length > 0) {
      nextRow += 2;
      ws.getCell(`B${nextRow}`).value = `DO: ${ret.doNumber} · PRN: ${Array.from(new Set(ret.items.map(i => i.prnNumber).filter(Boolean))).join(', ') || 'N/A'}`;
      ws.getCell(`B${nextRow}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
      nextRow++;

      const itemHeaders = ['CTN NO', 'ITEM CODE', 'ITEM DESCRIPTION', 'QTY', 'UOM', 'REASON'];
      const colKeys = ['A', 'B', 'C', 'D', 'E', 'F'];
      itemHeaders.forEach((h, idx) => {
        const c = ws.getCell(`${colKeys[idx]}${nextRow}`);
        c.value = h;
        c.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        c.alignment = { vertical: 'middle', horizontal: idx === 1 || idx === 2 ? 'left' : 'center' };
        c.border = thinBorder;
      });
      ws.getRow(nextRow).height = 20;

      ret.items.forEach(it => {
        nextRow++;
        const rCfg = getReasonConfig(it.reason);
        const rowVals = [
          it.cartonNo || 1,
          it.itemCode || '-',
          it.itemDescription || '',
          it.quantity || 1,
          it.uom || 'BOX',
          rCfg.shortLabel
        ];
        rowVals.forEach((val, idx) => {
          const c = ws.getCell(`${colKeys[idx]}${nextRow}`);
          c.value = val;
          c.font = { name: 'Arial', size: 10, bold: idx === 1 || idx === 3 || idx === 5 };
          c.alignment = { vertical: 'middle', horizontal: idx === 1 || idx === 2 ? 'left' : 'center' };
          c.border = thinBorder;
          if (idx === 5) {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rCfg.excelBg } };
            c.font = { name: 'Arial', size: 10, bold: true, color: { argb: rCfg.excelFont } };
          }
        });
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = cfg.excelFileName || `PMG_DO_${ret.doNumber}.xlsx`;
    if (window.saveAs) {
      window.saveAs(blob, fileName);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // ─── MODAL 3: UPLOAD SIGNED DO / PRN PROOF (ONEDRIVE + CLOUD PROOF LINK) ──────
  function renderUsdExistingProofStatus(ret) {
    const box = document.getElementById('usdExistingProofBox');
    if (!box) return;
    if (!ret || !ret.signedProof || !ret.signedProof.fileName) {
      box.classList.add('hidden');
      box.innerHTML = '';
      return;
    }
    const extraCount = Array.isArray(ret.signedProof.additionalDocs) ? ret.signedProof.additionalDocs.length : 0;
    const allNames = [
      ret.signedProof.fileName,
      ...(Array.isArray(ret.signedProof.additionalDocs) ? ret.signedProof.additionalDocs.map(d => d.fileName).filter(Boolean) : [])
    ].join(', ');
    box.classList.remove('hidden');
    if (ret.signedProof.cloudDocId) {
      box.className = 'rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-wrap items-center justify-between gap-2';
      box.innerHTML = `
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-emerald-600"></i>
          <div>
            <p class="font-bold text-xs">Current Cloud Proof (${1 + extraCount} file${extraCount > 0 ? 's' : ''}): ${escapeHtml(allNames)}</p>
            <p class="text-[11px] text-emerald-700">Synced to WhatsApp Cloud Proof Link. Uploading below will update/replace it.</p>
          </div>
        </div>
      `;
    } else {
      box.className = 'rounded-xl p-3 bg-amber-50 border border-amber-200 text-amber-900 flex flex-wrap items-center justify-between gap-2';
      box.innerHTML = `
        <div class="flex items-center gap-2 flex-1 min-w-[180px]">
          <i class="fa-solid fa-cloud-arrow-up text-amber-600"></i>
          <div>
            <p class="font-bold text-xs">Saved on OneDrive: ${escapeHtml(allNames)}</p>
            <p class="text-[11px] text-amber-800">Not synced to WhatsApp Cloud Link yet. Click Sync or re-select file below.</p>
          </div>
        </div>
        <button type="button" onclick="pmgReturns.syncExistingProofToCloudNow('${escapeHtml(ret.id)}')" class="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shrink-0">
          <i class="fa-solid fa-rotate mr-1"></i>Sync from OneDrive
        </button>
      `;
    }
  }

  function openUploadSignedDoModal(returnId) {
    const ret = returnsData.find(r => r.id === returnId);
    if (!ret) return;
    activeReturnForUpload = ret;

    const modal = document.getElementById('uploadSignedDoModal');
    if (!modal) return;

    document.getElementById('usdDoNumber').textContent = ret.doNumber;
    document.getElementById('usdBranch').textContent = ret.branch;
    document.getElementById('usdSupplier').textContent = ret.supplier;
    document.getElementById('usdDriverName').value = ret.pickupBy || '';
    document.getElementById('usdPickupDate').value = ret.pickupDate || formatTodayDateForDo();
    document.getElementById('usdFileInput').value = '';
    document.getElementById('usdFileNamePreview').textContent = 'No file selected';
    renderUsdExistingProofStatus(ret);

    modal.classList.remove('hidden');
  }

  function closeUploadSignedDoModal() {
    document.getElementById('uploadSignedDoModal')?.classList.add('hidden');
  }

  function formatSelectedFilesLabel(fileList) {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return 'No file selected';
    const totalKb = (files.reduce((acc, f) => acc + (Number(f.size) || 0), 0) / 1024).toFixed(1);
    if (files.length === 1) {
      return `${files[0].name} (${totalKb} KB)`;
    }
    return `${files.length} files: ${files.map(f => f.name).join(', ')} (${totalKb} KB total)`;
  }

  function handleUsdFileSelected(input) {
    const preview = document.getElementById('usdFileNamePreview');
    if (preview && input) {
      preview.textContent = formatSelectedFilesLabel(input.files);
    }
  }

  function handleInlineProofFileSelected(input, previewId) {
    const preview = document.getElementById(previewId);
    if (preview && input) {
      preview.textContent = formatSelectedFilesLabel(input.files);
    }
  }

  // ─── CN REMINDER ELIGIBILITY, SUPPLIER WA CONTACTS & CLOUD PROOF VAULT ───────
  function isStockTransferOrTransit(ret) {
    if (!ret) return false;
    const supplier = String(ret.supplier || '').toLowerCase();
    const dest = String(ret.destCompany || '').toLowerCase();
    if (
      supplier.includes('interbranch') ||
      supplier.includes('stock transfer') ||
      supplier.includes('transfer') ||
      supplier.includes('in-transit') ||
      supplier.includes('in transit') ||
      supplier.includes('pmg pharmacy') ||
      supplier.includes('pmg central')
    ) return true;
    if (
      dest.includes('pmg pharmacy') ||
      dest.includes('pmg healthcare') ||
      dest.includes('central warehouse')
    ) return true;
    const items = Array.isArray(ret.items) ? ret.items : [];
    if (items.length > 0 && items.some(it => {
      const r = String(it.reason || '').toLowerCase();
      return r.includes('transit') || r.includes('transfer');
    })) return true;
    return false;
  }

  function isEligibleForCnReminder(ret) {
    if (!ret) return false;
    if (isStockTransferOrTransit(ret)) return false;
    if (ret.status === 'completed') return false;
    if (String(ret.cnNumber || '').trim() !== '') return false;
    return true;
  }

  function getSupplierContactKey(supplierName) {
    return String(supplierName || '').trim().toUpperCase().replace(/\s+/g, ' ');
  }

  function loadSupplierWaContacts() {
    try {
      const raw = localStorage.getItem(SUPPLIER_WA_CONTACTS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveSupplierWaContact(supplierName, phone, picName) {
    const key = getSupplierContactKey(supplierName);
    if (!key) return;
    const contacts = loadSupplierWaContacts();
    contacts[key] = {
      phone: String(phone || '').trim(),
      picName: String(picName || '').trim(),
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(SUPPLIER_WA_CONTACTS_KEY, JSON.stringify(contacts));
    } catch (_) {}
  }

  function normalizeSupplierWaPhone(rawPhone) {
    const digits = String(rawPhone || '').replace(/\D/g, '');
    if (!digits) return { clean: '', validMobile: false, isLandline: false };
    let clean = digits;
    if (clean.startsWith('0')) {
      clean = '60' + clean.slice(1);
    } else if (clean.startsWith('1') && clean.length >= 9 && clean.length <= 10) {
      clean = '60' + clean;
    }
    const isMyLandline = /^60[3-9]\d{6,8}$/.test(clean) && !clean.startsWith('601');
    const validMobile = /^601\d{8,9}$/.test(clean) || (clean.length >= 10 && !isMyLandline);
    return { clean, validMobile, isLandline: isMyLandline };
  }

  function getUniquePrnNumbers(ret) {
    return Array.from(new Set(
      (ret && Array.isArray(ret.items) ? ret.items : [])
        .map(it => String(it.prnNumber || '').trim())
        .filter(Boolean)
    ));
  }

  function buildPublicDoProofUrl(ret) {
    if (!ret || !ret.id) return PUBLIC_HUB_FALLBACK_URL;
    let baseUrl = PUBLIC_HUB_FALLBACK_URL;
    try {
      if (typeof window !== 'undefined' && window.location && /^https?:$/i.test(window.location.protocol)) {
        const host = String(window.location.hostname || '').toLowerCase();
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          baseUrl = window.location.origin + window.location.pathname;
        }
      }
    } catch (_) {}
    const branchParam = normalizeBranchForSheets(ret.branch || getActiveBranchName() || 'Kota Sentosa');
    return `${baseUrl}?doProof=${encodeURIComponent(ret.id)}&branch=${encodeURIComponent(branchParam)}`;
  }

  function buildSupplierCnReminderMessage(ret, overrides = {}) {
    if (!ret) return '';
    const branchName = ret.branch || 'Kota Sentosa';
    const picName = String(overrides.picName || '').trim()
      || String(ret.destAttn || '').trim()
      || `${ret.supplier || 'Supplier'} Team`;
    const prns = getUniquePrnNumbers(ret);
    const prnText = prns.length > 0 ? prns.join(', ') : 'Refer DO Form';
    const itemCount = (ret.items || []).length;
    const cartons = ret.totalCartons || 1;
    const proofUrl = buildPublicDoProofUrl(ret);
    const senderName = getCurrentUserDisplayName() || 'Pharmacist';
    const hasUploadedProof = Boolean(ret.signedProof && (ret.signedProof.cloudDocId || ret.signedProof.fileName));

    const lines = [
      `Hi ${picName},`,
      '',
      `Gentle reminder from *PMG Pharmacy (${branchName})* regarding our pending Credit Note (CN) for returned goods:`,
      '',
      `• *DO No:* ${ret.doNumber || 'N/A'}`,
      `• *PRN No:* ${prnText}`,
      `• *Return Date:* ${ret.date || 'N/A'}`
    ];

    if (ret.pickupBy || ret.pickupDate) {
      lines.push(`• *Collected By:* ${ret.pickupBy || 'Driver'}${ret.pickupDate ? ` (${ret.pickupDate})` : ''}`);
    }

    lines.push(`• *Summary:* ${itemCount} SKU(s), ${cartons} Carton(s)`);
    lines.push('');
    lines.push(`📄 *Document of Proof (DO + PRN${hasUploadedProof ? ' & Signed Copy' : ''}):*`);
    lines.push(proofUrl);
    lines.push('');
    lines.push(`Kindly assist to check and issue the Credit Note (CN) at your earliest convenience. Thank you!`);
    lines.push(`— ${senderName}, PMG Pharmacy ${branchName}`);

    return lines.join('\n');
  }

  // Strictly blocks SVG/HTML/XML/JS while normalizing scanner PDFs & images whose MIME was empty or octet-stream
  function inferAndNormalizeProofMime(fileName, declaredMime, rawDataStr) {
    if (!rawDataStr) return null;
    let candidate = String(rawDataStr).trim();

    // If an un-updated Apps Script concatenated two data: URIs on fallback appId lookup, pick the latest segment
    if (candidate.indexOf('data:', 5) !== -1) {
      const segments = candidate.split(/(?=data:[A-Za-z0-9/+.-]*;base64,)/i).filter(Boolean);
      if (segments.length > 0) {
        candidate = segments[segments.length - 1].trim();
      }
    }

    const lowerDecl = String(declaredMime || '').trim().toLowerCase();
    const lowerName = String(fileName || '').trim().toLowerCase();

    // Security guard: explicitly forbid SVG, HTML, XML, text, or script payloads
    if (
      lowerDecl.includes('svg') ||
      lowerDecl.includes('html') ||
      lowerDecl.includes('xml') ||
      lowerDecl.includes('javascript') ||
      lowerDecl.startsWith('text/') ||
      lowerName.endsWith('.svg') ||
      lowerName.endsWith('.html') ||
      lowerName.endsWith('.htm') ||
      lowerName.endsWith('.xml') ||
      /^data:(image\/svg|text\/|application\/(javascript|ecmascript|xhtml|xml))/i.test(candidate)
    ) {
      return null;
    }

    let headerMime = '';
    let b64Payload = candidate;
    if (candidate.startsWith('data:')) {
      const commaIdx = candidate.indexOf(',');
      if (commaIdx === -1) return null;
      const meta = candidate.slice(5, commaIdx);
      if (!/;base64/i.test(meta)) return null;
      headerMime = meta.split(';')[0].trim().toLowerCase();
      b64Payload = candidate.slice(commaIdx + 1);
    }

    const cleanB64 = b64Payload.replace(/\s+/g, '');
    if (!cleanB64 || !/^[A-Za-z0-9+/=]+$/.test(cleanB64)) return null;

    // Decode first ~32 chars of base64 to check against disguised SVG/HTML/script payloads
    try {
      if (typeof atob === 'function') {
        const probe = atob(cleanB64.slice(0, 64)).trim().toLowerCase();
        if (probe.startsWith('<svg') || probe.startsWith('<!doctype html') || probe.startsWith('<html') || probe.startsWith('<script') || probe.includes('<svg')) {
          return null;
        }
      }
    } catch (_) {}

    let resolvedMime = '';
    // 1. Magic-byte detection (handles scanner PDFs & OneDrive files with empty/octet-stream MIME)
    if (cleanB64.startsWith('JVBERi0')) {
      resolvedMime = 'application/pdf';
    } else if (cleanB64.startsWith('/9j/')) {
      resolvedMime = 'image/jpeg';
    } else if (cleanB64.startsWith('iVBORw0KGgo')) {
      resolvedMime = 'image/png';
    } else if (cleanB64.startsWith('R0lGOD')) {
      resolvedMime = 'image/gif';
    } else if (cleanB64.startsWith('UklGR')) {
      resolvedMime = 'image/webp';
    }

    // 2. Fallback to safe header/declared MIME or filename extension
    const safeMimes = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
    if (!resolvedMime) {
      if (safeMimes.has(headerMime)) {
        resolvedMime = headerMime === 'image/jpg' ? 'image/jpeg' : headerMime;
      } else if (safeMimes.has(lowerDecl)) {
        resolvedMime = lowerDecl === 'image/jpg' ? 'image/jpeg' : lowerDecl;
      } else if (lowerName.endsWith('.pdf')) {
        resolvedMime = 'application/pdf';
      } else if (/\.(jpe?g|jfif)$/i.test(lowerName)) {
        resolvedMime = 'image/jpeg';
      } else if (lowerName.endsWith('.png')) {
        resolvedMime = 'image/png';
      } else if (lowerName.endsWith('.webp')) {
        resolvedMime = 'image/webp';
      } else if (lowerName.endsWith('.gif')) {
        resolvedMime = 'image/gif';
      }
    }

    if (!resolvedMime || !safeMimes.has(resolvedMime)) return null;
    return {
      mimeType: resolvedMime,
      base64: cleanB64,
      dataUrl: `data:${resolvedMime};base64,${cleanB64}`
    };
  }

  let _pdfJsLoadPromise = null;
  function loadPdfJsLibrary() {
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof document.createElement !== 'function') {
      return Promise.resolve(null);
    }
    if (window.pdfjsLib && typeof window.pdfjsLib.getDocument === 'function') {
      return Promise.resolve(window.pdfjsLib);
    }
    if (_pdfJsLoadPromise) return _pdfJsLoadPromise;

    const CDN_PRIMARY = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    const WORKER_PRIMARY = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const CDN_FALLBACK = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
    const WORKER_FALLBACK = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

    const injectScript = (src, workerSrc) => new Promise((resolve) => {
      try {
        if (!document.head && !document.body) return resolve(null);
        const s = document.createElement('script');
        let settled = false;
        const finish = (lib) => {
          if (settled) return;
          settled = true;
          resolve(lib || null);
        };
        const timer = setTimeout(() => finish(window.pdfjsLib || null), 6000);
        s.src = src;
        s.async = true;
        s.onload = () => {
          clearTimeout(timer);
          if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
          }
          finish(window.pdfjsLib || null);
        };
        s.onerror = () => {
          clearTimeout(timer);
          finish(null);
        };
        (document.head || document.body).appendChild(s);
      } catch (_) {
        resolve(null);
      }
    });

    _pdfJsLoadPromise = injectScript(CDN_PRIMARY, WORKER_PRIMARY).then(lib => {
      if (lib) return lib;
      return injectScript(CDN_FALLBACK, WORKER_FALLBACK);
    }).then(lib => {
      if (!lib) _pdfJsLoadPromise = null;
      return lib;
    });
    return _pdfJsLoadPromise;
  }

  function base64ToUint8Array(cleanB64) {
    const bin = atob(cleanB64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  }

  async function compressOversizedPdfDataUrl(normalizedPdfObj) {
    if (!normalizedPdfObj || !normalizedPdfObj.base64) return normalizedPdfObj;
    try {
      const pdfjsLib = await loadPdfJsLibrary();
      const JsPdfCtor = (typeof window !== 'undefined' && window.jspdf && window.jspdf.jsPDF) || (typeof jsPDF === 'function' ? jsPDF : null);
      if (!pdfjsLib || !JsPdfCtor || typeof document === 'undefined') return normalizedPdfObj;

      const bytes = base64ToUint8Array(normalizedPdfObj.base64);
      const pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
      const maxPages = Math.min(pdfDoc.numPages || 1, 15);
      let outPdf = null;

      for (let p = 1; p <= maxPages; p++) {
        const page = await pdfDoc.getPage(p);
        const vp = page.getViewport({ scale: 1.65 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return normalizedPdfObj;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const pageJpeg = canvas.toDataURL('image/jpeg', 0.78);
        const isLandscape = vp.width > vp.height;
        const ptW = vp.width * 0.75;
        const ptH = vp.height * 0.75;
        if (!outPdf) {
          outPdf = new JsPdfCtor({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'pt', format: [ptW, ptH] });
        } else {
          outPdf.addPage([ptW, ptH], isLandscape ? 'landscape' : 'portrait');
        }
        outPdf.addImage(pageJpeg, 'JPEG', 0, 0, ptW, ptH, undefined, 'FAST');
      }

      if (outPdf) {
        const compressedDataUri = outPdf.output('datauristring');
        const normCompressed = inferAndNormalizeProofMime('compressed.pdf', 'application/pdf', compressedDataUri);
        if (normCompressed && normCompressed.dataUrl.length < normalizedPdfObj.dataUrl.length) {
          return normCompressed;
        }
      }
    } catch (err) {
      console.warn('[PMG Returns] Oversized PDF compression fallback to original PDF:', err && err.message ? err.message : err);
    }
    return normalizedPdfObj;
  }

  function fileToCloudSafeDataUrl(fileOrDoc) {
    return new Promise((resolve, reject) => {
      if (!fileOrDoc) return reject(new Error('No file provided'));

      const processRawDataUrl = async (rawStr, fileName, declaredMime, rawSize) => {
        const normalized = inferAndNormalizeProofMime(fileName, declaredMime, rawStr);
        if (!normalized) {
          return reject(new Error('Unsupported proof file format. Please upload a PDF, JPG, PNG, or WebP document.'));
        }

        // Compress large camera photos using canvas so cloud proof loads fast on supplier mobile while keeping text crisp
        if (normalized.mimeType.startsWith('image/') && typeof document !== 'undefined' && typeof Image !== 'undefined') {
          return new Promise((resImg) => {
            let done = false;
            const finishImg = (payload) => {
              if (done) return;
              done = true;
              resImg(payload);
            };
            const fallbackPayload = {
              dataUrl: normalized.dataUrl,
              mimeType: normalized.mimeType,
              size: rawSize || normalized.dataUrl.length,
              fileName: fileName || 'DO_Proof.jpg'
            };
            const timer = setTimeout(() => finishImg(fallbackPayload), 1500);
            try {
              const img = new Image();
              img.onload = () => {
                clearTimeout(timer);
                try {
                  const maxDim = 1600;
                  let w = img.width || 0;
                  let h = img.height || 0;
                  if ((w > maxDim || h > maxDim || normalized.dataUrl.length > 1600000) && w > 0 && h > 0) {
                    if (w > maxDim || h > maxDim) {
                      const ratio = Math.min(maxDim / w, maxDim / h);
                      w = Math.round(w * ratio);
                      h = Math.round(h * ratio);
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext && canvas.getContext('2d');
                    if (ctx) {
                      ctx.fillStyle = '#FFFFFF';
                      ctx.fillRect(0, 0, w, h);
                      ctx.drawImage(img, 0, 0, w, h);
                      const compressed = canvas.toDataURL('image/jpeg', 0.82);
                      if (compressed && compressed.startsWith('data:image/')) {
                        return finishImg({
                          dataUrl: compressed,
                          mimeType: 'image/jpeg',
                          size: compressed.length,
                          fileName: fileName || 'DO_Proof.jpg'
                        });
                      }
                    }
                  }
                } catch (_) {}
                finishImg(fallbackPayload);
              };
              img.onerror = () => {
                clearTimeout(timer);
                finishImg(fallbackPayload);
              };
              img.src = normalized.dataUrl;
            } catch (_) {
              clearTimeout(timer);
              finishImg(fallbackPayload);
            }
          });
        }

        // Preserve original PDF untouched up to ~2.85MB binary; compress oversized scanner PDFs cleanly if larger
        if (normalized.mimeType === 'application/pdf' && normalized.dataUrl.length > 3800000) {
          const compressedPdf = await compressOversizedPdfDataUrl(normalized);
          return {
            dataUrl: compressedPdf.dataUrl,
            mimeType: 'application/pdf',
            size: compressedPdf.dataUrl.length,
            fileName: fileName || 'DO_Proof.pdf'
          };
        }

        return {
          dataUrl: normalized.dataUrl,
          mimeType: normalized.mimeType,
          size: rawSize || normalized.dataUrl.length,
          fileName: fileName || 'DO_Proof'
        };
      };

      // Support already-cached { dataUrl, fileName, mimeType, size } objects from local IDB
      if (typeof fileOrDoc === 'object' && typeof fileOrDoc.dataUrl === 'string' && !(typeof Blob !== 'undefined' && fileOrDoc instanceof Blob)) {
        processRawDataUrl(
          fileOrDoc.dataUrl,
          fileOrDoc.fileName || fileOrDoc.name || 'DO_Proof',
          fileOrDoc.mimeType || fileOrDoc.type || '',
          fileOrDoc.size || fileOrDoc.dataUrl.length
        ).then(resolve).catch(reject);
        return;
      }

      if (typeof FileReader === 'undefined') {
        return reject(new Error('FileReader unavailable'));
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => {
        processRawDataUrl(
          reader.result,
          fileOrDoc.name || fileOrDoc.fileName || 'DO_Proof',
          fileOrDoc.type || fileOrDoc.mimeType || '',
          fileOrDoc.size || 0
        ).then(resolve).catch(reject);
      };
      reader.readAsDataURL(fileOrDoc);
    });
  }

  async function uploadSignedProofToCloudVault(ret, fileOrDoc, fieldName = 'signedDoProof') {
    if (!PMG_SCHEDULE_API_URL || !ret || !ret.id || !fileOrDoc) return { success: false };
    try {
      const prepared = await fileToCloudSafeDataUrl(fileOrDoc);
      const { dataUrl, mimeType, size, fileName } = prepared;
      if (!dataUrl || dataUrl.length > 9800000) {
        console.warn('[PMG Returns] Signed proof exceeds cloud vault size limit (~7.3MB); skipping cloud upload.');
        return { success: false, reason: 'too_large', dataUrl, mimeType, size, fileName };
      }
      const cleanField = fieldName || 'signedDoProof';
      const uploadName = `${ret.doNumber || ret.id}_${fileName || 'Signed_DO'}`;
      const res = await fetch(PMG_SCHEDULE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'uploadApplicantDoc',
          appId: `DO_PROOF_${ret.id}`,
          doc: {
            field: cleanField,
            name: uploadName,
            type: mimeType,
            size: size,
            data: dataUrl
          }
        }),
        redirect: 'follow'
      });
      if (!res.ok) {
        return { success: false, reason: `http_${res.status}`, dataUrl, mimeType, size, fileName };
      }
      const json = await res.json();
      if (json && json.success && json.docId) {
        return {
          success: true,
          docId: json.docId,
          fileUrl: json.fileUrl || `sheet://doc/${json.docId}`,
          mimeType,
          dataUrl,
          size,
          fileName,
          field: cleanField
        };
      }
      return { success: false, reason: (json && json.error) || 'vault_rejected', dataUrl, mimeType, size, fileName };
    } catch (err) {
      console.warn('[PMG Returns] Cloud proof vault upload warning:', err && err.message ? err.message : err);
      return { success: false, reason: err && err.message ? err.message : 'upload_error' };
    }
  }

  async function attachAndSyncProofFilesToReturn(ret, filesInput, options = {}) {
    const files = filesInput ? Array.from(filesInput).filter(Boolean) : [];
    if (!ret || files.length === 0) return { success: false, uploadedCount: 0 };

    const uploadedMetaList = [];
    const localIdbDocs = [];

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const fieldKey = idx === 0 ? 'signedDoProof' : `signedDoProof_${idx + 1}`;
      const fileDisplayName = file.name || file.fileName || `DO_PRN_Proof_${idx + 1}`;
      let savedPath = `Local_${fileDisplayName}`;
      let oneDriveSaved = false;

      // 1. Save original binary to OneDrive if connected
      if (
        typeof Blob !== 'undefined' &&
        file instanceof Blob &&
        window.pmgOneDriveSync &&
        typeof window.pmgOneDriveSync.saveSignedDoProofToOneDrive === 'function'
      ) {
        try {
          const doSuffix = idx === 0 ? (ret.doNumber || 'DO') : `${ret.doNumber || 'DO'}_Part${idx + 1}`;
          const odRes = await window.pmgOneDriveSync.saveSignedDoProofToOneDrive(file, ret.branch, {
            doNumber: doSuffix,
            vendor: ret.supplier,
            year: new Date().getFullYear(),
            monthFolder: window.pmgOneDriveSync._formatCurrentMonthString ? window.pmgOneDriveSync._formatCurrentMonthString() : undefined
          });
          if (odRes && odRes.success) {
            savedPath = odRes.path;
            oneDriveSaved = true;
          }
        } catch (odErr) {
          console.warn('[PMG Returns] OneDrive proof save skipped (continuing to Cloud Proof Vault):', odErr);
        }
      }

      // 2. Upload normalized image/PDF to Google Cloud Proof Vault
      const cloudRes = await uploadSignedProofToCloudVault(ret, file, fieldKey);
      if (cloudRes.dataUrl) {
        localIdbDocs.push({
          fileName: fileDisplayName,
          mimeType: cloudRes.mimeType || file.type || '',
          size: cloudRes.size || file.size || cloudRes.dataUrl.length,
          dataUrl: cloudRes.dataUrl,
          field: fieldKey
        });
      }

      uploadedMetaList.push({
        fileName: fileDisplayName,
        path: savedPath,
        oneDriveSynced: oneDriveSaved,
        cloudDocId: cloudRes.success ? cloudRes.docId : '',
        cloudFileUrl: cloudRes.success ? cloudRes.fileUrl : '',
        mimeType: cloudRes.mimeType || file.type || '',
        field: fieldKey,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Cache normalized DataURLs locally in dedicated IDB so offline/retry & instant local preview always work
    if (localIdbDocs.length > 0) {
      await saveLocalProofDocsToIdb(ret.id, localIdbDocs);
    }

    const primary = uploadedMetaList[0];
    const extras = uploadedMetaList.slice(1);
    if (options.driverName !== undefined && String(options.driverName).trim()) {
      ret.pickupBy = String(options.driverName).trim();
    } else if (!ret.pickupBy && !options.preservePendingStatus) {
      ret.pickupBy = 'Transporter Driver';
    }
    if (options.pickupDate !== undefined && String(options.pickupDate).trim()) {
      ret.pickupDate = String(options.pickupDate).trim();
    } else if (!ret.pickupDate && !options.preservePendingStatus) {
      ret.pickupDate = formatTodayDateForDo();
    }
    if (ret.status !== 'completed' && !options.preservePendingStatus) {
      ret.status = 'awaiting_cn';
    }

    ret.updatedAt = new Date().toISOString();
    ret.signedProof = {
      fileName: primary.fileName,
      path: primary.path,
      oneDriveSynced: primary.oneDriveSynced,
      cloudDocId: primary.cloudDocId,
      cloudFileUrl: primary.cloudFileUrl,
      mimeType: primary.mimeType,
      ...(extras.length > 0 ? { additionalDocs: extras } : {}),
      timestamp: primary.timestamp
    };

    await saveSingleReturnToDb(ret);
    try { localStorage.setItem('pmg_returns_records_v1', JSON.stringify(returnsData)); } catch (_) {}
    syncReturnsWithOneDrive(ret.branch);
    await syncReturnsWithGoogleSheets(ret.branch, true);

    const cloudSyncedCount = uploadedMetaList.filter(m => Boolean(m.cloudDocId)).length;
    return {
      success: cloudSyncedCount > 0,
      uploadedCount: uploadedMetaList.length,
      cloudSyncedCount,
      oneDriveSaved: uploadedMetaList.some(m => m.oneDriveSynced)
    };
  }

  // Deduplicated OneDrive / Local IDB -> Google Cloud Proof Vault auto-backfill engine
  const inFlightProofSyncs = new Map();
  let isBatchProofBackfillRunning = false;

  async function ensureReturnProofSyncedToCloud(ret, options = {}) {
    if (!ret || !ret.id || !ret.signedProof) {
      return { synced: false, reason: 'no_proof_record' };
    }
    const extras = Array.isArray(ret.signedProof.additionalDocs) ? ret.signedProof.additionalDocs : [];
    const allAlreadyInCloud = Boolean(ret.signedProof.cloudDocId) && extras.every(d => d && d.cloudDocId);
    if (allAlreadyInCloud) {
      return { synced: true, alreadySynced: true, cloudDocId: ret.signedProof.cloudDocId };
    }

    if (inFlightProofSyncs.has(ret.id)) {
      return inFlightProofSyncs.get(ret.id);
    }

    const syncTask = (async () => {
      try {
        let updatedAny = false;

        // 1. Try recovering from local pmg_returns_proof_blobs_db first
        const cachedLocalDocs = await loadLocalProofDocsFromIdb(ret.id);
        if (cachedLocalDocs.length > 0) {
          if (!ret.signedProof.cloudDocId && cachedLocalDocs[0]) {
            const upRes = await uploadSignedProofToCloudVault(ret, cachedLocalDocs[0], cachedLocalDocs[0].field || 'signedDoProof');
            if (upRes.success && upRes.docId) {
              ret.signedProof.cloudDocId = upRes.docId;
              ret.signedProof.cloudFileUrl = upRes.fileUrl;
              ret.signedProof.mimeType = upRes.mimeType || ret.signedProof.mimeType || '';
              updatedAny = true;
            }
          }
          for (let i = 0; i < extras.length; i++) {
            const ex = extras[i];
            const cachedEx = cachedLocalDocs[i + 1];
            if (ex && !ex.cloudDocId && cachedEx) {
              const upEx = await uploadSignedProofToCloudVault(ret, cachedEx, ex.field || `signedDoProof_${i + 2}`);
              if (upEx.success && upEx.docId) {
                ex.cloudDocId = upEx.docId;
                ex.cloudFileUrl = upEx.fileUrl;
                ex.mimeType = upEx.mimeType || ex.mimeType || '';
                updatedAny = true;
              }
            }
          }
        }

        // 2. If still missing cloudDocId, read original PDF/image directly from linked OneDrive DO/ folder
        if (
          !ret.signedProof.cloudDocId &&
          typeof window !== 'undefined' &&
          window.pmgOneDriveSync &&
          typeof window.pmgOneDriveSync.readSignedDoProofFromOneDrive === 'function'
        ) {
          const odRead = await window.pmgOneDriveSync.readSignedDoProofFromOneDrive(
            ret.branch,
            ret.signedProof,
            { doNumber: ret.doNumber, vendor: ret.supplier },
            { interactive: Boolean(options.interactive) }
          );
          if (odRead && odRead.success && odRead.file) {
            const upOd = await uploadSignedProofToCloudVault(ret, odRead.file, 'signedDoProof');
            if (upOd.dataUrl) {
              await saveLocalProofDocsToIdb(ret.id, [{
                fileName: ret.signedProof.fileName || odRead.fileName || odRead.file.name,
                mimeType: upOd.mimeType || odRead.file.type || '',
                size: upOd.size || odRead.file.size || upOd.dataUrl.length,
                dataUrl: upOd.dataUrl,
                field: 'signedDoProof'
              }]);
            }
            if (upOd.success && upOd.docId) {
              ret.signedProof.cloudDocId = upOd.docId;
              ret.signedProof.cloudFileUrl = upOd.fileUrl;
              ret.signedProof.mimeType = upOd.mimeType || ret.signedProof.mimeType || '';
              updatedAny = true;
            }
          }
        }

        if (updatedAny) {
          ret.updatedAt = new Date().toISOString();
          await saveSingleReturnToDb(ret);
          try { localStorage.setItem('pmg_returns_records_v1', JSON.stringify(returnsData)); } catch (_) {}
          if (!options.deferVaultPush) {
            syncReturnsWithOneDrive(ret.branch);
            await syncReturnsWithGoogleSheets(ret.branch, true);
          }
          renderReturnsTable();
          if (activeReturnForUpload && activeReturnForUpload.id === ret.id) {
            renderUsdExistingProofStatus(ret);
          }
          if (activeReturnForReminder && activeReturnForReminder.id === ret.id) {
            renderCnRemProofStatusBanner(ret);
            refreshCnReminderMessagePreview();
          }
          return { synced: true, cloudDocId: ret.signedProof.cloudDocId };
        }

        return { synced: Boolean(ret.signedProof.cloudDocId), reason: 'source_unavailable' };
      } catch (err) {
        console.warn('[PMG Returns] ensureReturnProofSyncedToCloud warning:', err && err.message ? err.message : err);
        return { synced: false, reason: err && err.message ? err.message : 'sync_error' };
      } finally {
        inFlightProofSyncs.delete(ret.id);
      }
    })();

    inFlightProofSyncs.set(ret.id, syncTask);
    return syncTask;
  }

  async function autoBackfillMissingCloudProofs(options = {}) {
    if (isBatchProofBackfillRunning) return { syncedCount: 0 };
    const candidates = (returnsData || []).filter(r => r && r.signedProof && r.signedProof.fileName && !r.signedProof.cloudDocId);
    if (candidates.length === 0) return { syncedCount: 0 };

    // Prioritize pending/awaiting_cn supplier returns so active CN Reminder links become cloud-ready first
    candidates.sort((a, b) => {
      const aScore = isEligibleForCnReminder(a) ? 0 : 1;
      const bScore = isEligibleForCnReminder(b) ? 0 : 1;
      return aScore - bScore;
    });

    isBatchProofBackfillRunning = true;
    const touchedBranches = new Set();
    let syncedCount = 0;
    try {
      for (const ret of candidates) {
        const res = await ensureReturnProofSyncedToCloud(ret, {
          interactive: Boolean(options.interactive),
          deferVaultPush: true
        });
        if (res && res.synced && ret.signedProof && ret.signedProof.cloudDocId) {
          syncedCount++;
          touchedBranches.add(ret.branch || getActiveBranchName());
        }
      }
      for (const br of touchedBranches) {
        syncReturnsWithOneDrive(br);
        await syncReturnsWithGoogleSheets(br, true);
      }
      if (syncedCount > 0) {
        renderReturnsUI();
        console.log(`[PMG Returns] ☁️ Auto-synced ${syncedCount} existing DO/PRN proof document(s) to Cloud Proof Vault.`);
      }
    } finally {
      isBatchProofBackfillRunning = false;
    }
    return { syncedCount };
  }

  async function syncExistingProofToCloudNow(returnId) {
    const ret = returnsData.find(r => r.id === returnId) || activeReturnForReminder || activeReturnForUpload;
    if (!ret || !ret.signedProof) return;
    renderCnRemProofStatusBanner(ret, { syncing: true });
    const res = await ensureReturnProofSyncedToCloud(ret, { interactive: true });
    renderCnRemProofStatusBanner(ret);
    renderUsdExistingProofStatus(ret);
    if (res && res.synced) {
      if (typeof showPmgToast === 'function') {
        showPmgToast(`☁️ Original DO / PRN file (${ret.signedProof.fileName}) synced to Cloud Proof Link!`, 'success');
      }
    } else {
      alert(`Could not automatically read "${ret.signedProof.fileName}" from OneDrive on this device (OneDrive folder may not be linked yet).\n\nPlease select the PDF / image file directly to attach it to the Cloud Proof Link.`);
      const quickInput = document.getElementById('cnRemQuickProofInput') || document.getElementById('usdFileInput');
      if (quickInput && typeof quickInput.click === 'function') quickInput.click();
    }
  }

  async function submitSignedDoProof() {
    if (!activeReturnForUpload) return;

    const fileInput = document.getElementById('usdFileInput');
    const driverName = document.getElementById('usdDriverName').value.trim();
    const pickupDate = document.getElementById('usdPickupDate').value.trim();
    const btn = document.getElementById('usdSubmitBtn');

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert('Please select or photograph the signed DO / PRN document (PDF, JPG, or PNG).');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading to OneDrive &amp; Cloud Link…';

    try {
      const targetRet = activeReturnForUpload;
      const result = await attachAndSyncProofFilesToReturn(targetRet, fileInput.files, {
        driverName: driverName || 'Transporter Driver',
        pickupDate: pickupDate || formatTodayDateForDo(),
        preservePendingStatus: false
      });

      const uploadedId = targetRet.id;
      closeUploadSignedDoModal();
      renderReturnsUI();

      // If Reminder Modal is currently open for the same DO, refresh its status & preview immediately
      if (activeReturnForReminder && activeReturnForReminder.id === uploadedId) {
        const remModal = document.getElementById('cnReminderModal');
        if (remModal && !remModal.classList.contains('hidden')) {
          openCnReminderModal(uploadedId);
        }
      }

      const cloudNote = result.success
        ? `\n☁️ Cloud Proof Link is LIVE (${result.cloudSyncedCount} file${result.cloudSyncedCount > 1 ? 's' : ''}) — suppliers will see the actual uploaded DO/PRN document when clicking your WhatsApp link!`
        : '\n⚠️ Saved locally/OneDrive, but Cloud Link upload could not reach Google Cloud right now. It will auto-retry when online.';
      alert(`✅ DO / PRN proof saved!${cloudNote}\nStatus updated to: "Awaiting Credit Note".`);
    } catch (err) {
      console.error('[PMG Returns] Proof upload error:', err);
      alert('Error saving DO / PRN proof: ' + (err && err.message ? err.message : 'Please try again.'));
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Upload &amp; Save Proof';
    }
  }

  async function handleCnRemQuickProofSelected(input) {
    if (!activeReturnForReminder || !input || !input.files || input.files.length === 0) return;
    const files = Array.from(input.files);
    input.value = '';
    const ret = activeReturnForReminder;
    renderCnRemProofStatusBanner(ret, { syncing: true, customText: `Uploading ${files.length} DO / PRN proof file${files.length > 1 ? 's' : ''} to Cloud Link…` });
    try {
      const res = await attachAndSyncProofFilesToReturn(ret, files, {
        preservePendingStatus: ret.status === 'pending_pickup'
      });
      renderReturnsUI();
      renderCnRemProofStatusBanner(ret);
      refreshCnReminderMessagePreview();
      if (res.success && typeof showPmgToast === 'function') {
        showPmgToast(`☁️ Uploaded ${res.cloudSyncedCount} DO / PRN proof document(s) to WhatsApp Cloud Link!`, 'success');
      } else if (!res.success) {
        alert('Saved locally, but could not reach Google Cloud right now. Please check internet connection and try again.');
      }
    } catch (err) {
      renderCnRemProofStatusBanner(ret);
      alert('Could not attach DO / PRN file: ' + (err && err.message ? err.message : 'Unknown error'));
    }
  }

  async function viewSignedProof(returnId) {
    const ret = returnsData.find(r => r.id === returnId);
    if (!ret || !ret.signedProof) return;

    if (ret.signedProof.cloudDocId && typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(buildPublicDoProofUrl(ret), '_blank', 'noopener');
      syncReturnsWithGoogleSheets(ret.branch, true).catch(() => {});
      return;
    }

    // Attempt live OneDrive / local IDB -> Cloud sync on user click, then open Public Proof Portal directly
    let win = null;
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      try {
        win = window.open('about:blank', '_blank');
        if (win && win.document) {
          win.document.title = 'Syncing DO / PRN Proof...';
          win.document.body.innerHTML = '<div style="font-family:system-ui,sans-serif;padding:40px;text-align:center;color:#0f172a;"><h3>⏳ Syncing original DO / PRN document to Cloud Proof Link…</h3><p style="font-size:13px;color:#64748b;">Opening Supplier Proof Portal (PMG Pharmacy Hub)</p></div>';
        }
      } catch (_) {}
    }

    const syncRes = await ensureReturnProofSyncedToCloud(ret, { interactive: true });
    if (syncRes && syncRes.synced) {
      const url = buildPublicDoProofUrl(ret);
      if (win && !win.closed) {
        win.location.href = url;
      } else if (typeof window !== 'undefined' && typeof window.open === 'function') {
        window.open(url, '_blank', 'noopener');
      }
      return;
    }

    if (win && !win.closed) {
      try { win.close(); } catch (_) {}
    }
    alert(`📁 Original DO / PRN Proof (${ret.signedProof.fileName}) was saved on OneDrive (${ret.signedProof.path || 'Branch OneDrive'}), which is not currently accessible on this browser.\n\nPlease link your OneDrive folder or re-select the PDF/image once to make it viewable via Cloud Proof Link.`);
  }

  // ─── MODAL 4B: WHATSAPP SUPPLIER CN REMINDER ─────────────────────────────────
  function renderCnRemProofStatusBanner(ret, state = {}) {
    const proofBox = document.getElementById('cnRemProofStatusBox');
    if (!proofBox || !ret) return;

    const safeId = escapeHtml(String(ret.id || '')).replace(/'/g, '&#39;');
    const triggerQuickPick = `const qi=document.getElementById('cnRemQuickProofInput');if(qi)qi.click();else pmgReturns.openUploadSignedDoModal('${safeId}')`;

    if (state.syncing) {
      const msg = state.customText || `Syncing original uploaded DO / PRN document (${ret.signedProof ? ret.signedProof.fileName : 'file'}) to Cloud Proof Link…`;
      proofBox.className = 'rounded-xl p-3 border text-xs flex flex-wrap items-center justify-between gap-2 bg-blue-50 border-blue-200 text-blue-900';
      proofBox.innerHTML = `
        <div class="flex items-center gap-2.5">
          <i class="fa-solid fa-circle-notch fa-spin text-blue-600 text-base"></i>
          <div>
            <p class="font-bold">${escapeHtml(msg)}</p>
            <p class="text-[11px] text-blue-700">Preparing original image/PDF so suppliers see the exact scanned document on WhatsApp…</p>
          </div>
        </div>
      `;
      return;
    }

    if (ret.signedProof && ret.signedProof.cloudDocId) {
      const extraDocs = Array.isArray(ret.signedProof.additionalDocs) ? ret.signedProof.additionalDocs : [];
      const allFileNames = [ret.signedProof.fileName, ...extraDocs.map(d => d && d.fileName).filter(Boolean)].filter(Boolean).join(', ');
      proofBox.className = 'rounded-xl p-3 border text-xs flex flex-wrap items-center justify-between gap-2 bg-emerald-50 border-emerald-200 text-emerald-900';
      proofBox.innerHTML = `
        <div class="flex items-center gap-2 flex-1 min-w-[200px]">
          <i class="fa-solid fa-circle-check text-emerald-600 text-base"></i>
          <div>
            <p class="font-bold">Original DO / PRN Document Synced to Cloud Link</p>
            <p class="text-[11px] text-emerald-700">Supplier will see the DO + PRN table <strong>AND</strong> your actual uploaded copy (${escapeHtml(allFileNames)}).</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" onclick="pmgReturns.previewPublicDoProofInNewTab()" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer">
            <i class="fa-solid fa-eye mr-1"></i>Preview Proof
          </button>
          <button type="button" onclick="${triggerQuickPick}" class="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold cursor-pointer">
            Replace / Add File
          </button>
        </div>
      `;
    } else if (ret.signedProof && ret.signedProof.fileName) {
      proofBox.className = 'rounded-xl p-3 border text-xs flex flex-wrap items-center justify-between gap-2 bg-amber-50 border-amber-300 text-amber-950';
      proofBox.innerHTML = `
        <div class="flex items-center gap-2 flex-1 min-w-[200px]">
          <i class="fa-solid fa-triangle-exclamation text-amber-600 text-base"></i>
          <div>
            <p class="font-bold">Original File (${escapeHtml(ret.signedProof.fileName)}) Not Synced to Cloud Link Yet</p>
            <p class="text-[11px] text-amber-800">Click <strong>Sync from OneDrive</strong> or <strong>Attach File</strong> below so the supplier sees the actual scanned DO / PRN image or PDF instead of text only.</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" onclick="pmgReturns.syncExistingProofToCloudNow('${safeId}')" class="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer">
            <i class="fa-solid fa-rotate mr-1"></i>Sync from OneDrive
          </button>
          <button type="button" onclick="${triggerQuickPick}" class="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer">
            <i class="fa-solid fa-file-arrow-up mr-1"></i>Attach File
          </button>
        </div>
      `;
    } else {
      proofBox.className = 'rounded-xl p-3 border text-xs flex flex-wrap items-center justify-between gap-2 bg-amber-50 border-amber-200 text-amber-900';
      proofBox.innerHTML = `
        <div class="flex items-center gap-2 flex-1 min-w-[200px]">
          <i class="fa-solid fa-file-invoice text-amber-600 text-base"></i>
          <div>
            <p class="font-bold">No Original DO / PRN Scan Attached Yet (Text Table Only)</p>
            <p class="text-[11px] text-amber-800">Attach your scanned DO / PRN copy (PDF or photo) so suppliers see the actual signed document when clicking the WhatsApp link.</p>
          </div>
        </div>
        <button type="button" onclick="${triggerQuickPick}" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer shrink-0">
          <i class="fa-solid fa-camera mr-1"></i>Attach DO / PRN Copy
        </button>
      `;
    }
  }

  function openCnReminderModal(returnId) {
    const ret = returnsData.find(r => r.id === returnId);
    if (!ret) return;

    if (!isEligibleForCnReminder(ret)) {
      if (isStockTransferOrTransit(ret)) {
        alert('Stock Transfer / Stock In-Transit records do not require supplier Credit Note reminders.');
      } else {
        alert('This return already has a Credit Note recorded / settled.');
      }
      return;
    }

    activeReturnForReminder = ret;
    const modal = document.getElementById('cnReminderModal');
    if (!modal) return;

    const prns = getUniquePrnNumbers(ret);
    const savedContact = loadSupplierWaContacts()[getSupplierContactKey(ret.supplier)] || {};

    // Resolve best phone (record supplierWhatsapp -> mobile destPhone -> saved supplier directory)
    let defaultPhone = String(ret.supplierWhatsapp || '').trim();
    if (!defaultPhone && ret.destPhone) {
      const checkDest = normalizeSupplierWaPhone(ret.destPhone);
      if (checkDest.validMobile) defaultPhone = String(ret.destPhone).trim();
    }
    if (!defaultPhone && savedContact.phone) {
      defaultPhone = savedContact.phone;
    }

    const defaultPic = String(ret.destAttn || '').trim() || savedContact.picName || '';

    document.getElementById('cnRemDoNumber').textContent = ret.doNumber || 'N/A';
    document.getElementById('cnRemPrnList').textContent = `PRN: ${prns.length > 0 ? prns.join(', ') : 'None assigned yet'}`;
    document.getElementById('cnRemSupplier').textContent = ret.supplier || 'Supplier';

    const histEl = document.getElementById('cnRemHistoryBadge');
    if (histEl) {
      const count = Number(ret.cnReminderCount) || 0;
      if (count > 0) {
        const dt = ret.lastCnReminderAt ? new Date(ret.lastCnReminderAt).toLocaleString('en-MY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
        histEl.textContent = `Previously reminded ${count}x${dt ? ` · Last: ${dt}` : ''}`;
      } else {
        histEl.textContent = 'Not reminded yet';
      }
    }

    const needsAutoCloudProofSync = Boolean(ret.signedProof && ret.signedProof.fileName && !ret.signedProof.cloudDocId);
    renderCnRemProofStatusBanner(ret, { syncing: needsAutoCloudProofSync });

    const phoneInput = document.getElementById('cnRemPhone');
    const picInput = document.getElementById('cnRemPicName');
    const urlInput = document.getElementById('cnRemProofUrl');
    const rawProofUrl = buildPublicDoProofUrl(ret);
    const displayProofUrl = (typeof window !== 'undefined' && typeof window.pmgGetCachedShortUrl === 'function')
      ? window.pmgGetCachedShortUrl(rawProofUrl)
      : rawProofUrl;
    if (phoneInput) phoneInput.value = defaultPhone;
    if (picInput) picInput.value = defaultPic;
    if (urlInput) urlInput.value = displayProofUrl;

    refreshCnReminderMessagePreview();
    modal.classList.remove('hidden');

    // Automatically sync existing OneDrive / local DO+PRN proof into Cloud Proof Vault right when modal opens
    if (needsAutoCloudProofSync) {
      ensureReturnProofSyncedToCloud(ret, { interactive: true }).then(() => {
        if (activeReturnForReminder && activeReturnForReminder.id === ret.id) {
          renderCnRemProofStatusBanner(ret);
          refreshCnReminderMessagePreview();
        }
      }).catch(() => {
        if (activeReturnForReminder && activeReturnForReminder.id === ret.id) {
          renderCnRemProofStatusBanner(ret);
        }
      });
    }

    // Background pre-warm short URL for the DO+PRN proof link and refresh preview once cached
    if (typeof window !== 'undefined' && typeof window.pmgShortenUrlsBatch === 'function' && rawProofUrl) {
      window.pmgShortenUrlsBatch([rawProofUrl], { timeoutMs: 3000 }).then(map => {
        const shortUrl = map && map[rawProofUrl];
        if (shortUrl && shortUrl !== rawProofUrl && activeReturnForReminder && activeReturnForReminder.id === ret.id) {
          if (urlInput) urlInput.value = shortUrl;
          const msgBox = document.getElementById('cnRemMessageBox');
          if (msgBox && msgBox.value.includes(rawProofUrl)) {
            msgBox.value = msgBox.value.split(rawProofUrl).join(shortUrl);
          }
        }
      }).catch(() => {});
    }
  }

  function closeCnReminderModal() {
    document.getElementById('cnReminderModal')?.classList.add('hidden');
  }

  function refreshCnReminderMessagePreview() {
    if (!activeReturnForReminder) return;
    const picName = document.getElementById('cnRemPicName')?.value || '';
    const msgBox = document.getElementById('cnRemMessageBox');
    if (msgBox) {
      let previewMsg = buildSupplierCnReminderMessage(activeReturnForReminder, { picName });
      if (typeof window !== 'undefined' && typeof window.pmgApplyCachedShortUrlsToMessage === 'function') {
        previewMsg = window.pmgApplyCachedShortUrlsToMessage(previewMsg);
      }
      msgBox.value = previewMsg;
    }
  }

  async function recordAndSyncCnReminder(ret, phoneRaw, picName) {
    if (!ret) return;
    const cleanPhoneRaw = String(phoneRaw || '').trim();
    const cleanPic = String(picName || '').trim();
    if (cleanPhoneRaw || cleanPic) {
      saveSupplierWaContact(ret.supplier, cleanPhoneRaw, cleanPic);
    }
    if (cleanPhoneRaw) ret.supplierWhatsapp = cleanPhoneRaw;
    if (cleanPic && !ret.destAttn) ret.destAttn = cleanPic;
    ret.cnReminderCount = (Number(ret.cnReminderCount) || 0) + 1;
    ret.lastCnReminderAt = new Date().toISOString();
    ret.updatedAt = new Date().toISOString();

    // Ensure original DO/PRN binary is pushed to Cloud Proof Vault if present locally/OneDrive
    if (ret.signedProof && !ret.signedProof.cloudDocId) {
      await ensureReturnProofSyncedToCloud(ret, { interactive: false, deferVaultPush: true });
    }

    await saveSingleReturnToDb(ret);
    try {
      localStorage.setItem('pmg_returns_records_v1', JSON.stringify(returnsData));
    } catch (_) {}
    await syncReturnsWithGoogleSheets(ret.branch, true);
    renderReturnsTable();
  }

  async function sendCnReminderWhatsApp() {
    if (!activeReturnForReminder) return;
    const phoneRaw = (document.getElementById('cnRemPhone')?.value || '').trim();
    const picName = (document.getElementById('cnRemPicName')?.value || '').trim();
    const msg = (document.getElementById('cnRemMessageBox')?.value || '').trim()
      || buildSupplierCnReminderMessage(activeReturnForReminder, { picName });
    const sendBtn = document.getElementById('cnRemSendBtn');

    let targetCleanPhone = '';
    if (phoneRaw) {
      const parsed = normalizeSupplierWaPhone(phoneRaw);
      if (parsed.isLandline) {
        const usePicker = confirm(`"${phoneRaw}" looks like a landline number (cannot receive WhatsApp).\n\nClick OK to open WhatsApp so you can choose a Supplier Group or contact manually, or Cancel to edit the mobile number.`);
        if (!usePicker) return;
      } else if (parsed.clean) {
        targetCleanPhone = parsed.clean;
      }
    }

    // Open WhatsApp via centralized PDPA-safe shortener & popup-safe launcher
    const targetReturn = activeReturnForReminder;
    if (typeof window !== 'undefined' && typeof window.openUniversalWhatsApp === 'function') {
      window.openUniversalWhatsApp(targetCleanPhone, msg);
    } else {
      const waUrl = targetCleanPhone
        ? `https://wa.me/${targetCleanPhone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank', 'noopener');
    }
    closeCnReminderModal();

    // Record reminder metadata & push original DO/PRN proof + return state to cloud in the background
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Syncing Proof Link…';
    }
    recordAndSyncCnReminder(targetReturn, phoneRaw, picName)
      .catch(err => console.warn('[PMG Returns] Background CN reminder sync warning:', err))
      .finally(() => {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.innerHTML = '<i class="fa-brands fa-whatsapp text-sm"></i> Send via WhatsApp';
        }
      });
  }

  async function copyCnReminderMessage() {
    if (!activeReturnForReminder) return;
    const phoneRaw = (document.getElementById('cnRemPhone')?.value || '').trim();
    const picName = (document.getElementById('cnRemPicName')?.value || '').trim();
    const msg = (document.getElementById('cnRemMessageBox')?.value || '').trim()
      || buildSupplierCnReminderMessage(activeReturnForReminder, { picName });

    let copied = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(msg);
        copied = true;
      } else {
        const box = document.getElementById('cnRemMessageBox');
        if (box) {
          box.focus();
          box.select();
          copied = document.execCommand('copy');
        }
      }
    } catch (clipErr) {
      console.warn('[PMG Returns] Clipboard write warning:', clipErr);
    }

    try {
      await recordAndSyncCnReminder(activeReturnForReminder, phoneRaw, picName);
    } catch (syncErr) {
      console.warn('[PMG Returns] Reminder sync warning:', syncErr);
    }

    if (copied) {
      alert('✅ CN reminder message & clickable DO/PRN proof link copied! Paste directly into your Supplier WhatsApp chat or group.');
    } else {
      alert('Proof link synced. Clipboard access was blocked by the browser — please select and copy the message directly from the preview box.');
    }
  }

  async function previewPublicDoProofInNewTab() {
    if (!activeReturnForReminder) return;
    const ret = activeReturnForReminder;
    const proofUrl = buildPublicDoProofUrl(ret);
    const branch = ret.branch;

    // Popup-safe synchronous tab open + await proof & metadata cloud sync so preview never hits stale cloud state
    let previewWin = null;
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      try {
        previewWin = window.open('about:blank', '_blank');
        if (previewWin && previewWin.document) {
          previewWin.document.title = 'Loading Supplier Proof View...';
          previewWin.document.body.innerHTML = '<div style="font-family:system-ui,sans-serif;padding:40px;text-align:center;color:#0f172a;"><h3 style="margin-bottom:8px;">⏳ Syncing DO / PRN Document of Proof to Cloud…</h3><p style="font-size:13px;color:#64748b;">Opening Supplier View (PMG Pharmacy Hub)</p></div>';
        }
      } catch (_) {}
    }

    try {
      if (ret.signedProof && !ret.signedProof.cloudDocId) {
        await ensureReturnProofSyncedToCloud(ret, { interactive: true, deferVaultPush: true });
      }
      await syncReturnsWithGoogleSheets(branch, true);
    } catch (err) {
      console.warn('[PMG Returns] Preview sync warning:', err);
    }

    if (previewWin && !previewWin.closed) {
      try {
        previewWin.location.href = proofUrl;
        if (typeof previewWin.focus === 'function') previewWin.focus();
        return;
      } catch (_) {}
    }
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(proofUrl, '_blank', 'noopener');
    }
  }

  // ─── PUBLIC SUPPLIER DO & PRN DOCUMENT OF PROOF PORTAL (?doProof=...) ────────
  async function fetchReturnRecordForProofPortal(returnId, branchHint) {
    const cleanId = String(returnId || '').trim();
    if (!cleanId) return null;

    // 1. Try live Google Cloud Vault first so suppliers on external devices get latest record
    const branchCandidates = Array.from(new Set([
      branchHint ? normalizeBranchForSheets(branchHint) : '',
      'Kota Sentosa'
    ].filter(Boolean)));

    let cloudRecord = null;
    for (const br of branchCandidates) {
      const vaultKeys = [`PMG_RETURNS_VAULT_${br}`, br];
      for (const vk of vaultKeys) {
        try {
          const res = await fetch(`${PMG_SCHEDULE_API_URL}?branch=${encodeURIComponent(vk)}`);
          if (!res.ok) continue;
          const data = await res.json();
          const list = data && data.schedule && Array.isArray(data.schedule.branchReturns)
            ? data.schedule.branchReturns : [];
          const found = list.find(r => r && (r.id === cleanId || r.doNumber === cleanId));
          if (found) {
            cloudRecord = found;
            break;
          }
        } catch (_) {}
      }
      if (cloudRecord) break;
    }

    // 2. Also check local cache / memory so same-device previews inherit any newly attached proof metadata immediately
    let localRecord = null;
    try {
      const cached = JSON.parse(localStorage.getItem('pmg_returns_records_v1') || '[]');
      localRecord = cached.find(r => r && (r.id === cleanId || r.doNumber === cleanId)) || null;
    } catch (_) {}
    if (!localRecord) {
      localRecord = (returnsData || []).find(r => r && (r.id === cleanId || r.doNumber === cleanId)) || null;
    }

    if (cloudRecord && localRecord) {
      const mergedProof = mergeSignedProofMetadata(cloudRecord.signedProof, localRecord.signedProof);
      return mergedProof ? { ...localRecord, ...cloudRecord, signedProof: mergedProof } : { ...localRecord, ...cloudRecord };
    }
    if (cloudRecord) return cloudRecord;
    if (localRecord) return localRecord;

    return SEED_RETURNS.find(r => r && (r.id === cleanId || r.doNumber === cleanId)) || null;
  }

  async function renderPdfPagesIntoContainer(cleanBase64, pagesContainerId, iframeFallbackId, pageBadgeId) {
    const pagesBox = document.getElementById(pagesContainerId);
    if (!pagesBox || !cleanBase64) return false;

    try {
      const pdfjsLib = await loadPdfJsLibrary();
      if (!pdfjsLib || typeof document === 'undefined') return false;

      const bytes = base64ToUint8Array(cleanBase64);
      const pdfDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
      const numPages = pdfDoc.numPages || 1;
      const maxRenderPages = Math.min(numPages, 20);

      const badgeEl = pageBadgeId ? document.getElementById(pageBadgeId) : null;
      if (badgeEl) {
        badgeEl.textContent = `${numPages} Page${numPages !== 1 ? 's' : ''}`;
        badgeEl.classList.remove('hidden');
      }

      const pageHtmlParts = [];
      for (let p = 1; p <= maxRenderPages; p++) {
        const page = await pdfDoc.getPage(p);
        const baseVp = page.getViewport({ scale: 1 });
        const targetScale = baseVp.width > 0 ? Math.min(2.4, Math.max(1.5, 1400 / baseVp.width)) : 2.0;
        const vp = page.getViewport({ scale: targetScale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        const ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return false;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const pageImgUrl = canvas.toDataURL('image/jpeg', 0.9);

        pageHtmlParts.push(`
          <div class="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
            ${numPages > 1 ? `<div class="bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-[11px] font-bold text-slate-600 flex justify-between items-center"><span>Page ${p} of ${numPages}</span><span>Original Scanned DO / PRN</span></div>` : ''}
            <img src="${pageImgUrl}" alt="Original DO / PRN Document Page ${p}" class="w-full h-auto block object-contain bg-white">
          </div>
        `);
      }

      pagesBox.innerHTML = pageHtmlParts.join('\n');
      pagesBox.classList.remove('hidden');
      const fallbackFrame = iframeFallbackId ? document.getElementById(iframeFallbackId) : null;
      if (fallbackFrame) fallbackFrame.classList.add('hidden');
      return true;
    } catch (err) {
      console.warn('[PMG Returns] PDF.js inline page render fallback to native viewer:', err && err.message ? err.message : err);
      return false;
    }
  }

  async function fetchAllProofDocumentsForPortal(ret) {
    const resolvedDocs = [];
    if (!ret || !ret.id) return resolvedDocs;

    const candidateEntries = [];
    if (ret.signedProof) {
      candidateEntries.push({
        cloudDocId: ret.signedProof.cloudDocId || '',
        fileName: ret.signedProof.fileName || '',
        mimeType: ret.signedProof.mimeType || '',
        field: 'signedDoProof'
      });
      if (Array.isArray(ret.signedProof.additionalDocs)) {
        ret.signedProof.additionalDocs.forEach((d, idx) => {
          if (d) {
            candidateEntries.push({
              cloudDocId: d.cloudDocId || '',
              fileName: d.fileName || '',
              mimeType: d.mimeType || '',
              field: d.field || `signedDoProof_${idx + 2}`
            });
          }
        });
      }
    }

    // 1. Fetch explicit cloudDocIds from Google Cloud Applicant_Documents vault
    for (const entry of candidateEntries) {
      if (!entry.cloudDocId) continue;
      try {
        const docRes = await fetch(`${PMG_SCHEDULE_API_URL}?action=getApplicantDoc&docId=${encodeURIComponent(entry.cloudDocId)}`);
        const docJson = docRes.ok ? await docRes.json() : null;
        if (docJson && docJson.success && docJson.data) {
          resolvedDocs.push({
            rawData: String(docJson.data).trim(),
            fileName: entry.fileName || docJson.name || `${ret.doNumber || ret.id}_Signed_DO`,
            mimeType: docJson.mimeType || entry.mimeType || ''
          });
        }
      } catch (_) {}
    }

    // 2. Fallback: query by appId=DO_PROOF_<ret.id> in case cloudDocId metadata was still syncing when link was tapped
    if (resolvedDocs.length === 0 && PMG_SCHEDULE_API_URL) {
      try {
        const fbRes = await fetch(`${PMG_SCHEDULE_API_URL}?action=getApplicantDoc&appId=${encodeURIComponent(`DO_PROOF_${ret.id}`)}&field=signedDoProof`);
        const fbJson = fbRes.ok ? await fbRes.json() : null;
        if (fbJson && fbJson.success && fbJson.data) {
          resolvedDocs.push({
            rawData: String(fbJson.data).trim(),
            fileName: (ret.signedProof && ret.signedProof.fileName) || fbJson.name || `${ret.doNumber || ret.id}_Signed_DO`,
            mimeType: fbJson.mimeType || (ret.signedProof && ret.signedProof.mimeType) || ''
          });
        }
      } catch (_) {}
    }

    // 3. Same-device local IndexedDB proof blob fallback
    if (resolvedDocs.length === 0) {
      const localDocs = await loadLocalProofDocsFromIdb(ret.id);
      localDocs.forEach(ld => {
        if (ld && ld.dataUrl) {
          resolvedDocs.push({
            rawData: String(ld.dataUrl).trim(),
            fileName: ld.fileName || (ret.signedProof && ret.signedProof.fileName) || `${ret.doNumber || ret.id}_Signed_DO`,
            mimeType: ld.mimeType || ''
          });
        }
      });
    }

    return resolvedDocs;
  }

  async function renderPublicDoProofPortal(containerId, returnId, branchHint) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 text-center">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-emerald-600 mb-3"></i>
        <p class="text-sm font-bold text-slate-800">Loading Official PMG Delivery Order &amp; PRN Proof…</p>
        <p class="text-xs text-slate-500 mt-1">Reference: ${escapeHtml(returnId)}</p>
      </div>
    `;

    const ret = await fetchReturnRecordForProofPortal(returnId, branchHint);
    if (!ret) {
      container.innerHTML = `
        <div class="bg-white rounded-2xl shadow-lg border border-rose-200 p-8 text-center">
          <i class="fa-solid fa-file-circle-xmark text-4xl text-rose-500 mb-3"></i>
          <h2 class="text-lg font-black text-slate-900">Document of Proof Not Found</h2>
          <p class="text-xs text-slate-600 mt-2">Reference <span class="font-mono font-bold">${escapeHtml(returnId)}</span> could not be loaded from PMG cloud records. Please contact PMG Pharmacy branch to resend the latest link.</p>
        </div>
      `;
      return;
    }

    const prns = getUniquePrnNumbers(ret);
    const items = Array.isArray(ret.items) ? ret.items : [];
    const branchInfo = getBranchDetails(ret.branch || 'Kota Sentosa');
    const statusLabel = ret.cnNumber
      ? `CN Settled (${ret.cnNumber})`
      : (ret.status === 'awaiting_cn' ? 'Collected · Awaiting Credit Note (CN)' : 'Return Logged · Pending Credit Note (CN)');
    const expectsProofFetch = Boolean((ret.signedProof && (ret.signedProof.cloudDocId || ret.signedProof.fileName)) || PMG_SCHEDULE_API_URL);

    container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <!-- Official Header -->
        <div class="bg-gradient-to-r from-slate-900 via-blue-950 to-emerald-900 text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <i class="fa-solid fa-shield-check"></i> Official Return Document of Proof
            </div>
            <h1 class="text-lg sm:text-xl font-black tracking-tight">${escapeHtml(ret.companyName || branchInfo.companyName)}</h1>
            <p class="text-[11px] text-slate-300 mt-0.5 max-w-2xl">${escapeHtml(ret.companyAddress || branchInfo.address)}</p>
          </div>
          <div class="flex items-center gap-2 print:hidden">
            <button type="button" onclick="window.print()" class="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow cursor-pointer flex items-center gap-1.5">
              <i class="fa-solid fa-print text-blue-700"></i> Print / Save PDF
            </button>
          </div>
        </div>

        <!-- DO & PRN Metadata Grid + Original Uploaded Proof Copy + Itemized Breakdown -->
        <div class="p-6 space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
              <div class="text-[10px] font-bold text-blue-600 uppercase">Delivery Order (DO) No.</div>
              <div class="font-mono text-base font-black text-blue-950 mt-0.5">${escapeHtml(ret.doNumber || 'N/A')}</div>
              <div class="text-[11px] text-blue-800 mt-0.5">Date: ${escapeHtml(ret.date || 'N/A')}</div>
            </div>
            <div class="bg-amber-50/80 border border-amber-300 rounded-xl p-3">
              <div class="text-[10px] font-bold text-amber-700 uppercase">PRN Reference Slip(s)</div>
              <div class="mt-1 flex flex-wrap gap-1">
                ${prns.length > 0
                  ? prns.map(p => `<span class="px-2 py-0.5 rounded bg-amber-200/80 text-amber-950 font-mono text-xs font-black border border-amber-400">${escapeHtml(p)}</span>`).join('')
                  : '<span class="text-xs text-amber-800 font-semibold">See itemized list</span>'}
              </div>
            </div>
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div class="text-[10px] font-bold text-slate-500 uppercase">Supplier / Recipient</div>
              <div class="text-xs font-black text-slate-900 mt-0.5">${escapeHtml(ret.supplier || 'N/A')}</div>
              ${ret.destAttn ? `<div class="text-[11px] text-slate-600 mt-0.5">Attn: ${escapeHtml(ret.destAttn)}</div>` : ''}
            </div>
            <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
              <div class="text-[10px] font-bold text-emerald-700 uppercase">CN &amp; Collection Status</div>
              <div class="text-xs font-black text-emerald-900 mt-0.5">${escapeHtml(statusLabel)}</div>
              <div class="text-[11px] text-emerald-800 mt-0.5">${ret.pickupBy ? `Driver: ${escapeHtml(ret.pickupBy)}${ret.pickupDate ? ` (${escapeHtml(ret.pickupDate)})` : ''}` : `Cartons: ${ret.totalCartons || 1} · ${items.length} SKU(s)`}</div>
            </div>
          </div>

          <!-- Original Uploaded DO / PRN Document Proof Section (Displayed Prominently First for Suppliers) -->
          <div id="publicDoSignedAttachmentBox" class="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
            ${expectsProofFetch ? `
              <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
                <i class="fa-solid fa-circle-notch fa-spin text-emerald-600"></i>
                <span>Loading original uploaded DO / PRN document proof${ret.signedProof && ret.signedProof.fileName ? ` (${escapeHtml(ret.signedProof.fileName)})` : ''}…</span>
              </div>
            ` : `
              <div class="flex items-center gap-2.5 text-xs text-slate-600">
                <i class="fa-solid fa-file-signature text-blue-600 text-base"></i>
                <div>
                  <p class="font-bold text-slate-800">Verified PMG Branch Return Record</p>
                  <p class="text-[11px] text-slate-500">Prepared / Verified By: <strong>${escapeHtml(ret.verifiedBy || 'PMG Pharmacist')}</strong>${ret.pickupBy ? ` · Driver: <strong>${escapeHtml(ret.pickupBy)}</strong> (${escapeHtml(ret.pickupDate || '')})` : ''}</p>
                </div>
              </div>
            `}
          </div>

          <!-- Itemized Return Goods Table -->
          <div>
            <h2 class="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <i class="fa-solid fa-boxes-stacked text-blue-600"></i> Returned Goods Breakdown (${items.length} SKU${items.length !== 1 ? 's' : ''}, ${ret.totalCartons || 1} Carton${(ret.totalCartons || 1) !== 1 ? 's' : ''})
            </h2>
            <div class="overflow-x-auto border border-slate-200 rounded-xl">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase border-b border-slate-200">
                    <th class="py-2.5 px-3 text-center">Ctn</th>
                    <th class="py-2.5 px-3">PRN No.</th>
                    <th class="py-2.5 px-3">Item Code</th>
                    <th class="py-2.5 px-3">Description</th>
                    <th class="py-2.5 px-3">Batch / Expiry</th>
                    <th class="py-2.5 px-3 text-center">Qty</th>
                    <th class="py-2.5 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${items.map((it, idx) => `
                    <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}">
                      <td class="py-2 px-3 text-center font-mono font-bold text-slate-600">${escapeHtml(it.cartonNo || '1')}</td>
                      <td class="py-2 px-3 font-mono font-black text-amber-800">${escapeHtml(it.prnNumber || '—')}</td>
                      <td class="py-2 px-3 font-mono text-slate-600">${escapeHtml(it.itemCode || '—')}</td>
                      <td class="py-2 px-3 font-semibold text-slate-900">${escapeHtml(it.itemDescription || '')}</td>
                      <td class="py-2 px-3 text-[11px] text-slate-600">${escapeHtml([it.batchNo, it.expiryDate].filter(Boolean).join(' · ') || '—')}</td>
                      <td class="py-2 px-3 text-center font-bold text-slate-900">${escapeHtml(it.quantity || '1')} <span class="text-[10px] text-slate-500">${escapeHtml(it.uom || '')}</span></td>
                      <td class="py-2 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${escapeHtml(it.reason || 'Return')}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Fetch & render original uploaded DO / PRN document(s) (image & multi-page PDF)
    const attBox = document.getElementById('publicDoSignedAttachmentBox');
    if (!attBox) return;

    try {
      const rawDocs = await fetchAllProofDocumentsForPortal(ret);
      if (rawDocs.length === 0) {
        if (ret.signedProof && ret.signedProof.fileName) {
          attBox.className = 'border border-amber-200 rounded-xl p-4 bg-amber-50/70';
          attBox.innerHTML = `<p class="text-xs text-amber-900 font-semibold"><i class="fa-solid fa-circle-info mr-1 text-amber-600"></i>Original DO / PRN file (<strong>${escapeHtml(ret.signedProof.fileName)}</strong>) is archived on branch OneDrive and pending cloud sync. Please refer to the verified DO &amp; PRN breakdown below or contact PMG Pharmacy (${escapeHtml(ret.branch || 'Branch')}) if you require the scanned copy re-sent.</p>`;
        } else {
          attBox.className = 'border border-slate-200 rounded-xl p-4 bg-slate-50';
          attBox.innerHTML = `
            <div class="flex items-center gap-2.5 text-xs text-slate-600">
              <i class="fa-solid fa-file-signature text-blue-600 text-base"></i>
              <div>
                <p class="font-bold text-slate-800">Verified PMG Branch Return Record</p>
                <p class="text-[11px] text-slate-500">Prepared / Verified By: <strong>${escapeHtml(ret.verifiedBy || 'PMG Pharmacist')}</strong>${ret.pickupBy ? ` · Driver: <strong>${escapeHtml(ret.pickupBy)}</strong> (${escapeHtml(ret.pickupDate || '')})` : ''}</p>
              </div>
            </div>
          `;
        }
        return;
      }

      const validDocs = [];
      let hadRejectedUnsafeDoc = false;
      rawDocs.forEach(docItem => {
        const norm = inferAndNormalizeProofMime(docItem.fileName, docItem.mimeType, docItem.rawData);
        if (norm) {
          validDocs.push({
            ...norm,
            fileName: docItem.fileName
          });
        } else {
          hadRejectedUnsafeDoc = true;
        }
      });

      if (validDocs.length === 0) {
        attBox.className = 'border border-amber-200 rounded-xl p-4 bg-amber-50';
        attBox.innerHTML = `<p class="text-xs text-amber-800 font-semibold"><i class="fa-solid fa-shield-halved mr-1"></i>${hadRejectedUnsafeDoc ? 'Signed DO attachment format is unsupported for inline preview.' : 'Attachment could not be decoded.'} Please refer to the verified DO &amp; PRN breakdown below.</p>`;
        return;
      }

      const pdfRenderJobs = [];
      const docsHtml = validDocs.map((docObj, idx) => {
        const isPdf = docObj.mimeType === 'application/pdf';
        const fName = docObj.fileName || `${ret.doNumber || 'PMG'}_Proof_${idx + 1}.${isPdf ? 'pdf' : 'jpg'}`;
        const multiLabel = validDocs.length > 1 ? ` (${idx + 1} of ${validDocs.length})` : '';

        if (isPdf) {
          let blobUrl = docObj.dataUrl;
          try {
            const bytes = base64ToUint8Array(docObj.base64);
            if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
              blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
            }
          } catch (_) {}

          const pagesId = `publicDoPdfPages_${idx}`;
          const iframeId = `publicDoPdfFrame_${idx}`;
          const badgeId = `publicDoPdfBadge_${idx}`;
          pdfRenderJobs.push({ base64: docObj.base64, pagesId, iframeId, badgeId });

          return `
            <div class="space-y-3 ${idx > 0 ? 'pt-4 border-t border-emerald-200' : ''}">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="text-xs font-black text-emerald-950 flex items-center gap-1.5 flex-wrap">
                  <i class="fa-solid fa-file-pdf text-rose-600 text-base"></i>
                  <span>Original Uploaded DO / PRN Document (PDF)${multiLabel} · Driver-Signed DO Proof Copy</span>
                  <span class="font-mono text-[11px] font-semibold text-slate-600">(${escapeHtml(fName)})</span>
                  <span id="${badgeId}" class="hidden px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold"></span>
                </div>
                <div class="flex items-center gap-1.5 print:hidden">
                  <a href="${blobUrl}" target="_blank" rel="noopener" class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-arrow-up-right-from-square text-blue-600"></i> Open PDF
                  </a>
                  <a href="${blobUrl}" download="${escapeHtml(fName)}" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-download"></i> Download Signed DO
                  </a>
                </div>
              </div>
              <div id="${pagesId}" class="hidden space-y-3"></div>
              <iframe id="${iframeId}" src="${blobUrl}" class="w-full h-[600px] rounded-xl border border-slate-300 bg-white" title="${escapeHtml(fName)}"></iframe>
            </div>
          `;
        }

        let imgHref = docObj.dataUrl;
        try {
          const bytes = base64ToUint8Array(docObj.base64);
          if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            imgHref = URL.createObjectURL(new Blob([bytes], { type: docObj.mimeType }));
          }
        } catch (_) {}

        return `
          <div class="space-y-3 ${idx > 0 ? 'pt-4 border-t border-emerald-200' : ''}">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="text-xs font-black text-emerald-950 flex items-center gap-1.5 flex-wrap">
                <i class="fa-solid fa-file-shield text-emerald-600 text-base"></i>
                <span>Original Uploaded DO / PRN Proof${multiLabel} · Driver-Signed DO Proof Copy</span>
                <span class="font-mono text-[11px] font-semibold text-slate-600">(${escapeHtml(fName)})</span>
              </div>
              <div class="flex items-center gap-1.5 print:hidden">
                <a href="${imgHref}" target="_blank" rel="noopener" class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                  <i class="fa-solid fa-magnifying-glass-plus text-blue-600"></i> Full Size
                </a>
                <a href="${docObj.dataUrl}" download="${escapeHtml(fName)}" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5">
                  <i class="fa-solid fa-download"></i> Download Signed DO Photo
                </a>
              </div>
            </div>
            <a href="${imgHref}" target="_blank" rel="noopener" class="block" title="Tap to open full-resolution original document">
              <img src="${docObj.dataUrl}" alt="Driver Signed DO Proof" class="w-full max-h-[900px] object-contain rounded-xl border border-slate-300 bg-white shadow-sm">
            </a>
          </div>
        `;
      }).join('');

      attBox.className = 'border-2 border-emerald-300 rounded-xl p-4 bg-emerald-50/40 space-y-4';
      attBox.innerHTML = docsHtml;

      // Render every PDF page directly into crisp <img> elements via PDF.js so WhatsApp mobile & Android/iOS browsers display all pages natively
      for (const job of pdfRenderJobs) {
        await renderPdfPagesIntoContainer(job.base64, job.pagesId, job.iframeId, job.badgeId).catch(() => {});
      }
    } catch (err) {
      attBox.className = 'border border-amber-200 rounded-xl p-4 bg-amber-50';
      attBox.innerHTML = `<p class="text-xs text-amber-800 font-semibold"><i class="fa-solid fa-circle-info mr-1"></i>Could not load signed DO attachment right now. Please refer to the verified DO &amp; PRN breakdown below.</p>`;
    }
  }

  // ─── MODAL 4: SETTLE CREDIT NOTE & KEY XILNEX SYSTEM ─────────────────────────
  function openSettleCnModal(returnId) {
    const ret = returnsData.find(r => r.id === returnId);
    if (!ret) return;
    activeReturnForCn = ret;

    const modal = document.getElementById('settleCnModal');
    if (!modal) return;

    document.getElementById('scnDoNumber').textContent = ret.doNumber;
    document.getElementById('scnSupplier').textContent = ret.supplier;
    document.getElementById('scnCnNumber').value = ret.cnNumber || '';
    document.getElementById('scnCnAmount').value = ret.cnAmount || '';
    document.getElementById('scnCnDate').value = ret.cnDate || formatTodayDateForDo();
    document.getElementById('scnXilnexChecked').checked = !!ret.xilnexKeyed;
    document.getElementById('scnStaffName').value = ret.xilnexKeyedBy || getCurrentUserDisplayName();

    modal.classList.remove('hidden');
  }

  function closeSettleCnModal() {
    document.getElementById('settleCnModal')?.classList.add('hidden');
  }

  async function submitSettleCn() {
    if (!activeReturnForCn) return;

    const cnNumber = document.getElementById('scnCnNumber').value.trim();
    const cnAmount = parseFloat(document.getElementById('scnCnAmount').value) || 0;
    const cnDate = document.getElementById('scnCnDate').value.trim();
    const xilnexKeyed = document.getElementById('scnXilnexChecked').checked;
    const staffName = document.getElementById('scnStaffName').value.trim();

    if (!cnNumber) {
      alert('Please enter the Supplier Credit Note Number (from the supplier slip).');
      return;
    }

    if (!xilnexKeyed) {
      const confirmProceed = confirm('You have not checked "Keyed into Xilnex". Is this CN already keyed into Xilnex?');
      if (!confirmProceed) return;
    }

    activeReturnForCn.cnNumber = cnNumber;
    activeReturnForCn.cnAmount = cnAmount;
    activeReturnForCn.cnDate = cnDate || formatTodayDateForDo();
    activeReturnForCn.xilnexKeyed = xilnexKeyed;
    activeReturnForCn.xilnexKeyedDate = formatTodayDateForDo();
    activeReturnForCn.xilnexKeyedBy = staffName || getCurrentUserDisplayName();
    activeReturnForCn.status = 'completed';
    activeReturnForCn.updatedAt = new Date().toISOString();

    await saveSingleReturnToDb(activeReturnForCn);
    try { localStorage.setItem('pmg_returns_records_v1', JSON.stringify(returnsData)); } catch (lsErr) { console.warn('[PMG Returns] localStorage quota warning:', lsErr); }
    syncReturnsWithOneDrive(activeReturnForCn.branch);
    syncReturnsWithGoogleSheets(activeReturnForCn.branch, true);

    closeSettleCnModal();
    renderReturnsUI();
    alert(`🎉 Credit Note ${cnNumber} marked as Completed & Keyed into Xilnex!`);
  }

  async function deleteReturnRecord(returnId) {
    const ret = returnsData.find(r => r.id === returnId);
    if (!ret) return;

    const confirmDel = confirm(`Are you sure you want to delete return record ${ret.doNumber}? This cannot be undone.`);
    if (!confirmDel) return;

    // 1. Record in tombstone list so cloud sync never resurrects it
    const deletedIds = JSON.parse(localStorage.getItem('pmg_deleted_returns') || '["ret-ks-2609-002", "ret-lnd-2609-001"]');
    if (!deletedIds.includes(returnId)) {
      deletedIds.push(returnId);
      try { localStorage.setItem('pmg_deleted_returns', JSON.stringify(deletedIds)); } catch (_) {}
    }

    // 2. Remove from local memory and IndexedDB
    returnsData = returnsData.filter(r => r.id !== returnId);
    await deleteReturnFromDb(returnId);
    try { localStorage.setItem('pmg_returns_records_v1', JSON.stringify(returnsData)); } catch (lsErr) { console.warn('[PMG Returns] localStorage quota warning:', lsErr); }

    // 3. Directly overwrite OneDrive file with clean array (no re-merging old file)
    if (window.pmgOneDriveSync && typeof window.pmgOneDriveSync.saveReturnsDatabaseToOneDrive === 'function') {
      const branchOnlyData = returnsData.filter(r => (r.branch || '').toUpperCase() === ret.branch.toUpperCase() && !deletedIds.includes(r.id));
      await window.pmgOneDriveSync.saveReturnsDatabaseToOneDrive(ret.branch, branchOnlyData);
    }
    syncReturnsWithGoogleSheets(ret.branch, true);

    renderReturnsUI();
  }

  // ─── EXPORT TO EXCEL ──────────────────────────────────────────────────────────
  function exportReturnsToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('SheetJS (XLSX) library not loaded. Please check your internet connection.');
      return;
    }

    const rows = [];
    returnsData.forEach(ret => {
      (ret.items || []).forEach(item => {
        rows.push({
          'DO Number': ret.doNumber,
          'DO Date': ret.date,
          'Branch': ret.branch,
          'Supplier': ret.supplier,
          'Total Cartons': ret.totalCartons,
          'Status': ret.status.toUpperCase(),
          'Carton No': item.cartonNo,
          'Item Code': item.itemCode,
          'Item Description': item.itemDescription,
          'Qty': item.quantity,
          'UOM': item.uom,
          'PRN Number': item.prnNumber,
          'Reason': item.reason,
          'Verified By': ret.verifiedBy,
          'Pick Up Driver': ret.pickupBy,
          'Pickup Date': ret.pickupDate,
          'Signed Proof File': ret.signedProof ? ret.signedProof.fileName : 'None',
          'CN Number': ret.cnNumber || '',
          'CN Amount (RM)': ret.cnAmount || 0,
          'CN Date': ret.cnDate || '',
          'Keyed in Xilnex': ret.xilnexKeyed ? 'YES' : 'NO',
          'Xilnex Keyed By': ret.xilnexKeyedBy || ''
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Returns & Credit Notes');

    const fileName = `PMG_Returns_CreditNotes_${getActiveBranchName()}_${new Date().toISOString().substring(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // ─── STRING UTILS ────────────────────────────────────────────────────────────
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ─── EXPOSE TO GLOBAL SCOPE ──────────────────────────────────────────────────
  window.pmgReturns = {
    init: initReturnsModule,
    render: renderReturnsUI,
    setFilter: setReturnsFilter,
    handleSearch: handleReturnsSearch,
    openNewModal: openNewReturnModal,
    closeNewModal: closeNewReturnModal,
    openEditReturnModal: openEditReturnModal,
    closeEditReturnModal: closeEditReturnModal,
    onNrBranchChanged: onNrBranchChanged,
    onErBranchChanged: onErBranchChanged,
    onDestPresetChanged: onDestPresetChanged,
    onErDestPresetChanged: onErDestPresetChanged,
    addDraftItemRow: addDraftItemRow,
    removeDraftItemRow: removeDraftItemRow,
    updateDraftItem: updateDraftItem,
    addEditDraftItemRow: addEditDraftItemRow,
    removeEditDraftItemRow: removeEditDraftItemRow,
    updateEditDraftItem: updateEditDraftItem,
    autoGroupPrnByThree: autoGroupPrnByThree,
    autoGroupEditPrnByThree: autoGroupEditPrnByThree,
    saveNewReturn: saveNewReturnApplication,
    saveEditedReturn: saveEditedReturn,
    openPrintDoModal: openPrintDoModal,
    closePrintDoModal: closePrintDoModal,
    executePrintDo: executePrintDo,
    openPrintCartonLabelModal: openPrintCartonLabelModal,
    closePrintCartonLabelModal: closePrintCartonLabelModal,
    executePrintCartonLabels: executePrintCartonLabels,
    onCartonTemplateChanged: onCartonTemplateChanged,
    syncDraftItemsFromDom: syncDraftItemsFromDom,
    syncEditDraftItemsFromDom: syncEditDraftItemsFromDom,
    getActiveReturnId: () => (activeReturnForDo ? activeReturnForDo.id : (activeReturnForEdit ? activeReturnForEdit.id : null)),
    openUploadSignedDoModal: openUploadSignedDoModal,
    closeUploadSignedDoModal: closeUploadSignedDoModal,
    handleUsdFileSelected: handleUsdFileSelected,
    handleInlineProofFileSelected: handleInlineProofFileSelected,
    handleCnRemQuickProofSelected: handleCnRemQuickProofSelected,
    submitSignedDoProof: submitSignedDoProof,
    attachAndSyncProofFilesToReturn: attachAndSyncProofFilesToReturn,
    ensureReturnProofSyncedToCloud: ensureReturnProofSyncedToCloud,
    backfillMissingCloudProofs: autoBackfillMissingCloudProofs,
    syncExistingProofToCloudNow: syncExistingProofToCloudNow,
    inferAndNormalizeProofMime: inferAndNormalizeProofMime,
    saveLocalProofDocsToIdb: saveLocalProofDocsToIdb,
    loadLocalProofDocsFromIdb: loadLocalProofDocsFromIdb,
    viewSignedProof: viewSignedProof,
    isStockTransferOrTransit: isStockTransferOrTransit,
    isEligibleForCnReminder: isEligibleForCnReminder,
    normalizeSupplierWaPhone: normalizeSupplierWaPhone,
    buildPublicDoProofUrl: buildPublicDoProofUrl,
    buildSupplierCnReminderMessage: buildSupplierCnReminderMessage,
    openCnReminderModal: openCnReminderModal,
    closeCnReminderModal: closeCnReminderModal,
    refreshCnReminderMessagePreview: refreshCnReminderMessagePreview,
    sendCnReminderWhatsApp: sendCnReminderWhatsApp,
    copyCnReminderMessage: copyCnReminderMessage,
    previewPublicDoProofInNewTab: previewPublicDoProofInNewTab,
    renderPublicDoProofPortal: renderPublicDoProofPortal,
    openSettleCnModal: openSettleCnModal,
    closeSettleCnModal: closeSettleCnModal,
    submitSettleCn: submitSettleCn,
    deleteReturn: deleteReturnRecord,
    exportExcel: exportReturnsToExcel,
    downloadHqExcelTemplate: downloadHqExcelTemplate,
    getReturnsData: getReturnsData,
    setReturnsData: setReturnsData,
    onCloudSync: onCloudSync,
    syncWithOneDrive: () => syncReturnsWithOneDrive(getActiveBranchName()),
    syncWithGoogleSheets: (forcePush = false) => syncReturnsWithGoogleSheets(getActiveBranchName(), forcePush)
  };

  // Global convenience aliases
  window.openEditReturnModal = openEditReturnModal;
  window.openSettleCnModal = openSettleCnModal;
  window.openCnReminderModal = openCnReminderModal;
  window.deleteReturnRecord = deleteReturnRecord;
  window.viewSignedProof = viewSignedProof;
  window.removeDraftItemRow = removeDraftItemRow;
  window.downloadHqExcelTemplate = downloadHqExcelTemplate;

  // Auto-init on page load if container exists (skip during external ?doProof= view)
  document.addEventListener('DOMContentLoaded', () => {
    const sp = new URLSearchParams(window.location.search || '');
    if (sp.get('doProof') || sp.get('cnProof')) return;
    if (document.getElementById('content-returns')) {
      initReturnsModule();
    }
  });

})(window);
