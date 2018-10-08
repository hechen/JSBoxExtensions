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

/// Check Overcast Link
String.prototype.isOvercastURL = function() {
    return this.indexOf("overcast.fm") != -1;
};

String.prototype.replaceEncoding = function() {
    return this.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&mdash;/g, "-").replace(/&rsquo;/g, "’").replace(/&hellip;/g, "...");
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

if (!link.isOvercastURL()) {
    $ui.alert({
        title: "链接不是合法的 Overcast 链接",
        message: "",
    });

    return;
}

$ui.loading(true);

console.log(link);

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

$ui.loading(false);

// // parse title
var title = data.extract_nearest_content(data.indexOf("og:title")).replaceEncoding();
console.log(title);

// // parse album image
// // og:image 
var img_url = data.extract_nearest_content(data.indexOf("og:image"));
console.log(img_url);
img_url = img_url.replaceEncoding();
console.log(img_url);

var img_resp = await $http.get(img_url);
var img_data = img_resp.rawData;
$clipboard.image = img_data;

// // parse excert
var desc = data.extract_nearest_content(data.indexOf("og:description")).replaceEncoding();
console.log(desc);

var overcast_app_scheme = "app-argument=";
var section_begin = data.indexOf(overcast_app_scheme);
var scheme_begin = section_begin + overcast_app_scheme.length;
var section_end = data.indexOf(",", scheme_begin);
var scheme_section = data.substr(scheme_begin, section_end - scheme_begin);
console.log(scheme_section);

$ui.loading(false);


// dayone://post?entry=Hello Self&journal=Day One
var journal = title + "\n\n";
journal += "***\n" + desc + "\n***\n";
journal += "[" + title + "]" + "(" + link + ")\n\n\n";
journal += "[Open In Overcast](" + scheme_section + ")";
journal += "&tags=overcast";
journal += "&imageClipboard=1";
$app.openURL(encodeURI("dayone://post?entry=" + journal));