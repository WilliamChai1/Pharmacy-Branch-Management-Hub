// scratch/test_annealing.js
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function solveWithAnnealing(totalDays) {
  const assistants = ['TING', 'PENNY', 'LOUNA', 'FIONA', 'JANET', 'NUR', 'FAR'];
  const N = assistants.length; // 7

  // Initial schedule: 7-day cycle staggered
  const cycle = ['AM', 'AM', 'AM', 'PM', 'PM', 'PM', 'RD'];
  const schedule = []; // schedule[d][a]

  for (let d = 0; d < totalDays; d++) {
    const dayMap = {};
    for (let i = 0; i < N; i++) {
      const a = assistants[i];
      const shift = cycle[(d + i) % 7];
      dayMap[a] = shift;
    }
    schedule.push(dayMap);
  }

  function evaluate(sched) {
    let fatigue = 0;
    let maxNights = 0;
    const stats = {};
    assistants.forEach(a => stats[a] = { am: 0, pm: 0, rd: 0 });

    for (let i = 0; i < totalDays; i++) {
      assistants.forEach(a => {
        const s = sched[i][a];
        if (s === 'AM') stats[a].am++;
        else if (s === 'PM') stats[a].pm++;
        else stats[a].rd++;

        if (i > 0) {
          const sp = sched[i - 1][a];
          if (sp === 'PM' && s === 'AM') fatigue += 1000;
        }
      });
    }

    // Check consecutive nights
    assistants.forEach(a => {
      let streak = 0;
      for (let i = 0; i < totalDays; i++) {
        if (sched[i][a] === 'PM') {
          streak++;
          if (streak > 3) maxNights += (streak - 3) * 500;
        } else {
          streak = 0;
        }
      }
    });

    // Check same role assistants: LOUNA, FIONA, JANET, NUR, FAR
    const staffGroup = ['LOUNA', 'FIONA', 'JANET', 'NUR', 'FAR'];
    const staffAms = staffGroup.map(a => stats[a].am);
    const staffPms = staffGroup.map(a => stats[a].pm);
    const staffAmVar = Math.max(...staffAms) - Math.min(...staffAms);
    const staffPmVar = Math.max(...staffPms) - Math.min(...staffPms);

    const allAms = assistants.map(a => stats[a].am);
    const allPms = assistants.map(a => stats[a].pm);
    const allAmVar = Math.max(...allAms) - Math.min(...allAms);
    const allPmVar = Math.max(...allPms) - Math.min(...allPms);

    const balanceDiff = assistants.reduce((sum, a) => sum + Math.abs(stats[a].am - stats[a].pm), 0);

    const score = fatigue + maxNights + (staffAmVar > 1 ? 5000 * staffAmVar : staffAmVar * 50) + (staffPmVar > 1 ? 5000 * staffPmVar : staffPmVar * 50) + (allAmVar > 1 ? 2000 * allAmVar : allAmVar * 20) + (allPmVar > 1 ? 2000 * allPmVar : allPmVar * 20) + balanceDiff * 10;
    return { score, fatigue, maxNights, staffAmVar, staffPmVar, allAmVar, allPmVar, balanceDiff, stats };
  }

  let bestSched = JSON.parse(JSON.stringify(schedule));
  let bestEval = evaluate(bestSched);

  if (bestEval.staffAmVar <= 1 && bestEval.staffPmVar <= 1 && bestEval.fatigue === 0 && bestEval.maxNights === 0) {
    return { success: true, eval: bestEval, sched: bestSched };
  }

  // Annealing / Local search
  let currentSched = JSON.parse(JSON.stringify(schedule));
  let currentEval = evaluate(currentSched);

  for (let step = 0; step < 20000; step++) {
    if (bestEval.staffAmVar <= 1 && bestEval.staffPmVar <= 1 && bestEval.fatigue === 0 && bestEval.maxNights === 0) {
      break;
    }

    // Try a move:
    // Move type 1: swap two staff on day d
    // Move type 2: swap a block of 2 days between two staff
    const moveType = Math.random() < 0.6 ? 1 : 2;
    const d = Math.floor(Math.random() * totalDays);
    const a1 = assistants[Math.floor(Math.random() * N)];
    const a2 = assistants[Math.floor(Math.random() * N)];
    if (a1 === a2) continue;

    if (moveType === 1) {
      const s1 = currentSched[d][a1];
      const s2 = currentSched[d][a2];
      if (s1 === s2) continue;

      currentSched[d][a1] = s2;
      currentSched[d][a2] = s1;

      const nextEval = evaluate(currentSched);
      if (nextEval.score <= currentEval.score || Math.random() < Math.exp((currentEval.score - nextEval.score) / 5)) {
        currentEval = nextEval;
        if (currentEval.score < bestEval.score) {
          bestEval = currentEval;
          bestSched = JSON.parse(JSON.stringify(currentSched));
        }
      } else {
        // Revert
        currentSched[d][a1] = s1;
        currentSched[d][a2] = s2;
      }
    } else if (d < totalDays - 1) {
      const s1a = currentSched[d][a1];
      const s2a = currentSched[d][a2];
      const s1b = currentSched[d + 1][a1];
      const s2b = currentSched[d + 1][a2];

      currentSched[d][a1] = s2a;
      currentSched[d][a2] = s1a;
      currentSched[d + 1][a1] = s2b;
      currentSched[d + 1][a2] = s1b;

      const nextEval = evaluate(currentSched);
      if (nextEval.score <= currentEval.score || Math.random() < Math.exp((currentEval.score - nextEval.score) / 5)) {
        currentEval = nextEval;
        if (currentEval.score < bestEval.score) {
          bestEval = currentEval;
          bestSched = JSON.parse(JSON.stringify(currentSched));
        }
      } else {
        currentSched[d][a1] = s1a;
        currentSched[d][a2] = s2a;
        currentSched[d + 1][a1] = s1b;
        currentSched[d + 1][a2] = s2b;
      }
    }
  }

  return { success: (bestEval.staffAmVar <= 1 && bestEval.staffPmVar <= 1 && bestEval.fatigue === 0 && bestEval.maxNights === 0), eval: bestEval, sched: bestSched };
}

console.log('Testing Annealing Solver:');
[31, 30, 28].forEach(days => {
  const t0 = Date.now();
  const res = solveWithAnnealing(days);
  const ms = Date.now() - t0;
  console.log(`\nMonth with ${days} days (${ms}ms):`);
  console.log(`Staff AM Variance: ${res.eval.staffAmVar}, Staff PM Variance: ${res.eval.staffPmVar}, Fatigue: ${res.eval.fatigue}, MaxNights: ${res.eval.maxNights}`);
  console.log(`All AM Variance: ${res.eval.allAmVar}, All PM Variance: ${res.eval.allPmVar}`);
  Object.entries(res.eval.stats).forEach(([a, st]) => {
    console.log(`  ${a.padEnd(8)}: AM=${st.am} PM=${st.pm} RD=${st.rd} Diff=|${st.am - st.pm}|`);
  });
  console.log(`Status: ${res.success ? '✓ PASSED 100% (VARIANCE <= 1)' : '✗ FAILED'}`);
});
