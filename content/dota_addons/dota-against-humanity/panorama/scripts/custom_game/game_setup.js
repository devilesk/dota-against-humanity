"use strict";

var rule_data = [
    {
        id: "PACKING_HEAT",
        type: "ToggleButton"
    },
    {
        id: "RANDO_CARDISSIAN",
        type: "ToggleButton"
    },
    {
        type: "divider"
    },
    {
        id: "COUP_DETAT",
        type: "RadioButton",
        group: "round-winner-setting"
    },
    {
        id: "GOD_IS_DEAD",
        type: "RadioButton",
        group: "round-winner-setting"
    },
    {
        id: "SURVIVAL_FITTEST",
        type: "RadioButton",
        group: "round-winner-setting"
    },
    {
        type: "divider"
    },
    {
        id: "NEVER_EVER",
        type: "RadioButton",
        group: "discard-setting"
    },
    {
        id: "REBOOTING_UNIVERSE",
        type: "RadioButton",
        group: "discard-setting"
    },
    {
        id: "EXECUTIVE_PRIVILEGE",
        type: "RadioButton",
        group: "discard-setting"
    },
    {
        id: "BETTER_LUCK",
        type: "RadioButton",
        group: "discard-setting"
    }
]

var ruleLayout =
    '<{type} id="rule-input" group="{group}" class="rule-input" onactivate="">' +
    '    <Label id="rule-header" class="rule-header" text="" />' +
    '    <Label id="rule-description" class="rule-description" text="" />' +
    '</{type}>' +
    '<Panel id="vote-results-container" class="vote-results-container"></Panel>';

var playerReadyPanels;
var finished = false;
var currentPlayerId;

function DeleteHouseRulesPanels() {
    var parentPanel = $("#house-rules-container");
    parentPanel.RemoveAndDeleteChildren();
    for (var i = 0; i < rule_data.length; i++) {
        var r = rule_data[i];
        if (r.type == "divider") continue;
        r.input = null;
        r.panel = null;
    }
}

function CreateHouseRulesPanels() {
    var parentPanel = $("#house-rules-container");
    for (var i = 0; i < rule_data.length; i++) {
        var r = rule_data[i];
        //$.Msg(r);
        var rulePanel = $.CreatePanel("Panel", parentPanel, "");
        //rulePanel.BLoadLayout( "file://{resources}/layout/custom_game/game_setup_rule_" + r.type +".xml", false, false );
        if (r.type == "divider") {
            rulePanel.SetHasClass("divider", true);
            continue;
        }
        //r.id = i;
        var layout = ruleLayout.replace(/{type}/g, r.type);
        if (r.type == "RadioButton") {
            layout = layout.replace(/{group}/g, r.group);
        } else {
            layout = layout.replace(/group="{group}"/g, "");
        }
        //$.Msg(layout);
        rulePanel.BCreateChildren(layout);
        rulePanel.SetHasClass("block", true);
        rulePanel.SetHasClass("house-rules-block", true);
        rulePanel.FindChildTraverse("rule-header").text = $.Localize("#house_rule_" + r.id);
        rulePanel.FindChildTraverse("rule-description").text = $.Localize("#house_rule_" + r.id + "_description");
        var ruleInput = rulePanel.FindChildTraverse("rule-input");
        r.input = ruleInput;
        r.input.rule = r;
        r.panel = rulePanel;
        BindRuleInputActivate(ruleInput, r, rule_data);
        ruleInput.votePlayers = CreatePlayerPanels(rulePanel.FindChildTraverse("vote-results-container"));
    }
    LoadAllHouseRuleVoteState();
}

