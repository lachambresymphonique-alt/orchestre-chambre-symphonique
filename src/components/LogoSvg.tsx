export function LogoSvg({ color = "#C9A84C" }: { color?: string }) {
  return (
    <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 5 C25 5 35 15 35 28 C35 35 30 40 25 42 C20 40 15 35 15 28 C15 15 25 5 25 5Z" stroke={color} strokeWidth="1.5" fill="none"/>
      <line x1="25" y1="18" x2="25" y2="45" stroke={color} strokeWidth="1.5"/>
      <circle cx="22" cy="45" r="3" stroke={color} strokeWidth="1.5" fill="none"/>
      <line x1="18" y1="24" x2="32" y2="24" stroke={color} strokeWidth="0.8" opacity="0.5"/>
      <line x1="18" y1="28" x2="32" y2="28" stroke={color} strokeWidth="0.8" opacity="0.5"/>
      <line x1="18" y1="32" x2="32" y2="32" stroke={color} strokeWidth="0.8" opacity="0.5"/>
    </svg>
  );
}
