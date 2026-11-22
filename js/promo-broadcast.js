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
  defaultOfferDetails: 'Beli 2 Tin RM210 (Jimat RM20) + Percuma Shaker / 买2罐特惠 RM210（节省 RM20）+ 免费赠送摇摇杯，存货有限售完即止',
  defaultOfferDetailsEn: 'Buy 2 Tins at RM210 (Save RM20) + Free Shaker Cup, while stocks last',
  defaultOfferDetailsBm: 'Beli 2 Tin pada harga RM210 (Jimat RM20) + Percuma Shaker Cup, sementara stok masih ada',
  defaultOfferDetailsZh: '买2罐特惠 RM210（节省 RM20）+ 免费赠送摇摇杯，存货有限售完即止',
  defaultPromoPeriod: 'Sementara Stok Masih Ada / 存货有限，售完即止',
  customers: [{"id":"CUST_1","name":"LAI JON SEN","phone":"601121093229","totalQty":9,"totalSpent":1145,"lastDate":"30-08-26 0:00","firstDate":"28-01-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI","LOLITA WONG LIN","JONG PEI CHOO","Muhammad Nur Farizin Bin Abdullah","KENIX LING WANG YING"],"history":[{"date":"28-01-26 0:00","price":115},{"date":"20-02-26 0:00","price":115},{"date":"14-04-26 0:00","price":115},{"date":"30-04-26 0:00","price":115},{"date":"17-05-26 0:00","price":115},{"date":"24-06-26 0:00","price":115},{"date":"12-07-26 0:00","price":115},{"date":"30-07-26 0:00","price":115},{"date":"30-08-26 0:00","price":225}]},{"id":"CUST_2","name":"RADIN MOHD NOR ABD QUDDUS BIN RADIN KADRI","phone":"60192111965","totalQty":1,"totalSpent":115,"lastDate":"30-01-26 0:00","firstDate":"30-01-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"30-01-26 0:00","price":115}]},{"id":"CUST_3","name":"EDMUND BANYOI ANAK GADAH","phone":"60198692892","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"31-01-26 0:00","price":115}]},{"id":"CUST_4","name":"NG CHUN BEE","phone":"60168597418","totalQty":2,"totalSpent":450,"lastDate":"10-06-26 0:00","firstDate":"31-01-26 0:00","salespersons":["LOLITA WONG LIN","CHAI YEE SIAN"],"history":[{"date":"31-01-26 0:00","price":225},{"date":"10-06-26 0:00","price":225}]},{"id":"CUST_5","name":"OLIVIA ANAK TARANG","phone":"60138459331","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"31-01-26 0:00","price":115}]},{"id":"CUST_6","name":"JONATHAN JANA ANAK ANGAT","phone":"60199008678","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"31-01-26 0:00","price":115}]},{"id":"CUST_7","name":"AZZY BINTI HASBI","phone":"60199915015","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"31-01-26 0:00","price":115}]},{"id":"CUST_8","name":"CHELSEA COHEN ANAK JOHNESS","phone":"60172707616","totalQty":1,"totalSpent":115,"lastDate":"14-02-26 0:00","firstDate":"14-02-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"14-02-26 0:00","price":115}]},{"id":"CUST_9","name":"TIONG TECK ONG","phone":"60168958065","totalQty":1,"totalSpent":115,"lastDate":"15-02-26 0:00","firstDate":"15-02-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"15-02-26 0:00","price":115}]},{"id":"CUST_10","name":"MONICA PHILIP ANGKOK","phone":"60128567492","totalQty":1,"totalSpent":225,"lastDate":"16-02-26 0:00","firstDate":"16-02-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"16-02-26 0:00","price":225}]},{"id":"CUST_11","name":"ANGELIA MYRA BINTI JIMMY","phone":"601131997165","totalQty":1,"totalSpent":225,"lastDate":"18-02-26 0:00","firstDate":"18-02-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"18-02-26 0:00","price":225}]},{"id":"CUST_12","name":"NOR SAFRINA BINTI SEPUNI","phone":"60169338307","totalQty":1,"totalSpent":115,"lastDate":"18-02-26 0:00","firstDate":"18-02-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-02-26 0:00","price":115}]},{"id":"CUST_13","name":"TOMMY ANAK JION","phone":"60136146261","totalQty":2,"totalSpent":230,"lastDate":"12-03-26 0:00","firstDate":"20-02-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","CHAI YEE SIAN"],"history":[{"date":"20-02-26 0:00","price":115},{"date":"12-03-26 0:00","price":115}]},{"id":"CUST_14","name":"TAY MOI TZE","phone":"60138166338","totalQty":1,"totalSpent":115,"lastDate":"26-02-26 0:00","firstDate":"26-02-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"26-02-26 0:00","price":115}]},{"id":"CUST_15","name":"JULIE WONG PEK SIONG","phone":"60124423108","totalQty":1,"totalSpent":115,"lastDate":"28-02-26 0:00","firstDate":"28-02-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"28-02-26 0:00","price":115}]},{"id":"CUST_16","name":"YEO KOK SENG","phone":"60198880882","totalQty":5,"totalSpent":795,"lastDate":"10-06-26 0:00","firstDate":"10-03-26 0:00","salespersons":["CHAI YEE SIAN","JONG PEI CHOO","LOLITA WONG LIN"],"history":[{"date":"10-03-26 0:00","price":225},{"date":"17-05-26 0:00","price":225},{"date":"10-06-26 0:00","price":115},{"date":"10-06-26 0:00","price":115}]},{"id":"CUST_17","name":"LAI JIUNG HIAN","phone":"60107756556","totalQty":2,"totalSpent":230,"lastDate":"21-10-26 0:00","firstDate":"10-03-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"10-03-26 0:00","price":115},{"date":"21-10-26 0:00","price":115}]},{"id":"CUST_18","name":"LEE KUOK CHING","phone":"60168986300","totalQty":1,"totalSpent":225,"lastDate":"11-03-26 0:00","firstDate":"11-03-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"11-03-26 0:00","price":225}]},{"id":"CUST_19","name":"HO CHOU FANG","phone":"60122809029","totalQty":3,"totalSpent":675,"lastDate":"24-06-26 0:00","firstDate":"12-03-26 0:00","salespersons":["CHAI YEE SIAN","HANIESHA LOUNA ANAK DAGENG","JONG PEI CHOO"],"history":[{"date":"12-03-26 0:00","price":225},{"date":"12-04-26 0:00","price":225},{"date":"24-06-26 0:00","price":225}]},{"id":"CUST_20","name":"TING YUNG HUA","phone":"601110668658","totalQty":1,"totalSpent":225,"lastDate":"13-03-26 0:00","firstDate":"13-03-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"13-03-26 0:00","price":225}]},{"id":"CUST_21","name":"TIEW YIEN YIEN","phone":"60168870506","totalQty":1,"totalSpent":225,"lastDate":"13-03-26 0:00","firstDate":"13-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"13-03-26 0:00","price":225}]},{"id":"CUST_22","name":"MUHAMAD BIN ZULKIPLI","phone":"60138176441","totalQty":1,"totalSpent":115,"lastDate":"15-03-26 0:00","firstDate":"15-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"15-03-26 0:00","price":115}]},{"id":"CUST_23","name":"CHIA NYAT LIAN","phone":"60168513478","totalQty":1,"totalSpent":225,"lastDate":"15-03-26 0:00","firstDate":"15-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"15-03-26 0:00","price":225}]},{"id":"CUST_24","name":"ABANG ISNAINI GAPOR","phone":"601121888813","totalQty":3,"totalSpent":345,"lastDate":"10-10-26 0:00","firstDate":"16-03-26 0:00","salespersons":["LAI PEY SHYAN","KENIX LING WANG YING","FIONA FIENA ANAK JAMES"],"history":[{"date":"16-03-26 0:00","price":115},{"date":"30-06-26 0:00","price":115},{"date":"10-10-26 0:00","price":115}]},{"id":"CUST_25","name":"SIGAN ANAK INDAH","phone":"60198158151","totalQty":1,"totalSpent":225,"lastDate":"16-03-26 0:00","firstDate":"16-03-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"16-03-26 0:00","price":225}]},{"id":"CUST_26","name":"TING SING YIUNG","phone":"60135789228","totalQty":1,"totalSpent":115,"lastDate":"17-03-26 0:00","firstDate":"17-03-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"17-03-26 0:00","price":115}]},{"id":"CUST_27","name":"MOHAMAD SEZIKI BIN RABIAN","phone":"60146769843","totalQty":2,"totalSpent":230,"lastDate":"30-09-26 0:00","firstDate":"18-03-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","NURHAFIZAH BINTI PAULI"],"history":[{"date":"18-03-26 0:00","price":115},{"date":"30-09-26 0:00","price":115}]},{"id":"CUST_28","name":"LEE SUK JOO","phone":"60138259188","totalQty":1,"totalSpent":225,"lastDate":"18-03-26 0:00","firstDate":"18-03-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"18-03-26 0:00","price":225}]},{"id":"CUST_29","name":"LIM ENG HUI","phone":"60146919831","totalQty":3,"totalSpent":675,"lastDate":"20-07-26 0:00","firstDate":"20-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","JONG PEI CHOO"],"history":[{"date":"20-03-26 0:00","price":225},{"date":"20-07-26 0:00","price":225}]},{"id":"CUST_30","name":"MICK ANAK SEMBONG","phone":"601112035053","totalQty":1,"totalSpent":115,"lastDate":"20-03-26 0:00","firstDate":"20-03-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"20-03-26 0:00","price":115}]},{"id":"CUST_31","name":"CHONG NYUK NGO","phone":"60165795448","totalQty":4,"totalSpent":570,"lastDate":"23-09-26 0:00","firstDate":"20-03-26 0:00","salespersons":["LOLITA WONG LIN","CHAI YEE SIAN"],"history":[{"date":"20-03-26 0:00","price":225},{"date":"23-09-26 0:00","price":115},{"date":"23-09-26 0:00","price":115}]},{"id":"CUST_32","name":"DABBIE ANAK ANDIN","phone":"60128527715","totalQty":1,"totalSpent":225,"lastDate":"21-03-26 0:00","firstDate":"21-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"21-03-26 0:00","price":225}]},{"id":"CUST_33","name":"BONG KUI NYUK","phone":"60178513829","totalQty":1,"totalSpent":115,"lastDate":"23-03-26 0:00","firstDate":"23-03-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"23-03-26 0:00","price":115}]},{"id":"CUST_34","name":"UNAI ANAK CHUNGAT","phone":"60138164594","totalQty":1,"totalSpent":115,"lastDate":"24-03-26 0:00","firstDate":"24-03-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"24-03-26 0:00","price":115}]},{"id":"CUST_35","name":"CHAI NYUK FAH","phone":"60138133363","totalQty":2,"totalSpent":230,"lastDate":"24-08-26 0:00","firstDate":"26-03-26 0:00","salespersons":["JONG PEI CHOO","Daniela Janet Anak Mustapha"],"history":[{"date":"26-03-26 0:00","price":115},{"date":"24-08-26 0:00","price":115}]},{"id":"CUST_36","name":"LIKIN  ANAK JAGA","phone":"60198271486","totalQty":2,"totalSpent":340,"lastDate":"28-04-26 0:00","firstDate":"27-03-26 0:00","salespersons":["JONG PEI CHOO","NURHAFIZAH BINTI PAULI"],"history":[{"date":"27-03-26 0:00","price":115},{"date":"28-04-26 0:00","price":225}]},{"id":"CUST_37","name":"LIAW KIM SIONG","phone":"60138126168","totalQty":1,"totalSpent":115,"lastDate":"27-03-26 0:00","firstDate":"27-03-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"27-03-26 0:00","price":115}]},{"id":"CUST_38","name":"TIONG MING","phone":"60198168181","totalQty":1,"totalSpent":655,"lastDate":"28-03-26 0:00","firstDate":"28-03-26 0:00","salespersons":["LAI PEY SHYAN"],"history":[{"date":"28-03-26 0:00","price":655}]},{"id":"CUST_39","name":"LEE TING BIU","phone":"60198776739","totalQty":1,"totalSpent":115,"lastDate":"28-03-26 0:00","firstDate":"28-03-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"28-03-26 0:00","price":115}]},{"id":"CUST_40","name":"PIROS ANAK RINIP","phone":"60198878991","totalQty":4,"totalSpent":460,"lastDate":"18-09-26 0:00","firstDate":"28-03-26 0:00","salespersons":["CHAI YEE SIAN","FIONA FIENA ANAK JAMES","JONG PEI CHOO","NURHAFIZAH BINTI PAULI"],"history":[{"date":"28-03-26 0:00","price":115},{"date":"23-06-26 0:00","price":115},{"date":"20-08-26 0:00","price":115},{"date":"18-09-26 0:00","price":115}]},{"id":"CUST_41","name":"PHANG SEN","phone":"60198844594","totalQty":1,"totalSpent":115,"lastDate":"11-04-26 0:00","firstDate":"11-04-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"11-04-26 0:00","price":115}]},{"id":"CUST_42","name":"CHOO CHENG SIANG","phone":"60198360379","totalQty":1,"totalSpent":115,"lastDate":"11-04-26 0:00","firstDate":"11-04-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"11-04-26 0:00","price":115}]},{"id":"CUST_43","name":"LO NYET JIN","phone":"60165762536","totalQty":1,"totalSpent":225,"lastDate":"12-04-26 0:00","firstDate":"12-04-26 0:00","salespersons":["Connie Voon Zhi Yin"],"history":[{"date":"12-04-26 0:00","price":225}]},{"id":"CUST_44","name":"HO NYUK LI","phone":"60168445119","totalQty":2,"totalSpent":230,"lastDate":"18-07-26 0:00","firstDate":"13-04-26 0:00","salespersons":["Connie Voon Zhi Yin","Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"13-04-26 0:00","price":115},{"date":"18-07-26 0:00","price":115}]},{"id":"CUST_45","name":"YUSUF BIN AWI","phone":"60178113871","totalQty":1,"totalSpent":115,"lastDate":"16-04-26 0:00","firstDate":"16-04-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"16-04-26 0:00","price":115}]},{"id":"CUST_46","name":"TAY LIP CHORNG","phone":"601125040518","totalQty":2,"totalSpent":230,"lastDate":"10-07-26 0:00","firstDate":"16-04-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"16-04-26 0:00","price":115},{"date":"10-07-26 0:00","price":115}]},{"id":"CUST_47","name":"MOHAMAD HAFEAZAL","phone":"60198522962","totalQty":1,"totalSpent":115,"lastDate":"18-04-26 0:00","firstDate":"18-04-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-04-26 0:00","price":115}]},{"id":"CUST_48","name":"HON KAH KANG","phone":"60109720718","totalQty":1,"totalSpent":115,"lastDate":"21-04-26 0:00","firstDate":"21-04-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"21-04-26 0:00","price":115}]},{"id":"CUST_49","name":"LAW HUA LIANG","phone":"60198764018","totalQty":1,"totalSpent":115,"lastDate":"21-04-26 0:00","firstDate":"21-04-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"21-04-26 0:00","price":115}]},{"id":"CUST_50","name":"NORLELA BINTI RAZALI","phone":"601135937008","totalQty":4,"totalSpent":460,"lastDate":"26-09-26 0:00","firstDate":"21-04-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","JONG PEI CHOO"],"history":[{"date":"21-04-26 0:00","price":115},{"date":"13-05-26 0:00","price":115},{"date":"27-07-26 0:00","price":115},{"date":"26-09-26 0:00","price":115}]},{"id":"CUST_51","name":"JOSEPHINE ANAK RIANG","phone":"60178536431","totalQty":2,"totalSpent":230,"lastDate":"30-05-26 0:00","firstDate":"24-04-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"24-04-26 0:00","price":115},{"date":"30-05-26 0:00","price":115}]},{"id":"CUST_52","name":"SATINA ANAK BERINAU","phone":"60138275056","totalQty":1,"totalSpent":115,"lastDate":"24-04-26 0:00","firstDate":"24-04-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"24-04-26 0:00","price":115}]},{"id":"CUST_53","name":"MOK YONG YU","phone":"60193133159","totalQty":1,"totalSpent":115,"lastDate":"30-04-26 0:00","firstDate":"30-04-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"30-04-26 0:00","price":115}]},{"id":"CUST_54","name":"LIEW JANG FOONG","phone":"60194678802","totalQty":1,"totalSpent":225,"lastDate":"30-04-26 0:00","firstDate":"30-04-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"30-04-26 0:00","price":225}]},{"id":"CUST_55","name":"LIEW JOON TAK","phone":"60194594509","totalQty":1,"totalSpent":115,"lastDate":"10-05-26 0:00","firstDate":"10-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"10-05-26 0:00","price":115}]},{"id":"CUST_56","name":"RADZIAH BINTI TINDI","phone":"60165079610","totalQty":1,"totalSpent":115,"lastDate":"11-05-26 0:00","firstDate":"11-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"11-05-26 0:00","price":115}]},{"id":"CUST_57","name":"TAJUL AKBAR","phone":"60138341944","totalQty":1,"totalSpent":115,"lastDate":"11-05-26 0:00","firstDate":"11-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"11-05-26 0:00","price":115}]},{"id":"CUST_58","name":"HO AH NYAIN","phone":"60168797658","totalQty":1,"totalSpent":115,"lastDate":"11-05-26 0:00","firstDate":"11-05-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"11-05-26 0:00","price":115}]},{"id":"CUST_59","name":"WEI CHUI PING","phone":"60198890178","totalQty":1,"totalSpent":225,"lastDate":"13-05-26 0:00","firstDate":"13-05-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"13-05-26 0:00","price":225}]},{"id":"CUST_60","name":"NIGEL YEO SEE KEE","phone":"601116652510","totalQty":1,"totalSpent":225,"lastDate":"18-05-26 0:00","firstDate":"18-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-05-26 0:00","price":225}]},{"id":"CUST_61","name":"MORIE ANAK DUNGGAU","phone":"60143685474","totalQty":1,"totalSpent":115,"lastDate":"18-05-26 0:00","firstDate":"18-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"18-05-26 0:00","price":115}]},{"id":"CUST_62","name":"CHANG LEE CHIN","phone":"60128807008","totalQty":1,"totalSpent":115,"lastDate":"18-05-26 0:00","firstDate":"18-05-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"18-05-26 0:00","price":115}]},{"id":"CUST_63","name":"HILDA FLORA ANAK RINAH","phone":"60198769074","totalQty":1,"totalSpent":225,"lastDate":"20-05-26 0:00","firstDate":"20-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"20-05-26 0:00","price":225}]},{"id":"CUST_64","name":"UH LEE LEE","phone":"60168970302","totalQty":1,"totalSpent":115,"lastDate":"20-05-26 0:00","firstDate":"20-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"20-05-26 0:00","price":115}]},{"id":"CUST_65","name":"LIN SHER LI","phone":"60176781558","totalQty":1,"totalSpent":115,"lastDate":"21-05-26 0:00","firstDate":"21-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"21-05-26 0:00","price":115}]},{"id":"CUST_66","name":"HASNAN BIN HASSAN","phone":"60198287300","totalQty":1,"totalSpent":115,"lastDate":"22-05-26 0:00","firstDate":"22-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"22-05-26 0:00","price":115}]},{"id":"CUST_67","name":"MISNA ANAK GUMBEK","phone":"60198875294","totalQty":6,"totalSpent":1130,"lastDate":"18-09-26 0:00","firstDate":"24-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","Daniela Janet Anak Mustapha","JONG PEI CHOO","NURHAFIZAH BINTI PAULI","Ting Kwang Yu"],"history":[{"date":"24-05-26 0:00","price":225},{"date":"29-06-26 0:00","price":115},{"date":"29-06-26 0:00","price":225},{"date":"26-07-26 0:00","price":225},{"date":"18-09-26 0:00","price":115},{"date":"18-09-26 0:00","price":225}]},{"id":"CUST_68","name":"Hiew Tze Mui","phone":"60168765993","totalQty":10,"totalSpent":1150,"lastDate":"25-05-26 0:00","firstDate":"25-05-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"25-05-26 0:00","price":115},{"date":"25-05-26 0:00","price":115},{"date":"25-05-26 0:00","price":115},{"date":"25-05-26 0:00","price":115}]},{"id":"CUST_69","name":"YEO SIEW CHING","phone":"60128941838","totalQty":1,"totalSpent":225,"lastDate":"26-05-26 0:00","firstDate":"26-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"26-05-26 0:00","price":225}]},{"id":"CUST_70","name":"Lucy Anak Andil","phone":"60198893215","totalQty":6,"totalSpent":690,"lastDate":"27-05-26 0:00","firstDate":"27-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"27-05-26 0:00","price":115}]},{"id":"CUST_71","name":"KHIEW SUI JIN","phone":"60138225828","totalQty":3,"totalSpent":345,"lastDate":"28-05-26 0:00","firstDate":"28-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"28-05-26 0:00","price":115}]},{"id":"CUST_72","name":"CHAI WAN CHIN","phone":"60147867976","totalQty":1,"totalSpent":115,"lastDate":"29-05-26 0:00","firstDate":"29-05-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"29-05-26 0:00","price":115}]},{"id":"CUST_73","name":"TING SHYH SHENG","phone":"60128099801","totalQty":1,"totalSpent":115,"lastDate":"31-05-26 0:00","firstDate":"31-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"31-05-26 0:00","price":115}]},{"id":"CUST_74","name":"Chu Suk Lin","phone":"60168908023","totalQty":1,"totalSpent":115,"lastDate":"12-06-26 0:00","firstDate":"12-06-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"12-06-26 0:00","price":115}]},{"id":"CUST_75","name":"YEO YEE KANG","phone":"60198355168","totalQty":1,"totalSpent":115,"lastDate":"13-06-26 0:00","firstDate":"13-06-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"13-06-26 0:00","price":115}]},{"id":"CUST_76","name":"Chung May Kin","phone":"60168094286","totalQty":3,"totalSpent":345,"lastDate":"17-06-26 0:00","firstDate":"17-06-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"17-06-26 0:00","price":115},{"date":"17-06-26 0:00","price":115}]},{"id":"CUST_77","name":"CHAI KHEK HIUN","phone":"601155505583","totalQty":2,"totalSpent":230,"lastDate":"18-10-26 0:00","firstDate":"21-06-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","NURHAFIZAH BINTI PAULI"],"history":[{"date":"21-06-26 0:00","price":115},{"date":"18-10-26 0:00","price":115}]},{"id":"CUST_78","name":"RADIAH ANAK JANGGOT","phone":"60198864658","totalQty":1,"totalSpent":115,"lastDate":"21-06-26 0:00","firstDate":"21-06-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"21-06-26 0:00","price":115}]},{"id":"CUST_79","name":"SEMRY ANAK SEMTIN","phone":"60138278157","totalQty":1,"totalSpent":225,"lastDate":"24-06-26 0:00","firstDate":"24-06-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"24-06-26 0:00","price":225}]},{"id":"CUST_80","name":"ROSEMARY ANAK SIRET","phone":"60138095857","totalQty":1,"totalSpent":115,"lastDate":"25-06-26 0:00","firstDate":"25-06-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"25-06-26 0:00","price":115}]},{"id":"CUST_81","name":"CHAI PHEI LAN","phone":"60168006763","totalQty":1,"totalSpent":115,"lastDate":"25-06-26 0:00","firstDate":"25-06-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"25-06-26 0:00","price":115}]},{"id":"CUST_82","name":"NG MIOW NOI","phone":"60135795123","totalQty":1,"totalSpent":115,"lastDate":"28-06-26 0:00","firstDate":"28-06-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"28-06-26 0:00","price":115}]},{"id":"CUST_83","name":"TEO CHONG NGIAN","phone":"60107856939","totalQty":1,"totalSpent":225,"lastDate":"28-06-26 0:00","firstDate":"28-06-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"28-06-26 0:00","price":225}]},{"id":"CUST_84","name":"HARWANDI","phone":"60135759940","totalQty":1,"totalSpent":115,"lastDate":"29-06-26 0:00","firstDate":"29-06-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"29-06-26 0:00","price":115}]},{"id":"CUST_85","name":"SIM KWANG MENG","phone":"60102897655","totalQty":2,"totalSpent":340,"lastDate":"11-07-26 0:00","firstDate":"11-07-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"11-07-26 0:00","price":115},{"date":"11-07-26 0:00","price":225}]},{"id":"CUST_86","name":"BONG SAN MOI","phone":"60168535952","totalQty":1,"totalSpent":115,"lastDate":"12-07-26 0:00","firstDate":"12-07-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"12-07-26 0:00","price":115}]},{"id":"CUST_87","name":"RICK METIL ANAK RIANG","phone":"601151952654","totalQty":1,"totalSpent":115,"lastDate":"14-07-26 0:00","firstDate":"14-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"14-07-26 0:00","price":115}]},{"id":"CUST_88","name":"MALING ANAK KALONG","phone":"6082611710","totalQty":1,"totalSpent":115,"lastDate":"15-07-26 0:00","firstDate":"15-07-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"15-07-26 0:00","price":115}]},{"id":"CUST_89","name":"BRONSON MOGGIE SULANG ANAK MURUI","phone":"60138117732","totalQty":1,"totalSpent":115,"lastDate":"15-07-26 0:00","firstDate":"15-07-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"15-07-26 0:00","price":115}]},{"id":"CUST_90","name":"LEE AH HIN","phone":"60109856838","totalQty":1,"totalSpent":115,"lastDate":"16-07-26 0:00","firstDate":"16-07-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"16-07-26 0:00","price":115}]},{"id":"CUST_91","name":"LAI JIN HIONG","phone":"60182067217","totalQty":2,"totalSpent":340,"lastDate":"10-10-26 0:00","firstDate":"16-07-26 0:00","salespersons":["KENIX LING WANG YING","JONG PEI CHOO"],"history":[{"date":"16-07-26 0:00","price":115},{"date":"10-10-26 0:00","price":225}]},{"id":"CUST_92","name":"Umi Hasma Salleh","phone":"60198378853","totalQty":1,"totalSpent":115,"lastDate":"17-07-26 0:00","firstDate":"17-07-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"17-07-26 0:00","price":115}]},{"id":"CUST_93","name":"ROSLINA BT ZAKARIA @ ROSALIND AK KUJA","phone":"601125001974","totalQty":1,"totalSpent":115,"lastDate":"19-07-26 0:00","firstDate":"19-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"19-07-26 0:00","price":115}]},{"id":"CUST_94","name":"SALINA ANAK JAMES MALONG","phone":"60194671968","totalQty":1,"totalSpent":115,"lastDate":"19-07-26 0:00","firstDate":"19-07-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"19-07-26 0:00","price":115}]},{"id":"CUST_95","name":"TING PIK KIONG","phone":"60127011750","totalQty":1,"totalSpent":225,"lastDate":"20-07-26 0:00","firstDate":"20-07-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"20-07-26 0:00","price":225}]},{"id":"CUST_96","name":"Chai Joon Khim","phone":"60198577058","totalQty":3,"totalSpent":455,"lastDate":"24-09-26 0:00","firstDate":"22-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha","Ting Kwang Yu"],"history":[{"date":"22-07-26 0:00","price":115},{"date":"24-09-26 0:00","price":115},{"date":"24-09-26 0:00","price":225}]},{"id":"CUST_97","name":"LU HUONG LAI","phone":"60138033738","totalQty":1,"totalSpent":115,"lastDate":"22-07-26 0:00","firstDate":"22-07-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"22-07-26 0:00","price":115}]},{"id":"CUST_98","name":"CHAI KHEK HIUN","phone":"60115611","totalQty":1,"totalSpent":115,"lastDate":"26-07-26 0:00","firstDate":"26-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"26-07-26 0:00","price":115}]},{"id":"CUST_99","name":"THEN PIK SIA","phone":"60162319226","totalQty":1,"totalSpent":115,"lastDate":"26-07-26 0:00","firstDate":"26-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"26-07-26 0:00","price":115}]},{"id":"CUST_100","name":"VOON MUI JIN","phone":"601165757118","totalQty":1,"totalSpent":115,"lastDate":"28-07-26 0:00","firstDate":"28-07-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"28-07-26 0:00","price":115}]},{"id":"CUST_101","name":"WONG HONG CHIN","phone":"60168885344","totalQty":2,"totalSpent":230,"lastDate":"23-10-26 0:00","firstDate":"30-07-26 0:00","salespersons":["JONG PEI CHOO","CHAI YEE SIAN"],"history":[{"date":"30-07-26 0:00","price":115},{"date":"23-10-26 0:00","price":115}]},{"id":"CUST_102","name":"DORIS CHONG LIONG LIN","phone":"60143922912","totalQty":1,"totalSpent":115,"lastDate":"31-07-26 0:00","firstDate":"31-07-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"31-07-26 0:00","price":115}]},{"id":"CUST_103","name":"MOHAMAD JALI BIN LILI","phone":"60135792514","totalQty":1,"totalSpent":115,"lastDate":"10-08-26 0:00","firstDate":"10-08-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"10-08-26 0:00","price":115}]},{"id":"CUST_104","name":"Sia Tay Kuek","phone":"60168521169","totalQty":4,"totalSpent":570,"lastDate":"20-09-26 0:00","firstDate":"11-08-26 0:00","salespersons":["KENIX LING WANG YING","FIONA FIENA ANAK JAMES"],"history":[{"date":"11-08-26 0:00","price":225},{"date":"20-09-26 0:00","price":115},{"date":"20-09-26 0:00","price":115}]},{"id":"CUST_105","name":"KERINE ANAK GADEP","phone":"60198393031","totalQty":2,"totalSpent":230,"lastDate":"13-10-26 0:00","firstDate":"11-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","Ting Kwang Yu"],"history":[{"date":"11-08-26 0:00","price":115},{"date":"13-10-26 0:00","price":115}]},{"id":"CUST_106","name":"NG SEY MOI","phone":"60108648228","totalQty":1,"totalSpent":225,"lastDate":"14-08-26 0:00","firstDate":"14-08-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"14-08-26 0:00","price":225}]},{"id":"CUST_107","name":"HAIRY BIN ALI","phone":"60178574075","totalQty":1,"totalSpent":115,"lastDate":"16-08-26 0:00","firstDate":"16-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"16-08-26 0:00","price":115}]},{"id":"CUST_108","name":"YONG WEE PIN","phone":"601116829106","totalQty":1,"totalSpent":115,"lastDate":"16-08-26 0:00","firstDate":"16-08-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"16-08-26 0:00","price":115}]},{"id":"CUST_109","name":"WONG SON ENG","phone":"60102715721","totalQty":1,"totalSpent":115,"lastDate":"17-08-26 0:00","firstDate":"17-08-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"17-08-26 0:00","price":115}]},{"id":"CUST_110","name":"NGIAN ANAK SELANG","phone":"60138272850","totalQty":1,"totalSpent":115,"lastDate":"18-08-26 0:00","firstDate":"18-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-08-26 0:00","price":115}]},{"id":"CUST_111","name":"CHAI SIEW MOI","phone":"601110578128","totalQty":2,"totalSpent":340,"lastDate":"22-10-26 0:00","firstDate":"19-08-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"19-08-26 0:00","price":115},{"date":"22-10-26 0:00","price":225}]},{"id":"CUST_112","name":"GILBERT JONG SIEW HUI","phone":"60143961188","totalQty":1,"totalSpent":115,"lastDate":"21-08-26 0:00","firstDate":"21-08-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"21-08-26 0:00","price":115}]},{"id":"CUST_113","name":"MOHAMMED AZIZUL BIN NASSIR","phone":"60138218691","totalQty":1,"totalSpent":115,"lastDate":"23-08-26 0:00","firstDate":"23-08-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"23-08-26 0:00","price":115}]},{"id":"CUST_114","name":"NULAI ANAK RUNDANG","phone":"60135680545","totalQty":1,"totalSpent":115,"lastDate":"23-08-26 0:00","firstDate":"23-08-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"23-08-26 0:00","price":115}]},{"id":"CUST_115","name":"CHONG LEE CHOO","phone":"60168596678","totalQty":2,"totalSpent":230,"lastDate":"24-10-26 0:00","firstDate":"24-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","JONG PEI CHOO"],"history":[{"date":"24-08-26 0:00","price":115},{"date":"24-10-26 0:00","price":115}]},{"id":"CUST_116","name":"TENG CONG XIN","phone":"60128909212","totalQty":1,"totalSpent":115,"lastDate":"27-08-26 0:00","firstDate":"27-08-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"27-08-26 0:00","price":115}]},{"id":"CUST_117","name":"KONG CHIA LING","phone":"60146884858","totalQty":2,"totalSpent":340,"lastDate":"28-08-26 0:00","firstDate":"28-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"28-08-26 0:00","price":115},{"date":"28-08-26 0:00","price":225}]},{"id":"CUST_118","name":"VOON TZE MIN","phone":"60138292238","totalQty":1,"totalSpent":115,"lastDate":"29-08-26 0:00","firstDate":"29-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"29-08-26 0:00","price":115}]},{"id":"CUST_119","name":"NGILIA ANAK LUTAM","phone":"60147541647","totalQty":1,"totalSpent":115,"lastDate":"29-08-26 0:00","firstDate":"29-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"29-08-26 0:00","price":115}]},{"id":"CUST_120","name":"THOMAS ANAK EMPENI","phone":"60122694138","totalQty":1,"totalSpent":115,"lastDate":"30-08-26 0:00","firstDate":"30-08-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"30-08-26 0:00","price":115}]},{"id":"CUST_121","name":"TAN THUANG HUI","phone":"60165759883","totalQty":3,"totalSpent":675,"lastDate":"20-10-26 0:00","firstDate":"30-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","Christina Lee Ying Ying"],"history":[{"date":"30-08-26 0:00","price":225},{"date":"30-08-26 0:00","price":225},{"date":"20-10-26 0:00","price":225}]},{"id":"CUST_122","name":"CHONG CHIEW YAN","phone":"60178992966","totalQty":2,"totalSpent":450,"lastDate":"23-10-26 0:00","firstDate":"31-08-26 0:00","salespersons":["JONG PEI CHOO","KENIX LING WANG YING"],"history":[{"date":"31-08-26 0:00","price":225},{"date":"23-10-26 0:00","price":225}]},{"id":"CUST_123","name":"LIIK HIE LOI","phone":"60168728017","totalQty":1,"totalSpent":115,"lastDate":"15-09-26 0:00","firstDate":"15-09-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"15-09-26 0:00","price":115}]},{"id":"CUST_124","name":"IMIR  TJHO","phone":"60168875905","totalQty":1,"totalSpent":115,"lastDate":"15-09-26 0:00","firstDate":"15-09-26 0:00","salespersons":["Ting Kwang Yu"],"history":[{"date":"15-09-26 0:00","price":115}]},{"id":"CUST_125","name":"CHUNG YIN LING","phone":"601116693493","totalQty":1,"totalSpent":115,"lastDate":"19-09-26 0:00","firstDate":"19-09-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"19-09-26 0:00","price":115}]},{"id":"CUST_126","name":"CHUNG AH GAN","phone":"60168316258","totalQty":1,"totalSpent":225,"lastDate":"20-09-26 0:00","firstDate":"20-09-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"20-09-26 0:00","price":225}]},{"id":"CUST_127","name":"KOO FOO KIAW","phone":"60128090836","totalQty":1,"totalSpent":115,"lastDate":"20-09-26 0:00","firstDate":"20-09-26 0:00","salespersons":["Ting Kwang Yu"],"history":[{"date":"20-09-26 0:00","price":115}]},{"id":"CUST_128","name":"CHAI LIAN CHOO","phone":"60138941176","totalQty":1,"totalSpent":225,"lastDate":"21-09-26 0:00","firstDate":"21-09-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"21-09-26 0:00","price":225}]},{"id":"CUST_129","name":"YEO SIEW CHIN","phone":"60198193376","totalQty":2,"totalSpent":450,"lastDate":"14-10-26 0:00","firstDate":"23-09-26 0:00","salespersons":["Ting Kwang Yu","JONG PEI CHOO"],"history":[{"date":"23-09-26 0:00","price":225},{"date":"14-10-26 0:00","price":225}]},{"id":"CUST_130","name":"TAN AI LAN","phone":"60168592845","totalQty":1,"totalSpent":115,"lastDate":"23-09-26 0:00","firstDate":"23-09-26 0:00","salespersons":["Ting Kwang Yu"],"history":[{"date":"23-09-26 0:00","price":115}]},{"id":"CUST_131","name":"MARUJU ANAK SADAGAR","phone":"60138386019","totalQty":1,"totalSpent":115,"lastDate":"24-09-26 0:00","firstDate":"24-09-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"24-09-26 0:00","price":115}]},{"id":"CUST_132","name":"LAI MUK SHIN","phone":"60168837003","totalQty":1,"totalSpent":115,"lastDate":"27-09-26 0:00","firstDate":"27-09-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"27-09-26 0:00","price":115}]},{"id":"CUST_133","name":"MOHAMMAD HAZILLIE BIN SATIM","phone":"60198540516","totalQty":1,"totalSpent":115,"lastDate":"30-09-26 0:00","firstDate":"30-09-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"30-09-26 0:00","price":115}]},{"id":"CUST_134","name":"MOHAMMAD AIDIL","phone":"60197252715","totalQty":1,"totalSpent":115,"lastDate":"30-09-26 0:00","firstDate":"30-09-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"30-09-26 0:00","price":115}]},{"id":"CUST_135","name":"CHANG AH LAT","phone":"60168901321","totalQty":1,"totalSpent":115,"lastDate":"10-10-26 0:00","firstDate":"10-10-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"10-10-26 0:00","price":115}]},{"id":"CUST_136","name":"PHU KIM LAI","phone":"60168099102","totalQty":1,"totalSpent":115,"lastDate":"12-10-26 0:00","firstDate":"12-10-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"12-10-26 0:00","price":115}]},{"id":"CUST_137","name":"CANDY ANAK NYOMUI","phone":"60168982642","totalQty":1,"totalSpent":115,"lastDate":"13-10-26 0:00","firstDate":"13-10-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"13-10-26 0:00","price":115}]},{"id":"CUST_138","name":"SUHARTI ANAK BIGIN","phone":"601119352830","totalQty":1,"totalSpent":115,"lastDate":"16-10-26 0:00","firstDate":"16-10-26 0:00","salespersons":["Christina Lee Ying Ying"],"history":[{"date":"16-10-26 0:00","price":115}]},{"id":"CUST_139","name":"MARIA TUBAK","phone":"60192060778","totalQty":2,"totalSpent":450,"lastDate":"18-10-26 0:00","firstDate":"18-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"18-10-26 0:00","price":225},{"date":"18-10-26 0:00","price":225}]},{"id":"CUST_140","name":"LAI NYIK CHOI","phone":"60177768236","totalQty":1,"totalSpent":115,"lastDate":"18-10-26 0:00","firstDate":"18-10-26 0:00","salespersons":["Christina Lee Ying Ying"],"history":[{"date":"18-10-26 0:00","price":115}]},{"id":"CUST_141","name":"CHONG FOO TECK","phone":"60128799378","totalQty":1,"totalSpent":115,"lastDate":"18-10-26 0:00","firstDate":"18-10-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-10-26 0:00","price":115}]},{"id":"CUST_142","name":"WONG LEE SIONG","phone":"60146986888","totalQty":1,"totalSpent":115,"lastDate":"19-10-26 0:00","firstDate":"19-10-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"19-10-26 0:00","price":115}]},{"id":"CUST_143","name":"ROHANA BINTI DIMIN","phone":"60168874842","totalQty":1,"totalSpent":115,"lastDate":"20-10-26 0:00","firstDate":"20-10-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"20-10-26 0:00","price":115}]},{"id":"CUST_144","name":"SAMSOLL OBING","phone":"601119890438","totalQty":2,"totalSpent":340,"lastDate":"25-10-26 0:00","firstDate":"25-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"25-10-26 0:00","price":225},{"date":"25-10-26 0:00","price":115}]},{"id":"CUST_145","name":"CHIN KIT LAM","phone":"601170057400","totalQty":1,"totalSpent":115,"lastDate":"26-10-26 0:00","firstDate":"26-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"26-10-26 0:00","price":115}]},{"id":"CUST_146","name":"JEZAMINE FIONA ANAK RAYMOND BRAOH","phone":"60128655926","totalQty":3,"totalSpent":455,"lastDate":"26-10-26 0:00","firstDate":"26-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"26-10-26 0:00","price":115},{"date":"26-10-26 0:00","price":225},{"date":"26-10-26 0:00","price":115}]},{"id":"CUST_147","name":"CHAN YAW BENG","phone":"60146779535","totalQty":1,"totalSpent":115,"lastDate":"27-10-26 0:00","firstDate":"27-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"27-10-26 0:00","price":115}]}]
};

