# Move Unfinished to Tomorrow

Super Productivity plugin: reschedule what you didn't get to, in one move.

- **Task context menu → Move to tomorrow** — one task, one tap.
- **Header button "Unfinished → Tomorrow"** — lists everything still due today
  (plus overdue), then moves all of it after you confirm.

Every write is just `updateTask(id, { dueDay })`, so task history, time spent and
repeats are untouched.

## What it deliberately does not touch

- **Tasks with a set reminder time** (`dueWithTime`) stay where they are.
  Moving the day without the time would leave a notification pointing at the
  old slot. Move those one at a time.
- **Recurring originals** — the instance owns its day.
- **Done tasks**, and anything already scheduled for later.

## Not wired into "Finish Day"

`finishDay` hook handlers are raced against a 5 s timeout, so a confirmation
dialog inside the hook would be abandoned mid-interaction. Silent
rescheduling at finish-day would also be automation you didn't ask for.

## Install

```sh
cd plugins/move-to-tomorrow
zip -r ../../move-to-tomorrow.zip manifest.json plugin.js
```

Then **Settings → Plugins → Upload plugin** in the app. iOS: plugins run only
while the app is open.

## Self-checks

```sh
node test/smoke.js                 # plugin.js against a stubbed PluginAPI
TZ=America/New_York node test/verify.js   # local-day math and the filter
```
