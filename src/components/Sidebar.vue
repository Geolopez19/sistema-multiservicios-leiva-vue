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

    <nav class="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path" 
        :to="item.path"
        class="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 hover:bg-white/10 hover:translate-x-1 text-indigo-100 hover:text-white group"
        active-class="bg-white text-indigo-600 shadow-lg hover:bg-white hover:translate-x-0"
      >
        <component :is="item.icon" class="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span class="font-medium">{{ item.name }}</span>
      </router-link>

      <div class="mt-4 pt-4 border-t border-indigo-500/30 text-xs font-bold text-indigo-200 uppercase px-4 mb-2 tracking-widest">
        Ventas
      </div>
      <router-link to="/ventas/ofertas" class="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 hover:bg-white/10 hover:translate-x-1 text-indigo-100 hover:text-white group" active-class="bg-white text-indigo-600 shadow-lg hover:bg-white hover:translate-x-0">
        <ShoppingCart class="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span class="font-medium">Ofertas</span>
      </router-link>
      <router-link to="/ventas/facturas" class="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 hover:bg-white/10 hover:translate-x-1 text-indigo-100 hover:text-white group" active-class="bg-white text-indigo-600 shadow-lg hover:bg-white hover:translate-x-0">
        <FileText class="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span class="font-medium">Facturas</span>
      </router-link>
      <router-link to="/ventas/clientes" class="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 hover:bg-white/10 hover:translate-x-1 text-indigo-100 hover:text-white group" active-class="bg-white text-indigo-600 shadow-lg hover:bg-white hover:translate-x-0">
        <Users class="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span class="font-medium">Clientes</span>
      </router-link>
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
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  BarChart3, 
  Users, 
  LogOut,
  FileText
} from 'lucide-vue-next'
import { supabase } from '../lib/supabaseClient'

const menuItems = [
  { name: 'Inventario', path: '/inventario', icon: Package },
  { name: 'Compras', path: '/compras', icon: Truck },
  { name: 'Reportes', path: '/reportes', icon: BarChart3 },
  { name: 'Usuarios', path: '/usuarios', icon: Users },
]

const handleLogout = async () => {
  await supabase.auth.signOut()
}
</script>

