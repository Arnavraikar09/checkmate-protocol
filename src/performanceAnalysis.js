import {
  evaluatePosition,
} from "./stockfish";


/*
  Performance classification thresholds.

  These values represent the amount of
  evaluation the player loses compared
  with the position before their move.

  Negative evaluation loss means the
  player improved the position.
*/

const THRESHOLDS = {
  best: 0.05,
  excellent: 0.15,
  good: 0.35,
  inaccuracy: 0.75,
  mistake: 1.50,
};


/*
  Analyze the quality of a player's move.

  The position before and after the
  move are evaluated by Stockfish.

  The difference between those
  evaluations determines move quality.
*/

export async function analyzePerformance(
  beforeGame,
  afterGame,
  move,
  playerColor,
  depth = 12
) {

  /*
    Only evaluate the player's moves.

    AI moves are not currently graded
    as player performance.
  */

  if (
    move.color !== playerColor
  ) {
    return {
      evaluated: false,

      evaluationBefore: null,
      evaluationAfter: null,

      evaluationLoss: null,

      bestMove: null,

      classification:
        "not_applicable",

      events: [],
    };
  }


  /*
    Evaluate the position BEFORE
    the player's move.
  */

  const beforeEvaluation =
    await evaluatePosition(
      beforeGame.fen(),
      depth
    );


  /*
    Evaluate the position AFTER
    the player's move.
  */

  const afterEvaluation =
    await evaluatePosition(
      afterGame.fen(),
      depth
    );


  /*
    Convert both evaluations into
    the player's perspective.

    Stockfish.js normalizes scores
    into White's perspective first.

    Therefore:

      White → same value
      Black → inverted value
  */

  const evaluationBefore =
    convertToPlayerPerspective(
      beforeEvaluation,
      playerColor
    );


  const evaluationAfter =
    convertToPlayerPerspective(
      afterEvaluation,
      playerColor
    );


  /*
    Calculate how much evaluation
    the player lost.

    Positive:
      position became worse

    Negative:
      position improved

    Zero:
      no meaningful change
  */

  const evaluationLoss =
    calculateEvaluationLoss(
      evaluationBefore,
      evaluationAfter
    );


  /*
    Determine move quality.
  */

  const classification =
    classifyMove(
      evaluationLoss
    );


  /*
    Generate performance events.
  */

  const events =
    createPerformanceEvents(
      classification,
      evaluationLoss,
      move,
      beforeEvaluation,
      afterEvaluation
    );


  return {
    evaluated: true,

    evaluationBefore,

    evaluationAfter,

    evaluationLoss,

    bestMove:
      beforeEvaluation.bestMove,

    classification,

    events,

    stockfish: {
      before:
        beforeEvaluation,

      after:
        afterEvaluation,
    },
  };
}


/*
  Convert Stockfish's normalized
  White-perspective evaluation into
  the player's perspective.
*/

function convertToPlayerPerspective(
  evaluation,
  playerColor
) {

  /*
    Mate positions require special
    handling because they use a
    mate-in-N value rather than
    centipawns.
  */

  if (
    evaluation.mate !== null
  ) {
    return {
      type: "mate",

      value:
        playerColor === "w"
          ? evaluation.mate
          : -evaluation.mate,
    };
  }


  return {
    type: "cp",

    value:
      playerColor === "w"
        ? evaluation.evaluation
        : -evaluation.evaluation,
  };
}


/*
  Calculate evaluation loss.

  Example:

    Before: +1.80
    After:  +1.20

    Loss = 0.60

  The player is still winning,
  but their move reduced the advantage.
*/

