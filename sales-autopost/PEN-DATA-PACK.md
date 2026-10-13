# PEN-DATA-PACK — AutoPost (tool đăng tin tự động đa nền tảng)

> **⚠️ DỮ LIỆU MẪU** — toàn bộ nội dung dưới đây do người viết spec tự tạo (tên bài, tiêu đề, nội dung bài, số liệu báo cáo, mã lỗi tổng hợp, tên chiến dịch). Chỉ các cột **loại API, trần/ngày, điều kiện, chi phí, khung giờ** trong mục **0 (kênh)** là trích chính xác từ `RESEARCH.md`. Tool chưa được code, nên đây KHÔNG PHẢI dữ liệu thật từ hệ thống. Mọi chữ có nội dung dùng trên UI đều chép nguyên văn từ pack này; không chữ nào ngoài pack được vẽ vào canvas.

---

## 0. Kênh (8 mẫu) — trần/ngày lấy từ RESEARCH.md

| STT | Tên kênh | Loại / API | Trần / ngày | Duyệt | Chi phí | Ghi chú | Nguồn |
|---|---|---|---|---|---|---|---|
| 1 | Facebook Page | Graph API v26.0 | BUC `4800 × engaged users` /24h (Page/system-user token) | App Review `pages_manage_posts`; Business Verification nếu chạm dữ liệu Page bên thứ ba; PPA nếu Page thuộc diện PPA | Free | **Trục chính**; token không ngày hết hạn | §1.1 |
| 2 | Instagram (Business) | Content Publishing | **100 /24h** (50 /24h carousel) | App Review; `instagram_content_publish`; IG phải nối Page | Free | Content phải host trên public server | §1.2 |
| 3 | Threads | Threads API | **250 /24h** (hard cap); carousel = 1 bài | App Review với Threads use case (app id/secret riêng) | Free | text ≤500 ký tự; ≤5 link/bài từ 22/12/2025 | §1.3 |
| 4 | LinkedIn (cá nhân) | Share on LinkedIn | ~**150 /member/ngày** (nguồn thứ cấp) | Open, light review: email doanh nghiệp + privacy policy, không screencast | Free | Dùng cho member feed | §2 |
| 5 | X (Twitter) | API v2 PPU | ~**960 /ngày** (member 100 req/15 phút) | Không cần; OAuth 2.0 | **$0.015/post** thường · **$0.200/post có link** | Bài có link đắt gấp 13×; $20 free credit + match tới $50 | §3 |
| 6 | TikTok | Content Posting API | **6 req/phút/token**; MEDIA_UPLOAD ≤5 pending shares/24h | **Audit → chưa duyệt: chỉ post private** (direct post 403) | Free | Bắt đầu bằng MEDIA_UPLOAD (nháp) | §4 |
| 7 | Telegram | Bot API v10.3 | **30 msg/s**; 20 msg/phút/group | Không; bot phải là admin kênh có `can_post_messages` | Free | **Kênh phụ**; text ≤4096 ký tự | §5 |
| 8 | Zalo OA | OpenAPI v3.0 (`oa.zalo.me/v3.0`) | **1 broadcast /ngày /người nhận** · **4 free /tháng** · 30 tin truyền thông/tháng/OA | OA doanh nghiệp xác thực; Gói Cơ bản & Tiêu chuẩn KHÔNG có Broadcast (từ 01/06/2026) | Tư vấn 8 tin free/48h rồi 55đ/tin; Tiêu chuẩn 1.000.000đ/năm | Broadcast **chỉ 6h00–19h59**; không phải kênh volume | §6 |

**Quy tắc ký tự theo kênh (dùng cho khung soạn):** Threads **500**, X **280**, Telegram **4096**, Instagram text **2200**, Facebook Page text **63206**, Zalo OA broadcast text không giới hạn (chi phí tính theo tin tư vấn), LinkedIn post text **3000**, YouTube Shorts description không giới hạn.

---

## 1. Bài đăng mẫu (12 bài)

### Đã đăng (3 bài)

