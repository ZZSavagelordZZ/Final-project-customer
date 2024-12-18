import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator"; // Ensure Separator is imported
import { useQuery } from "convex/react";
import { Search, TagIcon } from "lucide-react"; // Import Car icon
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { api } from "@/convex/_generated/api";
import { Footer } from "../head/footer";
import { Navi } from "../head/navi";
import dynamic from 'next/dynamic';
import loadingAnimation from "@/public/animations/loadingAnimation.json";
import { LottieRefCurrentProps } from "lottie-react";
import axios from 'axios'; // Add this import
import { useUser } from "@clerk/nextjs";

// Add dynamic import for Lottie
const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
});

export default function AllVehicles() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showPromotionsOnly, setShowPromotionsOnly] = useState(false);
  const { user } = useUser();

  // Declare all state variables first
  const [searchParams, setSearchParams] = useState({
    maker: "",
    model: "",
    year: undefined as number | undefined,
    engineType: "",
    engineCylinders: "",
    fuelType: "",
    transmission: "",
    drive: "",
    doors: "",
  });

  // Add a separate state for input values
  const [inputValues, setInputValues] = useState({
    maker: "",
    model: "",
    year: "",
    engineType: "",
    engineHorsepower: "",
    engineCylinders: "",
    fuelType: "",
    transmission: "",
    drive: "",
    doors: "",

  });

  // Then use them in the query
  const cars = useQuery(api.car.getFilteredCars, searchParams);
  const carsByCategory = useQuery(api.car.getCarsByCategory, {
    category: selectedCategory,
  });

  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Optionally set speed after the component mounts
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(1.5);
      
    }
  }, []);

  // Add this handler for input changes
  const handleInputChange = (field: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add this handler for the search button
  const handleSearch = () => {
    setSearchParams({
      ...inputValues,
      year: inputValues.year ? parseInt(inputValues.year) : undefined,
    });
  };

  // Add new state variables for AI chat
  const [customerQuery, setCustomerQuery] = useState("");
  // const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Add AI query handler
  // const handleAiQuery = async () => {
  //   if (!customerQuery.trim()) return;
    
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch('/api/chat', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Accept': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         query: customerQuery
  //       })
  //     });
      
  //     // Check if the response is JSON
  //     const contentType = response.headers.get("content-type");
  //     if (!contentType || !contentType.includes("application/json")) {
  //       throw new Error("Response is not JSON");
  //     }

  //     const data = await response.json();
  //     console.log('Received response data:', data);

  //     if (data.error) {
  //       throw new Error(data.error);
  //     }

  //     setAiResponse(data.response || 'No response received');
  //   } catch (error: any) {
  //     console.error('Detailed error:', error);
  //     try {
  //       const responseText = await response?.text();
  //       console.error('Raw response:', responseText);
  //     } catch (e) {
  //       console.error('Could not get response text:', e);
  //     }
  //     setAiResponse("I apologize, but I'm having trouble connecting right now. Please try again in a moment.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Add this query to get promotions for each car
  const promotionsMap = useQuery(api.promotions.getAllPromotions);

  // Modify the displayed cars logic
  const displayedCars = useMemo(() => {
    let filteredCars = cars; // Start with all cars from search results
    
    // Apply category filter if one is selected
    if (selectedCategory && selectedCategory !== "all") {
      filteredCars = carsByCategory;
    }
    
    // Apply promotions filter if enabled
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
  }, [cars, carsByCategory, selectedCategory, showPromotionsOnly, promotionsMap]);

  // Add this helper function
  const hasActivePromotion = (car: any) => {
    if (!promotionsMap) return false;
    return promotionsMap.some(promo => 
      promo.specificTarget.some(target => 
        target === car._id || 
        (car.categories && car.categories.includes(target))
      )
    );
  };

  // Add this effect to trigger search when category changes
  useEffect(() => {
    handleSearch();
  }, [selectedCategory]); // This will trigger a new search when category changes

  if (!cars) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Lottie
          lottieRef={lottieRef}
          animationData={loadingAnimation}
          loop={true}
          className="w-48 h-48"
        />
      </div>
    );
  }

  // Change the body types query to categories
  const categories = ["SUV", "Sedan", "Luxury", "Van", "Truck", "Convertible"];

  return (
    <>
      <Navi />
      <Separator />
      <main className="flex flex-col items-center gap-4 p-4 md:p-8">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-12">
            <h1 className="text-3xl font-bold mb-6">Find Your Perfect Rental Car</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 mt-4 bg-card rounded-lg shadow-xl p-4 relative overflow-hidden">
              <Input
                placeholder="Make"
                value={inputValues.maker}
                onChange={(e) => handleInputChange('maker', e.target.value)}
              />
              <Input
                placeholder="Model"
                value={inputValues.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Year"
                  type="number"
                  min="1990"
                  max="2024"
                  value={inputValues.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                />
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value)}
                >
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="w-[180px] bg-card rounded-lg shadow-2xl p-2 relative overflow-hidden">
                    <SelectItem value="all" className="bg-background">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="bg-background">
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  className="hover:bg-blue-500 hover:shadow-lg transition-all duration-300 rounded-lg hover:bg-muted" 
                  onClick={handleSearch}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                
              </div>
              
            </div>
            <Button

onClick={() => setShowPromotionsOnly(!showPromotionsOnly)}
className="hover:bg-blue-500 hover:shadow-lg transition-all duration-300 rounded-lg hover:bg-muted"
>
<TagIcon className="w-4 h-4 mr-2" />
{showPromotionsOnly ? "Show All" : "Only Promotions"}
</Button>
            <div className="text-center">
              <Button 
                className="hover:bg-blue-500 hover:shadow-lg transition-all duration-300 rounded-lg hover:bg-muted"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide Advanced Search' : 'Advanced Search'}
              </Button>
              
              {showAdvanced && (
                <div className="mt-4 bg-card rounded-lg shadow-2xl p-6 relative overflow-hidden">
                  <h3 className="text-xl mb-4 font-bold">Advanced Search</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="engineType">Engine Type</Label>
                      <Input
                        id="engineType"
                        value={inputValues.engineType}
                        onChange={(e) => handleInputChange('engineType', e.target.value)}
                        placeholder="e.g., V6, Inline-4"
                        className=" bg-card rounded-lg shadow-lg relative"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="engineHorsepower">Engine Horsepower</Label>
                      <Input
                        id="engineHorsepower"
                        value={inputValues.engineHorsepower}
                        onChange={(e) => handleInputChange('engineHorsepower', e.target.value)}
                        placeholder="e.g., 300, 400"
                        className=" bg-card rounded-lg shadow-lg relative"
                      />
                    </div>
                    {/* <div className="space-y-2">
                      <Label htmlFor="cylinders">Cylinders</Label>
                      <Input
                        id="cylinders"
                        value={inputValues.engineCylinders}
                        onChange={(e) => handleInputChange('engineCylinders', e.target.value)}
                        placeholder="e.g., 4, 6, 8"
                      />
                    </div> */}

                    <div className="space-y-2">
                      <Label htmlFor="fuelType">Fuel Type</Label>
                      <Input
                        id="fuelType"
                        value={inputValues.fuelType}
                        onChange={(e) => handleInputChange('fuelType', e.target.value)}
                        placeholder="e.g., Gasoline, Diesel"
                        className=" bg-card rounded-lg shadow-lg relative"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transmission">Transmission</Label>
                      <Input
                        id="transmission"
                        value={inputValues.transmission}
                        onChange={(e) => handleInputChange('transmission', e.target.value)}
                        placeholder="e.g., Automatic, Manual"
                        className=" bg-card rounded-lg shadow-lg relative"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="drive">Drive</Label>
                      <Input
                        id="drive"
                        value={inputValues.drive}
                        onChange={(e) => handleInputChange('drive', e.target.value)}
                        placeholder="e.g., AWD, FWD, RWD"
                        className=" bg-card rounded-lg shadow-lg relative"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doors">Doors</Label>
                      <Input
                        id="doors"
                        value={inputValues.doors}
                        onChange={(e) => handleInputChange('doors', e.target.value)}
                        placeholder="e.g., 2, 4"
                        className=" bg-card rounded-lg shadow-lg relative"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={handleSearch}
                      className="hover:bg-blue-500 hover:shadow-lg transition-all duration-300 rounded-lg hover:bg-muted"
                    >
                      Search
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <section className="relative w-full h-auto overflow-hidden bg-gradient-to-b from-gray-200 to-white">
            <div className="max-w-full mx-auto h-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 mt-20 mx-14 mb-20 relative z-0">
                {(displayedCars ?? []).map((car) => (
                  <Card
                    key={car._id}
                    className="relative flex flex-col items-center justify-center p-0 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl bg-card hover:bg-gradient-to-r from-blue-500 to-green-500 border-none hover:z-50"
                    style={{ border: "none" }}
                  >
                    {hasActivePromotion(car) && (
                      <div className="absolute top-2 right-2 bg-white/90 hover:bg-white p-2 rounded-full z-10 transition-colors duration-200  items-center justify-center" style={{ width: '64px', height: '64px' }}>
                        <TagIcon className="w-8 h-8 text-customyello " />
                      </div>
                    )}
                    <Image
                      src={car.pictures[0]}
                      alt={`${car.maker} ${car.model}`}
                      width={400}
                      height={200}
                      className="w-[300px] h-[220px] border-none"
                      style={{ border: "none" }}
                    />
                    <CardContent className="p-0 text-center border-none" style={{ border: "none" }}>
                      <h2 className="text-xl font-semibold mb-2">
                        {car.maker} {car.model}
                      </h2>
                      <p className="text-muted-foreground mb-4">Year: {car.year}</p>
                      <Link href={`/carinfo?id=${car.registrationNumber}`}>
                        <Button className="hover:bg-blue-500 hover:shadow-lg transition-all duration-300 rounded-lg mt-0 mb-5 hover:bg-muted">
                          Book Now
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
                {(displayedCars?.length ?? 0) === 0 && (
                  <p>No cars found matching your criteria.</p>
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
