# Brief: một lượt review độc lập cho bộ 25 bài trong `D:/research/lessons`

## Bối cảnh

`lessons/` chứa 25 bài giảng tiếng Việt, viết lại từ 25 bài có sẵn trong app (`src/`, nằm ngoài đường build nên app không đổi). Mục tiêu của bản viết lại: người chưa biết gì đọc từ đầu tới cuối là hiểu cơ chế, làm được phép tính, và trả lời được câu hỏi phỏng vấn cùng chủ đề.

Mỗi bài có cấu trúc cố định 7 bước + khối `Ghi chú nguồn`:

1. Đoán trước
2. Điều bạn đã biết
3. Một ví dụ có số
4. Cơ chế, từng bước một
5. Thí nghiệm nhỏ
6. Bốn câu luyện tập (mỗi câu có `<details><summary>Đáp án</summary>`, trong đáp án có ba nhãn: `Kết luận:`, `Điều kiện để đúng:`, `Cách kiểm:`)
7. Câu neo
8. Ghi chú nguồn (link + điều link xác nhận + dòng "Chưa kiểm trong bài này: ...")

Mỗi bài có script kèm theo trong `lessons/<chương>/lXX/`, và khối output trong bài được dán từ lần chạy thật. Script dùng Python 3.14 (`C:/Users/ADMIN/AppData/Roaming/uv/python/cpython-3.14-windows-x86_64-none/python.exe`) hoặc `node`. Một số bài cần `PYTHONPATH` trỏ vào `.venv/Lib/site-packages` cùng thư mục.

Danh sách 25 bài: xem `lessons/README.md`.

## Việc cần làm

Review với tư duy phản biện. Không khen, không tóm tắt lại nội dung. Chỉ báo lỗi có thể sửa được, kèm vị trí.

Ưu tiên theo thứ tự:

1. **Sai kỹ thuật.** Câu nào khẳng định điều không đúng về AWS / Python / Vue / PostgreSQL / HTTP? Đối chiếu tài liệu chính thức khi cần (web). Ghi rõ: file, dòng, câu sai, điều đúng là gì, nguồn.
2. **Output không khớp lần chạy.** Chạy thử script của bài (ưu tiên các bài có số liệu then chốt) và so với khối output dán trong bài. Báo lệch cụ thể.
3. **Số liệu không được đánh dấu.** Con số nào trình bày như dữ kiện thật nhưng thực ra là giả định của kịch bản mà không có chữ "Giả sử" hoặc `[CHƯA KIỂM]` gần đó?
4. **Chỗ người mới sẽ hiểu sai.** Câu dẫn tới kết luận sai, hoặc nhảy bước khiến người chưa biết không theo được.
5. **Vi phạm khuôn.** Sai số bước, thiếu nhãn trong đáp án, biến thể nhãn, mermaid sai cú pháp.

## Không làm

- Không sửa file. Chỉ báo cáo.
- Không góp ý văn phong, độ dài, cách hành văn, hay "nên thêm ví dụ".
- Không báo lại điều đã đúng.
- Không đề xuất viết lại cả bài.

## Định dạng trả về

Danh sách phẳng, mỗi mục một dòng hoặc một khối ngắn:

```
[file:dòng] mức độ (sai / lệch / thiếu dấu / khó hiểu / khuôn) — mô tả — sửa thành gì
```

Cuối cùng một dòng tổng: số mục theo từng mức độ. Nếu một mục chỉ là nghi ngờ chưa kiểm được, ghi rõ "chưa kiểm".
