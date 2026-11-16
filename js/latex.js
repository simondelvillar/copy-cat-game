/* latex.js: matrix rendering, LaTeX output, and answer parsing */
(function () {
  var C = (window.CopyCat = window.CopyCat || {});

  /** Render a 2D array as an HTML matrix (CSS grid with bracket borders). */
  C.matrixHTML = function (m) {
    var cells = [].concat.apply([], m).map(function (v) { return '<i>' + v + '</i>'; });
    return '<span class="mx" style="--c:' + m[0].length + '">' + cells.join('') + '</span>';
  };

  /** Convert a number or 2D array to a LaTeX string. */
  C.toLatex = function (a) {
    if (!Array.isArray(a)) return String(a);
    var rows = a.map(function (r) { return r.join(' & '); }).join(' \\\\ ');
    return '\\begin{pmatrix} ' + rows + ' \\end{pmatrix}';
  };

  /**
   * Parse a typed answer. Returns a number, a 2D array of numbers,
   * or null when the input isn't valid yet. Accepts p/b/v matrix environments.
   */
  C.parseAnswer = function (s) {
    s = s.replace(/\$/g, '').trim();
    if (!s) return null;
    var m = s.match(/\\begin\{[pbv]?matrix\}([\s\S]*?)\\end\{[pbv]?matrix\}/);
    if (m) {
      var rows = m[1].split('\\\\')
        .map(function (r) { return r.trim(); })
        .filter(Boolean)
        .map(function (r) {
          return r.split('&').map(function (x) {
            x = x.trim();
            return x === '' ? NaN : Number(x);
          });
        });
      var w = rows.length && rows[0].length;
      var bad = !rows.length || rows.some(function (r) {
        return r.length !== w || r.some(isNaN);
      });
      return bad ? null : rows;
    }
    var v = Number(s);
    return isNaN(v) ? null : v;
  };

  /** Deep equality for numbers and 2D arrays. */
  C.sameAnswer = function (a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  };
})();
