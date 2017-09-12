require("deck")

PLAYER = class({},
    {
    },
    DECK
)

function PLAYER:constructor(nPlayerID, is_bot)
    self.playerId = nPlayerID
    self.points = 0
    self.selected_cards = List({})
    self.can_select = false
    self.is_bot = is_bot
    self.bot_connection_state = DOTA_CONNECTION_STATE_CONNECTED
    self.last_connection_state = self:ConnectionState()
    self.setup_ready = false
    self.voted_card = nil
    self:NetworkPoints()
    DECK.constructor(self)
end

function PLAYER:PlayerId()
    return self.playerId
end

function PLAYER:Handle()
    return PlayerResource:GetPlayer(self.playerId)
end

function PLAYER:IsBot()
    return self.is_bot
end

function PLAYER:SetBotConnectionState(v)
    self.bot_connection_state = v
end

function PLAYER:SetSetupReady(v)
    self.setup_ready = toboolean(v)
end

function PLAYER:IsSetupReady()
    return self.setup_ready
end

function PLAYER:IsConnected()
    return self:ConnectionState() == DOTA_CONNECTION_STATE_CONNECTED
end

function PLAYER:IsDisconnected()
    return self:ConnectionState() == DOTA_CONNECTION_STATE_DISCONNECTED
end

function PLAYER:IsAbandoned()
    return self:ConnectionState() == DOTA_CONNECTION_STATE_ABANDONED
end

function PLAYER:ConnectionState()
    if self.is_bot then
        return self.bot_connection_state
    else
        return PlayerResource:GetConnectionState(self.playerId)
    end
end

function PLAYER:IsConnectionStateChanged()
    local state = self:ConnectionState()
    if self.last_connection_state ~= state then
        self.last_connection_state = state
        self.bot_connection_state = state
        return true
    else
        return false
    end
end

function PLAYER:Points()
    return self.points
end

function PLAYER:AddPoint()
    self.points = self.points + 1
    self:NetworkPoints()
end

function PLAYER:RemovePoint()
    self.points = self.points - 1
    self:NetworkPoints()
end

function PLAYER:NetworkPoints()
    CustomNetTables:SetTableValue("points", tostring(self:PlayerId()), {value=self:Points()})
end

function PLAYER:Insert(card, pos)
    card:SetOwner(self:PlayerId())
    DECK.Insert(self, card, pos)
end

function PLAYER:Remove(card)
    card:ClearOwner()
    return DECK.Remove(self, card)
end

function PLAYER:HasVoted()
    return self.voted_card ~= nil
end

function PLAYER:GetVote()
    return self.voted_card
end

function PLAYER:Vote(card)
    self.voted_card = card
end

function PLAYER:Unvote()
    self.voted_card = nil
end

function PLAYER:SetCanSelect(v)
    self.can_select = v
end

function PLAYER:CanSelect()
    return self.can_select
end

function PLAYER:ClearSelection()
    local cleared_cards = List(self.selected_cards)
    self.selected_cards:Each(function (v) v:Deselect() end)
    self.selected_cards:Clear()
    return cleared_cards
end

function PLAYER:ToggleCard(card)
    if self:IsCardSelected(card) then
        self:DeselectCard(card)
    else
        self:SelectCard(card)
    end
end

function PLAYER:SelectCard(card)
    if not self:IsCardSelected(card) then
        card:Select()
        self.selected_cards:Push(card)
    end
end

function PLAYER:DeselectCard(card)
    if self:IsCardSelected(card) then
        card:Deselect()
        self.selected_cards:Remove(card)
    end
end

function PLAYER:IsCardSelected(card)
    local _, k = self.selected_cards:Find(card)
    return k
end

function PLAYER:SelectedCards()
    return self.selected_cards
end

function PLAYER:OwnsCard(card)
    return self:PlayerId() == card:Owner()
end

function PLAYER:ToString()
    return "playerId: " .. self:PlayerId() .. ", points: " .. self:Points() .. ", can_select: " .. tostring(self:CanSelect())
end

function PLAYER:Dump()
    print(self:ToString())
    print("selected cards:")
    self.selected_cards:Each(function (card) print(card:ToString()) end)
    print("---")
end

print( "player.lua is loaded." )