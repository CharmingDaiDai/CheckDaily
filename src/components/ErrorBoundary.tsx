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
        <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">😵</span>
            </div>
            <h1 className="text-xl font-bold text-stone-800 mb-2">页面出错了</h1>
            <p className="text-sm text-stone-400 mb-6">
              很抱歉，应用遇到了意外错误。请尝试刷新页面或返回首页。
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
              >
                重试
              </button>
              <a
                href="/"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
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
