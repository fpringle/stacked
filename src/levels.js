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
@     @  X  @
@     @  #  @
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

const levels = [
  level0,
  level1,
];
