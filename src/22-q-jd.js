var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
id: 'C14',
group: 'C',
topic: 'defineProps generic, withDefaults và typed emits trong Vue 3 với TypeScript',
prio: 'P0',
level: 'L2',
type: 'code',
q: 'Trong một component Vue 3 viết bằng TypeScript, bạn khai báo props và emits thế nào để compiler bắt được lỗi truyền sai kiểu, và vì sao defineProps cần generic còn withDefaults cần thêm một bước?',
oral: 'Props trong Vue khai báo bằng kiểu TypeScript, và đó là chỗ compiler bắt lỗi. Tôi viết defineProps với một type Props, còn compiler của Vue sinh khai báo runtime tương ứng lúc build. Nhờ vậy vừa có kiểm tra lúc gõ mã, vừa có kiểm tra prop lúc chạy trong dev. Kiểu thuần không chứa giá trị mặc định, nên prop tùy chọn cần withDefaults, ví dụ size mặc định là md. Object và array mặc định phải là hàm trả về giá trị mới, ví dụ tags: () => [], để mỗi instance có mảng riêng. Emits khai báo bằng defineEmits kèm kiểu payload, nên gọi sai tên sự kiện hay sai kiểu đều báo ngay ở dòng gọi. Khi kiểu đầu vào và kiểu đầu ra phải khớp nhau, như items kiểu T và sự kiện chọn kiểu T, tôi thêm generic vào thẻ script setup. Bẫy thực tế là ép kiểu bằng as cho nhanh, vì nó che lỗi chứ không sửa được lỗi.',
deep: '<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>props</strong>: dữ liệu cha truyền xuống con. Trong React đây cũng là props, và giống tham số của một hàm.</li><li><strong>defineProps</strong>: hàm đặc biệt của Vue, không cần import, dùng để khai báo props. Giống khai báo các field của serializer trong Django REST Framework.</li><li><strong>withDefaults</strong>: bọc defineProps để gán mặc định cho prop tùy chọn. Giống default parameter trong React, nhưng object và array phải được trả về từ một hàm.</li><li><strong>defineEmits</strong>: khai báo các sự kiện con có thể phát cho cha. Trong React cha truyền callback onSelect xuống con, còn Vue thì con phát sự kiện bằng emit.</li><li><strong>generic</strong>: tham số kiểu, cho component làm việc với nhiều kiểu dữ liệu. Giống function Card&lt;T&gt; trong TSX hay list[T] trong Python typing.</li><li><strong>SFC</strong>: Single File Component, gom template, script và style trong một file .vue. Giống một file .tsx gom JSX và logic.</li><li><strong>script setup</strong>: cú pháp rút gọn của thẻ script. Mọi khai báo ở cấp cao nhất tự dùng được trong template, giống biến trong thân hàm component của React.</li><li><strong>vue-tsc</strong>: kiểm tra kiểu TypeScript cho file .vue, chạy riêng như tsc hay mypy. Vite chỉ chuyển mã mà không kiểm tra kiểu.</li><li><strong>v-model</strong>: cú pháp hai chiều của Vue, tương đương :modelValue cộng @update:modelValue. Trong React giống cặp value và onChange.</li></ul><p><strong>Ba lớp kiểu cần tách bạch.</strong> Kiểu của props, kiểu của sự kiện và kiểu của dữ liệu thật đi qua mạng là ba thứ khác nhau. defineProps với kiểu thuần cho TypeScript biết hình dạng. Compiler của Vue chuyển hình dạng đó thành khai báo runtime để kiểm tra lúc chạy trong dev.</p><p><strong>Kiểm tra tĩnh chỉ bảo vệ code bạn viết.</strong> Dữ liệu từ API vẫn chưa được kiểm chứng khi vào component. Kiểu TypeScript không đi qua mạng cùng dữ liệu.</p><p><strong>Cách làm sai phổ biến</strong> là viết <code>defineProps({ items: Array })</code> rồi ép kiểu bằng <code>as</code> ở chỗ dùng. Compiler không biết phần tử bên trong là gì, nên lỗi cấu trúc chỉ lộ ra lúc render.</p><p><strong>withDefaults tồn tại vì kiểu thuần không chứa giá trị.</strong> Prop boolean thiếu giá trị thì Vue tự đặt false. Chuỗi, số và object thì bạn phải khai báo mặc định. Object và array mặc định phải là hàm, ví dụ <code>tags: () =&gt; []</code>. Viết <code>tags: []</code> thì mọi instance dùng chung một tham chiếu, đúng kiểu bẫy mutable default argument trong Python.</p><p><strong>Bridge sang React.</strong> Trong React, default parameter như <code>function Card({ size = \'md\', tags = [] })</code> được tính lại mỗi lần gọi, nên mảng không bị dùng chung. Trong Vue, giá trị mặc định được khai báo một lần rồi dùng cho mọi instance, nên phải bọc trong hàm.</p><p><strong>Emits có hai dạng.</strong> Dạng call signature như <code>(e: "select", id: number): void</code> giữ payload chặt. Dạng tuple có tên như <code>{ select: [id: number] }</code> ngắn hơn khi có nhiều sự kiện. Với cả hai dạng, emit sai tên hoặc sai payload báo lỗi ngay tại dòng gọi.</p><p><strong>v-model là hai emit ghép lại.</strong> <code>v-model="value"</code> trên component tương đương <code>:modelValue="value"</code> cộng <code>@update:modelValue</code>. Trong React đây là cặp value và onChange. Con chỉ emit giá trị mới, cha nhận và gán vào biến của nó, không có setState.</p><p><strong>Generic</strong> dùng khi chính component cần giữ quan hệ giữa kiểu dữ liệu và sự kiện, ví dụ <code>items: T[]</code> và sự kiện phát ra kiểu T. Khai báo bằng thuộc tính <code>generic="T extends { id: string }"</code> trên thẻ script setup. Không nên dùng khi kiểu luôn cố định, vì khi đó generic chỉ thêm ký hiệu cần đọc.</p><ul><li><strong>Kiểu thuần</strong> phù hợp khi hợp đồng của component ổn định. Khai báo runtime phù hợp khi schema đến từ nơi động, ví dụ cấu hình tải từ server.</li><li><strong>Ép kiểu bằng as</strong> ở template hoặc chỗ dùng chỉ che lỗi. Hãy sửa khai báo props hoặc emits thay vì ép kiểu.</li></ul>',
incident: '<p><strong>Tình huống giả định.</strong> Một bảng quản trị đơn hàng nhận props items khai báo bằng Array, không kiểu phần tử. Backend đổi trường price từ số sang chuỗi.</p><p>Component vẫn biên dịch bình thường vì không ai kiểm tra kiểu phần tử. Màn hình tính tổng ra NaN trong nhiều ngày.</p><p>Đội chỉ phát hiện khi kế toán đối chiếu số liệu. Nếu items có kiểu phần tử rõ ràng, chỗ tính tổng đã bị TypeScript đánh dấu khi viết. Nhưng dữ liệu sai đến từ mạng vẫn cần một bước validate ở biên.</p>',
askFirst: [
  'Vì sao props khai báo Array vẫn để lọt lỗi kiểu của phần tử bên trong?',
  'Vì sao object hoặc array mặc định trong withDefaults phải là một hàm?'
],
predict: { q: 'Bạn đoán: nếu hai instance cùng dùng mặc định tags: [] và một instance push thêm phần tử vào tags, instance kia có thấy phần tử đó không?', a: '<p>Có. Giá trị mặc định chỉ được tạo một lần khi khai báo, nên các instance thiếu prop đó dùng chung một mảng.</p><p>Lỗi này khó thấy vì nó chỉ lộ ra khi dữ liệu của hai instance lẫn vào nhau. Dùng <code>tags: () =&gt; []</code> để mỗi instance nhận một mảng mới.</p>' },
anchor: 'Props khai báo bằng kiểu thuần và emits có kiểu payload làm lỗi sai hình dạng bị bắt ngay lúc gõ mã, thay vì lúc người dùng bấm.',
attacks: [
  { q: 'Vì sao khai báo kiểu thuần chưa đủ khi dữ liệu đến từ API?', a: 'Kiểu chỉ tồn tại lúc biên dịch. JSON đi qua mạng là dữ liệu chưa kiểm chứng lúc chạy. Nếu backend trả price là chuỗi trong khi kiểu nói là số, TypeScript không hề biết. Cần một bước validate ở biên trước khi đưa dữ liệu vào props.' },
  { q: 'Nếu tôi dùng any cho một prop phức tạp để làm nhanh thì sao?', a: 'Prop đó mất kiểm tra ở mọi chỗ nó chảy qua, và lỗi chỉ hiện ở người dùng cuối. Hãy đặt kiểu rõ cho dữ liệu. Nếu thật sự chưa biết hình dạng, dùng unknown rồi thu hẹp bằng kiểm tra, vì unknown buộc bạn chứng minh kiểu trước khi dùng.' }
],
tradeoff: '<p>Kiểu thuần cho mã ngắn và dễ đọc, nhưng bạn phụ thuộc vào compiler SFC để sinh khai báo runtime. Dev server và bundler chỉ chuyển mã, không kiểm tra kiểu. Vì vậy phải chạy riêng vue-tsc thì kiểm tra tĩnh mới có tác dụng.</p><p>Khối script chứa TypeScript phải có <code>lang="ts"</code>. Thiếu thì những dòng như <code>type Props</code> gây lỗi phân tích cú pháp.</p><p>Khai báo runtime rõ ràng hơn cho dữ liệu động, nhưng TypeScript không suy ra kiểu chi tiết của object lồng nhau, nên bạn phải viết lại kiểu ở chỗ khác.</p>',
alternatives: '<ul><li>Đặt kiểu dùng chung trong một file .ts riêng và import vào các component cần dùng.</li><li>Dùng khai báo runtime khi props đến từ schema động, ví dụ cấu hình từ server.</li><li>Dùng generic khi có quan hệ giữa kiểu dữ liệu và sự kiện. Không dùng khi kiểu cố định.</li></ul>',
observe: '<p><strong>Triệu chứng đầu tiên</strong> là cảnh báo Vue trong console khi chạy dev, với prop sai kiểu ở cấp cao nhất. Các giá trị NaN hoặc undefined lọt vào template là dấu hiệu cần chú ý.</p><p><strong>Chặn từ CI.</strong> Thêm <code>vue-tsc --noEmit</code> vào bước kiểm tra của pull request để lỗi kiểu bị chặn trước khi merge. Đây là cách rẻ nhất để giữ hợp đồng kiểu giữa component và nơi gọi.</p>',
say30: 'Props trong Vue khai báo bằng kiểu TypeScript, và compiler sinh khai báo runtime từ kiểu đó. Lỗi kiểu được bắt trong IDE và khi chạy vue-tsc, vì Vite chỉ chuyển mã chứ không kiểm tra kiểu. Object hoặc array mặc định phải là hàm trả về giá trị mới. Emits khai báo kiểu payload, nên gọi sai tên hay sai kiểu báo lỗi ngay. Generic giữ quan hệ giữa dữ liệu vào và sự kiện ra.',
say90: 'Khi khai báo props, tôi dùng kiểu TypeScript thay cho object runtime. Compiler của Vue đọc kiểu đó và sinh khai báo runtime, nên vừa có kiểm tra tĩnh vừa có kiểm tra lúc chạy trong dev. Với giá trị mặc định, tôi dùng withDefaults. Object và mảng thì mặc định là hàm trả về giá trị mới, để không có chuyện instance dùng chung một tham chiếu. Với emits, tôi khai báo kiểu payload để hợp đồng giữa con và cha rõ ràng. Khi cần giữ quan hệ giữa kiểu đầu vào và kiểu đầu ra, tôi dùng generic. Tôi không ép kiểu bằng as, vì nó che lỗi chứ không sửa được lỗi. Trong CI tôi chạy vue-tsc để lỗi dừng ở pull request.',
code: `<script setup lang="ts" generic="T extends { id: string }">
// Kiểu thuần: compiler của Vue sinh khai báo runtime từ type này
type Props = {
  items: T[]
  selectedId?: string
  size?: 'sm' | 'md' | 'lg'
  tags?: string[]
}

// ❌ Cách làm sai phổ biến: tags: [] làm mọi instance dùng chung một mảng
// ✅ Cách làm chuẩn: object và array mặc định là hàm trả về giá trị mới
const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  tags: () => [],
})

// Khai báo sự kiện con phát cho cha, kèm kiểu payload
const emit = defineEmits<{
  select: [item: T]
}>()

function pick(item: T) {
  // Gọi sai tên sự kiện hoặc sai kiểu item sẽ bị TypeScript báo ngay tại đây
  emit('select', item)
}
</script>`,
expected: null,
followups: [
  { q: 'Vì sao withDefaults với object cần hàm trả về, còn chuỗi và số thì không?', a: 'Object và array là tham chiếu, nên một giá trị viết sẵn sẽ dùng chung giữa các instance. Chuỗi và số là giá trị nguyên thủy, gán mặc định không ảnh hưởng instance khác. Vì vậy với mảng hoặc object, hãy trả về giá trị mới từ một hàm.' },
  { q: 'Khi nào bạn dùng generic trong script setup, và khi nào nó làm code khó đọc mà không thêm an toàn?', a: 'Dùng generic khi có quan hệ giữa kiểu đầu vào và kiểu đầu ra, ví dụ items kiểu T[] phát ra sự kiện có payload kiểu T. Như vậy nơi dùng component thấy đúng kiểu phần tử họ đưa vào. Không nên dùng khi kiểu luôn cố định, vì một interface thường đã đủ. Quy tắc đơn giản: nếu hai kiểu phải khớp nhau thì dùng generic.' },
  { q: 'Lỗi emit sai tên sự kiện được phát hiện ở đâu, và vì sao không nên dựa vào console để bắt nó?', a: 'Khi defineEmits có kiểu, TypeScript báo lỗi ngay tại dòng gọi emit. Sai tên hoặc sai payload bị chặn trong editor và trong vue-tsc ở CI. Dựa vào console thì bạn chỉ thấy lỗi khi nhánh đó chạy, mà một nhánh hiếm có thể không bao giờ chạy trong dev. Kiểm tra tĩnh biến lỗi ngầm thành lỗi có vị trí cụ thể.' }
],
pitfalls: [
  'Viết mảng hoặc object mặc định trực tiếp trong withDefaults, nên mọi instance dùng chung một tham chiếu.',
  'Ép kiểu bằng as ở template hoặc chỗ dùng để tắt lỗi, thay vì sửa khai báo props hoặc emits.',
  'Tưởng kiểu thuần là kiểm tra lúc chạy, trong khi dữ liệu từ API vẫn không được kiểm tra khi vào component.'
],
selfcheck: [
  'Tôi vẫn chưa giải thích được vì sao compiler của Vue sinh khai báo runtime từ kiểu thuần mà không cần khai báo runtime viết tay.',
  'Tôi có thể giải thích bằng ví dụ prop items kiểu T[] và sự kiện select kiểu T trong một bảng chọn dòng.',
  'Tôi có thể viết defineProps có withDefaults và defineEmits có kiểu payload cho một form, rồi thêm vue-tsc vào CI.'
],
refs: ['vue-sfc', 'vue-components', 'ts-handbook']
},
{
id: 'C15',
group: 'C',
topic: 'Pinia store có kiểu TypeScript: setup store, storeToRefs và biên dữ liệu API',
prio: 'P0',
level: 'L2',
type: 'situation',
q: 'Bạn viết một Pinia store giỏ hàng bằng TypeScript: làm sao để state, getter và action đều có kiểu chặt, và vì sao khi destructuring state ra khỏi store bạn phải dùng storeToRefs?',
oral: 'Chỗ dễ sai nhất khi dùng Pinia là destructuring. Lấy state ra bằng const sẽ chụp giá trị tại thời điểm đó, chứ không lấy ref. Tôi viết store bằng setup store, tức là một hàm dùng ref và computed như trong component. Ref có kiểu tường minh, ví dụ ref<CartItem[]> khởi tạo rỗng, và total là computed có kiểu number. Khi action thay cả mảng bằng mảng mới, biến cục bộ vẫn giữ mảng cũ. Vì vậy tôi dùng storeToRefs cho state và getter, còn action gọi trực tiếp từ store. Ranh giới quan trọng nhất là dữ liệu từ API. Kiểu TypeScript chỉ tồn tại lúc biên dịch, nên tôi validate hình dạng dữ liệu lúc chạy trước khi ghi vào store.',
deep: '<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Pinia</strong>: thư viện quản lý state chính thức của Vue, dùng để chia sẻ dữ liệu giữa nhiều component. Gần với Redux hoặc Zustand trong React.</li><li><strong>store</strong>: kho state dùng chung do defineStore tạo ra. Giống một singleton trong Python: mọi nơi gọi useCartStore() đều thấy cùng một dữ liệu.</li><li><strong>setup store</strong>: cách viết store bằng một hàm trả về ref, computed và function. Giống viết một custom hook trong React.</li><li><strong>option store</strong>: cách viết store bằng object với state, getters và actions. Có sẵn $reset.</li><li><strong>ref</strong>: hộp bọc một giá trị. Trong React đây giống useState, nhưng cập nhật bằng .value và không có setState. Proxy tự theo dõi thay đổi.</li><li><strong>computed</strong>: giá trị suy ra từ giá trị khác, tự tính lại khi nguồn đổi. Giống useMemo, nhưng Vue tự theo dõi phụ thuộc nên không có mảng deps để quên.</li><li><strong>storeToRefs</strong>: bọc state và getter của store thành ref, để destructuring vẫn theo dõi được. Action không cần bọc.</li><li><strong>destructuring</strong>: lấy vài trường ra thành biến riêng, ví dụ const { items } = cart. Với state, biến lấy ra là bản chụp tại thời điểm đó.</li></ul><p><strong>Store là một object reactive.</strong> defineStore tạo ra object này một lần và dùng chung. Có hai kiểu viết: option store với các khóa state, getters và actions; và setup store nhận một hàm trả về ref, computed và function.</p><p><strong>Với TypeScript, setup store cho kiểu rõ hơn.</strong> Kiểu state chính là kiểu của ref bạn viết, không phải kiểu suy ra từ object lồng nhiều tầng. Ví dụ <code>const items = ref&lt;CartItem[]&gt;([])</code> để compiler kiểm tra mọi chỗ ghi vào items.</p><p><strong>Bridge sang React.</strong> Với useState, bạn phải gọi setState để báo thay đổi. Với ref, gán .value là đủ, Proxy tự theo dõi và cập nhật giao diện. Với computed, bạn không cần mảng deps như useMemo.</p><p><strong>Bridge watch và computed.</strong> Total là computed vì nó suy ra từ items. Đừng dùng watch để tính total rồi gán thủ công. watch chỉ dành cho side-effect, ví dụ gửi analytics khi items đổi, giống useEffect trong React. Dùng watch để tính biến phụ là sai hướng, việc đó thuộc computed.</p><p><strong>Bẫy đầu tiên là destructuring.</strong> Store là reactive, nên destructuring state làm bạn nhận giá trị tại thời điểm lấy, không nhận ref. Khi action gán mảng mới vào items, biến cục bộ vẫn trỏ về mảng cũ. storeToRefs khắc phục điều này cho state và getter, còn action lấy trực tiếp từ store.</p><p><strong>Bẫy thứ hai là kỳ vọng sai về reset.</strong> Option store có sẵn $reset, còn setup store phải tự viết hàm reset. Nếu bỏ qua, giỏ hàng của người dùng cũ vẫn còn sau khi đăng xuất.</p><p><strong>Ranh giới API là chỗ kiểu TypeScript không đủ.</strong> Response JSON có thể thiếu trường hoặc đổi số thành chuỗi. <code>as CartItem[]</code> chỉ là lời hứa của người viết. Một validator chạy trên dữ liệu thô kiểu unknown mới biến lời hứa đó thành bảo đảm trước khi store nhận dữ liệu.</p><ul><li><strong>Giữ state trong store ở mức tối thiểu.</strong> Trạng thái chỉ dùng trong một trang thì để trong component hoặc composable.</li><li><strong>Đừng lấy state trực tiếp từ store bằng destructuring thường.</strong> Dùng storeToRefs cho state và getter, còn action gọi qua store.</li></ul>',
incident: '<p><strong>Tình huống giả định.</strong> Store giỏ hàng là setup store với state items và total là computed. Trang sản phẩm viết <code>const { items } = cart</code> cho gọn.</p><p>Khi người dùng thêm sản phẩm, badge trên header vẫn đổi nhưng danh sách trên trang không đổi. Nếu trang cũng lấy total ra thành biến riêng thì tổng tiền đứng yên.</p><p>Đội tìm ra nguyên nhân là biến cục bộ đã giữ mảng cũ sau khi action thay mảng mới.</p>',
askFirst: [
  'Vì sao destructuring store lại làm giao diện không khớp với dữ liệu trong store?',
  'Vì sao kiểu TypeScript không bảo vệ được dữ liệu từ API?'
],
predict: { q: 'Store giỏ hàng có action setItems(next) gán items.value = next. Trang chạy const { items } = cart rồi gọi cart.setItems([...]). Template dùng items có hiển thị mảng mới không?', a: '<p>Không. Lúc destructuring, items lấy mảng cũ tại thời điểm đó. setItems gán mảng mới vào ref bên trong store, nhưng biến items cục bộ vẫn giữ tham chiếu cũ.</p><p>Nếu dùng <code>const { items } = storeToRefs(cart)</code>, items là ref nên template đọc giá trị hiện tại và cập nhật.</p>' },
anchor: 'Destructuring store lấy giá trị tại thời điểm đó, không lấy ref: storeToRefs giữ state và getter là ref, còn action gọi trực tiếp từ store.',
attacks: [
  { q: 'Nếu tôi dùng option store thì có tránh được bẫy destructuring không?', a: 'Không. Destructuring state từ bất kỳ reactive object nào, kể cả option store, đều lấy giá trị tại thời điểm đó. Option store chỉ khác ở cách khai báo và có sẵn $reset. Muốn giữ theo dõi state và getter khi destructuring, bạn vẫn cần storeToRefs.' },
  { q: 'Đưa state vào store để chia sẻ giữa hai trang có an toàn không?', a: 'Có thể, nhưng chỉ khi trạng thái đó thật sự cần sống qua hai trang. Nếu nó là bản sao dữ liệu của server, store sẽ cũ dần mà không ai biết, và mỗi trang phải đồng bộ lại. Hãy hỏi trước: ai là nguồn sự thật, và state này có cần tồn tại khi người dùng rời trang không.' }
],
tradeoff: '<p>Setup store cho kiểu rõ ràng và cho phép dùng composable bên trong. Đổi lại, bạn phải tự viết reset và nhớ mẫu storeToRefs.</p><p>Option store có khung chuẩn và $reset sẵn. Nhưng kiểu state suy ra từ object lồng nhiều tầng, và khó ghép với composable hơn.</p>',
alternatives: '<ul><li>Composable có state ở phạm vi module khi trạng thái là singleton đơn giản và không cần Pinia devtools hay plugin.</li><li>provide và inject khi trạng thái thuộc một cây component và cần giới hạn phạm vi, ví dụ một form nhiều bước.</li><li>Một lớp truy vấn dữ liệu riêng khi phần lớn state thật ra là cache của API, để store không phải giữ bản sao.</li></ul>',
observe: '<p><strong>Triệu chứng</strong> là giao diện không cập nhật sau action, hoặc hai nơi hiển thị hai con số khác nhau. Bật Vue devtools để xem store đã đổi trong khi màn hình không đổi, rồi đối chiếu với biến cục bộ lấy từ destructuring.</p><p><strong>Ở tầng kiểu</strong>, chạy <code>vue-tsc --noEmit</code> trong CI. <strong>Ở biên API</strong>, ghi log số lỗi validate kèm tên endpoint để biết dữ liệu xấu đến từ đâu.</p>',
say30: 'Store Pinia viết bằng setup dùng ref và computed nên kiểu state rõ ràng. Khi destructuring state hay getter ra biến riêng, phải đi qua storeToRefs để chúng còn là ref. Action thì gọi trực tiếp từ store. Kiểu TypeScript không kiểm tra dữ liệu từ API, nên phải validate ở biên trước khi ghi vào store.',
say90: 'Tôi viết store giỏ hàng bằng setup store, nên state là ref có kiểu tường minh và total là computed. Bẫy lớn nhất là destructuring. Lấy items trực tiếp từ store sẽ giữ giá trị của thời điểm đó, nên khi action thay mảng mới thì giao diện không cập nhật. Vì vậy tôi dùng storeToRefs cho state và getter, còn action gọi qua store. Tôi cũng không tin kiểu TypeScript với dữ liệu từ mạng, vì kiểu chỉ tồn tại lúc biên dịch. Ở biên tôi validate hình dạng dữ liệu rồi mới ghi vào store. Vì setup store không có $reset sẵn, tôi viết action reset rõ ràng cho lúc đăng xuất. Trạng thái chỉ dùng trong một trang thì tôi giữ trong composable, không đưa vào store.',
code: `// stores/cart.ts
import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem { id: string; qty: number; price: number }

export const useCartStore = defineStore('cart', () => {
  // ✅ Cách làm chuẩn: ref có kiểu tường minh, state có kiểu ngay từ đầu
  const items = ref<CartItem[]>([])
  // Giá trị suy ra từ items, tự tính lại khi items đổi
  const total = computed(() => items.value.reduce((s, i) => s + i.qty * i.price, 0))
  function setItems(next: CartItem[]) {
    items.value = next
  }
  // Setup store không có $reset sẵn, phải viết hàm reset riêng
  function reset() {
    items.value = []
  }
  return { items, total, setItems, reset }
})

// trang sản phẩm
const cart = useCartStore()
// ❌ Cách làm sai phổ biến: chụp giá trị tại thời điểm này, khi action thay mảng thì biến vẫn giữ mảng cũ
const { items } = cart
// ✅ Cách làm chuẩn: state và getter là ref, theo dõi được khi store đổi
const { items: liveItems, total } = storeToRefs(cart)`,
expected: null,
followups: [
  { q: 'Vì sao storeToRefs không trả về action?', a: 'storeToRefs chỉ bọc state và getter thành ref, vì đó là phần có giá trị thay đổi cần theo dõi. Action là hàm, không có giá trị nào để theo dõi, nên lấy trực tiếp từ store là đủ và không mất gì. Nếu bạn cố lấy action qua storeToRefs, nghĩa là bạn đang hiểu sai cơ chế và cần xem lại chỗ dùng.' },
  { q: 'Làm sao thiết kế để dữ liệu từ API vào store đã được kiểm chứng?', a: 'Đặt một lớp biên gọi API, nhận dữ liệu thô kiểu unknown, chạy validator để thu hẹp sang kiểu đã kiểm chứng, và chỉ khi thành công mới gọi action ghi vào store. Lỗi validate trả về thông điệp chỉ rõ trường nào sai, để log dễ truy. Store nhờ đó không bao giờ nhận một object mà kiểu nói là đúng nhưng thực tế thiếu trường.' },
  { q: 'Khi nào bạn không nên đưa một state vào Pinia?', a: 'Khi state chỉ dùng trong một trang hoặc một form, vòng đời ngắn, và không có component nào khác cần đọc. Đưa vào store khiến nó tồn tại suốt phiên, dễ rò sang trang khác sau khi người dùng đi tiếp, và làm store phình ra. Trạng thái tạm như giá trị đang gõ trong form nên để trong component hoặc composable có phạm vi rõ ràng.' }
],
pitfalls: [
  'Destructuring state từ store rồi tin giao diện vẫn theo dõi, trong khi biến cục bộ giữ giá trị lúc lấy.',
  'Dùng as CartItem[] cho dữ liệu API rồi tưởng TypeScript đã kiểm tra hình dạng lúc chạy.'
],
selfcheck: [
  'Tôi vẫn chưa giải thích được vì sao setup store không có $reset còn option store có, và phải viết gì thay thế.',
  'Tôi có thể giải thích bằng ví dụ giỏ hàng vì sao destructuring items rồi setItems làm giao diện đứng yên.',
  'Tôi có thể viết store giỏ hàng bằng setup store với ref có kiểu, storeToRefs và lớp validate ở biên API.'
],
refs: ['vue-pinia', 'ts-narrowing', 'ts-handbook']
}
);
