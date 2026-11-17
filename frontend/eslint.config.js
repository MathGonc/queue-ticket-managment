import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  js.configs.recommended,
  // Mesmo perfil do projeto original (plugin:vue/vue3-essential + eslint:recommended)
  ...pluginVue.configs['flat/essential'],
  {
    // O codigo roda no navegador (o eslint-plugin-vue 10 deixou de declarar
    // window, document, localStorage etc. por conta propria)
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
]
