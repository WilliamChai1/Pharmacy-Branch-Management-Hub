// js/promo-broadcast.js — Module 8: Customer Special Offer & WhatsApp Broadcaster
// Enhanced with Auto Language by Customer (BM/Mandarin), Promo Auto-Translation, Poster Clipboard Support, Resizable Textboxes & Cross-Computer Sync
'use strict';

// ─── PRESET SEED DATA: NUTRIBRIDGE NUTRI ALPHA 800GM (209 TRANSACTIONS, 147 CUSTOMERS) ───
const NUTRI_ALPHA_PRESET_CAMPAIGN = {
  id: 'nutri-alpha-800g',
  name: 'NUTRIBRIDGE NUTRI ALPHA 800GM',
  productName: 'NUTRIBRIDGE NUTRI ALPHA 800GM',
  productCode: '132249',
  defaultPrice: 115,
  isPreset: true,
  createdAt: '2026-10-28T00:00:00.000Z',
  customers: [{"id":"CUST_1","name":"LAI JON SEN","phone":"601121093229","totalQty":9,"totalSpent":1145,"lastDate":"30-08-26 0:00","firstDate":"28-01-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI","LOLITA WONG LIN","JONG PEI CHOO","Muhammad Nur Farizin Bin Abdullah","KENIX LING WANG YING"],"history":[{"date":"28-01-26 0:00","price":115},{"date":"20-02-26 0:00","price":115},{"date":"14-04-26 0:00","price":115},{"date":"30-04-26 0:00","price":115},{"date":"17-05-26 0:00","price":115},{"date":"24-06-26 0:00","price":115},{"date":"12-07-26 0:00","price":115},{"date":"30-07-26 0:00","price":115},{"date":"30-08-26 0:00","price":225}]},{"id":"CUST_2","name":"RADIN MOHD NOR ABD QUDDUS BIN RADIN KADRI","phone":"60192111965","totalQty":1,"totalSpent":115,"lastDate":"30-01-26 0:00","firstDate":"30-01-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"30-01-26 0:00","price":115}]},{"id":"CUST_3","name":"EDMUND BANYOI ANAK GADAH","phone":"60198692892","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"31-01-26 0:00","price":115}]},{"id":"CUST_4","name":"NG CHUN BEE","phone":"60168597418","totalQty":2,"totalSpent":450,"lastDate":"10-06-26 0:00","firstDate":"31-01-26 0:00","salespersons":["LOLITA WONG LIN","CHAI YEE SIAN"],"history":[{"date":"31-01-26 0:00","price":225},{"date":"10-06-26 0:00","price":225}]},{"id":"CUST_5","name":"OLIVIA ANAK TARANG","phone":"60138459331","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"31-01-26 0:00","price":115}]},{"id":"CUST_6","name":"JONATHAN JANA ANAK ANGAT","phone":"60199008678","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"31-01-26 0:00","price":115}]},{"id":"CUST_7","name":"AZZY BINTI HASBI","phone":"60199915015","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"31-01-26 0:00","price":115}]},{"id":"CUST_8","name":"CHELSEA COHEN ANAK JOHNESS","phone":"60172707616","totalQty":1,"totalSpent":115,"lastDate":"14-02-26 0:00","firstDate":"14-02-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"14-02-26 0:00","price":115}]},{"id":"CUST_9","name":"TIONG TECK ONG","phone":"60168958065","totalQty":1,"totalSpent":115,"lastDate":"15-02-26 0:00","firstDate":"15-02-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"15-02-26 0:00","price":115}]},{"id":"CUST_10","name":"MONICA PHILIP ANGKOK","phone":"60128567492","totalQty":1,"totalSpent":225,"lastDate":"16-02-26 0:00","firstDate":"16-02-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"16-02-26 0:00","price":225}]},{"id":"CUST_11","name":"ANGELIA MYRA BINTI JIMMY","phone":"601131997165","totalQty":1,"totalSpent":225,"lastDate":"18-02-26 0:00","firstDate":"18-02-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"18-02-26 0:00","price":225}]},{"id":"CUST_12","name":"NOR SAFRINA BINTI SEPUNI","phone":"60169338307","totalQty":1,"totalSpent":115,"lastDate":"18-02-26 0:00","firstDate":"18-02-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-02-26 0:00","price":115}]},{"id":"CUST_13","name":"TOMMY ANAK JION","phone":"60136146261","totalQty":2,"totalSpent":230,"lastDate":"12-03-26 0:00","firstDate":"20-02-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","CHAI YEE SIAN"],"history":[{"date":"20-02-26 0:00","price":115},{"date":"12-03-26 0:00","price":115}]},{"id":"CUST_14","name":"TAY MOI TZE","phone":"60138166338","totalQty":1,"totalSpent":115,"lastDate":"26-02-26 0:00","firstDate":"26-02-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"26-02-26 0:00","price":115}]},{"id":"CUST_15","name":"JULIE WONG PEK SIONG","phone":"60124423108","totalQty":1,"totalSpent":115,"lastDate":"28-02-26 0:00","firstDate":"28-02-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"28-02-26 0:00","price":115}]},{"id":"CUST_16","name":"YEO KOK SENG","phone":"60198880882","totalQty":5,"totalSpent":795,"lastDate":"10-06-26 0:00","firstDate":"10-03-26 0:00","salespersons":["CHAI YEE SIAN","JONG PEI CHOO","LOLITA WONG LIN"],"history":[{"date":"10-03-26 0:00","price":225},{"date":"17-05-26 0:00","price":225},{"date":"10-06-26 0:00","price":115},{"date":"10-06-26 0:00","price":115}]},{"id":"CUST_17","name":"LAI JIUNG HIAN","phone":"60107756556","totalQty":2,"totalSpent":230,"lastDate":"21-10-26 0:00","firstDate":"10-03-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"10-03-26 0:00","price":115},{"date":"21-10-26 0:00","price":115}]},{"id":"CUST_18","name":"LEE KUOK CHING","phone":"60168986300","totalQty":1,"totalSpent":225,"lastDate":"11-03-26 0:00","firstDate":"11-03-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"11-03-26 0:00","price":225}]},{"id":"CUST_19","name":"HO CHOU FANG","phone":"60122809029","totalQty":3,"totalSpent":675,"lastDate":"24-06-26 0:00","firstDate":"12-03-26 0:00","salespersons":["CHAI YEE SIAN","HANIESHA LOUNA ANAK DAGENG","JONG PEI CHOO"],"history":[{"date":"12-03-26 0:00","price":225},{"date":"12-04-26 0:00","price":225},{"date":"24-06-26 0:00","price":225}]},{"id":"CUST_20","name":"TING YUNG HUA","phone":"601110668658","totalQty":1,"totalSpent":225,"lastDate":"13-03-26 0:00","firstDate":"13-03-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"13-03-26 0:00","price":225}]},{"id":"CUST_21","name":"TIEW YIEN YIEN","phone":"60168870506","totalQty":1,"totalSpent":225,"lastDate":"13-03-26 0:00","firstDate":"13-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"13-03-26 0:00","price":225}]},{"id":"CUST_22","name":"MUHAMAD BIN ZULKIPLI","phone":"60138176441","totalQty":1,"totalSpent":115,"lastDate":"15-03-26 0:00","firstDate":"15-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"15-03-26 0:00","price":115}]},{"id":"CUST_23","name":"CHIA NYAT LIAN","phone":"60168513478","totalQty":1,"totalSpent":225,"lastDate":"15-03-26 0:00","firstDate":"15-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"15-03-26 0:00","price":225}]},{"id":"CUST_24","name":"ABANG ISNAINI GAPOR","phone":"601121888813","totalQty":3,"totalSpent":345,"lastDate":"10-10-26 0:00","firstDate":"16-03-26 0:00","salespersons":["LAI PEY SHYAN","KENIX LING WANG YING","FIONA FIENA ANAK JAMES"],"history":[{"date":"16-03-26 0:00","price":115},{"date":"30-06-26 0:00","price":115},{"date":"10-10-26 0:00","price":115}]},{"id":"CUST_25","name":"SIGAN ANAK INDAH","phone":"60198158151","totalQty":1,"totalSpent":225,"lastDate":"16-03-26 0:00","firstDate":"16-03-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"16-03-26 0:00","price":225}]},{"id":"CUST_26","name":"TING SING YIUNG","phone":"60135789228","totalQty":1,"totalSpent":115,"lastDate":"17-03-26 0:00","firstDate":"17-03-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"17-03-26 0:00","price":115}]},{"id":"CUST_27","name":"MOHAMAD SEZIKI BIN RABIAN","phone":"60146769843","totalQty":2,"totalSpent":230,"lastDate":"30-09-26 0:00","firstDate":"18-03-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","NURHAFIZAH BINTI PAULI"],"history":[{"date":"18-03-26 0:00","price":115},{"date":"30-09-26 0:00","price":115}]},{"id":"CUST_28","name":"LEE SUK JOO","phone":"60138259188","totalQty":1,"totalSpent":225,"lastDate":"18-03-26 0:00","firstDate":"18-03-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"18-03-26 0:00","price":225}]},{"id":"CUST_29","name":"LIM ENG HUI","phone":"60146919831","totalQty":3,"totalSpent":675,"lastDate":"20-07-26 0:00","firstDate":"20-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","JONG PEI CHOO"],"history":[{"date":"20-03-26 0:00","price":225},{"date":"20-07-26 0:00","price":225}]},{"id":"CUST_30","name":"MICK ANAK SEMBONG","phone":"601112035053","totalQty":1,"totalSpent":115,"lastDate":"20-03-26 0:00","firstDate":"20-03-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"20-03-26 0:00","price":115}]},{"id":"CUST_31","name":"CHONG NYUK NGO","phone":"60165795448","totalQty":4,"totalSpent":570,"lastDate":"23-09-26 0:00","firstDate":"20-03-26 0:00","salespersons":["LOLITA WONG LIN","CHAI YEE SIAN"],"history":[{"date":"20-03-26 0:00","price":225},{"date":"23-09-26 0:00","price":115},{"date":"23-09-26 0:00","price":115}]},{"id":"CUST_32","name":"DABBIE ANAK ANDIN","phone":"60128527715","totalQty":1,"totalSpent":225,"lastDate":"21-03-26 0:00","firstDate":"21-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"21-03-26 0:00","price":225}]},{"id":"CUST_33","name":"BONG KUI NYUK","phone":"60178513829","totalQty":1,"totalSpent":115,"lastDate":"23-03-26 0:00","firstDate":"23-03-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"23-03-26 0:00","price":115}]},{"id":"CUST_34","name":"UNAI ANAK CHUNGAT","phone":"60138164594","totalQty":1,"totalSpent":115,"lastDate":"24-03-26 0:00","firstDate":"24-03-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"24-03-26 0:00","price":115}]},{"id":"CUST_35","name":"CHAI NYUK FAH","phone":"60138133363","totalQty":2,"totalSpent":230,"lastDate":"24-08-26 0:00","firstDate":"26-03-26 0:00","salespersons":["JONG PEI CHOO","Daniela Janet Anak Mustapha"],"history":[{"date":"26-03-26 0:00","price":115},{"date":"24-08-26 0:00","price":115}]},{"id":"CUST_36","name":"LIKIN  ANAK JAGA","phone":"60198271486","totalQty":2,"totalSpent":340,"lastDate":"28-04-26 0:00","firstDate":"27-03-26 0:00","salespersons":["JONG PEI CHOO","NURHAFIZAH BINTI PAULI"],"history":[{"date":"27-03-26 0:00","price":115},{"date":"28-04-26 0:00","price":225}]},{"id":"CUST_37","name":"LIAW KIM SIONG","phone":"60138126168","totalQty":1,"totalSpent":115,"lastDate":"27-03-26 0:00","firstDate":"27-03-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"27-03-26 0:00","price":115}]},{"id":"CUST_38","name":"TIONG MING","phone":"60198168181","totalQty":1,"totalSpent":655,"lastDate":"28-03-26 0:00","firstDate":"28-03-26 0:00","salespersons":["LAI PEY SHYAN"],"history":[{"date":"28-03-26 0:00","price":655}]},{"id":"CUST_39","name":"LEE TING BIU","phone":"60198776739","totalQty":1,"totalSpent":115,"lastDate":"28-03-26 0:00","firstDate":"28-03-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"28-03-26 0:00","price":115}]},{"id":"CUST_40","name":"PIROS ANAK RINIP","phone":"60198878991","totalQty":4,"totalSpent":460,"lastDate":"18-09-26 0:00","firstDate":"28-03-26 0:00","salespersons":["CHAI YEE SIAN","FIONA FIENA ANAK JAMES","JONG PEI CHOO","NURHAFIZAH BINTI PAULI"],"history":[{"date":"28-03-26 0:00","price":115},{"date":"23-06-26 0:00","price":115},{"date":"20-08-26 0:00","price":115},{"date":"18-09-26 0:00","price":115}]},{"id":"CUST_41","name":"PHANG SEN","phone":"60198844594","totalQty":1,"totalSpent":115,"lastDate":"11-04-26 0:00","firstDate":"11-04-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"11-04-26 0:00","price":115}]},{"id":"CUST_42","name":"CHOO CHENG SIANG","phone":"60198360379","totalQty":1,"totalSpent":115,"lastDate":"11-04-26 0:00","firstDate":"11-04-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"11-04-26 0:00","price":115}]},{"id":"CUST_43","name":"LO NYET JIN","phone":"60165762536","totalQty":1,"totalSpent":225,"lastDate":"12-04-26 0:00","firstDate":"12-04-26 0:00","salespersons":["Connie Voon Zhi Yin"],"history":[{"date":"12-04-26 0:00","price":225}]},{"id":"CUST_44","name":"HO NYUK LI","phone":"60168445119","totalQty":2,"totalSpent":230,"lastDate":"18-07-26 0:00","firstDate":"13-04-26 0:00","salespersons":["Connie Voon Zhi Yin","Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"13-04-26 0:00","price":115},{"date":"18-07-26 0:00","price":115}]},{"id":"CUST_45","name":"YUSUF BIN AWI","phone":"60178113871","totalQty":1,"totalSpent":115,"lastDate":"16-04-26 0:00","firstDate":"16-04-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"16-04-26 0:00","price":115}]},{"id":"CUST_46","name":"TAY LIP CHORNG","phone":"601125040518","totalQty":2,"totalSpent":230,"lastDate":"10-07-26 0:00","firstDate":"16-04-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"16-04-26 0:00","price":115},{"date":"10-07-26 0:00","price":115}]},{"id":"CUST_47","name":"MOHAMAD HAFEAZAL","phone":"60198522962","totalQty":1,"totalSpent":115,"lastDate":"18-04-26 0:00","firstDate":"18-04-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-04-26 0:00","price":115}]},{"id":"CUST_48","name":"HON KAH KANG","phone":"60109720718","totalQty":1,"totalSpent":115,"lastDate":"21-04-26 0:00","firstDate":"21-04-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"21-04-26 0:00","price":115}]},{"id":"CUST_49","name":"LAW HUA LIANG","phone":"60198764018","totalQty":1,"totalSpent":115,"lastDate":"21-04-26 0:00","firstDate":"21-04-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"21-04-26 0:00","price":115}]},{"id":"CUST_50","name":"NORLELA BINTI RAZALI","phone":"601135937008","totalQty":4,"totalSpent":460,"lastDate":"26-09-26 0:00","firstDate":"21-04-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","JONG PEI CHOO"],"history":[{"date":"21-04-26 0:00","price":115},{"date":"13-05-26 0:00","price":115},{"date":"27-07-26 0:00","price":115},{"date":"26-09-26 0:00","price":115}]},{"id":"CUST_51","name":"JOSEPHINE ANAK RIANG","phone":"60178536431","totalQty":2,"totalSpent":230,"lastDate":"30-05-26 0:00","firstDate":"24-04-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"24-04-26 0:00","price":115},{"date":"30-05-26 0:00","price":115}]},{"id":"CUST_52","name":"SATINA ANAK BERINAU","phone":"60138275056","totalQty":1,"totalSpent":115,"lastDate":"24-04-26 0:00","firstDate":"24-04-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"24-04-26 0:00","price":115}]},{"id":"CUST_53","name":"MOK YONG YU","phone":"60193133159","totalQty":1,"totalSpent":115,"lastDate":"30-04-26 0:00","firstDate":"30-04-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"30-04-26 0:00","price":115}]},{"id":"CUST_54","name":"LIEW JANG FOONG","phone":"60194678802","totalQty":1,"totalSpent":225,"lastDate":"30-04-26 0:00","firstDate":"30-04-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"30-04-26 0:00","price":225}]},{"id":"CUST_55","name":"LIEW JOON TAK","phone":"60194594509","totalQty":1,"totalSpent":115,"lastDate":"10-05-26 0:00","firstDate":"10-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"10-05-26 0:00","price":115}]},{"id":"CUST_56","name":"RADZIAH BINTI TINDI","phone":"60165079610","totalQty":1,"totalSpent":115,"lastDate":"11-05-26 0:00","firstDate":"11-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"11-05-26 0:00","price":115}]},{"id":"CUST_57","name":"TAJUL AKBAR","phone":"60138341944","totalQty":1,"totalSpent":115,"lastDate":"11-05-26 0:00","firstDate":"11-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"11-05-26 0:00","price":115}]},{"id":"CUST_58","name":"HO AH NYAIN","phone":"60168797658","totalQty":1,"totalSpent":115,"lastDate":"11-05-26 0:00","firstDate":"11-05-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"11-05-26 0:00","price":115}]},{"id":"CUST_59","name":"WEI CHUI PING","phone":"60198890178","totalQty":1,"totalSpent":225,"lastDate":"13-05-26 0:00","firstDate":"13-05-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"13-05-26 0:00","price":225}]},{"id":"CUST_60","name":"NIGEL YEO SEE KEE","phone":"601116652510","totalQty":1,"totalSpent":225,"lastDate":"18-05-26 0:00","firstDate":"18-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-05-26 0:00","price":225}]},{"id":"CUST_61","name":"MORIE ANAK DUNGGAU","phone":"60143685474","totalQty":1,"totalSpent":115,"lastDate":"18-05-26 0:00","firstDate":"18-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"18-05-26 0:00","price":115}]},{"id":"CUST_62","name":"CHANG LEE CHIN","phone":"60128807008","totalQty":1,"totalSpent":115,"lastDate":"18-05-26 0:00","firstDate":"18-05-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"18-05-26 0:00","price":115}]},{"id":"CUST_63","name":"HILDA FLORA ANAK RINAH","phone":"60198769074","totalQty":1,"totalSpent":225,"lastDate":"20-05-26 0:00","firstDate":"20-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"20-05-26 0:00","price":225}]},{"id":"CUST_64","name":"UH LEE LEE","phone":"60168970302","totalQty":1,"totalSpent":115,"lastDate":"20-05-26 0:00","firstDate":"20-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"20-05-26 0:00","price":115}]},{"id":"CUST_65","name":"LIN SHER LI","phone":"60176781558","totalQty":1,"totalSpent":115,"lastDate":"21-05-26 0:00","firstDate":"21-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"21-05-26 0:00","price":115}]},{"id":"CUST_66","name":"HASNAN BIN HASSAN","phone":"60198287300","totalQty":1,"totalSpent":115,"lastDate":"22-05-26 0:00","firstDate":"22-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"22-05-26 0:00","price":115}]},{"id":"CUST_67","name":"MISNA ANAK GUMBEK","phone":"60198875294","totalQty":6,"totalSpent":1130,"lastDate":"18-09-26 0:00","firstDate":"24-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","Daniela Janet Anak Mustapha","JONG PEI CHOO","NURHAFIZAH BINTI PAULI","Ting Kwang Yu"],"history":[{"date":"24-05-26 0:00","price":225},{"date":"29-06-26 0:00","price":115},{"date":"29-06-26 0:00","price":225},{"date":"26-07-26 0:00","price":225},{"date":"18-09-26 0:00","price":115},{"date":"18-09-26 0:00","price":225}]},{"id":"CUST_68","name":"Hiew Tze Mui","phone":"60168765993","totalQty":10,"totalSpent":1150,"lastDate":"25-05-26 0:00","firstDate":"25-05-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"25-05-26 0:00","price":115},{"date":"25-05-26 0:00","price":115},{"date":"25-05-26 0:00","price":115},{"date":"25-05-26 0:00","price":115}]},{"id":"CUST_69","name":"YEO SIEW CHING","phone":"60128941838","totalQty":1,"totalSpent":225,"lastDate":"26-05-26 0:00","firstDate":"26-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"26-05-26 0:00","price":225}]},{"id":"CUST_70","name":"Lucy Anak Andil","phone":"60198893215","totalQty":6,"totalSpent":690,"lastDate":"27-05-26 0:00","firstDate":"27-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"27-05-26 0:00","price":115}]},{"id":"CUST_71","name":"KHIEW SUI JIN","phone":"60138225828","totalQty":3,"totalSpent":345,"lastDate":"28-05-26 0:00","firstDate":"28-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"28-05-26 0:00","price":115}]},{"id":"CUST_72","name":"CHAI WAN CHIN","phone":"60147867976","totalQty":1,"totalSpent":115,"lastDate":"29-05-26 0:00","firstDate":"29-05-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"29-05-26 0:00","price":115}]},{"id":"CUST_73","name":"TING SHYH SHENG","phone":"60128099801","totalQty":1,"totalSpent":115,"lastDate":"31-05-26 0:00","firstDate":"31-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"31-05-26 0:00","price":115}]},{"id":"CUST_74","name":"Chu Suk Lin","phone":"60168908023","totalQty":1,"totalSpent":115,"lastDate":"12-06-26 0:00","firstDate":"12-06-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"12-06-26 0:00","price":115}]},{"id":"CUST_75","name":"YEO YEE KANG","phone":"60198355168","totalQty":1,"totalSpent":115,"lastDate":"13-06-26 0:00","firstDate":"13-06-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"13-06-26 0:00","price":115}]},{"id":"CUST_76","name":"Chung May Kin","phone":"60168094286","totalQty":3,"totalSpent":345,"lastDate":"17-06-26 0:00","firstDate":"17-06-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"17-06-26 0:00","price":115},{"date":"17-06-26 0:00","price":115}]},{"id":"CUST_77","name":"CHAI KHEK HIUN","phone":"601155505583","totalQty":2,"totalSpent":230,"lastDate":"18-10-26 0:00","firstDate":"21-06-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","NURHAFIZAH BINTI PAULI"],"history":[{"date":"21-06-26 0:00","price":115},{"date":"18-10-26 0:00","price":115}]},{"id":"CUST_78","name":"RADIAH ANAK JANGGOT","phone":"60198864658","totalQty":1,"totalSpent":115,"lastDate":"21-06-26 0:00","firstDate":"21-06-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"21-06-26 0:00","price":115}]},{"id":"CUST_79","name":"SEMRY ANAK SEMTIN","phone":"60138278157","totalQty":1,"totalSpent":225,"lastDate":"24-06-26 0:00","firstDate":"24-06-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"24-06-26 0:00","price":225}]},{"id":"CUST_80","name":"ROSEMARY ANAK SIRET","phone":"60138095857","totalQty":1,"totalSpent":115,"lastDate":"25-06-26 0:00","firstDate":"25-06-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"25-06-26 0:00","price":115}]},{"id":"CUST_81","name":"CHAI PHEI LAN","phone":"60168006763","totalQty":1,"totalSpent":115,"lastDate":"25-06-26 0:00","firstDate":"25-06-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"25-06-26 0:00","price":115}]},{"id":"CUST_82","name":"NG MIOW NOI","phone":"60135795123","totalQty":1,"totalSpent":115,"lastDate":"28-06-26 0:00","firstDate":"28-06-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"28-06-26 0:00","price":115}]},{"id":"CUST_83","name":"TEO CHONG NGIAN","phone":"60107856939","totalQty":1,"totalSpent":225,"lastDate":"28-06-26 0:00","firstDate":"28-06-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"28-06-26 0:00","price":225}]},{"id":"CUST_84","name":"HARWANDI","phone":"60135759940","totalQty":1,"totalSpent":115,"lastDate":"29-06-26 0:00","firstDate":"29-06-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"29-06-26 0:00","price":115}]},{"id":"CUST_85","name":"SIM KWANG MENG","phone":"60102897655","totalQty":2,"totalSpent":340,"lastDate":"11-07-26 0:00","firstDate":"11-07-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"11-07-26 0:00","price":115},{"date":"11-07-26 0:00","price":225}]},{"id":"CUST_86","name":"BONG SAN MOI","phone":"60168535952","totalQty":1,"totalSpent":115,"lastDate":"12-07-26 0:00","firstDate":"12-07-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"12-07-26 0:00","price":115}]},{"id":"CUST_87","name":"RICK METIL ANAK RIANG","phone":"601151952654","totalQty":1,"totalSpent":115,"lastDate":"14-07-26 0:00","firstDate":"14-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"14-07-26 0:00","price":115}]},{"id":"CUST_88","name":"MALING ANAK KALONG","phone":"6082611710","totalQty":1,"totalSpent":115,"lastDate":"15-07-26 0:00","firstDate":"15-07-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"15-07-26 0:00","price":115}]},{"id":"CUST_89","name":"BRONSON MOGGIE SULANG ANAK MURUI","phone":"60138117732","totalQty":1,"totalSpent":115,"lastDate":"15-07-26 0:00","firstDate":"15-07-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"15-07-26 0:00","price":115}]},{"id":"CUST_90","name":"LEE AH HIN","phone":"60109856838","totalQty":1,"totalSpent":115,"lastDate":"16-07-26 0:00","firstDate":"16-07-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"16-07-26 0:00","price":115}]},{"id":"CUST_91","name":"LAI JIN HIONG","phone":"60182067217","totalQty":2,"totalSpent":340,"lastDate":"10-10-26 0:00","firstDate":"16-07-26 0:00","salespersons":["KENIX LING WANG YING","JONG PEI CHOO"],"history":[{"date":"16-07-26 0:00","price":115},{"date":"10-10-26 0:00","price":225}]},{"id":"CUST_92","name":"Umi Hasma Salleh","phone":"60198378853","totalQty":1,"totalSpent":115,"lastDate":"17-07-26 0:00","firstDate":"17-07-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"17-07-26 0:00","price":115}]},{"id":"CUST_93","name":"ROSLINA BT ZAKARIA @ ROSALIND AK KUJA","phone":"601125001974","totalQty":1,"totalSpent":115,"lastDate":"19-07-26 0:00","firstDate":"19-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"19-07-26 0:00","price":115}]},{"id":"CUST_94","name":"SALINA ANAK JAMES MALONG","phone":"60194671968","totalQty":1,"totalSpent":115,"lastDate":"19-07-26 0:00","firstDate":"19-07-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"19-07-26 0:00","price":115}]},{"id":"CUST_95","name":"TING PIK KIONG","phone":"60127011750","totalQty":1,"totalSpent":225,"lastDate":"20-07-26 0:00","firstDate":"20-07-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"20-07-26 0:00","price":225}]},{"id":"CUST_96","name":"Chai Joon Khim","phone":"60198577058","totalQty":3,"totalSpent":455,"lastDate":"24-09-26 0:00","firstDate":"22-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha","Ting Kwang Yu"],"history":[{"date":"22-07-26 0:00","price":115},{"date":"24-09-26 0:00","price":115},{"date":"24-09-26 0:00","price":225}]},{"id":"CUST_97","name":"LU HUONG LAI","phone":"60138033738","totalQty":1,"totalSpent":115,"lastDate":"22-07-26 0:00","firstDate":"22-07-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"22-07-26 0:00","price":115}]},{"id":"CUST_98","name":"CHAI KHEK HIUN","phone":"60115611","totalQty":1,"totalSpent":115,"lastDate":"26-07-26 0:00","firstDate":"26-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"26-07-26 0:00","price":115}]},{"id":"CUST_99","name":"THEN PIK SIA","phone":"60162319226","totalQty":1,"totalSpent":115,"lastDate":"26-07-26 0:00","firstDate":"26-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"26-07-26 0:00","price":115}]},{"id":"CUST_100","name":"VOON MUI JIN","phone":"601165757118","totalQty":1,"totalSpent":115,"lastDate":"28-07-26 0:00","firstDate":"28-07-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"28-07-26 0:00","price":115}]},{"id":"CUST_101","name":"WONG HONG CHIN","phone":"60168885344","totalQty":2,"totalSpent":230,"lastDate":"23-10-26 0:00","firstDate":"30-07-26 0:00","salespersons":["JONG PEI CHOO","CHAI YEE SIAN"],"history":[{"date":"30-07-26 0:00","price":115},{"date":"23-10-26 0:00","price":115}]},{"id":"CUST_102","name":"DORIS CHONG LIONG LIN","phone":"60143922912","totalQty":1,"totalSpent":115,"lastDate":"31-07-26 0:00","firstDate":"31-07-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"31-07-26 0:00","price":115}]},{"id":"CUST_103","name":"MOHAMAD JALI BIN LILI","phone":"60135792514","totalQty":1,"totalSpent":115,"lastDate":"10-08-26 0:00","firstDate":"10-08-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"10-08-26 0:00","price":115}]},{"id":"CUST_104","name":"Sia Tay Kuek","phone":"60168521169","totalQty":4,"totalSpent":570,"lastDate":"20-09-26 0:00","firstDate":"11-08-26 0:00","salespersons":["KENIX LING WANG YING","FIONA FIENA ANAK JAMES"],"history":[{"date":"11-08-26 0:00","price":225},{"date":"20-09-26 0:00","price":115},{"date":"20-09-26 0:00","price":115}]},{"id":"CUST_105","name":"KERINE ANAK GADEP","phone":"60198393031","totalQty":2,"totalSpent":230,"lastDate":"13-10-26 0:00","firstDate":"11-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","Ting Kwang Yu"],"history":[{"date":"11-08-26 0:00","price":115},{"date":"13-10-26 0:00","price":115}]},{"id":"CUST_106","name":"NG SEY MOI","phone":"60108648228","totalQty":1,"totalSpent":225,"lastDate":"14-08-26 0:00","firstDate":"14-08-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"14-08-26 0:00","price":225}]},{"id":"CUST_107","name":"HAIRY BIN ALI","phone":"60178574075","totalQty":1,"totalSpent":115,"lastDate":"16-08-26 0:00","firstDate":"16-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"16-08-26 0:00","price":115}]},{"id":"CUST_108","name":"YONG WEE PIN","phone":"601116829106","totalQty":1,"totalSpent":115,"lastDate":"16-08-26 0:00","firstDate":"16-08-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"16-08-26 0:00","price":115}]},{"id":"CUST_109","name":"WONG SON ENG","phone":"60102715721","totalQty":1,"totalSpent":115,"lastDate":"17-08-26 0:00","firstDate":"17-08-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"17-08-26 0:00","price":115}]},{"id":"CUST_110","name":"NGIAN ANAK SELANG","phone":"60138272850","totalQty":1,"totalSpent":115,"lastDate":"18-08-26 0:00","firstDate":"18-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-08-26 0:00","price":115}]},{"id":"CUST_111","name":"CHAI SIEW MOI","phone":"601110578128","totalQty":2,"totalSpent":340,"lastDate":"22-10-26 0:00","firstDate":"19-08-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"19-08-26 0:00","price":115},{"date":"22-10-26 0:00","price":225}]},{"id":"CUST_112","name":"GILBERT JONG SIEW HUI","phone":"60143961188","totalQty":1,"totalSpent":115,"lastDate":"21-08-26 0:00","firstDate":"21-08-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"21-08-26 0:00","price":115}]},{"id":"CUST_113","name":"MOHAMMED AZIZUL BIN NASSIR","phone":"60138218691","totalQty":1,"totalSpent":115,"lastDate":"23-08-26 0:00","firstDate":"23-08-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"23-08-26 0:00","price":115}]},{"id":"CUST_114","name":"NULAI ANAK RUNDANG","phone":"60135680545","totalQty":1,"totalSpent":115,"lastDate":"23-08-26 0:00","firstDate":"23-08-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"23-08-26 0:00","price":115}]},{"id":"CUST_115","name":"CHONG LEE CHOO","phone":"60168596678","totalQty":2,"totalSpent":230,"lastDate":"24-10-26 0:00","firstDate":"24-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","JONG PEI CHOO"],"history":[{"date":"24-08-26 0:00","price":115},{"date":"24-10-26 0:00","price":115}]},{"id":"CUST_116","name":"TENG CONG XIN","phone":"60128909212","totalQty":1,"totalSpent":115,"lastDate":"27-08-26 0:00","firstDate":"27-08-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"27-08-26 0:00","price":115}]},{"id":"CUST_117","name":"KONG CHIA LING","phone":"60146884858","totalQty":2,"totalSpent":340,"lastDate":"28-08-26 0:00","firstDate":"28-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"28-08-26 0:00","price":115},{"date":"28-08-26 0:00","price":225}]},{"id":"CUST_118","name":"VOON TZE MIN","phone":"60138292238","totalQty":1,"totalSpent":115,"lastDate":"29-08-26 0:00","firstDate":"29-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"29-08-26 0:00","price":115}]},{"id":"CUST_119","name":"NGILIA ANAK LUTAM","phone":"60147541647","totalQty":1,"totalSpent":115,"lastDate":"29-08-26 0:00","firstDate":"29-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"29-08-26 0:00","price":115}]},{"id":"CUST_120","name":"THOMAS ANAK EMPENI","phone":"60122694138","totalQty":1,"totalSpent":115,"lastDate":"30-08-26 0:00","firstDate":"30-08-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"30-08-26 0:00","price":115}]},{"id":"CUST_121","name":"TAN THUANG HUI","phone":"60165759883","totalQty":3,"totalSpent":675,"lastDate":"20-10-26 0:00","firstDate":"30-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","Christina Lee Ying Ying"],"history":[{"date":"30-08-26 0:00","price":225},{"date":"30-08-26 0:00","price":225},{"date":"20-10-26 0:00","price":225}]},{"id":"CUST_122","name":"CHONG CHIEW YAN","phone":"60178992966","totalQty":2,"totalSpent":450,"lastDate":"23-10-26 0:00","firstDate":"31-08-26 0:00","salespersons":["JONG PEI CHOO","KENIX LING WANG YING"],"history":[{"date":"31-08-26 0:00","price":225},{"date":"23-10-26 0:00","price":225}]},{"id":"CUST_123","name":"LIIK HIE LOI","phone":"60168728017","totalQty":1,"totalSpent":115,"lastDate":"15-09-26 0:00","firstDate":"15-09-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"15-09-26 0:00","price":115}]},{"id":"CUST_124","name":"IMIR  TJHO","phone":"60168875905","totalQty":1,"totalSpent":115,"lastDate":"15-09-26 0:00","firstDate":"15-09-26 0:00","salespersons":["Ting Kwang Yu"],"history":[{"date":"15-09-26 0:00","price":115}]},{"id":"CUST_125","name":"CHUNG YIN LING","phone":"601116693493","totalQty":1,"totalSpent":115,"lastDate":"19-09-26 0:00","firstDate":"19-09-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"19-09-26 0:00","price":115}]},{"id":"CUST_126","name":"CHUNG AH GAN","phone":"60168316258","totalQty":1,"totalSpent":225,"lastDate":"20-09-26 0:00","firstDate":"20-09-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"20-09-26 0:00","price":225}]},{"id":"CUST_127","name":"KOO FOO KIAW","phone":"60128090836","totalQty":1,"totalSpent":115,"lastDate":"20-09-26 0:00","firstDate":"20-09-26 0:00","salespersons":["Ting Kwang Yu"],"history":[{"date":"20-09-26 0:00","price":115}]},{"id":"CUST_128","name":"CHAI LIAN CHOO","phone":"60138941176","totalQty":1,"totalSpent":225,"lastDate":"21-09-26 0:00","firstDate":"21-09-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"21-09-26 0:00","price":225}]},{"id":"CUST_129","name":"YEO SIEW CHIN","phone":"60198193376","totalQty":2,"totalSpent":450,"lastDate":"14-10-26 0:00","firstDate":"23-09-26 0:00","salespersons":["Ting Kwang Yu","JONG PEI CHOO"],"history":[{"date":"23-09-26 0:00","price":225},{"date":"14-10-26 0:00","price":225}]},{"id":"CUST_130","name":"TAN AI LAN","phone":"60168592845","totalQty":1,"totalSpent":115,"lastDate":"23-09-26 0:00","firstDate":"23-09-26 0:00","salespersons":["Ting Kwang Yu"],"history":[{"date":"23-09-26 0:00","price":115}]},{"id":"CUST_131","name":"MARUJU ANAK SADAGAR","phone":"60138386019","totalQty":1,"totalSpent":115,"lastDate":"24-09-26 0:00","firstDate":"24-09-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"24-09-26 0:00","price":115}]},{"id":"CUST_132","name":"LAI MUK SHIN","phone":"60168837003","totalQty":1,"totalSpent":115,"lastDate":"27-09-26 0:00","firstDate":"27-09-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"27-09-26 0:00","price":115}]},{"id":"CUST_133","name":"MOHAMMAD HAZILLIE BIN SATIM","phone":"60198540516","totalQty":1,"totalSpent":115,"lastDate":"30-09-26 0:00","firstDate":"30-09-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"30-09-26 0:00","price":115}]},{"id":"CUST_134","name":"MOHAMMAD AIDIL","phone":"60197252715","totalQty":1,"totalSpent":115,"lastDate":"30-09-26 0:00","firstDate":"30-09-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"30-09-26 0:00","price":115}]},{"id":"CUST_135","name":"CHANG AH LAT","phone":"60168901321","totalQty":1,"totalSpent":115,"lastDate":"10-10-26 0:00","firstDate":"10-10-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"10-10-26 0:00","price":115}]},{"id":"CUST_136","name":"PHU KIM LAI","phone":"60168099102","totalQty":1,"totalSpent":115,"lastDate":"12-10-26 0:00","firstDate":"12-10-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"12-10-26 0:00","price":115}]},{"id":"CUST_137","name":"CANDY ANAK NYOMUI","phone":"60168982642","totalQty":1,"totalSpent":115,"lastDate":"13-10-26 0:00","firstDate":"13-10-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"13-10-26 0:00","price":115}]},{"id":"CUST_138","name":"SUHARTI ANAK BIGIN","phone":"601119352830","totalQty":1,"totalSpent":115,"lastDate":"16-10-26 0:00","firstDate":"16-10-26 0:00","salespersons":["Christina Lee Ying Ying"],"history":[{"date":"16-10-26 0:00","price":115}]},{"id":"CUST_139","name":"MARIA TUBAK","phone":"60192060778","totalQty":2,"totalSpent":450,"lastDate":"18-10-26 0:00","firstDate":"18-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"18-10-26 0:00","price":225},{"date":"18-10-26 0:00","price":225}]},{"id":"CUST_140","name":"LAI NYIK CHOI","phone":"60177768236","totalQty":1,"totalSpent":115,"lastDate":"18-10-26 0:00","firstDate":"18-10-26 0:00","salespersons":["Christina Lee Ying Ying"],"history":[{"date":"18-10-26 0:00","price":115}]},{"id":"CUST_141","name":"CHONG FOO TECK","phone":"60128799378","totalQty":1,"totalSpent":115,"lastDate":"18-10-26 0:00","firstDate":"18-10-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-10-26 0:00","price":115}]},{"id":"CUST_142","name":"WONG LEE SIONG","phone":"60146986888","totalQty":1,"totalSpent":115,"lastDate":"19-10-26 0:00","firstDate":"19-10-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"19-10-26 0:00","price":115}]},{"id":"CUST_143","name":"ROHANA BINTI DIMIN","phone":"60168874842","totalQty":1,"totalSpent":115,"lastDate":"20-10-26 0:00","firstDate":"20-10-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"20-10-26 0:00","price":115}]},{"id":"CUST_144","name":"SAMSOLL OBING","phone":"601119890438","totalQty":2,"totalSpent":340,"lastDate":"25-10-26 0:00","firstDate":"25-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"25-10-26 0:00","price":225},{"date":"25-10-26 0:00","price":115}]},{"id":"CUST_145","name":"CHIN KIT LAM","phone":"601170057400","totalQty":1,"totalSpent":115,"lastDate":"26-10-26 0:00","firstDate":"26-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"26-10-26 0:00","price":115}]},{"id":"CUST_146","name":"JEZAMINE FIONA ANAK RAYMOND BRAOH","phone":"60128655926","totalQty":3,"totalSpent":455,"lastDate":"26-10-26 0:00","firstDate":"26-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"26-10-26 0:00","price":115},{"date":"26-10-26 0:00","price":225},{"date":"26-10-26 0:00","price":115}]},{"id":"CUST_147","name":"CHAN YAW BENG","phone":"60146779535","totalQty":1,"totalSpent":115,"lastDate":"27-10-26 0:00","firstDate":"27-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"27-10-26 0:00","price":115}]}]
};

