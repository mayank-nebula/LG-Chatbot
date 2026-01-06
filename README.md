.fillout-field-container {
     background: #F7901F;
     padding: 60px 80px 60px 60px !important;
     border-radius: 12px;
     color: white;
     text-align: center;
     box-sizing: border-box;
     
     position: absolute !important;
     top: 50% !important;
     left: 50% !important;
     transform: translate(-50%, -50%) !important;
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
















/* ===== Base Container ===== */
.fillout-field-container {
    background: #F7901F;
    padding: 60px 80px 60px 60px;
    border-radius: 12px;
    color: #ffffff;
    text-align: center;
    box-sizing: border-box;
    max-width: 100%;

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

/* Hide labels */
.fillout-field-label {
    display: none;
}

/* ===== Typography ===== */
.fillout-field-text h1 {
    font-size: 36px;
    line-height: 1.2;
    margin-bottom: 12px;
}

.fillout-field-text h2 {
    font-size: 22px;
    line-height: 1.3;
    margin-bottom: 10px;
}

.fillout-field-text p {
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 18px;
}

/* ===== Inputs ===== */
.fillout-field-container input {
    width: 100%;
    background: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 14px 20px;
    font-size: 16px;
    color: #333;
}

.fillout-field-container input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
}

/* ===== Button ===== */
.fillout-field-button button {
    width: 100%;
    background-color: #ffffff;
    color: #000000;
    font-weight: 600;
    font-size: 16px;
    border-radius: 8px;
    padding: 14px 32px;
    border: none;
    margin-top: 20px;
    cursor: pointer;
    transition: transform 0.15s ease, background-color 0.15s ease;
}

.fillout-field-button button:hover {
    transform: scale(1.04);
    background-color: #f7f7f7;
}

/* Tap comfort */
.fillout-field-button button {
    min-height: 44px;
}

/* ===== Tablet & Small Desktop ===== */
@media (max-width: 768px) {
    .fillout-field-container {
        padding: 40px 28px;
    }

    .fillout-field-text h1 {
        font-size: 28px;
    }

    .fillout-field-text h2 {
        font-size: 18px;
    }
}

/* ===== Ultra-Small Devices (300px) ===== */
@media (max-width: 320px) {
    .fillout-field-container {
        padding: 24px 16px;
        border-radius: 10px;
    }

    .fillout-field-text h1 {
        font-size: 20px;
        margin-bottom: 8px;
    }

    .fillout-field-text h2 {
        font-size: 16px;
        margin-bottom: 6px;
    }

    .fillout-field-text p {
        font-size: 14px;
        margin-bottom: 12px;
    }

    .fillout-field-container input {
        padding: 10px 14px;
        font-size: 14px;
        border-radius: 6px;
    }

    .fillout-field-button button {
        padding: 10px 20px;
        font-size: 14px;
        border-radius: 6px;
        margin-top: 12px;
    }

    .fillout-field-button button:hover {
        transform: scale(1.02);
    }
}
