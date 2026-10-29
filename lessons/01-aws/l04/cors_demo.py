# python 3 (standard library only), file: cors_demo.py, target: Windows 11
# Dựng hai server http.server cục bộ: một cái không gửi header CORS, một cái có.
# Rồi gọi curl -i bằng subprocess và in nguyên văn phần server trả về.
# curl chứng minh SERVER GỬI GÌ. Việc trình duyệt chặn việc đọc response là hành vi
# của trình duyệt, curl không tái hiện được.
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ORIGIN = "http://localhost:5173"
PORT_PLAIN = 8801
PORT_CORS = 8802


class Base(BaseHTTPRequestHandler):
    send_cors = False

    def _cors_headers(self):
        if not self.send_cors:
            return
        self.send_header("Access-Control-Allow-Origin", ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "x-tenant-id, content-type")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(length)
        body = b'{"ok":true}'
        self.send_response(201)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass


class Plain(Base):
    send_cors = False


class WithCors(Base):
    send_cors = True


def serve(handler, port):
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def curl(args):
    out = subprocess.run(
        ["curl", "-i", "-s", "--max-time", "5"] + args,
        capture_output=True,
        text=True,
    )
    return (out.stdout or "") + (out.stderr or "")


def show(title, command, args):
    print("=" * 72)
    print(title)
    print("$ " + command)
    print("-" * 72)
    print(curl(args).strip())
    print()


def main():
    serve(Plain, PORT_PLAIN)
    serve(WithCors, PORT_CORS)
    time.sleep(0.4)

    preflight = [
        "-X", "OPTIONS",
        "-H", "Origin: " + ORIGIN,
        "-H", "Access-Control-Request-Method: POST",
        "-H", "Access-Control-Request-Headers: x-tenant-id",
    ]

    show(
        "Server 1: không gửi header CORS (port %d)" % PORT_PLAIN,
        "curl -i -X OPTIONS -H 'Origin: %s' -H 'Access-Control-Request-Method: POST' "
        "-H 'Access-Control-Request-Headers: x-tenant-id' http://127.0.0.1:%d/files"
        % (ORIGIN, PORT_PLAIN),
        preflight + ["http://127.0.0.1:%d/files" % PORT_PLAIN],
    )

    show(
        "Server 2: có gửi header CORS (port %d)" % PORT_CORS,
        "curl -i -X OPTIONS -H 'Origin: %s' -H 'Access-Control-Request-Method: POST' "
        "-H 'Access-Control-Request-Headers: x-tenant-id' http://127.0.0.1:%d/files"
        % (ORIGIN, PORT_CORS),
        preflight + ["http://127.0.0.1:%d/files" % PORT_CORS],
    )

    post = ["-X", "POST", "-H", "Origin: " + ORIGIN, "-H", "x-tenant-id: t-1",
            "-H", "Content-Type: application/json", "-d", '{"name":"a"}']
    show(
        "Request thật (POST) tới server 2: server chạy xong, trả 201",
        "curl -i -X POST -H 'Origin: %s' -H 'x-tenant-id: t-1' "
        "-H 'Content-Type: application/json' -d '{\"name\":\"a\"}' http://127.0.0.1:%d/files"
        % (ORIGIN, PORT_CORS),
        post + ["http://127.0.0.1:%d/files" % PORT_CORS],
    )

    print("Ghi chú: cả bốn khối trên đều do curl in ra. curl không có origin,")
    print("không hỏi trước và không thi hành CORS, nên nó không bao giờ thấy lỗi chặn.")


if __name__ == "__main__":
    main()
