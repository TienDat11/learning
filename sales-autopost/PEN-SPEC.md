# PROMPT cho agent Pencil — AutoPost, bộ màn chuẩn 14 màn

File `.pen`: `<<PATH .pen>>` (Justin tự điền đường dẫn file .pen khi mở pen.dev).
Dữ liệu: `D:/research/sales-autopost/PEN-DATA-PACK.md` — **dữ liệu mẫu do người viết spec tự tạo**, không phải dữ liệu thật (tool chưa code). **Mọi chữ có nội dung bạn vẽ phải chép từ file này.** Không có trong đó thì không được vẽ.

Đọc lại pack trước khi vẽ. Không hỏi lại; không chắc thì chọn phương án sát pack nhất, làm tiếp, ghi lại ở báo cáo cuối.

---

## 0. Bối cảnh

- `AutoPost · Bộ màn chuẩn` sẽ chứa đúng **14 màn** — không ít hơn, không thêm màn nào khác.

- **Mục tiêu duy nhất:** 14 màn này nằm trong `AutoPost · Bộ màn chuẩn`, mỗi màn **0 placeholder, 0 node có `problems`, 0 chữ nội dung dưới 14px, 0 chữ tự bịa**, và được export PNG vào `<<PATH .pen>>/../exports/` (thư mục này chưa có, `Export` sẽ tự tạo).

Đây là **tool nội bộ cho team sales**, không phải landing page: 50–70 bài/ngày, nhiều kênh (Facebook Page, Instagram, Threads, LinkedIn, X, TikTok, Telegram, Zalo OA), có hàng đợi, có duyệt, có kênh, có cài đặt. Giao diện phải là dashboard vận hành, đậm chất ứng dụng nội bộ: bảng dữ liệu, chip trạng thái, khung soạn, lịch — không trang trí.

---

## 1. Chèn vào đâu

- Màn được xếp thành **5 hàng**, mỗi hàng một **frame con auto-layout ngang** (căn trên), **cách nhau 120px**, đặt trong frame cha `AutoPost · Bộ màn chuẩn`.

Đặt tên frame theo đúng quy ước `N · <Tên màn> · <Khổ>` (N = thứ tự màn 1..14).

Thứ tự các hàng (đúng thứ tự này, không xáo):

- **`Hàng 1 · Vận hành hằng ngày`**: màn 1, 2, 3 (1440, 1440, 390)
- **`Hàng 2 · Soạn và duyệt`**: màn 4, 5, 6 (1440, 1440, 390)
- **`Hàng 3 · Lịch và chiến dịch`**: màn 7, 8, 9 (1440, 1440, 1440)
- **`Hàng 4 · Kênh và sự cố`**: màn 10, 11, 12 (1440, 1440, 1440)
- **`Hàng 5 · Kết quả`**: màn 13, 14 (1440, 390)

Không xoá, không đổi tên frame nào khác trên canvas. Hàng mới phải hug nội dung, không để 0×0.

Tên 14 màn (đặt `name` đúng chuỗi này):

1. `1 · Bảng điều khiển · Web`
2. `2 · Hàng đợi · Web`
3. `3 · Bảng điều khiển · Điện thoại`
4. `4 · Soạn bài · Web`
5. `5 · Duyệt bài · Web`
6. `6 · Soạn bài · Điện thoại`
7. `7 · Lịch đăng · Web`
8. `8 · Chiến dịch · Web`
9. `9 · Kho nội dung · Web`
10. `10 · Kênh · Web`
11. `11 · Kênh · Lỗi đăng bài · Web`
12. `12 · Cài đặt · Web`
13. `13 · Báo cáo · Web`
14. `14 · Báo cáo · Điện thoại`

**Lưu ý về màn 4 (Soạn bài):** màn này bao gồm luôn panel **xem trước** — dựng một khung soạn 2 cột (cột trái nội dung gốc, cột phải 8 ô kênh đích có bật/tắt + đếm ký tự), và ngay bên dưới/ở rìa phải là khối "Xem trước theo kênh" với 8 biến thể cạnh nhau (Threads 500, X 280…). Màn `5 · Xem trước` trong kế hoạch gốc đã được gộp vào đây nên tổng vẫn là 14 màn (3 + 3 + 3 + 3 + 2).

---

## 2. Token và font — định nghĩa bảng mới `ap-*`

