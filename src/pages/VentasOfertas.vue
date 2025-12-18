<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header con gradiente -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Ofertas y Ventas</h1>
          <p class="text-indigo-100">Gestiona tus cotizaciones y facturas</p>
        </div>
        <Button 
          type="button" 
          label="Crear Oferta" 
          icon="pi pi-plus" 
          @click.prevent="createOffer"
          class="bg-white text-indigo-600 hover:bg-indigo-50 border-0 shadow-lg"
          size="large"
        />
      </div>
    </div>

    <!-- Historial de Ofertas -->
    <div class="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
      <DataTable 
        :value="offers" 
        :loading="isLoading" 
        stripedRows 
        responsiveLayout="stack" 
        @row-click="onRowClick"
        :rowClass="() => 'cursor-pointer'"
        class="modern-table"
      >
      <Column field="number" header="#">
        <template #body="{ data }">{{ data.number ?? '—' }}</template>
      </Column>
      <Column field="customer_name" header="Cliente"></Column>
      <Column field="status" header="Estado">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column field="total" header="Total">
        <template #body="{ data }">{{ formatCurrency(data.total) }}</template>
      </Column>
      <Column field="created_at" header="Fecha">
        <template #body="{ data }">{{ new Date(data.created_at).toLocaleString() }}</template>
      </Column>
      <Column header="Acciones">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button type="button" icon="pi pi-pencil" severity="info" text rounded @click="(e) => { e.preventDefault(); e.stopPropagation(); openOffer(data); }" v-if="data.status === 'draft'" />
            <Button type="button" icon="pi pi-eye" severity="secondary" text rounded @click="(e) => { e.preventDefault(); e.stopPropagation(); openOffer(data); }" v-else />
            <Button type="button" icon="pi pi-print" severity="secondary" text rounded @click="(e) => { e.preventDefault(); e.stopPropagation(); handlePrint(data, e); }" v-tooltip.top="'Vista previa e imprimir'" />
            <Button type="button" icon="pi pi-download" severity="success" text rounded @click="(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadPDF(data, e); }" v-tooltip.top="'Descargar PDF'" />
          </div>
        </template>
      </Column>
      </DataTable>
    </div>

    <!-- Drawer Editor de Oferta -->
    <Drawer v-model:visible="drawerVisible" position="right" class="w-full md:w-[700px] lg:w-[900px] modern-drawer">
      <template #header>
        <div class="flex items-center gap-3">
          <span class="text-xl font-bold text-white">{{ currentOrder?.status === 'paid' ? 'Factura' : 'Oferta' }} #{{ currentOrder?.number ?? '—' }}</span>
          <Tag :value="statusLabel(currentOrder?.status)" :severity="statusSeverity(currentOrder?.status)" />
        </div>
      </template>

      <div class="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <!-- Cliente -->
          <Panel header="Información del Cliente">
            <template #icons>
              <Button type="button" v-if="!readOnly" label="Buscar" icon="pi pi-search" size="small" @click.prevent="showCustomerModal = true" />
            </template>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-indigo-700 uppercase">Nombre</label>
                <InputText v-model="customer.name" :disabled="readOnly" placeholder="Nombre del cliente" class="p-inputtext-sm bg-white" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-indigo-700 uppercase">Teléfono</label>
                <InputText v-model="customer.phone" :disabled="readOnly" placeholder="Teléfono" class="p-inputtext-sm bg-white" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-bold text-indigo-700 uppercase">Email</label>
                <InputText v-model="customer.email" :disabled="readOnly" placeholder="Email" class="p-inputtext-sm bg-white" />
              </div>
            </div>
          </Panel>

          <!-- Productos -->
          <Panel header="Carrito de Productos">
            <template #icons>
              <Button type="button" v-if="!readOnly" label="Agregar Producto" icon="pi pi-plus" size="small" @click.prevent="showProductModal = true" />
            </template>
            
            <DataTable :value="items" class="p-datatable-sm" v-if="items.length > 0">
              <Column field="product_name" header="Producto"></Column>
              <Column field="qty" header="Cant.">
                <template #body="{ data }">
                  <InputNumber v-model="data.qty" :disabled="readOnly" :min="1" @update:modelValue="updateItemTotal(data)" size="small" inputClass="w-16" />
                </template>
              </Column>
              <Column field="unit_price" header="Precio">
                <template #body="{ data }">
                  <InputNumber v-model="data.unit_price" :disabled="readOnly" mode="currency" currency="NIO" locale="es-NI" @update:modelValue="updateItemTotal(data)" size="small" inputClass="w-24" />
                </template>
              </Column>
              <Column field="tax_rate" header="Imp%">
                <template #body="{ data }">{{ data.tax_rate }}%</template>
              </Column>
              <Column field="line_total" header="Total" class="text-right">
                <template #body="{ data }">{{ formatCurrency(data.line_total) }}</template>
              </Column>
              <Column v-if="!readOnly" header="">
                <template #body="{ index }">
                  <Button type="button" icon="pi pi-times" severity="danger" text rounded @click.prevent="removeItem(index)" />
                </template>
              </Column>
            </DataTable>
            <div v-else class="flex flex-col items-center py-10 text-gray-400 italic">
              No hay productos en esta oferta.
            </div>
          </Panel>

          <!-- Notas -->
          <Panel header="Notas / Observaciones">
            <Textarea v-model="notes" :disabled="readOnly" rows="2" class="w-full" placeholder="Condiciones de venta, validez de oferta, etc." />
          </Panel>
        </div>

        <!-- Totales y Acciones -->
        <div class="p-6 border-t border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="flex flex-col">
            <div class="text-sm text-gray-500">Total a Pagar</div>
            <div class="text-3xl font-bold text-indigo-600">{{ formatCurrency(totals.total) }}</div>
          </div>
          
          <div class="flex gap-2 flex-wrap justify-center">
            <template v-if="currentOrder?.status === 'draft'">
              <Button type="button" label="Guardar Borrador" icon="pi pi-save" :loading="isSaving" @click.prevent="saveOffer" />
              <Button type="button" label="Facturar" icon="pi pi-check-circle" severity="success" :loading="isSaving" @click.prevent="handleFacturar" />
            </template>
            <template v-else-if="currentOrder?.status === 'paid'">
              <Button type="button" label="Cancelar Venta" icon="pi pi-ban" severity="danger" text @click.prevent="handleCancelar" />
            </template>
            <Button type="button" label="Imprimir PDF" icon="pi pi-print" severity="secondary" @click="(e) => { e.preventDefault(); handlePrint(currentOrder, e); }" v-if="currentOrder?.id" />
            <Button type="button" label="Descargar PDF" icon="pi pi-download" severity="success" @click="(e) => { e.preventDefault(); handleDownloadPDF(currentOrder, e); }" v-if="currentOrder?.id" />
          </div>
        </div>
      </div>
    </Drawer>

    <!-- Modales de búsqueda -->
    <Dialog v-model:visible="showCustomerModal" header="Buscar Cliente" modal class="w-full max-w-lg">
      <div class="space-y-4 pt-2">
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText v-model="customerSearchText" placeholder="Nombre, RUC o teléfono..." class="w-full" @input="onCustomerSearch" />
        </IconField>
        <Listbox :options="foundCustomers" optionLabel="name" class="w-full" @change="selectCustomer" />
      </div>
    </Dialog>

    <Dialog v-model:visible="showProductModal" header="Seleccionar Producto" modal class="w-full max-w-lg">
      <div class="space-y-4 pt-2">
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText v-model="productSearchText" placeholder="Buscar por nombre..." class="w-full" @input="onProductSearch" />
        </IconField>
        <Listbox :options="foundProducts" optionLabel="nombre" class="w-full" @change="addProduct">
          <template #option="{ option }">
            <div class="flex justify-between w-full">
              <span>{{ option.nombre }}</span>
              <span class="text-sm text-gray-500">{{ formatCurrency(option.precio) }} (Stock: {{ option.stock }})</span>
            </div>
          </template>
        </Listbox>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { 
  listOffers, 
  getOrderItems, 
  createDraftOrder, 
  upsertItems, 
  patchOrder, 
  finalizeOrder,
  cancelOrder 
} from '../services/ventas'
import { searchCustomers } from '../services/clientes'
import { getProductos } from '../services/productos'
import { formatCurrency } from '../utils/calculations'
import { handleError, showSuccess } from '../utils/errorHandler'
import { business } from '../config/business'
import { printInvoice } from '../utils/printInvoice'
import { downloadInvoicePDF } from '../utils/downloadPDF'
import { IVA_PORCENTAJE } from '../constants'

