import { describe, expect, it } from 'vitest'
import { VIDA_MS, borrarSiEsLaMisma, esVieja, viejas } from './limpieza.js'

const H = 60 * 60 * 1000

describe('salas que quedaron abiertas', () => {
  it('una sala es vieja después de 12 horas', () => {
    expect(VIDA_MS).toBe(12 * H)
    expect(esVieja(0, 13 * H)).toBe(true)
    expect(esVieja(0, 11 * H)).toBe(false)
    expect(esVieja(undefined, 99 * H)).toBe(false)
  })

  it('nunca se borra la sala en uso, aunque sea vieja', () => {
    const salas = { 111111: 0, 222222: 0, 333333: 20 * H }
    expect(viejas(salas, 24 * H, '222222').map(([pin]) => pin)).toEqual(['111111'])
  })

  const tienda = (salas) => {
    const borradas = []
    return {
      borradas,
      get: async (ruta) => salas[ruta.split('/')[1]] ?? null,
      remove: async (ruta) => { borradas.push(ruta) },
    }
  }

  it('borra la sala si sigue siendo la misma que se abrió', async () => {
    const s = tienda({ 111111: { creada: 5 } })
    await borrarSiEsLaMisma(s, '111111', 5)
    expect(s.borradas).toEqual(['boards/111111'])
  })

  it('no borra si hoy ese PIN es la sala de otro docente', async () => {
    const s = tienda({ 111111: { creada: 999 } })
    await borrarSiEsLaMisma(s, '111111', 5)
    expect(s.borradas).toEqual([])
  })

  it('no hace nada si la sala ya no existe', async () => {
    const s = tienda({})
    await borrarSiEsLaMisma(s, '111111', 5)
    expect(s.borradas).toEqual([])
  })
})
