import { describe, expect, it } from 'vitest'
import { IDIOMAS, TEXTOS, traducir } from '../i18n.jsx'
import { TIPOS } from './logic.js'
import { actividadesParaSala, listaDeMateriales, materialParaGuardar, rutaMaterial } from './materiales.js'
import { FONDOS } from './fondos.js'

describe('textos en español e inglés', () => {
  it('cada texto existe en los dos idiomas, y del mismo tipo', () => {
    for (const [clave, v] of Object.entries(TEXTOS)) {
      for (const l of IDIOMAS) expect(v[l], `${clave}.${l}`).toBeDefined()
      expect(typeof v.en, clave).toBe(typeof v.es)
      if (Array.isArray(v.es)) expect(v.en.length, clave).toBe(v.es.length)
    }
  })

  it('cada tipo de actividad y cada problema tiene su texto', () => {
    for (const tipo of TIPOS) {
      expect(TEXTOS[`tipo_${tipo}`], tipo).toBeDefined()
      expect(TEXTOS[`ayuda_${tipo}`], tipo).toBeDefined()
    }
    for (const p of ['prob_sinTipo', 'prob_sinPregunta', 'prob_pocasAlternativas', 'prob_pocosElementos', 'prob_sinMolde', 'prob_sinConsignas']) expect(TEXTOS[p], p).toBeDefined()
  })

  it('traduce, con datos, y una clave desconocida se ve tal cual', () => {
    expect(traducir('es', 'conectados', 3)).toBe('3 conectados')
    expect(traducir('en', 'conectados', 3)).toBe('3 connected')
    expect(traducir('en', 'respondieron', 1)).toBe('1 answered')
    expect(traducir('fr', 'entrar')).toBe('Entrar')
    expect(traducir('es', 'noExiste')).toBe('noExiste')
  })

  it('la escala tiene cinco rótulos en cada idioma', () => {
    expect(TEXTOS.escala.es).toHaveLength(5)
    expect(TEXTOS.escala.en).toHaveLength(5)
  })
})

describe('mis materiales', () => {
  it('cada docente guarda bajo su cuenta, en la rama de Liveboard', () => {
    expect(rutaMaterial('u1', 'm1')).toBe('docentes/u1/liveboard/m1')
  })

  it('guarda limpio, con idioma válido y la hora que se le pase', () => {
    const m = materialParaGuardar({
      nombre: '  Célula   inicio ', idioma: 'fr',
      actividades: [{ id: 'a1', tipo: 'encuesta', pregunta: ' ¿Cuál? ', alternativas: ['A', '', 'B'] }],
    }, 123)
    expect(m).toEqual({
      nombre: 'Célula inicio', idioma: 'es', fondo: 'ninguno', actualizado: 123,
      actividades: [{ id: 'a1', tipo: 'encuesta', pregunta: '¿Cuál?', alternativas: ['A', 'B'] }],
    })
  })

  it('lista el más reciente primero y aguanta lo que Firebase no guarda', () => {
    const l = listaDeMateriales({
      viejo: { nombre: 'Viejo', actualizado: 1, actividades: [{ tipo: 'nube', pregunta: 'x' }] },
      nuevo: { nombre: 'Nuevo', actualizado: 5, idioma: 'en' },
    })
    expect(l.map(m => m.id)).toEqual(['nuevo', 'viejo'])
    expect(l[0]).toMatchObject({ idioma: 'en', actividades: [] })
  })

  it('guarda el fondo, y uno que no existe cae en «sin fondo»', () => {
    expect(materialParaGuardar({ nombre: 'x', fondo: 'pizarra', actividades: [] }, 1).fondo).toBe('pizarra')
    expect(materialParaGuardar({ nombre: 'x', fondo: 'marciano', actividades: [] }, 1).fondo).toBe('ninguno')
    expect(listaDeMateriales({ a: { nombre: 'a' } })[0].fondo).toBe('ninguno')
  })

  it('cada fondo tiene nombre en los dos idiomas, y los oscuros lo dicen', () => {
    for (const f of FONDOS) {
      expect(f.es && f.en, f.id).toBeTruthy()
      expect(typeof f.oscuro, f.id).toBe('boolean')
    }
    expect(new Set(FONDOS.map((f) => f.id)).size).toBe(FONDOS.length)
  })

  it('al cargarlo en una sala, cada actividad recibe un id nuevo', () => {
    const m = { actividades: [{ id: 'a1', tipo: 'nube', pregunta: 'x' }, { id: 'a2', tipo: 'escala', pregunta: 'y' }] }
    const una = actividadesParaSala(m)
    const otra = actividadesParaSala(m)
    expect(una.map(a => a.pregunta)).toEqual(['x', 'y'])
    expect(una[0].id).not.toBe('a1')
    expect(una[0].id).not.toBe(otra[0].id)
  })
})
