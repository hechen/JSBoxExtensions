var api = require("./api");
var dataManager = require("./data");

var mHandlers = {};

// 记录当前 Bus 朝向的变量
var DIRECTION_TYPE = {
    DOWNLOAD: 0,
    UP: 1
};
var direction_Type = DIRECTION_TYPE.DOWNLOAD;
var directionMap = {};
var bus_code;

/// 顶部使用双向路线展示
var tabView = {
    type: "tab",
    props: {
        id: "tabView",
        items: ["Down", "Up"]
    },
    layout: function (make, view) {
        make.centerX.equalTo(view.super);
        make.width.equalTo(view.super).multipliedBy(0.5);
        make.top.inset(8);
        make.height.equalTo(28);
    },
    events: {
        changed: function (sender) {
            setListViewType(sender.index);
        }
    }
};

/// 具体路线名称
var label = {
  type: "label",
  props: {
    id: "direction_label",    
  },
  layout: function(make, view) {
    make.centerX.equalTo(view.super.centerX);
    make.top.equalTo($("tabView").bottom).equalTo(10);
  }
}

/// 站点信息
var list = {
    type: "list",
    id: "station_list",
    props: {
        rowHeight: 55.0,
        template: [{
                type: "label",
                props: {
                    id: "station_label",
                    font: $font("bold", 18),
                    lines: 1
                },
                layout: function (make, view) {
                    make.left.inset(10);
                    make.centerY.equalTo(view.super);
                }
            },
            {
                type: "label",
                props: {
                    id: "status_label",
                    font: $font(13),
                    textColor: $color("red")
                }
            }
        ],
        actions: [{
                title: "上班",
                color: $color("#FF2D55"),
                handler: function (sender, indexPath) {
                    // persist work selection.

                    var keys = Object.keys(directionMap);
                    var direction = keys[direction_Type];
                    var direction_code = directionMap[direction];

                    var station_code = indexPath.row + 1;
                    
                    dataManager.save_gowork_bus(bus_code, bus_code, direction_code, station_code);
                    
                    $ui.toast("保存上班公交信息成功！");
                }
            },
            {
                title: "回家",
                color: $color("#157EFB"),
                handler: function (sender, indexPath) {
                    // persist home selection.
                    var keys = Object.keys(directionMap);
                    var direction = keys[direction_Type];
                    var direction_code = directionMap[direction];

                    var station_code = indexPath.row + 1;
                    dataManager.save_backhome_bus(bus_code, bus_code, direction_code, station_code);
                    
                    $ui.toast("保存回家公交信息成功！");
                }
            },
        ]
    },
    layout: function (make, view) {
        make.top.equalTo($("direction_label").bottom).inset(10);
        make.left.right.equalTo(view.super);
        make.bottom.equalTo(view.super).inset(5);
    },
    events: {
        didSelect: function (sender, indexPath) {
            console.log(indexPath.row);

            var station_code = indexPath.row + 1;

            var keys = Object.keys(directionMap);
            var direction = keys[direction_Type];
            var direction_code = directionMap[direction];

            // station index: from 1
            api.getBusStatus(bus_code, direction_code, station_code, function (title, message, bus_info) {
                $ui.alert({
                    title: title,
                    message: message,
                });

                $console.info(bus_info);
            });
        }
    }
};

// 切换了路线方向，Reload 数据源
function setListViewType(bus_direction) {
    direction_Type = bus_direction;
    
    var keys = Object.keys(directionMap);
    var direction = keys[direction_Type];
    $("direction_label").text = direction;
    
    reload_list();
}

function reload_list() {
    // bus
    // direction

    var keys = Object.keys(directionMap);
    var direction = keys[direction_Type];
    var direction_code = directionMap[direction];

    $console.info(direction);

    var data = [];

    api.getBusStations(bus_code, direction_code, function (stations) {
        $console.info(stations);

        for (var idx in stations) {
            var station = stations[idx];
            data.push({
                station_label: {
                    text: station
                },
                status_label: {
                    text: "Hello"
                }
            });
        }

        $("list").data = data;
    });
}



/// 传入 bus 以及方向列表，按照当前选择的上行或者下行显示公交车站点信息
function show(bus, directions, handlers) {
    directionMap = directions;
    bus_code = bus;
    mHandlers = handlers;

    $ui.push({
        props: {
            title: bus + " 路线详情"
        },
        views: [tabView, label, list]
    });

    setListViewType(DIRECTION_TYPE.DOWNLOAD);
}


module.exports = {
    show: show
}
