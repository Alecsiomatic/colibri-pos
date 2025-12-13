// Test script para verificar el flujo de checkout
// Ejecutar en la consola del navegador durante el proceso de checkout

console.log('🧪 INICIANDO TEST DEL FLUJO DE CHECKOUT');

// 1. Verificar estado inicial
console.log('📊 Estado inicial del carrito:', localStorage.getItem('cart'));

// 2. Interceptar la función de redirección
const originalPush = window.history.pushState;
const originalReplace = window.history.replaceState;

let redirections = [];

window.history.pushState = function(...args) {
  console.log('🔄 Router.push interceptado:', args);
  redirections.push({ type: 'push', args });
  return originalPush.apply(this, args);
};

window.history.replaceState = function(...args) {
  console.log('🔄 Router.replace interceptado:', args);
  redirections.push({ type: 'replace', args });
  return originalReplace.apply(this, args);
};

// 3. Interceptar window.location.href
let originalHref = window.location.href;
Object.defineProperty(window.location, 'href', {
  get: function() { return originalHref; },
  set: function(val) {
    console.log('🌐 window.location.href cambio:', val);
    redirections.push({ type: 'location', url: val });
    originalHref = val;
  }
});

// 4. Función para revisar el estado
window.checkCheckoutState = function() {
  console.log('📋 ESTADO ACTUAL DEL CHECKOUT:');
  console.log('- Carrito:', localStorage.getItem('cart'));
  console.log('- URL actual:', window.location.href);
  console.log('- Redirecciones registradas:', redirections);
  console.log('- Elementos en DOM:');
  console.log('  - Botón checkout:', document.querySelector('[type="submit"]:has-text("Confirmar")'));
  console.log('  - Loading state:', document.querySelector('.animate-spin'));
  console.log('  - Error messages:', document.querySelectorAll('[role="alert"]'));
};

// 5. Auto-check cada 2 segundos
const checkInterval = setInterval(() => {
  if (window.location.pathname.includes('/thank-you')) {
    console.log('✅ LLEGAMOS A THANK YOU PAGE!');
    console.log('🎉 Test exitoso - flujo funcionando');
    clearInterval(checkInterval);
  } else if (window.location.pathname === '/menu' && redirections.length > 0) {
    console.log('❌ PROBLEMA: Redirigido al menú instead de thank you');
    console.log('📊 Análisis de redirecciones:', redirections);
    clearInterval(checkInterval);
  }
}, 2000);

console.log('✨ Test script cargado. Procede con el checkout normal.');
console.log('📞 Ejecuta window.checkCheckoutState() en cualquier momento para ver el estado');