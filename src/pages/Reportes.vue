<template>
  <div class="p-6">
    <div v-if="!isAdmin" class="flex items-center justify-center h-[60vh]">
      <div class="text-center p-8 bg-white rounded-2xl shadow-sm border border-red-100 max-w-md">
        <div class="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock class="w-8 h-8 text-red-500" />
        </div>
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Acceso Restringido</h2>
        <p class="text-slate-500 mb-6">Solo los administradores pueden acceder a los reportes financieros.</p>
        <Button label="Ir al Inventario" @click="$router.push('/inventario')" />
      </div>
    </div>

    <template v-else>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <BarChart3 class="w-8 h-8" />
          Reportes y Estadísticas
        </h1>
        <div class="flex gap-3 items-center">
          <Select v-model="periodo" :options="periodoOptions" optionLabel="label" optionValue="value" class="w-48" />
          <template v-if="periodo === 'personalizado'">
            <DatePicker v-model="fechaInicio" placeholder="Inicio" dateFormat="yy-mm-dd" />
            <DatePicker v-model="fechaFin" placeholder="Fin" dateFormat="yy-mm-dd" />
          </template>
        </div>
      </div>

      <!-- Métricas -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Card class="shadow-sm border border-gray-100">
          <template #title><span class="text-sm text-gray-500 uppercase">Ingresos</span></template>
          <template #content>
            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(resumen.ingresos) }}</div>
          </template>
        </Card>
        <Card class="shadow-sm border border-gray-100">
          <template #title><span class="text-sm text-gray-500 uppercase">Gastos</span></template>
          <template #content>
            <div class="text-2xl font-bold text-red-600">{{ formatCurrency(resumen.gastos) }}</div>
          </template>
        </Card>
        <Card class="shadow-sm border border-gray-100">
          <template #title><span class="text-sm text-gray-500 uppercase">Ganancia Neta</span></template>
          <template #content>
            <div class="text-2xl font-bold" :class="resumen.ganancia >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(resumen.ganancia) }}
            </div>
          </template>
        </Card>
        <Card class="shadow-sm border border-gray-100">
          <template #title><span class="text-sm text-gray-500 uppercase">Ventas</span></template>
          <template #content>
            <div class="text-2xl font-bold text-indigo-600">{{ resumen.totalVentas }}</div>
          </template>
        </Card>
        <Card class="shadow-sm border border-gray-100">
          <template #title><span class="text-sm text-gray-500 uppercase">Compras</span></template>
          <template #content>
            <div class="text-2xl font-bold text-blue-600">{{ resumen.totalCompras }}</div>
          </template>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Gráfico Ventas por Día -->
        <Card class="shadow-sm border border-gray-100">
          <template #title>Ventas por Día</template>
          <template #content>
            <div v-if="ventasPorDia.length > 0" class="flex items-end gap-1 h-48 overflow-x-auto pb-8">
              <div v-for="(dia, idx) in ventasPorDia" :key="idx" class="flex-1 min-w-[30px] flex flex-col items-center group">
                <div 
                  class="w-full bg-indigo-500 rounded-t transition-all hover:bg-indigo-600 relative"
                  :style="{ height: `${(dia.total / maxVentas) * 100}%` }"
                >
                  <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {{ formatCurrency(dia.total) }}
                  </div>
                </div>
                <div class="text-[10px] text-gray-400 mt-2 rotate-[-45deg] origin-top-left whitespace-nowrap">
                  {{ new Date(dia.fecha).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }) }}
                </div>
              </div>
            </div>
            <div v-else class="h-48 flex items-center justify-center text-gray-400 italic">
              No hay datos para este período
            </div>
          </template>
        </Card>

        <!-- Productos Más Vendidos -->
        <Card class="shadow-sm border border-gray-100">
          <template #title>🏆 Más Vendidos</template>
          <template #content>
            <DataTable :value="productosMasVendidos" class="p-datatable-sm" :rows="5">
              <Column field="product_name" header="Producto"></Column>
              <Column field="cantidad" header="Cant." class="text-right"></Column>
              <Column field="ingresos" header="Ingresos" class="text-right">
                <template #body="{ data }">{{ formatCurrency(data.ingresos) }}</template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <!-- Stock Bajo -->
        <Card class="shadow-sm border border-gray-100 lg:col-span-2">
          <template #title><span class="text-red-600">⚠️ Alerta de Stock Bajo</span></template>
          <template #content>
            <DataTable :value="productosStockBajo" stripedRows class="p-datatable-sm">
              <Column field="nombre" header="Producto"></Column>
              <Column field="stock" header="Stock Actual" class="text-right font-bold">
                <template #body="{ data }">
                  <span :class="data.stock <= 5 ? 'text-red-600' : 'text-orange-500'">{{ data.stock }}</span>
                </template>
              </Column>
              <Column header="Nivel">
                <template #body="{ data }">
                  <Tag :value="data.stock <= 5 ? 'Crítico' : 'Bajo'" :severity="data.stock <= 5 ? 'danger' : 'warn'" />
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { 
  getReportesCompletos, 
  getProductosStockBajo,
  getFechaInicioMes,
  getFechaFinMes,
  getFechaInicioMesAnterior,
  getFechaFinMesAnterior
} from '../services/reportes'
import { isCurrentUserAdmin } from '../services/usuarios'
import { formatCurrency } from '../utils/calculations'
import { handleError } from '../utils/errorHandler'
import { BarChart3, Lock } from 'lucide-vue-next'

import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

// Estados
const isAdmin = ref(false)
const isLoading = ref(false)
const periodo = ref('mes-actual')
const fechaInicio = ref(null)
const fechaFin = ref(null)

const resumen = ref({ ingresos: 0, gastos: 0, ganancia: 0, totalVentas: 0, totalCompras: 0 })
const productosMasVendidos = ref([])
const productosStockBajo = ref([])
const ventasPorDia = ref([])

const periodoOptions = [
  { label: 'Mes Actual', value: 'mes-actual' },
  { label: 'Mes Anterior', value: 'mes-anterior' },
  { label: 'Personalizado', value: 'personalizado' }
]

// Computed
const maxVentas = computed(() => {
  return Math.max(...ventasPorDia.value.map(v => v.total), 1)
})

// Funciones
const loadData = async () => {
  try {
    isLoading.value = true
    let inicio, fin
    
    if (periodo.value === 'mes-actual') {
      inicio = getFechaInicioMes()
      fin = getFechaFinMes()
    } else if (periodo.value === 'mes-anterior') {
      inicio = getFechaInicioMesAnterior()
      fin = getFechaFinMesAnterior()
    } else {
      inicio = fechaInicio.value ? new Date(fechaInicio.value).toISOString().split('T')[0] : getFechaInicioMes()
      fin = fechaFin.value ? new Date(fechaFin.value).toISOString().split('T')[0] : getFechaFinMes()
    }
    
    const data = await getReportesCompletos(inicio, fin)
    resumen.value = data.resumen
    ventasPorDia.value = data.ventasPorDia || []
    productosMasVendidos.value = data.productosMasVendidos || []
    
    const stockBajo = await getProductosStockBajo(15)
    productosStockBajo.value = stockBajo
  } catch (err) {
    handleError(err)
  } finally {
    isLoading.value = false
  }
}

watch([periodo, fechaInicio, fechaFin], () => {
  loadData()
})

onMounted(async () => {
  isAdmin.value = await isCurrentUserAdmin()
  if (isAdmin.value) {
    loadData()
  }
})
</script>
