import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'D:/research/diagrams-v2';
const OUT = path.join(ROOT, 'diagrams');
const ARCH = path.join(ROOT, '_archive-h5-v1');

const C = { bg: '#FAFAFA', surf: '#FFFFFF', fg: '#0A0A0A', fg2: '#4A4A54', fg3: '#5F5F6A', line2: '#C9C9D1', acc: '#4F46E5', accInk: '#4338CA' };
const FONT = 'Be Vietnam Pro, system-ui, Arial, sans-serif';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r8 = v => Math.ceil(v / 8) * 8;

class D {
  constructor(fid, v, W, H) { Object.assign(this, { fid, v, W, H }); this.pre = `${fid}-${v}`; this.nodes = {}; this.out = []; this.labels = []; }
  id(s) { return `${this.pre}-${s}`; }
  mid(k) { const n = this.nodes[k]; return n.y + n.h / 2; }
  pt(n, side, off = 0) {
    const { x, y, w, h } = n;
    if (side === 'r') return [x + w, y + h / 2 + off];
    if (side === 'l') return [x, y + h / 2 + off];
    if (side === 't') return [x + w / 2 + off, y];
    return [x + w / 2 + off, y + h];
  }
  badge(n, step) {
    const cx = n.x, cy = n.y;
    return `<circle cx="${cx}" cy="${cy}" r="12" fill="${C.surf}" stroke="${C.acc}" stroke-width="1.5"/><text class="num" x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="700" fill="${C.accInk}">${step}</text>`;
  }
  node(key, x, y, w, h, t, s, o = {}) {
    if (x < 0 || y < 0 || x + w > this.W || y + h > this.H) throw new Error(`${this.pre} ${key} ngoài viewBox`);
    if ([x, y, w, h].some(v => v % 8)) throw new Error(`${this.pre} ${key} lệch lưới 8: ${[x, y, w, h]}`);
    for (const [k, n] of Object.entries(this.nodes)) if (x < n.x + n.w && n.x < x + w && y < n.y + n.h && n.y < y + h) throw new Error(`${this.pre} chồng ${key} & ${k}`);
    const alt = !!o.alt, acc = !!o.acc;
    const stroke = alt ? C.fg3 : acc ? C.acc : C.line2;
    const dash = alt ? ' stroke-dasharray="6 4"' : '';
    const sub = s !== undefined && s !== null;
    const ty = sub ? y + h / 2 - 3 : y + h / 2 + 5;
    const sy = y + h / 2 + 13;
    let g = `<rect class="box" data-key="${key}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${C.surf}" stroke="${stroke}" stroke-width="1.5"${dash}/>`;
    g += `<text class="lbl" x="${x + w / 2}" y="${ty}" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="700" fill="${C.fg}">${esc(t)}</text>`;
    if (sub) g += `<text class="lbl" x="${x + w / 2}" y="${sy}" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="400" fill="${alt ? C.fg3 : C.fg2}">${esc(s)}</text>`;
    this.nodes[key] = { x, y, w, h, alt, acc, step: o.step };
    this.out.push(g);
    if (o.step) this.out.push(this.badge(this.nodes[key], o.step));
  }
  edge(a, b, o = {}) {
    const A = this.nodes[a], B = this.nodes[b];
    if (!A || !B) throw new Error(`${this.pre} thiếu nút ${a}/${b}`);
    const via = typeof o.via === 'function' ? o.via(this) : (o.via || []);
    const pts = [this.pt(A, o.sa, o.oa || 0), ...via, this.pt(B, o.sb, o.ob || 0)];
    const d = 'M' + pts.map(p => `${p[0]} ${p[1]}`).join(' L ');
    const alt = !!o.alt;
    const mk = alt ? this.id('arrow-alt') : this.id('arrow');
    this.out.push(`<path class="edge" d="${d}" fill="none" stroke="${alt ? C.fg3 : C.acc}" stroke-width="1.5"${alt ? ' stroke-dasharray="6 4"' : ''} marker-end="url(#${mk})"/>`);
  }
  label(x, y, t, o = {}) {
    const alt = !!o.alt;
    this.out.push(`<text class="ext" x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" font-family="${FONT}" font-size="14" font-weight="400" fill="${alt ? C.fg3 : C.accInk}">${esc(t)}</text>`);
  }
  svg(title, desc) {
    const defs = `<defs><marker id="${this.id('arrow')}" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${C.acc}"/></marker><marker id="${this.id('arrow-alt')}" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${C.fg3}"/></marker></defs>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.W} ${this.H}" width="${this.W}" height="${this.H}" role="img" aria-labelledby="${this.id('t')} ${this.id('d')}"><title id="${this.id('t')}">${esc(title)}</title><desc id="${this.id('d')}">${esc(desc)}</desc>${defs}<rect class="bg" x="0" y="0" width="${this.W}" height="${this.H}" fill="${C.bg}"/>${this.out.join('')}</svg>\n`;
  }
}

// Mobile: cột đơn, nút 264 rộng bắt đầu x=64, cách nhau 96
function column(d, list) {
  list.forEach(([k, t, s, o], i) => d.node(k, 64, 48 + 96 * i, 264, 56, t, s, o));
}
const mobH = n => r8(48 + 96 * (n - 1) + 56 + 24);
const down = (a, b, alt) => ({ a, b, sa: 'b', sb: 't', alt });
const lane = (a, b, alt) => ({ a, b, sa: 'r', sb: 'r', alt, via: d => [[344, d.mid(a)], [344, d.mid(b)]] });

