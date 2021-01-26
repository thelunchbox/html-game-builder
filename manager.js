let LOCKED_FILES = ['setup', 'update', 'draw', 'click'];

function getTabState() {
  return JSON.parse(window.localStorage.getItem('tab-state'));
}

function saveTabState(tabs) {
  window.localStorage.setItem('tab-state', JSON.stringify(tabs));
}

function getFileState() {
  return JSON.parse(window.localStorage.getItem('all-files'));
}

function saveFileState(files) {
  window.localStorage.setItem('all-files', JSON.stringify(files));
}

function initializeMenu() {
  const menus = Array.from(document.querySelectorAll('.menu'));
  menus.forEach(menu => {
    Array.from(menu.children).forEach(item => {
      item.addEventListener('click', () => {
        menu.parentElement.blur();
      });
    });
  });
}

function saveCurrentTab() {
  const codeEditor = document.querySelector('#code-editor');
  const currentSelectedTab = openTabs.find(t => t.active);
  if (!currentSelectedTab) return;
  window.localStorage.setItem(`${currentSelectedTab.name}-code`, codeEditor.value);
}

let allFiles = getFileState() || [...LOCKED_FILES];
let openTabs = getTabState() || LOCKED_FILES.map((name, i) => ({
  name,
  active: i === 0,
}));

saveTabState(openTabs);
saveFileState(allFiles);

function download(data, filename, type) {
  var file = new Blob([data], { type: type });
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

async function loadTutorial(step) {
  const response = await fetch(`./samples/asteroids/asteroids-${step}.gm`);
  const contents = await response.text();
  finishImport(contents);
}

function importGame() {
  filePicker = document.createElement('input');
  filePicker.type = 'file';
  filePicker.addEventListener('change', readSingleFile);
  filePicker.click();
}

function finishImport(content) {
  const json = JSON.parse(atob(content));
  allFiles = [];
  openTabs = LOCKED_FILES.map((name, i) => ({
    name,
    active: i === 0,
  }));
  Object.entries(json).forEach(([key, value]) => {
    if (key === '_images') {
      loadImages(value);
    } else {
      window.localStorage.setItem(`${key}`, value);
      allFiles.push(key.substr(0, key.length - 5));
    }
  });
  saveFileState(allFiles);
  initializeFiles();
  initializeTabs();
  loadExternals();
  const newlySelectedTab = openTabs[0];
  const codeEditor = document.querySelector('#code-editor');
  codeEditor.value = window.localStorage.getItem(`${newlySelectedTab.name}-code`) || '';
  saveRun();
  filePicker = null;
}

function loadImages(array) {
  if (!array) return;
  _images = array.reduce((agg, { name, src }) => {
    const img = new Image();
    img.src = src;
    return {
      ...agg,
      [name]: img,
    };
  }, {});
  window.localStorage.setItem('_images', JSON.stringify(getImages()));
}

function loadExternals() {
  allFiles.filter(x => x.startsWith('ext') && x.includes('/')).forEach(file => {
    const [id] = file.split('/');
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = window.localStorage.getItem(`${file}-code`);
    script.id = id;
    document.body.appendChild(script);
  });
}

function getImages() {
  return Object.entries(_images).map(([name, img]) => ({ name, src: img.src }));
}

function exportGame(internal = false) {
  // THIS IS NOT WORKING...
  saveCurrentTab();
  const filename = internal ? 'x' : prompt('name your file', 'game');
  if (!filename) return;
  const content = {
    ...allFiles.reduce((res, file) => ({
      ...res,
      [`${file}-code`]: window.localStorage.getItem(`${file}-code`),
    }), {}),
    '_images': getImages(),
  };

  const text = btoa(JSON.stringify(content));
  if (!internal) download(text, filename + '.gm', 'text/plain');
  return text;
}

function newGame() {
  if (window.confirm('This will delete your current game, do you want to continue?')) {
    // go through and delete all local storage for any files
    allFiles.forEach(file => window.localStorage.removeItem(`${file}-code`));

    // reset to default state
    allFiles = [...LOCKED_FILES];
    openTabs = LOCKED_FILES.map((name, i) => ({
      name,
      active: i === 0,
    }));

    window.localStorage.clear();
    const externalScripts = Array.from(document.querySelectorAll('script[id*="ext-"'));
    externalScripts.forEach(s => document.body.removeChild(s));

    initializeTabs();
    initializeFiles();
    document.querySelector('#code-editor').value = '';
  }
}

function loadImage() {
  document.getElementById('image-loader').classList.add('show');
}

let currentImage;

function readImageFile(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;
    currentImage = contents;
  };
  reader.readAsDataURL(file);
}

function doLoadImage() {
  const name = document.getElementById('image-name').value;

  const src = currentImage;
  const img = new Image();
  img.src = src;
  img.onload = () => {
    _images[name] = img;
    window.localStorage.setItem('_images', JSON.stringify(getImages()));
  };
  cancelLoadImage();
}

