# Outstanding — Bot Crossing (Fedrick's fork)

Open ends in this fork of `Station-Sciences/bot-crossing`. It runs locally only; there is
nothing deployed, so nothing here is ever "live" in the Vercel sense.

Last updated: 2026-09-15

---

## Open

- [ ] **2026-09-15 — Commit `c7bea24` is on the laptop, not on GitHub.** "Stop a thread asking for
      you after you have read it". Everything before it is pushed. Blocked on: Fedrick saying push.

- [ ] **2026-09-14 — Offer commit `6c9a1eb` upstream as a pull request.** It fixes a genuine bug in
      the author's own code: `placeCard` in `src/ui/hud.js` only clamps the thread card back into
      the window on the flipped path, so an astronaut off the LEFT edge gets a card hanging off the
      screen with its text cut in half. It is deliberately a standalone commit so it cherry-picks
      cleanly. Blocked on: Fedrick deciding whether he wants his name on a PR to that repo.

- [ ] **2026-09-14 — The `sizeBytes` / thread payload still carries `preview` that nothing renders.**
      `server/harnesses/claude-code.mjs` sends a 240-character `preview` per thread and no code in
      `src/` reads it. Dropping it server-side would send less of each conversation to the browser
      for zero UI cost. Noticed during the privacy audit; out of scope at the time.

- [ ] **2026-09-14 — Upstream README overstates what the app writes.** `README.md` still describes an
      `/api/archive` endpoint and an `isArchived` write into Claude Code's own records. Neither
      exists any more — `server/harnesses/README.md` records that the write was removed. Anyone
      auditing this by the README will look for a write that is not there. Worth fixing in the same
      PR as above, or its own.

- [ ] **2026-09-14 — `BOT_CROSSING_HOST` on a LAN address also serves the off-the-map repo names.**
      `server/api.mjs` widens the allowed hosts to the machine's LAN IPv4 when that variable is set,
      and `GET /api/state` returns `hiddenProjects` unconditionally. The passcode is a curtain over
      the sidebar, not over the API. Not a defect at the 127.0.0.1 default — but the README line
      "There is no password, because there was never meant to be anything to guard" stopped being
      true once the passcode landed. Document it, or gate it.

## Done

- [x] 2026-09-14 — Show what a thread last said on its card (`15172cb`).
- [x] 2026-09-14 — Keep the thread card inside the window when its astronaut is off to the left (`6c9a1eb`).
- [x] 2026-09-14 — Show a repo's open `TODO.md` work on its zone (`eff2be0`).
- [x] 2026-09-14 — Click a to-do to take it into the newest conversation in its repo (`92c880c`).
- [x] 2026-09-14 — Offer a to-do the other route: a new conversation, already typed in (`52f8c8d`).
- [x] 2026-09-14 — Send a to-do to a session created seconds ago, not the last one used (`dfbf0ff`).
- [x] 2026-09-14 — Point a to-do's prompt at `HANDOFF.md`, not just `TODO.md` (`254268d`).
- [x] 2026-09-14 — Passcode over the off-the-map list (`6b3501c`), then hardened so it cannot wipe,
      replace or leave itself open (`16f7469`).
- [x] 2026-09-14 — Five clicks on the ship to show or hide the off-the-map row (`73fe5e3`), surviving
      a page reload (`6e0d318`).
- [x] 2026-09-15 — Show a thread as working while its background agents run (`152af02`).
- [x] 2026-09-15 — Stop a thread asking for you after you have read it (`c7bea24`, unpushed).
