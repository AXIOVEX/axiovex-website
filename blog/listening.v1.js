/* Listening edition player (spec 029) — dependency-free.
   Plays one MP3 per chapter in sequence as a single edition;
   the slide card swaps at each chapter boundary; clicking a
   chapter starts that chapter; progress is edition-wide.
   Data: the JSON block rendered beside this section by the
   build (blog/listening/<slug>/chapters.json). */
(function () {
  var section = document.getElementById('listening-edition');
  if (!section) return;
  var dataEl = section.querySelector('[data-le-data]');
  if (!dataEl) return;
  var data;
  try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var chapters = data.chapters || [];
  if (!chapters.length) return;

  var audio = section.querySelector('[data-le-audio]');
  var playBtn = section.querySelector('[data-le-play]');
  var elapsedEl = section.querySelector('[data-le-elapsed]');
  var totalEl = section.querySelector('[data-le-total]');
  var nowEl = section.querySelector('[data-le-now]');
  var progress = section.querySelector('[data-le-progress]');
  var kickerEl = section.querySelector('[data-le-kicker]');
  var headlineEl = section.querySelector('[data-le-headline]');
  var pointsEl = section.querySelector('[data-le-points]');
  var takeawayEl = section.querySelector('[data-le-takeaway]');
  var chapterBtns = Array.prototype.slice.call(section.querySelectorAll('[data-le-chapter]'));

  var offsets = [];
  var total = 0;
  chapters.forEach(function (c) { offsets.push(total); total += c.durationSec || 0; });

  var idx = -1;
  var started = false;

  function fmt(s) {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function render(i) {
    var c = chapters[i];
    kickerEl.textContent = c.kicker || '';
    headlineEl.textContent = c.headline || '';
    pointsEl.innerHTML = '';
    (c.points || []).forEach(function (p) {
      var li = document.createElement('li');
      li.textContent = p;
      pointsEl.appendChild(li);
    });
    takeawayEl.textContent = c.takeaway || '';
    chapterBtns.forEach(function (b, j) {
      if (j === i) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    nowEl.textContent = 'Chapter ' + (i + 1) + ' of ' + chapters.length;
  }

  function setChapter(i, autoplay) {
    idx = i;
    render(i);
    var src = chapters[i].audio;
    if (audio.getAttribute('src') !== src) audio.src = src;
    audio.currentTime = 0;
    started = true;
    if (autoplay) audio.play();
    syncProgress();
  }

  function syncProgress() {
    var cur = idx >= 0 ? offsets[idx] + (audio.currentTime || 0) : 0;
    if (idx === chapters.length - 1 && audio.ended) cur = total;
    elapsedEl.textContent = fmt(cur);
    if (total > 0) progress.value = Math.round((cur / total) * 1000);
  }

  playBtn.addEventListener('click', function () {
    if (!started) { setChapter(0, true); return; }
    if (audio.paused) audio.play(); else audio.pause();
  });

  audio.addEventListener('play', function () {
    playBtn.textContent = '❚❚';
    playBtn.setAttribute('aria-label', 'Pause');
  });
  audio.addEventListener('pause', function () {
    playBtn.textContent = '▶';
    playBtn.setAttribute('aria-label', 'Play');
  });
  audio.addEventListener('timeupdate', syncProgress);
  audio.addEventListener('ended', function () {
    if (idx < chapters.length - 1) setChapter(idx + 1, true);
    else syncProgress();
  });

  chapterBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { setChapter(i, true); });
  });

  progress.addEventListener('input', function () {
    if (!total) return;
    var target = (Number(progress.value) / 1000) * total;
    var i = 0;
    while (i < chapters.length - 1 && target >= offsets[i + 1]) i++;
    var wasPlaying = started && !audio.paused;
    var fresh = idx !== i;
    idx = i;
    render(i);
    var src = chapters[i].audio;
    if (audio.getAttribute('src') !== src) audio.src = src;
    started = true;
    var seek = function () { audio.currentTime = Math.min(target - offsets[i], (chapters[i].durationSec || 0) - 0.1); };
    if (fresh && audio.readyState < 1) audio.addEventListener('loadedmetadata', seek, { once: true });
    else seek();
    if (wasPlaying) audio.play();
    syncProgress();
  });

  totalEl.textContent = fmt(total);
  render(0);
  audio.src = chapters[0].audio;
  idx = 0;
})();
