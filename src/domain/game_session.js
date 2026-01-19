import React from "react";
import { Level } from "./level.js";
import { Player } from "./player.js";
import { getRandomInt } from "./utils.js";
import {
  saveSession,
  loadSession,
  saveRecord,
} from "../datalayer/data_actions.js";
import { MainRender } from "../presentation/presentation.js";
import { Difficulty } from "./difficulty.js";

export class GameSession {
  constructor() {
    this.depth = 1;
    this._logs = [];
    // central registries to reduce circular references
    this._entities = {}; // id -> entity (Player/Enemy)
    this._nextEntityId = 1;
    this._roomsMap = {}; // roomId -> Room

    this._currLevel = new Level(this);
    this._currLevel.connectRooms();
    const room1 = this._currLevel.getRoom(1);
    this._currLevel._currentLocation = room1;
    // register rooms in session map by id after reading saves
    for (const r of this._currLevel._rooms) {
      this.registerRoom(r);
    }

    this._player = new Player(
      getRandomInt(2, room1.height + 1),
      getRandomInt(2, room1.width + 1),
      room1,
      this
    );

    // adaptive difficulty tracker
    this._difficulty = new Difficulty();

    this.addEntity(this._player.position.row, this._player.position.col, "P");

    for (const room of this._currLevel._rooms) {
      this._currLevel.populateRoomWithItems(room, this._player);
    }

    this._previousGameMode = null;
    this._gameMode = "movement";
    this._selectionMode = null;

    this._battleEnemy = null;

    this._pendingTurnEnd = false;
    this._battleTick = 0;
    this._isBlocking = false;
    this._autoBattleActive = false;
    this._weaponThrowIndex = null;

    this._selectedBattleActionIndex = 0;
    this.records = [];
    this._gameOver = false;
  }

  registerEntity(entity) {
    if (!entity || typeof entity._id === "undefined") return;
    this._entities[entity._id] = entity;
  }

  getEntityById(id) {
    return this._entities[id];
  }

  registerRoom(room) {
    if (!room || typeof room.id === "undefined") return;
    this._roomsMap[room.id] = room;
  }

  getRoomById(id) {
    return this._roomsMap[id] || this._currLevel.getRoom(id);
  }

  // After loading entities/rooms from JSON, call this to reattach live room references
  relinkEntities() {
    for (const id of Object.keys(this._entities)) {
      const ent = this._entities[id];
      if (!ent) continue;
      const room = this.getRoomById(ent.locationId || ent._locationId);
      if (room) {
        ent.setLocation(room);
      }
    }
  }

  get player() {
    return this._player;
  }

  get logs() {
    return this._logs;
  }

  get level() {
    return this._currLevel;
  }

  get gameMode() {
    return this._gameMode;
  }
  get previousGameMode() {
    return this._previousGameMode;
  }

  setGameMode(mode) {
    this._previousGameMode = this._gameMode;
    this._gameMode = mode;
  }

  get selectionMode() {
    return this._selectionMode;
  }
  setSelectionMode(mode) {
    this._selectionMode = mode;
  }

  get battleEnemy() {
    return this._battleEnemy;
  }

  setBattleEnemy(enemy) {
    this._battleEnemy = enemy;
  }

  get pendingTurnEnd() {
    return this._pendingTurnEnd;
  }
  setPendingTurnEnd(flag) {
    this._pendingTurnEnd = !!flag;
  }

  get selectedBattleActionIndex() {
    return this._selectedBattleActionIndex;
  }
  setSelectedBattleActionIndex(idx) {
    this._selectedBattleActionIndex = idx;
  }

  get battleTick() {
    return this._battleTick;
  }
  tickBattle() {
    this._battleTick = (this._battleTick || 0) + 1;
  }

  get isBlocking() {
    return this._isBlocking;
  }
  setIsBlocking(flag) {
    this._isBlocking = !!flag;
  }

  // get autoBattleActive() {
  //   return this._autoBattleActive;
  // }
  // setAutoBattleActive(flag) {
  //   this._autoBattleActive = !!flag;
  // }

  addEntity(row, col, symbol) {
    this._currLevel._currentLocation.setState(row, col, symbol);
  }

