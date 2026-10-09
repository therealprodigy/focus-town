# Development log

## 8 October 2026: a desk to come back to

The opening screen has become two connected places: Greenvale and Lantern House. The apprentice can walk around walls and trees, talk to Rowan and Mira, and read the village notices. The scenery and characters are original pixel drawings built in Canvas.

The desk offers 15, 25, 45, and 60 minute focus sessions. Completed sessions earn energy, XP, and coins. Pausing keeps the remaining time; a running session keeps its deadline through a reload. Breaks lead the apprentice to bed and give no extra rewards.

The tricky part was keeping progress consistent. A finished timer and its rewards are saved together. A browser lock prevents two tabs from writing to the same notebook. Review also caught a stale interaction prompt after scene changes and a lock-acquisition race during React development reloads; both were corrected before the latest build.

### Verified

- 20 automated tests passed.
- The production build passed.
- Route tests reached every village and house interaction from its spawn.

### Still to check

- The village and house in a real browser at desktop and phone sizes.
- Keyboard and touch movement, focus recovery, and dialog closing.
- Reloading an active or paused timer and handing the notebook between two tabs.
- How the character looks while studying, walking to bed, and waking up.

Browser preview access was declined during this development session, so these remain unverified. The shop, library, forest, enemies, quests, and equipment are future work. Nothing has been submitted to Pixl or published as a playable release by this entry.

### Pixl journal draft

This update adds a village, a house, and the first focus loop. The apprentice can reach the desk, choose a session, and save its timer and progress locally. I used AI assistance for the implementation, pixel drawings, tests, and documentation. Automated checks passed, but the full browser playtest is still pending. The next useful test is the complete walk from the fountain to the desk, followed by a pause and reload.

This draft describes project changes. It does not claim human coding hours or a personal playtest. Before posting it, add what you worked on yourself, what confused you, and what you noticed while playing. Any required time entry must match verified Hackatime records.

## 9 October 2026: Focus Town

Renamed the game to Focus Town. The original save key and time-tracking identifier remain in place so existing history stays together. Removed the separate AI disclosure file at the owner’s request; disclosure belongs in the submission form when it is filled out.

The local preview had no running server. The VS Code Run configuration now starts Vite, waits for its ready address, and then opens the game.

The owner will run the game and do the next debugging pass. The updated Run configuration has not yet been tested interactively.
