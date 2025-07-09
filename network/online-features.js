// network/online-features.js
// Online multiplayer and network communication functions

// Import required utility functions from other modules
// These functions need to be available globally or imported:
// - IntToStr() from utils/math-utils.js
// - RevString from config.js (global variable)

// Utility functions needed for network operations
function UrlEncode(s) {
  return encodeURIComponent(s).replace(/%20/g, "+");
}

function LowerCase(s) {
  return s.toLowerCase();
}

function Split(s, field, separator) {
  return s.split(separator || "|")[field];
}

// Cryptographic/validation functions
function LFSR(pt, salt) {
  var result = salt;
  for (var k = 0; k < pt.length; ++k)
    result =
      (result << 1) ^ (1 & ((result >> 31) ^ (result >> 5))) ^ pt.charCodeAt(k);
  for (var kk = 0; kk < 10; ++kk)
    result = (result << 1) ^ (1 & ((result >> 31) ^ (result >> 5)));
  return result;
}

function StandardizeUrl(url) {
  // This fixes some special characters. jQuery is going to do this anyway so
  // we need it standardized before we compute a validator.
  let a = document.createElement("a");
  a.href = url;
  return a.href;
  // TODO we could probably remove all those UrlEncode's before this is called
}

function Validator(url) {
  url = url.substr(url.indexOf("cmd="));
  return IntToStr(LFSR(url, game.online.passkey));
}

// Main online multiplayer functions
function Brag(trigger, andSeeIt) {
  SaveGame();

  if (game.online) {
    // game.bragtrigger = trigger;
    // $.post("webrag.php", game, function (data, textStatus, request) {
    //   if (data.alert)
    //     alert(data.alert);
    // }, "json");

    let url = game.online.host + "cmd=b&t=" + trigger;
    for (trait in game.Traits) {
      url +=
        "&" +
        LowerCase(trait.substr(0, 1)) +
        "=" +
        UrlEncode(game.Traits[trait]);
    }
    url += "&x=" + IntToStr(ExpBar.Position());
    url += "&i=" + UrlEncode(game.bestequip);
    url += "&z=" + UrlEncode(game.bestskill);
    url += "&k=" + UrlEncode(game.beststat);

    url += "&a=" + UrlEncode(game.bestplot);
    url += "&h=" + UrlEncode(game.online.realm);
    url += RevString;
    url = StandardizeUrl(url);
    url += "&p=" + Validator(url);
    url += "&m=" + UrlEncode(game.motto || "");

    $.ajax(url).then((body) => {
      if (LowerCase(Split(body, 0)) == "report") {
        alert(Split(body, 1));
      } else if (andSeeIt) {
        Navigate(game.online.host + "name=" + UrlEncode(Get(Traits, "Name")));
      }
    });
  }
}

function Guildify(guild) {
  if (!game.online) return;
  if (guild === null) return; // input box cancelled

  game.guild = guild;

  let url = game.online.host + "cmd=guild";
  for (trait in game.Traits) {
    url +=
      "&" + LowerCase(trait.substr(0, 1)) + "=" + UrlEncode(game.Traits[trait]);
  }
  url += "&h=" + UrlEncode(game.online.realm);
  url += RevString;
  url += "&guild=" + UrlEncode(game.guild);
  url = StandardizeUrl(url);
  url += "&p=" + Validator(url);

  $.ajax(url).then((body) => {
    let parts = body.split("|");
    let s = parts.shift();
    if (s) alert(s);
    s = parts.shift();
    if (s) Navigate(s);
  });
}

function Navigate(url) {
  window.open(url);
}

