import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ChatComponent = ({ boatId, boatOwnerId, customerId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/chat/${boatId}/${customerId}`);
        setMessages(res.data.messages);
      } catch (error) {
        console.error('Error fetching chat messages:', error);
      }
    };

    fetchMessages();
  }, [boatId, customerId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await axios.post('http://localhost:8080/api/chat/send', {
        boatId,
        boatOwnerId,
        customerId,
        senderId: currentUser.id,
        message: newMessage
      });

      setMessages(res.data.messages);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div key={index} style={msg.senderId === currentUser.id ? styles.sentMessage : styles.receivedMessage}>
            <p><strong>{msg.senderId === boatOwnerId ? 'Boat Owner' : 'Customer'}:</strong> {msg.message}</p>
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Type a message..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.sendButton}>Send</button>
      </div>
    </div>
  );
};

const styles = {
  chatContainer: { width: '100%', maxWidth: '400px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px', backgroundColor: '#fff' },
  messagesContainer: { height: '300px', overflowY: 'auto', padding: '5px' },
  sentMessage: { backgroundColor: '#dcf8c6', padding: '5px', borderRadius: '5px', margin: '5px 0', alignSelf: 'flex-end' },
  receivedMessage: { backgroundColor: '#f1f0f0', padding: '5px', borderRadius: '5px', margin: '5px 0', alignSelf: 'flex-start' },
  inputContainer: { display: 'flex', alignItems: 'center', marginTop: '10px' },
  input: { flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' },
  sendButton: { marginLeft: '10px', padding: '8px 15px', border: 'none', backgroundColor: '#007BFF', color: '#fff', borderRadius: '4px', cursor: 'pointer' }
};

export default ChatComponent;
