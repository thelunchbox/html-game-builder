function editorKeydown(e) {
  if (e.keyCode === 9) {
    const editor = e.target;
    const start = editor.selectionStart;
    editor.value = editor.value.substr(0, start) + '  ' + editor.value.substr(start);
    editor.selectionStart = start + 2;
    editor.selectionEnd = start + 2;
    e.preventDefault();
  }
  if (e.keyCode === 83 && (e.ctrlKey || e.metaKey)) {
    saveRun();
    e.preventDefault();
  }
  e.stopPropagation();
}