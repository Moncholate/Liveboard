/* ============================================================================
   LOS CIERRES, CON CELULARES
   ----------------------------------------------------------------------------
   Las cinco herramientas de cierre de Teacher's Utility Belt, ahora con el
   curso respondiendo desde el celular (8-oct-2026). En el Belt el docente
   cuenta manos o escribe lo que le dicen; aquí cada uno manda lo suyo y el
   proyector lo junta, SIN NOMBRES, como todo en Liveboard.

     SEMÁFORO    cada uno elige su nivel contra el objetivo del día; el
                 semáforo se destapa cuando el docente quiere (empiezaOculta)
     LA DUDA     cada uno completa el molde del docente; se proyectan las que
                 aprueba, como las abiertas
     APUESTA     escriben en el cuaderno, apuestan cuántas tienen bien y recién
                 entonces corrigen; el proyector muestra cuántos acertaron su
                 apuesta, sin decir quiénes
     ANTES/AHORA qué creía y qué creo ahora, porque…; moderado
     EL MURO     cada uno nombra algo que hoy pudo y el muro se llena; moderado

   Las decisiones de cada herramienta vienen del Belt y no se tocan aquí: los
   tres niveles del semáforo, la intensidad respecto al curso entero, el orden
   no negociable de la apuesta, el muro que encoge en escalones.

   Este archivo es PURO —ni React ni Firebase— para poder probarlo
   (cierres.test.js).
   ========================================================================== */
import { LIMITES, limpiarAbierta, partirEnHuecos } from './logic.js'

/* ── Los huecos ────────────────────────────────────────────────────────── */

/** Cuántos huecos tiene un molde. */
export const cuantosHuecos = (molde) => partirEnHuecos(molde).filter(t => t.tipo === 'hueco').length

/**
 * Cuánto cabe en cada hueco para que la frase completa no pase de 140
 * caracteres, que es lo que aceptan las reglas de la base para una respuesta.
 * Con un piso de 15: un molde muy largo no puede dejar huecos de dos letras.
 */
export const largoHueco = (molde) => {
  const trozos = partirEnHuecos(molde)
  const n = trozos.filter(t => t.tipo === 'hueco').length
  if (!n) return LIMITES.abierta
  const fijo = trozos.filter(t => t.tipo === 'texto').reduce((s, t) => s + t.valor.length, 0)
  return Math.max(15, Math.floor((LIMITES.abierta - fijo) / n))
}

const limpiarHueco = (s) => String(s == null ? '' : s).normalize('NFC').replace(/\s+/g, ' ').trim()

/** ¿Están todos los huecos llenos? Sin huecos, basta con haber escrito algo. */
export const moldeCompleto = (molde, huecos = []) => {
  const n = cuantosHuecos(molde)
  return Array.from({ length: Math.max(1, n) }, (_, i) => limpiarHueco(huecos[i])).every(Boolean)
}

/**
 * La respuesta de un molde, como texto (`texto`, lo que se modera y se corrige):
 *   · LA DUDA: la frase entera, con los huecos llenos. Es lo que se lee en voz
 *     alta y lo que se entiende sin el molde al lado.
 *   · EL MURO: solo lo que el estudiante escribió. El molde va una vez arriba
 *     del muro; repetido en cada tarjeta, el muro serían veinticinco veces
 *     «Hoy pude».
 * Sin huecos, el molde es una pregunta y la respuesta es lo que se escribió.
 */
export const textoDeMolde = (tipo, molde, huecos = []) => {
  const trozos = partirEnHuecos(molde)
  if (!trozos.some(t => t.tipo === 'hueco')) return limpiarAbierta(huecos[0])
  if (tipo === 'muro') return limpiarAbierta(huecos.map(limpiarHueco).filter(Boolean).join(' … '))
  let i = 0
  return limpiarAbierta(trozos.map(t => (t.tipo === 'hueco' ? (limpiarHueco(huecos[i++]) || t.valor) : t.valor)).join(''))
}

/* ── Semáforo ──────────────────────────────────────────────────────────── */

/**
 * Los tres niveles, de arriba abajo como en la calle. La respuesta guarda el
 * índice (`opcion`: 0 verde, 1 ámbar, 2 rojo).
 *
 * VAN EN ESPAÑOL AUNQUE LA SALA ESTÉ EN INGLÉS, y es la única excepción al
 * idioma de la sala. Es la decisión del Belt (31-ago-2026): el objetivo es
 * contenido de la clase y va en el idioma que se enseña, pero la reflexión
 * sobre el propio aprendizaje es pensamiento fino, y en Básico no existe el
 * vocabulario para hacerla en inglés. Son CRITERIOS, no sensaciones: cada uno
 * se comprueba solo. Y en chileno: «lo puedo hacer», no «me sale».
 */
export const NIVELES = [
  { id: 'verde', texto: 'Se lo puedo explicar a alguien' },
  { id: 'ambar', texto: 'Lo puedo hacer, pero mirando el ejemplo' },
  { id: 'rojo', texto: 'Todavía no lo puedo hacer solo' },
]

/* Colores de LÁMPARA, no de interfaz: fijos en los dos temas, porque la
   carcasa también es un objeto fijo. La tinta de los números va un escalón más
   clara para leerse sobre la carcasa (el rojo de lámpara daba 4,4:1). */
export const LAMPARA = { verde: '#22c55e', ambar: '#f59e0b', rojo: '#ef4444' }
export const TINTA_LAMPARA = { verde: '#4ade80', ambar: '#fbbf24', rojo: '#fca5a5' }
export const CARCASA = '#12172a'
export const CARCASA_INT = '#080b16'

