/* problems.js: random problem generation and Alex's answers */
(function () {
  var C = (window.CopyCat = window.CopyCat || {});

  var rnd = function (a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; };
  var mat = function (n, lo, hi) {
    var m = [];
    for (var i = 0; i < n; i++) {
      m.push([]);
      for (var j = 0; j < n; j++) m[i].push(rnd(lo, hi));
    }
    return m;
  };
  var zip = function (A, B, fn) {
    return A.map(function (r, i) { return r.map(function (v, j) { return fn(v, B[i][j]); }); });
  };
  var mx = function (m) { return C.matrixHTML(m); };

  var KINDS = {
    add: function (n) {
      var A = mat(n, -5, 9), B = mat(n, -5, 9);
      return { title: 'Add the matrices',
        html: mx(A) + '<b class="op">+</b>' + mx(B) + '<b class="op">=</b><b>?</b>',
        ans: zip(A, B, function (a, b) { return a + b; }) };
    },
    sub: function (n) {
      var A = mat(n, -5, 9), B = mat(n, -5, 9);
      return { title: 'Subtract the matrices',
        html: mx(A) + '<b class="op">−</b>' + mx(B) + '<b class="op">=</b><b>?</b>',
        ans: zip(A, B, function (a, b) { return a - b; }) };
    },
    scalar: function (n) {
      var A = mat(n, -5, 9), k = rnd(2, 5);
      return { title: 'Multiply by a scalar',
        html: '<b>' + k + '</b>' + mx(A) + '<b class="op">=</b><b>?</b>',
        ans: A.map(function (r) { return r.map(function (v) { return v * k; }); }) };
    },
    mul: function () {
      var A = mat(2, -3, 5), B = mat(2, -3, 5);
      return { title: 'Multiply the matrices',
        html: mx(A) + '<b class="op">×</b>' + mx(B) + '<b class="op">=</b><b>?</b>',
        ans: [0, 1].map(function (i) {
          return [0, 1].map(function (j) { return A[i][0] * B[0][j] + A[i][1] * B[1][j]; });
        }) };
    },
    det: function () {
      var A = mat(2, -5, 9);
      return { title: 'Find the determinant',
        html: '<b>det</b>' + mx(A) + '<b class="op">=</b><b>?</b>',
        ans: A[0][0] * A[1][1] - A[0][1] * A[1][0] };
    },
    arith: function () {
      var x = rnd(6, 19), y = rnd(3, 9), z = rnd(2, 40);
      return { title: 'Quick arithmetic',
        html: '<b>' + x + ' × ' + y + ' + ' + z + ' = ?</b>',
        ans: x * y + z };
    }
  };
  var NAMES = Object.keys(KINDS);

  /** Make Alex's answer: a copy of the truth, wrong about 1 time in 3. */
  function alexAnswer(ans) {
    var copy = JSON.parse(JSON.stringify(ans));
    if (Math.random() >= 0.33) return { value: copy, wrong: false };
    var d = [-3, -2, -1, 1, 2, 3][rnd(0, 5)];
    if (Array.isArray(copy)) copy[rnd(0, copy.length - 1)][rnd(0, copy.length - 1)] += d;
    else copy += d;
    return { value: copy, wrong: true };
  }

  /** Generate one question. After round 6, add/sub/scalar use 3×3 matrices. */
  C.generate = function (round) {
    var n = round > 6 ? 3 : 2;
    var q = KINDS[NAMES[rnd(0, NAMES.length - 1)]](n);
    var alex = alexAnswer(q.ans);
    q.alex = alex.value;
    q.alexWrong = alex.wrong;
    return q;
  };
})();
