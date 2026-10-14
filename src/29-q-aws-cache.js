var QUESTIONS = QUESTIONS || [];
QUESTIONS.push(
{
id: 'G22',
group: 'G',
topic: 'ElastiCache: cache-aside, TTL, invalidation khi ghi và giá cũ sau khi admin sửa',
prio: 'P1',
level: 'L2',
type: 'situation',
q: 'API danh sách sản phẩm lấy dữ liệu từ RDS đang chậm. Bạn thêm ElastiCache theo mẫu cache-aside với TTL, nhưng admin sửa giá xong người dùng vẫn thấy giá cũ. Bạn thiết kế việc đọc, ghi và xóa cache thế nào, đặt cache trong VPC ra sao, và khi nào không nên cache?',
attacks: [
  { q: 'Nếu TTL đã giới hạn giá cũ trong 10 phút, sao còn phải vô hiệu hóa cache khi ghi?', a: 'TTL là lưới an toàn về thời gian, không phải cơ chế đồng bộ. Trong 10 phút đó người dùng vẫn thấy giá cũ, và với sản phẩm đang giảm giá thì sai lệch này gây hậu quả thật. Sau khi RDS commit, ứng dụng báo cache bỏ bản cũ, giống CDN purge, để lần đọc kế tiếp lấy giá mới. TTL vẫn giữ để bắt trường hợp lệnh vô hiệu hóa bị lỗi giữa đường.' },
  { q: 'Sao không ghi giá mới vào cache luôn (write-through) thay vì vô hiệu hóa?', a: 'Write-through giữ cache luôn mới, nhưng mỗi lần ghi phải làm hai việc và cache có thể chứa cả dữ liệu không ai đọc. Vô hiệu hóa đơn giản hơn: lần đọc sau tự nạp lại từ RDS. Với danh sách có nhiều trang và bộ lọc, ghi lại toàn bộ kết quả liên quan vào cache khó và dễ sót hơn nhiều so với bỏ key cũ. Đổi lại, lần đọc đầu sau khi vô hiệu hóa chậm hơn một chút.' },
],
incident: '<p><strong>Tình huống giả định:</strong> trang bán hàng gọi API danh sách sản phẩm. API đọc từ ElastiCache với TTL 600 giây, tức mỗi key hết hạn sau 10 phút.</p><p><strong>Chuyện xảy ra:</strong> admin hạ giá một mặt hàng từ 500.000 xuống 350.000 đồng và lưu thành công vào RDS. Trong 10 phút sau đó trang danh sách vẫn hiện 500.000, còn trang chi tiết, vốn đọc thẳng từ RDS, hiện 350.000.</p><p><strong>Hậu quả:</strong> khách thêm hàng theo giá trên danh sách rồi khiếu nại khi thanh toán ra mức khác.</p>',
askFirst: [
  'Khi admin sửa giá, cache nào phải bị vô hiệu hóa, và làm việc đó trước hay sau khi ghi RDS được xác nhận (commit)?',
  'Nếu danh sách có phân trang và bộ lọc, làm sao biết cần bỏ những key nào mà không phải quét toàn bộ cache?'
],
predict: { q: 'Bạn đoán: admin mở transaction trên RDS, cập nhật giá, rồi xóa key trong cache trước khi commit. Ngay sau đó một khách đọc danh sách bị trượt cache, đọc RDS lúc commit chưa xong nên vẫn thấy giá cũ, và ghi giá cũ vào cache. Giá cũ tồn tại bao lâu, và bạn phát hiện sự cố bằng gì?', a: '<p><strong>Giá cũ sống tới khi TTL hết hạn</strong> hoặc tới lần xóa tiếp theo. Lệnh xóa đã chạy trước commit nên không có gì xóa lại bản cũ vừa được ghi.</p><p><strong>Cách sửa</strong> là vô hiệu hóa sau khi commit thành công. Muốn chắc hơn, có thể xóa thêm một lần sau một khoảng ngắn; đây là mẫu của ứng dụng, không phải tính năng tự động của ElastiCache.</p><p><strong>Phát hiện</strong> không đến từ CloudWatch, vì CloudWatch chỉ đo số lượt trúng và trượt cache, không so sánh nội dung giá. Cần một kiểm thử tự động đối chiếu giá từ API với giá trong RDS.</p>' },
anchor: 'Cache là bản sao của RDS, và bản sao không tự đổi khi bản gốc đổi: TTL chỉ giới hạn thời gian sai, còn vô hiệu hóa đúng lúc sau khi ghi được xác nhận mới chặn được sai lệch.',
oral: 'Nguyên nhân giá cũ nằm ở bước ghi, không nằm ở TTL. Tôi đặt ElastiCache theo mẫu cache-aside: đọc cache trước, trượt thì đọc RDS rồi ghi kết quả vào cache với TTL ngắn, ví dụ 300 giây. Cache như Redis hay Memcached chỉ tự hết hạn theo thời gian, nó không biết RDS vừa đổi, nên sau khi admin sửa giá, trang danh sách vẫn trả bản cũ. Cách tôi xử lý là đưa số version vào tên key, ví dụ products:list:v7:laptop:1, rồi tăng version bằng INCR sau khi RDS commit. Cách này gần giống CDN purge, nhưng không cần liệt kê từng key. Trên production tôi không xóa key trước commit, vì một request đọc xen vào lúc transaction chưa xong sẽ ghi lại giá cũ và giá cũ sống tới hết TTL. TTL vẫn giữ làm lưới an toàn khi lệnh INCR bị timeout. Về mạng, ElastiCache nằm trong private subnet của VPC, security group chỉ nhận cổng 6379 từ security group của API, không mở 0.0.0.0/0. Tôi không cache giá lúc thanh toán; bước đó đọc thẳng từ RDS trong transaction.',
deep: '<p><strong>Thuật ngữ cần biết</strong></p><ul><li><strong>Cache-aside</strong>: ứng dụng tự đọc cache trước, trượt thì đọc RDS rồi tự ghi vào cache. Giống tủ lạnh nhà bạn: thiếu món nào thì đi chợ rồi cất vào tủ.</li><li><strong>TTL</strong>: số giây một key còn tồn tại trước khi tự hết hạn. Giống hạn dùng trên hộp sữa.</li><li><strong>Cache stampede</strong>: một key nóng hết hạn, hàng nghìn request cùng trượt và cùng đập vào RDS.</li><li><strong>Key</strong>: tên tra cứu một mục trong cache, ví dụ products:list:v7:laptop:1.</li><li><strong>Security group</strong>: tường lửa gắn vào tài nguyên, quyết định nguồn nào được nối vào cổng nào. Giống bảng danh sách khách được vào cổng.</li><li><strong>Commit</strong>: lệnh xác nhận ghi xuống RDS. Trước commit, người khác vẫn có thể thấy dữ liệu cũ.</li></ul><p><strong>Cache-aside</strong> là mẫu lazy loading: cache chỉ nạp khi có người hỏi. ElastiCache là dịch vụ Redis hoặc Memcached được AWS quản lý, còn việc đồng bộ với RDS do ứng dụng tự lo.</p><p><strong>Vô hiệu hóa</strong> là bước đồng bộ. Sau khi RDS commit, ứng dụng báo cache bỏ bản cũ, giống CDN purge. Với danh sách có phân trang, đưa version vào tên key để không phải quét từng key.</p><p><strong>TTL</strong> là lưới an toàn. Lệnh vô hiệu hóa có thể timeout, hoặc tiến trình chết ngay sau commit, nên TTL giới hạn thời gian sai tối đa. TTL 300 giây hợp lý cho danh sách; TTL vài ngày thì một lần lỗi sẽ để giá cũ tồn tại quá lâu.</p><p><strong>Rủi ro của version</strong>: nếu key version bị eviction rồi khởi tạo lại bằng 0, các key v0 còn sống có thể trả giá cũ. Giảm rủi ro bằng TTL ngắn cho mọi key danh sách, và chính sách eviction không xóa key version trước key dữ liệu.</p><p><strong>VPC và mạng</strong>: ElastiCache đặt trong private subnet, không có IP công khai. Security group của cache chỉ cho phép TCP 6379 từ security group của API, không mở 0.0.0.0/0. Bật mã hóa khi truyền (TLS) để dữ liệu không đi dạng rõ.</p><p><strong>Không cache dữ liệu quyết định ghi</strong>: giá lúc tạo đơn phải đọc từ RDS trong transaction. Cache chỉ dùng để hiển thị như danh sách, ảnh, tên và mô tả sản phẩm.</p><p><strong>Chống stampede</strong>: single-flight (chỉ một request đi nạp lại, các request khác chờ kết quả), jitter cho TTL để key không hết hạn cùng lúc, và giới hạn số truy vấn đồng thời tới RDS.</p>',
code: `import json
import os
import redis

cache = redis.Redis(
    host=os.environ["ELASTICACHE_HOST"],
    port=6379,
    ssl=True,  # mã hóa khi truyền (TLS)
    decode_responses=True,
    socket_timeout=0.2,
)
TTL_SECONDS = 300
VERSION_KEY = "products:list:version"

# ✅ Cách làm chuẩn: cache-aside, đọc cache trước rồi mới đọc RDS.
def list_products(db, category, page):
    version = cache.get(VERSION_KEY) or "0"
    key = f"products:list:v{version}:{category}:{page}"
    cached = cache.get(key)
    if cached is not None:
        return json.loads(cached)
    rows = db.query_products(category=category, page=page)  # cache miss: đọc RDS
    cache.set(key, json.dumps(rows), ex=TTL_SECONDS)
    return rows

# ✅ Cách làm chuẩn: vô hiệu hóa sau khi transaction commit thành công.
def update_price(db, product_id, new_price):
    db.update_price(product_id, new_price)  # trả về sau khi commit
    cache.incr(VERSION_KEY)  # mọi key cũ không còn được đọc`,
expected: null,
followups: [
  { q: 'Vì sao TTL vẫn cần dù đã vô hiệu hóa cache khi ghi?', a: 'Vô hiệu hóa khi ghi là đường chính, nhưng nó có thể thất bại: lệnh gửi tới ElastiCache bị timeout, tiến trình sập sau commit mà chưa kịp vô hiệu hóa, hoặc một request khác ghi lại bản cũ ngay sau đó. TTL là lưới an toàn giới hạn thời gian sai tối đa, không cần biết lỗi xảy ra ở đâu. Vì vậy TTL 300 giây cho danh sách là hợp lý; TTL vài ngày thì một lần lỗi sẽ để giá cũ tồn tại vài ngày.' },
  { q: 'Nếu bạn dùng version trong tên key, khi nào cách này có thể trả giá cũ?', a: 'Version hoạt động nhờ lệnh INCR và đưa số đó vào tên key. Rủi ro xuất hiện khi key version bị loại khỏi cache, ví dụ do eviction, rồi bị khởi tạo lại bằng 0; khi đó các key v0 còn sống có thể trả giá cũ. Giảm rủi ro bằng TTL ngắn cho mọi key danh sách và chính sách eviction không xóa key version trước. Nếu vẫn lo, lưu version trong RDS và đọc từ đó.' },
  { q: 'Nếu API tạo đơn cũng đọc giá từ cache, điều gì xảy ra khi khách thanh toán?', a: 'Đây là lỗi nghiêm trọng hơn lỗi hiển thị. Giá hiển thị sai chỉ làm khách khó chịu, nhưng nếu đơn tính tiền theo giá cache thì công ty có thể bán dưới giá. Cách đúng là đọc giá từ RDS ngay trong bước tạo đơn, trong transaction có khóa hoặc kiểm tra điều kiện. Cache chỉ dùng cho trang danh sách và chi tiết, còn nguồn quyết định phải là database.' }
],
pitfalls: [
  'Nghĩ TTL là cơ chế đồng bộ, rồi để giá cũ tồn tại cả chục phút sau khi admin sửa, vì TTL chỉ giới hạn thời gian sai chứ không xóa ngay',
  'Vô hiệu hóa cache trước khi commit RDS, khiến một request đọc xen vào ghi lại giá cũ và giá cũ sống tới khi TTL hết',
  'Mở security group của ElastiCache cho 0.0.0.0/0 hoặc dùng chung security group mặc định với tài nguyên khác, làm tăng bề mặt tấn công trong VPC'
],
selfcheck: [
  'Tôi vẫn chưa giải thích được vì sao ElastiCache serverless có endpoint công khai nhưng vẫn không phải lựa chọn mặc định cho API nội bộ trong VPC',
  'Tôi giải thích được bằng ví dụ admin hạ giá từ 500.000 xuống 350.000 vì sao trang danh sách còn giá cũ trong 10 phút, và vô hiệu hóa sau commit sửa lỗi này',
  'Trong tình huống danh sách có phân trang và bộ lọc, tôi đưa version vào tên key, tăng nó sau commit, và đặt TTL ngắn để giới hạn rủi ro khi version bị eviction'
],
refs: ['aws-elasticache', 'aws-rds', 'aws-vpc', 'aws-cloudfront', 'aws-cloudwatch', 'aws-elasticache-strategies', 'aws-elasticache-tls', 'aws-elasticache-public-endpoint', 'aws-elasticache-vpc-access', 'aws-dax'],
tradeoff: '<p><strong>Được:</strong> độ trễ đọc thấp và giảm tải RDS. Vô hiệu hóa sau commit giữ cache gần với dữ liệu thật.</p><p><strong>Mất:</strong> bạn phải quản lý nhất quán trong code, mỗi chỗ ghi phải vô hiệu hóa đúng phần cache, và lần đọc đầu sau khi vô hiệu hóa chậm hơn. Write-through giữ cache mới hơn nhưng khó áp dụng cho danh sách phân trang. TTL dài giảm tải nhưng kéo dài sai lệch khi lỗi; TTL ngắn an toàn hơn nhưng tăng số lần đọc RDS.</p>',
alternatives: '<ul><li><strong>Tối ưu truy vấn trước</strong>: thêm index hoặc đọc replica của RDS khi truy vấn chưa được tối ưu.</li><li><strong>DAX</strong>: cache micro giây đứng trước DynamoDB, không dùng cho RDS, và dữ liệu có thể trễ thoáng qua.</li><li><strong>CloudFront</strong>: CDN cache phản hồi HTTP ở biên mạng, hợp nội dung công khai như ảnh và trang tĩnh, không hợp giá riêng từng người.</li></ul>',
observe: '<p><strong>Tỷ lệ trúng và trượt cache</strong>, độ trễ API và số lần đọc RDS cho biết cache có thực sự giảm tải.</p><p><strong>Sự cố giá cũ</strong> CloudWatch không tự phát hiện. Cần kiểm thử tự động: sau mỗi lần sửa giá, so sánh giá từ API với RDS và cảnh báo khi lệch. Ghi log có product_id và version để đối chiếu khi khách khiếu nại.</p>',
say30: 'Tôi dùng ElastiCache theo mẫu cache-aside, đặt trong VPC và chỉ mở cổng 6379 cho security group của API. Để tránh giá cũ, tôi tăng version cache sau khi RDS commit, cộng TTL ngắn làm lưới an toàn. Cache chỉ phục vụ hiển thị, còn giá lúc thanh toán đọc từ RDS.',
say90: 'Giá cũ là lỗi của bước ghi, không phải của TTL. Tôi dùng ElastiCache theo cache-aside: đọc cache trước, trượt thì đọc RDS rồi ghi vào cache với TTL 300 giây. Vì cache như Redis chỉ tự hết hạn theo thời gian, sau khi admin sửa giá tôi tăng version trong tên key ngay sau khi RDS commit, để key cũ không còn được đọc và không phải quét từng trang. Trên production tôi không vô hiệu hóa trước commit, vì một request đọc xen vào sẽ ghi lại giá cũ. TTL vẫn giữ làm lưới an toàn khi lệnh INCR thất bại. Về mạng, ElastiCache nằm trong private subnet của VPC và security group chỉ nhận cổng 6379 từ API. Tôi không cache giá lúc thanh toán; bước đó đọc thẳng từ RDS trong transaction.',
}
);
