/* ============================================================================
   LA LÓGICA DE LIVE BOARD
   ----------------------------------------------------------------------------
   Todo lo que no es pantalla: qué es cada actividad, cómo se limpia lo que
   escribe un estudiante, cómo se cuentan las respuestas y qué se oculta. Es
   puro —ni React ni Firebase— para poder probarlo (logic.test.js).

   La regla que manda: EL PROYECTOR NUNCA EXPONE A NADIE. No muestra nombres,
   las respuestas abiertas salen solo si el docente las aprueba, y una palabra
   con groserías no llega a la nube aunque nadie alcance a moderarla.
   ========================================================================== */
import { esGroseria } from './groserias.js'

/* Los tipos de actividad, en el orden en que se ofrecen. Sus nombres y su
   ayuda están en i18n.jsx (tipo_nube, ayuda_nube…), en los dos idiomas. */
export const TIPOS = ['nube', 'encuesta', 'escala', 'abierta']

export const LIMITES = {
  pregunta: 140,
  palabra: 25,
  palabrasPorPersona: 3,
  alternativa: 60,
  minAlternativas: 2,
  maxAlternativas: 4,
  abierta: 140,
  nombre: 16,
}

/* Letras y colores de las alternativas: los mismos de Kachai, que a propósito
   no son los de Kahoot (ni figuras ni rojo-azul-amarillo-verde). */
export const ALTERNATIVAS = [
  { letra: 'A', solido: 'bg-violet-600', texto: 'text-violet-700', tinte: 'bg-violet-50', borde: 'border-violet-600' },
  { letra: 'B', solido: 'bg-teal-600', texto: 'text-teal-700', tinte: 'bg-teal-50', borde: 'border-teal-600' },
  { letra: 'C', solido: 'bg-orange-500', texto: 'text-orange-700', tinte: 'bg-orange-50', borde: 'border-orange-500' },
  { letra: 'D', solido: 'bg-pink-600', texto: 'text-pink-700', tinte: 'bg-pink-50', borde: 'border-pink-600' },
]

/** Una actividad nueva, lista para editar. El id no cambia aunque se
    reordene la lista: las respuestas se guardan bajo él, no bajo la posición. */
export const actividadNueva = (tipo, azar = Math.random) => ({
  id: idAlAzar(azar),
  tipo,
  pregunta: '',
  ...(tipo === 'encuesta' ? { alternativas: ['', ''] } : {}),
})

/** ¿Se puede lanzar? Devuelve el motivo si no —una clave de i18n.jsx
    (prob_sinPregunta…)— para decirlo en pantalla en el idioma de la sala. */
export const problemaDe = (a) => {
  if (!a || !TIPOS.includes(a.tipo)) return 'prob_sinTipo'
  if (!String(a.pregunta || '').trim()) return 'prob_sinPregunta'
  if (a.tipo === 'encuesta') {
    const llenas = (a.alternativas || []).filter(x => String(x).trim())
    if (llenas.length < LIMITES.minAlternativas) return 'prob_pocasAlternativas'
  }
  return null
}

/** Lo que se guarda en la sala: sin espacios de sobra ni alternativas vacías. */
export const limpiarActividad = (a) => ({
  ...(a.id ? { id: a.id } : {}),
  tipo: a.tipo,
  pregunta: String(a.pregunta || '').trim().slice(0, LIMITES.pregunta),
  ...(a.tipo === 'encuesta'
    ? { alternativas: (a.alternativas || []).map(x => String(x).trim().slice(0, LIMITES.alternativa)).filter(Boolean).slice(0, LIMITES.maxAlternativas) }
    : {}),
})

/* ── Palabras ──────────────────────────────────────────────────────────── */

/** Lo que se ve: espacios de sobra fuera, sin signos en los bordes. */
export const limpiarPalabra = (s) => String(s == null ? '' : s)
  .normalize('NFC')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
  .slice(0, LIMITES.palabra)

/** La clave para agrupar: «Revolución», «revolucion» y «REVOLUCIÓN » son la
    misma palabra. La ñ se queda: «año» y «ano» no lo son. Sin . # $ [ ] /,
    que Firebase no acepta en una clave (la clave va en la ruta de moderación). */
