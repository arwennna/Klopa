
/*https://stackoverflow.com/questions/92720/jquery-javascript-to-replace-broken-images*/
var retries = 0;
$.imgReload = function() {
    var loaded = 1;

    $("img").each(function() {
        if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {

            var src = $(this).attr("src");
            var date = new Date();
            $(this).attr("src", src + "?v=" + date.getTime()); //slightly change url to prevent loading from cache
            loaded =0;
        }
    });

    retries +=1;
    if (retries < 100) { // If after 10 retries error images are not fixed maybe because they
        // are not present on server, the recursion will break the loop
        if (loaded == 0) {
            setTimeout('$.imgReload()',4000); // I think 4 seconds is enough to load a small image (<50k) from a slow server
        }
        // All images have been loaded
        else {
            // alert("images loaded");
        }
    }
    // If error images cannot be loaded  after 10 retries
    else {
        // alert("recursion exceeded");
    }
}

jQuery(document).ready(function() {
    setTimeout('$.imgReload()', 1000);
});