# Viết lại bài học HiTechCloud cho người học bắt đầu từ đầu

* **Author:** Justin
* **Date:** 2026-10-29 (cập nhật từ bản 2026-10-28)

## Overview

Justin cần ôn cho buổi phỏng vấn Fullstack Engineer (AWS, Python, VueJS) của HiTechCloud. Lịch phỏng vấn thật chưa có (Justin nói vậy). Giả định làm việc: khoảng một tuần nữa. Theo Justin, kiến thức AWS, Vue và Python còn yếu. Justin nói đã viết nhiều dự án Python RAG, chủ yếu bằng vibe coding. Analysis mục 2 và 4 ghi những gì đã đối chiếu trong repo.

Repo có 25 bài học (L01–L25), do `vue-app/src/views/Lesson.vue` hiển thị. Theo Justin, đọc bài thấy khô và không hình dung được tình huống thật.

**Yêu cầu của Justin (diễn đạt lại).**
- Viết lại bài sinh động, dễ hiểu, đi theo một mạch thẳng, bắt đầu từ thứ người học đã biết.
- Giọng dạy tham chiếu tám người giảng ở Analysis mục 3; mỗi người có hai đến ba bài giảng. Đây là hình mẫu cách giảng. Brief không gán lời nói, bài viết hay kinh nghiệm nào cho người đã nêu tên.
- Người giảng: Justin hỏi có thể làm bài học sinh động như người giảng viên từng làm CTO 20 năm và giảng dạy 20 năm không. Brief không dùng danh xưng này làm giọng bài; xem quyết định 10.
- Mục tiêu: người học đọc xong trả lời được câu hỏi phỏng vấn. Justin ghi “100%”; brief không dùng con số này làm tiêu chí.

**Giả thuyết chính cần kiểm.** Viết lại theo một mạch dạy cố định sẽ làm bài dễ đọc hơn, và người đọc trả lời được câu hỏi phỏng vấn sau khi đọc. Chưa có bằng chứng cho giả thuyết này. Mục 6, Blocker 1, nêu phép đo nền và lý do phép thử cũ không dùng được.

**Thuật ngữ trong brief.**
- “đã làm”: có đường dẫn repo hoặc commit chứng minh.
- “đã đọc”: đọc tài liệu hoặc code, chưa làm.
- “chưa làm”: không có bằng chứng.
- “bài”: một lesson trong dữ liệu (L01–L25). Không dùng “bài” cho demo hay bài tập.
- “CTO hỏi xoáy”: mục 05 của mỗi bài, gồm bốn câu luyện tập (trường `attacks`) do người soạn dữ liệu viết. Không có nguồn từ HiTechCloud; bài không có trường nguồn.
- “câu neo”: câu để nhớ ở mục 06 của mỗi bài.
- “chặng”: nhóm bài theo chủ đề (trường `stage`, có sáu chặng).
- “Phản chứng”, “Giả sử”, “Điều đúng là”: cụm lặp trong văn bài bài học (đếm ở mục 2). “Giả sử” là nhãn bắt buộc cho số liệu kịch bản (CONTRACT.md dòng 352–353), nên số đếm đo độ lặp, không đo lỗi.
- “provenance”: khối “Ghi chú nguồn” đóng mặc định ở cuối bài.
- “RAG”: hệ thống trả lời dựa trên tài liệu được truy xuất trước khi sinh câu trả lời.
- “vibe coding”: viết mã nhờ AI, chưa kiểm từng phần.
- “Goldfish review”: sáu reviewer chạy song song, mỗi người một góc nhìn (Design, Codebase, Comprehension, Structural, Zoom-out, Readiness). Kết quả ở mục 6.
- “readiness”: reviewer đánh giá brief đã đủ để thực hiện chưa. Không đánh giá tính đúng kỹ thuật của bài.

**Tiêu chí đo (đề xuất, chưa duyệt).**
- (a) Sau mỗi bài, Justin giải thích được cơ chế chính mà không nhìn tài liệu.
- (b) Trả lời được bốn câu trong `attacks` của bài (mục 05).
- (c) Mỗi câu “đã làm” trong bài có đường dẫn repo hoặc commit. Câu không có bằng chứng viết là “đã đọc” hoặc “chưa làm”.

**Giới hạn.** Bài học không thay được kinh nghiệm thực tế mà tin tuyển dụng yêu cầu (từ 2 năm, triển khai ứng dụng trên AWS).

## Analysis

### 1. Yêu cầu tuyển dụng

Nguồn: `hitechcloud.vn/careers/fullstack-engineer-aws-python-vuejs/`, trang ghi cập nhật 2026-08-12. Đọc lần đầu 2026-10-28 (theo ghi chú cũ, chưa xác minh). Đọc lại 2026-10-29: hạn nộp “còn 1 ngày”; danh sách Yêu cầu khớp với trang.

Yêu cầu ứng viên (diễn đạt lại):
- Tối thiểu 2 năm phát triển web với Python và một framework JavaScript.
- Có kinh nghiệm thực tế triển khai ứng dụng trên AWS.
- Thành thạo VueJS. TypeScript là điểm cộng.
- Nắm các dịch vụ AWS thông dụng: Lambda, API Gateway, S3, RDS hoặc DynamoDB.
- Hiểu Docker và quy trình phát hành tự động.
- Chủ động học công nghệ mới và tự chịu trách nhiệm với phần việc được giao.

Trang tin còn ghi, ngoài mục Yêu cầu: theo dõi nhật ký, chỉ số và chi phí của phần hệ thống mình phụ trách; trực hệ thống theo ca có lịch riêng và phụ cấp; quy trình tuyển gồm sàng lọc hồ sơ trong 5 ngày làm việc, phỏng vấn chuyên môn, rồi phỏng vấn với quản lý tuyển dụng.

Hạn nộp: 2026-10-30 (thứ Sáu). Trang đọc ngày 2026-10-29 ghi “còn 1 ngày”. Justin nói đã nộp hồ sơ ngày 2026-10-01 và qua sơ tuyển (lời Justin, chưa có email hay bằng chứng trong repo).

### 2. Bằng chứng trong repo (đo 2026-10-29)

Cách đo: đọc dữ liệu bài qua module `vm` trong eval JS (Bun 1.4.4), không chạy build. “Từ” là chuỗi cách nhau bởi khoảng trắng, sau khi bỏ thẻ HTML; gần đúng số âm tiết. Số đánh dấu [R] do reviewer Codebase kiểm lại ngày 2026-10-29. Các số còn lại đo lại ngày 2026-10-29 bằng cùng cách đo, trừ phần audit cũ (ghi rõ trong cột Ghi chú).

