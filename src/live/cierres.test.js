import { describe, expect, it } from 'vitest'
import {
  abiertas, actividadNueva, conTexto, empiezaOculta, limpiarActividad, moderable, partirEnHuecos, problemaDe, tieneTexto, tituloDe,
} from './logic.js'
import {
  calibracion, cuantosHuecos, faseApuesta, formaMuro, largoHueco, lecturaSemaforo, miCalibracion, moldeCompleto, tarjetasMuro, textoDeMolde,
} from './cierres.js'
import { armarResumen, tieneAlgo } from './resumen.js'
import { codificar, decodificar, leerTraida } from './traida.js'

describe('los huecos de un molde', () => {
  it('tres guiones bajos o más son un hueco; dos no', () => {
    expect(partirEnHuecos('Hoy pude ______.')).toEqual([
      { tipo: 'texto', valor: 'Hoy pude ' }, { tipo: 'hueco', valor: '______' }, { tipo: 'texto', valor: '.' },
    ])
    expect(cuantosHuecos('mi__archivo')).toBe(0)
    expect(cuantosHuecos('Uso ___ en vez de ___')).toBe(2)
  })

  it('un molde de puros huecos no dice nada', () => {
    expect(tieneTexto('______')).toBe(false)
    expect(tieneTexto('Hoy pude ___')).toBe(true)
  })

  it('cada hueco cabe sin que la frase pase de 140, con un piso de 15', () => {
    const molde = 'Uso ___ en vez de ___'
    expect(largoHueco(molde)).toBe(Math.floor((140 - 'Uso  en vez de '.length) / 2))
    expect(largoHueco('x'.repeat(139) + '___')).toBe(15)
    expect(largoHueco('¿Qué te quedó a medias?')).toBe(140)
  })

  it('la duda guarda la frase entera; el muro, solo lo escrito', () => {
    expect(textoDeMolde('duda', 'No me sale ___ todavía.', ['el since'])).toBe('No me sale el since todavía.')
    expect(textoDeMolde('muro', 'Hoy pude ______.', ['  pedir   comida '])).toBe('pedir comida')
    expect(textoDeMolde('muro', 'Hoy pude ___ y ___.', ['leer', 'contar'])).toBe('leer … contar')
  })

  it('sin huecos, el molde es una pregunta y la respuesta es lo escrito', () => {
    expect(textoDeMolde('duda', '¿Qué te quedó a medias?', ['el since'])).toBe('el since')
    expect(moldeCompleto('¿Qué te quedó a medias?', [''])).toBe(false)
    expect(moldeCompleto('¿Qué te quedó a medias?', ['algo'])).toBe(true)
  })

  it('se envía solo con todos los huecos llenos', () => {
    expect(moldeCompleto('Uso ___ en vez de ___', ['for', ' '])).toBe(false)
    expect(moldeCompleto('Uso ___ en vez de ___', ['for', 'since'])).toBe(true)
  })
})

