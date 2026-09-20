export function analyzeMove(game, move) {
  const events = [];

  const moveData = {
    from: move.from,
    to: move.to,
    piece: move.piece,
    color: move.color,
    san: move.san,
    captured: move.captured || null,
    promotion: move.promotion || null,
    flags: move.flags,
    moveNumber: game.moveNumber(),
  };

  /*
    BASIC MOVE EVENT

    Every valid move creates this event.
  */

  events.push({
    type: "move",
    category: "basic",
    data: {
      piece: move.piece,
      from: move.from,
      to: move.to,
    },
  });

  /*
    CAPTURE
  */

  if (move.captured) {
    events.push({
      type: "capture",
      category: "material",
      data: {
        capturedPiece: move.captured,
        capturedColor:
          move.color === "w" ? "b" : "w",
        byPiece: move.piece,
      },
    });
  }

  /*
    EN PASSANT

    chess.js marks en passant moves with "e"
    inside the flags string.
  */

  if (move.flags.includes("e")) {
    events.push({
      type: "en_passant",
      category: "special",
      data: {
        from: move.from,
        to: move.to,
      },
    });
  }

  /*
    CASTLING

    "k" = kingside castle
    "q" = queenside castle
  */

  if (move.flags.includes("k")) {
    events.push({
      type: "castle",
      category: "special",
      data: {
        side: "kingside",
        color: move.color,
      },
    });
  }

  if (move.flags.includes("q")) {
    events.push({
      type: "castle",
      category: "special",
      data: {
        side: "queenside",
        color: move.color,
      },
    });
  }

  /*
    PROMOTION
  */

  if (move.promotion) {
    events.push({
      type: "promotion",
      category: "special",
      data: {
        fromPiece: "p",
        toPiece: move.promotion,
        color: move.color,
      },
    });
  }

  /*
    CHECK

    Important:
    The move has already been made when this
    function is called.

    Therefore game.isCheck() tells us whether
    the player whose turn is NEXT is in check.
  */

  if (game.isCheck()) {
    events.push({
      type: "check",
      category: "position",
      data: {
        checkingColor: move.color,
        checkedColor:
          move.color === "w" ? "b" : "w",
      },
    });
  }

  /*
    CHECKMATE
  */

  if (game.isCheckmate()) {
    events.push({
      type: "checkmate",
      category: "game_end",
      data: {
        winner: move.color,
        loser:
          move.color === "w" ? "b" : "w",
      },
    });
  }

  /*
    DRAW
  */

  if (game.isDraw() && !game.isCheckmate()) {
    events.push({
      type: "draw",
      category: "game_end",
      data: {
        reason: getDrawReason(game),
      },
    });
  }

  return {
    move: moveData,
    events,
  };
}


/*
  Determine the type of draw.

  This is kept separate because chess.js
  provides different methods for different
  draw conditions.
*/

function getDrawReason(game) {
  if (game.isStalemate()) {
    return "stalemate";
  }

  if (game.isThreefoldRepetition()) {
    return "threefold_repetition";
  }

  if (game.isInsufficientMaterial()) {
    return "insufficient_material";
  }

  if (game.isDrawByFiftyMoves()) {
    return "fifty_move_rule";
  }

  return "draw";
}