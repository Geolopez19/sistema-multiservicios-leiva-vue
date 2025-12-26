<template>
  <div class="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
    <div class="bg-gradient-to-r from-slate-50 to-indigo-50 px-5 py-3 flex justify-between items-center border-b border-slate-200">
      <div class="flex items-center gap-2">
        <div class="bg-indigo-100 p-1.5 rounded-md">
          <i class="pi pi-box text-indigo-600 text-lg"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800">Productos en esta Compra</h3>
      </div>
      <Button
        v-if="!readOnly"
        type="button"
        label="Agregar Producto"
        icon="pi pi-plus"
        size="small"
        @click.prevent="showProductModal = true"
        class="bg-indigo-600 text-white hover:bg-indigo-700 border-0 shadow-sm"
      />
    </div>

    <div class="p-0 bg-white">
      <DataTable
        v-if="items.length > 0"
        :value="items"
        class="bg-white p-datatable-sm"
        stripedRows
        size="small"
      >
        <Column field="product_name" header="Producto">
          <template #body="{ data }">
            <span class="font-semibold text-slate-700">{{ data.product_name }}</span>
          </template>
        </Column>
        <Column field="qty" header="Cant.">
          <template #body="{ data }">
            <InputNumber
              v-model="data.qty"
              :disabled="readOnly"
              :min="1"
              @update:modelValue="updateItemTotal(data)"
              size="small"
              class="w-full max-w-[80px]"
              inputClass="p-2 text-center"
            />
          </template>
        </Column>
        <Column field="unit_cost" header="Costo Unit.">
          <template #body="{ data }">
            <InputNumber
              v-model="data.unit_cost"
              :disabled="readOnly"
              mode="currency"
              currency="NIO"
              locale="es-NI"
              @update:modelValue="updateItemTotal(data)"
              size="small"
              class="w-full max-w-[120px]"
              inputClass="p-2"
            />
          </template>
        </Column>
        <Column field="line_total" header="Subtotal">
          <template #body="{ data }">
            <span class="font-bold text-slate-800">{{ formatCurrency(data.line_total) }}</span>
          </template>
        </Column>
        <Column v-if="!readOnly" header="" style="width: 50px">
          <template #body="{ index }">
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click.prevent="removeItem(index)"
              class="hover:bg-red-50"
            />
          </template>
        </Column>
      </DataTable>
      <div v-else class="flex flex-col items-center justify-center py-12 text-center text-slate-400">
        <div class="bg-slate-50 p-4 rounded-full mb-3">
          <i class="pi pi-shopping-cart text-4xl"></i>
        </div>
        <p class="text-lg font-medium">No hay productos agregados</p>
        <p class="text-sm">Haz clic en "Agregar Producto" para comenzar</p>
      </div>
    </div>

    <!-- Modal de Búsqueda de Productos -->
    <Dialog
      v-model:visible="showProductModal"
      modal
      class="w-full max-w-2xl modern-dialog"
      :dismissableMask="true"
      :pt="{
        header: { class: 'py-4 px-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-indigo-100' },
        content: { class: 'p-0' },
      }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="bg-indigo-600 p-2 rounded-lg shadow-md">
            <i class="pi pi-search text-white text-xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-800">Agregar Producto</h3>
            <p class="text-sm text-slate-500">Busca por nombre o código para agregar a la compra</p>
          </div>
        </div>
      </template>

      <div class="space-y-4 pt-4">
        <div class="px-4">
          <IconField iconPosition="left" class="w-full">
            <InputIcon class="pi pi-search text-indigo-500 z-10" />
            <InputText
              v-model="productSearchText"
              placeholder="Nombre del producto..."
              class="w-full pl-10 py-3 text-lg bg-indigo-50/50 border-0 ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-500 rounded-xl transition-all shadow-sm"
              @input="onProductSearch"
              autofocus
            />
          </IconField>
        </div>

        <div v-if="foundProducts.length > 0" class="bg-white border-y border-slate-200 overflow-hidden">
          <Listbox
            :options="foundProducts"
            optionLabel="nombre"
            class="w-full max-h-[50vh] overflow-auto custom-scrollbar"
            @change="addProduct"
            listStyle="padding: 0"
            :pt="{
              item: { class: 'p-0 border-0 focus:bg-transparent w-full' },
              list: { class: 'p-0 w-full' },
            }"
          >
            <template #option="{ option, selected }">
              <div
                class="w-full p-4 px-6 transition-all duration-200 cursor-pointer border-b border-slate-100 last:border-0 group border-l-4"
                :class="[
                  selected ? 'bg-indigo-50 border-l-indigo-500' : 'bg-white hover:bg-slate-50 border-l-transparent',
                ]"
              >
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-4">
                    <div class="bg-slate-100 text-slate-500 w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm">
                      <i class="pi pi-image text-xs"></i>
                    </div>
                    <div>
                      <div class="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                        {{ option.nombre }}
                      </div>
                      <div class="text-xs text-slate-500">SKU: {{ option.codigo_barras || 'N/A' }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-bold text-indigo-600">Stock: {{ option.stock }}</div>
                    <div class="text-xs text-slate-400">PVP: {{ formatCurrency(option.precio_venta) }}</div>
                  </div>
                </div>
              </div>
            </template>
          </Listbox>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getProductos } from '../../services/productos'
import { formatCurrency } from '../../utils/calculations'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:items'])

const showProductModal = ref(false)
const productSearchText = ref('')
const foundProducts = ref([])

const onProductSearch = async () => {
  if (productSearchText.value.length < 2) return
  const res = await getProductos({ search: productSearchText.value })
  foundProducts.value = res.data
}

const addProduct = (e) => {
  const p = e.value
  if (!p) return

  // Create a copy of the items array to avoid direct prop mutation issues
  const newItems = [...props.items]
  const existing = newItems.find((i) => i.product_id === p.id)
  
  if (existing) {
    existing.qty++
    existing.line_total = existing.qty * existing.unit_cost
  } else {
    newItems.push({
      id: crypto.randomUUID(),
      product_id: p.id,
      product_name: p.nombre,
      qty: 1,
      unit_cost: p.precio_compra || 0,
      line_total: p.precio_compra || 0,
    })
  }
  
  emit('update:items', newItems)
  showProductModal.value = false
  productSearchText.value = ''
  foundProducts.value = []
}

const updateItemTotal = (item) => {
  // item is a reactive object from the prop, so modifying it mutates the prop deeply.
  // However, we emit a new array reference to trigger updates.
  item.line_total = (item.qty || 0) * (item.unit_cost || 0)
  emit('update:items', [...props.items])
}

const removeItem = (index) => {
  const newItems = [...props.items]
  newItems.splice(index, 1)
  emit('update:items', newItems)
}
</script>
