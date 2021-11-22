
$(document).ready(() => {
  window.game = new Game(true);

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
`;

  let map = Map.createFromGrid(window.game, {
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
        getSymbol: () => 'o',
        getColor: () => 'cyan',
      },
    ],
  });

  window.game.loadMap(map);
  window.game.initialize();
});