// ─── SURNAMES & MALAYSIAN NAME CLASSIFIER ─────────────────────────────────────
const PROMO_CHINESE_SURNAMES = new Set([
  'ang','au','aw','bai','ban','bao','bee','beh','biu','boey','bok','bong','boon','cha','chai','cham','chan','chang','chao',
  'chau','chaw','chee','cheah','chen','cheng','cheo','cheok','cheong','chew','chia','chiang','chiao','chien','chieng','chiew',
  'chin','ching','chiong','chiu','cho','choi','chok','chong','choo','chooi','choon','chou','chow','choy','chu','chua','chuah',
  'chuan','chui','chun','chung','da','dai','dan','dang','ding','dong','doo','du','duan','eng','eow','er','fan','fang','fei',
  'feng','fok','fong','foo','foon','fu','gan','goh','gong','guan','gui','guo','ha','han','hang','hau','he','hee','heng','heo',
  'hew','hiew','hii','ho','hoh','hoke','hom','hon','hong','hoo','hoon','hor','how','hu','hua','huan','huang','hui','hung',
  'hwa','hwan','hwang','jeong','jia','jiang','jiao','jin','jio','jiong','jong','jun','ka','kan','kang','kao','kau','ke','kee',
  'keng','keo','kew','kha','khaw','khew','khiu','kho','khoo','khor','khou','khow','khu','kia','kian','kiang','kie','kien',
  'kiew','kim','kin','king','kiong','kiu','ko','koa','koe','koff','koh','kok','kon','kong','koo','kooi','koon','kow','ku',
  'kua','kuan','kuang','kueh','kui','kun','kung','kuo','kuok','kwan','kwee','kwek','kwo','kwok','kwon','la','lai','lam','lan',
  'lang','lao','lau','law','le','lee','lei','leng','leo','leok','leong','leow','leung','lew','li','liao','liaw','lie','lien',
  'liew','lim','lin','ling','lio','liong','liu','lo','loh','loi','lok','loke','long','loo','look','loon','low','lu','lua',
  'lui','luk','lum','lun','lung','luo','ma','mai','mak','man','mang','mao','mau','meh','mei','meng','mi','miao','miew','min',
  'ming','mo','moey','mok','mou','mu','mui','na','nan','neo','neoh','ng','ngai','ngan','ngi','ngiam','ngiew','ngoh','ngu',
  'ngui','ni','nie','ning','niu','nong','ong','ooi','ou','pa','pai','pak','pan','pang','pao','pe','pee','peh','pei','pek',
  'peng','peo','peow','pha','phan','phang','phi','phoon','phua','phuah','pi','pian','piau','pie','pien','pin','ping','piong',
  'po','poh','pok','pong','poo','poon','pua','puah','pui','pun','pung','qi','qian','qiao','qin','qing','qiu','qu','quan',
  'que','ra','ran','ren','rong','rou','ru','ruan','sa','sai','sam','san','sang','sau','saw','se','see','seh','sek','seng',
  'seo','seok','seong','seow','she','shek','shek','shen','sheng','shi','shih','shim','shin','shing','shiu','sho','shong','shoo',
  'shou','shu','shue','shum','shun','si','sia','siah','siam','sian','siao','siat','siau','sie','siew','sik','sim','sin','sing',
  'sio','siong','siow','sit','siu','so','soh','som','son','song','soo','sooi','soon','sou','su','sua','suan','sue','sui',
  'sum','sun','sung','sze','ta','tai','tam','tan','tang','tao','tay','te','tee','teh','tek','teng','teo','teoh','teow','thae',
  'tham','thang','thau','then','theng','thian','thien','thim','thio','thock','thong','thoo','thow','ti','tia','tian','tiang',
  'tiao','tie','tiew','tin','ting','tiong','tiu','tiun','tjho','tjoa','tjen','tjia','tjoeng','to','toh','tok','tong','too',
  'toon','tou','towe','tow','tsai','tsan','tsang','tsao','tse','tso','tsong','tsui','tu','tuan','tung','tuo','tye','ung','un',
  'voon','wah','wai','wan','wang','wee','wen','weng','wo','woh','won','wong','woo','woon','wu','wun','wung','xi','xia','xian',
  'xiang','xiao','xie','xin','xing','xiong','xu','xuan','xue','xun','yan','yang','yao','yap','yau','ye','yeap','yee','yeh',
  'yen','yeo','yeoh','yeok','yeon','yeong','yeow','yew','yi','yin','ying','yip','yiu','yong','yoo','yoon','you','young','yu',
  'yuan','yue','yuen','yun','yung'
]);

