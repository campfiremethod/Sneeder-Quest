// ui/form-management.js
// UI initialization and form management functions

// Main form initialization function
function FormCreate() {
  ExpBar = new ProgressBar("ExpBar", "$remaining XP needed for next level");
  EncumBar = new ProgressBar("EncumBar", "$position/$max cubits");
  PlotBar = new ProgressBar("PlotBar", "$time remaining");
  QuestBar = new ProgressBar("QuestBar", "$percent% complete");
  TaskBar = new ProgressBar("TaskBar", "$percent%");

  AllBars = [ExpBar, PlotBar, TaskBar, QuestBar, EncumBar];

  Traits = new ListBox("Traits", 2, K.Traits);
  Stats = new ListBox("Stats", 2, K.Stats);
  Skills = new ListBox("Skills", 2);
  Equips = new ListBox("Equips", 2, K.Equips);
  Inventory = new ListBox("Inventory", 2);
  Plots = new ListBox("Plots", 1);
  Quests = new ListBox("Quests", 1);

  Plots.load = function (sheet) {
    for (var i = Max(0, game.act - 99); i <= game.act; ++i)
      this.AddUI(i ? "Act " + toRoman(i) : "Prologue");
  };

  AllLists = [Traits, Stats, Skills, Equips, Inventory, Plots, Quests];

  if (document) {
    Kill = $("#Kill");

    $("#quit").click(quit);

    $(document).keypress(FormKeyDown);

    $(document).bind("beforeunload", function () {
      if (!storage)
        return "Are you sure you want to quit? All your progress will be lost!";
    });

    $(window).on("unload", function (event) {
      StopTimer();
      SaveGame();
      if (storage.async) {
        // Have to give SQL transaction a chance to complete
        if (window.showModalDialog) pause(100);

        // Just accept some data loss - alert is too ugly. Maybe increase save
        // frequency.
        // else alert("Game saved");
      }
    });

    if (iOS) $("body").addClass("iOS");
  }

  var name = unescape(window.location.href.split("#")[1]);
  storage.loadSheet(name, LoadGame);

  if (window.opener) {
    // Opened as a popup, so go bare style
    prepPopup();
  }
}

// Popup window management
function prepPopup() {
  document.body.classList.add("bare");
  window.resizeBy(
    $("#main")[0].offsetWidth - window.innerWidth,
    $("#main")[0].offsetHeight - window.innerHeight
  );

  let titlebar = $("#titlebar");
  let delta;

  titlebar.on("mousedown", (e) => {
    delta = {
      x: e.pageX,
      y: e.pageY,
    };
    console.log(delta);
  });

  $("html").on("mouseup", (e) => {
    delta = null;
  });

  $("html").on("mousemove", (e) => {
    if (!e.which) delta = null;
    if (delta) {
      window.moveBy(e.pageX - delta.x, e.pageY - delta.y);
    }
  });
}

// Keyboard event handler
function FormKeyDown(e) {
  $("#bsodmom").hide();

  if (e.key === "d") {
    alert("Your character's genome is " + ToDna(game.dna + ""));
  }

  if (game.online) {
    if (e.key === "b") {
      Brag("b", true);
    }

    if (e.key === "g") {
      Guildify(
        InputBox(
          "Choose a guild.\n\nMake sure you understand the guild rules before you join one. To learn more about guilds, visit http://progressquest.com/guilds.php\n",
          game.guild
        )
      );
    }

    if (e.key === "m") {
      let mot = InputBox("Declare your motto!", game.motto);
      if (mot !== null) {
        game.motto = mot;
        Brag("m", true);
      }
    }
  }

  if (e.key === "p") {
    if (clock && clock.running) {
      $("#paused").css("display", "block");
      StopTimer();
    } else {
      $("#paused").css("display", "");
      StartTimer();
    }
  }

  if (e.key === "q") {
    quit();
  }

  if (e.key === "s") {
    SaveGame();
    alert("Saved (" + JSON.stringify(game).length + " bytes).");
  }

  if (e.key === "w") {
    if (window.opener) return;
    $(window).unbind("unload"); // we're about to save it anyway
    SaveGame(() => {
      let ext = window.open(
        window.location.href,
        "Sneeder Quest",
        `resizable,width=${$("#main")[0].offsetWidth},height=${
          $("#main")[0].offsetHeight
        },popup,location=0`
      );
      console.log(ext);
      if (ext && !ext.closed && typeof ext.closed !== "undefined") {
        // popup was apparently not blocked
        window.location.href = "roster.html"; // this window can go back to the roster
      }
    });
  }

  /*
  if (e.key === 't') {
    TaskBar.reposition(TaskBar.Max());
  }
  */
}

// Utility functions used by form management
function pause(msec) {
  window.showModalDialog(
    "javascript:document.writeln ('<script>window.setTimeout(" +
      "function () { window.close(); }," +
      msec +
      ");</script>')",
    null,
    "dialogWidth:0;dialogHeight:0;dialogHide:yes;unadorned:yes;" +
      "status:no;scroll:no;center:no;dialogTop:-10000;dialogLeft:-10000"
  );
}

function quit() {
  $(window).unbind("unload");
  SaveGame(() => {
    if (window.opener) {
      window.close();
    } else {
      window.location.href = "roster.html";
    }
  });
}

function InputBox(message, def) {
  return prompt(message, def || "");
}