function Player(_x, _y, _map) {
  let x = _x;
  let y = _y;
  let map = _map;
  let symbol = '#';
  let color = 'yellow';

  this.getSymbol = () => {
    return symbol;
  };

  this.getColor = () => {
    return color;
  };

  this.canMove = (direction) => {
    return map.canPlayerMove(direction);
  }
  this.move = (direction) => {
    if (!this.canMove(direction)) return;
    const [dx, dy] = DIRECTIONS[direction];
    x += dx;
    y += dy;
  }
  this.getXY = () => {
    return {x, y};
  }
}
