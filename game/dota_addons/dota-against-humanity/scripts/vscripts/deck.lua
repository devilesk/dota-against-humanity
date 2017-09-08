require("libraries/list")

DECK = class(
    {},
    {
        __class__name = "DECK"
    },
    List
)

function DECK:Init(data, CARD_TYPE)
    self.data = data
    for k,v in ipairs(data) do
        self:Push(CARD_TYPE(k, v))
    end
    return self
end

function DECK:Insert(card, pos)
    assert(instanceof(card, CARD), "Insert() first argument is not a CARD")
    List.Insert(self, card, pos)
end

function DECK:Refill(deck)
    self:Copy(deck)
    self:Shuffle()
    deck:Clear()
end

-- remove item from self and insert into list at pos
function DECK:Move(item, list, pos)
    assert(instanceof(list, List), "Move() second argument is not a List")
    assert(isnumber(pos), "Move() pos argument is not a number")
    self:Remove(item)
    list:Insert(item, pos)
end

-- remove item from self and add to top of list
function DECK:MovePush(item, list)
    assert(instanceof(list, List), "MovePush() second argument is not a List")
    self:Remove(item)
    list:Push(item)
end
DECK.MoveToTop = DECK.MovePush

-- remove item from self and add to bottom of list
function DECK:MoveUnshift(item, list)
    assert(instanceof(list, List), "MoveUnshift() second argument is not a List")
    self:Remove(item)
    list:Unshift(item)
end
DECK.MoveToBottom = DECK.MoveUnshift

-- draw item from list and insert into self at pos
function DECK:Draw(item, list, pos)
    assert(instanceof(list, List), "Draw() second argument is not a List")
    assert(isnumber(pos), "Draw() pos argument is not a number")
    list:Remove(item)
    self:Insert(item, pos)
end

-- draw item from list and push to top of self
function DECK:DrawPush(item, list)
    assert(instanceof(list, List), "DrawPush() second argument is not a List")
    list:Remove(item)
    self:Push(item)
end
DECK.DrawToTop = DECK.DrawPush

-- draw item from list and push to bottom of self
function DECK:DrawUnshift(item, list)
    assert(instanceof(list, List), "DrawUnshift() second argument is not a List")
    list:Remove(item)
    self:Unshift(item)
end
DECK.DrawToBottom = DECK.DrawUnshift

print( "deck.lua is loaded." )