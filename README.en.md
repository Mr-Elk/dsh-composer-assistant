# DSH Composer Assistant

[简体中文](README.md) | English

Predict the next message, continue a draft, or polish a prompt in the DeepSeek Harness (DSH) composer. The plugin offers editable text only: press `Tab` to accept or `Esc` to dismiss. It never sends a message for you.

The current npm release is still `0.3.0`. GitHub has a `v0.4.0` pre-release for a one-day validation before npm is updated.

## What changed in 0.4.0

- **Automatic suggestions are opt-in for new installs:** next-message prediction and draft completion start disabled; manual optimization stays available. Automatic calls default to 10 per hour. Existing saved switches and limits are preserved.
- **The budget survives restarts:** the merged storage fix persists a reservation before the model call and refuses automatic calls when storage fails.
- **Streaming suggestions (experimental):** ghost text appears while the host is still generating. This is experimental and is not a 0.4.0 release gate; keep or default it based on real latency data later.
- **Session request stats:** the settings popover shows request count and average request time, with accept rate and post-accept edits. It counts requests, not model calls or billing.
- **Glossary protection:** list terms in Settings that optimization must keep verbatim.
- **0.3.0 capabilities remain:** Chinese/English switching, the redesigned settings page, localized errors, and settings-draft recovery.

## Features

| Feature | Behavior |
| --- | --- |
| Next-message prediction | After an assistant response, suggests what you might say next when the composer is empty |
| Draft completion | Suggests a suffix after you pause while drafting; it does not run when the caret is away from the end of the draft |
| Prompt optimization | Rewrites the full draft or selected text; review a diff, undo, copy the original, or ask for another version |

“Regenerate” does not add a conversation turn, but every attempt can still call a model and incur charges.

## Interface

| Chinese settings | English settings |
| --- | --- |
| <img src="docs/images/settings-zh.png" alt="Chinese settings" width="420"> | <img src="docs/images/settings-en.png" alt="English settings" width="420"> |

The settings page is grouped; the composer shows only `✦ Optimize` and `⚙`. One-off actions such as protect selection, view diff, undo, copy original, and regenerate stay in the composer instead of the settings dialog.

The settings popover footer shows `N requests · 1.4 s`. Opening it shows request count, average request time, suggestions shown, accepted, accept rate, and edits after acceptance. The count includes failed, cancelled, and budget-blocked generation requests; it is not a model-call count or a bill. It covers the current session only.

## Installation

Supported DSH range: `>=0.2.1-rc.2 <0.3.0-0`. **0.2.0-rc.2 and earlier are not supported**: peer SDK packages such as `dsh-client-store` and `dsh-client-ui-slots` do not exist in 0.2.0. Node.js `>=22.19` is required; DSH Desktop normally provides its own runtime.

**Desktop install**

1. Open DSH's sidebar → Plugins.
2. Search for `dsh-composer-assistant` and install it.
3. Fully quit DSH and reopen it after installation.

Do not run `dsh plugin --profile desktop add ...` against the desktop profile. The CLI returns `profile "desktop" is managed exclusively by the Electron application`; this is by design, not a broken package.

**Local build**

```shell
pnpm install --frozen-lockfile
pnpm build
pnpm pack --pack-destination dist
```

After building, use the plugin page's local/file install entry if the current DSH version provides one. Without that entry, do not pass the `.tgz` path to the desktop-profile CLI. For web-only verification:

```shell
dsh plugin --profile web add ./dist/dsh-composer-assistant-0.4.0.tgz
```

That command affects only the web profile; it does not mean the desktop plugin is installed.

## Upgrade and rollback

To upgrade: DSH sidebar → Plugins → select `dsh-composer-assistant` → update to the target version, then fully quit and reopen DSH. DSH does not automatically update third-party plugins.

