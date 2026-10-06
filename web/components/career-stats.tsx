import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { Reveal } from './reveal'

type Stat = { _key: string; value?: string | null; label?: string | null }

function QuoteDocIcon() {
  return (
    <svg
      viewBox="0 0 64 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden="true"
      className="h-[clamp(3rem,4.5vw,4.5rem)] w-auto"
    >
      <rect x="4" y="4" width="56" height="72" />
      <path d="M18 30h28M18 38h28M18 46h28" strokeLinecap="round" />
      <path
        d="M14 15l2-4M20 15l2-4M44 69l2-4M50 69l2-4"
        strokeLinecap="round"
      />
    </svg>
  )
}

const cardClass =
  'flex h-full min-h-[clamp(11rem,19vw,17rem)] flex-col justify-between gap-6 rounded-card bg-card p-[clamp(1.25rem,2.4vw,2.5rem)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const linkCardClass = `${cardClass} hover:bg-card-hover`
const labelClass = 'text-[clamp(0.875rem,1.15vw,1.125rem)] leading-snug'
const valueClass =
  'text-[clamp(2.5rem,5vw,4.75rem)] leading-none tracking-tight'

export async function CareerStats({ stats }: { stats: Stat[] }) {
  const t = await getTranslations('Home')
  const [first, last] = [stats[0], stats[1]]

  return (
    <section
      data-nav-tone="light"
      className="px-[clamp(1rem,4vw,5rem)] py-[clamp(3rem,8vw,7rem)]"
    >
      <Reveal>
        <h2 className="text-[clamp(2.25rem,4.4vw,4.25rem)] leading-tight font-normal tracking-tight">
          {t('careerTitle')}
        </h2>
      </Reveal>

      <ul className="mt-[clamp(2rem,4vw,4rem)] grid grid-cols-2 gap-[clamp(0.75rem,1.2vw,1.25rem)] lg:grid-cols-4">
        {first && (
          <li>
            <Reveal className="h-full">
              <div className={cardClass}>
                <p className={valueClass}>{first.value}</p>
                <p className={labelClass}>{first.label}</p>
              </div>
            </Reveal>
          </li>
        )}
        <li>
          <Reveal className="h-full" delay={0.08}>
            <Link href="/publicaciones" className={linkCardClass}>
              <QuoteDocIcon />
              <span className={labelClass}>{t('scientific')}</span>
            </Link>
          </Reveal>
        </li>
        <li>
          <Reveal className="h-full" delay={0.16}>
            <Link href="/publicaciones" className={linkCardClass}>
              <QuoteDocIcon />
              <span className={labelClass}>{t('mathPhysics')}</span>
            </Link>
          </Reveal>
        </li>
        {last && (
          <li>
            <Reveal className="h-full" delay={0.24}>
              <Link href="/docencia" className={linkCardClass}>
                <span className={valueClass}>{last.value}</span>
                <span className={labelClass}>{last.label}</span>
              </Link>
            </Reveal>
          </li>
        )}
      </ul>
    </section>
  )
}
