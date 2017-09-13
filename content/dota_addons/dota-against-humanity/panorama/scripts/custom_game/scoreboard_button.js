/* exported OnScoreboardButtonPressed */

"use strict";

function OnScoreboardButtonPressed() {
    GameUI.CustomUIConfig().Scoreboard.ToggleFlyoutScoreboardVisible();

    $("#scoreboard-button").SetHasClass("active", GameUI.CustomUIConfig().bScoreboardVisible);
}

(function() {
    GameUI.CustomUIConfig().ScoreboardButton = $("#scoreboard-button");
})();