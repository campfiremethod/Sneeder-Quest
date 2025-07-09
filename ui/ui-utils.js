// ui/ui-utils.js
// UI utility functions for table row manipulation

function Key(tr) {
  return $(tr).children().first().text();
}

function Value(tr) {
  return $(tr).children().last().text();
}