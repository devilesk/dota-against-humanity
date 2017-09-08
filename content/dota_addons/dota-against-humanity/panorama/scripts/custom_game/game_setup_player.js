/* exported InstantiatePlayerPanel */

"use strict";

function InstantiatePlayerPanel(playerPanel, playerInfo) {
    playerPanel.FindChildTraverse("PlayerAvatar").steamid = playerInfo.player_steamid;
    playerPanel.SetAttributeInt("player_id", playerInfo.player_id);
    playerPanel.SetHasClass("no_vote", true);
    
    // Update the contents of the player panel when the player information has been modified.
    function OnPlayerDetailsChanged() {
        var playerId = playerPanel.GetAttributeInt("player_id", -1);
        //$.Msg("OnPlayerDetailsChanged", playerId);
        var playerInfo = Game.GetPlayerInfo(playerId);
        if (!playerInfo) return;
        //$.Msg("OnPlayerDetailsChanged", playerInfo);
        playerPanel.FindChildTraverse("PlayerAvatar").steamid = playerInfo.player_steamid;
    }
    
    $.RegisterForUnhandledEvent("DOTAGame_PlayerDetailsChanged", OnPlayerDetailsChanged);
    OnPlayerDetailsChanged();
}