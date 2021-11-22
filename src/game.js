const DIRECTIONS = {
  none: [0, 0],
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function Game(debug) {
  let debugMode = debug;
  let stack = [];
  let functions = {};
  let display = null;
  let map = null;
  let editor = null;

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


  const draw = () => {
    const {width, height} = map.getDimensions();
    for (let x=0; x<width; x++) {
      for (let y=0; y<height; y++) {
        let obj = map.getObjectAt(x, y);
        if (obj) {
          const symbol = obj.getSymbol ? obj.getSymbol() : null;
          const color = obj.getColor ? obj.getColor() : null;
          const bgcolor = obj.getBackgroundColor ? obj.getBackgroundColor() : null;
          display.draw(x, y, symbol, color, bgcolor);
        }
      }
    }

    const player = map.getPlayer();
    const {x, y} = player.getXY();
    const symbol = player.getSymbol ? player.getSymbol() : null;
    const color = player.getColor ? player.getColor() : null;
    const bgcolor = player.getBackgroundColor ? player.getBackgroundColor() : null;
    console.log(x, y, symbol, color, bgcolor);
    display.draw(x, y, symbol, color, bgcolor);
  };

  this.movePlayer = function(direction) {
    map.movePlayer(direction);
    refresh();
  }

  const updateStackDisplay = () => {
    $('#result').text('[ ' + stack.join(', ') + ' ]');
  };

  const refresh = () => {
    display.clear();
    draw();
  };

  const enableKeyboardInput = () => {
    $(display.getContainer()).attr("contentEditable", "true");
    display.getContainer().addEventListener('keydown', e => {
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
    });
  };

  const runProgram = () => {
    const instructions = editor.getInstructions();
    interpret(this, instructions, stack, functions, debugMode);
  }

  this.loadFunctions = (availableFunctions) => {
    functions = {};
    for (let func of availableFunctions) functions[func] = coreFunctions[func];
  };

  this.initialize = () => {
    editor = new Editor(600, 500);

    $('#executeButton').click(() => {
      runProgram();
      updateStackDisplay(stack);
    });

    let {width, height} = map.getDimensions();

    display = new ROT.Display({
      width,
      height,
      forceSquareRatio: true,
    });

    $('#screen').append(display.getContainer());

    refresh();
    updateInfoPane();

    if (debugMode) enableKeyboardInput();
    display.getContainer().focus();
  };

  this.loadMap = (_map) => {
    map = _map;
  };
}
