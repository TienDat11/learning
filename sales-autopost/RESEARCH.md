# Nghiên cứu kỹ thuật — tool đăng tin tự động cho team sales

**Ngày tra cứu: 2026-10-13.** Mục tiêu: 50–70 bài/ngày, nhiều nền tảng.
Nguồn: 5 nhánh nghiên cứu song song, ưu tiên tài liệu chính thức. Mọi con số dưới đây có URL ở mục cuối.

---

## 0. Kết luận trước, chi tiết sau

| Nền tảng | API đăng được? | Trần/ngày | Duyệt | Chi phí | Dùng cho sales VN? |
|---|---|---|---|---|---|
| Facebook Page | ✅ Graph API v26.0 | BUC `4800 × engaged users` calls | App Review + Business Verification + PPA | Free | **Có — trục chính** |
| Instagram (Business) | ✅ Content Publishing | **100/24h** (50 nếu carousel) | App Review, IG phải nối Page | Free | Có |
| Threads | ✅ Threads API | **250/24h** | App Review | Free | Có (text ≤500) |
| **Facebook Group** | ❌ **API đã chết 22/04/2024** | — | — | — | **Chỉ browser automation, rủi ro cao** |
| LinkedIn (cá nhân) | ✅ Share on LinkedIn | ~150/member/ngày (nguồn thứ cấp) | Duyệt nhẹ, free | Free | Có |
| LinkedIn (company page) | ✅ Community Management | Dev tier 100/member/ngày; Standard không giới hạn | **Vetting nặng: 3–6 tháng, dễ bị từ chối** | Không giá công khai | Cân nhắc |
| X (Twitter) | ✅ API v2 PPU | 100 req/15ph/user ⇒ ~960/ngày | Không cần | **$0.015/post thường · $0.20/post có link** | Có, nhưng tốn tiền |
| TikTok | ✅ Content Posting | 6 req/phút/token | **Audit → chưa duyệt chỉ post private** | Free | Chỉ sau audit |
| Telegram | ✅ Bot API v10.3 | 30 msg/s, 20 msg/phút/group | Không | Free | Có — kênh phụ |
| Zalo OA | ✅ OpenAPI v3.0 | **1 broadcast/ngày/người · 4 free/tháng** | OA doanh nghiệp xác thực | 55đ/tin tư vấn sau 8 tin free | **Có — nhưng trần rất thấp** |
| Zalo cá nhân | ❌ Không có API | — | — | — | Chỉ browser automation |
| YouTube | ✅ Data API v3 | **100 upload/ngày** (bucket riêng, 2026) | Google Cloud project phải verified | Free | Có (video) |
| Google Business Profile | ✅ Posts API | Không công bố | Business phải verified | Free | Có (local business) |

**Điểm chặn lớn nhất:** Facebook Groups — nơi sales VN đăng nhiều nhất — **không còn API hợp pháp**. `publish_to_groups` bị xoá 22/04/2024. Không có ngoại lệ.

---

## 1. Meta — Facebook Page, Instagram, Threads

Graph API hiện hành **v26.0** (29/07/2026, chưa có EOL).

### 1.1 Facebook Page — ĐĂNG ĐƯỢC

| Cột | Nội dung |
|---|---|
| Endpoint | `POST /{page-id}/feed` (`message`, `link`, `picture`, `published`, `scheduled_publish_time`) · `POST /{page-id}/photos` · `POST /{page-id}/videos` |
| Nội dung | text, link, ảnh, video; hẹn lịch 10 phút → 30 ngày |
| Rate limit | BUC với Page/system-user token: `4800 × Number of Engaged Users` calls/24h. 100 engaged users ⇒ 480.000 calls/ngày. Dùng user/app token rơi về Platform limit `200 × Users`/giờ — **quá thấp** |
| Duyệt | App Review cho `pages_manage_posts`; Business Verification nếu đụng dữ liệu Page bên thứ ba; Page Publishing Authorization nếu Page thuộc diện PPA |
| Token | Page access token **không có ngày hết hạn**; chết khi đổi password / revoke / gỡ app |
| Chi phí | Free |