| Mục | Kết quả | Ghi chú |
|---|---|---|
| Số bài | 25 (L01–L25) trong 6 file | `src/35-lessons-aws.js` (L01–L06), `36-lessons-py.js` (L07–L11), `37-lessons-vue.js` (L12–L17), `38-lessons-link.js` (L18–L22), `39-lessons-security.js` (L23), `41-lessons-deep.js` (L24–L25) [R] |
| Văn xuôi mỗi bài | TB 3.277 từ; ít nhất 2.518; nhiều nhất 4.397 | Mọi trường chữ, trừ `code`, `naiveCode`, `provenance`, `stageIntro`, `visuals`. Gồm `attacks`, `title`, `id`, `qids`, `refs`. Tổng 81.917 từ cho 25 bài. Không gồm `attacks`: TB 2.698 từ mỗi bài |
| Code mỗi bài | TB 238 từ | `code`, `naiveCode` |
| `body` (độ dài chuỗi, gồm thẻ HTML) | TB 1.200 ký tự; nhiều nhất 1.952 (L20) | Audit cũ ghi khoảng 4.000 ký tự: đã lỗi thời |
| `provenance`, `stageIntro` | TB 124 và 23 từ mỗi bài | `stageIntro` có ở L01, L07, L12, L18, L23, L24, L25 |
| `attacks` (CTO hỏi xoáy) | 4 câu mỗi bài, cả 25 bài | 14.474 từ tổng (câu hỏi và đáp án); TB 579 từ mỗi bài |
| Cụm lặp | “Phản chứng” 73 lần (20 bài); “Giả sử” 43 lần (20 bài); “Điều đúng là” 32 lần (8 bài) | Đếm có phân biệt hoa thường trên mọi trường, kể cả `code`. Không phân biệt hoa thường: “Phản chứng” 77, “Giả sử” 46. Bỏ `code` và `naiveCode`: “Giả sử” còn 42 (có phân biệt) hoặc 45 (không). Reviewer Codebase đếm lại: 73, 43, 32, khớp |
| “tôi” trong `say30`, `say90`, `sayIt` | 50 chỗ ở 19 bài, gồm cả “Tôi” viết hoa; 33 chỗ viết thường. Cụm “tôi đã”: 1 chỗ, L20 `sayIt[4]` | Chữ đứng sau “tôi” nhiều nhất: “không” 5, “đọc” 4, “chọn” 4, “đặt” 3. Chỗ “tôi đã” nói về cách code so loại tệp, không phải việc đã làm ngoài đời [INFERENCE]. Chưa phân loại từng chỗ “tôi” là việc đã làm thật |
| Docker, Terraform trong bài | 0 bài | Chữ “Docker” có ở 15 file trong `src/`; `17-q-h.js` có 84 lần và 13 mã câu hỏi H01–H13. “Terraform” có ở 2 file trong `src/` (`16-q-g.js`, `50-case.js`), không có trong bài |
| “pipeline” | L18 (1), L22 (9), L24 (1) | “CI/CD” không có trong bài nào |
| GitHub Actions; TypeScript | GitHub Actions: L22 (2 lần). TypeScript: L18 (1 lần) | |
| Trường `analogy` | chỉ L12 | |
| Trường `expected`, `lab` | Không có trong 25 bài. `expected` có trong file câu hỏi (`src/16-q-g.js`); `lab` không có trong 6 file bài | Bước làm thử cần một trường trong bài; xem mục 6, Major 5 |
| Mục hiển thị | Sáu mục cố định: 01 Bài toán, 02 Cách làm ngây thơ, 03 Mô hình & cơ chế, 04 Nói 30/90 giây, 05 CTO hỏi xoáy, 06 Câu neo & đọc thêm | `vue-app/src/views/Lesson.vue` dòng 45–52 |

Điểm rút ra từ số đo:
- L18 cần đọc trước 13 bài (đóng bắc cầu `buildsOn`: L01–L03, L05–L13, L17). L20 cần 18 bài trước. Phương án B (mục 5) không đứng riêng được.
- `body` nằm trong mục 06, sau câu neo (`Lesson.vue` dòng 454–458).
- `stageIntro` của L25 không bao giờ hiện: `isFirstOfStage` (`Lesson.vue` dòng 19–24) trả về false, vì L24 cùng chặng 6 đứng trước.
- Liên kết bài trong `vue-app/src/utils.js` dòng 55 chỉ nhận L01–L25. Bài L26 sẽ không được liên kết.

Bảng dưới lấy tên bài từ trang công khai `https://tiendat11.github.io/learning/` (đọc 2026-10-29). Chặng lấy từ trường `stage` trong `src/`.

| Bài | Chặng | Tên bài |
|---|---|---|
| L01 | 1 | Một request đi qua những dịch vụ nào, và vì sao tăng Lambda làm nghẽn RDS |
| L02 | 1 | Ai được gọi Lambda, và Lambda được phép làm gì |
| L03 | 1 | Một lần gọi Lambda đi qua Init, handler và retry như thế nào |
| L04 | 1 | Vì sao curl trả 200 mà trình duyệt vẫn chặn request |
| L05 | 1 | Cho trình duyệt tải thẳng lên S3 bằng URL ký sẵn, và đọc DynamoDB theo khoá |
| L06 | 1 | Vì sao thêm consumer không làm hàng đợi nhanh hơn |
| L07 | 2 | Một request đi qua FastAPI: def, async def và chỗ nào thật sự nhường lượt |
| L08 | 2 | 150 environment Lambda warm mở bao nhiêu connection tới RDS |
| L09 | 2 | Lỗi nào phải sửa dữ liệu, lỗi nào đáng retry |
| L10 | 2 | Nối log của cùng một đơn qua API, Lambda và SQS |
| L11 | 2 | Test thay client AWS bằng fake ở đúng chỗ |
| L12 | 3 | Reactivity: ref, reactive và cái Proxy ghi sổ ai đọc khóa nào |
| L13 | 3 | computed, watch và watchEffect: giá trị suy ra, tác dụng phụ và response cũ |
| L14 | 3 | Component: props xuống, emit lên, v-model và key theo danh tính |
| L15 | 3 | State ở đâu: component, cây component hay store toàn cục |
| L16 | 3 | Vue Router: matcher, guard và việc component được tạo sau cùng |
| L17 | 3 | Form submit: bốn trạng thái, khóa double submit và Idempotency-Key |
| L18 | 4 | Hợp đồng API giữa Vue và FastAPI |
| L19 | 4 | Auth xuyên hai phía: token, nơi lưu, interceptor, và ai quyết định quyền |
| L20 | 4 | Upload lên S3: ký quyền ghi, rồi xác nhận thứ thật sự nằm trong bucket |
| L21 | 4 | Outbox: vì sao ghi cơ sở dữ liệu và gửi message lệch nhau, và chỗ nào vá được |
| L22 | 4 | Deploy: vì sao index.html cũ trỏ vào tệp JS đã xoá, và rollback đúng phải là gì |
| L23 | 5 | DDoS: bất đối xứng tài nguyên và tầng chặn sớm nhất |
| L24 | 6 | PostgreSQL thực chiến: planner, index, transaction và cái giá của ORM |
| L25 | 6 | Chọn FastAPI, Django hay Flask theo ba trục: I/O, schema và thành phần có sẵn |

