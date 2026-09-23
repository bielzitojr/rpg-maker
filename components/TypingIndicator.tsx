import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex-shrink-0 p-2 space-y-4">
        <style>{`
            .dot-flashing {
                position: relative;
                width: 6px;
                height: 6px;
                border-radius: 5px;
                background-color: var(--tertiary-accent-color);
                color: var(--tertiary-accent-color);
                animation: dotFlashing 1s infinite linear alternate;
                animation-delay: .5s;
              }
              
              .dot-flashing::before, .dot-flashing::after {
                content: '';
                display: inline-block;
                position: absolute;
                top: 0;
              }
              
              .dot-flashing::before {
                left: -10px;
                width: 6px;
                height: 6px;
                border-radius: 5px;
                background-color: var(--tertiary-accent-color);
                color: var(--tertiary-accent-color);
                animation: dotFlashing 1s infinite alternate;
                animation-delay: 0s;
              }
              
              .dot-flashing::after {
                left: 10px;
                width: 6px;
                height: 6px;
                border-radius: 5px;
                background-color: var(--tertiary-accent-color);
                color: var(--tertiary-accent-color);
                animation: dotFlashing 1s infinite alternate;
                animation-delay: 1s;
              }
              
              @keyframes dotFlashing {
                0% {
                  background-color: var(--tertiary-accent-color);
                  opacity: 1;
                }
                50%, 100% {
                  background-color: rgba(180, 83, 9, 0.4);
                  opacity: 0.4;
                }
              }
        `}</style>
        <div>
            <strong className="text-[var(--tertiary-accent-color)] font-title">
              Mestre:
            </strong>
            <div className="mt-3 ml-2">
                <div className="dot-flashing"></div>
            </div>
        </div>
    </div>
  );
};

export default TypingIndicator;
