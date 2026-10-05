import { useEffect, useState } from 'react'
import Host from './host/Host.jsx'
import Mod from './host/Mod.jsx'
import Player from './player/Player.jsx'
import { Button, Logo } from './ui.jsx'

/* Ruteo por hash: GitHub Pages solo sirve index.html, así que #/host,
   #/join?pin=123456 y #/mod nunca dan 404. */
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
  if (hash.startsWith('#/mod')) return <Mod pin={params.get('pin') || ''} clave={params.get('clave') || ''} />
  if (hash.startsWith('#/join')) {
    const pin = params.get('pin') || ''
    return <Player key={pin} initialPin={pin} />
  }
  return <Inicio />
}

function Inicio() {
  const [pin, setPin] = useState('')
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6 text-center">
        <div>
          <Logo className="text-6xl" />
          <p className="text-slate-500 mt-2">La pizarra en vivo de tu clase</p>
        </div>
        <form className="rounded-3xl bg-white border border-slate-200 p-6 flex flex-col gap-3"
          onSubmit={(e) => { e.preventDefault(); location.hash = `#/join?pin=${pin}` }}>
          <input inputMode="numeric" maxLength={6} placeholder="PIN" value={pin} aria-label="PIN de la sala"
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-2xl font-black tracking-widest focus:border-teal-600 outline-none" />
          <Button disabled={pin.length !== 6} className="text-lg">Entrar</Button>
        </form>
        <a href="#/host" className="text-slate-500 underline underline-offset-4 hover:text-slate-800">
          Soy profesor/a · abrir una sala
        </a>
      </div>
    </div>
  )
}
