import { readdir, mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'

const TARGET = 'https://hewon.dev'
const OUT = './redirect-build'

function redirectHtml(target: string) {
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<meta name="robots" content="noindex">
</head></html>
`
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

await writeFile(join(OUT, 'index.html'), redirectHtml(`${TARGET}/`))
await writeFile(join(OUT, '404.html'), redirectHtml(`${TARGET}/`))

const entries = await readdir('./public/', { withFileTypes: true })
const slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name)

for (const slug of slugs) {
  await mkdir(join(OUT, slug), { recursive: true })
  await writeFile(join(OUT, slug, 'index.html'), redirectHtml(`${TARGET}/${slug}/`))
}

console.log(`Generated ${slugs.length + 2} redirect files in ${OUT}/`)
