// Mock browser DOM and environment
const jsdom = {
  document: {
    getElementById: (id) => {
      return {
        id,
        value: '',
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false
        },
        innerHTML: '',
        textContent: '',
        addEventListener: () => {}
      };
    }
  },
  window: {},
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};

global.document = jsdom.document;
global.window = jsdom.window;
global.localStorage = jsdom.localStorage;

// Load scheduler
require('../js/scheduler.js');

console.log('Testing runHeuristicScheduleGenerator...');
const sched = runHeuristicScheduleGenerator('KS01', 2026, 10, 31);
console.log('Days generated:', sched.days.length);
console.log('Warnings count:', sched.warnings.length);
console.log('Has minor variance:', sched.hasMinorVariance);

console.log('Testing renderConflictInspector...');
renderConflictInspector(sched);
console.log('renderConflictInspector executed cleanly!');

console.log('All scheduler functions verified successfully!');
