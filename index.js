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

let _offset = { x: 0, y: 0 };

let _cursor = null;
const _scrollCanvas = {
  left: false,
  right: false,
  up: false,
  down: false,
  scrolling: () => _scrollCanvas.left || _scrollCanvas.right || _scrollCanvas.up || _scrollCanvas.down,
};

const SCROLL_SPEED = 1 / 3;
const GRID_SIZE = 64;
const GRID_COLOR = '#555';
const CURSOR_COLOR = '#0ff';
let drawGrid = true;

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
  const canvas = document.querySelector('canvas');

  canvas.addEventListener('mousedown', event => {
    const { x, y } = event;
    if (clickFunction) clickFunction(_game, { x, y });
    
    const gridStartX = Math.floor(_offset.x / GRID_SIZE) * GRID_SIZE;
    const gridStartY = Math.floor(_offset.y / GRID_SIZE) * GRID_SIZE;
    console.log('GRID START', gridStartX, gridStartY);
  });

  canvas.addEventListener('mousemove', event => {
    const { offsetX: x, offsetY: y } = event;
    const { height, width } = canvas.getBoundingClientRect();
    const scaleH = canvas.height / height;
    const scaleW = canvas.width / width;
    const gridScaled = GRID_SIZE / scaleH; // scaleW and scaleH _should_ be the same
    
    _scrollCanvas.left = x < gridScaled;
    _scrollCanvas.right = x > width - gridScaled;
    _scrollCanvas.up = y < gridScaled;
    _scrollCanvas.down = y > height - gridScaled;

    if (!_scrollCanvas.scrolling()) {
      const canvasX = x * scaleW;
      const canvasY = y * scaleH;
      _cursor = { x: canvasX, y: canvasY };
    } else {
      _cursor = null;
    }
  });

  canvas.addEventListener('mouseout', event => {
    _scrollCanvas.left = false;
    _scrollCanvas.right = false;
    _scrollCanvas.up = false;
    _scrollCanvas.down = false;
    _cursor = null;
  });
}

function update() {
  try {
    if (_scrollCanvas.scrolling()) {
      const scrollAmt = GRID_SIZE * SCROLL_SPEED;
      if (_scrollCanvas.left) _offset.x -= scrollAmt;
      else if (_scrollCanvas.right) _offset.x += scrollAmt;
      if (_scrollCanvas.up) _offset.y -= scrollAmt;
      else if (_scrollCanvas.down) _offset.y += scrollAmt;
    }
    if (updateFunction) updateFunction(_game, _frame, { ..._keys });
    _frame++;
    // remove released keys
    Object.entries(_keys).forEach(([key, value]) => {
      if (value === -1) {
        delete _keys[key];
      }
    });
  } catch (ex) { console.error(ex); }
  window.setTimeout(update, 30);
}

function draw() {
  try {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      context.save();
      context.translate(-_offset.x, -_offset.y);

      if (drawGrid) {
        const gridStartX = Math.floor(_offset.x / GRID_SIZE) * GRID_SIZE;
        const gridStartY = Math.floor(_offset.y / GRID_SIZE) * GRID_SIZE;
        
        context.fillStyle = '#501';
        context.fillRect(GRID_SIZE, canvas.height - (3 * GRID_SIZE), GRID_SIZE, GRID_SIZE);

        context.save();
        context.lineWidth = 1;
        context.strokeStyle = GRID_COLOR;
        for(let h = gridStartX; h <= canvas.width + gridStartX + GRID_SIZE; h += GRID_SIZE) {
          context.beginPath();
          context.moveTo(h, gridStartY);
          context.lineTo(h, canvas.height + gridStartY + GRID_SIZE);
          context.stroke();
          context.closePath();
        }
        for(let w = gridStartY; w <= canvas.height + gridStartY + GRID_SIZE; w += GRID_SIZE) {
          context.beginPath();
          context.moveTo(gridStartX, w);
          context.lineTo(canvas.width + gridStartX + GRID_SIZE, w);
          context.stroke();
          context.closePath();
        }

        if (_cursor) {
          context.save();
          context.globalAlpha = 0.3;
          const { x, y } = _cursor;
          const cellX = Math.floor((x + _offset.x) / GRID_SIZE);
          const cellY = Math.floor((y + _offset.y) / GRID_SIZE);
          context.fillStyle = CURSOR_COLOR;
          context.fillRect(cellX * GRID_SIZE, cellY * GRID_SIZE, GRID_SIZE, GRID_SIZE);
          context.restore();
        }
        context.restore();
      } 

      context.restore();

      if (drawFunction) drawFunction(_game, _images, _frame, context, canvas);
    }
  } catch (ex) { console.error(ex); }

  window.requestAnimationFrame(draw);
}

window.setTimeout(update, 30);
window.requestAnimationFrame(draw);