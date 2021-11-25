
function Editor(width, height) {
  let internalEditor = CodeMirror.fromTextArea(document.getElementById('editor'), {
    theme: 'vibrant-ink',
    mode: 'stack',
    lineNumbers: true,
    dragDrop: false,
    lineWrapping: true,
    tabSize: 2,
  });

  let copyStatusTimer;

  let clipboard = new ClipboardJS('#copyButton', {
    text: () => {
      if (copyStatusTimer) clearTimeout(copyStatusTimer);
      $('#copyStatus').show();
      copyStatusTimer = setTimeout(() => $('#copyStatus').hide(), 1500);
      return internalEditor.getValue();
    },
  });

  internalEditor.setSize(width, height);
  internalEditor.setValue('');

  internalEditor.refresh();

  this.getInstructions = () => {
    const lines = internalEditor.getValue().trim().split(/\n+/);
    const removeComments = lines.map(line => line.replace(/#.*$/, ''));
    return removeComments.join(' ').trim().split(/\s+/).filter(x => !!x);
  };

  this.setValue = (...args) => {
    internalEditor.setValue(...args);
  }
};
