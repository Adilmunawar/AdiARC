
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, Calculator, Box, ScanText, FileCode, Split, DatabaseZap, ChevronsLeft, ChevronsRight, Database, ClipboardCheck, Printer, Globe, UserCircle, ImageIcon, FileKey, FileMinus, FileSpreadsheet, Lock, Unlock, Search, Terminal, FileScan
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect, createContext, useContext, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


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
        if (password === 'plra') {
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
        if (isUnlocked === false && typeof window !== 'undefined' && localStorage.getItem('adiarc_unlocked') !== 'true') {
            router.replace('/');
        }
    }, [isUnlocked, router]);

    if (!isUnlocked) {
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
  { name: "Image Doctor", icon: FileScan, path: "/image-doctor" },
  { name: "Binary Converter", icon: ImageIcon, path: "/binary-converter" },
  { name: "Meta Tag Remover", icon: FileMinus, path: "/meta-remover" },
  { name: "Database Engine", icon: Database, path: "/database-engine", isPremium: true },
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
  const [unlockClickCount, setUnlockClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLockClick = () => {
    if (isUnlocked) {
      lock(); // Single click to lock
      setUnlockClickCount(0);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    } else {
      // Multi-click to unlock
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      const newClickCount = unlockClickCount + 1;
      setUnlockClickCount(newClickCount);

      if (newClickCount >= 5) {
        requestUnlock();
        setUnlockClickCount(0);
      } else {
        clickTimeoutRef.current = setTimeout(() => {
          setUnlockClickCount(0); // Reset after a short delay
        }, 800); // 800ms window for 5 clicks
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
         <div className="flex items-center gap-2 group cursor-pointer">
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

       <div className="mt-auto p-2 border-t space-y-1">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        variant="ghost" 
                        className="w-full h-12 flex items-center justify-center gap-3 group"
                        onClick={handleLockClick}
                    >
                        {isUnlocked ? 
                            <Unlock className="h-5 w-5 text-primary transition-transform duration-200 group-hover:scale-110"/> : 
                            <Lock className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:scale-110"/>
                        }
                        {isOpen && (
                            <span className={cn(
                                "text-sm font-semibold transition-colors", 
                                isUnlocked ? "text-primary" : "text-muted-foreground"
                            )}>
                                {isUnlocked ? "Unlocked" : "Locked"}
                            </span>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                    <p className="text-xs">{isUnlocked ? "Click once to lock premium features" : "Click 5 times to unlock"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

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
