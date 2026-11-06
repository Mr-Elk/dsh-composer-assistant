import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { resolveConfig } from '../core/config'
import { countPreserveTerms, PRESERVE_TERMS_MAX } from '../core/protection'
import { DEFAULT_CONFIG, type AssistantConfig, type ModelCatalog, type ModelOption } from '../core/types'
import { PLUGIN_VERSION } from '../core/version'
import { LANGUAGE_SELECTION_ENABLED, effectiveLanguage, resolveUiLocale, t, type MessageKey } from '../core/i18n'
import { isSettingsDraftDirty, settingsPatch } from './settings-draft'
import { InfoTip } from './info-tip'
import { useDialogFocus } from './dialog-focus'
import { errorCopy } from './error-copy'
import type { BrowserRuntime } from './runtime'
import type { UsageMetrics } from './controller'

type SettingsProps = PropsRuntime<'settings.section'> & { runtime: BrowserRuntime }
const SETTINGS_DRAFT_KEY = 'dsh.input-assistant.settings-draft.v1'
type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string
type ToastState = { text: string; tone: 'success' | 'info'; ttl: number; id: number }
/** Normalize numeric input while typing: strip leading zeros, keep decimals and sign. */
function readNumberInput(event: ChangeEvent<HTMLInputElement>): number {
  const input = event.currentTarget
  const raw = input.value
  const normalized = raw.replace(/^(-?)0+(?=\d)/, '$1')
  if (normalized !== raw) input.value = normalized
  return normalized === '' ? Number.NaN : Number(normalized)
}


