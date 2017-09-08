"use strict";

function OnScoreboardButtonPressed() {
    var $root = $.GetContextPanel().GetParent().GetParent();
    var $customui = $.GetContextPanel().GetParent().GetParent().FindChild("CustomUI");
    var $flyout_scoreboard_container = $.GetContextPanel().GetParent().GetParent().FindChild("CustomUIContainer_FlyoutScoreboard");
    var $scoreboard = $flyout_scoreboard_container.FindChild("flyout_scoreboard");
    /*$.Msg("OnScoreboardButtonPressed root", $root);
    $.Msg($root.GetChildCount());
    $root.Children().forEach(function (u) {
      $.Msg(u);
    });
    $.Msg("OnScoreboardButtonPressed customui", $customui);
    $.Msg($customui.GetChildCount());
    $customui.Children().forEach(function (u) {
      $.Msg(u);
    });
    $.Msg("OnScoreboardButtonPressed flyout_scoreboard_container", $flyout_scoreboard_container);
    $.Msg($flyout_scoreboard_container.GetChildCount());
    $flyout_scoreboard_container.Children().forEach(function (u) {
      $.Msg(u);
    });
    $.Msg("OnScoreboardButtonPressed scoreboard", $scoreboard);
    $.Msg($customui.GetChildCount());
    $customui.Children().forEach(function (u) {
      $.Msg(u);
    });*/
    $scoreboard.ToggleFlyoutScoreboardVisible();

    $.GetContextPanel().FindChild("scoreboard-button").SetHasClass("active", GameUI.CustomUIConfig().bScoreboardVisible);
    //$.Msg("$.GetContextPanel()", $.GetContextPanel());
}

function UpdateButton() {
    var $root = $.GetContextPanel().GetParent().GetParent();
    var $customui = $.GetContextPanel().GetParent().GetParent().FindChild("CustomUI");
    var $flyout_scoreboard_container = $.GetContextPanel().GetParent().GetParent().FindChild("CustomUIContainer_FlyoutScoreboard");
    var $scoreboard = $flyout_scoreboard_container.FindChild("flyout_scoreboard");
    $.Msg("UpdateButton");
    var bVisible = $scoreboard.IsFlyoutScoreboardVisible();

    $.GetContextPanel().FindChild("scoreboard-button").SetHasClass("active", bVisible);
    $.Schedule(0.2, UpdateButton);
}

(function() {
    //UpdateButton();
    GameUI.CustomUIConfig().ScoreboardButtonContext = $.GetContextPanel();
})();