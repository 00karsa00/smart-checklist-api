# Working in this repo

Read README.md sections "One place for libraries" and "Modules" before changing code.

- Only `src/infrastructure/` may import third-party packages or read `process.env`. Elsewhere, import the wrappers. To use a new library, wrap it there first.
- This is a skeleton with no business code. New features are new modules: copy `src/modules/item` (the reference), then add one line to `src/modules/index.ts`. Do not edit other modules to add a feature.
- Controllers return data only; services hold business rules and never touch HTTP or models; repositories are the only code that uses models.
- Validators are `Guard`s that throw `AppError`. Reuse `src/common/validation/rules.ts`.
- Skeleton (structural) changes go on the `skeleton` branch, then merge into the working branch. Log them in SKELETON_CHANGELOG.md.
- One implementation per helper: search `src/common` and `src/infrastructure` before writing a function (README "Reuse before you write"). To change behaviour, edit the original or add a parameter; never add a second version. Services reuse each other's `get…ById` for existence/ownership checks.
- Run `npm run check` before committing; it includes `dup:check`, which fails on duplicated code.
