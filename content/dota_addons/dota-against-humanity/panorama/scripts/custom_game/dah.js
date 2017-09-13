/* global InstantiateChatPanel */
/* global InstantiateCardPanel */
/* exported OnViewPressed */
/* exported OnDiscardAllPressed */
/* exported OnScoreboardButtonPressed */

"use strict";

var m_WhiteCardPanels = [];
var m_ChatPanel;

function SetTimer(data) {
    //$.Msg( "SetTimer", data );
    $("#timer-value").text = Math.round(data.value);
}

function SetTimerLabel(data) {
    //$.Msg( "SetTimerLabel", data );
    $("#timer-label").text = $.Localize(data.value);
}

function SetRoundWinnerMessage(msg) {
    $.Msg("SetRoundWinnerMessage", msg);
    var msgPanel = $("#notification-label");
    if (msg.winner == "tie") {
        msgPanel.text = $.Localize("#vote_end_tie");
    } else if (parseInt(msg.winner) == -1) {
        msgPanel.text = "";
    } else if (parseInt(msg.winner) == Players.GetLocalPlayer()) {
        msgPanel.text = $.Localize("#round_won_self");
    } else {
        var playerName = msg.winner == GameUI.CustomUIConfig().RANDO_PLAYER_ID ? $.Localize("#rando_name") : Players.GetPlayerName(msg.winner);
        msgPanel.text = playerName + $.Localize("#round_won_player");
    }
    msgPanel.SetHasClass("slide-in", true);
    $.Schedule(0.2, function() {
        msgPanel.SetHasClass("slide-in", false);
    });
}

function SetNotificationMessage(msg) {
    $.Msg("SetNotificationMessage", msg);
    var msgPanel = $("#notification-label");
    if (msg.player_id == -1) {
        msgPanel.text = "";
    } else if (parseInt(msg.player_id) == Players.GetLocalPlayer()) {
        msgPanel.text = $.Localize("#your") + msg.text;
    } else {
        msgPanel.text = Players.GetPlayerName(msg.player_id) + $.Localize("#possessive") + msg.text;
    }
    msgPanel.SetHasClass("slide-in", true);
    $.Schedule(0.2, function() {
        msgPanel.SetHasClass("slide-in", false);
    });
}

function SetCzarMessage(data) {
    $.Msg("SetCzarMessage", data);
    var msgPanel = $("#notification-label");
    if (parseInt(data.value) == -1) {
        msgPanel.text = "";
    } else if (parseInt(data.value) == Players.GetLocalPlayer()) {
        msgPanel.text = $.Localize("#czar_is_self");
    } else {
        msgPanel.text = Players.GetPlayerName(data.value) + $.Localize("#czar_is_player");
    }
    msgPanel.SetHasClass("slide-in", true);
    $.Schedule(0.2, function() {
        msgPanel.SetHasClass("slide-in", false);
    });
}

function SetBlackMessage(data) {
    //$.Msg( "SetBlackMessage", msg );
    var msgPanel = $("#black-question");
    msgPanel.text = data.value;
    // if (msg.transition) {
    msgPanel.SetHasClass("slide-in", true);
    $.Schedule(0.2, function() {
        msgPanel.SetHasClass("slide-in", false);
    });
    // }
}

function SetWhiteCards(msg) {
    //$.Msg( "SetWhiteCards", msg );
    for (var i = 1; i <= 21; i++) {
        var cardPanel = m_WhiteCardPanels[i - 1];
        if (msg.cards.hasOwnProperty(i.toString())) {
            var cardData = msg.cards[i.toString()];
            var cardSelectionSlot = GetCardSelectionSlot(cardData.id, msg.selected_cards);
            cardPanel.SetCard(parseInt(cardData.id), cardData.data, cardSelectionSlot, cardData.owner);
            cardPanel.SetCardVisible(true);
            cardPanel.SetCardOwnerVisible(msg.show_owner == true);
            cardPanel.SetCardDiscardVisible(msg.discard == true);
            cardPanel.SetHasClass("winner", cardData.owner == msg.winner);
            cardPanel.SetHasClass("pair", msg.pair);
        } else {
            cardPanel.SetCardVisible(false);
            cardPanel.SetCardOwnerVisible(false);
            cardPanel.SetCardDiscardVisible(false);
            cardPanel.SetHasClass("pair", false);
        }
    }
    $("#discard-all-button").visible = msg.discard_all == true;
    $("#view-button").visible = msg.view == true;
}

