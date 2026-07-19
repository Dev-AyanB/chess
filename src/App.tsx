import { Settings, List, BarChart3 } from 'lucide-react';
import { ChessBoard } from './components/ChessBoard';
import { PlayerBar } from './components/PlayerBar';
import { GameSettings } from './components/GameSettings';
import { GameReport } from './components/GameReport';
import { GameOverModal } from './components/GameOverModal';
import { EvalBar } from './components/EvalBar';
import { ReviewControls } from './components/ReviewControls';
import TabPanel, { type Tab } from './components/TabPanel';
import { MoveHistory } from './components/MoveHistory';
import { AnalysisOverlay } from './components/AnalysisOverlay';
import { AppHeader } from './components/AppHeader';
import { SidebarControls } from './components/SidebarControls';
import { useChessAppState } from './hooks/useChessAppState';

function App() {
  const {
    game,
    isAnalyzing,
    progress,
    analysisResults,
    cancelAnalysis,
    gameMode,
    setGameMode,
    playerColor,
    setPlayerColor,
    depth,
    setDepth,
    coachMode,
    setCoachMode,
    reviewMode,
    reviewIndex,
    setReviewIndex,
    showGameOverModal,
    setShowGameOverModal,
    sidebarTab,
    setSidebarTab,
    soundEnabled,
    setSoundEnabled,
    theme,
    setTheme,
    currentFen,
    activeGameInstance,
    evalState,
    isThinking,
    liveAnalysis,
    moveClassification,
    currentArrows,
    flipBoard,
    handleUndo,
    handleHint,
    handleCopyFen,
    handleStartReview,
    handleExitReview,
    handleNewGame,
    handleReviewFromModal,
    visualBoardOrientation,
    topPlayerColor,
    bottomPlayerColor,
    topCaptures,
    bottomCaptures,
    isTopBot,
    isBottomBot,
    gameOverInfo,
    statusText,
    fen,
    turn,
    isGameOver,
    makeMove,
    history,
    undo,
    reset,
    redo,
    redoStack,
  } = useChessAppState();

  const sidebarTabs: Tab[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={14} />,
      content: (
        <GameSettings
          gameMode={gameMode}
          setGameMode={setGameMode}
          playerColor={playerColor}
          setPlayerColor={setPlayerColor}
          depth={depth}
          setDepth={setDepth}
          coachMode={coachMode}
          setCoachMode={setCoachMode}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          disabled={(history.length > 0 && !isGameOver) || reviewMode}
        />
      ),
    },
    {
      id: 'moves',
      label: 'Moves',
      icon: <List size={14} />,
      content: (
        <div className="flex flex-col h-full p-3">
          <MoveHistory
            history={history}
            analysisResults={reviewMode ? analysisResults : liveAnalysis}
            currentMoveIndex={reviewMode ? reviewIndex : undefined}
            onMoveClick={reviewMode ? setReviewIndex : undefined}
          />
        </div>
      ),
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: <BarChart3 size={14} />,
      content: reviewMode && analysisResults.length > 0 ? (
        <GameReport history={history} analysisResults={analysisResults} />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-text-tertiary p-8 text-center">
          <BarChart3 size={32} className="mb-3 opacity-30" />
          <p className="text-sm">Complete a game and review it to see analysis.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="h-screen w-screen bg-bg-deep flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-3 lg:p-6 relative min-h-0">
        <div className="flex flex-col w-full h-full max-h-[850px] max-w-[850px] mx-auto justify-center">
          <PlayerBar
            name={topPlayerColor === 'w' ? 'White' : 'Black'}
            color={topPlayerColor}
            isActive={turn === topPlayerColor && !isGameOver}
            isBot={isTopBot}
            botLevel={isTopBot ? depth : undefined}
            isThinking={isThinking && gameMode === 'computer' && turn !== playerColor && !reviewMode}
            capturedPieces={topCaptures.captured}
            materialAdvantage={topCaptures.advantage}
            position="top"
          />

          <div className="flex-1 flex gap-2 min-h-0">
            <div className="hidden sm:flex shrink-0 py-1">
              <EvalBar score={evalState.score} isMate={evalState.isMate} boardOrientation={visualBoardOrientation} />
            </div>
            <div className="flex-1 relative flex justify-center h-full max-h-full">
              <div className="aspect-square h-full">
                <ChessBoard
                  gameInstance={activeGameInstance}
                  fen={currentFen}
                  makeMove={makeMove}
                  boardOrientation={visualBoardOrientation}
                  arrows={currentArrows}
                  isReviewMode={reviewMode || isAnalyzing}
                  overrideFen={reviewMode ? currentFen : undefined}
                  moveClassification={moveClassification}
                />
              </div>

              {gameMode === 'computer' && turn !== playerColor && !isGameOver && !reviewMode && (
                <div className="absolute inset-0 z-10" />
              )}

              <AnalysisOverlay
                isAnalyzing={isAnalyzing}
                progress={progress}
                cancelAnalysis={cancelAnalysis}
              />
            </div>
          </div>

          <PlayerBar
            name={bottomPlayerColor === 'w' ? 'White' : 'Black'}
            color={bottomPlayerColor}
            isActive={turn === bottomPlayerColor && !isGameOver}
            isBot={isBottomBot}
            botLevel={isBottomBot ? depth : undefined}
            isThinking={false}
            capturedPieces={bottomCaptures.captured}
            materialAdvantage={bottomCaptures.advantage}
            position="bottom"
          />

          {reviewMode && (
            <ReviewControls
              history={history}
              analysisResults={analysisResults}
              reviewIndex={reviewIndex}
              setReviewIndex={setReviewIndex}
            />
          )}
        </div>
      </div>

      <div className="w-full lg:w-[420px] h-full glass border-l border-border flex flex-col z-10">
        <AppHeader
          statusText={statusText}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        />

        <div className="flex-1 min-h-0">
          <TabPanel tabs={sidebarTabs} activeTab={sidebarTab} onTabChange={setSidebarTab} />
        </div>

        <SidebarControls
          reviewMode={reviewMode}
          onExitReview={handleExitReview}
          fen={fen}
          pgn={game.game.pgn()}
          history={history}
          canRedo={redoStack.length > 0}
          undo={undo}
          reset={reset}
          onFlipBoard={flipBoard}
          onUndo={handleUndo}
          onRedo={redo}
          onHint={handleHint}
          onCopyFen={handleCopyFen}
          isGameOver={isGameOver}
          onStartReview={handleStartReview}
          isAnalyzing={isAnalyzing}
        />
      </div>

      <GameOverModal
        isOpen={showGameOverModal}
        result={gameOverInfo.result}
        winner={'winner' in gameOverInfo ? gameOverInfo.winner : undefined}
        reason={'reason' in gameOverInfo ? gameOverInfo.reason : undefined}
        onNewGame={handleNewGame}
        onReviewGame={handleReviewFromModal}
        onClose={() => setShowGameOverModal(false)}
      />
    </div>
  );
}

export default App;
