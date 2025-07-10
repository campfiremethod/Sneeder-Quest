// Copyright (c)2002-2010 Eric Fredricksen <e@fredricksen.net> all rights reserved

var game = {};
var clock;

function timeGetTime() {
  return new Date().getTime();
}

function StartTimer() {
  if (!clock) {
    clock = new Worker("clock.js");
    clock.addEventListener("message", (e) => {
      Timer1Timer();
      clock.lasttick = timeGetTime();
    });
  }
  if (!clock.running) {
    clock.lasttick = timeGetTime();
    clock.running = true;
    clock.postMessage("start");
  }
}

function StopTimer() {
  if (clock) {
    clock.postMessage("stop");
    clock.running = false;
  }
}

function Q(s) {
  game.queue.push(s);
  Dequeue();
}

function TaskDone() {
  return TaskBar.done();
}

function InterplotCinematic() {
  switch (Random(3)) {
    case 0:
      Q("task|1|Exhausted, you crash at a friend's apartment for the night");
      Q("task|2|You catch up with old friends and meet some new faces");
      Q("task|2|Everyone's talking about this big opportunity that's come up");
      Q("task|1|Sounds risky but profitable. You're definitely interested!");
      break;
    case 1:
      Q(
        "task|1|You're close to your target, but there's a problem - security!"
      );
      var nemesis = NamedMonster(GetI(Traits, "Level") + 3);
      Q("task|4|Things get heated with " + nemesis);
      var s = Random(3);
      for (var i = 1; i <= Random(1 + game.act + 1); ++i) {
        s += 1 + Random(2);
        switch (s % 3) {
          case 0:
            Q("task|2|Still dealing with " + nemesis);
            break;
          case 1:
            Q("task|2|" + nemesis + " is making this difficult");
            break;
          case 2:
            Q("task|2|You're starting to get the upper hand on " + nemesis);
            break;
        }
      }
      Q(
        "task|3|Victory! " +
          nemesis +
          " is slain! Exhausted, you lose consciousness"
      );
      Q("task|2|You awake in a friendly place, but the road awaits");
      break;
    case 2:
      var nemesis2 = ImpressiveGuy();
      Q(
        "task|2|Oh sweet relief! You've reached the kind protection of " +
          nemesis2
      );
      Q(
        "task|3|There is rejoicing, and an unnerving encounter with " +
          nemesis2 +
          " in private"
      );
      Q("task|2|You forget your " + BoringItem() + " and go back to get it");
      Q("task|2|What's this!? You overhear something shocking!");
      Q("task|2|Could " + nemesis2 + " be a dirty double-dealer?");
      Q(
        "task|3|Who can possibly be trusted with this news!? -- Oh yes, of course"
      );
      break;
  }
  Q("plot|1|Loading");
}

