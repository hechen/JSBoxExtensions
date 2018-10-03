var api = require("./api");
var dataManager = require("./data");


/* 容器，主要布局如下, 内部三元素均为 Label：
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
                                           
│ ┌ ─ ─ ─ ─ ┐   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
                                           
│ │         │   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
                ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  
│ └ ─ ─ ─ ─ ┘    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
                                           
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
*/
var home_views = [{
    type: "label",
    props: {
      id: "home_title",
      text: "🏠",
      font: $font("bold", 21),
      textColor: $color("black"),
    },
    layout: function (make, view) {
      make.left.equalTo(20);
      make.centerY.equalTo(view.super.centerY);
    }
  },
  {
    type: "view",
    props: {
      id: "home_line",
      bgcolor: $color("lightGray")
    },
    layout: function (make, view) {
      make.left.equalTo(view.super.left).inset(60);
      make.centerY.equalTo(view.super.centerY);
      make.height.equalTo(80);
      make.width.equalTo(1);
    }
  },
  {
    type: "view",
    props: {
      id: "home_container",
    },
    layout: function (make, view) {
      make.left.equalTo($("home_line").right).inset(20);
      make.right.equalTo(view.super.right).inset(10);
      make.centerY.equalTo(view.super.centerY);      
      make.top.greaterThanOrEqualTo(view.super.top);
      make.bottom.lessThanOrEqualTo(view.super.bottom);
    },
    views: [
      {
        type: "label",
        props: {
          id: "home_status_title",
          font: $font(16),
          lines: 2,
        },
        layout: function (make, view) {      
          make.top.equalTo(view.super);
          make.left.equalTo(view.super.left);
          make.right.equalTo(view.super).inset(5);          
        }
      },
      {
        type: "label",
        props: {
          id: "home_status_message",
          font: $font(15),
          lines: 2,
        },
        layout: function (make, view) {
          make.top.equalTo($("home_status_title").bottom).offset(10);
          make.left.equalTo(view.super.left);
          make.right.equalTo(view.super).inset(5);
          make.bottom.equalTo(view.super);
        }
      }
    ]
  }
];

function createHomeView(id, layout) {
  return {
    type: "view",
    props: {
      id: id,
    },
    views: home_views,
    layout: layout,
  };
}


var work_views = [{
    type: "label",
    props: {
      id: "work_title",
      text: "💼",
      font: $font("bold", 21),
    },
    layout: function (make, view) {
      make.left.equalTo(20);
      make.centerY.equalTo(view.super.centerY);
    }
  },
  {
    type: "view",
    props: {
      id: "work_line",
      bgcolor: $color("lightGray")
    },
    layout: function (make, view) {
      make.left.equalTo(view.super.left).inset(60);
      make.centerY.equalTo(view.super.centerY);
      make.height.equalTo(80);
      make.width.equalTo(1);
    }
  },
  {
    type: "view",
    props: {
      id: "work_container",
    },
    layout: function (make, view) {
      make.left.equalTo($("work_line").right).inset(20);
      make.right.equalTo(view.super.right).inset(10);
      make.centerY.equalTo(view.super.centerY);      
      make.top.greaterThanOrEqualTo(view.super.top);
      make.bottom.lessThanOrEqualTo(view.super.bottom);
    },
    views: [
      {
        type: "label",
        props: {
          id: "work_status_title",
          font: $font(16),
          lines: 2,
        },
        layout: function (make, view) {      
          make.top.equalTo(view.super);
          make.left.equalTo(view.super.left);
          make.right.equalTo(view.super).inset(5);          
        }
      },
      {
        type: "label",
        props: {
          id: "work_status_message",
          font: $font(15),
          lines: 2,
        },
        layout: function (make, view) {
          make.top.equalTo($("work_status_title").bottom).offset(10);
          make.left.equalTo(view.super.left);
          make.right.equalTo(view.super).inset(5);
          make.bottom.equalTo(view.super);
        }
      }
    ]
  }
];

function createWorkView(id, layout) {
  return {
    type: "view",
    props: {
      id: id,
    },
    views: work_views,
    layout: layout,
  };
}

/// 上下结构，第一个为回家路线，第二个为上班路线
var views = [
  createHomeView("home", function (make, view) {
    make.top.left.right.equalTo(0);
    make.height.equalTo(110);
  }),
  createWorkView("work", function (make, view) {
    make.left.right.equalTo(0);
    make.top.equalTo($("home").bottom);
    make.height.equalTo(110);
    make.bottom.equalTo(0);
  })
];

function render_today() {
  $ui.render({
    props: {
      id: "widget",
      title: "Beijing Bus"
    },
    views: views
  });
}

/// 获取回家的 Model，默认值目前在代码中设置
function requestHomeCar() {
  var bus_info = dataManager.back_home_bus_info;

  if (bus_info == null) {

    $("home_status_title").text = "还未进行回家公交信息的配置";
    $("home_status_message").text = "请打开主 App，搜索对应的公交信息以标记";

    return;
  }

  api.getBusStatus(bus_info.bus_code, bus_info.direction_code, bus_info.station_id, function (title, message, bus_info) {

    $console.info("Request Home Bus Done:");
    $console.info(title);
    $console.info(message);

    $("home_status_title").text = title;
    $("home_status_message").text = message;
  });
}

/// 获取去上班的 Model，默认值保存在代码文件中
function requestWorkCar() {
  var bus_info = dataManager.go_work_bus_info;

  if (bus_info == null) {

    $("work_status_title").text = "还未进行上班公交信息的配置";
    $("work_status_message").text = "请打开主 App，搜索对应的公交信息以标记";

    return;
  }

  api.getBusStatus(bus_info.bus_code, bus_info.direction_code, bus_info.station_id, function (title, message, bus_info) {
    $console.info("Request Work Bus Done:");
    $console.info(title);
    $console.info(message);

    $("work_status_title").text = title;
    $("work_status_message").text = message;
  });
}

/// 取保存的数据
function prepare_data() {
  requestHomeCar();
  requestWorkCar();
}

// Widget 初始化
function init() {
  render_today();
  prepare_data();
}

module.exports = {
  init: init
};