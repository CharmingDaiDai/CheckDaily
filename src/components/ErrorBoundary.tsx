import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(circle_at_50%_10%,rgb(216_111_47/0.12),transparent_34%),linear-gradient(180deg,#fffdf9_0%,#f5f1ea_58%,#eee9df_100%)]">
          <div className="surface-frame text-center max-w-sm w-full px-7 py-7">
            <div className="w-14 h-14 rounded-[0.9rem] bg-brand-100/80 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">😵</span>
            </div>
            <h1 className="headline-premium text-xl mb-2">页面出错了</h1>
            <p className="text-sm text-[var(--color-ink-600)] mb-6">
              很抱歉，应用遇到了意外错误。请尝试刷新页面或返回首页。
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-5 py-2.5 rounded-[var(--radius-control)] text-sm font-semibold border border-[var(--color-line-soft)] text-[var(--color-ink-700)] hover:bg-white/72 transition-colors"
              >
                重试
              </button>
              <a
                href="/"
                className="px-5 py-2.5 rounded-[var(--radius-control)] text-sm font-semibold bg-[linear-gradient(155deg,#e98c4c_0%,#d86f2f_48%,#a94b22_100%)] text-white hover:brightness-[1.02] transition-colors"
              >
                回到首页
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
