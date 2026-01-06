.fillout-field-container {
     background: #F7901F;
     padding: 60px 80px !important;
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
     margin: 20px !important;
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
     margin: none !important;
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

















.fillout-field-container {
    background: #F7901F;
    padding: 60px 80px;
    border-radius: 12px;
    color: white;
    text-align: center;
    box-sizing: border-box;

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    display: flex;
    flex-direction: column;
    align-items: center;
}

.fillout-field-container form {
    display: flex;
    gap: 20px;
    margin: 30px 0;
}

.fillout-field-container input {
    background: white;
    border: none;
    border-radius: 8px;
    padding: 12px 20px;
    width: 220px;
    color: #333;
    box-sizing: border-box;
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

.fillout-field-text h1, h2, p {
    color: #ffffff;
}

@media (max-width: 768px) {
    .fillout-field-container {
        padding: 40px 20px;
    }

    .fillout-field-container form {
        flex-direction: column;
        width: 100%;
    }

    .fillout-field-container input {
        width: 100%;
    }
}

