
$(document).ready(() => {
  const game = new Game({
    debug:true,
    hard:true,
    firstLevel: 0,
    allFuncs: true,
  });
  game.ready();
});
