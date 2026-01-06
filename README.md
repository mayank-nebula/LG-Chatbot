.fillout-field-container {
     background: #F7901F;
     padding: 60px 80px;
     border-radius: 12px;
     color: white;
     text-align: center;
     box-sizing: border-box;
     
     /* FIX: Remove absolute positioning */
     position: relative !important; 
     /* Centering using margins instead */
     margin: 40px auto !important; 
     max-width: 90%; /* Optional: keeps it from hitting edges */
     width: 100%;
}

.fillout-field-label {
    display: none !important;
}

.fillout-field-container input {
     background: white !important;
     border: none !important;
     border-radius: 8px !important;
     padding: 12px 20px;
     color: #333 !important;
}

.fillout-field-container input:focus {
    outline: none;
    border: 1px solid #000;
}

.fillout-field-button button {
    background-color: white;
    color: #000;
    font-weight: bold;
    border-radius: 8px;
    padding: 12px 30px;
    border: none;
    margin-top: 20px;
    transition: transform 0.2s ease;
}

.fillout-field-button button:hover {
    transform: scale(1.05);
    background-color: #f9f9f9;
}

.fillout-field-text h1, .fillout-field-text h2, .fillout-field-text p {
    color: #ffffff;
}

@media (max-width: 768px) {
    .fillout-field-container {
        padding: 40px 20px;
        margin: 20px auto !important;
    }

    .fillout-field-container input {
        width: 100%;
    }
}
