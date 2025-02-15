"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator"
import { Navi } from '../head/navi';
import { Footer } from '../head/footer';
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import {useUser} from "@clerk/nextjs"
import { useRef } from "react"
import dynamic from 'next/dynamic';
import loadingAnimation from "@/public/animations/loadingAnimation.json";
import { Redirection } from "@/components/ui/redirection";
import { LottieRefCurrentProps } from "lottie-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast"
import { Id } from "@/convex/_generated/dataModel"


// Add dynamic import for Lottie
const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
});

interface Booking {
  _id: Id<"bookings">;
  make: string;
  model: string;
  color: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  paidAmount: number;
  pickupLocation: string;
  dropoffLocation: string;
  carId: string;
  trim: string;
}

// Add this custom hook near the top of the file
const useCurrency = () => {
  const [currency, setCurrency] = useState<string>('USD');

  useEffect(() => {
    // Only listen for currency changes, not language
    const settings = localStorage.getItem('userSettings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      if (parsedSettings.currency) {
        setCurrency(parsedSettings.currency);
      }
    }

    const handleCurrencyChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCurrency(customEvent.detail.currency);
    };

    window.addEventListener('currencyChange', handleCurrencyChange);
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange);
    };
  }, []);

  return currency;
};

export function Mybookings() {
  const { user } = useUser();
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
  const [filterMake, setFilterMake] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast()

  const customerId = user?.id || "";
  
  // Get current booking using getCurrentBooking
  const currentBooking = useQuery(api.analytics.getCurrentBooking, {
    customerId: user?.id ?? "skip"
  });

  // Get all bookings for the customer
  const bookings = useQuery(api.bookings.getBookingsByCustomer, 
    customerId ? { customerId } : "skip"
  );

  // Always call useQuery for car details, but use null as initial value
  const carDetails = useQuery(api.bookings.getCarByCarId, 
    bookings && bookings.length > 0 ? { carId: bookings[0].carId } : "skip"
  );

  // Optionally set speed after the component mounts
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(1.5);
    }
  }, []);

  useEffect(() => {
    // Create a promise for fetching bookings
    const fetchBookings = new Promise<void>((resolve) => {
      if (bookings) {
        setFilteredBookings(bookings);
      }
      resolve();
    });

    // Create a promise for the 2-second timeout
    const timer = new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });

    // Wait for both promises to complete
    Promise.all([fetchBookings, timer]).then(() => {
      setLoading(false);
    });

    // Cleanup if the component unmounts before promises resolve
    return () => {
      // No cleanup needed for this example
    };
  }, [bookings]);

  const handleFilterChange = () => {
    let filtered = bookings || [];
    if (filterStartDate) {
      filtered = filtered.filter((booking) => new Date(booking.startDate) >= new Date(filterStartDate))
    }
    if (filterEndDate) {
      filtered = filtered.filter((booking) => new Date(booking.endDate) <= new Date(filterEndDate))
    }
    if (filterMake) {
      filtered = filtered.filter((booking) => booking.make.toLowerCase().includes(filterMake.toLowerCase()))
    }
    if (filterModel) {
      filtered = filtered.filter((booking) => booking.model.toLowerCase().includes(filterModel.toLowerCase()))
    }
    if (filterColor) {
      filtered = filtered.filter((booking) => booking.color.toLowerCase().includes(filterColor.toLowerCase()))
    }
    setFilteredBookings(filtered as Booking[])
  }
  
  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  }

  // Add currency state
  const currency = useCurrency();
  
  // Add formatPrice helper function
  const formatPrice = (amount: number) => {
    if (!amount) return '';
    if (currency === 'TRY') {
      return `₺${(amount * 34).toFixed(2)}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Add this function to handle cancellation
  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  // Add the mutation
  const cancelBookingMutation = useMutation(api.bookings.cancelBooking);

  // Update the processCancellation function
  const processCancellation = async () => {
    if (!selectedBooking || !user) return;

    try {
      // 1. Call the refund API
      const refundResponse = await fetch('/api/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBooking._id,
          userId: user.id,
        }),
      });

      const refundData = await refundResponse.json();

      if (!refundResponse.ok && refundResponse.status !== 202) {
        throw new Error(refundData.message || 'Failed to process refund');
      }

      // 2. Cancel the booking
      await cancelBookingMutation({
        bookingId: selectedBooking._id
      });

      // 3. Close dialogs and show success message
      setShowCancelDialog(false);
      setIsDialogOpen(false);

      // Show appropriate toast message based on whether payment was found
      if (refundData.message === 'no_payment_found') {
        toast({
          title: "Booking Cancelled",
          description: "No payment found, cancelled booking.",
        });
      } else {
        toast({
          title: "Booking Cancelled",
          description: "Your refund has been processed and will be credited to your original payment method.",
        });
      }

    } catch (error) {
      console.error('Cancellation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Lottie
          lottieRef={lottieRef}
          animationData={loadingAnimation}
          loop={false}
          autoplay={true}
          className="w-48 h-48"
        />
      </div>
    );
  }

  if (customerId === "") {
    return <Redirection />;
  }

  const pastBookings = bookings?.filter(booking => new Date(booking.startDate) < new Date());

  // Add these helper functions at the top of your component
  const isBookingCurrent = (startDate: string, endDate: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    return today >= start && today <= end;
  };

  const isUpcomingBooking = (startDate: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    return start > today;
  };

  // Modify the return statement to show different sections
  return (
    <>
      <Navi />
      <Separator />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 md:py-12">
        <h1 className="text-3xl font-bold mb-8">Your Car Bookings</h1>
         
        {/* Current/Upcoming Booking Section */}
        {currentBooking && (
          <Link 
            href={`/bookings/currentbooking`} 
            className='hover:cursor-pointer mb-8 block'
          >
            <div className="w-full mx-auto mt-1 rounded-lg p-6 bg-white shadow-2xl" style={{ border: "none" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{currentBooking.status} Booking</h2>
                  <p className="text-muted-foreground">Rental Dates: {currentBooking.startDate} - {currentBooking.endDate}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-3xl font-bold">{formatPrice(currentBooking.totalCost)}</h3>
                  <p className="text-muted-foreground">Total Cost</p>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Car Model</h3>
                  <p>{currentBooking.carDetails ? `${currentBooking.carDetails.maker} ${currentBooking.carDetails.model}` : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Trim</h3>
                  <p>{currentBooking.carDetails ? currentBooking.carDetails.trim : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Pickup Location</h3>
                  <p>{currentBooking.pickupLocation}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Return Location</h3>
                  <p>{currentBooking.dropoffLocation}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{currentBooking.status === 'Current' ? 'Days Remaining' : 'Days Until Start'}</h3>
                  <p>{currentBooking.daysRemaining} days</p>
                </div>
              </div>
            </div>
          </Link>
        )}

        <Separator className="my-8" />

        {/* Filter Section - Keep your existing filter code */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-background rounded-lg shadow-xl p-6 max-w-md h-[500px]">
            <h2 className="text-xl font-bold mb-4">Filter Bookings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start-date"
                  className="block text-sm font-medium text-muted-foreground">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={filterStartDate || ""}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-input bg-background px-3 py-2 text-sm shadow-2xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label
                  htmlFor="end-date"
                  className="block text-sm font-medium text-muted-foreground">
                  End Date
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={filterEndDate || ""}
                  onChange={(e) => setFilterEndDate(e.target.value || null)}
                  className="mt-1 block w-full rounded-md border-input bg-background px-3 py-2 text-sm shadow-2xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label
                  htmlFor="make"
                  className="block text-sm font-medium text-muted-foreground">
                  Make
                </label>
                <input
                  type="text"
                  id="make"
                  value={filterMake}
                  onChange={(e) => setFilterMake(e.target.value)}
                  className="mt-1 block w-full rounded-md border-input bg-background px-3 py-2 text-sm shadow-2xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label
                  htmlFor="model"
                  className="block text-sm font-medium text-muted-foreground">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className="mt-1 block w-full rounded-md border-input bg-background px-3 py-2 text-sm shadow-2xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label
                  htmlFor="color"
                  className="block text-sm font-medium text-muted-foreground">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  className="mt-1 block w-full rounded-md border-input bg-background px-3 py-2 text-sm shadow-2xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="mt-4 justify-self-end">
              <Button onClick={handleFilterChange} className="px-6 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors hover:bg-muted shadow-2xl">Filter</Button>
            </div>
          </div>
          <div className="col-span-2 lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookings.map((booking) => (
                <Card key={booking._id} className="w-full mx-auto mt-1 rounded-lg p-1 bg-white shadow-xl" style={{ border: "none" }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold">{booking.make}</div>
                      <div className="text-muted-foreground">{booking.model}</div>
                    </div>
                    <div className="text-muted-foreground">{booking.color}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm font-medium">Start Date</div>
                        <div>{booking.startDate}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">End Date</div>
                        <div>{booking.endDate}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Total Cost</div>
                        <div>{formatPrice(booking.totalCost)}</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      onClick={() => handleViewDetails(booking)} 
                      className="px-6 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors hover:bg-muted shadow-2xl">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Bookings Section */}
        <div className="mt-8">
          <h2 className="text-3xl mb-4 font-bold">Upcoming Bookings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings
              .filter(booking => isUpcomingBooking(booking.startDate))
              .map((booking) => (
                <Card key={booking._id} className="w-full mx-auto mt-1 rounded-lg p-1 bg-white shadow-xl" style={{ border: "none" }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold">{booking.make}</div>
                      <div className="text-muted-foreground">{booking.model}</div>
                    </div>
                    <div className="text-muted-foreground">{booking.color}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm font-medium">Start Date</div>
                        <div>{booking.startDate}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">End Date</div>
                        <div>{booking.endDate}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Total Cost</div>
                        <div>{formatPrice(booking.totalCost)}</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      onClick={() => handleViewDetails(booking)} 
                      className="px-6 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors hover:bg-muted shadow-2xl">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </div>

        {/* Completed Bookings Section */}
        <div className="mt-8">
          <h2 className="text-3xl mb-4 font-bold">Past Bookings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings
              .filter(booking => !isBookingCurrent(booking.startDate, booking.endDate) && !isUpcomingBooking(booking.startDate))
              .map((booking) => (
                <Card key={booking._id} className="w-full mx-auto mt-1 rounded-lg p-1 bg-white shadow-xl" style={{ border: "none" }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold">{booking.make}</div>
                      <div className="text-muted-foreground">{booking.model}</div>
                    </div>
                    <div className="text-muted-foreground">{booking.color}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm font-medium">Start Date</div>
                        <div>{booking.startDate}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">End Date</div>
                        <div>{booking.endDate}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Total Cost</div>
                        <div>{formatPrice(booking.totalCost)}</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      onClick={() => handleViewDetails(booking)} 
                      className="px-6 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors hover:bg-muted shadow-2xl">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </div>
      </div>
      <Separator/>
      <Footer/>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]"  style={{ opacity: 1, backgroundColor: '#ffffff', zIndex: 50, border: "none" }}>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Vehicle</h3>
                  <p>{selectedBooking.make} {selectedBooking.model}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.trim}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Payment</h3>
                  <p>Total Cost: {formatPrice(selectedBooking.totalCost)}</p>
                  <p className="text-sm text-muted-foreground">Paid: {formatPrice(selectedBooking.paidAmount)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Start Date</h3>
                  <p>{selectedBooking.startDate}</p>
                </div>
                <div>
                  <h3 className="font-semibold">End Date</h3>
                  <p>{selectedBooking.endDate}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <h3 className="font-semibold">Pickup Location</h3>
                  <p>{selectedBooking.pickupLocation}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Return Location</h3>
                  <p>{selectedBooking.dropoffLocation}</p>
                </div>
              </div>
              
              {/* Add this button for upcoming bookings */}
              {isUpcomingBooking(selectedBooking.startDate) && (
                <Button 
                  onClick={() => handleCancelBooking(selectedBooking)}
                  variant="destructive"
                  className="w-full mt-4"
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add the Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
              {selectedBooking && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p><strong>Vehicle:</strong> {selectedBooking.make} {selectedBooking.model}</p>
                  <p><strong>Dates:</strong> {selectedBooking.startDate} - {selectedBooking.endDate}</p>
                  <p><strong>Total Cost:</strong> {formatPrice(selectedBooking.totalCost)}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={processCancellation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