- **P01** — Tiêu đề: `5 mẹo tăng tương tác Facebook Page`
  - Nội dung gốc: `Page mới ít người biết? Thử ngay 5 mẹo nhỏ: đăng đúng khung giờ 9h–12h và 19h–21h, dùng ảnh thật thay vì stock, viết caption ngắn dưới 150 ký tự, trả lời comment trong 1 giờ đầu, và dùng Stories mỗi ngày. Kết quả: tăng reach tự nhiên mà không tốn quảng cáo.`
  - Kênh đích: `Facebook Page`
  - Giờ đăng: `08:30` — ngày 2026-10-13 — Kết quả: **1.240 reach · 87 reactions · 12 comments**
  - Token: `facebook_page_access_token_1` — trạng thái: **Hợp lệ (không hết hạn)**
- **P02** — Tiêu đề: `Zalo OA: gửi 1 broadcast mỗi ngày là đủ`
  - Nội dung gốc: `Nhắc nhở khách hàng đều đặn: thứ 2–thứ 6 gửi 1 broadcast vào 9h sáng. Mỗi tuần duy trì 5 broadcast, giữ gói 4 broadcast free/tháng bằng cách thay 1 broadcast miễn phí bằng 1 tin tư vấn. Khách hàng không bao giờ bị làm phiền vì mỗi người chỉ nhận 1 broadcast/ngày.`
  - Kênh đích: `Zalo OA`
  - Giờ đăng: `09:00` — ngày 2026-10-13 — Kết quả: **412 người nhận · 58 tin nhắn phản hồi**
  - Token: `zalo_oa_broadcast_token` — trạng thái: **Hết hạn — cần kết nối lại**
- **P09** — Tiêu đề: `Telegram: kênh thông báo nội bộ`
  - Nội dung gốc: `Thông báo: hệ thống AutoPost đã đăng 56 bài hôm nay, 52 thành công, 4 lỗi. Xem chi tiết trong hàng đợi.`
  - Kênh đích: `Telegram`
  - Giờ đăng: `18:00` — ngày 2026-10-13 — Kết quả: **3 kênh · 1.890 tin gửi thành công**
  - Token: `telegram_bot_token` — trạng thái: **Hợp lệ**

### Đang chờ (3 bài)

- **P03** — Tiêu đề: `Hướng dẫn chạy YouTube Short`
  - Nội dung gốc: `Cách quay và đăng YouTube Shorts: quay dọc ≤60 giây, title ≤100 ký tự, có #Shorts ở cuối. Lưu ý: Google Cloud project phải verified, nếu chưa video sẽ bị lưu private tới khi audit xong.`
  - Kênh đích: `YouTube`
  - Giờ đăng: `11:30` — ngày 2026-10-14
  - Token: `youtube_service_account` — trạng thái: **Hợp lệ (chưa verify — video sẽ private)**
- **P07** — Tiêu đề: `Instagram Reels: quay và đăng`
  - Nội dung gốc: `Quay Reels với điện thoại: góc thẳng, 3 giây đầu phải có hook, nhạc trending, hashtag 5–10 cái. Đăng bằng Content Publishing qua API để lên lịch.`
  - Kênh đích: `Instagram`
  - Giờ đăng: `16:00` — ngày 2026-10-14
  - Token: `instagram_content_publish_token` — trạng thái: **Hợp lệ**
- **P11** — Tiêu đề: `X post có link: tính phí $0.20`
  - Nội dung gốc: `Insight tuần này: tự làm hay mua aggregator? Bài viết phân tích chi phí Ayrshare $149/tháng so với Postiz self-host ~$5/tháng. Đọc đầy đủ: <https://example.com/postiz-vs-ayrshare>`
  - Kênh đích: `X`
  - Giờ đăng: `15:30` — ngày 2026-10-14 — Dự tính chi phí: **$0.20 (có link)**
  - Token: `x_api_ppu_token` — trạng thái: **Hợp lệ**

### Chờ duyệt (3 bài)

- **P04** — Tiêu đề: `Mẫu content LinkedIn cho B2B`
  - Nội dung gốc: `5 bài học sau 3 tháng đăng LinkedIn đều đặn: (1) kể chuyện cá nhân, (2) đưa số liệu cụ thể, (3) đăng ảnh thật, (4) reply comment bằng voice note, (5) consistency là chìa khóa. Bạn đã làm được bao nhiêu?`
  - Kênh đích: `LinkedIn`
  - Giờ đăng dự kiến: `13:00` — ngày 2026-10-14
  - Người soạn: `An`, người duyệt chờ: `Minh`
