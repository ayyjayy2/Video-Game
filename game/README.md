# Whisker Worlds: the game

A third-person 3D adventure built with [Three.js](https://threejs.org). It runs in phone and desktop browsers with touch, keyboard and mouse, or gamepad controls.

## Run it

The game uses JavaScript modules, so it must be served over HTTP (opening `index.html` straight from disk will not work):

```sh
cd game
npm start          # serves on http://localhost:8080
```

Any static web server works, for example `python3 -m http.server 8080`. To try it on a phone, run the server on your computer and open `http://<your-computer's-ip>:8080` on the phone (same Wi-Fi).

## Controls

| Action | Touch | Keyboard / mouse | Gamepad |
|---|---|---|---|
| Move | Left side of the screen | W A S D | Left stick |
| Look | Drag the right side (double-tap to recenter) | Drag the mouse | Right stick |
| Jump (hold while falling to glide) | Jump | Space | A |
| Paw: talk, pull, ring. With nothing nearby, Asher pounces and Cappuccino uses Whisker Sense | Paw | E | X |
| Swap cats | Swap, or tap a portrait | Tab | Y |
| Skill (Wind-Up Spring, Spin Dash, Echo Meow) | Skill | Shift | Right trigger |
| Next skill | Arrow button | Q | Right bumper |
| Map / pause | Map / II | M / Esc | Select / Start |

## Code map

- `js/game.js`: main loop, player and follower cats, camera, abilities, saving, story flow
- `js/level.js`: level building blocks and physics (platforms, moving and hidden platforms, crates, plates, vents, pickups)
- `js/cat.js`, `js/critters.js`, `js/props.js`: the cats, the residents and the scenery, built from simple shapes
- `js/levels/`: the apartment hub, worlds 1 to 4, worlds 5 to 7 and the finale
- `js/story.js`: world list, abilities and story text
- `js/ui.js`, `js/input.js`, `js/audio.js`: interface, controls and synthesised sound

## Packaging later

- **iOS and Android:** wrap the folder with [Capacitor](https://capacitorjs.com).
- **Desktop / Steam:** wrap with Electron or Tauri.

The 3D cats and worlds are stand-ins made of simple shapes. Real models exported as glTF can replace them using Three.js's `GLTFLoader`.