function BindRuleInputActivate(ruleInput, rule, rules) {
    ruleInput.SetPanelEvent("onactivate", function() {
        $.Msg("onactivate", ruleInput.IsSelected());
        if (finished) return;
        if (HasPlayerVote(ruleInput.votePlayers, currentPlayerId) && ruleInput.IsSelected()) ruleInput.checked = false;
        //$.Msg("ruleInput", ruleData);
        //$.Msg(ruleInput);
        //$.Msg(ruleInput.IsSelected());
        //$.Msg(ruleInput.votePlayers);
        if (rule.type == "RadioButton") {
            var other_radios = rules.filter(function(r) {
                return r.type == "RadioButton" && r.group == rule.group;
            }).map(function(r) {
                return r.input;
            }).forEach(function(ruleInput) {
                SetPlayerVote(ruleInput.votePlayers, currentPlayerId, ruleInput.IsSelected());
                GameEvents.SendCustomGameEventToServer("game_setup_player_vote_change", {
                    "player_id": currentPlayerId,
                    "rule_id": ruleInput.rule.id,
                    "selected": ruleInput.IsSelected()
                });
                ruleInput.rule.panel.SetHasClass("vote_pass", TallyVotes(ruleInput.votePlayers));
            });
            $.Msg(other_radios);
        }
        SetPlayerVote(ruleInput.votePlayers, currentPlayerId, ruleInput.IsSelected());
        GameEvents.SendCustomGameEventToServer("game_setup_player_vote_change", {
            "player_id": currentPlayerId,
            "rule_id": rule.id,
            "selected": ruleInput.IsSelected()
        });
        $.Msg("tally", TallyVotes(ruleInput.votePlayers));
        rule.panel.SetHasClass("vote_pass", TallyVotes(ruleInput.votePlayers));
        if ($("#ready-button").checked) {
            $("#ready-button").checked = false;
            OnReadyButtonPressed();
        }
    });
}

function OnGameSetupNetTableChange(tableName, key, data) {
    $.Msg( "Table ", tableName, " changed: '", key, "' = ", data );
    if (tableName !== "game_setup") return;
    if (key === "player_ready") LoadPlayerReadyState(data);
    if (key === "finished") UpdateReadyButton(data);
}

function InitReadyButton() {
    var data = CustomNetTables.GetTableValue("game_setup", "finished") || {value: false};
    UpdateReadyButton(data);
}

function UpdateReadyButton(data) {
    $.Msg("UpdateReadyButton", data);
    $("#ready-button").enabled = !data.value;
    finished = data.value;
}

function LoadPlayerReadyState(data) {
    var playerIds = Game.GetPlayerIDsOnTeam(DOTATeam_t.DOTA_TEAM_GOODGUYS);
    playerIds.forEach(function (playerId) {
        SetPlayerVote(playerReadyPanels, playerId, !!data[playerId]);
        if (playerId == currentPlayerId) $("#ready-button").checked = !!data[playerId];
    });
}

function LoadAllPlayerReadyState() {
    var data = CustomNetTables.GetTableValue("game_setup", "player_ready");
    $.Msg("LoadAllPlayerReadyState", data);
    if (data) LoadPlayerReadyState(data);
}

function OnHouseRulesNetTableChange(tableName, key, data) {
    $.Msg( "Table ", tableName, " changed: '", key, "' = ", data );
    if (tableName !== "game_setup_house_rules") return;
    LoadHouseRuleVoteState(key, data);
}

function LoadHouseRuleVoteState(key, data) {
    var playerIds = Game.GetPlayerIDsOnTeam(DOTATeam_t.DOTA_TEAM_GOODGUYS);
    for (var i = 0; i < rule_data.length; i++) {
        var rule = rule_data[i];
        if (rule.type == "divider" || rule.id !== key) continue;
        playerIds.forEach(function (playerId) {
            SetPlayerVote(rule.input.votePlayers, parseInt(playerId), !!data[playerId]);
            if (playerId == currentPlayerId) rule.input.checked = !!data[playerId];
        });
    }
}

function LoadAllHouseRuleVoteState() {
    var table = CustomNetTables.GetAllTableValues("game_setup_house_rules");
    if (table) {
        table.forEach(function (kv) {
            LoadHouseRuleVoteState(kv.key, kv.value);
        });
    }
}

function TallyVotes(panels) {
    return panels.filter(function(playerPanel) {
        return playerPanel.BHasClass("vote");
    }).length > panels.length / 2;
}

function SetPlayerVote(panels, playerID, bVote) {
    for (var i = 0; i < panels.length; i++) {
        var playerPanel = panels[i];
        var id = playerPanel.GetAttributeInt("player_id", -1);
        if (id == playerID) {
            playerPanel.SetHasClass("no_vote", !bVote);
            playerPanel.SetHasClass("vote", !!bVote);
        }
    }
}

function HasPlayerVote(panels, playerID) {
    for (var i = 0; i < panels.length; i++) {
        var playerPanel = panels[i];
        var id = playerPanel.GetAttributeInt("player_id", -1);
        if (id == playerID) {
            return playerPanel.BHasClass("vote");
        }
    }
    return false;
}

