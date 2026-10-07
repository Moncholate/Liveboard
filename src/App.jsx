import { useEffect, useState } from 'react'
import Host, { IDIOMA_KEY, guardado } from './host/Host.jsx'
import Materiales from './host/Materiales.jsx'
import Mod from './host/Mod.jsx'
import Pizarra from './host/Pizarra.jsx'
import Player from './player/Player.jsx'
import { Button, Logo } from './ui.jsx'
import { ProveedorIdioma, SelectorIdioma, idiomaDelNavegador, useT, valido } from './i18n.jsx'
import { useTema } from './tema.jsx'

/* Ruteo por hash: GitHub Pages solo sirve index.html, así que #/host,
   #/join?pin=123456, #/mod, #/pizarra y #/materiales nunca dan 404. */
function useHash() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const onChange = () => setHash(location.hash)
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  const params = new URLSearchParams(hash.split('?')[1] || '')
  if (hash.startsWith('#/host')) return <Host />
  if (hash.startsWith('#/materiales')) return <Materiales />
  if (hash.startsWith('#/mod')) return <Mod pin={params.get('pin') || ''} clave={params.get('clave') || ''} />
  if (hash.startsWith('#/pizarra')) return <Pizarra pin={params.get('pin') || ''} clave={params.get('clave') || ''} />
  if (hash.startsWith('#/join')) {
    const pin = params.get('pin') || ''
    return <Player key={pin} initialPin={pin} />
  }
  return <InicioConIdioma />
}

/* La portada la ven estudiantes y docentes: idioma del navegador, o el último
   que eligió el docente en este computador. */
function InicioConIdioma() {
  useTema()
  const [idioma, setIdioma] = useState(() => valido(guardado.get(IDIOMA_KEY) || idiomaDelNavegador()))
  return (
    <ProveedorIdioma value={idioma}>
      <Inicio onIdioma={(l) => { setIdioma(l); guardado.set(IDIOMA_KEY, l) }} />
    </ProveedorIdioma>
  )
}

function Inicio({ onIdioma }) {
  const t = useT()
  const [pin, setPin] = useState('')
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6 text-center">
        <div>
          <Logo className="text-6xl" />
          <p className="text-slate-500 mt-2">{t('lema')}</p>
        </div>
        <form className="rounded-3xl bg-white border border-slate-200 p-6 flex flex-col gap-3"
          onSubmit={(e) => { e.preventDefault(); location.hash = `#/join?pin=${pin}` }}>
          <input inputMode="numeric" maxLength={6} placeholder={t('pin')} value={pin} aria-label={t('pinSala')}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full min-w-0 rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-2xl font-black tracking-widest focus:border-teal-600 outline-none" />
          <Button disabled={pin.length !== 6} className="text-lg">{t('entrar')}</Button>
        </form>
        <div className="flex flex-col gap-2">
          <a href="#/host" className="text-slate-500 underline underline-offset-4 hover:text-slate-800">{t('soyProfe')}</a>
          <a href="#/materiales" className="text-slate-500 underline underline-offset-4 hover:text-slate-800">{t('misMateriales')}</a>
        </div>
        <SelectorIdioma idioma={t.idioma} onCambiar={onIdioma} className="self-center" />
      </div>
    </div>
  )
}
