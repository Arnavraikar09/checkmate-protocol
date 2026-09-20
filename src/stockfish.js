let stockfish = null;
let ready = false;
let initializationPromise = null;


/*
  Create the Stockfish worker once.
*/

export function initializeStockfish() {
  if (stockfish && ready) {
    return Promise.resolve(stockfish);
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise((resolve, reject) => {

    stockfish = new Worker(
      "/stockfish/stockfish-18-lite-single.js"
    );


    const handleMessage = (event) => {

      const message = event.data;

      if (message === "uciok") {

        ready = true;

        stockfish.removeEventListener(
          "message",
          handleMessage
        );

        resolve(stockfish);
      }
    };


    stockfish.addEventListener(
      "message",
      handleMessage
    );


    stockfish.onerror = (error) => {

      console.error(
        "Stockfish worker error:",
        error
      );

      initializationPromise = null;

      reject(error);
    };


    stockfish.postMessage("uci");
  });


  return initializationPromise;
}


/*
  Get Stockfish's best move.

  Used by the AI player.
*/

export async function getBestMove(
  fen,
  depth = 12
) {

  const engine =
    await initializeStockfish();


  return new Promise((resolve) => {

    const handleMessage =
      (event) => {

        const message =
          event.data;


        if (
          message.startsWith(
            "bestmove"
          )
        ) {

          const bestMove =
            message.split(" ")[1];


          engine.removeEventListener(
            "message",
            handleMessage
          );


          resolve(bestMove);
        }
      };


    engine.addEventListener(
      "message",
      handleMessage
    );


    engine.postMessage(
      `position fen ${fen}`
    );


    engine.postMessage(
      `go depth ${depth}`
    );
  });
}


/*
  Evaluate a chess position.

  IMPORTANT:

  Stockfish's UCI score is relative
  to the side whose turn it is.

  Therefore we normalize the score
  into White's perspective before
  returning it.

  Example:

    White to move:
      score cp 32
      → White perspective: +0.32

    Black to move:
      score cp -36
      → White perspective: +0.36

  This gives the rest of the application
  one consistent evaluation system.
*/

export async function evaluatePosition(
  fen,
  depth = 12
) {

  const engine =
    await initializeStockfish();


  /*
    Determine whose turn it is
    from the FEN.

    FEN structure:

      board
      active color
      castling
      ...

    Example:

      "... w KQkq - 0 1"

      → White to move

      "... b KQkq - 0 1"

      → Black to move
  */

  const activeColor =
    fen.split(" ")[1];


  return new Promise((resolve) => {

    const handleMessage =
      (event) => {

        const message =
          event.data;


        /*
          Stockfish sends information
          such as:

          info depth 12 ... score cp 35 ...

          or:

          info depth 12 ... score mate 3
        */

        if (
          message.startsWith(
            "info"
          ) &&
          message.includes("score")
        ) {

          const scoreMatch =
            message.match(
              /score (cp|mate) (-?\d+)/
            );


          if (!scoreMatch) {
            return;
          }


          const scoreType =
            scoreMatch[1];


          const scoreValue =
            Number(
              scoreMatch[2]
            );


          /*
            Convert centipawns into
            pawn units.
          */

          if (
            scoreType === "cp"
          ) {

            latestEvaluation =
              normalizeScoreToWhite(
                scoreValue / 100,
                activeColor
              );
          }


          /*
            Normalize mate score
            to White's perspective.
          */

          if (
            scoreType === "mate"
          ) {

            latestEvaluation = null;

            latestMate =
              normalizeScoreToWhite(
                scoreValue,
                activeColor
              );
          }
        }


        /*
          Final result arrives with
          bestmove.
        */

        if (
          message.startsWith(
            "bestmove"
          )
        ) {

          engine.removeEventListener(
            "message",
            handleMessage
          );


          resolve({

            evaluation:
              latestEvaluation,

            mate:
              latestMate,

            bestMove:
              message.split(" ")[1],

          });
        }
      };


    let latestEvaluation = null;
    let latestMate = null;


    engine.addEventListener(
      "message",
      handleMessage
    );


    engine.postMessage(
      `position fen ${fen}`
    );


    engine.postMessage(
      `go depth ${depth}`
    );
  });
}


/*
  Normalize a Stockfish score
  into White's perspective.

  Stockfish score:

    White to move:
      positive → White is better

    Black to move:
      positive → Black is better

  Therefore Black-to-move scores
  must be inverted.
*/

function normalizeScoreToWhite(
  score,
  activeColor
) {

  if (
    activeColor === "b"
  ) {
    return -score;
  }

  return score;
}