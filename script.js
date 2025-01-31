// Global variables
let marker = null;
let correctMarker = null;
let line = null;
let currentQuestion = 0;
let allGuesses = [];
let allMarkers = [];
let allLines = [];
let map, correctLocation, canGuess = true, totalScore = 0, roundsPlayed = 0;
let currentGuess = null;
let mapClickEnabled = true; // Added this line
let quizStartTime = null;
const LAST_PLAYED_KEY = 'lastPlayedDate';
const DAILY_SCORES_KEY = 'dailyScores';

function saveDailyScore() {
    const today = new Date().toDateString();
    const dailyScores = JSON.parse(localStorage.getItem(DAILY_SCORES_KEY) || '{}');
    const totalTime = Date.now() - quizStartTime; // Total time from start to finish
    dailyScores[today] = {
        score: totalScore,
        completionTime: totalTime
    };
    localStorage.setItem(DAILY_SCORES_KEY, JSON.stringify(dailyScores));
    localStorage.setItem('dailyGuesses', JSON.stringify(allGuesses));
}



function canPlayToday() {
    const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
    const today = new Date().toDateString();
    return lastPlayed !== today;
}

function markAsPlayed() {
    const today = new Date().toDateString();
    localStorage.setItem(LAST_PLAYED_KEY, today);
}

function saveGameState() {
    const gameState = {
        currentQuestion: currentQuestion,
        allGuesses: allGuesses,
        totalScore: totalScore,
        quizStartTime: quizStartTime,
        timeLeft: timeLeft,
        completed: false,
        lastAnsweredQuestion: allGuesses.length - 1 // Track based on actual submitted answers
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem('gameState');
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);

    if (savedState && lastPlayed === today) {
        const state = JSON.parse(savedState);
        if (!state.completed) {
            // Set currentQuestion based on number of actual submitted answers
            currentQuestion = state.allGuesses ? state.allGuesses.length : 0;
            allGuesses = state.allGuesses || [];
            totalScore = state.totalScore || 0;
            quizStartTime = state.quizStartTime;
            timeLeft = initialTime;
            
            return true;
        }
    }
    return false;
}



// Timer variables
let startTime;
let timerInterval;
let elapsedTime = 0; // Track elapsed time in milliseconds
let timeLeft = 120000; // 2 minutes in milliseconds
const initialTime = 120000;

// Initial theme setup
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

function startTimer() {
    if (!quizStartTime) {
        quizStartTime = Date.now();
    }
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function formatCompletionTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
}



function stopTimer() {
    clearInterval(timerInterval);
}

function updateTimer() {
    const currentTime = Date.now();
    elapsedTime = currentTime - startTime;
    timeLeft = initialTime - elapsedTime;

    if (timeLeft <= 0) {
        stopTimer();
        timeLeft = 0;
        handleTimeout();
    }

    const formattedTime = formatTime(timeLeft);
    document.getElementById('timer').textContent = formattedTime;
}

function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function handleTimeout() {
    if (canGuess) {
        canGuess = false;
        const correctAnswer = questions[currentQuestion].answer;
        let userGuess = currentGuess;
        let distance = null; // Initialize distance to null

        if (!userGuess && marker) {
            userGuess = marker.getLatLng();
            distance = calculateDistance(userGuess.lat, userGuess.lng, correctAnswer[0], correctAnswer[1]);
        } else if (!userGuess) {
            userGuess = {lat: correctAnswer[0], lng: correctAnswer[1]};
            document.getElementById('distance').textContent = `-`;
             document.getElementById('score').textContent = `Score: -`; // Set score to "-" if no marker
        } else if (userGuess){
            distance = calculateDistance(userGuess.lat, userGuess.lng, correctAnswer[0], correctAnswer[1]);
        }


        allGuesses.push(userGuess);

        const nextButton = document.querySelector('.next-button');
        nextButton.style.display = 'block';
        document.getElementById('submit-guess').style.display = 'none';

        if (currentQuestion === questions.length - 1) {
            nextButton.textContent = 'See Results';
        } else {
            nextButton.textContent = 'Next Question';
        }

        let score = 0;

        if (distance !== null && marker) {
            score = Math.max(0, Math.round(4000 * (1 - distance/20000)));
            document.getElementById('distance').textContent = `Distance: ${Math.round(distance)} km`;
        }

        totalScore += score;
        if (marker) {
            document.getElementById('score').textContent = `Score: ${totalScore}`;
        }
        showGuessAndCorrectLocation(userGuess, L.latLng(correctAnswer[0], correctAnswer[1]));
    }
}



