import Image from 'next/image'

interface ChoirLogoProps {
  className?: string
}

export function ChoirLogo({ className }: ChoirLogoProps) {
  return (
    <Image
      src="/images/brand/grow-in-jesus-choir-logo.gif"
      alt="Grow in Jesus Choir"
      width={600}
      height={600}
      unoptimized
      className={className}
    />
  )
}
