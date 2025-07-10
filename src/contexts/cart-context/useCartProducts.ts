import { useCartContext } from './CartContextProvider';
import useCartTotal from './useCartTotal';
import { ICartProduct } from 'models';

const useCartProducts = () => {
  const { products, setProducts } = useCartContext();
  const { updateCartTotal } = useCartTotal();

  const updateQuantitySafely = (
    currentProduct: ICartProduct,
    targetProduct: ICartProduct,
    quantity: number
  ): ICartProduct => {
    if (currentProduct.id === targetProduct.id) {
      // Fixed: Removed unnecessary Object.assign, using proper immutable update
      return {
        ...currentProduct,
        quantity: currentProduct.quantity + quantity,
      };
    }
    return currentProduct;
  };

  const addProduct = (newProduct: ICartProduct) => {
    // Performance optimization: Use findIndex instead of some + map
    const existingProductIndex = products.findIndex(
      (product: ICartProduct) => newProduct.id === product.id
    );

    let updatedProducts: ICartProduct[];

    if (existingProductIndex !== -1) {
      // Update existing product quantity
      updatedProducts = products.map((product: ICartProduct, index: number) => {
        if (index === existingProductIndex) {
          return {
            ...product,
            quantity: product.quantity + newProduct.quantity,
          };
        }
        return product;
      });
    } else {
      // Add new product
      updatedProducts = [...products, newProduct];
    }

    setProducts(updatedProducts);
    updateCartTotal(updatedProducts);
  };

  const removeProduct = (productToRemove: ICartProduct) => {
    const updatedProducts = products.filter(
      (product: ICartProduct) => product.id !== productToRemove.id
    );

    setProducts(updatedProducts);
    updateCartTotal(updatedProducts);
  };

  const increaseProductQuantity = (productToIncrease: ICartProduct) => {
    const updatedProducts = products.map((product: ICartProduct) => {
      return updateQuantitySafely(product, productToIncrease, 1);
    });

    setProducts(updatedProducts);
    updateCartTotal(updatedProducts);
  };

  const decreaseProductQuantity = (productToDecrease: ICartProduct) => {
    const updatedProducts = products.map((product: ICartProduct) => {
      return updateQuantitySafely(product, productToDecrease, -1);
    });

    setProducts(updatedProducts);
    updateCartTotal(updatedProducts);
  };

  return {
    products,
    addProduct,
    removeProduct,
    increaseProductQuantity,
    decreaseProductQuantity,
  };
};

export default useCartProducts;
