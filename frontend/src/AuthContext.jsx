// src/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the Auth Context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Logic to check if the user is logged in
        const token = localStorage.getItem('token'); // Check if a token exists in localStorage
        setIsLoggedIn(!!token); // Set isLoggedIn to true if the token exists
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
            {children}
        </AuthContext.Provider>
    );
};

// Create a custom hook to use the Auth Context
export const useAuth = () => {
    return useContext(AuthContext);
};
