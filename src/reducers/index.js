import { combineReducers } from 'redux';
import user from './user';
import runtime from './runtime';
import intl from './intl';
import entities from './proposal';


export default combineReducers({
  user,
  runtime,
  intl,
  entities,
});
