---
name: dingtalk-master-child-table
description: Build or maintain a configuration-driven master/child system in DingTalk AI Table. Use when the user wants editable field definitions, reusable cases, generated master and child schemas, ownership-based synchronization, or a reusable DingTalk table template for different business purposes. Do not use for Google Sheets or ordinary cell spreadsheets.
---

# DingTalk Master/Child Table

Build DingTalk AI Table systems from an editable case instead of hardcoded column names. Use only the official DingTalk AI Table MCP or `dws aitable` capability. Resolve live Base/Table/Field/View/Record IDs and verify writes by reading them back.

## Start from a case

Use [assets/cases/kol-campaign.json](assets/cases/kol-campaign.json) as the preserved default case. Copy it logically for the new use case, then change only the case metadata and field rows requested by the user. Never overwrite the preserved case.

If the user provides no field design, create the Base from the KOL case and let them edit the `字段配置` table. If they describe another purpose, adapt the copied case before building.

## Architecture

Every Base contains:

- `字段配置`: user-editable field definitions and synchronization ownership
- `子表注册`: registered child surfaces and status
- `同步控制`: configuration version, preview/apply status, and logs
- `_系统映射`: protected internal mapping from stable field keys to DingTalk field IDs
- one generated master table/view and one generated child template

Read [references/config-contract.md](references/config-contract.md) before creating or changing the configuration. The stable `字段Key` is authoritative. Display names and physical order are presentation only.

## Apply configuration

Read [references/apply-workflow.md](references/apply-workflow.md) before applying changes.

Treat “应用字段配置” as a controlled schema migration:

1. Read and validate all enabled configuration rows.
2. Compare the desired schema with `_系统映射` and live DingTalk field definitions.
3. Produce a change preview.
4. Apply safe additions, display-name changes, order/view changes, formats, and additive select options.
5. Stop on destructive or ambiguous changes such as key mutation, field deletion, incompatible type conversion, duplicate keys, or removal of options still in use.
6. Update the master, child template, registered child surfaces, views, and permissions.
7. Store the configuration hash/version and operation result.

Do not use formulas to create fields or provide writeback. Formula fields are only for same-record derived values. In single-source mode, master and child views edit one underlying record. In physical-mirror mode, native workflows or record APIs perform owner-directed synchronization.

## Ownership and synchronization

Each field must have one authoritative behavior:

- `子→总`: child is authoritative
- `总→子`: master is authoritative
- `系统计算`: neither side manually owns the value
- `仅总表`: absent from child
- `仅子表`: not synchronized to master
- `不同步`: independent values by explicit design

Do not offer unrestricted two-way editing for one field. The system may be bidirectional overall because different fields travel in different directions.

## Child registration

A copied child table/view is not active until registered. Registration resolves the new IDs, binds the case version, applies the child schema and permissions, creates required workflows in physical-mirror mode, and performs a test. Never assume a raw copy inherited valid workflow references.

## Validation

Run [scripts/validate_case.py](scripts/validate_case.py) against the selected case before building. After building, verify:

- every enabled key is unique and mapped to one live field ID per generated table
- display-name changes do not change field identity
- master/child field presence follows scope and direction
- only the configured owner can edit each field
- dropdown options and numeric/date formats match the case
- risky schema changes were blocked rather than guessed
- registration and synchronization tests pass for one representative child

Return the Base link, selected case name/version, configuration preview, applied/blocked changes, test result, and any member-role binding that still requires the DingTalk Web UI.
