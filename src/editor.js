
function Editor(width, height) {
  let internalEditor = CodeMirror.fromTextArea(document.getElementById('editor'), {
    theme: 'vibrant-ink',
    mode: 'stack',
    lineNumbers: true,
    dragDrop: false,
    lineWrapping: true,
    tabSize: 2,
    autofocus: true,
  });

  internalEditor.setOption("extraKeys", {
    Tab: function(cm) {
      var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
      cm.replaceSelection(spaces);
    }
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

  this.focus = () => internalEditor.display.input.focus();

  this.getInstructions = () => {
    let allTokens = '';
    const numLines = internalEditor.lineCount();
    for (let line = 0; line < numLines; line++) {
      internalEditor.getLineTokens(line, true).forEach(({string, state}) => {
        if (state.state !== 'comment') allTokens += string;
      });
      allTokens += '\n';
    }
    const lines = allTokens.trim().split(/\n+/);
    const removeComments = lines.map(line => line.replace(/#.*$/, ''));
    return removeComments.join(' ').trim().split(/\s+/).filter(x => !!x);
  };

  this.setValue = (content) => {
    internalEditor.setValue(content);
    const endLine = internalEditor.lineCount() - 1;
    const endCh = internalEditor.getLine(endLine).length;
    internalEditor.setCursor(endLine, endCh);
  };

  this.insert = (text) => {
    if (internalEditor.somethingSelected()) {
      internalEditor.replaceSelection(text);
      return;
    }
    let length = text.length;
    let curVal = internalEditor.getValue();
    let {line, ch} = internalEditor.getCursor();

    let before = internalEditor.getRange({line:0,ch:0}, {line, ch});
    const endLine = internalEditor.lineCount() - 1;
    const endCh = internalEditor.getLine(endLine).length;
    let after = internalEditor.getRange({line, ch}, {line:endLine,ch:endCh});
/*
    if (curVal.length > 0 && curVal[curVal.length-1].match(/\S/)) curVal += ' ';
    curVal += text;
*/

    if (before.length > 0 && before[before.length-1].match(/\S/)) {
      text = ' '+text;
      length++;
    }
    if (after.length > 0 && after[0].match(/\S/)) text = text+' ';

    internalEditor.setValue(before + text + after);
    internalEditor.setCursor(line, ch+length);
  };
};
