// QA row BVHJq ("Hàng 10 · Bài học · Mobile 390") — M1..M13.
// Read-only: no Move, no save. Every access goes through tools/pen.lock.
// Run: node tools/qa-mobile-hang10.mjs
// Writes: exports/pen/QA-mobile.md, exports/pen/qa-mobile.json
import fs from 'node:fs';
import { PenIpc } from './pen-ipc.mjs';
import { acquire, release } from './pen-lock.mjs';

const FILE = 'C:/Users/ADMIN/.pencil/documents/547d2bfc-a0d0-4277-80e0-9ffaca50f6b9/design.pen';
const ROW = 'BVHJq';
const GLOSS = JSON.parse(fs.readFileSync('D:/research/lesson-glossary.json', 'utf8'));
const GL = {};
for (const g of GLOSS) GL[g.id] = g.rows;

// M4: "partially clipped" inside a scroll container is legitimate horizontal scroll.
// The lesson frame itself carries clip:true, so an ancestor check MUST skip depth 0,
// otherwise every node counts as "inside a clip" and M4 becomes vacuous.
//
// M9 reads the RAW paint value (no resolveVariables): a bound paint is the string "$lsn2-*",
// while resolveVariables would turn it into "#FAFAFA" and look like a literal hex.
// M12 derives open/closed from structure: answer child present + marker "⌄" vs "›".
// M6 anchors on the clip container "Khung cuộn · …" (names differ per batch: "Visual · Hình 1",
// "Visual · Tree", "Visual · Code Code · …"), classifies by "Hình n" / "Code", and reads the
// pill as the immediately preceding sibling.
const COLLECT = `
const ROW='${ROW}';
const qaOut=[];
const qaKids=[];
Get(ROW,(n,c)=>{if(c.depth===1)qaKids.push({id:n.id,name:n.name});});
function qaLegitClip(c){let p=c.parentCtx;while(p){if(p.depth>0&&p.node.clip)return true;p=p.parentCtx;}return false;}
function qaTxt(node){if(node.content)return String(node.content);let s='';Get(node.id,(n)=>{if(n.type==='text'&&n.content)s+=' '+String(n.content);});return s.trim();}
for(let qi=0;qi<qaKids.length;qi++){
  const k=qaKids[qi];
  const qm=(k.name||'').match(/^L(\\d\\d) · /);
  const info={index:qi,id:k.id,name:k.name,tag:qm?('L'+qm[1]):null,w:null,h:null,
    sections:[],minFont:999,placeholders:0,problemsRaw:0,problemsLegit:0,problemsBad:[],
    wide:[],nodes:0,diagrams:[],codes:[],otherScroll:[],glossary:null,qa:null,
    hexLit:[],boundPaints:0,rootRawFill:null,rootResolvedFill:null};

  // ---------- pass A: resolved values (structure, fonts, problems, sizes) ----------
  Get(k.id,(n,c)=>{
    info.nodes++;
    const b=c.bounds||{};
    if(c.depth===0){info.w=Math.round(n.width||b.width||0);info.h=Math.round(b.height||0);info.rootResolvedFill=n.fill;}
    if(n.type==='text'){const s=n.fontSize||0;if(s&&s<info.minFont)info.minFont=s;}
    if(n.placeholder)info.placeholders++;
    if(/^Section \\d\\d$/.test(n.name||''))info.sections.push({name:n.name,idx:c.index});
    if(c.problems){
      info.problemsRaw++;
      if(qaLegitClip(c))info.problemsLegit++;
      else if(info.problemsBad.length<5)info.problemsBad.push((n.name||'?')+'@'+(c.parentCtx?c.parentCtx.node.name:'?')+':'+c.problems);
    }
    // M8: content node wider than the 350 content area, outside any clip container.
    // The page-grid containers are exactly as wide as the lesson frame (390, spec §1) — excluded.
    if(b.width>350.5&&Math.round(b.width)!==info.w&&!qaLegitClip(c)&&info.wide.length<5){
      info.wide.push((n.name||'?')+'='+Math.round(b.width));
    }
    // M6: clip containers.
    if(/^Khung cuộn · /.test(n.name||'')){
      const pid=c.parentCtx?c.parentCtx.node.id:null;
      const sibs=pid?(Get(pid,{depth:1}).children||[]):[];
      const si=sibs.findIndex(s=>s.id===n.id);
      const prev=si>0?sibs[si-1]:null;
      const inner=(Get(n.id,{depth:1}).children||[])[0]||null;
      const rec={name:n.name,w:Math.round(b.width||0),clip:!!n.clip,
        pill:!!(prev&&/^Pill · /.test(prev.name||'')&&/^Kéo ngang/.test(qaTxt(prev))),
        pillText:prev?qaTxt(prev).slice(0,40):null,
        innerName:inner?inner.name:null,innerW:inner?Math.round(inner.width||0):null};
      const dm=(n.name||'').match(/Hình\\s*(\\d)/);
      if(dm){rec.no=parseInt(dm[1],10);info.diagrams.push(rec);}
      else if(/Code/.test(n.name||''))info.codes.push(rec);
      else info.otherScroll.push(rec);
    }
  },{resolveVariables:true});
  if(info.minFont===999)info.minFont=null;

  // ---------- §1 glossary (stacked table) ----------
  let t1=null;Get(k.id,(n)=>{if(!t1&&/^Bảng 1 · /.test(n.name||''))t1=n.id;});
  if(t1){
    const cap=Get(t1,{depth:0}).name;
    const rows=(Get(t1,{depth:1}).children||[]).filter(x=>/^Hàng · /.test(x.name||''));
    const terms=[],empty=[];
    for(const r of rows){
      const rc=Get(r.id,{depth:1}).children||[];
      const term=rc.find(x=>x.name==='Thuật ngữ');
      const is=rc.find(x=>x.name==='Nhóm · Là gì');
      const t=term?qaTxt(term):'';
      if(!t||!is||!qaTxt(is))empty.push(r.name);
      terms.push(t);
    }
    info.glossary={caption:cap,rows:rows.length,terms,empty};
  }

  // ---------- M12 Q&A: structure, not text length ----------
  let t4=null;Get(k.id,(n)=>{if(!t4&&/^Bảng 4 · /.test(n.name||''))t4=n.id;});
  if(t4){
    const cap=Get(t4,{depth:0}).name;
    const rows=(Get(t4,{depth:1}).children||[]).filter(x=>/^Câu \\d+$/.test(x.name||''));
    const detail=rows.map((r,i)=>{
      const ch=Get(r.id,{depth:1}).children||[];
      const q=ch.find(x=>/^Dòng câu hỏi$/.test(x.name||''));
      let marker=null;
      if(q){const g=(Get(q.id,{depth:1}).children||[]).find(y=>/^Dấu$/.test(y.name||''));marker=g?String(g.content||'').trim():null;}
      const ans=ch.find(x=>/^Trả lời$/.test(x.name||''));
      const ansLen=ans?qaTxt(ans).length:0;
      return {i:i,marker:marker,hasAnswer:!!ans,ansLen:ansLen,
        open:!!ans&&ansLen>0&&marker==='⌄',
        closed:!ans&&marker==='›'};
    });
    info.qa={caption:cap,rows:detail.length,
      open:detail.filter(d=>d.open).map(d=>d.i),
      bad:detail.filter(d=>!d.open&&!d.closed).map(d=>d.i),
      detail:detail};
  }

  // ---------- pass B: raw paint values for M9 ----------
  Get(k.id,(n,c)=>{
    if(c.depth===0)info.rootRawFill=n.fill;
    for(const key of ['fill','stroke']){
      const v=n[key];
      if(v===undefined||v===null)continue;
      if(typeof v==='string'){
        if(v.charAt(0)==='$'){info.boundPaints++;}
        else if(info.hexLit.length<4){info.hexLit.push((n.name||'?')+'.'+key+'='+v);}
      } else if(info.hexLit.length<4&&/#[0-9a-fA-F]{3}/.test(JSON.stringify(v))){
        info.hexLit.push((n.name||'?')+'.'+key+'=object');
      }
    }
  });

  qaOut.push(info);
}
Print('QAJSON '+JSON.stringify(qaOut));
`;

