.fillout-field-container {
  background: #F7901F;
  padding: 60px 120px !important;
  border-radius: 12px;
  color: white;
  text-align: center;
  box-sizing: border-box;
  
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  
}

.fillout-field-container input {
  background: white !important;
  border: none !important;
  border-radius: 8px !important;
  padding 12px 20px !important;
  color: #333 !important;
}

.fillout-field-container input:focus {
  outline: none !important;
  border: 1px solid #000000 !important;
  box-shadow: none !important;
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
  margin: 20px !important;
  border: none !important;
  transition: transform 0.2s ease;
}

.fillout-field-text h1, h2, p {
  color: #ffffff !important;
}

@media (max-width: 768px) {
  .fillout-field-container {
    padding: 40px 20px !important;
  }
}
