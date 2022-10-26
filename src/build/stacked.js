(function() {
/*
Define the core functions

syntax: {
  name: String,
  description: String,
  syntax: String,
  func: function(stack, instructions, game),
}

stack: program stack, values (FILO)
instructions: program instructions, functions and values (FIFO)
*/

const _funcAndTestWrapper = (func, before, errCb) => {
  return (arr, expected) => {
    const arrString = '[' + arr.toString() + ']';
    let val;
    if (before) before(arr, expected);
    try {
      val = func.call(arr);
    } catch(err) {
      if (errCb) {
        errCb(err);
        return;
      }
      throw err;
    }
    if (val !== expected) {
      throw new Error(`expected ${func.name}(${arrString}) to be ${expected}, but got ${val}`);
    }
    return arr;
  };
};

const shiftAndTest = _funcAndTestWrapper(Array.prototype.shift, arr => {
  if (arr.length === 0) throw new Error('tried to call shift on empty list');
});

const _mathBinaryOpWrapper = (func) => {
  return (stack) => {
    const rhs = stack.pop();
    const lhs = stack.pop();
    const result = func(lhs, rhs);
    stack.push(result);
  };
};

const coreFunctions = {
  // stack manipulation

  PUSH: {
    name: 'PUSH',
    category: 'stack',
    description: 'Push a single-digit number onto the stack.',
    syntax: 'PUSH <value>',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      const value = instructions.shift();
      if (value < 0 || value > 9) throw new Error('tried to push a number to the stack outside the range 0-9');
      stack.push(parseInt(value));
    },
  },
  POP: {
    name: 'POP',
    category: 'stack',
    description: 'Pop the top value off the stack.',
    syntax: 'POP',
    minStackSize: 1,
    call: (stack, instructions, game) => {
      stack.pop();
    },
  },
  DUP: {
    name: 'DUP',
    category: 'stack',
    description: 'Duplicate the value on top of the stack.',
    syntax: 'DUP',
    minStackSize: 1,
    call: (stack, instructions, game) => {
      stack.push(stack[stack.length - 1]);
    },
  },
  SWAP: {
    name: 'SWAP',
    category: 'stack',
    description: 'Swap the 2 values on top of the stack.',
    syntax: 'SWAP',
    minStackSize: 2,
    call: (stack, instructions, game) => {
      const [second] = stack.splice(stack.length-2, 1)
      stack.push(second);
    },
  },
  ROT3: {
    name: 'ROT3',
    category: 'stack',
    description: 'Pop the 3rd value on the stack and put it on top.',
    syntax: 'ROT3',
    minStackSize: 3,
    call: (stack, instructions, game) => {
      const [third] = stack.splice(stack.length-3, 1)
      stack.push(third);
    },
  },

  // mathematical
  ADD: {
    name: 'ADD',
    category: 'mathematical',
    description: 'Pop the top 2 values off the stack and push their sum to the top.',
    syntax: 'ADD',
    minStackSize: 2,
    call: (stack, instructions, game) => {
      _mathBinaryOpWrapper((x, y) => x+y)(stack);
    },
  },
  SUB: {
    name: 'SUB',
    category: 'mathematical',
    description: 'Pop the top 2 values off the stack and push their difference to the top.',
    syntax: 'SUB',
    minStackSize: 2,
    call: (stack, instructions, game) => {
      _mathBinaryOpWrapper((x, y) => x-y)(stack);
    },
  },
  MUL: {
    name: 'MUL',
    category: 'mathematical',
    description: 'Pop the top 2 values off the stack and push their product to the top.',
    syntax: 'MUL',
    minStackSize: 2,
    call: (stack, instructions, game) => {
      _mathBinaryOpWrapper((x, y) => x*y)(stack);
    },
  },
  DIV: {
    name: 'DIV',
    category: 'mathematical',
    description: 'Pop the top 2 values off the stack and push their quotient (floor(a/b)) to the top.',
    syntax: 'DIV',
    minStackSize: 2,
    call: (stack, instructions, game) => {
      if (stack[stack.length - 1] === 0) throw new Error('tried to call DIV with zero divisor');
      _mathBinaryOpWrapper((x, y) => Math.floor(x/y))(stack);
    },
  },
  MOD: {
    name: 'MOD',
    category: 'mathematical',
    description: 'Pop the top 2 values off the stack and push their modulus (a % b) to the top.',
    syntax: 'MOD',
    minStackSize: 2,
    call: (stack, instructions, game) => {
      if (stack[stack.length - 1] === 0) throw new Error('tried to call MOD with zero divisor');
      _mathBinaryOpWrapper((x, y) => x%y)(stack);
    },
  },
  RAND: {
    name: 'RAND',
    category: 'mathematical',
    description: 'Pop the top 2 values (max, min) off the stack, generate a random ' +
                 'number x such that min <= x < max, and push it to the stack.',
    syntax: 'RAND',
    minStackSize: 2,
    call: (stack, instructions, game) => {
      const mx = stack.pop();
      const mn = stack.pop();
      if (mx <= mn) throw new Error('tried to call RAND with max <= min');
      const val = mn + Math.floor(Math.random() * (mx - mn));
      stack.push(val);
    },
  },

  // flow control
  IF: {
    category: 'flow',
    description: 'Pop the top value off the stack. If it is non-zero, insert the given instructions at the current location in the program. If not, and if an "else" clause is given, insert those commands instead.',
    syntax: 'IF <terms> END | IF <TERMS> ELSE <TERMS> END',
    minStackSize: 1,
    call: (stack, instructions, game) => {
      const {thenTerms, elseTerms, endPos} = parseIfClause(instructions)
      const top = stack.pop();
      const then = top !== 0;
      instructions.splice(0, endPos+1);
      const insert = then ? thenTerms : elseTerms;
      instructions.splice(0, 0, ...insert);
    },
  },

  // player actions
  MOVE: {
    category: 'action',
    description: ('Pop the top value off the stack and move the player according to its value. ' +
                  'If 0, rest. Otherwise move one of the 4 cardinal directions (1=up,' +
                  ' 2=right, 3=down, 4=left) if possible. If the top value is not in ' +
                  'the range 0-4, do nothing.'),
    syntax: 'MOVE',
    minStackSize: 1,
    call: (stack, instructions, game) => {
      const top = stack.pop();
      let direction;
      switch (top) {
        case 0:
          direction = 'none';
          break;
        case 1:
          direction = 'up';
          break;
        case 2:
          direction = 'right';
          break;
        case 3:
          direction = 'down';
          break;
        case 4:
          direction = 'left';
          break;
      }
      if (direction) game.movePlayer(direction);
    },
  },
  LEFT: {
    category: 'action',
    description: 'Move left, if possible.',
    syntax: 'LEFT',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      game.movePlayer('left');
    },
  },
  UP: {
    category: 'action',
    description: 'Move up, if possible.',
    syntax: 'UP',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      game.movePlayer('up');
    },
  },
  RIGHT: {
    category: 'action',
    description: 'Move right, if possible.',
    syntax: 'RIGHT',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      game.movePlayer('right');
    },
  },
  DOWN: {
    category: 'action',
    description: 'Move down, if possible.',
    syntax: 'DOWN',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      game.movePlayer('down');
    },
  },
  WAIT: {
    category: 'action',
    description: 'Wait for 1 turn.',
    syntax: 'WAIT',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      game.movePlayer('none');
    },
  },

  // custom
  DEF: {
    category: 'custom',
    description: 'Define a custom function with the given name. Whenever the program finds this instructions it will replace it with the given terms.',
    syntax: 'DEF <name> <terms> END',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      const name = instructions.shift();
      const endPos = findEnd(instructions);
      const terms = instructions.splice(0, endPos);
      instructions.shift();
      game.defineNewFunction(name, terms);
    },
  },

  // environment
  LOOK: {
    category: 'sensing',
    description: ('Pop a value off the stack, look at the adjacent cell corresponding to that direction (same as the MOVE command) and see what\'s there. ' +
                  'A value will be pushed to the stack depending on the content of the adjacent cell (0 = empty, 1 = block, 2 = exit, 3 = spike, -1 = outside the grid limits).'),
    syntax: 'LOOK',
    minStackSize: 1,
    call: (stack, instructions, game) => {
      const top = stack.pop();
      let direction;
      switch (top) {
        case 1:
          direction = 'up';
          break;
        case 2:
          direction = 'right';
          break;
        case 3:
          direction = 'down';
          break;
        case 4:
          direction = 'left';
          break;
      }
      if (!direction) {
        // TODO: throw an error or just return?
        return;
      }
      const {x, y} = game.getPlayerXY();
      const [dx, dy] = DIRECTIONS[direction];
      const [nx, ny] = [x+dx, y+dy];
      const typeAt = game.getTypeAt(nx, ny);
      let pushValue;
      if (typeAt === 'empty') pushValue = 0;
      else if (typeAt === 'outside') pushValue = -1;
      else if (typeAt === 'block') pushValue = 1;
      else if (typeAt === 'exit') pushValue = 2;
      else if (typeAt === 'spike') pushValue = 3;
      else if (typeAt.substr(0,4) === 'push') pushValue = 0;
      else throw new Error(`Unknown object type at (${nx},${ny}): ${typeAt}`);
      stack.push(pushValue);
    },
  },
};

