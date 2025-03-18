import React from 'react';
import './WhatsappChat.css';  // Import CSS for styling
import whatsappLogo from './../assets/whatsapp.png'; // Adjust the path as necessary

const Whatsapp = () => {
  return (
    <div className="whatsapp-chat">
      <a
        href="https://web.whatsapp.com/send?phone=628243" // Replace with your phone number
        className="whatsapp-button"
        id="whatsappButton"
        target="_blank" // Opens WhatsApp in a new tab
        rel="noopener noreferrer"
      >
        <img src={whatsappLogo} alt="WhatsApp Logo" className="whatsapp-icon" /> {/* WhatsApp logo */}
        <span className="chat-tooltip">Chat with us!</span>
      </a>
    </div>
  );
};

export default Whatsapp;