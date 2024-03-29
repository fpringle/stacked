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
