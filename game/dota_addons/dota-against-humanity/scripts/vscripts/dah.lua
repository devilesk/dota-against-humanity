require("libraries/functional")
require("libraries/util")
require("libraries/list")
require("libraries/timers")
require("deck")
require("player")
require("card")

DEBUG_PRINT = true
old_print = print
print = function(...) 
    if DEBUG_PRINT then old_print(...) end
end

DAH = class({},    {
    STATE = {
        CARD_SELECT   = "CARD_SELECT",
        WINNER_SELECT = "WINNER_SELECT",
        ELIM_SELECT   = "ELIM_SELECT",
        NEXT_ROUND    = "NEXT_ROUND",
    },
    TIME = {
        CARD_SELECT   = 30,
        WINNER_SELECT = 30,
        ELIM_SELECT   = 10,
        NEXT_ROUND    = 15,
    },
    HOUSE_RULE = {
        PACKING_HEAT        = "PACKING_HEAT",
        RANDO_CARDISSIAN    = "RANDO_CARDISSIAN",
        COUP_DETAT          = "COUP_DETAT",
        GOD_IS_DEAD         = "GOD_IS_DEAD",
        SURVIVAL_FITTEST    = "SURVIVAL_FITTEST",
        NEVER_EVER          = "NEVER_EVER",
        REBOOTING_UNIVERSE  = "REBOOTING_UNIVERSE",
        EXECUTIVE_PRIVILEGE = "EXECUTIVE_PRIVILEGE",
        BETTER_LUCK         = "BETTER_LUCK",
    },
    RANDO_PLAYER_ID = "rando"
})

function DAH:constructor(HOUSE_RULES_STATE, players, data)
    print("DAH:constructor")
    self.house_rules = HOUSE_RULES_STATE
    print("HOUSE_RULES_STATE")
    PrintTable(HOUSE_RULES_STATE)
    self.state = DAH.STATE.NEXT_ROUND

    local w = split(data.white, "<>")
    local b = split(data.black, "<>")
    self.white_index = DECK():Init(w, CARD)
    self.white = DECK():Copy(self.white_index):Shuffle()
    self.black = DECK():Init(b, BLACK_CARD):Shuffle()
 
    self.white_discarded = DECK()
    self.black_discarded = DECK()
 
    self.selected_whites = DECK()
    self.current_black = nil
    self.time_end = nil
    self.timer = nil
    self.time_warn = false
    self:NetworkTimerLabel("#game_start_in")

    self.players = players
    print("players")
    self.players:Dump()
    self.winner = nil
    self.czar = nil
    self.rando = nil
    if self:HasHouseRule(DAH.HOUSE_RULE.RANDO_CARDISSIAN) then
        self.rando = PLAYER(DAH.RANDO_PLAYER_ID, true)
    end

    self.stateTable = {
        [DAH.STATE.CARD_SELECT] = DAH.StateCardSelect,
        [DAH.STATE.WINNER_SELECT] = DAH.StateWinnerSelect,
        [DAH.STATE.ELIM_SELECT] = DAH.StateElimSelect,
        [DAH.STATE.NEXT_ROUND] = DAH.StateNextRound,
    }
    
    self:StartTimer(5)
end

function DAH:Players()
    return self.players
end

function DAH:ConnectedPlayers()
    return self.players:ConnectedPlayers()
end

function DAH:SetState(newstate)
    self.state = newstate
end

function DAH:IsState(state)
    return self.state == state
end

function DAH:CanDiscard(player)
    if self:IsState(DAH.STATE.CARD_SELECT) then
        if self:HasHouseRule(DAH.HOUSE_RULE.REBOOTING_UNIVERSE) then
            return player:CanSelect() and (not self:HasCzar() or not self:IsCzar(player)) and player:Points() > 1
        elseif self:HasHouseRule(DAH.HOUSE_RULE.EXECUTIVE_PRIVILEGE) then
            return self:HasCzar() and self:IsCzar(player)
        elseif self:HasHouseRule(DAH.HOUSE_RULE.NEVER_EVER) then
            return player:CanSelect() and (not self:HasCzar() or not self:IsCzar(player))
        end
    end
    return false
end

function DAH:CanDiscardAll(player)
    return self:HasHouseRule(DAH.HOUSE_RULE.BETTER_LUCK) and player:CanSelect() and (not self:HasCzar() or not self:IsCzar(player))
