export type UserRole = "USER" | "SELLER" | "ADMIN";
export type ListingMode = "FIXED" | "AUCTION";
export type ListingStatus = "ACTIVE" | "SOLD" | "CANCELLED";
export type AuctionStatus = "ACTIVE" | "FINISHED" | "CANCELLED";
export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type NotificationType =
  | "BID_OUTBID"
  | "AUCTION_WON"
  | "SALE_CONFIRMED"
  | "NEW_BID";

export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  reputation: number;
  isVerifiedSeller: boolean;
  role: UserRole;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Image {
  id: number;
  url: string;
  sortOrder: number;
  listingId: number;
}

export interface AuctionSummary {
  id: number;
  currentPrice: number;
  endsAt: string;
  status: AuctionStatus;
}

export interface Auction {
  id: number;
  startingPrice: number;
  currentPrice: number;
  startedAt: string;
  endsAt: string;
  status: AuctionStatus;
  winner: User | null;
  listing?: Listing;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  mode: ListingMode;
  fixedPrice: number | null;
  condition: string;
  status: ListingStatus;
  createdAt: string;
  seller: User;
  category: Category;
  imageUrls: string[];
  auction: AuctionSummary | null;
}

export interface Bid {
  id: number;
  amount: number;
  placedAt: string;
  bidder: User;
}

export interface Order {
  id: number;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  paymentDeadline: string | null;
  itemTitle: string | null;
  listing: Listing | null;
  buyer: User;
  seller: User;
}

// --- Live streaming ---
export type LiveStatus = "LIVE" | "ENDED";
export type FlashAuctionStatus = "ACTIVE" | "SOLD" | "DESERTED";

export interface LiveSummary {
  id: number;
  title: string;
  status: LiveStatus;
  coverImageUrl: string | null;
  sellerName: string | null;
  sellerId: number | null;
  startedAt: string;
}

export interface FlashAuction {
  id: number;
  liveStreamId: number;
  title: string;
  basePrice: number;
  bidIncrement: number;
  currentPrice: number | null;
  status: FlashAuctionStatus;
  winnerName: string | null;
  totalBids: number;
  startedAt: string;
}

export interface LiveDetail {
  id: number;
  title: string;
  status: LiveStatus;
  roomName: string;
  coverImageUrl: string | null;
  startedAt: string;
  endedAt: string | null;
  seller: User | null;
  activeAuction: FlashAuction | null;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  author: User;
}

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// Auth DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Request DTOs
export interface UpdateUserRequest {
  name?: string;
  avatarUrl?: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  mode: ListingMode;
  fixedPrice?: number;
  condition: string;
  categoryId: number;
  tags?: string[];
}

export interface CreateAuctionRequest {
  listingId: number;
  startingPrice: number;
  endsAt: string;
}

export interface PlaceBidRequest {
  auctionId: number;
  amount: number;
}

export interface CreateOrderRequest {
  listingId: number;
}

export interface CreateReviewRequest {
  orderId: number;
  rating: number;
  comment?: string;
}

export interface PaymentPreferenceRequest {
  orderId: number;
}

export interface PaymentPreferenceResponse {
  initPoint: string;
  preferenceId: string;
}

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string;
}
