import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * UI State Interface
 */
export interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  modalOpen: boolean;
  modalType: string | null;
  modalData: Record<string, unknown> | null;
  loading: boolean;
  loadingMessage: string | null;
}

/**
 * Initial state for UI slice
 */
const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  modalOpen: false,
  modalType: null,
  modalData: null,
  loading: false,
  loadingMessage: null,
};

/**
 * UI Slice
 * Manages UI states like sidebar, modals, loading indicators
 */
export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Toggle sidebar open/close
     */
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    /**
     * Set sidebar open state
     */
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    /**
     * Toggle sidebar collapsed state
     */
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    /**
     * Set sidebar collapsed state
     */
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    /**
     * Open modal with type and data
     */
    openModal: (
      state,
      action: PayloadAction<{
        type: string;
        data?: Record<string, unknown>;
      }>
    ) => {
      state.modalOpen = true;
      state.modalType = action.payload.type;
      state.modalData = action.payload.data || null;
    },

    /**
     * Close modal and clear data
     */
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalType = null;
      state.modalData = null;
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (!action.payload) {
        state.loadingMessage = null;
      }
    },

    /**
     * Set loading with message
     */
    setLoadingWithMessage: (
      state,
      action: PayloadAction<{ loading: boolean; message?: string }>
    ) => {
      state.loading = action.payload.loading;
      state.loadingMessage = action.payload.message || null;
    },

    /**
     * Reset UI state to initial
     */
    resetUI: () => initialState,
  },
});

// Export actions
export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  openModal,
  closeModal,
  setLoading,
  setLoadingWithMessage,
  resetUI,
} = uiSlice.actions;

// Export reducer
export default uiSlice.reducer;
