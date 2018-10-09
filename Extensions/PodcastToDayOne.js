String.prototype.extract_nearest_content = function (start) {
    if (start == -1) {
        return "";
    }

    var property_begin = this.indexOf("content=\"", start);
    var property_end = this.indexOf("\"", property_begin + "content=\"".length);
    if (property_begin != -1) {
        property_begin = property_begin + "content=\"".length;
    }

    var content = this.substr(property_begin, property_end - property_begin);
    return content;
};

// https://overcast.fm/+GXVmuQ0C8
String.prototype.isOvercastURL = function () {
    return this.indexOf("overcast.fm") != -1;
};

// https://castro.fm/episode/Ai3Gf0
String.prototype.isCastroURL = function () {
    return this.indexOf("castro.fm") != -1;
};

// https://pca.st/episode/f271fb37-eb9c-420d-b0e4-9ead2c29960a
String.prototype.isPocketcastURL = function () {
    return this.indexOf("pca.st") != -1;
};

// Decode HTML Characters
String.prototype.replaceEncoding = function () {
    return this.replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "-")
    .replace(/&rsquo;/g, "’")
    .replace(/&hellip;/g, "...")
    .replace(/&rdquo;/g, "\”")
    .replace(/&ldquo;/g, "\“");
};

/// Link from Action Extension or Clipboard.
var link = $context.link;
if (link == null) {
    link = $clipboard.link;
    if (link == null) {
        $ui.alert({
            title: "请通过 Safari Extension 或者剪贴板分享链接",
            message: "",
        });
        return;
    }
}

function extract_title(data) {
    var title = data.extract_nearest_content(data.indexOf("og:title")).replaceEncoding();
    console.log(title);
    return title;
}

async function extract_image(data) {
    var img_url = data.extract_nearest_content(data.indexOf("og:image")).replaceEncoding();
    console.log(img_url);

    var img_resp = await $http.get(img_url);
    var img_data = img_resp.rawData;

    // dayone image transfer using clipboard.
    $clipboard.image = img_data;

    return img_url;
}

function extract_desc(data) {
    var desc = data.extract_nearest_content(data.indexOf("og:description")).replaceEncoding();
    console.log(desc);
    return desc;
}

function extract_appscheme(data) {
    var app_scheme_arg = "app-argument=";
    var section_begin = data.indexOf(app_scheme_arg);
    if (section_begin == -1) {
        return "";
    }

    section_begin = section_begin + app_scheme_arg.length;

    /*
    // Castro
      <meta name="apple-itunes-app" content="app-id=1080840241, 
      affiliate-data=11lLuB, app-argument=https://castro.fm/episode/Ai3Gf0">

    // Overcast
      <meta name="apple-itunes-app" content="app-id=888422857,
       app-argument=overcast:///447871995056601, affiliate-data=at=11lIuy&amp;ct=smart_banner"/>
     */
    var section_end = section_begin;
    if (data.indexOf("overcast", section_begin) != -1) {
        section_end = data.indexOf(",", section_begin);
    } else if (data.indexOf("castro", section_begin) != -1) {
        section_end = data.indexOf("\"", section_begin);
    } else {
        return "";
    }

    var scheme_section = data.substr(section_begin, section_end - section_begin);
    console.log(scheme_section);
    return scheme_section;
}



$ui.loading(true);

var resp = await $http.get(encodeURI(link));
var data = resp.data;
if (data == null || resp.response.statusCode != 200) {
    $ui.loading(false);

    $ui.alert({
        title: "链接无法获取内容",
        message: "",
    });
    return;
}
console.log(data);

var title = extract_title(data);
var journal = title + "\n\n";

var img_url = await extract_image(data);

var desc = extract_desc(data);
journal += "***\n" + desc + "\n***\n\n";
journal += "[" + title + "]" + "(" + link + ")\n\n\n";

var app_arg = extract_appscheme(data);
if (app_arg.length > 0) {
    journal += "[Open In App](" + app_arg + ")";
}

// image
journal += "&imageClipboard=1";

// tags
journal += "&tags=podcast";
if (link.isOvercastURL()) {
    journal += ",overcast";
} else if (link.isPocketcastURL()) {
    journal += ",pocketcast";
} else if (link.isCastroURL()) {
    journal += ",castro";
}

console.log(journal);

$ui.loading(false);

// dayone://post?entry=Hello Self&journal=Day One
$app.openURL(encodeURI("dayone://post?entry=" + journal));