function EquipPrice() {
  return (
    5 * GetI(Traits, "Level") * GetI(Traits, "Level") +
    10 * GetI(Traits, "Level") +
    20
  );
}
function Dequeue() {
  while (TaskDone()) {
    // Handle completed tasks first (moved from original position)
    if (Split(game.task, 0) == 'kill') {
      if (Split(game.task, 3) == '*') {
        WinItem();
      } else if (Split(game.task, 3)) {
        Add(
          Inventory,
          LowerCase(
            Split(game.task, 1) + ' ' + ProperCase(Split(game.task, 3))
          ),
          1
        );
      }
      // Random skill usage AFTER killing something (15% chance)
      if (typeof SkillsSystem !== 'undefined' && SkillsSystem.randomUsageAfterAction('kill')) {
        break; // Let the skill process first, then continue normal flow
      }
    } else if (game.task == 'buying') {
      // Double-check we can afford it before actually buying
      if (GetI(Inventory, 'Money') >= EquipPrice()) {
        // buy some equipment
        Add(Inventory, 'Money', -EquipPrice());
        WinEquip();
        // Random skill usage AFTER buying something (20% chance)
        if (typeof SkillsSystem !== 'undefined' && SkillsSystem.randomUsageAfterAction('buy')) {
          break; // Let the skill process first
        }
      } else {
        // Can't afford it anymore, just continue without buying
        console.log("Cannot afford equipment (Money:", GetI(Inventory, 'Money'), "Price:", EquipPrice(), ")");
      }
    } else if ((game.task == 'market') || (game.task == 'sell')) {
      if (game.task == 'sell') {
        var amt = GetI(Inventory, 1) * GetI(Traits, 'Level');
        if (Pos(' of ', Inventory.label(1)) > 0)
          amt *= (1 + Random(100)) / 100;
        Add(Inventory, 'Money', amt);
        // Remove the sold item using the proper method
        if (typeof Inventory.remove1 === 'function') {
          Inventory.remove1();
        } else {
          // Fallback if remove1 doesn't exist
          if (Inventory.length() > 1) {
            var itemName = Inventory.label(1);
            Add(Inventory, itemName, -1);
          }
        }
      }
      if (Inventory.length() > 1) {
        Inventory.scrollToTop();
        Task('Selling ' + Inventory.label(1), 1 * 1000);
        game.task = 'sell';
        break;
      }
    } else if (game.task == 'interplot') {
      InterplotCinematic();
      break;
    }

    var old = game.task;
    game.task = '';
    
    // Handle queued items
    if (game.queue.length > 0) {
      var queueItem = game.queue.shift();
      var a = Split(queueItem, 0);
      var n = StrToInt(Split(queueItem, 1));
      var s = Split(queueItem, 2);
      
      if (a == 'task' || a == 'plot') {
        if (a == 'plot') {
          CompleteAct();
          s = 'Loading ' + game.bestplot;
        }
        Task(s, n * 1000);
        break;
      } else if (typeof SkillsSystem !== 'undefined' && SkillsSystem.processQueue(queueItem)) {
        // Skills system handled the queue item
        break;
      } else {
        // Unknown queue item, skip it
        console.warn("Unknown queue item:", queueItem);
        continue;
      }
    }
    
    // ===== ORIGINAL SELLING LOGIC (FIXED) =====
    // Check encumbrance bar - if full, go to market to sell
    else if (EncumBar.done()) {
      Task('Heading to market to sell loot', 4 * 1000);
      game.task = 'market';
    }
    
    // ===== 3-WAY DECISION LOGIC =====
    // Check if skills system wants to take over
    else if (typeof SkillsSystem !== 'undefined' && SkillsSystem.checkTakeover()) {
      // Skills system will handle the queue, continue to next cycle
    }
    
    // Check if location system wants to change location
    else if (typeof checkLocationChange === 'function' && checkLocationChange()) {
      // Location system will handle the change, continue to next cycle
    }
    
    // Check if we just showed skill usage (similar to location flavor text)
    else if (typeof SkillsSystem !== 'undefined' && SkillsSystem.checkJustShowedUsage()) {
      SkillsSystem.clearUsageFlag(); // Clear the flag
      // Go straight to monster combat without any other checks
      var nn = GetI(Traits, "Level");
      var t = MonsterTask(nn);
      var InventoryLabelAlsoGameStyleTag = 3;
      nn = Math.floor(
        (2 * InventoryLabelAlsoGameStyleTag * t.level * 1000) / nn
      );
      Task("Killing " + t.description, nn);
    }
    
    // Check if we just showed location flavor text
    else if (typeof checkJustShowedFlavorText === 'function' && checkJustShowedFlavorText()) {
      if (typeof clearFlavorTextFlag === 'function') clearFlavorTextFlag(); // Clear the flag
      // Go straight to monster combat without any other checks
      var nn = GetI(Traits, "Level");
      var t = MonsterTask(nn);
      var InventoryLabelAlsoGameStyleTag = 3;
      nn = Math.floor(
        (2 * InventoryLabelAlsoGameStyleTag * t.level * 1000) / nn
      );
      Task("Killing " + t.description, nn);
    }
    
    // ===== ORIGINAL LOGIC RESTORED =====
    else if ((Pos('kill|', old) <= 0) && (old != 'heading')) {
      if (GetI(Inventory, 'Money') > EquipPrice()) {
        Task('Negotiating purchase of better equipment', 5 * 1000);
        game.task = 'buying';
      } else {
        Task('Heading to the killing fields', 4 * 1000);
        game.task = 'heading';
      }
    } else {
      // Default: go kill monsters
      var nn = GetI(Traits, 'Level');
      var t = MonsterTask(nn);
      var InventoryLabelAlsoGameStyleTag = 3;
      nn = Math.floor((2 * InventoryLabelAlsoGameStyleTag * t.level * 1000) / nn);
      Task('Killing ' + t.description, nn);
    }
  }
}
function Put(list, key, value) {
  if (typeof key === typeof 1) key = list.label(key);

  if (list.fixedkeys) {
    game[list.id][key] = value;
  } else {
    var i = 0;
    for (; i < game[list.id].length; ++i) {
      if (game[list.id][i][0] === key) {
        game[list.id][i][1] = value;
        break;
      }
    }
    if (i == game[list.id].length) game[list.id].push([key, value]);
  }

  list.PutUI(key, value);

  if (key === "STR") EncumBar.reset(10 + value, EncumBar.Position());

  if (list === Inventory) {
    var cubits = 0;
    $.each(game.Inventory.slice(1), function (index, item) {
      cubits += StrToInt(item[1]);
    });
    EncumBar.reposition(cubits);
  }
}

