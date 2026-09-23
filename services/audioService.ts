// services/audioService.ts

let audioContext: AudioContext | null = null;
let currentMusicSource: AudioBufferSourceNode | null = null;
let musicGainNode: GainNode | null = null;
let sfxGainNode: GainNode | null = null;
let currentVolume = 0.5;
let isInitialized = false;
let isPausedByUser = false;
let currentMusicPath: string | null = null;

// Cache para armazenar os buffers de áudio já decodificados, melhorando a performance.
const audioBufferCache = new Map<string, AudioBuffer>();

/**
 * Inicializa o AudioContext. Deve ser chamado após a primeira interação do usuário
 * para cumprir as políticas de autoplay dos navegadores.
 */
const init = async () => {
    if (isInitialized || audioContext) return;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        // O resume() pode falhar se não for chamado dentro de um evento de gesto do usuário, mas tentamos mesmo assim.
        if (audioContext.state === 'suspended') {
            try {
                await audioContext.resume();
            } catch(e) {
                console.warn("Não foi possível resumir o AudioContext automaticamente. A interação do usuário é necessária.");
            }
        }
        
        musicGainNode = audioContext.createGain();
        musicGainNode.connect(audioContext.destination);
        
        sfxGainNode = audioContext.createGain();
        sfxGainNode.connect(audioContext.destination);

        setVolume(currentVolume); // Aplica o volume inicial
        isInitialized = true;
        console.log("Serviço de áudio inicializado.");

        // Adiciona um listener para resumir o contexto na primeira interação, caso a tentativa automática falhe.
        const resumeAudio = async () => {
            if (audioContext?.state === 'suspended') {
                await audioContext.resume();
            }
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('keydown', resumeAudio);
        };

        window.addEventListener('click', resumeAudio);
        window.addEventListener('keydown', resumeAudio);

    } catch (e) {
        console.error("Não foi possível inicializar o AudioContext:", e);
    }
};

/**
 * Carrega um arquivo de áudio, decodifica e armazena em cache.
 */
const getAudioBuffer = async (src: string): Promise<AudioBuffer | null> => {
    if (!audioContext) return null;
    if (audioBufferCache.has(src)) {
        return audioBufferCache.get(src)!;
    }
    try {
        const response = await fetch(src);

        // Verifica se a requisição foi bem-sucedida e se o tipo de conteúdo é de áudio.
        // Isso impede a tentativa de decodificar páginas 404 ou placeholders de texto.
        if (!response.ok) {
            console.warn(`Arquivo de áudio não encontrado (status: ${response.status}): ${src}`);
            return null;
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('audio')) {
            console.warn(`Arquivo em ${src} não é um arquivo de áudio válido. Content-Type: ${contentType}`);
            return null;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBufferCache.set(src, audioBuffer);
        return audioBuffer;
    } catch (e) {
        console.error(`Falha ao carregar ou decodificar o áudio: ${src}`, e);
        return null;
    }
};

/**
 * Toca um efeito sonoro curto (fire-and-forget).
 */
const playSoundEffect = async (src: string) => {
    if (!isInitialized || !audioContext || !sfxGainNode || audioContext.state === 'suspended') return;
    const buffer = await getAudioBuffer(src);
    if (buffer) {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(sfxGainNode);
        source.start(0);
    }
};

/**
 * Toca uma faixa de música, parando a anterior se houver.
 */
const playTrack = async (src: string, loop: boolean) => {
    if (!isInitialized || !audioContext || !musicGainNode) return;
    if (currentMusicPath === src && !isPausedByUser) return; // Já está tocando
    if (audioContext.state === 'suspended') return; // Não pode tocar se o contexto estiver suspenso
    
    stopMusic(); // Para a música atual antes de tocar a nova

    currentMusicPath = src;
    const buffer = await getAudioBuffer(src);
    
    if (buffer && !isPausedByUser) {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        source.connect(musicGainNode);
        source.start(0);
        currentMusicSource = source;
    }
};

/**
 * Para a música que está tocando no momento.
 */
const stopMusic = () => {
    if (currentMusicSource) {
        try {
            currentMusicSource.stop();
            currentMusicSource.disconnect();
        } catch(e) {
            // Ignora erros que podem acontecer se o nó já foi desconectado
        }
        currentMusicSource = null;
    }
    currentMusicPath = null;
};

/**
 * Define o volume para música e efeitos sonoros.
 */
const setVolume = (volume: number) => {
    currentVolume = Math.max(0, Math.min(1, volume));
    if (isInitialized && musicGainNode && sfxGainNode && audioContext) {
        // Usa setTargetAtTime para uma transição de volume mais suave.
        musicGainNode.gain.setTargetAtTime(currentVolume, audioContext.currentTime, 0.1);
        sfxGainNode.gain.setTargetAtTime(currentVolume, audioContext.currentTime, 0.1);
    }
};

/**
 * Pausa ou retoma todo o áudio do jogo.
 */
const togglePause = () => {
    if (!isInitialized || !audioContext) return;

    if (audioContext.state === 'running') {
        audioContext.suspend();
        isPausedByUser = true;
    } else if (audioContext.state === 'suspended') {
        audioContext.resume();
        isPausedByUser = false;
        // Se havia uma música tocando, retoma
        if(currentMusicPath) {
            playTrack(currentMusicPath, true);
        }
    }
};

/**
 * Verifica se o áudio está pausado.
 */
const isPaused = (): boolean => {
    return !isInitialized || audioContext?.state === 'suspended';
};

// --- API Pública ---

const playMenuMusic = () => {
    playTrack('/assets/audio/music/menu/menu.mp3', true);
};

const playAdventureMusic = (genre: string) => {
    if (!genre) return;
    const formattedGenre = genre.replace(/\s+/g, '_');
    playTrack(`/assets/audio/music/adventure/${formattedGenre}.mp3`, true);
};

const playBattleMusic = (className: string) => {
    if (!className) return;
    playTrack(`/assets/audio/music/battle/${className}.mp3`, true);
};

export const audioService = {
    init, // Exposto para ser chamado no primeiro clique
    playMenuMusic,
    playAdventureMusic,
    playBattleMusic,
    stopMusic,
    setVolume,
    togglePause,
    isPaused,
    playSoundEffect,
};