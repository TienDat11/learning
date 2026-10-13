
const res = [];
const host = document.createElement('div');
document.body.appendChild(host);
for (const item of window.SVGS) {
  const doc = new DOMParser().parseFromString(item.s, 'image/svg+xml');
  const err = doc.querySelector('parsererror');
  const r = { f: item.f, parse: err ? 'FAIL' : 'ok', problems: [] };
  if (!err) {
    const svg = document.importNode(doc.documentElement, true);
    host.appendChild(svg);
    const vb = svg.viewBox.baseVal;
    const boxes = [...svg.querySelectorAll('rect.box')].map(b => ({ k: b.dataset.key, x: +b.getAttribute('x'), y: +b.getAttribute('y'), w: +b.getAttribute('width'), h: +b.getAttribute('height') }));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) r.problems.push('box overlap ' + a.k + '/' + b.k);
    }
    const texts = [...svg.querySelectorAll('text')];
    let minFs = 99;
    for (const t of texts) {
      minFs = Math.min(minFs, +t.getAttribute('font-size'));
      const bb = t.getBBox();
      const label = t.textContent;
      if (bb.x < 0 || bb.y < 0 || bb.x + bb.width > vb.width || bb.y + bb.height > vb.height) r.problems.push('outside viewBox: ' + label);
      if (t.classList.contains('lbl')) {
        const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
        const hb = boxes.find(b => cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h);
        if (!hb) r.problems.push('label outside any box: ' + label);
        else if (bb.width + 16 > hb.w) r.problems.push('too wide ' + Math.round(bb.width) + '+16 > ' + hb.w + ': ' + label);
      }
      if (t.classList.contains('ext')) {
        for (const b of boxes) if (bb.x < b.x + b.w && b.x < bb.x + bb.width && bb.y < b.y + b.h && b.y < bb.y + bb.height) r.problems.push('ext label over box: ' + label);
      }
    }
    r.minFontSize = minFs;
    if (minFs < 14) r.problems.push('font < 14');
    r.boxes = boxes.length;
    r.texts = texts.length;
    svg.remove();
  }
  res.push(r);
}
document.getElementById('out').textContent = JSON.stringify(res);
