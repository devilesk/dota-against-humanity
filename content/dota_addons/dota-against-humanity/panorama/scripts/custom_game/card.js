"use strict";

var m_Card = -1;
var m_CardOwner = -1;
var m_CardSlot = -1;
var m_CardSelectionSlot = 0;
var m_CardVisible = false;
var m_CardOwnerVisible = false;
var m_CardText = "";
var m_CardCanDiscard = false;

function UpdateCard() {
    //$.Msg( 'UpdateCard', m_Card );
    $.GetContextPanel().visible = m_CardVisible;
    $('#card-text').text = m_CardText;
    $('#card-selection-number').text = m_CardSelectionSlot > 0 ? m_CardSelectionSlot : "";
    $('#card-owner').visible = m_CardOwnerVisible;
    $('#card-owner').text = m_CardOwner == "rando" ? "Rando Cardrissian" : Players.GetPlayerName(m_CardOwner);
    $('#card-discard').visible = m_CardCanDiscard;
    $.Schedule(0.1, UpdateCard);
}

function OnCardPressed() {
    $.Msg("OnCardPressed", GameUI.CustomUIConfig().cardClickMode);
    var selectedCardId = -1;
    GameEvents.SendCustomGameEventToServer("select_white_card", {
        "playerID": Players.GetLocalPlayer(),
        "card": m_Card
    });
}

function OnDiscardPressed() {
    $.Msg("OnDiscardPressed", GameUI.CustomUIConfig().cardClickMode);
    var selectedCardId = -1;
    GameEvents.SendCustomGameEventToServer("discard_white_card", {
        "playerID": Players.GetLocalPlayer(),
        "card": m_Card
    });
}

function SetCardVisible(bCardVisible) {
    m_CardVisible = bCardVisible;
}

function SetCardOwnerVisible(bCardOwnerVisible) {
    m_CardOwnerVisible = bCardOwnerVisible;
}

function SetCardDiscardVisible(bCardDiscardVisible) {
    m_CardCanDiscard = bCardDiscardVisible;
}

function SetCardSlot(iCardSlot) {
    m_CardSlot = iCardSlot;
}

function SetCard(iCard, sCardText, iCardSelectionSlot, iCardOwner) {
    //$.Msg('SetCard', iCard, sCardText);
    m_Card = iCard;
    m_CardOwner = iCardOwner;
    m_CardText = sCardText;
    m_CardSelectionSlot = iCardSelectionSlot;
}

(function() {
    $.GetContextPanel().SetCardVisible = SetCardVisible;
    $.GetContextPanel().SetCardOwnerVisible = SetCardOwnerVisible;
    $.GetContextPanel().SetCardDiscardVisible = SetCardDiscardVisible;
    $.GetContextPanel().SetCard = SetCard;
    $.GetContextPanel().SetCardSlot = SetCardSlot;

    UpdateCard(); // initial update of dynamic state
})();