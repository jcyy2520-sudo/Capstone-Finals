import { useState, useRef, useEffect } from 'react';
import { MoreVertical, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ThreeDotMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Menu"
      >
        <MoreVertical size={18} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-lg shadow-slate-200/50 z-50 py-1">
          <button
            onClick={() => { setOpen(false); navigate('/login'); }}
            className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2.5"
          >
            <LogIn size={15} className="text-slate-400" />
            Official Login
          </button>
        </div>
      )}
    </div>
  );
}
