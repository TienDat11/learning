// L15 — ba mức đặt state, chạy hai "bài test" liên tiếp trên cùng một tiến trình.
// Chạy: node state-scope.mjs
import { ref, computed } from 'vue'
import { createPinia, setActivePinia, defineStore } from 'pinia'

// ---------- Cách 1: biến ở phạm vi module (singleton của cả tiến trình) ----------
// Khai báo một lần, sống tới khi tiến trình node thoát.
const singletonFiles = ref([])

export function useFilesSingleton() {
  return {
    files: singletonFiles,
    count: computed(() => singletonFiles.value.length),
    add(name) { singletonFiles.value.push(name) },
  }
}

// ---------- Cách 2: hàm tạo mới (mỗi lần gọi là một bản state riêng) ----------
export function createFilesStore() {
  const files = ref([])
  return {
    files,
    count: computed(() => files.value.length),
    add(name) { files.value.push(name) },
  }
}

// ---------- Cách 3: store thật của Pinia (một instance cho mỗi app) ----------
const useFilesStore = defineStore('files', () => {
  const files = ref([])
  const count = computed(() => files.value.length)
  function add(name) { files.value.push(name) }
  function reset() { files.value = [] }
  return { files, count, add, reset }
})

// ---------- Khung chạy test ----------
// Store của Pinia bọc reactive nên .count đã mở gói; ref thuần thì phải đọc .value.
function readCount(store) {
  return typeof store.count === 'number' ? store.count : store.count.value
}

function test(name, fn) {
  const store = fn()
  return { name, count: readCount(store) }
}

const rows = []

// Bài test 1: dùng singleton, thêm 3 tệp.
rows.push(test('test 1 — singleton, thêm 3 tệp', () => {
  const s = useFilesSingleton()
  s.add('a.pdf'); s.add('b.pdf'); s.add('c.pdf')
  return s
}))

// Bài test 2: cùng singleton, không thêm gì. Đếm lúc bắt đầu.
rows.push(test('test 2 — singleton, không thêm gì', () => useFilesSingleton()))

// Bài test 3: hàm tạo mới, thêm 3 tệp.
rows.push(test('test 3 — hàm tạo mới, thêm 3 tệp', () => {
  const s = createFilesStore()
  s.add('a.pdf'); s.add('b.pdf'); s.add('c.pdf')
  return s
}))

// Bài test 4: hàm tạo mới lần nữa. Đếm lúc bắt đầu.
rows.push(test('test 4 — hàm tạo mới, không thêm gì', () => createFilesStore()))

// Bài test 5: Pinia, mỗi bài test một app mới.
rows.push(test('test 5 — pinia (app mới), thêm 3 tệp', () => {
  setActivePinia(createPinia())
  const s = useFilesStore()
  s.add('a.pdf'); s.add('b.pdf'); s.add('c.pdf')
  return s
}))

rows.push(test('test 6 — pinia (app mới), không thêm gì', () => {
  setActivePinia(createPinia())
  return useFilesStore()
}))

// Bài test 7: Pinia dùng lại cùng app, nhưng gọi reset() trước khi dùng.
setActivePinia(createPinia())
const shared = useFilesStore()
shared.add('a.pdf'); shared.add('b.pdf'); shared.add('c.pdf')
rows.push({ name: 'test 7 — pinia (cùng app), thêm 3 tệp', count: readCount(shared) })
shared.reset()
rows.push({ name: 'test 8 — pinia (cùng app) sau reset()', count: readCount(shared) })

const width = Math.max(...rows.map((r) => r.name.length))
console.log('Số tệp đếm được ở đầu mỗi bài test:')
for (const r of rows) {
  console.log('  ' + r.name.padEnd(width) + '  ->  ' + r.count)
}

// Cùng một màn hình, ba component gọi cùng composable: mỗi nơi một bản.
function useLocalFiles() {
  const files = ref([])
  return { files, add: (n) => files.value.push(n) }
}
const a = useLocalFiles(), b = useLocalFiles(), c = useLocalFiles()
a.add('x.pdf'); a.add('y.pdf')
b.add('z.pdf')
console.log('\nComposable gọi ở ba component, mỗi nơi tự gọi:')
console.log('  A thấy ' + a.files.value.length + ', B thấy ' + b.files.value.length + ', C thấy ' + c.files.value.length)