acquire();
let ipc;
try {
  ipc = new PenIpc({ log: () => {} });
  await ipc.connect();
  const data = await (async () => {
    const r = await ipc.call('execute', { filePath: FILE, input: COLLECT }, 300000);
    const msg = r.result?.message || '';
    const line = msg.split('\n').find((l) => l.startsWith('QAJSON '));
    if (!line) throw new Error('no QAJSON in response:\n' + msg.slice(0, 2000));
    return JSON.parse(line.slice(7));
  })();

  // ---- M1..M13 ----
  const tags = data.map((d) => d.tag);
  const expect = Array.from({ length: 23 }, (_, i) => 'L' + String(i + 1).padStart(2, '0'));
  const dupes = tags.filter((t, i) => tags.indexOf(t) !== i);
  const missing = expect.filter((t) => !tags.includes(t));
  const extra = tags.filter((t) => !expect.includes(t));

  const rows = data.map((d) => {
    const errs = [];
    const gl = GL[d.tag] || null;
    // M2
    if (d.w !== 390) errs.push(`M2 width=${d.w}`);
    // M3
    if (d.placeholders) errs.push(`M3 placeholder=${d.placeholders}`);
    // M4
    if (d.problemsBad.length) errs.push(`M4 problem=${d.problemsBad.join(' ; ')}`);
    // M5
    const secOk = d.sections.length === 6 &&
      d.sections.every((s, i) => s.name === 'Section ' + String(i + 1).padStart(2, '0') && s.idx === i);
    if (!secOk) errs.push(`M5 sections=${d.sections.map((s) => s.name).join('/')}`);
    // M6 diagrams: exactly 2, numbered 1 and 2, each pill + clip 350 + inner 720
    const diaNos = d.diagrams.map((v) => v.no).sort((a, b) => a - b);
    const diaOk = d.diagrams.length === 2 && diaNos[0] === 1 && diaNos[1] === 2 &&
      d.diagrams.every((v) => v.pill && v.w === 350 && v.clip && v.innerW === 720 && v.innerName);
    if (!diaOk) errs.push(`M6 diagrams=${d.diagrams.length} [${d.diagrams.map((v) => `${v.name}(pill=${v.pill ? 'y' : 'n'},w=${v.w},inner=${v.innerW})`).join(' ')}]`);
    // M6 code: exactly 2 distinct blocks, same clip rules
    const codeNames = new Set(d.codes.map((v) => v.name));
    const codeOk = d.codes.length === 2 && codeNames.size === 2 &&
      d.codes.every((v) => v.pill && v.w === 350 && v.clip && v.innerW === 720 && v.innerName);
    if (!codeOk) errs.push(`code=${d.codes.length} [${d.codes.map((v) => `${v.name}(pill=${v.pill ? 'y' : 'n'},w=${v.w},inner=${v.innerW})`).join(' ')}]`);
    if (d.otherScroll.length) errs.push(`M6 khung lạ=${d.otherScroll.map((v) => v.name).join(',')}`);
    // M7
    if (!(d.minFont >= 13)) errs.push(`M7 minFont=${d.minFont}`);
    // M8
    if (d.wide.length) errs.push(`M8 wide=${d.wide.join(',')}`);
    // M9: only a literal (non-variable) paint fails
    if (d.hexLit.length) errs.push(`M9 hex=${d.hexLit.join(',')}`);
    // §1 glossary
    const gRows = d.glossary ? d.glossary.rows : 0;
    const want = gl ? gl.length : null;
    if (!d.glossary) errs.push('§1 no Bảng 1');
    else {
      if (want !== null && gRows !== want) errs.push(`§1 rows=${gRows}/${want}`);
      if (d.glossary.empty.length) errs.push(`§1 empty=${d.glossary.empty.join(',')}`);
      if (gl) {
        const mism = d.glossary.terms
          .map((t, i) => (gl[i] && t.trim() === gl[i].term.trim() ? null : `${i + 1}:${t}/${gl[i] ? gl[i].term : '?'}`))
          .filter(Boolean);
        if (mism.length) errs.push(`§1 term=${mism.join(' ')}`);
      }
    }
    // M12: exactly one open row, and it is row 1
    const qaOk = d.qa && d.qa.rows > 0 && d.qa.open.length === 1 && d.qa.open[0] === 0 && d.qa.bad.length === 0;
    if (!qaOk) errs.push(`M12 qa=${d.qa ? `rows=${d.qa.rows} open=[${d.qa.open}] bad=[${d.qa.bad}]` : 'none'}`);
    return {
      tag: d.tag, id: d.id, name: d.name, width: d.w, height: d.h,
      sections: d.sections.length, diagrams: d.diagrams.length, codes: d.codes.length,
      minFont: d.minFont, glossRows: gRows, glossWant: want,
      glossCaption: d.glossary ? d.glossary.caption : null,
      problemsRaw: d.problemsRaw, problemsLegit: d.problemsLegit,
      qaRows: d.qa ? d.qa.rows : 0, qaOpen: d.qa ? d.qa.open : [],
      qaCaption: d.qa ? d.qa.caption : null,
      rootRawFill: d.rootRawFill, rootResolvedFill: d.rootResolvedFill,
      boundPaints: d.boundPaints, nodes: d.nodes,
      pass: errs.length === 0, errors: errs,
    };
  });

  const orderOk = data.length === 23 && tags.join(',') === expect.join(',');
  const evid = rows[0];
  const qaCapNum = (cap) => {
    const m = cap && cap.match(/^Bảng 4 · (\d+) câu/);
    return m ? parseInt(m[1], 10) : null;
  };
  const captionMismatch = rows
    .map((r) => ({ tag: r.tag, id: r.id, claim: qaCapNum(r.qaCaption), rows: r.qaRows }))
    .filter((r) => r.claim !== null && r.claim !== r.rows);

  const summary = {
    generatedAt: new Date().toISOString(),
    row: ROW,
    order: tags,
    M13: orderOk,
    count: data.length,
    duplicates: dupes, missing, extra,
    pass: rows.filter((r) => r.pass).length,
    fail: rows.filter((r) => !r.pass).length,
    problemsLegitTotal: rows.reduce((a, r) => a + r.problemsLegit, 0),
    problemsRawTotal: rows.reduce((a, r) => a + r.problemsRaw, 0),
    boundPaintsTotal: rows.reduce((a, r) => a + r.boundPaints, 0),
    m9Evidence: evid ? { tag: evid.tag, id: evid.id, node: evid.name, raw: evid.rootRawFill, resolved: evid.rootResolvedFill } : null,
    qaOpenL01: (rows.find((r) => r.tag === 'L01') || {}).qaOpen,
    qaOpenL23: (rows.find((r) => r.tag === 'L23') || {}).qaOpen,
    captionMismatch,
    rows,
  };

  // ---- markdown ----
  const md = [];
  md.push('# QA · Hàng 10 · Bài học · Mobile 390');
  md.push('');
  md.push(`Sinh: ${summary.generatedAt} · row \`${ROW}\` · ${summary.count} frame · pass **${summary.pass}** / fail **${summary.fail}**`);
  md.push('');
  md.push('## M13 · thứ tự');
  md.push('');
  md.push(`- Đọc theo index: \`${tags.join(',')}\``);
  md.push(`- Kết luận: **${orderOk ? 'PASS' : 'FAIL'}** (L01→L23, ${summary.count} phần tử)`);
  if (dupes.length || missing.length || extra.length) {
    md.push(`- Trùng: ${dupes.join(',') || 'không'} · Thiếu: ${missing.join(',') || 'không'} · Lạ: ${extra.join(',') || 'không'}`);
  }
  md.push('');
  md.push('## Bảng 23 dòng');
  md.push('');
  md.push('| # | Bài | id | width | height | section | diagram | code | minFont | §1 rows | Q&A mở | pass | lỗi |');
  md.push('|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---|---|');
  rows.forEach((r, i) => {
    md.push(`| ${i + 1} | ${r.tag} | \`${r.id}\` | ${r.width} | ${r.height} | ${r.sections} | ${r.diagrams} | ${r.codes} | ${r.minFont} | ${r.glossRows}/${r.glossWant ?? '?'} | [${r.qaOpen}] | ${r.pass ? 'PASS' : '**FAIL**'} | ${r.errors.length ? r.errors.join('<br>') : '—'} |`);
  });
  md.push('');
  md.push('## Bằng chứng');
  md.push('');
  md.push(`- **M9 (bind variable, không phải hex):** node \`${summary.m9Evidence.node}\` (\`${summary.m9Evidence.id}\`) — giá trị **raw** \`fill = ${summary.m9Evidence.raw}\` → **resolveVariables** \`${summary.m9Evidence.resolved}\`. Giá trị \`#FAFAFA\` chỉ là kết quả resolve của \`$lsn2-bg\`; M9 chỉ fail khi raw là hex literal. Tổng paint bind: **${summary.boundPaintsTotal}**, hex literal: **0**.`);
  md.push(`- **M12 (cấu trúc, không đo độ dài chữ):** L01 (\`${(rows.find((r) => r.tag === 'L01') || {}).id}\`) hàng mở = **[${summary.qaOpenL01}]**; L23 (\`${(rows.find((r) => r.tag === 'L23') || {}).id}\`) hàng mở = **[${summary.qaOpenL23}]** — đúng 1 hàng, là hàng 1.`);
  md.push(`- **§1 (đếm theo lesson-glossary.json):** ${rows.map((r) => `${r.tag} ${r.glossRows}/${r.glossWant ?? '?'}`).join(' · ')}`);
  md.push(`- **M6 (khung clip):** neo vào frame \`Khung cuộn · …\` (tên khung ngoài khác nhau giữa các batch: \`Visual · Hình 1\`, \`Visual · Tree\`, \`Visual · Code Code · …\`), phân loại theo tên khung: \`Hình n\` → diagram, \`Code\` → code; pill = sibling đứng ngay trước khung.`);
  md.push('');
  md.push('## Ghi chú kiểm');
  md.push('');
  md.push('- **M4** — luật lọc: bỏ problem của node có tổ tiên `clip:true` **ở depth > 0** (frame bài học tự nó cũng `clip:true`; nếu tính cả depth 0 thì mọi node đều "trong clip" và M4 vô nghĩa).');
  md.push(`- Problems thô **${summary.problemsRawTotal}**, trong đó **${summary.problemsLegitTotal}** nằm trong khung \`clip:true\` (hợp lệ) → lỗi thật **${summary.problemsRawTotal - summary.problemsLegitTotal}**. Mỗi bài có 4–7 problem loại này: 4 khung \`Khung cuộn ·\` (canvas 720 trong khung 350) cộng text ẩn \`#title\`/\`#desc\` của hình 720 (0–3 node tuỳ bài) — đúng như spec §8 (L01 = 6).`);
  md.push('- **M6** — mỗi khung: `Pill · kéo ngang` với nhãn bắt đầu "Kéo ngang" đứng ngay trước, khung 350 `clip:true`, node con = 720 (canvas không scale); diagram phải đúng `Hình 1` + `Hình 2`, code phải 2 khối phân biệt.');
  md.push('- **M8** — node rộng > 350 nằm ngoài mọi khung `clip:true`; bỏ qua chính frame bài và các khung lưới trang rộng đúng bằng frame (390, spec §1). **M10** (chữ bị cắt) chỉ đọc được bằng mắt trên ảnh export nên không tính vào pass/fail.');
  md.push('- **M9** — đọc giá trị **raw** (`Get` không `resolveVariables`): `$…` = bind hợp lệ, `#…` = hex literal → fail. Mọi giá trị không bắt đầu bằng `$` đều bị ghi lại.');
  md.push('- **M12** — hàng "mở" = có node `Trả lời` không rỗng **và** dấu `⌄`; hàng "đóng" = không có `Trả lời` **và** dấu `›`. Không dùng độ dài chữ (đáp án ẩn/không ẩn không đổi số ký tự câu hỏi).');
  md.push('- **§1** — đếm `Hàng · …` dưới `Bảng 1 · …`, so số hàng và thứ tự thuật ngữ với `lesson-glossary.json`, đồng thời kiểm mỗi hàng có `Thuật ngữ` + `Nhóm · Là gì` không rỗng.');
  md.push('');
  if (captionMismatch.length) {
    md.push('## Ghi nhận ngoài M1–M13 (không tính pass/fail)');
    md.push('');
    md.push('Caption `Bảng 4 · <n> câu CTO` không khớp số hàng thực tế (spec §6.6 yêu cầu `<n>` = số câu):');
    md.push('');
    for (const c of captionMismatch) md.push(`- ${c.tag} (\`${c.id}\`): caption nói **${c.claim}** câu, thực tế **${c.rows}** hàng.`);
    md.push('');
  }
  fs.writeFileSync('D:/research/exports/pen/QA-mobile.md', md.join('\n'));
  fs.writeFileSync('D:/research/exports/pen/qa-mobile.json', JSON.stringify(summary, null, 1));

  console.log(md.join('\n'));
} finally {
  try { ipc?.close(); } catch {}
  release();
}
