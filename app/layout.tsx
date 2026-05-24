import HomeLink from './HomeLink'
import './global.css'

type Props = { children: React.ReactNode }

export default function RootLayout({ children }: Props) {
  return (
    <html lang="ko">
      <body className="mx-auto max-w-2xl bg-[--bg] px-5 py-12 text-[--text]">
        <header className="mb-14 flex flex-row place-content-between">
          <HomeLink />
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
