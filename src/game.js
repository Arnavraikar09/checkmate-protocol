import { Chess } from "chess.js";

export function createGame() {
  return new Chess();
}

export function getGameStatus(game) {
  const turn = game.turn() === "w" ? "White" : "Black";

  if (game.isCheckmate()) {
    return `Checkmate — ${
      turn === "White" ? "Black" : "White"
    } wins`;
  }

  if (game.isDraw()) {
    return "Draw";
  }

  if (game.isCheck()) {
    return `${turn} is in check`;
  }

  return `${turn}'s turn`;
}

export function makeMove(
  game,
  from,
  to,
  promotion = undefined
) {
  try {
    const newGame = new Chess();

    // Rebuild the complete existing game.
    // Verbose history preserves promotion information.
    const history = game.history({ verbose: true });

    for (const move of history) {
      newGame.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
    }

    // Make the new move and store chess.js move data.
    const move = newGame.move({
      from,
      to,
      ...(promotion ? { promotion } : {}),
    });

    // Return both the updated game and move information.
    return {
      game: newGame,
      move,
    };
  } catch {
    return null;
  }
}

export function resetGame() {
  return new Chess();
}