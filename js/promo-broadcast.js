// js/promo-broadcast.js — Module 8: Customer Special Offer & WhatsApp Broadcaster
// Enables 1-click personalized WhatsApp promotional broadcasts in Bahasa Malaysia, Mandarin & Custom text
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
  customers: [{"id":"CUST_1","name":"LAI JON SEN","phone":"601121093229","totalQty":9,"totalSpent":1145,"lastDate":"30-08-26 0:00","firstDate":"28-01-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI","LOLITA WONG LIN","JONG PEI CHOO","Muhammad Nur Farizin Bin Abdullah","KENIX LING WANG YING"],"history":[{"date":"28-01-26 0:00","qty":1,"price":115,"sp":"NURHAFIZAH BINTI PAULI"},{"date":"20-02-26 0:00","qty":1,"price":115,"sp":"LOLITA WONG LIN"},{"date":"14-04-26 0:00","qty":1,"price":115,"sp":"NURHAFIZAH BINTI PAULI"},{"date":"30-04-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"},{"date":"17-05-26 0:00","qty":1,"price":115,"sp":"NURHAFIZAH BINTI PAULI"},{"date":"24-06-26 0:00","qty":1,"price":115,"sp":"Muhammad Nur Farizin Bin Abdullah"},{"date":"12-07-26 0:00","qty":1,"price":115,"sp":"LOLITA WONG LIN"},{"date":"30-07-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"},{"date":"30-08-26 0:00","qty":1,"price":225,"sp":"KENIX LING WANG YING"}]},{"id":"CUST_2","name":"RADIN MOHD NOR ABD QUDDUS BIN RADIN KADRI","phone":"60192111965","totalQty":1,"totalSpent":115,"lastDate":"30-01-26 0:00","firstDate":"30-01-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"30-01-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_3","name":"EDMUND BANYOI ANAK GADAH","phone":"60198692892","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"31-01-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_4","name":"NG CHUN BEE","phone":"60168597418","totalQty":2,"totalSpent":450,"lastDate":"10-06-26 0:00","firstDate":"31-01-26 0:00","salespersons":["LOLITA WONG LIN","CHAI YEE SIAN"],"history":[{"date":"31-01-26 0:00","qty":1,"price":225,"sp":"LOLITA WONG LIN"},{"date":"10-06-26 0:00","qty":1,"price":225,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_5","name":"OLIVIA ANAK TARANG","phone":"60138459331","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"31-01-26 0:00","qty":1,"price":115,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_6","name":"JONATHAN JANA ANAK ANGAT","phone":"60199008678","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"31-01-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_7","name":"AZZY BINTI HASBI","phone":"60199915015","totalQty":1,"totalSpent":115,"lastDate":"31-01-26 0:00","firstDate":"31-01-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"31-01-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_8","name":"CHELSEA COHEN ANAK JOHNESS","phone":"60172707616","totalQty":1,"totalSpent":115,"lastDate":"14-02-26 0:00","firstDate":"14-02-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"14-02-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_9","name":"TIONG TECK ONG","phone":"60168958065","totalQty":1,"totalSpent":115,"lastDate":"15-02-26 0:00","firstDate":"15-02-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"15-02-26 0:00","qty":1,"price":115,"sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"CUST_10","name":"MONICA PHILIP ANGKOK","phone":"60128567492","totalQty":1,"totalSpent":225,"lastDate":"16-02-26 0:00","firstDate":"16-02-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"16-02-26 0:00","qty":1,"price":225,"sp":"JONG PEI CHOO"}]},{"id":"CUST_11","name":"ANGELIA MYRA BINTI JIMMY","phone":"601131997165","totalQty":1,"totalSpent":225,"lastDate":"18-02-26 0:00","firstDate":"18-02-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"18-02-26 0:00","qty":1,"price":225,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_12","name":"NOR SAFRINA BINTI SEPUNI","phone":"60169338307","totalQty":1,"totalSpent":115,"lastDate":"18-02-26 0:00","firstDate":"18-02-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-02-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_13","name":"TOMMY ANAK JION","phone":"60136146261","totalQty":2,"totalSpent":230,"lastDate":"12-03-26 0:00","firstDate":"20-02-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","CHAI YEE SIAN"],"history":[{"date":"20-02-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"},{"date":"12-03-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_14","name":"TAY MOI TZE","phone":"60138166338","totalQty":1,"totalSpent":115,"lastDate":"26-02-26 0:00","firstDate":"26-02-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"26-02-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_15","name":"JULIE WONG PEK SIONG","phone":"60124423108","totalQty":1,"totalSpent":115,"lastDate":"28-02-26 0:00","firstDate":"28-02-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"28-02-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_16","name":"YEO KOK SENG","phone":"60198880882","totalQty":5,"totalSpent":795,"lastDate":"10-06-26 0:00","firstDate":"10-03-26 0:00","salespersons":["CHAI YEE SIAN","JONG PEI CHOO","LOLITA WONG LIN"],"history":[{"date":"10-03-26 0:00","qty":1,"price":225,"sp":"CHAI YEE SIAN"},{"date":"17-05-26 0:00","qty":1,"price":225,"sp":"JONG PEI CHOO"},{"date":"10-06-26 0:00","qty":1,"price":115,"sp":"LOLITA WONG LIN"},{"date":"10-06-26 0:00","qty":2,"price":115,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_17","name":"LAI JIUNG HIAN","phone":"60107756556","totalQty":2,"totalSpent":230,"lastDate":"21-10-26 0:00","firstDate":"10-03-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"10-03-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"},{"date":"21-10-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_18","name":"LEE KUOK CHING","phone":"60168986300","totalQty":1,"totalSpent":225,"lastDate":"11-03-26 0:00","firstDate":"11-03-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"11-03-26 0:00","qty":1,"price":225,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_19","name":"HO CHOU FANG","phone":"60122809029","totalQty":3,"totalSpent":675,"lastDate":"24-06-26 0:00","firstDate":"12-03-26 0:00","salespersons":["CHAI YEE SIAN","HANIESHA LOUNA ANAK DAGENG","JONG PEI CHOO"],"history":[{"date":"12-03-26 0:00","qty":1,"price":225,"sp":"CHAI YEE SIAN"},{"date":"12-04-26 0:00","qty":1,"price":225,"sp":"HANIESHA LOUNA ANAK DAGENG"},{"date":"24-06-26 0:00","qty":1,"price":225,"sp":"JONG PEI CHOO"}]},{"id":"CUST_20","name":"TING YUNG HUA","phone":"601110668658","totalQty":1,"totalSpent":225,"lastDate":"13-03-26 0:00","firstDate":"13-03-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"13-03-26 0:00","qty":1,"price":225,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_21","name":"TIEW YIEN YIEN","phone":"60168870506","totalQty":1,"totalSpent":225,"lastDate":"13-03-26 0:00","firstDate":"13-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"13-03-26 0:00","qty":1,"price":225,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_22","name":"MUHAMAD BIN ZULKIPLI","phone":"60138176441","totalQty":1,"totalSpent":115,"lastDate":"15-03-26 0:00","firstDate":"15-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"15-03-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_23","name":"CHIA NYAT LIAN","phone":"60168513478","totalQty":1,"totalSpent":225,"lastDate":"15-03-26 0:00","firstDate":"15-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"15-03-26 0:00","qty":1,"price":225,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_24","name":"ABANG ISNAINI GAPOR","phone":"601121888813","totalQty":3,"totalSpent":345,"lastDate":"10-10-26 0:00","firstDate":"16-03-26 0:00","salespersons":["LAI PEY SHYAN","KENIX LING WANG YING","FIONA FIENA ANAK JAMES"],"history":[{"date":"16-03-26 0:00","qty":1,"price":115,"sp":"LAI PEY SHYAN"},{"date":"30-06-26 0:00","qty":1,"price":115,"sp":"KENIX LING WANG YING"},{"date":"10-10-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_25","name":"SIGAN ANAK INDAH","phone":"60198158151","totalQty":1,"totalSpent":225,"lastDate":"16-03-26 0:00","firstDate":"16-03-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"16-03-26 0:00","qty":1,"price":225,"sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"CUST_26","name":"TING SING YIUNG","phone":"60135789228","totalQty":1,"totalSpent":115,"lastDate":"17-03-26 0:00","firstDate":"17-03-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"17-03-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_27","name":"MOHAMAD SEZIKI BIN RABIAN","phone":"60146769843","totalQty":2,"totalSpent":230,"lastDate":"30-09-26 0:00","firstDate":"18-03-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","NURHAFIZAH BINTI PAULI"],"history":[{"date":"18-03-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"},{"date":"30-09-26 0:00","qty":1,"price":115,"sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"CUST_28","name":"LEE SUK JOO","phone":"60138259188","totalQty":1,"totalSpent":225,"lastDate":"18-03-26 0:00","firstDate":"18-03-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"18-03-26 0:00","qty":1,"price":225,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_29","name":"LIM ENG HUI","phone":"60146919831","totalQty":3,"totalSpent":675,"lastDate":"20-07-26 0:00","firstDate":"20-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","JONG PEI CHOO"],"history":[{"date":"20-03-26 0:00","qty":2,"price":225,"sp":"HANIESHA LOUNA ANAK DAGENG"},{"date":"20-07-26 0:00","qty":1,"price":225,"sp":"JONG PEI CHOO"}]},{"id":"CUST_30","name":"MICK ANAK SEMBONG","phone":"601112035053","totalQty":1,"totalSpent":115,"lastDate":"20-03-26 0:00","firstDate":"20-03-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"20-03-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_31","name":"CHONG NYUK NGO","phone":"60165795448","totalQty":4,"totalSpent":570,"lastDate":"23-09-26 0:00","firstDate":"20-03-26 0:00","salespersons":["LOLITA WONG LIN","CHAI YEE SIAN"],"history":[{"date":"20-03-26 0:00","qty":1,"price":225,"sp":"LOLITA WONG LIN"},{"date":"23-09-26 0:00","qty":2,"price":115,"sp":"CHAI YEE SIAN"},{"date":"23-09-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_32","name":"DABBIE ANAK ANDIN","phone":"60128527715","totalQty":1,"totalSpent":225,"lastDate":"21-03-26 0:00","firstDate":"21-03-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"21-03-26 0:00","qty":1,"price":225,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_33","name":"BONG KUI NYUK","phone":"60178513829","totalQty":1,"totalSpent":115,"lastDate":"23-03-26 0:00","firstDate":"23-03-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"23-03-26 0:00","qty":1,"price":115,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_34","name":"UNAI ANAK CHUNGAT","phone":"60138164594","totalQty":1,"totalSpent":115,"lastDate":"24-03-26 0:00","firstDate":"24-03-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"24-03-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_35","name":"CHAI NYUK FAH","phone":"60138133363","totalQty":2,"totalSpent":230,"lastDate":"24-08-26 0:00","firstDate":"26-03-26 0:00","salespersons":["JONG PEI CHOO","Daniela Janet Anak Mustapha"],"history":[{"date":"26-03-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"},{"date":"24-08-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_36","name":"LIKIN  ANAK JAGA","phone":"60198271486","totalQty":2,"totalSpent":340,"lastDate":"28-04-26 0:00","firstDate":"27-03-26 0:00","salespersons":["JONG PEI CHOO","NURHAFIZAH BINTI PAULI"],"history":[{"date":"27-03-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"},{"date":"28-04-26 0:00","qty":1,"price":225,"sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"CUST_37","name":"LIAW KIM SIONG","phone":"60138126168","totalQty":1,"totalSpent":115,"lastDate":"27-03-26 0:00","firstDate":"27-03-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"27-03-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_38","name":"TIONG MING","phone":"60198168181","totalQty":1,"totalSpent":655,"lastDate":"28-03-26 0:00","firstDate":"28-03-26 0:00","salespersons":["LAI PEY SHYAN"],"history":[{"date":"28-03-26 0:00","qty":1,"price":655,"sp":"LAI PEY SHYAN"}]},{"id":"CUST_39","name":"LEE TING BIU","phone":"60198776739","totalQty":1,"totalSpent":115,"lastDate":"28-03-26 0:00","firstDate":"28-03-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"28-03-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_40","name":"PIROS ANAK RINIP","phone":"60198878991","totalQty":4,"totalSpent":460,"lastDate":"18-09-26 0:00","firstDate":"28-03-26 0:00","salespersons":["CHAI YEE SIAN","FIONA FIENA ANAK JAMES","JONG PEI CHOO","NURHAFIZAH BINTI PAULI"],"history":[{"date":"28-03-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"},{"date":"23-06-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"},{"date":"20-08-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"},{"date":"18-09-26 0:00","qty":1,"price":115,"sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"CUST_41","name":"PHANG SEN","phone":"60198844594","totalQty":1,"totalSpent":115,"lastDate":"11-04-26 0:00","firstDate":"11-04-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"11-04-26 0:00","qty":1,"price":115,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_42","name":"CHOO CHENG SIANG","phone":"60198360379","totalQty":1,"totalSpent":115,"lastDate":"11-04-26 0:00","firstDate":"11-04-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"11-04-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_43","name":"LO NYET JIN","phone":"60165762536","totalQty":1,"totalSpent":225,"lastDate":"12-04-26 0:00","firstDate":"12-04-26 0:00","salespersons":["Connie Voon Zhi Yin"],"history":[{"date":"12-04-26 0:00","qty":1,"price":225,"sp":"Connie Voon Zhi Yin"}]},{"id":"CUST_44","name":"HO NYUK LI","phone":"60168445119","totalQty":2,"totalSpent":230,"lastDate":"18-07-26 0:00","firstDate":"13-04-26 0:00","salespersons":["Connie Voon Zhi Yin","Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"13-04-26 0:00","qty":1,"price":115,"sp":"Connie Voon Zhi Yin"},{"date":"18-07-26 0:00","qty":1,"price":115,"sp":"Muhammad Nur Farizin Bin Abdullah"}]},{"id":"CUST_45","name":"YUSUF BIN AWI","phone":"60178113871","totalQty":1,"totalSpent":115,"lastDate":"16-04-26 0:00","firstDate":"16-04-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"16-04-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_46","name":"TAY LIP CHORNG","phone":"601125040518","totalQty":2,"totalSpent":230,"lastDate":"10-07-26 0:00","firstDate":"16-04-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"16-04-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"},{"date":"10-07-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_47","name":"MOHAMAD HAFEAZAL","phone":"60198522962","totalQty":1,"totalSpent":115,"lastDate":"18-04-26 0:00","firstDate":"18-04-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-04-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_48","name":"HON KAH KANG","phone":"60109720718","totalQty":1,"totalSpent":115,"lastDate":"21-04-26 0:00","firstDate":"21-04-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"21-04-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_49","name":"LAW HUA LIANG","phone":"60198764018","totalQty":1,"totalSpent":115,"lastDate":"21-04-26 0:00","firstDate":"21-04-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"21-04-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_50","name":"NORLELA BINTI RAZALI","phone":"601135937008","totalQty":4,"totalSpent":460,"lastDate":"26-09-26 0:00","firstDate":"21-04-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","JONG PEI CHOO"],"history":[{"date":"21-04-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"},{"date":"13-05-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"},{"date":"27-07-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"},{"date":"26-09-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_51","name":"JOSEPHINE ANAK RIANG","phone":"60178536431","totalQty":2,"totalSpent":230,"lastDate":"30-05-26 0:00","firstDate":"24-04-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"24-04-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"},{"date":"30-05-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_52","name":"SATINA ANAK BERINAU","phone":"60138275056","totalQty":1,"totalSpent":115,"lastDate":"24-04-26 0:00","firstDate":"24-04-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"24-04-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_53","name":"MOK YONG YU","phone":"60193133159","totalQty":1,"totalSpent":115,"lastDate":"30-04-26 0:00","firstDate":"30-04-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"30-04-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_54","name":"LIEW JANG FOONG","phone":"60194678802","totalQty":1,"totalSpent":225,"lastDate":"30-04-26 0:00","firstDate":"30-04-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"30-04-26 0:00","qty":1,"price":225,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_55","name":"LIEW JOON TAK","phone":"60194594509","totalQty":1,"totalSpent":115,"lastDate":"10-05-26 0:00","firstDate":"10-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"10-05-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_56","name":"RADZIAH BINTI TINDI","phone":"60165079610","totalQty":1,"totalSpent":115,"lastDate":"11-05-26 0:00","firstDate":"11-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"11-05-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_57","name":"TAJUL AKBAR","phone":"60138341944","totalQty":1,"totalSpent":115,"lastDate":"11-05-26 0:00","firstDate":"11-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"11-05-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_58","name":"HO AH NYAIN","phone":"60168797658","totalQty":1,"totalSpent":115,"lastDate":"11-05-26 0:00","firstDate":"11-05-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"11-05-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_59","name":"WEI CHUI PING","phone":"60198890178","totalQty":1,"totalSpent":225,"lastDate":"13-05-26 0:00","firstDate":"13-05-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"13-05-26 0:00","qty":1,"price":225,"sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"CUST_60","name":"NIGEL YEO SEE KEE","phone":"601116652510","totalQty":1,"totalSpent":225,"lastDate":"18-05-26 0:00","firstDate":"18-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-05-26 0:00","qty":1,"price":225,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_61","name":"MORIE ANAK DUNGGAU","phone":"60143685474","totalQty":1,"totalSpent":115,"lastDate":"18-05-26 0:00","firstDate":"18-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"18-05-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_62","name":"CHANG LEE CHIN","phone":"60128807008","totalQty":1,"totalSpent":115,"lastDate":"18-05-26 0:00","firstDate":"18-05-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"18-05-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_63","name":"HILDA FLORA ANAK RINAH","phone":"60198769074","totalQty":1,"totalSpent":225,"lastDate":"20-05-26 0:00","firstDate":"20-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"20-05-26 0:00","qty":1,"price":225,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_64","name":"UH LEE LEE","phone":"60168970302","totalQty":1,"totalSpent":115,"lastDate":"20-05-26 0:00","firstDate":"20-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"20-05-26 0:00","qty":1,"price":115,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_65","name":"LIN SHER LI","phone":"60176781558","totalQty":1,"totalSpent":115,"lastDate":"21-05-26 0:00","firstDate":"21-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"21-05-26 0:00","qty":1,"price":115,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_66","name":"HASNAN BIN HASSAN","phone":"60198287300","totalQty":1,"totalSpent":115,"lastDate":"22-05-26 0:00","firstDate":"22-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"22-05-26 0:00","qty":1,"price":115,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_67","name":"MISNA ANAK GUMBEK","phone":"60198875294","totalQty":6,"totalSpent":1130,"lastDate":"18-09-26 0:00","firstDate":"24-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","Daniela Janet Anak Mustapha","JONG PEI CHOO","NURHAFIZAH BINTI PAULI","Ting Kwang Yu"],"history":[{"date":"24-05-26 0:00","qty":1,"price":225,"sp":"FIONA FIENA ANAK JAMES"},{"date":"29-06-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"},{"date":"29-06-26 0:00","qty":1,"price":225,"sp":"JONG PEI CHOO"},{"date":"26-07-26 0:00","qty":1,"price":225,"sp":"NURHAFIZAH BINTI PAULI"},{"date":"18-09-26 0:00","qty":1,"price":115,"sp":"Ting Kwang Yu"},{"date":"18-09-26 0:00","qty":1,"price":225,"sp":"Ting Kwang Yu"}]},{"id":"CUST_68","name":"Hiew Tze Mui","phone":"60168765993","totalQty":10,"totalSpent":1150,"lastDate":"25-05-26 0:00","firstDate":"25-05-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"25-05-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"},{"date":"25-05-26 0:00","qty":3,"price":115,"sp":"CHAI YEE SIAN"},{"date":"25-05-26 0:00","qty":3,"price":115,"sp":"CHAI YEE SIAN"},{"date":"25-05-26 0:00","qty":3,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_69","name":"YEO SIEW CHING","phone":"60128941838","totalQty":1,"totalSpent":225,"lastDate":"26-05-26 0:00","firstDate":"26-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"26-05-26 0:00","qty":1,"price":225,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_70","name":"Lucy Anak Andil","phone":"60198893215","totalQty":6,"totalSpent":690,"lastDate":"27-05-26 0:00","firstDate":"27-05-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"27-05-26 0:00","qty":6,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_71","name":"KHIEW SUI JIN","phone":"60138225828","totalQty":3,"totalSpent":345,"lastDate":"28-05-26 0:00","firstDate":"28-05-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"28-05-26 0:00","qty":3,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_72","name":"CHAI WAN CHIN","phone":"60147867976","totalQty":1,"totalSpent":115,"lastDate":"29-05-26 0:00","firstDate":"29-05-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"29-05-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_73","name":"TING SHYH SHENG","phone":"60128099801","totalQty":1,"totalSpent":115,"lastDate":"31-05-26 0:00","firstDate":"31-05-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"31-05-26 0:00","qty":1,"price":115,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_74","name":"Chu Suk Lin","phone":"60168908023","totalQty":1,"totalSpent":115,"lastDate":"12-06-26 0:00","firstDate":"12-06-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"12-06-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_75","name":"YEO YEE KANG","phone":"60198355168","totalQty":1,"totalSpent":115,"lastDate":"13-06-26 0:00","firstDate":"13-06-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"13-06-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_76","name":"Chung May Kin","phone":"60168094286","totalQty":3,"totalSpent":345,"lastDate":"17-06-26 0:00","firstDate":"17-06-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"17-06-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"},{"date":"17-06-26 0:00","qty":2,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_77","name":"CHAI KHEK HIUN","phone":"601155505583","totalQty":2,"totalSpent":230,"lastDate":"18-10-26 0:00","firstDate":"21-06-26 0:00","salespersons":["FIONA FIENA ANAK JAMES","NURHAFIZAH BINTI PAULI"],"history":[{"date":"21-06-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"},{"date":"18-10-26 0:00","qty":1,"price":115,"sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"CUST_78","name":"RADIAH ANAK JANGGOT","phone":"60198864658","totalQty":1,"totalSpent":115,"lastDate":"21-06-26 0:00","firstDate":"21-06-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"21-06-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_79","name":"SEMRY ANAK SEMTIN","phone":"60138278157","totalQty":1,"totalSpent":225,"lastDate":"24-06-26 0:00","firstDate":"24-06-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"24-06-26 0:00","qty":1,"price":225,"sp":"Muhammad Nur Farizin Bin Abdullah"}]},{"id":"CUST_80","name":"ROSEMARY ANAK SIRET","phone":"60138095857","totalQty":1,"totalSpent":115,"lastDate":"25-06-26 0:00","firstDate":"25-06-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"25-06-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_81","name":"CHAI PHEI LAN","phone":"60168006763","totalQty":1,"totalSpent":115,"lastDate":"25-06-26 0:00","firstDate":"25-06-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"25-06-26 0:00","qty":1,"price":115,"sp":"Muhammad Nur Farizin Bin Abdullah"}]},{"id":"CUST_82","name":"NG MIOW NOI","phone":"60135795123","totalQty":1,"totalSpent":115,"lastDate":"28-06-26 0:00","firstDate":"28-06-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"28-06-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_83","name":"TEO CHONG NGIAN","phone":"60107856939","totalQty":1,"totalSpent":225,"lastDate":"28-06-26 0:00","firstDate":"28-06-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"28-06-26 0:00","qty":1,"price":225,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_84","name":"HARWANDI","phone":"60135759940","totalQty":1,"totalSpent":115,"lastDate":"29-06-26 0:00","firstDate":"29-06-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"29-06-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_85","name":"SIM KWANG MENG","phone":"60102897655","totalQty":2,"totalSpent":340,"lastDate":"11-07-26 0:00","firstDate":"11-07-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"11-07-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"},{"date":"11-07-26 0:00","qty":1,"price":225,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_86","name":"BONG SAN MOI","phone":"60168535952","totalQty":1,"totalSpent":115,"lastDate":"12-07-26 0:00","firstDate":"12-07-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"12-07-26 0:00","qty":1,"price":115,"sp":"Muhammad Nur Farizin Bin Abdullah"}]},{"id":"CUST_87","name":"RICK METIL ANAK RIANG","phone":"601151952654","totalQty":1,"totalSpent":115,"lastDate":"14-07-26 0:00","firstDate":"14-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"14-07-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_88","name":"MALING ANAK KALONG","phone":"6082611710","totalQty":1,"totalSpent":115,"lastDate":"15-07-26 0:00","firstDate":"15-07-26 0:00","salespersons":["LOLITA WONG LIN"],"history":[{"date":"15-07-26 0:00","qty":1,"price":115,"sp":"LOLITA WONG LIN"}]},{"id":"CUST_89","name":"BRONSON MOGGIE SULANG ANAK MURUI","phone":"60138117732","totalQty":1,"totalSpent":115,"lastDate":"15-07-26 0:00","firstDate":"15-07-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"15-07-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_90","name":"LEE AH HIN","phone":"60109856838","totalQty":1,"totalSpent":115,"lastDate":"16-07-26 0:00","firstDate":"16-07-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"16-07-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_91","name":"LAI JIN HIONG","phone":"60182067217","totalQty":2,"totalSpent":340,"lastDate":"10-10-26 0:00","firstDate":"16-07-26 0:00","salespersons":["KENIX LING WANG YING","JONG PEI CHOO"],"history":[{"date":"16-07-26 0:00","qty":1,"price":115,"sp":"KENIX LING WANG YING"},{"date":"10-10-26 0:00","qty":1,"price":225,"sp":"JONG PEI CHOO"}]},{"id":"CUST_92","name":"Umi Hasma Salleh","phone":"60198378853","totalQty":1,"totalSpent":115,"lastDate":"17-07-26 0:00","firstDate":"17-07-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"17-07-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_93","name":"ROSLINA BT ZAKARIA @ ROSALIND AK KUJA","phone":"601125001974","totalQty":1,"totalSpent":115,"lastDate":"19-07-26 0:00","firstDate":"19-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"19-07-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_94","name":"SALINA ANAK JAMES MALONG","phone":"60194671968","totalQty":1,"totalSpent":115,"lastDate":"19-07-26 0:00","firstDate":"19-07-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"19-07-26 0:00","qty":1,"price":115,"sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"CUST_95","name":"TING PIK KIONG","phone":"60127011750","totalQty":1,"totalSpent":225,"lastDate":"20-07-26 0:00","firstDate":"20-07-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"20-07-26 0:00","qty":1,"price":225,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_96","name":"Chai Joon Khim","phone":"60198577058","totalQty":3,"totalSpent":455,"lastDate":"24-09-26 0:00","firstDate":"22-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha","Ting Kwang Yu"],"history":[{"date":"22-07-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"},{"date":"24-09-26 0:00","qty":1,"price":115,"sp":"Ting Kwang Yu"},{"date":"24-09-26 0:00","qty":1,"price":225,"sp":"Ting Kwang Yu"}]},{"id":"CUST_97","name":"LU HUONG LAI","phone":"60138033738","totalQty":1,"totalSpent":115,"lastDate":"22-07-26 0:00","firstDate":"22-07-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"22-07-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_98","name":"CHAI KHEK HIUN","phone":"60115611","totalQty":1,"totalSpent":115,"lastDate":"26-07-26 0:00","firstDate":"26-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"26-07-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_99","name":"THEN PIK SIA","phone":"60162319226","totalQty":1,"totalSpent":115,"lastDate":"26-07-26 0:00","firstDate":"26-07-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"26-07-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_100","name":"VOON MUI JIN","phone":"601165757118","totalQty":1,"totalSpent":115,"lastDate":"28-07-26 0:00","firstDate":"28-07-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"28-07-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_101","name":"WONG HONG CHIN","phone":"60168885344","totalQty":2,"totalSpent":230,"lastDate":"23-10-26 0:00","firstDate":"30-07-26 0:00","salespersons":["JONG PEI CHOO","CHAI YEE SIAN"],"history":[{"date":"30-07-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"},{"date":"23-10-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_102","name":"DORIS CHONG LIONG LIN","phone":"60143922912","totalQty":1,"totalSpent":115,"lastDate":"31-07-26 0:00","firstDate":"31-07-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"31-07-26 0:00","qty":1,"price":115,"sp":"KENIX LING WANG YING"}]},{"id":"CUST_103","name":"MOHAMAD JALI BIN LILI","phone":"60135792514","totalQty":1,"totalSpent":115,"lastDate":"10-08-26 0:00","firstDate":"10-08-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"10-08-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_104","name":"Sia Tay Kuek","phone":"60168521169","totalQty":4,"totalSpent":570,"lastDate":"20-09-26 0:00","firstDate":"11-08-26 0:00","salespersons":["KENIX LING WANG YING","FIONA FIENA ANAK JAMES"],"history":[{"date":"11-08-26 0:00","qty":1,"price":225,"sp":"KENIX LING WANG YING"},{"date":"20-09-26 0:00","qty":2,"price":115,"sp":"FIONA FIENA ANAK JAMES"},{"date":"20-09-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_105","name":"KERINE ANAK GADEP","phone":"60198393031","totalQty":2,"totalSpent":230,"lastDate":"13-10-26 0:00","firstDate":"11-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","Ting Kwang Yu"],"history":[{"date":"11-08-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"},{"date":"13-10-26 0:00","qty":1,"price":115,"sp":"Ting Kwang Yu"}]},{"id":"CUST_106","name":"NG SEY MOI","phone":"60108648228","totalQty":1,"totalSpent":225,"lastDate":"14-08-26 0:00","firstDate":"14-08-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"14-08-26 0:00","qty":1,"price":225,"sp":"JONG PEI CHOO"}]},{"id":"CUST_107","name":"HAIRY BIN ALI","phone":"60178574075","totalQty":1,"totalSpent":115,"lastDate":"16-08-26 0:00","firstDate":"16-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"16-08-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_108","name":"YONG WEE PIN","phone":"601116829106","totalQty":1,"totalSpent":115,"lastDate":"16-08-26 0:00","firstDate":"16-08-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"16-08-26 0:00","qty":1,"price":115,"sp":"Muhammad Nur Farizin Bin Abdullah"}]},{"id":"CUST_109","name":"WONG SON ENG","phone":"60102715721","totalQty":1,"totalSpent":115,"lastDate":"17-08-26 0:00","firstDate":"17-08-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"17-08-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_110","name":"NGIAN ANAK SELANG","phone":"60138272850","totalQty":1,"totalSpent":115,"lastDate":"18-08-26 0:00","firstDate":"18-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-08-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_111","name":"CHAI SIEW MOI","phone":"601110578128","totalQty":2,"totalSpent":340,"lastDate":"22-10-26 0:00","firstDate":"19-08-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"19-08-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"},{"date":"22-10-26 0:00","qty":1,"price":225,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_112","name":"GILBERT JONG SIEW HUI","phone":"60143961188","totalQty":1,"totalSpent":115,"lastDate":"21-08-26 0:00","firstDate":"21-08-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"21-08-26 0:00","qty":1,"price":115,"sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"CUST_113","name":"MOHAMMED AZIZUL BIN NASSIR","phone":"60138218691","totalQty":1,"totalSpent":115,"lastDate":"23-08-26 0:00","firstDate":"23-08-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"23-08-26 0:00","qty":1,"price":115,"sp":"Muhammad Nur Farizin Bin Abdullah"}]},{"id":"CUST_114","name":"NULAI ANAK RUNDANG","phone":"60135680545","totalQty":1,"totalSpent":115,"lastDate":"23-08-26 0:00","firstDate":"23-08-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"23-08-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_115","name":"CHONG LEE CHOO","phone":"60168596678","totalQty":2,"totalSpent":230,"lastDate":"24-10-26 0:00","firstDate":"24-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","JONG PEI CHOO"],"history":[{"date":"24-08-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"},{"date":"24-10-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_116","name":"TENG CONG XIN","phone":"60128909212","totalQty":1,"totalSpent":115,"lastDate":"27-08-26 0:00","firstDate":"27-08-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"27-08-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_117","name":"KONG CHIA LING","phone":"60146884858","totalQty":2,"totalSpent":340,"lastDate":"28-08-26 0:00","firstDate":"28-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"28-08-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"},{"date":"28-08-26 0:00","qty":1,"price":225,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_118","name":"VOON TZE MIN","phone":"60138292238","totalQty":1,"totalSpent":115,"lastDate":"29-08-26 0:00","firstDate":"29-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"29-08-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_119","name":"NGILIA ANAK LUTAM","phone":"60147541647","totalQty":1,"totalSpent":115,"lastDate":"29-08-26 0:00","firstDate":"29-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"29-08-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_120","name":"THOMAS ANAK EMPENI","phone":"60122694138","totalQty":1,"totalSpent":115,"lastDate":"30-08-26 0:00","firstDate":"30-08-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"30-08-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_121","name":"TAN THUANG HUI","phone":"60165759883","totalQty":3,"totalSpent":675,"lastDate":"20-10-26 0:00","firstDate":"30-08-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG","Christina Lee Ying Ying"],"history":[{"date":"30-08-26 0:00","qty":1,"price":225,"sp":"HANIESHA LOUNA ANAK DAGENG"},{"date":"30-08-26 0:00","qty":1,"price":225,"sp":"HANIESHA LOUNA ANAK DAGENG"},{"date":"20-10-26 0:00","qty":1,"price":225,"sp":"Christina Lee Ying Ying"}]},{"id":"CUST_122","name":"CHONG CHIEW YAN","phone":"60178992966","totalQty":2,"totalSpent":450,"lastDate":"23-10-26 0:00","firstDate":"31-08-26 0:00","salespersons":["JONG PEI CHOO","KENIX LING WANG YING"],"history":[{"date":"31-08-26 0:00","qty":1,"price":225,"sp":"JONG PEI CHOO"},{"date":"23-10-26 0:00","qty":1,"price":225,"sp":"KENIX LING WANG YING"}]},{"id":"CUST_123","name":"LIIK HIE LOI","phone":"60168728017","totalQty":1,"totalSpent":115,"lastDate":"15-09-26 0:00","firstDate":"15-09-26 0:00","salespersons":["Daniela Janet Anak Mustapha"],"history":[{"date":"15-09-26 0:00","qty":1,"price":115,"sp":"Daniela Janet Anak Mustapha"}]},{"id":"CUST_124","name":"IMIR  TJHO","phone":"60168875905","totalQty":1,"totalSpent":115,"lastDate":"15-09-26 0:00","firstDate":"15-09-26 0:00","salespersons":["Ting Kwang Yu"],"history":[{"date":"15-09-26 0:00","qty":1,"price":115,"sp":"Ting Kwang Yu"}]},{"id":"CUST_125","name":"CHUNG YIN LING","phone":"601116693493","totalQty":1,"totalSpent":115,"lastDate":"19-09-26 0:00","firstDate":"19-09-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"19-09-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_126","name":"CHUNG AH GAN","phone":"60168316258","totalQty":1,"totalSpent":225,"lastDate":"20-09-26 0:00","firstDate":"20-09-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"20-09-26 0:00","qty":1,"price":225,"sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"CUST_127","name":"KOO FOO KIAW","phone":"60128090836","totalQty":1,"totalSpent":115,"lastDate":"20-09-26 0:00","firstDate":"20-09-26 0:00","salespersons":["Ting Kwang Yu"],"history":[{"date":"20-09-26 0:00","qty":1,"price":115,"sp":"Ting Kwang Yu"}]},{"id":"CUST_128","name":"CHAI LIAN CHOO","phone":"60138941176","totalQty":1,"totalSpent":225,"lastDate":"21-09-26 0:00","firstDate":"21-09-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"21-09-26 0:00","qty":1,"price":225,"sp":"Muhammad Nur Farizin Bin Abdullah"}]},{"id":"CUST_129","name":"YEO SIEW CHIN","phone":"60198193376","totalQty":2,"totalSpent":450,"lastDate":"14-10-26 0:00","firstDate":"23-09-26 0:00","salespersons":["Ting Kwang Yu","JONG PEI CHOO"],"history":[{"date":"23-09-26 0:00","qty":1,"price":225,"sp":"Ting Kwang Yu"},{"date":"14-10-26 0:00","qty":1,"price":225,"sp":"JONG PEI CHOO"}]},{"id":"CUST_130","name":"TAN AI LAN","phone":"60168592845","totalQty":1,"totalSpent":115,"lastDate":"23-09-26 0:00","firstDate":"23-09-26 0:00","salespersons":["Ting Kwang Yu"],"history":[{"date":"23-09-26 0:00","qty":1,"price":115,"sp":"Ting Kwang Yu"}]},{"id":"CUST_131","name":"MARUJU ANAK SADAGAR","phone":"60138386019","totalQty":1,"totalSpent":115,"lastDate":"24-09-26 0:00","firstDate":"24-09-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"24-09-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_132","name":"LAI MUK SHIN","phone":"60168837003","totalQty":1,"totalSpent":115,"lastDate":"27-09-26 0:00","firstDate":"27-09-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"27-09-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_133","name":"MOHAMMAD HAZILLIE BIN SATIM","phone":"60198540516","totalQty":1,"totalSpent":115,"lastDate":"30-09-26 0:00","firstDate":"30-09-26 0:00","salespersons":["NURHAFIZAH BINTI PAULI"],"history":[{"date":"30-09-26 0:00","qty":1,"price":115,"sp":"NURHAFIZAH BINTI PAULI"}]},{"id":"CUST_134","name":"MOHAMMAD AIDIL","phone":"60197252715","totalQty":1,"totalSpent":115,"lastDate":"30-09-26 0:00","firstDate":"30-09-26 0:00","salespersons":["JONG PEI CHOO"],"history":[{"date":"30-09-26 0:00","qty":1,"price":115,"sp":"JONG PEI CHOO"}]},{"id":"CUST_135","name":"CHANG AH LAT","phone":"60168901321","totalQty":1,"totalSpent":115,"lastDate":"10-10-26 0:00","firstDate":"10-10-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"10-10-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_136","name":"PHU KIM LAI","phone":"60168099102","totalQty":1,"totalSpent":115,"lastDate":"12-10-26 0:00","firstDate":"12-10-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"12-10-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_137","name":"CANDY ANAK NYOMUI","phone":"60168982642","totalQty":1,"totalSpent":115,"lastDate":"13-10-26 0:00","firstDate":"13-10-26 0:00","salespersons":["FIONA FIENA ANAK JAMES"],"history":[{"date":"13-10-26 0:00","qty":1,"price":115,"sp":"FIONA FIENA ANAK JAMES"}]},{"id":"CUST_138","name":"SUHARTI ANAK BIGIN","phone":"601119352830","totalQty":1,"totalSpent":115,"lastDate":"16-10-26 0:00","firstDate":"16-10-26 0:00","salespersons":["Christina Lee Ying Ying"],"history":[{"date":"16-10-26 0:00","qty":1,"price":115,"sp":"Christina Lee Ying Ying"}]},{"id":"CUST_139","name":"MARIA TUBAK","phone":"60192060778","totalQty":2,"totalSpent":450,"lastDate":"18-10-26 0:00","firstDate":"18-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"18-10-26 0:00","qty":1,"price":225,"sp":"KENIX LING WANG YING"},{"date":"18-10-26 0:00","qty":1,"price":225,"sp":"KENIX LING WANG YING"}]},{"id":"CUST_140","name":"LAI NYIK CHOI","phone":"60177768236","totalQty":1,"totalSpent":115,"lastDate":"18-10-26 0:00","firstDate":"18-10-26 0:00","salespersons":["Christina Lee Ying Ying"],"history":[{"date":"18-10-26 0:00","qty":1,"price":115,"sp":"Christina Lee Ying Ying"}]},{"id":"CUST_141","name":"CHONG FOO TECK","phone":"60128799378","totalQty":1,"totalSpent":115,"lastDate":"18-10-26 0:00","firstDate":"18-10-26 0:00","salespersons":["HANIESHA LOUNA ANAK DAGENG"],"history":[{"date":"18-10-26 0:00","qty":1,"price":115,"sp":"HANIESHA LOUNA ANAK DAGENG"}]},{"id":"CUST_142","name":"WONG LEE SIONG","phone":"60146986888","totalQty":1,"totalSpent":115,"lastDate":"19-10-26 0:00","firstDate":"19-10-26 0:00","salespersons":["CHAI YEE SIAN"],"history":[{"date":"19-10-26 0:00","qty":1,"price":115,"sp":"CHAI YEE SIAN"}]},{"id":"CUST_143","name":"ROHANA BINTI DIMIN","phone":"60168874842","totalQty":1,"totalSpent":115,"lastDate":"20-10-26 0:00","firstDate":"20-10-26 0:00","salespersons":["Muhammad Nur Farizin Bin Abdullah"],"history":[{"date":"20-10-26 0:00","qty":1,"price":115,"sp":"Muhammad Nur Farizin Bin Abdullah"}]},{"id":"CUST_144","name":"SAMSOLL OBING","phone":"601119890438","totalQty":2,"totalSpent":340,"lastDate":"25-10-26 0:00","firstDate":"25-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"25-10-26 0:00","qty":1,"price":225,"sp":"KENIX LING WANG YING"},{"date":"25-10-26 0:00","qty":1,"price":115,"sp":"KENIX LING WANG YING"}]},{"id":"CUST_145","name":"CHIN KIT LAM","phone":"601170057400","totalQty":1,"totalSpent":115,"lastDate":"26-10-26 0:00","firstDate":"26-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"26-10-26 0:00","qty":1,"price":115,"sp":"KENIX LING WANG YING"}]},{"id":"CUST_146","name":"JEZAMINE FIONA ANAK RAYMOND BRAOH","phone":"60128655926","totalQty":3,"totalSpent":455,"lastDate":"26-10-26 0:00","firstDate":"26-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"26-10-26 0:00","qty":1,"price":115,"sp":"KENIX LING WANG YING"},{"date":"26-10-26 0:00","qty":1,"price":225,"sp":"KENIX LING WANG YING"},{"date":"26-10-26 0:00","qty":1,"price":115,"sp":"KENIX LING WANG YING"}]},{"id":"CUST_147","name":"CHAN YAW BENG","phone":"60146779535","totalQty":1,"totalSpent":115,"lastDate":"27-10-26 0:00","firstDate":"27-10-26 0:00","salespersons":["KENIX LING WANG YING"],"history":[{"date":"27-10-26 0:00","qty":1,"price":115,"sp":"KENIX LING WANG YING"}]}]
};

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
📍 *Lokasi / 门店地点：* PMG Pharmacy {branch}
📞 *Tel / 联络：* {contact}

