/* 1. Set the background for the entire section */
.fillout-page-container {
  background: linear-gradient(90deg, #FF6B35 0%, #E84A27 100%) !important;
  padding: 60px 20px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
}

/* 2. Make Heading and Paragraph white and centered */
.fillout-field-paragraph, 
.fillout-field-paragraph h2, 
.fillout-field-paragraph p {
  color: white !important;
  text-align: center !important;
  margin-bottom: 10px !important;
}

/* 3. Force the Inputs and Button into one horizontal line */
/* This targets the wrapper that holds your name, email, and button */
.fillout-form-section > div:last-child {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: flex-start !important;
  justify-content: center !important;
  gap: 15px !important;
  width: 100% !important;
  max-width: 1000px !important;
}

/* 4. Style the Input boxes */
.fillout-field-container {
  width: auto !important; /* Allows them to sit side-by-side */
  flex: 1 !important;    /* Makes Name and Email equal width */
}

.fillout-field-container input {
  background: white !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 12px 20px !important;
  color: #333 !important;
  height: 50px !important;
}

/* 5. Hide labels and extra spacing */
.fillout-field-label {
  display: none !important;
}

/* 6. Style the Button */
.fillout-field-button {
  width: auto !important;
  margin-top: 0px !important;
}

.fillout-field-button button {
  background-color: white !important;
  color: #000000 !important;
  font-weight: bold !important;
  border-radius: 8px !important;
  padding: 0px 40px !important; /* Horizontal padding for the button */
  height: 50px !important;      /* Matches input height */
  border: none !important;
  transition: transform 0.2s ease;
  cursor: pointer;
}

.fillout-field-button button:hover {
  transform: scale(1.05);
  background-color: #f9f9f9 !important;
}

/* Responsive: Stack them on mobile phones */
@media (max-width: 600px) {
  .fillout-form-section > div:last-child {
    flex-direction: column !important;
  }
  .fillout-field-container, .fillout-field-button {
    width: 100% !important;
  }
}
