export async function printInvoice({ order, items, business }) {
  try {
    const isFactura = String(order?.status || '').toLowerCase() === 'paid'
    const titulo = isFactura ? 'Factura' : 'Oferta'
    const fmt = (n) => (Number(n || 0)).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    
    const rows = items.map((i, idx) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${idx + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${i.product_name || ''}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i.qty || 0}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${fmt(i.unit_price)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${fmt(i.line_total)}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titulo} #${order.number || '—'}</title><style>body { font-family: sans-serif; padding: 40px; color: #333; }.header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; }table { width: 100%; border-collapse: collapse; margin-top: 30px; }th { background: #f4f4f4; padding: 10px; border: 1px solid #ddd; text-align: left; }.totals { margin-top: 30px; text-align: right; font-size: 18px; }@media print { .no-print { display: none; } }</style></head><body><div class="header"><div><h1 style="margin:0">${business.name}</h1><p style="margin:5px 0">${business.address}<br>Tel: ${business.phone}</p></div><div style="text-align: right"><h2 style="margin:0">${titulo} #${order.number || '—'}</h2><p>Fecha: ${new Date(order.created_at).toLocaleString()}</p></div></div><div style="margin-top: 20px;"><strong>CLIENTE:</strong> ${order.customer_name || 'N/A'}</div><table><thead><tr><th>#</th><th>Producto</th><th>Cant</th><th>Precio</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><p>Subtotal: ${business.currency} ${fmt(order.subtotal)}</p><p>Impuestos: ${business.currency} ${fmt(order.tax_total)}</p><h2 style="margin:0">TOTAL: ${business.currency} ${fmt(order.total)}</h2></div><div class="no-print" style="margin-top: 40px; text-align: center;"><button type="button" onclick="window.print(); return false;" style="padding: 15px 30px; font-size: 18px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 5px;">🖨️ CONFIRMAR IMPRESIÓN</button></div></body></html>`
    
    // Abrir ventana con about:blank (no recarga la página principal)
    const win = window.open('about:blank', '_blank', 'width=800,height=600,toolbar=no,menubar=no,location=no')
    if (!win) { 
      alert('Permite las ventanas emergentes para imprimir.')
      return Promise.resolve() 
    }
    
    // Escribir el contenido en la nueva ventana
    win.document.open()
    win.document.write(html)
    win.document.close()
    
    // Prevenir que la ventana principal navegue
    return Promise.resolve()
    
    return Promise.resolve()
  } catch (error) {
    console.error('Error en printInvoice:', error)
    alert('Error al generar la impresión: ' + error.message)
    return Promise.reject(error)
  }
}

