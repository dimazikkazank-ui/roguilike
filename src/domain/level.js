import { Room } from "./room.js";
import { Enemy } from "./enemy.js";
import {
  Food,
  Elixir,
  Scroll,
  Weapon,
  Treasure,
  ItemTypes,
  statTypes,
} from "./entities/entities.js";
import { getRandomInt } from "./utils.js";
import {
  LEVEL_COUNT,
  ITEM_SPAWN_BASE_SKIP_CHANCE,
  MAX_SKIP_CHANCE,
  MIN_ITEMS_PER_ROOM,
  MAX_ITEMS_PER_ROOM,
  FOOD_REGEN_MAX_PERCENT,
  AGILITY_INCREASE_MAX_PERCENT,
  STRENGTH_INCREASE_MAX_PERCENT,
  MIN_ENEMIES_PER_ROOM,
  MAX_ENEMIES_PER_ROOM,
  ENEMY_COUNT_BASE,
  ENEMY_COUNT_DEPTH_MULTIPLIER,
  EASY_MODE_ENEMY_REDUCTION,
  HARD_MODE_ENEMY_ADDITION,
  WEAPON_COUNT,
  WEAPON_STRENGTH_MIN,
  WEAPON_STRENGTH_MAX,
  ELIXIR_SCROLL_DURATION_MIN,
  ELIXIR_SCROLL_DURATION_MAX,
  STAT_TYPES_COUNT,
  ENEMY_SYMBOLS,
  ITEM_SYMBOLS,
  ROOM_SYMBOL_FLOOR,
  ROOM_PADDING,
  ROOM_SYMBOL_EXIT,
  ITEM_SYMBOL_FOOD,
  ITEM_SYMBOL_ELIXIR,
  ITEM_SYMBOL_SCROLL,
  ITEM_SYMBOL_WEAPON,
  ITEM_SYMBOL_TREASURE,
  ROOM_GRID_ROWS,
  ROOM_GRID_COLS,
  MAX_ROOMS_IN_LEVEL,
  ROOM_HORIZONTAL_NEIGHBOR_OFFSET,
  ROOM_VERTICAL_NEIGHBOR_OFFSET,
  ROOM_BORDER_SIZE,
} from "./constants.js";

export class Level {
  constructor(
    gameSession,
    levelNumber = 1,
    easyMode = false,
    hardMode = false,
    modifiers = null
  ) {
    this._levelNumber = levelNumber;
    this._easyMode = easyMode;
    this._hardMode = hardMode;
    this._modifiers = modifiers; // { enemyStatMultiplier, spawnCountModifier, itemSpawnModifier }
    this._rooms = [];
    this.addRooms(gameSession);
    this.placeExit();
    this._corridors = [];
    this._currentLocation = null;
    this._corridorCounter = 0;
    this._levelGrid = [];
    this._gridWidth = ROOM_GRID_COLS + 2;
    this._gridHeight = ROOM_GRID_ROWS + 2;
    this._gameSession = gameSession;

    for (let i = 0; i < this._gridHeight; i++) {
      this._levelGrid.push(Array(this._gridWidth).fill(" "));
    }
  }

  addRooms(gameSession) {
    for (let i = 1; i <= MAX_ROOMS_IN_LEVEL; i++) {
      const room = new Room(i);
      this._rooms.push(room);
      if (i !== 1) {
        this.populateRoomWithEnemies(room, gameSession);
      }
    }
    this._rooms[0].markAsVisited();
  }

  placeExit() {
    const exitRoomId = getRandomInt(2, MAX_ROOMS_IN_LEVEL);
    const room = this.getRoom(exitRoomId);
    let row, col;
    do {
      row = getRandomInt(ROOM_PADDING, room.height - 1);
      col = getRandomInt(ROOM_PADDING, room.width - 1);
    } while (room.state[row][col] !== ROOM_SYMBOL_FLOOR);
    room.setState(row, col, ROOM_SYMBOL_EXIT);
  }

