export interface CrochetSymbol {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
}

export const crochetSymbols: CrochetSymbol[] = [
  {
    id: 'chain',
    name: 'Chain Stitch',
    abbreviation: 'ch',
    description: 'Chain stitch - foundation stitch',
  },
  {
    id: 'sc',
    name: 'Single Crochet',
    abbreviation: 'sc',
    description: 'Single crochet stitch',
  },
  {
    id: 'dc',
    name: 'Double Crochet',
    abbreviation: 'dc',
    description: 'Double crochet stitch',
  },
  {
    id: 'tr',
    name: 'Treble Crochet',
    abbreviation: 'tr',
    description: 'Treble crochet stitch',
  },
  {
    id: 'sl',
    name: 'Slip Stitch',
    abbreviation: 'sl st',
    description: 'Slip stitch',
  },
  {
    id: 'yo',
    name: 'Yarn Over',
    abbreviation: 'yo',
    description: 'Yarn over',
  },
];

export function drawCrochetSymbol(
  ctx: CanvasRenderingContext2D,
  symbolId: string,
  x: number,
  y: number,
  color: string = '#000000',
  size: number = 20
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  const centerX = x + size / 2;
  const centerY = y + size / 2;

  switch (symbolId) {
    case 'chain':
      // Draw oval for chain stitch
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, size * 0.3, size * 0.15, 0, 0, 2 * Math.PI);
      ctx.stroke();
      break;

    case 'sc':
      // Draw vertical line for single crochet
      ctx.beginPath();
      ctx.moveTo(centerX, y + size * 0.2);
      ctx.lineTo(centerX, y + size * 0.8);
      ctx.stroke();
      break;

    case 'dc':
      // Draw vertical line with one horizontal line for double crochet
      ctx.beginPath();
      ctx.moveTo(centerX, y + size * 0.1);
      ctx.lineTo(centerX, y + size * 0.9);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(centerX, y + size * 0.3);
      ctx.lineTo(centerX + size * 0.3, y + size * 0.2);
      ctx.stroke();
      break;

    case 'tr':
      // Draw vertical line with two horizontal lines for treble crochet
      ctx.beginPath();
      ctx.moveTo(centerX, y + size * 0.1);
      ctx.lineTo(centerX, y + size * 0.9);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(centerX, y + size * 0.25);
      ctx.lineTo(centerX + size * 0.3, y + size * 0.15);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(centerX, y + size * 0.45);
      ctx.lineTo(centerX + size * 0.3, y + size * 0.35);
      ctx.stroke();
      break;

    case 'sl':
      // Draw horizontal line for slip stitch
      ctx.beginPath();
      ctx.moveTo(x + size * 0.2, centerY);
      ctx.lineTo(x + size * 0.8, centerY);
      ctx.stroke();
      break;

    case 'yo':
      // Draw circle for yarn over
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.25, 0, 2 * Math.PI);
      ctx.stroke();
      break;

    default:
      // Draw a small dot for unknown symbols
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
      ctx.fill();
      break;
  }

  ctx.restore();
}

export function getSymbolById(id: string): CrochetSymbol | undefined {
  return crochetSymbols.find(symbol => symbol.id === id);
}
