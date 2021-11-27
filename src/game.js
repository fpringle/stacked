const DIRECTIONS = {
  none: [0, 0],
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const maxLevelKey = '@stacked:maxLevelReached';

const flashError = (message) => {
  $('#errorBanner').text(message);
  $('#errorBanner').show();
  setTimeout(() => {
    $('#errorBanner').empty();
    $('#errorBanner').hide();
  }, 5000);
};

function Game({debug, hard, firstLevel, allFuncs}) {
  let debugMode = debug;
  let stack = [];
  let functions = {};
  let display = null;
  let map = null;
  let editor = null;
  let origMapFunc;
  let playerCanMove;
  let levelCompleted = false;
  let levelName;
  let hardMode = hard;   // in hard mode, each program run starts with a fresh map
  let levelNum = firstLevel || 0;
  let curBestLevel = levelNum;
  let refreshTimer;
  let hasFinished = false;
  const executionDelay = 75;
  const levelCompleteClearDelay = 2500;
  const showNextLevelButtonDelay = 500;
  const showFinishButtonDelay = 500;
  const editorWidth = '100%';
  const editorHeight = 500;
  const drawRandomFastTime = 500;
  const drawRandomSlowTime = 1000;
  const newLevelNameClearDelay = 2500;
  const loadingLevelDelay = 750;
  const drawLineDelay = 100;
  const drawCharDelay = 20;
  const flashDelay = 500;
  let comments = [];
  let executionSteps;
  let dontErase = [];

  const setHardModeIndicator = () => {
    if (hardMode) {
      $('#hardModeIndicator').text(String.fromCharCode(0x2713));
    } else {
      $('#hardModeIndicator').text('x');
    }
  }

  const toggleHardMode = () => {
    hardMode = !hardMode;
    setHardModeIndicator();
  };

  const handleError = (err) => {
    const message = err.message[0].toUpperCase() + err.message.substr(1);
    console.error('Error: ' + message);
    flashError(message);
  };

  this.ready = () => {
    setHardModeIndicator();
    initializeBeforeMap();
    if (debugMode) {
      $('#pickLevelButton').show()
      $('#debugBanner').show();
      $('#clearCacheButton').click(() => {
        window.localStorage.removeItem(maxLevelKey);
        location.reload();
      });
    }

    reset();
    if (levelNum === -1) {
      intro();
    } else {
      $('#startButtonDiv').hide();
      loadMapFromLevelNum(levelNum);
      this.initializeAfterMap({newMap: true, drawStyle:'random-slow'});
    }
  };

  this.setLevelName = (name) => {
    levelName = name;
  };

  this.killPlayer = () => {
    writeStatus('Hash died!');
    playerCanMove = false;
    setTimeout(() => reloadMap('random-fast'), 1000);
  };

  this.defineNewFunction = (name, terms) => {
    functions[name] = {
      category: 'custom',
      description: `Function ${name} defined by user.`,
      syntax: name,
      minStackSize: 0,
      call: (stack, instructions, game) => {
        instructions.splice(0, 0, ...terms);
      },
    };
  };

  const getCategories = () => {
    const categories = {};
    for (let [name, props] of Object.entries(functions)) {
      const category = props.category;
      if (!categories.hasOwnProperty(category)) categories[category] = [];
      categories[category].push([name, props.description]);
    }
    return categories;
  };

  const alphabetical = (a, b) => {
    if (a < b) return -1;
    else if (a > b) return 1;
    else return 0;
  };

  const updateInfoPane = () => {
    const categories = Object.entries(getCategories());
    categories.sort((a,b) => alphabetical(a[0], b[0]));
    $('#command-categories').empty();
    for (let [category, funcs] of categories) {
      const categoryCap = category ? category[0].toUpperCase() + category.substr(1).toLowerCase() : '';
      const elem = $('<li/>').addClass('category');
      elem.append($('<div/>').addClass('category-title').text(categoryCap));
      const sublist = $('<ul/>').addClass('func-list');

      funcs.forEach(([name, desc]) => {
        const li = $('<li/>').addClass('func-def');
        const div = $('<div/>').addClass('func-name').addClass('cm-atom').text(name);
        div.click(() => {
          editor.insert(name);
          editor.focus();
        });
        li.append(div);
        li.append($('<div/>').addClass('func-desc').text(desc));
        sublist.append(li);
      });
      elem.append(sublist);
      $('#command-categories').append(elem);
    }
  };

  const getCharsToDraw = () => {
    const {width, height} = map.getDimensions();
    const chars = [];
    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {
        let obj = map.getObjectAt(x, y);
        if (obj) {
          const symbol = obj.getSymbol ? obj.getSymbol() : null;
          const color = obj.getColor ? obj.getColor() : null;
          const bgcolor = obj.getBackgroundColor ? obj.getBackgroundColor() : null;
          chars.push([x, y, symbol, color, bgcolor]);
        }
      }
    }
    try {
      const player = map.getPlayer();
      const {x, y} = player.getXY();
      const symbol = player.getSymbol ? player.getSymbol() : null;
      const color = player.getColor ? player.getColor() : null;
      const bgcolor = player.getBackgroundColor ? player.getBackgroundColor() : null;
      chars.push([x, y, symbol, color, bgcolor]);
    } catch {
    }
    return chars;
  }

  const draw = () => {
    const chars = getCharsToDraw();
    for (let char of chars) {
      display.draw(...char);
    }
  };

  const drawRandom = (drawTime) => {
    const chars = getCharsToDraw();
    if (chars.length === 0) return;

    const delay = drawTime / chars.length;
    const player = chars.pop();

    const drawOne = () => {
      if (chars.length === 0) {
        display.draw(...player);
        playerCanMove = true;
        return;
      }
      const idx = Math.floor(Math.random() * chars.length);
      const [char] = chars.splice(idx, 1);
      display.draw(...char);
      setTimeout(drawOne, delay);
    }

    drawOne();
  };

  const drawLines = () => {
    const chars = getCharsToDraw();
    if (chars.length === 0) return;
    const player = chars.pop();
    const lines = [[chars.shift()]];
    for (let char of chars) {
      if (char[1] === lines[lines.length-1][0][1]) lines[lines.length-1].push(char);
      else lines.push([char]);
    }

    const drawLine = (line, final) => {
      const drawOneChar = () => {
        if (line.length === 0) {
          if (lines.length === 0) {
            display.draw(...player);
          }
          return;
        }
        const char = line.shift();
        display.draw(...char);
        setTimeout(drawOneChar, drawCharDelay);
      }
      drawOneChar();
    }

    const drawOneLine = () => {
      if (lines.length === 0) return;
      const line = lines.shift();
      drawLine(line);
      setTimeout(drawOneLine, drawLineDelay);
    }

    drawOneLine();
  }

  const writeStatus = (text, timeout=-1) => {
    let {width, height} = map.getDimensions();
    const padding = 0;
    const drawingWidth = width - 2 * padding;
    const lines = [];
    const textLines = text.split('\n');
    for (let line of textLines) {
      const words = line.split(/\s+/);
      if (words.length === 0) lines.push('');
      while (words.length > 0) {
        let curline = '';
        while (words.length > 0 && curline.length - 1 < drawingWidth) {
          curline += words.shift() + ' ';
        }
        lines.push(curline.trim());
      }
    }
    const topLine = height - padding - lines.length;
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    for (let idx=0; idx<lines.length; idx++) {
      const line = lines[idx];
      const x = Math.floor((width - line.length) / 2);
      display.drawText(x, topLine + idx, line);
    }
    if (timeout !== -1) {
      refreshTimer = setTimeout(() => {
        refresh();
      }, timeout);
    }
  };

  this.movePlayer = function(direction) {
    if (!playerCanMove) return;
    const player = map.getPlayer();
    if (!player) return;
    map.movePlayer(direction);
    refresh();
    const {x, y} = player.getXY();
    const obj = map.getObjectAt(x, y);
    if (obj && obj.onCollision) obj.onCollision(player);
  }

  this.updateStackDisplay = () => {
    let shortenedStack = stack.slice();
    if (shortenedStack.length > 5) {
      shortenedStack = shortenedStack.slice(shortenedStack.length - 4);
      shortenedStack.unshift('...');
    }
    $('#result').text('[ ' + shortenedStack.join(', ') + ' ]');
  };

  const refresh = (drawGridLines=true) => {

    if (map && dontErase.length > 0) {
      const {width, height} = map.getDimensions();
      for (let x=0; x<width; x++) for (let y=0; y<height; y++) {
        if (!dontErase.includes(x+','+y)) display.draw(x, y, '');
      }
    } else {
      display.clear();
    }
    if (map && drawGridLines) {
      const {width, height} = map.getDimensions();
      for (let x=0; x<width; x++) for (let y=0; y<height; y++) {
        if (!dontErase.includes(x+','+y)) {
          if (x%2==0 && y%2==0) {
            display .draw(x, y, '·', '#424242');
          }
        }
      }
    }
    draw();
  };

  const handleKeyboardInput = (e) => {
    switch (e.keyCode) {
      case 37:
        this.movePlayer('left');
        break;
      case 38:
        this.movePlayer('up');
        break;
      case 39:
        this.movePlayer('right');
        break;
      case 40:
        this.movePlayer('down');
        break;
    }
  }

  const enableKeyboardInput = () => {
    $(display.getContainer()).attr("contentEditable", "true");
    display.getContainer().addEventListener('keydown', handleKeyboardInput);
  };

  const disableKeyboardInput = () => {
    $(display.getContainer()).attr("contentEditable", "false");
    display.getContainer().removeEventListener('keydown', handleKeyboardInput);
  };

  const runProgram = () => {
    const run = () => {
      playerCanMove = true;
      const instructions = editor.getInstructions();
      const gen = interpret(this, instructions, stack, functions, debugMode);
      const execOne = () => {
        if (levelCompleted) return;
        const next = gen.next();
        if (next.done) return;
        setTimeout(execOne, executionDelay);
      };
      execOne();
    };

    const runAndCatch = () => {
      try {
        run();
      } catch (err) {
        handleError(err);
      }
    };

    if (hardMode) {
      reloadMap('normal');
      setTimeout(runAndCatch, executionDelay);
    } else {
      runAndCatch();
    }
  }

  this.loadFunctions = (availableFunctions) => {
    functions = {};
    for (let func of availableFunctions) functions[func] = coreFunctions[func];
  };

  this.loadAdditionalFunctions = (additionalFunctions) => {
    functions = {
      ...functions,
      ...additionalFunctions,
    };
  };

  const flashHighlight = (elem, count) => {
    const toggleOn = () => {
      if (count === 0) return;
      elem.addClass('highlight');
      setTimeout(toggleOff, flashDelay);
    }

    const toggleOff = () => {
      count--;
      elem.removeClass('highlight');
      setTimeout(toggleOn, flashDelay);
    }

    toggleOn(count);
  }

  this.getPlayerXY = () => {
    return map.getPlayer().getXY();
  };

  this.getTypeAt = (x, y) => {
    let obj = map.getObjectAt(x, y);
    if (obj === 'outside') return 'outside';
    else if (!obj) return 'empty';
    else return obj.name;
  };

  this.endLevel = () => {
    // check player is at exit

    const {x, y} = map.getPlayer().getXY();
    const obj = map.getObjectAt(x, y);
    if (!obj || obj.name !== 'exit') {
      const errMsg = 'something\'s gone wrong (or someone\'s trying to cheat!) - Game.endLevel() was called but player isn\'t at the exit. Hmm....';
      console.error(errMsg);
      throw new Error(errMsg);
      return;
    }

    playerCanMove = false;
    levelCompleted = true;
    writeStatus(`Level ${levelNum} completed!`, levelCompleteClearDelay);
    if (levelNum + 1 < levels.length) {
      setTimeout(() => {
        $('#nextLevelButton').show();
        flashHighlight($('#nextLevelButton'), 2);
      }, showNextLevelButtonDelay);
    } else if (!hasFinished) {
      hasFinished = true;
      setTimeout(() => {
        $('#finishButton').show();
      }, showFinishButtonDelay);
    }
  };

  const nextLevel = () => {
    $('#nextLevelButton').hide();

    let _curBestLevel = JSON.parse(window.localStorage.getItem(maxLevelKey)) || 0;
    curBestLevel = Math.max(_curBestLevel, levelNum+1, curBestLevel);
    window.localStorage.setItem(maxLevelKey, JSON.stringify(curBestLevel));

    reset();
    loadMapFromLevelNum(levelNum+1);
    this.initializeAfterMap({newMap: true, drawStyle: 'random-slow'});
  };

  const finish = () => {
    writeStatus('Thanks for playing!');
    $('#pickLevelButton').show();
    $('#finishButton').hide();
  };

  const intro = () => {
    reset();
    editor.setValue('');
    loadMap(introMapFunc);
    $('#levelIndicator').text('Intro');
    this.initializeAfterMap({newMap: false, drawStyle: 'normal'});
    $('#editorPane').hide();
    $('#referencePane').hide();
    $('#belowScreen').hide();
    $('#levelButtons').hide();
    const asciiArt = [
      '   _____   _______               _____   _  __  ______   _____  ',
      '  / ____| |__   __|     /\\      / ____| | |/ / |  ____| |  __ \\ ',
      ' | (___      | |       /  \\    | |      | \' /  | |__    | |  | |',
      '  \\___ \\     | |      / /\\ \\   | |      |  <   |  __|   | |  | |',
      '  ____) |    | |     / ____ \\  | |____  | . \\  | |____  | |__| |',
      ' |_____/     |_|    /_/    \\_\\  \\_____| |_|\\_\\ |______| |_____/ ',
    ];
    const width = Math.max(...asciiArt.map(l=>l.length));
    const {width: mWidth, height: mHeight} = map.getDimensions();
    const startCol = Math.floor((mWidth - width) / 2);
    const startRow = Math.floor((mHeight - asciiArt.length) / 2) - 2;
    asciiArt.forEach((line, idx) => {
      display.drawText(startCol+line.search(/\S/), startRow+idx, line);
      for (let x=startCol+line.search(/\S/); x<startCol+line.length; x++) {
        dontErase.push(x + ',' + (startRow+idx));
      }
    });

    refresh(false);
    const instructions = [];
    for (let x=1; x<mWidth-2; x++) instructions.push('RIGHT');
    const tempStack = [];
    const functions = {
      RIGHT: coreFunctions.RIGHT,
    };
    const gen = interpret(this, instructions, tempStack, functions, false);
    let x = 1;
    const execOne = () => {
      const next = gen.next();
      map.placeObject(x++, startRow + asciiArt.length + 1, 'dash');
      refresh(false);
      if (next.done) {
        setTimeout(() => {
          $('#startButton').removeClass('hidden');
          $('#startButton').css('visibility', 'visible');
          $('#startButton').click(() => {
            dontErase = [];
            $('#startButtonDiv').hide();
            $('#editorPane').show();
            $('#referencePane').show();
            $('#belowScreen').show();
            $('#levelButtons').show();
            reset();
            loadMapFromLevelNum(0);
            this.initializeAfterMap({newMap: true, drawStyle: 'random-slow'});
          });
        }, 750);
        return;
      }
      setTimeout(execOne, 20);
    };
    setTimeout(() => {
      map.setPlayer(1, startRow + asciiArt.length + 1);
      execOne();
    }, 500);
  };

  const pickLevel = () => {
    reset();
    const oldHardMode = hardMode;
    hardMode = false;
    editor.setValue('');
    $('#levelIndicator').text('Pick level');
    $('#resetButton').off('click');
    $('#resetButton').click(() => {
      pickLevel();
    });
    //if (!debugMode) $('#pickLevelButton').hide();

    const collision = (index) => {
      return () => {
        levelNum = index;
        disableKeyboardInput();
        hardMode = oldHardMode;
        writeStatus(`Loading level ${index}...`);
        setTimeout(() => {
          reset();
          setupButtons();
          loadMapFromLevelNum(index);
          this.initializeAfterMap({newMap: true, drawStyle: 'random-fast'});
        }, loadingLevelDelay);
      }
    };

    reset();
    loadMap(pickLevelMapFunc, {collision});
    this.initializeAfterMap({newMap: false, drawStyle: 'lines'});
    insertComments();
    this.levelNum = -1;
    enableKeyboardInput();
    playerCanMove = true;
    $('#screen canvas').focus();
  };

  const reloadMap = (drawStyle) => {
    reset();
    loadMap(origMapFunc);
    this.initializeAfterMap({newMap: false, drawStyle});
  };

  const setupButtons = () => {
    $('#resetButton').off('click');
    $('#nextLevelButton').off('click');
    $('#finishButton').off('click');
    $('#pickLevelButton').off('click');

    $('#executeButton').click(() => {
      runProgram();
    });
    $('#resetButton').click(() => {
      reloadMap('random-fast');
    });
    $('#nextLevelButton').click(() => {
      nextLevel();
    });
    $('#finishButton').click(() => {
      finish();
    });
    $('#pickLevelButton').click(() => {
      pickLevel();
    });
    $('#toggleHardModeButton').click(() => {
      toggleHardMode();
    });
    $('#resetCodeButton').click(() => {
      editor.setValue('');
    });

    if (hasFinished) {
      $('#pickLevelButton').show();
    }
  };

  const initializeBeforeMap = () => {
    editor = new Editor(editorWidth, editorHeight);
    setupButtons();
  };

  const insertComments = () => {
    editor.setValue('#\n' + comments.join('\n') + '\n#\n\n');
  };

  this.initializeAfterMap = ({newMap, drawStyle}) => {
    let {width, height} = map.getDimensions();

    display = new ROT.Display({
      width,
      height,
      forceSquareRatio: true,
      fontSize: 16,
    });

    $('#screen').append(display.getContainer());

    display.clear();
    switch (drawStyle) {
      case 'lines':
        drawLines();
        break;
      case 'random-fast':
        drawRandom(drawRandomFastTime);
        break;
      case 'random-slow':
        drawRandom(drawRandomSlowTime);
        break;
      case 'normal':
        draw();
        break;
      default:
        throw new Error('unknown draw style: ' + drawStyle);
    };

    if (newMap) {
      writeStatus(levelNum + '. ' + levelName, newLevelNameClearDelay);
      if (levelNum === 0) {
        const text = 'WELCOME, HASH';
        const x = (width - text.length) / 2;
        display.drawText(x, 1, text);
      }
      if (comments.length > 0) {
        insertComments();
      } else {
        editor.setValue('');
      }

    }

    const maxLevelAvailable = Math.max(0, debugMode ? levels.length - 1 : curBestLevel);
    $('#levelButtons').empty();
    for (let i=0; i<=maxLevelAvailable; i++) {
      const html = `<span><a id="level${i}Button" class="keys" title="L${i}">L${i}</a></span>`;
      $('#levelButtons').append($(html));
      $(`#level${i}Button`).click(() => {
        if (i === levelNum) return;
        $('#nextLevelButton').hide();
        reset();
        loadMapFromLevelNum(i);
        this.initializeAfterMap({newMap: true, drawStyle:'random-fast'});
      });
    }
    for (let i=0; i<levels.length; i++) {
      $(`#level${i}Button`).removeClass('highlight');
      if (i === levelNum) $(`#level${levelNum}Button`).addClass('highlight');
    }


    updateInfoPane();
    this.updateStackDisplay();
    playerCanMove = true;
    levelCompleted = false;

    if (debugMode) {
      enableKeyboardInput();
      display.getContainer().focus();
    } else {
      editor.focus();
    }
    refresh();
  };

  const updateExecutionStepsIndicator = () => {
    $('#steps').text(''+executionSteps);
  };

  this.incrementExecutionSteps = () => {
    executionSteps++;
    updateExecutionStepsIndicator();
  };

  const loadMap = (mapFunc, extraData) => {
    comments = [];
    executionSteps = 0;
    updateExecutionStepsIndicator();
    playerCanMove = false;
    origMapFunc = mapFunc;
    comments = mapFunc.comments || [];
    map = mapFunc(this, allFuncs, extraData);
  };

  const loadMapFromLevelNum = (index, extraData) => {
    if (curBestLevel < 6 && index < 6) {
      $('#toggleHardModeButton').hide();
    } else  {
      $('#toggleHardModeButton').show();
    }
    loadMap(levels[index], extraData);
    levelNum = index;
    $('#levelIndicator').text('Level ' + levelNum);
  };

  const reset = () => {
    playerCanMove = false;
    functions = {};
    stack = [];
    map = null;
    display = null;
    $('#screen').empty();
    this.updateStackDisplay();
  };
}