- **P05** — Tiêu đề: `Threads post: kể chuyện trong 500 ký tự`
  - Nội dung gốc: `Hôm nay mình test Threads API. Giới hạn 500 ký tự khá ngắn, nhưng đủ để kể 1 câu chuyện nhỏ: thử thách lớn nhất là ≤5 link/bài, nếu vượt sẽ lỗi THREADS_API__LINK_LIMIT_EXCEEDED. Bài này có 3 link nên an toàn.`
  - Kênh đích: `Threads` — **Lỗi dự kiến: `THREADS_API__LINK_LIMIT_EXCEEDED`**
  - Giờ đăng dự kiến: `14:00` — ngày 2026-10-14
  - Người soạn: `Lan`, người duyệt chờ: `Minh`
- **P12** — Tiêu đề: `Zalo OA chăm sóc: tin tư vấn`
  - Nội dung gốc: `Xin chào, bạn cần tư vấn gói Zalo OA nào? Gói Cơ bản, Tiêu chuẩn hay Toàn diện? Trả lời mình nhé để mình hỗ trợ setup.`
  - Kênh đích: `Zalo OA`
  - Giờ đăng dự kiến: `10:00` — ngày 2026-10-14
  - Người soạn: `Hùng`, người duyệt chờ: `Minh`

### Lỗi (3 bài)

- **P06** — Tiêu đề: `X daily: insight công nghệ`
  - Nội dung gốc: `X daily: API v2 PPU giờ đây là mặc định cho dev mới. Subscription tier cũ Free/Basic/Pro đã deprecated. 100 req/15 phút = ~960 bài/ngày.`
  - Kênh đích: `X`
  - Giờ đăng dự kiến: `14:30` — ngày 2026-10-13
  - Lần thử: **3** — Mã lỗi: `rate_limit_exceeded` — Nguyên văn: `Rate limit exceeded. Please retry after the reset window.`
- **P08** — Tiêu đề: `TikTok MEDIA_UPLOAD: draft đầu tiên`
  - Nội dung gốc: `Video ngắn 30 giây về xu hướng thiết kế 2026. Upload qua MEDIA_UPLOAD để tạo draft, sau đó hoàn tất trong app.`
  - Kênh đích: `TikTok`
  - Giờ đăng dự kiến: `17:00` — ngày 2026-10-13
  - Lần thử: **2** — Mã lỗi: `unaudited_client_can_only_post_to_private_accounts` — Nguyên văn: `unaudited_client_can_only_post_to_private_accounts: this client can only post to private accounts.`
- **P10** — Tiêu đề: `Facebook Group: cách đăng thủ công`
  - Nội dung gốc: `Hướng dẫn đăng tin vào Facebook Group: dùng browser automation, headful Chrome với proxy residential.`
  - Kênh đích: `Facebook Group`
  - Giờ đăng dự kiến: `09:00` — ngày 2026-10-13
  - Lần thử: **1** — Mã lỗi: `FACEBOOK_GROUP_API_DEPRECATED` — Nguyên văn: `publish_to_groups was removed in v19.0 (23/01/2024) and deleted 22/04/2024. No group posting API available.`

---

## 2. Mã lỗi (7 mã thật, lấy từ RESEARCH.md)

### 2.1 Threads
- **Mã:** `THREADS_API__LINK_LIMIT_EXCEEDED`
- **Nguyên văn (API):** `THREADS_API__LINK_LIMIT_EXCEEDED`
- **Thông báo hệ thống (tiếng Anh):** `Threads API: post exceeds the maximum number of links (5 links per post, effective 22/12/2025).`
- **Diễn giải (tiếng Việt):** Từ 22/12/2025 Threads API từ chối bài >5 link. Chỉ hiển thị link, không chèn URL rút gọn.
- **Nguyên nhân:** Bài P05 có 3 link thực tế — cảnh báo đúng, cần sửa trước khi duyệt.

