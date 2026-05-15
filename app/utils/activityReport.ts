// ============================================================
// FODAF — Generación del reporte PDF de una actividad cerrada
// ============================================================
// Construido con jsPDF + jspdf-autotable. Una sola página A4 si
// hay pocas filas, paginado automático si hay muchas (autoTable
// se encarga de cortar tablas entre páginas).
//
// El reporte se exporta desde el detalle de la actividad cuando
// está en estado `finished` y el usuario es admin o miembro del
// comité — ver `canExport` en `/actividades/[id].vue`.
// ============================================================

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ---- Tipos del payload ----

export interface ActivityReportData {
  activity: {
    name: string
    activity_date: string
    start_at: string | null
    finished_at: string | null
    team_name: string | null
  }
  expenses: {
    description: string
    amount: number
  }[]
  products: {
    name: string
    cost_price: number
    selling_price: number
    stock_quantity: number
    sold: number
    available: number
  }[]
  sales: {
    product_name: string
    quantity: number
    buyer_label: string
    seller_label: string
    total_price: number
  }[]
}

// ---- Paleta (espejo del CSS de la app, fondo blanco para impresión) ----
const COLORS = {
  emerald: [5, 150, 105] as const,
  emeraldLight: [209, 250, 229] as const,
  gray900: [17, 24, 39] as const,
  gray700: [55, 65, 81] as const,
  gray500: [107, 114, 128] as const,
  gray300: [209, 213, 219] as const,
  gray100: [243, 244, 246] as const,
  red: [220, 38, 38] as const,
  blue: [37, 99, 235] as const,
}

const PAGE_MARGIN = 40

/**
 * Construye y descarga el reporte PDF de la actividad. El
 * nombre del archivo se deriva del nombre de la actividad.
 */
