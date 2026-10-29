// L19 — mô phỏng single-flight: 40 request cùng nhận 401 thì refresh chạy mấy lần.
//
// Đây là MÔ PHỎNG bằng JavaScript thuần: không thư viện, không server thật,
// không token thật. Cái được mô phỏng đúng hai cơ chế:
//   - endpoint nghiệp vụ trả 401 khi access token không còn trong danh sách còn hạn
//   - endpoint /auth/refresh xoay vòng: mỗi lần cấp cặp mới thì refresh token cũ chết
// Cái được đo là SỐ LỜI GỌI, không phải độ trễ hay thông lượng.

const N = 40;
const REFRESH_URL = "/auth/refresh";

const tick = () => new Promise((resolve) => setImmediate(resolve));

class AuthServer {
  constructor() {
    this.liveAccess = new Set(); // "at-0" đã hết hạn, nên tập này rỗng
    this.liveRefresh = new Set(["rt-0"]);
    this.refreshCalls = 0;
    this.refreshOk = 0;
    this.refreshRejected = 0;
    this.apiCalls = 0;
  }

  async api(token) {
    this.apiCalls += 1;
    await tick();
    if (this.liveAccess.has(token)) return { status: 200, body: { ok: true } };
    return { status: 401, body: { code: "token_expired" } };
  }

  async refresh(rt) {
    this.refreshCalls += 1;
    await tick();
    if (!this.liveRefresh.has(rt)) {
      // Refresh token đã bị xoay vòng ở lời gọi trước: lời gọi này chắc chắn thất bại.
      this.refreshRejected += 1;
      return { status: 401, body: { code: "refresh_reused" } };
    }
    this.liveRefresh.delete(rt);
    const pair = {
      access_token: `at-${this.refreshCalls}`,
      refresh_token: `rt-${this.refreshCalls}`,
    };
    this.liveAccess.add(pair.access_token);
    this.liveRefresh.add(pair.refresh_token);
    this.refreshOk += 1;
    return { status: 200, body: pair };
  }
}

function makeClient(server, { singleFlight, maxRounds }) {
  let accessToken = "at-0"; // access token đã hết hạn, giống lúc 9h15
  let refreshToken = "rt-0"; // refresh token còn sống
  let refreshPromise = null;
  const stats = { ok: 0, failed: 0, replays: 0 };

  async function doRefresh() {
    const r = await server.refresh(refreshToken);
    if (r.status === 200) refreshToken = r.body.refresh_token;
    return r;
  }

  function sharedRefresh() {
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => {
        refreshPromise = null; // nhả khóa kể cả khi refresh thất bại
      });
    }
    return refreshPromise;
  }

  async function call(url) {
    if (url === REFRESH_URL) {
      // Chặn lặp: 401 từ chính endpoint refresh nghĩa là hết phiên, không thử lại.
      return doRefresh();
    }
    let rounds = 0;
    let token = accessToken;
    for (;;) {
      const res = await server.api(token);
      if (res.status !== 401) {
        stats.ok += 1;
        return res;
      }
      if (rounds >= maxRounds) {
        stats.failed += 1;
        return res;
      }
      rounds += 1;
      const r = singleFlight ? await sharedRefresh() : await doRefresh();
      if (r.status === 200) {
        token = r.body.access_token;
        stats.replays += 1;
      }
    }
  }

  return { call, stats };
}

async function run(options) {
  const server = new AuthServer();
  const client = makeClient(server, options);
  await Promise.all(Array.from({ length: N }, () => client.call("/orders")));
  return { server, stats: client.stats };
}

const row = (label, n) => console.log(label.padEnd(46) + String(n).padStart(4));

function report(title, { server, stats }) {
  console.log(`=== ${title} ===`);
  row("Lời gọi /auth/refresh", server.refreshCalls);
  row("  trong đó thành công", server.refreshOk);
  row("  trong đó bị từ chối (token đã bị xoay vòng)", server.refreshRejected);
  row("Lời gọi API nghiệp vụ", server.apiCalls);
  row("Request được gửi lại sau khi refresh", stats.replays);
  row("Request thành công", stats.ok);
  row("Request thất bại", stats.failed);
  console.log();
}

console.log(`${N} request nghiệp vụ cùng nhận 401 vì access token "at-0" đã hết hạn.`);
console.log(`Server refresh xoay vòng: cấp cặp mới thì refresh token cũ chết.`);
console.log();

report("Chế độ A: không single-flight, replay tối đa 1 lần", await run({ singleFlight: false, maxRounds: 1 }));
report("Chế độ B: single-flight, replay tối đa 1 lần", await run({ singleFlight: true, maxRounds: 1 }));
report(
  "Chế độ C: không single-flight, KHÔNG chặn replay (trần an toàn 3 vòng)",
  await run({ singleFlight: false, maxRounds: 3 }),
);

console.log("=== Kiểm chặn lặp trên chính endpoint refresh ===");
const server = new AuthServer();
const client = makeClient(server, { singleFlight: true, maxRounds: 1 });
const before = server.refreshCalls;
const pair = await Promise.all([client.call(REFRESH_URL), client.call(REFRESH_URL)]);
console.log(`Hai lời gọi ${REFRESH_URL} đồng thời bằng cùng refresh token "rt-0"`);
console.log(`  mã trả về: ${pair.map((r) => r.status).join(", ")}`);
row("  lời gọi refresh phát sinh thêm sau cái 401", server.refreshCalls - before - pair.length);
