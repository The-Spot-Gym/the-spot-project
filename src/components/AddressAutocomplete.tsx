import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Prediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface AddressAutocompleteProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  placeholder?: string;
}

const AddressAutocomplete = ({ onLocationSelect, placeholder = "Search an address or city..." }: AddressAutocompleteProps) => {
  const [input, setInput] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    if (input.trim().length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('place-autocomplete', {
          body: { action: 'autocomplete', input: input.trim() },
        });
        if (!error && data?.predictions) {
          setPredictions(data.predictions);
          setShowDropdown(data.predictions.length > 0);
        }
      } catch {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [input]);

  const handleSelect = async (prediction: Prediction) => {
    setShowDropdown(false);
    setInput(prediction.description);
    setGeocoding(true);

    try {
      const { data, error } = await supabase.functions.invoke('place-autocomplete', {
        body: { action: 'geocode', placeId: prediction.placeId },
      });

      if (!error && data?.latitude && data?.longitude) {
        onLocationSelect({
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.formattedAddress || prediction.description,
        });
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setGeocoding(false);
    }
  };

  const handleClear = () => {
    setInput("");
    setPredictions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {(loading || geocoding) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {input && !loading && !geocoding && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {predictions.map((prediction) => (
            <button
              key={prediction.placeId}
              onClick={() => handleSelect(prediction)}
              className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{prediction.mainText}</p>
                <p className="text-xs text-muted-foreground truncate">{prediction.secondaryText}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
