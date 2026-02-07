import { all } from 'redux-saga/effects';
import { resourceSaga } from './resourceSaga';

export default function* rootSaga() {
    yield all([
        resourceSaga(),
    ]);
}
