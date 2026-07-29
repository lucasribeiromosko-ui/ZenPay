/* eslint-disable @next/next/no-img-element */

// Logo oficial da ZenPay. Usa os arquivos otimizados em /public.
// - "mark": ícone quadrado (tile), para cabeçalhos com pouco espaço
// - "full": wordmark horizontal, para logins e telas de destaque

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/zenpay-icon.png"
      alt="ZenPay"
      className={className ?? "h-9 w-9 rounded-xl object-cover"}
      draggable={false}
    />
  );
}

export function LogoFull({ className }: { className?: string }) {
  return (
    <img
      src="/zenpay-wordmark.png"
      alt="ZenPay"
      className={className ?? "h-9 w-auto rounded-lg object-contain"}
      draggable={false}
    />
  );
}
