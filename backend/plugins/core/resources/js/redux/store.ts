import { configureStore } from '@reduxjs/toolkit';
import moduleReducer from './slices/moduleSlice';
import uiReducer from './slices/uiSlice';

/**
 * Configure Redux Store
 *
 * Combines all reducers and configures middleware
 */
import createSagaMiddleware from 'redux-saga';
import rootSaga from './sagas';
import resourceReducer from './slices/resourceSlice';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    module: moduleReducer,
    ui: uiReducer,
    resource: resourceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ['ui/openModal'],
        // Ignore these paths in the state
        ignoredPaths: ['ui.modalData'],
      },
      thunk: true,
    }).concat(sagaMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

sagaMiddleware.run(rootSaga);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
