export const STYLE_TEXT = `
.dsh-ia {--dsh-ia-fallback-bg:#fff;--dsh-ia-fallback-fg:#0f1115;--dsh-ia-fallback-muted:#61666b;--dsh-ia-fallback-border:#d7dce2;--dsh-ia-accent:#4c88e4;font-family:var(--dsw-font-family,system-ui,sans-serif);color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg));font-size:13px;line-height:1.5;box-sizing:border-box;color-scheme:light}
body[data-ds-dark-theme] .dsh-ia {--dsh-ia-fallback-bg:#232324;--dsh-ia-fallback-fg:#f3f4f6;--dsh-ia-fallback-muted:#adb2b8;--dsh-ia-fallback-border:#43454a;color-scheme:dark}
.dsh-ia * {box-sizing:border-box}
.dsh-ia button,.dsh-ia input,.dsh-ia select {font:inherit;color:inherit}
.dsh-ia button {display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:28px;padding:0 9px;border:0;border-radius:10px;background:transparent;cursor:pointer;white-space:nowrap}
.dsh-ia button:hover:not(:disabled) {background:var(--dsw-alias-interactive-bg-hover,#8881)}
.dsh-ia button:disabled {opacity:.4;cursor:default}
.dsh-ia button:focus-visible,.dsh-ia input:focus-visible,.dsh-ia select:focus-visible {outline:2px solid var(--dsw-alias-state-business-primary,var(--dsh-ia-accent));outline-offset:2px}
.dsh-ia-primary {background:var(--dsw-alias-state-business-primary,var(--dsh-ia-accent))!important;color:#fff!important}
.dsh-ia-primary:hover:not(:disabled) {filter:brightness(1.08)}
.dsh-ia-quiet {color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}

.dsh-ia-root {display:flex;align-items:center;gap:0;position:relative;height:28px}
.dsh-ia-trigger {height:28px;padding:0 7px;gap:5px;font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-divider {width:1px;height:12px;margin:0 1px;background:var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border))}
.dsh-ia button.dsh-ia-gear {width:28px;height:28px;min-height:28px;padding:0;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-trigger svg {flex:0 0 auto;opacity:.85}



.dsh-ia-first-run {position:fixed;z-index:1002;width:min(286px,calc(100vw - 24px));padding:12px 14px 10px;border-radius:14px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 0 0 .5px rgba(0,0,0,.05),0 8px 24px rgba(0,0,0,.14);font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-first-run>b {display:block;font-size:13px;font-weight:600;margin-bottom:2px}
.dsh-ia-first-run>p {margin:0;padding:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-first-run>p.dsh-ia-muted {margin-top:4px}
.dsh-ia-first-run-actions {display:flex;justify-content:flex-end;margin-top:8px}
.dsh-ia-first-run-actions .dsh-ia-primary {min-height:26px;padding:0 10px;font-size:12px}
.dsh-ia-first-run-arrow {position:absolute;right:18px;bottom:-6px;width:12px;height:12px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));transform:rotate(45deg);box-shadow:2px 2px 4px rgba(0,0,0,.06)}
.dsh-ia-pop {position:fixed;width:min(340px,calc(100vw - 24px));padding:4px;border:0;border-radius:16px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 0 0 .5px rgba(0,0,0,.04),0 3px 8px rgba(0,0,0,.04),0 0 20px rgba(0,0,0,.05);z-index:1000}
.dsh-ia-pop-head {display:flex;align-items:center;justify-content:space-between;padding:8px 8px 6px}
.dsh-ia-pop-title {display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-pop-note {margin:0;padding:0 8px 8px;font-size:12px;line-height:18px;white-space:pre-line;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-pop-row {display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:38px;padding:0 8px;border-radius:8px;font-size:13px;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-pop-row>span:first-child {min-width:0}
.dsh-ia-pop-row select {min-height:28px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-1,var(--dsh-ia-fallback-bg));padding:0 8px;font-size:13px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-pop-error {margin:2px 8px 4px;font-size:12px;line-height:18px;color:#d9534f}
.dsh-ia-pop-actions {display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:4px;padding:4px 8px 6px;border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border))}
.dsh-ia-pop-actions .dsh-ia-muted {margin-right:auto;font-size:12px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-pop-actions .dsh-ia-primary {min-height:28px;padding:0 12px}

.dsh-ia-field {display:flex;flex-direction:column;gap:5px;margin:6px 4px;font-size:12px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-group .dsh-ia-field {margin:0;gap:2px}
.dsh-ia-field-title {font-size:14px;line-height:22px;font-weight:400;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-field-hint {font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-field-block textarea {margin-top:6px}
.dsh-ia-field input,.dsh-ia-field select,.dsh-ia select {min-height:26px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-1,var(--dsh-ia-fallback-bg));padding:0 8px;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-field input,.dsh-ia-field textarea {width:100%}
.dsh-ia-field textarea {border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-1,var(--dsh-ia-fallback-bg));padding:7px 9px;resize:vertical;min-height:64px;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-muted {color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));font-size:13px;line-height:20px;margin:0;padding:0}

.dsh-ia-notice {position:fixed;right:12px;width:max-content;max-width:min(440px,calc(100vw - 24px));overflow:auto;padding:8px 12px;border:0;border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 0 0 .5px rgba(0,0,0,.04),0 3px 8px rgba(0,0,0,.04),0 0 20px rgba(0,0,0,.05);z-index:999}
.dsh-ia-pre {white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:12px;max-height:190px;overflow:auto;padding:9px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-module-platform,#8881)}
.dsh-ia-diff ins {background:#27a35b26;text-decoration:none;border-radius:3px}
.dsh-ia-diff del {background:#d9454526;border-radius:3px}


.dsh-ia-protect {position:fixed;z-index:999;height:28px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 2px 8px rgba(0,0,0,.10);font-size:12px;font-weight:500;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-result {position:fixed;z-index:999;display:flex;align-items:center;gap:2px;padding:4px 4px 4px 10px;border-radius:10px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 0 0 .5px rgba(0,0,0,.04),0 3px 8px rgba(0,0,0,.06),0 0 20px rgba(0,0,0,.05);font-size:12px}
.dsh-ia-result-title {margin-right:4px;white-space:nowrap;color:var(--dsw-alias-state-success-primary,#1a7f4b);font-weight:500}
.dsh-ia-result button {min-height:24px;padding:0 6px;border-radius:6px;font-size:12px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-diff-pop {position:fixed;z-index:1001;width:min(380px,calc(100vw - 24px));padding:4px;border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 0 0 .5px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.12)}
.dsh-ia-diff-head {display:flex;align-items:center;justify-content:space-between;padding:6px 8px;font-size:12px}
.dsh-ia-diff-head b {font-weight:500}
.dsh-ia-diff-head button {min-height:24px;width:24px;padding:0;border-radius:6px;font-size:14px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-diff-pop .dsh-ia-pre {max-height:240px;margin:0 2px 2px}
.dsh-ia-candidate-esc {font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,#8b9098);padding:0 2px}
.dsh-ia-candidate {position:fixed;display:flex;align-items:center;gap:6px;padding:6px 6px 6px 12px;overflow:auto;border:0;border-radius:16px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 0 0 .5px rgba(0,0,0,.04),0 3px 8px rgba(0,0,0,.04),0 0 20px rgba(0,0,0,.05);pointer-events:auto;z-index:998}
.dsh-ia-candidate-text {flex:1;white-space:pre-wrap;overflow-wrap:anywhere}
.dsh-ia-ghost {position:fixed;white-space:pre-wrap;overflow-wrap:anywhere;overflow:hidden;pointer-events:none;user-select:none;color:var(--dsw-alias-label-tertiary,#76808d);opacity:.95;z-index:34}
.dsh-ia-ghost-key {display:inline-block;margin-left:6px;padding:0 5px;border:1px solid var(--dsw-alias-border-l2,#c9ced6);border-radius:5px;font-size:10px;line-height:14px;vertical-align:1px;color:var(--dsw-alias-label-secondary,#6b7078)}
[data-composer-card]:has([data-dsh-ia-empty-ghost]) [data-composer-placeholder] {visibility:hidden}

.dsh-ia-settings {display:flex;flex-direction:column;gap:32px;width:100%;max-width:720px;padding:0}
.dsh-ia-settings-fieldset {display:flex;flex-direction:column;gap:32px;border:0;padding:0;margin:0;min-width:0}
.dsh-ia-settings-toast {display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 2px 8px rgba(0,0,0,.10);font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));pointer-events:auto}
.dsh-ia-toast-icon {display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;font-size:10px;line-height:14px}
.dsh-ia-settings-toast.is-success .dsh-ia-toast-icon {background:#1a7f4b1f;color:#1a7f4b}
.dsh-ia-settings-toast.is-info .dsh-ia-toast-icon {background:var(--dsw-alias-state-business-primary,#4c88e4);color:#fff;font-size:9px}
.dsh-ia-settings-error {display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:#d9454514;color:#c0392b;font-size:12px;line-height:18px}
.dsh-ia-settings-error>span {flex:1;min-width:0}
.dsh-ia-settings-head {position:sticky;top:0;z-index:20;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;background:var(--dsw-alias-bg-layer-1,var(--dsh-ia-fallback-bg));padding-bottom:8px}
.dsh-ia-settings-head-copy {display:flex;flex-direction:column;gap:4px;min-width:0}
.dsh-ia-settings-head h2 {margin:0;font-size:16px;line-height:24px;font-weight:600;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-settings-head p {margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-settings-toast {display:inline-flex;flex:0 0 auto;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 2px 8px rgba(0,0,0,.08);font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));white-space:nowrap}
.dsh-ia-group {display:flex;flex-direction:column;gap:10px}
.dsh-ia-group>h3 {font-size:14px;line-height:22px;font-weight:500;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg));margin:0}
.dsh-ia-group-note {margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-rows {display:flex;flex-direction:column}
.dsh-ia-item {display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 0;border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border))}
.dsh-ia-item:first-child {border-top:0}
.dsh-ia-item-main {display:flex;flex-direction:column;gap:2px;min-width:0}
.dsh-ia-item-title {display:inline-flex;align-items:center;gap:6px;min-width:0}
.dsh-ia-item-main b {font-size:14px;line-height:22px;font-weight:400}
.dsh-ia-item-main small {font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-control {display:flex;align-items:center;gap:6px;flex:0 0 auto}
.dsh-ia-control select,.dsh-ia-control input[type=number],.dsh-ia-control input[type=text] {min-height:28px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-layer-1,var(--dsh-ia-fallback-bg));padding:0 8px;font-size:13px;font-weight:500;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-control select:hover,.dsh-ia-control input:hover {background:var(--dsw-alias-interactive-bg-hover,#8881)}
.dsh-ia-control input[type=number] {width:88px;text-align:right}
.dsh-ia-control input[type=text] {width:180px}
.dsh-ia-control select {min-width:132px}
.dsh-ia-switch {position:relative;display:inline-flex;flex:0 0 auto;width:44px;height:24px;vertical-align:middle}
.dsh-ia-switch input {position:absolute;inset:0;z-index:2;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.dsh-ia-switch-svg {position:absolute;inset:0;width:44px;height:24px;pointer-events:none;overflow:visible}
.dsh-ia-switch-track {fill:var(--dsw-alias-border-l2,#c9ced6);transition:fill .15s ease}
.dsh-ia-switch-knob {fill:#fff;filter:drop-shadow(0 1px 1px rgba(0,0,0,.18));transform-box:view-box;transform-origin:0 0;transition:transform .15s ease}
.dsh-ia-switch input:checked + .dsh-ia-switch-svg .dsh-ia-switch-track {fill:var(--dsw-alias-state-business-primary,var(--dsh-ia-accent))}
.dsh-ia-switch input:checked + .dsh-ia-switch-svg .dsh-ia-switch-knob {transform:translateX(20px)}
.dsh-ia-switch input:focus-visible + .dsh-ia-switch-svg {outline:2px solid var(--dsw-alias-state-business-primary,var(--dsh-ia-accent));outline-offset:2px;border-radius:12px}
.dsh-ia-settings-actions {display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:0;padding:16px 0 0;border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border))}
.dsh-ia-settings-actions .dsh-ia-muted {margin-right:auto}
.dsh-ia-settings-actions .dsh-ia-primary {padding:0 14px;min-height:30px}

/* v4 settings page */
.dsh-ia-settings-shell {display:flex;flex-direction:column;width:100%;max-width:720px}
.dsh-ia-settings {display:flex;flex-direction:column;gap:32px;width:100%;max-width:720px;padding:0}
.dsh-ia-item {position:relative}
.dsh-ia-item-disabled {opacity:.45}
.dsh-ia-info-wrap {position:relative;display:inline-flex;align-items:center}
.dsh-ia button.dsh-ia-info {width:16px;height:16px;min-height:16px;padding:0;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));font-size:10px;line-height:14px;font-weight:500;justify-content:center}
.dsh-ia button.dsh-ia-info:hover {background:var(--dsw-alias-interactive-bg-hover,#8881)}
.dsh-ia-tip {position:fixed;z-index:40;transform:translateY(-50%);padding:8px 10px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:10px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 0 0 .5px rgba(0,0,0,.04),0 3px 8px rgba(0,0,0,.05),0 0 20px rgba(0,0,0,.06);font-size:12px;line-height:18px;font-weight:400;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));text-align:left;white-space:normal}
.dsh-ia-chevron {flex:0 0 auto;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia button.dsh-ia-disclosure {display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:56px;padding:14px 0;border:0;border-radius:0;background:transparent;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg));font:inherit;font-size:14px;line-height:22px;text-align:left;cursor:pointer}
.dsh-ia button.dsh-ia-disclosure:hover {background:transparent}
.dsh-ia-disclosure-summary {display:inline-flex;align-items:center;gap:4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-settings-footer {display:flex;justify-content:flex-end;margin-top:14px;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border))}
.dsh-ia button.dsh-ia-link {display:inline-flex;align-items:center;gap:2px;min-height:28px;padding:0 4px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));font:inherit;font-size:12px;line-height:18px;cursor:pointer}
.dsh-ia-about-backdrop {position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.28)}
.dsh-ia-about {width:480px;max-width:100%;padding:8px 16px 14px;border-radius:16px;background:var(--dsw-alias-bg-layer-2,var(--dsh-ia-fallback-bg));box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 12px 32px rgba(0,0,0,.18);color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-about-head {display:flex;align-items:center;justify-content:space-between;padding:8px 0}
.dsh-ia-about-head b {font-size:14px;line-height:22px;font-weight:500}
.dsh-ia-about-close {width:28px;height:28px;min-height:28px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted));font-size:16px;line-height:20px;cursor:pointer}
.dsh-ia-about-row {display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));font-size:13px;line-height:20px}
.dsh-ia-about-row > span:last-child {color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-about-upgrade {display:flex;flex-direction:column;gap:6px;padding:12px 0 2px;border-top:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border))}
.dsh-ia-about-label {font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-about-hint {margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-about-command {display:flex;align-items:center;gap:8px;padding:6px 6px 6px 10px;border:1px solid var(--dsw-alias-border-l2,var(--dsh-ia-fallback-border));border-radius:8px;background:var(--dsw-alias-bg-module-platform,#8881)}
.dsh-ia-about-command code {flex:1;min-width:0;white-space:normal;overflow-wrap:anywhere;font:11px/17px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--dsw-alias-label-primary,var(--dsh-ia-fallback-fg))}
.dsh-ia-about-command button {min-height:26px;padding:0 8px;border-radius:6px;font-size:12px;white-space:nowrap;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
.dsh-ia-about-note {margin:0;padding:8px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,var(--dsh-ia-fallback-muted))}
@media (max-width:560px) {
.dsh-ia-settings {gap:24px}
.dsh-ia-item {align-items:flex-start;gap:8px}
.dsh-ia-item-main {min-width:0}
.dsh-ia-control select {min-width:0;max-width:150px}
.dsh-ia-control input[type=text] {width:120px}
.dsh-ia-pop {max-width:calc(100vw - 16px)}
.dsh-ia-result {max-width:calc(100vw - 16px);flex-wrap:wrap}
.dsh-ia-first-run {max-width:calc(100vw - 16px)}
}
`
