/* 1. Reset the Fillout page background and layout */
.fillout-page {
    background: transparent !important;
    padding: 20px 0 !important; /* Small padding so it doesn't touch browser edges */
    display: flex !important;
    justify-content: center !important;
    align-items: flex-start !important; /* Starts from top so dynamicResize works perfectly */
    min-height: auto !important;
}

/* 2. The Orange Box - Shrinks to fit your content */
.fillout-field-container {
    background: #F7901F;
    padding: 50px 60px !important;
    border-radius: 12px;
    color: white;
    text-align: center;
    box-sizing: border-box;
    
    /* Dynamic width and centering */
    position: relative !important;
    width: fit-content !important;
    max-width: 90% !important;
    margin: 0 auto !important;
    
    /* Shadow (Optional: makes it pop against the black background) */
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

/* 3. Hide Labels */
.fillout-field-label {
    display: none !important;
}

/* 4. Input Styling */
.fillout-field-container input {
    background: white !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 12px 20px !important;
    color: #333 !important;
    margin-bottom: 10px !important;
}

.fillout-field-container input:focus {
    outline: 2px solid #000 !important;
}

/* 5. Button Styling */
.fillout-field-button button {
    background-color: white !important;
    color: #000 !important;
    font-weight: bold !important;
    border-radius: 8px !important;
    padding: 14px 40px !important;
    border: none !important;
    margin-top: 15px !important;
    cursor: pointer;
    transition: transform 0.2s ease, background-color 0.2s ease;
}

.fillout-field-button button:hover {
    transform: scale(1.03);
    background-color: #f0f0f0 !important;
}

/* 6. Typography */
.fillout-field-text h1, 
.fillout-field-text h2, 
.fillout-field-text p {
    color: #ffffff !important;
    margin-bottom: 20px !important;
}

/* 7. Mobile Adjustments */
@media (max-width: 768px) {
    .fillout-field-container {
        padding: 30px 20px !important;
        width: 95% !important;
    }
    
    .fillout-field-container input {
        width: 100% !important;
    }
}
