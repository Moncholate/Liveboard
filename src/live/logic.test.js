import { describe, expect, it } from 'vitest'
import {
  abiertas, actividadNueva, claveDePalabra, conteoEncuesta, correccionVigente, diferencias, estadisticaEscala, limpiarActividad,
  limpiarPalabra, nombreValido, nube, palabrasDe, pinAlAzar, problemaDe, tamanoEnNube,
} from './logic.js'
import { esGroseria } from './groserias.js'

describe('palabras de la nube', () => {
  it('agrupa mayúsculas, tildes y espacios como la misma palabra', () => {
    expect(claveDePalabra('Revolución')).toBe(claveDePalabra(' revolucion '))
    expect(claveDePalabra('REVOLUCIÓN')).toBe('revolucion')
  })

  it('la ñ no se confunde con la n', () => {
    expect(claveDePalabra('año')).not.toBe(claveDePalabra('ano'))
  })

  it('la clave no lleva caracteres que Firebase no acepta', () => {
    expect(claveDePalabra('p.ej./a#b')).toBe('pejab')
  })

  it('quita signos de los bordes pero no de adentro', () => {
    expect(limpiarPalabra('¡libertad!')).toBe('libertad')
    expect(limpiarPalabra('  e-mail  ')).toBe('e-mail')
  })

  it('cada estudiante aporta hasta 3 palabras distintas', () => {
    expect(palabrasDe(['sol', 'Sol', 'luna', '', 'mar', 'río'])).toEqual(['sol', 'luna', 'mar'])
  })

  it('cuenta personas, muestra la forma más escrita y ordena de más a menos', () => {
    const r = {
      a: { palabras: ['Revolución', 'pan'] },
      b: { palabras: ['Revolución'] },
      c: { palabras: ['revolucion', 'pan'] },
      d: { palabras: ['libertad'] },
    }
    const n = nube(r)
    expect(n.map(x => [x.texto, x.cuenta])).toEqual([['Revolución', 3], ['pan', 2], ['libertad', 1]])
  })

  it('una grosería entra oculta sola, y el docente puede restaurarla', () => {
    const r = { a: { palabras: ['weón', 'célula'] } }
    const sola = nube(r)
    expect(sola.find(x => x.clave === 'weon')).toMatchObject({ auto: true, oculta: true })
    expect(sola.find(x => x.clave === 'celula').oculta).toBe(false)
    const restaurada = nube(r, { weon: 'mostrar' })
    expect(restaurada.find(x => x.clave === 'weon').oculta).toBe(false)
  })

  it('el docente oculta cualquier palabra', () => {
    const n = nube({ a: { palabras: ['Pedro'] } }, { pedro: 'ocultar' })
    expect(n[0].oculta).toBe(true)
  })

  it('la más repetida es la más grande', () => {
    expect(tamanoEnNube(10, 10)).toBeGreaterThan(tamanoEnNube(1, 10))
    expect(tamanoEnNube(1, 1)).toBe(2.5)
  })
})

describe('filtro de groserías', () => {
  it('pilla las obvias, con tildes, mayúsculas, letras repetidas y números', () => {
    for (const p of ['weón', 'WEOOOON', 'culiao', 'ctm', 'c0nchetumare', 'mierda', 'puta', 'fuck', 'aweonao', 'perra'])
      expect(esGroseria(p), p).toBe(true)
  })

  it('pilla las escritas con letras sueltas', () => {
    expect(esGroseria('c o n c h e t u m a r e')).toBe(true)
  })

  it('no tacha palabras inocentes de ninguna asignatura', () => {
    for (const p of ['computador', 'disputa', 'pera', 'as', 'clase', 'night', 'Nigeria', 'chupalla',
      'won', 'pene', 'huevo nuevo', 'escultura', 'picota', 'class', 'assessment', 'Dickens', 'cocktail', 'perro'])
      expect(esGroseria(p), p).toBe(false)
  })
})

describe('encuesta y escala', () => {
  it('cuenta votos por alternativa e ignora los fuera de rango', () => {
    const r = { a: { opcion: 0 }, b: { opcion: 2 }, c: { opcion: 2 }, d: { opcion: 7 }, e: {} }
    expect(conteoEncuesta(r, 3)).toEqual({ votos: [1, 0, 2], total: 3 })
  })

  it('reparte la escala y saca el promedio con un decimal', () => {
    const r = { a: { valor: 5 }, b: { valor: 4 }, c: { valor: 4 }, d: { valor: 9 } }
    expect(estadisticaEscala(r)).toEqual({ votos: [0, 0, 0, 2, 1], total: 3, promedio: 4.3 })
  })

  it('sin respuestas no hay promedio', () => {
    expect(estadisticaEscala({}).promedio).toBeNull()
  })
})

