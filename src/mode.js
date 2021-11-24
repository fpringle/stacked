CodeMirror.defineSimpleMode('stack', {
  start: [
    {regex: /\d+/, token: 'number'},
    {regex: /(PUSH|POP|DUP|SWAP|ROT3)(?!\w)/, token:'op stackop atom'},
    {regex: /(ADD|SUB|MUL|DIV|MOD|RAND)(?!\w)/, token:'op mathop atom'},
    {regex: /(MOVE|LEFT|UP|RIGHT|DOWN|WAIT)(?!\w)/, token:'op moveop atom'},
    {regex: /(IF)(?!\w)/, token:'op flowop atom', indent: true},
    {regex: /(ELSE)(?!\w)/, token:'op flowop atom', dedent: true, indent: true},
    {regex: /(DEF)(?!\w)/, token:'op customop atom', indent: true},
    {regex: /(END)(?!\w)/, token:'op atom', dedent: true}
  ],
  meta: {
    electricInput: /(END|ELSE)/,
  }
});
