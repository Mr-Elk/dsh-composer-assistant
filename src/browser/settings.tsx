import { useEffect, useState, useSyncExternalStore } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { resolveConfig } from '../core/config'
import { DEFAULT_CONFIG, type AssistantConfig } from '../core/types'
import type { BrowserRuntime } from './runtime'

type SettingsProps = PropsRuntime<'settings.section'> & { runtime: BrowserRuntime }

function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <div className="dsh-ia-item">
    <span className="dsh-ia-item-main"><b>{title}</b>{hint && <small>{hint}</small>}</span>
    <span className="dsh-ia-control">{children}</span>
  </div>
}

/** A root-scoped DSH settings section; works even when no composer is mounted. */
export function AssistantSettings({ runtime }: SettingsProps) {
  const generation = useSyncExternalStore(runtime.connection.generation.subscribe.bind(runtime.connection.generation),
    () => runtime.transport.generation(), () => null)
  const [accepted, setAccepted] = useState<AssistantConfig | null>(null)
  const [form, setForm] = useState<AssistantConfig>({ ...DEFAULT_CONFIG })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true); setError(''); setMessage('')
    if (generation === null) { setLoading(false); setError('连接已断开，请重连后加载设置'); return () => abort.abort() }
    void runtime.transport.call<AssistantConfig>('settings/get', {}, abort.signal).then(settings => {
      if (abort.signal.aborted) return
      const normalized = resolveConfig(settings)
      setAccepted(normalized); setForm(normalized); setLoading(false)
    }).catch(reason => { if (!abort.signal.aborted) { setLoading(false); setError(reason instanceof Error ? reason.message : '设置加载失败') } })
    return () => abort.abort()
  }, [runtime, generation])
  const change = <K extends keyof AssistantConfig>(key: K, value: AssistantConfig[K]) => {
    setForm(previous => ({ ...previous, [key]: value })); setMessage(''); setError('')
  }
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!accepted || saving || generation === null) return
    setError(''); setMessage('')
    let draft: AssistantConfig
    try { draft = resolveConfig(form) }
    catch (reason) { setError(reason instanceof Error ? reason.message : '设置无效'); return }
    setSaving(true)
    try {
      const patch = Object.fromEntries(Object.entries(draft).filter(([key, value]) => value !== accepted[key as keyof AssistantConfig])) as Partial<AssistantConfig>
      const settings = await runtime.saveSettings(patch)
      if (runtime.transport.generation() !== generation) return
      setAccepted(settings); setForm(settings); setMessage('设置已保存并生效')
    } catch (reason) { setError(`保存未确认：${reason instanceof Error ? reason.message : '请重试'}；请重新打开设置核对`) }
    finally { setSaving(false) }
  }
  const changed = accepted !== null && JSON.stringify(form) !== JSON.stringify(accepted)
  const toggle = (key: 'optimizeEnabled' | 'nextEnabled' | 'completionEnabled' | 'stashEnabled', label: string, hint: string) =>
    <label className="dsh-ia-item">
      <span className="dsh-ia-item-main"><b>{label}</b><small>{hint}</small></span>
      <span className="dsh-ia-control"><input className="dsh-ia-switch" type="checkbox" aria-label={label} checked={form[key]} onChange={event => change(key, event.target.checked)} /></span>
    </label>
  return <form className="dsh-ia dsh-ia-settings" aria-label="输入助手设置" onSubmit={event => { void save(event) }}>
    <p className="dsh-ia-settings-intro">帮助你形成准确、可发送的输入。开关决定要不要这个功能，其余保持默认即可。</p>
    {loading && <p role="status">正在加载设置…</p>}
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    <fieldset className="dsh-ia-settings-fieldset" disabled={loading || saving || generation === null || !accepted}>
      <section className="dsh-ia-group">
        <h3>功能</h3>
        <div className="dsh-ia-rows">
          {toggle('optimizeEnabled', '提示词优化', '把草稿或选中文字改写成可发送的表达')}
          {toggle('nextEnabled', '回复后预测', '助手回复结束后，为空输入框预测下一句')}
          {toggle('completionEnabled', '输入续写', '按当前草稿与光标位置继续写')}
          {toggle('stashEnabled', '草稿暂存', '每个会话保留最多三份草稿')}
        </div>
      </section>
      <section className="dsh-ia-group">
        <h3>建议</h3>
        <div className="dsh-ia-rows">
          <Row title="建议长度" hint="短更克制，长更完整；超出输入框可见高度时会自动改用候选卡">
            <select aria-label="建议长度" value={form.suggestionLength} onChange={event => change('suggestionLength', event.target.value as AssistantConfig['suggestionLength'])}>
              <option value="short">短</option><option value="standard">标准</option><option value="long">长</option>
            </select>
          </Row>
          <Row title="触发方式" hint="自动：每轮结束请求一次；手动：只用菜单里的「换一条建议」">
            <select aria-label="触发方式" value={form.nextTrigger} onChange={event => change('nextTrigger', event.target.value as AssistantConfig['nextTrigger'])}>
              <option value="auto">自动</option><option value="manual">手动</option>
            </select>
          </Row>
        </div>
      </section>
      <section className="dsh-ia-group">
        <h3>优化</h3>
        <div className="dsh-ia-rows">
          <Row title="优化强度" hint="轻度只修表达，深度可重组结构；各档都不新增任务或授权">
            <select aria-label="优化强度" value={form.optimizationStrength} onChange={event => change('optimizationStrength', event.target.value as AssistantConfig['optimizationStrength'])}>
              <option value="light">轻度润色</option><option value="standard">标准优化</option><option value="deep">深度梳理</option>
            </select>
          </Row>
        </div>
      </section>
      <section className="dsh-ia-group">
        <h3>辅助模型</h3>
        <p className="dsh-ia-group-note">两项同时留空时跟随输入框模型；辅助调用单独消耗模型用量。</p>
        <div className="dsh-ia-rows">
          <Row title="提供商"><input type="text" aria-label="提供商" value={form.provider} onChange={event => change('provider', event.target.value)} placeholder="跟随输入框" maxLength={200} autoComplete="off" /></Row>
          <Row title="模型"><input type="text" aria-label="模型" value={form.model} onChange={event => change('model', event.target.value)} placeholder="跟随输入框" maxLength={200} autoComplete="off" /></Row>
        </div>
      </section>
      <section className="dsh-ia-group">
        <h3>高级</h3>
        <div className="dsh-ia-rows">
          <Row title="上下文上限" hint="参与建议的对话上下文字数；越长越完整，也越贵">
            <input type="number" aria-label="上下文上限" value={form.maxHistoryChars} min={1000} max={64000} step={1000}
              onChange={event => change('maxHistoryChars', Number(event.target.value))} />
          </Row>
          <Row title="建议超时" hint="5–60 秒；模型较慢时可放宽，超时不会改动草稿">
            <input type="number" aria-label="建议超时（秒）" value={Math.round(form.suggestionTimeoutMs / 1000)} min={5} max={60} step={1}
              onChange={event => change('suggestionTimeoutMs', Number(event.target.value) * 1000)} />
          </Row>
          <Row title="每小时调用上限" hint="全局上限，只计自动建议；0 表示不限制，手动优化与「换一条」不计入">
            <input type="number" aria-label="每小时调用上限" value={form.hourlyCallLimit} min={0} max={2000} step={10}
              onChange={event => change('hourlyCallLimit', event.target.value === '' ? Number.NaN : Number(event.target.value))} />
          </Row>
          <Row title="温度" hint="0.3 稳定 / 0.7 平衡 / 1.0 发散；越低越保守">
            <input type="number" aria-label="温度" value={Number.isNaN(form.temperature) ? '' : form.temperature} min={0} max={2} step={0.1}
              onChange={event => change('temperature', event.target.value === '' ? Number.NaN : Number(event.target.value))} />
          </Row>
        </div>
        <label className="dsh-ia-field dsh-ia-field-block">
          <span className="dsh-ia-field-title">额外指令</span>
          <span className="dsh-ia-field-hint">追加到系统提示词，最多 500 字；例如“用更口语的中文”“不要出现列表”</span>
          <textarea aria-label="额外指令" value={form.extraInstruction} maxLength={500} rows={3}
            placeholder="例如：用更口语的中文；不要出现列表；优先给出下一步验证"
            onChange={event => change('extraInstruction', event.target.value)} />
        </label>
      </section>
      <div className="dsh-ia-settings-actions">
        <button type="submit" className="dsh-ia-primary" disabled={!changed}>{saving ? '保存中…' : '保存设置'}</button>
        <button type="button" disabled={!changed} onClick={() => { if (accepted) setForm(accepted); setError(''); setMessage('已放弃未保存的修改') }}>放弃修改</button>
        {changed && <span className="dsh-ia-muted">有未保存的修改</span>}
      </div>
    </fieldset>
  </form>
}
