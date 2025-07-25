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
  {
    id: '2dctog',
    name: '2 Double Crochet Together',
    abbreviation: '2dc tog',
    description: 'Two double crochet stitches worked together (decrease)',
  },
  {
    id: '3dctog',
    name: '3 Double Crochet Together',
    abbreviation: '3dc tog',
    description: 'Three double crochet stitches worked together (decrease)',
  },
];

export function drawCrochetSymbol(
  ctx: CanvasRenderingContext2D,
  symbolId: string,
  x: number,
  y: number,
  color: string = '#000000',
  size: number = 20,
  mirrored: boolean = false
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  const centerX = x;
  const centerY = y;

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

    case '2dctog':
      // 2 DC together - looks like 1sc joined with 1dc
      ctx.beginPath();
      if (mirrored) {
        // Mirrored: DC on left, SC on right, converging at left side
        // Left part: double crochet (full vertical line with cross)
        ctx.moveTo(centerX - size * 0.8, y + size * 0.9);
        ctx.lineTo(centerX - size * 0.8, y + size * 0.1);
        // Right part: single crochet (shorter vertical line)
        ctx.moveTo(centerX + size * 0.8, y + size * 0.9);
        ctx.lineTo(centerX + size * 0.8, y + size * 0.5);
        ctx.lineTo(centerX - size * 0.8, y + size * 0.1);
        // Cross line on the DC part only
        ctx.moveTo(centerX - size * 0.8, y + size * 0.5);
        ctx.lineTo(centerX - size * 0.5, y + size * 0.4);
      } else {
        // Normal: SC on left, DC on right, converging at right side
        // Left part: single crochet (shorter vertical line)
        ctx.moveTo(centerX - size * 0.8, y + size * 0.9);
        ctx.lineTo(centerX - size * 0.8, y + size * 0.5);
        ctx.lineTo(centerX + size * 0.8, y + size * 0.1);
        // Right part: double crochet (full vertical line with cross)
        ctx.moveTo(centerX + size * 0.8, y + size * 0.9);
        ctx.lineTo(centerX + size * 0.8, y + size * 0.1);
        // Cross line on the DC part only
        ctx.moveTo(centerX + size * 0.5, y + size * 0.4);
        ctx.lineTo(centerX + size * 0.8, y + size * 0.5);
      }
      ctx.stroke();
      break;

    case '3dctog':
      // 3 DC together - looks like 2sc joined with 1dc
      ctx.beginPath();
      if (mirrored) {
        // Mirrored: DC on left, 2SC on right, converging at left side
        // Left part: double crochet (full vertical line with cross)
        ctx.moveTo(centerX - size * 1.2, y + size * 0.9);
        ctx.lineTo(centerX - size * 1.2, y + size * 0.1);
        // Middle part: single crochet (shorter vertical line)
        ctx.moveTo(centerX, y + size * 0.9);
        ctx.lineTo(centerX, y + size * 0.5);
        ctx.lineTo(centerX - size * 1.2, y + size * 0.1);
        // Right part: single crochet (shorter vertical line)
        ctx.moveTo(centerX + size * 1.2, y + size * 0.9);
        ctx.lineTo(centerX + size * 1.2, y + size * 0.5);
        ctx.lineTo(centerX - size * 1.2, y + size * 0.1);
        // Cross line on the DC part only
        ctx.moveTo(centerX - size * 1.2, y + size * 0.5);
        ctx.lineTo(centerX - size * 0.9, y + size * 0.4);
      } else {
        // Normal: 2SC on left, DC on right, converging at right side
        // Left part: single crochet (shorter vertical line)
        ctx.moveTo(centerX - size * 1.2, y + size * 0.9);
        ctx.lineTo(centerX - size * 1.2, y + size * 0.5);
        ctx.lineTo(centerX + size * 1.2, y + size * 0.1);
        // Middle part: single crochet (shorter vertical line)
        ctx.moveTo(centerX, y + size * 0.9);
        ctx.lineTo(centerX, y + size * 0.5);
        ctx.lineTo(centerX + size * 1.2, y + size * 0.1);
        // Right part: double crochet (full vertical line with cross)
        ctx.moveTo(centerX + size * 1.2, y + size * 0.9);
        ctx.lineTo(centerX + size * 1.2, y + size * 0.1);
        // Cross line on the DC part only
        ctx.moveTo(centerX + size * 0.9, y + size * 0.4);
        ctx.lineTo(centerX + size * 1.2, y + size * 0.5);
      }
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

// Render a small version of the symbol for toolbar buttons
export function renderSymbolForButton(symbolId: string): string {
  // Create a temporary canvas for rendering
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '•';
  
  // Use a smaller size for button display
  drawCrochetSymbol(ctx, symbolId, 12, 12, '#374151', 12);
  
  // Convert to data URL and return as image
  return canvas.toDataURL();
}

// Get the width of a symbol in grid cells (for multi-cell symbols)
export function getSymbolWidth(symbolId: string): number {
  switch (symbolId) {
    case '2dctog':
      return 2;
    case '3dctog':
      return 3;
    default:
      return 1;
  }
}
