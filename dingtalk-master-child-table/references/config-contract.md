# Configuration contract

## Editable `字段配置` columns

| Column | Meaning |
|---|---|
| 字段Key | Immutable internal identifier; generate once and never infer from the display name |
| 显示列名 | Editable business-facing label |
| 字段类型 | text, longText, number, percent, currency, date, singleSelect, multipleSelect, url, formula |
| 下拉选项 | JSON array or newline-separated values for select fields |
| 所属范围 | 总表和子表, 仅总表, 仅子表, 系统字段 |
| 维护方 | 子表, 总表, 系统 |
| 同步方向 | 子→总, 总→子, 系统计算, 仅总表, 仅子表, 不同步 |
| 总表顺序 | Positive integer or blank when absent |
| 子表顺序 | Positive integer or blank when absent |
| 是否必填 | 是/否 |
| 默认值 | Typed default where supported |
| 数字格式 | `#,##0`, `0.0%`, currency code, date format, or blank |
| 匹配角色 | 记录ID, 主匹配, 备用匹配, 非匹配 |
| 计算规则 | Formula or controlled derivation; blank for owned inputs |
| 是否启用 | 是/否 |
| 填写说明 | Business definition shown to editors |
| 校验状态 | System-owned result; users do not edit |

## Invariants

- `字段Key` is unique, nonblank, and immutable after the first successful apply.
- Changing `显示列名` renames a field without changing identity.
- A field has exactly one owner/direction combination.
- `总表顺序` and `子表顺序` are unique among visible fields on each surface.
- Select options are unique after trimming; removing an option currently in use is blocked.
- Formula/system fields cannot also be child- or master-owned inputs.
- At least one stable record ID exists. Business matching keys are recovery aids, not normal identity.
- `是否启用=否` deprecates/hides by default. It does not delete stored data.

## Protected configuration

`_系统映射` stores case ID/version, Base ID, table/view IDs, each stable key's field IDs, last applied type, configuration hash, and migration history. Users edit display configuration, never live IDs.