function detectCustomerLanguagePreference(customerName) {
  if (!customerName) return 'bm';
  if (/[\u4e00-\u9fa5]/.test(customerName)) return 'zh';

  const norm = ' ' + customerName.toLowerCase().replace(/[^a-z\s]/g, ' ') + ' ';
  const bmIndicators = [
    ' bin ', ' binti ', ' bte ', ' bt ', ' b ',
    ' anak ', ' a k ', ' ak ', ' a p ', ' ap ',
    ' abang ', ' abg ', ' dayang ', ' dyg ', ' awang ', ' awg ', ' radin ', ' syed ', ' sharifah ',
    ' mohd ', ' muhammad ', ' muhamad ', ' mohamad ', ' abdullah ', ' abdul ', ' hassan ', ' ahmad ',
    ' nor ', ' nur ', ' siti ', ' fatimah ', ' aishah ', ' zainal ', ' zulkifli ', ' hasbi ', ' rabian '
  ];
  if (bmIndicators.some(w => norm.includes(w))) return 'bm';

  const words = norm.trim().split(/\s+/).filter(Boolean);
  const hasChinese = words.some(w => PROMO_CHINESE_SURNAMES.has(w));
  return hasChinese ? 'zh' : 'bm';
}

// ─── PROMO PHRASE TRANSLATOR ENGINE ───────────────────────────────────────────
function translateEnglishPromo(text) {
  if (!text || !text.trim()) return { bm: '', zh: '' };

  let bm = text;
  let zh = text;

  const patterns = [
    // Buy X Free Y
    {
      regex: /\bbuy\s+(\d+)\s*(tins?|cans?|bottles?|boxes?|packs?|items?|units?)?\s*(free|get free)\s*(\d+)\s*(tins?|cans?|bottles?|boxes?|packs?|items?|units?)?\b/gi,
      bm: 'Beli $1 $2 Percuma $4 $5',
      zh: '买$1送$4'
    },
    // Buy X at RM Y
    {
      regex: /\bbuy\s+(\d+)\s*(tins?|cans?|bottles?|boxes?|packs?|items?|units?)?\s*(at|for|only)?\s*rm\s*(\d+(?:\.\d{2})?)\b/gi,
      bm: 'Beli $1 $2 pada harga RM$4',
      zh: '买$1特价 RM$4'
    },
    // Save RM X
    {
      regex: /\b(save|saving)\s*rm\s*(\d+(?:\.\d{2})?)\b/gi,
      bm: 'Jimat RM$2',
      zh: '节省 RM$2'
    },
    // Free Shaker / Free Gift
    {
      regex: /\b(free|complimentary)\s+(shaker(?:\s+cup)?|bottle)\b/gi,
      bm: 'Percuma Shaker Cup',
      zh: '免费赠送摇摇杯'
    },
    {
      regex: /\b(free|complimentary)\s+(gift|item)\b/gi,
      bm: 'Percuma Hadiah Eksklusif',
      zh: '免费赠送精美礼品'
    },
    // Special Offer / Promotion / Discount
    {
      regex: /\b(special offer|special promotion|promo deal)\b/gi,
      bm: 'Tawaran Istimewa',
      zh: '特别特惠'
    },
    {
      regex: /\b(special discount|exclusive discount)\b/gi,
      bm: 'Diskaun Khas',
      zh: '独家折扣'
    },
    // While stocks last
    {
      regex: /\b(while stocks? lasts?|limited stocks?|until stocks? last)\b/gi,
      bm: 'Sementara stok masih ada',
      zh: '存货有限，售完即止'
    },
    // Member price / For members
    {
      regex: /\b(member price|for members|members? only)\b/gi,
      bm: 'Harga Khas Ahli PMG',
      zh: 'PMG 会员专享价'
    },
    // Limited time offer
    {
      regex: /\b(limited time offer|limited time only)\b/gi,
      bm: 'Tawaran Masa Terhad',
      zh: '限时特惠'
    },
    // Valid until
    {
      regex: /\b(valid until|valid till|valid to)\b/gi,
      bm: 'Sah sehingga',
      zh: '优惠有效期至'
    }
  ];

  patterns.forEach(p => {
    bm = bm.replace(p.regex, p.bm);
    zh = zh.replace(p.regex, p.zh);
  });

  const wordMap = [
    { en: /\btins?\b/gi, bm: 'Tin', zh: '罐' },
    { en: /\bcans?\b/gi, bm: 'Tin', zh: '罐' },
    { en: /\bbottles?\b/gi, bm: 'Botol', zh: '瓶' },
    { en: /\bboxes?\b/gi, bm: 'Kotak', zh: '盒' },
    { en: /\bpacks?\b/gi, bm: 'Pek', zh: '包' },
    { en: /\beach\b/gi, bm: 'setiap satu', zh: '每罐' },
    { en: /\bfree\b/gi, bm: 'Percuma', zh: '免费赠送' },
    { en: /\bonly\b/gi, bm: 'sahaja', zh: '而已' },
    { en: /\band\b/gi, bm: 'dan', zh: '与' },
    { en: /\bwith\b/gi, bm: 'dengan', zh: '附赠' }
  ];

  wordMap.forEach(w => {
    bm = bm.replace(w.en, w.bm);
    zh = zh.replace(w.en, w.zh);
  });

  bm = bm.replace(/\s+/g, ' ').trim();
  zh = zh.replace(/\s+/g, ' ').trim();

  return { bm, zh };
}