File .pen này chưa có sẵn token, nên **tự định nghĩa bảng `ap-*` mới** (20 biến, mỗi biến có giá trị light + dark). Chọn bảng màu hợp lý cho **tool vận hành nội bộ**: nền sáng dịu, surface trắng, accent xanh Meta-ish, trạng thái rõ ràng (xanh lá/đỏ/cam).

Bảng `ap-*` (có theme light/dark):

| Token | Light | Dark |
|---|---|---|
| `ap-bg` | `#F2F4F6` | `#0D1218` |
| `ap-surface` | `#FFFFFF` | `#161C24` |
| `ap-sunken` | `#E7EBEF` | `#202832` |
| `ap-fg` | `#17212C` | `#EEF3F9` |
| `ap-fg-2` | `#545A64` | `#B8C2CE` |
| `ap-fg-3` | `#8A939E` | `#8693A3` |
| `ap-line` | `#DFE1E6` | `#2E3642` |
| `ap-line-2` | `#C7CAD0` | `#424B57` |
| `ap-accent` | `#0065FF` | `#5C8FFF` |
| `ap-accent-ink` | `#00387A` | `#8FB3E8` |
| `ap-accent-soft` | `#EAF0FF` | `#1F2C42` |
| `ap-ok` | `#00875A` | `#36C59F` |
| `ap-ok-soft` | `#E2F5EE` | `#0E3A2F` |
| `ap-warn` | `#B36200` | `#F2A900` |
| `ap-warn-soft` | `#FBEDE1` | `#3E2C08` |
| `ap-err` | `#CF1322` | `#F6455A` |
| `ap-err-soft` | `#FDECEC` | `#3F131B` |
| `ap-code-bg` | `#F0F3F7` | `#11171F` |
| `ap-code-fg` | `#17212C` | `#F5F8FC` |

Font: `$ap-font` = **Be Vietnam Pro** (mọi chữ nội dung — hoặc Inter nếu chưa tải được); `$ap-mono` = **JetBrains Mono** (mã lỗi, ID, số liệu).

Thang cỡ (đo được, không phát minh giá trị mới):

- Cỡ chữ: `12` · `14` · `16` · `18` · `26` · `28` · `40`
- Nhãn meta in hoa dùng `12`; **mọi chữ nội dung khác ≥ 14**.
- Độ đậm: `normal` · `600` · `700`. Không dùng giá trị khác.
- Bo góc: `4` · `6` · `8` · `12` · `16`. Bảng và khối dùng `8`; thẻ dùng `12`; chip và ô `<kbd>` dùng `6` hoặc `4`.

Không thêm màu, không thêm font, không thêm cỡ chữ ngoài danh sách trên.

---

## 3. Thanh điều hướng — 6 mục, cố định trên web, thanh dưới cố định trên mobile

Thanh gồm 6 mục: `Bảng điều khiển` · `Soạn bài` · `Lịch đăng` · `Hàng đợi` · `Kênh` · `Cài đặt`.

Tô đậm đúng mục theo bảng sau (đây là quyết định đã chốt, không mở lại):

| Màn | Mục tô đậm |
|---|---|
| 1 · Bảng điều khiển · Web | `Bảng điều khiển` |
| 2 · Hàng đợi · Web | `Hàng đợi` |
| 3 · Bảng điều khiển · Điện thoại | `Bảng điều khiển` |
| 4 · Soạn bài · Web | `Soạn bài` |
| 5 · Duyệt bài · Web | `Soạn bài` |
| 6 · Soạn bài · Điện thoại | `Soạn bài` |
| 7 · Lịch đăng · Web | `Lịch đăng` |
| 8 · Chiến dịch · Web | `Lịch đăng` |
| 9 · Kho nội dung · Web | `Soạn bài` |
| 10 · Kênh · Web | `Kênh` |
| 11 · Kênh · Lỗi đăng bài · Web | `Hàng đợi` |
| 12 · Cài đặt · Web | `Cài đặt` |
| 13 · Báo cáo · Web | `Bảng điều khiển` |
| 14 · Báo cáo · Điện thoại | `Bảng điều khiển` |

Màn 3 và màn 6 dùng thanh dưới cố định (bottom nav) kiểu màn mobile, 6 mục, mục tương ứng tô đậm. Trên web thanh ở trên, cao ~56px, chữ `ap-fg-2` thường, mục đang chọn chữ `ap-accent-ink` đậm `700`.

---

## 4. Danh sách màn — nội dung bắt buộc (chép từ PEN-DATA-PACK)

### Màn 1 · Bảng điều khiển · Web (1440)

Tiêu đề trang: `Bảng điều khiển`.

