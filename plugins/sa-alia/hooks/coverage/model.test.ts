import { describe, expect, test } from 'claude-code/testing'

import { coveredPct, parseCoverage } from './model'

// the shape traceability-prepare.js writes (a synthetic project)
const REPORT = `# PO Spec Use Cases vs Architecture Coverage

**PO Spec**: PRODUCT_OWNER_SPEC.md (v1.4)
**Architecture**: ARCHITECTURE.md
**Architecture Version**: 2.1.0
**Date**: 2026-10-30

## Summary <!-- SECTION: Summary -->

| Metric | Count | % |
|--------|-------|---|
| Total Requirements | 20 | — |
| ✅ Covered | 15 | 75% |
| ⚠️ Partial | 3 | 15% |
| ❌ Not Covered | 2 | 10% |
| ❔ Undecided | 0 | 0% |

### Coverage by Phase <!-- SECTION: Coverage by Phase -->

| Phase | Requirements | Covered | Partial | Gaps | Coverage |
|-------|-------------|---------|---------|------|----------|
| Phase 1 | 12 | 11 | 1 | 0 | 91% |
| Phase 2 | 8 | 4 | 2 | 2 | 50% |

## Gap Report <!-- SECTION: Gap Report -->

### ❌ Not Covered

| UC | Requirement | Source | Suggested Section |
|----|-------------|--------|-------------------|
| 3 | The desk clerk prints the order slip. | Primary Flow | docs/04 |
| 4 | Refunds reach the card within 5 days. | Postcondition | docs/05 |

### ⚠️ Partial

| UC | Requirement | Evidence | Gap |
|----|-------------|----------|-----|
| 2 | Orders over 500 need a second approval. | docs/04 § 3 | the approver is not named |
`

describe('coverage model', () => {
  test('reads the summary, each phase and the gaps', () => {
    const c = parseCoverage(REPORT)!
    expect(c).toMatchObject({ specVersion: '1.4', archVersion: '2.1.0', date: '2026-10-30', total: 20, covered: 15, partial: 3, gaps: 2, undecided: 0 })
    expect(c.phases).toEqual([{ phase: 'Phase 1', total: 12, covered: 11, partial: 1, gaps: 0 }, { phase: 'Phase 2', total: 8, covered: 4, partial: 2, gaps: 2 }])
    expect(c.notCovered.map((x) => x.uc)).toEqual(['3', '4'])
    expect(c.partials[0]).toEqual({ uc: '2', req: 'Orders over 500 need a second approval.', gap: 'the approver is not named' })
    expect(coveredPct(c)).toBe(75)
  })
  test('a CRLF report reads the same; any other text is not a report', () => {
    expect(parseCoverage(REPORT.replace(/\n/g, '\r\n'))?.covered).toBe(15)
    expect(parseCoverage('# Something else\n')).toBeNull()
  })
})
