/**
 * SafeStorage - Uma camada de abstração para armazenamento seguro
 * que funciona mesmo quando localStorage está bloqueado ou em modo privado
 */

// Fallback para quando localStorage não está disponível
const memoryStorage = {
  data: new Map(),
  getItem: (key) => memoryStorage.data.get(key) || null,
  setItem: (key, value) => memoryStorage.data.set(key, String(value)),
  removeItem: (key) => memoryStorage.data.delete(key),
  clear: () => memoryStorage.data.clear()
};

// Verificar se localStorage está disponível
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    const testResult = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return testResult === testKey;
  } catch (e) {
    console.warn('LocalStorage não está disponível, usando memória:', e);
    return false;
  }
};

// Escolher o mecanismo de armazenamento
const storage = isLocalStorageAvailable() ? localStorage : memoryStorage;

// Wrapper com validação de sessão e expiração
const SafeStorage = {
  // Obter um item com validação de expiração
  getItem: (key) => {
    try {
      const rawValue = storage.getItem(key);
      
      if (!rawValue) return null;
      
      // Verificar se é um item com metadados
      if (rawValue.startsWith('{') && rawValue.includes('"__expires"')) {
        try {
          const item = JSON.parse(rawValue);
          
          // Verificar expiração
          if (item.__expires && item.__expires < Date.now()) {
            console.log(`Item expirado: ${key}`);
            SafeStorage.removeItem(key);
            return null;
          }
          
          return item.value;
        } catch (e) {
          // Se não for um JSON válido, retornar o valor bruto
          return rawValue;
        }
      }
      
      return rawValue;
    } catch (e) {
      console.error(`Erro ao obter item ${key}:`, e);
      return null;
    }
  },
  
  // Armazenar um item com opção de expiração
  setItem: (key, value, options = {}) => {
    try {
      // Se ttl (time to live) for definido, adicionar data de expiração
      if (options.ttl) {
        const item = {
          value: value,
          __expires: Date.now() + options.ttl * 1000
        };
        storage.setItem(key, JSON.stringify(item));
      } else {
        storage.setItem(key, value);
      }
      
      // Disparar evento para sinalizar a mudança
      dispatchStorageEvent(key, value);
      return true;
    } catch (e) {
      console.error(`Erro ao salvar item ${key}:`, e);
      return false;
    }
  },
  
  // Remover um item
  removeItem: (key) => {
    try {
      storage.removeItem(key);
      
      // Disparar evento para sinalizar a remoção
      dispatchStorageEvent(key, null);
      return true;
    } catch (e) {
      console.error(`Erro ao remover item ${key}:`, e);
      return false;
    }
  },
  
  // Limpar todo o armazenamento
  clear: () => {
    try {
      storage.clear();
      return true;
    } catch (e) {
      console.error('Erro ao limpar armazenamento:', e);
      return false;
    }
  },
  
  // Extensão para armazenar objetos JSON
  setJSON: (key, value, options = {}) => {
    try {
      return SafeStorage.setItem(key, JSON.stringify(value), options);
    } catch (e) {
      console.error(`Erro ao salvar JSON ${key}:`, e);
      return false;
    }
  },
  
  // Extensão para recuperar objetos JSON
  getJSON: (key) => {
    try {
      const value = SafeStorage.getItem(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (e) {
      console.error(`Erro ao recuperar JSON ${key}:`, e);
      return null;
    }
  }
};

// Helper para disparar eventos de armazenamento
function dispatchStorageEvent(key, newValue) {
  try {
    // Criar um evento personalizado
    const event = new CustomEvent('safestorage', {
      detail: { key, newValue }
    });
    window.dispatchEvent(event);
  } catch (e) {
    console.error('Erro ao disparar evento de armazenamento:', e);
  }
}

// Adicionar listener para escutar eventos reais do localStorage de outras abas
if (isLocalStorageAvailable()) {
  window.addEventListener('storage', (event) => {
    // Replicar o evento storage como um evento safestorage
    const customEvent = new CustomEvent('safestorage', {
      detail: { key: event.key, newValue: event.newValue }
    });
    window.dispatchEvent(customEvent);
  });
}

export default SafeStorage; 