// parsing functions

const findEnd = (instructions) => {
  let depth = 1;
  for (let pos = 0; pos < instructions.length; pos++) {
    switch (instructions[pos]) {
      case 'DEF':
      case 'IF':
        depth++;
        break;
      case 'END':
        depth--;
        if (depth === 0) return pos;
        break;
    }
  }
  throw new Error('could not find closing END term');
};

const parseIfClause = (instructions) => {
  let depth = 1;
  let elsePos = null;
  for (let pos = 0; pos < instructions.length; pos++) {
    switch (instructions[pos]) {
      case 'DEF':
      case 'IF':
        depth++;
        break;
      case 'ELSE':
        if (depth === 1) elsePos = pos;
        break;
      case 'END':
        depth--;
        if (depth === 0) {
          endPos = pos;
          const thenTerms = instructions.slice(0, elsePos === null ? pos : elsePos);
          const elseTerms = elsePos === null ? [] : instructions.slice(elsePos+1, pos);
          return {thenTerms, elseTerms, elsePos, endPos: pos};
        }
        break;
    }
  }
  throw new Error('could not find closing END term');
};

function* interpret (game, instructions, stack, functionsAvailable, debug=false) {
  let count = 0;

  while (instructions.length > 0) {
    if (debug) {
      console.log('\n');
      console.log('Stack:', stack);
      console.log('Instructions:', instructions);
    }
    let instr = instructions[0];
    if (Object.hasOwnProperty.call(functionsAvailable, instr)) {
      shiftAndTest(instructions, instr);
      const instruction = functionsAvailable[instr];
      if (instruction.minStackSize && stack.length < instruction.minStackSize) {
        throw new Error(`tried to call ${instr} on a stack of size ${stack.length} < ${instruction.minStackSize}`);
      }
      if (debug) console.log('calling', instr);
      instruction.call(stack, instructions, game);
      game.updateStackDisplay();
      game.incrementExecutionSteps();
      if (instruction.category === 'action') yield;
    } else {
      throw new Error('unknown instruction: ' + instr);
    }
    count++;
    if (count > 1000000) {
      throw new Error('maximum program length exceeded');
    }
  }
}

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
const defaultWidth = 35;
const defaultHeight = 34;

const randColor = (function() {
  let hue = 0; //Math.random();
  const psi = 0.618033988749895;
  const saturation = 0.5;
  const value = 0.95;
  return () => {
    hue = (hue + psi) % 1;
    const h = Math.floor(6 * hue);
    const f = 6 * hue - h;
    const p = value * (1 - saturation);
    const q = value * (1 - f * saturation);
    const t = value * (1 - (1 - f) * saturation);
    const rgb = [
      [value, t, p],
      [q, value, p],
      [p, value, t],
      [p, q, value],
      [t, p, value],
      [value, p, q],
    ][h].map(x => Math.floor(x * 0xFF));
    return '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('');
  };
})();

function Map(_game, width, height) {
  let game = _game;
  let player = null;
  let map = [];
  for (let row=0; row<height; row++) {
    map.push(Array(width));
  }

  const removeObjectAt = (x, y) => {
    if (!map[y][x]) throw new Error(`tried to call removeObjectAt bu there is no object at (${x},${y})`);
    map[y][x] = null;
  };

  this.getDimensions = () => ({width, height});

  let knownObjects = {
    block: {
      name: 'block',
      getSymbol: () => '@',
    },
    exit: {
      name: 'exit',
      getSymbol: () => 'o',
      getColor: () => 'cyan',
      passable: () => true,
      onCollision: () => game.endLevel(),
    },
    spike: {
      name: 'spike',
      getSymbol: () => 'x',
      getColor: () => 'red',
      passable: () => true,
      onCollision: () => game.killPlayer(),
    },
  };
  for (let num=0; num<10; num++) {
    const name = 'push' + num;
    const color = randColor();
    knownObjects[name] = {
      name,
      getSymbol: () => ''+num,
      getColor: () => '#4d94ff',
      passable: () => true,
      onCollision: (me) => {
        game.pushToStack(num);
        removeObjectAt(me.x, me.y);
      },
    };
  };

  this.getObjectAt = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 'outside';
    return map[y][x];
  };

  this.placeObject = (x, y, name) => {
    const obj = knownObjects[name];
    if (!obj) throw new Error('No object with name ' + name);
    map[y][x] = {...obj};
  };

  this.defineNewObject = (data) => {
    knownObjects[data.name] = {...data};
  };

  this.getPlayer = () => {
    if (player) return player;
    throw new Error('player hasn\'t been set yet');
  };

  this.setPlayer = function(x, y) {
    if (player) throw new Error('player already set');
    player = new Player(x, y, this);
    //this.map[y][x] = player;
  }

  this.movePlayer = (direction) => {
    if (player) {
      player.move(direction);
    }
  };

  this.canPlayerMove = (direction) => {
    const [dx, dy] = DIRECTIONS[direction];
    const {x, y} = player.getXY();
    const nx = x+dx;
    const ny = y+dy;
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false;
    const obj = map[ny][nx];
    if (!obj) return true;
    else if (obj.passable && obj.passable(player)) return true;
    return false;
  }
}

