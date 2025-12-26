<template>
  <div
    class="bg-white rounded-xl shadow-md border border-indigo-200 overflow-hidden"
  >
    <div
      class="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-5 py-3 flex justify-between items-center border-b border-indigo-200"
    >
      <div class="flex items-center gap-2">
        <div class="bg-indigo-100 p-1.5 rounded-md">
          <i class="pi pi-user text-indigo-600 text-lg"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800">
          Información del Cliente
        </h3>
      </div>
      <Button
        type="button"
        v-if="!readOnly"
        label="Buscar"
        icon="pi pi-search"
        size="small"
        @click.prevent="showCustomerModal = true"
        class="bg-indigo-600 text-white hover:bg-indigo-700 border-0 shadow-sm text-sm"
      />
    </div>
    <div class="p-4 bg-white">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="flex flex-col gap-1.5">
          <label
            class="text-xs font-bold text-indigo-600 flex items-center gap-1.5"
          >
            <i class="pi pi-user text-xs"></i>
            Nombre Completo
          </label>
          <InputText
            v-model="internalCustomer.name"
            :disabled="readOnly"
            placeholder="Nombre del cliente"
            class="p-2 text-sm w-full"
            @input="emit('update:modelValue', internalCustomer)"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label
            class="text-xs font-bold text-indigo-600 flex items-center gap-1.5"
          >
            <i class="pi pi-phone text-xs"></i>
            Teléfono
          </label>
          <InputText
            v-model="internalCustomer.phone"
            :disabled="readOnly"
            placeholder="Teléfono"
            class="p-2 text-sm w-full"
            @input="emit('update:modelValue', internalCustomer)"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label
            class="text-xs font-bold text-indigo-600 flex items-center gap-1.5"
          >
            <i class="pi pi-envelope text-xs"></i>
            Correo Electrónico
          </label>
          <InputText
            v-model="internalCustomer.email"
            :disabled="readOnly"
            placeholder="Email"
            class="p-2 text-sm w-full"
            @input="emit('update:modelValue', internalCustomer)"
          />
        </div>
      </div>
    </div>

    <!-- Modal de Búsqueda -->
    <Dialog
      v-model:visible="showCustomerModal"
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
          <div class="bg-indigo-600 p-2 rounded-lg shadow-md">
            <i class="pi pi-users text-white text-xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-800">
              Seleccionar Cliente
            </h3>
            <p class="text-sm text-slate-500">
              Busca por nombre o teléfono para asignar a la venta
            </p>
          </div>
        </div>
      </template>

      <div class="space-y-4 pt-4">
        <div class="px-4">
          <IconField iconPosition="left" class="w-full">
            <InputIcon class="pi pi-search text-indigo-500 z-10" />
            <InputText
              v-model="customerSearchText"
              placeholder="Buscar clie... (ej: Juan, 8888-8888)"
              class="w-full pl-10 py-3 text-lg bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-xl transition-all shadow-sm"
              @input="onCustomerSearch"
              autofocus
            />
          </IconField>
        </div>

        <div
          v-if="foundCustomers.length > 0"
          class="bg-white border-y border-slate-200 overflow-hidden"
        >
          <Listbox
            :options="foundCustomers"
            optionLabel="name"
            class="w-full max-h-[50vh] overflow-auto custom-scrollbar"
            @change="selectCustomer"
            listStyle="padding: 0"
            :pt="{
              item: { class: 'p-0 border-0 focus:bg-transparent w-full' },
              list: { class: 'p-0 w-full' },
            }"
          >
            <template #option="{ option, selected }">
              <div
                class="w-full p-5 px-6 transition-all duration-200 cursor-pointer border-b border-slate-100 last:border-0 group border-l-4"
                :class="[
                  selected
                    ? 'bg-indigo-50 border-l-indigo-500'
                    : 'bg-white hover:bg-slate-50 border-l-transparent',
                ]"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-110 transition-transform"
                  >
                    {{ option.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1">
                    <div
                      class="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors"
                    >
                      {{ option.name }}
                    </div>
                    <div
                      class="text-sm text-slate-500 flex flex-wrap gap-x-6 gap-y-1 mt-1"
                    >
                      <span
                        v-if="option.phone"
                        class="flex items-center gap-1.5"
                        ><i class="pi pi-phone text-indigo-400"></i>
                        {{ option.phone }}</span
                      >
                      <span
                        v-if="option.email"
                        class="flex items-center gap-1.5"
                        ><i class="pi pi-envelope text-indigo-400"></i>
                        {{ option.email }}</span
                      >
                      <span v-if="option.ruc" class="flex items-center gap-1.5"
                        ><i class="pi pi-id-card text-indigo-400"></i>
                        {{ option.ruc }}</span
                      >
                    </div>
                  </div>
                  <i
                    class="pi pi-chevron-right text-slate-300 group-hover:text-indigo-500 transition-colors"
                  ></i>
                </div>
              </div>
            </template>
          </Listbox>
        </div>

        <!-- Empty States Elegantes -->
        <div
          v-else-if="customerSearchText.length >= 2"
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="bg-slate-100 p-4 rounded-full mb-3">
            <i class="pi pi-search-minus text-4xl text-slate-400"></i>
          </div>
          <p class="text-lg font-medium text-slate-600">
            No encontramos coincidencias
          </p>
          <p class="text-slate-400">Intenta con otro nombre o número</p>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <div class="bg-indigo-50 p-4 rounded-full mb-3 animate-pulse">
            <i class="pi pi-search text-4xl text-indigo-300"></i>
          </div>
          <p class="text-lg font-medium text-slate-600">Empieza a escribir</p>
          <p class="text-slate-400">Busca tus clientes rápidamente</p>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { searchCustomers } from "../../services/clientes";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Dialog from "primevue/dialog";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import Listbox from "primevue/listbox";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "select"]);

const internalCustomer = ref({ ...props.modelValue });
const showCustomerModal = ref(false);
const customerSearchText = ref("");
const foundCustomers = ref([]);

watch(
  () => props.modelValue,
  (newVal) => {
    internalCustomer.value = { ...newVal };
  },
  { deep: true }
);

const onCustomerSearch = async () => {
  if (customerSearchText.value.length < 2) return;
  foundCustomers.value = await searchCustomers(customerSearchText.value);
};

const selectCustomer = (e) => {
  const c = e.value;
  if (!c) return;
  internalCustomer.value = {
    name: c.name,
    phone: c.phone || "",
    email: c.email || "",
  };
  emit("update:modelValue", internalCustomer.value);
  emit("select", c);
  showCustomerModal.value = false;
  customerSearchText.value = "";
  foundCustomers.value = [];
};
</script>
