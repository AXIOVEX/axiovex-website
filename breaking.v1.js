/* Breaking news banner — dismissal only (spec 012, FR-005).
 *
 * The banner itself is rendered at build time by
 * scripts/build-site.mjs (buildBreaking); a page references this
 * script only while a banner is active, so it ships with the
 * banner and leaves zero trace when none exists.
 *
 * Dismissal is remembered per entry: the stored value is the
 * entry's id, so the same entry stays dismissed across pages and
 * visits while a new entry (new id) shows again. All storage
 * access is wrapped in try/catch — where storage is unavailable
 * (e.g. private browsing), dismissal degrades to hiding the
 * banner for the current page view. Nothing errors. */
(function () {
  var KEY = 'axiovex-breaking-dismissed';
  var banner = document.querySelector('.breaking-banner');
  if (!banner) return;
  var button = banner.querySelector('[data-breaking-dismiss]');
  var id = button ? button.getAttribute('data-breaking-dismiss') : null;

  function stored() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function remember(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* per-view hide only */ }
  }

  if (id && stored() === id) {
    banner.style.display = 'none';
    return;
  }
  if (button) {
    button.addEventListener('click', function () {
      banner.style.display = 'none';
      if (id) remember(id);
    });
  }
})();
