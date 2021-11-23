
function Editor(width, height) {
  let internalEditor = CodeMirror.fromTextArea(document.getElementById('editor'), {
      theme: 'vibrant-ink',
      mode: 'stack',
      lineNumbers: true,
      dragDrop: false,
  });

  internalEditor.setSize(width, height);
  internalEditor.setValue('');

  internalEditor.refresh();

  this.getInstructions = () => {
    return internalEditor.getValue().trim().split(/\s+/).filter(x => !!x);
  };

  $('#resetCodeButton').click(() => {
    internalEditor.setValue('');
  });
};
