import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">OLT Manager</h1>
            </div>
          </div>
          
          <div className="flex items-center">
            <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
              <BellIcon className="h-6 w-6" />
            </button>
            
            <div className="ml-3 relative">
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
                <UserCircleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 