# python 3 (standard library only), file: iam_eval.py, target: Windows 11
# Mô hình bộ đánh giá policy của IAM ở mức tối thiểu:
#   explicit deny thắng mọi allow  ->  không có deny thì phải có allow  ->  không có allow là từ chối.
# ĐÂY LÀ MÔ HÌNH HỌC CƠ CHẾ, KHÔNG PHẢI BỘ ĐÁNH GIÁ THẬT CỦA IAM.
# Bộ thật còn xét SCP, RCP, permissions boundary, session policy, điều kiện, chủ sở hữu chéo tài khoản.
import fnmatch
import json

ROLE = "arn:aws:iam::111122223333:role/upload-api-role"
BUCKET_STAGING = "arn:aws:s3:::uploads-staging"
BUCKET_PROD = "arn:aws:s3:::uploads-prod"


def statement_applies(statement, action, resource):
    """Một statement khớp khi cả Action và Resource đều khớp request."""
    action_hit = any(fnmatch.fnmatchcase(action, p) for p in statement["Action"])
    resource_hit = any(fnmatch.fnmatchcase(resource, p) for p in statement["Resource"])
    return action_hit and resource_hit


def effects_of(policy, action, resource):
    return {
        s["Effect"]
        for s in policy.get("Statement", [])
        if statement_applies(s, action, resource)
    }


def evaluate(identity_policy, resource_policy, action, resource):
    """Trả về (quyết định, lý do) theo đúng thứ tự IAM dùng."""
    seen = effects_of(identity_policy, action, resource) | effects_of(
        resource_policy, action, resource
    )
    if "Deny" in seen:
        return "Deny", "có explicit deny, thắng mọi allow"
    if "Allow" in seen:
        return "Allow", "có Allow ở identity policy hoặc resource policy"
    return "Deny", "không policy nào allow, nên mặc định từ chối"


EMPTY = {"Statement": []}

# Execution role tối thiểu: đúng một action, trên đúng một tiền tố ARN.
MINIMAL_ROLE_POLICY = {
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["s3:PutObject"],
            "Resource": [BUCKET_STAGING + "/*"],
        }
    ]
}

# Bucket policy cho phép chính role đó ghi, dùng ở tổ hợp 3.
BUCKET_POLICY_ALLOW_ROLE = {
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {"AWS": ROLE},
            "Action": ["s3:PutObject"],
            "Resource": [BUCKET_STAGING + "/*"],
        }
    ]
}

# Bucket policy cấm tường minh, dùng ở tổ hợp 2.
BUCKET_POLICY_DENY = {
    "Statement": [
        {
            "Effect": "Deny",
            "Principal": {"AWS": ROLE},
            "Action": ["s3:PutObject"],
            "Resource": [BUCKET_STAGING + "/*"],
        }
    ]
}

REQ_PUT_STAGING = ("s3:PutObject", BUCKET_STAGING + "/bao-cao.csv")
REQ_DELETE_STAGING = ("s3:DeleteObject", BUCKET_STAGING + "/bao-cao.csv")
REQ_PUT_PROD = ("s3:PutObject", BUCKET_PROD + "/bao-cao.csv")

CASES = [
    (
        "1. identity allow, không có deny ở đâu",
        MINIMAL_ROLE_POLICY,
        EMPTY,
        [REQ_PUT_STAGING, REQ_DELETE_STAGING],
    ),
    (
        "2. identity allow, nhưng có explicit deny",
        MINIMAL_ROLE_POLICY,
        BUCKET_POLICY_DENY,
        [REQ_PUT_STAGING],
    ),
    (
        "3. identity không allow, resource policy allow",
        EMPTY,
        BUCKET_POLICY_ALLOW_ROLE,
        [REQ_PUT_STAGING],
    ),
    (
        "4. không allow ở đâu cả",
        EMPTY,
        EMPTY,
        [REQ_PUT_PROD],
    ),
]


def main():
    print("Principal trong mọi request dưới đây: " + ROLE)
    print("(Lambda đã đảm nhận role, nên boto3 ký bằng credential tạm của role.)")
    print()
    print("Execution role tối thiểu dùng cho tổ hợp 1 và 2:")
    print(json.dumps(MINIMAL_ROLE_POLICY, indent=2, ensure_ascii=False))
    print()

    for name, identity, resource, requests in CASES:
        print("-" * 74)
        print(name)
        for action, arn in requests:
            decision, reason = evaluate(identity, resource, action, arn)
            print(f"  {action:16} {arn}")
            print(f"  {'':16} -> {decision}: {reason}")
    print("-" * 74)
    print()
    print("Tổ hợp 1 có hai request: cái đầu được phép, cái sau bị từ chối.")
    print("Đó là dấu hiệu role chỉ mở đúng một action, không mở cả họ s3:*.")


if __name__ == "__main__":
    main()
