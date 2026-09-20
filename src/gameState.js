export function createGameState() {
  return {
    score: 0,

    streak: 0,

    movesPlayed: 0,

    playerMoves: 0,

    aiMoves: 0,

    captures: {
      player: 0,
      ai: 0,
    },

    checks: {
      player: 0,
      ai: 0,
    },

    eventsTriggered: [],

    matchStatus: "active",
  };
}

export function updateGameState(
  currentState,
  analysis,
  playerColor
) {
  const newState = {
    ...currentState,

    captures: {
      ...currentState.captures,
    },

    checks: {
      ...currentState.checks,
    },

    eventsTriggered: [
      ...currentState.eventsTriggered,
    ],
  };

  const move = analysis.move;
  const events = analysis.events;

  const isPlayerMove =
    move.color === playerColor;

  newState.movesPlayed += 1;

  if (isPlayerMove) {
    newState.playerMoves += 1;
  } else {
    newState.aiMoves += 1;
  }

  for (const event of events) {
    newState.eventsTriggered.push({
      
      ply: newState.movesPlayed,
      player:
        move.color === "w"
          ? "White"
          : "Black",
    });

    if (event.type === "capture") {
      if (isPlayerMove) {
        newState.captures.player += 1;
      } else {
        newState.captures.ai += 1;
      }
    }

    if (event.type === "check") {
      if (isPlayerMove) {
        newState.checks.player += 1;
      } else {
        newState.checks.ai += 1;
      }
    }
  }

  return newState;
}

export function endGameState(
  currentState,
  result
) {
  return {
    ...currentState,

    matchStatus: "finished",

    result,
  };
}