**Rủi ro:** trần BUC phụ thuộc *số người tương tác*, không phải số Page. Page mới (0 engaged) có thể bị throttle; Meta không công bố sàn. 50–70 bài/ngày vẫn nằm trong tầm với Page bình thường.

### 1.2 Instagram — ĐĂNG ĐƯỢC, trần 100/24h

| Cột | Nội dung |
|---|---|
| Endpoint | `POST /{ig-user-id}/media` (container) → `POST /{ig-user-id}/media_publish`; video upload qua `rupload.facebook.com`; check quota `GET /{ig-user-id}/content_publishing_limit` |
| Nội dung | Ảnh (**chỉ JPEG**), video, Reels (`media_type=REELS`), Stories (`STORIES`), Carousel (≤10 item = 1 bài) |
| Rate limit | **100 bài/24h** bài thường · **50/24h** carousel. (Con số "25/24h" lưu truyền là **sai** — docs hiện hành ghi 100/50) |
| Duyệt | IG Professional nối với FB Page; quyền `instagram_content_publish` / `instagram_business_content_publish`; App Review |
| Rủi ro | Media phải host trên **public server** (Meta tự cURL file) → cần container polling `status_code` |

**Kết luận:** 100/ngày không đủ cho 50–70 bài **nếu chỉ IG**, nhưng đủ nếu chia tải cùng FB Page.

### 1.3 Threads — ĐĂNG ĐƯỢC, trần 250/24h

| Cột | Nội dung |
|---|---|
| Endpoint | `POST /{threads-user-id}/threads` → `/threads_publish`; quota `GET /{threads-user-id}/threads_publishing_limit` |
| Nội dung | text **≤500 ký tự**, ảnh, video ≤5 phút, carousel 2–20 item |
| Rate limit | **250 bài/24h** (hard cap), carousel = 1 bài |
| Duyệt | App Meta có Threads use case (app id/secret riêng); `threads_basic` + `threads_content_publish` |
| Rủi ro | 500 ký tự rất ngắn; **≤5 link/bài** (từ 22/12/2025, lỗi `THREADS_API__LINK_LIMIT_EXCEEDED`); không có Reels/Stories |

### 1.4 Facebook Group — KHÔNG ĐĂNG ĐƯỢC

- `publish_to_groups` **deprecate ở v19.0** (23/01/2024), **xoá 22/04/2024** cho mọi version. `groups_access_member_info` xoá cùng.
- Node `/{group-id}/feed` không còn trong Graph API Reference v26.0.
- Admin group cũng không install app lên Group được nữa.
- Các tool bên thứ ba "đăng group" đều là browser automation → vi phạm ToS.

---

## 2. LinkedIn

| | Share on LinkedIn (cá nhân) | Community Management (company page) |
|---|---|---|
| Endpoint | `POST https://api.linkedin.com/rest/posts?w_member_social=TRUE` | `POST https://api.linkedin.com/rest/posts` (`w_organization_social`) |
| Nội dung | text, ảnh, video, article, poll, đa ảnh | + document, celebration; carousel chỉ cho sponsored |
| Rate limit | ~**150 req/member/ngày**, 100k/app/ngày (nguồn thứ cấp — LinkedIn không công bố) | Dev tier: 500/app/24h + **100/member/24h**; Standard: không giới hạn |
| Duyệt | "Open, light review" — email doanh nghiệp + privacy policy, **không screencast** | Vetted: verify company page, screencast, test credentials. **4–8 tuần nếu mạnh, 3–6 tháng thường, có thể bị từ chối** |
| Chi phí | Free | Không giá công khai (partner program) |
| Rủi ro | 150/ngày là ceiling mờ | Marketing v202510 **sunset 2026-10-15** → phải migrate |

**Chốt:** dùng **Share on LinkedIn** cho member feed. Company page chỉ khi chấp nhận quy trình vetting nhiều tháng.

---

## 3. X (Twitter) — Pay-Per-Use

