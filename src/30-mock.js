var MOCK_SETS = MOCK_SETS || {};

// 1. Night-before cram: must-know only, bounded.
MOCK_SETS.p0_blitz = {
  label: 'Cơn lưu luyện P0 đêm trước phỏng vấn',
  brief: 'Chỉ những câu P0, ưu tiên tầng cơ chế sâu, để bạn quét lại đúng những gì nhà tuyển dụng chắc chắn hỏi trong một buổi ngắn trước ngày phỏng vấn.',
  pick: [
    { prio: 'P0', limit: 25 }
  ]
};

// 2. AWS gap: group G heavy, group H for ops and deploy.
MOCK_SETS.aws_focus = {
  label: 'Bù khoảng trống AWS',
  brief: 'Dồn nhóm G (AWS) và nhóm H (vận hành, triển khai) vào một lượt, vì đây là hai mảng yếu rõ nhất so với JD Fullstack Engineer AWS.',
  pick: [
    { group: 'G', limit: 20 },
    { group: 'H', limit: 8 }
  ]
};

// 3. Vue gap: group C heavy, group B as the JS/TS substrate.
MOCK_SETS.vue_focus = {
  label: 'Bù khoảng trống VueJS',
  brief: 'Nhóm C (VueJS) là trọng tâm, nhóm B (JavaScript, TypeScript) là nền để bạn đủ tự tin về reactivity, lifecycle và typing.',
  pick: [
    { group: 'C', limit: 20 },
    { group: 'B', limit: 8 }
  ]
};

// 4. The foundation the candidate already has; keep it sharp.
MOCK_SETS.python_sql_core = {
  label: 'Nền tảng Python và SQL',
  brief: 'Nhóm A cùng nhóm E và F để bạn giữ chắc Python cốt lõi và SQL thực chiến, phần vốn mạnh không được hở khi đến phần hỏi về dữ liệu.',
  pick: [
    { group: 'A', limit: 9 },
    { group: 'E', limit: 9 },
    { group: 'F', limit: 9 }
  ]
};

// 5. API surface plus the security questions that come attached to it.
MOCK_SETS.web_api_security = {
  label: 'API, web và bảo mật',
  brief: 'Nhóm D (HTTP, CORS, cookie, CSP) gặp nhóm H (secret, CloudWatch, chi phí) ở các câu hỏi về presigned URL, token và lỗ hổng khi nói chuyện về sản phẩm thật.',
  pick: [
    { group: 'D', limit: 12 },
    { group: 'H', limit: 10 }
  ]
};

// 6. Full-length mock, mixed across all groups.
MOCK_SETS.full_mock = {
  label: 'Full mock 30 câu, giống phòng phỏng vấn thật',
  brief: 'Trộn P0 và P1 với các nhóm I và J để bạn quen nhịp trả lời dưới áp lực thời gian, đúng thứ tự và độ khó của một buổi phỏng vấn thực tế.',
  pick: [
    { prio: 'P0', limit: 14 },
    { prio: 'P1', limit: 8 },
    { group: 'D', limit: 3 },
    { group: 'I', limit: 3 },
    { group: 'J', limit: 3 }
  ]
};