// Questions array
let  questions = [
    {
    "question": "Where was the Tsar Bomba, the largest nuclear bomb ever detonated, tested?",
    "answer": [73.8567, 54.5842],
    "name": "Novaya Zemlya, Russia",
    "image": "images/tsar_bomba.jpg",
    "info": "On October 30, 1961, the Tsar Bomba, the largest nuclear bomb ever tested, was detonated by the USSR over Novaya Zemlya. Its 50-megaton blast was the most powerful in history"

    },
{
    "question": "Where was the Chicxulub crater, linked to the extinction of the dinosaurs, discovered?",
    "answer": [21.408, -89.916],
    "name": "Yucatán Peninsula, Mexico",
    "image": "images/chicxulub_crater.jpg",
    "info": "The Chicxulub crater, formed by an asteroid impact 66 million years ago, is in Mexico’s Yucatán Peninsula. This event is tied to the mass extinction that ended the age of dinosaurs"
},
    {
        question: "Where was the first successful cloning of a mammal achieved?",
        answer: [56.4907, -3.1747],
        name: "Roslin Institute, Scotland",
        image: "images/dolly.jpg",
        info: "In 1996, scientists at the Roslin Institute in Scotland successfully cloned Dolly the sheep, the first mammal to be cloned from an adult cell, marking a major milestone in genetic research."
    },
    {
        question: "Where was the first photograph ever taken?",
        answer: [47.8336, 4.5846],
        name: "Saint-Loup-de-Varennes, France",
        image: "images/first_photograph.jpg",
        info: "In 1826, Joseph Nicéphore Niépce captured the world's first permanent photograph, View from the Window at Le Gras, in Saint-Loup-de-Varennes, marking a key moment in the history of photography."
    },
    {
        question: "Where exactly was the Rosetta Stone discovered?",
        answer: [31.3960, 30.4170],
        name: "Fort Julien, Rosetta, Egypt",
        image: "images/rosetta_stone.jpg",
        info: "The Rosetta Stone was discovered in 1799 by French soldiers at Fort Julien near Rosetta, Egypt. It later became key to deciphering hieroglyphics, unlocking the secrets of ancient Egyptian writing."
    }
];

