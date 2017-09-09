require("libraries/functional")
require("libraries/util")
require("libraries/list")
require("libraries/timers")
require("player")
require("players")
require("dah")

PLAYERLIST = PLAYERS({})
MAX_PLAYERS = 8
HOUSE_RULES_VOTE_STATE = {}
HOUSE_RULES_STATE = {}
STARTED = false
DEBUG_FAKE_CLIENTS = true
DEBUG_MAX_BOTS = 1
DEBUG_HOUSE_RULES_STATE = {
    -- [DAH.HOUSE_RULE.PACKING_HEAT]        = true,
    -- [DAH.HOUSE_RULE.RANDO_CARDISSIAN]    = true,
    -- [DAH.HOUSE_RULE.COUP_DETAT]          = true,
    [DAH.HOUSE_RULE.GOD_IS_DEAD]         = true,
    -- [DAH.HOUSE_RULE.SURVIVAL_FITTEST]    = true,
    -- [DAH.HOUSE_RULE.NEVER_EVER]          = true,
    -- [DAH.HOUSE_RULE.REBOOTING_UNIVERSE]  = true,
    -- [DAH.HOUSE_RULE.EXECUTIVE_PRIVILEGE] = true,
    -- [DAH.HOUSE_RULE.BETTER_LUCK]         = true,
}
DEBUG_ROUND_TIME = {
    -- CARD_SELECT   = 0.1,
    -- WINNER_SELECT = 0.1,
    -- ELIM_SELECT   = 0.1,
    -- NEXT_ROUND    = 0.1,
}

if GameMode == nil then
    GameMode = class({})
end

function Precache(context)
    PrecacheResource( "soundfile", "soundevents/game_sounds_heroes/game_sounds_legion_commander.vsndevts", context )
end

function GameMode:OnConnectFull(keys)
    local entIndex = keys.index+1
    -- The Player entity of the joining user
    local ply = EntIndexToHScript(entIndex)

    -- The Player ID of the joining player
    local playerID = ply:GetPlayerID()
    print("OnConnectFull", playerID)
    PrintTable(keys)
    --DumpPlayerConnectionState()
    
    self:AddPlayer(playerID)
end

function GameMode:AddPlayer(playerID)
    local is_bot = PlayerResource:IsFakeClient(playerID)
    PLAYERLIST:Push(PLAYER(playerID, is_bot))
    PlayerResource:SetCustomTeamAssignment(playerID, DOTA_TEAM_GOODGUYS)
end

function GameMode:OnDisconnect(keys)
    local name = keys.name
    local networkid = keys.networkid
    local reason = keys.reason
    local userid = keys.userid
    print("OnDisconnect")
    PrintTable(keys)
    DumpPlayerConnectionState()
end

function GameMode:OnPlayerReconnect(keys)
    print("OnPlayerReconnect")
    PrintTable(keys)
    DumpPlayerConnectionState()
end

function GameMode:OnNPCSpawned(event)
    local npc = EntIndexToHScript(event.entindex)
    if npc:IsRealHero() then
        npc:RemoveSelf()
    end
end

function DumpPlayerConnectionState()
    print("DumpPlayerConnectionState")
    print("  HaveAllPlayersJoined", PlayerResource:HaveAllPlayersJoined())
    print("  --------------------------")
    for i = 0, MAX_PLAYERS-1 do
        print("  index                     ", i)
        print("  GetPlayer                 ", PlayerResource:GetPlayer(i))
        print("  IsValidPlayer             ", PlayerResource:IsValidPlayer(i))
        print("  IsValidPlayerID           ", PlayerResource:IsValidPlayerID(i))
        print("  GetPlayerLoadedCompletely ", PlayerResource:GetPlayerLoadedCompletely(i))
        print("  GetConnectionState        ", PlayerResource:GetConnectionState(i))
        print("  IsFakeClient              ", PlayerResource:IsFakeClient(i))
        print("  --------------------------")
    end
end

