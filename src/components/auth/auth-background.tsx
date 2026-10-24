import { cn } from '@/lib/utils';
import styles from './auth-background.module.css';

interface AuthBackgroundProps {
  className?: string;
}

/** Decorative hardware drawings for authentication and public informational pages. */
export function AuthBackground({ className }: AuthBackgroundProps = {}) {
  return (
    <div className={cn(styles.background, className)} aria-hidden="true">
      <div className={styles.grid} />

      <svg className={styles.motherboard} viewBox="0 0 460 560" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
          <rect x="55" y="32" width="350" height="496" rx="12" />
          <rect x="78" y="55" width="304" height="450" rx="5" />
          <path d="M55 102h-24v42h24m0 40H31v42h24m0 42H31v42h24M405 106h23v55h-23m0 46h23v55h-23M120 32V12h42v20m40 0V12h42v20m40 0V12h42v20" />
          <rect x="116" y="112" width="132" height="132" rx="8" />
          <rect x="130" y="126" width="104" height="104" rx="3" />
          <rect x="148" y="144" width="68" height="68" rx="2" />
          <path d="M132 101V81m20 20V81m20 20V81m20 20V81m20 20V81m20 20V81M132 254v20m20-20v20m20-20v20m20-20v20m20-20v20m20-20v20M105 128H85m20 20H85m20 20H85m20 20H85m20 20H85m20 20H85m173-100h-20m20 20h-20m20 20h-20m20 20h-20m20 20h-20m20 20h-20" />
          <rect x="272" y="104" width="14" height="177" rx="2" />
          <rect x="296" y="104" width="14" height="177" rx="2" />
          <rect x="320" y="104" width="14" height="177" rx="2" />
          <rect x="344" y="104" width="14" height="177" rx="2" />
          <path d="M279 116v150m24-150v150m24-150v150m24-150v150" />
          <rect x="106" y="310" width="110" height="72" rx="5" />
          <path d="M120 323h82v46h-82zM133 335h56m-56 11h56m-56 11h56" />
          <rect x="242" y="312" width="116" height="17" rx="2" />
          <rect x="242" y="342" width="116" height="17" rx="2" />
          <rect x="242" y="372" width="91" height="17" rx="2" />
          <rect x="102" y="410" width="256" height="29" rx="3" />
          <path d="M116 418h225m-225 8h225m-225 8h225M105 463h62m16 0h74m16 0h70" />
          <circle cx="88" cy="75" r="5" /><circle cx="372" cy="75" r="5" />
          <circle cx="88" cy="482" r="5" /><circle cx="372" cy="482" r="5" />
          <path d="M80 295h19l16-16h68m-97 11h16l20-20h58m38 8h29l13 13h92m-143-17h37l21 22h59M87 394h43l12-12m206 16h-19l-12-14M106 452H91l-18-18v-72m279-72h18l16-16v-66" />
        </g>
      </svg>

      <svg className={styles.gpu} viewBox="0 0 600 390" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M71 77h464l27 23v213l-27 22H71l-18-19V96z" />
          <path d="M72 94h448l23 18v190l-23 17H72zM53 112H25v181h28m-28-169H8m17 31H8m17 31H8m17 31H8m17 31H8m17 31H8" />
          <path d="M113 335v25h269v-25m-238 25v13h21v-13m30 0v13h21v-13m30 0v13h21v-13m30 0v13h21v-13" />
          <rect x="450" y="55" width="47" height="22" rx="2" />
          <rect x="504" y="55" width="31" height="22" rx="2" />
          <path d="M458 55V42h30v13m24 0V42h15v13M78 115h24m-24 20h24m-24 20h24m388 140h23m-23-20h23m-23-20h23" />
          <circle cx="209" cy="205" r="91" /><circle cx="209" cy="205" r="70" /><circle cx="209" cy="205" r="24" />
          <circle cx="413" cy="205" r="91" /><circle cx="413" cy="205" r="70" /><circle cx="413" cy="205" r="24" />
          <path d="M207 181c-11-33-4-48 18-58 3 27 1 44-5 59m13 15c29-19 45-17 60-1-24 15-42 21-58 22m-8 8c22 28 22 44 7 61-17-22-25-40-29-55m-12-6c-28 23-44 23-61 8 22-18 39-26 55-31m6-12c-24-25-25-42-12-60 19 20 28 37 34 52" />
          <path d="M411 181c-11-33-4-48 18-58 3 27 1 44-5 59m13 15c29-19 45-17 60-1-24 15-42 21-58 22m-8 8c22 28 22 44 7 61-17-22-25-40-29-55m-12-6c-28 23-44 23-61 8 22-18 39-26 55-31m6-12c-24-25-25-42-12-60 19 20 28 37 34 52" />
          <path d="M104 83l30-23h91m19 0h122m20 0h42M107 323l22 22m366-22 22 22M117 104h49m113 0h61m114 0h52" />
          <circle cx="81" cy="105" r="4" /><circle cx="81" cy="308" r="4" />
          <circle cx="532" cy="105" r="4" /><circle cx="532" cy="308" r="4" />
        </g>
      </svg>
    </div>
  );
}
