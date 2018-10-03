let back_home_cache_key = "back_home_cache_key";
let go_work_cache_key = "go_work_cache_key";
let bus_list_cache_key = "bus_list_cache_key";

var get_bus_list = $cache.get(bus_list_cache_key);
function save_bus_list(bus_list) {
    var current_date = new Date();
    var time = current_date.getTime();
    $cache.set(bus_list_cache_key, {
        "time" : time,
        "bus_list": bus_list
    });
}

var back_home_bus_info = $cache.get(back_home_cache_key);
function save_backhome_bus(bus_code, bus_name, direction_code, station_id) {
    $cache.set(back_home_cache_key, {
        "bus_code": bus_code,
        "bus_name": bus_name,
        "direction_code": direction_code,
        "station_id": station_id,
    });
}

var go_work_bus_info = $cache.get(go_work_cache_key);
function save_gowork_bus(bus_code, bus_name, direction_code, station_id) {
    $cache.set(go_work_cache_key, {
        "bus_code": bus_code,
        "bus_name": bus_name,
        "direction_code": direction_code,
        "station_id": station_id,
    });
}

module.exports = {
    save_bus_list: save_bus_list,
    get_bus_list: get_bus_list,
    save_backhome_bus: save_backhome_bus,
    save_gowork_bus: save_gowork_bus,
    go_work_bus_info: go_work_bus_info,
    back_home_bus_info: back_home_bus_info,
};