Các tier subscription cũ (Free/Basic $200/Pro $5000) **đã deprecated**, dev mới mặc định **PPU**.

| Hạng mục | Số |
|---|---|
| Endpoint | `POST https://api.x.com/2/tweets`; media `POST upload.twitter.com/1.1/media/upload.json` |
| Rate limit | App 10.000/24h · **member 100 req/15 phút** (≈960 bài/ngày/member) |
| Giá | **$0.015/post thường** · **$0.200/post có link** · +$0.005 media metadata |
| 70 bài/ngày | Plain: **≈$31.5/tháng**. Có link: **≈$420/tháng** |
| Duyệt | Không cần; OAuth 2.0; free credits $20 + match tới $50 |

**Cảnh báo:** bài có link đắt gấp **13×** bài thường. Sales gần như luôn có link → chi phí thật là con số $420.

---

## 4. TikTok — audit là cửa chặn

| | Chưa audit | Sau audit |
|---|---|---|
| DIRECT_POST công khai | ❌ 403 `unaudited_client_can_only_post_to_private_accounts` | ✅ `privacy_level=PUBLIC_TO_EVERYONE` |
| MEDIA_UPLOAD (nháp/inbox) | ✅ (user phải mở app hoàn tất) | ✅ |
| Endpoint | `POST https://open.tiktokapis.com/v2/post/publish/video/init/` + chunked PUT · Photo: `/v2/post/publish/content/init/` (≤35 ảnh) | |
| Rate limit | **6 req/phút/user token**; MEDIA_UPLOAD ≤5 pending shares/24h; caps ẩn `spam_risk_too_many_posts` | |
| Điều kiện | Business/Creator account; verify domain nếu `PULL_FROM_URL`; chạy `creator_info/query` pre-flight | |

**Chốt:** bắt đầu bằng MEDIA_UPLOAD (nháp) để chạy ngay, song song làm audit. Audit có thể mất vài tuần–vài tháng và bị từ chối.

---

## 5. Telegram

| Cột | Nội dung |
|---|---|
| API | Bot API **v10.3** (24/08/2026) |
| Endpoint | `sendMessage` · `sendPhoto` · `sendMediaGroup` (album) |
| Nội dung | text ≤4096 ký tự, link, ảnh ≤10MB, video/doc ≤50MB, sticker, live photo |
| Rate limit | **30 msg/s** tổng · **1 msg/s/cuộc chat** · **20 msg/phút/group** · Paid Broadcasts → 1000 msg/s (0.1 Star/msg vượt 30/s) |
| Duyệt | Không. Bot phải là **admin kênh** có `can_post_messages`; bot không tự thêm mình vào kênh |
| Chi phí | Free |

---

## 6. Zalo OA — trần rất thấp

| Cột | Nội dung |
|---|---|
| API | OA OpenAPI **v3.0** (`openapi.zalo.me/v3.0`) |
| Endpoint | Tin tư vấn `POST /v3.0/oa/message/cs` · Giao dịch `/message/transaction` · **Broadcast `/message/broadcast`** |
| Rate limit | **1 broadcast/ngày/người nhận** · **4 broadcast free/tháng** · **30 tin truyền thông/tháng/OA** · Tin tư vấn: 8 tin free trong 48h |
| Điều kiện | OA doanh nghiệp đã xác thực. **Gói Cơ bản & Tiêu chuẩn KHÔNG có Broadcast** (từ 01/06/2026) |
| Chi phí | Tư vấn: 8 tin free/48h rồi **55đ/tin**. Gói: Tiêu chuẩn 1.000.000đ/năm · Tăng trưởng 2.500.000đ/năm · Toàn diện 6.000.000đ/năm |
| Khung giờ | Broadcast chỉ 6h00–19h59 |

**Zalo cá nhân: KHÔNG có API chính thức.** Xác nhận. Chỉ OA.

**Chốt:** Zalo OA **không phải kênh volume**. 1 broadcast/ngày/người. Dùng làm kênh chăm sóc, không phải kênh đăng 50 bài.

---

## 7. YouTube

