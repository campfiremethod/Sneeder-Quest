// game/item-generator.js
// Item generation system for quests and rewards

function SpecialItem() {
  return InterestingItem() + " of " + Pick(K.ItemOfs);
}

function InterestingItem() {
  return Pick(K.ItemAttrib) + " " + Pick(K.Specials);
}

function BoringItem() {
  return Pick(K.BoringItems);
}