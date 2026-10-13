import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'D:/research/diagrams-v2';
const OUT = path.join(ROOT, 'diagrams');
const SRC = fs.readFileSync('D:/research/src/60-flows.js', 'utf8');

const C = { bg: '#0B0F14', panel: '#151B23', line: '#2A323D', fg: '#E8EDF2', muted: '#9AA6B2', accent: '#FFB000' };
const FB = 'Chivo, Arial, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function kit(fid, v) {
  const I = s => `${fid}-${v}-${s}`;
  let k = 0;
  const nid = () => I(`n${++k}`);
  const markers = `<marker id="${I('arr')}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${C.accent}"/></marker><marker id="${I('arr-m')}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${C.muted}"/></marker>`;
  const box = (x, y, w, h, t, s, o = {}) => {
    const cx = x + w / 2;
    const ty = s ? y + h / 2 - 1 : y + h / 2 + 5;
    let g = `<g id="${nid()}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.panel}" stroke="${o.stroke || C.line}" stroke-width="1.5"${o.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
    g += `<text x="${cx}" y="${ty}" text-anchor="middle" font-family="${FB}" font-size="14" font-weight="700" fill="${C.fg}">${esc(t)}</text>`;
    if (s) g += `<text x="${cx}" y="${y + h / 2 + 15}" text-anchor="middle" font-family="${FB}" font-size="14" fill="${C.muted}">${esc(s)}</text>`;
    return g + '</g>';
  };
  const edge = (d, o = {}) => `<path id="${nid()}" d="${d}" fill="none" stroke="${o.muted ? C.muted : C.accent}" stroke-width="1.5"${o.dash ? ' stroke-dasharray="5 4"' : ''} marker-end="url(#${I(o.muted ? 'arr-m' : 'arr')})"/>`;
  const text = (x, y, t, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || 'middle'}" font-family="${FB}" font-size="14" font-weight="${o.b ? 700 : 400}" fill="${o.fg ? C.fg : o.muted ? C.muted : C.accent}">${esc(t)}</text>`;
  const wrap = (W, H, title, desc, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${I('t')} ${I('d')}"><title id="${I('t')}">${esc(title)}</title><desc id="${I('d')}">${esc(desc)}</desc><defs>${markers}</defs><rect x="0" y="0" width="${W}" height="${H}" fill="${C.bg}"/>${body}</svg>`;
  return { box, edge, text, wrap };
}

const FLOWS = [
  {
    id: 'flow-request-lifecycle', status: 'PENDING-REVIEW',
    note: 'Vẽ đúng chuỗi CloudFront, API Gateway, ECS Fargate, RDS như bản gốc. L01 mô tả serverless nên cần chủ dự án xác nhận chuỗi này.',
    title: 'Vòng đời HTTP request', desc: 'Năm bước từ trình duyệt qua CloudFront, API Gateway, ECS Fargate tới RDS, rồi response quay ngược về client trên cùng connection.',
    desk: g => {
      const xs = [10, 136, 262, 388, 514];
      const L = [['Browser', 'gọi API'], ['CloudFront', 'TLS + cache'], ['API Gateway', 'JWT authorizer'], ['ECS Fargate', 'FastAPI'], ['RDS', 'Postgres']];
      let b = '';
      xs.forEach((x, i) => { b += g.box(x, 60, 104, 60, L[i][0], L[i][1]); if (i < 4) b += g.edge(`M${x + 104} 90 H${xs[i + 1]}`); });
      b += g.edge('M566 120 V156 H62 V120', { muted: true, dash: true });
      b += g.text(320, 178, 'response 200', { muted: true });
      b += g.text(320, 204, 'Keep-alive: handshake chỉ lần đầu', { muted: true });
      return { H: 220, body: b };
    },
    mob: g => {
      const ys = [20, 98, 176, 254, 332];
      const L = [['Browser', 'gọi API'], ['CloudFront', 'TLS + cache'], ['API Gateway', 'JWT authorizer'], ['ECS Fargate', 'FastAPI'], ['RDS', 'Postgres']];
      let b = '';
      ys.forEach((y, i) => { b += g.box(24, y, 312, 52, L[i][0], L[i][1]); if (i < 4) b += g.edge(`M180 ${y + 52} V${ys[i + 1]}`); });
      b += g.edge('M24 358 H12 V46 H24', { muted: true, dash: true });
      b += g.text(180, 416, 'response 200', { muted: true });
      b += g.text(180, 440, 'Keep-alive: handshake chỉ lần đầu', { muted: true });
      return { H: 452, body: b };
    }
  },
  {
    id: 'flow-cors-preflight', status: 'PASS-PENDING-RENDER', note: '',
    title: 'Luồng CORS preflight', desc: 'Hai lượt gửi: OPTIONS preflight để trình duyệt xin phép, rồi request thật sau khi header CORS được chấp nhận.',
    desk: g => {
      const xs = [12, 170, 328, 486];
      let b = g.text(12, 24, 'Preflight OPTIONS', { a: 'start', fg: true, b: true });
      ['Browser', 'API Gateway', 'Handler', 'Trả header'].forEach((t, i) => { b += g.box(xs[i], 36, 124, 50, t, ['', '+ CORS', 'FastAPI', 'Allow-Origin'][i]); });
      b += g.edge('M136 61 H170') + g.edge('M294 61 H328') + g.edge('M452 61 H486');
      b += g.edge('M548 86 V106 H74 V86', { muted: true, dash: true });
      b += g.text(310, 124, 'Access-Control-Allow-Origin', { muted: true });
      b += g.text(12, 152, 'Request thật POST', { a: 'start', fg: true, b: true });
      ['Browser', 'Kiểm tra origin', 'Ghi DB', 'Render UI'].forEach((t, i) => { b += g.box(xs[i], 166, 124, 50, t, ['', '', '201 Created', 'Vue cập nhật'][i]); });
      b += g.edge('M136 191 H170') + g.edge('M294 191 H328') + g.edge('M452 191 H486');
      return { H: 226, body: b };
    },
    mob: g => {
      let b = g.text(24, 28, 'Preflight OPTIONS', { a: 'start', fg: true, b: true });
      const A = [44, 116, 188, 260];
      ['Browser', 'API Gateway', 'Handler', 'Trả header'].forEach((t, i) => { b += g.box(24, A[i], 312, 48, t, ['', '+ CORS', 'FastAPI', 'Allow-Origin'][i]); if (i < 3) b += g.edge(`M180 ${A[i] + 48} V${A[i + 1]}`); });
      b += g.edge('M24 284 H12 V68 H24', { muted: true, dash: true });
      b += g.text(180, 324, 'Access-Control-Allow-Origin', { muted: true });
      b += g.text(24, 352, 'Request thật POST', { a: 'start', fg: true, b: true });
      const B = [368, 440, 512, 584];
      ['Browser', 'Kiểm tra origin', 'Ghi DB', 'Render UI'].forEach((t, i) => { b += g.box(24, B[i], 312, 48, t, ['', '', '201 Created', 'Vue cập nhật'][i]); if (i < 3) b += g.edge(`M180 ${B[i] + 48} V${B[i + 1]}`); });
      return { H: 648, body: b };
    }
  },
  {
    id: 'flow-vue-reactivity', status: 'PASS-PENDING-RENDER', note: '',
    title: 'Vue reactivity', desc: 'State reactive đi qua Proxy: đọc thì track phụ thuộc, ghi thì trigger, effect chạy lại và vá DOM.',
    desk: g => {
      let b = g.box(12, 92, 128, 56, 'reactive()', 'state.count') + g.box(180, 92, 128, 56, 'Proxy get/set', 'ref / shallowRef');
      b += g.box(348, 36, 128, 56, 'track', 'lúc đọc') + g.box(348, 148, 128, 56, 'trigger', 'lúc ghi') + g.box(506, 92, 122, 56, 'Effect chạy lại', 'vá DOM');
      b += g.edge('M140 120 H180') + g.edge('M308 120 H328 V64 H348') + g.edge('M308 120 H328 V176 H348');
      b += g.edge('M476 64 H567 V92') + g.edge('M476 176 H567 V148');
      b += g.text(320, 222, 'Batching: nhiều ghi trong một tick chỉ render một lần', { muted: true });
      return { H: 236, body: b };
    },
    mob: g => {
      let b = g.box(24, 20, 312, 52, 'reactive()', 'state.count') + g.box(24, 92, 312, 52, 'Proxy get/set', 'ref / shallowRef');
      b += g.box(24, 164, 150, 52, 'track', 'lúc đọc') + g.box(186, 164, 150, 52, 'trigger', 'lúc ghi') + g.box(24, 236, 312, 52, 'Effect chạy lại', 'vá DOM');
      b += g.edge('M180 72 V92') + g.edge('M180 144 V154 H99 V164') + g.edge('M180 154 H261 V164');
      b += g.edge('M99 216 V226 H180 V236') + g.edge('M261 216 V226 H180 V236');
      b += g.text(180, 322, 'Batching: nhiều ghi trong một tick', { muted: true });
      b += g.text(180, 346, 'chỉ render một lần', { muted: true });
      return { H: 360, body: b };
    }
  },
  {
    id: 'flow-upload-presign', status: 'PASS-PENDING-RENDER', note: '',
    title: 'Upload bằng presigned URL', desc: 'Client xin presigned URL từ API, PUT bytes thẳng lên S3, API ghi bản ghi và trả object key.',
    desk: g => {
      let b = g.box(12, 80, 116, 56, 'Vue client', 'chọn tệp') + g.box(172, 80, 116, 56, 'API ký URL', 'TTL 15 phút');
      b += g.box(332, 80, 116, 56, 'S3', 'nhận bytes') + g.box(492, 80, 116, 56, 'Ghi record', 'RDS');
      b += g.edge('M128 108 H172') + g.edge('M288 108 H332') + g.edge('M448 108 H492');
      b += g.edge('M230 80 V56 H70 V80', { muted: true, dash: true }) + g.text(150, 48, 'presigned URL', { muted: true });
      b += g.edge('M44 136 V156 H390 V136') + g.text(230, 176, 'PUT trực tiếp');
      b += g.edge('M550 136 V200 H96 V136', { muted: true, dash: true }) + g.text(320, 222, 'trả object key', { muted: true });
      return { H: 236, body: b };
    },
    mob: g => {
      let b = g.box(24, 20, 312, 52, 'Vue client', 'chọn tệp') + g.box(24, 92, 312, 52, 'API ký URL', 'TTL 15 phút');
      b += g.box(24, 164, 312, 52, 'S3', 'PUT trực tiếp') + g.box(24, 236, 312, 52, 'Ghi record', 'RDS');
      b += g.edge('M180 72 V92') + g.edge('M180 144 V164') + g.edge('M180 216 V236');
      b += g.edge('M24 262 H12 V46 H24', { muted: true, dash: true });
      b += g.text(180, 318, 'trả object key', { muted: true });
      b += g.text(180, 344, 'Client PUT trực tiếp, không qua Lambda', { muted: true });
      return { H: 360, body: b };
    }
  },
  {
    id: 'flow-queue-worker', status: 'PASS-PENDING-RENDER', note: '',
    title: 'Hàng đợi SQS và worker', desc: 'Producer gửi message vào SQS, worker nhận và xử lý; thành công thì DeleteMessage, lỗi nhiều lần thì vào DLQ.',
    desk: g => {
      let b = g.box(12, 50, 124, 56, 'Producer', 'FastAPI + outbox') + g.box(172, 50, 124, 56, 'SQS', 'standard queue');
      b += g.box(332, 50, 124, 56, 'Worker poll', 'ReceiveMessage') + g.box(492, 50, 124, 56, 'Xử lý', 'ghi DB');
      b += g.box(492, 150, 124, 56, 'DeleteMessage', 'ack') + g.box(172, 150, 124, 56, 'DLQ', 'maxReceive 3', { dash: true, stroke: C.muted });
      b += g.edge('M136 78 H172') + g.edge('M296 78 H332') + g.edge('M456 78 H492');
      b += g.edge('M554 106 V150');
      b += g.edge('M234 106 V150', { muted: true, dash: true });
      b += g.edge('M394 50 V32 H234 V50', { muted: true, dash: true }) + g.text(314, 24, 'hết visibility', { muted: true });
      b += g.text(320, 232, 'Poll dài giảm số lần trả rỗng', { muted: true });
      return { H: 240, body: b };
    },
    mob: g => {
      const ys = [20, 92, 164, 236, 308];
      const L = [['Producer', 'FastAPI + outbox'], ['SQS', 'standard queue'], ['Worker poll', 'ReceiveMessage'], ['Xử lý', 'ghi DB'], ['DeleteMessage', 'ack']];
      let b = '';
      ys.forEach((y, i) => { b += g.box(24, y, 312, 52, L[i][0], L[i][1]); if (i < 4) b += g.edge(`M180 ${y + 52} V${ys[i + 1]}`); });
      b += g.box(24, 380, 312, 52, 'DLQ', 'maxReceive 3', { dash: true, stroke: C.muted });
      b += g.edge('M336 190 H352 V406 H336', { muted: true, dash: true });
      b += g.edge('M24 190 H10 V118 H24', { muted: true, dash: true });
      b += g.text(180, 462, 'Poll dài giảm số lần trả rỗng', { muted: true });
      return { H: 476, body: b };
    }
  },
  {
    id: 'flow-lambda-cold-start', status: 'PENDING-REVIEW',
    note: 'Caption gốc ghi "ba giai đoạn" nhưng chỉ liệt kê Init và Handler; sơ đồ vẽ ba khối Tải ảnh chứa, Init, Handler. Chủ dự án cần xác nhận số giai đoạn.',
    title: 'Cold start Lambda', desc: 'Một lần gọi Lambda khi khởi động lạnh: tải ảnh chứa, Init chạy một lần cho mỗi môi trường, rồi Handler chạy cho mỗi request.',
    desk: g => {
      let b = g.box(12, 56, 130, 64, 'Tải ảnh chứa', 'chỉ khi cold', { dash: true, stroke: C.muted });
      b += g.box(154, 56, 270, 64, 'Init (import, global)', '1 lần / môi trường', { stroke: C.muted });
      b += g.box(436, 56, 192, 64, 'Handler', 'việc của request', { stroke: C.accent });
      b += `<line x1="12" y1="144" x2="628" y2="144" stroke="${C.line}" stroke-width="2"/>`;
      b += g.text(12, 170, 't = 0', { a: 'start', muted: true }) + g.text(628, 170, 'hết request', { a: 'end', muted: true });
      b += g.text(320, 198, 'Môi trường ấm: bỏ qua hai khối đầu', { muted: true });
      return { H: 210, body: b };
    },
    mob: g => {
      let b = g.box(24, 36, 312, 60, 'Tải ảnh chứa', 'chỉ khi cold', { dash: true, stroke: C.muted });
      b += g.box(24, 116, 312, 72, 'Init (import, global)', '1 lần / môi trường', { stroke: C.muted });
      b += g.box(24, 208, 312, 60, 'Handler', 'việc của request', { stroke: C.accent });
      b += g.edge('M180 96 V116', { muted: true }) + g.edge('M180 188 V208');
      b += g.text(180, 300, 'Môi trường ấm: bỏ qua hai khối đầu', { muted: true });
      b += g.text(180, 324, 'Init chạy 1 lần cho mỗi môi trường', { muted: true });
      return { H: 340, body: b };
    }
  },
  {
    id: 'flow-failure-retry', status: 'PASS-PENDING-RENDER', note: '',
    title: 'Retry và backoff', desc: 'Gọi dịch vụ, gặp lỗi tạm thời thì chờ backoff rồi thử lại; hết số lần cho phép thì đưa vào DLQ và cảnh báo.',
    desk: g => {
      let b = g.box(12, 76, 128, 52, 'Gọi dịch vụ', null) + g.box(172, 76, 128, 52, 'Lỗi 5xx', 'timeout');
      b += g.box(332, 76, 128, 52, 'Chờ backoff', '1s, 2s, 4s') + g.box(492, 76, 128, 52, 'Còn số lần?', 'attempts < 5');
      b += g.edge('M140 102 H172') + g.edge('M300 102 H332') + g.edge('M460 102 H492');
      b += g.edge('M556 76 V36 H76 V76', { dash: true }) + g.text(316, 28, 'thử lại');
      b += g.box(481, 156, 150, 52, 'DLQ + cảnh báo', 'cần người xử lý', { dash: true, stroke: C.muted });
      b += g.edge('M556 128 V156', { muted: true, dash: true }) + g.text(566, 146, 'hết lượt', { a: 'start', muted: true });
      b += g.text(320, 232, 'Chỉ retry lỗi tạm thời, lỗi 4xx thì không', { muted: true });
      return { H: 240, body: b };
    },
    mob: g => {
      const ys = [20, 92, 164, 236];
      const L = [['Gọi dịch vụ', null], ['Lỗi 5xx', 'timeout'], ['Chờ backoff', '1s, 2s, 4s'], ['Còn số lần?', 'attempts < 5']];
      let b = '';
      ys.forEach((y, i) => { b += g.box(24, y, 312, 52, L[i][0], L[i][1]); if (i < 3) b += g.edge(`M180 ${y + 52} V${ys[i + 1]}`); });
      b += g.edge('M24 262 H12 V46 H24', { dash: true });
      b += g.box(24, 308, 312, 52, 'DLQ + cảnh báo', 'cần người xử lý', { dash: true, stroke: C.muted });
      b += g.edge('M180 288 V308', { muted: true, dash: true }) + g.text(196, 302, 'hết lượt', { a: 'start', muted: true });
      b += g.text(180, 392, 'Chỉ retry lỗi tạm thời', { muted: true });
      b += g.text(180, 416, 'lỗi 4xx thì retry vô nghĩa', { muted: true });
      return { H: 432, body: b };
    }
  },
  {
    id: 'flow-db-transaction', status: 'PENDING-REVIEW',
    note: 'Sơ đồ chỉ thể hiện BEGIN, ghi, COMMIT và ROLLBACK như bản gốc. Check-then-act (L11) không được thể hiện; không tự đổi nội dung bài.',
    title: 'Transaction PostgreSQL', desc: 'BEGIN rồi các câu ghi; nếu tất cả thành công thì COMMIT, có lỗi thì ROLLBACK.',
    desk: g => {
      let b = g.box(12, 56, 124, 52, 'BEGIN', null) + g.box(172, 56, 124, 52, 'UPDATE orders', null);
      b += g.box(332, 56, 124, 52, 'UPDATE stock', null) + g.box(492, 56, 124, 52, 'INSERT audit', null);
      b += g.edge('M136 82 H172') + g.edge('M296 82 H332') + g.edge('M456 82 H492');
      b += g.box(300, 168, 130, 48, 'COMMIT', 'thành công', { stroke: C.accent });
      b += g.box(60, 168, 150, 48, 'ROLLBACK', 'có lỗi', { dash: true, stroke: C.muted });
      b += g.edge('M554 108 V136 H365 V168');
      b += g.edge('M394 108 V124 H135 V168', { muted: true, dash: true });
      b += g.text(320, 234, 'Deadlock: PostgreSQL huỷ một bên', { muted: true });
      return { H: 240, body: b };
    },
    mob: g => {
      const ys = [20, 92, 164, 236];
      const L = ['BEGIN', 'UPDATE orders', 'UPDATE stock', 'INSERT audit'];
      let b = '';
      ys.forEach((y, i) => { b += g.box(24, y, 312, 52, L[i], null); if (i < 3) b += g.edge(`M180 ${y + 52} V${ys[i + 1]}`); });
      b += g.box(24, 316, 150, 52, 'COMMIT', 'thành công', { stroke: C.accent });
      b += g.box(186, 316, 150, 52, 'ROLLBACK', 'có lỗi', { dash: true, stroke: C.muted });
      b += g.edge('M180 288 V302 H99 V316') + g.edge('M180 302 H261 V316', { muted: true, dash: true });
      b += g.text(180, 398, 'Deadlock: PostgreSQL huỷ một bên', { muted: true });
      return { H: 410, body: b };
    }
  },
  {
    id: 'flow-idempotency', status: 'PASS-PENDING-RENDER', note: '',
    title: 'Idempotency key', desc: 'Client gửi Idempotency-Key; server tra bảng khóa: đã có thì trả response cũ, chưa có thì thực thi rồi lưu kết quả.',
    desk: g => {
      let b = g.box(12, 92, 112, 56, 'Client', 'UUID v4') + g.box(160, 92, 112, 56, 'Tra khóa', 'UNIQUE key');
      b += g.box(328, 40, 150, 52, 'Đã có key', 'trả response cũ') + g.box(328, 144, 150, 52, 'Chưa có key', 'thực thi + lưu');
      b += g.box(512, 92, 116, 56, 'Trả response', '201 Created', { stroke: C.accent });
      b += g.edge('M124 120 H160') + g.edge('M272 120 H300 V66 H328') + g.edge('M272 120 H300 V170 H328');
      b += g.edge('M478 66 H496 V106 H512') + g.edge('M478 170 H496 V134 H512');
      b += g.text(320, 232, 'Retry không kèm key vẫn tạo bản ghi trùng', { muted: true });
      return { H: 240, body: b };
    },
    mob: g => {
      let b = g.box(24, 20, 312, 52, 'Client', 'UUID v4') + g.box(24, 92, 312, 52, 'Tra khóa', 'UNIQUE key');
      b += g.box(24, 164, 150, 52, 'Đã có key', 'trả response cũ') + g.box(186, 164, 150, 52, 'Chưa có key', 'thực thi + lưu');
      b += g.box(24, 236, 312, 52, 'Trả response', '201 Created', { stroke: C.accent });
      b += g.edge('M180 72 V92') + g.edge('M180 144 V154 H99 V164') + g.edge('M180 154 H261 V164');
      b += g.edge('M99 216 V226 H180 V236') + g.edge('M261 216 V226 H180 V236');
      b += g.text(180, 316, 'Retry không kèm key', { muted: true });
      b += g.text(180, 340, 'vẫn tạo bản ghi trùng', { muted: true });
      return { H: 352, body: b };
    }
  },
  {
    id: 'flow-ddos-defense', status: 'PASS-PENDING-RENDER', note: '',
    title: 'Phòng thủ DDoS theo tầng', desc: 'Botnet dội lưu lượng vào biên, WAF và giới hạn tốc độ; gói rác chết ở đó, người dùng thật đi qua tới tầng tính toán và cơ sở dữ liệu đã có trần.',
    desk: g => {
      let b = `<rect x="188" y="24" width="164" height="200" rx="8" fill="none" stroke="${C.line}" stroke-width="1.5"/>`;
      b += g.box(12, 28, 120, 56, 'BOTNET', 'vô số nguồn', { dash: true, stroke: C.muted });
      b += g.box(12, 140, 120, 56, 'Người thật', 'gửi request', { stroke: C.accent });
      b += g.box(200, 36, 140, 40, 'BIÊN', null) + g.box(200, 92, 140, 40, 'WAF', 'luật');
      b += g.box(200, 148, 140, 40, 'GIỚI HẠN', '429 / 503');
      b += g.box(430, 60, 196, 52, 'Lambda', 'trần concurrency') + g.box(430, 142, 196, 52, 'Cơ sở dữ liệu', 'trần connection pool');
      b += g.edge('M132 56 H200', { muted: true, dash: true }) + g.text(166, 48, 'gói rác', { muted: true });
      b += g.edge('M132 168 H200') + g.text(166, 190, 'khe hở');
      b += g.edge('M270 76 V92') + g.edge('M270 132 V148');
      b += g.edge('M340 168 H380 V86 H430') + g.edge('M340 168 H430');
      b += g.text(320, 232, 'Trần để chậm, không để sập', { muted: true });
      return { H: 240, body: b };
    },
    mob: g => {
      let b = g.box(24, 20, 150, 52, 'BOTNET', 'vô số nguồn', { dash: true, stroke: C.muted });
      b += g.box(186, 20, 150, 52, 'Người thật', 'gửi request', { stroke: C.accent });
      b += g.box(24, 92, 312, 52, 'BIÊN', null) + g.box(24, 164, 312, 52, 'WAF', 'luật');
      b += g.box(24, 236, 312, 52, 'GIỚI HẠN', '429 / 503');
      b += g.box(24, 308, 312, 52, 'Lambda', 'trần concurrency') + g.box(24, 380, 312, 52, 'Cơ sở dữ liệu', 'trần connection pool');
      b += g.edge('M99 72 V82 H180 V92', { muted: true, dash: true });
      b += g.edge('M180 144 V164') + g.edge('M180 216 V236');
      b += g.edge('M336 46 H348 V262 H336');
      b += g.edge('M180 288 V308') + g.edge('M24 262 H12 V406 H24');
      b += g.text(180, 462, 'Trần để chậm, không để sập', { muted: true });
      return { H: 476, body: b };
    }
  },
  {
    id: 'flow-auth-jwt', status: 'PASS-PENDING-RENDER', note: '',
    title: 'Xác thực JWT', desc: 'Token từ header Authorization được kiểm tra chữ ký, hạn dùng và scope; hợp lệ thì 200, sai hoặc hết hạn thì 401.',
    desk: g => {
      let b = g.box(12, 56, 116, 54, 'Login', 'POST /auth') + g.box(162, 56, 116, 54, 'Ký token', 'RS256, exp');
      b += g.box(312, 56, 116, 54, 'Bearer token', 'Authorization') + g.box(462, 56, 116, 54, 'Verify', 'ký, hạn, scope');
      b += g.edge('M128 83 H162') + g.edge('M278 83 H312') + g.edge('M428 83 H462');
      b += g.box(445, 170, 150, 44, '200 + dữ liệu', 'hợp lệ', { stroke: C.accent });
      b += g.box(161, 170, 150, 44, '401', 'sai / hết hạn', { dash: true, stroke: C.muted });
      b += g.edge('M520 110 V170') + g.edge('M480 110 V138 H236 V170', { muted: true, dash: true });
      b += g.text(320, 234, 'Không lưu session ở server', { muted: true });
      return { H: 240, body: b };
    },
    mob: g => {
      let b = g.box(24, 20, 312, 52, 'Login', 'POST /auth') + g.box(24, 92, 312, 52, 'Ký token', 'RS256, exp');
      b += g.box(24, 164, 312, 52, 'Bearer token', 'Authorization') + g.box(24, 236, 312, 52, 'Verify', 'ký, hạn, scope');
      b += g.edge('M180 72 V92') + g.edge('M180 144 V164') + g.edge('M180 216 V236');
      b += g.edge('M180 288 V298 H99 V308');
      b += g.box(24, 308, 150, 44, '200 + dữ liệu', 'hợp lệ', { stroke: C.accent });
      b += g.edge('M180 298 H261 V308', { muted: true, dash: true });
      b += g.box(186, 308, 150, 44, '401', 'sai / hết hạn', { dash: true, stroke: C.muted });
      b += g.text(180, 388, 'Không lưu session ở server', { muted: true });
      return { H: 404, body: b };
    }
  }
];

const EXCLUDED = [
  { id: 'flow-sqs-visibility', reason: 'Theo yêu cầu không vẽ. Nhưng 50-case.js dòng 81 (cs-05) vẫn tham chiếu id này; cần xác nhận trước khi merge.' },
  { id: 'flow-cicd-pipeline', reason: 'Theo yêu cầu không vẽ. Nhưng 50-case.js dòng 138 (cs-10) vẫn tham chiếu id này; cần xác nhận trước khi merge.' },
  { id: 'flow-L01-02', reason: 'Không có trong src. Chờ chủ dự án xác nhận có tạo hay không.' }
];
const NO_FLOW = ['L07', 'L08', 'L13', 'L14', 'L15', 'L16'];

const captions = {};
for (const m of SRC.matchAll(/id: '([^']+)',\s*caption: '([^']*)'/g)) captions[m[1]] = m[2];

fs.mkdirSync(OUT, { recursive: true });
const manifest = { generatedAt: new Date().toISOString(), source: 'D:/research/src/60-flows.js', tokens: { note: 'fg/muted/accent/ground đọc từ GetVariables() của untitled.pen (fc-*). Panel #151B23 KHÔNG có trong H5, là màu do script chọn.', map: { '--fg': 'fc-ink #E8EDF2', '--muted': 'fc-ink-2 #9AA6B2', '--accent': 'fc-amber #FFB000', 'ground': 'fc-ground #0B0F14', 'panel (không phải token H5)': '#151B23' }, fonts: { body: 'Chivo', mono: 'Share Tech Mono (đã đọc nhưng không dùng trong SVG)', head: 'Barlow Condensed (không dùng trong SVG)' } }, flows: [], excluded: EXCLUDED, noFlowLessons: NO_FLOW };

for (const f of FLOWS) {
  const gd = kit(f.id, 'd');
  const d = f.desk(gd);
  if (d.H > 240) throw new Error(`${f.id} desktop H>240`);
  fs.writeFileSync(path.join(OUT, `${f.id}.svg`), gd.wrap(640, d.H, f.title, f.desc, d.body) + '\n');
  const gm = kit(f.id, 'm');
  const m = f.mob(gm);
  fs.writeFileSync(path.join(OUT, `${f.id}.mobile.svg`), gm.wrap(360, m.H, f.title + ' (điện thoại)', f.desc, m.body) + '\n');
  manifest.flows.push({
    id: f.id, status: f.status, note: f.note, caption: captions[f.id] || '',
    desktop: { file: `diagrams/${f.id}.svg`, viewBox: `0 0 640 ${d.H}` },
    mobile: { file: `diagrams/${f.id}.mobile.svg`, viewBox: `0 0 360 ${m.H}` }
  });
}

const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
manifest.contrast = {};
for (const [name, col] of [['fg', C.fg], ['muted', C.muted], ['accent', C.accent]]) {
  manifest.contrast[name] = { onBg: ratio(col, C.bg), onPanel: ratio(col, C.panel) };
}
fs.writeFileSync(path.join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('built', manifest.flows.length, 'flows');
console.log(JSON.stringify(manifest.contrast));