export function exportActivityReportPdf(data: ActivityReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  drawHeader(doc, data, pageWidth)
  let cursorY = drawMetadata(doc, data, pageWidth, 130)
  cursorY = drawFinancialSummary(doc, data, pageWidth, cursorY + 16)
  cursorY = drawExpensesTable(doc, data, cursorY + 24)
  cursorY = drawInventoryTable(doc, data, cursorY + 16)
  cursorY = drawSalesTable(doc, data, cursorY + 16)
  drawFooter(doc, pageWidth)

  const filename = `FODAF-${slugify(data.activity.name)}.pdf`

  // Abrimos el PDF en una nueva pestaña en vez de forzar
  // descarga. Razón: Chrome Safe Browsing marca como sospechosas
  // las descargas que vienen de hostnames HTTP no-localhost
  // (ej. `fodaf.development`), las deja como `.crdownload` y
  // les pone nombre aleatorio. Mostrando el PDF en el visor del
  // navegador el usuario lo guarda con Ctrl+S o el ícono del
  // visor, evitando esa heurística.
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)

  // Le damos un nombre al recurso vía hash (algunos visores lo
  // usan al sugerir el nombre del archivo en "Guardar como").
  const win = window.open(`${url}#${encodeURIComponent(filename)}`, '_blank', 'noopener')
  if (!win) {
    // Pop-up bloqueado: caemos a descarga directa con anchor.
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Liberamos la URL del Blob después de que el visor / descarga
  // haya tenido tiempo de leer el contenido.
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

// ---- Cabecera: banner emerald con título y nombre de actividad ----
function drawHeader(doc: jsPDF, data: ActivityReportData, pageWidth: number) {
  doc.setFillColor(...COLORS.emerald)
  doc.rect(0, 0, pageWidth, 100, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('FODAF · Fondo de Ahorro Familiar', PAGE_MARGIN, 32)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Reporte de Actividad', PAGE_MARGIN, 56)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  const name = truncate(doc, data.activity.name, pageWidth - PAGE_MARGIN * 2)
  doc.text(name, PAGE_MARGIN, 80)
}

// ---- Metadatos: fecha de inicio, comité, fecha de cierre ----
function drawMetadata(doc: jsPDF, data: ActivityReportData, pageWidth: number, y: number): number {
  doc.setTextColor(...COLORS.gray700)
  doc.setFontSize(10)

  const startLabel = data.activity.start_at
    ? formatDatetimeLocal(data.activity.start_at)
    : formatDateLocal(data.activity.activity_date)

  const lines: { label: string; value: string }[] = [
    { label: 'Fecha del evento', value: startLabel },
    { label: 'Comité responsable', value: data.activity.team_name ?? 'Sin comité' },
  ]
  if (data.activity.finished_at) {
    lines.push({ label: 'Cerrada el', value: formatDatetimeLocal(data.activity.finished_at) })
  }

  for (const line of lines) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${line.label}:`, PAGE_MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.text(line.value, PAGE_MARGIN + 110, y)
    y += 16
  }

  return y
}

// ---- Resumen financiero: 3 cards horizontales ----
function drawFinancialSummary(doc: jsPDF, data: ActivityReportData, pageWidth: number, y: number): number {
  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0)
  const inventoryCost = data.products.reduce((s, p) => s + p.cost_price * p.stock_quantity, 0)
  const totalCosts = totalExpenses + inventoryCost
  const grossIncome = data.sales.reduce((s, sale) => s + sale.total_price, 0)
  const netProfit = grossIncome - totalCosts

  const cardW = (pageWidth - PAGE_MARGIN * 2 - 16) / 3
  const cardH = 70
  const x0 = PAGE_MARGIN
  const x1 = x0 + cardW + 8
  const x2 = x1 + cardW + 8

  drawSummaryCard(doc, x0, y, cardW, cardH, 'Costos Totales', formatCOPLocal(totalCosts), COLORS.gray900)
  drawSummaryCard(doc, x1, y, cardW, cardH, 'Ingresos Brutos', formatCOPLocal(grossIncome), COLORS.blue)
  drawSummaryCard(
    doc, x2, y, cardW, cardH,
    'Ganancia Neta',
    formatCOPLocal(netProfit),
    netProfit >= 0 ? COLORS.emerald : COLORS.red,
  )

  // Sub-línea con desglose de costos
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.gray500)
  doc.text(
    `Desglose de costos: gastos ${formatCOPLocal(totalExpenses)} · inventario ${formatCOPLocal(inventoryCost)}`,
    PAGE_MARGIN, y + cardH + 14,
  )

  return y + cardH + 14
}

function drawSummaryCard(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  label: string, value: string, valueColor: readonly [number, number, number],
) {
  doc.setDrawColor(...COLORS.gray300)
  doc.setFillColor(...COLORS.gray100)
  doc.roundedRect(x, y, w, h, 6, 6, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.gray500)
  doc.text(label.toUpperCase(), x + 12, y + 18)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...valueColor)
  doc.text(value, x + 12, y + 44)
}

// ---- Tabla de gastos ----
function drawExpensesTable(doc: jsPDF, data: ActivityReportData, y: number): number {
  drawSectionTitle(doc, `Gastos Generales (${data.expenses.length})`, y)
  const startY = y + 16

  if (data.expenses.length === 0) {
    drawEmptyRow(doc, 'No se registraron gastos.', startY)
    return startY + 24
  }

  autoTable(doc, {
    startY,
    head: [['Descripción', 'Monto']],
    body: data.expenses.map(e => [e.description, formatCOPLocal(e.amount)]),
    ...tableStyles(),
    columnStyles: {
      1: { halign: 'right', cellWidth: 110 },
    },
  })
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
}

// ---- Tabla de inventario ----
function drawInventoryTable(doc: jsPDF, data: ActivityReportData, y: number): number {
  drawSectionTitle(doc, `Inventario (${data.products.length})`, y)
  const startY = y + 16

  if (data.products.length === 0) {
    drawEmptyRow(doc, 'No se registraron productos.', startY)
    return startY + 24
  }

  autoTable(doc, {
    startY,
    head: [['Producto', 'Costo', 'Venta', 'Stock', 'Vendidas', 'Disponible']],
    body: data.products.map(p => [
      p.name,
      formatCOPLocal(p.cost_price),
      formatCOPLocal(p.selling_price),
      String(p.stock_quantity),
      String(p.sold),
      String(p.available),
    ]),
    ...tableStyles(),
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  })
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
}

// ---- Tabla de ventas ----
function drawSalesTable(doc: jsPDF, data: ActivityReportData, y: number): number {
  drawSectionTitle(doc, `Ventas Registradas (${data.sales.length})`, y)
  const startY = y + 16

  if (data.sales.length === 0) {
    drawEmptyRow(doc, 'No se registraron ventas.', startY)
    return startY + 24
  }

  autoTable(doc, {
    startY,
    head: [['Producto', 'Cant.', 'Comprador', 'Vendedor', 'Total']],
    body: data.sales.map(s => [
      s.product_name,
      String(s.quantity),
      s.buyer_label,
      s.seller_label,
      formatCOPLocal(s.total_price),
    ]),
    ...tableStyles(),
    columnStyles: {
      1: { halign: 'right', cellWidth: 40 },
      4: { halign: 'right', cellWidth: 80 },
    },
  })
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
}

// ---- Helpers de dibujo ----
function drawSectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.gray900)
  doc.text(text, PAGE_MARGIN, y)
}

function drawEmptyRow(doc: jsPDF, text: string, y: number) {
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.gray500)
  doc.text(text, PAGE_MARGIN, y + 12)
}

function drawFooter(doc: jsPDF, pageWidth: number) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.gray500)
    doc.text(`Generado el ${formatDatetimeLocal(new Date().toISOString())}`, PAGE_MARGIN, pageHeight - 20)
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - PAGE_MARGIN, pageHeight - 20, { align: 'right' })
  }
}

function tableStyles() {
  return {
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    styles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: COLORS.gray700 as unknown as number[],
      lineColor: COLORS.gray300 as unknown as number[],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: COLORS.emerald as unknown as number[],
      textColor: [255, 255, 255] as number[],
      fontStyle: 'bold' as const,
    },
    alternateRowStyles: {
      fillColor: COLORS.gray100 as unknown as number[],
    },
  }
}

// ---- Locales (jsPDF no integra Intl.NumberFormat con tipografía) ----
function formatCOPLocal(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDateLocal(dateStr: string): string {
  const date = dateStr.length === 10 ? new Date(dateStr + 'T12:00:00') : new Date(dateStr)
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDatetimeLocal(isoStr: string): string {
  return new Date(isoStr).toLocaleString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ---- Util de nombre de archivo ----
function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'actividad'
}

// Trunca un texto para que quepa en un ancho máximo dentro del PDF.
function truncate(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text
  let truncated = text
  while (truncated.length > 0 && doc.getTextWidth(truncated + '…') > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return truncated + '…'
}
