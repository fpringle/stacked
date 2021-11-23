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
  mapping: {
    '@': 'block',
    '#': 'player',
    'X': 'exit',
  },
  availableFunctions: [
    'MOVE',
    'PUSH',
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
    'LEFT',
    'UP',
    'DOWN',
  ],
};

const makeMapFuncFromData = (data) => {
  return (game, debug) => Map.createFromGrid(game, data, debug);
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
