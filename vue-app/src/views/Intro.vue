<script setup>
import { computed, inject } from 'vue';

const data = inject('data');
const QUESTIONS = Array.isArray(data.QUESTIONS) ? data.QUESTIONS : [];
const INTROS = data.GROUP_INTROS && typeof data.GROUP_INTROS === 'object' ? data.GROUP_INTROS : {};
const PLANS = data.STUDY_PLANS && typeof data.STUDY_PLANS === 'object' ? data.STUDY_PLANS : {};

const PLAN_ORDER = ['six_hours', 'two_days', 'three_days'];
const planLabels = computed(() =>
  PLAN_ORDER.map((k) => String(PLANS[k]?.label || k)).join(' · ')
);
const planSentence = computed(() =>
  'Mục "Lịch ôn" có ba kịch bản: ' + planLabels.value +
  '. Ít thời gian thì chạy kịch bản 6 giờ; có 2–3 ngày thì chạy kịch bản 2 ngày, phần còn lại dùng kịch bản 3 ngày để luyện sâu.'
);

const groupKeys = computed(() => Object.keys(INTROS).sort());
const countByGroup = computed(() => {
  const m = {};
  for (const q of QUESTIONS) {
    if (q && typeof q.group === 'string') m[q.group] = (m[q.group] || 0) + 1;
  }
  return m;
});
// Cột P0 đếm số câu prio P0 thật của nhóm, không phải độ dài danh sách gợi ý GROUP_INTROS[g].p0.
const p0ByGroup = computed(() => {
  const m = {};
  for (const q of QUESTIONS) {
    if (q && typeof q.group === 'string' && q.prio === 'P0') m[q.group] = (m[q.group] || 0) + 1;
  }
  return m;
});

// Link tới bài học nền tảng của từng nhóm; tooltip lấy tiêu đề bài từ LESSONS.
const LESSON_BY_GROUP = {
  A: ['L07', 'L08', 'L09', 'L10', 'L11'],
  B: ['L12', 'L13', 'L19'],
  C: ['L12', 'L13', 'L14', 'L15', 'L16', 'L17'],
  D: ['L04', 'L18', 'L19', 'L23'],
  E: ['L07', 'L08', 'L09', 'L10', 'L11', 'L18'],
  F: ['L05', 'L08', 'L21', 'L22'],
  G: ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L20', 'L21', 'L22', 'L23'],
  H: ['L10', 'L11', 'L22'],
  I: ['L01', 'L06', 'L08', 'L21'],
  J: ['L01', 'L03', 'L10', 'L22'],
};
const LESSON_TITLE = Object.fromEntries((Array.isArray(data.LESSONS) ? data.LESSONS : []).filter((l) => l && l.id).map((l) => [l.id, l.title]));
</script>

