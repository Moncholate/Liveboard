/* ============================================================================
   EL FILTRO DE GROSERÍAS
   ----------------------------------------------------------------------------
   No es una red de seguridad perfecta y no pretende serlo: es la primera
   barrera, para que lo más obvio no alcance a proyectarse en el segundo que
   tarda el docente en reaccionar. Lo demás lo resuelve la moderación: el
   docente oculta cualquier palabra y aprueba cada respuesta abierta. Y lo que
   el filtro oculta, el docente lo puede restaurar.

   Se compara sin tildes, sin mayúsculas, sin letras repetidas («weoooon») y
   con los cambios típicos para esquivar filtros (0 por o, 4 por a, @…).

   LO QUE NO DEBE TACHAR pesa tanto como lo que sí: una nube de biología, de
   historia o de inglés no puede perder palabras inocentes. Por eso:
     · las raíces se buscan DENTRO de cada palabra («culiao», «culiado»), pero
       solo raíces que no aparecen en palabras normales: nada de «nig»
       (night, Nigeria) ni «chupal» (chupalla);
     · las palabras cortas, solo ENTERAS, para no tachar «computador» por
       «puta»;
     · las que tienen letra doble («perra», «ass») se comparan tal cual, sin
       colapsar: colapsadas serían «pera» y «as», que son palabras normales;
     · fuera los términos de anatomía («pene») y las que existen en inglés
       («won»): no son groserías en una clase de ciencias o de inglés.
   ========================================================================== */

/* Raíces que no aparecen dentro de palabras inocentes. */
const RAICES = [
  // Chile y español
  'weon', 'hueon', 'huevon', 'wevon', 'culiao', 'culiad', 'conchetumadre', 'conchetumare',
  'conchesumadre', 'conchasumadre', 'chucha', 'mierd', 'maricon', 'maraco', 'putamadre',
  'pendej', 'cabron', 'sacowea', 'aweonao', 'ahueonao', 'weonao', 'hueonao',
  // inglés
  'fuck', 'shit', 'bitch', 'cunt', 'motherf', 'asshole', 'whore',
]

/* Palabras cortas o que existen dentro de otras: solo enteras. */
const ENTERAS = [
  'ctm', 'csm', 'ql', 'wn', 'puta', 'puto', 'putas', 'putos', 'pico', 'raja', 'zorra',
  'perra', 'cagar', 'cago', 'caca', 'mrd', 'verga', 'coño', 'tula', 'poto', 'culo',
  'wea', 'weas', 'aweonado',
  'ass', 'dick', 'cock', 'tits', 'slut', 'pussy', 'nigger', 'faggot', 'wtf', 'stfu',
]

const SUSTITUTOS = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' }

const base = (s) => String(s == null ? '' : s)
  .toLowerCase()
  .replace(/[013457@$]/g, ch => SUSTITUTOS[ch])
  .replace(/[^ñ]/g, ch => ch.normalize('NFD').replace(/[̀-ͯ]/g, ''))
const colapsar = (s) => s.replace(/(.)\1+/g, '$1')
const tieneDoble = (s) => /(.)\1/.test(s)

const RAICES_N = RAICES.map(r => colapsar(base(r)))
/* Las enteras sin letra doble se comparan colapsadas («putaaa» = «puta»); las
   con doble, tal cual («perra» sí, «pera» no). */
const ENTERAS_COLAPSABLES = new Set(ENTERAS.map(base).filter(p => !tieneDoble(p)))
const ENTERAS_EXACTAS = new Set(ENTERAS.map(base).filter(tieneDoble))

/** ¿Tiene alguna grosería este texto? */
export const esGroseria = (texto) => {
  const palabras = base(texto).split(/[^a-zñ]+/).filter(Boolean)
  if (!palabras.length) return false
  for (const p of palabras) {
    const c = colapsar(p)
    if (ENTERAS_EXACTAS.has(p) || ENTERAS_COLAPSABLES.has(c)) return true
    if (RAICES_N.some(r => c.includes(r))) return true
  }
  /* «c o n c h e t u m a r e»: letras sueltas para esquivar el filtro. Solo
     entonces se juntan las palabras, y solo contra raíces largas: juntar
     siempre haría de «huevo nuevo» un «huevonuevo». */
  if (palabras.filter(p => p.length <= 2).length >= 3) {
    const pegado = colapsar(palabras.join(''))
    if (RAICES_N.some(r => r.length >= 5 && pegado.includes(r))) return true
  }
  return false
}