describe('las actividades de cierre', () => {
  it('se moderan las que llevan texto libre, como las abiertas', () => {
    expect(['duda', 'muro', 'antesahora'].every(conTexto)).toBe(true)
    expect(conTexto('semaforo') || conTexto('apuesta')).toBe(false)
    expect(moderable('muro') && moderable('nube') && !moderable('apuesta')).toBe(true)
  })

  it('el semáforo arranca tapado; el resto, no', () => {
    expect(empiezaOculta('semaforo')).toBe(true)
    expect(empiezaOculta('encuesta') || empiezaOculta('apuesta')).toBe(false)
  })

  it('la duda y el muro piden un molde con palabras', () => {
    expect(problemaDe({ tipo: 'duda', pregunta: '' })).toBe('prob_sinPregunta')
    expect(problemaDe({ tipo: 'muro', pregunta: '______' })).toBe('prob_sinMolde')
    expect(problemaDe({ tipo: 'muro', pregunta: 'Hoy pude ___' })).toBeNull()
  })

  it('antes / ahora y la apuesta no piden pregunta; la apuesta pide consignas', () => {
    expect(problemaDe(actividadNueva('antesahora'))).toBeNull()
    expect(problemaDe(actividadNueva('apuesta'))).toBe('prob_sinConsignas')
    expect(problemaDe({ tipo: 'apuesta', consignas: ['', 'Usa although'] })).toBeNull()
  })

  it('sin pregunta, el título es el nombre del tipo', () => {
    const t = (k) => ({ tipo_apuesta: 'Apuesta' }[k] || k)
    expect(tituloDe({ tipo: 'apuesta', pregunta: '' }, t)).toBe('Apuesta')
    expect(tituloDe({ tipo: 'apuesta', pregunta: ' Cierre ' }, t)).toBe('Cierre')
    expect(tituloDe({ tipo: 'duda', pregunta: '' }, t)).toBe('')
  })

  it('guarda limpio: lados vacíos fuera, consignas sin líneas vacías y hasta 8', () => {
    expect(limpiarActividad({ id: 'a', tipo: 'antesahora', pregunta: '', antes: '  he go ', ahora: '' }))
      .toEqual({ id: 'a', tipo: 'antesahora', pregunta: '', antes: 'he go' })
    const consignas = limpiarActividad({ tipo: 'apuesta', pregunta: '', consignas: ['uno', '', ' dos ', ...Array(10).fill('x')] }).consignas
    expect(consignas.slice(0, 2)).toEqual(['uno', 'dos'])
    expect(consignas).toHaveLength(8)
  })

  it('antes / ahora: los lados que escribió el estudiante viajan con su porque', () => {
    const { aprobadas } = abiertas({ p1: { antes: 'he go', ahora: 'he goes', texto: 'es tercera persona', at: 1 } }, { p1: true })
    expect(aprobadas[0]).toMatchObject({ antes: 'he go', ahora: 'he goes', texto: 'es tercera persona' })
  })
})

describe('el semáforo', () => {
  it('cuenta por nivel y dice dónde está el curso', () => {
    const r = lecturaSemaforo({ a: { opcion: 0 }, b: { opcion: 0 }, c: { opcion: 2 }, d: { opcion: 7 } })
    expect(r.votos).toEqual([2, 0, 1])
    expect(r.total).toBe(3)
    expect(r.dominante).toBe('verde')
  })

  it('con empate no canta ninguno', () => {
    expect(lecturaSemaforo({ a: { opcion: 1 }, b: { opcion: 2 } }).dominante).toBeNull()
  })

  it('la intensidad es respecto al curso entero: media clase enciende la luz entera', () => {
    const r = lecturaSemaforo({ a: { opcion: 0 }, b: { opcion: 1 } })
    expect(r.luces[0].brillo).toBe(1)
    expect(r.luces[2].brillo).toBeCloseTo(0.12)
  })
})

describe('la apuesta', () => {
  it('la fase por defecto es escribir', () => {
    expect(faseApuesta({})).toBe('escribir')
    expect(faseApuesta({ fase: 'comparar' })).toBe('comparar')
    expect(faseApuesta({ fase: 'otra' })).toBe('escribir')
  })

  it('cuenta cuántos acertaron, apostaron de más y de menos', () => {
    const c = calibracion({
      a: { apuesta: 4, tuve: 4 }, b: { apuesta: 5, tuve: 2 }, c: { apuesta: 1, tuve: 3 },
      d: { apuesta: 3 }, e: { tuve: 2 }, f: { apuesta: 9, tuve: 1 },
    }, 5)
    expect(c).toMatchObject({ apostaron: 4, compararon: 3, exactos: 1, deMas: 1, deMenos: 1 })
    expect(c.promApuesta).toBe(3.3)
    expect(c.promTuve).toBe(3)
  })

  it('la lectura de cada uno', () => {
    expect(miCalibracion(3, 3)).toBe('exacto')
    expect(miCalibracion(5, 2)).toBe('deMas')
    expect(miCalibracion(1, 4)).toBe('deMenos')
  })
})

describe('el muro', () => {
  it('encoge en escalones', () => {
    expect(formaMuro(3)).toEqual({ columnas: 2, escala: 1 })
    expect(formaMuro(25).columnas).toBe(5)
    expect(formaMuro(40).columnas).toBe(6)
  })

  it('no repite: junta sin tildes, mayúsculas ni signos, y cuenta cuántos', () => {
    const t = tarjetasMuro([{ texto: 'Pedir comida' }, { texto: 'pedir comída!' }, { texto: 'contar hasta 20' }])
    expect(t.map(x => [x.texto, x.cuantos])).toEqual([['Pedir comida', 2], ['contar hasta 20', 1]])
  })
})

