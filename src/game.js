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
  let origLevel;
  let playerCanMove;
  let drawTime;
  let levelCompleted = false;
  let levelName;
  let hardMode = hard;   // in hard mode, each program run starts with a fresh map
  let levelNum = firstLevel || 0;
  let refreshTimer;
  let hasFinished = false;

  this.ready = () => {
    this.loadMap(levels[levelNum]);
    this.initializeAfterMap({newMap: true, fadeIn: true});
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
    for (let x=0; x<width; x++) {
      for (let y=0; y<height; y++) {
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

  const drawFirst = () => {
    const chars = getCharsToDraw();
    console.log(chars.length);
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
      this.loadMap(origLevel);
      this.initializeAfterMap({newMap: false, fadeIn: false});
    }

    playerCanMove = true;
    const instructions = editor.getInstructions();
    const gen = interpret(this, instructions, stack, functions, debugMode);
    const delay = 75;
    const execOne = () => {
      if (levelCompleted) return;
      const next = gen.next();
      updateStackDisplay();
      console.log(next);
      if (next.done) return;
      setTimeout(execOne, delay);
    };
    execOne();
  }

  this.loadFunctions = (availableFunctions) => {
    functions = {};
    for (let func of availableFunctions) functions[func] = coreFunctions[func];
  };

  this.endLevel = () => {
    playerCanMove = false;
    levelCompleted = true;
    console.log('Congrats');
    writeStatus('Level completed!', 2500);
    if (levelNum + 1 < levels.length) {
      setTimeout(() => {
        $('#nextLevelButton').show();
      }, 500);
    } else if (!hasFinished) {
      hasFinished = true;
      setTimeout(() => {
        $('#finishButton').show();
      }, 500);
    }
  };

  const nextLevel = () => {
    $('#nextLevelButton').hide();
    reset();
    levelNum++;
    this.loadMap(levels[levelNum]);
    this.initializeAfterMap({newMap: true, fadeIn: true});
  };

  const finish = () => {
    writeStatus('Thanks for playing!');
    $('#pickLevelButton').show();
    $('#finishButton').hide();
  };

  const pickLevel = () => {
    functions = {...coreFunctions};
    $('#resetButton').off('click');
    $('#resetButton').click(() => {
      pickLevel();
    });
    $('#pickLevelButton').hide();
    const {height, width} = map.getDimensions();
    map = new Map(this, width, height);
    const numLevels = levels.length;
    paddingLines = Math.floor((height - numLevels) / (numLevels + 1));
    const lineDelay = 200;
    const charDelay = 20;

    for (let idx=0; idx<levels.length; idx++) {
      map.defineNewObject({
        name: 'level' + idx,
        getSymbol: () => 'O',
        getColor: () => 'cyan',
        passable: () => true,
        onCollision: () => {
          levelNum = idx;
          disableKeyboardInput();
          reset();
          setupButtons();
          this.loadMap(levels[idx]);
          this.initializeAfterMap({newMap: true, fadeIn: true});
        },
      });
    }

    const linesToDraw = levels.map((level, index) => {
      const lineNum = paddingLines + index * (paddingLines + 1);
      map.placeObject(5, lineNum, 'level' + index);
      return [level.levelName, lineNum];
    });

    map.setPlayer(2, 2);
    refresh();

    const drawLineFade = (text, lineNum) => {
      const chars = text.split('');
      let column = 10;
      const drawChar = () => {
        if (chars.length === 0) return;
        const char = chars.shift();
        map.defineNewObject({
          name: char,
          getSymbol: () => char,
          passable: () => true,
        }),
        map.placeObject(column, lineNum, char);
        refresh();
        column++;
        setTimeout(drawChar, charDelay);
      };

      drawChar();
    };

    const drawLine = () => {
      if (linesToDraw.length === 0) {
        enableKeyboardInput();
        return;
      }
      const [text, lineNum] = linesToDraw.shift();
      drawLineFade(text, lineNum);
      setTimeout(drawLine, lineDelay);
    };
    drawLine();
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
      this.loadMap(origLevel);
      this.initializeAfterMap({newMap: false, fadeIn: true});
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

    if (hasFinished) {
      $('#pickLevelButton').show();
    }
  };

  this.initializeBeforeMap = () => {
    editor = new Editor(600, 500);
    setupButtons();
  };

  this.initializeAfterMap = ({newMap=true, fadeIn=false}) => {
    let {width, height} = map.getDimensions();

    display = new ROT.Display({
      width,
      height,
      forceSquareRatio: true,
    });

    $('#screen').append(display.getContainer());

    if (newMap) {
      drawTime = 1000;
    }
    else drawTime = 500;

    display.clear();
    if (fadeIn) {
      drawFirst();
    } else {
      draw();
    }

    if (newMap) {
      writeStatus(levelName, 2500);
    }

    updateInfoPane();
    updateStackDisplay();
    playerCanMove = false;
    levelCompleted = false;

    if (debugMode) enableKeyboardInput();
    display.getContainer().focus();
  };

  this.loadMap = (level) => {
    origLevel = level;
    map = Map.createFromGrid(this, level, debugMode);
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