**Khối 1 — Số liệu hôm nay (hàng 4 chip lớn):** bốn ô to, mỗi ô 1 con số lớn `40` (40px, `ap-fg`) + nhãn meta `14` in hoa. Bốn con số:

- `56` — nhãn `Đã đăng hôm nay`
- `10` — nhãn `Đang chờ`
- `3` — nhãn `Lỗi` (tô `ap-err`)
- `3` — nhãn `Chờ duyệt` (tô `ap-warn`)

**Khối 2 — Số liệu phụ (hàng 3 chip nhỏ hơn, cỡ 26):**
- `56` — nhãn `TỔNG BÀI`
- `81%` — nhãn `THÀNH CÔNG`
- `$2.00` — nhãn `CHI PHÍ X DỰ KIẾN`
- `56/69` — nhãn `THỰC THI`

**Khối 3 — Trạng thái sức khoẻ từng kênh:** bảng 8 dòng (1 cột tên + 1 cột trạng thái + 1 cột token):
| Kênh | Trạng thái | Ghi chú |
|---|---|---|
| Facebook Page | `Hợp lệ` | `không ngày hết hạn` |
| Instagram | `Hết hạn` | `hết hạn 2026-10-20` |
| Threads | `Hợp lệ` | `5/250 hôm nay` |
| LinkedIn | `Hợp lệ` | `9/150 hôm nay` |
| X | `Hợp lệ` | `10/960 hôm nay` |
| TikTok | `Chưa audit` | `chỉ đăng private` |
| Telegram | `Hợp lệ` | `4/30 msg/s` |
| Zalo OA | `Hết hạn` | `2/1 hôm nay` |

- **Khối 4 — Hàng đợi sắp tới (bảng nhỏ 3 dòng):** `14:30` · `P06 X daily: insight công nghệ` · `[X] · Lỗi`; `11:30` · `P03 Hướng dẫn chạy YouTube Short` · `[YouTube] · Đang chờ`; `15:30` · `P11 X post có link: tính phí $0.20` · `[X] · Đang chờ`.

**Khối 5 — Cảnh báo token sắp hết (khung `ap-warn-soft`, viền `ap-warn`):** `Cảnh báo token sắp hết hạn: zalo_oa_broadcast_token hết 2026-10-15 (2 ngày)`; dòng 2: `instagram_content_publish_token hết 2026-10-20 (7 ngày)`.

- **Khối 6 — Lỗi hôm nay (khung `ap-err-soft`):** `3 lỗi hôm nay: 1 Facebook Group không API, 1 X rate limit, 1 TikTok chưa audit.` Nút `Xem chi tiết` bên phải.

### Màn 2 · Hàng đợi · Web (1440)

Tiêu đề trang: `Hàng đợi`.

**Thanh lọc:** chip lọc theo trạng thái — `Tất cả` · `Đã đăng` · `Đang chờ` · `Chờ duyệt` · `Lỗi` (5 chip, `ap-sunken` nền, mục đang chọn `ap-accent` chữ `ap-accent-ink`).

**Bảng bài lên lịch** (12 dòng, cột: `Giờ` · `Mã` · `Tiêu đề` · `Kênh đích` · `Trạng thái` · `Thao tác`):

| Giờ | Mã | Tiêu đề | Kênh đích | Trạng thái |
|---|---|---|---|---|
| 08:30 | P01 | 5 mẹo tăng tương tác Facebook Page | Facebook Page | `Đã đăng` (ok) |
| 09:00 | P02 | Zalo OA: gửi 1 broadcast mỗi ngày là đủ | Zalo OA | `Đã đăng` (ok) |
| 09:00 | P10 | Facebook Group: cách đăng thủ công | Facebook Group | `Lỗi` (err) |
| 11:30 | P03 | Hướng dẫn chạy YouTube Short | YouTube | `Đang chờ` (ok) |
| 14:30 | P06 | X daily: insight công nghệ | X | `Lỗi` (err) |
| 15:30 | P11 | X post có link: tính phí $0.20 | X | `Đang chờ` (ok) |
| 14:00 | P05 | Threads post: kể chuyện trong 500 ký tự | Threads | `Chờ duyệt` (ok) |
| 16:00 | P07 | Instagram Reels: quay và đăng | Instagram | `Đang chờ` (ok) |
| 17:00 | P08 | TikTok MEDIA_UPLOAD: draft đầu tiên | TikTok | `Lỗi` (err) |
| 13:00 | P04 | Mẫu content LinkedIn cho B2B | LinkedIn | `Chờ duyệt` (ok) |
| 10:00 | P12 | Zalo OA chăm sóc: tin tư vấn | Zalo OA | `Chờ duyệt` (ok) |
| 18:00 | P09 | Telegram: kênh thông báo nội bộ | Telegram | `Đã đăng` (ok) |