Audit cũ `audit/pedagogy.md` (ngày 2026-10-07, đo bản HTML 22 bài). Không dùng làm bằng chứng cho bản hiện tại:
- PED-4 nói người học đọc khoảng 4.000 ký tự `body` trước khi tới `say30`. Đo nay: trung bình 1.200 ký tự.
- PED-5 nói CORS nằm trong L01 `mechanism`. L01 không có CORS. CORS nằm ở L04 và L18.
- PED-12 nói 22 bài với 33 khoá giống hệt. Nay là 25 bài, số khoá từ 33 đến 35.

Hai file build (đã đối chiếu):
- `D:/research/build.mjs` sinh `hitechcloud-interview-prep.html`.
- `vue-app/build.mjs` sinh `vue-app/dist/index.html` và ghi đè `<repo>/index.html` mỗi lần chạy (dòng 96–103). `CONTRACT.md` dòng 409 coi `index.html` ở gốc là artifact sinh ra, phải commit cùng `src/`; dòng 383 nói `vue-app/build.mjs` đọc `../src/*.js`. Trang công khai `https://tiendat11.github.io/learning/` đọc ngày 2026-10-29 hiển thị 25 bài, 6 chặng, 147 câu. Comment trong `vue-app/build.mjs` dòng 100 ghi Pages phục vụ gốc repo [INFERENCE: chưa kiểm cấu hình Pages].

### 3. Giọng dạy tham chiếu

Cách đọc nhãn: **ĐÚNG** = URL mở được và khớp tiêu đề, kênh hoặc trang. **[TRANSCRIPT]** = lời đã đọc trong transcript. **[TRANG]** = nội dung trang web đã đọc, không phải lời nói. **[SUMMARY]** = chỉ đọc tiêu đề hoặc mô tả. **[CHƯA KIỂM]** = chưa mở. Phụ đề tự động có thể sai từ và số, nên con số lấy từ phụ đề chỉ là gợi ý.

Đường dẫn gốc lấy từ kết quả tìm kiếm web ngày 2026-10-28 (ghi chú cũ, chưa xác minh ngày tìm). Ngày 2026-10-29, sáu researcher kiểm lại URL của sáu người và đọc nội dung; kết quả dưới đây là của ngày đó. Sáu mục 3.1–3.6 là sáu người trong yêu cầu của Justin; hai tên còn lại ở mục 3.7.

#### 3.1 Raymond Hettinger (Python và tư duy viết code)

- Nguồn: `youtube.com/watch?v=anrOzOapJ2E` (PyCon US 2013, 48:51, **ĐÚNG**; kênh tải lại là SciForce, có phụ đề tự động); `youtube.com/watch?v=wf-BqAjZb8M` (Beyond PEP 8, PyCon 2015, 52:05, **ĐÚNG**, không có phụ đề; nội dung **[CHƯA KIỂM]**).
- Cách dạy: mở bằng code kiểu cũ, ví dụ vòng lặp chỉ số kiểu C, rồi đặt code mới cạnh đó. Mỗi ý lặp lại: viết theo kiểu ngôn ngữ khác, nêu cái giá đo được, hỏi "có cách tốt hơn không", đưa đúng một công cụ (`enumerate`, `zip`, `key=`), rồi kết bằng quy tắc nhận diện được bằng grep [TRANSCRIPT anrOzOapJ2E].
- Khó bắt chước: cần uy tín của core developer và kinh nghiệm đọc nhiều codebase khách hàng [INFERENCE].

#### 3.2 David Beazley (concurrency và Python sâu)

- Nguồn: `youtube.com/watch?v=ph374fJqFPE` (Inside the Python GIL, **ĐÚNG**); `youtube.com/watch?v=Z_OAlIhXziw` (Curious Course on Coroutines and Concurrency, **ĐÚNG**).
- Cách dạy: mở bằng hàm CPU-bound nhỏ nhất, chạy tuần tự rồi chạy hai thread, để người xem đoán trước. Đo bằng bộ đếm có sẵn của hệ điều hành. Khi công cụ ngoài không đủ thì sửa interpreter để ghi trace. Bài coroutines bắt đầu từ generator `countdown` nhỏ rồi mới ghép pipeline [TRANSCRIPT, phụ đề tự động].
- Khó bắt chước: ông nói đã đào sâu khoảng ba tuần để chèn trace vào GIL, phải đọc source C của CPython. Người học không cần tái lập; cần thí nghiệm nhỏ để thấy cơ chế [INFERENCE].

#### 3.3 Werner Vogels (AWS và tư duy kiến trúc)

- Nguồn: `youtube.com/watch?v=UTRBVPvzt9w` (re:Invent 2023 keynote, **ĐÚNG**); `youtube.com/watch?v=RfvL_423a-I` (re:Invent 2022 keynote, **ĐÚNG**). Transcript tải về bị cắt 512 byte mỗi dòng, nên lời thoại chỉ đọc được một phần.
- Cách dạy: đặt tên và đánh số nguyên tắc để người nghe theo dõi. Năm 2023 gom thành "The Frugal Architect" với "Law 1 - Cost is a Non-Functional Requirement" [SUMMARY]. Mở bằng một đoạn hội thoại ngắn trước khi vào khái niệm [TRANSCRIPT]. Dùng khách hàng thật làm ví dụ: PBS, WeTransfer, Thorn, Nubank [SUMMARY].
- Khó bắt chước: keynote có kịch bản, đội biên tập và khách hàng lên sân khấu, nên khó sao chép [INFERENCE].

#### 3.4 Martin Kleppmann (distributed systems)

