import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore'

declare module '#app' {
  interface NuxtApp {
    $auth: Auth;
    $db: Firestore;
    
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $auth: Auth;
    $db: Firestore;
  }
}
