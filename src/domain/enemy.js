import { Character } from "./character.js";
import { clamp } from "./utils.js";
import { getRandomInt } from "./utils.js";
import {
  ENEMY_SYMBOLS,
  ENEMY_SYMBOL_ZOMBIE,
  ENEMY_SYMBOL_VAMPIRE,
  ENEMY_SYMBOL_GHOST,
  ENEMY_SYMBOL_OGRE,
  ENEMY_SYMBOL_SNAKE,
  ENEMY_SYMBOL_MIMIC,
  ZOMBIE_HOSTILITY,
  ZOMBIE_AGILITY,
  ZOMBIE_STRENGTH,
  ZOMBIE_HEALTH,
  VAMPIRE_HOSTILITY,
  VAMPIRE_AGILITY,
  VAMPIRE_STRENGTH,
  VAMPIRE_HEALTH,
  GHOST_HOSTILITY,
  GHOST_AGILITY,
  GHOST_STRENGTH,
  GHOST_HEALTH,
  OGRE_HOSTILITY,
  OGRE_AGILITY,
  OGRE_STRENGTH,
  OGRE_HEALTH,
  SNAKE_HOSTILITY,
  SNAKE_AGILITY,
  SNAKE_STRENGTH,
  SNAKE_HEALTH,
  MIMIC_HOSTILITY,
  MIMIC_AGILITY,
  MIMIC_STRENGTH,
  MIMIC_HEALTH,
  DEFAULT_ENEMY_HOSTILITY,
  DEFAULT_ENEMY_AGILITY,
  DEFAULT_ENEMY_STRENGTH,
  DEFAULT_ENEMY_HEALTH,
  REWARD_DIFFICULTY_SCORE_HEALTH_FACTOR,
  REWARD_DIFFICULTY_SCORE_STRENGTH_FACTOR,
  REWARD_DIFFICULTY_SCORE_AGILITY_FACTOR,
  REWARD_TYPE_BONUS_OGRE,
  REWARD_TYPE_BONUS_VAMPIRE,
  REWARD_TYPE_BONUS_SNAKE,
  REWARD_MINIMUM,
  REWARD_ROUNDING_DIVISOR,
  OGRE_STRIKE_DAMAGE_REDUCTION,
  OGRE_STRIKE_BASE_DAMAGE,
  ZOMBIE_GHOST_DAMAGE_BONUS,
  VAMPIRE_DAMAGE_HEALTH_RATIO,
  SNAKE_DAMAGE_BONUS,
  SNAKE_SLEEP_CHANCE,
  BLOCK_DAMAGE_REDUCTION,
  BLOCK_MINIMUM_DAMAGE,
  BLOCK_AGILITY_REDUCTION,
  HIT_CHANCE_MIN,
  HIT_CHANCE_MAX,
  ROOM_SYMBOL_FLOOR,
  ITEM_SYMBOLS,
} from "./constants.js";

const names = {
  z: "Zombie",
  v: "Vampire",
  g: "Ghost",
  O: "Ogre",
  s: "Snake",
  m: "Mimic",
};

const enemyStats = {
  [ENEMY_SYMBOL_ZOMBIE]: {
    hostility: ZOMBIE_HOSTILITY,
    agility: ZOMBIE_AGILITY,
    strength: ZOMBIE_STRENGTH,
    health: ZOMBIE_HEALTH,
  },
  [ENEMY_SYMBOL_VAMPIRE]: {
    hostility: VAMPIRE_HOSTILITY,
    agility: VAMPIRE_AGILITY,
    strength: VAMPIRE_STRENGTH,
    health: VAMPIRE_HEALTH,
  },
  [ENEMY_SYMBOL_GHOST]: {
    hostility: GHOST_HOSTILITY,
    agility: GHOST_AGILITY,
    strength: GHOST_STRENGTH,
    health: GHOST_HEALTH,
  },
  [ENEMY_SYMBOL_OGRE]: {
    hostility: OGRE_HOSTILITY,
    agility: OGRE_AGILITY,
    strength: OGRE_STRENGTH,
    health: OGRE_HEALTH,
    ogrStrike: true,
  },
  [ENEMY_SYMBOL_SNAKE]: {
    hostility: SNAKE_HOSTILITY,
    agility: SNAKE_AGILITY,
    strength: SNAKE_STRENGTH,
    health: SNAKE_HEALTH,
  },
  [ENEMY_SYMBOL_MIMIC]: {
    hostility: MIMIC_HOSTILITY,
    agility: MIMIC_AGILITY,
    strength: MIMIC_STRENGTH,
    health: MIMIC_HEALTH,
  },
};

