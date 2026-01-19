import { Character } from "./character.js";
import {
  Backpack,
  statTypes,
  Weapon,
  ItemTypes,
  Treasure,
} from "./entities/entities.js";
import { getRandomInt } from "./utils.js";
import {
  PLAYER_BASE_MAX_HEALTH,
  PLAYER_BASE_STRENGTH,
  PLAYER_BASE_AGILITY,
  PLAYER_BASE_DAMAGE,
  ITEM_SYMBOLS,
  ROOM_SYMBOL_FLOOR,
  ENEMY_SYMBOLS,
  ROOM_SYMBOL_EXIT,
  HIT_CHANCE_BASE,
  HIT_CHANCE_MAX,
  WEAPON_STRENGTH_FACTOR,
} from "./constants.js";
import { Enemy } from "./enemy.js";

export class Player extends Character {
  constructor(row, col, location, gameSession) {
    super(row, col, location, gameSession);
    this._backpack = new Backpack();
    this._symbol = "P";
    this.health = PLAYER_BASE_MAX_HEALTH;
    this.maxHealth = PLAYER_BASE_MAX_HEALTH;
    this.agility = PLAYER_BASE_AGILITY;
    this.strength = PLAYER_BASE_STRENGTH;
    this.sleep = false;
    this._activeBuffs = [];
    this.equippedWeapon = null;
    // assign id and register with game session for centralized entity tracking
    if (this._gameSession) {
      this._gameSession._nextEntityId = this._gameSession._nextEntityId || 1;
      this._id = this._gameSession._nextEntityId++;
      this._locationId = location ? location.id : null;
      if (typeof this._gameSession.registerEntity === "function") {
        this._gameSession.registerEntity(this);
      }
    } else {
      this._id = Date.now();
      this._locationId = location ? location.id : null;
    }
  }

