import { describe, expect, it } from 'vitest'
import { limpiarActividad, problemaDe } from './logic.js'
import {
  acierta, casillasDe, claveDe, limpiarCrucigrama, palabrasDe, porDestapar, progreso, rejilla, soloLetras, umbral,
} from './crucigrama.js'
import { armarResumen } from './resumen.js'
import { codificar, leerTraida } from './traida.js'

/* CAT horizontal en (0,0) y CAR vertical desde la misma C: comparten número. */
const CRUCI = {
  tipo: 'crucigrama', pregunta: '', ancho: 3, alto: 3,
  palabras: [
    { palabra: 'CAT', original: 'cat', pista: 'Un animal', fila: 0, col: 0, dir: 'h', numero: 1 },
    { palabra: 'CAR', original: 'car', fila: 0, col: 0, dir: 'v', numero: 1 },
  ],
}

describe('el crucigrama que llega del Belt', () => {
  it('se guarda limpio, con «la mitad» por defecto', () => {
    const a = limpiarActividad({ ...CRUCI, id: 'x' })
    expect(a.destapar).toBe('mitad')
    expect(a.palabras.map(claveDe)).toEqual(['1h', '1v'])
    expect(problemaDe(a)).toBeNull()
  })

  it('descarta palabras rotas o que se salen de la cuadrícula', () => {
    const p = palabrasDe({ ...CRUCI, palabras: [...CRUCI.palabras, { palabra: 'TOOLONG', fila: 0, col: 0, dir: 'h', numero: 2 }, { palabra: 'X', fila: 1, col: 1, dir: 'h', numero: 3 }] })
    expect(p).toHaveLength(2)
  })

  it('con menos de dos palabras no se puede lanzar', () => {
    expect(problemaDe({ tipo: 'crucigrama', ancho: 3, alto: 1, palabras: [CRUCI.palabras[0]] })).toBe('prob_sinCrucigrama')
  })

  it('un modo desconocido cae en «la mitad»', () => {
    expect(limpiarCrucigrama({ ...CRUCI, destapar: 'raro' }).destapar).toBe('mitad')
    expect(limpiarCrucigrama({ ...CRUCI, destapar: 'docente' }).destapar).toBe('docente')
  })

  it('arma la cuadrícula con letras y números', () => {
    const { celdas, numeros } = rejilla(3, 3, palabrasDe(CRUCI))
    expect(celdas[0].join('')).toBe('CAT')
    expect(celdas.map(f => f[0]).join('')).toBe('CAR')
    expect(celdas[1][1]).toBeNull()
    expect(numeros['0,0']).toBe(1)
    expect(casillasDe(palabrasDe(CRUCI)[1])).toEqual(['0,0', '1,0', '2,0'])
  })

  it('acierta sin tildes, mayúsculas ni espacios; la ñ cuenta', () => {
    const p = { palabra: 'CANCION' }
    expect(acierta(' canción ', p)).toBe(true)
    expect(acierta('cancio', p)).toBe(false)
    expect(soloLetras('Año')).toBe('AÑO')
  })

  it('llega por el enlace del Belt', () => {
    const r = leerTraida(`#/host?cargar=${codificar({ v: 1, actividad: CRUCI })}`)
    expect(r.actividad).toMatchObject({ tipo: 'crucigrama', destapar: 'mitad' })
  })
})

describe('cuándo se destapa una palabra', () => {
  const palabras = palabrasDe(CRUCI)
  const respuestas = { a: { bien: { '1h': true, '1v': true } }, b: { bien: { '1h': true } }, c: {} }

  it('cuenta cuántos tienen cada una y cuántos terminaron', () => {
    expect(progreso(respuestas, palabras)).toEqual({ por: { '1h': 2, '1v': 1 }, terminaron: 1 })
  })

  it('la mitad de los conectados, hacia arriba y nunca menos de uno', () => {
    expect(umbral('mitad', 5)).toBe(3)
    expect(umbral('mitad', 4)).toBe(2)
    expect(umbral('mitad', 0)).toBe(1)
    expect(umbral('uno', 30)).toBe(1)
    expect(umbral('docente', 30)).toBe(Infinity)
  })

  it('el que sabe mucho no destapa solo: con 4 conectados hacen falta 2', () => {
    const solo = { a: { bien: { '1h': true, '1v': true } } }
    expect(porDestapar(palabras, progreso(solo, palabras).por, umbral('mitad', 4))).toEqual([])
    expect(porDestapar(palabras, progreso(respuestas, palabras).por, umbral('mitad', 4))).toEqual(['1h'])
  })

  it('lo ya destapado no se vuelve a pedir', () => {
    expect(porDestapar(palabras, { '1h': 9, '1v': 9 }, 1, { '1h': true })).toEqual(['1v'])
  })

  it('en el resumen va resuelto, con cuántos la sacaron', () => {
    const r = armarResumen({ actividades: [{ ...CRUCI, id: 'c' }], respuestas: { c: respuestas } }, 0)
    expect(r.actividades[0].palabras).toEqual([
      { numero: 1, dir: 'h', pista: 'Un animal', original: 'cat', largo: 3, sacaron: 2 },
      { numero: 1, dir: 'v', pista: '', original: 'car', largo: 3, sacaron: 1 },
    ])
  })
})
