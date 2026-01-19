import React, { useState } from "react";
import { MainRender } from "../presentation/presentation.js";
import InputMovement from "./input_movement.js";
import ChooseItem from "./choose_item.js";
import ChooseWeapon from "./choose_weapon.js";
import InputBattle from "./input_battle.js";
import { GameMode } from "./game_mode.js";

let GameController = ({ session }) => {
  const [, setForceUpdate] = useState(0);

  return (
    <MainRender session={session}>
      {session.gameMode === GameMode.MOVEMENT && (
        <InputMovement session={session} triggerRender={setForceUpdate} />
      )}
      {session.gameMode === GameMode.CHOOSE_ITEM && (
        <ChooseItem session={session} triggerRender={setForceUpdate} />
      )}
      {session.gameMode === GameMode.CHOOSE_WEAPON && (
        <ChooseWeapon session={session} triggerRender={setForceUpdate} />
      )}
      {session.gameMode === GameMode.BATTLE && (
        <InputBattle session={session} triggerRender={setForceUpdate} />
      )}
    </MainRender>
  );
};

export default GameController;
