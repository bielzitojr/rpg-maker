import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
// Fix: Corrected import path for icons.
import { NarrateIcon, CopyIcon } from './icons/index';
import { Creature } from '../types';
import type { TextSpeed } from '../types';

interface StoryDisplayProps {
  story: string;
  speed: TextSpeed;
  characterName: string;
  autoNarrate: boolean;
  characterImage: string | null;
  allies: Creature[];
  bestiary: Creature[];
}

interface StoryTurn {
    speaker: string;
    content: string;
    key: string;
    speakerImage: string | null;
}

const getSpeedValue = (speed: TextSpeed) => {
    switch (speed) {
        case 'Lento': return 50;
        case 'Normal': return 25;
        case 'Rápido': return 10;
        default: return 25;
    }
}

const parseStory = (storyText: string, characterName: string, characterImage: string | null, allies: Creature[], bestiary: Creature[]): StoryTurn[] => {
    if (!storyText) return [];
    // Split by the pattern of a new speaker turn (Mestre, Sistema, or player name), keeping the delimiters
    const turnsRaw = storyText.split(/((?:\n\n|^)(?:Mestre|Sistema|[^:\n]+):\n)/).filter(Boolean);
    const turns: StoryTurn[] = [];

    for (let i = 0; i < turnsRaw.length; i += 2) {
        const speakerHeader = (turnsRaw[i] || '').trim();
        const content = (turnsRaw[i + 1] || '').trim();
        
        if (!speakerHeader) continue;

        const speaker = speakerHeader.replace(':', '').trim();
        let speakerImage: string | null = null;

        if (speaker === characterName) {
            speakerImage = characterImage;
        } else {
            const ally = allies.find(a => a.name === speaker);
            if (ally && ally.image) {
                speakerImage = ally.image;
            } else {
                const creature = bestiary.find(c => c.name === speaker);
                if (creature && creature.image) {
                    speakerImage = creature.image;
                }
            }
        }
        
        turns.push({
            speaker,
            content,
            key: `${speaker}-${i / 2}-${content.length}`, // Add content length for more unique key
            speakerImage,
        });
    }
    return turns;
};

const Star: React.FC<{style: React.CSSProperties}> = ({ style }) => <div className="star" style={style}></div>;

const DiceResultDisplay: React.FC<{ result: number }> = ({ result }) => {
    let className = 'font-bold text-3xl md:text-4xl';
    let wrapperClass = 'text-center my-4 p-4 rounded-lg relative overflow-hidden border-2';
    let effectElement: React.ReactNode = null;

    if (result === 1) {
        className += ' critical-failure-text';
        wrapperClass += ' bg-red-900/30 border-red-700/50';
    } else if (result >= 2 && result <= 9) {
        className += ' text-orange-400';
        wrapperClass += ' bg-orange-900/30 border-orange-700/50';
    } else if (result >= 10 && result <= 19) {
        className += ' text-green-400';
        wrapperClass += ' bg-green-900/30 border-green-700/50';
    } else if (result === 20) {
        className += ' critical-success-text';
        wrapperClass += ' bg-yellow-900/30 border-yellow-700/50';
        effectElement = (
            <>
                <Star style={{ top: '10%', left: '20%', '--delay': '0s' } as React.CSSProperties} />
                <Star style={{ top: '80%', left: '15%', '--delay': '0.5s' } as React.CSSProperties} />
                <Star style={{ top: '25%', left: '85%', '--delay': '1s' } as React.CSSProperties} />
                <Star style={{ top: '60%', left: '90%', '--delay': '1.5s' } as React.CSSProperties} />
                <Star style={{ top: '50%', left: '50%', '--delay': '0.2s' } as React.CSSProperties} />
            </>
        );
    }

    return (
        <div className={wrapperClass}>
            {effectElement}
            <div className="relative z-10">
                <p className="text-sm font-title mb-2 text-stone-400">Resultado do Teste</p>
                <span className={className}>{result}</span>
            </div>
        </div>
    );
};

