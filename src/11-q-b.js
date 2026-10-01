var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
  {
    id: 'B01',
    group: 'B',
    topic: 'Primitive vs reference, mutation va shallow copy',
    prio: 'P1',
    level: 'L2',
    type: 'concept',
    q: 'Trong JavaScript, primitive va reference khac nhau the nao khi gan va khi truyen vao ham? (ban day du dau tieng Viet trong file that)',
    oral: 'Day la ban cho ky thuat viet; ban chinh trong file se viet day du tieng Viet co dau, giai thich primitive sao chep theo gia tri con object array function sao chep theo dia chi tham chieu, const chi khoa binding khong khoa noi dung, spread chi shallow copy, muon doc lap hoan toan can deep copy nhu structuredClone.',
    deep: '<p><strong>Primitive</strong> duoc sao chep theo gia tri, con <strong>object, array va function</strong> duoc sao chep theo dia chi tham chieu.</p><ul><li><strong>Cach hoat dong:</strong> gan primitive tao gia tri doc lap; gan object chi copy dia chi.</li><li><strong>Vi sao can:</strong> hau het bug state frontend deu tu chia se tham chieu vo tinh.</li><li><strong>Khi nao dung:</strong> chia se tham chieu khi co y dung chung state; copy khi can snapshot doc lap.</li><li><strong>Khi nao khong:</strong> khong deep copy mu quang vi ton CPU va bo nho.</li><li><strong>Loi pho bien:</strong> tuong const lam object bat bien; tuong spread la deep copy.</li><li><strong>Dieu kien doi:</strong> object phang thi spread du; object long nhau phai copy sau.</li></ul>',
    code: 'const a = { user: { name: "An" } };\nconst b = a;\nconst c = { ...a };\nconsole.log(c.user === a.user);',
    expected: null,
    followups: [
      { q: 'Spread la shallow copy, khi nao chon deep copy?', a: 'Chi deep copy khi object long nhau va can snapshot doc lap that su, vi du state truoc khi edit form; du lieu thuan dung structuredClone, object chua function hay Date thi copy thu cong tung nhanh.' },
      { q: 'Object.freeze co ngan moi mutation khong?', a: 'Khong, freeze mac dinh chi shallow: thuoc tinh ngoai khong gan lai duoc nhung object long ben trong van sua binh thuong; muon dong bang sau phai de quy freeze tung nhanh.' }
    ],
    pitfalls: ['Tuong const khien object bat bien, trong khi const chi khoa binding.', 'Tuong spread la deep copy, trong khi object long nhau van chia se tham chieu.'],
    selfcheck: ['Chua giai thich duoc vi sao c.user === a.user van dung sau spread.', 'Giai thich duoc vi sao sua object long nhau qua ban copy spread lai doi ca ban goc.', 'Chon duoc shallow hay deep copy khi viet form giu ban goc trong du an that.'],
    refs: ['mdn-execution-model']
  }
);
