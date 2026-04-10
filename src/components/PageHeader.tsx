import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, ArrowLeft, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import type { Profile } from "@/types";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  showMessagesButton?: boolean;
  showProfileMenu?: boolean;
  profile?: Profile | null;
  onSignOut?: () => void;
  onBack?: () => void;
}

export const PageHeader = ({
  title,
  showBackButton = false,
  showMessagesButton = false,
  showProfileMenu = false,
  profile,
  onSignOut,
  onBack,
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      {/* Safe area spacer for iOS notch/Dynamic Island */}
      <div className="h-safe-top bg-background/95 sticky top-0 z-50" />
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-2xl font-bold truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {showMessagesButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(ROUTES.MESSAGES)}
              className="flex-shrink-0"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}

          {showProfileMenu && profile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full flex-shrink-0">
                  <Avatar>
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                    <AvatarFallback>{profile.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                {onSignOut && (
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      </header>
    </>
  );
};
