export interface CartItem {
  categorySlug: string;
  categoryName: string;
  serviceName: string;
  description: string;
  tags: string[];
  quantity: number;
}

const CART_KEY = "oveersea_cart";

export const getCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addToCart = (item: CartItem) => {
  const cart = getCart();
  const existing = cart.findIndex(
    (c) => c.categorySlug === item.categorySlug && c.serviceName === item.serviceName
  );
  if (existing >= 0) {
    cart[existing].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
};

export const removeFromCart = (index: number) => {
  const cart = getCart();
  cart.splice(index, 1);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
};

export const updateQuantity = (index: number, quantity: number) => {
  const cart = getCart();
  if (cart[index]) {
    cart[index].quantity = Math.max(1, quantity);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
  }
};

export const clearCart = () => {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cart-updated"));
};

export const getCartCount = (): number => {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
};