function OnReadyButtonPressed() {
    if (!finished) {
        $.Msg("OnReadyButtonPressed", currentPlayerId, $("#ready-button").checked);
        SetPlayerVote(playerReadyPanels, currentPlayerId, $("#ready-button").checked);
        GameEvents.SendCustomGameEventToServer("game_setup_player_ready_state_change", {
            "player_id": currentPlayerId,
            "is_ready": $("#ready-button").checked
        });
    }
}

function CreatePlayerPanels(parentPanel) {
    var m_PlayerPanels = [];
    $.Msg("CreatePlayerPanels", playerIds, parentPanel);
    var playerIds = Game.GetPlayerIDsOnTeam(DOTATeam_t.DOTA_TEAM_GOODGUYS);
    for (var i = 0; i < playerIds.length; ++i) {
        var playerId = playerIds[i];
        var playerInfo = Game.GetPlayerInfo(playerId);
        if (!playerInfo) {
            $.Msg("no player info", playerId);
            continue;
        } else {
            //$.Msg("player info", playerInfo);
            //$.Msg("player info", playerInfo);
        }
        var playerPanel = $.CreatePanel("Panel", parentPanel, "");
        playerPanel.BLoadLayoutSnippet("game_setup_player");
        InstantiatePlayerPanel(playerPanel, playerInfo);

        //$.Msg(playerInfo.player_steamid, playerPanel.FindChild("PlayerAvatar"));
        //$.Msg("player info", playerInfo);
        m_PlayerPanels.push(playerPanel);
    }
    return m_PlayerPanels;
}

function UpdateTimer() {
    var gameTime = Game.GetGameTime();
    var transitionTime = Game.GetStateTransitionTime();

    if (transitionTime >= 0) {
        $("#StartGameCountdownTimer").SetDialogVariableInt("countdown_timer_seconds", Math.max(0, Math.floor(transitionTime - gameTime)));
        //$.Msg(Math.max( 0, Math.floor( transitionTime - gameTime ) ));
        $("#StartGameCountdownTimer").SetHasClass("countdown_active", true);
        $("#StartGameCountdownTimer").SetHasClass("countdown_inactive", false);
    } else {
        //$.Msg("UpdateTimer", transitionTime);
        $("#StartGameCountdownTimer").SetHasClass("countdown_active", false);
        $("#StartGameCountdownTimer").SetHasClass("countdown_inactive", true);
    }
    $.Schedule(0.1, UpdateTimer);
}

function OnDropDownChanged() {
    currentPlayerId = parseInt($('#player-debug').GetSelected().id.replace('entry', ''));
    var playerId = parseInt($('#player-debug').GetSelected().id.replace('entry', ''));
    $.Msg("OnDropDownChanged", currentPlayerId);
    LoadAllHouseRuleVoteState();
    LoadAllPlayerReadyState();
}

function DebugInitDropdown() {
    var parentPanel = $("#player-debug-container");
    parentPanel.RemoveAndDeleteChildren();
    var layout = '<DropDown id="player-debug">';
    var playerIds = Game.GetPlayerIDsOnTeam(DOTATeam_t.DOTA_TEAM_GOODGUYS);
    playerIds.forEach(function (playerId) {
        layout += '<Label text="' + Players.GetPlayerName(playerId) + '" id="entry' + playerId + '" />'
    });
    layout += '</DropDown>';
    parentPanel.BCreateChildren(layout);
    parentPanel.FindChildTraverse("player-debug").SetPanelEvent("oninputsubmit", OnDropDownChanged);
}

function OnTeamPlayerListChanged() {
    $.Msg("OnTeamPlayerListChanged");
    Update();
}

function Update() {
    DeleteHouseRulesPanels();
    CreateHouseRulesPanels();
    $("#player-ready-container").RemoveAndDeleteChildren();
    playerReadyPanels = CreatePlayerPanels($("#player-ready-container"));
    LoadAllPlayerReadyState();
    InitReadyButton();
    DebugInitDropdown();
}

(function() {

    currentPlayerId = Players.GetLocalPlayer();

    $.Msg("currentPlayerId", currentPlayerId);

    UpdateTimer();
    
    Update();
    

    CustomNetTables.SubscribeNetTableListener("game_setup_house_rules", OnHouseRulesNetTableChange);
    CustomNetTables.SubscribeNetTableListener("game_setup", OnGameSetupNetTableChange);
    
    GameUI.CustomUIConfig().RANDO_PLAYER_ID = "rando";
    
    $.RegisterForUnhandledEvent( "DOTAGame_TeamPlayerListChanged", OnTeamPlayerListChanged );
})();