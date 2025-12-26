<template>
  <div
    class="bg-white rounded-xl shadow-md border border-purple-200 overflow-hidden"
  >
    <div
      class="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 px-5 py-3 flex justify-between items-center border-b border-purple-200"
    >
      <div class="flex items-center gap-2">
        <div class="bg-purple-100 p-1.5 rounded-md">
          <i class="pi pi-shopping-cart text-purple-600 text-lg"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800">Productos</h3>
        <span
          v-if="items.length > 0"
          class="bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm"
        >
          {{ items.length }}
        </span>
      </div>
      <Button
        type="button"
        v-if="!readOnly"
        label="Agregar"
        icon="pi pi-plus"
        size="small"
        @click.prevent="showProductModal = true"
        class="bg-purple-600 text-white hover:bg-purple-700 border-0 shadow-sm text-sm"
      />
    </div>
    <div class="p-4 bg-white">
      <DataTable
        :value="items"
        class="bg-white p-datatable-sm"
        v-if="items.length > 0"
        stripedRows
        size="small"
      >
        <Column field="product_name" header="Producto" class="font-semibold">
          <template #body="{ data }">
            <span class="font-semibold text-slate-900 text-sm">{{
              data.product_name
            }}</span>
          </template>
        </Column>
        <Column field="qty" header="Cant." style="width: 100px">
          <template #body="{ data }">
            <InputNumber
              v-model="data.qty"
              :disabled="readOnly"
              :min="1"
              @update:modelValue="updateItemTotal(data)"
              class="w-full p-inputtext-sm"
            />
          </template>
        </Column>
        <Column field="unit_price" header="Precio" style="width: 140px">
          <template #body="{ data }">
            <InputNumber
              v-model="data.unit_price"
              :disabled="readOnly"
              mode="currency"
              currency="NIO"
              locale="es-NI"
              @update:modelValue="updateItemTotal(data)"
              class="w-full p-inputtext-sm"
            />
          </template>
        </Column>
        <Column field="tax_rate" header="IVA" style="width: 70px">
          <template #body="{ data }">
            <span class="text-slate-600 text-xs">{{ data.tax_rate }}%</span>
          </template>
        </Column>
        <Column field="line_total" header="Total" style="width: 130px">
          <template #body="{ data }">
            <span class="font-bold text-green-600 text-sm">{{
              formatCurrency(data.line_total)
            }}</span>
          </template>
        </Column>
        <Column v-if="!readOnly" header="" style="width: 60px">
          <template #body="{ index }">
            <Button
              type="button"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              @click.prevent="removeItem(index)"
              v-tooltip.top="'Eliminar'"
              class="hover:bg-red-50"
            />
          </template>
        </Column>
      </DataTable>
      <div
        v-else
        class="flex flex-col items-center py-8 bg-purple-50 rounded-lg border border-dashed border-purple-300"
      >
        <i class="pi pi-shopping-cart text-4xl text-purple-300 mb-2"></i>
        <p class="text-base font-semibold text-slate-700">Carrito vacío</p>
        <Button
          v-if="!readOnly"
          type="button"
          label="Agregar Producto"
          icon="pi pi-plus"
          size="small"
          @click.prevent="showProductModal = true"
          class="bg-purple-600 text-white hover:bg-purple-700 border-0 shadow-sm mt-3"
        />
      </div>
    </div>

    <!-- Modal de Productos -->
    <Dialog
      v-model:visible="showProductModal"
      modal
      class="w-full max-w-3xl modern-dialog"
      :dismissableMask="true"
      :pt="{
        header: { class: 'py-3 px-4' },
        content: { class: 'p-0' },
      }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="bg-purple-600 p-2 rounded-lg shadow-md">
            <i class="pi pi-box text-white text-xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-800">
              Catálogo de Productos
            </h3>
            <p class="text-sm text-slate-500">
              Selecciona items para agregar a la oferta
            </p>
          </div>
        </div>
      </template>

      <div class="space-y-4 pt-4">
        <div class="px-4">
          <IconField iconPosition="left" class="w-full">
            <InputIcon class="pi pi-search text-purple-500 z-10" />
            <InputText
              v-model="productSearchText"
              placeholder="Buscar productos por nombre, código..."
              class="w-full pl-10 py-3 text-lg bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-purple-500 rounded-xl transition-all shadow-sm"
              @input="onProductSearch"
              autofocus
            />
          </IconField>
        </div>

        <div
          v-if="foundProducts.length > 0"
          class="bg-white border-y border-slate-200 overflow-hidden"
        >
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
                class="w-full p-5 px-6 transition-all duration-200 cursor-pointer border-b border-slate-100 last:border-0 group relative border-l-4"
                :class="[
                  selected
                    ? 'bg-purple-50 border-l-purple-500'
                    : 'bg-white hover:bg-slate-50 border-l-transparent',
                ]"
              >
                <div class="flex items-center gap-6 w-full">
                  <!-- Info Column -->
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span
                        class="font-bold text-slate-900 text-lg group-hover:text-purple-700 transition-colors"
                        >{{ option.nombre }}</span
                      >
                      <span
                        v-if="option.codigo"
                        class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono border border-slate-200"
                      >
                        {{ option.codigo }}
                      </span>
                    </div>
                    <p
                      v-if="option.descripcion"
                      class="text-sm text-slate-500 line-clamp-2 leading-relaxed"
                    >
                      {{ option.descripcion }}
                    </p>
                  </div>

                  <!-- Actions/Price Column -->
                  <div class="flex items-center gap-6">
                    <div class="flex flex-col items-end gap-1.5 min-w-[120px]">
                      <span
                        class="text-xl font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100"
                      >
                        {{ formatCurrency(option.precio) }}
                      </span>

                      <div
                        :class="[
                          'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border',
                          option.stock > 0
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                            : 'text-rose-600 bg-rose-50 border-rose-100',
                        ]"
                      >
                        <i
                          class="pi"
                          :class="
                            option.stock > 0
                              ? 'pi-check-circle'
                              : 'pi-times-circle'
                          "
                        ></i>
                        <span>Stock: {{ option.stock }}</span>
                      </div>
                    </div>

                    <!-- Add Indicator -->
                    <div
                      class="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 -mr-2"
                    >
                      <i class="pi pi-plus text-lg"></i>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Listbox>
        </div>

        <!-- Empty States -->
        <div
          v-else-if="productSearchText.length >= 2"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="bg-slate-100 p-4 rounded-full mb-3">
            <i class="pi pi-box text-4xl text-slate-400"></i>
          </div>
          <p class="text-lg font-medium text-slate-600">
            No encontramos productos
          </p>
          <p class="text-slate-400">Intenta con otros términos de búsqueda</p>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="bg-purple-50 p-4 rounded-full mb-3 animate-pulse">
            <i class="pi pi-search text-4xl text-purple-300"></i>
          </div>
          <p class="text-lg font-medium text-slate-600">
            Busca en el inventario
          </p>
          <p class="text-slate-400">Escribe nombre o código del producto</p>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { getProductos } from "../../services/productos";
