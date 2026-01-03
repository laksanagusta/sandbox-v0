import { useState, useEffect, useRef } from "react";
import { Search, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  options: Array<{
    value: string;
    label: string;
    subtitle?: string;
  }>;
  onSearch: (searchTerm: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  placeholder = "Select option",
  disabled = false,
  loading = false,
  options,
  onSearch,
  searchPlaceholder = "Search...",
  className = ""
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Load initial data when opening
        onSearch("");
        setSearchTerm("");
      }
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between text-left font-normal"
        onClick={handleToggle}
        disabled={disabled || loading}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : options.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              <div className="py-1">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors ${
                      option.value === value ? "bg-muted" : ""
                    }`}
                    onClick={() => handleSelect(option.value)}
                  >
                    <div className="font-medium">{option.label}</div>
                    {option.subtitle && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {option.subtitle}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}