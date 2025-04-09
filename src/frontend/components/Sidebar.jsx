import { 
  HomeIcon, 
  UserGroupIcon, 
  CogIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', icon: HomeIcon, view: 'dashboard' },
  { name: 'ONUs não autorizadas', icon: ExclamationTriangleIcon, view: 'unauthorized' },
  { name: 'ONUs', icon: UserGroupIcon, view: 'onus' },
  { name: 'Monitoramento', icon: ChartBarIcon, view: 'monitoring' },
  { name: 'Configurações', icon: CogIcon, view: 'settings' },
];

export default function Sidebar({ selectedView, onViewChange }) {
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-700">
            <img
              className="h-8 w-auto"
              src="/logo.svg"
              alt="Logo"
            />
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto bg-primary-800">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const current = selectedView === item.view;
                return (
                  <button
                    key={item.name}
                    onClick={() => onViewChange(item.view)}
                    className={`
                      ${current ? 'bg-primary-900 text-white' : 'text-primary-100 hover:bg-primary-700'}
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full
                    `}
                  >
                    <item.icon
                      className={`
                        ${current ? 'text-primary-300' : 'text-primary-400 group-hover:text-primary-300'}
                        mr-3 flex-shrink-0 h-6 w-6
                      `}
                      aria-hidden="true"
                    />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
} 