<template>
  <div class="hcp-page">
    <h1 class="hcp-page-title">Bắt đầu: cách dùng tài liệu này</h1>
    <div class="intro-col">
      <section class="hcp-section">
        <h2 class="hcp-h3">Cách dùng</h2>
        <ul>
          <li><strong>Một lượt ôn = một vòng.</strong> Lọc theo nhóm, trả lời miệng trước khi mở đáp án, xong mới đọc phần giải thích sâu.</li>
          <li>Mỗi câu có bốn phần: trả lời miệng 30–60 giây, giải thích sâu, ví dụ code khi có (kèm kết quả đúng và nguyên nhân) và chuỗi hỏi đào sâu.</li>
          <li>Đánh dấu <em>Đã nắm</em> hoặc <em>Cần ôn lại</em> ngay dưới mỗi câu. Tiến độ lưu trong trình duyệt; bật “Chỉ hiện câu đánh dấu yếu” để ôn đúng chỗ đứng.</li>
          <li>Flashcard luyện nhịp trả lời nhanh, Quiz kiểm tra hiểu bằng trắc nghiệm, Mock interview luyện to nhỏ có đồng hồ đếm ngược.</li>
          <li>Case study là một hệ thống duy nhất, đi hết happy path rồi đi hết từng failure mode.</li>
        </ul>
      </section>

      <section class="hcp-section">
        <h2 class="hcp-h3">Lịch ôn</h2>
        <p>{{ planSentence }}</p>
      </section>

      <section class="hcp-section">
        <h2 class="hcp-h3">Nói thẳng về điểm yếu</h2>
        <div class="hcp-note">Nền tảng của bạn mạnh ở Django/DRF, FastAPI, React/TypeScript, PostgreSQL, Docker và CI/CD. Hai chỗ cần dựng lại: <strong>AWS</strong> — đường đi của một request qua API Gateway → Lambda/IAM → RDS hoặc DynamoDB → CloudWatch, và khi nào tách việc nặng sang SQS; <strong>Vue 3</strong> — reactivity, computed so với watch, composable, SFC, và cách trả lời khi được hỏi Vue so với React. Đừng né tránh chỗ này: trả lời thẳng “phần này tôi mới ôn sâu gần đây”, rồi nói rõ bạn đã học bằng cách nào và sẽ làm gì với nó trong dự án thật.</div>
      </section>

      <section class="hcp-section">
        <h2 class="hcp-h3">Tài liệu này là gì và không là gì</h2>
        <div class="hcp-note">
          <ul>
            <li>Đây là bộ câu hỏi luyện tập do tôi tự soạn để ôn cho vị trí Fullstack Engineer, không phải bộ câu hỏi phỏng vấn thật của HiTechCloud. Tôi không có và không khẳng định có đề phỏng vấn hay quy trình tuyển dụng nội bộ của công ty.</li>
            <li>Ba lớp nội dung, đừng gộp chúng làm một. (a) Yêu cầu trong JD: Python tối thiểu 2 năm, thành thạo VueJS, TypeScript là điểm cộng, AWS Lambda/API Gateway/S3/RDS hoặc DynamoDB, Docker, phát hành tự động, theo dõi logs/metrics/chi phí và xử lý lỗi production. (b) Kiến thức nền tảng: Python, JavaScript/TypeScript, HTTP, SQL, Vue, FastAPI/Django — đúng với mọi công ty, không riêng gì đây. (c) Câu hỏi luyện tập trong tài liệu này: tôi viết để tự kiểm tra, có thể khác hẳn đề thật.</li>
            <li>Vì vậy: học để hiểu cơ chế, không học để đoán đề. Câu nào thuộc lớp (a) thì bám sát đúng chữ trong JD; câu nào thuộc lớp (b) thì trả lời bằng cơ chế và tradeoff; và nếu phỏng vấn hỏi thứ không có trong này thì cứ nói thẳng là mình chưa gặp, rồi phân tích từ nền tảng.</li>
          </ul>
        </div>
      </section>

      <section class="hcp-section">
        <h2 class="hcp-h3">Mười nhóm kiến thức</h2>
        <div class="table-wrap">
          <table class="hcp-table">
            <thead>
              <tr><th>Nhóm</th><th>Vì sao phải biết</th><th>Bài học nền tảng</th><th class="num">P0</th><th class="num">Số câu</th></tr>
            </thead>
            <tbody>
              <tr v-for="g in groupKeys" :key="g">
                <td><strong>{{ INTROS[g]?.title || g }}</strong></td>
                <td class="why">{{ INTROS[g]?.why || '' }}</td>
                <td><div class="lesson-links"><a v-for="lid in LESSON_BY_GROUP[g] || []" :key="lid" :href="'#/lesson/' + lid" :title="LESSON_TITLE[lid] || lid">{{ lid }}</a></div></td>
                <td class="num">{{ p0ByGroup[g] || 0 }}</td>
                <td class="num">{{ countByGroup[g] || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.intro-col { max-width: 820px; margin: 0 auto; width: 100%; min-width: 0; display: grid; gap: 24px; }
.hcp-section { min-width: 0; }
.hcp-section p { margin: 0; }
.hcp-section ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
.hcp-note ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
.table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; min-width: 0; max-width: 100%; }
.hcp-table { min-width: 620px; }
.hcp-table td.why { white-space: normal; }
.lesson-links { display: flex; flex-wrap: wrap; gap: 4px 10px; min-width: 0; }
</style>
