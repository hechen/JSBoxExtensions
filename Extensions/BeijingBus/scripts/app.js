var api = require("./api");
var dataManager = require("./data");

var directionMaps = {};

/// Search Button
var searchButton = {
  type: "button",
  props: {
    id: "searchButton",
    title: "点击搜索公交路线",
  },
  layout: function (make, view) {
    make.height.equalTo(33);
    make.right.inset(55);
    make.top.left.inset(12);
  },
  events: {
    tapped: function (sender) {
      $input.text({
        type: $kbType.search,
        placeholder: "eg.577",
        handler: function (text) {
          showDirectionList(text);
        }
      });
    }
  }
};

var list = {
  type: "list",
  props: {},
  layout: function (make, view) {
    make.top.equalTo($("searchButton").bottom);
    make.left.right.equalTo(0);
    make.bottom.equalTo(-5);
  },
  events: {
    didSelect: function (sender, indexPath, object) {
      fetchBusDirectionInfo(object, indexPath.row);
    },
  }
};

// User select one line
function fetchBusDirectionInfo(object, index) {
  $ui.loading(true);
  showDirectionList(object);
}

/// 直接传入车次
function showDirectionList(bus) {
  /// 获取该车次对应的方向列表，Key 为车次名称，Value 为车次代号
  api.getBusDirections(bus, function (directions) {
    directionMaps = directions;

    $console.info(directions);

    var lines = require("./lines");
    lines.show(bus, directions, {

    });
  });
}

function reloadBusList() {
  $ui.loading(true);

  console.log("reload bus list.")
  

  // get cached bus list.
  var bus_list = dataManager.get_bus_list;

  console.log("get cached bus list. ");

  var current_date = new Date();
  var time = current_date.getTime();

  // no cache or cache is overtime.
  // timeout threshold is 1 day.
  if (bus_list == null || (time - bus_list.time) >= 24 * 3600 * 1000) {
    api.getBusCodeList(function (bus_list) {
      $ui.loading(false);

      $("list").data = bus_list;
      dataManager.save_bus_list(bus_list);
    });
    return;
  }

  $ui.loading(false);
  $("list").data = bus_list.bus_list;
}

function init() {
  $ui.render({
    props: {
      title: "北京公交"
    },
    views: [searchButton, list]
  });
  reloadBusList();
}

module.exports = {
  init: init
};