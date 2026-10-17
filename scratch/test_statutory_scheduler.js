// scratch/test_statutory_scheduler.js
// Cap PM assignment to at most 3 or 4 to guarantee 0 turnaround fatigue violations
const HOLIDAYS_2026_SARAWAK = {
  '2026-01-01': "New Year's Day",
  '2026-10-10': "Sarawak Governor's Birthday"
};

const DEFAULT_KS01_TEAMMATES = [
  {
    empNo: 'PMG00831',
    nickname: 'WILLIAM',
    empName: 'CHAI YEE SIAN',
    position: 'Pharmacist',
    isPharmacist: true,
    scheduleMode: 'Fixed',
    race: 'Chinese',
    shiftPref: 'Morning Only',
    restDayPref: 'Sunday',
    halfDayPref: 'Saturday Morning (4H)',
  },
  {
    empNo: 'PMG00723',
    nickname: 'TING',
    empName: 'TING KWANG YU',
    position: 'Branch Manager',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Flexible',
    restDayPref: 'Sunday',
    halfDayPref: 'Wednesday Morning (4H)',
  },
  {
    empNo: 'PMG02963',
    nickname: 'KENIX',
    empName: 'KENIX LING WANG YIING',
    position: 'Pharmacist',
    isPharmacist: true,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Flexible',
    restDayPref: 'Monday',
    halfDayPref: 'Sunday Morning (4H)',
  },
  {
    empNo: 'PMG01294',
    nickname: 'LOUNA',
    empName: 'HANIESHA LOUNA ANAK DAGENG',
    position: 'Assistant Branch Manager',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Iban / Bidayuh',
    shiftPref: 'Flexible',
    restDayPref: 'Thursday',
    halfDayPref: 'Wednesday Morning (4H)',
  },
  {
    empNo: 'PMG02694',
    nickname: 'PENNY',
    empName: 'JONG PEI CHOO',
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Morning Preferred',
    restDayPref: 'Tuesday',
    halfDayPref: 'Monday Morning (4H)',
  },
  {
    empNo: 'PMG01780',
    nickname: 'FIONA',
    empName: 'FIONA FIENA ANAK JAMES',
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Iban / Bidayuh',
    shiftPref: 'Flexible',
    restDayPref: 'Thursday',
    halfDayPref: 'Wednesday Morning (4H)',
  },
  {
    empNo: 'PMG02070',
    nickname: 'NURHAFIZAH',
    empName: 'NURHAFIZAH BINTI PAULI',
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Malay',
    shiftPref: 'Flexible',
    restDayPref: 'Monday',
    halfDayPref: 'Tuesday Morning (4H)',
  },
  {
    empNo: 'PMG03375',
    nickname: 'FARIZIN',
    empName: 'MUHAMMAD NUR FARIZIN BIN ABDULLAH',
    position: 'Staff',
    isPharmacist: false,
    scheduleMode: 'Rotating',
    race: 'Malay',
    shiftPref: 'Flexible',
    restDayPref: 'Friday',
    halfDayPref: 'Tuesday Morning (4H)',
  },
  {
    empNo: 'PMG03033',
    nickname: 'CHRISTINA',
    empName: 'CHRISTINA LEE YING YING',
    position: 'Provisional Registered Pharmacist',
    isPharmacist: true,
    scheduleMode: 'Rotating',
    race: 'Chinese',
    shiftPref: 'Flexible',
    restDayPref: 'Saturday',
    halfDayPref: 'Friday Morning (4H)',
  }
];

function getMonthlyCalendarWeeks(year, month, totalDays) {
  const weeks = [];
  let currentWeek = [];
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();
    currentWeek.push(d);
    if (dayOfWeek === 0 || d === totalDays) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  }
  return weeks;
}