Boleh terus balas WhatsApp ini untuk simpan stok atau penghantaran!
如需提前预留存货或安排送货，欢迎直接回复此 WhatsApp 信息！

Terima kasih / 感谢您的支持！😊`,

  en: `Hello {name}, warm greetings from PMG Pharmacy {branch}! 👋

Great news! Your favorite product *{product}* is currently on *SPECIAL OFFER* for a limited time! 🌟

✨ *Special Offer Details:* {offer_details}
📅 *Promotion Period:* {promo_period}
📍 *Location:* PMG Pharmacy {branch}
📞 *Contact:* {contact}

Stocks are strictly limited (while stocks last). If you would like us to reserve stock for you or arrange for home delivery, simply reply directly to this WhatsApp message!

Thank you for your continuous support with PMG Pharmacy! Wishing you good health always. 😊`
};

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────────
const STORAGE_PROMO_CAMPAIGNS = 'pmg_promo_custom_campaigns';
const STORAGE_PROMO_ACTIVE_ID = 'pmg_promo_active_campaign_id';
const STORAGE_PROMO_COMPOSER  = 'pmg_promo_composer_state';
const STORAGE_PROMO_PROGRESS  = 'pmg_promo_broadcast_progress';

// ─── MODULE STATE ─────────────────────────────────────────────────────────────
let promoCampaigns = [];
let promoActiveCampaign = null;
let promoComposerState = {
  language: 'bm', // 'bm' | 'zh' | 'bilingual' | 'en' | 'custom'
  offerDetails: 'Beli 2 Tin RM210 (Jimat RM20) + Percuma Shaker / 买2罐特价RM210送摇摇杯',
  promoPeriod: 'Sementara Stok Masih Ada / 存货有限，售完即止',
  branchName: 'Kota Sentosa',
  branchContact: '082-629881 / 012-8889831',
  customText: '',
  nameFormat: 'title' // 'title' (Lai Jon Sen) | 'upper' (LAI JON SEN)
};
let promoProgressMap = {}; // { [campaignId]: { [customerId]: { sent: true, sentAt: '...' } } }
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
  renderPromoBroadcastUI();
}
window.initPromoBroadcastModule = initPromoBroadcastModule;

function loadPromoCampaigns() {
  promoCampaigns = [NUTRI_ALPHA_PRESET_CAMPAIGN];
  try {
    const raw = localStorage.getItem(STORAGE_PROMO_CAMPAIGNS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge custom campaigns ensuring no duplicate ID with preset
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
    console.warn('[PMG Promo] Error saving custom campaigns:', e);
  }
}

function loadPromoComposerState() {
  try {
    const raw = localStorage.getItem(STORAGE_PROMO_COMPOSER);
    if (raw) {
      const saved = JSON.parse(raw);
      promoComposerState = { ...promoComposerState, ...saved };
    }
  } catch (e) {}

  // Sync branch from hub session if available
  const sessionBranch = localStorage.getItem('pmg_branch_name') || document.getElementById('expiryBranchFilter')?.value;
  if (sessionBranch && sessionBranch !== 'ALL' && sessionBranch !== 'Kota Sentosa') {
    promoComposerState.branchName = sessionBranch;
  }
}

function savePromoComposerState() {
  try {
    localStorage.setItem(STORAGE_PROMO_COMPOSER, JSON.stringify(promoComposerState));
  } catch (e) {}
}

function loadPromoProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_PROMO_PROGRESS);
    if (raw) {
      promoProgressMap = JSON.parse(raw);
    }
  } catch (e) {
    promoProgressMap = {};
  }
}

function savePromoProgress() {
  try {
    localStorage.setItem(STORAGE_PROMO_PROGRESS, JSON.stringify(promoProgressMap));
  } catch (e) {}
}

function getCustomerSentStatus(campaignId, customerId) {
  if (!promoProgressMap[campaignId]) return null;
  return promoProgressMap[campaignId][customerId] || null;
}

function setCustomerSentStatus(campaignId, customerId, isSent, notes = '') {
  if (!promoProgressMap[campaignId]) promoProgressMap[campaignId] = {};
  if (isSent) {
    promoProgressMap[campaignId][customerId] = {
      sent: true,
      sentAt: new Date().toISOString(),
      notes: notes || ''
    };
  } else {
    delete promoProgressMap[campaignId][customerId];
  }
  savePromoProgress();
  renderPromoKpis();
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
  return String(str)
    .toLowerCase()
    .split(' ')
    .map(w => {
      if (['bin', 'binti', 'bt', 'anak', 'a/k', 'a/l', 'a/p', 'dan', 'of'].includes(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function cleanPhoneForWhatsApp(phone) {
  if (!phone) return '';
  let s = String(phone).trim().replace(/[^0-9]/g, '');
  if (s.startsWith('01')) s = '6' + s;
  else if (s.startsWith('1')) s = '60' + s;
  return s;
}

function validatePhoneNumber(phone) {
  const p = cleanPhoneForWhatsApp(phone);
  if (!p) return { valid: false, reason: 'Missing phone' };
  if (p.startsWith('6082') || p.startsWith('082')) {
    return { valid: false, isLandline: true, reason: 'Landline (082-)' };
  }
  if (!/^601[0-9]{8,9}$/.test(p)) {
    return { valid: false, reason: 'Non-standard length' };
  }
  return { valid: true, cleanPhone: p };
}

function detectCustomerLanguagePreference(name) {
  if (!name) return 'bm';
  const up = String(name).toUpperCase();
  // If Malay or Bumiputera identifiers
  if (/(BIN|BINTI|ANAK|AWANG|DAYANG|ABANG|SITI|MOHD|MUHAMMAD|RADIN|WAN|SYED|HAJI|HAJAH)/i.test(up)) {
    return 'bm';
  }
  // Otherwise, default to Chinese / Mandarin in Sarawak retail pharmacy context
  return 'zh';
}

// ─── MESSAGE TEMPLATE & PERSONALIZATION ENGINE ────────────────────────────────
function getActivePromoTemplateText() {
  const lang = promoComposerState.language || 'bm';
  if (lang === 'custom' && promoComposerState.customText && promoComposerState.customText.trim()) {
    return promoComposerState.customText;
  }
  return PROMO_DEFAULT_TEMPLATES[lang] || PROMO_DEFAULT_TEMPLATES.bm;
}

function generatePersonalizedMessage(customer, templateOverride = null) {
  const template = templateOverride || getActivePromoTemplateText();
  const rawName = customer ? (customer.name || customer.clientName || 'Valued Customer') : 'Pelanggan Dihormati';
  const name = promoComposerState.nameFormat === 'upper' ? rawName.toUpperCase() : formatTitleCase(rawName);
  const product = promoActiveCampaign ? (promoActiveCampaign.productName || 'Produk Kesihatan') : 'Produk Kesihatan';
  const offerDetails = promoComposerState.offerDetails || 'Tawaran Istimewa / 特别特惠';
  const promoPeriod = promoComposerState.promoPeriod || 'Sementara Stok Masih Ada / 存货有限';
  const branch = promoComposerState.branchName || 'Kota Sentosa';
  const contact = promoComposerState.branchContact || '082-629881 / 012-8889831';
  const phone = customer ? customer.phone : '';
  const lastDate = customer ? (customer.lastDate ? customer.lastDate.split(' ')[0] : 'Sebelum ini') : 'Sebelum ini';
  const totalQty = customer ? (customer.totalQty || 1) : 1;

  return template
    .replace(/{name}/g, name)
    .replace(/{product}/g, product)
    .replace(/{offer_details}/g, offerDetails)
    .replace(/{promo_period}/g, promoPeriod)
    .replace(/{branch}/g, branch)
    .replace(/{contact}/g, contact)
    .replace(/{phone}/g, phone)
    .replace(/{last_date}/g, lastDate)
    .replace(/{total_qty}/g, totalQty);
}

// ─── MAIN UI RENDER ENGINE ────────────────────────────────────────────────────
function renderPromoBroadcastUI() {
  renderPromoCampaignHeader();
  renderPromoKpis();
  renderPromoComposer();
  renderPromoCustomerTable();
  renderPromoChatPreview();
}
window.renderPromoBroadcastUI = renderPromoBroadcastUI;

function renderPromoCampaignHeader() {
  const selectEl = document.getElementById('promoCampaignSelect');
  if (selectEl) {
    selectEl.innerHTML = promoCampaigns.map(c => {
      const custCount = Array.isArray(c.customers) ? c.customers.length : 0;
      const isSel = promoActiveCampaign && promoActiveCampaign.id === c.id;
      return `<option value="${c.id}" ${isSel ? 'selected' : ''}>${c.name || c.productName} (${custCount} Customers)${c.isPreset ? ' ★ [Preset]' : ''}</option>`;
    }).join('');
  }

  const titleEl = document.getElementById('promoActiveCampaignTitle');
  if (titleEl && promoActiveCampaign) {
    titleEl.textContent = promoActiveCampaign.productName || promoActiveCampaign.name;
  }

  const badgeEl = document.getElementById('promoActiveCampaignBadge');
  if (badgeEl && promoActiveCampaign) {
    const custCount = Array.isArray(promoActiveCampaign.customers) ? promoActiveCampaign.customers.length : 0;
    badgeEl.textContent = `${custCount} Targeted Customers · RM ${promoActiveCampaign.defaultPrice || 115} Normal Price`;
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

  // Update floating "Send Next" button
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
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
    btn.innerHTML = `<i class="fa-brands fa-whatsapp text-lg"></i> <span>Send Next: <strong>${formatTitleCase(nextUnsent.name).slice(0, 18)}</strong> (${nextUnsent.phone})</span>`;
    btn.onclick = () => sendCustomerPromoWhatsApp(nextUnsent.id);
  } else {
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> <span>All ${customers.length} Customers Contacted! 🎉</span>`;
    btn.onclick = null;
  }
}