// ─── STANDARD MULTILINGUAL PROMOTIONAL TEMPLATES ──────────────────────────────
const PROMO_DEFAULT_TEMPLATES = {
  bm: `Salam sejahtera {name}, dari PMG Pharmacy {branch}! 👋

Berita baik! Produk kegemaran anda *{product}* kini ada *TAWARAN ISTIMEWA / PROMOSI KHAS* terhad! 🌟

✨ *Tawaran Istimewa:* {offer_details}
📅 *Tempoh Promosi:* {promo_period}
📍 *Lokasi:* PMG Pharmacy {branch}
📞 *Hubungi:* {contact}

Stok adalah terhad (siapa cepat, dia dapat). Jika anda ingin kami simpankan stok terlebih dahulu untuk anda, atau ingin membuat pesanan untuk penghantaran, boleh terus balas WhatsApp ini ya!

Terima kasih atas sokongan anda kepada PMG Pharmacy. Semoga anda sekeluarga sihat dan ceria selalu! 😊`,

  zh: `您好 {name}，这里是 PMG Pharmacy {branch}（PMG 药剂行）！👋

好消息通知您！您之前常购买的营养品 *{product}* 现正进行 *限时特别特惠 / 促销回馈*！🌟

✨ *特别特惠详情：* {offer_details}
📅 *优惠日期：* {promo_period}
📍 *门店地点：* PMG Pharmacy {branch}
📞 *联络电话：* {contact}

存货有限，先到先得。如果您需要我们提前为您保留存货，或安排送货上门，欢迎直接回复此 WhatsApp 信息通知我们！

感谢您一直以来对 PMG Pharmacy 的支持与信任！祝您与家人身体健康，平安喜乐！😊`,

  bilingual: `Salam sejahtera & 您好 {name}! 
Dari PMG Pharmacy {branch}（PMG 药剂行）👋

🌟 *TAWARAN ISTIMEWA / 限时特别特惠* 🌟
Produk kegemaran anda / 您关注的优质产品：
*{product}*

✨ *Tawaran / 特惠详情：* {offer_details}
📅 *Tempoh / 优惠日期：* {promo_period}
📍 *Lokasi / 门店：* PMG Pharmacy {branch}
📞 *Hubungi / 联络电话：* {contact}

Stok terhad, siapa cepat dia dapat. Boleh terus balas WhatsApp ini untuk tempahan awal atau simpan stok ya!
存货有限，先到先得。如需预留存货或送货，欢迎直接回复此 WhatsApp！

Terima kasih atas sokongan anda / 祝您与家人健康平安！😊`,

  en: `Dear {name}, greetings from PMG Pharmacy {branch}! 👋

Great news! Your favorite product *{product}* is currently having a *SPECIAL LIMITED-TIME OFFER*! 🌟

✨ *Special Offer:* {offer_details}
📅 *Validity Period:* {promo_period}
📍 *Location:* PMG Pharmacy {branch}
📞 *Contact Us:* {contact}

Stocks are limited on a first-come, first-served basis. If you would like us to reserve stocks for you or arrange delivery, feel free to reply directly to this WhatsApp message!

Thank you for trusting PMG Pharmacy for your healthcare needs. Wishing you great health and happiness always! 😊`
};

// ─── STATE MANAGEMENT ─────────────────────────────────────────────────────────
const STORAGE_PROMO_CAMPAIGNS = 'pmg_promo_custom_campaigns';
const STORAGE_PROMO_ACTIVE_ID = 'pmg_promo_active_campaign_id';
const STORAGE_PROMO_PROGRESS   = 'pmg_promo_broadcast_progress';
const STORAGE_PROMO_COMPOSER   = 'pmg_promo_composer_state';
const STORAGE_PROMO_POSTER     = 'pmg_promo_poster_data';

