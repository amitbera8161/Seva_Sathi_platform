import { createSlice } from '@reduxjs/toolkit'

const bloodNetworkSlice = createSlice({
  name: 'bloodNetwork',
  initialState: {
    requests: [],
    donors: [],
    status: 'idle',
  },
  reducers: {
    setRequests(state, action) {
      state.requests = action.payload
    },
    addRequest(state, action) {
      state.requests.push(action.payload)
    },
    setDonors(state, action) {
      state.donors = action.payload
    },
  },
})

export const { setRequests, addRequest, setDonors } = bloodNetworkSlice.actions
export default bloodNetworkSlice.reducer
