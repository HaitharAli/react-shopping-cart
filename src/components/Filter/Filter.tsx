import React, { useCallback, useMemo } from 'react';
import { useProducts } from 'contexts/products-context';

import * as S from './style';

export const availableSizes = ['XS', 'S', 'M', 'ML', 'L', 'XL', 'XXL'];

const Filter = React.memo(() => {
  const { filters, filterProducts } = useProducts();

  // Memoized selected checkboxes to prevent recreating Set on every render
  const selectedCheckboxes = useMemo(() => new Set(filters), [filters]);

  // Memoized toggle function to prevent unnecessary re-renders of child components
  const toggleCheckbox = useCallback((label: string) => {
    const newFilters = selectedCheckboxes.has(label)
      ? filters.filter(filter => filter !== label)
      : [...filters, label];
    
    filterProducts(newFilters);
  }, [selectedCheckboxes, filters, filterProducts]);

  // Memoized checkbox creation to prevent recreating components on every render
  const createCheckbox = useCallback((label: string) => (
    <S.Checkbox 
      label={label} 
      handleOnChange={toggleCheckbox} 
      key={label}
    />
  ), [toggleCheckbox]);

  // Memoized checkboxes array
  const checkboxes = useMemo(() => 
    availableSizes.map(createCheckbox), 
    [createCheckbox]
  );

  return (
    <S.Container>
      <S.Title>Sizes:</S.Title>
      {checkboxes}
    </S.Container>
  );
});

Filter.displayName = 'Filter';

export default Filter;
