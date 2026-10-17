// scratch/test_scheduler_parity.js
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

function testSchedule(year, month) {
  const totalDays = new Date(year, month, 0).getDate();
  console.log(`\nTesting Schedule for ${year}-${month} (${totalDays} days)...`);
  
  // Trackers
  const staffStats = {};
  teammates.forEach(t => {
    staffStats[t.empNo] = {
      empNo: t.empNo,
      nickname: t.nickname,
      amCount: 0,
      pmCount: 0,
      rdCount: 0,
      cleaningCount: 0,
      consecutiveDays: 0,
      consecutiveNights: 0,
      lastShift: null,
      history: []
    };
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
      william.rdCount++;
      william.consecutiveDays = 0;
      william.consecutiveNights = 0;
      william.lastShift = 'PH';
    } else if (dayOfWeek === 'Sunday') {
      dayShifts['PMG00831'] = 'RD';
      william.rdCount++;
      william.consecutiveDays = 0;
      william.consecutiveNights = 0;
      william.lastShift = 'RD';
    } else if (dayOfWeek === 'Saturday') {
      dayShifts['PMG00831'] = '4H_0730-1130';
      william.amCount++;
      william.consecutiveDays++;
      william.consecutiveNights = 0;
      william.lastShift = 'AM';
    } else {
      dayShifts['PMG00831'] = '8H_0730-1630';
      william.amCount++;
      william.consecutiveDays++;
      william.consecutiveNights = 0;
      william.lastShift = 'AM';
    }

    // 2. Kenix Ling (Pharmacist Coverage)
    const kenix = staffStats['PMG02963'];
    const isWilliamOff = (dayShifts['PMG00831'] === 'RD' || dayShifts['PMG00831'] === 'PH');

    if (isWilliamOff) {
      // Must cover Morning
      dayShifts['PMG02963'] = '8H_0730-1630';
      kenix.amCount++;
      kenix.consecutiveDays++;
      kenix.consecutiveNights = 0;
      kenix.lastShift = 'AM';
    } else {
      // Check next day: if tomorrow William is OFF (Sunday or PH), Kenix CANNOT do PM today!
      const nextDateObj = new Date(year, month - 1, d + 1);
      const nextDayOfWeek = daysOfWeek[nextDateObj.getDay()];
      const nextDateStr = `${year}-${String(month).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
      const isTomorrowWilliamOff = (nextDayOfWeek === 'Sunday' || !!HOLIDAYS_2026_SARAWAK[nextDateStr]);

      if (dayOfWeek === 'Monday' || kenix.consecutiveDays >= 6 || (kenix.consecutiveNights >= 3)) {
        dayShifts['PMG02963'] = 'RD';
        kenix.rdCount++;
        kenix.consecutiveDays = 0;
        kenix.consecutiveNights = 0;
        kenix.lastShift = 'RD';
      } else if (isTomorrowWilliamOff) {
        // Must avoid PM before tomorrow's AM
        dayShifts['PMG02963'] = '8H_0730-1630';
        kenix.amCount++;
        kenix.consecutiveDays++;
        kenix.consecutiveNights = 0;
        kenix.lastShift = 'AM';
      } else {
        dayShifts['PMG02963'] = '8H_1230-2130';
        kenix.pmCount++;
        kenix.consecutiveDays++;
        kenix.consecutiveNights++;
        kenix.lastShift = 'PM';
      }
    }

    // 3. Assistants (7 staff)
    const assistants = teammates.filter(t => !t.isPharmacist);
    
    // Step A: Determine RDs for assistants
    // Target: exactly 1 assistant on RD per day (sometimes 2 if consecutive days >= 6 or specific pref)
    // Score assistants for RD:
    // Higher score if:
    // - consecutiveDays >= 6 (MUST get RD)
    // - consecutiveNights >= 3 (MUST get RD)
    // - dayOfWeek matches restDayPref
    // - rdCount is below expected average for this day of month
    const rdCandidates = assistants.map(a => {
      const st = staffStats[a.empNo];
      let priority = 0;
      if (st.consecutiveDays >= 6) priority += 1000;
      if (st.consecutiveNights >= 3) priority += 500;
      if (a.restDayPref === dayOfWeek) priority += 100;
      // Ensure everyone gets ~1 RD per 7 days
      const expectedRds = Math.floor(d / 7);
      if (st.rdCount < expectedRds) priority += 50 * (expectedRds - st.rdCount);
      return { assistant: a, priority, stats: st };
    });

    rdCandidates.sort((a, b) => b.priority - a.priority);

    // Number of RDs today: default 1. If someone has mandatory RD (>= 500), include them too.
    let rdCountToday = 1;
    if (rdCandidates.filter(c => c.priority >= 500).length > 1) {
      rdCountToday = rdCandidates.filter(c => c.priority >= 500).length;
    }
    // Cap RDs so available working assistants >= 5 (so total staff >= 7)
    if (assistants.length - rdCountToday < 5) rdCountToday = assistants.length - 5;

    for (let i = 0; i < rdCountToday; i++) {
      const c = rdCandidates[i];
      dayShifts[c.assistant.empNo] = 'RD';
      c.stats.rdCount++;
      c.stats.consecutiveDays = 0;
      c.stats.consecutiveNights = 0;
      c.stats.lastShift = 'RD';
    }

    // Working assistants
    const workingAssistants = assistants.filter(a => dayShifts[a.empNo] !== 'RD');

    // Step B: Determine AM needed and PM needed
    // William AM: 1 (if working)
    // Kenix AM: 1 (if Kenix is AM)
    const amPharmCount = (dayShifts['PMG00831'] === '8H_0730-1630' || dayShifts['PMG00831'] === '4H_0730-1130' ? 1 : 0)
                       + (dayShifts['PMG02963'] === '8H_0730-1630' ? 1 : 0);
    const pmPharmCount = (dayShifts['PMG02963'] === '8H_1230-2130' ? 1 : 0);

    // Total AM target: 4 (min 3)
    // Total PM target: 4 (min 3)
    let amNeeded = Math.max(3 - amPharmCount, 4 - amPharmCount);
    let pmNeeded = Math.max(3 - pmPharmCount, 4 - pmPharmCount);

    // Balance workingAssistants between AM and PM
    // If workingAssistants.length < amNeeded + pmNeeded:
    // Split available assistants to meet at least floor 3 for each!
    const available = workingAssistants.length;
    let targetAmAssistants = 4 - amPharmCount;
    let targetPmAssistants = 4 - pmPharmCount;

    if (targetAmAssistants + targetPmAssistants > available) {
      // Scale down while maintaining floor of 3
      while (targetAmAssistants + targetPmAssistants > available) {
        if (targetAmAssistants + amPharmCount > targetPmAssistants + pmPharmCount) {
          targetAmAssistants--;
        } else {
          targetPmAssistants--;
        }
      }
    } else if (targetAmAssistants + targetPmAssistants < available) {
      // Distribute extra staff
      while (targetAmAssistants + targetPmAssistants < available) {
        if (targetAmAssistants + amPharmCount <= targetPmAssistants + pmPharmCount) {
          targetAmAssistants++;
        } else {
          targetPmAssistants++;
        }
      }
    }

    // Candidate ranking for AM vs PM:
    // Anti-fatigue hard constraints:
    // 1. If lastShift was 'PM', CANNOT DO AM today! Must do PM.
    // 2. If consecutiveNights >= 3, CANNOT DO PM today!
    const forcedPm = [];
    const forcedAm = [];
    const flexible = [];

    workingAssistants.forEach(a => {
      const st = staffStats[a.empNo];
      if (st.lastShift === 'PM') {
        forcedPm.push(a);
      } else if (st.consecutiveNights >= 3) {
        forcedAm.push(a);
      } else {
        flexible.push(a);
      }
    });

    // Flexible sorting by who needs AM more vs PM more
    // We want st.amCount and st.pmCount to be equal!
    // Balance score: lower score = needs AM more (i.e. amCount - pmCount is low/negative)
    flexible.sort((a, b) => {
      const diffA = staffStats[a.empNo].amCount - staffStats[a.empNo].pmCount;
      const diffB = staffStats[b.empNo].amCount - staffStats[b.empNo].pmCount;
      return diffA - diffB;
    });

    const assignedAm = [...forcedAm];
    const assignedPm = [...forcedPm];

    flexible.forEach(a => {
      if (assignedAm.length < targetAmAssistants) {
        assignedAm.push(a);
      } else {
        assignedPm.push(a);
      }
    });

    // Apply shifts
    assignedAm.forEach(a => {
      const st = staffStats[a.empNo];
      dayShifts[a.empNo] = '8H_0730-1630';
      st.amCount++;
      st.consecutiveDays++;
      st.consecutiveNights = 0;
      st.lastShift = 'AM';
    });

    assignedPm.forEach(a => {
      const st = staffStats[a.empNo];
      dayShifts[a.empNo] = '8H_1230-2130';
      st.pmCount++;
      st.consecutiveDays++;
      st.consecutiveNights++;
      st.lastShift = 'PM';
    });

    // 4. Golden Cleaning Slot (14:00 - 15:30)
    // Round robin among working assistants
    workingAssistants.sort((a, b) => {
      return staffStats[a.empNo].cleaningCount - staffStats[b.empNo].cleaningCount;
    });
    const cleaningStaff = workingAssistants[0];
    staffStats[cleaningStaff.empNo].cleaningCount++;

    const totalAmFloor = Object.values(dayShifts).filter(s => s.includes('0730')).length;
    const totalPmFloor = Object.values(dayShifts).filter(s => s.includes('1230')).length;

    dailySchedule.push({
      day: d,
      date: dateStr,
      dayOfWeek,
      shifts: dayShifts,
      cleaningDuty: cleaningStaff.nickname,
      amStaff: totalAmFloor,
      pmStaff: totalPmFloor
    });
  }

  // Verification & Metrics
  console.log(`\n=== RESULTS FOR ${year}-${month} ===`);
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
          console.error(`FATIGUE VIOLATION: ${t.nickname} worked PM on day ${prev.day} and AM on day ${d.day}!`);
          antiFatigueViolations++;
        }
      });
    }
  });

  console.log(`Manpower Density: Min AM on any day = ${minAm} (Target 4, Min Floor 3)`);
  console.log(`Manpower Density: Min PM on any day = ${minPm} (Target 4, Min Floor 3)`);
  console.log(`Anti-Fatigue Violations (PM -> AM next morning): ${antiFatigueViolations}`);

  console.log('\n--- Teammate Shift Parity & Equity ---');
  const assistantStats = teammates.filter(t => !t.isPharmacist).map(t => staffStats[t.empNo]);
  assistantStats.forEach(st => {
    console.log(`${st.nickname.padEnd(12)}: AM=${st.amCount}, PM=${st.pmCount}, RD=${st.rdCount}, Clean=${st.cleaningCount}, Diff=|${st.amCount - st.pmCount}|`);
  });

  const amCounts = assistantStats.map(s => s.amCount);
  const pmCounts = assistantStats.map(s => s.pmCount);
  const amVariance = Math.max(...amCounts) - Math.min(...amCounts);
  const pmVariance = Math.max(...pmCounts) - Math.min(...pmCounts);

  console.log(`AM Variance across assistants: ${amVariance} (Must be <= 1)`);
  console.log(`PM Variance across assistants: ${pmVariance} (Must be <= 1)`);
  console.log(`Parity Check: ${amVariance <= 1 && pmVariance <= 1 ? 'PASSED (EXCELLENT)' : 'FAILED'}`);
}

testSchedule(2026, 10);
testSchedule(2026, 11);
