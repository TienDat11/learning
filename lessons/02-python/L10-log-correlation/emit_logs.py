"""Sinh log JSON cho HAI don di qua ba tang: API Gateway -> Lambda -> SQS -> Lambda.

Chay: python emit_logs.py
Ghi ra logs.jsonl, moi dong mot JSON.

Id co dinh de ket qua lap lai duoc. Ba id he thong (requestId, aws_request_id,
messageId) duoc sinh o ba tang khac nhau; correlation_id do bien tao va duoc
truyen tiep qua MessageAttributes.
"""

import json

LOG_PATH = "logs.jsonl"

# Don A va don B xen ke nhau, dung de thay viec loc theo thoi gian la khong du.
ORDER_A = {
    "correlation_id": "corr-a1",
    "order_id": "A-1001",
    "request_id": "req-aaa",          # API Gateway sinh
    "aws_request_id_api": "lam-a-1",  # runtime Lambda sinh cho invocation 1
    "message_id": "msg-aaa",          # SQS sinh khi nhan message
    "aws_request_id_worker": "lam-a-2",
}
ORDER_B = {
    "correlation_id": "corr-b2",
    "order_id": "B-2002",
    "request_id": "req-bbb",
    "aws_request_id_api": "lam-b-1",
    "message_id": "msg-bbb",
    "aws_request_id_worker": "lam-b-2",
}

# (giay, tang, don, event, cac field rieng)
ROWS = [
    (0.00, "api-gateway", ORDER_A, "request_received", {"requestId": ORDER_A["request_id"]}),
    (0.00, "api-gateway", ORDER_B, "request_received", {"requestId": ORDER_B["request_id"]}),
    (0.05, "lambda-api", ORDER_A, "order_accepted",
     {"aws_request_id": ORDER_A["aws_request_id_api"], "order_id": ORDER_A["order_id"]}),
    (0.06, "lambda-api", ORDER_B, "order_accepted",
     {"aws_request_id": ORDER_B["aws_request_id_api"], "order_id": ORDER_B["order_id"]}),
    (0.09, "lambda-api", ORDER_A, "message_sent",
     {"aws_request_id": ORDER_A["aws_request_id_api"], "messageId": ORDER_A["message_id"],
      "MessageAttributes": {"correlation_id": ORDER_A["correlation_id"]}}),
    (0.11, "lambda-api", ORDER_B, "message_sent",
     {"aws_request_id": ORDER_B["aws_request_id_api"], "messageId": ORDER_B["message_id"],
      "MessageAttributes": {"correlation_id": ORDER_B["correlation_id"]}}),
    (1.20, "lambda-worker", ORDER_B, "message_received",
     {"aws_request_id": ORDER_B["aws_request_id_worker"], "messageId": ORDER_B["message_id"]}),
    (1.24, "lambda-worker", ORDER_A, "message_received",
     {"aws_request_id": ORDER_A["aws_request_id_worker"], "messageId": ORDER_A["message_id"]}),
    (1.30, "lambda-worker", ORDER_B, "order_completed",
     {"aws_request_id": ORDER_B["aws_request_id_worker"], "messageId": ORDER_B["message_id"]}),
    (1.35, "lambda-worker", ORDER_A, "payment_failed",
     {"aws_request_id": ORDER_A["aws_request_id_worker"], "messageId": ORDER_A["message_id"],
      "error": "upstream 503"}),
    (2.40, "lambda-worker", ORDER_A, "message_redelivered",
     {"aws_request_id": "lam-a-3", "messageId": ORDER_A["message_id"]}),
    (2.46, "lambda-worker", ORDER_A, "order_completed",
     {"aws_request_id": "lam-a-3", "messageId": ORDER_A["message_id"]}),
]


def main() -> None:
    with open(LOG_PATH, "w", encoding="utf-8") as fh:
        for ts, layer, order, event, extra in ROWS:
            row = {
                "ts": "2026-10-29T10:%02d:%05.2fZ" % (int(ts) // 60, ts % 60),
                "layer": layer,
                "event": event,
                "correlation_id": order["correlation_id"],
            }
            row.update(extra)
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
    print("da ghi %d dong vao %s" % (len(ROWS), LOG_PATH))


if __name__ == "__main__":
    main()
