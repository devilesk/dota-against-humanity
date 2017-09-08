/* exported InstantiateCardPanel */

"use strict";

function InstantiateCardPanel(cardPanel) {
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
        cardPanel.visible = m_CardVisible;
        cardPanel.FindChildTraverse("card-text").text = m_CardText;
        cardPanel.FindChildTraverse("card-selection-number").text = m_CardSelectionSlot > 0 ? m_CardSelectionSlot : "";
        cardPanel.FindChildTraverse("card-owner").visible = m_CardOwnerVisible;
        cardPanel.FindChildTraverse("card-owner").text = m_CardOwner == GameUI.CustomUIConfig().RANDO_PLAYER_ID ? $.Localize("#rando_name") : Players.GetPlayerName(m_CardOwner);
        cardPanel.FindChildTraverse("card-discard").visible = m_CardCanDiscard;
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
    
    cardPanel.FindChildTraverse("card-button").SetPanelEvent("onactivate", OnCardPressed);
    cardPanel.FindChildTraverse("card-discard").SetPanelEvent("onactivate", OnDiscardPressed);
    
    cardPanel.SetCardVisible = SetCardVisible;
    cardPanel.SetCardOwnerVisible = SetCardOwnerVisible;
    cardPanel.SetCardDiscardVisible = SetCardDiscardVisible;
    cardPanel.SetCard = SetCard;
    cardPanel.SetCardSlot = SetCardSlot;
    
    UpdateCard(); // initial update of dynamic state
}