// services/storageService.ts

const memoryStore: Record<string, string> = {};
let storageAvailable = false;

/**
 * Verifica se o localStorage está disponível e funcional.
 * Se não estiver, o serviço usará um objeto em memória (memoryStore) como fallback.
 */
const init = () => {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        storageAvailable = true;
        console.log("LocalStorage está disponível. Usando armazenamento persistente.");
    } catch (e) {
        storageAvailable = false;
        console.warn("LocalStorage não está disponível. Usando armazenamento em memória para esta sessão (o progresso será perdido ao fechar o navegador).");
    }
};

const setItem = (key: string, value: string) => {
    if (storageAvailable) {
        localStorage.setItem(key, value);
    } else {
        memoryStore[key] = value;
    }
};

const getItem = (key: string): string | null => {
    if (storageAvailable) {
        return localStorage.getItem(key);
    }
    return memoryStore[key] || null;
};

const removeItem = (key: string) => {
    if (storageAvailable) {
        localStorage.removeItem(key);
    } else {
        delete memoryStore[key];
    }
};

// Inicializa o serviço assim que o módulo é carregado.
init();

export const storageService = {
    setItem,
    getItem,
    removeItem,
    isLocalStorageAvailable: () => storageAvailable,
};
