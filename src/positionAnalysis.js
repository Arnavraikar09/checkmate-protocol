const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/**
 * Analyze the chess position before and after a move.
 *
 * This system focuses on:
 * - King safety
 * - Checks
 * - Attacked kings
 * - Material advantage
 * - Position improvement/deterioration
 * - Critical positions
 * - Comeback situations
 */

export function analyzePosition(
  beforeGame,
  afterGame,
  move,
  playerColor
) {
  const events = [];

  const opponentColor =
    playerColor === "w" ? "b" : "w";

  /*
   * POSITION SNAPSHOTS
   */

  const beforePosition = getPositionSnapshot(
    beforeGame,
    playerColor
  );

  const afterPosition = getPositionSnapshot(
    afterGame,
    playerColor
  );

  /*
   * MATERIAL CHANGE
   */

  const materialChange =
    afterPosition.materialAdvantage -
    beforePosition.materialAdvantage;

  /*
   * KING SAFETY
   */

  if (
    afterPosition.playerKingInCheck &&
    !beforePosition.playerKingInCheck
  ) {
    events.push({
      type: "player_under_attack",
      category: "position",
      data: {
        attackType: "check",
        severity: "high",
      },
    });
  }

  if (
    afterPosition.opponentKingInCheck &&
    !beforePosition.opponentKingInCheck
  ) {
    events.push({
      type: "opponent_under_attack",
      category: "position",
      data: {
        attackType: "check",
        severity: "high",
      },
    });
  }

  /*
   * KING SAFETY CHANGES
   */

  if (
    afterPosition.playerKingInCheck &&
    beforePosition.playerKingInCheck
  ) {
    events.push({
      type: "player_under_attack",
      category: "position",
      data: {
        attackType: "continued_check",
        severity: "high",
      },
    });
  }

  /*
   * MATERIAL POSITION
   */

  if (materialChange > 0) {
    events.push({
      type: "position_improving",
      category: "position",
      data: {
        reason: "material_gain",
        change: materialChange,
      },
    });
  }

  if (materialChange < 0) {
    events.push({
      type: "position_deteriorating",
      category: "position",
      data: {
        reason: "material_loss",
        change: materialChange,
      },
    });
  }

  /*
   * CRITICAL POSITION
   *
   * A position becomes critical when:
   * - Player is in check
   * - Large material disadvantage exists
   * - Large material advantage exists
   */

  if (afterPosition.playerKingInCheck) {
    events.push({
      type: "critical_position",
      category: "position",
      data: {
        reason: "player_king_in_check",
      },
    });
  }

  if (
    afterPosition.materialAdvantage <= -9
  ) {
    events.push({
      type: "critical_position",
      category: "position",
      data: {
        reason: "major_material_disadvantage",
        materialAdvantage:
          afterPosition.materialAdvantage,
      },
    });
  }

  if (
    afterPosition.materialAdvantage >= 9
  ) {
    events.push({
      type: "critical_position",
      category: "position",
      data: {
        reason: "major_material_advantage",
        materialAdvantage:
          afterPosition.materialAdvantage,
      },
    });
  }

  /*
   * COMEBACK DETECTION
   *
   * Player was materially behind,
   * then improves the position.
   */

  if (
    beforePosition.materialAdvantage < 0 &&
    afterPosition.materialAdvantage >
      beforePosition.materialAdvantage
  ) {
    events.push({
      type: "comeback",
      category: "position",
      data: {
        previousAdvantage:
          beforePosition.materialAdvantage,
        currentAdvantage:
          afterPosition.materialAdvantage,
        recovery:
          afterPosition.materialAdvantage -
          beforePosition.materialAdvantage,
      },
    });
  }

  /*
   * RECOVERY FROM CHECK
   */

  if (
    beforePosition.playerKingInCheck &&
    !afterPosition.playerKingInCheck
  ) {
    events.push({
      type: "position_recovered",
      category: "position",
      data: {
        reason: "check_resolved",
      },
    });
  }

  /*
   * POSITION STATUS
   */

  const status = determinePositionStatus(
    afterPosition
  );

  return {
    before: beforePosition,
    after: afterPosition,
    status,
    events,
  };
}

/**
 * Create a compact snapshot of the current position.
 */
function getPositionSnapshot(
  game,
  playerColor
) {
  const opponentColor =
    playerColor === "w" ? "b" : "w";

  const playerKingSquare =
    findKingSquare(
      game,
      playerColor
    );

  const opponentKingSquare =
    findKingSquare(
      game,
      opponentColor
    );

  const playerMaterial =
    calculateMaterialForColor(
      game,
      playerColor
    );

  const opponentMaterial =
    calculateMaterialForColor(
      game,
      opponentColor
    );

  const materialAdvantage =
    playerMaterial -
    opponentMaterial;

  /*
   * chess.js reports check for the
   * side whose turn it currently is.
   *
   * Therefore we combine isCheck()
   * with game.turn() to determine
   * which side is in check.
   */

  const playerKingInCheck =
    game.isCheck() &&
    game.turn() === playerColor;

  const opponentKingInCheck =
    game.isCheck() &&
    game.turn() === opponentColor;

  return {
    playerKingSquare,
    opponentKingSquare,

    playerKingInCheck,
    opponentKingInCheck,

    playerMaterial,
    opponentMaterial,

    materialAdvantage,
  };
}

/**
 * Find the king's square.
 */
function findKingSquare(
  game,
  color
) {
  const board = game.board();

  for (
    let rank = 0;
    rank < board.length;
    rank++
  ) {
    for (
      let file = 0;
      file < board[rank].length;
      file++
    ) {
      const piece =
        board[rank][file];

      if (
        piece &&
        piece.type === "k" &&
        piece.color === color
      ) {
        return (
          String.fromCharCode(
            97 + file
          ) +
          (8 - rank)
        );
      }
    }
  }

  return null;
}

/**
 * Calculate material for one side.
 */
function calculateMaterialForColor(
  game,
  color
) {
  let total = 0;

  const board = game.board();

  for (const row of board) {
    for (const piece of row) {
      if (!piece) {
        continue;
      }

      if (piece.color !== color) {
        continue;
      }

      total +=
        PIECE_VALUES[piece.type];
    }
  }

  return total;
}

/**
 * Determine the broad state of the position.
 */
function determinePositionStatus(
  position
) {
  if (
    position.playerKingInCheck
  ) {
    return "critical";
  }

  if (
    position.materialAdvantage <= -9
  ) {
    return "losing";
  }

  if (
    position.materialAdvantage >= 9
  ) {
    return "winning";
  }

  if (
    position.materialAdvantage < 0
  ) {
    return "disadvantage";
  }

  if (
    position.materialAdvantage > 0
  ) {
    return "advantage";
  }

  return "balanced";
}