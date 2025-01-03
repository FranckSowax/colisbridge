import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon as BellIconOutline } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { useNotifications } from '../hooks/useNotifications';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { classNames } from '../utils/classNames';

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleMarkAsRead = (notificationId) => {
    markAsRead.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (notificationId) => {
    deleteNotification.mutate(notificationId);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'parcel_created':
        return '📦';
      case 'status_updated':
        return '🔄';
      case 'dispute_created':
        return '⚠️';
      default:
        return '📢';
    }
  };

  return (
    <Menu as="div" className="relative ml-3">
      <div>
        <Menu.Button className="relative rounded-full p-1 hover:bg-gray-100 focus:outline-none">
          {unreadCount > 0 ? (
            <>
              <BellIconSolid className="h-6 w-6 text-indigo-600" />
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-xs font-medium text-white">
                {unreadCount}
              </span>
            </>
          ) : (
            <BellIconOutline className="h-6 w-6 text-gray-400" />
          )}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-96 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-500"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                Aucune notification
              </div>
            ) : (
              notifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  {({ active }) => (
                    <div
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        'px-4 py-3 relative'
                      )}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 text-xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {notification.message}
                          </div>
                          <div className="mt-2 text-xs text-gray-400 flex justify-between items-center">
                            <span>
                              {format(new Date(notification.created_at), 'PPp', {
                                locale: fr,
                              })}
                            </span>
                            <div className="flex gap-2">
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="text-indigo-600 hover:text-indigo-500"
                                >
                                  Marquer comme lu
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="text-red-600 hover:text-red-500"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {!notification.read && (
                        <span className="absolute top-3 right-4 h-2 w-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  )}
                </Menu.Item>
              ))
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