end

function DAH:CanView(player)
    if self:IsState(DAH.STATE.CARD_SELECT) then
        if self:HasHouseRule(DAH.HOUSE_RULE.EXECUTIVE_PRIVILEGE) then
            return self:HasCzar() and self:IsCzar(player)
        end
    end
    return false
end

function DAH:HasCzar()
    print("HasCzar", not self:HasHouseRule(DAH.HOUSE_RULE.GOD_IS_DEAD) and not self:HasHouseRule(DAH.HOUSE_RULE.SURVIVAL_FITTEST))
    return not self:HasHouseRule(DAH.HOUSE_RULE.GOD_IS_DEAD) and not self:HasHouseRule(DAH.HOUSE_RULE.SURVIVAL_FITTEST)
end

function DAH:IsCzar(player)
    return self:GetCzarPlayer() == player
end

function DAH:Rando()
    return self.rando
end

function DAH:IsRando(player)
    return self:Rando() == player
end

function DAH:HasHouseRule(rule)
    return self.house_rules[rule]
end

function DAH:GetWhiteCard(id)
    return self.white_index:Find(function (v) return v:ID() == id end)
end

function DAH:GetHandSize()
    local hand_size = 10
    if self.current_black:Blanks() == 2 and self:HasHouseRule(DAH.HOUSE_RULE.PACKING_HEAT) then
        hand_size = 11
    end
    return hand_size
end

function DAH:StateCardSelect()
    -- play random card for players that have not chosen
    for k, player in self:Players():Iter() do
        if not self:IsCzar(player) and player:CanSelect() then
            local t = List(player):Shuffle()
            for i = 1, self.current_black:Blanks() do
                print("PLAYING RANDOM CARD FOR", player:ID(), t:Get(i):ToString())
                self:OnSelectWhiteCard(player:ID(), t:Get(i):ID())
            end
        end
    end
 
    if self:HasHouseRule(DAH.HOUSE_RULE.SURVIVAL_FITTEST) then
        self:SetState(DAH.STATE.ELIM_SELECT)
        self:NextCzar()
        self:SetNotificationMessageUI(self:GetCzarPlayer(), "#turn_eliminate_card")
    else
        self:SetState(DAH.STATE.WINNER_SELECT)
    end
 
    -- clear previous winner
    self.winner = nil
 
    -- clear card votes used by survival of the fittest house rule
    self:ClearCardVotes()
 
    -- allow czar or players to select card. depends on house rules in play
    if self:HasCzar() or self:HasHouseRule(DAH.HOUSE_RULE.SURVIVAL_FITTEST) then
        self:GetCzarPlayer():SetCanSelect(true)
    else
        self:Players():Each(function (player) player:SetCanSelect(true) end)
    end
 
    -- show selected cards to all players
    self:Players():Each(function (player) self:ShowSelectedCardsToPlayer(player, false, -1) end)
 
    -- set timer label based on house rule
    if self:HasHouseRule(DAH.HOUSE_RULE.GOD_IS_DEAD) then
        self:NetworkTimerLabel("#winner_voting")
    elseif self:HasHouseRule(DAH.HOUSE_RULE.SURVIVAL_FITTEST) then
        self:NetworkTimerLabel("#elimination_voting")
    else
        self:NetworkTimerLabel("#czar_choosing")
    end
end

function DAH:ClearCardVotes()
    self:Players():Each(function (player) player:Unvote() end)
end

function DAH:StateWinnerSelect()
    self:EndRound()
end

function DAH:StateElimSelect()
    if self.selected_whites:Size() == 1 then
        local winning_card = self.selected_whites:Peek()
        self:SetWinner(winning_card:Owner())
        self:EndRound()
    else
        self:GetCzarPlayer():SetCanSelect(false)
        self:NextCzar()
        self:GetCzarPlayer():SetCanSelect(true)
        self:SetNotificationMessageUI(self:GetCzarPlayer(), "#turn_eliminate_card")
    end
end

