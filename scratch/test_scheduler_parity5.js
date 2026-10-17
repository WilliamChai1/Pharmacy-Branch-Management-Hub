// scratch/test_scheduler_parity5.js
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

function generatePerfectParityRoster(year, month) {
  const totalDays = new Date(year, month, 0).getDate();
  const assistants = teammates.filter(t => !t.isPharmacist);
  const cycle = ['AM', 'AM', 'AM', 'PM', 'PM', 'PM', 'RD'];

  // Stagger offsets so that each assistant is on a different day of the 7-day cycle
  // This guarantees that on every day from 1 to 28, exactly 3 assistants are AM, 3 PM, 1 RD.
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
  const staffStats = {};
  teammates.forEach(t => {
    staffStats[t.empNo] = { am: 0, pm: 0, rd: 0, cleaning: 0, consecutiveNights: 0, lastShift: null };
  });

  // Days 1 to 28 (or totalDays if < 28)
  const baseDays = Math.min(28, totalDays);

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[dateStr];
    const dayShifts = {};

    // 1. William Chai (Fixed Anchor)
    if (isHoliday) {
      dayShifts['PMG00831'] = 'PH';
      staffStats['PMG00831'].rd++;
      staffStats['PMG00831'].lastShift = 'PH';
    } else if (dayOfWeek === 'Sunday') {
      dayShifts['PMG00831'] = 'RD';
      staffStats['PMG00831'].rd++;
      staffStats['PMG00831'].lastShift = 'RD';
    } else if (dayOfWeek === 'Saturday') {
      dayShifts['PMG00831'] = '4H_0730-1130';
      staffStats['PMG00831'].am++;
      staffStats['PMG00831'].lastShift = 'AM';
    } else {
      dayShifts['PMG00831'] = '8H_0730-1630';
      staffStats['PMG00831'].am++;
      staffStats['PMG00831'].lastShift = 'AM';
    }

    // 2. Kenix Ling (Pharmacist Coverage)
    const isWilliamOffToday = (dayShifts['PMG00831'] === 'RD' || dayShifts['PMG00831'] === 'PH');
    const tomorrowDateObj = new Date(year, month - 1, d + 1);
    const tomorrowDayOfWeek = daysOfWeek[tomorrowDateObj.getDay()];
    const tomorrowDateStr = `${year}-${String(month).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
    const isWilliamOffTomorrow = (d < totalDays && (tomorrowDayOfWeek === 'Sunday' || !!HOLIDAYS_2026_SARAWAK[tomorrowDateStr]));

    if (isWilliamOffToday) {
      dayShifts['PMG02963'] = '8H_0730-1630';
      staffStats['PMG02963'].am++;
      staffStats['PMG02963'].lastShift = 'AM';
    } else if (isWilliamOffTomorrow) {
      dayShifts['PMG02963'] = 'RD';
      staffStats['PMG02963'].rd++;
      staffStats['PMG02963'].lastShift = 'RD';
    } else if (dayOfWeek === 'Monday') {
      dayShifts['PMG02963'] = 'RD';
      staffStats['PMG02963'].rd++;
      staffStats['PMG02963'].lastShift = 'RD';
    } else {
      dayShifts['PMG02963'] = '8H_1230-2130';
      staffStats['PMG02963'].pm++;
      staffStats['PMG02963'].lastShift = 'PM';
    }

    // 3. Assistants
    if (d <= 28) {
      // Standard 7-day staggered cycle
      assistants.forEach(a => {
        const offObj = offsets.find(o => o.empNo === a.empNo);
        const cycleIdx = (d - 1 + offObj.offset) % 7;
        const shiftType = cycle[cycleIdx];

        if (shiftType === 'RD') {
          dayShifts[a.empNo] = 'RD';
          staffStats[a.empNo].rd++;
          staffStats[a.empNo].consecutiveNights = 0;
          staffStats[a.empNo].lastShift = 'RD';
        } else if (shiftType === 'AM') {
          dayShifts[a.empNo] = '8H_0730-1630';
          staffStats[a.empNo].am++;
          staffStats[a.empNo].consecutiveNights = 0;
          staffStats[a.empNo].lastShift = 'AM';
        } else {
          dayShifts[a.empNo] = '8H_1230-2130';
          staffStats[a.empNo].pm++;
          staffStats[a.empNo].consecutiveNights++;
          staffStats[a.empNo].lastShift = 'PM';
        }
      });
    } else {
      // Days 29 to 31: Parity-balanced tail solver
      // We must pick exactly: 3 AM, 3 PM, 1 RD
      // Candidate pool and anti-fatigue eligibility:
      const canDoAm = [];
      const mustDoPmOrRd = [];

      assistants.forEach(a => {
        const st = staffStats[a.empNo];
        if (st.lastShift === 'PM') {
          mustDoPmOrRd.push(a); // Cannot do AM because of PM yesterday
        } else {
          canDoAm.push(a); // Can do AM, PM, or RD
        }
      });

      // 1 assistant gets RD today:
      // Pick assistant who has the fewest RDs (e.g. 4 RDs while others have 4 or 5)
      // and who is in mustDoPmOrRd (if they did PM yesterday, RD gives them great rest)
      mustDoPmOrRd.sort((a, b) => {
        const rdDiff = staffStats[a.empNo].rd - staffStats[b.empNo].rd;
        if (rdDiff !== 0) return rdDiff;
        // Prioritize who has higher consecutive nights
        return staffStats[b.empNo].consecutiveNights - staffStats[a.empNo].consecutiveNights;
      });

      let rdStaff = null;
      if (mustDoPmOrRd.length > 0 && staffStats[mustDoPmOrRd[0].empNo].rd < 5) {
        rdStaff = mustDoPmOrRd.shift();
      } else {
        // Pick from canDoAm
        canDoAm.sort((a, b) => staffStats[a.empNo].rd - staffStats[b.empNo].rd);
        rdStaff = canDoAm.shift();
      }

      dayShifts[rdStaff.empNo] = 'RD';
      staffStats[rdStaff.empNo].rd++;
      staffStats[rdStaff.empNo].consecutiveNights = 0;
      staffStats[rdStaff.empNo].lastShift = 'RD';

      // Now we need 3 AM and 3 PM from the remaining 6 assistants.
      // Everyone in mustDoPmOrRd MUST do PM (they worked PM yesterday).
      const pmAssigned = [...mustDoPmOrRd];
      const remainingForAmOrPm = [...canDoAm];

      // Sort remainingForAmOrPm by who needs AM more:
      // Priority for AM: who has lower amCount!
      remainingForAmOrPm.sort((a, b) => {
        const diffA = staffStats[a.empNo].am - staffStats[a.empNo].pm;
        const diffB = staffStats[b.empNo].am - staffStats[b.empNo].pm;
        if (diffA !== diffB) return diffA - diffB;
        return staffStats[a.empNo].am - staffStats[b.empNo].am;
      });

      const amAssigned = [];
      while (amAssigned.length < 3 && remainingForAmOrPm.length > 0) {
        amAssigned.push(remainingForAmOrPm.shift());
      }
      while (remainingForAmOrPm.length > 0) {
        pmAssigned.push(remainingForAmOrPm.shift());
      }

      amAssigned.forEach(a => {
        dayShifts[a.empNo] = '8H_0730-1630';
        staffStats[a.empNo].am++;
        staffStats[a.empNo].consecutiveNights = 0;
        staffStats[a.empNo].lastShift = 'AM';
      });

      pmAssigned.forEach(a => {
        dayShifts[a.empNo] = '8H_1230-2130';
        staffStats[a.empNo].pm++;
        staffStats[a.empNo].consecutiveNights++;
        staffStats[a.empNo].lastShift = 'PM';
      });
    }

    // 4. Golden Cleaning Slot (14:00 - 15:30) Round Robin
    const workingAssistants = assistants.filter(a => dayShifts[a.empNo] !== 'RD');
    workingAssistants.sort((a, b) => {
      const cA = staffStats[a.empNo].cleaning;
      const cB = staffStats[b.empNo].cleaning;
      if (cA !== cB) return cA - cB;
      return a.empNo.localeCompare(b.empNo);
    });

    const chosenCleaner = workingAssistants[0];
    staffStats[chosenCleaner.empNo].cleaning++;

    days.push({
      day: d,
      date: dateStr,
      dayOfWeek,
      shifts: dayShifts,
      cleaningDuty: {
        empNo: chosenCleaner.empNo,
        nickname: chosenCleaner.nickname,
        time: '2:00 PM – 3:30 PM',
        task: 'Gondola Cleaning & Refilling'
      }
    });
  }

  // Verification
  const ams = assistants.map(a => staffStats[a.empNo].am);
  const pms = assistants.map(a => staffStats[a.empNo].pm);
  const rds = assistants.map(a => staffStats[a.empNo].rd);
  const amVar = Math.max(...ams) - Math.min(...ams);
  const pmVar = Math.max(...pms) - Math.min(...pms);
  const maxDiff = Math.max(...assistants.map(a => Math.abs(staffStats[a.empNo].am - staffStats[a.empNo].pm)));

  let fatigueViolations = 0;
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1];
    const cur = days[i];
    teammates.forEach(t => {
      const sp = prev.shifts[t.empNo];
      const sc = cur.shifts[t.empNo];
      if (sp && sp.includes('1230') && sc && sc.includes('0730')) {
        console.error(`FATIGUE VIOLATION on Day ${cur.day} for ${t.nickname}`);
        fatigueViolations++;
      }
    });
  }

  let minAm = 99, minPm = 99;
  days.forEach(d => {
    const amCount = Object.values(d.shifts).filter(s => s.includes('0730')).length;
    const pmCount = Object.values(d.shifts).filter(s => s.includes('1230')).length;
    if (amCount < minAm) minAm = amCount;
    if (pmCount < minPm) minPm = pmCount;
  });

  const passed = amVar <= 1 && pmVar <= 1 && maxDiff <= 1 && fatigueViolations === 0 && minAm >= 3 && minPm >= 3;
  console.log(`${year}-${String(month).padStart(2, '0')} (${totalDays}d): amVar=${amVar}, pmVar=${pmVar}, maxDiff=${maxDiff}, minAM=${minAm}, minPM=${minPm}, fatigue=${fatigueViolations} => ${passed ? '✓ PASSED 100%' : '✗ FAILED'}`);

  return { passed, stats: staffStats };
}

console.log('Testing All 12 Months of 2026:');
let allPassed = true;
for (let m = 1; m <= 12; m++) {
  const res = generatePerfectParityRoster(2026, m);
  if (!res.passed) allPassed = false;
}
console.log(`\nOVERALL ALL-MONTH RESULT: ${allPassed ? 'ALL 12 MONTHS PASSED 100% PERFECTLY!' : 'SOME MONTHS FAILED'}`);
