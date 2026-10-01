var STUDY_PLANS = STUDY_PLANS || {};

// Key duy nhất chấp nhận: label, blocks[]; mỗi block: what, how, pick[].
// pick entry: { group?, prio?, level?, type?, limit? } — limit luôn bắt buộc để set có giới hạn.
STUDY_PLANS.six_hours = {
  label: 'Gói 6 giờ — dồn lực vào P0 của AWS, Vue và Python',
  blocks: [
    {
      what: 'AWS P0: Lambda, API Gateway, S3, IAM, RDS/DynamoDB — phần bạn yếu nhất, phải trả lời được không cần mở tài liệu.',
      how: '80 phút, 10 câu P0 nhóm G, mỗi câu 6 phút: đọc q, trả lời miệng 60 giây không nhìn `oral`, mới mở `oral` để đối chiếu, câu nào sai hoặc nói ổng định dánh đỏ. 10 phút cuối: chép lại 3 dòng cốt lõi (cold start + memory, presigned URL hết hạn, least privilege) vào một mảnh giấy, đó là phần bạn sẽ nói sai nhiều nhất dưới áp lực.',
      pick: [{ group: 'G', prio: 'P0', limit: 8 }]
    },
    {
      what: 'Vue P0: reactivity (ref/reactive/computed), props và emits một chiều, v-model, key ổn định trong v-for, cấu trúc SFC.',
      how: '80 phút, 8 câu P0 nhóm C. Với câu `predict` và `debug`, chạy code trong đầu rồi mới xem `expected`; dừng lại 30 giây sau mỗi câu để tự nói tiếp phần "khi nào điều này đổi thì câu trả lời đổi ra sao". 10 phút cuối: vẽ tay một component dùng `ref` + `computed` + `watch` và nói rõ mỗi cái dùng để làm gì.',
      pick: [{ group: 'C', prio: 'P0', limit: 7 }]
    },
    {
      what: 'Python P0: data model, closure, GIL và threading, async/await, typing, quy ước exception — nền để mọi câu hỏi kỹ thuật khác đứng vững.',
      how: '70 phút, 7 câu nhóm A theo thứ tự P0 trước. Mỗi câu: 5 phút tự trả lời miệng, sau đó đọc `deep` và tự bổ sung một ví dụ nhỏ do bạn tự nghĩ ra — không nhớ thì học lại từ ví dụ, không học lại từ định nghĩa. Câu nào bạn cần mở tài liệu mới hiểu thì ghi vào giấy làm nợ sạch cho buổi sau.',
      pick: [{ group: 'A', limit: 7 }]
    },
    {
      what: 'FastAPI và Django P0: vòng đời request, Pydantic v2, async def trong DB driver, dependency injection cho auth, N+1.',
      how: '60 phút, 5 câu P0 nhóm E. Ở mỗi câu, hãy tự viết một dòng "nếu tôi triển khai hôm nay" — ví dụ câu async gọi driver đồng bộ thì câu trả lời phải kèm cách chạy worker process hoặc đổi sang async client. Không hiểu sâu phần nào thì đánh dấu, đó là danh sách ưu tiên cho gói 2 ngày.',
      pick: [{ group: 'E', prio: 'P0', limit: 5 }]
    },
    {
      what: 'Postgres và kiểm thử P0: index, EXPLAIN, transaction, isolation, N+1, pytest.',
      how: '60 phút: 4 câu P0 nhóm F rồi 4 câu P1 cùng nhóm để lấp chỗ trống, xen kẽ 5 phút hỏi lại. 15 phút cuối của gói: quay lại 6 câu đã đánh dấu đỏ ở bốn block trước, chỉ trả lời miệng, không mở `oral`. Câu nào trả lời trôi chảy thì bỏ qua, câu nào vẫn vấp thì viết lại bằng một câu tự đặt.',
      pick: [{ group: 'F', prio: 'P0', limit: 4 }, { group: 'F', prio: 'P1', limit: 4 }]
    }
  ]
};