// Icon definitions
const userIcon = L.divIcon({
    className: 'user-guess-pin',
    html: `
        <div class="pin-wrapper">
            <div class="pin-head"></div>
            <div class="pin-point"></div>
        </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
});

const correctIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style='background-color: #2ecc71; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;'></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});






function initializeMap() {
map = L.map('map', {
    minZoom: 2,
    maxZoom: 18,
    worldCopyJump: true,
    center: [20, 0],
    zoom: 2,
    wheelDebounceTime: 150,
    wheelPxPerZoomLevel: 120,
    maxBounds: [
        [-90, -180],
        [90, 180]
    ],
    maxBoundsViscosity: 1.0
});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
    }).addTo(map);
    map.scrollWheelZoom.enable();
    map.on('click', handleGuess);
    let zoomTimeout;
    map.on('zoomend', () => {
        clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(() => {
            if (correctMarker) {
                updatePinSize(map, correctMarker);
                if (line) {
                    updateLine();
                }
            }
        }, 100); // Adjust the delay (in milliseconds) as needed
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function handleGuess(e) {
    if (!canGuess || !mapClickEnabled) return; // Modified this line

    const userGuess = e.latlng;
    currentGuess = userGuess;

    if (marker && map) {
        map.removeLayer(marker);
    }

    marker = L.marker([userGuess.lat, userGuess.lng], { icon: userIcon }).addTo(map);
    document.getElementById('submit-guess').style.display = 'block';
}

function showGuessAndCorrectLocation(userGuess, correctLatLng) {
    const modal = document.getElementById('info-modal');
    const modalMapContainer = document.getElementById('modal-map');
    const modalLocationInfo = document.getElementById('modal-location-info');
    const nextButton = modal.querySelector('.next-button');

    modal.style.display = 'flex';

    const modalMap = L.map(modalMapContainer, {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        worldCopyJump: true,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0,
        zoomControl: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
        boxZoom: true,
        keyboard: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
    }).addTo(modalMap);

    modalMap.on('load', function() {
        setTimeout(() => {
            modalMap.invalidateSize();
        }, 100);
    });

    if (marker) {
        L.marker([userGuess.lat, userGuess.lng], { icon: userIcon }).addTo(modalMap);
    }

    L.marker([correctLatLng.lat, correctLatLng.lng], { icon: correctIcon }).addTo(modalMap);

    if (marker) {
        L.polyline([
            [userGuess.lat, userGuess.lng],
            [correctLatLng.lat, correctLatLng.lng]
        ], {
            color: '#7ac5f0',
            weight: 3,
            opacity: 0.8,
            smoothFactor: 1,
            dashArray: '10',
            className: 'animated-line'
        }).addTo(modalMap);
    }

    const bounds = L.latLngBounds([
        [userGuess.lat, userGuess.lng],
        [correctLatLng.lat, correctLatLng.lng]
    ]);

    const distance = calculateDistance(userGuess.lat, userGuess.lng, correctLatLng.lat, correctLatLng.lng);
    const roundScore = Math.max(0, Math.round(4000 * (1 - distance/20000)));

    let padValue = distance > 10000 ? 0.05 : distance > 5000 ? 0.1 : 0.2;

    setTimeout(() => {
        modalMap.invalidateSize();
        modalMap.fitBounds(bounds.pad(padValue), {
            padding: [20, 20],
            maxZoom: 12,
            duration: 0.5,
            animate: true
        });
    }, 250);

    const currentQuestionInfo = questions[currentQuestion];
    
    document.querySelector('#modal-distance .distance-value').textContent = `${Math.round(distance)} km`;
    document.querySelector('#modal-score .score-value').textContent = roundScore;

    modalLocationInfo.innerHTML = `
        <img src="${currentQuestionInfo.image}" alt="${currentQuestionInfo.name}" loading="lazy">
        <p>${currentQuestionInfo.info}</p>
    `;

    setTimeout(adjustModalTextSize, 0);

    nextButton.style.display = 'block';

    nextButton.onclick = () => {
        nextQuestion();
        modal.style.display = 'none';
        modalMap.remove();
    };
}


function submitGuess() {
    if (marker) {
        const userGuess = marker.getLatLng();
        const correctLatLng = questions[currentQuestion].location;
        const distance = calculateDistance(userGuess.lat, userGuess.lng, correctLatLng.lat, correctLatLng.lng);
        const points = calculateScore(distance);
        totalScore += points;
        document.getElementById('distance').textContent = `${distance.toFixed(0)} km`;
        document.getElementById('score').textContent = totalScore;
        showGuessAndCorrectLocation(userGuess, correctLatLng);
        document.getElementById('submit-guess').style.display = 'none';
    } else {
        alert('Please place a marker on the map.');
    }
}

function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        canGuess = true;
        timeLeft = initialTime;
        if (marker) map.removeLayer(marker);
        if (correctMarker) map.removeLayer(correctMarker);
        if (line) map.removeLayer(line);
        marker = null;
        currentGuess = null;
        map.setView([20, 0], 2);
        map.on('click', handleGuess);
        document.getElementById('question').textContent = questions[currentQuestion].question;
        document.getElementById('score').textContent = 'Score: -';
        document.getElementById('distance').textContent = 'Distance: -';
        adjustQuestionFontSize();
        // document.querySelector('.next-button').style.display = 'none'; // REMOVE THIS LINE
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
        if (map.tap) map.tap.enable();
        mapClickEnabled = true;
        startTimer();
    } else {
        endGame();
    }
}

document.querySelector('.next-button').addEventListener('click', function() {
    const modal = document.getElementById('info-modal');
    modal.style.display = 'none';
    const modalMapContainer = document.getElementById('modal-map');
    if (modalMapContainer) {
        const modalMap = L.map(modalMapContainer);
        modalMap.remove();
    }
    nextQuestion();
});




function showAllGuessesOnMap() {
    if (!questions || !questions.length) {
        questions = JSON.parse(localStorage.getItem('dailyQuestions') || '[]');
    }

    const mapElement = document.getElementById('map');
    mapElement.style.height = 'calc(100vh - 100px)';

    const timerContainer = document.querySelector('.timer-container-map');
    if (timerContainer) {
        timerContainer.style.display = 'none';
    }

    if (marker) map.removeLayer(marker);
    if (correctMarker) map.removeLayer(correctMarker);
    if (line) map.removeLayer(line);

    allGuesses.forEach((guess, index) => {
        const question = questions[index];
        const userMarker = L.marker([guess.lat, guess.lng], { icon: userIcon }).addTo(map);
        const correctMarker = L.marker([question.answer[0], question.answer[1]], {
            icon: correctIcon,
            interactive: true
        }).addTo(map);

        const line = L.polyline([
            [guess.lat, guess.lng],
            [question.answer[0], question.answer[1]]
        ], {
            color: '#7ac5f0',
            weight: 3,
            opacity: 0.8,
            smoothFactor: 1,
            dashArray: '10',
            className: 'animated-line'
        }).addTo(map);

        const popupContent = `
            <div class="location-info">
                <h3>${question.name}</h3>
                <img src="${question.image}" alt="${question.name}">
                <p>${question.info}</p>
            </div>
        `;
        correctMarker.bindPopup(popupContent);
    });

    const allPoints = allGuesses.concat(questions.map(q => L.latLng(q.answer[0], q.answer[1])));
    const bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds, { padding: [50, 50] });

    const endScreen = document.getElementById('end-screen');
    const endContent = document.querySelector('.end-content');
    endContent.classList.add('minimized');
    endScreen.classList.add('minimized');

    const expandButton = document.createElement('button');
    expandButton.className = 'expand-button';
    expandButton.innerHTML = '<i class="fas fa-expand-alt"></i>';
    expandButton.onclick = () => {
        endContent.classList.remove('minimized');
        endScreen.classList.remove('minimized');
        expandButton.remove();
        mapElement.style.height = 'calc(100vh - 200px)';
        requestAnimationFrame(() => {
            setTimeout(() => {
                map.invalidateSize();
                mapClickEnabled = true;
                map.dragging.enable();
                map.touchZoom.enable();
                map.doubleClickZoom.enable();
                map.scrollWheelZoom.enable();
                map.boxZoom.enable();
                map.keyboard.enable();
                if (map.tap) map.tap.enable();
                map.on('click', handleGuess);
            }, 0);
        });
    };
    endContent.appendChild(expandButton);
    mapElement.style.height = 'calc(100vh - 80px)';
    map.invalidateSize();
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if(map.tap) map.tap.enable();
    mapClickEnabled = false;
    map.off('click', handleGuess);
}
function shareResults() {
    if (!questions || !questions.length) {
        questions = JSON.parse(localStorage.getItem('dailyQuestions') || '[]');
    }

    const dailyData = JSON.parse(localStorage.getItem(DAILY_SCORES_KEY) || '{}')[new Date().toDateString()];
    const completionTime = formatCompletionTime(dailyData.completionTime);
    let totalPossibleScore = questions.length * 4000;
    let overallAccuracy = (totalScore / totalPossibleScore) * 100;
    overallAccuracy = overallAccuracy.toFixed(1);
    
    let shareText = `Daily Map Quiz #63\n\nFinal Score: ${totalScore}\nOverall Accuracy: ${overallAccuracy}%\nTime: ${completionTime}\n\n`;
    
    let scoreIcons = '';
    allGuesses.forEach((guess, index) => {
        const correctAnswer = questions[index].answer;
        let distance = null;
        if (guess && guess.lat && guess.lng) {
            distance = calculateDistance(guess.lat, guess.lng, correctAnswer[0], correctAnswer[1]);
        }
        let icon = '❌';
        if (distance !== null) {
            if (distance <= 50) {
                icon = '🎯';
            } else if (distance <= 300) {
                icon = '🟢';
            } else if (distance <= 1000) {
                icon = '🟡';
            } else if (distance <= 2000) {
                icon = '🟠';
            } else if (distance <= 4000) {
                icon = '🔴';
            }
        }
        scoreIcons += icon;
    });
    shareText += `My round scores: ${scoreIcons}`;

    navigator.clipboard.writeText(shareText)
        .then(() => {
            alert("Results copied to clipboard! Paste anywhere.");
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            alert("Failed to copy results. Please try again.");
        });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert('Results copied to clipboard!'))
        .catch(() => alert('Unable to share results'));
}

