# Implementation checklist

## Inspect

- Inventory files, workbook types, tabs, headers, row counts, formulas, merged cells, validation, and remark-like fields.
- Identify one complete representative row per source shape before mapping.
- Record the agent represented by each source file.
- Confirm whether the destination is a new campaign folder or an existing architecture.

## Normalize and consolidate

- Map source fields to the master schema without deleting submissions.
- Split combined multi-platform accounts into separate rows when needed.
- Normalize platform labels and numeric types.
- Merge average-view and remark inputs according to the documented defaults.
- Assign stable internal record IDs in master Z.
- Calculate follower tiers and duplicate-agency counts.

## Create agency workbooks

- Start from a structure-preserving native copy when possible.
- Filter to one agency's existing records.
- Remove master-only fields by canonical header name, not by fixed column letter, then arrange the final agency schema as A:T.
- Verify native table range becomes A:T and conditional formatting uses `$H`.
- Keep only `汇总名单` and `标准说明`; remove the master tier-reference, control, operation-guide, and any other internal tabs.
- Rewrite the agency `标准说明`; remove source inventories and other-agency/internal information.
- Keep `推进合作` and `DM Comments` visible. Set H1/I1 orange (`#FF9900`) and add the explanation that the internal campaign team maintains them.

## Add or replace an agency

- Read `agency-lifecycle.md`.
- Copy a verified agency workbook, clear roster body contents without deleting rows, columns, validations, formats, the native table, or conditional formatting, and rename it uniquely.
- Add the exact agency name and spreadsheet ID to the Apps Script `AGENTS` configuration; creating or sharing the workbook alone does not connect it.
- Add the agency to the master control list and verify its link and record count.
- Run a first sync before sharing. A blank new agency must add zero records; a populated agency must reconcile to its populated row count.

## Connect synchronization

- Render and install the campaign-specific Apps Script.
- Confirm the script builds a live header map for every workbook and contains no positional field mapping.
- Test one harmless column move: synchronization must still succeed. Restore the layout afterward if the user did not request the move.
- Do not live-test a missing/renamed header on production data; verify fail-closed behavior with a mock or disposable copy.
- Add `onOpen` menu and assign `runSync` to the control-sheet button.
- Verify there is exactly one visible executable button, it is compact, it does not overlap the agency list, and no cell-styled duplicate remains.
- Complete standard Cloud OAuth configuration only if required.
- Run once after structural edits. The expected result for an unchanged campaign is `新增 0` and `更新 = total agency rows`.

## Final verification

- Re-read master and every agency header.
- Reconcile agent-level and total counts.
- Probe native table metadata and validation.
- Visually inspect the master, control sheet, one representative agency roster, and its instructions.
- Confirm the master has an internal `操作说明` tab with the current template link and add-agency procedure, and no agency workbook has that tab.
- Confirm no other-agency links, provenance, IDs, KOL池, or duplicate counts appear in agency workbooks.
- Return the master link, agency links when useful, test result, and any matching limitations.
