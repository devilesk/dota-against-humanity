"use strict";

var m_PlayerID = -1;
var m_PlayerSlot = -1;
var m_PlayerVisible = false;
var m_PlayerName = "";
var m_PlayerPoints = 0;
var m_PlayerIsCzar = false;

function UpdatePlayer() {
    $.GetContextPanel().visible = m_PlayerVisible;
    $('#player-name').text = m_PlayerName;
    $('#player-points').text = m_PlayerPoints;
    $('#player-czar').text = m_PlayerIsCzar ? 'CZAR' : '';
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

(function() {
    $.GetContextPanel().SetPlayerVisible = SetPlayerVisible;
    $.GetContextPanel().SetPlayerIsCzar = SetPlayerIsCzar;
    $.GetContextPanel().SetPlayerPoints = SetPlayerPoints;
    $.GetContextPanel().SetPlayerID = SetPlayerID;
    $.GetContextPanel().SetPlayerSlot = SetPlayerSlot;

    UpdatePlayer(); // initial update of dynamic state
})();