function cancelLoadImage() {
  document.getElementById('image-name').value = null;
  document.getElementById('image-filepath').value = null;
  currentImage = null;
  document.getElementById('image-loader').classList.remove('show');
}

function showUploadGame() {
  document.getElementById('library-loader').classList.add('show');
}

function uploadGame() {
  const name = document.querySelector('#game-name').value;
  const author = document.querySelector('#game-author').value;
  const description = document.querySelector('#game-description').value;
  const code = exportGame(true);
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  let screenshot = '';
  try {
    screenshot = canvas.toDataURL();
  } catch (e) { }
  if (!name) return alert('Name cannot be blank!');
  if (!author) return alert('Author cannot be blank!');
  if (!description) return alert('Description cannot be blank!');
  if (!code) return alert('Your code was not exported properly!');

  saveGame({ name, author, description, code, screenshot });
  // console.log({ name, author, description, code, screenshot });
  cancelUploadGame();
}

function cancelUploadGame() {
  document.getElementById('game-name').value = null;
  document.querySelector('#game-author').value = null;
  document.getElementById('game-description').value = null;
  document.getElementById('library-loader').classList.remove('show');
}

function showDocs(show) {
  const docs = document.querySelector('#docs-panel');
  if (show) {
    docs.classList.add('show');
  } else {
    docs.classList.remove('show');
  }
}

let resizing = false;
let showCode = true;

function startResize(event) {
  resizing = true;
}

function resizeCodePanel({ pageX }) {
  if (!resizing) {
    return;
  }
  const canvasContainer = document.querySelector('#canvas-container');
  const codeContainer = document.querySelector('#code-container');
  canvasContainer.style.width = pageX;
  codeContainer.style.width = window.innerWidth - pageX;
}

function endResize(e) {
  resizing = false;
}

function toggleCode(override) {
  if (override !== undefined) showCode = override;
  else showCode = !showCode;
  const canvasContainer = document.querySelector('#canvas-container');
  const codeContainer = document.querySelector('#code-container');
  const codeToggle = document.querySelector('#code-toggle');
  canvasContainer.style.transition = 'width 250ms ease-in-out';
  codeContainer.style.transition = 'width 250ms ease-in-out';
  if (showCode) {
    canvasContainer.style.width = 800;
    codeContainer.style.width = window.innerWidth - 800;
    codeToggle.classList.remove('closed');
    codeToggle.innerHTML = '&#9654;';
  } else {
    canvasContainer.style.width = window.innerWidth;
    codeContainer.style.width = 0;
    codeToggle.classList.add('closed');
    codeToggle.innerHTML = '&#9664;';
  }
  setTimeout(() => {
    canvasContainer.style.transition = '';
    codeContainer.style.transition = '';
  }, 250);
}

let showFiles = false;
let selectedFile = null;

function toggleFiles(override) {
  if (override !== undefined) showFiles = override;
  else showFiles = !showFiles;
  const filesBlock = document.querySelector('#files-block');
  const fileToggle = document.querySelector('#file-toggle');
  if (showFiles) {
    filesBlock.classList.add('show');
    fileToggle.innerHTML = '&laquo;';
  } else {
    filesBlock.classList.remove('show');
    fileToggle.innerHTML = '&raquo;';
  }
  window.localStorage.setItem('show-files', JSON.stringify(showFiles));
}

function createTab(tab, container) {
  const el = document.createElement('div');
  el.addEventListener('click', (event) => tabClick(event, tab.name));
  el.innerText = `${tab.name}.js`;
  if (tab.active) el.classList.add('active');
  container.appendChild(el);
}

function initializeTabs() {
  const tabContainer = document.querySelector('.tabs');
  tabContainer.innerHTML = '';
  openTabs.forEach(tab => createTab(tab, tabContainer));
  const selectedTab = openTabs.find(t => t.active);
  const codeEditor = document.querySelector('#code-editor');
  if (selectedTab) {
    codeEditor.value = window.localStorage.getItem(`${selectedTab.name}-code`) || '';
  } else if (openTabs.length >= 1) {
    selectTab(openTabs[0]);
  } else {
    codeEditor.style.display = 'none';
  }
}

function createFile(file, container) {
  const el = document.createElement('div');
  const originalFile = file;
  el.addEventListener('click', (event) => selectFile(event, originalFile));
  el.addEventListener('dblclick', (event) => createOrShowTab(originalFile));
  if (file.startsWith('ext') && file.includes('/')) {
    el.style.color = '#f70';
    el.setAttribute('data-id', file);
    [, file] = file.split('/');
  }
  const suffix = file.endsWith('.js') ? '' : '.js';
  let className = file.endsWith('.js') ? file.substr(0, file.length - 3) : file;
  className = className[0].toUpperCase() + className.substr(1);
  // if (!LOCKED_FILES.includes(file)) {
  //   localStorage.setItem(
  //     file.replace(/\W/g, '_') + '-code',
  //     `class ${className} {\n  \n}\n\nreturn ${className};`
  //   );
  // }

  el.innerText = `${file}${suffix}`;
  el.setAttribute('id', file.replace(/\W/g, '_') + '-file');
  container.appendChild(el);
}

