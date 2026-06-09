type IconProps = {
  readonly size?: number;
  readonly className?: string;
};

function DocsIcon({ size = 14, className }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 2.8c0-.72.58-1.3 1.3-1.3H13v11H4.2A1.7 1.7 0 0 0 2.5 14.2V3.3c0-.28.22-.5.5-.5Z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.2 4.5h5.2M5.2 7h4.2"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
      />
    </svg>
  );
}

function SdkIcon({ size = 14, className }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5M9 3l-2 10"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GithubIcon({ size = 14, className }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.88 2.34.67.07-.52.28-.88.51-1.08-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

function TelegramIcon({ size = 14, className }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M14.6 2.07a.6.6 0 0 0-.61-.1L1.5 6.83a.55.55 0 0 0 .03 1.04l3.05 1 1.18 3.82a.5.5 0 0 0 .85.18l1.7-1.85 3.16 2.32a.6.6 0 0 0 .94-.36l2.27-9.97a.6.6 0 0 0-.08-.5zm-3.21 2.4-5.4 4.85a.4.4 0 0 0-.13.22L5.5 11.1l-.78-2.55 6.67-4.08z" />
    </svg>
  );
}

function XIcon({ size = 13, className }: IconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.27 1.5h2.3l-5.03 5.74L15.5 14.5h-4.63L7.24 9.78 3.1 14.5H.79l5.38-6.14L.5 1.5h4.75l3.27 4.32L12.27 1.5zm-.81 11.62h1.27L4.6 2.81H3.24l8.22 10.31z" />
    </svg>
  );
}

type FooterLink = {
  readonly label: string;
  readonly href: string;
  readonly icon: React.JSX.Element;
};

const FOOTER_LINKS: readonly FooterLink[] = [
  {
    label: 'Docs',
    href: 'https://docs.miradex.io',
    icon: <DocsIcon />,
  },
  {
    label: 'SDK',
    href: 'https://github.com/miradexio/miradex-client',
    icon: <SdkIcon />,
  },
  {
    label: 'Open Source',
    href: 'https://github.com/miradexio/web',
    icon: <GithubIcon />,
  },
  {
    label: 'Telegram',
    href: 'https://t.me/miradexio',
    icon: <TelegramIcon />,
  },
  {
    label: 'X',
    href: 'https://x.com/MiraDex',
    icon: <XIcon />,
  },
];

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="absolute inset-x-0 bottom-0 z-20">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-4 md:px-10 lg:-translate-x-10 xl:-translate-x-16">
        <nav
          aria-label="Footer"
          className="mx-auto flex w-full max-w-[480px] items-center justify-start gap-x-7 sm:gap-x-9 lg:max-w-none lg:pl-[348px]"
        >
          {FOOTER_LINKS.map(({ label, href, icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-[13px] tracking-wide text-black/80 transition-colors duration-200 hover:text-black"
            >
              <span className="text-black/70 transition-colors duration-200 group-hover:text-black">
                {icon}
              </span>
              <span>{label}</span>
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
