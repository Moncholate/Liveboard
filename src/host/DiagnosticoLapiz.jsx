/* ============================================================================
   ¿QUÉ MANDA EL LÁPIZ?
   ----------------------------------------------------------------------------
   Una página para mirar, en la tablet, lo que el navegador recibe del lápiz:
   cada tablet y cada navegador avisan distinto el botón lateral (otro tipo de
   puntero, otro botón, un «clic derecho», una tecla…). Con esto se ve cuál es
   y la pizarra se ajusta a eso. Se entra con #/lapiz; no la enlaza nada.

   No guarda ni envía nada: solo lo muestra.
   ========================================================================== */
import { useEffect, useRef, useState } from 'react'
import { botonDeBorrar } from '../live/pizarra.js'

const MAX = 14

export default function DiagnosticoLapiz() {
  const [log, setLog] = useState([])
  const zona = useRef(null)
  const ultimoMov = useRef('')

  useEffect(() => {
    const el = zona.current
    const anotar = (texto) => setLog(l => [texto, ...l].slice(0, MAX))
    const puntero = (e) => {
      const linea = `${e.type} · tipo=${e.pointerType} · button=${e.button} · buttons=${e.buttons}`
        + ` · presión=${e.pressure?.toFixed(2)} · borra=${botonDeBorrar(e) ? 'SÍ' : 'no'}`
      /* Los movimientos llegan por cientos: se anota uno solo si cambió algo. */
      if (e.type === 'pointermove') {
        const clave = `${e.pointerType}${e.button}${e.buttons}`
        if (clave === ultimoMov.current) return
        ultimoMov.current = clave
      }
      anotar(linea)
    }
    const otro = (e) => {
      if (e.type === 'contextmenu') e.preventDefault()
      anotar(`${e.type}${e.key ? ` · tecla=${e.key} código=${e.code}` : ''}${'button' in e ? ` · button=${e.button}` : ''}`)
    }
    const tipos = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']
    for (const t of tipos) el.addEventListener(t, puntero)
    for (const t of ['contextmenu', 'auxclick']) el.addEventListener(t, otro)
    for (const t of ['keydown', 'keyup']) window.addEventListener(t, otro)
    return () => {
      for (const t of tipos) el.removeEventListener(t, puntero)
      for (const t of ['contextmenu', 'auxclick']) el.removeEventListener(t, otro)
      for (const t of ['keydown', 'keyup']) window.removeEventListener(t, otro)
    }
  }, [])

  return (
    <div className="h-[100dvh] flex flex-col p-3 gap-3 select-none">
      <p className="text-slate-700">
        Escribe en el recuadro con el lápiz, primero <b>sin</b> apretar el botón y después <b>con</b> el botón apretado.
        Saca una captura de pantalla y mándala.
      </p>
      <div ref={zona} className="flex-1 min-h-0 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-3 overflow-hidden"
        style={{ touchAction: 'none' }}>
        <ol className="font-mono text-sm text-slate-800 leading-relaxed">
          {log.map((l, i) => <li key={i} className={i === 0 ? 'font-bold' : ''}>{l}</li>)}
        </ol>
      </div>
      <p className="text-xs text-slate-500">{navigator.userAgent}</p>
    </div>
  )
}
