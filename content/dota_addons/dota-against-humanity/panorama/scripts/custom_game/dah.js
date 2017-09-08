var m_WhiteCardPanels = [];
var m_ChatPanel;

function SetTimer(msg) {
    //$.Msg( "SetTimer", msg );
    $('#timer-value').text = msg.value
    $('#timer-label').text = msg.label
}

function SetRoundWinnerMessage(msg) {
    $.Msg("SetRoundWinnerMessage", msg);
    var msgPanel = $('#notification-label');
    if (msg.winner == "tie") {
        msgPanel.text = "Voting ended in a tie. No winner this round!";
    } else if (parseInt(msg.winner) == -1) {
        msgPanel.text = "";
    } else if (parseInt(msg.winner) == Players.GetLocalPlayer()) {
        msgPanel.text = "You won the round!";
    } else {
        var playerName = msg.winner == "rando" ? "Rando Cardrissian" : Players.GetPlayerName(msg.winner)
        msgPanel.text = playerName + " won the round!";
    }
    msgPanel.SetHasClass("slide-in", true);
    $.Schedule(0.2, function() {
        msgPanel.SetHasClass("slide-in", false);
    });
}

function SetNotificationMessage(msg) {
    $.Msg("SetNotificationMessage", msg);
    var msgPanel = $('#notification-label');
    if (msg.player_id == -1) {
        msgPanel.text = "";
    } else if (parseInt(msg.player_id) == Players.GetLocalPlayer()) {
        msgPanel.text = "Your " + msg.text;
    } else {
        msgPanel.text = Players.GetPlayerName(msg.player_id) + "'s " + msg.text;
    }
    msgPanel.SetHasClass("slide-in", true);
    $.Schedule(0.2, function() {
        msgPanel.SetHasClass("slide-in", false);
    });
}

function SetCzarMessage(msg) {
    $.Msg("SetCzarMessage", msg);
    var msgPanel = $('#notification-label');
    if (parseInt(msg.czar) == -1) {
        msgPanel.text = "";
    } else if (parseInt(msg.czar) == Players.GetLocalPlayer()) {
        msgPanel.text = "You are the czar";
    } else {
        msgPanel.text = Players.GetPlayerName(msg.czar) + " is the czar";
    }
    msgPanel.SetHasClass("slide-in", true);
    $.Schedule(0.2, function() {
        msgPanel.SetHasClass("slide-in", false);
    });
}

function SetBlackMessage(msg) {
    //$.Msg( "SetBlackMessage", msg );
    var msgPanel = $('#black-question');
    msgPanel.text = msg.text
    if (msg.transition) {
        msgPanel.SetHasClass("slide-in", true);
        $.Schedule(0.2, function() {
            msgPanel.SetHasClass("slide-in", false);
        });
    }
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
    $('#discard-all-button').visible = msg.discard_all == true;
    $('#view-button').visible = msg.view == true;
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
    for (var i = 1; i <= 21; i++) {
        var cardPanel = $.CreatePanel("Panel", parentPanel, "");
        cardPanel.BLoadLayout("file://{resources}/layout/custom_game/card.xml", false, false);
        if (i % 2 == 0) {
            cardPanel.SetHasClass("card-wrapper-right", true);
        } else {
            cardPanel.SetHasClass("card-wrapper-left", true);
        }
        cardPanel.SetCardSlot(i - 1);
        m_WhiteCardPanels.push(cardPanel);
    }
}

function CreateChatPanel() {
    var parentPanel = $("#chat-container");
    m_ChatPanel = $.CreatePanel("Panel", parentPanel, "");
    m_ChatPanel.BLoadLayout("file://{resources}/layout/custom_game/chat/chat.xml", false, false);
}
/*
function OnPlayPressed(id) {
  $.Msg("OnPlayPressed", id);
  if (!$('#' + id).BHasClass("active")) {
    $("#select-button").ToggleClass("active");
    $("#discard-button").ToggleClass("active");
  }
  GameUI.CustomUIConfig().cardClickMode = id.replace('-button', '');
}
*/

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

function OnActivate() {
    $.Msg("OnActivate");
}


function OnDragStart(panelId, dragCallbacks) {
    $.Msg("DragStart");
}

(function() {
    $('#view-button').visible = false;
    $('#discard-all-button').visible = false;

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

    GameUI.CustomUIConfig().cardClickMode = 'select';

    GameEvents.Subscribe("set_timer", SetTimer);
    GameEvents.Subscribe("set_black_message", SetBlackMessage);
    GameEvents.Subscribe("set_round_winner_message", SetRoundWinnerMessage);
    GameEvents.Subscribe("set_czar_message", SetCzarMessage);
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