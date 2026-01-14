/* 1. Target the main wrapper and root levels */
body, 
#root, 
.fillout-form-wrapper {
  background-color: transparent !important;
  background-image: none !important;
}

/* 2. Target the page container (which you already have) */
.fillout-page-container {
  background-color: transparent !important;
  background-image: none !important;
}

/* 3. Force any potential "Canvas" layers to be clear */
[class*="Background"], 
[class*="Canvas"] {
  background-color: transparent !important;
  background-image: none !important;
}
