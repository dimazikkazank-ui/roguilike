import fileSystem from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Level } from "../domain/level.js";
import { Player } from "../domain/player.js";
import {
  Food,
  Elixir,
  Scroll,
  Weapon,
  Treasure,
} from "../domain/entities/entities.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");

export function saveSession(session) {
  // Do not allow saving while in a battle to avoid complex transient state
  if (session && (session.gameMode === "battle" || session.battleEnemy)) {
    if (session.logs)
      session.logs.push(
        "Cannot save during battle. Finish or flee the battle first."
      );
    return false;
  }

  if (!fileSystem.existsSync(dataDir)) {
    fileSystem.mkdirSync(dataDir, { recursive: true });
  }

  const payload = {
    version: 1,
    timestamp: new Date().toISOString(),
    session: {
      depth: session.depth,
      gameMode: session.gameMode,
      selectedBattleActionIndex: session.selectedBattleActionIndex,
      logs: session.logs,
    },
    player: session.player.toJSON(),
    level: session.level.toJSON(),
  };

  fileSystem.writeFileSync(
    path.join(dataDir, "save.json"),
    JSON.stringify(payload, null, 2)
  );
  session.logs.push("Game saved to data/save.json");
}

export function loadSession(session) {
  const savePath = path.join(dataDir, "save.json");
  if (!fileSystem.existsSync(savePath)) {
    session.logs.push("Save file deleted or not found.");
    return false;
  }

  const raw = JSON.parse(fileSystem.readFileSync(savePath, "utf-8"));

  // restore level
  if (raw.level) {
    const lvl = Level.fromJSON(session, raw.level);
    session._currLevel = lvl;
    // register rooms in session
    for (const r of lvl._rooms) session.registerRoom(r);
  }

  // restore player
  if (raw.player) {
    const p = raw.player;
    const room = session.getRoomById(p.locationId);
    const player = new Player(p.row, p.col, room, session);
    player._id = p.id || player._id;
    player.health = p.health;
    player.maxHealth = p.maxHealth;
    player.agility = p.agility;
    player.strength = p.strength;
    player.sleep = p.sleep;
    player._activeBuffs = p.activeBuffs || [];

    // restore backpack
    player._backpack.items.food =
      p.backpack && p.backpack.food
        ? p.backpack.food.map((it) => new Food(it.name, it.toRegen))
        : [];
    player._backpack.items.elixir =
      p.backpack && p.backpack.elixir
        ? p.backpack.elixir.map(
            (it) => new Elixir(it.name, it.stat, it.increase, it.duration)
          )
        : [];
    player._backpack.items.scroll =
      p.backpack && p.backpack.scroll
        ? p.backpack.scroll.map(
            (it) => new Scroll(it.name, it.stat, it.increase)
          )
        : [];
    player._backpack.items.weapon =
      p.backpack && p.backpack.weapon
        ? p.backpack.weapon.map((it) => new Weapon(it.name, it.strength))
        : [];
    player._backpack.items.treasure =
      p.backpack && p.backpack.treasure
        ? p.backpack.treasure
        : { count: 0, value: 0 };

    if (p.equippedWeapon)
      player.equippedWeapon = new Weapon(
        p.equippedWeapon.name,
        p.equippedWeapon.strength
      );

    session._player = player;
    session.registerEntity(player);

    // mark player on the room
    if (player._location) {
      player._location.setState(player._pos.row, player._pos.col, "P");
    }
  }

  // restore session metadata
  if (raw.session) {
    session.depth = raw.session.depth || session.depth;
    session.setGameMode(raw.session.gameMode || session.gameMode);
    if (raw.session.selectedBattleActionIndex !== undefined) {
      session.setSelectedBattleActionIndex(
        raw.session.selectedBattleActionIndex || 0
      );
    }
    session._logs = raw.session.logs || session._logs;
  }

  // relink entities (enemies) to rooms
  if (typeof session.relinkEntities === "function") session.relinkEntities();

  session.logs.push("Game loaded from data/save.json");
  return true;
}

export function resetSession(session) {
  const savePath = path.join(dataDir, "save.json");
  if (fileSystem.existsSync(savePath)) {
    fileSystem.unlinkSync(savePath);
  }
  if (session && session.logs) {
    session.logs.push("Save file deleted.");
  }
  return false;
}

export function saveRecord(depth, treasure) {
  if (!fileSystem.existsSync(dataDir)) {
    fileSystem.mkdirSync(dataDir, { recursive: true });
  }

  const recordsPath = path.join(dataDir, "scoreboard.json");

  let records = [];
  if (fileSystem.existsSync(recordsPath)) {
    records = JSON.parse(fileSystem.readFileSync(recordsPath, "utf-8"));
  }
  records.push({ depth, treasure, date: new Date().toISOString() });

  records.sort((a, b) => b.treasure - a.treasure);
  records = records.slice(0, 10);

  fileSystem.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
}

export function loadRecords() {
  const recordsPath = path.join(dataDir, "scoreboard.json");
  if (!fileSystem.existsSync(recordsPath)) return [];
  return JSON.parse(fileSystem.readFileSync(recordsPath, "utf-8"));
}
