/*
 BeijingBus.js

 Data From Beijing Public Transport

 该文件提供所有接口
 */
var index_url = "http://www.bjbus.com/home/index.php";
var main_url = "http://www.bjbus.com/home/ajax_rtbus_data.php";

/// 获取公交车车次列表
function getBusCodeList(callback) {
    $ui.loading(true);

    $console.info('Getting bus code from web...');

    $http.get({
        url: encodeURI(index_url),
        handler: function (resp) {
            $ui.loading(false);

            var status = resp.response.statusCode;
            if (status != "200") {
                $ui.toast("Get Bus Code List Failed!");
                return;
            }

            var data = resp.data;

            var regEx = new RegExp("<dd id=\"selBLine\">([\\s\\S]*?)<\/dd>", "g");
            var found = regEx.exec(data);

            if (found == null) {
                $console.error("Cannot parse Bus Code List!");
                return;
            }

            var bus_code_str = found[1];
            bus_code_str = bus_code_str.replace(/^\s+|\s+$/g, '').replace(/<a href="javascript:;">/g, '');

            $console.info(bus_code_str);

            // slipt all bus code
            var bus_codes = bus_code_str.split('</a>');

            // trim last empty element
            bus_codes = bus_codes.slice(0, bus_codes.length - 1);

            callback(bus_codes);
        }
    });
}

/// 获取某个车次的方向代号，比如 二里庄-东北旺，东北旺-二里庄
function getBusDirections(bus_code, callback) {

    $ui.loading(true);

    var url = main_url + '?act=' + 'getLineDirOption&selBLine=' + bus_code;

    console.log("fetch bus direction info, bus: " + bus_code)

    $http.get({
        // 'act': 'getLineDirOption',
        // 'selBLine': bus_code
        url: encodeURI(url),
        handler: function (resp) {
            $ui.loading(false);

            var data = resp.data;

            // direction_no = re.findall(, resp)
            var direction_no = [];
            var pathNumberRegex = new RegExp('value="(\\d+)"', 'g');
            var found;
            while ((found = pathNumberRegex.exec(data)) != null) {
                var direction_id = found[1];
                console.log(direction_id);
                direction_no.push(direction_id);
            }

            $console.info("Parsing direction name....");
            // var direction_path = re.findall(str(bus_code) + '(.*?)<', resp)
            var pathRegex = new RegExp(">" + bus_code + "(.*?)<", "g");
            var direction_path = [];
            while ((found = pathRegex.exec(data)) != null) {
                var path = found[1];

                console.log(path);
                direction_path.push(path);
            }

            // (东北旺中路-二里庄)
            // trim ( and )
            var data = [];
            direction_path.forEach(function (element) {
                data.push(element.substr(1, element.length - 2))
            });

            $console.info(data);

            var directions = {};
            for (var i = 0; i < direction_no.length; i++) {
                directions[data[i]] = direction_no[i];
            }
            callback(directions);
        }
    });
}

/// 获取某个车在某个方向上的站点信息
function getBusStations(bus_code, direction, callback) {
    $ui.loading(true);

    var busStationURL = main_url + '?act=' + 'getDirStationOption&selBLine=' + bus_code + '&selBDir=' + direction;

    $http.get({
        url: encodeURI(busStationURL),
        handler: function (resp) {
            $ui.loading(false);

            var status = resp.response.statusCode;
            if (status != "200") {
                $ui.toast("Get Bus Direction Failed! Try Later.");
                return;
            }

            var data = resp.data;

            var stations = [];
            var stationRegex = new RegExp('<option value="\\d*?">(.*?)<\/option>', 'g');
            var found;
            while ((found = stationRegex.exec(data)) != null) {
                // regex group
                stations.push(found[1]);
            }

            stations = stations.slice(1, stations.length - 1);

            callback(stations);
        }
    });
}

// 查询某个车在某方向上和某站点之间的关系
function getBusStatus(bus_code, direction, station_no, callback) {
    $ui.loading(true);

    // http://www.bjbus.com/home/ajax_rtbus_data.php?act=getLineDir&selBLine=577
    var busTimeURL = main_url + '?act=' + 'busTime&selBLine=' + bus_code + '&selBDir=' + direction + '&selBStop=' + station_no;
    $http.request({
        method: "GET",
        url: encodeURI(busTimeURL),
        handler: function (resp) {
            $ui.loading(false);

            var status = resp.response.statusCode;
            if (status != "200") {
                $ui.alert({
                    title: status,
                    message: "Get Bus Status Failed!"
                });
                return;
            }

            // 页面内容包含三部分： 1. w 2. html 3. seq
            var data = resp.data;
            var html = data.html;

            // 自行解析 HTML 文本
            /**
             *  <article>
                <p>静淑苑&nbsp;6:10-22:40&nbsp;分段计价&nbsp;所属客四分公司</p>
                <p>最近一辆车距离此还有&nbsp;0&nbsp;站，&nbsp;<span>0</span>&nbsp;米，预计到站时间&nbsp;<span>0</span>&nbsp;秒</p>
                </article>

                article 包含具体车辆和当前所选择站点之间的相对信息
             */
            var articleRegex = /<article>(.*)<\/article>/g;
            var articleHTML = html.match(articleRegex);
            if (articleHTML.length == 0) {
                $console.error("Cannot find article section in HTML");
                return;
            }
            console.info(articleHTML[0]);

            // We replace all spaces.
            // Actually we can extract every seperated info.
            var article = articleHTML[0].replace(/&nbsp;/g, ' ').replace(/<span>/g, ' ').replace(/<\/span>/g, ' ');
            var paraRegex = new RegExp("<p>(.*?)<\/p>", "g");
            var found;
            var busStatus = [];
            while ((found = paraRegex.exec(article)) != null) {
                busStatus.push(found[1]);
            }

            var bus_property = busStatus[0];
            var last_bus_info = busStatus[1];

            // 实际上就是解析出所有带 clstag 属性的 <i></i> 标签
            var bus_positions = [];

            // <div id=\"11m\"><i class=\"busc\" clstag=\"4283\"></i></div>\n"
            var index_clstag = html.indexOf("clstag=");
            while (index_clstag != -1) {
                // substr
                var index_clstag_end = html.indexOf("></i>", index_clstag + 1);
                var index_clstag_start = index_clstag + "clstag=".length;

                var distance = html.substr(index_clstag_start, index_clstag_end - index_clstag_start).replace(/['"]+/g, '');

                var bus_info = {};
                bus_info.distance = distance;

                // and trace back the div tag
                var index_div_start = html.lastIndexOf("<div ", index_clstag);
                if (index_div_start != -1) {
                    var index_div_end = html.indexOf("><i", index_div_start);
                    var div_str = html.substr(index_div_start + "<div ".length, index_div_end - index_div_start - "<div ".length);
                    var station_id = div_str.replace("id=", "").replace(/['"]+/g, '');

                    // id 部分有可能有 m，表示该车在两站之间的途中
                    bus_info.station_id = station_id.replace("m", "");
                    // # 如果id 不带 m，说明公交车离车站较近，near_station 为 True
                    bus_info.near_station = (station_id.indexOf("m") === -1);
                    bus_positions.push(bus_info);
                }

                index_clstag = html.indexOf("clstag=", index_clstag + 1);
            }

            callback(bus_property, last_bus_info, bus_positions);
        }
    });
}

module.exports = {
    getBusCodeList: getBusCodeList,
    getBusDirections: getBusDirections,
    getBusStations: getBusStations,
    getBusStatus: getBusStatus
};