function endGame() {
    const gameState = {
        completed: true
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
    
    saveDailyScore();
    stopTimer();
    const totalTime = Date.now() - quizStartTime;
    const formattedCompletionTime = formatCompletionTime(totalTime);
    
    const statsContainer = document.querySelector('.stats-container');
    const questionContainer = document.getElementById('question-container');
    const placeholder = document.createElement('div');
    placeholder.style.height = questionContainer.offsetHeight + 'px';
    placeholder.id = 'question-placeholder';
    questionContainer.parentNode.replaceChild(placeholder, questionContainer);
    statsContainer.style.display = 'none';
    
    const endScreen = document.getElementById('end-screen');
    const finalScore = document.getElementById('final-score');
    const finalStats = document.getElementById('final-stats');
    const finalTime = document.getElementById('final-time');
    
    let totalDistance = 0;
    let guessDetails = '';
    
    questions.forEach((question, index) => {
        const guess = allGuesses[index];
        let distance = null;
        if (guess) {
            distance = calculateDistance(guess.lat, guess.lng, question.answer[0], question.answer[1]);
        }
        totalDistance += distance === null ? 0 : distance;
        const distanceValue = distance === null ? '-' : Math.round(distance);
        let icon = '';
        
        if (distance === null) {
            icon = '<i class="fas fa-question"></i>';
        } else if (distance <= 50) {
            icon = '<span class="bullseye-emoji">🎯</span>';
        } else if (distance <= 300) {
            icon = '<i class="fas fa-circle green-circle"></i>';
        } else if (distance <= 1000) {
            icon = '<i class="fas fa-circle yellow-circle"></i>';
        } else if (distance <= 2000) {
            icon = '<i class="fas fa-circle orange-circle"></i>';
        } else if (distance <= 4000) {
            icon = '<i class="fas fa-circle red-circle"></i>';
        } else {
            icon = '<i class="fas fa-times red-x"></i>';
        }
        
        guessDetails += `
            <div class="guess-detail">
                ${index + 1}. Distance: ${distanceValue} km ${icon}
            </div>
        `;
    });
    
    const maxPossibleDistance = 12000;
    const accuracyWeight = 1.5;
    const penaltyFactor = 1.2;
    const baseMultiplier = 0.9;
    const averageDistance = totalDistance / questions.length;
    const accuracy = Math.max(0, baseMultiplier * 100 * Math.pow((1 - (averageDistance/maxPossibleDistance) * penaltyFactor), accuracyWeight));
    
    finalScore.textContent = `Final Score: ${totalScore}`;
    finalTime.textContent = `Completion Time: ${formattedCompletionTime}`;
    finalStats.innerHTML = `
        <div class="accuracy">Overall Accuracy: ${accuracy.toFixed(1)}%</div>
        <div class="guess-history">
            <h3>Your Guesses:</h3>
            ${guessDetails}
        </div>
    `;
    
    endScreen.style.display = 'flex';
    const endButtons = document.querySelector('.end-buttons');
    endButtons.innerHTML = `
        <button id="see-results-map" class="end-button">See Results on Map</button>
        <button id="share-results" class="end-button">Share Results</button>
    `;
    
    document.getElementById('see-results-map').addEventListener('click', showAllGuessesOnMap);
    document.getElementById('share-results').addEventListener('click', shareResults);
    mapClickEnabled = false;
}




function adjustQuestionFontSize() {
    const questionElement = document.getElementById('question');
    if (!questionElement) return;
    const textLength = questionElement.textContent.length;
    let fontSize = '1rem'; // Default font size
    if (textLength > 100) {
        fontSize = '0.8rem';
    } else if (textLength > 80) {
        fontSize = '0.9rem';
    }
    questionElement.style.fontSize = fontSize;
}

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-game');
    
    if (!canPlayToday()) {
        const savedState = JSON.parse(localStorage.getItem('gameState') || '{}');
        if (savedState.completed) {
            startButton.classList.add('played');
            startButton.innerHTML = '<span>Review My Game</span>';
        } else {
            startButton.classList.add('continue');
            startButton.innerHTML = '<span>Continue Game</span>';
            // Load the saved questions if they exist
            questions = JSON.parse(localStorage.getItem('dailyQuestions') || '[]');
        }
    }
    window.addEventListener('resize', adjustModalTextSize); // Add it here, at the start

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = localStorage.getItem('theme') === 'dark';

        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
const startGame = document.getElementById("start-game");
    if (startButton) {
        startButton.onclick = function() {
            const savedState = JSON.parse(localStorage.getItem('gameState') || '{}');
            
            if (!canPlayToday()) {
                if (savedState.completed) {
                    // Review completed game logic
                    allGuesses = JSON.parse(localStorage.getItem('dailyGuesses') || '[]');
                    questions = JSON.parse(localStorage.getItem('dailyQuestions') || '[]');
                    const dailyData = JSON.parse(localStorage.getItem(DAILY_SCORES_KEY) || '{}')[new Date().toDateString()];
                    totalScore = dailyData.score;
                    
                    const heroContainer = document.querySelector('.hero-container');
                    heroContainer.style.display = "none";
                    
                    const gameSection = document.getElementById('game-section');
                    gameSection.style.display = "block";
                    
                    initializeMap();
                    endGame();
} else {
    // Continue incomplete game logic
    const heroContainer = document.querySelector('.hero-container');
    const gameSection = document.getElementById('game-section');
    
    if (heroContainer && gameSection) {
        heroContainer.style.display = "none";
        gameSection.style.display = "block";
        
        initializeMap();
        
        if (loadGameState()) {
            if (currentQuestion < questions.length) {
                document.getElementById("question").textContent = questions[currentQuestion].question;
                document.getElementById("score").textContent = `Score: ${totalScore}`;
                adjustQuestionFontSize();
                startTimer();
            } else {
                endGame();
            }
        }
    }
}
return;

            }

            // Regular new game start logic
            const heroContainer = document.querySelector('.hero-container');
            const gameSection = document.getElementById('game-section');
            
            if (heroContainer && gameSection) {
                heroContainer.style.display = "none";
                gameSection.style.display = "block";
                
                initializeMap();
                markAsPlayed();
                localStorage.setItem('dailyQuestions', JSON.stringify(questions));
                document.getElementById("question").textContent = questions[currentQuestion].question;
                adjustQuestionFontSize();
                startTimer();
            }
        };
    }


    const endScreen = document.getElementById('end-screen');
    if (endScreen) {
        const seeResultsBtn = endScreen.querySelector('#see-results-map');
        const shareResultsBtn = endScreen.querySelector('#share-results');

        if (seeResultsBtn) {
            seeResultsBtn.addEventListener('click', showAllGuessesOnMap);
        }

        if (shareResultsBtn) {
            shareResultsBtn.addEventListener('click', shareResults);
        }
    }
}); // Final closing bracket for DOMContentLoaded


