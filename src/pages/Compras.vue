<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Compras</h1>
      <div class="flex gap-3">
        <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" class="w-48" />
        <Button type="button" label="Nueva Compra" icon="pi pi-plus" @click.prevent="createPurchase" />
      </div>
    </div>

    <!-- Tabla de Compras -->
    <DataTable 
      :value="filteredPurchases" 
      :loading="isLoading" 
      stripedRows 
      responsiveLayout="stack" 
      class="shadow-md rounded-lg overflow-hidden border border-gray-200"
    >
      <Column field="number" header="#">
        <template #body="{ data }">{{ data.number ?? '—' }}</template>
      </Column>
      <Column field="supplier_name" header="Proveedor"></Column>
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
            <Button 
              type="button"
              :icon="data.status === 'draft' ? 'pi pi-pencil' : 'pi pi-eye'" 
              :severity="data.status === 'draft' ? 'info' : 'secondary'" 
              text rounded 
              @click.prevent="openPurchase(data)" 
            />
            <Button type="button" icon="pi pi-print" severity="secondary" text rounded @click.prevent="handlePrint(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Drawer de Detalle/Edición -->
    <Drawer v-model:visible="drawerVisible" position="right" class="w-full md:w-[600px] lg:w-[800px]" :header="'Compra #' + (currentPurchase?.number ?? '—')">
      <template #header>
        <div class="flex items-center gap-3">
          <span class="text-xl font-bold">Compra #{{ currentPurchase?.number ?? '—' }}</span>
          <Tag :value="statusLabel(currentPurchase?.status)" :severity="statusSeverity(currentPurchase?.status)" />
        </div>
      </template>

      <div class="flex flex-col h-full">
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <!-- Sección Proveedor -->
          <Panel header="Proveedor">
            <div v-if="supplier.name" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-semibold text-gray-500 uppercase">Nombre</span>
                  <span class="text-lg">{{ supplier.name }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-semibold text-gray-500 uppercase">Teléfono</span>
                  <span>{{ supplier.phone || '—' }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-semibold text-gray-500 uppercase">Email</span>
                  <span>{{ supplier.email || '—' }}</span>
                </div>
              </div>
              <Button v-if="!readOnly" label="Cambiar Proveedor" icon="pi pi-search" severity="secondary" size="small" @click.prevent="showSupplierModal = true" />
            </div>
            <div v-else class="flex flex-col items-center py-6 text-gray-400">
              <p class="mb-4">No hay proveedor seleccionado</p>
              <Button label="Seleccionar Proveedor" icon="pi pi-search" @click.prevent="showSupplierModal = true" />
            </div>
          </Panel>

          <!-- Sección Productos -->
          <Panel header="Productos">
            <template #icons>
              <Button v-if="!readOnly" icon="pi pi-plus" label="Agregar" size="small" @click.prevent="showProductModal = true" />
            </template>
            
            <DataTable :value="items" class="p-datatable-sm" v-if="items.length > 0">
              <Column field="product_name" header="Producto"></Column>
              <Column field="qty" header="Cant.">
                <template #body="{ data }">
                  <InputNumber v-model="data.qty" :disabled="readOnly" :min="1" @update:modelValue="updateItemTotal(data)" size="small" inputClass="w-16" />
                </template>
              </Column>
              <Column field="unit_cost" header="Costo">
                <template #body="{ data }">
                  <InputNumber v-model="data.unit_cost" :disabled="readOnly" mode="currency" currency="NIO" locale="es-NI" @update:modelValue="updateItemTotal(data)" size="small" inputClass="w-24" />
                </template>
              </Column>
              <Column field="line_total" header="Subtotal">
                <template #body="{ data }">{{ formatCurrency(data.line_total) }}</template>
              </Column>
              <Column v-if="!readOnly" header="">
                <template #body="{ index }">
                  <Button icon="pi pi-times" severity="danger" text rounded @click.prevent="removeItem(index)" />
                </template>
              </Column>
            </DataTable>
            <div v-else class="flex flex-col items-center py-6 text-gray-400">
              <p>No hay productos agregados</p>
            </div>
          </Panel>

          <!-- Notas -->
          <Panel header="Notas">
            <Textarea v-model="notes" :disabled="readOnly" rows="3" class="w-full" placeholder="Observaciones de la compra..." />
          </Panel>
        </div>

        <!-- Footer del Drawer -->
        <div class="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div class="text-2xl font-bold">
            Total: <span class="text-indigo-600">{{ formatCurrency(total) }}</span>
          </div>
          <div class="flex gap-2">
            <template v-if="currentPurchase?.status === 'draft'">
              <Button label="Guardar" icon="pi pi-save" :loading="isSaving" @click.prevent="savePurchase" />
              <Button v-if="currentPurchase.id" label="Completar" icon="pi pi-check" severity="success" :loading="isSaving" @click.prevent="confirmFinalize" />
              <Button v-if="currentPurchase.id" icon="pi pi-trash" severity="danger" text @click.prevent="confirmDeletePurchase" />
            </template>
            <template v-else>
              <Button label="Editar (Borrador)" icon="pi pi-pencil" severity="warning" @click.prevent="revertToDraft" />
            </template>
          </div>
        </div>
      </div>
    </Drawer>

    <!-- Modales -->
    <Dialog v-model:visible="showSupplierModal" header="Buscar Proveedor" modal class="w-full max-w-lg">
      <div class="space-y-4 pt-2">
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText v-model="supplierSearch" placeholder="Buscar por nombre o RUC..." class="w-full" @input="onSupplierSearch" />
        </IconField>
        <Listbox :options="suppliers" optionLabel="name" class="w-full" @change="selectSupplier" />
      </div>
    </Dialog>

    <Dialog v-model:visible="showProductModal" header="Agregar Producto" modal class="w-full max-w-lg">
      <div class="space-y-4 pt-2">
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText v-model="productSearch" placeholder="Buscar producto..." class="w-full" @input="onProductSearch" />
        </IconField>
        <Listbox :options="foundProducts" optionLabel="nombre" class="w-full" @change="addProduct" />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { 
  listPurchases, 
  getPurchaseItems, 
  createDraftPurchase, 
  upsertPurchaseItems, 
  patchPurchase, 
  finalizePurchase,
  deletePurchase 
} from '../services/compras'
import { searchSuppliers } from '../services/proveedores'
import { getProductos } from '../services/productos'
import { formatCurrency, calculatePurchaseTotal } from '../utils/calculations'
import { handleError, showSuccess } from '../utils/errorHandler'
import { business } from '../config/business'
import { printPurchase } from '../utils/printPurchase'

import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Drawer from 'primevue/drawer'
import Tag from 'primevue/tag'
import Panel from 'primevue/panel'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dialog from 'primevue/dialog'
import Listbox from 'primevue/listbox'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'

const queryClient = useQueryClient()

// Estados de la lista
const statusFilter = ref('all')
const statusOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Borradores', value: 'draft' },
  { label: 'Completadas', value: 'completed' }
]

// Fetch de compras
const { data: purchases = [], isLoading } = useQuery({
  queryKey: ['purchases'],
  queryFn: () => listPurchases({ limit: 100 })
})

const filteredPurchases = computed(() => {
  if (statusFilter.value === 'all') return purchases.value
  return purchases.value.filter(p => p.status === statusFilter.value)
})

// Estados del detalle
const drawerVisible = ref(false)
const currentPurchase = ref(null)
const items = ref([])
const supplier = ref({ name: '', phone: '', email: '' })
const supplierId = ref(null)
const notes = ref('')
const isSaving = ref(false)

const readOnly = computed(() => currentPurchase.value?.status !== 'draft')
const total = computed(() => calculatePurchaseTotal(items.value))

// Modales de búsqueda
const showSupplierModal = ref(false)
const supplierSearch = ref('')
const suppliers = ref([])

const showProductModal = ref(false)
const productSearch = ref('')
const foundProducts = ref([])

// Funciones
const statusLabel = (s) => ({
  draft: 'Borrador',
  completed: 'Completada',
  cancelled: 'Cancelada'
}[s] || s)

const statusSeverity = (s) => ({
  draft: 'warn',
  completed: 'success',
  cancelled: 'danger'
}[s] || 'info')

const createPurchase = () => {
  currentPurchase.value = { status: 'draft', number: null }
  items.value = []
  supplier.value = { name: '', phone: '', email: '' }
  supplierId.value = null
  notes.value = ''
  drawerVisible.value = true
}

const openPurchase = async (p) => {
  try {
    currentPurchase.value = p
    supplierId.value = p.supplier_id
    supplier.value = { 
      name: p.supplier_name || '', 
      phone: p.supplier_phone || '', 
      email: p.supplier_email || '' 
    }
    notes.value = p.notes || ''
    drawerVisible.value = true
    
    // Cargar items
    const its = await getPurchaseItems(p.id)
    items.value = its
  } catch (err) {
    handleError(err, 'No se pudo abrir la compra')
  }
}

const onSupplierSearch = async () => {
  if (supplierSearch.value.length < 2) return
  suppliers.value = await searchSuppliers(supplierSearch.value)
}

const selectSupplier = (e) => {
  const s = e.value
  if (!s) return
  supplierId.value = s.id
  supplier.value = { ...s }
  showSupplierModal.value = false
}

const onProductSearch = async () => {
  if (productSearch.value.length < 2) return
  const res = await getProductos({ search: productSearch.value })
  foundProducts.value = res.data
}

const addProduct = (e) => {
  const p = e.value
  if (!p) return
  
  const existing = items.value.find(i => i.product_id === p.id)
  if (existing) {
    existing.qty++
    existing.line_total = existing.qty * existing.unit_cost
  } else {
    items.value.push({
      id: crypto.randomUUID(),
      product_id: p.id,
      product_name: p.nombre,
      qty: 1,
      unit_cost: 0,
      line_total: 0
    })
  }
  showProductModal.value = false
}

const updateItemTotal = (item) => {
  item.line_total = (item.qty || 0) * (item.unit_cost || 0)
}

const removeItem = (index) => {
  items.value.splice(index, 1)
}

const savePurchase = async () => {
  if (!supplier.value.name) {
    alert('Selecciona un proveedor')
    return
  }
  
  try {
    isSaving.value = true
    let purchaseId = currentPurchase.value.id
    
    if (!purchaseId) {
      const created = await createDraftPurchase()
      purchaseId = created.id
      currentPurchase.value = created
    }
    
    await upsertPurchaseItems(items.value.map(i => ({ ...i, purchase_id: purchaseId })))
    
    const updated = await patchPurchase(purchaseId, {
      total: total.value,
      supplier_id: supplierId.value,
      supplier_name: supplier.value.name,
      supplier_phone: supplier.value.phone,
      supplier_email: supplier.value.email,
      notes: notes.value
    })
    
    currentPurchase.value = updated
    showSuccess('Compra guardada')
    queryClient.invalidateQueries({ queryKey: ['purchases'] })
  } catch (err) {
    handleError(err)
  } finally {
    isSaving.value = false
  }
}

const confirmFinalize = async () => {
  if (!confirm('¿Deseas completar la compra? Esto actualizará el inventario.')) return
  
  try {
    isSaving.value = true
    await savePurchase()
    await finalizePurchase(currentPurchase.value.id)
    currentPurchase.value.status = 'completed'
    showSuccess('Compra completada exitosamente')
    queryClient.invalidateQueries({ queryKey: ['purchases'] })
  } catch (err) {
    handleError(err)
  } finally {
    isSaving.value = false
  }
}

const revertToDraft = async () => {
  if (!confirm('¿Convertir a borrador para editar? El stock no se revertirá automáticamente.')) return
  try {
    const updated = await patchPurchase(currentPurchase.value.id, { status: 'draft' })
    currentPurchase.value = updated
    showSuccess('Ahora puedes editar la compra')
  } catch (err) {
    handleError(err)
  }
}

const confirmDeletePurchase = async () => {
  if (!confirm('¿Eliminar esta compra permanentemente?')) return
  try {
    await deletePurchase(currentPurchase.value.id)
    showSuccess('Compra eliminada')
    drawerVisible.value = false
    queryClient.invalidateQueries({ queryKey: ['purchases'] })
  } catch (err) {
    handleError(err)
  }
}

const handlePrint = async (p) => {
  try {
    const its = await getPurchaseItems(p.id)
    printPurchase({ purchase: p, items: its, business })
  } catch (err) {
    handleError(err)
  }
}

onMounted(() => {
  // Inicializaciones si son necesarias
})
</script>
