var toDownload = 0;
var success = 0;
var failed = 0;

async function downloadImage(index, imageURL) {
  console.info("Downloading " + imageURL);

  /*
  status: 1
  data: xxxx
  response: xxx
  url: xxx
  error: null
  */
  const image = await $http.download(imageURL);
  const imageData = image.data;

  if (imageData == null) {
    console.info("Fail to download " + imageURL);
  } else {
    console.info("Saving image to Photo...");

    let success = await $photo.save(imageData);

    if (success) {
      console.info("Saved one image: " + imageURL);
    } else {
      console.error("Fail to download image: " + imageURL);
      failed++;
    }
    toDownload--;
  }
}

async function parsePageAndDownload(pageLink) {
  const page = await $http.get(pageLink);
  var pageContent = page.data;

  // find all data-fullimg="/large/912269.jpg"
  if (pageContent) {
    var images = [];
    const regexp = /data-fullimg="(.*)"/g;

    let group;
    while ((group = regexp.exec(pageContent)) !== null) {
      let imageURL = "https://wallpaper.dog" + group[1];
      images.push(imageURL);
    }
    console.info(images);

    count = images.length;

    toDownload = count;

    console.info("Parsed " + count + " images");

    for (var i in images) {
      await downloadImage(i, images[i]);
    }

    $ui.loading(false);
  } else {
    $ui.loading(false);
    console.error("Fail to parse page: " + pageLink);
  }
}

let inputLink = $context.link;
let clipboardLink = $clipboard.link;
if (inputLink || clipboardLink) {
  $ui.loading(true);
  if (inputLink) {
    parsePageAndDownload(inputLink);
  } else {
    parsePageAndDownload(clipboardLink);
  }
} else {
  $ui.alert({
    title: "Invalid Input",
    message: "Please use extension or clipboard to pass link.",
  });
}
