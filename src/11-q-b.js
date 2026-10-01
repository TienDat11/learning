var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
  {
    id: 'B01',
    group: 'B',
    topic: 'Primitive và reference, mutation, shallow copy bằng spread',
    prio: 'P0',
    level: 'L2',
    type: 'concept',
    q: 'Trong JavaScript, primitive và reference khác nhau thế nào khi gán và khi truyền vào hàm, và khi nào spread tạo ra một bản sao độc lập thật sự?',
    oral: 'JavaScript có bảy kiểu primitive như number, string, boolean, null, undefined, symbol và bigint, còn lại là object, array và function thuộc nhóm tham chiếu. Khi bạn gán hay truyền vào hàm, primitive được sao chép theo giá trị nên hai biến hoàn toàn độc lập, còn object chỉ sao chép địa chỉ nên hai tên trỏ cùng một vùng nhớ và sửa bên này thấy bên kia đổi theo. const chỉ khóa không cho gán lại binding chứ không đóng băng nội dung object, nên thuộc tính bên trong vẫn sửa tự do. Spread với object tạo shallow copy: tầng ngoài tách nhưng object con vẫn dùng chung tham chiếu, và đó là lý so sánh hai thuộc tính prefs vẫn ra true. Khi cần snapshot độc lập cho object lồng nhau thì dùng structuredClone, còn dữ liệu JSON thuần thì clone tay từng tầng sẽ rẻ và dễ kiểm soát hơn.',
    deep: '<p><strong>Hai chế độ sao chép.</strong> Primitive là giá trị đơn vị, engine sao chép trực tiếp nên hai biến không liên quan. Object, array và function là tham chiếu: biến chỉ giữ địa chỉ, nên gán hay truyền hàm chỉ tạo ra một tên khác cùng trỏ tới một vùng nhớ.</p><ul><li><strong>Mutation:</strong> gán thuộc tính hay gọi push, splice, sort đều là mutation, sửa trực tiếp vùng nhớ mà mọi tham chiếu khác cũng thấy.</li><li><strong>const không phải immutability:</strong> const khóa binding, không khóa nội dung. Object.freeze mới chặn gán, nhưng mặc định cũng chỉ shallow nên phải đóng băng từng tầng con nếu muốn bất biến thật.</li><li><strong>Shallow copy bằng spread:</strong> spread tạo object mới ở tầng ngoài, nhưng mọi giá trị bên trong vẫn là tham chiếu cũ, nên sửa tầng con làm bản gốc đổi theo.</li><li><strong>Khi nào dùng:</strong> khi cần đưa snapshot vào callback hoặc reducer mà không sợ phía nhận sửa ngược lại state, hãy copy tầng ngoài trước.</li><li><strong>Khi nào không dùng:</strong> khi logic dựa trên so sánh tham chiếu để phát hiện thay đổi, copy tạo tham chiếu mới mỗi lần và phá vỡ cơ chế cache của useMemo hay React.memo.</li><li><strong>Điều kiện thay đổi:</strong> nếu dữ liệu luôn là JSON thuần một tầng thì shallow copy là đủ, và việc so sánh tham chiếu vẫn hữu ích. Chỉ khi xuất hiện tầng lồng nhau, Date, Map hay class instance mới cần deep copy, và khi đó so sánh tham chiếu mất ý nghĩa vì hai bản sao luôn khác nhau.</li></ul>',
    code: 'const user = { name: "An", prefs: { theme: "dark" } };\nfunction update(u) {\n  u.prefs.theme = "light";\n}\nupdate(user);\nconst copy = { ...user };\ncopy.prefs.theme = "solar";\nconsole.log(user.prefs.theme);\nconsole.log(copy.prefs === user.prefs);',
    expected: null,
    followups: [
      { q: 'Khi nào shallow copy bằng spread là đủ và khi nào phải deep copy?', a: 'Shallow copy đủ khi dữ liệu chỉ có một tầng, ví dụ danh sách thẻ UI với id và nhãn, vì không có object con nào để chia sẻ tham chiếu. Phải deep copy khi có tầng lồng nhau và bạn cần snapshot độc lập thật sự, ví dụ lưu bản sao form trước khi người dùng sửa để hủy thay đổi. Khi đó structuredClone xử lý được object thuần, Map, Set và Date, còn dữ liệu có function hay class instance thì phải clone tay từng nhánh để kiểm soát chính xác những gì được sao chép.' },
      { q: 'Vì sao Object.freeze mặc định chưa làm object thật sự bất biến?', a: 'Object.freeze chỉ chặn gán và xoá thuộc tính ở cấp đối tượng được gọi, các object con bên trong vẫn sửa bình thường. Muốn bất biến sâu thì phải duyệt từng tầng và freeze từng node con, hoặc dùng pattern copy-on-write: thay đổi bằng cách tạo object mới thay vì sửa tại chỗ. Trong ứng dụng thực tế, copy-on-write thường rẻ và dễ kiểm soát hơn việc đóng băng đệ quy.' },
      { q: 'Việc copy tạo tham chiếu mới ảnh hưởng thế nào tới useMemo hay React.memo?', a: 'Mỗi lần gọi spread tạo một object mới nên tham chiếu luôn khác, kể cả khi dữ liệu bên trong không đổi. useMemo và React.memo so sánh tham chiếu nên sẽ coi là thay đổi và render lại, mất tác dụng cache. Nếu bạn vừa memoize vừa copy ở mỗi render thì bạn tự phá cache của chính mình; chỉ copy khi thật sự cần snapshot độc lập.' }
    ],
    pitfalls: [
      'Tưởng const làm object bất biến, trong khi const chỉ khóa binding và thuộc tính bên trong vẫn gán lại được.',
      'Tưởng spread là deep copy, trong khi mọi object con vẫn chia sẻ tham chiếu với bản gốc.',
      'Dùng spread trong mỗi lần render rồi tưởng useMemo vẫn cache được vì tham chiếu luôn mới.'
    ],
    selfcheck: [
      'Tôi vẫn chưa giải thích được tại sao hai object con trùng nhau vẫn cho kết quả đúng sau khi dùng spread.',
      'Tôi giải thích được bằng ví dụ cụ thể: copy form bằng spread rồi người dùng sửa prefs làm cả bản gốc đổi theo.',
      'Tôi chọn được khi nào dùng shallow copy và khi nào deep copy khi xử lý state nhiều tầng trong dự án thật.'
    ],
    refs: ['mdn-execution-model']
  },
  {
    id: 'B02',
    group: 'B',
    topic: 'var, let, const, phạm vi, hoisting và TDZ',
    prio: 'P0',
    level: 'L2',
    type: 'debug',
    q: 'Đoạn khai báo biến bên dưới in ra những gì, và vì sao đọc biến trước khi khai báo lại cho kết quả khác nhau giữa var và let?',
    oral: 'Ba khai báo này khác nhau cả về phạm vi lẫn thời điểm sẵn sàng. Khai báo var được hoisting lên đầu phạm vi hàm và được khởi tạo bằng undefined, nên đọc trước không lỗi, chỉ ra giá trị undefined. Khai báo let và const cũng được engine ghi nhận trước nhưng nằm trong vùng temporal dead zone cho tới dòng khai báo, nên chạm vào trong vùng đó sẽ ném ReferenceError chứ không phải undefined. Một khác biệt nữa rất dễ gây bug là phạm vi: var có phạm vi hàm nên các closure trong vòng lặp đều dùng chung một biến, còn let tạo binding mới cho mỗi vòng lặp. Đó là lý do khi dùng var, ba hàm bắt lấy đều trả về cùng giá trị cuối cùng. Trong code mới nên dùng const trước, chỉ dùng let khi biến thật sự cần gán lại.',
    deep: '<p><strong>Hoisting là gì:</strong> engine phân tích toàn bộ khối mã trước khi chạy, nên các khai báo biến ở cấp khối đều được ghi nhận từ đầu scope. Khác biệt nằm ở bước khởi tạo.</p><ul><li><strong>var:</strong> hoisting kèm khởi tạo undefined, phạm vi là hàm chứ không phải khối. Biến khai báo trong khối if hay for vẫn tồn tại bên ngoài khối đó.</li><li><strong>let và const:</strong> chỉ hoisting binding, không khởi tạo ngay. Khoảng thời gian đó gọi là temporal dead zone và truy cập sẽ ném ReferenceError.</li><li><strong>Closure trong vòng lặp:</strong> với var, mọi lần lặp dùng chung một binding nên các hàm bắt lấy cùng một ô nhớ và sau vòng lặp tất cả trả về giá trị cuối. Với let, mỗi lần lặp tạo binding riêng nên mỗi hàm giữ đúng giá trị của lần lặp đó.</li><li><strong>Vì sao cần biết:</strong> đây là nguồn gốc của rất nhiều bug kiểu callback chạy sai giá trị trong vòng lặp, và của lỗi không hiểu vì sao đọc biến ra lỗi ở giữa hàm.</li><li><strong>Khi nào dùng gì:</strong> const cho mặc định, let khi cần gán lại, không dùng var trong code mới vì phạm vi hàm gây rò biến ra ngoài khối.</li><li><strong>Điều kiện thay đổi:</strong> nếu file chạy ở strict mode thì hành vi this khác, nhưng quy tắc hoisting và TDZ không đổi. Nếu một biến được khai báo ở cấp module thì phạm vi là module, còn khai báo trong script cũ thì thành biến global thuộc window và có thể bị code khác ghi đè.</li></ul>',
    code: 'console.log(x);\nvar x = 10;\ntry {\n  console.log(y);\n} catch (err) {\n  console.log(err.name);\n}\nlet y = 20;\nvar fns = [];\nfor (var i = 0; i < 3; i++) {\n  fns.push(function () { return i; });\n}\nconsole.log(fns.map(function (f) { return f(); }).join(","));',
    expected: 'In ra ba dòng: undefined, ReferenceError, rồi 3,3,3. Nguyên nhân: khai báo var được hoisting lên đầu phạm vi hàm kèm giá trị undefined nên đọc trước vẫn chạy; let chỉ hoisting binding nên nằm trong temporal dead zone và đọc trước khai báo ném ReferenceError; var có phạm vi hàm nên ba closure trong vòng lặp dùng chung một binding i và cùng thấy giá trị 3 sau khi vòng lặp kết thúc.',
    followups: [
      { q: 'Temporal dead zone khác gì với việc biến chưa khai báo hoàn toàn?', a: 'Biến chưa khai báo hoàn toàn không có binding nào trong môi trường, engine trả về ReferenceError theo đường khác. Biến let trong vùng temporal dead zone thì đã có binding nhưng chưa được khởi tạo, và truy cập vào đó cũng ném ReferenceError với thông điệp nói rõ biến nằm trong vùng chết tạm thời. Về mặt quan sát được, thông báo lỗi là nơi duy nhất phân biệt hai tình huống này.' },
      { q: 'Vì sao let trong vòng lặp lại tạo binding riêng cho từng lần lặp?', a: 'Đặc tả ngôn ngữ quy định mỗi lần lặp với let hoặc const sẽ sao chép giá trị hiện tại của biến ra một binding mới cho thân vòng lặp. Nhờ vậy các closure tạo trong mỗi lần lặp giữ đúng giá trị của lần lặp đó, thay vì cùng trỏ tới một ô nhớ. Đây là cơ chế lặp bất biến theo từng lần và cũng là lý do không thể gán lại biến let bên trong thân vòng lặp.' },
      { q: 'Khi nào var vẫn còn hữu ích trong code hiện đại?', a: 'Trong code mới gần như không có chỗ nào cần var vì let và const phạm vi gọn và an toàn hơn. var chỉ còn xuất hiện trong script cũ chạy ngoài module, ở global object nên còn giữ phong cách khai báo biến toàn cục. Nếu gặp var trong code cũ, hãy đổi sang const hoặc let một cách cẩn thận vì đổi phạm vi có thể làm hỏng logic đang dựa vào việc biến tràn ra ngoài khối.' }
    ],
    pitfalls: [
      'Tưởng let đọc trước khi khai báo sẽ ra undefined như var, trong khi nó ném ReferenceError vì nằm trong temporal dead zone.',
      'Dùng var trong vòng lặp rồi tạo callback, kết quả mọi callback trả về cùng giá trị cuối cùng.',
      'Khai báo biến bằng var trong khối rồi tưởng biến đó chỉ tồn tại trong khối, thực tế nó tồn tại ở phạm vi hàm.'
    ],
    selfcheck: [
      'Tôi vẫn chưa giải thích được vì sao cùng một vòng lặp nhưng var và let cho kết quả closure khác nhau.',
      'Tôi giải thích được temporal dead zone bằng ví dụ đọc biến let trước dòng khai báo làm đổi thứ tự log trong console.',
      'Tôi có thể rà một file cũ dùng var trong vòng lặp và sửa sang let mà không làm hỏng hành vi callback.'
    ],
    refs: ['mdn-execution-model']
  },
  {
    id: 'B03',
    group: 'B',
    topic: 'So sánh bằng và ba dấu bằng, ép kiểu, truthy falsy, null và undefined',
    prio: 'P0',
    level: 'L1',
    type: 'predict',
    q: 'Bốn biểu thức so sánh và ép kiểu dưới đây cho kết quả thế nào, và quy tắc nào đứng sau mỗi kết quả?',
    oral: 'Dấu ba dấu bằng so sánh cả giá trị lẫn kiểu dữ liệu, nên hai biến khác kiểu chắc chắn khác nhau. Dấu hai dấu bằng ép kiểu theo một thu tự quy tắc cố định rồi mới so sánh, và trong quy tắc đó null chỉ bằng được với undefined chứ không bằng với bất kỳ giá trị nào khác. Vì vậy null bằng undefined là đúng, còn null ba dấu bằng undefined là sai. Khi so một chuỗi số với một số, chuỗi được ép về số nên so khớp, nhưng đây là cạm bẫy vì chuỗi rỗng và chuỗi có khoảng trắng cũng ép về số không. NaN là ngoại lệ duy nhất trong hệ số không bằng chính nó. Giá trị falsy chỉ gồm false, số không, chuỗi rỗng, null, undefined và NaN; mọi thứ khác kể cả mảng rỗng và object rỗng đều truthy. Một điểm nữa là typeof null trả về chuỗi object, đây là lỗi lịch sử của ngôn ngữ được giữ lại để tương thích.',
    deep: '<p><strong>Hai toán tử so sánh khác nhau về bản chất.</strong> Ba dấu bằng là so sánh nghiêm, không ép kiểu, nên khác kiểu là khác giá trị. Hai dấu bằng là so sánh lỏng, ép kiểu hai vế theo quy tắc Abstract Equality rồi mới so sánh.</p><ul><li><strong>Quy tắc quan trọng nhất:</strong> khi một vế là null và vế kia là undefined, hai dấu bằng cho kết quả đúng ngay. null không bằng bất kỳ giá trị khác nào, kể cả số không.</li><li><strong>Ép kiểu chuỗi và số:</strong> khi so chuỗi với số, chuỗi được chuyển thành số trước. Chuỗi rỗng, chuỗi chỉ có khoảng trắng và chuỗi không phải số đều cho số không, nên so sánh chuỗi với số không dễ cho ra kết quả bất ngờ.</li><li><strong>NaN:</strong> NaN khác với mọi thứ kể cả chính nó, nên không thể dùng so sánh bằng để kiểm tra NaN, phải dùng Number.isNaN.</li><li><strong>Truthy và falsy:</strong> falsy chỉ có false, số không, chuỗi rỗng, null, undefined và NaN. Mảng rỗng và object rỗng là truthy vì là object.</li><li><strong>typeof null:</strong> trả về chuỗi object do một lỗi lịch sử từ đầu ngôn ngữ được giữ lại, nên phải kiểm tra null bằng cách so sánh trực tiếp chứ không dùng typeof.</li><li><strong>Điều kiện thay đổi:</strong> với các object wrapper như new Number(0) và new Boolean(false), hai dấu bằng ép về primitive nên cũng ra kết quả falsy khi kiểm tra if, dù typeof là object. Nếu so sánh bằng dấu ba dấu bằng, wrapper và primitive luôn khác nhau dù giá trị trông giống hệt.</li></ul>',
    code: 'console.log(null == undefined);\nconsole.log(0 == "0");\nconsole.log(NaN === NaN);\nconsole.log(Boolean([]), typeof null);',
    expected: 'Bốn dòng lần lượt là true, true, false, rồi true object. Nguyên nhân: null chỉ bằng được undefined nên so sánh lỏng cho true, dấu ba dấu bằng so cả kiểu nên null khác undefined; chuỗi số được ép về số nên số không bằng chuỗi số; NaN không bằng chính nó nên kể cả dấu ba dấu bằng cũng cho false; mảng rỗng là object nên truthy; và typeof null trả về chuỗi object do lỗi lịch sử của ngôn ngữ được giữ lại để tương thích.',
    followups: [
      { q: 'Vì sao so sánh chuỗi với số là cạm bẫy, và nên so sánh thế nào cho an toàn?', a: 'Vì chuỗi luôn được ép về số trước khi so sánh, nên chuỗi rỗng, chuỗi chỉ có khoảng trắng và cả chuỗi không phải số đều trở thành số không. Biểu mẫu gửi mọi giá trị dạng chuỗi nên điều kiện lọc bằng số sẽ lọc sai âm thầm. Cách an toàn là ép một lần ở biên vào dữ liệu bằng Number hoặc Number.parseFloat kèm kiểm tra isNaN, rồi từ đó trở đi chỉ so sánh số với số.' },
      { q: 'null và undefined khác nhau như thế nào trong thực tế, và khi nào nên dùng null?', a: 'undefined mang nghĩa chưa được gán giá trị, ví dụ khai báo biến không khởi tạo, thuộc tính không tồn tại, hoặc hàm không nhận tham số. null là lựa chọn có chủ ý của lập trình viên để nói rõ chưa có giá trị. Vì vậy dùng null cho các trường nghiệp vụ chưa xác định như ngày hủy đơn hàng, còn để undefined cho thiếu sót kỹ thuật. Khi dùng với toán tử ba dấu bằng cả hai đều so sánh khác với mọi giá trị khác, nhưng với hai dấu bằng thì chúng bằng nhau.' },
      { q: 'Vì sao không dùng typeof để kiểm tra null, và cách kiểm tra null an toàn là gì?', a: 'typeof null trả về chuỗi object vì một lỗi lịch sử từ đầu ngôn ngữ, và lỗi này được giữ lại để không phá vỡ code cũ. Cách kiểm tra đúng là so sánh trực tiếp với null, hoặc dùng toán tử nullish coalescing với giá trị mặc định để thay thế cả hai trường hợp. Lưu ý toán tử nullish chỉ thay thế khi giá trị là null hoặc undefined, còn toán tử or logic còn thay cả các giá trị falsy khác như số không và chuỗi rỗng.' }
    ],
    pitfalls: [
      'Dùng hai dấu bằng để so sánh chuỗi rỗng với số không và cả hai bị ép về cùng một giá trị nên điều kiện lọc chạy sai.',
      'Tưởng typeof null trả về null và viết kiểm tra null bằng typeof, trong khi chuỗi trả về là object.',
      'Dùng hai dấu bằng với null vì tin rằng null bằng số không, trong khi null chỉ bằng được undefined.'
    ],
    selfcheck: [
      'Tôi vẫn chưa nhớ hết thứ tự quy tắc ép kiểu của so sánh lỏng nên vẫn phải thử trong console.',
      'Tôi giải thích được vì sao NaN không bằng chính nó và vì sao phải dùng Number.isNaN thay vì so sánh bằng.',
      'Tôi chọn được ép kiểu ở biên API để mọi so sánh phía trong ứng dụng diễn ra trên số thật.'
    ],
    refs: ['mdn-execution-model']
  },
  {
    id: 'B04',
    group: 'B',
    topic: 'Closure, ràng buộc this và arrow function so với function thường',
    prio: 'P0',
    level: 'L3',
    type: 'concept',
    q: 'Closure giữ gì lại sau khi hàm ngoài kết thúc, và vì sao arrow function khác function thường khi nói về ràng buộc this?',
    oral: 'Closure là khả năng một hàm vẫn truy cập được biến của phạm vi đã kết thúc, vì mỗi lần gọi hàm tạo ra một môi trường riêng và các hàm con giữ tham chiếu tới môi trường đó. Nhờ vậy mỗi lần gọi makeCounter sinh ra một bộ đếm riêng, và các callback được lưu trong mảng hay đưa cho setTimeout vẫn nhớ đúng giá trị đã bị ghi đè ở các lần sau. Về this, function thường nhận this theo quy tắc gọi: gọi như method của object thì this là object đó, gọi tách khỏi object thì this không còn là object đó, và trong strict mode thì thành undefined. Arrow function không có tham số this, nó chụp lại this tại nơi được tạo ra, nên luôn bám theo this của scope cha và không đổi khi được truyền đi. Vì vậy callback nên dùng arrow, còn method cần this động thì phải dùng function thường. Một ngoại lệ đáng nhớ là dùng arrow function cho method trong object literal sẽ this lấy từ scope ngoài và thường là undefined.',
    deep: '<p><strong>Closure là gì.</strong> Mỗi lần gọi một hàm, engine tạo một môi trường vùng nhớ mới cho các biến cục bộ. Nếu có hàm con tham chiếu tới biến đó, hàm con giữ tham chiếu tới môi trường và môi trường sống lâu hơn lời gọi hàm ngoài.</p><ul><li><strong>Vì sao cần:</strong> đây chính là nền tảng của counter, bộ nhớ đệm, hàm gắn sự kiện và mọi callback bất đồng bộ. Không có closure thì các callback bất đồng bộ không giữ được ngữ cảnh dữ liệu cần thiết.</li><li><strong>this của function thường:</strong> xác định theo cách gọi chứ không theo nơi khai báo. Gọi như method thì this là object, gọi tách biến thì this mất liên kết, và trong strict mode thành undefined nên truy cập thuộc tính sẽ ném lỗi.</li><li><strong>this của arrow function:</strong> arrow không có tham số this riêng mà chụp this từ scope tại thời điểm khởi tạo, nên không đổi khi được truyền làm callback hay tách khỏi object.</li><li><strong>Áp dụng đúng:</strong> callback của setTimeout, hàm đưa vào mảng, event listener dùng arrow. Method cần đọc this động như xử lý sự kiện, hoặc class method, dùng function thường.</li><li><strong>Khi nào không dùng arrow:</strong> khi cần this động, khi làm method của object literal, hoặc khi cần arguments và khả năng gọi với new. Arrow cũng không có prototype nên không dùng được làm constructor.</li><li><strong>Điều kiện thay đổi:</strong> thân class luôn ở strict mode nên this bị mất khi tách method sẽ thành undefined và lập tức ném lỗi, đây là hành vi ổn định để phát hiện bug sớm. Ở file script không dùng module, hàm thường gọi không có receiver sẽ nhận this là global object, che mất lỗi cho tới khi truy cập thuộc tính. Nếu chuyển cùng đoạn code sang module hoặc thêm lệnh strict, lỗi sẽ lộ ra sớm hơn, và cách khắc phục bằng bind cũng cần đặt lại thứ tự.</li></ul>',
    code: 'class SearchBox {\n  constructor() {\n    this.query = "";\n  }\n  start() {\n    setTimeout(function () {\n      this.run();\n    }, 0);\n  }\n  startArrow() {\n    setTimeout(() => {\n      this.run();\n    }, 0);\n  }\n  run() {\n    console.log("run", this.query);\n  }\n}\nconst box = new SearchBox();\nbox.start();\nbox.startArrow();',
    expected: null,
    followups: [
      { q: 'Vì sao tách một method class ra khỏi object rồi gọi lại sẽ hỏng, và cách sửa ra sao?', a: 'Method class được gọi với this là chính object khi dùng dấu chấm. Khi bạn lưu method vào một biến rồi gọi biến đó, lời gọi không còn receiver nên this trở thành undefined, và truy cập thuộc tính sẽ ném lỗi ngay. Ba cách sửa là gọi trực tiếp trên object, dùng bind khi truyền method đi nơi khác, hoặc chuyển method thành arrow function để this gắn theo scope. Trong ứng dụng, nguyên nhân phổ biến nhất là truyền method trực tiếp làm prop cho onClick hay cho mảng sự kiện.' },
      { q: 'Vòng lặp tạo closure theo cách nào và tại sao từng lần lặp với let lại tách binding?', a: 'Mỗi lần lặp với khai báo let hoặc const tạo một binding mới cho thân vòng lặp, và hàm được tạo trong lần lặp đó chụp lại đúng binding này. Nhờ vậy mỗi callback giữ một giá trị riêng. Với var thì tất cả vòng lặp dùng chung một biến ở phạm vi hàm, nên các callback cùng đọc một ô nhớ và đều thấy giá trị cuối cùng. Nếu cần tương đương bằng closure thủ công, hãy tạo một hàm factory nhận giá trị làm tham số rồi trả về hàm đọc giá trị đó.' },
      { q: 'Khi nào arrow function dùng this lại là lỗi chứ không phải lợi thế?', a: 'Arrow function chụp this theo scope, nên dùng nó làm method của object literal sẽ lấy this của module hoặc global, thường là undefined, và mọi truy cập thuộc tính trong đó sẽ hỏng. Tương tự, dùng arrow làm method class sẽ khiến this bị chụp ở thời điểm khởi tạo instance nên các instance khác nhau cùng chia sẻ một this. Arrow cũng không có arguments và không dùng được với new. Quy tắc nhớ: cần this động thì function thường, chỉ callback không cần this riêng thì arrow.' }
    ],
    pitfalls: [
      'Tách method class ra biến rồi gọi, trong khi thân class luôn strict nên this thành undefined và truy cập thuộc tính ném lỗi.',
      'Dùng arrow function làm method của object literal và hy vọng this trỏ tới object đó.',
      'Tưởng arrow function có this riêng và phải bind thủ công, trong khi nó chụp this từ scope cha.',
      'Nhầm closure với rò bộ nhớ, coi mọi closure đều là lỗi.'
    ],
    selfcheck: [
      'Tôi vẫn chưa giải thích được vì sao arrow function trong object literal lại không có this trỏ tới object.',
      'Tôi giải thích được closure bằng ví dụ hai lần gọi makeCounter tạo ra hai bộ đếm hoàn toàn độc lập.',
      'Tôi có thể sửa một sự kiện onClick bị hỏng do this mất liên kết mà không phải đụng tới logic giao diện.'
    ],
    refs: ['mdn-closure', 'mdn-this']
  },
  {
    id: 'B05',
 group: 'B',
    topic: 'Prototype chain và lớp ở tầng ứng dụng',
    prio: 'P0',
    level: 'L2',
    type: 'concept',
    q: 'Prototype chain dùng để làm gì trong JavaScript, và khi viết một lớp lỗi HTTP trong dự án thật thì việc kế thừa Error ảnh hưởng gì tới việc kiểm tra lỗi?',
    oral: 'Object trong JavaScript đều có liên kết nội bộ tới prototype, và prototype lại trỏ tới prototype khác, tạo thành chuỗi tra cứu thuộc tính. Đó là cơ chế chia sẻ hành vi mà không cần kế thừa class: object bình thường có prototype là Object.prototype nên vẫn có hasOwnProperty và toString. Cú pháp class tạo một hàm constructor, gán method lên prototype của hàm đó, và mọi instance tạo bằng new đều trỏ về cùng một object. Điểm quan trọng ở tầng ứng dụng là instanceof đi duyệt chuỗi prototype, nên lớp con của Error thỏa cả instanceof Error lẫn instanceof lớp con, và lớp bọc lỗi HTTP nên kế thừa Error để mọi nơi bắt lỗi theo Error vẫn bắt được. Chi tiết hay gây bất ngờ là thuộc tính message do engine tạo ở dạng non-enumerable nên không xuất hiện khi duyệt key, còn thuộc tính bạn tự gán thì hiện bình thường.',
    deep: '<p><strong>Prototype là liên kết nội bộ, không phải thuộc tính thường.</strong> Khi đọc một thuộc tính không có trên object, engine tra tiếp trên prototype và cứ tiếp cho tới null, tạo nên chuỗi prototype. Cơ chế này cho phép chia sẻ hành vi mà không cần cơ chế kế thừa riêng của ngôn ngữ.</p><ul><li><strong>Cú pháp class là gì:</strong> bên dưới, class tạo một hàm constructor, gán prototype method lên prototype của hàm đó, và new tạo instance có liên kết tới prototype chung. Mọi instance dùng chung một object prototype nên method không bị nhân bản cho từng instance.</li><li><strong>Tác động tới kiểm tra lỗi:</strong> instanceof duyệt chuỗi prototype nên lớp con của Error thỏa cả instanceof lớp con lẫn instanceof Error. Đây là lý do bọc lỗi nghiệp vụ trong class kế thừa Error thay vì trả object lỗi thuần.</li><li><strong>Thuộc tính riêng và prototype method:</strong> field khai báo trong thân class trở thành thuộc tính riêng của từng instance và gán trong constructor, còn method khai báo trong class nằm trên prototype. Đổi một prototype method sẽ ảnh hưởng mọi instance hiện có.</li><li><strong>Enumerator:</strong> message do engine tạo ở dạng non-enumerable nên không xuất hiện khi duyệt key của object, còn name do bạn gán tay thì là thuộc tính riêng enumerable bình thường. Đây là điểm hay hỏi khi debug log object lỗi.</li><li><strong>Khi nào không cần class:</strong> nếu chỉ gom nhóm vài hàm dùng chung thì một object thường, module, hoặc hàm factory đơn giản hơn và dễ test hơn class.</li><li><strong>Điều kiện thay đổi:</strong> prototype của một object là bất biến trong thực tế, nên sửa prototype của một thư viện sau khi đã tạo instance sẽ tạo ra object lai không nhất quán. Cần tái cấu hình hành vi thì hãy tạo prototype mới trước khi tạo instance nào.</li></ul>',
    code: 'class HttpError extends Error {\n  constructor(status, message) {\n    super(message);\n    this.name = "HttpError";\n    this.status = status;\n  }\n}\nconst e = new HttpError(404, "Not Found");\nconsole.log(e instanceof HttpError, e instanceof Error, e.message, e.name);\nconsole.log(Object.keys(e));',
    expected: null,
    followups: [
      { q: 'Vì sao instanceof đôi khi trả về false dù vẫn là cùng một kiểu dữ liệu?', a: 'instanceof duyệt chuỗi prototype của đối tượng, nên nó thất bại khi giá trị đến từ realm khác như cửa sổ iframe, khi dữ liệu được chuyển qua worker, hoặc khi chạy nhiều bản sao thư viện trong cùng bundle và mỗi bản có prototype riêng. Nó cũng trả về false nếu ai đó gán lại prototype của object. Trong code chạy qua nhiều bundle hoặc dữ liệu đi qua worker, hãy kiểm tra lỗi bằng thuộc tính tường minh như name hoặc status thay vì chỉ dựa vào instanceof.' },
      { q: 'Field trong class và prototype method khác nhau như thế nào về bộ nhớ?', a: 'Field khai báo trong thân class được gán trong constructor, tức mỗi instance có một bản riêng trong bộ nhớ, nên tốn bộ nhớ tuyến tính theo số instance. Prototype method nằm trên object prototype dùng chung, chỉ tồn tại một bản cho mọi instance. Vì vậy dữ liệu riêng của từng đối tượng đặt ở field còn hành vi đặt ở method. Nếu nhầm chỗ, ví dụ đặt dữ liệu lớn vào prototype, mọi instance sẽ cùng chia sẻ một giá trị và bug sẽ rất khó truy.' },
      { q: 'Khi nào đáng dùng class thay vì hàm factory hoặc object thường?', a: 'Class đáng dùng khi cần nhiều instance cùng hành vi, cần quan hệ kế thừa thật sự như một lớp lỗi kế thừa Error, và muốn instanceof hoạt động. Nếu chỉ cần một hàm tạo lịch sử hay một object cấu hình thì hàm factory ngắn hơn, dễ test và không kéo theo khái niệm prototype. Với codebase dùng TypeScript, type và interface thường đã đủ để mô tả dữ liệu mà chưa cần class thật.' }
    ],
    pitfalls: [
      'Tưởng thuộc tính message cũng xuất hiện khi duyệt key của object lỗi, trong khi engine tạo nó ở dạng non-enumerable.',
      'Dựa vào instanceof để nhận diện lỗi trong khi dữ liệu đi qua iframe hoặc worker nên instanceof trả về false.',
      'Đặt dữ liệu riêng của từng instance lên prototype rồi mọi instance bất ngờ chia sẻ chung một giá trị.',
      'Quên gọi super trong constructor của lớp con, khiến khởi tạo hỏng.'
    ],
    selfcheck: [
      'Tôi vẫn chưa giải thích được vì sao thuộc tính message do engine tạo không xuất hiện khi duyệt key của object lỗi.',
      'Tôi giải thích được prototype chain bằng ví dụ một object thường vẫn gọi được phương thức toString kế thừa từ Object.prototype.',
      'Tôi có thể viết lớp lỗi HTTP kế thừa Error để cả instanceof Error lẫn instanceof lớp con đều cho kết quả đúng.'
    ],
    refs: ['mdn-execution-model']
  },
  {
    id: 'B06',
    group: 'B',
    topic: 'Call stack, event loop, task và microtask với Promise và async await',
    prio: 'P0',
    level: 'L3',
    type: 'predict',
    q: 'Đoạn code in log dưới đây theo đúng thứ tự nào, và vì sao phần nào chạy đồng bộ còn phần nào bị đẩy sang hàng đợi?',
    oral: 'JavaScript chạy mã đồng bộ trên một call stack duy nhất, và mỗi hàm đồng bộ giữ trọn call stack cho tới khi return. Sau đó event loop lấy việc từ hàng đợi task như setTimeout, sự kiện giao diện hay xử lý IO, nhưng trước khi lấy task mới nó luôn dọn hết hàng đợi microtask đã sẵn sàng. Promise callback và phần code sau await đều được xếp vào microtask, còn setTimeout nằm ở task nên luôn chạy sau. Điểm hay nhầm nhất là await: dù không có Promise nào, await vẫn tạm dừng hàm và phần còn lại được lên lịch như một microtask. Vì vậy trong đoạn ví dụ, A, D, F chạy đồng bộ theo thứ tự xuất hiện trong mã, C chạy trước E vì được xếp vào microtask sớm hơn, và B chạy cuối cùng vì nằm trong task. Nếu thay setTimeout bằng một microtask ví dụ queueMicrotask thì thứ tự hoàn toàn khác, vì cả hai lúc đó đều là microtask và sẽ xen theo thứ tự được lên lịch.',
    deep: '<p><strong>Ba tầng thực thi.</strong> Call stack chạy các hàm đồng bộ và bị chặn cho tới khi stack rỗng. Hàng đợi microtask chứa callback của Promise, queueMicrotask và phần code sau await. Hàng đợi task chứa setTimeout, setInterval và sự kiện giao diện.</p><ul><li><strong>Thứ tự cơ bản:</strong> chạy hết code đồng bộ, sau đó dọn toàn bộ microtask đang chờ, chỉ khi microtask rỗng mới lấy một task mới, và mỗi task lại tạo thêm cơ hội dọn microtask.</li><li><strong>await không cần Promise:</strong> await một giá trị thường vẫn tạm dừng hàm và phần còn lại chạy ở một microtask kế tiếp. Vì vậy code sau await không chạy ngay cả khi giá trị được chờ đã có sẵn.</li><li><strong>Promise executor chạy đồng bộ:</strong> phần tạo Promise mới bằng new Promise chạy ngay lập tức, chỉ phần resolve hoặc reject mới giá trị mới đẩy việc sang microtask.</li><li><strong>Vì sao cần biết:</strong> đây là nguồn gốc của các bug trông như bất đồng bộ nhưng thực ra chạy đồng bộ, làm giao diện đứng hình khi vòng lặp nặng chạy trước lúc giao diện kịp vẽ lại.</li><li><strong>Microtask khác task về mức độ ưu tiên:</strong> một chuỗi microtask tự sinh, ví dụ promise lồng nhau hoặc vòng lặp await trên giá trị sẵn có, có thể chiếm CPU và chặn task, kể cả vẽ giao diện.</li><li><strong>Điều kiện thay đổi:</strong> nếu hàm đồng bộ mất 500 mili giây thì toàn bộ microtask cũng bị hoãn và giao diện không vẽ lại cho tới khi hàm xong. Nếu thay setTimeout bằng queueMicrotask thì thứ tự sẽ đảo vì cả hai thành microtask và được lên lịch theo thứ tự xuất hiện. Trong Node.js, microtask của Promise và của process.nextTick có thứ tự ưu tiên riêng, nên đừng dựa vào thứ tự giữa hai loại đó.</li></ul>',
    code: 'console.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\n(async () => {\n  console.log("D");\n  await null;\n  console.log("E");\n})();\nconsole.log("F");',
    expected: 'Thứ tự in ra là A, D, F, C, E, B. Nguyên nhân: A, D, F chạy đồng bộ ngay khi được gọi, vì hàm async chạy tới lệnh await mới tạm dừng và phần còn lại được lên lịch như một microtask. Sau khi call stack rỗng, microtask queue được dọn theo thứ tự lên lịch nên C chạy trước E. Cuối cùng mới đến task của setTimeout nên B chạy sau cùng, dù thời gian chờ là không.',
    followups: [
      { q: 'Vì sao code sau await chạy chậm hơn Promise.resolve().then dù không có Promise nào?', a: 'Vì await trên bất kỳ giá trị nào cũng phải đi qua một bước bất đồng bộ chuẩn, nên phần còn lại của hàm async luôn được lên lịch ở một microtask kế tiếp chứ không chạy tức thì. Trong khi đó callback truyền cho then được gọi khi promise đã hoàn tất, cũng nằm trong microtask nhưng được đẩy vào hàng đợi sớm hơn vì nó xuất hiện trước trong mã và được ghi nhận ngay khi gọi Promise.resolve. Thứ tự cuối cùng quyết định bởi thứ tự lên lịch trong hàng đợi microtask chứ không phải thứ tự viết dòng thẳng.' },
      { q: 'Khi nào microtask gây treo giao diện, và cách nhận biết ra sao?', a: 'Khi một chuỗi microtask không bao giờ kết thúc, ví dụ vòng lặp await trên một giá trị sẵn có, event loop sẽ không bao giờ quay lại lấy task nên giao diện không vẽ lại và không nhận được input. Cách nhận biết là mở tab Performance trong devtools và nhìn mục Task nào chiếm 100 phần trăm thời gian với các lát nhỏ lặp lại. Cách tránh là cắt nhỏ vòng lặp, đưa phần tính nặng ra khỏi microtask, hoặc hợp nhất các promise thành một chuỗi tuần tự thay vì hàng trăm microtask nhỏ.' },
      { q: 'Tại sao setTimeout với độ trễ không thay đổi được thứ tự chạy của nó với microtask?', a: 'Vì setTimeout luôn đẩy callback vào hàng đợi task, còn microtask luôn được dọn trước khi lấy task kế tiếp. Giảm độ trễ xuống không chỉ làm callback được gọi sớm hơn theo thời gian, mà còn phải chờ microtask rỗng. Vì vậy callback của setTimeout không bao giờ chạy trước dù hàng nghìn microtask đang chờ đã được lên lịch trước đó.' }
    ],
    pitfalls: [
      'Tưởng setTimeout với độ trễ không sẽ chạy trước microtask vì được gọi trước trong mã.',
      'Tưởng await một giá trị không phải Promise thì phần sau chạy ngay, trong khi nó vẫn phải qua một microtask.',
      'Tưởng phần thân của hàm async chạy song song khi gọi, trong khi nó chạy đồng bộ tới lệnh await đầu tiên.',
      'Dùng queueMicrotask cho tác vụ nặng và vô tình chặn không cho event loop chạy nhiệm vụ khác.'
    ],
    selfcheck: [
      'Tôi vẫn chưa nhớ rõ sự khác biệt giữa task và microtask mà không cần mở tài liệu.',
      'Tôi giải thích được vì sao C chạy trước E và B chạy cuối cùng trong ví dụ của câu hỏi này.',
      'Tôi có thể khoanh vùng một vòng lặp await nặng đang treo giao diện bằng tab Performance.'
    ],
    refs: ['mdn-execution-model', 'mdn-promise']
  },
  {
    id: 'B07',
    group: 'B',
    topic: 'Promise.all, allSettled, race, any và giới hạn số request chạy song song',
    prio: 'P1',
    level: 'L2',
    type: 'code',
    q: 'Khi gọi nhiều API song song, bạn chọn Promise.all, allSettled, race hay any thế nào, và làm sao giới hạn số request chạy đồng thời mà vẫn lấy đủ kết quả?',
    oral: 'Bốn cách ghép promise này khác nhau ở câu hỏi cần trả lời. Promise.all chạy tất cả rồi chỉ resolve khi mọi cái thành công, và chỉ cần một cái reject là cả chuỗi reject ngay, nên dùng khi cần đủ dữ liệu mới làm được việc tiếp theo. Promise.allSettled luôn chờ hết và không bao giờ reject, trả về mảng kết quả có nhãn trạng thái từng phần tử, nên dùng khi vẫn muốn hiện dữ liệu của phần đã thành công. Promise.race trả về phần tử thắng đầu tiên dù thắng hay thua, phù hợp bài timeout. Promise.any ngược lại với all, chỉ thất bại khi tất cả cùng thất bại và trả về một lỗi tổng hợp. Điểm hay bị bỏ qua: Promise.all reject sớm không hủy các promise còn lại, chúng vẫn chạy tới cuối, và nếu không bắt lỗi riêng sẽ có cảnh báo unhandled rejection. Với hàng trăm request, cần giới hạn số chạy song song: chia thành lô cố định, hoặc chạy pool worker với số worker bằng số request trên giây cho phép.',
    deep: '<p><strong>Bốn hàm ghép promise trả lời bốn câu hỏi khác nhau.</strong> Mỗi hàm nhận một iterable và trả về một promise duy nhất, nhưng điều kiện hoàn tất và giá trị trả về khác nhau.</p><ul><li><strong>Promise.all:</strong> chờ tất cả, reject ngay khi một phần tử reject, kết quả là mảng theo đúng thứ tự đầu vào. Dùng khi tất cả đều bắt buộc, ví dụ cần cả thông tin người dùng lẫn danh sách quyền trước khi dựng trang.</li><li><strong>Promise.allSettled:</strong> luôn chờ hết, không reject, mỗi kết quả có nhãn fulfilled hoặc rejected kèm lý do. Dùng khi muốn hiển thị phần đã tải xong thay vì mất trắng cả trang.</li><li><strong>Promise.race:</strong> giải quyết hoặc từ chối theo phần tử hoàn tất đầu tiên, kể cả khi phần tử đó thất bại. Dùng cho timeout vì cần một promise bù luôn thắng trời.</li><li><strong>Promise.any:</strong> lấy phần tử thành công đầu tiên, chỉ reject khi tất cả thất bại, và lỗi là AggregateError chứa danh sách nguyên nhân. Dùng cho nguồn dự phòng, ví dụ đọc cache rồi mới gọi mạng.</li><li><strong>Lỗi dễ bỏ qua:</strong> all và race reject sớm nhưng không hủy promise còn chạy, nên request vẫn tốn băng thông và nếu không gắn bắt lỗi riêng sẽ có cảnh báo unhandled rejection.</li><li><strong>Giới hạn đồng thời:</strong> trình duyệt và server đều giới hạn số kết nối mỗi origin, nên phần dư xếp hàng ở tầng mạng. Cách phổ biến là chia thành lô cố định.</li><li><strong>Điều kiện thay đổi:</strong> nếu một nguồn lỗi thì any vẫn thành công nhờ nguồn còn lại, còn all sẽ hỏng cả lô. Nếu bạn thay yêu cầu thành kết nối cục bộ có độ trễ gần không, race sẽ luôn thắng bởi promise thứ nhất tạo ra, nên lựa chọn theo ngữ nghĩa mà không theo tốc độ máy thì mới an toàn.</li></ul>',
    code: 'const slow = new Promise((r) => setTimeout(() => r("slow"), 50));\nconst failing = new Promise((_, reject) =>\n  setTimeout(() => reject(new Error("boom")), 10)\n);\n\nPromise.all([slow, failing]).catch((e) => console.log("all:", e.message));\nPromise.allSettled([slow, failing]).then((res) =>\n  console.log("settled:", res.map((r) => r.status).join(","))\n);\nPromise.race([slow, failing]).catch((e) => console.log("race:", e.message));\nPromise.any([slow, failing]).then((v) => console.log("any:", v));',
    expected: null,
    followups: [
      { q: 'Vì sao Promise.all reject sớm nhưng các request còn lại vẫn chạy, và cách dừng chúng là gì?', a: 'Promise.all chỉ ghi nhận lỗi đầu tiên rồi reject, nó không có cơ chế truyền tín hiệu huỷ xuống các promise con vì mỗi promise là độc lập. Vì vậy các request còn lại vẫn chiếm băng thông và nếu chúng reject mà không có bắt lỗi thì Node hoặc trình duyệt sẽ báo unhandled rejection. Cách dừng thật sự là tạo một AbortController dùng chung, truyền signal vào lời gọi HTTP của mọi request, rồi gọi abort khi một request thất bại.' },
      { q: 'Khi nào allSettled lại là lựa chọn sai dù nó không bao giờ reject?', a: 'allSettled phù hợp khi bạn coi mỗi kết quả là độc lập và vẫn muốn hiện phần đã tải được, ví dụ tải danh sách avatar cùng lúc với tên hiển thị. Nó sai khi dữ liệu có quan hệ phụ thuộc: nếu không có token xác thực thì mọi request đều hỏng và allSettled sẽ trả về một mảng toàn lỗi rồi bạn vẫn phải xử lý. Khi đó nên kiểm tra điều kiện tiên quyết trước rồi mới phát tán request, hoặc dùng all để lỗi hiện ra sớm.' }
    ],
    pitfalls: [
      'Dùng Promise.all và coi nó như công cụ hủy các request còn lại, trong khi nó chỉ reject sớm chứ không huỷ gì.',
      'Dùng Promise.race cho timeout mà quên bọc request vào một promise bù luôn resolve, nên nếu request thắng trước thì race vẫn treo.',
      'Dùng Promise.any rồi không bắt AggregateError, biến tình huống tất cả nguồn dữ liệu hỏng thành lỗi không ai xử lý.',
      'Phát tán hàng trăm request cùng lúc và tưởng trình duyệt chạy hết song song.'
    ],
    selfcheck: [
      'Tôi vẫn chưa phân biệt được khi nào dùng race và khi nào dùng any mà không cần tra lại tài liệu.',
      'Tôi giải thích được lý do Promise.all reject sớm bằng ví dụ hai request cùng chạy trong đó request lỗi vẫn tiêu tốn băng thông.',
      'Tôi có thể viết một pool chạy đồng thời tối đa k worker cho danh sách vài trăm id mà vẫn thu thập đủ kết quả.'
    ],
    refs: ['mdn-promise', 'mdn-abortcontroller']
  },
  {
    id: 'B08',
    group: 'B',
    topic: 'Debounce, throttle, race giữa các request và AbortController',
    prio: 'P1',
    level: 'L3',
    type: 'situation',
    q: 'Người dùng gõ nhanh vào ô tìm kiếm và mỗi lần gõ bạn đều gọi API, bạn làm sao để vừa bớt request vừa không để kết quả cũ ghi đè kết quả mới?',
    oral: 'Có ba việc phải làm đồng thời. Thứ nhất là debounce: chờ người dùng ngừng gõ một khoảng thời gian rồi mới gọi API, nên gõ liên tục mười ký tự chỉ tốn một request thay vì mười. Thứ hai là thứ tự trả về không đảm bảo: request sau có thể hoàn tất trước request trước, và nếu bạn gán thẳng kết quả vào state thì kết quả cũ sẽ đè lên kết quả mới. Cách phổ biến là gắn một số thứ tự cho mỗi lần chạy và chỉ nhận kết quả của lần chạy mới nhất. Thứ ba là hủy thật: promise không tự huỷ được nên phải dùng AbortController, truyền signal vào lời gọi HTTP rồi gọi abort ở lần gõ kế tiếp. Nhớ bắt riêng lỗi AbortError vì đó là hủy có chủ ý chứ không phải lỗi mạng, không bắt riêng thì giao diện sẽ hiện thông báo lỗi giả mỗi lần gõ. Nếu thay bằng throttle thì request vẫn chạy đều theo nhịp để giữ dữ liệu tươi, phù hợp hơn với cuộn trang vô hạn.',
    deep: '<p><strong>Ba lớp vấn đề khác nhau.</strong> Debounce giảm số lần gọi, đánh số thứ tự để loại kết quả cũ, và AbortController để ngừng tản băng thông thật sự.</p><ul><li><strong>Debounce là gì:</strong> mỗi sự kiện sẽ xoá timer cũ và đặt lại timer mới, chỉ khi không có sự kiện mới trong khoảng chờ thì callback mới chạy. Hợp với ô tìm kiếm vì người dùng gõ liên tục rồi mới dừng.</li><li><strong>Throttle khác gì:</strong> throttle cho callback chạy tối đa một lần mỗi khoảng thời gian, kể cả khi sự kiện vẫn đang xảy ra. Hợp với cuộn trang vô hạn và kéo thanh trượt, nơi mất bỏ sự kiện thì dữ liệu sai.</li><li><strong>Race condition:</strong> request cũ có thể hoàn tất sau request mới, và code chờ bằng await rồi gán state sẽ nhận giá trị cũ. Cách phổ biến là tăng một bộ đếm và chỉ nhận kết quả khi bộ đếm khớp lần chạy mới nhất.</li><li><strong>AbortController:</strong> tạo controller, truyền signal vào lời gọi HTTP, rồi gọi abort để hủy. Đây là cách duy nhất để hủy việc tải thật, vì không thể hủy một promise đang chờ.</li><li><strong>Lỗi cần bắt riêng:</strong> khi bị hủy, lời gọi HTTP bị từ chối với lỗi tên AbortError. Đây là tình huống bình thường nên phải lọc ra, nếu không sẽ báo lỗi mạng giả mỗi lần gõ ký tự mới.</li><li><strong>Khi nào không cần:</strong> nếu dữ liệu đã được cache, hay nếu chỉ gọi khi người dùng bấm nút chứ không gõ, thì debounce chỉ làm code khó đọc hơn.</li><li><strong>Điều kiện thay đổi:</strong> nếu mạng chậm, thời gian chờ của debounce nên tăng lên vì nhiều người dùng bỏ gõ giữa chừng. Nếu server cũng giới hạn tần suất thì chỉ hủy phía client không đủ, phải có cache phía server. Nếu gọi cross-origin kèm cookie, mỗi lần gọi lại kèm header Authorization sẽ kích hoạt preflight, nên gom request.</li></ul>',
    code: 'let timer = null;\nlet controller = null;\nlet latest = 0;\n\nasync function search(keyword) {\n  if (timer) clearTimeout(timer);\n  if (controller) controller.abort();\n  controller = new AbortController();\n  const runId = ++latest;\n  timer = setTimeout(async () => {\n    try {\n      const res = await api.get("/api/search", {\n        signal: controller.signal,\n        params: { q: keyword },\n        headers: { Accept: "application/json" }\n      });\n      if (runId === latest) render(res.data);\n    } catch (err) {\n      if (err.name !== "AbortError") showError(err);\n    }\n  }, 300);\n}',
    expected: null,
    followups: [
      { q: 'Vì sao lọc AbortError lại quan trọng, và nếu quên thì người dùng thấy gì?', a: 'Khi request bị hủy, lời gọi HTTP bị từ chối với lỗi tên AbortError chứ không phải lỗi mạng. Nếu code xử lý mọi lỗi giống nhau thì mỗi lần người dùng gõ ký tự mới sẽ bật lên thông báo lỗi, dù hệ thống hoàn toàn ổn. Người dùng sẽ tưởng sản phẩm bị lỗi liên tục. Cách xử lý đúng là bắt lỗi ở đây rồi bỏ qua khi tên lỗi là AbortError, còn lỗi thật mới đưa vào hệ thống báo cáo lỗi.' },
      { q: 'Debounce và throttle khác nhau thế nào khi người dùng cuộn trang vô hạn?', a: 'Debounce chỉ chạy sau khi người dùng ngừng hành động, nên khi cuộn liên tục nó sẽ không bao giờ chạy và trang sẽ không tải thêm dữ liệu. Throttle chạy tối đa một lần mỗi khoảng thời gian kể cả khi hành động chưa dừng, nên phù hợp với cuộn vô hạn, kéo thanh trượt và theo dõi vị trí chuột. Nguyên tắc chọn là: hành động liên tục mà mất dữ liệu thì throttle, hành động liên tục mà chỉ lấy trạng thái cuối cùng thì debounce.' }
    ],
    pitfalls: [
      'Chỉ so sánh response cũ với response mới mà không hủy request cũ, nên băng thông vẫn bị dùng cho các request không còn ai cần.',
      'Bắt mọi lỗi giống nhau nên lần gõ mới làm hiện thông báo lỗi dù nguyên nhân chỉ là yêu cầu bị hủy có chủ ý.',
      'Dùng debounce cho cuộn trang vô hạn, kết quả là khi cuộn liên tục không bao giờ có request nào chạy.',
      'Gọi lại API liên tục khi server cần header Authorization, làm phát sinh preflight không cần thiết.'
    ],
    selfcheck: [
      'Tôi vẫn chưa phân biệt được khi nào chọn debounce và khi nào chọn throttle mà không cần suy nghĩ lại.',
      'Tôi giải thích được lỗi kết quả cũ ghi đè kết quả mới bằng ví dụ hai request cùng tới server với độ trễ khác nhau.',
      'Tôi có thể thêm debounce cùng AbortController vào ô tìm kiếm mà không làm hiện thông báo lỗi giả.'
    ],
    refs: ['mdn-abortcontroller', 'mdn-cors']
  },
  {
    id: 'B09',
    group: 'B',
    topic: 'type và interface, union, narrowing và generics cơ bản',
    prio: 'P1',
    level: 'L2',
    type: 'code',
    q: 'Khi nào nên dùng type và khi nào dùng interface trong TypeScript, và viết một hàm generic nhận nhiều kiểu payload cùng lúc thế nào?',
    oral: 'Hai từ khoá này gần như tương đương ở phần lớn trường hợp, nhưng khác ở khả năng mở rộng. Interface mở được, nghĩa là sau khi khai báo bạn có thể khai báo thêm thuộc tính bằng cách khai báo lại interface và trộn chúng với nhau. Type thì không mở được, nhưng làm được union, intersection và các kiểu có điều kiện. Quy tắc thực tế của tôi là dùng interface cho hình dạng object và type cho mọi thứ còn lại. Union mô tả một giá trị chỉ có thể là một trong vài lựa chọn, và khi các lựa chọn có một trường phân biệt thì TypeScript tự thu hẹp kiểu qua trường đó trong switch, đó gọi là discriminated union và là cách diễn đạt trạng thái lỗi an toàn hơn việc trả về null. Generics cho phép hàm giữ quan hệ giữa kiểu tham số và kiểu trả về, nên hàm bọc response trả về đúng kiểu dữ liệu bên trong thay vì any. Hãy để suy luận tự động thay vì ghi type thủ công.',
    deep: '<p><strong>Hai hình thức khai báo kiểu.</strong> Type làm một phép tính cấu trúc, còn interface là một hợp đồng có thể mở rộng và hỗ trợ kế thừa bằng extends.</p><ul><li><strong>Khác biệt chính:</strong> interface có thể khai báo lại để bổ sung thuộc tính và dùng chung declaration merging, còn type không làm được và sẽ báo lỗi khai báo trùng. Đổi lại, union và intersection là thứ chỉ type làm được.</li><li><strong>Quy tắc chọn:</strong> interface cho hình dạng object có thể mở rộng, đặc biệt khi bạn định viết thư viện cho team khác dùng. Type cho union, intersection, kiểu có điều kiện, và cho mọi thứ không phải hình dạng object đơn giản.</li><li><strong>Union và narrowing:</strong> một biến kiểu union nghĩa là chỉ được gán một trong các lựa chọn. Khi các lựa chọn có một trường phân biệt, kiểm tra trường đó trong if hoặc switch sẽ tự thu hẹp kiểu ở nhánh còn lại mà không cần ép kiểu thủ công.</li><li><strong>Generics làm gì:</strong> tham số kiểu giữ quan hệ giữa đầu vào và đầu ra. Một hàm bọc response trả về đúng kiểu dữ liệu bên trong thay vì any, và người gọi tự suy luận được mà không phải ghi type thủ công.</li><li><strong>Khi nào không dùng generic:</strong> nếu hàm chỉ nhận đúng một kiểu và trả về một kiểu cố định thì khai báo union rõ ràng thường dễ đọc hơn, và code sinh ra ngắn hơn.</li><li><strong>Điều kiện thay đổi:</strong> nếu union không có trường phân biệt thì việc thu hẹp kiểu yếu đi và phải kiểm tra thuộc tính thủ công. Nếu dùng interface cho dữ liệu động, thêm thuộc tính sau khi khai báo sẽ bị chặn ngay lúc build.</li></ul>',
    code: 'type Status = "idle" | "loading" | "done" | "error";\n\ninterface ApiResponse<T> {\n  data: T;\n  status: number;\n}\n\ntype Result<T> =\n  | { kind: "ok"; value: T }\n  | { kind: "err"; message: string };\n\nasync function unwrap<T>(res: ApiResponse<T>): Promise<Result<T>> {\n  if (res.status < 200 || res.status >= 300) {\n    return { kind: "err", message: "HTTP " + res.status };\n  }\n  return { kind: "ok", value: res.data };\n}',
    expected: null,
    followups: [
      { q: 'Khi nào dùng discriminated union lại tốt hơn việc trả về null hoặc ném lỗi?', a: 'Khi trạng thái lỗi là một phần bình thường của nghiệp vụ, ví dụ bản ghi có thể chưa duyệt, thì discriminated union mô tả đúng các khả năng và bắt buộc người gọi xử lý hết. Nếu hàm âm thầm trả null, người gọi có thể quên kiểm tra và lỗi hiện ra rất xa từ nguyên nhân. Ném lỗi thì phù hợp khi lỗi thật sự là ngoại lệ, chẳng hạn mất kết nối, vì khi đó stack trace giúp truy nguyên dễ hơn.' },
      { q: 'Generic khác gì với union rộng, và khi nào chọn cái nào?', a: 'Generic giữ quan hệ giữa kiểu đầu vào và kiểu đầu ra, nên hàm bọc response trả về đúng kiểu dữ liệu bên trong và người gọi không phải ghi type thủ công. Union rộng chỉ nói giá trị có thể thuộc một trong vài kiểu nhưng không giữ quan hệ đó, nên kết quả là thường phải ép kiểu ở nơi dùng. Chọn generic khi bạn viết hàm tái sử dụng nhiều kiểu payload, chọn union khi các biến thể thực sự khác nhau về hình dạng dữ liệu.' }
    ],
    pitfalls: [
      'Khai báo lại interface để mở rộng rồi tưởng rằng type cũng làm được như vậy, trong khi type báo lỗi khai báo trùng.',
      'Dùng union cho dữ liệu không có trường phân biệt nên không tự thu hẹp được và phải ép kiểu ở khắp nơi.',
      'Khai báo kiểu trả về là any cho hàm có generic, làm mất toàn bộ ý nghĩa của việc dùng generic.'
    ],
    selfcheck: [
      'Tôi vẫn chưa nhớ chắc tình huống nào bắt buộc phải dùng type thay vì interface.',
      'Tôi giải thích được discriminated union bằng ví dụ kiểu kết quả có hai nhánh ok và err được thu hẹp qua trường kind.',
      'Tôi có thể đổi một hàm bọc response trả any sang generic và bỏ được các ép kiểu thủ công trong code gọi.'
    ],
    refs: ['ts-handbook', 'ts-narrowing']
  },
  {
    id: 'B10',
    group: 'B',
    topic: 'unknown, any, never, optional và nullability, ép kiểu không kiểm tra lúc chạy',
    prio: 'P1',
    level: 'L2',
    type: 'concept',
    q: 'Khác biệt giữa any và unknown trong TypeScript là gì, và vì sao ép kiểu không thay thế được cho việc kiểm tra dữ liệu lúc chạy?',
    oral: 'any tắt hết kiểm tra kiểu, mọi thao tác trên nó đều hợp lệ và nó lan truyền theo kiểu any ra toàn bộ biểu thức chứa nó. unknown thì ngược lại, là kiểu an toàn mặc định: bạn không được dùng nó như thể nó có thuộc tính nào, và không gán nó sang kiểu khác được, chỉ có thể kiểm tra trước rồi mới thu hẹp. Vì vậy dữ liệu từ bên ngoài như response của lời gọi HTTP hay JSON.parse nên là unknown rồi kiểm tra trước. never là kiểu không có giá trị nào thỏa mãn, dùng cho hàm không bao giờ trả về và cho trường hợp default trong switch để bắt nhánh chưa xử lý khi bạn thêm giá trị mới vào union. Về nullability, khai báo optional và khai báo kiểu có thêm undefined là hai việc khác nhau. Quan trọng nhất: ép kiểu chỉ thay đổi điều công cụ build tin, nó không kiểm tra gì lúc chạy, nên dữ liệu từ mạng vẫn có thể sai và gây lỗi ở xa hơn chỗ gốc.',
    deep: '<p><strong>Ba kiểu đặc biệt nói về mức độ chắc chắn.</strong> any là miễn kiểm tra hoàn toàn, unknown là chưa biết nên phải hỏi trước, và never là không có giá trị nào hợp lệ.</p><ul><li><strong>any và lan truyền:</strong> bất kỳ biểu thức nào chứa any cũng trở thành any, nên chỉ một chỗ dùng any đã làm mất kiểm tra kiểu cho cả chuỗi gọi phía sau.</li><li><strong>unknown là mặc định an toàn:</strong> không đọc được thuộc tính, không gán sang kiểu khác, chỉ thu hẹp được sau khi kiểm tra bằng typeof, instanceof, hoặc một hàm kiểm tra có kiểu thu hẹp tự khai báo.</li><li><strong>never và exhaustiveness:</strong> đặt biến kiểu never trong nhánh default của switch khiến công cụ build báo lỗi nếu sau này bạn thêm giá trị vào union mà quên xử lý. Đây là cách rẻ nhất để bắt nhánh sót.</li><li><strong>Optional và nullability là hai khái niệm:</strong> optional cho phép bỏ qua thuộc tính, còn khai báo kiểu có thêm undefined thì phải nói ra. Cấu hình nghiêm ngặt cho phép bắt buộc phân biệt trường thiếu với trường mang undefined.</li><li><strong>Ép kiểu không kiểm tra lúc chạy:</strong> cú pháp ép kiểu chỉ dạy công cụ build tin vào bạn, code sinh ra giống hệt nhau. Dữ liệu sai chỉ nổ lỗi khi đọc thuộc tính không tồn tại, và stack trỏ tới chỗ dùng chứ không phải chỗ nhận dữ liệu.</li><li><strong>Khi nào dùng gì:</strong> dùng unknown cho dữ liệu từ bên ngoài rồi kiểm tra, dùng any chỉ khi chấp nhận mất an toàn và có lý do, dùng never cho hàm ném lỗi và kiểm tra đủ các nhánh.</li><li><strong>Điều kiện thay đổi:</strong> nếu bật kiểm tra kiểu nghiêm ngặt trong lúc build, mọi ép kiểu thừa sẽ bị bắt và bạn buộc phải viết hàm kiểm tra. Nếu chuyển sang JavaScript thuần thì cả ba kiểu biến mất, nên hàm kiểm tra ở biên vẫn có giá trị.</li></ul>',
    code: 'type Config = { retries: number; token: string };\n\nconst raw: unknown = await response.json();\nconst config = raw as Config;\n\nfunction render(state: "idle" | "done"): void {\n  switch (state) {\n    case "idle":\n      console.log("idle");\n      break;\n    default: {\n      const exhaustive: never = state;\n      console.log(exhaustive);\n    }\n  }\n}',
    expected: null,
    followups: [
      { q: 'Làm sao kiểm tra một giá trị unknown ở biên mà không phải viết tay từng trường?', a: 'Hai lựa chọn phổ biến là dùng type guard do bạn tự viết, hoặc dùng một thư viện kiểm tra schema theo khai báo. Type guard tự viết cho kiểu dữ liệu nhỏ và ổn định, còn schema library đáng dùng khi dữ liệu lớn, có nhiều kiểu hoặc cần sinh tài liệu. Điểm chung là phải kiểm tra ở biên nơi dữ liệu vào ứng dụng và coi phần còn lại của codebase là đã tin cậy. Chỉ ép kiểu thì không có tác dụng gì ở lúc chạy.' },
      { q: 'Vì sao không nên dùng any cho dữ liệu từ lời gọi HTTP, kể cả khi kiểu đó đúng ở thời điểm viết?', a: 'Vì server có thể đổi kiểu trả về bất cứ lúc nào mà không báo bạn, và nếu kiểu đó bị any thì công cụ build im lặng, và lỗi chỉ xuất hiện khi chạy với dữ liệu thật. unknown buộc bạn phải kiểm tra trước khi dùng nên chi phí trả trước rất nhỏ so với thời gian debug một lỗi dữ liệu ở môi trường khác. Ngoài ra any còn lan truyền và làm mất kiểm tra kiểu cho cả biểu thức chứa nó.' }
    ],
    pitfalls: [
      'Ép kiểu dữ liệu từ JSON.parse và coi đó là kiểm tra lúc chạy, trong khi code sinh ra hoàn toàn không có kiểm tra gì.',
      'Khai dữ liệu từ lời gọi HTTP là any rồi truy cập thuộc tính, khiến mọi lỗi kiểu chỉ lộ ra ở môi trường thật thay vì lúc build.',
      'Thêm một giá trị vào union rồi quên xử lý nhánh mới, và không dùng never trong default để bắt lỗi ngay lúc build.'
    ],
    selfcheck: [
      'Tôi vẫn chưa nhuần nhuyễn viết hàm kiểm tra cho một kiểu unknown từ response của API.',
      'Tôi giải thích được vì sao ép kiểu không bắt được dữ liệu sai, bằng ví dụ ép một chuỗi thành object rồi đọc thuộc tính.',
      'Tôi có thể thay any trong một lớp gọi API bằng unknown cộng kiểm tra biên mà không phải đụng tới logic nghiệp vụ.'
    ],
    refs: ['ts-handbook', 'ts-narrowing']
  },
  {
    id: 'B11',
    group: 'B',
    topic: 'Module, import và export, phụ thuộc giữa các file',
    prio: 'P1',
    level: 'L1',
    type: 'concept',
    q: 'Cấu trúc module ES giải quyết vấn đề gì so với nhét mọi thứ vào một file script, và khi nào nên dùng import động?',
    oral: 'Trước khi có module, mọi script nạp vào cùng một phạm vi toàn cục, nên hai file khai báo trùng tên sẽ đè lên nhau và thứ tự thẻ script trong HTML trở thành điều kiện chạy đúng. Module ES giải quyết đúng chỗ đó: mỗi file có phạm vi riêng, import được nâng lên và chạy trước phần thân của file nhập, và export khai báo cái gì được phép lộ ra. Một module chỉ chạy đúng một lần dù được nạp qua nhiều đường, và các import được liên kết trước khi thực thi nên bạn không còn lo thứ tự. Ngoài ra công cụ build có thể thấy cái nào không dùng và loại bỏ, nên code chết sẽ không vào gói phát hành. Phần lớn dự án hiện đại dùng import tĩnh ở đầu file. Import động trả về một promise và chỉ tải code khi thật sự chạy tới, hợp với phần nặng ít dùng như trình soạn thảo hay thư viện biểu đồ. Nhưng import động làm cây phụ thuộc khó suy luận hơn, nên chỉ dùng khi lợi ích chia tải rõ ràng.',
    deep: '<p><strong>Module tạo ranh giới phạm vi và đồ thị phụ thuộc.</strong> Trước module, mọi khai báo ở cấp cao nhất rơi vào phạm vi toàn cục dùng chung, nên thứ tự nạp file quyết định chương trình có chạy hay không.</p><ul><li><strong>Import tĩnh:</strong> khai báo ở đầu file, được nâng lên và thực thi trước thân module nhập, nên bạn có thể dùng hàm ở bất kỳ đâu trong file mà không sợ gọi trước khi định nghĩa.</li><li><strong>Không có phạm vi toàn cục:</strong> mỗi module có môi trường riêng, hai file khai báo trùng tên không đè lên nhau, và chỉ cái được export mới nhìn thấy từ bên ngoài.</li><li><strong>Thực thi một lần:</strong> engine lưu module đã đánh giá trong một registry, nên dù import qua ba đường khác nhau thì phần thân module cũng chỉ chạy đúng một lần và các export là cùng một tham chiếu.</li><li><strong>Tree shaking:</strong> công cụ build phân tích cái được export và cái thật sự dùng để loại bỏ phần chết. Vì vậy dùng CommonJS cũng làm tree shaking kém hơn, và bạn nên export tập trung thay vì trả về một object khổng lồ.</li><li><strong>Import động:</strong> trả về một promise, chỉ tải và thực thi khi chạy tới. Hợp với phần nặng ít dùng như trình soạn thảo, thư viện biểu đồ, hoặc tải theo tên ngôn ngữ.</li><li><strong>Phụ thuộc vòng:</strong> hai module import lẫn nhau khiến giá trị có thể là undefined lúc dùng. Giải quyết bằng cách đưa phần dùng chung ra một module thứ ba.</li><li><strong>Điều kiện thay đổi:</strong> nếu bạn chuyển sang CommonJS hoặc gộp file lại bằng công cụ build, phạm vi toàn cục quay lại và các khai báo trùng tên sẽ đè nhau. Nếu bật kiểm tra kiểu nghiêm ngặt, việc import sai tên sẽ báo lỗi lúc build, còn nếu không có module mà chỉ dựa vào thứ tự script thì lỗi chỉ hiện ở trình duyệt và khó truy nguyên.</li></ul>',
    code: '// cart.js\nexport const taxRate = 0.1;\nexport function total(items) {\n  return items.reduce((s, it) => s + it.price * (1 + taxRate), 0);\n}\n\n// checkout.js\nimport { total } from "./cart.js";\nconsole.log(total([{ price: 100 }]));\n\n// heavy-editor.js, chỉ tải khi cần\nasync function openEditor(doc) {\n  const mod = await import("./editor/index.js");\n  return mod.mount(doc);\n}',
    expected: null,
    followups: [
      { q: 'Import động khác gì import tĩnh về mặt thời điểm thực thi và phạm vi?', a: 'Import tĩnh được nâng lên đầu module và thực thi trước thân file nhập, nên giá trị import luôn sẵn sàng khi code của bạn chạy. Import động nằm trong một biểu thức, chỉ được thực thi khi chạy tới dòng đó và trả về một promise, nên bạn phải chờ bằng await. Đổi lại bạn được trì hoãn tải code cho tới lúc thật sự cần, đổi tên biến trong module đích cũng không va chạm với biến trong module gọi.' },
      { q: 'Phụ thuộc vòng giữa hai module gây ra lỗi gì và cách sửa ra sao?', a: 'Khi module A import B và B ngược lại import A, engine vẫn liên kết được nhưng ở thời điểm module nào chạy trước, các export của module kia có thể chưa được gán, nên bạn nhận undefined mà không có lỗi cú pháp nào báo. Cách sửa là tách phần dùng chung ra một module thứ ba rồi cho cả hai cùng phụ thuộc vào module đó. Trong trường hợp không tách được, hãy trì hoãn việc dùng bằng import động trong một hàm để phá vòng phụ thuộc ở thời điểm chạy.' }
    ],
    pitfalls: [
      'Gộp hết mã vào một script toàn cục rồi hy vọng thứ tự thẻ script luôn giữ nguyên sau mỗi lần sửa.',
      'Dùng import tĩnh cho một thư viện nặng chỉ cần ở một màn hình hiếm gặp, làm gói phát hành to ra vô dùng.',
      'Tạo phụ thuộc vòng giữa hai module và gặp giá trị undefined mà không hiểu vì sao.'
    ],
    selfcheck: [
      'Tôi vẫn chưa biết chính xác trường hợp nào lỗi undefined do phụ thuộc vòng và trường hợp nào do sai thứ tự nạp.',
      'Tôi giải thích được cơ chế module chạy đúng một lần bằng ví dụ hai file cùng import một module tiện ích.',
      'Tôi có thể tách một cặp module phụ thuộc vòng trong dự án thật bằng cách đưa phần dùng chung ra module thứ ba.'
    ],
    refs: ['mdn-execution-model']
  },
  {
    id: 'B12',
    group: 'B',
    topic: 'Bộ nhớ, dọn listener và timer, rò rỉ trong vòng đời component',
    prio: 'P2',
    level: 'L2',
    type: 'debug',
    q: 'Đoạn code gắn sự kiện và đặt hẹn giờ bên dưới in ra gì, và vấn đề rò bộ nhớ nằm ở đâu khi nó được gọi lại nhiều lần?',
    oral: 'Đoạn này gọi attach hai lần nên hai listener được đăng ký trên cùng một đối tượng, và mỗi listener là một closure khác nhau giữ biến id riêng. Khi sự kiện phát ra, cả hai cùng chạy và in ra hai dòng, lần lượt theo thứ tự đăng ký. Vấn đề không nằm ở chỗ đó, mà nằm ở việc không hề có gỡ listener và không có lệnh dừng hẹn giờ: mỗi lần gọi attach lại tạo thêm một interval mới, và các closure cũ vẫn sống vì interval giữ tham chiếu tới chúng. Gọi attach mười lần thì một sự kiện sẽ chạy mười callback và có mười interval cùng nhịp. Cách sửa là bắt buộc cặp thêm và gỡ: lưu id của interval để dừng, và dùng đúng cặp hàm gắn với hàm gỡ khi đăng ký listener. Trong framework hiện đại, việc gỡ nên nằm trong hàm dọn dẹp mà framework gọi khi component bị huỷ.',
    deep: '<p><strong>Rò bộ nhớ không phải do không xoá biến, mà do tham chiếu còn sống.</strong> Bộ nhớ của một closure chỉ được giải phóng khi không còn đường dẫn tham chiếu nào tới nó.</p><ul><li><strong>Listener không tự biến mất:</strong> addEventListener giữ tham chiếu tới hàm, và hàm giữ tham chiếu tới mọi biến trong closure. Đối tượng sự kiện thường sống lâu hơn component, nên listener cũ kéo theo dữ liệu bị giữ.</li><li><strong>Timer giữ closure:</strong> setInterval và setTimeout giữ hàm tới khi được dừng bằng clearInterval và clearTimeout, hoặc hẹn giờ tự hết hạn. Vì vậy một interval quên dừng sẽ giữ sống closure của nó vô thời hạn.</li><li><strong>Đếm để kiểm chứng:</strong> khi nghi ngờ rò rỉ, hãy đếm số listener đang đăng ký và số interval đang chạy sau mỗi vòng mount và unmount. Nếu hai con số chỉ tăng không giảm thì bạn đã tìm đúng chỗ.</li><li><strong>Cặp thêm và gỡ:</strong> định nghĩa hàm gỡ là hàm thật, không phải hàm ẩn danh tạo mới trong lúc gỡ, vì tham chiếu phải trùng đúng với lúc đăng ký thì lời gỡ mới có tác dụng.</li><li><strong>Khi nào không cần dọn:</strong> nếu đối tượng sự kiện được tạo cục bộ và bị thả bỏ cùng component, hoặc hẹn giờ chỉ chạy vài trăm mili giây, thì việc dọn là chi tiết thừa và làm code rối.</li><li><strong>Công cụ:</strong> tab Memory chụp lại heap hai lần rồi so sánh số object còn sống. Số node tăng đều sau mỗi vòng mở và đóng màn hình nghĩa là bạn đang giữ thứ không cần.</li><li><strong>Điều kiện thay đổi:</strong> nếu chuyển sang framework có hệ thống dọn tự động thì phần lớn trường hợp được xử lý và code dọn thủ công trở nên thừa. Nhưng listener đăng ký lên đối tượng bên ngoài framework vẫn phải dọn tay.</li></ul>',
    code: 'const bus = new EventTarget();\n\nfunction attach(id) {\n  bus.addEventListener("tick", function () {\n    console.log("tick for", id);\n  });\n  setInterval(() => console.log("heartbeat"), 1000);\n}\n\nattach("a");\nattach("b");\nbus.dispatchEvent(new Event("tick"));',
    expected: 'In ra hai dòng "tick for a" rồi "tick for b" theo thứ tự đăng ký listener, sau đó các dòng heartbeat lặp lại mỗi giây. Nguyên nhân: mỗi lần gọi attach đăng ký thêm một listener khác và tạo thêm một interval mà không gỡ listener cũ và không dừng interval cũ, nên một sự kiện duy nhất được xử lý nhiều lần và các closure cũ vẫn bị giữ trong bộ nhớ.',
    followups: [
      { q: 'Vì sao hàm gỡ listener phải là đúng hàm đã đăng ký, và sai ở đâu nếu viết hàm ẩn danh?', a: 'Engine định danh listener bằng chính tham chiếu hàm cùng loại sự kiện, nên hàm gỡ truyền vào phải cùng tham chiếu với hàm đăng ký thì việc gỡ mới có tác dụng. Nếu bạn viết removeEventListener với một hàm ẩn danh mới, dù mã trông giống nhau thì hai tham chiếu khác nhau và listener cũ vẫn còn. Cách an toàn là định nghĩa hàm gắn và hàm gỡ dạng function thật, hoặc dùng một object để thu thập các hàm gỡ rồi chạy chúng trong hàm dọn dẹp.' },
      { q: 'Làm sao phân biệt rò bộ nhớ thật với chuyện heap chỉ lớn lên rồi được thu gom lại?', a: 'Vì bộ thu gom rác không trả bộ nhớ về hệ điều hành ngay, heap có thể lớn lên rồi nhỏ lại mà không phải rò rỉ. Dấu hiệu rò rỉ thật là số object sống tăng đều sau mỗi vòng thao tác lặp lại: mở rồi đóng một màn hình nhiều lần và chụp heap ở hai thời điểm giống nhau. Trong devtools, dùng lựa chọn so sánh hai lần chụp sau khi ép thu gom, nếu các node bị giữ tăng tuyến tính theo số lần thao tác thì bạn đang giữ tham chiếu không cần thiết.' }
    ],
    pitfalls: [
      'Gỡ listener bằng một hàm ẩn danh mới trong khi lúc đăng ký dùng hàm khác, nên listener cũ vẫn còn.',
      'Quên lưu id của interval rồi cố dừng bằng một giá trị null, khiến interval chạy vô thời hạn.',
      'Tin rằng đặt biến tham chiếu bằng null đã đủ để giải phóng bộ nhớ, trong khi listener và timer vẫn giữ closure đó.'
    ],
    selfcheck: [
      'Tôi vẫn chưa biết cách đếm chính xác số listener và timer đang sống trong một trang đang chạy.',
      'Tôi giải thích được vì sao gọi attach hai lần khiến một sự kiện duy nhất chạy hai callback bằng ví dụ hai closure khác id.',
      'Tôi có thể thêm cặp thêm và gỡ cho một màn hình thật và xác nhận bằng devtools rằng số listener không còn tăng.'
    ],
    refs: ['mdn-execution-model']
  },
  {
    id: 'B13',
    group: 'B',
    topic: 'structuredClone so với vòng JSON để deep copy',
    prio: 'P2',
    level: 'L2',
    type: 'predict',
    q: 'Hai cách deep copy dưới đây cho kết quả khác nhau ở những điểm nào, và vì sao vòng JSON làm mất dữ liệu?',
    oral: 'Vòng JSON serialize rồi deserialize, nên nó chỉ giữ được những gì JSON biểu diễn được. Date thành chuỗi vì JSON không có kiểu ngày, Infinity và NaN thành null vì JSON không có số vô hạn và số không phải số, và thuộc tính có giá trị undefined bị mất hẳn vì JSON không có undefined. Ngoài ra hàm, class instance và Map hay Set đều không sống sót. Ngược lại, structuredClone là API của runtime, nó đi qua thuật toán clone có cấu trúc nên giữ nguyên Date, giữ Infinity, NaN và thuộc tính undefined, và tạo mảng mới hoàn toàn tách biệt. Nhưng structuredClone không copy được hàm, không copy được node DOM, và ném lỗi khi gặp các giá trị không clone được. Vì vậy chọn theo hình dạng dữ liệu: dữ liệu thuần JSON thì cả hai đều được, có Date, Map, Set hay cần giữ undefined thì dùng structuredClone, còn dữ liệu có hàm hoặc class instance thì phải clone tay từng nhánh.',
    deep: '<p><strong>Deep copy có nhiều cách, và mỗi cách giữ được một tập kiểu dữ liệu khác nhau.</strong></p><ul><li><strong>Vòng JSON là gì:</strong> gọi stringify để biến object thành chuỗi rồi parse để dựng lại object. Bước trung gian là chuỗi, nên mọi thứ không biểu diễn được bằng JSON đều biến mất hoặc bị đổi kiểu.</li><li><strong>JSON làm mất gì:</strong> Date thành chuỗi, hàm và biểu tượng bị bỏ qua, thuộc tính undefined bị loại khỏi danh sách key, Infinity và NaN thành null, và Map cùng Set thành object rỗng.</li><li><strong>structuredClone làm gì:</strong> là API của runtime đi qua thuật toán clone có cấu trúc, nên giữ Date, Map, Set, BigInt, Infinity, NaN và thuộc tính undefined, đồng thời tạo object mới không dùng chung tham chiếu nào với bản gốc.</li><li><strong>Giới hạn của structuredClone:</strong> không clone được hàm, DOM node, Proxy, và ném lỗi DataCloneError khi gặp các giá trị đó. Nó cũng không chạy được với object có hàm ở bất kỳ đâu trong đồ thị, kể cả hàm lồng sâu bên trong.</li><li><strong>Chọn gì:</strong> dữ liệu thuần JSON thì vòng JSON là đủ và chạy nhanh; có Date, Map, Set hay cần giữ undefined thì dùng structuredClone; có hàm hoặc class instance thì clone tay từng nhánh, vì không có lựa chọn nào tự làm được.</li><li><strong>Chi phí:</strong> cả hai đều duyệt toàn bộ đồ thị nên O(n). Với dữ liệu nhỏ, cách rẻ nhất là tránh deep copy bằng cách không lưu tham chiếu đến dữ liệu dùng chung.</li><li><strong>Điều kiện thay đổi:</strong> trên môi trường cũ không có structuredClone thì phải quay về clone tay. Nếu dữ liệu phải gửi qua ranh giới xử lý hoặc lên mạng, deep copy không còn đúng nữa và cần một quy ước tuần tự hoá dùng chung.</li></ul>',
    code: 'const original = {\n  when: new Date("2024-01-02T03:04:05Z"),\n  items: [1, 2],\n  skip: undefined,\n  inf: Infinity,\n  nan: NaN\n};\n\nconst viaJson = JSON.parse(JSON.stringify(original));\nconst viaClone = structuredClone(original);\n\nconsole.log(viaJson.when instanceof Date, viaJson.items === original.items);\nconsole.log(viaJson.inf, viaJson.nan, Object.keys(viaJson).join(","));\nconsole.log(viaClone.when instanceof Date, viaClone.items === original.items);\nconsole.log(viaClone.inf, viaClone.nan, "skip" in viaClone);',
    expected: 'Bốn dòng lần lượt là false false, rồi null null when,items,inf,nan, rồi true false, rồi Infinity NaN true. Nguyên nhân: vòng JSON biến Date thành chuỗi nên instanceof Date cho false, Infinity và NaN thành null, và thuộc tính skip có giá trị undefined bị loại khỏi danh sách key. structuredClone giữ nguyên kiểu Date, giữ Infinity và NaN, giữ cả thuộc tính có giá trị undefined, và tạo một mảng items mới nên items không cùng tham chiếu với bản gốc.',
    followups: [
      { q: 'Khi nào vòng JSON vẫn là lựa chọn đúng dù nó mất dữ liệu?', a: 'Khi dữ liệu của bạn là JSON thuần theo đúng nghĩa, tức chỉ gồm chuỗi, số, boolean, null, object và array, và bạn cần một bản sao đơn giản để gửi qua postMessage, lưu vào localStorage hoặc so sánh. Vòng JSON rẻ, không cần thư viện và hoạt động giống nhau trên mọi môi trường cũ. Ngược lại, nếu có bất kỳ Date, Map, Set, BigInt hay thuộc tính undefined nào trong đồ thị thì nó đã ngầm đánh đổi dữ liệu lấy sự tiện lợi.' },
      { q: 'Vì sao structuredClone ném lỗi khi dữ liệu có hàm, và lúc đó bạn làm gì?', a: 'Thuật toán clone có cấu trúc chỉ biết sao chép các cấu trúc dữ liệu mà runtime hiểu, còn hàm là hành vi gắn với scope nên không thể tái tạo độc lập. Vì vậy gặp hàm ở bất kỳ đâu trong đồ thị thì API ném lỗi DataCloneError chứ không âm thầm bỏ qua, và đó là hành vi có chủ ý để bạn không mất dữ liệu mà không hay biết. Cách xử lý là tách phần có hàm ra khỏi đồ thị cần copy, hoặc clone thủ công: copy object thuần bằng structuredClone rồi gán lại các thuộc tính chứa hàm, hoặc thay hàm bằng một tham chiếu tới nó.' }
    ],
    pitfalls: [
      'Deep copy bằng vòng JSON rồi tưởng Date vẫn là Date, trong khi nó đã thành chuỗi và mọi phép tính ngày sau đó sẽ hỏng.',
      'Dùng structuredClone trên object có hàm và không bắt lỗi, khiến cả luồng dữ liệu dừng lại với lỗi DataCloneError.',
      'Tưởng thuộc tính undefined được giữ lại, trong khi vòng JSON loại bỏ nó khỏi danh sách key.'
    ],
    selfcheck: [
      'Tôi vẫn chưa nhớ đủ danh sách các kiểu dữ liệu mà mỗi cách deep copy giữ hoặc làm mất.',
      'Tôi giải thích được vì sao vòng JSON biến Infinity thành null bằng ví dụ một object cấu hình có giá trị số vô hạn.',
      'Tôi có thể chọn đúng cách deep copy cho một object form có Date, mảng con và một hàm callback.'
    ],
    refs: ['mdn-execution-model']
  },
  {
    id: 'B14',
    group: 'B',
    topic: 'Xử lý lỗi trong async: try catch quanh await và unhandled rejection',
    prio: 'P2',
    level: 'L3',
    type: 'debug',
    q: 'Hàm run bên dưới không bắt được lỗi gì cả, và sửa thế nào để try catch thật sự bắt được lỗi của một lời gọi bất đồng bộ?',
    oral: 'Hai hàm trong ví dụ tạo ra hai kết quả khác nhau và nguyên nhân nằm ở chỗ có await hay không. Trong run, loadData được gọi mà kết quả promise bị bỏ qua, nên lệnh gọi trả về ngay và dòng A in ra; lỗi chỉ xảy ra sau đó, ở microtask của timer, lúc đó khối try đã thoát và không còn ai giữ promise đó nên nó trở thành unhandled rejection và làm Node dừng tiến trình. Trong runFixed, có await ngay trong khối try nên hàm bị treo tại đó cho tới khi promise hoàn tất, lỗi được ném vào đúng khối try và in ra caught boom. Nguyên tắc là khối try chỉ bắt được lỗi ném đồng bộ và lỗi của promise mà bạn chờ ngay bên trong nó. Với mọi nhánh không await, hãy bọc thủ công bằng then và catch, hoặc dùng await để giữ ngữ nghĩa đồng bộ. Ở cấp ứng dụng, nên bắt unhandled rejection toàn cục để ghi log và báo cáo, nhưng đó là lưới an toàn cuối cùng chứ không phải cách xử lý đúng.',
    deep: '<p><strong>Khối try chỉ bắt được lỗi phát sinh bên trong nó.</strong> Với code bất đồng bộ, ranh giới này thay đổi theo việc bạn có await hay không.</p><ul><li><strong>Cơ chế:</strong> khi một hàm async gặp await, hàm đó tạm dừng và trả về một promise. Lỗi phát sinh sau điều kiện await sẽ làm promise đó bị từ chối, và nếu có await trong khối try thì việc từ chối được ném như một lỗi bình thường vào khối catch.</li><li><strong>Không await thì mất kiểm soát:</strong> gọi hàm async mà không await là ném đi kết quả promise. Lỗi không thuộc phạm vi khối try nữa, và nếu không ai gắn handler thì đó là unhandled rejection.</li><li><strong>return cũng cần await:</strong> muốn lỗi của promise con được try catch bên ngoài bắt thì phải viết return await. Nếu chỉ return promise, lỗi thoát khỏi hàm và khối catch bên ngoài không bắt được.</li><li><strong>Trường hợp không await được:</strong> try catch quanh await bắt được lỗi của cả lô trong Promise.all. Với forEach thì callback là hàm khác nên try catch bên ngoài không bọc được; khi đó dùng for...of với await.</li><li><strong>Lưới an toàn cuối:</strong> nên đăng ký một handler unhandledRejection ở cấp ứng dụng để ghi log và báo cáo. Nhưng đây chỉ là biện pháp cuối, vì lỗi vẫn mất ngữ cảnh tại chỗ xảy ra ra.</li><li><strong>Phân biệt loại lỗi:</strong> hãy bọc lỗi vào một kiểu có mã lỗi thay vì so khớp chuỗi message, vì message dễ bị thay đổi theo ngôn ngữ hay theo tầng trung gian.</li><li><strong>Điều kiện thay đổi:</strong> nếu bạn thêm await vào một lời gọi, khối try bắt lỗi được, nhưng mọi code sau await sẽ bị trì hoãn sang microtask kế tiếp nên thứ tự thực thi thay đổi. Nếu dùng allSettled thì lô không bao giờ từ chối nên khối catch không bao giờ chạy và bạn phải tự kiểm tra từng phần tử.</li></ul>',
    code: 'function loadData() {\n  return new Promise((resolve, reject) => {\n    setTimeout(() => reject(new Error("boom")), 10);\n  });\n}\n\nasync function run() {\n  try {\n    loadData();\n    console.log("A");\n  } catch (err) {\n    console.log("caught", err.message);\n  }\n}\n\nasync function runFixed() {\n  try {\n    await loadData();\n    console.log("B");\n  } catch (err) {\n    console.log("caught", err.message);\n  }\n}\n\nrun();\nrunFixed();',
    expected: 'In ra dòng A, sau đó Node dừng tiến trình với unhandled rejection là Error boom, và dòng caught boom của runFixed không kịp in ra. Nguyên nhân: trong run không có await nên lời gọi loadData trả về ngay và bị bỏ qua, lỗi chỉ phát sinh sau đó ở microtask của timer khi khối try đã thoát, nên không ai giữ promise đó và trở thành unhandled rejection làm tiến trình dừng. Trong runFixed có await ngay trong khối try nên hàm bị treo tại đó cho tới khi promise từ chối, lỗi được ném vào khối catch và in ra caught boom, nhưng Node đã dừng tiến trình trước đó nên dòng đó không xuất hiện.',
    followups: [
      { q: 'Vì sao return await lại cần thiết khi bạn muốn khối try bên ngoài bắt lỗi?', a: 'Khi bạn return một promise mà không await, hàm async sẽ trả về chính promise đó và lỗi của nó nổi lên ở nơi người gọi xử lý, tức là khối try bao quanh lời gọi hàm của bạn không còn tác dụng vì lỗi chưa xảy ra tại thời điểm hàm kết thúc khối try. Nếu bạn viết return await, hàm bị treo tại chỗ đó, lỗi được ném vào khối try ngay trong thân hàm, và bạn có thể chuyển nó thành một giá trị trả về hoặc một lỗi có kiểu rõ ràng.' },
      { q: 'Trong vòng lặp, khác biệt giữa forEach và for...of với await về xử lý lỗi thế nào?', a: 'forEach gọi một callback cho mỗi phần tử và không chờ kết quả của callback, nên mỗi callback là một hàm riêng và khối try bên ngoài không bọc được phần thân của callback. Hệ quả là bạn phải viết try catch riêng trong từng callback, hoặc dùng allSettled rồi kiểm tra từng kết quả. Ngược lại, for...of kèm await giữ hàm treo tại từng lần lặp nên một lỗi sẽ ném ra khối try bao quanh cả vòng lặp và vòng lặp dừng tại chỗ lỗi phát sinh.' }
    ],
    pitfalls: [
      'Gọi một hàm async bên trong try mà không await, nên khối catch không bao giờ chạy và lỗi thành unhandled rejection.',
      'Viết return promise thay vì return await rồi ngạc nhiên khi khối try ở lời gọi không bắt được lỗi.',
      'Dùng forEach kèm try catch bên ngoài và tưởng mọi lỗi của các callback đã được bắt.',
      'Nuốt lỗi bằng catch rỗng rồi tưởng là đã xử lý xong, khiến dữ liệu sai âm thầm lan xuống dưới.'
    ],
    selfcheck: [
      'Tôi vẫn chưa phân biệt được khi nào lỗi trong một hàm async sẽ thành unhandled rejection và khi nào được bắt bởi khối try.',
      'Tôi giải thích được vì sao khối try trong hàm không có await không bắt được lỗi của lời gọi bất đồng bộ.',
      'Tôi có thể rà một lớp gọi API và thêm await hoặc handler unhandledRejection để không còn lỗi bị bỏ qua.'
    ],
    refs: ['mdn-promise']
  }
);