## What to build

A global Toast UI primitive wrapping Base UI `Toast`, mounted once in the app so toasts
actually render. Replace `sonner` entirely: remove the dependency and rewrite the two
`toast.error` calls in `@queryClient.ts` to use the new imperative API (`createToastManager`),
so existing query error handling keeps working through the new system.

## Acceptance criteria

- [ ] `src/components/ui/Toast/` exists (index + styles.module.css + types) wrapping Base UI Toast, tokenized, supporting success/error variants
- [ ] Toast viewport mounted once in `main.tsx`
- [ ] An imperative API (`createToastManager`-based) can fire success/error toasts from outside React
- [ ] `@queryClient.ts` fires errors through the new API; `sonner` import removed
- [ ] `sonner` removed from `package.json`; no remaining references in `src`
- [ ] A success and an error toast render visibly and auto-dismiss
- [ ] `npm run tsc` and `npm run lint` pass

## Blocked by

None - can start immediately
