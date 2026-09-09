# Script configuration

Create a temporary JSON file with this shape, then run `scripts/render_sync_script.py --config CONFIG --output Code.gs`:

```json
{
  "master_id": "MASTER_SPREADSHEET_ID",
  "sheet_name": "汇总名单",
  "control_sheet": "同步控制",
  "agents": [
    {"name": "Agency A", "id": "AGENCY_A_SPREADSHEET_ID"},
    {"name": "Agency B", "id": "AGENCY_B_SPREADSHEET_ID"}
  ],
  "tiers": [
    {"lt": 150000, "label": "0-150K"},
    {"lt": 500000, "label": "150K-500K"},
    {"lt": 1200000, "label": "500K-1.2M"},
    {"lt": null, "label": "1.2M+"}
  ]
}
```

Agent names and spreadsheet IDs must be unique. Tier limits are exclusive upper bounds; the final tier must have `null` as its limit.
