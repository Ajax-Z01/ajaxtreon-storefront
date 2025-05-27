import { defineNuxtPlugin } from '#app'
import * as lucide from 'lucide-vue-next'
import type { Component } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  Object.entries(lucide).forEach(([key, component]) => {
    if (
      typeof component === 'object' &&
      component !== null &&
      'name' in component
    ) {
      nuxtApp.vueApp.component(key, component as Component)
    }
  })
})
