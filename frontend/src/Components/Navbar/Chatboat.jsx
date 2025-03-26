import React, { useState } from 'react';
import axios from 'axios';
import './Chatboat.css'; // Import the CSS file

function Chatboat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const toggleChatbot = () => setIsOpen(!isOpen);

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await axios.post('http://localhost:8080/api/chatbotRoutes/chatbot', {
        message: input,
      });

      if (response.data && response.data.response) {
        const botMessage = { sender: 'bot', text: response.data.response };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Error connecting to server.' },
      ]);
    }
  };

  const renderMessages = () =>
    messages.map((msg, index) => (
      <div
        key={index}
        className={`message ${msg.sender === 'user' ? 'message-user' : 'message-bot'}`}
      >
        {msg.text}
      </div>
    ));

  return (
    <>
      <div className="fixed bottom-14 right-5">
        <div
          className="chat-icon-button bg-red-600 hover:bg-red-700"
          onClick={toggleChatbot}
        >
          <div className="chat-icon">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 2H4C2.9 2 2 2.9 2 4V18C2 19.1 2.9 20 4 20H18L22 24V4C22 2.9 21.1 2 20 2Z"/>
</svg>

          </div>
        </div>
      </div>

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h4 className="chatbot-title">Chatbot</h4>
            <button className="chatbot-close" onClick={toggleChatbot}>✖</button>
          </div>
          <div className="chatbot-messages">
            {renderMessages()}
          </div>
          <div className="chatbot-input-area">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              className="chatbot-send-button"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatboat;
