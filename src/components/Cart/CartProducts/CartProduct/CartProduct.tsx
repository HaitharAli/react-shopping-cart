import formatPrice from 'utils/formatPrice';
import { 
  sanitizeProductTitle, 
  validateImageSource,
  validateCartProduct 
} from 'utils/security';
import { ICartProduct } from 'models';

import { useCart } from 'contexts/cart-context';

import * as S from './style';

interface IProps {
  product: ICartProduct;
}

const CartProduct = ({ product }: IProps) => {
  const { removeProduct, increaseProductQuantity, decreaseProductQuantity } = useCart();
  
  // Security: Validate and sanitize cart product data
  const validation = validateCartProduct(product);
  if (!validation.isValid) {
    console.error('Invalid cart product data detected:', validation.errors);
    return (
      <S.Container>
        <S.Title>Invalid Product</S.Title>
        <S.Desc>Product data is corrupted</S.Desc>
        <S.Price>
          <p>Price unavailable</p>
        </S.Price>
      </S.Container>
    );
  }
  
  const sanitizedProduct = validation.sanitizedProduct;
  const {
    sku,
    title,
    price,
    style,
    currencyId,
    currencyFormat,
    availableSizes,
    quantity,
  } = sanitizedProduct;

  // Security: Sanitize title and style for display
  const safeTitle = sanitizeProductTitle(title);
  const safeStyle = sanitizeProductTitle(style);
  
  // Security: Validate and sanitize available sizes
  const safeSizes = availableSizes.length > 0 ? availableSizes[0] : 'Unknown';
  
  // Security: Validate image source
  const imageSrc = validateImageSource(`static/products/${sku}-1-cart.webp`);
  const imageAlt = safeTitle;

  const handleRemoveProduct = () => removeProduct(sanitizedProduct);
  const handleIncreaseProductQuantity = () => increaseProductQuantity(sanitizedProduct);
  const handleDecreaseProductQuantity = () => decreaseProductQuantity(sanitizedProduct);

  return (
    <S.Container>
      <S.DeleteButton
        onClick={handleRemoveProduct}
        title="remove product from cart"
        aria-label={`Remove ${safeTitle} from cart`}
      />
      
      {/* Security: Use validated image source */}
      <S.Image
        src={imageSrc || 'static/products/placeholder-cart.webp'}
        alt={imageAlt}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'static/products/placeholder-cart.webp';
          target.alt = 'Product image unavailable';
        }}
      />
      
      <S.Details>
        {/* Security: Use sanitized title - React automatically escapes content */}
        <S.Title>{safeTitle}</S.Title>
        <S.Desc>
          {`${safeSizes} | ${safeStyle}`} <br />
          Quantity: {quantity}
        </S.Desc>
      </S.Details>
      
      <S.Price>
        <p>{`${currencyFormat}  ${formatPrice(price, currencyId)}`}</p>
        <div>
          <S.ChangeQuantity
            onClick={handleDecreaseProductQuantity}
            disabled={quantity === 1}
            aria-label={`Decrease quantity of ${safeTitle}`}
          >
            -
          </S.ChangeQuantity>
          <S.ChangeQuantity 
            onClick={handleIncreaseProductQuantity}
            aria-label={`Increase quantity of ${safeTitle}`}
          >
            +
          </S.ChangeQuantity>
        </div>
      </S.Price>
    </S.Container>
  );
};

export default CartProduct;
