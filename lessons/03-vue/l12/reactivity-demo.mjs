// Chạy: node reactivity-demo.mjs
// Dùng @vue/reactivity 3.5.x — chính là gói lõi mà Vue dùng cho ref/reactive/computed.
import {
  ref, reactive, computed, effect, shallowRef, isReactive, toRefs,
} from '@vue/reactivity'

const log = (s = '') => console.log(s)

log('=== 1. effect chạy lại khi ref đổi ===')
const count = ref(0)
let refRuns = 0
effect(() => {
  refRuns += 1
  log(`  effect lần ${refRuns}: count.value = ${count.value}`)
})
log('  gán count.value = 1')
count.value = 1
log('  gán count.value = 2')
count.value = 2
log(`  tổng số lần effect chạy: ${refRuns}`)

log()
log('=== 2. gán lại đúng giá trị cũ thì không chạy lại ===')
const before = refRuns
count.value = 2
log(`  gán count.value = 2 lần nữa, effect chạy thêm ${refRuns - before} lần`)

log()
log('=== 3. effect có scheduler: gộp nhiều lần đổi trong một tick ===')
const n = ref(0)
let schedCalls = 0
let flushes = 0
const queue = new Set()
let scheduled = false
let runner
runner = effect(() => { n.value }, {
  scheduler() {
    schedCalls += 1
    queue.add(runner)
    if (!scheduled) {
      scheduled = true
      Promise.resolve().then(() => {
        scheduled = false
        flushes += 1
        const jobs = [...queue]
        queue.clear()
        jobs.forEach((job) => job())
      })
    }
  },
})
n.value = 1
n.value = 2
n.value = 3
log(`  gán 3 lần: scheduler được gọi ${schedCalls} lần, hàng đợi gộp còn ${queue.size} job`)
await Promise.resolve()
await Promise.resolve()
log(`  sau microtask: effect thật sự chạy ${flushes} lần`)

log()
log('=== 4. destructure làm đứt dây, toRefs thì không ===')
const filters = reactive({ q: '' })

const { q: plainQ } = filters // đọc qua Proxy đúng một lần, giữ bản sao chuỗi
let plainRuns = 0
effect(() => {
  plainRuns += 1
  log(`  [biến rời] effect lần ${plainRuns}: plainQ = "${plainQ}"`)
})
filters.q = 'hd'
log(`  sau filters.q = 'hd': plainQ = "${plainQ}", effect chạy ${plainRuns} lần`)

const { q } = toRefs(filters) // ref trỏ về đúng khóa q
let refQ = 0
effect(() => {
  refQ += 1
  log(`  [toRefs] effect lần ${refQ}: q.value = "${q.value}"`)
})
filters.q = 'hdd'
log(`  sau filters.q = 'hdd': q.value = "${q.value}", effect chạy ${refQ} lần`)

log()
log('=== 5. reactive bọc sâu object lồng nhau ===')
const raw = { user: { name: 'An' } }
const state = reactive(raw)
log(`  isReactive(state) = ${isReactive(state)}`)
log(`  isReactive(state.user) = ${isReactive(state.user)}`)
log(`  state có phải object gốc? ${state === raw}`)
let deepRuns = 0
effect(() => {
  deepRuns += 1
  log(`  effect lần ${deepRuns}: state.user.name = ${state.user.name}`)
})
state.user.name = 'Bình'
log(`  sau khi đổi khóa lồng: effect chạy ${deepRuns} lần`)

log()
log('=== 6. shallowRef chỉ theo dõi .value ===')
const big = shallowRef({ rows: [1, 2, 3] })
let shallowRuns = 0
effect(() => {
  shallowRuns += 1
  log(`  effect lần ${shallowRuns}: big.value.rows.length = ${big.value.rows.length}`)
})
big.value.rows.push(4)
log(`  sau push(4): mảng thật dài ${big.value.rows.length}, effect chạy ${shallowRuns} lần`)
big.value = { rows: [1, 2, 3, 4] }
log(`  sau khi gán cả .value: effect chạy ${shallowRuns} lần`)

log()
log('=== 7. computed lười: không ai đọc thì không tính ===')
const price = ref(100)
let calc = 0
const total = computed(() => {
  calc += 1
  return price.value * 2
})
log(`  vừa tạo computed: số lần tính = ${calc}`)
price.value = 200
price.value = 300
log(`  đổi price 2 lần, không đọc: số lần tính = ${calc}`)
log(`  đọc total.value lần 1 = ${total.value}, số lần tính = ${calc}`)
log(`  đọc total.value lần 2 = ${total.value}, số lần tính = ${calc}`)
price.value = 400
log(`  đổi price thêm 1 lần, không đọc: số lần tính = ${calc}`)
log(`  đọc total.value lần 3 = ${total.value}, số lần tính = ${calc}`)
