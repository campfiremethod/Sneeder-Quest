// utils.js
// Core utility functions for Progress Quest

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

// URL encoding utility
function UrlEncode(s) {
  return encodeURIComponent(s).replace(/%20/g, "+");
}

// Device detection
var iPad = navigator.userAgent.match(/iPad/);
var iPod = navigator.userAgent.match(/iPod/);
var iPhone = navigator.userAgent.match(/iPhone/);
var iOS = iPad || iPod || iPhone;

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

// General array utility (depends on Random() from math-utils.js)
function Pick(a) {
  return a[Random(a.length)];
}