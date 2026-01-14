/* 1. MAKE EVERYTHING TRANSPARENT (Page & Background) */
body, 
#root, 
.fillout-page-container,
.fillout-form-wrapper {
  background-color: transparent !important;
  background-image: none !important;
}

/* 2. REMOVE THE BOX & SHADOW (The container in the middle) */
.fillout-field-container {
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  border: none !important;
}

/* 3. STYLE THE INPUT FIELDS (The boxes where users type) */
/* This makes them semi-transparent so they look good on your React gradient */
.fillout-input {
  background-color: rgba(255, 255, 255, 0.6) !important; /* White with 60% opacity */
  border: 1px solid rgba(0, 0, 0, 0.1) !important; 
  backdrop-filter: blur(5px); /* Optional: gives a 'glass' effect */
}

/* 4. CLEAN UP ANY EXTRA LINES */
.fillout-layout-container {
  background-color: transparent !important;
  border: none !important;
}
