import { toast, type Id, type ToastOptions } from 'react-toastify'

/**
 * The app's one way to show a toast. Wrapping react-toastify keeps timings and
 * layout consistent and leaves a single place to change if the library does.
 *
 *   notify.success('Saved')
 *   const id = notify.loading('Reading file…')
 *   notify.resolve(id, 'error', { title: 'Import failed', body: '…' })
 */

type Message = string | { title: string; body?: string }

/** Successes and info go on their own; errors stay until dismissed, since they explain what to do. */
const DURATION = { success: 4000, info: 4000, error: false } as const

function render(message: Message) {
  if (typeof message === 'string') return message
  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-semibold">{message.title}</p>
      {message.body ? (
        <p className="text-content-muted text-[13px] leading-snug">{message.body}</p>
      ) : null}
    </div>
  )
}

function show(type: 'success' | 'info' | 'error', message: Message, options?: ToastOptions) {
  return toast[type](render(message), { autoClose: DURATION[type], ...options })
}

export const notify = {
  success: (message: Message, options?: ToastOptions) => show('success', message, options),
  info: (message: Message, options?: ToastOptions) => show('info', message, options),
  error: (message: Message, options?: ToastOptions) => show('error', message, options),

  /** A spinner toast for work in progress; finish it with `resolve`. */
  loading: (message: Message) => toast.loading(render(message)),

  /** Turn a loading toast into its outcome, in place, so the two never stack. */
  resolve(id: Id, type: 'success' | 'info' | 'error', message: Message) {
    toast.update(id, {
      render: render(message),
      type,
      isLoading: false,
      autoClose: DURATION[type],
      closeOnClick: true,
      closeButton: true,
    })
  },

  dismiss: (id?: Id) => toast.dismiss(id),
}
