let updateTimeout;

let setupFunction;
let clickFunction;
let updateFunction;
let drawFunction;

let _game = {};
let _frame = 0;
let _keys = {};

let _images = {};
let _modules = {};

let _imageCache = [];
let _audioCache = [];

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
  _imageCache.push(img);
  return img;
}

function addSound(src) {
  const aud = new Audio();
  aud.src = src;
  _audioCache.push(aud);
  return aud;
}

function require(file) {
  if (LOCKED_FILES.includes(file)) return;
  if (file.startsWith('ext') && file.includes('/')) return;

  const text = window.localStorage.getItem(`${file}-code`);

  if (!text) {
    console.log(`Ignoring ${file}.js, because it's empty.`);
    return;
  }
  if (!_modules[file]) {
    const buildFile = new Function(text);
    _modules[file] = buildFile();
  }

  return _modules[file];
}

async function requireExternal(url) {
  const id = `ext-${new Date().getTime()}`;
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.onload = () => {
    Promise.resolve(true);
  };
  script.onerror = e => {
    Promise.reject(`Could not load external library ${url}`);
  }
  script.src = url;
  script.id = id;
  document.body.appendChild(script);
}

async function saveRun() {
  // make sure current tab is saved
  saveCurrentTab();

  // clear module cache
  _modules = {};
  
  // clear audio and images
  _imageCache.forEach(img => delete img);
  _imageCache = [];
  _audioCache.forEach(aud => aud.pause() && delete aud);
  _audioCache = [];

  // remove external scripts
  const externalScripts = Array.from(document.querySelectorAll('script[id*="ext-"]'));
  externalScripts.forEach(s => document.body.removeChild(s));

  // stop all sounds that are running
  const sounds = Array.from(document.querySelectorAll('audio'));
  sounds.forEach(sound => {
    sound.pause();
  });

  _game = {};
  _frame = 0;
  _keys = {};

  // wacky but this is the actual way to do it https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

  setupFunction = new AsyncFunction('game', window.localStorage.getItem('setup-code'));
  await setupFunction(_game);

  clickFunction = new Function('game', 'event', window.localStorage.getItem('click-code'));
  updateFunction = new Function('game', 'frame', 'keys', window.localStorage.getItem('update-code'));
  drawFunction = new Function('game', 'images', 'frame', 'context', 'canvas', window.localStorage.getItem('draw-code'));
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