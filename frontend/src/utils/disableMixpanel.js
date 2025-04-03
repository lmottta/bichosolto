/**
 * Utilitário para desabilitar/remover o Mixpanel SDK e evitar erros
 * Isto é necessário pois os logs indicam que há alguma biblioteca externa carregando o Mixpanel
 * e gerando erros como "PIN Company Discounts Provider: Error: Invalid data"
 */

// Função para remover uma variável global
const removeGlobalVar = (varName) => {
  try {
    if (window[varName]) {
      console.log(`Desabilitando ${varName} para evitar erros...`);
      window[varName] = undefined;
      delete window[varName];
      return true;
    }
  } catch (e) {
    console.error(`Erro ao tentar remover ${varName}:`, e);
  }
  return false;
};

// Função para remover scripts por ID ou atributos
const removeScriptByContent = (pattern) => {
  try {
    const scripts = document.querySelectorAll('script');
    let removed = 0;
    
    scripts.forEach(script => {
      if (script.src && script.src.match(pattern)) {
        console.log(`Removendo script: ${script.src}`);
        script.parentNode.removeChild(script);
        removed++;
      } else if (script.textContent && script.textContent.match(pattern)) {
        console.log('Removendo script inline Mixpanel');
        script.parentNode.removeChild(script);
        removed++;
      }
    });
    
    return removed > 0;
  } catch (e) {
    console.error('Erro ao tentar remover scripts:', e);
    return false;
  }
};

// Função principal para desabilitar o Mixpanel
const disableMixpanel = () => {
  // Desabilitar a detecção de Do Not Track
  window.dnt = true;
  window.doNotTrack = "1";
  navigator.doNotTrack = "1";
  navigator.msDoNotTrack = "1";
  
  // Lista de nomes relacionados ao Mixpanel a serem removidos
  const targetVars = [
    'mixpanel', 
    'mp_mixpanel_core', 
    'mp_mixpanel_core_instance',
    'PIN'
  ];
  
  // Remover variáveis globais
  targetVars.forEach(removeGlobalVar);
  
  // Remover scripts relacionados
  removeScriptByContent(/mixpanel|PIN|discounts/i);
  
  // Sobrescrever funções problemáticas
  if (window.PIN) {
    window.PIN = {
      ready: () => {},
      companyDiscountsProvider: {
        getDiscounts: () => Promise.resolve([])
      }
    };
  }
  
  // Remover ouvinte de eventos conflitantes
  const removeConflictingEventListeners = () => {
    try {
      // Tenta remover listeners de eventos específicos
      document.removeEventListener('DOMContentLoaded', undefined, true);
    } catch (e) {
      console.error('Erro ao remover event listeners:', e);
    }
  };
  
  removeConflictingEventListeners();
  
  console.log('Mixpanel e componentes relacionados foram desabilitados');
};

// Executar imediatamente
disableMixpanel();

// Executar novamente após o carregamento da página para capturar scripts adicionados dinamicamente
document.addEventListener('DOMContentLoaded', disableMixpanel);

// Verificar periodicamente por novas instâncias
setInterval(disableMixpanel, 5000);

export default disableMixpanel; 