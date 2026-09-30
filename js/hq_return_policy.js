// js/hq_return_policy.js — HQ Returnable & Non-Returnable Policy Engine
// Live Synced with Google Sheet: https://docs.google.com/spreadsheets/d/1u2wfNbx77eiah3g3NPofbS391uESt7tA/edit?gid=179261997#gid=179261997
'use strict';

window.PMG_DEFAULT_HQ_RETURN_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1u2wfNbx77eiah3g3NPofbS391uESt7tA/export?format=csv&gid=179261997';

window.PMG_HQ_GENERAL_TERMS = [
  "ALL PRODUCT THAT COME IN SET MUST RETURN IN SET. LOOSE ITEMS ARE NON RETURNABLE Manufactiry Defect Example as Follow",
  "\"Manufactory Defect MOSTLY are returnable  BUT better refer to purchaser for request return\" Capsule Missing ✅",
  "Loose items MOSTLY are NON-Returnable Capsule Opened ✅",
  "***Promo Pack/ Value Pack MUST return original pack**** Cap Break ✅",
  "\"****NO MOVING/ 7 MONTHS BEFORE EXPIRY DATE  CAN ASK PURCHASER TO REQUEST FROM SUPPLIER TO DO MARKETING****\"",
  "Person in Charge for Poison - Ms Lim 011-36830 7966",
  ""
];

