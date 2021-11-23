
function Editor(width, height) {
  let internalEditor = CodeMirror.fromTextArea(document.getElementById('editor'), {
    theme: 'vibrant-ink',
    mode: 'stack',
    lineNumbers: true,
    dragDrop: false,
    lineWrapping: true,
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