let promoCampaigns = [];
let promoActiveCampaign = null;
let promoComposerState = {
  language: 'auto', // 'auto' (smart customer match) | 'bm' | 'zh' | 'bilingual' | 'en' | 'custom'
  offerDetails: 'Beli 2 Tin RM210 (Jimat RM20) + Percuma Shaker / 买2罐特价RM210送摇摇杯',
  offerDetailsEn: 'Buy 2 Tins at RM210 (Save RM20) + Free Shaker Cup, while stocks last',
  offerDetailsBm: 'Beli 2 Tin pada harga RM210 (Jimat RM20) + Percuma Shaker Cup, sementara stok masih ada',
  offerDetailsZh: '买2罐特惠 RM210（节省 RM20）+ 免费赠送摇摇杯，存货有限售完即止',
  promoPeriod: 'Sementara Stok Masih Ada / 存货有限，售完即止',
  branchName: 'Kota Sentosa',
  shopPhone: '+60149773924',
  pharmacistPhone: '01110990693',
  pharmacistName: 'William',
  posterUrl: '',
  posterFileName: '',
  autoCopyPoster: true,
  customText: '',
  nameFormat: 'title'
};
let promoProgressMap = {}; // { [campaignId]: { [customerId]: { sent: true, sentAt: '...', langOverride: 'bm'|'zh' } } }
let promoFilter = {
  search: '',
  status: 'all', // 'all' | 'pending' | 'sent'
  loyalty: 'all', // 'all' | 'vip' | 'regular' | 'single'
  sortBy: 'recent' // 'recent' | 'qty_desc' | 'spent_desc' | 'name_asc'
};
let promoPreviewCustomerId = null;
let promoCurrentPage = 1;
const PROMO_PAGE_SIZE = 50;

// ─── INITIALIZATION ───────────────────────────────────────────────────────────
function initPromoBroadcastModule() {
  loadPromoCampaigns();
  loadPromoComposerState();
  loadPromoProgress();
  loadPromoPoster();
  renderPromoBroadcastUI();
  // Auto check OneDrive sync in background
  checkOneDriveSyncStatusQuiet();
}
window.initPromoBroadcastModule = initPromoBroadcastModule;

function loadPromoCampaigns() {
  promoCampaigns = [NUTRI_ALPHA_PRESET_CAMPAIGN];
  try {
    const raw = localStorage.getItem(STORAGE_PROMO_CAMPAIGNS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(c => {
          if (c && c.id && c.id !== NUTRI_ALPHA_PRESET_CAMPAIGN.id) {
            promoCampaigns.push(c);
          }
        });
      }
    }
  } catch (e) {
    console.warn('[PMG Promo] Error loading custom campaigns:', e);
  }

  const activeId = localStorage.getItem(STORAGE_PROMO_ACTIVE_ID) || NUTRI_ALPHA_PRESET_CAMPAIGN.id;
  promoActiveCampaign = promoCampaigns.find(c => c.id === activeId) || promoCampaigns[0] || NUTRI_ALPHA_PRESET_CAMPAIGN;
}

function saveCustomPromoCampaigns() {
  try {
    const customOnly = promoCampaigns.filter(c => !c.isPreset);
    localStorage.setItem(STORAGE_PROMO_CAMPAIGNS, JSON.stringify(customOnly));
  } catch (e) {
    console.error('[PMG Promo] Failed to save custom campaigns:', e);
  }
}

function loadPromoComposerState() {
  try {
    const raw = localStorage.getItem(STORAGE_PROMO_COMPOSER);
    if (raw) {
      const saved = JSON.parse(raw);
      promoComposerState = { ...promoComposerState, ...saved };
    }
  } catch (e) {
    console.warn('[PMG Promo] Error loading composer state:', e);
  }

  // Ensure contact defaults if missing or empty
  if (!promoComposerState.shopPhone) promoComposerState.shopPhone = '+60149773924';
  if (!promoComposerState.pharmacistPhone) promoComposerState.pharmacistPhone = '01110990693';
  if (!promoComposerState.pharmacistName) promoComposerState.pharmacistName = 'William';
  if (!promoComposerState.branchName) promoComposerState.branchName = 'Kota Sentosa';
  if (!promoComposerState.language) promoComposerState.language = 'auto';
}

function savePromoComposerState() {
  try {
    localStorage.setItem(STORAGE_PROMO_COMPOSER, JSON.stringify(promoComposerState));
  } catch (e) {
    console.warn('[PMG Promo] Error saving composer state:', e);
  }
}

function loadPromoPoster() {
  try {
    const data = localStorage.getItem(STORAGE_PROMO_POSTER);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && parsed.dataUrl) {
        promoComposerState.posterUrl = parsed.dataUrl;
        promoComposerState.posterFileName = parsed.fileName || 'promo_poster.png';
      }
    }
  } catch (e) {
    console.warn('[PMG Promo] Error loading poster:', e);
  }
}

function savePromoPoster(dataUrl, fileName) {
  try {
    promoComposerState.posterUrl = dataUrl || '';
    promoComposerState.posterFileName = fileName || '';
    if (dataUrl) {
      localStorage.setItem(STORAGE_PROMO_POSTER, JSON.stringify({ dataUrl, fileName }));
    } else {
      localStorage.removeItem(STORAGE_PROMO_POSTER);
    }
  } catch (e) {
    console.warn('[PMG Promo] Poster image too large for localStorage, keeping in session:', e);
  }
}

function loadPromoProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_PROMO_PROGRESS);
    if (raw) {
      promoProgressMap = JSON.parse(raw) || {};
    }
  } catch (e) {
    console.warn('[PMG Promo] Error loading progress:', e);
    promoProgressMap = {};
  }
}

function savePromoProgress() {
  try {
    localStorage.setItem(STORAGE_PROMO_PROGRESS, JSON.stringify(promoProgressMap));
  } catch (e) {
    console.error('[PMG Promo] Error saving progress:', e);
  }
}

function getCustomerSentStatus(campaignId, customerId) {
  if (!promoProgressMap[campaignId]) return null;
  return promoProgressMap[campaignId][customerId] || null;
}

function setCustomerSentStatus(campaignId, customerId, isSent, notes) {
  if (!promoProgressMap[campaignId]) promoProgressMap[campaignId] = {};
  if (isSent) {
    const existing = promoProgressMap[campaignId][customerId] || {};
    promoProgressMap[campaignId][customerId] = {
      ...existing,
      sent: true,
      sentAt: new Date().toISOString()
    };
    if (notes) promoProgressMap[campaignId][customerId].notes = notes;
  } else {
    if (promoProgressMap[campaignId][customerId]) {
      delete promoProgressMap[campaignId][customerId].sent;
      delete promoProgressMap[campaignId][customerId].sentAt;
      delete promoProgressMap[campaignId][customerId].notes;
      if (!promoProgressMap[campaignId][customerId].langOverride) {
        delete promoProgressMap[campaignId][customerId];
      }
    }
  }
  savePromoProgress();
  renderPromoKpis();
}

function setCustomerLanguageOverride(campaignId, customerId, lang) {
  if (!promoProgressMap[campaignId]) promoProgressMap[campaignId] = {};
  if (!promoProgressMap[campaignId][customerId]) {
    promoProgressMap[campaignId][customerId] = {};
  }
  promoProgressMap[campaignId][customerId].langOverride = lang;
  savePromoProgress();
  renderPromoCustomerTable();
  renderPromoChatPreview();
}

