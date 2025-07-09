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

// Main monster task generator
function MonsterTask(level) {
  var definite = false;
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