import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Drawer from 'primevue/drawer'
import Tag from 'primevue/tag'
import Panel from 'primevue/panel'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Listbox from 'primevue/listbox'
import Tooltip from 'primevue/tooltip'

const queryClient = useQueryClient()

// Directivas
const vTooltip = Tooltip

// Fetch principal
const { data: offers = [], isLoading } = useQuery({
  queryKey: ['sales-offers'],
  queryFn: () => listOffers({ limit: 500 })
})

// Estados Editor
const drawerVisible = ref(false)
const currentOrder = ref(null)
const items = ref([])
const customer = ref({ name: '', phone: '', email: '' })
const customerId = ref(null)
const notes = ref('')
const isSaving = ref(false)

const readOnly = computed(() => currentOrder.value?.status !== 'draft')

const totals = computed(() => {
  return items.value.reduce((acc, l) => {
    const base = (l.qty || 0) * (l.unit_price || 0) - (l.discount || 0)
    const tax = base * ((l.tax_rate || 0) / 100)
    acc.subtotal += base
    acc.tax_total += tax
    acc.total = acc.subtotal + acc.tax_total
    return acc
  }, { subtotal: 0, tax_total: 0, total: 0 })
})

// Modales
const showCustomerModal = ref(false)
const customerSearchText = ref('')
const foundCustomers = ref([])

