import React from "react";
import { format } from "date-fns";
import { CalendarIcon, SearchIcon, RotateCcwIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ActivationSearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

const ActivationSearchFilters: React.FC<ActivationSearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onApplyFilters,
  onResetFilters,
}) => {
  return (
    <div className="space-y-4 p-4">
      <div>
        <label htmlFor="search-reseller" className="block text-sm font-medium text-gray-700 mb-1">Cerca Rivenditore</label>
        <div className="relative">
          <Input
            id="search-reseller"
            placeholder="Nome rivenditore..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div>
        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Data Richiesta (Da)</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Seleziona data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Data Richiesta (A)</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : <span>Seleziona data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <Button variant="outline" onClick={onResetFilters}>
          <RotateCcwIcon className="mr-2 h-4 w-4" />
          Reset Filtri
        </Button>
        <Button onClick={onApplyFilters}>
          <SearchIcon className="mr-2 h-4 w-4" />
          Applica Filtri
        </Button>
      </div>
    </div>
  );
};

export default ActivationSearchFilters;