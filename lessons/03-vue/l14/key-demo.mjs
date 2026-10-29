// Chạy: node key-demo.mjs
// Mount thật bằng @vue/runtime-dom (gói `vue`) trên jsdom.
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>')
const w = dom.window
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'SVGElement', 'Event', 'CustomEvent']) {
  Object.defineProperty(globalThis, key, { value: w[key] ?? w, configurable: true, writable: true })
}

const { createApp, h, ref, nextTick, defineComponent } = await import('vue')

const log = (s = '') => console.log(s)

// Con: bản nháp cục bộ, khởi tạo một lần từ prop.
const OrderRow = defineComponent({
  name: 'OrderRow',
  props: { row: { type: Object, required: true } },
  setup(props) {
    const draft = ref(props.row.note ?? '')
    return () =>
      h('tr', [
        h('td', props.row.id),
        h('td', h('input', { value: draft.value, onInput: (e) => { draft.value = e.target.value } })),
      ])
  },
})

// Con: đọc chung một ref của cha (lỗi cấp state).
const SharedRow = defineComponent({
  name: 'SharedRow',
  props: { row: { type: Object, required: true }, note: { type: String, default: '' } },
  emits: ['update:note'],
  setup(props, { emit }) {
    return () =>
      h('tr', [
        h('td', props.row.id),
        h('td', h('input', { value: props.note, onInput: (e) => emit('update:note', e.target.value) })),
      ])
  },
})

const initial = () => [
  { id: 'A', amount: 100, note: '' },
  { id: 'B', amount: 900, note: '' },
  { id: 'C', amount: 400, note: '' },
]

function mount(rowsRef, keyMode, child) {
  const host = w.document.createElement('div')
  w.document.body.appendChild(host)
  createApp({
    setup() {
      return () =>
        h('table', [
          h(
            'tbody',
            rowsRef.value.map((row, i) =>
              h(child, {
                key: keyMode === 'id' ? row.id : i,
                row,
              }),
            ),
          ),
        ])
    },
  }).mount(host)
  return host
}

function typeInto(host, rowId, text) {
  const tr = [...host.querySelectorAll('tbody tr')].find((t) => t.children[0].textContent === rowId)
  const input = tr.querySelector('input')
  input.value = text
  input.dispatchEvent(new w.Event('input'))
}

function dump(host) {
  return [...host.querySelectorAll('tbody tr')].map(
    (tr) => `${tr.children[0].textContent} = "${tr.querySelector('input').value}"`,
  )
}

async function scenario(keyMode) {
  const rows = ref(initial())
  const host = mount(rows, keyMode, OrderRow)
  await nextTick()
  typeInto(host, 'B', 'ghi chú cho B')
  await nextTick()
  log(`  trước khi sắp xếp: ${dump(host).join(' | ')}`)
  rows.value = [...rows.value].sort((x, y) => y.amount - x.amount)
  await nextTick()
  log(`  sau khi sắp xếp (giảm dần theo amount): ${dump(host).join(' | ')}`)
  return host
}

log('=== 1. key theo id ===')
await scenario('id')

log()
log('=== 2. key theo chỉ số (index) ===')
await scenario('index')

log()
log('=== 3. một ref đặt ở cha, dùng chung cho mọi dòng ===')
{
  const rows = ref(initial())
  const sharedNote = ref('')
  const host = w.document.createElement('div')
  w.document.body.appendChild(host)
  createApp({
    setup() {
      return () =>
        h('table', [
          h(
            'tbody',
            rows.value.map((row) =>
              h(SharedRow, {
                key: row.id,
                row,
                note: sharedNote.value,
                'onUpdate:note': (v) => { sharedNote.value = v },
              }),
            ),
          ),
        ])
    },
  }).mount(host)
  await nextTick()
  typeInto(host, 'B', 'chỉ gõ vào dòng B')
  await nextTick()
  log(`  sau khi gõ vào B: ${dump(host).join(' | ')}`)
}