const showProductModal = ref(false)
const productSearchText = ref('')
const foundProducts = ref([])

// Funciones
const statusLabel = (s) => ({
  draft: 'Oferta',
  paid: 'Pagada',
  cancelled: 'Cancelada'
}[s] || s)

const statusSeverity = (s) => ({
  draft: 'warn',
  paid: 'success',
  cancelled: 'danger'
}[s] || 'info')

const createOffer = () => {
  currentOrder.value = { status: 'draft', number: null }
  items.value = []
  customer.value = { name: '', phone: '', email: '' }
  customerId.value = null
  notes.value = ''
  drawerVisible.value = true
}

const onRowClick = (e) => {
  if (e.originalEvent) {
    e.originalEvent.preventDefault()
  }
  openOffer(e.data)
}

const openOffer = async (order) => {
  try {
    currentOrder.value = order
    customer.value = {
      name: order.customer_name || '',
      phone: order.customer_phone || '',
      email: order.customer_email || ''
    }
    customerId.value = order.customer_id
    notes.value = order.notes || ''
    drawerVisible.value = true
    
    const its = await getOrderItems(order.id)
    items.value = its
  } catch (err) {
    handleError(err)
  }
}

const onCustomerSearch = async () => {
  if (customerSearchText.value.length < 2) return
  foundCustomers.value = await searchCustomers(customerSearchText.value)
}

const selectCustomer = (e) => {
  const c = e.value
  if (!c) return
  customerId.value = c.id
  customer.value = { ...c }
  showCustomerModal.value = false
}

const onProductSearch = async () => {
  if (productSearchText.value.length < 2) return
  const res = await getProductos({ search: productSearchText.value })
  foundProducts.value = res.data
}

const addProduct = (e) => {
  const p = e.value
  if (!p) return
  
  const existing = items.value.find(i => i.product_id === p.id)
  if (existing) {
    existing.qty++
    updateItemTotal(existing)
  } else {
    const qty = 1
    const unit_price = Number(p.precio) || 0
    const tax_rate = IVA_PORCENTAJE
    const base = qty * unit_price
    items.value.push({
      id: crypto.randomUUID(),
      product_id: p.id,
      product_name: p.nombre,
      qty,
      unit_price,
      tax_rate,
      line_total: base + (base * (tax_rate / 100))
    })
  }
  showProductModal.value = false
}

const updateItemTotal = (item) => {
  const base = (item.qty || 0) * (item.unit_price || 0)
  item.line_total = base + (base * ((item.tax_rate || 0) / 100))
}

const removeItem = (index) => items.value.splice(index, 1)

const saveOffer = async () => {
  if (!customer.value.name) return alert('Selecciona un cliente')
  if (items.value.length === 0) return alert('Agrega productos')
  
  try {
    isSaving.value = true
    let orderId = currentOrder.value.id
    if (!orderId) {
      const created = await createDraftOrder()
      orderId = created.id
      currentOrder.value.id = orderId
    }
    
    await upsertItems(items.value.map(i => ({ ...i, order_id: orderId })))
    
    const updated = await patchOrder(orderId, {
      ...totals.value,
      customer_id: customerId.value,
      customer_name: customer.value.name,
      customer_phone: customer.value.phone,
      customer_email: customer.value.email,
      notes: notes.value
    })
    
    currentOrder.value = updated
    showSuccess('Oferta guardada')
    queryClient.invalidateQueries({ queryKey: ['sales-offers'] })
  } catch (err) {
    handleError(err)
  } finally {
    isSaving.value = false
  }
}

const handleFacturar = async () => {
  if (!confirm('¿Convertir esta oferta en factura? Se descontará del stock.')) return
  try {
    isSaving.value = true
    await saveOffer()
    await finalizeOrder(currentOrder.value.id)
    showSuccess('Venta facturada exitosamente')
    drawerVisible.value = false
    queryClient.invalidateQueries({ queryKey: ['sales-offers'] })
  } catch (err) {
    handleError(err)
  } finally {
    isSaving.value = false
  }
}

const handleCancelar = async () => {
  if (!confirm('¿Cancelar esta venta?')) return
  try {
    isSaving.value = true
    await cancelOrder(currentOrder.value.id)
    showSuccess('Venta cancelada')
    drawerVisible.value = false
    queryClient.invalidateQueries({ queryKey: ['sales-offers'] })
  } catch (err) {
    handleError(err)
  } finally {
    isSaving.value = false
  }
}

const handlePrint = async (order, event) => {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  try {
    const its = await getOrderItems(order.id)
    await printInvoice({ order, items: its, business })
  } catch (err) {
    handleError(err)
  }
}

const handleDownloadPDF = async (order, event) => {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  try {
    const its = await getOrderItems(order.id)
    await downloadInvoicePDF({ order, items: its, business })
    showSuccess('PDF descargado correctamente')
  } catch (err) {
    handleError(err)
  }
}
</script>
