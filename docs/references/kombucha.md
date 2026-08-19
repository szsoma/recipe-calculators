import React, { useState } from 'react';
import { Scale, Droplets, Leaf, Lock, Unlock, Clock } from 'lucide-react';

export default function KombuchaCalculator() {
  const [baseRecipe, setBaseRecipe] = useState({
    tea: 40,
    teaWater: 2000,
    sugar: 350,
    starterTea: 800,
    water: 4200
  });

  const [currentRecipe, setCurrentRecipe] = useState({
    tea: 40,
    teaWater: 2000,
    sugar: 350,
    starterTea: 800,
    water: 4200
  });

  const [fixedVolume, setFixedVolume] = useState(false);
  const [delayedSugar, setDelayedSugar] = useState(false);

  const handleBaseChange = (ingredient, value) => {
    const numValue = parseFloat(value) || 0;
    const newBase = { ...baseRecipe, [ingredient]: numValue };
    setBaseRecipe(newBase);
    setCurrentRecipe(newBase);
  };

  const handleCurrentChange = (ingredient, value) => {
    let numValue = parseFloat(value) || 0;
    
    // Convert displayed value to actual value if delayed sugar is active
    if (ingredient === 'sugar') {
      numValue = getActualSugar(numValue);
    } else if (ingredient === 'water') {
      numValue = getActualWater(numValue);
    }
    
    const baseValue = baseRecipe[ingredient];
    
    if (baseValue === 0) {
      setCurrentRecipe({ ...currentRecipe, [ingredient]: numValue });
      return;
    }

    // Fixed volume mode
    if (fixedVolume) {
      const liquidIngredients = ['teaWater', 'starterTea', 'water'];
      const isLiquid = liquidIngredients.includes(ingredient);
      
      if (isLiquid) {
        // Keep total volume fixed by adjusting other liquid ingredients
        const currentTotal = currentRecipe.teaWater + currentRecipe.starterTea + currentRecipe.water;
        const difference = numValue - currentRecipe[ingredient];
        
        // Get other liquid ingredients
        const otherLiquids = liquidIngredients.filter(ing => ing !== ingredient);
        const otherLiquidsTotal = otherLiquids.reduce((sum, ing) => sum + currentRecipe[ing], 0);
        
        if (otherLiquidsTotal === 0) {
          setCurrentRecipe({ ...currentRecipe, [ingredient]: numValue });
          return;
        }
        
        // Distribute the difference proportionally among other liquids
        const newRecipe = { ...currentRecipe, [ingredient]: numValue };
        
        otherLiquids.forEach(ing => {
          const proportion = currentRecipe[ing] / otherLiquidsTotal;
          newRecipe[ing] = Math.max(0, currentRecipe[ing] - (difference * proportion));
        });
        
        // Adjust tea and sugar based on new total volume
        const newTotal = newRecipe.teaWater + newRecipe.starterTea + newRecipe.water;
        const baseTotal = baseRecipe.teaWater + baseRecipe.starterTea + baseRecipe.water;
        const volumeRatio = newTotal / baseTotal;
        
        newRecipe.tea = baseRecipe.tea * volumeRatio;
        newRecipe.sugar = baseRecipe.sugar * volumeRatio;
        
        setCurrentRecipe(newRecipe);
      } else {
        // For tea and sugar, just update the value without affecting liquids
        setCurrentRecipe({ ...currentRecipe, [ingredient]: numValue });
      }
      return;
    }

    // Normal proportional scaling mode
    const scaleFactor = numValue / baseValue;
    
    const scaled = {
      tea: baseRecipe.tea * scaleFactor,
      teaWater: baseRecipe.teaWater * scaleFactor,
      sugar: baseRecipe.sugar * scaleFactor,
      starterTea: baseRecipe.starterTea * scaleFactor,
      water: baseRecipe.water * scaleFactor
    };

    setCurrentRecipe(scaled);
  };

  const handleVolumeChange = (value) => {
    const numValue = parseFloat(value) || 0;
    const baseVolume = baseRecipe.teaWater + baseRecipe.starterTea + baseRecipe.water;
    
    if (baseVolume === 0) return;

    const scaleFactor = numValue / baseVolume;
    
    const scaled = {
      tea: baseRecipe.tea * scaleFactor,
      teaWater: baseRecipe.teaWater * scaleFactor,
      sugar: baseRecipe.sugar * scaleFactor,
      starterTea: baseRecipe.starterTea * scaleFactor,
      water: baseRecipe.water * scaleFactor
    };

    setCurrentRecipe(scaled);
  };

  const formatValue = (value) => {
    return Math.round(value * 100) / 100;
  };

  const totalVolume = currentRecipe.teaWater + currentRecipe.starterTea + currentRecipe.water;
  const baseVolume = baseRecipe.teaWater + baseRecipe.starterTea + baseRecipe.water;

  // Get displayed values considering delayed sugar mode
  const getDisplayedSugar = () => {
    // In delayed mode, show 1/3 of total sugar (first portion is in initial batch)
    return delayedSugar ? currentRecipe.sugar / 3 : currentRecipe.sugar;
  };

  const getDisplayedWater = () => {
    // In delayed mode, reduce water by 800ml (2×400ml for day 2 and 3 syrups)
    // First 400ml is included in the batch water
    return delayedSugar ? Math.max(0, currentRecipe.water - 800) : currentRecipe.water;
  };

  const getActualWater = (displayedWater) => {
    return delayedSugar ? displayedWater + 800 : displayedWater;
  };

  const getActualSugar = (displayedSugar) => {
    return delayedSugar ? displayedSugar * 3 : displayedSugar;
  };

  const getSyrupSugar = () => {
    // Each syrup (day 2 and day 3) gets 1/3 of total sugar
    return currentRecipe.sugar / 3;
  };

  const getSingleSyrupAmount = () => {
    return formatValue(currentRecipe.sugar / 3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Droplets className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
            <h1 className="text-2xl sm:text-4xl font-bold text-amber-900">Kombucha Recipe</h1>
          </div>
          <p className="text-sm sm:text-base text-amber-700 px-4">Edit your base recipe or scale your batch</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Base Recipe */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-amber-900">Base Recipe</h2>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <IngredientInput
                label="Tea"
                value={baseRecipe.tea}
                onChange={(v) => handleBaseChange('tea', v)}
                unit="g"
                icon="🍵"
              />
              <IngredientInput
                label="Tea Water"
                value={baseRecipe.teaWater}
                onChange={(v) => handleBaseChange('teaWater', v)}
                unit="ml"
                icon="💧"
              />
              <IngredientInput
                label="Sugar"
                value={baseRecipe.sugar}
                onChange={(v) => handleBaseChange('sugar', v)}
                unit="g"
                icon="🍬"
              />
              <IngredientInput
                label="Starter Tea"
                value={baseRecipe.starterTea}
                onChange={(v) => handleBaseChange('starterTea', v)}
                unit="ml"
                icon="🧪"
              />
              <IngredientInput
                label="Water"
                value={baseRecipe.water}
                onChange={(v) => handleBaseChange('water', v)}
                unit="ml"
                icon="💧"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-amber-200">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-amber-700 font-medium">Base Volume</span>
                <span className="text-xl sm:text-2xl font-bold text-amber-900">{formatValue(baseVolume)} ml</span>
              </div>
            </div>
          </div>

          {/* Scaled Recipe */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-green-900">Your Batch</h2>
            </div>

            {/* Fixed Volume Toggle */}
            <div className="mb-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {fixedVolume ? (
                  <Lock className="w-4 h-4 text-blue-600" />
                ) : (
                  <Unlock className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-700">Lock Total Volume</span>
              </div>
              <button
                onClick={() => setFixedVolume(!fixedVolume)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  fixedVolume ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    fixedVolume ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Delayed Sugar Toggle */}
            <div className="mb-4 flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${delayedSugar ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">Delayed Sugar (3 days)</span>
              </div>
              <button
                onClick={() => setDelayedSugar(!delayedSugar)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  delayedSugar ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    delayedSugar ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {delayedSugar && (
              <div className="mb-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-300">
                <h4 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Delayed Sugar Instructions
                </h4>
                <div className="bg-white p-3 rounded-lg mb-3">
                  <p className="text-xs text-purple-900 font-semibold mb-1">Initial Batch (Day 1):</p>
                  <p className="text-xs text-purple-800">First portion already included: <strong>{formatValue(getSyrupSugar())}g sugar</strong> dissolved in the batch</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-purple-900 font-semibold mb-2">Additional Syrups to Add:</p>
                  <ol className="text-xs text-purple-800 space-y-1 ml-4 list-decimal">
                    <li><strong>Day 2:</strong> Dissolve <strong>{formatValue(getSyrupSugar())}g sugar</strong> in <strong>400ml water</strong> → Add to batch</li>
                    <li><strong>Day 3:</strong> Dissolve <strong>{formatValue(getSyrupSugar())}g sugar</strong> in <strong>400ml water</strong> → Add to batch</li>
                  </ol>
                </div>
                <p className="text-xs text-purple-700 mt-3 italic">💡 Total sugar: {formatValue(currentRecipe.sugar)}g divided into 3 equal portions</p>
                <p className="text-xs text-purple-700 mt-1 italic">💧 Water below excludes the 800ml needed for Day 2 & 3 syrups</p>
              </div>
            )}

            {/* Total Volume Input */}
            <div className="mb-6 p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <label className="block text-sm font-medium text-green-900 mb-2">
                Target Batch Volume
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formatValue(totalVolume)}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  step="1"
                  className="flex-1 px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:border-green-500 focus:ring-green-200 text-lg font-semibold"
                  disabled={fixedVolume}
                />
                <span className="px-4 py-3 bg-green-600 text-white rounded-lg font-bold min-w-[60px] text-center">
                  ml
                </span>
              </div>
              {fixedVolume && (
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Volume locked - adjust ingredients to maintain total
                </p>
              )}
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <IngredientInput
                label="Tea"
                value={formatValue(currentRecipe.tea)}
                onChange={(v) => handleCurrentChange('tea', v)}
                unit="g"
                icon="🍵"
                highlight
              />
              <IngredientInput
                label="Tea Water"
                value={formatValue(currentRecipe.teaWater)}
                onChange={(v) => handleCurrentChange('teaWater', v)}
                unit="ml"
                icon="💧"
                highlight
              />
              <IngredientInput
                label={delayedSugar ? "Sugar" : "Sugar"}
                value={formatValue(getDisplayedSugar())}
                onChange={(v) => handleCurrentChange('sugar', v)}
                unit="g"
                icon="🍬"
                highlight
                badge={delayedSugar ? `Day 1: ${formatValue(getSyrupSugar())}g | Day 2: ${formatValue(getSyrupSugar())}g | Day 3: ${formatValue(getSyrupSugar())}g` : null}
              />
              <IngredientInput
                label="Starter Tea"
                value={formatValue(currentRecipe.starterTea)}
                onChange={(v) => handleCurrentChange('starterTea', v)}
                unit="ml"
                icon="🧪"
                highlight
              />
              <IngredientInput
                label={delayedSugar ? "Water (initial)" : "Water"}
                value={formatValue(getDisplayedWater())}
                onChange={(v) => handleCurrentChange('water', v)}
                unit="ml"
                icon="💧"
                highlight
                badge={delayedSugar ? "-800ml" : null}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 lg:mt-8 bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <h3 className="font-bold text-amber-900 mb-3 text-sm sm:text-base">How to use:</h3>
          <ul className="text-amber-700 space-y-2 text-xs sm:text-sm">
            <li>• <strong>Edit Base Recipe:</strong> Set your preferred ingredient amounts on the left</li>
            <li>• <strong>Set Target Volume:</strong> Enter your desired batch size in the green box</li>
            <li>• <strong>Proportional Mode:</strong> Change any ingredient - all others scale proportionally</li>
            <li>• <strong>Fixed Volume Mode:</strong> Toggle lock to maintain total volume - changing one liquid adjusts others to compensate</li>
            <li>• <strong>Delayed Sugar:</strong> First syrup included in initial batch; make 2 additional 400ml syrups for Days 2 & 3</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function IngredientInput({ label, value, onChange, unit, icon, highlight, badge }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="text-xl sm:text-2xl">{icon}</span>
      <div className="flex-1">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
          {label}
          {badge && (
            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
              {badge}
            </span>
          )}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            step="0.01"
            className={`flex-1 px-3 py-2 sm:px-4 sm:py-2 border-2 rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base ${
              highlight 
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200' 
                : 'border-amber-300 focus:border-amber-500 focus:ring-amber-200'
            }`}
          />
          <span className="px-2 sm:px-3 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium min-w-[45px] sm:min-w-[50px] text-center text-sm sm:text-base">
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}
