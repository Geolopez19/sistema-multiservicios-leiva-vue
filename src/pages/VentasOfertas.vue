<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header con gradiente -->
    <div
      class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-6"
    >
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
    <div
      class="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden"
    >
      <!-- Search Bar -->
      <div
        class="p-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50"
      >
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search text-indigo-400" />
          <InputText
            v-model="searchText"
            placeholder="Buscar por nombre de cliente..."
            class="w-full md:w-96"
          />
        </IconField>
      </div>

      <DataTable
        :value="offers"
        :loading="isLoading"
        v-model:filters="filters"
        :globalFilterFields="['customer_name']"
        paginator
        :rows="15"
        :rowsPerPageOptions="[15, 30, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        stripedRows
        responsiveLayout="stack"
        @row-click="onRowClick"
        :rowClass="() => 'cursor-pointer'"
        class="modern-table"
      >
        <Column field="number" header="#">
          <template #body="{ data }">{{ data.number ?? "—" }}</template>
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
                icon="pi pi-pencil"
                severity="info"
                text
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openOffer(data);
                  }
                "
                v-if="data.status === 'draft'"
                class="hover:bg-blue-50"
              />
              <Button
                type="button"
                icon="pi pi-eye"
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openOffer(data);
                  }
                "
                v-else
                class="!bg-blue-500 hover:!bg-blue-600 border-0"
              />
              <Button
                type="button"
                icon="pi pi-print"
                rounded
                @click="
                  (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePrint(data, e);
                  }
                "
                v-tooltip.top="'Vista previa e imprimir'"
                class="!bg-blue-600 hover:!bg-blue-700 border-0"
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
                class="hover:bg-green-50"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Drawer Editor de Oferta -->
    <Drawer
      v-model:visible="drawerVisible"
      position="right"
      class="modern-drawer"
      :blockScroll="true"
      :modal="true"
      style="width: 70vw; max-width: 1100px"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-4">
            <div
              class="bg-indigo-50 p-3 rounded-xl border border-indigo-100/50"
            >
              <i
                :class="
                  currentOrder?.status === 'paid'
                    ? 'pi pi-receipt'
                    : 'pi pi-file-edit'
                "
                class="text-indigo-600 text-3xl"
              ></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-slate-800 mb-1">
                {{ currentOrder?.status === "paid" ? "Factura" : "Oferta" }} #{{
                  currentOrder?.number ?? "Nueva"
                }}
              </h3>
              <Tag
                :value="statusLabel(currentOrder?.status)"
                :severity="statusSeverity(currentOrder?.status)"
                class="text-sm"
              />
            </div>
          </div>
        </div>
      </template>

      <div class="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
        <div class="flex-1 overflow-y-auto p-8 space-y-8">
          <!-- Cliente -->
          <SalesCustomerForm
            v-model="customer"
            :readOnly="readOnly"
            @select="customerId = $event.id"
          />

          <!-- Productos -->
          <SalesItemsTable v-model:items="items" :readOnly="readOnly" />

          <!-- Resumen de Totales -->
          <SalesTotals :totals="totals" />
        </div>

        <!-- Acciones Fijas en la parte inferior -->
        <div class="p-4 border-t border-indigo-100 bg-white">
          <div class="flex gap-2 flex-wrap justify-center">
            <template v-if="currentOrder?.status === 'draft'">
              <Button
                type="button"
                label="Generar Oferta"
                icon="pi pi-save"
                size="small"
                :loading="isSaving"
                @click.prevent="saveOffer"
                class="bg-indigo-600 text-white hover:bg-indigo-700 border-0 shadow-md"
              />
              <Button
                type="button"
                label="Facturar Ahora"
                icon="pi pi-check-circle"
                severity="success"
                size="small"
                :loading="isSaving"
                @click.prevent="handleFacturar"
                class="shadow-md bg-green-600 hover:bg-green-700 border-0"
              />
            </template>
            <template v-else-if="currentOrder?.status === 'paid'">
              <Button
                type="button"
                label="Cancelar Venta"
                icon="pi pi-ban"
                severity="danger"
                size="small"
                @click.prevent="handleCancelar"
                class="shadow-md"
              />
            </template>
            <Button
              type="button"
              label="Imprimir"
              icon="pi pi-print"
              size="small"
              @click="
                (e) => {
                  e.preventDefault();
                  handlePrint(currentOrder, e);
                }
              "
              v-if="currentOrder?.id"
              class="bg-blue-500 hover:bg-blue-600 border-0 text-white"
            />
            <Button
              type="button"
              label="PDF"
              icon="pi pi-download"
              size="small"
              @click="
                (e) => {
                  e.preventDefault();
                  handleDownloadPDF(currentOrder, e);
                }
              "
              v-if="currentOrder?.id"
              class="bg-blue-600 text-white hover:bg-blue-700 border-0 shadow-md"
            />
          </div>
        </div>
      </div>
    </Drawer>

    <!-- Confirmation Dialog -->
    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { useConfirm } from "primevue/useconfirm";
