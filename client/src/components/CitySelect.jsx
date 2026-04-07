import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiMapPin, FiChevronDown, FiX } from "react-icons/fi";
import API from "../services/api";

const CitySelect = ({ value, onChange, placeholder = "Search and select city...", error, disabled, displayText = "" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCityName, setSelectedCityName] = useState("");
  const dropdownRef = useRef(null);

  // Initial fetch/search when searchTerm changes
  useEffect(() => {
    if (!isOpen) return;
    
    const delayDebounceFn = setTimeout(() => {
      fetchCities(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, isOpen]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync selected city name when value changes
  useEffect(() => {
    if (value) {
      // If we already have the cities, find the name
      const found = cities.find(c => c._id === value);
      if (found) {
        setSelectedCityName(found.name);
      } else {
        // Fetch specific city if not in list
        fetchCityDetails(value);
      }
    } else {
      setSelectedCityName("");
    }
  }, [value]);

  const fetchCities = async (q) => {
    setLoading(true);
    try {
      const res = await API.get(`/cities?q=${q}`);
      setCities(res.data.data);
    } catch (err) {
      console.error("Fetch cities failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCityDetails = async (cityId) => {
    if (!cityId) return;
    try {
      const res = await API.get(`/cities?id=${cityId}`);
      if (res.data.success && res.data.data && res.data.data.length > 0) {
        setSelectedCityName(res.data.data[0].name);
      }
    } catch (err) {
      console.error("Fetch city details failed", err);
    }
  };

  const handleSelect = (city) => {
    setSelectedCityName(city.name);
    onChange(city._id, city.name, city);
    setIsOpen(false);
    setSearchTerm("");
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setSelectedCityName("");
    onChange(null, "");
    setSearchTerm("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-10 px-3 flex items-center justify-between bg-white border rounded-lg text-sm transition-all cursor-pointer ${
          error ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}`}
      >
        <div className="flex items-center gap-2 truncate">
          <FiMapPin className={selectedCityName || displayText ? "text-indigo-500" : "text-slate-400"} size={14} />
          <span className={selectedCityName || displayText ? "text-slate-900 font-medium" : "text-slate-400"}>
            {selectedCityName || displayText || placeholder}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {selectedCityName && !disabled && (
            <FiX 
              className="text-slate-400 hover:text-rose-500 transition-colors p-0.5" 
              size={16} 
              onClick={clearSelection} 
            />
          )}
          <FiChevronDown className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} size={16} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                autoFocus
                type="text"
                className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Type city name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 text-center text-slate-400 text-xs">Loading cities...</div>
            ) : cities.length > 0 ? (
              cities.map((city) => (
                <div
                  key={city._id}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                    value === city._id ? "bg-indigo-50 text-indigo-600 font-medium" : "text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => handleSelect(city)}
                >
                  <div className="flex flex-col">
                    <span>{city.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">{city.state}</span>
                  </div>
                  {value === city._id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                {searchTerm ? "No cities found matching your search" : "Start typing to search cities..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitySelect;