function DAH:StateNextRound()
    self:SetState(DAH.STATE.CARD_SELECT)
    -- choose next czar and update ui
    if self:HasCzar() then
        self:NextCzar()
    end

    -- deal new black card and update ui
    self:DealBlack()
 
    -- allow nonczars to select cards and update ui
    -- set czar to show selected cards
    for k, player in self:Players():Iter() do
        self:DealWhite(player, self:GetHandSize())
        if not self:HasCzar() or not self:IsCzar(player) or self:CanView(player) then
            player:SetCanSelect(true)
            self:UpdatePlayerUI(player)
        else
            self:ShowSelectedCardsToPlayer(player, false, -1)
        end
    end

    -- allow rando to select
    if self:HasHouseRule(DAH.HOUSE_RULE.RANDO_CARDISSIAN) then
        self:Rando():SetCanSelect(true)
        Timers:CreateTimer(math.random(2, DAH.TIME[self.state] - 1), function ()
            self:DealWhite(self:Rando(), self.current_black:Blanks())
            self:Rando():Each(function (card)
                self:Rando():SelectCard(card)
            end)
            self:SubmitPlayerSelection(self:Rando())
        end)
    end
    self:NetworkTimerLabel("#time_remaining")
end

function DAH:NextState()
    print("DAH:NextState", self.state)
    self:StopTimer()
    self.stateTable[self.state](self)
    self:StartTimer(self:GetTimerDuration(self.state))
    --self:Debug()
end

function DAH:GetTimerDuration(state)
    local t = DAH.TIME[state]
    if self:IsState(DAH.STATE.CARD_SELECT) and self.current_black:Blanks() == 2 then
        t = t + 15
    end
    return t
end

function DAH:EndRound()
    print("EndRound")
    self:SetState(DAH.STATE.NEXT_ROUND)

    self:RemoveAbandonedPlayers()
    
    for k, player in self:Players():Iter() do
        self:ShowSelectedCardsToPlayer(player, true, self.winner and self.winner:ID())
    end
    
    -- clear player selections
    self:Players():Each(function (p) p:ClearSelection() end)
    
    -- clear rando selections
    if self:HasHouseRule(DAH.HOUSE_RULE.RANDO_CARDISSIAN) then
        self:Rando():ClearSelection()
    end
 
    -- clear and remove selected cards and add to discard pile
    self.selected_whites:Each(function (card)
        -- DeepPrintTable(card)
        self:Discard(card)
    end)
    self.selected_whites:Clear()
 
    self:NetworkTimerLabel("#next_round_in")
end

function DAH:Discard(card)
    if card:HasOwner() then
        self:GetPlayer(card:Owner()):MovePush(card, self.white_discarded)
    else
        self.white_discarded:Push(card)
    end
end

function DAH:StartTimer(duration)
    self.time_end = GameRules:GetGameTime() + duration
    self:NetworkTimer(duration)
    self.time_warn = true
    self.timer = Timers:CreateTimer(DAH.UpdateTimer, self)
end

function DAH:StopTimer()
    if self.timer ~= nil then
        Timers:RemoveTimer(self.timer)
        self.timer = nil
    end
end

function DAH:UpdateTimer()
    local time_remaining = self.time_end - GameRules:GetGameTime()
    self:NetworkTimer(time_remaining)
    if time_remaining <= 5 and self.time_warn and (self:IsState(DAH.STATE.CARD_SELECT) or self:IsState(DAH.STATE.WINNER_SELECT)) then
        print("EmitGlobalSound", "Hero_LegionCommander.PressTheAttack")
        EmitGlobalSound("Hero_LegionCommander.PressTheAttack")
        self.time_warn = false
    end
    if time_remaining >= 0 then
        return 0.1
    else
        self.timer = nil
        self:NextState()
        return nil
    end
end

function DAH:NextCzar()
    print("NextCzar")
    if self:HasHouseRule(DAH.HOUSE_RULE.COUP_DETAT) and self.winner ~= nil and self.winner ~= self:Rando() then
        self.czar = self.winner:ID()
    end
    
    local czar_player = self:GetCzarPlayer()
    if czar_player == nil or not czar_player:IsConnected() then
        czar_player = self:ConnectedPlayers():GetRandom()
        self.czar = czar_player:ID()
    else
        local czar_index = self:Players():IndexOf(czar_player)
        for i = 1, self:Players():Size() do
            local new_czar = (i+czar_index) % self:Players():Size()
            if new_czar == 0 then new_czar = self:Players():Size() end
            local new_czar_player = self:Players():Get(new_czar)
            if new_czar_player:IsConnected() then
                self.czar = new_czar_player:ID()
                break
            end
        end
    end
 
    self:NetworkCzar()