document.getElementById('submit-guess').addEventListener('click', function() {
    saveGameState();
    if (!currentGuess) return;
    canGuess = false;
    stopTimer();
    
    const correctAnswer = questions[currentQuestion].answer;
    const distance = calculateDistance(currentGuess.lat, currentGuess.lng, correctAnswer[0], correctAnswer[1]);
    allGuesses.push(currentGuess);

    const nextButton = document.querySelector('.next-button');
    nextButton.style.display = 'block';
    this.style.display = 'none';

    if (currentQuestion === questions.length - 1) {
        nextButton.textContent = 'See Results';
    } else {
        nextButton.textContent = 'Next Question';
    }

    const score = Math.max(0, Math.round(4000 * (1 - distance/20000)));
    totalScore += score;

    // New animation code
    const scoreBox = document.querySelector('.stat-box:nth-child(2)');
    const distanceBox = document.querySelector('.stat-box:nth-child(1)');
    
    document.getElementById('score').textContent = `Score: ${totalScore}`;
    document.getElementById('distance').textContent = `Distance: ${Math.round(distance)} km`;
    
    scoreBox.classList.add('reveal');
    distanceBox.classList.add('reveal');
    
    setTimeout(() => {
        scoreBox.classList.remove('reveal');
        distanceBox.classList.remove('reveal');
    }, 1500);

    showGuessAndCorrectLocation(currentGuess, L.latLng(correctAnswer[0], correctAnswer[1]));
});