export class Enemy extends Character {
  constructor(row, col, location, gameSession, symbol) {
    super(row, col, location, gameSession);
    this._symbol = symbol;
    this._name = names[symbol] || "Enemy";
    this._initialize(symbol);
    this.isAgrresive = false;
    this._gameSession = gameSession;
    // assign a unique id via GameSession and keep location id to avoid circular refs
    this._gameSession._nextEntityId = this._gameSession._nextEntityId || 1;
    this._id = this._gameSession._nextEntityId++;
    this._locationId = location ? location.id : null;
    this._gameSession.registerEntity(this);
    this._reward = this.calculateReward();
  }

  get name() {
    return this._name;
  }

  calculateReward() {
    const difficultyScore =
      this.maxHealth * REWARD_DIFFICULTY_SCORE_HEALTH_FACTOR +
      this.strength * REWARD_DIFFICULTY_SCORE_STRENGTH_FACTOR +
      this.agility * REWARD_DIFFICULTY_SCORE_AGILITY_FACTOR;
    let typeBonus = 1;
    if (this._symbol === ENEMY_SYMBOL_OGRE) typeBonus = REWARD_TYPE_BONUS_OGRE;
    else if (this._symbol === ENEMY_SYMBOL_VAMPIRE)
      typeBonus = REWARD_TYPE_BONUS_VAMPIRE;
    else if (this._symbol === ENEMY_SYMBOL_SNAKE)
      typeBonus = REWARD_TYPE_BONUS_SNAKE;

    const raw = difficultyScore * typeBonus;
    return Math.max(REWARD_MINIMUM, Math.round(raw / REWARD_ROUNDING_DIVISOR));
  }

  get reward() {
    return this._reward;
  }

