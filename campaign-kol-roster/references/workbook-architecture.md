# Workbook architecture

## Internal master roster: 26 canonical fields

The preferred display order below matches the current operating template. It is a presentation convention, not a synchronization contract: all logic must resolve fields from the live header row.

| Col | Field | Direction |
|---|---|---|
| A | 国家 | agency → master |
| B | 代理 | master only |
| C | 达人名称 | agency → master |
| D | 平台 | agency → master |
| E | 账号链接 | agency → master |
| F | 内容类型 | agency → master |
| G | 粉丝量级 | recalculated during sync from 粉丝数 |
| H | 受众画像 | agency → master |
| I | KOL池 | master only |
| J | 推进合作 | master → agency |
| K | DM Comments | master → agency |
| L | 报价（USD） | agency → master |
| M | 粉丝数 | agency → master |
| N | 近15条平均播放量 | agency → master |
| O | 播放率 | agency → master |
| P | 互动量 | agency → master |
| Q | 互动率 | agency → master |
| R | 竞品合作情况 | agency → master |
| S | 达人简介及推荐理由 | agency → master |
| T | 交付内容 | agency → master |
| U | 提报日期 | agency → master |
| V | Remark | agency → master |
| W | 重复提报代理数 | master only |
| X | 原始文件 | master only |
| Y | 原始行号 | master only |
| Z | 提报记录ID | master only |

## Agency-facing roster: A:T

Build the agency schema by canonical header name: remove every master-only field, then arrange the remaining fields in the order below. Never derive it by deleting fixed column letters because the master display order may change:

`国家｜达人名称｜平台｜账号链接｜内容类型｜粉丝量级｜受众画像｜推进合作｜DM Comments｜报价（USD）｜粉丝数｜近15条平均播放量｜播放率｜互动量｜互动率｜竞品合作情况｜达人简介及推荐理由｜交付内容｜提报日期｜Remark`

Agency H/I are the master-owned writeback fields. Their corresponding master columns are determined by header name, not by a fixed position.

## Native structures

- Keep the roster as a native Google Sheets table covering the full entry area.
- Apply strict dropdowns to country, platform, follower tier, and yes/no fields.
- Preserve date, number, and percentage types.
- Apply the light-green conditional-format rule across the roster body using the live `推进合作` column. In the current preferred order this is master `$J2="是"`; agency remains `$H2="是"`.
- In agency workbooks, set H1 and I1 to orange (`#FF9900`) and add a note that the internal campaign team maintains and syncs these fields.
- Protect or clearly label master-to-agency fields if the campaign's sharing model supports it.

## Reference tabs

The master keeps `同步控制`, internal `操作说明`, `标准说明`, and `粉丝量级参考`. Agency workbooks keep only `汇总名单` and a rewritten `标准说明` for the A:T schema. They must not contain:

- names or links for other agencies
- original-source inventories
- KOL池, duplicate counts, source row/file, or internal record IDs
- internal-only workflow notes

The internal `操作说明` must include the campaign-specific add-agency procedure and must never be published to an agency.

The country ecology reference interprets the shared tier labels by market; it does not create different dropdown values for each country.