// ─── PRESET SEED DATA 2: NUTRIBRIDGE SHEEP PLACENTA 600MG E-STAMP PROMO (63 TRANSACTIONS, 43 CUSTOMERS) ───
const SHEEP_PLACENTA_PRESET_CAMPAIGN = {
  id: 'sheep-placenta-600mg',
  name: 'NUTRIBRIDGE SHEEP PLACENTA 600MG (E-STAMP BUY 6 FREE 1)',
  productName: 'NUTRIBRIDGE SHEEP PLACENTA 600MG WITH GRAPE SEED EXTRACT',
  productCode: '120697',
  defaultPrice: 299,
  isPreset: true,
  createdAt: '2026-11-16T00:00:00.000Z',
  defaultOfferDetails: 'BUY 6 GET 1 FREE E-Stamp Campaign (1 BOX30 = 1 e-stamp, 1 SET90 = 3 e-stamps) | 集满 6 个电子印花，免费换领 1 盒 BOX30',
  defaultOfferDetailsEn: 'BUY 6 GET 1 FREE (Collect 6 e-stamps on Public Medicare App, get 1 BOX30 FREE! 1 BOX30 = 1 e-stamp | 1 SET90 = 3 e-stamps. Register for the E-Stamp campaign in the App before you buy)',
  defaultOfferDetailsBm: 'BELI 6 PERCUMA 1 (Kumpul 6 e-stamp dalam Public Medicare App, tebus 1 Kotak BOX30 PERCUMA! 1 BOX30 = 1 e-stamp | 1 SET90 = 3 e-stamp. Daftar kempen E-Stamp dalam App sebelum membeli)',
  defaultOfferDetailsZh: '买 6 送 1 电子印花活动（集满 6 个电子印花，免费换领 1 盒 BOX30！买 1 盒 BOX30 = 1 个电子印花 | 买 1 套 SET90 = 3 个电子印花。购买前请先在 Public Medicare App 登记电子印花活动）',
  defaultPromoPeriod: '16 Nov 2026 – 31 Dec 2027 / 2026年11月16日 – 2027年12月31日',
  defaultPosterUrlBm: 'assets/sheep-placenta-en.jpg',
  defaultPosterNameBm: 'sheep-placenta-en.jpg',
  defaultPosterUrlZh: 'assets/sheep-placenta-zh.jpg',
  defaultPosterNameZh: 'sheep-placenta-zh.jpg',
  customers: [{"id":"SP_CUST_1","name":"CHONG WEI FONG","phone":"60198348389","totalQty":2,"totalSpent":313,"lastDate":"10-22-26","firstDate":"10-20-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"10-22-26","qty":1,"price":14,"pack":"120697 - SOFTGEL","sp":"CHAI YEE SIAN"},{"date":"10-20-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_2","name":"BONG AH TIT","phone":"60142060121","totalQty":3,"totalSpent":88,"lastDate":"05-12-26","firstDate":"06-13-26","salespersons":["CHAI YEE SIAN","JONG PEI CHOO"],"history":[{"date":"05-12-26","qty":2,"price":14,"pack":"120697 - SOFTGEL","sp":"CHAI YEE SIAN"},{"date":"06-13-26","qty":1,"price":60,"pack":"120697 - 5 TAB","sp":"JONG PEI CHOO"}]},{"id":"SP_CUST_3","name":"LIEW JOO FAH","phone":"60168995891","totalQty":2,"totalSpent":170,"lastDate":"10-20-26","firstDate":"10-26-26","salespersons":["CHAI YEE SIAN","HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"10-20-26","qty":1,"price":60,"pack":"120697 - 5 TAB","sp":"CHAI YEE SIAN"},{"date":"10-26-26","qty":1,"price":110,"pack":"120697 - STRIP10","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"SP_CUST_4","name":"ANNIE ANAK EVEREADY @ EVERIDI","phone":"60189865589","totalQty":1,"totalSpent":60,"lastDate":"09-02-26","firstDate":"09-02-26","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"09-02-26","qty":1,"price":60,"pack":"120697 - 5 TAB","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"SP_CUST_5","name":"LAI AH HIONG","phone":"60112356184","totalQty":1,"totalSpent":60,"lastDate":"07-26-26","firstDate":"07-26-26","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"07-26-26","qty":1,"price":60,"pack":"120697 - 5 TAB","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"SP_CUST_6","name":"MANIK MIAH","phone":"60162271874","totalQty":1,"totalSpent":60,"lastDate":"06-04-26","firstDate":"06-04-26","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"06-04-26","qty":1,"price":60,"pack":"120697 - 5 TAB","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"SP_CUST_7","name":"CHAN PEK YIN","phone":"60168668009","totalQty":2,"totalSpent":359,"lastDate":"05-05-26","firstDate":"06-22-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"05-05-26","qty":1,"price":60,"pack":"120697 - 5 TAB","sp":"CHAI YEE SIAN"},{"date":"06-22-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_8","name":"LIEW CHOON MOY","phone":"60168668923","totalQty":2,"totalSpent":409,"lastDate":"10-14-26","firstDate":"10-02-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"10-14-26","qty":1,"price":110,"pack":"120697 - STRIP10","sp":"CHAI YEE SIAN"},{"date":"10-02-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_9","name":"PATRICK ANAK SINKA","phone":"601119840883","totalQty":1,"totalSpent":110,"lastDate":"06-22-26","firstDate":"06-22-26","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"06-22-26","qty":1,"price":110,"pack":"120697 - STRIP10","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"SP_CUST_10","name":"JAMIYA BINTI SUMADI","phone":"996600056067","totalQty":3,"totalSpent":180,"lastDate":"05-19-26","firstDate":"05-19-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"05-19-26","qty":3,"price":60,"pack":"120697 - 5 TAB","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_11","name":"BONG SIEW HUA","phone":"60165898855","totalQty":2,"totalSpent":568,"lastDate":"09-09-26","firstDate":"09-09-26","salespersons":["CHAI YEE SIAN","JONG PEI CHOO"],"history":[{"date":"09-09-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"},{"date":"09-09-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"JONG PEI CHOO"}]},{"id":"SP_CUST_12","name":"CHAI SHOON LEE","phone":"60198193265","totalQty":2,"totalSpent":598,"lastDate":"10-19-26","firstDate":"05-13-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"10-19-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"},{"date":"05-13-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_13","name":"LAI NYIT LI","phone":"60198199463","totalQty":3,"totalSpent":897,"lastDate":"10-19-26","firstDate":"06-15-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"10-19-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"},{"date":"08-08-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"},{"date":"06-15-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_14","name":"NG CHEE LICK","phone":"60143311225","totalQty":1,"totalSpent":299,"lastDate":"10-16-26","firstDate":"10-16-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"10-16-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_15","name":"ANNIE LAU SIEW HEE","phone":"60168960507","totalQty":1,"totalSpent":299,"lastDate":"10-15-26","firstDate":"10-15-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"10-15-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_16","name":"Hiew Tze Mui","phone":"60168765993","totalQty":1,"totalSpent":299,"lastDate":"10-14-26","firstDate":"10-14-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"10-14-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_17","name":"WEE HSIAO LIANG","phone":"60148848709","totalQty":1,"totalSpent":299,"lastDate":"09-23-26","firstDate":"09-23-26","salespersons":["Ting Kwang Yu"],"history":[{"date":"09-23-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"Ting Kwang Yu"}]},{"id":"SP_CUST_18","name":"GOH SIOK FANG","phone":"601110558988","totalQty":1,"totalSpent":299,"lastDate":"09-10-26","firstDate":"09-10-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"09-10-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_19","name":"LIEW LIAN FOH","phone":"60198578812","totalQty":1,"totalSpent":299,"lastDate":"09-09-26","firstDate":"09-09-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"09-09-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"JONG PEI CHOO"}]},{"id":"SP_CUST_20","name":"NG SZE SOON","phone":"60126689762","totalQty":1,"totalSpent":299,"lastDate":"09-08-26","firstDate":"09-08-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"09-08-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_21","name":"WONG YON HUAT","phone":"60198884489","totalQty":6,"totalSpent":3447,"lastDate":"09-08-26","firstDate":"07-03-26","salespersons":["JONG PEI CHOO","LOLITA WONG LIN","ERICA HO MING HUONG"],"history":[{"date":"09-08-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"JONG PEI CHOO"},{"date":"09-08-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"JONG PEI CHOO"},{"date":"05-29-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"LOLITA WONG LIN"},{"date":"09-08-26","qty":1,"price":850,"pack":"120697 - SET90","sp":"JONG PEI CHOO"},{"date":"08-01-26","qty":1,"price":850,"pack":"120697 - SET90","sp":"JONG PEI CHOO"},{"date":"07-03-26","qty":1,"price":850,"pack":"120697 - SET90","sp":"ERICA HO MING HUONG"}]},{"id":"SP_CUST_22","name":"BOON KIM LIONG","phone":"60440206135357","totalQty":1,"totalSpent":299,"lastDate":"09-02-26","firstDate":"09-02-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"09-02-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_23","name":"FONG KHENG HUP","phone":"60139319000","totalQty":2,"totalSpent":1149,"lastDate":"08-25-26","firstDate":"09-07-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"08-25-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"JONG PEI CHOO"},{"date":"09-07-26","qty":1,"price":850,"pack":"120697 - SET90","sp":"JONG PEI CHOO"}]},{"id":"SP_CUST_24","name":"HII CHAI","phone":"60138169985","totalQty":2,"totalSpent":598,"lastDate":"08-06-26","firstDate":"06-19-26","salespersons":["KENIX LING WANG YING","Daniela Janet Anak Mustapha"],"history":[{"date":"08-06-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"KENIX LING WANG YING"},{"date":"06-19-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"Daniela Janet Anak Mustapha"}]},{"id":"SP_CUST_25","name":"CHIN MIN YEN","phone":"60198772228","totalQty":1,"totalSpent":299,"lastDate":"08-06-26","firstDate":"08-06-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"08-06-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_26","name":"LO KUI FAH","phone":"6082612439","totalQty":3,"totalSpent":897,"lastDate":"08-01-26","firstDate":"05-09-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"08-01-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"},{"date":"06-27-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"},{"date":"05-09-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_27","name":"PHU KIM LAI","phone":"60168099102","totalQty":1,"totalSpent":299,"lastDate":"07-27-26","firstDate":"07-27-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"07-27-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_28","name":"TAN POH KING","phone":"60168099313","totalQty":1,"totalSpent":299,"lastDate":"07-26-26","firstDate":"07-26-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"07-26-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"JONG PEI CHOO"}]},{"id":"SP_CUST_29","name":"JACQUELYNE JINA ANAK JOSEPH HAWKER","phone":"60138229547","totalQty":1,"totalSpent":299,"lastDate":"07-23-26","firstDate":"07-23-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"07-23-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_30","name":"JOLAND ANAK MAT","phone":"601115816497","totalQty":1,"totalSpent":299,"lastDate":"07-13-26","firstDate":"07-13-26","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"07-13-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"SP_CUST_31","name":"LAI JIT SEN","phone":"60198877189","totalQty":1,"totalSpent":299,"lastDate":"07-08-26","firstDate":"07-08-26","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"07-08-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"SP_CUST_32","name":"SIM HENG CHOO","phone":"60198394742","totalQty":1,"totalSpent":299,"lastDate":"07-03-26","firstDate":"07-03-26","salespersons":["LOLITA WONG LIN"],"history":[{"date":"07-03-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"LOLITA WONG LIN"}]},{"id":"SP_CUST_33","name":"CHAN SOI HWA","phone":"60198899606","totalQty":1,"totalSpent":299,"lastDate":"07-03-26","firstDate":"07-03-26","salespersons":["ERICA HO MING HUONG"],"history":[{"date":"07-03-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"ERICA HO MING HUONG"}]},{"id":"SP_CUST_34","name":"LAI FUNG LAN","phone":"60143212982","totalQty":1,"totalSpent":299,"lastDate":"06-10-26","firstDate":"06-10-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"06-10-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_35","name":"LEE THAI LIN","phone":"60168075525","totalQty":1,"totalSpent":299,"lastDate":"06-01-26","firstDate":"06-01-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"06-01-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"JONG PEI CHOO"}]},{"id":"SP_CUST_36","name":"CHONG FOONG SIEW","phone":"60135653009","totalQty":2,"totalSpent":1149,"lastDate":"05-31-26","firstDate":"09-28-26","salespersons":["KENIX LING WANG YING","CHAI YEE SIAN"],"history":[{"date":"05-31-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"KENIX LING WANG YING"},{"date":"09-28-26","qty":1,"price":850,"pack":"120697 - SET90","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_37","name":"CHANGAI ANAK BAKIR","phone":"60145788344","totalQty":1,"totalSpent":299,"lastDate":"05-03-26","firstDate":"05-03-26","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"05-03-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"SP_CUST_38","name":"CHAI SIEW KIM","phone":"60138058164","totalQty":1,"totalSpent":299,"lastDate":"05-02-26","firstDate":"05-02-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"05-02-26","qty":1,"price":299,"pack":"120697 - BOX30","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_39","name":"KUEH CHUI SAI","phone":"601120588871","totalQty":1,"totalSpent":800,"lastDate":"05-10-26","firstDate":"05-10-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"05-10-26","qty":1,"price":850,"pack":"120697 - SET90","sp":"JONG PEI CHOO"}]},{"id":"SP_CUST_40","name":"LING SIEW HONG","phone":"60126121962","totalQty":1,"totalSpent":820,"lastDate":"08-28-26","firstDate":"08-28-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"08-28-26","qty":1,"price":850,"pack":"120697 - SET90","sp":"CHAI YEE SIAN"}]},{"id":"SP_CUST_41","name":"CHOO CHIANG LAN","phone":"60178025131","totalQty":1,"totalSpent":850,"lastDate":"09-30-26","firstDate":"09-30-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"09-30-26","qty":1,"price":850,"pack":"120697 - SET90","sp":"JONG PEI CHOO"}]},{"id":"SP_CUST_42","name":"LEE KHIAN SENG","phone":"60168863104","totalQty":1,"totalSpent":850,"lastDate":"09-23-26","firstDate":"09-23-26","salespersons":["Ting Kwang Yu"],"history":[{"date":"09-23-26","qty":1,"price":850,"pack":"120697 - SET90","sp":"Ting Kwang Yu"}]},{"id":"SP_CUST_43","name":"PHANG THAU HUA","phone":"60198380515","totalQty":2,"totalSpent":1700,"lastDate":"09-22-26","firstDate":"08-05-26","salespersons":["HANIESHA LOUNA ANAK DAGENG","JONG PEI CHOO"],"history":[{"date":"09-22-26","qty":1,"price":850,"pack":"120697 - SET90","sp":"HANIESHA LOUNA ANAK DAGENG"},{"date":"08-05-26","qty":1,"price":850,"pack":"120697 - SET90","sp":"JONG PEI CHOO"}]}]
};

