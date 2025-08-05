document.addEventListener('DOMContentLoaded', () => {
    const setupContainer = document.getElementById('setup-container');
    const gameContainer = document.getElementById('game-container');
    const setupForm = document.getElementById('setup-form');

    const player1NameInput = document.getElementById('player1-name');
    const player2NameInput = document.getElementById('player2-name');
    const pairCountSelect = document.getElementById('pair-count');
    const imageUploadInput = document.getElementById('image-upload');

    const name1Display = document.getElementById('name1');
    const name2Display = document.getElementById('name2');
    const playerTurnDisplay = document.getElementById('player-turn');
    const score1Display = document.getElementById('score1');
    const score2Display = document.getElementById('score2');
    const gameBoard = document.getElementById('game-board');

    const effectMessage = document.getElementById('effect-message');
    const endGameModal = document.getElementById('end-game-modal');
    const endGameTitle = document.getElementById('end-game-title');
    const finalScoreDisplay = document = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');

    let allImagePaths = [];
    let cards = [];
    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let currentPlayer = 1;
    let score1 = 0;
    let score2 = 0;
    let matchesFound = 0;
    let totalPairs = 0;
    let player1Name, player2Name;
    
    let consecutiveMatches = 0;
    let lastMatchPlayer = 0;

    function shuffle(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    setupForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        player1Name = player1NameInput.value || 'Spieler 1';
        player2Name = player2NameInput.value || 'Spieler 2';
        totalPairs = parseInt(pairCountSelect.value);
        const files = imageUploadInput.files;

        // Validierung: Es muss die exakte Anzahl an Bildern hochgeladen werden
        if (files.length !== totalPairs) {
            alert(`Bitte lade genau ${totalPairs} Bilder hoch, um das Spiel zu starten.`);
            return;
        }

        const formData = new FormData();
        for (const file of files) {
            formData.append('memoryImages', file);
        }

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Fehler beim Hochladen der Bilder');
            }

            const data = await response.json();
            allImagePaths = data.imagePaths;
            
            setupContainer.style.display = 'none';
            gameContainer.style.display = 'flex';
            name1Display.textContent = player1Name;
            name2Display.textContent = player2Name;
            startGame();

        } catch (error) {
            console.error('Fehler:', error);
            alert('Ein Fehler ist beim Hochladen aufgetreten. Bitte versuche es erneut.');
        }
    });

    function startGame() {
        resetGame();
        createBoard();
        playerTurnDisplay.textContent = `${player1Name} ist an der Reihe.`;
    }

    function createBoard() {
        const selectedImages = allImagePaths; // Hier verwenden wir alle hochgeladenen Bilder
        const cardImages = [...selectedImages, ...selectedImages];
        const shuffledCards = shuffle(cardImages);

        let columns;
        if (totalPairs <= 8) columns = 4;
        else if (totalPairs <= 16) columns = 6;
        else columns = 8;
        
        gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

        gameBoard.innerHTML = '';
        shuffledCards.forEach(imagePath => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            card.dataset.image = imagePath;
            card.addEventListener('click', flipCard);

            const cardBack = document.createElement('div');
            cardBack.classList.add('card-face', 'card-back');

            const cardFront = document.createElement('div');
            cardFront.classList.add('card-face', 'card-front');
            cardFront.style.backgroundImage = `url(${imagePath})`;

            card.appendChild(cardBack);
            card.appendChild(cardFront);
            gameBoard.appendChild(card);
            cards.push(card);
        });
    }

    function flipCard() {
        if (lockBoard) return;
        if (this === firstCard) return;
        if (this.classList.contains('flipped')) return;

        this.classList.add('flipped');

        if (!hasFlippedCard) {
            hasFlippedCard = true;
            firstCard = this;
        } else {
            hasFlippedCard = false;
            secondCard = this;
            checkForMatch();
        }
    }

    function checkForMatch() {
        let isMatch = firstCard.dataset.image === secondCard.dataset.image;
        isMatch ? disableCards() : unflipCards();
    }

    function disableCards() {
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        matchesFound++;

        if (currentPlayer === lastMatchPlayer) {
            consecutiveMatches++;
        } else {
            consecutiveMatches = 1;
        }
        lastMatchPlayer = currentPlayer;

        showEffectMessage(consecutiveMatches);

        if (currentPlayer === 1) {
            score1++;
            score1Display.textContent = score1;
        } else {
            score2++;
            score2Display.textContent = score2;
        }

        if (matchesFound === totalPairs) {
            setTimeout(endGame, 1000);
            return;
        }

        resetBoard();
    }

    function unflipCards() {
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            resetBoard();
            switchPlayer();
        }, 1500);
        consecutiveMatches = 0;
    }

    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        const currentName = currentPlayer === 1 ? player1Name : player2Name;
        playerTurnDisplay.textContent = `${currentName} ist an der Reihe.`;
    }
    
    function showEffectMessage(count) {
        let messageText;
        let styleClass = '';
        
        const phrases = {
            1: ['Sehr gut!', 'Treffer!', 'Stark!'],
            2: ['PERFEKT!', 'GENIAL!', 'FANTASTISCH!'],
            3: ['WOW!', 'ÜBERRAGEND!', 'UNGLAUBLICH!'],
            4: ['EXZELLENT!', 'MEISTERHAFT!', 'HERAUSRAGEND!'],
            5: ['ABSOLUT PERFEKT!', 'UNBESIEGBAR!', 'LEGENDÄR!']
        };

        if (count >= 1 && count <= 5) {
            const possiblePhrases = phrases[count];
            messageText = possiblePhrases[Math.floor(Math.random() * possiblePhrases.length)];
        } else if (count > 5) {
            messageText = `KOMBO x${count}!`;
        } else {
            return;
        }

        if (count === 2) {
            styleClass = 'rainbow';
        } else if (count >= 3) {
            styleClass = 'golden';
        }

        effectMessage.textContent = messageText;
        effectMessage.className = '';
        effectMessage.classList.add('show');
        if (styleClass) {
            effectMessage.classList.add(styleClass);
        }

        setTimeout(() => {
            effectMessage.classList.remove('show');
            if (styleClass) {
                effectMessage.classList.remove(styleClass);
            }
        }, 1500);
    }

    function endGame() {
        let winner;
        if (score1 > score2) {
            winner = player1Name;
        } else if (score2 > score1) {
            winner = player2Name;
        } else {
            winner = 'Unentschieden';
        }

        const winnerText = (winner === 'Unentschieden') ? 'Unentschieden!' : `${winner} hat gewonnen!`;
        endGameTitle.textContent = winnerText;
        finalScoreDisplay.innerHTML = `${player1Name}: ${score1} Punkte<br>${player2Name}: ${score2} Punkte`;
        
        endGameModal.classList.add('show-modal');
    }

    function resetGame() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
        cards = [];
        score1 = 0;
        score2 = 0;
        matchesFound = 0;
        currentPlayer = 1;
        
        score1Display.textContent = '0';
        score2Display.textContent = '0';
        
        gameBoard.innerHTML = '';
        consecutiveMatches = 0;
        lastMatchPlayer = 0;
    }
    
    restartButton.addEventListener('click', () => {
        endGameModal.classList.remove('show-modal');
        setupContainer.style.display = 'block';
        gameContainer.style.display = 'none';
        
        // Optional: Löschen Sie die hochgeladenen Bilder vom Server, um den Speicherplatz freizugeben.
        // Dafür müsste eine weitere API-Route im Backend erstellt werden.
        allImagePaths = [];
    });
});