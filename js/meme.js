/* meme.js: random full-screen photo jumpscare with optional custom sound */
(function () {
  var C = (window.CopyCat = window.CopyCat || {});

  /* ---------- Settings ---------- */
  // Your images (put files in assets/memes/), e.g. ['assets/memes/shocked.jpg']
  var IMAGES = ['assets/memes/tesla_einstein.jpg', 'assets/memes/baldi.jpg', 'assets/memes/jake.jpg'];

  // Your sounds (put files in assets/audio/), e.g. ['assets/audio/scream.mp3']
  // If empty, or a file fails to load, a synthesized boom plays instead.
  var SOUNDS = ['assets/audio/sf1.mp3', 'assets/audio/cave.mp3'];

  var CHANCE = 1;                                // odds of a jumpscare each time the teacher looks
  var FALLBACK = ['😱', '🧐', '🫣', '😳', '🕵️'];     // shown when IMAGES is empty or fails to load
  var VOLUME = 1;                                  // 0 to 1, for your sound files
  var SHOW_MS = 600;                               // how long the flash stays on screen

  /* ---------- Setup ---------- */
  var ctx, sound = true, hideT;
  var lastPick = {};

  // Preload images so the first jumpscare appears instantly
  IMAGES.forEach(function (src) { new Image().src = src; });

  // Preload sounds; mark any that fail so we can fall back to the boom
  var soundPool = SOUNDS.map(function (src) {
    var a = new Audio(src);
    a.preload = 'auto';
    a.volume = VOLUME;
    a.addEventListener('error', function () { a.failed = true; });
    return a;
  });

  /* Pick a random item, avoiding an immediate repeat within the same list */
  function pick(list, key) {
    var i;
    do { i = Math.floor(Math.random() * list.length); }
    while (i === lastPick[key] && list.length > 1);
    lastPick[key] = i;
    return list[i];
  }

  /* ---------- Sound ---------- */
  function synthBoom() {
    if (!ctx) return;
    var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.3);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.36);
  }

  function playSound() {
    if (!sound) return;
    var usable = soundPool.filter(function (a) { return !a.failed; });
    if (!usable.length) { synthBoom(); return; }
    var a = pick(usable, 'sound');
    a.currentTime = 0;
    var p = a.play();
    if (p && p.catch) p.catch(synthBoom);          // blocked or missing file: fall back
  }

  /* ---------- Visuals ---------- */
  function emojiEl() {
    var d = document.createElement('div');
    d.className = 'meme-emoji';
    d.textContent = pick(FALLBACK, 'emoji');
    return d;
  }

  /* ---------- Public API ---------- */
  C.meme = {
    // Call from a click so browsers allow audio
    prime: function () {
      if (!ctx) {
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
      }
      if (ctx && ctx.resume) ctx.resume();
    },

    setSound: function (on) { sound = on; },

    // flash(true) forces it, ignoring CHANCE (used by the test button)
    flash: function (force) {
      if (!force && Math.random() > CHANCE) return;

      var el = document.getElementById('meme');
      el.textContent = '';

      if (IMAGES.length) {
        var img = new Image();
        img.alt = '';
        img.onerror = function () { img.replaceWith(emojiEl()); };
        img.src = pick(IMAGES, 'image');
        el.appendChild(img);
      } else {
        el.appendChild(emojiEl());
      }

      el.classList.remove('on');
      void el.offsetWidth;                          // restart the animation
      el.classList.add('on');
      playSound();

      clearTimeout(hideT);
      hideT = setTimeout(function () { el.classList.remove('on'); }, SHOW_MS);
    }
  };
})();