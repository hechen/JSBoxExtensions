String.prototype.extract_nearest_content = function (start) {

    if (start == -1) {
        return "";
    }

    var property_begin = this.indexOf("content=\"", start);    
    if (property_begin != -1) {
        property_begin = property_begin + "content=\"".length;
    }
    var property_end = this.indexOf("\">", property_begin);

    var content = this.substr(property_begin, property_end - property_begin);
    return content;
};

String.prototype.replaceEncoding = function() {
    return this.replace("&amp;", "&").replace("&#39;", "\'").replace("", "");
};

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

/// Check Pocketcast Link
String.prototype.isPocketcastURL = function () {
    return this.indexOf("pca.st") != -1;
};

if (!link.isPocketcastURL()) {
    $ui.alert({
        title: "链接不是合法的 Pocketcast 链接",
        message: "",
    });

    return;
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

// parse title
var title = data.extract_nearest_content(data.indexOf("og:title")).replaceEncoding();
console.log(title);

// parse album image
// og:image        
var img_url = data.extract_nearest_content(data.indexOf("og:image:secure_url"));
var img_resp = await $http.get(encodeURI(img_url));
var img_data = img_resp.rawData;
$clipboard.image = img_data;

// parse excert
var desc = data.extract_nearest_content(data.indexOf("og:description")).replaceEncoding();

// create time 
var episode_date_regex = /"episode_date\">(.+)<\/div>/;
var episode_date_group = episode_date_regex.exec(data);
console.log(episode_date_group[1]);

$ui.loading(false);


// dayone://post?entry=Hello Self&journal=Day One
var journal = title + "\n\n";
journal += "Release Date: " + episode_date_group[1] + "\n";
journal += "***\n" + desc + "\n***\n";
journal += "[" + title + "]" + "(" + link + ")";


var scheme = "dayone://post?entry=";
scheme += journal;
scheme += "&tags=pocketcast";
scheme += "&tags=pocketcast";
scheme += "&imageClipboard=1";

console.log(scheme);

$app.openURL(encodeURI(scheme));