STUDY_PLANS.two_days = {
  label: 'Gói 2 ngày — ngày 1 nền tảng, ngày 2 AWS, ops và một bộ mock',
  blocks: [
    {
      what: 'Nền Python và JavaScript: data model Python, closure, event loop, Promise, `this`, CORS, HTTP.',
      how: '90 phút buổi sáng ngày 1: 6 câu nhóm A, 4 câu nhóm B. Luân phiên 10 phút đọc q — 4 phút tự trả lời — 3 phút đọc `deep` — 3 phút nói lại bằng ví dụ riêng. 15 phút cuối dùng cho câu `predict` và `debug`, phần này sai nhiều nhất vì dễ đoán theo thói quen.',
      pick: [{ group: 'A', limit: 6 }, { group: 'B', limit: 4 }]
    },
    {
      what: 'Vue toàn diện: reactivity, component, vòng đời, composable, Pinia, router, form và hiệu năng.',
      how: '100 phút: 6 câu P0 nhóm C trước, 4 câu P1 sau, rồi 2 câu L3 (watch cleanup với race condition, guard frontend không thay phân quyền backend). Không đọc `code` trước khi tự dự đoán kết quả. 10 phút cuối: mở một dự án Vue có sẵn, tự tìm một chỗ đang dùng `watch` sai và giải thích lại lỗi đó bằng lời của bạn.',
      pick: [{ group: 'C', prio: 'P0', limit: 6 }, { group: 'C', prio: 'P1', limit: 4 }, { group: 'C', level: 'L3', limit: 2 }]
    },
    {
      what: 'Web và bảo mật: HTTP, cookie, CSP, OWASP API security, rate limit, xác thực.',
      how: '80 phút, 7 câu nhóm D. Với mỗi câu bảo mật, trả lời theo 3 nhịp: lỗ hổng là gì — kẻ tấn công làm gì — bạn chặn bằng cấu hình cụ thể nào. Câu nào bạn chỉ nói được định nghĩa mà không nêu được cấu hình thì đánh dấu đỏ, đó là điểm phỏng vấn hay soi nhất.',
      pick: [{ group: 'D', limit: 7 }]
    },
    {
      what: 'FastAPI và Django: DI, auth, transaction, background task, test, so sánh serializer với Pydantic.',
      how: '90 phút: 6 câu P0 nhóm E để chắc nền, 3 câu P1 để có chiều sâu. Sau mỗi câu tự thêm một điều kiện đổi: "nếu traffic lên gấp 10" hoặc "nếu chuyển sang serverless" thì câu trả lời đổi ở đâu. Đây là kỹ năng phỏng vấn L3, làm quen từ hôm nay.',
      pick: [{ group: 'E', prio: 'P0', limit: 6 }, { group: 'E', prio: 'P1', limit: 3 }]
    },
    {
      what: 'Postgres: index, EXPLAIN, MVCC, transaction, constraint, upsert, pagination.',
      how: '90 phút: 4 câu P0 nhóm F, 3 câu L3 nhóm F. Với câu L3, bạn phải nói ra điều kiện nào làm câu trả lời đổi — ví dụ isolation level khác nhau thì hiện tượng đọc lặp khác nhau thế nào. 15 phút cuối: mở `sql:pg-explain` và dự đoán trước khi đọc câu trả lời.',
      pick: [{ group: 'F', prio: 'P0', limit: 4 }, { group: 'F', level: 'L3', limit: 3 }]
    },
    {
      what: 'AWS ngày 2 buổi sáng: serverless (Lambda, API Gateway, S3, presigned URL), hạ tầng bền (RDS, DynamoDB, SQS, DLQ, VPC), quan sát và chi phí.',
      how: '150 phút, chia làm ba vòng 50 phút: vòng 1 lấy 6 câu P0 nhóm G; vòng 2 lấy 3 câu L3 nhóm G cộng 2 câu P0 nhóm H; vòng 3 lấy 3 câu L3 nhóm H. Mỗi câu AWS bắt buộc có một câu hỏi tự vấn: "vận hành cái này ở production, tôi sẽ cấu hình gì và tôi sẽ bị đánh phí ở đâu". Cuối vòng, nói lại SQS visibility timeout và DLQ không đọc code.',
      pick: [{ group: 'G', prio: 'P0', limit: 6 }, { group: 'G', level: 'L3', limit: 3 }, { group: 'H', prio: 'P0', limit: 2 }, { group: 'H', level: 'L3', limit: 2 }]
    },
    {
      what: 'Ops và mock buổi chiều ngày 2: Docker multi-stage, image nhỏ, GitHub Actions, systemd, signal; rồi một bộ mock có bấm giờ.',
      how: '80 phút cho 5 câu nhóm I và 4 câu nhóm J, đọc q, trả lời miệng, không mở `deep` trừ khi đã trả lời xong. 70 phút cuối chạy một bộ mock trong app dưới điều kiện phỏng vấn thật: đồng hồ đếm ngược, không tra cứu, hết giờ thì bỏ câu đó qua. Ghi lại số câu bị bỏ và lý do; danh sách đó chính là đầu vào của gói 3 ngày.',
      pick: [{ group: 'I', limit: 5 }, { group: 'J', limit: 4 }]
    }
  ]
};

