
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
    debug:true,
    firstLevel,
//    firstLevel: levels.length-1,
//    allFuncs: true,
  });
  game.ready();
});
