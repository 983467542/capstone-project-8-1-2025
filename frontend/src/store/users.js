// frontend/src/store/users.js
import { csrfFetch } from '../store/csrf';
import { restoreUser, logout } from './session';

// Action Types
const SET_LOADING = 'user/SET_LOADING';
const SET_ERROR = 'user/SET_ERROR';
const SET_AVAILABLE_USERS = 'users/SET_AVAILABLE_USERS';

// Action Creators
export const setLoading = (isLoading) => ({
    type: SET_LOADING,
    payload: isLoading,
});

export const setError = (error) => ({
    type: SET_ERROR,
    payload: error,
});

export const setAvailableUsers = (otherUsers) => ({
    type: SET_AVAILABLE_USERS,
    payload: otherUsers
});

// Thunk Action Creators
export const fetchUser = (userId) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const res = await csrfFetch(`/users/${userId}`);

        if (!res.ok) throw new Error('Failed to fetch user');

        await dispatch(restoreUser());
    } catch (err) {
        dispatch(setError(err.message));
    } finally {
        dispatch(setLoading(false));
    }
};

export const createUser = (userData) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const res = await csrfFetch('/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!res.ok) throw new Error('Failed to create user');
        dispatch(restoreUser());
    } catch (err) {
        dispatch(setError(err.message));
    } finally {
        dispatch(setLoading(false));
    }
};

export const updateUser = (updates) => async (dispatch) => {

    const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    if (!csrfToken) {
        dispatch(setError('Missing CSRF token'));
        return;
    }

    dispatch(setLoading(true));
    try {
        const res = await csrfFetch('/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, },
            credentials: 'include',
            cache: 'no-cache',
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update profile');
        await dispatch(restoreUser());
    } catch (err) {
        dispatch(setError(err.message));
    } finally {
        dispatch(setLoading(false));
    }
};

export const deleteUser = () => async (dispatch) => {

    const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    if (!csrfToken) {
        dispatch(setError('Missing CSRF token'));
        return;
    }

    dispatch(setLoading(true));
    try {
        const res = await csrfFetch('/users', {
            method: 'DELETE',
            headers: {
                'X-CSRF-Token': csrfToken,
            },
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to delete account');
        dispatch(logout());
    } catch (err) {
        dispatch(setError(err.message));
    } finally {
        dispatch(setLoading(false));
    }
};

export const getAvailableUsers = () => async (dispatch) => {
    try {
        const response = await csrfFetch('/users');
        if (response.ok) {
            const otherUsers = await response.json();
            dispatch(setAvailableUsers(otherUsers));
        }
    } catch (error) {
        console.error('Failed to fetch available users:', error);
    }
};

// Initial State
const initialState = {
    availableUsers: [],
    loading: false,
    error: null,
};

// Reducer
const usersReducer = (state = initialState, action) => {
    // if (!action || typeof action.type !== 'string') return state;
    if (action.type.startsWith('@@redux/')) return state;

    switch (action.type) {
        case SET_LOADING:
            return { ...state, loading: action.payload };
        case SET_ERROR:
            return { ...state, error: action.payload };
        case SET_AVAILABLE_USERS:
            return {
                ...state,
                availableUsers: action.payload
            };
        default:
            return state;
    }
};

export default usersReducer;