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

function generateDynamicBalancedSchedule(year, month, teammates) {
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

    // 2. Identify Rest Days (RD) for rotating pool on day d
    // Priority:
    // a) Max 6 consecutive working days -> MUST take RD
    // b) Consecutive nights >= 3 -> Can take RD or transition to AM if allowed
    // c) Teammate prefers RD on dayOfWeek
    const availableStaff = [];

    rotatingPool.forEach(tm => {
      const st = stats[tm.empNo];
      let mustRest = false;
      let prefersRest = (dayOfWeek === tm.restDayPref);

      // Rule: Max 6 consecutive working days without rest
      if (st.consecutiveWorkingDays >= 6) {
        mustRest = true;
      }

      // Rule: If consecutive nights >= 3, cannot work night again.
      // If st.lastShift === 'PM', cannot work AM either (turnaround rule). So MUST take RD!
      if (st.consecutiveNights >= 3 && st.lastShift === 'PM') {
        mustRest = true;
      }

      // Rest Day preference:
      // Allow rest day if mustRest or if prefersRest and not already too many people resting today
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

    // Ensure we meet minimum working floor (at least 6 working staff, or 5 if William works AM)
    const minWorkingNeeded = isWilliamOffToday ? 6 : 5;
    if (availableStaff.length < minWorkingNeeded) {
      // Reclaim someone who preferred rest but didn't have mustRest
      const rested = rotatingPool.filter(tm => dayShifts[tm.empNo] === 'RD' && stats[tm.empNo].consecutiveWorkingDays < 6 && !(stats[tm.empNo].consecutiveNights >= 3 && stats[tm.empNo].lastShift === 'PM'));
      rested.sort((a, b) => stats[b.empNo].rd - stats[a.empNo].rd);
      while (availableStaff.length < minWorkingNeeded && rested.length > 0) {
        const reclaimed = rested.shift();
        delete dayShifts[reclaimed.empNo];
        stats[reclaimed.empNo].rd--;
        availableStaff.push(reclaimed);
      }
    }

    // Target morning from rotating pool:
    // If William is ON (1 AM): target rotating AM is 3 (total 4).
    // If William is OFF (0 AM): target rotating AM is 4.
    const targetRotatingAm = isWilliamOffToday ? 4 : 3;

    // Filter who CAN work AM (anti-fatigue: previous shift must NOT be PM)
    const canWorkAm = availableStaff.filter(tm => stats[tm.empNo].lastShift !== 'PM');
    // Must work PM if previous shift was PM, OR if they cannot work AM
    const mustWorkPm = availableStaff.filter(tm => stats[tm.empNo].lastShift === 'PM');

    // Sort canWorkAm by who needs AM the most (lowest AM count, or lowest AM - PM)
    canWorkAm.sort((a, b) => {
      const diffA = stats[a.empNo].am - stats[a.empNo].pm;
      const diffB = stats[b.empNo].am - stats[b.empNo].pm;
      if (diffA !== diffB) return diffA - diffB;
      return stats[a.empNo].am - stats[b.empNo].am;
    });

    // Sunday/PH Pharmacist Coverage constraint:
    // If William is off, Kenix or Christina MUST be assigned to morning!
    if (isWilliamOffToday) {
      const rxCanAm = canWorkAm.find(tm => tm.isPharmacist || tm.position.includes('Pharmacist'));
      if (rxCanAm) {
        // Move rxCanAm to front of canWorkAm
        const idx = canWorkAm.indexOf(rxCanAm);
        if (idx > 0) {
          canWorkAm.splice(idx, 1);
          canWorkAm.unshift(rxCanAm);
        }
      }
    }

    // Half Day preference:
    // If teammate prefers Half Day today (e.g. Penny Monday, Louna Wednesday, Farizin Tuesday, Kenix Sunday, Christina Friday):
    // Prioritize them in AM so they can get their morning half day!
    canWorkAm.sort((a, b) => {
      const aWantsHalf = (a.halfDayPref === dayOfWeek || (a.nickname === 'PENNY' && dayOfWeek === 'Monday') || (a.nickname === 'LOUNA' && dayOfWeek === 'Wednesday') || (a.nickname === 'FIONA' && dayOfWeek === 'Wednesday') || (a.nickname === 'FARIZIN' && dayOfWeek === 'Tuesday') || (a.nickname === 'KENIX' && dayOfWeek === 'Sunday') || (a.nickname === 'CHRISTINA' && dayOfWeek === 'Friday'));
      const bWantsHalf = (b.halfDayPref === dayOfWeek || (b.nickname === 'PENNY' && dayOfWeek === 'Monday') || (b.nickname === 'LOUNA' && dayOfWeek === 'Wednesday') || (b.nickname === 'FIONA' && dayOfWeek === 'Wednesday') || (b.nickname === 'FARIZIN' && dayOfWeek === 'Tuesday') || (b.nickname === 'KENIX' && dayOfWeek === 'Sunday') || (b.nickname === 'CHRISTINA' && dayOfWeek === 'Friday'));
      if (aWantsHalf && !bWantsHalf) return -1;
      if (!aWantsHalf && bWantsHalf) return 1;
      const diffA = stats[a.empNo].am - stats[a.empNo].pm;
      const diffB = stats[b.empNo].am - stats[b.empNo].pm;
      return diffA - diffB;
    });

    // Assign morning shifts
    const assignedAm = canWorkAm.slice(0, Math.min(targetRotatingAm, canWorkAm.length));
    const assignedPm = [...mustWorkPm, ...canWorkAm.slice(assignedAm.length)];

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

    // 3. Universal 6S Cleaning Rotation (2:00 PM – 3:30 PM)
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
      stats[cleaner.empNo].clean++;
    }

    // Counts
    let amCount = 0;
    let pmCount = 0;
    let workingTotal = 0;
    Object.values(dayShifts).forEach(s => {
      if (s && s !== 'RD' && s !== 'PH' && s !== 'OFF') {
        workingTotal++;
        if (s.includes('0730') || s.includes('0800')) amCount++;
        if (s.includes('1230') || s.includes('1300') || s.includes('1630')) pmCount++;
      }
    });

    dailySchedule.push({
      day: d,
      date: dateStr,
      dayOfWeek,
      shifts: dayShifts,
      cleaner: cleaner ? cleaner.nickname : null,
      amCount,
      pmCount,
      workingTotal
    });
  }

  return { dailySchedule, stats, totalDays };
}

// Test months 10, 11, 12 of 2026
[10, 11, 12].forEach(m => {
  console.log(`\n=================== MONTH 2026-${m} ===================`);
  const res = generateDynamicBalancedSchedule(2026, m, teammatesKS01);
  console.table(
    Object.entries(res.stats).map(([empNo, st]) => {
      const tm = teammatesKS01.find(t => t.empNo === empNo);
      return {
        Nickname: tm.nickname,
        Role: tm.position,
        AM: st.am,
        PM: st.pm,
        Diff: Math.abs(st.am - st.pm),
        RD: st.rd,
        Cleaning: st.clean,
        FatigueViolations: st.fatigueViolations
      };
    })
  );

  const underFloor = res.dailySchedule.filter(d => d.amCount < 3 || d.pmCount < 3 || d.workingTotal < 6);
  console.log(`Days under floor (AM < 3 or PM < 3 or Total < 6): ${underFloor.length}`);
});
