// scratch/test_cpsat.js
function solveExact(totalDays) {
  const assistants = ['TING', 'PENNY', 'LOUNA', 'FIONA', 'JANET', 'NUR', 'FAR'];
  const N = assistants.length; // 7

  const targetAmMin = Math.floor((totalDays * 3) / N); // 13 for 31d
  const targetAmMax = Math.ceil((totalDays * 3) / N);  // 14 for 31d
  const targetPmMin = Math.floor((totalDays * 3) / N); // 13 for 31d
  const targetPmMax = Math.ceil((totalDays * 3) / N);  // 14 for 31d
  const targetRdMin = Math.floor(totalDays / N);       // 4 for 31d
  const targetRdMax = Math.ceil(totalDays / N);        // 5 for 31d

  // Try randomized greedy with restarts
  for (let attempt = 0; attempt < 500; attempt++) {
    const schedule = Array.from({ length: totalDays }, () => ({}));
    const stats = {};
    assistants.forEach(a => {
      stats[a] = { am: 0, pm: 0, rd: 0, consecutiveNights: 0, consecutiveWork: 0, lastShift: null };
    });

    let feasible = true;

    for (let d = 0; d < totalDays; d++) {
      const remainingDays = totalDays - d;

      // 1. Pick 1 RD
      // Candidate must be able to reach targetRdMin within remainingDays, but not exceed targetRdMax
      const rdPool = assistants.filter(a => {
        if (stats[a].rd >= targetRdMax) return false;
        // Don't give RD two days in a row if possible
        if (stats[a].lastShift === 'RD' && remainingDays > 1) return false;
        return true;
      });

      // Must pick someone whose consecutiveWork >= 6 or consecutiveNights >= 3 if any
      const urgentRd = rdPool.filter(a => stats[a].consecutiveWork >= 6 || stats[a].consecutiveNights >= 3);
      let chosenRd = null;

      if (urgentRd.length > 0) {
        chosenRd = urgentRd[Math.floor(Math.random() * urgentRd.length)];
      } else if (rdPool.length > 0) {
        // Sort by who needs RD more
        rdPool.sort((a, b) => {
          const remA = targetRdMax - stats[a].rd;
          const remB = targetRdMax - stats[b].rd;
          if (remA !== remB) return remB - remA; // higher remaining target first
          return (stats[b].consecutiveWork + stats[b].consecutiveNights * 2) - (stats[a].consecutiveWork + stats[a].consecutiveNights * 2);
        });
        chosenRd = rdPool[0];
      } else {
        feasible = false;
        break;
      }

      schedule[d][chosenRd] = 'RD';
      const working = assistants.filter(a => a !== chosenRd);

      // 2. Pick 3 AM and 3 PM from working (6 staff)
      // Constraints:
      // - staff with lastShift === 'PM' CANNOT do AM
      // - staff with consecutiveNights >= 3 CANNOT do PM
      // - staff whose stats[a].am >= targetAmMax CANNOT do AM
      // - staff whose stats[a].pm >= targetPmMax CANNOT do PM
      const canDoAm = working.filter(a => stats[a].lastShift !== 'PM' && stats[a].am < targetAmMax);
      const canDoPm = working.filter(a => stats[a].consecutiveNights < 3 && stats[a].pm < targetPmMax);

      // Check if we can pick 3 AM from canDoAm such that remaining 3 are in canDoPm
      // Generate all combinations of 3 from canDoAm
      let validSplit = null;

      function getCombos(arr, k) {
        if (k === 0) return [[]];
        if (arr.length === 0) return [];
        const head = arr[0];
        const tail = arr.slice(1);
        const withHead = getCombos(tail, k - 1).map(c => [head, ...c]);
        const withoutHead = getCombos(tail, k);
        return [...withHead, ...withoutHead];
      }

      const combos = getCombos(canDoAm, 3);
      // Shuffle combos to explore
      combos.sort(() => Math.random() - 0.5);

      for (const amGroup of combos) {
        const pmGroup = working.filter(a => !amGroup.includes(a));
        const allCanPm = pmGroup.every(p => canDoPm.includes(p));
        if (allCanPm) {
          validSplit = { amGroup, pmGroup };
          break;
        }
      }

      if (!validSplit) {
        feasible = false;
        break;
      }

      // Apply
      validSplit.amGroup.forEach(a => {
        schedule[d][a] = 'AM';
        stats[a].am++;
        stats[a].consecutiveWork++;
        stats[a].consecutiveNights = 0;
        stats[a].lastShift = 'AM';
      });

      validSplit.pmGroup.forEach(a => {
        schedule[d][a] = 'PM';
        stats[a].pm++;
        stats[a].consecutiveWork++;
        stats[a].consecutiveNights++;
        stats[a].lastShift = 'PM';
      });

      stats[chosenRd].rd++;
      stats[chosenRd].consecutiveWork = 0;
      stats[chosenRd].consecutiveNights = 0;
      stats[chosenRd].lastShift = 'RD';
    }

    if (feasible) {
      // Check final stats
      const ams = assistants.map(a => stats[a].am);
      const pms = assistants.map(a => stats[a].pm);
      const amVar = Math.max(...ams) - Math.min(...ams);
      const pmVar = Math.max(...pms) - Math.min(...pms);
      const maxDiff = Math.max(...assistants.map(a => Math.abs(stats[a].am - stats[a].pm)));

      if (amVar <= 1 && pmVar <= 1 && maxDiff <= 1) {
        console.log(`Found solution for ${totalDays} days in attempt ${attempt + 1}!`);
        assistants.forEach(a => {
          console.log(`${a.padEnd(8)}: AM=${stats[a].am} PM=${stats[a].pm} RD=${stats[a].rd} Diff=|${stats[a].am - stats[a].pm}|`);
        });
        return { success: true, schedule, stats };
      }
    }
  }

  console.log(`Failed to find perfect solution for ${totalDays} days.`);
  return { success: false };
}

solveExact(31);
solveExact(30);
solveExact(28);
