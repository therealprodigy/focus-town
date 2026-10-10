# Asset credits

## Fonts

All fonts are bundled locally under SIL Open Font License 1.1. Full copyright and license notices are included beside the font files.

| Font             | Use                   | Source                                                                        | License file                         |
| ---------------- | --------------------- | ----------------------------------------------------------------------------- | ------------------------------------ |
| Instrument Serif | Bundled, not used     | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/instrumentserif) | public/fonts/InstrumentSerif-OFL.txt |
| Inter            | Bundled, not used     | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/inter)           | public/fonts/Inter-OFL.txt           |
| Silkscreen       | Wordmark and headings | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/silkscreen)      | public/fonts/Silkscreen-OFL.txt      |
| VT323            | Clock and interface   | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/vt323)           | public/fonts/VT323-OFL.txt           |

## Observatory illustration

public/art/observatory.png is an original image generated with OpenAI image generation for this project on 9 October 2026. It is 1672 by 941 pixels. It is not a screenshot from another game or an illustration drawn by the project owner.

Generation direction: original 16:9 restrained 16-bit pixel-art magical hillside village at blue hour, viewed from a quiet observatory balcony; books and a copper lantern at lower left; pine forest, river and warm cottage windows; an original asymmetric wizard academy on the far-right hill; quiet dark upper-middle sky for the timer; no people, text, UI, logos or borders; limited indigo, teal and copper palette; crisp pixels. No Hogwarts replica.

## Town artwork

The characters, buildings, terrain and lighting are original Canvas pixel drawings made with AI assistance. No Terraria, Stardew Valley, Flocus or Harry Potter artwork is bundled. The owner requested a magical-school mood and Terraria as references. [Stardew Valley's official media](https://www.stardewvalley.net/media/) informed the earlier terrain pass.

## Interface references

[Flocus](https://flocus.com/features/pomodoro-timer) informed timer hierarchy and session controls. [Aceternity's floating dock](https://ui.aceternity.com/components/floating-dock) informed the compact reveal-on-demand navigation. No Aceternity source code was copied. The shared button follows shadcn/ui's Radix Slot and class-variance-authority pattern, with Focus Town's own styles. Package licenses remain with their respective dependencies.

## Sound library

Five CC0 recordings are bundled locally as mono 44.1 kHz, 48 kbps MP3 files. No external audio server is contacted during playback. Re-encoding removes metadata; rain and birds use the mirror's processed loops. Source licensing was checked on 9 October 2026. Playback taste and volume remain part of the owner's playtest.

| File                    | Recording and creator                      | Source / provenance                                                                                                                                 |
| ----------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| public/audio/rain.mp3   | Rain on Window, silencyo                   | https://freesound.org/people/silencyo/sounds/81818/ ; https://github.com/twtrubiks/moonseal/blob/main/public/audio/README.md                        |
| public/audio/forest.mp3 | Birds singing, Dawn chorus, SamsterBirdies | https://freesound.org/people/SamsterBirdies/sounds/578523/ ; same mirror README                                                                     |
| public/audio/fire.mp3   | Fireplace.wav, inchadney                   | https://freesound.org/people/inchadney/sounds/132534/ ; https://github.com/Muges/ambientsounds                                                      |
| public/audio/lofi.mp3   | Lofi Hip Hop Loop, omfgdude / OMF-Games    | https://opengameart.org/content/lofi-hip-hop-loop ; https://github.com/euuuuuuan/neko-shift-public/blob/main/docs/AUDIO_SOURCING.md                 |
| public/audio/chime.mp3  | Interface Sounds, confirmation_001, Kenney | https://kenney.nl/assets/interface-sounds ; https://github.com/lavenderdotpet/CC0-Public-Domain-Sounds/blob/main/kenney_interfacesounds/License.txt |

License: https://creativecommons.org/publicdomain/zero/1.0/

Direct OpenGameArt downloads returned HTTP 403 in this environment. The files above were imported from the credited public mirrors through GitHub's Contents API. The initially researched piano and rain tracks from OpenGameArt are not bundled.

## 10 October town expansion

The timber house details, shop crates, library cupola, glasshouse, orchard, garden paths, bench, telescope, workbench, outfit palettes and pixel interface symbols are original code-drawn assets in this repository, made with AI assistance. No new external artwork or sound files were added. The twenty-four encouragement lines and garden notes were written for Focus Town; they are not attributed quotations.

MotionSites.ai was reviewed for interface motion references. Its glass, glow and template treatments were not adopted. Motion's reduced-motion guidance informed the decision to keep essential clocks running while ambient motion is disabled. No animation dependency was added.
