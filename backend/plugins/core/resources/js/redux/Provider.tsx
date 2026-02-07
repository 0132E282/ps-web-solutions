import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';

/**
 * Redux Store Provider Component
 * 
 * Wraps the app with Redux Provider to make store available to all components
 * 
 * @example
 * ```tsx
 * import { ReduxStoreProvider } from '@core/redux/Provider';
 * 
 * <ReduxStoreProvider>
 *   <App />
 * </ReduxStoreProvider>
 * ```
 */
export const ReduxStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ReduxProvider store={store}>{children}</ReduxProvider>;
};

// Default export
export default ReduxStoreProvider;