  populateRoomWithItems(room, player) {
    const depthFactor = this._levelNumber / LEVEL_COUNT;
    const baseSkipChance = depthFactor * ITEM_SPAWN_BASE_SKIP_CHANCE; // 0%→50% пропуск предметов
    const itemSpawnModifier =
      this._modifiers && this._modifiers.itemSpawnModifier
        ? this._modifiers.itemSpawnModifier
        : 1;
    const skipChance = Math.min(
      MAX_SKIP_CHANCE,
      baseSkipChance * (1 / itemSpawnModifier)
    ); // higher itemSpawnModifier -> fewer skips
    let numItems = getRandomInt(MIN_ITEMS_PER_ROOM, MAX_ITEMS_PER_ROOM); // 1-3 предмета на комнату
    // scale number of items by itemSpawnModifier
    numItems = Math.max(0, Math.round(numItems * itemSpawnModifier));
    const maxFoodRegen = Math.max(
      1,
      Math.floor((player.maxHealth * FOOD_REGEN_MAX_PERCENT) / 100)
    ); // MAX_PERCENT_FOOD_REGEN_FROM_HEALTH
    const maxAgilityInc = Math.max(
      1,
      Math.floor((player.agility * AGILITY_INCREASE_MAX_PERCENT) / 100)
    ); // MAX_PERCENT_AGILITY_INCREASE
    const maxStrengthInc = Math.max(
      1,
      Math.floor((player.strength * STRENGTH_INCREASE_MAX_PERCENT) / 100)
    ); // MAX_PERCENT_STRENGTH_INCREASE

    for (let i = 0; i < numItems; i++) {
      if (Math.random() < skipChance) continue;
      const itemType = getRandomInt(0, STAT_TYPES_COUNT + 1); // 0: food, 1: elixir, 2: scroll, 3: weapon
      let itemRow, itemCol;
      do {
        itemRow = getRandomInt(ROOM_PADDING, room.height - 1);
        itemCol = getRandomInt(ROOM_PADDING, room.width - 1);
      } while (room.state[itemRow][itemCol] !== ROOM_SYMBOL_FLOOR);

      let item, symbol;
      switch (itemType) {
        case 0:
          const foodType = getRandomInt(0, 4);
          const regen = getRandomInt(1, maxFoodRegen + 1);
          switch (foodType) {
            case 0:
              item = new Food("Яблоко", regen);
              break;
            case 1:
              item = new Food("Мясо", regen);
              break;
            case 2:
              item = new Food("Рыба", regen);
              break;
            case 3:
              item = new Food("Пирог", regen);
              break;
          }
          symbol = ITEM_SYMBOL_FOOD;
          break;

        case 1:
          const elixirStat = getRandomInt(0, STAT_TYPES_COUNT);
          if (elixirStat === 0) {
            const regen = getRandomInt(1, maxFoodRegen + 1);
            item = new Elixir(
              "Эликсир здоровья",
              statTypes.HEALTH,
              regen,
              getRandomInt(
                ELIXIR_SCROLL_DURATION_MIN,
                ELIXIR_SCROLL_DURATION_MAX
              )
            );
          } else if (elixirStat === 1) {
            const incAgil = getRandomInt(1, maxAgilityInc + 1);
            item = new Elixir(
              "Эликсир ловкости",
              statTypes.AGILITY,
              incAgil,
              getRandomInt(
                ELIXIR_SCROLL_DURATION_MIN,
                ELIXIR_SCROLL_DURATION_MAX
              )
            );
          } else {
            const incStrength = getRandomInt(1, maxStrengthInc + 1);
            item = new Elixir(
              "Эликсир силы",
              statTypes.STRENGTH,
              incStrength,
              getRandomInt(
                ELIXIR_SCROLL_DURATION_MIN,
                ELIXIR_SCROLL_DURATION_MAX
              )
            );
          }
          symbol = ITEM_SYMBOL_ELIXIR;
          break;

        case 2:
          const scrollStat = getRandomInt(0, STAT_TYPES_COUNT);
          if (scrollStat === 0) {
            const regen = getRandomInt(1, maxFoodRegen + 1);
            item = new Scroll("Свиток здоровья", statTypes.HEALTH, regen);
          } else if (scrollStat === 1) {
            const incAgil = getRandomInt(1, maxAgilityInc + 1);
            item = new Scroll("Свиток ловкости", statTypes.AGILITY, incAgil);
          } else {
            const incStrength = getRandomInt(1, maxStrengthInc + 1);
            item = new Scroll("Свиток силы", statTypes.STRENGTH, incStrength);
          }
          symbol = ITEM_SYMBOL_SCROLL;
          break;

        case 3:
          const weaponType = getRandomInt(0, WEAPON_COUNT);
          const str = getRandomInt(WEAPON_STRENGTH_MIN, WEAPON_STRENGTH_MAX);
          switch (weaponType) {
            case 0:
              item = new Weapon("Меч", str);
              break;
            case 1:
              item = new Weapon("Кинжал", str);
              break;
            case 2:
              item = new Weapon("Копьё", str);
              break;
            case 3:
              item = new Weapon("Лук", str);
              break;
            case 4:
              item = new Weapon("Топор", str);
              break;
          }
          symbol = ITEM_SYMBOL_WEAPON;
          break;
      }

      if (item && symbol) {
        room.addItem(itemRow, itemCol, item);
        room.setState(itemRow, itemCol, symbol);
      }
    }
  }

