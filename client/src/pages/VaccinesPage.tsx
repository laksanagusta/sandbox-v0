import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription } from "../components/ui/alert";
import { SearchableSelect } from "../components/ui/searchable-select";
import { Loader2, Globe, Shield, AlertTriangle, Info } from "lucide-react";
import vaccinesApi from "../services/vaccines-api";
import { Country, VaccineRecommendation, CountriesResponse } from "../../../shared/types";

const VaccinesPage: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [vaccineRecommendations, setVaccineRecommendations] = useState<VaccineRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [error, setError] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreCountries, setHasMoreCountries] = useState(true);
  const [totalCountries, setTotalCountries] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const COUNTRIES_PER_PAGE = 20;

  // Load countries on component mount
  useEffect(() => {
    loadCountries(true);
  }, []);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
    setCountries([]);
    setHasMoreCountries(true);
  }, [searchQuery]);

  const loadCountries = async (reset = false) => {
    setLoadingCountries(true);
    setError("");

    try {
      const page = reset ? 1 : currentPage;
      const response = await vaccinesApi.getCountries({
        limit: COUNTRIES_PER_PAGE,
        page: page,
        ...(searchQuery && { search: searchQuery })
      });

      // Filter only active countries
      const activeCountries = response.data.filter((country) => country.is_active);

      if (reset) {
        setCountries(activeCountries);
      } else {
        setCountries(prev => [...prev, ...activeCountries]);
      }

      setTotalCountries(response.total_items);
      setHasMoreCountries(page < response.total_pages);

      if (!reset) {
        setCurrentPage(prev => prev + 1);
      } else {
        setCurrentPage(2);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load countries");
    } finally {
      setLoadingCountries(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      const timeoutId = setTimeout(() => {
        setSearchQuery(query);
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    []
  );

  const handleSearch = (query: string) => {
    debouncedSearch(query);
  };

  const handleLoadMore = () => {
    if (hasMoreCountries && !loadingCountries) {
      loadCountries(false);
    }
  };

  const handleCountryChange = async (countryCode: string) => {
    setSelectedCountry(countryCode);
    setVaccineRecommendations(null);
    setError("");

    if (!countryCode) return;

    setLoading(true);
    try {
      const response = await vaccinesApi.getVaccineRecommendations(countryCode, "en");
      setVaccineRecommendations(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vaccine recommendations");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "required":
        return "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 border-red-200";
      case "recommended":
        return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 border-blue-200";
      case "consider":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800 border-yellow-200";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "required":
        return <Shield className="h-4 w-4" />;
      case "recommended":
        return <Globe className="h-4 w-4" />;
      case "consider":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const selectedCountryName = countries.find(c => c.country_code === selectedCountry)?.country_name_en;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Vaccine Recommendations</h1>
        <p className="text-muted-foreground">
          Get vaccine recommendations and health information for international travel
        </p>
      </div>

      {/* Country Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Select Destination Country
          </CardTitle>
          <CardDescription>
            Choose a country to view vaccine recommendations and travel health information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SearchableSelect
              value={selectedCountry}
              onValueChange={handleCountryChange}
              onSearch={handleSearch}
              placeholder="Select a country..."
              disabled={loadingCountries}
              countries={countries}
              isLoading={loadingCountries}
              onLoadMore={handleLoadMore}
              hasMore={hasMoreCountries}
              totalCount={totalCountries}
            />

            {loadingCountries && countries.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading countries...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && selectedCountry && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading vaccine recommendations for {selectedCountryName}...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vaccine Recommendations */}
      {vaccineRecommendations && (
        <div className="space-y-6">
          {/* Country Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {vaccineRecommendations.country_name}
              </CardTitle>
              <CardDescription>
                Country Code: {vaccineRecommendations.country_code} |
                Data Source: {vaccineRecommendations.data_source}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Required Vaccines */}
          {vaccineRecommendations.required_vaccines && vaccineRecommendations.required_vaccines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Shield className="h-5 w-5" />
                  Required Vaccines
                </CardTitle>
                <CardDescription>
                  These vaccines are mandatory for travel to this destination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {vaccineRecommendations.required_vaccines.map((vaccine) => (
                    <div key={vaccine.vaccine_code} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{vaccine.vaccine_name}</h3>
                            <Badge variant="secondary" className={getRecommendationColor(vaccine.recommendation)}>
                              <div className="flex items-center gap-1">
                                {getRecommendationIcon(vaccine.recommendation)}
                                Required
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{vaccine.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Type: {vaccine.vaccine_type} | Code: {vaccine.vaccine_code}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Vaccines */}
          {vaccineRecommendations.recommended_vaccines && vaccineRecommendations.recommended_vaccines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Globe className="h-5 w-5" />
                  Recommended Vaccines
                </CardTitle>
                <CardDescription>
                  These vaccines are recommended for optimal protection during travel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {vaccineRecommendations.recommended_vaccines.map((vaccine) => (
                    <div key={vaccine.vaccine_code} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{vaccine.vaccine_name}</h3>
                            <Badge variant="secondary" className={getRecommendationColor(vaccine.recommendation)}>
                              <div className="flex items-center gap-1">
                                {getRecommendationIcon(vaccine.recommendation)}
                                Recommended
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{vaccine.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Type: {vaccine.vaccine_type} | Code: {vaccine.vaccine_code}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consider Vaccines */}
          {vaccineRecommendations.consider_vaccines && vaccineRecommendations.consider_vaccines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  Consider Vaccines
                </CardTitle>
                <CardDescription>
                  Consider these vaccines based on your specific travel plans and health condition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {vaccineRecommendations.consider_vaccines.map((vaccine) => (
                    <div key={vaccine.vaccine_code} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{vaccine.vaccine_name}</h3>
                            <Badge variant="secondary" className={getRecommendationColor(vaccine.recommendation)}>
                              <div className="flex items-center gap-1">
                                {getRecommendationIcon(vaccine.recommendation)}
                                Consider
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{vaccine.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Type: {vaccine.vaccine_type} | Code: {vaccine.vaccine_code}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Malaria Information */}
          {(vaccineRecommendations.malaria_risk !== "None mentioned" ||
            vaccineRecommendations.malaria_prophylaxis !== "None mentioned") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Malaria Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong>Risk Level:</strong> {vaccineRecommendations.malaria_risk}
                </div>
                <div>
                  <strong>Prophylaxis Recommendation:</strong> {vaccineRecommendations.malaria_prophylaxis}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Health Notice */}
          {vaccineRecommendations.health_notice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Health Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{vaccineRecommendations.health_notice}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default VaccinesPage;