// ─── COMPOSER & PREVIEW ───────────────────────────────────────────────────────
function renderPromoComposer() {
  const lang = promoComposerState.language || 'bm';

  // Highlight active language button
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

  // Input bindings
  const offerInput = document.getElementById('promoComposerOffer');
  if (offerInput && offerInput.value !== promoComposerState.offerDetails) {
    offerInput.value = promoComposerState.offerDetails;
  }

  const periodInput = document.getElementById('promoComposerPeriod');
  if (periodInput && periodInput.value !== promoComposerState.promoPeriod) {
    periodInput.value = promoComposerState.promoPeriod;
  }

  const branchInput = document.getElementById('promoComposerBranch');
  if (branchInput && branchInput.value !== promoComposerState.branchName) {
    branchInput.value = promoComposerState.branchName;
  }

  const contactInput = document.getElementById('promoComposerContact');
  if (contactInput && contactInput.value !== promoComposerState.branchContact) {
    contactInput.value = promoComposerState.branchContact;
  }

  // Textarea
  const textarea = document.getElementById('promoComposerTextarea');
  if (textarea) {
    textarea.value = getActivePromoTemplateText();
  }

  renderPromoChatPreview();
}

function handlePromoLangSwitch(langKey) {
  promoComposerState.language = langKey;
  if (langKey !== 'custom') {
    promoComposerState.customText = PROMO_DEFAULT_TEMPLATES[langKey] || '';
  }
  savePromoComposerState();
  renderPromoComposer();
}
window.handlePromoLangSwitch = handlePromoLangSwitch;

