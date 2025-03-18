// src/store/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        login: (state, action) => {
            state.user = action.payload;
            state.error = null;
            state.loading = false;
        },
        logout: (state) => {
            state.user = null;
        },
        setLoading: (state) => {
            state.loading = true;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

// Export actions
export const { login, logout, setLoading, setError } = userSlice.actions;

// Export reducer
export default userSlice.reducer;
