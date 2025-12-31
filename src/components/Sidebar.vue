<template>
  <aside class="w-64 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white flex flex-col h-screen fixed left-0 top-0 shadow-2xl z-50">
    <!-- Logo/Header -->
    <div class="p-6 flex items-center gap-3 border-b border-indigo-500/30">
      <div class="bg-white p-2 rounded-xl shadow-lg">
        <Package class="w-6 h-6 text-indigo-600" />
      </div>
      <div class="flex flex-col">
        <span class="text-xl font-bold tracking-tight">Leiva Multi</span>
        <span class="text-xs text-indigo-200">Sistema de Gestión</span>
      </div>
    </div>

    <nav class="flex-1 p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      <div v-for="(group, index) in navigation" :key="index" class="flex flex-col gap-2">
        <div 
          v-if="group.title" 
          class="text-xs font-bold text-indigo-200 uppercase px-4 tracking-widest"
        >
          {{ group.title }}
        </div>
        
        <router-link 
          v-for="item in group.items" 
          :key="item.path" 
          :to="item.path"
          class="flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all duration-200 text-indigo-100 hover:text-white hover:bg-white/10 group relative"
          active-class="bg-white/10 text-white font-semibold shadow-inner"
        >
          <component 
            :is="item.icon" 
            class="w-5 h-5 transition-transform group-hover:scale-110" 
            :class="{ 'text-white': $route.path.startsWith(item.path), 'text-indigo-200 group-hover:text-white': !$route.path.startsWith(item.path) }"
          />
          <span class="font-medium">{{ item.name }}</span>
          
          <!-- Indicator for active state -->
          <div 
            v-if="$route.path.startsWith(item.path)" 
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-md shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          ></div>
        </router-link>
      </div>
    </nav>

    <div class="p-4 border-t border-indigo-500/30">
      <button 
        @click="handleLogout" 
        class="w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 hover:bg-red-500/20 text-indigo-100 hover:text-white hover:scale-105 group"
      >
        <LogOut class="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span class="font-medium">Cerrar Sesión</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  BarChart3, 
  Users, 
  LogOut,
  FileText
} from 'lucide-vue-next'
import { supabase } from '../lib/supabaseClient'

const navigation = [
  {
    title: 'Principal',
    items: [
      { name: 'Inventario', path: '/inventario', icon: Package },
      { name: 'Compras', path: '/compras', icon: Truck },
    ]
  },
  {
    title: 'Ventas',
    items: [
      { name: 'Ofertas', path: '/ventas/ofertas', icon: ShoppingCart },
      { name: 'Facturas', path: '/ventas/facturas', icon: FileText },
      { name: 'Clientes', path: '/ventas/clientes', icon: Users },
    ]
  },
  {
    title: 'Administración',
    items: [
      { name: 'Reportes', path: '/reportes', icon: BarChart3 },
      { name: 'Usuarios', path: '/usuarios', icon: Users },
    ]
  }
]

const handleLogout = async () => {
  await supabase.auth.signOut()
}
</script>

