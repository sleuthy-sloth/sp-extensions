// Self-check for plugin.js, no dependencies. Run: TZ=America/New_York node test/verify.js
const assert = require('node:assert');
const { dayStr, nextDayStr, isCandidate, isMovable } = require('../plugin.js');

const day = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min);

// dueDay must be the LOCAL calendar day: a UTC-based implementation returns the
// next day for late-evening users. TZ=America/New_York makes this bite.
assert.strictEqual(dayStr(day(2026, 1, 1, 23, 30)), '2026-01-01');
assert.strictEqual(dayStr(day(2026, 1, 5)), '2026-01-05', 'zero-padded month and day');
assert.strictEqual(dayStr(day(2026, 12, 31)), '2026-12-31');

assert.strictEqual(nextDayStr(day(2026, 1, 31)), '2026-02-01', 'month rollover');
assert.strictEqual(nextDayStr(day(2028, 2, 28)), '2028-02-29', 'leap year');
assert.strictEqual(nextDayStr(day(2026, 3, 8, 23, 30)), '2026-03-09', 'spring-forward day');

const today = '2026-03-10';
const t = (over) => Object.assign({ id: 'x', title: 'x', isDone: false, dueDay: today }, over);

assert.strictEqual(isCandidate(t({}), today), true, 'due today');
assert.strictEqual(isCandidate(t({ dueDay: '2026-03-08' }), today), true, 'overdue');
assert.strictEqual(isCandidate(t({ dueDay: '2026-03-11' }), today), false, 'already tomorrow');
assert.strictEqual(isCandidate(t({ isDone: true }), today), false, 'done');
assert.strictEqual(isCandidate(t({ dueDay: null }), today), false, 'unscheduled');
assert.strictEqual(isCandidate(t({ repeatCfgId: 'r1' }), today), false, 'recurring original');
assert.strictEqual(isMovable(t({}), today), true);
assert.strictEqual(isMovable(t({ dueWithTime: 1773000000000 }), today), false, 'timed task');

console.log('ok');
