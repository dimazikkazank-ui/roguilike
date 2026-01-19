import React, { useEffect } from "react";
import { useInput, Box, Text } from "ink";
import { GameMode } from "./game_mode.js";

const InputBattle = ({ session, triggerRender }) => {
  const player = session._player;

  const battleActions = [
    { name: "Attack" },
    { name: "Block" },
    { name: "Throw Weapon" },
    // { name: "Auto-Battle" },
  ];

  const handlePlayerTurnEnd = () => {
    session.performEnemyAttack();
    session.tickBattle();
  };

  // Auto-battle effect
  // useEffect(() => {
  //   if (
  //     session.autoBattleActive &&
  //     session.playerActionState === "awaiting_input"
  //   ) {
  //     const autoBattleTurn = setTimeout(() => {
  //       const enemyDefeated = session.performAutoBattleAttack();

  //       if (!enemyDefeated) {
  //         handlePlayerTurnEnd();
  //       } else {
  //         session.setPlayerActionState("awaiting_input");
  //       }

  //       if (triggerRender) triggerRender((t) => (t || 0) + 1);
  //     }, 1000);

  //     return () => clearTimeout(autoBattleTurn);
  //   }
  // }, [
  //   session.autoBattleActive,
  //   session.playerActionState,
  //   player,
  //   session,
  //   handlePlayerTurnEnd,
  // ]);

  useEffect(() => {
    if (session.pendingTurnEnd) {
      session.setPendingTurnEnd(false);
      handlePlayerTurnEnd();
      if (triggerRender) triggerRender((t) => (t || 0) + 1);
    }
  }, [session.pendingTurnEnd, session, handlePlayerTurnEnd, triggerRender]);

  const handleAttack = () => {
    const enemyDefeated = session.performPlayerAttack();
    if (!enemyDefeated) {
      handlePlayerTurnEnd();
    } else {
    }
  };

  const handleBlock = () => {
    session.performPlayerBlock();
    handlePlayerTurnEnd();
  };

  const handleThrowWeapon = () => {
    session.setSelectionMode("weapon_throw");
    session.setGameMode(GameMode.CHOOSE_ITEM);
    if (triggerRender) triggerRender((t) => (t || 0) + 1);
  };

  // const handleAutoBattle = () => {
  //   session.setAutoBattleActive(true);
  //   session._logs.push("Auto-battle activated.");
  //   handlePlayerTurnEnd();
  // };

  useInput((input, key) => {
    const ch = input && input.toLowerCase();

    const simpleKeyHandlers = {
      x: () => {
        if (session && session._logs)
          session._logs.push(
            "Forced end: player conceded. Progress will NOT be saved."
          );
        if (session && typeof session.endGame === "function") session.endGame();
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

    const numActions = battleActions.length;
    if (key.upArrow) {
      session.setSelectedBattleActionIndex(
        Math.max(0, session.selectedBattleActionIndex - 1)
      );
    } else if (key.downArrow) {
      session.setSelectedBattleActionIndex(
        Math.min(numActions - 1, session.selectedBattleActionIndex + 1)
      );
    } else if (key.return) {
      const selectedAction = battleActions[session.selectedBattleActionIndex];
      const actionMap = {
        "Throw Weapon": handleThrowWeapon,
        Attack: handleAttack,
        Block: handleBlock,
        // "Auto-Battle": handleAutoBattle,
      };
      const fn = actionMap[selectedAction.name];
      if (fn) fn();
    }

    session.tickBattle();
    if (triggerRender) triggerRender((t) => (t || 0) + 1);
  });
  // Render is handled in Presentation component
  return null;
};

export default InputBattle;
