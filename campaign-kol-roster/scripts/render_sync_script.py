#!/usr/bin/env python3
"""Render campaign-specific Apps Script from a small JSON configuration."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


DEFAULT_TIERS = [
    {"lt": 150000, "label": "0-150K"},
    {"lt": 500000, "label": "150K-500K"},
    {"lt": 1200000, "label": "500K-1.2M"},
    {"lt": None, "label": "1.2M+"},
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def validate(config: dict) -> None:
    if not str(config.get("master_id", "")).strip():
        raise ValueError("config.master_id is required")
    agents = config.get("agents")
    if not isinstance(agents, list) or not agents:
        raise ValueError("config.agents must be a non-empty list")
    seen_names: set[str] = set()
    seen_ids: set[str] = set()
    for agent in agents:
        name = str(agent.get("name", "")).strip()
        spreadsheet_id = str(agent.get("id", "")).strip()
        if not name or not spreadsheet_id:
            raise ValueError("each agent requires non-empty name and id")
        if name in seen_names or spreadsheet_id in seen_ids:
            raise ValueError("agent names and spreadsheet IDs must be unique")
        seen_names.add(name)
        seen_ids.add(spreadsheet_id)

    tiers = config.get("tiers", DEFAULT_TIERS)
    if not isinstance(tiers, list) or not tiers:
        raise ValueError("config.tiers must be a non-empty list")
    previous = -1
    for index, tier in enumerate(tiers):
        if not str(tier.get("label", "")).strip():
            raise ValueError("each tier requires a label")
        limit = tier.get("lt")
        if limit is None:
            if index != len(tiers) - 1:
                raise ValueError("only the final tier may omit lt")
        elif not isinstance(limit, (int, float)) or limit <= previous:
            raise ValueError("tier lt values must be numeric and strictly ascending")
        else:
            previous = limit
    if tiers[-1].get("lt") is not None:
        raise ValueError("the final tier must use null lt as the open-ended bucket")


def js(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def main() -> None:
    args = parse_args()
    config = json.loads(args.config.read_text(encoding="utf-8"))
    validate(config)

    template_path = Path(__file__).with_name("sync-template.gs")
    rendered = template_path.read_text(encoding="utf-8")
    replacements = {
        "__MASTER_ID__": js(str(config["master_id"]).strip()),
        "__SHEET_NAME__": js(config.get("sheet_name", "汇总名单")),
        "__CONTROL_SHEET__": js(config.get("control_sheet", "同步控制")),
        "__AGENTS__": js(config["agents"]),
        "__TIERS__": js(config.get("tiers", DEFAULT_TIERS)),
    }
    for placeholder, value in replacements.items():
        rendered = rendered.replace(placeholder, value)
    if "__" in rendered:
        raise ValueError("unresolved placeholder remains in rendered script")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(rendered, encoding="utf-8")


if __name__ == "__main__":
    main()