function GetCardSelectionSlot(cardId, selectedCards) {
    for (var key in selectedCards) {
        var card = selectedCards[key];
        if (card.id == cardId) {
            return parseInt(key);
        }
    }
    return 0;
}

function CreateWhiteCardPanels() {
    var parentPanel = $("#white-card-container");
    parentPanel.RemoveAndDeleteChildren();
    m_WhiteCardPanels.length = 0;
    for (var i = 1; i <= 21; i++) {
        var cardPanel = $.CreatePanel("Panel", parentPanel, "");
        cardPanel.BLoadLayoutSnippet("card-panel");
        InstantiateCardPanel(cardPanel);
        if (i % 2 == 0) {
            cardPanel.SetHasClass("card-wrapper-right", true);
        } else {
            cardPanel.SetHasClass("card-wrapper-left", true);
        }
        m_WhiteCardPanels.push(cardPanel);
    }
}

function CreateChatPanel() {
    var parentPanel = $("#chat-container");
    m_ChatPanel = $.CreatePanel("Panel", parentPanel, "");
    m_ChatPanel.BLoadLayoutSnippet("chat-panel");
    InstantiateChatPanel(m_ChatPanel);
}

function OnSayButtonPressed() {
    $.Msg("'ENTER' Released", m_ChatPanel);
    m_ChatPanel.SetChatFocus();
}

function OnViewPressed() {
    $.Msg("OnViewPressed", m_ChatPanel);
    GameEvents.SendCustomGameEventToServer("view_selections", {
        "playerID": Players.GetLocalPlayer()
    });
}

function OnDiscardAllPressed() {
    $.Msg("OnDiscardAllPressed", m_ChatPanel);
    GameEvents.SendCustomGameEventToServer("discard_all_white_card", {
        "playerID": Players.GetLocalPlayer()
    });
}

function OnScoreboardButtonPressed() {
    $.Msg("'`' Released", m_ChatPanel);
    m_ChatPanel.SetChatFocus();
}

function UpdateCards() {

}

function OnGameNetTableChange(tableName, key, data) {
    if (key !== "timer") $.Msg( "Table ", tableName, " changed: '", key, "' = ", data );
    if (tableName !== "game") return;
    if (key === "black_card") SetBlackMessage(data);
    if (key === "timer") SetTimer(data);
    if (key === "timer_label") SetTimerLabel(data);
    if (key === "czar") SetCzarMessage(data);
}

function LoadAllGameState() {
    var table = CustomNetTables.GetAllTableValues("game");
    if (table) {
        table.forEach(function (kv) {
            OnGameNetTableChange("game", kv.key, kv.value);
        });
    }
}

(function() {
    $("#view-button").visible = false;
    $("#discard-all-button").visible = false;

    GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_TOP_TIMEOFDAY, false);
    GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_TOP_HEROES, false);
    GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_FLYOUT_SCOREBOARD, false);
    GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_ACTION_PANEL, false);
    GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_ACTION_MINIMAP, false);
    GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_INVENTORY_PANEL, false);
    GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_INVENTORY_SHOP, false);
    GameUI.SetDefaultUIEnabled(DotaDefaultUIElement_t.DOTA_DEFAULT_UI_TOP_MENU_BUTTONS, false);

    Game.AddCommand("CustomGameSay", OnSayButtonPressed, "", 0);
    //Game.AddCommand( "-CustomGameScoreboard", OnScoreboardButtonPressed, "", 0 );

    GameUI.CustomUIConfig().cardClickMode = "select";
    
    CustomNetTables.SubscribeNetTableListener("game", OnGameNetTableChange);
    LoadAllGameState();
    
    GameEvents.Subscribe("set_round_winner_message", SetRoundWinnerMessage);
    GameEvents.Subscribe("set_notification_message", SetNotificationMessage);
    GameEvents.Subscribe("set_white_cards", SetWhiteCards);
    
    CreateWhiteCardPanels();
    CreateChatPanel();
    UpdateCards();

    /*$.RegisterEventHandler( "DOTACustomUI_SetFlyoutScoreboardVisible", $("#chat-container"), function () {
      $.Msg("DOTACustomUI_SetFlyoutScoreboardVisible");
    });*/
    //$.RegisterEventHandler( "DragStart", $('#white-card-container'), OnDragStart);
    //$.RegisterKeyBind("", "Key_ENTER", OnSayButtonPressed);
    //$.RegisterKeyBind("", "Key_J", OnSayButtonPressed);
    //$.RegisterKeyBind("", "KEY_BACKQUOTE", OnSayButtonPressed);
    //UpdatePlayers();
})();