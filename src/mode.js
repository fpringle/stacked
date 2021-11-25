const keywords = {
  
};

CodeMirror.defineSimpleMode('stack', {
  start: [
    {regex: /(-?\d+)/, token: 'number'},
    {regex: /#/, token: 'comment', next: 'comment'},
    {regex: /(PUSH|POP|DUP|SWAP|ROT3)(?!\w)/, token: 'op stackop atom'},
    {regex: /(ADD|SUB|MUL|DIV|MOD|RAND)(?!\w)/, token: 'op mathop atom'},
    {regex: /(MOVE|LEFT|UP|RIGHT|DOWN|WAIT)(?!\w)/, token: 'op moveop atom'},
    {regex: /(IF)(?!\w)/, token: 'op flowop atom', indent: true},
    {regex: /(ELSE)(?!\w)/, token: 'op flowop atom', dedent: true, indent: true},
    {regex: /(DEF)(?!\w)/, token: 'op customop atom', indent: true},
    {regex: /(END)(?!\w)/, token: 'op atom', dedent: true},
    {regex: /(LOOK)(?!\w)/, token: 'op senseop atom'},
    {regex: /[a-zA-Z]+\d+/, token: null},
    {regex: /[A-Z]+/, token: 'atom'},
  ],
  comment: [
    {regex: /#/, token: 'comment', next: 'start'},
    {regex: /Hash/, token: 'variable'},
    {regex: /(\Wred )(\w+)/, token: ['comment', 'string-2']},
    {regex: /[\[\]]/, token: 'string-2'},
//    {regex: /(")(o)(")/, token: ['string', 'def', 'string']},
    {regex: /"([^"]+)"/, token: 'string'},
    {regex: /[a-zA-Z]+\d+/, token: null},
    {regex: /(-?[1-9]\d*)(?!\.)/, token: ['number']},
    {regex: /(\d+)(?!\.)/, token: ['number']},
    {regex: /(PUSH|POP|DUP|SWAP|ROT3)(?!\w)/, token: 'op stackop atom'},
    {regex: /(ADD|SUB|MUL|DIV|MOD|RAND)(?!\w)/, token: 'op mathop atom'},
    {regex: /(MOVE|LEFT|UP|RIGHT|DOWN|WAIT)(?!\w)/, token: 'op moveop atom'},
    {regex: /(IF)(?!\w)/, token: 'op flowop atom'},
    {regex: /(ELSE)(?!\w)/, token: 'op flowop atom'},
    {regex: /(DEF)/, token: 'op customop atom'},
    {regex: /(END)(?!\w)/, token: 'op atom'},
    {regex: /(LOOK)(?!\w)/, token: 'op senseop atom'},
    {regex: /[B-HJ-Z](?=\W)/, token: 'atom'},
    {regex: /[A-Z]{2,}(?=\W)/, token: 'atom'},
    {regex: /(Freddy Pringle|Alex Nisnevich|Greg Shuflin)/, token: 'keyword'},
    {regex: /./, token: 'comment'},
  ],
  meta: {
    electricInput: /(END|ELSE)/,
  }
});