  isAlive() {
    return this.health > 0;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  _initialize(symbol) {
    const stats = enemyStats[symbol] || {
      hostility: DEFAULT_ENEMY_HOSTILITY,
      agility: DEFAULT_ENEMY_AGILITY,
      strength: DEFAULT_ENEMY_STRENGTH,
      health: DEFAULT_ENEMY_HEALTH,
    };

    this.hostility = stats.hostility;
    this.agility = stats.agility;
    this.strength = stats.strength;
    this.health = stats.health;
    this.maxHealth = stats.health;
    if (stats.ogrStrike !== undefined) this.ogrStrike = stats.ogrStrike;
  }

  //тут и атака и шаги и смена агрессии
  step() {
    this.setAgressive();
    if (this.isAgrresive) {
      this.stepAgressive();
    } else if (this._name != "Mimic") {
      this.stepRandom();
    }
  }

  setAgressive() {
    const player = this._gameSession?._player;
    if (!player || !player._pos) return;

    const pRow = player._pos.row;
    const pCol = player._pos.col;
    const eRow = this._pos.row;
    const eCol = this._pos.col;

    // Check if player is in a passageway
    const isPlayerInPassageway = Object.values(
      this._location._passwayCoords
    ).some((coords) => coords.row === pRow && coords.col === pCol);

    if (isPlayerInPassageway) {
      this.isAgrresive = false;
    } else {
      // Расстояние до игрока
      const rowDiff = Math.abs(pRow - eRow);
      const colDiff = Math.abs(pCol - eCol);
      const distance = Math.max(rowDiff, colDiff);

      // Если игрок в радиусе hostility - включаем агрессию
      if (distance <= this.hostility && !this.isAgrresive) {
        this.isAgrresive = true;
        if (this._name == "Mimic") this._symbol = ENEMY_SYMBOL_MIMIC;
      }
    }
  }

  attackPlayer(player, isBlocking = false) {
    // Determine hit chance: base modified by relative agility
    const playerAgility =
      player.agility !== undefined ? player.agility : DEFAULT_ENEMY_AGILITY;
    const hitChance = clamp(
      20 + (this.agility - playerAgility),
      HIT_CHANCE_MIN,
      HIT_CHANCE_MAX
    );

    let message;
    if (Math.random() * 100 >= hitChance) {
      // Missed attack
      message = `[${hitChance}% hit chance] ${this.name} missed the attack!`;
    } else {
      // Successful hit
      let damage = this.calculateDamage(player);

      if (isBlocking) {
        damage = this.modifyBlockedDamage(damage);
      }

      player.health = clamp(player.health - damage, 0, player.maxHealth);
      this.notifyTracker(damage);

      const blockNote = isBlocking ? " (blocked)" : "";
      message = `[${hitChance}% hit chance] ${this.name} attacks Player for ${damage} damage${blockNote}. ${this.name}'s agility is now ${this.agility}.`;
    }

    return message;
  }

  modifyBlockedDamage(damage) {
    // If player is blocking, they take only reduced damage (minimum 1)
    const blockedDamage = Math.max(
      BLOCK_MINIMUM_DAMAGE,
      Math.ceil(damage * BLOCK_DAMAGE_REDUCTION)
    );
    damage = blockedDamage;

    // Each successful block reduces enemy agility by constant (not below 0)
    this.agility = Math.max(0, this.agility - BLOCK_AGILITY_REDUCTION);
    return damage;
  }

  calculateDamage(player) {
    let damage = this.strength;
    if (this._symbol == ENEMY_SYMBOL_OGRE) {
      if (this.ogrStrike) {
        damage =
          (this.strength - OGRE_STRIKE_BASE_DAMAGE) *
          OGRE_STRIKE_DAMAGE_REDUCTION;
        this.ogrStrike = !this.ogrStrike;
      } else {
        this.ogrStrike = !this.ogrStrike;
      }
    } else if (
      this._symbol == ENEMY_SYMBOL_ZOMBIE ||
      this._symbol == ENEMY_SYMBOL_GHOST
    ) {
      damage =
        ZOMBIE_GHOST_DAMAGE_BONUS +
        (this.strength - OGRE_STRIKE_BASE_DAMAGE) *
          OGRE_STRIKE_DAMAGE_REDUCTION;
    } else if (this._symbol == ENEMY_SYMBOL_VAMPIRE) {
      damage = player.maxHealth / VAMPIRE_DAMAGE_HEALTH_RATIO;
    } else if (this._symbol == ENEMY_SYMBOL_SNAKE) {
      damage =
        SNAKE_DAMAGE_BONUS +
        (this.strength - OGRE_STRIKE_BASE_DAMAGE) *
          OGRE_STRIKE_DAMAGE_REDUCTION;
      if (Math.floor(Math.random() * 100) < SNAKE_SLEEP_CHANCE)
        player.sleep = true;
    }
    return damage;
  }

  notifyTracker(damage) {
    if (
      this._gameSession &&
      this._gameSession._difficulty &&
      typeof this._gameSession._difficulty.observeCombatEvent === "function"
    ) {
      this._gameSession._difficulty.observeCombatEvent({
        type: "damageTaken",
        value: damage,
      });
    }
  }

  //проверка рядом ли игрок
  isPlayerAdjacent() {
    const player = this._gameSession?._player;
    if (!player || !player._pos) return false;

    const pRow = player._pos.row;
    const pCol = player._pos.col;
    const eRow = this._pos.row;
    const eCol = this._pos.col;

    const isUp = pRow === eRow - 1 && pCol === eCol;
    const isDown = pRow === eRow + 1 && pCol === eCol;
    const isLeft = pRow === eRow && pCol === eCol - 1;
    const isRight = pRow === eRow && pCol === eCol + 1;

    return isUp || isDown || isLeft || isRight;
  }

  stepRandom() {
    let newRow = this._pos.row;
    let newCol = this._pos.col;

    let moveDistance = 1;
    if (this._symbol === "O") {
      moveDistance = 2;
    }

    if (this._symbol === "s") {
      if (this.snakeDirection === undefined) {
        this.snakeDirection = Math.floor(Math.random() * 4);
      }

      this.snakeDirection = (this.snakeDirection + 1) % 4;

      if (this.snakeDirection === 0) {
        newRow--;
        newCol--;
      } else if (this.snakeDirection === 1) {
        newRow--;
        newCol++;
      } else if (this.snakeDirection === 2) {
        newRow++;
        newCol++;
      } else if (this.snakeDirection === 3) {
        newRow++;
        newCol--;
      }
    } else {
      const dir = Math.floor(Math.random() * 4);

      if (dir === 0) newRow -= moveDistance;
      else if (dir === 1) newRow += moveDistance;
      else if (dir === 2) newCol -= moveDistance;
      else if (dir === 3) newCol += moveDistance;
    }

    if (this._symbol === "g") {
      this.ghostInvisible = !this.ghostInvisible;

      if (this.ghostInvisible) {
        this._location.setState(this._pos.row, this._pos.col, "•");
        return;
      } else {
        const possibleCells = [];

        for (let r = 0; r < this._location.height + 4; r++) {
          for (let c = 0; c < this._location.width + 4; c++) {
            if (this._location.state[r][c] === "•") {
              possibleCells.push({ row: r, col: c });
            }
          }
        }

        if (possibleCells.length > 0) {
          const randomCell =
            possibleCells[Math.floor(Math.random() * possibleCells.length)];
          newRow = randomCell.row;
          newCol = randomCell.col;
        }
      }
    } else {
      if (newRow < 0 || newRow >= this._location.height + 4) return;
      if (newCol < 0 || newCol >= this._location.width + 4) return;
      if (this._location.state[newRow][newCol] !== "•") return;
    }

    if (!(this._symbol === "g" && this.ghostInvisible)) {
      const oldKey = `${this._pos.row},${this._pos.col}`;
      const newKey = `${newRow},${newCol}`;

      delete this._location._enemies[oldKey];
      this._location.setState(this._pos.row, this._pos.col, "•");
      this._location.setState(newRow, newCol, this._symbol);
      this._location._enemies[newKey] = this;

      this._pos.row = newRow;
      this._pos.col = newCol;
    }
  }

  stepAgressive() {
    const player = this._gameSession._player;
    const pRow = player._pos.row;
    const pCol = player._pos.col;
    const eRow = this._pos.row;
    const eCol = this._pos.col;

    let newRow = eRow;
    let newCol = eCol;

    if (pRow > eRow) newRow++; // игрок ниже - вниз
    else if (pRow < eRow) newRow--; // игрок выше - вверх
    else if (pCol > eCol) newCol++; // игрок правее - вправо
    else if (pCol < eCol) newCol--; // игрок левее - влево
    else return; // стоим на одной клетке с игроком

    if (newRow < 0 || newRow >= this._location.height + 4) return;
    if (newCol < 0 || newCol >= this._location.width + 4) return;

    if (this._location.state[newRow][newCol] !== ROOM_SYMBOL_FLOOR) return;

    const oldKey = `${eRow},${eCol}`;
    const newKey = `${newRow},${newCol}`;

    delete this._location._enemies[oldKey];
    this._location.setState(eRow, eCol, ROOM_SYMBOL_FLOOR);
    this._location.setState(newRow, newCol, this._symbol);
    this._location._enemies[newKey] = this;
    this._pos.row = newRow;
    this._pos.col = newCol;
  }

  toJSON() {
    return {
      id: this._id,
      row: this._pos.row,
      col: this._pos.col,
      symbol: this._symbol,
      health: this.health,
      maxHealth: this.maxHealth,
      strength: this.strength,
      agility: this.agility,
      hostility: this.hostility,
      locationId: this._location ? this._location.id : this._locationId,
    };
  }
}
