const fs = require('fs');
const r = JSON.parse(fs.readFileSync('scratch/teda_decrypted.json', 'utf8')).data;

r.itemList.forEach((sec, idx) => {
  console.log(`\n=== Section ${idx}: ${sec.alias} ===`);
  console.log('Summary:', sec.itemName);
  if (sec.items) {
    sec.items.forEach(it => {
      console.log(`  - ${it.name} | Score: ${it.score} | LevelText: ${it.levelText || ''} | WuXing: ${it.wuxing || ''}`);
    });
  }
});
