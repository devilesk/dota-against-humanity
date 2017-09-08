"use strict";

//--------------------------------------------------------------------------------------------------
// Update the contents of the player panel when the player information has been modified.
//--------------------------------------------------------------------------------------------------
function OnPlayerDetailsChanged() {
    var playerId = $.GetContextPanel().GetAttributeInt("player_id", -1);
    //$.Msg("OnPlayerDetailsChanged", playerId);
    var playerInfo = Game.GetPlayerInfo(playerId);
    if (!playerInfo) return;
    //$.Msg("OnPlayerDetailsChanged", playerInfo);
    $("#PlayerAvatar").steamid = playerInfo.player_steamid;
}


//--------------------------------------------------------------------------------------------------
// Entry point, update a player panel on creation and register for callbacks when the player details
// are changed.
//--------------------------------------------------------------------------------------------------
(function() {
    OnPlayerDetailsChanged();
    $.RegisterForUnhandledEvent("DOTAGame_PlayerDetailsChanged", OnPlayerDetailsChanged);
})();