const Turn: React.FC<{ turn: StoryTurn, isTyping: boolean, isLastTurn: boolean, onNarrate: (text: string, key: string) => void, onCopy: (text: string, key: string) => void, speakingKey: string | null, copiedKey: string | null, characterName: string }> = ({ turn, isTyping, isLastTurn, onNarrate, onCopy, speakingKey, copiedKey, characterName }) => {
    const showMasterButtons = turn.speaker === 'Mestre' && (!isTyping || !isLastTurn);
    const diceMatch = (turn.speaker === 'Sistema' || turn.speaker === 'Mestre') && turn.content.match(/\[Você rolou (\d+)!\]/);

    if (diceMatch) {
        const result = parseInt(diceMatch[1], 10);
        return <DiceResultDisplay result={result} />;
    }

    const isPlayer = turn.speaker === characterName;
    const isMestreOrSistema = turn.speaker === 'Mestre' || turn.speaker === 'Sistema';

    // NPC/Animal/Ally turn
    if (!isPlayer && !isMestreOrSistema) {
        return (
            <div className="flex items-end gap-2.5 my-2">
                {turn.speakerImage ? (
                    <img className="w-8 h-8 rounded-full object-cover self-start" src={turn.speakerImage} alt={turn.speaker} />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-stone-300 flex-shrink-0"></div>
                )}
                <div className="flex flex-col gap-1 w-full max-w-md">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="text-sm font-semibold text-[var(--surface-text-color)] font-title">{turn.speaker}</span>
                    </div>
                    <div className="flex flex-col leading-1.5 p-3 bg-stone-200/50 rounded-e-xl rounded-es-xl">
                        <p className="text-sm font-normal text-[var(--surface-text-color)] whitespace-pre-wrap">{turn.content}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Player turn
    if (isPlayer) {
         return (
            <div className="flex items-end gap-2.5 my-2 justify-end">
                <div className="flex flex-col gap-1 w-full max-w-md">
                     <div className="flex items-center space-x-2 rtl:space-x-reverse justify-end">
                        <span className="text-sm font-semibold text-[var(--player-text-color)] font-title">{turn.speaker}</span>
                    </div>
                    <div className="flex flex-col leading-1.5 p-3 bg-[var(--primary-accent-color)]/20 rounded-s-xl rounded-ee-xl">
                        <p className="text-sm font-normal text-[var(--surface-text-color)] whitespace-pre-wrap">{turn.content}</p>
                    </div>
                </div>
                 {turn.speakerImage && (
                    <img className="w-8 h-8 rounded-full object-cover self-start" src={turn.speakerImage} alt={turn.speaker} />
                )}
            </div>
        );
    }

    // Mestre / Sistema turn (default)
    return (
        <div>
            <div className="flex items-center gap-2">
                <strong className={turn.speaker === 'Mestre' ? 'text-[var(--tertiary-accent-color)] font-title' : 'text-stone-400 font-title'}>
                  {turn.speaker}:
                </strong>
            </div>
            <p className="whitespace-pre-wrap text-[var(--surface-text-color)] mt-1">{turn.content}</p>
            {showMasterButtons && (
              <div className="flex items-center gap-2 mt-2">
                  <button 
                      onClick={() => onNarrate(turn.content, turn.key)}
                      className="p-1.5 rounded-md text-stone-500 hover:bg-stone-200 hover:text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400 transition-colors duration-200"
                      title={speakingKey === turn.key ? "Parar narração" : "Narrar texto"}
                  >
                     <NarrateIcon className="w-5 h-5" isSpeaking={speakingKey === turn.key} />
                  </button>
                  <button 
                      onClick={() => onCopy(turn.content, turn.key)}
                      className="p-1.5 rounded-md text-stone-500 hover:bg-stone-200 hover:text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400 transition-colors duration-200"
                      title="Copiar texto"
                  >
                      <CopyIcon className="w-5 h-5" isCopied={copiedKey === turn.key} />
                  </button>
                  {copiedKey === turn.key && <span className="text-xs text-green-600 font-bold">Copiado!</span>}
              </div>
            )}
        </div>
    );
};

const StoryDisplay: React.FC<StoryDisplayProps> = ({ story, speed, characterName, autoNarrate, characterImage, allies, bestiary }) => {
  const [typedContent, setTypedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const endOfStoryRef = useRef<HTMLDivElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const turns = useMemo(() => parseStory(story, characterName, characterImage, allies, bestiary), [story, characterName, characterImage, allies, bestiary]);
  const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  const handleNarrate = useCallback((text: string, key: string) => {
    if (speakingKey === key) {
        window.speechSynthesis.cancel();
        setSpeakingKey(null);
    } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.onend = () => setSpeakingKey(null);
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setSpeakingKey(key);
    }
  }, [speakingKey]);

  useEffect(() => {
    if (!lastTurn || lastTurn.speaker !== 'Mestre' || lastTurn.content.length === 0) {
        setTypedContent(lastTurn?.content || '');
        setIsTyping(false);
        return;
    }

    setTypedContent(''); // Reset content before typing
    setIsTyping(true);
    let i = 0;
    const intervalId = setInterval(() => {
        setTypedContent(lastTurn.content.substring(0, i + 1));
        i++;
        if (i > lastTurn.content.length) {
            clearInterval(intervalId);
            setIsTyping(false);
            if (autoNarrate) {
                handleNarrate(lastTurn.content, lastTurn.key);
            }
        }
    }, getSpeedValue(speed));
    
    return () => {
        clearInterval(intervalId);
        setIsTyping(false); 
    };
  }, [lastTurn?.key, speed, autoNarrate, handleNarrate]);

  useEffect(() => {
    endOfStoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [typedContent, isTyping, turns.length]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
        window.speechSynthesis.cancel();
    }
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };
  
  const staticTurns = turns.slice(0, turns.length - 1);
  const finalTurn = lastTurn ? { ...lastTurn, content: typedContent } : null;

  return (
    <>
      <div className="flex-grow w-full overflow-y-auto text-sm md:text-base lg:text-lg leading-relaxed selection:bg-amber-200 selection:text-stone-900 p-2 space-y-4">
          {staticTurns.map(turn => (
               <Turn 
                  key={turn.key}
                  turn={turn}
                  isTyping={false}
                  isLastTurn={false}
                  onNarrate={handleNarrate}
                  onCopy={handleCopy}
                  speakingKey={speakingKey}
                  copiedKey={copiedKey}
                  characterName={characterName}
              />
          ))}
          {finalTurn && (
               <Turn 
                  key={finalTurn.key}
                  turn={finalTurn}
                  isTyping={isTyping}
                  isLastTurn={true}
                  onNarrate={handleNarrate}
                  onCopy={handleCopy}
                  speakingKey={speakingKey}
                  copiedKey={copiedKey}
                  characterName={characterName}
              />
          )}
        <div ref={endOfStoryRef} />
      </div>
    </>
  );
};

export default StoryDisplay;