describe('el resumen de la clase con cierres', () => {
  it('lleva solo lo aprobado y los totales, sin nombres', () => {
    const sala = {
      actividades: [
        { id: 's', tipo: 'semaforo', pregunta: 'I can order food' },
        { id: 'm', tipo: 'muro', pregunta: 'Hoy pude ___' },
        { id: 'p', tipo: 'apuesta', pregunta: '', consignas: ['uno', 'dos'] },
      ],
      respuestas: {
        s: { a: { opcion: 1 } },
        m: { a: { texto: 'leer' }, b: { texto: 'no aprobado' } },
        p: { a: { apuesta: 2, tuve: 1 } },
      },
      moderacion: { m: { abiertas: { a: true } } },
      participantes: { a: { nombre: 'Ana' } },
    }
    const r = armarResumen(sala, 0)
    expect(r.actividades.map(a => a.tipo)).toEqual(['semaforo', 'muro', 'apuesta'])
    expect(r.actividades[0].votos).toEqual([0, 1, 0])
    expect(r.actividades[1].textos).toEqual(['leer'])
    expect(r.actividades[2]).toMatchObject({ apostaron: 1, deMas: 1 })
    expect(JSON.stringify(r)).not.toContain('Ana')
  })

  it('un cierre sin respuestas no va', () => {
    expect(tieneAlgo({ tipo: 'apuesta', apostaron: 0 })).toBe(false)
    expect(tieneAlgo({ tipo: 'antesahora', items: [] })).toBe(false)
  })
})

describe('lo que llega del Utility Belt', () => {
  const enlace = (obj) => `#/host?cargar=${codificar(obj)}`

  it('codifica y decodifica con tildes y comillas', () => {
    const obj = { v: 1, actividad: { tipo: 'duda', pregunta: '¿Cuándo «since»? ______' } }
    expect(decodificar(codificar(obj))).toEqual(obj)
    expect(codificar(obj)).not.toMatch(/[+/=]/)
  })

  it('sin nada que cargar, no hay traída', () => {
    expect(leerTraida('#/host')).toBeNull()
    expect(leerTraida('')).toBeNull()
  })

  it('llega limpia y con un id nuevo', () => {
    const r = leerTraida(enlace({ v: 1, actividad: { tipo: 'apuesta', pregunta: '', consignas: ['uno', '', 'dos'], id: 'viejo' } }))
    expect(r.actividad).toMatchObject({ tipo: 'apuesta', consignas: ['uno', 'dos'] })
    expect(r.actividad.id).not.toBe('viejo')
  })

  it('rota, de otra versión, de un tipo que no es cierre o sin lo necesario, es un error', () => {
    expect(leerTraida('#/host?cargar=%%%')).toEqual({ error: true })
    expect(leerTraida(enlace({ v: 2, actividad: { tipo: 'duda', pregunta: 'x ___' } }))).toEqual({ error: true })
    expect(leerTraida(enlace({ v: 1, actividad: { tipo: 'nube', pregunta: 'x' } }))).toEqual({ error: true })
    expect(leerTraida(enlace({ v: 1, actividad: { tipo: 'semaforo', pregunta: '' } }))).toEqual({ error: true })
  })
})

describe('corregir en vivo', () => {
  it('el borrador vale para su clave y mientras esté fresco', async () => {
    const { borradorVigente, VIGENCIA_BORRADOR } = await import('./logic.js')
    const b = { clave: 'a:p1', texto: 'I went to the park.', at: 1000 }
    expect(borradorVigente(b, 'a:p1', 2000)).toBe('I went to the park.')
    expect(borradorVigente(b, 'a:p2', 2000)).toBeNull()
    expect(borradorVigente(b, 'a:p1', 1000 + VIGENCIA_BORRADOR)).toBeNull()
    expect(borradorVigente({ clave: 'a:p1', texto: '', at: 1000 }, 'a:p1', 2000)).toBe('')
    expect(borradorVigente(null, 'a:p1', 2000)).toBeNull()
  })
})
