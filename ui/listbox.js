// ui/listbox.js
// ListBox component for game interface

function ListBox(id, columns, fixedkeys) {
  this.id = id;
  this.box = $("tbody#_, #_ tbody".replace(/_/g, id));
  this.columns = columns;
  this.fixedkeys = fixedkeys;

  this.AddUI = function (caption) {
    if (!this.box) return;
    var tr = $(
      "<tr><td><input type=checkbox disabled> " + caption + "</td></tr>"
    );
    tr.appendTo(this.box);
    tr.each(function () {
      this.scrollIntoView();
    });
    return tr;
  };

  this.ClearSelection = function () {
    if (this.box) this.box.find("tr").removeClass("selected");
  };

  this.PutUI = function (key, value) {
    if (!this.box) return;
    var item = this.rows().filter(function (index) {
      return Key(this) === key;
    });
    if (!item.length) {
      item = $("<tr><td>" + key + "</td><td/></tr>");
      this.box.append(item);
    }

    item.children().last().text(value);
    item.addClass("selected");
    item.each(function () {
      this.scrollIntoView();
    });
  };

  this.scrollToTop = function () {
    if (this.box) this.box.parents(".scroll").scrollTop(0);
  };

  this.rows = function () {
    return this.box.find("tr").has("td");
  };

  this.CheckAll = function (butlast) {
    if (this.box) {
      var checkboxes = butlast
        ? this.rows().find("input:checkbox").not(":last")
        : this.rows().find("input:checkbox");

      checkboxes.attr("checked", "true");

      // Add Windows 98 style completed class to parent rows
      checkboxes.each(function () {
        $(this).closest("tr").addClass("completed");
      });
    }
  };

  this.length = function () {
    return (this.fixedkeys || game[this.id]).length;
  };

  this.remove0 = function (n) {
    if (game[this.id]) game[this.id].shift();
    if (this.box) this.box.find("tr").first().remove();
  };

  this.remove1 = function (n) {
    var t = game[this.id].shift();
    game[this.id].shift();
    game[this.id].unshift(t);
    if (this.box) this.box.find("tr").eq(1).remove();
  };

  this.load = function (game) {
    var that = this;
    var dict = game[this.id];
    if (this.fixedkeys) {
      $.each(this.fixedkeys, function (index, key) {
        that.PutUI(key, dict[key]);
      });
    } else {
      $.each(dict, function (index, row) {
        if (that.columns == 2) that.PutUI(row[0], row[1]);
        else that.AddUI(row);
      });
    }
  };

  this.label = function (n) {
    return this.fixedkeys ? this.fixedkeys[n] : game[this.id][n][0];
  };
}