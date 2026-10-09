/* ============================================================================
   LA SOPA DE LETRAS, CON CELULARES
   ----------------------------------------------------------------------------
   Como el crucigrama (crucigrama.js): se arma en Teacher's Utility Belt
   (src/sopa.js allá, con sus direcciones y sus pruebas) y llega aquí YA
   ARMADA por «Hacer con celulares». Aquí no se genera nada.

   Cada uno la resuelve en su celular como en el Belt: toca la primera letra y
   la última. En la pantalla está la del curso, y una palabra aparece marcada
   según la misma regla del crucigrama —por defecto, cuando la encontró la
   mitad de los conectados—, para que el que encuentra rápido no la llene solo.

   La clave de cada palabra es la palabra misma (en mayúsculas, sin tildes): el
   Belt no deja repetirlas.

   Este archivo es PURO para poder probarlo (sopa.test.js).
   ========================================================================== */
import { MODOS, claveDe as claveCrucigrama, palabrasDe as palabrasCrucigrama, soloLetras } from './crucigrama.js'

export const MAX_LADO = 20
export const MAX_PALABRAS = 40

const entero = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null)
const lista = (x) => (Array.isArray(x) ? x : Object.values(x || {}))

export const claveSopa = (p) => p.palabra

/** Las filas de letras, limpias: `lado` filas de `lado` letras, o nada. */
export const filasDe = (a) => {
  const lado = entero(a?.lado, 2, MAX_LADO)
  if (!lado) return []
  const filas = lista(a?.filas).map(soloLetras)
  return filas.length === lado && filas.every(f => [...f].length === lado) ? filas : []
}

/** Las casillas de una palabra, como «f,c». */
export const casillasSopa = (p) => Array.from({ length: p.palabra.length }, (_, i) => `${p.fila + p.df * i},${p.col + p.dc * i}`)

/**
 * Las palabras de una actividad, limpias. Una palabra cuyas letras no están
 * de verdad en la cuadrícula se descarta: buscar algo que no está es lo peor
 * que puede pasar en una sopa.
 */
export const palabrasSopa = (a) => {
  const filas = filasDe(a)
  if (!filas.length) return []
  const letra = (f, c) => [...(filas[f] || '')][c]
  const vistas = new Set()
  return lista(a?.palabras).map(p => {
    const palabra = soloLetras(p?.palabra)
    const df = entero(p?.df, -1, 1), dc = entero(p?.dc, -1, 1)
    const fila = entero(p?.fila, 0, filas.length - 1), col = entero(p?.col, 0, filas.length - 1)
    if (palabra.length < 2 || df == null || dc == null || (!df && !dc) || fila == null || col == null) return null
    const esta = [...palabra].every((ch, i) => letra(fila + df * i, col + dc * i) === ch)
    if (!esta) return null
    const original = String(p?.original || palabra).replace(/\s+/g, ' ').trim().slice(0, 40)
    return { palabra, original, fila, col, df, dc }
  }).filter(p => p && !vistas.has(p.palabra) && vistas.add(p.palabra)).slice(0, MAX_PALABRAS)
}

/** Lo que se guarda en la sala. */
export const limpiarSopa = (a) => {
  const filas = filasDe(a)
  return {
    lado: filas.length,
    filas,
    palabras: palabrasSopa(a),
    destapar: MODOS.includes(a?.destapar) ? a.destapar : 'mitad',
  }
}

/**
 * La palabra entre dos casillas tocadas, en cualquiera de los dos sentidos, o
 * null. Recta solo si es horizontal, vertical o diagonal exacta. (palabraEntre
 * del Belt.)
 */
export const palabraEntre = (palabras, a, b) => {
  if (!a || !b) return null
  const altoF = Math.abs(b.fila - a.fila), anchoC = Math.abs(b.col - a.col)
  if (altoF && anchoC && altoF !== anchoC) return null
  const largo = Math.max(altoF, anchoC) + 1
  if (largo < 2) return null
  const df = Math.sign(b.fila - a.fila), dc = Math.sign(b.col - a.col)
  const seg = Array.from({ length: largo }, (_, i) => `${a.fila + df * i},${a.col + dc * i}`)
  const ida = seg.join('|'), vuelta = [...seg].reverse().join('|')
  return palabras.find(p => {
    const suya = casillasSopa(p).join('|')
    return suya === ida || suya === vuelta
  }) || null
}

/**
 * El crucigrama y la sopa se destapan igual: esto da sus palabras y la clave
 * de cada una, para que el proyector y el celular del docente no tengan que
 * saber de cuál se trata.
 */
export const destapables = (a) => (a?.tipo === 'sopa'
  ? { palabras: palabrasSopa(a), clave: claveSopa }
  : a?.tipo === 'crucigrama' ? { palabras: palabrasCrucigrama(a), clave: claveCrucigrama } : null)

/* La cápsula que marca una palabra, en unidades de casilla, como en el Belt:
   del centro de la primera casilla al de la última, alargada hasta el borde.
   La bandera de barrido va a 0: en svg el eje Y va hacia abajo. */
export const capsula = (p, r = 0.41) => {
  const x1 = p.col + 0.5, y1 = p.fila + 0.5
  const x2 = p.col + p.dc * (p.palabra.length - 1) + 0.5, y2 = p.fila + p.df * (p.palabra.length - 1) + 0.5
  const largo = Math.hypot(x2 - x1, y2 - y1) || 1
  const dx = (x2 - x1) / largo, dy = (y2 - y1) / largo
  const sobra = Math.max(0, 0.5 - r)
  const ax = x1 - dx * sobra, ay = y1 - dy * sobra
  const zx = x2 + dx * sobra, zy = y2 + dy * sobra
  const px = -dy * r, py = dx * r
  return [
    `M ${ax + px} ${ay + py}`, `L ${zx + px} ${zy + py}`, `A ${r} ${r} 0 0 0 ${zx - px} ${zy - py}`,
    `L ${ax - px} ${ay - py}`, `A ${r} ${r} 0 0 0 ${ax + px} ${ay + py}`, 'Z',
  ].join(' ')
}