  changeRoom(newPos) {
    const currentRoom = this._currLevel._currentLocation;
    let targetRoomId = null;

    for (const conn of currentRoom._connections) {
      const connectedRoom = this._currLevel.getRoom(conn);

      if (connectedRoom.id - currentRoom.id === -3 && newPos.row < 0) {
        // вверх
        targetRoomId = connectedRoom.id;
      } else if (
        connectedRoom.id - currentRoom.id === 3 &&
        newPos.row >= currentRoom.height + 4
      ) {
        // вниз
        targetRoomId = connectedRoom.id;
      } else if (connectedRoom.id - currentRoom.id === -1 && newPos.col < 0) {
        // влево
        targetRoomId = connectedRoom.id;
      } else if (
        connectedRoom.id - currentRoom.id === 1 &&
        newPos.col >= currentRoom.width + 4
      ) {
        // вправо
        targetRoomId = connectedRoom.id;
      }
    }

    if (targetRoomId === null) {
      console.error("No valid target room found for transition.");
      return;
    }

    // убираем игрока из старой комнаты
    currentRoom.setState(
      this._player.position.row,
      this._player.position.col,
      "•"
    );

    // новая комната
    const newLocation = this._currLevel.getRoom(targetRoomId);

    if (newLocation) {
      const passwayCoords = newLocation._passwayCoords[currentRoom.id];

      this._player.position.row = passwayCoords.row;
      this._player.position.col = passwayCoords.col;
      this._player.setLocation(newLocation);
      newLocation.markAsVisited();

      newLocation.setState(
        this._player.position.row,
        this._player.position.col,
        "P"
      );

      this._logs.push(
        `You have moved to Room ${newLocation.id} from Room ${currentRoom.id}.`
      );

      this._currLevel._currentLocation = newLocation;
    }
  }

  goToNextLevel() {
    this.saveCurrentRecord();
    this.depth++;
    if (this.depth > 21) {
      this._logs.push("🎉 ВЫ ПРОШЛИ 21 УРОВЕНЬ!");
      return;
    }

    // Задание 7: ask Difficulty for modifiers for next level
    let easyRun = false;
    let hardRun = false;
    let modifiers = null;
    if (
      this._difficulty &&
      typeof this._difficulty.adjustForNextLevel === "function"
    ) {
      const res = this._difficulty.adjustForNextLevel();
      easyRun = !!res.easyMode;
      hardRun = !!res.hardMode;
      modifiers = res.modifiers || null;
    } else {
      easyRun = this._player.health > 80;
      hardRun = this._player.health < 30;
    }

    this._currLevel = new Level(this, this.depth, easyRun, hardRun, modifiers);
    this._currLevel.connectRooms();

    const startRoom = this._currLevel.getRoom(1);
    this._currLevel._currentLocation = startRoom;
    const { row, col } = startRoom.getRandomEmptyCell();

    this._player.setLocation(startRoom);
    this._player.position.row = row;
    this._player.position.col = col;
    this.addEntity(row, col, "P");

    for (const room of this._currLevel._rooms) {
      this._currLevel.populateRoomWithItems(room, this._player);
    }

    // reset difficulty metrics for the new level
    if (
      this._difficulty &&
      typeof this._difficulty.resetLevelMetrics === "function"
    ) {
      this._difficulty.resetLevelMetrics();
    }
  }

  saveCurrentRecord() {
    const treasure = this._player._backpack.items.treasure.value || 0;
    saveRecord(this.depth, treasure);
    this._logs.push(`Рекорд: ур.${this.depth}, ${treasure}з`);
  }

  renderAll() {
    return <MainRender session={this} />;
  }

  restartGame() {
    this.saveCurrentRecord();

    this.depth = 1;
    this._logs = ["🎮 Новая игра начата"];
    this._entities = {};
    this._roomsMap = {};
    this._nextEntityId = 1;
    this._gameOver = false;

    this._currLevel = new Level(this);
    this._currLevel.connectRooms();
    const room1 = this._currLevel.getRoom(1);
    this._currLevel._currentLocation = room1;

    for (const r of this._currLevel._rooms) {
      this.registerRoom(r);
    }

    this._player = new Player(
      getRandomInt(2, room1.height + 1),
      getRandomInt(2, room1.width + 1),
      room1,
      this
    );

    this.addEntity(this._player.position.row, this._player.position.col, "P");

    for (const room of this._currLevel._rooms) {
      this._currLevel.populateRoomWithItems(room, this._player);
    }

    this._previousGameMode = null;
    this._gameMode = "movement";
    this._selectionMode = null;
    this._battleEnemy = null;
    this._pendingTurnEnd = false;
    this._battleTick = 0;
    this._isBlocking = false;
    this._weaponThrowIndex = null;
    this._selectedBattleActionIndex = 0;

    this._difficulty = new Difficulty();
  }

