/* 1. REMOVE WHITE BACKGROUND BEHIND THE CONTAINER */
html, body, 
.fillout-form-wrapper, 
.fillout-page, 
.fillout-page-container {
  background-color: transparent !important;
  background: none !important;
  padding: 0 !important;
  margin: 0 !important;
  box-shadow: none !important;
  border: none !important;
  height: 100% !important;
}

/* 2. MAIN CONTAINER */
.fillout-field-container {
  background: #F7901F;
  padding: 60px 80px !important; /* Adjusted for better balance */
  border-radius: 12px;
  color: white;
  text-align: center;
  box-sizing: border-box;
  
  /* Centering Logic */
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  
  /* Width Control - Critical for absolute positioning */
  width: 90% !important;
  max-width: 550px !important; 
}

/* 3. INPUT STYLES */
.fillout-field-container input {
  background: white !important;
  border: 1px solid transparent !important; /* Prevents "jumping" when black border appears */
  border-radius: 8px !important;
  padding: 12px 20px !important; /* Fixed: Added missing colon */
  color: #333 !important;
  width: 100% !important;
  display: block !important;
  margin: 12px auto !important;
  transition: border 0.2s ease;
}

/* 4. BLACK BORDER ON CLICK (FOCUS) */
.fillout-field-container input:focus {
  outline: none !important;
  border: 1px solid #000000 !important;
  box-shadow: none !important;
}

/* 5. HIDE LABELS */
.fillout-field-label {
  display: none !important;
}

/* 6. BUTTON STYLES */
.fillout-field-button button {
  background-color: white !important;
  color: #000000 !important;
  font-weight: bold;
  border-radius: 8px !important;
  padding: 12px 40px !important;
  margin-top: 20px !important; /* Changed from margin: 20px for better alignment */
  border: none !important;
  transition: transform 0.2s ease, background-color 0.2s ease;
  cursor: pointer;
}

.fillout-field-button button:hover {
  transform: scale(1.05);
  background-color: #f9f9f9 !important;
}

/* 7. TEXT STYLES (Specific to your container) */
.fillout-field-text h1, 
.fillout-field-text h2, 
.fillout-field-text p {
  color: #ffffff !important;
  margin-bottom: 10px !important;
}

/* 8. MOBILE RESPONSIVENESS */
@media (max-width: 768px) {
  .fillout-field-container {
    padding: 40px 20px !important;
    width: 95% !important;
  }
}