  cellInteraction(direction, oldRow, oldCol, newRow, newCol) {
    const move = (symbol) => {
      this._location.setState(oldRow, oldCol, ROOM_SYMBOL_FLOOR);
      this._location.setState(newRow, newCol, symbol);
      this._pos.row = newRow;
      this._pos.col = newCol;
    };

    if (
      newRow >= 0 &&
      newRow < this._location.height + 4 &&
      newCol >= 0 &&
      newCol < this._location.width + 4
    ) {
      //проверка на мимика
      const enemyKey = `${newRow},${newCol}`;
      const enemy = this._location._enemies[enemyKey];
      if (enemy && enemy._name === "Mimic") {
        enemy._symbol = "m";
        enemy.isAgrresive = true;
        this._location.setState(newRow, newCol, "m");
        return {
          action: "enemy_encounter",
          enemy: enemy,
        };
      }

      const targetCell = this._location.state[newRow][newCol];

      // handlers map for symbols
      const handlers = {};

      // Door: step through door and re-evaluate next cell
      handlers["D"] = () => {
        if (direction === "up") newRow--;
        if (direction === "down") newRow++;
        if (direction === "left") newCol--;
        if (direction === "right") newCol++;
        return this.cellInteraction(direction, oldRow, oldCol, newRow, newCol);
      };

      // Wall
      handlers[" "] = () => ({ action: "wall" });

      // Empty floor - move
      handlers["•"] = () => {
        move(this._symbol);
        return { action: "moved" };
      };

      // Item symbols
      const itemHandler = () => {
        this.pickUpItem(newRow, newCol);
        move(this._symbol);
        return { action: "moved" };
      };
      for (const s of ITEM_SYMBOLS) handlers[s] = itemHandler;

      // Enemy symbols
      const enemyHandler = () => ({
        action: "enemy_encounter",
        enemy: this._location.getEnemy(newRow, newCol),
      });
      for (const s of ENEMY_SYMBOLS) handlers[s] = enemyHandler;

      // Next level
      handlers[">"] = () => {
        this._gameSession.goToNextLevel();
        return { action: "next-level" };
      };

      const handler = handlers[targetCell];
      if (handler) return handler();
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

    let moveResult = this.cellInteraction(
      direction,
      oldRow,
      oldCol,
      newRow,
      newCol
    );
    if (moveResult === null) {
      moveResult = { action: "boundary", newPos: { row: newRow, col: newCol } };
    }
    return moveResult;
  }

  pickUpItem(row, col) {
    // Подбор предметов в рюкзак
    const item = this._location.getItem(row, col);
    if (item) {
      const added = this._backpack.addItem(item);
      if (added) {
        this._location.removeItem(row, col);
        this._gameSession._logs.push(`Подобрано ${item.name}!`);
        return true;
      } else {
        this._gameSession._logs.push(`Рюкзак полон! ${item.name}.`);
        return false;
      }
    }
  }

  // использование предметов
  useFood(index) {
    const food = this._backpack.takeFood(index);
    if (food) {
      this.health = Math.min(this.health + food.toRegen, this.maxHealth);
      this._gameSession._logs.push(`${food.name}: +${food.toRegen} HP`);
      return food;
    }
    this._gameSession._logs.push("Нет еды!");
    return null;
  }

  useElixir(index) {
    const effect = this._backpack.takeElixir(index);
    if (effect) {
      switch (effect.stat) {
        case statTypes.HEALTH:
          this.maxHealth += effect.increase;
          this.health += effect.increase;
          break;
        case statTypes.AGILITY:
          this.agility += effect.increase;
          break;
        case statTypes.STRENGTH:
          this.strength += effect.increase;
          break;
      }
      this._activeBuffs.push({ ...effect, turnsLeft: effect.duration });
      this._gameSession._logs.push(
        `${effect.name}: ${effect.stat} +${effect.increase} (${effect.duration})`
      );
      return effect;
    }
    this._gameSession._logs.push("Нет эликсиров!");
    return null;
  }

  useScroll(index) {
    const effect = this._backpack.takeScroll(index);
    if (effect) {
      switch (effect.stat) {
        case statTypes.HEALTH:
          this.maxHealth += effect.increase;
          this.health = Math.min(this.health + effect.increase, this.maxHealth);
          break;
        case statTypes.AGILITY:
          this.agility += effect.increase;
          break;
        case statTypes.STRENGTH:
          this.strength += effect.increase;
          break;
      }

      this._gameSession._logs.push(
        `${effect.name}: ${effect.stat} +${effect.increase}`
      );
      return effect;
    }
    this._gameSession._logs.push("Нет свитков!");
    return null;
  }

  equipWeapon(index) {
    if (index == null || index < 0) {
      if (this.equippedWeapon) {
        this._backpack.addItem(this.equippedWeapon);
        this._gameSession._logs.push(
          `Оружие ${this.equippedWeapon.name} убрано в инвентарь.`
        );
        this.equippedWeapon = null;
      }
      return;
    }

    const newWeapon = this._backpack.takeWeapon(index);
    if (!newWeapon) {
      this._gameSession._logs.push("Нет оружия с таким номером.");
      return;
    }

    // если что‑то было в руках — вернуть в инвентарь
    if (this.equippedWeapon) {
      this._backpack.addItem(this.equippedWeapon);
    }

    this.equippedWeapon = newWeapon;
    this._gameSession._logs.push(`Экипировано оружие: ${newWeapon.name}`);
  }

  // выброс оружия из инвентаря
  dropWeapon(index) {
    const weapon = this._backpack.takeWeapon(index);
    if (!weapon) {
      this._gameSession._logs.push("Нет оружия с таким номером для выброса.");
      return;
    }

    // кладём на клетку под игроком
    const row = this.position.row + 1;
    const col = this.position.col;
    this._location.addItem(row, col, weapon);
    this._location.setState(row, col, "†");
    this._gameSession._logs.push(`Вы выбросили оружие: ${weapon.name}`);
  }

  updateBuffs() {
    this._activeBuffs = this._activeBuffs.filter((buff) => {
      buff.turnsLeft--;
      if (buff.turnsLeft <= 0) {
        if (buff.stat === statTypes.HEALTH) {
          this.maxHealth -= buff.increase;
          if (this.health > this.maxHealth) this.health = this.maxHealth;
        }
        if (buff.stat === statTypes.AGILITY) this.agility -= buff.increase;
        if (buff.stat === statTypes.STRENGTH) this.strength -= buff.increase;

        if (this.health <= 0) this.health = 1;

        return false;
      }
      return true;
    });
  }

  isAlive() {
    return this.health > 0;
  }

  checkDeath() {
    if (this.health <= 0) {
      this._gameSession._logs.push("💀 ИГРА ОКОНЧЕНА! Здоровье = 0");
      this._gameSession.endGame();
    }
  }

  defeatEnemy(enemyReward) {
    const treasure = new Treasure(enemyReward);
    this._backpack.addItem(treasure);
    this._gameSession._logs.push(`+${enemyReward} золота!`);
    // notify difficulty tracker
    if (
      this._gameSession &&
      this._gameSession._difficulty &&
      typeof this._gameSession._difficulty.observeCombatEvent === "function"
    ) {
      this._gameSession._difficulty.observeCombatEvent({
        type: "enemyKilled",
        value: 1,
      });
    }
  }

  getTotalDamage() {
    let baseDamage = PLAYER_BASE_DAMAGE + this.strength;
    let weaponPart = 0;

    if (this.equippedWeapon) {
      const strengthFactor = this.strength / PLAYER_BASE_STRENGTH;
      weaponPart = this.equippedWeapon.strength * strengthFactor;
    }

    baseDamage = Math.round(baseDamage + weaponPart);
    return baseDamage;
  }

  // Calculate hit chance based on agility
  getHitChance() {
    return Math.min(HIT_CHANCE_MAX, HIT_CHANCE_BASE + this.agility); // Base 50% + agility bonus, capped at 95%
  }

  toJSON() {
    return {
      id: this._id,
      row: this._pos.row,
      col: this._pos.col,
      locationId: this._location ? this._location.id : this._locationId,
      health: this.health,
      maxHealth: this.maxHealth,
      agility: this.agility,
      strength: this.strength,
      sleep: this.sleep,
      activeBuffs: this._activeBuffs,
      equippedWeapon: this.equippedWeapon
        ? {
            name: this.equippedWeapon.name,
            strength: this.equippedWeapon.strength,
          }
        : null,
      backpack: {
        food: this._backpack.items.food.map((it) => ({
          name: it.name,
          toRegen: it.toRegen,
        })),
        elixir: this._backpack.items.elixir.map((it) => ({
          name: it.name,
          stat: it._stat || it.stat,
          increase: it._increase || it.increase,
          duration: it._duration || it.duration,
        })),
        scroll: this._backpack.items.scroll.map((it) => ({
          name: it.name,
          stat: it._stat || it.stat,
          increase: it._increase || it.increase,
        })),
        weapon: this._backpack.items.weapon.map((it) => ({
          name: it.name,
          strength: it._strength || it.strength,
        })),
        treasure: this._backpack.items.treasure,
      },
    };
  }
}
