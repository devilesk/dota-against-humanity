CARD = class({})

function CARD:constructor(id, data)
    self.id = id
    self.data = data
    self.owner = -1
    self.selected = false
end

function CARD:Id()
    return self.id
end

function CARD:Data()
    return self.data
end

function CARD:Owner()
    return self.owner
end

function CARD:ClearOwner(owner)
    self.owner = -1
end

function CARD:HasOwner()
    return self.owner ~= -1
end

function CARD:SetOwner(owner)
    self.owner = owner
end

function CARD:IsSelected()
    return self.selected
end

function CARD:Select()
    self.selected = true
end

function CARD:Deselect()
    self.selected = false
end

function CARD:ToString()
    return "id: " .. self:Id() .. ", owner: " .. self:Owner() .. ", selected: " .. tostring(self:IsSelected()) .. ", data: " .. self:Data()
end

BLACK_CARD = class({}, {}, CARD)

function BLACK_CARD:constructor(id, data)
    CARD.constructor(self, id, data)
    local _, blanks = string.gsub(data, "__________", "")
    self.blanks = math.max(blanks, 1)
end

function BLACK_CARD:Blanks()
    return self.blanks
end

function BLACK_CARD:ToString()
    return CARD.ToString(self) .. ", blanks: " .. self:Blanks()
end

print( "card.lua is loaded." )