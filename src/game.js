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
  this.getSymbol = () => '#';
  this.getColor = () => 'yellow';
  this.canMove = (direction) => {
    const [dx, dy] = DIRECTIONS[direction];
    const nx = this.x+dx;
    const ny = this.y+dy;
    if (nx < 0 || nx >= this.game.width || ny < 0 || ny >= this.game.height) return false;
    const nkey = nx + ',' + ny;
    return this.game.map[nkey] === 'empty';
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
    this.game.map[nkey] = 'player';
    this.game.map[key] = 'empty';
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
  this.functions = {};
  this.display = null;
  this.height = height;
  this.width = width;
  player = null;
  this.map = {};

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
    this.map[key] = 'player';
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
        let obj;
        if (this.map[key] === 'player') {
          obj = this.getPlayer();
        } else if (this.map[key] === 'block') {
          obj = {getSymbol: () => '@'};
        }
        if (obj) {
          this.display.draw(x, y, obj.getSymbol(), obj.getColor ? obj.getColor() : null);
        }
      }
    }
  };

  this.refresh = () => {
    this.clear();
    this.draw();
  };

  this.placeObject = (x, y, obj) => {
    this.map[x + ',' + y] = obj;
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
/*
    for (let x=0; x<this.width; x++) {
      for (let y=0; y<this.height; y++) {
        this.map[x+','+y] = 'empty';
      }
    }
*/

    for (let x=0; x<this.width; x++) {
      for (let y=0; y<this.height; y++) {
        if (x === 0 || y === 0 || x === this.width-1 || y === this.width-1) {
          this.placeObject(x, y, 'block');
        } else {
          this.placeObject(x, y, 'empty');
        }
      }
    }

    this.setPlayer(10, 10);
    this.draw();
    this.updateInfoPane();

    if (debugMode) enableKeyboardInput();
    this.display.getContainer().focus();
    canPlayerMove = true;
  };
}