end

function DAH:NetworkCzar()
    CustomNetTables:SetTableValue("game", "czar", {value=self.czar})
end

function DAH:NetworkTimerLabel(value)
    CustomNetTables:SetTableValue("game", "timer_label", {value=value})
end

function DAH:NetworkTimer(value)
    CustomNetTables:SetTableValue("game", "timer", {value=value})
end

function DAH:NetworkBlackCard(value)
    CustomNetTables:SetTableValue("game", "black_card", {value=value})
end

function DAH:GetCzarPlayer()
    if self.czar == nil then return nil end
    return self:GetPlayer(self.czar)
end

function DAH:DealBlack()
    if self.current_black then self.black_discarded:Push(self.current_black) end

    local dealt_card = self.black:Pop()
    if dealt_card == nil then
        self.black:Refill(self.black_discarded)
        dealt_card = self.black:Pop()
    end
    
    self.current_black = dealt_card
    
    self:NetworkBlackCard(self.current_black:Data())
end

function DAH:DealWhite(player, num_cards)
    local cards_remaining = num_cards - player:Size()
    if cards_remaining > 0 then
        if self:Deal(player, self.white, cards_remaining) ~= cards_remaining then
            self.white:Refill(self.white_discarded)
            self:Deal(player, self.white, num_cards - player:Size())
        end
    end
end

function DAH:Deal(player, deck, num_cards)
    for i = 1, num_cards do
        local dealt_card = deck:Pop()
        if dealt_card ~= nil then
            -- print ("Deal", instanceof(dealt_card, CARD))
            -- DeepPrintTable(dealt_card)
            player:Push(dealt_card)
        else
            return i - 1
        end
    end
    return num_cards
end

function DAH:GetPlayer(id)
    if id == DAH.RANDO_PLAYER_ID then
        return self:Rando()
    end
    return self:Players():GetPlayer(id)
end

function DAH:SubmitPlayerSelection(player)
    -- print("SubmitPlayerSelection", player:ID())
    -- DeepPrintTable(player:SelectedCards())
    self.selected_whites:PushList(player:SelectedCards())
    player:SetCanSelect(false)
    
    local go_next = self:Players():All(function (player)
        return not player:CanSelect() or (self:HasCzar() and self:IsCzar(player))
    end)
    
    if self:HasHouseRule(DAH.HOUSE_RULE.RANDO_CARDISSIAN) then
        go_next = go_next and not self:Rando():CanSelect()
    end
    
    -- depending on house rule show selected cards to czar or players who have already selected
    if self:HasCzar() then
        self:ShowSelectedCardsToPlayer(self:GetCzarPlayer(), false, -1)
    else
        for k, player in self:Players():Iter() do
            if not player:CanSelect() then
                self:ShowSelectedCardsToPlayer(player, false, -1)
            end
        end
    end
    print("SubmitPlayerSelection go_next", go_next)
    if go_next then
        self:NextState()
    end
end

function DAH:SetWinner(playerID)
    print("SetWinner", playerID)
    local player = self:GetPlayer(playerID)
    player:AddPoint()
    self.winner = player
    if player ~= self:Rando() then
        EmitSoundOnClient("Hero_LegionCommander.Duel.Victory", player:Handle())
    end

    local message = self.current_black:Data()
    for k, v in player:SelectedCards():Iter() do
        local answer = v:Data()
        local last_char = string.sub(answer, string.len(answer), string.len(answer))
        if last_char == "." then
            answer = string.sub(answer, 1, string.len(answer) - 1)
        end
        answer = "<span class='answer'>" .. answer .. "</span>"
        -- print("SetWinner selected card ", answer)
        if string.find(message, "__________") ~= nil then
            message = string.gsub(message, "__________", answer, 1)
        else
            message = message .. " " .. answer
        end
    end
    -- print("SetWinner final ", message)
    self:NetworkBlackCard(message)
    CustomGameEventManager:Send_ServerToAllClients("set_round_winner_message", {winner=player:ID()} )
    for k, player in self:Players():Iter() do
        self:ShowSelectedCardsToPlayer(player, true, playerID)
    end
end

