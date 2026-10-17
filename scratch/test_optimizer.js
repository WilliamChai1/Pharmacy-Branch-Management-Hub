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

const teammatesKS01 = [
  { empNo: 'PMG00831', nickname: 'WILLIAM', empName: 'CHAI YEE SIAN', position: 'Pharmacist', isPharmacist: true, scheduleMode: 'Fixed' },
  { empNo: 'PMG00723', nickname: 'TING', empName: 'TING KWANG YU', position: 'Branch Manager', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Sunday' },
  { empNo: 'PMG02963', nickname: 'KENIX', empName: 'KENIX LING WANG YIING', position: 'Pharmacist', isPharmacist: true, scheduleMode: 'Rotating', restDayPref: 'Monday', halfDayPref: 'Sunday' },
  { empNo: 'PMG01294', nickname: 'LOUNA', empName: 'HANIESHA LOUNA ANAK DAGENG', position: 'Assistant Branch Manager', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Thursday', halfDayPref: 'Wednesday' },
  { empNo: 'PMG02694', nickname: 'PENNY', empName: 'JONG PEI CHOO', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Tuesday', halfDayPref: 'Monday' },
  { empNo: 'PMG01780', nickname: 'FIONA', empName: 'FIONA FIENA ANAK JAMES', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Thursday', halfDayPref: 'Wednesday' },
  { empNo: 'PMG02070', nickname: 'NURHAFIZAH', empName: 'NURHAFIZAH BINTI PAULI', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Monday' },
  { empNo: 'PMG03375', nickname: 'FARIZIN', empName: 'MUHAMMAD NUR FARIZIN BIN ABDULLAH', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Friday', halfDayPref: 'Tuesday' },
  { empNo: 'PMG03033', nickname: 'CHRISTINA', empName: 'CHRISTINA LEE YING YING', position: 'Provisional Registered Pharmacist', isPharmacist: true, scheduleMode: 'Rotating', restDayPref: 'Saturday', halfDayPref: 'Friday' }
];

function solveSinglePass(year, month, teammates, randomness = 0) {
  const totalDays = new Date(year, month, 0).getDate();
  const william = teammates.find(t => t.empNo === 'PMG00831' || t.nickname === 'WILLIAM');
  const rotatingPool = teammates.filter(t => t.empNo !== 'PMG00831' && t.nickname !== 'WILLIAM');

  const stats = {};
  teammates.forEach(t => {
    stats[t.empNo] = {
      am: 0,
      pm: 0,
      rd: 0,
      clean: 0,
      consecutiveNights: 0,
      consecutiveWorkingDays: 0,
      lastShift: null,
      fatigueViolations: 0
    };
  });

  const cleaningCounts = {};
  rotatingPool.forEach(t => { cleaningCounts[t.empNo] = 0; });
  const dailySchedule = [];

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[dateStr];
    const dayShifts = {};

    // 1. William Chai (Fixed Anchor)
    if (william) {
      if (isHoliday) {
        dayShifts[william.empNo] = 'PH';
        stats[william.empNo].rd++;
        stats[william.empNo].lastShift = 'PH';
      } else if (dayOfWeek === 'Sunday') {
        dayShifts[william.empNo] = 'RD';
        stats[william.empNo].rd++;
        stats[william.empNo].lastShift = 'RD';
      } else if (dayOfWeek === 'Saturday') {
        dayShifts[william.empNo] = '4H_0730-1130';
        stats[william.empNo].am++;
        stats[william.empNo].lastShift = 'AM';
      } else {
        dayShifts[william.empNo] = '8H_0730-1630';
        stats[william.empNo].am++;
        stats[william.empNo].lastShift = 'AM';
      }
    }

    const isWilliamOffToday = !william || dayShifts[william.empNo] === 'RD' || dayShifts[william.empNo] === 'PH';

    // 2. Identify Rest Days (RD)
    const availableStaff = [];

    rotatingPool.forEach(tm => {
      const st = stats[tm.empNo];
      let mustRest = false;
      let prefersRest = (dayOfWeek === tm.restDayPref);

      if (st.consecutiveWorkingDays >= 6) mustRest = true;
      if (st.consecutiveNights >= 3 && st.lastShift === 'PM') mustRest = true;

      if (mustRest || prefersRest) {
        dayShifts[tm.empNo] = 'RD';
        st.rd++;
        st.lastShift = 'RD';
        st.consecutiveNights = 0;
        st.consecutiveWorkingDays = 0;
      } else {
        availableStaff.push(tm);
      }
    });

    // Priority 2: Ensure minimum 3 staff per shift (Hard Floor: Daily Working Staff >= 6)
    let dailyWorkingStaff = availableStaff.length + (isWilliamOffToday ? 0 : 1);
    if (dailyWorkingStaff < 6) {
      const rested = rotatingPool.filter(tm => dayShifts[tm.empNo] === 'RD' && stats[tm.empNo].consecutiveWorkingDays < 6 && !(stats[tm.empNo].consecutiveNights >= 3 && stats[tm.empNo].lastShift === 'PM'));
      rested.sort((a, b) => stats[b.empNo].rd - stats[a.empNo].rd);
      while (dailyWorkingStaff < 6 && rested.length > 0) {
        const reclaimed = rested.shift();
        delete dayShifts[reclaimed.empNo];
        stats[reclaimed.empNo].rd--;
        availableStaff.push(reclaimed);
        dailyWorkingStaff++;
      }
    }

    // Dynamic Headcount Allocation:
    // If Daily_Available_Staff == 6: Strictly 3 Morning, 3 Night
    // If Daily_Available_Staff == 7: 4 Morning + 3 Night or 3 Morning + 4 Night
    // If Daily_Available_Staff == 8: 4 Morning + 4 Night
    let targetTotalAm = 4;
    let targetTotalPm = 4;

    if (dailyWorkingStaff <= 6) {
      targetTotalAm = 3;
      targetTotalPm = 3;
    } else if (dailyWorkingStaff === 7) {
      // Balance dynamically based on rotating pool's cumulative AM vs PM need
      let totalRotAmSoFar = 0, totalRotPmSoFar = 0;
      rotatingPool.forEach(tm => {
        totalRotAmSoFar += stats[tm.empNo].am;
        totalRotPmSoFar += stats[tm.empNo].pm;
      });
      // Favor AM to keep parity balanced
      targetTotalAm = totalRotAmSoFar <= totalRotPmSoFar ? 4 : 3;
      targetTotalPm = 7 - targetTotalAm;
    } else if (dailyWorkingStaff === 8) {
      targetTotalAm = 4;
      targetTotalPm = 4;
    } else {
      targetTotalAm = 4;
      targetTotalPm = dailyWorkingStaff - 4;
    }

    const targetRotatingAm = Math.max(isWilliamOffToday ? 3 : 2, targetTotalAm - (isWilliamOffToday ? 0 : 1));

    // Anti-fatigue: previous shift must not be PM for AM shift
    let canWorkAm = availableStaff.filter(tm => stats[tm.empNo].lastShift !== 'PM');
    let mustWorkPm = availableStaff.filter(tm => stats[tm.empNo].lastShift === 'PM');

    // Hard floor guard: if canWorkAm + William < 3, we must promote from mustWorkPm with lowest consecutive nights
    while ((canWorkAm.length + (isWilliamOffToday ? 0 : 1)) < 3 && mustWorkPm.length > 0) {
      mustWorkPm.sort((a, b) => stats[a.empNo].consecutiveNights - stats[b.empNo].consecutiveNights);
      const promoted = mustWorkPm.shift();
      canWorkAm.push(promoted);
    }

    // Pharmacist coverage priority when William is off
    if (isWilliamOffToday) {
      const rxCandidate = canWorkAm.find(tm => tm.isPharmacist || (tm.position && tm.position.includes('Pharmacist')));
      if (rxCandidate) {
        const idx = canWorkAm.indexOf(rxCandidate);
        if (idx > 0) {
          canWorkAm.splice(idx, 1);
          canWorkAm.unshift(rxCandidate);
        }
      }
    }

    // Sort canWorkAm by Half day preference & Parity need
    canWorkAm.sort((a, b) => {
      const aWantsHalf = (a.halfDayPref === dayOfWeek ||
        (a.nickname === 'PENNY' && (dayOfWeek === 'Monday' || dayOfWeek === 'Wednesday' || dayOfWeek === 'Saturday')) ||
        (a.nickname === 'LOUNA' && dayOfWeek === 'Wednesday') ||
        (a.nickname === 'FIONA' && dayOfWeek === 'Wednesday') ||
        (a.nickname === 'FARIZIN' && dayOfWeek === 'Tuesday') ||
        (a.nickname === 'KENIX' && dayOfWeek === 'Sunday') ||
        (a.nickname === 'CHRISTINA' && dayOfWeek === 'Friday'));
      const bWantsHalf = (b.halfDayPref === dayOfWeek ||
        (b.nickname === 'PENNY' && (dayOfWeek === 'Monday' || dayOfWeek === 'Wednesday' || dayOfWeek === 'Saturday')) ||
        (b.nickname === 'LOUNA' && dayOfWeek === 'Wednesday') ||
        (b.nickname === 'FIONA' && dayOfWeek === 'Wednesday') ||
        (b.nickname === 'FARIZIN' && dayOfWeek === 'Tuesday') ||
        (b.nickname === 'KENIX' && dayOfWeek === 'Sunday') ||
        (b.nickname === 'CHRISTINA' && dayOfWeek === 'Friday'));

      // If one teammate has significantly fewer AMs than another, balance shift parity
      const amDiff = stats[a.empNo].am - stats[b.empNo].am;
      if (Math.abs(amDiff) >= 2) {
        return amDiff;
      }

      if (aWantsHalf && !bWantsHalf) return -1;
      if (!aWantsHalf && bWantsHalf) return 1;

      const diffA = (stats[a.empNo].am - stats[a.empNo].pm) + (randomness > 0 ? (Math.random() * randomness - randomness / 2) : 0);
      const diffB = (stats[b.empNo].am - stats[b.empNo].pm);
      if (diffA !== diffB) return diffA - diffB;
      return stats[a.empNo].am - stats[b.empNo].am;
    });

    const numAm = Math.min(targetRotatingAm, canWorkAm.length);
    const assignedAm = canWorkAm.slice(0, numAm);
    const assignedPm = [...mustWorkPm, ...canWorkAm.slice(numAm)];

    assignedAm.forEach(tm => {
      const st = stats[tm.empNo];
      let shiftCode = '8H_0730-1630';
      if (tm.nickname === 'PENNY' && dayOfWeek === 'Monday') shiftCode = '4H_0730-1130';
      else if (tm.nickname === 'LOUNA' && dayOfWeek === 'Wednesday') shiftCode = '4H_0730-1130';
      else if (tm.nickname === 'FIONA' && dayOfWeek === 'Wednesday') shiftCode = '4H_0730-1130';
      else if (tm.nickname === 'FARIZIN' && dayOfWeek === 'Tuesday') shiftCode = '4H_0730-1130';
      else if (tm.nickname === 'KENIX' && dayOfWeek === 'Sunday') shiftCode = '4H_0730-1130';
      else if (tm.nickname === 'CHRISTINA' && dayOfWeek === 'Friday') shiftCode = '4H_0730-1130';

      dayShifts[tm.empNo] = shiftCode;
      st.am++;
      st.lastShift = 'AM';
      st.consecutiveNights = 0;
      st.consecutiveWorkingDays++;
    });

    assignedPm.forEach(tm => {
      const st = stats[tm.empNo];
      dayShifts[tm.empNo] = '8H_1230-2130';
      st.pm++;
      st.lastShift = 'PM';
      st.consecutiveNights++;
      st.consecutiveWorkingDays++;
    });

    // Cleaning duty
    const onDutyRotating = rotatingPool.filter(tm => {
      const s = dayShifts[tm.empNo];
      return s && s !== 'RD' && s !== 'PH' && s !== 'OFF';
    });

    let cleaner = null;
    if (onDutyRotating.length > 0) {
      onDutyRotating.sort((a, b) => {
        const cA = cleaningCounts[a.empNo] || 0;
        const cB = cleaningCounts[b.empNo] || 0;
        if (cA !== cB) return cA - cB;
        return a.empNo.localeCompare(b.empNo);
      });
      cleaner = onDutyRotating[0];
      cleaningCounts[cleaner.empNo] = (cleaningCounts[cleaner.empNo] || 0) + 1;
    }

    const dayAmCount = (isWilliamOffToday ? 0 : 1) + assignedAm.length;
    const dayPmCount = assignedPm.length;

    dailySchedule.push({
      day: d,
      date: dateStr,
      dayOfWeek,
      shifts: dayShifts,
      amCount: dayAmCount,
      pmCount: dayPmCount,
      workingTotal: dayAmCount + dayPmCount,
      cleaningDuty: cleaner ? { empNo: cleaner.empNo, nickname: cleaner.nickname } : null
    });
  }

  // Calculate Variance across rotating pool
  const amCounts = rotatingPool.map(t => stats[t.empNo].am);
  const pmCounts = rotatingPool.map(t => stats[t.empNo].pm);
  const amSpread = Math.max(...amCounts) - Math.min(...amCounts);
  const pmSpread = Math.max(...pmCounts) - Math.min(...pmCounts);
  const score = amSpread + pmSpread;

  return { dailySchedule, stats, cleaningCounts, amSpread, pmSpread, score };
}

console.log('Testing deterministic pass:');
const dRes = solveSinglePass(2026, 10, teammatesKS01, 0);
teammatesKS01.filter(t => t.nickname !== 'WILLIAM').forEach(t => {
  const s = dRes.stats[t.empNo];
  console.log(`${t.nickname.padEnd(12)}: AM=${s.am}, PM=${s.pm}, Clean=${dRes.cleaningCounts[t.empNo]}`);
});
console.log(`AM Spread: ${dRes.amSpread}, PM Spread: ${dRes.pmSpread}, Total Score: ${dRes.score}`);

console.log('\nTesting multi-pass optimization (20 passes):');
let best = dRes;
for (let i = 0; i < 20; i++) {
  const cand = solveSinglePass(2026, 10, teammatesKS01, 0.8);
  if (cand.score < best.score) {
    best = cand;
  }
}
console.log('Best Run:');
teammatesKS01.filter(t => t.nickname !== 'WILLIAM').forEach(t => {
  const s = best.stats[t.empNo];
  console.log(`${t.nickname.padEnd(12)}: AM=${s.am}, PM=${s.pm}, Clean=${best.cleaningCounts[t.empNo]}`);
});
console.log(`Best AM Spread: ${best.amSpread}, Best PM Spread: ${best.pmSpread}, Score: ${best.score}`);
