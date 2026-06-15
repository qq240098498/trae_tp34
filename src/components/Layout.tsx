import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Cat,
  Package,
  Utensils,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/pets', label: '宠物档案', icon: Cat },
  { to: '/inventory', label: '用品库存', icon: Package },
  { to: '/feedings', label: '喂食记录', icon: Utensils },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <aside className="m-4 flex h-[calc(100vh-2rem)] flex-col rounded-3xl border-2 border-white bg-gradient-to-b from-primary/10 via-orange-50 to-secondary/10 shadow-xl">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-2xl shadow-md">
                  🐾
                </div>
                <h1 className="font-display text-2xl text-gray-800">宠管家</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-2 text-gray-500 hover:bg-white/60 hover:text-primary lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-2 px-4 py-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-white text-primary shadow-md ring-2 ring-primary/20'
                        : 'text-gray-600 hover:bg-white/60 hover:text-primary'
                    )
                  }
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-transform duration-200 group-hover:scale-110'
                    )}
                  />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="m-4 rounded-2xl bg-white/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-lg">
                  🐱
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">欢迎使用</p>
                  <p className="text-xs text-gray-500">宠管家 v1.0</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-primary/10 bg-background/80 px-6 py-4 backdrop-blur-md lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-gray-600 hover:bg-white hover:text-primary shadow-sm transition"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🐾</span>
              <span className="font-display text-xl text-gray-800">宠管家</span>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
