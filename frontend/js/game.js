// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const game = new NumberMaze('hexagonCanvas');
    game.startNewGame();
});
