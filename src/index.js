
window.onerror = (message, source, lineno, colno, error) => {
  source = source.split('/');
  source = source[source.length-1]
  console.error(`Error at ${source}:${lineno},${colno}: ` + message);
  flashError(message);
};

$(document).ready(() => {

  const firstLevel = JSON.parse(window.localStorage.getItem(maxLevelKey)) || 0;

  const game = new Game({
//    debug:true,
//    hard:true,
    firstLevel,
//    firstLevel: levels.length-1,
//    allFuncs: true,
  });
  game.ready();
});