**Cột thao tác:** nút `Xem trước` · nút `Duyệt` (với bài Chờ duyệt) · nút `Sửa`.

### Màn 3 · Bảng điều khiển · Điện thoại (390)

Bản dọc khổ 390, nội dung y hệt màn 1 (đủ 4 chip số liệu hôm nay + trạng thái 8 kênh dạng danh sách cuộn, hàng đợi sắp tới, cảnh báo token) nhưng **dồn một cột**, **thanh dưới cố định 6 mục** (`Bảng điều khiển` tô đậm).

### Màn 4 · Soạn bài · Web (1440)

Tiêu đề trang: `Soạn bài`.

**Thanh trên:** nút `+ Bài mới` · ô tìm `Tìm bài trong kho…` · nút `Kho nội dung`.

**Khung soạn 2 cột:**
- Cột trái (rộng ~700): tiêu đề bài (`Tiêu đề bài viết…`), vùng nội dung (`Nội dung gốc…`), vùng đếm ký tự tổng: `0 / 4096 ký tự (Telegram)`.
- Cột phải: danh sách **8 kênh đích** mỗi kênh 1 ô bật/tắt (`Facebook Page`, `Instagram`, `Threads`, `LinkedIn`, `X`, `TikTok`, `Telegram`, `Zalo OA`), mỗi ô có **đếm ký tự theo giới hạn kênh**: `240 / 500` (Threads), `180 / 280` (X), `600 / 4096` (Telegram), `300 / 2200` (Instagram), `24000 / 63206` (Facebook Page), `120 / 3000` (LinkedIn), `20 / 5` (số link / tối đa 5 link), `0 / 4 free` (Zalo OA broadcast). Cảnh báo vượt giới hạn: nền `ap-err-soft`, chữ `ap-err` nếu vượt.

**Khối Xem trước theo kênh (bên dưới, 8 biến thể):** 8 thẻ nhỏ cạnh nhau, mỗi thẻ 1 kênh + nội dung đã cắt theo trần (chỗ bị cắt hiện rõ `… (cắt, còn N ký tự)`). Ví dụ Threads: nội dung rút xuống 500 ký tự, còn dư hiển thị `còn 120 ký tự`; X: `cắt, còn 40 ký tự`.

**Thanh dưới soạn:** `Lưu nháp` · `Lên lịch` · `Gửi duyệt`.

### Màn 5 · Duyệt bài · Web (1440)

Tiêu đề trang: `Duyệt bài`.

**Dòng meta:** `Hàng đợi chờ duyệt: 3 bài` (số to `3`).

**Bảng chờ duyệt (3 dòng):**
| Mã | Người soạn | Tiêu đề | Nội dung (ngắn) | Kênh | Hành động |
|---|---|---|---|---|---|
| P04 | An | Mẫu content LinkedIn cho B2B | `5 bài học sau 3 tháng đăng LinkedIn đều đặn…` | LinkedIn | `Duyệt` / `Trả lại` |
| P05 | Lan | Threads post: kể chuyện trong 500 ký tự | `Hôm nay mình test Threads API…` | Threads | `Duyệt` / `Trả lại` |
| P12 | Hùng | Zalo OA chăm sóc: tin tư vấn | `Xin chào, bạn cần tư vấn gói Zalo OA nào…` | Zalo OA | `Duyệt` / `Trả lại` |

**Khối `Trả lại`:** input chọn lý do (`Nội dung sai số liệu`, `Vượt trần kênh`, `Ngôn ngữ`, `Khác…`) + input `Ghi lý do…`. Nút `Gửi lại cho người soạn`.

### Màn 6 · Soạn bài · Điện thoại (390)

Cùng nội dung màn 4, dồn 1 cột: tiêu đề + nội dung + đếm ký tự tổng; danh sách kênh đích thành **danh sách toggle** cuộn; khối xem trước xuống dưới dạng **tab 1 hàng ngang** (8 tab kênh, cuộn ngang), mỗi tab hiện biến thể đã cắt. **Thanh dưới cố định 6 mục** (`Soạn bài` tô đậm), cao ≥44px.

