const fs = require('fs');

async function main() {
  const s = fs.readFileSync('scratch/tvMain.js', 'utf8');
  let idx = 0;
  while ((idx = s.indexOf('score', idx)) !== -1) {
    console.log(s.substring(Math.max(0, idx - 40), idx + 50));
    idx += 5;
  }
}

main().catch(console.error);
