import { describe, expect, it } from 'vitest'
import {
  ALTO, ANCHO, COLORES, GROSOR_BORRADOR, MAX_PAGINAS, botonDeBorrar, codificar, decodificar, enCursoVisible, idDeTrazo, lejos,
  trazosEnOrden, ultimoTrazo, unirPartes, vistaValida,
} from './pizarra.js'
import { TEXTOS } from '../i18n.jsx'

describe('puntos del pizarrón', () => {
  it('viajan como texto corto, redondeados y dentro del papel', () => {
    expect(codificar([[10.4, 20.6], [-5, 2000]])).toBe(`10,21 0,${ALTO}`)
    expect(decodificar('10,21 0,900')).toEqual([[10, 21], [0, 900]])
    expect(codificar([[ANCHO + 1, 0]])).toBe(`${ANCHO},0`)
  })

  it('lo que no se entiende se salta', () => {
    expect(decodificar('1,2 basura 3,4')).toEqual([[1, 2], [3, 4]])
    expect(decodificar(null)).toEqual([])
  })

  it('un punto casi encima del anterior no se guarda', () => {
    expect(lejos([0, 0], [1, 1])).toBe(false)
    expect(lejos([0, 0], [3, 0])).toBe(true)
    expect(lejos(undefined, [0, 0])).toBe(true)
  })

  it('las partes de un trazo en curso se juntan en orden, aunque lleguen como objeto', () => {
    expect(unirPartes({ 10: '5,5', 2: '3,3', 0: '1,1' })).toBe('1,1 3,3 5,5')
    expect(unirPartes(['1,1', '2,2'])).toBe('1,1 2,2')
  })
})

describe('botón del lápiz', () => {
  it('con el botón lateral apretado, el lápiz borra', () => {
    expect(botonDeBorrar({ pointerType: 'pen', buttons: 3, button: 0 })).toBe(true)
    expect(botonDeBorrar({ pointerType: 'pen', buttons: 1, button: 2 })).toBe(true)
    expect(botonDeBorrar({ pointerType: 'pen', buttons: 32, button: 5 })).toBe(true)
  })

  it('sin botón escribe, y el botón derecho del mouse o un dedo no borran', () => {
    expect(botonDeBorrar({ pointerType: 'pen', buttons: 1, button: 0 })).toBe(false)
    expect(botonDeBorrar({ pointerType: 'mouse', buttons: 2, button: 2 })).toBe(false)
    expect(botonDeBorrar({ pointerType: 'touch', buttons: 1, button: 0 })).toBe(false)
  })
})

describe('trazos', () => {
  it('el id se ordena por hora, así deshacer quita el último', () => {
    const a = idDeTrazo(1000, () => 0.9)
    const b = idDeTrazo(2000, () => 0)
    expect(a < b).toBe(true)
    expect(ultimoTrazo({ [b]: {}, [a]: {} })).toBe(b)
    expect(ultimoTrazo(null)).toBeNull()
  })

  it('se leen en orden, con color y grosor válidos, y el borrador es grueso', () => {
    const l = trazosEnOrden({
      b: { c: '#nada', g: 99, p: '1,1 2,2' },
      a: { c: COLORES[1].hex, g: 10, p: '0,0' },
      c: { b: true, p: '5,5' },
      d: { p: '' },
    })
    expect(l.map(t => t.id)).toEqual(['a', 'b', 'c'])
    expect(l[1]).toMatchObject({ color: COLORES[0].hex, grosor: 4 })
    expect(l[2]).toMatchObject({ borrador: true, grosor: GROSOR_BORRADOR })
  })

  it('el trazo en curso se ve solo en su página y mientras no esté guardado', () => {
    const e = { id: 't1', pg: 0, c: COLORES[2].hex, g: 10, partes: { 0: '1,1', 1: '2,2' } }
    expect(enCursoVisible(e, 0, {})).toMatchObject({ color: COLORES[2].hex, puntos: [[1, 1], [2, 2]] })
    expect(enCursoVisible(e, 1, {})).toBeNull()
    expect(enCursoVisible(e, 0, { t1: {} })).toBeNull()
    expect(enCursoVisible(null, 0, {})).toBeNull()
  })
})

describe('vista del pizarrón', () => {
  it('sin nada guardado, una página en blanco', () => {
    expect(vistaValida(null)).toEqual({ pagina: 0, paginas: 1, fondo: 'blanco' })
  })

  it('la página no se sale del rango y hay un máximo de páginas', () => {
    expect(vistaValida({ pagina: 9, paginas: 3, fondo: 'cuadros' })).toEqual({ pagina: 2, paginas: 3, fondo: 'cuadros' })
    expect(vistaValida({ paginas: 999 }).paginas).toBe(MAX_PAGINAS)
    expect(vistaValida({ fondo: 'marciano' }).fondo).toBe('blanco')
  })

  it('cada color y cada papel tiene nombre en los dos idiomas', () => {
    for (const c of COLORES) expect(TEXTOS[`color_${c.id}`], c.id).toBeDefined()
    for (const f of ['blanco', 'cuadros', 'lineas']) expect(TEXTOS[`papel_${f}`], f).toBeDefined()
  })
})
