    // Articles now live at /blog/<slug>/ — this shim preserves every old
    // /blog/post?p=<slug> link (shares, the LinkedIn comment, older sitemaps).
    (function () {
      var m = /[?&]p=([A-Za-z0-9-]+)/.exec(location.search);
      if (m) location.replace('/blog/' + m[1] + '/');
    })();
