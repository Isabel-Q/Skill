# Canonical schema

## Business fields

| Field | Owner/type |
|---|---|
| 国家 | agency; singleSelect |
| 达人名称 | agency; primary text |
| 平台 | agency; singleSelect: YouTube, TikTok, Instagram, Facebook |
| 账号链接 | agency; URL/text |
| 内容类型 | agency; text or multipleSelect |
| 粉丝量级 | derived singleSelect/formula |
| 受众画像 | agency; long text |
| KOL池 | internal; singleSelect 是/否 |
| 推进合作 | internal; singleSelect 是/否 |
| DM Comments | internal; long text |
| 报价（USD） | agency; currency/number |
| 粉丝数 | agency; number |
| 近15条平均播放量 | agency; number |
| 播放率 | agency; percent/number |
| 互动量 | agency; number |
| 互动率 | agency; percent/number |
| 竞品合作情况 | agency; long text |
| 达人简介及推荐理由 | agency; long text |
| 交付内容 | agency; long text |
| 提报日期 | agency; date |
| Remark | agency; long text |

## System fields

- `代理`: required singleSelect; used by permissions and grouping.
- `重复提报代理数`: computed by stable KOL identity, never used to merge rows.
- `来源表ID`, `来源记录ID`, `主表记录ID`: hidden text fields required only in physical-mirror mode.
- `提报记录ID`: stable text ID for imports and external integrations.
- `标准化账号Key`: derived normalized platform/account key when supported.

## Follower tiers

Default shared tiers:

- `0-150K`
- `150K-500K`
- `500K-1.2M`
- `1.2M+`

Implement as a formula field if the runtime supports the required conditional formula; otherwise use a workflow-updated singleSelect. Keep country-specific head/mid/tail interpretation in a separate reference table rather than multiplying filter choices.
