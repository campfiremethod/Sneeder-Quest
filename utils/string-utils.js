// utils/string-utils.js
// String manipulation and formatting utilities

function Copy(s, b, l) {
  return s.substr(b - 1, l);
}

function Length(s) {
  return s.length;
}

function Starts(s, pre) {
  return 0 === s.indexOf(pre);
}

function Ends(s, e) {
  return Copy(s, 1 + Length(s) - Length(e), Length(e)) == e;
}

function Pos(needle, haystack) {
  return haystack.indexOf(needle) + 1;
}

function LowerCase(s) {
  return s.toLowerCase();
}

function ProperCase(s) {
  return Copy(s, 1, 1).toUpperCase() + Copy(s, 2, 10000);
}

function Split(s, field, separator) {
  return s.split(separator || "|")[field];
}

function Plural(s) {
  if (Ends(s, "y")) return Copy(s, 1, Length(s) - 1) + "ies";
  else if (Ends(s, "us")) return Copy(s, 1, Length(s) - 2) + "i";
  else if (Ends(s, "ch") || Ends(s, "x") || Ends(s, "s") || Ends(s, "sh"))
    return s + "es";
  else if (Ends(s, "f")) return Copy(s, 1, Length(s) - 1) + "ves";
  else if (Ends(s, "man") || Ends(s, "Man"))
    return Copy(s, 1, Length(s) - 2) + "en";
  else return s + "s";
}

function Indefinite(s, qty) {
  // Safety check: ensure s is a valid string
  if (!s || typeof s !== 'string') {
    console.error("Indefinite function called with invalid string:", s, "qty:", qty);
    return qty == 1 ? "a thing" : IntToStr(qty) + " things";
  }
  
  if (qty == 1) {
    if (Pos(s.charAt(0), "AEIOUÜaeiouü") > 0) return "an " + s;
    else return "a " + s;
  } else {
    return IntToStr(qty) + " " + Plural(s);
  }
}

function Definite(s, qty) {
  if (qty > 1) s = Plural(s);
  return "the " + s;
}

function prefix(a, m, s, sep) {
  if (sep == undefined) sep = " ";
  m = Abs(m);
  if (m < 1 || m > a.length) return s; // In case of screwups
  return a[m - 1] + sep + s;
}