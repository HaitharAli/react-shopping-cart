import { useCartContext } from './CartContextProvider';
import { ICartProduct } from 'models';

const useCartTotal = () => {
  const { total, setTotal } = useCartContext();

  const updateCartTotal = (products: ICartProduct[]) => {
    // Fixed: Use proper immutable reduce patterns without mutating accumulator
    const productQuantity = products.reduce(
      (sum: number, product: ICartProduct) => sum + product.quantity,
      0
    );

    const totalPrice = products.reduce(
      (sum: number, product: ICartProduct) => sum + (product.price * product.quantity),
      0
    );

    const installments = products.reduce(
      (greater: number, product: ICartProduct) => 
        product.installments > greater ? product.installments : greater,
      0
    );

    const total = {
      productQuantity,
      installments,
      totalPrice,
      currencyId: 'USD',
      currencyFormat: '$',
    };

    setTotal(total);
  };

  return {
    total,
    updateCartTotal,
  };
};

export default useCartTotal;
