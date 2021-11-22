

CodeMirror.defineSimpleMode('stack', {
  start: [
    {regex: /\d+/, token: 'number'},

    {regex: /(PUSH|POP|DUP|SWAP|ROT3)/, token:'op stackop atom'},
    {regex: /(ADD|SUB|MUL|DIV|MOD|RAND)/, token:'op mathop atom'},
    {regex: /(MOVE|LEFT|UP|RIGHT|DOWN|WAIT)/, token:'op moveop atom'},
    {regex: /(IF)/, token:'op flowop atom', indent: true},
    {regex: /(ELSE)/, token:'op flowop atom', dedent: true, indent: true},
    {regex: /(DEF)/, token:'op customop atom', indent: true},
    {regex: /(END)/, token:'op atom', dedent: true}
  ],
  meta: {
    electricInput: /(END|ELSE)/,
  }
});

(() => {

function editor() {
  this.internalEditor = CodeMirror.fromTextArea(document.getElementById('editor'), {
      theme: 'vibrant-ink',
      mode: 'stack',
      lineNumbers: true,
      dragDrop: false,
  });

  this.internalEditor.on("beforeChange", (obj) => {
    return;
    const val = this.internalEditor.getValue();
    this.internalEditor.setValue(val.replace(/\w+/g, w => w.toUpperCase()));
  });

  this.internalEditor.setSize(600, 500);

  this.internalEditor.setValue('');

  this.internalEditor.refresh();

  this.getInstructions = () => {
    return this.internalEditor.getValue().trim().split(/\s+/);
  };
};

$(document).ready(() => {
  window.editor = new editor();
  window.game = new Game(40, 40, Object.keys(coreFunctions));

  const grid = `
@@@@@@@@@@@@@
@           @
@           @
@           @
@     @     @
@     @     @
@     @     @
@     @     @
@     @     @
@  #  @  X  @
@     @     @
@@@@@@@@@@@@@
`

  window.game = Game.createFromGrid({
    grid,
    mapping: {
      '@': 'block',
      '#': 'player',
      'X': 'goal',
    },
    allFunctionsAvailable: true,
    objects: [
      {
        name: 'goal',
        symbol: 'o',
        color: 'cyan',
      },
    ],
  });


  $('#executeButton').click(() => {
    const instructions = window.editor.getInstructions();
    console.log('['+instructions+']');
    const result = interpret(window.game, instructions, window.game.stack, window.game.functions);
    game.updateStackDisplay(result);
  });

  window.game.initialize(true);
});

})();
