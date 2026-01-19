import React from "react";
import { Box, Text, useInput } from "ink";
import { GameMode } from "./game_mode.js";

const ChooseItem = ({ session, triggerRender }) => {
  const player = session._player;
  const mode = session.selectionMode;

  let items = [];
  let title = "";

  if (mode === "food") {
    items = player._backpack.items.food;
    title = "Выберите еду (1–9):";
  } else if (mode === "elixir") {
    items = player._backpack.items.elixir;
    title = "Выберите эликсир (1–9):";
  } else if (mode === "scroll") {
    items = player._backpack.items.scroll;
    title = "Выберите свиток (1–9):";
  } else if (mode === "weapon_drop" || mode === "weapon_throw") {
    items = player._backpack.items.weapon;
    title = "Выберите оружие для выброса (1–9):";
  }

  useInput((input) => {
    const ch = input && input.toLowerCase();

    if (ch === "q") {
      // отмена
      session.setSelectionMode(null);
      session.setGameMode(session.previousGameMode);
      if (triggerRender) triggerRender((t) => (t || 0) + 1);
      return;
    }

    if (ch >= "1" && ch <= "9") {
      const idx = parseInt(ch, 10) - 1;

      if (mode === "food") {
        player.useFood(idx);
      } else if (mode === "elixir") {
        player.useElixir(idx);
      } else if (mode === "scroll") {
        player.useScroll(idx);
      } else if (mode === "weapon_drop") {
        player.dropWeapon(idx);
      } else if (mode === "weapon_throw") {
        const enemyDefeated = session.performPlayerThrowWeapon(idx);
        if (!enemyDefeated) {
          session.setPendingTurnEnd(true); // Flag that we need to end the turn
        }
      }

      session.setSelectionMode(null);
      session.setGameMode(session.previousGameMode);
      if (triggerRender) triggerRender((t) => (t || 0) + 1);
    }
  });

  if (!items || items.length === 0) {
    return (
      <Box
        borderStyle="single"
        width={40}
        height={5}
        justifyContent="center"
        alignItems="center"
      >
        <Text>Нет предметов этого типа (q – отмена)</Text>
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
      <Text>{title}</Text>
      {items.map((item, i) => (
        <Text key={i}>
          {i + 1}. {mode === "food" && `${item.name} (+${item.toRegen} HP)`}
          {mode === "elixir" &&
            `${item.name} (${item.increase} ${item.stat}, ${item.duration}s)`}
          {mode === "scroll" &&
            `${item.name} (+${item.increase} ${item.stat} permanent)`}
          {(mode === "weapon_drop" || mode === "weapon_throw") &&
            `${item.name} (Str: ${item.strength})`}
        </Text>
      ))}
      <Text>(1–9 – выбрать, q – отмена)</Text>
    </Box>
  );
};

export default ChooseItem;
