import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  href?: string
  className?: string
}

const sizes = {
  sm: { image: 28, text: "text-lg" },
  md: { image: 36, text: "text-xl" },
  lg: { image: 48, text: "text-2xl" },
}

export function Logo({ size = "md", showText = true, href, className = "" }: LogoProps) {
  const { image, text } = sizes[size]

  const content = (
    <span className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Travelr"
        width={image}
        height={image}
        className="rounded-lg"
        priority
      />
      {showText && (
        <span className={`${text} font-semibold tracking-tight`}>Travelr</span>
      )}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}
