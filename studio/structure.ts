import type { StructureResolver } from 'sanity/structure'
import { LOCALES } from './schemaTypes'

/** Singleton localizado: un documento por idioma con ID fijo `{type}-{locale}`. */
const localizedSingleton = (
  S: Parameters<StructureResolver>[0],
  type: string,
  title: string,
) =>
  S.listItem()
    .title(title)
    .child(
      S.list()
        .title(title)
        .items(
          LOCALES.map((locale) =>
            S.listItem()
              .title(`${title} (${locale.toUpperCase()})`)
              .child(
                S.document()
                  .schemaType(type)
                  .documentId(`${type}-${locale}`)
                  .title(`${title} (${locale.toUpperCase()})`),
              ),
          ),
        ),
    )

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Contenido')
    .items([
      // Lo que el profesor edita a diario, primero y sin submenús
      S.documentTypeListItem('publication').title('Publicaciones'),
      S.divider(),
      localizedSingleton(S, 'homePage', 'Inicio'),
      localizedSingleton(S, 'publicacionesPage', 'Publicaciones — textos'),
      localizedSingleton(S, 'investigacionPage', 'Investigación'),
      localizedSingleton(S, 'docenciaPage', 'Docencia'),
      localizedSingleton(S, 'biografiaPage', 'Biografía'),
      localizedSingleton(S, 'contactoPage', 'Contacto'),
      S.divider(),
      localizedSingleton(S, 'siteSettings', 'Configuración del sitio'),
    ])