function GameMode:OnGameRulesStateChange()
    local nNewState = GameRules:State_Get()
    print("OnGameRulesStateChange", nNewState)
    if nNewState == DOTA_GAMERULES_STATE_INIT then
        print("DOTA_GAMERULES_STATE_INIT")
    elseif nNewState == DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD then
        print("DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD")
    elseif nNewState == DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP then
        print("DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP")
        if DEBUG_FAKE_CLIENTS then
            print("dota_create_fake_clients")
            SendToServerConsole( 'dota_create_fake_clients' )
            Timers:CreateTimer(1, function ()
                print("dota_create_fake_clients timer")
                DumpPlayerConnectionState()
                
                for i = 0, MAX_PLAYERS-1 do
                    if PlayerResource:IsFakeClient(i) and PLAYERLIST:GetBotCount() < DEBUG_MAX_BOTS then
                        self:AddPlayer(i)
                        
                        -- send ready event for bot player
                        --OnGameSetupReadyStateChange(1, {player_id=i,is_ready=true})
                    end
                end
            end)
            
        end
        -- DumpPlayerConnectionState()
    elseif nNewState == DOTA_GAMERULES_STATE_HERO_SELECTION then
        print("DOTA_GAMERULES_STATE_HERO_SELECTION")
        -- DumpPlayerConnectionState()
    elseif nNewState == DOTA_GAMERULES_STATE_PRE_GAME then
        print("DOTA_GAMERULES_STATE_PRE_GAME")
        -- DumpPlayerConnectionState()

        print("PLAYERS LIST")
        PLAYERLIST:Dump()
        
        print("DEBUG_HOUSE_RULES_STATE")
        for k,v in pairs(DEBUG_HOUSE_RULES_STATE) do
            print(k, v)
            HOUSE_RULES_STATE[k] = v
        end
        
        print("DEBUG_ROUND_TIME")
        for k,v in pairs(DEBUG_ROUND_TIME) do
            print(k, v)
            DAH.TIME[k] = v
        end
        
        
        local data = LoadKeyValues("scripts/kv/cards.kv")
        GameRules.AddonTemplate.dah = DAH(HOUSE_RULES_STATE, PLAYERLIST, data)
        -- DebugFuzzer(GameRules.AddonTemplate.dah)
    elseif nNewState == DOTA_GAMERULES_STATE_GAME_IN_PROGRESS then
        print("DOTA_GAMERULES_STATE_GAME_IN_PROGRESS")
    elseif nNewState == DOTA_GAMERULES_STATE_POST_GAME then
        print("DOTA_GAMERULES_STATE_POST_GAME")
    end
end

function DebugFuzzer(dah)
    print("DebugFuzzer")
    Timers:CreateTimer(1, function ()
        for k, player in dah:Players():Iter() do
            --print("IsFakeClient", player:PlayerId(), PlayerResource:IsFakeClient(player:PlayerId()))
            dah:OnSelectWhiteCard(player:PlayerId(), dah.white_index:GetRandom():Id())
            if math.random(1000) <= 100 then
                dah:OnDiscardWhiteCard(player:PlayerId(), dah.white_index:GetRandom():Id())
            end
            if math.random(1000) <= 100 then
                dah:OnDiscardAllWhiteCard(player:PlayerId())
            end
            if math.random(1000) <= 100 then
                dah:OnViewSelections(player:PlayerId())
            end
            if math.random(1000) <= 100 then
                if player:IsConnected() then
                    DebugDisconnectBot(player:PlayerId())
                elseif player:IsDisconnected() then
                    DebugConnectBot(player:PlayerId())
                end
            end
            if PlayerResource:IsFakeClient(player:PlayerId()) then
                --dah:OnSelectWhiteCard(player:PlayerId(), dah.white_index:GetRandom():Id())
            end
        end
        return 0.01
    end)
    
    Timers:CreateTimer(10, function ()
        print("timer DebugAbandonBot")
        -- DebugAbandonBot(1)
        return nil
    end)
end

