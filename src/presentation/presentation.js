// ОТРИСОВКА
const HEADER_ART = `▗▄▄▖  ▗▄▖  ▗▄▄▖▗▖ ▗▖▗▄▄▄▖
▐▌ ▐▌▐▌ ▐▌▐▌   ▐▌ ▐▌▐▌   
▐▛▀▚▖▐▌ ▐▌▐▌▝▜▌▐▌ ▐▌▐▛▀▀▘
▐▌ ▐▌▝▚▄▞▘▝▚▄▞▘▝▚▄▞▘▐▙▄▄▖`;

import React from "react";
import { Box, Text, Spacer } from "ink";
import { loadRecords } from "../datalayer/data_actions.js";

//игрок
const PlayerRender = ({ player }) => {
  return (
    <Box
      borderStyle="round"
      borderColor="#722F37"
      flexDirection="column"
      marginBottom={1}
    >
      <Text backgroundColor="#722F37" color="white">
        ХАРАКЕРИСТИКА ИГРОКА:
      </Text>
      <Box>
        <Text color="#F8F3ED">🩸 ЗДОРОВЬЕ:</Text>
        <Text color="#f98888ff">
          {player.health} / {player.maxHealth}
        </Text>
      </Box>
      <Box>
        <Text color="#F8F3ED">🌀 ЛОВКОСТЬ:</Text>
        <Text color="#f98888ff">{player.agility}</Text>
      </Box>
      <Box>
        <Text color="#F8F3ED">💪 СИЛА:</Text>
        <Text color="#f98888ff">{player.strength}</Text>
      </Box>
      <Box>
        <Text color="#F8F3ED">🪓 ЭКИПИРОВАННОЕ ОРУЖИЕ:</Text>
        <Text color="#f98888ff">
          {player.equippedWeapon ? player.equippedWeapon.name : "Нет"}
        </Text>
      </Box>
      <Box>
        <Text color="#F8F3ED">💥 УРОН:</Text>
        <Text color="#f98888ff">{player.getTotalDamage()}</Text>
      </Box>

      {player._activeBuffs && player._activeBuffs.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="#F8F3ED">🧪 ЭФФЕКТЫ ЭЛИКСИРОВ:</Text>
          {player._activeBuffs.map((buff, i) => (
            <Text key={i} color="#f9db80ff">
              {buff.name} (+{buff.increase} {buff.stat}, {buff.turnsLeft} c)
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

const EnemyRender = ({ enemy }) => {
  return (
    <Box
      borderStyle="round"
      borderColor="red"
      flexDirection="column"
      marginBottom={1}
    >
      <Text backgroundColor="red" color="white">
        ПРОТИВНИК:
      </Text>
      {enemy && (
        <>
          <Box>
            <Text color="#F8F3ED">Имя:</Text>
            <Text color="#f98888ff">{enemy.name}</Text>
          </Box>
          <Box>
            <Text color="#F8F3ED">🩸 ЗДОРОВЬЕ:</Text>
            <Text color="#f98888ff">
              {enemy.health} / {enemy.maxHealth}
            </Text>
          </Box>
          <Box>
            <Text color="#F8F3ED">🌀 ЛОВКОСТЬ:</Text>
            <Text color="#f98888ff">{enemy.agility}</Text>
          </Box>
          <Box>
            <Text color="#F8F3ED">💪 СИЛА:</Text>
            <Text color="#f98888ff">{enemy.strength}</Text>
          </Box>
        </>
      )}
      {!enemy && <Text color="#f98888ff">Нет противника рядом.</Text>}
    </Box>
  );
};

const BattleActionsRender = ({ session }) => {
  const battleActions = [
    { name: "Attack" },
    { name: "Block" },
    { name: "Throw Weapon" },
    // { name: "Auto-Battle" },
  ];

  return (
    <Box
      borderStyle="single"
      width={40}
      height={12}
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      paddingX={2}
    >
      <Text bold color="yellow">
        Battle Actions:
      </Text>
      {battleActions.map((action, index) => (
        <Text
          key={action.name}
          color={
            index === session.selectedBattleActionIndex ? "green" : "white"
          }
        >
          {index === session.selectedBattleActionIndex ? "> " : "  "}
          {action.name}
        </Text>
      ))}
      <Box marginTop={1}>
        <Text color="gray">
          (Up/Down: Navigate, Enter: Select, q: Exit, x: Surrender (progress
          will be lost))
        </Text>
      </Box>
    </Box>
  );
};

// инвентарь
const ConsumableRender = ({ backpack }) => {
  const foodCount = backpack.items.food.length;
  const elixirCount = backpack.items.elixir.length;
  const scrollCount = backpack.items.scroll.length;
  const weaponCount = backpack.items.weapon.length;
  const treasureCount = backpack.items.treasure.count;

  return (
    <Box borderStyle="round" borderColor="#722F37" flexDirection="column">
      <Text backgroundColor="#722F37" color="white">
        ИНВЕНТАРЬ:
      </Text>
      <Text color="#faf9f6ff">💰 Сокровища: [{treasureCount}]</Text>
      <Text color="#f9db80ff">[{backpack.items.treasure.value}] золота </Text>

      <Box>
        <Text color="#F8F3ED">🍎 ЕДА (J) [{foodCount}/9]:</Text>
        <Box flexDirection="column">
          {foodCount > 0 ? (
            backpack.items.food.map((item, i) => (
              <Text color="#ffc6a9ff" key={`food-${i}`}>
                {item.name} (+{item.toRegen} HP)
              </Text>
            ))
          ) : (
            <Text italic>пусто</Text>
          )}
        </Box>
      </Box>

      <Box>
        <Text color="#F8F3ED">🧪 ЭЛИКСИР (K) [{elixirCount}/9]:</Text>
        <Box flexDirection="column">
          {elixirCount > 0 ? (
            backpack.items.elixir.map((item, i) => (
              <Text color="#ffc6a9ff" key={`elixir-${i}`}>
                {item.name} ({item.increase} {item.stat}, {item.duration}s)
              </Text>
            ))
          ) : (
            <Text italic>пусто</Text>
          )}
        </Box>
      </Box>

      <Box>
        <Text color="#F8F3ED">📜 СВИТКИ (E) [{scrollCount}/9]:</Text>
        <Box flexDirection="column">
          {scrollCount > 0 ? (
            backpack.items.scroll.map((item, i) => (
              <Text color="#ffc6a9ff" key={`scroll-${i}`}>
                {item.name} (+{item.increase} {item.stat} permanent)
              </Text>
            ))
          ) : (
            <Text italic>пусто</Text>
          )}
        </Box>
      </Box>

      <Box>
        <Text color="#F8F3ED">🪓 ОРУЖИЕ (H) [{weaponCount}/9]:</Text>
        <Box flexDirection="column">
          {weaponCount > 0 ? (
            backpack.items.weapon.map((item, i) => (
              <Text color="#ffc6a9ff" key={`weapon-${i}`}>
                {item.name} ({item.strength} STR)
              </Text>
            ))
          ) : (
            <Text italic>пусто</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const LocationRender = ({ location, session }) => {
  return (
    <Box
      borderStyle="round"
      borderColor="blue"
      flexDirection="column"
      alignItems="center"
    >
      <Text>{location}</Text>
    </Box>
  );
};

const LevelMapRender = ({ level, session }) => {
  const records = loadRecords();
  return (
    <Box flexDirection="row">
      <Box borderStyle="round" borderColor="green" flexDirection="column">
        <Text backgroundColor="green" color="#FFFFFF">
          КАРТА:
        </Text>
        <Text>{level.renderLevelMap()}</Text>
      </Box>

      <Box
        borderStyle="round"
        borderColor="yellow"
        flexDirection="column"
        width={28}
        paddingX={1}
      >
        <Text backgroundColor="yellow" color="#000000">
          🏆 РЕКОРДЫ
        </Text>
        {records.length === 0 ? (
          <Text>Нет рекордов</Text>
        ) : (
          records.slice(0, 8).map((record, index) => (
            <Text key={index}>
              {index + 1}. {record.treasure}з ур.{record.depth}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
};

const LogHolder = ({ logs = [] }) => {
  const lastLogs = logs.slice(-4);
  return (
    <Box
      borderStyle="round"
      borderColor="grey"
      flexDirection="column"
      marginTop={1}
    >
      <Text dimColor>ЛОГ СОБЫТИЙ:</Text>
      <Box flexDirection="column" marginLeft={1}>
        {lastLogs.map((entry, i) => (
          <Text key={i} dimColor>
            {entry}
          </Text>
        ))}
      </Box>
    </Box>
  );
};

const colorizeEnemiesInString = (str) => {
  const enemyColors = {
    z: "\x1b[32m", // green
    v: "\x1b[31m", // red
    g: "\x1b[37m", // white
    O: "\x1b[33m", // yellow
    s: "\x1b[37m", // white
    m: "\x1b[37m", // white
  };
  const reset = "\x1b[0m";

  let result = "";
  for (const ch of str) {
    const color = enemyColors[ch];
    if (color) {
      result += color + ch + reset;
    } else {
      result += ch;
    }
  }
  return result;
};

export const MainRender = ({ session, children }) => {
  const full = session._currLevel.renderFullLevel();
  const colorized = full.split("\n").map(colorizeEnemiesInString).join("\n");

  return (
    <Box flexDirection="column" alignItems="center">
      <Text>{HEADER_ART}</Text>
      <Box
        flexDirection="row"
        width="100%"
        justifyContent="space-between"
        paddingX={1}
      >
        <Box flexDirection="column" width="25%" marginRight={1}>
          <PlayerRender player={session._player} />
          <ConsumableRender backpack={session._player._backpack} />
        </Box>

        <Box flexDirection="column" width="45%" marginX={1}>
          <Text alignSelf="center">УРОВЕНЬ: {session.depth} / 21</Text>
          <LocationRender location={colorized} session={session} />
          <LogHolder logs={session._logs} />
        </Box>

        <Box flexDirection="column" width="25%" marginLeft={1}>
          <EnemyRender enemy={session.battleEnemy} />
          <BattleActionsRender session={session} />
          <Spacer />
          <LevelMapRender level={session._currLevel} />
        </Box>
      </Box>
      {/* Render children so input-handling components (useInput) mount */}
      {children}
    </Box>
  );
};
