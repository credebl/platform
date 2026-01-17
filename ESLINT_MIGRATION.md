# ESLint Migration Guide

## Changes Made

This migration upgrades the project from ESLint v8 with legacy configuration to ESLint v9 with flat configuration format.

### Package Updates

- `@typescript-eslint/eslint-plugin`: `^6.2.1` → `^8.14.0`
- `@typescript-eslint/parser`: `^6.2.1` → `^8.14.0`
- `eslint`: `^8.46.0` → `^9.14.0`
- `@types/node`: `^20.4.6` → `^22.9.0`
- `typescript`: `^5.1.6` → `^5.6.3`
- `prettier`: `^3.0.1` → `^3.3.3`
- `eslint-config-prettier`: `^8.10.0` → `^9.1.0`
- `eslint-plugin-prettier`: `^4.2.1` → `^5.2.1`
- `eslint-plugin-promise`: `^6.1.1` → `^7.1.0`

### New Dependencies

- `@eslint/js`: `^9.14.0` (required for flat config)

### Removed Dependencies

- `eslint-config-standard-with-typescript`: No longer needed with flat config
- `eslint-plugin-import`: Functionality integrated into core ESLint
- `eslint-plugin-n`: Not required for this project setup

### Configuration Changes

- **Old**: `.eslintrc.js` (legacy format)
- **New**: `eslint.config.js` (flat config format)

The new configuration maintains all existing rules while using the modern flat config structure.

### Node.js Version

- Updated minimum Node.js version from `>=18` to `>=20` (current LTS)

## Migration Steps for Developers

1. Install dependencies: `pnpm install`
2. The old `.eslintrc.js` is backed up as `.eslintrc.js.backup`
3. ESLint now uses `eslint.config.js` for configuration
4. All existing lint rules are preserved

## Verification

Run the following commands to verify the migration:

```bash
# Check ESLint configuration
pnpm lint

# Run tests to ensure no breaking changes
pnpm test
```

## References

- [ESLint Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [TypeScript ESLint v8 Migration](https://typescript-eslint.io/blog/announcing-typescript-eslint-v8-beta/)