-- Create the game mode when we activate
function Activate()
    GameRules.AddonTemplate = GameMode()
    GameRules.AddonTemplate:InitGameMode()
end

function OnGameSetupPlayerVoteChange(eventSourceIndex, args)
    if STARTED then return end
    print("OnGameSetupPlayerVoteChange")
    PrintTable(args)
    local rule_id = args['rule_id']
    local player_id = args['player_id']
    if HOUSE_RULES_VOTE_STATE[rule_id] == nil then
        HOUSE_RULES_VOTE_STATE[rule_id] = {}
    end
    HOUSE_RULES_VOTE_STATE[rule_id][player_id] = args['selected']
    CustomNetTables:SetTableValue("game_setup_house_rules", rule_id, HOUSE_RULES_VOTE_STATE[rule_id])
    PrintTable(HOUSE_RULES_VOTE_STATE)
end

function OnGameSetupReadyStateChange(eventSourceIndex, args)
    if STARTED then return end
    print("OnGameSetupReadyStateChange")
    PrintTable(args)
    PLAYERLIST:SetPlayerReady(args['player_id'], args['is_ready'])
        
    if PLAYERLIST:IsConnectedSetupReady() then
        print("all ready, starting")
        GameRules:SetCustomGameSetupRemainingTime(5)
        CustomNetTables:SetTableValue("game_setup", "finished", {value=true})
        STARTED = true
        TallyRules()
    else
        print("not ready")
        for k, player in PLAYERLIST:Filter(function (player) return not player:IsSetupReady() and player:IsConnected() end):Iter() do
            print("not ready", k, player:PlayerId())
        end
    end

end

function TallyRules()
    print("HOUSE_RULES_VOTE_STATE")
    DeepPrintTable(HOUSE_RULES_VOTE_STATE)
    for k,v in pairs(DAH.HOUSE_RULE) do
        print(k, v)
        if HOUSE_RULES_VOTE_STATE[v] == nil then
            HOUSE_RULES_STATE[v] = false
        else
            PrintTable(HOUSE_RULES_VOTE_STATE[v])
            print(count(function (a) return not a == 0 and not a == nil end, HOUSE_RULES_VOTE_STATE[v]), PLAYERLIST:ConnectedPlayers():Size())
            HOUSE_RULES_STATE[v] = count(function (a) return not a == 0 and not a == nil end, HOUSE_RULES_VOTE_STATE[v]) > PLAYERLIST:ConnectedPlayers():Size() / 2
        end
    end
    print("HOUSE_RULE_STATE")
    DeepPrintTable(HOUSE_RULES_STATE)
end

function GameMode:InitGameMode()
    print("Template addon is loaded.")
    GameRules:SetCustomGameSetupTimeout(5)
    GameRules:SetCustomGameSetupAutoLaunchDelay(5)
    GameRules:GetGameModeEntity():SetAnnouncerDisabled(true)

    ListenToGameEvent("npc_spawned", Dynamic_Wrap(GameMode, "OnNPCSpawned"), self)
    ListenToGameEvent("player_connect_full", Dynamic_Wrap(GameMode, "OnConnectFull"), self)
    ListenToGameEvent("player_disconnect", Dynamic_Wrap(GameMode, "OnDisconnect"), self)
    ListenToGameEvent("player_reconnected", Dynamic_Wrap(GameMode, "OnPlayerReconnect"), self)
    ListenToGameEvent("game_rules_state_change", Dynamic_Wrap(GameMode, "OnGameRulesStateChange"), self)

    CustomGameEventManager:RegisterListener( "game_setup_player_vote_change", OnGameSetupPlayerVoteChange )
    CustomGameEventManager:RegisterListener( "game_setup_player_ready_state_change", OnGameSetupReadyStateChange )
    CustomGameEventManager:RegisterListener( "select_white_card", OnSelectWhiteCard )
    CustomGameEventManager:RegisterListener( "discard_white_card", OnDiscardWhiteCard )
    CustomGameEventManager:RegisterListener( "discard_all_white_card", OnDiscardAllWhiteCard )
    CustomGameEventManager:RegisterListener( "view_selections", OnViewSelections )
    CustomGameEventManager:RegisterListener( "send_chat_message", OnSendChatMessage )

    math.randomseed( RandomInt(1, 99999999) )
    math.random(); math.random(); math.random()

    GameRules:SetCustomGameTeamMaxPlayers(DOTA_TEAM_GOODGUYS, 8)
    GameRules:SetCustomGameTeamMaxPlayers(DOTA_TEAM_BADGUYS, 0)
    -- DumpPlayerConnectionState()

    --GameRules:LockCustomGameSetupTeamAssignment( true )

    GameRules:GetGameModeEntity():SetThink( "OnSetTimeOfDayThink", self, "SetTimeOfDay", 2 )
    
    Timers:CreateTimer(GameMode.CheckPlayerConnectionState, self)
end

function GameMode:CheckPlayerConnectionState()
    local state = GameRules:State_Get()
    if state == DOTA_GAMERULES_STATE_PRE_GAME then
        -- TODO
    elseif state == DOTA_GAMERULES_STATE_GAME_IN_PROGRESS then
        for k, player in PLAYERLIST:Iter() do
            if player:IsConnectionStateChanged() then
                print("player connection state changed", player:PlayerId())
                if player:IsDisconnected() then
                    print("player connection state disconnected", player:PlayerId())
                    local dah = GameRules.AddonTemplate.dah
                    dah:OnPlayerDisconnect(player)
                end
            end
        end
    end
    return 1
end

function OnDisconnect(playerID)
    print("OnDisconnect", playerID)
end

function OnAbandon(playerID)
    print("OnAbandon", playerID)
end

function GameMode:OnSetTimeOfDayThink()
    GameRules:SetTimeOfDay(.5)
    return 10
end

function OnSendChatMessage(eventSourceIndex, args)
    print("OnSendChatMessage", eventSourceIndex)
    PrintTable(args)
    CustomGameEventManager:Send_ServerToAllClients("receive_chat_message", {message=args['message'], playerId=args['playerID']})
end

function OnSelectWhiteCard(eventSourceIndex, args)
    print("OnSelectWhiteCard", eventSourceIndex)
    PrintTable(args)
    local dah = GameRules.AddonTemplate.dah
    dah:OnSelectWhiteCard(args['playerID'], args['card'])
end

function OnDiscardWhiteCard(eventSourceIndex, args)
    print("OnDiscardWhiteCard", eventSourceIndex)
    PrintTable(args)
    local dah = GameRules.AddonTemplate.dah
    dah:OnDiscardWhiteCard(args['playerID'], args['card'])
end

function OnDiscardAllWhiteCard(eventSourceIndex, args)
    print("OnDiscardAllWhiteCard", eventSourceIndex)
    PrintTable(args)
    local dah = GameRules.AddonTemplate.dah
    dah:OnDiscardAllWhiteCard(args['playerID'])
end

function OnViewSelections(eventSourceIndex, args)
    print("OnViewSelections", eventSourceIndex)
    PrintTable(args)
    local dah = GameRules.AddonTemplate.dah
    dah:OnViewSelections(args['playerID'])
end

function DebugConnectBot(playerID)
    print("DebugConnectBot")
    PLAYERLIST:GetPlayer(playerID):SetBotConnectionState(DOTA_CONNECTION_STATE_CONNECTED)
end

function DebugDisconnectBot(playerID)
    print("DebugDisconnectBot")
    PLAYERLIST:GetPlayer(playerID):SetBotConnectionState(DOTA_CONNECTION_STATE_DISCONNECTED)
end

function DebugAbandonBot(playerID)
    PLAYERLIST:GetPlayer(playerID):SetBotConnectionState(DOTA_CONNECTION_STATE_ABANDONED)
    print("DebugAbandonBot", PLAYERLIST:GetPlayer(playerID):IsAbandoned())
end