/* Con tres opciones una mayoría clara ronda el 55 %: con el tope en la mitad,
   media clase enciende la luz entera. Una luz sin votos sigue siendo una
   lámpara apagada, no un agujero. (semaforo.js del Belt, con sus razones.) */
export const PLENO = 0.5
export const BRILLO_MIN = 0.12
export const TAMANO_MIN = 0.45

/**
 * Cómo se ve el semáforo con estas respuestas. La intensidad es RESPECTO AL
 * CURSO ENTERO, no a la luz más votada: un curso 80 % en rojo no puede verse
 * igual que uno 80 % en verde. `dominante` es null con empate: decir «el curso
 * está en ámbar» con 10 y 10 sería mentirle a la sala.
 */
export const lecturaSemaforo = (respuestas) => {
  const votos = [0, 0, 0]
  for (const r of Object.values(respuestas || {})) {
    if (Number.isInteger(r?.opcion) && r.opcion >= 0 && r.opcion < 3) votos[r.opcion]++
  }
  const total = votos[0] + votos[1] + votos[2]
  const luces = NIVELES.map((n, i) => {
    const fuerza = total ? Math.min(1, votos[i] / total / PLENO) : 0
    return {
      id: n.id,
      texto: n.texto,
      votos: votos[i],
      brillo: BRILLO_MIN + (1 - BRILLO_MIN) * fuerza,
      tamano: TAMANO_MIN + (1 - TAMANO_MIN) * fuerza,
    }
  })
  const mayor = Math.max(...votos)
  const arriba = mayor > 0 ? luces.filter(l => l.votos === mayor) : []
  return { total, votos, luces, dominante: arriba.length === 1 ? arriba[0].id : null }
}

/* ── Apuesta ───────────────────────────────────────────────────────────── */

/**
 * Las tres pantallas, en un orden que no se negocia: si la apuesta se pide
 * después de ver las respuestas, no es una apuesta, es una descripción. La
 * fase vive en la sala (estado.fase) y la mueve el docente.
 */
export const FASES_APUESTA = ['escribir', 'apostar', 'comparar']
export const faseApuesta = (estado) => (FASES_APUESTA.includes(estado?.fase) ? estado.fase : 'escribir')

/** Un número de 0 a n, o null. */
const entre = (v, n) => (Number.isInteger(v) && v >= 0 && v <= n ? v : null)

/**
 * Lo que el curso aprendió de sí mismo. Cada estudiante guarda `apuesta` y,
 * al corregir, `tuve`. Se cuenta cuántos acertaron su apuesta, cuántos
 * apostaron de más (les sobró confianza) y cuántos de menos (sabían más de lo
 * que creían). Sin nombres: la distancia es de cada uno, y el proyector solo
 * dice cuántos.
 */
export const calibracion = (respuestas, n) => {
  let apostaron = 0, compararon = 0, exactos = 0, deMas = 0, deMenos = 0, sumaApuesta = 0, sumaTuve = 0
  for (const r of Object.values(respuestas || {})) {
    const a = entre(r?.apuesta, n)
    if (a == null) continue
    apostaron++
    const tuve = entre(r?.tuve, n)
    if (tuve == null) continue
    compararon++
    sumaApuesta += a
    sumaTuve += tuve
    if (a === tuve) exactos++
    else if (a > tuve) deMas++
    else deMenos++
  }
  const prom = (s) => (compararon ? Math.round((s / compararon) * 10) / 10 : null)
  return { apostaron, compararon, exactos, deMas, deMenos, promApuesta: prom(sumaApuesta), promTuve: prom(sumaTuve) }
}

/** La lectura de UNA persona, para su celular: 'exacto' | 'deMas' | 'deMenos'. */
export const miCalibracion = (apuesta, tuve) => (apuesta === tuve ? 'exacto' : apuesta > tuve ? 'deMas' : 'deMenos')

/* ── El muro ───────────────────────────────────────────────────────────── */

/**
 * En cuántas columnas y a qué escala se dibuja un muro de `n` tarjetas. En
 * ESCALONES: con una fórmula continua, cada tarjeta nueva cambia el tamaño de
 * todas y el muro entero parpadea justo cuando llega una. (muro.js del Belt.)
 */
export const formaMuro = (n) => {
  if (n <= 4) return { columnas: 2, escala: 1 }
  if (n <= 9) return { columnas: 3, escala: 0.82 }
  if (n <= 16) return { columnas: 4, escala: 0.66 }
  if (n <= 25) return { columnas: 5, escala: 0.54 }
  return { columnas: 6, escala: 0.45 }
}

const claveMuro = (s) => String(s == null ? '' : s)
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim()

/**
 * Las tarjetas del muro, sin repetir: dos «pedir comida» se leen como un error
 * de la pantalla aunque los hayan escrito dos personas. Se juntan sin tildes,
 * mayúsculas ni signos, y la tarjeta cuenta cuántos lo escribieron. `aprobadas`
 * viene de abiertas() y conserva su orden de llegada.
 */
export const tarjetasMuro = (aprobadas) => {
  const vistas = new Map()
  for (const r of aprobadas || []) {
    const k = claveMuro(r.texto)
    if (!k) continue
    const t = vistas.get(k)
    if (t) t.cuantos++
    else vistas.set(k, { clave: k, texto: r.texto, original: r.original, corregida: r.corregida, cuantos: 1 })
  }
  return [...vistas.values()]
}