### 2.2 TikTok — chưa audit
- **Mã:** `unaudited_client_can_only_post_to_private_accounts`
- **Nguyên văn (API):** `unaudited_client_can_only_post_to_private_accounts`
- **Thông báo hệ thống (tiếng Anh):** `This client can only post to private accounts.`
- **Diễn giải (tiếng Việt):** TikTok chưa hoàn tất audit: DIRECT_POST chỉ được đăng chế độ private (403). Giải pháp: chạy MEDIA_UPLOAD (nháp) song song làm audit.
- **Hành động:** Bỏ qua hoặc chuyển sang chế độ nháp; tự động công khai khi `privacy_level=PUBLIC_TO_EVERYONE` sau audit.

### 2.3 TikTok — spam risk
- **Mã:** `spam_risk_too_many_posts`
- **Nguyên văn (API):** `spam_risk_too_many_posts`
- **Thông báo hệ thống (tiếng Anh):** `Too many posts in a short period; request throttled due to spam risk.`
- **Diễn giải (tiếng Việt):** TikTok cap ẩn, gửi quá nhanh bị đánh dấu spam. Trần thực tế 6 req/phút/token.
- **Hành động:** Tự động giãn nhịp, backoff tăng dần, max 3 lần thử.

### 2.4 Rate limit chung (Meta BUC)
- **Mã:** `rate_limit_exceeded`
- **Nguyên văn (API):** `rate_limit_exceeded`
- **Thông báo hệ thống (tiếng Anh):** `Rate limit exceeded. Please wait before retrying.`
- **Diễn giải (tiếng Việt):** Trần API của kênh đã đạt (BUC exceeded cho Meta). Hẹn lại khung giờ thấp điểm.
- **Hành động:** Retry tự động, dời sang khung giờ trống.

### 2.5 Meta BUC 80001
- **Mã:** `META_BUC_EXCEEDED`
- **Nguyên văn (API):** `BUC exceeded (code 80001)`
- **Thông báo hệ thống (tiếng Anh):** `Facebook API: Business Usage Cap exceeded. The cap is 4800 × Number of Engaged Users per 24h and depends on your Page's engaged users, not a fixed number.`
- **Diễn giải (tiếng Việt):** Facebook Page vượt BUC; trần phụ thuộc vào engaged users nên không cố định. Page mới 0 engaged users có thể bị throttle.
- **Hành động:** Dừng đăng Facebook Page cho tới khi reset 24h; chuyển tải sang kênh khác.

### 2.6 YouTube — project chưa verify
- **Mã:** `UNVERIFIED_GOOGLE_CLOUD_PROJECT`
- **Nguyên văn (API):** `UNVERIFIED_GOOGLE_CLOUD_PROJECT`
- **Thông báo hệ thống (tiếng Anh):** `Google Cloud project is not verified. The video was saved as private; it becomes public only after project verification.`
- **Diễn giải (tiếng Việt):** YouTube upload cần Google Cloud project đã verified; project chưa verify → video bị lưu private tới khi audit.
- **Hành động:** Cảnh báo người soạn; tự động bật "giữ private" nếu project chưa verify.

### 2.7 Facebook Group — API chết
- **Mã:** `FACEBOOK_GROUP_API_DEPRECATED`
- **Nguyên văn (API):** `publish_to_groups was removed in v19.0 (23/01/2024) and deleted 22/04/2024 for all versions.`
- **Thông báo hệ thống (tiếng Anh):** `Facebook Group posting is not available: publish_to_groups was deprecated at v19.0 (23/01/2024) and removed 22/04/2024. No official API exists. Use browser automation at your own risk (ToS violation).`
- **Diễn giải (tiếng Việt):** Facebook Group không còn API hợp pháp. Chỉ dùng browser automation (Playwright headful + residential proxy) — rủi ro cao.
- **Hành động:** Tự động đánh dấu kênh "chỉ automation"; cảnh báo rủi ro ToS; không đưa vào lịch đăng tự động.

---

## 3. Chiến dịch (5 mẫu)