To roll back, install a known-good version or local package from the plugin page if the current DSH version provides a local install entry. Keep a known-good `.tgz` before upgrading. `0.4.0` is not on npm yet; during validation, install the `.tgz` attached to the GitHub Release. npm still serves `0.3.0`.

## Installation troubleshooting

- `profile "desktop" is managed exclusively by the Electron application`: expected; use the sidebar → Plugins, not the CLI.
- `incompatible with dsh`, missing `dsh-client-store`, or missing `dsh-client-ui-slots`: the DSH version is below 0.2.1-rc.2; upgrade DSH first. This is not Windows-specific.
- `0.0.0-stage` is a placeholder package; do not install it.

## Use

| Action | Key |
| --- | --- |
| Accept a suggestion | `Tab` |
| Dismiss the current suggestion | `Esc` |
| Stop the current turn | Press `Esc` twice (existing DSH behavior) |

When a `/` command menu or `@` reference menu is open, DSH owns `Tab` and the plugin does not intercept it. The code suppresses requests while an IME composition is active, but actual IME and native keyboard behavior still needs validation on the target system.

The first time you open the composer, a short onboarding hint explains that automatic suggestions start disabled and that manual optimization can still incur charges. Dismissing it with the button, `Esc`, or an outside click prevents it from appearing automatically again.

## Settings

| Group | Setting | Default | Details |
| --- | --- | --- | --- |
| General | Language | Follow DSH | Follow DSH, or force Chinese or English |
| Features | Prompt optimization | On | Calls a model only when you click the button |
| Features | Next-message prediction, draft completion | Off | New installs do not call automatically; enable each separately |
| Suggestions | Suggestion length | Standard | Short / Standard / Long |
| Optimization | Strength | Standard | Light / Standard / Deep |
| Optimization | Protected terms | Empty | One per line or comma separated; kept verbatim during optimization, up to 20 |
| Auxiliary model | Model | Follow composer | Optionally choose a provider and model from the DSH catalog |
| Advanced | Conversation context limit | 16,000 characters | Caps the conversation text used in requests |
| Advanced | Suggestion timeout | 15 seconds | Configurable from 5 to 60 seconds |
| Advanced | Automatic calls per hour | 10 | Rolling 60-minute budget persisted across restarts; applies only to automatic prediction and completion; 0 means unlimited |
| Advanced | Temperature | 0.7 | Range 0–2; lower values are more stable |
| Advanced | Extra instruction | Empty | Appended to the system prompt; up to 500 characters |

Draft completion debounce is 600 ms, the minimum interval between automatic requests is 2 seconds, and the draft limit is 8,000 characters. These fixed values are not exposed in Settings.

The defaults above apply to new installs and “Restore defaults”. Upgrades preserve saved switches and limits, including an explicit `0` (unlimited); only missing or invalid fields fall back to the new defaults.

**Unsaved settings are retained.** When the settings component unmounts with changes still in the form, the plugin writes that settings form to `sessionStorage` for the current browser tab. Reopening Settings in the same tab restores the unsaved changes when they still differ from the saved DSH settings, and shows a notice. A successful save or explicit reload clears the stored form. “Restore defaults” changes the form only; press Save to persist it to DSH.

### Automatic call budget

Setting the limit to 20 means that, across all conversations under the same DSH configuration, at most 20 automatic prediction or completion calls are reserved in any rolling 60-minute window. Restarting DSH does not reset the budget; a slot is released only after its record is 60 minutes old. Manual optimization and “Regenerate” are not counted and are not blocked by this limit.

The plugin persists a reservation before it dispatches the model call. Once saved, the reservation still counts if the request is cancelled, times out, or the model fails. If saving the reservation fails, the automatic request stops without consuming budget. If the budget record cannot be read or is corrupt, automatic suggestions stop rather than treating the state as a fresh allowance; they can resume after storage recovers. Manual actions remain available but still require normal settings storage and a working model connection. A limit of `0` means unlimited calls, but automatic calls are still recorded.

