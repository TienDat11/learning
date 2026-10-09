// tools/probe-vue.mjs — measure Vue 3.5.x behaviour the document makes claims about.
// Read-only: imports the installed vue build, prints real numbers.
import { ref, reactive, computed, watch, watchEffect, effect, nextTick, toRefs, toRef } from 'vue';

const log = (...a) => console.log(...a);

// --- C01: a plain `let` in script setup is not reactive ----------------------
let plainCount = 0;
let effectRuns = 0;
const stop1 = effect(() => { effectRuns++; void plainCount; });
plainCount++;
await nextTick();
log('C01 plain let -> effect runs after mutation:', effectRuns, '(1 means the write was not tracked)');
stop1();

// --- C02: const ref reassignment and the arithmetic slip ---------------------
const count = ref(0);
try { count = count + 1; } catch (e) { log('C02 const reassign ->', e.constructor.name + ':', e.message); }
let loose = ref(0);
const before = loose;
loose = loose + 1;
log('C02 let ref + 1 ->', JSON.stringify(loose), '| still a ref?', typeof loose.value !== 'undefined');
void before;

// --- C02/C03: destructuring reactive loses the link -------------------------
const state = reactive({ n: 1, m: 5 });
let { n } = state;
let { m } = toRefs(state);
let seen = 0;
const stop2 = effect(() => { seen++; void m.value; });
n++;
await nextTick();
log('C02 destructured reactive: local copy incremented to', n, 'but state.n is still', state.n);
state.m++;
await nextTick();
log('C03 toRefs binding: effect runs =', seen, '(2 means the toRefs ref stayed live; 1 means it did not)');
stop2();

// --- C04: computed is lazy and cached ---------------------------------------
let computeRuns = 0;
const keyword = ref('');
const items = ref(['ao', 'quan', 'ao dai']);
const filtered = computed(() => { computeRuns++; return items.value.filter((x) => x.includes(keyword.value)); });
log('C04 computed runs before first read:', computeRuns);
void filtered.value;
const afterFirst = computeRuns;
void filtered.value;
log('C04 after 1st read:', afterFirst, '| after 2nd read:', computeRuns, '(same number = cache held)');
keyword.value = 'ao';
void filtered.value;
log('C04 after dependency change and re-read:', computeRuns);

// --- C04: watch batching vs bare effect batching on 3.5 ---------------------
let watchRuns = 0, effectRuns2 = 0;
const busy = ref(0);
watch(busy, () => { watchRuns++; });
const stop3 = effect(() => { effectRuns2++; void busy.value; });
for (let i = 0; i < 100; i++) busy.value = i;
await nextTick();
log('C04/effect: 100 same-tick writes -> watch runs', watchRuns, '| bare effect runs', effectRuns2);
stop3();

// --- C05: the stale-response race is a valid write --------------------------
const result = ref(null);
const request = async (q, delay) => { await new Promise((r) => setTimeout(r, delay)); result.value = q; };
const slow = request('da', 50);
const fast = request('danang', 5);
await Promise.all([slow, fast]);
log('C05 unguarded final state:', JSON.stringify(result.value), '(stale write wins because nothing rejects it)');

let session = 0;
const result2 = ref(null);
const guarded = async (q, delay) => { const mine = ++session; await new Promise((r) => setTimeout(r, delay)); if (mine === session) result2.value = q; };
const s1 = guarded('da', 50); const s2 = guarded('danang', 5);
await Promise.all([s1, s2]);
log('C05 session-guarded final state:', JSON.stringify(result2.value));

// --- AbortController really aborts -----------------------------------------
const c = new AbortController();
const p = new Promise((_, rej) => { c.signal.addEventListener('abort', () => rej(new DOMException('x', 'AbortError'))); });
c.abort();
try { await p; } catch (e) { log('C05 AbortError name:', e.name); }