function Chevron({ up = false }: { up?: boolean }) {
  return <svg className="dsh-ia-chevron" aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none">
    <path d={up ? 'M4 10 8 6l4 4' : 'M4 6l4 4 4-4'} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

function ChevronRight() {
  return <svg className="dsh-ia-chevron" aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none">
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

function Row({ title, hint, hintLabel, helpLabel, disabled, children }: {
  title: string; hint?: string; hintLabel?: string; helpLabel?: string; disabled?: boolean; children: ReactNode
}) {
  return <div className={`dsh-ia-item${disabled ? ' dsh-ia-item-disabled' : ''}`} aria-disabled={disabled || undefined}>
    <span className="dsh-ia-item-main"><span className="dsh-ia-item-title"><b>{title}</b>{hint && <InfoTip text={hint} label={`${helpLabel ?? 'Help'}: ${hintLabel ?? title}`} />}</span></span>
    <span className="dsh-ia-control">{children}</span>
  </div>
}

function AboutDialog({ open, onClose, translate }: {
  open: boolean; onClose: () => void; translate: Translate
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'failed'>('idle')
  useDialogFocus(open, dialogRef, closeRef, onClose)
  useEffect(() => { if (!open) setCopied('idle') }, [open])
  if (!open) return null
  const command = 'dsh plugin --profile desktop add dsh-composer-assistant'
  const copy = async () => {
    try { await navigator.clipboard.writeText(command); setCopied('ok') }
    catch { setCopied('failed') }
  }
  return createPortal(<div className="dsh-ia dsh-ia-about-backdrop" onPointerDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={dialogRef} className="dsh-ia-about" role="dialog" aria-modal="true" aria-label={translate('about.title')}>
      <div className="dsh-ia-about-head"><b>{translate('about.title')}</b>
        <button ref={closeRef} type="button" className="dsh-ia-about-close" aria-label={translate('about.close')} onClick={onClose}>×</button>
      </div>
      <div className="dsh-ia-about-row"><span>{translate('about.version')}</span><span>{PLUGIN_VERSION}</span></div>
      <div className="dsh-ia-about-upgrade">
        <span className="dsh-ia-about-label">{translate('about.upgrade')}</span>
        <p className="dsh-ia-about-hint">{translate('about.upgradeHint')}</p>
        <div className="dsh-ia-about-command">
          <code>{command}</code>
          <button type="button" onClick={() => { void copy() }}>{copied === 'ok' ? translate('about.copied') : translate('about.copy')}</button>
        </div>
        <p className="dsh-ia-about-note" role="status">{copied === 'failed' ? translate('about.copyFailed') : translate('about.restartNote')}</p>
      </div>
    </div>
  </div>, document.body)
}

/** A root-scoped DSH settings section; works even when no composer is mounted. */
export function AssistantSettings({ runtime }: SettingsProps) {
  const generation = useSyncExternalStore(runtime.connection.generation.subscribe.bind(runtime.connection.generation),
    () => runtime.transport.generation(), () => null)
  const [accepted, setAccepted] = useState<AssistantConfig | null>(null)
  const [form, setForm] = useState<AssistantConfig>({ ...DEFAULT_CONFIG })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const toastSequence = useRef(0)
  const shellRef = useRef<HTMLDivElement>(null)
  const toastRef = useRef<HTMLDivElement>(null)
  const [toastPosition, setToastPosition] = useState<{ left: number; top: number } | null>(null)
  const showToast = (text: string, tone: ToastState['tone'] = 'success', ttl = 2000) => {
    setToastPosition(null)
    setToast({ text, tone, ttl, id: ++toastSequence.current })
  }
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.ttl)
    return () => clearTimeout(timer)
  }, [toast])

  // Center inside the settings surface's visible area, then move to the nearest
  // gap if the compact pill would cover an input, select or textarea.
  useLayoutEffect(() => {
    if (!toast) { setToastPosition(null); return }
    const shell = shellRef.current, node = toastRef.current
    if (!shell || !node) return
    const shellRect = shell.getBoundingClientRect()
    const left = Math.max(0, shellRect.left)
    const top = Math.max(0, shellRect.top)
    const right = Math.min(window.innerWidth, shellRect.right)
    const bottom = Math.min(window.innerHeight, shellRect.bottom)
    if (right <= left || bottom <= top) return
    const rect = node.getBoundingClientRect()
    const width = rect.width, height = rect.height
    const centerX = (left + right) / 2
    const centerY = (top + bottom) / 2
    const controls = [...shell.querySelectorAll<HTMLElement>('input, select, textarea')]
    const overlaps = (candidateTop: number) => controls.some(control => {
      const r = control.getBoundingClientRect()
      if (!r.width && !r.height) return false
      return !(centerX + width / 2 <= r.left || centerX - width / 2 >= r.right
        || candidateTop + height <= r.top || candidateTop >= r.bottom)
    })
    const minTop = top + 8
    const maxTop = Math.max(minTop, bottom - height - 8)
    const base = centerY - height / 2
    const offsets = [0]
    for (let step = 1; step <= 4; step += 1) offsets.push(-step * (height + 12), step * (height + 12))
    let chosen = Math.min(Math.max(base, minTop), maxTop)
    for (const offset of offsets) {
      const candidate = Math.min(Math.max(base + offset, minTop), maxTop)
      if (!overlaps(candidate)) { chosen = candidate; break }
    }
    setToastPosition({ left: centerX - width / 2, top: chosen })
  }, [toast])
  const [catalog, setCatalog] = useState<ModelCatalog | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const aboutButtonRef = useRef<HTMLButtonElement>(null)
  const acceptedRef = useRef<AssistantConfig | null>(null)
  const formRef = useRef<AssistantConfig>(form)
  const dirtyRef = useRef(false)

  const locale = resolveUiLocale(effectiveLanguage(accepted?.language ?? 'follow'), runtime.locale?.() ?? 'zh')
  const tr: Translate = (key, vars) => t(locale, key, vars)

  useEffect(() => {
    const abort = new AbortController()
    setLoading(true); setError(''); setToast(null)
    if (generation === null) { setLoading(false); setError(tr('settings.disconnected')); return () => abort.abort() }
    void runtime.transport.call<AssistantConfig>('settings/get', {}, abort.signal).then(settings => {
      if (abort.signal.aborted) return
      const normalized = resolveConfig(settings)
      let restored: AssistantConfig | null = null
      try {
        const raw = sessionStorage.getItem(SETTINGS_DRAFT_KEY)
        if (raw) restored = resolveConfig(JSON.parse(raw) as Partial<AssistantConfig>)
      } catch { /* ignore invalid draft */ }
      setAccepted(normalized)
      if (restored && isSettingsDraftDirty({ accepted: normalized, draft: restored })) {
        setForm(restored); showToast(tr('settings.restoredDraft'), 'info', 4000)
      } else {
        setForm(normalized)
        try { sessionStorage.removeItem(SETTINGS_DRAFT_KEY) } catch { /* storage unavailable */ }
      }
      setLoading(false)
    }).catch(reason => {
      if (!abort.signal.aborted) { setLoading(false); setError(errorCopy(reason, tr) ?? tr('settings.loadFailed')) }
    })
    return () => abort.abort()
  }, [runtime, generation])

  useEffect(() => {
    let live = true
    setCatalogLoading(true); setCatalogError('')
    if (generation === null) { setCatalogLoading(false); return }
    void runtime.listModels().then(next => {
      if (!live) return
      setCatalog(next); setCatalogLoading(false)
      if (next.failures.length) setCatalogError(tr('settings.modelCatalogFailed'))
    }).catch(reason => {
      if (!live) return
      setCatalogLoading(false); setCatalogError(errorCopy(reason, tr) ?? tr('settings.modelCatalogFailed'))
    })
    return () => { live = false }
  }, [runtime, generation, locale])

  useEffect(() => {
    if (!catalog || !accepted || !accepted.provider || !accepted.model) return
    if (catalog.models.some(model => model.provider === accepted.provider && model.model === accepted.model)) return
    setForm(previous => ({ ...previous, provider: '', model: '' }))
    showToast(tr('settings.modelRemoved'), 'info', 3000)
  }, [catalog, accepted, locale])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'hidden' || generation === null || loading || saving) return
      void runtime.transport.call<AssistantConfig>('settings/get', {}).then(next => {
        if (!accepted) return
        const normalized = resolveConfig(next)
        // A dirty form is not a conflict by itself: a restored draft is dirty
        // against the same accepted settings. Only an actually changed Host
        // document is a conflict.
        if (JSON.stringify(normalized) === JSON.stringify(accepted)) return
        if (isSettingsDraftDirty({ accepted, draft: form })) { setConflict(true); setError(tr('settings.conflict')); return }
        setConflict(false); setError(''); setAccepted(normalized); setForm(normalized)
      }).catch(() => {})
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [runtime, generation, accepted, form, loading, saving, locale])

  const change = <K extends keyof AssistantConfig>(key: K, value: AssistantConfig[K]) => {
    setForm(previous => ({ ...previous, [key]: value })); setToast(null); if (!conflict) setError('')
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!accepted || saving || generation === null) return
    setError(''); setToast(null)
    let patch: Partial<AssistantConfig>
    try { patch = settingsPatch({ accepted, draft: form }) }
    catch (reason) { setError(errorCopy(reason, tr) ?? tr('settings.invalidGeneric')); return }
    if (Object.keys(patch).length === 0) { setForm(accepted); return }
    setSaving(true)
    try {
      const settings = await runtime.saveSettings(patch)
      if (runtime.transport.generation() !== generation) return
      const nextLocale = resolveUiLocale(effectiveLanguage(settings.language), runtime.locale?.() ?? 'zh')
      setAccepted(settings); setForm(settings); setConflict(false); showToast(t(nextLocale, 'settings.saved'), 'success', 2600)
      try { sessionStorage.removeItem(SETTINGS_DRAFT_KEY) } catch { /* storage unavailable */ }
    } catch (reason) {
      setError(errorCopy(reason, tr) ?? tr('settings.saveFailedGeneric'))
    } finally { setSaving(false) }
  }

  const preserveTermCount = countPreserveTerms(form.preserveTerms)
  const preserveTermOverflow = preserveTermCount > PRESERVE_TERMS_MAX
  const changed = accepted !== null && isSettingsDraftDirty({ accepted, draft: form })
  acceptedRef.current = accepted
  formRef.current = form
  dirtyRef.current = changed
  useEffect(() => () => {
    if (!acceptedRef.current || !dirtyRef.current) return
    try { sessionStorage.setItem(SETTINGS_DRAFT_KEY, JSON.stringify(formRef.current)) } catch { /* storage unavailable */ }
  }, [])
  const suggestionDisabled = !form.nextEnabled && !form.completionEnabled
  const currentRoute = runtime.currentRoute()
  const modelHint = [currentRoute ? tr('model.current', { model: currentRoute.model }) : '', tr('model.source'), tr('model.billing')].filter(Boolean).join('；')
  const baseModels = catalog?.models ?? []
  const currentPair: ModelOption | null = form.provider && form.model
    ? { provider: form.provider, providerName: form.provider, model: form.model, name: `${form.provider} / ${form.model}` }
    : null
  const models = currentPair && !baseModels.some(model => model.provider === currentPair.provider && model.model === currentPair.model)
    ? [currentPair, ...baseModels] : baseModels
  const modelValue = form.provider && form.model ? JSON.stringify([form.provider, form.model]) : ''

  const closeAbout = () => {
    setAboutOpen(false)
    requestAnimationFrame(() => aboutButtonRef.current?.focus())
  }

  const reloadSettings = async () => {
    if (generation === null) return
    setLoading(true); setError(''); setToast(null)
    try {
      const settings = await runtime.transport.call<AssistantConfig>('settings/get', {})
      const normalized = resolveConfig(settings)
      setAccepted(normalized); setForm(normalized); setConflict(false)
      try { sessionStorage.removeItem(SETTINGS_DRAFT_KEY) } catch { /* storage unavailable */ }
    } catch (reason) {
      setError(errorCopy(reason, tr) ?? tr('settings.loadFailed'))
    } finally { setLoading(false) }
  }

  const resetDefaults = () => {
    setForm({ ...DEFAULT_CONFIG })
    // A conflict means another window already changed the saved settings. Keep
    // the conflict message and reload action instead of hiding the only recovery.
    if (conflict) setError(tr('settings.conflict'))
    else { setError(''); showToast(tr('settings.resetDone'), 'info', 2600) }
  }

  return <div ref={shellRef} className="dsh-ia dsh-ia-settings-shell">
    <form className="dsh-ia-settings" aria-label={tr('settings.title')} noValidate onSubmit={event => { void save(event) }}>
      <header className="dsh-ia-settings-head">
        <div className="dsh-ia-settings-head-copy">
          <h2>{tr('settings.heading')}</h2>
          <p>{tr('settings.subtitle')}</p>
        </div>
      </header>
      {loading && <p role="status">{tr('settings.loading')}</p>}
      <fieldset className="dsh-ia-settings-fieldset" disabled={loading || saving || generation === null || !accepted}>
        {LANGUAGE_SELECTION_ENABLED && <section className="dsh-ia-group">
          <h3>{tr('settings.general')}</h3>
          <div className="dsh-ia-rows">
            <Row title={tr('settings.language')} hintLabel={tr('settings.language')}>
              <select aria-label={tr('settings.language')} value={form.language} onChange={event => change('language', event.target.value as AssistantConfig['language'])}>
                <option value="follow">{tr('language.follow')}</option>
                <option value="zh">{tr('language.zh')}</option>
                <option value="en">{tr('language.en')}</option>
              </select>
            </Row>
          </div>
        </section>}

        <section className="dsh-ia-group">
          <h3>{tr('settings.features')}</h3>
          <div className="dsh-ia-rows">
            <Row title={tr('settings.optimize')}>
              <span className="dsh-ia-switch"><input type="checkbox" aria-label={tr('settings.optimize')} checked={form.optimizeEnabled} onChange={event => change('optimizeEnabled', event.target.checked)} /><svg className="dsh-ia-switch-svg" viewBox="0 0 44 24" aria-hidden="true"><rect className="dsh-ia-switch-track" x="0" y="0" width="44" height="24" rx="12" ry="12" /><circle className="dsh-ia-switch-knob" cx="12" cy="12" r="10" /></svg></span>
            </Row>
            <Row title={tr('settings.next')}>
              <span className="dsh-ia-switch"><input type="checkbox" aria-label={tr('settings.next')} checked={form.nextEnabled} onChange={event => change('nextEnabled', event.target.checked)} /><svg className="dsh-ia-switch-svg" viewBox="0 0 44 24" aria-hidden="true"><rect className="dsh-ia-switch-track" x="0" y="0" width="44" height="24" rx="12" ry="12" /><circle className="dsh-ia-switch-knob" cx="12" cy="12" r="10" /></svg></span>
            </Row>
            <Row title={tr('settings.completion')}>
              <span className="dsh-ia-switch"><input type="checkbox" aria-label={tr('settings.completion')} checked={form.completionEnabled} onChange={event => change('completionEnabled', event.target.checked)} /><svg className="dsh-ia-switch-svg" viewBox="0 0 44 24" aria-hidden="true"><rect className="dsh-ia-switch-track" x="0" y="0" width="44" height="24" rx="12" ry="12" /><circle className="dsh-ia-switch-knob" cx="12" cy="12" r="10" /></svg></span>
            </Row>
          </div>
        </section>

        <section className="dsh-ia-group">
          <h3>{tr('settings.suggestions')}</h3>
          <div className="dsh-ia-rows">
            <Row helpLabel={tr('common.help')} title={tr('settings.suggestionLength')} hint={tr('settings.hint.suggestionLength')} hintLabel={tr('settings.suggestionLength')} disabled={suggestionDisabled}>
              <select aria-label={tr('settings.suggestionLength')} value={form.suggestionLength} disabled={suggestionDisabled} onChange={event => change('suggestionLength', event.target.value as AssistantConfig['suggestionLength'])}>
                <option value="short">{tr('settings.select.short')}</option>
                <option value="standard">{tr('settings.select.standard')}</option>
                <option value="long">{tr('settings.select.long')}</option>
              </select>
            </Row>
          </div>
        </section>

        <section className="dsh-ia-group">
          <h3>{tr('settings.optimization')}</h3>
          <div className="dsh-ia-rows">
            <Row helpLabel={tr('common.help')} title={tr('settings.strength')} hint={tr('settings.hint.strength')} hintLabel={tr('settings.strength')} disabled={!form.optimizeEnabled}>
              <select aria-label={tr('settings.strength')} value={form.optimizationStrength} disabled={!form.optimizeEnabled} onChange={event => change('optimizationStrength', event.target.value as AssistantConfig['optimizationStrength'])}>
                <option value="light">{tr('settings.select.light')}</option>
                <option value="standard">{tr('settings.select.standardOptimization')}</option>
                <option value="deep">{tr('settings.select.deep')}</option>
              </select>
            </Row>
            <label className="dsh-ia-field dsh-ia-field-block">
              <span className="dsh-ia-field-title">{tr('settings.preserveTerms')} <InfoTip text={tr('settings.hint.preserveTerms')} label={`${tr('common.help')}: ${tr('settings.preserveTerms')}`} /></span>
              <textarea aria-label={tr('settings.preserveTerms')} value={form.preserveTerms} maxLength={1000} rows={2}
                placeholder={tr('settings.preserveTermsPlaceholder')} disabled={!form.optimizeEnabled}
                onChange={event => change('preserveTerms', event.target.value)} />
              <small className={`dsh-ia-field-hint${preserveTermOverflow ? ' dsh-ia-field-warn' : ''}`}>
                {tr('settings.preserveTermsCount', { count: Math.min(preserveTermCount, PRESERVE_TERMS_MAX), max: PRESERVE_TERMS_MAX })}
              </small>
              {preserveTermOverflow && <small className="dsh-ia-field-warn" role="alert">{tr('settings.preserveTermsOverflow', { max: PRESERVE_TERMS_MAX })}</small>}
            </label>
          </div>
        </section>

        <section className="dsh-ia-group">
          <h3>{tr('settings.model')}</h3>
          <div className="dsh-ia-rows">
            <Row helpLabel={tr('common.help')} title={tr('settings.modelLabel')} hint={modelHint} hintLabel={tr('settings.modelLabel')} disabled={catalogLoading}>
              <select aria-label={tr('settings.modelLabel')} value={modelValue} disabled={catalogLoading}
                onChange={event => {
                  const raw = event.target.value
                  if (!raw) { change('provider', ''); change('model', ''); return }
                  const selected = models.find(model => JSON.stringify([model.provider, model.model]) === raw)
                  if (selected) { change('provider', selected.provider); change('model', selected.model) }
                }}>
                <option value="">{tr('model.follow')}</option>
                {models.map(model => <option key={`${model.provider}:${model.model}`} value={JSON.stringify([model.provider, model.model])}>
                  {model.providerName && model.providerName !== model.name ? `${model.providerName} / ${model.name}` : model.name}
                </option>)}
              </select>
            </Row>
            {catalogLoading && <p className="dsh-ia-group-note" role="status">{tr('model.loading')}</p>}
            {catalogError && <p className="dsh-ia-group-note" role="status">{catalogError}</p>}
            {!catalogLoading && !catalogError && catalog && catalog.models.length === 0 && <p className="dsh-ia-group-note">{tr('model.unavailable')}</p>}
          </div>
        </section>

        <section className="dsh-ia-group">
          <button type="button" className="dsh-ia-disclosure" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen(value => !value)}>
            <span>{tr('settings.advanced')}</span>
            <span className="dsh-ia-disclosure-summary">{tr('settings.advancedCount', { count: 5 })}<Chevron up={advancedOpen} /></span>
          </button>
          {advancedOpen && <div className="dsh-ia-rows">
            <Row helpLabel={tr('common.help')} title={tr('settings.context')} hint={tr('settings.hint.context')} hintLabel={tr('settings.context')}>
              <input type="number" aria-label={tr('settings.context')} value={Number.isNaN(form.maxHistoryChars) ? '' : form.maxHistoryChars} min={1000} max={64000} step={1000}
                onChange={event => change('maxHistoryChars', readNumberInput(event))} />
            </Row>
            <Row helpLabel={tr('common.help')} title={tr('settings.timeout')} hint={tr('settings.hint.timeout')} hintLabel={tr('settings.timeout')}>
              <input type="number" aria-label={tr('settings.timeout')} value={Number.isNaN(form.suggestionTimeoutMs) ? '' : Math.round(form.suggestionTimeoutMs / 1000)} min={5} max={60} step={1}
                onChange={event => { const seconds = readNumberInput(event); change('suggestionTimeoutMs', Number.isNaN(seconds) ? Number.NaN : seconds * 1000) }} />
            </Row>
            <Row helpLabel={tr('common.help')} title={tr('settings.hourly')} hint={tr('settings.hint.hourly')} hintLabel={tr('settings.hourly')}>
              <input type="number" aria-label={tr('settings.hourly')} value={Number.isNaN(form.hourlyCallLimit) ? '' : form.hourlyCallLimit} min={0} max={2000} step={1} inputMode="numeric"
                onChange={event => change('hourlyCallLimit', readNumberInput(event))} />
            </Row>
            <Row helpLabel={tr('common.help')} title={tr('settings.temperature')} hint={tr('settings.hint.temperature')} hintLabel={tr('settings.temperature')}>
              <input type="number" aria-label={tr('settings.temperature')} value={Number.isNaN(form.temperature) ? '' : form.temperature} min={0} max={2} step={0.1}
                onChange={event => change('temperature', readNumberInput(event))} />
            </Row>
            <label className="dsh-ia-field dsh-ia-field-block">
              <span className="dsh-ia-field-title">{tr('settings.extra')} <InfoTip text={tr('settings.hint.extra')} label={`${tr('common.help')}: ${tr('settings.extra')}`} /></span>
              <textarea aria-label={tr('settings.extra')} value={form.extraInstruction} maxLength={500} rows={3}
                placeholder={tr('settings.extraPlaceholder')}
                onChange={event => change('extraInstruction', event.target.value)} />
            </label>
          </div>}
        </section>

        {error && <div className="dsh-ia-settings-error" role="alert"><span>{error}</span>{conflict && <button type="button" className="dsh-ia-link" onClick={() => { void reloadSettings() }}>{tr('settings.reload')}</button>}</div>}
        <div className="dsh-ia-settings-actions">
          {changed && <span className="dsh-ia-muted">{tr('settings.unsaved')}</span>}
          <button type="button" disabled={!accepted || saving} onClick={resetDefaults}>{tr('settings.reset')}</button>
          <button type="submit" className="dsh-ia-primary" disabled={!changed || saving || conflict}>{saving ? tr('settings.saving') : tr('settings.save')}</button>
        </div>
      </fieldset>
    </form>
    {toast && createPortal(<div className="dsh-ia dsh-ia-settings-toast-layer"><div key={toast.id} ref={toastRef} className={`dsh-ia-settings-toast is-${toast.tone}`} role="status" aria-atomic="true" style={toastPosition ? { left: toastPosition.left, top: toastPosition.top } : { left: 0, top: 0, visibility: 'hidden' }}><span className="dsh-ia-toast-icon" aria-hidden="true">{toast.tone === 'success' ? '✓' : 'i'}</span><span>{toast.text}</span></div></div>, document.body)}
    <div className="dsh-ia-settings-footer">
      <button ref={aboutButtonRef} type="button" className="dsh-ia-link" onClick={() => setAboutOpen(true)}>{tr('settings.aboutLink')}<ChevronRight /></button>
    </div>
    <AboutDialog open={aboutOpen} onClose={closeAbout} translate={tr} />
  </div>
}
