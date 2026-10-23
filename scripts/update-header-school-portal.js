import fs from 'fs';

// 1. Update PublicWebsiteShell.tsx
let shell = fs.readFileSync('src/components/public/PublicWebsiteShell.tsx', 'utf8');
const searchShell = `if (raw === 'login') {
        handleOpenLogin();
        return;
      }`;
const replaceShell = `if (raw === 'login') {
        handleOpenLogin();
        return;
      }
      if (raw === 'school' || raw === 'portal') {
        setViewMode('SCHOOL_PORTAL');
        return;
      }`;
shell = shell.replace(/\r?\n/g, '\n');
const searchShellNormalized = searchShell.replace(/\r?\n/g, '\n');
const replaceShellNormalized = replaceShell.replace(/\r?\n/g, '\n');
shell = shell.replace(searchShellNormalized, replaceShellNormalized);

const searchHeaderCall = `onOpenLogin={handleOpenLogin}
        language={language}`;
const replaceHeaderCall = `onOpenLogin={handleOpenLogin}
        onOpenSchoolPortal={() => setViewMode('SCHOOL_PORTAL')}
        language={language}`;
shell = shell.replace(searchHeaderCall.replace(/\r?\n/g, '\n'), replaceHeaderCall.replace(/\r?\n/g, '\n'));
fs.writeFileSync('src/components/public/PublicWebsiteShell.tsx', shell, 'utf8');
console.log('PublicWebsiteShell updated');

// 2. Update PublicHeader.tsx
let header = fs.readFileSync('src/components/public/PublicHeader.tsx', 'utf8');
header = header.replace(/\r?\n/g, '\n');

const searchProps = `onOpenLogin: () => void;
  language: 'en' | 'hi';`;
const replaceProps = `onOpenLogin: () => void;
  onOpenSchoolPortal?: () => void;
  language: 'en' | 'hi';`;
header = header.replace(searchProps.replace(/\r?\n/g, '\n'), replaceProps.replace(/\r?\n/g, '\n'));

const searchDestruct = `onOpenLogin,
  language,`;
const replaceDestruct = `onOpenLogin,
  onOpenSchoolPortal,
  language,`;
header = header.replace(searchDestruct.replace(/\r?\n/g, '\n'), replaceDestruct.replace(/\r?\n/g, '\n'));

const searchLoginBtn = `{/* Login Button */}`;
const replaceLoginBtn = `{/* Direct School ERP Portal Button */}
          <button
            id="public-header-school-portal-btn"
            onClick={onOpenSchoolPortal || onOpenLogin}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-emerald-600/25 transition cursor-pointer"
            title={isHindi ? 'स्कूल ERP पोर्टल खोलें' : 'Open School ERP Portal'}
          >
            <School className="w-3.5 h-3.5" />
            <span>{isHindi ? 'स्कूल पोर्टल' : 'School Portal'}</span>
          </button>

          {/* Login Button */}`;
header = header.replace(searchLoginBtn.replace(/\r?\n/g, '\n'), replaceLoginBtn.replace(/\r?\n/g, '\n'));

const searchMobileDrawer = `{/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs font-semibold animate-fade-in">`;
const replaceMobileDrawer = `{/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs font-semibold animate-fade-in">
          <button
            onClick={() => {
              if (onOpenSchoolPortal) onOpenSchoolPortal();
              else onOpenLogin();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md mb-2 cursor-pointer"
          >
            <School className="w-4 h-4" />
            <span>{isHindi ? 'स्कूल ERP पोर्टल खोलें' : 'Open School ERP Portal'}</span>
          </button>`;
header = header.replace(searchMobileDrawer.replace(/\r?\n/g, '\n'), replaceMobileDrawer.replace(/\r?\n/g, '\n'));

fs.writeFileSync('src/components/public/PublicHeader.tsx', header, 'utf8');
console.log('PublicHeader updated');
