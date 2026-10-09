/* ============================================================================
   EL CRUCIGRAMA, CON CELULARES
   ----------------------------------------------------------------------------
   Se arma en Teacher's Toolbox (src/crucigrama.js allá, con sus reglas de
   cruce y sus pruebas) y llega aquí YA ARMADO, por el botón «Hacer con
   celulares»: así el proyector muestra el mismo crucigrama que el docente
   estaba mirando. Aquí no se genera nada; se proyecta y se cuenta.

   CADA UNO RESUELVE EL SUYO en el celular, y en la pantalla está el del curso.
   La pregunta del docente (8-oct-2026) fue «¿y si hay alguien que sabe
   mucho?»: si una palabra se destapa con el primero que acierta, el que sabe
   mucho llena el crucigrama solo y el resto mira. Por eso, por defecto, UNA
   PALABRA SE DESTAPA CUANDO LA TIENE LA MITAD DEL CURSO: nadie lo llena solo;
   se llena cuando el curso avanza. Los otros dos modos quedan para elegir:
   con la primera persona, o cuando el docente toque la pista.

   Bajo cada pista se ve cuántos la tienen, nunca quiénes: es también lo que le
   dice al docente qué pista cuesta.

   El celular comprueba solo, contra la palabra, y guarda SOLO las que acertó
   ({ bien: { clave: true } }): los intentos fallidos no le sirven a nadie y no
   se guardan. Lo destapado lo anota el proyector en la moderación de la
   actividad, para que no se vuelva a tapar si alguien se desconecta.

   Este archivo es PURO para poder probarlo (crucigrama.test.js).
   ========================================================================== */

export const MAX_PALABRAS = 40
export const MAX_LARGO = 15
export const MAX_LADO = 40
export const MODOS = ['mitad', 'uno', 'docente']

/** Solo letras y en mayúsculas: una casilla es una letra. La Ñ se queda; las
    tildes no (como soloLetras del Belt: «Revolución» y «REVOLUCION» valen igual). */
export const soloLetras = (s) => String(s == null ? '' : s)
  .normalize('NFC').toUpperCase()
  .replace(/[^Ñ]/g, ch => ch.normalize('NFD').replace(/[̀-ͯ]/g, ''))
  .replace(/[^A-ZÑ]/g, '')

/** La clave de una palabra: número + dirección, porque una misma casilla puede
    empezar una horizontal y una vertical con el mismo número. */
export const claveDe = (p) => `${p.numero}${p.dir}`

const entero = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null)
const lista = (x) => (Array.isArray(x) ? x : Object.values(x || {}))

/**
 * Las palabras de una actividad, limpias. Una que no cabe en la cuadrícula o
 * viene rota se descarta: mejor un crucigrama con una palabra menos que uno
 * que se dibuja mal delante del curso.
 */
export const palabrasDe = (a) => {
  const ancho = entero(a?.ancho, 1, MAX_LADO), alto = entero(a?.alto, 1, MAX_LADO)
  if (!ancho || !alto) return []
  const vistas = new Set()
  return lista(a?.palabras).map(p => {
    const palabra = soloLetras(p?.palabra).slice(0, MAX_LARGO)
    const dir = p?.dir === 'v' ? 'v' : p?.dir === 'h' ? 'h' : null
    const fila = entero(p?.fila, 0, alto - 1), col = entero(p?.col, 0, ancho - 1), numero = entero(p?.numero, 1, 999)
    if (palabra.length < 2 || !dir || fila == null || col == null || !numero) return null
    if (dir === 'h' ? col + palabra.length > ancho : fila + palabra.length > alto) return null
    const pista = String(p?.pista || '').replace(/\s+/g, ' ').trim().slice(0, 140)
    const original = String(p?.original || palabra).replace(/\s+/g, ' ').trim().slice(0, 40)
    return { palabra, original, ...(pista ? { pista } : {}), fila, col, dir, numero }
  }).filter(p => p && !vistas.has(claveDe(p)) && vistas.add(claveDe(p)))
    .slice(0, MAX_PALABRAS)
    .sort((x, y) => x.numero - y.numero || (x.dir === 'h' ? -1 : 1))
}

/** Lo que se guarda en la sala: la cuadrícula, sus palabras y el modo. */
export const limpiarCrucigrama = (a) => {
  const palabras = palabrasDe(a)
  return {
    ancho: entero(a?.ancho, 1, MAX_LADO) || 0,
    alto: entero(a?.alto, 1, MAX_LADO) || 0,
    palabras,
    destapar: MODOS.includes(a?.destapar) ? a.destapar : 'mitad',
  }
}

/** La cuadrícula dibujable: `celdas[f][c]` = letra o null, y los números. */
export const rejilla = (ancho, alto, palabras) => {
  const celdas = Array.from({ length: alto }, () => Array(ancho).fill(null))
  const numeros = {}
  for (const p of palabras) {
    numeros[`${p.fila},${p.col}`] = p.numero
    for (let i = 0; i < p.palabra.length; i++) {
      const f = p.fila + (p.dir === 'v' ? i : 0), c = p.col + (p.dir === 'h' ? i : 0)
      if (celdas[f]) celdas[f][c] = p.palabra[i]
    }
  }
  return { celdas, numeros }
}

/** Las casillas de una palabra, como «f,c». */
export const casillasDe = (p) => Array.from({ length: p.palabra.length }, (_, i) =>
  `${p.fila + (p.dir === 'v' ? i : 0)},${p.col + (p.dir === 'h' ? i : 0)}`)

/** ¿Lo escrito es la palabra? Sin tildes, mayúsculas ni espacios. */
export const acierta = (escrito, p) => soloLetras(escrito) === p.palabra

/** Cuántos tienen cada palabra, y cuántos terminaron todo. `clave` cambia
    en la sopa de letras (sopa.js), que usa la misma cuenta. */
export const progreso = (respuestas, palabras, clave = claveDe) => {
  const por = Object.fromEntries(palabras.map(p => [clave(p), 0]))
  let terminaron = 0
  for (const r of Object.values(respuestas || {})) {
    const bien = r?.bien || {}
    let todas = palabras.length > 0
    for (const p of palabras) {
      if (bien[clave(p)] === true) por[clave(p)]++
      else todas = false
    }
    if (todas) terminaron++
  }
  return { por, terminaron }
}

/** Con cuántos se destapa una palabra. «La mitad» es de los conectados ahora,
    redondeando hacia arriba, y nunca menos de uno. En «docente», nunca sola. */
export const umbral = (modo, conectados) => {
  if (modo === 'uno') return 1
  if (modo === 'docente') return Infinity
  return Math.max(1, Math.ceil((conectados || 0) / 2))
}

/** Las que ya llegaron al umbral y todavía no están destapadas. */
export const porDestapar = (palabras, por, minimo, destapadas = {}, clave = claveDe) =>
  palabras.map(clave).filter(k => destapadas?.[k] !== true && (por[k] || 0) >= minimo)
