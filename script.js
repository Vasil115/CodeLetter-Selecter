document.addEventListener('DOMContentLoaded', () => {
    const scratchCardContainer = document.querySelector('.scratch-card-container');
    const nextBtn = document.getElementById('nextBtn');
    const restartBtn = document.getElementById('restartBtn');
    const startLetterSelect = document.getElementById('startLetter');
    const endLetterSelect = document.getElementById('endLetter');

    let currentCanvas = null;
    let ctx = null;
    let isScratching = false;
    let revealedPercentage = 0;
    const REVEAL_THRESHOLD = 0.5; // 50% revealed to show the letter fully

    let availableLetters = []; // ലഭ്യമായ അക്ഷരങ്ങൾ സംഭരിക്കാൻ
    let currentLetter = ''; // നിലവിൽ കാണിക്കുന്ന അക്ഷരം

    // Function to populate letter selection dropdowns
    function populateLetterSelects() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < alphabet.length; i++) {
            const letter = alphabet[i];
            const optionStart = document.createElement('option');
            optionStart.value = letter;
            optionStart.textContent = letter;
            startLetterSelect.appendChild(optionStart);

            const optionEnd = document.createElement('option');
            optionEnd.value = letter;
            optionEnd.textContent = letter;
            endLetterSelect.appendChild(optionEnd);
        }
        // Set default values
        startLetterSelect.value = 'A';
        endLetterSelect.value = 'Z';
    }

    // Initialize available letters based on selection
    function initializeAvailableLetters() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const startIndex = alphabet.indexOf(startLetterSelect.value);
        const endIndex = alphabet.indexOf(endLetterSelect.value);

        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
            console.error("Invalid letter range selected. Defaulting to A-Z.");
            availableLetters = alphabet.split(''); // Default to all letters if invalid
        } else {
            availableLetters = alphabet.substring(startIndex, endIndex + 1).split('');
        }
        shuffleArray(availableLetters); // അക്ഷരങ്ങൾ ക്രമരഹിതമാക്കുന്നു
        console.log("Available Letters:", availableLetters);
    }

    // Fisher-Yates (Knuth) shuffle algorithm to randomize array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    // Function to get a random letter from available letters
    function getRandomLetter() {
        if (availableLetters.length === 0) {
            alert("എല്ലാ അക്ഷരങ്ങളും ലഭിച്ചു കഴിഞ്ഞു! Restart ചെയ്യുക.");
            nextBtn.disabled = true; // No more letters, disable Next button
            return '?'; // Return a placeholder
        }
        // Pop the last element to ensure it's not repeated until all are used
        return availableLetters.pop();
    }

    // Function to create a new scratch card
    function createScratchCard() {
        if (availableLetters.length === 0) {
            alert("എല്ലാ അക്ഷരങ്ങളും ലഭിച്ചു കഴിഞ്ഞു! Restart ചെയ്യുക.");
            nextBtn.disabled = true;
            return;
        }

        scratchCardContainer.innerHTML = ''; // Clear previous card
        nextBtn.disabled = true; // Disable Next button until revealed

        const scratchBox = document.createElement('div');
        scratchBox.classList.add('scratch-box');

        const hiddenContent = document.createElement('p');
        hiddenContent.classList.add('hidden-content');
        currentLetter = getRandomLetter(); // Get a random letter
        hiddenContent.textContent = currentLetter;
        scratchBox.appendChild(hiddenContent);

        const canvas = document.createElement('canvas');
        canvas.classList.add('scratch-canvas');
        scratchBox.appendChild(canvas);
        currentCanvas = canvas;

        scratchCardContainer.appendChild(scratchBox);

        // Set canvas dimensions after it's in the DOM
        // Use setTimeout to ensure styles are applied and dimensions are correct
        setTimeout(() => {
            canvas.width = scratchBox.offsetWidth;
            canvas.height = scratchBox.offsetHeight;
            ctx = canvas.getContext('2d');
            drawScratchLayer();
        }, 0);


        // Add event listeners for scratching
        canvas.addEventListener('mousedown', startScratch);
        canvas.addEventListener('touchstart', startScratch, { passive: true });
    }

    // Function to draw the pink scratch layer
    function drawScratchLayer() {
        if (!ctx) return;
        ctx.fillStyle = '#ff69b4'; // Pink color
        ctx.fillRect(0, 0, currentCanvas.width, currentCanvas.height);
        ctx.globalCompositeOperation = 'destination-out'; // This makes erasing possible
    }

    // Start scratching
    function startScratch(e) {
        e.preventDefault(); // Prevent default touch behavior (scrolling)
        isScratching = true;
        revealedPercentage = 0; // Reset percentage
        let clientX, clientY;

        if (e.type === 'touchstart') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = currentCanvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Draw initial "scratch"
        draw(x, y);

        // Add move and end listeners
        currentCanvas.addEventListener('mousemove', scratch);
        currentCanvas.addEventListener('touchmove', scratch, { passive: true });
        window.addEventListener('mouseup', endScratch); // Use window to catch outside canvas release
        window.addEventListener('touchend', endScratch);
    }

    // Perform scratching
    function scratch(e) {
        if (!isScratching) return;
        e.preventDefault(); // Prevent default touch behavior (scrolling)

        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = currentCanvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        draw(x, y);
        checkRevealProgress();
    }

    // End scratching
    function endScratch() {
        isScratching = false;
        currentCanvas.removeEventListener('mousemove', scratch);
        currentCanvas.removeEventListener('touchmove', scratch);
        window.removeEventListener('mouseup', endScratch);
        window.removeEventListener('touchend', endScratch);
        checkRevealProgress(true); // Final check to ensure content is revealed
    }

    // Draw on the canvas (erasing effect)
    function draw(x, y) {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2); // Adjust radius for scratch area
        ctx.fill();
    }

    // Check how much of the canvas is revealed
    function checkRevealProgress(forceReveal = false) {
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, currentCanvas.width, currentCanvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;

        // Loop through pixel data, checking alpha channel (every 4th byte)
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] === 0) { // Alpha is 0 for transparent pixels
                transparentPixels++;
            }
        }

        revealedPercentage = (transparentPixels / (currentCanvas.width * currentCanvas.height)) * 100;

        if (revealedPercentage >= REVEAL_THRESHOLD * 100 || forceReveal) {
            revealContent();
            nextBtn.disabled = false; // Enable Next button once revealed
        }
    }

    // Reveal the hidden content
    function revealContent() {
        if (!currentCanvas || !currentCanvas.parentNode) return;

        const scratchBox = currentCanvas.parentNode;
        scratchBox.classList.add('revealed'); // Add class for CSS transition
        currentCanvas.style.opacity = '0'; // Hide canvas visually
        setTimeout(() => {
            currentCanvas.style.display = 'none'; // Fully hide after transition
        }, 500); // Match CSS transition duration
    }

    // Event listener for Next button
    nextBtn.addEventListener('click', () => {
        createScratchCard(); // Create a new scratch card
    });

    // Event listener for Restart button
    restartBtn.addEventListener('click', () => {
        location.reload(); // Reloads the entire page
    });

    // Event listeners for letter selection changes
    startLetterSelect.addEventListener('change', () => {
        if (alphabet.indexOf(startLetterSelect.value) > alphabet.indexOf(endLetterSelect.value)) {
            endLetterSelect.value = startLetterSelect.value; // Adjust end if start > end
        }
        initializeAvailableLetters();
        createScratchCard();
    });

    endLetterSelect.addEventListener('change', () => {
        if (alphabet.indexOf(endLetterSelect.value) < alphabet.indexOf(startLetterSelect.value)) {
            startLetterSelect.value = endLetterSelect.value; // Adjust start if end < start
        }
        initializeAvailableLetters();
        createScratchCard();
    });

    // Initial setup
    populateLetterSelects();
    // Initialize available letters based on default selection before creating the first card
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Define alphabet here for select listeners
    initializeAvailableLetters();
    createScratchCard(); // Create the first scratch card on load
});
