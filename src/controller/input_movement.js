import { useInput } from "ink";
import React from "react";
import { GameMode } from "./game_mode.js";
import { saveSession, resetSession } from "../datalayer/data_actions.js";

const InputMovement = ({ session, triggerRender }) => {
  useInput((input, key) => {
    const ch = input && input.toLowerCase();
    if (session._gameOver) {
      if (ch === "r") {
        session.restartGame();
        if (triggerRender) triggerRender((t) => (t || 0) + 1);
      }
      return;
    }
    if (session && session.logs) {
      const currentRoom = session.level._currentLocation;
      const simpleKeyHandlers = {
        q: () => {
          saveSession(session);
          process.exit(0);
        },
        x: () => {
          resetSession(session);
          if (session && session.logs)
            session.logs.push(
              "Прогресс сброшен! При перезапуске — новая игра."
            );
          if (session && typeof session.endGame === "function")
            session.endGame();
          process.exit(0);
        },
        j: () => {
          session.setSelectionMode("food");
          session.setGameMode(GameMode.CHOOSE_ITEM);
          if (triggerRender) triggerRender((t) => (t || 0) + 1);
        },
        k: () => {
          session.setSelectionMode("elixir");
          session.setGameMode(GameMode.CHOOSE_ITEM);
          if (triggerRender) triggerRender((t) => (t || 0) + 1);
        },
        e: () => {
          session.setSelectionMode("scroll");
          session.setGameMode(GameMode.CHOOSE_ITEM);
          if (triggerRender) triggerRender((t) => (t || 0) + 1);
        },
        h: () => {
          session.setGameMode(GameMode.CHOOSE_WEAPON);
          if (triggerRender) triggerRender((t) => (t || 0) + 1);
        },
        d: () => {
          session.setSelectionMode("weapon_drop");
          session.setGameMode(GameMode.CHOOSE_ITEM);
          if (triggerRender) triggerRender((t) => (t || 0) + 1);
        },
      };

      if (ch && simpleKeyHandlers[ch]) {
        simpleKeyHandlers[ch]();
        return;
      }

      // Enemy movement phase (before player moves)
      if (
        currentRoom._enemies &&
        Object.keys(currentRoom._enemies).length > 0
      ) {
        for (const k in currentRoom._enemies) {
          const enemy = currentRoom._enemies[k];
          if (enemy) enemy.step();
        }
      }

      let moveResult = { action: "none" };
      if (key.upArrow) moveResult = session._player.onMove("up");
      else if (key.downArrow) moveResult = session._player.onMove("down");
      else if (key.leftArrow) moveResult = session._player.onMove("left");
      else if (key.rightArrow) moveResult = session._player.onMove("right");

      if (moveResult && moveResult.action === "enemy_encounter") {
        session.setGameMode(GameMode.BATTLE);
        session.setBattleEnemy(moveResult.enemy);
      }

      if (moveResult && moveResult.action === "boundary") {
        session.changeRoom(moveResult.newPos);
        moveResult.action = "moved";
      }

      session._player.updateBuffs();

      // Trigger parent re-render so MainRender reflects session changes
      if (triggerRender) triggerRender((t) => (t || 0) + 1);
    }
  });

  return null;
};

export default InputMovement;
