import { useEffect, useState } from "react";

import {
  createGame,
  getGameStatus,
  makeMove,
  resetGame,
} from "./game";

import { getBestMove } from "./stockfish";

import { analyzeMove } from "./gameEvents";

import {
  analyzeMaterial,
} from "./materialAnalysis";

import {
  analyzePosition,
} from "./positionAnalysis";

import {
  analyzePerformance,
} from "./performanceAnalysis";

import {
  interpretEvents,
} from "./eventInterpreter";

import {
  createGameState,
  updateGameState,
  endGameState,
} from "./gameState";

import "./ChessBoard.css";


/*
  --------------------------------------------------
  CHESS PIECE RENDERING
  --------------------------------------------------

  Custom inline SVG pieces are used instead of
  Unicode chess characters.

  This makes the appearance independent of the
  operating system and installed fonts.
*/

function ChessPiece({ color, type }) {

  const isWhite =
    color === "w";

  const fill =
    isWhite
      ? "#f4f4f0"
      : "#17191d";

  const stroke =
    isWhite
      ? "#17191d"
      : "#d9d9d4";

  const commonProps = {
    viewBox: "0 0 100 100",

    className:
      `chess-piece-svg ${
        isWhite
          ? "white-piece"
          : "black-piece"
      }`,

    "aria-hidden": true,
  };


  /*
    PAWN
  */

  if (type === "p") {

    return (

      <svg {...commonProps}>

        <circle
          cx="50"
          cy="25"
          r="13"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
        />

        <path
          d="
            M40 37
            L60 37
            L63 62
            L72 73
            L72 80
            L28 80
            L28 73
            L37 62
            Z
          "
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <path
          d="M34 80 L66 80"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />

      </svg>

    );
  }


  /*
    ROOK
  */

  if (type === "r") {

    return (

      <svg {...commonProps}>

        <path
          d="
            M28 22
            L39 22
            L39 30
            L46 30
            L46 22
            L54 22
            L54 30
            L61 30
            L61 22
            L72 22
            L69 39
            L64 44
            L64 69
            L74 77
            L74 82
            L26 82
            L26 77
            L36 69
            L36 44
            L31 39
            Z
          "
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <path
          d="M24 82 L76 82"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />

      </svg>

    );
  }


  /*
    KNIGHT
  */

  if (type === "n") {

    return (

      <svg {...commonProps}>

        <path
          d="
            M30 80
            L30 70
            C34 65 37 58 38 51
            C39 42 34 34 38 25
            C44 30 51 33 57 32
            C66 30 70 37 68 44
            C66 50 59 54 53 57
            C60 60 67 66 70 72
            L74 80
            Z
          "
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <circle
          cx="55"
          cy="40"
          r="3"
          fill={stroke}
        />

        <path
          d="M27 80 L73 80"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />

      </svg>

    );
  }


  /*
    BISHOP
  */

  if (type === "b") {

    return (

      <svg {...commonProps}>

        <path
          d="
            M50 18
            C40 25 36 35 40 44
            C43 51 40 57 35 64
            L29 72
            L29 78
            L71 78
            L71 72
            L65 64
            C60 57 57 51 60 44
            C64 35 60 25 50 18
            Z
          "
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <path
          d="M44 27 L56 39"
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M27 80 L73 80"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />

      </svg>

    );
  }


  /*
    QUEEN
  */

  if (type === "q") {

    return (

      <svg {...commonProps}>

        <path
          d="
            M27 30
            L35 48
            L43 30
            L50 48
            L57 30
            L65 48
            L73 30
            L67 67
            L72 76
            L72 81
            L28 81
            L28 76
            L33 67
            Z
          "
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <circle
          cx="27"
          cy="27"
          r="5"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
        />

        <circle
          cx="43"
          cy="25"
          r="5"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
        />

        <circle
          cx="50"
          cy="27"
          r="5"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
        />

        <circle
          cx="57"
          cy="25"
          r="5"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
        />

        <circle
          cx="73"
          cy="27"
          r="5"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
        />

        <path
          d="M25 82 L75 82"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />

      </svg>

    );
  }


  /*
    KING
  */

  if (type === "k") {

    return (

      <svg {...commonProps}>

        <path
          d="
            M43 18
            L43 29
            L32 29
            L32 37
            L43 37
            L43 45
            C43 51 38 56 35 62
            L28 73
            L28 80
            L72 80
            L72 73
            L65 62
            C62 56 57 51 57 45
            L57 37
            L68 37
            L68 29
            L57 29
            L57 18
            Z
          "
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <path
          d="M50 10 L50 29"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />

        <path
          d="M41 19 L59 19"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />

        <path
          d="M25 82 L75 82"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
        />

      </svg>

    );
  }


  return null;
}