Map.createFromGrid = (game, {
  height,
  width,
  levelName,
  grid,
  mapping,
  allFunctionsAvailable,
  availableFunctions,
  additionalFunctions,
  objects
}, debug) => {
  const lines = grid.trim().split('\n');
  const gheight = lines.length;
  const gwidth = Math.max(...lines.map(line => line.length));
  let functions = [];
  if (allFunctionsAvailable || debug) {
    functions = Object.keys(coreFunctions);
  } else if (availableFunctions) {
    functions = availableFunctions;
  }

  height = height || defaultHeight;
  width = width || defaultWidth;

  let paddingTop = 0;
  let paddingLeft = 0;

  if (height) {
    const paddingVertical = Math.max(height - gheight);
    paddingTop = Math.floor(paddingVertical / 2);
  } else {
    height = gheight;
  }
  if (width) {
    const paddingHorizontal = Math.max(width - gwidth);
    paddingLeft = Math.floor(paddingHorizontal / 2);
  } else {
    width = gwidth;
  }

  game.loadFunctions(functions);
  if (additionalFunctions) game.loadAdditionalFunctions(additionalFunctions);
  game.setLevelName(levelName);

  const map = new Map(game, width, height);
  if (objects) {
    for (let obj of objects) {
      map.defineNewObject(obj);
    }
  }

  lines.forEach((line, y) => {
    for (let x=0; x<line.length; x++) {
      const char = line[x];
      if (char === ' ') continue;
      const obj = mapping[char];
      if (!obj) throw new Error('character not known in mapping: ' + char);

      if (obj === 'player') map.setPlayer(paddingLeft+x, paddingTop+y);
      else map.placeObject(paddingLeft+x, paddingTop+y, obj);
    }
  });

  return map;
};
function Player(_x, _y, _map) {
  let x = _x;
  let y = _y;
  let map = _map;
  let symbol = '#';
  let color = 'yellow';

  this.getSymbol = () => {
    return symbol;
  };

  this.getColor = () => {
    return color;
  };

  this.canMove = (direction) => {
    return map.canPlayerMove(direction);
  }
  this.move = (direction) => {
    if (!this.canMove(direction)) return;
    const [dx, dy] = DIRECTIONS[direction];
    x += dx;
    y += dy;
  }
  this.getXY = () => {
    return {x, y};
  }
}
const level0 = {
  grid: `
@@@@@@@@@@@@@
@           @
@           @
@           @
@  #     o  @
@           @
@           @
@           @
@@@@@@@@@@@@@
`,
  levelName: 'Hello Stack',
  mapping: {
    '@': 'block',
    '#': 'player',
    'o': 'exit',
  },
  availableFunctions: [
    'RIGHT',
  ],
  comments: [
    'In Stacked you control the character, called Hash, by writing code in a simple stack-based language.',
    '',
    'This window is the Editor. You can use it to write commands to control your character. Anything between a pair of "#"s will be ignored, so you can write comments if you like.',
    '',
    'Your program has access to a list of integers called the "stack", which is initially empty. You can manipulate this stack using "commands" written in the Editor. If you click the "Run Code" button below, the commands will be executed one by one. If you don\'t reach the exit, you can edit your program and try again - Hash will be automatically moved back to its initial location before the program starts.',
    '',
    'Using these commands you can PUSH a one-digit value to the top of the stack, POP the top value off the stack, perform numeric operations like ADD or DIV, and execute conditional statements depending on the values in the stack. You can also define your own commands, but we\'ll get to that later.',
    '',
    'Apart from manipulating the stack, there are also commands to control your character Hash. The center pane is the Map. During each level you\'ll see a 2-dimensional layout. Your character is represented by the "#" symbol, and your goal is to reach the "o" symbol.',
    '',
    'Let\'s give it a go. For now you have access to just one command: RIGHT. If the program encounters a RIGHT command, it\'ll move Hash one space to the right. I wonder what happens if it encounters multiple RIGHT commands...'
  ],
};

const level1 = {
  grid: `
@@@@@@@@@@@@@
@           @
@           @
@           @
@     @     @
@  #  @  o  @
@     @     @
@@@@@@@@@@@@@
`,
  levelName: 'Corners',
  mapping: {
    '@': 'block',
    '#': 'player',
    'o': 'exit',
  },
  availableFunctions: [
    'MOVE',
    'PUSH',
    'RIGHT',
  ],
  comments: [
    'Great job! You probably wrote a program with 6 RIGHT commands. However when the maps get more complicated that\'s going to get tedious. The MOVE command lets you move Hash based on the top value on the stack. More specifically, the execution of a MOVE command looks like this:',
    '',
    '1. Pop the top value off the stack. Let\'s call it X.',
    '2. If X is 1, move the character one space up.',
    '   If X is 2, move the character to the right.',
    '   If X is 3, move the character down.',
    '   If X is 4, move the character left.',
    '',
    'Note that popping the top value off the stack means we discard it after the operation.',
    '',
    'For example, this program will move Hash 1 spaces up and 1 space right:',
    'PUSH 2 PUSH 1 MOVE MOVE',
    '',
    'Let\'s look at this more carefully. At first the stack is empty, [].',
    'After PUSH 2, the stack is [2].',
    'After PUSH 1, the stack is [2, 1].',
    'After MOVE, the value 1 gets popped off the stack, the character moves upwards, and the stack is [2].',
    'After MOVE, the value 2 gets popped off the stack, the character moves right, and stack is empty again, [].',
    '',
    'By the way - if you mess up, you can reset the Map by clicking "Reset map" below, and you can reset the Editor by clicking "Clear editor".',
  ],
};

const level2 = {
  grid: `
@@@@@@@@@@@@@@
@@@@@@@@@@@@@@
@@#         @@
@@ @@@@@@@@ @@
@@ @@@@@@@@ @@
@@ @@@@@@@@ @@
@@         o@@
@@@@@@@@@@@@@@
@@@@@@@@@@@@@@
`,
  levelName: 'Big fish, big box',
  mapping: {
    '@': 'block',
    '#': 'player',
    'o': 'exit',
  },
  allFunctionsAvailable: false,
  availableFunctions: [
    'MOVE',
    'LEFT',
    'UP',
    'RIGHT',
    'DOWN',
    'DUP',
    'POP',
    'PUSH',
    'SWAP',
  ],
  objects: [
  ],
  comments: [
    'Let\'s introduce some more commands.',
    '',
    'POP: pop the top value off the stack.       [1,2,3] => [1,2]',
    'DUP: duplicate the top value on the stack.  [1,2,3] => [1,2,3,3]',
    'SWAP: swap the top 2 values of the stack.   [1,2,3] => [1,3,2]',
    '',
    'I\'ve given you 2 lines of a possible solution, just as a hint 🙂',
    'Of course, feel free to ignore them if you want to do it a different way!',
    '',
    'Note: the program doesn\'t care about whitespace or indentation, so feel free to space your commands out over multiple lines if it makes it easier to visualise the program execution.',
  ],
  hintLines: [
    'PUSH 3 DUP DUP DUP   # stack is now [3,3,3,3] #',
    'MOVE MOVE MOVE MOVE  # move downwards 4 times #',
  ],
};

