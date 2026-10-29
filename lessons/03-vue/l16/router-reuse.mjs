// L16 — mount một app nhỏ trong jsdom, đi từ /orders/4821 sang /orders/4822.
// Chạy: node router-reuse.mjs
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>')
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.Element = dom.window.Element
globalThis.SVGElement = dom.window.SVGElement
globalThis.Node = dom.window.Node
globalThis.MutationObserver = dom.window.MutationObserver
globalThis.history = dom.window.history
globalThis.location = dom.window.location
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })

const { createApp, h, watch, onMounted } = await import('vue')
const { createRouter, createMemoryHistory, useRoute, onBeforeRouteUpdate, onBeforeRouteLeave, RouterView } = await import('vue-router')

const events = []
let creations = 0
let loads = 0

const OrderDetail = {
  name: 'OrderDetail',
  setup() {
    creations++
    events.push('setup (instance #' + creations + ')')
    const route = useRoute()
    onMounted(() => events.push('onMounted (instance #' + creations + ')'))
    // Đây là dòng mà bản ngây thơ thiếu: dữ liệu đi theo params, không theo vòng đời.
    watch(
      () => route.params.id,
      (id) => { loads++; events.push('load dữ liệu cho ' + id) },
      { immediate: true },
    )
    onBeforeRouteUpdate((to) => { events.push('beforeRouteUpdate -> ' + to.params.id) })
    onBeforeRouteLeave(() => { events.push('beforeRouteLeave') })
    return () => h('div', 'order ' + route.params.id)
  },
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { render: () => h('div', 'home') } },
    {
      path: '/orders/:id',
      name: 'order',
      component: OrderDetail,
      beforeEnter: (to) => { events.push('beforeEnter -> ' + to.params.id) },
    },
  ],
})

router.beforeEach((to) => { events.push('beforeEach -> ' + to.path); return true })
router.beforeResolve((to) => { events.push('beforeResolve -> ' + to.path) })
router.afterEach((to) => { events.push('afterEach -> ' + to.path) })

const app = createApp({ render: () => h(RouterView) })
app.use(router)
app.mount('#app')

// Hai URL này khớp route record nào?
for (const url of ['/orders/4821', '/orders/4822']) {
  const r = router.resolve(url)
  console.log('resolve ' + url + ' -> record path=' + r.matched[0].path + ', name=' + String(r.name) + ', params.id=' + r.params.id)
}

console.log('\n--- điều hướng 1: vào /orders/4821 ---')
await router.push('/orders/4821')
await router.isReady()

events.push('=== chuyển sang 4822 ===')

console.log('\n--- điều hướng 2: /orders/4822 ---')
await router.push('/orders/4822')

console.log('\nNhật ký sự kiện, đúng thứ tự đã chạy:')
for (const e of events) console.log('  ' + e)

console.log('\nSố lần component OrderDetail được tạo: ' + creations)
console.log('Số lần hook nạp dữ liệu chạy:        ' + loads)
console.log('URL cuối cùng:                       ' + router.currentRoute.value.fullPath)