window.addEventListener('beforeunload', saveGameState);





function adjustMapBounds(marker) {
    const bounds = marker.getBounds();
    const padding = 50; // Adjust padding as needed
    map.fitBounds(bounds.pad(0.1), {
        padding: [padding, padding],
        maxZoom: 18,
        animate: true,
        duration: 0.5
    });
}

function handleGuessSubmission(distance, score) {
    const scoreBox = document.querySelector('.stat-box:nth-child(2)');
    const distanceBox = document.querySelector('.stat-box:nth-child(1)');
    
    // Update the values
    document.getElementById('distance').textContent = `${Math.round(distance)} km`;
    document.getElementById('score').textContent = score;
    
    // Add the reveal animation
    scoreBox.classList.add('reveal');
    distanceBox.classList.add('reveal');
    
    // Remove the animation class after it completes
    setTimeout(() => {
        scoreBox.classList.remove('reveal');
        distanceBox.classList.remove('reveal');
    }, 1500);
}

function submitGuess() {
    if (marker) {
        const userGuess = marker.getLatLng();
        const correctLatLng = questions[currentQuestion].location;
        const distance = calculateDistance(userGuess.lat, userGuess.lng, correctLatLng.lat, correctLatLng.lng);
        const points = calculateScore(distance);
        totalScore += points;
        document.getElementById('distance').textContent = `${distance.toFixed(0)} km`;
        document.getElementById('score').textContent = totalScore;
        showGuessAndCorrectLocation(userGuess, correctLatLng);
        document.getElementById('submit-guess').style.display = 'none';
    } else {
        alert('Please place a marker on the map.');
    }
}

