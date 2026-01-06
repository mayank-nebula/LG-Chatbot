.fillout-field-container {
  background: linear-gradient(90deg, #F7901F 0%, #EF4444 100%);
  padding: 60px 120px !important;
  border-radius: 0px;
  color: white;
  text-align: center;
}

.fillout-field-container input {
  background: white !important;
  border: none !important;
  border-radius: 8px !important;
  padding 12px 20px !important;
  color: #333 !important;
}

.fillout-field-label {
  display: none !important;
}

.fillout-field-button button:hover {
  transform: scale(1.05);
  background-color: #f9f9f9 !important;
}

.fillout-field-button button {
  background-color: white !important;
  color: #000000 !important;
  font-weight: bold;
  border-radius: 8px !important;
  padding: 12px 30px !important;
  border: none !important;
  transition: transform 0.2s ease;
}
















/* 1. FORCE THE PAGE AND WRAPPER TO BE TRANSPARENT AND FULL WIDTH */
.fillout-page, 
.fillout-page-container, 
.fillout-form-wrapper,
.fillout-container {
  background-color: transparent !important;
  background: transparent !important;
  max-width: 100% !important;
  width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  box-shadow: none !important; /* Removes the slight shadow around the white box */
  border: none !important;
}

/* 2. REMOVE BODY MARGINS */
html, body {
  margin: 0 !important;
  padding: 0 !important;
  background-color: #F7901F; /* Optional: Sets a fallback color so white doesn't flash */
}

/* 3. YOUR ORIGINAL STYLES (WITH REVISIONS) */
.fillout-field-container {
  background: linear-gradient(90deg, #F7901F 0%, #EF4444 100%);
  padding: 60px 120px !important;
  border-radius: 0px;
  color: white;
  text-align: center;
  width: 100vw !important; /* Force to full viewport width */
  min-height: 100vh; /* Optional: makes the orange fill the whole height of the screen */
  box-sizing: border-box;
}

/* 4. INPUTS */
.fillout-field-container input {
  background: white !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 12px 20px !important;
  color: #333 !important;
}

/* 5. HIDE LABELS */
.fillout-field-label {
  display: none !important;
}

/* 6. BUTTONS */
.fillout-field-button button {
  background-color: white !important;
  color: #000000 !important;
  font-weight: bold;
  border-radius: 8px !important;
  padding: 12px 30px !important;
  border: none !important;
  transition: transform 0.2s ease;
}

.fillout-field-button button:hover {
  transform: scale(1.05);
  background-color: #f9f9f9 !important;
}

/* 7. TEXT */
.fillout-field-text h1, 
.fillout-field-text h2, 
.fillout-field-text p {
  color: #ffffff !important;
}

/* 8. MOBILE FIX */
@media (max-width: 768px) {
  .fillout-field-container {
    padding: 40px 20px !important;
  }
}
