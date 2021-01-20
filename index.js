let updateTimeout;

let setupFunction;
let clickFunction;
let updateFunction;
let drawFunction;

let _game = {};
let _frame = 0;
let _keys = {};

let _images = {};

window.addEventListener('keydown', event => {
  if (_keys[event.key] === undefined || _keys[event.key] === -1) {
    _keys[event.key] = _frame;
  }
}, false);
window.addEventListener('keyup', event => {
  _keys[event.key] = -1;
}, false);

function addImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function addSound(src) {
  const aud = new Audio();
  aud.src = src;
  return aud;
}

function require(file) {
  if (LOCKED_FILES.includes(file)) return;
  if (file.startsWith('ext') && file.includes('/')) return;

  const text = window.localStorage.getItem(`${file}-code`);

  if (!text) {
    console.log(`Ignoring ${file}.js, because it's empty.`);
  } else {
    const buildFile = new Function(text);
    return buildFile();
  }
}

function saveRun() {
  // make sure current tab is saved
  saveCurrentTab();

  // stop all sounds that are running
  const sounds = Array.from(document.querySelectorAll('audio'));
  sounds.forEach(sound => {
    sound.pause();
  });

  setupFunction = new Function('game', window.localStorage.getItem('setup-code'));
  clickFunction = new Function('game', 'event', window.localStorage.getItem('click-code'));
  updateFunction = new Function('game', 'frame', 'keys', window.localStorage.getItem('update-code'));
  drawFunction = new Function('game', 'images', 'frame', 'context', 'canvas', window.localStorage.getItem('draw-code'));

  _game = {};
  _frame = 0;
  _keys = {};
  setupFunction(_game);
}

function setupCanvasClickHandler() {
  document.querySelector('canvas').addEventListener('mousedown', event => {
    const { x, y } = event;
    if (clickFunction) clickFunction(_game, { x, y });
  });
}

function update() {
  try {
    if (updateFunction) updateFunction(_game, _frame, { ..._keys });
    _frame++;
    // remove released keys
    Object.entries(_keys).forEach(([key, value]) => {
      if (value === -1) {
        delete _keys[key];
      }
    });
  } catch (ex) { throw ex; }
  window.setTimeout(update, 30);
}

function draw() {
  try {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (drawFunction) drawFunction(_game, _images, _frame, context, canvas);
    }
  } catch (ex) { throw ex; }

  window.requestAnimationFrame(draw);
}

window.setTimeout(update, 30);
window.requestAnimationFrame(draw);