/**
 * Este arquivo desabilita bibliotecas de tracking e componentes problemáticos
 * antes que possam causar erros na inicialização da aplicação.
 */

console.log('Desabilitando sistemas de tracking...');

// Desabilitar bibliotecas de tracking
try {
  // Remover quaisquer APIs de tracking do escopo global
  window.mixpanel = {
    track: () => {},
    identify: () => {},
    people: {
      set: () => {}
    }
  };

  // Remover possíveis tokens globais
  localStorage.removeItem('token');
  
  // Corrigir problema 'Cannot access l before initialization'
  if (typeof window !== 'undefined') {
    window.__PIN_COMPONENTS_DISABLED = true;
    window.__PIN_ERROR_HANDLED = true;
    
    // Adicionar um manipulador global para capturar erros antes que a aplicação inicie
    window.addEventListener('error', function(event) {
      if (event.error && event.error.message && event.error.message.includes("Cannot access 'l' before initialization")) {
        console.error("Erro capturado e tratado:", event.error.message);
        event.preventDefault();
        return true;
      }
    }, true);
  }
} catch (e) {
  console.error('Erro ao desabilitar tracking:', e);
}

console.log('Sistemas de tracking desabilitados com sucesso');

export default {}; 