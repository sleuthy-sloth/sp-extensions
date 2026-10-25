/**
 * Move Unfinished to Tomorrow — Super Productivity plugin.
 *
 * Two ways in:
 *   task context menu → "Move to tomorrow"   (one task)
 *   header button → everything still due today, after a confirm dialog
 *
 * Deliberately not wired into the finishDay hook: every hook handler is raced
 * against a 5s timeout (PluginHooksService.HOOK_TIMEOUT_MS), so a confirm
 * dialog there gets abandoned mid-interaction, and silently rescheduling on
 * finish-day is not what this plugin is for.
 */

const pad2 = (n) => (n < 10 ? '0' + n : '' + n);

// dueDay is a LOCAL calendar day ("YYYY-MM-DD"). toISOString() is UTC and
// shifts the day for anyone east or west of it, so use local parts.
const dayStr = (d) =>
  d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());

const nextDayStr = (base) => {
  const d = new Date(base || Date.now());
  d.setDate(d.getDate() + 1); // setDate keeps the local calendar day across DST
  return dayStr(d);
};

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

const MAX_LISTED = 8;

// Recurring originals own no day of their own (the instance does).
const isCandidate = (task, upToDay) =>
  !task.isDone && !!task.dueDay && task.dueDay <= upToDay && !task.repeatCfgId;

// Timed tasks stay put: moving the day without the reminder time would leave a
// notification pointing at the old slot.
const isMovable = (task, upToDay) => isCandidate(task, upToDay) && !task.dueWithTime;

async function moveOne(taskId) {
  const tomorrow = nextDayStr();
  await PluginAPI.updateTask(taskId, { dueDay: tomorrow });
  PluginAPI.showSnack({ msg: 'Moved to ' + tomorrow, type: 'SUCCESS' });
}

async function moveAllUnfinished() {
  const today = dayStr(new Date());
  const tomorrow = nextDayStr();
  const tasks = await PluginAPI.getTasks();
  const candidates = tasks.filter((t) => isCandidate(t, today));
  const movable = candidates.filter((t) => !t.dueWithTime);
  const timed = candidates.length - movable.length;

  if (!movable.length) {
    PluginAPI.showSnack({
      msg: timed
        ? 'Only tasks with a set time are left — move those one at a time.'
        : 'Nothing due today is unfinished.',
      type: 'INFO',
    });
    return;
  }

  const okLabel = 'Move ' + movable.length + (movable.length === 1 ? ' task' : ' tasks');
  const listed = movable
    .slice(0, MAX_LISTED)
    .map((t) => '<li>' + esc(t.title) + '</li>')
    .join('');
  const more =
    movable.length > MAX_LISTED
      ? '<li>…and ' + (movable.length - MAX_LISTED) + ' more</li>'
      : '';
  const timedNote = timed
    ? '<p>Leaving ' + timed + ' timed task' + (timed === 1 ? '' : 's') + ' alone.</p>'
    : '';

  const result = await PluginAPI.openDialog({
    title: 'Move to ' + tomorrow + '?',
    htmlContent:
      '<p>' +
      movable.length +
      ' unfinished task' +
      (movable.length === 1 ? '' : 's') +
      ':</p><ul>' +
      listed +
      more +
      '</ul>' +
      timedNote,
    buttons: [{ label: okLabel, raised: true }, { label: 'Keep them' }],
  });
  // openDialog resolves to the clicked button's label; dismissing gives undefined.
  if (result !== okLabel) return;

  let moved = 0;
  for (const task of movable) {
    try {
      await PluginAPI.updateTask(task.id, { dueDay: tomorrow });
      moved++;
    } catch (e) {
      console.error('[move-to-tomorrow] could not move ' + task.id, e);
    }
  }
  PluginAPI.showSnack({
    msg: 'Moved ' + moved + ' of ' + movable.length + ' to ' + tomorrow,
    type: moved === movable.length ? 'SUCCESS' : 'WARNING',
  });
}

if (typeof PluginAPI !== 'undefined') {
  PluginAPI.registerHeaderButton({
    label: 'Unfinished → Tomorrow',
    icon: 'event_available',
    onClick: moveAllUnfinished,
  });
  // Older app versions have no task context menu API; the header button still works.
  if (typeof PluginAPI.registerTaskContextMenuEntry === 'function') {
    PluginAPI.registerTaskContextMenuEntry({
      id: 'move-to-tomorrow',
      label: 'Move to tomorrow',
      icon: 'event',
      onClick: (ctx) => moveOne(ctx.taskId),
    });
  }
}

// Lets test/verify.js exercise the date and filter logic outside the app.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dayStr, nextDayStr, isCandidate, isMovable };
}