  endGame() {
    this.saveCurrentRecord();
    this._gameOver = true;
    this._logs.push("💀 ИГРА ОКОНЧЕНА! Нажмите 'r' для новой игры.");
  }

  // ===== BATTLE LOGIC METHODS =====

  /**
   * Handle player attacking the enemy
   */
  performPlayerAttack() {
    const totalDamage = this._player.getTotalDamage();
    const hitChance = this._player.getHitChance();

    if (Math.random() * 100 < hitChance) {
      this._battleEnemy.takeDamage(totalDamage);
      this._logs.push(
        `[${hitChance}% hit chance] Player attacks ${this._battleEnemy.name} for ${totalDamage} damage!`
      );

      if (!this._battleEnemy.isAlive()) {
        this.handleEnemyDefeat();
        return true; // Enemy defeated
      }
    } else {
      this._logs.push(`[${hitChance}% hit chance] Player's attack missed!`);
    }

    return false; // Enemy still alive
  }

  /**
   * Handle enemy being defeated
   */
  handleEnemyDefeat() {
    this._logs.push(`You defeated ${this._battleEnemy.name}!`);
    this._player.defeatEnemy(this._battleEnemy.reward);

    // Remove enemy from room
    delete this._battleEnemy._location._enemies[
      `${this._battleEnemy._pos.row},${this._battleEnemy._pos.col}`
    ];
    this._battleEnemy._location.setState(
      this._battleEnemy._pos.row,
      this._battleEnemy._pos.col,
      "•"
    );

    // Return to movement mode
    this.setGameMode("movement");
    this.setBattleEnemy(null);
  }

  /**
   * Handle player blocking
   */
  performPlayerBlock() {
    this.setIsBlocking(true);
    this._logs.push("Player is blocking.");
  }

  /**
   * Handle player throwing a weapon
   */
  performPlayerThrowWeapon(weaponIndex) {
    if (
      this._player._backpack.items.weapon &&
      this._player._backpack.items.weapon.length > 0
    ) {
      const weapon = this._player._backpack.takeWeapon(weaponIndex);
      if (weapon) {
        let takenDamage = Math.round(weapon.strength / 2);
        this._battleEnemy.takeDamage(takenDamage);
        this._logs.push(
          `Player throws ${weapon.name} for ${takenDamage} damage!`
        );

        if (!this._battleEnemy.isAlive()) {
          this.handleEnemyDefeat();
          return true; // Enemy defeated
        }
        return false; // Enemy still alive
      }
    } else {
      this._logs.push("No weapons in backpack to throw!");
    }
  }

  /**
   * Handle auto-battle attack
   */
  // performAutoBattleAttack() {
  //   const totalDamage = this._player.getTotalDamage();
  //   const hitChance = this._player.getHitChance();

  //   if (Math.random() * 100 < hitChance) {
  //     this._battleEnemy.takeDamage(totalDamage);
  //     this._logs.push(
  //       `Player attacks ${this._battleEnemy.name} for ${totalDamage} damage! (Auto-battle)`
  //     );

  //     if (!this._battleEnemy.isAlive()) {
  //       this.handleEnemyDefeat();
  //       this.setAutoBattleActive(false);
  //       return true; // Enemy defeated
  //     }
  //   } else {
  //     this._logs.push(`Player's attack missed! (Auto-battle)`);
  //   }

  //   return false; // Enemy still alive
  // }

  /**
   * Handle enemy's turn to attack the player
   */
  performEnemyAttack() {
    const handleDeath = () => {
      this._logs.push("Player has been defeated!");
      this.endGame();
      this.setBattleEnemy(null);
      this.setGameMode("movement");
      return true;
    };

    if (!this._player.isAlive()) return handleDeath();

    const message = this._battleEnemy.attackPlayer(
      this._player,
      this._isBlocking
    );
    if (message) this._logs.push(message);

    if (!this._player.isAlive()) return handleDeath();

    this.setIsBlocking(false);
    return false;
  }
}
