/* ============================================================================
   LO QUE CAMBIÓ LA CORRECCIÓN
   ----------------------------------------------------------------------------
   El texto del estudiante con la corrección encima, como se corrige en papel:
   lo que sobraba, tachado; lo que faltaba, subrayado. Lo ven el estudiante en
   su celular y el docente al moderar. NUNCA el proyector: frente al curso va
   solo la versión limpia (Resultados.jsx), para no exponer a nadie.

   El color no es la única señal (DUA): tachado y subrayado se leen igual sin
   distinguir el rojo del verde.
   ========================================================================== */
import { diferencias } from './logic.js'

export function Cambios({ antes, despues, className = '' }) {
  return (
    <p className={`break-words ${className}`}>
      {diferencias(antes, despues).map((d, i) => (
        d.tipo === 'igual' ? <span key={i}>{d.texto}</span>
          : d.tipo === 'quitado'
            ? <del key={i} className="text-rose-700 bg-rose-50 decoration-2 rounded px-0.5">{d.texto}</del>
            : <ins key={i} className="text-teal-800 bg-teal-50 font-bold underline decoration-2 underline-offset-2 rounded px-0.5">{d.texto}</ins>
      ))}
    </p>
  )
}