window.PMG_HQ_RETURN_POLICY_SEED = [
  {
    "code": "101672",
    "desc": "XEPA REMAFEN 50MG TAB",
    "brand": "APEX01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103018",
    "desc": "XEPA REMAFEN 50MG TAB",
    "brand": "APEX01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101625",
    "desc": "XEPA DEXTRACIN DEXA+NEO EYE/EAR DROPS 5ML",
    "brand": "APEX01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101465",
    "desc": "FEBRICOL RX TAB",
    "brand": "APEX01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112799",
    "desc": "AVOZINE TABLET 5MG 10'S",
    "brand": "APEX04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "138133",
    "desc": "ALOVASC 10MG TAB 10'S - AEVA",
    "brand": "APEX04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "138132",
    "desc": "ALOVASC 5MG TAB 10'S - AEVA",
    "brand": "APEX04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "122242",
    "desc": "AVO AVOXIDIL TOPICAL SOLUTION 50MG/ML 60ML",
    "brand": "APEX04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116418",
    "desc": "AVO ASTATIN 20MG TAB 28'S",
    "brand": "APEX04",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116407",
    "desc": "AVO ASTATIN 10MG TAB 28'S",
    "brand": "APEX04",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116367",
    "desc": "AVO AVORIUS (DESLORATADINE) 5MG TAB 10'S",
    "brand": "APEX04",
    "policy": "1. Manufacturing Defects",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114039",
    "desc": "ZOSAAR HCT 50/12.5MG TAB 10'S",
    "brand": "APEX04",
    "policy": "# Returns will only be accepted for products with verified manufacturing defects.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "108590",
    "desc": "MUROZIN OINTMENT 2% 5G",
    "brand": "APEX04",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104702",
    "desc": "AVEZOL 150MG CAP",
    "brand": "APEX04",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101777",
    "desc": "ZOSAAR 50MG TAB 10'S - AVO",
    "brand": "APEX04",
    "policy": "2. Product Recalls",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101670",
    "desc": "AVONAC SR100MG TAB",
    "brand": "APEX04",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "137748",
    "desc": "DUOFLOW 0.5MG/0.4MG CAP 30'S",
    "brand": "APEX06",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "128132",
    "desc": "SIAM VIVERE 5% W/W CREAM 5G",
    "brand": "APEX06",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114101",
    "desc": "LOMIDE CAPSULE 2MG 10'S CAPSULE",
    "brand": "APEX06",
    "policy": "3. Transit Damage",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113837",
    "desc": "SIAM KETAZON SHAMPOO 100ML",
    "brand": "APEX06",
    "policy": "# If product are dented/broken during delivery from SSJ PHARMA SDN BHD to OUTLET,",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105614",
    "desc": "MOLAX-M 10MG TAB 10'S",
    "brand": "APEX06",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "120564",
    "desc": "AVACORT HFA 200MCG - METERED DOSE INHALER",
    "brand": "APEX07",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110077",
    "desc": "TRANSAMIN 250MG CAP 10'S",
    "brand": "1stPHARMA",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116790",
    "desc": "DHNP HYDROXYUREA 500MG CAP 100'S",
    "brand": "1stPHARMA",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116195",
    "desc": "BIOCARE BIOMOL INHALER 100MCG/200D",
    "brand": "BIOCAR01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "145563",
    "desc": "BIOSONIDE 200MCG INH 300D",
    "brand": "BIOCAR01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "107316",
    "desc": "CHLOROP EYE OINTMENT 5GM",
    "brand": "BORNEO01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "108041",
    "desc": "FUSIX 40MG TAB 10'S",
    "brand": "BORNEO01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "108797",
    "desc": "POLYTET EYE OINTMENT 3.5G",
    "brand": "BORNEO01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113304",
    "desc": "POTRELEASE TR TAB 10'S",
    "brand": "BORNEO01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "129392",
    "desc": "HOVID-ROSUVASTATIN 10MG TAB 10'S",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "122746",
    "desc": "HOVID-ROSUVASTATIN 20MG TABLET 30'S",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "141100",
    "desc": "RITOVID 120MG TAB 3X10'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "132900",
    "desc": "DAPAVID 10MG TAB 7'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110961",
    "desc": "CLOFENAC 1% SPRAY GEL",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106898",
    "desc": "CLOFENAC 50MG TAB",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106272",
    "desc": "MONTELAIR TAB 10MG",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102659",
    "desc": "HOVID KETOFEN GEL 2.5% W/W 30G",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101425",
    "desc": "GRISEOFULVIN 500MG TAB 10'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "125229",
    "desc": "HOVID DIABETMIN XR 500MG TAB 10'S",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "141363",
    "desc": "HOVID-CELECOXIB 200MG CAP 10'SX10",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115528",
    "desc": "HOVID HOSOLVON DM ELIXIR (SUGAR FREE) 120ML",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113069",
    "desc": "DISUF-H CREAM 15G",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "111718",
    "desc": "HOVID GENTAMICIN CREAM 0.1% 15G",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109849",
    "desc": "HOVID CLOFENAC SR 100MG 100'S",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106922",
    "desc": "HOVID DIABETMIN RETARD 850MG TAB",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106401",
    "desc": "ALLOPURINOL 100MG TAB 10'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106097",
    "desc": "TERNOLOL 100MG TAB 10'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106079",
    "desc": "HOVID COLODIUM 2MG CAP 10 STRIP/BOX",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105356",
    "desc": "GLIMARYL 2MG TAB",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105284",
    "desc": "HOVID BETASONE CREAM 15G",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104155",
    "desc": "HOVID VIREST ACICLOVIR 5% CREAM 5G",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103504",
    "desc": "DIFLUVID 150MG CAP 4'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103491",
    "desc": "HOVID DIAMIDE 5MG/500MG TAB 10'S",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103480",
    "desc": "INOX 100MG CAP 4'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103403",
    "desc": "HOVID FAMOTIDINE 20MG TAB 10'S",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103392",
    "desc": "DOPATAB 250MG TAB 10'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103238",
    "desc": "FELXICAM CAPSULE 20MG",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103208",
    "desc": "OMEZOLE 20MG CAP 7'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102970",
    "desc": "HOVID HOVA EXPECTORANT SUGAR FREE SYRUP 120ML",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102180",
    "desc": "CALAZIN CREAM 15G",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101864",
    "desc": "HOVID FAMOTIDINE 40MG TAB 10'S",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101823",
    "desc": "HOVID GLIMICRON 80MG TAB",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101822",
    "desc": "HOVID CLAMIDE 5MG TAB",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101797",
    "desc": "TERNOLOL 50MG TAB 10'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101585",
    "desc": "KETOVID SHAMPOO 120ML BOT",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101427",
    "desc": "HOVASC 10MG TAB 10'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101426",
    "desc": "HOVASC 5MG TAB 10'S - HOVID",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101424",
    "desc": "CARZEPIN 200MG TAB 10'S",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101276",
    "desc": "HOVID VENTAMOL EXPECTORANT SYRUP",
    "brand": "CENTRA01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "111132",
    "desc": "ALCON SIMBRINZA 5ML",
    "brand": "DKSH01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103854",
    "desc": "EXFORGE 10/160 TAB",
    "brand": "DKSH01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103387",
    "desc": "CO-DIOVAN 160/25MG TAB 14'S - NOVARTIS",
    "brand": "DKSH01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102673",
    "desc": "TRAVOCORT CREAM 10G",
    "brand": "DKSH01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101818",
    "desc": "GALVUS MET 50MG/1000MG TAB 10'S",
    "brand": "DKSH01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101817",
    "desc": "GALVUS MET 50MG/850MG TAB 10'S - NOVARTIS",
    "brand": "DKSH01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101816",
    "desc": "GALVUS 50MG TAB 14'S - NOVARTIS",
    "brand": "DKSH01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101739",
    "desc": "CO-DIOVAN 160/12.5MG TAB 14'S - NOVARTIS",
    "brand": "DKSH01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101738",
    "desc": "CO-DIOVAN 80/12.5MG TAB 14'S - NOVARTIS",
    "brand": "DKSH01",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101737",
    "desc": "DIOVAN 160MG TABLET 14'S - NOVARTIS",
    "brand": "DKSH01",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101736",
    "desc": "DIOVAN 80MG TABLET 14'S - NOVARTIS",
    "brand": "DKSH01",
    "policy": "1. Manufacturing Defects",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101634",
    "desc": "ALCON NEVANAC NEPAFENAC OPTH SUSP 0.1% 5ML",
    "brand": "DKSH01",
    "policy": "# Returns will only be accepted for products with verified manufacturing defects.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101627",
    "desc": "ALCON TOBRADEX TOBRAMYCIN+DEXA OPTH SUSP 5ML",
    "brand": "DKSH01",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101506",
    "desc": "EXFORGE HCT 10/160/25MG TAB 7'S",
    "brand": "DKSH01",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101505",
    "desc": "EXFORGE HCT 10/160/12.5MG TAB 7'S",
    "brand": "DKSH01",
    "policy": "2. Product Recalls",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101503",
    "desc": "EXFORGE 5/160 TAB 28'S/BOX",
    "brand": "DKSH01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101502",
    "desc": "EXFORGE 5/80MG TAB 28'S",
    "brand": "DKSH01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101244",
    "desc": "FUCIDIN CR 15G",
    "brand": "DKSH01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101234",
    "desc": "FUCIDIN CR 5G",
    "brand": "DKSH01",
    "policy": "3. Transit Damage",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110213",
    "desc": "SIMVOR 10MG TAB 10'S - RANBAXY",
    "brand": "DKSH02",
    "policy": "# If product are dented/broken during delivery from SSJ PHARMA SDN BHD to OUTLET,",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101677",
    "desc": "RANBAXY DIFNAL-K 50MG TAB",
    "brand": "DKSH02",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103575",
    "desc": "SIMVOR 40MG TAB 10'S - RANBAXY",
    "brand": "DKSH02",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101855",
    "desc": "ZOLPRA GR 40MG TAB 7'S - RANBAXY",
    "brand": "DKSH02",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101750",
    "desc": "ROSART 50MG TAB 10'S - RANBAXY",
    "brand": "DKSH02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101748",
    "desc": "ROSART 100MG TAB 10'S - RANBAXY",
    "brand": "DKSH02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101711",
    "desc": "SIMVOR 20MG TAB 10'S - RANBAXY",
    "brand": "DKSH02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116319",
    "desc": "APROVASC 300MG/10MG TAB 28'S",
    "brand": "DKSH06",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116388",
    "desc": "APROVASC 300MG/5MG TAB 28'S SANOFI",
    "brand": "DKSH06",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116024",
    "desc": "APROVASC 150MG/10MG TAB 28'S",
    "brand": "DKSH06",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117862",
    "desc": "APROVASC 150MG/5MG TAB 28'S - SANOFI",
    "brand": "DKSH06",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104370",
    "desc": "COPLAVIX 75MG/100MG TAB 7'S",
    "brand": "DKSH06",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103398",
    "desc": "APROVEL 300MG TAB 14'S",
    "brand": "DKSH06",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101734",
    "desc": "APROVEL 150MG TAB 14'S - SANOFI",
    "brand": "DKSH06",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101733",
    "desc": "CO APROVEL 300/12.5MG TAB 14'S - SANOFI",
    "brand": "DKSH06",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101732",
    "desc": "CO APROVEL 150/12.5MG TAB 14'S - SANOFI",
    "brand": "DKSH06",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101595",
    "desc": "PLAVIX 75MG TAB 7'S",
    "brand": "DKSH06",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116276",
    "desc": "JARDIANCE DUO 12.5MG/1000MG TAB 60'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115596",
    "desc": "GLYXAMBI 10MG/5MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114430",
    "desc": "GLYXAMBI 25MG/5MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109275",
    "desc": "JARDIANCE 25MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109081",
    "desc": "JARDIANCE 10MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103667",
    "desc": "TWYNSTA 40MG/10MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103666",
    "desc": "TWYNSTA 80MG/5MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103665",
    "desc": "TWYNSTA 80MG/10MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103664",
    "desc": "TWYNSTA 40MG/5MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103663",
    "desc": "MICARDIS PLUS 80/12.5MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103662",
    "desc": "MICARDIS PLUS 40/12.5MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103661",
    "desc": "MICARDIS 40MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103660",
    "desc": "MICARDIS 80MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103482",
    "desc": "TRAJENTA DUO 2.5MG/1000MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103103",
    "desc": "BERODUAL N INHALER 10ML 200 METERED DOSES",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102814",
    "desc": "YASMIN 21'S TAB",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101867",
    "desc": "MERISLON EISAI 6MG TAB",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101838",
    "desc": "TRAJENTA 5MG TAB 10'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101692",
    "desc": "ULTRACET TAB 10'S - JANSSEN",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101633",
    "desc": "ALCON NAPHCON A NAPHAZOLINE EYE DROPS15ML",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101298",
    "desc": "MICROGYNON 30 TAB 21'S",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101297",
    "desc": "YAZ 28'S TAB",
    "brand": "DKSH09",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101468",
    "desc": "TELFAST 180MG TAB",
    "brand": "DKSH10",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101761",
    "desc": "TELFAST PEDIATRIC 30MG/5ML 60ML BOT - SANOFI",
    "brand": "DKSH10",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104430",
    "desc": "BUSCOPAN 10MG",
    "brand": "DKSH10",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103459",
    "desc": "MYONAL 50MG TAB 10'S",
    "brand": "DKSH11",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "140075",
    "desc": "DABIGATRAN 150MG CAP 3X10'S - SANDOZ",
    "brand": "DKSH13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "140074",
    "desc": "DABIGATRAN 110MG CAP 3X10'S - SANDOZ",
    "brand": "DKSH13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "135515",
    "desc": "HEMAPIX 5MG TAB 10'S - SANDOZ",
    "brand": "DKSH13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "135514",
    "desc": "HEMAPIX 2.5MG TAB 10'S - SANDOZ",
    "brand": "DKSH13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115290",
    "desc": "PANTOPRAZOLE SANDOZ 40MG BOX 14'S",
    "brand": "DKSH13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114530",
    "desc": "PREGABALIN SANDOZ 75MG CAP 7'S",
    "brand": "DKSH13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109356",
    "desc": "DICLAC RETARD 100MG",
    "brand": "DKSH13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103625",
    "desc": "OSPAMOX 500MG TAB 10'S - SANDOZ",
    "brand": "DKSH13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "146853",
    "desc": "ROSUVASTATIN SANDOZ 20MG TAB 15'S",
    "brand": "DKSH13",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "146852",
    "desc": "ROSUVASTATIN SANDOZ 10MG TAB 15'S",
    "brand": "DKSH13",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112200",
    "desc": "PROBITOR 20MG TAB 7'S - SANDOZ",
    "brand": "DKSH13",
    "policy": "1. Manufacturing Defects",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "108204",
    "desc": "ROSUVASTATIN SANDOZ 10MG TAB 10'S",
    "brand": "DKSH13",
    "policy": "# Returns will only be accepted for products with verified manufacturing defects.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "107583",
    "desc": "AMLIBON 5MG TAB 10'S",
    "brand": "DKSH13",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106705",
    "desc": "AMLIBON 10MG TAB 10'S - SANDOZ",
    "brand": "DKSH13",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103672",
    "desc": "ROTAQOR 10MG TAB 10'S - SANDOZ",
    "brand": "DKSH13",
    "policy": "2. Product Recalls",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103671",
    "desc": "ROTAQOR 20MG TAB 10'S - SANDOZ",
    "brand": "DKSH13",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "142182",
    "desc": "ROTAQOR 40MG TAB 10'S - SANDOZ",
    "brand": "DKSH13",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101805",
    "desc": "KOGREL 75MG TAB 7'S - SANDOZ",
    "brand": "DKSH13",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101454",
    "desc": "ASTHATOR TAB 10MG",
    "brand": "DKSH15",
    "policy": "3. Transit Damage",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101453",
    "desc": "ASTHATOR CHEWABLE TAB 5MG",
    "brand": "DKSH15",
    "policy": "# If product are dented/broken during delivery from SSJ PHARMA SDN BHD to OUTLET,",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101452",
    "desc": "ASTHATOR CHEWABLE TAB 4MG",
    "brand": "DKSH15",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115894",
    "desc": "PREGEB (PREGABALIN) 75MG CAP 30'S",
    "brand": "DKSH15",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110651",
    "desc": "NEXPRO 40MG TAB 7'S",
    "brand": "DKSH15",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106999",
    "desc": "ROSUCOR 10MG TAB 10'S",
    "brand": "DKSH15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106998",
    "desc": "ROSUCOR 20MG TAB 10'S",
    "brand": "DKSH15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103567",
    "desc": "DEPLATT 75MG TAB 10'S",
    "brand": "DKSH15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103361",
    "desc": "ESPRAN 10MG TAB 10'S",
    "brand": "DKSH15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103498",
    "desc": "METTA SR 500MG TAB 10'S - TORRENT",
    "brand": "DKSH15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103136",
    "desc": "NEBICARD 5MG TAB 10'S",
    "brand": "DKSH15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "149472",
    "desc": "PANTOR 40MG TAB 10'SX3 /BOX",
    "brand": "DKSH15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114833",
    "desc": "URIEF 4MG TAB 10'S",
    "brand": "DKSH18",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103211",
    "desc": "PARIET 20MG TAB 14'S",
    "brand": "DKSH18",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101243",
    "desc": "AMMI VOTARA GEL 20G",
    "brand": "HEALOL02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101701",
    "desc": "KANOLONE ORAL BASE 5G",
    "brand": "HEALOL02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101815",
    "desc": "PROGLUTROL G2 2/500MG TAB 10'S",
    "brand": "HEALOL02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101852",
    "desc": "LANPRO 30MG CAP 10'S",
    "brand": "HEALOL02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103455",
    "desc": "PROGLUTROL 500MG TAB",
    "brand": "HEALOL02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115037",
    "desc": "COMBINEB 2.5ML 60'S",
    "brand": "HEALOL02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "151098",
    "desc": "COX-OD 90 TAB 10'SX3 - MICRO",
    "brand": "HEALOL02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "119172",
    "desc": "TO CAFFOX TAB 10'S/BOX",
    "brand": "IMEKS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115556",
    "desc": "BISOHEXAL 2.5MG STRIP 25'S",
    "brand": "IMEKS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115401",
    "desc": "BISOHEXAL 5MG STRIP 25'S",
    "brand": "IMEKS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110684",
    "desc": "PRAZOSIN 2MG TAB 10'S - TO",
    "brand": "IMEKS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103329",
    "desc": "SPASIL TABLET 10'S",
    "brand": "IMEKS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101876",
    "desc": "MOTIDOM 10MG TAB 10'S",
    "brand": "IMEKS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101741",
    "desc": "AXINOL 20MG TAB 10'S",
    "brand": "IMEKS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101702",
    "desc": "KENO ORAL PASTE 3G",
    "brand": "IMEKS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101656",
    "desc": "HEXAL DICLAC 150 ID TAB",
    "brand": "IMEKS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101643",
    "desc": "TOLCHICINE COLCHICINE 0.6MG TAB",
    "brand": "IMEKS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101294",
    "desc": "SILVERDERM CR 50G",
    "brand": "IMEKS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116064",
    "desc": "OROPLUS GEL MENTHOL FLAVOUR 8G",
    "brand": "JBIO01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104950",
    "desc": "SINU-C SUSPENSION 100ML",
    "brand": "JBIO01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113313",
    "desc": "DERMAZOL PLUS GEL 10G",
    "brand": "JBIO01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110343",
    "desc": "COLDMAX SUSPENSION ORANGE 100ML",
    "brand": "JBIO01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110745",
    "desc": "WINOFEN SUSPENSION 2%W/V STRAWBERRY IBUPROFEN 100MG",
    "brand": "JBIO01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113785",
    "desc": "JEWIM MINOXIDIL TOPICAL SOLUTION 5% W/V",
    "brand": "JBIO04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116616",
    "desc": "NORMENS 5MG TAB 30'S",
    "brand": "JBIO04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116055",
    "desc": "FEBUTON (FEBUXOSTAT) 80MG TAB 28'S",
    "brand": "JBIO04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109064",
    "desc": "UNIREN SPRAY DICLOFENAC 1% 60ML",
    "brand": "JBIO04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103680",
    "desc": "COTREN VAGINAL TABLETS 500MG",
    "brand": "JBIO04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103479",
    "desc": "BIOZOLE 150MG CAP",
    "brand": "JBIO04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101295",
    "desc": "DESOLON 21'S TAB",
    "brand": "JBIO04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101235",
    "desc": "KOP 2.5% GEL",
    "brand": "JBIO04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117854",
    "desc": "FINAPECIA 1MG TAB 10'S - INTAS",
    "brand": "JETPHA02",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "118018",
    "desc": "CLOMAZOL-B CREAM 15G",
    "brand": "JSPHAR01",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117388",
    "desc": "PRIME'S CIMETIDINE 400MG TABLET 1000'S",
    "brand": "JSPHAR01",
    "policy": "1. Manufacturing Defects",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105699",
    "desc": "CLOMAZOL SOLUTION 1% 10ML",
    "brand": "JSPHAR01",
    "policy": "# Returns will only be accepted for products with verified manufacturing defects.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109188",
    "desc": "KLINDAM 150MG CAP 10'S - PRIME",
    "brand": "JSPHAR01",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110441",
    "desc": "SALOSONE OINTMENT 15G",
    "brand": "JSPHAR01",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101489",
    "desc": "ASMIN 4MG TAB",
    "brand": "JSPHAR01",
    "policy": "2. Product Recalls",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101488",
    "desc": "ASMIN 2MG TAB",
    "brand": "JSPHAR01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101447",
    "desc": "RASITIN 10MG TAB",
    "brand": "JSPHAR01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101678",
    "desc": "ALMIRAL 50MG TAB",
    "brand": "KOMEDI01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103473",
    "desc": "MEDOLIN 2MG TAB",
    "brand": "KOMEDI01",
    "policy": "3. Transit Damage",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103472",
    "desc": "MEDOLIN 4MG TAB",
    "brand": "KOMEDI01",
    "policy": "# If product are dented/broken during delivery from SSJ PHARMA SDN BHD to OUTLET,",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101718",
    "desc": "FENAMON 10MG TAB 10'S",
    "brand": "KOMEDI01",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101565",
    "desc": "MEDOVIR 400MG TAB 10'S",
    "brand": "KOMEDI01",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104240",
    "desc": "DAPRIL 10MG TAB 10'S",
    "brand": "KOMEDI01",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "145833",
    "desc": "RIVASON 20MG TAB",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "145832",
    "desc": "RIVASON 15MG TAB",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114305",
    "desc": "SUNWARD SUN-DIANOX TAB",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "126676",
    "desc": "ACTAVIS FEDAC SYRUP 120ML",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "125339",
    "desc": "SUNWARD METOCLOPRAMIDE 5MG/5ML SYRUP 120ML",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117368",
    "desc": "SW SUNPROX (NAPROXEN) 550MG TAB 10‘S",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112649",
    "desc": "SUNWARD SUNOLUT 5 MG TAB NORETHISTERONE",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "107414",
    "desc": "NALOL 40MG TAB 10'S - SUNWARD",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105249",
    "desc": "ROWATANAL CREAM 26G",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104541",
    "desc": "SUNWARD PROPERAZINE 5MG TABLET",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103458",
    "desc": "ONADRINE 50MG TAB 10'S",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101647",
    "desc": "DHASOLONE 5MG TAB 10'S - ACTAVIS",
    "brand": "MEDICAL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101584",
    "desc": "PRISTINE SHAMPOO 120ML BOT",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "120170",
    "desc": "XEPA EZEDE-D (GRAPE) BOT 60ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113213",
    "desc": "PROVINACE 4MG TAB 10'S - XEPA",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112582",
    "desc": "ZYLOVAA 100MG TAB 10'S",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112461",
    "desc": "XEPA COLIMIX SYRUP 60ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112098",
    "desc": "ZYLOVAA 50MG TAB 10'S",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106778",
    "desc": "VIZOMET OINTMENT 15G",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105743",
    "desc": "XEPA HYDROCORTISONE / XEPACORT CREAM 15G",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105610",
    "desc": "MUCOPROM SYRUP 120ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104344",
    "desc": "UNIFLEX 0.1% CR 15G",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104259",
    "desc": "ZYNOR 10MG TAB 10'S",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103841",
    "desc": "ZYNOR 5MG TAB 10'S",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103262",
    "desc": "SEDILIX-RX LINTUS CHERRY FLAVOR 120ML BOT",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103258",
    "desc": "VIZOMET CREAM 15G TUBE",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103255",
    "desc": "ADEZIO TABLET 10MG",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102981",
    "desc": "SEDILIX-RX LINCTUS SYRUP 90ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102979",
    "desc": "SEDILIX-DM LINCTUS SYRUP 90ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101870",
    "desc": "XEPA NOVOMIN 50MG TAB",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101858",
    "desc": "VENCID 40MG TAB 7'S - XEPA",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101846",
    "desc": "CAMAZOL 5MG TAB 10'S - XEPA",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101845",
    "desc": "XEPA ASLENE ORLISTAT 120MG CAP",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101790",
    "desc": "XEPA NORMATEN ATENOLOL 100MG",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101789",
    "desc": "XEPA NORMATEN ATENOLOL 50MG",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101782",
    "desc": "HYDROCHLORZIDE 50MG TAB 10'S - XEPA",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101768",
    "desc": "XEPA COLIMIX SYRUP 90ML BOT",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101763",
    "desc": "XEPA NOVOMIN SYRUP 60ML BOT",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101479",
    "desc": "EZEDE 10MG TAB",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101346",
    "desc": "ADEZIO CETIRIZINE HCI 1MG PER ML SYRUP",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101343",
    "desc": "COUGH-EN LINCTUS 90ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101342",
    "desc": "COUGH-EN RX LINCTUS 120ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101341",
    "desc": "COUGH-EN RX LINCTUS 90ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101340",
    "desc": "TUSSIDEX FORTE LINCTUS  120ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101339",
    "desc": "TUSSIDEX FORTE LINCTUS 90ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101338",
    "desc": "BENA EXPECTORANT  90ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101337",
    "desc": "BENA EXPECTORANT 120ML",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101322",
    "desc": "UNIVATE OINT 15G",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101301",
    "desc": "ZARICORT CREAM 15G",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101288",
    "desc": "VIZOMET CR 5G",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101245",
    "desc": "ZARIN CR 15G",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101224",
    "desc": "UNIVATE CR 15G",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101223",
    "desc": "UNIFLEX-N CR 15G",
    "brand": "APEX01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101850",
    "desc": "MILOSEC 20MG CAP 7'S - MILRIN",
    "brand": "MILRIN01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "119659",
    "desc": "COLCHIMIL 0.6MG TAB 10'S",
    "brand": "MILRIN01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103405",
    "desc": "DUOTRIC F/C 400MG TAB",
    "brand": "MILRIN01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139661",
    "desc": "TELMIDIP 80MG TAB 10'S - ALEMBIC",
    "brand": "PAHANG04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "129735",
    "desc": "TELMIDIP 40MG TAB 10'S - ALEMBIC",
    "brand": "PAHANG04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139538",
    "desc": "AMLOTEL 80/10MG TAB 14'S - ALEMBIC",
    "brand": "PAHANG04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139536",
    "desc": "AMLOTEL 40/10MG TAB 14'S - ALEMBIC",
    "brand": "PAHANG04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139535",
    "desc": "AMLOTEL 40/5MG TAB 14'S - ALEMBIC",
    "brand": "PAHANG04",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "121792",
    "desc": "PP - METOCLOPRAMIDE 10MG TAB (10'S X 100) 1000'S",
    "brand": "PAHANG04",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113229",
    "desc": "VICIDE CREAM 5% 10GM",
    "brand": "PAHANG04",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "118682",
    "desc": "CIPRODAC 500MG TAB - CADILA",
    "brand": "PAHANG04",
    "policy": "1. Manufacturing Defects",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "124019",
    "desc": "NP PREDNISOLONE 5MG TAB 10'S",
    "brand": "PAHANG04",
    "policy": "# Returns will only be accepted for products with verified manufacturing defects.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114613",
    "desc": "DEXFEN SYRUP 120ML",
    "brand": "PAHANG04",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "108551",
    "desc": "FLUCOZOL 150 CAP",
    "brand": "PAHANG04",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101654",
    "desc": "P.P NAPROXEN NA 550MG TAB 10'S - (50 X 10'S)",
    "brand": "PAHANG04",
    "policy": "2. Product Recalls",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "138634",
    "desc": "CELCOX 200MG CAP 10'S - ALEMBIC",
    "brand": "PAHANG04",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113877",
    "desc": "AMDEPIN 5MG TAB 10'S",
    "brand": "PAHANG01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110857",
    "desc": "AMDEPIN 10MG TAB",
    "brand": "PAHANG01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101293",
    "desc": "RIGEVIDON 21'S TAB",
    "brand": "PAHANG04",
    "policy": "3. Transit Damage",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101405",
    "desc": "POSTINOR 0.75MG TAB",
    "brand": "PAHANG04",
    "policy": "# If product are dented/broken during delivery from SSJ PHARMA SDN BHD to OUTLET,",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102982",
    "desc": "REGULON TAB",
    "brand": "PAHANG04",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102984",
    "desc": "ESCAPELLE TAB",
    "brand": "PAHANG04",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102994",
    "desc": "NORCOLUT TAB",
    "brand": "PAHANG04",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "107339",
    "desc": "BETANOR 24MG TAB 10'S",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117994",
    "desc": "NORIPHARMA MAXEFIL (SILDENAFIL) 100MG TAB 4'S",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117380",
    "desc": "AZALIA (DESOGESTREL) 0.075MG TABLET 28'S",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139381",
    "desc": "VALGEN-AM 160MG+10MG TAB 8'S - ALEMBIC",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139380",
    "desc": "VALGEN-AM 160MG+5MG TAB 8'S - ALEMBIC",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "130171",
    "desc": "NODON 5MG TAB 14'S - CADILA",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "126954",
    "desc": "ALEMBIC ERICOX 120MG TAB 10'SX10",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "126953",
    "desc": "ALEMBIC ERICOX 90MG TAB 10'SX10",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "125501",
    "desc": "DAYLINA 3MG/0.02MG TAB 28'S",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "121570",
    "desc": "MANKIND BACTAFUZ 2% CREAM 15G",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "121142",
    "desc": "MANKIND BACTAFUZ-B 15G",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "118048",
    "desc": "VOLINA 3MG/0.03MG TAB 21'S",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113382",
    "desc": "BETNESONE-G CREAM 15 GM",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112457",
    "desc": "SERRATA 10MG 20000 SERRATIOPEPTIDASE UNITS TABLET",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113381",
    "desc": "NP HYDROCORTISONE CREAM 15GM 1%W/W",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103340",
    "desc": "KAMIREN XL 4MG TAB 90'S",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103236",
    "desc": "GOUTNOR TABLET 0.6MG",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101849",
    "desc": "OMETAC 20MG CAP 7'S",
    "brand": "PAHANG04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103117",
    "desc": "BUDENASE AQ 64MCG/DOSE 120 METERED DOSE 6.0ML BOT",
    "brand": "PHARME01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106240",
    "desc": "AZEE 500 TAB 3'S",
    "brand": "PHARME01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112570",
    "desc": "NASEHALER NASAL SPRAY 140D/50MCG",
    "brand": "PHARME01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110076",
    "desc": "FINCAR 5MG TAB 10'S",
    "brand": "PHARME01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103107",
    "desc": "AEROCORT HFA INHALER 200 METERED DOSES CFC FREE",
    "brand": "PHARME01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101530",
    "desc": "DUOLIN RESPULES 2.5ML",
    "brand": "PHARME01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101495",
    "desc": "ASTHALIN HFA INHALER DOSES BOT",
    "brand": "PHARME01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102959",
    "desc": "IBUPROFEN 60ML - AXCEL",
    "brand": "PHARME02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103787",
    "desc": "CETRIZINE SYRUP 60ML - AXCEL",
    "brand": "PHARME02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103788",
    "desc": "LORATADINE SYRUP 60ML - AXCEL",
    "brand": "PHARME02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104906",
    "desc": "CHLORPHENIRAMINE-4 SYRUP 60ML - AXCEL",
    "brand": "PHARME02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106965",
    "desc": "DICYCLOMINE-S 100ML BOT - AXCEL",
    "brand": "PHARME02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "108872",
    "desc": "SALBUTAMOL 2MG SYRUP 60ML - AXCEL",
    "brand": "PHARME02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110104",
    "desc": "CHLORPHENIRAMINE-2 SYRUP 60ML - AXCEL",
    "brand": "PHARME02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115986",
    "desc": "CELEBIB (CELECOXIB) 200MG CAPSULE 100'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "127524",
    "desc": "CANDIGO 500MG",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101227",
    "desc": "AXCEL LIGNOCAINE 2% STERILE GEL 20G",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101360",
    "desc": "INDECIN 25MG CAP 10'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101568",
    "desc": "AXCEL CLINDAMYCIN 1%  BOT 30ML",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101649",
    "desc": "APO-ALLOPURINOL 300MG TAB 10'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101650",
    "desc": "APO-ALLOPURINOL 100MG TAB 10'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101651",
    "desc": "APO-NAPRO-NA DS 550MG TAB",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101652",
    "desc": "APO-NAPRO-NA 275MG TAB",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101742",
    "desc": "APO-METOPROLOL 100MG TAB 10'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102825",
    "desc": "APO-AMITRIPTYLINE 25MG TAB 10'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103655",
    "desc": "APO-HYDRO 25MG TAB 30'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114281",
    "desc": "CREOBIC DA (DOUBLE ACTION) CREAM 15G",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116307",
    "desc": "DYNA GABAPENTIN 300MG CAP 100'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116680",
    "desc": "SYNERRV DESLORATADINE 5MG TAB 100'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117336",
    "desc": "AXCEL CIMETIDINE - 400MG TAB 100'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "135293",
    "desc": "SYNERRV ATORVASTATIN 40MG TAB 7'S - IND-SWIFT",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106807",
    "desc": "MEXOMIDE 10MG TAB 10'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114629",
    "desc": "RANBAXY OZICLIDE MR 60MG TAB 10'S",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103886",
    "desc": "ENHANCIN 625MG TAB 10'S - RANBAXY",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "136103",
    "desc": "ESOZ 40MG TAB 10'S - SUN PHARMA",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "119499",
    "desc": "XOLSTAT 20MG TAB 10'SX3 - RANBAXY",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "129402",
    "desc": "TELEACT 80MG TAB 10'SX10 - RANBAXY",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103432",
    "desc": "RANBAXY MELARTIN 7.5MG TAB",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103431",
    "desc": "RANBAXY MELARTIN 15MG TAB",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101827",
    "desc": "RANBAXY REMICRON MR 30MG TAB",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101890",
    "desc": "CERUVIN 75MG TAB 10'S - RANBAXY",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103389",
    "desc": "INVORIL 10MG TAB 10'S - RANBAXY",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101796",
    "desc": "VAMLO 5MG TAB 10'S - RANBAXY",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101795",
    "desc": "VAMLO 10MG TAB 10'S - RANBAXY",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101713",
    "desc": "STORVAS C 40MG TAB 10X10'S - RANBAXY",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101712",
    "desc": "STORVAS C 20MG TAB 10'S - RANBAXY",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101747",
    "desc": "INVORIL 20MG TAB 10'S - RANBAXY",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101455",
    "desc": "RANBAXY AIRLUKAST 10MG TAB",
    "brand": "PHARME07",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103135",
    "desc": "STADOVAS 10MG TAB 10'S",
    "brand": "PHARME08",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103134",
    "desc": "STADOVAS 5MG TAB 10'S",
    "brand": "PHARME08",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116668",
    "desc": "CEZTI (CETIRIZINE) 10MG TAB 10'S",
    "brand": "PHARME08",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "126810",
    "desc": "STADELTINE 5MG TAB 10'SX5",
    "brand": "PHARME08",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "111401",
    "desc": "CETIZ SYRUP 75ML",
    "brand": "PHARMS02",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101374",
    "desc": "PN CETIRIZINE 10MG TAB",
    "brand": "PMNG03",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101375",
    "desc": "PN LORATADINE 10MG TAB",
    "brand": "PMNG03",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101418",
    "desc": "PHARMANIAGA GLICLAZIDE 80MG TAB",
    "brand": "PMNG03",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101419",
    "desc": "SIMVASTATIN 20MG TAB 10'S - PHARMANIAGA",
    "brand": "PMNG03",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101420",
    "desc": "SIMVASTATIN 40MG TAB 10'S - PHARMANIAGA",
    "brand": "PMNG03",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101807",
    "desc": "GLUMET DC 500MG TAB",
    "brand": "PMNG03",
    "policy": "1. Manufacturing Defects",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102534",
    "desc": "PHARMANIAGA GERMACID CREAM 2% TUBE 5G",
    "brand": "PMNG03",
    "policy": "# Returns will only be accepted for products with verified manufacturing defects.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103239",
    "desc": "SAFROSYN S TABLET 550MG",
    "brand": "PMNG03",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103397",
    "desc": "COVINACE 4MG 30'S/STRIP/BOX",
    "brand": "PMNG03",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103417",
    "desc": "SAFROSYN S 275MG TAB",
    "brand": "PMNG03",
    "policy": "2. Product Recalls",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103658",
    "desc": "METOPROLOL 100MG TAB 10'S - PHARMANIAGA",
    "brand": "PMNG03",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103659",
    "desc": "ATENOLOL 100MG TAB 10'S - PHARMANIAGA",
    "brand": "PMNG03",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106878",
    "desc": "PHARMANIAGA SALBUTAMOL EXPECTORANT 90ML",
    "brand": "PMNG03",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109839",
    "desc": "PN DIPHENHYDRAMINE EXPECTORANT 120ML",
    "brand": "PMNG03",
    "policy": "3. Transit Damage",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110075",
    "desc": "COVINACE 8MG TAB 10'S",
    "brand": "PMNG03",
    "policy": "# If product are dented/broken during delivery from SSJ PHARMA SDN BHD to OUTLET,",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110604",
    "desc": "PREDNISOLONE 5MG TAB 10'S - IDAMAN / PHARMANIAGA",
    "brand": "PMNG03",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110974",
    "desc": "GLUMET XR 750MG TAB",
    "brand": "PMNG03",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "111228",
    "desc": "GLUMET XR 500MG TAB 100'S PHARMANIAGA",
    "brand": "PMNG03",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "111229",
    "desc": "IQNYDE 100MG TAB 4'S",
    "brand": "PMNG03",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "111519",
    "desc": "PHARMANIAGA GERMACID OINTMENT 2% TUBE 15G",
    "brand": "PMNG03",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104103",
    "desc": "PHARMANIAGA MELOXICAM 7.5MG TAB",
    "brand": "PMNG03",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "111276",
    "desc": "ENTRESTO 100MG TAB 60'S - NOVARTIS",
    "brand": "TL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113702",
    "desc": "ENTRESTO 50MG 30'S - NOVARTIS",
    "brand": "TL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114841",
    "desc": "ENTRESTO 200MG TAB 60'S - NOVARTIS",
    "brand": "TL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101596",
    "desc": "APO-CLOPIDOGREL 75MG TAB 10'S",
    "brand": "TL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101600",
    "desc": "TIMOLOL-POS TIMOLOL MALEATE 0.5% EYE DROPS 5ML",
    "brand": "TL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101731",
    "desc": "APO-FENO SP 160MG TAB 10'S",
    "brand": "TL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101835",
    "desc": "HARNAL OCAS 400MCG TAB 10'S",
    "brand": "TL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103435",
    "desc": "VENAC SR 100MG TAB",
    "brand": "UMED01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "135437",
    "desc": "BISODAC-HF 2.5MG TAB 10'S - AUROBINDO",
    "brand": "UMED01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "135433",
    "desc": "BISODAC-HF 5MG TAB 10'S - AUROBINDO",
    "brand": "UMED01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "111208",
    "desc": "MYONIT INSTA NITROGLYCERIN 0.5MG 30'S",
    "brand": "UMED01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101237",
    "desc": "DICLORAN GEL 20G",
    "brand": "UMED01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101609",
    "desc": "KLORAXIN CMC OPTH EYE OINT 1% 5G",
    "brand": "UMED01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101684",
    "desc": "DICLORAN 50MG TAB",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101891",
    "desc": "CLOXACILLIN 500MG CAP 10'S - DYNA",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101579",
    "desc": "KRISOVIN 500MG TAB 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101543",
    "desc": "METROGYL 400MG TAB 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101431",
    "desc": "DYNA AMOXYCILLIN 250MG/5ML SUSP 60ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101367",
    "desc": "DOXYCYCLINE 100MG CAP 10'S - DYNA",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101366",
    "desc": "AMOXYCILLIN 500MG CAP 10'S - DYNA",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "121912",
    "desc": "CHLORAMINE 2.5MG SYRUP 90ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "120668",
    "desc": "PROMEDYL DM LINCTUS 90ML BOT",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "119398",
    "desc": "DUOPHARMA GLUCOXIT 500MG TAB (100X10'S)",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "118782",
    "desc": "DUOPHARMA EZENOL 160MG TAB 30'S/BOX",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "118745",
    "desc": "DUOPHARMA CRYSTORVAS 20MG (3X10'S) TAB",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "118665",
    "desc": "DUOPHARMA PROMESEC 20MG CAP 14'S (2X7'S)",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116197",
    "desc": "CCM NORDIPINE AMLODIPINE BESLATE 5MG TAB 30'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115841",
    "desc": "DUOPHARMA / CCM PROEZINE (PROMETHAZINE) 25MG TAB",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115524",
    "desc": "PREDNISYN 5MG TAB 10'S - DUOPHARMA",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115305",
    "desc": "CCM ACETAN LOSARTAN POTASSIUM 100MG TAB 30'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114875",
    "desc": "ACETAN LOSARTAN POTASSIUM 50MG TAB 10'S - CCM",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114568",
    "desc": "DYNADRYL SYRUP 100ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112551",
    "desc": "RALSIN 5MG TAB 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "111198",
    "desc": "ACETAN HCT 50/12.5MG TAB 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "107038",
    "desc": "DYNAPHAN SYRUP 100ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106289",
    "desc": "ACETAN HCT 100/25MG TAB 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105891",
    "desc": "DEXTROPHAN SYRUP 90ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104726",
    "desc": "SIMTEC 10MG TAB",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104371",
    "desc": "CCM ALLERSINE EYE DROPS 5ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104116",
    "desc": "ALLAVIN EXPECTORANT 90ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103772",
    "desc": "BETAWIN 50MG TAB 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103651",
    "desc": "COVASC 10MG TAB 10'S - CCM",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103650",
    "desc": "COVASC 5MG TAB 10'S - CCM",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103549",
    "desc": "IMDEX 60MG CR TAB 14'S - CCM",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103418",
    "desc": "DYFENAMIC 250MG CAP",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103396",
    "desc": "PERINACE 4MG TAB 10'S - CCM",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103368",
    "desc": "SPIRO 25MG TAB 10'S - CCM",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103322",
    "desc": "DYNAPHARM LOMODIUM CAPSULE 2MG",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103314",
    "desc": "CCM HYOMIDE TAB 10MG 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103310",
    "desc": "CCM HYDRINATE 50MG TAB",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103112",
    "desc": "CCM POCIN-H EAR DROPS 5ML BOT",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103010",
    "desc": "CHLORAMINE SYRUP 4MG 90ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102966",
    "desc": "SALTOLINE SYRUP 60ML - DYNA",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102793",
    "desc": "HYDRINATE SYRUP 90ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101868",
    "desc": "PROCHLOR 5MG TAB",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101749",
    "desc": "RALSIN 2MG TAB 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101709",
    "desc": "DEXALTIN ORAL PASTE 2G",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101707",
    "desc": "ORAL AID LOTION 6ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101623",
    "desc": "GENTA-DEX EYE DROPS 5ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101616",
    "desc": "NEO DECA NEO+DEXA EYE/EAR DROP 5ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101614",
    "desc": "BETACIN BETA+NEO EYE/EAR DROPS 5ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101526",
    "desc": "DYRITON 4MG TAB 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101389",
    "desc": "DEXALONE 0.75MG TAB 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101388",
    "desc": "DEXALONE 0.5MG TAB 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101383",
    "desc": "DUOPHARMA CHLORAMINE TAB 4MG",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101382",
    "desc": "DUOPHARMA / CCM DEXCHLORAMINE 2MG TAB",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101381",
    "desc": "ANAREX TAB 10'S",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101379",
    "desc": "ZOLTEROL SR 75MG TAB",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101378",
    "desc": "ZOLTEROL SR 100MG TAB",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101357",
    "desc": "UPHAMOL FLU TAB",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101350",
    "desc": "ZYNATEN SYRUP 60ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101349",
    "desc": "DYRITON SYRUP 4MG/5ML 60ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101274",
    "desc": "DYNA SALCODYL SYRUP 100ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101271",
    "desc": "UPHADYL FORTE EXPECTORANT 90ML",
    "brand": "UMHKUC01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "138079",
    "desc": "ATOSTIN TAB 20MG 3X10'S - YSP",
    "brand": "YSP01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "126065",
    "desc": "NORPHENADOL 35MG/450MG TAB 10'S - YSP",
    "brand": "YSP01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101558",
    "desc": "TIDACT 300MG CAP 10'S",
    "brand": "YSP01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116866",
    "desc": "YSP BISOCOR 5MG TAB",
    "brand": "YSP01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115414",
    "desc": "YSP BISOCOR 2.5MG TAB 10'S",
    "brand": "YSP01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103709",
    "desc": "BROZIL 300MG CAPSULE 10'S - YSP",
    "brand": "YSP01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103373",
    "desc": "RASITOL 40MG TAB 10'S - YSP",
    "brand": "YSP01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103317",
    "desc": "YSP CINNA TABLET 25MG 10'S",
    "brand": "YSP01",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102689",
    "desc": "YSP ISORADIN CREAM 10G",
    "brand": "YSP01",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102687",
    "desc": "YSP ECONAZINE CREAM 10GM",
    "brand": "YSP01",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102653",
    "desc": "YSP MELAQUIN CREAM 4% WITH SUNBLOCK SPF25++ 20G",
    "brand": "YSP01",
    "policy": "1. Manufacturing Defects",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102527",
    "desc": "YSP UCORT CREAM 20G TUBE",
    "brand": "YSP01",
    "policy": "# Returns will only be accepted for products with verified manufacturing defects.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101689",
    "desc": "YSP IBUPROFEN 400MG TAB",
    "brand": "YSP01",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101671",
    "desc": "YSP VOREN 50MG TAB",
    "brand": "YSP01",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101658",
    "desc": "PARAS TAB 10'S",
    "brand": "YSP01",
    "policy": "2. Product Recalls",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101657",
    "desc": "YSP PONTALON 500MG TAB",
    "brand": "YSP01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101646",
    "desc": "PREDNISOLONE 5MG TAB 10'S - YSP",
    "brand": "YSP01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101563",
    "desc": "YSP TIDACT GEL 1% 20GM",
    "brand": "YSP01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101562",
    "desc": "YSP VIRLESS CREAM 5G - ANTIVIRAL AGENT",
    "brand": "YSP01",
    "policy": "3. Transit Damage",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101448",
    "desc": "COPASTIN 10MG TAB",
    "brand": "YSP01",
    "policy": "# If product are dented/broken during delivery from SSJ PHARMA SDN BHD to OUTLET,",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101402",
    "desc": "TREN 250MG CAP 10'S",
    "brand": "YSP01",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101354",
    "desc": "YSP ECONAZINE CREAM 20G",
    "brand": "YSP01",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101246",
    "desc": "VOREN SUPP 12.5MG",
    "brand": "YSP01",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "100155",
    "desc": "TRETINON CREAM 0.05% 20G",
    "brand": "YSP01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "137333",
    "desc": "FIRIALTA 10MG TAB 28'S - BAYER",
    "brand": "ZUELLI01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "135138",
    "desc": "ATACAND 16MG TAB 15'S",
    "brand": "ZUELLI01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117579",
    "desc": "ELIQUIS 5MG BOX 60'S",
    "brand": "ZUELLI01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110276",
    "desc": "ELIQUIS 2.5MG TAB 10'S",
    "brand": "ZUELLI01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "107397",
    "desc": "XARELTO 20MG TAB - BAYER",
    "brand": "ZUELLI01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "107076",
    "desc": "XARELTO 15MG TAB",
    "brand": "ZUELLI01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106941",
    "desc": "MADOPAR 250 TAB 100'S",
    "brand": "ZUELLI01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103652",
    "desc": "PLENDIL 5MG TAB 15'S",
    "brand": "ZUELLI01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103393",
    "desc": "ATACAND PLUS 16/12.5MG TAB 15'S",
    "brand": "ZUELLI01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101722",
    "desc": "PLENDIL 10MG TAB 15'S",
    "brand": "ZUELLI01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101353",
    "desc": "NUROFEN SYR 100MG/5ML 60ML",
    "brand": "DKSH",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101482",
    "desc": "STREPSILS MAX PRO HONEY & LEMON LOZ",
    "brand": "DKSH",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "107127",
    "desc": "STREPSILS MAX PLUS 16 LOZENGES",
    "brand": "DKSH",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110421",
    "desc": "NUROFEN EXPRESS 684MG CAPLETS 12'S",
    "brand": "DKSH",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "122482",
    "desc": "STREPSILS MAX PRO DIRECT SPRAY 15ML",
    "brand": "DKSH",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115501",
    "desc": "TRIPLIXAM 5MG/1.25MG/10MG TAB 30'S",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114202",
    "desc": "NATRIXAM 1.5/5 MG MODIFIED RELEASE TAB 5'S",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112586",
    "desc": "TRIPLIXAM 5MG/1.25MG/5MG TAB 30'S",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110384",
    "desc": "TRIPLIXAM 10MG/2.5MG/10MG TAB 30'S",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103132",
    "desc": "COVERAM 5MG/5MG TAB 30'S BOT",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103131",
    "desc": "COVERAM 5MG/10MG TAB 30'S BOT",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102743",
    "desc": "DIAMICRON MR 60MG",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101793",
    "desc": "NATRILIX SR 1.5MG TAB 10'S",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101760",
    "desc": "VASTAREL MR 35MG TAB 30'S",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101757",
    "desc": "COVERAM 10MG/10MG TAB 30'S",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101755",
    "desc": "COVERSYL 5MG TAB 30'S",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101754",
    "desc": "COVERSYL PLUS 5MG/1.25MG TAB 30'S",
    "brand": "ZUELLI04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101824",
    "desc": "KOMBIGLYZE XR 5MG/1000MG TAB 7'S",
    "brand": "ZUELLI05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102820",
    "desc": "CRESTOR 20MG TAB 14'S",
    "brand": "ZUELLI05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102821",
    "desc": "CRESTOR 10MG TAB 14'S",
    "brand": "ZUELLI05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102954",
    "desc": "FORXIGA 10MG TAB 14'S - ASTRAZENECA",
    "brand": "ZUELLI05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109588",
    "desc": "XIGDUO XR 10/1000MG TAB 7'S",
    "brand": "ZUELLI05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110255",
    "desc": "CRESTOR 5MG TAB 14'S",
    "brand": "ZUELLI05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110403",
    "desc": "XIGDUO XR 5/1000MG TAB 7'S",
    "brand": "ZUELLI05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115881",
    "desc": "QTERN 5MG/10MG TAB 28'S",
    "brand": "ZUELLI05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101723",
    "desc": "COZAAR XQ 5/100MG TAB 3X10'S - MSD",
    "brand": "ZUELLI08",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101783",
    "desc": "FORTZAAR 100/25MG TAB 10'S",
    "brand": "ZUELLI08",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103399",
    "desc": "COZAAR 50MG TAB 15'S",
    "brand": "ZUELLI08",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103829",
    "desc": "EZETROL 10MG TAB 10'S",
    "brand": "ZUELLI08",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103853",
    "desc": "COZAAR 100MG TAB 10'S",
    "brand": "ZUELLI08",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103871",
    "desc": "COZAAR XQ 5/50MG TAB 3X10'S",
    "brand": "ZUELLI08",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114410",
    "desc": "ATOZET 10/40MG TAB 10'S - MSD",
    "brand": "ZUELLI08",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "140230",
    "desc": "COZAAR XQ 5/100MG TAB 6X5'S - ORGANON",
    "brand": "ZUELLI08",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "146986",
    "desc": "COZAAR XQ 5/50MG TAB 6X5'S",
    "brand": "ZUELLI08",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101451",
    "desc": "ACUSTOP CATAPLASMA 10CMX14CM PLASTER 6'S",
    "brand": "ZUELLI11",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102859",
    "desc": "KENHANCER PLASTER",
    "brand": "ZUELLI11",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101808",
    "desc": "JANUMET 50MG/500MG TAB 7'S",
    "brand": "ZUELLI12",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101809",
    "desc": "JANUMET 50MG/850MG TAB 7'S",
    "brand": "ZUELLI12",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101810",
    "desc": "JANUMET 50MG/1000MG TAB 7'S",
    "brand": "ZUELLI12",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101830",
    "desc": "JANUVIA 100MG TAB 14'S - MSD",
    "brand": "ZUELLI12",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104322",
    "desc": "JANUMET XR 100MG/1000MG TAB 7'S",
    "brand": "ZUELLI12",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104407",
    "desc": "JANUMET XR 50MG/1000MG TAB",
    "brand": "ZUELLI12",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101664",
    "desc": "LYRICA 75MG HARD CAP 14'S - PFIZER",
    "brand": "ZUELLI13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101725",
    "desc": "CADUET 10MG/10MG TAB 10'S - PFIZER",
    "brand": "ZUELLI13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101778",
    "desc": "VIAGRA 100MG TAB 4'S - PFIZER / VIATRIS",
    "brand": "ZUELLI13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101786",
    "desc": "NORVASC 10MG TAB 10'S - PFIZER",
    "brand": "ZUELLI13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101787",
    "desc": "NORVASC 5MG TAB 10'S - PFIZER",
    "brand": "ZUELLI13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103668",
    "desc": "LIPITOR 20MG TAB 10'S",
    "brand": "ZUELLI13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104328",
    "desc": "LIPITOR 10MG TAB 10'S",
    "brand": "ZUELLI13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116931",
    "desc": "CELEBREX 200MG CAP 30'S",
    "brand": "ZUELLI13",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101281",
    "desc": "DIANE 35 TAB 21'S",
    "brand": "ZUELLI14",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101407",
    "desc": "MERCILON TAB",
    "brand": "ZUELLI16",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101408",
    "desc": "MARVELON TAB 21'S",
    "brand": "ZUELLI16",
    "policy": "1. Manufacturing Defects",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105330",
    "desc": "CERAZETTE TAB 28'S",
    "brand": "ZUELLI16",
    "policy": "# Returns will only be accepted for products with verified manufacturing defects.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "127526",
    "desc": "FOSAMAX PLUS 70MG/5600IU TAB 4'S",
    "brand": "ZUELLI16",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110969",
    "desc": "NEBILET 5MG TAB 14'S",
    "brand": "ZUELLI17",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106433",
    "desc": "DEXILANT 60MG CAP 7'S",
    "brand": "ZUELLI20",
    "policy": "2. Product Recalls",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109850",
    "desc": "DEXILANT 30MG CAP 7'S",
    "brand": "ZUELLI20",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115821",
    "desc": "VOCINTI 20MG TAB 10'S - TAKEDA",
    "brand": "ZUELLI20",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101844",
    "desc": "CONTROLOC 40MG TAB 7'S",
    "brand": "ZUELLI20",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117677",
    "desc": "GLUCOPHAGE 1000MG TAB (8X15'S) 120'S MERCK",
    "brand": "ZUELLI26",
    "policy": "3. Transit Damage",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117156",
    "desc": "GLUCOPHAGE (METFORMIN) 500MG TAB 120'S MERCK",
    "brand": "ZUELLI26",
    "policy": "# If product are dented/broken during delivery from SSJ PHARMA SDN BHD to OUTLET,",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113029",
    "desc": "GLUCOPHAGE XR 1000MG TAB 60'S",
    "brand": "ZUELLI26",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103485",
    "desc": "GLUCOVANCE 500MG/2.5MG TAB 20'S",
    "brand": "ZUELLI26",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103484",
    "desc": "GLUCOVANCE 500MG/5MG TAB",
    "brand": "ZUELLI26",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101813",
    "desc": "GLUCOPHAGE XR 500MG TAB 60'S",
    "brand": "ZUELLI26",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101812",
    "desc": "GLUCOPHAGE XR 750MG TAB 60'S",
    "brand": "ZUELLI26",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101811",
    "desc": "GLUCOPHAGE 850MG TAB 100'S",
    "brand": "ZUELLI26",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101753",
    "desc": "CONCOR 2.5MG TAB 10'S",
    "brand": "ZUELLI26",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101751",
    "desc": "CONCOR 5MG TAB 10'S",
    "brand": "ZUELLI26",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103349",
    "desc": "EUTHYROX 100MCG TAB 25'S",
    "brand": "ZUELLI26",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "134745",
    "desc": "EUTHYROX 50MCG TAB 25'S - MERCK",
    "brand": "ZUELLI26",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117177",
    "desc": "LODOZ TABLET 5MG/6.25MG BOX 30'S MERCK",
    "brand": "ZUELLI26",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116252",
    "desc": "CONCOR AM 5MG/10MG TAB 30'S",
    "brand": "ZUELLI26",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114368",
    "desc": "CONCOR AM 5MG/5MG TAB 10'S",
    "brand": "ZUELLI26",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103360",
    "desc": "EUTHYROX 25MCG 100'S",
    "brand": "ZUELLI26",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "107021",
    "desc": "HIDRASEC GRANULES 10MG (INFANT)",
    "brand": "ZUELLI27",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "132029",
    "desc": "HIDRASEC CHILDREN 30MG SAC 16'S",
    "brand": "ZUELLI27",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101412",
    "desc": "DUPHASTON 10MG TAB",
    "brand": "ZUELLI27",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101872",
    "desc": "BETASERC 24MG TAB 10'S",
    "brand": "ZUELLI27",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103214",
    "desc": "GANATON 50MG TAB 10'S - ABBOTT",
    "brand": "ZUELLI27",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103670",
    "desc": "LIPANTHYL PENTA 145MG TAB 10'S - ABBOTT",
    "brand": "ZUELLI27",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104963",
    "desc": "EVRA TRANSDERMAL PATCH 3'S",
    "brand": "ZUELLI27",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106821",
    "desc": "HYTRIN 5MG TAB 14'S",
    "brand": "ZUELLI27",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114477",
    "desc": "ZANIDIP 10MG TAB 14'S - ABBOTT",
    "brand": "ZUELLI27",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101228",
    "desc": "ELOMET CREAM 15G",
    "brand": "ZUELLI29",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101336",
    "desc": "ELOMET OINT 15G",
    "brand": "ZUELLI29",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101524",
    "desc": "NASONEX AQUEOUS NASAL SPRAY 0.05% 60 DOSES BOT",
    "brand": "ZUELLI29",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103118",
    "desc": "NASONEX AQUEOUS NASAL SPRAY 0.05% 140 DOSES BOT",
    "brand": "ZUELLI29",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103243",
    "desc": "AERIUS 5MG TAB 10'S",
    "brand": "ZUELLI29",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105291",
    "desc": "AERIUS ORAL SOLUTION 0.5MG/ML 60ML",
    "brand": "ZUELLI29",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115506",
    "desc": "LUSEFI 5MG TAB 10'S",
    "brand": "ZUELLI30",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117543",
    "desc": "LUSEFI (LUSEOGLIFLOZIN) 2.5MG TAB 100'S",
    "brand": "ZUELLI30",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "108158",
    "desc": "PABRON COUGH & SINUS 120ML",
    "brand": "ZUELLI30",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "121069",
    "desc": "LOCOA (ESFLURBIPROFEN) 40MG TRANSDERMAL 7'S PATCH/PACK",
    "brand": "ZUELLI30",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116052",
    "desc": "PFZ METHOTREXATE 2.5MG BOX 30'S",
    "brand": "ZUELLI31",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "108237",
    "desc": "AZOREN 40MG/10MG TAB 10'S",
    "brand": "ZUELLI31",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "107859",
    "desc": "AZOREN 20MG/5MG TAB 10'S",
    "brand": "ZUELLI31",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105331",
    "desc": "MINULET 21'S",
    "brand": "ZUELLI31",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103395",
    "desc": "AZOREN 40MG/5MG TAB 10'S",
    "brand": "ZUELLI31",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103069",
    "desc": "OLMETEC 40MG TAB 10'S - PFIZER",
    "brand": "ZUELLI31",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103022",
    "desc": "TERRAMYCIN OPHTHALMIC OINTMENT 3.5GM",
    "brand": "ZUELLI31",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101726",
    "desc": "OLMETEC 20MG TAB 10'S - PFIZER",
    "brand": "ZUELLI31",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101660",
    "desc": "PFIZER PONSTAN 500MG TAB",
    "brand": "ZUELLI31",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101409",
    "desc": "NORDETTE TAB",
    "brand": "ZUELLI31",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101406",
    "desc": "NORIDAY 350MG TAB",
    "brand": "ZUELLI31",
    "policy": "1. Manufacturing Defects",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101282",
    "desc": "LOETTE 21'S TAB",
    "brand": "ZUELLI31",
    "policy": "# Returns will only be accepted for products with verified manufacturing defects.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105737",
    "desc": "NEXIUM 20MG TAB 7'S",
    "brand": "ZUELLI36",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103192",
    "desc": "SYMBICORT TURBUHALER 160/4.5MCG 60 DOSE BOT",
    "brand": "ZUELLI36",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101843",
    "desc": "NEXIUM 40MG TAB 7'S",
    "brand": "ZUELLI36",
    "policy": "2. Product Recalls",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101522",
    "desc": "SYMBICORT TURBUHALER 160/4.5ug/120 DOSES BOT",
    "brand": "ZUELLI36",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "137337",
    "desc": "APEXIB 2.5MG TAB 3X10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "137228",
    "desc": "APEXIB 5MG TAB 6X10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "131003",
    "desc": "DAPIGA 10MG 10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "3. Transit Damage",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "125877",
    "desc": "AMVAL AMLODIPINE 10MG/160MG TABLET",
    "brand": "ZUELLI40",
    "policy": "# If product are dented/broken during delivery from SSJ PHARMA SDN BHD to OUTLET,",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "125876",
    "desc": "AMVAL AMLODIPINE 5MG/160MG TABLET",
    "brand": "ZUELLI40",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "125875",
    "desc": "AMVAL AMLODIPINE 5MG/80MG TABLET",
    "brand": "ZUELLI40",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139526",
    "desc": "RIVAX 20MG TAB 10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "128648",
    "desc": "DUORIDE-T 0.5MG/0.4MG CAP 6'S",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "123683",
    "desc": "NOVUGAB 75MG CAP 6 X 10'S",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "131741",
    "desc": "VOZAN 20MG TAB 10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "132827",
    "desc": "NOVAMTEL 5MG/80MG TAB 10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "132828",
    "desc": "NOVAMTEL 10MG/80MG TAB 10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "134214",
    "desc": "NOVAMTEL 10MG/40MG TAB 10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "134215",
    "desc": "NOVAMTEL 5MG/40MG TAB 10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "138310",
    "desc": "AVAZET 10MG/20MG TAB 10'S",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "138915",
    "desc": "AVAZET 10MG/40MG TAB 10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "141360",
    "desc": "SAVAGEN 24MG/26MG FC TAB 3X10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "141361",
    "desc": "SAVAGEN 49MG/51MG FC TAB 6X10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "141362",
    "desc": "SAVAGEN 97MG/103MG FC TAB 6X10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "142154",
    "desc": "SITAVIO-M 50MG/1000MG TAB 10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "142318",
    "desc": "SITAVIO-M 50MG/500MG TAB 10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "142319",
    "desc": "SITAVIO-M 50MG/850MG TAB 10'S - NOVUGEN",
    "brand": "ZUELLI40",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115711",
    "desc": "KETOSTERIL TAB 100'S",
    "brand": "ZUELLI42",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101299",
    "desc": "LIZ EXELTIS 28'S TAB",
    "brand": "ZUELLI45",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102985",
    "desc": "LIZA EXELTIS 21'S TAB",
    "brand": "ZUELLI45",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112563",
    "desc": "TAFLOTAN OPTHALMIC SOLUTION 0.0015% 2.5ML",
    "brand": "ZUELLI46",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "121621",
    "desc": "D-CURE 25000 IU ORAL SOLUTION AMPOULES 4'S - HYPHENS",
    "brand": "ZUELLI47",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "128987",
    "desc": "ERDOMED 300MG CAP 10'S - HYPHENS",
    "brand": "ZUELLI47",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139931",
    "desc": "DAPZIN 10MG FC TAB 10'S - MICRO LABS",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "138405",
    "desc": "KARDAM 5MG TAB 10'S - AUROBINDO",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "138406",
    "desc": "KARDAM 10MG TAB 10'S - AUROBINDO",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "138403",
    "desc": "SARANTO 100MG TAB 10'S - AUROBINDO",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101776",
    "desc": "SARANTO 50MG TAB 10'S",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "136767",
    "desc": "ZELOMAC 40MG TAB 7'S",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "131503",
    "desc": "MUODERM OINTMENT 15G",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "121201",
    "desc": "DESTACURE (DESLORATADINE 2.5MG/5ML) SYRUP 60ML",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "116053",
    "desc": "GELOXIB (CELECOXIB) 200MG CAP 30'S",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "115373",
    "desc": "REVOKE-1.5 TAB 1'S - MYLAN",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "111818",
    "desc": "SALBUNEB SALBUTAMOL 2.5MG/2.5ML",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101400",
    "desc": "ORALCON 0.15MG/0.03MG TAB 21'S - MYLAN",
    "brand": "HEALOL01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101238",
    "desc": "POLYBAMYCIN OINT 10G",
    "brand": "ZYFAS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "125927",
    "desc": "DR.REDDY'S ATOCOR 10MG TAB 30'S",
    "brand": "ZYFAS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "106807",
    "desc": "MEXOMIDE 10MG TAB 10'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "137370",
    "desc": "DAPAZOX 10MG TAB 7'S - HETERO",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "135293",
    "desc": "SYNERRV ATORVASTATIN 40MG TAB 7'S - IND-SWIFT",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117336",
    "desc": "AXCEL CIMETIDINE - 400MG TAB 100'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114281",
    "desc": "CREOBIC DA (DOUBLE ACTION) CREAM 15G",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103655",
    "desc": "APO-HYDRO 25MG TAB 30'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101742",
    "desc": "APO-METOPROLOL 100MG TAB 10'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101650",
    "desc": "APO-ALLOPURINOL 100MG TAB 10'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101649",
    "desc": "APO-ALLOPURINOL 300MG TAB 10'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101568",
    "desc": "AXCEL CLINDAMYCIN 1%  BOT 30ML",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101360",
    "desc": "INDECIN 25MG CAP 10'S",
    "brand": "PHARME04",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139659",
    "desc": "RACETASH CHILDREN 30MG SAC 16'S - ETASH",
    "brand": "PHARMS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139660",
    "desc": "RACETASH INFANT 10MG SAC 16'S - ETASH",
    "brand": "PHARMS01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101869",
    "desc": "VELOXIN 25/50MG TAB",
    "brand": "SUMMIT01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "142246",
    "desc": "XAGLIMET XR 10/1000 TAB 10'S",
    "brand": "SYNERCARM",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101485",
    "desc": "DIFFLAM FORTE SF THROAT SPRAY 15ML BOT",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101494",
    "desc": "NUELIN SR 250 BRONCHODILATOR TAB",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102999",
    "desc": "DIFFLAM-C SOLUTION 100ML",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103526",
    "desc": "DIFFLAM MINT SUGAR FREE LOZENGES 8'S STRIP",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103527",
    "desc": "DIFFLAM RASBERRY SUGAR FREE LOZENGES",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105250",
    "desc": "DIFFLAM SOLUTION 100ML",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "108151",
    "desc": "DIFFLAM HONEY LEMON SUGAR FREE LOZENGES",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103344",
    "desc": "CIALIS 20MG TAB - LILY",
    "brand": "ZUELLI02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105945",
    "desc": "CIALIS 5MG TAB - LILY",
    "brand": "ZUELLI02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "113314",
    "desc": "MAXIGESIC 500MG/150MG TAB",
    "brand": "ZUELLI02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117138",
    "desc": "KETOTOP (KETOPROFEN) 30MG PLASTER 7'S",
    "brand": "ZUELLI02",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103122",
    "desc": "ILIADIN DECONGESTANT 0.01% NASAL DROPS FOR INFANT 5ML BOT",
    "brand": "ZUELLI10",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103291",
    "desc": "ILIADIN DECONGESTANT 0.025% NASAL DROPS FOR SMALL CHILDREN 10ML BOT",
    "brand": "ZUELLI10",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101485",
    "desc": "DIFFLAM FORTE SF THROAT SPRAY 15ML BOT",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101494",
    "desc": "NUELIN SR 250 BRONCHODILATOR TAB",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102999",
    "desc": "DIFFLAM-C SOLUTION 100ML",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103526",
    "desc": "DIFFLAM MINT SUGAR FREE LOZENGES 8'S STRIP",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103527",
    "desc": "DIFFLAM RASBERRY SUGAR FREE LOZENGES",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105250",
    "desc": "DIFFLAM SOLUTION 100ML",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "108151",
    "desc": "DIFFLAM HONEY LEMON SUGAR FREE LOZENGES",
    "brand": "ZUELLI15",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "129997",
    "desc": "CLARICLEAR NASAL SPRAY 15ML - BAYER",
    "brand": "ZUELLI25",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101523",
    "desc": "RHINOCORT AQUA 64MG/DOSE 120 DOSES BOT",
    "brand": "ZUELLI28",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "127133",
    "desc": "MOTILIUM 10MG TAB 25'SX4",
    "brand": "ZUELLI28",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "131648",
    "desc": "NICORETTE QUICKMIST NICOTINE 1MG/SPRAY MOUTHSPRAY 13.2ML",
    "brand": "ZUELLI28",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114120",
    "desc": "HOE ELONIDE NASAL SPRAY 50 MCG / 60DOSE",
    "brand": "ZUELLI35",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104343",
    "desc": "FOBAN CR 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104342",
    "desc": "FOBAN HYDRO OINTMENT 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104158",
    "desc": "T3 ADA ADAPALENE GEL 0.1% 25G",
    "brand": "ZUELLI35",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104081",
    "desc": "FOBAN HYDRO CREAM 15G",
    "brand": "ZUELLI35",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103859",
    "desc": "DEZOR PLUS SHAMPOO 60ML",
    "brand": "ZUELLI35",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103682",
    "desc": "HOE DECOZOL CREAM 15G",
    "brand": "ZUELLI35",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103318",
    "desc": "FOBANCORT CREAM 15G",
    "brand": "ZUELLI35",
    "policy": "1. Manufacturing Defects",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103199",
    "desc": "T3 MYCIN CLINDAMYCIN GEL 1% TUBE",
    "brand": "ZUELLI35",
    "policy": "# Returns will only be accepted for products with verified manufacturing defects.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103154",
    "desc": "T3 MYCIN CLINDAMYCIN LOTION 30ML BOT",
    "brand": "ZUELLI35",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103120",
    "desc": "HOE OXY-NASE NASAL SPRAY 0.05% 15ML BOT",
    "brand": "ZUELLI35",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103071",
    "desc": "CLODERM CREAM 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "2. Product Recalls",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102997",
    "desc": "HOE ORREPASTE 5G",
    "brand": "ZUELLI35",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102824",
    "desc": "HOE DEZOR CREAM 15G",
    "brand": "ZUELLI35",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102663",
    "desc": "HOE DECOZOL ORAL GEL 2% W/W 15G",
    "brand": "ZUELLI35",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102522",
    "desc": "CANDACORT CREAM 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "3. Transit Damage",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102521",
    "desc": "FOBANCORT OINTMENT 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "# If product are dented/broken during delivery from SSJ PHARMA SDN BHD to OUTLET,",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102520",
    "desc": "ELOSONE OINTMENT 0.1% 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102519",
    "desc": "ELOSONE CREAM 0.1% 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102518",
    "desc": "FOBAN OINTMENT 5G TUBE",
    "brand": "ZUELLI35",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102517",
    "desc": "FOBANCORT CREAM 5G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102516",
    "desc": "FOBANCORT OINTMENT 5G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102515",
    "desc": "FOBAN HYDRO CREAM 5G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102514",
    "desc": "FOBAN HYDRO OINTMENT 5G",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102513",
    "desc": "BEPROSONE OINTMENT 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102512",
    "desc": "H-CORT OINTMENT 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102511",
    "desc": "BEPROGENT CREAM 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102510",
    "desc": "H-CORT CREAM 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102509",
    "desc": "BEPROGENT OINTMENT 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102508",
    "desc": "BENOSONE OINTMENT 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102507",
    "desc": "BENOSONE CREAM 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102505",
    "desc": "CLODERM OINTMENT 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102504",
    "desc": "BEPROSALIC OINTMENT 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102503",
    "desc": "ECOCORT CREAM 15G",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102502",
    "desc": "BEPROSONE CREAM 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101576",
    "desc": "HOE EZENIDE LOTION 30ML BOT",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101574",
    "desc": "HOE CLODERM SCALP APPLICATION 30ML BOT",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101520",
    "desc": "HOE BUDENIDE NASAL SPRAY 64MG/DOSE120DOSES BOT",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101519",
    "desc": "HOE FLUTINIDE NASAL SPRAY 50MCG/DOSE 120DOSES BOT",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101306",
    "desc": "FOBAN OINT 15G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101226",
    "desc": "FOBAN CR 5G TUBE",
    "brand": "ZUELLI35",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "128210",
    "desc": "LIXIANA 30MG TABLET 28'S",
    "brand": "ZUELLI37",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "123267",
    "desc": "LIXIANA 60MG TABLET 28'S",
    "brand": "ZUELLI37",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "110349",
    "desc": "BILAXTEN TAB 20MG 10'S",
    "brand": "ZUELLI37",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105464",
    "desc": "FASTUM GEL 30G",
    "brand": "ZUELLI37",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101681",
    "desc": "ARCOXIA 90MG TAB 10'S",
    "brand": "ZUELLI37",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101680",
    "desc": "ARCOXIA 120MG TAB",
    "brand": "ZUELLI37",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117460",
    "desc": "SANDOZ TULIP 40MG TAB 30'S",
    "brand": "DKSH13",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103309",
    "desc": "METEOSPASMYL CAP",
    "brand": "ZUELLI38",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109736",
    "desc": "AUGMENTIN 625MG 7'S - GSK",
    "brand": "ZUELLI50",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105297",
    "desc": "SERETIDE EVOHALER 25/50 120 DOSES BOT",
    "brand": "ZUELLI50",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "105279",
    "desc": "SERETIDE EVOHALER 25/125 120 DOSES BOT",
    "brand": "ZUELLI50",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104340",
    "desc": "BETNOVATE -N CR 15G",
    "brand": "ZUELLI50",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103823",
    "desc": "AVAMYS NASAL SPRAY SUSP 60 SPRAYS",
    "brand": "ZUELLI50",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103822",
    "desc": "AVAMYS NASAL SPRAY SUSP 120 SPRAYS",
    "brand": "ZUELLI50",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103617",
    "desc": "AUGMENTIN 625MG TAB 10'S - GSK",
    "brand": "ZUELLI50",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103354",
    "desc": "DUODART 0.5MG/0.4MG CAP 30'S",
    "brand": "ZUELLI50",
    "policy": "NON-RETURNABLE",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103244",
    "desc": "XYZAL 5MG TABLET",
    "brand": "ZUELLI50",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103006",
    "desc": "AUGMENTIN 228MG/5ML SUSP 70ML",
    "brand": "ZUELLI50",
    "policy": "All products are non-returnable, except under the following conditions: ",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102671",
    "desc": "DERMOVATE OINTMENT 100GM",
    "brand": "ZUELLI50",
    "policy": "1. Manufacturing Defects",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102538",
    "desc": "DERMOVATE OINTMENT 15G TUBE",
    "brand": "ZUELLI50",
    "policy": "# Returns will only be accepted for products with verified manufacturing defects.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101513",
    "desc": "SERETIDE ACCUHALER 50/250 BOT",
    "brand": "ZUELLI50",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101510",
    "desc": "SERETIDE EVOHALER 25/250 120 DOSES BOT",
    "brand": "ZUELLI50",
    "policy": "#  Returned items must be in their original PUOM packaging.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101475",
    "desc": "ZYRTEC 10MG TAB",
    "brand": "ZUELLI50",
    "policy": "2. Product Recalls",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101222",
    "desc": "BETNOVATE CR 15G",
    "brand": "ZUELLI50",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "112802",
    "desc": "BENCODYL LINCTUS 100ML",
    "brand": "KCK01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "122824",
    "desc": "KCK SALMODEX SYRUP 100ML",
    "brand": "KCK01",
    "policy": "# Returns related to manufacturer recalls will be accepted only until the specified deadline given in the recall notice.",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "127244",
    "desc": "BECLOVID-C CREAM 15G",
    "brand": "HOVID01",
    "policy": "3. Transit Damage",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "117757",
    "desc": "FLUCOR DAY PE NON-DROWSY SOFTGELS CAPSULE 8'S",
    "brand": "HOVID01",
    "policy": "# If product are dented/broken during delivery from SSJ PHARMA SDN BHD to OUTLET,",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "111945",
    "desc": "HOVID DISUF-B CREAM 15G",
    "brand": "HOVID01",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "102537",
    "desc": "HOVID NEO-BETASONE CREAM 15G",
    "brand": "HOVID01",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "138404",
    "desc": "HITEN 4MG TAB 10'S - AUROBINDO",
    "brand": "HEALOL03",
    "policy": "please refer to the transportation-in -charge and provide supporting images .",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "140508",
    "desc": "COOLORA FORTE SPRAY 15ML - ICPA",
    "brand": "HEALOL03",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104128",
    "desc": "RABOTIDE 20MG CAP 10'S",
    "brand": "HEALOL03",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "118178",
    "desc": "MOMATE NASAL SPRAY 50MCG 140 DOSES",
    "brand": "DKSH23",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "114895",
    "desc": "MOMATE NASAL SPRAY 50MCG 60 DOSES",
    "brand": "DKSH23",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104443",
    "desc": "CANDID CLOTRIMAZOLE EAR DROPS 15ML",
    "brand": "DKSH23",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103552",
    "desc": "CANDID V1 500MG",
    "brand": "DKSH23",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103542",
    "desc": "CANDID V3 200MG",
    "brand": "DKSH23",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103253",
    "desc": "GLENCET TABLET 5MG",
    "brand": "DKSH23",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101333",
    "desc": "CANDID CR 20G",
    "brand": "DKSH23",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101323",
    "desc": "CANDID-B CR 15G",
    "brand": "DKSH23",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "131030",
    "desc": "TACROZ 0.1% OINTMENT 30G",
    "brand": "DKSH19",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "104444",
    "desc": "SUPIROCIN OINTMENT 5G TUBE",
    "brand": "DKSH19",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103870",
    "desc": "KONZERT 2% 20G CREAM",
    "brand": "DKSH19",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101329",
    "desc": "MOMATE OINTMENT 15G TUBE",
    "brand": "DKSH19",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101324",
    "desc": "DERIVA MS AQUEOUS GEL 15G",
    "brand": "DKSH19",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101241",
    "desc": "MOMATE CREAM 15G TUBE",
    "brand": "DKSH19",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "128872",
    "desc": "LIVALO 4MG TAB 10'S - KOWA",
    "brand": "DKSH05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "137333",
    "desc": "FIRIALTA 10MG TAB 28'S - BAYER",
    "brand": "DKSH05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109008",
    "desc": "BONVIVA 150MG TAB",
    "brand": "DKSH05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "103362",
    "desc": "EPILIM 200MG TAB 10'S",
    "brand": "DKSH05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101804",
    "desc": "DILATREND 25MG TAB 10'S",
    "brand": "DKSH05",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139534",
    "desc": "TELCORD H 80/12.5 TAB 10'S - ACCORD",
    "brand": "AIPHAR01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "139527",
    "desc": "TELCORD H 40/12.5 TAB 10'S - ACCORD",
    "brand": "AIPHAR01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "138729",
    "desc": "SITACORD 100MG TAB 10'S - ACCORD",
    "brand": "AIPHAR01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "136412",
    "desc": "TADACCORD 20MG TAB 4'S - ACCORD",
    "brand": "AIPHAR01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "134551",
    "desc": "CLAVIX 75MG TAB 10'S - ACCORD",
    "brand": "AIPHAR01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "134546",
    "desc": "LEVOCET 0.5MG/ML SYRUP 60ML - ASUMED",
    "brand": "AIPHAR01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "133135",
    "desc": "EZETIMIBE 10MG TAB 10'S - ACCORD",
    "brand": "AIPHAR01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "109431",
    "desc": "DICLOTROY EC 50MG TAB 10'S",
    "brand": "AIPHAR01",
    "policy": "*** No returns will be accepted for any other reasons not outlined in this policy ***",
    "status": "NON-RETURNABLE",
    "summary": "Non-returnable for expiry. (Only defect/recall accepted with PUOM packaging)"
  },
  {
    "code": "101508",
    "desc": "VENTOLIN EVOHALER 100 MG 200 DOSES BOT",
    "brand": "ZUELLI50",
    "policy": "Recommend to return BEFORE expiry date",
    "status": "RETURNABLE",
    "summary": "Returnable before expiry date"
  },
  {
    "code": "120048",
    "desc": "BEZONE OINTMENT 0.1% W/W 15G",
    "brand": "ADVANC02",
    "policy": "INFORM SALES REP THOMAS TO PAID",
    "status": "SPECIAL",
    "summary": "INFORM SALES REP THOMAS TO PAID"
  },
  {
    "code": "120047",
    "desc": "CLOBESOL OINTMENT 0.05% W/W 15G",
    "brand": "ADVANC02",
    "policy": "INFORM SALES REP THOMAS TO PAID",
    "status": "SPECIAL",
    "summary": "INFORM SALES REP THOMAS TO PAID"
  },
  {
    "code": "119644",
    "desc": "INFLAFEN (IBUPROFEN 200MG) TAB 10'S",
    "brand": "ADVANC02",
    "policy": "INFORM SALES REP THOMAS TO PAID",
    "status": "SPECIAL",
    "summary": "INFORM SALES REP THOMAS TO PAID"
  },
  {
    "code": "119339",
    "desc": "CLOBUTRATE CREAM 0.05% W/W 15G",
    "brand": "ADVANC02",
    "policy": "INFORM SALES REP THOMAS TO PAID",
    "status": "SPECIAL",
    "summary": "INFORM SALES REP THOMAS TO PAID"
  },
  {
    "code": "119338",
    "desc": "MINACORT CREAM 15G",
    "brand": "ADVANC02",
    "policy": "INFORM SALES REP THOMAS TO PAID",
    "status": "SPECIAL",
    "summary": "INFORM SALES REP THOMAS TO PAID"
  },
  {
    "code": "110372",
    "desc": "MPI ANPRODEX TAB 2MG",
    "brand": "ADVANC02",
    "policy": "INFORM SALES REP THOMAS TO PAID",
    "status": "SPECIAL",
    "summary": "INFORM SALES REP THOMAS TO PAID"
  },
  {
    "code": "106432",
    "desc": "MPI MECANDIN CREAM 15G",
    "brand": "ADVANC02",
    "policy": "INFORM SALES REP THOMAS TO PAID",
    "status": "SPECIAL",
    "summary": "INFORM SALES REP THOMAS TO PAID"
  },
  {
    "code": "103880",
    "desc": "BISCOMIN 8MG TAB",
    "brand": "ADVANC02",
    "policy": "INFORM SALES REP THOMAS TO PAID",
    "status": "SPECIAL",
    "summary": "INFORM SALES REP THOMAS TO PAID"
  },
  {
    "code": "103810",
    "desc": "BEZONE CREAM 15G",
    "brand": "ADVANC02",
    "policy": "INFORM SALES REP THOMAS TO PAID",
    "status": "SPECIAL",
    "summary": "INFORM SALES REP THOMAS TO PAID"
  }
];
