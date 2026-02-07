import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Pagination State
 */
export interface PaginationState {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
  from: number | null;
  to: number | null;
}

/**
 * Datatable Filter State
 */
export interface FilterState {
  [key: string]: unknown;
}

/**
 * Datatable Sort State
 */
export interface SortState {
  field: string | null;
  direction: 'asc' | 'desc' | null;
}

/**
 * Form State Interface - CRUD & Datatable Operations
 */
export interface FormState {
  // ============ CRUD States ============
  // Create & Update states
  isSubmitting: boolean;
  
  // Delete state
  isDeleting: boolean;
  
  // Read/Loading state
  isLoading: boolean;
  
  // Current item ID being edited
  currentItemId: string | number | null;

  // ============ Datatable States ============
  // Pagination
  pagination: PaginationState;
  
  // Filters
  filters: FilterState;
  
  // Sorting
  sort: SortState;
  
  // Search
  searchTerm: string;
  
  // Selected rows
  selectedRows: Array<string | number>;
  
  // Loading state for table data
  isTableLoading: boolean;
  
  // Bulk operations
  isBulkDeleting: boolean;
}

/**
 * Initial state for form slice
 */
const initialState: FormState = {
  // CRUD states
  isSubmitting: false,
  isDeleting: false,
  isLoading: false,
  currentItemId: null,
  
  // Datatable states
  pagination: {
    currentPage: 1,
    perPage: 20,
    total: 0,
    lastPage: 1,
    from: null,
    to: null,
  },
  filters: {},
  sort: {
    field: null,
    direction: null,
  },
  searchTerm: '',
  selectedRows: [],
  isTableLoading: false,
  isBulkDeleting: false,
};

/**
 * Form Slice - CRUD & Datatable Operations Management
 * Manages Create, Read, Update, Delete operations and Datatable states
 */
export const formSlice = createSlice({
  name: 'module',
  initialState,
  reducers: {
    // ============ CRUD Actions ============
    /**
     * Set submitting state (Create/Update)
     */
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },

    /**
     * Set deleting state (Delete)
     */
    setDeleting: (state, action: PayloadAction<boolean>) => {
      state.isDeleting = action.payload;
    },

    /**
     * Set loading state (Read)
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Set current item ID being edited
     */
    setCurrentItemId: (state, action: PayloadAction<string | number | null>) => {
      state.currentItemId = action.payload;
    },

    // ============ Datatable Actions ============
    /**
     * Set table loading state
     */
    setTableLoading: (state, action: PayloadAction<boolean>) => {
      state.isTableLoading = action.payload;
    },

    /**
     * Set pagination state
     */
    setPagination: (state, action: PayloadAction<Partial<PaginationState>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    /**
     * Set current page
     */
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },

    /**
     * Set per page
     */
    setPerPage: (state, action: PayloadAction<number>) => {
      state.pagination.perPage = action.payload;
      state.pagination.currentPage = 1; // Reset to first page
    },

    /**
     * Set filters
     */
    setFilters: (state, action: PayloadAction<FilterState>) => {
      state.filters = action.payload;
      state.pagination.currentPage = 1; // Reset to first page when filtering
    },

    /**
     * Update single filter
     */
    updateFilter: (
      state,
      action: PayloadAction<{ key: string; value: unknown }>
    ) => {
      state.filters[action.payload.key] = action.payload.value;
      state.pagination.currentPage = 1;
    },

    /**
     * Clear filters
     */
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.currentPage = 1;
    },

    /**
     * Set sort
     */
    setSort: (state, action: PayloadAction<SortState>) => {
      state.sort = action.payload;
    },

    /**
     * Toggle sort direction
     */
    toggleSort: (state, action: PayloadAction<string>) => {
      const field = action.payload;
      if (state.sort.field === field) {
        // Same field, toggle direction
        state.sort.direction = 
          state.sort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        // New field, set to asc
        state.sort.field = field;
        state.sort.direction = 'asc';
      }
    },

    /**
     * Set search term
     */
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.pagination.currentPage = 1; // Reset to first page when searching
    },

    /**
     * Set selected rows
     */
    setSelectedRows: (state, action: PayloadAction<Array<string | number>>) => {
      state.selectedRows = action.payload;
    },

    /**
     * Toggle row selection
     */
    toggleRowSelection: (state, action: PayloadAction<string | number>) => {
      const id = action.payload;
      const index = state.selectedRows.indexOf(id);
      if (index > -1) {
        state.selectedRows.splice(index, 1);
      } else {
        state.selectedRows.push(id);
      }
    },

    /**
     * Clear selected rows
     */
    clearSelectedRows: (state) => {
      state.selectedRows = [];
    },

    /**
     * Set bulk deleting state
     */
    setBulkDeleting: (state, action: PayloadAction<boolean>) => {
      state.isBulkDeleting = action.payload;
    },

    /**
     * Reset form state to initial
     */
    resetForm: () => initialState,
    
    /**
     * Reset only datatable state
     */
    resetDatatable: (state) => {
      state.pagination = initialState.pagination;
      state.filters = initialState.filters;
      state.sort = initialState.sort;
      state.searchTerm = initialState.searchTerm;
      state.selectedRows = initialState.selectedRows;
      state.isTableLoading = initialState.isTableLoading;
      state.isBulkDeleting = initialState.isBulkDeleting;
    },
  },
});

// Export actions
export const {
  // CRUD actions
  setSubmitting,
  setDeleting,
  setLoading,
  setCurrentItemId,
  
  // Datatable actions
  setTableLoading,
  setPagination,
  setCurrentPage,
  setPerPage,
  setFilters,
  updateFilter,
  clearFilters,
  setSort,
  toggleSort,
  setSearchTerm,
  setSelectedRows,
  toggleRowSelection,
  clearSelectedRows,
  setBulkDeleting,
  
  // Reset actions
  resetForm,
  resetDatatable,
} = formSlice.actions;

// Export reducer
export default formSlice.reducer;
