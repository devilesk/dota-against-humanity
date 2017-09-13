"use strict";

var m_PlayerPanels = {};

function IsFlyoutScoreboardVisible() {
    return $.GetContextPanel().BHasClass("flyout_scoreboard_visible");
}

function SetFlyoutScoreboardVisible(bVisible) {
    $.GetContextPanel().SetHasClass("flyout_scoreboard_visible", bVisible);
    //$.Msg('SetFlyoutScoreboardVisible');
    GameUI.CustomUIConfig().bScoreboardVisible = bVisible;
    GameUI.CustomUIConfig().ScoreboardButton.SetHasClass("active", GameUI.CustomUIConfig().bScoreboardVisible);
}

function ToggleFlyoutScoreboardVisible() {
    $.GetContextPanel().ToggleClass("flyout_scoreboard_visible");
    GameUI.CustomUIConfig().bScoreboardVisible = $.GetContextPanel().BHasClass("flyout_scoreboard_visible");
    //$.Msg('ToggleFlyoutScoreboardVisible');
}

function CreatePlayerPanels() {
    $.Msg("CreatePlayerPanels");
    var parentPanel = $("#players-container");
    parentPanel.RemoveAndDeleteChildren();
    m_PlayerPanels = {};
    var playerPanel;
    for (var i = 0; i < 8; i++) {
        $.Msg("CreatePlayerPanels", i);
        playerPanel = $.CreatePanel("Panel", parentPanel, "");
        playerPanel.BLoadLayoutSnippet("player-panel");
        playerPanel.visible = false;
        m_PlayerPanels[i] = playerPanel;
    }

    playerPanel = $.CreatePanel("Panel", parentPanel, "");
    playerPanel.BLoadLayoutSnippet("player-panel");
    playerPanel.visible = false;
    m_PlayerPanels[GameUI.CustomUIConfig().RANDO_PLAYER_ID] = playerPanel;
}

function UpdatePlayer(key, data) {
    var playerId = key === GameUI.CustomUIConfig().RANDO_PLAYER_ID ? GameUI.CustomUIConfig().RANDO_PLAYER_ID : parseInt(key);
    var playerPanel = m_PlayerPanels[playerId];
    $.Msg("UpdatePlayer", playerPanel, playerId);
    if (key === GameUI.CustomUIConfig().RANDO_PLAYER_ID) {
        playerPanel.FindChildTraverse("player-name").text = $.Localize("#rando_name");
    }
    else {
        var playerInfo = Game.GetPlayerInfo(playerId);
        if (!playerInfo) return;
        playerPanel.FindChildTraverse("player-name").text = Players.GetPlayerName(playerId);
    }
    playerPanel.FindChildTraverse("player-points").text = data.value;
    playerPanel.visible = true;
        
}

function SetCzar(data) {
    $.Msg("SetCzar", data);
    for (var playerId in m_PlayerPanels) {
        var playerPanel = m_PlayerPanels[playerId];
        playerPanel.FindChildTraverse("player-czar").text = playerId == data.value ? $.Localize("#czar_label") : "";
    }
}

function InitCzar() {
    SetCzar(CustomNetTables.GetTableValue("game", "czar") || {value: null});
}

function OnPointsNetTableChange(tableName, key, data) {
    $.Msg( "Table ", tableName, " changed: '", key, "' = ", data );
    if (tableName !== "points") return;
    UpdatePlayer(key, data);
}

function LoadAllPointsState() {
    var table = CustomNetTables.GetAllTableValues("points");
    if (table) {
        table.forEach(function (kv) {
            OnPointsNetTableChange("points", kv.key, kv.value);
        });
    }
}

function OnGameNetTableChange(tableName, key, data) {
    if (key !== "timer") $.Msg( "Table ", tableName, " changed: '", key, "' = ", data );
    if (tableName !== "game") return;
    if (key === "czar") SetCzar(data);
}

(function() {
    SetFlyoutScoreboardVisible(false);
    
    $.RegisterEventHandler("DOTACustomUI_SetFlyoutScoreboardVisible", $.GetContextPanel(), SetFlyoutScoreboardVisible);
    
    CustomNetTables.SubscribeNetTableListener("points", OnPointsNetTableChange);
    CustomNetTables.SubscribeNetTableListener("game", OnGameNetTableChange);
    
    CreatePlayerPanels();
    LoadAllPointsState();
    InitCzar();
    
    GameUI.CustomUIConfig().Scoreboard = {
        SetFlyoutScoreboardVisible: SetFlyoutScoreboardVisible,
        IsFlyoutScoreboardVisible: IsFlyoutScoreboardVisible,
        ToggleFlyoutScoreboardVisible: ToggleFlyoutScoreboardVisible
    };
})();