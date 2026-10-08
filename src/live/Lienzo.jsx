/* ============================================================================
   EL PAPEL DEL PIZARRÓN
   ----------------------------------------------------------------------------
   Lo dibujan igual la tablet (donde se escribe) y el proyector (donde se ve):
   un papel 16:9 que ocupa todo lo que puede del espacio que le dan.

   Dos capas: abajo los trazos terminados, arriba el que se está escribiendo.
   Así cada punto nuevo redibuja solo ese trazo, no la página entera. El
   borrador es la excepción: borra lo de abajo, así que mientras se arrastra
   se redibuja la capa de abajo con él.

   El papel es SIEMPRE blanco, también en modo oscuro: los colores del lápiz
   están elegidos para leerse sobre blanco. Por eso va con estilos en línea y
   no con las clases que index.css oscurece.
   ========================================================================== */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ALTO, ANCHO, aLaVista, fondoEscrito } from './pizarra.js'

const PAPEL = '#ffffff'
const RAYA = 'rgba(100, 116, 139, 0.22)'
const PASO = 50 // de la cuadrícula y las líneas, en unidades del papel

/** Un trazo, suavizado: curvas por los puntos medios en vez de quiebres. */
export function trazar(ctx, t, k) {
  const p = t.puntos
  if (!p.length) return
  ctx.globalCompositeOperation = t.borrador ? 'destination-out' : 'source-over'
  ctx.strokeStyle = t.color
  ctx.fillStyle = t.color
  ctx.lineWidth = t.grosor * k
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (p.length === 1) {
    ctx.beginPath()
    ctx.arc(p[0][0] * k, p[0][1] * k, (t.grosor * k) / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(p[0][0] * k, p[0][1] * k)
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2
    const my = (p[i][1] + p[i + 1][1]) / 2
    ctx.quadraticCurveTo(p[i][0] * k, p[i][1] * k, mx * k, my * k)
  }
  const u = p[p.length - 1]
  ctx.lineTo(u[0] * k, u[1] * k)
  ctx.stroke()
}

/* El papel se corre con el cuaderno: las rayas suben cuando se baja. */
function fondoCss(fondo, k, y) {
  const paso = PASO * k
  const corrido = -((y * k) % paso)
  if (fondo === 'cuadros') {
    return {
      backgroundColor: PAPEL,
      backgroundImage: `linear-gradient(${RAYA} 1px, transparent 1px), linear-gradient(90deg, ${RAYA} 1px, transparent 1px)`,
      backgroundSize: `${paso}px ${paso}px`,
      backgroundPosition: `0 ${corrido}px`,
    }
  }
  if (fondo === 'lineas') {
    return {
      backgroundColor: PAPEL,
      backgroundImage: `linear-gradient(${RAYA} 1px, transparent 1px)`,
      backgroundSize: `100% ${paso}px`,
      backgroundPosition: `0 ${paso / 2 + corrido}px`,
    }
  }
  return { backgroundColor: PAPEL }
}

/* Prepara un canvas para la densidad de la pantalla (nítido en la tablet) y
   corrido a la parte del cuaderno que se ve. */
function preparar(canvas, w, h, desplazado) {
  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.translate(0, -desplazado)
  return ctx
}

/**
 * `trazos` = los terminados (trazosEnOrden), `enCurso` = el que se escribe o
 * null. `y` = desde dónde se ve el cuaderno. `papelRef` y los `on…` son para
 * la tablet, que escribe encima.
 */
export function Lienzo({ trazos, enCurso, fondo = 'blanco', y = 0, papelRef, className = '', children, ...eventos }) {
  const marco = useRef(null)
  const abajo = useRef(null)
  const arriba = useRef(null)
  const [tam, setTam] = useState({ w: 0, h: 0 })

  /* El papel más grande que cabe, sin deformarse. Se mide el espacio SIN el
     margen interior, y el papel va en posición absoluta: si contara para el
     tamaño del marco, al crecer agrandaría el marco y se saldría de la
     pantalla. */
  useLayoutEffect(() => {
    const el = marco.current
    if (!el) return
    const medir = () => {
      const cs = getComputedStyle(el)
      const width = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const height = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      const w = Math.max(0, Math.min(width, (height * ANCHO) / ALTO))
      setTam({ w: Math.floor(w), h: Math.floor((w * ALTO) / ANCHO) })
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const k = tam.w / ANCHO
  const borrando = enCurso?.borrador

  useEffect(() => {
    if (!tam.w || !abajo.current) return
    const ctx = preparar(abajo.current, tam.w, tam.h, y * k)
    /* Solo los que se ven: en un cuaderno largo, el resto es trabajo perdido. */
    for (const t of trazos) if (aLaVista(t, y)) trazar(ctx, t, k)
    if (borrando) trazar(ctx, enCurso, k)
  }, [trazos, tam, y, borrando ? enCurso : null])

  useEffect(() => {
    if (!tam.w || !arriba.current) return
    const ctx = preparar(arriba.current, tam.w, tam.h, y * k)
    if (enCurso && !borrando) trazar(ctx, enCurso, k)
  }, [enCurso, tam, y])

  /* La barrita del costado: dónde estás en lo escrito. Aparece apenas hay
     algo más abajo de lo que se ve, o si ya se bajó. */
  const escrito = fondoEscrito(trazos)
  const total = Math.max(escrito + ALTO / 2, y + ALTO)
  const barra = y > 0 || escrito > ALTO

  return (
    <div ref={marco} className={`relative min-h-0 min-w-0 overflow-hidden ${className}`}>
      <div ref={papelRef} {...eventos}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-lg overflow-hidden"
        style={{ width: tam.w, height: tam.h, touchAction: 'none', ...fondoCss(fondo, k, y) }}>
        <canvas ref={abajo} className="absolute inset-0" style={{ width: tam.w, height: tam.h }} />
        <canvas ref={arriba} className="absolute inset-0" style={{ width: tam.w, height: tam.h }} />
        {barra && (
          <div aria-hidden="true" className="absolute right-1.5 top-2 bottom-2 w-1.5 rounded-full pointer-events-none"
            style={{ backgroundColor: 'rgba(100, 116, 139, 0.15)' }}>
            <div className="absolute left-0 right-0 rounded-full"
              style={{ top: `${(y / total) * 100}%`, height: `${(ALTO / total) * 100}%`, backgroundColor: 'rgba(71, 85, 105, 0.55)' }} />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