import { formatCurrency } from "../../utils/calculations";
import { IVA_PORCENTAJE } from "../../constants";

import Button from "primevue/button";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputNumber from "primevue/inputnumber";
import Dialog from "primevue/dialog";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import Listbox from "primevue/listbox";
import Tooltip from "primevue/tooltip";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:items"]);

const vTooltip = Tooltip;

const showProductModal = ref(false);
const productSearchText = ref("");
const foundProducts = ref([]);

const onProductSearch = async () => {
  if (productSearchText.value.length < 2) return;
  const res = await getProductos({ search: productSearchText.value });
  foundProducts.value = res.data;
};

const addProduct = (e) => {
  const p = e.value;
  if (!p) return;

  const newItems = [...props.items];
  const existing = newItems.find((i) => i.product_id === p.id);

  if (existing) {
    existing.qty++;
    updateItemTotal(existing);
  } else {
    const qty = 1;
    const unit_price = Number(p.precio) || 0;
    const tax_rate = IVA_PORCENTAJE;
    const base = qty * unit_price;
    newItems.push({
      id: crypto.randomUUID(),
      product_id: p.id,
      product_name: p.nombre,
      qty,
      unit_price,
      tax_rate,
      line_total: base + base * (tax_rate / 100),
    });
  }

  emit("update:items", newItems);
  showProductModal.value = false;
  productSearchText.value = "";
  foundProducts.value = [];
};

const updateItemTotal = (item) => {
  const base = (item.qty || 0) * (item.unit_price || 0);
  item.line_total = base + base * ((item.tax_rate || 0) / 100);
  // Emit update to trigger reactivity if needed by parent, though object mutation might be enough for local vue state
  emit("update:items", [...props.items]);
};

const removeItem = (index) => {
  const newItems = [...props.items];
  newItems.splice(index, 1);
  emit("update:items", newItems);
};
</script>