| Cột | Nội dung |
|---|---|
| API | Data API v3, `videos.insert` |
| Endpoint | `POST https://www.googleapis.com/upload/youtube/v3/videos` (resumable) |
| Rate limit | **Từ 2026: `videos.insert` có bucket riêng 100 calls/ngày, 1 unit/call → 100 upload/ngày.** Pool 10.000 units/ngày không còn tính upload. (Trước 06/2026: 1600 units/call ⇒ ~6 upload/ngày — **lỗi thời**) |
| Điều kiện | Google Cloud project phải verified; project chưa verify → video bị **private** tới khi audit |
| Shorts | Cùng endpoint, cùng quota, chỉ khác metadata (≤60s, dọc) |

---

## 8. Giải pháp trung gian (aggregator) — nên mua hay tự làm?

| Tên | Loại | Nền tảng | Giá @ 50–70 bài/ngày | Tự lo app review? | Self-host | License |
|---|---|---|---|---|---|---|
| **Ayrshare** | SaaS API | 13 mạng | $149/tháng (1 profile, unlimited post) · $299 (10 profile) | **Có** | Không | Proprietary |
| **Blotato** | SaaS API + MCP | 9 mạng | **$499/tháng** (tier Agency, 3000 queued) | Có | Không | Proprietary |
| **Postiz** | OSS + cloud | 30+ kênh | Self-host ~$5/tháng infra; cloud $29–39/tháng | **Không** | **Có** (Docker) | **AGPL-3.0** |
| **Mixpost** | OSS open-core | Lite: FB/X/Mastodon. Pro: 11 nền tảng | **$299 một lần** (Pro) | **Không** | **Có** (Laravel) | MIT + Pro |
| **Publer** | SaaS | FB/IG/X/LI/TikTok/YT… | $10/tháng + API chỉ Business/Enterprise | Có | Không | Proprietary |
| **Buffer** | SaaS | nhiều | — | — | Không | **REST API đã đóng đăng ký mới** |
| **Hootsuite** | SaaS | FB/IG/X/LI (không TikTok/YT) | $99/user/tháng | Có | Không | Proprietary |
| **n8n** | Source-available | FB/IG/LI/X native; **TikTok không có node chính thức** | Self-host free | **Không** | **Có** | Sustainable Use |
| **Make** | SaaS | X module bị huỷ 2025; TikTok chỉ ads | **~$500+/tháng** ở volume này | Có | Không | Proprietary |
| **Zapier** | SaaS | FB/IG/X/LI/YT | **~$300+/tháng** | Có | Không | Proprietary |

**Đọc bảng này:** hai đường đi thật —
1. **Mua** Ayrshare ($149/tháng) — họ lo toàn bộ app review + token refresh. Nhanh nhất, không sở hữu.
2. **Tự làm** trên nền **Postiz (AGPL)** hoặc **Mixpost (MIT + $299)** — sở hữu code, nhưng **tự lo app review với Meta/LinkedIn/X** (đây là phần đau nhất, không phải code).

Blotato/Make/Zapier quá đắt ở volume 50–70/ngày. Hootsuite thiếu TikTok/YT.

---

## 9. Browser automation (phương án dự phòng cho FB Group / Zalo cá nhân)

| Hạng mục | Kết luận |
|---|---|
| Công cụ | **Playwright + `launchPersistentContext(profileDir)`** làm khung xương. Camoufox (Firefox patch C++) chỉ khi gặp gate TLS/JA3 |
| Headless | **Headful bắt buộc cho Facebook.** Server dùng Xvfb |
| Proxy | **Residential bắt buộc.** Datacenter proxy bị flag nhanh |
| TLS/JA3 | **Cần xử lý.** Vanilla Playwright/Puppeteer bị block ở lớp này |
| Stealth plugin | Cần nhưng **không đủ** — `puppeteer-extra-plugin-stealth` gần như không update từ 2023 |
| CAPTCHA | 2Captcha ~EUR 1.40/1000 Turnstile; CapSolver ~$1.20/1000. **2FA/SMS lock không giải tự động được** |
| Session | 1 account = 1 profile folder. Cùng folder → Chrome lock. `storageState` JSON **không có IndexedDB** |

