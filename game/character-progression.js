// game/character-progression.js
// Character progression and reward system

function LevelUp() {
  Add(Traits, "Level", 1);
  Add(Stats, "HP Max", GetI(Stats, "CON").div(3) + 1 + Random(4));
  Add(Stats, "TP Max", GetI(Stats, "INT").div(3) + 1 + Random(4));
  WinStat();
  WinStat();
  WinSkill();
  ExpBar.reset(LevelUpTime(GetI(Traits, "Level")));
  Brag("l");
}

// game/character-progression.js
// game/character-progression.js
function WinSkill() {
  // Safety check - ensure skills are loaded
  if (!K.Skills || K.Skills.length === 0) {
    console.warn("Skills not loaded yet - deferring skill gain");
    // Try to load skills and retry
    if (typeof loadSkills === 'function') {
      loadSkills().then(() => {
        if (K.Skills.length > 0) {
          WinSkill(); // Retry now that skills are loaded
        }
      });
    }
    return;
  }
  
  const skillName = K.Skills[
    RandomLow(
      Min(GetI(Stats, "WIS") + GetI(Traits, "Level"), K.Skills.length)
    )
  ];
  
  const currentLevel = toArabic(Get(Skills, skillName));
  const isNewSkill = currentLevel === 0;
  
  // Step 1: "Attempting to learn/improve {skill}..."
  Task(`Attempting to ${isNewSkill ? 'learn' : 'improve'} ${skillName}`, 2000);
  
  // Queue the narrative sequence
  Q(`skill_narrative|3|${skillName}|${isNewSkill ? 'learn' : 'improve'}`);
}

function WinStat() {
  var i;
  if (Odds(1, 2)) {
    i = Pick(K.Stats);
  } else {
    // Favor the best stat so it will tend to clump
    var t = 0;
    $.each(K.PrimeStats, function (index, key) {
      t += Square(GetI(Stats, key));
    });
    t = Random(t);
    $.each(K.PrimeStats, function (index, key) {
      i = key;
      t -= Square(GetI(Stats, key));
      if (t < 0) return false;
    });
  }
  Add(Stats, i, 1);
}

function WinEquip() {
  var posn = Random(Equips.length());

  if (posn == 0) {
    // Weapon
    stuff = K.Weapons;
    better = K.OffenseAttrib;
    worse = K.OffenseBad;
  } else if (posn == 1) {
    // Accessory
    stuff = K.Accessories;
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
  } else if (posn == 2) {
    // Headwear
    stuff = K.Headwear;
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
  } else if (posn == 3) {
    // Eyewear
    stuff = K.Eyewear;
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
  } else if (posn == 4) {
    // Body Armor
    stuff = K.BodyArmor;
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
  } else if (posn == 5) {
    // Jacket
    stuff = K.Jackets;
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
  } else if (posn == 6) {
    // Gloves
    stuff = K.Gloves;
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
  } else if (posn == 7) {
    // Wristwear
    stuff = K.Wristwear;
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
  } else if (posn == 8) {
    // Belt
    stuff = K.Belts;
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
  } else if (posn == 9) {
    // Legwear
    stuff = K.Legwear;
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
  } else if (posn == 10) {
    // Footwear
    stuff = K.Footwear;
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
  } else {
    // Fallback (shouldn't happen with 11 slots)
    stuff = K.Armors;
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
  }

  var name = LPick(stuff, GetI(Traits, "Level"));
  var qual = StrToInt(Split(name, 1));
  name = Split(name, 0);
  var plus = GetI(Traits, "Level") - qual;
  if (plus < 0) better = worse;
  var count = 0;
  while (count < 2 && plus) {
    var modifier = Pick(better);
    qual = StrToInt(Split(modifier, 1));
    modifier = Split(modifier, 0);
    if (Pos(modifier, name) > 0) break; // no repeats
    if (Abs(plus) < Abs(qual)) break; // too much
    name = modifier + " " + name;
    plus -= qual;
    ++count;
  }
  if (plus) name = plus + " " + name;
  if (plus > 0) name = "+" + name;

  Put(Equips, posn, name);
  game.bestequip = name;
  if (posn > 0) game.bestequip += " " + Equips.label(posn);
}

function WinItem() {
  if (Max(250, Random(999)) < Inventory.length()) {
    Add(Inventory, Pick(Inventory.rows()).firstChild.innerText, 1);
  } else {
    Add(Inventory, SpecialItem(), 1);
  }
}

function LPick(list, goal) {
  var result = Pick(list);
  for (var i = 1; i <= 5; ++i) {
    var best = StrToInt(Split(result, 1));
    var s = Pick(list);
    var b1 = StrToInt(Split(s, 1));
    if (Abs(goal - best) > Abs(goal - b1)) result = s;
  }
  return result;
}