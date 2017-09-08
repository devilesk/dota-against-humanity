/* exported OnScoreboardButtonPressed */

"use strict";

function OnScoreboardButtonPressed() {
    GameUI.CustomUIConfig().Scoreboard.ToggleFlyoutScoreboardVisible();

    $("#scoreboard-button").SetHasClass("active", GameUI.CustomUIConfig().bScoreboardVisible);
}

/*function UpdateButton() {
    $.Msg("UpdateButton");
    var bVisible = GameUI.CustomUIConfig().Scoreboard.IsFlyoutScoreboardVisible();

    $("#scoreboard-button").SetHasClass("active", bVisible);
    $.Schedule(0.2, UpdateButton);
}*/

(function() {
    //UpdateButton();
    GameUI.CustomUIConfig().ScoreboardButton = $("#scoreboard-button");
})();