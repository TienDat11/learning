// L17 — client + server có bảng idempotency, chạy ba tình huống.
// Chạy: node idempotency.mjs  (không cần cài gói nào)
//
// Đây là mô phỏng bằng JS thuần: không có HTTP thật, không có Vue.
// Phần được mô phỏng: độ trễ mạng, timeout, và việc server commit trước khi client biết.

// ---------------- Server ----------------
function makeServer() {
  const orders = []                 // bản ghi thật
  const idem = new Map()            // Idempotency-Key -> { state: 'in-flight'|'done', record }
  let seq = 0

  return {
    orders,
    idem,
    // Trả { status, body }. status 201 = tạo mới, 200 = phát lại kết quả cũ,
    // 409 = cùng khoá đang được xử lý.
    createOrder(key, payload) {
      const seen = idem.get(key)
      if (seen && seen.state === 'in-flight') {
        return { status: 409, body: { title: 'A request is outstanding for this Idempotency-Key' } }
      }
      if (seen && seen.state === 'done') {
        if (seen.fingerprint !== JSON.stringify(payload)) {
          return { status: 422, body: { title: 'Idempotency-Key is already used with a different payload' } }
        }
        return { status: 200, body: seen.record }        // phát lại kết quả cũ
      }
      idem.set(key, { state: 'in-flight', fingerprint: JSON.stringify(payload) })
      const record = { id: 'ORD-' + String(++seq).padStart(4, '0'), ...payload }
      orders.push(record)
      idem.set(key, { state: 'done', fingerprint: JSON.stringify(payload), record })
      return { status: 201, body: record }
    },
  }
}

// ---------------- Client ----------------
function makeClient(server) {
  let inFlight = false
  let key = null

  return {
    resetIntent() { key = null },
    // Trả về { status, body, blocked } — blocked: true khi khoá inFlight chặn cú bấm.
    async submit(payload) {
      if (inFlight) return { blocked: true }           // khoá thật, chạy trước mọi thứ
      inFlight = true
      key = key ?? 'key-' + payload.sku                 // giữ nguyên khi retry cùng ý định
      try {
        await new Promise((r) => setTimeout(r, 20))   // request đang bay
        return server.createOrder(key, payload)
      } finally {
        inFlight = false
      }
    },
    // Mô phỏng: request đã tới server và server đã commit, nhưng client timeout.
    async submitAndTimeOut(payload) {
      server.createOrder(key, payload)
      throw Object.assign(new Error('timeout sau 10s'), { name: 'TimeoutError' })
    },
    async retryWithSameKey(payload) { return server.createOrder(key, payload) },
    async retryWithNewKey(payload) {
      key = 'key-moi-' + Math.random().toString(36).slice(2, 8)   // sinh khoá mới: sai
      return server.createOrder(key, payload)
    },
  }
}

function report(title, server, extra = '') {
  console.log('\n=== ' + title + ' ===')
  console.log('  Số bản ghi đơn hàng trên server: ' + server.orders.length)
  console.log('  Mã đơn: ' + server.orders.map((o) => o.id).join(', '))
  if (extra) console.log('  ' + extra)
}

// ---------------- Tình huống 1: bấm ba lần ----------------
{
  const server = makeServer()
  const client = makeClient(server)
  const payload = { sku: 'A-1', qty: 2 }
  const [r1, r2, r3] = await Promise.all([client.submit(payload), client.submit(payload), client.submit(payload)])
  report('Tình huống 1: bấm Gửi ba lần', server,
    'lần 1 -> ' + r1.status + ', lần 2 -> ' + (r2.blocked ? 'bị chặn (inFlight)' : r2.status) +
    ', lần 3 -> ' + (r3.blocked ? 'bị chặn (inFlight)' : r3.status))
}

// ---------------- Tình huống 2: timeout rồi thử lại với CÙNG khoá ----------------
{
  const server = makeServer()
  const client = makeClient(server)
  const payload = { sku: 'A-1', qty: 2 }
  try { await client.submitAndTimeOut(payload) } catch (e) { console.log('\n[client] ' + e.name + ': ' + e.message) }
  const after = server.orders.length
  const retry = await client.retryWithSameKey(payload)
  report('Tình huống 2: timeout rồi Thử lại, giữ nguyên khoá', server,
    'server đã ghi ' + after + ' bản ghi trước khi client biết; lần thử lại trả HTTP ' + retry.status + ' cho đơn ' + retry.body.id)
}

// ---------------- Tình huống 3: thử lại nhưng sinh khoá MỚI ----------------
{
  const server = makeServer()
  const client = makeClient(server)
  const payload = { sku: 'A-1', qty: 2 }
  try { await client.submitAndTimeOut(payload) } catch (e) { console.log('\n[client] ' + e.name + ': ' + e.message) }
  const retry = await client.retryWithNewKey(payload)
  report('Tình huống 3: timeout rồi Thử lại với khoá mới', server,
    'lần thử lại trả HTTP ' + retry.status + ' và tạo thêm một bản ghi')
}

// ---------------- Tình huống 4: hai request đồng thời cùng khoá ----------------
{
  const server = makeServer()
  const payload = { sku: 'A-1', qty: 2 }
  server.idem.set('key-A-1', { state: 'in-flight', fingerprint: JSON.stringify(payload) })
  const r = server.createOrder('key-A-1', payload)
  report('Tình huống 4: request thứ hai tới khi request đầu chưa xong', server,
    'server trả HTTP ' + r.status + ' — "' + r.body.title + '"')
}