const level3 = {
  grid: `
@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@                          @
@                          @
@ #                      o @
@                          @
@                          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@
`,
  levelName: 'MathS',
  mapping: {
    '@': 'block',
    '#': 'player',
    'o': 'exit',
  },
  allFunctionsAvailable: false,
  availableFunctions: [
    'PUSH',
    'MOVE',
    'LEFT',
    'UP',
    'RIGHT',
    'DOWN',
    'DUP',
    'POP',
    'PUSH',
    'SWAP',
    'ADD',
    'MUL',
  ],
  objects: [
  ],
  additionalFunctions: {
    RIGHTN: {
      category: 'special',
      description: 'Pop the top value off the stack and move right that many times.',
      syntax: 'RIGHTN',
      minStackSize: 1,
      call: (stack, instructions, game) => {
        const n = stack.pop();
        for (let i=0; i<n; i++) {
          instructions.unshift('RIGHT');
        }
      },
    },
  },
  comments: [
    'Who can be bothered to type out RIGHT 23 times?? For this level ONLY, you have access to the function RIGHTN. It\'ll pop the top value off the top of the stack and move right that many times.',
    '',
    'But wait - you can only PUSH single-digit values to the stack, so you can\'t just do "PUSH 23 RIGHTN". Maybe we can solve this using mathematical commands like ADD and MUL...',
    '',
    'In case you forget what your stack is supposed to look like, you can take a look at the display right below the map. Next to it you can also see how many instructions your program has executed. Why don\'t you see how low you can get that number?',
  ],
};

const level4 = {
  grid: `
@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@                          @
@                          @
@ #                      o @
@                          @
@                          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@
`,
  levelName: 'Independence',
  mapping: {
    '@': 'block',
    '#': 'player',
    'o': 'exit',
  },
  allFunctionsAvailable: false,
  availableFunctions: [
    'MOVE',
    'LEFT',
    'UP',
    'RIGHT',
    'DOWN',
    'WAIT',
    'PUSH',
    'DUP',
    'POP',
    'PUSH',
    'SWAP',
    'ROT3',
    'ADD',
    'MUL',
    'SUB',
    'DIV',
    'MOD',
    'RAND',
    'DEF',
  ],
  objects: [
  ],
  comments: [
    'At the moment the program simply executes the commands that you type in, one-by-one. That\'s great, but it gets tedious when navigating more complicated maps. By defining your own commands, you can simulate more advanced programming concepts like loops and recursion.',
    '',
    'The "DEF" command lets you define your own function. When the program encounters the "DEF" command, first it reads the immediate next word - that\'s the name of the function. It\'ll then read all the commands up to the corresponding "END" command. The program saves the series of commands under the name supplied, and from then on whenever it encounters that name it\'ll replace it with the function body.',
    '',
    'For example, let\'s define a simple new command RIGHT2 that moves the character 2 places to the right.',
    '',
    'DEF RIGHT2        - we declare the name of the function',
    '  RIGHT RIGHT     - we define the function body',
    'END               - we end the function definition',
    'RIGHT2            - we call the function',
    '',
    'A function defined with "DEF" can also call itself! For example, can you write your own function that moves right indefinitely? Don\'t worry about overshooting the goal - Hash will stop automatically once it gets there.',
  ],
  hintLines: [
    'DEF RIGHTINF',
    '             # do something here... #',
    '  RIGHTINF   # and recurse! #',
    'END',
    '',
    'RIGHTINF     # don\'t forget to call the function you define! #',
  ],
};

const level5 = {
  grid: `
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@                            @
@                          o @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@                            @
@ #                          @
@                            @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
`,
  levelName: 'To if or not to if',
  mapping: {
    '@': 'block',
    '#': 'player',
    'o': 'exit',
  },
  allFunctionsAvailable: false,
  availableFunctions: [
    'MOVE',
    'LEFT',
    'UP',
    'RIGHT',
    'DOWN',
    'WAIT',
    'PUSH',
    'DUP',
    'POP',
    'PUSH',
    'SWAP',
    'ROT3',
    'ADD',
    'MUL',
    'SUB',
    'DIV',
    'MOD',
    'RAND',
    'DEF',
    'IF',
  ],
  objects: [
  ],
  comments: [
    'Now that you have a grasp of the core functions, let\'s get a bit more advanced. Hash\'s survival depends on it!',
    '',
    'The IF command executes code conditionally, based on the value on top of the stack. If the value it pops off the stack is non-0 (positive or negative), it will execute the following code. There\'s also the option to provide an ELSE clause, which will be executed if the value popped off the stack is 0.',
    '',
    'The syntax for the IF command is as follows:',
    'IF       - pop the top value off the stack',
    '  CMD1   - if the value is non-0, execute these commands',
    '  CMD2',
    'ELSE     - this is optional',
    '  CMD3   - if the value is 0, execute these commands',
    'END      - this is required',
    '',
    'For example, by maintaining a "counter" value on the top of the stack, we can repeatedly execute a series of commands, perhaps modifying the count to halt when a certain condition is reached. Remember that the IF command will POP the value off the stack and discard it, so if you want to keep the value you\'ll have to use DUP first.',
    '',
    'Now you try it! I wonder if you can define functions RIGHTN and UPN that move Hash to the right/up N times, where N is the top value on the stack.',
  ],
};

const level6 = {
  grid: `
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@   @       @       @       @
@ # @       @       @       @
@   @       @       @       @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@   @   @   @   @   @   @   @
@       @       @       @   @
@       @       @       @ o @
@       @       @       @   @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
`,
  levelName: 'The Snake',
  mapping: {
    '@': 'block',
    '#': 'player',
    'o': 'exit',
  },
  allFunctionsAvailable: false,
  availableFunctions: [
    'MOVE',
    'LEFT',
    'UP',
    'RIGHT',
    'DOWN',
    'WAIT',
    'PUSH',
    'DUP',
    'POP',
    'PUSH',
    'SWAP',
    'ROT3',
    'ADD',
    'MUL',
    'SUB',
    'DIV',
    'MOD',
    'RAND',
    'DEF',
    'IF',
  ],
  objects: [
  ],
  comments: [
    'Even better than RIGHTN or DOWNN, maybe someone could define a generic function MOVEN that move Hash N times in the direction D, where N and D are the top 2 values on the stack...',
  ],
};