// ─── FORMATTING & UTILITIES ───────────────────────────────────────────────────
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTitleCase(str) {
  if (!str) return '';
  const lowerWords = ['bin', 'binti', 'bt', 'anak', 'ak', 'dan', 'of', 'and'];
  return str.toLowerCase().split(/\s+/).map((word, idx) => {
    if (idx > 0 && lowerWords.includes(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function cleanPhoneForWhatsApp(raw) {
  if (!raw) return '';
  let cleaned = String(raw).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0060')) cleaned = cleaned.slice(2);
  if (cleaned.startsWith('01')) cleaned = '60' + cleaned.slice(1);
  else if (cleaned.startsWith('08')) cleaned = '60' + cleaned.slice(1);
  else if (cleaned.startsWith('1') && cleaned.length >= 9 && cleaned.length <= 11) cleaned = '60' + cleaned;
  return cleaned;
}

function validatePhoneNumber(raw) {
  const cleanPhone = cleanPhoneForWhatsApp(raw);
  const isMobile = cleanPhone.startsWith('601') && cleanPhone.length >= 10 && cleanPhone.length <= 13;
  const isLandline = cleanPhone.startsWith('608') || cleanPhone.startsWith('603');
  return {
    cleanPhone,
    valid: isMobile,
    isLandline,
    displayPhone: raw ? String(raw).trim() : 'No phone'
  };
}

function getFormattedContactString(lang) {
  const shop = promoComposerState.shopPhone || '+60149773924';
  const pharm = promoComposerState.pharmacistPhone || '01110990693';
  const pharmName = promoComposerState.pharmacistName || 'William';
  const branch = promoComposerState.branchName || 'Kota Sentosa';

  if (lang === 'zh') {
    return `PMG ${branch} 柜台: ${shop} | 药剂师 ${pharmName}: ${pharm}`;
  }
  if (lang === 'bilingual') {
    return `Cawangan / 柜台: ${shop} | Farmasis / 药剂师 ${pharmName}: ${pharm}`;
  }
  return `Cawangan: ${shop} | Farmasis ${pharmName}: ${pharm}`;
}

// ─── TEMPLATE & MESSAGE GENERATOR ─────────────────────────────────────────────
function getCustomerEffectiveLanguage(cust) {
  const campaignId = promoActiveCampaign ? promoActiveCampaign.id : '';
  const st = getCustomerSentStatus(campaignId, cust.id);
  if (st && st.langOverride) return st.langOverride;

  const mode = promoComposerState.language || 'auto';
  if (mode === 'auto') {
    return detectCustomerLanguagePreference(cust.name);
  }
  return mode;
}

function getActivePromoTemplateText(targetLang) {
  const lang = targetLang || promoComposerState.language || 'auto';
  if (lang === 'custom' && promoComposerState.customText && promoComposerState.customText.trim()) {
    return promoComposerState.customText;
  }
  if (lang === 'auto') {
    // In auto mode, default display template is BM or Bilingual for general view
    return PROMO_DEFAULT_TEMPLATES.bm;
  }
  return PROMO_DEFAULT_TEMPLATES[lang] || PROMO_DEFAULT_TEMPLATES.bm;
}

function generatePersonalizedMessage(customer) {
  if (!customer || !promoActiveCampaign) return '';

  const effLang = getCustomerEffectiveLanguage(customer);

  let template = '';
  if (promoComposerState.language === 'custom' && promoComposerState.customText && promoComposerState.customText.trim()) {
    template = promoComposerState.customText;
  } else {
    template = PROMO_DEFAULT_TEMPLATES[effLang] || PROMO_DEFAULT_TEMPLATES.bm;
  }

  const rawName = customer.name || 'Pelanggan Dihormati / 尊敬的顾客';
  const name = promoComposerState.nameFormat === 'upper' ? rawName.toUpperCase() : formatTitleCase(rawName);
  const product = promoActiveCampaign.productName || 'NUTRIBRIDGE NUTRI ALPHA 800GM';

  // Offer details resolution based on customer language
  let offerDetails = promoComposerState.offerDetails;
  if (promoComposerState.language === 'auto') {
    if (effLang === 'bm' && promoComposerState.offerDetailsBm) {
      offerDetails = promoComposerState.offerDetailsBm;
    } else if (effLang === 'zh' && promoComposerState.offerDetailsZh) {
      offerDetails = promoComposerState.offerDetailsZh;
    }
  }

  const promoPeriod = promoComposerState.promoPeriod || 'Sementara Stok Masih Ada / 存货有限，售完即止';
  const branch = promoComposerState.branchName || 'Kota Sentosa';
  const contact = getFormattedContactString(effLang);
  const shopPhone = promoComposerState.shopPhone || '+60149773924';
  const pharmacistPhone = promoComposerState.pharmacistPhone || '01110990693';
  const lastDate = customer.lastDate || 'Sebelum ini';

  let msg = template
    .replace(/\{name\}/g, name)
    .replace(/\{product\}/g, product)
    .replace(/\{offer_details\}/g, offerDetails)
    .replace(/\{promo_period\}/g, promoPeriod)
    .replace(/\{branch\}/g, branch)
    .replace(/\{contact\}/g, contact)
    .replace(/\{shop_phone\}/g, shopPhone)
    .replace(/\{pharmacist_phone\}/g, pharmacistPhone)
    .replace(/\{last_date\}/g, lastDate);

  return msg;
}

// ─── RENDERING UI ─────────────────────────────────────────────────────────────
function renderPromoBroadcastUI() {
  renderPromoCampaignHeader();
  renderPromoKpis();
  renderPromoComposer();
  renderPromoCustomerTable();
  updateSyncBadgeState();
}

function renderPromoCampaignHeader() {
  if (typeof document === 'undefined') return;
  const select = document.getElementById('promoCampaignSelect');
  if (select) {
    select.innerHTML = promoCampaigns.map(c => {
      const isSel = c.id === promoActiveCampaign.id ? 'selected' : '';
      const count = (c.customers || []).length;
      return `<option value="${escHtml(c.id)}" ${isSel}>${escHtml(c.name)} (${count} customers)</option>`;
    }).join('');
  }

  const titleEl = document.getElementById('promoActiveCampaignTitle');
  if (titleEl && promoActiveCampaign) {
    titleEl.textContent = promoActiveCampaign.productName || promoActiveCampaign.name;
  }

  const badgeEl = document.getElementById('promoActiveCampaignBadge');
  if (badgeEl && promoActiveCampaign) {
    const custCount = (promoActiveCampaign.customers || []).length;
    const priceStr = promoActiveCampaign.defaultPrice ? ` · RM ${promoActiveCampaign.defaultPrice} Normal Price` : '';
    badgeEl.textContent = `${custCount} Targeted Customers${priceStr}`;
  }
}

function renderPromoKpis() {
  if (typeof document === 'undefined') return;
  if (!promoActiveCampaign) return;
  const customers = promoActiveCampaign.customers || [];
  const totalCount = customers.length;
  const campaignId = promoActiveCampaign.id;

  let sentCount = 0;
  let validPhoneCount = 0;
  let totalHistoricalQty = 0;

  customers.forEach(c => {
    const st = getCustomerSentStatus(campaignId, c.id);
    if (st && st.sent) sentCount++;
    const val = validatePhoneNumber(c.phone);
    if (val.valid) validPhoneCount++;
    totalHistoricalQty += (Number(c.totalQty) || 1);
  });

  const pendingCount = Math.max(0, totalCount - sentCount);
  const pct = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('promoKpiTotalCust', totalCount);
  setEl('promoKpiSent', sentCount);
  setEl('promoKpiPending', pendingCount);
  setEl('promoKpiReach', `${validPhoneCount} / ${totalCount} Valid`);
  setEl('promoKpiHistoricalQty', `${totalHistoricalQty} Cans Total`);
  setEl('promoProgressPct', `${pct}%`);

  const bar = document.getElementById('promoProgressBar');
  if (bar) {
    bar.style.width = `${pct}%`;
  }

  updateSendNextButton(customers, campaignId);
}

function updateSendNextButton(customers, campaignId) {
  const btn = document.getElementById('promoSendNextBtn');
  if (!btn) return;

  const nextUnsent = customers.find(c => {
    const st = getCustomerSentStatus(campaignId, c.id);
    const val = validatePhoneNumber(c.phone);
    return (!st || !st.sent) && val.valid;
  });

  if (nextUnsent) {
    const effLang = getCustomerEffectiveLanguage(nextUnsent);
    const langFlag = effLang === 'zh' ? '🇨🇳 华语' : '🇲🇾 BM';
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
    btn.innerHTML = `<i class="fa-brands fa-whatsapp text-lg"></i> <span>Send Next: <strong>${formatTitleCase(nextUnsent.name).slice(0, 18)}</strong> (${nextUnsent.phone}) <span class="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full ml-1 font-normal">${langFlag}</span></span>`;
    btn.onclick = () => sendCustomerPromoWhatsApp(nextUnsent.id);
  } else {
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> <span>All ${customers.length} Customers Contacted! 🎉</span>`;
    btn.onclick = null;
  }
}

// ─── COMPOSER & POSTER ────────────────────────────────────────────────────────
function renderPromoComposer() {
  const lang = promoComposerState.language || 'auto';

  document.querySelectorAll('.promo-lang-btn').forEach(b => {
    const bLang = b.getAttribute('data-lang');
    if (bLang === lang) {
      b.classList.remove('bg-gray-100', 'text-gray-700', 'border-gray-300');
      b.classList.add('bg-emerald-600', 'text-white', 'border-emerald-700', 'shadow-sm');
    } else {
      b.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-700', 'shadow-sm');
      b.classList.add('bg-gray-100', 'text-gray-700', 'border-gray-300');
    }
  });

  // Inputs
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && el.value !== (val || '')) el.value = val || '';
  };

  setVal('promoComposerOffer', promoComposerState.offerDetailsEn || promoComposerState.offerDetails);
  setVal('promoComposerOfferBm', promoComposerState.offerDetailsBm || promoComposerState.offerDetails);
  setVal('promoComposerOfferZh', promoComposerState.offerDetailsZh || promoComposerState.offerDetails);
  setVal('promoComposerPeriod', promoComposerState.promoPeriod);
  setVal('promoComposerBranch', promoComposerState.branchName);
  setVal('promoComposerShopPhone', promoComposerState.shopPhone);
  setVal('promoComposerPharmacistPhone', promoComposerState.pharmacistPhone);

  const autoCopyBox = document.getElementById('promoAutoCopyPosterCheckbox');
  if (autoCopyBox) {
    autoCopyBox.checked = Boolean(promoComposerState.autoCopyPoster);
  }

  // Textarea
  const textarea = document.getElementById('promoComposerTextarea');
  if (textarea) {
    textarea.value = getActivePromoTemplateText();
  }

  renderPosterPreviewUI();
  renderPromoChatPreview();
}

function handlePromoLangSwitch(langKey) {
  promoComposerState.language = langKey;
  if (langKey !== 'custom') {
    promoComposerState.customText = PROMO_DEFAULT_TEMPLATES[langKey] || '';
  }
  savePromoComposerState();
  renderPromoComposer();
  renderPromoCustomerTable();
}
window.handlePromoLangSwitch = handlePromoLangSwitch;

// Debounced input handler to eliminate typing lag
let promoComposerDebounceTimer = null;
function handleComposerInputChange() {
  const offer = document.getElementById('promoComposerOffer')?.value || '';
  const offerBm = document.getElementById('promoComposerOfferBm')?.value || '';
  const offerZh = document.getElementById('promoComposerOfferZh')?.value || '';
  const period = document.getElementById('promoComposerPeriod')?.value || '';
  const branch = document.getElementById('promoComposerBranch')?.value || '';
  const shop = document.getElementById('promoComposerShopPhone')?.value || '';
  const pharm = document.getElementById('promoComposerPharmacistPhone')?.value || '';
  const textarea = document.getElementById('promoComposerTextarea')?.value || '';

  promoComposerState.offerDetails = offer;
  promoComposerState.offerDetailsEn = offer;
  promoComposerState.offerDetailsBm = offerBm || offer;
  promoComposerState.offerDetailsZh = offerZh || offer;
  promoComposerState.promoPeriod = period;
  promoComposerState.branchName = branch;
  promoComposerState.shopPhone = shop;
  promoComposerState.pharmacistPhone = pharm;
  if (promoComposerState.language === 'custom') {
    promoComposerState.customText = textarea;
  }

  // Update preview immediately, debounce saving to disk
  renderPromoChatPreview();

  clearTimeout(promoComposerDebounceTimer);
  promoComposerDebounceTimer = setTimeout(() => {
    savePromoComposerState();
  }, 300);
}
window.handleComposerInputChange = handleComposerInputChange;

// Auto-Translate Offer Text
function autoTranslatePromoOffer() {
  const englishText = document.getElementById('promoComposerOffer')?.value || '';
  if (!englishText.trim()) {
    showPromoToast('Please type an offer first, e.g. "Buy 2 Tins at RM210 Free 1 Shaker"');
    return;
  }

  const trans = translateEnglishPromo(englishText);
  promoComposerState.offerDetailsEn = englishText;
  promoComposerState.offerDetailsBm = trans.bm;
  promoComposerState.offerDetailsZh = trans.zh;
  promoComposerState.offerDetails = trans.bm; // Default dual

  const bmInput = document.getElementById('promoComposerOfferBm');
  if (bmInput) bmInput.value = trans.bm;
  const zhInput = document.getElementById('promoComposerOfferZh');
  if (zhInput) zhInput.value = trans.zh;

  savePromoComposerState();
  renderPromoChatPreview();
  showPromoToast('⚡ Auto-translated successfully to Bahasa Malaysia & 华语!');
}
window.autoTranslatePromoOffer = autoTranslatePromoOffer;

function insertPromoPlaceholder(tag) {
  const textarea = document.getElementById('promoComposerTextarea');
  if (!textarea) return;

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const text = textarea.value;
  textarea.value = text.slice(0, start) + tag + text.slice(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + tag.length;

  promoComposerState.customText = textarea.value;
  promoComposerState.language = 'custom';
  savePromoComposerState();
  renderPromoChatPreview();
}
window.insertPromoPlaceholder = insertPromoPlaceholder;

// ─── POSTER IMAGE UPLOADER & CLIPBOARD ─────────────────────────────────────────
function handlePosterFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please upload a valid image file (JPG, PNG, WebP).');
    return;
  }

  // Check file size (< 4MB)
  if (file.size > 4 * 1024 * 1024) {
    alert('Image file is large. Converting and optimizing to ensure fast performance...');
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    savePromoPoster(dataUrl, file.name);
    renderPosterPreviewUI();
    renderPromoChatPreview();
    showPromoToast('🖼️ Promotional poster attached successfully!');
  };
  reader.readAsDataURL(file);
}
window.handlePosterFileSelected = handlePosterFileSelected;

function removePromoPoster() {
  savePromoPoster('', '');
  const fileInput = document.getElementById('promoPosterFileInput');
  if (fileInput) fileInput.value = '';
  renderPosterPreviewUI();
  renderPromoChatPreview();
  showPromoToast('Poster removed.');
}
window.removePromoPoster = removePromoPoster;

function toggleAutoCopyPoster(checkbox) {
  promoComposerState.autoCopyPoster = Boolean(checkbox.checked);
  savePromoComposerState();
}
window.toggleAutoCopyPoster = toggleAutoCopyPoster;

function renderPosterPreviewUI() {
  const card = document.getElementById('promoPosterCard');
  const previewImg = document.getElementById('promoPosterThumb');
  const nameEl = document.getElementById('promoPosterName');
  const emptyState = document.getElementById('promoPosterEmptyState');
  const activeState = document.getElementById('promoPosterActiveState');

  if (!card) return;

  if (promoComposerState.posterUrl) {
    if (previewImg) previewImg.src = promoComposerState.posterUrl;
    if (nameEl) nameEl.textContent = promoComposerState.posterFileName || 'promo_poster.png';
    if (emptyState) emptyState.classList.add('hidden');
    if (activeState) activeState.classList.remove('hidden');
  } else {
    if (emptyState) emptyState.classList.remove('hidden');
    if (activeState) activeState.classList.add('hidden');
  }
}

async function copyPosterToClipboard() {
  if (!promoComposerState.posterUrl) {
    showPromoToast('No poster uploaded yet.');
    return false;
  }

  try {
    const res = await fetch(promoComposerState.posterUrl);
    let blob = await res.blob();

    // Standardize to PNG
    if (blob.type !== 'image/png') {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = promoComposerState.posterUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    }

    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showPromoToast('📋 Poster copied to clipboard! In WhatsApp, just press Ctrl+V to attach.');
      return true;
    } else {
      throw new Error('Clipboard API not supported in this browser context.');
    }
  } catch (err) {
    console.warn('[Promo Poster] Failed to copy poster to clipboard:', err);
    showPromoToast('⚠️ Could not auto-copy image. You can drag the poster image directly into WhatsApp chat.');
    return false;
  }
}
window.copyPosterToClipboard = copyPosterToClipboard;

// ─── CHAT PREVIEW ─────────────────────────────────────────────────────────────
function renderPromoChatPreview() {
  const container = document.getElementById('promoChatPreviewContent');
  const badge = document.getElementById('promoPreviewCustomerBadge');
  const posterPreview = document.getElementById('promoChatPreviewPoster');
  if (!container) return;

  const customers = promoActiveCampaign ? (promoActiveCampaign.customers || []) : [];
  let sample = customers[0];

  if (promoPreviewCustomerId) {
    sample = customers.find(c => c.id === promoPreviewCustomerId) || sample;
  }

  if (!sample) {
    container.innerHTML = '<p class="text-gray-400 italic">No customers loaded for preview.</p>';
    return;
  }

  const effLang = getCustomerEffectiveLanguage(sample);
  const langLabel = effLang === 'zh' ? '🇨🇳 华语 (Mandarin)' : '🇲🇾 Bahasa Malaysia';

  if (badge) {
    badge.innerHTML = `Previewing for: <strong>${formatTitleCase(sample.name)}</strong> (${sample.phone || 'No phone'}) · <span class="font-bold text-emerald-800">${langLabel}</span>`;
  }

  // Poster preview in mockup
  if (posterPreview) {
    if (promoComposerState.posterUrl) {
      posterPreview.classList.remove('hidden');
      posterPreview.querySelector('img').src = promoComposerState.posterUrl;
    } else {
      posterPreview.classList.add('hidden');
    }
  }

  const msg = generatePersonalizedMessage(sample);

  // Convert WhatsApp markdown (*bold*, _italic_, newlines) to HTML
  let formatted = escHtml(msg)
    .replace(/\n/g, '<br>')
    .replace(/\*([^*]+)\*/g, '<strong class="font-extrabold text-gray-900">$1</strong>')
    .replace(/_([^_]+)_/g, '<em class="italic">$1</em>');

  container.innerHTML = formatted;
}

// ─── FILTER & TABLE (OPTIMIZED & DEBOUNCED) ───────────────────────────────────
function filterPromoCustomers() {
  if (!promoActiveCampaign || !Array.isArray(promoActiveCampaign.customers)) return [];

  const rawList = promoActiveCampaign.customers;
  const campaignId = promoActiveCampaign.id;
  const q = (promoFilter.search || '').trim().toLowerCase();
  const status = promoFilter.status;
  const loyalty = promoFilter.loyalty;

  return rawList.filter(c => {
    // 1. Search query
    if (q) {
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').includes(q);
      const matchSp = (c.salespersons || []).some(sp => sp.toLowerCase().includes(q));
      if (!matchName && !matchPhone && !matchSp) return false;
    }

    // 2. Status filter
    const st = getCustomerSentStatus(campaignId, c.id);
    const isSent = Boolean(st && st.sent);
    if (status === 'sent' && !isSent) return false;
    if (status === 'pending' && isSent) return false;

    // 3. Loyalty filter
    const qty = Number(c.totalQty) || 1;
    if (loyalty === 'vip' && qty < 3) return false;
    if (loyalty === 'regular' && qty !== 2) return false;
    if (loyalty === 'single' && qty !== 1) return false;

    return true;
  }).sort((a, b) => {
    if (promoFilter.sortBy === 'qty_desc') return (Number(b.totalQty) || 1) - (Number(a.totalQty) || 1);
    if (promoFilter.sortBy === 'spent_desc') return (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0);
    if (promoFilter.sortBy === 'name_asc') return String(a.name || '').localeCompare(String(b.name || ''));
    return String(b.lastDate || '').localeCompare(String(a.lastDate || ''));
  });
}

function renderPromoCustomerTable() {
  const tbody = document.getElementById('promoCustomerTbody');
  const countEl = document.getElementById('promoFilteredCount');
  if (!tbody) return;

  const items = filterPromoCustomers();
  if (countEl) countEl.textContent = `${items.length} Customers`;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-12 text-gray-400">
          <i class="fa-solid fa-users-slash text-4xl mb-3 text-gray-300 block"></i>
          No customers found matching your filters.
          <p class="text-xs text-gray-400 mt-1">Try resetting the search or filter tabs above.</p>
        </td>
      </tr>`;
    return;
  }

  const campaignId = promoActiveCampaign.id;
  const totalDisplay = promoCurrentPage * PROMO_PAGE_SIZE;
  const displayed = items.slice(0, totalDisplay);

  const loadMoreBtn = document.getElementById('promoLoadMoreBtn');
  if (loadMoreBtn) {
    if (items.length > totalDisplay) {
      loadMoreBtn.classList.remove('hidden');
      loadMoreBtn.textContent = `Load More (${items.length - totalDisplay} remaining)`;
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }

  const rowsHtml = displayed.map((c, idx) => {
    const st = getCustomerSentStatus(campaignId, c.id);
    const isSent = Boolean(st && st.sent);
    const val = validatePhoneNumber(c.phone);
    const totalQty = Number(c.totalQty) || 1;
    const isVip = totalQty >= 3;
    const isRepeat = totalQty >= 2;
    const formattedName = formatTitleCase(c.name);
    const safeId = escHtml(c.id);

    // Language badge with 1-click toggle
    const effLang = getCustomerEffectiveLanguage(c);
    const langBadge = effLang === 'zh'
      ? `<button type="button" onclick="toggleCustomerLangPref('${safeId}')" title="Click to switch between BM and 华语" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition inline-flex items-center gap-1 cursor-pointer"><span>🇨🇳 华语</span> <i class="fa-solid fa-arrow-right-arrow-left text-[8px] opacity-60"></i></button>`
      : `<button type="button" onclick="toggleCustomerLangPref('${safeId}')" title="Click to switch between BM and 华语" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition inline-flex items-center gap-1 cursor-pointer"><span>🇲🇾 BM</span> <i class="fa-solid fa-arrow-right-arrow-left text-[8px] opacity-60"></i></button>`;

    let statusBadge = '';
    if (isSent) {
      const timeStr = st.sentAt ? new Date(st.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Done';
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <i class="fa-solid fa-circle-check text-emerald-600"></i> Sent (${timeStr})
        </span>`;
    } else {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <i class="fa-regular fa-clock text-amber-500"></i> Pending
        </span>`;
    }

    let phoneHtml = '';
    if (val.valid) {
      phoneHtml = `
        <div class="flex items-center gap-1.5">
          <span class="font-mono text-xs font-semibold text-gray-800">${val.cleanPhone}</span>
        </div>`;
    } else if (val.isLandline) {
      phoneHtml = `
        <div class="flex items-center gap-1">
          <span class="font-mono text-xs text-amber-800">${val.displayPhone}</span>
          <span class="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold" title="Sarawak Landline (Cannot receive WhatsApp)">Landline</span>
        </div>`;
    } else {
      phoneHtml = `
        <span class="font-mono text-xs text-rose-600 italic">${val.displayPhone || 'No phone'} (Invalid)</span>`;
    }

    return `
      <tr class="border-b border-gray-100 hover:bg-emerald-50/30 transition ${isSent ? 'bg-slate-50/50' : ''}">
        <td class="p-3 text-center text-xs text-gray-400 font-mono">${idx + 1}</td>

        <td class="p-3">
          <div class="flex items-center gap-2">
            <span class="font-bold text-xs text-gray-900">${escHtml(formattedName)}</span>
            ${isVip ? '<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">⭐ VIP</span>' : (isRepeat ? '<span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Repeat</span>' : '')}
            ${langBadge}
          </div>
          <div class="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
            <span>Last bought: ${c.lastDate ? escHtml(c.lastDate.slice(0, 10)) : 'N/A'}</span>
            <span>·</span>
            <span>Spent: RM ${(Number(c.totalSpent) || 0).toFixed(0)}</span>
          </div>
        </td>

        <td class="p-3">
          ${phoneHtml}
        </td>

        <td class="p-3 text-center">
          <span class="font-extrabold text-xs text-gray-800">${totalQty}</span>
          <span class="text-[10px] text-gray-400 block">cans</span>
        </td>

        <td class="p-3 text-center">
          ${statusBadge}
        </td>

        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button type="button" onclick="sendCustomerPromoWhatsApp('${safeId}')"
              class="px-3 py-1.5 rounded-lg ${isSent ? 'bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border border-gray-300' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'} font-bold text-xs flex items-center gap-1 transition cursor-pointer"
              title="Open WhatsApp chat with prefilled personalized message">
              <i class="fa-brands fa-whatsapp text-sm"></i>
              <span>${isSent ? 'Resend' : 'Send'}</span>
            </button>

            <button type="button" onclick="previewPromoCustomerMessageModal('${safeId}')"
              class="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-xs transition cursor-pointer"
              title="Preview message text for this customer">
              <i class="fa-regular fa-eye"></i>
            </button>

            <button type="button" onclick="toggleCustomerPromoSentManual('${safeId}')"
              class="w-7 h-7 rounded-lg ${isSent ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-600' : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'} flex items-center justify-center text-xs transition cursor-pointer"
              title="${isSent ? 'Mark as Pending' : 'Mark as Sent'}">
              <i class="fa-solid ${isSent ? 'fa-check' : 'fa-circle-check'}"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  tbody.innerHTML = rowsHtml;
}

function toggleCustomerLangPref(customerId) {
  if (!promoActiveCampaign) return;
  const campaignId = promoActiveCampaign.id;
  const cust = (promoActiveCampaign.customers || []).find(c => c.id === customerId);
  if (!cust) return;

  const current = getCustomerEffectiveLanguage(cust);
  const nextLang = current === 'zh' ? 'bm' : 'zh';
  setCustomerLanguageOverride(campaignId, customerId, nextLang);
  showPromoToast(`Language for ${formatTitleCase(cust.name)} set to ${nextLang === 'zh' ? '华语' : 'Bahasa Malaysia'}`);
}
window.toggleCustomerLangPref = toggleCustomerLangPref;

// ─── SENDING WHATSAPP ─────────────────────────────────────────────────────────
async function sendCustomerPromoWhatsApp(customerId) {
  if (!promoActiveCampaign) return;
  const cust = (promoActiveCampaign.customers || []).find(c => c.id === customerId);
  if (!cust) return;

  const val = validatePhoneNumber(cust.phone);
  if (!val.valid) {
    if (val.isLandline) {
      alert(`Customer "${cust.name}" has a Sarawak landline number (${cust.phone}). WhatsApp cannot be sent to landlines.`);
    } else {
      alert(`Customer "${cust.name}" has an invalid phone number: "${cust.phone}". Please verify their number in POS.`);
    }
    return;
  }

  // 1. Auto-copy poster to clipboard if enabled
  if (promoComposerState.autoCopyPoster && promoComposerState.posterUrl) {
    await copyPosterToClipboard();
  }

  // 2. Generate personalized message
  const msg = generatePersonalizedMessage(cust);

  // 3. Mark as sent immediately
  setCustomerSentStatus(promoActiveCampaign.id, cust.id, true);

  // 4. Update preview customer
  promoPreviewCustomerId = cust.id;
  renderPromoChatPreview();
  renderPromoCustomerTable();

  // 5. Open WhatsApp Web / App
  const waUrl = `https://wa.me/${val.cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}
window.sendCustomerPromoWhatsApp = sendCustomerPromoWhatsApp;

function copyCustomerPromoMessage(customerId) {
  if (!promoActiveCampaign) return;
  const cust = (promoActiveCampaign.customers || []).find(c => c.id === customerId);
  if (!cust) return;

  const msg = generatePersonalizedMessage(cust);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(msg).then(() => {
      showPromoToast(`Message for ${formatTitleCase(cust.name)} copied to clipboard!`);
    });
  }
}
window.copyCustomerPromoMessage = copyCustomerPromoMessage;

function toggleCustomerPromoSentManual(customerId) {
  if (!promoActiveCampaign) return;
  const campaignId = promoActiveCampaign.id;
  const st = getCustomerSentStatus(campaignId, customerId);
  const willBeSent = !Boolean(st && st.sent);
  setCustomerSentStatus(campaignId, customerId, willBeSent);
  renderPromoCustomerTable();
}
window.toggleCustomerPromoSentManual = toggleCustomerPromoSentManual;

function previewPromoCustomerMessageModal(customerId) {
  if (!promoActiveCampaign) return;
  const cust = (promoActiveCampaign.customers || []).find(c => c.id === customerId);
  if (!cust) return;

  promoPreviewCustomerId = cust.id;
  renderPromoChatPreview();

  const modal = document.getElementById('promoPreviewModal');
  const modalCustName = document.getElementById('promoModalCustomerName');
  const modalText = document.getElementById('promoModalMessageBody');
  const modalSendBtn = document.getElementById('promoModalSendBtn');

  if (modal && modalCustName && modalText) {
    const effLang = getCustomerEffectiveLanguage(cust);
    const langFlag = effLang === 'zh' ? '🇨🇳 华语' : '🇲🇾 BM';
    modalCustName.textContent = `${formatTitleCase(cust.name)} (${cust.phone || 'No Phone'}) [${langFlag}]`;
    modalText.value = generatePersonalizedMessage(cust);
    if (modalSendBtn) {
      modalSendBtn.onclick = () => {
        sendCustomerPromoWhatsApp(cust.id);
        closePromoPreviewModal();
      };
    }
    modal.classList.remove('hidden');
  }
}
window.previewPromoCustomerMessageModal = previewPromoCustomerMessageModal;

function closePromoPreviewModal() {
  const modal = document.getElementById('promoPreviewModal');
  if (modal) modal.classList.add('hidden');
}
window.closePromoPreviewModal = closePromoPreviewModal;

function resetCampaignSentStatus() {
  if (!promoActiveCampaign) return;
  const count = Object.keys(promoProgressMap[promoActiveCampaign.id] || {}).length;
  if (count === 0) {
    showPromoToast('No sent records to reset in this campaign.');
    return;
  }
  if (!confirm(`Are you sure you want to reset all ${count} sent records for "${promoActiveCampaign.name}" back to Pending?`)) {
    return;
  }
  delete promoProgressMap[promoActiveCampaign.id];
  savePromoProgress();
  renderPromoKpis();
  renderPromoCustomerTable();
  showPromoToast('Campaign progress reset to 0% Pending.');
}
window.resetCampaignSentStatus = resetCampaignSentStatus;

// ─── FILTER HANDLERS ──────────────────────────────────────────────────────────
function setPromoStatusFilter(status) {
  promoFilter.status = status;
  promoCurrentPage = 1;
  document.querySelectorAll('.promo-status-tab').forEach(t => {
    const tStat = t.getAttribute('data-status');
    if (tStat === status) {
      t.classList.add('text-emerald-700', 'border-emerald-600', 'font-bold');
      t.classList.remove('text-gray-500', 'border-transparent', 'font-medium');
    } else {
      t.classList.remove('text-emerald-700', 'border-emerald-600', 'font-bold');
      t.classList.add('text-gray-500', 'border-transparent', 'font-medium');
    }
  });
  renderPromoCustomerTable();
}
window.setPromoStatusFilter = setPromoStatusFilter;

let promoSearchDebounceTimer = null;
function handlePromoSearch(val) {
  clearTimeout(promoSearchDebounceTimer);
  promoSearchDebounceTimer = setTimeout(() => {
    promoFilter.search = val;
    promoCurrentPage = 1;
    renderPromoCustomerTable();
  }, 150);
}
window.handlePromoSearch = handlePromoSearch;

function setPromoLoyaltyFilter(val) {
  promoFilter.loyalty = val;
  promoCurrentPage = 1;
  renderPromoCustomerTable();
}
window.setPromoLoyaltyFilter = setPromoLoyaltyFilter;

function setPromoSortBy(val) {
  promoFilter.sortBy = val;
  promoCurrentPage = 1;
  renderPromoCustomerTable();
}
window.setPromoSortBy = setPromoSortBy;

function loadMorePromoCustomers() {
  promoCurrentPage++;
  renderPromoCustomerTable();
}
window.loadMorePromoCustomers = loadMorePromoCustomers;

function switchPromoCampaign(campaignId) {
  const found = promoCampaigns.find(c => c.id === campaignId);
  if (!found) return;

  promoActiveCampaign = found;
  localStorage.setItem(STORAGE_PROMO_ACTIVE_ID, campaignId);
  promoCurrentPage = 1;
  promoPreviewCustomerId = null;

  renderPromoCampaignHeader();
  renderPromoKpis();
  renderPromoChatPreview();
  renderPromoCustomerTable();
}
window.switchPromoCampaign = switchPromoCampaign;

// ─── TOAST NOTIFICATIONS ──────────────────────────────────────────────────────
function showPromoToast(msg) {
  let toast = document.getElementById('promoToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'promoToast';
    toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl transition-all duration-300 opacity-0 translate-y-3 pointer-events-none flex items-center gap-2 border border-slate-700';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-info text-emerald-400"></i> <span>${escHtml(msg)}</span>`;
  toast.classList.remove('opacity-0', 'translate-y-3', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-3', 'pointer-events-none');
  }, 3500);
}

// ─── CSV UPLOAD & IMPORT ──────────────────────────────────────────────────────
function openUploadCustomerCsvModal() {
  const modal = document.getElementById('promoCsvUploadModal');
  if (modal) modal.classList.remove('hidden');
}
window.openUploadCustomerCsvModal = openUploadCustomerCsvModal;

function closeUploadCustomerCsvModal() {
  const modal = document.getElementById('promoCsvUploadModal');
  if (modal) modal.classList.add('hidden');
}
window.closeUploadCustomerCsvModal = closeUploadCustomerCsvModal;

function parseCsvFileToCustomers(csvText) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) throw new Error('CSV file is empty or does not contain data.');

  function parseLine(text) {
    const res = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === ',' && !inQuotes) {
        res.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    res.push(cur.trim());
    return res;
  }

  const rawHeaders = parseLine(lines[0]).map(h => h.toLowerCase().trim());

  const findCol = (...keywords) => {
    for (const kw of keywords) {
      const idx = rawHeaders.findIndex(h => h === kw || h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const nameIdx = findCol('client name', 'customer name', 'nama pelanggan', 'pelanggan', 'name', 'nama');
  const phoneIdx = findCol('client mobile', 'mobile', 'no tel', 'phone', 'tel', 'hp', 'contact');
  const dateIdx = findCol('sales date', 'tarikh jualan', 'date', 'tarikh');
  const itemIdx = findCol('item name', 'product name', 'nama item', 'nama produk', 'item description', 'description', 'product', 'produk');
  const codeIdx = findCol('item code', 'product code', 'kod item', 'kod produk', 'sku', 'code', 'kod');
  const priceIdx = findCol('unit price', 'price', 'harga seunit', 'harga', 'amount');
  const qtyIdx = findCol('sales quantity', 'quantity', 'kuantiti jualan', 'kuantiti', 'qty');
  const spIdx = findCol('sales item person', 'salesperson', 'staff', 'pic');

  if (nameIdx === -1 && phoneIdx === -1) {
    throw new Error('Could not detect "Client Name" or "Client Mobile" columns in this CSV.');
  }

  const customerMap = new Map();
  const productCountMap = {};

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row.length < 2) continue;

    const rawName = nameIdx !== -1 ? row[nameIdx] : 'Customer ' + i;
    const rawPhone = phoneIdx !== -1 ? cleanPhoneForWhatsApp(row[phoneIdx]) : '';
    const rawDate = dateIdx !== -1 ? row[dateIdx] : '';
    const rawItem = itemIdx !== -1 ? row[itemIdx] : 'Special Offer Product';
    const rawCode = codeIdx !== -1 ? row[codeIdx] : '';
    const rawPrice = priceIdx !== -1 ? (parseFloat(row[priceIdx]) || 0) : 0;
    const rawQty = qtyIdx !== -1 ? (parseFloat(row[qtyIdx]) || 1) : 1;
    const rawSp = spIdx !== -1 ? row[spIdx] : '';

    if (!rawName && !rawPhone) continue;

    if (rawItem) {
      productCountMap[rawItem] = (productCountMap[rawItem] || 0) + 1;
    }

    const key = rawPhone || rawName.toUpperCase();

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        id: 'CUST_' + (customerMap.size + 1),
        name: rawName || 'Valued Customer',
        phone: rawPhone,
        totalQty: rawQty,
        totalSpent: rawPrice * rawQty,
        lastDate: rawDate,
        firstDate: rawDate,
        salespersons: rawSp ? [rawSp] : [],
        history: [{
          date: rawDate,
          qty: rawQty,
          price: rawPrice,
          sp: rawSp
        }]
      });
    } else {
      const existing = customerMap.get(key);
      existing.totalQty += rawQty;
      existing.totalSpent += rawPrice * rawQty;
      if (rawDate) existing.lastDate = rawDate;
      if (rawSp && !existing.salespersons.includes(rawSp)) existing.salespersons.push(rawSp);
      existing.history.push({
        date: rawDate,
        qty: rawQty,
        price: rawPrice,
        sp: rawSp
      });
    }
  }

  let dominantProduct = 'Promotional Product';
  let maxCount = 0;
  for (const [prod, count] of Object.entries(productCountMap)) {
    if (count > maxCount) {
      maxCount = count;
      dominantProduct = prod;
    }
  }

  const customers = Array.from(customerMap.values());
  return {
    productName: dominantProduct,
    productCode: codeIdx !== -1 ? 'POS_EXTRACT' : '',
    customers
  };
}

function handlePromoCsvFileInput(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csvText = e.target.result;
      const parsed = parseCsvFileToCustomers(csvText);

      if (parsed.customers.length === 0) {
        alert('No valid customer records could be found in this CSV.');
        return;
      }

      const campaignName = prompt('Enter a name for this Promotional Campaign:', parsed.productName || 'New Campaign');
      if (!campaignName) return;

      const newCampaign = {
        id: 'camp_' + Date.now(),
        name: campaignName.trim(),
        productName: parsed.productName,
        productCode: parsed.productCode,
        isPreset: false,
        createdAt: new Date().toISOString(),
        customers: parsed.customers
      };

      promoCampaigns.push(newCampaign);
      saveCustomPromoCampaigns();
      closeUploadCustomerCsvModal();
      switchPromoCampaign(newCampaign.id);

      showPromoToast(`Successfully imported ${parsed.customers.length} unique customers for ${newCampaign.name}!`);
    } catch (err) {
      alert('Failed to parse CSV: ' + err.message);
    }
  };
  reader.readAsText(file);
}
window.handlePromoCsvFileInput = handlePromoCsvFileInput;

function exportPromoCustomerListCsv() {
  if (!promoActiveCampaign) return;
  const customers = filterPromoCustomers();
  const campaignId = promoActiveCampaign.id;

  const headers = ['No', 'Customer Name', 'Phone Number', 'Phone Status', 'Total Cans', 'Total Spent (RM)', 'Last Purchase Date', 'Broadcast Status', 'Sent Timestamp'];
  const rows = customers.map((c, idx) => {
    const st = getCustomerSentStatus(campaignId, c.id);
    const isSent = Boolean(st && st.sent);
    const val = validatePhoneNumber(c.phone);
    return [
      idx + 1,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${val.cleanPhone || c.phone || ''}"`,
      val.valid ? 'YES' : (val.isLandline ? 'LANDLINE' : 'INVALID'),
      c.totalQty || 1,
      (Number(c.totalSpent) || 0).toFixed(2),
      c.lastDate || '',
      isSent ? 'SENT' : 'PENDING',
      st && st.sentAt ? st.sentAt : ''
    ].join(',');
  });

  const csvString = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PMG_Promo_${(promoActiveCampaign.productName || 'Offer').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
window.exportPromoCustomerListCsv = exportPromoCustomerListCsv;

// ─── CROSS-COMPUTER SYNC (ONEDRIVE + JSON BACKUP/RESTORE) ─────────────────────
function updateSyncBadgeState(status = 'IDLE') {
  const syncBtn = document.getElementById('promoCloudSyncBtn');
  const syncLabel = document.getElementById('promoCloudSyncLabel');
  if (!syncBtn || !syncLabel) return;

  const isConnected = Boolean(window.pmgOneDriveSync && window.pmgOneDriveSync.rootHandle && window.pmgOneDriveSync.mode !== 'DISCONNECTED');
  if (!isConnected) {
    syncLabel.textContent = 'OneDrive (Not Connected)';
    syncBtn.className = 'px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer';
    return;
  }

  if (status === 'SYNCING') {
    syncLabel.textContent = 'Syncing...';
    syncBtn.className = 'px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer animate-pulse';
  } else if (status === 'SUCCESS') {
    syncLabel.textContent = 'Synced ✅';
    syncBtn.className = 'px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer';
  } else {
    syncLabel.textContent = 'OneDrive Synced';
    syncBtn.className = 'px-3 py-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer';
  }
}

async function checkOneDriveSyncStatusQuiet() {
  if (typeof window === 'undefined') return;
  if (window.pmgOneDriveSync && window.pmgOneDriveSync.rootHandle && window.pmgOneDriveSync.mode !== 'DISCONNECTED') {
    updateSyncBadgeState('IDLE');
  } else {
    updateSyncBadgeState('DISCONNECTED');
  }
}

async function syncPromoBroadcastWithOneDrive() {
  if (!window.pmgOneDriveSync || !window.pmgOneDriveSync.rootHandle || window.pmgOneDriveSync.mode === 'DISCONNECTED') {
    if (typeof openOneDriveSyncModal === 'function') {
      openOneDriveSyncModal();
    } else {
      alert('OneDrive is not connected yet. Please connect your PMG OneDrive folder using the top sync button.');
    }
    return;
  }

  updateSyncBadgeState('SYNCING');
  try {
    const branchFolder = window.pmgOneDriveSync.activeBranchFolder || 'KOTA SENTOSA';
    const dirHandle = await window.pmgOneDriveSync._getTargetBranchDirectoryHandle(branchFolder);
    if (!dirHandle) throw new Error('Could not access branch folder: ' + branchFolder);

    const nowIso = new Date().toISOString();
    let cloudData = null;

    try {
      const fh = await dirHandle.getFileHandle('promo_broadcast_master.json', { create: false });
      const f = await fh.getFile();
      const txt = await f.text();
      if (txt && txt.trim()) cloudData = JSON.parse(txt);
    } catch (_) {
      // File does not exist yet
    }

    if (cloudData && cloudData.progressMap) {
      // Merge cloud progress map into local progress map
      for (const campId in cloudData.progressMap) {
        if (!promoProgressMap[campId]) promoProgressMap[campId] = {};
        for (const custId in cloudData.progressMap[campId]) {
          const cloudItem = cloudData.progressMap[campId][custId];
          const localItem = promoProgressMap[campId][custId];
          if (!localItem || (cloudItem.sentAt && (!localItem.sentAt || cloudItem.sentAt > localItem.sentAt))) {
            promoProgressMap[campId][custId] = cloudItem;
          }
        }
      }
    }

    // Prepare unified payload to write back to OneDrive
    const payload = {
      version: '2.0',
      lastUpdated: nowIso,
      updatedBy: promoComposerState.pharmacistName || 'Pharmacist',
      branch: branchFolder,
      progressMap: promoProgressMap,
      composerState: {
        offerDetails: promoComposerState.offerDetails,
        offerDetailsEn: promoComposerState.offerDetailsEn,
        offerDetailsBm: promoComposerState.offerDetailsBm,
        offerDetailsZh: promoComposerState.offerDetailsZh,
        promoPeriod: promoComposerState.promoPeriod,
        shopPhone: promoComposerState.shopPhone,
        pharmacistPhone: promoComposerState.pharmacistPhone
      },
      customCampaigns: promoCampaigns.filter(c => !c.isPreset)
    };

    const outFh = await dirHandle.getFileHandle('promo_broadcast_master.json', { create: true });
    const writable = await outFh.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();

    savePromoProgress();
    renderPromoKpis();
    renderPromoCustomerTable();
    updateSyncBadgeState('SUCCESS');
    showPromoToast('✅ Cloud Sync Complete: Campaign progress updated with OneDrive!');
    setTimeout(() => updateSyncBadgeState('IDLE'), 3000);
  } catch (err) {
    console.error('[PMG Promo Sync]', err);
    updateSyncBadgeState('ERROR');
    alert('Sync error: ' + err.message);
  }
}
window.syncPromoBroadcastWithOneDrive = syncPromoBroadcastWithOneDrive;

function exportPromoBroadcastJson() {
  const exportPayload = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    campaigns: promoCampaigns,
    progressMap: promoProgressMap,
    composerState: promoComposerState
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PMG_Promo_Broadcast_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showPromoToast('Campaign progress JSON exported successfully!');
}
window.exportPromoBroadcastJson = exportPromoBroadcastJson;

function triggerImportPromoJson() {
  const input = document.getElementById('promoJsonFileInput');
  if (input) input.click();
}
window.triggerImportPromoJson = triggerImportPromoJson;

function handleImportPromoJson(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.progressMap) {
        promoProgressMap = { ...promoProgressMap, ...data.progressMap };
        savePromoProgress();
      }
      if (data && Array.isArray(data.campaigns)) {
        data.campaigns.forEach(c => {
          if (c && c.id && c.id !== NUTRI_ALPHA_PRESET_CAMPAIGN.id) {
            if (!promoCampaigns.some(existing => existing.id === c.id)) {
              promoCampaigns.push(c);
            }
          }
        });
        saveCustomPromoCampaigns();
      }
      if (data && data.composerState) {
        promoComposerState = { ...promoComposerState, ...data.composerState };
        savePromoComposerState();
      }

      renderPromoBroadcastUI();
      showPromoToast('✅ Campaign state & progress imported successfully from backup file!');
    } catch (err) {
      alert('Invalid backup JSON file: ' + err.message);
    }
  };
  reader.readAsText(file);
}
window.handleImportPromoJson = handleImportPromoJson;

// ─── EXPOSE GLOBALS FOR WINDOW & TESTS ─────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.NUTRI_ALPHA_PRESET_CAMPAIGN = NUTRI_ALPHA_PRESET_CAMPAIGN;
  window.PROMO_DEFAULT_TEMPLATES = PROMO_DEFAULT_TEMPLATES;
  window.formatTitleCase = formatTitleCase;
  window.cleanPhoneForWhatsApp = cleanPhoneForWhatsApp;
  window.validatePhoneNumber = validatePhoneNumber;
  window.detectCustomerLanguagePreference = detectCustomerLanguagePreference;
  window.translateEnglishPromo = translateEnglishPromo;
  window.generatePersonalizedMessage = generatePersonalizedMessage;
  window.getCustomerSentStatus = getCustomerSentStatus;
  window.setCustomerSentStatus = setCustomerSentStatus;
  window.parseCsvFileToCustomers = parseCsvFileToCustomers;
  window.copyPosterToClipboard = copyPosterToClipboard;
  Object.defineProperty(window, 'promoActiveCampaign', {
    get: () => promoActiveCampaign,
    set: (v) => { promoActiveCampaign = v; },
    configurable: true
  });
  Object.defineProperty(window, 'promoComposerState', {
    get: () => promoComposerState,
    set: (v) => { promoComposerState = v; },
    configurable: true
  });
}
