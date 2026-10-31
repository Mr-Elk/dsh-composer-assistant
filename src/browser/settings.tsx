import { useEffect, useState, useSyncExternalStore } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { resolveConfig } from '../core/config'
import { DEFAULT_CONFIG, type AssistantConfig } from '../core/types'
import type { BrowserRuntime } from './runtime'

type SettingsProps = PropsRuntime<'settings.section'> & { runtime: BrowserRuntime }
const NUMBERS = [
  ['debounceMs', '续写停顿', '毫秒', 200, 5000],
  ['minIntervalMs', '续写请求最小间隔', '毫秒', 500, 30000],
  ['maxHistoryChars', '会话上下文上限', '字符', 1000, 64000],
  ['maxDraftChars', '待处理草稿上限', '字符', 100, 32000],
  ['maxNextChars', '下一句长度上限', '字符', 20, 300],
  ['maxCompletionChars', '续写长度上限', '字符', 10, 200],
  ['optimizeTimeoutMs', '优化超时', '毫秒', 1000, 120000],
  ['suggestionTimeoutMs', '自动建议超时', '毫秒', 1000, 60000],
] as const

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
  return <form className="dsh-ia dsh-ia-settings" aria-label="输入助手设置" onSubmit={event => { void save(event) }}>
    <p className="dsh-ia-settings-intro">帮助你形成准确、可发送的输入。各功能独立开关，采纳内容后仍由你发送。</p>
    {loading && <p role="status">正在加载设置…</p>}
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    <fieldset disabled={loading || saving || generation === null || !accepted} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <section className="dsh-ia-group">
        <h3>功能</h3>
        <div className="dsh-ia-rows">
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>提示词优化</b><small>把草稿或选中文字改写成可发送的表达</small></span>
            <span className="dsh-ia-control"><input className="dsh-ia-switch" type="checkbox" aria-label="提示词优化" checked={form.optimizeEnabled} onChange={event => change('optimizeEnabled', event.target.checked)} /></span>
          </label>
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>回复后预测</b><small>助手回复结束后，为空输入框预测下一句</small></span>
            <span className="dsh-ia-control"><input className="dsh-ia-switch" type="checkbox" aria-label="回复后预测" checked={form.nextEnabled} onChange={event => change('nextEnabled', event.target.checked)} /></span>
          </label>
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>输入续写</b><small>按当前草稿与光标位置继续写</small></span>
            <span className="dsh-ia-control"><input className="dsh-ia-switch" type="checkbox" aria-label="输入续写" checked={form.completionEnabled} onChange={event => change('completionEnabled', event.target.checked)} /></span>
          </label>
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>草稿暂存</b><small>每个会话保留最多三份草稿</small></span>
            <span className="dsh-ia-control"><input className="dsh-ia-switch" type="checkbox" aria-label="草稿暂存" checked={form.stashEnabled} onChange={event => change('stashEnabled', event.target.checked)} /></span>
          </label>
        </div>
      </section>
      <section className="dsh-ia-group">
        <h3>优化</h3>
        <div className="dsh-ia-rows">
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>优化强度</b><small>轻度只修表达，深度可重组结构；各档都不新增任务或授权</small></span>
            <span className="dsh-ia-control"><select aria-label="优化强度" value={form.optimizationStrength} onChange={event => change('optimizationStrength', event.target.value as AssistantConfig['optimizationStrength'])}>
              <option value="light">轻度润色</option><option value="standard">标准优化</option><option value="deep">深度梳理</option>
            </select></span>
          </label>
        </div>
      </section>
      <section className="dsh-ia-group">
        <h3>建议</h3>
        <div className="dsh-ia-rows">
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>显示方式</b><small>灰字贴着光标；超出可见高度时自动改用候选卡</small></span>
            <span className="dsh-ia-control"><select aria-label="建议显示方式" value={form.displayMode} onChange={event => change('displayMode', event.target.value as AssistantConfig['displayMode'])}>
              <option value="ghost">灰字</option><option value="panel">候选面板</option>
            </select></span>
          </label>
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>触发时机</b><small>自动：每轮结束请求一次；手动：只用菜单里的「换一条建议」</small></span>
            <span className="dsh-ia-control"><select aria-label="触发时机" value={form.nextTrigger} onChange={event => change('nextTrigger', event.target.value as AssistantConfig['nextTrigger'])}>
              <option value="auto">自动</option><option value="manual">手动</option>
            </select></span>
          </label>
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>请求延迟</b><small>自动模式下，轮次结束后等待多久再请求；0 为立即</small></span>
            <span className="dsh-ia-control"><input type="number" aria-label="请求延迟" value={form.nextDelayMs} min={0} max={30000} step={100}
              onChange={event => change('nextDelayMs', Number(event.target.value))} /></span>
          </label>
        </div>
      </section>
      <section className="dsh-ia-group">
        <h3>辅助模型</h3>
        <p className="dsh-ia-muted">两项同时留空时跟随输入框模型。辅助调用单独消耗模型用量。</p>
        <div className="dsh-ia-rows">
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>提供商</b></span>
            <span className="dsh-ia-control"><input type="text" value={form.provider} onChange={event => change('provider', event.target.value)} placeholder="跟随输入框" maxLength={200} autoComplete="off" /></span>
          </label>
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>模型</b></span>
            <span className="dsh-ia-control"><input type="text" value={form.model} onChange={event => change('model', event.target.value)} placeholder="跟随输入框" maxLength={200} autoComplete="off" /></span>
          </label>
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>温度</b><small>0 更稳定，1 更多变化；建议 0.3–0.8</small></span>
            <span className="dsh-ia-control"><input type="number" aria-label="温度" value={form.temperature} min={0} max={2} step={0.1}
              onChange={event => change('temperature', Number(event.target.value))} /></span>
          </label>
          <label className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>推理档</b><small>留空自动取该模型最低档；也可填模型声明过的档位 id</small></span>
            <span className="dsh-ia-control"><input type="text" aria-label="推理档" value={form.reasoningEffort} onChange={event => change('reasoningEffort', event.target.value)} placeholder="自动（最低档）" maxLength={200} autoComplete="off" /></span>
          </label>
        </div>
        <label className="dsh-ia-field">
          <span>额外指令（追加到系统提示词，最多 500 字）</span>
          <textarea value={form.extraInstruction} maxLength={500} rows={3} placeholder="例如：用更口语的中文；不要出现列表；优先给出下一步验证"
            onChange={event => change('extraInstruction', event.target.value)} />
        </label>
      </section>
      <section className="dsh-ia-group">
        <h3>高级</h3>
        <div className="dsh-ia-rows">
          {NUMBERS.map(([key, label, unit, min, max]) => <label key={key} className="dsh-ia-item">
            <span className="dsh-ia-item-main"><b>{label}</b><small>{min.toLocaleString()}–{max.toLocaleString()} {unit}</small></span>
            <span className="dsh-ia-control"><input type="number" aria-label={`${label}（${unit}）`} value={Number.isNaN(form[key]) ? '' : form[key]} min={min} max={max} step={1} required
              onChange={event => change(key, event.target.value === '' ? NaN : Number(event.target.value))} /></span>
          </label>)}
        </div>
      </section>
      <div className="dsh-ia-settings-actions">
        <button type="submit" className="dsh-ia-primary" disabled={!changed}>{saving ? '保存中…' : '保存设置'}</button>
        <button type="button" disabled={!changed} onClick={() => { if (accepted) setForm(accepted); setError(''); setMessage('已放弃未保存的修改') }}>放弃修改</button>
        {changed && <span className="dsh-ia-muted">有未保存的修改</span>}
      </div>
    </fieldset>
  </form>
}
