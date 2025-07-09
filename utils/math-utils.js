// utils/math-utils.js
// Math utility functions for the game

function Min(a, b) {
  return a < b ? a : b;
}

function Max(a, b) {
  return a > b ? a : b;
}

function Abs(x) {
  if (x < 0) return -x;
  else return x;
}

function Square(x) {
  return x * x;
}

function StrToInt(s) {
  return parseInt(s, 10);
}

function IntToStr(i) {
  return i + "";
}

function StrToIntDef(s, def) {
  var result = parseInt(s, 10);
  return isNaN(result) ? def : result;
}

// Random utility functions that depend on Random() from utils.js
function Odds(chance, outof) {
  return Random(outof) < chance;
}

function RandSign() {
  return Random(2) * 2 - 1;
}

function RandomLow(below) {
  return Min(Random(below), Random(below));
}

function PickLow(s) {
  return s[RandomLow(s.length)];
}