var ExpBar, PlotBar, TaskBar, QuestBar, EncumBar;
var Traits, Stats, Skills, Equips, Inventory, Plots, Quests;
var Kill;
var AllBars, AllLists;

if (document) $(document).ready(FormCreate);

function CompleteQuest() {
  QuestBar.reset(50 + Random(100));
  if (Quests.length()) {
    Log("Quest completed: " + game.bestquest);
    Quests.CheckAll();
    [WinSkill, WinEquip, WinStat, WinItem][Random(4)]();
  }
  while (Quests.length() > 99) Quests.remove0();

  game.questmonster = "";
  var caption;
  switch (Random(5)) {
    case 0:
      var level = GetI(Traits, "Level");
      var lev = 0;
      for (var i = 1; i <= 4; ++i) {
        var montag = Random(K.Monsters.length);
        var m = K.Monsters[montag];
        var l = StrToInt(Split(m, 1));
        if (i == 1 || Abs(l - level) < Abs(lev - level)) {
          lev = l;
          game.questmonster = m;
          game.questmonsterindex = montag;
        }
      }
      caption = "Exterminate " + Definite(Split(game.questmonster, 0), 2);
      break;
    case 1:
      caption = "Seek " + Definite(InterestingItem(), 1);
      break;
    case 2:
      caption = "Deliver this " + BoringItem();
      break;
    case 3:
      caption = "Fetch me " + Indefinite(BoringItem(), 1);
      break;
    case 4:
      var mlev = 0;
      level = GetI(Traits, "Level");
      for (var ii = 1; ii <= 2; ++ii) {
        montag = Random(K.Monsters.length);
        m = K.Monsters[montag];
        l = StrToInt(Split(m, 1));
        if (ii == 1 || Abs(l - level) < Abs(mlev - level)) {
          mlev = l;
          game.questmonster = m;
        }
      }
      caption = "Eradicate " + Definite(Split(game.questmonster, 0), 2);
      game.questmonster = ""; // We're trying to placate them, after all
      break;
  }
  if (!game.Quests) game.Quests = [];
  while (game.Quests.length > 99) game.Quests.shift();
  game.Quests.push(caption);
  game.bestquest = caption;
  Quests.AddUI(caption);

  Log("Commencing quest: " + caption);

  SaveGame();
}

function toRoman(n) {
  if (!n) return "N";
  var s = "";
  function _rome(dn, ds) {
    if (n >= dn) {
      n -= dn;
      s += ds;
      return true;
    } else return false;
  }
  if (n < 0) {
    s = "-";
    n = -n;
  }

  while (_rome(10000, "T")) {
    0;
  }
  _rome(9000, "MT");
  _rome(5000, "A");
  _rome(4000, "MA");
  while (_rome(1000, "M")) {
    0;
  }
  _rome(900, "CM");
  _rome(500, "D");
  _rome(400, "CD");
  while (_rome(100, "C")) {
    0;
  }
  _rome(90, "XC");
  _rome(50, "L");
  _rome(40, "XL");
  while (_rome(10, "X")) {
    0;
  }
  _rome(9, "IX");
  _rome(5, "V");
  _rome(4, "IV");
  while (_rome(1, "I")) {
    0;
  }
  return s;
}

