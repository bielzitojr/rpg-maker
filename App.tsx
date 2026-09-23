import React from 'react';
import useGame from './hooks/useGame';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import LoadingScreen from './components/LoadingScreen';
import GenreSelectionScreen from './components/GenreSelectionScreen';
import SettingSelectionScreen from './components/SettingSelectionScreen';
import UpdateNotesScreen from './components/UpdateNotesScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import StatusScreen from './components/StatusScreen';
import InventoryScreen from './components/InventoryScreen';
import SkillsScreen from './components/MagicScreen';
import BestiaryScreen from './components/BestiaryScreen';
import AlliesScreen from './components/AlliesScreen';
import EnemiesScreen from './components/EnemiesScreen';
import SystemLogScreen from './components/SystemLogScreen';
import SettingsScreen from './components/SettingsScreen';
import LoadGameScreen from './components/LoadGameScreen';
import AchievementsScreen from './components/AchievementsScreen';
import HelpModal from './components/HelpModal';
import MapScreen from './components/MapScreen';
import PlayModeSelectionScreen from './components/PlayModeSelectionScreen';
import MasterHub from './components/MasterHub';
import MasterNotebookModal from './components/MasterNotebookModal';
import AIGeneratorModal from './components/AIGeneratorModal';
import MasterCombatPanel from './components/MasterCombatPanel';

const App: React.FC = () => {
  const game = useGame();

  const renderModal = () => {
    if (game.isHelpModalOpen) {
        return <HelpModal genre={game.selectedGenre} onClose={game.handleToggleHelpModal} />;
    }
    if (!game.activeModal) return null;
    const onClose = () => game.setActiveModal(null);

    switch(game.activeModal) {
      case 'Status':
        return game.characterData && <StatusScreen character={game.characterData} status={game.status} onClose={onClose} />;
      case 'Inventário':
        return <InventoryScreen items={game.inventory} onClose={onClose} />;
      case 'Habilidades':
        return <SkillsScreen 
            skills={game.skills} 
            genre={game.selectedGenre} 
            onClose={onClose} 
            skillPoints={game.status.skillPoints}
            onUpgradeSkill={game.handleUpgradeSkill}
        />;
      case 'Bestiário':
        return <BestiaryScreen creatures={game.bestiary} onClose={onClose} />;
      case 'Aliados':
        return <AlliesScreen allies={game.allies} onClose={onClose} />;
      case 'Inimigos':
         if (game.playMode === 'master') {
            return <MasterCombatPanel
                enemies={game.enemies}
                onAddEnemy={game.handleAddEnemyToCombat}
                onUpdateHealth={game.handleUpdateEnemyHealth}
                onRemoveEnemy={game.handleRemoveEnemyFromCombat}
                onClose={onClose}
            />;
        }
        return <EnemiesScreen enemies={game.enemies} bestiary={game.bestiary} onClose={onClose} />;
      case 'Mapa':
        return <MapScreen onClose={onClose} />;
      case 'Sistema':
        return <SystemLogScreen logs={game.systemLog} onClose={onClose} />;
      case 'Configurações':
        return <SettingsScreen 
            gameState={game.gameState} 
            settings={game.settings}
            setSettings={game.setSettings}
            onClose={onClose} 
            onReturnToMenu={game.handleReturnToMainMenu} 
            onSaveAdventure={() => game.handleSaveAdventure(false)}
            onSaveCharacter={() => game.handleSaveCharacter(false)}
        />;
      case 'Caderno':
        return <MasterNotebookModal
            notebookData={game.notebookData}
            onDataChange={game.handleNotebookChange}
            onClose={onClose}
        />;
      case 'Geradores':
        return <AIGeneratorModal
            onGenerate={game.handleGenerateQuickContent}
            isLoading={game.isGeneratingContent}
            result={game.generatorResult}
            onClose={onClose}
        />;
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--bg-color)]">
      <div className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl xl:max-w-6xl flex flex-col items-center">
        {game.gameState !== 'loading' && (
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-10 text-center font-title" style={{textShadow: '2px 2px 4px var(--shadow-color)', color: 'var(--primary-accent-color)'}}>
            RPG Maker
          </h1>
        )}

        {renderModal()}

        {game.gameState === 'loading' && <LoadingScreen />}
        {game.gameState === 'mainMenu' && (
          <MainMenu onStartGame={game.handleNavigateToPlayModeSelection} onLoadGame={game.handleShowLoadGame} onShowUpdates={game.handleShowUpdates} onShowSettings={() => game.handleModalToggle('Configurações')} onShowAchievements={game.handleShowAchievements} isLoading={game.isLoading} />
        )}
        {game.gameState === 'playModeSelection' && (
          <PlayModeSelectionScreen 
            onSelectMode={game.handleSelectPlayMode}
            onBack={game.handleBackToMenu}
          />
        )}
        {game.gameState === 'loadGame' && (
            <LoadGameScreen 
                savedGames={game.savedGames}
                savedCharacters={game.savedCharacters}
                onLoadGame={game.handleLoadAdventure}
                onLoadCharacter={game.handleLoadCharacter}
                onDelete={game.handleDeleteSave}
                onBack={game.handleBackToMenu}
            />
        )}
        {game.gameState === 'achievements' && <AchievementsScreen achievements={game.achievements} onBack={game.handleBackToMenu} />}
        {game.gameState === 'genreSelection' && (
          <GenreSelectionScreen onSelectGenre={game.handleSelectGenre} onBack={game.handleBackToMenu} />
        )}
         {game.gameState === 'settingSelection' && (
          <SettingSelectionScreen onSelectSetting={game.handleSelectSetting} onBack={game.handleBackToGenre} />
        )}
        {game.gameState === 'characterCreation' && (
          <CharacterCreationScreen 
            onStart={game.handleStartAdventure} 
            onBack={game.selectedGenre === 'Isekai' ? game.handleBackToGenre : game.handleBackToSetting} 
            selectedGenre={game.selectedGenre} 
            initialData={game.characterData} 
          />
        )}
        {game.gameState === 'updateNotes' && <UpdateNotesScreen onBack={game.handleBackToMenu} />}
        
        {game.gameState === 'inGame' && game.playMode === 'player' && game.characterData && (
            <GameScreen
              story={game.story}
              characterData={game.characterData}
              isLoading={game.isLoading}
              error={game.error}
              onUserInput={game.handleUserInput}
              onHudButtonClick={game.handleModalToggle}
              onHelpClick={game.handleToggleHelpModal}
              notifications={game.notifications}
              settings={game.settings}
              location={game.location}
              gameTime={game.gameTime}
              isDiceRollActive={game.isDiceRollActive}
              onDiceRoll={game.handleDiceRoll}
              isInitiativeRollActive={game.isInitiativeRollActive}
              onInitiativeRoll={game.handleInitiativeRoll}
              selectedGenre={game.selectedGenre}
              actionSuggestions={game.actionSuggestions}
              allies={game.allies}
              bestiary={game.bestiary}
              enemies={game.enemies}
              combatState={game.combatState}
            />
        )}

        {game.gameState === 'inGame' && game.playMode === 'master' && game.characterData && (
          <MasterHub
            story={game.story}
            characterData={game.characterData}
            isLoading={game.isLoading}
            error={game.error}
            onUserInput={game.handleUserInput}
            onHudButtonClick={game.handleModalToggle}
            settings={game.settings}
          />
        )}
      </div>
    </div>
  );
};

export default App;