function DAH:SetTie()
    CustomGameEventManager:Send_ServerToAllClients("set_round_winner_message", {winner="tie"} )
    for k, player in self:Players():Iter() do
        self:ShowSelectedCardsToPlayer(player, true, -1)
    end
end

function DAH:ShowSelectedCardsToPlayer(player, bShowOwner, winner)
    -- print("DAH:ShowSelectedCardsToPlayer", player:ID(), bShowOwner, winner)
    local pair = self.current_black:Blanks() == 2
    CustomGameEventManager:Send_ServerToPlayer(player:Handle(), "set_white_cards", {cards=self.selected_whites:Items(), selected_cards={}, pair=pair, show_owner=bShowOwner, winner=winner, discard=false} )
end

function DAH:UpdatePlayerUI(player)
    -- print("DAH:UpdatePlayerUI", player:ID())
    CustomGameEventManager:Send_ServerToPlayer(player:Handle(), "set_white_cards",
        {
            cards = player:Items(),
            selected_cards = player:SelectedCards():Items(),
            pair = false,
            discard = self:CanDiscard(player),
            discard_all = self:CanDiscardAll(player),
            view = self:CanView(player),
        }
    )
end

function DAH:SetNotificationMessageUI(player, text)
    local player_id = player and player:ID() or -1
    CustomGameEventManager:Send_ServerToAllClients("set_notification_message", {player_id=player_id, text=text} )
end

function DAH:OnViewSelections(playerID)
    -- print("DAH:OnViewSelections", playerID)
    local player = self:GetPlayer(playerID)
    if self:CanView(player) then
        self:ShowSelectedCardsToPlayer(player, false, -1)
    end
end

function DAH:OnDiscardAllWhiteCard(playerID)
    print("DAH:OnDiscardAllWhiteCard", playerID)
    local player = self:GetPlayer(playerID)
    if self:CanDiscardAll(player) then
        if self:HasHouseRule(DAH.HOUSE_RULE.BETTER_LUCK) then
            player:SetCanSelect(false)
            local message = "#player_discard_all"
            CustomGameEventManager:Send_ServerToAllClients("receive_chat_event", {message=message, playerId=playerID})
            player:ClearSelection()
            while player:Size() > 0 do
                self:Discard(player:Peek())
            end
            self:DealWhite(player, self:GetHandSize())
            self:UpdatePlayerUI(player)
        end
    end
end

function DAH:OnDiscardWhiteCard(playerID, cardID)
    print("DAH:OnDiscardWhiteCard", playerID, cardID)
    local player = self:GetPlayer(playerID)
    local card = self:GetWhiteCard(cardID)
    -- DeepPrintTable(card)
    if card ~= nil and self:CanDiscard(player) and player:OwnsCard(card) then
        if self:HasHouseRule(DAH.HOUSE_RULE.NEVER_EVER) then
            local l_message = {"#player_discarded", card:Data()}
            CustomGameEventManager:Send_ServerToAllClients("receive_chat_event", {l_message=l_message, playerId=playerID})
        elseif self:HasHouseRule(DAH.HOUSE_RULE.REBOOTING_UNIVERSE) then
            player:RemovePoint()
            local message = "#player_spent_point"
            CustomGameEventManager:Send_ServerToAllClients("receive_chat_event", {message=message, playerId=playerID})
        elseif self:HasHouseRule(DAH.HOUSE_RULE.EXECUTIVE_PRIVILEGE) then
            
        end
        card:Deselect()
        player:MovePush(card, self.white_discarded)
        self:DealWhite(player, self:GetHandSize())
        self:UpdatePlayerUI(player)
    end
end

