# Contributing to Seolens

Thanks for your interest in improving Seolens.

## Quick start

```bash
git clone https://github.com/bluegalaxydev/seolens.git
cd seolens
npm install
node bin/seolens.js https://example.com
```

## Adding a new check

1. Open the relevant file under `src/checks/` (e.g. `meta.js`, `headings.js`).
2. Add a new entry to the exported array following this shape:

```js
{
  id: 'category.your-check-id',
  category: 'meta',
  weight: 2,                        // 1-5, higher = more impact on score
  label: 'Short human-readable label',
  run: ({ $, url, status, headers, html }) => {
    // ... your logic
    return { passed: true, message: 'All good' };
    // or
    return {
      passed: false,
      severity: 'warning',           // 'critical' | 'warning' | 'info'
      message: 'What went wrong',
      fix: 'How to fix it',
    };
  },
}
```

3. Run the tool against a URL you know has (or doesn't have) the issue to verify behavior.

## Contributor License Agreement (CLA)

By submitting a pull request, you agree that:

1. You have the right to license your contribution under this project's MIT license.
2. You grant the project maintainer (bluegalaxydev) a perpetual, irrevocable, worldwide, royalty-free license to use, modify, sublicense, and distribute your contribution as part of Seolens, including in any future commercial or derivative versions of the project.

This is necessary so that the project can be relicensed or sold as a whole in the future without requiring sign-off from every contributor.

## Code style

- ES modules (`.js` with `"type": "module"`)
- 2-space indentation
- Prefer small, focused functions
- No external dependencies for new checks unless absolutely necessary

## Reporting bugs

Open an issue with:
- The URL you ran Seolens against (if public)
- The full output (with `DEBUG=1` set if relevant)
- What you expected to happen
- Your Node version (`node -v`)
