# Agency lifecycle

Read this reference when adding, replacing, pausing, or removing an agency from a campaign roster system.

## Add an agency

1. Choose a currently verified agency workbook as the template. Make a native Google Sheets copy inside the campaign folder and rename it `<agency>_KOL标准提报名单`.
2. Clear the copied roster body contents only. Preserve row 1, the A:T native table, dropdowns, number/date formats, conditional formatting, notes, and column widths. Do not carry any template agency records or master-owned H/I values into the new file.
3. Keep only `汇总名单` and the agency-safe `标准说明`. H1 `推进合作` and I1 `DM Comments` must be orange (`#FF9900`) and state that the internal campaign team maintains them.
4. Confirm the new agency file contains no other-agency records or links, `KOL池`, duplicate counts, source provenance, internal record IDs, master control sheet, operation guide, or country-ecology reference tab.
5. Extract the spreadsheet ID from the URL segment between `/d/` and `/edit`.
6. Add one unique entry to the Apps Script `AGENTS` array:

   ```javascript
   {name:'Agency Name', id:'SPREADSHEET_ID'}
   ```

   Preserve `MASTER_ID`, the canonical header arrays, matching functions, and `runSync`. The agency name and ID must each be unique.
7. Add the agency to the master `同步控制` list with its workbook hyperlink, record count, and direction label `代理字段↑；推进合作/DM Comments↓`.
8. Run `runSync` before sharing the workbook. A blank new workbook must add zero records. If it already contains N submissions, reconcile those N rows and spot-check one agency-to-master row plus H/I writeback.

## Operational acceptance

- The agent workbook has exactly the two allowed tabs and 20 required headers.
- Header validation passes; moving a column is allowed, while missing, renamed, or duplicated required headers fail before any roster write.
- Existing agencies show no unexpected additions.
- The master control sheet reports success.
- No internal-only data is visible in the new agency workbook.

## Pause, replace, or remove

- To pause ingestion without deleting history, remove or comment out the agency's `AGENTS` entry only after the user explicitly requests the pause. Existing master records remain.
- To replace a workbook, update the existing agency entry's ID; do not add a second entry with the same agency name.
- Removing an agency workbook or an `AGENTS` entry does not delete historical master rows. Historical deletion requires an explicit scope and separate confirmation.

## Common failure modes

- Workbook copied but not syncing: its ID was not added to `AGENTS`, the ID is wrong, or the master owner lacks access.
- Header validation error: repair the exact named header; never bypass validation or add positional fallbacks.
- Unexpected new master row: the agency changed platform, URL, country, and KOL name together, so the identity keys no longer match. Do not silently delete the old master row.
- OAuth warning: follow the bounded Cloud project/test-user recovery in `sync-contract.md`; do not broaden scopes or publish publicly just to bypass the warning.