### Màn 7 · Lịch đăng · Web (1440)

Tiêu đề trang: `Lịch đăng`.

**Tiêu đề tháng:** `Tháng 10, 2026` · mũi tên trái/phải.

**Lịch tháng:** lưới 31 ô ngày. Mỗi ô có **chấm màu** theo trạng thái và **số bài**: chấm xanh (ok) nếu tất cả đã đăng, chấm cam (warn) nếu có bài đang chờ, chấm đỏ (err) nếu có lỗi, chấm xám nếu rỗng. Số bài in `14` nhỏ ở góc ô.
- Ví dụ ngày 13: `13` + chấm xanh, ghi chú `56 đã đăng · 3 lỗi`.
- Ngày 14: `14` + chấm cam, ghi `6 bài lên lịch · 3 chờ duyệt`.

**Dưới lịch — lịch tuần tới (dạng timeline 7 cột):** giờ | tiêu đề | kênh | trạng thái.

### Màn 8 · Chiến dịch · Web (1440)

Tiêu đề trang: `Chiến dịch`.

- **Thanh:** `+ Chiến dịch mới` · `Xem tất cả` (5) · `Đang chạy` (4) · `Đã xong` (1).

**Danh sách 5 chiến dịch** (mỗi chiến dịch 1 khối card):
1. `Q4 — LinkedIn + Facebook Page` — `28 / 40 đã đăng` · `70%` (thanh tiến độ) · kênh `LinkedIn · Facebook Page`
2. `Zalo OA chăm sóc khách hàng` — `25 / 30 đã đăng` · `83%` · kênh `Zalo OA`
3. `TikTok thử nghiệm MEDIA_UPLOAD` — `12 / 20 đã đăng` · `60%` · kênh `TikTok`
4. `Bản tin tuần — Telegram` — `11 / 12 đã đăng` · `92%` (khung `ap-ok-soft`) · kênh `Telegram`
5. `X — Insights hàng ngày` — `5 / 25 đã đăng` · `20%` · kênh `X` · ghi chú `$420/tháng`

### Màn 9 · Kho nội dung · Web (1440)

Tiêu đề trang: `Kho nội dung`.

**Thanh lọc theo nhóm khách hàng:** `Tất cả` · `Công nghệ` · `Design/UI` · `API/Dev` · `Compliance` · `Sales` · `Marketing` · `DevOps` (8 chip).

**Danh sách 8 mẫu** (mỗi mẫu 1 dòng bảng):
| Mã | Tên mẫu | Nhóm | Kênh chủ lực | Biến thể |
|---|---|---|---|---|
| T01 | So sánh AI: danh tính vs giá trị | Công nghệ | LinkedIn, X | 4 |
| T02 | 5 lý do chọn Be Vietnam Pro | Design/UI | Facebook Page, Instagram | 3 |
| T03 | Xử lý BUC limit của Meta | API/Dev | LinkedIn | 2 |
| T04 | Checklist duyệt bài trên Threads (≤5 link) | Compliance | Threads | 2 |
| T05 | Mẫu chào hàng Zalo OA | Sales | Zalo OA | 3 |
| T06 | Kịch bản đăng X (280 ký tự) | Marketing | X | 5 |
| T07 | Đăng Reels lên Instagram — quy trình | Content | Instagram | 4 |
| T08 | Hướng dẫn chạy YouTube upload | DevOps | YouTube | 3 |

### Màn 10 · Kênh · Web (1440)

Tiêu đề trang: `Kênh`.

**Bảng kết nối 8 kênh** (cột: `Tên` · `Loại` · `Trần / ngày` · `Token` · `Đã dùng hôm nay` · `Nút`):

| Tên | Loại | Trần / ngày | Token | Đã dùng hôm nay | Nút |
|---|---|---|---|---|---|
| Facebook Page | Graph API v26.0 | BUC 4800 × engaged users /24h | `fb_page_tok…` (Hợp lệ) | 18/4800* | `Kết nối lại` |
| Instagram | Content Publishing | 100 /24h | `ig_pub_tok…` (Hết hạn) | 7/100 | `Kết nối lại` |
| Threads | Threads API | 250 /24h | `th_tok…` (Hợp lệ) | 5/250 | `Kết nối lại` |
| LinkedIn | Share on LinkedIn | ~150 /ngày | `li_tok…` (Hợp lệ) | 9/150 | `Kết nối lại` |
| X | API v2 PPU | ~960 /ngày | `x_ppu_tok…` (Hợp lệ) | 10/960 | `Kết nối lại` |
| TikTok | Content Posting | 6 req/phút | `tt_tok…` (Chưa audit) | 1/6 | `Kết nối lại` |
| Telegram | Bot API v10.3 | 30 msg/s | `tg_bot_tok…` (Hợp lệ) | 4/30 | `Kết nối lại` |
| Zalo OA | OpenAPI v3.0 | 1 broadcast/người | `zalo_oa…` (Hết hạn) | 2/1 | `Kết nối lại` |