function DAH:OnSelectWhiteCard(playerID, cardID)
    -- print("DAH:OnSelectWhiteCard", playerID, cardID, self.state)
    local player = self:GetPlayer(playerID)
    local card = self:GetWhiteCard(cardID)
    -- DeepPrintTable(card)
    if card ~= nil and card:HasOwner() and player:CanSelect() then
        if self:IsState(DAH.STATE.CARD_SELECT) then
            if not self:HasCzar() or not self:IsCzar(player) and player:OwnsCard(card) then
                player:ToggleCard(card)
                if player:SelectedCards():Size() == self.current_black:Blanks() then
                    self:SubmitPlayerSelection(player)
                    self:ShowSelectedCardsToPlayer(player, false, -1)
                else
                    self:UpdatePlayerUI(player)
                end
            end
        elseif self:IsState(DAH.STATE.ELIM_SELECT) then
            player:SetCanSelect(false)
            if self:HasHouseRule(DAH.HOUSE_RULE.SURVIVAL_FITTEST) then
                if self:IsCzar(player) then
                    if self.selected_whites:Size() > 1 then
                        local card_owner = self:GetPlayer(card:Owner())
                        card_owner:Remove(card)
                        self.selected_whites:Remove(card)
                        self.white_discarded:Push(card)
                        for k, player in self:Players():Iter() do
                            if not player:CanSelect() then
                                self:ShowSelectedCardsToPlayer(player, false, -1)
                            end
                        end
                    end
                end
            end
        elseif self:IsState(DAH.STATE.WINNER_SELECT) then
            player:SetCanSelect(false)
            if self:HasCzar() then
                if self:IsCzar(player) then
                    self:SetWinner(card:Owner())
                    self:NextState()
                end
            elseif self:HasHouseRule(DAH.HOUSE_RULE.GOD_IS_DEAD) then
                player:Vote(card)
                self:GodIsDeadVoteTally()
            end
        end
    end
end

function DAH:GodIsDeadVoteTally()
    if self:ConnectedPlayers():Count(function (player) return not player:HasVoted() end) == 0 then
        local card_votes = {}
        self:ConnectedPlayers():Each(function (player)
            local card_id = player:GetVote():ID()
            card_votes[card_id] = (card_votes[card_id] or 0) + 1
        end)
        local max_votes = 0
        local max_card_id = nil
        local tie = false
        for card_id, votes in pairs(card_votes) do
            if not max_card_id then
                max_card_id = card_id
                max_votes = votes
            else
                if votes > max_votes then
                    max_card_id = card_id
                    max_votes = votes
                    tie = false
                elseif votes == max_votes then
                    tie = true
                end
            end
        end
        if not tie then
            local winning_card = self:GetWhiteCard(max_card_id)
            self:SetWinner(winning_card:Owner())
        else
            self:SetTie()
        end
        self:NextState()
    end
end

function DAH:OnPlayerDisconnect(player)
    print("OnPlayerDisconnect", player:ID())
    if self:IsState(DAH.STATE.WINNER_SELECT) then
        player:SetCanSelect(false)
        if self:HasCzar() then
            if self:IsCzar(player) then
                self:NextState()
            end
        elseif self:HasHouseRule(DAH.HOUSE_RULE.GOD_IS_DEAD) then
            self:GodIsDeadVoteTally()
        end
    end
end

function DAH:RemoveAbandonedPlayers()
    for k, player in self:Players():AbandonedPlayers():Iter() do
        print("RemoveAbandonedPlayers", player:ID())
        player:ClearSelection()
        while player:Size() > 0 do
            player:MovePush(player:Peek(), self.white_discarded)
        end
        self:Players():Remove(player)
    end
    self.selected_whites = self.selected_whites:Filter(function (card) return card:HasOwner() end)
end

function DAH:Debug()
    Timers:CreateTimer(1, function ()
        print("-----------")
        print("Debug START")
        for k, player in self:Players():Iter() do
            print("IsFakeClient", player:ID(), PlayerResource:IsFakeClient(player:ID()))
            print("IsDisconnected", player:ID(), player:IsDisconnected())
            print("IsAbandoned", player:ID(), player:IsAbandoned())
            if PlayerResource:IsFakeClient(player:ID()) then
                if self:IsState(DAH.STATE.CARD_SELECT) then
                    print("bot pick white", player:ID(), self.state)
                    if not self:IsCzar(player) then
                        if self.current_black:Blanks() == 2 then
                            self:OnSelectWhiteCard(player:ID(), player:Last():ID())
                        end
                        self:OnSelectWhiteCard(player:ID(), player:Peek():ID())
                    end
                elseif self:IsState(DAH.STATE.WINNER_SELECT) then
                    if self:IsCzar(player) then
                        print("bot czar pick black", player:ID(), self.state)
                        local rand_card = self.selected_whites:GetRandom()
                        -- rand_card = self.selected_whites:Last()
                        self:OnSelectWhiteCard(player:ID(), rand_card:ID())
                    end
                end
            end
        end
        print("Debug END")
        print("-----------")
    end)
end

print( "dah.lua is loaded." )