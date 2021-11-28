const defaultWidth = 35;
const defaultHeight = 34;

const randColor = (function() {
  let hue = 0; //Math.random();
  const psi = 0.618033988749895;
  const saturation = 0.5;
  const value = 0.95;
  return () => {
    hue = (hue + psi) % 1;
    const h = Math.floor(6 * hue);
    const f = 6 * hue - h;
    const p = value * (1 - saturation);
    const q = value * (1 - f * saturation);
    const t = value * (1 - (1 - f) * saturation);
    const rgb = [
      [value, t, p],
      [q, value, p],
      [p, value, t],
      [p, q, value],
      [t, p, value],
      [value, p, q],
    ][h].map(x => Math.floor(x * 0xFF));
    return '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('');
  };
})();

function Map(_game, width, height) {
  let game = _game;
  let player = null;
  let map = [];
  for (let row=0; row<height; row++) {
    map.push(Array(width));
  }

  const removeObjectAt = (x, y) => {
    if (!map[y][x]) throw new Error(`tried to call removeObjectAt bu there is no object at (${x},${y})`);
    map[y][x] = null;
  };

  this.getDimensions = () => ({width, height});

  let knownObjects = {
    block: {
      name: 'block',
      getSymbol: () => '@',
    },
    exit: {
      name: 'exit',
      getSymbol: () => 'o',
      getColor: () => 'cyan',
      passable: () => true,
      onCollision: () => game.endLevel(),
    },
    spike: {
      name: 'spike',
      getSymbol: () => 'x',
      getColor: () => 'red',
      passable: () => true,
      onCollision: () => game.killPlayer(),
    },
  };
  for (let num=0; num<10; num++) {
    const name = 'push' + num;
    const color = randColor();
    knownObjects[name] = {
      name,
      getSymbol: () => ''+num,
      getColor: () => '#4d94ff',
      passable: () => true,
      onCollision: (me) => {
        game.pushToStack(num);
        removeObjectAt(me.x, me.y);
      },
    };
  };

  this.getObjectAt = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 'outside';
    return map[y][x];
  };

  this.placeObject = (x, y, name) => {
    const obj = knownObjects[name];
    if (!obj) throw new Error('No object with name ' + name);
    map[y][x] = {...obj};
  };

  this.defineNewObject = (data) => {
    knownObjects[data.name] = {...data};
  };

  this.getPlayer = () => {
    if (player) return player;
    throw new Error('player hasn\'t been set yet');
  };

  this.setPlayer = function(x, y) {
    if (player) throw new Error('player already set');
    player = new Player(x, y, this);
    //this.map[y][x] = player;
  }

  this.movePlayer = (direction) => {
    if (player) {
      player.move(direction);
    }
  };

  this.canPlayerMove = (direction) => {
    const [dx, dy] = DIRECTIONS[direction];
    const {x, y} = player.getXY();
    const nx = x+dx;
    const ny = y+dy;
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false;
    const obj = map[ny][nx];
    if (!obj) return true;
    else if (obj.passable && obj.passable(player)) return true;
    return false;
  }
}

Map.createFromGrid = (game, {
  height,
  width,
  levelName,
  grid,
  mapping,
  allFunctionsAvailable,
  availableFunctions,
  additionalFunctions,
  objects
}, debug) => {
  const lines = grid.trim().split('\n');
  const gheight = lines.length;
  const gwidth = Math.max(...lines.map(line => line.length));
  let functions = [];
  if (allFunctionsAvailable || debug) {
    functions = Object.keys(coreFunctions);
  } else if (availableFunctions) {
    functions = availableFunctions;
  }

  height = height || defaultHeight;
  width = width || defaultWidth;

  let paddingTop = 0;
  let paddingLeft = 0;

  if (height) {
    const paddingVertical = Math.max(height - gheight);
    paddingTop = Math.floor(paddingVertical / 2);
  } else {
    height = gheight;
  }
  if (width) {
    const paddingHorizontal = Math.max(width - gwidth);
    paddingLeft = Math.floor(paddingHorizontal / 2);
  } else {
    width = gwidth;
  }

  game.loadFunctions(functions);
  if (additionalFunctions) game.loadAdditionalFunctions(additionalFunctions);
  game.setLevelName(levelName);

  const map = new Map(game, width, height);
  if (objects) {
    for (let obj of objects) {
      map.defineNewObject(obj);
    }
  }

  lines.forEach((line, y) => {
    for (let x=0; x<line.length; x++) {
      const char = line[x];
      if (char === ' ') continue;
      const obj = mapping[char];
      if (!obj) throw new Error('character not known in mapping: ' + char);

      if (obj === 'player') map.setPlayer(paddingLeft+x, paddingTop+y);
      else map.placeObject(paddingLeft+x, paddingTop+y, obj);
    }
  });

  return map;
};
