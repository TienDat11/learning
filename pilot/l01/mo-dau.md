# L01: bản thử mở đầu (bước 1–3 của mạch dạy)

Trạng thái: bản thử, nằm ngoài `src/`, chưa nối vào `Lesson.vue`. Số liệu là giả định của kịch bản: 200 request mỗi giây, mỗi lần gọi 0,6 giây, RDS đặt `max_connections = 40`.

## Bước 1. Đoán trước

Trước khi đọc tiếp, hãy đoán. Endpoint đăng ký upload nhận 200 request mỗi giây. Mỗi lần gọi Lambda mất 0,6 giây. Giả sử mỗi environment của Lambda giữ một kết nối tới RDS. RDS chỉ nhận tối đa 40 kết nối.

Hỏi: có bao nhiêu lần gọi chạy cùng lúc? Có bao nhiêu lần gọi không có kết nối?

Viết đáp án ra giấy rồi đọc tiếp. Đáp án ở cuối bước 3.

## Bước 2. Điều bạn đã biết

Bạn đã từng chạy một API trên một máy, và API đó mở vài kết nối tới PostgreSQL. Khi có quá nhiều kết nối, PostgreSQL trả về lỗi `FATAL: sorry, too many clients already`. Bài này giữ nguyên chuỗi đó và thay từng khớp bằng một dịch vụ AWS: API Gateway nhận request, Lambda chạy code, RDS giữ dữ liệu.

Điểm khác cần nhớ: trên một máy, nhiều request dùng chung một pool kết nối. Trên Lambda, mỗi request đồng thời được một environment riêng.

## Bước 3. Một ví dụ có số

Giả sử endpoint nhận 200 request mỗi giây, mỗi lần gọi Lambda mất 0,6 giây.

Mỗi giây có 200 request mới. Mỗi request chiếm một environment trong 0,6 giây. Số lần gọi đang chạy cùng lúc là 200 × 0,6 = 120. Vậy Lambda cần 120 environment.

Giả sử code mở kết nối ngoài handler: mỗi environment mở một kết nối tới RDS rồi giữ lại cho các lần gọi sau. Vậy có 120 kết nối cần mở.

RDS chỉ cấp 40 kết nối. 120 − 40 = 80 lần gọi không có kết nối. Chúng phải chờ, hoặc nhận lỗi.

Đáp án bước 1: 120 lần gọi chạy cùng lúc; 80 lần gọi không có kết nối.

## Tiếp theo

Bước 4 (cơ chế từng bước) chưa viết. Bước 5 (thí nghiệm nhỏ) đã có script `pilot/l01/little_law.py`, nhưng chưa thành bước trong bài.

Script đã chạy ngày 2026-10-29 bằng Python 3.14 của uv, vì `python` không có trên PATH:

- `--rps 200 --wall 0.6 --max-conn 40`: 120 environment, 120 kết nối cần, 80 lần gọi không có kết nối.
- `--rps 200 --wall 0.2 --max-conn 40`: 40 environment, vừa khít trần 40.
