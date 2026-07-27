"use client";

// QR code ilustrativo (determinístico pelo id, sem libs).
// Será substituído pelo QR real do PSP quando a API de PIX entrar.
function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const SIZE = 25;
const CELL = 8;

export default function FakeQr({ seed }: { seed: string }) {
  const rand = seededRandom(seed);
  const cells: boolean[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => rand() > 0.52)
  );

  // Padrões de localização (cantos)
  function finder(x: number, y: number) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const border = i === 0 || i === 6 || j === 0 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        cells[y + j][x + i] = border || core;
      }
    }
    // margem branca ao redor
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const inFinder = i >= 0 && i <= 6 && j >= 0 && j <= 6;
        const yy = y + j;
        const xx = x + i;
        if (!inFinder && yy >= 0 && yy < SIZE && xx >= 0 && xx < SIZE) {
          cells[yy][xx] = false;
        }
      }
    }
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const border = i === 0 || i === 6 || j === 0 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        cells[y + j][x + i] = border || core;
      }
    }
  }
  finder(0, 0);
  finder(SIZE - 7, 0);
  finder(0, SIZE - 7);

  return (
    <svg
      viewBox={`0 0 ${SIZE * CELL} ${SIZE * CELL}`}
      className="h-full w-full"
      role="img"
      aria-label="QR Code PIX (exemplo)"
    >
      <rect width={SIZE * CELL} height={SIZE * CELL} fill="#ffffff" />
      {cells.flatMap((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x * CELL}
              y={y * CELL}
              width={CELL}
              height={CELL}
              fill="#0a0a0b"
            />
          ) : null
        )
      )}
    </svg>
  );
}
