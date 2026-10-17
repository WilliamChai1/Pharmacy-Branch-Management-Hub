// scratch/test_equal_split.js
const assistants = ['LOUNA', 'FIONA', 'JANET', 'NUR', 'FAR'];
const N = assistants.length; // 5

// On each day, 2 assistants do AM, 2 do PM, 1 does RD (total 5)
// Over 31 days:
// Total AM slots = 31 * 2 = 62. 62 / 5 = 12.4 (two 13s, three 12s)
// Total PM slots = 31 * 2 = 62. 62 / 5 = 12.4 (two 13s, three 12s)
// Total RD slots = 31 * 1 = 31. 31 / 5 = 6.2 (one 7, four 6s)

// A 5-day cycle for each assistant:
// Pattern: ['AM', 'AM', 'PM', 'PM', 'RD']
// Properties:
// - AM -> AM: valid
// - AM -> PM: valid
// - PM -> PM: valid (2 consecutive PMs, never > 3)
// - PM -> RD: valid
// - RD -> AM: valid
// - PM -> AM next morning: NEVER!
// - Consecutive work days before RD: exactly 4!
// - In every 5 days: exactly 2 AM, 2 PM, 1 RD!

const cycle = ['AM', 'AM', 'PM', 'PM', 'RD'];

function test5DayCycle(totalDays) {
  const stats = {};
  assistants.forEach(a => stats[a] = { am: 0, pm: 0, rd: 0 });

  for (let d = 0; d < totalDays; d++) {
    for (let i = 0; i < N; i++) {
      const a = assistants[i];
      const shift = cycle[(d + i) % 5];
      if (shift === 'AM') stats[a].am++;
      else if (shift === 'PM') stats[a].pm++;
      else stats[a].rd++;
    }
  }

  console.log(`\nResults for 5-day cycle over ${totalDays} days:`);
  assistants.forEach(a => {
    console.log(`  ${a.padEnd(8)}: AM=${stats[a].am} PM=${stats[a].pm} RD=${stats[a].rd} Diff=|${stats[a].am - stats[a].pm}|`);
  });

  const ams = assistants.map(a => stats[a].am);
  const pms = assistants.map(a => stats[a].pm);
  const amVar = Math.max(...ams) - Math.min(...ams);
  const pmVar = Math.max(...pms) - Math.min(...pms);
  const maxDiff = Math.max(...assistants.map(a => Math.abs(stats[a].am - stats[a].pm)));

  console.log(`Staff AM Variance: ${amVar}, Staff PM Variance: ${pmVar}, Max |AM - PM|: ${maxDiff}`);
  console.log(`Pass check: ${amVar <= 1 && pmVar <= 1 && maxDiff <= 1 ? '✓ PASSED 100% PERFECT' : '✗ FAILED'}`);
}

test5DayCycle(31);
test5DayCycle(30);
test5DayCycle(28);
