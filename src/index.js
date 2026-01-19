import { GameSession } from "./domain/game_session.js";
import { render } from "ink";
import React from "react";
import GameController from "./controller/game_controller.js";
import { loadSession } from "./datalayer/data_actions.js";

const session = new GameSession();

try {
	// Attempt to load a previously saved session (if present)
	loadSession(session);
} catch (err) {
	// If loading fails, log and continue with a fresh session
	if (session && session._logs) session._logs.push(`Failed to load saved session: ${err.message}`);
}

render(<GameController session={session} />);
