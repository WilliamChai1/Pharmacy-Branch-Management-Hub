---
name: pmg-timetable-scheduler
description: Dynamic, zero-prefix pharmacy timetable formulation with 'Any Half (5H)' (07:30-12:30 or 16:30-21:30), cumulative AM/PM parity, shared Night 5H fairness, and PMG Visual Excel output.
---

# PMG AI Smart Timetable & Roster Scheduler Skill

Use this skill whenever configuring teammate preferences, running AI or BnB solver timetable generation, debugging parity/turnaround behavior, or exporting PMG Visual Excel rosters in [`js/scheduler.js`](file:///home/antigravity/WilliamChai1/Pharmacy-Branch-Management-Hub/js/scheduler.js).

## Architecture Rules

1. **Zero Hardcoded Staff Prefixes**:
   - Classify fixed anchors strictly by `tm.scheduleMode === 'Fixed'`.
   - Classify `isFixedPreferenceRosterMember(tm)` strictly by checking `tm.scheduleMode === 'Fixed'` or all 7 `dayPrefs` locked to non-`'Flexible'`, non-`'Any Half (5H)'` values.
   - Classify heavy explicit-preference locks via `hasStrictExplicitDayPrefs(tm)` (`>= 5` fixed non-`'Flexible'`, non-`'Any Half (5H)'` entries) so teammates using `'Any Half (5H)'` stay in `parityPool` while their remaining explicit day preferences remain protected.
   - Build Gemini prompts inside `callSchedulerGemini()` dynamically from active `currentTeammates` metadata without hardcoded staff stories or names.

2. **`'Any Half (5H)'` Data & Solver Lifecycle**:
   - **UI (`index.html` & `js/scheduler.js`)**: Teammates table exposes `.tm-half-pref` (weekday or `Flexible`) + `.tm-half-mode` (`AM 5H`, `PM 5H`, `Any 5H`), and the Day Preferences Modal exposes `'Any Half (5H)'`.
   - **Pattern Generator (`generateLegalWeeklyPatterns`)**: When a teammate has a fixed half-day weekday configured as `'Any Half (5H)'` (`explicitHdIsAny`), emit BOTH `{ code: halfShiftCode, isNight: false }` and `{ code: nightHalfShiftCode, isNight: true }` pattern variants so both Morning `5H_0730-1230` and Night `5H_1630-2130` are evaluated in Branch-and-Bound.
   - **Post-Processor (`postProcessSchedule`)**: Check `isAnyHalfDayPref(dp)` before Morning/Night half checks in Step 3.0 so AI-chosen `'5H_1630-2130'` is preserved rather than overwritten by `'5H_0730-1230'`.
   - **Shared Night 5H Fairness**: `solveFullWeek()` tracks `cumStats[tm.empNo].hdPm` across weeks and penalizes unfair Night `5H` concentration (`hdPmSpread`) across all eligible non-fixed teammates while keeping `floor`, `explicitPref`, `ratio`, and `turnaround` constraints strictly higher priority.

3. **PMG Visual Excel Format (18 Columns)**:
   - `DAY | OFF | 7.30-8.30AM | 8.30-9.30AM | 9.30-10.30AM | 10.30-11.30AM | 11.30-12.30PM | 12.30-1.30PM | 1.30-2.30PM | 2.30-3.30PM | 3.30-4.30PM | 4.30-5.30PM | 5.30-6.30PM | 6.30-7.30PM | 7.30-8.30PM | 8.30-9.30PM | HALF DAY | NOTES`
   - Full AM takes `12.30-1.30PM` `REST`; Full PM takes `3.30-4.30PM` `REST`; Night `5H` spans `4.30-9.30PM` (`5` hours); `2.30-3.30PM` / `1.30-3.30PM` highlights `6S Clean`, plus `NOTES` captures holidays, cleaning, Mon-Wed `SSJ Stock`, and Trainee Learning (`Fri 14:00 HQ Video` + 2 overlap sessions).

4. **Verification**:
   - Run `npm test` (`node scripts/verify_cloud_pdpa_suite.js`) after edits to confirm Test 8 (agent/skill mirror parity), Test 9 (Option A parity, shared Night 5H, synthetic prefix-free roster test), and Test 15 (preference persistence & cloud sync protection) all pass.