  populateRoomWithEnemies(room, gameSession) {
    const depthFactor = this._levelNumber / LEVEL_COUNT; // 0.05→1.0
    let numEnemies = Math.min(
      ENEMY_COUNT_BASE + Math.floor(depthFactor * ENEMY_COUNT_DEPTH_MULTIPLIER),
      MAX_ENEMIES_PER_ROOM
    ); // 1→3
    const spawnCountModifier =
      this._modifiers && this._modifiers.spawnCountModifier
        ? this._modifiers.spawnCountModifier
        : 1;
    const enemyStatMultiplier =
      this._modifiers && this._modifiers.enemyStatMultiplier
        ? this._modifiers.enemyStatMultiplier
        : 1;

    // apply spawn modifier
    numEnemies = Math.max(1, Math.round(numEnemies * spawnCountModifier));

    if (this._easyMode)
      numEnemies = Math.max(1, numEnemies - EASY_MODE_ENEMY_REDUCTION);
    if (this._hardMode)
      numEnemies = Math.min(
        MAX_ENEMIES_PER_ROOM,
        numEnemies + HARD_MODE_ENEMY_ADDITION
      );

    for (let i = 0; i < numEnemies; i++) {
      let enemyRow, enemyCol;
      do {
        enemyRow = getRandomInt(ROOM_PADDING, room.height - 1);
        enemyCol = getRandomInt(ROOM_PADDING, room.width - 1);
      } while (room.state[enemyRow][enemyCol] !== ROOM_SYMBOL_FLOOR);

      let symbol = ENEMY_SYMBOLS[getRandomInt(0, ENEMY_SYMBOLS.length)];
      const enemy = new Enemy(enemyRow, enemyCol, room, gameSession, symbol);
      if (enemy._name === "Mimic") {
        enemy._symbol = ITEM_SYMBOLS[getRandomInt(0, ITEM_SYMBOLS.length - 1)];
        symbol = enemy._symbol;
      }

      // scale by depth and difficulty modifiers
      enemy.maxHealth = Math.max(
        1,
        Math.floor(enemy.maxHealth * (1 + depthFactor) * enemyStatMultiplier)
      );
      enemy.health = enemy.maxHealth;
      enemy.strength = Math.max(
        1,
        Math.floor(
          enemy.strength * (1 + depthFactor * 0.5) * enemyStatMultiplier
        )
      );

      room.addEnemy(enemyRow, enemyCol, enemy);
      room.setState(enemyRow, enemyCol, symbol);
    }
  }

