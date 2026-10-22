/* Listening edition player (spec 029) — v4 (2026-10-22, spec 030).
   Dependency-free. Plays one MP3 per chapter in sequence as a
   single edition; the slide card swaps at each chapter boundary;
   clicking a chapter starts that chapter; progress is
   edition-wide. Data: the JSON block rendered beside this
   section by the build (blog/listening/<slug>/chapters.json).
   v3 added the on-the-go layer: Media Session (lock-screen /
   headphone / car controls), a sticky mini-player on small
   screens, resume-where-you-left-off (localStorage), and a
   playback-speed toggle.
   v4 adds the narrator voice picker (WF-04 amendment, spec 030):
   when the edition's data offers more than one voice, a Voice
   button joins the controls row after the speed button, opening
   a panel with one row per voice (name, description, sample
   clip). The choice is kept on this device (localStorage
   'le-voice') and applies to every edition. Switching voice
   keeps the chapter and the place in it; resume records carry
   the voice they were saved in and are mapped by
   chapter-and-fraction when restored in another voice. Records
   written before v4 have no voice field; they were saved against
   the pre-picker default voice, which the roster no longer
   offers, so they are read against the DEFAULT track — same
   chapter, same position, in the current default voice's
   pacing (spec 030, FR-006). */
(function () {
  var section = document.getElementById('listening-edition');
  if (!section) return;
  var dataEl = section.querySelector('[data-le-data]');
  if (!dataEl) return;
  var data;
  try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var rawChapters = data.chapters || [];
  if (!rawChapters.length) return;

  /* ---------- narrator voices (spec 030) ---------- */
  var roster = (data.voices || []).filter(function (v) { return v && v.id && v.name; });
  var defaultVoiceId = data.defaultVoice || (roster.length ? roster[0].id : null);
  var activeVoiceId = defaultVoiceId;
  if (roster.length > 1) {
    try {
      var savedVoice = window.localStorage.getItem('le-voice');
      if (savedVoice && roster.some(function (v) { return v.id === savedVoice; })) activeVoiceId = savedVoice;
    } catch (e) { /* storage unavailable: the default plays */ }
  }
  function chapterFor(c, voiceId) {
    var e = (voiceId && c.voices && c.voices[voiceId]) || null;
    return {
      kicker: c.kicker, headline: c.headline, points: c.points, takeaway: c.takeaway,
      audio: (e && e.audio) || c.audio,
      durationSec: (e && e.durationSec) || c.durationSec || 0
    };
  }
  function tableFor(voiceId) {
    var list = rawChapters.map(function (c) { return chapterFor(c, voiceId); });
    var offs = [], tot = 0;
    list.forEach(function (c) { offs.push(tot); tot += c.durationSec || 0; });
    return { chapters: list, offsets: offs, total: tot };
  }
  var chapters = [];
  var offsets = [];
  var total = 0;
  function rebuildView() {
    var t = tableFor(activeVoiceId);
    chapters = t.chapters; offsets = t.offsets; total = t.total;
  }
  rebuildView();

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
      /* Records name the voice their position was saved in; records
         from before v4 name none and are read against the DEFAULT
         track — same chapter, same position (spec 030, FR-006:
         the voice those positions were recorded in is no longer
         offered). Validity is judged against the record track's
         own chapter lengths, then a position saved in another
         voice is mapped into the active voice by chapter and
         fraction — narrators pace the same words differently,
         and the fraction is the honest common unit. */
      var recVoice = (parsed && parsed.voice) || defaultVoiceId;
      var recTable = tableFor(recVoice);
      var posOk = parsed && parsed.chapterIndex >= 0 && parsed.chapterIndex < rawChapters.length &&
        parsed.offsetSeconds >= 10 && parsed.offsetSeconds <= recTable.total - 10;
      if (ageOk && posOk) {
        if (recVoice === activeVoiceId) {
          resume = parsed;
        } else {
          var rci = parsed.chapterIndex;
          var rDur = recTable.chapters[rci].durationSec || 1;
          var frac = (parsed.offsetSeconds - recTable.offsets[rci]) / rDur;
          frac = Math.max(0, Math.min(1, frac));
          resume = {
            chapterIndex: rci,
            offsetSeconds: offsets[rci] + frac * (chapters[rci].durationSec || 0),
            updatedAt: parsed.updatedAt
          };
        }
      }
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
      var rec = {
        slug: data.slug || window.location.pathname,
        chapterIndex: idx,
        offsetSeconds: pos,
        updatedAt: now
      };
      if (activeVoiceId) rec.voice = activeVoiceId;
      window.localStorage.setItem(resumeKey, JSON.stringify(rec));
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

  /* ---------- voice picker (spec 030; multi-voice editions only) ---------- */
  var voiceBtn = null;
  var voicePanel = null;
  var sampleAudio = document.createElement('audio');
  sampleAudio.preload = 'none';
  var sampleVoiceId = null;
  var sampleBtns = {};

  function voiceName(id) {
    for (var i = 0; i < roster.length; i++) if (roster[i].id === id) return roster[i].name;
    return '';
  }
  function updateMeta() {
    var metaEl = section.querySelector('.le-meta');
    if (!metaEl) return;
    var mins = Math.max(1, Math.round(total / 60));
    metaEl.textContent = metaEl.textContent.replace(/about \d+ minutes?/,
      'about ' + mins + (mins === 1 ? ' minute' : ' minutes'));
  }
  function updateVoiceUI() {
    if (voiceBtn) voiceBtn.textContent = 'Voice: ' + voiceName(activeVoiceId);
    if (voicePanel) {
      Array.prototype.forEach.call(voicePanel.querySelectorAll('[data-le-voice-pick]'), function (pick) {
        var current = pick.getAttribute('data-voice-id') === activeVoiceId;
        pick.setAttribute('aria-checked', current ? 'true' : 'false');
        var dot = pick.querySelector('.le-voice-dot');
        if (dot) dot.textContent = current ? '\u25CF' : '\u25CB';
      });
    }
  }
  function stopSample() {
    if (sampleVoiceId === null) return;
    var id = sampleVoiceId;
    sampleVoiceId = null;
    sampleAudio.pause();
    var b = sampleBtns[id];
    if (b) {
      b.textContent = '\u25B6';
      b.setAttribute('aria-label', 'Play a sample of ' + voiceName(id));
    }
  }
  function toggleSample(id, btn) {
    if (sampleVoiceId === id) { stopSample(); return; }
    stopSample();
    /* Starting a sample pauses the edition; the edition does not
       auto-resume afterwards (WF-04 amendment). */
    if (!audio.paused) audio.pause();
    sampleVoiceId = id;
    sampleAudio.src = '/assets/audio/voice-samples/' + id + '.mp3';
    var p = sampleAudio.play();
    if (p && p.catch) p.catch(function () { stopSample(); });
    btn.textContent = '\u275A\u275A';
    btn.setAttribute('aria-label', 'Stop the sample of ' + voiceName(id));
  }
  sampleAudio.addEventListener('ended', stopSample);

  function closePanel() {
    if (!voicePanel || voicePanel.hidden) return;
    voicePanel.hidden = true;
    if (voiceBtn) voiceBtn.setAttribute('aria-expanded', 'false');
    stopSample();
  }
  function openPanel() {
    if (!voicePanel) return;
    voicePanel.hidden = false;
    if (voiceBtn) voiceBtn.setAttribute('aria-expanded', 'true');
    updateVoiceUI();
  }

  function setVoice(id) {
    closePanel();
    if (id === activeVoiceId) return;
    var wasPlaying = started && !audio.paused;
    var curIdx = idx;
    var secIn = pendingSeek !== null ? pendingSeek : (audio.currentTime || 0);
    activeVoiceId = id;
    try { window.localStorage.setItem('le-voice', id); } catch (e) { /* storage unavailable */ }
    rebuildView();
    idx = Math.min(curIdx, chapters.length - 1);
    render(idx);
    var dur = chapters[idx].durationSec || 0;
    var target = Math.max(0, Math.min(secIn, Math.max(0, dur - 2)));
    if (audio.getAttribute('src') !== chapters[idx].audio) audio.src = chapters[idx].audio;
    pendingSeek = target;
    if (audio.readyState >= 1) { audio.currentTime = target; pendingSeek = null; }
    totalEl.textContent = fmt(total);
    updateMeta();
    updateVoiceUI();
    if (wasPlaying) audio.play();
    syncProgress();
    savePosition(true);
  }

  if (roster.length > 1 && rateBtn) {
    voiceBtn = document.createElement('button');
    voiceBtn.type = 'button';
    voiceBtn.className = 'le-voice';
    voiceBtn.setAttribute('data-le-voice', '');
    voiceBtn.setAttribute('aria-haspopup', 'true');
    voiceBtn.setAttribute('aria-expanded', 'false');
    voiceBtn.setAttribute('aria-label', 'Narrator voice');
    voiceBtn.title = 'Narrator voice';
    rateBtn.parentNode.insertBefore(voiceBtn, rateBtn.nextSibling);

    voicePanel = document.createElement('div');
    voicePanel.className = 'le-voice-panel';
    voicePanel.hidden = true;
    voicePanel.setAttribute('role', 'radiogroup');
    voicePanel.setAttribute('aria-label', 'Choose a narrator');
    var head = document.createElement('p');
    head.className = 'le-voice-head';
    head.textContent = 'Narrator';
    voicePanel.appendChild(head);
    roster.forEach(function (v) {
      var row = document.createElement('div');
      row.className = 'le-voice-row';
      var pick = document.createElement('button');
      pick.type = 'button';
      pick.className = 'le-voice-pick';
      pick.setAttribute('role', 'radio');
      pick.setAttribute('aria-checked', 'false');
      pick.setAttribute('data-le-voice-pick', '');
      pick.setAttribute('data-voice-id', v.id);
      var dot = document.createElement('span');
      dot.className = 'le-voice-dot';
      dot.setAttribute('aria-hidden', 'true');
      dot.textContent = '\u25CB';
      var main = document.createElement('span');
      main.className = 'le-voice-main';
      var nm = document.createElement('span');
      nm.className = 'le-voice-name';
      nm.textContent = v.name + (v.id === defaultVoiceId ? ' (default)' : '');
      var ds = document.createElement('span');
      ds.className = 'le-voice-desc';
      ds.textContent = v.description || '';
      main.appendChild(nm);
      main.appendChild(ds);
      pick.appendChild(dot);
      pick.appendChild(main);
      pick.addEventListener('click', function () { setVoice(v.id); });
      var sample = document.createElement('button');
      sample.type = 'button';
      sample.className = 'le-voice-sample';
      sample.textContent = '\u25B6';
      sample.setAttribute('aria-label', 'Play a sample of ' + v.name);
      sample.addEventListener('click', function () { toggleSample(v.id, sample); });
      sampleBtns[v.id] = sample;
      row.appendChild(pick);
      row.appendChild(sample);
      voicePanel.appendChild(row);
    });
    var note = document.createElement('p');
    note.className = 'le-voice-note';
    note.textContent = 'Your choice is kept on this device for every listening edition.';
    voicePanel.appendChild(note);
    rateBtn.parentNode.appendChild(voicePanel);

    voiceBtn.addEventListener('click', function () {
      if (voicePanel.hidden) openPanel(); else closePanel();
    });
    document.addEventListener('click', function (ev) {
      if (voicePanel && !voicePanel.hidden && !voicePanel.contains(ev.target) && ev.target !== voiceBtn) closePanel();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && voicePanel && !voicePanel.hidden) { closePanel(); voiceBtn.focus(); }
    });
  }

  /* ---------- init ---------- */
  totalEl.textContent = fmt(total);
  applyRate();
  updateVoiceUI();
  updateMeta();
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
