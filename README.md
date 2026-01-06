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
















/* 1. RESET PAGE MARGINS & PADDING */
html, body {
  padding: 0 !important;
  margin: 0 !important;
  overflow-x: hidden;
}

/* 2. REMOVE FILLOUT DEFAULT PAGE WIDTH & PADDING */
.fillout-form-wrapper, 
.fillout-page, 
.fillout-page-container,
.fillout-container {
  padding: 0 !important;
  margin: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
}

/* 3. YOUR CONTAINER STYLES */
.fillout-field-container {
  background: linear-gradient(90deg, #F7901F 0%, #EF4444 100%);
  padding: 60px 120px !important;
  border-radius: 0px;
  color: white;
  text-align: center;
  box-sizing: border-box; /* Prevents padding from breaking width */
  width: 100% !important;
}

/* 4. INPUT STYLES */
.fillout-field-container input {
  background: white !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 12px 20px !important; /* Fixed: Added colon */
  color: #333 !important;
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
  padding: 12px 30px !important;
  border: none !important;
  transition: transform 0.2s ease;
}

.fillout-field-button button:hover {
  transform: scale(1.05);
  background-color: #f9f9f9 !important;
}

/* 7. TEXT STYLES */
.fillout-field-text h1, 
.fillout-field-text h2, 
.fillout-field-text p {
  color: #ffffff !important;
}

/* 8. MOBILE RESPONSIVENESS (Important) */
@media (max-width: 768px) {
  .fillout-field-container {
    padding: 40px 20px !important; /* Reduces 120px padding so it fits on phones */
  }
}
.fillout-field-text h1, h2, p {
  color: #ffffff !important;
}