export const claveDePalabra = (s) => limpiarPalabra(s)
  .toLowerCase()
  .replace(/[^ñ]/g, ch => ch.normalize('NFD').replace(/[̀-ͯ]/g, ''))
  .replace(/[.#$[\]/]/g, '')

/** Lo que manda un estudiante: hasta 3 palabras distintas, no vacías. */
export const palabrasDe = (lista) => {
  const vistas = new Set()
  const salida = []
  for (const p of lista || []) {
    const texto = limpiarPalabra(p)
    const clave = claveDePalabra(texto)
    if (!clave || vistas.has(clave)) continue
    vistas.add(clave)
    salida.push(texto)
    if (salida.length === LIMITES.palabrasPorPersona) break
  }
  return salida
}

/**
 * La nube: cada palabra con cuántos la escribieron, de más a menos.
 *
 * `moderacion` = { clave: 'ocultar' | 'mostrar' } lo que decidió el docente.
 * Una grosería entra OCULTA aunque nadie la haya revisado (`auto`), y se ve
 * solo si el docente la restaura. Así una palabra fea no alcanza a proyectarse
 * en el segundo que tarda en reaccionar.
 */
export const nube = (respuestas, moderacion = {}) => {
  const grupos = new Map()
  for (const r of Object.values(respuestas || {})) {
    for (const texto of palabrasDe(r?.palabras)) {
      const clave = claveDePalabra(texto)
      const g = grupos.get(clave) || { clave, cuenta: 0, formas: new Map() }
      g.cuenta++
      g.formas.set(texto, (g.formas.get(texto) || 0) + 1)
      grupos.set(clave, g)
    }
  }
  return [...grupos.values()]
    .map(g => {
      /* Se muestra la forma que más gente escribió: si 5 pusieron «Revolución»
         y 1 «revolucion», sale con tilde. */
      const texto = [...g.formas.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]
      const auto = esGroseria(texto)
      const decision = moderacion[g.clave]
      const oculta = decision === 'ocultar' || (auto && decision !== 'mostrar')
      return { clave: g.clave, texto, cuenta: g.cuenta, auto, oculta }
    })
    .sort((a, b) => b.cuenta - a.cuenta || a.texto.localeCompare(b.texto))
}

/** Tamaño de una palabra en la nube, en rem: la más repetida es la más grande. */
export const tamanoEnNube = (cuenta, maximo) => {
  if (!maximo || maximo <= 1) return 2.5
  return 1.25 + ((cuenta - 1) / (maximo - 1)) * 3.75
}

/* ── Encuesta y escala ─────────────────────────────────────────────────── */

/** Votos por alternativa. Un voto fuera de rango no cuenta. */
export const conteoEncuesta = (respuestas, cuantas) => {
  const votos = Array(cuantas).fill(0)
  for (const r of Object.values(respuestas || {})) {
    const i = r?.opcion
    if (Number.isInteger(i) && i >= 0 && i < cuantas) votos[i]++
  }
  return { votos, total: votos.reduce((a, b) => a + b, 0) }
}

/** Cuántos eligieron cada valor de 1 a 5, y el promedio con un decimal. */
export const estadisticaEscala = (respuestas) => {
  const votos = [0, 0, 0, 0, 0]
  let suma = 0
  for (const r of Object.values(respuestas || {})) {
    const v = r?.valor
    if (Number.isInteger(v) && v >= 1 && v <= 5) { votos[v - 1]++; suma += v }
  }
  const total = votos.reduce((a, b) => a + b, 0)
  return { votos, total, promedio: total ? Math.round((suma / total) * 10) / 10 : null }
}

/* ── Respuestas abiertas ───────────────────────────────────────────────── */

export const limpiarAbierta = (s) => String(s == null ? '' : s)
  .normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, LIMITES.abierta)

/**
 * Las respuestas abiertas, separadas en pendientes, aprobadas y descartadas, en
 * el orden en que llegaron. `decisiones` = { pid: true (aprobada) | false
 * (descartada) }; sin decisión, pendiente. El nombre va solo para el docente en
 * su celular: el proyector no lo muestra nunca.
 */
export const abiertas = (respuestas, decisiones = {}, participantes = {}) => {
  const lista = Object.entries(respuestas || {})
    .map(([pid, r]) => ({
      pid,
      texto: limpiarAbierta(r?.texto),
      at: typeof r?.at === 'number' ? r.at : 0,
      nombre: participantes[pid]?.nombre || '',
      decision: decisiones[pid] === true ? true : decisiones[pid] === false ? false : null,
      groseria: esGroseria(r?.texto),
    }))
    .filter(r => r.texto)
    .sort((a, b) => a.at - b.at || a.pid.localeCompare(b.pid))
  return {
    pendientes: lista.filter(r => r.decision === null),
    aprobadas: lista.filter(r => r.decision === true),
    descartadas: lista.filter(r => r.decision === false),
  }
}

/** Cuántos respondieron la actividad. */
export const cuantosRespondieron = (respuestas) => Object.keys(respuestas || {}).length

/* ── Sala ──────────────────────────────────────────────────────────────── */

export const nombreValido = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, LIMITES.nombre)

export const idAlAzar = (azar = Math.random) =>
  Array.from({ length: 12 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(azar() * 32)]).join('')

export const pinAlAzar = (azar = Math.random) => String(100000 + Math.floor(azar() * 900000))
