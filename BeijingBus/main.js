var path = "scripts/widget";

if ($app.env == $env.app ) {
    path = "scripts/app";
}

var module = require(path);
module.init();