const level7 = {
  grid: `
@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@       x      x   x    x  @
@ x        x       x       @
@ #   x       x       x   o@
@ x      x      x   x      @
@     x      x       x     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@
`,
  levelName: 'Look out for yourself',
  mapping: {
    '@': 'block',
    '#': 'player',
    'o': 'exit',
    'x': 'spike',
  },
  allFunctionsAvailable: false,
  availableFunctions: [
    'MOVE',
    'LEFT',
    'UP',
    'RIGHT',
    'DOWN',
    'WAIT',
    'PUSH',
    'DUP',
    'POP',
    'PUSH',
    'SWAP',
    'ROT3',
    'ADD',
    'MUL',
    'SUB',
    'DIV',
    'MOD',
    'RAND',
    'DEF',
    'IF',
    'LOOK',
  ],
  objects: [
  ],
  comments: [
    'Look - this map has a new type of block! The red X is a spike - it\'ll kill Hash if it tries to walk over it!',
    '',
    'Now that the levels are getting more complicated, your program probably needs to be able to adapt depending on Hash\'s surroundings. Let\'s introduce some new commands to help Hash make it without relying on its all-powerful controller (you).',
    '',
    'The LOOK command tells you what\'s right next to you in a particular direction. First it pops a value off the stack - this is the direction Hash will look in (LOOK uses the same numbers to represent directions as MOVE). Then it pushes a new value to the stack depending on what type of object (if any) is in the space one block away from Hash in that direction.',
    ' 0: empty cell',
    ' 1: block',
    ' 2: spike',
    '-1: outside the grid limits',
  ],
};

const level8 = {
  grid: `
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@                     xxxxxx@
@ #                        3@
@                     xxxxx @
@@@@@@@@@@@@@@@@@@@@@@@@@xx @
@3                   4xx@xx @
@ x@@@@@@@@@@@@@@@@@@ xx@xx @
@2                 3@ xx@xx @
@@@@@@@@@@@@@@@@@@x @ xx@xx @
@3                 4@ xx@xx @
@ x@@@@@@@@@@@@@@@@@@ xx@xx @
@2                 3@ xx@xx @
@@@@@@@@@@@@@@@@@@x @ xx@xx @
@3                 4@ xxxxx @
@ x@@@@@@@@@@@@@@@@@@ xxxxx @
@ x@3             4x@1     4@
@ x@ @@@@@@@@@@@@@ x@@@@@@@@@
@ x@ @    @      @1        4@
@ x@ @    @@@@@@@@@@@@@@@@x @
@ x@ @ o                4@x @
@ x@ @    @xxxxxxxxxxxxx @x @
@ x@ @    @xxxxxxxxxxxxx @x @
@ x@ @@@@@@xxxxxxxxxxxxx @x @
@ x@2                   1@x @
@ x@@@@@@@@@@@@@@@@@@@@@@@x @
@2                         1@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
`,
  levelName: 'Look out for yourself',
  mapping: {
    '@': 'block',
    '#': 'player',
    'o': 'exit',
    'x': 'spike',
    '0': 'push0',
    '1': 'push1',
    '2': 'push2',
    '3': 'push3',
    '4': 'push4',
  },
  allFunctionsAvailable: false,
  availableFunctions: [
    'MOVE',
    'LEFT',
    'UP',
    'RIGHT',
    'DOWN',
    'WAIT',
    'PUSH',
    'DUP',
    'POP',
    'PUSH',
    'SWAP',
    'ROT3',
    'ADD',
    'MUL',
    'SUB',
    'DIV',
    'MOD',
    'RAND',
    'DEF',
    'IF',
    'LOOK',
  ],
  objects: [
  ],
  comments: [
    'When Hash meets a number on its journey, it\'ll eat it! The number will be pushed to the top of the stack. Depending on the situation, this might be exactly what you want, or you might have to get rid of it. I wonder how the numbers in this level were chosen...',
  ],
};


/*
const level = {
  grid: ``,
  levelName: '',
  mapping: {
  },
  allFunctionsAvailable: false,
  availableFunctions: [
  ],
  additionalFunctions: {
  },
  objects: [
  ],
  comments: [
  ],
};

*/

const makeMapFuncFromData = (data) => {
  const mapFunc = (game, debug) => Map.createFromGrid(game, data, debug);
  mapFunc.comments = data.comments;
  mapFunc.hintLines = data.hintLines;
  return mapFunc;
};

const levelData = [
  level0,
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
];

const levels = levelData.map(makeMapFuncFromData);

const introMapFunc = (game, debug) => {
  const map = new Map(game, defaultWidth*2, defaultHeight-2);
  game.loadFunctions([]);
  game.setLevelName('');
  map.defineNewObject({
    name: 'dash',
    getSymbol: () => '=',
  });
  return map;
};


function pickLevelMapFunc(game, debug, {collision}) {
  const levelNameFirstCol = 10;
  const levelNumberColumn = 5;

  const lengths = levelData.map(level=>level.levelName.length);
  const numLevels = levelData.length;

  const height = Math.max(defaultHeight, numLevels);
  const width = Math.max(defaultWidth, levelNameFirstCol+Math.max(...lengths));
  map = new Map(game, width, height);

  paddingLines = Math.floor((height - numLevels) / (numLevels + 1));
  game.loadFunctions(Object.keys(coreFunctions));
  game.setLevelName('');

  map.setPlayer(2, 2);

  levelData.forEach((level, index) => {
    const lineNum = paddingLines + index * (paddingLines + 1);
    map.defineNewObject({
      name: 'level' + index,
      getSymbol: () => (index % 10).toString(),
      getColor: () => 'cyan',
      passable: () => true,
      onCollision: collision(index),
    });
    map.placeObject(levelNumberColumn, lineNum, 'level' + index);
    const text = level.levelName;
    const chars = text.split('');
    let column = levelNameFirstCol;
    for (let char of chars) {
      map.defineNewObject({
        name: char,
        getSymbol: () => char,
        passable: () => true,
      }),
      map.placeObject(column, lineNum, char);
      column++;
    }
  });

  return map;
};