function adjustModalHeight() {
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent) return;

    const modalMargin = 0; // Adjust if needed
    const modalPadding = 40; // Adjust if needed
    const headerHeight = document.querySelector('.modal-header')?.offsetHeight || 0;
    const footerHeight = document.querySelector('.modal-footer')?.offsetHeight || 0;

    const availableHeight = window.innerHeight - (modalMargin * 2) - modalPadding - headerHeight - footerHeight;

    modalContent.style.maxHeight = `${availableHeight}px`;
}


function openModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
}

function adjustModalTextSize() {
    const modalInfo = document.querySelector('.modal-info p');
    const modalContainer = document.querySelector('.modal-info');
    
    if (!modalInfo || !modalContainer) return;
    
    // Reset font size to measure natural height
    modalInfo.style.fontSize = '0.9rem';
    
    // Get the container's height and the text content height
    const containerHeight = modalContainer.clientHeight;
    const textHeight = modalInfo.scrollHeight;
    
    // Calculate ratio between container and text height
    const ratio = containerHeight / textHeight;
    
    // If text is too large for container
    if (ratio < 1) {
        // Calculate new font size (with a minimum of 0.6rem)
        const newSize = Math.max(0.6, 0.9 * ratio);
        modalInfo.style.fontSize = `${newSize}rem`;
    }
}

function adjustModalSize() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    const modalContent = document.querySelector('.modal-content');
    const modalMap = document.querySelector('#modal-map');
    const modalInfo = document.querySelector('.modal-info');
    
    // Adjust map size based on screen height
    const mapHeight = window.innerHeight <= 700 ? '45vh' 
        : window.innerHeight <= 900 ? '50vh' 
        : '55vh';
    
    modalMap.style.height = mapHeight;
    
    // Adjust content padding and spacing
    const contentPadding = window.innerWidth <= 480 ? '8px' : '16px';
    
    modalContent.style.padding = contentPadding;
}

window.addEventListener('resize', adjustModalSize);
window.addEventListener('load', adjustModalSize);