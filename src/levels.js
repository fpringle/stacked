const level0 = {
  grid: `
@@@@@@@@@@@@@
@           @
@           @
@           @
@  #     X  @
@           @
@           @
@           @
@@@@@@@@@@@@@
`,
  levelName: 'Level 0: Hello Stack',
  comments: [
    'In Stacked you control the character, called Hash, by writing code in a simple stack-based language.',
    'This window is the Editor. You can use it to write commands to control your character. Anything after a \'#\' will be ignored, so you can write comments if you like.',
    'Your program has access to a list of integers called the \'stack\', which is initially empty.',
    'You can manipulate this stack using \'commands\' written in the Editor. If you click the \'Run Code\' button below, the commands will be executed one by one.',
    'Using these commands you can PUSH a value to the top of the stack, POP the top value off the stack, perform numeric operations like ADD or DIV, and execute conditional statements depending on the values in the stack. You can also define your own commands, but we\'ll get to that later.',
    'Apart from manipulating the stack, there are also commands to manipulate your character Hash. The center pane is the Map. During each level you\'ll see a 2-dimensional layout. Your character is represented by the # symbol, and your goal is to reach the X symbol.',
    'Let\'s give it a go. For now you have access to just one command: RIGHT. If the program encounters a RIGHT command, it\'ll move Hash one space to the right. I wonder what happens if it encounters multiple RIGHT commands...'
  ],
  mapping: {
    '@': 'block',
    '#': 'player',
    'X': 'exit',
  },
  availableFunctions: [
    'RIGHT',
  ],
};

const level1 = {
  grid: `
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
`,
  levelName: 'Level 1: Corners',
  mapping: {
    '@': 'block',
    '#': 'player',
    'X': 'exit',
  },
  availableFunctions: [
    'MOVE',
    'PUSH',
    'RIGHT',
  ],
};

const makeMapFuncFromData = (data) => {
  const mapFunc = (game, debug) => Map.createFromGrid(game, data, debug);
  mapFunc.comments = data.comments;
  return mapFunc;
};

const levelData = [
  level0,
  level1,
];

const levels = levelData.map(makeMapFuncFromData);


const pickLevelMapFunc = (game, debug, {collision}) => {
  const lengths = levelData.map(level=>level.levelName.length);
  const numLevels = levelData.length;

  const height = Math.max(defaultHeight, numLevels);
  const width = Math.max(defaultWidth, 10+Math.max(...lengths));
  map = new Map(game, width, height);

  paddingLines = Math.floor((height - numLevels) / (numLevels + 1));
  const lineDelay = 200;
  const charDelay = 20;
  game.loadFunctions(Object.keys(coreFunctions));
  game.setLevelName('');

  map.setPlayer(2, 2);

  const linesToDraw = levelData.map((level, index) => {
  });

  levelData.forEach((level, index) => {
    const lineNum = paddingLines + index * (paddingLines + 1);
    map.defineNewObject({
      name: 'level' + index,
      getSymbol: () => index.toString(),
      getColor: () => 'cyan',
      passable: () => true,
      onCollision: collision(index),
    });
    map.placeObject(5, lineNum, 'level' + index);
    const text = level.levelName;
    const chars = text.split('');
    let column = 10;
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
