/* game.js: game state, teacher AI, input handling, UI */
(function () {
  var C = window.CopyCat;
  var $ = function (id) { return document.getElementById(id); };
  var rnd = function (a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; };

  var STORAGE_KEY = 'copycat-best';
  var best = 0;
  try { best = +localStorage.getItem(STORAGE_KEY) || 0; } catch (e) {}
  $('best').textContent = best;

  var S = { playing: false, run: 0 };

  /* ---------- UI helpers ---------- */
  function toast(msg, cls) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast show ' + cls;
    clearTimeout(toast.h);
    toast.h = setTimeout(function () { t.className = 'toast ' + cls; }, 1800);
  }

  function renderHud() {
    $('lives').textContent = S.lives > 0 ? '❤️'.repeat(S.lives) : '💀';
    $('score').textContent = S.score;
    $('streak').textContent = S.streak;
  }

  function resetPreview() { $('preview').textContent = 'Preview appears as you type.'; }

  /* ---------- Rounds ---------- */
  function nextRound() {
    S.round++;
    S.q = C.generate(S.round);
    S.max = S.time = Math.max(25, 50 - S.round * 2);
    $('qtitle').textContent = 'Question ' + S.round + ': ' + S.q.title;
    $('problem').innerHTML = S.q.html;
    $('ntex').textContent = C.toLatex(S.q.alex);
    $('ans').value = '';
    resetPreview();
    if (S.playing && matchMedia('(pointer:fine)').matches) $('ans').focus();
  }

  function lose(why) {
    S.lives--;
    S.streak = 0;
    renderHud();
    toast(why, 'bad');
    var app = $('app');
    app.classList.remove('shake');
    void app.offsetWidth;
    app.classList.add('shake');
    if (S.lives <= 0) endGame();
  }

  function submit() {
    if (!S.playing) return;
    var p = C.parseAnswer($('ans').value);
    if (p === null) { toast('That isn’t a number or a matrix yet.', 'bad'); return; }

    if (C.sameAnswer(p, S.q.ans)) {
      var pts = 100 + Math.round(S.time * 3) + S.streak * 20, extra = '';
      if (S.q.alexWrong) { pts += 50; extra = ' Spotted Alex’s mistake, +50.'; }
      S.score += pts;
      S.streak++;
      renderHud();
      toast('Correct, +' + pts + '.' + extra, 'ok');
    } else {
      var copied = S.q.alexWrong && C.sameAnswer(p, S.q.alex);
      lose((copied ? 'You copied Alex’s mistake. ' : 'Wrong. ') + 'Answer: ' + C.toLatex(S.q.ans));
    }
    if (S.playing) nextRound();
  }

  /* ---------- Teacher ---------- */
  var TEACHER = {
    away:     ['🧑‍🏫', 'Back turned. Coast is clear.'],
    turning:  ['🤨', 'She’s turning around…'],
    watching: ['👀', 'WATCHING. Freeze!']
  };

  function setTeacher(state) {
    S.T = state;
    S.caughtThis = false;
    $('teacher').className = 'teacher ' + state;
    $('face').textContent = TEACHER[state][0];
    $('tmsg').textContent = TEACHER[state][1];
    if (state === 'watching') C.meme.flash();
    if (state === 'watching' && S.peek) caught('peeking');
  }

  function teacherLoop(id) {
    if (!S.playing || id !== S.run) return;
    var away = Math.max(1700, 4600 - S.round * 140) + rnd(0, 1400);
    setTeacher('away');
    setTimeout(function () {
      if (id !== S.run) return;
      setTeacher('turning');
      setTimeout(function () {
        if (id !== S.run) return;
        setTeacher('watching');
        setTimeout(function () { teacherLoop(id); }, 1500);
      }, 850);
    }, away);
  }

  function caught(why) {
    if (S.caughtThis || !S.playing) return;
    S.caughtThis = true; // one strike per watching phase
    lose('Caught ' + why + '! −1 life');
  }

  /* ---------- Game flow ---------- */
  function startGame() {
    S = { playing: true, run: (S.run || 0) + 1, lives: 3, score: 0, streak: 0, round: 0, peek: false };
    C.meme.prime();
    $('start').classList.add('hide');
    $('over').classList.add('hide');
    renderHud();
    nextRound();
    teacherLoop(S.run);
  }

  function endGame() {
    S.playing = false;
    S.run++;
    if (S.score > best) {
      best = S.score;
      $('best').textContent = best;
      try { localStorage.setItem(STORAGE_KEY, best); } catch (e) {}
    }
    $('otext').textContent = 'You reached question ' + S.round + ' and scored ' + S.score + '. Best: ' + best + '.';
    $('over').classList.remove('hide');
  }

  /* ---------- Peeking ---------- */
  function setPeek(on) {
    S.peek = on;
    $('neighbor').classList.toggle('peek', on);
    if (on && S.T === 'watching') caught('peeking');
  }

  var peekBtn = $('peekbtn');
  peekBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); setPeek(true); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
    peekBtn.addEventListener(ev, function () { setPeek(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Tab' && S.playing) { e.preventDefault(); if (!e.repeat) setPeek(true); }
  });
  document.addEventListener('keyup', function (e) { if (e.key === 'Tab') setPeek(false); });
  window.addEventListener('blur', function () { setPeek(false); });

  /* ---------- Answer input ---------- */
  var ans = $('ans');
  ans.addEventListener('input', function () {
    if (S.T === 'watching') caught('typing');
    var p = C.parseAnswer(this.value), pv = $('preview');
    if (p === null) {
      if (this.value.trim()) pv.textContent = 'Not valid yet. Check & and \\\\ separators.';
      else resetPreview();
    } else {
      pv.innerHTML = Array.isArray(p) ? C.matrixHTML(p) : '<b>' + p + '</b>';
    }
  });
  ans.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  });

  /* Quick-insert chips for mobile typing */
  [['\\begin{pmatrix}', '\\begin{pmatrix} '], ['&', ' & '], ['\\\\', ' \\\\ '], ['\\end{pmatrix}', ' \\end{pmatrix}']]
    .forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'chip';
      b.type = 'button';
      b.textContent = c[0];
      b.addEventListener('click', function () {
        if (!S.playing) return;
        if (S.T === 'watching') caught('typing');
        ans.value += c[1];
        ans.dispatchEvent(new Event('input'));
        ans.focus();
      });
      $('chips').appendChild(b);
    });

  $('sfx').addEventListener('click', function () {
    var on = this.textContent === '🔇';
    C.meme.setSound(on);
    this.textContent = on ? '🔊' : '🔇';
  });

  $('testmeme').addEventListener('click', function () {
    C.meme.prime();
    C.meme.flash(true);
  });

  $('submit').addEventListener('click', submit);
  $('play').addEventListener('click', startGame);
  $('again').addEventListener('click', startGame);

  /* ---------- Main tick (timer + peek check) ---------- */
  setInterval(function () {
    if (!S.playing) return;
    S.time -= 0.1;
    $('bar').style.width = Math.max(0, S.time / S.max * 100) + '%';
    if (S.T === 'watching' && S.peek) caught('peeking');
    if (S.time <= 0) {
      lose('Time’s up. Answer: ' + C.toLatex(S.q.ans));
      if (S.playing) nextRound();
    }
  }, 100);
})();
