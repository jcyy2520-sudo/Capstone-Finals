import { Outlet } from 'react-router-dom';
import TransparencyHeader from '../components/TransparencyHeader';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TransparencyHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            ProcureSeal Public Transparency Portal — Government Procurement System
            <br className="sm:hidden" />
            {' '}in compliance with Republic Act No. 9184
          </p>
        </div>
      </footer>
    </div>
  );
}
