# Changelog

This is the English summary. The Chinese [CHANGELOG.md](CHANGELOG.md) remains the detailed record.

## [0.4.0] - unreleased

### Added

- Streaming suggestions: ghost text appears while the host is still generating; the final result remains authoritative.
- Session request stats: request count, average request time, shown/accepted suggestions, accept rate, and edits after acceptance, with copy support.
- Glossary protection: up to 20 unique terms can be kept verbatim during optimization.

### Changed

- New installs keep next-message prediction and draft completion off, with manual optimization available; automatic calls default to 10 per hour. Existing saved settings are preserved.
- Automatic-call reservations persist in a rolling 60-minute budget across restarts and are written before model dispatch.
- Numeric settings normalize leading zeros; the hourly limit is saved with a step of 1.
- The saved/restored settings toast is centered in the visible settings area, uses theme colors, and avoids input controls where possible.
- Glossary input shows the detected term count and warns when more than 20 unique terms are entered.
- The About and session-stats dialogs have bounded height, internal scrolling, and a Tab focus loop.
- The suggestion timeout range is documented and validated as 5–60 seconds (5000–60000 ms).

### Fixed

- Resetting defaults during a settings conflict no longer hides the reload action and leaves Save disabled without a recovery path.
- Suggestion-timeout validation errors now show seconds instead of milliseconds.
- The quick-settings conflict state now offers a reload action.
- The About dialog describes installation through the DSH plugin page instead of showing a desktop-profile CLI command that DSH rejects.

## [0.3.0] - 2026-11-02

- Chinese/English UI switching, localized errors, and a redesigned settings page.
- Prompt optimization, next-message prediction, and draft completion with explicit feature switches.
- Draft recovery, inline result bar, diff review, undo, and candidate card.
- Published as `dsh-composer-assistant@0.3.0` on npm.

Earlier releases remain available in the repository history.
