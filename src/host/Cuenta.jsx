/* ============================================================================
   LA CUENTA DEL DOCENTE
   ----------------------------------------------------------------------------
   Solo hace falta para guardar materiales. Sin sesión, Liveboard funciona
   igual: se arman las actividades en la sala y quedan en este navegador.

   Los errores de configuración de Firebase se traducen a lo que hay que hacer
   en la consola, no al código del error.
   ========================================================================== */
import { traducir, useT } from '../i18n.jsx'
import { Button } from '../ui.jsx'

export async function iniciarSesion(store, idioma) {
  try {
    return await store.signIn()
  } catch (e) {
    const porque = {
      'auth/popup-closed-by-user': null,
      'auth/cancelled-popup-request': null,
      'auth/popup-blocked': 'errPopupBloqueado',
      'auth/operation-not-allowed': 'errSinGoogle',
      'auth/configuration-not-found': 'errSinGoogle',
      'auth/unauthorized-domain': 'errDominio',
    }[e.code]
    if (porque !== null) alert(porque ? traducir(idioma, porque) : traducir(idioma, 'errSesion', e.message))
    return null
  }
}

export function Cuenta({ store, user }) {
  const t = useT()
  if (user === undefined) return null
  if (!user) {
    return (
      <Button variant="ghost" className="!px-3 !py-1.5 text-sm" onClick={() => iniciarSesion(store, t.idioma)}>
        {t('iniciarSesion')}
      </Button>
    )
  }
  return (
    <span className="flex items-center gap-2 text-sm">
      {user.photo && <img src={user.photo} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full" />}
      <span className="font-bold max-w-[10rem] truncate">{user.name}</span>
      {store.online && <button onClick={() => store.signOut()} className="text-slate-500 hover:underline">{t('salir')}</button>}
    </span>
  )
}
