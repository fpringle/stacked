const DIRECTIONS = {
  none: [0, 0],
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function Player(x, y, game) {
  this.x = x;
  this.y = y;
  this.game = game;
  this.symbol = '#';
  this.color = 'yellow';
  this.canMove = (direction) => {
    const [dx, dy] = DIRECTIONS[direction];
    const nx = this.x+dx;
    const ny = this.y+dy;
    if (nx < 0 || nx >= this.game.width || ny < 0 || ny >= this.game.height) return false;
    const nkey = nx + ',' + ny;
    return !this.game.map[nkey];
  }
  this.move = (direction) => {
    if (!this.canMove(direction)) return;
    const [dx, dy] = DIRECTIONS[direction];
    const nx = this.x+dx;
    const ny = this.y+dy;
    const nkey = nx + ',' + ny;
    const key = this.x + ',' + this.y;
    this.x = nx;
    this.y = ny;
    this.game.map[nkey] = this;
    this.game.map[key] = null;
  }
};

Player.prototype.getX = function() {
  return this.x;
};

Player.prototype.getY = function() {
  return this.y;
};

Player.prototype.getPos = function() {
  return {x: this.x, y: this.y};
};

function Game(height, width, availableFunctions) {
  this.stack = [];
  this.functions = {};
  this.display = null;
  this.height = height;
  this.width = width;
  player = null;
  this.map = {};
  let knownObjects = {
    block: {
      name: 'block',
      symbol: '@',
      color: null,
    },
  };

  this.placeObject = (x, y, name) => {
    const obj = knownObjects[name];
    if (!obj) throw new Error('No object with name ' + name);
    const key = x + ',' + y;
    this.map[key] = {...obj};
  };

  this.defineNewObject = (data) => {
    knownObjects[data.name] = {...data};
  };

  let canPlayerMove = false;

  this.defineNewFunction = (name, terms) => {
    this.functions[name] = {
      category: 'custom',
      description: `Function ${name} defined by user.`,
      syntax: name,
      minStackSize: 0,
      call: (stack, instructions, game) => {
        instructions.splice(0, 0, ...terms);
      },
    };
  };

  this.getCategories = () => {
    const categories = {};
    for (let [name, props] of Object.entries(this.functions)) {
      const category = props.category;
      if (!categories.hasOwnProperty(category)) categories[category] = [];
      categories[category].push([name, props.description]);
    }
    return categories;
  };

  this.updateInfoPane = () => {
    const categories = this.getCategories();
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

  this.getPlayer = () => player;

  this.setPlayer = (x, y) => {
    if (player) throw new Error('Player already set!');
    player = new Player(x, y, this);
    const key = x + ',' + y;
    this.map[key] = player;
  };

  this.clear = () => {
    for (let x=0; x<this.width; x++) {
      for (let y=0; y<this.height; y++) {
        this.display.draw(x, y, '');
      }
    }
  }

  this.movePlayer = (direction) => {
    if (player) {
      if (canPlayerMove) {
        player.move(direction);
        canPlayerMove = false;
        setTimeout(() => {
          canPlayerMove = true;
        }, 100);
        this.refresh();
      }
      else setTimeout(() => this.movePlayer(direction), 100);
    }
  };

  this.draw = () => {
    for (let x=0; x<this.width; x++) {
      for (let y=0; y<this.height; y++) {
        const key = x + ',' + y;
        let obj = this.map[key];
        if (obj) {
          this.display.draw(x, y, obj.symbol, obj.color);
        }
      }
    }
  };

  this.updateStackDisplay = () => {
    $('#result').text('[ ' + this.stack.join(', ') + ' ]');
  };

  this.refresh = () => {
    this.clear();
    this.draw();
  };

  const enableKeyboardInput = () => {
    $(this.display.getContainer()).attr("contentEditable", "true");
    this.display.getContainer().addEventListener('keydown', e => {
      switch (e.keyCode) {
        case 37:
          canPlayerMove = true;
          this.movePlayer('left');
          break;
        case 38:
          canPlayerMove = true;
          this.movePlayer('up');
          break;
        case 39:
          canPlayerMove = true;
          this.movePlayer('right');
          break;
        case 40:
          canPlayerMove = true;
          this.movePlayer('down');
          break;
      }
    });
  };

  this.initialize = function(debugMode) {
    for (let func of availableFunctions) this.functions[func] = coreFunctions[func];

    this.display = new ROT.Display({
      width: this.width,
      height: this.height,
      forceSquareRatio: true,
    });

    $('#screen').append(this.display.getContainer());

    this.draw();
    this.updateInfoPane();

    if (debugMode) enableKeyboardInput();
    this.display.getContainer().focus();
    canPlayerMove = true;
  };
}

Game.createFromGrid = ({
  grid,
  mapping,
  allFunctionsAvailable,
  availableFunctions,
  objects
}) => {
  const lines = grid.trim().split('\n');
  console.log(lines);
  const height = lines.length;
  const width = Math.max(...lines.map(line => line.length));
  let functions;
  if (allFunctionsAvailable) {
    functions = Object.keys(coreFunctions);
  } else if (availableFunctions) {
    functions = availableFunctions;
  }
  const game = new Game(height, width, functions);
  if (objects) {
    for (let obj of objects) {
      game.defineNewObject(obj);
    }
  }

  lines.forEach((line, y) => {
    for (let x=0; x<line.length; x++) {
      const char = line[x];
      if (char === ' ') continue;
      const obj = mapping[char];
      if (!obj) throw new Error('character not known in mapping: ' + char);

      if (obj === 'player') game.setPlayer(x, y);
      else game.placeObject(x, y, obj);
    }
  });

  return game;
};