| STT | Tên chiến dịch | Mục tiêu bài | Đã đăng | Đang chờ | Đã xong | Trạng thái | Kênh tham gia |
|---|---|---|---|---|---|---|---|
| C01 | Q4 — LinkedIn + Facebook Page | 40 | 28 | 5 | 7 | Đang chạy | LinkedIn, Facebook Page |
| C02 | Zalo OA chăm sóc khách hàng | 30 | 25 | 3 | 2 | Đang chạy | Zalo OA |
| C03 | TikTok thử nghiệm MEDIA_UPLOAD | 20 | 12 | 4 | 4 | Đang chạy | TikTok |
| C04 | Bản tin tuần — Telegram | 12 | 11 | 0 | 1 | **Đã xong** | Telegram |
| C05 | X — Insights hàng ngày | 25 | 5 | 6 | 14 | Đang chạy | X |

### Chi tiết từng chiến dịch
- **C01 Q4 — LinkedIn + Facebook Page** (01/10–31/10/2026): bài B2B, 2 bài/tuần/linkedin, 3 bài/tuần/Facebook Page. Tỷ lệ hoàn thành: 70%.
- **C02 Zalo OA chăm sóc khách hàng** (01/10–31/10/2026): 1 broadcast/ngày trong khung 6h00–19h59. Tỷ lệ hoàn thành: 83%.
- **C03 TikTok thử nghiệm MEDIA_UPLOAD** (01/10–15/11/2026): đang làm audit, tạm dùng nháp. Tỷ lệ hoàn thành: 60%.
- **C04 Bản tin tuần — Telegram** (đã kết thúc 06/10/2026): 2 bài/tuần. Tỷ lệ hoàn thành: 92%.
- **C05 X — Insights hàng ngày** (10/09–31/10/2026): 1 bài/ngày ~$0.20 (có link). Ngân sách: $420/tháng. Tỷ lệ hoàn thành: 20%.

---

## 4. Kho nội dung (8 mẫu)

| STT | Tên mẫu | Nhóm khách hàng | Kênh chủ lực | Số biến thể | Ghi chú |
|---|---|---|---|---|---|
| T01 | So sánh AI: danh tính vs giá trị | Công nghệ | LinkedIn, X | 4 | Dùng icon `==` / `is` |
| T02 | 5 lý do chọn Be Vietnam Pro | Design/UI | Facebook Page, Instagram | 3 | Ảnh thật thương hiệu |
| T03 | Xử lý BUC limit của Meta | API/Dev | LinkedIn | 2 | Code block JetBrains Mono |
| T04 | Checklist duyệt bài trên Threads (≤5 link) | Compliance | Threads | 2 | Chip cảnh báo giới hạn |
| T05 | Mẫu chào hàng Zalo OA | Sales | Zalo OA | 3 | Theo quy chuẩn 8 tin free/48h |
| T06 | Kịch bản đăng X (280 ký tự) | Marketing | X | 5 | Template 4 dòng |
| T07 | Đăng Reels lên Instagram — quy trình | Content | Instagram | 4 | Checklist MEDIA_UPLOAD |
| T08 | Hướng dẫn chạy YouTube upload | DevOps | YouTube | 3 | Bước verify project |

Mỗi mẫu có 3 trường: **Tiêu đề**, **Nội dung gốc**, **Các biến thể theo kênh** (Threads ≤500, X ≤280, Zalo OA không giới hạn…). Tất cả chữ trong bảng trên đều là nhãn có sẵn, không viết thêm.

---

## 5. Số liệu báo cáo mẫu (hôm nay, 2026-10-13)

### Tổng quan
- **56 bài** đã đăng hôm nay · **10 đang chờ** · **3 lỗi** · **3 chờ duyệt**
- **Thành công hôm nay:** 56/69 bài thực thi (81%)
- **Lỗi:** 3 lỗi hôm nay: 1 Facebook Group không API · 1 X rate limit · 1 TikTok chưa audit
- **Chi phí X ước tính:** $2.00 cho 10 bài có link hôm nay (10 × $0.20)

### Theo kênh (số bài đã đăng hôm nay)
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

### Theo chiến dịch (tính đến 2026-10-13)
| Chiến dịch | Đã đăng / Tổng | % |
|---|---|---|
| Q4 — LinkedIn + Facebook Page | 28 / 40 | 70% |
| Zalo OA chăm sóc khách hàng | 25 / 30 | 83% |
| TikTok thử nghiệm MEDIA_UPLOAD | 12 / 20 | 60% |
| Bản tin tuần — Telegram | 11 / 12 | 92% |
| X — Insights hàng ngày | 5 / 25 | 20% |