*Trần Facebook Page phụ thuộc engaged users nên hiển thị `18/4800*` kèm dấu `*`.

### Màn 11 · Kênh · Lỗi đăng bài · Web (1440)

Tiêu đề trang: `Chi tiết lỗi: P06 — X daily: insight công nghệ`.

**Khối 1 — Thông tin bài:** Mã `P06` · Tiêu đề `X daily: insight công nghệ` · Kênh đích `X` · Giờ đăng dự kiến `14:30 · 2026-10-13` · Người soạn `An`.

**Khối 2 — Mã lỗi (font `$ap-mono`, nền `ap-code-bg`, chữ `ap-code-fg`):** `rate_limit_exceeded`

**Khối 3 — Thông báo thật (tiếng Anh, nguyên văn):** `Rate limit exceeded. Please retry after the reset window.`

**Khối 4 — Diễn giải (tiếng Việt):** `Trần API của kênh đã đạt (rate limit exceeded). Hẹn lại khung giờ thấp điểm.`

**Khối 5 — Lịch sử thử:** bảng `Lần` · `Thời điểm` · `Thời gian chờ` · `Kết quả`:
| Lần | Thời điểm | Thời gian chờ | Kết quả |
|---|---|---|---|
| 1/3 | 14:31 | — | `Thất bại` (err) |
| 2/3 | 14:36 | 5 phút | `Thất bại` (err) |
| 3/3 | 14:51 | 15 phút | `Thất bại` (err) |

**Khối 6 — Hành động (2 nút):** `Thử lại` (nút chính, `ap-accent`) · `Bỏ qua` (`ap-line` viền, chữ `ap-fg-3`).

### Màn 12 · Cài đặt · Web (1440)

Tiêu đề trang: `Cài đặt`.

**Danh sách 6 mục cài đặt**, mỗi mục là một khối có tiêu đề + các dòng cấu hình:

**6.1 Rate limit theo kênh** — các dòng: `Threads: 250 bài /24h (giới hạn cứng)` · `Instagram: 100 bài /24h (50 carousel /24h)` · `Facebook Page: tự động theo BUC (4800 × engaged users)` · `Zalo OA: 1 broadcast /ngày /người nhận` · `X: 100 req /15 phút` · `TikTok: 6 req /phút/token` · `Telegram: 30 msg/s (không áp dụng)` · `YouTube: 100 upload /ngày`.

**6.2 Khung giờ vàng** — `Zalo OA: 6h00–19h59 (bắt buộc)` · `Chung: 9h00–12h00 · 14h00–17h00 · 19h00–21h00` · checkbox `Ưu tiên khung giờ thấp điểm cho Facebook Page`.

**6.3 Retry** — `Số lần thử tối đa: 3` · `Backoff: 1 phút · 5 phút · 15 phút` · `Tự động dời sang khung giờ trống` · `Bỏ qua vĩnh viễn: FACEBOOK_GROUP_API_DEPRECATED`.

**6.4 YouTube** — `Auto-publish: công khai (nếu Google Cloud project đã verify)` · `Nếu chưa verify → giữ private`.

**6.5 Phân quyền** — `Admin — toàn quyền` · `Duyệt — duyệt/trả lại, xem báo cáo` · `Soạn — viết, lên lịch, xem báo cáo` · `Khách hàng — chỉ xem bảng điều khiển`.

**6.6 Cảnh báo token** — `Zalo OA: cảnh báo khi còn 3 broadcast free/tháng` · `Threads/X/Telegram/Instagram: cảnh báo token sắp hết` · `Facebook Page: không cảnh báo (không ngày hết hạn, nhắc khi đổi password)`.

### Màn 13 · Báo cáo · Web (1440)

Tiêu đề trang: `Báo cáo`.

- **Dòng meta:** `2026-10-13 · 56 đã đăng · 3 lỗi · 81% thành công`.

