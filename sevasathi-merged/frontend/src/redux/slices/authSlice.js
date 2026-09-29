import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload
      state.status = 'succeeded'
    },
    clearUser(state) {
      state.user = null
      state.status = 'idle'
    },
    setAuthLoading(state) {
      state.status = 'loading'
    },
    setAuthError(state, action) {
      state.status = 'failed'
      state.error = action.payload
    },
  },
})

export const { setUser, clearUser, setAuthLoading, setAuthError } = authSlice.actions
export default authSlice.reducer