const FLOWS = [
  {
    id: 'flow-request-lifecycle', lessons: ['L01', 'L18', 'L22'], status: 'pending-review',
    title: 'Vòng đời HTTP request', desc: 'Request đi từ trình duyệt qua CloudFront, API Gateway, ECS Fargate và RDS; response đi ngược về trình duyệt.',
    readOrder: '1 Trình duyệt gọi API → 2 CloudFront → 3 API Gateway → 4 ECS Fargate → 5 RDS; response 200 đi ngược về trình duyệt (nét đứt)',
    notes: 'PENDING-REVIEW: caption gốc vẽ CloudFront, API Gateway, ECS Fargate, RDS. L01 mô tả kiến trúc serverless; cần chủ dự án xác nhận chuỗi này trước khi dùng cho L01. Caption cũng nhắc keep-alive, sơ đồ chỉ thể hiện response ngược đường.',
    H: 248,
    desk(d) {
      d.node('br', 24, 48, 128, 56, 'Trình duyệt', 'gọi API', { step: 1 });
      d.node('cf', 176, 48, 128, 56, 'CloudFront', 'TLS, cache', { step: 2 });
      d.node('apg', 328, 48, 136, 56, 'API Gateway', 'xác thực JWT', { step: 3 });
      d.node('ecs', 328, 144, 128, 56, 'ECS Fargate', 'FastAPI', { step: 4 });
      d.node('rds', 488, 144, 120, 56, 'RDS', 'PostgreSQL', { step: 5, acc: true });
      d.edge('br', 'cf', { sa: 'r', sb: 'l' });
      d.edge('cf', 'apg', { sa: 'r', sb: 'l' });
      d.edge('apg', 'ecs', { sa: 'b', oa: -4, sb: 't' });
      d.edge('ecs', 'rds', { sa: 'r', sb: 'l' });
      d.edge('rds', 'br', { sa: 'b', sb: 'b', alt: true, via: [[548, 216], [88, 216]] });
      d.label(200, 236, 'response 200', { alt: true });
    },
    mob(d) {
      column(d, [['br', 'Trình duyệt', 'gọi API', { step: 1 }], ['cf', 'CloudFront', 'TLS, cache', { step: 2 }], ['apg', 'API Gateway', 'xác thực JWT', { step: 3 }], ['ecs', 'ECS Fargate', 'FastAPI', { step: 4 }], ['rds', 'RDS', 'PostgreSQL', { step: 5, acc: true }]]);
      ['br|cf', 'cf|apg', 'apg|ecs', 'ecs|rds'].forEach(p => { const [a, b] = p.split('|'); d.edge(a, b, { sa: 'b', sb: 't' }); });
      d.edge('rds', 'br', { sa: 'r', sb: 'r', alt: true, via: x => [[344, x.mid('rds')], [344, x.mid('br')]] });
    }
  },
  {
    id: 'flow-auth-jwt', lessons: ['L02', 'L19'], status: 'ready',
    title: 'Xác thực JWT', desc: 'Đăng nhập, server ký token, client gửi kèm Bearer token, server kiểm tra chữ ký, hạn và scope rồi trả 200 hoặc 401.',
    readOrder: '1 Login → 2 Ký token → 3 Bearer token gửi kèm → 4 Verify (chữ ký, hạn, scope) → 5 200 + dữ liệu; nhánh nét đứt: 401',
    notes: 'Nhánh 401 là nhánh lỗi, không đánh số.',
    H: 216,
    desk(d) {
      d.node('login', 24, 48, 128, 56, 'Login', 'POST /auth', { step: 1 });
      d.node('sign', 176, 48, 128, 56, 'Ký token', 'RS256, exp', { step: 2 });
      d.node('bearer', 328, 48, 136, 56, 'Bearer token', 'Authorization', { step: 3 });
      d.node('verify', 488, 48, 128, 56, 'Verify', 'chữ ký, hạn', { step: 4 });
      d.node('ok', 488, 144, 128, 56, '200 OK', 'trả dữ liệu', { step: 5, acc: true });
      d.node('deny', 328, 144, 136, 56, '401', 'sai, hết hạn', { alt: true });
      d.edge('login', 'sign', { sa: 'r', sb: 'l' });
      d.edge('sign', 'bearer', { sa: 'r', sb: 'l' });
      d.edge('bearer', 'verify', { sa: 'r', sb: 'l' });
      d.edge('verify', 'ok', { sa: 'b', sb: 't' });
      d.edge('verify', 'deny', { sa: 'b', oa: -52, sb: 't', alt: true, via: [[500, 124], [396, 124]] });
    },
    mob(d) {
      column(d, [['login', 'Login', 'POST /auth', { step: 1 }], ['sign', 'Ký token', 'RS256, exp', { step: 2 }], ['bearer', 'Bearer token', 'Authorization', { step: 3 }], ['verify', 'Verify', 'chữ ký, hạn', { step: 4 }], ['ok', '200 OK', 'trả dữ liệu', { step: 5, acc: true }], ['deny', '401', 'sai, hết hạn', { alt: true }]]);
      d.edge('login', 'sign', { sa: 'b', sb: 't' });
      d.edge('sign', 'bearer', { sa: 'b', sb: 't' });
      d.edge('bearer', 'verify', { sa: 'b', sb: 't' });
      d.edge('verify', 'ok', { sa: 'b', sb: 't' });
      d.edge('verify', 'deny', { sa: 'r', sb: 'r', alt: true, via: x => [[344, x.mid('verify')], [344, x.mid('deny')]] });
    }
  },
  {
    id: 'flow-cors-preflight', lessons: ['L04'], status: 'ready',
    title: 'Luồng CORS preflight', desc: 'Trình duyệt gửi OPTIONS trước, server trả header CORS, rồi request thật được gửi và server kiểm tra origin.',
    readOrder: '1 Trình duyệt gửi OPTIONS → 2 Server trả header CORS → 3 Trình duyệt gửi request thật → 4 Server kiểm tra origin; Allow-Origin quay về trình duyệt (nét đứt)',
    notes: 'Caption dùng "Access-Control-Allow-Origin"; nhãn ngắn hoá thành Allow-Origin.',
    H: 168,
    desk(d) {
      d.node('opt', 24, 48, 128, 56, 'Trình duyệt', 'gửi OPTIONS', { step: 1 });
      d.node('hdr', 176, 48, 128, 56, 'Server', 'thêm CORS', { step: 2 });
      d.node('req', 328, 48, 128, 56, 'Trình duyệt', 'request thật', { step: 3 });
      d.node('chk', 480, 48, 128, 56, 'Server', 'xét origin', { step: 4, acc: true });
      d.edge('opt', 'hdr', { sa: 'r', sb: 'l' });
      d.edge('hdr', 'req', { sa: 'r', sb: 'l' });
      d.edge('req', 'chk', { sa: 'r', sb: 'l' });
      d.edge('hdr', 'opt', { sa: 'b', sb: 'b', alt: true, via: [[240, 128], [88, 128]] });
      d.label(164, 148, 'Allow-Origin', { alt: true });
    },
    mob(d) {
      column(d, [['opt', 'Trình duyệt', 'gửi OPTIONS', { step: 1 }], ['hdr', 'Server', 'thêm CORS', { step: 2 }], ['req', 'Trình duyệt', 'request thật', { step: 3 }], ['chk', 'Server', 'xét origin', { step: 4, acc: true }]]);
      d.edge('opt', 'hdr', { sa: 'b', sb: 't' });
      d.edge('hdr', 'req', { sa: 'b', sb: 't' });
      d.edge('req', 'chk', { sa: 'b', sb: 't' });
      d.edge('hdr', 'opt', { sa: 'r', sb: 'r', alt: true, via: x => [[344, x.mid('hdr')], [344, x.mid('opt')]] });
    }
  },
  {
    id: 'flow-upload-presign', lessons: ['L05', 'L20'], status: 'ready',
    title: 'Upload bằng presigned URL', desc: 'Client xin URL có hạn từ API, PUT bytes thẳng lên S3, rồi API ghi bản ghi vào cơ sở dữ liệu.',
    readOrder: '1 Client xin presigned URL → 2 API ký URL có hạn → 3 Client PUT thẳng lên S3 → 4 API ghi bản ghi vào RDS',
    notes: 'Bước 3 đi thẳng từ client lên S3, không qua API. URL ký là presigned URL.',
    H: 216,
    desk(d) {
      d.node('cl', 24, 48, 136, 56, 'Client (Vue)', 'xin presigned', { step: 1 });
      d.node('api1', 216, 48, 136, 56, 'API', 'ký URL có hạn', { step: 2 });
      d.node('s3', 24, 144, 136, 56, 'S3', 'nhận bytes', { step: 3 });
      d.node('db', 216, 144, 136, 56, 'API ghi', 'bản ghi, RDS', { step: 4, acc: true });
      d.edge('cl', 'api1', { sa: 'r', sb: 'l' });
      d.edge('cl', 's3', { sa: 'b', sb: 't' });
      d.edge('s3', 'db', { sa: 'r', sb: 'l' });
      d.label(104, 128, 'PUT trực tiếp', { anchor: 'start' });
    },
    mob(d) {
      column(d, [['cl', 'Client (Vue)', 'xin presigned', { step: 1 }], ['api1', 'API', 'ký URL có hạn', { step: 2 }], ['s3', 'S3', 'nhận bytes', { step: 3 }], ['db', 'API ghi', 'bản ghi, RDS', { step: 4, acc: true }]]);
      d.edge('cl', 'api1', { sa: 'b', sb: 't' });
      d.edge('s3', 'db', { sa: 'b', sb: 't' });
      d.edge('cl', 's3', { sa: 'l', oa: -20, sb: 'l', ob: 20, via: x => [[8, x.mid('cl') - 20], [8, x.mid('s3') + 20]] });
      d.edge('api1', 'cl', { sa: 'r', sb: 'r', alt: true, via: x => [[344, x.mid('api1')], [344, x.mid('cl')]] });
    }
  },
  {
    id: 'flow-queue-worker', lessons: ['L06', 'L21'], status: 'ready',
    title: 'Hàng đợi SQS và worker', desc: 'Producer đẩy message vào SQS, worker poll và xử lý, xoá message khi xong; quá số lần lỗi thì chuyển sang DLQ.',
    readOrder: '1 Producer đẩy message → 2 SQS → 3 Worker poll và xử lý → 4 Xoá message; nhánh nét đứt: quá 3 lần lỗi → DLQ',
    notes: 'Mốc visibility timeout nằm ở flow-sqs-visibility, không lặp lại ở đây.',
    H: 200,
    desk(d) {
      d.node('prod', 24, 48, 128, 56, 'Producer', 'đẩy message', { step: 1 });
      d.node('sqs', 176, 48, 128, 56, 'SQS', 'hàng đợi', { step: 2 });
      d.node('wk', 328, 48, 128, 56, 'Worker', 'poll, xử lý', { step: 3 });
      d.node('del', 480, 48, 128, 56, 'Xoá message', 'sau khi xong', { step: 4, acc: true });
      d.node('dlq', 176, 144, 128, 56, 'DLQ', 'message lỗi', { alt: true });
      d.edge('prod', 'sqs', { sa: 'r', sb: 'l' });
      d.edge('sqs', 'wk', { sa: 'r', sb: 'l' });
      d.edge('wk', 'del', { sa: 'r', sb: 'l' });
      d.edge('sqs', 'dlq', { sa: 'b', sb: 't', alt: true });
      d.label(248, 124, 'sau 3 lần', { anchor: 'start', alt: true });
    },
    mob(d) {
      column(d, [['prod', 'Producer', 'đẩy message', { step: 1 }], ['sqs', 'SQS', 'hàng đợi', { step: 2 }], ['wk', 'Worker', 'poll, xử lý', { step: 3 }], ['del', 'Xoá message', 'sau khi xong', { step: 4, acc: true }], ['dlq', 'DLQ', 'message lỗi', { alt: true }]]);
      d.edge('prod', 'sqs', { sa: 'b', sb: 't' });
      d.edge('sqs', 'wk', { sa: 'b', sb: 't' });
      d.edge('wk', 'del', { sa: 'b', sb: 't' });
      d.edge('sqs', 'dlq', { sa: 'r', sb: 'r', alt: true, via: x => [[344, x.mid('sqs')], [344, x.mid('dlq')]] });
    }
  },
  {
    id: 'flow-sqs-visibility', lessons: [], caseStudies: ['cs-05'], status: 'ready',
    title: 'Visibility timeout của SQS', desc: 'Khi worker A nhận message, message bị ẩn với worker khác trong 30 giây; xoá kịp thì xong, không kịp thì message hiện lại cho worker B.',
    readOrder: '1 Gửi message vào queue → 2 Worker A nhận, message ẩn 30 giây → 3 Worker A xoá message; nhánh nét đứt: hết 30 giây chưa xoá → message hiện lại → Worker B nhận lại',
    notes: 'Được cs-05 trong 50-case.js tham chiếu. Chưa có bài nào trong L01–L23 dùng flow này. Giá trị 30 giây là ví dụ minh hoạ, không phải cấu hình thật của dự án.',
    H: 208,
    desk(d) {
      d.node('send', 24, 48, 128, 56, 'Gửi message', 'vào queue', { step: 1 });
      d.node('wa', 176, 48, 128, 56, 'Worker A', 'ẩn 30 giây', { step: 2 });
      d.node('del', 328, 48, 128, 56, 'Xoá message', 'xong', { step: 3, acc: true });
      d.node('het', 176, 144, 128, 56, 'Hết 30 giây', 'chưa xoá', { alt: true });
      d.node('bb', 328, 144, 128, 56, 'Worker B', 'nhận lại', { alt: true });
      d.edge('send', 'wa', { sa: 'r', sb: 'l' });
      d.edge('wa', 'del', { sa: 'r', sb: 'l' });
      d.edge('wa', 'het', { sa: 'b', sb: 't', alt: true });
      d.edge('het', 'bb', { sa: 'r', sb: 'l', alt: true });
      d.label(248, 124, 'không kịp', { anchor: 'start', alt: true });
    },
    mob(d) {
      column(d, [['send', 'Gửi message', 'vào queue', { step: 1 }], ['wa', 'Worker A', 'ẩn 30 giây', { step: 2 }], ['del', 'Xoá message', 'xong', { step: 3, acc: true }], ['het', 'Hết 30 giây', 'chưa xoá', { alt: true }], ['bb', 'Worker B', 'nhận lại', { alt: true }]]);
      d.edge('send', 'wa', { sa: 'b', sb: 't' });
      d.edge('wa', 'del', { sa: 'b', sb: 't' });
      d.edge('het', 'bb', { sa: 'b', sb: 't', alt: true });
      d.edge('wa', 'het', { sa: 'r', sb: 'r', alt: true, via: x => [[344, x.mid('wa')], [344, x.mid('het')]] });
    }
  },
  {
    id: 'flow-db-transaction', lessons: ['L11'], status: 'pending-review',
    title: 'Transaction PostgreSQL', desc: 'BEGIN, ghi nhiều bảng, COMMIT khi mọi bước thành công; có lỗi thì ROLLBACK để hoàn tác toàn bộ.',
    readOrder: '1 BEGIN → 2 UPDATE orders → 3 UPDATE stock → 4 COMMIT khi mọi bước xong; nhánh nét đứt: có lỗi → ROLLBACK',
    notes: 'PENDING-REVIEW: L11 dạy check-then-act dưới READ COMMITTED (hai giao dịch cùng kiểm tra rồi cùng ghi). BEGIN/COMMIT không thể hiện được tình huống đó. Chưa đổi nội dung bài. Cần thêm sơ đồ riêng hoặc chủ dự án xác nhận.',
    H: 208,
    desk(d) {
      d.node('begin', 24, 48, 128, 56, 'BEGIN', 'mở giao dịch', { step: 1 });
      d.node('upo', 176, 48, 128, 56, 'UPDATE', 'bảng orders', { step: 2 });
      d.node('ups', 328, 48, 128, 56, 'UPDATE', 'bảng stock', { step: 3 });
      d.node('com', 480, 48, 128, 56, 'COMMIT', 'xong hết', { step: 4, acc: true });
      d.node('rb', 328, 144, 128, 56, 'ROLLBACK', 'hoàn tác hết', { alt: true });
      d.edge('begin', 'upo', { sa: 'r', sb: 'l' });
      d.edge('upo', 'ups', { sa: 'r', sb: 'l' });
      d.edge('ups', 'com', { sa: 'r', sb: 'l' });
      d.edge('ups', 'rb', { sa: 'b', sb: 't', alt: true });
      d.label(400, 124, 'có lỗi', { anchor: 'start', alt: true });
    },
    mob(d) {
      column(d, [['begin', 'BEGIN', 'mở giao dịch', { step: 1 }], ['upo', 'UPDATE', 'bảng orders', { step: 2 }], ['ups', 'UPDATE', 'bảng stock', { step: 3 }], ['rb', 'ROLLBACK', 'hoàn tác hết', { alt: true }], ['com', 'COMMIT', 'xong hết', { step: 4, acc: true }]]);
      d.edge('begin', 'upo', { sa: 'b', sb: 't' });
      d.edge('upo', 'ups', { sa: 'b', sb: 't' });
      d.edge('ups', 'rb', { sa: 'b', sb: 't', alt: true });
      d.edge('ups', 'com', { sa: 'r', sb: 'r', via: x => [[344, x.mid('ups')], [344, x.mid('com')]] });
    }
  },
  {
    id: 'flow-idempotency', lessons: ['L17'], status: 'ready',
    title: 'Idempotency key', desc: 'Client gửi Idempotency-Key; server tra khóa đã lưu: nếu đã có thì trả lại response cũ, chưa có thì thực thi và lưu kết quả.',
    readOrder: '1 Client gửi kèm key → 2 Server tra khóa đã lưu chưa → 3 Thực thi và lưu kết quả → 4 Trả response; nhánh nét đứt: đã có key → trả response cũ',
    notes: 'Khóa phía server. Gửi lại không kèm key vẫn có thể tạo bản ghi trùng; sơ đồ không thể hiện điều này.',
    H: 208,
    desk(d) {
      d.node('cl', 24, 48, 128, 56, 'Client', 'gửi kèm key', { step: 1 });
      d.node('chk', 176, 48, 128, 56, 'Tra khóa', 'đã lưu chưa?', { step: 2 });
      d.node('run', 328, 48, 128, 56, 'Thực thi', 'lưu kết quả', { step: 3 });
      d.node('resp', 480, 48, 136, 56, 'Trả response', '201 Created', { step: 4, acc: true });
      d.node('old', 176, 144, 200, 56, 'Đã có key', 'trả response cũ', { alt: true });
      d.edge('cl', 'chk', { sa: 'r', sb: 'l' });
      d.edge('chk', 'run', { sa: 'r', sb: 'l' });
      d.edge('run', 'resp', { sa: 'r', sb: 'l' });
      d.edge('chk', 'old', { sa: 'b', sb: 't', ob: -36, alt: true });
      d.edge('old', 'resp', { sa: 'r', sb: 'b', alt: true, via: [[548, 172]] });
      d.label(248, 124, 'đã có key', { anchor: 'start', alt: true });
      d.label(460, 164, 'trả lại', { alt: true });
    },
    mob(d) {
      column(d, [['cl', 'Client', 'gửi kèm key', { step: 1 }], ['chk', 'Tra khóa', 'đã lưu chưa?', { step: 2 }], ['run', 'Thực thi', 'lưu kết quả', { step: 3 }], ['resp', 'Trả response', '201 Created', { step: 4, acc: true }], ['old', 'Đã có key', 'trả response cũ', { alt: true }]]);
      d.edge('cl', 'chk', { sa: 'b', sb: 't' });
      d.edge('chk', 'run', { sa: 'b', sb: 't' });
      d.edge('run', 'resp', { sa: 'b', sb: 't' });
      d.edge('chk', 'old', { sa: 'l', oa: -20, sb: 'l', ob: -20, alt: true, via: x => [[8, x.mid('chk') - 20], [8, x.mid('old') - 20]] });
      d.edge('old', 'resp', { sa: 'r', oa: 12, sb: 'r', ob: 0, alt: true, via: x => [[352, x.mid('old') + 12], [352, x.mid('resp')]] });
    }
  },
  {
    id: 'flow-lambda-cold-start', lessons: ['L03', 'L10'], status: 'pending-review',
    title: 'Cold start của Lambda', desc: 'Lần gọi đầu khi môi trường chưa có: Init chạy trước, Handler chạy sau. Môi trường đã ấm thì bỏ qua Init.',
    readOrder: '1 Init (import, biến global) → 2 Handler; hàng dưới, nét đứt: môi trường ấm bỏ qua Init → Handler',
    notes: 'PENDING-REVIEW: theo brief chỉ vẽ Init và Handler. Caption gốc trong 60-flows.js ghi "Ba giai đoạn" và aria-label có thêm Runtime, nhưng số giai đoạn trong sơ đồ chỉ có hai. Cần chủ dự án chốt số giai đoạn trước khi giao. Init chạy một lần cho mỗi môi trường thực thi, Handler chạy mỗi lần gọi.',
    H: 216,
    desk(d) {
      d.node('init', 24, 48, 240, 56, 'Init', 'import, biến global', { step: 1 });
      d.node('hand', 328, 48, 240, 56, 'Handler', 'mỗi lần gọi', { step: 2, acc: true });
      d.node('warm', 24, 144, 240, 56, 'Môi trường ấm', 'bỏ qua Init', { alt: true });
      d.node('hand2', 328, 144, 240, 56, 'Handler', 'mỗi lần gọi', { alt: true });
      d.edge('init', 'hand', { sa: 'r', sb: 'l' });
      d.edge('warm', 'hand2', { sa: 'r', sb: 'l', alt: true });
      d.label(296, 68, 'lần đầu');
      d.label(296, 164, 'lần sau', { alt: true });
    },
    mob(d) {
      column(d, [['init', 'Init', 'import, biến global', { step: 1 }], ['hand', 'Handler', 'mỗi lần gọi', { step: 2, acc: true }], ['warm', 'Môi trường ấm', 'bỏ qua Init', { alt: true }], ['hand2', 'Handler', 'mỗi lần gọi', { alt: true }]]);
      d.edge('init', 'hand', { sa: 'b', sb: 't' });
      d.edge('warm', 'hand2', { sa: 'b', sb: 't', alt: true });
    }
  },
  {
    id: 'flow-failure-retry', lessons: ['L09'], status: 'ready',
    title: 'Retry với backoff', desc: 'Gọi dịch vụ, lỗi tạm thời thì chờ lâu dần rồi thử lại; hết số lần cho phép thì đưa sang DLQ và cảnh báo.',
    readOrder: '1 Gọi dịch vụ → 2 Lỗi tạm thời → 3 Chờ backoff → 4 Còn lượt? Còn thì thử lại (nét đứt); hết lượt thì DLQ + cảnh báo (nét đứt)',
    notes: 'Chỉ retry lỗi tạm thời; lỗi 4xx không nằm trong vòng lặp. Jitter có trong caption gốc nhưng không vẽ chi tiết.',
    H: 208,
    desk(d) {
      d.node('call', 24, 48, 128, 56, 'Gọi dịch vụ', 'lần thử', { step: 1 });
      d.node('err', 176, 48, 136, 56, 'Lỗi tạm thời', '5xx, timeout', { step: 2 });
      d.node('wait', 336, 48, 136, 56, 'Chờ backoff', '1s, 2s, 4s', { step: 3 });
      d.node('check', 496, 48, 128, 56, 'Còn lượt?', 'tối đa 5 lần', { step: 4 });
      d.node('dlq', 472, 144, 152, 56, 'DLQ + cảnh báo', 'cần người xem', { alt: true });
      d.edge('call', 'err', { sa: 'r', sb: 'l' });
      d.edge('err', 'wait', { sa: 'r', sb: 'l' });
      d.edge('wait', 'check', { sa: 'r', sb: 'l' });
      d.edge('check', 'dlq', { sa: 'b', sb: 't', ob: 12, alt: true });
      d.edge('check', 'call', { sa: 'b', oa: -40, sb: 'b', alt: true, via: [[520, 128], [88, 128]] });
      d.label(200, 148, 'thử lại', { alt: true });
      d.label(568, 124, 'hết lượt', { anchor: 'start', alt: true });
    },
    mob(d) {
      column(d, [['call', 'Gọi dịch vụ', 'lần thử', { step: 1 }], ['err', 'Lỗi tạm thời', '5xx, timeout', { step: 2 }], ['wait', 'Chờ backoff', '1s, 2s, 4s', { step: 3 }], ['check', 'Còn lượt?', 'tối đa 5 lần', { step: 4 }], ['dlq', 'DLQ + cảnh báo', 'cần người xem', { alt: true }]]);
      d.edge('call', 'err', { sa: 'b', sb: 't' });
      d.edge('err', 'wait', { sa: 'b', sb: 't' });
      d.edge('wait', 'check', { sa: 'b', sb: 't' });
      d.edge('check', 'dlq', { sa: 'b', sb: 't', alt: true });
      d.edge('check', 'call', { sa: 'r', sb: 'r', alt: true, via: x => [[344, x.mid('check')], [344, x.mid('call')]] });
    }
  },
  {
    id: 'flow-vue-reactivity', lessons: ['L12'], status: 'ready',
    title: 'Reactivity của Vue 3', desc: 'Đọc state qua Proxy sẽ ghi nhớ phụ thuộc; ghi state sẽ kích hoạt effect chạy lại và vá DOM tối thiểu.',
    readOrder: '1 Đọc state qua Proxy get → 2 Ghi state qua Proxy set → 3 Effect chạy lại → 4 Vá DOM phần thay đổi; nét đứt: effect đã ghi nhớ phụ thuộc lúc đọc',
    notes: 'Mô hình đơn giản. Batching (nhiều lần ghi trong một tick chỉ render một lần) không được thể hiện.',
    H: 144,
    desk(d) {
      d.node('read', 24, 48, 128, 56, 'Đọc state', 'Proxy get', { step: 1 });
      d.node('write', 176, 48, 128, 56, 'Ghi state', 'Proxy set', { step: 2 });
      d.node('eff', 328, 48, 128, 56, 'Effect', 'chạy lại', { step: 3 });
      d.node('patch', 480, 48, 128, 56, 'Vá DOM', 'chỉ phần đổi', { step: 4, acc: true });
      d.edge('read', 'write', { sa: 'r', sb: 'l' });
      d.edge('write', 'eff', { sa: 'r', sb: 'l' });
      d.edge('eff', 'patch', { sa: 'r', sb: 'l' });
      d.edge('read', 'eff', { sa: 'b', sb: 'b', alt: true, via: [[88, 128], [392, 128]] });
      d.label(240, 120, 'đã track', { alt: true });
    },
    mob(d) {
      column(d, [['read', 'Đọc state', 'Proxy get', { step: 1 }], ['write', 'Ghi state', 'Proxy set', { step: 2 }], ['eff', 'Effect', 'chạy lại', { step: 3 }], ['patch', 'Vá DOM', 'chỉ phần đổi', { step: 4, acc: true }]]);
      d.edge('read', 'write', { sa: 'b', sb: 't' });
      d.edge('write', 'eff', { sa: 'b', sb: 't' });
      d.edge('eff', 'patch', { sa: 'b', sb: 't' });
      d.edge('read', 'eff', { sa: 'r', sb: 'r', alt: true, via: x => [[344, x.mid('read')], [344, x.mid('eff')]] });
    }
  },
  {
    id: 'flow-cicd-pipeline', lessons: [], caseStudies: ['cs-10'], status: 'ready',
    title: 'Pipeline CI/CD', desc: 'Commit kích hoạt workflow, chạy test và lint, build image, đẩy lên ECR, rồi triển khai lên ECS; lỗi ở test thì dừng.',
    readOrder: '1 Commit → 2 Test + lint → 3 Build image → 4 Push ECR → 5 Deploy ECS; nhánh nét đứt: test lỗi → dừng pipeline',
    notes: 'Được cs-10 trong 50-case.js tham chiếu. Tên công cụ CI cụ thể không được vẽ vì caption gốc không nêu.',
    H: 208,
    desk(d) {
      d.node('commit', 24, 48, 128, 56, 'Commit', 'kích hoạt CI', { step: 1 });
      d.node('test', 176, 48, 128, 56, 'Test + lint', 'chạy test', { step: 2 });
      d.node('build', 328, 48, 128, 56, 'Build image', 'Docker', { step: 3 });
      d.node('ecr', 480, 48, 128, 56, 'Push ECR', 'đẩy image', { step: 4 });
      d.node('deploy', 480, 144, 128, 56, 'Deploy ECS', 'task mới', { step: 5, acc: true });
      d.node('stop', 176, 144, 152, 56, 'Dừng pipeline', 'test lỗi', { alt: true });
      d.edge('commit', 'test', { sa: 'r', sb: 'l' });
      d.edge('test', 'build', { sa: 'r', sb: 'l' });
      d.edge('build', 'ecr', { sa: 'r', sb: 'l' });
      d.edge('ecr', 'deploy', { sa: 'b', sb: 't' });
      d.edge('test', 'stop', { sa: 'b', sb: 't', ob: -12, alt: true });
      d.label(248, 124, 'lỗi', { anchor: 'start', alt: true });
    },
    mob(d) {
      column(d, [['commit', 'Commit', 'kích hoạt CI', { step: 1 }], ['test', 'Test + lint', 'chạy test', { step: 2 }], ['build', 'Build image', 'Docker', { step: 3 }], ['ecr', 'Push ECR', 'đẩy image', { step: 4 }], ['deploy', 'Deploy ECS', 'task mới', { step: 5, acc: true }], ['stop', 'Dừng pipeline', 'test lỗi', { alt: true }]]);
      d.edge('commit', 'test', { sa: 'b', sb: 't' });
      d.edge('test', 'build', { sa: 'b', sb: 't' });
      d.edge('build', 'ecr', { sa: 'b', sb: 't' });
      d.edge('ecr', 'deploy', { sa: 'b', sb: 't' });
      d.edge('test', 'stop', { sa: 'r', sb: 'r', alt: true, via: x => [[344, x.mid('test')], [344, x.mid('stop')]] });
    }
  },
  {
    id: 'flow-ddos-defense', lessons: ['L23'], status: 'ready',
    title: 'Phòng thủ DDoS theo tầng', desc: 'Botnet bị hấp thụ ở biên; người dùng thật qua WAF và giới hạn tốc độ, tới Lambda và Database đã có trần.',
    readOrder: '1 Người thật gửi request → 2 WAF và giới hạn → 3 Lambda (trần đồng thời) → 4 Database (trần kết nối); botnet nét đứt bị hấp thụ ở Biên',
    notes: 'Không phải kiến trúc thật của dự án; mô hình tầng. Chi phí và tên dịch vụ biên không vẽ.',
    H: 208,
    desk(d) {
      d.node('bot', 24, 48, 128, 56, 'Botnet', 'vô số nguồn', { alt: true });
      d.node('bien', 176, 48, 152, 56, 'Biên', 'hấp thụ tải lớn');
      d.node('user', 24, 144, 128, 56, 'Người thật', 'gửi request', { step: 1 });
      d.node('waf', 176, 144, 136, 56, 'WAF', 'luật, giới hạn', { step: 2 });
      d.node('lam', 336, 144, 144, 56, 'Lambda', 'trần đồng thời', { step: 3 });
      d.node('db', 504, 144, 128, 56, 'Database', 'trần kết nối', { step: 4, acc: true });
      d.edge('bot', 'bien', { sa: 'r', sb: 'l', alt: true });
      d.edge('user', 'waf', { sa: 'r', sb: 'l' });
      d.edge('bien', 'waf', { sa: 'b', oa: -8, sb: 't' });
      d.edge('waf', 'lam', { sa: 'r', sb: 'l' });
      d.edge('lam', 'db', { sa: 'r', sb: 'l' });
    },
    mob(d) {
      column(d, [['bot', 'Botnet', 'vô số nguồn', { alt: true }], ['user', 'Người thật', 'gửi request', { step: 1 }], ['bien', 'Biên', 'hấp thụ tải lớn'], ['waf', 'WAF', 'luật, giới hạn', { step: 2 }], ['lam', 'Lambda', 'trần đồng thời', { step: 3 }], ['db', 'Database', 'trần kết nối', { step: 4, acc: true }]]);
      d.edge('user', 'bien', { sa: 'b', sb: 't' });
      d.edge('bien', 'waf', { sa: 'b', sb: 't' });
      d.edge('waf', 'lam', { sa: 'b', sb: 't' });
      d.edge('lam', 'db', { sa: 'b', sb: 't' });
      d.edge('bot', 'bien', { sa: 'r', sb: 'r', alt: true, via: x => [[344, x.mid('bot')], [344, x.mid('bien')]] });
    }
  }
];

