import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import {
  HeadlessUiResolver,
  VueUseComponentsResolver,
} from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import Unfonts from 'unplugin-fonts/vite'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    vue(),

    // AutoImport & Components
    AutoImport({
      dts: true,
      imports: ['vue', 'vue-router', '@vueuse/core', 'pinia', 'vitest'],
      eslintrc: {
        enabled: true,
      },
      dirs: ['./src/composables', './src/utils'],
    }),
    Components({
      dts: true,
      resolvers: [
        HeadlessUiResolver({ prefix: '' }),
        IconsResolver({ prefix: '' }),
        VueUseComponentsResolver(),
      ],
    }),

    // Icons & Fonts
    Icons({ autoInstall: true }),
    Unfonts({
      custom: {
        families: [
          {
            name: 'Rubik',
            local: 'Rubik',
            src: './src/assets/fonts/*.ttf',
          },
        ],
        display: 'auto',
        preload: true,
        prefetch: false,
      },
    }),

    tsconfigPaths(),

    // Plugin "configure-token" con doppia logica
    {
      name: 'configure-token',
      enforce: 'pre',
      configureServer(server) {
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              console.log('Richiesta arrivata a:', req.url)

              // Costruiamo la URL
              const fullUrl = new URL(req.originalUrl || req.url, 'http://localhost')

              // 1) Se troviamo ?token=XYZ, impostiamo subito il cookie ccat_user_token
              const tokenParam = fullUrl.searchParams.get('token')
              if (tokenParam) {
                console.log('Trovato token nella query:', tokenParam)
                // Impostiamo il cookie
                res.setHeader('Set-Cookie', `ccat_user_token=${tokenParam}; Path=/;`)
                // Esempio di redirect per rimuovere "?token=..." dall’URL
                res.statusCode = 302
                res.setHeader('Location', '/')
                return res.end()
              }

              // 2) Altrimenti, se troviamo ?username=... e ?password=..., facciamo la fetch
              const user = fullUrl.searchParams.get('username')
              const pass = fullUrl.searchParams.get('password')
              if (user && pass) {
                console.log('username:', user, 'password:', pass)

                // Tentiamo la fetch all'endpoint di autenticazione
                const output = await fetch('http://localhost:1865/auth/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username: user, password: pass }),
                }).then(r => r.json())

                console.log('Risposta dal server di auth:', output)

                // Se otteniamo un access_token, impostiamo il cookie
                if (output?.access_token) {
                  res.setHeader('Set-Cookie', `ccat_user_token=${output.access_token}; Path=/;`)
                } else {
                  console.error('Nessun token ricevuto dal server di auth.')
                }
                // Non facciamo redirect in questo caso, oppure puoi farlo se vuoi
                // Per coerenza, potresti redirigere alla home anche qui:
                /*
                res.statusCode = 302
                res.setHeader('Location', '/')
                return res.end()
                */
              }
            } catch (err) {
              console.error('Errore durante la configurazione token:', err)
            }

            // Se non c’è nulla di “token” o non c’è username/password, passiamo oltre
            next()
          })
        }
      },
    },
  ],

  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [...configDefaults.exclude, 'e2e/*'],
  },

  server: {
    port: 3000,
    open: false,
    host: true
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        minifyInternalExports: true,
        entryFileNames: 'assets/cat.js',
        assetFileNames: info =>
          `assets/${
            info.name?.endsWith('css') ? 'cat' : '[name]'
          }[extname]`,
        chunkFileNames: 'chunk.js',
        manualChunks: () => 'chunk.js',
        generatedCode: {
          preset: 'es2015',
          constBindings: true,
          objectShorthand: true,
        },
      },
    },
  },
})
