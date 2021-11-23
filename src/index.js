
$(document).ready(() => {
  window.game = new Game({
    debug:true,
    hard:true,
    firstLevel: 1,
  });
  window.game.initializeBeforeMap();
  window.game.ready();
});
