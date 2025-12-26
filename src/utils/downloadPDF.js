import { useToastStore } from '../stores/toastStore'
import jsPDF from 'jspdf'

export async function downloadInvoicePDF({ order, items, business }) {
  const toastStore = useToastStore()
  try {
    const isFactura = String(order?.status || '').toLowerCase() === 'paid'
    const titulo = isFactura ? 'Factura' : 'Oferta'
    const fmt = (n) => (Number(n || 0)).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    
    // Crear nuevo PDF (A4 size)
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // Configurar fuente
    pdf.setFont('helvetica')
    
    // Header - Información del negocio
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text(business.name, 20, 20)
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(business.address, 20, 28)
    pdf.text(`Tel: ${business.phone}`, 20, 33)
    
    // Información de la factura/oferta (derecha)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${titulo} #${order.number || '—'}`, 140, 20)
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    const fecha = new Date(order.created_at).toLocaleDateString('es-NI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    pdf.text(`Fecha: ${fecha}`, 140, 28)
    
    // Línea separadora
    pdf.setLineWidth(0.5)
    pdf.line(20, 40, 190, 40)
    
    // Información del cliente
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('CLIENTE:', 20, 50)
    pdf.setFont('helvetica', 'normal')
    pdf.text(order.customer_name || 'N/A', 45, 50)
    
    if (order.customer_phone) {
      pdf.text(`Tel: ${order.customer_phone}`, 45, 56)
    }
    
    // Tabla de productos
    let yPos = 70
    
    // Encabezados de tabla
    pdf.setFillColor(240, 240, 240)
    pdf.rect(20, yPos, 170, 8, 'F')
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('#', 22, yPos + 5)
    pdf.text('Producto', 32, yPos + 5)
    pdf.text('Cant.', 115, yPos + 5)
    pdf.text('Precio', 135, yPos + 5)
    pdf.text('Total', 165, yPos + 5)
    
    yPos += 10
    pdf.setFont('helvetica', 'normal')
    
    // Filas de productos
    items.forEach((item, idx) => {
      // Verificar si necesitamos nueva página
      if (yPos > 250) {
        pdf.addPage()
        yPos = 20
      }
      
      pdf.text(`${idx + 1}`, 22, yPos)
      
      // Producto (con wrap si es muy largo)
      const productName = item.product_name || ''
      if (productName.length > 50) {
        pdf.text(productName.substring(0, 47) + '...', 32, yPos)
      } else {
        pdf.text(productName, 32, yPos)
      }
      
      pdf.text(`${item.qty || 0}`, 118, yPos)
      pdf.text(`${fmt(item.unit_price)}`, 135, yPos)
      pdf.text(`${fmt(item.line_total)}`, 165, yPos)
      
      yPos += 7
    })
    
    // Línea antes de totales
    yPos += 5
    pdf.setLineWidth(0.3)
    pdf.line(120, yPos, 190, yPos)
    
    // Totales
    yPos += 8
    pdf.setFontSize(10)
    pdf.text('Subtotal:', 130, yPos)
    pdf.text(`${business.currency} ${fmt(order.subtotal)}`, 165, yPos, { align: 'right' })
    
    yPos += 6
    pdf.text('Impuestos:', 130, yPos)
    pdf.text(`${business.currency} ${fmt(order.tax_total)}`, 165, yPos, { align: 'right' })
    
    yPos += 8
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('TOTAL:', 130, yPos)
    pdf.text(`${business.currency} ${fmt(order.total)}`, 165, yPos, { align: 'right' })
    
    // Notas (si existen)
    if (order.notes) {
      yPos += 15
      if (yPos > 250) {
        pdf.addPage()
        yPos = 20
      }
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Notas:', 20, yPos)
      pdf.setFont('helvetica', 'normal')
      yPos += 6
      const lines = pdf.splitTextToSize(order.notes, 170)
      pdf.text(lines, 20, yPos)
    }
    
    // Pie de página
    const pageCount = pdf.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(150, 150, 150)
      pdf.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' })
      pdf.text(`Generado el ${new Date().toLocaleString('es-NI')}`, 105, 290, { align: 'center' })
    }
    
    // Descargar PDF
    const fileName = `${titulo}_${order.number || 'SIN_NUMERO'}_${order.customer_name?.replace(/\s+/g, '_') || 'cliente'}.pdf`
    pdf.save(fileName)
    
    return Promise.resolve()
  } catch (error) {
    console.error('Error al generar PDF:', error)
    toastStore.showError('Error PDF', error.message)
    return Promise.reject(error)
  }
}

