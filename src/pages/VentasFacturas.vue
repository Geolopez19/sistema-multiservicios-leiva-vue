<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header con gradiente -->
    <div
      class="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl p-8 mb-6"
    >
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Facturas de Venta</h1>
          <p class="text-green-100">Historial de ventas completadas</p>
        </div>
        <Select
          v-model="statusFilter"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48 bg-white shadow-lg"
        />
      </div>
    </div>

    <!-- Tabla de Facturas -->
    <div
      class="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden"
    >
      <DataTable
        :value="filteredOrders"
        :loading="isLoading"
        stripedRows
        responsiveLayout="stack"
        @row-click="onRowClick"
        :rowClass="() => 'cursor-pointer'"
        class="modern-table"
      >
        <Column field="invoice_number" header="#">
          <template #body="{ data }">{{
            data.invoice_number ?? data.number ?? "—"
          }}</template>
        </Column>
        <Column field="customer_name" header="Cliente"></Column>
        <Column field="status" header="Estado">
          <template #body="{ data }">
            <Tag
              :value="statusLabel(data.status)"
              :severity="statusSeverity(data.status)"
            />
          </template>
        </Column>
        <Column field="total" header="Total">
          <template #body="{ data }">{{ formatCurrency(data.total) }}</template>
        </Column>
        <Column field="created_at" header="Fecha">
          <template #body="{ data }">{{
            new Date(data.created_at).toLocaleString()
          }}</template>
        </Column>
        <Column header="Acciones">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                type="button"
                icon="pi pi-eye"
                severity="secondary"
                text
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openOrder(data);
                  }
                "
                v-tooltip.top="'Ver detalles'"
              />
              <Button
                type="button"
                icon="pi pi-print"
                severity="secondary"
                text
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrint(data, e);
                  }
                "
                v-tooltip.top="'Imprimir'"
              />
              <Button
                type="button"
                icon="pi pi-download"
                severity="success"
                text
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownloadPDF(data, e);
                  }
                "
                v-tooltip.top="'Descargar PDF'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Drawer de Detalle -->
    <Drawer
      v-model:visible="drawerVisible"
      position="right"
      :blockScroll="true"
      :modal="true"
      class="w-full md:w-[90vw] lg:w-[1200px] xl:w-[1400px] modern-drawer"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <span class="text-xl font-bold text-slate-800"
            >Factura #{{
              currentOrder?.invoice_number ?? currentOrder?.number ?? "—"
            }}</span
          >
          <Tag
            :value="statusLabel(currentOrder?.status)"
            :severity="statusSeverity(currentOrder?.status)"
          />
        </div>
      </template>

      <div class="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <!-- Información del Cliente -->
          <Panel header="Información del Cliente">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1">
                <span class="text-xs font-bold text-green-700 uppercase"
                  >Nombre</span
                >
                <span class="text-slate-900 font-medium">{{
                  currentOrder?.customer_name || "—"
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-bold text-green-700 uppercase"
                  >Teléfono</span
                >
                <span class="text-slate-900 font-medium">{{
                  currentOrder?.customer_phone || "—"
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-bold text-green-700 uppercase"
                  >Email</span
                >
                <span class="text-slate-900 font-medium">{{
                  currentOrder?.customer_email || "—"
                }}</span>
              </div>
            </div>
            <div
              v-if="currentOrder?.notes"
              class="mt-4 pt-4 border-t border-green-100"
            >
              <span
                class="text-xs font-bold text-green-700 uppercase block mb-2"
                >Notas</span
              >
              <p class="text-slate-800 bg-green-50 p-3 rounded-lg">
                {{ currentOrder.notes }}
              </p>
            </div>
          </Panel>

          <!-- Productos -->
          <Panel header="Productos">
            <DataTable
              :value="items"
              class="p-datatable-sm bg-white"
              :loading="loadingItems"
            >
              <Column field="product_name" header="Producto"></Column>
              <Column field="qty" header="Cant." class="w-20"></Column>
              <Column field="unit_price" header="Precio">
                <template #body="{ data }">{{
                  formatCurrency(data.unit_price)
                }}</template>
              </Column>
              <Column field="tax_rate" header="Imp%">
                <template #body="{ data }">{{ data.tax_rate }}%</template>
              </Column>
              <Column
                field="line_total"
                header="Total"
                class="text-right font-semibold"
              >
                <template #body="{ data }">{{
                  formatCurrency(data.line_total)
                }}</template>
              </Column>
            </DataTable>
          </Panel>

          <!-- Resumen de Totales -->
          <div class="flex justify-end">
            <div
              class="w-full md:w-64 space-y-2 bg-white p-6 rounded-xl border-2 border-indigo-200 shadow-md"
            >
              <div class="flex justify-between text-sm">
                <span class="text-indigo-700 font-medium">Subtotal:</span>
                <span class="text-slate-900 font-semibold">{{
                  formatCurrency(currentOrder?.subtotal || 0)
                }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-indigo-700 font-medium">Impuestos:</span>
                <span class="text-slate-900 font-semibold">{{
                  formatCurrency(currentOrder?.tax_total || 0)
                }}</span>
              </div>
              <div
                class="flex justify-between text-xl font-bold border-t-2 border-indigo-200 pt-3 mt-2"
              >
                <span class="text-slate-900">Total:</span>
                <span class="text-green-600">{{
                  formatCurrency(currentOrder?.total || 0)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer del Drawer -->
        <div
          class="p-6 border-t border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 flex justify-end gap-2"
        >
          <Button
            type="button"
            v-if="currentOrder?.status === 'paid'"
            label="Cancelar Venta"
            icon="pi pi-ban"
            severity="danger"
            @click.prevent="confirmCancelOrder"
          />
          <Button
            type="button"
            label="Imprimir"
            icon="pi pi-print"
            severity="secondary"
            @click="
              (e) => {
                e.preventDefault();
                handlePrint(currentOrder, e);
              }
            "
          />
          <Button
            type="button"
            label="Descargar PDF"
            icon="pi pi-download"
            severity="success"
            @click="
              (e) => {
                e.preventDefault();
                handleDownloadPDF(currentOrder, e);
              }
            "
          />
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { listOffers, getOrderItems, cancelOrder } from "../services/ventas";
import { formatCurrency } from "../utils/calculations";
import { handleError, showSuccess } from "../utils/errorHandler";
import { business } from "../config/business";
import { printInvoice } from "../utils/printInvoice";
import { downloadInvoicePDF } from "../utils/downloadPDF";

import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Drawer from "primevue/drawer";
import Tag from "primevue/tag";
import Panel from "primevue/panel";
import Select from "primevue/select";
import Tooltip from "primevue/tooltip";

const queryClient = useQueryClient();

// Directivas
const vTooltip = Tooltip;

// Estados de la lista
const statusFilter = ref("paid");
const statusOptions = [
  { label: "Todas", value: "all" },
  { label: "Pagadas", value: "paid" },
  { label: "Canceladas", value: "cancelled" },
];

// Fetch de órdenes
const { data: orders = [], isLoading } = useQuery({
  queryKey: ["sales-orders"],
  queryFn: () => listOffers({ limit: 500 }),
});

const filteredOrders = computed(() => {
  if (!orders.value || !Array.isArray(orders.value)) return [];
  const filtered = orders.value.filter(
    (o) => o.status === "paid" || o.status === "cancelled"
  );
  if (statusFilter.value === "all") return filtered;
  return filtered.filter((o) => o.status === statusFilter.value);
});

// Estados del detalle
const drawerVisible = ref(false);
const currentOrder = ref(null);
const items = ref([]);
const loadingItems = ref(false);

// Funciones
const statusLabel = (s) =>
  ({
    paid: "Pagada",
    cancelled: "Cancelada",
    draft: "Oferta",
  }[s] || s);

const statusSeverity = (s) =>
  ({
    paid: "success",
    cancelled: "danger",
    draft: "warn",
  }[s] || "info");

const onRowClick = (e) => {
  if (e.originalEvent) {
    e.originalEvent.preventDefault();
  }
  openOrder(e.data);
};

const openOrder = async (order) => {
  try {
    currentOrder.value = order;
    drawerVisible.value = true;
    loadingItems.value = true;

    const its = await getOrderItems(order.id);
    items.value = its;
  } catch (err) {
    handleError(err, "No se pudieron cargar los detalles de la factura");
  } finally {
    loadingItems.value = false;
  }
};

const confirmCancelOrder = async () => {
  if (
    !confirm(
      "¿Estás seguro de cancelar esta venta? El stock se repondrá automáticamente."
    )
  )
    return;

  try {
    await cancelOrder(currentOrder.value.id);
    showSuccess("Venta cancelada correctamente");
    drawerVisible.value = false;
    queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
  } catch (err) {
    handleError(err);
  }
};

const handlePrint = async (order, event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (!order) return;
  try {
    const its = await getOrderItems(order.id);
    await printInvoice({ order, items: its, business });
  } catch (err) {
    handleError(err);
  }
};

const handleDownloadPDF = async (order, event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (!order) return;
  try {
    const its = await getOrderItems(order.id);
    await downloadInvoicePDF({ order, items: its, business });
    showSuccess("PDF descargado correctamente");
  } catch (err) {
    handleError(err);
  }
};
</script>
