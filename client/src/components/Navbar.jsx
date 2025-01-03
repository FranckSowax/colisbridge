import { Fragment } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import NotificationBell from './NotificationBell';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-1a1 1 0 00-1 1v2a1 1 0 001 1h1a1 1 0 001-1v-2a1 1 0 00-1-1H9.414a1 1 0 00-1.414 1.414l-2 2a1 1 0 001.414 1.414L10.707 11.293a1 1 0 001.414-1.414l2-2a1 1 0 00-1.414-1.414l-7-7a1 1 0 00z" /></svg> },
  { name: 'Colis', href: '/dashboard/parcels', icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 8v2a1 1 0 00.293.707l.707.707A6 6 0 0010 2z" /><path d="M10 9a1 1 0 00-.293.707L7 13v1a1 1 0 00.293.707l.707.707A6 6 0 0010 9z" /><path d="M10.707 17H13a1 1 0 001-1v-1a1 1 0 00-.293-.707L10 14.586V13a1 1 0 00-1-1v-1a1 1 0 00-.293-.707l-1.414-1.414A6 6 0 010 5v2a1 1 0 001 1h3v1a1 1 0 001 1h1a1 1 0 001-1v-.586L10.707 9z" /></svg> },
  { name: 'Clients', href: '/dashboard/clients', icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5 5 0 00-10 0h3v-2a3 3 0 00-6 0v2H6v3a2 2 0 001-1h2a3 3 0 001-1h1a3 3 0 00-1-1H6a3 3 0 00-3 3v1h18z" /></svg> },
  { name: 'Litiges', href: '/dashboard/disputes', icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 8v2a1 1 0 00.293.707l.707.707A6 6 0 0010 2z" /><path d="M10 9a1 1 0 00-.293.707L7 13v1a1 1 0 00.293.707l.707.707A6 6 0 0010 9z" /><path d="M10.707 17H13a1 1 0 001-1v-1a1 1 0 00-.293-.707L10 14.586V13a1 1 0 00-1-1v-1a1 1 0 00-.293-.707l-1.414-1.414A6 6 0 010 5v2a1 1 0 001 1h3v1a1 1 0 001 1h1a1 1 0 001-1v-.586L10.707 9z" /><path d="M10 12a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { name: 'Statistiques', href: '/dashboard/statistics', icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6a2 2 0 00-2-2H9z" /><path d="M13 2H7v1.5a.5.5 0 01-.5.5H4a.5.5 0 01-.5-.5V2H2v14a2 2 0 002 2h10a2 2 0 002-2V6h1.5a.5.5 0 01.5.5V2z" /><path d="M9 2h6v6H9V2z" /></svg> },
]

export default function Navbar({ navigation: nav = navigation, userNavigation }) {
  const { user, signOut } = useAuth()
  const { t } = useLanguage()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <Disclosure as="nav" className="bg-white shadow-sm">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <NavLink to="/dashboard" className="text-xl font-bold text-indigo-600">
                    ColisBridge
                  </NavLink>
                </div>
                <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                  {nav.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? 'border-indigo-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                          'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                        )
                      }
                    >
                      <item.icon className="h-5 w-5 mr-1" />
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              </div>

              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {/* Notification Bell */}
                <NotificationBell />

                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                      <span className="sr-only">{t('common.openMenu')}</span>
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user?.user_metadata?.avatar_url || 'https://avatar.vercel.sh/random'}
                        alt=""
                      />
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            item.onClick ? (
                              <button
                                onClick={item.onClick}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block w-full px-4 py-2 text-left text-sm text-gray-700'
                                )}
                              >
                                {item.name}
                              </button>
                            ) : (
                              <NavLink
                                to={item.href}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                {item.name}
                              </NavLink>
                            )
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>

              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  <span className="sr-only">{t('common.openMenu')}</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {nav.map((item) => (
                <Disclosure.Button
                  key={item.href}
                  as={NavLink}
                  to={item.href}
                  className={({ isActive }) =>
                    classNames(
                      isActive
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800',
                      'block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                    )
                  }
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </div>
                </Disclosure.Button>
              ))}
            </div>
            <div className="border-t border-gray-200 pb-3 pt-4">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={user?.user_metadata?.avatar_url || 'https://avatar.vercel.sh/random'}
                    alt=""
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user?.user_metadata?.full_name}
                  </div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {userNavigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={item.onClick ? 'button' : NavLink}
                    to={item.href}
                    onClick={item.onClick}
                    className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}
