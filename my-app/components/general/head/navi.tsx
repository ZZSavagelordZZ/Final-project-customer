'use client'
import Link from "next/link"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import CarIcon from '@/svgs/Caricon'
import { useState, useEffect } from "react"
import { Separator } from "@/components/ui/separator"
import { SignedIn, SignedOut, SignInButton, SignOutButton, useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Translate } from './translate'
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { useRouter } from 'next/navigation'

interface NaviProps {
  className?: string
}

interface UserSettings {
  darkMode: boolean;
  language: string;
  currency: string;
}

export const Navi: React.FC<NaviProps> = ({ className }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user } = useUser()
  const [localSettings, setLocalSettings] = useState<UserSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return { darkMode: false, language: 'english', currency: 'USD' };
  });

  const userSettings = useQuery(api.settings.fetchSettings, { 
    userId: user?.id ?? "" 
  });

  useEffect(() => {
    if (user?.id && userSettings) {
      const newSettings = {
        darkMode: userSettings.darkMode,
        language: userSettings.language,
        currency: localSettings.currency
      };
      setLocalSettings(newSettings);
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
    }
  }, [userSettings, user?.id, localSettings.currency]);

  useEffect(() => {
    if (localSettings.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [localSettings.darkMode]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...localSettings, ...newSettings };
    setLocalSettings(updatedSettings);
    localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
  };

  const handleLanguageChange = (newLanguage: string) => {
    updateSettings({ language: newLanguage });
  };

  const handleCurrencyChange = (newCurrency: string) => {
    updateSettings({ currency: newCurrency });
  };

  const router = useRouter();
  const unreadNotifications = useQuery(api.notifications.getUnreadNotifications, { 
    userId: user?.id ?? "skip" 
  });
  const markAsRead = useMutation(api.notifications.markNotificationsAsRead);

  return (
    <>
      <header
        className="flex items-center justify-between h-5 px-4 md:px-6 bg-primary text-primary-foreground py-6 md:py-12">
        <nav className="md:flex gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 flex-col md:flex-row">
            <CarIcon className="w-6 h-6 " />
            <span className="text-lg font-semibold hover:text-primary-foreground transition-colors hidden md:block">Renta</span>
            <button
              className="md:hidden flex items-center text-black"
              onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/vehicles"
              className="text-muted-foreground hover:text-primary-foreground transition-colors"
            >
              Search
            </Link>
            <Link
              href="/Rating_Reviews"
              className="text-muted-foreground hover:text-primary-foreground transition-colors"
            >
              Ratings & Reviews
            </Link>
            <Link
              href="/bookings"
              className="text-muted-foreground hover:text-primary-foreground transition-colors"
            >
              My Bookings
            </Link>
            <Link
              href="/accessibility"
              className="text-muted-foreground hover:bg-[#003366] rounded-lg py-1 px-1 hover:text-[#ffffff] transition-colors"
            >
              Accessibility
            </Link>
            <Link
              href="/Golden/GoldenHome"
              className="text-muted-foreground hover:bg-[#000000] rounded-lg py-1 px-1 hover:text-[#FFD700] transition-colors"
            >
              Golden Members
            </Link>
          </div>
        </nav>
        <div className="flex items-center gap-4">
          <Translate />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-muted-foreground hover:text-primary-foreground transition-colors flex items-center gap-2">
                {localSettings.currency === 'USD' ? '$ USD' : '₺ TRY'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {
                // Update localStorage
                const settings = localStorage.getItem('userSettings') || '{}';
                const parsedSettings = JSON.parse(settings);
                const newSettings = { ...parsedSettings, currency: 'USD' };
                localStorage.setItem('userSettings', JSON.stringify(newSettings));
                setLocalSettings(newSettings);
                
                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('currencyChange', {
                  detail: { currency: 'USD' }
                }));
              }}>
                $ USD
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                // Update localStorage
                const settings = localStorage.getItem('userSettings') || '{}';
                const parsedSettings = JSON.parse(settings);
                const newSettings = { ...parsedSettings, currency: 'TRY' };
                localStorage.setItem('userSettings', JSON.stringify(newSettings));
                setLocalSettings(newSettings);
                
                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('currencyChange', {
                  detail: { currency: 'TRY' }
                }));
              }}>
                ₺ TRY
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SignedOut>
            <Link href="/Login" className="text-muted-foreground hover:text-primary-foreground transition-colors">
              Sign In
            </Link>
          </SignedOut>
          <SignedIn>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative p-2">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications && unreadNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">
                        {unreadNotifications.length}
                      </span>
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[300px]">
                {unreadNotifications && unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification._id}
                      onClick={() => {
                        markAsRead({ userId: user?.id ?? "" });
                        // Check notification type and redirect accordingly
                        if (notification.type === 'promotion') {
                          router.push('/User_Account/User_Promotions');
                        } else {
                          router.push('/bookings');
                        }
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">{notification.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {notification.type === 'promotion' 
                            ? 'Click to view promotion'
                            : 'Click to view details'
                          }
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">No new notifications</p>
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 rounded-full cursor-pointer">
                  {user?.imageUrl ? (
                    <AvatarImage
                    src={user.imageUrl}
                    alt="User Avatar"
                    className="h-9 w-9"
                    style={{ borderRadius: '9999px' }}
                  />
                  ) : (
                    <AvatarFallback className="rounded-full">U</AvatarFallback>
                  )}
                  <span className="sr-only">Toggle user menu</span>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="custom-user-menu" align="end">
                {/* Custom Menu Items */}
                <DropdownMenuItem>
                  <Link href="/User_Account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  {/* Use SignOutButton to handle logout */}
                  <SignOutButton>
                    <span>Logout</span>
                  </SignOutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>
        </div>
      </header>

      <div id="google_translate_element" style={{ display: 'none' }}></div>

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-lg transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
        style={{ opacity: 1, backgroundColor: '#ffffff', zIndex: 50 }}
      >
        <div className="flex justify-between items-center p-4">
          <div className="text-2xl font-bold">
            <Link href="/">Renta Car Services</Link>
          </div>
          <div
            className="cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
        <nav className="mt-8">
          <ul>
            <li className="p-4 text-xl font-semibold text-orange-600">
              <Link href="/vehicles">Search</Link>
            </li>
            <li className="p-4 text-xl font-semibold">
              <Link href="/Rating_Reviews">Ratings & Reviews</Link>
            </li>
            <li className="p-4 text-xl font-semibold">
              <Link href="/bookings">My Bookings</Link>
            </li>
            <li className="p-4 text-xl font-semibold">
              <Link href="/accessibility">Accessibility</Link>
            </li>
            <li className="p-4 text-xl font-semibold">
              <Link href="/Golden/GoldenHome">Golden Members</Link>
            </li>
            <li>
              <Separator />
              <div className="p-4 text-xl font-semibold bottom-0 flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="h-5 w-5"
                >
                  <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
                </svg>
                <Link href="/" className="">Settings</Link>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </>
  )
}
