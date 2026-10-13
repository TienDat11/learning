var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
id: 'C14',
group: 'C',
topic: 'defineProps generic, withDefaults và typed emits trong Vue 3 với TypeScript',
prio: 'P0',
level: 'L2',
type: 'code',
q: 'Trong một component Vue 3 viết bằng TypeScript, bạn khai báo props (dữ liệu cha truyền cho con) và emits (sự kiện con gửi lên cha) thế nào để compiler (bộ biên dịch của Vue) bắt được lỗi truyền sai kiểu, và vì sao defineProps (hàm khai báo props) cần generic (tham số kiểu, cho phép làm việc với nhiều kiểu) còn withDefaults (hàm gán giá trị mặc định cho props) cần thêm một bước?',
oral: 'Bạn khai báo props (dữ liệu cha truyền cho con) bằng kiểu TypeScript thay vì object runtime: defineProps (hàm khai báo props) nhận một kiểu Props, và compiler (bộ biên dịch) của Vue sinh khai báo runtime tương ứng lúc build, nên vừa có kiểm tra kiểu lúc gõ mã vừa có kiểm tra prop lúc chạy trong dev. Kiểu thuần không mang giá trị mặc định, nên prop tùy chọn cần mặc định qua withDefaults (hàm gán giá trị mặc định cho props), ví dụ size mặc định là md. Object và array mặc định phải được trả về từ một hàm tạo giá trị mới, ví dụ tags mặc định là hàm tạo mảng rỗng, để mỗi instance (một bản component đang chạy) có mảng riêng. Emits (sự kiện con phát lên cha) khai báo bằng defineEmits (hàm khai báo sự kiện) kèm kiểu payload (dữ liệu đi kèm sự kiện), nên gọi sai tên sự kiện hay sai kiểu dữ liệu bị báo ngay ở dòng gọi. Khi component cần giữ quan hệ giữa kiểu đầu vào và kiểu đầu ra, như danh sách items kiểu T và sự kiện chọn kiểu T, bạn thêm generic (tham số kiểu, cho phép làm việc với nhiều kiểu dữ liệu) vào thẻ script setup (cú pháp rút gọn của thẻ script trong Vue). Nếu bỏ qua các bước này, lỗi chỉ lộ ra khi người dùng thao tác.',
deep: '<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>props</strong>: dữ liệu cha truyền xuống con, giống tham số của một hàm. Ví dụ size="md" truyền vào một card thì size là prop.</li><li><strong>defineProps</strong>: hàm đặc biệt của Vue, không cần import, dùng để khai báo props. Giống khai báo các field của serializer trong Django REST Framework.</li><li><strong>withDefaults</strong>: bọc defineProps để gán giá trị mặc định cho prop tùy chọn, giống default= trong field của Django model.</li><li><strong>defineEmits</strong>: khai báo các sự kiện con có thể phát ra cho cha, giống một callback mà cha truyền xuống con trong React.</li><li><strong>generic</strong>: tham số kiểu, cho component làm việc với nhiều kiểu dữ liệu, giống list[T] hay TypeVar trong Python typing.</li><li><strong>SFC (Single File Component)</strong>: kiểu file của Vue, gom template, script và style vào cùng một file .vue.</li><li><strong>script setup</strong>: cú pháp rút gọn của thẻ script trong SFC, mọi khai báo ở cấp cao nhất tự dùng được trong template.</li><li><strong>vue-tsc</strong>: công cụ kiểm tra kiểu TypeScript cho file .vue, chạy riêng giống mypy cho Python, vì Vite chỉ chuyển mã mà không kiểm tra kiểu.</li></ul><p>Có ba lớp cần tách bạch: kiểu của props, kiểu của sự kiện và kiểu của dữ liệu thật đi qua mạng. defineProps với kiểu thuần cho TypeScript biết hình dạng, còn compiler của Vue chuyển kiểu đó thành khai báo runtime để kiểm tra lúc chạy. Kiểm tra tĩnh chỉ bảo vệ những gì đi qua code bạn viết; dữ liệu từ API vẫn là thứ chưa kiểm chứng khi vào component.</p><p>Cách làm sai phổ biến là viết <code>defineProps({ items: Array })</code> rồi ép kiểu bằng <code>as</code> ở chỗ dùng. Khi đó compiler không biết phần tử bên trong là gì, và mọi lỗi cấu trúc chỉ lộ ra lúc render. Khai báo kiểu thuần khắc phục điều đó vì tên trường và kiểu phần tử được kiểm tra ngay tại định nghĩa lẫn tại chỗ dùng.</p><p>withDefaults tồn tại vì kiểu thuần không chứa giá trị. Prop kiểu boolean thiếu giá trị thì Vue tự đặt false, nhưng chuỗi, số hay object thì bạn phải đưa mặc định vào. Object và array mặc định phải được trả về từ một hàm, ví dụ <code>tags: () =&gt; []</code>. Viết <code>tags: []</code> thì các instance dùng chung một tham chiếu, đúng kiểu bẫy mutable default argument mà bạn đã gặp ở Python, chỉ khác ngôn ngữ.</p><p>Emits có hai dạng. Dạng call signature như <code>(e: "select", id: number): void</code> giữ kiểu payload chặt và dễ đọc. Dạng tuple có tên như <code>{ select: [id: number] }</code> ngắn hơn khi có nhiều sự kiện. Với cả hai dạng, emit sai tên hoặc sai payload đều báo lỗi tại dòng gọi, không chờ tới lúc cha nhận sự kiện.</p><p>Generic dùng khi chính component cần giữ mối quan hệ giữa kiểu dữ liệu và sự kiện, ví dụ <code>items: T[]</code> và sự kiện phát ra kiểu T. Bạn khai báo bằng thuộc tính generic trên thẻ script setup. Không nên dùng generic khi kiểu luôn cố định, vì khi đó nó chỉ thêm ký hiệu cần đọc mà không thêm an toàn nào.</p><ul><li>Kiểu thuần phù hợp khi hợp đồng của component ổn định. Khai báo runtime phù hợp khi schema đến từ nơi động, ví dụ cấu hình tải từ server.</li><li>Ép kiểu bằng <code>as</code> ở template hoặc chỗ dùng chỉ che lỗi. Hãy sửa khai báo props hoặc emits thay vì ép kiểu.</li></ul>',
incident: '<p>Tình huống giả định: Một bảng quản trị đơn hàng nhận props items khai báo bằng Array, không kiểu phần tử. Backend đổi trường price từ số sang chuỗi, component vẫn biên dịch bình thường vì không ai kiểm tra kiểu phần tử. Màn hình tính tổng ra NaN trong nhiều ngày, và đội chỉ phát hiện khi kế toán đối chiếu số liệu.</p>',
askFirst: [
  'Vì sao props khai báo Array vẫn để lọt lỗi kiểu của phần tử bên trong?',
  'Vì sao object hoặc array mặc định trong withDefaults phải là một hàm?'
],
predict: { q: 'Bạn đoán: nếu hai instance cùng dùng mặc định tags: [] và một instance push thêm phần tử vào tags, instance kia có thấy phần tử đó không?', a: '<p>Có. Giá trị mặc định chỉ được tạo một lần khi khai báo, nên các instance thiếu prop đó dùng chung một mảng. Lỗi này chỉ lộ ra khi dữ liệu của hai instance lẫn vào nhau. Dùng tags: () =&gt; [] để mỗi instance nhận một mảng mới.</p>' },
anchor: 'Props khai báo bằng kiểu thuần và emits có kiểu payload là lỗi sai hình dạng dữ liệu bị bắt ngay lúc gõ mã, thay vì lúc người dùng bấm.',
attacks: [
  { q: 'Vì sao khai báo kiểu thuần chưa đủ khi dữ liệu đến từ API?', a: 'Kiểu chỉ tồn tại lúc biên dịch. JSON đi qua mạng là dữ liệu chưa kiểm chứng khi chạy, nên nếu backend trả price là chuỗi trong khi kiểu nói là số, TypeScript không hề biết. Cần một bước kiểm tra lúc chạy ở biên, ví dụ validator, rồi mới đưa dữ liệu vào props. Kiểu chỉ là lời hứa của lập trình viên khi dữ liệu còn chưa được kiểm tra.' },
  { q: 'Nếu tôi dùng any cho một prop phức tạp để làm nhanh thì sao?', a: 'Prop đó mất kiểm tra ở mọi chỗ nó chảy qua, và lỗi chỉ hiện ở người dùng cuối. Hãy đặt kiểu rõ cho dữ liệu. Nếu thật sự chưa biết hình dạng, dùng unknown rồi thu hẹp bằng kiểm tra, vì unknown buộc bạn chứng minh kiểu trước khi dùng.' }
],
tradeoff: '<p>Kiểu thuần cho mã ngắn, nhưng bạn phụ thuộc vào compiler SFC để sinh khai báo runtime. Dev server và bundler chỉ chuyển mã, không kiểm tra kiểu, nên phải chạy riêng vue-tsc thì kiểm tra tĩnh mới có tác dụng. Khối script chứa cú pháp TypeScript phải có lang="ts", thiếu thì những dòng như type Props gây lỗi phân tích cú pháp.</p><p>Khai báo runtime rõ ràng và dễ dùng cho dữ liệu động, nhưng TypeScript không suy ra được kiểu chi tiết của object lồng nhau, nên bạn phải viết lại kiểu ở chỗ khác.</p>',
alternatives: '<ul><li>Đặt kiểu dùng chung trong một file .ts riêng và import vào các component cần dùng.</li><li>Dùng khai báo runtime khi props đến từ schema động, ví dụ cấu hình từ server.</li><li>Dùng generic khi có quan hệ giữa kiểu dữ liệu và sự kiện. Không dùng khi kiểu cố định.</li></ul>',
observe: '<p>Sai kiểu ở prop cấp cao nhất còn có cảnh báo Vue trong console khi chạy dev, nên bạn tìm lỗi ở đó. Các giá trị NaN hoặc undefined lọt vào template là dấu hiệu cần chú ý.</p><p>Thêm <code>vue-tsc --noEmit</code> vào bước kiểm tra của pull request để chặn lỗi kiểu trước khi merge. Đây là cách rẻ nhất để giữ hợp đồng kiểu giữa component và nơi gọi.</p>',
say30: 'defineProps (hàm khai báo props) nhận kiểu TypeScript, và compiler (bộ biên dịch) của Vue sinh khai báo runtime từ kiểu đó. Lỗi kiểu tĩnh được bắt trong IDE có hỗ trợ Vue và khi chạy vue-tsc (công cụ kiểm tra kiểu cho Vue), vì Vite chỉ chuyển mã chứ không kiểm tra kiểu. Object hoặc array mặc định phải là hàm trả về giá trị mới. Emits (sự kiện con phát lên cha) khai báo kiểu payload (dữ liệu đi kèm sự kiện) để gọi sai tên hay sai kiểu bị báo ngay. Generic (tham số kiểu) giữ quan hệ giữa dữ liệu đầu vào và sự kiện đầu ra.',
say90: 'Khi khai báo props (dữ liệu cha truyền cho con), tôi dùng kiểu TypeScript thay cho object runtime. Compiler (bộ biên dịch) của Vue đọc kiểu đó và sinh khai báo runtime, nên vừa có kiểm tra tĩnh vừa có kiểm tra lúc chạy trong dev. Với giá trị mặc định, tôi dùng withDefaults (hàm gán giá trị mặc định cho props). Với object hoặc mảng, mặc định là một hàm trả về giá trị mới, để không có chuyện nhiều instance (bản component đang chạy) dùng chung một tham chiếu. Với emits (sự kiện con gửi lên cha), tôi khai báo kiểu payload (dữ liệu đi kèm sự kiện) để hợp đồng giữa con và cha rõ ràng. Khi component cần giữ quan hệ giữa kiểu đầu vào và kiểu đầu ra, tôi dùng generic (tham số kiểu, cho phép làm việc với nhiều kiểu). Điều tôi không làm là ép kiểu bằng as (ép kiểu, buộc TypeScript tin một kiểu) ở chỗ dùng, vì nó che lỗi chứ không sửa được lỗi. Trong CI tôi thêm vue-tsc (công cụ kiểm tra kiểu cho Vue) để các lỗi này dừng ở pull request, không tới người dùng.',
code: `<script setup lang="ts" generic="T extends { id: string }">
type Props = {
  items: T[]
  selectedId?: string
  size?: 'sm' | 'md' | 'lg'
  tags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  tags: () => [],
})

const emit = defineEmits<{
  select: [item: T]
}>()

function pick(item: T) {
  emit('select', item)
}
</script>`,
expected: null,
followups: [
  { q: 'Vì sao withDefaults với object cần hàm trả về, còn chuỗi và số thì không?', a: 'Object và array là tham chiếu, nên một giá trị viết sẵn sẽ được dùng chung khi nhiều instance cùng thiếu prop đó. Chuỗi và số là giá trị nguyên thủy, gán mặc định không làm ảnh hưởng instance khác. Vì vậy với mảng hoặc object, bạn trả về giá trị mới từ một hàm để mỗi instance có bản riêng.' },
  { q: 'Khi nào bạn dùng generic trong script setup, và khi nào nó làm code khó đọc mà không thêm an toàn?', a: 'Dùng generic khi có quan hệ giữa kiểu đầu vào và kiểu đầu ra, ví dụ danh sách T[] phát ra sự kiện có payload kiểu T, để nơi dùng component thấy đúng kiểu phần tử họ đưa vào. Không nên dùng khi kiểu luôn cố định, vì khi đó một interface thường đã đủ. Quy tắc đơn giản: nếu hai kiểu phải khớp nhau, generic là lựa chọn đúng.' },
  { q: 'Lỗi emit sai tên sự kiện được phát hiện ở đâu, và vì sao không nên dựa vào console để bắt nó?', a: 'Khi defineEmits có kiểu, TypeScript báo lỗi ngay tại dòng gọi emit, nên lỗi sai tên hoặc sai payload được chặn trong editor và trong vue-tsc ở CI. Dựa vào console thì bạn chỉ thấy lỗi khi nhánh đó chạy, mà một nhánh hiếm có thể không bao giờ chạy trong dev. Kiểm tra tĩnh biến lỗi ngầm thành lỗi có vị trí cụ thể.' }
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
q: 'Bạn viết một Pinia (thư viện quản lý state của Vue) store (kho state dùng chung) giỏ hàng bằng TypeScript: làm sao để state, getter (giá trị suy ra từ state) và action (hàm thay đổi state) đều có kiểu chặt, và vì sao khi destructuring (lấy vài trường ra thành biến riêng) state ra khỏi store bạn phải dùng storeToRefs (hàm bọc state và getter thành ref)?',
oral: 'Tôi viết store (kho state dùng chung) bằng cú pháp setup (viết store dưới dạng một hàm), tức là một hàm dùng ref (hộp bọc một giá trị, đổi thì giao diện cập nhật) và computed (giá trị tự tính lại khi nguồn đổi) như trong component. Mỗi ref được gán kiểu tường minh, ví dụ ref có kiểu danh sách CartItem khởi tạo rỗng, nên state có kiểu ngay từ đầu. Getter (giá trị suy ra từ state) là computed, nên tổng tiền có kiểu number và tự cập nhật khi items đổi. Action (hàm thay đổi state) là hàm có tham số và kiểu trả về rõ ràng, nên chỗ gọi từ component được kiểm tra như mọi hàm khác. Chỗ dễ sai nhất là destructuring (lấy vài trường ra thành biến riêng): lấy items ra bằng const sẽ giữ giá trị tại thời điểm đó, và khi một action thay cả mảng bằng mảng mới thì biến cục bộ vẫn giữ mảng cũ. storeToRefs (hàm bọc state và getter thành ref) giữ state và getter là ref còn theo dõi được, còn action thì lấy trực tiếp từ store. Ranh giới quan trọng nhất là dữ liệu từ API (chỗ dữ liệu từ backend đi vào frontend): kiểu TypeScript chỉ tồn tại lúc biên dịch, nên trước khi ghi vào store tôi validate (kiểm tra) hình dạng dữ liệu lúc chạy.',
deep: '<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Pinia</strong>: thư viện quản lý state chính thức của Vue, dùng để chia sẻ dữ liệu giữa nhiều component. Gần với Redux trong React.</li><li><strong>store</strong>: kho state dùng chung, do defineStore tạo ra. Giống một object dùng chung kiểu singleton trong Python: mọi nơi gọi useCartStore() đều thấy cùng một dữ liệu.</li><li><strong>setup store</strong>: cách viết store bằng một hàm trả về ref, computed và function, giống cách viết component bằng hàm.</li><li><strong>option store</strong>: cách viết store bằng object với state, getters và actions; có sẵn $reset.</li><li><strong>ref</strong>: hộp bọc một giá trị; khi giá trị đổi, giao diện đọc hộp đó sẽ cập nhật. Truy cập qua .value trong script.</li><li><strong>computed</strong>: giá trị suy ra từ giá trị khác, tự tính lại khi nguồn đổi. Giống useMemo trong React nhưng tự theo dõi phụ thuộc.</li><li><strong>storeToRefs</strong>: hàm bọc state và getter của store thành ref, để destructuring vẫn theo dõi được. Action không cần bọc.</li><li><strong>destructuring</strong>: lấy vài trường ra thành biến riêng, ví dụ const { items } = cart. Với state, biến lấy ra là bản chụp tại thời điểm đó.</li></ul><p>Store của Pinia là một object reactive do defineStore tạo ra. Có hai kiểu viết: option store với các khóa state, getters, actions; và setup store nhận một hàm trả về ref, computed và function. Với TypeScript, setup store có lợi thế rõ: kiểu state chính là kiểu của ref bạn viết, không phải kiểu suy ra từ một object lồng nhiều tầng. Ví dụ <code>const items = ref&lt;CartItem[]&gt;([])</code> cho compiler kiểm tra mọi chỗ ghi vào items.</p><p>Bẫy đầu tiên là destructuring. Store là reactive, nên destructuring state làm bạn nhận giá trị tại thời điểm lấy, không nhận ref. Khi action gán một mảng mới vào items, biến cục bộ vẫn trỏ về mảng cũ và giao diện không khớp với store. storeToRefs khắc phục điều này cho state và getter, còn action thì không cần ref nên bạn lấy trực tiếp từ store.</p><p>Bẫy thứ hai là kỳ vọng sai về reset. Option store có sẵn $reset, còn setup store thì bạn phải viết hàm reset của riêng mình. Nếu bỏ qua điều này, giỏ hàng của người dùng cũ vẫn còn sau khi đăng xuất.</p><p>Ranh giới API là chỗ kiểu TypeScript không đủ. Một response JSON có thể thiếu trường hoặc đổi số thành chuỗi, và <code>as CartItem[]</code> chỉ là lời hứa của người viết. Kiểm tra ở biên, ví dụ một validator chạy trên dữ liệu thô kiểu unknown, biến lời hứa đó thành bảo đảm trước khi store nhận dữ liệu.</p><ul><li>Giữ state trong store ở mức tối thiểu. Trạng thái chỉ dùng trong một trang thì để trong component hoặc composable.</li><li>Đừng destructuring state trực tiếp từ store. Dùng storeToRefs cho state và getter, còn action gọi qua store.</li></ul>',
incident: '<p>Tình huống giả định: Store giỏ hàng là setup store với state items và total là computed. Trang sản phẩm viết const { items } = cart cho gọn. Khi người dùng thêm sản phẩm, badge trên header vẫn đổi nhưng danh sách trên trang không đổi. Nếu trang cũng lấy total ra thành biến riêng thì tổng tiền đứng yên. Đội tìm ra nguyên nhân là biến cục bộ đã giữ mảng cũ sau khi action thay mảng mới.</p>',
askFirst: [
  'Vì sao destructuring store lại làm giao diện không khớp với dữ liệu trong store?',
  'Vì sao kiểu TypeScript không bảo vệ được dữ liệu từ API?'
],
predict: { q: 'Store giỏ hàng có action setItems(next) gán items.value = next. Trang chạy const { items } = cart rồi gọi cart.setItems([...]). Template dùng items có hiển thị mảng mới không?', a: '<p>Không. Lúc destructuring, items lấy mảng cũ tại thời điểm đó. setItems gán một mảng mới vào ref bên trong store, nhưng biến items cục bộ vẫn giữ tham chiếu mảng cũ. Nếu dùng const { items } = storeToRefs(cart), items là ref nên template đọc giá trị hiện tại và cập nhật.</p>' },
anchor: 'Destructuring store lấy giá trị tại thời điểm đó, không lấy ref: storeToRefs giữ state và getter là ref, còn action gọi trực tiếp từ store.',
attacks: [
  { q: 'Nếu tôi dùng option store thì có tránh được bẫy destructuring không?', a: 'Không. Destructuring state từ bất kỳ reactive object nào, kể cả option store, đều lấy giá trị tại thời điểm đó. Option store chỉ khác ở cách khai báo và có sẵn $reset. Muốn giữ theo dõi state và getter khi destructuring, bạn vẫn cần storeToRefs.' },
  { q: 'Đưa state vào store để chia sẻ giữa hai trang có an toàn không?', a: 'Có thể, nhưng chỉ khi trạng thái đó thật sự cần sống qua hai trang. Nếu nó là bản sao dữ liệu của server, store sẽ cũ dần mà không ai biết, và mỗi trang phải đồng bộ lại. Hãy hỏi trước: ai là nguồn sự thật, và state này có cần tồn tại khi người dùng rời trang không.' }
],
tradeoff: '<p>Setup store cho kiểu rõ ràng và cho phép dùng composable bên trong, nhưng bạn phải tự viết reset và nhớ mẫu storeToRefs. Option store có khung chuẩn và $reset sẵn, nhưng kiểu state được suy ra từ object lồng nhau và khó ghép với composable hơn.</p>',
alternatives: '<ul><li>Composable có state ở phạm vi module khi trạng thái là singleton đơn giản và không cần Pinia devtools hay plugin.</li><li>provide và inject khi trạng thái thuộc một cây component và cần giới hạn phạm vi, ví dụ một form nhiều bước.</li><li>Một lớp truy vấn dữ liệu riêng khi phần lớn state thật ra là cache của API, để store không phải giữ bản sao.</li></ul>',
observe: '<p>Triệu chứng là giao diện không cập nhật sau action, hoặc hai nơi hiển thị hai con số khác nhau. Bật Vue devtools để xem store đã đổi trong khi màn hình không đổi, rồi đối chiếu với biến cục bộ đã lấy từ destructuring.</p><p>Ở tầng kiểu, chạy <code>vue-tsc --noEmit</code> trong CI. Ở biên API, ghi log số lỗi validate kèm tên endpoint để biết dữ liệu xấu đến từ đâu.</p>',
say30: 'Store Pinia (kho state dùng chung do thư viện Pinia của Vue quản lý) viết bằng setup (cách viết store dưới dạng một hàm) dùng ref (hộp bọc một giá trị) và computed (giá trị tự tính lại) nên kiểu state rõ ràng. Đọc thẳng cart.items thì không cần gì thêm, nhưng khi destructuring (lấy vài trường ra thành biến riêng) state hay getter (giá trị suy ra từ state) ra biến riêng thì phải đi qua storeToRefs (hàm bọc state và getter thành ref) để chúng còn là ref; action (hàm thay đổi state) thì gọi trực tiếp từ store. Kiểu TypeScript không kiểm tra dữ liệu từ API, nên phải validate (kiểm tra hình dạng dữ liệu) ở biên trước khi ghi vào store.',
say90: 'Tôi viết store (kho state dùng chung) giỏ hàng bằng setup store (viết store dưới dạng một hàm) để state là ref (hộp bọc một giá trị) có kiểu tường minh và getter (giá trị suy ra từ state) là computed (giá trị tự tính lại khi nguồn đổi). Bẫy lớn nhất là destructuring (lấy vài trường ra thành biến riêng): lấy items trực tiếp từ store sẽ giữ tham chiếu của thời điểm đó, nên khi action (hàm thay đổi state) thay mảng mới thì giao diện không cập nhật. Vì vậy tôi dùng storeToRefs (hàm bọc state và getter thành ref) cho state và getter, còn action thì gọi qua store. Tôi cũng không tin kiểu TypeScript với dữ liệu từ mạng, vì kiểu chỉ tồn tại lúc biên dịch. Ở biên tôi validate (kiểm tra) hình dạng dữ liệu rồi mới ghi vào store. Vì setup store không có $reset (hàm đặt lại state) sẵn, tôi viết một action reset rõ ràng cho lúc đăng xuất. Với trạng thái chỉ dùng trong một trang, tôi không đưa vào store mà giữ trong composable (hàm tái sử dụng logic có state, gần giống custom hook của React).',
code: `// stores/cart.ts
import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem { id: string; qty: number; price: number }

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const total = computed(() => items.value.reduce((s, i) => s + i.qty * i.price, 0))
  function setItems(next: CartItem[]) {
    items.value = next
  }
  function reset() {
    items.value = []
  }
  return { items, total, setItems, reset }
})

// trang sản phẩm
const cart = useCartStore()
const { items } = cart                       // sai: lấy giá trị tại thời điểm này
const { items: liveItems, total } = storeToRefs(cart)  // đúng: state và getter là ref`,
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
