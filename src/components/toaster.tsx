import { Slide, ToastContainer } from 'react-toastify'

/**
 * Where toasts appear; mounted once in the root layout.
 *
 * It always runs the library's "light" theme: the colours behind that theme
 * are pointed at the site's own tokens in index.css, so toasts follow the
 * light/dark switch with no extra wiring.
 */
export function Toaster() {
  return (
    <ToastContainer
      // Top centre, below the sticky header (see --toastify-toast-top in index.css).
      position="top-center"
      theme="light"
      transition={Slide}
      newestOnTop
      limit={4}
      pauseOnFocusLoss
      draggable="touch"
      toastClassName="pnl-toast"
    />
  )
}
