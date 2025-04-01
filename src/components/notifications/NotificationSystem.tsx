import { useState, useEffect, useCallback } from 'react';

// Notification type
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  autoClose?: boolean;
  duration?: number;
}

// Notification context props
interface NotificationContextProps {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// Notification system props
interface NotificationSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxNotifications?: number;
}

/**
 * NotificationSystem component displays notifications in a stack
 */
export function NotificationSystem({
  position = 'top-right',
  maxNotifications = 5,
}: NotificationSystemProps) {
  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  // Add notification
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newNotification: Notification = {
        id,
        autoClose: true,
        duration: 5000,
        ...notification,
      };

      setNotifications((prev) => {
        // Limit the number of notifications
        const updatedNotifications = [newNotification, ...prev];
        return updatedNotifications.slice(0, maxNotifications);
      });

      // Auto close notification if enabled
      if (newNotification.autoClose) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }
    },
    [maxNotifications]
  );

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get notification icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case 'info':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  // Get notification background color
  const getNotificationBgColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  // Example usage for demonstration
  useEffect(() => {
    // This is just for demonstration purposes
    // In a real app, you would expose these functions via context
    const demoNotifications = [
      {
        type: 'success' as NotificationType,
        title: 'Success',
        message: 'Your booking has been confirmed!',
      },
      {
        type: 'info' as NotificationType,
        title: 'Information',
        message: 'New services have been added.',
      },
    ];

    // Add demo notifications with a delay
    const timer1 = setTimeout(() => {
      addNotification(demoNotifications[0]);
    }, 1000);

    const timer2 = setTimeout(() => {
      addNotification(demoNotifications[1]);
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [addNotification]);

  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 w-full max-w-sm ${getPositionClasses()}`}
      aria-live="assertive"
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg ${getNotificationBgColor(
            notification.type
          )}`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                {notification.title && (
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  type="button"
                  className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => removeNotification(notification.id)}
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Create a hook to use the notification system
export function createNotificationContext(): NotificationContextProps {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = {
      id,
      autoClose: true,
      duration: 5000,
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };
}
