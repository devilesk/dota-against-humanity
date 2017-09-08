var rule_data = [
    {
        id: "PACKING_HEAT",
        type: "ToggleButton",
        header: "Packing Heat",
        description: "For Pick 2s, all players draw an extra card before playing the hand to open up more options."
    },
    {
        id: "RANDO_CARDISSIAN",
        type: "ToggleButton",
        header: "Rando Cardissian",
        description: "Every round, pick one random White Card from the pile and place it into play. This card belongs to an imaginary player named Rando Cardissian, and if he wins the game, all players go home in a state of everlasting shame."
    },
    {
        type: "divider"
    },
    {
        id: "COUP_DETAT",
        type: "RadioButton",
        group: "round-winner-setting",
        header: "Coup d'état",
        description: "The player that wins the round becomes the next czar."
    },
    {
        id: "GOD_IS_DEAD",
        type: "RadioButton",
        group: "round-winner-setting",
        header: "God is Dead",
        description: "Play without a Card Czar. Each player picks his or her favorite card each round. The card with the most votes wins the round."
    },
    {
        id: "SURVIVAL_FITTEST",
        type: "RadioButton",
        group: "round-winner-setting",
        header: "Survival of the Fittest",
        description: "After everyone has answered the question, players take turns eliminating one card each. The last remaining card is declared the funniest."
    },
    {
        type: "divider"
    },
    {
        id: "NEVER_EVER",
        type: "RadioButton",
        group: "discard-setting",
        header: "Never Have I Ever",
        description: "At any time, players may discard cards that they don't understand, but they must confess their ignorance to the group and suffer the resulting humiliation."
    },
    {
        id: "REBOOTING_UNIVERSE",
        type: "RadioButton",
        group: "discard-setting",
        header: "Rebooting the Universe",
        description: "At any time, players may trade in an Awesome Point to return as many White Cards as they'd like to the deck and draw back up to ten."
    },
    {
        id: "EXECUTIVE_PRIVILEGE",
        type: "RadioButton",
        group: "discard-setting",
        header: "Executive Privilege",
        description: "While players are choosing which White Cards to play, the czar may discard as many of their White Cards as they'd like and draw back up to ten."
    },
    {
        id: "BETTER_LUCK",
        type: "RadioButton",
        group: "discard-setting",
        header: "Better Luck Next Time",
        description: "Players can trade in all their White Cards, but skip their current turn."
    }
]

var ruleLayout =
    '<{type} id="rule-input" group="{group}" class="rule-input" onactivate="">' +
    '    <Label id="rule-header" class="rule-header" text="" />' +
    '    <Label id="rule-description" class="rule-description" text="" />' +
    '</{type}>' +
    '<Panel id="vote-results-container" class="vote-results-container"></Panel>';

var playerReadyPanels;
var started = false;
var playerIds = [];
var teamId = 2;
var localPlayerId;
var currentPlayerId;

function CreateHouseRulesPanels() {
    var parentPanel = $("#house-rules-container");
    for (var i = 0; i < rule_data.length; i++) {
        var r = rule_data[i];
        $.Msg(r);
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
        $.Msg(layout);
        rulePanel.BCreateChildren(layout);
        rulePanel.SetHasClass("block", true);
        rulePanel.SetHasClass("house-rules-block", true);
        rulePanel.FindChildTraverse("rule-header").text = r.header;
        rulePanel.FindChildTraverse("rule-description").text = r.description;
        var ruleInput = rulePanel.FindChildTraverse("rule-input");
        r.input = ruleInput;
        r.input.rule = r;
        r.panel = rulePanel;
        BindRuleInputActivate(ruleInput, r, rule_data);
        ruleInput.votePlayers = CreatePlayerPanels(rulePanel.FindChildTraverse("vote-results-container"));
    }
}

function BindRuleInputActivate(ruleInput, rule, rules) {
    ruleInput.SetPanelEvent("onactivate", function() {
        $.Msg("onactivate", ruleInput.IsSelected());
        if (started) return;
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

function ReceivePlayerState(msg) {
    $.Msg("ReceivePlayerState", msg);
    currentPlayerId = parseInt(msg.player_id);
    for (var i = 0; i < rule_data.length; i++) {
        var rule = rule_data[i];
        if (rule.type == "divider") continue;
        $.Msg(rule.id, msg.state[rule.id]);
        if (msg.state[rule.id] == undefined || msg.state[rule.id] == 0) {
            SetPlayerVote(rule.input.votePlayers, parseInt(msg.player_id), false);
            rule.input.checked = false;
        } else {
            SetPlayerVote(rule.input.votePlayers, parseInt(msg.player_id), true);
            rule.input.checked = true;
        }
        /*if (rule.id == msg.rule_id) {
          var ruleInput = rule.input;
          SetPlayerVote(ruleInput.votePlayers, parseInt(msg.player_id), msg.selected);
        }*/
    }
    $("#ready-button").checked = msg.is_ready;
    OnReadyButtonPressed();
}

function UpdatePlayerVote(msg) {
    for (var i = 0; i < rule_data.length; i++) {
        var rule = rule_data[i];
        if (rule.id == msg.rule_id) {
            var ruleInput = rule.input;
            SetPlayerVote(ruleInput.votePlayers, parseInt(msg.player_id), msg.selected);
        }
    }
}

function UpdatePlayerReady(msg) {
    SetPlayerVote(playerReadyPanels, msg.player_id, msg.is_ready);
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
            playerPanel.SetHasClass("no_vote", bVote == false);
            playerPanel.SetHasClass("vote", bVote == true);
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
    if (!started) {
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
    $.Msg("CreatePlayerPanels", parentPanel);
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
    //currentPlayerId = parseInt($('#player-debug').GetSelected().id.replace('entry', ''));
    //$.Msg("switch player", currentPlayerId);
    var playerId = parseInt($('#player-debug').GetSelected().id.replace('entry', ''));
    $.Msg("OnDropDownChanged ", playerId);
    GameEvents.SendCustomGameEventToServer("game_setup_get_player_state", {
        "local_player_id": localPlayerId,
        "player_id": playerId
    });
}

(function() {

    localPlayerId = Players.GetLocalPlayer();
    currentPlayerId = Players.GetLocalPlayer();

    $.Msg("localPlayerId", localPlayerId);
    $.Msg("currentPlayerId", currentPlayerId);

    UpdateTimer();
    //CreatePlayerPanels($("#vote-container-1"));
    var unassignedPlayers = Game.GetUnassignedPlayerIDs();
    for (var i = 0; i < unassignedPlayers.length; ++i) {
        var playerId = unassignedPlayers[i];
        $.Msg("unassigned player id ", playerId);
    }

    var allTeamIDs = Game.GetAllTeamIDs();
    for (var teamId of allTeamIDs) {
        $.Msg("team id ", teamId);
    }
    playerIds = Game.GetPlayerIDsOnTeam(teamId);
    for (var i = 0; i < playerIds.length; i++) {
        $.Msg("player id ", playerIds[i]);
    }
    CreateHouseRulesPanels();
    playerReadyPanels = CreatePlayerPanels($("#player-ready-container"));

    GameEvents.Subscribe("receive_player_state", ReceivePlayerState);
    GameEvents.Subscribe("update_player_vote", UpdatePlayerVote);
    GameEvents.Subscribe("update_player_ready", UpdatePlayerReady);
    GameEvents.Subscribe("all_players_ready", function() {
        started = true;
        $("#ready-button").enabled = false;
    });
})();