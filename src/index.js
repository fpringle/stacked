
window.onerror = (message, source, lineno, colno, error) => {
  $('#errorBanner').text(message);
  $('#errorBanner').show();
  source = source.split('/');
  source = source[source.length-1]
  console.error(`Error at ${source}:${lineno},${colno}: ` + message);
  setTimeout(() => {
    $('#errorBanner').empty();
    $('#errorBanner').hide();
  }, 5000);
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
