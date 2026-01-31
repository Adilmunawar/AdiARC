"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, Calculator, Box, ScanText, FileCode, Split, DatabaseZap, ChevronsLeft, ChevronsRight, Database, ClipboardCheck, Printer, Globe, UserCircle, ImageIcon, FileKey, FileMinus, FileSpreadsheet, Lock, Unlock, HeartPulse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect, createContext, useContext } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

// --- START: SECRET MODE CONTEXT & PROVIDER ---
interface SecretModeContextType {
  isUnlocked: boolean;
  requestUnlock: () => void;
  lock: () => void;
}

const SecretModeContext = createContext<SecretModeContextType | undefined>(undefined);

export const useSecretMode = () => {
  const context = useContext(SecretModeContext);
  if (!context) {
    throw new Error('useSecretMode must be used within the SecretModeProvider');
  }
  return context;
};

function PasswordDialog({ open, onOpenChange, onUnlockSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onUnlockSuccess: () => void }) {
    const [password, setPassword] = useState("");
    const { toast } = useToast();

    const handleUnlockAttempt = () => {
        if (password === 'python360') {
            onUnlockSuccess();
            toast({ title: "Access Granted", description: "Premium features unlocked." });
        } else {
            toast({ variant: "destructive", title: "Access Denied", description: "Incorrect password." });
            setPassword("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5"/> Enter Access Code</DialogTitle>
                    <DialogDescription>
                        This area contains restricted features. Please enter the password to proceed.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Input 
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlockAttempt()}
                    />
                    <Button onClick={handleUnlockAttempt} className="w-full">Unlock Features</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function SecretModeProvider({ children }: { children: React.ReactNode }) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const storedUnlockStatus = localStorage.getItem('adiarc_unlocked');
        if (storedUnlockStatus === 'true') {
            setIsUnlocked(true);
        }
    }, []);

    const requestUnlock = () => {
        setShowPasswordDialog(true);
    };
    
    const handleUnlockSuccess = () => {
        setIsUnlocked(true);
        localStorage.setItem('adiarc_unlocked', 'true');
        setShowPasswordDialog(false);
    };

    const lock = () => {
        setIsUnlocked(false);
        localStorage.removeItem('adiarc_unlocked');
        toast({ title: "Locked", description: "Premium features have been secured." });
    };

    return (
        <SecretModeContext.Provider value={{ isUnlocked, requestUnlock, lock }}>
            {children}
            <PasswordDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} onUnlockSuccess={handleUnlockSuccess} />
        </SecretModeContext.Provider>
    );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isUnlocked } = useSecretMode();
    const router = useRouter();

    useEffect(() => {
        // This check runs on the client-side after hydration
        if (isUnlocked === false && localStorage.getItem('adiarc_unlocked') !== 'true') {
            router.replace('/');
        }
    }, [isUnlocked, router]);

    if (!isUnlocked) {
        // Render a loading state or null while we wait for the client-side check
        return null;
    }

    return <>{children}</>;
}
// --- END: SECRET MODE ---


const PowerShellIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m8 16 3-3-3-3" />
    <path d="m12 17 4 0" />
  </svg>
);


const allNavItems = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "Property Consultant", icon: UserCircle, path: "/ai-assistant" },
  { name: "Wirasat Calculator", icon: Calculator, path: "/wirasat" },
  { name: "XMP Inventory", icon: Box, path: "/inventory" },
  { name: "Local OCR", icon: ScanText, path: "/ocr" },
  { name: "HTML Extractor", icon: FileCode, path: "/extractor" },
  { name: "Range Gaps", icon: Split, path: "/range-gaps" },
  { name: "Auditor", icon: ClipboardCheck, path: "/auditor" },
  { name: "Mutation Print Layout", icon: Printer, path: "/print-layout" },
  { name: "Image Doctor", icon: HeartPulse, path: "/image-doctor" },
  { name: "Binary Converter", icon: ImageIcon, path: "/binary-converter" },
  { name: "Meta Tag Remover", icon: FileMinus, path: "/meta-remover" },
  { name: "SQL Generator", icon: FileKey, path: "/sql-generator", isPremium: true },
  { name: "Daily Progress Report", icon: FileSpreadsheet, path: "/daily-progress", isPremium: true },
  { name: "PowerShell Queries", icon: PowerShellIcon, path: "/powershell-queries", isPremium: true },
  { name: "Server Sync", icon: Database, path: "/sync", isPremium: true },
  { name: "DB Status", icon: DatabaseZap, path: "/db-status", isPremium: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const { isUnlocked, requestUnlock, lock } = useSecretMode();
  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = React.useRef(0);

  const handleLogoClick = () => {
    clickCountRef.current += 1;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1500); // Reset after 1.5 seconds

    if (clickCountRef.current >= 5) {
      requestUnlock();
      clickCountRef.current = 0;
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    }
  };
  
  const navItems = allNavItems.filter(item => !item.isPremium || isUnlocked);

  const sortedNavItems = [
      ...navItems.filter(item => item.path === '/'),
      ...navItems.filter(item => item.path === '/ai-assistant'),
      ...navItems.filter(item => item.path !== '/' && item.path !== '/ai-assistant').sort((a,b) => a.name.localeCompare(b.name))
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r transition-width duration-300 ease-in-out h-screen bg-card rounded-tr-[2rem] rounded-br-[2rem]",
        isOpen ? "w-60" : "w-20"
      )}
    >
      <div className={cn("flex h-16 items-center border-b px-4 transition-all duration-300", isOpen ? "justify-start" : "justify-center")}>
         <div onClick={handleLogoClick} className="flex items-center gap-2 group cursor-pointer" title="Unlock secret features...">
            <Globe className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
            {isOpen && <span className="font-bold text-lg transition-opacity duration-300">AdiARC</span>}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
            {sortedNavItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <Link href={item.path} key={item.name}>
                        <Button 
                            variant={isActive ? "secondary" : "ghost"} 
                            className={cn("w-full justify-start gap-3 group transition-all duration-200", !isOpen && "justify-center")}
                            title={isOpen ? "" : item.name}
                        >
                            <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                            {isOpen && <span className="transition-opacity duration-200">{item.name}</span>}
                        </Button>
                    </Link>
                );
            })}
        </nav>
      </ScrollArea>

       <div className="mt-auto p-2 border-t">
          {isUnlocked && isOpen && (
            <Button variant="ghost" className="w-full justify-start gap-3 mb-1" onClick={lock}>
              <Lock className="h-5 w-5 text-muted-foreground" />
              <span>Lock Features</span>
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronsLeft className="h-6 w-6" /> : <ChevronsRight className="h-6 w-6" />}
          </Button>
        </div>
    </aside>
  );
}
