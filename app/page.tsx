import Link from './Link'
import { getPosts } from './posts'
import Time from './Time'
import { Post } from './types'

export const metadata = {
  title: 'All Posts — Hewon Jeong',
  description: 'A personal blog by Hewon Jeong',
}

export default async function Home() {
  const posts = await getPosts()

  return (
    <div className="relative -top-[8px] flex flex-col gap-8">
      {posts.map((post) => (
        <Link
          key={post.slug}
          className="block py-4 hover:scale-[1.005]"
          href={`/${post.slug}/`}
        >
          <article>
            <h2 className="text-2xl font-bold break-keep">{post.title}</h2>
            <Time value={post.date} className="mt-1.5" />
            <p className='mt-0.5'>{post.spoiler}</p>
          </article>
        </Link>
      ))}
    </div>
  )
}
