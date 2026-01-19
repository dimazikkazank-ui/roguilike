import React from "react";
import { useInput, Box, Text } from "ink";
import { GameMode } from "./game_mode.js";

const ChooseWeapon = ({ session, triggerRender }) => {
  const weapons = session._player._backpack.items.weapon;

  useInput((input, key) => {
    const ch = input && input.toLowerCase();

    if (ch === "q") {
      session.setGameMode(session.previousGameMode);
      if (triggerRender) triggerRender((t) => (t || 0) + 1);
      return;
    }

    if (ch >= "0" && ch <= "9") {
      const digit = parseInt(ch, 10);

      if (digit === 0) {
        // снять оружие в инвентарь
        session._player.equipWeapon(null);
        session.setGameMode(session.previousGameMode);
        if (triggerRender) triggerRender((t) => (t || 0) + 1);
        return;
      }

      const idx = digit - 1; // 1 -> 0, 2 -> 1, ...
      if (idx >= 0 && idx < weapons.length) {
        session._player.equipWeapon(idx);
        session.setGameMode(session.previousGameMode);
        if (triggerRender) triggerRender((t) => (t || 0) + 1);
        return;
      }
    }
  });

  if (weapons.length === 0) {
    return (
      <Box
        borderStyle="single"
        width={40}
        height={5}
        justifyContent="center"
        alignItems="center"
      >
        <Text>No weapons in backpack! (Press 'q' to exit)</Text>
      </Box>
    );
  }

  return (
    <Box
      borderStyle="single"
      width={50}
      flexDirection="column"
      justifyContent="center"
      alignItems="flex-start"
      paddingX={2}
    >
      <Text>Выберите оружие:</Text>
      {weapons.map((weapon, index) => (
        <Text key={weapon.name}>
          {index + 1}. {weapon.name} (Str: {weapon.strength})
        </Text>
      ))}
      <Text>0 – убрать в инвентарь, 1–9 – экипировать, q – отмена</Text>
    </Box>
  );
};

export default ChooseWeapon;
