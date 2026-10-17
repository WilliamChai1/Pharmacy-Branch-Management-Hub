// scratch/test_scheduler_parity2.js
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

function testSmartSolver(year, month) {
  const totalDays = new Date(year, month, 0).getDate();
  console.log(`\n==================================================`);
  console.log(`Testing Smart Solver for ${year}-${month} (${totalDays} days)`);
  console.log(`==================================================`);

  // Target Rest Days per teammate in this month:
  // In a month of 31 days, each teammate gets 4 or 5 RDs.
  // 7 assistants * 4.43 = ~31 total RDs. Exactly 1 assistant on RD per day!
  const assistants = teammates.filter(t => !t.isPharmacist); // 7 assistants
  const targetRds = Math.floor(totalDays / 7); // 4 for 28-31 days, some get 5

  const staffStats = {};
  teammates.forEach(t => {
    staffStats[t.empNo] = {
      empNo: t.empNo,
      nickname: t.nickname,
      amCount: 0,
      pmCount: 0,
      rdCount: 0,
      phCount: 0,
      cleaningCount: 0,
      consecutiveWorkDays: 0,
      consecutiveNights: 0,
      lastShiftType: null // 'AM', 'PM', 'RD', 'PH'
    };
  });

  const dailySchedule = [];

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[dateStr];

    const dayShifts = {};

    // ─────────────────────────────────────────────────────────────────────────
    // 1. William Chai (Fixed Anchor)
    // ─────────────────────────────────────────────────────────────────────────
    const william = staffStats['PMG00831'];
    if (isHoliday) {
      dayShifts['PMG00831'] = 'PH';
      william.phCount++;
      william.consecutiveWorkDays = 0;
      william.consecutiveNights = 0;
      william.lastShiftType = 'PH';
    } else if (dayOfWeek === 'Sunday') {
      dayShifts['PMG00831'] = 'RD';
      william.rdCount++;
      william.consecutiveWorkDays = 0;
      william.consecutiveNights = 0;
      william.lastShiftType = 'RD';
    } else if (dayOfWeek === 'Saturday') {
      dayShifts['PMG00831'] = '4H_0730-1130';
      william.amCount++;
      william.consecutiveWorkDays++;
      william.consecutiveNights = 0;
      william.lastShiftType = 'AM';
    } else {
      dayShifts['PMG00831'] = '8H_0730-1630';
      william.amCount++;
      william.consecutiveWorkDays++;
      william.consecutiveNights = 0;
      william.lastShiftType = 'AM';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Kenix Ling (Pharmacist Coverage)
    // ─────────────────────────────────────────────────────────────────────────
    const kenix = staffStats['PMG02963'];
    const isWilliamOffToday = (dayShifts['PMG00831'] === 'RD' || dayShifts['PMG00831'] === 'PH');

    // Check tomorrow for William
    const tomorrowDateObj = new Date(year, month - 1, d + 1);
    const tomorrowDayOfWeek = daysOfWeek[tomorrowDateObj.getDay()];
    const tomorrowDateStr = `${year}-${String(month).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
    const isWilliamOffTomorrow = (d < totalDays && (tomorrowDayOfWeek === 'Sunday' || !!HOLIDAYS_2026_SARAWAK[tomorrowDateStr]));

    if (isWilliamOffToday) {
      // Kenix covers Morning on Sundays and Public Holidays!
      dayShifts['PMG02963'] = '8H_0730-1630';
      kenix.amCount++;
      kenix.consecutiveWorkDays++;
      kenix.consecutiveNights = 0;
      kenix.lastShiftType = 'AM';
    } else if (isWilliamOffTomorrow) {
      // Tomorrow Kenix MUST do Morning! To prevent PM -> AM fatigue violation,
      // Kenix must NOT work PM today (Saturday). Kenix can take Saturday as RD or work Morning with William.
      // William is on 4H Saturday morning. Having Kenix on RD on Saturday gives Kenix rest before Sunday!
      // Or if Kenix needs RD, Saturday is ideal.
      dayShifts['PMG02963'] = 'RD';
      kenix.rdCount++;
      kenix.consecutiveWorkDays = 0;
      kenix.consecutiveNights = 0;
      kenix.lastShiftType = 'RD';
    } else if (dayOfWeek === 'Monday' && kenix.consecutiveWorkDays >= 1) {
      // Kenix's preferred RD is Monday
      dayShifts['PMG02963'] = 'RD';
      kenix.rdCount++;
      kenix.consecutiveWorkDays = 0;
      kenix.consecutiveNights = 0;
      kenix.lastShiftType = 'RD';
    } else if (kenix.consecutiveWorkDays >= 6 || kenix.consecutiveNights >= 3) {
      dayShifts['PMG02963'] = 'RD';
      kenix.rdCount++;
      kenix.consecutiveWorkDays = 0;
      kenix.consecutiveNights = 0;
      kenix.lastShiftType = 'RD';
    } else {
      // Kenix covers Night
      dayShifts['PMG02963'] = '8H_1230-2130';
      kenix.pmCount++;
      kenix.consecutiveWorkDays++;
      kenix.consecutiveNights++;
      kenix.lastShiftType = 'PM';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Assistants Shift Assignment (7 staff)
    // ─────────────────────────────────────────────────────────────────────────
    // Step A: Determine who gets Rest Day (RD) today.
    // Target: exactly 1 assistant on RD per day, or 2 if someone has >= 6 consecutive work days.
    // Score assistants for RD today:
    const assistantRdScores = assistants.map(a => {
      const st = staffStats[a.empNo];
      let score = 0;

      // Hard limits:
      if (st.consecutiveWorkDays >= 6) score += 10000;
      if (st.consecutiveNights >= 3) score += 5000; // After 3 nights, RD is the best bridge to AM

      // Preferred rest day matching
      if (a.restDayPref === dayOfWeek) score += 200;

      // Balance cumulative RDs: favor those with fewer RDs
      const expectedRdsSoFar = (d / totalDays) * targetRds;
      if (st.rdCount < expectedRdsSoFar) score += (expectedRdsSoFar - st.rdCount) * 100;
      else score -= (st.rdCount - expectedRdsSoFar) * 150;

      // Do not give RD two days in a row unless needed
      if (st.lastShiftType === 'RD') score -= 2000;

      return { assistant: a, score, stats: st };
    });

    assistantRdScores.sort((a, b) => b.score - a.score);

    // Pick 1 assistant (or more if mandatory >= 5000)
    let numRdsToday = 1;
    if (assistantRdScores.filter(s => s.score >= 5000).length > 1) {
      numRdsToday = assistantRdScores.filter(s => s.score >= 5000).length;
    }
    // Safety check: ensure at least 5 assistants work (total staff >= 7)
    if (assistants.length - numRdsToday < 5) numRdsToday = assistants.length - 5;

    for (let i = 0; i < numRdsToday; i++) {
      const chosen = assistantRdScores[i];
      dayShifts[chosen.assistant.empNo] = 'RD';
      chosen.stats.rdCount++;
      chosen.stats.consecutiveWorkDays = 0;
      chosen.stats.consecutiveNights = 0;
      chosen.stats.lastShiftType = 'RD';
    }

    // Working assistants today:
    const workingAssistants = assistants.filter(a => dayShifts[a.empNo] !== 'RD');

    // Step B: Target AM & PM assistants needed
    // William is AM on Mon-Sat (counts as 1 AM). Sunday/PH William is off.
    // Kenix is AM on Sunday/PH (counts as 1 AM), or PM on Mon-Fri (counts as 1 PM).
    const amPharmCount = (dayShifts['PMG00831'] === '8H_0730-1630' || dayShifts['PMG00831'] === '4H_0730-1130' ? 1 : 0)
                       + (dayShifts['PMG02963'] === '8H_0730-1630' ? 1 : 0);
    const pmPharmCount = (dayShifts['PMG02963'] === '8H_1230-2130' ? 1 : 0);

    // We target:
    // Total AM on floor: 4 (minimum 3)
    // Total PM on floor: 4 (minimum 3)
    // Available assistants: workingAssistants.length (normally 6)
    let neededAmAssistants = 4 - amPharmCount; // usually 4 - 1 = 3
    let neededPmAssistants = 4 - pmPharmCount; // usually 4 - 1 = 3 (or 4 - 0 = 4)

    // Adjust to match workingAssistants.length
    const totalWorking = workingAssistants.length;
    while (neededAmAssistants + neededPmAssistants > totalWorking) {
      if (neededAmAssistants + amPharmCount > neededPmAssistants + pmPharmCount) {
        neededAmAssistants--;
      } else {
        neededPmAssistants--;
      }
    }
    while (neededAmAssistants + neededPmAssistants < totalWorking) {
      if (neededAmAssistants + amPharmCount <= neededPmAssistants + pmPharmCount) {
        neededAmAssistants++;
      } else {
        neededPmAssistants++;
      }
    }

    // Step C: Assign AM vs PM to working assistants
    // Hard anti-fatigue rules:
    // 1. If lastShiftType === 'PM', staff CANNOT do AM today! (Forced PM)
    // 2. If consecutiveNights >= 3, staff CANNOT do PM today! (Forced AM)
    const forcedPm = [];
    const forcedAm = [];
    const flexible = [];

    workingAssistants.forEach(a => {
      const st = staffStats[a.empNo];
      if (st.lastShiftType === 'PM') {
        forcedPm.push(a);
      } else if (st.consecutiveNights >= 3) {
        forcedAm.push(a);
      } else {
        flexible.push(a);
      }
    });

    // Flexible assistants: sort by who needs AM more vs PM more
    // To achieve perfect parity:
    // We want amCount == pmCount.
    // If amCount < pmCount: desperately needs AM!
    // If amCount > pmCount: desperately needs PM!
    // Sort ascending by (amCount - pmCount). Lower means more in need of AM.
    flexible.sort((a, b) => {
      const diffA = staffStats[a.empNo].amCount - staffStats[a.empNo].pmCount;
      const diffB = staffStats[b.empNo].amCount - staffStats[b.empNo].pmCount;
      if (diffA !== diffB) return diffA - diffB;
      // Secondary: teammate with fewer total AM shifts gets AM
      return staffStats[a.empNo].amCount - staffStats[b.empNo].amCount;
    });

    const chosenAm = [...forcedAm];
    const chosenPm = [...forcedPm];

    // Distribute flexible
    flexible.forEach(a => {
      if (chosenAm.length < neededAmAssistants) {
        chosenAm.push(a);
      } else {
        chosenPm.push(a);
      }
    });

    // If forcedPm caused chosenPm to exceed neededPmAssistants or vice versa,
    // swap flexible if possible without violating anti-fatigue
    // Assign shifts
    chosenAm.forEach(a => {
      const st = staffStats[a.empNo];
      dayShifts[a.empNo] = '8H_0730-1630';
      st.amCount++;
      st.consecutiveWorkDays++;
      st.consecutiveNights = 0;
      st.lastShiftType = 'AM';
    });

    chosenPm.forEach(a => {
      const st = staffStats[a.empNo];
      dayShifts[a.empNo] = '8H_1230-2130';
      st.pmCount++;
      st.consecutiveWorkDays++;
      st.consecutiveNights++;
      st.lastShiftType = 'PM';
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Golden Cleaning Slot (14:00 - 15:30) Round Robin
    // ─────────────────────────────────────────────────────────────────────────
    // Exclude William and Pharmacist Kenix.
    // Pool is workingAssistants.
    workingAssistants.sort((a, b) => {
      const cA = staffStats[a.empNo].cleaningCount;
      const cB = staffStats[b.empNo].cleaningCount;
      if (cA !== cB) return cA - cB;
      // Random or stable tiebreaker
      return a.empNo.localeCompare(b.empNo);
    });

    const cleaningDutyStaff = workingAssistants[0];
    staffStats[cleaningDutyStaff.empNo].cleaningCount++;

    const totalAmFloor = Object.values(dayShifts).filter(s => s.includes('0730')).length;
    const totalPmFloor = Object.values(dayShifts).filter(s => s.includes('1230')).length;

    dailySchedule.push({
      day: d,
      date: dateStr,
      dayOfWeek,
      shifts: dayShifts,
      cleaningDuty: {
        empNo: cleaningDutyStaff.empNo,
        nickname: cleaningDutyStaff.nickname,
        time: '2:00 PM – 3:30 PM',
        task: 'Gondola Cleaning & Refilling'
      },
      amStaff: totalAmFloor,
      pmStaff: totalPmFloor
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Verification
  // ─────────────────────────────────────────────────────────────────────────
  let minAm = 99, minPm = 99;
  let antiFatigueViolations = 0;
  let maxNightStreak = 0;

  dailySchedule.forEach((d, idx) => {
    if (d.amStaff < minAm) minAm = d.amStaff;
    if (d.pmStaff < minPm) minPm = d.pmStaff;

    if (idx > 0) {
      const prev = dailySchedule[idx - 1];
      teammates.forEach(t => {
        const sPrev = prev.shifts[t.empNo];
        const sCur = d.shifts[t.empNo];
        if (sPrev && sPrev.includes('1230') && sCur && sCur.includes('0730')) {
          console.error(`FATIGUE VIOLATION on Day ${d.day}: ${t.nickname} had PM yesterday and AM today!`);
          antiFatigueViolations++;
        }
      });
    }
  });

  console.log(`\nManpower Density: Min AM on any day = ${minAm} (Target 4, Min Floor 3)`);
  console.log(`Manpower Density: Min PM on any day = ${minPm} (Target 4, Min Floor 3)`);
  console.log(`Anti-Fatigue Violations (PM -> AM next morning): ${antiFatigueViolations}`);

  console.log('\n--- Teammate Shift Parity & Equity ---');
  const assistantStats = assistants.map(t => staffStats[t.empNo]);
  assistantStats.forEach(st => {
    console.log(`${st.nickname.padEnd(12)}: AM=${st.amCount}, PM=${st.pmCount}, RD=${st.rdCount}, Clean=${st.cleaningCount}, Diff=|${st.amCount - st.pmCount}|`);
  });

  const amCounts = assistantStats.map(s => s.amCount);
  const pmCounts = assistantStats.map(s => s.pmCount);
  const cleanCounts = assistantStats.map(s => s.cleaningCount);
  const amVariance = Math.max(...amCounts) - Math.min(...amCounts);
  const pmVariance = Math.max(...pmCounts) - Math.min(...pmCounts);
  const cleanVariance = Math.max(...cleanCounts) - Math.min(...cleanCounts);

  console.log(`AM Variance across assistants: ${amVariance} (Must be <= 1)`);
  console.log(`PM Variance across assistants: ${pmVariance} (Must be <= 1)`);
  console.log(`Cleaning Slots Variance: ${cleanVariance} (Max diff between assistants)`);
  console.log(`Parity Check: ${amVariance <= 1 && pmVariance <= 1 && antiFatigueViolations === 0 ? 'PASSED 100%' : 'FAILED'}`);
}

testSmartSolver(2026, 10); // 31 days
testSmartSolver(2026, 11); // 30 days
testSmartSolver(2026, 2);  // 28 days
