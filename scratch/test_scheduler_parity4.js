// scratch/test_scheduler_parity4.js
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOLIDAYS_2026_SARAWAK = {
  '2026-01-01': "New Year's Day",
  '2026-02-17': "Chinese New Year (Day 1)",
  '2026-02-18': "Chinese New Year (Day 2)",
  '2026-03-20': "Hari Raya Aidilfitri (Day 1)",
  '2026-03-21': "Hari Raya Aidilfitri (Day 2)",
  '2026-04-03': "Good Friday",
  '2026-05-01': "Labour Day",
  '2026-05-31': "Wesak Day",
  '2026-06-01': "Hari Gawai Dayak (Day 1)",
  '2026-06-02': "Hari Gawai Dayak (Day 2)",
  '2026-06-08': "Yang di-Pertuan Agong's Birthday",
  '2026-07-22': "Sarawak Independence Day",
  '2026-08-31': "National Day (Merdeka)",
  '2026-09-16': "Malaysia Day",
  '2026-09-25': "Prophet Muhammad's Birthday (Maulidur Rasul)",
  '2026-10-10': "Sarawak Governor's Birthday",
  '2026-11-08': "Deepavali",
  '2026-12-25': "Christmas Day"
};

const teammates = [
  { empNo: 'PMG00831', nickname: 'WILLIAM', position: 'Pharmacist', isPharmacist: true, scheduleMode: 'Fixed' },
  { empNo: 'PMG02963', nickname: 'KENIX', position: 'Pharmacist', isPharmacist: true, scheduleMode: 'Rotating', restDayPref: 'Monday' },
  { empNo: 'PMG00723', nickname: 'TING', position: 'Branch Manager', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Sunday' },
  { empNo: 'PMG02694', nickname: 'PENNY', position: 'Assistant Branch Manager', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Friday' },
  { empNo: 'PMG01294', nickname: 'LOUNA', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Tuesday' },
  { empNo: 'PMG01780', nickname: 'FIONA', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Wednesday' },
  { empNo: 'PMG03062', nickname: 'JANET', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Thursday' },
  { empNo: 'PMG02070', nickname: 'NURHAFIZAH', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Friday' },
  { empNo: 'PMG03375', nickname: 'FARIZIN', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Saturday' }
];

function testOptimizedParity(year, month) {
  const totalDays = new Date(year, month, 0).getDate();
  const assistants = teammates.filter(t => !t.isPharmacist);
  const cycle = ['AM', 'AM', 'AM', 'PM', 'PM', 'PM', 'RD'];

  // Base schedule generation
  const offsets = [];
  const assignedOffsets = new Set();
  assistants.forEach(a => {
    let idealOffset = 0;
    for (let d = 1; d <= 7; d++) {
      const dt = new Date(year, month - 1, d);
      if (daysOfWeek[dt.getDay()] === a.restDayPref) {
        idealOffset = (7 + 6 - (d - 1)) % 7;
        break;
      }
    }
    let best = idealOffset;
    while (assignedOffsets.has(best)) best = (best + 1) % 7;
    assignedOffsets.add(best);
    offsets.push({ empNo: a.empNo, offset: best });
  });

  const days = [];
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[dateStr];
    const dayShifts = {};

    // 1. William
    if (isHoliday) dayShifts['PMG00831'] = 'PH';
    else if (dayOfWeek === 'Sunday') dayShifts['PMG00831'] = 'RD';
    else if (dayOfWeek === 'Saturday') dayShifts['PMG00831'] = '4H_0730-1130';
    else dayShifts['PMG00831'] = '8H_0730-1630';

    // 2. Kenix
    const isWilliamOffToday = (dayShifts['PMG00831'] === 'RD' || dayShifts['PMG00831'] === 'PH');
    const tomorrowDateObj = new Date(year, month - 1, d + 1);
    const tomorrowDayOfWeek = daysOfWeek[tomorrowDateObj.getDay()];
    const tomorrowDateStr = `${year}-${String(month).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
    const isWilliamOffTomorrow = (d < totalDays && (tomorrowDayOfWeek === 'Sunday' || !!HOLIDAYS_2026_SARAWAK[tomorrowDateStr]));

    if (isWilliamOffToday) dayShifts['PMG02963'] = '8H_0730-1630';
    else if (isWilliamOffTomorrow) dayShifts['PMG02963'] = 'RD';
    else if (dayOfWeek === 'Monday') dayShifts['PMG02963'] = 'RD';
    else dayShifts['PMG02963'] = '8H_1230-2130';

    // 3. Assistants
    assistants.forEach(a => {
      const offObj = offsets.find(o => o.empNo === a.empNo);
      const cycleIdx = (d - 1 + offObj.offset) % 7;
      const shiftType = cycle[cycleIdx];
      if (shiftType === 'RD') dayShifts[a.empNo] = 'RD';
      else if (shiftType === 'AM') dayShifts[a.empNo] = '8H_0730-1630';
      else dayShifts[a.empNo] = '8H_1230-2130';
    });

    days.push({ day: d, date: dateStr, dayOfWeek, shifts: dayShifts });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PARITY OPTIMIZATION: Local Search Swaps
  // ─────────────────────────────────────────────────────────────────────────
  // Helper to count shifts for assistants
  function getStats() {
    const stats = {};
    assistants.forEach(a => {
      stats[a.empNo] = { am: 0, pm: 0, rd: 0 };
    });
    days.forEach(d => {
      assistants.forEach(a => {
        const s = d.shifts[a.empNo];
        if (s.includes('0730')) stats[a.empNo].am++;
        else if (s.includes('1230')) stats[a.empNo].pm++;
        else stats[a.empNo].rd++;
      });
    });
    return stats;
  }

  // Helper to check fatigue validity for an assistant over the entire month
  function isValidScheduleForStaff(empNo) {
    let nightStreak = 0;
    for (let i = 0; i < days.length; i++) {
      const s = days[i].shifts[empNo];
      const isPm = s && s.includes('1230');
      const isAm = s && s.includes('0730');

      if (isPm) {
        nightStreak++;
        if (nightStreak > 3) return false; // Capped at 3 consecutive nights
      } else {
        nightStreak = 0;
      }

      if (i > 0) {
        const prevS = days[i - 1].shifts[empNo];
        const prevPm = prevS && prevS.includes('1230');
        if (prevPm && isAm) return false; // No PM -> AM
      }
    }
    return true;
  }

  function getVariance(stats) {
    const ams = assistants.map(a => stats[a.empNo].am);
    const pms = assistants.map(a => stats[a.empNo].pm);
    const diffs = assistants.map(a => Math.abs(stats[a.empNo].am - stats[a.empNo].pm));
    return {
      amVar: Math.max(...ams) - Math.min(...ams),
      pmVar: Math.max(...pms) - Math.min(...pms),
      maxDiff: Math.max(...diffs),
      totalDiff: diffs.reduce((sum, v) => sum + v, 0)
    };
  }

  // Iteratively attempt swaps between staff with high AM and staff with high PM
  let improved = true;
  let iterations = 0;

  while (improved && iterations < 100) {
    improved = false;
    iterations++;

    const curStats = getStats();
    const curVar = getVariance(curStats);

    if (curVar.amVar <= 1 && curVar.pmVar <= 1 && curVar.maxDiff <= 1) {
      break; // Already perfectly balanced!
    }

    // Find assistant with most AMs and assistant with most PMs
    let mostAmStaff = assistants[0];
    let mostPmStaff = assistants[0];
    assistants.forEach(a => {
      if (curStats[a.empNo].am > curStats[mostAmStaff.empNo].am) mostAmStaff = a;
      if (curStats[a.empNo].pm > curStats[mostPmStaff.empNo].pm) mostPmStaff = a;
    });

    // Attempt to swap on days where mostAmStaff has AM and mostPmStaff has PM
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const d = days[dayIdx];
      const s1 = d.shifts[mostAmStaff.empNo];
      const s2 = d.shifts[mostPmStaff.empNo];

      if (s1.includes('0730') && s2.includes('1230')) {
        // Test swap
        d.shifts[mostAmStaff.empNo] = '8H_1230-2130';
        d.shifts[mostPmStaff.empNo] = '8H_0730-1630';

        // Check if both still valid
        if (isValidScheduleForStaff(mostAmStaff.empNo) && isValidScheduleForStaff(mostPmStaff.empNo)) {
          const newStats = getStats();
          const newVar = getVariance(newStats);

          // Check if strictly better
          if (newVar.amVar <= curVar.amVar && newVar.pmVar <= curVar.pmVar && newVar.totalDiff < curVar.totalDiff) {
            improved = true;
            break;
          }
        }

        // Revert swap if not better
        d.shifts[mostAmStaff.empNo] = '8H_0730-1630';
        d.shifts[mostPmStaff.empNo] = '8H_1230-2130';
      }
    }
  }

  // Also try pairwise swaps across all assistants to bring maxDiff <= 1
  for (let pass = 0; pass < 20; pass++) {
    const curStats = getStats();
    let madeSwap = false;

    for (let i = 0; i < assistants.length; i++) {
      for (let j = 0; j < assistants.length; j++) {
        if (i === j) continue;
        const a1 = assistants[i];
        const a2 = assistants[j];

        const diff1 = curStats[a1.empNo].am - curStats[a1.empNo].pm;
        const diff2 = curStats[a2.empNo].am - curStats[a2.empNo].pm;

        // If a1 has surplus AMs and a2 has surplus PMs:
        if (diff1 > 0 && diff2 < 0) {
          for (let dIdx = 0; dIdx < days.length; dIdx++) {
            const d = days[dIdx];
            if (d.shifts[a1.empNo].includes('0730') && d.shifts[a2.empNo].includes('1230')) {
              d.shifts[a1.empNo] = '8H_1230-2130';
              d.shifts[a2.empNo] = '8H_0730-1630';

              if (isValidScheduleForStaff(a1.empNo) && isValidScheduleForStaff(a2.empNo)) {
                const nStats = getStats();
                const nVar = getVariance(nStats);
                const oVar = getVariance(curStats);
                if (nVar.amVar <= oVar.amVar && nVar.pmVar <= oVar.pmVar && nVar.totalDiff < oVar.totalDiff) {
                  madeSwap = true;
                  break;
                }
              }

              d.shifts[a1.empNo] = '8H_0730-1630';
              d.shifts[a2.empNo] = '8H_1230-2130';
            }
          }
        }
        if (madeSwap) break;
      }
      if (madeSwap) break;
    }
    if (!madeSwap) break;
  }

  // 4. Golden Cleaning Slot (14:00 - 15:30) Round Robin
  const cleaningCounts = {};
  assistants.forEach(a => cleaningCounts[a.empNo] = 0);

  days.forEach(d => {
    const workingAssistants = assistants.filter(a => d.shifts[a.empNo] !== 'RD');
    workingAssistants.sort((a, b) => {
      const cA = cleaningCounts[a.empNo];
      const cB = cleaningCounts[b.empNo];
      if (cA !== cB) return cA - cB;
      return a.empNo.localeCompare(b.empNo);
    });
    const chosen = workingAssistants[0];
    cleaningCounts[chosen.empNo]++;
    d.cleaningDuty = {
      empNo: chosen.empNo,
      nickname: chosen.nickname,
      time: '2:00 PM – 3:30 PM',
      task: 'Gondola Cleaning & Refilling'
    };
  });

  const finalStats = getStats();
  const finalVar = getVariance(finalStats);

  console.log(`\n=== RESULTS FOR ${year}-${month} (${totalDays} days) ===`);
  console.log(`AM Variance across assistants: ${finalVar.amVar} (Must be <= 1)`);
  console.log(`PM Variance across assistants: ${finalVar.pmVar} (Must be <= 1)`);
  console.log(`Max Diff |AM - PM|: ${finalVar.maxDiff} (Must be <= 1)`);

  let minAm = 99, minPm = 99;
  days.forEach(d => {
    const amCount = Object.values(d.shifts).filter(s => s.includes('0730')).length;
    const pmCount = Object.values(d.shifts).filter(s => s.includes('1230')).length;
    if (amCount < minAm) minAm = amCount;
    if (pmCount < minPm) minPm = pmCount;
  });

  console.log(`Min AM on floor: ${minAm}, Min PM on floor: ${minPm}`);
  assistants.forEach(a => {
    const st = finalStats[a.empNo];
    console.log(`${a.nickname.padEnd(12)}: AM=${st.am} PM=${st.pm} RD=${st.rd} Clean=${cleaningCounts[a.empNo]} Diff=|${st.am - st.pm}|`);
  });

  const passed = finalVar.amVar <= 1 && finalVar.pmVar <= 1 && finalVar.maxDiff <= 1 && minAm >= 3 && minPm >= 3;
  console.log(`Parity & Constraints Check: ${passed ? 'PASSED 100% (PERFECT)' : 'FAILED'}`);
}

for (let m = 1; m <= 12; m++) {
  testOptimizedParity(2026, m);
}