describe('respuestas abiertas', () => {
  const r = {
    p1: { texto: 'La fotosíntesis produce oxígeno', at: 2 },
    p2: { texto: 'no sé weón', at: 1 },
    p3: { texto: '   ', at: 3 },
  }
  const quien = { p1: { nombre: 'Ana' }, p2: { nombre: 'Beto' } }

  it('separa pendientes, aprobadas y descartadas, en orden de llegada, sin las vacías', () => {
    const { pendientes, aprobadas, descartadas } = abiertas(r, { p1: true }, quien)
    expect(pendientes.map(x => x.pid)).toEqual(['p2'])
    expect(aprobadas.map(x => x.pid)).toEqual(['p1'])
    expect(descartadas).toEqual([])
    expect(abiertas(r, { p2: false }, quien).descartadas.map(x => x.pid)).toEqual(['p2'])
  })

  it('marca las que traen groserías y lleva el nombre solo como dato', () => {
    const { pendientes } = abiertas(r, {}, quien)
    expect(pendientes[0]).toMatchObject({ pid: 'p2', groseria: true, nombre: 'Beto' })
  })
})

describe('corregir una respuesta abierta', () => {
  const r = { p1: { texto: 'I go to the park yesterday', at: 1 } }

  it('muestra la corrección y guarda lo que escribió el estudiante', () => {
    const c = { p1: { texto: 'I went to the park yesterday.', de: 'I go to the park yesterday' } }
    const [x] = abiertas(r, { p1: true }, {}, c).aprobadas
    expect(x).toMatchObject({ texto: 'I went to the park yesterday.', original: 'I go to the park yesterday', corregida: true })
  })

  it('caduca si el estudiante cambió su respuesta después de la corrección', () => {
    const c = { p1: { texto: 'I went to the park.', de: 'I go to the park' } }
    const [x] = abiertas(r, {}, {}, c).pendientes
    expect(x).toMatchObject({ texto: 'I go to the park yesterday', corregida: false })
  })

  it('una corrección vacía o igual al original no cuenta', () => {
    expect(correccionVigente({ texto: '  ', de: 'hola' }, 'hola')).toBeNull()
    expect(correccionVigente({ texto: 'hola', de: 'hola' }, 'hola')).toBeNull()
    expect(correccionVigente(null, 'hola')).toBeNull()
  })

  it('marca solo lo que cambió, palabra por palabra y signo por signo', () => {
    expect(diferencias('I go to the park yesterday', 'I went to the park yesterday.')).toEqual([
      { tipo: 'igual', texto: 'I ' },
      { tipo: 'quitado', texto: 'go' },
      { tipo: 'agregado', texto: 'went' },
      { tipo: 'igual', texto: ' to the park yesterday' },
      { tipo: 'agregado', texto: '.' },
    ])
  })

  it('juntando los trozos sale el original (sin lo agregado) o la corrección (sin lo quitado)', () => {
    const a = 'She dont like apples, she like bananas'
    const b = "She doesn't like apples; she likes bananas."
    const d = diferencias(a, b)
    expect(d.filter(x => x.tipo !== 'agregado').map(x => x.texto).join('')).toBe(a)
    expect(d.filter(x => x.tipo !== 'quitado').map(x => x.texto).join('')).toBe(b)
  })
})

describe('actividades', () => {
  it('no se lanza sin pregunta, ni una encuesta con menos de 2 alternativas', () => {
    expect(problemaDe(actividadNueva('nube'))).toBe('prob_sinPregunta')
    expect(problemaDe({ tipo: 'encuesta', pregunta: '¿Cuál?', alternativas: ['Sí', ' '] })).toBe('prob_pocasAlternativas')
    expect(problemaDe({ tipo: 'escala', pregunta: '¿Qué tan seguro te sientes?' })).toBeNull()
    expect(problemaDe({ tipo: 'otro', pregunta: 'x' })).toBe('prob_sinTipo')
  })

  it('cada actividad nueva trae su propio id, y se conserva al limpiarla', () => {
    const a = actividadNueva('nube')
    expect(a.id).toMatch(/^[a-z0-9]{12}$/)
    expect(actividadNueva('nube').id).not.toBe(a.id)
    expect(limpiarActividad({ ...a, pregunta: '¿Qué?' }).id).toBe(a.id)
  })

  it('guarda la encuesta sin alternativas vacías y con máximo 4', () => {
    const a = limpiarActividad({ tipo: 'encuesta', pregunta: ' ¿Cuál? ', alternativas: ['A', '', 'B', 'C', 'D', 'E'] })
    expect(a).toEqual({ tipo: 'encuesta', pregunta: '¿Cuál?', alternativas: ['A', 'B', 'C', 'D'] })
  })
})

describe('sala', () => {
  it('el PIN tiene 6 dígitos', () => {
    expect(pinAlAzar(() => 0)).toBe('100000')
    expect(pinAlAzar(() => 0.999999)).toMatch(/^\d{6}$/)
  })

  it('el apodo se limpia y se corta en 16', () => {
    expect(nombreValido('  Ana   María  ')).toBe('Ana María')
    expect(nombreValido('x'.repeat(30))).toHaveLength(16)
  })
})
