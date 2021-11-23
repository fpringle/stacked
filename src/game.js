const DIRECTIONS = {
  none: [0, 0],
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function Game({debug, hard, firstLevel}) {
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
  let refreshTimer;
  let hasFinished = false;
  const executionDelay = 75;
  const levelCompleteClearDelay = 2500;
  const showNextLevelButtonDelay = 500;
  const showFinishButtonDelay = 500;
  const editorWidth = 600;
  const editorHeight = 500;
  const drawRandomFastTime = 500;
  const drawRandomSlowTime = 1000;
  const newLevelNameClearDelay = 2500;
  const loadingLevelDelay = 750;
  const drawLineDelay = 100;
  const drawCharDelay = 20;

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

  this.ready = () => {
    setHardModeIndicator();
    initializeBeforeMap();
    if (debugMode) {
      for (let i=0; i<levels.length; i++) {
        const html = `<span><a id="level${i}Button" class="keys" title="Level ${i}">Level ${i}</a></span>`;
        $('#levelButtons').append($(html));
        $(`#level${i}Button`).click(() => {
          if (i === levelNum) return;
          reset();
          loadMapFromLevelNum(i);
          this.initializeAfterMap({newMap: true, drawStyle:'random-fast'});
        });
      }
    }
    reset;
    loadMapFromLevelNum(levelNum);
    this.initializeAfterMap({newMap: true, drawStyle:'random-slow'});
  };

  this.setLevelName = (name) => {
    levelName = name;
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

  const updateInfoPane = () => {
    const categories = getCategories();
    let html = '';
    for (let [category, funcs] of Object.entries(categories)) {
      let sublist = funcs.map(([name, desc]) => {
        return `<li><span>${name}:</span><span>${desc}</span></li>`;
      }).join('');
      sublist = `${category}:<li><ul id="category-${category}">${sublist}</ul></li>`;
      html += sublist;
    }
    $('#command-categories').html(html);
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
    const player = map.getPlayer();
    const {x, y} = player.getXY();
    const symbol = player.getSymbol ? player.getSymbol() : null;
    const color = player.getColor ? player.getColor() : null;
    const bgcolor = player.getBackgroundColor ? player.getBackgroundColor() : null;
    chars.push([x, y, symbol, color, bgcolor]);
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
    const padding = 2;
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

  const updateStackDisplay = () => {
    $('#result').text('[ ' + stack.join(', ') + ' ]');
  };

  const refresh = () => {
    display.clear();
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
    if (hardMode) {
      reset();
      loadMap(origMapFunc);
      this.initializeAfterMap({newMap: false, drawStyle:'normal'});
    }

    playerCanMove = true;
    const instructions = editor.getInstructions();
    const gen = interpret(this, instructions, stack, functions, debugMode);
    const execOne = () => {
      if (levelCompleted) return;
      const next = gen.next();
      updateStackDisplay();
      if (next.done) return;
      setTimeout(execOne, executionDelay);
    };
    execOne();
  }

  this.loadFunctions = (availableFunctions) => {
    functions = {};
    for (let func of availableFunctions) functions[func] = coreFunctions[func];
  };

  this.endLevel = () => {
    // check player is at exit

    const {x, y} = map.getPlayer().getXY();
    const obj = map.getObjectAt(x, y);
    if (!obj || obj.name !== 'exit') {
      console.log('something\'s gone wrong (or someone\'s trying to cheat!) - ' +
                  'Game.endLevel() was called but player isn\'t at the exit. Hmm....');
      return;
    }

    playerCanMove = false;
    levelCompleted = true;
    writeStatus(`Level ${levelNum} completed!`, levelCompleteClearDelay);
    if (levelNum + 1 < levels.length) {
      setTimeout(() => {
        $('#nextLevelButton').show();
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
    reset();
    loadMapFromLevelNum(levelNum+1);
    this.initializeAfterMap({newMap: true, drawStyle: 'random-slow'});
  };

  const finish = () => {
    writeStatus('Thanks for playing!');
    $('#pickLevelButton').show();
    $('#finishButton').hide();
  };

  const pickLevel = () => {
    reset();
    const oldHardMode = hardMode;
    hardMode = false;
    $('#resetButton').off('click');
    $('#resetButton').click(() => {
      pickLevel();
    });
    $('#pickLevelButton').hide();

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
    this.levelNum = -1;
    this.initializeAfterMap({newMap: false, drawStyle: 'lines'});
    enableKeyboardInput();
    playerCanMove = true;
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
      reset();
      loadMap(origMapFunc);
      this.initializeAfterMap({newMap: false, drawStyle: 'random-fast'});
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

    if (hasFinished) {
      $('#pickLevelButton').show();
    }
  };

  const initializeBeforeMap = () => {
    editor = new Editor(editorWidth, editorHeight);
    setupButtons();
  };

  this.initializeAfterMap = ({newMap, drawStyle}) => {
    let {width, height} = map.getDimensions();

    display = new ROT.Display({
      width,
      height,
      forceSquareRatio: true,
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
      writeStatus(levelName, newLevelNameClearDelay);
    }

    updateInfoPane();
    updateStackDisplay();
    playerCanMove = true;
    levelCompleted = false;

    if (debugMode) enableKeyboardInput();
    display.getContainer().focus();
  };

  const loadMap = (mapFunc, extraData) => {
    origMapFunc = mapFunc;
    map = mapFunc(this, debugMode, extraData);
  };

  const loadMapFromLevelNum = (index, extraData) => {
    loadMap(levels[index], extraData);
    levelNum = index;
  };

  const reset = () => {
    playerCanMove = false;
    functions = {};
    stack = [];
    map = null;
    display = null;
    $('#screen').empty();
    updateStackDisplay();
  };
}
