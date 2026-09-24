import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cloud,
  DollarSign,
  Globe2,
  Shield,
  Network,
  Server,
  Menu,
  X,
  ChevronRight,
  CloudCog,
  Sun,
  Moon,
} from 'lucide-react';
import RegionSelector from '../components/RegionSelector';
import RegionsModal from '../components/RegionsModal';
import NotificationBell from '../components/NotificationBell';
import { useRegion } from '../context/useRegion';
import { useTheme } from '../context/useTheme';
import { regionStatusLabel } from '../data/regionData';

const navSections = [
  {
    title: 'PLANIFICACIÓN',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/planificacion', label: 'Planificación Cloud', icon: Cloud },
    ],
  },
  {
    title: 'ANÁLISIS',
    items: [
      { path: '/costos', label: 'Costos', icon: DollarSign },
      { path: '/infraestructura', label: 'Infraestructura Global', icon: Globe2 },
      { path: '/seguridad', label: 'Seguridad', icon: Shield },
      { path: '/red', label: 'Arquitectura de Red', icon: Network },
    ],
  },
  {
    title: 'RECURSOS',
    items: [
      { path: '/servicios', label: 'Servicios AWS', icon: Server },
    ],
  },
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/planificacion': 'Planificación Cloud',
  '/costos': 'Costos',
  '/infraestructura': 'Infraestructura Global',
  '/seguridad': 'Seguridad',
  '/red': 'Arquitectura de Red',
  '/servicios': 'Servicios AWS',
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { region } = useRegion();
  const { theme, toggleTheme } = useTheme();
  const currentTitle = pageTitles[location.pathname] || 'CloudOps';

  // Al cambiar de región se re-lanza un fade suave sobre el contenido, sin remontar
  // la página (así no se pierden filtros ni formularios).
  const regionFadeRef = useRef<HTMLDivElement>(null);
  const previousRegionId = useRef(region.id);
  useEffect(() => {
    if (previousRegionId.current === region.id) return;
    previousRegionId.current = region.id;
    const el = regionFadeRef.current;
    if (!el) return;
    el.classList.remove('animate-region-in');
    el.getBoundingClientRect(); // fuerza el reflujo para reiniciar la animación
    el.classList.add('animate-region-in');
  }, [region.id]);

  return (
    <div className="flex h-screen bg-bg-main overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-sidebar text-white flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <CloudCog className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight">CloudOps Dashboard</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Nube empresarial</p>
          </div>
          <button
            className="ml-auto lg:hidden p-1 rounded hover:bg-slate-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-primary text-white'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`
                        }
                      >
                        <Icon className="w-4.5 h-4.5 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-security" />
            <span>Sistema operativo</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-card border-b border-border flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-text-main" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-text-secondary hidden sm:inline">CloudOps</span>
            <ChevronRight className="w-3.5 h-3.5 text-text-secondary hidden sm:inline" />
            <span className="font-medium text-text-main truncate">{currentTitle}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Region indicator */}
            <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-border text-xs max-w-[340px]">
              <RegionSelector compact />
            </div>

            {/* Status */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
                region.status === 'operational'
                  ? 'bg-green-50 dark:bg-green-500/10'
                  : region.status === 'review'
                    ? 'bg-amber-50 dark:bg-amber-500/10'
                    : 'bg-red-50 dark:bg-red-500/10'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  region.status === 'operational' ? 'bg-security' : region.status === 'review' ? 'bg-costs' : 'bg-alerts'
                }`}
              />
              <span
                className={`font-medium ${
                  region.status === 'operational' ? 'text-security' : region.status === 'review' ? 'text-costs' : 'text-alerts'
                }`}
              >
                {regionStatusLabel[region.status]}
              </span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-text-secondary"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold">
              CO
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div key={location.pathname} className="animate-page-in">
            <div ref={regionFadeRef}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      <RegionsModal />
    </div>
  );
}