function calculateEvaluationLoss(
  before,
  after
) {

  /*
    NORMAL → NORMAL

    Simple centipawn comparison.
  */

  if (
    before.type === "cp" &&
    after.type === "cp"
  ) {
    return (
      before.value -
      after.value
    );
  }


  /*
    NORMAL → MATE

    Moving into a winning forced
    mate is not a loss.

    Moving into an opponent's
    forced mate is a severe loss.
  */

  if (
    before.type === "cp" &&
    after.type === "mate"
  ) {

    if (
      after.value > 0
    ) {
      return 0;
    }

    return 10;
  }


  /*
    MATE → NORMAL

    Leaving a winning forced mate
    is a severe loss.

    Escaping an opponent's forced
    mate is an improvement.
  */

  if (
    before.type === "mate" &&
    after.type === "cp"
  ) {

    if (
      before.value > 0
    ) {
      return 10;
    }

    return 0;
  }


  /*
    MATE → MATE

    Positive mate:
      player has a forced mate.

      +3 → +5
      means the player made the
      forced mate farther away.

      +5 → +3
      means the player improved it.

    Negative mate:
      opponent has a forced mate.

      -3 → -5
      means the opponent's mate
      became farther away.

      -5 → -3
      means the opponent's mate
      became closer.
  */

  if (
    before.type === "mate" &&
    after.type === "mate"
  ) {

    /*
      Player has a forced mate
      in both positions.
    */

    if (
      before.value > 0 &&
      after.value > 0
    ) {
      return Math.max(
        0,
        after.value -
          before.value
      );
    }


    /*
      Opponent has a forced mate
      in both positions.

      IMPORTANT:

      This is intentionally:

        after - before

      Example:

        Before: -3
        After:  -5

        -5 - (-3) = -2

      The opponent's forced mate
      became farther away, so the
      player improved.

      Example:

        Before: -5
        After:  -3

        -3 - (-5) = +2

      The opponent's forced mate
      became closer, so the player
      worsened the position.
    */

    if (
      before.value < 0 &&
      after.value < 0
    ) {
      return Math.max(
        0,
        after.value -
          before.value
      );
    }


    /*
      Player's forced mate changed
      into opponent's forced mate.
    */

    if (
      before.value > 0 &&
      after.value < 0
    ) {
      return 10;
    }


    /*
      Opponent's forced mate changed
      into player's forced mate.

      This is a major improvement.
    */

    if (
      before.value < 0 &&
      after.value > 0
    ) {
      return 0;
    }
  }


  /*
    Safe fallback.
  */

  return 0;
}


/*
  Convert evaluation loss into
  a move-quality classification.
*/

function classifyMove(
  evaluationLoss
) {

  if (
    evaluationLoss <=
    THRESHOLDS.best
  ) {
    return "best";
  }


  if (
    evaluationLoss <=
    THRESHOLDS.excellent
  ) {
    return "excellent";
  }


  if (
    evaluationLoss <=
    THRESHOLDS.good
  ) {
    return "good";
  }


  if (
    evaluationLoss <=
    THRESHOLDS.inaccuracy
  ) {
    return "inaccuracy";
  }


  if (
    evaluationLoss <=
    THRESHOLDS.mistake
  ) {
    return "mistake";
  }


  return "blunder";
}


/*
  Generate raw performance events.
*/

function createPerformanceEvents(
  classification,
  evaluationLoss,
  move,
  beforeEvaluation,
  afterEvaluation
) {

  const events = [];


  /*
    Every evaluated player move
    receives a performance event.
  */

  events.push({
    type:
      `${classification}_move`,

    category:
      "performance",

    data: {
      san:
        move.san,

      from:
        move.from,

      to:
        move.to,

      evaluationLoss,

      bestMove:
        beforeEvaluation.bestMove,

      evaluationBefore:
        beforeEvaluation,

      evaluationAfter:
        afterEvaluation,
    },
  });


  /*
    Detect a significant negative
    evaluation swing.
  */

  if (
    evaluationLoss >=
    1.0
  ) {
    events.push({
      type:
        "evaluation_swing",

      category:
        "performance",

      data: {
        direction:
          "negative",

        magnitude:
          evaluationLoss,
      },
    });
  }


  /*
    Detect a strong improvement.
  */

  if (
    evaluationLoss <=
    -0.50
  ) {
    events.push({
      type:
        "strong_improvement",

      category:
        "performance",

      data: {
        magnitude:
          Math.abs(
            evaluationLoss
          ),
      },
    });
  }


  /*
    Detect a missed opportunity.

    This occurs when the player
    loses more than 0.75 evaluation
    and did not play Stockfish's
    recommended move.
  */

  if (
    evaluationLoss > 0.75 &&
    beforeEvaluation.bestMove &&
    beforeEvaluation.bestMove !==
      `${move.from}${move.to}${
        move.promotion || ""
      }`
  ) {
    events.push({
      type:
        "missed_opportunity",

      category:
        "performance",

      data: {
        bestMove:
          beforeEvaluation.bestMove,

        playedMove:
          `${move.from}${move.to}${
            move.promotion || ""
          }`,

        evaluationLoss,
      },
    });
  }


  return events;
}