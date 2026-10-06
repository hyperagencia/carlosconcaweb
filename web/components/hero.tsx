import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Reveal } from './reveal'

export async function Hero({
  name,
  affiliation,
}: {
  name: string
  affiliation: string
}) {
  const t = await getTranslations('Hero')

  return (
    <section
      data-nav-tone="light"
      className="flex min-h-svh px-[var(--gutter)] pt-[calc(var(--nav-h)+1rem)] pb-[clamp(1rem,2vw,1.5rem)]"
    >
      <div className="grid w-full flex-1 grid-cols-1 gap-[clamp(1rem,1.5vw,1.5rem)] lg:grid-cols-2">
        <div className="relative min-h-[22rem] overflow-hidden rounded-card">
          <Image
            src="/images/carlos-conca-background.jpg"
            alt={t('photoAlt')}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-between gap-12 rounded-card bg-panel p-[clamp(1.5rem,4vw,4.5rem)]">
          <Reveal delay={0.1}>
            <Image
              src="/logos/logo-fcfm-2.png"
              alt={t('facultyAlt')}
              width={927}
              height={170}
              className="h-auto w-[clamp(15rem,28vw,26rem)]"
            />
          </Reveal>

          <Reveal fade={false}>
            <h1 className="text-[clamp(2.75rem,5.2vw,5rem)] leading-[1.05] font-semibold tracking-tight">
              {name}
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="max-w-[34ch] text-[clamp(1rem,1.5vw,1.5rem)] leading-snug font-normal">
              {affiliation}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