STUDY_PLANS.three_days = {
  label: 'Gói 3 ngày — hết nền tảng, đào sâu AWS và Vue, rồi full mock',
  blocks: [
    {
      what: 'Python và JS nền: data model, closure, event loop, GIL, async, `this`, CORS, HTTP.',
      how: '60 phút buổi sáng ngày 1: 5 câu P0 nhóm A và 3 câu nhóm B. Quy tắc tối giản: chỉ mở `oral` sau khi đã nói hết 60 giây tự trả lời, nói liền một mạch như trong phỏng vấn thật.',
      pick: [{ group: 'A', limit: 5 }, { group: 'B', limit: 3 }]
    },
    {
      what: 'Vue lần 1: những gì bạn dùng hằng ngày — ref, reactive, computed, watch, props/emits, v-model, key.',
      how: '90 phút: 7 câu P0 nhóm C. Với từng câu, dự đoán output hoặc lỗi trước khi đọc `expected`; câu nào bạn đoán sai là dấu hiệu bạn đang đoán theo React, đánh dấu ngay để ôn lại bằng chính câu đó.',
      pick: [{ group: 'C', prio: 'P0', limit: 7 }]
    },
    {
      what: 'Web, SQL, FastAPI: HTTP và bảo mật, index và transaction, DI, auth, N+1, test.',
      how: '120 phút chia làm ba phần 40 phút: 4 câu nhóm D, 4 câu nhóm F, 4 câu nhóm E. Mỗi phần kết thúc bằng 5 phút nói liệu những gì mình vẫn chưa chắc — thằng nào chưa chắc thì ghi lại, không ngại.',
      pick: [{ group: 'D', limit: 4 }, { group: 'F', prio: 'P0', limit: 4 }, { group: 'E', prio: 'P0', limit: 4 }]
    },
    {
      what: 'Vue lần 2 đào sâu: watch cleanup với race condition, guard, composable, Pinia, form và accessibility, câu L3.',
      how: '90 phút buổi chiều ngày 1: 4 câu P1 nhóm C cộng 2 câu L3. Sau mỗi câu, thêm một điều kiện đổi và nói lại câu trả lời: request chậm hơn, người dùng đổi tab, store bị sửa từ nhiều nơi. 15 phút cuối tự viết một composable 20 dòng và giải thích vòng đời dispose của nó.',
      pick: [{ group: 'C', prio: 'P1', limit: 4 }, { group: 'C', level: 'L3', limit: 2 }]
    },
    {
      what: 'AWS serverless và dữ liệu: Lambda, API Gateway, S3 và presigned URL, RDS, DynamoDB, IAM.',
      how: '110 phút buổi sáng ngày 2: 6 câu P0 nhóm G, 2 câu L3 nhóm G. Với mỗi câu, nói thêm một câu về vận hành: log ở đâu, metric nào báo động, giới hạn nào sẽ giết tiến trình. 10 phút cuối học thuộc sự khác nhau giữa eventual và strongly consistent của DynamoDB bằng chính câu tự đặt, không học lý thuyết suông.',
      pick: [{ group: 'G', prio: 'P0', limit: 6 }, { group: 'G', level: 'L3', limit: 2 }]
    },
    {
      what: 'AWS vận hành và quan sát: SQS và DLQ, VPC, CloudWatch, Secrets, CloudFront, ECS, IaC, chi phí.',
      how: '100 phút buổi chiều ngày 2: 3 câu P0 nhóm H, 3 câu L3 nhóm H, 2 câu L3 nhóm I. Bắt buộc trả lời kèm sự đánh đổi: độ trễ so với độ phức tạp, chi phí so với vận hành. Cuối buổi chốt một sơ đồ nhỏ: từ request vào API Gateway đến SQS, Lambda, DynamoDB, CloudWatch, DLQ.',
      pick: [{ group: 'H', prio: 'P0', limit: 3 }, { group: 'H', level: 'L3', limit: 3 }, { group: 'I', level: 'L3', limit: 2 }]
    },
    {
      what: 'Mock toàn bộ: một bộ mock có bấm giờ, không tra cứu, mô phỏng đúng nhịp phỏng vấn.',
      how: '90 phút sáng ngày 3: chạy một bộ mock trong app, mỗi câu 2 phút, hết giờ thì đánh dấu bỏ và nói tiếp câu sau. Sau mỗi câu chỉ chấm 1 điểm: bạn đã tự nói ra được câu trả lời chưa. Không xem lại `oral` giữa chừng, xem lại sau buổi mock thôi.',
      pick: [{ group: 'G', limit: 4 }, { group: 'C', limit: 4 }, { group: 'A', limit: 3 }, { group: 'E', limit: 3 }]
    },
    {
      what: 'Rà yếu và chốt: quay lại đúng những câu đã bỏ trong mock, đào sâu nhóm bạn yếu nhất, tập trả lời theo nguyên nhân gốc.',
      how: '90 phút cuối ngày 3: 20 phút cho câu đỏ trong mock, 40 phút đào sâu nhóm yếu nhất (thường là G hoặc C, chọn theo danh sách đỏ của chính bạn), 30 phút tổng kết. Cách tổng kết: mỗi nhóm một dòng "tôi tự tin vào X, còn yếu Y", rồi nói thành lời một câu tự giới thiệu 60 giây nối từ kinh nghiệm Django/React sang vị trí AWS/Python/Vue.',
      pick: [{ group: 'G', prio: 'P0', limit: 3 }, { group: 'C', prio: 'P0', limit: 3 }, { group: 'H', level: 'L3', limit: 2 }, { level: 'L3', limit: 3 }]
    }
  ]
};

