# L15: State ở đâu: component, cây component hay store toàn cục

> **Trạng thái:** bản viết lại đủ bảy bước, nằm ngoài `src/`. Chưa nối vào app, chưa đo với người đọc thứ hai.
> **Số liệu:** mọi con số trong bài là giả định của kịch bản, ghi "Giả sử" ở chỗ dùng. Không phải số đo từ hệ thống thật, không phải mặc định của Vue hay Pinia. Riêng output ở Bước 5 là output thật của script chạy trên máy này.

**Tiên quyết:** biết một biến JavaScript và phạm vi của nó; biết component là một hàm trả về giao diện; biết `ref` là một hộp bọc một giá trị, đọc giá trị bằng `.value`.

## Bước 1. Đoán trước

Giả sử bạn làm một trang tải tài liệu gồm ba phần: huy hiệu đếm số tệp trên thanh menu, vùng kéo thả ở giữa màn hình, và panel chi tiết bên phải. Ba phần nằm ở ba nhánh cây khác nhau, không phần nào là cha của phần nào.

Bạn viết một hàm `useFiles()` có `const files = ref([])` bên trong, rồi gọi hàm đó ở cả ba phần. Bạn kéo ba tệp vào vùng kéo thả.

1. Panel chi tiết hiện mấy tệp?
2. Huy hiệu trên thanh menu ghi số mấy?

Viết đáp án ra giấy. Đáp án nằm ở cuối bước 3.

## Bước 2. Điều bạn đã biết

Bạn đã từng viết một trang HTML có một ô nhập và một dòng chữ. Mỗi lần gõ, bạn đọc `input.value` rồi gán vào `document.querySelector('#out').textContent`. Trang đó chạy đúng vì chỉ có một chỗ ghi và một chỗ đọc, và bạn tự nhớ phải ghi lại mỗi lần dữ liệu đổi.

Vue thay hai khớp trong câu đó:

- Thay biến DOM bằng `ref`. `ref` là hộp bọc giá trị; Vue ghi sổ chỗ nào đang đọc hộp đó, nên bạn không phải tự nhớ ghi lại.
- Thay một trang phẳng bằng cây component. Một component có thể chứa component khác, và mỗi component có một vùng biến riêng.

Bài này thêm khớp thứ ba, và đây là khớp gây lỗi: **một biến `ref` khai ở đâu thì thuộc về ai**. Có ba chỗ khai, và chúng không tương đương:

1. Khai trong `setup` của component → thuộc về **một instance** của component đó.
2. Khai trong component cha rồi `provide` xuống → thuộc về **một nhánh cây**.
3. Khai ngoài mọi component, hoặc trong một store → thuộc về **cả ứng dụng**.

**Dạng câu hỏi phỏng vấn bài này trả lời được:** "Vì sao ba component cùng gọi một composable mà mỗi nơi hiện một con số khác nhau?" và "Pinia khác một biến khai ở phạm vi module ở chỗ nào?"

## Bước 3. Một ví dụ có số

Giả sử trang có ba component: `Navbar` (huy hiệu), `DropZone` (vùng kéo thả), `Detail` (panel chi tiết). Cả ba gọi `useFiles()`, và hàm đó khai `const files = ref([])` bên trong thân hàm.

Mỗi lần gọi là một lần chạy lại thân hàm. Ba lần gọi tạo ra ba hộp `ref` khác nhau, không hộp nào biết hộp nào. Giả sử bạn kéo hai tệp vào `DropZone` và một tệp vào `Detail`:

- `DropZone` thấy 2.
- `Detail` thấy 1.
- `Navbar` thấy 0.

Giả sử sau đó một kỹ sư sửa nhanh bằng cách đưa `files` ra ngoài hàm, thành biến ở phạm vi module. Bây giờ cả ba cùng đọc một hộp, nên cả ba đều thấy 3. Trên trình duyệt, lỗi biến mất.

Nhưng phạm vi module là phạm vi của **tiến trình**, không phải của ứng dụng. Giả sử bộ test có hai bài chạy liên tiếp trong cùng một tiến trình: bài thứ nhất thêm 3 tệp, bài thứ hai không thêm gì mà vẫn đếm được 3. Bài thứ hai bắt đầu sai, và nó chỉ sai khi chạy sau bài thứ nhất.

**Đáp án bước 1:** panel chi tiết thấy 0 tệp, huy hiệu ghi 0.

## Bước 4. Cơ chế, từng bước một

```mermaid
flowchart BT
  A[App.vue: provide 'theme' = ref] --> B[Layout]
  B --> C[Sidebar]
  C --> D[ThemeToggle: inject 'theme']
  D -. inject đi ngược lên tổ tiên, dừng ở App.vue .-> A
```

1. **State cục bộ thuộc về một instance.** `ref` khai trong `setup` được tạo mỗi lần component được tạo, và chết khi instance bị gỡ. Đây là mức hẹp nhất và là mặc định đúng cho state của một màn hình: nội dung ô nhập, trạng thái mở của một panel, trang hiện tại của một bảng.

