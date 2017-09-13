require("libraries/list")

PLAYERS = class(
    {},
    {
        __class__name = "PLAYERS"
    },
    List
)

function PLAYERS:GetBotCount()
    return self:Filter(function (player) return player:IsBot() end):Size()
end

function PLAYERS:GetPlayer(playerID)
    return self:Find(function (player) return player:ID() == playerID end)
end

function PLAYERS:IsConnectedSetupReady()
    return self:All(function (player) return player:IsSetupReady() or not player:IsConnected() end)
end

function PLAYERS:ConnectedPlayers()
    return self:Filter(function (player) return player:IsConnected() end)
end

function PLAYERS:AbandonedPlayers()
    return self:Filter(function (player) return player:IsAbandoned() end)
end

function PLAYERS:SetPlayerReady(playerID, v)
    local player = self:GetPlayer(playerID)
    if player then
        player:SetSetupReady(v)
        local PLAYER_READY_STATE = {}
        self:Each(function (p)
            PLAYER_READY_STATE[p:ID()] = p:IsSetupReady()
        end)
        CustomNetTables:SetTableValue("game_setup", "player_ready", PLAYER_READY_STATE)
    end
end