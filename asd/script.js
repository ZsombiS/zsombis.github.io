let deckId;
let playerCards = [];
let dealerCards = [];
let playerScore = 0;
let dealerScore = 0;

async function initializeDeck() {
    try {
        const response = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
        const data = await response.json();
        deckId = data.deck_id;
        console.log("Deck initialized:", deckId);
        startGame();
    } catch (error) {
        console.error("Error initializing deck:", error);
    }
}

async function drawCard() {
    try {
        const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
        const data = await response.json();
        return data.cards[0];  // returns the card object
    } catch (error) {
        console.error("Error drawing card:", error);
    }
}

function cardValue(card) {
    if (card.value === "ACE") return 11;
    if (card.value === "KING" || card.value === "QUEEN" || card.value === "JACK") return 10;
    if (card.value === "10" || card.value === "0") return 10;  // Handle both 10 and 0 as 10
    return parseInt(card.value, 10);
}

function getCardImage(card) {
    // Card suit and value mapping to asset image names
    const suit = card.suit === 'HEARTS' ? 'S' :
                 card.suit === 'DIAMONDS' ? 'K' :
                 card.suit === 'SPADES' ? 'T' : 'P';
    
    // Map the card value for special cases (Ace, 10, Jack, Queen, King)
    let value = card.value;

    // Adjust the values for special cards
    if (value === 'ACE') {
        value = 'A';
    } else if (value === '10' || value === '0') {
        value = '0';
    } else if (value === 'JACK') {
        value = 'J';
    } else if (value === 'QUEEN') {
        value = 'Q';
    } else if (value === 'KING') {
        value = 'K';
    }

    const imagePath = `assets/${suit}${value}.jpg`;

    // Check if the image exists, if not, use back.jpg as a fallback image
    const img = new Image();
    img.src = imagePath;
    img.onload = () => { return imagePath; };  // If the image loads, return the path.
    img.onerror = () => { return 'assets/back.jpg'; };  // If the image doesn't load, fallback to back.jpg.

    return imagePath;  // Returning this for now; it'll fall back if necessary.
}

async function startGame() {
    playerCards = [];
    dealerCards = [];
    playerScore = 0;
    dealerScore = 0;

    // Draw two cards for the player, but only one card for the dealer initially
    for (let i = 0; i < 2; i++) {
        playerCards.push(await drawCard());
    }
    dealerCards.push(await drawCard());  // Only one card for the dealer

    updateScores();
    renderCards();
}

function updateScores() {
    playerScore = playerCards.reduce((sum, card) => sum + cardValue(card), 0);
    dealerScore = dealerCards.reduce((sum, card) => sum + cardValue(card), 0);

    document.getElementById("player-score").textContent = playerScore;
}

function renderCards() {
    const playerDiv = document.getElementById("player-cards");
    const dealerDiv = document.getElementById("dealer-cards");

    playerDiv.innerHTML = "";
    dealerDiv.innerHTML = "";

    // Render player cards
    playerCards.forEach(card => {
        const cardElement = document.createElement("div");
        cardElement.classList.add("card");
        cardElement.style.backgroundImage = `url('${getCardImage(card)}')`;
        playerDiv.appendChild(cardElement);
    });

    // Render dealer cards (only reveal one card initially)
    dealerCards.forEach((card, index) => {
        const cardElement = document.createElement("div");
        cardElement.classList.add("card");
        cardElement.style.backgroundImage = `url('${getCardImage(card)}')`;
        dealerDiv.appendChild(cardElement);
    });
}

async function hit() {
    const card = await drawCard();
    playerCards.push(card);
    updateScores();
    renderCards();
    checkGameStatus();
}

async function stand() {
    // Dealer draws cards until they have at least 17
    while (dealerScore < 17) {
        const card = await drawCard();
        dealerCards.push(card);
        dealerScore = dealerCards.reduce((sum, card) => sum + cardValue(card), 0);
        renderCards();
    }
    checkGameStatus();
}

function checkGameStatus() {
    // Check if player or dealer busted
    if (playerScore > 21) {
        document.getElementById("message").textContent = "You Bust! Dealer Wins!";
        disableButtons();
    } else if (dealerScore > 21) {
        document.getElementById("message").textContent = "Dealer Busts! You Win!";
        disableButtons();
    } else if (playerScore === 21) {
        document.getElementById("message").textContent = "You got Blackjack! You Win!";
        disableButtons();
    } else if (dealerScore === 21) {
        document.getElementById("message").textContent = "Dealer got Blackjack! Dealer Wins!";
        disableButtons();
    } else if (dealerScore >= 17 && dealerScore <= 20) {
        // Now compare the scores to determine who wins
        if (dealerScore > playerScore) {
            document.getElementById("message").textContent = "Dealer Wins!";
        } else if (dealerScore < playerScore) {
            document.getElementById("message").textContent = "You Win!";
        } else {
            document.getElementById("message").textContent = "It's a Tie!";
        }
        disableButtons();
    }
}

function disableButtons() {
    document.getElementById("hit-btn").disabled = true;
    document.getElementById("stand-btn").disabled = true;
}

document.getElementById("hit-btn").addEventListener("click", hit);
document.getElementById("stand-btn").addEventListener("click", stand);

// Start a new game when the page loads
initializeDeck();
