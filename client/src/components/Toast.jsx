import { toast as hotToast } from 'react-hot-toast';

const toast = {
  success: (message, options = {}) => {
    return hotToast.success(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
      style: {
        background: '#10B981',
        color: 'white',
        ...options.style,
      },
    });
  },
  
  error: (message, options = {}) => {
    return hotToast.error(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
      style: {
        background: '#EF4444',
        color: 'white',
        ...options.style,
      },
    });
  },
};

export default toast;
