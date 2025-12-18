<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Inventario</h1>
      <Button label="Nuevo Producto" icon="pi pi-plus" @click="abrirModal('crear')" />
    </div>

    <!-- Métricas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="bg-blue-50">
        <template #title><span class="text-sm font-medium text-blue-600 uppercase">Total Productos</span></template>
        <template #content><span class="text-2xl font-bold">{{ totalProductos }}</span></template>
      </Card>
      <Card class="bg-green-50">
        <template #title><span class="text-sm font-medium text-green-600 uppercase">Stock Total</span></template>
        <template #content><span class="text-2xl font-bold">{{ metricas.stockTotal }}</span></template>
      </Card>
      <Card class="bg-indigo-50">
        <template #title><span class="text-sm font-medium text-indigo-600 uppercase">Valor Total</span></template>
        <template #content><span class="text-2xl font-bold">C${{ metricas.valorTotal.toLocaleString('es-NI') }}</span></template>
      </Card>
      <Card class="bg-red-50">
        <template #title><span class="text-sm font-medium text-red-600 uppercase">Bajo Stock</span></template>
        <template #content><span class="text-2xl font-bold text-red-600">{{ metricas.bajoStock }}</span></template>
      </Card>
    </div>

    <!-- Filtros -->
    <div class="flex flex-wrap gap-4 mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <IconField iconPosition="left" class="flex-1 min-w-[200px]">
        <InputIcon class="pi pi-search" />
        <InputText v-model="busqueda" placeholder="Buscar producto..." class="w-full" />
      </IconField>
      <Select v-model="filtroCategoria" :options="todasLasCategorias" placeholder="Todas las categorías" class="w-full md:w-60" showClear />
    </div>

    <!-- Tabla -->
    <DataTable :value="productos" :loading="loading" stripedRows responsiveLayout="stack" class="shadow-md rounded-lg overflow-hidden border border-gray-200">
      <Column field="nombre" header="Nombre" sortable></Column>
      <Column field="categoria" header="Categoría" sortable></Column>
      <Column field="stock" header="Stock" sortable>
        <template #body="{ data }">
          <Badge :value="data.stock" :severity="data.stock < 10 ? 'danger' : data.stock > 50 ? 'success' : 'warn'" />
        </template>
      </Column>
      <Column field="precio" header="Precio" sortable>
        <template #body="{ data }">
          {{ formatCurrency(data.precio) }}
        </template>
      </Column>
      <Column header="Acciones">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-plus" severity="success" text rounded @click="abrirModalEntrada(data)" title="Agregar Stock" />
            <Button icon="pi pi-pencil" severity="info" text rounded @click="abrirModal('editar', data)" />
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmarEliminar(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Modal Producto -->
    <Dialog v-model:visible="modal.visible" :header="modal.modo === 'crear' ? 'Nuevo Producto' : 'Editar Producto'" modal class="w-full max-w-md">
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-2">
          <label for="nombre" class="font-semibold">Nombre</label>
          <InputText id="nombre" v-model="nuevo.nombre" placeholder="Nombre del producto" />
        </div>
        <div class="flex flex-col gap-2">
          <label for="categoria" class="font-semibold">Categoría</label>
          <InputText id="categoria" v-model="nuevo.categoria" placeholder="Ej: Bebidas, Limpieza..." />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="stock" class="font-semibold">Stock</label>
            <InputNumber id="stock" v-model="nuevo.stock" />
          </div>
          <div class="flex flex-col gap-2">
            <label for="precio" class="font-semibold">Precio</label>
            <InputNumber id="precio" v-model="nuevo.precio" mode="currency" currency="NIO" locale="es-NI" />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <label for="descripcion" class="font-semibold">Descripción</label>
          <Textarea id="descripcion" v-model="nuevo.descripcion" rows="3" autoResize />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="modal.visible = false" />
        <Button label="Guardar" @click="guardarProducto" :loading="guardando" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getProductos, addProducto, updateProducto, deleteProducto } from '../services/productos'
import { formatCurrency } from '../utils/calculations'
import { handleError, showSuccess } from '../utils/errorHandler'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Badge from 'primevue/badge'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

// Estados
const productos = ref([])
const totalProductos = ref(0)
const busqueda = ref('')
const filtroCategoria = ref(null)
const loading = ref(false)
const guardando = ref(false)
const metricas = ref({ stockTotal: 0, valorTotal: 0, bajoStock: 0 })
const todasLasCategorias = ref([])

const modal = ref({ visible: false, modo: 'crear', producto: null })
const nuevo = ref({ nombre: '', categoria: '', stock: 0, precio: 0, descripcion: '' })

// Funciones
const fetchProductos = async () => {
  try {
    loading.value = true
    const res = await getProductos({
      search: busqueda.value,
      categoria: filtroCategoria.value
    })
    productos.value = res.data
    totalProductos.value = res.total
  } catch (err) {
    handleError(err, 'No se pudieron cargar los productos')
  } finally {
    loading.value = false
  }
}

const cargarMetricasYCategorias = async () => {
  try {
    const res = await getProductos({ limit: 1000 })
    const todos = res.data
    metricas.value.stockTotal = todos.reduce((a, b) => a + Number(b.stock || 0), 0)
    metricas.value.valorTotal = todos.reduce((a, b) => a + Number(b.precio || 0) * Number(b.stock || 0), 0)
    metricas.value.bajoStock = todos.filter(p => (p.stock || 0) < 10).length
    todasLasCategorias.value = [...new Set(todos.map(p => p.categoria).filter(Boolean))]
  } catch (err) {
    console.error(err)
  }
}

const abrirModal = (modo, producto = null) => {
  modal.value = { visible: true, modo, producto }
  if (producto) {
    nuevo.value = { ...producto }
  } else {
    nuevo.value = { nombre: '', categoria: '', stock: 0, precio: 0, descripcion: '' }
  }
}

const guardarProducto = async () => {
  try {
    guardando.value = true
    if (modal.value.modo === 'crear') {
      await addProducto(nuevo.value)
      showSuccess('Producto creado correctamente')
    } else {
      await updateProducto(modal.value.producto.id, nuevo.value)
      showSuccess('Producto actualizado correctamente')
    }
    modal.value.visible = false
    fetchProductos()
    cargarMetricasYCategorias()
  } catch (err) {
    handleError(err)
  } finally {
    guardando.value = false
  }
}

const confirmarEliminar = async (producto) => {
  if (confirm(`¿Estás seguro de eliminar ${producto.nombre}?`)) {
    try {
      await deleteProducto(producto.id)
      showSuccess('Producto eliminado')
      fetchProductos()
      cargarMetricasYCategorias()
    } catch (err) {
      handleError(err)
    }
  }
}

// Watchers
watch([busqueda, filtroCategoria], () => {
  fetchProductos()
})

// Init
onMounted(() => {
  fetchProductos()
  cargarMetricasYCategorias()
})
</script>
