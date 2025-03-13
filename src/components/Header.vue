<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Riferimenti reattivi
const username = ref('')
const password = ref('')
const token = ref<string | null>(null)

// È loggato se c'è un token
const isLoggedIn = computed(() => !!token.value)

// Esempio di can()
// In produzione, potresti usare il tuo "usePerms()" e destructurare "can"
function can(action: string, resource: string) {
  // Qui semplifichiamo e restituiamo sempre true
  return true
}

// Se puoi leggere/listare certe risorse, mostri la voce "Settings"
const showSettings = computed(
  () =>
    can('READ', 'LLM') ||
    can('READ', 'USERS') ||
    can('READ', 'EMBEDDER') ||
    can('READ', 'STATUS') ||
    can('LIST', 'LLM') ||
    can('LIST', 'USERS') ||
    can('LIST', 'EMBEDDER') ||
    can('LIST', 'STATUS'),
)

/**
 * handleSave():
 *  1) facciamo la fetch all'endpoint /auth/token con username e password
 *  2) salviamo user, pass e token in localStorage
 *  3) redirect con ?token=... (niente username/password)
 */
 async function handleSave() {
  try {
    const backendHost = `${window.location.hostname}:1865`; // Dinamico: ottiene l'host
    const response = await fetch(`http://${backendHost}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });
    if (!response.ok) {
      throw new Error('Errore nella richiesta di autenticazione');
    }
    const data = await response.json();
    const accessToken = data.access_token;
    if (!accessToken) {
      throw new Error('Nessun token nella risposta');
    }

    // Salvataggio in localStorage
    localStorage.setItem('username', username.value);
    localStorage.setItem('password', password.value);
    localStorage.setItem('token', accessToken);

    // Aggiorniamo il nostro ref
    token.value = accessToken;

    // Redirect con token
    window.location.href = `http://${window.location.hostname}:3000?token=${accessToken}`;
  } catch (err) {
    console.error('Errore di login:', err);
  }
}


/**
 * handleLogout():
 *  - rimuove da localStorage username, password, token
 *  - resetta i ref
 *  - se vuoi, rimuove eventuali cookie 
 */
 function handleLogout() {
  localStorage.removeItem('username')
  localStorage.removeItem('password')
  localStorage.removeItem('token')

  username.value = ''
  password.value = ''
  token.value = null

  // (Eventuale) rimozione cookie
  document.cookie = 'ccat_user_token=; Max-Age=0; Path=/;'

  // Al termine, forziamo il refresh della pagina
  window.location.reload()
}


/**
 * onMounted():
 *  - Recupera username, password, token da localStorage
 *  - Se c'è un token, isLoggedIn sarà true
 */
onMounted(() => {
  const savedUsername = localStorage.getItem('username')
  const savedPassword = localStorage.getItem('password')
  const savedToken = localStorage.getItem('token')

  if (savedUsername) username.value = savedUsername
  if (savedPassword) password.value = savedPassword
  if (savedToken) token.value = savedToken
})
</script>

<template>
  <div class="navbar sticky top-0 z-30 min-h-fit bg-base-100 font-medium shadow-md md:px-[5%] lg:px-[10%]">
    <!-- NAVBAR START -->
    <div class="navbar-start flex items-center gap-4">
      <!-- Form di Login o pulsante Logout -->
      <div v-if="!isLoggedIn" class="flex flex-wrap items-center gap-2">
        <input
          id="username-input"
          type="text"
          placeholder="Username"
          class="input input-bordered input-sm w-full md:w-auto max-w-xs"
          v-model="username"
        />
        <input
          id="password-input"
          type="password"
          placeholder="Password"
          class="input input-bordered input-sm w-full md:w-auto max-w-xs"
          v-model="password"
        />
        <button
          id="save-button"
          class="btn btn-primary btn-sm w-full md:w-auto"
          @click="handleSave"
        >
          Save
        </button>
      </div>

      <div v-else>
        <button class="btn btn-error btn-sm w-full md:w-auto" @click="handleLogout">
          Logout
        </button>
      </div>

      <!-- Menu hamburger (visibile solo su mobile) -->
      <Menu v-slot="{ open }" as="div" class="relative inline-block rounded-md md:hidden">
        <MenuButton class="btn btn-circle btn-ghost" title="Menu">
          <heroicons-x-mark-20-solid v-if="open" class="swap-on size-6" />
          <heroicons-bars-3-solid v-else class="swap-off size-6" />
        </MenuButton>
        <Transition
          enterActiveClass="transition duration-200 ease-out"
          enterFromClass="transform scale-90 opacity-0"
          enterToClass="transform scale-100 opacity-100"
          leaveActiveClass="transition duration-200 ease-in"
          leaveFromClass="transform scale-100 opacity-100"
          leaveToClass="transform scale-90 opacity-0"
        >
          <MenuItems
            as="ul"
            class="menu menu-md absolute left-0 z-50 mt-4 w-min origin-top-left gap-2 whitespace-nowrap rounded-md bg-base-100 shadow-xl"
          >
            <MenuItem v-if="can('READ', 'CONVERSATION') || can('LIST', 'CONVERSATION')" as="li">
              <RouterLink to="/">
                <heroicons-home-20-solid class="size-4" /> Home
              </RouterLink>
            </MenuItem>
            <MenuItem v-if="can('READ', 'MEMORY') || can('LIST', 'MEMORY')" as="li">
              <RouterLink :key="$route.fullPath" :to="{ path: '/memory' }">
                <ph-brain-fill class="size-4" /> Memory
              </RouterLink>
            </MenuItem>
            <MenuItem v-if="can('READ', 'PLUGINS') || can('LIST', 'PLUGINS')" as="li">
              <RouterLink :key="$route.fullPath" :to="{ path: '/plugins' }">
                <ph-plug-fill class="size-4" /> Plugins
              </RouterLink>
            </MenuItem>
            <MenuItem v-if="showSettings" as="li">
              <RouterLink
                :key="$route.fullPath"
                :to="{ path: '/settings' }"
                :class="{ active: $route.path === '/settings' }"
              >
                <heroicons-cog-6-tooth-20-solid class="size-4" /> Settings
              </RouterLink>
            </MenuItem>
            <MenuItem as="li">
              <a href="https://cheshire-cat-ai.github.io/docs/" target="_blank">
                <heroicons-document-text-solid class="size-4" /> Docs
              </a>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
    <!-- NAVBAR CENTER -->
    <div class="navbar-center">
      <!-- Logo / Link home su mobile -->
      <RouterLink to="/" class="shrink-0 !bg-transparent md:hidden">
        <!-- Eventuale logo qui -->
      </RouterLink>

      <!-- Menu orizzontale (visibile su desktop) -->
      <ul class="menu menu-horizontal menu-md hidden gap-4 p-0 md:flex">
        <li v-if="can('READ', 'CONVERSATION') || can('LIST', 'CONVERSATION')">
          <RouterLink to="/">
            <heroicons-home-20-solid class="size-4" /> Home
          </RouterLink>
        </li>
        <li v-if="can('READ', 'MEMORY') || can('LIST', 'MEMORY')">
          <RouterLink :key="$route.fullPath" :to="{ path: '/memory' }">
            <ph-brain-fill class="size-4" /> Memory
          </RouterLink>
        </li>
        <li v-if="can('READ', 'PLUGINS') || can('LIST', 'PLUGINS')">
          <RouterLink :key="$route.fullPath" :to="{ path: '/plugins' }">
            <ph-plug-fill class="size-4" /> Plugins
          </RouterLink>
        </li>
        <li v-if="showSettings">
          <RouterLink
            :key="$route.fullPath"
            :to="{ path: '/settings' }"
            :class="{ active: $route.path === '/settings' }"
          >
            <heroicons-cog-6-tooth-20-solid class="size-4" /> Settings
          </RouterLink>
        </li>
        <li>
          <a href="https://cheshire-cat-ai.github.io/docs/" target="_blank">
            <heroicons-document-text-solid class="size-4" /> Docs
          </a>
        </li>
      </ul>
    </div>
    <!-- NAVBAR END -->
    <div class="navbar-end">
      <ThemeButton />
    </div>
  </div>
</template>
