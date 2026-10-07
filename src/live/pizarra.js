/* ============================================================================
   EL PIZARRÓN
   ----------------------------------------------------------------------------
   El docente escribe con el lápiz en su tablet y el proyector lo muestra en
   vivo. Entra con el botón «Pizarra» del proyector, que lleva la clave de la
   sala (como el celular para moderar).

     boards/{pin}/pizarra/
       vista     { pagina, paginas, fondo }   en qué página va, cuántas hay y
                 el papel (blanco, cuadros o líneas), igual para todas
       paginas   { n: { trazos: { tid: { c, g, b?, p } } } }
       enCurso   { id, pg, c, g, b?, partes: { k: p } }   el trazo que se está
                 escribiendo, para que el proyector lo vea antes de levantar
                 el lápiz. Va por partes que solo se agregan: reenviar el
                 trazo entero cada vez que crece costaría el cuadrado de su largo.

   Si se proyecta o no va en `estado.pizarra`, junto a la actividad: pasar a
   otra actividad reescribe el estado y la pizarra se aparta sola.

   Las coordenadas son de un papel fijo de 1600 × 900 (16:9) en enteros, así el
   trazo se ve igual en la tablet y en un proyector de cualquier tamaño, y viaja
   como texto corto: «x,y x,y …».

   No son datos de estudiantes: es lo que escribe el docente, y se borra al
   cerrar la sala.
   ========================================================================== */
import { raiz } from './sala.js'

export const ANCHO = 1600
export const ALTO = 900

/* Colores que se leen bien sobre papel blanco en un proyector desteñido. */
export const COLORES = [
  { id: 'negro', hex: '#1e293b' },
  { id: 'azul', hex: '#1d4ed8' },
  { id: 'rojo', hex: '#dc2626' },
  { id: 'verde', hex: '#15803d' },
  { id: 'naranja', hex: '#ea580c' },
]
export const GROSORES = [4, 10]
export const GROSOR_BORRADOR = 44
export const FONDOS_PIZARRA = ['blanco', 'cuadros', 'lineas']
export const MAX_PAGINAS = 20

export const rutaPizarra = (pin) => `${raiz(pin)}/pizarra`

export const colorValido = (c) => (COLORES.some(x => x.hex === c) ? c : COLORES[0].hex)
export const fondoPizarraValido = (f) => (FONDOS_PIZARRA.includes(f) ? f : 'blanco')

/** La vista con valores seguros aunque falte algo (Firebase no guarda lo vacío). */
export const vistaValida = (v) => {
  const paginas = Math.min(MAX_PAGINAS, Math.max(1, Number.isInteger(v?.paginas) ? v.paginas : 1))
  const pagina = Math.min(paginas - 1, Math.max(0, Number.isInteger(v?.pagina) ? v.pagina : 0))
  return { pagina, paginas, fondo: fondoPizarraValido(v?.fondo) }
}

/* ── Puntos ────────────────────────────────────────────────────────────── */

/** [[x, y], …] → «x,y x,y», redondeado y dentro del papel. */
export const codificar = (puntos) => puntos
  .map(([x, y]) => `${Math.round(Math.min(ANCHO, Math.max(0, x)))},${Math.round(Math.min(ALTO, Math.max(0, y)))}`)
  .join(' ')

/** «x,y x,y» → [[x, y], …]; lo que no se entiende se salta. */
export const decodificar = (texto) => String(texto || '')
  .split(' ')
  .map(par => par.split(',').map(Number))
  .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))

/** ¿Vale la pena guardar este punto? Los que caen casi encima del anterior
    no cambian el dibujo y engordan lo que viaja. */
export const lejos = (a, b, minimo = 2) => !a || Math.hypot(b[0] - a[0], b[1] - a[1]) >= minimo

/** Las partes de un trazo en curso, en orden, como un solo texto. */
export const unirPartes = (partes) => Object.keys(partes || {})
  .sort((a, b) => Number(a) - Number(b))
  .map(k => partes[k])
  .filter(Boolean)
  .join(' ')

/**
 * ¿El lápiz viene con el botón de borrar? El botón lateral del S Pen (y el
 * de otros lápices) llega como «botón de barril»: bit 2 en `buttons`, o
 * `button` 2 al apoyar. La punta de borrar de algunos lápices llega como bit
 * 32 o `button` 5. Solo cuenta si es un lápiz: con el mouse, el botón
 * derecho no borra.
 */
export const botonDeBorrar = (e) => e?.pointerType === 'pen'
  && (((e.buttons ?? 0) & (2 | 32)) !== 0 || e.button === 2 || e.button === 5)

/**
 * El botón como lo avisa el S Pen en la Tab S9 con Edge (visto en #/lapiz
 * el 7-oct-2026): ningún botón 2, sino un movimiento del lápiz «con clic»
 * (buttons 1) y presión cero, sin haber apoyado la punta. Solo vale cuando
 * no hay un trazo en curso: a mitad de un trazo normal, buttons es 1 igual.
 */
export const botonEnElAire = (e) => e?.type === 'pointermove' && e.pointerType === 'pen'
  && ((e.buttons ?? 0) & 1) !== 0 && e.pressure === 0

/* ── Trazos ────────────────────────────────────────────────────────────── */

/** Un id que se ordena por hora: así «deshacer» sabe cuál fue el último. */
export const idDeTrazo = (ahora = Date.now(), azar = Math.random) =>
  ahora.toString(36).padStart(9, '0') + Math.floor(azar() * 36 ** 3).toString(36).padStart(3, '0')

/** Los trazos de una página, del primero al último. */
export const trazosEnOrden = (trazos) => Object.entries(trazos || {})
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  .map(([id, t]) => ({
    id,
    color: colorValido(t?.c),
    grosor: t?.b ? GROSOR_BORRADOR : (GROSORES.includes(t?.g) ? t.g : GROSORES[0]),
    borrador: Boolean(t?.b),
    puntos: decodificar(t?.p),
  }))
  .filter(t => t.puntos.length)

/** El último trazo de la página, el que borra «deshacer». */
export const ultimoTrazo = (trazos) => Object.keys(trazos || {}).sort().at(-1) ?? null

/** El trazo en curso para dibujarlo, o null si no es de esta página o ya se
    guardó (entonces ya está entre los trazos). */
export const enCursoVisible = (enCurso, pagina, trazos) => {
  if (!enCurso || enCurso.pg !== pagina || (enCurso.id && trazos?.[enCurso.id])) return null
  const puntos = decodificar(unirPartes(enCurso.partes))
  if (!puntos.length) return null
  return {
    color: colorValido(enCurso.c),
    grosor: enCurso.b ? GROSOR_BORRADOR : (GROSORES.includes(enCurso.g) ? enCurso.g : GROSORES[0]),
    borrador: Boolean(enCurso.b),
    puntos,
  }
}