const GAPS = [
  ['L07', ''], ['L08', ''], ['L13', ''], ['L14', ''], ['L15', ''], ['L16', '']
].map(([lesson]) => ({
  id: `flow-${lesson}`, lesson, status: 'placeholder',
  text: `RESEARCH_GAP: flow-${lesson}, sơ đồ chưa có`,
  note: `Bài ${lesson} chưa có flow trong src/60-flows.js. Không vẽ hình thay thế; cần owner cung cấp luồng hoặc xác nhận không cần.`
}));

// Archive v1 (H5 colors) instead of deleting
fs.mkdirSync(ARCH, { recursive: true });
for (const f of fs.existsSync(OUT) ? fs.readdirSync(OUT) : []) {
  const from = path.join(OUT, f), to = path.join(ARCH, f);
  if (!fs.existsSync(to)) fs.copyFileSync(from, to);
}
if (fs.existsSync(path.join(ROOT, 'manifest.json')) && !fs.existsSync(path.join(ARCH, 'manifest.json'))) fs.copyFileSync(path.join(ROOT, 'manifest.json'), path.join(ARCH, 'manifest.json'));
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f));

const manifest = [];
for (const f of FLOWS) {
  const dd = new D(f.id, 'd', 640, f.H);
  f.desk(dd);
  fs.writeFileSync(path.join(OUT, `${f.id}.svg`), dd.svg(f.title, f.desc));
  const n = Object.keys(f.mobNodes || {}).length;
  const mh = (() => {
    // count mobile nodes by running once
    const probe = new D(f.id, 'm', 360, 2000);
    f.mob(probe);
    return mobH(Object.keys(probe.nodes).length);
  })();
  const dm = new D(f.id, 'm', 360, mh);
  f.mob(dm);
  fs.writeFileSync(path.join(OUT, `${f.id}.mobile.svg`), dm.svg(f.title + ' (điện thoại)', f.desc));
  manifest.push({
    id: f.id,
    lessons: f.lessons,
    ...(f.caseStudies ? { caseStudies: f.caseStudies } : {}),
    viewBoxDesktop: `0 0 640 ${f.H}`,
    viewBoxMobile: `0 0 360 ${mh}`,
    readOrder: f.readOrder,
    status: f.status,
    notes: f.notes
  });
}
manifest.push(...GAPS.map(g => ({ id: g.id, lessons: [g.lesson], status: 'placeholder', flowGap: g.text, notes: g.note })));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('svg files', FLOWS.length * 2, 'manifest entries', manifest.length);
