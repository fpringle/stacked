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
