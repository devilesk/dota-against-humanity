"use strict";

function InstantiatePlayerPanel(panel) {
    var m_PlayerID = -1;
    var m_PlayerSlot = -1;
    var m_PlayerVisible = false;
    var m_PlayerName = "";
    var m_PlayerPoints = 0;
    var m_PlayerIsCzar = false;

    function UpdatePlayer() {
        panel.visible = m_PlayerVisible;
        panel.FindChildTraverse('player-name').text = m_PlayerName;
        panel.FindChildTraverse('player-points').text = m_PlayerPoints;
        panel.FindChildTraverse('player-czar').text = m_PlayerIsCzar ? $.Localize("#czar_label") : "";
        $.Schedule(0.1, UpdatePlayer);
    }

    function SetPlayerVisible(bPlayerVisible) {
        m_PlayerVisible = bPlayerVisible;
    }

    function SetPlayerIsCzar(bPlayerIsCzar) {
        m_PlayerIsCzar = bPlayerIsCzar;
    }

    function SetPlayerSlot(iPlayerSlot) {
        m_PlayerSlot = iPlayerSlot;
    }

    function SetPlayerPoints(iPlayerPoints) {
        m_PlayerPoints = iPlayerPoints;
    }

    function SetPlayerID(iPlayerID, sPlayerName) {
        //$.Msg('SetPlayerID', iPlayerID, sPlayerName);
        m_PlayerID = iPlayerID;
        m_PlayerName = sPlayerName;
    }
    
    panel.SetPlayerVisible = SetPlayerVisible;
    panel.SetPlayerIsCzar = SetPlayerIsCzar;
    panel.SetPlayerPoints = SetPlayerPoints;
    panel.SetPlayerID = SetPlayerID;
    panel.SetPlayerSlot = SetPlayerSlot;

    UpdatePlayer(); // initial update of dynamic state
}



(function() {

})();