// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice'; // Import your user reducer

const store = configureStore({
    reducer: {
        user: userReducer, // Combine your reducers
        // other reducers can go here
    },
});

export default store;
