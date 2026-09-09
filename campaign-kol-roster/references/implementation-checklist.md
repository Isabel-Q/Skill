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
- Delete master V:Z first, then master H, so the final agency schema is A:T.
- Verify native table range becomes A:T and conditional formatting uses `$H`.
- Rewrite the agency `标准说明`; remove source inventories and other-agency/internal information.
- Keep `推进合作` and `DM Comments` visible, with the explanation that they are maintained internally.

## Connect synchronization

- Render and install the campaign-specific Apps Script.
- Add `onOpen` menu and assign `runSync` to the control-sheet button.
- Complete standard Cloud OAuth configuration only if required.
- Run once after structural edits. The expected result for an unchanged campaign is `新增 0` and `更新 = total agency rows`.

## Final verification

- Re-read master and every agency header.
- Reconcile agent-level and total counts.
- Probe native table metadata and validation.
- Visually inspect the master, control sheet, one representative agency roster, and its instructions.
- Confirm no other-agency links, provenance, IDs, KOL池, or duplicate counts appear in agency workbooks.
- Return the master link, agency links when useful, test result, and any matching limitations.
