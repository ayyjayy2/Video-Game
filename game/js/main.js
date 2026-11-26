import { Game } from './game.js';

const $ = (s) => document.querySelector(s);
let game;
try {
  game = new Game();
} catch (e) {
  $('#fatal').hidden = false;
  $('#fatal').textContent = 'Sorry, this device could not start 3D graphics (WebGL). ' + e.message;
  throw e;
}

const hasSave = game.save.seenIntro;
$('#btnPlay').textContent = hasSave ? 'Continue' : 'Play';
$('#btnNew').hidden = !hasSave;
$('#btnPlay').addEventListener('click', () => game.start());
$('#btnNew').addEventListener('click', () => {
  $('#confirmNew').hidden = false;
});
$('#cnYes').addEventListener('click', () => { game.resetSave(); $('#confirmNew').hidden = true; game.start(); });
$('#cnNo').addEventListener('click', () => { $('#confirmNew').hidden = true; });

const soundBtns = document.querySelectorAll('.btnSound');
const syncSound = () => soundBtns.forEach((b) => { b.textContent = game.sound.muted ? 'Sound: off' : 'Sound: on'; });
soundBtns.forEach((b) => b.addEventListener('click', () => { game.sound.init(); game.sound.setMuted(!game.sound.muted); syncSound(); }));
syncSound();
document.querySelectorAll('.btnHow').forEach((b) => b.addEventListener('click', () => { $('#how').hidden = false; }));
$('#howClose').addEventListener('click', () => { $('#how').hidden = true; });

// Dialogue and cards advance on tap or click.
$('#dialog').addEventListener('click', () => { game.sound.click(); game.ui.advance(); });
$('#cardBtn').addEventListener('click', () => { game.sound.click(); game.ui.advance(); });
$('#duet').addEventListener('pointerdown', (e) => { e.preventDefault(); if (game.ui.duetTap) game.ui.duetTap(); });

// Pause menu
$('#pauseBtn').addEventListener('click', () => { if (game.state === 'play' && !game.ui.modal) game.ui.showMenu(game.level.id !== 'hub'); });
$('#mResume').addEventListener('click', () => game.ui.hideMenu());
$('#mMap').addEventListener('click', () => { game.ui.hideMenu(); game.ui.showMap(game); });
$('#mRespawn').addEventListener('click', () => { game.ui.hideMenu(); game.respawn(); });
$('#mHub').addEventListener('click', () => { game.ui.hideMenu(); game.load('hub', { fromWorld: game.level.id }); });
$('#mapClose').addEventListener('click', () => game.ui.hideMap());
$('#mapBtn').addEventListener('click', () => { if (game.state === 'play' && !game.ui.modal) game.ui.showMap(game); });
