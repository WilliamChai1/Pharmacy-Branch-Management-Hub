const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HOLIDAYS_2026_SARAWAK = {
  '2026-10-10': "Sarawak Governor's Birthday"
};

// Simulate multiple teammates preferring Saturday off
const teammatesWithClash = [
  { empNo: 'PMG00831', nickname: 'WILLIAM', empName: 'CHAI YEE SIAN', position: 'Pharmacist', isPharmacist: true, scheduleMode: 'Fixed' },
  { empNo: 'PMG00723', nickname: 'TING', empName: 'TING KWANG YU', position: 'Branch Manager', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Saturday' },
  { empNo: 'PMG02963', nickname: 'KENIX', empName: 'KENIX LING WANG YIING', position: 'Pharmacist', isPharmacist: true, scheduleMode: 'Rotating', restDayPref: 'Monday', halfDayPref: 'Sunday' },
  { empNo: 'PMG01294', nickname: 'LOUNA', empName: 'HANIESHA LOUNA ANAK DAGENG', position: 'Assistant Branch Manager', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Thursday', halfDayPref: 'Wednesday' },
  { empNo: 'PMG02694', nickname: 'PENNY', empName: 'JONG PEI CHOO', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Saturday', halfDayPref: 'Monday' },
  { empNo: 'PMG01780', nickname: 'FIONA', empName: 'FIONA FIENA ANAK JAMES', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Thursday', halfDayPref: 'Wednesday' },
  { empNo: 'PMG02070', nickname: 'NURHAFIZAH', empName: 'NURHAFIZAH BINTI PAULI', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Monday' },
  { empNo: 'PMG03375', nickname: 'FARIZIN', empName: 'MUHAMMAD NUR FARIZIN BIN ABDULLAH', position: 'Staff', isPharmacist: false, scheduleMode: 'Rotating', restDayPref: 'Saturday', halfDayPref: 'Tuesday' },
  { empNo: 'PMG03033', nickname: 'CHRISTINA', empName: 'CHRISTINA LEE YING YING', position: 'Provisional Registered Pharmacist', isPharmacist: true, scheduleMode: 'Rotating', restDayPref: 'Saturday', halfDayPref: 'Friday' }
];

function solveWithSoftConstraints(year, month, teammates) {
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
      lastShift: null
    };
  });

  const cleaningCounts = {};
  rotatingPool.forEach(t => { cleaningCounts[t.empNo] = 0; });
  const dailySchedule = [];
  const bottlenecks = [];

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

    // 2. Identify Rest Days
    const availableStaff = [];

    rotatingPool.forEach(tm => {
      const st = stats[tm.empNo];
      let mustRest = false;
      const prefersRest = (dayOfWeek === tm.restDayPref);

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

    // Flexible Soft-Constraint Relaxation:
    // Only reclaim if working staff is critically low (< 4 staff, meaning even 2/2 is impossible)
    let dailyWorkingStaff = availableStaff.length + (isWilliamOffToday ? 0 : 1);
    if (dailyWorkingStaff < 4) {
      const rested = rotatingPool.filter(tm => dayShifts[tm.empNo] === 'RD' && stats[tm.empNo].consecutiveWorkingDays < 6 && !(stats[tm.empNo].consecutiveNights >= 3 && stats[tm.empNo].lastShift === 'PM'));
      rested.sort((a, b) => stats[b.empNo].rd - stats[a.empNo].rd);
      while (dailyWorkingStaff < 4 && rested.length > 0) {
        const reclaimed = rested.shift();
        delete dayShifts[reclaimed.empNo];
        stats[reclaimed.empNo].rd--;
        availableStaff.push(reclaimed);
        dailyWorkingStaff++;
      }
    }

    // Dynamic Headcount Allocation with Soft-Constraint Handling:
    // If dailyWorkingStaff == 5: Automatically assign 3 to Morning (critical) and 2 to Night
    let targetTotalAm = 4;
    let targetTotalPm = 4;

    if (dailyWorkingStaff <= 4) {
      targetTotalAm = Math.ceil(dailyWorkingStaff / 2);
      targetTotalPm = dailyWorkingStaff - targetTotalAm;
    } else if (dailyWorkingStaff === 5) {
      targetTotalAm = 3;
      targetTotalPm = 2;
    } else if (dailyWorkingStaff === 6) {
      targetTotalAm = 3;
      targetTotalPm = 3;
    } else if (dailyWorkingStaff === 7) {
      let totalRotAmSoFar = 0, totalRotPmSoFar = 0;
      rotatingPool.forEach(tm => {
        totalRotAmSoFar += stats[tm.empNo].am;
        totalRotPmSoFar += stats[tm.empNo].pm;
      });
      targetTotalAm = totalRotAmSoFar <= totalRotPmSoFar ? 4 : 3;
      targetTotalPm = 7 - targetTotalAm;
    } else if (dailyWorkingStaff === 8) {
      targetTotalAm = 4;
      targetTotalPm = 4;
    } else {
      targetTotalAm = 4;
      targetTotalPm = dailyWorkingStaff - 4;
    }

    const targetRotatingAm = Math.max(0, targetTotalAm - (isWilliamOffToday ? 0 : 1));

    // Anti-fatigue check
    let canWorkAm = availableStaff.filter(tm => stats[tm.empNo].lastShift !== 'PM');
    let mustWorkPm = availableStaff.filter(tm => stats[tm.empNo].lastShift === 'PM');

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

    // Sort canWorkAm: preferences first, then parity balance
    canWorkAm.sort((a, b) => {
      const aWantsHalf = (a.halfDayPref === dayOfWeek);
      const bWantsHalf = (b.halfDayPref === dayOfWeek);
      if (aWantsHalf && !bWantsHalf) return -1;
      if (!aWantsHalf && bWantsHalf) return 1;

      const diffA = stats[a.empNo].am - stats[a.empNo].pm;
      const diffB = stats[b.empNo].am - stats[b.empNo].pm;
      if (diffA !== diffB) return diffA - diffB;
      return stats[a.empNo].am - stats[b.empNo].am;
    });

    const numAm = Math.min(targetRotatingAm, canWorkAm.length);
    const assignedAm = canWorkAm.slice(0, numAm);
    const assignedPm = [...mustWorkPm, ...canWorkAm.slice(numAm)];

    assignedAm.forEach(tm => {
      const st = stats[tm.empNo];
      let shiftCode = '8H_0730-1630';
      if (tm.halfDayPref === dayOfWeek) shiftCode = '4H_0730-1130';
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

    const dayAmCount = (isWilliamOffToday ? 0 : 1) + assignedAm.length;
    const dayPmCount = assignedPm.length;
    const workingTotal = dayAmCount + dayPmCount;

    const isShortage = dayAmCount < 3 || dayPmCount < 3;
    let bottleneckInfo = null;

    if (isShortage) {
      const restTeammates = teammates.filter(t => dayShifts[t.empNo] === 'RD' || dayShifts[t.empNo] === 'PH');
      const shortageShift = dayAmCount < 3 ? 'Morning Shift' : 'Night Shift';
      const deficit = dayAmCount < 3 ? (3 - dayAmCount) : (3 - dayPmCount);

      bottleneckInfo = {
        day: d,
        date: dateStr,
        dayOfWeek,
        workingTotal,
        amCount: dayAmCount,
        pmCount: dayPmCount,
        shortageShift,
        deficit,
        restStaff: restTeammates.map(t => t.nickname),
        suggestion: `Recommend moving 1 rest day to Friday or Sunday to achieve minimum 3-staff ${shortageShift.toLowerCase()} coverage.`
      };
      bottlenecks.push(bottleneckInfo);
    }

    dailySchedule.push({
      day: d,
      date: dateStr,
      dayOfWeek,
      shifts: dayShifts,
      amCount: dayAmCount,
      pmCount: dayPmCount,
      workingTotal,
      bottleneck: bottleneckInfo
    });
  }

  return { dailySchedule, bottlenecks };
}

const res = solveWithSoftConstraints(2026, 10, teammatesWithClash);
console.log(`Total Days Simulated: ${res.dailySchedule.length}`);
console.log(`Bottlenecks Detected: ${res.bottlenecks.length}`);
res.bottlenecks.forEach(b => {
  console.log(`\n📅 ${b.dayOfWeek}, ${b.day} Oct 2026 (${b.date}):`);
  console.log(`   Staff on Rest Day: ${b.restStaff.join(', ')} (${b.restStaff.length} off)`);
  console.log(`   Shift Breakdown: Total working: ${b.workingTotal} staff -> Morning: ${b.amCount}, Night: ${b.pmCount} (Deficit: -${b.deficit} on ${b.shortageShift})`);
  console.log(`   💡 Actionable Suggestion: ${b.suggestion}`);
});
