import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../model/nav-items'

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-divider bg-content1 flex flex-col">
      <div className="h-14 flex items-center px-5 border-b border-divider">
        <span className="text-lg font-semibold text-foreground">nodi CMS</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'block rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground/70 hover:bg-content2',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
