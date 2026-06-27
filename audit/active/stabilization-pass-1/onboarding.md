# Audit: Onboarding / welcome

**Pass 1:** 🟡 Surface scan  
**Pass 2:** ⬜ Deep dive pending

## Scope

- First-run welcome window / page
- API key probe, model availability
- Skip vs complete flow
- Transition to main chat

## Key paths

| Layer | Paths |
|-------|--------|
| Pages | `src/pages/welcome/` |
| Main | welcome probe in `electron/main/` |
| App | routing gate for first run |

## Pass 1 findings

| ID | Sev | Status | Issue |
|----|-----|--------|-------|
| OB-P1-01 | Medium | Open | Welcome only on desktop? web skips? |
| OB-P1-02 | Medium | Open | Invalid key during welcome — retry UX |
| OB-P1-03 | Low | Open | Welcome re-show after clear data |
| OB-P1-04 | Low | Open | Window close vs in-app navigation |

## Pass 1 checklist

- [ ] Fresh profile → welcome shown
- [ ] Valid key → main app
- [ ] Skip path → limited functionality message?

## Pass 2

- Trace welcome probe IPC and timeouts