**Rủi ro pháp lý & vận hành:**
- Meta ToS §3: cấm truy cập bằng phương tiện tự động **kể cả khi đã đăng nhập**.
- TikTok ToS: cấm robots/scraping/automation.
- Zalo: các thư viện unofficial **tự cảnh báo** "account may be locked, banned, or restricted at any time".
- `Meta v. Bright Data` (2023–2025) chỉ nói scraping **public, logged-out** hợp pháp — **không** áp dụng cho đăng bài có đăng nhập.
- Trần hành vi quan sát được (community, không chính thức): FB Group account mới 0–30 ngày ~2–3 post/giờ, 10–15 group/ngày; account trưởng thành 35–50 group/ngày.
- Checkpoint "unusual activity" → SMS/ID verification, **không tự khôi phục được**.

**Kết luận:** 50–70 bài/ngày lên FB Group cần **3–5 account tối thiểu** + proxy + CAPTCHA + chấp nhận ban. Zalo cá nhân: không khuyến nghị.

---

## 10. Nguồn

**Meta**
- https://developers.facebook.com/docs/graph-api/changelog · https://developers.facebook.com/docs/graph-api/overview/rate-limiting
- https://developers.facebook.com/documentation/pages-api/posts · https://developers.facebook.com/documentation/development/permissions
- https://developers.facebook.com/documentation/facebook-login/guides/access-tokens
- https://developers.facebook.com/documentation/instagram-platform/content-publishing
- https://developers.facebook.com/documentation/threads/posts · https://developers.facebook.com/documentation/threads/overview
- https://developers.facebook.com/docs/graph-api/changelog/version19.0 · https://developers.facebook.com/docs/graph-api/reference
- https://developers.facebook.com/documentation/development/release/business-verification

**LinkedIn**
- https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-09
- https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview?view=li-lms-2026-09
- https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-api-migration-guide?view=li-lms-2026-09
- https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits · https://developer.linkedin.com/product-catalog

**X**
- https://docs.x.com/x-api/getting-started/pricing · https://docs.x.com/x-api/fundamentals/rate-limits
- https://devcommunity.x.com/t/announcing-the-launch-of-x-api-pay-per-use-pricing/256476

**TikTok**
- https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
- https://developers.tiktok.com/doc/content-posting-api-reference-photo-post
- https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide

**Telegram**
- https://core.telegram.org/bots/api · https://core.telegram.org/bots/faq

**Zalo**
- https://oa.zalo.me/home/documents/vie/guides/cau-hoi-thuong-gap-tin-broadcast
- https://oa.zalo.me/home/documents/vie/guides/tong-quan-cac-loai-tin-nhan-tren-zalo-official-account-_3651713298729094511
- https://zalo.solutions/oa/pricing · https://developers.zalo.me/docs

**YouTube / Google**
- https://developers.google.com/youtube/v3/determine_quota_cost
- https://developers.google.com/youtube/v3/docs/videos/insert
- https://developers.google.com/my-business/content/posts-data

**Aggregator / OSS**
- https://www.ayrshare.com/pricing · https://www.blotato.com/social-media-api
- https://github.com/gitroomhq/postiz-app · https://postiz.com
- https://github.com/inovector/mixpost · https://mixpost.app/pricing
- https://publer.com/docs · https://developers.buffer.com · https://www.hootsuite.com/docs
- https://www.npmjs.com/package/@igabm/n8n-nodes-tiktok · https://www.make.com/en/pricing · https://zapier.com/pricing

**Browser automation**
- https://playwright.dev/docs/api/class-browsertype · https://playwright.dev/docs/auth · https://pptr.dev/guides/cookies
- https://www.facebook.com/terms · https://www.tiktok.com/legal/page/us/terms-of-service/en
- https://github.com/nextlevelbuilder/goclaw-docs/blob/master/channels/zalo-personal.md
- https://www.zyte.com/blog/california-court-meta-ruling · https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn
