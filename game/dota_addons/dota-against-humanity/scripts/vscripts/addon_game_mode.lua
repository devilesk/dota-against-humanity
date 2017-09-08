require("libraries/functional")
require("libraries/util")
require("libraries/list")
require("libraries/timers")
require("player")
require("dah")

MAX_PLAYERS = 8
HOUSE_RULES_VOTE_STATE = {}
HOUSE_RULES_STATE = {}
PLAYER_READY_STATE = {}
STARTED = false
DEBUG_FAKE_CLIENTS = true
DEBUG_MAX_BOTS = 3

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
    DumpPlayerConnectionState()
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
        --GameRules:SetCustomGameSetupTimeout( 5 )
        --GameRules:SetCustomGameSetupRemainingTime( 5 )
    elseif nNewState == DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD then
        print("DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD")
    elseif nNewState == DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP then
        print("DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP")
        --GameRules:EnableCustomGameSetupAutoLaunch( false )
        --GameRules:FinishCustomGameSetup()
        if DEBUG_FAKE_CLIENTS then
            print("dota_create_fake_clients")
            SendToServerConsole( 'dota_create_fake_clients' )
            Timers:CreateTimer(1, function ()
                print("dota_create_fake_clients timer")
                DumpPlayerConnectionState()
            end)
        end
        DumpPlayerConnectionState()

        local num_bots = 0
        for i = 0, MAX_PLAYERS-1 do
            if PlayerResource:IsValidPlayerID(i) or (DEBUG_FAKE_CLIENTS and num_bots < DEBUG_MAX_BOTS) then
                PLAYER_READY_STATE[i] = false
                PlayerResource:SetCustomTeamAssignment(i, DOTA_TEAM_GOODGUYS)
                if not PlayerResource:IsValidPlayerID(i) and DEBUG_FAKE_CLIENTS then
                    num_bots = num_bots + 1
                    OnGameSetupReadyStateChange(1, {player_id=i,is_ready=true})
                end
            end
        end
        print("PLAYER_READY_STATE")
        PrintTable(PLAYER_READY_STATE)
    elseif nNewState == DOTA_GAMERULES_STATE_HERO_SELECTION then
        print("DOTA_GAMERULES_STATE_HERO_SELECTION")
        DumpPlayerConnectionState()
    elseif nNewState == DOTA_GAMERULES_STATE_PRE_GAME then
        print("DOTA_GAMERULES_STATE_PRE_GAME")
        DumpPlayerConnectionState()
        local players = List({})
        local num_bots = 0
        for i = 0, MAX_PLAYERS-1 do
            print("GetPlayer", i, PlayerResource:GetPlayer(i))
            if PlayerResource:GetPlayer(i) then
                print("IsFakeClient", i, PlayerResource:IsFakeClient(i))
                if not PlayerResource:IsFakeClient(i) then
                    print("pushing player", i)
                    players:Push(PLAYER(i))
                elseif DEBUG_FAKE_CLIENTS and num_bots < DEBUG_MAX_BOTS then
                    players:Push(PLAYER(i))
                    num_bots = num_bots + 1
                end
            end
        end
        print("PLAYERS LIST")
        players:Dump()
        
        local data = LoadKeyValues("scripts/kv/cards.kv")
        GameRules.AddonTemplate.dah = DAH(HOUSE_RULES_STATE, players, data)
        --DebugFuzzer(GameRules.AddonTemplate.dah)
    end
end

function DebugFuzzer(dah)
    print("DebugFuzzer")
    Timers:CreateTimer(1, function ()
        for k, player in dah:Players():Iter() do
            --print("IsFakeClient", player:PlayerId(), PlayerResource:IsFakeClient(player:PlayerId()))
            dah:OnSelectWhiteCard(player:PlayerId(), dah.white_index:GetRandom():Id())
            if math.random(1000) <= 1000 then
                dah:OnDiscardWhiteCard(player:PlayerId(), dah.white_index:GetRandom():Id())
            end
            if math.random(1000) <= 100 then
                dah:OnDiscardAllWhiteCard(player:PlayerId())
            end
            if math.random(1000) <= 100 then
                dah:OnViewSelections(player:PlayerId())
            end
            if PlayerResource:IsFakeClient(player:PlayerId()) then
                --dah:OnSelectWhiteCard(player:PlayerId(), dah.white_index:GetRandom():Id())
            end
        end
        return 0.01
    end)
end

-- Create the game mode when we activate
function Activate()
    GameRules.AddonTemplate = GameMode()
    GameRules.AddonTemplate:InitGameMode()
end

function OnGameSetupGetPlayerState(eventSourceIndex, args)
    print("OnGameSetupGetPlayerState")
    local local_player_id = args['local_player_id']
    local player_id = args['player_id']
    local player = PlayerResource:GetPlayer(local_player_id)
    local is_ready = PLAYER_READY_STATE[player_id]
    local state = {}
    print("HOUSE_RULES_VOTE_STATE")
    PrintTable(HOUSE_RULES_VOTE_STATE)
    print("state loop")
    for k,v in pairs(HOUSE_RULES_VOTE_STATE) do
        print(k, v)
        state[k] = v[player_id]
    end
    print("state")
    PrintTable(state)
    CustomGameEventManager:Send_ServerToPlayer(player, "receive_player_state", {player_id=player_id, state=state, is_ready=is_ready} )
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
    for i = 0, MAX_PLAYERS-1 do
        local player = PlayerResource:GetPlayer(i)
        if i ~= player_id and PlayerResource:IsValidPlayerID(i) then
            CustomGameEventManager:Send_ServerToPlayer(player, "update_player_vote", {rule_id=rule_id, player_id=player_id, selected=args['selected']} )
        end
    end
    PrintTable(HOUSE_RULES_VOTE_STATE)
end

function OnGameSetupReadyStateChange(eventSourceIndex, args)
    if STARTED then return end
    print("OnGameSetupReadyStateChange")
    PrintTable(args)
    local player_id = args['player_id']
    PLAYER_READY_STATE[player_id] = args['is_ready']
    for i = 0, MAX_PLAYERS-1 do
        local player = PlayerResource:GetPlayer(i)
        if i ~= player_id and PlayerResource:IsValidPlayerID(i) then
            CustomGameEventManager:Send_ServerToPlayer(player, "update_player_ready", {player_id=player_id, is_ready=args['is_ready']} )
        end
    end

    DumpPlayerConnectionState()
    print("PLAYER_READY_STATE")
    DeepPrintTable(PLAYER_READY_STATE)
        
    for k,v in pairs(PLAYER_READY_STATE) do
        if v == false or v == 0 then
            return
        end
    end

    print("all ready, starting")
    GameRules:SetCustomGameSetupRemainingTime(5)
    CustomGameEventManager:Send_ServerToAllClients("all_players_ready", {} )
    STARTED = true
    TallyRules()
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
            print(count(function (a) return not a == 0 and not a == nil end, HOUSE_RULES_VOTE_STATE[v]), tablelength(PLAYER_READY_STATE))
            HOUSE_RULES_STATE[v] = count(function (a) return not a == 0 and not a == nil end, HOUSE_RULES_VOTE_STATE[v]) > tablelength(PLAYER_READY_STATE) / 2
        end
    end
    print("HOUSE_RULE_STATE")
    DeepPrintTable(HOUSE_RULES_STATE)
end

function GameMode:InitGameMode()
    print("Template addon is loaded.")
    --GameRules:SetCustomGameSetupTimeout(5)
    --GameRules:SetCustomGameSetupTimeout( 5 )
    GameRules:SetCustomGameSetupAutoLaunchDelay(60)
    GameRules:GetGameModeEntity():SetAnnouncerDisabled(true)

    ListenToGameEvent("npc_spawned", Dynamic_Wrap(GameMode, "OnNPCSpawned"), self)
    ListenToGameEvent("player_connect_full", Dynamic_Wrap(GameMode, "OnConnectFull"), self)
    ListenToGameEvent("player_disconnect", Dynamic_Wrap(GameMode, "OnDisconnect"), self)
    ListenToGameEvent("player_reconnected", Dynamic_Wrap(GameMode, "OnPlayerReconnect"), self)
    ListenToGameEvent("game_rules_state_change", Dynamic_Wrap(GameMode, "OnGameRulesStateChange"), self)

    CustomGameEventManager:RegisterListener( "game_setup_get_player_state", OnGameSetupGetPlayerState )
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
    DumpPlayerConnectionState()

    --GameRules:LockCustomGameSetupTeamAssignment( true )

    GameRules:GetGameModeEntity():SetThink( "OnSetTimeOfDayThink", self, "SetTimeOfDay", 2 )
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