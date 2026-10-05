# Tasks: Blog Article Share Layout — Top Only, More Air

**Spec**: specs/002-article-share-layout/spec.md · **Plan**: plan.md
Legend: [x] done · [ ] open · [OWNER] needs Tristen's decision

## Gate
- [x] T001 Wireframes updated first: WF-04 (top-only share row drawn under the strata, 22px/20px clearances; end block removed) and WF-03 (list margin note) — docs/wireframes/
- [x] [OWNER] T002 Tristen approves the wireframe revision — **blocks all tasks below**

## Implementation (after T002)
- [x] T003 Remove .post-footer/{{SHARE_BOTTOM}} from template + generator
- [x] T004 blog.v10.css with the new spacing; templates repointed
- [x] T005 Rebuild, local verification (one share row per article; index margin 44px)
- [x] T006 Push + live verification (d94719e: both articles 1 share row / 0 post-footer live; AEO/SEO re-check runs via the on-push hook)
- [x] T007 Wireframe revision log marked approved; spec status → implemented