function initializeFiles() {
  const filesContainer = document.querySelector('#files-list');
  filesContainer.innerHTML = '';
  allFiles.forEach(file => createFile(file, filesContainer));
}

function selectFile(event, file) {
  selectedFile = file;
  const el = event.target;
  const filesContainer = document.querySelector('#files-list');
  const children = Array.from(filesContainer.children);
  children.forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

function createOrShowTab(file) {
  if (file.startsWith('ext') && file.includes('/')) {
    alert('cant open external files!');
    return;
  }
  let targetTab = openTabs.find(t => t.name === selectedFile);
  if (!targetTab) {
    targetTab = { name: file };
    const tabContainer = document.querySelector('.tabs');
    createTab(targetTab, tabContainer);
    openTabs.push(targetTab);
    saveTabState(openTabs);
  }
  selectTab(targetTab);
}

function addFile() {
  let newFile = prompt('name for new file');
  if (!newFile) return;
  if (newFile.endsWith('.js')) newFile = newFile.substr(0, newFile.length - 3);
  if (newFile.match(/\W/)) newFile = newFile.replace(/\W/g, '_');
  if (allFiles.includes(newFile)) {
    alert('That file already exists, try again');
    return addFile();
  }

  const filesContainer = document.querySelector('#files-list');
  createFile(newFile, filesContainer);
  allFiles.push(newFile);
  saveFileState(allFiles);
}

function deleteFile() {
  if (!selectedFile) return;
  let id, file;
  if (selectedFile.startsWith('ext') && selectedFile.includes('/')) {
    [id, file] = selectedFile.split('/');
    document.body.removeChild(document.querySelector(`#${id}`));
  } else {
    file = selectedFile;
  }
  if (LOCKED_FILES.includes(selectedFile)) {
    alert(`Can't delete required file ${selectedFile}.js!`);
    return;
  }
  const fileElement = document.querySelector(`#${file.replace(/\W/g, '_')}-file`);
  const filesContainer = document.querySelector('#files-list');
  filesContainer.removeChild(fileElement);

  window.localStorage.removeItem(`${selectedFile}-code`);
  const i = allFiles.indexOf(selectedFile);
  allFiles.splice(i, 1);
  saveFileState(allFiles);

  // if a tab is open, remove it  
  let targetTab = openTabs.find(t => t.name === selectedFile);
  const wasActive = targetTab && targetTab.active;
  const index = targetTab ? deleteTab(targetTab) : -1;
  if (index < 0 || !wasActive) return;
  targetTab = openTabs[index];
  selectTab(targetTab);
}

function tabClick(event, key) {
  const tab = event.target;

  let targetTab = openTabs.find(t => t.name === key);
  const isActive = targetTab.active;
  if (event.offsetX > tab.offsetWidth - 20) {
    const index = deleteTab(targetTab);
    if (index < 0 || !isActive) return;
    targetTab = openTabs[index];
  }
  selectTab(targetTab);
}

function selectTab(tab) {
  const codeEditor = document.querySelector('#code-editor');
  const tabContainer = document.querySelector('.tabs');
  const tabs = Array.from(tabContainer.children);
  tabs.forEach(c => c.classList.remove('active'));

  const currentSelectedTab = openTabs.find(t => t.active);
  if (currentSelectedTab) {
    window.localStorage.setItem(`${currentSelectedTab.name}-code`, codeEditor.value);
    currentSelectedTab.active = false;
    currentSelectedTab.selection = [codeEditor.selectionStart, codeEditor.selectionEnd];
  }

  if (tab) {
    const index = openTabs.indexOf(tab);
    tabs[index].classList.add('active');
    tab.active = true;
    codeEditor.value = window.localStorage.getItem(`${tab.name}-code`) || '';
    if (tab.selection)
      [codeEditor.selectionStart, codeEditor.selectionEnd] = tab.selection;
    codeEditor.focus();
  } else {
    codeEditor.value = '';
  }
  codeEditor.style.display = 'block';
}

function deleteTab(tab) {
  const codeEditor = document.querySelector('#code-editor');
  const tabContainer = document.querySelector('.tabs');
  const tabs = Array.from(tabContainer.children);
  const tabIndex = openTabs.indexOf(tab);
  let newIndex = tabIndex;
  if (tabIndex === openTabs.length - 1) newIndex -= 1;
  openTabs.splice(tabIndex, 1);
  tabContainer.removeChild(tabs[tabIndex]);
  saveTabState(openTabs);
  if (newIndex < 0) {
    codeEditor.style.display = 'none';
  }
  return newIndex;
}

function restoreImages() {
  const images = window.localStorage.getItem('_images');
  loadImages(JSON.parse(images));
}