**Khối 1 — Theo kênh (bảng):**
| Kênh | Đã đăng | Đang chờ | Lỗi |
|---|---|---|---|
| Facebook Page | 18 | 2 | 0 |
| X (Twitter) | 10 | 3 | 1 |
| LinkedIn | 9 | 1 | 0 |
| Instagram | 7 | 2 | 0 |
| Threads | 5 | 1 | 0 |
| Telegram | 4 | 0 | 0 |
| Zalo OA | 2 | 1 | 0 |
| Facebook Group (chỉ automation) | 0 | 0 | 1 |
| TikTok | 1 | 0 | 1 |

**Khối 2 — Theo chiến dịch (bảng):**
| Chiến dịch | Đã đăng / Tổng | % |
|---|---|---|
| Q4 — LinkedIn + Facebook Page | 28 / 40 | 70% |
| Zalo OA chăm sóc khách hàng | 25 / 30 | 83% |
| TikTok thử nghiệm MEDIA_UPLOAD | 12 / 20 | 60% |
| Bản tin tuần — Telegram | 11 / 12 | 92% |
| X — Insights hàng ngày | 5 / 25 | 20% |

**Khối 3 — Token sắp hết (danh sách cảnh báo):**
- `zalo_oa_broadcast_token — Hết hạn 2026-10-15 (2 ngày)`
- `instagram_content_publish_token — Hết hạn 2026-10-20 (7 ngày)`
- `facebook_page_access_token_1 — Không ngày hết hạn`

### Màn 14 · Báo cáo · Điện thoại (390)

Bản dọc khổ 390, nội dung y hệt màn 13 nhưng **dồn một cột**, các bảng chuyển thành **dạng thẻ** (mỗi dòng 1 thẻ), bảng Theo kênh xuống dạng `kênh — đã đăng/đang chờ/lỗi` mỗi thẻ 1 dòng. **Thanh dưới cố định 6 mục** (`Bảng điều khiển` tô đậm).

---

## 5. Sáng tạo: được và không được

**Được, và khuyến khích:** tự quyết bố cục, phân cấp chữ, nhịp khoảng trắng, cách thể hiện trạng thái (chip, chấm màu, thanh tiến độ), cách chia cột cho bảng dài. Ví dụ: tấm lịch tháng chia 2 cột, bảng kênh rút gọn token còn `…` 14 ký tự.

**Không được:** sáng tạo **dữ liệu**. Cụ thể:

- Không tự đặt tên bài, không tự viết thêm nội dung bài, không thêm kênh, không thêm chiến dịch ngoài pack.
- Không tự đặt mã lỗi. Chỉ dùng 7 mã trong mục 2 của pack. Không thêm mã nào khác.
- Không đổi số trần/ngày ngoài mục 0 của pack (Threads 500, X 280, Zalo OA 1 broadcast/ngày… giữ nguyên).
- Không rút gọn danh sách. 8 kênh là 8, 12 bài là 12, 5 chiến dịch là 5, 8 mẫu là 8.
- Không thêm màu hoặc font ngoài mục 2.
- Không vẽ biến thể thứ hai của bất kỳ màn nào.

Đây là app vận hành nội bộ cho sales. Mỗi màn phải trả lời được "bây giờ tôi làm gì tiếp" trong 3 giây.

---

## 6. Quy ước đặt tên node (bắt buộc, để đếm được)

Trước khi vẽ, chốt cách đặt `name` cho node lá. Script kiểm ở mục 7 đếm theo `name`, nên tên phải theo đúng quy ước. Tiền tố dưới đây **chưa được dùng ở bất kỳ frame nào khác trên canvas** — dùng đúng chúng.

Chọn tiền tố:

- Màn 1, 3 (dashboard): `Dash <n>` — mỗi thẻ số 1 node, mỗi dòng trạng thái 1 node → tổng kỳ vọng `≥ 40`.
- Màn 2 (hàng đợi): `Queue <n>` — mỗi dòng bài 1 node, mỗi chip lọc 1 node → kỳ vọng `≥ 17`.
- Màn 4 (soạn): `Post <n>` — mỗi ô kênh + mỗi thẻ xem trước 1 node → kỳ vọng `≥ 20`.
- Màn 5 (duyệt): `Review <n>` — mỗi dòng chờ duyệt 1 node + mỗi lý do 1 node → kỳ vọng `≥ 6`.
- Màn 7 (lịch): `Cal <n>` — mỗi ô ngày 1 node (`Cal 1`…`Cal 31`) → kỳ vọng `31`.
- Màn 8 (chiến dịch): `Campaign <n>` — mỗi chiến dịch 1 node → kỳ vọng `5`.
- Màn 9 (kho): `Template <n>` — mỗi mẫu 1 node → kỳ vọng `8`.
- Màn 10 (kênh): `Channel <n>` — mỗi dòng kênh 1 node → kỳ vọng `8`.
- Màn 11 (lỗi): `ChannelErr <n>` — mỗi khối thông tin lỗi 1 node → kỳ vọng `≥ 6`.
- Màn 12 (cài đặt): `Setting <n>` — mỗi dòng cấu hình 1 node → kỳ vọng `≥ 30`.
- Màn 13, 14 (báo cáo): `Report <n>` — mỗi dòng bảng 1 node → kỳ vọng `≥ 20`.

