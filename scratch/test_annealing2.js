// scratch/test_annealing2.js
const assistants = ['TING', 'PENNY', 'LOUNA', 'FIONA', 'JANET', 'NUR', 'FAR'];
const N = assistants.length; // 7

function solveWithAnnealing(totalDays) {
  // Initial schedule: 7-day cycle staggered
  const cycle = ['AM', 'AM', 'AM', 'PM', 'PM', 'PM', 'RD'];
  const schedule = [];

  for (let d = 0; d < totalDays; d++) {
    const dayMap = {};
    for (let i = 0; i < N; i++) {
      dayMap[assistants[i]] = cycle[(d + i) % 7];
    }
    schedule.push(dayMap);
  }

  function evaluate(sched) {
    // 1. Hard constraints check:
    for (let i = 0; i < totalDays; i++) {
      for (let j = 0; j < N; j++) {
        const a = assistants[j];
        const s = sched[i][a];
        if (i > 0 && sched[i - 1][a] === 'PM' && s === 'AM') {
          return { score: Infinity, fatigue: 1, maxNights: 0 };
        }
      }
    }

    // Check night streaks
    for (let j = 0; j < N; j++) {
      const a = assistants[j];
      let streak = 0;
      for (let i = 0; i < totalDays; i++) {
        if (sched[i][a] === 'PM') {
          streak++;
          if (streak > 3) return { score: Infinity, fatigue: 0, maxNights: 1 };
        } else {
          streak = 0;
        }
      }
    }

    const stats = {};
    assistants.forEach(a => stats[a] = { am: 0, pm: 0, rd: 0 });
    for (let i = 0; i < totalDays; i++) {
      assistants.forEach(a => {
        const s = sched[i][a];
        if (s === 'AM') stats[a].am++;
        else if (s === 'PM') stats[a].pm++;
        else stats[a].rd++;
      });
    }

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

    const score = (staffAmVar > 1 ? 5000 * staffAmVar : staffAmVar * 100)
                + (staffPmVar > 1 ? 5000 * staffPmVar : staffPmVar * 100)
                + (allAmVar > 1 ? 1000 * allAmVar : allAmVar * 20)
                + (allPmVar > 1 ? 1000 * allPmVar : allPmVar * 20)
                + balanceDiff * 5;

    return { score, fatigue: 0, maxNights: 0, staffAmVar, staffPmVar, allAmVar, allPmVar, balanceDiff, stats };
  }

  let bestSched = JSON.parse(JSON.stringify(schedule));
  let bestEval = evaluate(bestSched);

  if (bestEval.score < Infinity && bestEval.staffAmVar <= 1 && bestEval.staffPmVar <= 1) {
    return { success: true, eval: bestEval, sched: bestSched };
  }

  let currentSched = JSON.parse(JSON.stringify(schedule));
  let currentEval = evaluate(currentSched);

  for (let step = 0; step < 30000; step++) {
    if (bestEval.score < Infinity && bestEval.staffAmVar <= 1 && bestEval.staffPmVar <= 1 && bestEval.allAmVar <= 1 && bestEval.allPmVar <= 1) {
      break;
    }

    const moveType = Math.random() < 0.5 ? 1 : 2;
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
      if (nextEval.score < Infinity && (nextEval.score <= currentEval.score || Math.random() < Math.exp((currentEval.score - nextEval.score) / 10))) {
        currentEval = nextEval;
        if (currentEval.score < bestEval.score) {
          bestEval = currentEval;
          bestSched = JSON.parse(JSON.stringify(currentSched));
        }
      } else {
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
      if (nextEval.score < Infinity && (nextEval.score <= currentEval.score || Math.random() < Math.exp((currentEval.score - nextEval.score) / 10))) {
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

  return { success: (bestEval.score < Infinity && bestEval.staffAmVar <= 1 && bestEval.staffPmVar <= 1), eval: bestEval, sched: bestSched };
}

console.log('Testing Annealing Solver with Hard Fatigue Rejection:');
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