### Token sắp hết hạn (cảnh báo)
- `zalo_oa_broadcast_token` — Hết hạn **2026-10-15** (2 ngày)
- `instagram_content_publish_token` — Hết hạn **2026-10-20** (7 ngày)
- `facebook_page_access_token_1` — Không ngày hết hạn (chỉ chết khi đổi password / revoke)

---

## 6. Cài đặt (6 mục mẫu)

### 6.1 Rate limit theo kênh
- `Threads`: **250 bài /24h** — giới hạn cứng (hard cap)
- `Instagram`: **100 bài /24h** (50 carousel /24h)
- `Facebook Page`: **Tự động theo BUC** — đọc `4800 × engaged users` từ Graph API, không set số cứng
- `Zalo OA`: **1 broadcast /ngày /người nhận** — tự động chia nhỏ lịch
- `X`: **100 req /15 phút**
- `TikTok`: **6 req /phút/token**
- `Telegram`: **30 msg/s** (không áp dụng giới hạn lịch)
- `YouTube`: **100 upload /ngày** (bucket riêng từ 2026)

### 6.2 Khung giờ vàng
- **Zalo OA:** **6h00–19h59** — bắt buộc (broadcast chỉ gửi trong khung này)
- **Chung (các kênh còn lại):** 9h00–12h00 · 14h00–17h00 · 19h00–21h00
- Tùy chọn: "Ưu tiên khung giờ thấp điểm cho Facebook Page (tránh BUC)".

### 6.3 Retry
- Số lần thử tối đa: **3**
- Backoff: **1 phút · 5 phút · 15 phút**
- Tự động dời sang khung giờ trống nếu vẫn lỗi.
- Bỏ qua vĩnh viễn nếu lỗi `FACEBOOK_GROUP_API_DEPRECATED`.

### 6.4 YouTube
- Auto-publish: **Công khai** nếu Google Cloud project đã verified; nếu chưa → **Private** (cảnh báo).

### 6.5 Phân quyền
- **Admin** — toàn quyền (view/edit/delete/approve/all settings)
- **Duyệt** — duyệt/trả lại bài, xem báo cáo
- **Soạn** — viết, lên lịch, xem trước
- **Khách hàng (chỉ xem)** — xem bảng điều khiển và báo cáo

### 6.6 Cảnh báo token
- Zalo OA: cảnh báo khi còn **3 broadcast free/tháng**.
- Threads / X / Telegram / Instagram: cảnh báo khi token sắp hết.

---

## 7. Nhãn thao tác chuẩn

Các nút và nhãn UI dưới đây dùng thống nhất cho toàn bộ bộ màn (dùng đúng văn bản này, không viết khác):

### Thao tác bài
- `+ Bài mới` · `Tìm bài trong kho…` · `Kho nội dung`
- `Xem trước` · `Sửa` · `Lưu nháp` · `Lên lịch` · `Gửi duyệt`
- `Duyệt` / `Trả lại`
- Lý do trả lại: `Nội dung sai số liệu` · `Vượt trần kênh` · `Ngôn ngữ` · `Khác…`
- `Gửi lại cho người soạn`
- `Thử lại` · `Bỏ qua`

### Kết nối & hiển thị
- `Kết nối lại` · `Xem chi tiết` · `Xem tất cả`
- `Trạng thái token` (Hợp lệ / Hết hạn / Chưa audit / Không ngày hết hạn)

### Lọc & sắp xếp
- `Tất cả` · `Đã đăng` · `Đang chờ` · `Chờ duyệt` · `Lỗi`
- `Đang chạy` · `Đã xong`
- `Tất cả`

### Nhóm khách hàng
- `Công nghệ` · `Design/UI` · `API/Dev` · `Compliance` · `Sales` · `Marketing` · `Content` · `DevOps`

### Trạng thái chip
- `Đã đăng` · `Đang chờ` · `Chờ duyệt` · `Lỗi` · `Hợp lệ` · `Hết hạn` · `Chưa audit` · `Không hết hạn`
