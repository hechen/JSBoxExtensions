// BeijingBus.js
// Beijing Public Transport

var index_url = "http://www.bjbus.com/home/index.php"
var main_url = "http://www.bjbus.com/home/ajax_rtbus_data.php"

var presetBuses = [{
    "name": "577 路",
    "num": "577"
  },
  {
    "name": "126 路",
    "num": "126"
  }
]

// useless for now. Prepare for future selection UI
function getBusCodeList() {
  $ui.loading(true)

  $console.info('Getting bus code from web...');

  $http.get({
    url: index_url,
    handler: function (resp) {
      $ui.loading(false)
      var status = resp.response.statusCode
      if (status != "200") {
        $ui.toast("Get Bus Code List Failed!");        
        return
      }

      var data = resp.data

      $console.info(data);
    }
  })
}

/// 获取某个车在某个方向上的站点信息
function getBusStations(bus_code, direction) {
  $ui.loading(true);

  console.info('Getting bus (' + bus_code + ') station on ' + 'direction: ' + direction + ' from web...')

  var busStationURL = main_url + '?act=' + 'getDirStationOption&selBLine=' + bus_code + '&selBDir=' + direction
  console.info(busStationURL)

  $http.get({
    url: busStationURL,
    handler: function (resp) {
      $ui.loading(false)

      var status = resp.response.statusCode
      if (status != "200") {
        $ui.toast("Get Bus Direction Failed! Try Later.");
        return
      }

      var data = resp.data

      $console.info(data)

      var stations = []
      var stationRegex = new RegExp('<option value="\\d*?">(.*?)<\/option>', 'g');
      var found;
      while ((found = stationRegex.exec(data)) != null) {
        // regex group
        stations.push(found[1]);
      }

      stations = stations.slice(1, stations.length - 1)

      $ui.toast("请选择上车站");
      $ui.menu({
        items: stations,
        handler: function (title, idx) {
          var station = stations[idx]

          $console.info("User select bus stop: " + station)

          getBusStatus(bus_code, direction, idx + 1)
        }
      });
    }
  });
}

// 查询某个车在某方向上和某站点之间的关系
function getBusStatus(bus_code, direction, station_no) {
  $ui.loading(true);

  console.info('Getting bus status from web...');

  // http://www.bjbus.com/home/ajax_rtbus_data.php?act=getLineDir&selBLine=577
  var busTimeURL = main_url + '?act=' + 'busTime&selBLine=' + bus_code + '&selBDir=' + direction + '&selBStop=' + station_no;
  $http.request({
    method: "GET",
    url: busTimeURL,
    handler: function (resp) {
      $ui.loading(false);

      var status = resp.response.statusCode
      if (status != "200") {
        $ui.alert({
          title: status,
          message: "Get Bus Status Failed!"
        })
        return
      }

      // 页面内容包含三部分： 1. w 2. html 3. seq
      var data = resp.data
      var html = data['html']

      $console.info(html)

      // JSBox 不支持 DOM，自行解析 HTML 文本
      /**
       *  <article>
          <p>静淑苑&nbsp;6:10-22:40&nbsp;分段计价&nbsp;所属客四分公司</p>
          <p>最近一辆车距离此还有&nbsp;0&nbsp;站，&nbsp;<span>0</span>&nbsp;米，预计到站时间&nbsp;<span>0</span>&nbsp;秒</p>
          </article>

          article 包含具体车辆和当前所选择站点之间的相对信息
       */
      var articleRegex = /<article>(.*)<\/article>/g
      var article = html.match(articleRegex)

      if (article.length == 0) {
        $console.error("Cannot find article section in HTML");
        return;
      }

      var article = article[0].replace(/&nbsp;/g, ' ').replace(/<span>/g, ' ').replace(/<\/span>/g, ' ')

      console.info(article);

      var paraRegex = new RegExp("<p>(.*?)<\/p>", "g")
      var found;
      var para = []
      while ((found = paraRegex.exec(article)) != null) {
        console.info(found)
        para.push(found[1])
      }
      console.info(para);

      // para[0] = 静淑苑&nbsp;6:10-22:40&nbsp;分段计价&nbsp;所属客四分公司
      // para[1] = 最近一辆车距离此还有&nbsp;0&nbsp;站，&nbsp;<span>0</span>&nbsp;米，预计到站时间&nbsp;<span>0</span>&nbsp;秒
      $ui.alert({
        title: para[0],
        message: para[1],
      });
    }
  })
}

/// 获取某个车次的方向代号，比如 二里庄-东北旺，东北旺-二里庄
function getBusDirections(bus_code) {
  $ui.loading(true);
  $http.get({
    // 'act': 'getLineDirOption',
    // 'selBLine': bus_code
    url: main_url + '?act=' + 'getLineDirOption&selBLine=' + bus_code,
    handler: function (resp) {
      $ui.loading(false);

      var data = resp.data;

      // parse direction text
      $console.info("Parsing direction data...");

      // direction_no = re.findall(, resp)
      var direction_no = []
      var pathNumberRegex = new RegExp('value="(\\d+)"', 'g');
      var found;
      while ((found = pathNumberRegex.exec(data)) != null) {
        console.log(found[1]);
        direction_no.push(found[1]);
      }

      // var direction_path = re.findall(str(bus_code) + '(.*?)<', resp)
      var pathRegex = new RegExp(bus_code + "(.*?)<", "g");
      var direction_path = []
      while ((found = pathRegex.exec(data)) != null) {
        console.log(found[1]);
        direction_path.push(found[1]);
      }

      // (东北旺中路-二里庄)
      // trim ( and )
      var data = []
      direction_path.forEach(function (element) {
        data.push(element.substr(1, element.length - 2))
      });

      // 显示方向菜单
      $ui.menu({
        items: data,
        handler: function (title, idx) {
          var directionID = direction_no[idx]
          getBusStations(bus_code, directionID)
        }
      });
    }
  });
}

// getBusCodeList()

$ui.menu({
  items: presetBuses.map(function (item) {
    return item.name
  }),
  handler: function (title, idx) {
    getBusDirections(presetBuses[idx].num)
  }
});