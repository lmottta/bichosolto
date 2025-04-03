/**
 * Utilitário para desabilitar/remover o Mixpanel SDK e evitar erros
 * 
 * Abordagem revisada que NÃO tenta modificar propriedades somente leitura do navegador
 */

// Função para remover uma variável global
const removeGlobalVar = (varName) => {
  try {
    // Verificar se a variável existe primeiro
    if (typeof window[varName] !== 'undefined') {
      console.log(`Desabilitando ${varName} para evitar erros...`);
      
      // Abordagem 1: Sobrescrever com um objeto mock
      if (varName === 'mixpanel' || varName === 'PIN') {
        // Criar um mock para evitar erros quando o código tentar acessar métodos
        window[varName] = {
          track: () => {},
          track_links: () => {},
          track_forms: () => {},
          identify: () => {},
          alias: () => {},
          init: () => {},
          register: () => {},
          register_once: () => {},
          people: {
            set: () => {},
            set_once: () => {},
            increment: () => {},
            append: () => {},
            track_charge: () => {},
            clear_charges: () => {}
          },
          ready: (fn) => {
            if (typeof fn === 'function') setTimeout(fn, 10);
            return Promise.resolve();
          },
          // PIN específico
          companyDiscountsProvider: {
            getDiscounts: () => Promise.resolve([])
          }
        };
      } else {
        // Abordagem 2: Tentar esvaziar a variável
        try {
          window[varName] = undefined;
        } catch (e) {
          console.log(`Não foi possível modificar ${varName}, usando proxy...`);
        }
      }
      
      return true;
    }
  } catch (e) {
    console.error(`Erro ao tentar remover ${varName}:`, e);
  }
  return false;
};

// Função para sobrescrever funcionalidades do Mixpanel
const mockMixpanelFunctions = () => {
  try {
    // Verificar se o objeto Mixpanel foi carregado depois
    const mixpanelDesc = Object.getOwnPropertyDescriptor(window, 'mixpanel');
    
    // Se existe e é um getter/setter, tentamos substituí-lo
    if (mixpanelDesc && mixpanelDesc.configurable) {
      let _internal = {
        track: () => {},
        identify: () => {},
        alias: () => {},
        people: {
          set: () => {},
          track_charge: () => {}
        },
        // Métodos adicionais...
        init: () => _internal
      };
      
      Object.defineProperty(window, 'mixpanel', {
        configurable: true,
        get: function() { return _internal; },
        set: function(val) { 
          console.log('Tentativa de redefinir mixpanel interceptada');
          // Permitir a redefinição mas sobrescrever funcionalidades
          _internal = {
            ...(typeof val === 'object' ? val : {}),
            track: () => {},
            identify: () => {},
            people: {
              ...(val && val.people ? val.people : {}),
              set: () => {},
              track_charge: () => {}
            }
          };
        }
      });
    }
    
    // Mesmo para PIN
    const pinDesc = Object.getOwnPropertyDescriptor(window, 'PIN');
    if (pinDesc && pinDesc.configurable) {
      // Criar um objeto PIN mock
      const pinMock = {
        ready: (fn) => {
          if (typeof fn === 'function') setTimeout(fn, 10);
          return Promise.resolve();
        },
        companyDiscountsProvider: {
          getDiscounts: () => Promise.resolve([])
        }
      };
      
      Object.defineProperty(window, 'PIN', {
        configurable: true,
        get: function() { return pinMock; }
      });
    }
  } catch (e) {
    console.error('Erro ao tentar substituir funcionalidades do Mixpanel:', e);
  }
};

// Função para interceptar e desabilitar scripts de rastreamento
const interceptTrackingScripts = () => {
  // Hook na API de scripts para interceptar carregamentos futuros
  try {
    const originalCreateElement = document.createElement.bind(document);
    
    // Sobrescrever createElement para interceptar novos scripts
    document.createElement = function(tagName) {
      const element = originalCreateElement(tagName);
      
      if (tagName.toLowerCase() === 'script') {
        // Observar quando o src for definido
        const originalSetAttribute = element.setAttribute.bind(element);
        element.setAttribute = function(name, value) {
          if (name === 'src' && typeof value === 'string' && 
              (value.includes('mixpanel') || value.includes('pin.js'))) {
            console.log(`Bloqueando carregamento de script de rastreamento: ${value}`);
            // Redirecionar para script vazio em vez de bloquear completamente
            return originalSetAttribute.call(this, 'src', 'data:text/javascript,console.log("Script de rastreamento bloqueado");');
          }
          return originalSetAttribute.call(this, name, value);
        };
      }
      
      return element;
    };
  } catch (e) {
    console.error('Erro ao tentar interceptar scripts:', e);
  }
};

// Função para prevenir e capturar erros relacionados ao Mixpanel
const setupGlobalErrorHandlers = () => {
  // Capturar erros de promessas rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    // Verificar se o erro está relacionado ao Mixpanel ou PIN
    const errorStr = String(event.reason || '');
    if (errorStr.includes('mixpanel') || 
        errorStr.includes('PIN') || 
        errorStr.includes('Failed to fetch')) {
      console.log('Interceptando erro de promessa relacionado a tracking:', errorStr);
      event.preventDefault(); // Prevenir propagação
      event.stopPropagation();
    }
  });
  
  // Capturar erros globais
  window.addEventListener('error', (event) => {
    // Verificar se é um erro de script de terceiros
    const target = event.target || {};
    const errorMsg = event.message || '';
    
    if (target.tagName === 'SCRIPT' || 
        errorMsg.includes('mixpanel') || 
        errorMsg.includes('PIN')) {
      console.log('Interceptando erro de script de tracking:', errorMsg);
      event.preventDefault();
      event.stopPropagation();
      return true; // Indicar que o erro foi tratado
    }
  }, true);
};

// Função principal para desabilitar o Mixpanel
const disableMixpanel = () => {
  console.log('Desabilitando sistemas de tracking...');
  
  // Lista de nomes relacionados ao tracking a serem tratados
  const targetVars = [
    'mixpanel', 
    'mp_mixpanel_core', 
    'mp_mixpanel_core_instance',
    'PIN'
  ];
  
  // Remover ou substituir variáveis globais
  targetVars.forEach(removeGlobalVar);
  
  // Sobrescrever funções do Mixpanel
  mockMixpanelFunctions();
  
  // Interceptar carregamento de novos scripts
  interceptTrackingScripts();
  
  // Configurar handlers para capturar erros
  setupGlobalErrorHandlers();
  
  console.log('Sistemas de tracking desabilitados com sucesso');
};

// Executar imediatamente - mas envolvido em try/catch para evitar falhas
try {
  disableMixpanel();
} catch (e) {
  console.error('Falha ao desabilitar tracking:', e);
}

// Executar novamente após carregamento completo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try { disableMixpanel(); } catch (e) { console.error(e); }
  });
} else {
  // Se o DOM já está carregado
  setTimeout(() => {
    try { disableMixpanel(); } catch (e) { console.error(e); }
  }, 100);
}

// Verificar periodicamente - com baixa frequência para evitar sobrecarga
const checkInterval = setInterval(() => {
  try { disableMixpanel(); } catch (e) { clearInterval(checkInterval); }
}, 10000);

export default disableMixpanel; 