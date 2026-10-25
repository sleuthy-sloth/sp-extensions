// Smoke test: runs plugin.js against a stub PluginAPI. No dependencies.
//   node test/smoke.js
const assert = require('node:assert');

const calls = { updated: [], snacks: [], header: null, entries: [] };
let dialogAnswer;

// Fixtures sit relative to the real today, since the plugin reads the clock.
const realToday = new Date();
const iso = (d) =>
  d.getFullYear() +
  '-' +
  String(d.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(d.getDate()).padStart(2, '0');
const shift = (days) => {
  const d = new Date(realToday);
  d.setDate(d.getDate() + days);
  return iso(d);
};

global.PluginAPI = {
  getTasks: async () => [
    { id: 'today', title: 'Today task', isDone: false, dueDay: shift(0) },
    { id: 'overdue', title: 'Overdue <task>', isDone: false, dueDay: shift(-3) },
    { id: 'future', title: 'Future task', isDone: false, dueDay: shift(1) },
    { id: 'done', title: 'Done task', isDone: true, dueDay: shift(0) },
    { id: 'timed', title: 'Timed task', isDone: false, dueDay: shift(0), dueWithTime: 1 },
    { id: 'recurring', title: 'Recurring', isDone: false, dueDay: shift(0), repeatCfgId: 'r1' },
  ],
  updateTask: async (id, changes) => calls.updated.push([id, changes]),
  showSnack: (cfg) => calls.snacks.push(cfg),
  openDialog: async () => dialogAnswer,
  registerHeaderButton: (cfg) => (calls.header = cfg),
  registerTaskContextMenuEntry: (cfg) => calls.entries.push(cfg),
};

require('../plugin.js');

assert.ok(calls.header, 'header button registered');
assert.strictEqual(typeof calls.header.onClick, 'function');
assert.strictEqual(calls.header.label, 'Unfinished → Tomorrow');
assert.strictEqual(calls.entries.length, 1, 'task context menu entry registered');
assert.strictEqual(calls.entries[0].id, 'move-to-tomorrow');
assert.strictEqual(calls.entries[0].icon, 'event');
assert.strictEqual(calls.entries[0].showFor, undefined, 'defaults to tasks and subtasks');

(async () => {
  // Dismissing the dialog (undefined answer) must change nothing.
  dialogAnswer = undefined;
  await calls.header.onClick();
  assert.deepStrictEqual(calls.updated, [], 'dismissed dialog moves nothing');

  // Cancelling with the other button also changes nothing.
  dialogAnswer = 'Keep them';
  await calls.header.onClick();
  assert.deepStrictEqual(calls.updated, [], 'cancel button moves nothing');

  // Confirming moves exactly the undone, scheduled, untimed, non-recurring ones.
  dialogAnswer = 'Move 2 tasks';
  await calls.header.onClick();
  assert.deepStrictEqual(
    calls.updated.map(([id]) => id),
    ['today', 'overdue'],
  );
  const dueDays = new Set(calls.updated.map(([, changes]) => changes.dueDay));
  assert.strictEqual(dueDays.size, 1, 'all moved to the same day');
  const target = [...dueDays][0];
  assert.match(target, /^\d{4}-\d{2}-\d{2}$/);
  assert.strictEqual(target, shift(1), 'moved to tomorrow');
  assert.strictEqual(
    calls.snacks[calls.snacks.length - 1].msg,
    'Moved 2 of 2 to ' + target,
  );

  // Single-task entry moves just that task.
  calls.updated.length = 0;
  await calls.entries[0].onClick({ taskId: 'today' });
  assert.deepStrictEqual(calls.updated, [['today', { dueDay: shift(1) }]]);

  // Nothing to move: snack, no dialog.
  global.PluginAPI.getTasks = async () => [];
  dialogAnswer = 'should never be asked';
  calls.updated.length = 0;
  await calls.header.onClick();
  assert.deepStrictEqual(calls.updated, []);
  assert.strictEqual(calls.snacks[calls.snacks.length - 1].type, 'INFO');

  console.log('ok');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