pickLevelMapFunc.comments = [
  'Congratulations on finishing Stacked!',
  'If you like, you can now pick any of the levels to play again. Simply navigate Hash to one of the blue level numbers to load that level. As a treat, for this level only you can use the arrow keys to move around. If you fancy an extra challenge, why not try and try and optimise your solutions: at the bottom right of the map you\'ll see a counter indicating how many instructions the program has executed. See how low you can get that number when you reach the exit!',
  '',
  'Stacked was written by Freddy Pringle. To check out the GitHub repo, click the icon at the top right of the page. You\'re more than welcome to fork the repo, run the game locally, make changes or design your own levels, and submit merge requests.',
  '',
  'For the inspiration for Stacked, full credit goes to Alex Nisnevich and Greg Shuflin for their awesome game Untrusted. The readme on Stacked\'s repo has links to their pages and to Untrusted, which I strongly recommend you try.',
];
const DIRECTIONS = {
  none: [0, 0],
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const maxLevelKey = '@stacked:maxLevelReached';

const flashError = (message) => {
  $('#errorBanner').text(message);
  $('#errorBanner').show();
  setTimeout(() => {
    $('#errorBanner').empty();
    $('#errorBanner').hide();
  }, 5000);
};

function Game({debug, firstLevel, allFuncs}) {
  let debugMode = debug;
  let stack = [];
  let functions = {};
  let display = null;
  let map = null;
  let editor = null;
  let origMapFunc;
  let playerCanMove;
  let levelCompleted = false;
  let levelName;
  let levelNum = firstLevel || 0;
  let curBestLevel = levelNum;
  let refreshTimer;
  let hasFinished = false;
  const executionDelay = 75;
  const levelCompleteClearDelay = 2500;
  const showNextLevelButtonDelay = 500;
  const showFinishButtonDelay = 500;
  const editorWidth = '100%';
  const editorHeight = 550;
  const drawRandomFastTime = 500;
  const drawRandomSlowTime = 1000;
  const newLevelNameClearDelay = 2500;
  const loadingLevelDelay = 750;
  const drawLineDelay = 100;
  const drawCharDelay = 20;
  const flashDelay = 500;
  let comments = [];
  let hintLines = [];
  let executionSteps;
  let dontErase = [];

  const handleError = (err) => {
    const message = err.message[0].toUpperCase() + err.message.substr(1);
    console.error('Error: ' + message);
    flashError(message);
  };

  this.ready = () => {
    initializeBeforeMap();
    if (debugMode) {
      $('#pickLevelButton').show()
      $('#debugBanner').show();
      $('#clearCacheButton').click(() => {
        window.localStorage.removeItem(maxLevelKey);
        location.reload();
      });
    }

    reset();
    if (levelNum === -1) {
      intro();
    } else {
      $('#startButtonDiv').hide();
      loadMapFromLevelNum(levelNum);
      this.initializeAfterMap({newMap: true, drawStyle:'random-slow'});
    }
  };

  this.setLevelName = (name) => {
    levelName = name;
  };

  this.killPlayer = () => {
    writeStatus('Hash died!');
    playerCanMove = false;
    setTimeout(() => reloadMap('random-fast'), 1000);
  };

  this.defineNewFunction = (name, terms) => {
    functions[name] = {
      category: 'custom',
      description: `Function ${name} defined by user.`,
      syntax: name,
      minStackSize: 0,
      call: (stack, instructions, game) => {
        instructions.splice(0, 0, ...terms);
      },
    };
  };

  const getCategories = () => {
    const categories = {};
    for (let [name, props] of Object.entries(functions)) {
      const category = props.category;
      if (!categories.hasOwnProperty(category)) categories[category] = [];
      categories[category].push([name, props.description]);
    }
    return categories;
  };

  const alphabetical = (a, b) => {
    if (a < b) return -1;
    else if (a > b) return 1;
    else return 0;
  };

  const updateInfoPane = () => {
    const categories = Object.entries(getCategories());
    categories.sort((a,b) => alphabetical(a[0], b[0]));
    $('#command-categories').empty();
    for (let [category, funcs] of categories) {
      const categoryCap = category ? category[0].toUpperCase() + category.substr(1).toLowerCase() : '';
      const elem = $('<li/>').addClass('category');
      elem.append($('<div/>').addClass('category-title').text(categoryCap));
      const sublist = $('<ul/>').addClass('func-list');

      funcs.forEach(([name, desc]) => {
        const li = $('<li/>').addClass('func-def');
        const div = $('<div/>').addClass('func-name').addClass('cm-atom').text(name);
        div.click(() => {
          editor.insert(name);
          editor.focus();
        });
        li.append(div);
        li.append($('<div/>').addClass('func-desc').text(desc));
        sublist.append(li);
      });
      elem.append(sublist);
      $('#command-categories').append(elem);
    }
  };

  const getCharsToDraw = () => {
    const {width, height} = map.getDimensions();
    const chars = [];
    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {
        let obj = map.getObjectAt(x, y);
        if (obj) {
          const symbol = obj.getSymbol ? obj.getSymbol() : null;
          const color = obj.getColor ? obj.getColor() : null;
          const bgcolor = obj.getBackgroundColor ? obj.getBackgroundColor() : null;
          chars.push([x, y, symbol, color, bgcolor]);
        }
      }
    }
    try {
      const player = map.getPlayer();
      const {x, y} = player.getXY();
      const symbol = player.getSymbol ? player.getSymbol() : null;
      const color = player.getColor ? player.getColor() : null;
      const bgcolor = player.getBackgroundColor ? player.getBackgroundColor() : null;
      chars.push([x, y, symbol, color, bgcolor]);
    } catch {
    }
    return chars;
  }

  const draw = () => {
    const chars = getCharsToDraw();
    for (let char of chars) {
      display.draw(...char);
    }
  };

  const drawRandom = (drawTime) => {
    const chars = getCharsToDraw();
    if (chars.length === 0) return;

    const delay = drawTime / chars.length;
    const player = chars.pop();

    const drawOne = () => {
      if (chars.length === 0) {
        display.draw(...player);
        playerCanMove = true;
        return;
      }
      const idx = Math.floor(Math.random() * chars.length);
      const [char] = chars.splice(idx, 1);
      display.draw(...char);
      setTimeout(drawOne, delay);
    }

    drawOne();
  };

  const drawLines = () => {
    const chars = getCharsToDraw();
    if (chars.length === 0) return;
    const player = chars.pop();
    const lines = [[chars.shift()]];
    for (let char of chars) {
      if (char[1] === lines[lines.length-1][0][1]) lines[lines.length-1].push(char);
      else lines.push([char]);
    }

    const drawLine = (line, final) => {
      const drawOneChar = () => {
        if (line.length === 0) {
          if (lines.length === 0) {
            display.draw(...player);
          }
          return;
        }
        const char = line.shift();
        display.draw(...char);
        setTimeout(drawOneChar, drawCharDelay);
      }
      drawOneChar();
    }

    const drawOneLine = () => {
      if (lines.length === 0) return;
      const line = lines.shift();
      drawLine(line);
      setTimeout(drawOneLine, drawLineDelay);
    }

    drawOneLine();
  }

  const writeStatus = (text, timeout=-1) => {
    let {width, height} = map.getDimensions();
    const padding = 0;
    const drawingWidth = width - 2 * padding;
    const lines = [];
    const textLines = text.split('\n');
    for (let line of textLines) {
      const words = line.split(/\s+/);
      if (words.length === 0) lines.push('');
      while (words.length > 0) {
        let curline = '';
        while (words.length > 0 && curline.length - 1 < drawingWidth) {
          curline += words.shift() + ' ';
        }
        lines.push(curline.trim());
      }
    }
    const topLine = height - padding - lines.length;
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    for (let idx=0; idx<lines.length; idx++) {
      const line = lines[idx];
      const x = Math.floor((width - line.length) / 2);
      display.drawText(x, topLine + idx, line);
    }
    if (timeout !== -1) {
      refreshTimer = setTimeout(() => {
        refresh();
      }, timeout);
    }
  };

  this.movePlayer = function(direction) {
    if (!playerCanMove) return;
    const player = map.getPlayer();
    if (!player) return;
    map.movePlayer(direction);
    refresh();
    const {x, y} = player.getXY();
    const obj = map.getObjectAt(x, y);
    if (obj && obj.onCollision) {
      obj.x = x;
      obj.y = y;
      obj.onCollision(obj, player);
    }
  }

  this.pushToStack = (val) => {
    stack.push(val);
    this.updateStackDisplay();
  };

  this.updateStackDisplay = () => {
    let shortenedStack = stack.slice();
    if (shortenedStack.length > 5) {
      shortenedStack = shortenedStack.slice(shortenedStack.length - 4);
      shortenedStack.unshift('...');
    }
    $('#result').text('[ ' + shortenedStack.join(', ') + ' ]');
  };

  const refresh = (drawGridLines=true) => {

    if (map && dontErase.length > 0) {
      const {width, height} = map.getDimensions();
      for (let x=0; x<width; x++) for (let y=0; y<height; y++) {
        if (!dontErase.includes(x+','+y)) display.draw(x, y, '');
      }
    } else {
      display.clear();
    }
    if (map && drawGridLines) {
      const {width, height} = map.getDimensions();
      for (let x=0; x<width; x++) for (let y=0; y<height; y++) {
        if (!dontErase.includes(x+','+y)) {
          if (x%2==0 && y%2==0) {
            display .draw(x, y, '·', '#424242');
          }
        }
      }
    }
    draw();
  };

  const handleKeyboardInput = (e) => {
    switch (e.keyCode) {
      case 37:
        this.movePlayer('left');
        break;
      case 38:
        this.movePlayer('up');
        break;
      case 39:
        this.movePlayer('right');
        break;
      case 40:
        this.movePlayer('down');
        break;
    }
  }

  const enableKeyboardInput = () => {
    $(display.getContainer()).attr("contentEditable", "true");
    display.getContainer().addEventListener('keydown', handleKeyboardInput);
  };

  const disableKeyboardInput = () => {
    $(display.getContainer()).attr("contentEditable", "false");
    display.getContainer().removeEventListener('keydown', handleKeyboardInput);
  };

  const runProgram = () => {
    const run = () => {
      playerCanMove = true;
      const instructions = editor.getInstructions();
      const gen = interpret(this, instructions, stack, functions, debugMode);
      const execOne = () => {
        if (levelCompleted) return;
        const next = gen.next();
        if (next.done) return;
        setTimeout(execOne, executionDelay);
      };
      execOne();
    };

    reloadMap('normal');
    setTimeout(() => {
      try {
        run();
      } catch (err) {
        handleError(err);
      }
    }, executionDelay);
  }

  this.loadFunctions = (availableFunctions) => {
    functions = {};
    for (let func of availableFunctions) functions[func] = coreFunctions[func];
  };

  this.loadAdditionalFunctions = (additionalFunctions) => {
    functions = {
      ...functions,
      ...additionalFunctions,
    };
  };

  const flashHighlight = (elem, count) => {
    const toggleOn = () => {
      if (count === 0) return;
      elem.addClass('highlight');
      setTimeout(toggleOff, flashDelay);
    }

    const toggleOff = () => {
      count--;
      elem.removeClass('highlight');
      setTimeout(toggleOn, flashDelay);
    }

    toggleOn(count);
  }

  this.getPlayerXY = () => {
    return map.getPlayer().getXY();
  };

  this.getTypeAt = (x, y) => {
    let obj = map.getObjectAt(x, y);
    if (obj === 'outside') return 'outside';
    else if (!obj) return 'empty';
    else return obj.name;
  };

  this.endLevel = () => {
    // check player is at exit

    const {x, y} = map.getPlayer().getXY();
    const obj = map.getObjectAt(x, y);
    if (!obj || obj.name !== 'exit') {
      const errMsg = 'something\'s gone wrong (or someone\'s trying to cheat!) - Game.endLevel() was called but player isn\'t at the exit. Hmm....';
      console.error(errMsg);
      throw new Error(errMsg);
      return;
    }

    playerCanMove = false;
    levelCompleted = true;
    writeStatus(`Level ${levelNum} completed!`, levelCompleteClearDelay);
    if (levelNum + 1 < levels.length) {
      setTimeout(() => {
        $('#nextLevelButton').show();
        flashHighlight($('#nextLevelButton'), 2);
      }, showNextLevelButtonDelay);
    } else if (!hasFinished) {
      hasFinished = true;
      setTimeout(() => {
        $('#finishButton').show();
      }, showFinishButtonDelay);
    }
  };

  const nextLevel = () => {
    $('#nextLevelButton').hide();

    let _curBestLevel = JSON.parse(window.localStorage.getItem(maxLevelKey)) || 0;
    curBestLevel = Math.max(_curBestLevel, levelNum+1, curBestLevel);
    window.localStorage.setItem(maxLevelKey, JSON.stringify(curBestLevel));

    reset();
    loadMapFromLevelNum(levelNum+1);
    this.initializeAfterMap({newMap: true, drawStyle: 'random-slow'});
  };

  const finish = () => {
    writeStatus('Thanks for playing!');
    $('#pickLevelButton').show();
    $('#finishButton').hide();
  };

  const intro = () => {
    reset();
    editor.setValue('');
    loadMap(introMapFunc);
    $('#levelIndicator').text('Intro');
    this.initializeAfterMap({newMap: false, drawStyle: 'normal'});
    $('#editorPane').hide();
    $('#referencePane').hide();
    $('#belowScreen').hide();
    $('#levelButtons').hide();
    const asciiArt = [
      '   _____   _______               _____   _  __  ______   _____  ',
      '  / ____| |__   __|     /\\      / ____| | |/ / |  ____| |  __ \\ ',
      ' | (___      | |       /  \\    | |      | \' /  | |__    | |  | |',
      '  \\___ \\     | |      / /\\ \\   | |      |  <   |  __|   | |  | |',
      '  ____) |    | |     / ____ \\  | |____  | . \\  | |____  | |__| |',
      ' |_____/     |_|    /_/    \\_\\  \\_____| |_|\\_\\ |______| |_____/ ',
    ];
    const width = Math.max(...asciiArt.map(l=>l.length));
    const {width: mWidth, height: mHeight} = map.getDimensions();
    const startCol = Math.floor((mWidth - width) / 2);
    const startRow = Math.floor((mHeight - asciiArt.length) / 2) - 2;
    asciiArt.forEach((line, idx) => {
      display.drawText(startCol+line.search(/\S/), startRow+idx, line);
      for (let x=startCol+line.search(/\S/); x<startCol+line.length; x++) {
        dontErase.push(x + ',' + (startRow+idx));
      }
    });

    refresh(false);
    const instructions = [];
    for (let x=1; x<mWidth-2; x++) instructions.push('RIGHT');
    const tempStack = [];
    const functions = {
      RIGHT: coreFunctions.RIGHT,
    };
    const gen = interpret(this, instructions, tempStack, functions, false);
    let x = 1;
    const execOne = () => {
      const next = gen.next();
      map.placeObject(x++, startRow + asciiArt.length + 1, 'dash');
      refresh(false);
      if (next.done) {
        setTimeout(() => {
          $('#startButton').removeClass('hidden');
          $('#startButton').css('visibility', 'visible');
          $('#startButton').click(() => {
            dontErase = [];
            $('#startButtonDiv').hide();
            $('#editorPane').show();
            $('#referencePane').show();
            $('#belowScreen').show();
            $('#levelButtons').show();
            reset();
            loadMapFromLevelNum(0);
            this.initializeAfterMap({newMap: true, drawStyle: 'random-slow'});
          });
        }, 750);
        return;
      }
      setTimeout(execOne, 20);
    };
    setTimeout(() => {
      map.setPlayer(1, startRow + asciiArt.length + 1);
      execOne();
    }, 500);
  };

  const pickLevelCollision = (index) => {
    return () => {
      levelNum = index;
      disableKeyboardInput();
      writeStatus(`Loading level ${index}...`);
      setTimeout(() => {
        reset();
        setupButtons();
        loadMapFromLevelNum(index);
        this.initializeAfterMap({newMap: true, drawStyle: 'random-fast'});
      }, loadingLevelDelay);
    }
  };

  const pickLevel = () => {
    reset();
    editor.setValue('');
    $('#levelIndicator').text('Pick level');
    $('#resetButton').off('click');
    $('#resetButton').click(() => {
      pickLevel();
    });
    //if (!debugMode) $('#pickLevelButton').hide();

    reset();
    loadMap(pickLevelMapFunc, {collision: pickLevelCollision});
    this.initializeAfterMap({newMap: false, drawStyle: 'lines'});
    insertComments();
    levelNum = -1;
    enableKeyboardInput();
    playerCanMove = true;
    $('#screen canvas').focus();
  };

  const reloadMap = (drawStyle) => {
    reset();
    if (levelNum === -1) {
      loadMap(origMapFunc, {collision: pickLevelCollision});
    } else {
      loadMap(origMapFunc);
    }
    this.initializeAfterMap({newMap: false, drawStyle});
  };

  const setupButtons = () => {
    $('#resetButton').off('click');
    $('#nextLevelButton').off('click');
    $('#finishButton').off('click');
    $('#pickLevelButton').off('click');

    $('#executeButton').click(() => {
      runProgram();
    });
    $('#resetButton').click(() => {
      reloadMap('random-fast');
    });
    $('#nextLevelButton').click(() => {
      nextLevel();
    });
    $('#finishButton').click(() => {
      finish();
    });
    $('#pickLevelButton').click(() => {
      pickLevel();
    });
    $('#resetCodeButton').click(() => {
      editor.setValue('');
    });

    if (hasFinished) {
      $('#pickLevelButton').show();
    }
  };

  const initializeBeforeMap = () => {
    editor = new Editor(editorWidth, editorHeight);
    setupButtons();
  };

  const insertComments = () => {
    editor.setValue('#\n' + comments.join('\n') + '\n#\n\n' + hintLines.join('\n'));
  };

  this.initializeAfterMap = ({newMap, drawStyle}) => {
    let {width, height} = map.getDimensions();

    display = new ROT.Display({
      width,
      height,
      forceSquareRatio: true,
      fontSize: 16,
    });

    $('#screen').append(display.getContainer());

    display.clear();
    switch (drawStyle) {
      case 'lines':
        drawLines();
        break;
      case 'random-fast':
        drawRandom(drawRandomFastTime);
        break;
      case 'random-slow':
        drawRandom(drawRandomSlowTime);
        break;
      case 'normal':
        draw();
        break;
      default:
        throw new Error('unknown draw style: ' + drawStyle);
    };

    if (newMap) {
      writeStatus(levelNum + '. ' + levelName, newLevelNameClearDelay);
      if (levelNum === 0) {
        const text = 'WELCOME, HASH';
        const x = (width - text.length) / 2;
        display.drawText(x, 1, text);
      }
      if (comments.length > 0 || hintLines.length > 0) {
        insertComments();
      } else {
        editor.setValue('');
      }

    }

    const maxLevelAvailable = Math.max(0, debugMode ? levels.length - 1 : curBestLevel);
    $('#levelButtons').empty();
    for (let i=0; i<=maxLevelAvailable; i++) {
      const html = `<span><a id="level${i}Button" class="keys" title="L${i}">L${i}</a></span>`;
      $('#levelButtons').append($(html));
      $(`#level${i}Button`).click(() => {
        if (i === levelNum) return;
        $('#nextLevelButton').hide();
        reset();
        loadMapFromLevelNum(i);
        this.initializeAfterMap({newMap: true, drawStyle:'random-fast'});
      });
    }
    for (let i=0; i<levels.length; i++) {
      $(`#level${i}Button`).removeClass('highlight');
      if (i === levelNum) $(`#level${levelNum}Button`).addClass('highlight');
    }


    updateInfoPane();
    this.updateStackDisplay();
    playerCanMove = true;
    levelCompleted = false;

    if (debugMode) {
      enableKeyboardInput();
      display.getContainer().focus();
    } else {
      editor.focus();
    }
    refresh();
  };

  const updateExecutionStepsIndicator = () => {
    $('#steps').text(''+executionSteps);
  };

  this.incrementExecutionSteps = () => {
    executionSteps++;
    updateExecutionStepsIndicator();
  };

  const loadMap = (mapFunc, extraData) => {
    comments = [];
    hintLines = [];
    executionSteps = 0;
    updateExecutionStepsIndicator();
    playerCanMove = false;
    origMapFunc = mapFunc;
    comments = mapFunc.comments || [];
    hintLines = mapFunc.hintLines || [];
    map = mapFunc(this, allFuncs, extraData);
  };

  const loadMapFromLevelNum = (index, extraData) => {
    loadMap(levels[index], extraData);
    levelNum = index;
    $('#levelIndicator').text('Level ' + levelNum);
  };

  const reset = () => {
    playerCanMove = false;
    functions = {};
    stack = [];
    map = null;
    display = null;
    $('#screen').empty();
    this.updateStackDisplay();
  };
}

window.onerror = (message, source, lineno, colno, error) => {
  source = source.split('/');
  source = source[source.length-1]
  console.error(`Error at ${source}:${lineno},${colno}: ` + message);
  flashError(message);
};

$(document).ready(() => {

  let firstLevel = window.localStorage.getItem(maxLevelKey);
  if (firstLevel) firstLevel = parseInt(firstLevel);
  else firstLevel = -1;

  const game = new Game({
//    debug:true,
    firstLevel,
//    firstLevel: levels.length-1,
//    allFuncs: true,
  });
  game.ready();
});
})();
