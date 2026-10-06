import { defineQuery } from 'next-sanity'

export const PUBLICATIONS_QUERY = defineQuery(`
  *[_type == "publication"] | order(year desc, title asc) {
    _id, title, citation, year, category, collaborators, link, featured
  }
`)

// Las páginas tienen ID fijo `{type}-{locale}`. El detalle de cada proyección
// se afina cuando se construye la página (Fase 3).
export const HOME_PAGE_QUERY = defineQuery(`*[_id == $id && _type == "homePage"][0]`)
export const BIOGRAFIA_PAGE_QUERY = defineQuery(`*[_id == $id && _type == "biografiaPage"][0]`)
export const INVESTIGACION_PAGE_QUERY = defineQuery(`*[_id == $id && _type == "investigacionPage"][0]`)
export const DOCENCIA_PAGE_QUERY = defineQuery(`*[_id == $id && _type == "docenciaPage"][0]`)
export const PUBLICACIONES_PAGE_QUERY = defineQuery(`*[_id == $id && _type == "publicacionesPage"][0]`)
export const CONTACTO_PAGE_QUERY = defineQuery(`*[_id == $id && _type == "contactoPage"][0]`)
export const SITE_SETTINGS_QUERY = defineQuery(`*[_id == $id && _type == "siteSettings"][0]`)