The budget depends on locally stored data and the system clock. The first upgrade to the persistent version cannot backfill calls made by older versions. Deleting data, changing the configuration directory, or rolling back to an older version removes this protection. The total is not guaranteed when multiple independent DSH processes write the same storage, and it is not a spending cap for the whole model account. Validation covered the real plugin, the official file-storage backend, a separate Node process reopening the store, and a DSH Desktop quit-and-restart at limit 1: after restart the same draft produced no automatic suggestion and manual optimization still worked.

## Model costs and privacy

- Prediction, completion, and optimization call models through DSH's LLM interface. The relevant draft or selection and the conversation text context needed for generation are sent to the model provider configured in DSH; processing is not local-only.
- By default, the plugin follows the model selected in the composer. If you choose an auxiliary model, calls use that provider and model. Charges and data handling follow your DSH configuration and the provider's policies.
- Automatic suggestions are disabled for new installs. Manual optimization and “Regenerate” are explicit user actions, can still incur charges, and are not blocked by the automatic-call limit. The limit is not an account spending cap.
- The plugin never sends or submits a suggestion automatically. You decide whether to accept and send it.
- The plugin uses DSH host services and its LLM interface; this repository does not configure a separate plugin-operated model API or analytics service. Data handling by DSH and model providers is outside the plugin's control.
- Saved settings live in DSH plugin storage. Unsaved **settings form values** are temporarily stored in the current tab's `sessionStorage`; this is separate from the composer draft.
- Streaming only makes the browser read a few more local partials; it does not add model calls.

## Verification scope and known limitations

The package metadata declares DSH compatibility as `>=0.2.1-rc.2 <0.3.0-0` and explicitly lists compatibility records for `0.2.1-rc.3` and `0.2.1-rc.5`. Automated tests, browser fixtures, and an isolated npm install do not establish full compatibility with a live DSH Desktop environment.

`0.4.0` is not on npm yet; a GitHub pre-release is available while it is validated. Automated checks and package verification for this branch are recorded in [docs/validation.md](docs/validation.md). The English release summary is in [CHANGELOG.en.md](CHANGELOG.en.md). A DSH Desktop quit/restart at limit 1 is verified; a real Edge window and a real Chinese IME remain unverified.

- Ghost text is limited to the visible editor area; longer suggestions use a candidate card.
- Streaming applies only to ghost text and is experimental; candidate cards and long suggestions still appear at once.
- Streaming is not part of 0.4.0 desktop acceptance; budget persistence, request stats, and glossary protection have passed on DSH Desktop.
- Request stats cover the current session only and reset on reload. The count includes failed, cancelled, and budget-blocked requests; it is not a model-call count or a bill.
- The automatic-call budget lives in local plugin storage and depends on the system clock. It cannot recover calls made before the persistent version, and is lost if plugin data is deleted or the configuration directory changes. It does not coordinate multiple independent DSH processes and is not an account-level spending cap.
- A saved automatic-call reservation is not refunded when the request is cancelled, times out, or fails. Manual optimization and “Regenerate” are neither counted nor blocked by the limit.
- While `/` or `@` menus are open, `Tab` belongs to the DSH menu.
- A real Chinese IME and native keyboard behavior still need validation on the target system.
- The repository is on an exFAT volume; if pnpm fails there, use `./scripts/local-dev.sh` to build in an APFS temporary directory.

## Development checks

The repository requires Node.js `>=22.19` and pins pnpm `11.28.5`:

```shell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm pack:release
pnpm test:web
pnpm publish:check
```

## License

MIT. This project is modified from [Somnus678/dsh-input-assistant](https://github.com/Somnus678/dsh-input-assistant), retaining the upstream MIT license and copyright notice. New contributions are also released under MIT. This fork: [Mr-Elk/dsh-composer-assistant](https://github.com/Mr-Elk/dsh-composer-assistant).
