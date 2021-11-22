function Map(game, width, height) {

  let player = null;
  let map = [];
  for (let row=0; row<height; row++) {
    map.push(Array(width));
  }

  this.getDimensions = () => ({width, height});

  let knownObjects = {
    block: {
      name: 'block',
      getSymbol: () => '@',
    },
  };

  this.getObjectAt = (x, y) => {
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
    return map[ny][nx] == null;
  }
}

Map.createFromGrid = (game, {
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

  game.loadFunctions(functions);

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

      if (obj === 'player') map.setPlayer(x, y);
      else map.placeObject(x, y, obj);
    }
  });

  return map;
};
