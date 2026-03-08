import { useState, useCallback } from 'react'

interface FormDialogState {
  open: boolean
  loading: boolean
  msg: string
  error: string
}

export function useFormDialog() {
  const [state, setState] = useState<FormDialogState>({
    open: false,
    loading: false,
    msg: '',
    error: '',
  })

  const openDialog = useCallback(() => {
    setState({ open: true, loading: false, msg: '', error: '' })
  }, [])

  const close = useCallback(() => {
    setState(s => ({ ...s, open: false }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(s => ({ ...s, loading }))
  }, [])

  const setMsg = useCallback((msg: string) => {
    setState(s => ({ ...s, msg }))
  }, [])

  const setError = useCallback((error: string) => {
    setState(s => ({ ...s, error }))
  }, [])

  return { ...state, openDialog, close, setLoading, setMsg, setError }
}
