export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidBidAmount(amount: number, currentPrice: number): boolean {
  return amount > currentPrice;
}

export function isValidPrice(price: number): boolean {
  return price > 0;
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}
