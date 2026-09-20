const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export function calculateMaterial(game) {
  let white = 0;
  let black = 0;

  const board = game.board();

  for (const row of board) {
    for (const piece of row) {
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type];

      if (piece.color === "w") {
        white += value;
      } else {
        black += value;
      }
    }
  }

  return {
    white,
    black,
    advantage: white - black,
  };
}

export function analyzeMaterial(
  beforeGame,
  afterGame,
  move,
  playerColor
) {
  const events = [];

  const before = calculateMaterial(beforeGame);
  const after = calculateMaterial(afterGame);

  const playerBefore =
    playerColor === "w"
      ? before.white
      : before.black;

  const playerAfter =
    playerColor === "w"
      ? after.white
      : after.black;

  const materialChange =
    playerAfter - playerBefore;

  if (move.captured) {
    const capturedValue =
      PIECE_VALUES[move.captured];

    const capturedByPlayer =
      move.color === playerColor;

    events.push({
      type: "material_change",
      category: "material",
      data: {
        capturedPiece: move.captured,
        value: capturedValue,
        side: capturedByPlayer
          ? "player"
          : "ai",
      },
    });
  }

  if (
    move.captured === "q"
  ) {
    events.push({
      type:
        move.color === playerColor
          ? "player_captured_queen"
          : "player_lost_queen",
      category: "material",
      data: {
        value: 9,
      },
    });
  }

  if (
    move.captured === "r"
  ) {
    events.push({
      type:
        move.color === playerColor
          ? "player_captured_rook"
          : "player_lost_rook",
      category: "material",
      data: {
        value: 5,
      },
    });
  }

  if (materialChange !== 0) {
    events.push({
      type: "material_balance",
      category: "material",
      data: {
        before: playerBefore,
        after: playerAfter,
        change: materialChange,
      },
    });
  }

  return {
    before,
    after,
    events,
  };
}