---

## 7. Vòng làm cho MỖI màn (bắt buộc, không bỏ bước)

1. Dựng màn, `placeholder: true`. Mỗi node phải có `name` theo mục 6.
2. Chạy script kiểm dưới đây cho màn đó. Phải đạt `ph 0`, `problems 0`, `lt14` chỉ gồm nhãn meta in hoa, `bad` rỗng, và số dòng theo prefix khớp kỳ vọng.
3. Chụp `TakeScreenshot([id])` rồi **xem ảnh**. Phải không có chữ tràn, không có khung sụp 0×0, không có chồng lấn.
4. Đặt `placeholder: false`, export PNG vào thư mục exports, rồi mới sang màn sau.

```js
// Chạy riêng cho từng màn, thay <id> bằng id màn đang làm
const id='<ID>';let ph=0,pr=0;const lt=[],bad=[],fonts=new Set(),vars=new Set();
const prefixes=['Dash','Queue','Post','Review','Cal','Campaign','Template','Channel','ChannelErr','Setting','Report'];
const counts={};
Get(id,(m,c)=>{if(m.placeholder)ph++;if(c.problems)pr++;
for(const k of ['fill','color','stroke']){const v=m[k];if(typeof v==='string'&&v[0]==='$')vars.add(v.split('-')[0]);}
if(m.type==='text'){const s=String(m.content);if(m.fontFamily)fonts.add(String(m.fontFamily));
if(typeof m.fontSize==='number'&&m.fontSize<14&&s.trim()&&s!==s.toUpperCase())lt.push(s.slice(0,30));
if(/Lorem|TODO|placeholder|Bản mẫu|Ví dụ minh hoạ|Chưa có nội dung|Nội dung sẽ cập nhật|\bXXX\b/.test(s))bad.push(s.slice(0,40));}
for(const p of prefixes){if(m.name&&String(m.name).indexOf(p+' ')==0)counts[p]=(counts[p]||0)+1;}});
Print(id,'ph',ph,'problems',pr,'lt14',lt.length,lt.join(' / '),'| fonts',[...fonts].join(','),'| vars',[...vars].join(','),'| bad',bad.join(' / '));
Print('row counts',JSON.stringify(counts));
```

- Kỳ vọng (chạy cho cả `AutoPost · Bộ màn chuẩn` sau khi xong từng màn, in ra để đối chiếu):

```js
const sums={};
 Get('AutoPost · Bộ màn chuẩn',(m,c)=>{
 for(const p of ['Dash','Queue','Post','Review','Cal','Campaign','Template','Channel','ChannelErr','Setting','Report']){
  if(m.name&&String(m.name).indexOf(p+' ')==0)sums[p]=(sums[p]||0)+1;}});
Print('TOTAL row counts',JSON.stringify(sums));
```

Kỳ vọng TOTAL: `{"Dash":≥40,"Queue":≥17,"Post":≥20,"Review":≥6,"Cal":31,"Campaign":5,"Template":8,"Channel":8,"ChannelErr":≥6,"Setting":≥30,"Report":≥20}`.

Phát hiện token bị hardcode: tất cả biến phải thuộc bộ `ap-*` (Print ra `vars`; nếu thấy `hcp-` hay hex hardcode thì sửa lại dùng token).

---

## 8. Báo cáo cuối (chỉ gửi khi 14/14 đạt)

Bảng 14 dòng: id → tên màn → kết quả script (`ph` / `problems` / `lt14` / `bad` / row counts) → số dòng kiểm → đường dẫn PNG.

- Xác nhận 5 hàng mới nằm trong frame `AutoPost · Bộ màn chuẩn`, tên và id hàng.

Mục "Đã chọn khi không chắc": mỗi dòng một quyết định và lý do. Không có thì ghi "không có".
