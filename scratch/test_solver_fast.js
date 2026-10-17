// scratch/test_solver_fast.js
function solveMonth(totalDays) {
  const assistants = ['TING', 'PENNY', 'LOUNA', 'FIONA', 'JANET', 'NUR', 'FAR'];
  const numStaff = assistants.length; // 7

  // Target per assistant:
  // Total slots across month = totalDays * 7
  // Total AMs = totalDays * 3
  // Total PMs = totalDays * 3
  // Total RDs = totalDays * 1
  // Average per staff:
  // AMs: (totalDays * 3) / 7. For 31: 93/7 = 13.28 -> five 13s, two 14s.
  // PMs: (totalDays * 3) / 7. For 31: 93/7 = 13.28 -> five 13s, two 14s.
  // RDs: (totalDays * 1) / 7. For 31: 31/7 = 4.43 -> four 4s, three 5s.

  // Target bounds per staff:
  const minAm = Math.floor((totalDays * 3) / numStaff);
  const maxAm = Math.ceil((totalDays * 3) / numStaff);
  const minPm = Math.floor((totalDays * 3) / numStaff);
  const maxPm = Math.ceil((totalDays * 3) / numStaff);
  const minRd = Math.floor((totalDays * 1) / numStaff);
  const maxRd = Math.ceil((totalDays * 1) / numStaff);

  // We assign day by day using min-conflict / greedy priority
  const schedule = Array.from({ length: totalDays }, () => ({}));
  const stats = {};
  assistants.forEach(a => {
    stats[a] = { am: 0, pm: 0, rd: 0, consecutiveNights: 0, consecutiveWork: 0, lastShift: null };
  });

  for (let d = 0; d < totalDays; d++) {
    // We need 1 RD, 3 AM, 3 PM on day d.
    // 1. Pick RD candidate
    // Must get RD if:
    // - consecutiveWork >= 6
    // - consecutiveNights >= 3
    // Then favor staff who:
    // - has stats.rd < maxRd
    // - has highest consecutiveWork or consecutiveNights
    // - has lowest stats.rd
    const rdCandidates = assistants.filter(a => stats[a].rd < maxRd || stats[a].consecutiveWork >= 6 || stats[a].consecutiveNights >= 3);
    rdCandidates.sort((a, b) => {
      // Hard rules first
      const hardA = (stats[a].consecutiveWork >= 6 ? 100 : 0) + (stats[a].consecutiveNights >= 3 ? 50 : 0);
      const hardB = (stats[b].consecutiveWork >= 6 ? 100 : 0) + (stats[b].consecutiveNights >= 3 ? 50 : 0);
      if (hardA !== hardB) return hardB - hardA;

      // Balance RD count
      const rdDiff = stats[a].rd - stats[b].rd;
      if (rdDiff !== 0) return rdDiff; // lower rd first

      // Break night streak
      return stats[b].consecutiveNights - stats[a].consecutiveNights;
    });

    const rdStaff = rdCandidates[0] || assistants[0];
    schedule[d][rdStaff] = 'RD';

    const working = assistants.filter(a => a !== rdStaff);

    // 2. Divide remaining 6 working staff into 3 AM and 3 PM
    // Anti-fatigue check:
    // Who CANNOT do AM?
    // - staff with lastShift === 'PM' (no PM -> AM)
    // Who CANNOT do PM?
    // - staff with consecutiveNights >= 3
    const mustPm = [];
    const mustAm = [];
    const free = [];

    working.forEach(a => {
      if (stats[a].lastShift === 'PM') mustPm.push(a);
      else if (stats[a].consecutiveNights >= 3) mustAm.push(a);
      else free.push(a);
    });

    // Score free staff for AM vs PM
    // Staff with stats.am < stats.pm needs AM!
    // Staff with stats.pm < stats.am needs PM!
    free.sort((a, b) => {
      const diffA = stats[a].am - stats[a].pm;
      const diffB = stats[b].am - stats[b].pm;
      if (diffA !== diffB) return diffA - diffB; // lower am - pm needs AM
      return stats[a].am - stats[b].am; // lower total am needs AM
    });

    const assignedAm = [...mustAm];
    const assignedPm = [...mustPm];

    free.forEach(a => {
      if (assignedAm.length < 3) assignedAm.push(a);
      else assignedPm.push(a);
    });

    // If assignedPm has > 3 (because too many worked PM yesterday),
    // we need to resolve by giving one of them RD and putting rdStaff to AM!
    if (assignedPm.length > 3) {
      // Swap rdStaff with one of the mustPm staff!
      const pmSwapCandidate = mustPm.find(p => stats[p].rd < maxRd);
      if (pmSwapCandidate && (stats[rdStaff].lastShift !== 'PM')) {
        // Swap rdStaff and pmSwapCandidate!
        schedule[d][rdStaff] = 'AM';
        schedule[d][pmSwapCandidate] = 'RD';
        // Now working is:
        assignedPm.splice(assignedPm.indexOf(pmSwapCandidate), 1);
        assignedAm.push(rdStaff);
      }
    }

    // Apply shifts and update stats
    assignedAm.forEach(a => {
      schedule[d][a] = 'AM';
      stats[a].am++;
      stats[a].consecutiveWork++;
      stats[a].consecutiveNights = 0;
      stats[a].lastShift = 'AM';
    });

    assignedPm.forEach(a => {
      schedule[d][a] = 'PM';
      stats[a].pm++;
      stats[a].consecutiveWork++;
      stats[a].consecutiveNights++;
      stats[a].lastShift = 'PM';
    });

    const finalRdStaff = Object.keys(schedule[d]).find(k => schedule[d][k] === 'RD');
    stats[finalRdStaff].rd++;
    stats[finalRdStaff].consecutiveWork = 0;
    stats[finalRdStaff].consecutiveNights = 0;
    stats[finalRdStaff].lastShift = 'RD';
  }

  // Print summary
  console.log(`\nResults for ${totalDays} days:`);
  let fatigue = 0;
  for (let d = 1; d < totalDays; d++) {
    assistants.forEach(a => {
      if (schedule[d - 1][a] === 'PM' && schedule[d][a] === 'AM') {
        console.error(`FATIGUE VIOLATION on day ${d + 1} for ${a}`);
        fatigue++;
      }
    });
  }

  const ams = assistants.map(a => stats[a].am);
  const pms = assistants.map(a => stats[a].pm);
  const rds = assistants.map(a => stats[a].rd);

  const amVar = Math.max(...ams) - Math.min(...ams);
  const pmVar = Math.max(...pms) - Math.min(...pms);
  const maxDiff = Math.max(...assistants.map(a => Math.abs(stats[a].am - stats[a].pm)));

  assistants.forEach(a => {
    console.log(`${a.padEnd(8)}: AM=${stats[a].am}, PM=${stats[a].pm}, RD=${stats[a].rd}, Diff=|${stats[a].am - stats[a].pm}|`);
  });

  console.log(`AM Variance: ${amVar}, PM Variance: ${pmVar}, Max |AM - PM|: ${maxDiff}, Fatigue: ${fatigue}`);
  console.log(`Pass check: ${amVar <= 1 && pmVar <= 1 && maxDiff <= 1 && fatigue === 0 ? '✓ PASSED 100%' : '✗ FAILED'}`);
}

solveMonth(31);
solveMonth(30);
solveMonth(28);
