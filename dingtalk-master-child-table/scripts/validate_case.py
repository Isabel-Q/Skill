#!/usr/bin/env python3
import json
import sys
from pathlib import Path

ALLOWED_TYPES = {"text", "longText", "number", "percent", "currency", "date", "singleSelect", "multipleSelect", "url", "formula"}
ALLOWED_SCOPES = {"总表和子表", "仅总表", "仅子表", "系统字段"}
ALLOWED_OWNERS = {"子表", "总表", "系统"}
ALLOWED_DIRECTIONS = {"子→总", "总→子", "系统计算", "仅总表", "仅子表", "不同步"}


def main(path: str) -> int:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    fields = data.get("fields") or []
    errors = []
    seen_keys = set()
    master_orders = set()
    child_orders = set()
    record_ids = 0

    for i, field in enumerate(fields, start=1):
        prefix = f"fields[{i}]"
        key = str(field.get("key", "")).strip()
        if not key:
            errors.append(f"{prefix}: key is blank")
        elif key in seen_keys:
            errors.append(f"{prefix}: duplicate key {key}")
        seen_keys.add(key)
        if field.get("type") not in ALLOWED_TYPES:
            errors.append(f"{prefix}: unsupported type {field.get('type')}")
        if field.get("scope") not in ALLOWED_SCOPES:
            errors.append(f"{prefix}: unsupported scope {field.get('scope')}")
        if field.get("owner") not in ALLOWED_OWNERS:
            errors.append(f"{prefix}: unsupported owner {field.get('owner')}")
        if field.get("direction") not in ALLOWED_DIRECTIONS:
            errors.append(f"{prefix}: unsupported direction {field.get('direction')}")
        if field.get("type") in {"singleSelect", "multipleSelect"}:
            options = [str(v).strip() for v in field.get("options", [])]
            if len(options) != len(set(options)):
                errors.append(f"{prefix}: duplicate select options")
        if field.get("matchRole") == "记录ID":
            record_ids += 1
        for order_key, seen in (("masterOrder", master_orders), ("childOrder", child_orders)):
            order = field.get(order_key)
            if order is None:
                continue
            if not isinstance(order, int) or order <= 0:
                errors.append(f"{prefix}: {order_key} must be a positive integer")
            elif order in seen:
                errors.append(f"{prefix}: duplicate {order_key} {order}")
            seen.add(order)

    if record_ids != 1:
        errors.append(f"exactly one 记录ID field is required; found {record_ids}")
    if errors:
        print("INVALID")
        print("\n".join(errors))
        return 1
    print(f"VALID: {data.get('caseName')} v{data.get('version')} ({len(fields)} fields)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1]))
