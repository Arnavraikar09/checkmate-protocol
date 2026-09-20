const SEVERITY_PRIORITY = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function interpretEvents(
  events,
  playerColor
) {
  const interpretation = {
    severity: "none",
    situation: "normal",
    playerImpact: "neutral",
    triggers: [],
    summary: null,
  };

  if (
    !events ||
    events.length === 0
  ) {
    return interpretation;
  }

  const eventTypes = events.map(
    (event) => event.type
  );

  /*
    --------------------------------------------------
    DETERMINE CHECKING SIDE
    --------------------------------------------------
  */

  const checkEvent = events.find(
    (event) =>
      event.type === "check"
  );

  let checkingSide = null;

  if (checkEvent) {
    const checkingColor =
      checkEvent.data?.checkingColor;

    if (
      checkingColor === playerColor
    ) {
      checkingSide = "player";
    } else if (
      checkingColor
    ) {
      checkingSide = "ai";
    }
  }

  /*
    --------------------------------------------------
    MATERIAL EVENTS
    --------------------------------------------------
  */

  const playerLostQueen =
    eventTypes.includes(
      "player_lost_queen"
    );

  const playerCapturedQueen =
    eventTypes.includes(
      "player_captured_queen"
    );

  const playerLostRook =
    eventTypes.includes(
      "player_lost_rook"
    );

  const playerCapturedRook =
    eventTypes.includes(
      "player_captured_rook"
    );

  /*
    Generic material change events tell us
    whether the player or AI made the capture.

    Example:

    side: "player"
      -> player captured something

    side: "ai"
      -> AI captured something
  */

  const materialChanges =
    events.filter(
      (event) =>
        event.type ===
        "material_change"
    );

  let playerMaterialGain = false;
  let playerMaterialLoss = false;

  for (
    const event of materialChanges
  ) {
    const side =
      event.data?.side;

    if (side === "player") {
      playerMaterialGain = true;
    }

    if (side === "ai") {
      playerMaterialLoss = true;
    }
  }

  /*
    --------------------------------------------------
    MATERIAL PRIORITY
    --------------------------------------------------
  */

  /*
    QUEEN LOSS
    */

  if (playerLostQueen) {
    interpretation.severity =
      "critical";

    interpretation.situation =
      "major_material_loss";

    interpretation.playerImpact =
      "strong_negative";

    interpretation.triggers.push(
      "queen_lost",
      "major_material_loss",
      "system_attention"
    );

    interpretation.summary =
      "Critical material loss detected.";
  }

  /*
    QUEEN CAPTURE
    */

  else if (
    playerCapturedQueen
  ) {
    interpretation.severity =
      "critical";

    interpretation.situation =
      "major_material_gain";

    interpretation.playerImpact =
      "strong_positive";

    interpretation.triggers.push(
      "queen_captured",
      "major_material_gain",
      "system_attention"
    );

    interpretation.summary =
      "Major material advantage gained.";
  }

  /*
    ROOK LOSS
    */

  else if (playerLostRook) {
    interpretation.severity =
      "high";

    interpretation.situation =
      "major_material_loss";

    interpretation.playerImpact =
      "negative";

    interpretation.triggers.push(
      "rook_lost",
      "major_material_loss"
    );

    interpretation.summary =
      "Significant material loss detected.";
  }

  /*
    ROOK CAPTURE
    */

  else if (
    playerCapturedRook
  ) {
    interpretation.severity =
      "high";

    interpretation.situation =
      "major_material_gain";

    interpretation.playerImpact =
      "positive";

    interpretation.triggers.push(
      "rook_captured",
      "major_material_gain"
    );

    interpretation.summary =
      "Significant material advantage gained.";
  }

  /*
    GENERIC MATERIAL LOSS
    */

  else if (
    playerMaterialLoss
  ) {
    interpretation.severity =
      "low";

    interpretation.situation =
      "material_loss";

    interpretation.playerImpact =
      "negative";

    interpretation.triggers.push(
      "material_loss",
      "material_change"
    );

    interpretation.summary =
      "Player material loss detected.";
  }

  /*
    GENERIC MATERIAL GAIN
    */

  else if (
    playerMaterialGain
  ) {
    interpretation.severity =
      "low";

    interpretation.situation =
      "material_gain";

    interpretation.playerImpact =
      "positive";

    interpretation.triggers.push(
      "material_gain",
      "material_change"
    );

    interpretation.summary =
      "Player gained material.";
  }

  /*
    --------------------------------------------------
    CHECK / PRESSURE EVENTS
    --------------------------------------------------
  */

  if (checkEvent) {
    /*
      PLAYER DELIVERS CHECK
    */

    if (
      checkingSide === "player"
    ) {
      interpretation.triggers.push(
        "player_pressure"
      );

      /*
        Only replace the main situation
        if there is no stronger material
        situation already present.
      */

      if (
        SEVERITY_PRIORITY[
          interpretation.severity
        ] < SEVERITY_PRIORITY.medium
      ) {
        interpretation.severity =
          "medium";

        interpretation.situation =
          "offensive_pressure";

        interpretation.playerImpact =
          "positive";

        interpretation.summary =
          "Player pressure detected.";
      }
    }

    /*
      AI DELIVERS CHECK
    */

    if (
      checkingSide === "ai"
    ) {
      interpretation.triggers.push(
        "player_under_pressure"
      );

      if (
        SEVERITY_PRIORITY[
          interpretation.severity
        ] < SEVERITY_PRIORITY.medium
      ) {
        interpretation.severity =
          "medium";

        interpretation.situation =
          "defensive_pressure";

        interpretation.playerImpact =
          "negative";

        interpretation.summary =
          "Player is under pressure.";
      }
    }
  }

  /*
    --------------------------------------------------
    COMBINATION EVENTS
    --------------------------------------------------
  */

  /*
    Queen loss + check
    */

  if (
    playerLostQueen &&
    checkingSide === "ai"
  ) {
    interpretation.triggers.push(
      "defensive_pressure"
    );

    interpretation.summary =
      "Critical material loss detected while the player is under pressure.";
  }

  /*
    Queen capture + check
    */

  if (
    playerCapturedQueen &&
    checkingSide === "player"
  ) {
    interpretation.triggers.push(
      "offensive_pressure"
    );

    interpretation.summary =
      "Major material advantage gained while the player maintains offensive pressure.";
  }

  /*
    Rook loss + check
    */

  if (
    playerLostRook &&
    checkingSide === "ai"
  ) {
    interpretation.triggers.push(
      "defensive_pressure"
    );

    interpretation.summary =
      "Significant material loss detected while the player is under pressure.";
  }

  /*
    Rook capture + check
    */

  if (
    playerCapturedRook &&
    checkingSide === "player"
  ) {
    interpretation.triggers.push(
      "offensive_pressure"
    );

    interpretation.summary =
      "Significant material advantage gained while the player maintains offensive pressure.";
  }

  /*
    Generic material loss + AI check
    */

  if (
    playerMaterialLoss &&
    checkingSide === "ai" &&
    !playerLostQueen &&
    !playerLostRook
  ) {
    interpretation.triggers.push(
      "defensive_pressure"
    );

    interpretation.summary =
      "Player lost material while coming under pressure.";
  }

  /*
    Generic material gain + player check
    */

  if (
    playerMaterialGain &&
    checkingSide === "player" &&
    !playerCapturedQueen &&
    !playerCapturedRook
  ) {
    interpretation.triggers.push(
      "offensive_pressure"
    );

    interpretation.summary =
      "Player gained material while maintaining pressure.";
  }

  /*
    --------------------------------------------------
    POSITION EVENTS
    --------------------------------------------------
  */

  if (
    eventTypes.includes(
      "position_deteriorating"
    )
  ) {
    interpretation.triggers.push(
      "position_deteriorating"
    );

    if (
      SEVERITY_PRIORITY[
        interpretation.severity
      ] < SEVERITY_PRIORITY.medium
    ) {
      interpretation.severity =
        "medium";

      interpretation.situation =
        "position_deteriorating";

      interpretation.playerImpact =
        "negative";

      interpretation.summary =
        "Player position is deteriorating.";
    }
  }

  if (
    eventTypes.includes(
      "position_improving"
    )
  ) {
    interpretation.triggers.push(
      "position_improving"
    );

    if (
      SEVERITY_PRIORITY[
        interpretation.severity
      ] < SEVERITY_PRIORITY.medium
    ) {
      interpretation.severity =
        "medium";

      interpretation.situation =
        "position_improving";

      interpretation.playerImpact =
        "positive";

      interpretation.summary =
        "Player position is improving.";
    }
  }

  /*
    --------------------------------------------------
    CRITICAL POSITION EVENTS
    --------------------------------------------------
  */

  if (
    eventTypes.includes(
      "critical_position"
    )
  ) {
    interpretation.triggers.push(
      "critical_position",
      "system_attention"
    );

    if (
      SEVERITY_PRIORITY[
        interpretation.severity
      ] < SEVERITY_PRIORITY.critical
    ) {
      interpretation.severity =
        "critical";

      interpretation.situation =
        "critical_position";

      interpretation.playerImpact =
        "negative";

      interpretation.summary =
        "Critical position detected.";
    }
  }

  /*
    If the critical position is caused
    by the player's king being in check,
    make the situation more specific.
  */

  const playerKingInCheck =
    events.some(
      (event) =>
        event.type ===
          "critical_position" &&
        event.data?.reason ===
          "player_king_in_check"
    );

  if (
    playerKingInCheck &&
    checkingSide === "ai"
  ) {
    interpretation.triggers.push(
      "player_under_pressure"
    );

    if (
      !playerLostQueen &&
      !playerCapturedQueen
    ) {
      interpretation.situation =
        "defensive_pressure";

      interpretation.playerImpact =
        "negative";

      interpretation.summary =
        "Critical defensive pressure detected.";
    }
  }

  /*
    --------------------------------------------------
    COMEBACK
    --------------------------------------------------
  */

  if (
    eventTypes.includes(
      "comeback"
    )
  ) {
    interpretation.triggers.push(
      "comeback"
    );

    if (
      interpretation.playerImpact !==
      "strong_negative"
    ) {
      interpretation.playerImpact =
        "positive";
    }

    if (
      SEVERITY_PRIORITY[
        interpretation.severity
      ] < SEVERITY_PRIORITY.medium
    ) {
      interpretation.severity =
        "medium";

      interpretation.situation =
        "comeback";

      interpretation.summary =
        "Player is recovering from a disadvantage.";
    }
  }

  /*
    --------------------------------------------------
    POSITION RECOVERY
    --------------------------------------------------
  */

  if (
    eventTypes.includes(
      "position_recovered"
    )
  ) {
    interpretation.triggers.push(
      "position_recovered"
    );

    if (
      interpretation.playerImpact ===
      "negative"
    ) {
      interpretation.playerImpact =
        "neutral";
    }

    if (
      interpretation.severity ===
      "none"
    ) {
      interpretation.severity =
        "low";

      interpretation.situation =
        "position_recovered";

      interpretation.summary =
        "Player recovered from immediate pressure.";
    }
  }

  /*
    --------------------------------------------------
    CAPTURE FALLBACK
    --------------------------------------------------
  */

  if (
    eventTypes.includes(
      "capture"
    ) &&
    interpretation.severity ===
      "none"
  ) {
    interpretation.severity =
      "low";

    interpretation.situation =
      "material_exchange";

    interpretation.playerImpact =
      "neutral";

    interpretation.triggers.push(
      "material_change"
    );

    interpretation.summary =
      "Material exchange detected.";
  }

  /*
    --------------------------------------------------
    DEFAULT
    --------------------------------------------------
  */

  if (
    interpretation.severity ===
    "none"
  ) {
    interpretation.severity =
      "low";

    interpretation.situation =
      "normal_play";

    interpretation.playerImpact =
      "neutral";

    interpretation.triggers.push(
      "normal_move"
    );

    interpretation.summary =
      "Normal gameplay.";
  }

  /*
    Remove duplicate triggers while
    preserving their original order.
  */

  interpretation.triggers = [
    ...new Set(
      interpretation.triggers
    ),
  ];

  return interpretation;
}