2. **`provide` ghi một cặp khóa và giá trị lên instance hiện tại.** `inject` đi ngược lên cha, ông, cho tới khi gặp khóa đó; không gặp thì trả giá trị mặc định (và cảnh báo nếu không có mặc định). Tài liệu Vue nói rõ: nếu nhiều tổ tiên cùng cung cấp một khóa, `inject` lấy giá trị từ tổ tiên gần nhất.

3. **Phản ứng phải nằm trong giá trị được provide.** Đây là chỗ hỏng thầm lặng. Tài liệu Vue ghi: nếu giá trị được provide là `ref`, nó được inject nguyên trạng và **không** tự mở gói, để component con giữ được dây phản ứng. Nếu bạn provide `theme.value` (một chuỗi), con nhận bản sao tại thời điểm inject và không bao giờ cập nhật nữa. Cùng một cú pháp, hai hành vi khác nhau, không có lỗi nào được ném ra.

4. **Store là một instance cho mỗi app, không phải cho mỗi tiến trình.** `defineStore(id, setup)` chỉ *khai báo*; store thật được tạo ở lần gọi `useStore()` đầu tiên trong một app. Pinia gắn store với app đang hoạt động, nên app mới thì store mới. Đó là khác biệt cốt lõi với biến ở phạm vi module: biến module không gắn với app nào, nên nó sống lâu hơn app và rò sang lần chạy sau.

5. **Vì vậy store phải có hàm reset.** Cùng một app, người dùng đăng xuất rồi đăng nhập bằng tài khoản khác: app không được tạo lại, nên store cũng không được tạo lại. `$reset()` chỉ có ở option store; store viết theo `defineStore(id, setup)` như store trong script không có `$reset()` và phải tự viết action `reset()`. Nếu không có một trong hai, dữ liệu của phiên trước còn nguyên. Quy tắc thực dụng: mỗi store có một action `reset()` gom mọi lần gán về giá trị đầu, và chỗ đăng xuất gọi action đó.

**Chọn mức nào.** Chọn theo phạm vi sở hữu, không theo tên thư viện: state chỉ một màn hình đọc và ghi → trong component; state một nhánh cây cùng đọc → `provide` một `ref`; nhiều nhánh không có tổ tiên chung cùng đọc và ghi → store; state phải copy được bằng đường dẫn → để trong URL, không cần store.

## Bước 5. Thí nghiệm nhỏ

Chạy trong thư mục `lessons/03-vue/l15/`. Script dùng `vue` và `pinia` thật, chạy hai "bài test" liên tiếp trong cùng một tiến trình node.

```
npm install vue pinia
node state-scope.mjs
```

Tương đương với bun: `bun add vue pinia && bun state-scope.mjs`

Kết quả đã chạy trên máy này:

```
Số tệp đếm được ở đầu mỗi bài test:
  test 1 — singleton, thêm 3 tệp           ->  3
  test 2 — singleton, không thêm gì        ->  3
  test 3 — hàm tạo mới, thêm 3 tệp         ->  3
  test 4 — hàm tạo mới, không thêm gì      ->  0
  test 5 — pinia (app mới), thêm 3 tệp     ->  3
  test 6 — pinia (app mới), không thêm gì  ->  0
  test 7 — pinia (cùng app), thêm 3 tệp    ->  3
  test 8 — pinia (cùng app) sau reset()    ->  0

Composable gọi ở ba component, mỗi nơi tự gọi:
  A thấy 2, B thấy 1, C thấy 0
```

Đọc bảng này theo ba cặp:

- **test 1 và test 2:** singleton còn sót 3 tệp từ bài trước. Đây chính là lỗi "chạy cả bộ thì fail, chạy riêng lẻ thì qua".
- **test 3 và test 4:** hàm tạo mới cho bài test sau một bản sạch. Cùng cơ chế, chỉ khác chỗ khai biến.
- **test 5 và test 6:** Pinia thật, mỗi bài test một app mới, nên bài sau sạch. Đây là lý do "store khác biến module" không phải khẩu hiệu: nó là hệ quả của việc store gắn với app.
- **test 7 và test 8:** nếu bạn dùng lại cùng app, store vẫn giữ dữ liệu; chỉ `reset()` mới làm sạch. Trong ứng dụng thật, "dùng lại cùng app" chính là đăng xuất rồi đăng nhập.

**Tự thử:** bỏ dòng `shared.reset()` và chạy lại. Test 8 in ra số mấy, và vì sao?

## Bước 6. Bốn câu luyện tập

Trả lời trước khi mở đáp án.

**Câu 1.** Một composable có `const files = ref([])` bên trong, được gọi ở ba component. Mỗi component thấy bao nhiêu tệp, và khi nào hành vi đó là đúng?

