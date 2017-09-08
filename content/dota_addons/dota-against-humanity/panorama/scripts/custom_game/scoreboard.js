/* global InstantiatePlayerPanel */

"use strict";

var g_ScoreboardHandle = null;
var m_PlayerPanels = [];

function IsFlyoutScoreboardVisible() {
    return $.GetContextPanel().BHasClass("flyout_scoreboard_visible");
}

function SetFlyoutScoreboardVisible(bVisible) {
    $.GetContextPanel().SetHasClass("flyout_scoreboard_visible", bVisible);
    //$.Msg('SetFlyoutScoreboardVisible');
    GameUI.CustomUIConfig().bScoreboardVisible = bVisible;
    GameUI.CustomUIConfig().ScoreboardButton.SetHasClass("active", GameUI.CustomUIConfig().bScoreboardVisible);
    if (bVisible) {
        //ScoreboardUpdater_SetScoreboardActive( g_ScoreboardHandle, true );
    } else {
        //ScoreboardUpdater_SetScoreboardActive( g_ScoreboardHandle, false );
    }
}

function ToggleFlyoutScoreboardVisible() {
    $.GetContextPanel().ToggleClass("flyout_scoreboard_visible");
    GameUI.CustomUIConfig().bScoreboardVisible = $.GetContextPanel().BHasClass("flyout_scoreboard_visible");
    //$.Msg('ToggleFlyoutScoreboardVisible');
}

function CreatePlayerPanels() {
    $.Msg("CreatePlayerPanels");
    var parentPanel = $("#players-container");
    var playerPanel;
    for (var i = 1; i <= 8; i++) {
        $.Msg("CreatePlayerPanels", i);
        playerPanel = $.CreatePanel("Panel", parentPanel, "");
        playerPanel.BLoadLayoutSnippet("player-panel");
        InstantiatePlayerPanel(playerPanel);
        playerPanel.SetPlayerSlot(i - 1);
        
        m_PlayerPanels.push(playerPanel);
    }

    playerPanel = $.CreatePanel("Panel", parentPanel, "");
    playerPanel.BLoadLayoutSnippet("player-panel");
    InstantiatePlayerPanel(playerPanel);
    playerPanel.SetPlayerSlot(GameUI.CustomUIConfig().RANDO_PLAYER_ID);
    m_PlayerPanels.push(playerPanel);
}

function UpdatePlayers(msg) {
    $.Msg("UpdatePlayers", msg);

    var playerPanel;
    var playerData;
    for (var i = 1; i <= 8; i++) {
        $.Msg("UpdatePlayers", i);
        playerPanel = m_PlayerPanels[i - 1];
        if (msg.players.hasOwnProperty(i.toString())) {
            playerData = msg.players[i.toString()];
            playerPanel.SetPlayerID(parseInt(playerData.id), Players.GetPlayerName(i - 1));
            playerPanel.SetPlayerPoints(playerData.points);
            playerPanel.SetPlayerVisible(true);
            playerPanel.SetPlayerIsCzar(parseInt(msg.czar) == parseInt(playerData.id));
            //$.Msg(Players.GetPlayerColor( i -1 ));
        } else {
            playerPanel.SetPlayerVisible(false);
        }
    }

    playerPanel = m_PlayerPanels[8];
    if (msg.players.hasOwnProperty(GameUI.CustomUIConfig().RANDO_PLAYER_ID)) {
        playerData = msg.players[GameUI.CustomUIConfig().RANDO_PLAYER_ID];
        playerPanel.SetPlayerID(playerData.id, $.Localize("#rando_name"));
        playerPanel.SetPlayerPoints(playerData.points);
        playerPanel.SetPlayerVisible(true);
        playerPanel.SetPlayerIsCzar(parseInt(msg.czar) == playerData.id);
        //$.Msg(Players.GetPlayerColor( i -1 ));
    } else {
        playerPanel.SetPlayerVisible(false);
    }
}

(function() {
    //if ( ScoreboardUpdater_InitializeScoreboard === null ) { $.Msg( "WARNING: This file requires shared_scoreboard_updater.js to be included." ); }

    var scoreboardConfig = {
        "teamXmlName": "file://{resources}/layout/custom_game/multiteam_flyout_scoreboard_team.xml",
        "playerXmlName": "file://{resources}/layout/custom_game/multiteam_flyout_scoreboard_player.xml",
    };
    //g_ScoreboardHandle = ScoreboardUpdater_InitializeScoreboard( scoreboardConfig, $( "#TeamsContainer" ) );

    SetFlyoutScoreboardVisible(false);
    
    $.RegisterEventHandler("DOTACustomUI_SetFlyoutScoreboardVisible", $.GetContextPanel(), SetFlyoutScoreboardVisible);

    GameEvents.Subscribe("update_players_ui", UpdatePlayers);
    
    GameUI.CustomUIConfig().Scoreboard = {
        SetFlyoutScoreboardVisible: SetFlyoutScoreboardVisible,
        IsFlyoutScoreboardVisible: IsFlyoutScoreboardVisible,
        ToggleFlyoutScoreboardVisible: ToggleFlyoutScoreboardVisible
    };
    
    CreatePlayerPanels();
})();