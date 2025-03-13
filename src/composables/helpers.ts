// src/composables/helpers.ts

/**
 * Restituisce l'username salvato in localStorage
 */
export function getSavedUsername(): string {
    return localStorage.getItem('username') || ''
  }
  
  /**
   * Restituisce la password salvata in localStorage
   */
  export function getSavedPassword(): string {
    return localStorage.getItem('password') || ''
  }
  