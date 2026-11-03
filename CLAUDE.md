# Working in this repo

Read README.md sections "One place for libraries" and "Modules" before changing code.

- Only `src/infrastructure/` may import third-party packages or read `process.env`. Elsewhere, import the wrappers. To use a new library, wrap it there first.
- New features are new modules: copy `src/modules/account`, then add one line to `src/modules/index.ts`. Do not edit other modules to add a feature.
- Controllers return data only; services hold business rules and never touch HTTP or models; repositories are the only code that uses models.
- Validators are `Guard`s that throw `AppError`. Reuse `src/common/validation/rules.ts`.
- Skeleton (structural) changes go on the `skeleton` branch, then merge into the working branch. Log them in SKELETON_CHANGELOG.md.
- Run `npm run check` before committing.