function handleComposerInputChange() {
  const offer = document.getElementById('promoComposerOffer')?.value || '';
  const period = document.getElementById('promoComposerPeriod')?.value || '';
  const branch = document.getElementById('promoComposerBranch')?.value || '';
  const contact = document.getElementById('promoComposerContact')?.value || '';
  const textarea = document.getElementById('promoComposerTextarea')?.value || '';

  promoComposerState.offerDetails = offer;
  promoComposerState.promoPeriod = period;
  promoComposerState.branchName = branch;
  promoComposerState.branchContact = contact;
  promoComposerState.customText = textarea;
  promoComposerState.language = 'custom';

  savePromoComposerState();
  renderPromoChatPreview();
}
window.handleComposerInputChange = handleComposerInputChange;

function insertPromoPlaceholder(tag) {
  const textarea = document.getElementById('promoComposerTextarea');
  if (!textarea) return;

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const text = textarea.value;
  const replacement = tag;

  textarea.value = text.slice(0, start) + replacement + text.slice(end);
  textarea.selectionStart = textarea.selectionEnd = start + replacement.length;
  textarea.focus();

  handleComposerInputChange();
}
window.insertPromoPlaceholder = insertPromoPlaceholder;

function renderPromoChatPreview() {
  const previewBox = document.getElementById('promoChatPreviewContent');
  if (!previewBox) return;

  const customers = promoActiveCampaign?.customers || [];
  let sampleCust = customers[0];
  if (promoPreviewCustomerId) {
    const found = customers.find(c => c.id === promoPreviewCustomerId);
    if (found) sampleCust = found;
  }

  const msg = generatePersonalizedMessage(sampleCust);

  // Convert WhatsApp markdown (*bold*, _italic_, newline) to HTML
  let formattedHtml = escHtml(msg)
    .replace(/\*([^\*]+)\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
    .replace(/_([^_]+)_/g, '<em class="italic">$1</em>')
    .replace(/~([^~]+)~/g, '<del class="line-through">$1</del>')
    .replace(/\n/g, '<br>');

  previewBox.innerHTML = formattedHtml;

  const nameBadge = document.getElementById('promoPreviewCustomerBadge');
  if (nameBadge && sampleCust) {
    nameBadge.textContent = `Previewing for: ${formatTitleCase(sampleCust.name)} (${sampleCust.phone})`;
  }
}

// ─── CUSTOMER TABLE & FILTERING ───────────────────────────────────────────────
function filterPromoCustomers() {
  if (!promoActiveCampaign || !Array.isArray(promoActiveCampaign.customers)) return [];
  const list = promoActiveCampaign.customers;
  const q = (promoFilter.search || '').trim().toLowerCase();
  const status = promoFilter.status;
  const loyalty = promoFilter.loyalty;
  const campaignId = promoActiveCampaign.id;

  return list.filter(c => {
    // 1. Search filter
    if (q) {
      const name = String(c.name || '').toLowerCase();
      const phone = String(c.phone || '').toLowerCase();
      if (!name.includes(q) && !phone.includes(q)) return false;
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
    // Default: recent purchase date
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
        <td colspan="7" class="text-center py-12 text-gray-400">
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

  tbody.innerHTML = displayed.map((c, idx) => {
    const st = getCustomerSentStatus(campaignId, c.id);
    const isSent = Boolean(st && st.sent);
    const val = validatePhoneNumber(c.phone);
    const totalQty = Number(c.totalQty) || 1;
    const isVip = totalQty >= 3;
    const isRepeat = totalQty >= 2;
    const formattedName = formatTitleCase(c.name);
    const safeId = escHtml(c.id);

    // Auto-detect language badge
    const detectedLang = detectCustomerLanguagePreference(c.name);

    let statusBadge = '';
    if (isSent) {
      const timeStr = st.sentAt ? new Date(st.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Done';
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300" title="Sent at ${st.sentAt || ''}">
          <i class="fa-solid fa-check-double text-emerald-600"></i> Sent (${timeStr})
        </span>`;
    } else {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <i class="fa-regular fa-clock"></i> Pending
        </span>`;
    }

    let phoneCol = '';
    if (!val.valid) {
      if (val.isLandline) {
        phoneCol = `<span class="text-xs font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title="Kuching Landline Telephone (082-...)"><i class="fa-solid fa-phone text-amber-600 mr-1"></i>${escHtml(c.phone)} <span class="text-[10px] text-amber-600 block">(Landline)</span></span>`;
      } else {
        phoneCol = `<span class="text-xs font-mono text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200" title="Invalid phone number"><i class="fa-solid fa-triangle-exclamation text-rose-500 mr-1"></i>${escHtml(c.phone || 'None')} <span class="text-[10px] text-rose-600 block">(Invalid)</span></span>`;
      }
    } else {
      phoneCol = `
        <a href="https://wa.me/${val.cleanPhone}" target="_blank" rel="noopener" class="font-mono text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:underline flex items-center gap-1" title="Click to test WhatsApp chat">
          <i class="fa-brands fa-whatsapp text-emerald-600 text-sm"></i> ${val.cleanPhone}
        </a>`;
    }

    return `
      <tr class="border-b hover:bg-slate-50 transition ${isSent ? 'bg-emerald-50/20' : ''}" id="promoRow_${safeId}">
        <td class="p-3 text-center text-xs text-gray-400 font-mono">${idx + 1}</td>
        <td class="p-3">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-xs text-gray-900">${escHtml(formattedName)}</span>
            ${isVip ? '<span class="text-[9px] font-black uppercase px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded border border-purple-200">VIP (${totalQty} Cans)</span>' : (isRepeat ? '<span class="text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded border border-blue-200">2 Cans</span>' : '')}
            <span class="text-[9px] font-semibold px-1 py-0.2 rounded ${detectedLang === 'zh' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}" title="Suggested greeting language">${detectedLang === 'zh' ? '中文' : 'BM'}</span>
          </div>
          <div class="text-[11px] text-gray-400 mt-0.5">Last: ${escHtml(c.lastDate ? c.lastDate.split(' ')[0] : '—')} · Total: RM ${(Number(c.totalSpent) || 0).toFixed(0)}</div>
        </td>
        <td class="p-3 whitespace-nowrap text-xs">${phoneCol}</td>
        <td class="p-3 text-center whitespace-nowrap text-xs font-bold text-gray-700">
          ${totalQty} ${totalQty > 1 ? 'Units' : 'Unit'}
        </td>
        <td class="p-3 text-center whitespace-nowrap">${statusBadge}</td>
        <td class="p-3 text-center whitespace-nowrap">
          <div class="inline-flex items-center gap-1.5">
            ${val.valid ? `
              <button type="button" onclick="sendCustomerPromoWhatsApp('${safeId}')"
                class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Send personalized promotional WhatsApp to ${escHtml(formattedName)}">
                <i class="fa-brands fa-whatsapp text-sm"></i>
                <span>WhatsApp</span>
              </button>
            ` : `
              <button type="button" disabled
                class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center gap-1">
                <i class="fa-brands fa-whatsapp text-gray-300"></i> No Mobile
              </button>
            `}
            <button type="button" onclick="copyCustomerPromoMessage('${safeId}')"
              class="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
              title="Copy personalized text to clipboard">
              <i class="fa-regular fa-copy text-xs"></i>
            </button>
            <button type="button" onclick="previewPromoCustomerMessageModal('${safeId}')"
              class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
              title="Preview message for this customer">
              <i class="fa-regular fa-eye text-xs"></i>
            </button>
            <button type="button" onclick="toggleCustomerPromoSentManual('${safeId}')"
              class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
              title="${isSent ? 'Mark as Pending' : 'Mark as Sent'}">
              <i class="fa-solid ${isSent ? 'fa-rotate-left' : 'fa-circle-check'} text-xs"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ─── ACTION HANDLERS: SENDING & COPYING ───────────────────────────────────────
function sendCustomerPromoWhatsApp(customerId) {
  if (!promoActiveCampaign) return;
  const customer = promoActiveCampaign.customers.find(c => c.id === customerId);
  if (!customer) return;

  const val = validatePhoneNumber(customer.phone);
  if (!val.valid) {
    if (val.isLandline) {
      const proceed = confirm(`⚠️ Note: ${customer.phone} is a landline number (082-...). WhatsApp may not be active.\n\nDo you still want to try opening WhatsApp?`);
      if (!proceed) return;
    } else {
      alert(`Cannot send WhatsApp: ${customer.phone || 'No phone number'} is not a valid mobile number.`);
      return;
    }
  }

  const cleanPhone = val.cleanPhone || cleanPhoneForWhatsApp(customer.phone);
  const msg = generatePersonalizedMessage(customer);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

  // 1. Mark as sent immediately in memory and localStorage
  setCustomerSentStatus(promoActiveCampaign.id, customerId, true);

  // 2. Open WhatsApp in new tab
  window.open(waUrl, '_blank');

  // 3. Show instant feedback toast
  if (typeof showExpiryToast === 'function') {
    showExpiryToast(`✅ WhatsApp opened for ${formatTitleCase(customer.name)}! Marked as Sent.`);
  } else if (typeof showPmgToast === 'function') {
    showPmgToast(`✅ WhatsApp opened for ${formatTitleCase(customer.name)}! Marked as Sent.`, 'success');
  }

  // 4. Update row UI in real time
  renderPromoCustomerTable();
  renderPromoKpis();
}
window.sendCustomerPromoWhatsApp = sendCustomerPromoWhatsApp;

function copyCustomerPromoMessage(customerId) {
  if (!promoActiveCampaign) return;
  const customer = promoActiveCampaign.customers.find(c => c.id === customerId);
  if (!customer) return;

  const msg = generatePersonalizedMessage(customer);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg).then(() => {
      if (typeof showExpiryToast === 'function') {
        showExpiryToast(`📋 Message copied for ${formatTitleCase(customer.name)}!`);
      } else {
        alert(`📋 Message copied for ${formatTitleCase(customer.name)}!`);
      }
    }).catch(() => {
      prompt('Copy message text below:', msg);
    });
  } else {
    prompt('Copy message text below:', msg);
  }
}
window.copyCustomerPromoMessage = copyCustomerPromoMessage;

function toggleCustomerPromoSentManual(customerId) {
  if (!promoActiveCampaign) return;
  const campaignId = promoActiveCampaign.id;
  const st = getCustomerSentStatus(campaignId, customerId);
  const newStatus = !(st && st.sent);
  setCustomerSentStatus(campaignId, customerId, newStatus);
  renderPromoCustomerTable();
  renderPromoKpis();
}
window.toggleCustomerPromoSentManual = toggleCustomerPromoSentManual;

function previewPromoCustomerMessageModal(customerId) {
  promoPreviewCustomerId = customerId;
  renderPromoChatPreview();
  const modal = document.getElementById('promoMessagePreviewModal');
  if (modal) modal.classList.remove('hidden');
}
window.previewPromoCustomerMessageModal = previewPromoCustomerMessageModal;

function closePromoPreviewModal() {
  const modal = document.getElementById('promoMessagePreviewModal');
  if (modal) modal.classList.add('hidden');
}
window.closePromoPreviewModal = closePromoPreviewModal;

function sendFromPreviewModal() {
  if (promoPreviewCustomerId) {
    sendCustomerPromoWhatsApp(promoPreviewCustomerId);
    closePromoPreviewModal();
  }
}
window.sendFromPreviewModal = sendFromPreviewModal;

function resetCampaignSentStatus() {
  if (!promoActiveCampaign) return;
  const total = promoActiveCampaign.customers.length;
  if (!confirm(`Are you sure you want to reset all sent checkmarks for "${promoActiveCampaign.name}"?\n\nThis will mark all ${total} customers back to Pending.`)) {
    return;
  }
  delete promoProgressMap[promoActiveCampaign.id];
  savePromoProgress();
  renderPromoBroadcastUI();
  if (typeof showExpiryToast === 'function') {
    showExpiryToast('🔄 Broadcast status reset to Pending.');
  }
}
window.resetCampaignSentStatus = resetCampaignSentStatus;

// ─── FILTER & SEARCH HANDLERS ─────────────────────────────────────────────────
function setPromoStatusFilter(status) {
  promoFilter.status = status;
  document.querySelectorAll('.promo-status-tab').forEach(t => {
    const s = t.getAttribute('data-status');
    if (s === status) {
      t.classList.remove('text-gray-500', 'border-transparent');
      t.classList.add('text-emerald-700', 'border-emerald-600', 'font-bold');
    } else {
      t.classList.remove('text-emerald-700', 'border-emerald-600', 'font-bold');
      t.classList.add('text-gray-500', 'border-transparent');
    }
  });
  promoCurrentPage = 1;
  renderPromoCustomerTable();
}
window.setPromoStatusFilter = setPromoStatusFilter;

function handlePromoSearch(val) {
  promoFilter.search = val;
  promoCurrentPage = 1;
  renderPromoCustomerTable();
}
window.handlePromoSearch = handlePromoSearch;

function setPromoLoyaltyFilter(loyalty) {
  promoFilter.loyalty = loyalty;
  promoCurrentPage = 1;
  renderPromoCustomerTable();
}
window.setPromoLoyaltyFilter = setPromoLoyaltyFilter;

function setPromoSortBy(sortVal) {
  promoFilter.sortBy = sortVal;
  renderPromoCustomerTable();
}
window.setPromoSortBy = setPromoSortBy;

function loadMorePromoCustomers() {
  promoCurrentPage++;
  renderPromoCustomerTable();
}
window.loadMorePromoCustomers = loadMorePromoCustomers;

// ─── CAMPAIGN SWITCHER ────────────────────────────────────────────────────────
function switchPromoCampaign(campaignId) {
  const found = promoCampaigns.find(c => c.id === campaignId);
  if (!found) return;

  promoActiveCampaign = found;
  localStorage.setItem(STORAGE_PROMO_ACTIVE_ID, found.id);

  // Update offer details default to match product
  promoComposerState.offerDetails = `Tawaran Istimewa untuk ${found.productName} / 特别特惠`;
  savePromoComposerState();

  promoCurrentPage = 1;
  renderPromoBroadcastUI();
}
window.switchPromoCampaign = switchPromoCampaign;

// ─── CSV UPLOADER FOR NEW CAMPAIGNS ───────────────────────────────────────────
function openUploadCustomerCsvModal() {
  const modal = document.getElementById('promoUploadCsvModal');
  if (modal) modal.classList.remove('hidden');
}
window.openUploadCustomerCsvModal = openUploadCustomerCsvModal;

function closeUploadCustomerCsvModal() {
  const modal = document.getElementById('promoUploadCsvModal');
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

  // Smart column detector (prefers specific multi-word matches first)
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

  // Detect dominant product
  let dominantProduct = 'Special Offer Product';
  let maxCount = 0;
  for (const [prod, cnt] of Object.entries(productCountMap)) {
    if (cnt > maxCount) {
      maxCount = cnt;
      dominantProduct = prod;
    }
  }

  return {
    productName: dominantProduct,
    customers: Array.from(customerMap.values())
  };
}

function handlePromoCsvFileInput(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const text = e.target.result;
      const parsed = parseCsvFileToCustomers(text);
      if (!parsed.customers || parsed.customers.length === 0) {
        alert('No valid customer records could be extracted from this file.');
        return;
      }

      const campaignName = prompt('Enter a name for this new Campaign:', `${parsed.productName} (${parsed.customers.length} Customers)`);
      if (!campaignName) return;

      const newCampaign = {
        id: 'camp_' + Date.now(),
        name: campaignName.trim(),
        productName: parsed.productName,
        defaultPrice: 0,
        isPreset: false,
        createdAt: new Date().toISOString(),
        customers: parsed.customers
      };

      promoCampaigns.push(newCampaign);
      saveCustomPromoCampaigns();
      switchPromoCampaign(newCampaign.id);
      closeUploadCustomerCsvModal();

      if (typeof showExpiryToast === 'function') {
        showExpiryToast(`✅ Created campaign "${newCampaign.name}" with ${newCampaign.customers.length} customers!`);
      } else {
        alert(`✅ Created campaign "${newCampaign.name}" with ${newCampaign.customers.length} customers!`);
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing CSV file: ' + err.message);
    }
  };
  reader.readAsText(file);
}
window.handlePromoCsvFileInput = handlePromoCsvFileInput;

// ─── EXPORT TO CSV ────────────────────────────────────────────────────────────
function exportPromoCustomerListCsv() {
  if (!promoActiveCampaign || !Array.isArray(promoActiveCampaign.customers)) return;
  const customers = filterPromoCustomers();
  const campaignId = promoActiveCampaign.id;

  const headers = ['#', 'Customer Name', 'Phone Number', 'Valid Mobile', 'Total Cans Bought', 'Total Spent (RM)', 'Last Purchase Date', 'WhatsApp Status', 'Sent Timestamp'];
  const rows = customers.map((c, i) => {
    const st = getCustomerSentStatus(campaignId, c.id);
    const val = validatePhoneNumber(c.phone);
    const isSent = Boolean(st && st.sent);
    return [
      i + 1,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
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

// Expose internal helpers and presets for window scope and testing
if (typeof window !== 'undefined') {
  window.NUTRI_ALPHA_PRESET_CAMPAIGN = NUTRI_ALPHA_PRESET_CAMPAIGN;
  window.PROMO_DEFAULT_TEMPLATES = PROMO_DEFAULT_TEMPLATES;
  window.formatTitleCase = formatTitleCase;
  window.cleanPhoneForWhatsApp = cleanPhoneForWhatsApp;
  window.validatePhoneNumber = validatePhoneNumber;
  window.generatePersonalizedMessage = generatePersonalizedMessage;
  window.getCustomerSentStatus = getCustomerSentStatus;
  window.setCustomerSentStatus = setCustomerSentStatus;
  window.parseCsvFileToCustomers = parseCsvFileToCustomers;
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
