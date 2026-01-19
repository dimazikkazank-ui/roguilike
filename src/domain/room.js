import { getRandomInt } from "./utils.js";
import {
  ROOM_MIN_HEIGHT,
  ROOM_MAX_HEIGHT,
  ROOM_MIN_WIDTH,
  ROOM_MAX_WIDTH,
  ROOM_BORDER_SIZE,
  ROOM_PADDING,
  ROOM_SYMBOL_FLOOR,
  ROOM_SYMBOL_WALL,
  ROOM_SYMBOL_DOOR,
  ROOM_HORIZONTAL_NEIGHBOR_OFFSET,
  ROOM_VERTICAL_NEIGHBOR_OFFSET,
} from "./constants.js";

export class Room {
  constructor(id, x, y) {
    this._id = id; // 0 1 2 ... (like in number dial)
    this._height = getRandomInt(ROOM_MIN_HEIGHT, ROOM_MAX_HEIGHT);
    this._width = getRandomInt(ROOM_MIN_WIDTH, ROOM_MAX_WIDTH);
    this._state = this._createMatrix();
    this._connections = []; // ids of connected rooms
    this._passwayCoords = {}; // Dictionary
    this._items = {}; // Stores items at their coordinates {`row,col`: item}
    this._enemies = {}; //like in _items
    this._hasBeenVisited = false;
  }

  markAsVisited() {
    this._hasBeenVisited = true;
  }

  addItem(row, col, item) {
    this._items[`${row},${col}`] = item;
  }

  getItem(row, col) {
    return this._items[`${row},${col}`];
  }

  addEnemy(row, col, enemy) {
    this._enemies[`${row},${col}`] = enemy;
  }

  getEnemy(row, col) {
    return this._enemies[`${row},${col}`];
  }

  removeItem(row, col) {
    const item = this._items[`${row},${col}`];
    delete this._items[`${row},${col}`];
    return item;
  }

  get id() {
    return this._id;
  }

  get state() {
    return this._state;
  }

  get height() {
    return this._height;
  }

  get width() {
    return this._width;
  }

  get connections() {
    return this._connections;
  }

  get isVisited() {
    return this._hasBeenVisited;
  }

  addConnection(roomId) {
    this._connections.push(roomId);
  }

  setState(row, col, value) {
    if (
      row >= 0 &&
      row < this._height + ROOM_BORDER_SIZE &&
      col >= 0 &&
      col < this._width + ROOM_BORDER_SIZE
    ) {
      this._state[row][col] = value;
    }
  }

  _createMatrix() {
    let matrix = Array.from({ length: this._height + ROOM_BORDER_SIZE }, () =>
      new Array(this._width + ROOM_BORDER_SIZE).fill(ROOM_SYMBOL_WALL)
    );
    for (let y = ROOM_PADDING; y < this._height + ROOM_PADDING; y++) {
      for (let x = ROOM_PADDING; x < this._width + ROOM_PADDING; x++) {
        matrix[y][x] = ROOM_SYMBOL_FLOOR;
      }
    }

    return matrix;
  }

  addCorridor() {
    for (let connectedRoom of this._connections) {
      const pass = this._passwayCoords[connectedRoom];
      if (!pass) continue;

      const row = pass.row;
      const col = pass.col;

      // сосед справа: у текущей комнаты правый коридор
      if (connectedRoom - this._id === ROOM_HORIZONTAL_NEIGHBOR_OFFSET) {
        this._state[row][this._width + ROOM_PADDING] = ROOM_SYMBOL_DOOR; // дверь в стене
        this._state[row][this._width + ROOM_BORDER_SIZE - 1] = ROOM_SYMBOL_FLOOR; // коридор (точка pass.col)
      }
      // сосед слева
      else if (connectedRoom - this._id === -ROOM_HORIZONTAL_NEIGHBOR_OFFSET) {
        this._state[row][0] = ROOM_SYMBOL_FLOOR; // коридор (pass.col = 0)
        this._state[row][1] = ROOM_SYMBOL_DOOR; // дверь
      }
      // сосед снизу
      else if (connectedRoom - this._id === ROOM_VERTICAL_NEIGHBOR_OFFSET) {
        this._state[this._height + ROOM_PADDING][col] = ROOM_SYMBOL_DOOR; // дверь
        this._state[this._height + ROOM_BORDER_SIZE - 1][col] = ROOM_SYMBOL_FLOOR; // коридор
      }
      // сосед сверху
      else if (connectedRoom - this._id === -ROOM_VERTICAL_NEIGHBOR_OFFSET) {
        this._state[0][col] = ROOM_SYMBOL_FLOOR; // коридор
        this._state[1][col] = ROOM_SYMBOL_DOOR; // дверь
      }
    }
  }

  getRandomEmptyCell() {
    let row, col;
    do {
      row = getRandomInt(ROOM_PADDING, this.height - 1);
      col = getRandomInt(ROOM_PADDING, this.width - 1);
    } while (this.state[row][col] !== ROOM_SYMBOL_FLOOR);
    return { row, col };
  }

  getEnemy(row, col) {
    return this._enemies[`${row},${col}`];
  }

  renderMatrixWithBorders(isCurrentLocation) {
    const height = this._height + ROOM_BORDER_SIZE;
    const width = this._width + ROOM_BORDER_SIZE;

    const bordered = Array.from({ length: height }, (_, r) =>
      Array.from({ length: width }, (_, c) => {
        // углы
        if ((r === 0 || r === height - 1) && (c === 0 || c === width - 1)) {
          return "+";
        }
        // верх/низ
        if ((r === 0 || r === height - 1) && this._state[r][c] === ROOM_SYMBOL_WALL)
          return "-";
        // лево/право
        if ((c === 0 || c === width - 1) && this._state[r][c] === ROOM_SYMBOL_WALL)
          return "|";

        // иначе — существующая ячейка комнаты
        // защита: если state не определён — вернуть пробел
        if (
          isCurrentLocation &&
          this._state &&
          this._state[r] &&
          typeof this._state[r][c] !== "undefined"
        )
          return this._state[r][c];
        return " ";
      })
    );

    return bordered.map((row) => row.join("")).join("\n");
  }

  renderMatrix() {
    return this._state.map((row) => row.join("")).join("\n");
  }

  toJSON() {
    return {
      id: this._id,
      height: this._height,
      width: this._width,
      state: this._state,
      isVisited: this._hasBeenVisited,
      connections: this._connections,
      passwayCoords: this._passwayCoords,
      items: Object.keys(this._items).map((k) => {
        const [row, col] = k.split(",").map((n) => parseInt(n, 10));
        const item = this._items[k];
        const payload = { type: item.type, name: item.name };
        if (item.type === "food") payload.toRegen = item.toRegen;
        if (item.type === "elixir") payload.stat = item.stat, payload.increase = item.increase, payload.duration = item.duration;
        if (item.type === "scroll") payload.stat = item.stat, payload.increase = item.increase;
        if (item.type === "weapon") payload.strength = item.strength;
        if (item.type === "treasure") payload.value = item.value;
        return { row, col, item: payload };
      }),
      enemies: Object.keys(this._enemies).map((k) => {
        const [row, col] = k.split(",").map((n) => parseInt(n, 10));
        const e = this._enemies[k];
        return {
          id: e._id,
          row,
          col,
          symbol: e._symbol,
          health: e.health,
          maxHealth: e.maxHealth,
          strength: e.strength,
          agility: e.agility,
          hostility: e.hostility,
        };
      }),
    };
  }
}
