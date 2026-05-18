import React, { useState, useEffect } from 'react';
import { Truck, Package, ShoppingCart, Plus, Minus, Trash2, MoveRight, GripVertical, Download, ChevronUp, ChevronDown } from 'lucide-react';

interface ProductConfig {
  name: string;
  sizes: string[];
}

export default function App() {
  const [loadType, setLoadType] = useState<'Load 1' | 'Load 2' | 'Load 3'>('Load 1');

  // Dynamic Product Config List state
  const [productList, setProductList] = useState<ProductConfig[]>(() => {
    const saved = localStorage.getItem('vanBeverageProductsConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default initial beverage list with standard box size options
    return [
      { name: '7UP', sizes: ['250ml', '600ml', '1L', '2L'] },
      { name: 'Pepsi', sizes: ['250ml', '600ml', '1L', '2L'] },
      { name: 'Mirinda', sizes: ['250ml', '600ml', '1L', '2L'] },
      { name: 'Limca', sizes: ['250ml', '600ml', '1L', '2L'] },
      { name: 'Bindu', sizes: ['250ml', '600ml', '1L', '2L'] },
      { name: 'Jeera', sizes: ['250ml', '600ml', '1L', '2L'] },
      { name: 'Soda', sizes: ['250ml', '600ml', '1L', '2L'] },
      { name: 'Water', sizes: ['250ml', '600ml', '1L', '2L'] },
    ];
  });

  // Dynamic Master List of Available Sizes - Saved to localStorage so users can expand it with custom ml sizes permanently
  const [availableSizes, setAvailableSizes] = useState<string[]>(() => {
    const saved = localStorage.getItem('vanBeverageAvailableSizes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ['250ml', '500ml', '600ml', '750ml', '1L', '2L'];
  });

  const [newProductName, setNewProductName] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['250ml', '600ml', '1L', '2L']);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Independent Draft states for Load 1, Load 2, Load 3
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>(() => {
    const saved = localStorage.getItem('vanActiveQuantitiesDrafts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { 'Load 1': {}, 'Load 2': {}, 'Load 3': {} };
  });

  const [activeTab, setActiveTab] = useState<'products' | 'summary'>('products');
  const [showSwapOptions, setShowSwapOptions] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [printActive, setPrintActive] = useState(false);

  // Sync saved draft quantities to localStorage
  useEffect(() => {
    localStorage.setItem('vanActiveQuantitiesDrafts', JSON.stringify(quantities));
  }, [quantities]);

  const handleAddProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newProductName.trim();
    if (!trimmed) {
      alert('Please enter a product name.');
      return;
    }

    if (selectedSizes.length === 0) {
      alert('Please select at least one size option for this beverage.');
      return;
    }

    // Check for duplicate
    const uppercaseName = trimmed.toUpperCase();
    const exists = productList.some(p => p.name.toUpperCase() === uppercaseName);
    if (exists) {
      alert('Product already exists in the list!');
      return;
    }

    const newProduct: ProductConfig = {
      name: trimmed,
      sizes: [...selectedSizes].sort((a, b) => {
        const getVolume = (s: string) => {
          const val = parseFloat(s);
          if (s.toLowerCase().includes('ml')) return val;
          if (s.toLowerCase().includes('l')) return val * 1000;
          return val;
        };
        return getVolume(a) - getVolume(b);
      })
    };

    const updatedList = [...productList, newProduct];
    setProductList(updatedList);
    localStorage.setItem('vanBeverageProductsConfig', JSON.stringify(updatedList));
    
    // Reset form states
    setNewProductName('');
    setSelectedSizes(['250ml', '600ml', '1L', '2L']);
    setCustomSizeInput('');
  };

  const handleRemoveProduct = (productName: string) => {
    if (window.confirm(`Are you sure you want to remove ${productName} from your product list?`)) {
      const updatedList = productList.filter(p => p.name !== productName);
      setProductList(updatedList);
      localStorage.setItem('vanBeverageProductsConfig', JSON.stringify(updatedList));
      
      // Clean up quantities in all load drafts
      setQuantities(prev => {
        const updated = { ...prev };
        ['Load 1', 'Load 2', 'Load 3'].forEach(loadKey => {
          const draft = { ...(updated[loadKey] || {}) };
          Object.keys(draft).forEach(key => {
            if (key.startsWith(`${productName}_`)) {
              delete draft[key];
            }
          });
          updated[loadKey] = draft;
        });
        return updated;
      });
    }
  };

  const updateQuantity = (product: string, size: string, delta: number) => {
    const key = `${product}_${size}`;
    setQuantities(prev => {
      const loadDraft = { ...(prev[loadType] || {}) };
      const current = loadDraft[key] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        delete loadDraft[key];
      } else {
        loadDraft[key] = next;
      }
      return {
        ...prev,
        [loadType]: loadDraft
      };
    });
  };

  const handleClearLoad = () => {
    if (window.confirm(`Are you sure you want to clear all active quantities in ${loadType}?`)) {
      setQuantities(prev => ({
        ...prev,
        [loadType]: {}
      }));
    }
  };



  // Move items from current load to another load (swapping items action)
  const handleTransferItems = (targetLoad: 'Load 1' | 'Load 2' | 'Load 3') => {
    if (window.confirm(`Swap/Move all active items from ${loadType} to ${targetLoad}?`)) {
      setQuantities(prev => {
        const sourceDraft = prev[loadType] || {};
        const targetDraft = { ...(prev[targetLoad] || {}) };
        
        // Merge active items
        Object.entries(sourceDraft).forEach(([key, qty]) => {
          targetDraft[key] = (targetDraft[key] || 0) + qty;
        });

        return {
          ...prev,
          [loadType]: {}, // Clear source load
          [targetLoad]: targetDraft // Append to target load
        };
      });
      setLoadType(targetLoad); // Switch view to target load
      setShowSwapOptions(false);
      alert(`Successfully swapped items to ${targetLoad}!`);
    }
  };

  // NATIVE HTML5 DRAG & DROP FOR ROW SORTING
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Swap position during dragover for real-time fluid rendering
    const updated = [...productList];
    const temp = updated[draggedIndex];
    updated[draggedIndex] = updated[index];
    updated[index] = temp;

    setDraggedIndex(index);
    setProductList(updated);
    localStorage.setItem('vanBeverageProductsConfig', JSON.stringify(updated));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= productList.length) return;

    const updated = [...productList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setProductList(updated);
    localStorage.setItem('vanBeverageProductsConfig', JSON.stringify(updated));
  };

  // DOWNLOAD SPREADSHEET OPTION (TABULAR CSV SEPARATED BY SIZE WITH PRODUCT TOTALS & COLUMN GRAND TOTALS)
  const handleDownloadLoad = () => {
    const activeProducts = productList.filter(p => {
      const hasCrates = uniqueSizes.some(size => (currentDraft[`${p.name}_${size}`] || 0) > 0);
      const hasLoose = (currentDraft[`${p.name}_pcs`] || 0) > 0;
      return hasCrates || hasLoose;
    });

    if (activeProducts.length === 0) {
      alert('Active Load is empty! Add quantities before downloading.');
      return;
    }

    // Headers list - Single Pcs column at the end
    const headers = ['Product', ...uniqueSizes, 'Pieces (Pcs)', 'Row Total'];
    const csvRows = [headers.join(',')];

    // Product matrix row calculations
    activeProducts.forEach(p => {
      let cratesTotal = 0;
      const rowCells = [p.name];
      uniqueSizes.forEach(size => {
        const qty = currentDraft[`${p.name}_${size}`] || 0;
        cratesTotal += qty;
        rowCells.push(qty > 0 ? qty.toString() : '0');
      });
      const pieces = currentDraft[`${p.name}_pcs`] || 0;
      rowCells.push(pieces > 0 ? pieces.toString() : '0');
      
      // Total representation
      rowCells.push(`${cratesTotal} Bx ${pieces} Pcs`);
      csvRows.push(rowCells.join(','));
    });

    // Separated column totals at the bottom
    const totalRow = ['TOTAL CASES'];
    uniqueSizes.forEach(size => {
      let sizeTotal = 0;
      activeProducts.forEach(p => {
        sizeTotal += currentDraft[`${p.name}_${size}`] || 0;
      });
      totalRow.push(sizeTotal.toString());
    });
    
    // Pieces column total
    let totalPieces = 0;
    activeProducts.forEach(p => {
      totalPieces += currentDraft[`${p.name}_pcs`] || 0;
    });
    totalRow.push(totalPieces.toString());
    totalRow.push('—');
    
    csvRows.push(totalRow.join(','));

    // Trigger local download blob
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Van_Load_${loadType}_Sheet_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // GENERATE & DOWNLOAD PDF REPORT NATIVELY
  const handleDownloadPDF = () => {
    const activeProducts = productList.filter(p => {
      const hasCrates = uniqueSizes.some(size => (currentDraft[`${p.name}_${size}`] || 0) > 0);
      const hasLoose = (currentDraft[`${p.name}_pcs`] || 0) > 0;
      return hasCrates || hasLoose;
    });

    if (activeProducts.length === 0) {
      alert('Active Load is empty! Add quantities before downloading.');
      return;
    }

    setPrintActive(true);
    
    // Allow state change to render container in DOM before printing
    setTimeout(() => {
      window.print();
      setPrintActive(false);
    }, 250);
  };

  // Add custom size entered by user permanently into availableSizes master checklist
  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    
    // Normalize format (e.g. "200 ml" -> "200ml")
    const formatted = trimmed.replace(/\s+/g, '');
    
    // Add permanently to master list of selectable sizes
    if (!availableSizes.includes(formatted)) {
      const updatedSizes = [...availableSizes, formatted].sort((a, b) => {
        const getVolume = (s: string) => {
          const val = parseFloat(s);
          let multiplier = 1;
          if (s.toLowerCase().includes('ml')) {
            multiplier = 1;
          } else if (s.toLowerCase().includes('l')) {
            multiplier = 1000;
          }
          return val * multiplier;
        };
        return getVolume(a) - getVolume(b);
      });
      setAvailableSizes(updatedSizes);
      localStorage.setItem('vanBeverageAvailableSizes', JSON.stringify(updatedSizes));
    }

    // Auto-check this size for the current beverage
    if (!selectedSizes.includes(formatted)) {
      setSelectedSizes(prev => [...prev, formatted]);
    }
    setCustomSizeInput('');
  };

  // Remove a custom size from selectable availableSizes checklist (with confirmation safeguard)
  const handleRemoveCustomSize = (sizeToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid checking checkbox on click
    if (window.confirm(`Are you sure you want to permanently remove "${sizeToRemove}" size from the list of options?`)) {
      const updated = availableSizes.filter(s => s !== sizeToRemove);
      setAvailableSizes(updated);
      localStorage.setItem('vanBeverageAvailableSizes', JSON.stringify(updated));
      
      // Also uncheck it from active configuration
      setSelectedSizes(prev => prev.filter(s => s !== sizeToRemove));
    }
  };

  const toggleSizeSelection = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  // Get active quantities draft for currently selected load
  const currentDraft = quantities[loadType] || {};

  // Convert quantities state to active items array for list display
  const activeItems = Object.entries(currentDraft)
    .map(([key, qty]) => {
      const [product, size] = key.split('_');
      return { key, product, size, quantity: qty };
    })
    .sort((a, b) => a.product.localeCompare(b.product));

  // Calculates combined total crates count across load
  const totalCrates = activeItems
    .filter(item => item.size !== 'pcs')
    .reduce((sum, item) => sum + item.quantity, 0);

  // Calculates loose pieces across load
  const totalPiecesSum = activeItems
    .filter(item => item.size === 'pcs')
    .reduce((sum, item) => sum + item.quantity, 0);

  // Compute the unique list of sizes across all products, sorted logically by volume size
  const uniqueSizes = Array.from(
    new Set(productList.flatMap(p => p.sizes))
  ).sort((a, b) => {
    const getVolume = (s: string) => {
      const val = parseFloat(s);
      let multiplier = 1;
      if (s.toLowerCase().includes('ml')) {
        multiplier = 1;
      } else if (s.toLowerCase().includes('l')) {
        multiplier = 1000;
      }
      return val * multiplier;
    };
    return getVolume(a) - getVolume(b);
  });

  // Styling helper for custom product markers
  const getProductColors = (product: string) => {
    const colors: Record<string, string> = {
      '7UP': 'bg-emerald-500',
      'Pepsi': 'bg-blue-500',
      'Mirinda': 'bg-orange-500',
      'Limca': 'bg-lime-400',
      'Bindu': 'bg-purple-500',
      'Jeera': 'bg-amber-600',
      'Soda': 'bg-cyan-500',
      'Water': 'bg-sky-400',
    };
    if (colors[product]) return colors[product];

    // Dynamic rotation for newly added custom beverages
    const list = ['bg-rose-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500'];
    const idx = product.charCodeAt(0) % list.length;
    return list[idx];
  };

  return (
    <div className="min-h-screen bg-neutral-955 text-white font-sans flex flex-col w-full overflow-x-hidden pb-20 md:pb-4 select-none">
      
      {/* Sticky Header */}
      <header className="bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-3 py-3 sticky top-0 z-20 shadow-md w-full">
        <div className="max-w-[99%] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Logo & Direct Load Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.08)]">
              <Truck className="w-5.5 h-5.5" />
            </div>
            
            <div className="space-y-0.5">
              <h1 className="text-lg font-black uppercase tracking-tight leading-none">VAN LOAD ORDER</h1>
              <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Fast Crate & Bottle Counter</p>
            </div>

            {/* Premium Selector for Load 1, 2, 3 */}
            <div className="flex bg-neutral-950 border border-neutral-850 p-0.5 rounded-xl ml-0 sm:ml-2">
              {['Load 1', 'Load 2', 'Load 3'].map((type) => {
                const isActive = loadType === type;
                const draftCount = Object.values(quantities[type] || {}).reduce((a, b) => a + b, 0);
                
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setLoadType(type as any);
                      setShowSwapOptions(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 ${
                      isActive 
                        ? 'bg-emerald-500 text-neutral-950 font-extrabold shadow-sm' 
                        : 'text-neutral-550 hover:text-neutral-350'
                    }`}
                  >
                    {type}
                    {draftCount > 0 && (
                      <span className={`text-[9px] px-1 rounded-full font-black ${isActive ? 'bg-neutral-955 text-emerald-400' : 'bg-neutral-900 text-neutral-455'}`}>
                        {draftCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Desktop Totals Display */}
            <div className="hidden md:flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-xl">
              <Package className="w-4.5 h-4.5 text-emerald-400" />
              <div className="text-right">
                <span className="text-neutral-500 text-[8px] font-bold uppercase tracking-wider block">Total Items Loaded</span>
                <span className="text-emerald-400 text-sm font-black tracking-tight leading-none">{totalCrates} Bx / {totalPiecesSum} Loose</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-[99%] w-full mx-auto p-3 flex-1 flex flex-col lg:flex-row gap-4">
        
        {/* TAB 1: PRODUCTS PAGE (Grid Spreadsheet & Mobile Touch Cards) */}
        <div className={`flex-1 space-y-4 ${activeTab === 'products' ? 'block' : 'hidden lg:block'}`}>
          
          {/* Add Product Form with Size Selection */}
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl shadow-lg space-y-3">
            <form onSubmit={handleAddProduct} className="space-y-3">
              <div className="flex flex-col md:flex-row gap-2">
                <input 
                  type="text"
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  placeholder="Add Custom Beverage Name (e.g. Sprite)"
                  className="flex-1 px-4 py-3 bg-neutral-955 rounded-xl border border-neutral-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 outline-none font-bold text-xs tracking-wider uppercase text-white placeholder-neutral-700"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-955 font-black uppercase tracking-widest text-[11px] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {/* Checkbox selector for available sizes */}
              <div className="border-t border-neutral-800/80 pt-2 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Select Available Sizes for this Beverage:</span>
                  <span className="text-neutral-500 text-[9px] uppercase font-bold">Checked boxes appear as horizontal columns</span>
                </div>
                
                {/* Dynamically mapped sizes that persist user-added volumes in browser */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {availableSizes.map(size => {
                    const isChecked = selectedSizes.includes(size);
                    const isPreset = ['250ml', '500ml', '600ml', '750ml', '1L', '2L'].includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSizeSelection(size)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[9px] sm:text-[10px] uppercase tracking-wider border transition-all flex items-center gap-1.5 select-none active:scale-95 group relative ${
                          isChecked 
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' 
                            : 'border-neutral-800 bg-neutral-955 text-neutral-550 hover:border-neutral-700'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500 text-neutral-955' : 'border border-neutral-700'}`}>
                          {isChecked && <Plus className="w-2 h-2 stroke-[4]" />}
                        </div>
                        {size}

                        {/* If size is custom, keep a close removal handle for clean checklist management */}
                        {!isPreset && (
                          <span
                            onClick={(e) => handleRemoveCustomSize(size, e)}
                            className="ml-1 opacity-60 hover:opacity-100 hover:text-red-400 font-bold px-0.5 rounded cursor-pointer text-[8px]"
                            title="Remove this size option permanently"
                          >
                            ×
                          </span>
                        )}
                      </button>
                    );
                  })}
                  
                  {/* Custom size addition input (adds ml/L to master selectable size options) */}
                  <div className="flex items-center bg-neutral-955 border border-neutral-800 rounded-lg px-1.5 py-0.5 gap-1.5 w-full sm:w-auto max-w-[200px]">
                    <input 
                      type="text" 
                      placeholder="Custom (e.g. 300ml)"
                      value={customSizeInput}
                      onChange={e => setCustomSizeInput(e.target.value)}
                      className="px-1.5 py-1 bg-transparent text-[10px] font-bold uppercase text-white placeholder-neutral-700 outline-none w-28"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSize}
                      className="px-2 py-1 bg-neutral-850 hover:bg-neutral-700 text-emerald-400 font-black text-[9px] uppercase rounded active:scale-95 transition-all"
                    >
                      + Size
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Load Beverage Stock matrix grid */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-black uppercase tracking-wider text-neutral-300">Load Beverage Stock</h2>
              
              {/* CLEAR OPTION IN FRONT OF THE HEADING */}
              <button
                type="button"
                onClick={handleClearLoad}
                disabled={activeItems.length === 0}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 flex items-center gap-1 ${
                  activeItems.length === 0
                    ? 'border-neutral-850 text-neutral-700 bg-neutral-955/20 cursor-not-allowed'
                    : 'border-red-500/30 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 text-red-400'
                }`}
                title="Wipe active quantities for this load"
              >
                <Trash2 className="w-3 h-3" /> Clear Load
              </button>
            </div>
            <span className="text-neutral-500 text-[10px] font-semibold uppercase hidden lg:inline">Sizes fit inline to save space</span>
          </div>

          {/* Compact Spreadsheet Matrix (Boxes + Single Pieces Column in front of Total) */}
          <div className="hidden md:block overflow-x-auto rounded-3xl border border-neutral-850 bg-neutral-900 shadow-xl">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-955">
                  {/* Product Header Column */}
                  <th className="p-3 font-black text-[10px] uppercase tracking-wider text-neutral-450 sticky left-0 bg-neutral-955 z-10 w-[145px] border-r border-neutral-800">
                    Product
                  </th>
                  {/* Standard Box columns */}
                  {uniqueSizes.map(size => (
                    <th key={size} className="p-2.5 font-black text-[10px] uppercase tracking-wider text-neutral-450 text-center w-[98px]">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/10 text-emerald-400">
                        {size} Bx
                      </span>
                    </th>
                  ))}
                  {/* SINGLE PIECES COLUMN IN FRONT OF TOTAL */}
                  <th className="p-2.5 font-black text-[10px] uppercase tracking-wider text-neutral-450 text-center w-[98px] border-l border-neutral-800">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-400">
                      Pieces (Pcs)
                    </span>
                  </th>
                  {/* Total representation column */}
                  <th className="p-2.5 font-black text-[10px] uppercase tracking-wider text-neutral-450 text-right w-[110px] border-l border-neutral-800">
                    Row Tally
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {productList.map((product, index) => {
                  const colorClass = getProductColors(product.name);
                  const isDragged = index === draggedIndex;
                  
                  // Row counts
                  let rowCrates = 0;
                  uniqueSizes.map(size => {
                    rowCrates += currentDraft[`${product.name}_${size}`] || 0;
                  });
                  const rowPieces = currentDraft[`${product.name}_pcs`] || 0;

                  return (
                    <tr 
                      key={product.name} 
                      className={`hover:bg-neutral-850/50 transition-colors ${isDragged ? 'opacity-30 bg-emerald-500/5' : ''}`}
                    >
                      {/* Sticky Product Name */}
                      <td className="p-3 font-black text-sm tracking-wide uppercase sticky left-0 bg-neutral-900/98 backdrop-blur-sm z-10 border-r border-neutral-800">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            
                            {/* Drag handle */}
                            <div
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragEnd={handleDragEnd}
                              className="cursor-grab active:cursor-grabbing p-1.5 bg-neutral-955 hover:bg-neutral-800 border border-neutral-850 rounded-lg text-neutral-600 hover:text-emerald-455 transition-all select-none shadow-sm active:scale-95"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>

                            <span className={`inline-block w-1.5 h-5 rounded-full ${colorClass} shrink-0`} />
                            <span className="truncate text-xs font-extrabold text-neutral-250 uppercase">{product.name}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(product.name)}
                            className="text-neutral-700 hover:text-red-400 hover:bg-neutral-800 p-1 rounded transition-all active:scale-90 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Boxes Sizes Options */}
                      {uniqueSizes.map(size => {
                        const hasSize = product.sizes.includes(size);
                        
                        if (!hasSize) {
                          return (
                            <td key={size} className="p-2 text-center w-[98px]">
                              <span className="text-neutral-850 font-bold select-none text-[10px]">—</span>
                            </td>
                          );
                        }

                        const key = `${product.name}_${size}`;
                        const qty = currentDraft[key] || 0;
                        return (
                          <td key={size} className="p-2 text-center w-[98px]">
                            <div className={`inline-flex items-center justify-center p-1 rounded-xl border transition-all ${
                              qty > 0 ? 'bg-neutral-955 border-emerald-500/30' : 'bg-neutral-955/50 border-neutral-850'
                            }`}>
                              <button
                                type="button"
                                onClick={() => updateQuantity(product.name, size, -1)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all active:scale-90 ${
                                  qty > 0 
                                    ? 'bg-neutral-900 border-neutral-750 text-neutral-350 hover:bg-neutral-800' 
                                    : 'bg-neutral-955 border-neutral-900 text-neutral-850 cursor-not-allowed'
                                }`}
                                disabled={qty === 0}
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <span className={`w-6 text-center text-xs font-black tracking-tight ${qty > 0 ? 'text-emerald-400' : 'text-neutral-600'}`}>
                                {qty}
                              </span>

                              <button
                                type="button"
                                onClick={() => updateQuantity(product.name, size, 1)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center border bg-neutral-900 text-white hover:bg-neutral-800 active:scale-90 transition-all border-neutral-750 text-neutral-550`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        );
                      })}

                      {/* SINGLE PIECES ADJUSTER IN FRONT OF TOTAL (PEACES) */}
                      <td className="p-2 text-center w-[98px] border-l border-neutral-800 bg-amber-500/5">
                        <div className={`inline-flex items-center justify-center p-1 rounded-xl border transition-all ${
                          rowPieces > 0 ? 'bg-neutral-955 border-amber-500/30' : 'bg-neutral-955/50 border-neutral-850'
                        }`}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.name, 'pcs', -1)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all active:scale-90 ${
                              rowPieces > 0 
                                ? 'bg-neutral-900 border-neutral-750 text-neutral-350 hover:bg-neutral-800' 
                                : 'bg-neutral-955 border-neutral-900 text-neutral-850 cursor-not-allowed'
                            }`}
                            disabled={rowPieces === 0}
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className={`w-6 text-center text-xs font-black tracking-tight ${rowPieces > 0 ? 'text-amber-400' : 'text-neutral-655'}`}>
                            {rowPieces}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateQuantity(product.name, 'pcs', 1)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border bg-neutral-900 text-white hover:bg-neutral-800 active:scale-90 transition-all border-neutral-750 text-neutral-550`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Row total representation */}
                      <td className="p-2 text-right w-[110px] border-l border-neutral-800 font-extrabold text-[11px] text-neutral-300 pr-3">
                        {rowCrates > 0 || rowPieces > 0 ? (
                          <div className="flex flex-col">
                            {rowCrates > 0 && <span className="text-emerald-450 leading-none">{rowCrates} Bx</span>}
                            {rowPieces > 0 && <span className="text-amber-500 leading-none mt-0.5">{rowPieces} Pcs</span>}
                          </div>
                        ) : (
                          <span className="text-neutral-800">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              
              {/* VERTICAL COLUMN GRAND TOTALS */}
              <tfoot>
                <tr className="bg-neutral-955 font-black border-t border-neutral-800 text-[10px]">
                  <td className="p-3 sticky left-0 bg-neutral-955 z-10 border-r border-neutral-800 uppercase text-neutral-450 font-black">
                    Total Loaded
                  </td>
                  {uniqueSizes.map(size => {
                    const colTotal = productList.reduce((sum, p) => sum + (currentDraft[`${p.name}_${size}`] || 0), 0);
                    return (
                      <td key={size} className="p-2 text-center font-extrabold text-xs text-emerald-400">
                        {colTotal > 0 ? colTotal : '0'}
                      </td>
                    );
                  })}
                  {/* Pieces sum down */}
                  <td className="p-2 text-center font-extrabold text-xs text-amber-500 border-l border-neutral-800 bg-amber-500/5">
                    {productList.reduce((sum, p) => sum + (currentDraft[`${p.name}_pcs`] || 0), 0)}
                  </td>
                  <td className="p-2 text-right border-l border-neutral-800 text-[9px] text-neutral-555 pr-3">
                    Sum (Vertical)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Cards (Splitting Pieces to the end of card) */}
          <div className="space-y-3.5 md:hidden">
            {productList.map((product, index) => {
              const colorClass = getProductColors(product.name);
              const activeProductDraft = product.sizes.some(size => (currentDraft[`${product.name}_${size}`] || 0) > 0) || (currentDraft[`${product.name}_pcs`] || 0) > 0;
              const rowPieces = currentDraft[`${product.name}_pcs`] || 0;

              return (
                <div 
                  key={product.name} 
                  className={`bg-neutral-900 border rounded-3xl p-4 space-y-3 transition-all duration-300 ${
                    activeProductDraft ? 'border-emerald-500/20 shadow-sm' : 'border-neutral-800'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-block w-2 h-5 rounded-full ${colorClass}`} />
                      <span className="font-black text-base tracking-wide uppercase text-neutral-200">{product.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {/* Reorder Up */}
                      <button
                        type="button"
                        onClick={() => moveProduct(index, 'up')}
                        disabled={index === 0}
                        className={`p-1.5 bg-neutral-955 rounded-lg border transition-all active:scale-90 ${
                          index === 0
                            ? 'border-neutral-850 text-neutral-800 cursor-not-allowed'
                            : 'border-neutral-800 text-neutral-450 hover:text-emerald-400 hover:border-emerald-500/20'
                        }`}
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Reorder Down */}
                      <button
                        type="button"
                        onClick={() => moveProduct(index, 'down')}
                        disabled={index === productList.length - 1}
                        className={`p-1.5 bg-neutral-955 rounded-lg border transition-all active:scale-90 ${
                          index === productList.length - 1
                            ? 'border-neutral-850 text-neutral-800 cursor-not-allowed'
                            : 'border-neutral-800 text-neutral-450 hover:text-emerald-400 hover:border-emerald-500/20'
                        }`}
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.name)}
                        className="text-neutral-600 hover:text-red-400 p-1.5 hover:bg-neutral-955 rounded-lg transition-colors active:scale-90 ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Adjusters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                    {product.sizes.map(size => {
                      const key = `${product.name}_${size}`;
                      const qty = currentDraft[key] || 0;
                      
                      return (
                        <div 
                          key={size} 
                          className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                            qty > 0 ? 'bg-neutral-955 border-emerald-500/30' : 'bg-neutral-955/40 border-neutral-850/60'
                          }`}
                        >
                          <span className={`text-[10px] font-black uppercase ${qty > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                            {size} Box
                          </span>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.name, size, -1)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all active:scale-90 ${
                                qty > 0 ? 'bg-neutral-900 border-neutral-700 text-neutral-350' : 'bg-neutral-955 border-neutral-900 text-neutral-800 cursor-not-allowed'
                              }`}
                              disabled={qty === 0}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className={`w-6 text-center text-sm font-black ${qty > 0 ? 'text-emerald-400' : 'text-neutral-655'}`}>{qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.name, size, 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border bg-neutral-900 text-white active:scale-90"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Loose Pieces at the bottom of the card list */}
                    <div className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all bg-amber-500/5 ${
                      rowPieces > 0 ? 'border-amber-500/30' : 'border-neutral-850/60'
                    }`}>
                      <span className={`text-[10px] font-black uppercase ${rowPieces > 0 ? 'text-amber-400' : 'text-neutral-500'}`}>
                        Pieces (Loose Pcs)
                      </span>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.name, 'pcs', -1)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all active:scale-90 ${
                            rowPieces > 0 ? 'bg-neutral-900 border-neutral-700 text-neutral-350' : 'bg-neutral-955 border-neutral-900 text-neutral-800 cursor-not-allowed'
                          }`}
                          disabled={rowPieces === 0}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`w-6 text-center text-sm font-black ${rowPieces > 0 ? 'text-amber-400' : 'text-neutral-655'}`}>{rowPieces}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.name, 'pcs', 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border bg-neutral-900 text-white active:scale-90 border-neutral-750"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TAB 2: ACTIVE LOAD DETAIL PANEL */}
        <div className={`w-full lg:w-[320px] flex flex-col gap-4 lg:sticky lg:top-[74px] lg:h-[calc(100vh-95px)] shrink-0 ${activeTab === 'summary' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
            <h2 className="text-base font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ShoppingCart className="w-4.5 h-4.5" /> Active Load
            </h2>
            <span className="text-neutral-500 text-[10px] font-bold uppercase">{loadType} Summary</span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 flex-1 overflow-y-auto flex flex-col justify-between min-h-[280px]">
            <div>
              {activeItems.length === 0 ? (
                <div className="py-12 text-center text-neutral-600 flex flex-col items-center justify-center">
                  <ShoppingCart className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-wider">Load is empty</p>
                  <p className="text-[10px] text-neutral-700 mt-0.5">Tap + on sizes to add crates</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-neutral-500 uppercase font-black tracking-widest">{loadType} Details</p>
                    
                    {/* DOWNLOAD OPTIONS */}
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleDownloadLoad}
                        className="px-2 py-1 bg-neutral-850 hover:bg-neutral-800 text-neutral-350 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 flex items-center gap-1 border border-neutral-800"
                      >
                        CSV
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPDF}
                        className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500 hover:text-neutral-955 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                      >
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW TABLE WITH BOXES COLUMNS AND SINGLE PIECES COLUMN */}
                  <div className="overflow-x-auto rounded-xl border border-neutral-850 bg-neutral-955 p-1.5 shadow-inner">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-neutral-850/80">
                          <th className="py-2 px-1.5 font-black text-[9px] uppercase tracking-wider text-neutral-500">Item</th>
                          {uniqueSizes.map(size => {
                            const hasActiveSize = activeItems.some(item => item.size === size);
                            if (!hasActiveSize) return null;
                            return (
                              <th key={size} className="py-2 px-1 font-black text-[9px] uppercase tracking-wider text-neutral-500 text-center">{size}</th>
                            );
                          })}
                          {/* Loose Pieces preview column */}
                          {activeItems.some(item => item.size === 'pcs') && (
                            <th className="py-2 px-1 font-black text-[9px] uppercase tracking-wider text-amber-500 text-center bg-amber-500/5">Loose</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900">
                        {productList.map(p => {
                          const productQtys = uniqueSizes.map(size => currentDraft[`${p.name}_${size}`] || 0);
                          const totalProductQty = productQtys.reduce((a, b) => a + b, 0);
                          const piecesQty = currentDraft[`${p.name}_pcs`] || 0;
                          if (totalProductQty === 0 && piecesQty === 0) return null;

                          return (
                            <tr key={p.name} className="hover:bg-neutral-900/40">
                              <td className="py-2 px-1.5 font-black text-neutral-350 uppercase leading-none">{p.name}</td>
                              {uniqueSizes.map(size => {
                                const hasActiveSize = activeItems.some(item => item.size === size);
                                if (!hasActiveSize) return null;
                                const qty = currentDraft[`${p.name}_${size}`] || 0;
                                return (
                                  <td key={size} className="py-2 px-1 text-center font-bold text-neutral-400">
                                    {qty > 0 ? qty : '—'}
                                  </td>
                                );
                              })}
                              {activeItems.some(item => item.size === 'pcs') && (
                                <td className="py-2 px-1 text-center font-black text-amber-500 bg-amber-500/5">
                                  {piecesQty > 0 ? piecesQty : '—'}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                      
                      {/* TABLE FOOTER SHOWING VERTICAL GRAND TOTALS */}
                      <tfoot>
                        <tr className="border-t border-neutral-800/80 font-black text-neutral-200 bg-neutral-900/20">
                          <td className="py-2 px-1.5 uppercase text-[9px] text-neutral-500 font-black">Total</td>
                          {uniqueSizes.map(size => {
                            const hasActiveSize = activeItems.some(item => item.size === size);
                            if (!hasActiveSize) return null;
                            const sizeTotal = productList.reduce((sum, p) => sum + (currentDraft[`${p.name}_${size}`] || 0), 0);
                            return (
                              <td key={size} className="py-2 px-1 text-center font-extrabold text-xs text-emerald-400">
                                {sizeTotal}
                              </td>
                            );
                          })}
                          {activeItems.some(item => item.size === 'pcs') && (
                            <td className="py-2 px-1 text-center font-extrabold text-xs text-amber-500 bg-amber-500/5">
                              {productList.reduce((sum, p) => sum + (currentDraft[`${p.name}_pcs`] || 0), 0)}
                            </td>
                          )}
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* SIZE-WISE ML SEPARATED TOTAL BREAKDOWN */}
                  <div className="bg-neutral-955/40 border border-neutral-850 p-3 rounded-2xl space-y-1.5">
                    <p className="text-[9px] font-black uppercase text-neutral-550 tracking-wider">Size-Wise Summary</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {uniqueSizes.map(size => {
                        const sizeTotal = productList.reduce((sum, p) => sum + (currentDraft[`${p.name}_${size}`] || 0), 0);
                        if (sizeTotal === 0) return null;
                        return (
                          <div key={size} className="flex justify-between items-center bg-neutral-900/60 px-2.5 py-2 rounded-xl border border-neutral-850/40">
                            <span className="text-[9px] font-black text-neutral-450 uppercase">{size}</span>
                            <span className="text-xs font-black text-emerald-400">
                              {sizeTotal} <span className="text-[8px] text-neutral-550 font-bold uppercase ml-0.5">Bx</span>
                            </span>
                          </div>
                        );
                      })}
                      
                      {/* Total Pieces breakdown card */}
                      {totalPiecesSum > 0 && (
                        <div className="flex justify-between items-center bg-amber-500/5 px-2.5 py-2 rounded-xl border border-amber-550/20 col-span-2">
                          <span className="text-[9px] font-black text-amber-400 uppercase">Loose Pieces (Pcs)</span>
                          <span className="text-xs font-black text-amber-400">
                            {totalPiecesSum} <span className="text-[8px] font-bold uppercase ml-0.5">Pcs</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom calculation and actions */}
            <div className="mt-6 border-t border-neutral-800/80 pt-4 space-y-3">
              
              {/* Swap Load / Move Items Option */}
              {activeItems.length > 0 && (
                <div className="border border-neutral-800 bg-neutral-955 p-2 rounded-xl space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setShowSwapOptions(!showSwapOptions)}
                    className="w-full flex items-center justify-between text-[11px] font-black text-neutral-400 hover:text-white uppercase tracking-wider py-0.5 outline-none"
                  >
                    <span className="flex items-center gap-1"><MoveRight className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Transfer items to...</span>
                    <span className="text-[9px] text-emerald-400 font-bold">{showSwapOptions ? 'Hide' : 'Show'}</span>
                  </button>
                  
                  {showSwapOptions && (
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      {['Load 1', 'Load 2', 'Load 3']
                        .filter(type => type !== loadType)
                        .map(targetType => (
                          <button
                            key={targetType}
                            type="button"
                            onClick={() => handleTransferItems(targetType as any)}
                            className="py-1.5 bg-neutral-900 border border-neutral-800 hover:border-emerald-500/30 hover:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95"
                          >
                            {targetType}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Strict Size-Wise Display */}
              <div className="bg-neutral-955 p-3 border border-neutral-850 rounded-xl space-y-1.5">
                <span className="text-neutral-500 text-[9px] font-black uppercase tracking-widest block">Items Sum by Size</span>
                
                {activeItems.length === 0 ? (
                  <span className="text-neutral-700 text-[10px] font-bold uppercase">No items loaded</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {uniqueSizes.map(size => {
                      const sizeTotal = productList.reduce((sum, p) => sum + (currentDraft[`${p.name}_${size}`] || 0), 0);
                      if (sizeTotal === 0) return null;
                      return (
                        <span key={size} className="bg-neutral-900 border border-neutral-805 text-[10px] font-black px-2 py-1 rounded-lg text-emerald-400">
                          {size}: <span className="text-white">{sizeTotal} Bx</span>
                        </span>
                      );
                    })}
                    {totalPiecesSum > 0 && (
                      <span className="bg-amber-500/10 border border-amber-500/25 text-[10px] font-black px-2 py-1 rounded-lg text-amber-400">
                        Pieces: <span className="text-white">{totalPiecesSum} Pcs</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleClearLoad}
                  disabled={activeItems.length === 0}
                  className={`py-3 rounded-xl font-black uppercase tracking-wider text-[10px] border active:scale-95 transition-all ${
                    activeItems.length === 0 
                      ? 'border-neutral-800 text-neutral-700 bg-neutral-950/20 cursor-not-allowed' 
                      : 'border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={activeItems.length === 0}
                  className={`col-span-2 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                    activeItems.length === 0 
                      ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-955 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* MOBILE PREMIUM BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-neutral-900/90 backdrop-blur-lg border-t border-neutral-800/80 px-4 py-2.5 flex items-center justify-around shadow-[0_-5px_25px_rgba(0,0,0,0.5)]">
        
        {/* Products Tab button */}
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all active:scale-90 ${
            activeTab === 'products' ? 'text-emerald-400' : 'text-neutral-550 hover:text-neutral-350'
          }`}
        >
          <Package className="w-5.5 h-5.5" />
          <span className="text-[9px] font-black uppercase tracking-wider">Beverages</span>
        </button>

        {/* Active Load summary Tab button */}
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all active:scale-90 relative ${
            activeTab === 'summary' ? 'text-emerald-450' : 'text-neutral-555 hover:text-neutral-350'
          }`}
        >
          <ShoppingCart className="w-5.5 h-5.5" />
          <span className="text-[9px] font-black uppercase tracking-wider">Active Load</span>
          
          {/* Active total items badge */}
          {(totalCrates > 0 || totalPiecesSum > 0) && (
            <span className="absolute -top-1 right-2.5 bg-emerald-500 text-neutral-955 text-[9px] font-black px-1.5 py-0.2 rounded-full leading-none scale-90">
              {totalCrates + totalPiecesSum}
            </span>
          )}
        </button>

      </nav>

      {/* Hidden Print Container for Mobile & Desktop PDF Exports */}
      {printActive && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body {
                background: white !important;
                color: black !important;
                margin: 0 !important;
                padding: 20px !important;
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
              }
              /* Hide all normal layout containers during printing */
              header, main, nav {
                display: none !important;
              }
              #print-section {
                display: block !important;
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                color: black !important;
              }
              .print-table {
                width: 100% !important;
                border-collapse: collapse !important;
                margin-top: 25px !important;
                margin-bottom: 25px !important;
                font-size: 14px !important;
              }
              .print-table th {
                border: 2.5px solid #000000 !important;
                padding: 12px 8px !important;
                background-color: #f1f5f9 !important; /* Slate 100 */
                color: #000000 !important;
                font-weight: 900 !important;
                text-transform: uppercase !important;
                text-align: center !important;
                font-size: 11px !important;
                letter-spacing: 0.5px !important;
              }
              .print-table th.product-header {
                text-align: left !important;
                width: 25% !important;
              }
              .print-table td {
                border: 2px solid #000000 !important;
                padding: 14px 10px !important;
                color: #000000 !important;
                font-weight: 800 !important; /* Bold letters & numbers */
                text-align: center !important;
                font-size: 13px !important;
              }
              .print-table td.product-cell {
                text-align: left !important;
                font-weight: 900 !important;
                background-color: #f8fafc !important; /* Slate 50 */
                text-transform: uppercase !important;
              }
              .print-table td.loose-cell {
                background-color: #fef3c7 !important; /* Amber 100 */
                color: #000000 !important;
                font-weight: 900 !important;
              }
              .print-table .total-row td {
                border: 3px solid #000000 !important;
                font-weight: 950 !important;
                font-size: 14px !important;
                background-color: #ecfdf5 !important; /* Emerald 50 */
                color: #000000 !important;
                padding: 16px 10px !important;
              }
              .print-table .total-row td.total-label {
                background-color: #d1fae5 !important; /* Emerald 100 */
                font-weight: 950 !important;
              }
              .print-table .total-row td.total-loose-cell {
                background-color: #fde68a !important; /* Amber 200 */
                border: 3px solid #000000 !important;
                font-weight: 950 !important;
              }
              .print-header h1 {
                font-weight: 900 !important;
                letter-spacing: -0.5px !important;
              }
              .print-header p {
                font-weight: 700 !important;
              }
              .load-highlight {
                font-weight: 900 !important;
                color: #047857 !important; /* Emerald 700 */
                border-bottom: 2px solid #047857 !important;
                padding-bottom: 2px !important;
              }
              .print-date {
                font-weight: 700 !important;
                color: #1e293b !important;
              }
            }
          `}} />
          <div id="print-section" className="hidden print:block bg-white text-black p-8 w-full font-sans absolute left-0 top-0 z-50">
            <div className="flex justify-between items-center border-b-4 border-emerald-500 pb-4 mb-6 print-header">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">VAN LOAD ORDER SHEET</h1>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Fast Crate & Bottle Loading Report</p>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Selected Load</div>
                <div className="text-emerald-600 font-black text-base uppercase leading-none load-highlight">{loadType}</div>
                <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1.5">Generated Date</div>
                <div className="text-xs font-bold text-neutral-800 print-date">{new Date().toLocaleString()}</div>
              </div>
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th className="product-header">Product</th>
                  {uniqueSizes.map(size => (
                    <th key={size}>{size} Box</th>
                  ))}
                  <th>Loose (Pcs)</th>
                </tr>
              </thead>
              <tbody>
                {productList.filter(p => {
                  const hasCrates = uniqueSizes.some(size => (currentDraft[`${p.name}_${size}`] || 0) > 0);
                  const hasLoose = (currentDraft[`${p.name}_pcs`] || 0) > 0;
                  return hasCrates || hasLoose;
                }).map(p => {
                  const pieces = currentDraft[`${p.name}_pcs`] || 0;
                  return (
                    <tr key={p.name}>
                      <td className="product-cell">{p.name}</td>
                      {uniqueSizes.map(size => {
                        const qty = currentDraft[`${p.name}_${size}`] || 0;
                        return (
                          <td key={size}>
                            {qty > 0 ? qty : '—'}
                          </td>
                        );
                      })}
                      <td className="loose-cell">
                        {pieces > 0 ? pieces : '—'}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Grand totals row */}
                <tr className="total-row">
                  <td className="total-label">TOTAL LOAD</td>
                  {uniqueSizes.map(size => {
                    let sizeTotal = productList.reduce((sum, p) => sum + (currentDraft[`${p.name}_${size}`] || 0), 0);
                    return (
                      <td key={size}>
                        {sizeTotal} Bx
                      </td>
                    );
                  })}
                  <td className="total-loose-cell">
                    {totalPiecesSum} Pcs
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-12 border-t border-neutral-200 pt-4 text-center text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
              Factory Dispatch Operations • Generated Natively via Van Load Order App
            </div>
          </div>
        </>
      )}

    </div>
  );
}
