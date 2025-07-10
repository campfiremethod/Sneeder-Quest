// game/monster-generator.js
// Monster and character name generation system

// Monster modifier functions
function Sick(m, s) {
  m = 6 - Abs(m);
  return prefix(
    ["dead", "comatose", "crippled", "sick", "undernourished"],
    m,
    s
  );
}

function Young(m, s) {
  m = 6 - Abs(m);
  return prefix(
    ["foetal", "baby", "preadolescent", "teenage", "underage"],
    m,
    s
  );
}

function Big(m, s) {
  return prefix(["greater", "massive", "enormous", "giant", "titanic"], m, s);
}

function Special(m, s) {
  if (Pos(" ", s) > 0)
    return prefix(["veteran", "cursed", "warrior", "undead", "demon"], m, s);
  else
    return prefix(
      ["Battle-", "cursed ", "Were-", "undead ", "demon "],
      m,
      s,
      ""
    );
}

// Named character generators
function NamedMonster(level) {
  var lev = 0;
  var result = "";
  for (var i = 0; i < 5; ++i) {
    var m = Pick(K.Monsters);
    if (!result || Abs(level - StrToInt(Split(m, 1))) < Abs(level - lev)) {
      result = Split(m, 0);
      lev = StrToInt(Split(m, 1));
    }
  }
  return GenerateName() + " the " + result;
}

function ImpressiveGuy() {
  if (Random(2)) {
    return (
      "the " +
      Pick(K.ImpressiveTitles) +
      " of the " +
      Plural(Split(Pick(K.Races), 0))
    );
  } else {
    return (
      Pick(K.ImpressiveTitles) + " " + GenerateName() + " of " + GenerateName()
    );
  }
}

// Helper function to create location-specific monster task
function LocationMonsterTask(level) {
  // Try to get local monsters from current location
  var localMonsters = [];
  
  if (typeof getCurrentLocationMonsters === 'function') {
    localMonsters = getCurrentLocationMonsters();
  }
  
  // If no local monsters available, return null to fall back to normal generation
  if (!localMonsters || localMonsters.length === 0) {
    return null;
  }
  
  // Pick a random local monster
  var localMonster = Pick(localMonsters);
  var monsterName = localMonster.name;
  var dropItem = localMonster.drop;
  
  // Use player's current level since local monsters don't have levels
  var monsterLevel = level;
  var originalLevel = level;
  
  // Apply the same level variation logic as global monsters
  for (var i = level; i >= 1; --i) {
    if (Odds(2, 5)) level += RandSign();
  }
  if (level < 1) level = 1;
  
  // Since local monsters don't have predefined levels, we'll treat them as if 
  // they have a level equal to the player's level, then apply modifiers
  var lev = originalLevel; // Treat local monster "base level" as player level
  var result = monsterName;
  var qty = 1;
  
  // Apply quantity scaling if needed (same logic as global monsters)
  if (level - lev > 10) {
    // level is too high... multiply...
    qty = Math.floor((level + Random(Max(lev, 1))) / Max(lev, 1));
    if (qty < 1) qty = 1;
    level = Math.floor(level / qty);
  }

  // Apply the same modifier logic as global monsters
  if (level - lev <= -10) {
    result = "imaginary " + result;
  } else if (level - lev < -5) {
    var i = 10 + (level - lev);
    i = 5 - Random(i + 1);
    result = Sick(i, Young(lev - level - i, result));
  } else if (level - lev < 0 && Random(2) == 1) {
    result = Sick(level - lev, result);
  } else if (level - lev < 0) {
    result = Young(level - lev, result);
  } else if (level - lev >= 10) {
    result = "messianic " + result;
  } else if (level - lev > 5) {
    var i = 10 - (level - lev);
    i = 5 - Random(i + 1);
    result = Big(i, Special(level - lev - i, result));
  } else if (level - lev > 0 && Random(2) == 1) {
    result = Big(level - lev, result);
  } else if (level - lev > 0) {
    result = Special(level - lev, result);
  }

  lev = level;
  level = lev * qty;

  // Apply quantity grammar (same as global monsters)
  var definite = false; // Local monsters are not named characters
  if (!definite) result = Indefinite(result, qty);
  
  // Create the monster task string in the same format as global monsters
  var taskString = monsterName + "|" + IntToStr(level);
  if (dropItem) {
    taskString += "|" + dropItem;
  } else {
    taskString += "|*"; // Use * for random loot like NPCs
  }
  
  game.task = "kill|" + taskString;
  
  return { description: result, level: level };
}

// Main monster task generator
function MonsterTask(level) {
  var definite = false;
  
  // 30% chance to use location-specific monsters
  if (Random(100) < 30) {
    var locationMonster = LocationMonsterTask(level);
    if (locationMonster) {
      return locationMonster;
    }
    // If no location monsters available, fall through to normal generation
  }
  
  // Original monster generation logic below
  for (var i = level; i >= 1; --i) {
    if (Odds(2, 5)) level += RandSign();
  }
  if (level < 1) level = 1;
  // level = level of puissance of opponent(s) we'll return

  var monster, lev;
  if (Odds(1, 25)) {
    // Use an NPC every once in a while
    monster = " " + Split(Pick(K.Races), 0);
    if (Odds(1, 2)) {
      monster = "passing" + monster + " " + Split(Pick(K.Klasses), 0);
    } else {
      monster = PickLow(K.Titles) + " " + GenerateName() + " the" + monster;
      definite = true;
    }
    lev = level;
    monster = monster + "|" + IntToStr(level) + "|*";
  } else if (game.questmonster && Odds(1, 4)) {
    // Use the quest monster
    monster = K.Monsters[game.questmonsterindex];
    lev = StrToInt(Split(monster, 1));
  } else {
    // Pick the monster out of so many random ones closest to the level we want
    monster = Pick(K.Monsters);
    lev = StrToInt(Split(monster, 1));
    for (var ii = 0; ii < 5; ++ii) {
      var m1 = Pick(K.Monsters);
      if (Abs(level - StrToInt(Split(m1, 1))) < Abs(level - lev)) {
        monster = m1;
        lev = StrToInt(Split(monster, 1));
      }
    }
  }

  var result = Split(monster, 0);
  game.task = "kill|" + monster;

  var qty = 1;
  if (level - lev > 10) {
    // lev is too low... multiply...
    qty = Math.floor((level + Random(Max(lev, 1))) / Max(lev, 1));
    if (qty < 1) qty = 1;
    level = Math.floor(level / qty);
  }

  if (level - lev <= -10) {
    result = "imaginary " + result;
  } else if (level - lev < -5) {
    i = 10 + (level - lev);
    i = 5 - Random(i + 1);
    result = Sick(i, Young(lev - level - i, result));
  } else if (level - lev < 0 && Random(2) == 1) {
    result = Sick(level - lev, result);
  } else if (level - lev < 0) {
    result = Young(level - lev, result);
  } else if (level - lev >= 10) {
    result = "messianic " + result;
  } else if (level - lev > 5) {
    i = 10 - (level - lev);
    i = 5 - Random(i + 1);
    result = Big(i, Special(level - lev - i, result));
  } else if (level - lev > 0 && Random(2) == 1) {
    result = Big(level - lev, result);
  } else if (level - lev > 0) {
    result = Special(level - lev, result);
  }

  lev = level;
  level = lev * qty;

  if (!definite) result = Indefinite(result, qty);
  return { description: result, level: level };
}