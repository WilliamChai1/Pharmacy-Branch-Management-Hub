const fs = require('fs');
const vm = require('vm');
let code = fs.readFileSync('js/scheduler.js', 'utf8');

global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = { getElementById: () => null, querySelectorAll: () => [] };

vm.runInThisContext(code);
loadTeammates('KS01');

// Let's test a natural phase-aligned assignment
// Because of each teammate's static RD and HD day in the week:
// For any staff member:
// The transition from AM to PM should happen after their RD or naturally.
// The transition from PM to AM should NEVER happen overnight without an RD!

function testPhaseAlignedSolver() {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const william = currentTeammates.find(t => t.empNo === 'PMG00831');
  const rotatingPool = currentTeammates.filter(t => t.empNo !== 'PMG00831');
  const totalDays = 31;
  const year = 2026, month = 10;
  const calendarWeeks = getMonthlyCalendarWeeks(year, month, totalDays);

  const dailyAssigned = {};
  for (let d = 1; d <= totalDays; d++) dailyAssigned[d] = {};

  // 1. Lock William
  for (let d = 1; d <= totalDays; d++) {
    const dow = daysOfWeek[new Date(year, month - 1, d).getDay()];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (HOLIDAYS_2026_SARAWAK[dateStr]) dailyAssigned[d][william.empNo] = 'PH';
    else if (dow === 'Sunday') dailyAssigned[d][william.empNo] = 'RD';
    else if (dow === 'Saturday') dailyAssigned[d][william.empNo] = '4H_0730-1130';
    else dailyAssigned[d][william.empNo] = '8H_0730-1630';
  }

  // 2. Pre-assign RD and HD
  calendarWeeks.forEach((weekDays, wIdx) => {
    rotatingPool.forEach(tm => {
      let chosenRd = null, chosenHd = null;
      if (wIdx === 0) {
        if (tm.nickname === 'LOUNA') { chosenRd = 1; chosenHd = 3; }
        else if (tm.nickname === 'FIONA') { chosenRd = 1; chosenHd = 2; }
        else if (tm.nickname === 'FARIZIN') { chosenRd = 2; chosenHd = 4; }
        else if (tm.nickname === 'CHRISTINA') { chosenRd = 3; chosenHd = 2; }
        else if (tm.nickname === 'TING') { chosenRd = 4; chosenHd = 1; }
        else if (tm.nickname === 'KENIX') { chosenRd = 2; chosenHd = 4; }
        else if (tm.nickname === 'PENNY') { chosenRd = 3; chosenHd = 1; }
        else if (tm.nickname === 'NURHAFIZAH') { chosenRd = 2; chosenHd = 1; }
      } else if (wIdx === calendarWeeks.length - 1 && weekDays.length < 7) {
        if (tm.nickname === 'NURHAFIZAH') { chosenRd = 26; chosenHd = 28; }
        else if (tm.nickname === 'KENIX') { chosenRd = 26; chosenHd = 28; }
        else if (tm.nickname === 'PENNY') { chosenRd = 27; chosenHd = 26; }
        else if (tm.nickname === 'FARIZIN') { chosenRd = 30; chosenHd = 27; }
        else if (tm.nickname === 'LOUNA') { chosenRd = 29; chosenHd = 28; }
        else if (tm.nickname === 'FIONA') { chosenRd = 29; chosenHd = 28; }
        else if (tm.nickname === 'CHRISTINA') { chosenRd = 31; chosenHd = 30; }
        else if (tm.nickname === 'TING') { chosenRd = 29; chosenHd = 28; }
      } else {
        weekDays.forEach(d => {
          const dow = daysOfWeek[new Date(year, month - 1, d).getDay()];
          if (dow === tm.restDayPref) chosenRd = d;
          const hdPrefDow = tm.halfDayPref ? tm.halfDayPref.split(' ')[0] : '';
          if (dow === hdPrefDow) chosenHd = d;
        });
        if (!chosenHd) {
          const tue = weekDays.find(d => daysOfWeek[new Date(year, month - 1, d).getDay()] === 'Tuesday');
          chosenHd = tue || weekDays[1];
        }
        if (!chosenRd) chosenRd = weekDays[0];
      }
      dailyAssigned[chosenRd][tm.empNo] = 'RD';
      dailyAssigned[chosenHd][tm.empNo] = '4H_0730-1130';
    });
  });

  // 3. For all other working days, classify natural shift zone based on proximity to HD:
  // Before an HD (morning 07:30), a teammate should be on AM or RD!
  // After an RD, a teammate can switch to PM!
  // Let's run forward day-by-day with a hard constraint:
  // If tm.lastShift === 'PM', they CANNOT be assigned to AM (including 4H) on the next day!
  const stats = {};
  currentTeammates.forEach(tm => {
    stats[tm.empNo] = { am: 0, pm: 0, hd: 0, rd: 0, clean: 0, lastShift: null, fatigue: 0 };
  });

  for (let d = 1; d <= totalDays; d++) {
    const dow = daysOfWeek[new Date(year, month - 1, d).getDay()];
    const dayShifts = dailyAssigned[d];

    if (william) {
      const s = dayShifts[william.empNo];
      if (s === 'RD' || s === 'PH') stats[william.empNo].rd++;
      else if (s.includes('4H')) { stats[william.empNo].am++; stats[william.empNo].hd++; }
      else stats[william.empNo].am++;
      stats[william.empNo].lastShift = s;
    }

    const needsShift = rotatingPool.filter(tm => !dayShifts[tm.empNo]);
    const preAmCount = (dayShifts[william.empNo] && !['RD','PH'].includes(dayShifts[william.empNo]) ? 1 : 0) +
                       rotatingPool.filter(tm => dayShifts[tm.empNo] && dayShifts[tm.empNo].includes('4H')).length;

    // How many full AM needed to reach at least 3, and full PM to reach at least 3
    let targetPm = 3;
    let targetAm = needsShift.length - targetPm;
    if (targetAm < (3 - preAmCount)) {
      targetAm = Math.max(0, 3 - preAmCount);
      targetPm = needsShift.length - targetAm;
    }

    // STRICT: Candidates for AM today:
    // 1. Must NOT have had PM yesterday (unless yesterday was RD).
    // 2. Candidates for PM today: Must NOT have morning shift tomorrow!
    const mustBeAm = [];
    const mustBePm = [];
    const flexible = [];

    needsShift.forEach(tm => {
      const hadPmYesterday = stats[tm.empNo].lastShift === 'PM';
      const hasMorningTomorrow = (d < totalDays) && dailyAssigned[d + 1] && dailyAssigned[d + 1][tm.empNo] && dailyAssigned[d + 1][tm.empNo].includes('0730');

      if (hadPmYesterday && hasMorningTomorrow) {
        // Double pinch: yesterday was PM, tomorrow is morning!
        // To prevent fatigue, today MUST be PM or AM?
        mustBeAm.push(tm);
      } else if (hadPmYesterday) {
        mustBePm.push(tm);
      } else if (hasMorningTomorrow) {
        mustBeAm.push(tm);
      } else {
        flexible.push(tm);
      }
    });

    // Penny prefer wed/sat morning
    flexible.sort((a, b) => {
      const aPref = (a.nickname === 'PENNY' && (dow === 'Wednesday' || dow === 'Saturday'));
      const bPref = (b.nickname === 'PENNY' && (dow === 'Wednesday' || dow === 'Saturday'));
      if (aPref && !bPref) return -1;
      if (!aPref && bPref) return 1;
      return (stats[a.empNo].am - stats[a.empNo].pm) - (stats[b.empNo].am - stats[b.empNo].pm);
    });

    const chosenAm = [...mustBeAm];
    const chosenPm = [...mustBePm];

    while (chosenAm.length < targetAm && flexible.length > 0) {
      chosenAm.push(flexible.shift());
    }
    while (flexible.length > 0) {
      chosenPm.push(flexible.shift());
    }

    // If still deficit on PM
    while (chosenPm.length < targetPm && chosenAm.length > targetAm) {
      chosenPm.push(chosenAm.pop());
    }

    chosenAm.forEach(tm => {
      dayShifts[tm.empNo] = '8H_0730-1630';
      if (stats[tm.empNo].lastShift === 'PM') stats[tm.empNo].fatigue++;
      stats[tm.empNo].am++;
      stats[tm.empNo].lastShift = 'AM';
    });

    chosenPm.forEach(tm => {
      dayShifts[tm.empNo] = '8H_1230-2130';
      stats[tm.empNo].pm++;
      stats[tm.empNo].lastShift = 'PM';
    });

    // Check pre-assigned
    rotatingPool.forEach(tm => {
      const s = dayShifts[tm.empNo];
      if (s === 'RD' || s === 'PH') {
        stats[tm.empNo].rd++;
        stats[tm.empNo].lastShift = 'RD';
      } else if (s.includes('4H')) {
        if (stats[tm.empNo].lastShift === 'PM') stats[tm.empNo].fatigue++;
        stats[tm.empNo].am++;
        stats[tm.empNo].hd++;
        stats[tm.empNo].lastShift = 'AM';
      }
    });
  }

  let totalFatigue = 0;
  rotatingPool.forEach(tm => { totalFatigue += stats[tm.empNo].fatigue; });
  console.log('Total turnaround fatigue with smart classification:', totalFatigue);
  console.table(stats);
}

testPhaseAlignedSolver();
