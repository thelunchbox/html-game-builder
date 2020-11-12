const PAIRS = ['(', '[', '{', '\'', '"', '`'];
const SIBLINGS = {
  '(': ')',
  '[': ']',
  '{': '}',
  '\'': '\'',
  '"': '"',
  '`': '`',
};

function editorKeydown(e) {
  const editor = e.target;
  const { value, selectionStart, selectionEnd } = editor;
  if (e.keyCode === 9) {
    e.preventDefault();
    if (selectionStart === selectionEnd) {
      editor.value = value.substr(0, selectionStart) + '  ' + value.substr(selectionStart)
      editor.selectionStart = editor.selectionEnd = selectionStart + 2;
    } else {
      let start = selectionStart;
      let end = selectionEnd;
      while(value[start] != '\n' && start > 0) {
        start--;
      }
      while (value[end] != '\n' && end < value.length) {
        end++;
      }
      const before = editor.value.substr(0, start);
      const after = editor.value.substr(end);
      const highlight = editor.value.substr(start, end - start);
      editor.value = `${before}${highlight.split('\n').map(line => `  ${line}`).join('\n')}${after}`;
      editor.selectionStart = selectionStart + 2;
      editor.selectionEnd = selectionEnd + 2 * highlight.split('\n').length;
    }
  }
  if (e.keyCode === 83 && (e.ctrlKey || e.metaKey)) {
    saveRun();
    e.preventDefault();
  }
  if (PAIRS.includes(e.key)) {
    e.preventDefault();
    const before = editor.value.substr(0, selectionStart);
    const after = editor.value.substr(selectionEnd);
    const highlight = editor.value.substr(selectionStart, selectionEnd - selectionStart);
    editor.value = `${before}${e.key}${highlight}${SIBLINGS[e.key]}${after}`;
    editor.selectionStart = selectionStart + 1;
    editor.selectionEnd = selectionEnd + 1;
  }
  if (e.keyCode === 35) { // end
    e.preventDefault();
    let cursor = selectionEnd;
    while(value[cursor] !== '\n' && cursor < value.length) {
      cursor++;
    }
    editor.selectionStart = editor.selectionEnd = cursor;
  }
  if (e.keyCode === 36) { // home
    e.preventDefault();
    let cursor = selectionStart;
    while(value[cursor-1] !== '\n' && cursor > 0) {
      cursor--;
    }
    editor.selectionStart = editor.selectionEnd = cursor;
  }
  if (e.keyCode === 8 && 
    selectionStart === selectionEnd && 
    PAIRS.includes(value[selectionStart-1]) && 
    value[selectionStart] === SIBLINGS[value[selectionStart - 1]]
  ) {
    e.preventDefault();
    const before = editor.value.substr(0, selectionStart - 1);
    const after = editor.value.substr(selectionEnd + 1);
    editor.value = `${before}${after}`;
    editor.selectionStart = editor.selectionEnd = selectionStart - 1;
  }
  if (e.keyCode === 13 && selectionStart === selectionEnd) {
    e.preventDefault();
    let start = selectionStart;
    while(value[start-1] !== '\n' && start > 0) {
      start--;
    }
    let end = selectionEnd;
    while(value[end] !== '\n' && end < value.length) {
      end++;
    }
    const currentLine = value.substr(start, end);
    let spaces = 0;
    while (currentLine[spaces] === ' ') {
      spaces++;
    }
    if (PAIRS.includes(currentLine[currentLine.length - 1])) {
      spaces += 2;
    }
    const space = new Array(spaces).fill(' ').join('');
    const before = editor.value.substr(0, selectionStart);
    const after = editor.value.substr(selectionEnd);
    editor.value = `${before}\n${space}${after}`;
    editor.selectionStart = editor.selectionEnd = selectionStart + 1 + spaces;
  }
  e.stopPropagation();
}