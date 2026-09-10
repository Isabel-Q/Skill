# Single-source bootstrap

Use current DingTalk AI Table schemas; do not hardcode IDs from examples.

1. Resolve or create the campaign Base.
2. Create `KOL记录`, then create fields in batches within the current API limit.
3. Read back field definitions and save the real IDs for later view/permission configuration.
4. Create internal and agency-template views over the same table.
5. Configure the internal view with all fields, country/name/platform/agency sorting, and light-green row styling for `推进合作 = 是` if supported.
6. Configure the agency template with agency-owned fields plus read-only feedback fields. Do not expose system IDs, duplicate counts, other-agency data, or internal-only operations.
7. Enable advanced permissions and create an agency role. Use field/row rules returned by the live service; never guess bitmaps or undocumented config shapes.
8. If member binding is unavailable through the current API, give the exact Web UI path and stop short of claiming permissions are active.
9. Create `标准说明`, `粉丝量级参考`, and `操作说明` as separate tables/pages or clearly labeled views.
10. Create a test record and verify the same record ID/value appears through both internal and agency surfaces.

When importing legacy rosters, add every proposal as its own record. Normalize headers and field values before import, but preserve source text in Remark when normalization would lose context.
