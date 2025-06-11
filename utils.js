// Utility functions for Progress Quest
// Template and string utilities
function tabulate(list) {
  var result = "";
  $.each(list, function (index) {
    if (this.length == 2) {
      if (this[1].length) result += "   " + this[0] + ": " + this[1] + "\n";
    } else {
      result += "   " + this + "\n";
    }
  });
  return result;
}

String.prototype.escapeHtml = function () {
  return this.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

function template(tmpl, data) {
  var brag = tmpl.replace(/\$([_A-Za-z.]+)/g, function (str, p1) {
    var dict = data;
    $.each(p1.split("."), function (i, v) {
      if (!dict) return true;
      if (v == "___") {
        dict = tabulate(dict);
      } else {
        dict = dict[v.replace("_", " ")];
        if (typeof dict == typeof "") dict = dict.escapeHtml();
      }
      return null;
    });
    if (dict === undefined) dict = "";
    return dict;
  });
  return brag;
}

// Random number generation utilities
// From http://baagoe.com/en/RandomMusings/javascript/
// Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
function Mash() {
  var n = 0xefc8249d;

  var mash = function (data) {
    data = data.toString();
    for (var i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      var h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  mash.version = "Mash 0.9";
  return mash;
}

// From http://baagoe.com/en/RandomMusings/javascript/
function Alea() {
  return (function (args) {
    // Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;

    if (!args.length) {
      args = [+new Date()];
    }
    var mash = Mash();
    s0 = mash(" ");
    s1 = mash(" ");
    s2 = mash(" ");

    for (var i = 0; i < args.length; i++) {
      s0 -= mash(args[i]);
      if (s0 < 0) {
        s0 += 1;
      }
      s1 -= mash(args[i]);
      if (s1 < 0) {
        s1 += 1;
      }
      s2 -= mash(args[i]);
      if (s2 < 0) {
        s2 += 1;
      }
    }
    mash = null;

    var random = function () {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      return (s2 = t - (c = t | 0));
    };
    random.uint32 = function () {
      return random() * 0x100000000; // 2^32
    };
    random.fract53 = function () {
      return random() + ((random() * 0x200000) | 0) * 1.1102230246251565e-16; // 2^-53
    };
    random.version = "Alea 0.9";
    random.args = args;
    random.state = function (newstate) {
      if (newstate) {
        s0 = newstate[0];
        s1 = newstate[1];
        s2 = newstate[2];
        c = newstate[3];
      }
      return [s0, s1, s2, c];
    };
    return random;
  })(Array.prototype.slice.call(arguments));
}

var seed = new Alea();

function Random(n) {
  return seed.uint32() % n;
}

function randseed(set) {
  return seed.state(set);
}

function Pick(a) {
  return a[Random(a.length)];
}

// Name generation utilities
var KParts = [
  "b|ch|d|j|k|l|m|n|r|s|t|v|w".split("|"),
  "a|e|i|o|u|ay|ee".split("|"),
  "n|r|s|t|ch|sh|ck|x".split("|"),
];

function GenerateName() {
  var result = "";
  for (var i = 0; i <= 5; ++i) result += Pick(KParts[i % 3]);
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// Storage classes
function LocalStorage() {
  this.getItem = function (key, callback) {
    var result = window.localStorage.getItem(key);
    if (callback) callback(result);
  };

  this.setItem = function (key, value, callback) {
    window.localStorage.setItem(key, value);
    if (callback) callback();
  };

  this.removeItem = function (key) {
    window.localStorage.removeItem(key);
  };
}

function CookieStorage() {
  this.getItem = function (key, callback) {
    var result;
    $.each(document.cookie.split(";"), function (i, cook) {
      if (cook.split("=")[0] === key) result = unescape(cook.split("=")[1]);
    });
    if (callback)
      setTimeout(function () {
        callback(result);
      }, 0);
    return result;
  };

  this.setItem = function (key, value, callback) {
    document.cookie = key + "=" + escape(value);
    if (callback) setTimeout(callback, 0);
  };

  this.removeItem = function (key) {
    document.cookie = key + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
  };
}

function SqlStorage() {
  this.async = true;

  this.db = window.openDatabase("pq", "", "Progress Quest", 2500);

  this.db.transaction(function (tx) {
    tx.executeSql(
      "CREATE TABLE IF NOT EXISTS Storage(key TEXT UNIQUE, value TEXT)"
    );
  });

  this.getItem = function (key, callback) {
    this.db.transaction(function (tx) {
      tx.executeSql(
        "SELECT value FROM Storage WHERE key=?",
        [key],
        function (tx, rs) {
          if (rs.rows.length) callback(rs.rows.item(0).value);
          else callback();
        }
      );
    });
  };

  this.setItem = function (key, value, callback) {
    this.db.transaction(function (tx) {
      tx.executeSql(
        "INSERT OR REPLACE INTO Storage (key,value) VALUES (?,?)",
        [key, value],
        callback
      );
    });
  };

  this.removeItem = function (key) {
    this.db.transaction(function (tx) {
      tx.executeSql("DELETE FROM Storage WHERE key=?", [key]);
    });
  };
}

// URL encoding utility
function UrlEncode(s) {
  return encodeURIComponent(s).replace(/%20/g, "+");
}

// Device detection
var iPad = navigator.userAgent.match(/iPad/);
var iPod = navigator.userAgent.match(/iPod/);
var iPhone = navigator.userAgent.match(/iPhone/);
var iOS = iPad || iPod || iPhone;

// Storage initialization
var storage =
  window.localStorage && !iOS
    ? new LocalStorage()
    : window.openDatabase
    ? new SqlStorage()
    : new CookieStorage();

storage.loadRoster = function (callback) {
  function gotItem(value) {
    if (value) {
      try {
        value = JSON.parse(value);
      } catch (err) {
        // aight
      }
    }
    value = value || {};
    callback(value);
    storage.games = value;
  }
  this.getItem("roster", gotItem);
};

storage.loadSheet = function (name, callback) {
  return this.loadRoster(function (games) {
    if (callback) callback(games[name]);
  });
};

storage.storeRoster = function (roster, callback) {
  this.games = roster;
  try {
    this.setItem("roster", JSON.stringify(roster), callback);
  } catch (err) {
    if (err.toString().indexOf("QUOTA_EXCEEDED_ERR") != -1) {
      alert(
        "This browser lacks storage capacity to save this game. This game can continue but cannot be saved. (Mobile Safari, I'll wager?)"
      );
      this.storeRoster = function (roster, callback) {
        setTimeout(callback, 0);
      };
      setTimeout(callback, 0);
    } else {
      throw err;
    }
  }
};

storage.addToRoster = function (newguy, callback) {
  this.loadRoster(function (games) {
    games[newguy.Traits.Name] = newguy;
    storage.storeRoster(games, callback);
  });
};

// Number utility extension
Number.prototype.div = function (divisor) {
  var dividend = this / divisor;
  return (dividend < 0 ? Math.ceil : Math.floor)(dividend);
};

// Game utility functions
function LevelUpTime(level) {
  // seconds
  // 20 minutes for level 1
  // exponential increase after that
  return Math.round((20 + Math.pow(1.15, level)) * 60);
}
