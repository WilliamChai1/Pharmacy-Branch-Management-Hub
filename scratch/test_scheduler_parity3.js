// scratch/test_scheduler_parity3.js
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

function testStaggeredCycle(year, month) {
  const totalDays = new Date(year, month, 0).getDate();
  console.log(`\n========================================================`);
  console.log(`Testing Staggered Parity Scheduler for ${year}-${month} (${totalDays} days)`);
  console.log(`========================================================`);

  const assistants = teammates.filter(t => !t.isPharmacist); // 7 assistants
  const cycle = ['AM', 'AM', 'AM', 'PM', 'PM', 'PM', 'RD'];

  // Align start offsets to best match each assistant's preferred rest day if possible
  // Find which day of the month corresponds to their preferred rest day in week 1:
  const dayNameIndex = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
  
  // Track stats
  const staffStats = {};
  teammates.forEach(t => {
    staffStats[t.empNo] = {
      empNo: t.empNo,
      nickname: t.nickname,
      amCount: 0,
      pmCount: 0,
      rdCount: 0,
      phCount: 0,
      cleaningCount: 0
    };
  });

  // Calculate distinct offset for each assistant (0 to 6)
  // To avoid RD clustering, each of the 7 assistants has an offset 0, 1, 2, 3, 4, 5, 6
  // Match as closely as possible to their restDayPref:
  // In cycle, RD is at index 6.
  // For Day d (1-indexed), index in cycle is: (d - 1 + offset) % 7.
  // We want (d_pref - 1 + offset) % 7 === 6  => offset = (6 - (d_pref - 1)) % 7.
  const offsets = [];
  const assignedOffsets = new Set();

  assistants.forEach(a => {
    let idealOffset = 0;
    // Find first date of month matching restDayPref:
    for (let d = 1; d <= 7; d++) {
      const dt = new Date(year, month - 1, d);
      if (daysOfWeek[dt.getDay()] === a.restDayPref) {
        idealOffset = (7 + 6 - (d - 1)) % 7;
        break;
      }
    }
    // Find closest available offset
    let best = idealOffset;
    while (assignedOffsets.has(best)) {
      best = (best + 1) % 7;
    }
    assignedOffsets.add(best);
    offsets.push({ empNo: a.empNo, offset: best });
  });

  const dailySchedule = [];

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHoliday = !!HOLIDAYS_2026_SARAWAK[dateStr];

    const dayShifts = {};

    // 1. William Chai (Fixed Anchor)
    const william = staffStats['PMG00831'];
    if (isHoliday) {
      dayShifts['PMG00831'] = 'PH';
      william.phCount++;
    } else if (dayOfWeek === 'Sunday') {
      dayShifts['PMG00831'] = 'RD';
      william.rdCount++;
    } else if (dayOfWeek === 'Saturday') {
      dayShifts['PMG00831'] = '4H_0730-1130';
      william.amCount++;
    } else {
      dayShifts['PMG00831'] = '8H_0730-1630';
      william.amCount++;
    }

    // 2. Kenix Ling (Pharmacist Coverage)
    const kenix = staffStats['PMG02963'];
    const isWilliamOffToday = (dayShifts['PMG00831'] === 'RD' || dayShifts['PMG00831'] === 'PH');

    // Tomorrow check
    const tomorrowDateObj = new Date(year, month - 1, d + 1);
    const tomorrowDayOfWeek = daysOfWeek[tomorrowDateObj.getDay()];
    const tomorrowDateStr = `${year}-${String(month).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
    const isWilliamOffTomorrow = (d < totalDays && (tomorrowDayOfWeek === 'Sunday' || !!HOLIDAYS_2026_SARAWAK[tomorrowDateStr]));

    if (isWilliamOffToday) {
      dayShifts['PMG02963'] = '8H_0730-1630';
      kenix.amCount++;
    } else if (isWilliamOffTomorrow) {
      // Must not do PM before tomorrow's AM
      dayShifts['PMG02963'] = 'RD';
      kenix.rdCount++;
    } else if (dayOfWeek === 'Monday') {
      dayShifts['PMG02963'] = 'RD';
      kenix.rdCount++;
    } else {
      dayShifts['PMG02963'] = '8H_1230-2130';
      kenix.pmCount++;
    }

    // 3. Assistants Shifts via Staggered Cycle
    const workingAssistants = [];

    assistants.forEach(a => {
      const offObj = offsets.find(o => o.empNo === a.empNo);
      const cycleIdx = (d - 1 + offObj.offset) % 7;
      const shiftType = cycle[cycleIdx];

      const st = staffStats[a.empNo];
      if (shiftType === 'RD') {
        dayShifts[a.empNo] = 'RD';
        st.rdCount++;
      } else if (shiftType === 'AM') {
        dayShifts[a.empNo] = '8H_0730-1630';
        st.amCount++;
        workingAssistants.push(a);
      } else {
        dayShifts[a.empNo] = '8H_1230-2130';
        st.pmCount++;
        workingAssistants.push(a);
      }
    });

    // 4. Golden Cleaning Slot (14:00 - 15:30) Round Robin
    workingAssistants.sort((a, b) => {
      const cA = staffStats[a.empNo].cleaningCount;
      const cB = staffStats[b.empNo].cleaningCount;
      if (cA !== cB) return cA - cB;
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

  // Verification
  let minAm = 99, minPm = 99;
  let antiFatigueViolations = 0;

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

testStaggeredCycle(2026, 10); // 31 days
testStaggeredCycle(2026, 11); // 30 days
testStaggeredCycle(2026, 2);  // 28 days
