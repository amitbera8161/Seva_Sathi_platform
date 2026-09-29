import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice.js'
import bloodNetworkReducer from './slices/bloodNetworkSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bloodNetwork: bloodNetworkReducer,
  },
})
