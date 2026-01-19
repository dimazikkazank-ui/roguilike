import {
  ITEM_SYMBOLS,
  ROOM_SYMBOL_FLOOR,
  ROOM_SYMBOL_DOOR,
  ROOM_SYMBOL_WALL,
  HIT_CHANCE_BASE_CHECK,
  HIT_CHANCE_AGILITY_MODIFIER,
  ENEMY_SYMBOL_OGRE,
} from "./constants.js";

export class Character {
  constructor(row, col, location, gameSession) {
    this._location = location;
    this._locationId = location ? location.id : null;
    this._pos = { row: row, col: col };
    this._symbol = "C";
    this._gameSession = gameSession;
  }

  get position() {
    return this._pos;
  }

  setLocation(location) {
    this._location = location;
    this._locationId = location ? location.id : null;
  }

  get locationId() {
    return this._locationId;
  }

  getLocation() {
    if (this._location) return this._location;
    if (this._gameSession && this._locationId != null) {
      const room = this._gameSession.getRoomById(this._locationId);
      if (room) {
        this._location = room;
        return room;
      }
    }
    return null;
  }

  onMove(direction) {
    const oldRow = this._pos.row;
    const oldCol = this._pos.col;
    let newRow = oldRow;
    let newCol = oldCol;

    if (direction === "up") newRow--;
    if (direction === "down") newRow++;
    if (direction === "left") newCol--;
    if (direction === "right") newCol++;

    const move = (symbol) => {
      this._location.setState(oldRow, oldCol, ROOM_SYMBOL_FLOOR);
      this._location.setState(newRow, newCol, symbol);
      this._pos.row = newRow;
      this._pos.col = newCol;
    };

    // Check if new position is within bounds of current location
    if (
      newRow >= 0 &&
      newRow < this._location.height + 4 &&
      newCol >= 0 &&
      newCol < this._location.width + 4
    ) {
      const targetCell = this._location.state[newRow][newCol];
      if (targetCell === ROOM_SYMBOL_DOOR) {
        if (direction === "up") newRow--;
        if (direction === "down") newRow++;
        if (direction === "left") newCol--;
        if (direction === "right") newCol++;
        move(this._symbol);
        return { action: "moved" };
      } else if (
        targetCell === ROOM_SYMBOL_WALL ||
        ITEM_SYMBOLS.includes(targetCell)
      ) {
        // Do not move
        return { action: "wall" };
      } else if (targetCell === ROOM_SYMBOL_FLOOR) {
        move(this._symbol);
        return { action: "moved" };
      }
    }
    return { action: "boundary", newPos: { row: newRow, col: newCol } };
  }

  checkHit(attaking, defending) {
    const chance = HIT_CHANCE_BASE_CHECK + (attaking.agility - defending.agility - 50) * HIT_CHANCE_AGILITY_MODIFIER;
    const roll = Math.floor(Math.random() * 100);
    if (attaking._symbol == ENEMY_SYMBOL_OGRE) return true;
    return roll < chance;
  }
}
