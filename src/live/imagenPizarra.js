/* ============================================================================
   LA PIZARRA COMO IMAGEN
   ----------------------------------------------------------------------------
   Para el resumen de la clase: cada pantalla del cuaderno (1600 × 900) como
   una imagen nítida, en alta resolución, para el PDF y para verla en el
   celular. Se dibuja igual que en el proyector (trazar, de Lienzo.jsx).

   La tinta va en su propia capa y después sobre el papel: el borrador quita
   tinta, y si se dibujara directo sobre el papel también borraría las rayas.
   ========================================================================== */
import { ALTO, ANCHO, fondoEscrito, trazosEnOrden, aLaVista } from './pizarra.js'
import { trazar } from './Lienzo.jsx'

const RAYA = 'rgba(100, 116, 139, 0.22)'
const PASO = 50

/** Cuántas pantallas ocupa lo escrito en una página (al menos una). */
export const pantallasDe = (trazos) => Math.max(1, Math.ceil((fondoEscrito(trazos) + 20) / ALTO))

function papel(ctx, fondo, k, w, h, y) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  if (fondo === 'blanco') return
  ctx.strokeStyle = RAYA
  ctx.lineWidth = Math.max(1, k)
  ctx.beginPath()
  const inicio = fondo === 'lineas' ? PASO / 2 : 0
  for (let v = inicio - (y % PASO); v <= ALTO; v += PASO) {
    if (v < 0) continue
    ctx.moveTo(0, v * k); ctx.lineTo(w, v * k)
  }
  if (fondo === 'cuadros') {
    for (let x = 0; x <= ANCHO; x += PASO) { ctx.moveTo(x * k, 0); ctx.lineTo(x * k, h) }
  }
  ctx.stroke()
}

/**
 * Las pantallas de una página como imágenes PNG (data URL), de arriba abajo.
 * `trazosRaw` = los trazos guardados de la página; `ancho` en píxeles.
 */
export function imagenesDePagina(trazosRaw, fondo, ancho = 2400) {
  const trazos = trazosEnOrden(trazosRaw)
  const k = ancho / ANCHO
  const w = ancho
  const h = Math.round(ALTO * k)
  const imagenes = []
  for (let i = 0; i < pantallasDe(trazos); i++) {
    const y = i * ALTO
    const tinta = document.createElement('canvas')
    tinta.width = w; tinta.height = h
    const ct = tinta.getContext('2d')
    ct.translate(0, -y * k)
    for (const t of trazos) if (aLaVista(t, y)) trazar(ct, t, k)

    const hoja = document.createElement('canvas')
    hoja.width = w; hoja.height = h
    const ch = hoja.getContext('2d')
    papel(ch, fondo, k, w, h, y)
    ch.drawImage(tinta, 0, 0)
    imagenes.push(hoja.toDataURL('image/png'))
  }
  return imagenes
}