function runStatutoryScheduleGenerator(year, month, totalDays) {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const william = DEFAULT_KS01_TEAMMATES.find(t => t.empNo === 'PMG00831');
  const rotatingPool = DEFAULT_KS01_TEAMMATES.filter(t => t.empNo !== 'PMG00831');
  const calendarWeeks = getMonthlyCalendarWeeks(year, month, totalDays);

  const dailyAssigned = {};
  for (let d = 1; d <= totalDays; d++) {
    dailyAssigned[d] = {};
  }

  // 1. Lock William's Fixed Anchor schedule
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[dateStr];

    if (isHoliday) {
      dailyAssigned[d][william.empNo] = 'PH';
    } else if (dayOfWeek === 'Sunday') {
      dailyAssigned[d][william.empNo] = 'RD';
    } else if (dayOfWeek === 'Saturday') {
      dailyAssigned[d][william.empNo] = '4H_0730-1130';
    } else {
      dailyAssigned[d][william.empNo] = '8H_0730-1630';
    }
  }

  // 2. Pre-assign exactly 1 Rest Day (RD) and 1 Half Day (HD) per calendar week for each rotating teammate
  calendarWeeks.forEach((weekDays, wIdx) => {
    rotatingPool.forEach(tm => {
      let chosenRd = null;
      let chosenHd = null;

      if (wIdx === 0) {
        // W1: Days 1-4 (Thu-Sun)
        if (tm.nickname === 'LOUNA') { chosenRd = 1; chosenHd = 3; }
        else if (tm.nickname === 'FIONA') { chosenRd = 1; chosenHd = 2; }
        else if (tm.nickname === 'FARIZIN') { chosenRd = 2; chosenHd = 4; }
        else if (tm.nickname === 'CHRISTINA') { chosenRd = 3; chosenHd = 2; }
        else if (tm.nickname === 'TING') { chosenRd = 4; chosenHd = 1; }
        else if (tm.nickname === 'KENIX') { chosenRd = 2; chosenHd = 4; }
        else if (tm.nickname === 'PENNY') { chosenRd = 3; chosenHd = 1; }
        else if (tm.nickname === 'NURHAFIZAH') { chosenRd = 2; chosenHd = 1; }
      } else if (wIdx === 4) {
        // W5: Days 26-31 (Mon-Sat)
        if (tm.nickname === 'NURHAFIZAH') { chosenRd = 26; chosenHd = 28; }
        else if (tm.nickname === 'KENIX') { chosenRd = 26; chosenHd = 28; }
        else if (tm.nickname === 'PENNY') { chosenRd = 27; chosenHd = 26; }
        else if (tm.nickname === 'FARIZIN') { chosenRd = 30; chosenHd = 27; }
        else if (tm.nickname === 'LOUNA') { chosenRd = 29; chosenHd = 28; }
        else if (tm.nickname === 'FIONA') { chosenRd = 29; chosenHd = 28; }
        else if (tm.nickname === 'CHRISTINA') { chosenRd = 31; chosenHd = 30; }
        else if (tm.nickname === 'TING') { chosenRd = 29; chosenHd = 28; }
      } else {
        // Full weeks W2, W3, W4 (Days 5-11, 12-18, 19-25)
        weekDays.forEach(d => {
          const dow = daysOfWeek[new Date(year, month - 1, d).getDay()];
          if (dow === tm.restDayPref) chosenRd = d;
          const hdPrefDow = tm.halfDayPref ? tm.halfDayPref.split(' ')[0] : '';
          if (dow === hdPrefDow) chosenHd = d;
        });

        // Ting HD on Tuesday
        if (!chosenHd) {
          const tue = weekDays.find(d => daysOfWeek[new Date(year, month - 1, d).getDay()] === 'Tuesday');
          if (tue) chosenHd = tue;
        }
      }

      dailyAssigned[chosenRd][tm.empNo] = 'RD';
      dailyAssigned[chosenHd][tm.empNo] = '4H_0730-1130';
    });
  });

  function solvePass(randomness = 0) {
    const stats = {};
    DEFAULT_KS01_TEAMMATES.forEach(tm => {
      stats[tm.empNo] = {
        mCount: 0,
        nCount: 0,
        rdCount: 0,
        hdCount: 0,
        cleanCount: 0,
        lastShift: null,
        consecutiveNights: 0,
        pmToAmFatigueCount: 0
      };
    });

    const cleaningCounts = {};
    rotatingPool.forEach(tm => { cleaningCounts[tm.empNo] = 0; });
    const dailySchedule = [];
    const tempAssigned = {};

    for (let d = 1; d <= totalDays; d++) {
      tempAssigned[d] = { ...dailyAssigned[d] };
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = daysOfWeek[dateObj.getDay()];
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayShifts = tempAssigned[d];

      const wShift = dayShifts[william.empNo];
      if (wShift === 'RD' || wShift === 'PH') {
        stats[william.empNo].rdCount++;
        stats[william.empNo].lastShift = wShift;
      } else if (wShift && wShift.includes('4H')) {
        stats[william.empNo].mCount++;
        stats[william.empNo].hdCount++;
        stats[william.empNo].lastShift = 'AM';
      } else {
        stats[william.empNo].mCount++;
        stats[william.empNo].lastShift = 'AM';
      }

      const isWilliamOffToday = wShift === 'RD' || wShift === 'PH';

      const needsFullShift = [];
      rotatingPool.forEach(tm => {
        const s = dayShifts[tm.empNo];
        if (s === 'RD' || s === 'PH') {
          stats[tm.empNo].rdCount++;
          stats[tm.empNo].lastShift = 'RD';
          stats[tm.empNo].consecutiveNights = 0;
        } else if (s && s.includes('4H')) {
          stats[tm.empNo].mCount++;
          stats[tm.empNo].hdCount++;
          stats[tm.empNo].lastShift = 'AM';
          stats[tm.empNo].consecutiveNights = 0;
        } else {
          needsFullShift.push(tm);
        }
      });

      const currentMorningCount = (isWilliamOffToday ? 0 : 1) + rotatingPool.filter(tm => dayShifts[tm.empNo] && dayShifts[tm.empNo].includes('4H')).length;
      const totalWorkingToday = currentMorningCount + needsFullShift.length;

      // Ensure Night shift gets strictly 3 (or max 4) staff
      let targetPmFull = 3;
      let targetAmFull = needsFullShift.length - targetPmFull;
      if (targetAmFull < (3 - currentMorningCount)) {
        targetAmFull = Math.max(0, 3 - currentMorningCount);
        targetPmFull = needsFullShift.length - targetAmFull;
      }

      // Determine canWorkAm
      let canWorkAm = needsFullShift.filter(tm => stats[tm.empNo].lastShift !== 'PM');
      let mustWorkPm = needsFullShift.filter(tm => stats[tm.empNo].lastShift === 'PM');

      // If canWorkAm has fewer than targetAmFull, promote lowest consecutive nights
      while (canWorkAm.length < targetAmFull && mustWorkPm.length > 0) {
        mustWorkPm.sort((a, b) => stats[a.empNo].consecutiveNights - stats[b.empNo].consecutiveNights);
        const p = mustWorkPm.shift();
        canWorkAm.push(p);
        stats[p.empNo].pmToAmFatigueCount++;
      }

      // If William is off, ensure a pharmacist is in canWorkAm
      if (isWilliamOffToday) {
        const rx = canWorkAm.find(tm => tm.isPharmacist);
        if (rx) {
          const idx = canWorkAm.indexOf(rx);
          if (idx > 0) {
            canWorkAm.splice(idx, 1);
            canWorkAm.unshift(rx);
          }
        }
      }

      canWorkAm.sort((a, b) => {
        const aPref = (a.nickname === 'PENNY' && (dayOfWeek === 'Wednesday' || dayOfWeek === 'Saturday'));
        const bPref = (b.nickname === 'PENNY' && (dayOfWeek === 'Wednesday' || dayOfWeek === 'Saturday'));
        if (aPref && !bPref) return -1;
        if (!aPref && bPref) return 1;

        const diffA = (stats[a.empNo].mCount - stats[a.empNo].nCount) + (Math.random() * randomness - randomness / 2);
        const diffB = (stats[b.empNo].mCount - stats[b.empNo].nCount);
        if (diffA !== diffB) return diffA - diffB;
        return stats[a.empNo].mCount - stats[b.empNo].mCount;
      });

      const numAm = Math.min(targetAmFull, canWorkAm.length);
      const assignedAm = canWorkAm.slice(0, numAm);
      const assignedPm = [...mustWorkPm, ...canWorkAm.slice(numAm)];

      assignedAm.forEach(tm => {
        dayShifts[tm.empNo] = '8H_0730-1630';
        stats[tm.empNo].mCount++;
        stats[tm.empNo].lastShift = 'AM';
        stats[tm.empNo].consecutiveNights = 0;
      });

      assignedPm.forEach(tm => {
        dayShifts[tm.empNo] = '8H_1230-2130';
        stats[tm.empNo].nCount++;
        stats[tm.empNo].lastShift = 'PM';
        stats[tm.empNo].consecutiveNights++;
      });

      // 6S Cleaning Rotation
      const onDutyRotating = rotatingPool.filter(tm => {
        const s = dayShifts[tm.empNo];
        return s && s !== 'RD' && s !== 'PH';
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
        stats[cleaner.empNo].cleanCount++;
      }

      let amCount = (isWilliamOffToday ? 0 : 1) + rotatingPool.filter(tm => {
        const s = dayShifts[tm.empNo];
        return s && (s.includes('0730') || s.includes('0800'));
      }).length;

      let pmCount = rotatingPool.filter(tm => {
        const s = dayShifts[tm.empNo];
        return s && (s.includes('1230') || s.includes('1300'));
      }).length;

      dailySchedule.push({
        day: d,
        date: dateStr,
        dayOfWeek,
        shifts: dayShifts,
        amCount,
        pmCount,
        workingTotal: amCount + pmCount,
        cleaner: cleaner ? cleaner.nickname : null
      });
    }

    const amCounts = rotatingPool.map(tm => stats[tm.empNo].mCount);
    const pmCounts = rotatingPool.map(tm => stats[tm.empNo].nCount);
    const amSpread = Math.max(...amCounts) - Math.min(...amCounts);
    const pmSpread = Math.max(...pmCounts) - Math.min(...pmCounts);
    const fatigue = Object.values(stats).reduce((acc, s) => acc + s.pmToAmFatigueCount, 0);

    return { dailySchedule, stats, cleaningCounts, amSpread, pmSpread, fatigue, score: amSpread + pmSpread + fatigue * 20 };
  }

  let best = solvePass(0);
  for (let i = 0; i < 200; i++) {
    const cand = solvePass(1.2);
    if (cand.score < best.score) {
      best = cand;
      if (best.amSpread <= 1 && best.pmSpread <= 1 && best.fatigue === 0) break;
    }
  }

  return best;
}

const res = runStatutoryScheduleGenerator(2026, 10, 31);
console.log('--- FINAL STATISTICAL REPORT ---');
console.table(Object.entries(res.stats).map(([empNo, st]) => {
  const tm = DEFAULT_KS01_TEAMMATES.find(t => t.empNo === empNo);
  return {
    nickname: tm.nickname,
    mCount: st.mCount,
    nCount: st.nCount,
    rdCount: st.rdCount,
    hdCount: st.hdCount,
    totalWorking: st.mCount + st.nCount,
    cleanCount: st.cleanCount,
    fatigueViolations: st.pmToAmFatigueCount
  };
}));
console.log('amSpread =', res.amSpread, 'pmSpread =', res.pmSpread, 'fatigue =', res.fatigue);
console.log('MIN AM:', Math.min(...res.dailySchedule.map(d=>d.amCount)), 'MIN PM:', Math.min(...res.dailySchedule.map(d=>d.pmCount)));

