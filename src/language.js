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
    description: 'Push a value onto the stack.',
    syntax: 'PUSH <value>',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      const value = instructions.shift();
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
      const val = Math.floor(Math.random() * (mx - mn));
      stack.push(val);
    },
  },

  // flow control
  IF: {
    category: 'flow',
    description: 'Pop the top value off the stack. If it is non-zero, insert the given isntructions at the current location in the program. If not, and if an "else" clause is given, insert those commands instead.',
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
      console.log('move', direction);
      console.log(game);
      if (direction) game.movePlayer(direction);
    },
  },
  LEFT: {
    category: 'action',
    description: 'Move left, if possible.',
    syntax: 'LEFT',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      console.log('move left',);
      game.movePlayer('left');
    },
  },
  UP: {
    category: 'action',
    description: 'Move up, if possible.',
    syntax: 'UP',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      console.log('move up',);
      game.movePlayer('up');
    },
  },
  RIGHT: {
    category: 'action',
    description: 'Move right, if possible.',
    syntax: 'RIGHT',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      console.log('move right',);
      game.movePlayer('right');
    },
  },
  DOWN: {
    category: 'action',
    description: 'Move down, if possible.',
    syntax: 'DOWN',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      console.log('move down',);
      game.movePlayer('down');
    },
  },
  WAIT: {
    category: 'action',
    description: 'Wait for 1 turn.',
    syntax: 'WAIT',
    minStackSize: 0,
    call: (stack, instructions, game) => {
      console.log('wait',);
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
};

// parsing functions

const findEnd = (instructions) => {
  let depth = 1;
  for (let pos = 0; pos < instructions.length; pos++) {
    switch (instructions[pos]) {
      case 'DEF':
      case 'IF':
        depth++;
//        console.log(instructions[pos], depth);
        break;
      case 'END':
        depth--;
//        console.log(instructions[pos], depth);
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

const interpret = (game, instructions, stack, functionsAvailable, debug=false) => {
  let count = 0;

  const execOne = () => {
    if (instructions.length === 0) return;
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
      console.log('calling', instr);
      instruction.call(stack, instructions, game);
    } else {
      throw new Error('unknown instruction: ' + instr);
    }
    count++;
    if (count > 1000) {
      throw new Error('maximum program length exceeded');
    }

    setTimeout(execOne, 200);
  }

  execOne();
};