- Nguồn: `youtube.com/watch?v=UEAMfLPZZhE` (Distributed Systems 1.1, **ĐÚNG**, có transcript tự động); `youtube.com/watch?v=9uCP3qHNbWw` (7.3 Eventual consistency, **ĐÚNG**, chỉ đọc được tiêu đề và mô tả); `youtube.com/watch?v=5ZjhNTM8XU8` (Transactions: myths, surprises and opportunities, **ĐÚNG**, không có transcript); `jepsen.io/analyses/mongodb-4.2.6` (**ĐÚNG**, đọc toàn văn).
- Cách dạy: định nghĩa trước rồi mới phân tích. Bài 1.1 mở bằng định nghĩa của Lamport (lỗi của một máy mà bạn không biết là có), rồi hỏi ngược "Why NOT make a system distributed?" [TRANSCRIPT]. Nêu bên thua của mỗi đánh đổi: Jepsen nói phát hiện anomaly "doesn't mean those anomalies matter to users", và dẫn nghiên cứu VLDB cho thấy người dùng chọn mức yếu hơn vì độ trễ và SLA [TRANG]. Kịch bản lỗi dựa trên lịch sử đọc cụ thể, kèm file ZIP để kiểm lại [TRANG].
- Sách DDIA: bản 1 (O'Reilly 2017, ISBN 978-1449373320) **ĐÚNG một phần**; bản 2 chưa xác nhận năm vì trang O'Reilly trả HTTP 403 [SUMMARY].
- Test harness trong báo cáo: 9 node Debian, 2 shard × 3 replica set, workload ghi và đọc qua transaction; Elle suy ra dependency graph rồi tìm chu trình [TRANG]. Khó sao chép vì cần hạ tầng đa node và công cụ phân tích history; không làm được trong một buổi [INFERENCE].

#### 3.5 Evan You (Vue.js và thiết kế framework)

- Nguồn: `youtube.com/watch?v=WLpLYhnGqPA` (VueConf Toronto 2019, **ĐÚNG**); `youtube.com/watch?v=ANtSWq-zI0s` (JSConf.Asia 2019, **ĐÚNG**, phụ đề thủ công); `youtube.com/watch?v=k-WUzeMqKZQ` (RenderATL 2023, **ĐÚNG theo tiêu đề**, nội dung **[CHƯA KIỂM]**); `vuejs.org/guide/extras/reactivity-in-depth.html` (**ĐÚNG**).
- Cách dạy: đặt ràng buộc trước, giải pháp sau. JSConf.Asia vẽ phạm vi so sánh, liệt kê ưu nhược hai đầu (React nhỏ, Angular lớn), rồi mới nói Vue chọn ở giữa; phủ định tiền đề: "there isn't a single good versus bad spectrum" [TRANSCRIPT]. Trang reactivity đi từ bảng tính, sang `let A0/A1/A2` (sai), sang `update()`, rồi tới pseudo-code `reactive()`/`ref()` khoảng 10 dòng [TRANG]. Nêu lựa chọn đã bỏ kèm lý do: Vue 2 dùng getter/setter vì giới hạn trình duyệt, Vue 3 dùng Proxy, Reactivity Transform bị loại [TRANG].
- Khó bắt chước: đưa số đo thật (v2.6: 36 ms, v3: 5,4 ms, cho 12.000 DOM node), rồi tự nói con số đó có giới hạn ("this is static") [TRANSCRIPT]. Cần dữ liệu đo thật và kỷ luật tự bác bỏ con số của mình [INFERENCE].

#### 3.6 Corey Schafer hoặc Programming with Mosh (học Python từ đầu)

- Corey: `youtube.com/watch?v=YYXdXT2l-Gg` (Tutorial 1, **ĐÚNG**); `youtube.com/watch?v=ZDa-Z5JzLYM` (OOP 1, **ĐÚNG**, đọc đủ transcript phụ đề thủ công).
- Mosh: `youtube.com/watch?v=K5KVEU3aaeQ` (Python Full Course, **ĐÚNG**, 2:02:20); `codewithmosh.com/p/python-programming-course-beginners` (**ĐÚNG**, bản trả phí: 12 giờ, 13 mục, 200 bài); `exercism.org/tracks/python` (**ĐÚNG**, 146 bài, miễn phí).
- Cách dạy (Corey): bước nhỏ, mỗi bước có ví dụ chạy được; một ví dụ xuyên suốt (lớp `Employee`); giải thích chỗ dễ sai, ví dụ vì sao method phải có `self` [TRANSCRIPT ZDa-Z5JzLYM].
- Cách dạy (Mosh): cố tình viết lỗi (`2 >`, `print "hello"`), đọc thông báo lỗi rồi sửa; quiz 3 câu ở 0:29:45 với lời nhắc "pause the video think" [TRANSCRIPT].
- Khó bắt chước: quiz đặt đúng nhịp video, người viết bản văn không tái tạo được độ trễ đó [INFERENCE].

#### 3.7 Ngoài sáu người trong yêu cầu

Hai tên này (Martin Fowler, Anthony Fu) có trong danh sách tám người của brief trước, nhưng không nằm trong sáu người của yêu cầu ngày 2026-10-29. Giữ lại để không mất dữ liệu; Justin quyết (quyết định 6). Kelsey Hightower và Bret Victor cũng không có trong danh sách hiện tại; chưa xác nhận là Justin đã bỏ hai tên này.

- Martin Fowler: `youtube.com/watch?v=DngAZyWMGR0` (OSCON 2015, 14:04, **ĐÚNG**, đọc transcript tự động). Ông không thích từ "architecture" vì nó gợi hình ảnh người thiết kế không viết code. Ralph Johnson bác hai định nghĩa: "các thành phần cấp cao nhất" và "quyết định phải đưa ra sớm". Thay vào đó là "hiểu chung của đội" và "quyết định khó đổi"; Fowler gộp hai ý này thành "điều quan trọng" [TRANSCRIPT]. Lập luận bằng kinh tế: chất lượng nội bộ không nhìn thấy được, và lúc thiết kế tốt bắt đầu có lợi được tính bằng tuần, không phải tháng [TRANSCRIPT]. `youtube.com/watch?v=ev2qvR9UFPs` là clip 1:49 của kênh bên thứ ba (**ĐÚNG**).
- Anthony Fu: `youtube.com/watch?v=CW9uTys0li0` (Vitest, Vue.js Nation 2022, 2:50) và `youtube.com/watch?v=tVd0JeSr8kg` (Vite Devtools, ViteConf 2025, 29:22, không có transcript). **[CHƯA KIỂM]** trong phiên này. Ghi chú cũ (2026-10-28, chưa xác minh lại) nói đã đọc transcript Vitest; cách dạy dưới đây lấy từ ghi chú đó: trước khi giải thích Vitest, đặt câu hỏi vì sao cần thêm một test runner nữa (câu gốc: "why do we need yet another test runner"; ý dịch, transcript tự động).

Không kiểm được trong mục này: nội dung Beyond PEP 8; RenderATL 2023 của Evan You; hai video Kleppmann không có transcript; lời thoại đầy đủ của keynote Vogels; phần sau của bài coroutines của Beazley (transcript chỉ đọc được một phần).

### 4. Hạ tầng trong repo (đã đối chiếu)

- `D:/chatbot-real-estate`: `Dockerfile` cho Cloud Run; `scripts/deploy-be.ps1` chạy `gcloud run deploy`; `ragre_mvp/` rỗng khi đọc; `ingest/` có script upload ảnh và video lên R2.
- `D:/chunking/husc-admission-chat-enrollment`: `rag2025/` là mã RAG; `docker-compose.yml`; `deploy/vps/atlas-lab/` có `docker-compose.atlas-lab.yml` và `Caddyfile`.
- `D:/vms-studio`: ba script ở gốc (`_tts.py`, `_mix.py`, `_render.py`) không chứa các từ rag, embed, retriev, vector, lancedb, llm, openai hay chunk, tìm không phân biệt hoa thường. `_mix.py` trộn âm thanh bằng ffmpeg. Phần còn lại chưa đọc. Chưa xác nhận đây là dự án RAG.
- Lưu trữ đối tượng: trong ba repo khác, `boto3` chỉ có ở `D:/chatbot-real-estate` (ví dụ `ingest/upload_images_r2.py` dòng 188–194), trỏ tới endpoint Cloudflare R2 (`R2_ENDPOINT` trong `.env.example`, dòng 59). Tìm `boto3`, `amazonaws`, `cloudfront` ở `D:/chunking/husc-admission-chat-enrollment` và `D:/vms-studio`, có tôn trọng `.gitignore`, không có kết quả; riêng husc, tìm không tôn trọng `.gitignore` chưa xong. Trong chính `D:/research/src`, `boto3` và CloudFront xuất hiện trong câu hỏi mẫu (`23-q-aws-ec2.js`, `28-q-aws-dns.js`, `29-q-aws-cache.js`, `30-q-aws-s3-access.js`) và trong `audit/backend.json`; đó là nội dung soạn để dạy, không phải kinh nghiệm làm việc. Chưa có bằng chứng S3, CloudFront hay OAC trên AWS trong các repo đã quét.
- Đám mây: `D:/chatbot-real-estate` chạy trên GCP. `.github/workflows/ci.yml` dòng 228–230 chạy `gcloud run deploy`; `scripts/DEPLOY_RUNBOOK.md` dòng 24 nêu Cloud Run, Cloud Build và Secret Manager. Đối chiếu sang AWS là kiến thức chung, chưa đối chiếu với repo: Cloud Run gần App Runner hoặc ECS; Cloud Build gần CodeBuild; Secret Manager gần Secrets Manager.
- `id_rsa` có ở `D:/chatbot-real-estate` và `D:/chunking/husc-admission-chat-enrollment`. Không mở nội dung. `git ls-files` với mẫu `*id_rsa*` không trả về tệp nào ở hai repo (đo 2026-10-29): tệp không nằm trong index hiện tại. `.gitignore` của `chatbot-real-estate` dòng 29–34 liệt kê `id_rsa` để git bỏ qua; dòng 175 ghi repo này công khai. Chưa kiểm lịch sử commit: một lệnh git nêu đích danh `id_rsa` đã bị chặn; cần Justin cho phép bằng `/harness-allow-secret`.
- Git trong máy (đo 2026-10-29, `git log --all`, đếm commit theo SHA duy nhất trên 14 đường dẫn repo, tác giả TienDat11): 626 commit, từ 2026-01-16 đến 2026-10-28. `git config --local user.name` của `D:/research` là TienDat11. [INFERENCE: TienDat11 là Justin, chưa xác nhận. Commit đứng tên "Deploy Rehearsal" (git user.name toàn cục của máy) không được tính.]
- Tên “Justin” (khác TienDat11): 256 commit, 2026-03-18..24, tất cả ở `D:/turbo-proxy`, chủ yếu TypeScript và Markdown. Email không trùng TienDat11. [INFERENCE: chưa rõ “Justin” có phải Justin của dự án này không; cần Justin xác nhận.]
- Stack ở HEAD, 13 đường dẫn (gồm `D:/research`, không gồm `tiendatmail`): requirements của bốn repo bộ ragre (cc-main-wt, chatbot-real-estate, ragre-vps-deploy, d/_rehearse) có fastapi, pydantic, sqlalchemy, lightrag, boto3; husc có fastapi, pydantic. File `.py` có chữ `fastapi`: 43, 54, 43, 43 ở bốn repo ragre; 74 ở husc; 1 ở `rag-real-estate`. Next.js với React: ragre, rag-real-estate, ketoan; Vite với React: husc, turbo-proxy; `.vue` chỉ có ở `D:/research`. Trong file `.py` của 13 đường dẫn này, không dòng nào (không tính thụt lề) bắt đầu bằng `import django` hay `from flask`.
- AWS, 13 đường dẫn ngoài `D:/research` (gồm `tiendatmail`): grep ở HEAD trong mọi file văn bản, trừ file lock và `.min.js`, không thấy `aws-sdk`, `lambda_handler`, `aws_cdk`, `cloudformation`. `dynamodb` và `apigateway` chỉ xuất hiện ở 6 file markdown của `my-wiki` như ghi chú học (ví dụ `wiki/answers/general-1-he-thong-chiu-tai-uoc-1-t.md` dòng 279, Lambda với DynamoDB). `botocore.exceptions` có ở hai file `ingest/upload_*_r2.py` trong bốn repo bộ ragre, đi kèm boto3. `boto3` ở ragre trỏ tới Cloudflare R2 (`*.r2.cloudflarestorage.com`); `deploy/vps/serve/bootstrap.sh` cài boto3 trên VPS cho backup R2. `aws-1-ap-southeast-1.pooler.supabase.com` là host của Supabase. Khớp `amazonaws` ở `turbo-proxy/.../passthrough.ts` là danh sách host được phép. Husc có chuỗi `s3://` trong test, không phải lệnh gọi. [INFERENCE: chưa đọc hết khớp trong file test.]

### 5. Ba phương án

| Phương án | Nội dung | Điểm mạnh | Điểm yếu |
|---|---|---|---|
| A. Viết lại 25 bài | Áp mạch mới cho cả 25 bài | Nhất quán với yêu cầu | Khoảng 81.900 từ văn xuôi (gồm `attacks`), duyệt tuần tự từng bài. Không xong trong một tuần [INFERENCE] |
| B. Viết lại một tập bài | Ví dụ L01, L02, L05, L18, L19, L20, cộng một bài Docker | Ít việc hơn A; bám tin tuyển dụng | Tập này không đứng riêng: L18 cần 13 bài trước, L20 cần 18. Người học thấy hai giọng |
| C. Không viết lại | Dựng demo nhỏ chạy thật trên AWS: FastAPI, ghi và đọc S3 hoặc DynamoDB, một trang Vue gọi API. Luyện nói 90 giây trên demo | Có bằng chứng kiểm được qua URL | Không làm đúng yêu cầu “viết lại bài”. Cần tài khoản AWS và cảnh báo ngân sách trước |

Chưa chọn. Design đề nghị C, hoặc B kèm bài thử có hạn duyệt. Zoom-out đề nghị thử L01 trước rồi chọn B hoặc A. Readiness đề nghị mặc định B. Brief đặt mặc định là thử L01 trước, vì tập B chưa đứng riêng được (mục 2).

### 6. Kết quả Goldfish review

Vòng chính thức, ngày 2026-10-29, sau khi Justin xác nhận “Review with Goldfishes”. Sáu reviewer (Design, Codebase, Zoom-out, Comprehension, Readiness, Structural) chạy song song và gửi trực tiếp từ ngữ cảnh chính, không qua egm-synthesizer. Reviewer đọc bản brief trước các sửa ở mục này. Vòng trước đó chạy khi chưa có xác nhận; đó là lỗi quy trình. Các số của vòng đó đã đo lại ở đây.

Readiness: chưa đạt. Bốn Blocker dưới đây cần câu trả lời của Justin hoặc một vòng sửa trước khi làm bước tiếp theo.

**Blocker**
- [Blocker 1, Zoom-out, Design, Comprehension] Thử L01 không đo được gì về A, B, C, và kết thúc sau hạn 2026-10-30. Kiểm: `askFirst` trong 25 bài là chuỗi không có đáp án (`src/35-lessons-aws.js` dòng 20–24; `Lesson.vue` dòng 288–290). Chỉ `predict.a` và `attacks[i].a` có đáp án. Thử ngày 1 cần đổi render, mà quyết định 5 cấm build. Không có người thử và không có ngưỡng.
Đề xuất (Zoom-out): đo nền trên trang công khai hiện có, không cần build. Một người chưa biết AWS đọc L01, không mở tài liệu, trả lời `attacks[0..3].q`, chấm bằng `attacks[i].a`. Đặt ngưỡng trước khi đo. [INFERENCE: trang công khai hiển thị mục 05 của L01; chưa mở trang trong vòng này.]
- [Blocker 2, Comprehension, Design] “Câu hỏi phỏng vấn” không có tập đo xác định. Có ba bộ: 100 câu `attacks` (25 bài × 4); 147 câu, là số trên trang công khai, chưa đối chiếu với file; và các câu mã H01–H13 (`src/17-q-h.js`, theo mục 2). Tiêu chí (b) không nói bộ nào. Đề xuất: ghi tên bộ đo ở Overview; xem Major 8 về nguồn của `attacks`.
- [Blocker 3, Comprehension] Overview không nêu quyết định cần Justin và không nhắc hạn nộp 2026-10-30. Phương án A, B, C nằm ở mục 5 và Key Decisions. Đề xuất: một đoạn đầu nêu quyết định, hạn và các phương án.
- [Blocker 4, Readiness] Ba tiêu chí (a)–(c) chưa chạy được. (a) do chính tác giả tự chấm, không có tiêu chuẩn “cơ chế chính”. (b) không có ngưỡng và không có quy tắc mù (người chấm không đọc đáp án trước). (c) chưa có danh sách câu “đã làm” và chưa có cách đánh dấu trong dữ liệu. Các câu AWS hiện không có bằng chứng trong repo đã quét (mục 4), nên theo cấu trúc sẽ không đạt (c) [INFERENCE: chưa đếm từng câu].

**Major (chưa sửa trong vòng này)**
- [Major 5, Readiness, Zoom-out] Bảy bước dạy không khớp dữ liệu. Bước 5 (thí nghiệm có kết quả mong đợi) không có trường trong 25 bài. `expected` có trong file câu hỏi (`src/16-q-g.js`) nhưng không có trong bài. `predict` render sau `askFirst` (`Lesson.vue` dòng 287–298), nên bước “đoán trước” không đứng đầu mục 01. Bước 2 cần danh sách tiên quyết chưa có. Đề xuất (Zoom-out): không thêm trường ở bước thử; ghi “Kết quả mong đợi” vào `codeNote` của L01; chỉ thêm `expected` sau khi thử đạt.
- [Major 6, Design] Ràng buộc build. `vue-app/build.mjs` ghi đè `<repo>/index.html` (dòng 96–103) mỗi lần chạy, không có cờ tắt. Cổng trong `build.mjs` dòng 594 giới hạn `body` ở 600–2.200 ký tự; L20 đã 1.952, còn 248 ký tự dưới trần. Bài mới dài hơn 2.200 ký tự sẽ bị cổng chặn. Đề xuất: không build cho đến khi Justin duyệt. Đổi cổng là đổi contract, cần quyết định riêng.
- [Major 7, Design; đã kiểm] Bản publish có câu về việc chưa có bằng chứng. `index.html` ở gốc, dòng 337, chứa `say30` của L22, với hai câu “Tôi build Vue ra dist” và “CloudFront đọc bucket qua OAC”. Tìm `boto3`, `amazonaws`, `cloudfront` ở ba repo khác không thấy triển khai S3 hay CloudFront trên AWS; riêng husc, tìm không tôn trọng `.gitignore` chưa xong. Đề xuất: Justin quyết gỡ hay giữ câu này trước khi publish lại.
- [Major 8, Comprehension] Nguồn của `attacks` (mục 05). Brief gọi đây là câu hỏi của “người phỏng vấn”. Bài không có trường nguồn; câu do người soạn dữ liệu viết. Đề xuất: gọi là “câu luyện tập”.
- [Major 9, bảo mật, ngoài phạm vi bài] `id_rsa`. Chỉ có `id_rsa` (không có `.pub`) ở gốc `D:/chatbot-real-estate` và `D:/chunking/husc-admission-chat-enrollment`; git index không có tệp này. Chú thích `.gitignore` dòng 29–32 nói cặp khóa “was left here”. Repo công khai (dòng 175), nhánh `main` tự deploy. Lịch sử commit chưa kiểm. Nếu khóa từng được commit, phải đổi khóa; xoá khỏi lịch sử không đủ, chính chú thích đó nói vậy. Kiểm lịch sử cần `/harness-allow-secret` (quyết định 9).

**Minor và Nit (chưa sửa)**
- [Minor 10, Structural] Overview chứa glossary, tiêu chí và giới hạn. Trạng thái nằm trong Key Decisions. Ký hiệu bullet trộn `*` và `-`. Đề xuất: tách glossary và tiêu chí thành mục riêng sau Overview.
- [Minor 11, Comprehension] Thuật ngữ dùng nhiều nghĩa: “bài” (bài học, bài giảng, bài mới), “mục”, “bước”, “repo” (dự án nghiên cứu hay dự án khác), “đã làm”. Ít nhất 16 thuật ngữ chưa được định nghĩa. Đề xuất: thêm vào glossary, mỗi thuật ngữ một dòng.
- [Minor 12, Design] L26 không được liên kết: `vue-app/src/utils.js` dòng 55 chỉ nhận L01–L25. Chi phí này chưa nằm trong quyết định 3.
- [Nit 13, Codebase, Design] Cách tách từ cho ra 81.890, 81.917 hoặc 81.924 từ văn xuôi. Giữ 81.917, cách của Codebase, có mô tả. `stageIntro` của L24 và L25 trùng nhau (339 ký tự).

**Đã kiểm lại và khớp**: 25 bài trong 6 file; 81.917 từ văn xuôi (TB 3.277; TB 2.698 không gồm `attacks`); 4 câu `attacks` mỗi bài; “Phản chứng” 73, “Giả sử” 43, “Điều đúng là” 32; “tôi” 50 chỗ ở 19 bài, 33 chữ thường; L18 có 13 bài tiên quyết, L20 có 18; `isFirstOfStage` ở `Lesson.vue` dòng 19–24; whitelist `utils.js` dòng 17–20 thiếu `h2`, `div`, `a`, `figure`, `blockquote`, và bộ lọc bỏ thẻ không báo lỗi.

Phản biện mạnh nhất, theo lens:
- Design: B đốt thời gian vào văn xuôi chưa có bằng chứng “đã làm”; C tạo thứ người phỏng vấn kiểm được.
- Zoom-out: 25/25 bài đã có trường `incident`, và L01 có số cụ thể. Nếu “khô” là do mật độ mục 03, viết lại toàn bộ là sai chỗ. Thêm chữ vào bài đã dài không làm bài dễ hiểu hơn.
- Comprehension: Justin tự chấm tiêu chí, nên chưa có cách chứng minh giọng mới giúp hiểu hơn.

Đính chính số liệu reviewer nêu: Zoom-out nói “25/25 bài đã có cảnh ‘Giả sử bạn làm…’”. Đo 2026-10-29: cụm “Giả sử bạn” có ở 9 bài (L01–L06, L12–L14), trong trường `body`, mỗi bài một lần; nhưng cả 25/25 bài có trường `incident` mở đầu bằng “Kịch bản giả định”, tức đều có tình huống. Số “khoảng 2.650 từ mỗi bài” không dùng; đo lại: TB 2.698 từ văn xuôi, không gồm `attacks` (dòng 67).

**Đã sửa trong vòng này**: dòng 25, 28, 78, 82, 148, 214. **Chưa kiểm**: lịch sử commit của `id_rsa`; cấu hình Pages (`[INFERENCE]`); nội dung trang công khai ngoài số 25 bài, 6 chặng và 147 câu; người thử thứ hai.

### 7. Lộ trình học theo chủ đề

Thứ tự giữ chặng 1 → 6 của repo, vì phụ thuộc đã biết: L07 cần L06 (`buildsOn`), L18 cần 13 bài trước (L01–L03, L05–L13, L17). Đề xuất: học Python từ đầu ngoài repo, trước L01. Lý do: Justin ghi Python còn yếu (Overview), còn L01 đã có code Python (`psycopg`), L05 dùng boto3 và L07 dùng FastAPI. Đây là đề xuất, Justin chưa chọn.

| Chủ đề (người tham chiếu) | Cách dạy rút ra (mục 3) | Bổ sung để học sâu (Justin nêu; URL đã kiểm) | Bài L gắn (chặng) | Ghi chú và lỗ hổng |
|---|---|---|---|---|
| Học Python từ đầu (Corey Schafer hoặc Mosh) | Corey: bước nhỏ, mỗi bước chạy được. Mosh: cố tình viết lỗi rồi đọc thông báo; quiz 3 câu giữa bài | Bài tập: `exercism.org/tracks/python` (ĐÚNG, 146 bài, miễn phí, có mentor). Tài liệu: `docs.python.org/3/tutorial/` (ĐÚNG). Dự án: Mosh bản trả phí có 3 dự án [SUMMARY]; Corey: video 1 không có checkpoint; bài tập và dự án của các video sau [CHƯA KIỂM] | Không có bài nào trong L01–L25 dạy Python cơ bản | L01, L05, L07 dùng Python nhưng giả định người học đã biết [INFERENCE], nên không tính vào dòng này. Lỗ hổng 1 (quyết định 11) |
| AWS và tư duy kiến trúc (Werner Vogels) | Đặt tên và đánh số nguyên tắc; dùng khách hàng thật làm ví dụ | Well-Architected: `aws.amazon.com/architecture/well-architected/` (ĐÚNG; Framework và hands-on labs miễn phí). Học: `skillbuilder.aws` (ĐÚNG; 600+ khóa miễn phí, phần còn lại trả phí [SUMMARY]). AWS technical deep dives: [CHƯA KIỂM] | L01–L06 (chặng 1); L20 (chặng 4); L23 (chặng 5, gắn yếu) | Keynote 2022 và 2023 đúng; transcript bị cắt, chỉ đọc được một phần lời thoại |
| Python concurrency (David Beazley) | Chạy một hàm nhỏ hai cách rồi đo; dùng công cụ có sẵn trước khi sửa interpreter | Thực hành threads, asyncio và profiling (Justin nêu). Đã đọc trực tiếp trong phiên: `threading` (ĐÚNG; GIL giới hạn CPU-bound, khuyên multiprocessing), `asyncio` (ĐÚNG), `profile` (ĐÚNG; deprecated từ 3.15: `profiling.tracing` khi phát triển, `profiling.sampling` khi chạy thật) | L07, L08 (chặng 2); L25 (gắn yếu) | L07 nhắc GIL, event loop, `py-spy`; L08 có `def` chạy trong nhóm luồng. Researcher báo ba URL này không đọc được; đọc trực tiếp thì được |
| Python và tư duy viết code (Raymond Hettinger) | Đặt code cũ cạnh code mới; nêu cái giá đo được | Tài liệu: `docs.python.org/3/tutorial/` (ĐÚNG). Debug: `docs.python.org/3/library/pdb.html` (ĐÚNG). Bài tập: exercism (ĐÚNG) | L07 và L11 (gắn yếu) | Không bài nào dạy `enumerate`, `zip`, `defaultdict`. L07 có cặp `naiveCode`/`code` nhưng nội dung là async, không phải idiom. L11 dùng fake. Lỗ hổng 2 (quyết định 11) |
| Distributed systems (Martin Kleppmann) | Định nghĩa trước; nêu bên thua của mỗi đánh đổi | DDIA bản 1 (ĐÚNG một phần; ISBN 978-1449373320 [SUMMARY]); bản 2 chưa xác nhận năm. Thực nghiệm: Jepsen MongoDB 4.2.6 (ĐÚNG; đọc toàn văn, chưa tái tạo) | L09 (chặng 2); L21 (chặng 4); L24 (chặng 6); L10 (gắn yếu) | Không bài nào về consensus hay quorum (đã tìm). Video 7.3 không có transcript |
| Vue.js và thiết kế framework (Evan You) | Nêu ràng buộc trước; nêu lựa chọn đã bỏ kèm lý do | Tài liệu: `vuejs.org/guide/extras/reactivity-in-depth.html` (ĐÚNG). Source: `github.com/vuejs/core` (ĐÚNG; TypeScript, MIT). Demo: `play.vuejs.org` (ĐÚNG; SFC playground) | L12–L19 (chặng 3, 4); L22 (chặng 4, gắn yếu) | Mục `alternatives` có ở nhiều bài, không riêng bài Vue (ví dụ L07, L18, L21) |

Đủ 25 bài đều có ít nhất một dòng; L07 thuộc hai dòng. Gắn yếu (tiêu đề không nói trực tiếp chủ đề của dòng): L07 và L11 (Hettinger), L10 (Kleppmann), L22 (Vue), L23 (Vogels), L25 (Beazley). L01 có đoạn read replica và standby Multi-AZ trong `tradeoff`, có thể gắn thêm vào dòng Kleppmann [INFERENCE]. Dòng Python cơ bản không có bài nào, nên tiêu chí A2 (00-requirement.md) không đạt ở dòng đó. Phép gán dựa trên tiêu đề và các trường đã đọc [INFERENCE]; chưa đọc hết 25 bài.

Hai lỗ hổng cần Justin quyết: (1) thêm bài nhập môn Python; (2) thêm bài idiom Python. Nếu không thêm, người học tự học hai phần này ngoài repo. Thêm bài là đổi phạm vi; đánh số từ L26 (quyết định 3).

## Goals vs. Non-Goals

* **In-Scope Goals:**
  - Viết lại nội dung để người chưa biết sâu AWS, Vue, Python đọc tiếp được, theo giọng dạy ở Analysis mục 3.
  - Mỗi câu “đã làm” có đường dẫn repo hoặc commit. Câu không có bằng chứng viết là “đã đọc” hoặc “chưa làm”.
  - Có tiêu chí đo sau mỗi bài (mục Overview).
* **Out-of-Scope Non-Goals:**
  - Không tạo kinh nghiệm giả. Không gán lời nói, bài viết hay kinh nghiệm cho người đã nêu tên.
  - Không hứa đậu phỏng vấn. Không dùng “100%” làm tiêu chí.
  - Không kiểm lại toàn bộ tính đúng kỹ thuật trong vòng này.
  - Không đọc hoặc sửa file `.pen` bằng `read`, `grep` hay công cụ tìm kiếm văn bản.
  - Không mở nội dung `id_rsa`.

## Key Decisions & Staging for Next Steps

### Trạng thái

Vòng chính thức chạy ngày 2026-10-29, sau khi Justin xác nhận “Review with Goldfishes”. Vòng trước đó chạy khi chưa có xác nhận; đó là lỗi quy trình. Readiness vòng chính thức: chưa đạt, có bốn Blocker ở mục 6. Chưa chạy build; chưa sửa `src/`, `vue-app/` hay file `.pen`. Đã sửa tại dòng 25, 28, 78, 82, 148. Phần còn lại của mục 6 chưa sửa. Sau vòng đó, cùng ngày, thêm mục 3 (cách dạy và URL đã kiểm), mục 7 (lộ trình), bản thử L01 ở `pilot/l01/mo-dau.md` (bước 1–3) và bài L01 đủ bảy bước ở `pilot/l01/bai-l01.md`; các phần này chưa qua Goldfish. Justin nói đã nộp hồ sơ ngày 2026-10-01 và qua sơ tuyển (lời Justin). Cần chạy lại Goldfish sau khi Justin trả lời.

### Quyết định đang mở

1. Đã nộp hồ sơ: Justin nói đã nộp ngày 2026-10-01 và qua sơ tuyển (lời Justin, chưa có bằng chứng). **Đã chốt theo lời Justin.** Còn mở: form nộp đã gửi những gì (CV, link trang, link repo) và ngày phỏng vấn chuyên môn.
2. Chọn A, B hay C, hay làm phép đo nền trước? **Mặc định:** làm phép đo nền theo Blocker 1 (mục 6) rồi mới chọn; không chọn A. Phép thử L01 cũ (đổi thứ tự render) không dùng được vì không có đáp án cho `askFirst`.
3. Phạm vi bài? **Mặc định:** 25 bài, vì repo có 25. Thiết kế Pencil cũ ghi 23. Nếu thêm bài Docker, đánh số L26, không đánh lại số.
4. Ánh xạ bảy bước vào sáu mục? **Mặc định:** bước 1–2 vào mục 01; bước 3–4 vào mục 03; bước 5 vào mục 03 qua trường mới (ví dụ `lab`); bước 6 vào mục 05 bằng bốn câu trong `attacks`; bước 7 vào mục 06 qua `anchor`. Mục 02 và 04 giữ nguyên. Bước 2 cần danh sách tiên quyết cố định cho từng bài. Đo 2026-10-29: `async def` nằm trong mã (`code`, `naiveCode`) của L05, L18, L20, và trong văn xuôi của L07 và L25. `bridge` của L25 giả định người học đã biết `async def` (`41-lessons-deep.js` dòng 58), trong khi Justin tự nhận Python còn yếu. Không bài nào có `expected` hay `lab`.
5. Đích build? **Mặc định:** không chạy `vue-app/build.mjs` cho đến khi Justin duyệt. Script ghi đè `<repo>/index.html` (dòng 102–103) và trang công khai có thể đổi theo. Script không có cờ tắt. Thêm cờ là đổi quy trình mà CONTRACT.md ghi là bắt buộc cho Pages (dòng 383, 409), nên cần Justin quyết.
6. Người tham chiếu? **Mặc định:** giữ tám người trong danh sách mới nhất của Justin. Kelsey Hightower và Bret Victor chưa được xác nhận là bỏ; Justin xác nhận hoặc đưa lại.
7. Đưa repo của Justin vào bài làm ví dụ? **Mặc định:** không, cho đến khi có đường dẫn hoặc commit kiểm được.
8. Khung sáu mục trong `Lesson.vue`? **Mặc định:** giữ nguyên.
9. `id_rsa` có nằm trong lịch sử commit không? Ngoài phạm vi vòng này, nhưng là rủi ro bảo mật. **Mặc định:** không mở file; index hiện tại không có tệp này. Justin kiểm lịch sử commit và `.gitignore`.
10. Giọng “CTO 20 năm” trong yêu cầu gốc: giữ hay bỏ? **Mặc định:** bỏ danh xưng CTO khỏi giọng bài, vì Non-Goals ghi “không tạo kinh nghiệm giả”. Giọng dạy lấy từ mục 3. Justin quyết.
11. Thêm bài nhập môn Python và bài về idiom Python (đánh số từ L26)? **Mặc định:** không thêm; người học tự học hai phần này ngoài repo, như ghi ở mục 7.

### Mạch dạy đề xuất cho mỗi bài (chưa chốt)

1. Câu hỏi thật mở bài. Người học đoán trước.
2. Điều người học đã biết, nối từ thứ họ đã dùng.
3. Một ví dụ có số, gắn nhãn “Giả sử …” (CONTRACT.md dòng 352–353).
4. Cơ chế từng bước, mỗi bước một ý, có một hình.
5. Một lệnh hoặc thí nghiệm nhỏ để tự thấy cơ chế.
6. Bốn câu trong `attacks` (`build.mjs` gốc dòng 595 yêu cầu đúng bốn). Mỗi câu có đáp án trong trường `a`.
7. Một câu neo để nhớ.

### Mốc thời gian

- Hạn nộp hồ sơ: 2026-10-30 (thứ Sáu), theo trang tin. Justin nói đã nộp ngày 2026-10-01; xem quyết định 1.
- Sàng lọc 5 ngày làm việc: Justin nói đã qua. Phỏng vấn chuyên môn: chưa có lịch. Mốc 2026-11-06 và 2026-11-09 của bản trước là ước tính cũ, đã bỏ.

### Các bước tiếp theo

1. Đã nộp và qua sơ tuyển (lời Justin, 2026-10-01). Việc còn lại: chuẩn bị phỏng vấn chuyên môn khi có lịch. Form nộp (CV, link trang, link repo) chưa rõ; brief chưa có thông tin này.
2. Justin trả lời quyết định 2 và 4, kèm ngày chốt mới. Ngày 2026-10-30 cũ gắn với hạn nộp, không còn là mốc. Nếu không trả lời, mặc định chỉ làm phép đo nền ở Blocker 1 và không sửa nội dung bài.
3. Readiness đã trả: chưa sẵn sàng. Sau khi có câu trả lời ở bước 2, cập nhật quyết định 4 và 5, rồi gửi Readiness lại.
4. Nếu chọn C: tạo tài khoản AWS và đặt cảnh báo ngân sách trước khi dựng bất cứ thứ gì.
5. Nếu chọn A hoặc B: viết thử một bài (đề xuất L01). Justin duyệt bài mẫu trước khi viết các bài còn lại.
6. Nếu làm phép đo nền trước: theo Blocker 1 ở mục 6. Chấm bằng `attacks[i].a` của L01, đặt ngưỡng trước khi đo, ghi lại chỗ người đọc bị kẹt.