function toArabic(s) {
  n = 0;
  s = s.toUpperCase();
  function _arab(ds, dn) {
    if (!Starts(s, ds)) return false;
    s = s.substr(ds.length);
    n += dn;
    return true;
  }
  while (_arab("T", 10000)) {
    0;
  }
  _arab("MT", 9000);
  _arab("A", 5000);
  _arab("MA", 4000);
  while (_arab("M", 1000)) {
    0;
  }
  _arab("CM", 900);
  _arab("D", 500);
  _arab("CD", 400);
  while (_arab("C", 100)) {
    0;
  }
  _arab("XC", 90);
  _arab("L", 50);
  _arab("XL", 40);
  while (_arab("X", 10)) {
    0;
  }
  _arab("IX", 9);
  _arab("V", 5);
  _arab("IV", 4);
  while (_arab("I", 1)) {
    0;
  }
  return n;
}

function CompleteAct() {
  Plots.CheckAll();
  game.act += 1;
  PlotBar.reset(60 * 60 * (1 + 5 * game.act)); // 1 hr + 5/act
  Plots.AddUI((game.bestplot = "Act " + toRoman(game.act)));

  if (game.act > 1) {
    WinItem();
    WinEquip();
  }

  Brag("a");
}

function Log(line) {
  if (game.log) game.log[+new Date()] = line;
  // TODO: and now what?
}

function Task(caption, msec) {
  game.kill = caption + "...";
  if (Kill) Kill.text(game.kill);
  Log(game.kill);
  TaskBar.reset(msec);
}

function Add(list, key, value) {
  Put(list, key, value + GetI(list, key));

  /*$IFDEF LOGGING*/
  if (!value) return;
  var line = value > 0 ? "Gained" : "Lost";
  if (key == "Money") {
    key = "Money piece";
    line = value > 0 ? "Got paid" : "Spent";
  }
  if (value < 0) value = -value;
  line = line + " " + Indefinite(key, value);
  Log(line);
  /*$ENDIF*/
}

function AddR(list, key, value) {
  Put(list, key, toRoman(value + toArabic(Get(list, key))));
}

function Get(list, key) {
  if (list.fixedkeys) {
    if (typeof key === typeof 1) key = list.fixedkeys[key];
    return game[list.id][key];
  } else if (typeof key === typeof 1) {
    if (key < game[list.id].length) return game[list.id][key][1];
    else return "";
  } else {
    for (var i = 0; i < game[list.id].length; ++i) {
      if (game[list.id][i][0] === key) return game[list.id][i][1];
    }
    return "";
  }
}

function GetI(list, key) {
  return StrToIntDef(Get(list, key), 0);
}

function ClearAllSelections() {
  $.each(AllLists, function () {
    this.ClearSelection();
  });
}

function RoughTime(s) {
  if (s < 120) return s.div(1) + " seconds";
  else if (s < 60 * 120) return s.div(60) + " minutes";
  else if (s < 60 * 60 * 48) return s.div(3600) + " hours";
  else if (s < 60 * 60 * 24 * 60) return s.div(3600 * 24) + " days";
  else if (s < 60 * 60 * 24 * 30 * 24) return s.div(3600 * 24 * 30) + " months";
  else return s.div(3600 * 24 * 30 * 12) + " years";
}

var dealing = false;

function Timer1Timer() {
  if (TaskBar.done()) {
    game.tasks += 1;
    game.elapsed += TaskBar.Max().div(1000);

    ClearAllSelections();

    if (game.kill == "Loading....") TaskBar.reset(0); // Not sure if this is still the ticket

    // gain XP / level up
    var gain = Pos("kill|", game.task) == 1;
    if (gain) {
      if (ExpBar.done()) LevelUp();
      else ExpBar.increment(TaskBar.Max() / 1000);
    }

    // advance quest
    if (gain && game.act >= 1) {
      if (QuestBar.done() || !Quests.length()) {
        CompleteQuest();
      } else {
        QuestBar.increment(TaskBar.Max() / 1000);
      }
    }

    // advance plot
    if (gain || !game.act) {
      if (PlotBar.done()) InterplotCinematic();
      else PlotBar.increment(TaskBar.Max() / 1000);
    }

    Dequeue();
  } else {
    var elapsed = timeGetTime() - clock.lasttick;
    if (elapsed > 100) elapsed = 100;
    if (elapsed < 0) elapsed = 0;
    TaskBar.increment(elapsed);
  }

  StartTimer();
}

function HotOrNot() {
  // Figure out which skill is best
  if (Skills.length()) {
    var flat = 1; // Flattening constant
    var best = 0,
      i;
    for (i = 1; i < Skills.length(); ++i) {
      if (
        (i + flat) * toArabic(Get(Skills, i)) >
        (best + flat) * toArabic(Get(Skills, best))
      )
        best = i;
    }
    game.bestskill = Skills.label(best) + " " + Get(Skills, best);
  } else {
    game.bestskill = "";
  }

  /// And which stat is best?
  best = 0;
  for (i = 1; i <= 5; ++i) {
    if (GetI(Stats, i) > GetI(Stats, best)) best = i;
  }
  game.beststat = Stats.label(best) + " " + GetI(Stats, best);
}

function SaveGame(callback) {
  Log("Saving game: " + GameSaveName());
  HotOrNot();
  game.date = "" + new Date();
  game.stamp = +new Date();
  game.seed = randseed();
  storage.addToRoster(game, callback);
}

function LoadGame(sheet) {
  if (!sheet) {
    alert("Error loading game");
    window.location.href = "roster.html";
    return;
  }

  game = sheet;

  // Migration: Convert old Spells property to Skills for backward compatibility
  if (game.Spells && !game.Skills) {
    game.Skills = game.Spells;
    delete game.Spells;
  }

  if (document) {
    var title = "Sneeder Quest - " + GameSaveName();
    $("#title").text(title);
    if (iOS) title = GameSaveName();
    document.title = title;
  }

  randseed(game.seed);
  $.each(AllBars.concat(AllLists), function (i, e) {
    e.load(game);
  });
  if (Kill) Kill.text(game.kill);
  ClearAllSelections();
  $.each([Plots, Quests], function () {
    this.CheckAll(true);
  });

  // Patch correctly skilled skills showing up as new skills when
  // the incorretly skilled skill was there already.
  function patch(from, to) {
    function count(skill) {
      let t = game.Skills.filter((a) => a[0] == skill);
      return t.length == 1 ? toArabic(t[0][1]) : 0;
    }
    let tf = count(from);
    if (!tf) return;
    let tt = count(to);
    let total = tf + tt;
    console.log("Patching " + from + " to " + to);
    game.Skills = game.Skills.filter((a) => a[0] != to);
    for (let skill of game.Skills) {
      if (skill[0] == from) {
        skill[0] = to;
        skill[1] = toRoman(total);
      }
    }
  }
  patch("Innoculate", "Inoculate");
  patch("Tonsilectomy", "Tonsillectomy");

  Log("Loaded game: " + game.Traits.Name);
  if (!game.elapsed) Brag("s");
  StartTimer();
}

function GameSaveName() {
  if (!game.saveName) {
    game.saveName = Get(Traits, "Name");
    if (game.online) game.saveName += " [" + game.online.realm + "]";
  }
  return game.saveName;
}

function ToDna(s) {
  s = s + "";
  var code = {
    0: "AT",
    1: "AG",
    2: "AC",
    3: "TA",
    4: "TG",
    5: "TC",
    6: "GA",
    7: "GT",
    8: "GC",
    9: "CA",
    ",": "CT",
    ".": "CG",
  };
  var r = "";
  for (var i = 0; i < s.length; ++i) {
    r += code[s[i]];
    if (i && i % 4 == 0) r += " ";
  }
  return r;
}

window.onerror = function (message, source, lineno, colno, error) {
  $("#bsod_message").text(message);
  $("#bsod_source").text(source);
  $("#bsod_lineno").text(lineno);
  $("#bsod_colno").text(colno);
  $("#bsod_error").text(error.stack);

  $("#bsodmom").show();
};
