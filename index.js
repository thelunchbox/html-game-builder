let updateTimeout;

let setupFunction;
let clickFunction;
let updateFunction;
let drawFunction;

let _game = {};

function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

let filePicker;

function readSingleFile(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
    finishImport(contents);
  };
  reader.readAsText(file);
}

function importGame() {
  filePicker = document.createElement('input');
  filePicker.type = 'file';
  filePicker.addEventListener('change', readSingleFile);
  filePicker.click();
}

function finishImport(content) {
  const json = JSON.parse(atob(content));
  Object.entries(json).forEach(([key, text]) => {
    document.getElementById(key).value = text;
  });
  saveRun();
  filePicker = null;
}

function exportGame() {
  const filename = prompt('name your file', 'game');
  if (!filename) return;
  const content = {
    'setup-code': getText('setup-code'),
    'click-code': getText('click-code'),
    'update-code': getText('update-code'),
    'draw-code': getText('draw-code'),
  };

  const text = btoa(JSON.stringify(content));
  download(text, filename + '.gm', 'text/plain');
}

function toggle(event, key) {
  event.target.classList.toggle('hidden');
  document.getElementById(key).classList.toggle('hide');
}

function restoreText(key) {
  const text = window.localStorage.getItem(key);
  document.getElementById(key).value = text;
}

function getText(key) {
  const text = document.getElementById(key).value;
  window.localStorage.setItem(key, text);
  return text;
}

function saveRun() {
  setupFunction = new Function('game', getText('setup-code'));
  clickFunction = new Function('game', 'event', getText('click-code'));
  updateFunction = new Function('game', 'frame', getText('update-code'));
  drawFunction = new Function('game', 'context', 'canvas', getText('draw-code'));

  _game = {};
  _frame = 0;
  setupFunction(_game);
}

function setupCanvasClickHandler() {
  document.querySelector('canvas').addEventListener('mousedown', event => {
    const { x, y } = event;
    if (clickFunction) clickFunction(_game, { x, y });
  });
}

function update() {
  if (updateFunction) updateFunction(_game, _frame);
  _frame++;
  window.setTimeout(update, 30);
}

function draw() {
  try {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (drawFunction) drawFunction(_game, context, canvas);
  } catch (ex) {}

  window.requestAnimationFrame(draw);
}

window.setTimeout(update, 30);
window.requestAnimationFrame(draw);