// ─── PRESET SEED DATA 3: NUTRIBRIDGE FLEXSURE GOLD 850G — SENIORCARE ONE DAY SPECIAL (99 TRANSACTIONS, 66 CUSTOMERS) ───
const FLEXSURE_GOLD_PRESET_CAMPAIGN = {
  id: 'flexsure-gold-850g-seniorcare',
  name: 'FLEXSURE GOLD 850G — SENIORCARE ONE DAY SPECIAL (28 NOV 2026)',
  productName: 'NUTRIBRIDGE FLEXSURE GOLD 850G',
  productCode: '145848',
  defaultPrice: 85,
  isPreset: true,
  createdAt: '2026-11-22T00:00:00.000Z',
  defaultOfferDetails: 'SeniorCare Members Only: ONE DAY SPECIAL ONLY RM85/can (Normal Member RM110, Save RM25/can! Limit 3 cans, First Come First Serve) | 只限乐龄会员 (SeniorCare)：一日特惠只需 RM85/罐（原会员价 RM110，每罐省 RM25！限量3罐，先到先得）',
  defaultOfferDetailsEn: 'EXCLUSIVE FOR SENIORCARE MEMBERS ONLY — ONE DAY SPECIAL: ONLY RM85 per can (Normal Member Price RM110 — Save RM25/can!). Limited to 3 cans per customer, First Come First Serve, While Stocks Last. *T&C apply',
  defaultOfferDetailsBm: 'EKSKLUSIF UNTUK AHLI SENIORCARE SAHAJA — TAWARAN 1 HARI ISTIMEWA: HANYA RM85 setin (Harga Ahli Biasa RM110 — Jimat RM25 setin!). Terhad 3 tin seorang, Siapa Cepat Dia Dapat, Sementara Stok Masih Ada. *Tertakluk kepada terma & syarat',
  defaultOfferDetailsZh: '只限 SeniorCare 乐龄会员专享 — 一日特别优惠：每罐只需 RM85（原会员价 RM110，每罐立省 RM25！）。每人限量 3 罐，先到先得，售完即止。*须符合条款与条件',
  defaultPromoPeriod: '28 Nov 2026 (Saturday / Sabtu) — ONE DAY ONLY | 2026年11月28日（星期六）— 只限一天',
  defaultPosterUrlBm: 'assets/flexsure-gold-seniorcare.jpg',
  defaultPosterNameBm: 'flexsure-gold-seniorcare.jpg',
  defaultPosterUrlZh: 'assets/flexsure-gold-seniorcare.jpg',
  defaultPosterNameZh: 'flexsure-gold-seniorcare.jpg',
  customers: [{"id":"FG_CUST_1","name":"VINCENT A/L THARUMAN MANIAM","phone":"60196557356","totalQty":4,"totalSpent":420.0,"lastDate":"01-11-26","firstDate":"28-07-26","salespersons":["Christina Lee Ying Ying","HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"01-11-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"Christina Lee Ying Ying"},{"date":"28-07-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"FG_CUST_2","name":"JONG SZE POH","phone":"60138864892","totalQty":1,"totalSpent":110.0,"lastDate":"01-11-26","firstDate":"01-11-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"01-11-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_3","name":"NELLY ANAK SIYUD","phone":"60138448936","totalQty":11,"totalSpent":1150.0,"lastDate":"31-10-26","firstDate":"05-05-26","salespersons":["FIONA FIENA ANAK JAMES","KENIX LING WANG YING","Daniela Janet Anak Mustapha"],"history":[{"date":"31-10-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"FIONA FIENA ANAK JAMES"},{"date":"31-10-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"FIONA FIENA ANAK JAMES"},{"date":"01-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"KENIX LING WANG YING"},{"date":"01-09-26","qty":2,"price":110.0,"pack":"145848 - BOT","sp":"KENIX LING WANG YING"},{"date":"22-06-26","qty":3,"price":110.0,"pack":"145848 - BOT","sp":"FIONA FIENA ANAK JAMES"},{"date":"05-05-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"Daniela Janet Anak Mustapha"}]},{"id":"FG_CUST_4","name":"TING KIE NGUOK","phone":"60166635567","totalQty":1,"totalSpent":110.0,"lastDate":"30-10-26","firstDate":"30-10-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"30-10-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_5","name":"WAI CHING HUNG","phone":"60168589580","totalQty":5,"totalSpent":550.0,"lastDate":"28-10-26","firstDate":"01-05-26","salespersons":["Muhammad Nur Farizin Bin Abdullah","Ting Kwang Yu","JONG PEI CHOO","LOLITA WONG LIN","HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"28-10-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"Muhammad Nur Farizin Bin Abdullah"},{"date":"21-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"Ting Kwang Yu"},{"date":"09-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"},{"date":"17-06-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"LOLITA WONG LIN"},{"date":"01-05-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"FG_CUST_6","name":"TANG SING CHUNG","phone":"60198396753","totalQty":2,"totalSpent":220.0,"lastDate":"26-10-26","firstDate":"06-10-26","salespersons":["Muhammad Nur Farizin Bin Abdullah","CHAI YEE SIAN"],"history":[{"date":"26-10-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"Muhammad Nur Farizin Bin Abdullah"},{"date":"06-10-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"CHAI YEE SIAN"}]},{"id":"FG_CUST_7","name":"HO KIM SENG","phone":"60138041186","totalQty":3,"totalSpent":320.0,"lastDate":"07-10-26","firstDate":"26-07-26","salespersons":["JONG PEI CHOO","NURHAFIZAH BINTI PAULI"],"history":[{"date":"07-10-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"NURHAFIZAH BINTI PAULI"},{"date":"26-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_8","name":"JI KYIEW LING","phone":"60198463807","totalQty":1,"totalSpent":110.0,"lastDate":"30-09-26","firstDate":"30-09-26","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"30-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"Muhammad Nur Farizin Bin Abdullah"}]},{"id":"FG_CUST_9","name":"YONG BUI MIN","phone":"60168921136","totalQty":3,"totalSpent":330.0,"lastDate":"23-09-26","firstDate":"23-09-26","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"23-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"FIONA FIENA ANAK JAMES"},{"date":"23-09-26","qty":2,"price":110.0,"pack":"145848 - BOT","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"FG_CUST_10","name":"WONG NGIE CHING","phone":"60198391522","totalQty":9,"totalSpent":880.0,"lastDate":"20-09-26","firstDate":"20-09-26","salespersons":["Ting Kwang Yu"],"history":[{"date":"20-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"Ting Kwang Yu"},{"date":"20-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"Ting Kwang Yu"},{"date":"20-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"Ting Kwang Yu"},{"date":"20-09-26","qty":2,"price":110.0,"pack":"145848 - BOT","sp":"Ting Kwang Yu"},{"date":"20-09-26","qty":4,"price":110.0,"pack":"145848 - BOT","sp":"Ting Kwang Yu"}]},{"id":"FG_CUST_11","name":"MUHAMMAD NIZAM","phone":"601118730745","totalQty":1,"totalSpent":110.0,"lastDate":"17-09-26","firstDate":"17-09-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"17-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_12","name":"AUDREY ANAK GAPOH","phone":"60198592831","totalQty":1,"totalSpent":110.0,"lastDate":"16-09-26","firstDate":"16-09-26","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"16-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"FG_CUST_13","name":"JONG PEI CHOO","phone":"60146936922","totalQty":1,"totalSpent":66.0,"lastDate":"11-09-26","firstDate":"11-09-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"11-09-26","qty":1,"price":66.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_14","name":"KAM BOON LAN","phone":"601125597198","totalQty":1,"totalSpent":110.0,"lastDate":"07-09-26","firstDate":"07-09-26","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"07-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"FG_CUST_15","name":"CHIN YUN SHANG","phone":"60168866572","totalQty":1,"totalSpent":110.0,"lastDate":"07-09-26","firstDate":"07-09-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"07-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_16","name":"LAU CHING CHING","phone":"60198894658","totalQty":1,"totalSpent":110.0,"lastDate":"06-09-26","firstDate":"06-09-26","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"06-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"FG_CUST_17","name":"BONG SIAW PHIN","phone":"60165783452","totalQty":1,"totalSpent":110.0,"lastDate":"05-09-26","firstDate":"05-09-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"05-09-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_18","name":"CHONG SIEW YAN","phone":"60138268866","totalQty":9,"totalSpent":903.5,"lastDate":"04-09-26","firstDate":"02-05-26","salespersons":["JONG PEI CHOO","FIONA FIENA ANAK JAMES"],"history":[{"date":"04-09-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"FIONA FIENA ANAK JAMES"},{"date":"18-07-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"JONG PEI CHOO"},{"date":"30-05-26","qty":3,"price":110.0,"pack":"145848 - BOT","sp":"FIONA FIENA ANAK JAMES"},{"date":"02-05-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_19","name":"LUCY LIM","phone":"60168940856","totalQty":1,"totalSpent":110.0,"lastDate":"29-08-26","firstDate":"29-08-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"29-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_20","name":"CHIN YEW KWEE","phone":"60192889960","totalQty":4,"totalSpent":430.0,"lastDate":"28-08-26","firstDate":"08-06-26","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"28-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"HANIESHA LOUNA ANAK DAGENG"},{"date":"28-08-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"HANIESHA LOUNA ANAK DAGENG"},{"date":"08-06-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"FG_CUST_21","name":"KIU CHONG CHAI","phone":"60128921997","totalQty":2,"totalSpent":220.0,"lastDate":"27-08-26","firstDate":"19-08-26","salespersons":["KENIX LING WANG YING","Daniela Janet Anak Mustapha"],"history":[{"date":"27-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"KENIX LING WANG YING"},{"date":"19-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"Daniela Janet Anak Mustapha"}]},{"id":"FG_CUST_22","name":"HOANG HUA ING","phone":"60109826659","totalQty":1,"totalSpent":110.0,"lastDate":"24-08-26","firstDate":"24-08-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"24-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_23","name":"GAN HOOK LEE","phone":"60148865888","totalQty":1,"totalSpent":110.0,"lastDate":"23-08-26","firstDate":"23-08-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"23-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_24","name":"NOOR SELASIAH","phone":"60146860181","totalQty":3,"totalSpent":300.0,"lastDate":"22-08-26","firstDate":"22-08-26","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"22-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"Muhammad Nur Farizin Bin Abdullah"},{"date":"22-08-26","qty":2,"price":110.0,"pack":"145848 - BOT","sp":"Muhammad Nur Farizin Bin Abdullah"}]},{"id":"FG_CUST_25","name":"CHUNG LEE CHU @ CHUNG KIAN HUA","phone":"996600596366","totalQty":1,"totalSpent":110.0,"lastDate":"22-08-26","firstDate":"22-08-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"22-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_26","name":"SATINA ANAK BERINAU","phone":"60138275056","totalQty":3,"totalSpent":300.0,"lastDate":"21-08-26","firstDate":"21-08-26","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"21-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"FIONA FIENA ANAK JAMES"},{"date":"21-08-26","qty":2,"price":110.0,"pack":"145848 - BOT","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"FG_CUST_27","name":"MARGARET MARY BINTI STEPHEN LAISIH","phone":"60138528453","totalQty":2,"totalSpent":210.0,"lastDate":"15-08-26","firstDate":"15-08-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"15-08-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_28","name":"ABU BAKAR BIN SERAH","phone":"60168133023","totalQty":1,"totalSpent":110.0,"lastDate":"14-08-26","firstDate":"14-08-26","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"14-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"FG_CUST_29","name":"LIEW SIAW LEE","phone":"60168086929","totalQty":4,"totalSpent":393.5,"lastDate":"12-08-26","firstDate":"03-06-26","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"12-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"NURHAFIZAH BINTI PAULI"},{"date":"03-06-26","qty":3,"price":110.0,"pack":"145848 - BOT","sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"FG_CUST_30","name":"CHIN TI FUNG","phone":"601172508358","totalQty":2,"totalSpent":210.0,"lastDate":"09-08-26","firstDate":"09-08-26","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"09-08-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"FG_CUST_31","name":"CHOK SUK CHENG","phone":"60128118556","totalQty":6,"totalSpent":550.0,"lastDate":"08-08-26","firstDate":"08-08-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"08-08-26","qty":6,"price":630.0,"pack":"145848 - CTN6","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_32","name":"CHAI MIN NGEE","phone":"60198767238","totalQty":6,"totalSpent":550.0,"lastDate":"08-08-26","firstDate":"08-08-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"08-08-26","qty":6,"price":630.0,"pack":"145848 - CTN6","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_33","name":"PATRICK ANAK SINKA","phone":"601119840883","totalQty":2,"totalSpent":220.0,"lastDate":"07-08-26","firstDate":"27-05-26","salespersons":["JONG PEI CHOO","LOLITA WONG LIN"],"history":[{"date":"07-08-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"},{"date":"27-05-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"LOLITA WONG LIN"}]},{"id":"FG_CUST_34","name":"NANGOK @ NAGIE ANAK MEMBUAS","phone":"996600393069","totalQty":2,"totalSpent":210.0,"lastDate":"04-08-26","firstDate":"04-08-26","salespersons":["KENIX LING WANG YING"],"history":[{"date":"04-08-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"KENIX LING WANG YING"}]},{"id":"FG_CUST_35","name":"JONAS ANAK TAGAU","phone":"60198273410","totalQty":1,"totalSpent":110.0,"lastDate":"30-07-26","firstDate":"30-07-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"30-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_36","name":"ANGELIA RONIS ANAK NYOEL","phone":"60128522483","totalQty":1,"totalSpent":110.0,"lastDate":"30-07-26","firstDate":"30-07-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"30-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_37","name":"HU TUNG NIENG","phone":"60109609188","totalQty":1,"totalSpent":110.0,"lastDate":"30-07-26","firstDate":"30-07-26","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"30-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"FG_CUST_38","name":"KANG TIONG KIAT","phone":"60178832010","totalQty":2,"totalSpent":210.0,"lastDate":"29-07-26","firstDate":"29-07-26","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"29-07-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"Daniela Janet Anak Mustapha"}]},{"id":"FG_CUST_39","name":"CHIN CHIU HIAN","phone":"60138196336","totalQty":1,"totalSpent":110.0,"lastDate":"29-07-26","firstDate":"29-07-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"29-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_40","name":"WONG NGEE HUAT","phone":"60138492226","totalQty":2,"totalSpent":210.0,"lastDate":"22-07-26","firstDate":"22-07-26","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"22-07-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"Daniela Janet Anak Mustapha"}]},{"id":"FG_CUST_41","name":"VALERIE CHRISCA ANAK AGO","phone":"601115909660","totalQty":3,"totalSpent":320.0,"lastDate":"20-07-26","firstDate":"20-07-26","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"20-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"FIONA FIENA ANAK JAMES"},{"date":"20-07-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"FG_CUST_42","name":"SIPEN BIN YAMAN","phone":"60165893959","totalQty":1,"totalSpent":110.0,"lastDate":"13-07-26","firstDate":"13-07-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"13-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"CHAI YEE SIAN"}]},{"id":"FG_CUST_43","name":"CHAI FUI CHIN","phone":"60148973552","totalQty":2,"totalSpent":210.0,"lastDate":"09-07-26","firstDate":"09-07-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"09-07-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_44","name":"HILDA HA SWEE HIONG","phone":"60168611963","totalQty":1,"totalSpent":110.0,"lastDate":"09-07-26","firstDate":"09-07-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"09-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_45","name":"SIM CHAI HUA","phone":"60146876177","totalQty":1,"totalSpent":110.0,"lastDate":"09-07-26","firstDate":"09-07-26","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"09-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"FG_CUST_46","name":"CHRISTINA WANDY ANAK DENNISON","phone":"601125051598","totalQty":1,"totalSpent":110.0,"lastDate":"07-07-26","firstDate":"07-07-26","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"07-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"FG_CUST_47","name":"ANIN ANAK NOPEY","phone":"60197035449","totalQty":1,"totalSpent":110.0,"lastDate":"06-07-26","firstDate":"06-07-26","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"06-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"FG_CUST_48","name":"LIM SEK CHZE","phone":"60168583995","totalQty":2,"totalSpent":220.0,"lastDate":"04-07-26","firstDate":"07-06-26","salespersons":["ERICA HO MING HUONG","JONG PEI CHOO"],"history":[{"date":"04-07-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"ERICA HO MING HUONG"},{"date":"07-06-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_49","name":"WILLIE MINA ANAK HUSSIEN","phone":"60134851977","totalQty":1,"totalSpent":110.0,"lastDate":"25-06-26","firstDate":"25-06-26","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"25-06-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"FG_CUST_50","name":"JOYCE ANAK JAMONG","phone":"60128996521","totalQty":1,"totalSpent":110.0,"lastDate":"13-06-26","firstDate":"13-06-26","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"13-06-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"FG_CUST_51","name":"CHONG SZE THAT","phone":"60149999131","totalQty":1,"totalSpent":110.0,"lastDate":"13-06-26","firstDate":"13-06-26","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"13-06-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"FG_CUST_52","name":"KONG MOI HUA","phone":"60138956632","totalQty":1,"totalSpent":110.0,"lastDate":"11-06-26","firstDate":"11-06-26","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"11-06-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"FG_CUST_53","name":"APUK ANAK SENGEK","phone":"601139283518","totalQty":1,"totalSpent":110.0,"lastDate":"10-06-26","firstDate":"10-06-26","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"10-06-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"Daniela Janet Anak Mustapha"}]},{"id":"FG_CUST_54","name":"ROMELA ANAK FRANCIS","phone":"601119384300","totalQty":4,"totalSpent":410.0,"lastDate":"04-06-26","firstDate":"09-05-26","salespersons":["FIONA FIENA ANAK JAMES","HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"04-06-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"HANIESHA LOUNA ANAK DAGENG"},{"date":"09-05-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"FG_CUST_55","name":"MIGUI ANAK ENDOK","phone":"60128524832","totalQty":1,"totalSpent":110.0,"lastDate":"29-05-26","firstDate":"29-05-26","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"29-05-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"FG_CUST_56","name":"LEE CHAI FEN","phone":"60168777794","totalQty":3,"totalSpent":283.5,"lastDate":"28-05-26","firstDate":"28-05-26","salespersons":["LOLITA WONG LIN"],"history":[{"date":"28-05-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"LOLITA WONG LIN"},{"date":"28-05-26","qty":3,"price":110.0,"pack":"145848 - BOT","sp":"LOLITA WONG LIN"}]},{"id":"FG_CUST_57","name":"LAI MUK LAN","phone":"60198193386","totalQty":2,"totalSpent":200.0,"lastDate":"24-05-26","firstDate":"24-05-26","salespersons":["KENIX LING WANG YING"],"history":[{"date":"24-05-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"KENIX LING WANG YING"}]},{"id":"FG_CUST_58","name":"IDI ANAK GALI","phone":"60198669264","totalQty":2,"totalSpent":200.0,"lastDate":"23-05-26","firstDate":"23-05-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"23-05-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_59","name":"TAN PENG KING","phone":"60138268899","totalQty":3,"totalSpent":310.0,"lastDate":"15-05-26","firstDate":"15-05-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"15-05-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"JONG PEI CHOO"},{"date":"15-05-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_60","name":"ALI ANAK BOSEN","phone":"60138089619","totalQty":2,"totalSpent":200.0,"lastDate":"12-05-26","firstDate":"12-05-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"12-05-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"CHAI YEE SIAN"}]},{"id":"FG_CUST_61","name":"PHANG KHUEN @ PHANG KHUEN FA","phone":"60612511","totalQty":1,"totalSpent":110.0,"lastDate":"12-05-26","firstDate":"12-05-26","salespersons":["CHAI YEE SIAN"],"history":[{"date":"12-05-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"CHAI YEE SIAN"}]},{"id":"FG_CUST_62","name":"TIAN NYAK FANG@TIAN CHIEW HIONG","phone":"60198884271","totalQty":2,"totalSpent":200.0,"lastDate":"11-05-26","firstDate":"11-05-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"11-05-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_63","name":"WONG SIEW KIONG","phone":"60138045962","totalQty":2,"totalSpent":200.0,"lastDate":"09-05-26","firstDate":"09-05-26","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"09-05-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"FIONA FIENA ANAK JAMES"}]},{"id":"FG_CUST_64","name":"CHIN HON THIEN","phone":"996600135051","totalQty":2,"totalSpent":200.0,"lastDate":"09-05-26","firstDate":"09-05-26","salespersons":["JONG PEI CHOO"],"history":[{"date":"09-05-26","qty":2,"price":210.0,"pack":"145848 - 2 BOT","sp":"JONG PEI CHOO"}]},{"id":"FG_CUST_65","name":"LEE MEE YEE","phone":"60189760810","totalQty":1,"totalSpent":110.0,"lastDate":"03-05-26","firstDate":"03-05-26","salespersons":["LOLITA WONG LIN"],"history":[{"date":"03-05-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"LOLITA WONG LIN"}]},{"id":"FG_CUST_66","name":"HELEN ANAK KILI","phone":"60138054564","totalQty":1,"totalSpent":110.0,"lastDate":"01-05-26","firstDate":"01-05-26","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"01-05-26","qty":1,"price":110.0,"pack":"145848 - BOT","sp":"NURHAFIZAH BINTI PAULI"}]}]
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
    ' anak ', ' a k ', ' ak ', ' a p ', ' ap ', ' a l ', ' al ',
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
const STORAGE_PROMO_POSTER_BM  = 'pmg_promo_poster_data_bm';
const STORAGE_PROMO_POSTER_ZH  = 'pmg_promo_poster_data_zh';
const STORAGE_SHEEP_SEEDED_V1    = 'pmg_promo_sheep_placenta_seeded_v1';
const STORAGE_FLEXSURE_SEEDED_V1 = 'pmg_promo_flexsure_gold_seeded_v1';

let promoCampaigns = [];
let promoActiveCampaign = null;
let promoCachedPosterBlob = null;
let promoCachedPosterBlobBm = null;
let promoCachedPosterBlobZh = null;
let promoComposerState = {
  campaignId: FLEXSURE_GOLD_PRESET_CAMPAIGN.id,
  language: 'auto', // 'auto' (smart customer match) | 'bm' | 'zh' | 'bilingual' | 'en' | 'custom'
  offerDetails: FLEXSURE_GOLD_PRESET_CAMPAIGN.defaultOfferDetails,
  offerDetailsEn: FLEXSURE_GOLD_PRESET_CAMPAIGN.defaultOfferDetailsEn,
  offerDetailsBm: FLEXSURE_GOLD_PRESET_CAMPAIGN.defaultOfferDetailsBm,
  offerDetailsZh: FLEXSURE_GOLD_PRESET_CAMPAIGN.defaultOfferDetailsZh,
  promoPeriod: FLEXSURE_GOLD_PRESET_CAMPAIGN.defaultPromoPeriod,
  branchName: 'Kota Sentosa',
  shopPhone: '+60149773924',
  pharmacistPhone: '01110990693',
  pharmacistName: 'William',
  posterUrl: FLEXSURE_GOLD_PRESET_CAMPAIGN.defaultPosterUrlBm,
  posterFileName: FLEXSURE_GOLD_PRESET_CAMPAIGN.defaultPosterNameBm,
  posterUrlBm: FLEXSURE_GOLD_PRESET_CAMPAIGN.defaultPosterUrlBm,
  posterFileNameBm: FLEXSURE_GOLD_PRESET_CAMPAIGN.defaultPosterNameBm,
  posterUrlZh: FLEXSURE_GOLD_PRESET_CAMPAIGN.defaultPosterUrlZh,
  posterFileNameZh: FLEXSURE_GOLD_PRESET_CAMPAIGN.defaultPosterNameZh,
  autoCopyPoster: true,
  reuseWaTab: true,
  customText: '',
  templates: {
    bm: '',
    zh: '',
    bilingual: '',
    en: '',
    custom: ''
  },
  nameFormat: 'title'
};
let promoProgressMap = {}; // { [campaignId]: { [customerId]: { sent: true, sentAt: '...', langOverride: 'bm'|'zh' } } }
let promoFilter = {
  search: '',
  status: 'all', // 'all' | 'pending' | 'sent'
  loyalty: 'all', // 'all' | 'vip' | 'regular' | 'single'
  language: 'all', // 'all' | 'zh' | 'bm'
  sortBy: 'recent' // 'recent' | 'qty_desc' | 'spent_desc' | 'name_asc'
};
let promoPreviewCustomerId = null;
let promoCurrentPage = 1;
const PROMO_PAGE_SIZE = 50;

const PMG_PROMO_CLOUD_URL = (typeof window !== 'undefined' && window.PMG_SCHEDULE_API_URL) || 'https://script.google.com/macros/s/AKfycbyYfM2i7OXo6WojdLv7KwohWD4qnPfwsq-dCH6ECoEhtPnfKJnM8jKCzOC_dB9hSljVdQ/exec';
const PROMO_CLOUD_VAULT_KEY = 'PMG_PROMO_BROADCAST_VAULT_KS01';
let promoGoogleCloudSynced = false;
let promoCloudPushTimer = null;

function resolvePromoAssetUrl(assetPath) {
  if (!assetPath) return '';
  if (assetPath.startsWith('data:') || assetPath.startsWith('http') || assetPath.startsWith('blob:') || assetPath.startsWith('/')) {
    return assetPath;
  }
  if (typeof window !== 'undefined' && window.location && window.location.pathname) {
    if (window.location.pathname.includes('/promo/')) {
      return assetPath.replace(/^promo\//, '');
    }
    if (!assetPath.startsWith('promo/')) {
      return 'promo/' + assetPath;
    }
  }
  return assetPath;
}

// ─── INITIALIZATION ───────────────────────────────────────────────────────────
function initPromoBroadcastModule() {
  loadPromoCampaigns();
  loadPromoComposerState();
  loadPromoProgress();
  loadPromoPoster();
  renderPromoBroadcastUI();
  // Auto check OneDrive & Google Cloud sync in background
  checkOneDriveSyncStatusQuiet();
  pullPromoBroadcastFromGoogleCloud(true).catch(() => {});
}
window.initPromoBroadcastModule = initPromoBroadcastModule;

function isPresetCampaignId(id) {
  return (
    id === FLEXSURE_GOLD_PRESET_CAMPAIGN.id ||
    id === SHEEP_PLACENTA_PRESET_CAMPAIGN.id ||
    id === NUTRI_ALPHA_PRESET_CAMPAIGN.id
  );
}

function applyCampaignDefaultsToComposer(campaign, saveState = true) {
  if (!campaign) return;
  promoComposerState.campaignId = campaign.id || '';
  if (campaign.defaultOfferDetailsEn) promoComposerState.offerDetailsEn = campaign.defaultOfferDetailsEn;
  if (campaign.defaultOfferDetailsBm) promoComposerState.offerDetailsBm = campaign.defaultOfferDetailsBm;
  if (campaign.defaultOfferDetailsZh) promoComposerState.offerDetailsZh = campaign.defaultOfferDetailsZh;
  if (campaign.defaultOfferDetails) promoComposerState.offerDetails = campaign.defaultOfferDetails;
  if (campaign.defaultPromoPeriod) promoComposerState.promoPeriod = campaign.defaultPromoPeriod;

  if (campaign.defaultPosterUrlBm !== undefined) {
    promoComposerState.posterUrlBm = campaign.defaultPosterUrlBm;
    promoComposerState.posterFileNameBm = campaign.defaultPosterNameBm || 'poster-en.jpg';
    promoComposerState.posterUrl = campaign.defaultPosterUrlBm;
    promoComposerState.posterFileName = campaign.defaultPosterNameBm || 'poster-en.jpg';
    try {
      localStorage.removeItem(STORAGE_PROMO_POSTER);
      localStorage.removeItem(STORAGE_PROMO_POSTER_BM);
    } catch (_) {}
    preparePosterBlobForSlot('bm', promoComposerState.posterUrlBm);
  }
  if (campaign.defaultPosterUrlZh !== undefined) {
    promoComposerState.posterUrlZh = campaign.defaultPosterUrlZh;
    promoComposerState.posterFileNameZh = campaign.defaultPosterNameZh || 'poster-zh.jpg';
    try {
      localStorage.removeItem(STORAGE_PROMO_POSTER_ZH);
    } catch (_) {}
    preparePosterBlobForSlot('zh', promoComposerState.posterUrlZh);
  }
  if (saveState) savePromoComposerState();
}

function loadPromoCampaigns() {
  promoCampaigns = [FLEXSURE_GOLD_PRESET_CAMPAIGN, SHEEP_PLACENTA_PRESET_CAMPAIGN, NUTRI_ALPHA_PRESET_CAMPAIGN];
  try {
    const raw = localStorage.getItem(STORAGE_PROMO_CAMPAIGNS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(c => {
          if (c && c.id && !isPresetCampaignId(c.id)) {
            promoCampaigns.push(c);
          }
        });
      }
    }
  } catch (e) {
    console.warn('[PMG Promo] Error loading custom campaigns:', e);
  }

  let activeId = localStorage.getItem(STORAGE_PROMO_ACTIVE_ID);
  try {
    if (localStorage.getItem(STORAGE_FLEXSURE_SEEDED_V1) !== '1') {
      activeId = FLEXSURE_GOLD_PRESET_CAMPAIGN.id;
      localStorage.setItem(STORAGE_PROMO_ACTIVE_ID, activeId);
    }
  } catch (_) {}

  if (!activeId) activeId = FLEXSURE_GOLD_PRESET_CAMPAIGN.id;
  promoActiveCampaign = promoCampaigns.find(c => c.id === activeId) || promoCampaigns[0] || FLEXSURE_GOLD_PRESET_CAMPAIGN;
}

function saveCustomPromoCampaigns() {
  try {
    const customOnly = promoCampaigns.filter(c => !c.isPreset);
    localStorage.setItem(STORAGE_PROMO_CAMPAIGNS, JSON.stringify(customOnly));
    schedulePromoGoogleCloudPush();
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
      if (saved.templates && typeof saved.templates === 'object') {
        promoComposerState.templates = { ...promoComposerState.templates, ...saved.templates };
      }
    }
    // First-time seed for Flexsure Gold SeniorCare One Day Special (28 Nov 2026) so existing localStorage switches cleanly
    if (localStorage.getItem(STORAGE_FLEXSURE_SEEDED_V1) !== '1') {
      applyCampaignDefaultsToComposer(FLEXSURE_GOLD_PRESET_CAMPAIGN, false);
      promoComposerState._updatedAt = '2026-11-22T09:45:00.000Z';
      localStorage.setItem(STORAGE_FLEXSURE_SEEDED_V1, '1');
      localStorage.setItem(STORAGE_SHEEP_SEEDED_V1, '1');
      localStorage.setItem(STORAGE_PROMO_COMPOSER, JSON.stringify(promoComposerState));
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
  if (!promoComposerState.templates) {
    promoComposerState.templates = { bm: '', zh: '', bilingual: '', en: '', custom: '' };
  }
}

function savePromoComposerState() {
  try {
    promoComposerState._updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_PROMO_COMPOSER, JSON.stringify(promoComposerState));
    schedulePromoGoogleCloudPush();
  } catch (e) {
    console.warn('[PMG Promo] Error saving composer state:', e);
  }
}

async function preparePosterBlob(dataUrl) {
  return preparePosterBlobForSlot('bm', dataUrl);
}

async function preparePosterBlobForSlot(langSlot, dataUrl) {
  const slot = (langSlot === 'zh') ? 'zh' : 'bm';
  if (!dataUrl) {
    if (slot === 'zh') promoCachedPosterBlobZh = null;
    else {
      promoCachedPosterBlobBm = null;
      promoCachedPosterBlob = null;
    }
    return null;
  }
  const resolvedUrl = resolvePromoAssetUrl(dataUrl);
  try {
    const res = await fetch(resolvedUrl);
    let blob = await res.blob();
    if (blob.type !== 'image/png' && typeof Image !== 'undefined' && typeof document !== 'undefined') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = resolvedUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    }
    if (slot === 'zh') {
      promoCachedPosterBlobZh = blob;
    } else {
      promoCachedPosterBlobBm = blob;
      promoCachedPosterBlob = blob;
    }
    return blob;
  } catch (err) {
    console.warn(`[Promo Poster Pre-Cache ${slot}]`, err);
    return null;
  }
}

function loadPromoPoster() {
  try {
    // Load EN/BM poster from localStorage or active campaign default
    const rawBm = localStorage.getItem(STORAGE_PROMO_POSTER_BM) || localStorage.getItem(STORAGE_PROMO_POSTER);
    if (rawBm) {
      const parsedBm = JSON.parse(rawBm);
      if (parsedBm && parsedBm.dataUrl) {
        promoComposerState.posterUrlBm = parsedBm.dataUrl;
        promoComposerState.posterFileNameBm = parsedBm.fileName || 'promo_poster_bm.png';
        promoComposerState.posterUrl = parsedBm.dataUrl;
        promoComposerState.posterFileName = parsedBm.fileName || 'promo_poster_bm.png';
      }
    } else if (promoActiveCampaign && promoActiveCampaign.defaultPosterUrlBm) {
      promoComposerState.posterUrlBm = promoActiveCampaign.defaultPosterUrlBm;
      promoComposerState.posterFileNameBm = promoActiveCampaign.defaultPosterNameBm || 'sheep-placenta-en.jpg';
      promoComposerState.posterUrl = promoActiveCampaign.defaultPosterUrlBm;
      promoComposerState.posterFileName = promoActiveCampaign.defaultPosterNameBm || 'sheep-placenta-en.jpg';
    }

    // Load Chinese poster from localStorage or active campaign default
    const rawZh = localStorage.getItem(STORAGE_PROMO_POSTER_ZH);
    if (rawZh) {
      const parsedZh = JSON.parse(rawZh);
      if (parsedZh && parsedZh.dataUrl) {
        promoComposerState.posterUrlZh = parsedZh.dataUrl;
        promoComposerState.posterFileNameZh = parsedZh.fileName || 'promo_poster_zh.png';
      }
    } else if (promoActiveCampaign && promoActiveCampaign.defaultPosterUrlZh) {
      promoComposerState.posterUrlZh = promoActiveCampaign.defaultPosterUrlZh;
      promoComposerState.posterFileNameZh = promoActiveCampaign.defaultPosterNameZh || 'sheep-placenta-zh.jpg';
    }

    if (promoComposerState.posterUrlBm) {
      preparePosterBlobForSlot('bm', promoComposerState.posterUrlBm);
    }
    if (promoComposerState.posterUrlZh) {
      preparePosterBlobForSlot('zh', promoComposerState.posterUrlZh);
    }
  } catch (e) {
    console.warn('[PMG Promo] Error loading poster:', e);
  }
}

function savePromoPoster(dataUrl, fileName, langSlot = 'bm') {
  const slot = (langSlot === 'zh') ? 'zh' : 'bm';
  try {
    if (slot === 'zh') {
      promoComposerState.posterUrlZh = dataUrl || '';
      promoComposerState.posterFileNameZh = fileName || '';
      if (dataUrl) {
        localStorage.setItem(STORAGE_PROMO_POSTER_ZH, JSON.stringify({ dataUrl, fileName }));
        preparePosterBlobForSlot('zh', dataUrl);
      } else {
        promoCachedPosterBlobZh = null;
        localStorage.removeItem(STORAGE_PROMO_POSTER_ZH);
      }
    } else {
      promoComposerState.posterUrlBm = dataUrl || '';
      promoComposerState.posterFileNameBm = fileName || '';
      promoComposerState.posterUrl = dataUrl || '';
      promoComposerState.posterFileName = fileName || '';
      if (dataUrl) {
        localStorage.setItem(STORAGE_PROMO_POSTER_BM, JSON.stringify({ dataUrl, fileName }));
        localStorage.setItem(STORAGE_PROMO_POSTER, JSON.stringify({ dataUrl, fileName }));
        preparePosterBlobForSlot('bm', dataUrl);
      } else {
        promoCachedPosterBlobBm = null;
        promoCachedPosterBlob = null;
        localStorage.removeItem(STORAGE_PROMO_POSTER_BM);
        localStorage.removeItem(STORAGE_PROMO_POSTER);
      }
    }
  } catch (e) {
    console.warn('[PMG Promo] Poster image too large for localStorage, keeping in session:', e);
  }
}

function getPosterForLanguage(effLang) {
  if (effLang === 'zh') {
    const url = promoComposerState.posterUrlZh || promoComposerState.posterUrlBm || promoComposerState.posterUrl || '';
    const fileName = promoComposerState.posterFileNameZh || promoComposerState.posterFileNameBm || promoComposerState.posterFileName || '';
    const isZhPoster = Boolean(promoComposerState.posterUrlZh);
    return {
      langSlot: isZhPoster ? 'zh' : 'bm',
      url: resolvePromoAssetUrl(url),
      rawUrl: url,
      fileName,
      blob: isZhPoster ? promoCachedPosterBlobZh : (promoCachedPosterBlobBm || promoCachedPosterBlob)
    };
  }
  const url = promoComposerState.posterUrlBm || promoComposerState.posterUrl || promoComposerState.posterUrlZh || '';
  const fileName = promoComposerState.posterFileNameBm || promoComposerState.posterFileName || promoComposerState.posterFileNameZh || '';
  const isBmPoster = Boolean(promoComposerState.posterUrlBm || promoComposerState.posterUrl);
  return {
    langSlot: isBmPoster ? 'bm' : 'zh',
    url: resolvePromoAssetUrl(url),
    rawUrl: url,
    fileName,
    blob: isBmPoster ? (promoCachedPosterBlobBm || promoCachedPosterBlob) : promoCachedPosterBlobZh
  };
}
window.getPosterForLanguage = getPosterForLanguage;

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
    schedulePromoGoogleCloudPush();
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
  renderPromoKpis();
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
  if (lang === 'custom') {
    return (promoComposerState.templates && promoComposerState.templates.custom) || promoComposerState.customText || PROMO_DEFAULT_TEMPLATES.bm;
  }
  const effectiveLang = (lang === 'auto') ? 'bm' : lang;
  if (promoComposerState.templates && promoComposerState.templates[effectiveLang] && promoComposerState.templates[effectiveLang].trim()) {
    return promoComposerState.templates[effectiveLang];
  }
  return PROMO_DEFAULT_TEMPLATES[effectiveLang] || PROMO_DEFAULT_TEMPLATES.bm;
}

function generatePersonalizedMessage(customer) {
  if (!customer || !promoActiveCampaign) return '';

  const effLang = getCustomerEffectiveLanguage(customer);

  let template = '';
  if (promoComposerState.language === 'custom') {
    template = (promoComposerState.templates && promoComposerState.templates.custom) || promoComposerState.customText || PROMO_DEFAULT_TEMPLATES.bm;
  } else if (promoComposerState.language === 'auto') {
    // In auto mode, use user-edited template for customer's language if available, else default
    if (promoComposerState.templates && promoComposerState.templates[effLang] && promoComposerState.templates[effLang].trim()) {
      template = promoComposerState.templates[effLang];
    } else {
      template = PROMO_DEFAULT_TEMPLATES[effLang] || PROMO_DEFAULT_TEMPLATES.bm;
    }
  } else {
    // Specifically selected language mode (zh, bm, bilingual, en)
    const mode = promoComposerState.language;
    if (promoComposerState.templates && promoComposerState.templates[mode] && promoComposerState.templates[mode].trim()) {
      template = promoComposerState.templates[mode];
    } else {
      template = PROMO_DEFAULT_TEMPLATES[mode] || PROMO_DEFAULT_TEMPLATES.bm;
    }
  }

  const rawName = customer.name || 'Pelanggan Dihormati / 尊敬的顾客';
  const name = promoComposerState.nameFormat === 'upper' ? rawName.toUpperCase() : formatTitleCase(rawName);
  const product = promoActiveCampaign.productName || 'NUTRIBRIDGE NUTRI ALPHA 800GM';

  // Offer details resolution based on customer language:
  // Chinese customer -> use offerDetailsZh; BM customer -> use offerDetailsBm
  let offerDetails = promoComposerState.offerDetails;
  if (effLang === 'zh') {
    offerDetails = promoComposerState.offerDetailsZh || promoComposerState.offerDetails || '';
  } else if (effLang === 'bm') {
    offerDetails = promoComposerState.offerDetailsBm || promoComposerState.offerDetails || '';
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

  // Auto sanitize any accidental replacement diamonds into clean bullet points
  msg = msg.replace(/\uFFFD/g, '•');

  return msg;
}

// ─── RENDERING UI ─────────────────────────────────────────────────────────────
function renderPromoBroadcastUI() {
  renderPromoCampaignHeader();
  renderPromoKpis();
  renderPromoComposer();
  renderPromoCustomerTable();
  if (typeof renderPromoFy2027GrowthStudio === 'function') renderPromoFy2027GrowthStudio();
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

function updatePromoLangFilterDropdownCounts(customers) {
  const select = document.getElementById('promoLangSelect');
  if (!select || !Array.isArray(customers)) return;
  let zhCount = 0;
  let bmCount = 0;
  customers.forEach(c => {
    if (getCustomerEffectiveLanguage(c) === 'zh') zhCount++;
    else bmCount++;
  });
  const optAll = select.querySelector('option[value="all"]');
  const optZh = select.querySelector('option[value="zh"]');
  const optBm = select.querySelector('option[value="bm"]');
  if (optAll) optAll.textContent = `🌐 All Languages (${customers.length})`;
  if (optZh) optZh.textContent = `🇨🇳 华语 CN (${zhCount})`;
  if (optBm) optBm.textContent = `🇲🇾 BM / EN (${bmCount})`;
}

function updateSendNextButton(customers, campaignId) {
  updatePromoLangFilterDropdownCounts(customers);
  const btn = document.getElementById('promoSendNextBtn');
  if (!btn) return;

  const langFilter = promoFilter.language || 'all';
  const pool = langFilter === 'all'
    ? customers
    : customers.filter(c => {
        const eff = getCustomerEffectiveLanguage(c);
        return langFilter === 'zh' ? eff === 'zh' : eff !== 'zh';
      });

  const nextUnsent = pool.find(c => {
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
    const langLabel = langFilter === 'zh' ? '🇨🇳 华语 ' : langFilter === 'bm' ? '🇲🇾 BM/EN ' : '';
    btn.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> <span>All ${pool.length} ${langLabel}Customers Contacted! 🎉</span>`;
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
  savePromoComposerState();
  renderPromoComposer();
  renderPromoChatPreview();
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

  // Clean any pasted \uFFFD replacement diamonds into bullets immediately
  const cleanOffer = offer.replace(/\uFFFD/g, '•');
  const cleanOfferBm = offerBm.replace(/\uFFFD/g, '•');
  const cleanOfferZh = offerZh.replace(/\uFFFD/g, '•');
  const cleanTextarea = textarea.replace(/\uFFFD/g, '•');

  promoComposerState.offerDetails = cleanOffer;
  promoComposerState.offerDetailsEn = cleanOffer;
  promoComposerState.offerDetailsBm = cleanOfferBm || cleanOffer;
  promoComposerState.offerDetailsZh = cleanOfferZh || cleanOffer;
  promoComposerState.promoPeriod = period;
  promoComposerState.branchName = branch;
  promoComposerState.shopPhone = shop;
  promoComposerState.pharmacistPhone = pharm;

  if (!promoComposerState.templates) {
    promoComposerState.templates = { bm: '', zh: '', bilingual: '', en: '', custom: '' };
  }

  // Live save textarea to the active language template so user edits take effect immediately!
  const activeLang = promoComposerState.language || 'auto';
  if (activeLang === 'custom') {
    promoComposerState.customText = cleanTextarea;
    promoComposerState.templates.custom = cleanTextarea;
  } else if (activeLang === 'auto') {
    // In auto mode, if user types Chinese characters, update zh template, else update bm template
    if (/[\u4e00-\u9fa5]/.test(cleanTextarea)) {
      promoComposerState.templates.zh = cleanTextarea;
    } else {
      promoComposerState.templates.bm = cleanTextarea;
    }
    promoComposerState.customText = cleanTextarea;
  } else {
    promoComposerState.templates[activeLang] = cleanTextarea;
    promoComposerState.customText = cleanTextarea;
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

// ─── POSTER IMAGE UPLOADER & CLIPBOARD (DUAL LANGUAGE: EN/BM & 华语) ─────────
function handlePosterFileSelected(event, langSlot = 'bm') {
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

  const slot = (langSlot === 'zh') ? 'zh' : 'bm';
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    savePromoPoster(dataUrl, file.name, slot);
    renderPosterPreviewUI();
    renderPromoChatPreview();
    showPromoToast(`🖼️ ${slot === 'zh' ? '华语 (Chinese)' : 'EN / BM'} promotional poster attached!`);
  };
  reader.readAsDataURL(file);
}
window.handlePosterFileSelected = handlePosterFileSelected;

function removePromoPoster(langSlot = 'bm') {
  const slot = (langSlot === 'zh') ? 'zh' : 'bm';
  savePromoPoster('', '', slot);
  const inputId = slot === 'zh' ? 'promoPosterFileInputZh' : 'promoPosterFileInputBm';
  const fileInput = document.getElementById(inputId);
  if (fileInput) fileInput.value = '';
  const legacyInput = document.getElementById('promoPosterFileInput');
  if (legacyInput && slot === 'bm') legacyInput.value = '';
  renderPosterPreviewUI();
  renderPromoChatPreview();
  showPromoToast(`${slot === 'zh' ? '华语' : 'EN/BM'} poster removed.`);
}
window.removePromoPoster = removePromoPoster;

function toggleAutoCopyPoster(checkbox) {
  promoComposerState.autoCopyPoster = Boolean(checkbox.checked);
  savePromoComposerState();
}
window.toggleAutoCopyPoster = toggleAutoCopyPoster;

function toggleReuseWaTab(checkbox) {
  promoComposerState.reuseWaTab = Boolean(checkbox.checked);
  savePromoComposerState();
}
window.toggleReuseWaTab = toggleReuseWaTab;

function renderPosterPreviewUI() {
  if (typeof document === 'undefined') return;
  const card = document.getElementById('promoPosterCard');
  if (!card) return;

  // 1. EN / BM Poster Slot
  const bmUrl = promoComposerState.posterUrlBm || promoComposerState.posterUrl || '';
  const bmName = promoComposerState.posterFileNameBm || promoComposerState.posterFileName || 'poster-en.jpg';
  const previewImgBm = document.getElementById('promoPosterThumbBm') || document.getElementById('promoPosterThumb');
  const nameElBm = document.getElementById('promoPosterNameBm') || document.getElementById('promoPosterName');
  const emptyStateBm = document.getElementById('promoPosterEmptyStateBm') || document.getElementById('promoPosterEmptyState');
  const activeStateBm = document.getElementById('promoPosterActiveStateBm') || document.getElementById('promoPosterActiveState');

  if (bmUrl) {
    if (previewImgBm) previewImgBm.src = resolvePromoAssetUrl(bmUrl);
    if (nameElBm) nameElBm.textContent = bmName;
    if (emptyStateBm) emptyStateBm.classList.add('hidden');
    if (activeStateBm) activeStateBm.classList.remove('hidden');
  } else {
    if (emptyStateBm) emptyStateBm.classList.remove('hidden');
    if (activeStateBm) activeStateBm.classList.add('hidden');
  }

  // 2. Chinese (华语) Poster Slot
  const zhUrl = promoComposerState.posterUrlZh || '';
  const zhName = promoComposerState.posterFileNameZh || 'poster-zh.jpg';
  const previewImgZh = document.getElementById('promoPosterThumbZh');
  const nameElZh = document.getElementById('promoPosterNameZh');
  const emptyStateZh = document.getElementById('promoPosterEmptyStateZh');
  const activeStateZh = document.getElementById('promoPosterActiveStateZh');

  if (zhUrl) {
    if (previewImgZh) previewImgZh.src = resolvePromoAssetUrl(zhUrl);
    if (nameElZh) nameElZh.textContent = zhName;
    if (emptyStateZh) emptyStateZh.classList.add('hidden');
    if (activeStateZh) activeStateZh.classList.remove('hidden');
  } else {
    if (emptyStateZh) emptyStateZh.classList.remove('hidden');
    if (activeStateZh) activeStateZh.classList.add('hidden');
  }
}

async function copyPosterToClipboard(langSlot = 'bm', silent = false) {
  const slot = (langSlot === 'zh') ? 'zh' : 'bm';
  const posterInfo = getPosterForLanguage(slot);

  let blob = posterInfo.blob;
  if (!blob && posterInfo.rawUrl) {
    blob = await preparePosterBlobForSlot(posterInfo.langSlot, posterInfo.rawUrl);
  }
  if (!blob) {
    if (!silent) showPromoToast('No poster uploaded for this language slot yet.');
    return false;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      const label = posterInfo.langSlot === 'zh' ? '🇨🇳 华语 Poster' : '🇲🇾🇬🇧 EN/BM Poster';
      if (!silent) {
        showPromoToast(`📋 ${label} copied to clipboard! In WhatsApp, just press Ctrl+V to attach.`);
      }
      return true;
    } else {
      throw new Error('Clipboard API not supported in this browser context.');
    }
  } catch (err) {
    console.warn('[Promo Poster] Failed to copy poster to clipboard:', err);
    if (!silent) {
      showPromoToast('⚠️ Could not auto-copy image. You can drag the poster image directly into WhatsApp chat.');
    }
    return false;
  }
}
window.copyPosterToClipboard = copyPosterToClipboard;

// ─── CHAT PREVIEW ─────────────────────────────────────────────────────────────
function renderPromoChatPreview() {
  if (typeof document === 'undefined') return;
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
  const langLabel = effLang === 'zh' ? '🇨🇳 华语 (Mandarin)' : '🇲🇾 Bahasa Malaysia / EN';
  const posterInfo = getPosterForLanguage(effLang);
  const posterTag = posterInfo.url
    ? (posterInfo.langSlot === 'zh' ? ' · 🖼️ 华语 Poster' : ' · 🖼️ EN/BM Poster')
    : '';

  if (badge) {
    badge.innerHTML = `Previewing for: <strong>${formatTitleCase(sample.name)}</strong> (${sample.phone || 'No phone'}) · <span class="font-bold text-emerald-800">${langLabel}${posterTag}</span>`;
  }

  // Poster preview in mockup (automatically switches between EN/BM & Chinese poster based on customer language!)
  if (posterPreview) {
    if (posterInfo.url) {
      posterPreview.classList.remove('hidden');
      const imgEl = posterPreview.querySelector('img');
      if (imgEl) imgEl.src = posterInfo.url;
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
  const langFilter = promoFilter.language || 'all';

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

    // 4. Preferred Language filter
    if (langFilter !== 'all') {
      const effLang = getCustomerEffectiveLanguage(c);
      if (langFilter === 'zh' && effLang !== 'zh') return false;
      if (langFilter === 'bm' && effLang === 'zh') return false;
    }

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
      ? `<button type="button" onclick="toggleCustomerLangPref('${safeId}')" title="Click to switch between BM and 华语 (also switches poster)" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition inline-flex items-center gap-1 cursor-pointer"><span>🇨🇳 华语</span> <i class="fa-solid fa-arrow-right-arrow-left text-[8px] opacity-60"></i></button>`
      : `<button type="button" onclick="toggleCustomerLangPref('${safeId}')" title="Click to switch between BM and 华语 (also switches poster)" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition inline-flex items-center gap-1 cursor-pointer"><span>🇲🇾 BM</span> <i class="fa-solid fa-arrow-right-arrow-left text-[8px] opacity-60"></i></button>`;

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
      <tr id="promoRow_${safeId}" class="border-b border-gray-100 hover:bg-emerald-50/30 transition ${isSent ? 'bg-slate-50/50' : ''}">
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
          <span class="text-[10px] text-gray-400 block">units</span>
        </td>

        <td class="p-3 text-center promo-status-cell">
          ${statusBadge}
        </td>

        <td class="p-3 text-center promo-action-cell">
          <div class="flex items-center justify-center gap-1.5">
            <button type="button" data-action="promo-send" onclick="sendCustomerPromoWhatsApp('${safeId}')"
              class="promo-send-btn px-3 py-1.5 rounded-lg ${isSent ? 'bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border border-gray-300' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'} font-bold text-xs flex items-center gap-1 transition cursor-pointer"
              title="Open WhatsApp chat with prefilled personalized message and auto-copied language poster">
              <i class="fa-brands fa-whatsapp text-sm"></i>
              <span>${isSent ? 'Resend' : 'Send'}</span>
            </button>

            <button type="button" onclick="previewPromoCustomerMessageModal('${safeId}')"
              class="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-xs transition cursor-pointer"
              title="Preview message & language poster for this customer">
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

function updateSingleCustomerRowInTable(customerId) {
  const safeId = String(customerId);
  const tr = document.getElementById(`promoRow_${safeId}`);
  if (tr) {
    const statusCell = tr.querySelector('.promo-status-cell');
    const actionCell = tr.querySelector('.promo-action-cell');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (statusCell) {
      statusCell.innerHTML = `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <i class="fa-solid fa-circle-check text-emerald-600"></i> Sent (${timeStr})
        </span>`;
    }
    if (actionCell) {
      const sendBtn = actionCell.querySelector('[data-action="promo-send"]');
      if (sendBtn) {
        sendBtn.className = 'promo-send-btn px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border border-gray-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer';
        sendBtn.innerHTML = '<i class="fa-brands fa-whatsapp text-sm"></i> <span>Resend</span>';
      }
    }
    tr.classList.add('bg-slate-50/50');
  }
}

function toggleCustomerLangPref(customerId) {
  if (!promoActiveCampaign) return;
  const campaignId = promoActiveCampaign.id;
  const cust = (promoActiveCampaign.customers || []).find(c => c.id === customerId);
  if (!cust) return;

  const current = getCustomerEffectiveLanguage(cust);
  const nextLang = current === 'zh' ? 'bm' : 'zh';
  promoPreviewCustomerId = customerId;
  setCustomerLanguageOverride(campaignId, customerId, nextLang);
  showPromoToast(`Language & Poster for ${formatTitleCase(cust.name)} set to ${nextLang === 'zh' ? '🇨🇳 华语' : '🇲🇾 Bahasa Malaysia / EN'}`);
}
window.toggleCustomerLangPref = toggleCustomerLangPref;

// ─── SENDING WHATSAPP ─────────────────────────────────────────────────────────
function sendCustomerPromoWhatsApp(customerId) {
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

  promoPreviewCustomerId = cust.id;
  const effLang = getCustomerEffectiveLanguage(cust);

  // 1. Generate personalized message synchronously (with user updates and diamond sanitizing)
  const msg = generatePersonalizedMessage(cust).replace(/\uFFFD/g, '•');

  // 2. Direct WhatsApp URL
  const waUrl = (typeof buildUniversalWhatsAppUrl === 'function')
    ? buildUniversalWhatsAppUrl(val.cleanPhone, msg)
    : `https://api.whatsapp.com/send?phone=${val.cleanPhone}&text=${encodeURIComponent(msg)}`;

  // 3. Open WhatsApp Web / App
  const targetWindow = (promoComposerState.reuseWaTab !== false) ? 'pmg_whatsapp_chat_window' : '_blank';
  if (typeof openUniversalWhatsApp === 'function') {
    openUniversalWhatsApp(val.cleanPhone, msg);
  } else {
    try {
      const win = window.open(waUrl, targetWindow);
      if (!win) {
        const a = document.createElement('a');
        a.href = waUrl;
        a.target = targetWindow;
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { if (a.parentNode) a.parentNode.removeChild(a); }, 100);
      }
    } catch (_) {
      window.open(waUrl, targetWindow);
    }
  }

  // 4. Auto-copy customer's language-matched poster to clipboard in background (non-blocking, 0ms lag!)
  if (promoComposerState.autoCopyPoster) {
    const posterInfo = getPosterForLanguage(effLang);
    const posterLangLabel = posterInfo.langSlot === 'zh' ? '🇨🇳 华语 Poster' : '🇲🇾🇬🇧 EN/BM Poster';
    if (posterInfo.blob && navigator.clipboard && navigator.clipboard.write) {
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': posterInfo.blob })
      ]).then(() => {
        showPromoToast(`${posterLangLabel} copied! Opening WhatsApp for ${formatTitleCase(cust.name)}... (Press Ctrl + V in chat to paste poster)`);
      }).catch(err => {
        console.warn('[PMG Promo] Clipboard copy failed:', err);
      });
    } else if (posterInfo.rawUrl) {
      copyPosterToClipboard(posterInfo.langSlot, true).then((copied) => {
        if (copied) {
          showPromoToast(`${posterLangLabel} copied! Opening WhatsApp for ${formatTitleCase(cust.name)}... (Press Ctrl + V in chat to paste poster)`);
        }
      });
    }
  }

  // 5. Update status in 0ms (targeted single row update without full table re-render)
  const campaignId = promoActiveCampaign.id;
  setCustomerSentStatus(campaignId, cust.id, true);
  updateSingleCustomerRowInTable(cust.id);
  renderPromoKpis();
  renderPromoChatPreview();
}
window.sendCustomerPromoWhatsApp = sendCustomerPromoWhatsApp;

function copyCustomerPromoMessage(customerId) {
  if (!promoActiveCampaign) return;
  const cust = (promoActiveCampaign.customers || []).find(c => c.id === customerId);
  if (!cust) return;

  const msg = generatePersonalizedMessage(cust).replace(/\uFFFD/g, '•');
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

  promoPreviewCustomerId = customerId;
  renderPromoChatPreview();

  const msg = generatePersonalizedMessage(cust).replace(/\uFFFD/g, '•');
  const modal = document.getElementById('promoPreviewModal');
  const modalTitle = document.getElementById('promoModalCustomerTitle') || document.getElementById('promoModalCustomerName');
  const modalBody = document.getElementById('promoModalMessageBody');
  const modalSendBtn = document.getElementById('promoModalSendBtn');

  if (modal && modalBody) {
    const effLang = getCustomerEffectiveLanguage(cust);
    const posterLabel = effLang === 'zh' ? '🇨🇳 华语 Poster' : '🇲🇾🇬🇧 EN/BM Poster';
    if (modalTitle) modalTitle.textContent = `${cust.name} (${cust.phone}) · ${posterLabel}`;
    modalBody.value = msg;
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

function setPromoLangFilter(val) {
  promoFilter.language = val || 'all';
  promoCurrentPage = 1;

  const select = document.getElementById('promoLangSelect');
  if (select && select.value !== promoFilter.language) {
    select.value = promoFilter.language;
  }

  const copyBtn = document.getElementById('promoCopyFilteredPosterBtn');
  const copyLabel = document.getElementById('promoCopyFilteredPosterLabel');
  if (copyBtn) {
    if (promoFilter.language === 'zh') {
      copyBtn.classList.remove('hidden');
      if (copyLabel) copyLabel.textContent = 'Copy 🇨🇳 华语 Poster';
    } else if (promoFilter.language === 'bm') {
      copyBtn.classList.remove('hidden');
      if (copyLabel) copyLabel.textContent = 'Copy 🇲🇾 BM/EN Poster';
    } else {
      copyBtn.classList.add('hidden');
    }
  }

  renderPromoCustomerTable();
  renderPromoKpis();
}
window.setPromoLangFilter = setPromoLangFilter;

function copyFilteredLanguagePoster() {
  const slot = promoFilter.language === 'zh' ? 'zh' : 'bm';
  if (typeof copyPosterToClipboard === 'function') {
    copyPosterToClipboard(slot, false);
  }
}
window.copyFilteredLanguagePoster = copyFilteredLanguagePoster;

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

  applyCampaignDefaultsToComposer(found, true);

  renderPromoCampaignHeader();
  renderPromoKpis();
  renderPromoComposer();
  renderPromoCustomerTable();
}
window.switchPromoCampaign = switchPromoCampaign;

// ─── TOAST NOTIFICATIONS ──────────────────────────────────────────────────────
function showPromoToast(msg) {
  if (typeof document === 'undefined') return;
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
  const lines = String(csvText || '').split(/\r?\n/).filter(l => l.trim().length > 0);
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

  // Scan the first 15 rows to locate the actual column header row (skips POS metadata like "@@##Write Time:17112026 100240")
  let headerLineIdx = 0;
  let rawHeaders = [];
  let nameIdx = -1;
  let phoneIdx = -1;

  const findColInHeaders = (headers, ...keywords) => {
    for (const kw of keywords) {
      const idx = headers.findIndex(h => h === kw || h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const maxScan = Math.min(lines.length, 15);
  for (let idx = 0; idx < maxScan; idx++) {
    const candidateHeaders = parseLine(lines[idx]).map(h => h.toLowerCase().trim());
    if (candidateHeaders.length < 2) continue;
    const candidateNameIdx = findColInHeaders(candidateHeaders, 'client name', 'customer name', 'nama pelanggan', 'pelanggan', 'customer', 'name', 'nama');
    const candidatePhoneIdx = findColInHeaders(candidateHeaders, 'recipient contact', 'client mobile', 'customer mobile', 'mobile', 'no tel', 'phone', 'tel', 'hp', 'contact');
    if (candidateNameIdx !== -1 || candidatePhoneIdx !== -1) {
      headerLineIdx = idx;
      rawHeaders = candidateHeaders;
      nameIdx = candidateNameIdx;
      phoneIdx = candidatePhoneIdx;
      break;
    }
  }

  if (nameIdx === -1 && phoneIdx === -1) {
    throw new Error('Could not detect "Client Name" or "Client Mobile" / "Recipient Contact" columns in this CSV.');
  }

  const findCol = (...keywords) => findColInHeaders(rawHeaders, ...keywords);

  const statusIdx = findCol('sales status', 'status');
  const dateIdx = findCol('sales date', 'tarikh jualan', 'date', 'tarikh');
  const itemIdx = findCol('item name', 'product name', 'nama item', 'nama produk', 'item description', 'description', 'product', 'produk');
  const descIdx = findCol('description');
  const codeIdx = findCol('item code', 'product code', 'kod item', 'kod produk', 'sku', 'code', 'kod');
  const priceIdx = findCol('unit price', 'price', 'harga seunit', 'harga', 'amount');
  const subTotalIdx = findCol('sub total (incl tax)', 'sub total', 'subtotal', 'total amount');
  const qtyIdx = findCol('sales quantity', 'quantity', 'kuantiti jualan', 'kuantiti', 'qty');
  const spIdx = findCol('sales item person', 'salesperson', 'staff', 'pic');

  const customerMap = new Map();
  const productCountMap = {};
  let detectedProductCode = '';

  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row.length < 2) continue;

    if (statusIdx !== -1 && row[statusIdx]) {
      const stVal = row[statusIdx].toLowerCase().trim();
      if (stVal && stVal !== 'completed' && (stVal.includes('cancel') || stVal.includes('void') || stVal === 'sales status')) {
        continue;
      }
    }

    const rawName = (nameIdx !== -1 && row[nameIdx] !== undefined)
      ? String(row[nameIdx]).replace(/^\*+/, '').trim()
      : '';
    const rawPhone = (phoneIdx !== -1 && row[phoneIdx] !== undefined)
      ? cleanPhoneForWhatsApp(row[phoneIdx])
      : '';
    const rawDate = (dateIdx !== -1 && row[dateIdx] !== undefined) ? row[dateIdx] : '';
    const rawItem = (itemIdx !== -1 && row[itemIdx] !== undefined) ? row[itemIdx] : 'Special Offer Product';
    const rawDesc = (descIdx !== -1 && row[descIdx] !== undefined) ? row[descIdx] : '';
    const rawCode = (codeIdx !== -1 && row[codeIdx] !== undefined) ? row[codeIdx] : '';
    const rawPrice = (priceIdx !== -1 && row[priceIdx] !== undefined) ? (parseFloat(row[priceIdx]) || 0) : 0;
    const rawQty = (qtyIdx !== -1 && row[qtyIdx] !== undefined) ? (parseFloat(row[qtyIdx]) || 1) : 1;
    const rawSubTotal = (subTotalIdx !== -1 && row[subTotalIdx] !== undefined)
      ? (parseFloat(row[subTotalIdx]) || (rawPrice * rawQty))
      : (rawPrice * rawQty);
    const rawSp = (spIdx !== -1 && row[spIdx] !== undefined) ? row[spIdx] : '';

    if (!rawName && !rawPhone) continue;
    if (rawName.toLowerCase() === 'total' || rawName.toLowerCase() === 'client name') continue;

    if (rawCode && !detectedProductCode) detectedProductCode = rawCode;

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
        totalSpent: rawSubTotal,
        lastDate: rawDate,
        firstDate: rawDate,
        salespersons: rawSp ? [rawSp] : [],
        history: [{
          date: rawDate,
          qty: rawQty,
          price: rawPrice,
          pack: rawDesc,
          sp: rawSp
        }]
      });
    } else {
      const existing = customerMap.get(key);
      existing.totalQty += rawQty;
      existing.totalSpent += rawSubTotal;
      if (rawDate) existing.lastDate = rawDate;
      if (rawSp && !existing.salespersons.includes(rawSp)) existing.salespersons.push(rawSp);
      existing.history.push({
        date: rawDate,
        qty: rawQty,
        price: rawPrice,
        pack: rawDesc,
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
    productCode: detectedProductCode || (codeIdx !== -1 ? 'POS_EXTRACT' : ''),
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

      const isSheepPlacenta = /sheep\s*placenta/i.test(parsed.productName) || parsed.productCode === '120697';
      const isFlexsureGold = /flexsure\s*gold/i.test(parsed.productName) || String(parsed.productCode || '').startsWith('145848');
      const matchedPreset = isFlexsureGold
        ? FLEXSURE_GOLD_PRESET_CAMPAIGN
        : (isSheepPlacenta ? SHEEP_PLACENTA_PRESET_CAMPAIGN : null);

      const newCampaign = {
        id: 'camp_' + Date.now(),
        name: campaignName.trim(),
        productName: parsed.productName,
        productCode: parsed.productCode,
        isPreset: false,
        createdAt: new Date().toISOString(),
        ...(matchedPreset ? {
          defaultOfferDetails: matchedPreset.defaultOfferDetails,
          defaultOfferDetailsEn: matchedPreset.defaultOfferDetailsEn,
          defaultOfferDetailsBm: matchedPreset.defaultOfferDetailsBm,
          defaultOfferDetailsZh: matchedPreset.defaultOfferDetailsZh,
          defaultPromoPeriod: matchedPreset.defaultPromoPeriod,
          defaultPosterUrlBm: matchedPreset.defaultPosterUrlBm,
          defaultPosterNameBm: matchedPreset.defaultPosterNameBm,
          defaultPosterUrlZh: matchedPreset.defaultPosterUrlZh,
          defaultPosterNameZh: matchedPreset.defaultPosterNameZh
        } : {}),
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

  const headers = ['No', 'Customer Name', 'Phone Number', 'Phone Status', 'Total Units', 'Total Spent (RM)', 'Last Purchase Date', 'Broadcast Status', 'Sent Timestamp'];
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

// ─── CROSS-COMPUTER SYNC (GOOGLE CLOUD + ONEDRIVE + JSON BACKUP/RESTORE) ─────
function mergePromoCloudData(cloudData) {
  if (!cloudData || typeof cloudData !== 'object') return false;
  let changed = false;

  if (cloudData.progressMap && typeof cloudData.progressMap === 'object') {
    for (const campId in cloudData.progressMap) {
      if (!promoProgressMap[campId]) promoProgressMap[campId] = {};
      for (const custId in cloudData.progressMap[campId]) {
        const cloudItem = cloudData.progressMap[campId][custId];
        const localItem = promoProgressMap[campId][custId];
        if (!localItem || (cloudItem.sentAt && (!localItem.sentAt || cloudItem.sentAt > localItem.sentAt))) {
          promoProgressMap[campId][custId] = cloudItem;
          changed = true;
        }
      }
    }
  }

  if (Array.isArray(cloudData.customCampaigns)) {
    cloudData.customCampaigns.forEach(c => {
      if (c && c.id && !isPresetCampaignId(c.id)) {
        if (!promoCampaigns.some(existing => existing.id === c.id)) {
          promoCampaigns.push(c);
          changed = true;
        }
      }
    });
  }

  if (cloudData.composerState && typeof cloudData.composerState === 'object') {
    const cloudTs = cloudData.composerState._updatedAt || cloudData.lastUpdated || '';
    const localTs = promoComposerState._updatedAt || '';
    const cloudCampId = cloudData.composerState.campaignId || '';
    const activeCampId = (promoActiveCampaign && promoActiveCampaign.id) || promoComposerState.campaignId || '';
    const sameCampaign = !cloudCampId || !activeCampId || cloudCampId === activeCampId;
    if (sameCampaign && (!localTs || (cloudTs && cloudTs > localTs))) {
      const preservedPosterUrl = promoComposerState.posterUrl || '';
      const preservedPosterName = promoComposerState.posterFileName || '';
      const preservedPosterUrlBm = promoComposerState.posterUrlBm || '';
      const preservedPosterNameBm = promoComposerState.posterFileNameBm || '';
      const preservedPosterUrlZh = promoComposerState.posterUrlZh || '';
      const preservedPosterNameZh = promoComposerState.posterFileNameZh || '';
      promoComposerState = {
        ...promoComposerState,
        ...cloudData.composerState,
        posterUrl: preservedPosterUrl,
        posterFileName: preservedPosterName,
        posterUrlBm: preservedPosterUrlBm,
        posterFileNameBm: preservedPosterNameBm,
        posterUrlZh: preservedPosterUrlZh,
        posterFileNameZh: preservedPosterNameZh
      };
      changed = true;
    }
  }

  return changed;
}

function buildPromoCloudPayload() {
  const nowIso = new Date().toISOString();
  return {
    version: '2.1',
    lastUpdated: nowIso,
    updatedBy: promoComposerState.pharmacistName || 'Pharmacist',
    branch: promoComposerState.branchName || 'Kota Sentosa',
    progressMap: promoProgressMap,
    composerState: {
      campaignId: (promoActiveCampaign && promoActiveCampaign.id) || promoComposerState.campaignId || '',
      offerDetails: promoComposerState.offerDetails,
      offerDetailsEn: promoComposerState.offerDetailsEn,
      offerDetailsBm: promoComposerState.offerDetailsBm,
      offerDetailsZh: promoComposerState.offerDetailsZh,
      promoPeriod: promoComposerState.promoPeriod,
      shopPhone: promoComposerState.shopPhone,
      pharmacistPhone: promoComposerState.pharmacistPhone,
      pharmacistName: promoComposerState.pharmacistName,
      branchName: promoComposerState.branchName,
      templates: promoComposerState.templates,
      reuseWaTab: promoComposerState.reuseWaTab,
      _updatedAt: promoComposerState._updatedAt || nowIso
    },
    customCampaigns: promoCampaigns.filter(c => !c.isPreset)
  };
}

function schedulePromoGoogleCloudPush() {
  if (typeof window === 'undefined' || !PMG_PROMO_CLOUD_URL) return;
  if (promoCloudPushTimer) clearTimeout(promoCloudPushTimer);
  promoCloudPushTimer = setTimeout(() => {
    pushPromoBroadcastToGoogleCloud(true).catch(() => {});
  }, 1500);
}

async function pullPromoBroadcastFromGoogleCloud(silent = true) {
  if (!PMG_PROMO_CLOUD_URL) return false;
  if (!silent) updateSyncBadgeState('SYNCING');
  try {
    const res = await fetch(`${PMG_PROMO_CLOUD_URL}?branch=${encodeURIComponent(PROMO_CLOUD_VAULT_KEY)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    let cloudData = (data && data.success && data.schedule) ? data.schedule : null;

    if (cloudData && cloudData.docId && !cloudData.progressMap) {
      const docRes = await fetch(`${PMG_PROMO_CLOUD_URL}?action=getApplicantDoc&docId=${encodeURIComponent(cloudData.docId)}`);
      if (docRes.ok) {
        const docJson = await docRes.json();
        if (docJson && docJson.success && docJson.data) {
          cloudData = JSON.parse(docJson.data);
        }
      }
    }

    promoGoogleCloudSynced = true;
    if (cloudData) {
      const changed = mergePromoCloudData(cloudData);
      if (changed) {
        try {
          localStorage.setItem(STORAGE_PROMO_PROGRESS, JSON.stringify(promoProgressMap));
          localStorage.setItem(STORAGE_PROMO_COMPOSER, JSON.stringify(promoComposerState));
          localStorage.setItem(STORAGE_PROMO_CAMPAIGNS, JSON.stringify(promoCampaigns.filter(c => !c.isPreset)));
        } catch (_) {}
        renderPromoBroadcastUI();
      }
    }
    updateSyncBadgeState(silent ? 'IDLE' : 'SUCCESS');
    return true;
  } catch (err) {
    console.warn('[PMG Promo Google Cloud Pull]', err.message);
    if (!silent) updateSyncBadgeState('ERROR');
    return false;
  }
}

async function pushPromoBroadcastToGoogleCloud(silent = true) {
  if (!PMG_PROMO_CLOUD_URL) return false;
  try {
    const payload = buildPromoCloudPayload();
    const serialized = JSON.stringify(payload);
    let scheduleSlot = payload;

    if (serialized.length > 40000) {
      const uploadRes = await fetch(PMG_PROMO_CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'uploadApplicantDoc',
          appId: 'PMG_PROMO_KS01',
          doc: {
            field: 'promo_vault',
            name: 'promo_broadcast_master.json',
            type: 'application/json',
            data: serialized,
            size: serialized.length
          }
        }),
        redirect: 'follow'
      });
      const uploadJson = await uploadRes.json().catch(() => null);
      if (uploadJson && uploadJson.docId) {
        scheduleSlot = {
          version: '2.1',
          docId: uploadJson.docId,
          lastUpdated: payload.lastUpdated,
          updatedBy: payload.updatedBy,
          customCampaignCount: payload.customCampaigns.length
        };
      }
    }

    const res = await fetch(PMG_PROMO_CLOUD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        branch: PROMO_CLOUD_VAULT_KEY,
        schedule: scheduleSlot,
        updatedBy: payload.updatedBy
      }),
      redirect: 'follow'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    promoGoogleCloudSynced = true;
    updateSyncBadgeState(silent ? 'IDLE' : 'SUCCESS');
    return true;
  } catch (err) {
    console.warn('[PMG Promo Google Cloud Push]', err.message);
    if (!silent) updateSyncBadgeState('ERROR');
    return false;
  }
}

async function syncPromoBroadcastWithGoogleCloud(silent = false) {
  updateSyncBadgeState('SYNCING');
  const pulled = await pullPromoBroadcastFromGoogleCloud(true);
  const pushed = await pushPromoBroadcastToGoogleCloud(true);
  if (pulled || pushed) {
    updateSyncBadgeState('SUCCESS');
    if (!silent) {
      showPromoToast('✅ Cloud Sync Complete: Campaign progress synced with Google Cloud!');
    }
    setTimeout(() => updateSyncBadgeState('IDLE'), 3000);
    return true;
  }
  updateSyncBadgeState('ERROR');
  return false;
}
window.pushPromoBroadcastToGoogleCloud = pushPromoBroadcastToGoogleCloud;
window.pullPromoBroadcastFromGoogleCloud = pullPromoBroadcastFromGoogleCloud;
window.syncPromoBroadcastWithGoogleCloud = syncPromoBroadcastWithGoogleCloud;
window.syncPromoBroadcastWithCloud = syncPromoBroadcastWithGoogleCloud;

function updateSyncBadgeState(status = 'IDLE') {
  if (typeof document === 'undefined') return;
  const syncBtn = document.getElementById('promoCloudSyncBtn');
  const syncLabel = document.getElementById('promoCloudSyncLabel');
  if (!syncBtn || !syncLabel) return;

  const hasOneDrive = Boolean(window.pmgOneDriveSync && window.pmgOneDriveSync.rootHandle && window.pmgOneDriveSync.mode !== 'DISCONNECTED');

  if (status === 'SYNCING') {
    syncLabel.textContent = 'Syncing...';
    syncBtn.className = 'px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer animate-pulse';
  } else if (status === 'SUCCESS') {
    syncLabel.textContent = hasOneDrive ? 'Cloud + OneDrive ✅' : 'Google Cloud Synced ✅';
    syncBtn.className = 'px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer';
  } else if (status === 'ERROR') {
    syncLabel.textContent = 'Cloud Sync Retry';
    syncBtn.className = 'px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer';
  } else if (hasOneDrive) {
    syncLabel.textContent = promoGoogleCloudSynced ? 'Cloud + OneDrive' : 'OneDrive Synced';
    syncBtn.className = 'px-3 py-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer';
  } else {
    syncLabel.textContent = promoGoogleCloudSynced ? 'Google Cloud Synced' : 'Google Cloud Sync';
    syncBtn.className = 'px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer';
  }
}

async function checkOneDriveSyncStatusQuiet() {
  if (typeof window === 'undefined') return;
  updateSyncBadgeState('IDLE');
}

async function syncPromoBroadcastWithOneDrive() {
  updateSyncBadgeState('SYNCING');
  const googleSynced = await syncPromoBroadcastWithGoogleCloud(true);

  const hasOneDrive = Boolean(window.pmgOneDriveSync && window.pmgOneDriveSync.rootHandle && window.pmgOneDriveSync.mode !== 'DISCONNECTED');
  if (!hasOneDrive) {
    if (googleSynced) {
      updateSyncBadgeState('SUCCESS');
      showPromoToast('✅ Cloud Sync Complete: Campaign progress synced with Google Cloud!');
      setTimeout(() => updateSyncBadgeState('IDLE'), 3000);
    } else {
      updateSyncBadgeState('ERROR');
      showPromoToast('⚠️ Could not reach Google Cloud. Please check internet connection.');
    }
    return;
  }

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

    if (cloudData) {
      mergePromoCloudData(cloudData);
    }

    const payload = buildPromoCloudPayload();
    payload.lastUpdated = nowIso;

    const outFh = await dirHandle.getFileHandle('promo_broadcast_master.json', { create: true });
    const writable = await outFh.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();

    localStorage.setItem(STORAGE_PROMO_PROGRESS, JSON.stringify(promoProgressMap));
    await pushPromoBroadcastToGoogleCloud(true);
    renderPromoKpis();
    renderPromoCustomerTable();
    updateSyncBadgeState('SUCCESS');
    showPromoToast('✅ Cloud Sync Complete: Campaign progress synced across Google Cloud & OneDrive!');
    setTimeout(() => updateSyncBadgeState('IDLE'), 3000);
  } catch (err) {
    console.error('[PMG Promo Sync]', err);
    updateSyncBadgeState(googleSynced ? 'SUCCESS' : 'ERROR');
    showPromoToast(googleSynced ? '✅ Synced with Google Cloud (OneDrive skipped).' : ('Sync error: ' + err.message));
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
          if (c && c.id && !isPresetCampaignId(c.id)) {
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

// ─── PHASE 4: GOOGLE FLOW (@me AVATAR) VIDEO STUDIO & MINI MEMBER DAY ROI ────
const GOOGLE_FLOW_STUDIO_URL = 'https://flow.google.com/';
const PROMO_GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

function buildGoogleFlowAvatarPromptPack(opts = {}) {
  const hqScript = String(opts.hqScript || '').trim();
  const language = opts.language || 'Malaysian English';
  const clipCount = Math.max(3, Math.min(4, Number(opts.clipCount) || 3));
  const tone = opts.tone || 'Friendly Community Pharmacist';
  const productName = String(opts.productName || (typeof promoActiveCampaign !== 'undefined' && promoActiveCampaign?.productName) || 'PMG Pharmacy Featured Health Topic').trim();

  // Split HQ script into natural beats (preserving core story without robotic verbatim reading)
  const rawSentences = hqScript
    ? hqScript.split(/(?<=[。！？])|(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean)
    : [
        `Have you ever wondered how to get the best value from ${productName}?`,
        `At PMG Pharmacy Kota Sentosa, our pharmacist team recommends choosing clinically proven daily support that fits your routine.`,
        `Drop by PMG Pharmacy Kota Sentosa today for a free consultation, free blood glucose check, and download the Public Medicare App for member rewards!`
      ];

  const beats = [];
  const chunkSize = Math.max(1, Math.ceil(rawSentences.length / clipCount));
  for (let i = 0; i < clipCount; i++) {
    const slice = rawSentences.slice(i * chunkSize, (i + 1) * chunkSize).join(' ').trim();
    if (slice) beats.push(slice);
  }
  while (beats.length < clipCount) {
    beats.push(`Visit PMG Pharmacy Kota Sentosa today and download the Public Medicare App for exclusive member rewards and free blood glucose screening!`);
  }

  const shotFramings = [
    'Medium close-up at eye level, energetic warm smile, gentle hand gesture welcoming viewer',
    'Medium shot standing beside bright organized pharmacy supplement gondola, natural conversational posture',
    'Slightly tighter medium close-up, confident reassuring pharmacist tone, holding subtle focus gesture',
    'Warm closing medium shot at pharmacy consultation counter, inviting hand gesture toward camera'
  ];

  const clips = beats.map((line, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    const framing = shotFramings[idx % shotFramings.length];
    return `CLIP ${num} (8s, 9:16 vertical): @me wearing a crisp white PMG community pharmacist coat with official lanyard over neat smart-casual attire, inside a bright, modern, clean community pharmacy (soft natural daylight, shallow depth of field, 1 person only, direct eye contact with camera). ${framing}. Spoken in natural ${language} (${tone} tone, no ad-libbing, clear lip-sync): "${line}"`;
  });

  const masterAgentPrompt = [
    `Create a ${clipCount}-clip 9:16 vertical TikTok/Reels pharmacist video series featuring @me as the consistent on-camera community pharmacist presenter.`,
    `LOCKED CONTINUITY RULES:`,
    `- Character: @me (exact face & voice likeness), wearing a crisp white pharmacist coat + lanyard in every clip.`,
    `- Setting: Bright, tidy modern Malaysian community pharmacy (PMG Pharmacy Kota Sentosa style), consistent warm daylight lighting.`,
    `- Style: Authentic ${tone}, natural Malaysian ${language} delivery, direct eye contact, NO ad-libbing outside the exact quoted lines.`,
    ``,
    `GENERATE THESE ${clipCount} SEQUENTIAL CLIPS IN ORDER:`,
    ...clips
  ].join('\n');

  const captions = {
    tiktok: `💊 Pharmacist Tip from PMG Pharmacy Kota Sentosa! ${productName}\n\nDrop by 7th Mile Kota Sentosa for a FREE Blood Glucose Check & personalized pharmacist advice! 🩺✨\n📲 Earn member points on Public Medicare App (iOS & Android)\n#PMGPharmacy #KotaSentosa #KuchingPharmacist #SarawakHealth #CommunityPharmacist #PharmacistTips`,
    xhs: `【古晋7哩 PMG药剂师干货分享】💊 ${productName}\n\n不用再盲目乱买！欢迎来 PMG Pharmacy Kota Sentosa 找我们的药剂师免费咨询，顺便享受【免费血糖检测】🩸\n📱 记得下载 Public Medicare App 累积积分与专属优惠券！\n#古晋药剂行 #KotaSentosa #PMGPharmacy #砂拉越生活 #药剂师推荐 #健康科普`,
    fbig: `🩺 Community Pharmacist Advice — PMG Pharmacy Kota Sentosa (7th Mile)\n\n${beats[0]}\n\nVisit us in-store for a complimentary Blood Glucose Check & download the Public Medicare App to earn points & vouchers!\n#PMGPharmacyKotaSentosa #Kuching #HealthTips #PublicMedicare`
  };

  return { masterAgentPrompt, clips, captions, language, clipCount, tone };
}

async function generateAiGoogleFlowVideoPack() {
  const hqScript = document.getElementById('flowHqScriptInput')?.value.trim() || '';
  const language = document.getElementById('flowLangSelect')?.value || 'Malaysian English';
  const clipCount = Number(document.getElementById('flowClipCountSelect')?.value || 3);
  const tone = document.getElementById('flowToneSelect')?.value || 'Friendly Community Pharmacist';
  const statusEl = document.getElementById('flowAiStatus');

  if (!hqScript) {
    showPromoToast('Paste HQ script or key talking points first!');
    return;
  }

  const apiKey = (typeof window.getGlobalGeminiKey === 'function' ? window.getGlobalGeminiKey() : '') ||
    (typeof localStorage !== 'undefined' ? (localStorage.getItem('pmg_gemini_key') || '') : '');

  // Always build deterministic fallback first so UI responds immediately even without Gemini key
  if (!apiKey) {
    const pack = buildGoogleFlowAvatarPromptPack({ hqScript, language, clipCount, tone });
    renderGoogleFlowOutputPack(pack);
    if (statusEl) statusEl.textContent = '✅ Generated Google Flow (@me) pack (instant mode — add Gemini API key in Hub for AI story rewriting).';
    return;
  }

  if (statusEl) statusEl.textContent = '✨ Adapting HQ story naturally with Gemini 3.5 Flash-Lite...';
  const prompt = `You are a friendly Malaysian community pharmacist (PMG Pharmacy Kota Sentosa, Kuching) creating a short ${clipCount * 8}-second vertical TikTok/Reels video.
Rewrite the HQ script below into EXACTLY ${clipCount} natural, spoken-word beats (15–22 words per beat so each fits an 8-second Google Flow @me avatar clip).
RULES:
1. Keep 100% of the core medical/product story accurate — DO NOT copy stiff corporate phrasing verbatim.
2. Language: ${language}. Tone: ${tone}.
3. End Beat ${clipCount} with a warm CTA to visit PMG Pharmacy Kota Sentosa or download Public Medicare App.
4. Return ONLY a JSON array of ${clipCount} strings (no markdown fences).

HQ SCRIPT:
${hqScript}`;

  for (const model of PROMO_GEMINI_MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, responseMimeType: 'application/json' }
        })
      });
      if (!res.ok) continue;
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        const pack = buildGoogleFlowAvatarPromptPack({
          hqScript: parsed.join('\n'),
          language,
          clipCount: parsed.length,
          tone
        });
        renderGoogleFlowOutputPack(pack);
        if (statusEl) statusEl.textContent = `✅ Story adapted naturally via ${model} — ready for Google Flow (@me)!`;
        return;
      }
    } catch (_) {}
  }

  // Fallback if API unreachable
  const fallbackPack = buildGoogleFlowAvatarPromptPack({ hqScript, language, clipCount, tone });
  renderGoogleFlowOutputPack(fallbackPack);
  if (statusEl) statusEl.textContent = '✅ Generated Google Flow (@me) pack using local story splitter.';
}

function renderGoogleFlowOutputPack(pack) {
  const masterEl = document.getElementById('flowMasterPromptOutput');
  const captionsEl = document.getElementById('flowCaptionsOutput');
  const outputWrap = document.getElementById('flowOutputContainer');
  if (masterEl) masterEl.value = pack.masterAgentPrompt;
  if (captionsEl) {
    captionsEl.value = `=== TIKTOK ===\n${pack.captions.tiktok}\n\n=== XIAOHONGSHU (XHS) ===\n${pack.captions.xhs}\n\n=== FB / IG REELS ===\n${pack.captions.fbig}`;
  }
  if (outputWrap) outputWrap.classList.remove('hidden');
}

async function copyMasterPromptAndOpenGoogleFlow() {
  const masterEl = document.getElementById('flowMasterPromptOutput');
  const text = masterEl ? masterEl.value.trim() : '';
  if (!text) {
    showPromoToast('Generate your Google Flow (@me) prompt first!');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showPromoToast('✅ Master @me Prompt copied! Paste into Google Flow Agent Mode.');
  } catch (_) {}
  window.open(GOOGLE_FLOW_STUDIO_URL, '_blank', 'noopener,noreferrer');
}

function calculateMiniMemberDayRoi(budgetRm, salesRm) {
  const b = Math.max(0, Number(budgetRm) || 0);
  const s = Math.max(0, Number(salesRm) || 0);
  const roi = b > 0 ? +(s / b).toFixed(2) : 0;
  const minSalesForExcellent = +(b * 2.50).toFixed(2);
  const gapRm = +(Math.max(0, minSalesForExcellent - s)).toFixed(2);
  return { budgetRm: b, salesRm: s, roi, minSalesForExcellent, gapRm, isExcellent: roi >= 2.50 };
}

function updateMiniMemberDayRoiUi(persistToVault = true) {
  const b = document.getElementById('mmdBudgetInput')?.value;
  const s = document.getElementById('mmdSalesInput')?.value;
  const out = document.getElementById('mmdRoiResultBox');
  if (!out) return;
  const r = calculateMiniMemberDayRoi(b, s);
  if (persistToVault && window.PmgFy2027Kpi && r.budgetRm > 0 && r.salesRm > 0) {
    window.PmgFy2027Kpi.saveFy2027VaultLocal({ miniMemberDayRoi: r.roi });
  }
  out.innerHTML = r.budgetRm > 0
    ? `<div class="flex flex-wrap items-center justify-between gap-2 text-xs">
         <span>Target Sales for <strong>2.50× Excellent ROI</strong>: <strong class="text-emerald-700">RM ${r.minSalesForExcellent.toLocaleString()}</strong></span>
         <span class="px-2 py-0.5 rounded-full font-black ${r.isExcellent ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">Current ROI: ${r.roi.toFixed(2)}× ${r.isExcellent ? '✅ Excellent (+5% Bonus)' : `(Need +RM ${r.gapRm.toLocaleString()})`}</span>
       </div>`
    : `<div class="text-xs text-slate-500">Enter your Mini Member Day promo budget to auto-calculate the exact sales needed for <strong>ROI ≥ 2.50× (+5% Bonus)</strong>.</div>`;
}

function loadVipMiniMemberDayTemplateIntoComposer() {
  const defs = (typeof window !== 'undefined' && window.FY2027_BRANCH_DEFAULTS) || {};
  const iosUrl = defs.medicareAppIosUrl || 'https://apps.apple.com/my/app/public-medicare/id6761357301';
  const andUrl = defs.medicareAppAndroidUrl || 'https://play.google.com/store/apps/details?id=com.pmg.publicmedicare';
  const prod = promoActiveCampaign?.productName || 'PMG Exclusive Member Day Bundles';
  promoComposerState.offerDetailsEn = `VIP Early-Bird Mini Member Day Pre-Order for ${prod}! Reserve your high-value bundle early to enjoy member gifts, FREE Blood Glucose Check & double rewards on Public Medicare App (iOS: ${iosUrl} | Android: ${andUrl})`;
  promoComposerState.offerDetailsBm = `Tempahan Awal VIP Mini Member Day untuk ${prod}! Tempah awal untuk hadiah ahli, Saringan Glukosa PERCUMA & ganjaran berganda di Public Medicare App (iOS: ${iosUrl} | Android: ${andUrl})`;
  promoComposerState.offerDetailsZh = `VIP 会员日抢先预订特惠【${prod}】！提前预订锁定超值组合与会员赠品，到店更享【免费血糖检测】及 Public Medicare App 双倍积分奖励（iOS: ${iosUrl} | Android: ${andUrl}）`;
  savePromoComposerState();
  renderPromoComposer();
  showPromoToast('⚡ VIP Mini Member Day Pre-Order template loaded into WhatsApp Composer!');
}

function renderPromoFy2027GrowthStudio() {
  const host = document.getElementById('promoFy2027GrowthStudio');
  if (!host) return;
  if (host.dataset.rendered === '1') return; // preserve user-typed script/budget while toggling campaign table
  host.dataset.rendered = '1';

  const vipCount = (promoActiveCampaign?.customers || []).filter(c => (Number(c.totalQty) || 0) >= 2 || (Number(c.totalSpent) || 0) >= 200).length;

  host.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- 1. Google Flow (@me Avatar) Automated Video Studio -->
      <div class="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden">
        <div class="px-5 py-3.5 bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 text-white flex items-center justify-between gap-2">
          <div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-400/20 text-purple-200 border border-purple-300/30">KPI #10 • Pharmacist On-Camera (≥4/mo)</span>
            <h3 class="text-sm font-black mt-1">🎬 Google Flow (<code>@me</code> Avatar) Automated Video Studio</h3>
          </div>
          <a href="${GOOGLE_FLOW_STUDIO_URL}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition whitespace-nowrap">
            Open Flow ↗
          </a>
        </div>
        <div class="p-4 space-y-3 text-xs">
          <p class="text-slate-600">Paste HQ's raw script or talking points below. Gemini adapts the story naturally (no robotic reading) and generates a <strong>1-click Google Flow Agent Master Prompt using your <code>@me</code> avatar</strong> + 9:16 TikTok/XHS/FB captions.</p>
          <textarea id="flowHqScriptInput" rows="3" placeholder="Paste HQ monthly video script, bullet points, or promo highlights here..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-400 outline-none"></textarea>
          <div class="grid grid-cols-3 gap-2">
            <select id="flowLangSelect" class="px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white">
              <option value="Malaysian English">Malaysian English</option>
              <option value="Mandarin (中文)">Mandarin (中文)</option>
              <option value="Bahasa Melayu">Bahasa Melayu</option>
              <option value="Bilingual English + Mandarin">Bilingual EN + 中文</option>
            </select>
            <select id="flowClipCountSelect" class="px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white">
              <option value="3">~24–30s (3 Clips)</option>
              <option value="4">~32–40s (4 Clips)</option>
            </select>
            <select id="flowToneSelect" class="px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white">
              <option value="Friendly Community Pharmacist">Friendly Pharmacist</option>
              <option value="Engaging Health Myth-Buster">Myth-Buster Hook</option>
              <option value="Clear Promo Deal Explainer">Promo Explainer</option>
            </select>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" onclick="generateAiGoogleFlowVideoPack()" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition cursor-pointer">
              ✨ Adapt Story &amp; Build @me Flow Prompt
            </button>
            <button type="button" onclick="copyMasterPromptAndOpenGoogleFlow()" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer">
              🚀 Copy Master Prompt &amp; Open Google Flow
            </button>
          </div>
          <div id="flowAiStatus" class="text-[11px] font-semibold text-indigo-700"></div>
          <div id="flowOutputContainer" class="hidden space-y-2 pt-1">
            <label class="block text-[11px] font-extrabold text-slate-700">🤖 Google Flow Agent Master Prompt (Paste into flow.google.com Agent Mode):</label>
            <textarea id="flowMasterPromptOutput" rows="5" readonly class="w-full px-3 py-2 rounded-xl bg-slate-950 text-emerald-200 font-mono text-[11px] border border-slate-800"></textarea>
            <label class="block text-[11px] font-extrabold text-slate-700">📝 Ready-to-Post Captions (TikTok / XHS / FB &amp; IG):</label>
            <textarea id="flowCaptionsOutput" rows="4" readonly class="w-full px-3 py-2 rounded-xl bg-slate-50 text-slate-800 text-[11px] border border-slate-200"></textarea>
          </div>
        </div>
      </div>

      <!-- 2. Mini Member Day 2.50x ROI Planner & VIP Pre-Order Engine -->
      <div class="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden flex flex-col justify-between">
        <div>
          <div class="px-5 py-3.5 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">KPI #19 • +5.0% Bonus (ROI ≥ 2.50×)</span>
            <h3 class="text-sm font-black mt-1">🎯 Mini Member Day 2.50× ROI &amp; VIP Pre-Order Engine</h3>
          </div>
          <div class="p-4 space-y-3 text-xs">
            <p class="text-slate-600">Lock in high-margin VIP pre-orders <em>before</em> Member Day starts so you guarantee <strong>ROI ≥ 2.50×</strong> (+5% total branch bonus).</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Event Promo Budget (RM)</label>
                <input id="mmdBudgetInput" type="number" min="0" value="1000" oninput="updateMiniMemberDayRoiUi(true)" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Projected / Actual Sales (RM)</label>
                <input id="mmdSalesInput" type="number" min="0" value="2500" oninput="updateMiniMemberDayRoiUi(true)" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold">
              </div>
            </div>
            <div id="mmdRoiResultBox" class="p-3 rounded-xl bg-emerald-50 border border-emerald-200"></div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="font-extrabold text-slate-900">👑 Detected Repeat VIP Buyers in Active List: <span class="text-emerald-700">${vipCount} VIPs</span></div>
                <div class="text-[11px] text-slate-500">Auto-loads tri-lingual VIP Pre-Order invite with Public Medicare iOS &amp; Android links into Composer above.</div>
              </div>
              <button type="button" onclick="loadVipMiniMemberDayTemplateIntoComposer()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition cursor-pointer">
                ⚡ Load VIP Pre-Order Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  updateMiniMemberDayRoiUi(false);
}

// ─── EXPOSE GLOBALS FOR WINDOW & TESTS ─────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.NUTRI_ALPHA_PRESET_CAMPAIGN = NUTRI_ALPHA_PRESET_CAMPAIGN;
  window.SHEEP_PLACENTA_PRESET_CAMPAIGN = SHEEP_PLACENTA_PRESET_CAMPAIGN;
  window.FLEXSURE_GOLD_PRESET_CAMPAIGN = FLEXSURE_GOLD_PRESET_CAMPAIGN;
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
  window.getPosterForLanguage = getPosterForLanguage;
  window.buildGoogleFlowAvatarPromptPack = buildGoogleFlowAvatarPromptPack;
  window.generateAiGoogleFlowVideoPack = generateAiGoogleFlowVideoPack;
  window.copyMasterPromptAndOpenGoogleFlow = copyMasterPromptAndOpenGoogleFlow;
  window.calculateMiniMemberDayRoi = calculateMiniMemberDayRoi;
  window.updateMiniMemberDayRoiUi = updateMiniMemberDayRoiUi;
  window.loadVipMiniMemberDayTemplateIntoComposer = loadVipMiniMemberDayTemplateIntoComposer;
  window.renderPromoFy2027GrowthStudio = renderPromoFy2027GrowthStudio;
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
