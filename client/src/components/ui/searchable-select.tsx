import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Loader2, Search, ChevronDown, Check } from "lucide-react";
import { Country } from "../../../shared/types";

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  countries: Country[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  totalCount?: number;
}

export function SearchableSelect({
  value,
  onValueChange,
  onSearch,
  placeholder = "Select a country...",
  disabled = false,
  countries,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  totalCount,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Handle search query changes
  useEffect(() => {
    if (onSearch) {
      onSearch(searchQuery);
    }

    // Local filtering for immediate feedback
    if (searchQuery.trim() === "") {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(country =>
        country.country_name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.country_name_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.country_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [countries, searchQuery, onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Load more when scrolled to 80% of the list
    if (scrollHeight - scrollTop <= clientHeight * 1.2 && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  };

  const selectedCountry = countries.find(c => c.country_code === value);

  const handleCountrySelect = (countryCode: string) => {
    onValueChange(countryCode);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery("");
      }
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between"
        disabled={disabled}
        onClick={handleToggle}
      >
        {selectedCountry ? (
          <span className="truncate">{selectedCountry.country_name_en}</span>
        ) : (
          <span className="text-muted-foreground truncate">{placeholder}</span>
        )}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {/* Search Input */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search countries..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Country List */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto p-1"
            onScroll={handleScroll}
          >
            {filteredCountries.length === 0 && !isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchQuery ? "No countries found" : "No countries available"}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCountries.map((country) => (
                  <div
                    key={country.id}
                    className="flex items-center p-2 rounded-sm hover:bg-accent cursor-pointer text-sm"
                    onClick={() => handleCountrySelect(country.country_code)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value === country.country_code
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{country.country_name_en}</div>
                      {country.country_name_en !== country.country_name_id && (
                        <div className="text-xs text-muted-foreground">
                          {country.country_name_id}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {country.country_code}
                    </div>
                  </div>
                ))}

                {/* Load More Indicator */}
                {isLoading && (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                )}
              </div>
            )}

            {/* Count Info */}
            {!isLoading && (
              <div className="px-2 py-2 border-t text-xs text-muted-foreground text-center">
                {filteredCountries.length} of {totalCount || countries.length} countries
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}