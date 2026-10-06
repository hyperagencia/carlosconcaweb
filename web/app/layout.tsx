import './globals.css'

// Layout raíz mínimo: <html> y <body> los define app/[locale]/layout.tsx
// para poder fijar el atributo lang por idioma.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return children
}
