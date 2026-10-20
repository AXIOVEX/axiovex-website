/* Listening edition player (spec 029) — v3 (2026-10-20).
   Dependency-free. Plays one MP3 per chapter in sequence as a
   single edition; the slide card swaps at each chapter boundary;
   clicking a chapter starts that chapter; progress is
   edition-wide. Data: the JSON block rendered beside this
   section by the build (blog/listening/<slug>/chapters.json).
   v3 adds the on-the-go layer: Media Session (lock-screen /
   headphone / car controls), a sticky mini-player on small
   screens, resume-where-you-left-off (localStorage), and a
   playback-speed toggle. */
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
  var rateBtn = section.querySelector('[data-le-rate]');
  var resumeBtn = section.querySelector('[data-le-resume]');
  var chapterBtns = Array.prototype.slice.call(section.querySelectorAll('[data-le-chapter]'));

  var offsets = [];
  var total = 0;
  chapters.forEach(function (c) { offsets.push(total); total += c.durationSec || 0; });

  var idx = 0;
  var started = false;
  var endedAll = false;
  var pendingSeek = null; // seconds within the current chapter, applied on loadedmetadata

  function fmt(s) {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function editionNow() {
    return idx >= 0 ? offsets[idx] + (audio.currentTime || 0) : 0;
  }

  /* ---------- playback speed (persisted) ---------- */
  var RATES = [1, 1.25, 1.5, 2];
  var rate = 1;
  try {
    var savedRate = parseFloat(window.localStorage.getItem('le-rate'));
    if (RATES.indexOf(savedRate) >= 0) rate = savedRate;
  } catch (e) { /* storage unavailable */ }
  function fmtRate(r) { return (r % 1 === 0 ? r.toFixed(0) : String(r)) + '×'; }
  function applyRate() {
    audio.playbackRate = rate;
    if (rateBtn) rateBtn.textContent = fmtRate(rate);
  }
  if (rateBtn) {
    rateBtn.addEventListener('click', function () {
      rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
      applyRate();
      try { window.localStorage.setItem('le-rate', String(rate)); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- resume position (localStorage, 7-day window) ---------- */
  var resumeKey = 'le-resume:' + (data.slug || window.location.pathname);
  var resume = null;
  try {
    var raw = window.localStorage.getItem(resumeKey);
    if (raw) {
      var parsed = JSON.parse(raw);
      var ageOk = parsed && (Date.now() - (parsed.updatedAt || 0)) < 7 * 24 * 3600 * 1000;
      var posOk = parsed && parsed.chapterIndex >= 0 && parsed.chapterIndex < chapters.length &&
        parsed.offsetSeconds >= 10 && parsed.offsetSeconds <= total - 10;
      if (ageOk && posOk) resume = parsed;
    }
  } catch (e) { /* storage unavailable */ }
  var lastSave = 0;
  function savePosition(force) {
    var now = Date.now();
    if (!force && now - lastSave < 4000) return;
    lastSave = now;
    try {
      if (!started || endedAll) return;
      var pos = editionNow();
      if (pos < 10 || pos > total - 10) {
        if (pos > total - 10) window.localStorage.removeItem(resumeKey);
        return;
      }
      window.localStorage.setItem(resumeKey, JSON.stringify({
        slug: data.slug || window.location.pathname,
        chapterIndex: idx,
        offsetSeconds: pos,
        updatedAt: now
      }));
    } catch (e) { /* ignore */ }
  }
  function clearPosition() {
    try { window.localStorage.removeItem(resumeKey); } catch (e) { /* ignore */ }
  }
  function hideResume() { if (resumeBtn) resumeBtn.hidden = true; }

  /* ---------- mini-player (small screens, JS-built) ---------- */
  var mini = document.createElement('div');
  mini.className = 'le-mini';
  mini.hidden = true;
  mini.setAttribute('role', 'region');
  mini.setAttribute('aria-label', 'Listening edition mini player');
  mini.innerHTML =
    '<button type="button" class="le-mini-play" aria-label="Play">▶</button>' +
    '<div class="le-mini-main">' +
    '<span class="le-mini-title"></span>' +
    '<div class="le-mini-bar"><i class="le-mini-fill"></i></div>' +
    '</div>' +
    '<button type="button" class="le-mini-close" aria-label="Stop and close mini player">✕</button>';
  document.body.appendChild(mini);
  var miniPlay = mini.querySelector('.le-mini-play');
  var miniTitle = mini.querySelector('.le-mini-title');
  var miniFill = mini.querySelector('.le-mini-fill');
  var miniClose = mini.querySelector('.le-mini-close');
  var miniDismissed = false;
  var sectionVisible = true;
  var mq = window.matchMedia('(max-width: 720px)');
  miniPlay.addEventListener('click', function () {
    if (!started) { setChapter(0, true); return; }
    if (endedAll) { endedAll = false; seekEdition(0); audio.play(); return; }
    if (audio.paused) audio.play(); else audio.pause();
  });
  miniClose.addEventListener('click', function () {
    audio.pause();
    miniDismissed = true;
    updateMini();
  });
  function updateMini() {
    var midEdition = started && !endedAll && editionNow() > 0;
    var show = mq.matches && !sectionVisible && midEdition && !miniDismissed;
    mini.hidden = !show;
    document.body.classList.toggle('le-mini-on', show);
    if (show) {
      miniTitle.textContent = chapters[idx] ? chapters[idx].headline : '';
      miniFill.style.width = (total > 0 ? (editionNow() / total) * 100 : 0) + '%';
    }
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      sectionVisible = entries[0].isIntersecting;
      if (sectionVisible) miniDismissed = false;
      updateMini();
    }, { threshold: 0 }).observe(section);
  }
  if (mq.addEventListener) mq.addEventListener('change', updateMini);

  /* ---------- media session (lock screen / headphones / car) ---------- */
  var hasMS = 'mediaSession' in navigator;
  if (hasMS) {
    try {
      var docTitle = (document.title || '').replace(/\s*[|·—-]\s*Axiovex Systems.*$/, '');
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: data.mediaTitle || ('Axiovex Listening Edition — ' + (data.title || docTitle || 'Axiovex Systems')),
        artist: 'Axiovex Systems',
        album: data.album || 'Listening Editions'
      });
      navigator.mediaSession.setActionHandler('play', function () { audio.play(); });
      navigator.mediaSession.setActionHandler('pause', function () { audio.pause(); });
      navigator.mediaSession.setActionHandler('previoustrack', function () {
        var wasPlaying = !audio.paused;
        if ((audio.currentTime || 0) > 3 || idx === 0) setChapter(idx, wasPlaying);
        else setChapter(idx - 1, wasPlaying);
      });
      navigator.mediaSession.setActionHandler('nexttrack', function () {
        if (idx < chapters.length - 1) setChapter(idx + 1, !audio.paused);
      });
      navigator.mediaSession.setActionHandler('seekbackward', function (details) {
        seekEdition(editionNow() - ((details && details.seekOffset) || 15));
      });
      navigator.mediaSession.setActionHandler('seekforward', function (details) {
        seekEdition(editionNow() + ((details && details.seekOffset) || 15));
      });
      navigator.mediaSession.setActionHandler('seekto', function (details) {
        if (details && typeof details.seekTime === 'number') seekEdition(details.seekTime);
      });
    } catch (e) { hasMS = false; }
  }
  function syncMediaSession() {
    if (!hasMS) return;
    try {
      navigator.mediaSession.playbackState = endedAll ? 'none' : (audio.paused ? 'paused' : 'playing');
      if (total > 0 && navigator.mediaSession.setPositionState) {
        navigator.mediaSession.setPositionState({
          duration: total,
          position: Math.min(editionNow(), total),
          playbackRate: audio.playbackRate || 1
        });
      }
    } catch (e) { /* position state is best-effort */ }
  }

  /* ---------- core player (v1 behavior, preserved) ---------- */
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
    miniTitle.textContent = c.headline || '';
  }

  function setChapter(i, autoplay) {
    idx = i;
    endedAll = false;
    render(i);
    var src = chapters[i].audio;
    if (audio.getAttribute('src') !== src) { audio.src = src; pendingSeek = null; }
    audio.currentTime = 0;
    started = true;
    applyRate();
    if (autoplay) audio.play();
    syncProgress();
  }

  function seekEdition(target) {
    if (!total) return;
    target = Math.max(0, Math.min(target, total - 0.25));
    var i = 0;
    while (i < chapters.length - 1 && target >= offsets[i + 1]) i++;
    var wasPlaying = started && !audio.paused;
    var fresh = idx !== i || audio.getAttribute('src') !== chapters[i].audio;
    idx = i;
    endedAll = false;
    render(i);
    if (fresh) audio.src = chapters[i].audio;
    started = true;
    pendingSeek = Math.min(target - offsets[i], (chapters[i].durationSec || 0) - 0.1);
    if (audio.readyState >= 1) { audio.currentTime = pendingSeek; pendingSeek = null; }
    if (wasPlaying) audio.play();
    applyRate();
    syncProgress();
  }

  function syncProgress() {
    var cur = idx >= 0 ? offsets[idx] + (audio.currentTime || 0) : 0;
    if (idx === chapters.length - 1 && audio.ended) cur = total;
    elapsedEl.textContent = fmt(cur);
    if (total > 0) progress.value = Math.round((cur / total) * 1000);
    miniFill.style.width = (total > 0 ? (cur / total) * 100 : 0) + '%';
    syncMediaSession();
  }

  playBtn.addEventListener('click', function () {
    if (!started) { setChapter(0, true); return; }
    if (endedAll) { endedAll = false; seekEdition(0); audio.play(); return; }
    if (audio.paused) audio.play(); else audio.pause();
  });

  audio.addEventListener('loadedmetadata', function () {
    applyRate();
    if (pendingSeek !== null) { audio.currentTime = pendingSeek; pendingSeek = null; syncProgress(); }
  });
  audio.addEventListener('play', function () {
    playBtn.textContent = '❚❚';
    playBtn.setAttribute('aria-label', 'Pause');
    miniPlay.textContent = '❚❚';
    miniPlay.setAttribute('aria-label', 'Pause');
    hideResume();
    updateMini();
    syncMediaSession();
  });
  audio.addEventListener('pause', function () {
    playBtn.textContent = '▶';
    playBtn.setAttribute('aria-label', 'Play');
    miniPlay.textContent = '▶';
    miniPlay.setAttribute('aria-label', 'Play');
    savePosition(true);
    updateMini();
    syncMediaSession();
  });
  audio.addEventListener('timeupdate', function () {
    syncProgress();
    savePosition(false);
    if (!mini.hidden) updateMini();
  });
  audio.addEventListener('ended', function () {
    if (idx < chapters.length - 1) setChapter(idx + 1, true);
    else {
      endedAll = true;
      playBtn.textContent = '▶';
      playBtn.setAttribute('aria-label', 'Play');
      miniPlay.textContent = '▶';
      clearPosition();
      updateMini();
      syncProgress();
    }
  });

  chapterBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { hideResume(); setChapter(i, true); });
  });

  progress.addEventListener('input', function () {
    if (!total) return;
    hideResume();
    seekEdition((Number(progress.value) / 1000) * total);
  });

  if (resumeBtn) {
    resumeBtn.addEventListener('click', function () {
      hideResume();
      if (audio.paused) audio.play();
    });
  }

  /* ---------- init ---------- */
  totalEl.textContent = fmt(total);
  applyRate();
  if (resume) {
    idx = resume.chapterIndex;
    render(idx);
    audio.src = chapters[idx].audio;
    pendingSeek = Math.min(resume.offsetSeconds - offsets[idx], (chapters[idx].durationSec || 0) - 0.1);
    if (audio.readyState >= 1 && pendingSeek !== null) { audio.currentTime = pendingSeek; pendingSeek = null; }
    started = true; // pressing play resumes here instead of restarting at chapter 1
    if (resumeBtn) {
      resumeBtn.textContent = 'Resume from chapter ' + (idx + 1) + ' · ' + fmt(resume.offsetSeconds);
      resumeBtn.hidden = false;
    }
    syncProgress();
  } else {
    render(0);
    audio.src = chapters[0].audio;
    idx = 0;
  }
})();
