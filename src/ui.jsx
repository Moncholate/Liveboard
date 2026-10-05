export function Logo({ className = '' }) {
  return (
    <span className={`font-black tracking-tight ${className}`}>
      Live<span className="text-teal-700">Board</span>
    </span>
  )
}

export function Center({ children }) {
  return (
    <div className="min-h-screen grid place-items-center p-6 text-center text-slate-600">
      <div>{children}</div>
    </div>
  )
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 disabled:bg-slate-300',
    ghost: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50',
    danger: 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50',
  }
  return (
    <button
      className={`rounded-xl px-5 py-3 font-bold transition active:scale-[.98] disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

/* La URL para unirse, la misma en el QR, en el proyector y en el celular. */
export const urlParaUnirse = (pin) => `${location.origin}${location.pathname}#/join?pin=${pin}`
