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

function saveRun() {
  // make sure current tab is saved
  saveCurrentTab();

  // stop all sounds that are running
  const sounds = Array.from(document.querySelectorAll('audio'));
  sounds.forEach(sound => {
    sound.pause();
  });
  
  // run all NON-required code first
  // how do we run it in the same context and remove other code...

  allFiles.forEach(file => {
    if (LOCKED_FILES.includes(file)) return;
    const text = window.localStorage.getItem(`${file}-code`);
    if (text.startsWith('class ')) {
      let i = 6;
      let className = '';
      while (text[i] !== ' ' && text[i] != '{') {
        className += text[i];
        i++;
      }
      if (!text.endsWith(`return ${className};`)) {
        throw new Error(`Must return class ${className} at end of ${file}.js!`)
      }
      const classFactory = new Function(text);
      window[className] = classFactory();
    } else {
      throw new Error(`${file}.js must define and return a class.`);
    }
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
  } catch (ex) {}
  window.setTimeout(update, 30);
}

function draw() {
  try {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (drawFunction) drawFunction(_game, _images, _frame, context, canvas);
  } catch (ex) {}

  window.requestAnimationFrame(draw);
}

window.setTimeout(update, 30);
window.requestAnimationFrame(draw);