import {
  listOffers,
  getOrderItems,
  createDraftOrder,
  upsertItems,
  patchOrder,
  finalizeOrder,
  cancelOrder,
} from "../services/ventas";
import { formatCurrency, calculateOrderTotals } from "../utils/calculations";
import { handleError, showSuccess, showWarning } from "../utils/errorHandler";
import { business } from "../config/business";
import { printInvoice } from "../utils/printInvoice";
import { downloadInvoicePDF } from "../utils/downloadPDF";

import SalesCustomerForm from "../components/sales/SalesCustomerForm.vue";
import SalesItemsTable from "../components/sales/SalesItemsTable.vue";
import SalesTotals from "../components/sales/SalesTotals.vue";

import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Drawer from "primevue/drawer";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import Tooltip from "primevue/tooltip";
import ConfirmDialog from "primevue/confirmdialog";
import InputText from "primevue/inputtext";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import { FilterMatchMode } from "@primevue/core/api";

const queryClient = useQueryClient();
const confirm = useConfirm();
const vTooltip = Tooltip;

// Search and filters
const searchText = ref("");
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

// Watch searchText and update filter
watch(searchText, (newVal) => {
  filters.value.global.value = newVal;
});

// Fetch principal
const { data: offers = [], isLoading } = useQuery({
  queryKey: ["sales-offers"],
  queryFn: () => listOffers({ limit: 500 }),
});

// Estados Editor
const drawerVisible = ref(false);
const currentOrder = ref(null);
const items = ref([]);
const customer = ref({ name: "", phone: "", email: "" });
const customerId = ref(null);
const isSaving = ref(false);

const readOnly = computed(() => currentOrder.value?.status !== "draft");

// Totales usando la nueva utilidad
const totals = computed(() => calculateOrderTotals(items.value));

// Funciones
const statusLabel = (s) =>
  ({
    draft: "Oferta",
    paid: "Pagada",
    cancelled: "Cancelada",
  }[s] || s);

const statusSeverity = (s) =>
  ({
    draft: "warn",
    paid: "success",
    cancelled: "danger",
  }[s] || "info");

const createOffer = () => {
  currentOrder.value = { status: "draft", number: null };
  items.value = [];
  customer.value = { name: "", phone: "", email: "" };
  customerId.value = null;
  drawerVisible.value = true;
};

const onRowClick = (e) => {
  if (e.originalEvent) {
    e.originalEvent.preventDefault();
  }
  openOffer(e.data);
};

const openOffer = async (order) => {
  try {
    currentOrder.value = order;
    customer.value = {
      name: order.customer_name || "",
      phone: order.customer_phone || "",
      email: order.customer_email || "",
    };
    customerId.value = order.customer_id;
    drawerVisible.value = true;

    items.value = await getOrderItems(order.id);
  } catch (err) {
    handleError(err);
  }
};

const saveOffer = async () => {
  if (!customer.value.name) {
    showWarning("Selecciona un cliente");
    return false;
  }
  if (items.value.length === 0) {
    showWarning("Agrega productos");
    return false;
  }

  try {
    isSaving.value = true;
    let orderId = currentOrder.value.id;
    if (!orderId) {
      const created = await createDraftOrder();
      orderId = created.id;
      currentOrder.value.id = orderId;
    }

    await upsertItems(items.value.map((i) => ({ ...i, order_id: orderId })));

    const updated = await patchOrder(orderId, {
      ...totals.value,
      customer_id: customerId.value,
      customer_name: customer.value.name,
      customer_phone: customer.value.phone,
      customer_email: customer.value.email,
    });

    currentOrder.value = updated;
    showSuccess("Oferta guardada");
    queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
    return true;
  } catch (err) {
    handleError(err);
    return false;
  } finally {
    isSaving.value = false;
  }
};

const handleFacturar = async () => {
  confirm.require({
    message: "¿Convertir esta oferta en factura? Se descontará del stock.",
    header: "Confirmar Facturación",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Sí, facturar",
    rejectLabel: "Cancelar",
    accept: async () => {
      try {
        isSaving.value = true;
        const saved = await saveOffer();
        if (!saved) return;

        await finalizeOrder(currentOrder.value.id);
        showSuccess("Venta facturada exitosamente");
        drawerVisible.value = false;
        queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
      } catch (err) {
        handleError(err);
      } finally {
        isSaving.value = false;
      }
    },
  });
};

const handleCancelar = async () => {
  confirm.require({
    message: "¿Cancelar esta venta? Esta acción no se puede deshacer.",
    header: "Confirmar Cancelación",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Sí, cancelar",
    rejectLabel: "No",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        isSaving.value = true;
        await cancelOrder(currentOrder.value.id);
        showSuccess("Venta cancelada");
        drawerVisible.value = false;
        queryClient.invalidateQueries({ queryKey: ["sales-offers"] });
      } catch (err) {
        handleError(err);
      } finally {
        isSaving.value = false;
      }
    },
  });
};

const handlePrint = async (order, event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
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
  try {
    const its = await getOrderItems(order.id);
    await downloadInvoicePDF({ order, items: its, business });
    showSuccess("PDF descargado correctamente");
  } catch (err) {
    handleError(err);
  }
};
</script>
