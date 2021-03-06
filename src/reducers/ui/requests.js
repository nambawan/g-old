import {
  CREATE_REQUEST_START,
  CREATE_REQUEST_SUCCESS,
  CREATE_REQUEST_ERROR,
  UPDATE_REQUEST_START,
  UPDATE_REQUEST_ERROR,
  UPDATE_REQUEST_SUCCESS,
  DELETE_REQUEST_START,
  DELETE_REQUEST_ERROR,
  DELETE_REQUEST_SUCCESS,
} from '../../constants';

// import { getErrors, getSuccessState } from '../../core/helpers';

const initState = {
  mutation: {
    success: false,
    error: '',
    pending: false,
  },
};
const requests = (state = initState, action) => {
  switch (action.type) {
    case CREATE_REQUEST_START:
    case UPDATE_REQUEST_START:
    case DELETE_REQUEST_START: {
      return {
        ...state,
        mutation: {
          pending: true,
          success: false,
          error: '',
        },
      };
    }

    case CREATE_REQUEST_ERROR:
    case UPDATE_REQUEST_ERROR:
    case DELETE_REQUEST_ERROR: {
      return {
        ...state,
        mutation: {
          pending: false,
          success: false,
          error: action.message,
        },
      };
    }

    case CREATE_REQUEST_SUCCESS:
    case UPDATE_REQUEST_SUCCESS:
    case DELETE_REQUEST_SUCCESS: {
      return {
        ...state,
        mutation: {
          pending: false,
          success: true,
          error: '',
        },
      };
    }

    default:
      return state;
  }
};
export default requests;

export const getStatus = state => state.mutation || {};
