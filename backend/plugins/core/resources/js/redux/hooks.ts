import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed useDispatch hook
 * Use throughout the app instead of plain `useDispatch`
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/**
 * Typed useSelector hook
 * Use throughout the app instead of plain `useSelector`
 */
export const useAppSelector = useSelector.withTypes<RootState>();