const MOVE_ANIMATION_TIME = 350;


function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}


function ChessBoard() {

  /*
    Core chess state.
  */

  const [game, setGame] =
    useState(createGame());


  /*
    Board interaction state.
  */

  const [selectedSquare, setSelectedSquare] =
    useState(null);

  const [legalMoves, setLegalMoves] =
    useState([]);


  /*
    AI state.
  */

  const [isThinking, setIsThinking] =
    useState(false);


  const [difficulty, setDifficulty] =
    useState(2);


  /*
    Match state.
  */

  const [gameStarted, setGameStarted] =
    useState(false);


  const [playerColor, setPlayerColor] =
    useState("w");


  const [isFlipping, setIsFlipping] =
    useState(false);


  /*
    Promotion state.
  */

  const [promotionMove, setPromotionMove] =
    useState(null);


  /*
    Animation state.
  */

  const [animatedMove, setAnimatedMove] =
    useState(null);


  /*
    Latest detected events.
  */

  const [latestEvents, setLatestEvents] =
    useState([]);


  /*
    Latest high-level interpretation.
  */

  const [latestInterpretation, setLatestInterpretation] =
    useState(null);


  /*
    Complete match history.
  */

  const [
    matchEventHistory,
    setMatchEventHistory,
  ] = useState([]);


  /*
    Central CHECKMATE PROTOCOL
    game state.
  */

  const [gameState, setGameState] =
    useState(
      createGameState()
    );


  /*
    Difficulty configuration.
  */

  const difficultyLevels = {

    1: {
      name: "Easy",
      depth: 5,
    },

    2: {
      name: "Medium",
      depth: 10,
    },

    3: {
      name: "Hard",
      depth: 15,
    },

    4: {
      name: "Expert",
      depth: 20,
    },

  };


  /*
    Current chess information.
  */

  const gameStatus =
    getGameStatus(game);


  const board =
    game.board();


  /*
    Determine board orientation.
  */

  const isBlackPerspective =
    playerColor === "b";


  const displayRows =
    isBlackPerspective
      ? [...board]
          .reverse()
          .map(
            (row) =>
              [...row].reverse()
          )
      : board;


  const displayRanks =
    isBlackPerspective
      ? [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
        ]
      : [
          "8",
          "7",
          "6",
          "5",
          "4",
          "3",
          "2",
          "1",
        ];


  const displayFiles =
    isBlackPerspective
      ? [
          "h",
          "g",
          "f",
          "e",
          "d",
          "c",
          "b",
          "a",
        ]
      : [
          "a",
          "b",
          "c",
          "d",
          "e",
          "f",
          "g",
          "h",
        ];


  /*
    Convert a chess square into
    its current visual position.
  */

  function getDisplayPosition(square) {

    const file =
      square.charCodeAt(0) - 97;


    const rank =
      Number(square[1]);


    const row =
      isBlackPerspective
        ? rank - 1
        : 8 - rank;


    const col =
      isBlackPerspective
        ? 7 - file
        : file;


    return {
      row,
      col,
    };
  }


  /*
    Start piece movement animation.
  */

  function startMoveAnimation(
    from,
    to,
    piece
  ) {

    const fromPosition =
      getDisplayPosition(from);


    const toPosition =
      getDisplayPosition(to);


    const rowDifference =
      toPosition.row -
      fromPosition.row;


    const colDifference =
      toPosition.col -
      fromPosition.col;


    setAnimatedMove({

      from,
      to,
      piece,

      fromPosition,

      rowDifference,
      colDifference,

    });
  }


  /*
    Determine final match result.
  */

  function getMatchResult(
    completedGame
  ) {

    if (
      !completedGame.isGameOver()
    ) {
      return null;
    }


    if (
      completedGame.isCheckmate()
    ) {

      const winner =
        completedGame.turn() === "w"
          ? "b"
          : "w";


      return winner === playerColor
        ? "win"
        : "loss";
    }


    if (
      completedGame.isDraw()
    ) {
      return "draw";
    }


    return "draw";
  }


  /*
    Finish the central match state.
  */

  function finishMatch(
    completedGame
  ) {

    const result =
      getMatchResult(
        completedGame
      );


    if (!result) {
      return;
    }


    setGameState(
      (previousState) => {

        const finishedState =
          endGameState(
            previousState,
            result
          );


        console.log(
          "CHECKMATE PROTOCOL MATCH FINISHED:",
          finishedState
        );


        return finishedState;
      }
    );
  }


  /*
    Main move processing pipeline.

    Chess move
        ↓
    Event analysis
        ↓
    Material analysis
        ↓
    Position analysis
        ↓
    Performance analysis
        ↓
    Event interpretation
        ↓
    Match history
        ↓
    Central game state
  */

  async function processMoveAnalysis(
    previousGame,
    updatedGame,
    move
  ) {

    const moveAnalysis =
      analyzeMove(
        updatedGame,
        move
      );


    const materialAnalysis =
      analyzeMaterial(
        previousGame,
        updatedGame,
        move,
        playerColor
      );


    const positionAnalysis =
      analyzePosition(
        previousGame,
        updatedGame,
        move,
        playerColor
      );


    const performanceAnalysis =
      await analyzePerformance(
        previousGame,
        updatedGame,
        move,
        playerColor,
        difficultyLevels[
          difficulty
        ].depth
      );


    const combinedEvents = [

      ...moveAnalysis.events,

      ...materialAnalysis.events,

      ...positionAnalysis.events,

      ...performanceAnalysis.events,

    ];


    const interpretation =
      interpretEvents(
        combinedEvents,
        playerColor
      );


    setLatestEvents(
      combinedEvents
    );


    setLatestInterpretation(
      interpretation
    );


    const historyEntry = {

      moveNumber:
        Math.ceil(
          updatedGame.history().length /
            2
        ),

      ply:
        updatedGame.history().length,

      player:
        move.color === "w"
          ? "White"
          : "Black",

      move: {

        from: move.from,

        to: move.to,

        piece: move.piece,

        color: move.color,

        san: move.san,

        captured:
          move.captured || null,

        promotion:
          move.promotion || null,

        flags:
          move.flags,

      },

      events:
        combinedEvents,

      interpretation:
        interpretation,

      material:
        materialAnalysis,

      position:
        positionAnalysis,

      performance:
        performanceAnalysis,

      timestamp:
        Date.now(),

    };


    setMatchEventHistory(
      (previousHistory) => {

        const updatedHistory = [

          ...previousHistory,

          historyEntry,

        ];


        console.log(
          "CHECKMATE PROTOCOL MOVE ANALYSIS:",
          moveAnalysis
        );


        console.log(
          "CHECKMATE PROTOCOL MATERIAL:",
          materialAnalysis
        );


        console.log(
          "CHECKMATE PROTOCOL POSITION:",
          positionAnalysis
        );


        console.log(
          "CHECKMATE PROTOCOL PERFORMANCE:",
          performanceAnalysis
        );


        console.log(
          "CHECKMATE PROTOCOL INTERPRETATION:",
          interpretation
        );


        console.log(
          "CHECKMATE PROTOCOL MATCH HISTORY:",
          updatedHistory
        );


        return updatedHistory;
      }
    );


    const combinedAnalysis = {

      ...moveAnalysis,

      events:
        combinedEvents,

    };


    setGameState(
      (previousState) =>
        updateGameState(
          previousState,
          combinedAnalysis,
          playerColor
        )
    );


    return {

      moveAnalysis,

      materialAnalysis,

      positionAnalysis,

      performanceAnalysis,

      combinedEvents,

      interpretation,

    };
  }


  /*
    Log central state changes.
  */

  useEffect(() => {

    console.log(
      "CHECKMATE PROTOCOL GAME STATE:",
      gameState
    );

  }, [gameState]);


  /*
    Make Stockfish move.
  */

  async function makeStockfishMove(
    currentGame
  ) {

    setIsThinking(true);


    try {

      const bestMove =
        await getBestMove(
          currentGame.fen(),
          difficultyLevels[
            difficulty
          ].depth
        );


      if (
        !bestMove ||
        bestMove === "(none)"
      ) {

        setIsThinking(false);

        return;
      }


      const from =
        bestMove.substring(
          0,
          2
        );


      const to =
        bestMove.substring(
          2,
          4
        );


      const promotion =
        bestMove.length >= 5
          ? bestMove.substring(
              4,
              5
            )
          : undefined;


      const moveResult =
        makeMove(
          currentGame,
          from,
          to,
          promotion
        );


      if (moveResult) {

        const newGame =
          moveResult.game;


        const move =
          moveResult.move;


        await processMoveAnalysis(
          currentGame,
          newGame,
          move
        );


        const movedPiece =
          newGame.get(to);


        startMoveAnimation(
          from,
          to,
          movedPiece
        );


        setGame(
          newGame
        );


        await wait(
          MOVE_ANIMATION_TIME
        );


        setAnimatedMove(
          null
        );


        if (
          newGame.isGameOver()
        ) {

          finishMatch(
            newGame
          );
        }
      }

    } catch (error) {

      console.error(
        "Stockfish error:",
        error
      );

    }


    setIsThinking(
      false
    );
  }


  /*
    If player chooses Black,
    AI automatically makes
    the first move.
  */

  useEffect(() => {

    if (
      playerColor === "b" &&
      !gameStarted &&
      game.turn() === "w"
    ) {

      setGameStarted(
        true
      );


      makeStockfishMove(
        game
      );
    }

  }, [playerColor]);


  /*
    Change player color.
  */

  function handlePlayerColorChange(
    event
  ) {

    const newColor =
      event.target.value;


    if (
      newColor === playerColor
    ) {
      return;
    }


    setSelectedSquare(
      null
    );


    setLegalMoves(
      []
    );


    setAnimatedMove(
      null
    );


    setIsFlipping(
      true
    );


    setTimeout(() => {

      setPlayerColor(
        newColor
      );


      setTimeout(() => {

        setIsFlipping(
          false
        );

      }, 400);

    }, 200);
  }


  /*
    Player clicks square.
  */

  async function handleSquareClick(
    square
  ) {

    if (
      isThinking ||
      animatedMove ||
      game.isGameOver() ||
      game.turn() !== playerColor ||
      promotionMove
    ) {
      return;
    }


    /*
      First square selection.
    */

    if (
      !selectedSquare
    ) {

      const piece =
        game.get(square);


      if (
        piece &&
        piece.color === playerColor
      ) {

        setSelectedSquare(
          square
        );


        const moves =
          game.moves({
            square,
            verbose: true,
          });


        setLegalMoves(
          moves.map(
            (move) =>
              move.to
          )
        );
      }


      return;
    }


    /*
      Get currently selected piece.
    */

    const selectedPiece =
      game.get(
        selectedSquare
      );


    /*
      Promotion is only possible when
      the clicked destination is an
      actual legal move.
    */

    const isPromotion =
      selectedPiece &&
      selectedPiece.type === "p" &&
      legalMoves.includes(square) &&
      (
        (
          selectedPiece.color === "w" &&
          square[1] === "8"
        ) ||
        (
          selectedPiece.color === "b" &&
          square[1] === "1"
        )
      );


    if (
      isPromotion
    ) {

      setPromotionMove({

        from:
          selectedSquare,

        to:
          square,

      });


      return;
    }


    /*
      Make player move.
    */

    const moveResult =
      makeMove(
        game,
        selectedSquare,
        square
      );


    /*
      Invalid move.
    */

    if (
      !moveResult
    ) {

      const targetPiece =
        game.get(square);


      if (
        targetPiece &&
        targetPiece.color ===
          playerColor
      ) {

        setSelectedSquare(
          square
        );


        const moves =
          game.moves({
            square,
            verbose: true,
          });


        setLegalMoves(
          moves.map(
            (move) =>
              move.to
          )
        );

      } else {

        setSelectedSquare(
          null
        );


        setLegalMoves(
          []
        );
      }


      return;
    }


    const newGame =
      moveResult.game;


    const move =
      moveResult.move;


    await processMoveAnalysis(
      game,
      newGame,
      move
    );


    const from =
      selectedSquare;


    const to =
      square;


    const movedPiece =
      newGame.get(to);


    setSelectedSquare(
      null
    );


    setLegalMoves(
      []
    );


    setGameStarted(
      true
    );


    startMoveAnimation(
      from,
      to,
      movedPiece
    );


    setGame(
      newGame
    );


    await wait(
      MOVE_ANIMATION_TIME
    );


    setAnimatedMove(
      null
    );


    if (
      newGame.isGameOver()
    ) {

      finishMatch(
        newGame
      );

      return;
    }


    await makeStockfishMove(
      newGame
    );
  }


  /*
    Handle pawn promotion.
  */

  async function handlePromotion(
    piece
  ) {

    if (
      !promotionMove ||
      animatedMove
    ) {
      return;
    }


    const moveResult =
      makeMove(
        game,
        promotionMove.from,
        promotionMove.to,
        piece
      );


    if (
      !moveResult
    ) {

      setPromotionMove(
        null
      );


      setSelectedSquare(
        null
      );


      setLegalMoves(
        []
      );


      return;
    }


    const newGame =
      moveResult.game;


    const move =
      moveResult.move;


    await processMoveAnalysis(
      game,
      newGame,
      move
    );


    const from =
      promotionMove.from;


    const to =
      promotionMove.to;


    const movedPiece =
      newGame.get(to);


    setSelectedSquare(
      null
    );


    setLegalMoves(
      []
    );


    setPromotionMove(
      null
    );


    setGameStarted(
      true
    );


    startMoveAnimation(
      from,
      to,
      movedPiece
    );


    setGame(
      newGame
    );


    await wait(
      MOVE_ANIMATION_TIME
    );


    setAnimatedMove(
      null
    );


    if (
      newGame.isGameOver()
    ) {

      finishMatch(
        newGame
      );

      return;
    }


    await makeStockfishMove(
      newGame
    );
  }


  /*
    Reset everything.
  */

  function handleNewGame() {

    setGame(
      resetGame()
    );


    setSelectedSquare(
      null
    );


    setLegalMoves(
      []
    );


    setIsThinking(
      false
    );


    setGameStarted(
      false
    );


    setPromotionMove(
      null
    );


    setAnimatedMove(
      null
    );


    setLatestEvents(
      []
    );


    setLatestInterpretation(
      null
    );


    setMatchEventHistory(
      []
    );


    setGameState(
      createGameState()
    );
  }


  const moveHistory =
    game.history();


  return (

    <div className="chess-game">

      <h2 className="game-status">

        {isThinking
          ? "Stockfish is thinking..."
          : gameStatus}

      </h2>


      <button
        type="button"
        onClick={
          handleNewGame
        }
      >
        New Game
      </button>


      <div className="game-setting">

        <label>

          Difficulty:{" "}

          <select
            value={
              difficulty
            }
            onChange={
              (event) =>
                setDifficulty(
                  Number(
                    event.target.value
                  )
                )
            }
            disabled={
              gameStarted ||
              isThinking
            }
          >

            <option value={1}>
              Easy
            </option>

            <option value={2}>
              Medium
            </option>

            <option value={3}>
              Hard
            </option>

            <option value={4}>
              Expert
            </option>

          </select>

        </label>

      </div>


      <div className="game-setting">

        <label>

          Play as:{" "}

          <select
            value={
              playerColor
            }
            onChange={
              handlePlayerColorChange
            }
            disabled={
              gameStarted ||
              isThinking ||
              animatedMove
            }
          >

            <option value="w">
              White
            </option>

            <option value="b">
              Black
            </option>

          </select>

        </label>

      </div>


      <div className="board-wrapper">

        <div className="rank-labels">

          {displayRanks.map(
            (rank) => (

              <span
                key={rank}
              >
                {rank}
              </span>

            )
          )}

        </div>


        <div className="board-container">

          <div
            className={`chess-board ${
              isFlipping
                ? "flipping"
                : ""
            }`}
          >

            {displayRows.map(
              (
                row,
                displayRowIndex
              ) =>

                row.map(
                  (
                    piece,
                    displayColIndex
                  ) => {

                    const rowIndex =
                      isBlackPerspective
                        ? 7 -
                          displayRowIndex
                        : displayRowIndex;


                    const colIndex =
                      isBlackPerspective
                        ? 7 -
                          displayColIndex
                        : displayColIndex;


                    const square =
                      String.fromCharCode(
                        97 +
                          colIndex
                      ) +
                      (
                        8 -
                        rowIndex
                      );


                    const isSelected =
                      selectedSquare ===
                      square;


                    const isLegalMove =
                      legalMoves.includes(
                        square
                      );


                    const isAnimatedDestination =
                      animatedMove &&
                      animatedMove.to ===
                        square;


                    return (

                      <button

                        key={square}

                        type="button"

                        className={`square ${
                          (
                            displayRowIndex +
                            displayColIndex
                          ) %
                            2 ===
                          0
                            ? "light"
                            : "dark"
                        } ${
                          isSelected
                            ? "selected"
                            : ""
                        } ${
                          isLegalMove
                            ? "legal-move"
                            : ""
                        } ${
                          isAnimatedDestination
                            ? "animation-destination"
                            : ""
                        }`}

                        onClick={() =>
                          handleSquareClick(
                            square
                          )
                        }
                      >

                        {/*
                          Selected square indicator.

                          This is a real child element
                          rather than a pseudo-element,
                          so it does not interfere with
                          the legal-move hexagon system.
                        */}

                        {isSelected && (

                          <span
                            className="selected-corners"
                            aria-hidden="true"
                          />

                        )}


                        {piece &&
                          !isAnimatedDestination && (

                            <ChessPiece
                              color={
                                piece.color
                              }
                              type={
                                piece.type
                              }
                            />

                          )}

                      </button>

                    );
                  }
                )
            )}


            <div className="moving-piece-layer">

              {animatedMove && (

                <div

                  className="moving-piece-overlay"

                  style={{

                    gridColumn:
                      animatedMove
                        .fromPosition
                        .col + 1,

                    gridRow:
                      animatedMove
                        .fromPosition
                        .row + 1,

                    "--move-x":
                      animatedMove
                        .colDifference,

                    "--move-y":
                      animatedMove
                        .rowDifference,

                  }}
                >

                  <ChessPiece
                    color={
                      animatedMove
                        .piece
                        .color
                    }
                    type={
                      animatedMove
                        .piece
                        .type
                    }
                  />

                </div>

              )}

            </div>

          </div>


          <div className="file-labels">

            {displayFiles.map(
              (file) => (

                <span
                  key={file}
                >
                  {file}
                </span>

              )
            )}

          </div>

        </div>

      </div>


      {promotionMove && (

        <div className="promotion-menu">

          <h3>
            Choose Promotion
          </h3>


          <div className="promotion-options">

            {[
              "q",
              "r",
              "b",
              "n",
            ].map(
              (piece) => (

                <button

                  key={piece}

                  type="button"

                  onClick={() =>
                    handlePromotion(
                      piece
                    )
                  }
                >

                  <ChessPiece
                    color={
                      playerColor
                    }
                    type={
                      piece
                    }
                  />

                </button>

              )
            )}

          </div>

        </div>

      )}


      <div className="move-history">

        <h3>
          Move History
        </h3>


        {moveHistory.length ===
        0 ? (

          <p>
            No moves yet.
          </p>

        ) : (

          <ol>

            {Array.from(

              {
                length:
                  Math.ceil(
                    moveHistory.length /
                      2
                  ),
              },

              (_, index) => {

                const whiteMove =
                  moveHistory[
                    index * 2
                  ];


                const blackMove =
                  moveHistory[
                    index * 2 + 1
                  ];


                return (

                  <li
                    key={index}
                  >

                    <span>
                      {whiteMove}
                    </span>


                    {blackMove && (

                      <span>

                        {" "}

                        {blackMove}

                      </span>

                    )}

                  </li>

                );

              }

            )}

          </ol>

        )}

      </div>

    </div>

  );
}


export default ChessBoard;