<details>
<summary>Đáp án</summary>

Kết luận: mỗi component thấy số tệp riêng của nó, vì mỗi lần gọi chạy lại thân hàm và tạo một hộp `ref` mới. Hành vi đó đúng khi mỗi component cần một bản state độc lập, ví dụ mỗi dòng trong bảng có bộ lọc riêng.

Điều kiện để đúng: ba component không được kỳ vọng chia sẻ dữ liệu. Nếu màn hình có một huy hiệu đếm chung, kỳ vọng đó sai ngay từ đầu.

Cách kiểm: log một id duy nhất ở đầu composable (`crypto.randomUUID()`), gọi ở ba nơi, in ba id. Ba id khác nhau nghĩa là ba bản state.

</details>

**Câu 2.** Bạn `provide('theme', theme)` với `theme` là `ref('light')`, component cháu inject và đọc `theme.value`. Đổi `theme.value` ở cha, cháu có cập nhật không? Nếu provide `theme.value` thì sao?

<details>
<summary>Đáp án</summary>

Kết luận: provide chính `ref` thì cháu cập nhật; provide `theme.value` thì cháu giữ một chuỗi và đứng yên mãi.

Tài liệu Vue nói giá trị provide là `ref` sẽ được inject nguyên trạng, không tự mở gói, để giữ dây phản ứng. Còn `theme.value` là chuỗi `'light'`, được chép tại thời điểm inject.

Điều kiện để đúng: giá trị provide phải là `ref`, `reactive` hoặc `computed`. Với `reactive`, phải provide cả object, không provide thuộc tính đã mở gói.

Cách kiểm: sửa `theme.value` ở cha rồi in giá trị ở cháu. Nếu cháu vẫn in giá trị cũ, bạn đã provide giá trị đã mở gói.

</details>

**Câu 3.** Vì sao biến ở phạm vi module làm bài test thứ hai nhìn thấy dữ liệu của bài thứ nhất, còn store của Pinia thì không?

<details>
<summary>Đáp án</summary>

Kết luận: biến module sống theo tiến trình node, còn store sống theo app. Mỗi bài test tạo một app mới thì có một store mới; biến module không có cơ chế nào để "tạo mới".

Điều kiện để đúng: mỗi bài test phải tạo app (hoặc Pinia) mới. Nếu cả bộ test dùng chung một app, store cũng rò y như biến module.

Cách kiểm: chạy hai bài test theo thứ tự đảo ngược nhau. Nếu kết quả đổi theo thứ tự, có state sống ngoài app.

</details>

**Câu 4.** Người dùng đăng xuất rồi đăng nhập bằng tài khoản khác, và màn hình vẫn hiện dữ liệu của tài khoản trước. Lỗi ở đâu, và sửa bằng gì?

<details>
<summary>Đáp án</summary>

Kết luận: store không được tạo lại khi đổi phiên, nên state của phiên trước còn nguyên. Thiếu một action `reset()` và thiếu chỗ gọi nó lúc đăng xuất.

Điều kiện để đúng: đăng xuất không tải lại toàn trang. Nếu bạn `location.reload()`, app tạo lại và store tạo lại, nên lỗi biến mất — đó là che lỗi, không phải sửa.

Cách kiểm: đăng xuất, đăng nhập tài khoản B, mở devtools xem state của store. Nếu còn dữ liệu của A, `reset()` chưa chạy hoặc chưa gom hết các khóa.

</details>

## Bước 7. Câu neo

> State thuộc về phạm vi đã tạo ra nó — instance, nhánh cây, hay app — nên đặt sai phạm vi thì dữ liệu hoặc không tới được nơi cần, hoặc sống lâu hơn phiên và rò sang lần chạy sau.

## Ghi chú nguồn

<details>
<summary>Ghi chú nguồn, đọc ngày 2026-10-29</summary>

- https://vuejs.org/guide/components/provide-inject.html — xác nhận `provide`/`inject` là cặp khóa-giá trị, `inject` lấy tổ tiên gần nhất, giá trị là `ref` thì được inject nguyên trạng và không tự mở gói, có `app.provide` ở mức ứng dụng.
- https://pinia.vuejs.org/core-concepts/ — xác nhận `defineStore` cần id duy nhất, store chỉ được tạo ở lần gọi `useStore()` đầu tiên, store là object bọc `reactive` nên không destructure trực tiếp được.
- Output ở Bước 5: chạy `node state-scope.mjs` trong `lessons/03-vue/l15/`, dán nguyên văn.

Chưa kiểm trong bài này: trang tài liệu Pinia về testing và `setActivePinia` (hành vi cô lập giữa các bài test trong bài này là quan sát từ script, không phải trích dẫn tài liệu); hành vi rò state khi render phía server; chi phí bộ nhớ của store so với biến module [INFERENCE]. Số liệu trong sự cố và ví dụ là kịch bản.

</details>