  connectRooms() {
    const parent = Array(this._rooms.length + 1)
      .fill(0)
      .map((_, i) => i);

    const find = (i) => {
      if (parent[i] === i) return i;
      return (parent[i] = find(parent[i]));
    };

    const union = (i, j) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent[rootI] = rootJ;
        return true;
      }
      return false;
    };

    const possibleConnections = this.getPossibleConnections();
    let connectionsMade = this.buildMST(possibleConnections, union);
    connectionsMade = this.addExtraConnections(
      possibleConnections,
      connectionsMade
    );

    for (const room of this._rooms) {
      room.addCorridor();
    }

    if (!this.isLevelConnected(1)) {
      console.warn("Level generation failed to connect all rooms. Retrying...");
      this._rooms.forEach((room) => (room._connections = []));
      this._corridors = [];
      this.connectRooms();
    }

    this.drawLevelMap();
  }

  getPossibleConnections() {
    const possibleConnections = [];
    const numRows = ROOM_GRID_ROWS;
    const numCols = ROOM_GRID_COLS;

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const currentRoomId = r * numCols + c + 1;

        if (c < numCols - 1) {
          const rightRoomId = r * numCols + (c + 1) + 1;
          possibleConnections.push({
            room1Id: currentRoomId,
            room2Id: rightRoomId,
          });
        }
        if (r < numRows - 1) {
          const downRoomId = (r + 1) * numCols + c + 1;
          possibleConnections.push({
            room1Id: currentRoomId,
            room2Id: downRoomId,
          });
        }
      }
    }
    return possibleConnections;
  }

  buildMST(possibleConnections, union) {
    for (let i = possibleConnections.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [possibleConnections[i], possibleConnections[j]] = [
        possibleConnections[j],
        possibleConnections[i],
      ];
    }
    let connectionsMade = 0;
    const totalRooms = this._rooms.length;
    for (const { room1Id, room2Id } of possibleConnections) {
      if (union(room1Id, room2Id)) {
        this.addConnection(room1Id, room2Id);
        connectionsMade++;
      }
    }
    return connectionsMade;
  }

  addExtraConnections(possibleConnections, connectionsMade) {
    const existingCorridors = new Set(
      this._corridors.map(
        (c) => `${Math.min(c.room1, c.room2)}-${Math.max(c.room1, c.room2)}` // for example {"1-2", "2-3"}
      )
    );
    for (
      let i = 0;
      i < possibleConnections.length &&
      connectionsMade < this._rooms.length + 1;
      i++
    ) {
      const { room1Id, room2Id } = possibleConnections[i];
      const corridorKey = `${Math.min(room1Id, room2Id)}-${Math.max(
        room1Id,
        room2Id
      )}`;

      if (!existingCorridors.has(corridorKey)) {
        this.addConnection(room1Id, room2Id);
        connectionsMade++;
        existingCorridors.add(corridorKey);
      }
    }
    return connectionsMade;
  }

  addConnection(room1Id, room2Id) {
    const room1 = this.getRoom(room1Id);
    const room2 = this.getRoom(room2Id);

    room1._connections.push(room2Id);
    room2._connections.push(room1Id);
    this._corridors.push({ room1: room1Id, room2: room2Id });

    // горизонтальные соседи (room2 справа от room1)
    if (room2Id - room1Id === ROOM_HORIZONTAL_NEIGHBOR_OFFSET) {
      const sharedMin = ROOM_PADDING;
      const sharedMax = Math.min(room1.height, room2.height) + 1;
      const doorRow = getRandomInt(sharedMin, sharedMax);

      room1._passwayCoords[room2Id] = {
        row: doorRow,
        col: room1.width + ROOM_PADDING + 1,
      };
      room2._passwayCoords[room1Id] = {
        row: doorRow,
        col: 0,
      };
    }

    // вертикальные соседи (room2 снизу от room1)
    if (room2Id - room1Id === ROOM_VERTICAL_NEIGHBOR_OFFSET) {
      const sharedMin = ROOM_PADDING;
      const sharedMax = Math.min(room1.width, room2.width) + 1;
      const doorCol = getRandomInt(sharedMin, sharedMax);

      room1._passwayCoords[room2Id] = {
        row: room1.height + ROOM_PADDING + 1,
        col: doorCol,
      };
      room2._passwayCoords[room1Id] = {
        row: 0,
        col: doorCol,
      };
    }
  }

  // Helper function to check if all rooms are connected and accessible from a starting room
  isLevelConnected(startRoomId) {
    const visited = new Set();
    const queue = [startRoomId];
    visited.add(startRoomId);

    let roomsWithConnections = new Set();

    while (queue.length > 0) {
      const currentRoomId = queue.shift();
      const currentRoom = this.getRoom(currentRoomId);

      if (!currentRoom) {
        continue;
      }

      if (currentRoom._connections.length > 0) {
        roomsWithConnections.add(currentRoomId);
      }

      for (const connectedRoomId of currentRoom._connections) {
        if (!visited.has(connectedRoomId)) {
          visited.add(connectedRoomId);
          queue.push(connectedRoomId);
        }
      }
    }

    // Check if all rooms are visited
    if (visited.size !== this._rooms.length) {
      return false;
    }

    // Check if every room has at least one connection
    for (const room of this._rooms) {
      if (room._connections.length === 0) {
        return false;
      }
    }
    return true;
  }

  getRoom(id) {
    return this._rooms.find((room) => room._id === id);
  }

  getCorridor(id) {
    return this._corridors.find((corridor) => corridor._id === id);
  }

  drawLevelMap() {
    // Clear the grid first
    for (let i = 0; i < this._gridHeight; i++) {
      this._levelGrid[i].fill(" ");
    }

    // Place rooms on the grid
    for (const room of this._rooms) {
      const r = Math.floor((room.id - 1) / 3);
      const c = (room.id - 1) % 3;
      this._levelGrid[r * 2][c * 2] = room.id.toString();
    }

    // Place corridors on the grid
    for (const corridor of this._corridors) {
      const room1 = this.getRoom(corridor.room1);
      const room2 = this.getRoom(corridor.room2);

      const r1 = Math.floor((room1.id - 1) / 3);
      const c1 = (room1.id - 1) % 3;

      const r2 = Math.floor((room2.id - 1) / 3);
      const c2 = (room2.id - 1) % 3;

      if (r1 === r2) {
        // Horizontal connection
        const gridRow = r1 * 2;
        const gridCol = Math.min(c1, c2) * 2 + 1;
        this._levelGrid[gridRow][gridCol] = "-";
      } else if (c1 === c2) {
        // Vertical connection
        const gridRow = Math.min(r1, r2) * 2 + 1;
        const gridCol = c1 * 2;
        this._levelGrid[gridRow][gridCol] = "|";
      }
    }
  }

  renderFullLevel() {
    const numRows = ROOM_GRID_ROWS;
    const numCols = ROOM_GRID_COLS;
    const cellHeights = [];
    const cellWidths = [];
    for (let r = 0; r < numRows; r++) {
      cellHeights[r] = 0;
      for (let c = 0; c < numCols; c++) {
        const id = r * numCols + c + 1;
        const room = this.getRoom(id);
        if (room) {
          cellHeights[r] = Math.max(
            cellHeights[r],
            room.height + ROOM_BORDER_SIZE
          );
          cellWidths[c] = cellWidths[c] || 0;
          cellWidths[c] = Math.max(
            cellWidths[c],
            room.width + ROOM_BORDER_SIZE
          );
        }
      }
    }

    // общая матрица
    const totalHeight = cellHeights.reduce((a, b) => a + b, 0);
    const totalWidth = cellWidths.reduce((a, b) => a + b, 0);

    const grid = Array.from({ length: totalHeight }, () =>
      Array(totalWidth).fill(" ")
    );

    // копируем state каждой комнаты в своё «окошко»
    let offsetY = 0;
    for (let r = 0; r < numRows; r++) {
      let offsetX = 0;
      for (let c = 0; c < numCols; c++) {
        const id = r * numCols + c + 1;
        const room = this.getRoom(id);
        if (room.isVisited || room.id === 1) {
          const rendered = room
            .renderMatrixWithBorders(room === this._currentLocation)
            .split("\n");
          for (let y = 0; y < rendered.length; y++) {
            for (let x = 0; x < rendered[y].length; x++) {
              grid[offsetY + y][offsetX + x] = rendered[y][x];
            }
          }
        }
        offsetX += cellWidths[c];
      }
      offsetY += cellHeights[r];
    }
    return grid.map((row) => row.join("")).join("\n");
  }

  renderLevelMap() {
    return this._levelGrid.map((row) => row.join("")).join("\n");
  }

  toJSON() {
    return {
      levelNumber: this._levelNumber,
      easyMode: !!this._easyMode,
      hardMode: !!this._hardMode,
      currentRoomId: this._currentLocation ? this._currentLocation.id : null,
      rooms: this._rooms.map((r) =>
        typeof r.toJSON === "function" ? r.toJSON() : { id: r.id }
      ),
    };
  }

  static fromJSON(gameSession, data) {
    const lvl = new Level(
      gameSession,
      data.levelNumber || 1,
      data.easyMode,
      data.hardMode
    );
    // replace rooms with serialized ones
    lvl._rooms = [];
    lvl._corridors = [];
    for (const rdata of data.rooms || []) {
      const room = new Room(rdata.id);
      room._height = rdata.height;
      room._width = rdata.width;
      room._state = rdata.state;
      room._connections = rdata.connections || [];
      room._passwayCoords = rdata.passwayCoords || {};
      room._hasBeenVisited = !!rdata.isVisited;
      room._items = {};
      room._enemies = {};

      // register room in session and in level
      lvl._rooms.push(room);
      if (gameSession && typeof gameSession.registerRoom === "function")
        gameSession.registerRoom(room);

      // restore items
      if (Array.isArray(rdata.items)) {
        for (const it of rdata.items) {
          const { row, col, item } = it;
          let instance = null;
          switch (item.type) {
            case "food":
              instance = new Food(item.name, item.toRegen);
              break;
            case "elixir":
              instance = new Elixir(
                item.name,
                item.stat,
                item.increase,
                item.duration
              );
              break;
            case "scroll":
              instance = new Scroll(item.name, item.stat, item.increase);
              break;
            case "weapon":
              instance = new Weapon(item.name, item.strength);
              break;
            case "treasure":
              instance = new Treasure(item.value || 0);
              break;
            default:
              break;
          }
          if (instance) {
            room.addItem(row, col, instance);
            room.setState(
              row,
              col,
              instance.type === "treasure"
                ? ITEM_SYMBOL_TREASURE
                : instance.type === "weapon"
                ? ITEM_SYMBOL_WEAPON
                : instance.type === "food"
                ? ITEM_SYMBOL_FOOD
                : ITEM_SYMBOL_ELIXIR
            );
          }
        }
      }

      // restore enemies
      if (Array.isArray(rdata.enemies)) {
        for (const ed of rdata.enemies) {
          const enemy = new Enemy(ed.row, ed.col, room, gameSession, ed.symbol);
          enemy.health = ed.health;
          enemy.maxHealth = ed.maxHealth;
          enemy.strength = ed.strength;
          enemy.agility = ed.agility;
          enemy.hostility = ed.hostility;
          // ensure id consistency in registry
          if (gameSession) {
            enemy._id = ed.id;
            gameSession._entities = gameSession._entities || {};
            gameSession._entities[ed.id] = enemy;
          }
          room._enemies[`${ed.row},${ed.col}`] = enemy;
          room.setState(ed.row, ed.col, ed.symbol);
        }
      }
    }

    // set current location if provided
    if (data.currentRoomId && lvl.getRoom(data.currentRoomId)) {
      lvl._currentLocation = lvl.getRoom(data.currentRoomId);
    }

    // ensure corridors/doors are drawn
    for (const room of lvl._rooms) {
      room.addCorridor();
    }

    return lvl;
  }
}
