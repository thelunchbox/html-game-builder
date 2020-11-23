const PAIRS = ['(', '[', '{'];
const SELF_PAIRS = ['\'', '"', '`'];
const SIBLINGS = {
  '(': ')',
  '[': ']',
  '{': '}',
};
const REVERSE_SIBLINGS = Object.entries(SIBLINGS).reduce((agg, [key, value]) => ({
  ...agg,
  [value]: key
}), {});
const OTHER_PAIRS = Object.values(SIBLINGS);

function editorKeydown(e) {
  const editor = e.target;
  const {
    value,
    selectionStart,
    selectionEnd
  } = editor;
  if (e.keyCode === 9) {
    e.preventDefault();
    if (selectionStart === selectionEnd) {
      editor.value = value.substr(0, selectionStart) + '  ' + value.substr(selectionStart)
      editor.selectionStart = editor.selectionEnd = selectionStart + 2;
    } else {
      let start = selectionStart;
      let end = selectionEnd;
      while (value[start - 1] != '\n' && start > 0) {
        start--;
      }
      while (value[end] != '\n' && end < value.length) {
        end++;
      }
      const before = editor.value.substr(0, start);
      const after = editor.value.substr(end);
      const highlight = editor.value.substr(start, end - start);
      let newStart = selectionStart;
      let newEnd = selectionEnd;
      const newText = highlight.split('\n').map((line, i) => {
        if (e.shiftKey) {
          if (line.startsWith('  ')) {
            if (i === 0) newStart -= 2;
            newEnd -= 2;
            return line.substr(2);
          }
          if (line.startsWith(' ')) {
            if (i === 0) newStart -= 1;
            newEnd -= 1;
            return line.substr(1);
          }
          return line;
        }
        if (i === 0) newStart += 2;
        newEnd += 2;
        return `  ${line}`;
      }).join('\n');
      editor.value = `${before}${newText}${after}`;
      editor.selectionStart = newStart;
      editor.selectionEnd = newEnd;
    }
  }
  if (e.keyCode === 191 && (e.ctrlKey || e.metaKey)) { // forward slash
    e.preventDefault();
    if (selectionStart === selectionEnd) {
      let start = selectionStart;
      while (value[start - 1] !== '\n' && start > 0) {
        start--;
      }
      const before = editor.value.substr(0, start);
      const after = editor.value.substr(start);
      if (after.startsWith('// ')) {
        editor.value = `${before}${after.substr(3)}`;
        editor.selectionStart = editor.selectionEnd = selectionStart - 3 < start ? start : selectionStart - 3;
      } else {
        editor.value = `${before}// ${after}`;
        editor.selectionStart = editor.selectionEnd = start;
      }
    } else {
      let start = selectionStart;
      let end = selectionEnd;
      while (value[start - 1] != '\n' && start > 0) {
        start--;
      }
      while (value[end] != '\n' && end < value.length) {
        end++;
      }
      let newStart = selectionStart;
      let newEnd = selectionEnd;
      const before = editor.value.substr(0, start);
      const after = editor.value.substr(end);
      const highlight = editor.value.substr(start, end - start);
      const newText = highlight.split('\n').map((line, i) => {
        if (line.startsWith('// ')) {
          if (i === 0) newStart -= 3;
          newEnd -= 3;
          return line.substr(3);
        }
        if (i === 0) newStart += 3;
        newEnd += 3;
        return `// ${line}`;
      }).join('\n');
      editor.value = `${before}${newText}${after}`;
      editor.selectionStart = newStart;
      editor.selectionEnd = newEnd;
    }
  }
  if (e.keyCode === 83 && (e.ctrlKey || e.metaKey)) {
    saveRun();
    e.preventDefault();
  }
  if (SELF_PAIRS.includes(e.key)) {
    e.preventDefault();
    let start = selectionStart;
    let occurences = 0;
    while (value[start - 1] !== '\n' && start > 0) {
      if (value[start] === e.key) occurences++;
      start--;
    }
    if (occurences % 2 !== 0 && value[selectionStart] === e.key) {
      editor.selectionStart = editor.selectionEnd = selectionStart + 1;
    } else {
      const before = editor.value.substr(0, selectionStart);
      const after = editor.value.substr(selectionEnd);
      const lastChar = before[before.length - 1];
      const highlight = editor.value.substr(selectionStart, selectionEnd - selectionStart);
      const match = highlight || [ ...PAIRS, ' '].includes(lastChar);
      editor.value = `${before}${e.key}${highlight}${match ? e.key : ''}${after}`;
      editor.selectionStart = selectionStart + 1;
      editor.selectionEnd = selectionEnd + 1;
    }
  }
  if (OTHER_PAIRS.includes(e.key) && selectionStart === selectionEnd) {
    let start = selectionStart;
    let open = false;
    while (value[start - 1] !== '\n' && start > 0) {
      if (value[start] === REVERSE_SIBLINGS[e.key]) {
        open = true;
        break;
      }
      start--;
    }
    if (open && value[selectionStart] === e.key) {
      e.preventDefault();
      editor.selectionStart = editor.selectionEnd = selectionStart + 1;
    }
  } else if (PAIRS.includes(e.key)) {
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
    while (value[cursor] !== '\n' && cursor < value.length) {
      cursor++;
    }
    editor.selectionStart = editor.selectionEnd = cursor;
  }
  if (e.keyCode === 36) { // home
    e.preventDefault();
    let cursor = selectionStart;
    while (value[cursor - 1] !== '\n' && cursor > 0) {
      cursor--;
    }
    editor.selectionStart = editor.selectionEnd = cursor;
  }
  if (e.keyCode === 8 &&
    selectionStart === selectionEnd &&
    PAIRS.includes(value[selectionStart - 1]) &&
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
    while (value[start - 1] !== '\n' && start > 0) {
      start--;
    }
    let end = selectionEnd;
    // while(value[end] !== '\n' && end < value.length) {
    //   end++;
    // }
    const currentLine = value.substr(start, end);
    let spaces = 0;
    while (currentLine[spaces] === ' ') {
      spaces++;
    }
    const prev = value[selectionStart - 1];
    const next = value[selectionStart];
    const wrapped = PAIRS.includes(prev) && SIBLINGS[prev] === next;
    if (wrapped) spaces += 2;

    const space = new Array(spaces).fill(' ').join('');
    const extra = wrapped ? `\n${space.substr(2)}` : '';
    const before = editor.value.substr(0, selectionStart);
    const after = editor.value.substr(selectionEnd);
    editor.value = `${before}\n${space}${extra}${after}`;
    editor.selectionStart = editor.selectionEnd = selectionStart + 1 + spaces;
  }
  e.stopPropagation();
}