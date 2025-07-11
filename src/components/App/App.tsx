import { useEffect } from 'react';

import Loader from 'components/Loader';
import ErrorDisplay from 'components/ErrorDisplay';
import { GithubCorner, GithubStarButton } from 'components/Github';
import Recruiter from 'components/Recruiter';
import Filter from 'components/Filter';
import Products from 'components/Products';
import Cart from 'components/Cart';

import { useProducts } from 'contexts/products-context';

import * as S from './style';

function App() {
  const { 
    isFetching, 
    isLoading,
    products, 
    fetchProducts, 
    productCount,
    error,
    retryFetch,
    clearError,
    hasProducts
  } = useProducts();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <S.Container>
      {isLoading && <Loader />}
      
      {/* Error Display */}
      <ErrorDisplay 
        error={error}
        onRetry={retryFetch}
        onClear={clearError}
      />
      
      <GithubCorner />
      <Recruiter />
      <S.TwoColumnGrid>
        <S.Side>
          <Filter />
          <GithubStarButton />
        </S.Side>
        <S.Main>
          <S.MainHeader>
            <p>{productCount} Product(s) found</p>
          </S.MainHeader>
          {hasProducts && <Products products={products} />}
        </S.Main>
      </S.TwoColumnGrid>
      <Cart />
    </S.Container>
  );
}

export default App;
