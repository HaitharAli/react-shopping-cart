import { useCallback, useMemo, useRef } from 'react';

import { useProductsContext } from './ProductsContextProvider';
import { IProduct } from 'models';
import { getProducts } from 'services/products';

const useProducts = () => {
  const {
    isFetching,
    setIsFetching,
    products,
    setProducts,
    filters,
    setFilters,
  } = useProductsContext();

  // Cache for all products to avoid repeated API calls
  const allProductsCache = useRef<IProduct[]>([]);
  const isInitialized = useRef(false);

  const fetchProducts = useCallback(() => {
    setIsFetching(true);
    getProducts().then((products: IProduct[]) => {
      setIsFetching(false);
      allProductsCache.current = products; // Cache the products
      setProducts(products);
      isInitialized.current = true;
    });
  }, [setIsFetching, setProducts]);

  // Memoized filtering function with O(n) complexity
  const filterProducts = useCallback((newFilters: string[]) => {
    setIsFetching(true);

    // Use cached products if available, otherwise fetch
    const productsToFilter = allProductsCache.current.length > 0 
      ? Promise.resolve(allProductsCache.current)
      : getProducts().then((products: IProduct[]) => {
          allProductsCache.current = products;
          return products;
        });

    productsToFilter.then((products: IProduct[]) => {
      setIsFetching(false);
      
      let filteredProducts: IProduct[];

      if (newFilters && newFilters.length > 0) {
        // Optimized filtering: O(n) instead of O(n²)
        const filterSet = new Set(newFilters);
        filteredProducts = products.filter((product: IProduct) =>
          product.availableSizes.some((size: string) => filterSet.has(size))
        );
      } else {
        filteredProducts = products;
      }

      setFilters(newFilters);
      setProducts(filteredProducts);
    });
  }, [setIsFetching, setFilters, setProducts]);

  // Memoized filtered products to prevent unnecessary recalculations
  const filteredProducts = useMemo(() => {
    if (!filters || filters.length === 0) {
      return products;
    }

    const filterSet = new Set(filters);
    return products.filter((product: IProduct) =>
      product.availableSizes.some((size: string) => filterSet.has(size))
    );
  }, [products, filters]);

  // Memoized product count
  const productCount = useMemo(() => filteredProducts.length, [filteredProducts]);

  return {
    isFetching,
    fetchProducts,
    products: filteredProducts, // Return filtered products instead of raw products
    filterProducts,
    filters,
    productCount,
    isInitialized: isInitialized.current,
  };
};

export default useProducts;
