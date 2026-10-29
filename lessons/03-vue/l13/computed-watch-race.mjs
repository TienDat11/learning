// Chạy: node computed-watch-race.mjs
// Dùng gói `vue` bản đầy đủ chạy trong Node, không cần DOM.
import { ref, reactive, computed, watch, watchEffect, nextTick } from 'vue'

const log = (s = '') => console.log(s)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

log('=== 1. computed lười và có cache ===')
const q = ref('')
let calc = 0
const normalized = computed(() => {
  calc += 1
  return q.value.trim().toLowerCase()
})
q.value = 'HDD'
log(`  gán q = 'HDD' nhưng chưa đọc: số lần tính = ${calc}`)
log(`  đọc lần 1 = "${normalized.value}", số lần tính = ${calc}`)
log(`  đọc lần 2 = "${normalized.value}", số lần tính = ${calc}`)

log()
log('=== 2. bốn dạng nguồn của watch ===')
const a = ref(1)
const b = ref(10)
const filters = reactive({ status: 'new', page: 1 })
watch(a, () => log('  [nguồn ref] a đổi'))
watch(() => a.value + b.value, (v) => log(`  [nguồn getter] tổng = ${v}`))
watch([a, b], ([na, nb]) => log(`  [nguồn mảng] a = ${na}, b = ${nb}`))
watch(filters, () => log('  [nguồn reactive] một khóa lồng đổi (deep mặc định)'))
a.value = 2
await nextTick()
b.value = 20
await nextTick()
filters.page = 2
await nextTick()

log()
log('=== 3. immediate và flush: thứ tự chạy ===')
const v = ref(0)
const order = []
watch(v, () => order.push('pre (mặc định)'), { flush: 'pre' })
watch(v, () => order.push('post'), { flush: 'post' })
watch(v, () => order.push('sync'), { flush: 'sync' })
watch(v, () => order.push('immediate'), { immediate: true })
order.length = 0
v.value = 1
order.push('dòng ngay sau khi gán')
await nextTick()
log(`  thứ tự: ${order.join(' → ')}`)

log()
log('=== 4. watchEffect tự thu thập phụ thuộc, onCleanup chạy trước lần kế ===')
const kw = ref('')
let effectRuns = 0
watchEffect((onCleanup) => {
  effectRuns += 1
  const current = kw.value
  log(`  watchEffect lần ${effectRuns}: đọc kw = "${current}"`)
  onCleanup(() => log(`    cleanup của lần ${effectRuns}`))
})
kw.value = 'a'
kw.value = 'ab'
await nextTick()
log(`  tổng số lần chạy = ${effectRuns}`)

log()
log('=== 5. đọc sau await thì không được theo dõi ===')
const trigger = ref(0)
let lateRuns = 0
watchEffect(async () => {
  lateRuns += 1
  trigger.value
  await sleep(1)
  const readLate = trigger.value // đọc sau await: ngoài phạm vi thu thập
  log(`  lần ${lateRuns}: đọc muộn = ${readLate}`)
})
await sleep(5)
trigger.value = 1
await sleep(5)
log(`  đổi trigger: tổng số lần chạy = ${lateRuns} (nếu > 1 thì đọc muộn có được theo dõi)`)

log()
log('=== 6. response về lệch thứ tự ===')
const LATENCY = { a: 300, ab: 120, abc: 60 }
const fakeSearch = (key) => sleep(LATENCY[key]).then(() => `kết quả cho "${key}"`)

async function typeKeys(target, keys) {
  for (const k of keys) {
    target.value = k
    await sleep(20)
  }
}

// 6a. không chặn gì
const keyword = ref('')
const rows = ref('(chưa có)')
const arrivals = []
watch(keyword, async (key) => {
  const data = await fakeSearch(key)
  arrivals.push(key)
  rows.value = data
})
await typeKeys(keyword, ['a', 'ab', 'abc'])
await sleep(400)
log(`  [không chặn] thứ tự response về: ${arrivals.join(' → ')}`)
log(`  [không chặn] rows cuối cùng: ${rows.value}`)

// 6b. đánh số lần gửi
const keyword2 = ref('')
const rows2 = ref('(chưa có)')
let latest = 0
watch(keyword2, async (key) => {
  const token = ++latest
  const data = await fakeSearch(key)
  if (token !== latest) {
    log(`  [đánh số] response "${key}" mang token ${token}, token mới nhất là ${latest}: bỏ`)
    return
  }
  rows2.value = data
})
await typeKeys(keyword2, ['a', 'ab', 'abc'])
await sleep(400)
log(`  [đánh số] rows cuối cùng: ${rows2.value}`)

// 6c. huỷ bằng AbortController
const keyword3 = ref('')
const rows3 = ref('(chưa có)')
let inflight = null
function fakeFetch(key, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(`kết quả cho "${key}"`), LATENCY[key])
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new Error('aborted'))
    })
  })
}
watch(keyword3, async (key) => {
  inflight?.abort()
  const ctrl = new AbortController()
  inflight = ctrl
  try {
    const data = await fakeFetch(key, ctrl.signal)
    rows3.value = data
  } catch (err) {
    log(`  [huỷ] request "${key}" bị huỷ trước khi về`)
  }
})
await typeKeys(keyword3, ['a', 'ab', 'abc'])
await sleep(400)
log(`  [huỷ] rows cuối cùng: ${rows3.value}`)
