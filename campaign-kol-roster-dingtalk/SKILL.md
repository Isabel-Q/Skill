---
name: campaign-kol-roster-dingtalk
description: Build or maintain a campaign KOL roster in DingTalk AI Table with one internal master, agency-safe entry surfaces, normalized fields, permissions, and native automation where separate physical agency tables are required. Use when the user wants a 钉钉 AI 表格 version of the agency/master KOL workflow. Do not use for Google Sheets or ordinary cell-based DingTalk spreadsheets.
---

# DingTalk Campaign KOL Roster

Build a campaign-specific DingTalk AI Table Base for agency KOL collection. Preserve every agency submission as an independent record; never deduplicate away competing proposals.

Use the official DingTalk AI Table MCP or `dws aitable` capability. Resolve the current Base/Table/Field/View/Record IDs from real responses and verify writes by reading them back. If no authenticated DingTalk AI Table capability is available, stop before creating a partial template and tell the user what connection is missing.

## Choose the architecture

Read [references/architecture.md](references/architecture.md) before building. Default to **single-source mode**:

- one physical `KOL记录` table
- one internal `汇总名单` view
- one `代理维护模板` view/form that is copied and configured per agency
- advanced roles enforce row visibility and field editability
- no synchronization button, formula mirror, or duplicate storage

This gives immediate two-way visibility because every view edits the same record. A manually copied view is not a new agency until its agency filter, role rules, and member binding are configured.

Use **physical-mirror mode** only when agencies must work in separate physical tables or separate Bases. Read [references/physical-mirror.md](references/physical-mirror.md) first. It requires native workflows or record APIs; formulas and lookup fields alone are insufficient. Copying a physical child table never counts as registration.

## Required inputs

Resolve these before asking:

- campaign name and destination Base/folder
- campaign markets and agencies
- whether agencies can be members of the same Base
- whether the user requires physical child tables rather than permissioned views
- source rosters to import, if any

If agencies can join the same Base and no hard isolation requirement is stated, use single-source mode. Ask only when access isolation or external-collaborator constraints materially change that choice.

## Canonical data contract

Read [references/schema.md](references/schema.md) before creating fields or importing records.

Keep the same business rules as the Google campaign roster:

- Agency-maintained fields: country, KOL name, platform, account URL, content type, audience profile, quote, follower count, recent average views, view rate, engagements, engagement rate, competitor history, recommendation, deliverables, submission date, and Remark.
- Internal-maintained fields: `KOL池`, `推进合作`, `DM Comments`.
- System fields: agency, duplicate-agency count, source table/record IDs, and stable submission ID.
- `推进合作 = 是` renders the row light green where the current view supports row coloring.
- Country, platform, follower tier, KOL pool, and cooperation fields use constrained choices.
- Counts and quotes are numeric; rates are percentages; follower tier is derived from follower count.
- Multi-agency proposals for the same KOL remain separate but are grouped adjacently in the internal view.

Use formulas only for same-record derived values such as follower tier or display keys. Use linked-record, lookup, or filterUp fields only for read-only cross-table references. Never describe a formula or lookup result as bidirectional synchronization.

## Build single-source mode

Read [references/bootstrap.md](references/bootstrap.md), then:

1. Create or reuse one Base and create the canonical `KOL记录` table.
2. Create fields by canonical name and type, then read back every field ID/config.
3. Create `汇总名单` with all fields and internal sorting/grouping.
4. Create `代理维护模板` exposing only agency fields plus read-only `推进合作` and `DM Comments`.
5. Enable advanced permissions. Configure an agency role pattern that can see only its agency rows, edit agency-owned fields, and read but not edit internal feedback fields.
6. Create the operating guide and follower-tier reference as separate safe surfaces inside the Base.
7. Import source records without deduplication and verify counts.

Role-to-member binding may require the DingTalk Web UI even when role definitions can be created through the API. Report that exact remaining step instead of claiming access is complete.

## Add an agency

Treat “新增代理 X” as a registration workflow, not a raw copy:

1. Copy the agency view/form template.
2. Set the agency filter/default for X.
3. Create or update X's advanced-permission role.
4. Bind the intended members in the Web UI if the available API cannot do so.
5. Add one test record, verify internal visibility and field permissions, then remove or clearly label the test record with user approval.

Do not tell the user that copying a view or table alone is enough.

## Validation

Before declaring completion, verify:

- agency and master surfaces show the same underlying record in single-source mode
- agencies cannot see other agencies' rows or master-only provenance fields
- agencies cannot overwrite `KOL池`, `推进合作`, or `DM Comments`
- internal updates to `推进合作` and `DM Comments` are immediately visible to the permitted agency
- new agency records appear immediately in the internal view
- follower tier and numeric/rate field types are correct
- repeated proposals remain independent records
- physical-mirror mode, if selected, has working create/update tests in both directions and loop prevention

Return the Base link, the chosen architecture, agency access links, test evidence, and any manual member-binding step.
