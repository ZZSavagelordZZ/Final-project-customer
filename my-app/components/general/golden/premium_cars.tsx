'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navi } from "../head/navi"
import { Footer } from "../head/footer"
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { TagIcon } from "lucide-react";
import { useState, useMemo } from "react";

const PremiumCars = () => {
  const [showPromotionsOnly, setShowPromotionsOnly] = useState(false);
  
  // Fetch cars with golden field set to true
  const cars = useQuery(api.car.getFilteredCars, { golden: true });
  const promotionsMap = useQuery(api.promotions.getAllPromotions);

  // Filter cars based on promotions
  const displayedCars = useMemo(() => {
    let filteredCars = cars;
    
    if (showPromotionsOnly && promotionsMap) {
      filteredCars = filteredCars?.filter(car => {
        const carPromotions = promotionsMap.filter(promo => 
          promo.specificTarget.some(target => 
            target === car._id || 
            (car.categories && car.categories.includes(target))
          )
        );
        return carPromotions.length > 0;
      });
    }
    
    return filteredCars;
  }, [cars, showPromotionsOnly, promotionsMap]);

  // Helper function to check if a car has active promotions
  const hasActivePromotion = (car: any) => {
    if (!promotionsMap) return false;
    return promotionsMap.some(promo => 
      promo.specificTarget.some(target => 
        target === car._id || 
        (car.categories && car.categories.includes(target))
      )
    );
  };

  if (!cars) {
    return (
      <>
        <Navi />
        <Separator />
        <main className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading premium cars...</p>
        </main>
        <Separator />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navi />
      <Separator />
      <main className="flex flex-col items-center gap-4 p-2 md:p-8">
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">Premium Collection</h1>
            <Button
              onClick={() => setShowPromotionsOnly(!showPromotionsOnly)}
              className="w-full md:w-auto hover:bg-blue-500 hover:shadow-lg transition-all duration-300 rounded-lg hover:bg-muted"
            >
              <TagIcon className="w-4 h-4 mr-2" />
              {showPromotionsOnly ? "Show All" : "Only Promotions"}
            </Button>
          </div>
          <section className="relative w-full h-auto overflow-hidden bg-gradient-to-b from-gray-200 to-white">
            <div className="max-w-full mx-auto h-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2 md:px-8 py-8 md:py-12 relative z-0">
                {(displayedCars ?? []).map((car) => (
                  <Card
                    key={car._id}
                    className="relative flex flex-col items-center justify-center p-2 md:p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl bg-card hover:bg-gradient-to-r from-blue-500 to-green-500 border-none hover:z-50"
                    style={{ border: "none" }}
                  >
                    {hasActivePromotion(car) && (
                      <div className="absolute top-2 right-2 bg-white/90 hover:bg-white p-2 rounded-full z-10 transition-colors duration-200 items-center justify-center w-12 h-12 md:w-16 md:h-16">
                        <TagIcon className="w-6 h-6 md:w-8 md:h-8 text-customyello" />
                      </div>
                    )}
                    <Image
                      src={car.pictures[0]}
                      alt={`${car.maker} ${car.model}`}
                      width={400}
                      height={200}
                      className="w-full max-w-[300px] h-[180px] md:h-[220px] object-cover border-none rounded-lg"
                      style={{ border: "none" }}
                    />
                    <CardContent className="p-2 md:p-4 text-center border-none w-full" style={{ border: "none" }}>
                      <h2 className="text-lg md:text-xl font-semibold mb-2">
                        {car.maker} {car.model}
                      </h2>
                      <p className="text-sm md:text-base text-muted-foreground mb-4">Year: {car.year}</p>
                      <Link href={`/carinfo?id=${car.registrationNumber}`}>
                        <Button className="w-full md:w-auto hover:bg-blue-500 hover:shadow-lg transition-all duration-300 rounded-lg mt-0 mb-2 md:mb-5 hover:bg-muted">
                          Book Now
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
                {(displayedCars?.length ?? 0) === 0 && (
                  <p>No premium cars found.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Separator />
      <Footer />
    </>
  );
}

export { PremiumCars };
export default PremiumCars;
